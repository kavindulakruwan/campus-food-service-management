const User = require('../models/User')
const jwt  = require('jsonwebtoken')

const getAccessSecret = () => process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET

const ensureJwtSecrets = () => {
  const accessSecret = getAccessSecret()
  const refreshSecret = getRefreshSecret()

  if (!accessSecret || !refreshSecret) {
    const error = new Error('JWT secrets are not configured. Set JWT_SECRET or JWT_ACCESS_SECRET and JWT_REFRESH_SECRET.')
    error.statusCode = 500
    throw error
  }

  return { accessSecret, refreshSecret }
}

const signToken = (id, role) =>
  jwt.sign({ id, role }, ensureJwtSecrets().accessSecret, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  })

const sendRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,     // JS can't read it — blocks XSS
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict', // blocks CSRF
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
  })
}

const toAuthUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatarUrl: user.avatarUrl || '',
  phoneNumber: user.phoneNumber || '',
  bio: user.bio || '',
})

// POST /api/auth/register
exports.register = async (req, res) => {
  const { name, email, password } = req.body
  const { refreshSecret } = ensureJwtSecrets()

  const exists = await User.findOne({ email })
  if (exists) return res.status(409).json({ success: false, message: 'Email already registered' })

  const user = await User.create({ name, email, password })

  const accessToken  = signToken(user._id, user.role)
  const refreshToken = jwt.sign({ id: user._id }, refreshSecret, { expiresIn: '7d' })

  sendRefreshCookie(res, refreshToken)

  res.status(201).json({
    success: true,
    message: 'Account created',
    accessToken,
    user: toAuthUser(user),
  })
}

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body
  const { refreshSecret } = ensureJwtSecrets()

  // +password re-includes the select:false field
  const user = await User.findOne({ email }).select('+password')
  if (!user || !(await user.comparePassword(password))) {
    // Same message for both — don't tell attacker which is wrong
    return res.status(401).json({ success: false, message: 'Invalid email or password' })
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Account disabled' })
  }

  const accessToken  = signToken(user._id, user.role)
  const refreshToken = jwt.sign({ id: user._id }, refreshSecret, { expiresIn: '7d' })

  sendRefreshCookie(res, refreshToken)

  res.json({
    success: true,
    accessToken,
    user: toAuthUser(user),
  })
}

// POST /api/auth/logout
exports.logout = (_req, res) => {
  res.clearCookie('refreshToken')
  res.json({ success: true, message: 'Logged out' })
}