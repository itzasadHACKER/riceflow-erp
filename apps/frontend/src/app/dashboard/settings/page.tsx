"use client";

import { useState } from "react";
import { Settings, Users, Bell, Shield, Megaphone, Palette } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { useApiList, useApiGet, useApiMutation } from "@/hooks/use-api";

interface User { id: string; email: string; firstName: string; lastName: string; isActive: boolean; isSuperadmin: boolean; }
interface Notification { id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string; }
interface Announcement { id: string; title: string; content: string; priority: string; createdAt: string; }
interface LicenseInfo { software: string; version: string; poweredBy: string; contact: string; copyright: string; }

const userColumns: Column<User>[] = [
  { key: "email", header: "Email" },
  { key: "firstName", header: "First Name" },
  { key: "lastName", header: "Last Name" },
  { key: "isSuperadmin", header: "Role", render: (item) => <Badge variant={item.isSuperadmin ? "default" : "secondary"}>{item.isSuperadmin ? "Admin" : "User"}</Badge> },
  { key: "isActive", header: "Status", render: (item) => <Badge variant={item.isActive ? "default" : "destructive"}>{item.isActive ? "Active" : "Inactive"}</Badge> },
];

const notifColumns: Column<Notification>[] = [
  { key: "title", header: "Title" },
  { key: "message", header: "Message" },
  { key: "type", header: "Type", render: (item) => <Badge variant="outline">{item.type}</Badge> },
  { key: "isRead", header: "Status", render: (item) => <Badge variant={item.isRead ? "secondary" : "default"}>{item.isRead ? "Read" : "Unread"}</Badge> },
  { key: "createdAt", header: "Date", render: (item) => new Date(item.createdAt).toLocaleDateString() },
];

const announcementColumns: Column<Announcement>[] = [
  { key: "title", header: "Title" },
  { key: "content", header: "Content" },
  { key: "priority", header: "Priority", render: (item) => <Badge variant={item.priority === "HIGH" ? "destructive" : item.priority === "MEDIUM" ? "default" : "secondary"}>{item.priority}</Badge> },
  { key: "createdAt", header: "Date", render: (item) => new Date(item.createdAt).toLocaleDateString() },
];

export default function SettingsPage() {
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [userForm, setUserForm] = useState({ email: "", firstName: "", lastName: "", password: "" });
  const [annForm, setAnnForm] = useState({ title: "", content: "", priority: "MEDIUM" });

  const { data: users = [], isLoading: usersLoading } = useApiList<User>(["users"], "/users");
  const { data: notifications = [], isLoading: notifLoading } = useApiList<Notification>(["notifications"], "/settings/notifications");
  const { data: announcements = [], isLoading: annLoading } = useApiList<Announcement>(["announcements"], "/announcements");
  const { data: license } = useApiGet<LicenseInfo>(["license"], "/settings/license");

  const createUserMutation = useApiMutation<User, typeof userForm>("/users", "post", [["users"]]);
  const createAnnMutation = useApiMutation<Announcement, typeof annForm>("/announcements", "post", [["announcements"]]);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings & Configuration" description="System settings, user management, notifications, and branding" />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general"><Settings className="mr-2 size-4" />General</TabsTrigger>
          <TabsTrigger value="users"><Users className="mr-2 size-4" />Users</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-2 size-4" />Notifications</TabsTrigger>
          <TabsTrigger value="announcements"><Megaphone className="mr-2 size-4" />Announcements</TabsTrigger>
          <TabsTrigger value="branding"><Palette className="mr-2 size-4" />Branding</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">License Information</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Software</span><span className="font-medium">{license?.software ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Version</span><span className="font-medium">{license?.version ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Powered By</span><span className="font-medium">{license?.poweredBy ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Contact</span><span className="font-medium">{license?.contact ?? "—"}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">System</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Architecture</span><span className="font-medium">Multi-Tenant SaaS</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Deployment</span><span className="font-medium">Web Application</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Database</span><span className="font-medium">PostgreSQL 16</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Cache</span><span className="font-medium">Redis 7</span></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Button onClick={() => setShowCreateUser(true)}>+ New User</Button>
          <DataTable columns={userColumns} data={users as unknown as User[]} isLoading={usersLoading} />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <DataTable columns={notifColumns} data={notifications as unknown as Notification[]} isLoading={notifLoading} emptyMessage="No notifications." />
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          <Button onClick={() => setShowCreateAnnouncement(true)}>+ New Announcement</Button>
          <DataTable columns={announcementColumns} data={announcements as unknown as Announcement[]} isLoading={annLoading} />
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Company Branding</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Company Logo</Label><Input type="file" accept="image/*" /><p className="text-xs text-muted-foreground">Upload company logo (PNG, JPG, max 2MB)</p></div>
              <div className="space-y-2"><Label>Company Letterhead</Label><Input type="file" accept="application/pdf" /><p className="text-xs text-muted-foreground">Upload letterhead PDF for invoices and reports</p></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <FormDialog open={showCreateUser} onOpenChange={setShowCreateUser} title="Add User" onSubmit={(e) => { e.preventDefault(); createUserMutation.mutate(userForm, { onSuccess: () => { setShowCreateUser(false); setUserForm({ email: "", firstName: "", lastName: "", password: "" }); } }); }} isLoading={createUserMutation.isPending}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>First Name</Label><Input value={userForm.firstName} onChange={(e) => setUserForm((p) => ({ ...p, firstName: e.target.value }))} required /></div>
          <div className="space-y-2"><Label>Last Name</Label><Input value={userForm.lastName} onChange={(e) => setUserForm((p) => ({ ...p, lastName: e.target.value }))} required /></div>
        </div>
        <div className="space-y-2"><Label>Email</Label><Input type="email" value={userForm.email} onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))} required /></div>
        <div className="space-y-2"><Label>Password</Label><Input type="password" value={userForm.password} onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))} required minLength={8} /></div>
      </FormDialog>

      <FormDialog open={showCreateAnnouncement} onOpenChange={setShowCreateAnnouncement} title="Create Announcement" onSubmit={(e) => { e.preventDefault(); createAnnMutation.mutate(annForm, { onSuccess: () => { setShowCreateAnnouncement(false); setAnnForm({ title: "", content: "", priority: "MEDIUM" }); } }); }} isLoading={createAnnMutation.isPending}>
        <div className="space-y-2"><Label>Title</Label><Input value={annForm.title} onChange={(e) => setAnnForm((p) => ({ ...p, title: e.target.value }))} required /></div>
        <div className="space-y-2"><Label>Content</Label><Input value={annForm.content} onChange={(e) => setAnnForm((p) => ({ ...p, content: e.target.value }))} required /></div>
        <div className="space-y-2"><Label>Priority</Label><select className="w-full rounded-md border px-3 py-2 text-sm" value={annForm.priority} onChange={(e) => setAnnForm((p) => ({ ...p, priority: e.target.value }))}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></div>
      </FormDialog>
    </div>
  );
}
