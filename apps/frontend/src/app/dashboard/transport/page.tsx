"use client";

import { useState } from "react";
import { Truck, User, Fuel, Route } from "lucide-react";
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

interface Vehicle { id: string; registrationNumber: string; type: string; capacity: number; status: string; }
interface Driver { id: string; name: string; phone: string; licenseNumber: string; isActive: boolean; }
interface FuelLog { id: string; vehicleId: string; date: string; fuelType: string; quantity: number; amount: string; }

const vehicleColumns: Column<Vehicle>[] = [
  { key: "registrationNumber", header: "Registration #" },
  { key: "type", header: "Type", render: (item) => <Badge variant="outline">{item.type}</Badge> },
  { key: "capacity", header: "Capacity (tons)" },
  { key: "status", header: "Status", render: (item) => <Badge variant={item.status === "ACTIVE" ? "default" : "secondary"}>{item.status}</Badge> },
];

const driverColumns: Column<Driver>[] = [
  { key: "name", header: "Name" },
  { key: "phone", header: "Phone" },
  { key: "licenseNumber", header: "License #" },
  { key: "isActive", header: "Status", render: (item) => <Badge variant={item.isActive ? "default" : "secondary"}>{item.isActive ? "Active" : "Inactive"}</Badge> },
];

const fuelColumns: Column<FuelLog>[] = [
  { key: "date", header: "Date", render: (item) => new Date(item.date).toLocaleDateString() },
  { key: "fuelType", header: "Fuel Type" },
  { key: "quantity", header: "Qty (L)" },
  { key: "amount", header: "Amount", render: (item) => Number(item.amount).toLocaleString("en-PK", { style: "currency", currency: "PKR" }) },
];

export default function TransportPage() {
  const [showCreateVehicle, setShowCreateVehicle] = useState(false);
  const [vehForm, setVehForm] = useState({ registrationNumber: "", type: "TRUCK", capacity: "" });

  const { data: vehicles = [], isLoading: vehLoading } = useApiList<Vehicle>(["vehicles"], "/transport/vehicles");
  const { data: drivers = [], isLoading: drvLoading } = useApiList<Driver>(["drivers"], "/transport/drivers");
  const { data: fuelLogs = [], isLoading: fuelLoading } = useApiList<FuelLog>(["fuel-logs"], "/transport/fuel-logs");

  const createVehMutation = useApiMutation<Vehicle, unknown>("/transport/vehicles", "post", [["vehicles"]]);

  return (
    <div className="space-y-6">
      <PageHeader title="Transport & Logistics" description="Fleet management, drivers, fuel tracking, and routes" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Vehicles" value={vehicles.length} icon={Truck} />
        <StatCard title="Drivers" value={drivers.length} icon={User} />
        <StatCard title="Fuel Logs" value={fuelLogs.length} icon={Fuel} />
        <StatCard title="Routes" value="—" icon={Route} />
      </div>

      <Tabs defaultValue="vehicles">
        <TabsList>
          <TabsTrigger value="vehicles"><Truck className="mr-2 size-4" />Vehicles</TabsTrigger>
          <TabsTrigger value="drivers"><User className="mr-2 size-4" />Drivers</TabsTrigger>
          <TabsTrigger value="fuel"><Fuel className="mr-2 size-4" />Fuel Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="vehicles" className="space-y-4">
          <Button onClick={() => setShowCreateVehicle(true)}>+ New Vehicle</Button>
          <DataTable columns={vehicleColumns} data={vehicles as unknown as Vehicle[]} isLoading={vehLoading} />
        </TabsContent>
        <TabsContent value="drivers" className="space-y-4">
          <DataTable columns={driverColumns} data={drivers as unknown as Driver[]} isLoading={drvLoading} />
        </TabsContent>
        <TabsContent value="fuel" className="space-y-4">
          <DataTable columns={fuelColumns} data={fuelLogs as unknown as FuelLog[]} isLoading={fuelLoading} />
        </TabsContent>
      </Tabs>

      <FormDialog open={showCreateVehicle} onOpenChange={setShowCreateVehicle} title="Add Vehicle" onSubmit={(e) => { e.preventDefault(); createVehMutation.mutate({ ...vehForm, capacity: Number(vehForm.capacity) }, { onSuccess: () => { setShowCreateVehicle(false); setVehForm({ registrationNumber: "", type: "TRUCK", capacity: "" }); } }); }} isLoading={createVehMutation.isPending}>
        <div className="space-y-2"><Label>Registration #</Label><Input value={vehForm.registrationNumber} onChange={(e) => setVehForm((p) => ({ ...p, registrationNumber: e.target.value }))} required placeholder="ABC-1234" /></div>
        <div className="space-y-2"><Label>Type</Label><select className="w-full rounded-md border px-3 py-2 text-sm" value={vehForm.type} onChange={(e) => setVehForm((p) => ({ ...p, type: e.target.value }))}><option value="TRUCK">Truck</option><option value="TRAILER">Trailer</option><option value="PICKUP">Pickup</option><option value="VAN">Van</option></select></div>
        <div className="space-y-2"><Label>Capacity (tons)</Label><Input type="number" value={vehForm.capacity} onChange={(e) => setVehForm((p) => ({ ...p, capacity: e.target.value }))} placeholder="0" /></div>
      </FormDialog>
    </div>
  );
}
