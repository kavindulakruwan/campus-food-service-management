import axiosClient from './axiosClient';

/**
 * Payment API client
 *
 * Important HTTP methods currently used:
 * - POST: initiate payment, verify payment result, refund payment
 * - GET: user history, digital receipt, admin payment list
 * - PUT: not used in payment flow right now
 */

// Request payload for starting a payment session from the frontend.
export interface PaymentInitiateRequest {
  // Optional because some flows start from an existing pending order.
  orderId?: string;
  amount?: number;
  method: 'PayPal' | 'QRCode';
}

// Payment endpoints used by the student payment flow and admin tools.
export const paymentApi = {
  // Create a payment session for the selected order and method.
  initiate: async (data: PaymentInitiateRequest) => {
    const response = await axiosClient.post('/payments/initiate', data);
    return response.data;
  },

  // Update the payment status after the gateway or QR flow completes.
  verify: async (paymentId: string, success: boolean) => {
    const response = await axiosClient.post('/payments/verify', { paymentId, success });
    return response.data;
  },

  // Load the signed-in user's payment history.
  getHistory: async () => {
    const response = await axiosClient.get('/payments/history');
    return response.data;
  },

  // Fetch the receipt for a completed payment.
  getReceipt: async (id: string) => {
    const response = await axiosClient.get(`/payments/${id}/receipt`);
    return response.data;
  },

  // Admin view of every payment record for review and reconciliation.
  getAllPayments: async () => {
    const response = await axiosClient.get('/payments');
    return response.data;
  },

  // Trigger a refund for a completed payment.
  refundPayment: async (id: string) => {
    const response = await axiosClient.post(`/payments/${id}/refund`);
    return response.data;
  }
};
