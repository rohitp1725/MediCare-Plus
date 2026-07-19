import { Card, CardBody } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { MedicineCard } from '@/components/medicine/MedicineCard'
import { useMyPatientId } from '@/hooks/useMyPatientId'
import { useMedicines } from '@/hooks/useMedicines'

export function PatientMedicinesPage() {
  const { patientId, isLoading: patientLoading } = useMyPatientId()
  const { medicines, isLoading: medsLoading } = useMedicines(patientId)

  if (patientLoading || medsLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} className="text-sage" />
      </div>
    )
  }

  const activeMeds = medicines.filter((m) => m.is_active)
  const inactiveMeds = medicines.filter((m) => !m.is_active)

  if (medicines.length === 0) {
    return (
      <Card>
        <CardBody>
          <EmptyState
            icon="💊"
            title="No medicines added yet"
            description="Your caregiver will add your medicines here once they're set up."
          />
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {activeMeds.length > 0 && (
        <Card>
          <CardBody>
            <h3 className="text-sm font-semibold text-ink mb-3">Active Medicines</h3>
            <div className="space-y-3">
              {activeMeds.map((m) => (
                <MedicineCard key={m.id} medicine={m} />
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {inactiveMeds.length > 0 && (
        <Card>
          <CardBody>
            <h3 className="text-sm font-semibold text-ink mb-3">Past Medicines</h3>
            <div className="space-y-3">
              {inactiveMeds.map((m) => (
                <MedicineCard key={m.id} medicine={m} />
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
