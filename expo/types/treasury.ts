export type Chain = "ethereum" | "base" | "arbitrum" | "optimism" | "polygon";

export type RailType = "ach_standard" | "ach_same_day" | "rtp" | "debit_push";

export type LedgerEntryKind = "burn_credit" | "withdraw_debit" | "fee_debit";

export type LedgerStatus =
  | "pending"
  | "confirming"
  | "verified"
  | "failed"
  | "posted"
  | "voided";

/**
 * TigerBeetle-inspired Account structure for deterministic logic.
 * Tracks balances in fractional cents (integers) to avoid floating point errors.
 */
export interface TigerBeetleAccount {
  id: string;
  debits_pending: number; // Simplified to number for easier JSON serialization, but used as integer
  debits_posted: number;
  credits_pending: number;
  credits_posted: number;
  ledger: number;
  code: number;
  flags: {
    debits_must_not_exceed_credits?: boolean;
    credits_must_not_exceed_debits?: boolean;
    is_private?: boolean;
  };
}

export interface BankAccount {
  id: string;
  institution: string;
  mask: string;
  type: "checking" | "savings" | "debit_card";
  verified: boolean;
  addedAt: number;
  isPrivate?: boolean;
}

export interface Wallet {
  id: string;
  provider: "metamask" | "walletconnect" | "coinbase";
  address: string;
  chain: Chain;
  connectedAt: number;
  isPrivate?: boolean;
}

export interface BurnableToken {
  symbol: string;
  name: string;
  contract: string;
  chain: Chain;
  rate: number; // USD per token
  balance: number;
}

export interface LedgerEntry {
  id: string;
  kind: LedgerEntryKind;
  status: LedgerStatus;
  amountUsd: number; // signed: positive credit, negative debit
  createdAt: number;

  // TigerBeetle specific
  transferId?: string;
  pendingTransferId?: string; // For post/void operations

  // burn-specific
  tokenSymbol?: string;
  tokenAmount?: number;
  chain?: Chain;
  txHash?: string;
  blockNumber?: number;
  confirmations?: number;
  requiredConfirmations?: number;

  // withdraw-specific
  bankAccountId?: string;
  rail?: RailType;
  eta?: string;

  // double-entry
  debitAccount: string;
  creditAccount: string;

  // sealed receipt
  seal: string;
  isPrivate?: boolean;
}

export interface TreasuryStats {
  totalCreditsIssued: number;
  circulatingCredit: number;
  burnPoolReserves: number;
  burnedTokens: number;
  ledgerEntries: number;
}

export interface KycState {
  status: "unverified" | "in_review" | "verified" | "rejected";
  provider: "persona" | "sumsub";
  level: 1 | 2 | 3;
  lastReviewed?: number;
}

export interface SecurityPosture {
  passkeyEnrolled: boolean;
  biometricsEnabled: boolean;
  twoFactorEnabled: boolean;
  lastAudit: number;
}
