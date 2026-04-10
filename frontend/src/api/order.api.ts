import axiosClient from './axiosClient';

export const orderApi = {
  createOrder: async (payload: { items: Array<{ name: string; quantity: number; price: number }>; deliveryAddress?: string; specialInstructions?: string; paymentMethod?: string }) => {
    const response = await axiosClient.post('/orders', payload);
    return response;
  },
  getMyOrders: async () => {
    const response = await axiosClient.get('/orders/my-orders');
    return response;
  },
  getOrderById: async (id: string) => {
    const response = await axiosClient.get(`/orders/${id}`);
    return response;
  },
  cancelOrder: async (id: string) => {
    const response = await axiosClient.patch(`/orders/${id}/cancel`);
    return response;
  },
  getQRCode: async (id: string) => {
    const response = await axiosClient.get(`/orders/${id}/qr-code`);
    return response;
  },
  getAllOrders: async () => {
    const response = await axiosClient.get('/orders');
    return response;
  }
};
