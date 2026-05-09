import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import type {
  BankAccount,
  BurnableToken,
  KycState,
  LedgerEntry,
  RailType,
  SecurityPosture,
  TreasuryStats,
  Wallet,
} from "@/types/treasury";

const STORAGE_KEY = "sovr.bridge.state.v1";

interface PersistedState {
  banks: BankAccount[];
  wallets: Wallet[];
  ledger: LedgerEntry[];
  kyc: KycState;
  security: SecurityPosture;
}

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
          setState(parsed);
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
    return state.ledger
      .filter((e) => e.status === "verified")
      .reduce((sum, e) => sum + e.amountUsd, 0);
  }, [state.ledger]);

  const stats = useMemo<TreasuryStats>(() => {
    const totalCreditsIssued = state.ledger
      .filter((e) => e.kind === "burn_credit" && e.status === "verified")
      .reduce((s, e) => s + e.amountUsd, 0);
    const totalWithdrawn = state.ledger
      .filter((e) => e.kind === "withdraw_debit" && e.status === "verified")
      .reduce((s, e) => s + Math.abs(e.amountUsd), 0);
    const burnedTokens = state.ledger
      .filter((e) => e.kind === "burn_credit" && e.status === "verified")
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
        debitAccount: "treasury.burn_pool",
        creditAccount: "user.balance",
        seal: makeSeal("S-2A4F"),
      };
      const next = { ...state, ledger: [entry, ...state.ledger] };
      await persist(next);

      // simulate confirmation progression
      const tickerId = entry.id;
      const confirm = async (count: number) => {
        await new Promise((r) => setTimeout(r, 900));
        setState((prev) => {
          const updated = prev.ledger.map((e) =>
            e.id === tickerId
              ? {
                  ...e,
                  confirmations: count,
                  status:
                    count >= (e.requiredConfirmations ?? 32)
                      ? ("verified" as const)
                      : ("confirming" as const),
                }
              : e
          );
          const nextState = { ...prev, ledger: updated };
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextState)).catch(
            () => {}
          );
          return nextState;
        });
      };
      (async () => {
        for (const c of [8, 16, 24, 32]) {
          await confirm(c);
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
        debitAccount: "user.balance",
        creditAccount: `external.bank.${bankAccountId}`,
        seal: makeSeal("S-2A4F"),
      };
      const next = { ...state, ledger: [entry, ...state.ledger] };
      await persist(next);

      // simulate settlement
      setTimeout(() => {
        setState((prev) => {
          const updated = prev.ledger.map((e) =>
            e.id === id ? { ...e, status: "verified" as const } : e
          );
          const nextState = { ...prev, ledger: updated };
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextState)).catch(
            () => {}
          );
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

  return useMemo(
    () => ({
      hydrated,
      banks: state.banks,
      wallets: state.wallets,
      ledger: state.ledger,
      kyc: state.kyc,
      security: state.security,
      balance,
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
      balance,
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
