import * as Haptics from "expo-haptics";
import {
  Building2,
  CreditCard,
  Fingerprint,
  KeyRound,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
  Wallet,
  X,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ScreenShell } from "@/components/screen-shell";
import {
  BrassRule,
  Card,
  Hairline,
  PrimaryButton,
  SectionLabel,
  formatRelative,
  formatUSD,
  shortHash,
} from "@/components/ui";
import Colors from "@/constants/colors";
import { type } from "@/constants/typography";
import { useTreasury } from "@/providers/treasury-provider";

export default function AccountsScreen() {
  const {
    banks,
    wallets,
    kyc,
    security,
    linkBank,
    removeBank,
    linkWallet,
    removeWallet,
    isPrivileged,
    privateBalance,
  } = useTreasury();
  const [bankSheet, setBankSheet] = useState<boolean>(false);
  const [walletSheet, setWalletSheet] = useState<boolean>(false);

  const onAddPlaidBank = async () => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    const samples = [
      { institution: "Wells Fargo", mask: "3214", type: "checking" as const },
      { institution: "Bank of America", mask: "9087", type: "savings" as const },
      { institution: "Visa Debit", mask: "1129", type: "debit_card" as const },
    ];
    const pick = samples[Math.floor(Math.random() * samples.length)];
    await linkBank(pick);
    setBankSheet(false);
  };

  const onAddWallet = async (provider: "metamask" | "walletconnect" | "coinbase") => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    const addr =
      "0x" +
      Array.from({ length: 40 })
        .map(() => "0123456789abcdef"[Math.floor(Math.random() * 16)])
        .join("");
    await linkWallet({ provider, address: addr, chain: "base" });
    setWalletSheet(false);
  };

  return (
    <ScreenShell
      eyebrow="Identity & Custody"
      title="Accounts"
      subtitle="Linked banks, custodial wallets, and security posture for this principal."
    >
      {/* Identity */}
      <Card raised>
        <View style={styles.idHeader}>
          <View style={styles.seal}>
            <ShieldCheck size={18} color={Colors.brass} strokeWidth={1.5} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[type.title, { color: Colors.textHigh }]}>
              Sovereign · Principal
            </Text>
            <Text style={[type.mono, { color: Colors.textLow, marginTop: 4 }]}>
              ID 0x4A·2C·9F · Audit 2A4F-9C81
            </Text>
          </View>
          <View style={styles.kycPill}>
            <Text style={styles.kycPillText}>
              KYC L{kyc.level} · {kyc.status === "verified" ? "Verified" : kyc.status}
            </Text>
          </View>
        </View>
        <BrassRule style={{ opacity: 0.4, marginVertical: 16 }} />
        <View style={styles.metaRow}>
          <Meta label="Provider" value={kyc.provider === "persona" ? "Persona" : "Sumsub"} />
          <Meta
            label="Reviewed"
            value={kyc.lastReviewed ? formatRelative(kyc.lastReviewed) : "—"}
          />
        </View>
      </Card>

      {/* Private Vault - Privileged Only */}
      {isPrivileged ? (
        <View style={{ marginTop: 28 }}>
          <SectionLabel>Private Vault · Privileged Tier</SectionLabel>
          <Card style={{ marginTop: 12, backgroundColor: Colors.inkDeep, borderColor: Colors.brassDeep }}>
            <View style={{ flexDirection: "row", alignItems: "center", padding: 4 }}>
              <View style={[styles.iconBox, { borderColor: Colors.brass }]}>
                <Lock size={16} color={Colors.brass} strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[type.bodyStrong, { color: Colors.textHigh }]}>
                  Deterministic Secret Reserve
                </Text>
                <Text style={[type.mono, { color: Colors.brass, marginTop: 4, fontSize: 18 }]}>
                  {formatUSD(privateBalance)}
                </Text>
              </View>
              <View style={styles.kycPill}>
                <Text style={styles.kycPillText}>PRIVATE</Text>
              </View>
            </View>
          </Card>
        </View>
      ) : (
        <View style={{ marginTop: 28 }}>
          <SectionLabel>Private Vault</SectionLabel>
          <Card style={{ marginTop: 12, opacity: 0.6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <Lock size={16} color={Colors.textLow} />
              <Text style={[type.body, { color: Colors.textLow }]}>
                Upgrade to KYC L2 and enroll Passkey to unlock Private Vault.
              </Text>
            </View>
          </Card>
        </View>
      )}

      {/* Banks */}
      <View style={{ marginTop: 28 }}>
        <Header
          title="Linked Accounts"
          subtitle="Plaid-verified · ACH/RTP eligible"
          onAdd={() => setBankSheet(true)}
        />
        <View style={{ marginTop: 12, gap: 12 }}>
          {banks.length === 0 ? (
            <Card>
              <Text style={[type.body, { color: Colors.textMid }]}>
                No bank accounts linked.
              </Text>
            </Card>
          ) : (
            banks.map((b) => {
              const Icon = b.type === "debit_card" ? CreditCard : Building2;
              return (
                <Card key={b.id} style={{ padding: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={styles.iconBox}>
                      <Icon size={16} color={b.isPrivate ? Colors.brass : Colors.textMid} strokeWidth={1.5} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={[type.bodyStrong, { color: Colors.textHigh }]}>
                          {b.institution}
                        </Text>
                        {b.isPrivate && <Lock size={10} color={Colors.brass} />}
                      </View>
                      <Text style={[type.mono, { color: Colors.textLow, marginTop: 4 }]}>
                        {b.type === "debit_card" ? "Debit ····" : `${b.type} ····`} {b.mask}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => removeBank(b.id)}
                      hitSlop={8}
                      style={styles.trash}
                    >
                      <Trash2 size={14} color={Colors.textLow} strokeWidth={1.5} />
                    </Pressable>
                  </View>
                </Card>
              );
            })
          )}
        </View>
      </View>

      {/* Wallets */}
      <View style={{ marginTop: 28 }}>
        <Header
          title="Custodial Wallets"
          subtitle="Web3 source for proof-of-burn"
          onAdd={() => setWalletSheet(true)}
        />
        <View style={{ marginTop: 12, gap: 12 }}>
          {wallets.length === 0 ? (
            <Card>
              <Text style={[type.body, { color: Colors.textMid }]}>
                No wallets connected.
              </Text>
            </Card>
          ) : (
            wallets.map((w) => (
              <Card key={w.id} style={{ padding: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={styles.iconBox}>
                    <Wallet size={16} color={Colors.brass} strokeWidth={1.5} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[type.bodyStrong, { color: Colors.textHigh }]}>
                      {w.provider === "metamask"
                        ? "MetaMask"
                        : w.provider === "walletconnect"
                        ? "WalletConnect"
                        : "Coinbase"}{" "}
                      · {w.chain}
                    </Text>
                    <Text style={[type.mono, { color: Colors.textLow, marginTop: 4 }]}>
                      {shortHash(w.address, 12, 8)}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => removeWallet(w.id)}
                    hitSlop={8}
                    style={styles.trash}
                  >
                    <Trash2 size={14} color={Colors.textLow} strokeWidth={1.5} />
                  </Pressable>
                </View>
              </Card>
            ))
          )}
        </View>
      </View>

      {/* Security */}
      <View style={{ marginTop: 28 }}>
        <SectionLabel>Security Posture · NIST SP 800-63</SectionLabel>
        <Card style={{ marginTop: 12, padding: 0 }}>
          <SecurityRow
            icon={<KeyRound size={16} color={Colors.brass} strokeWidth={1.5} />}
            label="Passkey enrolled"
            value={security.passkeyEnrolled ? "Active" : "Inactive"}
            ok={security.passkeyEnrolled}
          />
          <Hairline />
          <SecurityRow
            icon={<Fingerprint size={16} color={Colors.brass} strokeWidth={1.5} />}
            label="Biometrics"
            value={security.biometricsEnabled ? "Enabled" : "Disabled"}
            ok={security.biometricsEnabled}
          />
          <Hairline />
          <SecurityRow
            icon={<ShieldCheck size={16} color={Colors.brass} strokeWidth={1.5} />}
            label="Step-up 2FA"
            value={security.twoFactorEnabled ? "Enabled" : "Disabled"}
            ok={security.twoFactorEnabled}
          />
          <Hairline />
          <SecurityRow
            label="Last audit"
            value={formatRelative(security.lastAudit)}
            ok
          />
        </Card>
      </View>

      <View style={{ marginTop: 36 }}>
        <BrassRule style={{ opacity: 0.4, marginBottom: 12 }} />
        <Text style={[type.caption, { color: Colors.textLow, textAlign: "center" }]}>
          Designed for MSB / Money Transmitter readiness
        </Text>
      </View>

      {/* Bank link sheet */}
      <Sheet visible={bankSheet} onClose={() => setBankSheet(false)} title="Link Account">
        <Text style={[type.body, { color: Colors.textMid, marginBottom: 20 }]}>
          Continue with Plaid to verify ownership of a US bank account or debit card.
        </Text>
        <PrimaryButton label="Continue with Plaid" onPress={onAddPlaidBank} />
        <PrimaryButton
          label="Cancel"
          variant="ghost"
          onPress={() => setBankSheet(false)}
          style={{ marginTop: 12 }}
        />
      </Sheet>

      {/* Wallet sheet */}
      <Sheet visible={walletSheet} onClose={() => setWalletSheet(false)} title="Connect Wallet">
        <Text style={[type.body, { color: Colors.textMid, marginBottom: 20 }]}>
          Choose a custodial signer. Burn events from this wallet become eligible for
          on-ramp credit.
        </Text>
        <PrimaryButton label="MetaMask" onPress={() => onAddWallet("metamask")} />
        <PrimaryButton
          label="WalletConnect"
          variant="ink"
          onPress={() => onAddWallet("walletconnect")}
          style={{ marginTop: 10 }}
        />
        <PrimaryButton
          label="Coinbase Wallet"
          variant="ink"
          onPress={() => onAddWallet("coinbase")}
          style={{ marginTop: 10 }}
        />
        <PrimaryButton
          label="Cancel"
          variant="ghost"
          onPress={() => setWalletSheet(false)}
          style={{ marginTop: 12 }}
        />
      </Sheet>
    </ScreenShell>
  );
}

function Header({
  title,
  subtitle,
  onAdd,
}: {
  title: string;
  subtitle: string;
  onAdd: () => void;
}) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
      <View>
        <SectionLabel>{title}</SectionLabel>
        <Text style={[type.caption, { color: Colors.textLow, marginTop: 4 }]}>{subtitle}</Text>
      </View>
      <Pressable
        onPress={onAdd}
        hitSlop={8}
        style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
        testID={`add-${title}`}
      >
        <Plus size={14} color={Colors.brass} strokeWidth={2} />
        <Text style={styles.addBtnText}>Add</Text>
      </Pressable>
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[type.caption, { color: Colors.textLow, letterSpacing: 1 }]}>
        {label.toUpperCase()}
      </Text>
      <Text style={[type.mono, { color: Colors.textHigh, marginTop: 4 }]}>{value}</Text>
    </View>
  );
}

function SecurityRow({
  icon,
  label,
  value,
  ok,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <View style={styles.secRow}>
      {icon ? <View style={{ marginRight: 12 }}>{icon}</View> : <View style={{ width: 28 }} />}
      <Text style={[type.body, { color: Colors.textHigh, flex: 1 }]}>{label}</Text>
      <Text
        style={[
          type.mono,
          { color: ok ? Colors.verified : Colors.failed, fontSize: 13 },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.sheetHeader}>
            <Text style={[type.title, { color: Colors.textHigh }]}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={18} color={Colors.textMid} strokeWidth={1.5} />
            </Pressable>
          </View>
          <BrassRule style={{ opacity: 0.5, marginBottom: 18 }} />
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  idHeader: { flexDirection: "row", alignItems: "center" },
  seal: {
    width: 44,
    height: 44,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: Colors.brassDeep,
    backgroundColor: Colors.inkDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  kycPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.brassDeep,
    borderRadius: 2,
  },
  kycPillText: {
    color: Colors.brass,
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  metaRow: { flexDirection: "row" },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: Colors.brassDeep,
    backgroundColor: Colors.inkDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.brassDeep,
    borderRadius: 2,
  },
  addBtnText: {
    color: Colors.brass,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  trash: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  secRow: { flexDirection: "row", alignItems: "center", paddingVertical: 16, paddingHorizontal: 18 },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(7,12,22,0.85)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.inkRaised,
    borderTopWidth: 1,
    borderTopColor: Colors.brassDeep,
    padding: 24,
    paddingBottom: 40,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
});
