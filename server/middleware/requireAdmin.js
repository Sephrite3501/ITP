export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.user_role !== 'admin') {
    return res.status(403).json({ error: 'Admin access only' });
  }
  next();
};
