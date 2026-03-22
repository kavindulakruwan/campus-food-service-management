import { Navigate, Outlet } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

const PublicOnlyRoute = () => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <p className="text-slate-600">Loading your workspace...</p>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export default PublicOnlyRoute
