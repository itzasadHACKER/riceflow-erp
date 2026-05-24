"use client";

import { useState } from "react";
import { Building2, TrendingUp, ArrowRightLeft, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { formatCurrency } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface CostCenter { id: string; code: string; name: string; type: string; isActive: boolean; budgetAmount: string; actualSpend: string; allocations: any[]; }

const ccColumns: Column<CostCenter>[] = [
  { key: "code", header: "Code", render: (r) => <span className="font-mono font-semibold">{r.code}</span> },
  { key: "name", header: "Name" },
  { key: "type", header: "Type", render: (r) => <Badge className={r.type === "PROFIT" ? "bg-emerald-600" : "bg-blue-500"}>{r.type}</Badge> },
  { key: "budgetAmount", header: "Budget", className: "text-right", render: (r) => <span className="font-mono">{formatCurrency(r.budgetAmount)}</span> },
  { key: "actualSpend", header: "Actual Spend", className: "text-right", render: (r) => <span className="font-mono">{formatCurrency(r.actualSpend)}</span> },
  { key: "allocations", header: "Allocations", className: "text-right", render: (r) => <span className="font-mono">{r.allocations?.length || 0}</span> },
  { key: "isActive", header: "Status", render: (r) => <Badge className={r.isActive ? "bg-emerald-600" : "bg-slate-500"}>{r.isActive ? "Active" : "Inactive"}</Badge> },
];

export default function CostCentersPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", type: "COST", description: "", budgetAmount: 0 });

  const { data: centers = [], isLoading } = useApiList<CostCenter>(["cost-centers"], "/cost-centers");
  const { data: summary } = useApiList<any>(["cc-summary"], "/cost-centers/summary");

  const createMut = useApiMutation("/cost-centers", "post", { invalidateKeys: [["cost-centers"], ["cc-summary"]], onSuccess: () => { setShowCreate(false); toast.success("Cost center created"); } });

  const stats = summary as any;

  return (
    <div className="space-y-6">
      <PageHeader title="Cost & Profit Centers" description="Track costs by department, division, or project with allocation rules">
        <Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" />New Cost Center</Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Centers" value={stats?.total ?? 0} icon={Building2} />
        <StatCard title="Cost Centers" value={stats?.costCenters ?? 0} icon={ArrowRightLeft} />
        <StatCard title="Profit Centers" value={stats?.profitCenters ?? 0} icon={TrendingUp} trend="up" />
      </div>

      <DataTable columns={ccColumns} data={centers} isLoading={isLoading}  />

      <FormDialog open={showCreate} onOpenChange={setShowCreate} title="New Cost/Profit Center" onSubmit={() => createMut.mutate(form)} isLoading={createMut.isPending}>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4"><div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. CC-ADMIN" /></div><div><Label>Type</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v ?? '' })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="COST">Cost Center</SelectItem><SelectItem value="PROFIT">Profit Center</SelectItem></SelectContent></Select></div></div>
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Administration" /></div>
          <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><Label>Budget Amount</Label><Input type="number" value={form.budgetAmount} onChange={(e) => setForm({ ...form, budgetAmount: Number(e.target.value) })} /></div>
        </div>
      </FormDialog>
    </div>
  );
}
