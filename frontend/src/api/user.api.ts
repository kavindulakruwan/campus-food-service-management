import api from './axiosClient'
import type { AuthUser } from '../types/auth'

export interface ProfileUpdateInput {
  name?: string
  email?: string
  avatarUrl?: string
  phoneNumber?: string
  bio?: string
}

export const getMyProfile = () =>
  api.get<{ success: boolean; user: AuthUser }>('/users/me')

export const updateMyProfile = (data: ProfileUpdateInput) =>
  api.patch<{ success: boolean; message: string; user: AuthUser }>('/users/me', data)

export const deleteMyAccount = () =>
  api.delete<{ success: boolean; message: string }>('/users/me')