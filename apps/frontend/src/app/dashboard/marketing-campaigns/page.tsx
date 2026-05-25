"use client";

import { useState } from "react";
import { Megaphone, Target, Users, TrendingUp, Plus } from "lucide-react";
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
import { formatCurrency, formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface Campaign { id: string; campaignCode: string; name: string; type: string; status: string; budget: string; actualCost: string; actualRevenue: string; leadsGenerated: number; conversions: number; startDate: string; endDate: string; }

const statusColors: Record<string, string> = { DRAFT: "bg-slate-500", ACTIVE: "bg-emerald-600", PAUSED: "bg-amber-500", COMPLETED: "bg-blue-500", CANCELLED: "bg-red-500" };

const campaignColumns: Column<Campaign>[] = [
  { key: "campaignCode", header: "Code", render: (r) => <span className="font-mono font-semibold">{r.campaignCode}</span> },
  { key: "name", header: "Campaign" },
  { key: "type", header: "Type", render: (r) => <Badge variant="outline">{r.type}</Badge> },
  { key: "status", header: "Status", render: (r) => <Badge className={statusColors[r.status] || "bg-slate-500"}>{r.status}</Badge> },
  { key: "budget", header: "Budget", className: "text-right", render: (r) => <span className="font-mono">{formatCurrency(r.budget)}</span> },
  { key: "actualRevenue", header: "Revenue", className: "text-right", render: (r) => <span className="font-mono font-semibold text-emerald-600">{formatCurrency(r.actualRevenue)}</span> },
  { key: "leadsGenerated", header: "Leads", className: "text-right", render: (r) => <span className="font-mono">{r.leadsGenerated}</span> },
  { key: "conversions", header: "Conversions", className: "text-right", render: (r) => <span className="font-mono">{r.conversions}</span> },
  { key: "startDate", header: "Start", render: (r) => r.startDate ? formatDate(r.startDate) : "-" },
];

export default function MarketingCampaignsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", type: "EMAIL", startDate: "", endDate: "", budget: 0, targetAudience: "" });

  const { data: campaigns = [], isLoading } = useApiList<Campaign>(["campaigns"], "/marketing-campaigns");
  const { data: summary } = useApiList<any>(["mc-summary"], "/marketing-campaigns/summary");

  const createMut = useApiMutation("/marketing-campaigns", "post", { invalidateKeys: [["campaigns"], ["mc-summary"]], onSuccess: () => { setShowCreate(false); toast.success("Campaign created"); } });

  const stats = summary as any;

  return (
    <div className="space-y-6">
      <PageHeader title="Marketing Campaigns" description="Create campaigns, track leads, measure ROI, and manage conversions">
        <Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" />New Campaign</Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Campaigns" value={stats?.totalCampaigns ?? 0} icon={Megaphone} />
        <StatCard title="Active" value={stats?.activeCampaigns ?? 0} icon={Target} trend="up" />
        <StatCard title="Total Leads" value={stats?.totalLeads ?? 0} icon={Users} />
        <StatCard title="Total Revenue" value={formatCurrency(stats?.totalRevenue ?? 0)} icon={TrendingUp} />
      </div>

      <DataTable columns={campaignColumns} data={campaigns} isLoading={isLoading}  />

      <FormDialog open={showCreate} onOpenChange={setShowCreate} title="New Marketing Campaign" onSubmit={() => createMut.mutate(form)} isLoading={createMut.isPending}>
        <div className="grid gap-4">
          <div><Label>Campaign Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Summer Rice Promotion" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Type</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v ?? '' })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="EMAIL">Email</SelectItem><SelectItem value="SMS">SMS</SelectItem><SelectItem value="SOCIAL">Social Media</SelectItem><SelectItem value="TRADE_SHOW">Trade Show</SelectItem><SelectItem value="PRINT">Print</SelectItem></SelectContent></Select></div>
            <div><Label>Budget</Label><Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4"><div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div><div><Label>End Date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div></div>
          <div><Label>Target Audience</Label><Input value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} placeholder="e.g. Rice importers in Middle East" /></div>
        </div>
      </FormDialog>
    </div>
  );
}
