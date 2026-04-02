import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useTransactions } from '@/hooks/useTransactions';
import { formatTaka } from '@/lib/currency';
import { TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react';
import { format, getYear, getMonth } from 'date-fns';
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

export default function Reports() {
  const { data: transactions, isLoading } = useTransactions();
  const currentYear = getYear(new Date());
  const [selectedYear, setSelectedYear] = useState(String(currentYear));

  const availableYears = useMemo(() => {
    if (!transactions?.length) return [String(currentYear)];
    const years = new Set(transactions.map((tx) => tx.date.substring(0, 4)));
    years.add(String(currentYear));
    return Array.from(years).sort().reverse();
  }, [transactions, currentYear]);

  const yearTxs = useMemo(
    () => transactions?.filter((tx) => tx.date.startsWith(selectedYear)) || [],
    [transactions, selectedYear]
  );

  // Monthly income vs expense data
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: MONTH_NAMES_BN[i].substring(0, 3),
      আয়: 0,
      ব্যয়: 0,
    }));
    yearTxs.forEach((tx) => {
      const m = getMonth(new Date(tx.date));
      if (tx.type === 'income') months[m].আয় += Number(tx.amount);
      else months[m].ব্যয় += Number(tx.amount);
    });
    return months;
  }, [yearTxs]);

  // Category-wise expense breakdown
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    yearTxs.filter((tx) => tx.type === 'expense').forEach((tx) => {
      const name = tx.category?.name || 'অশ্রেণীবদ্ধ';
      map.set(name, (map.get(name) || 0) + Number(tx.amount));
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [yearTxs]);

  // Monthly trend line data
  const trendData = useMemo(() => {
    return monthlyData.map((m) => ({
      ...m,
      ব্যালেন্স: m.আয় - m.ব্যয়,
    }));
  }, [monthlyData]);

  // Yearly summary stats
  const yearlyStats = useMemo(() => {
    let income = 0, expense = 0;
    yearTxs.forEach((tx) => {
      if (tx.type === 'income') income += Number(tx.amount);
      else expense += Number(tx.amount);
    });
    return { income, expense, balance: income - expense, count: yearTxs.length };
  }, [yearTxs]);

  // Monthly report: current month
  const currentMonthIdx = getMonth(new Date());
  const monthlyReport = useMemo(() => {
    const monthTxs = yearTxs.filter((tx) => getMonth(new Date(tx.date)) === currentMonthIdx);
    let income = 0, expense = 0;
    monthTxs.forEach((tx) => {
      if (tx.type === 'income') income += Number(tx.amount);
      else expense += Number(tx.amount);
    });
    return { income, expense, balance: income - expense, count: monthTxs.length };
  }, [yearTxs, currentMonthIdx]);

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">রিপোর্ট</h1>
          <p className="text-muted-foreground">আপনার আর্থিক বিশ্লেষণ ও রিপোর্ট দেখুন।</p>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Monthly Report Cards */}
      <div>
        <h2 className="font-display text-lg font-semibold mb-3">
          <Calendar className="inline mr-2 h-4 w-4" />
          মাসিক রিপোর্ট — {MONTH_NAMES_BN[currentMonthIdx]} {selectedYear}
        </h2>
        <div className="grid gap-4 sm:grid-cols-4">
          {isLoading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-[90px] rounded-lg" />)
          ) : (
            <>
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-5">
                  <p className="text-xs text-muted-foreground mb-1">মাসিক আয়</p>
                  <p className="text-xl font-bold font-display text-success">{formatTaka(monthlyReport.income)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-5">
                  <p className="text-xs text-muted-foreground mb-1">মাসিক ব্যয়</p>
                  <p className="text-xl font-bold font-display text-destructive">{formatTaka(monthlyReport.expense)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-5">
                  <p className="text-xs text-muted-foreground mb-1">মাসিক ব্যালেন্স</p>
                  <p className={`text-xl font-bold font-display ${monthlyReport.balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {formatTaka(monthlyReport.balance)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-5">
                  <p className="text-xs text-muted-foreground mb-1">মোট লেনদেন</p>
                  <p className="text-xl font-bold font-display">{monthlyReport.count}টি</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Income vs Expense Chart */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-lg">আয় বনাম ব্যয় ({selectedYear})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[280px]" /> : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData} barGap={2}>
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

        {/* Category-wise Expense Pie Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-lg">ক্যাটাগরি অনুযায়ী ব্যয়</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[280px]" /> : !categoryData.length ? (
              <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
                কোনো ব্যয় ডেটা নেই
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
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

      {/* Monthly Balance Trend */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-lg">মাসিক ব্যালেন্স ট্রেন্ড ({selectedYear})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-[250px]" /> : (
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

      {/* Yearly Summary */}
      <div>
        <h2 className="font-display text-lg font-semibold mb-3">
          <Wallet className="inline mr-2 h-4 w-4" />
          বার্ষিক সারসংক্ষেপ — {selectedYear}
        </h2>
        <div className="grid gap-4 sm:grid-cols-4">
          {isLoading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-[90px] rounded-lg" />)
          ) : (
            <>
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground">বার্ষিক আয়</p>
                    <TrendingUp className="h-3.5 w-3.5 text-success" />
                  </div>
                  <p className="text-xl font-bold font-display text-success">{formatTaka(yearlyStats.income)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground">বার্ষিক ব্যয়</p>
                    <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                  </div>
                  <p className="text-xl font-bold font-display text-destructive">{formatTaka(yearlyStats.expense)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground">বার্ষিক ব্যালেন্স</p>
                    <Wallet className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <p className={`text-xl font-bold font-display ${yearlyStats.balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {formatTaka(yearlyStats.balance)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground">মোট লেনদেন</p>
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-xl font-bold font-display">{yearlyStats.count}টি</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
