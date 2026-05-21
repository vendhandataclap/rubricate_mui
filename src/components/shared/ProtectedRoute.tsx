import { Navigate } from 'react-router-dom'
import { useAuth, type UserRole } from '../../services/authContext'

interface Props {
  children: React.ReactNode
  requiredRole: UserRole
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const assessmentReturnUrl = sessionStorage.getItem('rubricate_return_url')

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading…</p>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/signin" replace />
  }

  if (user.role !== requiredRole) {
    if (user.role === 'expert') {
      return <Navigate to={assessmentReturnUrl || '/signin?role=expert'} replace />
    }
    return <Navigate to={user.role === 'admin' ? '/admin' : '/recruiter'} replace />
  }

  return <>{children}</>
}
