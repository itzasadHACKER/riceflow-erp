"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FormDialog } from "@/components/shared/form-dialog";
import { Weight, Plus, Printer, Search, Truck, ArrowDown } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

interface WeighbridgeSlip {
  id: string;
  slipNumber: string;
  date: string;
  vehicleNumber: string;
  driverName?: string;
  partyName: string;
  partyType: string;
  materialType: string;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  grossWeighTime?: string;
  tareWeighTime?: string;
  operator?: string;
  isPrinted: boolean;
  riceVariety?: { name: string };
}

export default function WeighbridgePage() {
  const token = useAuthStore((s) => s.token);
  const [slips, setSlips] = useState<WeighbridgeSlip[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split("T")[0]);
  const [searchVehicle, setSearchVehicle] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [tareSlipId, setTareSlipId] = useState<string | null>(null);
  const [tareWeight, setTareWeight] = useState("");
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    vehicleNumber: "",
    driverName: "",
    partyName: "",
    partyType: "SUPPLIER",
    materialType: "PADDY",
    grossWeight: "",
    tareWeight: "",
    operator: "",
    notes: "",
  });

  const loadSlips = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchDate) params.set("date", searchDate);
      if (searchVehicle) params.set("vehicleNumber", searchVehicle);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/weighbridge?${params}`,
        { headers: { Authorization: `Bearer ${token ?? ""}` } }
      );
      const data = await res.json();
      setSlips(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const createSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/weighbridge`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({
          ...form,
          grossWeight: parseFloat(form.grossWeight),
          tareWeight: form.tareWeight ? parseFloat(form.tareWeight) : 0,
        }),
      });
      if (res.ok) {
        loadSlips();
        setShowCreate(false);
        setForm({ date: new Date().toISOString().split("T")[0], vehicleNumber: "", driverName: "", partyName: "", partyType: "SUPPLIER", materialType: "PADDY", grossWeight: "", tareWeight: "", operator: "", notes: "" });
      }
    } catch { /* ignore */ }
  };

  const recordTare = async () => {
    if (!tareSlipId || !tareWeight) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/weighbridge/${tareSlipId}/tare`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({ tareWeight: parseFloat(tareWeight) }),
      });
      if (res.ok) { loadSlips(); setTareSlipId(null); setTareWeight(""); }
    } catch { /* ignore */ }
  };

  const netWeight = form.grossWeight && form.tareWeight
    ? (parseFloat(form.grossWeight) - parseFloat(form.tareWeight)).toFixed(2)
    : form.grossWeight || "0";

  const todayTotal = slips.reduce((sum, s) => sum + Number(s.netWeight), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Weight className="h-8 w-8 text-primary" /> Weighbridge
          </h1>
          <p className="text-muted-foreground mt-1">
            Record vehicle weights for paddy purchases and rice dispatches
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> New Weight Slip</Button>
      </div>

      <FormDialog open={showCreate} onOpenChange={setShowCreate} title="Create Weighbridge Slip" submitLabel="Create Slip" onSubmit={createSlip} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Date</Label>
            <Input type="date" value={form.date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <Label>Vehicle Number *</Label>
            <Input placeholder="e.g. LEA-1234" value={form.vehicleNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, vehicleNumber: e.target.value })} />
          </div>
          <div>
            <Label>Driver Name</Label>
            <Input placeholder="Driver name" value={form.driverName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, driverName: e.target.value })} />
          </div>
          <div>
            <Label>Party Name *</Label>
            <Input placeholder="Farmer / dealer name" value={form.partyName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, partyName: e.target.value })} />
          </div>
          <div>
            <Label>Party Type</Label>
            <Select value={form.partyType} onValueChange={(v: string | null) => setForm({ ...form, partyType: v ?? "SUPPLIER" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SUPPLIER">Supplier (Incoming)</SelectItem>
                <SelectItem value="CUSTOMER">Customer (Outgoing)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Material Type</Label>
            <Select value={form.materialType} onValueChange={(v: string | null) => setForm({ ...form, materialType: v ?? "PADDY" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PADDY">Paddy</SelectItem>
                <SelectItem value="RICE">Rice</SelectItem>
                <SelectItem value="BROKEN">Broken Rice</SelectItem>
                <SelectItem value="HUSK">Husk</SelectItem>
                <SelectItem value="BRAN">Bran</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Gross Weight (KG) *</Label>
            <Input type="number" placeholder="0.00" value={form.grossWeight} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, grossWeight: e.target.value })} />
          </div>
          <div>
            <Label>Tare Weight (KG)</Label>
            <Input type="number" placeholder="0.00" value={form.tareWeight} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, tareWeight: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Label>Operator</Label>
            <Input placeholder="Weighbridge operator name" value={form.operator} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, operator: e.target.value })} />
          </div>
          <div className="col-span-2 bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Net Weight</p>
            <p className="text-3xl font-bold text-blue-700">{netWeight} KG</p>
          </div>
        </div>
      </FormDialog>

      <Dialog open={!!tareSlipId} onOpenChange={(open) => { if (!open) { setTareSlipId(null); setTareWeight(""); } }}>
        <DialogContent className="sm:max-w-[300px]">
          <DialogHeader><DialogTitle>Record Tare Weight</DialogTitle></DialogHeader>
          <div>
            <Label>Tare Weight (KG)</Label>
            <Input type="number" value={tareWeight} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTareWeight(e.target.value)} placeholder="0.00" autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTareSlipId(null); setTareWeight(""); }}>Cancel</Button>
            <Button onClick={recordTare} disabled={!tareWeight}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Today&apos;s Vehicles</p>
                <p className="text-2xl font-bold">{slips.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Weight className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Net Weight</p>
                <p className="text-2xl font-bold">{(todayTotal / 1000).toFixed(2)} Tons</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ArrowDown className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Tare</p>
                <p className="text-2xl font-bold">{slips.filter((s) => Number(s.tareWeight) === 0).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Weight Slips</CardTitle>
            <div className="flex gap-2">
              <Input type="date" value={searchDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchDate(e.target.value)} className="w-40" />
              <Input placeholder="Vehicle #" value={searchVehicle} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchVehicle(e.target.value)} className="w-36" />
              <Button variant="outline" onClick={loadSlips}><Search className="h-4 w-4 mr-1" /> Search</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Slip #</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Party</TableHead>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Gross (KG)</TableHead>
                <TableHead className="text-right">Tare (KG)</TableHead>
                <TableHead className="text-right">Net (KG)</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slips.map((slip) => (
                <TableRow key={slip.id}>
                  <TableCell className="font-mono font-semibold">{slip.slipNumber}</TableCell>
                  <TableCell className="text-sm">{slip.grossWeighTime ? new Date(slip.grossWeighTime).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" }) : "-"}</TableCell>
                  <TableCell className="font-mono">{slip.vehicleNumber}</TableCell>
                  <TableCell>{slip.partyName}</TableCell>
                  <TableCell><Badge variant="outline">{slip.materialType}</Badge></TableCell>
                  <TableCell className="text-right font-mono">{Number(slip.grossWeight).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">{Number(slip.tareWeight) > 0 ? Number(slip.tareWeight).toLocaleString() : <span className="text-yellow-600">Pending</span>}</TableCell>
                  <TableCell className="text-right font-mono font-bold">{Number(slip.netWeight).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {Number(slip.tareWeight) === 0 && (
                        <Button variant="outline" size="sm" onClick={() => setTareSlipId(slip.id)}>Record Tare</Button>
                      )}
                      <Button variant="ghost" size="icon"><Printer className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {slips.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No slips found. Click &quot;Search&quot; to load or create a new slip.
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
