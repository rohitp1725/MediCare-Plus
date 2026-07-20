import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { PageLoader } from '@/components/ui/PageLoader'
import { getHomePathForRole } from '@/config/navigation'

const SETUP_SQL_LINK = 'https://github.com/rohitp1725/MediCare-Plus/tree/main/database'

export function RootRedirect() {
  const { session, profile, loading, dbReady } = useAuth()

  if (loading) return <PageLoader />

  if (!session) return <Navigate to="/login" replace />

  // DB migrations haven't been run yet
  if (!dbReady) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-paper rounded-xl border border-border p-8 text-center shadow-sm">
          <div className="text-5xl mb-4">🗄️</div>
          <h2 className="text-xl font-display font-semibold text-ink mb-2">Database Setup Required</h2>
          <p className="text-sm text-slate-light mb-6 leading-relaxed">
            The database tables haven't been created yet. Please run the SQL migrations in your Supabase project to get started.
          </p>
          <a
            href={SETUP_SQL_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-sage text-white text-sm font-medium px-5 py-2.5 rounded-md hover:bg-sage-dark transition-colors"
          >
            View Setup Instructions →
          </a>
          <p className="text-xs text-slate-lighter mt-4">
            After running migrations, refresh this page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-xs text-sage underline hover:text-sage-dark"
          >
            Refresh now
          </button>
        </div>
      </div>
    )
  }

  // Logged in but profile still being set up (max ~5s wait, then show error)
  if (!profile) return <PageLoader label="Setting up your account…" />

  return <Navigate to={getHomePathForRole(profile.role)} replace />
}
