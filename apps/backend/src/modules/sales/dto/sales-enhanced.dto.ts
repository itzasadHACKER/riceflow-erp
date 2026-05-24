import { IsString, IsOptional, IsNumber, IsDateString, IsArray, IsEnum, IsUUID, IsBoolean } from 'class-validator';

export class CreateCreditMemoDto {
  @IsUUID() customerId: string;
  @IsOptional() @IsUUID() salesInvoiceId?: string;
  @IsDateString() date: string;
  @IsNumber() totalAmount: number;
  @IsOptional() @IsNumber() taxAmount?: number;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() narration?: string;
}

export class CreateDebitNoteDto {
  @IsUUID() supplierId: string;
  @IsOptional() @IsUUID() purchaseId?: string;
  @IsDateString() date: string;
  @IsNumber() totalAmount: number;
  @IsOptional() @IsNumber() taxAmount?: number;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() narration?: string;
}

export class CreateSalesReturnDto {
  @IsUUID() customerId: string;
  @IsOptional() @IsUUID() invoiceId?: string;
  @IsOptional() @IsUUID() salesOrderId?: string;
  @IsDateString() date: string;
  @IsNumber() quantity: number;
  @IsNumber() rate: number;
  @IsOptional() @IsUUID() warehouseId?: string;
  @IsOptional() @IsUUID() riceVarietyId?: string;
  @IsOptional() @IsString() reason?: string;
}

export class CreatePurchaseReturnDto {
  @IsUUID() supplierId: string;
  @IsOptional() @IsUUID() purchaseId?: string;
  @IsDateString() date: string;
  @IsNumber() quantity: number;
  @IsNumber() rate: number;
  @IsOptional() @IsUUID() warehouseId?: string;
  @IsOptional() @IsUUID() riceVarietyId?: string;
  @IsOptional() @IsString() reason?: string;
}

export class CreateDownPaymentDto {
  @IsEnum(['CUSTOMER', 'VENDOR']) partnerType: string;
  @IsUUID() partnerId: string;
  @IsDateString() date: string;
  @IsNumber() amount: number;
  @IsEnum(['CASH', 'BANK_TRANSFER', 'CHECK']) paymentMethod: string;
  @IsOptional() @IsString() reference?: string;
}

export class CreateRecurringInvoiceDto {
  @IsUUID() customerId: string;
  @IsNumber() amount: number;
  @IsEnum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']) frequency: string;
  @IsDateString() startDate: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() description?: string;
}

export class GetRunningBalanceDto {
  @IsEnum(['CUSTOMER', 'VENDOR', 'SUPPLIER', 'EMPLOYEE']) entityType: string;
  @IsUUID() entityId: string;
}

export class CreateBankDepositDto {
  @IsUUID() bankAccountId: string;
  @IsDateString() date: string;
  @IsNumber() amount: number;
  @IsEnum(['CASH', 'CHECK', 'TRANSFER']) depositType: string;
  @IsOptional() @IsString() reference?: string;
  @IsOptional() @IsString() narration?: string;
}

export class CreatePaymentDto {
  @IsEnum(['CUSTOMER', 'VENDOR']) partnerType: string;
  @IsUUID() partnerId: string;
  @IsDateString() date: string;
  @IsNumber() amount: number;
  @IsEnum(['CASH', 'BANK_TRANSFER', 'CHECK']) paymentMethod: string;
  @IsOptional() @IsUUID() bankAccountId?: string;
  @IsOptional() @IsString() reference?: string;
  @IsOptional() @IsArray() invoiceIds?: string[];
}

export class PurchaseBlanketAgreementDto {
  @IsUUID() supplierId: string;
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
  @IsNumber() plannedAmount: number;
  @IsOptional() @IsString() method?: string;
  @IsOptional() @IsString() description?: string;
}

export class LandedCostDto {
  @IsUUID() goodsReceiptId: string;
  @IsArray() costs: { description: string; amount: number; allocationMethod: string }[];
}

export class TransferRequestDto {
  @IsUUID() fromWarehouseId: string;
  @IsUUID() toWarehouseId: string;
  @IsArray() items: { itemId: string; quantity: number }[];
  @IsOptional() @IsString() reason?: string;
}

export class InventoryCountDto {
  @IsUUID() warehouseId: string;
  @IsDateString() countDate: string;
  @IsArray() items: { itemId: string; systemQty: number; actualQty: number }[];
}

export class RecurringJournalDto {
  @IsString() name: string;
  @IsEnum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']) frequency: string;
  @IsDateString() startDate: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsArray() lines: { accountId: string; debit: number; credit: number; narration?: string }[];
}

export class BankStatementDto {
  @IsUUID() bankAccountId: string;
  @IsArray() transactions: { date: string; description: string; amount: number; type: string; reference?: string }[];
}

export class UdfDto {
  @IsString() entityType: string;
  @IsString() fieldName: string;
  @IsEnum(['TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT']) fieldType: string;
  @IsOptional() @IsString() label?: string;
  @IsOptional() @IsArray() options?: string[];
  @IsOptional() @IsBoolean() required?: boolean;
}

export class PrintLayoutDto {
  @IsString() name: string;
  @IsEnum(['INVOICE', 'PURCHASE_ORDER', 'DELIVERY_NOTE', 'QUOTATION', 'CREDIT_NOTE', 'DEBIT_NOTE']) documentType: string;
  @IsString() layout: string; // JSON layout definition
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class DataOwnershipDto {
  @IsString() entityType: string;
  @IsUUID() roleId: string;
  @IsEnum(['ALL', 'OWN', 'DEPARTMENT', 'BRANCH']) accessLevel: string;
}

export class FormCustomizationDto {
  @IsString() formName: string;
  @IsString() layout: string; // JSON layout
  @IsOptional() @IsUUID() roleId?: string;
}
