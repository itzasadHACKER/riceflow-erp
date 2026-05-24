"use client";

import { useState } from "react";
import { UserSearch, Phone, CalendarDays, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";

interface Lead { id: string; name: string; email: string; phone: string; source: string; status: string; value: string; }
interface Broker { id: string; name: string; phone: string; commissionRate: number; isActive: boolean; }
interface FollowUp { id: string; leadId: string; type: string; scheduledAt: string; notes: string; isCompleted: boolean; }

const leadColumns: Column<Lead>[] = [
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  { key: "phone", header: "Phone" },
  { key: "source", header: "Source", render: (item) => <Badge variant="outline">{item.source}</Badge> },
  { key: "status", header: "Status", render: (item) => <Badge variant={item.status === "WON" ? "default" : item.status === "LOST" ? "destructive" : "secondary"}>{item.status}</Badge> },
  { key: "value", header: "Value", render: (item) => Number(item.value || 0).toLocaleString("en-PK", { style: "currency", currency: "PKR" }) },
];

const brokerColumns: Column<Broker>[] = [
  { key: "name", header: "Name" },
  { key: "phone", header: "Phone" },
  { key: "commissionRate", header: "Commission %", render: (item) => `${item.commissionRate}%` },
  { key: "isActive", header: "Status", render: (item) => <Badge variant={item.isActive ? "default" : "secondary"}>{item.isActive ? "Active" : "Inactive"}</Badge> },
];

const followUpColumns: Column<FollowUp>[] = [
  { key: "type", header: "Type" },
  { key: "scheduledAt", header: "Scheduled", render: (item) => new Date(item.scheduledAt).toLocaleDateString() },
  { key: "notes", header: "Notes" },
  { key: "isCompleted", header: "Status", render: (item) => <Badge variant={item.isCompleted ? "default" : "secondary"}>{item.isCompleted ? "Completed" : "Pending"}</Badge> },
];

export default function CRMPage() {
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: "", email: "", phone: "", source: "REFERRAL", value: "" });

  const { data: leads = [], isLoading: leadsLoading } = useApiList<Lead>(["leads"], "/crm/leads");
  const { data: brokers = [], isLoading: brokersLoading } = useApiList<Broker>(["brokers"], "/crm/brokers");
  const { data: followUps = [], isLoading: fuLoading } = useApiList<FollowUp>(["follow-ups"], "/crm/follow-ups");

  const createLeadMutation = useApiMutation<Lead, unknown>("/crm/leads", "post", [["leads"]]);

  return (
    <div className="space-y-6">
      <PageHeader title="CRM" description="Lead management, brokers, communications, and follow-ups" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Leads" value={leads.length} icon={UserSearch} description={`${leads.filter((l) => l.status === "NEW").length} new`} />
        <StatCard title="Brokers" value={brokers.length} icon={Users} />
        <StatCard title="Follow-ups" value={followUps.length} icon={CalendarDays} description={`${followUps.filter((f) => !f.isCompleted).length} pending`} />
        <StatCard title="Communications" value="—" icon={Phone} />
      </div>

      <Tabs defaultValue="leads">
        <TabsList>
          <TabsTrigger value="leads"><UserSearch className="mr-2 size-4" />Leads</TabsTrigger>
          <TabsTrigger value="brokers"><Users className="mr-2 size-4" />Brokers</TabsTrigger>
          <TabsTrigger value="followups"><CalendarDays className="mr-2 size-4" />Follow-ups</TabsTrigger>
        </TabsList>
        <TabsContent value="leads" className="space-y-4">
          <Button onClick={() => setShowCreateLead(true)}>+ New Lead</Button>
          <DataTable columns={leadColumns} data={leads as unknown as Lead[]} isLoading={leadsLoading} />
        </TabsContent>
        <TabsContent value="brokers" className="space-y-4">
          <DataTable columns={brokerColumns} data={brokers as unknown as Broker[]} isLoading={brokersLoading} />
        </TabsContent>
        <TabsContent value="followups" className="space-y-4">
          <DataTable columns={followUpColumns} data={followUps as unknown as FollowUp[]} isLoading={fuLoading} />
        </TabsContent>
      </Tabs>

      <FormDialog open={showCreateLead} onOpenChange={setShowCreateLead} title="Add Lead" onSubmit={(e) => { e.preventDefault(); createLeadMutation.mutate({ ...leadForm, value: Number(leadForm.value || 0) }, { onSuccess: () => { setShowCreateLead(false); setLeadForm({ name: "", email: "", phone: "", source: "REFERRAL", value: "" }); } }); }} isLoading={createLeadMutation.isPending}>
        <div className="space-y-2"><Label>Name</Label><Input value={leadForm.name} onChange={(e) => setLeadForm((p) => ({ ...p, name: e.target.value }))} required /></div>
        <div className="space-y-2"><Label>Email</Label><Input type="email" value={leadForm.email} onChange={(e) => setLeadForm((p) => ({ ...p, email: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Phone</Label><Input value={leadForm.phone} onChange={(e) => setLeadForm((p) => ({ ...p, phone: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Source</Label><select className="w-full rounded-md border px-3 py-2 text-sm" value={leadForm.source} onChange={(e) => setLeadForm((p) => ({ ...p, source: e.target.value }))}><option value="REFERRAL">Referral</option><option value="WEBSITE">Website</option><option value="PHONE">Phone</option><option value="WALK_IN">Walk-in</option><option value="BROKER">Broker</option></select></div>
        <div className="space-y-2"><Label>Estimated Value (PKR)</Label><Input type="number" value={leadForm.value} onChange={(e) => setLeadForm((p) => ({ ...p, value: e.target.value }))} placeholder="0" /></div>
      </FormDialog>
    </div>
  );
}
