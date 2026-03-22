export type UserRole = 'student' | 'admin'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface AuthResponse {
  success: boolean
  message?: string
  accessToken: string
  user: AuthUser
}
