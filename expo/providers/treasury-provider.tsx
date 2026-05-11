import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { TigerBeetleSimulation } from "@/lib/ledger";
import type {
  BankAccount,
  BurnableToken,
  KycState,
  LedgerEntry,
  RailType,
  SecurityPosture,
  TigerBeetleAccount,
  TreasuryStats,
  Wallet,
} from "@/types/treasury";

const STORAGE_KEY = "sovr.bridge.state.v2"; // Bumped version for TB logic

interface PersistedState {
  banks: BankAccount[];
  wallets: Wallet[];
  ledger: LedgerEntry[];
  kyc: KycState;
  security: SecurityPosture;
  tbAccounts: TigerBeetleAccount[];
}

const seedTBAccounts: TigerBeetleAccount[] = [
  {
    id: "treasury.burn_pool",
    ledger: 1,
    code: 100,
    debits_pending: 0,
    debits_posted: 0,
    credits_pending: 0,
    credits_posted: 100000000, // $1M initial seed
    flags: { credits_must_not_exceed_debits: false },
  },
  {
    id: "user.balance",
    ledger: 1,
    code: 200,
    debits_pending: 0,
    debits_posted: 120000,
    credits_pending: 0,
    credits_posted: 335000,
    flags: { debits_must_not_exceed_credits: true },
  },
  {
    id: "external.bank.chase_8821",
    ledger: 1,
    code: 300,
    debits_pending: 0,
    debits_posted: 120000,
    credits_pending: 0,
    credits_posted: 0,
    flags: {},
  },
  {
    id: "private.vault.privileged",
    ledger: 2,
    code: 777,
    debits_pending: 0,
    debits_posted: 0,
    credits_pending: 0,
    credits_posted: 50000000, // $500k Private Vault
    flags: { is_private: true, debits_must_not_exceed_credits: true },
  },
];

const seedBanks: BankAccount[] = [
  {
    id: "ba_chase_8821",
    institution: "Chase",
    mask: "8821",
    type: "checking",
    verified: true,
    addedAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
  },
  {
    id: "ba_amex_4402",
    institution: "American Express",
    mask: "4402",
    type: "debit_card",
    verified: true,
    addedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: "ba_private_9999",
    institution: "Swiss Private Bank",
    mask: "9999",
    type: "savings",
    verified: true,
    addedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    isPrivate: true,
  },
];

const seedWallets: Wallet[] = [
  {
    id: "w_mm_1",
    provider: "metamask",
    address: "0x7A3f9C2e1B8d4F5a6C3E9B0a2F8D7C6E5B4A3F21",
    chain: "base",
    connectedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  },
];

const seedLedger: LedgerEntry[] = [
  {
    id: "lx_0001",
    kind: "burn_credit",
    status: "verified",
    amountUsd: 2500,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    tokenSymbol: "SOVR",
    tokenAmount: 2500,
    chain: "base",
    txHash: "0x4a3f9c2e1b8d4f5a6c3e9b0a2f8d7c6e5b4a3f21d8c7b6a5949382716054321a",
    blockNumber: 18234092,
    confirmations: 64,
    requiredConfirmations: 32,
    debitAccount: "treasury.burn_pool",
    creditAccount: "user.balance",
    seal: "S-2A4F-0001",
  },
  {
    id: "lx_0002",
    kind: "withdraw_debit",
    status: "verified",
    amountUsd: -1200,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    bankAccountId: "ba_chase_8821",
    rail: "ach_same_day",
    eta: "Settled",
    debitAccount: "user.balance",
    creditAccount: "external.bank.chase_8821",
    seal: "S-2A4F-0002",
  },
  {
    id: "lx_0003",
    kind: "burn_credit",
    status: "verified",
    amountUsd: 850,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    tokenSymbol: "SOVR",
    tokenAmount: 850,
    chain: "base",
    txHash: "0x91bca7e2f3d4c5b6a7980e1f2d3c4b5a69788776655443322110ffeeddccbbaa",
    blockNumber: 18298311,
    confirmations: 48,
    requiredConfirmations: 32,
    debitAccount: "treasury.burn_pool",
    creditAccount: "user.balance",
    seal: "S-2A4F-0003",
  },
];

const defaultState: PersistedState = {
  banks: seedBanks,
  wallets: seedWallets,
  ledger: seedLedger,
  kyc: {
    status: "verified",
    provider: "persona",
    level: 2,
    lastReviewed: Date.now() - 1000 * 60 * 60 * 24 * 30,
  },
  security: {
    passkeyEnrolled: true,
    biometricsEnabled: true,
    twoFactorEnabled: true,
    lastAudit: Date.now() - 1000 * 60 * 60 * 6,
  },
  tbAccounts: seedTBAccounts,
};

const burnableTokens: BurnableToken[] = [
  {
    symbol: "SOVR",
    name: "Sovereign Treasury Token",
    contract: "0x5A9F3C2e8B1D4f7A6C3E9B0a2F8D7C6E5B4A3F21",
    chain: "base",
    rate: 1.0,
    balance: 12480.5,
  },
  {
    symbol: "TBND",
    name: "TreasuryBond Stable",
    contract: "0x3C8B7D2e1A9f4F5a6C3E9B0a2F8D7C6E5B4A3FAA",
    chain: "arbitrum",
    rate: 1.0,
    balance: 4200,
  },
];

function makeSeal(prefix: string): string {
  const r = Math.random().toString(16).slice(2, 6).toUpperCase();
  const n = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}-${r}-${n}`;
}

function makeTxHash(): string {
  let s = "0x";
  const chars = "0123456789abcdef";
  for (let i = 0; i < 64; i++) s += chars[Math.floor(Math.random() * 16)];
  return s;
}

export const [TreasuryProvider, useTreasury] = createContextHook(() => {
  const [state, setState] = useState<PersistedState>(defaultState);
  const [hydrated, setHydrated] = useState<boolean>(false);

  useQuery({
    queryKey: ["sovr-bridge-hydrate"],
    queryFn: async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as PersistedState;
          // Merge seed private accounts if they don't exist in persisted state
          const mergedTB = [...parsed.tbAccounts];
          seedTBAccounts.forEach(seed => {
            if (!mergedTB.find(a => a.id === seed.id)) mergedTB.push(seed);
          });
          setState({ ...parsed, tbAccounts: mergedTB });
        }
      } catch (e) {
        console.log("[treasury] hydrate failed", e);
      }
      setHydrated(true);
      return true;
    },
  });

  const persist = useCallback(async (next: PersistedState) => {
    setState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.log("[treasury] persist failed", e);
    }
  }, []);

  const balance = useMemo<number>(() => {
    const userAcc = state.tbAccounts.find(a => a.id === "user.balance");
    if (!userAcc) return 0;
    // Real-world balance calculation: Credits posted - Debits posted
    return (userAcc.credits_posted - userAcc.debits_posted) / 100;
  }, [state.tbAccounts]);

  const privateBalance = useMemo<number>(() => {
    const privAcc = state.tbAccounts.find(a => a.id === "private.vault.privileged");
    if (!privAcc) return 0;
    return (privAcc.credits_posted - privAcc.debits_posted) / 100;
  }, [state.tbAccounts]);

  const stats = useMemo<TreasuryStats>(() => {
    const totalCreditsIssued = state.ledger
      .filter((e) => e.kind === "burn_credit" && (e.status === "verified" || e.status === "posted"))
      .reduce((s, e) => s + e.amountUsd, 0);
    const totalWithdrawn = state.ledger
      .filter((e) => e.kind === "withdraw_debit" && (e.status === "verified" || e.status === "posted"))
      .reduce((s, e) => s + Math.abs(e.amountUsd), 0);
    const burnedTokens = state.ledger
      .filter((e) => e.kind === "burn_credit" && (e.status === "verified" || e.status === "posted"))
      .reduce((s, e) => s + (e.tokenAmount ?? 0), 0);
    return {
      totalCreditsIssued,
      circulatingCredit: totalCreditsIssued - totalWithdrawn,
      burnPoolReserves: totalCreditsIssued,
      burnedTokens,
      ledgerEntries: state.ledger.length,
    };
  }, [state.ledger]);

  const initiateBurn = useCallback(
    async (token: BurnableToken, amount: number): Promise<LedgerEntry> => {
      const amountCents = Math.round(amount * token.rate * 100);
      const debitAccId = "treasury.burn_pool";
      const creditAccId = "user.balance";

      const transferResult = TigerBeetleSimulation.createTransfer(
        state.tbAccounts,
        debitAccId,
        creditAccId,
        amountCents,
        true // Pending
      );

      if (!transferResult.success) {
        throw new Error(transferResult.error || "Transfer failed");
      }

      const id = `lx_${Date.now().toString(36)}`;
      const entry: LedgerEntry = {
        id,
        kind: "burn_credit",
        status: "confirming",
        amountUsd: amount * token.rate,
        createdAt: Date.now(),
        tokenSymbol: token.symbol,
        tokenAmount: amount,
        chain: token.chain,
        txHash: makeTxHash(),
        blockNumber: 18000000 + Math.floor(Math.random() * 1000000),
        confirmations: 3,
        requiredConfirmations: 32,
        debitAccount: debitAccId,
        creditAccount: creditAccId,
        seal: makeSeal("S-2A4F"),
      };

      const next = {
        ...state,
        ledger: [entry, ...state.ledger],
        tbAccounts: transferResult.nextAccounts
      };
      await persist(next);

      // simulate confirmation progression and eventual post
      const tickerId = entry.id;
      (async () => {
        for (const c of [8, 16, 24, 32]) {
          await new Promise((r) => setTimeout(r, 900));
          setState((prev) => {
            const isDone = c >= 32;
            let currentAccounts = prev.tbAccounts;

            if (isDone) {
              const postRes = TigerBeetleSimulation.postTransfer(
                currentAccounts,
                debitAccId,
                creditAccId,
                amountCents
              );
              currentAccounts = postRes.nextAccounts;
            }

            const updated = prev.ledger.map((e) =>
              e.id === tickerId
                ? {
                    ...e,
                    confirmations: c,
                    status: isDone ? ("posted" as const) : ("confirming" as const),
                  }
                : e
            );
            const nextState = { ...prev, ledger: updated, tbAccounts: currentAccounts };
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextState)).catch(() => {});
            return nextState;
          });
        }
      })();

      return entry;
    },
    [state, persist]
  );

  const initiateWithdraw = useCallback(
    async (
      bankAccountId: string,
      amount: number,
      rail: RailType
    ): Promise<LedgerEntry> => {
      const amountCents = Math.round(Math.abs(amount) * 100);
      const debitAccId = "user.balance";
      const creditAccId = `external.bank.${bankAccountId}`;

      // Check if account exists in TB simulation, if not create a stub
      let currentTBAccounts = state.tbAccounts;
      if (!currentTBAccounts.find(a => a.id === creditAccId)) {
        currentTBAccounts = [
          ...currentTBAccounts,
          {
            id: creditAccId,
            ledger: 1,
            code: 300,
            debits_pending: 0,
            debits_posted: 0,
            credits_pending: 0,
            credits_posted: 0,
            flags: {},
          }
        ];
      }

      const transferResult = TigerBeetleSimulation.createTransfer(
        currentTBAccounts,
        debitAccId,
        creditAccId,
        amountCents,
        true // Pending
      );

      if (!transferResult.success) {
        throw new Error(transferResult.error || "Withdrawal failed");
      }

      const eta =
        rail === "rtp"
          ? "≈ 30 seconds"
          : rail === "ach_same_day"
          ? "Today, by 5:00 PM ET"
          : rail === "debit_push"
          ? "≈ 2 minutes"
          : "1–3 business days";

      const id = `lx_${Date.now().toString(36)}`;
      const entry: LedgerEntry = {
        id,
        kind: "withdraw_debit",
        status: "pending",
        amountUsd: -Math.abs(amount),
        createdAt: Date.now(),
        bankAccountId,
        rail,
        eta,
        debitAccount: debitAccId,
        creditAccount: creditAccId,
        seal: makeSeal("S-2A4F"),
      };

      const next = {
        ...state,
        ledger: [entry, ...state.ledger],
        tbAccounts: transferResult.nextAccounts
      };
      await persist(next);

      // simulate settlement
      setTimeout(() => {
        setState((prev) => {
          const postRes = TigerBeetleSimulation.postTransfer(
            prev.tbAccounts,
            debitAccId,
            creditAccId,
            amountCents
          );
          const updated = prev.ledger.map((e) =>
            e.id === id ? { ...e, status: "posted" as const } : e
          );
          const nextState = { ...prev, ledger: updated, tbAccounts: postRes.nextAccounts };
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextState)).catch(() => {});
          return nextState;
        });
      }, 2400);

      return entry;
    },
    [state, persist]
  );

  const linkBank = useCallback(
    async (bank: Omit<BankAccount, "id" | "addedAt" | "verified">) => {
      const next: PersistedState = {
        ...state,
        banks: [
          ...state.banks,
          {
            ...bank,
            id: `ba_${Date.now().toString(36)}`,
            addedAt: Date.now(),
            verified: true,
          },
        ],
      };
      await persist(next);
    },
    [state, persist]
  );

  const removeBank = useCallback(
    async (id: string) => {
      await persist({ ...state, banks: state.banks.filter((b) => b.id !== id) });
    },
    [state, persist]
  );

  const linkWallet = useCallback(
    async (wallet: Omit<Wallet, "id" | "connectedAt">) => {
      const next: PersistedState = {
        ...state,
        wallets: [
          ...state.wallets,
          {
            ...wallet,
            id: `w_${Date.now().toString(36)}`,
            connectedAt: Date.now(),
          },
        ],
      };
      await persist(next);
    },
    [state, persist]
  );

  const removeWallet = useCallback(
    async (id: string) => {
      await persist({
        ...state,
        wallets: state.wallets.filter((w) => w.id !== id),
      });
    },
    [state, persist]
  );

  const isPrivileged = useMemo(() => state.kyc.level >= 2 && state.security.passkeyEnrolled, [state.kyc.level, state.security.passkeyEnrolled]);

  return useMemo(
    () => ({
      hydrated,
      banks: state.banks,
      wallets: state.wallets,
      ledger: state.ledger,
      kyc: state.kyc,
      security: state.security,
      tbAccounts: state.tbAccounts,
      balance,
      privateBalance,
      isPrivileged,
      stats,
      burnableTokens,
      initiateBurn,
      initiateWithdraw,
      linkBank,
      removeBank,
      linkWallet,
      removeWallet,
    }),
    [
      hydrated,
      state.banks,
      state.wallets,
      state.ledger,
      state.kyc,
      state.security,
      state.tbAccounts,
      balance,
      privateBalance,
      isPrivileged,
      stats,
      initiateBurn,
      initiateWithdraw,
      linkBank,
      removeBank,
      linkWallet,
      removeWallet,
    ]
  );
});
