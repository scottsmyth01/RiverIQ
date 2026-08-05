const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '');

async function request(endpoint, options = {}) {
  const headers = { ...options.headers };

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    credentials: 'include',
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.code = data.code;
    error.details = data.details;
    throw error;
  }
  return data;
}

function formatGameType(gameType) {
  if (!gameType) return 'Unknown';

  const normalizedGameType = String(gameType).trim();

  if (/^NLH$/i.test(normalizedGameType)) {
    return 'NL Holdem';
  }

  if (/hold'?em no limit/i.test(normalizedGameType)) {
    return 'NL Holdem';
  }

  return normalizedGameType;
}

function getCurrencySymbol(currency) {
  const symbols = {
    USD: '$',
    CAD: 'C$',
    GBP: '£',
    JPY: '¥',
    CNY: 'CN¥',
    USDT: '₮',
  };

  return symbols[currency] || currency || '';
}

function formatBlindAmount(amount) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) return null;
  if (numericAmount < 1) return numericAmount.toFixed(2);
  if (Number.isInteger(numericAmount)) return String(numericAmount);

  return numericAmount.toFixed(2).replace(/0$/, '');
}

function getStakesCurrencySymbol(stakes, currency) {
  const stakesText = String(stakes);

  if (stakesText.includes('C$')) return 'C$';
  if (stakesText.includes('$')) return '$';
  if (stakesText.includes('£')) return '£';
  if (stakesText.includes('CN¥')) return 'CN¥';
  if (stakesText.includes('¥')) return '¥';

  return getCurrencySymbol(currency) || getCurrencySymbol(stakesText.match(/[A-Z]{3}/)?.[0]);
}

function normalizeStakes(stakes, currency) {
  if (!stakes) return undefined;

  const amounts = String(stakes).match(/\d+(?:\.\d+)?/g);

  if (!amounts || amounts.length < 2) {
    return stakes;
  }

  const smallBlind = formatBlindAmount(amounts[0]);
  const bigBlind = formatBlindAmount(amounts[1]);
  const ante = formatBlindAmount(amounts[2]);

  if (!smallBlind || !bigBlind) {
    return stakes;
  }

  const currencySymbol = getStakesCurrencySymbol(stakes, currency);
  const normalizedStakes = `${currencySymbol}${smallBlind}/${currencySymbol}${bigBlind}`;

  return ante ? `${normalizedStakes} (${currencySymbol}${ante})` : normalizedStakes;
}

function normalizeSession(session = {}) {
  const stats = session.stats || {};
  const profit = Number(session.profit ?? stats.profit ?? 0);
  const allInEV = Number(session.allInEV ?? stats.allInEV ?? profit);
  const allInWinSampleSize = Number(session.allInWinSampleSize ?? stats.allInWinSampleSize ?? 0);
  const allInWinPercentage =
    allInWinSampleSize > 0 ? Number(session.allInWinPercentage ?? stats.allInWinPercentage) : null;
  const hands = Number(session.hands ?? session.handsPlayed ?? stats.handsPlayed ?? 0);
  const bb100 = Number(session.bb100 ?? stats.bb100 ?? session.winRate ?? 0);
  const duration = session.duration ?? stats.duration;
  const tableSize = session.tableSize ?? stats.tableSize ?? session.maxPlayers ?? session.numPlayers;
  const gameType = formatGameType(session.gameType || session.game || session.pokerSite);
  const handResults = Array.isArray(session.handResults)
    ? session.handResults.map((point, index) => ({
        handNumber: point.handNumber ? String(point.handNumber) : undefined,
        date: point.date,
        profit: Number(point.profit ?? 0),
        cumulativeProfit: Number(point.cumulativeProfit ?? 0),
        handIndex: index + 1,
      }))
    : [];

  return {
    ...session,
    game: gameType,
    gameType,
    stakes: normalizeStakes(session.stakes, session.currency),
    hands,
    profit,
    allInEV,
    allInWinPercentage,
    allInWinSampleSize,
    bb100,
    handResults,
    winRate: Number(session.winRate ?? bb100),
    duration: duration === null || duration === undefined || duration === '' ? null : Number(duration),
    tableSize: tableSize === null || tableSize === undefined || tableSize === '' ? null : tableSize,
    numTables: Number(session.numTables ?? session.tableCount ?? 1),
  };
}

export async function getSessions(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.period && params.period !== 'all-time') {
    searchParams.set('period', params.period);
  }

  const queryString = searchParams.toString();
  const data = await request(`/api/sessions${queryString ? `?${queryString}` : ''}`);
  return (data.sessions || []).map(normalizeSession);
}

export async function addSession(sessionData) {
  const data = await request('/api/sessions/add-session', {
    method: 'POST',
    body: sessionData,
  });
  const sessions = (data.sessions || (data.session ? [data.session] : [])).map(normalizeSession);

  return {
    session: sessions[0],
    sessions,
    createdSessions: data.createdSessions || sessions.length,
    user: data.user,
  };
}

export async function updateSession({ id, sessionData }) {
  const data = await request(`/api/sessions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(sessionData),
  });
  return normalizeSession(data.session);
}

export async function deleteSession(id) {
  const data = await request(`/api/sessions/${id}`, {
    method: 'DELETE',
  });
  return {
    id,
    user: data.user,
  };
}
