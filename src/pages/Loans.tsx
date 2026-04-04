import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, CheckCircle2, ArrowDownLeft, ArrowUpRight, HandCoins } from 'lucide-react';
import { useLoans, useCreateLoan, useUpdateLoan, useDeleteLoan, Loan } from '@/hooks/useLoans';
import { formatTaka } from '@/lib/currency';
import { format } from 'date-fns';

export default function Loans() {
  const [showSettled, setShowSettled] = useState(false);
  const { data: loans, isLoading } = useLoans(showSettled);
  const createMutation = useCreateLoan();
  const updateMutation = useUpdateLoan();
  const deleteMutation = useDeleteLoan();

  const [formOpen, setFormOpen] = useState(false);
  const [editLoan, setEditLoan] = useState<Loan | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [loanType, setLoanType] = useState<'dena' | 'paona'>('dena');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const openAdd = (type: 'dena' | 'paona') => {
    setEditLoan(null);
    setPersonName('');
    setAmount('');
    setLoanType(type);
    setDescription('');
    setDueDate('');
    setFormOpen(true);
  };

  const openEdit = (loan: Loan) => {
    setEditLoan(loan);
    setPersonName(loan.person_name);
    setAmount(String(loan.amount));
    setLoanType(loan.type);
    setDescription(loan.description || '');
    setDueDate(loan.due_date || '');
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (!personName.trim() || !amount) return;
    const payload = {
      person_name: personName.trim(),
      amount: parseFloat(amount),
      type: loanType,
      description: description.trim() || null,
      due_date: dueDate || null,
    };
    if (editLoan) {
      updateMutation.mutate({ id: editLoan.id, ...payload }, { onSuccess: () => setFormOpen(false) });
    } else {
      createMutation.mutate(payload, { onSuccess: () => setFormOpen(false) });
    }
  };

  const handleSettle = (id: string) => {
    updateMutation.mutate({ id, is_settled: true });
  };

  const summary = useMemo(() => {
    let totalDena = 0, totalPaona = 0;
    loans?.filter(l => !l.is_settled).forEach(l => {
      if (l.type === 'dena') totalDena += Number(l.amount);
      else totalPaona += Number(l.amount);
    });
    return { totalDena, totalPaona, net: totalPaona - totalDena };
  }, [loans]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">দেনা / পাওনা</h1>
          <p className="text-muted-foreground">আপনার ঋণ ও পাওনা পরিচালনা করুন।</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openAdd('dena')} variant="destructive">
            <ArrowUpRight className="mr-1 h-4 w-4" /> দেনা যোগ
          </Button>
          <Button onClick={() => openAdd('paona')} className="bg-success hover:bg-success/90">
            <ArrowDownLeft className="mr-1 h-4 w-4" /> পাওনা যোগ
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">মোট দেনা</p>
            <p className="text-xl font-bold font-display text-destructive">{formatTaka(summary.totalDena)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">মোট পাওনা</p>
            <p className="text-xl font-bold font-display text-success">{formatTaka(summary.totalPaona)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">নেট</p>
            <p className={`text-xl font-bold font-display ${summary.net >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatTaka(summary.net)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display text-lg">
            <HandCoins className="inline mr-2 h-4 w-4" /> ঋণ তালিকা
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="showSettled" className="text-xs text-muted-foreground">পরিশোধিত দেখান</Label>
            <Switch id="showSettled" checked={showSettled} onCheckedChange={setShowSettled} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : !loans?.length ? (
            <div className="flex flex-col items-center py-12 text-center">
              <HandCoins className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">কোনো দেনা/পাওনা নেই।</p>
            </div>
          ) : (
            <div className="space-y-3">
              {loans.map((loan) => (
                <div key={loan.id} className={`rounded-lg border p-3 ${loan.is_settled ? 'opacity-60 border-border/30' : 'border-border/50'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${loan.type === 'dena' ? 'bg-destructive/10' : 'bg-success/10'}`}>
                        {loan.type === 'dena'
                          ? <ArrowUpRight className="h-4 w-4 text-destructive" />
                          : <ArrowDownLeft className="h-4 w-4 text-success" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{loan.person_name}</p>
                          <Badge variant="outline" className={`text-[10px] ${loan.type === 'dena' ? 'border-destructive/30 text-destructive' : 'border-success/30 text-success'}`}>
                            {loan.type === 'dena' ? 'দেনা' : 'পাওনা'}
                          </Badge>
                          {loan.is_settled && <Badge variant="secondary" className="text-[10px]">পরিশোধিত</Badge>}
                        </div>
                        {loan.description && <p className="text-xs text-muted-foreground truncate">{loan.description}</p>}
                        {loan.due_date && <p className="text-xs text-muted-foreground">ফেরতের তারিখ: {format(new Date(loan.due_date), 'dd MMM, yyyy')}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-sm font-semibold ${loan.type === 'dena' ? 'text-destructive' : 'text-success'}`}>
                        {formatTaka(Number(loan.amount))}
                      </span>
                      <div className="flex gap-0.5">
                        {!loan.is_settled && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-success" onClick={() => handleSettle(loan.id)} title="পরিশোধিত">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(loan)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(loan.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{editLoan ? 'সম্পাদনা' : loanType === 'dena' ? 'দেনা যোগ করুন' : 'পাওনা যোগ করুন'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button type="button" variant={loanType === 'dena' ? 'default' : 'outline'} className={`flex-1 ${loanType === 'dena' ? 'bg-destructive hover:bg-destructive/90' : ''}`} onClick={() => setLoanType('dena')}>
                দেনা
              </Button>
              <Button type="button" variant={loanType === 'paona' ? 'default' : 'outline'} className={`flex-1 ${loanType === 'paona' ? 'bg-success hover:bg-success/90' : ''}`} onClick={() => setLoanType('paona')}>
                পাওনা
              </Button>
            </div>
            <div className="space-y-2">
              <Label>ব্যক্তির নাম</Label>
              <Input value={personName} onChange={e => setPersonName(e.target.value)} placeholder="যেমন: করিম ভাই" />
            </div>
            <div className="space-y-2">
              <Label>পরিমাণ (৳)</Label>
              <Input type="number" min="1" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>ফেরতের তারিখ (ঐচ্ছিক)</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>বিবরণ (ঐচ্ছিক)</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="কিসের জন্য?" />
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={isPending}>
              {isPending ? 'সংরক্ষণ হচ্ছে...' : editLoan ? 'আপডেট করুন' : 'যোগ করুন'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>মুছে ফেলবেন?</AlertDialogTitle>
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
