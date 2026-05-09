import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Check, Copy, ExternalLink, X } from "lucide-react-native";
import React, { useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BrassRule,
  Hairline,
  SectionLabel,
  StatusDot,
  formatUSD,
  shortHash,
} from "@/components/ui";
import Colors from "@/constants/colors";
import { type } from "@/constants/typography";
import { useTreasury } from "@/providers/treasury-provider";

export default function ReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ledger } = useTreasury();
  const insets = useSafeAreaInsets();
  const entry = useMemo(() => ledger.find((e) => e.id === id), [ledger, id]);

  if (!entry) {
    return (
      <View style={styles.root}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={[type.body, { color: Colors.textMid, padding: 24 }]}>
          Entry not found.
        </Text>
      </View>
    );
  }

  const isBurn = entry.kind === "burn_credit";
  const confirmRatio =
    entry.confirmations && entry.requiredConfirmations
      ? Math.min(1, entry.confirmations / entry.requiredConfirmations)
      : entry.status === "verified"
      ? 1
      : 0.1;

  const statusLabel =
    entry.status === "verified"
      ? "Sealed · Verified"
      : entry.status === "confirming"
      ? `Confirming ${entry.confirmations}/${entry.requiredConfirmations}`
      : entry.status === "pending"
      ? "Pending settlement"
      : "Failed";

  const onCopy = () => {
    if (Platform.OS !== "web")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[Colors.inkDeep, Colors.ink]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View>
            <SectionLabel>Sealed Receipt</SectionLabel>
            <Text style={[type.mono, { color: Colors.textLow, marginTop: 4 }]}>
              {entry.seal}
            </Text>
          </View>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.closeBtn}>
            <X size={18} color={Colors.textMid} strokeWidth={1.5} />
          </Pressable>
        </View>

        {/* Document */}
        <View style={styles.doc}>
          <View style={styles.docHeader}>
            <View style={styles.crest}>
              <View style={styles.crestInner} />
            </View>
            <Text style={[type.title, { color: Colors.textInk, marginTop: 16 }]}>
              {isBurn ? "Burn → Credit Receipt" : "Withdrawal Receipt"}
            </Text>
            <Text style={[type.caption, { color: "#6b5a32", marginTop: 6, letterSpacing: 1.5 }]}>
              SOVR BRIDGE · TREASURY ARCHIVE
            </Text>
          </View>

          <View style={styles.docDivider} />

          <View style={{ alignItems: "center", marginTop: 18 }}>
            <Text style={[type.caption, { color: "#6b5a32", letterSpacing: 2 }]}>
              {isBurn ? "CREDITED" : "DEBITED"}
            </Text>
            <Text style={[styles.docAmount]}>
              {formatUSD(entry.amountUsd, { sign: true })}
            </Text>
            <View style={styles.docStatus}>
              <StatusDot status={entry.status as any} />
              <Text style={[type.mono, { color: "#3f342a", marginLeft: 8, fontSize: 12 }]}>
                {statusLabel}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          {entry.status !== "verified" && entry.status !== "failed" ? (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${confirmRatio * 100}%` }]} />
            </View>
          ) : null}

          <View style={styles.docDivider} />

          <View style={{ marginTop: 6 }}>
            <DocRow label="Date" value={new Date(entry.createdAt).toLocaleString()} />
            {isBurn ? (
              <>
                <DocRow label="Token" value={`${entry.tokenAmount} ${entry.tokenSymbol}`} />
                <DocRow label="Chain" value={(entry.chain ?? "").toUpperCase()} />
                <DocRow
                  label="Tx Hash"
                  value={shortHash(entry.txHash ?? "", 12, 10)}
                  trailing={<Copy size={12} color="#6b5a32" />}
                  onPress={onCopy}
                />
                <DocRow label="Block" value={entry.blockNumber?.toLocaleString() ?? "—"} />
                <DocRow
                  label="Confirmations"
                  value={`${entry.confirmations}/${entry.requiredConfirmations}`}
                />
              </>
            ) : (
              <>
                <DocRow label="Rail" value={(entry.rail ?? "").toUpperCase().replace("_", " ")} />
                <DocRow label="ETA" value={entry.eta ?? "—"} />
                <DocRow label="Bank" value={entry.bankAccountId ?? "—"} />
              </>
            )}
          </View>

          <View style={styles.docDivider} />

          <SectionLabel color="#6b5a32" style={{ marginTop: 4 }}>
            Double-Entry · TigerBeetle
          </SectionLabel>
          <View style={styles.entriesBox}>
            <Text style={[type.mono, { color: "#3f342a" }]}>
              DR  {entry.debitAccount.padEnd(28, " ")} {formatUSD(Math.abs(entry.amountUsd))}
            </Text>
            <Text style={[type.mono, { color: "#3f342a", marginTop: 4 }]}>
              CR  {entry.creditAccount.padEnd(28, " ")} {formatUSD(Math.abs(entry.amountUsd))}
            </Text>
          </View>

          {/* Wax seal */}
          <View style={styles.sealRow}>
            <View style={styles.waxSeal}>
              <Text style={styles.waxText}>SOVR</Text>
              <Text style={styles.waxSubText}>SEALED</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={[type.caption, { color: "#6b5a32", letterSpacing: 1.5 }]}>
                AUDIT REFERENCE
              </Text>
              <Text style={[type.mono, { color: "#3f342a", marginTop: 4 }]}>
                {entry.seal}
              </Text>
              <Text style={[type.caption, { color: "#6b5a32", marginTop: 6 }]}>
                Cryptographically attested · NIST SP 800-63
              </Text>
            </View>
          </View>
        </View>

        {entry.txHash ? (
          <Pressable
            style={({ pressed }) => [styles.explorerBtn, pressed && { opacity: 0.8 }]}
            onPress={() => {}}
          >
            <ExternalLink size={14} color={Colors.brass} strokeWidth={1.5} />
            <Text style={styles.explorerText}>View on Block Explorer</Text>
          </Pressable>
        ) : null}

        <BrassRule style={{ opacity: 0.4, marginTop: 24 }} />
        <Text
          style={[
            type.caption,
            { color: Colors.textLow, textAlign: "center", marginTop: 16 },
          ]}
        >
          This receipt is the immutable record of the transfer. Retain for audit.
        </Text>
      </ScrollView>
    </View>
  );
}

function DocRow({
  label,
  value,
  trailing,
  onPress,
}: {
  label: string;
  value: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={styles.docRow}
    >
      <Text style={[type.caption, { color: "#6b5a32", letterSpacing: 1.5, flex: 1 }]}>
        {label.toUpperCase()}
      </Text>
      <Text style={[type.mono, { color: "#1f1a14", marginRight: 8 }]} numberOfLines={1}>
        {value}
      </Text>
      {trailing}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.ink },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.inkSoft,
    borderRadius: 18,
  },
  doc: {
    backgroundColor: Colors.paper,
    padding: 26,
    borderWidth: 1,
    borderColor: Colors.paperLine,
  },
  docHeader: { alignItems: "center", marginBottom: 4 },
  crest: {
    width: 48,
    height: 48,
    borderWidth: 1.5,
    borderColor: Colors.brassDeep,
    transform: [{ rotate: "45deg" }],
    alignItems: "center",
    justifyContent: "center",
  },
  crestInner: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: Colors.brassDeep,
    backgroundColor: Colors.brass,
  },
  docDivider: {
    height: 1,
    backgroundColor: Colors.paperLine,
    marginVertical: 18,
  },
  docAmount: {
    fontFamily: "Menlo",
    fontSize: 36,
    color: Colors.textInk,
    marginTop: 10,
    letterSpacing: -1,
  },
  docStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  progressTrack: {
    height: 3,
    backgroundColor: Colors.paperLine,
    marginTop: 18,
    overflow: "hidden",
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.brass,
  },
  docRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.paperLine,
  },
  entriesBox: {
    backgroundColor: Colors.paperWarm,
    padding: 14,
    marginTop: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.paperLine,
  },
  sealRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
  },
  waxSeal: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.brassDeep,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.brass,
  },
  waxText: {
    color: Colors.paper,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
  },
  waxSubText: {
    color: Colors.brassLight,
    fontSize: 7,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  explorerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "center",
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.brassDeep,
    borderRadius: 2,
  },
  explorerText: {
    color: Colors.brass,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "600",
    textTransform: "uppercase",
  },
});
