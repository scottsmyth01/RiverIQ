export function parseBigBlind(stakes) {
  if (!stakes) return null;

  const amounts = String(stakes)
    .match(/\d+(?:\.\d+)?/g)
    ?.map(Number)
    .filter((amount) => Number.isFinite(amount));

  return amounts?.length ? amounts.at(-1) : null;
}

export function getSessionBigBlind(session = {}) {
  const tableBigBlind = Number(session.table?.bigBlind || session.bigBlind);

  if (tableBigBlind > 0) {
    return tableBigBlind;
  }

  return parseBigBlind(session.stakes);
}
