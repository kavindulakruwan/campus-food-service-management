const express = require('express')

const controller = require('../controllers/mealPlan.controller')
const { protect } = require('../middlewares/auth.middleware')
const { validate } = require('../middlewares/validate.middleware')
const {
  createMealPlanSchema,
  updateMealPlanSchema,
  duplicateWeekSchema,
  quickCopyWeekSchema,
} = require('../validators/mealPlan.validator')

const router = express.Router()

router.use(protect)

router.post('/', validate(createMealPlanSchema), controller.createMealPlan)
router.get('/week', controller.getWeeklyMealPlans)
router.get('/month', controller.getMonthlyMealPlans)
router.patch('/:id', validate(updateMealPlanSchema), controller.updateMealPlan)
router.delete('/:id', controller.deleteMealPlan)
router.post('/week/duplicate', validate(duplicateWeekSchema), controller.duplicateWeekPlans)
router.post('/week/quick-copy', validate(quickCopyWeekSchema), controller.quickCopyWeekPlans)

module.exports = router
