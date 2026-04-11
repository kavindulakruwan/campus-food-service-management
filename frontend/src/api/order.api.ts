import axiosClient from './axiosClient';

export interface OrderItemPayload {
  name: string;
  quantity: number;
  price: number;
}

export interface CreateOrderRequest {
  items?: OrderItemPayload[];
  totalAmount?: number;
}

export const orderApi = {
  createOrder: async (data?: CreateOrderRequest) => {
    const response = await axiosClient.post('/orders', data || {});
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
