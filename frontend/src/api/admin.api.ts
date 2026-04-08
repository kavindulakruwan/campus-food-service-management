import api from './axiosClient'

export interface AdminTotals {
  users: number
  students: number
  admins: number
  totalOrders: number
  pendingOrders: number
  totalRevenue: number
}

export interface RecentUser {
  id: string
  name: string
  email: string
  role: 'student' | 'admin'
  createdAt: string
}

export interface AdminOrder {
  id: string
  student: { name: string; email: string } | null
  total: number
  status: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled'
  itemCount: number
  createdAt: string
}

export interface DailyOrderStat {
  _id: string   // date string YYYY-MM-DD
  count: number
  revenue: number
}

export interface AdminDashboardData {
  totals: AdminTotals
  recentUsers: RecentUser[]
  recentOrders: AdminOrder[]
  dailyOrders: DailyOrderStat[]
  statusBreakdown: Record<string, number>
}

export interface FullUser {
  _id: string
  name: string
  email: string
  role: 'student' | 'admin'
  isActive: boolean
  createdAt: string
}

export interface FullOrder {
  _id: string
  student: { name: string; email: string } | null
  items: { name: string; quantity: number; price: number }[]
  total: number
  status: string
  note?: string
  createdAt: string
}

export const getAdminDashboard = () =>
  api.get<{ success: boolean; data: AdminDashboardData }>('/admin/dashboard')

export const getAdminOrders = (params?: { status?: string; page?: number }) =>
  api.get<{ success: boolean; data: FullOrder[]; total: number }>('/admin/orders', { params })

export const updateOrderStatus = (id: string, status: string) =>
  api.patch<{ success: boolean; data: FullOrder }>(`/admin/orders/${id}/status`, { status })

export const getAdminUsers = (params?: { page?: number }) =>
  api.get<{ success: boolean; data: FullUser[]; total: number }>('/admin/users', { params })

export const toggleUserActive = (id: string) =>
  api.patch<{ success: boolean; data: { id: string; isActive: boolean } }>(`/admin/users/${id}/toggle`)
