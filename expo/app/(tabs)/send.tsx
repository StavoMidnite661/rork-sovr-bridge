import { router } from "expo-router";
import { ArrowLeft, Check, Search, Send, User } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ScreenShell } from "@/components/screen-shell";
import {
  Card,
  Hairline,
  PrimaryButton,
  SectionLabel,
  formatUSD,
} from "@/components/ui";
import Colors from "@/constants/colors";
import { type } from "@/constants/typography";
import { useTreasury } from "@/providers/treasury-provider";
import type { Principal } from "@/types/treasury";

export default function SendScreen() {
  const { balance, knownPrincipals, initiateTransfer } = useTreasury();
  const [step, setStep] = useState<"find" | "amount" | "confirm" | "success">("find");
  const [target, setTarget] = useState<Principal | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const onSelect = (p: Principal) => {
    setTarget(p);
    setStep("amount");
  };

  const onSend = async () => {
    if (!target) return;
    setLoading(true);
    try {
      await initiateTransfer(target.id, parseFloat(amount));
      setStep("success");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell
      eyebrow="Direct Transfer"
      title="Send Credit"
      subtitle="Transfer real-world USD credit to another principal. Settles on the distributed ledger."
    >
      <View style={{ flex: 1 }}>
        {step === "find" && (
          <View style={{ gap: 20 }}>
            <View style={styles.searchBar}>
              <Search size={16} color={Colors.textLow} strokeWidth={1.5} />
              <TextInput
                placeholder="Principal ID or Name"
                placeholderTextColor={Colors.textLow}
                style={styles.searchInput}
              />
            </View>
            <SectionLabel>Known Principals</SectionLabel>
            <Card style={{ padding: 0 }}>
              {knownPrincipals.map((p, i) => (
                <View key={p.id}>
                  <Pressable
                    onPress={() => onSelect(p)}
                    style={({ pressed }) => [
                      styles.peerRow,
                      pressed && { backgroundColor: Colors.inkSoft + "30" },
                    ]}
                  >
                    <View style={styles.avatar}>
                      <User size={14} color={Colors.brass} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={[type.bodyStrong, { color: Colors.textHigh }]}>{p.name}</Text>
                      <Text style={[type.mono, { color: Colors.textLow, fontSize: 11 }]}>{p.id}</Text>
                    </View>
                    <View style={styles.kycLevel}>
                      <Text style={styles.kycLevelText}>L{p.kycLevel}</Text>
                    </View>
                  </Pressable>
                  {i < knownPrincipals.length - 1 && <Hairline />}
                </View>
              ))}
            </Card>
          </View>
        )}

        {step === "amount" && target && (
          <View>
            <Pressable onPress={() => setStep("find")} style={styles.backBtn}>
              <ArrowLeft size={14} color={Colors.textMid} />
              <Text style={styles.backText}>Change Recipient</Text>
            </Pressable>
            <Card raised style={{ marginTop: 12 }}>
              <Text style={[type.caption, { color: Colors.textLow }]}>SENDING TO</Text>
              <Text style={[type.title, { color: Colors.textHigh, marginTop: 4 }]}>{target.name}</Text>
              <Text style={[type.mono, { color: Colors.textLow }]}>{target.id}</Text>
              <BrassRule style={{ marginVertical: 20, opacity: 0.3 }} />
              <Text style={[type.caption, { color: Colors.textLow }]}>AMOUNT</Text>
              <View style={styles.amountInputRow}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  autoFocus
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={Colors.textLow}
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
              <Text style={[type.caption, { color: Colors.textLow, marginTop: 12 }]}>
                Available: {formatUSD(balance)}
              </Text>
            </Card>
            <PrimaryButton
              label="Review Transfer"
              disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
              onPress={() => setStep("confirm")}
              style={{ marginTop: 24 }}
            />
          </View>
        )}

        {step === "confirm" && target && (
          <View>
            <Card raised>
              <View style={{ alignItems: "center", paddingVertical: 12 }}>
                <Send size={32} color={Colors.brass} strokeWidth={1.5} />
                <Text style={[type.title, { marginTop: 16, fontSize: 32 }]}>{formatUSD(parseFloat(amount))}</Text>
                <Text style={[type.body, { color: Colors.textMid, marginTop: 4 }]}>
                  To {target.name}
                </Text>
              </View>
              <Hairline style={{ marginVertical: 16 }} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Network Fee</Text>
                <Text style={styles.detailValue}>$0.10</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Settlement</Text>
                <Text style={styles.detailValue}>Instant (TigerBeetle)</Text>
              </View>
            </Card>
            <View style={{ marginTop: 24, gap: 12 }}>
              <PrimaryButton
                label={loading ? "Synchronizing..." : "Confirm & Send"}
                onPress={onSend}
                loading={loading}
              />
              <PrimaryButton
                label="Cancel"
                variant="ghost"
                onPress={() => setStep("amount")}
              />
            </View>
          </View>
        )}

        {step === "success" && (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <View style={styles.successRing}>
              <Check size={48} color={Colors.verified} strokeWidth={3} />
            </View>
            <Text style={[type.title, { color: Colors.textHigh, marginTop: 24 }]}>Transfer Initiated</Text>
            <Text style={[type.body, { color: Colors.textMid, textAlign: "center", marginTop: 8 }]}>
              The credit has been committed to the ledger and is currently synchronizing with the destination principal.
            </Text>
            <PrimaryButton
              label="Back to Dashboard"
              onPress={() => router.push("/(tabs)/")}
              style={{ marginTop: 32, width: "100%" }}
            />
          </View>
        )}
      </View>
    </ScreenShell>
  );
}

function BrassRule({ style, opacity = 1 }: { style?: any; opacity?: number }) {
  return (
    <View
      style={[
        {
          height: 1,
          backgroundColor: Colors.brassDeep,
          opacity,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.inkDeep,
    borderWidth: 1,
    borderColor: Colors.inkSoft,
    borderRadius: 2,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: Colors.textHigh,
    fontFamily: "Menlo",
    fontSize: 14,
  },
  peerRow: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.inkRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.brassDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  kycLevel: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.brassDeep,
    borderRadius: 2,
  },
  kycLevelText: {
    color: Colors.brass,
    fontSize: 9,
    fontWeight: "700",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  backText: {
    color: Colors.textMid,
    fontSize: 12,
    fontWeight: "600",
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 8,
  },
  currencySymbol: {
    color: Colors.textMid,
    fontSize: 32,
    fontFamily: "Menlo",
  },
  amountInput: {
    flex: 1,
    color: Colors.textHigh,
    fontSize: 48,
    fontFamily: "Menlo",
    marginLeft: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  detailLabel: {
    color: Colors.textLow,
    fontSize: 13,
  },
  detailValue: {
    color: Colors.textHigh,
    fontFamily: "Menlo",
    fontSize: 13,
  },
  successRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: Colors.verified,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.inkDeep,
  },
});
