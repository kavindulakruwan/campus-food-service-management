const express = require('express')
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware')
const { validate } = require('../middlewares/validate.middleware')
const {
	getDashboard,
	listUsers,
	createUser,
	updateUser,
	resetUserPassword,
	setUserStatus,
	deleteUser,
} = require('../controllers/admin.controller')
const {
	createUserSchema,
	updateUserSchema,
	resetPasswordSchema,
	updateUserStatusSchema,
} = require('../validators/admin.validator')

const router = express.Router()

router.get('/dashboard', authenticate, authorizeRoles('admin'), getDashboard)
router.get('/users', authenticate, authorizeRoles('admin'), listUsers)
router.post('/users', authenticate, authorizeRoles('admin'), validate(createUserSchema), createUser)
router.patch('/users/:id', authenticate, authorizeRoles('admin'), validate(updateUserSchema), updateUser)
router.patch('/users/:id/reset-password', authenticate, authorizeRoles('admin'), validate(resetPasswordSchema), resetUserPassword)
router.patch('/users/:id/status', authenticate, authorizeRoles('admin'), validate(updateUserStatusSchema), setUserStatus)
router.delete('/users/:id', authenticate, authorizeRoles('admin'), deleteUser)

module.exports = router
