import api from './axiosClient'

export interface MenuItemData {
  _id: string
  name: string
  description: string
  price: number
  category: string
  available: boolean
}

export interface OrderItem {
  menuItem: string
  name: string
  price: number
  quantity: number
}

export interface OrderData {
  _id: string
  items: OrderItem[]
  total: number
  status: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled'
  qrCode: string
  pickupTime?: string
  note?: string
  createdAt: string
}

export const fetchMenu = () =>
  api.get<{ success: boolean; data: MenuItemData[] }>('/menu')

export const placeOrder = (payload: {
  items: { menuItemId: string; quantity: number }[]
  pickupTime?: string
  note?: string
}) => api.post<{ success: boolean; data: OrderData }>('/orders', payload)

export const fetchMyOrders = () =>
  api.get<{ success: boolean; data: OrderData[] }>('/orders')

export const cancelOrder = (id: string) =>
  api.patch<{ success: boolean; data: OrderData }>(`/orders/${id}/cancel`)
