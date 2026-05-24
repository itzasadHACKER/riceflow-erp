"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FormDialog } from "@/components/shared/form-dialog";
import { Package, Plus, ArrowUp, ArrowDown, AlertTriangle, RotateCcw, ShoppingBag, Trash2 } from "lucide-react";

interface BardanaTransaction {
  id: string;
  transactionNumber: string;
  date: string;
  transactionType: string;
  partyName: string;
  partyType: string;
  bagType: string;
  quantity: number;
  rate: number;
  amount: number;
  referenceDoc?: string;
  notes?: string;
}

interface BardanaSummary {
  totalIssued: number;
  totalReceived: number;
  totalPurchased: number;
  totalSold: number;
  totalReturned: number;
  totalDamaged: number;
  inStock: number;
  outstanding: number;
  totalTransactions: number;
}

export default function BardanaPage() {
  const [transactions, setTransactions] = useState<BardanaTransaction[]>([]);
  const [summary, setSummary] = useState<BardanaSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    transactionType: "ISSUED",
    partyName: "",
    partyType: "SUPPLIER",
    bagType: "PP",
    quantity: "",
    rate: "",
    referenceDoc: "",
    notes: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [txRes, sumRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/bardana`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/bardana/summary`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` },
        }),
      ]);
      const txData = await txRes.json();
      const sumData = await sumRes.json();
      setTransactions(Array.isArray(txData) ? txData : []);
      setSummary(sumData);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const createTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bardana`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` },
        body: JSON.stringify({
          ...form,
          quantity: parseInt(form.quantity),
          rate: form.rate ? parseFloat(form.rate) : 0,
        }),
      });
      if (res.ok) {
        loadData();
        setShowCreate(false);
        setForm({ date: new Date().toISOString().split("T")[0], transactionType: "ISSUED", partyName: "", partyType: "SUPPLIER", bagType: "PP", quantity: "", rate: "", referenceDoc: "", notes: "" });
      }
    } catch { /* ignore */ }
  };

  const getTypeBadge = (type: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode }> = {
      ISSUED: { color: "bg-red-100 text-red-700", icon: <ArrowUp className="h-3 w-3" /> },
      RECEIVED: { color: "bg-green-100 text-green-700", icon: <ArrowDown className="h-3 w-3" /> },
      PURCHASED: { color: "bg-blue-100 text-blue-700", icon: <ShoppingBag className="h-3 w-3" /> },
      SOLD: { color: "bg-purple-100 text-purple-700", icon: <ShoppingBag className="h-3 w-3" /> },
      RETURNED: { color: "bg-yellow-100 text-yellow-700", icon: <RotateCcw className="h-3 w-3" /> },
      DAMAGED: { color: "bg-gray-100 text-gray-700", icon: <Trash2 className="h-3 w-3" /> },
    };
    const c = config[type] || { color: "bg-gray-100", icon: null };
    return <Badge className={`${c.color} flex items-center gap-1`}>{c.icon} {type}</Badge>;
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", minimumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" /> Bardana (Bag) Tracking
          </h1>
          <p className="text-muted-foreground mt-1">
            Track bags issued to farmers, received back, purchased, sold, returned, and damaged
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>{loading ? "Loading..." : "Refresh"}</Button>
          <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> New Transaction</Button>
        </div>
      </div>

      <FormDialog open={showCreate} onOpenChange={setShowCreate} title="Bardana Transaction" submitLabel="Save" onSubmit={createTransaction} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Date</Label>
            <Input type="date" value={form.date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <Label>Transaction Type *</Label>
            <Select value={form.transactionType} onValueChange={(v: string | null) => setForm({ ...form, transactionType: v ?? "ISSUED" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ISSUED">Issued (Given to party)</SelectItem>
                <SelectItem value="RECEIVED">Received (Back from party)</SelectItem>
                <SelectItem value="PURCHASED">Purchased (Bought new bags)</SelectItem>
                <SelectItem value="SOLD">Sold (Sold bags)</SelectItem>
                <SelectItem value="RETURNED">Returned (Party returned)</SelectItem>
                <SelectItem value="DAMAGED">Damaged (Write off)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Party Name *</Label>
            <Input placeholder="Farmer / dealer name" value={form.partyName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, partyName: e.target.value })} />
          </div>
          <div>
            <Label>Bag Type</Label>
            <Select value={form.bagType} onValueChange={(v: string | null) => setForm({ ...form, bagType: v ?? "PP" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PP">PP (Polypropylene)</SelectItem>
                <SelectItem value="JUTE">Jute / Bori</SelectItem>
                <SelectItem value="HDPE">HDPE</SelectItem>
                <SelectItem value="COTTON">Cotton</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Quantity *</Label>
            <Input type="number" placeholder="Number of bags" value={form.quantity} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <div>
            <Label>Rate per Bag (Rs)</Label>
            <Input type="number" placeholder="0.00" value={form.rate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, rate: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Label>Reference Document</Label>
            <Input placeholder="Purchase # / Gate Pass #" value={form.referenceDoc} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, referenceDoc: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <Input placeholder="Any additional notes" value={form.notes} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, notes: e.target.value })} />
          </div>
          {form.quantity && form.rate && (
            <div className="col-span-2 bg-blue-50 p-3 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-xl font-bold text-blue-700">{formatCurrency(parseInt(form.quantity) * parseFloat(form.rate))}</p>
            </div>
          )}
        </div>
      </FormDialog>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">In Stock</p>
                  <p className="text-2xl font-bold text-blue-600">{summary.inStock.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Outstanding</p>
                  <p className="text-2xl font-bold text-orange-600">{summary.outstanding.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Issued - Received</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <ArrowUp className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Issued</p>
                  <p className="text-2xl font-bold">{summary.totalIssued.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <ArrowDown className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Received</p>
                  <p className="text-2xl font-bold">{summary.totalReceived.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Transactions ({transactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Txn #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Party</TableHead>
                <TableHead>Bag Type</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono font-semibold">{t.transactionNumber}</TableCell>
                  <TableCell>{new Date(t.date).toLocaleDateString("en-PK")}</TableCell>
                  <TableCell>{getTypeBadge(t.transactionType)}</TableCell>
                  <TableCell>{t.partyName}</TableCell>
                  <TableCell><Badge variant="outline">{t.bagType}</Badge></TableCell>
                  <TableCell className="text-right font-mono font-bold">{t.quantity.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">{Number(t.rate) > 0 ? `Rs.${Number(t.rate)}` : "-"}</TableCell>
                  <TableCell className="text-right font-mono">{Number(t.amount) > 0 ? formatCurrency(Number(t.amount)) : "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.referenceDoc || "-"}</TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No transactions yet. Click &quot;Refresh&quot; to load or create a new transaction.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
