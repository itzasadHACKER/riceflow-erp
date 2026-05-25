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
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SupplierTypeEnum {
  FARMER = 'FARMER',
  DEALER = 'DEALER',
  COMMISSION_AGENT = 'COMMISSION_AGENT',
  ARTHI = 'ARTHI',
}

export enum RiceTypeEnum {
  PADDY = 'PADDY',
  RICE = 'RICE',
}

export enum RiceCategoryEnum {
  BASMATI = 'BASMATI',
  NON_BASMATI = 'NON_BASMATI',
  SELLA = 'SELLA',
  STEAM = 'STEAM',
  PARBOILED = 'PARBOILED',
  BROKEN = 'BROKEN',
  OTHER = 'OTHER',
}

export enum QualityGradeEnum {
  A_PLUS = 'A_PLUS',
  A = 'A',
  B = 'B',
  C = 'C',
  REJECT = 'REJECT',
}

// ============================================================================
// SUPPLIER DTOs
// ============================================================================

export class CreateSupplierDto {
  @ApiProperty({ example: 'Haji Muhammad Arif' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Unique supplier code' })
  @IsOptional()
  @IsString()
  supplierCode?: string;

  @ApiPropertyOptional({ description: 'Supplier group for categorization' })
  @IsOptional()
  @IsString()
  supplierGroup?: string;

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

  @ApiPropertyOptional({ description: 'Tax ID' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ description: 'PAN number' })
  @IsOptional()
  @IsString()
  panNo?: string;

  @ApiPropertyOptional({ description: 'Tax withholding category' })
  @IsOptional()
  @IsString()
  taxWithholdingCategory?: string;

  @ApiPropertyOptional({ description: 'Fax number' })
  @IsOptional()
  @IsString()
  fax?: string;

  @ApiPropertyOptional({ enum: SupplierTypeEnum })
  @IsOptional()
  @IsEnum(SupplierTypeEnum)
  supplierType?: SupplierTypeEnum;

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

  @ApiPropertyOptional({ description: 'Default currency' })
  @IsOptional()
  @IsString()
  defaultCurrency?: string;

  @ApiPropertyOptional({ description: 'Default payable account' })
  @IsOptional()
  @IsUUID()
  defaultPayableAccountId?: string;

  @ApiPropertyOptional({ description: 'Default bank account' })
  @IsOptional()
  @IsUUID()
  defaultBankAccountId?: string;

  @ApiPropertyOptional({ description: 'Default price list' })
  @IsOptional()
  @IsUUID()
  defaultPriceListId?: string;

  @ApiPropertyOptional({ description: 'Is also a transporter' })
  @IsOptional()
  @IsBoolean()
  isTransporter?: boolean;

  @ApiPropertyOptional({ description: 'Is internal supplier (inter-company)' })
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;

  @ApiPropertyOptional({ description: 'Contact person name' })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiPropertyOptional({ description: 'Allow creating PI without PO' })
  @IsOptional()
  @IsBoolean()
  allowPurchaseInvoiceCreationWithoutPO?: boolean;

  @ApiPropertyOptional({ description: 'Allow creating PI without receipt' })
  @IsOptional()
  @IsBoolean()
  allowPurchaseInvoiceCreationWithoutReceipt?: boolean;
}

export class UpdateSupplierDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierGroup?: string;

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

  @ApiPropertyOptional({ description: 'Put on hold' })
  @IsOptional()
  @IsBoolean()
  onHold?: boolean;

  @ApiPropertyOptional({ description: 'Hold type: ALL, INVOICES, PAYMENTS' })
  @IsOptional()
  @IsString()
  holdType?: string;

  @ApiPropertyOptional({ description: 'Release date for hold' })
  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ============================================================================
// RICE VARIETY (ITEM) DTOs
// ============================================================================

export class CreateRiceVarietyDto {
  @ApiProperty({ example: 'Super Basmati' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'SB' })
  @IsString()
  code: string;

  @ApiProperty({ enum: RiceTypeEnum })
  @IsEnum(RiceTypeEnum)
  riceType: RiceTypeEnum;

  @ApiProperty({ enum: RiceCategoryEnum })
  @IsEnum(RiceCategoryEnum)
  category: RiceCategoryEnum;

  @ApiPropertyOptional({ description: 'Item group for classification' })
  @IsOptional()
  @IsString()
  itemGroup?: string;

  @ApiPropertyOptional({ description: 'Brand name' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'HSN/SAC code for tax classification' })
  @IsOptional()
  @IsString()
  hsnSacCode?: string;

  @ApiPropertyOptional({ description: 'Barcode' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ description: 'Stock UOM (default KG)' })
  @IsOptional()
  @IsString()
  stockUom?: string;

  @ApiPropertyOptional({ description: 'Has variants' })
  @IsOptional()
  @IsBoolean()
  hasVariants?: boolean;

  @ApiPropertyOptional({ description: 'Has serial number tracking' })
  @IsOptional()
  @IsBoolean()
  hasSerialNo?: boolean;

  @ApiPropertyOptional({ description: 'Has batch number tracking' })
  @IsOptional()
  @IsBoolean()
  hasBatchNo?: boolean;

  @ApiPropertyOptional({ description: 'Shelf life in days' })
  @IsOptional()
  @IsNumber()
  shelfLife?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  defaultMoisture?: number;

  @ApiPropertyOptional({ description: 'Standard selling rate' })
  @IsOptional()
  @IsNumber()
  standardRate?: number;

  @ApiPropertyOptional({ description: 'Valuation rate' })
  @IsOptional()
  @IsNumber()
  valuationRate?: number;

  @ApiPropertyOptional({ description: 'Valuation method: MOVING_AVERAGE or FIFO' })
  @IsOptional()
  @IsString()
  valuationMethod?: string;

  @ApiPropertyOptional({ description: 'Minimum order quantity' })
  @IsOptional()
  @IsNumber()
  minOrderQty?: number;

  @ApiPropertyOptional({ description: 'Safety stock level' })
  @IsOptional()
  @IsNumber()
  safetyStock?: number;

  @ApiPropertyOptional({ description: 'Reorder level' })
  @IsOptional()
  @IsNumber()
  reorderLevel?: number;

  @ApiPropertyOptional({ description: 'Reorder quantity' })
  @IsOptional()
  @IsNumber()
  reorderQty?: number;

  @ApiPropertyOptional({ description: 'Lead time in days' })
  @IsOptional()
  @IsNumber()
  leadTimeDays?: number;

  @ApiPropertyOptional({ description: 'Default warehouse' })
  @IsOptional()
  @IsUUID()
  defaultWarehouseId?: string;

  @ApiPropertyOptional({ description: 'Default income account' })
  @IsOptional()
  @IsUUID()
  defaultIncomeAccountId?: string;

  @ApiPropertyOptional({ description: 'Default expense account' })
  @IsOptional()
  @IsUUID()
  defaultExpenseAccountId?: string;

  @ApiPropertyOptional({ description: 'Default cost center' })
  @IsOptional()
  @IsUUID()
  defaultCostCenterId?: string;

  @ApiPropertyOptional({ description: 'Weight per unit' })
  @IsOptional()
  @IsNumber()
  weightPerUnit?: number;

  @ApiPropertyOptional({ description: 'Weight UOM' })
  @IsOptional()
  @IsString()
  weightUom?: string;

  @ApiPropertyOptional({ description: 'Is a sales item' })
  @IsOptional()
  @IsBoolean()
  isSalesItem?: boolean;

  @ApiPropertyOptional({ description: 'Is a purchase item' })
  @IsOptional()
  @IsBoolean()
  isPurchaseItem?: boolean;

  @ApiPropertyOptional({ description: 'Is a stock item' })
  @IsOptional()
  @IsBoolean()
  isStockItem?: boolean;

  @ApiPropertyOptional({ description: 'Opening stock quantity' })
  @IsOptional()
  @IsNumber()
  openingStock?: number;

  @ApiPropertyOptional({ description: 'Opening stock rate' })
  @IsOptional()
  @IsNumber()
  openingStockRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

// ============================================================================
// PADDY PURCHASE DTOs
// ============================================================================

export class CreatePaddyPurchaseDto {
  @ApiProperty()
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  namingSeries?: string;

  @ApiProperty({ example: '2024-10-15' })
  @IsDateString()
  date: string;

  @ApiProperty()
  @IsUUID()
  supplierId: string;

  @ApiProperty()
  @IsUUID()
  riceVarietyId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  brokerId?: string;

  @ApiPropertyOptional({ description: 'Warehouse for stock receipt' })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional({ description: 'Cost center' })
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional({ description: 'Project' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Currency (default PKR)' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Exchange rate' })
  @IsOptional()
  @IsNumber()
  exchangeRate?: number;

  @ApiPropertyOptional({ description: 'Weighbridge slip reference' })
  @IsOptional()
  @IsUUID()
  weighbridgeSlipId?: string;

  @ApiProperty({ example: 10000 })
  @IsNumber()
  @Min(0)
  grossWeight: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  tareWeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  moisturePercentage?: number;

  @ApiPropertyOptional({ description: 'Broken rice percentage' })
  @IsOptional()
  @IsNumber()
  brokenPercentage?: number;

  @ApiPropertyOptional({ description: 'Foreign matter percentage' })
  @IsOptional()
  @IsNumber()
  foreignMatter?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  deductionPercentage?: number;

  @ApiProperty({ example: 3500 })
  @IsNumber()
  @Min(0)
  ratePerUnit: number;

  @ApiPropertyOptional({ description: 'Bardana (gunny bag) charges' })
  @IsOptional()
  @IsNumber()
  bardanaAmount?: number;

  @ApiPropertyOptional({ description: 'Labour charges' })
  @IsOptional()
  @IsNumber()
  labourCharges?: number;

  @ApiPropertyOptional({ description: 'Transport charges' })
  @IsOptional()
  @IsNumber()
  transportCharges?: number;

  @ApiPropertyOptional({ description: 'Commission amount for broker' })
  @IsOptional()
  @IsNumber()
  commissionAmount?: number;

  @ApiPropertyOptional({ description: 'Commission rate percentage' })
  @IsOptional()
  @IsNumber()
  commissionRate?: number;

  @ApiPropertyOptional({ description: 'Tax amount' })
  @IsOptional()
  @IsNumber()
  taxAmount?: number;

  @ApiPropertyOptional({ description: 'Withholding tax amount' })
  @IsOptional()
  @IsNumber()
  withholdingTaxAmount?: number;

  @ApiPropertyOptional({ enum: QualityGradeEnum })
  @IsOptional()
  @IsEnum(QualityGradeEnum)
  qualityGrade?: QualityGradeEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lotNumber?: string;

  @ApiPropertyOptional({ description: 'Number of bags' })
  @IsOptional()
  @IsNumber()
  bagCount?: number;

  @ApiPropertyOptional({ description: 'Weight per bag' })
  @IsOptional()
  @IsNumber()
  bagWeight?: number;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gatePassNumber?: string;

  @ApiPropertyOptional({ description: 'Amount in words' })
  @IsOptional()
  @IsString()
  inWords?: string;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
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

// ============================================================================
// PURCHASE RATE DTOs
// ============================================================================

export class CreatePurchaseRateDto {
  @ApiProperty()
  @IsUUID()
  riceVarietyId: string;

  @ApiProperty({ example: 3500 })
  @IsNumber()
  @Min(0)
  rate: number;

  @ApiProperty({ example: '2024-10-01' })
  @IsDateString()
  effectiveFrom: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minMoisture?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxMoisture?: number;
}

// ============================================================================
// QUALITY TEST DTOs
// ============================================================================

export class CreateQualityTestDto {
  @ApiProperty()
  @IsUUID()
  paddyPurchaseId: string;

  @ApiProperty({ example: '2024-10-15' })
  @IsDateString()
  testDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  moisture?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  brokenPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  foreignMatter?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  chalkyGrains?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  damagedGrains?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discolouredGrains?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  immatureGrains?: number;

  @ApiPropertyOptional({ enum: QualityGradeEnum })
  @IsOptional()
  @IsEnum(QualityGradeEnum)
  overallGrade?: QualityGradeEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  testNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  testedBy?: string;
}
