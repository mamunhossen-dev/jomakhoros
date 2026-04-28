import { useState, useMemo } from 'react';
import { Plus, TrendingUp, TrendingDown, Pencil, Trash2, FileDown, Image as ImageIcon, Lock, Wallet, ArrowLeftRight, Receipt, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionFormDialog } from '@/components/transactions/TransactionFormDialog';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import { useTransactions, useDeleteTransaction, Transaction } from '@/hooks/useTransactions';
import { useWallets } from '@/hooks/useWallets';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { exportTransactionsPdf, exportTransactionsImage } from '@/lib/exportPdf';
import { formatTaka } from '@/lib/currency';
import { toast } from 'sonner';
import { subDays } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

export default function Transactions() {
  const [formOpen, setFormOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<'income' | 'expense'>('expense');
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', categoryId: '', type: '', walletId: '' });

  const { data: allTransactions, isLoading } = useTransactions({
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    categoryId: filters.categoryId || undefined,
  });

  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: wallets } = useWallets();
  const { isFree } = useSubscription();
  const deleteMutation = useDeleteTransaction();

  // Free users: only last 15 days
  const transactions = useMemo(() => {
    if (!allTransactions) return undefined;
    let list = allTransactions;
    if (filters.type) list = list.filter(tx => tx.type === filters.type);
    if (filters.walletId) list = list.filter(tx => tx.wallet_id === filters.walletId || tx.to_wallet_id === filters.walletId);
    if (!isFree) return list;
    const cutoff = format(subDays(new Date(), 15), 'yyyy-MM-dd');
    return list.filter(tx => tx.date >= cutoff);
  }, [allTransactions, isFree, filters.type, filters.walletId]);

  const handleExportPdf = async () => {
    if (isFree) {
      toast.error('PDF এক্সপোর্ট প্রো ফিচার। আপগ্রেড করুন!');
      return;
    }
    if (!transactions?.length) return;
    try {
      await exportTransactionsPdf(transactions, profile?.display_name || '', user?.email || '', {
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
      }, wallets);
    } catch (e) {
      toast.error('PDF তৈরি করা যায়নি');
    }
  };

  const handleExportImage = async () => {
    if (isFree) {
      toast.error('ইমেজ এক্সপোর্ট প্রো ফিচার। আপগ্রেড করুন!');
      return;
    }
    if (!transactions?.length) return;
    try {
      await exportTransactionsImage(transactions, profile?.display_name || '', user?.email || '', {
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
      }, wallets);
    } catch (e) {
      toast.error('ইমেজ তৈরি করা যায়নি');
    }
  };

  const openAdd = (type: 'income' | 'expense') => {
    setEditTx(null);
    setDefaultType(type);
    setFormOpen(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditTx(tx);
    setFormOpen(true);
  };

  const summary = useMemo(() => {
    let income = 0, expense = 0, transfer = 0, count = 0;
    transactions?.forEach((tx) => {
      count++;
      if (tx.type === 'income') income += Number(tx.amount);
      else if (tx.type === 'expense') expense += Number(tx.amount);
      else transfer += Number(tx.amount);
    });
    return { income, expense, transfer, count, net: income - expense };
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/10 via-background to-success/5 p-5 sm:p-6">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-success/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-sm">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">লেনদেন</h1>
              <p className="text-sm text-muted-foreground">আপনার আয় ও ব্যয় পরিচালনা করুন।</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => openAdd('income')} className="bg-success hover:bg-success/90 shadow-sm">
              <TrendingUp className="mr-1 h-4 w-4" /> আয় যোগ
            </Button>
            <Button onClick={() => openAdd('expense')} variant="destructive" className="shadow-sm">
              <TrendingDown className="mr-1 h-4 w-4" /> ব্যয় যোগ
            </Button>
            <Button onClick={handleExportPdf} variant="outline" disabled={!transactions?.length}>
              <FileDown className="mr-1 h-4 w-4" /> PDF
            </Button>
            <Button onClick={handleExportImage} variant="outline" disabled={!transactions?.length}>
              <ImageIcon className="mr-1 h-4 w-4" /> ইমেজ
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-xl border border-success/20 bg-gradient-to-br from-success/10 to-success/5 p-4 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">মোট আয়</p>
              <p className="mt-1 font-display text-lg font-bold text-success">{formatTaka(summary.income)}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/15 text-success">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="group relative overflow-hidden rounded-xl border border-destructive/20 bg-gradient-to-br from-destructive/10 to-destructive/5 p-4 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">মোট ব্যয়</p>
              <p className="mt-1 font-display text-lg font-bold text-destructive">{formatTaka(summary.expense)}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="group relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-4 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">নিট ব্যালেন্স</p>
              <p className={`mt-1 font-display text-lg font-bold ${summary.net >= 0 ? 'text-success' : 'text-destructive'}`}>{formatTaka(summary.net)}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-muted/40 to-muted/10 p-4 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">মোট লেনদেন</p>
              <p className="mt-1 font-display text-lg font-bold">{summary.count.toLocaleString('bn-BD')}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/10 text-foreground">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="font-display text-lg">লেনদেনের ইতিহাস</CardTitle>
            <TransactionFilters filters={filters} onChange={setFilters} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !transactions?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Plus className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground">কোনো লেনদেন নেই। প্রথমটি যোগ করুন!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>তারিখ</TableHead>
                    <TableHead>বিবরণ</TableHead>
                    <TableHead>ক্যাটাগরি</TableHead>
                    <TableHead>ধরন</TableHead>
                    <TableHead>ওয়ালেট</TableHead>
                    <TableHead className="text-right">পরিমাণ</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => {
                    const isTransfer = tx.type === 'transfer';
                    const sign = tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '↔';
                    const amountColor = tx.type === 'income' ? 'text-success' : tx.type === 'expense' ? 'text-destructive' : 'text-primary';
                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {format(new Date(tx.date), 'dd MMM, yyyy')}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">
                          {tx.description || '—'}
                        </TableCell>
                        <TableCell>
                          {isTransfer ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            <Badge variant="secondary" className="text-xs font-normal">
                              {tx.category?.name || 'Uncategorized'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              tx.type === 'income' ? 'border-success/30 bg-success/10 text-success'
                              : tx.type === 'expense' ? 'border-destructive/30 bg-destructive/10 text-destructive'
                              : 'border-primary/30 bg-primary/10 text-primary'
                            }
                          >
                            {tx.type === 'income' ? 'আয়' : tx.type === 'expense' ? 'ব্যয়' : 'ট্রান্সফার'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {isTransfer ? (
                            <span className="whitespace-nowrap">
                              {tx.wallet?.name || '?'} <span className="text-muted-foreground">→</span> {tx.to_wallet?.name || '?'}
                            </span>
                          ) : (
                            <span className="whitespace-nowrap">{tx.wallet?.name || '—'}</span>
                          )}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${amountColor}`}>
                          {sign}৳{Number(tx.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {!isTransfer && (
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(tx)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(tx.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultType={defaultType}
        editTransaction={editTx}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>লেনদেন মুছে ফেলবেন?</AlertDialogTitle>
            <AlertDialogDescription>এটি পূর্বাবস্থায় ফেরানো যাবে না।</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => { if (deleteId) deleteMutation.mutate(deleteId); setDeleteId(null); }}
            >
              মুছে ফেলুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
