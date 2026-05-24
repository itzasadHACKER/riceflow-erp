"use client";

import { useState } from "react";
import { DoorOpen, ArrowUpFromDot, ArrowDownToDot, Users, Plus, CheckCircle, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { todayISO, formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface GatePass {
  id: string;
  gatePassNumber: string;
  type: string;
  status: string;
  date: string;
  vehicleNumber: string | null;
  driverName: string | null;
  outgoingCategory: string | null;
  incomingCategory: string | null;
  visitorName: string | null;
  visitorCompany: string | null;
  personToMeet: string | null;
  purpose: string | null;
  remarks: string | null;
}

const statusColors: Record<string, string> = {
  DRAFT: "",
  APPROVED: "bg-blue-600",
  CHECKED_OUT: "bg-amber-600",
  CHECKED_IN: "bg-teal-600",
  COMPLETED: "bg-emerald-600",
  CANCELLED: "bg-red-600",
};

const outgoingColumns: Column<GatePass>[] = [
  { key: "gatePassNumber", header: "GP #", render: (item) => <span className="font-mono font-medium text-primary">{item.gatePassNumber}</span> },
  { key: "outgoingCategory", header: "Category", render: (item) => <Badge variant="outline">{(item.outgoingCategory ?? "—").replace(/_/g, " ")}</Badge> },
  { key: "vehicleNumber", header: "Vehicle", render: (item) => item.vehicleNumber ?? "—" },
  { key: "driverName", header: "Driver", render: (item) => item.driverName ?? "—" },
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
  { key: "status", header: "Status", render: (item) => <Badge variant={item.status === "DRAFT" ? "secondary" : "default"} className={statusColors[item.status] ?? ""}>{item.status}</Badge> },
];

const incomingColumns: Column<GatePass>[] = [
  { key: "gatePassNumber", header: "GP #", render: (item) => <span className="font-mono font-medium text-primary">{item.gatePassNumber}</span> },
  { key: "incomingCategory", header: "Category", render: (item) => <Badge variant="outline">{(item.incomingCategory ?? "—").replace(/_/g, " ")}</Badge> },
  { key: "vehicleNumber", header: "Vehicle", render: (item) => item.vehicleNumber ?? "—" },
  { key: "driverName", header: "Driver", render: (item) => item.driverName ?? "—" },
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
  { key: "status", header: "Status", render: (item) => <Badge variant={item.status === "DRAFT" ? "secondary" : "default"} className={statusColors[item.status] ?? ""}>{item.status}</Badge> },
];

const visitorColumns: Column<GatePass>[] = [
  { key: "gatePassNumber", header: "GP #", render: (item) => <span className="font-mono font-medium text-primary">{item.gatePassNumber}</span> },
  { key: "visitorName", header: "Visitor", render: (item) => item.visitorName ?? "—" },
  { key: "visitorCompany", header: "Company", render: (item) => item.visitorCompany ?? "—" },
  { key: "personToMeet", header: "Person to Meet", render: (item) => item.personToMeet ?? "—" },
  { key: "purpose", header: "Purpose", render: (item) => <span className="max-w-[150px] truncate block">{item.purpose ?? "—"}</span> },
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
  { key: "status", header: "Status", render: (item) => <Badge variant={item.status === "DRAFT" ? "secondary" : "default"} className={statusColors[item.status] ?? ""}>{item.status}</Badge> },
];

const OUTGOING_CATEGORIES = ["RICE_SALE", "MACHINERY", "SAMPLES", "OFFICE_EQUIPMENT", "STATIONERY", "ELECTRICAL", "WASTE_DISPOSAL", "MISCELLANEOUS"];
const INCOMING_CATEGORIES = ["PADDY", "GROCERY", "MACHINERY", "STATIONERY", "ELECTRICAL_EQUIPMENT", "OFFICE_EQUIPMENT", "RAW_MATERIAL", "SPARE_PARTS", "FUEL", "MISCELLANEOUS"];

type GatePassType = "OUTGOING" | "INCOMING" | "VISITOR";

export default function GatePassPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState<GatePassType>("OUTGOING");
  const [form, setForm] = useState({
    vehicleNumber: "", driverName: "", driverPhone: "", remarks: "",
    outgoingCategory: "RICE_SALE", incomingCategory: "PADDY",
    visitorName: "", visitorPhone: "", visitorCompany: "", visitorEmail: "",
    visitorIdType: "", visitorIdNumber: "", personToMeet: "", department: "", purpose: "",
  });

  const { data: allPasses = [], isLoading } = useApiList<GatePass>(["gate-passes"], "/gate-pass");
  const createMutation = useApiMutation("/gate-pass", "post", [["gate-passes"]]);

  const outgoing = allPasses.filter((p) => p.type === "OUTGOING");
  const incoming = allPasses.filter((p) => p.type === "INCOMING");
  const visitors = allPasses.filter((p) => p.type === "VISITOR");
  const pending = allPasses.filter((p) => p.status === "DRAFT").length;
  const completed = allPasses.filter((p) => p.status === "COMPLETED").length;

  const handleCreate = (type: GatePassType) => {
    setCreateType(type);
    setShowCreate(true);
  };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { type: createType, date: new Date().toISOString() };

    if (createType === "OUTGOING") {
      payload.outgoingCategory = form.outgoingCategory;
      payload.vehicleNumber = form.vehicleNumber || undefined;
      payload.driverName = form.driverName || undefined;
    } else if (createType === "INCOMING") {
      payload.incomingCategory = form.incomingCategory;
      payload.vehicleNumber = form.vehicleNumber || undefined;
      payload.driverName = form.driverName || undefined;
    } else {
      payload.visitorName = form.visitorName;
      payload.visitorPhone = form.visitorPhone || undefined;
      payload.visitorCompany = form.visitorCompany || undefined;
      payload.visitorEmail = form.visitorEmail || undefined;
      payload.visitorIdType = form.visitorIdType || undefined;
      payload.visitorIdNumber = form.visitorIdNumber || undefined;
      payload.personToMeet = form.personToMeet || undefined;
      payload.department = form.department || undefined;
      payload.purpose = form.purpose || undefined;
    }
    payload.remarks = form.remarks || undefined;

    createMutation.mutate(payload as never, {
      onSuccess: () => {
        setShowCreate(false);
        toast.success(`${createType} gate pass created`);
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Gate Pass" description="Manage outgoing, incoming, and visitor gate passes" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Passes" value={allPasses.length} icon={DoorOpen} />
        <StatCard title="Outgoing" value={outgoing.length} icon={ArrowUpFromDot} description="Rice, machinery, samples" />
        <StatCard title="Incoming" value={incoming.length} icon={ArrowDownToDot} description="Paddy, grocery, equipment" />
        <StatCard title="Visitors" value={visitors.length} icon={Users} description={`${pending} pending, ${completed} completed`} />
      </div>

      <Tabs defaultValue="outgoing">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="outgoing" className="gap-1.5"><ArrowUpFromDot className="size-3.5" />Outgoing ({outgoing.length})</TabsTrigger>
          <TabsTrigger value="incoming" className="gap-1.5"><ArrowDownToDot className="size-3.5" />Incoming ({incoming.length})</TabsTrigger>
          <TabsTrigger value="visitors" className="gap-1.5"><Users className="size-3.5" />Visitors ({visitors.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="outgoing" className="space-y-4 mt-4">
          <DataTable
            columns={outgoingColumns}
            data={outgoing}
            isLoading={isLoading}
            emptyMessage="No outgoing gate passes."
            searchPlaceholder="Search outgoing..."
            actions={<Button size="sm" className="gap-1.5" onClick={() => handleCreate("OUTGOING")}><Plus className="size-3.5" />New Outgoing</Button>}
          />
        </TabsContent>

        <TabsContent value="incoming" className="space-y-4 mt-4">
          <DataTable
            columns={incomingColumns}
            data={incoming}
            isLoading={isLoading}
            emptyMessage="No incoming gate passes."
            searchPlaceholder="Search incoming..."
            actions={<Button size="sm" className="gap-1.5" onClick={() => handleCreate("INCOMING")}><Plus className="size-3.5" />New Incoming</Button>}
          />
        </TabsContent>

        <TabsContent value="visitors" className="space-y-4 mt-4">
          <DataTable
            columns={visitorColumns}
            data={visitors}
            isLoading={isLoading}
            emptyMessage="No visitor gate passes."
            searchPlaceholder="Search visitors..."
            actions={<Button size="sm" className="gap-1.5" onClick={() => handleCreate("VISITOR")}><Plus className="size-3.5" />New Visitor</Button>}
          />
        </TabsContent>
      </Tabs>

      <FormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        title={`New ${createType.charAt(0) + createType.slice(1).toLowerCase()} Gate Pass`}
        onSubmit={submitForm}
        isLoading={createMutation.isPending}
      >
        {createType !== "VISITOR" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Category</Label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={createType === "OUTGOING" ? form.outgoingCategory : form.incomingCategory}
                onChange={(e) => setForm((p) => createType === "OUTGOING" ? { ...p, outgoingCategory: e.target.value } : { ...p, incomingCategory: e.target.value })}
              >
                {(createType === "OUTGOING" ? OUTGOING_CATEGORIES : INCOMING_CATEGORIES).map((c) => (
                  <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Vehicle #</Label>
              <Input value={form.vehicleNumber} onChange={(e) => setForm((p) => ({ ...p, vehicleNumber: e.target.value }))} placeholder="e.g. ABC-1234" />
            </div>
          </div>
        )}

        {createType !== "VISITOR" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Driver Name</Label>
              <Input value={form.driverName} onChange={(e) => setForm((p) => ({ ...p, driverName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Driver Phone</Label>
              <Input value={form.driverPhone} onChange={(e) => setForm((p) => ({ ...p, driverPhone: e.target.value }))} />
            </div>
          </div>
        )}

        {createType === "VISITOR" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider">Visitor Name</Label>
                <Input value={form.visitorName} onChange={(e) => setForm((p) => ({ ...p, visitorName: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider">Phone</Label>
                <Input value={form.visitorPhone} onChange={(e) => setForm((p) => ({ ...p, visitorPhone: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider">Company / Organization</Label>
                <Input value={form.visitorCompany} onChange={(e) => setForm((p) => ({ ...p, visitorCompany: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider">Email</Label>
                <Input value={form.visitorEmail} onChange={(e) => setForm((p) => ({ ...p, visitorEmail: e.target.value }))} type="email" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider">ID Type</Label>
                <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.visitorIdType} onChange={(e) => setForm((p) => ({ ...p, visitorIdType: e.target.value }))}>
                  <option value="">Select</option>
                  <option value="CNIC">CNIC</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="DRIVING_LICENSE">Driving License</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider">ID Number</Label>
                <Input value={form.visitorIdNumber} onChange={(e) => setForm((p) => ({ ...p, visitorIdNumber: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider">Person to Meet</Label>
                <Input value={form.personToMeet} onChange={(e) => setForm((p) => ({ ...p, personToMeet: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider">Department</Label>
                <Input value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Purpose of Visit</Label>
              <Input value={form.purpose} onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))} />
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider">Remarks</Label>
          <Input value={form.remarks} onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))} />
        </div>
      </FormDialog>
    </div>
  );
}
