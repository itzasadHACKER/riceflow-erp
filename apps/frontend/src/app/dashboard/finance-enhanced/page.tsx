"use client";

import { useState } from "react";
import { Repeat, Upload, Building2, Lock, FileBarChart, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { useApiList, useApiMutation } from "@/hooks/use-api";
import { todayISO, formatDate } from "@/lib/utils/numbering";
import { toast } from "sonner";

interface RecurringJournal { id: string; name: string; schedule: string; nextRunAt: string; lastRunAt: string; isActive: boolean; }
interface Branch { id: string; name: string; code: string; }
interface ReportTemplate { id: string; name: string; entityType: string; isDefault: boolean; }

const rjColumns: Column<RecurringJournal>[] = [
  { key: "name", header: "Name", render: (i) => <span className="font-medium">{i.name}</span> },
  { key: "schedule", header: "Frequency", render: (i) => <Badge variant="outline">{i.schedule}</Badge> },
  { key: "nextRunAt", header: "Next Run", render: (i) => i.nextRunAt ? formatDate(i.nextRunAt) : "—" },
  { key: "lastRunAt", header: "Last Run", render: (i) => i.lastRunAt ? formatDate(i.lastRunAt) : "Never" },
  { key: "isActive", header: "Active", render: (i) => <Badge variant={i.isActive ? "default" : "secondary"}>{i.isActive ? "Active" : "Inactive"}</Badge> },
];

const branchColumns: Column<Branch>[] = [
  { key: "name", header: "Branch Name" },
  { key: "code", header: "Code", render: (i) => <code className="text-xs bg-muted px-1 rounded">{i.code}</code> },
];

const templateColumns: Column<ReportTemplate>[] = [
  { key: "name", header: "Template Name" },
  { key: "entityType", header: "Type", render: (i) => <Badge variant="outline">{i.entityType}</Badge> },
  { key: "isDefault", header: "Default", render: (i) => i.isDefault ? <Badge>Default</Badge> : <Badge variant="secondary">No</Badge> },
];

export default function FinanceEnhancedPage() {
  const [rjOpen, setRjOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);

  const { data: recurringJournals = [], refetch: refetchRj } = useApiList<RecurringJournal>(["recurring-journals"], "/finance-enhanced/recurring-journals");
  const { data: branches = [] } = useApiList<Branch>(["fe-branches"], "/finance-enhanced/branches");
  const { data: templates = [], refetch: refetchTemplates } = useApiList<ReportTemplate>(["report-templates"], "/finance-enhanced/report-templates");

  const createRj = useApiMutation("/finance-enhanced/recurring-journals", "post");
  const importStatement = useApiMutation("/finance-enhanced/bank-statement-import", "post");
  const createTemplate = useApiMutation("/finance-enhanced/report-templates", "post");

  const rjList = Array.isArray(recurringJournals) ? recurringJournals : [];
  const branchList = Array.isArray(branches) ? branches : [];
  const templateList = Array.isArray(templates) ? templates : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Finance Enhancements" description="Recurring JEs, bank statement import, multi-branch accounting, report templates, period authorization" />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Recurring JEs" value={rjList.length} icon={Repeat} description="Scheduled entries" />
        <StatCard title="Branches" value={branchList.length} icon={Building2} description="Multi-branch" />
        <StatCard title="Report Templates" value={templateList.length} icon={FileBarChart} description="Custom layouts" />
        <StatCard title="Period Control" value="Active" icon={Lock} description="Authorization" />
      </div>

      <Tabs defaultValue="recurring" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="recurring">Recurring JEs</TabsTrigger>
          <TabsTrigger value="bank-import">Bank Statement</TabsTrigger>
          <TabsTrigger value="multi-branch">Multi-Branch</TabsTrigger>
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
          <TabsTrigger value="period-auth">Period Auth</TabsTrigger>
        </TabsList>

        <TabsContent value="recurring" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setRjOpen(true)}><Plus className="mr-2 h-4 w-4" />New Recurring JE</Button>
          </div>
          <DataTable columns={rjColumns} data={rjList} />
          <FormDialog open={rjOpen} onOpenChange={setRjOpen} title="Create Recurring Journal Entry" onSubmit={async (e) => {
            e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement);
            await createRj.mutateAsync({
              name: fd.get("name"),
              frequency: fd.get("frequency"),
              startDate: fd.get("startDate"),
              lines: [
                { accountId: fd.get("debitAccountId"), debit: Number(fd.get("amount")), credit: 0, narration: fd.get("narration") },
                { accountId: fd.get("creditAccountId"), debit: 0, credit: Number(fd.get("amount")), narration: fd.get("narration") },
              ],
            });
            toast.success("Recurring JE created"); setRjOpen(false); refetchRj();
          }}>
            <div className="grid gap-4">
              <div><Label>Name</Label><Input name="name" placeholder="e.g. Monthly Depreciation" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Frequency</Label>
                  <Select name="frequency"><SelectTrigger><SelectValue placeholder="Schedule" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                      <SelectItem value="YEARLY">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Start Date</Label><Input name="startDate" type="date" defaultValue={todayISO()} /></div>
              </div>
              <div><Label>Amount</Label><Input name="amount" type="number" step="0.01" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Debit Account ID</Label><Input name="debitAccountId" required /></div>
                <div><Label>Credit Account ID</Label><Input name="creditAccountId" required /></div>
              </div>
              <div><Label>Narration</Label><Textarea name="narration" /></div>
            </div>
          </FormDialog>
        </TabsContent>

        <TabsContent value="bank-import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Upload className="h-5 w-5" />Bank Statement Import</span>
                <Button onClick={() => setImportOpen(true)}><Upload className="mr-2 h-4 w-4" />Import Statement</Button>
              </CardTitle>
              <CardDescription>Upload bank statement data, auto-match against open payments, and create journal entries.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-4 bg-blue-50">
                <p className="text-sm font-medium">How it works:</p>
                <ol className="text-sm text-muted-foreground mt-1 space-y-1 list-decimal list-inside">
                  <li>Enter bank account and transaction details</li>
                  <li>System creates unposted journal entries for each transaction</li>
                  <li>Review and post entries individually or in bulk</li>
                  <li>Credit transactions &rarr; Dr. Bank, Cr. Suspense</li>
                  <li>Debit transactions &rarr; Dr. Suspense, Cr. Bank</li>
                </ol>
              </div>
            </CardContent>
          </Card>
          <FormDialog open={importOpen} onOpenChange={setImportOpen} title="Import Bank Statement" onSubmit={async (e) => {
            e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement);
            await importStatement.mutateAsync({
              bankAccountId: fd.get("bankAccountId"),
              transactions: [
                { date: fd.get("txDate"), amount: Number(fd.get("txAmount")), type: fd.get("txType"), description: fd.get("txDescription"), reference: fd.get("txReference") },
              ],
            });
            toast.success("Statement imported"); setImportOpen(false);
          }}>
            <div className="grid gap-4">
              <div><Label>Bank Account ID</Label><Input name="bankAccountId" required /></div>
              <p className="text-sm font-medium">Transaction</p>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Date</Label><Input name="txDate" type="date" defaultValue={todayISO()} /></div>
                <div><Label>Amount</Label><Input name="txAmount" type="number" step="0.01" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Type</Label>
                  <Select name="txType"><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="CREDIT">Credit (Deposit)</SelectItem><SelectItem value="DEBIT">Debit (Withdrawal)</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Reference</Label><Input name="txReference" /></div>
              </div>
              <div><Label>Description</Label><Input name="txDescription" /></div>
            </div>
          </FormDialog>
        </TabsContent>

        <TabsContent value="multi-branch" className="space-y-4">
          <DataTable columns={branchColumns} data={branchList} />
          {branchList.length === 0 && (
            <Card><CardContent className="p-6 text-center text-muted-foreground">No branches configured. Create branches in Organization Settings.</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setTemplateOpen(true)}><Plus className="mr-2 h-4 w-4" />New Template</Button>
          </div>
          <DataTable columns={templateColumns} data={templateList} />
          <FormDialog open={templateOpen} onOpenChange={setTemplateOpen} title="Create Report Template" onSubmit={async (e) => {
            e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement);
            await createTemplate.mutateAsync({ name: fd.get("name"), reportType: fd.get("reportType"), layout: fd.get("layout"), isDefault: fd.get("isDefault") === "true" });
            toast.success("Template created"); setTemplateOpen(false); refetchTemplates();
          }}>
            <div className="grid gap-4">
              <div><Label>Template Name</Label><Input name="name" required /></div>
              <div><Label>Report Type</Label>
                <Select name="reportType"><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REPORT">General Report</SelectItem>
                    <SelectItem value="FINANCIAL_STATEMENT">Financial Statement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Layout (HTML/JSON)</Label><Textarea name="layout" rows={6} /></div>
              <div><Label>Default</Label>
                <Select name="isDefault"><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="false">No</SelectItem><SelectItem value="true">Yes</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </FormDialog>
        </TabsContent>

        <TabsContent value="period-auth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />Posting Period Authorization</CardTitle>
              <CardDescription>Control which financial periods users can post to. Closed periods block new journal entries.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-4 bg-amber-50">
                <p className="text-sm font-medium">Period Status:</p>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  <li><Badge className="mr-2">OPEN</Badge> Users can post transactions</li>
                  <li><Badge variant="destructive" className="mr-2">CLOSED</Badge> No new postings allowed</li>
                  <li><Badge variant="secondary" className="mr-2">LOCKED</Badge> Only admins can post</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
