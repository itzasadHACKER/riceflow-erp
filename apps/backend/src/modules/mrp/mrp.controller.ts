import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { MrpService } from './mrp.service';
import { RunMrpDto, CreateForecastDto } from './dto/mrp.dto';

@ApiTags('MRP')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mrp')
export class MrpController {
  constructor(private readonly service: MrpService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: JwtPayload) { return this.service.getSummary(user.organizationId); }

  @Post('run')
  runMrp(@CurrentUser() user: JwtPayload, @Body() dto: RunMrpDto) { return this.service.runMrp(user.organizationId, user.sub, dto); }

  @Get('runs')
  findAllRuns(@CurrentUser() user: JwtPayload) { return this.service.findAllRuns(user.organizationId); }

  @Get('runs/:id')
  findRun(@CurrentUser() user: JwtPayload, @Param('id') id: string) { return this.service.findRun(user.organizationId, id); }

  @Get('runs/:id/recommendations')
  getRecommendations(@Param('id') id: string) { return this.service.getRecommendations(id); }

  @Post('forecasts')
  createForecast(@CurrentUser() user: JwtPayload, @Body() dto: CreateForecastDto) { return this.service.createForecast(user.organizationId, dto); }

  @Get('forecasts')
  findForecasts(@CurrentUser() user: JwtPayload) { return this.service.findForecasts(user.organizationId); }
}
