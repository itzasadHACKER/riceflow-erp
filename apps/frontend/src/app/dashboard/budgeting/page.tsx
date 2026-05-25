"use client";

import { useState } from "react";
import { PiggyBank, Plus, TrendingUp, AlertTriangle, CheckCircle2, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { formatCurrency, formatDate, todayISO } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface Budget { id: string; name: string; fiscalYear: string; totalAmount: string; status: string; department: string; startDate: string; endDate: string; utilized: number; }
interface BudgetLineItem { id: string; budgetName: string; accountName: string; budgetedAmount: string; actualAmount: string; variance: string; variancePercent: number; }

const budgetColumns: Column<Budget>[] = [
  { key: "name", header: "Budget Name" },
  { key: "department", header: "Department", render: (item) => <Badge variant="outline">{item.department ?? "General"}</Badge> },
  { key: "fiscalYear", header: "Fiscal Year" },
  { key: "totalAmount", header: "Amount", className: "text-right", render: (item) => <span className="font-mono font-semibold">{formatCurrency(item.totalAmount)}</span> },
  { key: "utilized", header: "Utilized", className: "text-right", render: (item) => {
    const pct = item.utilized ?? 0;
    return (
      <div className="flex items-center gap-2 justify-end">
        <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full ${pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <span className="font-mono text-xs">{pct.toFixed(0)}%</span>
      </div>
    );
  }},
  {
    key: "status", header: "Status", render: (item) => {
      const c: Record<string, string> = { DRAFT: "", APPROVED: "bg-emerald-600", CLOSED: "bg-gray-600" };
      return <Badge variant={item.status === "DRAFT" ? "secondary" : "default"} className={c[item.status] ?? ""}>{item.status}</Badge>;
    },
  },
];

const varianceColumns: Column<BudgetLineItem>[] = [
  { key: "accountName", header: "Account" },
  { key: "budgetedAmount", header: "Budgeted", className: "text-right", render: (item) => <span className="font-mono">{formatCurrency(item.budgetedAmount)}</span> },
  { key: "actualAmount", header: "Actual", className: "text-right", render: (item) => <span className="font-mono">{formatCurrency(item.actualAmount)}</span> },
  { key: "variance", header: "Variance", className: "text-right", render: (item) => {
    const v = Number(item.variance || 0);
    return <span className={`font-mono font-semibold ${v >= 0 ? "text-emerald-600" : "text-red-600"}`}>{v >= 0 ? "+" : ""}{formatCurrency(v)}</span>;
  }},
  { key: "variancePercent", header: "Var %", className: "text-right", render: (item) => {
    const p = item.variancePercent ?? 0;
    return <span className={`font-mono ${p >= 0 ? "text-emerald-600" : "text-red-600"}`}>{p >= 0 ? "+" : ""}{p.toFixed(1)}%</span>;
  }},
];

export default function BudgetingPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", department: "", fiscalYear: "2025-2026", totalAmount: 0, startDate: todayISO(), endDate: "" });

  const { data: budgets = [], isLoading } = useApiList<Budget>(["budgets"], "/budgets");
  const { data: variances = [] } = useApiList<BudgetLineItem>(["budget-variance"], "/budgets/variance");
  const createMutation = useApiMutation("/budgets", "post", [["budgets"]]);

  const totalBudget = budgets.reduce((s, b) => s + Number(b.totalAmount || 0), 0);
  const approved = budgets.filter((b) => b.status === "APPROVED").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Budgeting" description="Budget planning, variance analysis, and departmental budgets" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Budgets" value={budgets.length} icon={PiggyBank} />
        <StatCard title="Total Budgeted" value={formatCurrency(totalBudget)} icon={TrendingUp} />
        <StatCard title="Approved" value={approved} icon={CheckCircle2} />
        <StatCard title="Variance Items" value={variances.length} icon={BarChart3} />
      </div>

      <Tabs defaultValue="budgets">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="budgets" className="gap-1.5"><PiggyBank className="size-3.5" />Budgets</TabsTrigger>
          <TabsTrigger value="variance" className="gap-1.5"><BarChart3 className="size-3.5" />Variance Analysis</TabsTrigger>
        </TabsList>
        <TabsContent value="budgets" className="space-y-4 mt-4">
          <DataTable columns={budgetColumns} data={budgets as unknown as Budget[]} isLoading={isLoading} emptyMessage="No budgets created." searchPlaceholder="Search budgets..."
            actions={<Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}><Plus className="size-3.5" />New Budget</Button>} />
        </TabsContent>
        <TabsContent value="variance" className="space-y-4 mt-4">
          <DataTable columns={varianceColumns} data={variances as unknown as BudgetLineItem[]} isLoading={false} emptyMessage="No variance data. Create and approve a budget first." searchPlaceholder="Search..." />
        </TabsContent>
      </Tabs>

      <FormDialog open={showCreate} onOpenChange={setShowCreate} title="Create Budget"
        onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form as never, { onSuccess: () => { setShowCreate(false); toast.success("Budget created"); } }); }}
        isLoading={createMutation.isPending}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Budget Name</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required placeholder="e.g. Q1 Operations Budget" /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Department</Label><Input value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} placeholder="e.g. Production" /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Fiscal Year</Label><Input value={form.fiscalYear} onChange={(e) => setForm((p) => ({ ...p, fiscalYear: e.target.value }))} /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} required /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">End Date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} /></div>
        </div>
        <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Total Amount</Label><Input type="number" value={form.totalAmount || ""} onChange={(e) => setForm((p) => ({ ...p, totalAmount: Number(e.target.value) }))} required /></div>
      </FormDialog>
    </div>
  );
}
