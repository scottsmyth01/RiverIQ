export function parseShowdownActions(lines) {
  const actions = [];

  for (const line of lines) {
    let match;

    // Hero: shows [Ah Qh] (One Pair, Queens)
    match = line.match(/^(.+?): shows \[([^\]]+)\] \((.+)\)$/);

    if (match) {
      actions.push({
        player: match[1],
        action: 'shows',
        cards: match[2].split(' '),
        hand: match[3],
      });
      continue;
    }

    // NitMode: mucks hand
    match = line.match(/^(.+?): mucks hand$/);

    if (match) {
      actions.push({
        player: match[1],
        action: 'mucks',
      });
      continue;
    }

    // Hero collected $3.65 from pot
    match = line.match(/^(.+?) collected \$([\d.]+) from pot$/);

    if (match) {
      actions.push({
        player: match[1],
        action: 'collects',
        amount: parseFloat(match[2]),
      });
      continue;
    }

    // Hero: doesn't show hand
    match = line.match(/^(.+?): doesn't show hand$/);

    if (match) {
      actions.push({
        player: match[1],
        action: 'doesntShow',
      });
      continue;
    }
  }

  return actions;
}
