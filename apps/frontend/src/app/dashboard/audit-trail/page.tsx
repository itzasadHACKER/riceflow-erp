"use client";

import { useState } from "react";
import { Shield, Search, User, Clock, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList } from "@/hooks/use-api";
import { formatDate } from "@/lib/utils/numbering";

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userName: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string;
  createdAt: string;
}

const actionColors: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
  LOGIN: "bg-purple-100 text-purple-800",
  LOGOUT: "bg-gray-100 text-gray-800",
  APPROVE: "bg-emerald-100 text-emerald-800",
  REJECT: "bg-orange-100 text-orange-800",
  POST: "bg-indigo-100 text-indigo-800",
};

const auditColumns: Column<AuditEntry>[] = [
  {
    key: "createdAt",
    header: "Timestamp",
    render: (item) => (
      <div className="text-xs">
        <div className="font-medium">{formatDate(item.createdAt)}</div>
      </div>
    ),
  },
  {
    key: "action",
    header: "Action",
    render: (item) => (
      <Badge className={actionColors[item.action] || "bg-gray-100 text-gray-800"}>
        {item.action}
      </Badge>
    ),
  },
  {
    key: "entityType",
    header: "Entity",
    render: (item) => (
      <div>
        <div className="font-medium">{item.entityType}</div>
        <div className="text-xs text-muted-foreground font-mono">{item.entityId?.slice(0, 8)}...</div>
      </div>
    ),
  },
  {
    key: "userName",
    header: "User",
    render: (item) => (
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-3 w-3 text-primary" />
        </div>
        <span>{item.userName || "System"}</span>
      </div>
    ),
  },
  {
    key: "oldValues",
    header: "Changes",
    render: (item) => {
      if (!item.oldValues && !item.newValues) return <span className="text-muted-foreground">—</span>;
      const changes = item.newValues ? Object.keys(item.newValues) : [];
      return (
        <div className="text-xs">
          {changes.slice(0, 3).map((key) => (
            <div key={key} className="flex gap-1">
              <span className="font-medium text-muted-foreground">{key}:</span>
              {item.oldValues && key in item.oldValues && (
                <span className="line-through text-red-500">{String((item.oldValues as Record<string, unknown>)[key])}</span>
              )}
              <span className="text-green-600">→ {String((item.newValues as Record<string, unknown>)[key])}</span>
            </div>
          ))}
          {changes.length > 3 && <span className="text-muted-foreground">+{changes.length - 3} more</span>}
        </div>
      );
    },
  },
];

export default function AuditTrailPage() {
  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const { data: auditLogs = [], isLoading } = useApiList<AuditEntry>(
    ["audit-trail", entityFilter, actionFilter],
    `/accounting-engine/audit-trail${entityFilter ? `?entityType=${entityFilter}` : ""}${actionFilter ? `${entityFilter ? "&" : "?"}action=${actionFilter}` : ""}`,
  );

  const createCount = auditLogs.filter((l) => l.action === "CREATE").length;
  const updateCount = auditLogs.filter((l) => l.action === "UPDATE").length;
  const deleteCount = auditLogs.filter((l) => l.action === "DELETE").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Trail" description="Track who changed what, when, and the old/new values for every record" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Actions" value={auditLogs.length} icon={Shield} />
        <StatCard title="Creates" value={createCount} icon={Shield} description="New records" />
        <StatCard title="Updates" value={updateCount} icon={Shield} description="Modified records" />
        <StatCard title="Deletes" value={deleteCount} icon={Shield} description="Removed records" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Entity Type</Label>
              <Input
                placeholder="e.g. JournalEntry, Customer..."
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
              />
            </div>
            <div>
              <Label>Action</Label>
              <Input
                placeholder="e.g. CREATE, UPDATE, DELETE..."
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => { setEntityFilter(""); setActionFilter(""); }}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={auditColumns} data={auditLogs} isLoading={isLoading} searchable searchPlaceholder="Search audit logs..." />
        </CardContent>
      </Card>
    </div>
  );
}
