"use client";

import { BarChart3, TrendingUp, DollarSign, Wheat, ShoppingCart, Users, Warehouse, Factory, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

const reports = [
  { title: "Profit & Loss", desc: "Income vs expenses for the period", icon: DollarSign, href: "#" },
  { title: "Balance Sheet", desc: "Assets, liabilities, and equity", icon: BarChart3, href: "#" },
  { title: "Trial Balance", desc: "Verify all debits equal credits", icon: TrendingUp, href: "#" },
  { title: "Cash Flow", desc: "Cash inflows and outflows", icon: DollarSign, href: "#" },
  { title: "Procurement Analysis", desc: "Paddy purchase trends and costs", icon: Wheat, href: "#" },
  { title: "Sales Report", desc: "Revenue, orders, and invoicing", icon: ShoppingCart, href: "#" },
  { title: "Inventory Report", desc: "Stock levels across warehouses", icon: Warehouse, href: "#" },
  { title: "Production Report", desc: "Milling output and recovery rates", icon: Factory, href: "#" },
  { title: "HR Report", desc: "Payroll, attendance, and leaves", icon: Users, href: "#" },
  { title: "Transport Report", desc: "Fleet utilization and fuel costs", icon: Truck, href: "#" },
  { title: "Receivables Aging", desc: "Outstanding customer payments", icon: TrendingUp, href: "#" },
  { title: "Payables Aging", desc: "Outstanding vendor payments", icon: TrendingUp, href: "#" },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" description="Business intelligence, financial reports, and operational analytics" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {reports.map((report) => (
          <Card key={report.title} className="cursor-pointer hover:shadow-md hover:border-primary/20 transition-all group">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <report.icon className="size-4 text-primary" />
              </div>
              <CardTitle className="text-sm font-semibold">{report.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{report.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
