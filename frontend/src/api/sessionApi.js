const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

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
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
}

function normalizeSession(session = {}) {
  const stats = session.stats || {};
  const profit = Number(session.profit ?? stats.profit ?? 0);
  const hands = Number(session.hands ?? session.handsPlayed ?? stats.handsPlayed ?? 0);
  const bb100 = Number(session.bb100 ?? stats.bb100 ?? session.winRate ?? 0);
  const duration = session.duration ?? stats.duration;
  const tableSize = session.tableSize ?? stats.tableSize ?? session.maxPlayers ?? session.numPlayers;

  return {
    ...session,
    game: session.game || session.gameType || session.pokerSite || 'Unknown',
    hands,
    profit,
    bb100,
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
  const data = await request('/api/sessions/addSession', {
    method: 'POST',
    body: sessionData,
  });
  return normalizeSession(data.session);
}

export async function updateSession({ id, sessionData }) {
  const data = await request(`/api/sessions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(sessionData),
  });
  return normalizeSession(data.session);
}

export async function deleteSession(id) {
  await request(`/api/sessions/${id}`, {
    method: 'DELETE',
  });
  return id;
}
