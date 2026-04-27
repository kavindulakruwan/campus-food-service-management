const express = require('express')
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware')
const {
  listMyPantryItems,
  createPantryItem,
  updateMyPantryItem,
  listPantryItemsForAdmin,
  approvePantryItem,
  deletePantryItemAsAdmin,
} = require('../controllers/pantry.controller')

const router = express.Router()

router.use(authenticate)

// Student pantry screen uses these routes to list and manage personal items.
router.get('/my', listMyPantryItems)
router.post('/', createPantryItem)
router.patch('/:id', updateMyPantryItem)

// Admin pantry screen uses these routes to review student submissions.
router.get('/admin/items', authorizeRoles('admin'), listPantryItemsForAdmin)
router.patch('/admin/items/:id/approve', authorizeRoles('admin'), approvePantryItem)
router.delete('/admin/items/:id', authorizeRoles('admin'), deletePantryItemAsAdmin)

module.exports = router
