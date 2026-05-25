"use client";

import { useState } from "react";
import { Truck, Users, Fuel, Plus, Route } from "lucide-react";
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
import { generateNumber, formatCurrency, formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface Vehicle { id: string; registrationNumber: string; type: string; capacity: number; status: string; }
interface Driver { id: string; name: string; licenseNumber: string; phone: string; isActive: boolean; }
interface FuelLog { id: string; vehicleNumber: string; date: string; liters: number; amount: number; odometer: number; }

const vehicleColumns: Column<Vehicle>[] = [
  { key: "registrationNumber", header: "Registration", render: (item) => <span className="font-mono font-medium text-primary">{item.registrationNumber}</span> },
  {
    key: "type",
    header: "Type",
    render: (item) => {
      const colors: Record<string, string> = { TRUCK: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", TRAILER: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200", PICKUP: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200", VAN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" };
      return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[item.type] ?? ""}`}>{item.type}</span>;
    },
  },
  { key: "capacity", header: "Capacity (MT)", className: "text-right", render: (item) => <span className="font-mono">{item.capacity}</span> },
  {
    key: "status",
    header: "Status",
    render: (item) => {
      const colors: Record<string, string> = { AVAILABLE: "bg-emerald-600", IN_USE: "bg-blue-600", MAINTENANCE: "bg-amber-600" };
      return <Badge variant={item.status === "AVAILABLE" ? "default" : "secondary"} className={colors[item.status] ?? ""}>{item.status}</Badge>;
    },
  },
];

const driverColumns: Column<Driver>[] = [
  { key: "name", header: "Driver Name" },
  { key: "licenseNumber", header: "License #", render: (item) => <span className="font-mono">{item.licenseNumber}</span> },
  { key: "phone", header: "Phone" },
  { key: "isActive", header: "Status", render: (item) => <Badge variant={item.isActive ? "default" : "secondary"} className={item.isActive ? "bg-emerald-600" : ""}>{item.isActive ? "Active" : "Inactive"}</Badge> },
];

const fuelColumns: Column<FuelLog>[] = [
  { key: "vehicleNumber", header: "Vehicle" },
  { key: "date", header: "Date", render: (item) => formatDate(item.date) },
  { key: "liters", header: "Liters", className: "text-right", render: (item) => <span className="font-mono">{item.liters}</span> },
  { key: "amount", header: "Amount", className: "text-right", render: (item) => <span className="font-mono">{formatCurrency(item.amount)}</span> },
  { key: "odometer", header: "Odometer", className: "text-right", render: (item) => <span className="font-mono">{item.odometer?.toLocaleString()} km</span> },
];

export default function TransportPage() {
  const [showCreateVehicle, setShowCreateVehicle] = useState(false);
  const [vehForm, setVehForm] = useState({ registrationNumber: "", type: "TRUCK", capacity: "" });

  const { data: vehicles = [], isLoading: vehLoading } = useApiList<Vehicle>(["vehicles"], "/transport/vehicles");
  const { data: drivers = [], isLoading: drvLoading } = useApiList<Driver>(["drivers"], "/transport/drivers");
  const { data: fuelLogs = [], isLoading: fuelLoading } = useApiList<FuelLog>(["fuel-logs"], "/transport/fuel-logs");

  const createVehMutation = useApiMutation<Vehicle, unknown>("/transport/vehicles", "post", [["vehicles"]]);

  const totalFuelCost = fuelLogs.reduce((s, f) => s + Number(f.amount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Transport & Logistics" description="Fleet management, drivers, fuel tracking, and route planning" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Vehicles" value={vehicles.length} icon={Truck} description={`${vehicles.filter((v) => v.status === "AVAILABLE").length} available`} />
        <StatCard title="Drivers" value={drivers.length} icon={Users} description={`${drivers.filter((d) => d.isActive).length} active`} />
        <StatCard title="Fuel Logs" value={fuelLogs.length} icon={Fuel} />
        <StatCard title="Fuel Cost" value={formatCurrency(totalFuelCost)} icon={Route} />
      </div>

      <Tabs defaultValue="vehicles">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="vehicles" className="gap-1.5"><Truck className="size-3.5" />Vehicles</TabsTrigger>
          <TabsTrigger value="drivers" className="gap-1.5"><Users className="size-3.5" />Drivers</TabsTrigger>
          <TabsTrigger value="fuel" className="gap-1.5"><Fuel className="size-3.5" />Fuel Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="space-y-4 mt-4">
          <DataTable
            columns={vehicleColumns}
            data={vehicles as unknown as Vehicle[]}
            isLoading={vehLoading}
            emptyMessage="No vehicles yet."
            searchPlaceholder="Search vehicles..."
            actions={
              <Button size="sm" className="gap-1.5" onClick={() => setShowCreateVehicle(true)}>
                <Plus className="size-3.5" />
                New Vehicle
              </Button>
            }
          />
        </TabsContent>

        <TabsContent value="drivers" className="space-y-4 mt-4">
          <DataTable columns={driverColumns} data={drivers as unknown as Driver[]} isLoading={drvLoading} emptyMessage="No drivers yet." searchPlaceholder="Search drivers..." />
        </TabsContent>

        <TabsContent value="fuel" className="space-y-4 mt-4">
          <DataTable columns={fuelColumns} data={fuelLogs as unknown as FuelLog[]} isLoading={fuelLoading} emptyMessage="No fuel logs yet." searchPlaceholder="Search fuel logs..." />
        </TabsContent>
      </Tabs>

      <FormDialog
        open={showCreateVehicle}
        onOpenChange={setShowCreateVehicle}
        title="Add Vehicle"
        description={`Vehicle # ${generateNumber("vehicle", vehicles.length)}`}
        onSubmit={(e) => {
          e.preventDefault();
          createVehMutation.mutate({ ...vehForm, capacity: Number(vehForm.capacity) }, {
            onSuccess: () => { setShowCreateVehicle(false); toast.success("Vehicle added"); setVehForm({ registrationNumber: "", type: "TRUCK", capacity: "" }); },
          });
        }}
        isLoading={createVehMutation.isPending}
      >
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider">Registration Number</Label>
          <Input value={vehForm.registrationNumber} onChange={(e) => setVehForm((p) => ({ ...p, registrationNumber: e.target.value }))} required placeholder="e.g. ABC-1234" className="font-mono" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Type</Label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={vehForm.type} onChange={(e) => setVehForm((p) => ({ ...p, type: e.target.value }))}>
              <option value="TRUCK">Truck</option>
              <option value="TRAILER">Trailer</option>
              <option value="PICKUP">Pickup</option>
              <option value="VAN">Van</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Capacity (MT)</Label>
            <Input type="number" min="0" value={vehForm.capacity} onChange={(e) => setVehForm((p) => ({ ...p, capacity: e.target.value }))} required placeholder="0" className="font-mono" />
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
