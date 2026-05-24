import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { PickPackService } from './pick-pack.service';
import { CreatePickListDto, CreatePackingListDto } from './dto/pick-pack.dto';

@ApiTags('Pick & Pack')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pick-pack')
export class PickPackController {
  constructor(private readonly service: PickPackService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: JwtPayload) { return this.service.getSummary(user.organizationId); }

  @Post('pick-lists')
  createPickList(@CurrentUser() user: JwtPayload, @Body() dto: CreatePickListDto) { return this.service.createPickList(user.organizationId, dto); }

  @Get('pick-lists')
  findAllPickLists(@CurrentUser() user: JwtPayload) { return this.service.findAllPickLists(user.organizationId); }

  @Patch('pick-lists/:id/status')
  updatePickStatus(@Param('id') id: string, @Body('status') status: string) { return this.service.updatePickListStatus(id, status); }

  @Post('packing-lists')
  createPackingList(@CurrentUser() user: JwtPayload, @Body() dto: CreatePackingListDto) { return this.service.createPackingList(user.organizationId, dto); }

  @Get('packing-lists')
  findAllPackingLists(@CurrentUser() user: JwtPayload) { return this.service.findAllPackingLists(user.organizationId); }

  @Patch('packing-lists/:id/status')
  updatePackingStatus(@Param('id') id: string, @Body('status') status: string) { return this.service.updatePackingStatus(id, status); }
}
