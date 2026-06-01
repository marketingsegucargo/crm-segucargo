import { cn } from '../../lib/utils'

interface Props {
  label: string
  className?: string
}

export default function Badge({ label, className }: Props) {
  return <span className={cn('badge', className)}>{label}</span>
}
