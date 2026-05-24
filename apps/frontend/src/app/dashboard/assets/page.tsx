"use client";

import { useState } from "react";
import { Building, TrendingDown, Plus, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { generateNumber, todayISO, formatCurrency, formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface Asset { id: string; assetCode: string; name: string; category: string; purchaseDate: string; purchaseValue: string; currentValue: string; status: string; }

const assetColumns: Column<Asset>[] = [
  { key: "assetCode", header: "Code", render: (item) => <span className="font-mono font-medium text-primary">{item.assetCode}</span> },
  { key: "name", header: "Asset Name" },
  { key: "category", header: "Category", render: (item) => <Badge variant="outline">{item.category}</Badge> },
  { key: "purchaseDate", header: "Purchase Date", render: (item) => formatDate(item.purchaseDate) },
  { key: "purchaseValue", header: "Cost", className: "text-right", render: (item) => <span className="font-mono">{formatCurrency(item.purchaseValue)}</span> },
  { key: "currentValue", header: "Book Value", className: "text-right", render: (item) => <span className="font-mono font-semibold">{formatCurrency(item.currentValue)}</span> },
  {
    key: "status",
    header: "Status",
    render: (item) => {
      const colors: Record<string, string> = { ACTIVE: "bg-emerald-600", DISPOSED: "bg-red-600", MAINTENANCE: "bg-amber-600" };
      return <Badge variant={item.status === "ACTIVE" ? "default" : "secondary"} className={colors[item.status] ?? ""}>{item.status}</Badge>;
    },
  },
];

export default function AssetsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", category: "MACHINERY", purchaseDate: todayISO(), purchaseValue: "", depreciationMethod: "SLM", usefulLife: "10", location: "" });

  const { data: assets = [], isLoading } = useApiList<Asset>(["assets"], "/assets");
  const createMutation = useApiMutation<Asset, unknown>("/assets", "post", [["assets"]]);

  const totalValue = assets.reduce((s, a) => s + Number(a.currentValue || 0), 0);
  const totalCost = assets.reduce((s, a) => s + Number(a.purchaseValue || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Fixed Assets" description="Asset register, depreciation, maintenance, and disposal" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Assets" value={assets.length} icon={Building} description={`${assets.filter((a) => a.status === "ACTIVE").length} active`} />
        <StatCard title="Total Cost" value={formatCurrency(totalCost)} icon={Calculator} />
        <StatCard title="Book Value" value={formatCurrency(totalValue)} icon={TrendingDown} />
        <StatCard title="Depreciation" value={formatCurrency(totalCost - totalValue)} icon={TrendingDown} description="Accumulated" />
      </div>

      <DataTable
        columns={assetColumns}
        data={assets as unknown as Asset[]}
        isLoading={isLoading}
        emptyMessage="No assets registered."
        searchPlaceholder="Search assets..."
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
            <Plus className="size-3.5" />
            New Asset
          </Button>
        }
      />

      <FormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Register Asset"
        description={`Asset # ${generateNumber("asset", assets.length)}`}
        size="lg"
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate({ ...form, purchaseValue: Number(form.purchaseValue), usefulLife: Number(form.usefulLife) }, {
            onSuccess: () => { setShowCreate(false); toast.success("Asset registered"); setForm({ name: "", category: "MACHINERY", purchaseDate: todayISO(), purchaseValue: "", depreciationMethod: "SLM", usefulLife: "10", location: "" }); },
          });
        }}
        isLoading={createMutation.isPending}
        submitLabel="Register Asset"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Asset Name</Label>
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Category</Label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
              <option value="MACHINERY">Machinery</option>
              <option value="VEHICLE">Vehicle</option>
              <option value="FURNITURE">Furniture</option>
              <option value="BUILDING">Building</option>
              <option value="LAND">Land</option>
              <option value="EQUIPMENT">Equipment</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Purchase Date</Label>
            <Input type="date" value={form.purchaseDate} onChange={(e) => setForm((p) => ({ ...p, purchaseDate: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Purchase Value</Label>
            <Input type="number" min="0" step="0.01" value={form.purchaseValue} onChange={(e) => setForm((p) => ({ ...p, purchaseValue: e.target.value }))} required placeholder="0.00" className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Useful Life (years)</Label>
            <Input type="number" min="1" value={form.usefulLife} onChange={(e) => setForm((p) => ({ ...p, usefulLife: e.target.value }))} required className="font-mono" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Depreciation Method</Label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.depreciationMethod} onChange={(e) => setForm((p) => ({ ...p, depreciationMethod: e.target.value }))}>
              <option value="SLM">Straight Line (SLM)</option>
              <option value="WDV">Written Down Value (WDV)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Location</Label>
            <Input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} placeholder="e.g. Main Office" />
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
