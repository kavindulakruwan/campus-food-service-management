const User = require('../models/User')

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

module.exports = {
  getDashboard,
}
