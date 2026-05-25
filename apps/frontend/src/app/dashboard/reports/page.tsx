"use client";

import { useState } from "react";
import { BarChart3, TrendingUp, DollarSign, Wheat, ShoppingCart, Users, Warehouse, Factory, Truck, Calendar, DoorOpen, Cog, UserSearch, Building, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { useApiList } from "@/hooks/use-api";
import { todayISO } from "@/lib/utils/numbering";

const PERIODS = ["daily", "weekly", "mtd", "monthly", "ytd", "yearly", "custom"] as const;
type Period = (typeof PERIODS)[number];

const MODULES = [
  { key: "sales", title: "Sales Report", desc: "Revenue, orders, and invoicing", icon: ShoppingCart },
  { key: "procurement", title: "Procurement", desc: "Paddy purchase trends and costs", icon: Wheat },
  { key: "production", title: "Production", desc: "Milling output and recovery rates", icon: Factory },
  { key: "expense", title: "Expense Report", desc: "Expense claims and analysis", icon: Receipt },
  { key: "gate-pass", title: "Gate Pass", desc: "Gate pass activity summary", icon: DoorOpen },
  { key: "assets", title: "Assets", desc: "Fixed asset summary", icon: Building },
  { key: "crm", title: "CRM", desc: "Leads, meetings, follow-ups", icon: UserSearch },
  { key: "machines", title: "Machines", desc: "Machine utilization and maintenance", icon: Cog },
  { key: "transport", title: "Transport", desc: "Fleet and fuel analysis", icon: Truck },
] as const;

const financialReports = [
  { title: "Profit & Loss", desc: "Income vs expenses for the period", icon: DollarSign },
  { title: "Balance Sheet", desc: "Assets, liabilities, and equity", icon: BarChart3 },
  { title: "Trial Balance", desc: "Verify all debits equal credits", icon: TrendingUp },
  { title: "Cash Flow", desc: "Cash inflows and outflows", icon: DollarSign },
  { title: "Receivables Aging", desc: "Outstanding customer payments", icon: TrendingUp },
  { title: "Payables Aging", desc: "Outstanding vendor payments", icon: TrendingUp },
  { title: "HR Report", desc: "Payroll, attendance, and leaves", icon: Users },
  { title: "Inventory", desc: "Stock levels across warehouses", icon: Warehouse },
];

export default function ReportsPage() {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("mtd");
  const [customFrom, setCustomFrom] = useState(todayISO());
  const [customTo, setCustomTo] = useState(todayISO());

  const queryStr = selectedModule
    ? `/reporting/universal/${selectedModule}?period=${period}${period === "custom" ? `&fromDate=${customFrom}&toDate=${customTo}` : ""}`
    : null;

  const { data: rawReportData, isLoading } = useApiList<Record<string, unknown>>(
    ["universal-report", selectedModule ?? "", period, customFrom, customTo],
    queryStr ?? "/reporting/dashboard",
  );
  const reportData = rawReportData as unknown as Record<string, unknown> | null;

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" description="Comprehensive business intelligence — daily, monthly, yearly, and custom date range reports for every module" />

      {/* Period selector */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <Label className="text-sm font-semibold">Report Period:</Label>
            {PERIODS.map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(p)}
                className="capitalize"
              >
                {p === "mtd" ? "MTD" : p === "ytd" ? "YTD" : p}
              </Button>
            ))}
            {period === "custom" && (
              <div className="flex items-center gap-2 ml-2">
                <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="w-auto" />
                <span className="text-muted-foreground">to</span>
                <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="w-auto" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Module report cards */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Module Reports</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((mod) => {
            const isActive = selectedModule === mod.key;
            return (
              <Card
                key={mod.key}
                className={`cursor-pointer transition-all hover:shadow-md ${isActive ? "border-primary shadow-md ring-1 ring-primary/20" : "hover:border-primary/20"}`}
                onClick={() => setSelectedModule(isActive ? null : mod.key)}
              >
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <div className={`flex size-9 items-center justify-center rounded-lg transition-colors ${isActive ? "bg-primary text-primary-foreground" : "bg-primary/10"}`}>
                    <mod.icon className="size-4" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-sm font-semibold">{mod.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">{mod.desc}</p>
                  </div>
                  {isActive && <Badge variant="default" className="bg-primary">Selected</Badge>}
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Report data display */}
      {selectedModule && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg capitalize">{selectedModule.replace("-", " ")} Report — {period.toUpperCase()}</CardTitle>
              {isLoading && <Badge variant="outline">Loading...</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            {reportData && typeof reportData === "object" ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(reportData as Record<string, unknown>)
                  .filter(([key]) => !["period", "startDate", "endDate", "error", "availableModules"].includes(key))
                  .map(([key, value]) => {
                    if (typeof value === "object" && value !== null) {
                      return (
                        <Card key={key} className="col-span-full">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-2 sm:grid-cols-3">
                              {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                                <div key={k} className="flex justify-between items-center py-1 border-b last:border-0">
                                  <span className="text-sm text-muted-foreground capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</span>
                                  <span className="font-mono font-medium">{typeof v === "number" ? v.toLocaleString("en-PK") : String(v)}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }
                    return (
                      <div key={key} className="rounded-lg border p-4">
                        <p className="text-xs text-muted-foreground capitalize mb-1">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                        <p className="text-2xl font-bold font-mono">
                          {typeof value === "number" ? value.toLocaleString("en-PK") : String(value ?? "—")}
                        </p>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-muted-foreground">Select a module and period to view the report.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Financial reports grid */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Financial & Other Reports</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {financialReports.map((report) => (
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
    </div>
  );
}
