const express = require('express');
const { getMyOrders, getAllOrders, createOrder, getOrderById, getOrderQRCode, cancelOrder, updateOrderStatus, deleteOrder } = require('../controllers/order.controller');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(authenticate);

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id/qr-code', getOrderQRCode);
router.patch('/:id/cancel', cancelOrder);
router.get('/:id', getOrderById);

router.get('/', authorizeRoles('admin'), getAllOrders);
router.patch('/:id/status', authorizeRoles('admin'), updateOrderStatus);
router.delete('/:id', authorizeRoles('admin'), deleteOrder);

module.exports = router;
