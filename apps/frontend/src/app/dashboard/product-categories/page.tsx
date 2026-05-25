"use client";

import { useState } from "react";
import { Tag, FolderTree, Plus, Settings2, Layers } from "lucide-react";
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

interface CategoryParameter {
  id: string;
  name: string;
  fieldType: string;
  isRequired: boolean;
}

interface ProductCategory {
  id: string;
  name: string;
  code: string;
  module: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  parameters: CategoryParameter[];
  children: ProductCategory[];
}

const MODULE_OPTIONS = [
  "inventory", "procurement", "sales", "production", "quality-control",
  "assets", "expense", "transport", "gate-pass",
];

const moduleColors: Record<string, string> = {
  inventory: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  procurement: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  sales: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  production: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "quality-control": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  assets: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  expense: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  transport: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  "gate-pass": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
};

const FIELD_TYPES = ["TEXT", "NUMBER", "SELECT", "DATE", "BOOLEAN", "TEXTAREA"];

const columns: Column<ProductCategory>[] = [
  { key: "code", header: "Code", render: (item) => <span className="font-mono font-medium text-primary">{item.code}</span> },
  { key: "name", header: "Name" },
  {
    key: "module",
    header: "Module",
    render: (item) => <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${moduleColors[item.module] ?? ""}`}>{item.module}</span>,
  },
  { key: "parameters", header: "Parameters", render: (item) => <Badge variant="secondary">{item.parameters?.length ?? 0} params</Badge> },
  { key: "children", header: "Sub-categories", render: (item) => item.children?.length > 0 ? <Badge variant="outline">{item.children.length}</Badge> : "—" },
  { key: "description", header: "Description", render: (item) => <span className="max-w-[200px] truncate block text-muted-foreground">{item.description ?? "—"}</span> },
  {
    key: "isActive",
    header: "Status",
    render: (item) => <Badge variant={item.isActive ? "default" : "secondary"} className={item.isActive ? "bg-emerald-600" : ""}>{item.isActive ? "Active" : "Inactive"}</Badge>,
  },
];

export default function ProductCategoriesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [filterModule, setFilterModule] = useState("");
  const [form, setForm] = useState({
    name: "", code: "", module: "inventory", description: "",
    parameters: [{ name: "", fieldType: "TEXT", isRequired: false }] as { name: string; fieldType: string; isRequired: boolean }[],
  });

  const queryStr = filterModule ? `?module=${filterModule}` : "";
  const { data: categories = [], isLoading } = useApiList<ProductCategory>(["product-categories", filterModule], `/product-categories${queryStr}`);
  const createMutation = useApiMutation("/product-categories", "post", [["product-categories", filterModule]]);

  const moduleDistribution = categories.reduce<Record<string, number>>((acc, c) => {
    acc[c.module] = (acc[c.module] ?? 0) + 1;
    return acc;
  }, {});

  const addParam = () => setForm((p) => ({ ...p, parameters: [...p.parameters, { name: "", fieldType: "TEXT", isRequired: false }] }));
  const removeParam = (idx: number) => setForm((p) => ({ ...p, parameters: p.parameters.filter((_, i) => i !== idx) }));

  return (
    <div className="space-y-6">
      <PageHeader title="Product Categories" description="Customizable categories and parameters across all modules" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Categories" value={categories.length} icon={Tag} />
        <StatCard title="Modules Covered" value={Object.keys(moduleDistribution).length} icon={FolderTree} />
        <StatCard title="Total Parameters" value={categories.reduce((s, c) => s + (c.parameters?.length ?? 0), 0)} icon={Settings2} />
        <StatCard title="Sub-categories" value={categories.reduce((s, c) => s + (c.children?.length ?? 0), 0)} icon={Layers} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Label className="text-sm font-medium">Filter by module:</Label>
        <Button variant={filterModule === "" ? "default" : "outline"} size="sm" onClick={() => setFilterModule("")}>All</Button>
        {MODULE_OPTIONS.map((m) => (
          <Button key={m} variant={filterModule === m ? "default" : "outline"} size="sm" onClick={() => setFilterModule(m)} className="capitalize">
            {m.replace("-", " ")}
          </Button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={categories}
        isLoading={isLoading}
        emptyMessage="No categories defined. Create your first product category."
        searchPlaceholder="Search categories..."
        actions={<Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}><Plus className="size-3.5" />New Category</Button>}
      />

      <FormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Create Product Category"
        onSubmit={(e) => {
          e.preventDefault();
          const payload = {
            ...form,
            parameters: form.parameters.filter((p) => p.name.trim()),
          };
          createMutation.mutate(payload as never, { onSuccess: () => { setShowCreate(false); toast.success("Category created"); } });
        }}
        isLoading={createMutation.isPending}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Name</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required placeholder="e.g. Basmati Rice" /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Code</Label><Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} required placeholder="e.g. BASMATI" className="font-mono" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Module</Label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.module} onChange={(e) => setForm((p) => ({ ...p, module: e.target.value }))}>
              {MODULE_OPTIONS.map((m) => <option key={m} value={m} className="capitalize">{m.replace("-", " ")}</option>)}
            </select>
          </div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Description</Label><Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase tracking-wider">Custom Parameters</Label>
            <Button type="button" variant="outline" size="sm" onClick={addParam} className="gap-1"><Plus className="size-3" />Add</Button>
          </div>
          {form.parameters.map((param, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
              <Input placeholder="Parameter name" value={param.name} onChange={(e) => { const params = [...form.parameters]; params[idx] = { ...params[idx], name: e.target.value }; setForm((p) => ({ ...p, parameters: params })); }} />
              <select className="rounded-md border bg-background px-2 py-2 text-sm w-28" value={param.fieldType} onChange={(e) => { const params = [...form.parameters]; params[idx] = { ...params[idx], fieldType: e.target.value }; setForm((p) => ({ ...p, parameters: params })); }}>
                {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={param.isRequired} onChange={(e) => { const params = [...form.parameters]; params[idx] = { ...params[idx], isRequired: e.target.checked }; setForm((p) => ({ ...p, parameters: params })); }} />Req</label>
              {form.parameters.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => removeParam(idx)} className="text-destructive">×</Button>}
            </div>
          ))}
        </div>
      </FormDialog>
    </div>
  );
}
