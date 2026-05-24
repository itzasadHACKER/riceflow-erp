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
import { Plus, Trash2, Receipt } from "lucide-react";

interface InvoiceItem {
  description: string;
  quantity: string;
  unit: string;
  rate: string;
  taxRate: string;
}

interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  vendorInvoiceNo?: string;
  date: string;
  totalAmount: number;
  discount: number;
  taxAmount: number;
  netAmount: number;
  paymentStatus: string;
  paidAmount: number;
  supplier: { name: string };
  items: { description: string; quantity: number; rate: number; amount: number; taxAmount: number; netAmount: number; unit: string }[];
}

export default function PurchaseInvoicesPage() {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: "", unit: "PCS", rate: "", taxRate: "0" },
  ]);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    supplierId: "",
    vendorInvoiceNo: "",
    dueDate: "",
    discount: "0",
    notes: "",
  });

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchase-invoices`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` },
      });
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const createInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchase-invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` },
        body: JSON.stringify({
          ...form,
          discount: parseFloat(form.discount) || 0,
          items: items.filter((i) => i.description && i.quantity && i.rate).map((i) => ({
            description: i.description,
            quantity: parseFloat(i.quantity),
            unit: i.unit,
            rate: parseFloat(i.rate),
            taxRate: parseFloat(i.taxRate) || 0,
          })),
        }),
      });
      if (res.ok) {
        loadInvoices();
        setShowCreate(false);
        setItems([{ description: "", quantity: "", unit: "PCS", rate: "", taxRate: "0" }]);
      }
    } catch { /* ignore */ }
  };

  const addItem = () => setItems([...items, { description: "", quantity: "", unit: "PCS", rate: "", taxRate: "0" }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof InvoiceItem, value: string) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    setItems(updated);
  };

  const calcTotal = () => {
    let total = 0;
    let tax = 0;
    for (const item of items) {
      const amount = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
      total += amount;
      tax += amount * (parseFloat(item.taxRate) || 0) / 100;
    }
    const discount = parseFloat(form.discount) || 0;
    return { total, tax, discount, net: total - discount + tax };
  };

  const totals = calcTotal();
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", minimumFractionDigits: 0 }).format(n);

  const statusColor: Record<string, string> = {
    PAID: "bg-green-100 text-green-700",
    PARTIAL: "bg-yellow-100 text-yellow-700",
    UNPAID: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="h-8 w-8 text-primary" /> Purchase Invoices
          </h1>
          <p className="text-muted-foreground mt-1">
            Record non-paddy purchases — diesel, spare parts, packaging, office supplies, etc.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadInvoices} disabled={loading}>Refresh</Button>
          <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> New Purchase Invoice</Button>
        </div>
      </div>

      <FormDialog open={showCreate} onOpenChange={setShowCreate} title="Create Purchase Invoice" submitLabel="Create Invoice" onSubmit={createInvoice} size="xl">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Date</Label>
            <Input type="date" value={form.date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <Label>Supplier ID *</Label>
            <Input placeholder="Supplier UUID" value={form.supplierId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, supplierId: e.target.value })} />
          </div>
          <div>
            <Label>Vendor Invoice #</Label>
            <Input placeholder="Vendor&apos;s bill number" value={form.vendorInvoiceNo} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, vendorInvoiceNo: e.target.value })} />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-base font-semibold">Line Items</Label>
            <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="h-3 w-3 mr-1" /> Add Row</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Description</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Tax %</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, i) => {
                const amount = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
                return (
                  <TableRow key={i}>
                    <TableCell><Input placeholder="Item description" value={item.description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(i, "description", e.target.value)} /></TableCell>
                    <TableCell><Input type="number" className="w-20" value={item.quantity} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(i, "quantity", e.target.value)} /></TableCell>
                    <TableCell>
                      <Select value={item.unit} onValueChange={(v: string | null) => updateItem(i, "unit", v ?? "PCS")}>
                        <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PCS">PCS</SelectItem>
                          <SelectItem value="KG">KG</SelectItem>
                          <SelectItem value="LITRE">LTR</SelectItem>
                          <SelectItem value="SET">SET</SelectItem>
                          <SelectItem value="BOX">BOX</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell><Input type="number" className="w-24" value={item.rate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(i, "rate", e.target.value)} /></TableCell>
                    <TableCell><Input type="number" className="w-16" value={item.taxRate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(i, "taxRate", e.target.value)} /></TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(amount)}</TableCell>
                    <TableCell>
                      {items.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label>Discount (Rs)</Label>
            <Input type="number" value={form.discount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, discount: e.target.value })} />
          </div>
          <div className="bg-gray-50 p-4 rounded-lg space-y-1">
            <div className="flex justify-between"><span>Subtotal:</span><span className="font-mono">{formatCurrency(totals.total)}</span></div>
            <div className="flex justify-between"><span>Discount:</span><span className="font-mono text-red-600">-{formatCurrency(totals.discount)}</span></div>
            <div className="flex justify-between"><span>Tax:</span><span className="font-mono">{formatCurrency(totals.tax)}</span></div>
            <div className="flex justify-between font-bold text-lg border-t pt-1"><span>Net Amount:</span><span className="font-mono">{formatCurrency(totals.net)}</span></div>
          </div>
        </div>
      </FormDialog>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Invoices ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Vendor Bill #</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Tax</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono font-semibold">{inv.invoiceNumber}</TableCell>
                  <TableCell>{new Date(inv.date).toLocaleDateString("en-PK")}</TableCell>
                  <TableCell>{inv.supplier?.name}</TableCell>
                  <TableCell>{inv.vendorInvoiceNo || "-"}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(Number(inv.totalAmount))}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(Number(inv.taxAmount))}</TableCell>
                  <TableCell className="text-right font-mono font-bold">{formatCurrency(Number(inv.netAmount))}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(Number(inv.paidAmount))}</TableCell>
                  <TableCell><Badge className={statusColor[inv.paymentStatus] || ""}>{inv.paymentStatus}</Badge></TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No invoices yet. Click &quot;Refresh&quot; to load.
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
