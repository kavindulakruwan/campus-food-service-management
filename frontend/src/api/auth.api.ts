import api from './axiosClient'
import type { AuthResponse } from '../types/auth'

export const registerUser = (data: { name: string; email: string; password: string }) =>
  api.post<AuthResponse>('/auth/register', data)

export const loginUser = (data: { email: string; password: string }) =>
  api.post<AuthResponse>('/auth/login', data)

export const logoutUser = () =>
  api.post<{ success: boolean; message: string }>('/auth/logout')