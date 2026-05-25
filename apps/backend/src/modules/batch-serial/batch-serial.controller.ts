import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { BatchSerialService } from './batch-serial.service';
import { CreateBatchDto, CreateSerialNumberDto } from './dto/batch-serial.dto';

@ApiTags('Batch & Serial')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('batch-serial')
export class BatchSerialController {
  constructor(private readonly service: BatchSerialService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: JwtPayload) { return this.service.getSummary(user.organizationId); }

  @Post('batches')
  createBatch(@CurrentUser() user: JwtPayload, @Body() dto: CreateBatchDto) { return this.service.createBatch(user.organizationId, dto); }

  @Get('batches')
  findAllBatches(@CurrentUser() user: JwtPayload, @Query('itemCode') itemCode?: string) { return this.service.findAllBatches(user.organizationId, itemCode); }

  @Get('batches/expiring')
  expiringBatches(@CurrentUser() user: JwtPayload, @Query('days') days?: string) { return this.service.expiringBatches(user.organizationId, days ? Number(days) : 30); }

  @Get('batches/:id')
  findBatch(@CurrentUser() user: JwtPayload, @Param('id') id: string) { return this.service.findBatch(user.organizationId, id); }

  @Post('serials')
  createSerial(@CurrentUser() user: JwtPayload, @Body() dto: CreateSerialNumberDto) { return this.service.createSerialNumber(user.organizationId, dto); }

  @Get('serials')
  findAllSerials(@CurrentUser() user: JwtPayload, @Query('itemCode') itemCode?: string) { return this.service.findAllSerialNumbers(user.organizationId, itemCode); }

  @Get('serials/history/:serial')
  findSerialHistory(@CurrentUser() user: JwtPayload, @Param('serial') serial: string) { return this.service.findSerialHistory(user.organizationId, serial); }

  @Patch('serials/:id/status')
  updateSerialStatus(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: { status: string; customerId?: string; salesDocRef?: string }) { return this.service.updateSerialStatus(user.organizationId, id, body.status, body.customerId, body.salesDocRef); }
}
