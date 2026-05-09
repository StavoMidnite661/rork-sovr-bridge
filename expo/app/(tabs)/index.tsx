import { router } from "expo-router";
import { ArrowDownToLine, ArrowUpRight, Flame, ShieldCheck } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenShell } from "@/components/screen-shell";
import {
  BrassRule,
  Card,
  Hairline,
  SectionLabel,
  StatusDot,
  formatRelative,
  formatUSD,
  shortHash,
} from "@/components/ui";
import Colors from "@/constants/colors";
import { type } from "@/constants/typography";
import { useTreasury } from "@/providers/treasury-provider";

export default function VaultScreen() {
  const { balance, stats, ledger, kyc } = useTreasury();
  const recent = ledger.slice(0, 4);

  return (
    <ScreenShell
      eyebrow="Vault — Treasury Bridge"
      title="Sovereign Holdings"
      subtitle="Verified balance reconciled against the TigerBeetle ledger and on-chain burn pool."
    >
      {/* Hero balance */}
      <Card raised style={styles.hero}>
        <View style={styles.heroTop}>
          <SectionLabel>Account Balance · USD</SectionLabel>
          <View style={styles.kycBadge}>
            <ShieldCheck size={11} color={Colors.brass} strokeWidth={2} />
            <Text style={styles.kycText}>
              KYC L{kyc.level} · {kyc.status === "verified" ? "Verified" : kyc.status}
            </Text>
          </View>
        </View>
        <Text style={[type.monoLg, styles.heroAmount]}>{formatUSD(balance)}</Text>
        <BrassRule style={{ opacity: 0.5, marginVertical: 16 }} />
        <View style={styles.heroRow}>
          <HeroStat
            label="Issued"
            value={formatUSD(stats.totalCreditsIssued)}
          />
          <Hairline vertical />
          <HeroStat
            label="Circulating"
            value={formatUSD(stats.circulatingCredit)}
          />
          <Hairline vertical />
          <HeroStat label="Burned" value={`${stats.burnedTokens.toLocaleString()} t`} />
        </View>

        <View style={styles.actions}>
          <ActionTile
            icon={<Flame size={18} color={Colors.brass} strokeWidth={1.5} />}
            label="Burn → Credit"
            onPress={() => router.push("/(tabs)/burn")}
          />
          <ActionTile
            icon={<ArrowDownToLine size={18} color={Colors.brass} strokeWidth={1.5} />}
            label="Withdraw"
            onPress={() => router.push("/(tabs)/withdraw")}
          />
        </View>
      </Card>

      {/* Treasury ledger summary */}
      <View style={{ marginTop: 28 }}>
        <View style={styles.summaryHeader}>
          <SectionLabel>Treasury Posture</SectionLabel>
          <Text style={styles.timestamp}>
            Reconciled · {new Date().toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </Text>
        </View>
        <Card style={{ marginTop: 12 }}>
          <PostureRow
            label="Burn pool reserves"
            value={formatUSD(stats.burnPoolReserves)}
          />
          <Hairline />
          <PostureRow
            label="Circulating credit"
            value={formatUSD(stats.circulatingCredit)}
          />
          <Hairline />
          <PostureRow
            label="Tokens incinerated"
            value={`${stats.burnedTokens.toLocaleString()} units`}
          />
          <Hairline />
          <PostureRow
            label="Ledger entries"
            value={String(stats.ledgerEntries)}
          />
        </Card>
      </View>

      {/* Recent activity */}
      <View style={{ marginTop: 28 }}>
        <View style={styles.summaryHeader}>
          <SectionLabel>Recent Activity</SectionLabel>
          <Pressable onPress={() => router.push("/(tabs)/ledger")} hitSlop={8}>
            <Text style={styles.linkText}>Full ledger →</Text>
          </Pressable>
        </View>
        <Card style={{ marginTop: 12, padding: 0 }}>
          {recent.length === 0 ? (
            <View style={{ padding: 24 }}>
              <Text style={[type.body, { color: Colors.textMid }]}>
                No transactions yet.
              </Text>
            </View>
          ) : (
            recent.map((e, i) => (
              <View key={e.id}>
                <Pressable
                  onPress={() => router.push(`/receipt/${e.id}`)}
                  style={({ pressed }) => [
                    styles.activityRow,
                    pressed && { backgroundColor: Colors.inkSoft + "30" },
                  ]}
                >
                  <StatusDot status={e.status as any} />
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[type.bodyStrong, { color: Colors.textHigh }]}>
                      {e.kind === "burn_credit"
                        ? `Burn · ${e.tokenSymbol}`
                        : `Withdraw · ${e.rail?.toUpperCase().replace("_", " ")}`}
                    </Text>
                    <Text style={[type.mono, { color: Colors.textLow, marginTop: 2 }]}>
                      {e.txHash ? shortHash(e.txHash) : `Seal ${e.seal}`} · {formatRelative(e.createdAt)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      type.mono,
                      {
                        color: e.amountUsd >= 0 ? Colors.verified : Colors.textHigh,
                        fontSize: 14,
                      },
                    ]}
                  >
                    {formatUSD(e.amountUsd, { sign: true })}
                  </Text>
                  <ArrowUpRight
                    size={14}
                    color={Colors.textLow}
                    strokeWidth={1.5}
                    style={{ marginLeft: 10 }}
                  />
                </Pressable>
                {i < recent.length - 1 ? <Hairline /> : null}
              </View>
            ))
          )}
        </Card>
      </View>

      {/* Footnote */}
      <View style={styles.footnote}>
        <BrassRule style={{ opacity: 0.4, marginBottom: 16 }} />
        <Text style={[type.caption, { color: Colors.textLow, textAlign: "center" }]}>
          SOVR Bridge · Distributed treasury ledger powered by TigerBeetle
        </Text>
        <Text
          style={[
            type.caption,
            { color: Colors.textLow, textAlign: "center", marginTop: 4, opacity: 0.7 },
          ]}
        >
          NIST SP 800-63 · MSB-ready · Audit ID 2A4F-9C81
        </Text>
      </View>
    </ScreenShell>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={[type.caption, { color: Colors.textLow, letterSpacing: 1 }]}>
        {label.toUpperCase()}
      </Text>
      <Text style={[type.mono, { color: Colors.textHigh, marginTop: 4, fontSize: 14 }]}>
        {value}
      </Text>
    </View>
  );
}

function PostureRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.postureRow}>
      <Text style={[type.body, { color: Colors.textMid }]}>{label}</Text>
      <Text style={[type.mono, { color: Colors.textHigh, fontSize: 14 }]}>{value}</Text>
    </View>
  );
}

function ActionTile({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionTile,
        pressed && { backgroundColor: Colors.inkSoft + "60" },
      ]}
    >
      {icon}
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { padding: 24 },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kycBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.brassDeep,
    borderRadius: 2,
  },
  kycText: {
    color: Colors.brass,
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  heroAmount: {
    color: Colors.textHigh,
    marginTop: 14,
    fontSize: 38,
    lineHeight: 44,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  actionTile: {
    flex: 1,
    height: 56,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.inkSoft,
    backgroundColor: Colors.inkDeep,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 2,
  },
  actionLabel: {
    color: Colors.textHigh,
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timestamp: {
    color: Colors.textLow,
    fontFamily: "Menlo",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  linkText: {
    color: Colors.brass,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  postureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  footnote: {
    marginTop: 36,
    paddingHorizontal: 8,
  },
});
