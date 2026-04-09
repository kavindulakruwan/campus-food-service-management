const express = require('express');
const {
  initiatePayment,
  verifyPayment,
  getPaymentHistory,
  getPaymentReceipt,
  getAllPayments,
  refundPayment
} = require('../controllers/payment.controller');

const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');

const router = express.Router();

// User routes
router.use(authenticate); // All routes require auth
router.post('/initiate', initiatePayment);
router.post('/verify', verifyPayment);
router.get('/history', getPaymentHistory);
router.get('/:id/receipt', getPaymentReceipt);

// Admin routes
router.use(authorizeRoles('admin'));
router.get('/', getAllPayments);
router.post('/:id/refund', refundPayment);

module.exports = router;
