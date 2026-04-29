import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';
import {
  Users, UserPlus, Crown, TrendingUp, DollarSign, Activity,
  MessageSquare, AlertCircle, Clock, Target
} from 'lucide-react';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { bn } from 'date-fns/locale';

const formatTaka = (n: number) => `৳${n.toLocaleString('bn-BD', { maximumFractionDigits: 0 })}`;
const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))', '#f59e0b', '#8b5cf6'];

type Range = '7d' | '30d' | '90d' | '365d';

const RANGE_DAYS: Record<Range, number> = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 };
const RANGE_LABEL: Record<Range, string> = {
  '7d': 'গত ৭ দিন',
  '30d': 'গত ৩০ দিন',
  '90d': 'গত ৯০ দিন',
  '365d': 'গত ১ বছর',
};

function StatCard({ icon: Icon, label, value, sub, color = 'text-primary' }: any) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`rounded-lg bg-muted p-2 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsDashboard() {
  const [range, setRange] = useState<Range>('30d');
  const days = RANGE_DAYS[range];
  const since = useMemo(() => startOfDay(subDays(new Date(), days - 1)).toISOString(), [days]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin_analytics', range],
    queryFn: async () => {
      const [profilesRes, paymentsRes, txRes, threadsRes, notifRes] = await Promise.all([
        supabase.from('profiles').select('user_id, account_type, payment_status, is_blocked, created_at, last_login_at, subscription_end, trial_end_date'),
        supabase.from('payment_requests').select('id, user_id, amount, plan, status, created_at, updated_at'),
        supabase.from('transactions').select('id, type, amount, created_at').gte('created_at', since),
        supabase.from('support_threads').select('id, status, priority, created_at'),
        supabase.from('user_notifications').select('id, type, created_at, is_read').gte('created_at', since),
      ]);
      return {
        profiles: profilesRes.data || [],
        payments: paymentsRes.data || [],
        transactions: txRes.data || [],
        threads: threadsRes.data || [],
        notifications: notifRes.data || [],
      };
    },
    refetchInterval: 60000,
  });

  const stats = useMemo(() => {
    if (!data) return null;
    const { profiles, payments, transactions, threads } = data;
    const now = new Date();
    const sinceDate = new Date(since);

    // User stats
    const totalUsers = profiles.length;
    const newUsers = profiles.filter(p => new Date(p.created_at) >= sinceDate).length;
    const proUsers = profiles.filter(p => p.account_type === 'pro').length;
    const trialUsers = profiles.filter(p => p.account_type === 'trial').length;
    const freeUsers = profiles.filter(p => p.account_type === 'free').length;
    const blockedUsers = profiles.filter(p => p.is_blocked).length;
    const activeUsers = profiles.filter(p => p.last_login_at && new Date(p.last_login_at) >= sinceDate).length;

    // Expiring soon (next 7 days)
    const next7 = subDays(now, -7);
    const expiringSoon = profiles.filter(p =>
      p.account_type === 'pro' && p.subscription_end &&
      new Date(p.subscription_end) > now && new Date(p.subscription_end) <= next7
    ).length;

    // Revenue
    const approvedPayments = payments.filter(p => p.status === 'approved');
    const totalRevenue = approvedPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const periodRevenue = approvedPayments
      .filter(p => new Date(p.updated_at) >= sinceDate)
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    const pendingPayments = payments.filter(p => p.status === 'pending').length;

    // Conversion: trial -> pro
    const totalSignups = profiles.length;
    const conversionRate = totalSignups > 0 ? ((proUsers / totalSignups) * 100).toFixed(1) : '0';

    // Support
    const openTickets = threads.filter(t => t.status !== 'closed' && t.status !== 'resolved').length;
    const urgentTickets = threads.filter(t => t.priority === 'urgent' && t.status !== 'closed').length;

    // Transactions
    const txCount = transactions.length;
    const txIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
    const txExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);

    return {
      totalUsers, newUsers, proUsers, trialUsers, freeUsers, blockedUsers, activeUsers,
      expiringSoon, totalRevenue, periodRevenue, pendingPayments, conversionRate,
      openTickets, urgentTickets, txCount, txIncome, txExpense,
    };
  }, [data, since]);

  // Daily series
  const dailySeries = useMemo(() => {
    if (!data) return [];
    const sinceDate = new Date(since);
    const dayList = eachDayOfInterval({ start: sinceDate, end: new Date() });
    return dayList.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const signups = data.profiles.filter(p => format(new Date(p.created_at), 'yyyy-MM-dd') === dayStr).length;
      const revenue = data.payments
        .filter(p => p.status === 'approved' && format(new Date(p.updated_at), 'yyyy-MM-dd') === dayStr)
        .reduce((s, p) => s + Number(p.amount || 0), 0);
      const tx = data.transactions.filter(t => format(new Date(t.created_at), 'yyyy-MM-dd') === dayStr).length;
      const tickets = data.threads.filter(t => format(new Date(t.created_at), 'yyyy-MM-dd') === dayStr).length;
      return {
        date: format(day, 'd MMM', { locale: bn }),
        signups, revenue, tx, tickets,
      };
    });
  }, [data, since]);

  // Account type distribution
  const accountTypeData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Pro', value: stats.proUsers },
      { name: 'Trial', value: stats.trialUsers },
      { name: 'Free', value: stats.freeUsers },
    ].filter(d => d.value > 0);
  }, [stats]);

  // Plan revenue breakdown
  const planRevenueData = useMemo(() => {
    if (!data) return [];
    const map: Record<string, number> = {};
    data.payments.filter(p => p.status === 'approved').forEach(p => {
      const plan = p.plan || 'unknown';
      map[plan] = (map[plan] || 0) + Number(p.amount || 0);
    });
    return Object.entries(map).map(([plan, amount]) => ({ plan, amount }));
  }, [data]);

  if (isLoading || !stats) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">📊 অ্যানালিটিক্স ড্যাশবোর্ড</h2>
          <p className="text-xs text-muted-foreground">{RANGE_LABEL[range]} এর পরিসংখ্যান</p>
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as Range)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">গত ৭ দিন</SelectItem>
            <SelectItem value="30d">গত ৩০ দিন</SelectItem>
            <SelectItem value="90d">গত ৯০ দিন</SelectItem>
            <SelectItem value="365d">গত ১ বছর</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="মোট ইউজার" value={stats.totalUsers}
          sub={`+${stats.newUsers} নতুন`} color="text-primary" />
        <StatCard icon={Activity} label="অ্যাকটিভ ইউজার" value={stats.activeUsers}
          sub={`${stats.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(0) : 0}% মোট`} color="text-green-600" />
        <StatCard icon={Crown} label="Pro সাবস্ক্রাইবার" value={stats.proUsers}
          sub={`${stats.conversionRate}% কনভার্সন`} color="text-amber-600" />
        <StatCard icon={DollarSign} label="মোট আয়" value={formatTaka(stats.totalRevenue)}
          sub={`+${formatTaka(stats.periodRevenue)} এই পিরিয়ডে`} color="text-emerald-600" />

        <StatCard icon={UserPlus} label="ট্রায়াল ইউজার" value={stats.trialUsers} color="text-blue-600" />
        <StatCard icon={Clock} label="শীঘ্রই শেষ" value={stats.expiringSoon}
          sub="আগামী ৭ দিনে" color="text-orange-600" />
        <StatCard icon={AlertCircle} label="পেন্ডিং পেমেন্ট" value={stats.pendingPayments} color="text-yellow-600" />
        <StatCard icon={MessageSquare} label="খোলা টিকিট" value={stats.openTickets}
          sub={stats.urgentTickets > 0 ? `${stats.urgentTickets} জরুরি` : undefined}
          color={stats.urgentTickets > 0 ? 'text-destructive' : 'text-muted-foreground'} />
      </div>

      {/* Signups & Revenue trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> দৈনিক সাইনআপ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={dailySeries}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" fontSize={10} />
                <YAxis fontSize={10} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="signups" stroke="hsl(var(--primary))" fill="url(#g1)" name="সাইনআপ" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" /> দৈনিক রেভিনিউ (৳)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dailySeries}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip formatter={(v: number) => formatTaka(v)} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="রেভিনিউ" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Distribution & Plan revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> অ্যাকাউন্ট টাইপ বিভাজন
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={accountTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={80} label={(e: any) => `${e.name}: ${e.value}`}>
                  {accountTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">প্ল্যান অনুযায়ী রেভিনিউ</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={planRevenueData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" fontSize={10} />
                <YAxis type="category" dataKey="plan" fontSize={10} width={70} />
                <Tooltip formatter={(v: number) => formatTaka(v)} />
                <Bar dataKey="amount" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">দৈনিক ব্যবহারকারীর কার্যকলাপ</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dailySeries}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" fontSize={10} />
              <YAxis fontSize={10} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="tx" stroke="hsl(var(--primary))" strokeWidth={2} name="লেনদেন" />
              <Line type="monotone" dataKey="tickets" stroke="hsl(var(--destructive))" strokeWidth={2} name="সাপোর্ট টিকিট" />
              <Line type="monotone" dataKey="signups" stroke="#f59e0b" strokeWidth={2} name="সাইনআপ" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary footer */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">ব্লকড ইউজার</p>
              <p className="text-lg font-bold text-destructive">{stats.blockedUsers}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">পিরিয়ডের লেনদেন</p>
              <p className="text-lg font-bold">{stats.txCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ইউজার আয় (লেনদেন)</p>
              <p className="text-lg font-bold text-emerald-600">{formatTaka(stats.txIncome)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ইউজার ব্যয় (লেনদেন)</p>
              <p className="text-lg font-bold text-orange-600">{formatTaka(stats.txExpense)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
