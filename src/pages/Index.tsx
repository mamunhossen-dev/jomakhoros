import { lazy, Suspense, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, ArrowUpDown, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTransactions } from '@/hooks/useTransactions';
import { useWallets } from '@/hooks/useWallets';
import { TransactionFormDialog } from '@/components/transactions/TransactionFormDialog';
import { formatTaka } from '@/lib/currency';
import { addMonths, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const IncomeExpenseChart = lazy(() =>
  import('@/components/dashboard/IncomeExpenseChart').then((module) => ({ default: module.IncomeExpenseChart }))
);

export default function Index() {
  const { data: transactions, isLoading } = useTransactions();
  const { data: wallets } = useWallets();
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<'income' | 'expense'>('expense');

  const openAdd = (type: 'income' | 'expense') => {
    setDefaultType(type);
    setFormOpen(true);
  };

  const { totalIncome, totalExpense, balance, recentTxs, chartData } = useMemo(() => {
    if (!transactions) return { totalIncome: 0, totalExpense: 0, balance: 0, recentTxs: [], chartData: [] };

    let totalIncome = 0, totalExpense = 0;
    transactions.forEach((tx) => {
      if (tx.type === 'income') totalIncome += Number(tx.amount);
      else if (tx.type === 'expense') totalExpense += Number(tx.amount);
    });

    const recentTxs = transactions.filter((tx) => tx.type !== 'transfer').slice(0, 5);

    const months: { key: string; label: string; income: number; expense: number; savings: number }[] = [];
    for (let i = -3; i <= 3; i++) {
      const d = addMonths(new Date(), i);
      months.push({ key: format(d, 'yyyy-MM'), label: format(d, 'MMM'), income: 0, expense: 0, savings: 0 });
    }
    const monthMap = new Map(months.map((m) => [m.key, m]));
    transactions.forEach((tx) => {
      const bucket = monthMap.get(tx.date.substring(0, 7));
      if (bucket) {
        if (tx.type === 'income') bucket.income += Number(tx.amount);
        else if (tx.type === 'expense') bucket.expense += Number(tx.amount);
      }
    });

    months.forEach((month) => {
      month.savings = month.income - month.expense;
    });

    return { totalIncome, totalExpense, balance: totalIncome - totalExpense, recentTxs, chartData: months };
  }, [transactions]);

  const stats = [
    { label: 'মোট ব্যালেন্স', value: formatTaka(balance), icon: Wallet, color: 'text-primary' },
    { label: 'মোট আয়', value: formatTaka(totalIncome), icon: TrendingUp, color: 'text-success' },
    { label: 'মোট ব্যয়', value: formatTaka(totalExpense), icon: TrendingDown, color: 'text-destructive' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">ড্যাশবোর্ড</h1>
          <p className="text-muted-foreground">স্বাগতম! আপনার আর্থিক সারসংক্ষেপ দেখুন।</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openAdd('income')} className="bg-success hover:bg-success/90">
            <TrendingUp className="mr-1 h-4 w-4" /> আয় যোগ
          </Button>
          <Button onClick={() => openAdd('expense')} variant="destructive">
            <TrendingDown className="mr-1 h-4 w-4" /> ব্যয় যোগ
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) =>
          isLoading ? (
            <Skeleton key={stat.label} className="h-[104px] rounded-lg" />
          ) : (
            <Card key={stat.label} className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold font-display ${stat.color}`}>{stat.value}</div>
              </CardContent>
            </Card>
          )
        )}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display text-lg">আমার ওয়ালেট</CardTitle>
          <button onClick={() => navigate('/wallets')} className="text-xs text-primary hover:underline">ম্যানেজ করুন</button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
            </div>
          ) : !wallets?.length ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Smartphone className="mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">কোনো ওয়ালেট নেই</p>
              <button onClick={() => navigate('/wallets')} className="mt-2 text-xs text-primary hover:underline">ওয়ালেট যোগ করুন</button>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {wallets.map((w) => (
                  <div key={w.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Wallet className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{w.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{w.wallet_type}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 text-sm font-semibold ${Number(w.balance) >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatTaka(Number(w.balance))}
                    </span>
                  </div>
                ))}
              </div>
              {(() => {
                const total = wallets.reduce((s, w) => s + Number(w.balance), 0);
                return (
                  <div className="mt-4 flex items-center justify-between rounded-lg border-2 border-primary/20 bg-primary/5 px-4 py-3">
                    <span className="text-sm font-semibold">সকল ওয়ালেটের মোট ব্যালেন্স</span>
                    <span className={`font-display text-lg font-bold ${total >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatTaka(total)}
                    </span>
                  </div>
                );
              })()}
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-lg">আয়, ব্যয় ও সেভিং</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <Suspense fallback={<Skeleton className="h-[270px] w-full" />}>
                <IncomeExpenseChart data={chartData} />
              </Suspense>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-lg">সাম্প্রতিক লেনদেন</CardTitle>
            <button onClick={() => navigate('/transactions')} className="text-xs text-primary hover:underline">সব দেখুন</button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : !recentTxs.length ? (
              <div className="flex flex-col items-center py-8 text-center">
                <ArrowUpDown className="mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">কোনো লেনদেন নেই</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTxs.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tx.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                        {tx.type === 'income' ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{tx.description || tx.category?.name || 'লেনদেন'}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(tx.date), 'dd MMM, yyyy')}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 text-sm font-semibold ${tx.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                      {tx.type === 'income' ? '+' : '-'}৳{Number(tx.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TransactionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultType={defaultType}
        editTransaction={null}
      />
    </div>
  );
}
