import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-cream text-center px-6">
      <div className="text-6xl">🧭</div>
      <h1 className="text-2xl text-ink">Page not found</h1>
      <p className="text-sm text-slate-light max-w-sm">The page you're looking for doesn't exist or may have moved.</p>
      <Link to="/">
        <Button>Go home</Button>
      </Link>
    </div>
  )
}
