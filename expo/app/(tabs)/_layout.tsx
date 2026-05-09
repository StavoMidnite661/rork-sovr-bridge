import { Tabs } from "expo-router";
import {
  BookLock,
  Building2,
  Flame,
  ScrollText,
  Vault,
} from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import Colors from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.brass,
        tabBarInactiveTintColor: Colors.textLow,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.inkDeep,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: Colors.inkLine,
          height: Platform.OS === "ios" ? 84 : 68,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          letterSpacing: 1.5,
          fontWeight: "600",
          textTransform: "uppercase",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Vault",
          tabBarIcon: ({ color }) => <Vault color={color} size={20} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="burn"
        options={{
          title: "Burn",
          tabBarIcon: ({ color }) => (
            <View>
              <Flame color={color} size={20} strokeWidth={1.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="withdraw"
        options={{
          title: "Withdraw",
          tabBarIcon: ({ color }) => <Building2 color={color} size={20} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="ledger"
        options={{
          title: "Ledger",
          tabBarIcon: ({ color }) => <ScrollText color={color} size={20} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: "Accounts",
          tabBarIcon: ({ color }) => <BookLock color={color} size={20} strokeWidth={1.5} />,
        }}
      />
    </Tabs>
  );
}
