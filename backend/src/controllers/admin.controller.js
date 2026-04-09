const User = require('../models/User')
const MealPlan = require('../models/MealPlan')

const parseDate = (value) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

const toDateKey = (date) => {
  const iso = new Date(date).toISOString()
  return iso.slice(0, 10)
}

const getDashboard = async (_req, res) => {
  const [users, students, admins, recentUsers] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'admin' }),
    User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt'),
  ])

  return res.json({
    success: true,
    data: {
      totals: {
        users,
        students,
        admins,
      },
      recentUsers: recentUsers.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      })),
    },
  })
}

const toAdminUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  avatarUrl: user.avatarUrl || '',
  phoneNumber: user.phoneNumber || '',
  bio: user.bio || '',
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
})

const toAdminMealPlan = (item) => ({
  id: item._id.toString(),
  date: toDateKey(item.date),
  mealTime: item.mealTime,
  mealName: item.mealName,
  quantity: item.quantity,
  notes: item.notes || '',
  user: item.user && typeof item.user === 'object'
    ? {
        id: item.user._id?.toString?.() || item.user.id || '',
        name: item.user.name || '',
        email: item.user.email || '',
        role: item.user.role || 'student',
      }
    : null,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
})

const listUsers = async (req, res) => {
  const {
    search = '',
    role = 'all',
    status = 'all',
    page = '1',
    limit = '20',
  } = req.query

  const safePage = Math.max(Number(page) || 1, 1)
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100)

  const query = {}

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ]
  }

  if (role !== 'all') {
    query.role = role
  }

  if (status === 'active') query.isActive = true
  if (status === 'disabled') query.isActive = false

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
    User.countDocuments(query),
  ])

  return res.json({
    success: true,
    data: {
      users: users.map(toAdminUser),
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        pages: Math.ceil(total / safeLimit) || 1,
      },
    },
  })
}

const createUser = async (req, res) => {
  const { name, email, password, role = 'student' } = req.body

  const exists = await User.findOne({ email })
  if (exists) {
    return res.status(409).json({ success: false, message: 'Email already registered' })
  }

  const user = await User.create({ name, email, password, role })

  return res.status(201).json({
    success: true,
    message: 'User created successfully',
    user: toAdminUser(user),
  })
}

const updateUser = async (req, res) => {
  const { id } = req.params
  const { name, email, role, phoneNumber, bio, avatarUrl } = req.body

  const user = await User.findById(id)
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
  if (role !== undefined) user.role = role
  if (phoneNumber !== undefined) user.phoneNumber = phoneNumber
  if (bio !== undefined) user.bio = bio
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl

  await user.save()

  return res.json({
    success: true,
    message: 'User updated successfully',
    user: toAdminUser(user),
  })
}

const resetUserPassword = async (req, res) => {
  const { id } = req.params
  const { newPassword } = req.body

  const user = await User.findById(id)
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }

  user.password = newPassword
  await user.save()

  return res.json({ success: true, message: 'Password reset successfully' })
}

const setUserStatus = async (req, res) => {
  const { id } = req.params
  const { isActive } = req.body

  const user = await User.findById(id)
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }

  if (req.user.id === user._id.toString() && isActive === false) {
    return res.status(400).json({ success: false, message: 'You cannot disable your own account' })
  }

  user.isActive = Boolean(isActive)
  await user.save()

  return res.json({
    success: true,
    message: `Account ${user.isActive ? 'enabled' : 'disabled'} successfully`,
    user: toAdminUser(user),
  })
}

const deleteUser = async (req, res) => {
  const { id } = req.params

  if (req.user.id === id) {
    return res.status(400).json({ success: false, message: 'You cannot delete your own account' })
  }

  const user = await User.findByIdAndDelete(id)
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }

  return res.json({ success: true, message: 'User deleted successfully' })
}

const listMealPlans = async (req, res) => {
  const {
    search = '',
    mealTime = 'all',
    date = '',
    page = '1',
    limit = '20',
  } = req.query

  const safePage = Math.max(Number(page) || 1, 1)
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100)

  const query = {}

  if (mealTime !== 'all') {
    query.mealTime = mealTime
  }

  if (date) {
    const targetDate = parseDate(date)
    const nextDay = new Date(targetDate)
    nextDay.setUTCDate(nextDay.getUTCDate() + 1)
    query.date = { $gte: targetDate, $lt: nextDay }
  }

  if (search) {
    query.$or = [
      { mealName: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } },
    ]
  }

  const [mealPlans, total] = await Promise.all([
    MealPlan.find(query)
      .populate('user', 'name email role')
      .sort({ date: -1, createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
    MealPlan.countDocuments(query),
  ])

  return res.json({
    success: true,
    data: {
      mealPlans: mealPlans.map(toAdminMealPlan),
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        pages: Math.ceil(total / safeLimit) || 1,
      },
    },
  })
}

const updateMealPlan = async (req, res) => {
  const { id } = req.params
  const payload = { ...req.body }

  if (payload.date) {
    payload.date = parseDate(payload.date)
  }

  const updated = await MealPlan.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).populate('user', 'name email role')

  if (!updated) {
    return res.status(404).json({ success: false, message: 'Meal plan not found' })
  }

  return res.json({
    success: true,
    message: 'Meal plan updated successfully',
    data: toAdminMealPlan(updated),
  })
}

const deleteMealPlan = async (req, res) => {
  const { id } = req.params

  const deleted = await MealPlan.findByIdAndDelete(id)
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Meal plan not found' })
  }

  return res.json({ success: true, message: 'Meal plan deleted successfully' })
}

module.exports = {
  getDashboard,
  listUsers,
  createUser,
  updateUser,
  resetUserPassword,
  setUserStatus,
  deleteUser,
  listMealPlans,
  updateMealPlan,
  deleteMealPlan,
}
