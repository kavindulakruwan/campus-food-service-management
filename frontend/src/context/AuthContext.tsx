import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { loginUser, logoutUser, registerUser } from '../api/auth.api'
import type { AuthResponse, AuthUser } from '../types/auth'

interface LoginInput {
  email: string
  password: string
}

interface RegisterInput {
  name: string
  email: string
  password: string
}

interface AuthContextValue {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
}

const ACCESS_TOKEN_KEY = 'accessToken'
const USER_KEY = 'authUser'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const saveSession = (token: string, user: AuthUser) => {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
}

const clearSession = () => {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}

const loadUserFromSession = (): AuthUser | null => {
  const rawUser = sessionStorage.getItem(USER_KEY)
  if (!rawUser) return null

  try {
    return JSON.parse(rawUser) as AuthUser
  } catch {
    return null
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = sessionStorage.getItem(ACCESS_TOKEN_KEY)
    const storedUser = loadUserFromSession()

    if (token && storedUser) {
      setAccessToken(token)
      setUser(storedUser)
    } else {
      clearSession()
    }

    setIsLoading(false)
  }, [])

  const applyAuthPayload = (payload: AuthResponse) => {
    setAccessToken(payload.accessToken)
    setUser(payload.user)
    saveSession(payload.accessToken, payload.user)
  }

  const login = async (input: LoginInput) => {
    const response = await loginUser(input)
    applyAuthPayload(response.data)
  }

  const register = async (input: RegisterInput) => {
    const response = await registerUser(input)
    applyAuthPayload(response.data)
  }

  const logout = async () => {
    try {
      await logoutUser()
    } finally {
      setAccessToken(null)
      setUser(null)
      clearSession()
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(accessToken && user),
      isLoading,
      login,
      register,
      logout,
    }),
    [user, accessToken, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
