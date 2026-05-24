"use client";

import { useState } from "react";
import { Database, Table, Shield, Calculator, Plus } from "lucide-react";
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
import { toast } from "sonner";

interface UDT { id: string; tableName: string; description: string; columns: any[]; data: any[]; createdAt: string; }
interface AuthGroup { id: string; name: string; description: string; module: string; isActive: boolean; }
interface InvValuation { id: string; itemCode: string; valuationMethod: string; standardCost: number; movingAverage: number; currentValue: number; }

const udtColumns: Column<UDT>[] = [
  { key: "tableName", header: "Table Name", render: (r) => <span className="font-mono font-semibold">{r.tableName}</span> },
  { key: "description", header: "Description" },
  { key: "columns", header: "Columns", className: "text-right", render: (r) => <span className="font-mono">{r.columns?.length || 0}</span> },
  { key: "data", header: "Rows", className: "text-right", render: (r) => <span className="font-mono">{r.data?.length || 0}</span> },
];

const agColumns: Column<AuthGroup>[] = [
  { key: "name", header: "Group Name" },
  { key: "description", header: "Description" },
  { key: "module", header: "Module", render: (r) => <Badge variant="outline">{r.module}</Badge> },
  { key: "isActive", header: "Active", render: (r) => <Badge className={r.isActive ? "bg-emerald-600" : "bg-slate-500"}>{r.isActive ? "Yes" : "No"}</Badge> },
];

const ivColumns: Column<InvValuation>[] = [
  { key: "itemCode", header: "Item Code", render: (r) => <span className="font-mono font-semibold">{r.itemCode}</span> },
  { key: "valuationMethod", header: "Method", render: (r) => <Badge variant="outline">{r.valuationMethod}</Badge> },
  { key: "standardCost", header: "Std Cost", className: "text-right", render: (r) => <span className="font-mono">{Number(r.standardCost).toLocaleString()}</span> },
  { key: "movingAverage", header: "Moving Avg", className: "text-right", render: (r) => <span className="font-mono">{Number(r.movingAverage).toLocaleString()}</span> },
  { key: "currentValue", header: "Current Value", className: "text-right", render: (r) => <span className="font-mono font-semibold">{Number(r.currentValue).toLocaleString()}</span> },
];

export default function AdminEnhancementsPage() {
  const [showUdt, setShowUdt] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [udtForm, setUdtForm] = useState({ tableName: "", description: "" });
  const [authForm, setAuthForm] = useState({ name: "", description: "", module: "FINANCE" });

  const { data: udts = [], isLoading } = useApiList<UDT>(["udts"], "/admin-enhancements/tables");
  const { data: authGroups = [] } = useApiList<AuthGroup>(["auth-groups"], "/admin-enhancements/auth-groups");
  const { data: valuations = [] } = useApiList<InvValuation>(["inv-valuations"], "/admin-enhancements/inventory-valuations");
  const { data: summary } = useApiList<any>(["admin-summary"], "/admin-enhancements/summary");

  const udtMut = useApiMutation("/admin-enhancements/tables", "post", { invalidateKeys: [["udts"], ["admin-summary"]], onSuccess: () => { setShowUdt(false); toast.success("Custom table created"); } });
  const authMut = useApiMutation("/admin-enhancements/auth-groups", "post", { invalidateKeys: [["auth-groups"]], onSuccess: () => { setShowAuth(false); toast.success("Authorization group created"); } });

  const stats = summary as any;

  return (
    <div className="space-y-6">
      <PageHeader title="Administration Enhancements" description="User-defined tables, authorization groups, and inventory valuation methods">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAuth(true)}><Shield className="mr-2 h-4 w-4" />New Auth Group</Button>
          <Button onClick={() => setShowUdt(true)}><Plus className="mr-2 h-4 w-4" />New Custom Table</Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Custom Tables" value={stats?.userDefinedTables ?? 0} icon={Table} />
        <StatCard title="Auth Groups" value={stats?.authorizationGroups ?? 0} icon={Shield} />
        <StatCard title="Valuation Items" value={stats?.inventoryValuations ?? 0} icon={Calculator} />
      </div>

      <Tabs defaultValue="tables" className="space-y-4">
        <TabsList><TabsTrigger value="tables">Custom Tables (UDT)</TabsTrigger><TabsTrigger value="auth">Authorization Groups</TabsTrigger><TabsTrigger value="valuation">Inventory Valuation</TabsTrigger></TabsList>
        <TabsContent value="tables"><DataTable columns={udtColumns} data={udts} isLoading={isLoading}  /></TabsContent>
        <TabsContent value="auth"><DataTable columns={agColumns} data={authGroups}  /></TabsContent>
        <TabsContent value="valuation"><DataTable columns={ivColumns} data={valuations}  /></TabsContent>
      </Tabs>

      <FormDialog open={showUdt} onOpenChange={setShowUdt} title="New Custom Table" onSubmit={() => udtMut.mutate(udtForm)} isLoading={udtMut.isPending}>
        <div className="grid gap-4">
          <div><Label>Table Name</Label><Input value={udtForm.tableName} onChange={(e) => setUdtForm({ ...udtForm, tableName: e.target.value })} placeholder="e.g. custom_rice_grades" /></div>
          <div><Label>Description</Label><Input value={udtForm.description} onChange={(e) => setUdtForm({ ...udtForm, description: e.target.value })} placeholder="Custom rice grading system" /></div>
        </div>
      </FormDialog>

      <FormDialog open={showAuth} onOpenChange={setShowAuth} title="New Authorization Group" onSubmit={() => authMut.mutate(authForm)} isLoading={authMut.isPending}>
        <div className="grid gap-4">
          <div><Label>Group Name</Label><Input value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} placeholder="e.g. Finance Managers" /></div>
          <div><Label>Module</Label><Select value={authForm.module} onValueChange={(v) => setAuthForm({ ...authForm, module: v ?? '' })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="FINANCE">Finance</SelectItem><SelectItem value="SALES">Sales</SelectItem><SelectItem value="PURCHASING">Purchasing</SelectItem><SelectItem value="INVENTORY">Inventory</SelectItem><SelectItem value="PRODUCTION">Production</SelectItem><SelectItem value="HR">HR</SelectItem></SelectContent></Select></div>
          <div><Label>Description</Label><Input value={authForm.description} onChange={(e) => setAuthForm({ ...authForm, description: e.target.value })} /></div>
        </div>
      </FormDialog>
    </div>
  );
}
