const express = require('express')
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware')
const {
  getDashboard,
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
  toggleUserActive,
} = require('../controllers/admin.controller')

const router = express.Router()
router.use(authenticate, authorizeRoles('admin'))

router.get('/dashboard', getDashboard)
router.get('/orders', getAllOrders)
router.patch('/orders/:id/status', updateOrderStatus)
router.get('/users', getAllUsers)
router.patch('/users/:id/toggle', toggleUserActive)

module.exports = router
