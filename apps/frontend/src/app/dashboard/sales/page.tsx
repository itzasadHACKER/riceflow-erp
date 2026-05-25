"use client";

import { useState } from "react";
import { ShoppingCart, Users, FileText, Truck, Plus, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { LineItemsTable, type LineItem } from "@/components/shared/line-items-table";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { generateNumber, todayISO, formatCurrency, formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  creditLimit: string;
}

interface SalesOrder {
  id: string;
  orderNumber: string;
  date: string;
  customerName: string;
  status: string;
  totalAmount: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  totalAmount: string;
  isPosted: boolean;
}

interface Challan {
  id: string;
  challanNumber: string;
  date: string;
  customerName: string;
  status: string;
}

const customerColumns: Column<Customer>[] = [
  { key: "name", header: "Customer Name" },
  { key: "email", header: "Email" },
  { key: "phone", header: "Phone" },
  { key: "address", header: "Address" },
  {
    key: "creditLimit",
    header: "Credit Limit",
    render: (item) => formatCurrency(item.creditLimit || 0),
  },
];

const orderColumns: Column<SalesOrder>[] = [
  { key: "orderNumber", header: "Order #", render: (item) => <span className="font-mono font-medium text-primary">{item.orderNumber}</span> },
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
  { key: "customerName", header: "Customer" },
  { key: "totalAmount", header: "Amount", render: (item) => <span className="font-mono">{formatCurrency(item.totalAmount)}</span> },
  {
    key: "status",
    header: "Status",
    render: (item) => {
      const colors: Record<string, string> = {
        DRAFT: "secondary",
        CONFIRMED: "default",
        DISPATCHED: "outline",
        DELIVERED: "default",
        CANCELLED: "destructive",
      };
      return <Badge variant={(colors[item.status] ?? "secondary") as "default" | "secondary" | "outline" | "destructive"}>{item.status}</Badge>;
    },
  },
];

const invoiceColumns: Column<Invoice>[] = [
  { key: "invoiceNumber", header: "Invoice #", render: (item) => <span className="font-mono font-medium text-primary">{item.invoiceNumber}</span> },
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
  { key: "customerName", header: "Customer" },
  { key: "totalAmount", header: "Amount", render: (item) => <span className="font-mono font-semibold">{formatCurrency(item.totalAmount)}</span> },
  {
    key: "isPosted",
    header: "Status",
    render: (item) => (
      <Badge variant={item.isPosted ? "default" : "secondary"} className={item.isPosted ? "bg-emerald-600 hover:bg-emerald-700" : ""}>
        {item.isPosted ? "Posted" : "Draft"}
      </Badge>
    ),
  },
];

const challanColumns: Column<Challan>[] = [
  { key: "challanNumber", header: "Challan #", render: (item) => <span className="font-mono font-medium">{item.challanNumber}</span> },
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
  { key: "customerName", header: "Customer" },
  {
    key: "status",
    header: "Status",
    render: (item) => (
      <Badge variant={item.status === "DELIVERED" ? "default" : "secondary"} className={item.status === "DELIVERED" ? "bg-emerald-600 hover:bg-emerald-700" : ""}>
        {item.status}
      </Badge>
    ),
  },
];

export default function SalesPage() {
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [custForm, setCustForm] = useState({ name: "", email: "", phone: "", address: "", creditLimit: "" });
  const [invoiceLines, setInvoiceLines] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", quantity: 1, rate: 0, amount: 0, taxPercent: 0, taxAmount: 0, total: 0 },
  ]);
  const [invoiceForm, setInvoiceForm] = useState({ customerId: "", date: todayISO(), dueDate: "", notes: "", termsAndConditions: "Payment due within 30 days of invoice date.\nGoods once sold will not be taken back.\nSubject to local jurisdiction." });
  const [orderForm, setOrderForm] = useState({ customerId: "", date: todayISO(), notes: "" });
  const [orderLines, setOrderLines] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", quantity: 1, rate: 0, amount: 0, taxPercent: 0, taxAmount: 0, total: 0 },
  ]);

  const { data: customers = [], isLoading: custLoading } = useApiList<Customer>(["customers"], "/sales/customers");
  const { data: orders = [], isLoading: ordersLoading } = useApiList<SalesOrder>(["sales-orders"], "/sales/orders");
  const { data: invoices = [], isLoading: invLoading } = useApiList<Invoice>(["invoices"], "/sales/invoices");
  const { data: challans = [], isLoading: challanLoading } = useApiList<Challan>(["challans"], "/sales/challans");

  const createCustMutation = useApiMutation<Customer, typeof custForm>("/sales/customers", "post", [["customers"]]);
  const createInvoiceMutation = useApiMutation<Invoice, unknown>("/sales/invoices", "post", [["invoices"]]);
  const createOrderMutation = useApiMutation<SalesOrder, unknown>("/sales/orders", "post", [["sales-orders"]]);

  const totalRevenue = invoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Sales & Distribution" description="Manage customers, sales orders, invoices, and delivery challans" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Customers" value={customers.length} icon={Users} />
        <StatCard title="Sales Orders" value={orders.length} icon={ShoppingCart} description={`${orders.filter((o) => o.status === "CONFIRMED").length} confirmed`} />
        <StatCard title="Invoices" value={invoices.length} icon={FileText} description={`${invoices.filter((i) => i.isPosted).length} posted`} />
        <StatCard title="Revenue" value={formatCurrency(totalRevenue)} icon={TrendingUp} />
      </div>

      <Tabs defaultValue="invoices">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="invoices" className="gap-1.5"><FileText className="size-3.5" />Invoices</TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5"><ShoppingCart className="size-3.5" />Orders</TabsTrigger>
          <TabsTrigger value="customers" className="gap-1.5"><Users className="size-3.5" />Customers</TabsTrigger>
          <TabsTrigger value="challans" className="gap-1.5"><Truck className="size-3.5" />Challans</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4 mt-4">
          <DataTable
            columns={invoiceColumns}
            data={invoices as unknown as Invoice[]}
            isLoading={invLoading}
            emptyMessage="No invoices yet. Create your first invoice."
            searchPlaceholder="Search invoices..."
            actions={
              <Button onClick={() => setShowCreateInvoice(true)} size="sm" className="gap-1.5">
                <Plus className="size-3.5" />
                New Invoice
              </Button>
            }
          />
        </TabsContent>

        <TabsContent value="orders" className="space-y-4 mt-4">
          <DataTable
            columns={orderColumns}
            data={orders as unknown as SalesOrder[]}
            isLoading={ordersLoading}
            emptyMessage="No sales orders yet."
            searchPlaceholder="Search orders..."
            actions={
              <Button onClick={() => setShowCreateOrder(true)} size="sm" className="gap-1.5">
                <Plus className="size-3.5" />
                New Order
              </Button>
            }
          />
        </TabsContent>

        <TabsContent value="customers" className="space-y-4 mt-4">
          <DataTable
            columns={customerColumns}
            data={customers as unknown as Customer[]}
            isLoading={custLoading}
            emptyMessage="No customers yet. Add your first customer."
            searchPlaceholder="Search customers..."
            actions={
              <Button onClick={() => setShowCreateCustomer(true)} size="sm" className="gap-1.5">
                <Plus className="size-3.5" />
                New Customer
              </Button>
            }
          />
        </TabsContent>

        <TabsContent value="challans" className="space-y-4 mt-4">
          <DataTable
            columns={challanColumns}
            data={challans as unknown as Challan[]}
            isLoading={challanLoading}
            emptyMessage="No delivery challans yet."
            searchPlaceholder="Search challans..."
          />
        </TabsContent>
      </Tabs>

      {/* Create Invoice Dialog */}
      <FormDialog
        open={showCreateInvoice}
        onOpenChange={setShowCreateInvoice}
        title="Create Sales Invoice"
        description={`Invoice # ${generateNumber("invoice", invoices.length)}`}
        size="xl"
        onSubmit={(e) => {
          e.preventDefault();
          const subtotal = invoiceLines.reduce((s, l) => s + l.amount, 0);
          const tax = invoiceLines.reduce((s, l) => s + l.taxAmount, 0);
          createInvoiceMutation.mutate(
            {
              ...invoiceForm,
              subtotal,
              taxAmount: tax,
              totalAmount: subtotal + tax,
              items: invoiceLines.map((l) => ({
                description: l.description,
                quantity: l.quantity,
                rate: l.rate,
                taxPercent: l.taxPercent,
              })),
            },
            {
              onSuccess: () => {
                setShowCreateInvoice(false);
                toast.success("Invoice created successfully");
                setInvoiceLines([{ id: crypto.randomUUID(), description: "", quantity: 1, rate: 0, amount: 0, taxPercent: 0, taxAmount: 0, total: 0 }]);
                setInvoiceForm({ customerId: "", date: todayISO(), dueDate: "", notes: "", termsAndConditions: invoiceForm.termsAndConditions });
              },
            }
          );
        }}
        isLoading={createInvoiceMutation.isPending}
        submitLabel="Create Invoice"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Customer</Label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={invoiceForm.customerId} onChange={(e) => setInvoiceForm((p) => ({ ...p, customerId: e.target.value }))} required>
              <option value="">Select customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Invoice Date</Label>
              <Input type="date" value={invoiceForm.date} onChange={(e) => setInvoiceForm((p) => ({ ...p, date: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Due Date</Label>
              <Input type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm((p) => ({ ...p, dueDate: e.target.value }))} />
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <Label className="text-xs font-semibold uppercase tracking-wider mb-3 block">Line Items</Label>
          <LineItemsTable items={invoiceLines} onChange={setInvoiceLines} />
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Notes</Label>
              <Textarea value={invoiceForm.notes} onChange={(e) => setInvoiceForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Internal notes..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Terms & Conditions</Label>
              <Textarea value={invoiceForm.termsAndConditions} onChange={(e) => setInvoiceForm((p) => ({ ...p, termsAndConditions: e.target.value }))} rows={3} />
            </div>
          </div>
          <Card className="bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">{formatCurrency(invoiceLines.reduce((s, l) => s + l.amount, 0))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-mono">{formatCurrency(invoiceLines.reduce((s, l) => s + l.taxAmount, 0))}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>Grand Total</span>
                <span className="font-mono text-primary">{formatCurrency(invoiceLines.reduce((s, l) => s + l.total, 0))}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </FormDialog>

      {/* Create Sales Order Dialog */}
      <FormDialog
        open={showCreateOrder}
        onOpenChange={setShowCreateOrder}
        title="Create Sales Order"
        description={`Order # ${generateNumber("sales-order", orders.length)}`}
        size="xl"
        onSubmit={(e) => {
          e.preventDefault();
          const total = orderLines.reduce((s, l) => s + l.total, 0);
          createOrderMutation.mutate(
            {
              ...orderForm,
              totalAmount: total,
              items: orderLines.map((l) => ({
                description: l.description,
                quantity: l.quantity,
                rate: l.rate,
                taxPercent: l.taxPercent,
              })),
            },
            {
              onSuccess: () => {
                setShowCreateOrder(false);
                toast.success("Sales order created successfully");
                setOrderLines([{ id: crypto.randomUUID(), description: "", quantity: 1, rate: 0, amount: 0, taxPercent: 0, taxAmount: 0, total: 0 }]);
                setOrderForm({ customerId: "", date: todayISO(), notes: "" });
              },
            }
          );
        }}
        isLoading={createOrderMutation.isPending}
        submitLabel="Create Order"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Customer</Label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={orderForm.customerId} onChange={(e) => setOrderForm((p) => ({ ...p, customerId: e.target.value }))} required>
              <option value="">Select customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Order Date</Label>
            <Input type="date" value={orderForm.date} onChange={(e) => setOrderForm((p) => ({ ...p, date: e.target.value }))} required />
          </div>
        </div>
        <Separator />
        <Label className="text-xs font-semibold uppercase tracking-wider">Line Items</Label>
        <LineItemsTable items={orderLines} onChange={setOrderLines} />
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider">Notes</Label>
          <Textarea value={orderForm.notes} onChange={(e) => setOrderForm((p) => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Order notes..." />
        </div>
      </FormDialog>

      {/* Create Customer Dialog */}
      <FormDialog
        open={showCreateCustomer}
        onOpenChange={setShowCreateCustomer}
        title="Add Customer"
        description="Add a new customer to the system"
        onSubmit={(e) => {
          e.preventDefault();
          createCustMutation.mutate(
            { ...custForm, creditLimit: Number(custForm.creditLimit) || 0 } as unknown as typeof custForm,
            {
              onSuccess: () => {
                setShowCreateCustomer(false);
                toast.success("Customer added successfully");
                setCustForm({ name: "", email: "", phone: "", address: "", creditLimit: "" });
              },
            }
          );
        }}
        isLoading={createCustMutation.isPending}
        submitLabel="Add Customer"
      >
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider">Customer Name</Label>
          <Input value={custForm.name} onChange={(e) => setCustForm((p) => ({ ...p, name: e.target.value }))} required placeholder="Company or individual name" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Email</Label>
            <Input type="email" value={custForm.email} onChange={(e) => setCustForm((p) => ({ ...p, email: e.target.value }))} placeholder="email@example.com" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Phone</Label>
            <Input value={custForm.phone} onChange={(e) => setCustForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+92-300-0000000" />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider">Address</Label>
          <Textarea value={custForm.address} onChange={(e) => setCustForm((p) => ({ ...p, address: e.target.value }))} rows={2} placeholder="Full address" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider">Credit Limit (PKR)</Label>
          <Input type="number" value={custForm.creditLimit} onChange={(e) => setCustForm((p) => ({ ...p, creditLimit: e.target.value }))} placeholder="0" />
        </div>
      </FormDialog>
    </div>
  );
}
