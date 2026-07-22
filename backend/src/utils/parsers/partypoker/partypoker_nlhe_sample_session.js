// AI-generated fixture based on public partypoker hand-history format references.
// Use this for parser scaffolding only; validate against real MyGame exports before enabling production confidence.
export const partyPokerHands = `Game #777000001 starts.
***** Hand History for Game 777000001 *****
$0.05/$0.10 NL Texas Hold'em - Wednesday, July 22, 2026 19:00:12 ET
Table RiverIQ Party Sample 6 Max (Real Money)
Seat 3 is the button
Total number of players : 6
Seat 1: Hero ( $10.00 USD )
Seat 2: CutoffCat ( $12.40 USD )
Seat 3: ButtonAce ( $9.65 USD )
Seat 4: SmallBlindSam ( $10.20 USD )
Seat 5: BigBlindBea ( $11.10 USD )
Seat 6: UnderGunUma ( $8.75 USD )
SmallBlindSam posts small blind [$0.05 USD].
BigBlindBea posts big blind [$0.10 USD].
** Dealing down cards **
Dealt to Hero [ Ah, Qh ]
UnderGunUma folds.
Hero raises [$0.30 USD].
CutoffCat folds.
ButtonAce folds.
SmallBlindSam folds.
BigBlindBea folds.
Hero wins $0.15 USD from the main pot.
** Summary **
Total pot $0.15 | Rake $0.00
Seat 1: Hero collected [ $0.15 ]
Seat 2: CutoffCat folded before Flop
Seat 3: ButtonAce folded before Flop
Seat 4: SmallBlindSam folded before Flop
Seat 5: BigBlindBea folded before Flop
Seat 6: UnderGunUma folded before Flop

Game #777000002 starts.
***** Hand History for Game 777000002 *****
$0.05/$0.10 NL Texas Hold'em - Wednesday, July 22, 2026 19:02:44 ET
Table RiverIQ Party Sample 6 Max (Real Money)
Seat 4 is the button
Total number of players : 6
Seat 1: Hero ( $10.15 USD )
Seat 2: CutoffCat ( $12.40 USD )
Seat 3: ButtonAce ( $9.65 USD )
Seat 4: SmallBlindSam ( $10.15 USD )
Seat 5: BigBlindBea ( $11.00 USD )
Seat 6: UnderGunUma ( $8.75 USD )
BigBlindBea posts small blind [$0.05 USD].
UnderGunUma posts big blind [$0.10 USD].
** Dealing down cards **
Dealt to Hero [ Kd, Kh ]
Hero raises [$0.30 USD].
CutoffCat folds.
ButtonAce calls [$0.30 USD].
SmallBlindSam folds.
BigBlindBea folds.
UnderGunUma calls [$0.20 USD].
** Dealing Flop ** [ Ks, 8h, 4d ]
UnderGunUma checks.
Hero bets [$0.45 USD].
ButtonAce folds.
UnderGunUma calls [$0.45 USD].
** Dealing Turn ** [ 2c ]
UnderGunUma checks.
Hero bets [$1.10 USD].
UnderGunUma calls [$1.10 USD].
** Dealing River ** [ 9s ]
UnderGunUma checks.
Hero bets [$2.40 USD].
UnderGunUma calls [$2.40 USD].
** Showdown **
Hero shows [ Kd, Kh ].
UnderGunUma shows [ Kc, Qc ].
Hero wins $8.55 USD from the main pot.
** Summary **
Total pot $8.90 | Rake $0.35
Board [ Ks, 8h, 4d, 2c, 9s ]
Seat 1: Hero showed [ Kd, Kh ] and won [ $8.55 ]
Seat 2: CutoffCat folded before Flop
Seat 3: ButtonAce folded on the Flop
Seat 4: SmallBlindSam folded before Flop
Seat 5: BigBlindBea folded before Flop
Seat 6: UnderGunUma showed [ Kc, Qc ] and lost

Game #777000003 starts.
***** Hand History for Game 777000003 *****
$0.05/$0.10 NL Texas Hold'em - Wednesday, July 22, 2026 19:05:31 ET
Table RiverIQ Party Sample 6 Max (Real Money)
Seat 5 is the button
Total number of players : 6
Seat 1: Hero ( $14.40 USD )
Seat 2: CutoffCat ( $12.10 USD )
Seat 3: ButtonAce ( $9.35 USD )
Seat 4: SmallBlindSam ( $10.15 USD )
Seat 5: BigBlindBea ( $10.95 USD )
Seat 6: UnderGunUma ( $4.80 USD )
UnderGunUma posts small blind [$0.05 USD].
Hero posts big blind [$0.10 USD].
** Dealing down cards **
Dealt to Hero [ As, Ad ]
CutoffCat raises [$0.30 USD].
ButtonAce folds.
SmallBlindSam folds.
BigBlindBea folds.
UnderGunUma raises [$4.80 USD] and is all-in.
Hero raises [$9.50 USD].
CutoffCat folds.
Uncalled bet [$4.70 USD] returned to Hero.
** Dealing Flop ** [ 7c, 3d, 2h ]
** Dealing Turn ** [ Jc ]
** Dealing River ** [ 6s ]
** Showdown **
Hero shows [ As, Ad ].
UnderGunUma shows [ Qs, Qh ].
Hero wins $9.55 USD from the main pot.
** Summary **
Total pot $9.80 | Rake $0.25
Board [ 7c, 3d, 2h, Jc, 6s ]
Seat 1: Hero showed [ As, Ad ] and won [ $9.55 ]
Seat 2: CutoffCat folded before Flop
Seat 3: ButtonAce folded before Flop
Seat 4: SmallBlindSam folded before Flop
Seat 5: BigBlindBea folded before Flop
Seat 6: UnderGunUma showed [ Qs, Qh ] and lost
`;

export const partyPokerSampleSession = {
  sessionName: 'AI Generated partypoker NLHE Sample',
  pokerSite: 'partypoker',
  gameType: 'NL Holdem',
  stakes: '$0.05/$0.10',
  currency: 'USD',
  tableSize: 6,
  source: 'synthetic-public-format-reference',
  notes:
    'Synthetic partypoker-style sample session for parser development. Replace or supplement with real MyGame exports before production support.',
};
