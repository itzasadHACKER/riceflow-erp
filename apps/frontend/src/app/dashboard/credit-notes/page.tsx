"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, Send, ArrowDownCircle, ArrowUpCircle, DollarSign, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { generateNumber, todayISO, formatCurrency, formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface CreditNote { id: string; noteNumber: string; date: string; customer: { name: string }; totalAmount: string; netAmount: string; reason: string; status: string; }
interface DebitNote { id: string; noteNumber: string; date: string; supplier: { name: string }; totalAmount: string; netAmount: string; reason: string; status: string; }
interface SalesReturn { id: string; returnNumber: string; date: string; customer: { name: string }; totalAmount: string; reason: string; status: string; }
interface PurchaseReturn { id: string; returnNumber: string; date: string; supplier: { name: string }; totalAmount: string; reason: string; status: string; }
interface RunningBalance { entityType: string; entityId: string; totalDebit: number; totalCredit: number; balance: number; balanceType: string; }
interface Customer { id: string; name: string; }
interface Supplier { id: string; name: string; }

const cnColumns: Column<CreditNote>[] = [
  { key: "noteNumber", header: "Note #", render: (i) => <span className="font-mono font-medium text-primary">{i.noteNumber}</span> },
  { key: "date", header: "Date", render: (i) => formatDate(i.date) },
  { key: "customer", header: "Customer", render: (i) => i.customer?.name },
  { key: "totalAmount", header: "Amount", render: (i) => <span className="font-mono">{formatCurrency(i.totalAmount)}</span> },
  { key: "status", header: "Status", render: (i) => <Badge variant={i.status === "CONFIRMED" ? "default" : "secondary"}>{i.status}</Badge> },
];

const dnColumns: Column<DebitNote>[] = [
  { key: "noteNumber", header: "Note #", render: (i) => <span className="font-mono font-medium text-primary">{i.noteNumber}</span> },
  { key: "date", header: "Date", render: (i) => formatDate(i.date) },
  { key: "supplier", header: "Supplier", render: (i) => i.supplier?.name },
  { key: "totalAmount", header: "Amount", render: (i) => <span className="font-mono">{formatCurrency(i.totalAmount)}</span> },
  { key: "status", header: "Status", render: (i) => <Badge variant={i.status === "CONFIRMED" ? "default" : "secondary"}>{i.status}</Badge> },
];

const srColumns: Column<SalesReturn>[] = [
  { key: "returnNumber", header: "Return #", render: (i) => <span className="font-mono font-medium text-red-600">{i.returnNumber}</span> },
  { key: "date", header: "Date", render: (i) => formatDate(i.date) },
  { key: "customer", header: "Customer", render: (i) => i.customer?.name },
  { key: "totalAmount", header: "Amount", render: (i) => <span className="font-mono">{formatCurrency(i.totalAmount)}</span> },
  { key: "status", header: "Status", render: (i) => <Badge variant={i.status === "APPROVED" ? "default" : i.status === "COMPLETED" ? "outline" : "secondary"}>{i.status}</Badge> },
];

const prColumns: Column<PurchaseReturn>[] = [
  { key: "returnNumber", header: "Return #", render: (i) => <span className="font-mono font-medium text-orange-600">{i.returnNumber}</span> },
  { key: "date", header: "Date", render: (i) => formatDate(i.date) },
  { key: "supplier", header: "Supplier", render: (i) => i.supplier?.name },
  { key: "totalAmount", header: "Amount", render: (i) => <span className="font-mono">{formatCurrency(i.totalAmount)}</span> },
  { key: "status", header: "Status", render: (i) => <Badge variant={i.status === "APPROVED" ? "default" : "secondary"}>{i.status}</Badge> },
];

function RunningBalanceCard({ entityType, entityId }: { entityType: string; entityId: string }) {
  const { data } = useApiList<RunningBalance>([`running-balance-${entityType}-${entityId}`], `/sales-enhanced/running-balance?entityType=${entityType}&entityId=${entityId}`);
  const bal = (data as unknown as RunningBalance) || null;
  if (!bal || !entityId) return null;
  return (
    <Card className={`border-2 ${bal.balanceType === "DEBIT" ? "border-red-300 bg-red-50" : bal.balanceType === "CREDIT" ? "border-green-300 bg-green-50" : "border-gray-200"}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Running Balance</p>
            <p className={`text-2xl font-bold font-mono ${bal.balanceType === "DEBIT" ? "text-red-600" : "text-green-600"}`}>
              {formatCurrency(Math.abs(bal.balance))}
            </p>
            <p className="text-xs">{bal.balanceType} Balance</p>
          </div>
          <div className="text-right text-sm">
            <p>Dr: {formatCurrency(bal.totalDebit)}</p>
            <p>Cr: {formatCurrency(bal.totalCredit)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CreditNotesPage() {
  const [cnOpen, setCnOpen] = useState(false);
  const [dnOpen, setDnOpen] = useState(false);
  const [srOpen, setSrOpen] = useState(false);
  const [prOpen, setPrOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");

  const { data: creditNotes = [], refetch: refetchCn } = useApiList<CreditNote>(["credit-notes"], "/sales-enhanced/credit-memos");
  const { data: debitNotes = [], refetch: refetchDn } = useApiList<DebitNote>(["debit-notes"], "/sales-enhanced/debit-notes");
  const { data: salesReturns = [], refetch: refetchSr } = useApiList<SalesReturn>(["sales-returns"], "/sales-enhanced/sales-returns");
  const { data: purchaseReturns = [], refetch: refetchPr } = useApiList<PurchaseReturn>(["purchase-returns"], "/sales-enhanced/purchase-returns");
  const { data: customers = [] } = useApiList<Customer>(["cn-customers"], "/sales/customers");
  const { data: suppliers = [] } = useApiList<Supplier>(["cn-suppliers"], "/procurement/suppliers");

  const createCn = useApiMutation("/sales-enhanced/credit-memos", "post");
  const postCn = useApiMutation("/sales-enhanced/credit-memos", "patch");
  const createDn = useApiMutation("/sales-enhanced/debit-notes", "post");
  const createSr = useApiMutation("/sales-enhanced/sales-returns", "post");
  const approveSr = useApiMutation("/sales-enhanced/sales-returns", "patch");
  const createPr = useApiMutation("/sales-enhanced/purchase-returns", "post");

  const cnList = Array.isArray(creditNotes) ? creditNotes : [];
  const dnList = Array.isArray(debitNotes) ? debitNotes : [];
  const srList = Array.isArray(salesReturns) ? salesReturns : [];
  const prList = Array.isArray(purchaseReturns) ? purchaseReturns : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Credit Notes & Returns" description="Manage AR/AP credit memos, debit notes, sales returns and purchase returns" />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Credit Notes" value={cnList.length} icon={ArrowDownCircle} description="AR Credit Memos" />
        <StatCard title="Debit Notes" value={dnList.length} icon={ArrowUpCircle} description="AP Credit Memos" />
        <StatCard title="Sales Returns" value={srList.length} icon={FileText} description="Return from customers" />
        <StatCard title="Purchase Returns" value={prList.length} icon={FileText} description="Return to suppliers" />
      </div>

      <Tabs defaultValue="credit-notes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="credit-notes">Credit Notes</TabsTrigger>
          <TabsTrigger value="debit-notes">Debit Notes</TabsTrigger>
          <TabsTrigger value="sales-returns">Sales Returns</TabsTrigger>
          <TabsTrigger value="purchase-returns">Purchase Returns</TabsTrigger>
          <TabsTrigger value="balance-check">Balance Check</TabsTrigger>
        </TabsList>

        <TabsContent value="credit-notes" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setCnOpen(true)}><Plus className="mr-2 h-4 w-4" />New Credit Note</Button>
          </div>
          <DataTable columns={cnColumns} data={cnList} />
          <FormDialog open={cnOpen} onOpenChange={setCnOpen} title="Create Credit Note" onSubmit={async (e) => {
            e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement);
            await createCn.mutateAsync({ customerId: fd.get("customerId"), date: fd.get("date"), totalAmount: Number(fd.get("totalAmount")), taxAmount: Number(fd.get("taxAmount") || 0), reason: fd.get("reason"), narration: fd.get("narration") });
            toast.success("Credit note created"); setCnOpen(false); refetchCn();
          }}>
            <div className="grid gap-4">
              <div><Label>Customer</Label>
                <Select name="customerId" onValueChange={(v: any) => v && setSelectedCustomer(String(v))}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {selectedCustomer && <RunningBalanceCard entityType="CUSTOMER" entityId={selectedCustomer} />}
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Date</Label><Input name="date" type="date" defaultValue={todayISO()} /></div>
                <div><Label>Total Amount</Label><Input name="totalAmount" type="number" step="0.01" required /></div>
              </div>
              <div><Label>Tax Amount</Label><Input name="taxAmount" type="number" step="0.01" defaultValue="0" /></div>
              <div><Label>Reason</Label><Input name="reason" required /></div>
              <div><Label>Narration</Label><Textarea name="narration" /></div>
            </div>
          </FormDialog>
        </TabsContent>

        <TabsContent value="debit-notes" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setDnOpen(true)}><Plus className="mr-2 h-4 w-4" />New Debit Note</Button>
          </div>
          <DataTable columns={dnColumns} data={dnList} />
          <FormDialog open={dnOpen} onOpenChange={setDnOpen} title="Create Debit Note" onSubmit={async (e) => {
            e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement);
            await createDn.mutateAsync({ supplierId: fd.get("supplierId"), date: fd.get("date"), totalAmount: Number(fd.get("totalAmount")), taxAmount: Number(fd.get("taxAmount") || 0), reason: fd.get("reason"), narration: fd.get("narration") });
            toast.success("Debit note created"); setDnOpen(false); refetchDn();
          }}>
            <div className="grid gap-4">
              <div><Label>Supplier</Label>
                <Select name="supplierId" onValueChange={(v: any) => v && setSelectedSupplier(String(v))}>
                  <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                  <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {selectedSupplier && <RunningBalanceCard entityType="SUPPLIER" entityId={selectedSupplier} />}
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Date</Label><Input name="date" type="date" defaultValue={todayISO()} /></div>
                <div><Label>Total Amount</Label><Input name="totalAmount" type="number" step="0.01" required /></div>
              </div>
              <div><Label>Tax Amount</Label><Input name="taxAmount" type="number" step="0.01" defaultValue="0" /></div>
              <div><Label>Reason</Label><Input name="reason" required /></div>
              <div><Label>Narration</Label><Textarea name="narration" /></div>
            </div>
          </FormDialog>
        </TabsContent>

        <TabsContent value="sales-returns" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setSrOpen(true)}><Plus className="mr-2 h-4 w-4" />New Sales Return</Button>
          </div>
          <DataTable columns={srColumns} data={srList} />
          <FormDialog open={srOpen} onOpenChange={setSrOpen} title="Create Sales Return" onSubmit={async (e) => {
            e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement);
            await createSr.mutateAsync({ customerId: fd.get("customerId"), date: fd.get("date"), quantity: Number(fd.get("quantity")), rate: Number(fd.get("rate")), reason: fd.get("reason") });
            toast.success("Sales return created"); setSrOpen(false); refetchSr();
          }}>
            <div className="grid gap-4">
              <div><Label>Customer</Label>
                <Select name="customerId" onValueChange={(v: any) => v && setSelectedCustomer(String(v))}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {selectedCustomer && <RunningBalanceCard entityType="CUSTOMER" entityId={selectedCustomer} />}
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Date</Label><Input name="date" type="date" defaultValue={todayISO()} /></div>
                <div><Label>Quantity</Label><Input name="quantity" type="number" step="0.01" required /></div>
              </div>
              <div><Label>Rate</Label><Input name="rate" type="number" step="0.01" required /></div>
              <div><Label>Reason</Label><Input name="reason" required /></div>
            </div>
          </FormDialog>
        </TabsContent>

        <TabsContent value="purchase-returns" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setPrOpen(true)}><Plus className="mr-2 h-4 w-4" />New Purchase Return</Button>
          </div>
          <DataTable columns={prColumns} data={prList} />
          <FormDialog open={prOpen} onOpenChange={setPrOpen} title="Create Purchase Return" onSubmit={async (e) => {
            e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement);
            await createPr.mutateAsync({ supplierId: fd.get("supplierId"), date: fd.get("date"), quantity: Number(fd.get("quantity")), rate: Number(fd.get("rate")), reason: fd.get("reason") });
            toast.success("Purchase return created"); setPrOpen(false); refetchPr();
          }}>
            <div className="grid gap-4">
              <div><Label>Supplier</Label>
                <Select name="supplierId" onValueChange={(v: any) => v && setSelectedSupplier(String(v))}>
                  <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                  <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {selectedSupplier && <RunningBalanceCard entityType="SUPPLIER" entityId={selectedSupplier} />}
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Date</Label><Input name="date" type="date" defaultValue={todayISO()} /></div>
                <div><Label>Quantity</Label><Input name="quantity" type="number" step="0.01" required /></div>
              </div>
              <div><Label>Rate</Label><Input name="rate" type="number" step="0.01" required /></div>
              <div><Label>Reason</Label><Input name="reason" required /></div>
            </div>
          </FormDialog>
        </TabsContent>

        <TabsContent value="balance-check" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Entity Balance Lookup</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Select a customer, supplier, or employee to view their running balance across all transactions.</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Customer Balance</Label>
                  <Select onValueChange={(v: any) => v && setSelectedCustomer(String(v))}>
                    <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                  {selectedCustomer && <div className="mt-3"><RunningBalanceCard entityType="CUSTOMER" entityId={selectedCustomer} /></div>}
                </div>
                <div>
                  <Label>Supplier Balance</Label>
                  <Select onValueChange={(v: any) => v && setSelectedSupplier(String(v))}>
                    <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                    <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                  {selectedSupplier && <div className="mt-3"><RunningBalanceCard entityType="SUPPLIER" entityId={selectedSupplier} /></div>}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
