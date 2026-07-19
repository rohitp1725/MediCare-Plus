import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { PageLoader } from '@/components/ui/PageLoader'
import { getHomePathForRole } from '@/config/navigation'

export function RootRedirect() {
  const { session, profile, loading } = useAuth()

  if (loading) return <PageLoader />
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <PageLoader label="Setting up your account…" />

  return <Navigate to={getHomePathForRole(profile.role)} replace />
}
