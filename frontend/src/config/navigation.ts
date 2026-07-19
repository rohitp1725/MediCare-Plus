import type { NavItem, RoleType } from '@/types'

export const PATIENT_NAV: NavItem[] = [
  { id: 'home', path: '/patient', label: 'Home', emoji: '🏠', section: 'main', end: true },
  { id: 'profile', path: '/patient/profile', label: 'My Profile', emoji: '👤', section: 'main' },
  { id: 'diseases', path: '/patient/diseases', label: 'Diseases', emoji: '🩺', section: 'main' },
  { id: 'medicines', path: '/patient/medicines', label: 'Medicines', emoji: '💊', section: 'main' },
  { id: 'tracker', path: '/patient/tracker', label: 'Daily Tracker', emoji: '📋', section: 'tracking' },
  { id: 'health', path: '/patient/health', label: 'Health Logs', emoji: '📈', section: 'tracking' },
  { id: 'symptoms', path: '/patient/symptoms', label: 'Symptoms', emoji: '🤒', section: 'tracking' },
  { id: 'visits', path: '/patient/visits', label: 'Doctor Visits', emoji: '🏥', section: 'care' },
  { id: 'reports', path: '/patient/reports', label: 'Reports & AI', emoji: '📊', section: 'care' },
  { id: 'assistant', path: '/patient/assistant', label: 'AI Assistant', emoji: '💬', section: 'care' },
]

export const CAREGIVER_NAV: NavItem[] = [
  { id: 'cg-home', path: '/caregiver', label: 'Dashboard', emoji: '🏠', section: 'overview', end: true },
  { id: 'cg-patients', path: '/caregiver/patients', label: 'My Patients', emoji: '👥', section: 'overview' },
  { id: 'cg-alerts', path: '/caregiver/alerts', label: 'Alerts', emoji: '🔔', section: 'overview' },
]

export const DOCTOR_NAV: NavItem[] = [
  { id: 'doc-home', path: '/doctor', label: 'Dashboard', emoji: '🏠', section: 'overview', end: true },
  { id: 'doc-patients', path: '/doctor/patients', label: 'My Patients', emoji: '🧑‍🤝‍🧑', section: 'overview' },
  { id: 'doc-appointments', path: '/doctor/appointments', label: 'Appointments', emoji: '🗓️', section: 'overview' },
  { id: 'doc-alerts', path: '/doctor/alerts', label: 'Alerts', emoji: '🔔', section: 'overview' },
]

export const SECTION_LABELS: Record<RoleType, Record<string, string>> = {
  patient: { main: 'Overview', tracking: 'Daily Tracking', care: 'Care & Analysis' },
  caregiver: { overview: 'Overview' },
  doctor: { overview: 'Overview' },
}

export function getNavForRole(role: RoleType): NavItem[] {
  if (role === 'caregiver') return CAREGIVER_NAV
  if (role === 'doctor') return DOCTOR_NAV
  return PATIENT_NAV
}

export function getHomePathForRole(role: RoleType): string {
  if (role === 'caregiver') return '/caregiver'
  if (role === 'doctor') return '/doctor'
  return '/patient'
}
