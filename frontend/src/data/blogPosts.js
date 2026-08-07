export const blogPosts = [
  {
    slug: 'how-to-review-a-poker-session',
    title: 'How to Review a Poker Session Without Getting Lost',
    excerpt:
      'A simple review process for turning raw hand histories into useful decisions about leaks, volume, and focus areas.',
    category: 'Session Review',
    date: 'August 5, 2026',
    readTime: '5 min read',
    author: 'RiverIQ',
    content: [
      {
        heading: 'Start With The Big Picture',
        body:
          'Before opening individual hands, look at session profit, hands played, duration, and win rate. The goal is not to decide whether you played well from the graph alone. The goal is to understand what kind of session you are reviewing.',
      },
      {
        heading: 'Separate Results From Decisions',
        body:
          'Winning sessions can hide bad decisions, and losing sessions can contain strong play. Mark all-in spots, large pots, and unusual lines, then review those hands separately from the final result.',
      },
      {
        heading: 'Pick One Leak At A Time',
        body:
          'Do not try to fix VPIP, 3Bet, c-bet, bankroll management, and tilt in the same review. Choose one theme, write one adjustment, and carry it into your next session.',
      },
    ],
  },
  {
    slug: 'what-vpip-pfr-and-3bet-mean',
    title: 'What VPIP, PFR, and 3Bet Actually Tell You',
    excerpt:
      'The three preflop stats every online poker player should understand before making strategy changes.',
    category: 'Poker Stats',
    date: 'August 5, 2026',
    readTime: '4 min read',
    author: 'RiverIQ',
    content: [
      {
        heading: 'VPIP Shows How Often You Enter Pots',
        body:
          'VPIP measures how often you voluntarily put money into the pot preflop. A high VPIP can mean you are involved too often, but context matters by table size, position, and game type.',
      },
      {
        heading: 'PFR Shows Your Aggression',
        body:
          'PFR measures how often you raise preflop. Comparing VPIP and PFR can reveal whether you are playing too passively before the flop.',
      },
      {
        heading: '3Bet Shows Pressure After An Open',
        body:
          '3Bet percentage measures how often you re-raise after someone has opened. Strong 3Bet review should be position-aware because button versus cutoff is not the same as small blind versus under the gun.',
      },
    ],
  },
  {
    slug: 'bankroll-management-for-cash-games',
    title: 'Bankroll Management for Online Cash Games',
    excerpt:
      'A practical way to think about stakes, shot-taking, and protecting your poker bankroll from avoidable risk.',
    category: 'Bankroll',
    date: 'August 5, 2026',
    readTime: '6 min read',
    author: 'RiverIQ',
    content: [
      {
        heading: 'Your Bankroll Is A Risk Buffer',
        body:
          'A bankroll is not just the money in your account. It is the buffer that lets you survive normal variance without changing your strategy every time you lose a few buy-ins.',
      },
      {
        heading: 'Use Clear Move-Up And Move-Down Rules',
        body:
          'Before you take a shot at higher stakes, decide when the shot ends. A simple rule removes emotion from the moment when the session gets uncomfortable.',
      },
      {
        heading: 'Track Stakes Separately',
        body:
          'Mixing stakes can make results hard to understand. Track profit, win rate, and all-in EV by stake level so you know where your edge is actually coming from.',
      },
    ],
  },
];

export function getBlogPost(slug) {
  return blogPosts.find((post) => post.slug === slug);
}
