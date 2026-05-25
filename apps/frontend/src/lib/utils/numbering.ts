const prefixMap: Record<string, string> = {
  invoice: "INV",
  "sales-order": "SO",
  "purchase-order": "PO",
  "journal-entry": "JE",
  "sales-receipt": "SR",
  "credit-note": "CN",
  "debit-note": "DN",
  "payment-voucher": "PV",
  "receipt-voucher": "RV",
  "delivery-challan": "DC",
  employee: "EMP",
  customer: "CUST",
  supplier: "SUP",
  batch: "BATCH",
  warehouse: "WH",
  asset: "AST",
  inspection: "QC",
  expense: "EXP",
  contract: "EC",
  lead: "LEAD",
  vehicle: "VEH",
};

export function generateNumber(type: string, existingCount: number): string {
  const prefix = prefixMap[type] ?? type.toUpperCase().slice(0, 3);
  const next = existingCount + 1;
  return `${prefix}-${String(next).padStart(4, "0")}`;
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function formatCurrency(amount: number | string, currency = "PKR"): string {
  return Number(amount).toLocaleString("en-PK", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
