import { NavLink } from 'react-router-dom'
import { LogOut, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications'
import { getNavForRole, SECTION_LABELS } from '@/config/navigation'
import type { RoleType } from '@/types'

const ROLE_META: Record<RoleType, { label: string; emoji: string; badgeClass: string }> = {
  patient: { label: 'Patient Mode', emoji: '👴', badgeClass: 'bg-sage/20 text-[#8FD4C1]' },
  caregiver: { label: 'Caregiver Mode', emoji: '👩⚕️', badgeClass: 'bg-lavender/25 text-[#C4B8E0]' },
  doctor: { label: 'Doctor Mode', emoji: '🩺', badgeClass: 'bg-amber/20 text-[#F5C687]' },
}

const ALERT_NAV_IDS = new Set(['cg-alerts', 'doc-alerts'])

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const { profile, signOut } = useAuth()
  const { data: unreadCount = 0 } = useUnreadNotifications()

  if (!profile) return null

  const navItems = getNavForRole(profile.role)
  const sectionLabels = SECTION_LABELS[profile.role]
  const sections = [...new Set(navItems.map(n => n.section))]
  const roleMeta = ROLE_META[profile.role]

  return (
    <aside className="w-[240px] h-full shrink-0 bg-sage-dark flex flex-col relative z-10">
      <div className="px-6 pt-7 pb-5 border-b border-white/10 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] text-white tracking-tight">MediCare+</h1>
          <span className="block mt-0.5 text-[11px] text-sage-light tracking-wide">Elderly Health Tracker</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="px-3 pt-2">
        <div className={`flex items-center gap-2 px-3 py-2 my-2 rounded-sm text-xs font-semibold ${roleMeta.badgeClass}`}>
          <span className="text-base">{roleMeta.emoji}</span>
          {roleMeta.label}
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 overflow-y-auto flex flex-col gap-0.5">
        {sections.map(section => (
          <div key={section}>
            <div className="text-[10px] font-semibold tracking-[1.2px] uppercase text-white/35 px-3 pt-3 pb-1.5">
              {sectionLabels[section] ?? section}
            </div>
            {navItems
              .filter(n => n.section === section)
              .map(item => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-sm transition-colors w-full text-left ${
                      isActive ? 'bg-sage text-white font-medium' : 'text-white/65 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <span className="text-[18px] w-[22px] text-center">{item.emoji}</span>
                  <span className="flex-1">{item.label}</span>
                  {ALERT_NAV_IDS.has(item.id) && unreadCount > 0 && (
                    <span className="bg-rose text-white text-[11px] font-semibold px-[7px] py-px rounded-full animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </NavLink>
              ))}
          </div>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-sage flex items-center justify-center text-lg shrink-0">
          {profile.avatarEmoji}
        </div>
        <div className="flex-1 min-w-0">
          <strong className="block text-white text-[13px] font-medium truncate">{profile.fullName}</strong>
          <span className="text-[11px] text-sage-light capitalize">{profile.role}</span>
        </div>
      </div>

      <div className="px-3 pb-3 pt-2">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-3.5 py-2.5 pt-3 rounded-sm text-sm w-full text-left text-white/50 border-t border-white/10 hover:text-rose-light hover:bg-rose/15 transition-colors"
        >
          <LogOut size={18} className="w-[22px]" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
