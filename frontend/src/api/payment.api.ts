import axiosClient from './axiosClient';

/**
 * Payment API client
 *
 * Important HTTP methods currently used:
 * - POST: initiate payment, verify payment result, refund payment
 * - GET: user history, digital receipt, admin payment list
 * - PUT: not used in payment flow right now
 */

export interface PaymentInitiateRequest {
  orderId?: string; // Optional if we are mocking order creation
  amount?: number;
  method: 'PayPal' | 'QRCode';
}

export const paymentApi = {
  // POST /payments/initiate
  initiate: async (data: PaymentInitiateRequest) => {
    const response = await axiosClient.post('/payments/initiate', data);
    return response.data;
  },

  // POST /payments/verify
  verify: async (paymentId: string, success: boolean) => {
    const response = await axiosClient.post('/payments/verify', { paymentId, success });
    return response.data;
  },

  // GET /payments/history
  getHistory: async () => {
    const response = await axiosClient.get('/payments/history');
    return response.data;
  },

  // GET /payments/:id/receipt
  getReceipt: async (id: string) => {
    const response = await axiosClient.get(`/payments/${id}/receipt`);
    return response.data;
  },

  // Admin routes
  // GET /payments
  getAllPayments: async () => {
    const response = await axiosClient.get('/payments');
    return response.data;
  },

  // POST /payments/:id/refund
  refundPayment: async (id: string) => {
    const response = await axiosClient.post(`/payments/${id}/refund`);
    return response.data;
  }
};
