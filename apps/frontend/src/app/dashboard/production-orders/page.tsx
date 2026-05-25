"use client";

import { useState } from "react";
import { Factory, RotateCcw, ArrowUpDown, Undo2, Plus } from "lucide-react";
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

interface ProdOrder { id: string; orderNumber: string; itemCode: string; itemName: string; status: string; plannedQty: string; completedQty: string; startDate: string; endDate: string; }
interface GoodsTx { id: string; transactionNumber: string; type: string; totalValue: string; createdAt: string; }
interface ReturnReq { id: string; requestNumber: string; type: string; partnerType: string; status: string; totalAmount: string; reason: string; createdAt: string; }

const statusColors: Record<string, string> = { PLANNED: "bg-slate-500", RELEASED: "bg-blue-500", COMPLETED: "bg-emerald-600", CLOSED: "bg-indigo-500" };

const poColumns: Column<ProdOrder>[] = [
  { key: "orderNumber", header: "Order #", render: (r) => <span className="font-mono font-semibold">{r.orderNumber}</span> },
  { key: "itemCode", header: "Item Code" },
  { key: "itemName", header: "Item Name" },
  { key: "status", header: "Status", render: (r) => <Badge className={statusColors[r.status] || "bg-slate-500"}>{r.status}</Badge> },
  { key: "plannedQty", header: "Planned", className: "text-right", render: (r) => <span className="font-mono">{Number(r.plannedQty).toLocaleString()}</span> },
  { key: "completedQty", header: "Completed", className: "text-right", render: (r) => <span className="font-mono font-semibold text-emerald-600">{Number(r.completedQty).toLocaleString()}</span> },
  { key: "startDate", header: "Start", render: (r) => r.startDate ? formatDate(r.startDate) : "-" },
];

const gtColumns: Column<GoodsTx>[] = [
  { key: "transactionNumber", header: "Tx #", render: (r) => <span className="font-mono font-semibold">{r.transactionNumber}</span> },
  { key: "type", header: "Type", render: (r) => <Badge variant="outline">{r.type}</Badge> },
  { key: "totalValue", header: "Value", className: "text-right", render: (r) => <span className="font-mono">{Number(r.totalValue).toLocaleString()}</span> },
  { key: "createdAt", header: "Date", render: (r) => formatDate(r.createdAt) },
];

const rrColumns: Column<ReturnReq>[] = [
  { key: "requestNumber", header: "Req #", render: (r) => <span className="font-mono font-semibold">{r.requestNumber}</span> },
  { key: "type", header: "Type", render: (r) => <Badge variant="outline">{r.type}</Badge> },
  { key: "partnerType", header: "Partner", render: (r) => <Badge variant="outline">{r.partnerType}</Badge> },
  { key: "status", header: "Status", render: (r) => <Badge className={r.status === "APPROVED" ? "bg-emerald-600" : r.status === "REJECTED" ? "bg-red-500" : "bg-amber-500"}>{r.status}</Badge> },
  { key: "totalAmount", header: "Amount", className: "text-right", render: (r) => <span className="font-mono">{Number(r.totalAmount).toLocaleString()}</span> },
  { key: "reason", header: "Reason", render: (r) => <span className="truncate max-w-[200px] inline-block">{r.reason || "-"}</span> },
];

export default function ProductionOrdersPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ itemCode: "", itemName: "", plannedQty: 0, startDate: "", endDate: "" });

  const { data: orders = [], isLoading } = useApiList<ProdOrder>(["prod-orders"], "/production-orders");
  const { data: goodsTx = [] } = useApiList<GoodsTx>(["goods-tx"], "/production-orders/goods-transactions");
  const { data: returns = [] } = useApiList<ReturnReq>(["return-reqs"], "/production-orders/return-requests");
  const { data: summary } = useApiList<any>(["po-summary"], "/production-orders/summary");

  const createMut = useApiMutation("/production-orders", "post", { invalidateKeys: [["prod-orders"], ["po-summary"]], onSuccess: () => { setShowCreate(false); toast.success("Production order created"); } });

  const stats = summary as any;

  return (
    <div className="space-y-6">
      <PageHeader title="Production Orders & Goods" description="Full production lifecycle: Plan → Release → Issue → Complete → Close">
        <Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" />New Production Order</Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Production Orders" value={stats?.totalProductionOrders ?? 0} icon={Factory} />
        <StatCard title="Active Orders" value={stats?.activeOrders ?? 0} icon={RotateCcw} trend="up" />
        <StatCard title="Goods Transactions" value={stats?.totalGoodsTransactions ?? 0} icon={ArrowUpDown} />
        <StatCard title="Pending Returns" value={stats?.pendingReturns ?? 0} icon={Undo2} />
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList><TabsTrigger value="orders">Production Orders</TabsTrigger><TabsTrigger value="goods">Goods Issue / Receipt</TabsTrigger><TabsTrigger value="returns">Return Requests</TabsTrigger></TabsList>
        <TabsContent value="orders"><DataTable columns={poColumns} data={orders} isLoading={isLoading}  /></TabsContent>
        <TabsContent value="goods"><DataTable columns={gtColumns} data={goodsTx}  /></TabsContent>
        <TabsContent value="returns"><DataTable columns={rrColumns} data={returns}  /></TabsContent>
      </Tabs>

      <FormDialog open={showCreate} onOpenChange={setShowCreate} title="New Production Order" onSubmit={() => createMut.mutate(form)} isLoading={createMut.isPending}>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4"><div><Label>Item Code</Label><Input value={form.itemCode} onChange={(e) => setForm({ ...form, itemCode: e.target.value })} /></div><div><Label>Item Name</Label><Input value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} /></div></div>
          <div><Label>Planned Quantity</Label><Input type="number" value={form.plannedQty} onChange={(e) => setForm({ ...form, plannedQty: Number(e.target.value) })} /></div>
          <div className="grid grid-cols-2 gap-4"><div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div><div><Label>End Date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div></div>
        </div>
      </FormDialog>
    </div>
  );
}
