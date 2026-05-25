"use client";

import { useState } from "react";
import { FolderKanban, ListTodo, Clock, Milestone, Plus, TrendingUp } from "lucide-react";
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

interface Project { id: string; projectCode: string; name: string; status: string; startDate: string; endDate: string; budgetAmount: string; actualCost: string; completionPercent: string; tasks?: any[]; milestones?: any[]; }
interface Task { id: string; taskCode: string; name: string; status: string; priority: string; assignedToId: string; completionPercent: string; }
interface TimesheetEntry { id: string; date: string; hours: string; description: string; project?: { name: string; projectCode: string }; billable: boolean; }

const statusColors: Record<string, string> = { PLANNED: "bg-slate-500", IN_PROGRESS_PROJ: "bg-blue-500", ON_HOLD_PROJ: "bg-amber-500", COMPLETED_PROJ: "bg-emerald-500", CANCELLED_PROJ: "bg-red-500" };

const projectColumns: Column<Project>[] = [
  { key: "projectCode", header: "Code", render: (r) => <span className="font-mono font-semibold">{r.projectCode}</span> },
  { key: "name", header: "Project Name" },
  { key: "status", header: "Status", render: (r) => <Badge className={statusColors[r.status] || "bg-slate-500"}>{r.status.replace("_PROJ", "")}</Badge> },
  { key: "completionPercent", header: "Progress", className: "text-right", render: (r) => (
    <div className="flex items-center gap-2">
      <div className="w-16 bg-slate-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Number(r.completionPercent)}%` }} /></div>
      <span className="font-mono text-sm">{Number(r.completionPercent).toFixed(0)}%</span>
    </div>
  )},
  { key: "budgetAmount", header: "Budget", className: "text-right", render: (r) => <span className="font-mono">{formatCurrency(r.budgetAmount)}</span> },
  { key: "actualCost", header: "Actual", className: "text-right", render: (r) => <span className="font-mono">{formatCurrency(r.actualCost)}</span> },
  { key: "startDate", header: "Start", render: (r) => r.startDate ? formatDate(r.startDate) : "-" },
  { key: "endDate", header: "End", render: (r) => r.endDate ? formatDate(r.endDate) : "-" },
];

const timesheetColumns: Column<TimesheetEntry>[] = [
  { key: "date", header: "Date", render: (r) => formatDate(r.date) },
  { key: "project", header: "Project", render: (r) => r.project?.projectCode || "-" },
  { key: "hours", header: "Hours", className: "text-right", render: (r) => <span className="font-mono font-semibold">{Number(r.hours).toFixed(1)}h</span> },
  { key: "description", header: "Description" },
  { key: "billable", header: "Billable", render: (r) => <Badge className={r.billable ? "bg-emerald-600" : "bg-slate-500"}>{r.billable ? "Yes" : "No"}</Badge> },
];

export default function ProjectManagementPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", startDate: "", endDate: "", budgetAmount: 0 });

  const { data: projects = [], isLoading } = useApiList<Project>(["projects"], "/projects");
  const { data: timesheets = [] } = useApiList<TimesheetEntry>(["timesheets"], "/projects/timesheets/all");
  const { data: summary } = useApiList<any>(["project-summary"], "/projects/summary");

  const createMut = useApiMutation("/projects", "post", { invalidateKeys: [["projects"], ["project-summary"]], onSuccess: () => { setShowCreate(false); toast.success("Project created"); } });

  const stats = summary as any;

  return (
    <div className="space-y-6">
      <PageHeader title="Project Management" description="Track projects, tasks, timesheets, milestones, and budgets">
        <Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" />New Project</Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Projects" value={stats?.totalProjects ?? 0} icon={FolderKanban} />
        <StatCard title="Active Projects" value={stats?.activeProjects ?? 0} icon={TrendingUp} trend="up" />
        <StatCard title="Total Budget" value={formatCurrency(stats?.totalBudget ?? 0)} icon={Milestone} />
        <StatCard title="Actual Cost" value={formatCurrency(stats?.totalActualCost ?? 0)} icon={Clock} />
      </div>

      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList><TabsTrigger value="projects">Projects</TabsTrigger><TabsTrigger value="timesheets">Timesheets</TabsTrigger></TabsList>
        <TabsContent value="projects"><DataTable columns={projectColumns} data={projects} isLoading={isLoading}  /></TabsContent>
        <TabsContent value="timesheets"><DataTable columns={timesheetColumns} data={timesheets}  /></TabsContent>
      </Tabs>

      <FormDialog open={showCreate} onOpenChange={setShowCreate} title="New Project" onSubmit={() => createMut.mutate(form)} isLoading={createMut.isPending}>
        <div className="grid gap-4">
          <div><Label>Project Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter project name" /></div>
          <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Project description" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
            <div><Label>End Date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
          </div>
          <div><Label>Budget Amount</Label><Input type="number" value={form.budgetAmount} onChange={(e) => setForm({ ...form, budgetAmount: Number(e.target.value) })} /></div>
        </div>
      </FormDialog>
    </div>
  );
}
