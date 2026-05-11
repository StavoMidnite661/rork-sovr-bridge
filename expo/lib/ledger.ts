import type { TigerBeetleAccount } from "@/types/treasury";

/**
 * TigerBeetle-inspired deterministic accounting engine simulation.
 * Enforces strict double-entry invariants and tracks pending/posted states.
 */
export class TigerBeetleSimulation {
  /**
   * Create a transfer between two accounts.
   */
  static createTransfer(
    accounts: TigerBeetleAccount[],
    debitAccountId: string,
    creditAccountId: string,
    amountCents: number,
    isPending: boolean = false
  ): { nextAccounts: TigerBeetleAccount[]; success: boolean; error?: string } {
    const debitAccount = accounts.find((a) => a.id === debitAccountId);
    const creditAccount = accounts.find((a) => a.id === creditAccountId);

    if (!debitAccount || !creditAccount) {
      return { nextAccounts: accounts, success: false, error: "Account not found" };
    }

    if (amountCents <= 0) {
      return { nextAccounts: accounts, success: false, error: "Invalid amount" };
    }

    // Invariant check: Debits must not exceed credits (if flag set)
    if (debitAccount.flags.debits_must_not_exceed_credits) {
      const available = debitAccount.credits_posted - debitAccount.debits_posted - debitAccount.debits_pending;
      if (available < amountCents) {
        return { nextAccounts: accounts, success: false, error: "Insufficient funds in " + debitAccountId };
      }
    }

    const nextAccounts = accounts.map((a) => {
      if (a.id === debitAccountId) {
        return isPending
          ? { ...a, debits_pending: a.debits_pending + amountCents }
          : { ...a, debits_posted: a.debits_posted + amountCents };
      }
      if (a.id === creditAccountId) {
        return isPending
          ? { ...a, credits_pending: a.credits_pending + amountCents }
          : { ...a, credits_posted: a.credits_posted + amountCents };
      }
      return a;
    });

    return { nextAccounts, success: true };
  }

  /**
   * Post a pending transfer.
   */
  static postTransfer(
    accounts: TigerBeetleAccount[],
    debitAccountId: string,
    creditAccountId: string,
    amountCents: number
  ): { nextAccounts: TigerBeetleAccount[]; success: boolean } {
    const nextAccounts = accounts.map((a) => {
      if (a.id === debitAccountId) {
        return {
          ...a,
          debits_pending: Math.max(0, a.debits_pending - amountCents),
          debits_posted: a.debits_posted + amountCents,
        };
      }
      if (a.id === creditAccountId) {
        return {
          ...a,
          credits_pending: Math.max(0, a.credits_pending - amountCents),
          credits_posted: a.credits_posted + amountCents,
        };
      }
      return a;
    });
    return { nextAccounts, success: true };
  }

  /**
   * Void a pending transfer.
   */
  static voidTransfer(
    accounts: TigerBeetleAccount[],
    debitAccountId: string,
    creditAccountId: string,
    amountCents: number
  ): { nextAccounts: TigerBeetleAccount[]; success: boolean } {
    const nextAccounts = accounts.map((a) => {
      if (a.id === debitAccountId) {
        return { ...a, debits_pending: Math.max(0, a.debits_pending - amountCents) };
      }
      if (a.id === creditAccountId) {
        return { ...a, credits_pending: Math.max(0, a.credits_pending - amountCents) };
      }
      return a;
    });
    return { nextAccounts, success: true };
  }

  /**
   * Atomically transfers amount + fee in a distributed-ledger style.
   */
  static createTransferWithFee(
    accounts: TigerBeetleAccount[],
    sourceAccountId: string,
    destAccountId: string,
    feeAccountId: string,
    amountCents: number,
    feeCents: number,
    isPending: boolean = false
  ): { nextAccounts: TigerBeetleAccount[]; success: boolean; error?: string } {
    const totalDebit = amountCents + feeCents;

    // First debit source for total (amount + fee)
    const step1 = this.createTransfer(accounts, sourceAccountId, destAccountId, amountCents, isPending);
    if (!step1.success) return step1;

    // Then debit source for fee, credit fee account
    const step2 = this.createTransfer(step1.nextAccounts, sourceAccountId, feeAccountId, feeCents, isPending);
    return step2;
  }
}
