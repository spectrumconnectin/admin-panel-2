import { statusColor, capitalize } from '@/lib/utils';

interface BadgeProps {
  status: string;
  label?: string;
}

export default function Badge({ status, label }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(status)}`}>
      {label ?? capitalize(status)}
    </span>
  );
}
