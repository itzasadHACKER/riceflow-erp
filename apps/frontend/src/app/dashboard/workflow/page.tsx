"use client";

import { useState } from "react";
import { GitBranch, Clock, CheckCircle2, XCircle, Plus, ListChecks } from "lucide-react";
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
import { formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface WorkflowDef { id: string; name: string; entityType: string; stepsCount: number; isActive: boolean; description: string; }
interface WorkflowInstance { id: string; definitionName: string; entityId: string; currentStep: string; status: string; createdAt: string; initiatedByName: string; }

const defColumns: Column<WorkflowDef>[] = [
  { key: "name", header: "Workflow Name" },
  { key: "entityType", header: "Entity", render: (item) => <Badge variant="outline">{item.entityType}</Badge> },
  { key: "stepsCount", header: "Steps", className: "text-right", render: (item) => <span className="font-mono">{item.stepsCount}</span> },
  { key: "description", header: "Description", render: (item) => <span className="text-muted-foreground max-w-[200px] truncate block">{item.description ?? "—"}</span> },
  { key: "isActive", header: "Status", render: (item) => <Badge variant={item.isActive ? "default" : "secondary"} className={item.isActive ? "bg-emerald-600" : ""}>{item.isActive ? "Active" : "Inactive"}</Badge> },
];

const instanceColumns: Column<WorkflowInstance>[] = [
  { key: "definitionName", header: "Workflow" },
  { key: "currentStep", header: "Current Step" },
  { key: "initiatedByName", header: "Initiated By", render: (item) => item.initiatedByName ?? "—" },
  {
    key: "status", header: "Status", render: (item) => {
      const colors: Record<string, string> = { PENDING: "", APPROVED: "bg-emerald-600", REJECTED: "bg-red-600", IN_PROGRESS: "bg-blue-600" };
      return <Badge variant={item.status === "PENDING" ? "secondary" : "default"} className={colors[item.status] ?? ""}>{item.status}</Badge>;
    },
  },
  { key: "createdAt", header: "Created", render: (item) => formatDate(item.createdAt) },
];

const ENTITY_TYPES = ["PURCHASE_ORDER", "SALES_ORDER", "INVOICE", "EXPENSE", "LEAVE_REQUEST", "GATE_PASS", "JOURNAL_ENTRY", "BUDGET"];

export default function WorkflowPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", entityType: "PURCHASE_ORDER", description: "", steps: [{ name: "Manager Approval", approverRole: "MANAGER", order: 1 }] });

  const { data: defs = [], isLoading: defLoading } = useApiList<WorkflowDef>(["workflow-defs"], "/workflow/definitions");
  const { data: instances = [], isLoading: instLoading } = useApiList<WorkflowInstance>(["workflow-instances"], "/workflow/pending");
  const createMutation = useApiMutation("/workflow/definitions", "post", [["workflow-defs"]]);

  const pending = instances.filter((i) => i.status === "PENDING").length;
  const approved = instances.filter((i) => i.status === "APPROVED").length;
  const rejected = instances.filter((i) => i.status === "REJECTED").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Workflow Engine" description="Approval workflows, multi-stage approvals, escalation rules, and pending tasks" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Definitions" value={defs.length} icon={GitBranch} description={`${defs.filter((d) => d.isActive).length} active`} />
        <StatCard title="Pending" value={pending} icon={Clock} />
        <StatCard title="Approved" value={approved} icon={CheckCircle2} />
        <StatCard title="Rejected" value={rejected} icon={XCircle} />
      </div>

      <Tabs defaultValue="instances">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="instances" className="gap-1.5"><Clock className="size-3.5" />Pending Approvals ({pending})</TabsTrigger>
          <TabsTrigger value="definitions" className="gap-1.5"><GitBranch className="size-3.5" />Definitions ({defs.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="instances" className="space-y-4 mt-4">
          <DataTable columns={instanceColumns} data={instances as unknown as WorkflowInstance[]} isLoading={instLoading} emptyMessage="No pending approvals." searchPlaceholder="Search approvals..." />
        </TabsContent>
        <TabsContent value="definitions" className="space-y-4 mt-4">
          <DataTable columns={defColumns} data={defs as unknown as WorkflowDef[]} isLoading={defLoading} emptyMessage="No workflow definitions. Create your first approval workflow." searchPlaceholder="Search workflows..."
            actions={<Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}><Plus className="size-3.5" />New Workflow</Button>} />
        </TabsContent>
      </Tabs>

      <FormDialog open={showCreate} onOpenChange={setShowCreate} title="Create Workflow Definition" size="lg"
        onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form as never, { onSuccess: () => { setShowCreate(false); toast.success("Workflow created"); } }); }}
        isLoading={createMutation.isPending}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Name</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required placeholder="e.g. Purchase Approval" /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Entity Type</Label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.entityType} onChange={(e) => setForm((p) => ({ ...p, entityType: e.target.value }))}>
              {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Description</Label><Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Describe this workflow..." /></div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase tracking-wider">Approval Steps</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => setForm((p) => ({ ...p, steps: [...p.steps, { name: "", approverRole: "MANAGER", order: p.steps.length + 1 }] }))}>
              <Plus className="size-3 mr-1" />Add Step
            </Button>
          </div>
          <div className="space-y-2">
            {form.steps.map((step, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <span className="col-span-1 text-center font-mono text-sm text-muted-foreground">{idx + 1}</span>
                <div className="col-span-5"><Input value={step.name} onChange={(e) => { const s = [...form.steps]; s[idx] = { ...s[idx], name: e.target.value }; setForm((p) => ({ ...p, steps: s })); }} placeholder="Step name" /></div>
                <div className="col-span-4">
                  <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={step.approverRole} onChange={(e) => { const s = [...form.steps]; s[idx] = { ...s[idx], approverRole: e.target.value }; setForm((p) => ({ ...p, steps: s })); }}>
                    <option value="MANAGER">Manager</option><option value="DIRECTOR">Director</option><option value="ADMIN">Admin</option><option value="FINANCE">Finance</option>
                  </select>
                </div>
                <div className="col-span-2 text-right">
                  {form.steps.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setForm((p) => ({ ...p, steps: p.steps.filter((_, i) => i !== idx) }))}>Remove</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
