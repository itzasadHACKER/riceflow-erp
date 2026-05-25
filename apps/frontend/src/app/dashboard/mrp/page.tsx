"use client";

import { useState } from "react";
import { Cog, BarChart3, TrendingDown, Plus, Play, FileOutput } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface MrpRun { id: string; runNumber: string; status: string; planningHorizon: number; itemsProcessed: number; recommendationsCount: number; createdAt: string; }
interface Forecast { id: string; itemCode: string; periodStart: string; periodEnd: string; forecastQty: string; method: string; }
interface Recommendation { id: string; itemCode: string; itemName: string; orderType: string; shortageQty: string; recommendedQty: string; status: string; }

const runColumns: Column<MrpRun>[] = [
  { key: "runNumber", header: "Run #", render: (r) => <span className="font-mono font-semibold">{r.runNumber}</span> },
  { key: "status", header: "Status", render: (r) => <Badge className={r.status === "COMPLETED" ? "bg-emerald-600" : r.status === "RUNNING" ? "bg-blue-500" : "bg-slate-500"}>{r.status}</Badge> },
  { key: "planningHorizon", header: "Horizon", render: (r) => `${r.planningHorizon} days` },
  { key: "itemsProcessed", header: "Items", className: "text-right", render: (r) => <span className="font-mono">{r.itemsProcessed}</span> },
  { key: "recommendationsCount", header: "Recommendations", className: "text-right", render: (r) => <span className="font-mono font-semibold text-blue-600">{r.recommendationsCount}</span> },
  { key: "createdAt", header: "Date", render: (r) => formatDate(r.createdAt) },
];

const forecastColumns: Column<Forecast>[] = [
  { key: "itemCode", header: "Item" },
  { key: "periodStart", header: "Period Start", render: (r) => formatDate(r.periodStart) },
  { key: "periodEnd", header: "Period End", render: (r) => formatDate(r.periodEnd) },
  { key: "forecastQty", header: "Forecast Qty", className: "text-right", render: (r) => <span className="font-mono font-semibold">{Number(r.forecastQty).toLocaleString()}</span> },
  { key: "method", header: "Method", render: (r) => <Badge variant="outline">{r.method}</Badge> },
];

export default function MrpPage() {
  const [showRun, setShowRun] = useState(false);
  const [showForecast, setShowForecast] = useState(false);
  const [runForm, setRunForm] = useState({ planningHorizon: 30 });
  const [fcForm, setFcForm] = useState({ itemCode: "", periodStart: "", periodEnd: "", forecastQty: 0, method: "MANUAL" });

  const { data: runs = [], isLoading } = useApiList<MrpRun>(["mrp-runs"], "/mrp/runs");
  const { data: forecasts = [] } = useApiList<Forecast>(["mrp-forecasts"], "/mrp/forecasts");
  const { data: summary } = useApiList<any>(["mrp-summary"], "/mrp/summary");

  const runMut = useApiMutation("/mrp/run", "post", { invalidateKeys: [["mrp-runs"], ["mrp-summary"]], onSuccess: () => { setShowRun(false); toast.success("MRP run completed"); } });
  const fcMut = useApiMutation("/mrp/forecasts", "post", { invalidateKeys: [["mrp-forecasts"]], onSuccess: () => { setShowForecast(false); toast.success("Forecast created"); } });

  const stats = summary as any;

  return (
    <div className="space-y-6">
      <PageHeader title="MRP Engine" description="Material Requirements Planning — net requirements, planned orders, demand forecasting">
        <div className="flex gap-2">
          <Button onClick={() => setShowForecast(true)} variant="outline"><Plus className="mr-2 h-4 w-4" />Add Forecast</Button>
          <Button onClick={() => setShowRun(true)}><Play className="mr-2 h-4 w-4" />Run MRP Wizard</Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total MRP Runs" value={stats?.totalRuns ?? 0} icon={Cog} />
        <StatCard title="Pending Recommendations" value={stats?.pendingRecommendations ?? 0} icon={TrendingDown} />
        <StatCard title="Demand Forecasts" value={stats?.totalForecasts ?? 0} icon={BarChart3} />
      </div>

      <Tabs defaultValue="runs" className="space-y-4">
        <TabsList><TabsTrigger value="runs">MRP Runs</TabsTrigger><TabsTrigger value="forecasts">Demand Forecasts</TabsTrigger></TabsList>
        <TabsContent value="runs"><DataTable columns={runColumns} data={runs} isLoading={isLoading}  /></TabsContent>
        <TabsContent value="forecasts"><DataTable columns={forecastColumns} data={forecasts}  /></TabsContent>
      </Tabs>

      <FormDialog open={showRun} onOpenChange={setShowRun} title="Run MRP Wizard" onSubmit={() => runMut.mutate(runForm)} isLoading={runMut.isPending}>
        <div><Label>Planning Horizon (days)</Label><Input type="number" value={runForm.planningHorizon} onChange={(e) => setRunForm({ planningHorizon: Number(e.target.value) })} /></div>
      </FormDialog>

      <FormDialog open={showForecast} onOpenChange={setShowForecast} title="Add Demand Forecast" onSubmit={() => fcMut.mutate(fcForm)} isLoading={fcMut.isPending}>
        <div className="grid gap-4">
          <div><Label>Item Code</Label><Input value={fcForm.itemCode} onChange={(e) => setFcForm({ ...fcForm, itemCode: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Period Start</Label><Input type="date" value={fcForm.periodStart} onChange={(e) => setFcForm({ ...fcForm, periodStart: e.target.value })} /></div>
            <div><Label>Period End</Label><Input type="date" value={fcForm.periodEnd} onChange={(e) => setFcForm({ ...fcForm, periodEnd: e.target.value })} /></div>
          </div>
          <div><Label>Forecast Quantity</Label><Input type="number" value={fcForm.forecastQty} onChange={(e) => setFcForm({ ...fcForm, forecastQty: Number(e.target.value) })} /></div>
        </div>
      </FormDialog>
    </div>
  );
}
