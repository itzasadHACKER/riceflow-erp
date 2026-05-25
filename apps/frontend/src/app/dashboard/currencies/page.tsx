"use client";

import { useState } from "react";
import { DollarSign, ArrowUpDown, Plus, RefreshCw } from "lucide-react";
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
import { toast } from "sonner";

interface Currency { id: string; code: string; name: string; symbol: string; exchangeRate: number; isBase: boolean; }

const currencyColumns: Column<Currency>[] = [
  { key: "code", header: "Code", render: (item) => <span className="font-mono font-medium text-primary">{item.code}</span> },
  { key: "name", header: "Currency Name" },
  { key: "symbol", header: "Symbol", render: (item) => <span className="font-mono text-lg">{item.symbol}</span> },
  { key: "exchangeRate", header: "Exchange Rate", className: "text-right", render: (item) => <span className="font-mono">{item.exchangeRate?.toFixed(4)}</span> },
  { key: "isBase", header: "Base", render: (item) => item.isBase ? <Badge className="bg-emerald-600">Base</Badge> : <Badge variant="secondary">Foreign</Badge> },
];

export default function CurrenciesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [convertFrom, setConvertFrom] = useState("");
  const [convertTo, setConvertTo] = useState("");
  const [convertAmount, setConvertAmount] = useState(0);
  const [form, setForm] = useState({ code: "", name: "", symbol: "", exchangeRate: 1 });

  const { data: currencies = [], isLoading } = useApiList<Currency>(["currencies"], "/currencies");
  const createMutation = useApiMutation("/currencies", "post", [["currencies"]]);

  const baseCurrency = currencies.find((c) => c.isBase);
  const fromRate = currencies.find((c) => c.code === convertFrom)?.exchangeRate ?? 1;
  const toRate = currencies.find((c) => c.code === convertTo)?.exchangeRate ?? 1;
  const convertedAmount = convertAmount > 0 ? (convertAmount / fromRate) * toRate : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Multi-Currency" description="Currency management, exchange rates, and currency conversion" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Currencies" value={currencies.length} icon={DollarSign} />
        <StatCard title="Base Currency" value={baseCurrency?.code ?? "PKR"} icon={DollarSign} description={baseCurrency?.name} />
        <StatCard title="Foreign" value={currencies.filter((c) => !c.isBase).length} icon={ArrowUpDown} />
        <StatCard title="Last Updated" value="Today" icon={RefreshCw} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Currency Converter</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 items-end">
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider">Amount</Label>
              <Input type="number" value={convertAmount || ""} onChange={(e) => setConvertAmount(Number(e.target.value))} placeholder="100" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider">From</Label>
              <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={convertFrom} onChange={(e) => setConvertFrom(e.target.value)}>
                <option value="">Select</option>
                {currencies.map((c) => <option key={c.id} value={c.code}>{c.code} — {c.name}</option>)}
              </select>
            </div>
            <div className="flex items-center justify-center"><ArrowUpDown className="size-5 text-muted-foreground" /></div>
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider">To</Label>
              <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={convertTo} onChange={(e) => setConvertTo(e.target.value)}>
                <option value="">Select</option>
                {currencies.map((c) => <option key={c.id} value={c.code}>{c.code} — {c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider">Result</Label>
              <div className="h-9 flex items-center px-3 rounded-md border bg-muted/50 font-mono font-semibold text-lg">
                {convertedAmount > 0 ? convertedAmount.toFixed(2) : "—"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable columns={currencyColumns} data={currencies as unknown as Currency[]} isLoading={isLoading} emptyMessage="No currencies configured." searchPlaceholder="Search currencies..."
        actions={<Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}><Plus className="size-3.5" />Add Currency</Button>} />

      <FormDialog open={showCreate} onOpenChange={setShowCreate} title="Add Currency"
        onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form as never, { onSuccess: () => { setShowCreate(false); toast.success("Currency added"); } }); }}
        isLoading={createMutation.isPending}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Code</Label><Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} required placeholder="e.g. USD" className="font-mono" /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Name</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required placeholder="e.g. US Dollar" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Symbol</Label><Input value={form.symbol} onChange={(e) => setForm((p) => ({ ...p, symbol: e.target.value }))} required placeholder="e.g. $" className="font-mono text-lg" /></div>
          <div className="space-y-2"><Label className="text-xs font-semibold uppercase tracking-wider">Exchange Rate</Label><Input type="number" step="0.0001" value={form.exchangeRate} onChange={(e) => setForm((p) => ({ ...p, exchangeRate: Number(e.target.value) }))} required /></div>
        </div>
      </FormDialog>
    </div>
  );
}
