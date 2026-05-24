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
  Building,
  Receipt,
  Landmark,
  Cog,
  FlaskConical,
  GitBranch,
  FileText,
  TrendingUp,
  Bot,
  ArrowRight,
  DoorOpen,
  Layers,
  UserCheck,
  Tag,
  Megaphone,
  Mail,
  PiggyBank,
  Percent,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { useApiGet } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { formatCurrency } from "@/lib/utils/numbering";

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
  { title: "Finance", href: "/dashboard/finance", icon: Wallet, desc: "Accounts & Journals" },
  { title: "Procurement", href: "/dashboard/procurement", icon: Wheat, desc: "Paddy & Suppliers" },
  { title: "Production", href: "/dashboard/production", icon: Factory, desc: "Milling & Batches" },
  { title: "Inventory", href: "/dashboard/inventory", icon: Warehouse, desc: "Stock & Warehouses" },
  { title: "Sales", href: "/dashboard/sales", icon: ShoppingCart, desc: "Orders & Invoices" },
  { title: "HR & Payroll", href: "/dashboard/hr", icon: Users, desc: "Employees & Salary" },
  { title: "CRM", href: "/dashboard/crm", icon: UserSearch, desc: "Leads & Brokers" },
  { title: "Transport", href: "/dashboard/transport", icon: Truck, desc: "Fleet & Logistics" },
  { title: "Reports", href: "/dashboard/reports", icon: BarChart3, desc: "Analytics & BI" },
  { title: "Export Sales", href: "/dashboard/export-sales", icon: Globe, desc: "Contracts & LCs" },
  { title: "Assets", href: "/dashboard/assets", icon: Building, desc: "Fixed Assets" },
  { title: "Expense", href: "/dashboard/expense", icon: Receipt, desc: "Claims & Vouchers" },
  { title: "Bank", href: "/dashboard/bank", icon: Landmark, desc: "Reconciliation" },
  { title: "Machines", href: "/dashboard/machines", icon: Cog, desc: "Maintenance & OEE" },
  { title: "Quality", href: "/dashboard/quality-control", icon: FlaskConical, desc: "Inspections" },
  { title: "Workflow", href: "/dashboard/workflow", icon: GitBranch, desc: "Approvals" },
  { title: "Documents", href: "/dashboard/documents", icon: FileText, desc: "DMS" },
  { title: "Market", href: "/dashboard/market", icon: TrendingUp, desc: "Rates & Trends" },
  { title: "AI", href: "/dashboard/ai", icon: Bot, desc: "Smart Assistant" },
  { title: "Gate Pass", href: "/dashboard/gate-pass", icon: DoorOpen, desc: "In/Out/Visitors" },
  { title: "BOM", href: "/dashboard/bom", icon: Layers, desc: "Bill of Materials" },
  { title: "Salespersons", href: "/dashboard/salespersons", icon: UserCheck, desc: "Sales Team" },
  { title: "Categories", href: "/dashboard/product-categories", icon: Tag, desc: "Product Types" },
  { title: "Announcements", href: "/dashboard/announcements", icon: Megaphone, desc: "Company News" },
  { title: "Email", href: "/dashboard/email", icon: Mail, desc: "Communication" },
  { title: "Budgeting", href: "/dashboard/budgeting", icon: PiggyBank, desc: "Budget Plans" },
  { title: "Commissions", href: "/dashboard/commissions", icon: Percent, desc: "Agent Commissions" },
];

export default function DashboardPage() {
  const org = useAuthStore((s) => s.organization);
  const { data: stats } = useApiGet<DashboardStats>(
    ["dashboard-stats"],
    "/reporting/executive-dashboard"
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{org ? ` to ${org.name}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s your business overview at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Revenue"
          value={stats ? formatCurrency(stats.totalRevenue || 0) : "..."}
          icon={DollarSign}
          description="This period"
        />
        <StatCard
          title="Purchases"
          value={stats?.totalPurchases ?? "..."}
          icon={Wheat}
          description="Paddy procurement"
        />
        <StatCard
          title="Active Sales"
          value={stats?.activeSalesOrders ?? stats?.totalSales ?? "..."}
          icon={ShoppingCart}
          description="Open orders"
        />
        <StatCard
          title="Inventory Value"
          value={stats ? formatCurrency(stats.inventoryValue || 0) : "..."}
          icon={Warehouse}
          description="Across all godowns"
        />
        <StatCard
          title="Production"
          value={stats?.productionOutput ?? "..."}
          icon={Package}
          description="Output this period"
        />
        <StatCard
          title="Employees"
          value={stats?.activeEmployees ?? "..."}
          icon={Users}
          description="Active workforce"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Modules</h2>
          <span className="text-xs text-muted-foreground">{quickLinks.length} modules available</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="h-full group cursor-pointer border hover:border-primary/30 hover:shadow-md transition-all">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <link.icon className="size-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{link.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{link.desc}</p>
                  </div>
                  <ArrowRight className="size-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground pt-6 border-t">
        <span className="font-medium">Grainix ERP</span> &mdash; Powered by Asad Ali (0308-4420406)
      </div>
    </div>
  );
}
