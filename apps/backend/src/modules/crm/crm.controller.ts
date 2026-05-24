import {
  Controller,
  Get,
  Post,
  Put,
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
import { CrmService } from './crm.service';
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
  CreateLeadDto,
  UpdateLeadDto,
  CreateBrokerDto,
  UpdateBrokerDto,
  CreateCommunicationLogDto,
  CreateFollowUpDto,
} from './dto/crm.dto';

@ApiTags('crm')
@Controller('crm')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  // ===== LEADS =====

  @Post('leads')
  @ApiOperation({ summary: 'Create lead' })
  async createLead(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateLeadDto,
  ) {
    const lead = await this.crmService.createLead(user.organizationId, dto);
    return createResponse(lead);
  }

  @Get('leads')
  @ApiOperation({ summary: 'List leads' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  async listLeads(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.crmService.listLeads(
      user.organizationId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      status,
      search,
    );
    return createPaginatedResponse(
      result.data,
      result.total,
      result.page,
      result.limit,
    );
  }

  @Get('leads/pipeline')
  @ApiOperation({ summary: 'Get lead pipeline' })
  async getLeadPipeline(@CurrentUser() user: JwtPayload) {
    const pipeline = await this.crmService.getLeadPipeline(user.organizationId);
    return createResponse(pipeline);
  }

  @Get('leads/:id')
  @ApiOperation({ summary: 'Get lead by ID' })
  async getLead(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const lead = await this.crmService.getLead(user.organizationId, id);
    return createResponse(lead);
  }

  @Patch('leads/:id')
  @ApiOperation({ summary: 'Update lead' })
  async updateLead(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    const lead = await this.crmService.updateLead(user.organizationId, id, dto);
    return createResponse(lead);
  }

  @Post('leads/:id/convert')
  @ApiOperation({ summary: 'Convert lead to customer' })
  async convertLead(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const result = await this.crmService.convertLeadToCustomer(
      user.organizationId,
      id,
    );
    return createResponse(result);
  }

  // ===== BROKERS =====

  @Post('brokers')
  @ApiOperation({ summary: 'Create broker' })
  async createBroker(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBrokerDto,
  ) {
    const broker = await this.crmService.createBroker(user.organizationId, dto);
    return createResponse(broker);
  }

  @Get('brokers')
  @ApiOperation({ summary: 'List brokers' })
  async listBrokers(@CurrentUser() user: JwtPayload) {
    const data = await this.crmService.listBrokers(user.organizationId);
    return createResponse(data);
  }

  @Get('brokers/:id')
  @ApiOperation({ summary: 'Get broker by ID' })
  async getBroker(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const broker = await this.crmService.getBroker(user.organizationId, id);
    return createResponse(broker);
  }

  @Patch('brokers/:id')
  @ApiOperation({ summary: 'Update broker' })
  async updateBroker(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBrokerDto,
  ) {
    const broker = await this.crmService.updateBroker(
      user.organizationId,
      id,
      dto,
    );
    return createResponse(broker);
  }

  // ===== COMMUNICATION LOGS =====

  @Post('communication-logs')
  @ApiOperation({ summary: 'Create communication log' })
  async createCommunicationLog(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCommunicationLogDto,
  ) {
    const log = await this.crmService.createCommunicationLog(
      user.organizationId,
      user.sub,
      dto,
    );
    return createResponse(log);
  }

  @Get('communication-logs')
  @ApiOperation({ summary: 'List communication logs' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'contactType', required: false })
  @ApiQuery({ name: 'contactId', required: false })
  async listCommunicationLogs(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('contactType') contactType?: string,
    @Query('contactId') contactId?: string,
  ) {
    const result = await this.crmService.listCommunicationLogs(
      user.organizationId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      contactType,
      contactId,
    );
    return createPaginatedResponse(
      result.data,
      result.total,
      result.page,
      result.limit,
    );
  }

  // ===== FOLLOW-UPS =====

  @Post('follow-ups')
  @ApiOperation({ summary: 'Create follow-up' })
  async createFollowUp(@Body() dto: CreateFollowUpDto) {
    const followUp = await this.crmService.createFollowUp(dto);
    return createResponse(followUp);
  }

  @Post('follow-ups/:id/complete')
  @ApiOperation({ summary: 'Complete follow-up' })
  async completeFollowUp(@Param('id', ParseUUIDPipe) id: string) {
    const followUp = await this.crmService.completeFollowUp(id);
    return createResponse(followUp);
  }

  @Get('follow-ups/pending')
  @ApiOperation({ summary: 'Get pending follow-ups' })
  async getPendingFollowUps(@CurrentUser() user: JwtPayload) {
    const data = await this.crmService.getPendingFollowUps(user.organizationId);
    return createResponse(data);
  }

  @Post('meetings')
  @ApiOperation({ summary: 'Create meeting' })
  async createMeeting(
    @CurrentUser() user: JwtPayload,
    @Body() dto: { title: string; scheduledAt: string; meetingType: string; duration?: number; location?: string; entityType?: string; entityId?: string; agenda?: string },
  ) {
    const result = await this.crmService.createMeeting(user.organizationId, dto, user.sub);
    return createResponse(result);
  }

  @Get('meetings')
  @ApiOperation({ summary: 'List meetings' })
  async getMeetings(
    @CurrentUser() user: JwtPayload,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.crmService.getMeetings(user.organizationId, startDate, endDate);
    return createResponse(result);
  }

  @Put('meetings/:id/complete')
  @ApiOperation({ summary: 'Complete meeting' })
  async completeMeeting(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body('minutes') minutes: string,
  ) {
    const result = await this.crmService.completeMeeting(user.organizationId, id, minutes);
    return createResponse(result);
  }
}
