import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Check, ChevronRight, Flame, Wallet } from "lucide-react-native";
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
  shortHash,
} from "@/components/ui";
import Colors from "@/constants/colors";
import { type } from "@/constants/typography";
import { useTreasury } from "@/providers/treasury-provider";
import type { BurnableToken } from "@/types/treasury";

type Step = "select" | "amount" | "review" | "submitting";

export default function BurnScreen() {
  const { burnableTokens, wallets, initiateBurn } = useTreasury();
  const [step, setStep] = useState<Step>("select");
  const [token, setToken] = useState<BurnableToken | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const wallet = wallets[0];
  const numericAmount = useMemo(() => parseFloat(amount || "0") || 0, [amount]);
  const usdValue = token ? numericAmount * token.rate : 0;

  const onSelectToken = (t: BurnableToken) => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    setToken(t);
    setStep("amount");
  };

  const onConfirm = async () => {
    if (!token || numericAmount <= 0) return;
    setStep("submitting");
    setSubmitting(true);
    if (Platform.OS !== "web")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const entry = await initiateBurn(token, numericAmount);
    setSubmitting(false);
    router.push(`/receipt/${entry.id}`);
    setStep("select");
    setToken(null);
    setAmount("");
  };

  return (
    <ScreenShell
      eyebrow="On-Ramp · Proof of Burn"
      title="Burn → Credit"
      subtitle="Tokens incinerated on-chain are mirrored as USD credit in the TigerBeetle ledger after threshold confirmations."
    >
      {/* Wallet status */}
      <Card>
        <View style={styles.walletHeader}>
          <Wallet size={16} color={Colors.brass} strokeWidth={1.5} />
          <SectionLabel>Source Wallet</SectionLabel>
        </View>
        {wallet ? (
          <View style={{ marginTop: 14 }}>
            <Text style={[type.bodyStrong, { color: Colors.textHigh }]}>
              {wallet.provider === "metamask"
                ? "MetaMask"
                : wallet.provider === "walletconnect"
                ? "WalletConnect"
                : "Coinbase Wallet"}
            </Text>
            <Text style={[type.mono, { color: Colors.textMid, marginTop: 4 }]}>
              {shortHash(wallet.address, 10, 8)} · {wallet.chain.toUpperCase()}
            </Text>
          </View>
        ) : (
          <Text style={[type.body, { color: Colors.textMid, marginTop: 12 }]}>
            No wallet connected. Link one in Accounts.
          </Text>
        )}
      </Card>

      {/* Token selection */}
      <View style={{ marginTop: 28 }}>
        <SectionLabel>Eligible Contracts</SectionLabel>
        <Text style={[type.caption, { color: Colors.textLow, marginTop: 6 }]}>
          Verified by treasury · proof-of-burn enabled
        </Text>
        <View style={{ marginTop: 14, gap: 12 }}>
          {burnableTokens.map((t) => {
            const selected = token?.symbol === t.symbol;
            return (
              <Pressable
                key={t.symbol}
                onPress={() => onSelectToken(t)}
                style={({ pressed }) => [
                  styles.tokenCard,
                  selected && styles.tokenCardSelected,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View style={styles.tokenSeal}>
                  <Text style={styles.tokenSealText}>{t.symbol[0]}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[type.bodyStrong, { color: Colors.textHigh }]}>
                    {t.symbol} · {t.name}
                  </Text>
                  <Text style={[type.mono, { color: Colors.textLow, marginTop: 4 }]}>
                    {shortHash(t.contract)} · {t.chain}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[type.mono, { color: Colors.textHigh }]}>
                    {t.balance.toLocaleString()}
                  </Text>
                  <Text style={[type.caption, { color: Colors.textLow, marginTop: 2 }]}>
                    @ ${t.rate.toFixed(2)}
                  </Text>
                </View>
                {selected ? (
                  <View style={styles.checkmark}>
                    <Check size={12} color={Colors.ink} strokeWidth={3} />
                  </View>
                ) : (
                  <ChevronRight
                    size={16}
                    color={Colors.textLow}
                    strokeWidth={1.5}
                    style={{ marginLeft: 10 }}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Amount entry */}
      {token ? (
        <View style={{ marginTop: 28 }}>
          <SectionLabel>Burn Amount</SectionLabel>
          <Card style={{ marginTop: 12, padding: 24 }}>
            <View style={styles.amountRow}>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={Colors.textLow}
                keyboardType="decimal-pad"
                style={styles.amountInput}
                testID="burn-amount-input"
              />
              <Text style={[type.title, { color: Colors.brass }]}>{token.symbol}</Text>
            </View>
            <BrassRule style={{ opacity: 0.4, marginVertical: 16 }} />
            <View style={styles.previewRow}>
              <Text style={[type.body, { color: Colors.textMid }]}>
                Credit issued
              </Text>
              <Text style={[type.mono, { color: Colors.textHigh, fontSize: 16 }]}>
                {formatUSD(usdValue)}
              </Text>
            </View>
            <Hairline style={{ marginVertical: 12 }} />
            <View style={styles.previewRow}>
              <Text style={[type.body, { color: Colors.textMid }]}>
                Required confirmations
              </Text>
              <Text style={[type.mono, { color: Colors.textHigh, fontSize: 14 }]}>
                32 blocks
              </Text>
            </View>
            <Hairline style={{ marginVertical: 12 }} />
            <View style={styles.previewRow}>
              <Text style={[type.body, { color: Colors.textMid }]}>
                Network fee (est.)
              </Text>
              <Text style={[type.mono, { color: Colors.textHigh, fontSize: 14 }]}>
                $0.42
              </Text>
            </View>
          </Card>

          <View style={styles.quickRow}>
            {[25, 50, 75, 100].map((p) => (
              <Pressable
                key={p}
                onPress={() => setAmount(((token.balance * p) / 100).toFixed(2))}
                style={({ pressed }) => [
                  styles.quickPill,
                  pressed && { backgroundColor: Colors.inkSoft },
                ]}
              >
                <Text style={styles.quickPillText}>{p}%</Text>
              </Pressable>
            ))}
          </View>

          <PrimaryButton
            label={
              submitting
                ? "Submitting…"
                : numericAmount > 0
                ? `Burn ${numericAmount.toLocaleString()} ${token.symbol}`
                : "Enter amount"
            }
            onPress={onConfirm}
            disabled={!numericAmount || numericAmount > token.balance || submitting}
            style={{ marginTop: 20 }}
            testID="burn-confirm"
          />
          {numericAmount > token.balance ? (
            <Text style={[type.caption, { color: Colors.failed, marginTop: 10, textAlign: "center" }]}>
              Insufficient balance.
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Compliance note */}
      <View style={{ marginTop: 32 }}>
        <BrassRule style={{ opacity: 0.4 }} />
        <View style={styles.complianceRow}>
          <Flame size={12} color={Colors.brassDeep} strokeWidth={1.5} />
          <Text style={[type.caption, { color: Colors.textLow, flex: 1, marginLeft: 8 }]}>
            Burns are irreversible. Credit is issued only after the on-chain event has
            been observed by two independent oracles and the configured confirmation
            threshold has elapsed.
          </Text>
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  walletHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  tokenCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.inkRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.inkLine,
    padding: 16,
    borderRadius: 2,
  },
  tokenCardSelected: {
    borderColor: Colors.brass,
    backgroundColor: Colors.inkRaised,
  },
  tokenSeal: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.brassDeep,
    backgroundColor: Colors.inkDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  tokenSealText: {
    color: Colors.brass,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
  },
  checkmark: {
    width: 18,
    height: 18,
    backgroundColor: Colors.brass,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    borderRadius: 9,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  amountInput: {
    flex: 1,
    fontSize: 40,
    fontFamily: "Menlo",
    color: Colors.textHigh,
    paddingVertical: 0,
    letterSpacing: -1,
  },
  previewRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  quickRow: { flexDirection: "row", gap: 8, marginTop: 14 },
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
  complianceRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 14 },
});
