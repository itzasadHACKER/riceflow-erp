import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { PaymentWizardService } from './payment-wizard.service';
import { CreatePaymentRunDto, CreateDunningLevelDto, RunDunningDto } from './dto/payment-wizard.dto';

@ApiTags('Payment Wizard & Dunning')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payment-wizard')
export class PaymentWizardController {
  constructor(private readonly service: PaymentWizardService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: JwtPayload) { return this.service.getSummary(user.organizationId); }

  @Post('payment-runs')
  createPaymentRun(@CurrentUser() user: JwtPayload, @Body() dto: CreatePaymentRunDto) { return this.service.createPaymentRun(user.organizationId, dto); }

  @Get('payment-runs')
  findAllPaymentRuns(@CurrentUser() user: JwtPayload) { return this.service.findAllPaymentRuns(user.organizationId); }

  @Patch('payment-runs/:id/process')
  processPaymentRun(@CurrentUser() user: JwtPayload, @Param('id') id: string) { return this.service.processPaymentRun(user.organizationId, id); }

  @Post('dunning-levels')
  createDunningLevel(@CurrentUser() user: JwtPayload, @Body() dto: CreateDunningLevelDto) { return this.service.createDunningLevel(user.organizationId, dto); }

  @Get('dunning-levels')
  findDunningLevels(@CurrentUser() user: JwtPayload) { return this.service.findDunningLevels(user.organizationId); }

  @Post('dunning-runs')
  runDunning(@CurrentUser() user: JwtPayload, @Body() dto: RunDunningDto) { return this.service.runDunning(user.organizationId, dto); }

  @Get('dunning-runs')
  findDunningRuns(@CurrentUser() user: JwtPayload) { return this.service.findDunningRuns(user.organizationId); }
}
