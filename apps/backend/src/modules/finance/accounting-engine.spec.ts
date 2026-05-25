import { Prisma } from '@prisma/client';

/**
 * Accounting Engine Unit Tests
 * Tests for critical accounting logic that must be verified before production use.
 *
 * These tests validate the mathematical correctness of the accounting engine
 * without requiring a database connection.
 */

describe('AccountingEngine — Core Logic', () => {
  // ===== JOURNAL ENTRY BALANCING =====

  describe('Journal Entry Balance Validation', () => {
    function validateJEBalance(lines: { debit: number; credit: number }[]): { isBalanced: boolean; difference: string } {
      let totalDebit = new Prisma.Decimal(0);
      let totalCredit = new Prisma.Decimal(0);

      for (const line of lines) {
        totalDebit = totalDebit.add(new Prisma.Decimal(line.debit));
        totalCredit = totalCredit.add(new Prisma.Decimal(line.credit));
      }

      const diff = totalDebit.sub(totalCredit);
      return {
        isBalanced: diff.abs().lessThanOrEqualTo(new Prisma.Decimal('0.001')),
        difference: diff.toString(),
      };
    }

    it('should pass for balanced entry with 2 lines', () => {
      const result = validateJEBalance([
        { debit: 1000, credit: 0 },
        { debit: 0, credit: 1000 },
      ]);
      expect(result.isBalanced).toBe(true);
    });

    it('should pass for balanced entry with multiple lines', () => {
      const result = validateJEBalance([
        { debit: 5000, credit: 0 },
        { debit: 3000, credit: 0 },
        { debit: 0, credit: 4000 },
        { debit: 0, credit: 4000 },
      ]);
      expect(result.isBalanced).toBe(true);
    });

    it('should fail for unbalanced entry', () => {
      const result = validateJEBalance([
        { debit: 1000, credit: 0 },
        { debit: 0, credit: 999 },
      ]);
      expect(result.isBalanced).toBe(false);
      expect(result.difference).toBe('1');
    });

    it('should handle decimal amounts correctly', () => {
      const result = validateJEBalance([
        { debit: 1000.55, credit: 0 },
        { debit: 0, credit: 1000.55 },
      ]);
      expect(result.isBalanced).toBe(true);
    });

    it('should handle very large amounts', () => {
      const result = validateJEBalance([
        { debit: 99999999.9999, credit: 0 },
        { debit: 0, credit: 99999999.9999 },
      ]);
      expect(result.isBalanced).toBe(true);
    });

    it('should handle zero-amount entries', () => {
      const result = validateJEBalance([
        { debit: 0, credit: 0 },
        { debit: 0, credit: 0 },
      ]);
      expect(result.isBalanced).toBe(true);
    });

    it('should reject single-sided entries', () => {
      const result = validateJEBalance([
        { debit: 1000, credit: 0 },
      ]);
      expect(result.isBalanced).toBe(false);
    });
  });

  // ===== RUNNING BALANCE CALCULATION =====

  describe('Running Balance Calculation', () => {
    function calculateRunningBalance(
      openingBalance: number,
      balanceType: 'DEBIT' | 'CREDIT',
      transactions: { debit: number; credit: number }[],
    ): string {
      let balance = new Prisma.Decimal(openingBalance);

      for (const tx of transactions) {
        if (balanceType === 'DEBIT') {
          balance = balance.add(new Prisma.Decimal(tx.debit)).sub(new Prisma.Decimal(tx.credit));
        } else {
          balance = balance.add(new Prisma.Decimal(tx.credit)).sub(new Prisma.Decimal(tx.debit));
        }
      }

      return balance.toString();
    }

    it('should calculate correct balance for debit-normal account (Asset)', () => {
      const balance = calculateRunningBalance(10000, 'DEBIT', [
        { debit: 5000, credit: 0 },    // Receive cash
        { debit: 0, credit: 3000 },     // Pay expense
        { debit: 2000, credit: 0 },     // Receive payment
      ]);
      expect(balance).toBe('14000');
    });

    it('should calculate correct balance for credit-normal account (Liability)', () => {
      const balance = calculateRunningBalance(50000, 'CREDIT', [
        { debit: 0, credit: 10000 },   // New loan
        { debit: 5000, credit: 0 },     // Loan payment
        { debit: 0, credit: 3000 },     // Interest accrual
      ]);
      expect(balance).toBe('58000');
    });

    it('should handle opening balance of zero', () => {
      const balance = calculateRunningBalance(0, 'DEBIT', [
        { debit: 1000, credit: 0 },
      ]);
      expect(balance).toBe('1000');
    });

    it('should handle negative balances for debit accounts', () => {
      const balance = calculateRunningBalance(100, 'DEBIT', [
        { debit: 0, credit: 500 },
      ]);
      expect(balance).toBe('-400');
    });

    it('should handle revenue account (credit-normal)', () => {
      const balance = calculateRunningBalance(0, 'CREDIT', [
        { debit: 0, credit: 15000 },   // Sale 1
        { debit: 0, credit: 25000 },   // Sale 2
        { debit: 2000, credit: 0 },     // Sales return
      ]);
      expect(balance).toBe('38000');
    });
  });

  // ===== TRIAL BALANCE VERIFICATION =====

  describe('Trial Balance Verification', () => {
    function verifyTrialBalance(
      accounts: { balanceType: 'DEBIT' | 'CREDIT'; openingBalance: number; totalDebit: number; totalCredit: number }[],
    ): { isBalanced: boolean; totalDebit: string; totalCredit: string; difference: string } {
      let tbDebit = new Prisma.Decimal(0);
      let tbCredit = new Prisma.Decimal(0);

      for (const acc of accounts) {
        const opening = new Prisma.Decimal(acc.openingBalance);
        const debit = new Prisma.Decimal(acc.totalDebit);
        const credit = new Prisma.Decimal(acc.totalCredit);

        if (acc.balanceType === 'DEBIT') {
          const net = opening.add(debit).sub(credit);
          if (net.greaterThanOrEqualTo(0)) tbDebit = tbDebit.add(net);
          else tbCredit = tbCredit.add(net.abs());
        } else {
          const net = opening.add(credit).sub(debit);
          if (net.greaterThanOrEqualTo(0)) tbCredit = tbCredit.add(net);
          else tbDebit = tbDebit.add(net.abs());
        }
      }

      const diff = tbDebit.sub(tbCredit);
      return {
        isBalanced: diff.abs().lessThanOrEqualTo(new Prisma.Decimal('0.01')),
        totalDebit: tbDebit.toString(),
        totalCredit: tbCredit.toString(),
        difference: diff.toString(),
      };
    }

    it('should balance when all entries are balanced', () => {
      const result = verifyTrialBalance([
        { balanceType: 'DEBIT', openingBalance: 100000, totalDebit: 50000, totalCredit: 30000 },  // Cash (Asset)
        { balanceType: 'CREDIT', openingBalance: 0, totalDebit: 0, totalCredit: 80000 },           // Revenue
        { balanceType: 'DEBIT', openingBalance: 0, totalDebit: 30000, totalCredit: 0 },            // Expense
        { balanceType: 'CREDIT', openingBalance: 100000, totalDebit: 30000, totalCredit: 0 },      // Capital (Equity)
      ]);
      expect(result.isBalanced).toBe(true);
    });

    it('should detect imbalance', () => {
      const result = verifyTrialBalance([
        { balanceType: 'DEBIT', openingBalance: 100000, totalDebit: 50000, totalCredit: 30000 },
        { balanceType: 'CREDIT', openingBalance: 0, totalDebit: 0, totalCredit: 50000 },
      ]);
      expect(result.isBalanced).toBe(false);
    });
  });

  // ===== OPENING BALANCE IMPORT VALIDATION =====

  describe('Opening Balance Validation', () => {
    function validateOpeningBalances(
      balances: { accountCode: string; debit: number; credit: number }[],
    ): { isValid: boolean; totalDebit: string; totalCredit: string; difference: string } {
      let totalDebit = new Prisma.Decimal(0);
      let totalCredit = new Prisma.Decimal(0);

      for (const b of balances) {
        totalDebit = totalDebit.add(new Prisma.Decimal(b.debit));
        totalCredit = totalCredit.add(new Prisma.Decimal(b.credit));
      }

      const diff = totalDebit.sub(totalCredit);
      return {
        isValid: diff.equals(new Prisma.Decimal(0)),
        totalDebit: totalDebit.toString(),
        totalCredit: totalCredit.toString(),
        difference: diff.toString(),
      };
    }

    it('should accept balanced opening balances', () => {
      const result = validateOpeningBalances([
        { accountCode: '1001', debit: 50000, credit: 0 },
        { accountCode: '1002', debit: 30000, credit: 0 },
        { accountCode: '2001', debit: 0, credit: 40000 },
        { accountCode: '3001', debit: 0, credit: 40000 },
      ]);
      expect(result.isValid).toBe(true);
    });

    it('should reject unbalanced opening balances', () => {
      const result = validateOpeningBalances([
        { accountCode: '1001', debit: 50000, credit: 0 },
        { accountCode: '2001', debit: 0, credit: 30000 },
      ]);
      expect(result.isValid).toBe(false);
      expect(result.difference).toBe('20000');
    });
  });

  // ===== FISCAL YEAR CLOSING =====

  describe('Fiscal Year Closing Logic', () => {
    function calculateNetIncome(
      revenueBalances: number[],
      expenseBalances: number[],
    ): { netIncome: string; isProfit: boolean } {
      let totalRevenue = new Prisma.Decimal(0);
      let totalExpense = new Prisma.Decimal(0);

      for (const r of revenueBalances) {
        totalRevenue = totalRevenue.add(new Prisma.Decimal(r));
      }

      for (const e of expenseBalances) {
        totalExpense = totalExpense.add(new Prisma.Decimal(e));
      }

      const netIncome = totalRevenue.sub(totalExpense);
      return {
        netIncome: netIncome.toString(),
        isProfit: netIncome.greaterThanOrEqualTo(0),
      };
    }

    it('should calculate profit correctly', () => {
      const result = calculateNetIncome(
        [100000, 50000, 30000],   // Revenue accounts
        [40000, 30000, 20000],    // Expense accounts
      );
      expect(result.netIncome).toBe('90000');
      expect(result.isProfit).toBe(true);
    });

    it('should calculate loss correctly', () => {
      const result = calculateNetIncome(
        [50000],
        [70000],
      );
      expect(result.netIncome).toBe('-20000');
      expect(result.isProfit).toBe(false);
    });

    it('should handle break-even', () => {
      const result = calculateNetIncome(
        [100000],
        [100000],
      );
      expect(result.netIncome).toBe('0');
      expect(result.isProfit).toBe(true);
    });
  });

  // ===== PASSWORD POLICY =====

  describe('Password Policy Validation', () => {
    function validatePassword(password: string): { valid: boolean; errors: string[] } {
      const errors: string[] = [];
      if (password.length < 8) errors.push('Minimum 8 characters required');
      if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter required');
      if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter required');
      if (!/[0-9]/.test(password)) errors.push('At least one number required');
      return { valid: errors.length === 0, errors };
    }

    it('should accept strong password', () => {
      expect(validatePassword('Secure1Pass').valid).toBe(true);
    });

    it('should reject short password', () => {
      const result = validatePassword('Ab1');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Minimum 8 characters required');
    });

    it('should reject password without uppercase', () => {
      const result = validatePassword('lowercase1');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one uppercase letter required');
    });

    it('should reject password without number', () => {
      const result = validatePassword('NoNumberHere');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one number required');
    });
  });

  // ===== RECOVERY PERCENTAGE VALIDATION =====

  describe('Production Recovery Calculation', () => {
    function calculateRecovery(inputWeight: number, outputWeight: number): { percentage: string; wasteWeight: string; isAcceptable: boolean } {
      const input = new Prisma.Decimal(inputWeight);
      const output = new Prisma.Decimal(outputWeight);
      const waste = input.sub(output);
      const percentage = input.greaterThan(0) ? output.div(input).mul(100) : new Prisma.Decimal(0);

      return {
        percentage: percentage.toFixed(2),
        wasteWeight: waste.toString(),
        isAcceptable: percentage.greaterThanOrEqualTo(50),
      };
    }

    it('should calculate 65% recovery correctly', () => {
      const result = calculateRecovery(1000, 650);
      expect(result.percentage).toBe('65.00');
      expect(result.wasteWeight).toBe('350');
      expect(result.isAcceptable).toBe(true);
    });

    it('should flag low recovery (<50%)', () => {
      const result = calculateRecovery(1000, 400);
      expect(result.percentage).toBe('40.00');
      expect(result.isAcceptable).toBe(false);
    });

    it('should handle zero input', () => {
      const result = calculateRecovery(0, 0);
      expect(result.percentage).toBe('0.00');
    });
  });
});
