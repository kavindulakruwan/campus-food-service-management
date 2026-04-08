const express = require('express')
const { authenticate } = require('../middlewares/auth.middleware')
const { placeOrder, getMyOrders, getOrderById, cancelOrder } = require('../controllers/order.controller')

const router = express.Router()

router.use(authenticate)

router.post('/', placeOrder)
router.get('/', getMyOrders)
router.get('/:id', getOrderById)
router.patch('/:id/cancel', cancelOrder)

module.exports = router
