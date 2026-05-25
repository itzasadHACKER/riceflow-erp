import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GeneralLedgerService } from './general-ledger.service';

/**
 * Enterprise Document Lifecycle Service
 *
 * Enforces ERPNext-style document status lifecycle:
 *   docStatus 0 = DRAFT   → editable, no GL impact
 *   docStatus 1 = SUBMITTED → locked, GL entries posted
 *   docStatus 2 = CANCELLED → reversed, new GL reversal entries
 *
 * Rules (ERPNext/SAP-level):
 * - DRAFT → SUBMITTED: validates all mandatory fields, posts GL
 * - SUBMITTED → CANCELLED: creates reversal entries, never deletes
 * - CANCELLED → cannot transition to anything else
 * - DRAFT → CANCELLED: allowed (no GL needed)
 * - SUBMITTED documents cannot be edited (only cancelled + amended)
 */
@Injectable()
export class DocumentLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly glService: GeneralLedgerService,
  ) {}

  /**
   * Submit a journal entry: DRAFT(0) → SUBMITTED(1)
   * Posts GL entries when submitting
   */
  async submitJournalEntry(
    organizationId: string,
    userId: string,
    journalEntryId: string,
  ) {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id: journalEntryId, organizationId },
      include: {
        lines: { include: { account: true } },
        fiscalYear: true,
      },
    });

    if (!entry) throw new NotFoundException('Journal entry not found');
    if (entry.docStatus !== 0) {
      throw new BadRequestException(
        `Cannot submit: current status is ${entry.docStatus} (expected 0=DRAFT)`,
      );
    }

    // Validate all lines
    for (const line of entry.lines) {
      if (line.account.isGroup) {
        throw new BadRequestException(
          `Cannot post to group account: ${line.account.name} (${line.account.code})`,
        );
      }
      if (line.account.isFrozen) {
        throw new BadRequestException(
          `Account is frozen: ${line.account.name} (${line.account.code})`,
        );
      }
      if (Number(line.debit) === 0 && Number(line.credit) === 0) {
        throw new BadRequestException(
          `Line for account ${line.account.code} has zero debit and credit`,
        );
      }
    }

    // Validate balanced entry
    const totalDebit = entry.lines.reduce(
      (sum, l) => sum + Number(l.debit),
      0,
    );
    const totalCredit = entry.lines.reduce(
      (sum, l) => sum + Number(l.credit),
      0,
    );
    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
      throw new BadRequestException(
        `Unbalanced entry: debit=${totalDebit}, credit=${totalCredit}`,
      );
    }

    // Check fiscal year is open
    const now = new Date();
    if (
      entry.fiscalYear.startDate > entry.date ||
      entry.fiscalYear.endDate < entry.date
    ) {
      throw new BadRequestException(
        `Posting date ${entry.date.toISOString().split('T')[0]} is outside fiscal year ${entry.fiscalYear.name}`,
      );
    }

    // Check accounting period is not closed
    const closedPeriod = await this.prisma.accountingPeriod.findFirst({
      where: {
        organizationId,
        isClosed: true,
        startDate: { lte: entry.date },
        endDate: { gte: entry.date },
      },
    });
    if (closedPeriod) {
      throw new BadRequestException(
        `Accounting period ${closedPeriod.periodName} is closed for posting`,
      );
    }

    // Update to SUBMITTED
    const updated = await this.prisma.journalEntry.update({
      where: { id: journalEntryId },
      data: {
        docStatus: 1,
        isPosted: true,
        postedBy: userId,
        postedAt: new Date(),
        submittedBy: userId,
        submittedAt: new Date(),
      },
      include: { lines: { include: { account: true } } },
    });

    // Post to GL
    try {
      await this.glService.postToLedger(organizationId, userId, {
        voucherType: entry.voucherType || 'Journal Entry',
        voucherNo: entry.entryNumber,
        voucherId: entry.id,
        postingDate: entry.date.toISOString().split('T')[0],
        journalEntryId: entry.id,
        remarks: entry.narration || `Journal Entry ${entry.entryNumber}`,
        entries: entry.lines.map((line) => ({
          accountId: line.accountId,
          debit: Number(line.debit),
          credit: Number(line.credit),
          partyType: line.partyType ?? undefined,
          partyId: line.partyId ?? undefined,
          partyName: line.partyName ?? undefined,
          costCenterId: line.costCenterId ?? undefined,
          projectId: line.projectId ?? undefined,
          remarks: line.narration ?? undefined,
        })),
      });
    } catch (glError) {
      // Revert to draft if GL posting fails
      await this.prisma.journalEntry.update({
        where: { id: journalEntryId },
        data: {
          docStatus: 0,
          isPosted: false,
          postedBy: null,
          postedAt: null,
          submittedBy: null,
          submittedAt: null,
        },
      });
      throw new BadRequestException(
        `GL posting failed: ${glError instanceof Error ? glError.message : 'Unknown error'}`,
      );
    }

    return updated;
  }

  /**
   * Cancel a journal entry: SUBMITTED(1) → CANCELLED(2)
   * Creates reversal GL entries
   */
  async cancelJournalEntry(
    organizationId: string,
    userId: string,
    journalEntryId: string,
    reason: string,
  ) {
    if (!reason || reason.trim().length < 3) {
      throw new BadRequestException(
        'Cancellation reason is required (minimum 3 characters)',
      );
    }

    const entry = await this.prisma.journalEntry.findFirst({
      where: { id: journalEntryId, organizationId },
      include: { lines: { include: { account: true } } },
    });

    if (!entry) throw new NotFoundException('Journal entry not found');
    if (entry.docStatus === 2) {
      throw new BadRequestException('Journal entry is already cancelled');
    }
    if (entry.docStatus !== 1) {
      throw new BadRequestException(
        `Cannot cancel: current status is ${entry.docStatus} (expected 1=SUBMITTED)`,
      );
    }
    if (entry.isReversed) {
      throw new BadRequestException('Journal entry has already been reversed');
    }

    // Reverse GL entries
    await this.glService.reverseLedgerEntries(
      organizationId,
      userId,
      entry.voucherType || 'Journal Entry',
      entry.entryNumber,
      entry.id,
      new Date().toISOString().split('T')[0],
      `Cancellation: ${reason}`,
    );

    // Create reversal journal entry
    const count = await this.prisma.journalEntry.count({
      where: { organizationId },
    });
    const reversalNumber = `JE-${String(count + 1).padStart(6, '0')}`;

    const reversalEntry = await this.prisma.journalEntry.create({
      data: {
        organizationId,
        entryNumber: reversalNumber,
        date: new Date(),
        reference: `Reversal of ${entry.entryNumber}`,
        narration: `Reversal: ${reason}`,
        entryType: 'REVERSAL',
        fiscalYearId: entry.fiscalYearId,
        docStatus: 1,
        isPosted: true,
        postedBy: userId,
        postedAt: new Date(),
        submittedBy: userId,
        submittedAt: new Date(),
        reversalOfId: entry.id,
        createdBy: userId,
        totalDebit: entry.totalDebit,
        totalCredit: entry.totalCredit,
        lines: {
          create: entry.lines.map((line) => ({
            accountId: line.accountId,
            debit: line.credit,
            credit: line.debit,
            narration: `Reversal: ${line.narration ?? ''}`,
            partyType: line.partyType,
            partyId: line.partyId,
            partyName: line.partyName,
            costCenterId: line.costCenterId ?? undefined,
            projectId: line.projectId ?? undefined,
          })),
        },
      },
    });

    // Mark original as cancelled
    await this.prisma.journalEntry.update({
      where: { id: journalEntryId },
      data: {
        docStatus: 2,
        isReversed: true,
        reversedById: reversalEntry.id,
        cancelledBy: userId,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    });

    return {
      cancelled: entry.entryNumber,
      reversalEntry: reversalNumber,
      reason,
    };
  }

  /**
   * Amend a cancelled journal entry (creates a new draft copy)
   */
  async amendJournalEntry(
    organizationId: string,
    userId: string,
    journalEntryId: string,
  ) {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id: journalEntryId, organizationId },
      include: { lines: true },
    });

    if (!entry) throw new NotFoundException('Journal entry not found');
    if (entry.docStatus !== 2) {
      throw new BadRequestException(
        'Only cancelled entries can be amended',
      );
    }

    const count = await this.prisma.journalEntry.count({
      where: { organizationId },
    });
    const amendedNumber = `JE-${String(count + 1).padStart(6, '0')}`;

    const amended = await this.prisma.journalEntry.create({
      data: {
        organizationId,
        entryNumber: amendedNumber,
        date: entry.date,
        reference: entry.reference,
        narration: entry.narration,
        entryType: entry.entryType,
        fiscalYearId: entry.fiscalYearId,
        docStatus: 0,
        amendedFromId: entry.id,
        createdBy: userId,
        totalDebit: entry.totalDebit,
        totalCredit: entry.totalCredit,
        lines: {
          create: entry.lines.map((line) => ({
            accountId: line.accountId,
            debit: line.debit,
            credit: line.credit,
            narration: line.narration,
            partyType: line.partyType,
            partyId: line.partyId,
            partyName: line.partyName,
            costCenterId: line.costCenterId ?? undefined,
            projectId: line.projectId ?? undefined,
          })),
        },
      },
      include: { lines: true },
    });

    return amended;
  }

  /**
   * Get document status label
   */
  getStatusLabel(docStatus: number): string {
    switch (docStatus) {
      case 0:
        return 'Draft';
      case 1:
        return 'Submitted';
      case 2:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }
}
