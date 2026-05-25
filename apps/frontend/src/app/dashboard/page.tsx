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
  Phone,
  FolderKanban,
  PackageSearch,
  CreditCard,
  Target,
  Shield,
  Calendar,
  Hash,
  Handshake,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { useApiGet } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { formatCurrency } from "@/lib/utils/numbering";
import type { LucideIcon } from "lucide-react";

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

type ModuleColor = "indigo" | "emerald" | "amber" | "rose" | "sky" | "violet" | "teal" | "orange";

interface QuickLink {
  title: string;
  href: string;
  icon: LucideIcon;
  desc: string;
  color: ModuleColor;
}

const moduleColors: Record<ModuleColor, { bg: string; icon: string; hover: string }> = {
  indigo: { bg: "bg-indigo-50 dark:bg-indigo-950/30", icon: "text-indigo-600 dark:text-indigo-400", hover: "hover:border-indigo-200 dark:hover:border-indigo-800" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/30", icon: "text-emerald-600 dark:text-emerald-400", hover: "hover:border-emerald-200 dark:hover:border-emerald-800" },
  amber: { bg: "bg-amber-50 dark:bg-amber-950/30", icon: "text-amber-600 dark:text-amber-400", hover: "hover:border-amber-200 dark:hover:border-amber-800" },
  rose: { bg: "bg-rose-50 dark:bg-rose-950/30", icon: "text-rose-600 dark:text-rose-400", hover: "hover:border-rose-200 dark:hover:border-rose-800" },
  sky: { bg: "bg-sky-50 dark:bg-sky-950/30", icon: "text-sky-600 dark:text-sky-400", hover: "hover:border-sky-200 dark:hover:border-sky-800" },
  violet: { bg: "bg-violet-50 dark:bg-violet-950/30", icon: "text-violet-600 dark:text-violet-400", hover: "hover:border-violet-200 dark:hover:border-violet-800" },
  teal: { bg: "bg-teal-50 dark:bg-teal-950/30", icon: "text-teal-600 dark:text-teal-400", hover: "hover:border-teal-200 dark:hover:border-teal-800" },
  orange: { bg: "bg-orange-50 dark:bg-orange-950/30", icon: "text-orange-600 dark:text-orange-400", hover: "hover:border-orange-200 dark:hover:border-orange-800" },
};

const quickLinks: QuickLink[] = [
  { title: "Finance", href: "/dashboard/finance", icon: Wallet, desc: "Accounts & Journals", color: "indigo" },
  { title: "Procurement", href: "/dashboard/procurement", icon: Wheat, desc: "Paddy & Suppliers", color: "amber" },
  { title: "Production", href: "/dashboard/production", icon: Factory, desc: "Milling & Batches", color: "orange" },
  { title: "Inventory", href: "/dashboard/inventory", icon: Warehouse, desc: "Stock & Warehouses", color: "teal" },
  { title: "Sales", href: "/dashboard/sales", icon: ShoppingCart, desc: "Orders & Invoices", color: "emerald" },
  { title: "HR & Payroll", href: "/dashboard/hr", icon: Users, desc: "Employees & Salary", color: "violet" },
  { title: "CRM", href: "/dashboard/crm", icon: UserSearch, desc: "Leads & Brokers", color: "sky" },
  { title: "Transport", href: "/dashboard/transport", icon: Truck, desc: "Fleet & Logistics", color: "amber" },
  { title: "Reports", href: "/dashboard/reports", icon: BarChart3, desc: "Analytics & BI", color: "indigo" },
  { title: "Export Sales", href: "/dashboard/export-sales", icon: Globe, desc: "Contracts & LCs", color: "emerald" },
  { title: "Assets", href: "/dashboard/assets", icon: Building, desc: "Fixed Assets", color: "rose" },
  { title: "Expense", href: "/dashboard/expense", icon: Receipt, desc: "Claims & Vouchers", color: "orange" },
  { title: "Bank", href: "/dashboard/bank", icon: Landmark, desc: "Reconciliation", color: "indigo" },
  { title: "Machines", href: "/dashboard/machines", icon: Cog, desc: "Maintenance & OEE", color: "amber" },
  { title: "Quality", href: "/dashboard/quality-control", icon: FlaskConical, desc: "Inspections", color: "teal" },
  { title: "Workflow", href: "/dashboard/workflow", icon: GitBranch, desc: "Approvals", color: "violet" },
  { title: "Documents", href: "/dashboard/documents", icon: FileText, desc: "DMS", color: "sky" },
  { title: "Market", href: "/dashboard/market", icon: TrendingUp, desc: "Rates & Trends", color: "emerald" },
  { title: "AI", href: "/dashboard/ai", icon: Bot, desc: "Smart Assistant", color: "violet" },
  { title: "Gate Pass", href: "/dashboard/gate-pass", icon: DoorOpen, desc: "In/Out/Visitors", color: "amber" },
  { title: "BOM", href: "/dashboard/bom", icon: Layers, desc: "Bill of Materials", color: "orange" },
  { title: "Salespersons", href: "/dashboard/salespersons", icon: UserCheck, desc: "Sales Team", color: "emerald" },
  { title: "Categories", href: "/dashboard/product-categories", icon: Tag, desc: "Product Types", color: "sky" },
  { title: "Announcements", href: "/dashboard/announcements", icon: Megaphone, desc: "Company News", color: "rose" },
  { title: "Email", href: "/dashboard/email", icon: Mail, desc: "Communication", color: "indigo" },
  { title: "Budgeting", href: "/dashboard/budgeting", icon: PiggyBank, desc: "Budget Plans", color: "teal" },
  { title: "Commissions", href: "/dashboard/commissions", icon: Percent, desc: "Agent Commissions", color: "amber" },
  { title: "Service Mgmt", href: "/dashboard/service-management", icon: Phone, desc: "Calls & Contracts", color: "sky" },
  { title: "Projects", href: "/dashboard/project-management", icon: FolderKanban, desc: "Tasks & Timesheets", color: "violet" },
  { title: "MRP Engine", href: "/dashboard/mrp", icon: Cog, desc: "Material Planning", color: "orange" },
  { title: "Quotations", href: "/dashboard/sales-quotations", icon: FileText, desc: "Sales Quotes", color: "emerald" },
  { title: "Pricing", href: "/dashboard/pricing", icon: Tag, desc: "Price Lists", color: "amber" },
  { title: "RFQ", href: "/dashboard/purchase-enhancements", icon: Handshake, desc: "Requisitions", color: "teal" },
  { title: "Batch & Serial", href: "/dashboard/batch-serial", icon: Hash, desc: "Traceability", color: "indigo" },
  { title: "Pick & Pack", href: "/dashboard/pick-pack", icon: PackageSearch, desc: "Shipping", color: "sky" },
  { title: "Cost Centers", href: "/dashboard/cost-centers", icon: CreditCard, desc: "Cost Tracking", color: "rose" },
  { title: "Payment Wizard", href: "/dashboard/payment-wizard", icon: CreditCard, desc: "Batch Payments", color: "indigo" },
  { title: "Marketing", href: "/dashboard/marketing-campaigns", icon: Target, desc: "Campaigns & ROI", color: "rose" },
  { title: "Financial Periods", href: "/dashboard/financial-periods", icon: Calendar, desc: "Period Locking", color: "violet" },
  { title: "Production Orders", href: "/dashboard/production-orders", icon: Factory, desc: "Full Lifecycle", color: "orange" },
  { title: "Admin Tools", href: "/dashboard/admin-enhancements", icon: Shield, desc: "UDT & Auth", color: "rose" },
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
          color="emerald"
        />
        <StatCard
          title="Purchases"
          value={stats?.totalPurchases ?? "..."}
          icon={Wheat}
          description="Paddy procurement"
          color="amber"
        />
        <StatCard
          title="Active Sales"
          value={stats?.activeSalesOrders ?? stats?.totalSales ?? "..."}
          icon={ShoppingCart}
          description="Open orders"
          color="sky"
        />
        <StatCard
          title="Inventory Value"
          value={stats ? formatCurrency(stats.inventoryValue || 0) : "..."}
          icon={Warehouse}
          description="Across all godowns"
          color="teal"
        />
        <StatCard
          title="Production"
          value={stats?.productionOutput ?? "..."}
          icon={Package}
          description="Output this period"
          color="orange"
        />
        <StatCard
          title="Employees"
          value={stats?.activeEmployees ?? "..."}
          icon={Users}
          description="Active workforce"
          color="violet"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Modules</h2>
          <span className="text-xs text-muted-foreground">{quickLinks.length} modules available</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {quickLinks.map((link) => {
            const mc = moduleColors[link.color];
            return (
              <Link key={link.href} href={link.href}>
                <Card className={`h-full group cursor-pointer border hover:shadow-md transition-all ${mc.hover}`}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${mc.bg} transition-colors`}>
                      <link.icon className={`size-4 ${mc.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{link.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{link.desc}</p>
                    </div>
                    <ArrowRight className="size-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground pt-6 border-t">
        <span className="font-medium">Grainix ERP</span> &mdash; Powered by Asad Ali (0308-4420406)
      </div>
    </div>
  );
}
