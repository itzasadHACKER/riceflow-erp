"use client";

import { useState } from "react";
import {
  Calendar,
  Upload,
  Users,
  Building,
  CheckCircle,
  Circle,
  ArrowRight,
  ArrowLeft,
  Download,
  ShieldCheck,
  FileSpreadsheet,
  DollarSign,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { useApiMutation } from "@/hooks/use-api";
import { toast } from "sonner";

interface WizardStep {
  step: number;
  key: string;
  title: string;
  description: string;
  isRequired: boolean;
  helpText: string;
  acceptsCsv?: boolean;
  sampleColumns?: string[];
}

const WIZARD_STEPS: WizardStep[] = [
  {
    step: 1,
    key: "create_fiscal_year",
    title: "Create New Fiscal Year",
    description: "Create a new fiscal year for the upcoming season.",
    isRequired: true,
    helpText: "The fiscal year defines the period for all financial reporting.",
  },
  {
    step: 2,
    key: "import_opening_balances",
    title: "Import Opening Balances",
    description: "Import account-wise opening balances from the previous season. Total debits must equal total credits.",
    isRequired: true,
    helpText: "Export the closing Trial Balance from your previous system (Tally, Excel) and paste/upload as CSV.",
    acceptsCsv: true,
    sampleColumns: ["account_code", "debit", "credit"],
  },
  {
    step: 3,
    key: "import_customers",
    title: "Import Customers",
    description: "Import your customer master data with opening balances.",
    isRequired: false,
    helpText: "Duplicate customers (by name) will be skipped automatically.",
    acceptsCsv: true,
    sampleColumns: ["name", "phone", "email", "address", "opening_balance"],
  },
  {
    step: 4,
    key: "import_suppliers",
    title: "Import Suppliers / Farmers",
    description: "Import your supplier and farmer data with opening balances.",
    isRequired: false,
    helpText: "Duplicate suppliers (by name) will be skipped automatically.",
    acceptsCsv: true,
    sampleColumns: ["name", "phone", "email", "address", "opening_balance"],
  },
  {
    step: 5,
    key: "import_party_balances",
    title: "Import Party-wise Opening Balances",
    description: "Set opening debit/credit balances for each customer and supplier.",
    isRequired: false,
    helpText: "Use this after importing customers/suppliers to set their individual opening balances.",
    acceptsCsv: true,
    sampleColumns: ["name", "balance", "type"],
  },
  {
    step: 6,
    key: "verify_trial_balance",
    title: "Verify Trial Balance",
    description: "Run trial balance verification to confirm all opening balances are correct and balanced.",
    isRequired: true,
    helpText: "The trial balance must be balanced (Total Debit = Total Credit) before you start entering transactions.",
  },
];

const stepIcons: Record<string, React.ElementType> = {
  create_fiscal_year: Calendar,
  import_opening_balances: DollarSign,
  import_customers: Users,
  import_suppliers: Building,
  import_party_balances: FileSpreadsheet,
  verify_trial_balance: ShieldCheck,
};

const sampleCsvData: Record<string, string> = {
  import_opening_balances: `account_code,debit,credit
1001,500000,0
1002,200000,0
1003,150000,0
2001,0,400000
2002,0,100000
3001,0,350000`,
  import_customers: `name,phone,email,address,opening_balance
Ahmad Rice Traders,0300-1234567,ahmad@email.com,"Katchery Road, Lahore",50000
Khalid Exports,0321-7654321,khalid@email.com,"GT Road, Gujranwala",0`,
  import_suppliers: `name,phone,email,address,opening_balance
Farmer Ali,0345-1112233,,Village Nawan Pind,25000
Paddy Suppliers Co,0312-9998877,info@paddyco.com,"Mandi Bahauddin",100000`,
  import_party_balances: `name,balance,type
Ahmad Rice Traders,50000,debit
Khalid Exports,25000,debit
Farmer Ali,100000,credit`,
};

const csvEndpoints: Record<string, string> = {
  import_opening_balances: "/csv-import/opening-balances",
  import_customers: "/csv-import/customers",
  import_suppliers: "/csv-import/suppliers",
  import_party_balances: "/csv-import/party-balances",
};

export default function NewSeasonPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [csvData, setCsvData] = useState<Record<string, string>>({});
  const [fyName, setFyName] = useState("");
  const [fyStart, setFyStart] = useState("");
  const [fyEnd, setFyEnd] = useState("");

  const fyMutation = useApiMutation<unknown, { name: string; startDate: string; endDate: string }>(
    "/finance/fiscal-years",
    "post",
    {
      onSuccess: () => {
        toast.success("Fiscal year created successfully");
        markComplete("create_fiscal_year");
      },
    },
  );

  const csvMutation = useApiMutation<unknown, { csv: string; partyType?: string }>(
    csvEndpoints[WIZARD_STEPS[currentStep]?.key] || "/csv-import/customers",
    "post",
    {
      onSuccess: () => {
        toast.success("Import completed successfully");
        markComplete(WIZARD_STEPS[currentStep].key);
      },
    },
  );

  const markComplete = (key: string) => {
    setCompletedSteps((prev) => new Set([...prev, key]));
  };

  const step = WIZARD_STEPS[currentStep];
  const StepIcon = stepIcons[step?.key] || Circle;
  const progress = Math.round((completedSteps.size / WIZARD_STEPS.length) * 100);

  const handleCreateFiscalYear = () => {
    if (!fyName || !fyStart || !fyEnd) {
      toast.error("Please fill in all fiscal year fields");
      return;
    }
    fyMutation.mutate({ name: fyName, startDate: fyStart, endDate: fyEnd });
  };

  const handleCsvImport = () => {
    const csv = csvData[step.key];
    if (!csv?.trim()) {
      toast.error("Please paste CSV data first");
      return;
    }
    const body: { csv: string; partyType?: string } = { csv };
    if (step.key === "import_party_balances") {
      body.partyType = "customer";
    }
    csvMutation.mutate(body);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvData((prev) => ({ ...prev, [step.key]: text }));
      toast.success(`File loaded: ${file.name} (${text.split("\n").length - 1} rows)`);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Season Setup Wizard"
        description="Set up a new season for your rice mill — import opening balances from previous season"
      />

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Setup Progress</span>
            <span className="text-sm text-muted-foreground">{completedSteps.size} of {WIZARD_STEPS.length} steps</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {WIZARD_STEPS.map((s, i) => {
              const Icon = stepIcons[s.key] || Circle;
              const isCompleted = completedSteps.has(s.key);
              const isCurrent = i === currentStep;
              return (
                <button
                  key={s.key}
                  onClick={() => setCurrentStep(i)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                    isCurrent ? "bg-primary/10" : "hover:bg-muted"
                  }`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    isCompleted ? "bg-green-100 text-green-700" : isCurrent ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {isCompleted ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={`text-xs hidden sm:block ${isCurrent ? "font-medium text-primary" : "text-muted-foreground"}`}>
                    Step {s.step}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
              completedSteps.has(step.key) ? "bg-green-100" : "bg-primary/10"
            }`}>
              {completedSteps.has(step.key) ? (
                <CheckCircle className="h-5 w-5 text-green-700" />
              ) : (
                <StepIcon className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Step {step.step}: {step.title}
                {step.isRequired && <Badge variant="destructive" className="text-xs">Required</Badge>}
                {completedSteps.has(step.key) && <Badge className="bg-green-100 text-green-800 text-xs">Completed</Badge>}
              </CardTitle>
              <CardDescription>{step.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
            <strong>Tip:</strong> {step.helpText}
          </div>

          {/* Step-specific content */}
          {step.key === "create_fiscal_year" && (
            <div className="space-y-4">
              <div>
                <Label>Fiscal Year Name</Label>
                <Input placeholder="e.g. FY 2025-26" value={fyName} onChange={(e) => setFyName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input type="date" value={fyStart} onChange={(e) => setFyStart(e.target.value)} />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input type="date" value={fyEnd} onChange={(e) => setFyEnd(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleCreateFiscalYear} disabled={fyMutation.isPending}>
                {fyMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Fiscal Year
              </Button>
            </div>
          )}

          {step.key === "verify_trial_balance" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Click the button below to verify that all your opening balances are correct. The trial balance
                must show Total Debit = Total Credit before you can start entering transactions.
              </p>
              <div className="flex gap-3">
                <a href="/dashboard/integrity-checks">
                  <Button>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Go to Integrity Checks Page
                  </Button>
                </a>
                <Button variant="outline" onClick={() => markComplete("verify_trial_balance")}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Verified
                </Button>
              </div>
            </div>
          )}

          {step.acceptsCsv && (
            <div className="space-y-4">
              {/* Sample CSV */}
              {sampleCsvData[step.key] && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label>Sample CSV Format</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(sampleCsvData[step.key]);
                        toast.success("Sample CSV copied to clipboard");
                      }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Copy Sample
                    </Button>
                  </div>
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto font-mono">
                    {sampleCsvData[step.key]}
                  </pre>
                </div>
              )}

              {/* CSV File Upload */}
              <div>
                <Label>Upload CSV File</Label>
                <div className="mt-1 flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-muted border border-dashed rounded-lg cursor-pointer hover:bg-muted/80 transition-colors">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">Choose .csv file</span>
                    <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>

              {/* Paste CSV */}
              <div>
                <Label>Or Paste CSV Data</Label>
                <textarea
                  className="w-full h-40 p-3 border rounded-md font-mono text-xs resize-y mt-1 bg-background"
                  placeholder={`Paste CSV data here...\n\nExpected columns: ${step.sampleColumns?.join(", ")}`}
                  value={csvData[step.key] || ""}
                  onChange={(e) => setCsvData((prev) => ({ ...prev, [step.key]: e.target.value }))}
                />
              </div>

              {/* Import button */}
              <Button onClick={handleCsvImport} disabled={csvMutation.isPending || !csvData[step.key]?.trim()}>
                {csvMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Upload className="h-4 w-4 mr-2" />
                Import {step.title.replace("Import ", "")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous Step
        </Button>

        <div className="text-sm text-muted-foreground">
          Step {currentStep + 1} of {WIZARD_STEPS.length}
        </div>

        {currentStep < WIZARD_STEPS.length - 1 ? (
          <Button onClick={() => setCurrentStep((prev) => prev + 1)}>
            Next Step
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => toast.success("Season setup complete! You can now start entering transactions.")}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Complete Setup
          </Button>
        )}
      </div>

      {/* Setup Complete Banner */}
      {completedSteps.size === WIZARD_STEPS.length && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Season Setup Complete!</h3>
                <p className="text-sm text-green-700">
                  All steps are complete. Your rice mill is ready for the new season.
                  You can now start entering transactions, recording paddy purchases, and generating invoices.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
