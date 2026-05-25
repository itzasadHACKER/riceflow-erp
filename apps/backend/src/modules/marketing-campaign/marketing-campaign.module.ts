import { Module } from '@nestjs/common';
import { MarketingCampaignController } from './marketing-campaign.controller';
import { MarketingCampaignService } from './marketing-campaign.service';

@Module({ controllers: [MarketingCampaignController], providers: [MarketingCampaignService], exports: [MarketingCampaignService] })
export class MarketingCampaignModule {}
