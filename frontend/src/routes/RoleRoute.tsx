import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import useAuth from '../hooks/useAuth'
import type { UserRole } from '../types/auth'

interface RoleRouteProps {
  roles: UserRole[]
  children: ReactNode
}

const RoleRoute = ({ roles, children }: RoleRouteProps) => {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!roles.includes(user.role)) {
    const fallbackPath = user.role === 'admin' ? '/admin' : '/dashboard'
    return <Navigate to={fallbackPath} replace state={{ from: location }} />
  }

  return <>{children}</>
}

export default RoleRoute
