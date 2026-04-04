import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, Wallet, Smartphone } from 'lucide-react';
import { useWallets, useCreateWallet, useUpdateWallet, useDeleteWallet, Wallet as WalletType } from '@/hooks/useWallets';
import { formatTaka } from '@/lib/currency';

const WALLET_TYPES = [
  { value: 'bkash', label: 'বিকাশ', color: 'bg-pink-500' },
  { value: 'nagad', label: 'নগদ', color: 'bg-orange-500' },
  { value: 'rocket', label: 'রকেট', color: 'bg-purple-500' },
  { value: 'upay', label: 'উপায়', color: 'bg-blue-500' },
  { value: 'tap', label: 'ট্যাপ', color: 'bg-teal-500' },
  { value: 'bank', label: 'ব্যাংক', color: 'bg-green-700' },
  { value: 'cash', label: 'নগদ টাকা', color: 'bg-emerald-600' },
  { value: 'other', label: 'অন্যান্য', color: 'bg-gray-500' },
];

function getWalletMeta(type: string) {
  return WALLET_TYPES.find(w => w.value === type) || WALLET_TYPES[WALLET_TYPES.length - 1];
}

export default function Wallets() {
  const { data: wallets, isLoading } = useWallets();
  const createMutation = useCreateWallet();
  const updateMutation = useUpdateWallet();
  const deleteMutation = useDeleteWallet();

  const [formOpen, setFormOpen] = useState(false);
  const [editWallet, setEditWallet] = useState<WalletType | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [walletType, setWalletType] = useState('bkash');
  const [balance, setBalance] = useState('');

  const openAdd = () => {
    setEditWallet(null);
    setName('');
    setWalletType('bkash');
    setBalance('');
    setFormOpen(true);
  };

  const openEdit = (w: WalletType) => {
    setEditWallet(w);
    setName(w.name);
    setWalletType(w.wallet_type);
    setBalance(String(w.balance));
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (!name.trim() || !balance) return;
    if (editWallet) {
      updateMutation.mutate({ id: editWallet.id, name: name.trim(), wallet_type: walletType, balance: parseFloat(balance) }, {
        onSuccess: () => setFormOpen(false)
      });
    } else {
      createMutation.mutate({ name: name.trim(), wallet_type: walletType, balance: parseFloat(balance) }, {
        onSuccess: () => setFormOpen(false)
      });
    }
  };

  const totalBalance = wallets?.reduce((s, w) => s + Number(w.balance), 0) || 0;
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">ওয়ালেট ও ব্যাংক</h1>
          <p className="text-muted-foreground">আপনার সব ওয়ালেট ও ব্যাংক অ্যাকাউন্টের ব্যালেন্স ট্র্যাক করুন।</p>
        </div>
        <Button onClick={openAdd}><Plus className="mr-1 h-4 w-4" /> ওয়ালেট যোগ</Button>
      </div>

      {/* Total balance */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">সর্বমোট ব্যালেন্স</p>
              <p className="text-2xl font-bold font-display text-primary">{formatTaka(totalBalance)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallets grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[120px] rounded-lg" />)}
        </div>
      ) : !wallets?.length ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Smartphone className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">কোনো ওয়ালেট নেই। প্রথমটি যোগ করুন!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wallets.map((w) => {
            const meta = getWalletMeta(w.wallet_type);
            return (
              <Card key={w.id} className="border-0 shadow-sm overflow-hidden">
                <div className={`h-1.5 ${meta.color}`} />
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{w.name}</p>
                      <p className="text-xs text-muted-foreground">{meta.label}</p>
                      <p className={`text-xl font-bold font-display mt-2 ${Number(w.balance) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatTaka(Number(w.balance))}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(w)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(w.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{editWallet ? 'ওয়ালেট সম্পাদনা' : 'ওয়ালেট যোগ করুন'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ধরন</Label>
              <Select value={walletType} onValueChange={setWalletType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WALLET_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>নাম</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="যেমন: ব্যক্তিগত বিকাশ" />
            </div>
            <div className="space-y-2">
              <Label>বর্তমান ব্যালেন্স (৳)</Label>
              <Input type="number" step="0.01" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0.00" />
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={isPending}>
              {isPending ? 'সংরক্ষণ হচ্ছে...' : editWallet ? 'আপডেট করুন' : 'যোগ করুন'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ওয়ালেট মুছে ফেলবেন?</AlertDialogTitle>
            <AlertDialogDescription>এটি পূর্বাবস্থায় ফেরানো যাবে না।</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => { if (deleteId) deleteMutation.mutate(deleteId); setDeleteId(null); }}>
              মুছে ফেলুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
