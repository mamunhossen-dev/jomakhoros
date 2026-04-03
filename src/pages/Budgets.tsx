import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Wallet } from 'lucide-react';
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useTransactions';
import { useTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/contexts/AuthContext';
import { formatTaka } from '@/lib/currency';
import { getMonth, getYear } from 'date-fns';

const MONTH_NAMES = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

export default function Budgets() {
  const now = new Date();
  const [month, setMonth] = useState(getMonth(now) + 1);
  const [year, setYear] = useState(getYear(now));
  const { data: budgets, isLoading } = useBudgets(month, year);
  const { data: categories } = useCategories('expense');
  const { data: transactions } = useTransactions();
  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();
  const deleteMutation = useDeleteBudget();

  const [formOpen, setFormOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<{ id: string; amount: string } | null>(null);
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Calculate spending per category for the selected month/year
  const spendingMap = useMemo(() => {
    const map = new Map<string, number>();
    transactions?.forEach((tx) => {
      if (tx.type === 'expense') {
        const d = new Date(tx.date);
        if (getMonth(d) + 1 === month && getYear(d) === year && tx.category_id) {
          map.set(tx.category_id, (map.get(tx.category_id) || 0) + Number(tx.amount));
        }
      }
    });
    return map;
  }, [transactions, month, year]);

  const usedCategoryIds = new Set(budgets?.map(b => b.category_id));
  const availableCategories = categories?.filter(c => !usedCategoryIds.has(c.id));

  const handleCreate = () => {
    if (!newCategoryId || !newAmount) return;
    createMutation.mutate({ category_id: newCategoryId, amount: parseFloat(newAmount), month, year }, {
      onSuccess: () => { setFormOpen(false); setNewCategoryId(''); setNewAmount(''); }
    });
  };

  const handleUpdate = () => {
    if (!editBudget) return;
    updateMutation.mutate({ id: editBudget.id, amount: parseFloat(editBudget.amount) }, {
      onSuccess: () => setEditBudget(null)
    });
  };

  const totalBudget = budgets?.reduce((s, b) => s + Number(b.amount), 0) || 0;
  const totalSpent = budgets?.reduce((s, b) => s + (spendingMap.get(b.category_id) || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">বাজেট</h1>
          <p className="text-muted-foreground">মাসিক বাজেট সেট করুন এবং খরচ ট্র্যাক করুন।</p>
        </div>
        <div className="flex gap-2">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[year - 1, year, year + 1].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setFormOpen(true)}><Plus className="mr-1 h-4 w-4" /> বাজেট যোগ</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">মোট বাজেট</p>
            <p className="text-xl font-bold font-display text-primary">{formatTaka(totalBudget)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">মোট খরচ</p>
            <p className="text-xl font-bold font-display text-destructive">{formatTaka(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">অবশিষ্ট</p>
            <p className={`text-xl font-bold font-display ${totalBudget - totalSpent >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatTaka(totalBudget - totalSpent)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget list */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            <Wallet className="inline mr-2 h-4 w-4" />
            {MONTH_NAMES[month - 1]} {year} — বাজেট তালিকা
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : !budgets?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="mx-auto mb-2 h-8 w-8 opacity-40" />
              <p className="text-sm">কোনো বাজেট সেট করা হয়নি। প্রথমটি যোগ করুন!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {budgets.map((b) => {
                const spent = spendingMap.get(b.category_id) || 0;
                const pct = Number(b.amount) > 0 ? Math.min((spent / Number(b.amount)) * 100, 100) : 0;
                const over = spent > Number(b.amount);
                return (
                  <div key={b.id} className="rounded-lg border border-border/50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{b.category?.name || 'ক্যাটাগরি'}</span>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditBudget({ id: b.id, amount: String(b.amount) })}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(b.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Progress value={pct} className={`h-2 ${over ? '[&>div]:bg-destructive' : '[&>div]:bg-success'}`} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>খরচ: {formatTaka(spent)}</span>
                      <span>বাজেট: {formatTaka(Number(b.amount))}</span>
                    </div>
                    {over && <p className="text-xs text-destructive font-medium">⚠️ বাজেট অতিক্রম করেছে!</p>}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display">বাজেট যোগ করুন</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ক্যাটাগরি</Label>
              <Select value={newCategoryId} onValueChange={setNewCategoryId}>
                <SelectTrigger><SelectValue placeholder="ক্যাটাগরি নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>
                  {availableCategories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>বাজেট পরিমাণ (৳)</Label>
              <Input type="number" min="1" step="0.01" value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="0.00" />
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'সংরক্ষণ হচ্ছে...' : 'যোগ করুন'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editBudget} onOpenChange={() => setEditBudget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display">বাজেট সম্পাদনা</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>বাজেট পরিমাণ (৳)</Label>
              <Input type="number" min="1" step="0.01" value={editBudget?.amount || ''} onChange={e => setEditBudget(prev => prev ? { ...prev, amount: e.target.value } : null)} />
            </div>
            <Button className="w-full" onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'আপডেট হচ্ছে...' : 'আপডেট করুন'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>বাজেট মুছে ফেলবেন?</AlertDialogTitle>
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
