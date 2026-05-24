"use client";

import { useState } from "react";
import { Settings2, Printer, Layout, Shield, Link2, Download, Plus, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

interface UDF { id: string; entityType: string; fieldName: string; fieldLabel: string; fieldType: string; isRequired: boolean; isActive: boolean; }
interface PrintLayout { id: string; name: string; entityType: string; isDefault: boolean; }
interface DragRelateResult { [key: string]: unknown[]; }

const udfColumns: Column<UDF>[] = [
  { key: "fieldLabel", header: "Label" },
  { key: "fieldName", header: "Field Name", render: (i) => <code className="text-xs bg-muted px-1 rounded">{i.fieldName}</code> },
  { key: "entityType", header: "Entity", render: (i) => <Badge variant="outline">{i.entityType}</Badge> },
  { key: "fieldType", header: "Type", render: (i) => <Badge>{i.fieldType}</Badge> },
  { key: "isRequired", header: "Required", render: (i) => i.isRequired ? <Badge variant="destructive">Yes</Badge> : <Badge variant="secondary">No</Badge> },
];

const layoutColumns: Column<PrintLayout>[] = [
  { key: "name", header: "Layout Name" },
  { key: "entityType", header: "Document Type", render: (i) => <Badge variant="outline">{i.entityType}</Badge> },
  { key: "isDefault", header: "Default", render: (i) => i.isDefault ? <Badge>Default</Badge> : <Badge variant="secondary">No</Badge> },
];

const ENTITY_TYPES = ["CUSTOMER", "SUPPLIER", "EMPLOYEE", "ITEM", "INVOICE", "PURCHASE_ORDER", "SALES_ORDER", "JOURNAL_ENTRY"];
const FIELD_TYPES = ["TEXT", "NUMBER", "DATE", "SELECT", "BOOLEAN", "TEXTAREA"];
const DOC_TYPES = ["SALES_INVOICE", "PURCHASE_ORDER", "DELIVERY_CHALLAN", "CREDIT_NOTE", "DEBIT_NOTE", "JOURNAL_ENTRY", "REPORT"];
const EXPORT_MODULES = ["customers", "suppliers", "chart-of-accounts", "journal-entries", "sales-invoices", "purchase-orders", "inventory-items", "employees"];

export default function AdminToolsPage() {
  const token = useAuthStore((s) => s.token);
  const [udfOpen, setUdfOpen] = useState(false);
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [drEntity, setDrEntity] = useState("");
  const [drId, setDrId] = useState("");
  const [drResult, setDrResult] = useState<DragRelateResult | null>(null);
  const [exportModule, setExportModule] = useState("");

  const { data: udfs = [], refetch: refetchUdfs } = useApiList<UDF>(["udfs"], "/admin-enhanced/udfs");
  const { data: layouts = [], refetch: refetchLayouts } = useApiList<PrintLayout>(["print-layouts"], "/admin-enhanced/print-layouts");

  const createUdf = useApiMutation("/admin-enhanced/udfs", "post");
  const createLayout = useApiMutation("/admin-enhanced/print-layouts", "post");
  const dragRelate = useApiMutation("/admin-enhanced/drag-and-relate", "post");

  const udfList = Array.isArray(udfs) ? udfs : [];
  const layoutList = Array.isArray(layouts) ? layouts : [];

  const handleDragRelate = async () => {
    if (!drEntity || !drId) return;
    const result = await dragRelate.mutateAsync({ entityType: drEntity, entityId: drId });
    setDrResult(result as DragRelateResult);
  };

  const handleExport = () => {
    if (!exportModule) return;

    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"}/admin-enhanced/export/${exportModule}`;
    window.open(url, "_blank");
    toast.success(`Exporting ${exportModule} data...`);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Tools" description="User-Defined Fields, Print Layouts, Form Customization, Data Ownership, Drag & Relate, Excel Export" />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Custom Fields" value={udfList.length} icon={Settings2} description="User-defined fields" />
        <StatCard title="Print Layouts" value={layoutList.length} icon={Printer} description="Document templates" />
        <StatCard title="Entity Types" value={ENTITY_TYPES.length} icon={Layout} description="Available entities" />
        <StatCard title="Export Modules" value={EXPORT_MODULES.length} icon={Download} description="Available exports" />
      </div>

      <Tabs defaultValue="udf" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="udf">Custom Fields (UDF)</TabsTrigger>
          <TabsTrigger value="print-layouts">Print Layouts</TabsTrigger>
          <TabsTrigger value="form-customization">Form Customization</TabsTrigger>
          <TabsTrigger value="drag-relate">Drag & Relate</TabsTrigger>
          <TabsTrigger value="excel-export">Excel Export</TabsTrigger>
        </TabsList>

        <TabsContent value="udf" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setUdfOpen(true)}><Plus className="mr-2 h-4 w-4" />Add Custom Field</Button>
          </div>
          <DataTable columns={udfColumns} data={udfList} />
          <FormDialog open={udfOpen} onOpenChange={setUdfOpen} title="Create User-Defined Field" onSubmit={async (e) => {
            e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement);
            await createUdf.mutateAsync({ entityType: fd.get("entityType"), fieldName: fd.get("fieldName"), fieldLabel: fd.get("fieldLabel"), fieldType: fd.get("fieldType"), isRequired: fd.get("isRequired") === "true" });
            toast.success("Custom field created"); setUdfOpen(false); refetchUdfs();
          }}>
            <div className="grid gap-4">
              <div><Label>Entity Type</Label>
                <Select name="entityType"><SelectTrigger><SelectValue placeholder="Where to add field" /></SelectTrigger>
                  <SelectContent>{ENTITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Field Name</Label><Input name="fieldName" placeholder="e.g. custom_region" required /></div>
                <div><Label>Field Label</Label><Input name="fieldLabel" placeholder="e.g. Region" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Field Type</Label>
                  <Select name="fieldType"><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>{FIELD_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Required</Label>
                  <Select name="isRequired"><SelectTrigger><SelectValue placeholder="Required?" /></SelectTrigger>
                    <SelectContent><SelectItem value="false">No</SelectItem><SelectItem value="true">Yes</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </FormDialog>
        </TabsContent>

        <TabsContent value="print-layouts" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setLayoutOpen(true)}><Plus className="mr-2 h-4 w-4" />New Layout</Button>
          </div>
          <DataTable columns={layoutColumns} data={layoutList} />
          <FormDialog open={layoutOpen} onOpenChange={setLayoutOpen} title="Create Print Layout" onSubmit={async (e) => {
            e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement);
            await createLayout.mutateAsync({ documentType: fd.get("documentType"), name: fd.get("name"), layout: fd.get("layout"), isDefault: fd.get("isDefault") === "true" });
            toast.success("Print layout created"); setLayoutOpen(false); refetchLayouts();
          }}>
            <div className="grid gap-4">
              <div><Label>Layout Name</Label><Input name="name" required /></div>
              <div><Label>Document Type</Label>
                <Select name="documentType"><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>{DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Layout Template (HTML/JSON)</Label><Textarea name="layout" rows={8} placeholder="Enter layout template..." /></div>
              <div><Label>Set as Default</Label>
                <Select name="isDefault"><SelectTrigger><SelectValue placeholder="Default?" /></SelectTrigger>
                  <SelectContent><SelectItem value="false">No</SelectItem><SelectItem value="true">Yes</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </FormDialog>
        </TabsContent>

        <TabsContent value="form-customization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Layout className="h-5 w-5" />Form Customization</CardTitle>
              <CardDescription>Customize form layouts per entity type. Define which fields appear and in what order.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 bg-blue-50">
                <p className="text-sm">Form layouts are saved per role and entity type. Changes apply to all users with that role.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {ENTITY_TYPES.slice(0, 6).map((entity) => (
                  <Card key={entity} className="cursor-pointer hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <p className="font-medium">{entity}</p>
                      <p className="text-xs text-muted-foreground">Click to customize form layout</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drag-relate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" />Drag & Relate</CardTitle>
              <CardDescription>Click any entity to see all related transactions across all modules.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div><Label>Entity Type</Label>
                  <Select onValueChange={(v: any) => v && setDrEntity(String(v))}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUSTOMER">Customer</SelectItem>
                      <SelectItem value="SUPPLIER">Supplier</SelectItem>
                      <SelectItem value="ITEM">Item</SelectItem>
                      <SelectItem value="ACCOUNT">Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Entity ID</Label><Input value={drId} onChange={(e) => setDrId(e.target.value)} placeholder="Enter entity ID" /></div>
                <div className="flex items-end"><Button onClick={handleDragRelate} className="w-full"><Search className="mr-2 h-4 w-4" />Relate</Button></div>
              </div>
              {drResult && (
                <div className="space-y-3 mt-4">
                  {Object.entries(drResult).map(([key, values]) => (
                    <Card key={key}>
                      <CardHeader className="py-2 px-4">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                          <Badge>{Array.isArray(values) ? values.length : 0}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-3">
                        {Array.isArray(values) && values.length > 0 ? (
                          <div className="text-xs space-y-1">
                            {values.slice(0, 5).map((v: any, idx: number) => (
                              <div key={idx} className="flex justify-between border-b pb-1">
                                <span>{v.orderNumber || v.invoiceNumber || v.noteNumber || v.returnNumber || v.id}</span>
                                <span className="font-mono">{v.totalAmount || v.netAmount || v.amount || "—"}</span>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-xs text-muted-foreground">No records found</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="excel-export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" />Excel / Data Export</CardTitle>
              <CardDescription>Export data from any module as JSON (CSV/Excel coming soon).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Module</Label>
                  <Select onValueChange={(v: any) => v && setExportModule(String(v))}><SelectTrigger><SelectValue placeholder="Select module" /></SelectTrigger>
                    <SelectContent>{EXPORT_MODULES.map((m) => <SelectItem key={m} value={m}>{m.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleExport} className="w-full" disabled={!exportModule}>
                    <Download className="mr-2 h-4 w-4" />Export Data
                  </Button>
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-4">
                {EXPORT_MODULES.map((m) => (
                  <Card key={m} className="cursor-pointer hover:border-primary transition-colors" onClick={() => { setExportModule(m); handleExport(); }}>
                    <CardContent className="p-3 text-center">
                      <Download className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs font-medium">{m.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
