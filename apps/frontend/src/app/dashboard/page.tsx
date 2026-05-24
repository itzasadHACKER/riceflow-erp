"use client";

import {
  Users,
  Wheat,
  Warehouse,
  ShoppingCart,
  DollarSign,
  Package,
  Wallet,
  Factory,
  Truck,
  UserSearch,
  BarChart3,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { useApiGet } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";

interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  totalPurchases: number;
  totalSales: number;
  inventoryValue: number;
  activeEmployees: number;
  productionOutput: number;
  activeSalesOrders: number;
}

const quickLinks = [
  { title: "Finance", href: "/dashboard/finance", icon: Wallet, description: "Accounts, journals, vouchers" },
  { title: "Procurement", href: "/dashboard/procurement", icon: Wheat, description: "Paddy purchases, suppliers" },
  { title: "Production", href: "/dashboard/production", icon: Factory, description: "Milling, batches, yields" },
  { title: "Inventory", href: "/dashboard/inventory", icon: Warehouse, description: "Warehouses, stock" },
  { title: "Sales", href: "/dashboard/sales", icon: ShoppingCart, description: "Customers, orders, invoices" },
  { title: "HR & Payroll", href: "/dashboard/hr", icon: Users, description: "Employees, attendance, payroll" },
  { title: "CRM", href: "/dashboard/crm", icon: UserSearch, description: "Leads, brokers, follow-ups" },
  { title: "Transport", href: "/dashboard/transport", icon: Truck, description: "Fleet, drivers, logistics" },
  { title: "Reports", href: "/dashboard/reports", icon: BarChart3, description: "Analytics & business intelligence" },
  { title: "Export Sales", href: "/dashboard/export-sales", icon: Globe, description: "Contracts, LCs, shipping" },
];

export default function DashboardPage() {
  const org = useAuthStore((s) => s.organization);
  const { data: stats } = useApiGet<DashboardStats>(
    ["dashboard-stats"],
    "/reporting/executive-dashboard"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back{org ? ` to ${org.name}` : ""}. Here&apos;s your business overview.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Revenue"
          value={stats ? Number(stats.totalRevenue || 0).toLocaleString("en-PK", { style: "currency", currency: "PKR" }) : "—"}
          icon={DollarSign}
          description="This period"
        />
        <StatCard
          title="Total Purchases"
          value={stats?.totalPurchases ?? "—"}
          icon={Wheat}
          description="Paddy purchases"
        />
        <StatCard
          title="Active Sales"
          value={stats?.activeSalesOrders ?? stats?.totalSales ?? "—"}
          icon={ShoppingCart}
          description="Orders"
        />
        <StatCard
          title="Inventory Value"
          value={stats ? Number(stats.inventoryValue || 0).toLocaleString("en-PK", { style: "currency", currency: "PKR" }) : "—"}
          icon={Warehouse}
          description="Across godowns"
        />
        <StatCard
          title="Production"
          value={stats?.productionOutput ?? "—"}
          icon={Package}
          description="Output this period"
        />
        <StatCard
          title="Employees"
          value={stats?.activeEmployees ?? "—"}
          icon={Users}
          description="Active"
        />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Quick Access</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="h-full cursor-pointer hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <link.icon className="size-4 text-primary" />
                  <CardTitle className="text-sm">{link.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{link.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground pt-6 border-t">
        Grainix ERP &mdash; Powered by Asad Ali (0308-4420406)
      </div>
    </div>
  );
}
