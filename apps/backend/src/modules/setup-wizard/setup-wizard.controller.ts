import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { createResponse } from '../../common/interfaces/api-response.interface';
import { SetupWizardService } from './setup-wizard.service';
import { CompanySetupDto, CompleteStepDto } from './dto/setup-wizard.dto';

@ApiTags('Setup Wizard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('setup')
export class SetupWizardController {
  constructor(private readonly setupWizardService: SetupWizardService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get setup wizard progress' })
  async getStatus(@CurrentUser() user: JwtPayload) {
    const result = await this.setupWizardService.getSetupStatus(user.organizationId);
    return createResponse(result);
  }

  @Post('company')
  @ApiOperation({ summary: 'Complete company profile setup' })
  async setupCompany(@CurrentUser() user: JwtPayload, @Body() dto: CompanySetupDto) {
    const result = await this.setupWizardService.setupCompany(user.organizationId, user.sub, dto);
    return createResponse(result);
  }

  @Post('complete-step')
  @ApiOperation({ summary: 'Mark a setup step as complete' })
  async completeStep(@CurrentUser() user: JwtPayload, @Body() dto: CompleteStepDto) {
    const result = await this.setupWizardService.completeStep(user.organizationId, user.sub, dto.stepKey, dto.data);
    return createResponse(result);
  }

  @Post('reset-step')
  @ApiOperation({ summary: 'Reset a setup step' })
  async resetStep(@CurrentUser() user: JwtPayload, @Body('stepKey') stepKey: string) {
    const result = await this.setupWizardService.resetStep(user.organizationId, stepKey);
    return createResponse(result);
  }

  @Get('guide')
  @ApiOperation({ summary: 'Get quick start guide and tutorials' })
  async getGuide() {
    const result = this.setupWizardService.getQuickStartGuide();
    return createResponse(result);
  }
}
