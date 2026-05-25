"use client";

import { useState } from "react";
import { Wheat, Users, BarChart3, FlaskConical, Plus, TrendingDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { generateNumber, todayISO, formatCurrency, formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface Supplier { id: string; name: string; type: string; phone: string; email: string; address: string; isActive: boolean; }
interface RiceVariety { id: string; name: string; code: string; category: string; description: string; }
interface PaddyPurchase { id: string; purchaseNumber: string; date: string; supplierName: string; varietyName: string; grossWeight: number; netWeight: number; rate: number; totalAmount: string; isPosted: boolean; }

const supplierColumns: Column<Supplier>[] = [
  { key: "name", header: "Supplier Name" },
  {
    key: "type",
    header: "Type",
    render: (item) => {
      const colors: Record<string, string> = { FARMER: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200", DEALER: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", COMMISSION_AGENT: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200", ARTHI: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" };
      return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[item.type] ?? ""}`}>{item.type}</span>;
    },
  },
  { key: "phone", header: "Phone" },
  { key: "email", header: "Email" },
  {
    key: "isActive",
    header: "Status",
    render: (item) => (
      <Badge variant={item.isActive ? "default" : "secondary"} className={item.isActive ? "bg-emerald-600" : ""}>
        {item.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
];

const varietyColumns: Column<RiceVariety>[] = [
  { key: "code", header: "Code", render: (item) => <span className="font-mono font-medium">{item.code}</span> },
  { key: "name", header: "Variety Name" },
  {
    key: "category",
    header: "Category",
    render: (item) => <Badge variant="outline">{item.category}</Badge>,
  },
  { key: "description", header: "Description" },
];

const purchaseColumns: Column<PaddyPurchase>[] = [
  { key: "purchaseNumber", header: "Purchase #", render: (item) => <span className="font-mono font-medium text-primary">{item.purchaseNumber}</span> },
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
  { key: "grossWeight", header: "Gross (kg)", render: (item) => <span className="font-mono">{item.grossWeight?.toLocaleString()}</span> },
  { key: "netWeight", header: "Net (kg)", render: (item) => <span className="font-mono">{item.netWeight?.toLocaleString()}</span> },
  { key: "rate", header: "Rate/kg", render: (item) => <span className="font-mono">{formatCurrency(item.rate)}</span> },
  { key: "totalAmount", header: "Total", className: "text-right", render: (item) => <span className="font-mono font-semibold">{formatCurrency(item.totalAmount)}</span> },
  {
    key: "isPosted",
    header: "Status",
    render: (item) => (
      <Badge variant={item.isPosted ? "default" : "secondary"} className={item.isPosted ? "bg-emerald-600" : ""}>
        {item.isPosted ? "Posted" : "Draft"}
      </Badge>
    ),
  },
];

export default function ProcurementPage() {
  const [showCreateSupplier, setShowCreateSupplier] = useState(false);
  const [showCreateVariety, setShowCreateVariety] = useState(false);
  const [showCreatePurchase, setShowCreatePurchase] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: "", type: "FARMER", phone: "", email: "", address: "" });
  const [varietyForm, setVarietyForm] = useState({ name: "", code: "", category: "BASMATI", description: "" });
  const [purchaseForm, setPurchaseForm] = useState({ supplierId: "", varietyId: "", date: todayISO(), grossWeight: "", netWeight: "", rate: "", moisturePercent: "", brokenPercent: "" });

  const { data: suppliers = [], isLoading: suppLoading } = useApiList<Supplier>(["suppliers"], "/procurement/suppliers");
  const { data: varieties = [], isLoading: varLoading } = useApiList<RiceVariety>(["varieties"], "/procurement/rice-varieties");
  const { data: purchases = [], isLoading: purchLoading } = useApiList<PaddyPurchase>(["purchases"], "/procurement/paddy-purchases");

  const createSuppMutation = useApiMutation<Supplier, typeof supplierForm>("/procurement/suppliers", "post", [["suppliers"]]);
  const createVarMutation = useApiMutation<RiceVariety, typeof varietyForm>("/procurement/rice-varieties", "post", [["varieties"]]);
  const createPurchMutation = useApiMutation<PaddyPurchase, unknown>("/procurement/paddy-purchases", "post", [["purchases"]]);

  const totalPurchaseValue = purchases.reduce((s, p) => s + Number(p.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Procurement" description="Suppliers, rice varieties, paddy purchases, and quality testing" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Suppliers" value={suppliers.length} icon={Users} description={`${suppliers.filter((s) => s.isActive).length} active`} />
        <StatCard title="Rice Varieties" value={varieties.length} icon={Wheat} />
        <StatCard title="Purchases" value={purchases.length} icon={BarChart3} description={`${purchases.filter((p) => p.isPosted).length} posted`} />
        <StatCard title="Purchase Value" value={formatCurrency(totalPurchaseValue)} icon={TrendingDown} />
      </div>

      <Tabs defaultValue="purchases">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="purchases" className="gap-1.5"><BarChart3 className="size-3.5" />Purchases</TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-1.5"><Users className="size-3.5" />Suppliers</TabsTrigger>
          <TabsTrigger value="varieties" className="gap-1.5"><Wheat className="size-3.5" />Varieties</TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="space-y-4 mt-4">
          <DataTable
            columns={purchaseColumns}
            data={purchases as unknown as PaddyPurchase[]}
            isLoading={purchLoading}
            emptyMessage="No paddy purchases yet."
            searchPlaceholder="Search purchases..."
            actions={
              <Button size="sm" className="gap-1.5" onClick={() => setShowCreatePurchase(true)}>
                <Plus className="size-3.5" />
                New Purchase
              </Button>
            }
          />
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4 mt-4">
          <DataTable
            columns={supplierColumns}
            data={suppliers as unknown as Supplier[]}
            isLoading={suppLoading}
            emptyMessage="No suppliers yet."
            searchPlaceholder="Search suppliers..."
            actions={
              <Button size="sm" className="gap-1.5" onClick={() => setShowCreateSupplier(true)}>
                <Plus className="size-3.5" />
                New Supplier
              </Button>
            }
          />
        </TabsContent>

        <TabsContent value="varieties" className="space-y-4 mt-4">
          <DataTable
            columns={varietyColumns}
            data={varieties as unknown as RiceVariety[]}
            isLoading={varLoading}
            emptyMessage="No rice varieties yet."
            searchPlaceholder="Search varieties..."
            actions={
              <Button size="sm" className="gap-1.5" onClick={() => setShowCreateVariety(true)}>
                <Plus className="size-3.5" />
                New Variety
              </Button>
            }
          />
        </TabsContent>
      </Tabs>

      {/* Create Purchase */}
      <FormDialog
        open={showCreatePurchase}
        onOpenChange={setShowCreatePurchase}
        title="Create Paddy Purchase"
        description={`Purchase # ${generateNumber("purchase-order", purchases.length)}`}
        size="lg"
        onSubmit={(e) => {
          e.preventDefault();
          createPurchMutation.mutate(
            {
              ...purchaseForm,
              grossWeight: Number(purchaseForm.grossWeight),
              netWeight: Number(purchaseForm.netWeight),
              rate: Number(purchaseForm.rate),
              moisturePercent: Number(purchaseForm.moisturePercent || 0),
              brokenPercent: Number(purchaseForm.brokenPercent || 0),
            },
            {
              onSuccess: () => {
                setShowCreatePurchase(false);
                toast.success("Paddy purchase created");
                setPurchaseForm({ supplierId: "", varietyId: "", date: todayISO(), grossWeight: "", netWeight: "", rate: "", moisturePercent: "", brokenPercent: "" });
              },
            }
          );
        }}
        isLoading={createPurchMutation.isPending}
        submitLabel="Create Purchase"
      >
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Date</Label>
            <Input type="date" value={purchaseForm.date} onChange={(e) => setPurchaseForm((p) => ({ ...p, date: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Supplier</Label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={purchaseForm.supplierId} onChange={(e) => setPurchaseForm((p) => ({ ...p, supplierId: e.target.value }))} required>
              <option value="">Select supplier...</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Rice Variety</Label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={purchaseForm.varietyId} onChange={(e) => setPurchaseForm((p) => ({ ...p, varietyId: e.target.value }))} required>
              <option value="">Select variety...</option>
              {varieties.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
        </div>
        <Separator />
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Gross Weight (kg)</Label>
            <Input type="number" min="0" step="0.01" value={purchaseForm.grossWeight} onChange={(e) => setPurchaseForm((p) => ({ ...p, grossWeight: e.target.value }))} required placeholder="0" className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Net Weight (kg)</Label>
            <Input type="number" min="0" step="0.01" value={purchaseForm.netWeight} onChange={(e) => setPurchaseForm((p) => ({ ...p, netWeight: e.target.value }))} required placeholder="0" className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Rate / kg</Label>
            <Input type="number" min="0" step="0.01" value={purchaseForm.rate} onChange={(e) => setPurchaseForm((p) => ({ ...p, rate: e.target.value }))} required placeholder="0.00" className="font-mono" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Moisture %</Label>
            <Input type="number" min="0" max="100" step="0.1" value={purchaseForm.moisturePercent} onChange={(e) => setPurchaseForm((p) => ({ ...p, moisturePercent: e.target.value }))} placeholder="0" className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Broken %</Label>
            <Input type="number" min="0" max="100" step="0.1" value={purchaseForm.brokenPercent} onChange={(e) => setPurchaseForm((p) => ({ ...p, brokenPercent: e.target.value }))} placeholder="0" className="font-mono" />
          </div>
        </div>
        {purchaseForm.netWeight && purchaseForm.rate && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-sm">
            <span className="text-muted-foreground">Estimated Total: </span>
            <span className="font-mono font-semibold text-primary">{formatCurrency(Number(purchaseForm.netWeight) * Number(purchaseForm.rate))}</span>
          </div>
        )}
      </FormDialog>

      {/* Create Supplier */}
      <FormDialog
        open={showCreateSupplier}
        onOpenChange={setShowCreateSupplier}
        title="Add Supplier"
        description="Add a new paddy supplier or vendor"
        onSubmit={(e) => {
          e.preventDefault();
          createSuppMutation.mutate(supplierForm, {
            onSuccess: () => { setShowCreateSupplier(false); toast.success("Supplier added"); setSupplierForm({ name: "", type: "FARMER", phone: "", email: "", address: "" }); },
          });
        }}
        isLoading={createSuppMutation.isPending}
      >
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider">Supplier Name</Label>
          <Input value={supplierForm.name} onChange={(e) => setSupplierForm((p) => ({ ...p, name: e.target.value }))} required placeholder="Supplier name" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider">Type</Label>
          <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={supplierForm.type} onChange={(e) => setSupplierForm((p) => ({ ...p, type: e.target.value }))}>
            <option value="FARMER">Farmer</option>
            <option value="DEALER">Dealer</option>
            <option value="COMMISSION_AGENT">Commission Agent</option>
            <option value="ARTHI">Arthi</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Phone</Label>
            <Input value={supplierForm.phone} onChange={(e) => setSupplierForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+92-300-0000000" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Email</Label>
            <Input type="email" value={supplierForm.email} onChange={(e) => setSupplierForm((p) => ({ ...p, email: e.target.value }))} placeholder="email@example.com" />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider">Address</Label>
          <Textarea value={supplierForm.address} onChange={(e) => setSupplierForm((p) => ({ ...p, address: e.target.value }))} rows={2} placeholder="Full address" />
        </div>
      </FormDialog>

      {/* Create Variety */}
      <FormDialog
        open={showCreateVariety}
        onOpenChange={setShowCreateVariety}
        title="Add Rice Variety"
        onSubmit={(e) => {
          e.preventDefault();
          createVarMutation.mutate(varietyForm, {
            onSuccess: () => { setShowCreateVariety(false); toast.success("Variety added"); setVarietyForm({ name: "", code: "", category: "BASMATI", description: "" }); },
          });
        }}
        isLoading={createVarMutation.isPending}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Code</Label>
            <Input value={varietyForm.code} onChange={(e) => setVarietyForm((p) => ({ ...p, code: e.target.value }))} required placeholder="e.g. BAS-1121" className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Name</Label>
            <Input value={varietyForm.name} onChange={(e) => setVarietyForm((p) => ({ ...p, name: e.target.value }))} required placeholder="e.g. Super Basmati" />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider">Category</Label>
          <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={varietyForm.category} onChange={(e) => setVarietyForm((p) => ({ ...p, category: e.target.value }))}>
            <option value="BASMATI">Basmati</option>
            <option value="NON_BASMATI">Non-Basmati</option>
            <option value="SELLA">Sella</option>
            <option value="STEAM">Steam</option>
            <option value="BROKEN">Broken</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider">Description</Label>
          <Textarea value={varietyForm.description} onChange={(e) => setVarietyForm((p) => ({ ...p, description: e.target.value }))} rows={2} />
        </div>
      </FormDialog>
    </div>
  );
}
