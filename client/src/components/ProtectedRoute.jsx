import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from './LoadingSpinner'

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard
    const dashboardRoutes = {
      admin: '/admin/dashboard',
      performer: '/performer/dashboard',
      audience: '/audience/tickets',
    }
    const redirect = dashboardRoutes[user?.role] || '/'
    return <Navigate to={redirect} replace />
  }

  return children
}
