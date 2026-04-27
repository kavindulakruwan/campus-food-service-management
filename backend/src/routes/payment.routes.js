const express = require('express');

/**
 * Payment routes
 *
 * Methods in use:
 * - POST /initiate
 * - POST /verify
 * - GET  /history
 * - GET  /:id/receipt
 * - GET  /              (admin)
 * - POST /:id/refund    (admin)
 *
 * Note: PUT is intentionally not used in current payment flow.
 */

const {
  initiatePayment,
  verifyPayment,
  requestRefund,
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
router.post('/:id/refund-request', requestRefund);
router.get('/history', getPaymentHistory);
router.get('/:id/receipt', getPaymentReceipt);

// Admin routes
router.use(authorizeRoles('admin'));
router.get('/', getAllPayments);
router.post('/:id/refund', refundPayment);

module.exports = router;
