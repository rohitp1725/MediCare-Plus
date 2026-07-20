import { useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import { Menu } from 'lucide-react'
import { NotificationBell } from './NotificationBell'
import { PAGE_META } from '@/config/pageTitles'

const HOME_PATHS = new Set(['/patient', '/caregiver', '/doctor'])

interface TopbarProps {
  onMenuClick?: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { pathname } = useLocation()
  const dynamicMeta = pathname.startsWith('/caregiver/patients/') && pathname.split('/').length > 3
    ? { title: 'Patient Details', subtitle: 'Manage medicines and health records' }
    : pathname.startsWith('/doctor/patients/') && pathname.split('/').length > 3
    ? { title: 'Patient Details', subtitle: 'Clinical history and management' }
    : undefined
  const meta = dynamicMeta ?? PAGE_META[pathname] ?? { title: 'MediCare+', subtitle: '' }
  const subtitle = HOME_PATHS.has(pathname) ? format(new Date(), 'EEEE, MMMM d, yyyy') : meta.subtitle

  return (
    <header className="h-[68px] shrink-0 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-border bg-warm-white">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-sm hover:bg-cream text-slate-light hover:text-ink transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <h2 className="text-[19px] sm:text-[21px] text-ink leading-tight">{meta.title}</h2>
          {subtitle && <p className="text-xs text-slate-light mt-0.5 hidden sm:block">{subtitle}</p>}
        </div>
      </div>
      <NotificationBell />
    </header>
  )
}
