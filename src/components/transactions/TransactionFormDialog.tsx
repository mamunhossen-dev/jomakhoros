import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories, useCreateTransaction, useUpdateTransaction, Transaction } from '@/hooks/useTransactions';
import { useWallets } from '@/hooks/useWallets';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: 'income' | 'expense';
  editTransaction?: Transaction | null;
}

export function TransactionFormDialog({ open, onOpenChange, defaultType = 'expense', editTransaction }: Props) {
  const [type, setType] = useState<'income' | 'expense'>(defaultType);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: categories } = useCategories(type);
  const { data: wallets } = useWallets();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();

  const isEdit = !!editTransaction && editTransaction.type !== 'transfer';

  useEffect(() => {
    if (editTransaction && editTransaction.type !== 'transfer') {
      setType(editTransaction.type);
      setAmount(String(editTransaction.amount));
      setCategoryId(editTransaction.category_id || '');
      setWalletId(editTransaction.wallet_id || '');
      setDescription(editTransaction.description || '');
      setDate(editTransaction.date);
    } else {
      setType(defaultType);
      setAmount('');
      setCategoryId('');
      setWalletId('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [editTransaction, defaultType, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletId) {
      toast.error('একটি ওয়ালেট নির্বাচন করুন');
      return;
    }
    if (!categoryId) {
      toast.error('একটি ক্যাটাগরি নির্বাচন করুন');
      return;
    }
    const payload = {
      amount: parseFloat(amount),
      type,
      category_id: categoryId || null,
      wallet_id: walletId,
      to_wallet_id: null,
      description: description.trim() || null,
      date,
    };

    if (isEdit && editTransaction) {
      updateMutation.mutate({ ...payload, id: editTransaction.id }, { onSuccess: () => onOpenChange(false) });
    } else {
      createMutation.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const noWallets = wallets && wallets.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEdit ? 'লেনদেন সম্পাদনা' : type === 'income' ? 'আয় যোগ করুন' : 'ব্যয় যোগ করুন'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === 'income' ? 'default' : 'outline'}
              className={type === 'income' ? 'bg-success hover:bg-success/90 flex-1' : 'flex-1'}
              onClick={() => { setType('income'); setCategoryId(''); }}
            >
              আয়
            </Button>
            <Button
              type="button"
              variant={type === 'expense' ? 'default' : 'outline'}
              className={type === 'expense' ? 'bg-destructive hover:bg-destructive/90 flex-1' : 'flex-1'}
              onClick={() => { setType('expense'); setCategoryId(''); }}
            >
              ব্যয়
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">পরিমাণ (৳)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">ক্যাটাগরি</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="ক্যাটাগরি নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wallet">ওয়ালেট</Label>
            <Select value={walletId} onValueChange={setWalletId}>
              <SelectTrigger>
                <SelectValue placeholder={noWallets ? 'প্রথমে একটি ওয়ালেট যোগ করুন' : 'ওয়ালেট নির্বাচন করুন'} />
              </SelectTrigger>
              <SelectContent>
                {wallets?.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name} (৳{Number(w.balance).toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {noWallets && (
              <p className="text-xs text-destructive">লেনদেন যোগ করতে আগে একটি ওয়ালেট তৈরি করুন।</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">তারিখ</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">বিবরণ (ঐচ্ছিক)</Label>
            <Textarea
              id="description"
              placeholder="এটি কিসের জন্য ছিল?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending || noWallets}>
            {isPending ? 'সংরক্ষণ হচ্ছে...' : isEdit ? 'আপডেট করুন' : 'যোগ করুন'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
