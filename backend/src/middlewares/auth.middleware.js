const jwt = require('jsonwebtoken')

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization || ''

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
    req.user = { id: payload.id, role: payload.role }
    return next()
  } catch (_error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

const authenticate = protect

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    return next()
  }
}

module.exports = { protect, authenticate, authorizeRoles }
