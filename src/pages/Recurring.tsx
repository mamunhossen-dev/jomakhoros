import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, Repeat, Pause, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useRecurring, useCreateRecurring, useUpdateRecurring, useDeleteRecurring, type Frequency, type Recurring } from '@/hooks/useRecurring';
import { useCategories } from '@/hooks/useTransactions';
import { useWallets } from '@/hooks/useWallets';
import { formatTaka } from '@/lib/currency';
import { PageMeta } from '@/components/PageMeta';
import { useFeatureFlag } from '@/hooks/useFeatureFlags';
import { Navigate } from 'react-router-dom';

const FREQ_LABEL: Record<Frequency, string> = {
  daily: 'প্রতিদিন',
  weekly: 'সাপ্তাহিক',
  monthly: 'মাসিক',
  yearly: 'বার্ষিক',
};

const todayISO = () => new Date().toISOString().slice(0, 10);

type FormState = {
  type: 'income' | 'expense';
  amount: string;
  category_id: string;
  wallet_id: string;
  description: string;
  frequency: Frequency;
  interval_count: string;
  next_run_date: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

const blankForm = (): FormState => ({
  type: 'expense',
  amount: '',
  category_id: '',
  wallet_id: '',
  description: '',
  frequency: 'monthly',
  interval_count: '1',
  next_run_date: todayISO(),
  start_date: todayISO(),
  end_date: '',
  is_active: true,
});

export default function RecurringPage() {
  const { enabled: featureEnabled, isLoading: flagLoading } = useFeatureFlag('recurring_transactions', true);
  const { data: items = [], isLoading } = useRecurring();
  const { data: categories = [] } = useCategories();
  const { data: wallets = [] } = useWallets();
  const createMut = useCreateRecurring();
  const updateMut = useUpdateRecurring();
  const deleteMut = useDeleteRecurring();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Recurring | null>(null);
  const [form, setForm] = useState<FormState>(blankForm());

  const openCreate = () => {
    setEditing(null);
    setForm(blankForm());
    setOpen(true);
  };
  const openEdit = (r: Recurring) => {
    setEditing(r);
    setForm({
      type: r.type,
      amount: String(r.amount),
      category_id: r.category_id ?? '',
      wallet_id: r.wallet_id ?? '',
      description: r.description ?? '',
      frequency: r.frequency,
      interval_count: String(r.interval_count),
      next_run_date: r.next_run_date,
      start_date: r.start_date,
      end_date: r.end_date ?? '',
      is_active: r.is_active,
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    const amt = Number(form.amount);
    if (!amt || amt <= 0) return;
    const payload = {
      type: form.type,
      amount: amt,
      category_id: form.category_id || null,
      wallet_id: form.wallet_id || null,
      description: form.description.trim() || null,
      frequency: form.frequency,
      interval_count: Math.max(1, Number(form.interval_count) || 1),
      next_run_date: form.next_run_date,
      start_date: form.start_date,
      end_date: form.end_date || null,
      is_active: form.is_active,
    };
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createMut.mutateAsync(payload);
    }
    setOpen(false);
  };

  const filteredCategories = categories.filter((c: any) => c.type === form.type);

  if (!flagLoading && !featureEnabled) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <PageMeta title="পুনরাবৃত্তি লেনদেন | JomaKhoros" description="মাসিক, সাপ্তাহিক বা বার্ষিক স্বয়ংক্রিয় লেনদেন সেট করুন।" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Repeat className="h-6 w-6 text-primary" /> পুনরাবৃত্তি লেনদেন
          </h1>
          <p className="text-sm text-muted-foreground">নিয়মিত আয়/ব্যয় টেমপ্লেট সেট করুন — সিস্টেম স্বয়ংক্রিয়ভাবে যোগ করবে।</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> নতুন
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>
      ) : items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <Repeat className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">এখনো কোনো পুনরাবৃত্তি সেট করা নেই।</p>
            <Button className="mt-4" onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" /> প্রথমটি যোগ করুন
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((r) => {
            const cat = categories.find((c: any) => c.id === r.category_id);
            const wal = wallets.find((w) => w.id === r.wallet_id);
            return (
              <Card key={r.id} className={r.is_active ? '' : 'opacity-60'}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Badge variant={r.type === 'income' ? 'default' : 'destructive'} className="text-[10px]">
                          {r.type === 'income' ? 'আয়' : 'ব্যয়'}
                        </Badge>
                        {formatTaka(r.amount)}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {FREQ_LABEL[r.frequency]}
                        {r.interval_count > 1 ? ` (প্রতি ${r.interval_count}বার)` : ''}
                        {cat ? ` • ${cat.name}` : ''}
                        {wal ? ` • ${wal.name}` : ''}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => updateMut.mutate({ id: r.id, is_active: !r.is_active })}>
                        {r.is_active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>মুছে ফেলবেন?</AlertDialogTitle>
                            <AlertDialogDescription>এই পুনরাবৃত্তি টেমপ্লেট মুছে ফেলা হবে। আগের তৈরি লেনদেন থাকবে।</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>বাতিল</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMut.mutate(r.id)}>হ্যাঁ, মুছুন</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-0.5 pt-0">
                  {r.description && <p className="truncate">📝 {r.description}</p>}
                  <p>পরবর্তী: <span className="font-medium text-foreground">{format(new Date(r.next_run_date), 'dd MMM yyyy')}</span></p>
                  {r.end_date && <p>শেষ: {format(new Date(r.end_date), 'dd MMM yyyy')}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'পুনরাবৃত্তি সম্পাদনা' : 'নতুন পুনরাবৃত্তি'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">ধরন</Label>
                <Select value={form.type} onValueChange={(v: 'income' | 'expense') => setForm({ ...form, type: v, category_id: '' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">ব্যয়</SelectItem>
                    <SelectItem value="income">আয়</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">পরিমাণ (৳)</Label>
                <Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">ক্যাটাগরি</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="বেছে নিন" /></SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">ওয়ালেট (ঐচ্ছিক)</Label>
              <Select value={form.wallet_id} onValueChange={(v) => setForm({ ...form, wallet_id: v })}>
                <SelectTrigger><SelectValue placeholder="বেছে নিন" /></SelectTrigger>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">ফ্রিকোয়েন্সি</Label>
                <Select value={form.frequency} onValueChange={(v: Frequency) => setForm({ ...form, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">দৈনিক</SelectItem>
                    <SelectItem value="weekly">সাপ্তাহিক</SelectItem>
                    <SelectItem value="monthly">মাসিক</SelectItem>
                    <SelectItem value="yearly">বার্ষিক</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">প্রতি Nবার</Label>
                <Input type="number" min="1" value={form.interval_count} onChange={(e) => setForm({ ...form, interval_count: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">পরবর্তী চালানোর তারিখ</Label>
                <Input type="date" value={form.next_run_date} onChange={(e) => setForm({ ...form, next_run_date: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">শেষ তারিখ (ঐচ্ছিক)</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">বিবরণ</Label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="যেমন: বাড়ি ভাড়া" />
            </div>

            <Button className="w-full" onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
              {editing ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
