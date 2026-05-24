"use client";

import { useState } from "react";
import { Megaphone, Plus, Pin, Clock, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { formatDate, todayISO } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface Announcement { id: string; title: string; content: string; priority: string; isActive: boolean; isPinned: boolean; createdAt: string; expiresAt: string | null; createdByName: string; }

export default function AnnouncementsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", priority: "NORMAL", isPinned: false, expiresAt: "" });

  const { data: announcements = [], isLoading } = useApiList<Announcement>(["announcements"], "/announcements");
  const createMutation = useApiMutation("/announcements", "post", [["announcements"]]);

  const active = announcements.filter((a) => a.isActive);
  const pinned = announcements.filter((a) => a.isPinned);

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" description="Official company announcements and notifications" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total" value={announcements.length} icon={Megaphone} />
        <StatCard title="Active" value={active.length} icon={CheckCircle} />
        <StatCard title="Pinned" value={pinned.length} icon={Pin} />
        <StatCard title="Expired" value={announcements.length - active.length} icon={Clock} />
      </div>

      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}><Plus className="size-3.5" />New Announcement</Button>
      </div>

      <div className="grid gap-4">
        {announcements.length === 0 && !isLoading && (
          <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">No announcements yet. Create your first announcement.</CardContent></Card>
        )}
        {(announcements as Announcement[]).map((a) => (
          <Card key={a.id} className={`transition-all ${a.isPinned ? "border-primary/30 shadow-sm" : ""}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {a.isPinned && <Pin className="size-3.5 text-primary" />}
                  <CardTitle className="text-base">{a.title}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={a.priority === "HIGH" ? "destructive" : a.priority === "URGENT" ? "destructive" : "outline"} className={a.priority === "URGENT" ? "bg-red-600" : a.priority === "HIGH" ? "bg-amber-600" : ""}>{a.priority}</Badge>
                  <Badge variant={a.isActive ? "default" : "secondary"} className={a.isActive ? "bg-emerald-600" : ""}>{a.isActive ? "Active" : "Expired"}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.content}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span>By {a.createdByName ?? "Admin"}</span>
                <span>·</span>
                <span>{formatDate(a.createdAt)}</span>
                {a.expiresAt && <><span>·</span><span>Expires: {formatDate(a.expiresAt)}</span></>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <FormDialog open={showCreate} onOpenChange={setShowCreate} title="New Announcement"
        onSubmit={(e) => {
          e.preventDefault();
          const payload = { ...form, expiresAt: form.expiresAt || undefined };
          createMutation.mutate(payload as never, { onSuccess: () => { setShowCreate(false); toast.success("Announcement published"); } });
        }}
        isLoading={createMutation.isPending}>
        <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Title</Label><Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required placeholder="Announcement title" /></div>
        <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Content</Label>
          <textarea className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[120px]" value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} required placeholder="Write your announcement..." />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Priority</Label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
              <option value="LOW">Low</option><option value="NORMAL">Normal</option><option value="HIGH">High</option><option value="URGENT">Urgent</option>
            </select>
          </div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Expires</Label><Input type="date" value={form.expiresAt} onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))} /></div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPinned} onChange={(e) => setForm((p) => ({ ...p, isPinned: e.target.checked }))} />Pin to top</label>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
