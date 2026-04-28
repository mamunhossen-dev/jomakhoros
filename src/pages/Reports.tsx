import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTransactions, useCategories } from '@/hooks/useTransactions';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { exportAnalyticsPdf, exportAnalyticsImage } from '@/lib/exportAnalyticsPdf';
import { formatTaka } from '@/lib/currency';
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, Percent,
  FileDown, Lock, X, Lightbulb, Image as ImageIcon,
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, startOfYear, endOfYear,
  subMonths, subDays,
} from 'date-fns';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, ComposedChart, Line,
} from 'recharts';

// Maximally distinct colors — spread evenly across the hue wheel
// with varied saturation/lightness so no two look similar.
const COLORS = [
  'hsl(210, 85%, 50%)',  // blue
  'hsl(0, 78%, 55%)',    // red
  'hsl(140, 65%, 42%)',  // green
  'hsl(38, 95%, 52%)',   // orange
  'hsl(280, 60%, 55%)',  // purple
  'hsl(180, 70%, 40%)',  // teal
  'hsl(330, 75%, 58%)',  // pink/magenta
  'hsl(50, 90%, 50%)',   // yellow
  'hsl(250, 70%, 60%)',  // indigo
  'hsl(15, 80%, 50%)',   // burnt orange
  'hsl(100, 55%, 40%)',  // olive green
  'hsl(195, 80%, 45%)',  // cyan
];

const MONTH_NAMES_BN = ['জানু', 'ফেব', 'মার্চ', 'এপ্রি', 'মে', 'জুন',
  'জুলা', 'আগ', 'সেপ', 'অক্টো', 'নভে', 'ডিসে'];

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
  const [categoryId, setCategoryId] = useState<string>('all');
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const navigate = useNavigate();

  const { data: transactions, isLoading } = useTransactions({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });
  const { data: allCategories } = useCategories();

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

  // Apply category filter client-side
  const filteredTxs = useMemo(() => {
    const base = transactions || [];
    if (categoryId === 'all') return base;
    return base.filter((tx) => tx.category_id === categoryId);
  }, [transactions, categoryId]);

  const rangeLabel = useMemo(() => {
    if (!dateFrom && !dateTo) return 'সব সময়';
    return `${dateFrom || '...'} → ${dateTo || '...'}`;
  }, [dateFrom, dateTo]);

  const useMonthlyGrouping = useMemo(() => {
    if (!dateFrom || !dateTo) return true;
    const days = (new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24);
    return days > 90;
  }, [dateFrom, dateTo]);

  const timeSeriesData = useMemo(() => {
    let base: { month: string; income: number; expense: number }[] = [];
    if (useMonthlyGrouping) {
      const map = new Map<string, { key: string; income: number; expense: number }>();
      filteredTxs.forEach((tx) => {
        const d = new Date(tx.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = `${MONTH_NAMES_BN[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
        const cur = map.get(key) || { key: label, income: 0, expense: 0 };
        if (tx.type === 'income') cur.income += Number(tx.amount);
        else if (tx.type === 'expense') cur.expense += Number(tx.amount);
        map.set(key, cur);
      });
      base = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => ({ month: v.key, income: v.income, expense: v.expense }));
    } else {
      const map = new Map<string, { income: number; expense: number }>();
      filteredTxs.forEach((tx) => {
        const cur = map.get(tx.date) || { income: 0, expense: 0 };
        if (tx.type === 'income') cur.income += Number(tx.amount);
        else if (tx.type === 'expense') cur.expense += Number(tx.amount);
        map.set(tx.date, cur);
      });
      base = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => ({
        month: format(new Date(k), 'dd MMM'), income: v.income, expense: v.expense,
      }));
    }
    // Add savings + 3-point moving-average trend lines
    const window = 3;
    const ma = (arr: number[], i: number) => {
      const start = Math.max(0, i - window + 1);
      const slice = arr.slice(start, i + 1);
      return slice.reduce((s, x) => s + x, 0) / slice.length;
    };
    const incomes = base.map((d) => d.income);
    const expenses = base.map((d) => d.expense);
    const savings = base.map((d) => d.income - d.expense);
    return base.map((d, i) => ({
      ...d,
      savings: savings[i],
      incomeTrend: ma(incomes, i),
      expenseTrend: ma(expenses, i),
      savingsTrend: ma(savings, i),
    }));
  }, [filteredTxs, useMonthlyGrouping]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    filteredTxs.filter((tx) => tx.type === 'expense').forEach((tx) => {
      const name = tx.category?.name || 'অশ্রেণীবদ্ধ';
      map.set(name, (map.get(name) || 0) + Number(tx.amount));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredTxs]);

  const stats = useMemo(() => {
    let income = 0, expense = 0;
    filteredTxs.forEach((tx) => {
      if (tx.type === 'income') income += Number(tx.amount);
      else if (tx.type === 'expense') expense += Number(tx.amount);
    });
    const balance = income - expense;
    const savings = balance; // savings within selected period
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    return { income, expense, balance, savings, savingsRate, count: filteredTxs.length };
  }, [filteredTxs]);

  // Smart insights
  const insights = useMemo(() => {
    const list: string[] = [];
    if (!filteredTxs.length) return list;

    // Top expense category
    if (categoryData.length) {
      const top = categoryData[0];
      const pct = stats.expense > 0 ? (top.value / stats.expense) * 100 : 0;
      list.push(`আপনি সবচেয়ে বেশি খরচ করেছেন "${top.name}" ক্যাটাগরিতে — ${formatTaka(top.value)} (মোট ব্যয়ের ${pct.toFixed(1)}%)`);
    }

    // Compare last two periods (months/days based on grouping)
    if (timeSeriesData.length >= 2) {
      const last = timeSeriesData[timeSeriesData.length - 1];
      const prev = timeSeriesData[timeSeriesData.length - 2];
      if (prev.expense > 0) {
        const change = ((last.expense - prev.expense) / prev.expense) * 100;
        if (Math.abs(change) >= 1) {
          list.push(
            change > 0
              ? `গত পিরিয়ডের তুলনায় আপনার ব্যয় ${change.toFixed(1)}% বেড়েছে`
              : `গত পিরিয়ডের তুলনায় আপনার ব্যয় ${Math.abs(change).toFixed(1)}% কমেছে — চমৎকার!`
          );
        }
      }
      if (prev.income > 0) {
        const change = ((last.income - prev.income) / prev.income) * 100;
        if (Math.abs(change) >= 1) {
          list.push(
            change > 0
              ? `গত পিরিয়ডের তুলনায় আয় ${change.toFixed(1)}% বেড়েছে`
              : `গত পিরিয়ডের তুলনায় আয় ${Math.abs(change).toFixed(1)}% কমেছে`
          );
        }
      }
    }

    // Savings rate insight
    if (stats.income > 0) {
      if (stats.savingsRate >= 20) {
        list.push(`দারুণ! আপনি আয়ের ${stats.savingsRate.toFixed(1)}% সঞ্চয় করছেন`);
      } else if (stats.savingsRate < 0) {
        list.push(`সতর্কতা: এই সময়ে আপনি আয়ের চেয়ে বেশি খরচ করেছেন`);
      } else if (stats.savingsRate < 10) {
        list.push(`আপনার সঞ্চয়ের হার মাত্র ${stats.savingsRate.toFixed(1)}% — বাড়ানোর চেষ্টা করুন`);
      }
    }

    return list.slice(0, 3);
  }, [filteredTxs, categoryData, timeSeriesData, stats]);

  const handleExportPdf = async () => {
    if (isFree) { setUpgradeOpen(true); return; }
    if (!filteredTxs.length) { toast.error('এই সময়সীমায় কোনো ডেটা নেই'); return; }
    try {
      await exportAnalyticsPdf(
        {
          kpi: stats,
          timeSeries: timeSeriesData,
          categories: categoryData,
          insights,
        },
        profile?.display_name || '',
        user?.email || '',
        { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined },
      );
    } catch (e) {
      console.error('PDF export failed', e);
      toast.error('PDF তৈরি করা যায়নি');
    }
  };

  const handleExportImage = async () => {
    if (isFree) { setUpgradeOpen(true); return; }
    if (!filteredTxs.length) { toast.error('এই সময়সীমায় কোনো ডেটা নেই'); return; }
    try {
      await exportAnalyticsImage(
        {
          kpi: stats,
          timeSeries: timeSeriesData,
          categories: categoryData,
          insights,
        },
        profile?.display_name || '',
        user?.email || '',
        { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined },
      );
    } catch (e) {
      console.error('Image export failed', e);
      toast.error('ইমেজ তৈরি করা যায়নি');
    }
  };

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
  };

  const hasFilters = !!(dateFrom || dateTo || categoryId !== 'all');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">রিপোর্ট ও বিশ্লেষণ</h1>
          <p className="text-sm text-muted-foreground">{rangeLabel}</p>
        </div>
        <Button onClick={handleExportPdf} variant="outline" disabled={!filteredTxs.length && !isFree}>
          {isFree ? <Lock className="mr-1 h-4 w-4" /> : <FileDown className="mr-1 h-4 w-4" />}
          PDF এক্সপোর্ট
        </Button>
      </div>

      {/* Filters */}
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
                  className="h-9 w-[150px]"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPreset('custom'); }}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">পর্যন্ত</Label>
                <Input
                  type="date"
                  className="h-9 w-[150px]"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPreset('custom'); }}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">ক্যাটাগরি</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="h-9 w-[180px]">
                    <SelectValue placeholder="সব ক্যাটাগরি" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সব ক্যাটাগরি</SelectItem>
                    {(allCategories || []).map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.type === 'income' ? 'আয়' : 'ব্যয়'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={() => { setDateFrom(''); setDateTo(''); setCategoryId('all'); setPreset('all'); }}>
                  <X className="mr-1 h-3 w-3" /> মুছুন
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {isLoading ? (
          [...Array(5)].map((_, i) => <Skeleton key={i} className="h-[92px] rounded-lg" />)
        ) : (
          <>
            <KpiCard label="মোট আয়" value={formatTaka(stats.income)} icon={<TrendingUp className="h-4 w-4" />} accent="text-success" bg="bg-success/10" />
            <KpiCard label="মোট ব্যয়" value={formatTaka(stats.expense)} icon={<TrendingDown className="h-4 w-4" />} accent="text-destructive" bg="bg-destructive/10" />
            <KpiCard label="ব্যালেন্স" value={formatTaka(stats.balance)} icon={<Wallet className="h-4 w-4" />} accent={stats.balance >= 0 ? 'text-primary' : 'text-destructive'} bg="bg-primary/10" />
            <KpiCard label="সঞ্চয়" value={formatTaka(stats.savings)} icon={<PiggyBank className="h-4 w-4" />} accent={stats.savings >= 0 ? 'text-primary' : 'text-destructive'} bg="bg-primary/10" />
            <KpiCard label="সঞ্চয় হার" value={`${stats.savingsRate.toFixed(1)}%`} icon={<Percent className="h-4 w-4" />} accent={stats.savingsRate >= 0 ? 'text-success' : 'text-destructive'} bg="bg-success/10" />
          </>
        )}
      </div>

      {/* Smart Insights */}
      {insights.length > 0 && (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" /> স্মার্ট ইনসাইটস
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.map((ins, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{ins}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-lg">আয় বনাম ব্যয়</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[280px]" /> : !timeSeriesData.length ? (
              <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">কোনো ডেটা নেই</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={timeSeriesData} barGap={2} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={(v) => `৳${v}`} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number, n: string) => {
                      const labels: Record<string, string> = {
                        income: 'আয়', expense: 'ব্যয়', savings: 'সঞ্চয়',
                        incomeTrend: 'আয় ট্রেন্ড', expenseTrend: 'ব্যয় ট্রেন্ড', savingsTrend: 'সঞ্চয় ট্রেন্ড',
                      };
                      return [`৳${Number(v).toFixed(2)}`, labels[n] || n];
                    }}
                  />
                  <Legend
                    formatter={(v) => {
                      const labels: Record<string, string> = {
                        income: 'আয়', expense: 'ব্যয়', savings: 'সঞ্চয়',
                        incomeTrend: 'আয় ট্রেন্ড', expenseTrend: 'ব্যয় ট্রেন্ড', savingsTrend: 'সঞ্চয় ট্রেন্ড',
                      };
                      return labels[v] || v;
                    }}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                  <Bar dataKey="income" fill="hsl(140, 65%, 45%)" radius={[3, 3, 0, 0]} animationDuration={800} />
                  <Bar dataKey="expense" fill="hsl(0, 75%, 55%)" radius={[3, 3, 0, 0]} animationDuration={800} />
                  <Line type="monotone" dataKey="incomeTrend" stroke="hsl(140, 80%, 28%)" strokeWidth={3} dot={false} animationDuration={1000} />
                  <Line type="monotone" dataKey="expenseTrend" stroke="hsl(0, 85%, 38%)" strokeWidth={3} dot={false} animationDuration={1000} />
                  <Line type="monotone" dataKey="savingsTrend" stroke="hsl(215, 90%, 50%)" strokeWidth={3} strokeDasharray="5 4" dot={false} animationDuration={1000} />
                </ComposedChart>
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
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value" animationDuration={800}>
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

function KpiCard({ label, value, icon, accent, bg }: { label: string; value: string; icon: React.ReactNode; accent: string; bg: string }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-muted-foreground">{label}</p>
          <span className={`flex h-6 w-6 items-center justify-center rounded-md ${bg} ${accent}`}>{icon}</span>
        </div>
        <p className={`text-base sm:text-lg font-bold font-display truncate ${accent}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
