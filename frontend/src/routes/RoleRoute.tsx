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

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace state={{ from: location }} />
  }

  return <>{children}</>
}

export default RoleRoute
