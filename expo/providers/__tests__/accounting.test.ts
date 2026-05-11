import { expect, test, describe } from "bun:test";
import { TigerBeetleSimulation } from "../../lib/ledger";
import type { TigerBeetleAccount } from "../../types/treasury";

describe("TigerBeetleSimulation P2P", () => {
  const initialAccounts: TigerBeetleAccount[] = [
    {
      id: "source",
      ledger: 1,
      code: 1,
      debits_pending: 0,
      debits_posted: 0,
      credits_pending: 0,
      credits_posted: 1000,
      flags: { debits_must_not_exceed_credits: true },
    },
    {
      id: "dest",
      ledger: 1,
      code: 1,
      debits_pending: 0,
      debits_posted: 0,
      credits_pending: 0,
      credits_posted: 0,
      flags: {},
    },
    {
      id: "fees",
      ledger: 1,
      code: 999,
      debits_pending: 0,
      debits_posted: 0,
      credits_pending: 0,
      credits_posted: 0,
      flags: {},
    },
  ];

  test("performs atomic transfer with fee", () => {
    const { nextAccounts, success } = TigerBeetleSimulation.createTransferWithFee(
      initialAccounts,
      "source",
      "dest",
      "fees",
      500,
      50,
      true
    );

    expect(success).toBe(true);
    const src = nextAccounts.find(a => a.id === "source")!;
    const dst = nextAccounts.find(a => a.id === "dest")!;
    const fee = nextAccounts.find(a => a.id === "fees")!;

    expect(src.debits_pending).toBe(550);
    expect(dst.credits_pending).toBe(500);
    expect(fee.credits_pending).toBe(50);
  });

  test("fails if source has insufficient funds for amount + fee", () => {
    const { success, error } = TigerBeetleSimulation.createTransferWithFee(
      initialAccounts,
      "source",
      "dest",
      "fees",
      960,
      50,
      false
    );

    expect(success).toBe(false);
    expect(error).toContain("Insufficient funds");
  });
});
