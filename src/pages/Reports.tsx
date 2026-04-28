import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTransactions } from '@/hooks/useTransactions';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { exportTransactionsPdf } from '@/lib/exportPdf';
import { formatTaka } from '@/lib/currency';
import { TrendingUp, TrendingDown, Wallet, Calendar, FileDown, Lock, X } from 'lucide-react';
import {
  format, getYear, getMonth, startOfMonth, endOfMonth, startOfYear, endOfYear,
  subMonths, subDays, startOfWeek, endOfWeek,
} from 'date-fns';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

const COLORS = [
  'hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--success))',
  'hsl(38, 92%, 50%)', 'hsl(260, 60%, 55%)', 'hsl(200, 80%, 50%)',
  'hsl(340, 70%, 55%)', 'hsl(170, 70%, 40%)', 'hsl(30, 80%, 55%)',
  'hsl(280, 50%, 60%)', 'hsl(100, 50%, 45%)', 'hsl(15, 80%, 55%)',
];

const MONTH_NAMES_BN = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

type Preset = 'this_month' | 'last_month' | 'last_7' | 'last_30' | 'last_90' | 'this_year' | 'last_year' | 'all' | 'custom';

const PRESET_LABELS: Record<Preset, string> = {
  this_month: 'এই মাস',
  last_month: 'গত মাস',
  last_7: 'শেষ ৭ দিন',
  last_30: 'শেষ ৩০ দিন',
  last_90: 'শেষ ৯০ দিন',
  this_year: 'এই বছর',
  last_year: 'গত বছর',
  all: 'সব সময়',
  custom: 'কাস্টম',
};

function getPresetRange(p: Preset): { from: string; to: string } {
  const now = new Date();
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd');
  switch (p) {
    case 'this_month': return { from: fmt(startOfMonth(now)), to: fmt(endOfMonth(now)) };
    case 'last_month': {
      const lm = subMonths(now, 1);
      return { from: fmt(startOfMonth(lm)), to: fmt(endOfMonth(lm)) };
    }
    case 'last_7': return { from: fmt(subDays(now, 6)), to: fmt(now) };
    case 'last_30': return { from: fmt(subDays(now, 29)), to: fmt(now) };
    case 'last_90': return { from: fmt(subDays(now, 89)), to: fmt(now) };
    case 'this_year': return { from: fmt(startOfYear(now)), to: fmt(endOfYear(now)) };
    case 'last_year': {
      const ly = new Date(now.getFullYear() - 1, 0, 1);
      return { from: fmt(startOfYear(ly)), to: fmt(endOfYear(ly)) };
    }
    default: return { from: '', to: '' };
  }
}

export default function Reports() {
  const [preset, setPreset] = useState<Preset>('this_year');
  const initial = getPresetRange('this_year');
  const [dateFrom, setDateFrom] = useState(initial.from);
  const [dateTo, setDateTo] = useState(initial.to);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const navigate = useNavigate();

  const { data: transactions, isLoading } = useTransactions({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { isFree } = useSubscription();

  const handlePreset = (p: Preset) => {
    setPreset(p);
    if (p !== 'custom') {
      const r = getPresetRange(p);
      setDateFrom(r.from);
      setDateTo(r.to);
    }
  };

  const handleExportPdf = () => {
    if (isFree) {
      setUpgradeOpen(true);
      return;
    }
    if (!transactions?.length) {
      toast.error('এই সময়সীমায় কোনো লেনদেন নেই');
      return;
    }
    exportTransactionsPdf(transactions, profile?.display_name || '', user?.email || '', {
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
  };

  const filteredTxs = transactions || [];
  const rangeLabel = useMemo(() => {
    if (!dateFrom && !dateTo) return 'সব সময়';
    return `${dateFrom || '...'} → ${dateTo || '...'}`;
  }, [dateFrom, dateTo]);

  // Determine grouping: if range > 90 days → by month, else by day
  const useMonthlyGrouping = useMemo(() => {
    if (!dateFrom || !dateTo) return true;
    const days = (new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24);
    return days > 90;
  }, [dateFrom, dateTo]);

  // Time series data
  const timeSeriesData = useMemo(() => {
    if (useMonthlyGrouping) {
      const map = new Map<string, { key: string; আয়: number; ব্যয়: number }>();
      filteredTxs.forEach((tx) => {
        const d = new Date(tx.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = `${MONTH_NAMES_BN[d.getMonth()].substring(0, 3)} ${String(d.getFullYear()).slice(2)}`;
        const cur = map.get(key) || { key: label, আয়: 0, ব্যয়: 0 };
        if (tx.type === 'income') cur.আয় += Number(tx.amount);
        else if (tx.type === 'expense') cur.ব্যয় += Number(tx.amount);
        map.set(key, cur);
      });
      return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => ({ month: v.key, আয়: v.আয়, ব্যয়: v.ব্যয় }));
    } else {
      const map = new Map<string, { আয়: number; ব্যয়: number }>();
      filteredTxs.forEach((tx) => {
        const cur = map.get(tx.date) || { আয়: 0, ব্যয়: 0 };
        if (tx.type === 'income') cur.আয় += Number(tx.amount);
        else if (tx.type === 'expense') cur.ব্যয় += Number(tx.amount);
        map.set(tx.date, cur);
      });
      return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => ({
        month: format(new Date(k), 'dd MMM'), আয়: v.আয়, ব্যয়: v.ব্যয়,
      }));
    }
  }, [filteredTxs, useMonthlyGrouping]);

  const trendData = useMemo(() => timeSeriesData.map(m => ({ ...m, ব্যালেন্স: m.আয় - m.ব্যয় })), [timeSeriesData]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    filteredTxs.filter((tx) => tx.type === 'expense').forEach((tx) => {
      const name = tx.category?.name || 'অশ্রেণীবদ্ধ';
      map.set(name, (map.get(name) || 0) + Number(tx.amount));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredTxs]);

  const stats = useMemo(() => {
    let income = 0, expense = 0, transfers = 0;
    filteredTxs.forEach((tx) => {
      if (tx.type === 'income') income += Number(tx.amount);
      else if (tx.type === 'expense') expense += Number(tx.amount);
      else transfers += 1;
    });
    return { income, expense, balance: income - expense, count: filteredTxs.length, transfers };
  }, [filteredTxs]);

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
  };

  const hasFilters = !!(dateFrom || dateTo);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">রিপোর্ট ও বিশ্লেষণ</h1>
          <p className="text-muted-foreground">{rangeLabel}</p>
        </div>
        <Button onClick={handleExportPdf} variant="outline" disabled={!filteredTxs.length && !isFree}>
          {isFree ? <Lock className="mr-1 h-4 w-4" /> : <FileDown className="mr-1 h-4 w-4" />}
          PDF এক্সপোর্ট
        </Button>
      </div>

      {/* Advanced Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-5">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PRESET_LABELS) as Preset[]).filter(p => p !== 'custom').map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={preset === p ? 'default' : 'outline'}
                  onClick={() => handlePreset(p)}
                  className="h-8 text-xs"
                >
                  {PRESET_LABELS[p]}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">থেকে</Label>
                <Input
                  type="date"
                  className="h-9 w-[160px]"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPreset('custom'); }}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">পর্যন্ত</Label>
                <Input
                  type="date"
                  className="h-9 w-[160px]"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPreset('custom'); }}
                />
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={() => { setDateFrom(''); setDateTo(''); setPreset('all'); }}>
                  <X className="mr-1 h-3 w-3" /> মুছুন
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-[90px] rounded-lg" />)
        ) : (
          <>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">মোট আয়</p>
                  <TrendingUp className="h-3.5 w-3.5 text-success" />
                </div>
                <p className="text-xl font-bold font-display text-success">{formatTaka(stats.income)}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">মোট ব্যয়</p>
                  <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                </div>
                <p className="text-xl font-bold font-display text-destructive">{formatTaka(stats.expense)}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">নেট ব্যালেন্স</p>
                  <Wallet className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className={`text-xl font-bold font-display ${stats.balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {formatTaka(stats.balance)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">মোট লেনদেন</p>
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <p className="text-xl font-bold font-display">{stats.count}টি</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Income vs Expense Chart */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-lg">আয় বনাম ব্যয়</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[280px]" /> : !timeSeriesData.length ? (
              <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">কোনো ডেটা নেই</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={timeSeriesData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={(v) => `৳${v}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`৳${v.toFixed(2)}`]} />
                  <Legend />
                  <Bar dataKey="আয়" fill="hsl(var(--success))" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="ব্যয়" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-lg">ক্যাটাগরি অনুযায়ী ব্যয়</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[280px]" /> : !categoryData.length ? (
              <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">কোনো ব্যয় ডেটা নেই</div>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value">
                      {categoryData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`৳${v.toFixed(2)}`]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
                  {categoryData.slice(0, 8).map((cat, i) => (
                    <div key={cat.name} className="flex items-center gap-1.5 text-xs">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{cat.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Balance Trend */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-lg">ব্যালেন্স ট্রেন্ড</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-[250px]" /> : !trendData.length ? (
            <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">কোনো ডেটা নেই</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={(v) => `৳${v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`৳${v.toFixed(2)}`]} />
                <Legend />
                <Line type="monotone" dataKey="আয়" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="ব্যয়" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="ব্যালেন্স" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Prompt */}
      <AlertDialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" /> প্রো ফিচার
            </AlertDialogTitle>
            <AlertDialogDescription>
              PDF এক্সপোর্ট সুবিধা শুধুমাত্র প্রো সাবস্ক্রিপশন ব্যবহারকারীদের জন্য। বিস্তারিত রিপোর্ট ডাউনলোড করতে এখনই প্রো-তে আপগ্রেড করুন।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>পরে</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate('/subscription')}>
              প্রো-তে আপগ্রেড করুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
