const express = require('express')
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware')
const { getMenu, createMenuItem, updateMenuItem, deleteMenuItem } = require('../controllers/menu.controller')

const router = express.Router()

router.get('/', getMenu)                                                                    // public
router.post('/', authenticate, authorizeRoles('admin'), createMenuItem)                    // admin
router.patch('/:id', authenticate, authorizeRoles('admin'), updateMenuItem)                // admin
router.delete('/:id', authenticate, authorizeRoles('admin'), deleteMenuItem)               // admin

module.exports = router
