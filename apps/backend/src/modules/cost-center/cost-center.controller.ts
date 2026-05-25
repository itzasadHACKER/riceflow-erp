import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { CostCenterService } from './cost-center.service';
import { CreateCostCenterDto, CreateCostAllocationDto } from './dto/cost-center.dto';

@ApiTags('Cost Centers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cost-centers')
export class CostCenterController {
  constructor(private readonly service: CostCenterService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: JwtPayload) { return this.service.getSummary(user.organizationId); }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCostCenterDto) { return this.service.create(user.organizationId, dto); }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) { return this.service.findAll(user.organizationId); }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) { return this.service.findOne(user.organizationId, id); }

  @Patch(':id')
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: Partial<CreateCostCenterDto>) { return this.service.update(user.organizationId, id, dto); }

  @Post('allocations')
  createAllocation(@Body() dto: CreateCostAllocationDto) { return this.service.createAllocation(dto); }

  @Get(':id/allocations')
  findAllocations(@Param('id') id: string) { return this.service.findAllocations(id); }
}
