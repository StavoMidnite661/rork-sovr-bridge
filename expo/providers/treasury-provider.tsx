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
  Principal,
  RailType,
  SecurityPosture,
  TigerBeetleAccount,
  TreasuryStats,
  Wallet,
} from "@/types/treasury";

const STORAGE_KEY = "sovr.bridge.state.v2";

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
    credits_posted: 100000000,
    flags: { credits_must_not_exceed_debits: false },
  },
  {
    id: "user.balance",
    ledger: 1,
    code: 200,
    debits_pending: 0,
    debits_posted: 0,
    credits_pending: 0,
    credits_posted: 215000,
    flags: { debits_must_not_exceed_credits: true },
  },
  {
    id: "fees.collector",
    ledger: 1,
    code: 999,
    debits_pending: 0,
    debits_posted: 0,
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
    credits_posted: 50000000,
    flags: { is_private: true, debits_must_not_exceed_credits: true },
  },
];

const seedBanks: BankAccount[] = [
  { id: "ba_chase_8821", institution: "Chase", mask: "8821", type: "checking", verified: true, addedAt: Date.now() - 1000*60*60*24*14 },
  { id: "ba_private_9999", institution: "Swiss Private Bank", mask: "9999", type: "savings", verified: true, addedAt: Date.now() - 1000*60*60*24*1, isPrivate: true },
];

const seedWallets: Wallet[] = [
  { id: "w_mm_1", provider: "metamask", address: "0x7A3f9C2e1B8d4F5a6C3E9B0a2F8D7C6E5B4A3F21", chain: "base", connectedAt: Date.now() - 1000*60*60*24*7 },
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
    debitAccount: "treasury.burn_pool",
    creditAccount: "user.balance",
    seal: "S-2A4F-0001",
  },
];

const knownPrincipals: Principal[] = [
  { id: "0x99AA", name: "Satoshi G.", kycLevel: 2, status: "active" },
  { id: "0xBB21", name: "Alice Treasury", kycLevel: 1, status: "active" },
  { id: "0xCC55", name: "Bob Liquidity", kycLevel: 3, status: "active" },
];

const defaultState: PersistedState = {
  banks: seedBanks,
  wallets: seedWallets,
  ledger: seedLedger,
  kyc: { status: "verified", provider: "persona", level: 2, lastReviewed: Date.now() - 1000*60*60*24*30 },
  security: { passkeyEnrolled: true, biometricsEnabled: true, twoFactorEnabled: true, lastAudit: Date.now() - 1000*60*60*6 },
  tbAccounts: seedTBAccounts,
};

const burnableTokens: BurnableToken[] = [
  { symbol: "SOVR", name: "Sovereign Treasury Token", contract: "0x5A9F3C2e8B1D4f7A6C3E9B0a2F8D7C6E5B4A3F21", chain: "base", rate: 1.0, balance: 12480.5 },
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
      } catch (e) {}
      setHydrated(true);
      return true;
    },
  });

  const persist = useCallback(async (next: PersistedState) => {
    setState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {}
  }, []);

  const balance = useMemo<number>(() => {
    const userAcc = state.tbAccounts.find(a => a.id === "user.balance");
    if (!userAcc) return 0;
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

  const initiateBurn = useCallback(async (token: BurnableToken, amount: number) => {
    const amountCents = Math.round(amount * token.rate * 100);
    const res = TigerBeetleSimulation.createTransfer(state.tbAccounts, "treasury.burn_pool", "user.balance", amountCents, true);
    if (!res.success) throw new Error(res.error);

    const id = `lx_${Date.now().toString(36)}`;
    const entry: LedgerEntry = {
      id, kind: "burn_credit", status: "confirming", amountUsd: amount * token.rate,
      createdAt: Date.now(), tokenSymbol: token.symbol, tokenAmount: amount, chain: token.chain,
      txHash: makeTxHash(), debitAccount: "treasury.burn_pool", creditAccount: "user.balance",
      seal: makeSeal("S-2A4F"),
    };

    await persist({ ...state, ledger: [entry, ...state.ledger], tbAccounts: res.nextAccounts });

    setTimeout(() => {
      setState(prev => {
        const postRes = TigerBeetleSimulation.postTransfer(prev.tbAccounts, "treasury.burn_pool", "user.balance", amountCents);
        const updated = prev.ledger.map(e => e.id === id ? { ...e, status: "posted" as const } : e);
        const next = { ...prev, ledger: updated, tbAccounts: postRes.nextAccounts };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    }, 2500);
  }, [state, persist]);

  const initiateWithdraw = useCallback(async (bankId: string, amount: number, rail: RailType) => {
    const amountCents = Math.round(Math.abs(amount) * 100);
    const res = TigerBeetleSimulation.createTransfer(state.tbAccounts, "user.balance", `external.bank.${bankId}`, amountCents, true);
    if (!res.success) throw new Error(res.error);

    const id = `lx_${Date.now().toString(36)}`;
    const entry: LedgerEntry = {
      id, kind: "withdraw_debit", status: "pending", amountUsd: -Math.abs(amount),
      createdAt: Date.now(), bankAccountId: bankId, rail, debitAccount: "user.balance",
      creditAccount: `external.bank.${bankId}`, seal: makeSeal("S-2A4F"),
    };

    await persist({ ...state, ledger: [entry, ...state.ledger], tbAccounts: res.nextAccounts });

    setTimeout(() => {
      setState(prev => {
        const postRes = TigerBeetleSimulation.postTransfer(prev.tbAccounts, "user.balance", `external.bank.${bankId}`, amountCents);
        const updated = prev.ledger.map(e => e.id === id ? { ...e, status: "posted" as const } : e);
        const next = { ...prev, ledger: updated, tbAccounts: postRes.nextAccounts };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    }, 3000);
  }, [state, persist]);

  const initiateTransfer = useCallback(async (destPrincipalId: string, amount: number, memo?: string) => {
    const amountCents = Math.round(amount * 100);
    const feeCents = 10; // Flat 10 cent fee for internal p2p
    const res = TigerBeetleSimulation.createTransferWithFee(state.tbAccounts, "user.balance", `principal.${destPrincipalId}`, "fees.collector", amountCents, feeCents, true);
    if (!res.success) throw new Error(res.error);

    const principal = knownPrincipals.find(p => p.id === destPrincipalId);
    const id = `lx_${Date.now().toString(36)}`;
    const entry: LedgerEntry = {
      id, kind: "transfer_debit", status: "syncing", amountUsd: -amount,
      createdAt: Date.now(), counterpartyId: destPrincipalId, counterpartyName: principal?.name || "Unknown",
      memo, rail: "internal_p2p", debitAccount: "user.balance", creditAccount: `principal.${destPrincipalId}`,
      seal: makeSeal("S-P2P"),
    };

    await persist({ ...state, ledger: [entry, ...state.ledger], tbAccounts: res.nextAccounts });

    // Simulate distributed synchronization
    setTimeout(() => {
      setState(prev => {
        const postRes = TigerBeetleSimulation.postTransfer(prev.tbAccounts, "user.balance", `principal.${destPrincipalId}`, amountCents);
        const postFeeRes = TigerBeetleSimulation.postTransfer(postRes.nextAccounts, "user.balance", "fees.collector", feeCents);
        const updated = prev.ledger.map(e => e.id === id ? { ...e, status: "posted" as const } : e);
        const next = { ...prev, ledger: updated, tbAccounts: postFeeRes.nextAccounts };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    }, 1800);
  }, [state, persist]);

  const linkBank = useCallback(async (bank: any) => {
    const next = { ...state, banks: [...state.banks, { ...bank, id: `ba_${Date.now().toString(36)}`, addedAt: Date.now(), verified: true }] };
    await persist(next);
  }, [state, persist]);

  const linkWallet = useCallback(async (wallet: any) => {
    const next = { ...state, wallets: [...state.wallets, { ...wallet, id: `w_${Date.now().toString(36)}`, connectedAt: Date.now() }] };
    await persist(next);
  }, [state, persist]);

  const isPrivileged = useMemo(() => state.kyc.level >= 2 && state.security.passkeyEnrolled, [state.kyc.level, state.security.passkeyEnrolled]);

  return useMemo(() => ({
    hydrated, banks: state.banks, wallets: state.wallets, ledger: state.ledger,
    kyc: state.kyc, security: state.security, tbAccounts: state.tbAccounts,
    balance, privateBalance, isPrivileged, stats, burnableTokens, knownPrincipals,
    initiateBurn, initiateWithdraw, initiateTransfer, linkBank, linkWallet,
    removeBank: (id: string) => persist({ ...state, banks: state.banks.filter(b => b.id !== id) }),
    removeWallet: (id: string) => persist({ ...state, wallets: state.wallets.filter(w => w.id !== id) }),
  }), [hydrated, state, balance, privateBalance, isPrivileged, stats, initiateBurn, initiateWithdraw, initiateTransfer, linkBank, linkWallet, persist]);
});
