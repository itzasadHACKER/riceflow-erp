import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { PurchaseEnhancementService } from './purchase-enhancement.service';
import { CreatePurchaseRequisitionDto, CreatePurchaseQuotationDto } from './dto/purchase-enhancement.dto';

@ApiTags('Purchase Enhancements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('purchase-enhancements')
export class PurchaseEnhancementController {
  constructor(private readonly service: PurchaseEnhancementService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: JwtPayload) { return this.service.getSummary(user.organizationId); }

  @Post('requisitions')
  createRequisition(@CurrentUser() user: JwtPayload, @Body() dto: CreatePurchaseRequisitionDto) { return this.service.createRequisition(user.organizationId, user.sub, dto); }

  @Get('requisitions')
  findAllRequisitions(@CurrentUser() user: JwtPayload) { return this.service.findAllRequisitions(user.organizationId); }

  @Patch('requisitions/:id/approve')
  approveRequisition(@CurrentUser() user: JwtPayload, @Param('id') id: string) { return this.service.approveRequisition(user.organizationId, id, user.sub); }

  @Post('quotations')
  createQuotation(@CurrentUser() user: JwtPayload, @Body() dto: CreatePurchaseQuotationDto) { return this.service.createPurchaseQuotation(user.organizationId, dto); }

  @Get('quotations')
  findAllQuotations(@CurrentUser() user: JwtPayload) { return this.service.findAllPurchaseQuotations(user.organizationId); }

  @Patch('quotations/:id/select')
  selectQuotation(@CurrentUser() user: JwtPayload, @Param('id') id: string) { return this.service.selectQuotation(user.organizationId, id); }

  @Post('quotations/compare')
  compareQuotations(@CurrentUser() user: JwtPayload, @Body('ids') ids: string[]) { return this.service.compareQuotations(user.organizationId, ids); }
}
