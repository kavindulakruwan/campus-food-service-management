const User = require('../models/User')

const toProfileUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatarUrl: user.avatarUrl || '',
  phoneNumber: user.phoneNumber || '',
  bio: user.bio || '',
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
})

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id)

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }

  return res.json({ success: true, user: toProfileUser(user) })
}

exports.updateMe = async (req, res) => {
  const { name, email, avatarUrl, phoneNumber, bio } = req.body

  const user = await User.findById(req.user.id)
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }

  if (email && email !== user.email) {
    const emailTaken = await User.findOne({ email, _id: { $ne: user._id } })
    if (emailTaken) {
      return res.status(409).json({ success: false, message: 'Email already registered' })
    }
  }

  if (name !== undefined) user.name = name
  if (email !== undefined) user.email = email.toLowerCase().trim()
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl
  if (phoneNumber !== undefined) user.phoneNumber = phoneNumber
  if (bio !== undefined) user.bio = bio

  await user.save()

  return res.json({
    success: true,
    message: 'Profile updated successfully',
    user: toProfileUser(user),
  })
}

exports.deleteMe = async (req, res) => {
  const user = await User.findByIdAndDelete(req.user.id)

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }

  res.clearCookie('refreshToken')

  return res.json({
    success: true,
    message: 'Account deleted successfully',
  })
}