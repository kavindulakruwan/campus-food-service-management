const express = require('express')

const controller = require('../controllers/mealItem.controller')
const { protect, authorizeRoles } = require('../middlewares/auth.middleware')
const { validate } = require('../middlewares/validate.middleware')
const { createMealItemSchema, updateMealItemSchema } = require('../validators/mealItem.validator')

const router = express.Router()

router.use(protect)

router.get('/', controller.getMeals)
router.post('/', authorizeRoles('admin'), validate(createMealItemSchema), controller.createMeal)
router.patch('/:id', authorizeRoles('admin'), validate(updateMealItemSchema), controller.updateMeal)
router.delete('/:id', authorizeRoles('admin'), controller.deleteMeal)

module.exports = router