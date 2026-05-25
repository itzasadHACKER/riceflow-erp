"use client";

import { useState } from "react";
import { Users, Clock, CalendarDays, Banknote, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { generateNumber, todayISO, formatCurrency, formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

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
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
  reason: string;
}

interface SalarySlip {
  id: string;
  employeeName: string;
  month: number;
  year: number;
  baseSalary: string;
  netSalary: string;
  status: string;
}

const employeeColumns: Column<Employee>[] = [
  { key: "employeeCode", header: "Code", render: (item) => <span className="font-mono font-medium text-primary">{item.employeeCode}</span> },
  { key: "firstName", header: "Name", render: (item) => <span className="font-medium">{item.firstName} {item.lastName}</span> },
  { key: "email", header: "Email" },
  { key: "designation", header: "Designation" },
  { key: "baseSalary", header: "Salary", className: "text-right", render: (item) => <span className="font-mono">{formatCurrency(item.baseSalary)}</span> },
  { key: "joinDate", header: "Join Date", render: (item) => formatDate(item.joinDate) },
  {
    key: "status",
    header: "Status",
    render: (item) => {
      const colors: Record<string, string> = { ACTIVE: "bg-emerald-600", INACTIVE: "", ON_LEAVE: "bg-amber-600", TERMINATED: "bg-red-600" };
      return <Badge variant={item.status === "ACTIVE" ? "default" : "secondary"} className={colors[item.status] ?? ""}>{item.status}</Badge>;
    },
  },
];

const leaveColumns: Column<LeaveRequest>[] = [
  { key: "employeeName", header: "Employee" },
  { key: "leaveType", header: "Type", render: (item) => <Badge variant="outline">{item.leaveType}</Badge> },
  { key: "startDate", header: "From", render: (item) => formatDate(item.startDate) },
  { key: "endDate", header: "To", render: (item) => formatDate(item.endDate) },
  {
    key: "status",
    header: "Status",
    render: (item) => {
      const variant = item.status === "APPROVED" ? "default" : item.status === "REJECTED" ? "destructive" : "secondary";
      return <Badge variant={variant} className={item.status === "APPROVED" ? "bg-emerald-600" : ""}>{item.status}</Badge>;
    },
  },
];

const salaryColumns: Column<SalarySlip>[] = [
  { key: "employeeName", header: "Employee" },
  { key: "month", header: "Period", render: (item) => `${String(item.month).padStart(2, "0")}/${item.year}` },
  { key: "baseSalary", header: "Base", className: "text-right", render: (item) => <span className="font-mono">{formatCurrency(item.baseSalary)}</span> },
  { key: "netSalary", header: "Net Pay", className: "text-right", render: (item) => <span className="font-mono font-semibold">{formatCurrency(item.netSalary)}</span> },
  {
    key: "status",
    header: "Status",
    render: (item) => {
      const colors: Record<string, string> = { DRAFT: "", CONFIRMED: "bg-blue-600", PAID: "bg-emerald-600" };
      return <Badge variant={item.status === "DRAFT" ? "secondary" : "default"} className={colors[item.status] ?? ""}>{item.status}</Badge>;
    },
  },
];

export default function HRPage() {
  const [showCreateEmployee, setShowCreateEmployee] = useState(false);
  const [empForm, setEmpForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", designation: "",
    baseSalary: "", joinDate: todayISO(), cnic: "", address: "",
  });

  const { data: employees = [], isLoading: empLoading } = useApiList<Employee>(["employees"], "/hr/employees");
  const { data: leaves = [], isLoading: leaveLoading } = useApiList<LeaveRequest>(["leaves"], "/hr/leaves");
  const { data: salaries = [], isLoading: salaryLoading } = useApiList<SalarySlip>(["salary-slips"], "/hr/salary-slips");

  const createEmpMutation = useApiMutation<Employee, unknown>("/hr/employees", "post", [["employees"]]);

  const totalPayroll = employees.reduce((s, e) => s + Number(e.baseSalary || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="HR & Payroll" description="Employee management, attendance, leave tracking, and payroll processing" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Employees" value={employees.length} icon={Users} description={`${employees.filter((e) => e.status === "ACTIVE").length} active`} />
        <StatCard title="Leave Requests" value={leaves.length} icon={CalendarDays} description={`${leaves.filter((l) => l.status === "PENDING").length} pending`} />
        <StatCard title="Salary Slips" value={salaries.length} icon={Banknote} description={`${salaries.filter((s) => s.status === "PAID").length} paid`} />
        <StatCard title="Monthly Payroll" value={formatCurrency(totalPayroll)} icon={Clock} />
      </div>

      <Tabs defaultValue="employees">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="employees" className="gap-1.5"><Users className="size-3.5" />Employees</TabsTrigger>
          <TabsTrigger value="leaves" className="gap-1.5"><CalendarDays className="size-3.5" />Leave</TabsTrigger>
          <TabsTrigger value="payroll" className="gap-1.5"><Banknote className="size-3.5" />Payroll</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4 mt-4">
          <DataTable
            columns={employeeColumns}
            data={employees as unknown as Employee[]}
            isLoading={empLoading}
            emptyMessage="No employees yet."
            searchPlaceholder="Search employees..."
            actions={
              <Button size="sm" className="gap-1.5" onClick={() => setShowCreateEmployee(true)}>
                <Plus className="size-3.5" />
                New Employee
              </Button>
            }
          />
        </TabsContent>

        <TabsContent value="leaves" className="space-y-4 mt-4">
          <DataTable
            columns={leaveColumns}
            data={leaves as unknown as LeaveRequest[]}
            isLoading={leaveLoading}
            emptyMessage="No leave requests."
            searchPlaceholder="Search requests..."
          />
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4 mt-4">
          <DataTable
            columns={salaryColumns}
            data={salaries as unknown as SalarySlip[]}
            isLoading={salaryLoading}
            emptyMessage="No salary slips generated."
            searchPlaceholder="Search payroll..."
          />
        </TabsContent>
      </Tabs>

      <FormDialog
        open={showCreateEmployee}
        onOpenChange={setShowCreateEmployee}
        title="Add Employee"
        description={`Employee # ${generateNumber("employee", employees.length)}`}
        size="lg"
        onSubmit={(e) => {
          e.preventDefault();
          createEmpMutation.mutate(
            { ...empForm, baseSalary: Number(empForm.baseSalary) },
            {
              onSuccess: () => {
                setShowCreateEmployee(false);
                toast.success("Employee added successfully");
                setEmpForm({ firstName: "", lastName: "", email: "", phone: "", designation: "", baseSalary: "", joinDate: todayISO(), cnic: "", address: "" });
              },
            }
          );
        }}
        isLoading={createEmpMutation.isPending}
        submitLabel="Add Employee"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">First Name</Label>
            <Input value={empForm.firstName} onChange={(e) => setEmpForm((p) => ({ ...p, firstName: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Last Name</Label>
            <Input value={empForm.lastName} onChange={(e) => setEmpForm((p) => ({ ...p, lastName: e.target.value }))} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Email</Label>
            <Input type="email" value={empForm.email} onChange={(e) => setEmpForm((p) => ({ ...p, email: e.target.value }))} required placeholder="email@company.com" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Phone</Label>
            <Input value={empForm.phone} onChange={(e) => setEmpForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+92-300-0000000" />
          </div>
        </div>
        <Separator />
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Designation</Label>
            <Input value={empForm.designation} onChange={(e) => setEmpForm((p) => ({ ...p, designation: e.target.value }))} required placeholder="e.g. Mill Operator" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Base Salary (PKR)</Label>
            <Input type="number" min="0" value={empForm.baseSalary} onChange={(e) => setEmpForm((p) => ({ ...p, baseSalary: e.target.value }))} required placeholder="0" className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Join Date</Label>
            <Input type="date" value={empForm.joinDate} onChange={(e) => setEmpForm((p) => ({ ...p, joinDate: e.target.value }))} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">CNIC</Label>
            <Input value={empForm.cnic} onChange={(e) => setEmpForm((p) => ({ ...p, cnic: e.target.value }))} placeholder="00000-0000000-0" className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Address</Label>
            <Input value={empForm.address} onChange={(e) => setEmpForm((p) => ({ ...p, address: e.target.value }))} placeholder="Full address" />
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
