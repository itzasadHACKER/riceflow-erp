"use client";

import { useState } from "react";
import { ClipboardList, FileSearch, CheckCircle, Plus } from "lucide-react";
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

interface Requisition { id: string; requisitionNumber: string; status: string; priority: string; requiredDate: string; totalAmount: string; justification: string; }
interface PurchaseQuotation { id: string; quotationNumber: string; supplier?: { name: string }; status: string; totalAmount: string; validUntil: string; selected: boolean; }

const reqColumns: Column<Requisition>[] = [
  { key: "requisitionNumber", header: "Req #", render: (r) => <span className="font-mono font-semibold">{r.requisitionNumber}</span> },
  { key: "status", header: "Status", render: (r) => <Badge className={r.status === "APPROVED" ? "bg-emerald-600" : r.status === "REJECTED" ? "bg-red-500" : "bg-slate-500"}>{r.status}</Badge> },
  { key: "priority", header: "Priority", render: (r) => <Badge variant="outline">{r.priority}</Badge> },
  { key: "requiredDate", header: "Required By", render: (r) => formatDate(r.requiredDate) },
  { key: "totalAmount", header: "Est. Amount", className: "text-right", render: (r) => <span className="font-mono">{formatCurrency(r.totalAmount)}</span> },
  { key: "justification", header: "Justification", render: (r) => <span className="truncate max-w-[200px] inline-block">{r.justification || "-"}</span> },
];

const pqColumns: Column<PurchaseQuotation>[] = [
  { key: "quotationNumber", header: "Quote #", render: (r) => <span className="font-mono font-semibold">{r.quotationNumber}</span> },
  { key: "supplier", header: "Supplier", render: (r) => r.supplier?.name || "-" },
  { key: "status", header: "Status", render: (r) => <Badge className={r.selected ? "bg-emerald-600" : "bg-slate-500"}>{r.selected ? "Selected" : r.status}</Badge> },
  { key: "totalAmount", header: "Amount", className: "text-right", render: (r) => <span className="font-mono font-semibold">{formatCurrency(r.totalAmount)}</span> },
  { key: "validUntil", header: "Valid Until", render: (r) => r.validUntil ? formatDate(r.validUntil) : "-" },
];

export default function PurchaseEnhancementsPage() {
  const [showReq, setShowReq] = useState(false);
  const [reqForm, setReqForm] = useState({ requiredDate: "", priority: "NORMAL", justification: "" });

  const { data: reqs = [], isLoading } = useApiList<Requisition>(["purchase-reqs"], "/purchase-enhancements/requisitions");
  const { data: quotes = [] } = useApiList<PurchaseQuotation>(["purchase-quotes"], "/purchase-enhancements/quotations");
  const { data: summary } = useApiList<any>(["pe-summary"], "/purchase-enhancements/summary");

  const createMut = useApiMutation("/purchase-enhancements/requisitions", "post", { invalidateKeys: [["purchase-reqs"], ["pe-summary"]], onSuccess: () => { setShowReq(false); toast.success("Requisition created"); } });

  const stats = summary as any;

  return (
    <div className="space-y-6">
      <PageHeader title="Purchase Enhancements" description="Purchase requisitions, RFQ, and vendor quotation comparison">
        <Button onClick={() => setShowReq(true)}><Plus className="mr-2 h-4 w-4" />New Requisition</Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Requisitions" value={stats?.totalRequisitions ?? 0} icon={ClipboardList} />
        <StatCard title="Pending Requisitions" value={stats?.pendingRequisitions ?? 0} icon={ClipboardList} />
        <StatCard title="Total Quotations" value={stats?.totalQuotations ?? 0} icon={FileSearch} />
        <StatCard title="Selected Quotes" value={stats?.selectedQuotations ?? 0} icon={CheckCircle} trend="up" />
      </div>

      <Tabs defaultValue="requisitions" className="space-y-4">
        <TabsList><TabsTrigger value="requisitions">Requisitions</TabsTrigger><TabsTrigger value="quotations">Purchase Quotations (RFQ)</TabsTrigger></TabsList>
        <TabsContent value="requisitions"><DataTable columns={reqColumns} data={reqs} isLoading={isLoading}  /></TabsContent>
        <TabsContent value="quotations"><DataTable columns={pqColumns} data={quotes}  /></TabsContent>
      </Tabs>

      <FormDialog open={showReq} onOpenChange={setShowReq} title="New Purchase Requisition" onSubmit={() => createMut.mutate(reqForm)} isLoading={createMut.isPending}>
        <div className="grid gap-4">
          <div><Label>Required Date</Label><Input type="date" value={reqForm.requiredDate} onChange={(e) => setReqForm({ ...reqForm, requiredDate: e.target.value })} /></div>
          <div><Label>Priority</Label><Select value={reqForm.priority} onValueChange={(v) => setReqForm({ ...reqForm, priority: v ?? '' })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LOW">Low</SelectItem><SelectItem value="NORMAL">Normal</SelectItem><SelectItem value="HIGH">High</SelectItem><SelectItem value="URGENT">Urgent</SelectItem></SelectContent></Select></div>
          <div><Label>Justification</Label><Input value={reqForm.justification} onChange={(e) => setReqForm({ ...reqForm, justification: e.target.value })} placeholder="Reason for purchase" /></div>
        </div>
      </FormDialog>
    </div>
  );
}
