import axiosClient from './axiosClient';

export interface OrderItemInput {
  mealId?: string;
  name: string;
  quantity: number;
  price: number;
}

export interface CreateOrderPayload {
  items?: OrderItemInput[];
  totalAmount?: number;
}

export const orderApi = {
  createOrder: async (payload: CreateOrderPayload = {}) => {
    const response = await axiosClient.post('/orders', payload);
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
