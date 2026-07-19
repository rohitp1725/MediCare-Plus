import { EmptyState } from '@/components/ui/EmptyState'
import { Card, CardBody } from '@/components/ui/Card'

export function ComingSoonPage({ emoji = '🚧', title }: { emoji?: string; title: string }) {
  return (
    <Card>
      <CardBody>
        <EmptyState icon={emoji} title={`${title} is coming soon`} description="This section is being built in the next phase of the MediCare+ rebuild." />
      </CardBody>
    </Card>
  )
}
