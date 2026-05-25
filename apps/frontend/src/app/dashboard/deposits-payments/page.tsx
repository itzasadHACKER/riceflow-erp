"use client";

import { useState } from "react";
import { Landmark, CreditCard, Plus, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { todayISO, formatCurrency } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface BankAccount { id: string; bankName: string; accountNumber: string; accountName: string; }
interface Customer { id: string; name: string; }
interface Supplier { id: string; name: string; }

export default function DepositsPaymentsPage() {
  const [depositOpen, setDepositOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [partnerType, setPartnerType] = useState("CUSTOMER");

  const { data: bankAccounts = [] } = useApiList<BankAccount>(["dp-banks"], "/finance/bank-accounts");
  const { data: customers = [] } = useApiList<Customer>(["dp-customers"], "/sales/customers");
  const { data: suppliers = [] } = useApiList<Supplier>(["dp-suppliers"], "/procurement/suppliers");

  const createDeposit = useApiMutation("/sales-enhanced/bank-deposits", "post");
  const createPayment = useApiMutation("/sales-enhanced/payments", "post");

  const banks = Array.isArray(bankAccounts) ? bankAccounts : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Bank Deposits & Payments" description="Record bank deposits, cash deposits, and customer/vendor payments with automatic JE posting" />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Bank Accounts" value={banks.length} icon={Landmark} description="Active accounts" />
        <StatCard title="Deposits" value={0} icon={ArrowDownLeft} description="Bank & cash deposits" />
        <StatCard title="Payments" value={0} icon={ArrowUpRight} description="Customer receipts & vendor payments" />
      </div>

      <Tabs defaultValue="deposits" className="space-y-4">
        <TabsList>
          <TabsTrigger value="deposits">Bank / Cash Deposits</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="deposits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Landmark className="h-5 w-5" />Bank & Cash Deposits</span>
                <Button onClick={() => setDepositOpen(true)}><Plus className="mr-2 h-4 w-4" />New Deposit</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Deposits transfer cash from Cash in Hand (1110) to Bank (1120) with automatic journal entry.</p>
              <div className="mt-4 rounded-lg border p-4 bg-blue-50">
                <p className="text-sm font-medium">How it works:</p>
                <p className="text-sm text-muted-foreground mt-1">Dr. Bank Account (1120) &mdash; Cr. Cash in Hand (1110)</p>
              </div>
            </CardContent>
          </Card>

          <FormDialog open={depositOpen} onOpenChange={setDepositOpen} title="Record Bank Deposit" onSubmit={async (e) => {
            e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement);
            await createDeposit.mutateAsync({ bankAccountId: fd.get("bankAccountId"), amount: Number(fd.get("amount")), date: fd.get("date"), depositType: fd.get("depositType"), reference: fd.get("reference"), narration: fd.get("narration") });
            toast.success("Deposit recorded with JE"); setDepositOpen(false);
          }}>
            <div className="grid gap-4">
              <div><Label>Bank Account</Label>
                <Select name="bankAccountId">
                  <SelectTrigger><SelectValue placeholder="Select bank account" /></SelectTrigger>
                  <SelectContent>{banks.map((b) => <SelectItem key={b.id} value={b.id}>{b.bankName} - {b.accountNumber}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Amount</Label><Input name="amount" type="number" step="0.01" required /></div>
                <div><Label>Date</Label><Input name="date" type="date" defaultValue={todayISO()} /></div>
              </div>
              <div><Label>Deposit Type</Label>
                <Select name="depositType">
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash Deposit</SelectItem>
                    <SelectItem value="CHEQUE">Cheque Deposit</SelectItem>
                    <SelectItem value="TRANSFER">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Reference</Label><Input name="reference" placeholder="Optional reference number" /></div>
              <div><Label>Narration</Label><Textarea name="narration" /></div>
            </div>
          </FormDialog>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Payments</span>
                <Button onClick={() => setPaymentOpen(true)}><Plus className="mr-2 h-4 w-4" />Record Payment</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Record customer receipts or vendor payments. Automatically creates journal entries and updates invoice status.</p>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                <div className="rounded-lg border p-3 bg-green-50">
                  <p className="text-sm font-medium text-green-800">Customer Receipt</p>
                  <p className="text-xs text-green-600">Dr. Cash/Bank &mdash; Cr. Accounts Receivable</p>
                </div>
                <div className="rounded-lg border p-3 bg-orange-50">
                  <p className="text-sm font-medium text-orange-800">Vendor Payment</p>
                  <p className="text-xs text-orange-600">Dr. Accounts Payable &mdash; Cr. Cash/Bank</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <FormDialog open={paymentOpen} onOpenChange={setPaymentOpen} title="Record Payment" onSubmit={async (e) => {
            e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement);
            await createPayment.mutateAsync({ partnerType: fd.get("partnerType"), partnerId: fd.get("partnerId"), amount: Number(fd.get("amount")), date: fd.get("date"), paymentMethod: fd.get("paymentMethod"), reference: fd.get("reference"), bankAccountId: fd.get("bankAccountId") });
            toast.success("Payment recorded with JE"); setPaymentOpen(false);
          }}>
            <div className="grid gap-4">
              <div><Label>Partner Type</Label>
                <Select name="partnerType" onValueChange={(v: any) => v && setPartnerType(String(v))}>
                  <SelectTrigger><SelectValue placeholder="Customer or Vendor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOMER">Customer (Receipt)</SelectItem>
                    <SelectItem value="VENDOR">Vendor (Payment)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>{partnerType === "CUSTOMER" ? "Customer" : "Supplier"}</Label>
                <Select name="partnerId">
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {partnerType === "CUSTOMER"
                      ? customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)
                      : suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Amount</Label><Input name="amount" type="number" step="0.01" required /></div>
                <div><Label>Date</Label><Input name="date" type="date" defaultValue={todayISO()} /></div>
              </div>
              <div><Label>Payment Method</Label>
                <Select name="paymentMethod">
                  <SelectTrigger><SelectValue placeholder="Method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="BANK">Bank Transfer</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Bank Account (if bank payment)</Label>
                <Select name="bankAccountId">
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>{banks.map((b) => <SelectItem key={b.id} value={b.id}>{b.bankName} - {b.accountNumber}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Reference</Label><Input name="reference" placeholder="Payment reference" /></div>
            </div>
          </FormDialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
