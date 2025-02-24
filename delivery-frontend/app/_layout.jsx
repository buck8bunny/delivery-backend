import React, { Component } from 'react';
import { SafeAreaView } from 'react-native';
import { Stack } from "expo-router";
import UserProvider from './context/UserContext';

export default function RootLayout() {
  return (
      <UserProvider>
        <SafeAreaView style={{ flex: 1 }}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
            <Stack.Screen
              name="product/[id]"
              options={{ title: "Product Details", headerShown: true }}
            />
            <Stack.Screen
              name="checkout" // ✅ Добавляем CheckoutScreen
              options={{ title: "Checkout", headerShown: true }}
            />
          </Stack>
        </SafeAreaView>
      </UserProvider>
  );
}
