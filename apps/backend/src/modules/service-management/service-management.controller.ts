import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { ServiceManagementService } from './service-management.service';
import { CreateServiceCallDto, UpdateServiceCallDto, CreateServiceContractDto, CreateEquipmentCardDto, CreateServiceSolutionDto } from './dto/service-management.dto';

@ApiTags('Service Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('service-management')
export class ServiceManagementController {
  constructor(private readonly service: ServiceManagementService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: JwtPayload) { return this.service.getSummary(user.organizationId); }

  @Post('calls')
  createCall(@CurrentUser() user: JwtPayload, @Body() dto: CreateServiceCallDto) { return this.service.createServiceCall(user.organizationId, dto); }

  @Get('calls')
  findAllCalls(@CurrentUser() user: JwtPayload) { return this.service.findAllServiceCalls(user.organizationId); }

  @Get('calls/:id')
  findCall(@CurrentUser() user: JwtPayload, @Param('id') id: string) { return this.service.findServiceCall(user.organizationId, id); }

  @Patch('calls/:id')
  updateCall(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateServiceCallDto) { return this.service.updateServiceCall(user.organizationId, id, dto); }

  @Post('contracts')
  createContract(@CurrentUser() user: JwtPayload, @Body() dto: CreateServiceContractDto) { return this.service.createContract(user.organizationId, dto); }

  @Get('contracts')
  findAllContracts(@CurrentUser() user: JwtPayload) { return this.service.findAllContracts(user.organizationId); }

  @Get('contracts/expiring')
  expiringContracts(@CurrentUser() user: JwtPayload) { return this.service.expiringContracts(user.organizationId); }

  @Post('equipment')
  createEquipment(@CurrentUser() user: JwtPayload, @Body() dto: CreateEquipmentCardDto) { return this.service.createEquipmentCard(user.organizationId, dto); }

  @Get('equipment')
  findAllEquipment(@CurrentUser() user: JwtPayload) { return this.service.findAllEquipment(user.organizationId); }

  @Post('solutions')
  createSolution(@CurrentUser() user: JwtPayload, @Body() dto: CreateServiceSolutionDto) { return this.service.createSolution(user.organizationId, dto); }

  @Get('solutions')
  findAllSolutions(@CurrentUser() user: JwtPayload) { return this.service.findAllSolutions(user.organizationId); }

  @Get('solutions/search')
  searchSolutions(@CurrentUser() user: JwtPayload, @Query('q') q: string) { return this.service.searchSolutions(user.organizationId, q); }
}
