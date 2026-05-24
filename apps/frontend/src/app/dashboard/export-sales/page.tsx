"use client";

import { useState } from "react";
import { Globe, FileText, Ship, Plus, Landmark } from "lucide-react";
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
import { generateNumber, todayISO, formatCurrency, formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface ExportContract { id: string; contractNumber: string; buyerName: string; country: string; riceType: string; quantity: number; rate: number; totalValue: string; status: string; date: string; }
interface LetterOfCredit { id: string; lcNumber: string; bankName: string; amount: string; expiryDate: string; status: string; }
interface ShippingDoc { id: string; documentNumber: string; type: string; containerNumber: string; date: string; status: string; }

const contractColumns: Column<ExportContract>[] = [
  { key: "contractNumber", header: "Contract #", render: (item) => <span className="font-mono font-medium text-primary">{item.contractNumber}</span> },
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
  { key: "buyerName", header: "Buyer" },
  { key: "country", header: "Country", render: (item) => <Badge variant="outline">{item.country}</Badge> },
  { key: "riceType", header: "Rice Type" },
  { key: "quantity", header: "Qty (MT)", className: "text-right", render: (item) => <span className="font-mono">{item.quantity}</span> },
  { key: "totalValue", header: "Value", className: "text-right", render: (item) => <span className="font-mono font-semibold">{formatCurrency(item.totalValue)}</span> },
  {
    key: "status",
    header: "Status",
    render: (item) => {
      const colors: Record<string, string> = { DRAFT: "", ACTIVE: "bg-blue-600", SHIPPED: "bg-emerald-600", COMPLETED: "bg-emerald-600", CANCELLED: "bg-red-600" };
      return <Badge variant={item.status === "DRAFT" ? "secondary" : "default"} className={colors[item.status] ?? ""}>{item.status}</Badge>;
    },
  },
];

const lcColumns: Column<LetterOfCredit>[] = [
  { key: "lcNumber", header: "LC #", render: (item) => <span className="font-mono font-medium text-primary">{item.lcNumber}</span> },
  { key: "bankName", header: "Issuing Bank" },
  { key: "amount", header: "Amount", className: "text-right", render: (item) => <span className="font-mono font-semibold">{formatCurrency(item.amount)}</span> },
  { key: "expiryDate", header: "Expiry", render: (item) => formatDate(item.expiryDate) },
  {
    key: "status",
    header: "Status",
    render: (item) => {
      const colors: Record<string, string> = { DRAFT: "", ISSUED: "bg-blue-600", CONFIRMED: "bg-emerald-600", EXPIRED: "bg-red-600" };
      return <Badge variant={item.status === "DRAFT" ? "secondary" : "default"} className={colors[item.status] ?? ""}>{item.status}</Badge>;
    },
  },
];

const shippingColumns: Column<ShippingDoc>[] = [
  { key: "documentNumber", header: "Doc #", render: (item) => <span className="font-mono font-medium">{item.documentNumber}</span> },
  { key: "type", header: "Type", render: (item) => <Badge variant="outline">{item.type}</Badge> },
  { key: "containerNumber", header: "Container", render: (item) => <span className="font-mono">{item.containerNumber}</span> },
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
  {
    key: "status",
    header: "Status",
    render: (item) => <Badge variant={item.status === "COMPLETED" ? "default" : "secondary"} className={item.status === "COMPLETED" ? "bg-emerald-600" : ""}>{item.status}</Badge>,
  },
];

export default function ExportSalesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ buyerName: "", country: "", riceType: "", quantity: "", rate: "", date: todayISO(), notes: "" });

  const { data: contracts = [], isLoading: cLoading } = useApiList<ExportContract>(["export-contracts"], "/export-sales/contracts");
  const { data: lcs = [], isLoading: lcLoading } = useApiList<LetterOfCredit>(["lcs"], "/export-sales/lcs");
  const { data: docs = [], isLoading: docLoading } = useApiList<ShippingDoc>(["shipping-docs"], "/export-sales/shipping-documents");

  const createMutation = useApiMutation<ExportContract, unknown>("/export-sales/contracts", "post", [["export-contracts"]]);

  const totalExportValue = contracts.reduce((s, c) => s + Number(c.totalValue || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Export Sales" description="Export contracts, letters of credit, and shipping documents" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Contracts" value={contracts.length} icon={Globe} description={`${contracts.filter((c) => c.status === "ACTIVE").length} active`} />
        <StatCard title="Letters of Credit" value={lcs.length} icon={Landmark} />
        <StatCard title="Shipping Docs" value={docs.length} icon={Ship} />
        <StatCard title="Export Value" value={formatCurrency(totalExportValue)} icon={FileText} />
      </div>

      <Tabs defaultValue="contracts">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="contracts" className="gap-1.5"><Globe className="size-3.5" />Contracts</TabsTrigger>
          <TabsTrigger value="lcs" className="gap-1.5"><Landmark className="size-3.5" />LCs</TabsTrigger>
          <TabsTrigger value="shipping" className="gap-1.5"><Ship className="size-3.5" />Shipping</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-4 mt-4">
          <DataTable
            columns={contractColumns}
            data={contracts as unknown as ExportContract[]}
            isLoading={cLoading}
            emptyMessage="No export contracts yet."
            searchPlaceholder="Search contracts..."
            actions={
              <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
                <Plus className="size-3.5" />
                New Contract
              </Button>
            }
          />
        </TabsContent>

        <TabsContent value="lcs" className="space-y-4 mt-4">
          <DataTable columns={lcColumns} data={lcs as unknown as LetterOfCredit[]} isLoading={lcLoading} emptyMessage="No letters of credit." searchPlaceholder="Search LCs..." />
        </TabsContent>

        <TabsContent value="shipping" className="space-y-4 mt-4">
          <DataTable columns={shippingColumns} data={docs as unknown as ShippingDoc[]} isLoading={docLoading} emptyMessage="No shipping documents." searchPlaceholder="Search documents..." />
        </TabsContent>
      </Tabs>

      <FormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Create Export Contract"
        description={`Contract # ${generateNumber("export-contract", contracts.length)}`}
        size="lg"
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate({ ...form, quantity: Number(form.quantity), rate: Number(form.rate) }, {
            onSuccess: () => { setShowCreate(false); toast.success("Contract created"); setForm({ buyerName: "", country: "", riceType: "", quantity: "", rate: "", date: todayISO(), notes: "" }); },
          });
        }}
        isLoading={createMutation.isPending}
        submitLabel="Create Contract"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Buyer Name</Label>
            <Input value={form.buyerName} onChange={(e) => setForm((p) => ({ ...p, buyerName: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Country</Label>
            <Input value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} required placeholder="e.g. UAE" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Rice Type</Label>
            <Input value={form.riceType} onChange={(e) => setForm((p) => ({ ...p, riceType: e.target.value }))} required placeholder="e.g. 1121 Sella" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Quantity (MT)</Label>
            <Input type="number" min="0" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} required placeholder="0" className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Rate / MT</Label>
            <Input type="number" min="0" step="0.01" value={form.rate} onChange={(e) => setForm((p) => ({ ...p, rate: e.target.value }))} required placeholder="0.00" className="font-mono" />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider">Date</Label>
          <Input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required />
        </div>
        {form.quantity && form.rate && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-sm">
            <span className="text-muted-foreground">Contract Value: </span>
            <span className="font-mono font-semibold text-primary">{formatCurrency(Number(form.quantity) * Number(form.rate))}</span>
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider">Notes</Label>
          <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2} />
        </div>
      </FormDialog>
    </div>
  );
}
