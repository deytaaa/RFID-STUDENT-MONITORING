const jwt = require('jsonwebtoken');

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No token provided in request headers:', req.headers); // DEBUG LOG
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('JWT verification error:', err); // DEBUG LOG
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    console.log('Decoded JWT user:', user); // DEBUG LOG
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  console.log('requireAdmin - req.user:', req.user); // DEBUG LOG
  if (req.user && (req.user.accessLevel === 'admin' || req.user.accessLevel === 'superadmin')) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Admin access required' });
}

function requireSuperAdmin(req, res, next) {
  console.log('requireSuperAdmin - req.user:', req.user); // DEBUG LOG
  if (req.user && req.user.accessLevel === 'superadmin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Super admin access required' });
}

module.exports = { authenticateJWT, requireAdmin, requireSuperAdmin };
