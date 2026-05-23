import {
  Users,
  Wheat,
  Warehouse,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  {
    title: "Total Revenue",
    value: "PKR 12.4M",
    change: "+12.5%",
    trend: "up" as const,
    icon: DollarSign,
    description: "vs last month",
  },
  {
    title: "Paddy Purchased",
    value: "2,450 Tons",
    change: "+8.2%",
    trend: "up" as const,
    icon: Wheat,
    description: "this month",
  },
  {
    title: "Rice in Stock",
    value: "1,890 Tons",
    change: "-3.1%",
    trend: "down" as const,
    icon: Warehouse,
    description: "across godowns",
  },
  {
    title: "Active Orders",
    value: "156",
    change: "+24.3%",
    trend: "up" as const,
    icon: ShoppingCart,
    description: "pending dispatch",
  },
  {
    title: "Production Today",
    value: "85 Tons",
    change: "+5.7%",
    trend: "up" as const,
    icon: Package,
    description: "milling output",
  },
  {
    title: "Active Suppliers",
    value: "342",
    change: "+2.1%",
    trend: "up" as const,
    icon: Users,
    description: "registered",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back. Here&apos;s your business overview.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs">
                {stat.trend === "up" ? (
                  <TrendingUp className="size-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="size-3 text-red-500" />
                )}
                <span
                  className={
                    stat.trend === "up"
                      ? "text-emerald-500"
                      : "text-red-500"
                  }
                >
                  {stat.change}
                </span>
                <span className="text-muted-foreground">
                  {stat.description}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  supplier: "Ahmad Farms",
                  variety: "Basmati Super",
                  weight: "120 Tons",
                  amount: "PKR 2.4M",
                },
                {
                  supplier: "Khan Traders",
                  variety: "IRRI-6",
                  weight: "85 Tons",
                  amount: "PKR 1.1M",
                },
                {
                  supplier: "Malik & Sons",
                  variety: "Basmati 385",
                  weight: "200 Tons",
                  amount: "PKR 4.2M",
                },
                {
                  supplier: "Punjab Rice Co.",
                  variety: "Sella",
                  weight: "65 Tons",
                  amount: "PKR 1.5M",
                },
              ].map((purchase) => (
                <div
                  key={purchase.supplier}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{purchase.supplier}</p>
                    <p className="text-sm text-muted-foreground">
                      {purchase.variety} · {purchase.weight}
                    </p>
                  </div>
                  <span className="font-semibold">{purchase.amount}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  customer: "Karachi Exports Ltd",
                  variety: "Basmati Super",
                  weight: "50 Tons",
                  amount: "PKR 3.1M",
                },
                {
                  customer: "Dubai Foods LLC",
                  variety: "Sella Golden",
                  weight: "100 Tons",
                  amount: "PKR 6.8M",
                },
                {
                  customer: "Lahore Wholesale",
                  variety: "IRRI-6",
                  weight: "30 Tons",
                  amount: "PKR 0.8M",
                },
                {
                  customer: "Islamabad Mart",
                  variety: "Basmati 385",
                  weight: "15 Tons",
                  amount: "PKR 1.2M",
                },
              ].map((sale) => (
                <div
                  key={sale.customer}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{sale.customer}</p>
                    <p className="text-sm text-muted-foreground">
                      {sale.variety} · {sale.weight}
                    </p>
                  </div>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {sale.amount}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
