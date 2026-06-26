import { Info } from 'lucide-react';
import { COMPLIANCE_DISCLAIMER } from '@/lib/constants';
import { cn } from '@/lib/utils';

/** Mandatory compliance disclaimer shown wherever signals are presented. */
export function ComplianceDisclaimer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200/90',
        className,
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0" />
      <p>{COMPLIANCE_DISCLAIMER}</p>
    </div>
  );
}
