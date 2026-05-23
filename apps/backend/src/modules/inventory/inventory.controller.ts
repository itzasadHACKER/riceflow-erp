import {
  Controller,
  Get,
  Post,
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
}
