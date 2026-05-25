"use client";

import { useState } from "react";
import { TrendingUp, BarChart3, Plus, ArrowUpDown, Calendar } from "lucide-react";
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
import { formatCurrency, formatDate, todayISO } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface MarketRate { id: string; commodity: string; market: string; rate: number; date: string; unit: string; trend: string; }

const rateColumns: Column<MarketRate>[] = [
  { key: "commodity", header: "Commodity" },
  { key: "market", header: "Market", render: (item) => <Badge variant="outline">{item.market}</Badge> },
  { key: "rate", header: "Rate", className: "text-right", render: (item) => <span className="font-mono font-semibold">{formatCurrency(item.rate)}</span> },
  { key: "unit", header: "Unit" },
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
  {
    key: "trend", header: "Trend", render: (item) => {
      if (!item.trend) return "—";
      const up = item.trend === "UP";
      return <Badge variant={up ? "default" : "destructive"} className={up ? "bg-emerald-600" : "bg-red-600"}>{up ? "▲ Up" : "▼ Down"}</Badge>;
    },
  },
];

export default function MarketPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ commodity: "", market: "", rate: 0, unit: "per KG", date: todayISO() });

  const { data: rates = [], isLoading } = useApiList<MarketRate>(["market-rates"], "/market/rates");
  const createMutation = useApiMutation("/market/rates", "post", [["market-rates"]]);

  const commodities = new Set(rates.map((r) => r.commodity));
  const markets = new Set(rates.map((r) => r.market));
  const avgRate = rates.length > 0 ? rates.reduce((s, r) => s + Number(r.rate || 0), 0) / rates.length : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Market Intelligence" description="Real-time market rates, commodity trends, and seasonal analytics" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Market Rates" value={rates.length} icon={TrendingUp} />
        <StatCard title="Commodities" value={commodities.size} icon={BarChart3} />
        <StatCard title="Markets" value={markets.size} icon={ArrowUpDown} />
        <StatCard title="Avg Rate" value={formatCurrency(avgRate)} icon={Calendar} description="Across all commodities" />
      </div>

      {commodities.size > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...commodities].map((commodity) => {
            const commodityRates = rates.filter((r) => r.commodity === commodity);
            const latest = commodityRates[0];
            return (
              <Card key={commodity}>
                <CardHeader className="pb-2"><CardTitle className="text-sm">{commodity}</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold font-mono">{formatCurrency(latest?.rate ?? 0)}</span>
                    <span className="text-xs text-muted-foreground">{latest?.unit ?? "per KG"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{commodityRates.length} records · Latest: {formatDate(latest?.date)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <DataTable columns={rateColumns} data={rates as unknown as MarketRate[]} isLoading={isLoading} emptyMessage="No market rates available." searchPlaceholder="Search rates..."
        actions={<Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}><Plus className="size-3.5" />Add Rate</Button>} />

      <FormDialog open={showCreate} onOpenChange={setShowCreate} title="Add Market Rate"
        onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form as never, { onSuccess: () => { setShowCreate(false); toast.success("Rate added"); } }); }}
        isLoading={createMutation.isPending}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Commodity</Label><Input value={form.commodity} onChange={(e) => setForm((p) => ({ ...p, commodity: e.target.value }))} required placeholder="e.g. Basmati Super Kernel" /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Market</Label><Input value={form.market} onChange={(e) => setForm((p) => ({ ...p, market: e.target.value }))} required placeholder="e.g. Lahore" /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Rate (PKR)</Label><Input type="number" value={form.rate || ""} onChange={(e) => setForm((p) => ({ ...p, rate: Number(e.target.value) }))} required /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Unit</Label><Input value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Date</Label><Input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required /></div>
        </div>
      </FormDialog>
    </div>
  );
}
