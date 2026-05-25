"use client";

import { useState } from "react";
import { Mail, Send, Inbox, Settings, Plus, Paperclip, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface EmailMessage { id: string; subject: string; from: string; to: string; date: string; isRead: boolean; isStarred: boolean; folder: string; preview: string; }
interface EmailConfig { id: string; type: string; host: string; port: number; username: string; isActive: boolean; }

const inboxColumns: Column<EmailMessage>[] = [
  { key: "from", header: "From", render: (item) => <span className={item.isRead ? "text-muted-foreground" : "font-semibold"}>{item.from}</span> },
  { key: "subject", header: "Subject", render: (item) => <span className={`${item.isRead ? "" : "font-semibold"} max-w-[300px] truncate block`}>{item.subject}</span> },
  { key: "preview", header: "Preview", render: (item) => <span className="text-muted-foreground max-w-[200px] truncate block text-xs">{item.preview}</span> },
  { key: "date", header: "Date", render: (item) => <span className="text-xs">{formatDate(item.date)}</span> },
  { key: "isStarred", header: "", render: (item) => item.isStarred ? <Star className="size-3.5 fill-amber-400 text-amber-400" /> : null },
];

const sentColumns: Column<EmailMessage>[] = [
  { key: "to", header: "To" },
  { key: "subject", header: "Subject", render: (item) => <span className="max-w-[300px] truncate block">{item.subject}</span> },
  { key: "date", header: "Date", render: (item) => <span className="text-xs">{formatDate(item.date)}</span> },
];

const configColumns: Column<EmailConfig>[] = [
  { key: "type", header: "Type", render: (item) => <Badge variant="outline">{item.type}</Badge> },
  { key: "host", header: "Host", render: (item) => <span className="font-mono text-sm">{item.host}</span> },
  { key: "port", header: "Port", render: (item) => <span className="font-mono">{item.port}</span> },
  { key: "username", header: "Username" },
  { key: "isActive", header: "Status", render: (item) => <Badge variant={item.isActive ? "default" : "secondary"} className={item.isActive ? "bg-emerald-600" : ""}>{item.isActive ? "Active" : "Inactive"}</Badge> },
];

export default function EmailPage() {
  const [showCompose, setShowCompose] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [composeForm, setComposeForm] = useState({ to: "", subject: "", body: "" });
  const [configForm, setConfigForm] = useState({ type: "SMTP", host: "", port: 587, username: "", password: "" });

  const { data: inbox = [], isLoading: inLoading } = useApiList<EmailMessage>(["email-inbox"], "/email/inbox");
  const { data: sent = [], isLoading: sentLoading } = useApiList<EmailMessage>(["email-sent"], "/email/sent");
  const { data: configs = [], isLoading: cfgLoading } = useApiList<EmailConfig>(["email-configs"], "/email/configs");
  const sendMutation = useApiMutation("/email/send", "post", [["email-sent"]]);
  const configMutation = useApiMutation("/email/configs", "post", [["email-configs"]]);

  const unread = inbox.filter((m) => !m.isRead).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Email & Communication" description="Outlook-style email system with SMTP/IMAP server integration" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Inbox" value={inbox.length} icon={Inbox} description={`${unread} unread`} />
        <StatCard title="Sent" value={sent.length} icon={Send} />
        <StatCard title="Servers" value={configs.length} icon={Settings} description={`${configs.filter((c) => c.isActive).length} active`} />
        <StatCard title="Starred" value={inbox.filter((m) => m.isStarred).length} icon={Star} />
      </div>

      <Tabs defaultValue="inbox">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="inbox" className="gap-1.5"><Inbox className="size-3.5" />Inbox{unread > 0 && ` (${unread})`}</TabsTrigger>
          <TabsTrigger value="sent" className="gap-1.5"><Send className="size-3.5" />Sent</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5"><Settings className="size-3.5" />Server Config</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-4 mt-4">
          <DataTable columns={inboxColumns} data={inbox as unknown as EmailMessage[]} isLoading={inLoading} emptyMessage="Inbox is empty. Configure your email server to start receiving emails." searchPlaceholder="Search inbox..."
            actions={<Button size="sm" className="gap-1.5" onClick={() => setShowCompose(true)}><Plus className="size-3.5" />Compose</Button>} />
        </TabsContent>

        <TabsContent value="sent" className="space-y-4 mt-4">
          <DataTable columns={sentColumns} data={sent as unknown as EmailMessage[]} isLoading={sentLoading} emptyMessage="No sent emails." searchPlaceholder="Search sent..." />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-4">
          <DataTable columns={configColumns} data={configs as unknown as EmailConfig[]} isLoading={cfgLoading} emptyMessage="No email servers configured." searchPlaceholder="Search..."
            actions={<Button size="sm" className="gap-1.5" onClick={() => setShowConfig(true)}><Plus className="size-3.5" />Add Server</Button>} />
        </TabsContent>
      </Tabs>

      <FormDialog open={showCompose} onOpenChange={setShowCompose} title="Compose Email" submitLabel="Send"
        onSubmit={(e) => { e.preventDefault(); sendMutation.mutate(composeForm as never, { onSuccess: () => { setShowCompose(false); toast.success("Email sent"); } }); }}
        isLoading={sendMutation.isPending}>
        <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">To</Label><Input value={composeForm.to} onChange={(e) => setComposeForm((p) => ({ ...p, to: e.target.value }))} required placeholder="recipient@example.com" type="email" /></div>
        <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Subject</Label><Input value={composeForm.subject} onChange={(e) => setComposeForm((p) => ({ ...p, subject: e.target.value }))} required /></div>
        <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Body</Label>
          <textarea className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[200px]" value={composeForm.body} onChange={(e) => setComposeForm((p) => ({ ...p, body: e.target.value }))} required />
        </div>
      </FormDialog>

      <FormDialog open={showConfig} onOpenChange={setShowConfig} title="Add Email Server"
        onSubmit={(e) => { e.preventDefault(); configMutation.mutate(configForm as never, { onSuccess: () => { setShowConfig(false); toast.success("Server configured"); } }); }}
        isLoading={configMutation.isPending}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Server Type</Label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={configForm.type} onChange={(e) => setConfigForm((p) => ({ ...p, type: e.target.value }))}>
              <option value="SMTP">SMTP (Outgoing)</option><option value="IMAP">IMAP (Incoming)</option><option value="POP3">POP3 (Incoming)</option>
            </select>
          </div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Host</Label><Input value={configForm.host} onChange={(e) => setConfigForm((p) => ({ ...p, host: e.target.value }))} required placeholder="smtp.gmail.com" className="font-mono" /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Port</Label><Input type="number" value={configForm.port} onChange={(e) => setConfigForm((p) => ({ ...p, port: Number(e.target.value) }))} required className="font-mono" /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Username</Label><Input value={configForm.username} onChange={(e) => setConfigForm((p) => ({ ...p, username: e.target.value }))} required /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Password</Label><Input type="password" value={configForm.password} onChange={(e) => setConfigForm((p) => ({ ...p, password: e.target.value }))} required /></div>
        </div>
      </FormDialog>
    </div>
  );
}
