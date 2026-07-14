export const REGEX = {
  handStart: /(?=^PokerStars Hand #)/m,
  handNumber: /PokerStars Hand #(\d+)/,
  tableHeader: /PokerStars Hand #\d+: (.+?) \(\$([\d.]+)\/\$([\d.]+) ([A-Z]+)\)/,
  table: /Table '.+?' (\d+)-max/,
  players: /^Seat (\d+): (.+?) \(\$?([\d.]+) in chips\)$/gm,
  hero: /^Dealt to (.+?) \[([^\]]+)\]$/,
  buttonSeat: /Seat #(\d+) is the button/,
  preflop: /\*\*\* HOLE CARDS \*\*\*\n([\s\S]*?)(?=\*\*\* FLOP \*\*\*|\*\*\* SUMMARY \*\*\*|\*\*\* SHOW DOWN \*\*\*)/,
};
