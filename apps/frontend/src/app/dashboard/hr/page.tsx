"use client";

import { useState } from "react";
import { Users, Clock, CalendarDays, Banknote, FileText } from "lucide-react";
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

interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  departmentId: string;
  baseSalary: number;
  status: string;
  joinDate: string;
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
  reason: string;
}

interface SalarySlip {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  baseSalary: string;
  netSalary: string;
  status: string;
}

const employeeColumns: Column<Employee>[] = [
  { key: "employeeCode", header: "Code" },
  { key: "firstName", header: "First Name" },
  { key: "lastName", header: "Last Name" },
  { key: "email", header: "Email" },
  { key: "designation", header: "Designation" },
  {
    key: "baseSalary",
    header: "Base Salary",
    render: (item) =>
      Number(item.baseSalary).toLocaleString("en-PK", { style: "currency", currency: "PKR" }),
  },
  {
    key: "status",
    header: "Status",
    render: (item) => (
      <Badge variant={item.status === "ACTIVE" ? "default" : "secondary"}>
        {item.status}
      </Badge>
    ),
  },
];

const leaveColumns: Column<LeaveRequest>[] = [
  { key: "leaveType", header: "Type" },
  {
    key: "startDate",
    header: "From",
    render: (item) => new Date(item.startDate).toLocaleDateString(),
  },
  {
    key: "endDate",
    header: "To",
    render: (item) => new Date(item.endDate).toLocaleDateString(),
  },
  { key: "reason", header: "Reason" },
  {
    key: "status",
    header: "Status",
    render: (item) => (
      <Badge
        variant={
          item.status === "APPROVED"
            ? "default"
            : item.status === "REJECTED"
              ? "destructive"
              : "secondary"
        }
      >
        {item.status}
      </Badge>
    ),
  },
];

const salaryColumns: Column<SalarySlip>[] = [
  { key: "month", header: "Month" },
  { key: "year", header: "Year" },
  {
    key: "baseSalary",
    header: "Base Salary",
    render: (item) => Number(item.baseSalary).toLocaleString("en-PK", { style: "currency", currency: "PKR" }),
  },
  {
    key: "netSalary",
    header: "Net Salary",
    render: (item) => Number(item.netSalary).toLocaleString("en-PK", { style: "currency", currency: "PKR" }),
  },
  {
    key: "status",
    header: "Status",
    render: (item) => <Badge variant={item.status === "PAID" ? "default" : "secondary"}>{item.status}</Badge>,
  },
];

export default function HRPage() {
  const [showCreateEmployee, setShowCreateEmployee] = useState(false);
  const [empForm, setEmpForm] = useState({
    employeeCode: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    designation: "",
    baseSalary: "",
    joinDate: new Date().toISOString().split("T")[0],
  });

  const { data: employees = [], isLoading: empLoading } =
    useApiList<Employee>(["employees"], "/hr/employees");
  const { data: leaves = [], isLoading: leavesLoading } =
    useApiList<LeaveRequest>(["leaves"], "/hr/leaves");
  const { data: salarySlips = [], isLoading: salaryLoading } =
    useApiList<SalarySlip>(["salary-slips"], "/hr/salary-slips");

  const createEmpMutation = useApiMutation<Employee, unknown>(
    "/hr/employees",
    "post",
    [["employees"]]
  );

  return (
    <div className="space-y-6">
      <PageHeader title="HR & Payroll" description="Manage employees, attendance, leaves, and payroll" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Employees" value={employees.length} icon={Users} description="Active workforce" />
        <StatCard title="Leave Requests" value={leaves.length} icon={CalendarDays} description={`${leaves.filter((l) => l.status === "PENDING").length} pending`} />
        <StatCard title="Salary Slips" value={salarySlips.length} icon={Banknote} description="This period" />
        <StatCard title="Attendance" value="—" icon={Clock} description="Today's records" />
      </div>

      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees"><Users className="mr-2 size-4" />Employees</TabsTrigger>
          <TabsTrigger value="leaves"><CalendarDays className="mr-2 size-4" />Leaves</TabsTrigger>
          <TabsTrigger value="payroll"><Banknote className="mr-2 size-4" />Payroll</TabsTrigger>
          <TabsTrigger value="attendance"><Clock className="mr-2 size-4" />Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4">
          <Button onClick={() => setShowCreateEmployee(true)}>+ New Employee</Button>
          <DataTable columns={employeeColumns} data={employees as unknown as Employee[]} isLoading={empLoading} emptyMessage="No employees found." />
        </TabsContent>

        <TabsContent value="leaves" className="space-y-4">
          <DataTable columns={leaveColumns} data={leaves as unknown as LeaveRequest[]} isLoading={leavesLoading} emptyMessage="No leave requests." />
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <DataTable columns={salaryColumns} data={salarySlips as unknown as SalarySlip[]} isLoading={salaryLoading} emptyMessage="No salary slips generated." />
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <div className="rounded-md border p-8 text-center text-muted-foreground">
            <Clock className="mx-auto mb-3 size-10" />
            <p className="font-medium">Attendance Tracking</p>
            <p className="text-sm">Record and view employee attendance here.</p>
          </div>
        </TabsContent>
      </Tabs>

      <FormDialog
        open={showCreateEmployee}
        onOpenChange={setShowCreateEmployee}
        title="Add Employee"
        onSubmit={(e) => {
          e.preventDefault();
          createEmpMutation.mutate(
            { ...empForm, baseSalary: Number(empForm.baseSalary) },
            { onSuccess: () => { setShowCreateEmployee(false); setEmpForm({ employeeCode: "", firstName: "", lastName: "", email: "", phone: "", designation: "", baseSalary: "", joinDate: new Date().toISOString().split("T")[0] }); } }
          );
        }}
        isLoading={createEmpMutation.isPending}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Employee Code</Label><Input value={empForm.employeeCode} onChange={(e) => setEmpForm((p) => ({ ...p, employeeCode: e.target.value }))} required placeholder="EMP-001" /></div>
          <div className="space-y-2"><Label>Join Date</Label><Input type="date" value={empForm.joinDate} onChange={(e) => setEmpForm((p) => ({ ...p, joinDate: e.target.value }))} required /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>First Name</Label><Input value={empForm.firstName} onChange={(e) => setEmpForm((p) => ({ ...p, firstName: e.target.value }))} required /></div>
          <div className="space-y-2"><Label>Last Name</Label><Input value={empForm.lastName} onChange={(e) => setEmpForm((p) => ({ ...p, lastName: e.target.value }))} required /></div>
        </div>
        <div className="space-y-2"><Label>Email</Label><Input type="email" value={empForm.email} onChange={(e) => setEmpForm((p) => ({ ...p, email: e.target.value }))} required /></div>
        <div className="space-y-2"><Label>Phone</Label><Input value={empForm.phone} onChange={(e) => setEmpForm((p) => ({ ...p, phone: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Designation</Label><Input value={empForm.designation} onChange={(e) => setEmpForm((p) => ({ ...p, designation: e.target.value }))} required /></div>
        <div className="space-y-2"><Label>Base Salary (PKR)</Label><Input type="number" value={empForm.baseSalary} onChange={(e) => setEmpForm((p) => ({ ...p, baseSalary: e.target.value }))} required placeholder="0" /></div>
      </FormDialog>
    </div>
  );
}
