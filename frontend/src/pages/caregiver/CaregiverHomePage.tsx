import { Link } from 'react-router-dom'
import { differenceInYears } from 'date-fns'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { useCaregiverHome } from '@/hooks/useCaregiverHome'
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications'
import { useAuth } from '@/context/AuthContext'

export function CaregiverHomePage() {
  const { profile } = useAuth()
  const { isLoading, isError, data } = useCaregiverHome()
  const { data: unreadCount = 0 } = useUnreadNotifications()

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} className="text-sage" />
      </div>
    )
  }

  if (isError) {
    return <EmptyState icon="⚠️" title="Couldn't load your dashboard" description="Please refresh the page." />
  }

  const patients = data?.patients ?? []

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg text-ink">Hello, {profile?.fullName?.split(' ')[0]} 👋</h3>
        <p className="text-sm text-slate-light mt-1">Here's an overview of the patients you care for.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon="👥" value={patients.length} label="PATIENTS UNDER YOUR CARE" accent="sage" />
        <StatCard icon="💊" value={data?.lowStockCount ?? 0} label="MEDICINES RUNNING LOW" accent="amber" />
        <StatCard icon="🔔" value={unreadCount} label="UNREAD ALERTS" accent="rose" />
      </div>

      <Card>
        <CardHeader
          title="My Patients"
          subtitle={patients.length > 0 ? `${patients.length} patient${patients.length > 1 ? 's' : ''}` : undefined}
          right={
            <Link to="/caregiver/patients">
              <Button variant="secondary" size="sm">
                Manage patients
              </Button>
            </Link>
          }
        />
        <CardBody>
          {patients.length === 0 ? (
            <EmptyState
              icon="👥"
              title="No patients linked yet"
              description="Add a patient to start tracking their medicines, vitals, and appointments."
              action={
                <Link to="/caregiver/patients">
                  <Button>Add your first patient</Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {patients.map((p) => (
                <div key={p.patientId} className="flex items-center gap-3 border border-border rounded-sm p-3">
                  <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center text-lg shrink-0">
                    {p.avatarEmoji}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{p.fullName}</p>
                    <p className="text-xs text-slate-light">
                      {p.dob ? `${differenceInYears(new Date(), new Date(p.dob))} years` : 'Age not set'}
                      {!p.isActive && ' · Inactive'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
