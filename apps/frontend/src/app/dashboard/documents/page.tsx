"use client";

import { FileText, FolderOpen, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList } from "@/hooks/use-api";

interface Document { id: string; title: string; category: string; fileType: string; version: number; status: string; createdAt: string; }

const docColumns: Column<Document>[] = [
  { key: "title", header: "Title" },
  { key: "category", header: "Category", render: (item) => <Badge variant="outline">{item.category}</Badge> },
  { key: "fileType", header: "Type" },
  { key: "version", header: "Version", render: (item) => `v${item.version}` },
  { key: "status", header: "Status", render: (item) => <Badge variant={item.status === "ACTIVE" ? "default" : "secondary"}>{item.status}</Badge> },
  { key: "createdAt", header: "Uploaded", render: (item) => new Date(item.createdAt).toLocaleDateString() },
];

export default function DocumentsPage() {
  const { data: documents = [], isLoading } = useApiList<Document>(["documents"], "/documents");

  return (
    <div className="space-y-6">
      <PageHeader title="Document Management" description="Documents, contracts, version control, and archiving" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Documents" value={documents.length} icon={FileText} />
        <StatCard title="Categories" value="—" icon={FolderOpen} />
        <StatCard title="Expiring" value="—" icon={Clock} />
      </div>

      <DataTable columns={docColumns} data={documents as unknown as Document[]} isLoading={isLoading} emptyMessage="No documents uploaded." />
    </div>
  );
}
