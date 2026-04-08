const User = require('../models/User')
const Order = require('../models/Order')
const MenuItem = require('../models/MenuItem')

// GET /api/admin/dashboard
const getDashboard = async (_req, res) => {
  const [users, students, admins, recentUsers] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'admin' }),
    User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt'),
  ])

  const [totalOrders, pendingOrders, revenueAgg, recentOrders] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: 'pending' }),
    Order.aggregate([
      { $match: { status: { $in: ['confirmed', 'ready', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('student', 'name email'),
  ])

  const totalRevenue = revenueAgg[0]?.total ?? 0

  // Orders per day (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const dailyOrders = await Order.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        revenue: { $sum: '$total' },
      },
    },
    { $sort: { _id: 1 } },
  ])

  // Order status breakdown
  const statusBreakdown = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ])

  return res.json({
    success: true,
    data: {
      totals: { users, students, admins, totalOrders, pendingOrders, totalRevenue },
      recentUsers: recentUsers.map((u) => ({
        id: u._id.toString(), name: u.name, email: u.email, role: u.role, createdAt: u.createdAt,
      })),
      recentOrders: recentOrders.map((o) => ({
        id: o._id.toString(),
        student: o.student ? { name: o.student.name, email: o.student.email } : null,
        total: o.total,
        status: o.status,
        itemCount: o.items.length,
        createdAt: o.createdAt,
      })),
      dailyOrders,
      statusBreakdown: Object.fromEntries(statusBreakdown.map((s) => [s._id, s.count])),
    },
  })
}

// GET /api/admin/orders  — all orders with filters
const getAllOrders = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query
  const filter = status ? { status } : {}
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('student', 'name email'),
    Order.countDocuments(filter),
  ])
  return res.json({ success: true, data: orders, total, page: Number(page) })
}

// PATCH /api/admin/orders/:id/status  — update order status
const updateOrderStatus = async (req, res) => {
  const { status } = req.body
  const allowed = ['pending', 'confirmed', 'ready', 'completed', 'cancelled']
  if (!allowed.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' })
  }
  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('student', 'name email')
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' })
  return res.json({ success: true, data: order })
}

// GET /api/admin/users  — all users
const getAllUsers = async (req, res) => {
  const { page = 1, limit = 20 } = req.query
  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
    User.countDocuments(),
  ])
  return res.json({ success: true, data: users, total })
}

// PATCH /api/admin/users/:id/toggle  — activate / deactivate user
const toggleUserActive = async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) return res.status(404).json({ success: false, message: 'User not found' })
  user.isActive = !user.isActive
  await user.save()
  return res.json({ success: true, data: { id: user._id, isActive: user.isActive } })
}

module.exports = { getDashboard, getAllOrders, updateOrderStatus, getAllUsers, toggleUserActive }
