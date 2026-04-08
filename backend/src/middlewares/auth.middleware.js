const jwt = require('jsonwebtoken')
const User = require('../models/User')

const extractToken = (req) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  return authHeader.split(' ')[1]
}

const authenticate = async (req, res, next) => {
  const token = extractToken(req)

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
    const user = await User.findById(payload.id).select('name email role isActive')

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid session' })
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    }

    return next()
  } catch (_error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied' })
  }

  return next()
}

module.exports = {
  authenticate,
  authorizeRoles,
}
