const express = require('express')
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware')
const { getDashboard } = require('../controllers/admin.controller')

const router = express.Router()

router.get('/dashboard', authenticate, authorizeRoles('admin'), getDashboard)

module.exports = router
