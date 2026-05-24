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
        { name: 'Getting Started', steps: ['company_profile', 'fiscal_year', 'users_roles'] },
        { name: 'Finance Setup', steps: ['chart_of_accounts', 'currency', 'tax_config'] },
        { name: 'Operations', steps: ['warehouses', 'rice_varieties'] },
        { name: 'Communication', steps: ['email_setup', 'whatsapp'] },
        { name: 'Branding & Legal', steps: ['letterhead', 'terms_conditions'] },
      ],
      tutorials: [
        { title: 'Creating Your First Paddy Purchase', docUrl: '/docs/tutorials/first-purchase' },
        { title: 'Recording a Journal Entry', docUrl: '/docs/tutorials/journal-entry' },
        { title: 'Setting Up Approval Workflows', docUrl: '/docs/tutorials/workflows' },
        { title: 'Generating Salary Slips', docUrl: '/docs/tutorials/payroll' },
        { title: 'Managing Inventory & Stock', docUrl: '/docs/tutorials/inventory' },
        { title: 'Export Sales & LC Management', docUrl: '/docs/tutorials/export-sales' },
      ],
    };
  }

  getTutorials() {
    return {
      postSetupTutorials: [
        {
          id: 'getting_started',
          title: 'Getting Started with Grainix ERP',
          category: 'onboarding',
          estimatedMinutes: 5,
          steps: [
            { step: 1, title: 'Complete Company Profile', description: 'Go to Settings → Company Setup. Enter your company name, address, NTN/GST number, and upload your logo.' },
            { step: 2, title: 'Create Fiscal Year', description: 'Go to Finance → Fiscal Years. Create a fiscal year (e.g., July 2025 - June 2026) and mark it as active.' },
            { step: 3, title: 'Seed Chart of Accounts', description: 'Go to Finance → Chart of Accounts → Seed. This creates standard accounts (Cash, Bank, Sales, Purchases, etc.).' },
            { step: 4, title: 'Add Warehouses', description: 'Go to Inventory → Warehouses. Add at least one warehouse/godown for stock tracking.' },
            { step: 5, title: 'Add Rice Varieties', description: 'Go to Procurement → Rice Varieties. Add varieties you deal in (Basmati, IRRI, Sella, etc.).' },
            { step: 6, title: 'Invite Team Members', description: 'Go to Settings → Users. Add users and assign roles (Admin, Accountant, Manager, Operator).' },
          ],
        },
        {
          id: 'first_purchase',
          title: 'Recording Your First Paddy Purchase',
          category: 'procurement',
          estimatedMinutes: 3,
          steps: [
            { step: 1, title: 'Add a Supplier', description: 'Go to Procurement → Suppliers. Create supplier (Farmer/Dealer/Commission Agent). Fill in name, contact, and NTN.' },
            { step: 2, title: 'Create Purchase Entry', description: 'Go to Procurement → Paddy Purchases → Create. Select supplier, variety, enter weights (gross/tare), moisture %, and rate.' },
            { step: 3, title: 'Post to Accounts', description: 'After saving, click "Post". This auto-creates a journal entry (Debit: Purchase Account, Credit: Supplier/Payable).' },
          ],
        },
        {
          id: 'first_sale',
          title: 'Making Your First Sale',
          category: 'sales',
          estimatedMinutes: 3,
          steps: [
            { step: 1, title: 'Add a Customer', description: 'Go to Sales → Customers → Create. Enter customer name, contact, address, and payment terms.' },
            { step: 2, title: 'Create Sales Receipt', description: 'Go to Finance → Sales Receipts → Create. Choose invoice type (CASH auto-debits Cash in Hand, CREDIT debits Receivables).' },
            { step: 3, title: 'Post to Accounts', description: 'Click "Post". For CASH/POS/RETAIL types, Cash in Hand is automatically debited. For CREDIT/EXPORT/TAX_INVOICE, Accounts Receivable is debited.' },
          ],
        },
        {
          id: 'cash_vouchers',
          title: 'Using Cash Vouchers',
          category: 'finance',
          estimatedMinutes: 3,
          steps: [
            { step: 1, title: 'Cash Payment Voucher', description: 'Go to Finance → Cash Payment Vouchers. Enter paid to, account to debit, amount, and narration. Post to auto-create journal entry (Debit: Expense/Asset, Credit: Cash in Hand).' },
            { step: 2, title: 'Cash Receipt Voucher', description: 'Go to Finance → Cash Receipt Vouchers. Enter received from, account to credit, amount. Post to auto-create journal entry (Debit: Cash in Hand, Credit: Income/Receivable).' },
          ],
        },
        {
          id: 'journal_entries',
          title: 'Manual Journal Entries',
          category: 'finance',
          estimatedMinutes: 3,
          steps: [
            { step: 1, title: 'Create Entry', description: 'Go to Finance → Journal Entries → Create. Add debit and credit lines. Total debits must equal total credits (strict double-entry).' },
            { step: 2, title: 'Post Entry', description: 'Save as draft, review, then Post. Posted entries update the General Ledger.' },
            { step: 3, title: 'View Reports', description: 'Check Trial Balance, P&L, and Balance Sheet to verify your entries are reflected correctly.' },
          ],
        },
        {
          id: 'production',
          title: 'Managing Rice Production',
          category: 'production',
          estimatedMinutes: 5,
          steps: [
            { step: 1, title: 'Create Production Plan', description: 'Go to Production → Plans → Create. Define shift, target output, and machine allocation.' },
            { step: 2, title: 'Start Milling Batch', description: 'Create a batch with input paddy quantity. Start processing.' },
            { step: 3, title: 'Record Output', description: 'Record milling results: rice output, broken ratio, bran, and husk quantities. System calculates recovery %.' },
            { step: 4, title: 'Complete Batch', description: 'Complete the batch. Inventory is automatically updated with finished goods.' },
          ],
        },
        {
          id: 'hr_payroll',
          title: 'HR & Payroll Setup',
          category: 'hr',
          estimatedMinutes: 5,
          steps: [
            { step: 1, title: 'Add Employees', description: 'Go to HR → Employees → Create. Link employee to a user account, set department, designation, salary.' },
            { step: 2, title: 'Configure Leave Types', description: 'Go to HR → Leave Types. Add Annual, Sick, Casual leave types with allowed days.' },
            { step: 3, title: 'Generate Salary Slips', description: 'Go to HR → Salary Slips → Generate. Select month/year and employee. Review, then Confirm and Pay.' },
            { step: 4, title: 'Post to Accounts', description: 'Salary posting creates journal entry (Debit: Salary Expense, Credit: Cash/Bank).' },
          ],
        },
        {
          id: 'experience_letter',
          title: 'Generating Experience Letters',
          category: 'hr',
          estimatedMinutes: 2,
          steps: [
            { step: 1, title: 'Create Template (Optional)', description: 'Go to HR → Experience Letter Templates. Create a custom template using placeholders: {{employeeName}}, {{designation}}, {{joiningDate}}, {{companyName}}.' },
            { step: 2, title: 'Generate Letter', description: 'Go to HR → Experience Letters → Generate. Select employee. The system auto-fills all details from HR records.' },
          ],
        },
      ],
      integrationTutorials: this.getIntegrationTutorials(),
      deploymentGuide: this.getDeploymentGuide(),
    };
  }

  private getIntegrationTutorials() {
    return [
      {
        id: 'gmail_integration',
        title: 'Gmail / Google Workspace Email Integration',
        category: 'email',
        estimatedMinutes: 10,
        prerequisites: ['A Gmail or Google Workspace account', 'App Password enabled (if using 2FA)'],
        steps: [
          {
            step: 1,
            title: 'Enable App Passwords in Google',
            description: 'Go to https://myaccount.google.com/security. Under "Signing in to Google", enable 2-Step Verification if not already enabled. Then go to App Passwords (https://myaccount.google.com/apppasswords). Create a new app password for "Mail" and "Other (Grainix ERP)". Copy the 16-character password.',
          },
          {
            step: 2,
            title: 'Configure Outgoing Server (SMTP)',
            description: 'In Grainix ERP, go to Settings → Email Servers → Configure Outgoing.',
            config: {
              serverType: 'OUTGOING',
              host: 'smtp.gmail.com',
              port: 587,
              username: 'your-email@gmail.com',
              password: '(your 16-char app password)',
              useTls: true,
              useSsl: false,
              fromName: 'Your Company Name',
              fromEmail: 'your-email@gmail.com',
            },
          },
          {
            step: 3,
            title: 'Configure Incoming Server (IMAP)',
            description: 'In Grainix ERP, go to Settings → Email Servers → Configure Incoming.',
            config: {
              serverType: 'INCOMING',
              host: 'imap.gmail.com',
              port: 993,
              username: 'your-email@gmail.com',
              password: '(your 16-char app password)',
              useSsl: true,
              useTls: false,
            },
          },
          {
            step: 4,
            title: 'Enable IMAP in Gmail',
            description: 'Go to Gmail → Settings (gear icon) → See all settings → Forwarding and POP/IMAP tab → Enable IMAP → Save.',
          },
          {
            step: 5,
            title: 'Test Connection',
            description: 'Click "Test Connection" for both SMTP and IMAP servers. Send a test email to verify.',
          },
        ],
        troubleshooting: [
          'If SMTP fails: Check that App Password is correct (not your regular password)',
          'If IMAP fails: Ensure IMAP is enabled in Gmail settings',
          'For Google Workspace: Admin may need to allow less secure apps or enable App Passwords',
        ],
      },
      {
        id: 'outlook_integration',
        title: 'Microsoft Outlook / Office 365 Email Integration',
        category: 'email',
        estimatedMinutes: 10,
        prerequisites: ['A Microsoft 365 or Outlook.com account'],
        steps: [
          {
            step: 1,
            title: 'Configure Outgoing Server (SMTP)',
            description: 'In Grainix ERP, go to Settings → Email Servers → Configure Outgoing.',
            config: {
              serverType: 'OUTGOING',
              host: 'smtp.office365.com',
              port: 587,
              username: 'your-email@outlook.com',
              password: '(your password or app password)',
              useTls: true,
              useSsl: false,
              fromName: 'Your Company Name',
              fromEmail: 'your-email@outlook.com',
            },
          },
          {
            step: 2,
            title: 'Configure Incoming Server (IMAP)',
            description: 'In Grainix ERP, go to Settings → Email Servers → Configure Incoming.',
            config: {
              serverType: 'INCOMING',
              host: 'outlook.office365.com',
              port: 993,
              username: 'your-email@outlook.com',
              password: '(your password or app password)',
              useSsl: true,
              useTls: false,
            },
          },
          {
            step: 3,
            title: 'Enable App Password (if using MFA)',
            description: 'Go to https://account.microsoft.com/security → Advanced security options → App passwords → Create a new app password.',
          },
          {
            step: 4,
            title: 'Test Connection',
            description: 'Test both SMTP and IMAP connections in Grainix ERP.',
          },
        ],
        troubleshooting: [
          'If blocked by Microsoft: Enable "Authenticated SMTP" in Exchange admin center',
          'For Office 365 admin: Go to Admin → Users → Active users → Select user → Mail → Manage email apps → Enable Authenticated SMTP',
        ],
      },
      {
        id: 'whatsapp_integration',
        title: 'WhatsApp Business API Integration',
        category: 'whatsapp',
        estimatedMinutes: 15,
        prerequisites: [
          'A Facebook Business account',
          'WhatsApp Business API access (via Meta Business Suite)',
          'A verified phone number for WhatsApp Business',
        ],
        steps: [
          {
            step: 1,
            title: 'Create Meta Business Account',
            description: 'Go to https://business.facebook.com and create a business account if you don\'t have one.',
          },
          {
            step: 2,
            title: 'Set Up WhatsApp Business',
            description: 'In Meta Business Suite, go to Settings → Business Settings → WhatsApp Accounts. Add a WhatsApp Business account and verify your phone number.',
          },
          {
            step: 3,
            title: 'Create WhatsApp App',
            description: 'Go to https://developers.facebook.com → My Apps → Create App → Business type → Add WhatsApp product.',
          },
          {
            step: 4,
            title: 'Get API Credentials',
            description: 'In the WhatsApp API settings, note down: Phone Number ID, WhatsApp Business Account ID, and Permanent Access Token.',
          },
          {
            step: 5,
            title: 'Configure in Grainix ERP',
            description: 'Go to Settings → Integrations → WhatsApp. Enter your Phone Number ID, Business Account ID, and Access Token.',
            config: {
              phoneNumberId: 'your-phone-number-id',
              businessAccountId: 'your-business-account-id',
              accessToken: 'your-permanent-access-token',
              webhookVerifyToken: 'grainix-webhook-verify',
            },
          },
          {
            step: 6,
            title: 'Set Up Webhook',
            description: 'In the Facebook App Dashboard, configure the webhook URL to: https://your-domain.com/api/v1/integrations/whatsapp/webhook. Set the verify token to match your Grainix ERP config.',
          },
          {
            step: 7,
            title: 'Create Message Templates',
            description: 'In Meta Business Suite → WhatsApp Manager → Message Templates. Create templates for: Order Confirmation, Payment Receipt, Delivery Update, Invoice Reminder.',
          },
        ],
        troubleshooting: [
          'If webhook fails: Ensure your server is publicly accessible (use domain, not localhost)',
          'If messages not sending: Check that templates are approved by Meta',
          'Rate limits: WhatsApp allows 1,000 messages/day initially (increases with quality rating)',
        ],
      },
      {
        id: 'custom_email_integration',
        title: 'Custom Email Server (cPanel/Plesk/Self-hosted)',
        category: 'email',
        estimatedMinutes: 5,
        steps: [
          {
            step: 1,
            title: 'Get SMTP Settings from Your Host',
            description: 'Contact your hosting provider or check cPanel → Email Accounts → Connect Devices. Common settings: Host: mail.yourdomain.com, Port: 465 (SSL) or 587 (TLS).',
          },
          {
            step: 2,
            title: 'Configure in Grainix ERP',
            description: 'Enter your mail server hostname, port, email/password, and SSL/TLS setting.',
            config: {
              serverType: 'OUTGOING',
              host: 'mail.yourdomain.com',
              port: 465,
              username: 'info@yourdomain.com',
              password: '(your email password)',
              useSsl: true,
              useTls: false,
              fromName: 'Your Company',
              fromEmail: 'info@yourdomain.com',
            },
          },
        ],
      },
    ];
  }

  private getDeploymentGuide() {
    return {
      title: 'Deploying Grainix ERP to Production',
      description: 'Grainix ERP is a web application that can be deployed to any server and accessed via a web browser from any device. It is NOT a desktop app.',
      deploymentType: 'WEB_APPLICATION',
      accessMethods: [
        'Desktop browser (Chrome, Firefox, Safari, Edge)',
        'Mobile browser (responsive design)',
        'Tablet browser',
        'Any device with internet access',
      ],
      options: [
        {
          name: 'VPS / Cloud Server (Recommended)',
          difficulty: 'medium',
          estimatedCost: '$10-50/month',
          providers: ['DigitalOcean', 'Linode', 'Vultr', 'Hetzner', 'AWS EC2'],
          steps: [
            'Purchase a VPS with Ubuntu 22.04 (minimum 2GB RAM, 2 vCPUs)',
            'SSH into the server: ssh root@your-server-ip',
            'Install Docker: curl -fsSL https://get.docker.com | sh',
            'Install Docker Compose: apt install docker-compose-plugin',
            'Clone the repo: git clone https://github.com/your-repo/grainix-erp.git',
            'Copy .env.example to .env and configure DATABASE_URL, JWT_SECRET',
            'Run: docker compose up -d',
            'Install Nginx: apt install nginx',
            'Configure Nginx reverse proxy (port 4000 for API, port 3000 for frontend)',
            'Install SSL: apt install certbot python3-certbot-nginx && certbot --nginx -d yourdomain.com',
            'Your ERP is now live at https://yourdomain.com',
          ],
          nginxConfig: `server {
    server_name yourdomain.com;
    
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}`,
        },
        {
          name: 'Managed Platform (Easiest)',
          difficulty: 'easy',
          estimatedCost: '$0-25/month',
          providers: ['Railway', 'Render', 'Fly.io'],
          steps: [
            'Sign up on Railway.app (or Render.com)',
            'Connect your GitHub repository',
            'Railway auto-detects Docker and deploys',
            'Add PostgreSQL and Redis plugins',
            'Set environment variables in the dashboard',
            'Add custom domain in project settings',
            'Point your domain DNS (A record) to the provided IP',
          ],
        },
        {
          name: 'Vercel + Railway (Separated)',
          difficulty: 'easy',
          estimatedCost: '$0-20/month',
          steps: [
            'Deploy frontend to Vercel (free tier)',
            'Deploy backend + DB to Railway',
            'Configure frontend API_URL to point to Railway backend',
            'Add custom domains on both platforms',
          ],
        },
      ],
      domainSetup: {
        title: 'Connecting Your Domain',
        steps: [
          'Purchase a domain from any registrar (GoDaddy, Namecheap, Cloudflare)',
          'In your domain registrar DNS settings, add an A record pointing to your server IP',
          'Example: A record → yourdomain.com → 123.45.67.89',
          'Wait for DNS propagation (usually 5-30 minutes)',
          'Install SSL certificate using Certbot for HTTPS',
          'Your ERP will be accessible at https://yourdomain.com',
        ],
      },
      multiCompanySaaS: {
        title: 'Selling to Multiple Companies',
        description: 'Grainix ERP is already multi-tenant. Each company registers their own organization and only sees their own data.',
        howItWorks: [
          'Each company registers at https://yourdomain.com/register',
          'Registration creates a separate Organization with unique organizationId',
          'All database records are scoped by organizationId — complete data isolation',
          'Each company manages their own users, settings, accounts, inventory, etc.',
          'As the platform owner, you can manage subscriptions and access',
        ],
      },
    };
  }
}
