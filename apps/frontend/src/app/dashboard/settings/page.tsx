"use client";

import { useState } from "react";
import { Settings, Bell, Shield, Upload, FileText, Globe, Palette, Hash, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface SystemSetting { id: string; key: string; value: string; group: string; description: string; }
interface Notification { id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string; }
interface AuditLog { id: string; action: string; entityType: string; entityId: string; userId: string; userName: string; createdAt: string; }

const settingColumns: Column<SystemSetting>[] = [
  { key: "key", header: "Setting", render: (item) => <span className="font-mono text-primary">{item.key}</span> },
  { key: "value", header: "Value", render: (item) => <span className="font-mono">{item.value}</span> },
  { key: "group", header: "Group", render: (item) => <Badge variant="outline">{item.group}</Badge> },
  { key: "description", header: "Description", render: (item) => <span className="text-muted-foreground max-w-[200px] truncate block">{item.description ?? "—"}</span> },
];

const notifColumns: Column<Notification>[] = [
  { key: "title", header: "Title" },
  { key: "type", header: "Type", render: (item) => <Badge variant="outline">{item.type}</Badge> },
  { key: "message", header: "Message", render: (item) => <span className="max-w-[300px] truncate block">{item.message}</span> },
  { key: "isRead", header: "Status", render: (item) => <Badge variant={item.isRead ? "secondary" : "default"} className={item.isRead ? "" : "bg-blue-600"}>{item.isRead ? "Read" : "Unread"}</Badge> },
  { key: "createdAt", header: "Date", render: (item) => formatDate(item.createdAt) },
];

const auditColumns: Column<AuditLog>[] = [
  { key: "action", header: "Action", render: (item) => <Badge variant="outline">{item.action}</Badge> },
  { key: "entityType", header: "Entity" },
  { key: "userName", header: "User", render: (item) => item.userName ?? "System" },
  { key: "createdAt", header: "Date", render: (item) => formatDate(item.createdAt) },
];

export default function SettingsPage() {
  const { data: settings = [], isLoading: sLoading } = useApiList<SystemSetting>(["settings"], "/settings");
  const { data: notifications = [], isLoading: nLoading } = useApiList<Notification>(["notifications"], "/settings/notifications");
  const { data: auditLogs = [], isLoading: aLoading } = useApiList<AuditLog>(["audit-logs"], "/settings/audit-logs");

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings & Configuration" description="System settings, notifications, audit logs, branding, and customization" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Settings" value={settings.length} icon={Settings} />
        <StatCard title="Notifications" value={notifications.length} icon={Bell} description={`${unreadCount} unread`} />
        <StatCard title="Audit Logs" value={auditLogs.length} icon={Shield} />
        <StatCard title="Integrations" value="6" icon={Globe} description="Available" />
      </div>

      <Tabs defaultValue="settings">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="settings" className="gap-1.5"><Settings className="size-3.5" />Settings</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5"><Bell className="size-3.5" />Notifications{unreadCount > 0 && ` (${unreadCount})`}</TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5"><Shield className="size-3.5" />Audit</TabsTrigger>
          <TabsTrigger value="branding" className="gap-1.5"><Palette className="size-3.5" />Branding</TabsTrigger>
          <TabsTrigger value="numbering" className="gap-1.5"><Hash className="size-3.5" />Numbering</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4 mt-4">
          <DataTable columns={settingColumns} data={settings as unknown as SystemSetting[]} isLoading={sLoading} emptyMessage="No settings configured. Run seed to initialize defaults." searchPlaceholder="Search settings..." />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 mt-4">
          <DataTable columns={notifColumns} data={notifications as unknown as Notification[]} isLoading={nLoading} emptyMessage="No notifications." searchPlaceholder="Search notifications..." />
        </TabsContent>

        <TabsContent value="audit" className="space-y-4 mt-4">
          <DataTable columns={auditColumns} data={auditLogs as unknown as AuditLog[]} isLoading={aLoading} emptyMessage="No audit logs." searchPlaceholder="Search audit logs..." />
        </TabsContent>

        <TabsContent value="branding" className="space-y-4 mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Company Branding</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Company Logo</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                    <Upload className="size-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Click to upload or drag and drop</p>
                    <p className="text-xs">PNG, JPG, SVG up to 5MB</p>
                  </div>
                </div>
                <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Letterhead PDF</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                    <FileText className="size-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Upload company letterhead PDF</p>
                    <p className="text-xs">Used for invoices, receipts, and official documents</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Print Templates</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {["Invoice", "Sales Receipt", "Purchase Order", "Delivery Challan", "Payment Voucher", "Experience Letter", "Salary Slip", "Gate Pass"].map((t) => (
                  <div key={t} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm">{t}</span>
                    <Badge variant="outline">Default</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="numbering" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Auto-Numbering Series</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "Invoice", prefix: "INV", next: "0001" },
                  { label: "Sales Order", prefix: "SO", next: "0001" },
                  { label: "Purchase Order", prefix: "PO", next: "0001" },
                  { label: "Journal Entry", prefix: "JE", next: "0001" },
                  { label: "Gate Pass", prefix: "GP", next: "0001" },
                  { label: "BOM", prefix: "BOM", next: "0001" },
                  { label: "Delivery Challan", prefix: "DC", next: "0001" },
                  { label: "Payment Voucher", prefix: "PV", next: "0001" },
                  { label: "Receipt Voucher", prefix: "RV", next: "0001" },
                  { label: "Expense Claim", prefix: "EXP", next: "0001" },
                  { label: "Inspection", prefix: "QC", next: "0001" },
                  { label: "Export Contract", prefix: "EXC", next: "0001" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between py-2 px-3 rounded-md border">
                    <span className="text-sm">{s.label}</span>
                    <span className="font-mono text-primary font-medium">{s.prefix}-{s.next}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-center text-xs text-muted-foreground pt-4 border-t">
        <span className="font-medium">Grainix ERP</span> &mdash; Powered by Asad Ali (0308-4420406) &mdash; All rights reserved.
      </div>
    </div>
  );
}
