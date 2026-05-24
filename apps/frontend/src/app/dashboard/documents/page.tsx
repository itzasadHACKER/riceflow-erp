"use client";

import { FileText, Search, Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList } from "@/hooks/use-api";
import { formatDate } from "@/lib/utils/numbering";

interface Document { id: string; title: string; type: string; category: string; version: number; uploadedBy: string; createdAt: string; isArchived: boolean; }

const docColumns: Column<Document>[] = [
  { key: "title", header: "Title" },
  { key: "type", header: "Type", render: (item) => <Badge variant="outline">{item.type}</Badge> },
  { key: "category", header: "Category" },
  { key: "version", header: "Version", className: "text-right", render: (item) => <span className="font-mono">v{item.version}</span> },
  { key: "uploadedBy", header: "Uploaded By" },
  { key: "createdAt", header: "Date", render: (item) => formatDate(item.createdAt) },
  { key: "isArchived", header: "Status", render: (item) => <Badge variant={item.isArchived ? "secondary" : "default"} className={item.isArchived ? "" : "bg-emerald-600"}>{item.isArchived ? "Archived" : "Active"}</Badge> },
];

export default function DocumentsPage() {
  const { data: docs = [], isLoading } = useApiList<Document>(["documents"], "/documents");

  return (
    <div className="space-y-6">
      <PageHeader title="Document Management" description="Digital documents, contracts, version control, and search" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Documents" value={docs.length} icon={FileText} />
        <StatCard title="Active" value={docs.filter((d) => !d.isArchived).length} icon={Search} />
        <StatCard title="Archived" value={docs.filter((d) => d.isArchived).length} icon={Archive} />
      </div>
      <DataTable columns={docColumns} data={docs as unknown as Document[]} isLoading={isLoading} emptyMessage="No documents uploaded." searchPlaceholder="Search documents..." />
    </div>
  );
}
