import { useState, useMemo } from 'react';
import { Plus, TrendingUp, TrendingDown, Pencil, Trash2, FileDown, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionFormDialog } from '@/components/transactions/TransactionFormDialog';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import { useTransactions, useDeleteTransaction, Transaction } from '@/hooks/useTransactions';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { exportTransactionsPdf } from '@/lib/exportPdf';
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
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', categoryId: '' });

  const { data: transactions, isLoading } = useTransactions({
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    categoryId: filters.categoryId || undefined,
  });

  const { user } = useAuth();
  const { data: profile } = useProfile();
  const deleteMutation = useDeleteTransaction();

  const handleExportPdf = () => {
    if (!transactions?.length) return;
    exportTransactionsPdf(transactions, profile?.display_name || '', user?.email || '', {
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    });
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">লেনদেন</h1>
          <p className="text-muted-foreground">আপনার আয় ও ব্যয় পরিচালনা করুন।</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openAdd('income')} className="bg-success hover:bg-success/90">
            <TrendingUp className="mr-1 h-4 w-4" /> আয় যোগ
          </Button>
          <Button onClick={() => openAdd('expense')} variant="destructive">
            <TrendingDown className="mr-1 h-4 w-4" /> ব্যয় যোগ
          </Button>
          <Button onClick={handleExportPdf} variant="outline" disabled={!transactions?.length}>
            <FileDown className="mr-1 h-4 w-4" /> PDF
          </Button>
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
                    <TableHead className="text-right">পরিমাণ</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {format(new Date(tx.date), 'dd MMM, yyyy')}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">
                        {tx.description || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs font-normal">
                          {tx.category?.name || 'Uncategorized'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={tx.type === 'income'
                            ? 'border-success/30 bg-success/10 text-success'
                            : 'border-destructive/30 bg-destructive/10 text-destructive'}
                        >
                          {tx.type === 'income' ? 'আয়' : 'ব্যয়'}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${tx.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                        {tx.type === 'income' ? '+' : '-'}৳{Number(tx.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(tx)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(tx.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
