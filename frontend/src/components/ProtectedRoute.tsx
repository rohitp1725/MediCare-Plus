import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { PageLoader } from '@/components/ui/PageLoader'
import { getHomePathForRole } from '@/config/navigation'
import type { RoleType } from '@/types'

export function ProtectedRoute({ allowedRoles }: { allowedRoles: RoleType[] }) {
  const { session, profile, loading } = useAuth()

  if (loading) return <PageLoader />
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <PageLoader label="Setting up your account…" />
  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to={getHomePathForRole(profile.role)} replace />
  }

  return <Outlet />
}
