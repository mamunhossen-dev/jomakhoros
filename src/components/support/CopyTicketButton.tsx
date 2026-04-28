import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CopyTicketButtonProps {
  value: string;
  className?: string;
  size?: number;
}

export function CopyTicketButton({ value, className, size = 12 }: CopyTicketButtonProps) {
  const [copied, setCopied] = useState(false);

  const handle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('কপি হয়েছে!', { duration: 1500 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('কপি করা যায়নি');
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      title={copied ? 'কপি হয়েছে!' : 'টিকেট আইডি কপি করুন'}
      aria-label="Copy ticket ID"
      className={cn(
        'inline-flex h-5 w-5 items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0',
        copied && 'text-green-600 hover:text-green-600',
        className,
      )}
    >
      {copied ? <Check style={{ width: size, height: size }} /> : <Copy style={{ width: size, height: size }} />}
    </button>
  );
}
