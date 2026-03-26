const express = require('express');
const { getMyOrders, getAllOrders, createOrder } = require('../controllers/order.controller');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

// User routes
router.get('/my-orders', getMyOrders);
router.post('/', createOrder);

// Admin routes
router.get('/', authorizeRoles('admin'), getAllOrders);

module.exports = router;
