import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const stats = [
  { label: 'Total Balance', value: '$24,563.00', change: '+2.5%', up: true, icon: Wallet },
  { label: 'Income', value: '$8,350.00', change: '+12.3%', up: true, icon: TrendingUp },
  { label: 'Expenses', value: '$3,820.00', change: '-4.1%', up: false, icon: TrendingDown },
  { label: 'Savings', value: '$4,530.00', change: '+8.7%', up: true, icon: PiggyBank },
];

export default function Index() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your financial overview.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display">{stat.value}</div>
              <p className={`text-xs mt-1 ${stat.up ? 'text-success' : 'text-destructive'}`}>
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Transaction list coming soon...</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display">Spending Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Charts coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
