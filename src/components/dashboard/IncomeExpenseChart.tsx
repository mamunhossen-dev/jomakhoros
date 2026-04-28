import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type ChartPoint = {
  label: string;
  income: number;
  expense: number;
  savings: number;
};

type IncomeExpenseChartProps = {
  data: ChartPoint[];
};

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  return (
    <ResponsiveContainer width="100%" height={270}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 6 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `৳${v}`} />
        <Tooltip
          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
          formatter={(value: number) => [`৳${value.toFixed(2)}`]}
        />
        <Legend />
        <Line type="monotone" dataKey="income" name="আয়" stroke="hsl(var(--success))" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} />
        <Line type="monotone" dataKey="expense" name="ব্যয়" stroke="hsl(var(--destructive))" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} />
        <Line type="monotone" dataKey="savings" name="সেভিং" stroke="hsl(var(--savings))" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
