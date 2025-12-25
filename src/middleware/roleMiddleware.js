// Role-based access control middleware
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// Specific role checks
const requireSuperAdmin = requireRole('super_admin');
const requireEditor = requireRole('super_admin', 'editor');
const requireModerator = requireRole('super_admin', 'editor', 'moderator');

module.exports = {
  requireRole,
  requireSuperAdmin,
  requireEditor,
  requireModerator
};
