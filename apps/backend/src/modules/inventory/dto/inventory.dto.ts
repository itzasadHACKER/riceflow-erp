import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsNumber,
  IsBoolean,
  Min,
  IsInt,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MovementTypeEnum {
  IN = 'IN',
  OUT = 'OUT',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
}

// ============================================================================
// WAREHOUSE DTOs
// ============================================================================

export class CreateWarehouseDto {
  @ApiProperty({ example: 'Main Godown' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'GDN-001' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'Warehouse type: Store, Rejected, Transit, etc.' })
  @IsOptional()
  @IsString()
  warehouseType?: string;

  @ApiPropertyOptional({ description: 'Is a group warehouse (parent of others)' })
  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;

  @ApiPropertyOptional({ description: 'Parent warehouse ID for hierarchy' })
  @IsOptional()
  @IsUUID()
  parentWarehouseId?: string;

  @ApiPropertyOptional({ description: 'Default inventory account for this warehouse' })
  @IsOptional()
  @IsUUID()
  defaultInventoryAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

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
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  capacity?: number;

  @ApiPropertyOptional({ default: 'TON' })
  @IsOptional()
  @IsString()
  capacityUnit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @ApiPropertyOptional({ description: 'Latitude for location' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude for location' })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class UpdateWarehouseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warehouseType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  capacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  defaultInventoryAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isActive?: boolean;
}

// ============================================================================
// INVENTORY ITEM DTOs
// ============================================================================

export class CreateInventoryItemDto {
  @ApiProperty()
  @IsUUID()
  warehouseId: string;

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
  lotNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional({ description: 'Serial number for tracking' })
  @IsOptional()
  @IsString()
  serialNo?: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ default: 'KG' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Stock UOM' })
  @IsOptional()
  @IsString()
  stockUom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  bagCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bagWeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qualityGrade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  moisture?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  valuationRate?: number;

  @ApiPropertyOptional({ description: 'Incoming rate (purchase rate)' })
  @IsOptional()
  @IsNumber()
  incomingRate?: number;

  @ApiPropertyOptional({ description: 'Stock value = qty * valuation_rate' })
  @IsOptional()
  @IsNumber()
  stockValue?: number;

  @ApiPropertyOptional({ description: 'Reserved quantity (for sales orders)' })
  @IsOptional()
  @IsNumber()
  reservedQty?: number;

  @ApiPropertyOptional({ description: 'Ordered quantity (pending purchase orders)' })
  @IsOptional()
  @IsNumber()
  orderedQty?: number;

  @ApiPropertyOptional({ description: 'Planned quantity (from production)' })
  @IsOptional()
  @IsNumber()
  plannedQty?: number;

  @ApiPropertyOptional({ description: 'Projected quantity (actual + ordered - reserved)' })
  @IsOptional()
  @IsNumber()
  projectedQty?: number;

  @ApiPropertyOptional({ description: 'Expiry date for perishable items' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Manufacturing date' })
  @IsOptional()
  @IsDateString()
  manufacturingDate?: string;
}

// ============================================================================
// STOCK MOVEMENT DTOs
// ============================================================================

export class StockMovementItemDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stockUom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  conversionFactor?: number;

  @ApiPropertyOptional({ description: 'Basic rate per unit' })
  @IsOptional()
  @IsNumber()
  basicRate?: number;

  @ApiPropertyOptional({ description: 'Valuation rate' })
  @IsOptional()
  @IsNumber()
  valuationRate?: number;

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
  @IsString()
  lotNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sourceWarehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  destinationWarehouseId?: string;

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
  @IsUUID()
  expenseAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bagCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bagWeight?: number;
}

export class CreateStockMovementDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  namingSeries?: string;

  @ApiProperty({ enum: MovementTypeEnum })
  @IsEnum(MovementTypeEnum)
  movementType: MovementTypeEnum;

  @ApiPropertyOptional({ description: 'Purpose: Material Transfer, Material Receipt, Material Issue, etc.' })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sourceWarehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  destinationWarehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  riceVarietyId?: string;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiPropertyOptional({ default: 'KG' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Basic rate per unit' })
  @IsOptional()
  @IsNumber()
  basicRate?: number;

  @ApiPropertyOptional({ description: 'Valuation rate' })
  @IsOptional()
  @IsNumber()
  valuationRate?: number;

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
  @IsUUID()
  expenseAccountId?: string;

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
  @IsString()
  lotNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceName?: string;

  @ApiProperty({ example: '2024-10-20' })
  @IsDateString()
  movementDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postingTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  narration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bagCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bagWeight?: number;
}

// ============================================================================
// STOCK ADJUSTMENT DTOs
// ============================================================================

export class CreateStockAdjustmentDto {
  @ApiProperty()
  @IsUUID()
  warehouseId: string;

  @ApiProperty({ example: '2024-10-20' })
  @IsDateString()
  adjustmentDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postingTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  riceVarietyId?: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  quantityChange: number;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(0)
  previousQuantity: number;

  @ApiProperty({ example: 1050 })
  @IsNumber()
  @Min(0)
  newQuantity: number;

  @ApiPropertyOptional({ description: 'Valuation rate for adjustment' })
  @IsOptional()
  @IsNumber()
  valuationRate?: number;

  @ApiPropertyOptional({ description: 'Expense account for stock adjustment' })
  @IsOptional()
  @IsUUID()
  expenseAccountId?: string;

  @ApiPropertyOptional({ description: 'Cost center' })
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

// ============================================================================
// GOODS RECEIPT DTOs
// ============================================================================

export class GoodsReceiptItemDto {
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
  rate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  valuationRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional({ description: 'Rejected warehouse for failed QC' })
  @IsOptional()
  @IsUUID()
  rejectedWarehouseId?: string;

  @ApiPropertyOptional({ description: 'Accepted quantity after inspection' })
  @IsOptional()
  @IsNumber()
  acceptedQty?: number;

  @ApiPropertyOptional({ description: 'Rejected quantity' })
  @IsOptional()
  @IsNumber()
  rejectedQty?: number;

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
  @IsString()
  lotNumber?: string;

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
  @IsNumber()
  bagCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bagWeight?: number;

  @ApiPropertyOptional({ description: 'Purchase order item reference' })
  @IsOptional()
  @IsUUID()
  purchaseOrderItemId?: string;
}

export class CreateGoodsReceiptDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  namingSeries?: string;

  @ApiProperty({ example: '2024-10-20' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postingTime?: string;

  @ApiPropertyOptional({ description: 'Purchase order reference' })
  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;

  @ApiPropertyOptional({ description: 'Purchase invoice reference' })
  @IsOptional()
  @IsUUID()
  purchaseInvoiceId?: string;

  @ApiProperty()
  @IsUUID()
  supplierId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierAddress?: string;

  @ApiProperty()
  @IsUUID()
  warehouseId: string;

  @ApiPropertyOptional({ description: 'Warehouse for rejected items' })
  @IsOptional()
  @IsUUID()
  rejectedWarehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Currency' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  exchangeRate?: number;

  @ApiPropertyOptional({ description: 'Is return (return to supplier)' })
  @IsOptional()
  @IsBoolean()
  isReturn?: boolean;

  @ApiPropertyOptional({ description: 'Return against goods receipt' })
  @IsOptional()
  @IsString()
  returnAgainst?: string;

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
  transporterName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lrNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  lrDate?: string;

  @ApiPropertyOptional({ description: 'Inspection status: Pending, Accepted, Rejected' })
  @IsOptional()
  @IsString()
  inspectionStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  narration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiProperty({ type: [GoodsReceiptItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GoodsReceiptItemDto)
  items: GoodsReceiptItemDto[];
}
