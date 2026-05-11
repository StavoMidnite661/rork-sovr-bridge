import { router } from "expo-router";
import { ArrowDownLeft, ArrowUpRight, Filter, Shield } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenShell } from "@/components/screen-shell";
import {
  Card,
  Hairline,
  StatusDot,
  formatRelative,
  formatUSD,
  shortHash,
} from "@/components/ui";
import Colors from "@/constants/colors";
import { type } from "@/constants/typography";
import { useTreasury } from "@/providers/treasury-provider";
import type { LedgerEntry, LedgerEntryKind, LedgerStatus } from "@/types/treasury";

type FilterKind = "all" | LedgerEntryKind;

export default function LedgerScreen() {
  const { ledger } = useTreasury();
  const [filter, setFilter] = useState<FilterKind>("all");

  const filtered = useMemo(
    () => (filter === "all" ? ledger : ledger.filter((e) => e.kind === filter)),
    [ledger, filter]
  );

  return (
    <ScreenShell
      eyebrow="Audit Trail"
      title="The Ledger"
      subtitle="Double-entry record of every burn and withdrawal. Each row is a sealed receipt."
    >
      {/* Filter */}
      <View style={styles.filterRow}>
        <Filter size={12} color={Colors.brass} strokeWidth={1.5} />
        {(["all", "burn_credit", "withdraw_debit", "transfer_debit"] as FilterKind[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={({ pressed }) => [
              styles.filterChip,
              filter === f && styles.filterChipActive,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && { color: Colors.brass },
              ]}
            >
              {f === "all" ? "All" : f === "burn_credit" ? "Burns" : f === "withdraw_debit" ? "Withdrawals" : "Transfers"}
            </Text>
          </Pressable>
        ))}
      </View>

      <Card style={{ marginTop: 18, padding: 0 }}>
        {filtered.length === 0 ? (
          <View style={{ padding: 32, alignItems: "center" }}>
            <Text style={[type.body, { color: Colors.textMid }]}>
              No entries.
            </Text>
          </View>
        ) : (
          filtered.map((e, i) => (
            <View key={e.id}>
              <Row entry={e} />
              {i < filtered.length - 1 ? <Hairline /> : null}
            </View>
          ))
        )}
      </Card>
    </ScreenShell>
  );
}

function Row({ entry }: { entry: LedgerEntry }) {
  const isBurn = entry.kind === "burn_credit";
  const isTransfer = entry.kind === "transfer_debit" || entry.kind === "transfer_credit";
  const isDebit = entry.amountUsd < 0;
  const Arrow = (isBurn || entry.kind === "transfer_credit") ? ArrowDownLeft : ArrowUpRight;

  // Map internal TB status to UI display
  const displayStatus = (status: LedgerStatus) => {
    switch(status) {
      case "posted": return "verified";
      case "syncing": return "pending";
      case "voided": return "failed";
      default: return status;
    }
  };

  const statusLabel = (status: LedgerStatus) => {
    switch(status) {
      case "posted": return "Settled";
      case "pending": return "Settling";
      case "confirming": return "Verifying";
      case "syncing": return "Syncing";
      case "voided": return "Voided";
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <Pressable
      onPress={() => router.push(`/receipt/${entry.id}`)}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: Colors.inkSoft + "30" },
      ]}
      testID={`ledger-row-${entry.id}`}
    >
      <View style={styles.rowLeft}>
        <View style={styles.rowIcon}>
          <Arrow
            size={14}
            color={!isDebit ? Colors.verified : Colors.brass}
            strokeWidth={1.8}
          />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={[type.bodyStrong, { color: Colors.textHigh }]}>
              {isBurn
                ? `Burn · ${entry.tokenSymbol}`
                : isTransfer
                ? `${isDebit ? "Send" : "Receive"} · ${entry.counterpartyName}`
                : `Withdraw · ${entry.rail?.toUpperCase().replace("_", " ")}`}
            </Text>
            <StatusDot status={displayStatus(entry.status) as any} />
            <Text style={[type.caption, { color: Colors.textMid, fontSize: 9, letterSpacing: 0.5 }]}>
              {statusLabel(entry.status).toUpperCase()}
            </Text>
            {entry.debitAccount.startsWith("private") && (
              <Shield size={10} color={Colors.brass} />
            )}
          </View>
          <Text style={[type.mono, { color: Colors.textLow, marginTop: 4 }]}>
            {entry.txHash ? shortHash(entry.txHash) : `Seal ${entry.seal}`} ·{" "}
            {formatRelative(entry.createdAt)}
          </Text>
          <Text style={[type.caption, { color: Colors.textLow, marginTop: 4 }]}>
            {entry.debitAccount} → {entry.creditAccount}
          </Text>
        </View>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text
          style={[
            type.mono,
            {
              color: entry.amountUsd >= 0 ? Colors.verified : Colors.textHigh,
              fontSize: 14,
            },
          ]}
        >
          {formatUSD(entry.amountUsd, { sign: true })}
        </Text>
        {entry.status === "pending" || entry.status === "confirming" || entry.status === "syncing" ? (
          <Text style={[type.caption, { color: Colors.textLow, fontSize: 10, marginTop: 4 }]}>
            PROVISIONAL
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.inkLine,
    borderRadius: 2,
  },
  filterChipActive: { borderColor: Colors.brassDeep, backgroundColor: Colors.inkRaised },
  filterText: {
    color: Colors.textMid,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  row: { flexDirection: "row", padding: 18, alignItems: "center" },
  rowLeft: { flexDirection: "row", alignItems: "flex-start", flex: 1, gap: 14 },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.inkSoft,
    backgroundColor: Colors.inkDeep,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
});
