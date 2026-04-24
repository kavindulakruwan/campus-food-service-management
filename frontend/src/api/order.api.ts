import axiosClient from './axiosClient';

export interface OrderItemInput {
  mealId?: string;
  name: string;
  quantity: number;
  price: number;
}

export type OrderItemPayload = OrderItemInput;

export interface CreateOrderRequest {
  items?: OrderItemPayload[];
  totalAmount?: number;
  paymentMethod?: 'Cash' | 'PayPal' | 'QRCode';
}

export type CreateOrderPayload = CreateOrderRequest;

export const orderApi = {
  createOrder: async (payload: CreateOrderRequest = {}) => {
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
