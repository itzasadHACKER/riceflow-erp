import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import {
  createResponse,
  createPaginatedResponse,
} from '../../common/interfaces/api-response.interface';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  CreateInventoryItemDto,
  CreateStockMovementDto,
  CreateStockAdjustmentDto,
} from './dto/inventory.dto';

@ApiTags('inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('warehouses')
  @ApiOperation({ summary: 'Create warehouse/godown' })
  async createWarehouse(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateWarehouseDto,
  ) {
    const wh = await this.inventoryService.createWarehouse(
      user.organizationId,
      dto,
    );
    return createResponse(wh);
  }

  @Get('warehouses')
  @ApiOperation({ summary: 'List warehouses' })
  async listWarehouses(@CurrentUser() user: JwtPayload) {
    const data = await this.inventoryService.listWarehouses(
      user.organizationId,
    );
    return createResponse(data);
  }

  @Get('warehouses/:id')
  @ApiOperation({ summary: 'Get warehouse with stock' })
  async getWarehouse(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const wh = await this.inventoryService.getWarehouse(
      user.organizationId,
      id,
    );
    return createResponse(wh);
  }

  @Patch('warehouses/:id')
  @ApiOperation({ summary: 'Update warehouse' })
  async updateWarehouse(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWarehouseDto,
  ) {
    const wh = await this.inventoryService.updateWarehouse(
      user.organizationId,
      id,
      dto,
    );
    return createResponse(wh);
  }

  @Get('warehouses/:id/stock')
  @ApiOperation({ summary: 'Get warehouse stock summary' })
  async getWarehouseStock(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const stock = await this.inventoryService.getWarehouseStock(
      user.organizationId,
      id,
    );
    return createResponse(stock);
  }

  @Post('items')
  @ApiOperation({ summary: 'Create inventory item' })
  async createInventoryItem(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateInventoryItemDto,
  ) {
    const item = await this.inventoryService.createInventoryItem(
      user.organizationId,
      dto,
    );
    return createResponse(item);
  }

  @Get('items')
  @ApiOperation({ summary: 'List inventory items' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiQuery({ name: 'riceVarietyId', required: false })
  async listInventoryItems(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('riceVarietyId') riceVarietyId?: string,
  ) {
    const result = await this.inventoryService.listInventoryItems(
      user.organizationId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      warehouseId,
      riceVarietyId,
    );
    return createPaginatedResponse(
      result.data,
      result.total,
      result.page,
      result.limit,
    );
  }

  @Post('stock-movements')
  @ApiOperation({ summary: 'Create stock movement (in/out/transfer)' })
  async createStockMovement(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateStockMovementDto,
  ) {
    const movement = await this.inventoryService.createStockMovement(
      user.organizationId,
      user.sub,
      dto,
    );
    return createResponse(movement);
  }

  @Get('stock-movements')
  @ApiOperation({ summary: 'List stock movements' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  async listStockMovements(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const result = await this.inventoryService.listStockMovements(
      user.organizationId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      warehouseId,
      fromDate,
      toDate,
    );
    return createPaginatedResponse(
      result.data,
      result.total,
      result.page,
      result.limit,
    );
  }

  @Post('stock-adjustments')
  @ApiOperation({ summary: 'Create stock adjustment' })
  async createStockAdjustment(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateStockAdjustmentDto,
  ) {
    const adj = await this.inventoryService.createStockAdjustment(
      user.organizationId,
      user.sub,
      dto,
    );
    return createResponse(adj);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get inventory summary across all warehouses' })
  async getInventorySummary(@CurrentUser() user: JwtPayload) {
    const summary = await this.inventoryService.getInventorySummary(
      user.organizationId,
    );
    return createResponse(summary);
  }

  // ============================================================================
  // ZONES & BINS
  // ============================================================================

  @Post('zones')
  @ApiOperation({ summary: 'Create warehouse zone' })
  async createZone(
    @CurrentUser() user: JwtPayload,
    @Body() dto: { warehouseId: string; name: string; code: string; zoneType?: string; description?: string },
  ) {
    const result = await this.inventoryService.createZone(user.organizationId, dto);
    return createResponse(result);
  }

  @Get('zones')
  @ApiOperation({ summary: 'Get warehouse zones' })
  async getZones(@CurrentUser() user: JwtPayload, @Query('warehouseId') warehouseId: string) {
    const result = await this.inventoryService.getZones(user.organizationId, warehouseId);
    return createResponse(result);
  }

  @Post('bins')
  @ApiOperation({ summary: 'Create warehouse bin' })
  async createBin(
    @CurrentUser() user: JwtPayload,
    @Body() dto: { zoneId: string; binCode: string; rack?: string; shelf?: string; capacity?: string; capacityUnit?: string },
  ) {
    const result = await this.inventoryService.createBin(user.organizationId, dto);
    return createResponse(result);
  }

  // ============================================================================
  // CYCLE COUNTING
  // ============================================================================

  @Post('cycle-counts')
  @ApiOperation({ summary: 'Create cycle count' })
  async createCycleCount(@CurrentUser() user: JwtPayload, @Body() dto: { warehouseId: string; countDate: string; notes?: string }) {
    const result = await this.inventoryService.createCycleCount(user.organizationId, dto, user.sub);
    return createResponse(result);
  }

  @Get('cycle-counts')
  @ApiOperation({ summary: 'List cycle counts' })
  async getCycleCounts(@CurrentUser() user: JwtPayload, @Query('warehouseId') warehouseId?: string) {
    const result = await this.inventoryService.getCycleCounts(user.organizationId, warehouseId);
    return createResponse(result);
  }

  @Put('cycle-counts/:id/item')
  @ApiOperation({ summary: 'Update counted quantity' })
  async updateCountedQty(@Param('id') id: string, @Body('countedQuantity') countedQuantity: string) {
    const result = await this.inventoryService.updateCountedQuantity(id, countedQuantity);
    return createResponse(result);
  }

  @Put('cycle-counts/:id/complete')
  @ApiOperation({ summary: 'Complete cycle count' })
  async completeCycleCount(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const result = await this.inventoryService.completeCycleCount(user.organizationId, id, user.sub);
    return createResponse(result);
  }

  // ============================================================================
  // STOCK RESERVATIONS
  // ============================================================================

  @Post('reservations')
  @ApiOperation({ summary: 'Create stock reservation' })
  async createReservation(
    @CurrentUser() user: JwtPayload,
    @Body() dto: { inventoryItemId: string; quantity: string; referenceType: string; referenceId: string; expiryDate?: string },
  ) {
    const result = await this.inventoryService.createReservation(user.organizationId, dto, user.sub);
    return createResponse(result);
  }

  @Get('reservations')
  @ApiOperation({ summary: 'List reservations' })
  async getReservations(@CurrentUser() user: JwtPayload, @Query('inventoryItemId') inventoryItemId?: string) {
    const result = await this.inventoryService.getReservations(user.organizationId, inventoryItemId);
    return createResponse(result);
  }

  @Put('reservations/:id/release')
  @ApiOperation({ summary: 'Release reservation' })
  async releaseReservation(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const result = await this.inventoryService.releaseReservation(user.organizationId, id);
    return createResponse(result);
  }

  @Get('available-stock/:itemId')
  @ApiOperation({ summary: 'Get available stock (total minus reserved)' })
  async getAvailableStock(@CurrentUser() user: JwtPayload, @Param('itemId') itemId: string) {
    const result = await this.inventoryService.getAvailableStock(user.organizationId, itemId);
    return createResponse(result);
  }
}
