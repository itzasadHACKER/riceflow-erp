"use client";

import { useState } from "react";
import { ShoppingCart, Users, FileText, Truck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";

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
  status: string;
  totalAmount: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  totalAmount: string;
  isPosted: boolean;
}

interface Challan {
  id: string;
  challanNumber: string;
  date: string;
  status: string;
}

const customerColumns: Column<Customer>[] = [
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  { key: "phone", header: "Phone" },
  { key: "address", header: "Address" },
];

const orderColumns: Column<SalesOrder>[] = [
  { key: "orderNumber", header: "Order #" },
  { key: "date", header: "Date", render: (item) => new Date(item.date).toLocaleDateString() },
  { key: "totalAmount", header: "Amount", render: (item) => Number(item.totalAmount).toLocaleString("en-PK", { style: "currency", currency: "PKR" }) },
  { key: "status", header: "Status", render: (item) => <Badge variant={item.status === "CONFIRMED" ? "default" : "secondary"}>{item.status}</Badge> },
];

const invoiceColumns: Column<Invoice>[] = [
  { key: "invoiceNumber", header: "Invoice #" },
  { key: "date", header: "Date", render: (item) => new Date(item.date).toLocaleDateString() },
  { key: "totalAmount", header: "Amount", render: (item) => Number(item.totalAmount).toLocaleString("en-PK", { style: "currency", currency: "PKR" }) },
  { key: "isPosted", header: "Status", render: (item) => <Badge variant={item.isPosted ? "default" : "secondary"}>{item.isPosted ? "Posted" : "Draft"}</Badge> },
];

const challanColumns: Column<Challan>[] = [
  { key: "challanNumber", header: "Challan #" },
  { key: "date", header: "Date", render: (item) => new Date(item.date).toLocaleDateString() },
  { key: "status", header: "Status", render: (item) => <Badge variant={item.status === "DELIVERED" ? "default" : "secondary"}>{item.status}</Badge> },
];

export default function SalesPage() {
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [custForm, setCustForm] = useState({ name: "", email: "", phone: "", address: "" });

  const { data: customers = [], isLoading: custLoading } = useApiList<Customer>(["customers"], "/sales/customers");
  const { data: orders = [], isLoading: ordersLoading } = useApiList<SalesOrder>(["sales-orders"], "/sales/orders");
  const { data: invoices = [], isLoading: invLoading } = useApiList<Invoice>(["invoices"], "/sales/invoices");
  const { data: challans = [], isLoading: challanLoading } = useApiList<Challan>(["challans"], "/sales/challans");

  const createCustMutation = useApiMutation<Customer, typeof custForm>("/sales/customers", "post", [["customers"]]);

  return (
    <div className="space-y-6">
      <PageHeader title="Sales & Distribution" description="Customers, orders, invoices, and delivery challans" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Customers" value={customers.length} icon={Users} />
        <StatCard title="Sales Orders" value={orders.length} icon={ShoppingCart} description={`${orders.filter((o) => o.status === "CONFIRMED").length} confirmed`} />
        <StatCard title="Invoices" value={invoices.length} icon={FileText} />
        <StatCard title="Challans" value={challans.length} icon={Truck} />
      </div>

      <Tabs defaultValue="customers">
        <TabsList>
          <TabsTrigger value="customers"><Users className="mr-2 size-4" />Customers</TabsTrigger>
          <TabsTrigger value="orders"><ShoppingCart className="mr-2 size-4" />Orders</TabsTrigger>
          <TabsTrigger value="invoices"><FileText className="mr-2 size-4" />Invoices</TabsTrigger>
          <TabsTrigger value="challans"><Truck className="mr-2 size-4" />Challans</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-4">
          <Button onClick={() => setShowCreateCustomer(true)}>+ New Customer</Button>
          <DataTable columns={customerColumns} data={customers as unknown as Customer[]} isLoading={custLoading} />
        </TabsContent>
        <TabsContent value="orders" className="space-y-4">
          <DataTable columns={orderColumns} data={orders as unknown as SalesOrder[]} isLoading={ordersLoading} emptyMessage="No sales orders." />
        </TabsContent>
        <TabsContent value="invoices" className="space-y-4">
          <DataTable columns={invoiceColumns} data={invoices as unknown as Invoice[]} isLoading={invLoading} emptyMessage="No invoices." />
        </TabsContent>
        <TabsContent value="challans" className="space-y-4">
          <DataTable columns={challanColumns} data={challans as unknown as Challan[]} isLoading={challanLoading} emptyMessage="No delivery challans." />
        </TabsContent>
      </Tabs>

      <FormDialog open={showCreateCustomer} onOpenChange={setShowCreateCustomer} title="Add Customer" onSubmit={(e) => { e.preventDefault(); createCustMutation.mutate(custForm, { onSuccess: () => { setShowCreateCustomer(false); setCustForm({ name: "", email: "", phone: "", address: "" }); } }); }} isLoading={createCustMutation.isPending}>
        <div className="space-y-2"><Label>Name</Label><Input value={custForm.name} onChange={(e) => setCustForm((p) => ({ ...p, name: e.target.value }))} required /></div>
        <div className="space-y-2"><Label>Email</Label><Input type="email" value={custForm.email} onChange={(e) => setCustForm((p) => ({ ...p, email: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Phone</Label><Input value={custForm.phone} onChange={(e) => setCustForm((p) => ({ ...p, phone: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Address</Label><Input value={custForm.address} onChange={(e) => setCustForm((p) => ({ ...p, address: e.target.value }))} /></div>
      </FormDialog>
    </div>
  );
}
