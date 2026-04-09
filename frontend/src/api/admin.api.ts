import api from './axiosClient'

export interface AdminManagedUser {
  id: string
  name: string
  email: string
  role: 'student' | 'admin'
  isActive: boolean
  avatarUrl?: string
  phoneNumber?: string
  bio?: string
  createdAt: string
  updatedAt: string
}

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

interface AdminUserListResponse {
  success: boolean
  data: {
    users: AdminManagedUser[]
    pagination: {
      total: number
      page: number
      limit: number
      pages: number
    }
  }
}

interface AdminSingleUserResponse {
  success: boolean
  message: string
  user: AdminManagedUser
}

export interface AdminCreateUserInput {
  name: string
  email: string
  password: string
  role: 'student' | 'admin'
}

export interface AdminUpdateUserInput {
  name?: string
  email?: string
  role?: 'student' | 'admin'
  phoneNumber?: string
  bio?: string
  avatarUrl?: string
}

export interface AdminListFilters {
  search?: string
  role?: 'all' | 'student' | 'admin'
  status?: 'all' | 'active' | 'disabled'
  page?: number
  limit?: number
}

export const getAdminDashboard = () => api.get<AdminDashboardResponse>('/admin/dashboard')

export const getAdminUsers = (filters: AdminListFilters) =>
  api.get<AdminUserListResponse>('/admin/users', { params: filters })

export const createAdminUser = (payload: AdminCreateUserInput) =>
  api.post<AdminSingleUserResponse>('/admin/users', payload)

export const updateAdminUser = (userId: string, payload: AdminUpdateUserInput) =>
  api.patch<AdminSingleUserResponse>(`/admin/users/${userId}`, payload)

export const resetAdminUserPassword = (userId: string, newPassword: string) =>
  api.patch<{ success: boolean; message: string }>(`/admin/users/${userId}/reset-password`, { newPassword })

export const setAdminUserStatus = (userId: string, isActive: boolean) =>
  api.patch<AdminSingleUserResponse>(`/admin/users/${userId}/status`, { isActive })

export const deleteAdminUser = (userId: string) =>
  api.delete<{ success: boolean; message: string }>(`/admin/users/${userId}`)