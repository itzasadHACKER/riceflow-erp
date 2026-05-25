"use client";

import { useState } from "react";
import { Factory, Cpu, Route, Calculator, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { toast } from "sonner";

interface ResourceCapacity { id: string; name: string; category: string; status: string; capacity: number; capacityUnit: string; availableHoursPerDay: number; dailyCapacity: number; weeklyCapacity: number; utilizationPercent: number; }
interface Routing { id: string; name: string; operations: { sequence: number; name: string; workCenter: string; setupTime: number; runTime: number }[]; }

const capacityColumns: Column<ResourceCapacity>[] = [
  { key: "name", header: "Machine" },
  { key: "category", header: "Category", render: (i) => <Badge variant="outline">{i.category}</Badge> },
  { key: "status", header: "Status", render: (i) => <Badge variant={i.status === "OPERATIONAL" ? "default" : "destructive"}>{i.status}</Badge> },
  { key: "capacity", header: "Capacity/hr", render: (i) => <span className="font-mono">{i.capacity} {i.capacityUnit}</span> },
  { key: "dailyCapacity", header: "Daily Cap.", render: (i) => <span className="font-mono">{i.dailyCapacity}</span> },
  { key: "utilizationPercent", header: "Utilization", render: (i) => (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-gray-200 rounded-full"><div className="h-2 bg-primary rounded-full" style={{ width: `${i.utilizationPercent}%` }} /></div>
      <span className="text-xs font-mono">{i.utilizationPercent}%</span>
    </div>
  )},
];

export default function ProductionEnhancedPage() {
  const [routingOpen, setRoutingOpen] = useState(false);
  const [costOrderId, setCostOrderId] = useState("");

  const { data: capacity = [] } = useApiList<ResourceCapacity>(["resource-capacity"], "/production-enhanced/resource-capacity");
  const { data: routings = [], refetch: refetchRoutings } = useApiList<Routing>(["routings"], "/production-enhanced/routings");

  const createRouting = useApiMutation("/production-enhanced/routings", "post");
  const calcCost = useApiMutation("/production-enhanced/cost-rollup", "post");

  const capList = Array.isArray(capacity) ? capacity : [];
  const routingList = Array.isArray(routings) ? routings : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Production Enhancements" description="Resource capacity planning, routing/operations, and production cost rollup" />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Active Machines" value={capList.length} icon={Cpu} description="Operational resources" />
        <StatCard title="Routings" value={routingList.length} icon={Route} description="Manufacturing routes" />
        <StatCard title="Avg Utilization" value={capList.length ? `${Math.round(capList.reduce((s, c) => s + c.utilizationPercent, 0) / capList.length)}%` : "0%"} icon={Factory} description="Capacity utilization" />
      </div>

      <Tabs defaultValue="capacity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="capacity">Resource Capacity</TabsTrigger>
          <TabsTrigger value="routings">Routings / Operations</TabsTrigger>
          <TabsTrigger value="cost-rollup">Cost Rollup</TabsTrigger>
        </TabsList>

        <TabsContent value="capacity" className="space-y-4">
          <DataTable columns={capacityColumns} data={capList} />
        </TabsContent>

        <TabsContent value="routings" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setRoutingOpen(true)}><Plus className="mr-2 h-4 w-4" />New Routing</Button>
          </div>
          <div className="grid gap-4">
            {routingList.map((r: any) => (
              <Card key={r.id}>
                <CardHeader className="py-3"><CardTitle className="text-sm">{r.name || r.id}</CardTitle></CardHeader>
                <CardContent>
                  {r.operations?.map((op: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 text-sm border-b py-2 last:border-0">
                      <Badge variant="outline">{op.sequence}</Badge>
                      <span className="font-medium">{op.name}</span>
                      <span className="text-muted-foreground">{op.workCenter}</span>
                      <span className="text-xs">Setup: {op.setupTime}min</span>
                      <span className="text-xs">Run: {op.runTime}min</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
          <FormDialog open={routingOpen} onOpenChange={setRoutingOpen} title="Create Routing" onSubmit={async (e) => {
            e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement);
            await createRouting.mutateAsync({
              name: fd.get("name"),
              operations: [
                { sequence: 10, name: fd.get("op1Name"), workCenter: fd.get("op1WC"), setupTime: Number(fd.get("op1Setup")), runTime: Number(fd.get("op1Run")) },
                { sequence: 20, name: fd.get("op2Name"), workCenter: fd.get("op2WC"), setupTime: Number(fd.get("op2Setup")), runTime: Number(fd.get("op2Run")) },
              ].filter(op => op.name),
            });
            toast.success("Routing created"); setRoutingOpen(false); refetchRoutings();
          }}>
            <div className="grid gap-4">
              <div><Label>Routing Name</Label><Input name="name" required /></div>
              <p className="text-sm font-medium">Operation 1</p>
              <div className="grid grid-cols-4 gap-2">
                <Input name="op1Name" placeholder="Op name" />
                <Input name="op1WC" placeholder="Work center" />
                <Input name="op1Setup" type="number" placeholder="Setup (min)" />
                <Input name="op1Run" type="number" placeholder="Run (min)" />
              </div>
              <p className="text-sm font-medium">Operation 2</p>
              <div className="grid grid-cols-4 gap-2">
                <Input name="op2Name" placeholder="Op name" />
                <Input name="op2WC" placeholder="Work center" />
                <Input name="op2Setup" type="number" placeholder="Setup (min)" />
                <Input name="op2Run" type="number" placeholder="Run (min)" />
              </div>
            </div>
          </FormDialog>
        </TabsContent>

        <TabsContent value="cost-rollup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" />Production Cost Rollup</CardTitle>
              <CardDescription>Calculate total cost of a production order from BOM materials + labor + overhead.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Production Order ID</Label><Input value={costOrderId} onChange={(e) => setCostOrderId(e.target.value)} placeholder="Enter order ID" /></div>
                <div className="flex items-end">
                  <Button onClick={async () => {
                    if (!costOrderId) return;
                    try {
                      await calcCost.mutateAsync({}, { url: `production-enhanced/cost-rollup/${costOrderId}` } as any);
                      toast.success("Cost rollup calculated");
                    } catch { toast.error("Failed to calculate cost rollup"); }
                  }}>Calculate Cost</Button>
                </div>
              </div>
              <div className="rounded-lg border p-4 bg-amber-50">
                <p className="text-sm font-medium">Cost Components:</p>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  <li>Material Cost: Sum of BOM item quantities &times; unit costs</li>
                  <li>Labor Cost: Production hours &times; labor rate</li>
                  <li>Overhead: Fixed percentage allocation</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
