import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CompanySetupDto } from './dto/setup-wizard.dto';

interface SetupStep {
  key: string;
  title: string;
  description: string;
  order: number;
  isRequired: boolean;
  category: string;
}

const SETUP_STEPS: SetupStep[] = [
  { key: 'company_profile', title: 'Company Profile', description: 'Set up your company name, address, tax ID, and logo', order: 1, isRequired: true, category: 'basics' },
  { key: 'fiscal_year', title: 'Fiscal Year', description: 'Configure your financial year start and end dates', order: 2, isRequired: true, category: 'basics' },
  { key: 'chart_of_accounts', title: 'Chart of Accounts', description: 'Initialize standard chart of accounts for rice industry', order: 3, isRequired: true, category: 'finance' },
  { key: 'currency', title: 'Currency Setup', description: 'Set your base currency and exchange rates', order: 4, isRequired: true, category: 'finance' },
  { key: 'tax_config', title: 'Tax Configuration', description: 'Configure GST, VAT, withholding tax rates', order: 5, isRequired: false, category: 'finance' },
  { key: 'warehouses', title: 'Warehouses & Godowns', description: 'Add your warehouse/godown locations', order: 6, isRequired: false, category: 'inventory' },
  { key: 'rice_varieties', title: 'Rice Varieties', description: 'Define paddy and rice varieties you deal in', order: 7, isRequired: false, category: 'procurement' },
  { key: 'email_setup', title: 'Email Configuration', description: 'Configure outgoing (SMTP) and incoming (IMAP) email servers', order: 8, isRequired: false, category: 'communication' },
  { key: 'whatsapp', title: 'WhatsApp Integration', description: 'Connect WhatsApp Business API for customer communication', order: 9, isRequired: false, category: 'communication' },
  { key: 'users_roles', title: 'Users & Roles', description: 'Add team members and assign roles', order: 10, isRequired: false, category: 'basics' },
  { key: 'letterhead', title: 'Company Letterhead', description: 'Upload your company letterhead for invoices and reports', order: 11, isRequired: false, category: 'branding' },
  { key: 'terms_conditions', title: 'Terms & Conditions', description: 'Set standard terms for invoices, quotations, and POs', order: 12, isRequired: false, category: 'legal' },
];

@Injectable()
export class SetupWizardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSetupStatus(organizationId: string) {
    const completed = await this.prisma.setupProgress.findMany({
      where: { organizationId },
    });
    const completedKeys = new Set(completed.map((c) => c.stepKey));

    const steps = SETUP_STEPS.map((step) => ({
      ...step,
      isCompleted: completedKeys.has(step.key),
      completedAt: completed.find((c) => c.stepKey === step.key)?.completedAt ?? null,
    }));

    const requiredSteps = steps.filter((s) => s.isRequired);
    const completedRequired = requiredSteps.filter((s) => s.isCompleted);

    return {
      steps,
      totalSteps: steps.length,
      completedSteps: completed.length,
      requiredSteps: requiredSteps.length,
      completedRequiredSteps: completedRequired.length,
      isSetupComplete: completedRequired.length >= requiredSteps.length,
      progressPercent: Math.round((completed.length / steps.length) * 100),
    };
  }

  async completeStep(organizationId: string, userId: string, stepKey: string, data?: Record<string, unknown>) {
    return this.prisma.setupProgress.upsert({
      where: { organizationId_stepKey: { organizationId, stepKey } },
      create: {
        organizationId,
        stepKey,
        completedById: userId,
        completedAt: new Date(),
        data: data as object ?? {},
      },
      update: {
        completedAt: new Date(),
        completedById: userId,
        data: data as object ?? {},
      },
    });
  }

  async setupCompany(organizationId: string, userId: string, dto: CompanySetupDto) {
    const org = await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: dto.companyName,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country ?? 'Pakistan',
        phone: dto.phone,
        email: dto.email,
        website: dto.website,
        taxId: dto.taxId,
        currency: dto.currency ?? 'PKR',
        logoUrl: dto.logoUrl,
        letterheadUrl: dto.letterheadUrl,
      },
    });

    await this.completeStep(organizationId, userId, 'company_profile', { companyName: dto.companyName });
    return org;
  }

  async resetStep(organizationId: string, stepKey: string) {
    await this.prisma.setupProgress.deleteMany({
      where: { organizationId, stepKey },
    });
    return { reset: true, stepKey };
  }

  getQuickStartGuide() {
    return {
      title: 'Welcome to Grainix ERP',
      subtitle: 'Complete these steps to get started',
      poweredBy: 'Asad Ali 0308-4420406',
      categories: [
        {
          name: 'Getting Started',
          steps: ['company_profile', 'fiscal_year', 'users_roles'],
        },
        {
          name: 'Finance Setup',
          steps: ['chart_of_accounts', 'currency', 'tax_config'],
        },
        {
          name: 'Operations',
          steps: ['warehouses', 'rice_varieties'],
        },
        {
          name: 'Communication',
          steps: ['email_setup', 'whatsapp'],
        },
        {
          name: 'Branding & Legal',
          steps: ['letterhead', 'terms_conditions'],
        },
      ],
      tutorials: [
        { title: 'Creating Your First Paddy Purchase', videoUrl: null, docUrl: '/docs/tutorials/first-purchase' },
        { title: 'Recording a Journal Entry', videoUrl: null, docUrl: '/docs/tutorials/journal-entry' },
        { title: 'Setting Up Approval Workflows', videoUrl: null, docUrl: '/docs/tutorials/workflows' },
        { title: 'Generating Salary Slips', videoUrl: null, docUrl: '/docs/tutorials/payroll' },
        { title: 'Managing Inventory & Stock', videoUrl: null, docUrl: '/docs/tutorials/inventory' },
        { title: 'Export Sales & LC Management', videoUrl: null, docUrl: '/docs/tutorials/export-sales' },
      ],
    };
  }
}
