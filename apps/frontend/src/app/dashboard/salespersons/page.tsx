"use client";

import { useState } from "react";
import { UserCheck, TrendingUp, Target, Award, Plus, BarChart3, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { todayISO, formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface Salesperson {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  territory: string | null;
  status: string;
  commissionRate: number;
  targetMonthly: number;
  targetYearly: number;
  joiningDate: string;
  _count?: { salesTransactions: number };
  partyAssignments: { id: string; customerId: string }[];
}

interface TeamReport {
  salespersons: {
    id: string;
    name: string;
    code: string;
    territory: string | null;
    totalAmount: number;
    totalWeight: number;
    totalQuantity: number;
    totalCommission: number;
    transactionCount: number;
    targetMonthly: number;
    achievement: number;
  }[];
}

const spColumns: Column<Salesperson>[] = [
  { key: "code", header: "Code", render: (item) => <span className="font-mono font-medium text-primary">{item.code}</span> },
  { key: "name", header: "Name" },
  { key: "phone", header: "Phone", render: (item) => item.phone ?? "—" },
  { key: "territory", header: "Territory", render: (item) => item.territory ? <Badge variant="outline">{item.territory}</Badge> : "—" },
  { key: "commissionRate", header: "Commission %", render: (item) => <span className="font-mono">{Number(item.commissionRate)}%</span> },
  { key: "partyAssignments", header: "Parties", render: (item) => <Badge variant="secondary">{item.partyAssignments?.length ?? 0}</Badge> },
  {
    key: "status",
    header: "Status",
    render: (item) => {
      const c: Record<string, string> = { ACTIVE: "bg-emerald-600", INACTIVE: "", ON_LEAVE: "bg-amber-600" };
      return <Badge variant={item.status === "INACTIVE" ? "secondary" : "default"} className={c[item.status] ?? ""}>{item.status}</Badge>;
    },
  },
];

export default function SalespersonsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [reportPeriod, setReportPeriod] = useState("mtd");
  const [form, setForm] = useState({
    name: "", phone: "", email: "", territory: "", joiningDate: todayISO(),
    commissionRate: 0, targetMonthly: 0, targetYearly: 0,
  });

  const { data: salespersons = [], isLoading } = useApiList<Salesperson>(["salespersons"], "/salespersons");
  const { data: teamReport } = useApiList<TeamReport>(["team-report", reportPeriod], `/salespersons/team-report?period=${reportPeriod}`);
  const createMutation = useApiMutation("/salespersons", "post", [["salespersons"]]);

  const activeSPs = salespersons.filter((s) => s.status === "ACTIVE");
  const totalParties = salespersons.reduce((s, sp) => s + (sp.partyAssignments?.length ?? 0), 0);
  const teamData = (teamReport as unknown as TeamReport)?.salespersons ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Salespersons" description="Manage sales team, party assignments, and performance reports" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Salespersons" value={salespersons.length} icon={UserCheck} description={`${activeSPs.length} active`} />
        <StatCard title="Assigned Parties" value={totalParties} icon={Target} />
        <StatCard title="Avg Commission" value={activeSPs.length > 0 ? `${(activeSPs.reduce((s, sp) => s + Number(sp.commissionRate), 0) / activeSPs.length).toFixed(1)}%` : "—"} icon={Award} />
        <StatCard title="Territories" value={new Set(salespersons.filter((s) => s.territory).map((s) => s.territory)).size} icon={TrendingUp} />
      </div>

      <Tabs defaultValue="list">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="list" className="gap-1.5"><UserCheck className="size-3.5" />Salespersons</TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5"><BarChart3 className="size-3.5" />Sales Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4 mt-4">
          <DataTable
            columns={spColumns}
            data={salespersons}
            isLoading={isLoading}
            emptyMessage="No salespersons. Add your first salesperson."
            searchPlaceholder="Search salespersons..."
            actions={<Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}><Plus className="size-3.5" />New Salesperson</Button>}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4 mt-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Period:</Label>
            {["daily", "mtd", "ytd"].map((p) => (
              <Button key={p} variant={reportPeriod === p ? "default" : "outline"} size="sm" onClick={() => setReportPeriod(p)}>
                {p.toUpperCase()}
              </Button>
            ))}
          </div>

          <div className="grid gap-4">
            {teamData.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No sales data for this period.</CardContent></Card>
            ) : (
              teamData.map((sp) => (
                <Card key={sp.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        <span className="font-mono text-primary mr-2">{sp.code}</span>
                        {sp.name}
                        {sp.territory && <Badge variant="outline" className="ml-2">{sp.territory}</Badge>}
                      </CardTitle>
                      <Badge variant={sp.achievement >= 100 ? "default" : "secondary"} className={sp.achievement >= 100 ? "bg-emerald-600" : ""}>
                        {sp.achievement.toFixed(0)}% Target
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Transactions</p>
                        <p className="font-semibold text-lg">{sp.transactionCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-semibold text-lg font-mono">₨ {sp.totalAmount.toLocaleString("en-PK")}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Weight</p>
                        <p className="font-semibold text-lg font-mono">{sp.totalWeight.toLocaleString("en-PK")} KG</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Quantity</p>
                        <p className="font-semibold text-lg font-mono">{sp.totalQuantity.toLocaleString("en-PK")}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Commission</p>
                        <p className="font-semibold text-lg font-mono text-emerald-600">₨ {sp.totalCommission.toLocaleString("en-PK")}</p>
                      </div>
                    </div>
                    {sp.targetMonthly > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Target: ₨ {sp.targetMonthly.toLocaleString("en-PK")}</span>
                          <span>{sp.achievement.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${sp.achievement >= 100 ? "bg-emerald-500" : sp.achievement >= 70 ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${Math.min(sp.achievement, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <FormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Add Salesperson"
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate(form as never, { onSuccess: () => { setShowCreate(false); toast.success("Salesperson added"); setForm({ name: "", phone: "", email: "", territory: "", joiningDate: todayISO(), commissionRate: 0, targetMonthly: 0, targetYearly: 0 }); } });
        }}
        isLoading={createMutation.isPending}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Name</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Phone</Label><Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Email</Label><Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} type="email" /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Territory</Label><Input value={form.territory} onChange={(e) => setForm((p) => ({ ...p, territory: e.target.value }))} placeholder="e.g. Punjab South" /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Commission %</Label><Input type="number" step="0.5" value={form.commissionRate || ""} onChange={(e) => setForm((p) => ({ ...p, commissionRate: Number(e.target.value) }))} /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Monthly Target</Label><Input type="number" value={form.targetMonthly || ""} onChange={(e) => setForm((p) => ({ ...p, targetMonthly: Number(e.target.value) }))} /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Yearly Target</Label><Input type="number" value={form.targetYearly || ""} onChange={(e) => setForm((p) => ({ ...p, targetYearly: Number(e.target.value) }))} /></div>
        </div>
        <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Joining Date</Label><Input type="date" value={form.joiningDate} onChange={(e) => setForm((p) => ({ ...p, joiningDate: e.target.value }))} required /></div>
      </FormDialog>
    </div>
  );
}
