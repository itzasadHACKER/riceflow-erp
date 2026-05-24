-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "currency" TEXT DEFAULT 'PKR',
ADD COLUMN     "letterhead_url" TEXT,
ADD COLUMN     "terms_and_conditions" TEXT;

-- CreateTable
CREATE TABLE "email_server_configs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "server_type" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "use_ssl" BOOLEAN NOT NULL DEFAULT false,
    "use_tls" BOOLEAN NOT NULL DEFAULT true,
    "from_name" TEXT,
    "from_email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_tested_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_server_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_messages" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "folder" TEXT NOT NULL DEFAULT 'INBOX',
    "from_email" TEXT NOT NULL,
    "from_name" TEXT,
    "to_emails" TEXT[],
    "cc_emails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bcc_emails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_html" BOOLEAN NOT NULL DEFAULT false,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_starred" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "sent_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "linked_entity_type" TEXT,
    "linked_entity_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'INTERNAL',
    "created_by_id" UUID NOT NULL,
    "linked_entity_type" TEXT,
    "linked_entity_id" TEXT,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_participants" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PARTICIPANT',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "is_html" BOOLEAN NOT NULL DEFAULT false,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_groups" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_by_id" UUID NOT NULL,
    "contacts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "target_departments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "target_roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_acknowledgments" (
    "id" UUID NOT NULL,
    "announcement_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "acknowledged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_acknowledgments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setup_progress" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "step_key" TEXT NOT NULL,
    "completed_by_id" UUID NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "setup_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experience_letter_templates" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experience_letter_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms_templates" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "terms_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_payment_vouchers" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "voucher_number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_to" TEXT NOT NULL,
    "account_id" UUID NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "narration" TEXT,
    "reference" TEXT,
    "is_posted" BOOLEAN NOT NULL DEFAULT false,
    "journal_entry_id" UUID,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_payment_vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_receipt_vouchers" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "voucher_number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "received_from" TEXT NOT NULL,
    "account_id" UUID NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "narration" TEXT,
    "reference" TEXT,
    "is_posted" BOOLEAN NOT NULL DEFAULT false,
    "journal_entry_id" UUID,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_receipt_vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_receipts" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customer_id" UUID NOT NULL,
    "invoice_type" TEXT NOT NULL DEFAULT 'CASH',
    "items" JSONB NOT NULL DEFAULT '[]',
    "subtotal" DECIMAL(18,4) NOT NULL,
    "tax_amount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "discount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(18,4) NOT NULL,
    "amount_paid" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "payment_method" TEXT NOT NULL DEFAULT 'CASH',
    "narration" TEXT,
    "is_posted" BOOLEAN NOT NULL DEFAULT false,
    "journal_entry_id" UUID,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_statements" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "from_date" TIMESTAMP(3) NOT NULL,
    "to_date" TIMESTAMP(3) NOT NULL,
    "opening_balance" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "closing_balance" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "total_debit" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "total_credit" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "entries" JSONB NOT NULL DEFAULT '[]',
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_statements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_server_configs_organization_id_server_type_key" ON "email_server_configs"("organization_id", "server_type");

-- CreateIndex
CREATE INDEX "email_messages_organization_id_user_id_folder_idx" ON "email_messages"("organization_id", "user_id", "folder");

-- CreateIndex
CREATE INDEX "email_messages_organization_id_status_idx" ON "email_messages"("organization_id", "status");

-- CreateIndex
CREATE INDEX "conversations_organization_id_idx" ON "conversations"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participants_conversation_id_user_id_key" ON "conversation_participants"("conversation_id", "user_id");

-- CreateIndex
CREATE INDEX "conversation_messages_conversation_id_idx" ON "conversation_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "contact_groups_organization_id_idx" ON "contact_groups"("organization_id");

-- CreateIndex
CREATE INDEX "announcements_organization_id_is_published_idx" ON "announcements"("organization_id", "is_published");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_acknowledgments_announcement_id_user_id_key" ON "announcement_acknowledgments"("announcement_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "setup_progress_organization_id_step_key_key" ON "setup_progress"("organization_id", "step_key");

-- CreateIndex
CREATE INDEX "experience_letter_templates_organization_id_idx" ON "experience_letter_templates"("organization_id");

-- CreateIndex
CREATE INDEX "terms_templates_organization_id_document_type_idx" ON "terms_templates"("organization_id", "document_type");

-- CreateIndex
CREATE INDEX "cash_payment_vouchers_organization_id_idx" ON "cash_payment_vouchers"("organization_id");

-- CreateIndex
CREATE INDEX "cash_receipt_vouchers_organization_id_idx" ON "cash_receipt_vouchers"("organization_id");

-- CreateIndex
CREATE INDEX "sales_receipts_organization_id_idx" ON "sales_receipts"("organization_id");

-- CreateIndex
CREATE INDEX "customer_statements_organization_id_customer_id_idx" ON "customer_statements"("organization_id", "customer_id");

-- AddForeignKey
ALTER TABLE "email_server_configs" ADD CONSTRAINT "email_server_configs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_groups" ADD CONSTRAINT "contact_groups_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_acknowledgments" ADD CONSTRAINT "announcement_acknowledgments_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setup_progress" ADD CONSTRAINT "setup_progress_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experience_letter_templates" ADD CONSTRAINT "experience_letter_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
