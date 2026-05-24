"use client";

import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Wheat,
  Warehouse,
  Users,
  Factory,
  Truck,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApiGet } from "@/hooks/use-api";

interface ReportData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalPurchases: number;
  totalSales: number;
  inventoryValue: number;
  activeEmployees: number;
  productionOutput: number;
}

const financialReports = [
  { title: "Trial Balance", icon: BarChart3, description: "Debit and credit balances for all accounts" },
  { title: "Profit & Loss", icon: TrendingUp, description: "Revenue, expenses, and net profit for the period" },
  { title: "Balance Sheet", icon: DollarSign, description: "Assets, liabilities, and equity snapshot" },
  { title: "Cash Flow", icon: DollarSign, description: "Cash inflows and outflows analysis" },
  { title: "Cash Book", icon: FileText, description: "All cash transactions chronologically" },
  { title: "Day Book", icon: FileText, description: "Daily transaction register" },
  { title: "General Ledger", icon: FileText, description: "Complete ledger with all postings" },
  { title: "Account Statement", icon: FileText, description: "Detailed statement for any account" },
  { title: "Receivables Aging", icon: DollarSign, description: "Outstanding customer receivables by age" },
  { title: "Payables Aging", icon: DollarSign, description: "Outstanding vendor payables by age" },
];

const operationalReports = [
  { title: "Procurement Report", icon: Wheat, description: "Paddy purchases, supplier analysis, quality trends" },
  { title: "Sales Report", icon: ShoppingCart, description: "Sales orders, invoices, customer analysis" },
  { title: "Inventory Report", icon: Warehouse, description: "Stock levels, movements, aging, valuation" },
  { title: "Production Report", icon: Factory, description: "Batch yields, recovery rates, machine utilization" },
  { title: "HR Report", icon: Users, description: "Employee stats, attendance, payroll summary" },
  { title: "Transport Report", icon: Truck, description: "Fleet utilization, fuel consumption, route efficiency" },
];

export default function ReportsPage() {
  const { data: kpis } = useApiGet<ReportData>(["report-kpis"], "/reporting/executive-dashboard");

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" description="Financial reports, operational analytics, and business intelligence" />

      {kpis && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Revenue</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{Number(kpis.totalRevenue || 0).toLocaleString("en-PK", { style: "currency", currency: "PKR" })}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Net Profit</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{Number(kpis.netProfit || 0).toLocaleString("en-PK", { style: "currency", currency: "PKR" })}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Sales</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{kpis.totalSales || 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Employees</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{kpis.activeEmployees || 0}</div></CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="financial">
        <TabsList>
          <TabsTrigger value="financial"><DollarSign className="mr-2 size-4" />Financial</TabsTrigger>
          <TabsTrigger value="operational"><Factory className="mr-2 size-4" />Operational</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {financialReports.map((report) => (
              <Card key={report.title} className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center gap-3">
                  <report.icon className="size-5 text-primary" />
                  <CardTitle className="text-base">{report.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{report.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="operational" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {operationalReports.map((report) => (
              <Card key={report.title} className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center gap-3">
                  <report.icon className="size-5 text-primary" />
                  <CardTitle className="text-base">{report.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{report.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
