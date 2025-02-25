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

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const AuthScreen = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [success, setSuccess] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const router = useRouter();

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isLogin]);

  // Проверка токена при монтировании
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        try {
          const response = await fetch(`${API_URL}/auth/validate`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            router.push("/home");
          } else {
            await AsyncStorage.removeItem("token"); // Удаляем невалидный токен
          }
        } catch (error) {
          console.error("Ошибка при проверке токена:", error);
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
      const response = await fetch(url, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
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
      setLoading(false);
  
      if (response.ok) {
        if (isLogin) {
          await AsyncStorage.setItem("token", result.token);
          onLoginSuccess(result); // Вызываем callback при успешной авторизации
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
      setLoading(false);
      setMessage("Ошибка сети, попробуйте снова.");
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
  successButton: {
    backgroundColor: "#34C759",
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
  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  successMessage: {
    backgroundColor: "#34C75920",
  },
  errorMessage: {
    backgroundColor: "#FF3B3020",
  },
  messageText: {
    marginLeft: 8,
    fontSize: 15,
  },
  successText: {
    color: "#34C759",
  },
  errorText: {
    color: "#FF3B30",
  },
});

export default AuthScreen;
