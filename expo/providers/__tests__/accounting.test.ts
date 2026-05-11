import { expect, test, describe } from "bun:test";
import { TigerBeetleSimulation } from "../../lib/ledger";
import type { TigerBeetleAccount } from "../../types/treasury";

describe("TigerBeetleSimulation", () => {
  const initialAccounts: TigerBeetleAccount[] = [
    {
      id: "a",
      ledger: 1,
      code: 1,
      debits_pending: 0,
      debits_posted: 0,
      credits_pending: 0,
      credits_posted: 1000,
      flags: { debits_must_not_exceed_credits: true },
    },
    {
      id: "b",
      ledger: 1,
      code: 1,
      debits_pending: 0,
      debits_posted: 0,
      credits_pending: 0,
      credits_posted: 0,
      flags: {},
    },
  ];

  test("creates a pending transfer", () => {
    const { nextAccounts, success } = TigerBeetleSimulation.createTransfer(
      initialAccounts,
      "a",
      "b",
      500,
      true
    );

    expect(success).toBe(true);
    const accA = nextAccounts.find((a) => a.id === "a")!;
    const accB = nextAccounts.find((a) => a.id === "b")!;
    expect(accA.debits_pending).toBe(500);
    expect(accB.credits_pending).toBe(500);
    expect(accA.debits_posted).toBe(0);
    expect(accB.credits_posted).toBe(0);
  });

  test("posts a pending transfer", () => {
    const { nextAccounts: pendingAccounts } = TigerBeetleSimulation.createTransfer(
      initialAccounts,
      "a",
      "b",
      500,
      true
    );

    const { nextAccounts: postedAccounts, success } = TigerBeetleSimulation.postTransfer(
      pendingAccounts,
      "a",
      "b",
      500
    );

    expect(success).toBe(true);
    const accA = postedAccounts.find((a) => a.id === "a")!;
    const accB = postedAccounts.find((a) => a.id === "b")!;
    expect(accA.debits_pending).toBe(0);
    expect(accA.debits_posted).toBe(500);
    expect(accB.credits_pending).toBe(0);
    expect(accB.credits_posted).toBe(500);
  });

  test("prevents overdrawing with debits_must_not_exceed_credits", () => {
    const { success, error } = TigerBeetleSimulation.createTransfer(
      initialAccounts,
      "a",
      "b",
      1500,
      false
    );

    expect(success).toBe(false);
    expect(error).toContain("Insufficient funds");
  });

  test("voids a pending transfer", () => {
    const { nextAccounts: pendingAccounts } = TigerBeetleSimulation.createTransfer(
      initialAccounts,
      "a",
      "b",
      500,
      true
    );

    const { nextAccounts: voidedAccounts, success } = TigerBeetleSimulation.voidTransfer(
      pendingAccounts,
      "a",
      "b",
      500
    );

    expect(success).toBe(true);
    const accA = voidedAccounts.find((a) => a.id === "a")!;
    const accB = voidedAccounts.find((a) => a.id === "b")!;
    expect(accA.debits_pending).toBe(0);
    expect(accB.credits_pending).toBe(0);
  });
});
