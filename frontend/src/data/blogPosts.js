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
        body: 'Before opening individual hands, look at session profit, hands played, duration, and win rate. The goal is not to decide whether you played well from the graph alone. The goal is to understand what kind of session you are reviewing.',
      },
      {
        heading: 'Separate Results From Decisions',
        body: 'Winning sessions can hide bad decisions, and losing sessions can contain strong play. Mark all-in spots, large pots, and unusual lines, then review those hands separately from the final result.',
      },
      {
        heading: 'Pick One Leak At A Time',
        body: 'Do not try to fix VPIP, 3Bet, c-bet, bankroll management, and tilt in the same review. Choose one theme, write one adjustment, and carry it into your next session.',
      },
    ],
  },
];

export function getBlogPost(slug) {
  return blogPosts.find((post) => post.slug === slug);
}
