import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { type } from "@/constants/typography";
import { BrassRule, SectionLabel } from "./ui";

interface Props {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  scroll?: boolean;
}

export function ScreenShell({
  eyebrow,
  title,
  subtitle,
  children,
  scroll = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const Body = scroll ? ScrollView : View;
  return (
    <View style={styles.root} testID="screen-shell">
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[Colors.inkDeep, Colors.ink, Colors.inkDeep]}
        style={StyleSheet.absoluteFill}
      />
      {/* archival texture overlay */}
      <View pointerEvents="none" style={styles.grid}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View
            key={`h-${i}`}
            style={{
              position: "absolute",
              top: (i + 1) * 96,
              left: 0,
              right: 0,
              height: StyleSheet.hairlineWidth,
              backgroundColor: "rgba(201,162,74,0.04)",
            }}
          />
        ))}
      </View>
      <Body
        style={{ flex: 1 }}
        contentContainerStyle={
          scroll
            ? {
                paddingTop: insets.top + 12,
                paddingBottom: insets.bottom + 120,
                paddingHorizontal: 20,
              }
            : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        {!scroll && (
          <View
            style={{
              paddingTop: insets.top + 12,
              paddingHorizontal: 20,
              flex: 1,
            }}
          >
            <Header eyebrow={eyebrow} title={title} subtitle={subtitle} />
            {children}
          </View>
        )}
        {scroll && (
          <>
            <Header eyebrow={eyebrow} title={title} subtitle={subtitle} />
            {children}
          </>
        )}
      </Body>
    </View>
  );
}

function Header({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={{ marginBottom: 24 }}>
      <View style={styles.eyebrowRow}>
        <View style={styles.brassDot} />
        <SectionLabel>{eyebrow}</SectionLabel>
      </View>
      <Text style={[type.display, { color: Colors.textHigh, marginTop: 12 }]}>
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={[
            type.body,
            { color: Colors.textMid, marginTop: 8, maxWidth: 360 },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
      <BrassRule style={{ marginTop: 20, opacity: 0.6 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.ink },
  grid: { ...StyleSheet.absoluteFillObject },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brassDot: {
    width: 6,
    height: 6,
    backgroundColor: Colors.brass,
    transform: [{ rotate: "45deg" }],
  },
});
