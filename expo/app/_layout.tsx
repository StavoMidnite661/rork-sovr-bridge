import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { TreasuryProvider } from "@/providers/treasury-provider";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: Colors.ink },
        headerTintColor: Colors.brass,
        headerTitleStyle: {
          color: Colors.textHigh,
          fontFamily: undefined,
        },
        contentStyle: { backgroundColor: Colors.ink },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="receipt/[id]"
        options={{
          presentation: "modal",
          title: "Sealed Receipt",
          headerStyle: { backgroundColor: Colors.inkDeep },
        }}
      />
      <Stack.Screen
        name="modal"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TreasuryProvider>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.ink }}>
          <SafeAreaProvider>
            <StatusBar style="light" />
            <RootLayoutNav />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </TreasuryProvider>
    </QueryClientProvider>
  );
}
