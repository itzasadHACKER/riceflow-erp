"use client";

import { useState } from "react";
import { UserSearch, Users, MessageSquare, CalendarClock, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { generateNumber, todayISO, formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface Lead { id: string; name: string; company: string; email: string; phone: string; source: string; status: string; createdAt: string; }
interface Broker { id: string; name: string; phone: string; email: string; commission: number; isActive: boolean; }
interface FollowUp { id: string; leadName: string; date: string; type: string; notes: string; isCompleted: boolean; }

const leadColumns: Column<Lead>[] = [
  { key: "name", header: "Contact Name" },
  { key: "company", header: "Company" },
  { key: "email", header: "Email" },
  {
    key: "source",
    header: "Source",
    render: (item) => {
      const colors: Record<string, string> = { REFERRAL: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200", WEBSITE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", PHONE: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200", WALK_IN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", BROKER: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200" };
      return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[item.source] ?? ""}`}>{item.source}</span>;
    },
  },
  {
    key: "status",
    header: "Status",
    render: (item) => {
      const colors: Record<string, string> = { NEW: "secondary", CONTACTED: "outline", QUALIFIED: "default", CONVERTED: "default", LOST: "destructive" };
      return <Badge variant={(colors[item.status] ?? "secondary") as "default" | "secondary" | "outline" | "destructive"} className={item.status === "CONVERTED" ? "bg-emerald-600" : ""}>{item.status}</Badge>;
    },
  },
  { key: "createdAt", header: "Created", render: (item) => formatDate(item.createdAt) },
];

const brokerColumns: Column<Broker>[] = [
  { key: "name", header: "Broker Name" },
  { key: "phone", header: "Phone" },
  { key: "email", header: "Email" },
  { key: "commission", header: "Commission %", className: "text-right", render: (item) => <span className="font-mono">{item.commission}%</span> },
  { key: "isActive", header: "Status", render: (item) => <Badge variant={item.isActive ? "default" : "secondary"} className={item.isActive ? "bg-emerald-600" : ""}>{item.isActive ? "Active" : "Inactive"}</Badge> },
];

const followUpColumns: Column<FollowUp>[] = [
  { key: "leadName", header: "Lead" },
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
  { key: "type", header: "Type", render: (item) => <Badge variant="outline">{item.type}</Badge> },
  { key: "notes", header: "Notes", render: (item) => <span className="max-w-[200px] truncate block">{item.notes}</span> },
  { key: "isCompleted", header: "Done", render: (item) => <Badge variant={item.isCompleted ? "default" : "secondary"} className={item.isCompleted ? "bg-emerald-600" : ""}>{item.isCompleted ? "Done" : "Pending"}</Badge> },
];

export default function CRMPage() {
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: "", company: "", email: "", phone: "", source: "REFERRAL", notes: "" });

  const { data: leads = [], isLoading: leadLoading } = useApiList<Lead>(["leads"], "/crm/leads");
  const { data: brokers = [], isLoading: brokerLoading } = useApiList<Broker>(["brokers"], "/crm/brokers");
  const { data: followUps = [], isLoading: fuLoading } = useApiList<FollowUp>(["follow-ups"], "/crm/follow-ups");

  const createLeadMutation = useApiMutation<Lead, typeof leadForm>("/crm/leads", "post", [["leads"]]);

  return (
    <div className="space-y-6">
      <PageHeader title="CRM" description="Leads, brokers, communications, and follow-ups" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Leads" value={leads.length} icon={UserSearch} description={`${leads.filter((l) => l.status === "NEW").length} new`} />
        <StatCard title="Brokers" value={brokers.length} icon={Users} description={`${brokers.filter((b) => b.isActive).length} active`} />
        <StatCard title="Follow-ups" value={followUps.length} icon={CalendarClock} description={`${followUps.filter((f) => !f.isCompleted).length} pending`} />
        <StatCard title="Converted" value={leads.filter((l) => l.status === "CONVERTED").length} icon={MessageSquare} />
      </div>

      <Tabs defaultValue="leads">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="leads" className="gap-1.5"><UserSearch className="size-3.5" />Leads</TabsTrigger>
          <TabsTrigger value="brokers" className="gap-1.5"><Users className="size-3.5" />Brokers</TabsTrigger>
          <TabsTrigger value="followups" className="gap-1.5"><CalendarClock className="size-3.5" />Follow-ups</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-4 mt-4">
          <DataTable
            columns={leadColumns}
            data={leads as unknown as Lead[]}
            isLoading={leadLoading}
            emptyMessage="No leads yet."
            searchPlaceholder="Search leads..."
            actions={
              <Button size="sm" className="gap-1.5" onClick={() => setShowCreateLead(true)}>
                <Plus className="size-3.5" />
                New Lead
              </Button>
            }
          />
        </TabsContent>

        <TabsContent value="brokers" className="space-y-4 mt-4">
          <DataTable columns={brokerColumns} data={brokers as unknown as Broker[]} isLoading={brokerLoading} emptyMessage="No brokers yet." searchPlaceholder="Search brokers..." />
        </TabsContent>

        <TabsContent value="followups" className="space-y-4 mt-4">
          <DataTable columns={followUpColumns} data={followUps as unknown as FollowUp[]} isLoading={fuLoading} emptyMessage="No follow-ups yet." searchPlaceholder="Search follow-ups..." />
        </TabsContent>
      </Tabs>

      <FormDialog
        open={showCreateLead}
        onOpenChange={setShowCreateLead}
        title="Add Lead"
        description={`Lead # ${generateNumber("lead", leads.length)}`}
        onSubmit={(e) => {
          e.preventDefault();
          createLeadMutation.mutate(leadForm, {
            onSuccess: () => { setShowCreateLead(false); toast.success("Lead added"); setLeadForm({ name: "", company: "", email: "", phone: "", source: "REFERRAL", notes: "" }); },
          });
        }}
        isLoading={createLeadMutation.isPending}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Contact Name</Label>
            <Input value={leadForm.name} onChange={(e) => setLeadForm((p) => ({ ...p, name: e.target.value }))} required placeholder="Full name" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Company</Label>
            <Input value={leadForm.company} onChange={(e) => setLeadForm((p) => ({ ...p, company: e.target.value }))} placeholder="Company name" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Email</Label>
            <Input type="email" value={leadForm.email} onChange={(e) => setLeadForm((p) => ({ ...p, email: e.target.value }))} placeholder="email@example.com" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Phone</Label>
            <Input value={leadForm.phone} onChange={(e) => setLeadForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+92-300-0000000" />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider">Source</Label>
          <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={leadForm.source} onChange={(e) => setLeadForm((p) => ({ ...p, source: e.target.value }))}>
            <option value="REFERRAL">Referral</option>
            <option value="WEBSITE">Website</option>
            <option value="PHONE">Phone</option>
            <option value="WALK_IN">Walk-in</option>
            <option value="BROKER">Broker</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider">Notes</Label>
          <Textarea value={leadForm.notes} onChange={(e) => setLeadForm((p) => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Additional notes..." />
        </div>
      </FormDialog>
    </div>
  );
}
