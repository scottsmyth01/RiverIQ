export const allPositions = ['Overall', 'UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
export const positionsByTableSize = {
  '6max': ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  '7max': ['UTG', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  '8max': ['UTG', 'UTG+1', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  '9max': ['UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
};

export const tableSizes = Object.keys(positionsByTableSize);
