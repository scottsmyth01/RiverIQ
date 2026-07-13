export function addPositions(hands) {
  const positionNames = ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'];

  for (const hand of hands) {
    const sortedPlayers = [...hand.players].sort((a, b) => a.seat - b.seat);

    const buttonIndex = sortedPlayers.findIndex((player) => player.seat === hand.buttonSeat);

    if (buttonIndex === -1) continue;

    const orderedPlayers = [...sortedPlayers.slice(buttonIndex), ...sortedPlayers.slice(0, buttonIndex)];

    for (let i = 0; i < orderedPlayers.length; i++) {
      orderedPlayers[i].position = positionNames[i];
    }

    hand.players = orderedPlayers;

    const hero = hand.players.find((player) => player.name === hand.hero.name);

    if (hero) {
      hand.position = hero.position;
    }
  }

  return hands;
}
