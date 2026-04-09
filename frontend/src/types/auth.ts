export type UserRole = 'student' | 'admin'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
  phoneNumber?: string
  bio?: string
}

export interface AuthResponse {
  success: boolean
  message?: string
  accessToken: string
  user: AuthUser
}
