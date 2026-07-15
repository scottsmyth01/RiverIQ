export function parseSummarySeat(line) {
  let match;

  // ==========================================
  // Hero showed [Ah As] and won ($2.35) with ...
  // Hero (button) showed [Ah As] and won ($2.35) with ...
  // ==========================================

  match = line.match(/^Seat (\d+): (.+?)(?: \((.*?)\))? showed \[([^\]]+)\] and won \(\$([\d.]+)\) with (.+)$/);

  if (match) {
    return {
      seat: Number(match[1]),
      player: match[2],
      position: match[3] || null,
      cards: match[4].split(' '),
      result: 'won',
      amount: parseFloat(match[5]),
      madeHand: match[6],
    };
  }

  // ==========================================
  // Hero showed [Ah As] and collected ($2.35)
  // Hero (button) showed [Ah As] and collected ($2.35)
  // ==========================================

  match = line.match(/^Seat (\d+): (.+?)(?: \((.*?)\))? showed \[([^\]]+)\] and collected \(\$([\d.]+)\)$/);

  if (match) {
    return {
      seat: Number(match[1]),
      player: match[2],
      position: match[3] || null,
      cards: match[4].split(' '),
      result: 'collected',
      amount: parseFloat(match[5]),
    };
  }

  // ==========================================
  // Hero showed [Ah As] and lost with ...
  // ==========================================

  match = line.match(/^Seat (\d+): (.+?)(?: \((.*?)\))? showed \[([^\]]+)\] and lost with (.+)$/);

  if (match) {
    return {
      seat: Number(match[1]),
      player: match[2],
      position: match[3] || null,
      cards: match[4].split(' '),
      result: 'lost',
      madeHand: match[5],
    };
  }

  // ==========================================
  // Hero mucked [Ah As]
  // ==========================================

  match = line.match(/^Seat (\d+): (.+?)(?: \((.*?)\))? mucked \[([^\]]+)\]$/);

  if (match) {
    return {
      seat: Number(match[1]),
      player: match[2],
      position: match[3] || null,
      cards: match[4].split(' '),
      result: 'mucked',
    };
  }

  // ==========================================
  // folded before Flop
  // folded before Flop (didn't bet)
  // ==========================================

  match = line.match(/^Seat (\d+): (.+?)(?: \((.*?)\))? folded before Flop/);

  if (match) {
    return {
      seat: Number(match[1]),
      player: match[2],
      position: match[3] || null,
      result: 'foldedPreflop',
    };
  }

  // ==========================================
  // folded on the Flop / Turn / River
  // ==========================================

  match = line.match(/^Seat (\d+): (.+?)(?: \((.*?)\))? folded on the (Flop|Turn|River)/);

  if (match) {
    return {
      seat: Number(match[1]),
      player: match[2],
      position: match[3] || null,
      result: 'folded',
      street: match[4].toLowerCase(),
    };
  }

  // ==========================================
  // collected without showdown
  // Seat 3: Hero collected ($1.45)
  // ==========================================

  match = line.match(/^Seat (\d+): (.+?)(?: \((.*?)\))? collected \(\$([\d.]+)\)$/);

  if (match) {
    return {
      seat: Number(match[1]),
      player: match[2],
      position: match[3] || null,
      result: 'collected',
      amount: parseFloat(match[4]),
    };
  }

  // ==========================================
  // Unknown summary line
  // ==========================================

  return {
    raw: line,
  };
}
