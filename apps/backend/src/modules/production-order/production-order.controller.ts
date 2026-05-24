import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { ProductionOrderService } from './production-order.service';
import { CreateProductionOrderDto, CreateGoodsTransactionDto, CreateReturnRequestDto } from './dto/production-order.dto';

@ApiTags('Production Orders & Goods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('production-orders')
export class ProductionOrderController {
  constructor(private readonly service: ProductionOrderService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: JwtPayload) { return this.service.getSummary(user.organizationId); }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateProductionOrderDto) { return this.service.createProductionOrder(user.organizationId, dto); }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) { return this.service.findAllProductionOrders(user.organizationId); }

  @Patch(':id/release')
  release(@CurrentUser() user: JwtPayload, @Param('id') id: string) { return this.service.releaseOrder(user.organizationId, id); }

  @Patch(':id/complete')
  complete(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: { completedQty: number; rejectedQty?: number }) { return this.service.reportCompletion(user.organizationId, id, body.completedQty, body.rejectedQty); }

  @Patch(':id/close')
  close(@CurrentUser() user: JwtPayload, @Param('id') id: string) { return this.service.closeOrder(user.organizationId, id); }

  @Post('goods-transactions')
  createGoodsTx(@CurrentUser() user: JwtPayload, @Body() dto: CreateGoodsTransactionDto) { return this.service.createGoodsTransaction(user.organizationId, dto); }

  @Get('goods-transactions')
  findGoodsTx(@CurrentUser() user: JwtPayload, @Query('type') type?: string) { return this.service.findGoodsTransactions(user.organizationId, type); }

  @Post('return-requests')
  createReturn(@CurrentUser() user: JwtPayload, @Body() dto: CreateReturnRequestDto) { return this.service.createReturnRequest(user.organizationId, dto); }

  @Get('return-requests')
  findReturns(@CurrentUser() user: JwtPayload) { return this.service.findReturnRequests(user.organizationId); }

  @Patch('return-requests/:id/approve')
  approveReturn(@CurrentUser() user: JwtPayload, @Param('id') id: string) { return this.service.approveReturnRequest(user.organizationId, id, user.sub); }
}
