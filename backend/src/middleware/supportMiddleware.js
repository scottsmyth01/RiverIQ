export function requireSupport(req, res, next) {
  if (req.user?.role === 'admin' || req.user?.role === 'support') {
    return next();
  }

  return res.status(403).json({ message: 'Support access required' });
}
