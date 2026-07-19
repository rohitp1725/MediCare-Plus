import type { RoleType } from './database'

export type { RoleType }

export interface NavItem {
  id: string
  path: string
  label: string
  emoji: string
  section: string
  end?: boolean
}

export interface Profile {
  id: string
  fullName: string
  role: RoleType
  phone: string | null
  avatarEmoji: string
}
