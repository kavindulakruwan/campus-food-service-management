const express  = require('express')
const controller = require('../controllers/auth.controller')
const { validate } = require('../middlewares/validate.middleware')
const { registerSchema, loginSchema } = require('../validators/auth.validator')

const router = express.Router()

router.post('/register', validate(registerSchema), controller.register)
router.post('/login',    validate(loginSchema),    controller.login)
router.post('/logout',   controller.logout)

module.exports = router