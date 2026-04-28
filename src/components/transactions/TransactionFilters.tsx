import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useCategories } from '@/hooks/useTransactions';
import { useWallets } from '@/hooks/useWallets';

interface Filters {
  dateFrom: string;
  dateTo: string;
  categoryId: string;
  type: string;
  walletId: string;
}

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function TransactionFilters({ filters, onChange }: Props) {
  const { data: categories } = useCategories();
  const { data: wallets } = useWallets();

  const hasFilters = filters.dateFrom || filters.dateTo || filters.categoryId || filters.type || filters.walletId;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">থেকে</Label>
        <Input type="date" className="h-9 w-[150px]" value={filters.dateFrom} onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">পর্যন্ত</Label>
        <Input type="date" className="h-9 w-[150px]" value={filters.dateTo} onChange={(e) => onChange({ ...filters, dateTo: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">ধরন</Label>
        <Select value={filters.type || 'all'} onValueChange={(v) => onChange({ ...filters, type: v === 'all' ? '' : v })}>
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue placeholder="সব ধরন" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব ধরন</SelectItem>
            <SelectItem value="income">আয়</SelectItem>
            <SelectItem value="expense">ব্যয়</SelectItem>
            <SelectItem value="transfer">ট্রান্সফার</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">ক্যাটাগরি</Label>
        <Select value={filters.categoryId || 'all'} onValueChange={(v) => onChange({ ...filters, categoryId: v === 'all' ? '' : v })}>
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="সব ক্যাটাগরি" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব ক্যাটাগরি</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">ওয়ালেট</Label>
        <Select value={filters.walletId || 'all'} onValueChange={(v) => onChange({ ...filters, walletId: v === 'all' ? '' : v })}>
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="সব ওয়ালেট" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব ওয়ালেট</SelectItem>
            {wallets?.map((w) => (
              <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => onChange({ dateFrom: '', dateTo: '', categoryId: '', type: '', walletId: '' })}>
          <X className="mr-1 h-3 w-3" /> মুছুন
        </Button>
      )}
    </div>
  );
}
