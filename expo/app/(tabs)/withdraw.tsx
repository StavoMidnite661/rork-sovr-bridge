import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Building2, Check, CreditCard, Zap } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenShell } from "@/components/screen-shell";
import {
  BrassRule,
  Card,
  Hairline,
  PrimaryButton,
  SectionLabel,
  formatUSD,
} from "@/components/ui";
import Colors from "@/constants/colors";
import { type } from "@/constants/typography";
import { useTreasury } from "@/providers/treasury-provider";
import type { BankAccount, RailType } from "@/types/treasury";

const RAILS: { id: RailType; label: string; eta: string; fee: string; icon: any }[] = [
  { id: "rtp", label: "RTP / FedNow", eta: "≈ 30 seconds", fee: "$0.50", icon: Zap },
  { id: "ach_same_day", label: "Same-Day ACH", eta: "Today by 5pm ET", fee: "$0.25", icon: Building2 },
  { id: "debit_push", label: "Debit Push", eta: "≈ 2 minutes", fee: "1.5%", icon: CreditCard },
  { id: "ach_standard", label: "Standard ACH", eta: "1–3 business days", fee: "Free", icon: Building2 },
];

export default function WithdrawScreen() {
  const { banks, balance, initiateWithdraw } = useTreasury();
  const [bank, setBank] = useState<BankAccount | null>(banks[0] ?? null);
  const [rail, setRail] = useState<RailType>("ach_same_day");
  const [amount, setAmount] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const numeric = useMemo(() => parseFloat(amount || "0") || 0, [amount]);
  const exceeds = numeric > balance;

  const onConfirm = async () => {
    if (!bank || !numeric || exceeds) return;
    setSubmitting(true);
    if (Platform.OS !== "web")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const entry = await initiateWithdraw(bank.id, numeric, rail);
    setSubmitting(false);
    router.push(`/receipt/${entry.id}`);
    setAmount("");
  };

  return (
    <ScreenShell
      eyebrow="Off-Ramp · Settlement"
      title="Withdraw"
      subtitle="Push verified ledger credit to a linked bank or debit card via Plaid-cleared rails."
    >
      {/* Available */}
      <Card raised>
        <SectionLabel>Available · TigerBeetle</SectionLabel>
        <Text style={[type.monoLg, { color: Colors.textHigh, marginTop: 8 }]}>
          {formatUSD(balance)}
        </Text>
      </Card>

      {/* Amount */}
      <View style={{ marginTop: 28 }}>
        <SectionLabel>Withdraw Amount</SectionLabel>
        <Card style={{ marginTop: 12, padding: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "baseline" }}>
            <Text style={[type.title, { color: Colors.brass, marginRight: 6 }]}>$</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={Colors.textLow}
              keyboardType="decimal-pad"
              style={styles.amountInput}
              testID="withdraw-amount-input"
            />
          </View>
          <View style={styles.quickRow}>
            {[100, 500, 1000].map((v) => (
              <Pressable
                key={v}
                onPress={() => setAmount(String(v))}
                style={({ pressed }) => [
                  styles.quickPill,
                  pressed && { backgroundColor: Colors.inkSoft },
                ]}
              >
                <Text style={styles.quickPillText}>${v}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => setAmount(String(Math.max(0, balance).toFixed(2)))}
              style={({ pressed }) => [
                styles.quickPill,
                pressed && { backgroundColor: Colors.inkSoft },
              ]}
            >
              <Text style={styles.quickPillText}>MAX</Text>
            </Pressable>
          </View>
          {exceeds ? (
            <Text style={[type.caption, { color: Colors.failed, marginTop: 10 }]}>
              Exceeds available balance.
            </Text>
          ) : null}
        </Card>
      </View>

      {/* Destination */}
      <View style={{ marginTop: 28 }}>
        <SectionLabel>Destination</SectionLabel>
        <View style={{ marginTop: 12, gap: 12 }}>
          {banks.length === 0 ? (
            <Card>
              <Text style={[type.body, { color: Colors.textMid }]}>
                No accounts linked. Add one in Accounts.
              </Text>
            </Card>
          ) : (
            banks.map((b) => {
              const selected = bank?.id === b.id;
              const Icon = b.type === "debit_card" ? CreditCard : Building2;
              return (
                <Pressable
                  key={b.id}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
                    setBank(b);
                  }}
                  style={({ pressed }) => [
                    styles.bankCard,
                    selected && styles.bankCardSelected,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <View style={styles.bankIcon}>
                    <Icon size={16} color={Colors.brass} strokeWidth={1.5} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[type.bodyStrong, { color: Colors.textHigh }]}>
                      {b.institution}
                    </Text>
                    <Text style={[type.mono, { color: Colors.textLow, marginTop: 4 }]}>
                      {b.type === "debit_card" ? "Debit ····" : "Acct ····"} {b.mask}
                    </Text>
                  </View>
                  {selected ? (
                    <View style={styles.checkmark}>
                      <Check size={12} color={Colors.ink} strokeWidth={3} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })
          )}
        </View>
      </View>

      {/* Rail */}
      <View style={{ marginTop: 28 }}>
        <SectionLabel>Settlement Rail</SectionLabel>
        <Card style={{ marginTop: 12, padding: 0 }}>
          {RAILS.map((r, i) => {
            const Icon = r.icon;
            const selected = rail === r.id;
            const eligible = bank?.type === "debit_card" ? r.id === "debit_push" : r.id !== "debit_push";
            return (
              <View key={r.id}>
                <Pressable
                  disabled={!eligible}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
                    setRail(r.id);
                  }}
                  style={({ pressed }) => [
                    styles.railRow,
                    pressed && eligible && { backgroundColor: Colors.inkSoft + "30" },
                    !eligible && { opacity: 0.35 },
                  ]}
                >
                  <Icon size={16} color={selected ? Colors.brass : Colors.textMid} strokeWidth={1.5} />
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[type.bodyStrong, { color: Colors.textHigh }]}>{r.label}</Text>
                    <Text style={[type.caption, { color: Colors.textLow, marginTop: 2 }]}>
                      {r.eta} · fee {r.fee}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radio,
                      selected && { borderColor: Colors.brass, backgroundColor: Colors.brass },
                    ]}
                  >
                    {selected ? <View style={styles.radioDot} /> : null}
                  </View>
                </Pressable>
                {i < RAILS.length - 1 ? <Hairline /> : null}
              </View>
            );
          })}
        </Card>
      </View>

      <BrassRule style={{ opacity: 0.4, marginVertical: 28 }} />

      <PrimaryButton
        label={submitting ? "Initiating…" : `Withdraw ${formatUSD(numeric)}`}
        onPress={onConfirm}
        disabled={!bank || !numeric || exceeds || submitting}
        style={{ marginTop: 4 }}
        testID="withdraw-confirm"
      />
      <Text style={[type.caption, { color: Colors.textLow, marginTop: 14, textAlign: "center" }]}>
        Withdrawals over $5,000 require step-up biometric authentication.
      </Text>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  amountInput: {
    flex: 1,
    fontSize: 44,
    fontFamily: "Menlo",
    color: Colors.textHigh,
    paddingVertical: 0,
    letterSpacing: -1,
  },
  quickRow: { flexDirection: "row", gap: 8, marginTop: 18 },
  quickPill: {
    flex: 1,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.inkSoft,
    borderRadius: 2,
  },
  quickPillText: {
    color: Colors.textMid,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "600",
  },
  bankCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.inkRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.inkLine,
    padding: 16,
    borderRadius: 2,
  },
  bankCardSelected: { borderColor: Colors.brass },
  bankIcon: {
    width: 36,
    height: 36,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: Colors.brassDeep,
    backgroundColor: Colors.inkDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    width: 18,
    height: 18,
    backgroundColor: Colors.brass,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
  },
  railRow: { flexDirection: "row", alignItems: "center", padding: 18 },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.textLow,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.ink,
  },
});
