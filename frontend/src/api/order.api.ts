import api from './axiosClient'

export const orderApi = {
  createOrder: (payload: { items: Array<{ name: string; quantity: number; price: number }>; deliveryAddress?: string; specialInstructions?: string; paymentMethod?: string }) =>
    api.post('/orders', payload),
  getMyOrders: () => api.get('/orders/my-orders'),
  getOrderById: (id: string) => api.get(`/orders/${id}`),
  confirmOrder: async (id: string) => {
    const response = await api.patch(`/orders/${id}/confirm`)
    try {
      window.dispatchEvent(new Event('campus-bites-budget-updated'))
    } catch (e) {}
    return response
  },
  cancelOrder: (id: string) => api.patch(`/orders/${id}/cancel`),
  getQRCode: (id: string) => api.get(`/orders/${id}/qr-code`),
  getAllOrders: () => api.get('/orders'),
}
