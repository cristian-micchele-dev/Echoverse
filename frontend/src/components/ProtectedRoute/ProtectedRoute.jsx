import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import PageLoader from '../PageLoader/PageLoader'
import { ROUTES } from '../../utils/constants'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to={ROUTES.AUTH} replace />
  return children
}
