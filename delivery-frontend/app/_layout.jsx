import { Stack } from "expo-router";
import React from "react";
import { SafeAreaView } from 'react-native';

export default function RootLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen
          name="product/[id]"
          options={{ title: "Product Details", headerShown: true }}
        />
      </Stack>
    </SafeAreaView>

  );
}
