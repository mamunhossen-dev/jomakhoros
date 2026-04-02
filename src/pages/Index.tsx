import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTransactions } from '@/hooks/useTransactions';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function Index() {
  const { data: transactions, isLoading } = useTransactions();
  const navigate = useNavigate();

  const { totalIncome, totalExpense, balance, recentTxs, chartData } = useMemo(() => {
    if (!transactions) return { totalIncome: 0, totalExpense: 0, balance: 0, recentTxs: [], chartData: [] };

    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach((tx) => {
      if (tx.type === 'income') totalIncome += Number(tx.amount);
      else totalExpense += Number(tx.amount);
    });

    const recentTxs = transactions.slice(0, 5);

    // Build last 6 months chart data
    const months: { key: string; label: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      months.push({
        key: format(d, 'yyyy-MM'),
        label: format(d, 'MMM'),
        income: 0,
        expense: 0,
      });
    }

    const monthMap = new Map(months.map((m) => [m.key, m]));
    transactions.forEach((tx) => {
      const key = tx.date.substring(0, 7);
      const bucket = monthMap.get(key);
      if (bucket) {
        if (tx.type === 'income') bucket.income += Number(tx.amount);
        else bucket.expense += Number(tx.amount);
      }
    });

    return { totalIncome, totalExpense, balance: totalIncome - totalExpense, recentTxs, chartData: months };
  }, [transactions]);

  const fmt = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const stats = [
    { label: 'Total Balance', value: fmt(balance), icon: Wallet, color: 'text-primary' },
    { label: 'Total Income', value: fmt(totalIncome), icon: TrendingUp, color: 'text-success' },
    { label: 'Total Expenses', value: fmt(totalExpense), icon: TrendingDown, color: 'text-destructive' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your financial overview.</p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-3">
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

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Monthly chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-lg">Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value: number) => ['$' + value.toFixed(2)]}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-lg">Recent Transactions</CardTitle>
            <button onClick={() => navigate('/transactions')} className="text-xs text-primary hover:underline">
              View all
            </button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : !recentTxs.length ? (
              <div className="flex flex-col items-center py-8 text-center">
                <ArrowUpDown className="mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No transactions yet</p>
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
                        <p className="truncate text-sm font-medium">{tx.description || tx.category?.name || 'Transaction'}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(tx.date), 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 text-sm font-semibold ${tx.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                      {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
