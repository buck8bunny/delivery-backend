import React, { useEffect, useState } from "react";
import AuthScreen from "./auth";
import { useUser } from "./context/UserContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function LoginScreen() {
  const { updateUserName } = useUser();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          // Проверяем валидность токена и получаем данные пользователя
          const response = await fetch(`${API_URL}/users/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            if (userData.name) {
              await AsyncStorage.setItem("userName", userData.name);
              updateUserName(userData.name);
            }
            router.replace("/(tabs)/home");
          } else {
            // Если токен невалидный, удаляем его
            await AsyncStorage.removeItem("token");
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Ошибка при проверке авторизации:", error);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleSuccessfulLogin = async (userData) => {
    if (userData.user && userData.user.name) {
      await AsyncStorage.setItem("userName", userData.user.name);
      updateUserName(userData.user.name);
    }
    router.replace("/(tabs)/home");
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return <AuthScreen onLoginSuccess={handleSuccessfulLogin} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
  },
});
