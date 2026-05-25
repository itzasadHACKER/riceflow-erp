import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { AdminEnhancementService } from './admin-enhancement.service';
import { CreateUserDefinedTableDto, CreateAuthorizationGroupDto } from './dto/admin-enhancement.dto';

@ApiTags('Administration Enhancements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin-enhancements')
export class AdminEnhancementController {
  constructor(private readonly service: AdminEnhancementService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: JwtPayload) { return this.service.getSummary(user.organizationId); }

  @Post('tables')
  createTable(@CurrentUser() user: JwtPayload, @Body() dto: CreateUserDefinedTableDto) { return this.service.createUDT(user.organizationId, dto); }

  @Get('tables')
  findTables(@CurrentUser() user: JwtPayload) { return this.service.findAllUDTs(user.organizationId); }

  @Get('tables/:id')
  findTable(@CurrentUser() user: JwtPayload, @Param('id') id: string) { return this.service.findUDT(user.organizationId, id); }

  @Post('tables/:id/data')
  addData(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: any) { return this.service.addTableData(user.organizationId, id, body); }

  @Post('auth-groups')
  createAuthGroup(@CurrentUser() user: JwtPayload, @Body() dto: CreateAuthorizationGroupDto) { return this.service.createAuthGroup(user.organizationId, dto); }

  @Get('auth-groups')
  findAuthGroups(@CurrentUser() user: JwtPayload) { return this.service.findAllAuthGroups(user.organizationId); }

  @Patch('auth-groups/:id')
  updateAuthGroup(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() data: any) { return this.service.updateAuthGroup(user.organizationId, id, data); }

  @Post('inventory-valuations')
  createValuation(@CurrentUser() user: JwtPayload, @Body() data: { itemCode: string; valuationMethod: string; standardCost?: number }) { return this.service.createInventoryValuation(user.organizationId, data); }

  @Get('inventory-valuations')
  findValuations(@CurrentUser() user: JwtPayload) { return this.service.findInventoryValuations(user.organizationId); }
}
