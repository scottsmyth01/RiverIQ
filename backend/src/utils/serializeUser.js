export function serializeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    subscription: user.subscription,
    stripeSubscriptionStatus: user.stripeSubscriptionStatus,
    stripeCancelAtPeriodEnd: user.stripeCancelAtPeriodEnd,
    stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd,
    bankroll: user.bankroll,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    preferences: user.preferences,
    avatarUrl: user.avatarUrl,
    avatarKey: user.avatarKey,
  };
}
