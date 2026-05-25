"use client";

import { useState } from "react";
import { FileText, Search, Archive, Plus, Upload, FolderOpen, Calendar } from "lucide-react";
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

interface Document { id: string; title: string; type: string; category: string; version: number; uploadedBy: string; createdAt: string; isArchived: boolean; description: string; tags: string[]; }
interface Contract { id: string; title: string; partyName: string; startDate: string; endDate: string; value: string; status: string; }

const docColumns: Column<Document>[] = [
  { key: "title", header: "Title" },
  { key: "type", header: "Type", render: (item) => <Badge variant="outline">{item.type}</Badge> },
  { key: "category", header: "Category" },
  { key: "version", header: "Version", className: "text-right", render: (item) => <span className="font-mono">v{item.version}</span> },
  { key: "uploadedBy", header: "Uploaded By" },
  { key: "createdAt", header: "Date", render: (item) => formatDate(item.createdAt) },
  { key: "isArchived", header: "Status", render: (item) => <Badge variant={item.isArchived ? "secondary" : "default"} className={item.isArchived ? "" : "bg-emerald-600"}>{item.isArchived ? "Archived" : "Active"}</Badge> },
];

const contractColumns: Column<Contract>[] = [
  { key: "title", header: "Contract" },
  { key: "partyName", header: "Party" },
  { key: "startDate", header: "Start", render: (item) => formatDate(item.startDate) },
  { key: "endDate", header: "End", render: (item) => formatDate(item.endDate) },
  { key: "value", header: "Value", className: "text-right", render: (item) => <span className="font-mono font-semibold">₨ {Number(item.value || 0).toLocaleString("en-PK")}</span> },
  {
    key: "status", header: "Status", render: (item) => {
      const c: Record<string, string> = { ACTIVE: "bg-emerald-600", EXPIRED: "bg-red-600", DRAFT: "" };
      return <Badge variant={item.status === "DRAFT" ? "secondary" : "default"} className={c[item.status] ?? ""}>{item.status}</Badge>;
    },
  },
];

const DOC_TYPES = ["DOCUMENT", "CONTRACT", "CERTIFICATE", "LICENSE", "REPORT", "POLICY", "MANUAL"];

export default function DocumentsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", type: "DOCUMENT", category: "", description: "" });

  const { data: docs = [], isLoading } = useApiList<Document>(["documents"], "/documents");
  const { data: contracts = [], isLoading: cLoading } = useApiList<Contract>(["contracts"], "/documents/contracts");
  const createMutation = useApiMutation("/documents", "post", [["documents"]]);

  return (
    <div className="space-y-6">
      <PageHeader title="Document Management" description="Digital documents, contracts, version control, and search" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Documents" value={docs.length} icon={FileText} />
        <StatCard title="Active" value={docs.filter((d) => !d.isArchived).length} icon={FolderOpen} />
        <StatCard title="Archived" value={docs.filter((d) => d.isArchived).length} icon={Archive} />
        <StatCard title="Contracts" value={contracts.length} icon={Calendar} />
      </div>

      <Tabs defaultValue="documents">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="documents" className="gap-1.5"><FileText className="size-3.5" />Documents</TabsTrigger>
          <TabsTrigger value="contracts" className="gap-1.5"><Calendar className="size-3.5" />Contracts</TabsTrigger>
        </TabsList>
        <TabsContent value="documents" className="space-y-4 mt-4">
          <DataTable columns={docColumns} data={docs as unknown as Document[]} isLoading={isLoading} emptyMessage="No documents uploaded." searchPlaceholder="Search documents..."
            actions={<Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}><Plus className="size-3.5" />Upload Document</Button>} />
        </TabsContent>
        <TabsContent value="contracts" className="space-y-4 mt-4">
          <DataTable columns={contractColumns} data={contracts as unknown as Contract[]} isLoading={cLoading} emptyMessage="No contracts." searchPlaceholder="Search contracts..." />
        </TabsContent>
      </Tabs>

      <FormDialog open={showCreate} onOpenChange={setShowCreate} title="Upload Document"
        onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form as never, { onSuccess: () => { setShowCreate(false); toast.success("Document uploaded"); } }); }}
        isLoading={createMutation.isPending}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Title</Label><Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Type</Label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
              {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Category</Label><Input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="e.g. Finance, HR, Legal" /></div>
        <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Description</Label><Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></div>
      </FormDialog>
    </div>
  );
}
