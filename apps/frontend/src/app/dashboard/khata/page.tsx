"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, Download, Printer, ArrowUpRight, ArrowDownRight, User } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

interface LedgerEntry {
  date: string;
  type: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  balanceType: string;
}

interface KhataData {
  party: { id: string; name: string; type: string };
  openingBalance: number;
  closingBalance: number;
  closingBalanceType: string;
  totalDebit: number;
  totalCredit: number;
  entries: LedgerEntry[];
}

export default function KhataPage() {
  const token = useAuthStore((s) => s.token);
  const [partyType, setPartyType] = useState<string>("CUSTOMER");
  const [partyId, setPartyId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [khataData, setKhataData] = useState<KhataData | null>(null);
  const [loading, setLoading] = useState(false);
  const [partySearch, setPartySearch] = useState("");
  const [parties, setParties] = useState<{ id: string; name: string; phone?: string }[]>([]);

  const searchParties = async () => {
    if (!partySearch.trim()) return;
    try {
      const endpoint = partyType === "CUSTOMER" ? "customers" : "procurement/suppliers";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/${endpoint}?search=${encodeURIComponent(partySearch)}&limit=20`,
        { headers: { Authorization: `Bearer ${token ?? ""}` } }
      );
      const json = await res.json();
      setParties(json.data || []);
    } catch { /* ignore */ }
  };

  const loadKhata = async () => {
    if (!partyId) return;
    setLoading(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/khata/${partyType}/${partyId}`;
      const params = new URLSearchParams();
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);
      if (params.toString()) url += `?${params}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      const data = await res.json();
      setKhataData(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", minimumFractionDigits: 0 }).format(n);

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      OPENING: "bg-gray-100 text-gray-700",
      INVOICE: "bg-blue-100 text-blue-700",
      PURCHASE: "bg-orange-100 text-orange-700",
      PAYMENT: "bg-green-100 text-green-700",
      CREDIT_NOTE: "bg-purple-100 text-purple-700",
      DEBIT_NOTE: "bg-red-100 text-red-700",
      SALES_RETURN: "bg-yellow-100 text-yellow-700",
      PURCHASE_RETURN: "bg-yellow-100 text-yellow-700",
    };
    return <Badge className={colors[type] || "bg-gray-100"}>{type.replace("_", " ")}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" /> Party Khata / Ledger
          </h1>
          <p className="text-muted-foreground mt-1">
            View complete transaction history and running balance for any customer or supplier
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Party</CardTitle>
          <CardDescription>Choose customer or supplier and date range to view their khata</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Party Type</Label>
              <Select value={partyType} onValueChange={(v: string | null) => { setPartyType(v ?? "CUSTOMER"); setParties([]); setPartyId(""); setKhataData(null); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                  <SelectItem value="SUPPLIER">Supplier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Search {partyType === "CUSTOMER" ? "Customer" : "Supplier"}</Label>
              <div className="flex gap-2">
                <Input placeholder="Name or phone..." value={partySearch} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPartySearch(e.target.value)} onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && searchParties()} />
                <Button variant="outline" size="icon" onClick={searchParties}><Search className="h-4 w-4" /></Button>
              </div>
            </div>
            {parties.length > 0 && (
              <div>
                <Label>Select Party</Label>
                <Select value={partyId} onValueChange={(v: string | null) => setPartyId(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Choose..." /></SelectTrigger>
                  <SelectContent>
                    {parties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} {p.phone ? `(${p.phone})` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>From Date</Label>
              <Input type="date" value={fromDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromDate(e.target.value)} />
            </div>
            <div>
              <Label>To Date</Label>
              <Input type="date" value={toDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToDate(e.target.value)} />
            </div>
          </div>
          <Button className="mt-4" onClick={loadKhata} disabled={!partyId || loading}>
            {loading ? "Loading..." : "View Khata"}
          </Button>
        </CardContent>
      </Card>

      {khataData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <User className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Party</p>
                    <p className="text-lg font-bold">{khataData.party.name}</p>
                    <Badge variant="outline">{khataData.party.type}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <ArrowUpRight className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Debit</p>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(khataData.totalDebit)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <ArrowDownRight className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Credit</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(khataData.totalCredit)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Closing Balance</p>
                    <p className="text-xl font-bold">{formatCurrency(khataData.closingBalance)} <Badge className={khataData.closingBalanceType === "DR" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}>{khataData.closingBalanceType}</Badge></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ledger Entries</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm"><Printer className="h-4 w-4 mr-1" /> Print</Button>
                  <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Export</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {khataData.entries.map((entry, i) => (
                    <TableRow key={i} className={entry.type === "OPENING" ? "bg-gray-50 font-semibold" : ""}>
                      <TableCell>{new Date(entry.date).toLocaleDateString("en-PK")}</TableCell>
                      <TableCell>{getTypeBadge(entry.type)}</TableCell>
                      <TableCell className="font-mono text-sm">{entry.reference}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell className="text-right font-mono">{entry.debit > 0 ? formatCurrency(entry.debit) : "-"}</TableCell>
                      <TableCell className="text-right font-mono">{entry.credit > 0 ? formatCurrency(entry.credit) : "-"}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {formatCurrency(entry.balance)} <span className={entry.balanceType === "DR" ? "text-red-600" : "text-green-600"}>{entry.balanceType}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {khataData.entries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No transactions found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
