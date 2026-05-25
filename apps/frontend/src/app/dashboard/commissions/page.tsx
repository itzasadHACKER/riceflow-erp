"use client";

import { useState } from "react";
import { Percent, Calculator, CheckSquare, Plus, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { formatCurrency, formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface CommRule { id: string; name: string; type: string; rate: number; minAmount: number; maxAmount: number; isActive: boolean; }
interface CommEntry { id: string; agentName: string; amount: string; transactionAmount: string; date: string; status: string; }
interface Settlement { id: string; agentName: string; totalAmount: string; date: string; status: string; }

const ruleColumns: Column<CommRule>[] = [
  { key: "name", header: "Rule Name" },
  { key: "type", header: "Type", render: (item) => <Badge variant="outline">{item.type}</Badge> },
  { key: "rate", header: "Rate", className: "text-right", render: (item) => <span className="font-mono">{item.rate}%</span> },
  { key: "minAmount", header: "Min Txn", className: "text-right", render: (item) => <span className="font-mono">{formatCurrency(item.minAmount)}</span> },
  { key: "maxAmount", header: "Max Txn", className: "text-right", render: (item) => <span className="font-mono">{formatCurrency(item.maxAmount)}</span> },
  { key: "isActive", header: "Status", render: (item) => <Badge variant={item.isActive ? "default" : "secondary"} className={item.isActive ? "bg-emerald-600" : ""}>{item.isActive ? "Active" : "Inactive"}</Badge> },
];

const entryColumns: Column<CommEntry>[] = [
  { key: "agentName", header: "Agent" },
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
  { key: "transactionAmount", header: "Txn Amount", className: "text-right", render: (item) => <span className="font-mono">{formatCurrency(item.transactionAmount)}</span> },
  { key: "amount", header: "Commission", className: "text-right", render: (item) => <span className="font-mono font-semibold text-emerald-600">{formatCurrency(item.amount)}</span> },
  { key: "status", header: "Status", render: (item) => <Badge variant={item.status === "SETTLED" ? "default" : "secondary"} className={item.status === "SETTLED" ? "bg-emerald-600" : ""}>{item.status}</Badge> },
];

const settlementColumns: Column<Settlement>[] = [
  { key: "agentName", header: "Agent" },
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
  { key: "totalAmount", header: "Amount", className: "text-right", render: (item) => <span className="font-mono font-semibold">{formatCurrency(item.totalAmount)}</span> },
  { key: "status", header: "Status", render: (item) => <Badge variant={item.status === "COMPLETED" ? "default" : "secondary"} className={item.status === "COMPLETED" ? "bg-emerald-600" : ""}>{item.status}</Badge> },
];

export default function CommissionsPage() {
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [ruleForm, setRuleForm] = useState({ name: "", type: "PERCENTAGE", rate: 0, minAmount: 0, maxAmount: 0 });

  const { data: rules = [], isLoading: rLoading } = useApiList<CommRule>(["commission-rules"], "/commissions/rules");
  const { data: entries = [], isLoading: eLoading } = useApiList<CommEntry>(["commission-entries"], "/commissions/entries");
  const { data: settlements = [], isLoading: sLoading } = useApiList<Settlement>(["settlements"], "/commissions/settlements");
  const createRuleMutation = useApiMutation("/commissions/rules", "post", [["commission-rules"]]);

  const totalCommission = entries.reduce((s, e) => s + Number(e.amount || 0), 0);
  const pendingCommission = entries.filter((e) => e.status !== "SETTLED").reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Commissions & Settlement" description="Commission rules, calculations, entries, and agent settlements" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Rules" value={rules.length} icon={Percent} description={`${rules.filter((r) => r.isActive).length} active`} />
        <StatCard title="Entries" value={entries.length} icon={Calculator} />
        <StatCard title="Total Commission" value={formatCurrency(totalCommission)} icon={DollarSign} />
        <StatCard title="Pending" value={formatCurrency(pendingCommission)} icon={CheckSquare} description={`${settlements.length} settled`} />
      </div>

      <Tabs defaultValue="entries">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="entries" className="gap-1.5"><Calculator className="size-3.5" />Entries ({entries.length})</TabsTrigger>
          <TabsTrigger value="rules" className="gap-1.5"><Percent className="size-3.5" />Rules ({rules.length})</TabsTrigger>
          <TabsTrigger value="settlements" className="gap-1.5"><CheckSquare className="size-3.5" />Settlements ({settlements.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="entries" className="space-y-4 mt-4">
          <DataTable columns={entryColumns} data={entries as unknown as CommEntry[]} isLoading={eLoading} emptyMessage="No commission entries." searchPlaceholder="Search entries..." />
        </TabsContent>
        <TabsContent value="rules" className="space-y-4 mt-4">
          <DataTable columns={ruleColumns} data={rules as unknown as CommRule[]} isLoading={rLoading} emptyMessage="No commission rules." searchPlaceholder="Search rules..."
            actions={<Button size="sm" className="gap-1.5" onClick={() => setShowCreateRule(true)}><Plus className="size-3.5" />New Rule</Button>} />
        </TabsContent>
        <TabsContent value="settlements" className="space-y-4 mt-4">
          <DataTable columns={settlementColumns} data={settlements as unknown as Settlement[]} isLoading={sLoading} emptyMessage="No settlements." searchPlaceholder="Search settlements..." />
        </TabsContent>
      </Tabs>

      <FormDialog open={showCreateRule} onOpenChange={setShowCreateRule} title="Create Commission Rule"
        onSubmit={(e) => { e.preventDefault(); createRuleMutation.mutate(ruleForm as never, { onSuccess: () => { setShowCreateRule(false); toast.success("Rule created"); } }); }}
        isLoading={createRuleMutation.isPending}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Rule Name</Label><Input value={ruleForm.name} onChange={(e) => setRuleForm((p) => ({ ...p, name: e.target.value }))} required placeholder="e.g. Broker Commission" /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Type</Label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={ruleForm.type} onChange={(e) => setRuleForm((p) => ({ ...p, type: e.target.value }))}>
              <option value="PERCENTAGE">Percentage</option><option value="FLAT">Flat Amount</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Rate %</Label><Input type="number" step="0.5" value={ruleForm.rate || ""} onChange={(e) => setRuleForm((p) => ({ ...p, rate: Number(e.target.value) }))} required /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Min Txn Amount</Label><Input type="number" value={ruleForm.minAmount || ""} onChange={(e) => setRuleForm((p) => ({ ...p, minAmount: Number(e.target.value) }))} /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Max Txn Amount</Label><Input type="number" value={ruleForm.maxAmount || ""} onChange={(e) => setRuleForm((p) => ({ ...p, maxAmount: Number(e.target.value) }))} /></div>
        </div>
      </FormDialog>
    </div>
  );
}
