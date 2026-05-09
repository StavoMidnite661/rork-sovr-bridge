import { LinearGradient } from "expo-linear-gradient";
import React, { memo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import Colors from "@/constants/colors";
import { type } from "@/constants/typography";

export const SectionLabel = memo(function SectionLabel({
  children,
  color,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  style?: TextStyle;
}) {
  return (
    <Text
      style={[type.sectionLabel, { color: color ?? Colors.brass }, style]}
      testID="section-label"
    >
      {children}
    </Text>
  );
});

export const Hairline = memo(function Hairline({
  color,
  vertical,
  style,
}: {
  color?: string;
  vertical?: boolean;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        vertical
          ? { width: StyleSheet.hairlineWidth, alignSelf: "stretch" }
          : { height: StyleSheet.hairlineWidth, alignSelf: "stretch" },
        { backgroundColor: color ?? Colors.inkLine },
        style,
      ]}
    />
  );
});

export const Card = memo(function Card({
  children,
  style,
  raised,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  raised?: boolean;
}) {
  return (
    <View
      style={[
        styles.card,
        raised ? styles.cardRaised : null,
        style,
      ]}
      testID="card"
    >
      {children}
    </View>
  );
});

export const BrassRule = memo(function BrassRule({ style }: { style?: ViewStyle }) {
  return (
    <View style={[{ height: 1, alignSelf: "stretch" }, style]}>
      <LinearGradient
        colors={[
          "rgba(201,162,74,0)",
          Colors.brass,
          Colors.brassLight,
          Colors.brass,
          "rgba(201,162,74,0)",
        ]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ flex: 1 }}
      />
    </View>
  );
});

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "brass" | "ink" | "ghost";
  style?: ViewStyle;
  testID?: string;
}

export const PrimaryButton = memo(function PrimaryButton({
  label,
  onPress,
  disabled,
  variant = "brass",
  style,
  testID,
}: PrimaryButtonProps) {
  const isBrass = variant === "brass";
  const isGhost = variant === "ghost";
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.btn,
        isBrass && styles.btnBrass,
        !isBrass && !isGhost && styles.btnInk,
        isGhost && styles.btnGhost,
        disabled && { opacity: 0.4 },
        pressed && !disabled && { opacity: 0.8, transform: [{ translateY: 1 }] },
        style,
      ]}
    >
      <Text
        style={[
          styles.btnLabel,
          isBrass && { color: Colors.ink },
          !isBrass && !isGhost && { color: Colors.textHigh },
          isGhost && { color: Colors.brass },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
});

export function StatusDot({
  status,
}: {
  status: "verified" | "pending" | "failed" | "confirming";
}) {
  const color =
    status === "verified"
      ? Colors.verified
      : status === "failed"
      ? Colors.failed
      : Colors.pending;
  return (
    <View style={styles.dotWrap}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View
        style={[
          styles.dotGlow,
          { backgroundColor: color, opacity: status === "confirming" ? 0.35 : 0.18 },
        ]}
      />
    </View>
  );
}

export function formatUSD(n: number, opts?: { sign?: boolean }): string {
  const abs = Math.abs(n);
  const fixed = abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = opts?.sign ? (n >= 0 ? "+" : "−") : n < 0 ? "−" : "";
  return `${sign}$${fixed}`;
}

export function shortHash(h: string, lead = 8, tail = 6): string {
  if (!h) return "";
  if (h.length <= lead + tail + 1) return h;
  return `${h.slice(0, lead)}…${h.slice(-tail)}`;
}

export function formatRelative(ts: number): string {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.inkRaised,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.inkLine,
    padding: 20,
  },
  cardRaised: {
    backgroundColor: Colors.inkRaised,
    borderColor: Colors.inkSoft,
  },
  btn: {
    height: 52,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  btnBrass: {
    backgroundColor: Colors.brass,
  },
  btnInk: {
    backgroundColor: Colors.inkRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.inkSoft,
  },
  btnGhost: {
    backgroundColor: "transparent",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.brassDeep,
  },
  btnLabel: {
    fontSize: 13,
    letterSpacing: 2,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  dotWrap: {
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    zIndex: 2,
  },
  dotGlow: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
  },
});
