"use client";

import { useState } from "react";
import { Layers, Package, Plus, ToggleLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { toast } from "sonner";

interface BomItem {
  riceVarietyId: string;
  quantity: number;
  unit: string;
  riceVariety?: { name: string };
}

interface Bom {
  id: string;
  name: string;
  code: string;
  processType: string;
  outputQuantity: number;
  isActive: boolean;
  outputVariety?: { name: string };
  items: BomItem[];
  _count?: { workOrders: number };
}

const columns: Column<Bom>[] = [
  { key: "code", header: "BOM Code", render: (item) => <span className="font-mono font-medium text-primary">{item.code}</span> },
  { key: "name", header: "Name" },
  { key: "processType", header: "Process", render: (item) => <Badge variant="outline">{item.processType}</Badge> },
  { key: "outputVariety", header: "Output", render: (item) => item.outputVariety?.name ?? "—" },
  { key: "outputQuantity", header: "Output Qty", render: (item) => <span className="font-mono">{Number(item.outputQuantity).toLocaleString("en-PK")} KG</span> },
  { key: "items", header: "Inputs", render: (item) => <Badge variant="secondary">{item.items?.length ?? 0} items</Badge> },
  {
    key: "isActive",
    header: "Status",
    render: (item) => <Badge variant={item.isActive ? "default" : "secondary"} className={item.isActive ? "bg-emerald-600" : ""}>{item.isActive ? "Active" : "Inactive"}</Badge>,
  },
];

const PROCESS_TYPES = ["SHELLING", "POLISHING", "SELLA", "STEAM", "SORTING", "GRADING", "CLEANING"];

export default function BomPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "", processType: "SHELLING", outputVarietyId: "", outputQuantity: 0,
    items: [{ riceVarietyId: "", quantity: 0, unit: "KG" }],
  });

  const { data: boms = [], isLoading } = useApiList<Bom>(["bom"], "/bom");
  const { data: varieties = [] } = useApiList<{ id: string; name: string }>(["rice-varieties"], "/procurement/varieties");
  const createMutation = useApiMutation("/bom", "post", [["bom"]]);

  const activeBoms = boms.filter((b) => b.isActive);

  const addItem = () => setForm((p) => ({ ...p, items: [...p.items, { riceVarietyId: "", quantity: 0, unit: "KG" }] }));
  const removeItem = (idx: number) => setForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));

  return (
    <div className="space-y-6">
      <PageHeader title="Bill of Materials" description="Define input-output recipes for rice processing" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total BOMs" value={boms.length} icon={Layers} />
        <StatCard title="Active" value={activeBoms.length} icon={ToggleLeft} />
        <StatCard title="Process Types" value={new Set(boms.map((b) => b.processType)).size} icon={Package} />
        <StatCard title="Rice Varieties" value={varieties.length} icon={Package} description="Available for BOM" />
      </div>

      <DataTable
        columns={columns}
        data={boms}
        isLoading={isLoading}
        emptyMessage="No BOMs defined. Create your first Bill of Materials."
        searchPlaceholder="Search BOMs..."
        actions={<Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}><Plus className="size-3.5" />New BOM</Button>}
      />

      <FormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Create Bill of Materials"
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate(form as never, { onSuccess: () => { setShowCreate(false); toast.success("BOM created"); } });
        }}
        isLoading={createMutation.isPending}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Name</Label>
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required placeholder="e.g. Basmati Super Kernel" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Process Type</Label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.processType} onChange={(e) => setForm((p) => ({ ...p, processType: e.target.value }))}>
              {PROCESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Output Variety</Label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.outputVarietyId} onChange={(e) => setForm((p) => ({ ...p, outputVarietyId: e.target.value }))} required>
              <option value="">Select variety</option>
              {varieties.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Output Quantity (KG)</Label>
            <Input type="number" value={form.outputQuantity || ""} onChange={(e) => setForm((p) => ({ ...p, outputQuantity: Number(e.target.value) }))} required />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase tracking-wider">Input Materials</Label>
            <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1"><Plus className="size-3" />Add</Button>
          </div>
          {form.items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_auto_auto] gap-2 items-end">
              <div className="space-y-1">
                <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={item.riceVarietyId} onChange={(e) => { const items = [...form.items]; items[idx] = { ...items[idx], riceVarietyId: e.target.value }; setForm((p) => ({ ...p, items })); }}>
                  <option value="">Select variety</option>
                  {varieties.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <Input type="number" placeholder="Qty" className="w-24" value={item.quantity || ""} onChange={(e) => { const items = [...form.items]; items[idx] = { ...items[idx], quantity: Number(e.target.value) }; setForm((p) => ({ ...p, items })); }} />
              {form.items.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(idx)} className="text-destructive">×</Button>
              )}
            </div>
          ))}
        </div>
      </FormDialog>
    </div>
  );
}
