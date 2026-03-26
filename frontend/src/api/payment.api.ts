import axiosClient from './axiosClient';

export interface PaymentInitiateRequest {
  orderId?: string; // Optional if we are mocking order creation
  amount?: number;
  method: 'PayPal' | 'QRCode';
}

export const paymentApi = {
  initiate: async (data: PaymentInitiateRequest) => {
    const response = await axiosClient.post('/payments/initiate', data);
    return response.data;
  },

  verify: async (paymentId: string, success: boolean) => {
    const response = await axiosClient.post('/payments/verify', { paymentId, success });
    return response.data;
  },

  getHistory: async () => {
    const response = await axiosClient.get('/payments/history');
    return response.data;
  },

  getReceipt: async (id: string) => {
    const response = await axiosClient.get(`/payments/${id}/receipt`);
    return response.data;
  },

  // Admin routes
  getAllPayments: async () => {
    const response = await axiosClient.get('/payments');
    return response.data;
  },

  refundPayment: async (id: string) => {
    const response = await axiosClient.post(`/payments/${id}/refund`);
    return response.data;
  }
};
