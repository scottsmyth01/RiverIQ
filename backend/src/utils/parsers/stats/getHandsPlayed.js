export function getHandsPlayed(hands) {
  if (!Array.isArray(hands)) {
    return 0;
  }
  return hands.length;
}
