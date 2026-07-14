export const REGEX = {
  handStart: /(?=^GGPoker Hand #)/m,
  handNumber: /GGPoker Hand #([A-Z0-9]+)/,
  tableHeader: /GGPoker Hand #[A-Z0-9]+: (.+?) \(\$([\d.]+)\/\$([\d.]+) ([A-Z]+)\)/,
  table: /Table '.+?' (\d+)-max/,
  players: /^Seat (\d+): (.+?) \(\$?([\d.]+) in chips\)$/gm,
  hero: /^Dealt to (.+?) \[([^\]]+)\]$/,
  buttonSeat: /Seat #(\d+) is the button/,
  preflop: /\*\*\* HOLE CARDS \*\*\*\n([\s\S]*?)(?=\*\*\* FLOP \*\*\*|\*\*\* SUMMARY \*\*\*|\*\*\* SHOW DOWN \*\*\*)/,
};
