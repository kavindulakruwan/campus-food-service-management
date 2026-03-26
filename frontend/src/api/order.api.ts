import axiosClient from './axiosClient';

export const orderApi = {
  createOrder: async () => {
    const response = await axiosClient.post('/orders');
    return response.data;
  },

  getMyOrders: async () => {
    const response = await axiosClient.get('/orders/my-orders');
    return response.data;
  },

  getAllOrders: async () => {
    const response = await axiosClient.get('/orders');
    return response.data;
  }
};
