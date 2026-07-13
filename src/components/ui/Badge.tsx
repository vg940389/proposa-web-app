import { cn } from '../../lib/utils'
import type { ProposalStatus } from '../../types/proposal'

const statusConfig: Record<ProposalStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
  sent: { label: 'Sent', className: 'bg-blue-100 text-blue-700' },
  viewed: { label: 'Viewed', className: 'bg-yellow-100 text-yellow-700' },
  signed: { label: 'Signed', className: 'bg-green-100 text-green-700' },
  paid: { label: 'Paid', className: 'bg-emerald-100 text-emerald-700' },
  declined: { label: 'Declined', className: 'bg-red-100 text-red-700' },
}

export function Badge({
  status,
  className,
}: {
  status: ProposalStatus
  className?: string
}) {
  const config = statusConfig[status]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
