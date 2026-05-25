import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsNumber,
  IsBoolean,
  Min,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CustomerTypeEnum {
  DEALER = 'DEALER',
  WHOLESALE = 'WHOLESALE',
  RETAILER = 'RETAILER',
  EXPORTER = 'EXPORTER',
  WALK_IN = 'WALK_IN',
}

export enum OrderStatusEnum {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  DISPATCHED = 'DISPATCHED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

// ============================================================================
// CUSTOMER DTOs
// ============================================================================

export class CreateCustomerDto {
  @ApiProperty({ example: 'Ahmad Rice Traders' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Unique customer code' })
  @IsOptional()
  @IsString()
  customerCode?: string;

  @ApiPropertyOptional({ description: 'Customer display name' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ description: 'Customer group for segmentation' })
  @IsOptional()
  @IsString()
  customerGroup?: string;

  @ApiPropertyOptional({ description: 'Territory/region' })
  @IsOptional()
  @IsString()
  territory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mobileNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ enum: CustomerTypeEnum })
  @IsOptional()
  @IsEnum(CustomerTypeEnum)
  customerType?: CustomerTypeEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cnic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ntn?: string;

  @ApiPropertyOptional({ description: 'Sales tax registration number' })
  @IsOptional()
  @IsString()
  salesTaxNo?: string;

  @ApiPropertyOptional({ description: 'GST category' })
  @IsOptional()
  @IsString()
  gstCategory?: string;

  @ApiPropertyOptional({ description: 'GST number' })
  @IsOptional()
  @IsString()
  gstNo?: string;

  @ApiPropertyOptional({ description: 'Tax ID' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ description: 'Tax withholding category' })
  @IsOptional()
  @IsString()
  taxWithholdingCategory?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  creditLimit?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  openingBalance?: number;

  @ApiPropertyOptional({ description: 'Payment terms in days' })
  @IsOptional()
  @IsNumber()
  paymentTermsDays?: number;

  @ApiPropertyOptional({ description: 'Default currency (PKR)' })
  @IsOptional()
  @IsString()
  defaultCurrency?: string;

  @ApiPropertyOptional({ description: 'Default receivable account' })
  @IsOptional()
  @IsUUID()
  defaultReceivableAccountId?: string;

  @ApiPropertyOptional({ description: 'Default price list' })
  @IsOptional()
  @IsUUID()
  defaultPriceListId?: string;

  @ApiPropertyOptional({ description: 'Default bank account' })
  @IsOptional()
  @IsUUID()
  defaultBankAccountId?: string;

  @ApiPropertyOptional({ description: 'Default salesperson' })
  @IsOptional()
  @IsUUID()
  defaultSalespersonId?: string;

  @ApiPropertyOptional({ description: 'Contact person name' })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiPropertyOptional({ description: 'Loyalty program name' })
  @IsOptional()
  @IsString()
  loyaltyProgram?: string;

  @ApiPropertyOptional({ description: 'Fax number' })
  @IsOptional()
  @IsString()
  fax?: string;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerGroup?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  territory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mobileNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  creditLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  paymentTermsDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFrozen?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ============================================================================
// SALES ORDER DTOs
// ============================================================================

export class SalesOrderItemDto {
  @ApiProperty()
  @IsUUID()
  riceVarietyId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  itemCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  itemName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiPropertyOptional({ default: 'KG' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Stock UOM (may differ from sales UOM)' })
  @IsOptional()
  @IsString()
  stockUom?: string;

  @ApiPropertyOptional({ description: 'Conversion factor from UOM to stock UOM' })
  @IsOptional()
  @IsNumber()
  conversionFactor?: number;

  @ApiPropertyOptional({ description: 'Price list rate before discount' })
  @IsOptional()
  @IsNumber()
  priceListRate?: number;

  @ApiProperty({ example: 95 })
  @IsNumber()
  @Min(0)
  rate: number;

  @ApiPropertyOptional({ description: 'Discount percentage' })
  @IsOptional()
  @IsNumber()
  discountPercentage?: number;

  @ApiPropertyOptional({ description: 'Discount amount' })
  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Tax rate percentage' })
  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lotNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Expected delivery date for this item' })
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @ApiPropertyOptional({ description: 'Number of bags' })
  @IsOptional()
  @IsNumber()
  bagCount?: number;

  @ApiPropertyOptional({ description: 'Weight per bag' })
  @IsOptional()
  @IsNumber()
  bagWeight?: number;
}

export class CreateSalesOrderDto {
  @ApiProperty()
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({ description: 'Naming series for auto-numbering' })
  @IsOptional()
  @IsString()
  namingSeries?: string;

  @ApiProperty({ example: '2024-10-20' })
  @IsDateString()
  date: string;

  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional({ description: 'Customer name (denormalized for display)' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ description: 'Customer address (for print)' })
  @IsOptional()
  @IsString()
  customerAddress?: string;

  @ApiPropertyOptional({ description: 'Contact person' })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiPropertyOptional({ description: 'Contact email' })
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Contact mobile' })
  @IsOptional()
  @IsString()
  contactMobile?: string;

  @ApiPropertyOptional({ description: 'Shipping address' })
  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @ApiPropertyOptional({ description: 'Currency (default PKR)' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Exchange rate' })
  @IsOptional()
  @IsNumber()
  exchangeRate?: number;

  @ApiPropertyOptional({ description: 'Price list ID' })
  @IsOptional()
  @IsUUID()
  priceListId?: string;

  @ApiPropertyOptional({ description: 'Cost center' })
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional({ description: 'Project' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  discount?: number;

  @ApiPropertyOptional({ description: 'Discount percentage' })
  @IsOptional()
  @IsNumber()
  discountPercentage?: number;

  @ApiPropertyOptional({ description: 'Apply discount on: Grand Total or Net Total' })
  @IsOptional()
  @IsString()
  applyDiscountOn?: string;

  @ApiPropertyOptional({ description: 'Tax template' })
  @IsOptional()
  @IsUUID()
  taxTemplateId?: string;

  @ApiPropertyOptional({ description: 'Taxes and charges (array of tax line items)' })
  @IsOptional()
  taxesAndCharges?: any;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  taxAmount?: number;

  @ApiPropertyOptional({ description: 'Salesperson' })
  @IsOptional()
  @IsUUID()
  salespersonId?: string;

  @ApiPropertyOptional({ description: 'Commission rate percentage' })
  @IsOptional()
  @IsNumber()
  commissionRate?: number;

  @ApiPropertyOptional({ description: 'Payment terms text' })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiPropertyOptional({ description: 'Payment terms in days' })
  @IsOptional()
  @IsNumber()
  paymentTermsDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiPropertyOptional({ description: 'Letter head for print' })
  @IsOptional()
  @IsString()
  letterHead?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Total amount in words' })
  @IsOptional()
  @IsString()
  inWords?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty({ type: [SalesOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalesOrderItemDto)
  items: SalesOrderItemDto[];
}

// ============================================================================
// SALES INVOICE DTOs
// ============================================================================

export class SalesInvoiceItemDto {
  @ApiProperty()
  @IsUUID()
  riceVarietyId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  itemCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  itemName?: string;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiPropertyOptional({ default: 'KG' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stockUom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  conversionFactor?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  priceListRate?: number;

  @ApiProperty({ example: 95 })
  @IsNumber()
  @Min(0)
  rate: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discountPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Tax rate percentage' })
  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @ApiPropertyOptional({ description: 'Margin type: Percentage or Amount' })
  @IsOptional()
  @IsString()
  marginType?: string;

  @ApiPropertyOptional({ description: 'Margin rate or amount' })
  @IsOptional()
  @IsNumber()
  marginRateOrAmount?: number;

  @ApiPropertyOptional({ description: 'Income account for this item' })
  @IsOptional()
  @IsUUID()
  incomeAccountId?: string;

  @ApiPropertyOptional({ description: 'Expense account (COGS)' })
  @IsOptional()
  @IsUUID()
  expenseAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lotNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serialNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional({ description: 'Sales order item reference for linking' })
  @IsOptional()
  @IsUUID()
  salesOrderItemId?: string;
}

export class CreateSalesInvoiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  salesOrderId?: string;

  @ApiPropertyOptional({ description: 'Naming series for auto-numbering' })
  @IsOptional()
  @IsString()
  namingSeries?: string;

  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactMobile?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @ApiProperty({ example: '2024-10-20' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postingTime?: string;

  @ApiPropertyOptional({ description: 'Currency (default PKR)' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  exchangeRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  priceListId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({ example: 95000 })
  @IsNumber()
  totalAmount: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  discount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discountPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  applyDiscountOn?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  taxAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  taxTemplateId?: string;

  @ApiPropertyOptional({ description: 'Taxes and charges breakdown' })
  @IsOptional()
  taxesAndCharges?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  writeOffAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  writeOffAccountId?: string;

  @ApiPropertyOptional({ description: 'Debit to account (receivable account)' })
  @IsOptional()
  @IsUUID()
  debitToId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  paymentTermsDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  salespersonId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  commissionRate?: number;

  @ApiPropertyOptional({ description: 'Is return / credit note' })
  @IsOptional()
  @IsBoolean()
  isReturn?: boolean;

  @ApiPropertyOptional({ description: 'Return against invoice ID' })
  @IsOptional()
  @IsString()
  returnAgainst?: string;

  @ApiPropertyOptional({ description: 'Delivery challan reference' })
  @IsOptional()
  @IsString()
  deliveryChallanId?: string;

  @ApiPropertyOptional({ description: 'Is opening entry' })
  @IsOptional()
  @IsBoolean()
  isOpeningEntry?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  letterHead?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ description: 'Invoice line items' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalesInvoiceItemDto)
  items?: SalesInvoiceItemDto[];
}

// ============================================================================
// DELIVERY CHALLAN DTOs
// ============================================================================

export class DeliveryChallanItemDto {
  @ApiProperty()
  @IsUUID()
  riceVarietyId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  itemCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  itemName?: string;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiPropertyOptional({ default: 'KG' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ example: 95 })
  @IsNumber()
  @Min(0)
  rate: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lotNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bagCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bagWeight?: number;
}

export class CreateDeliveryChallanDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  salesOrderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  salesInvoiceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  namingSeries?: string;

  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiProperty({ example: '2024-10-20' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  driverName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  driverPhone?: string;

  @ApiPropertyOptional({ description: 'Transport company name' })
  @IsOptional()
  @IsString()
  transporterName?: string;

  @ApiPropertyOptional({ description: 'Lorry receipt number' })
  @IsOptional()
  @IsString()
  lrNo?: string;

  @ApiPropertyOptional({ description: 'Lorry receipt date' })
  @IsOptional()
  @IsDateString()
  lrDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  dispatchFromWarehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receiverName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receiverPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}
