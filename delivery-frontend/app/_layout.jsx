import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native';
import { Stack, useRouter, useSegments } from "expo-router";
import UserProvider, { useUser } from './context/UserContext';
import { CartProvider } from './context/CartContext';
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

function RootLayoutNav() {
  const { user, updateUserName, setUser } = useUser();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    checkInitialAuth();
  }, []);

  const checkInitialAuth = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      console.log('Layout: checking auth, token:', token ? 'exists' : 'not found');
      
      if (!token) {
        console.log('Layout: no token, redirecting to login');
        router.replace('/(auth)/login');
        return;
      }

      try {
        console.log('Layout: validating token with /users/profile');
        const response = await fetch(`${API_URL}/users/profile`, {
          method: "GET",
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
        });

        console.log('Layout: profile response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Layout: profile data:', data);
          
          // Обновляем данные пользователя в контексте
          setUser(data);
          if (data.name) {
            await AsyncStorage.setItem("userName", data.name);
            updateUserName(data.name);
          }
          
          // Проверяем текущий сегмент маршрута
          const isAuthGroup = segments[0] === '(auth)';
          if (isAuthGroup) {
            // Если мы на странице авторизации, но пользователь авторизован,
            // перенаправляем на нужную страницу
            const redirectPath = data.role === 'admin' ? '/(admin)/dashboard' : '/(tabs)/home';
            console.log('Layout: redirecting to:', redirectPath);
            router.replace(redirectPath);
          }
        } else {
          console.log('Layout: invalid token, redirecting to login');
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("userName");
          router.replace('/(auth)/login');
        }
      } catch (error) {
        console.error("Layout: error checking token:", error);
        router.replace('/(auth)/login');
      }
    } catch (error) {
      console.error("Layout: error in auth check:", error);
      router.replace('/(auth)/login');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen
          name="product/[id]"
          options={{ title: "Product Details", headerShown: false }}
        />
        <Stack.Screen
          name="checkout"
          options={{ title: "Checkout", headerShown: true }}
        />
      </Stack>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <UserProvider>
      <CartProvider>
        <RootLayoutNav />
      </CartProvider>
    </UserProvider>
  );
}
