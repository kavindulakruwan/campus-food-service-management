const express = require('express')
const { protect } = require('../middlewares/auth.middleware')
const { validate } = require('../middlewares/validate.middleware')
const { updateProfileSchema } = require('../validators/user.validator')
const controller = require('../controllers/user.controller')

const router = express.Router()

router.get('/me', protect, controller.getMe)
router.patch('/me', protect, validate(updateProfileSchema), controller.updateMe)
router.delete('/me', protect, controller.deleteMe)

module.exports = router