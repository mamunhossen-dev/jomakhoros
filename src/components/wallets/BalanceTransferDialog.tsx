import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRightLeft } from 'lucide-react';
import { useWallets } from '@/hooks/useWallets';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BalanceTransferDialog({ open, onOpenChange }: Props) {
  const { data: wallets } = useWallets();
  const createMutation = useCreateTransaction();

  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const reset = () => {
    setFromId(''); setToId(''); setAmount(''); setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromId || !toId) { toast.error('উৎস ও গন্তব্য ওয়ালেট নির্বাচন করুন'); return; }
    if (fromId === toId) { toast.error('উৎস ও গন্তব্য একই ওয়ালেট হতে পারে না'); return; }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('সঠিক পরিমাণ লিখুন'); return; }

    const fromWallet = wallets?.find(w => w.id === fromId);
    if (fromWallet && Number(fromWallet.balance) < amt) {
      toast.error('উৎস ওয়ালেটে যথেষ্ট ব্যালেন্স নেই');
      return;
    }

    createMutation.mutate({
      amount: amt,
      type: 'transfer',
      category_id: null,
      wallet_id: fromId,
      to_wallet_id: toId,
      description: description.trim() || null,
      date,
    }, {
      onSuccess: () => { reset(); onOpenChange(false); },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-primary" /> ব্যালেন্স ট্রান্সফার
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>উৎস ওয়ালেট (থেকে)</Label>
            <Select value={fromId} onValueChange={setFromId}>
              <SelectTrigger><SelectValue placeholder="উৎস নির্বাচন করুন" /></SelectTrigger>
              <SelectContent>
                {wallets?.map(w => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name} (৳{Number(w.balance).toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>গন্তব্য ওয়ালেট (যেখানে)</Label>
            <Select value={toId} onValueChange={setToId}>
              <SelectTrigger><SelectValue placeholder="গন্তব্য নির্বাচন করুন" /></SelectTrigger>
              <SelectContent>
                {wallets?.filter(w => w.id !== fromId).map(w => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name} (৳{Number(w.balance).toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>পরিমাণ (৳)</Label>
            <Input type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>তারিখ</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>বিবরণ (ঐচ্ছিক)</Label>
            <Textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="যেমন: বিকাশ থেকে ব্যাংকে স্থানান্তর" />
          </div>

          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'প্রসেসিং...' : 'ট্রান্সফার করুন'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
