import api from './axiosClient'

interface AdminDashboardResponse {
  success: boolean
  data: {
    totals: {
      users: number
      students: number
      admins: number
    }
    recentUsers: Array<{
      id: string
      name: string
      email: string
      role: 'student' | 'admin'
      createdAt: string
    }>
  }
}

export const getAdminDashboard = () => api.get<AdminDashboardResponse>('/admin/dashboard')
