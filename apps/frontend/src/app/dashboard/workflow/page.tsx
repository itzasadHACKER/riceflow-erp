"use client";

import { GitBranch, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList } from "@/hooks/use-api";
import { formatDate } from "@/lib/utils/numbering";

interface WorkflowDef { id: string; name: string; entityType: string; stepsCount: number; isActive: boolean; }
interface WorkflowInstance { id: string; definitionName: string; entityId: string; currentStep: string; status: string; createdAt: string; }

const defColumns: Column<WorkflowDef>[] = [
  { key: "name", header: "Workflow Name" },
  { key: "entityType", header: "Entity", render: (item) => <Badge variant="outline">{item.entityType}</Badge> },
  { key: "stepsCount", header: "Steps", className: "text-right", render: (item) => <span className="font-mono">{item.stepsCount}</span> },
  { key: "isActive", header: "Status", render: (item) => <Badge variant={item.isActive ? "default" : "secondary"} className={item.isActive ? "bg-emerald-600" : ""}>{item.isActive ? "Active" : "Inactive"}</Badge> },
];

const instanceColumns: Column<WorkflowInstance>[] = [
  { key: "definitionName", header: "Workflow" },
  { key: "currentStep", header: "Current Step" },
  {
    key: "status",
    header: "Status",
    render: (item) => {
      const colors: Record<string, string> = { PENDING: "", APPROVED: "bg-emerald-600", REJECTED: "bg-red-600", IN_PROGRESS: "bg-blue-600" };
      return <Badge variant={item.status === "PENDING" ? "secondary" : "default"} className={colors[item.status] ?? ""}>{item.status}</Badge>;
    },
  },
  { key: "createdAt", header: "Created", render: (item) => formatDate(item.createdAt) },
];

export default function WorkflowPage() {
  const { data: defs = [], isLoading: defLoading } = useApiList<WorkflowDef>(["workflow-defs"], "/workflow/definitions");
  const { data: instances = [], isLoading: instLoading } = useApiList<WorkflowInstance>(["workflow-instances"], "/workflow/pending");

  return (
    <div className="space-y-6">
      <PageHeader title="Workflow Engine" description="Approval workflows, multi-stage approvals, and escalation rules" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Definitions" value={defs.length} icon={GitBranch} />
        <StatCard title="Pending" value={instances.filter((i) => i.status === "PENDING").length} icon={Clock} />
        <StatCard title="Approved" value={instances.filter((i) => i.status === "APPROVED").length} icon={CheckCircle2} />
        <StatCard title="Rejected" value={instances.filter((i) => i.status === "REJECTED").length} icon={XCircle} />
      </div>

      <Tabs defaultValue="instances">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="instances" className="gap-1.5"><Clock className="size-3.5" />Pending Approvals</TabsTrigger>
          <TabsTrigger value="definitions" className="gap-1.5"><GitBranch className="size-3.5" />Definitions</TabsTrigger>
        </TabsList>
        <TabsContent value="instances" className="space-y-4 mt-4">
          <DataTable columns={instanceColumns} data={instances as unknown as WorkflowInstance[]} isLoading={instLoading} emptyMessage="No pending approvals." searchPlaceholder="Search approvals..." />
        </TabsContent>
        <TabsContent value="definitions" className="space-y-4 mt-4">
          <DataTable columns={defColumns} data={defs as unknown as WorkflowDef[]} isLoading={defLoading} emptyMessage="No workflow definitions." searchPlaceholder="Search workflows..." />
        </TabsContent>
      </Tabs>
    </div>
  );
}
