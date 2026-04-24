const jwt = require('jsonwebtoken')
const getAccessSecret = () => process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization || ''
  const accessSecret = getAccessSecret()

  if (!accessSecret) {
    return res.status(500).json({
      success: false,
      message: 'JWT secret is not configured. Set JWT_SECRET or JWT_ACCESS_SECRET.',
    })
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, accessSecret)
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
