"use client";

import { useState } from "react";
import { FileText, Handshake, Plus, ArrowRight } from "lucide-react";
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
import { formatCurrency, formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface Quotation { id: string; quotationNumber: string; customerId: string; customer?: { name: string }; status: string; subtotal: string; validUntil: string; createdAt: string; }
interface Agreement { id: string; agreementNumber: string; customer?: { name: string }; method: string; status: string; startDate: string; endDate: string; plannedAmount: string; }

const statusColors: Record<string, string> = { DRAFT: "bg-slate-500", SENT: "bg-blue-500", ACCEPTED: "bg-emerald-600", REJECTED: "bg-red-500", EXPIRED: "bg-amber-500", CONVERTED: "bg-indigo-500" };

const quotationColumns: Column<Quotation>[] = [
  { key: "quotationNumber", header: "Quotation #", render: (r) => <span className="font-mono font-semibold">{r.quotationNumber}</span> },
  { key: "customer", header: "Customer", render: (r) => r.customer?.name || "-" },
  { key: "status", header: "Status", render: (r) => <Badge className={statusColors[r.status] || "bg-slate-500"}>{r.status}</Badge> },
  { key: "subtotal", header: "Amount", className: "text-right", render: (r) => <span className="font-mono font-semibold">{formatCurrency(r.subtotal)}</span> },
  { key: "validUntil", header: "Valid Until", render: (r) => r.validUntil ? formatDate(r.validUntil) : "-" },
  { key: "createdAt", header: "Date", render: (r) => formatDate(r.createdAt) },
];

const agreementColumns: Column<Agreement>[] = [
  { key: "agreementNumber", header: "Agreement #", render: (r) => <span className="font-mono font-semibold">{r.agreementNumber}</span> },
  { key: "customer", header: "Customer", render: (r) => r.customer?.name || "-" },
  { key: "method", header: "Method", render: (r) => <Badge variant="outline">{r.method}</Badge> },
  { key: "status", header: "Status", render: (r) => <Badge className={r.status === "ACTIVE" ? "bg-emerald-600" : "bg-slate-500"}>{r.status}</Badge> },
  { key: "plannedAmount", header: "Planned", className: "text-right", render: (r) => <span className="font-mono">{formatCurrency(r.plannedAmount)}</span> },
  { key: "startDate", header: "Start", render: (r) => formatDate(r.startDate) },
  { key: "endDate", header: "End", render: (r) => formatDate(r.endDate) },
];

export default function SalesQuotationsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ customerId: "", validUntil: "", notes: "", items: [] as any[] });

  const { data: quotations = [], isLoading } = useApiList<Quotation>(["sales-quotations"], "/sales-quotations/quotations");
  const { data: agreements = [] } = useApiList<Agreement>(["blanket-agreements"], "/sales-quotations/agreements");
  const { data: summary } = useApiList<any>(["sq-summary"], "/sales-quotations/summary");

  const createMut = useApiMutation("/sales-quotations/quotations", "post", { invalidateKeys: [["sales-quotations"], ["sq-summary"]], onSuccess: () => { setShowCreate(false); toast.success("Quotation created"); } });

  const stats = summary as any;

  return (
    <div className="space-y-6">
      <PageHeader title="Sales Quotations & Agreements" description="Create quotations, manage blanket agreements, and track conversions">
        <Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" />New Quotation</Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Quotations" value={stats?.totalQuotations ?? 0} icon={FileText} />
        <StatCard title="Open Quotations" value={stats?.openQuotations ?? 0} icon={ArrowRight} />
        <StatCard title="Blanket Agreements" value={stats?.totalAgreements ?? 0} icon={Handshake} />
        <StatCard title="Active Agreements" value={stats?.activeAgreements ?? 0} icon={Handshake} trend="up" />
      </div>

      <Tabs defaultValue="quotations" className="space-y-4">
        <TabsList><TabsTrigger value="quotations">Sales Quotations</TabsTrigger><TabsTrigger value="agreements">Blanket Agreements</TabsTrigger></TabsList>
        <TabsContent value="quotations"><DataTable columns={quotationColumns} data={quotations} isLoading={isLoading}  /></TabsContent>
        <TabsContent value="agreements"><DataTable columns={agreementColumns} data={agreements}  /></TabsContent>
      </Tabs>

      <FormDialog open={showCreate} onOpenChange={setShowCreate} title="New Sales Quotation" onSubmit={() => createMut.mutate(form)} isLoading={createMut.isPending}>
        <div className="grid gap-4">
          <div><Label>Customer ID</Label><Input value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} placeholder="Customer UUID" /></div>
          <div><Label>Valid Until</Label><Input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} /></div>
          <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes" /></div>
        </div>
      </FormDialog>
    </div>
  );
}
