import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../context/UserContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const LoginScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [success, setSuccess] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const router = useRouter();
  const { updateUserName } = useUser();

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isLogin]);

  const handleNavigation = (role) => {
    console.log('Начинаем навигацию для роли:', role);
    if (role === 'admin') {
      console.log('Переход на админ панель');
      router.push('/(admin)/dashboard');
    } else {
      console.log('Переход на домашнюю страницу');
      router.push('/(tabs)/home');
    }
  };

  // Проверка токена при монтировании
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        try {
          const response = await fetch(`${API_URL}/auth/validate`, {
            method: "GET",
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
          });

          if (response.ok) {
            const data = await response.json();
            handleNavigation(data.user.role);
          } else {
            await AsyncStorage.removeItem("token");
          }
        } catch (error) {
          console.error("Ошибка при проверке токена:", error);
          await AsyncStorage.removeItem("token");
        }
      }
    };

    checkAuth();
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setMessage(null);
    setSuccess(false);
  
    if (!email || !password || (!isLogin && !name)) {
      setLoading(false);
      setMessage("Пожалуйста, заполните все поля.");
      return;
    }
  
    const url = isLogin
      ? `${API_URL}/users/sign_in`
      : `${API_URL}/users`;
  
    try {
      console.log('Отправка запроса на:', url);
      const response = await fetch(url, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          user: {
            email,
            password,
            ...((!isLogin && name) ? { name } : {})
          }
        })
      });
  
      const result = await response.json();
      console.log('Получен ответ:', result);
      
      if (response.ok) {
        if (isLogin) {
          // Сначала сохраняем токен
          await AsyncStorage.setItem("token", result.token);
          console.log('Токен сохранен');
          
          // Затем сохраняем имя пользователя, если оно есть
          if (result.user && result.user.name) {
            await AsyncStorage.setItem("userName", result.user.name);
            updateUserName(result.user.name);
            console.log('Имя пользователя сохранено');
          }
          
          // Используем функцию навигации
          setTimeout(() => {
            handleNavigation(result.user.role);
          }, 100);
        } else {
          setSuccess(true);
          setMessage("Регистрация успешна!");
          setTimeout(() => {
            setSuccess(false);
            setIsLogin(true);
          }, 2000);
        }
      } else {
        setMessage(result.error || result.message || "Произошла ошибка.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Ошибка сети, попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.formContainer}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: animation,
              transform: [
                {
                  translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.title}>
            {isLogin ? "Добро пожаловать!" : "Создать аккаунт"}
          </Text>

          {message && (
            <View style={[styles.messageContainer, success ? styles.successMessage : styles.errorMessage]}>
              <Ionicons 
                name={success ? "checkmark-circle" : "alert-circle"} 
                size={20} 
                color={success ? "#34C759" : "#FF3B30"} 
              />
              <Text style={[styles.messageText, success ? styles.successText : styles.errorText]}>
                {message}
              </Text>
            </View>
          )}

          {!isLogin && (
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Имя"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#999"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Пароль"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, success ? styles.successButton : {}]}
            onPress={handleSubmit}
            disabled={loading || success}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>
                {success ? "Готово!" : isLogin ? "Войти" : "Зарегистрироваться"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setIsLogin(!isLogin)}
            style={styles.switchButton}
          >
            <Text style={styles.switchText}>
              {isLogin ? "Нет аккаунта? Зарегистрируйтесь" : "Уже есть аккаунт? Войдите"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#F2F2F7",
    },
    formContainer: {
      flex: 1,
      justifyContent: "center",
      padding: 16,
    },
    card: {
      backgroundColor: "white",
      borderRadius: 20,
      padding: 24,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      marginBottom: 24,
      textAlign: "center",
      color: "#000",
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F2F2F7",
      borderRadius: 12,
      marginBottom: 16,
      paddingHorizontal: 12,
    },
    inputIcon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      paddingVertical: 16,
      fontSize: 17,
      color: "#000",
    },
    button: {
      backgroundColor: "#007AFF",
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      marginTop: 8,
    },
    buttonText: {
      color: "white",
      fontSize: 17,
      fontWeight: "600",
    },
    messageContainer: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 12,
      marginBottom: 16,
    },
    errorMessage: {
      backgroundColor: "#FF3B3020",
    },
    messageText: {
      marginLeft: 8,
      fontSize: 15,
    },
    errorText: {
      color: "#FF3B30",
    },
    switchButton: {
      marginTop: 16,
      padding: 8,
    },
    switchText: {
      color: "#007AFF",
      fontSize: 15,
      textAlign: "center",
    },
  });
  

export default LoginScreen; 