import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Проверка токена при монтировании
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        try {
          const response = await fetch("http://localhost:3000/auth/validate", {
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
      ? "http://localhost:3000/users/sign_in"
      : "http://localhost:3000/users";
  
    const data = new URLSearchParams();
    data.append("user[email]", email);
    data.append("user[password]", password);
  
    if (!isLogin) {
      data.append("user[name]", name);
    }
  
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: data.toString(),
      });
  
      let result;
      const text = await response.text(); // Получаем ответ в виде текста
  
      try {
        result = JSON.parse(text); // Пробуем разобрать как JSON
      } catch {
        result = text; // Если ошибка парсинга, просто оставляем текст
      }
  
      console.log(result);
      setLoading(false);
  
      if (response.ok) {
        if (isLogin) {
          await AsyncStorage.setItem("token", result.token);
          await AsyncStorage.setItem("userName", result.data?.name || "");
          router.push("/home");
        } else {
          setSuccess(true);
          setMessage("Регистрация успешна!");
          setTimeout(() => {
            setSuccess(false);
            setIsLogin(true);
          }, 2000);
        }
      } else {
        setMessage(typeof result === "string" ? result : result.message || "Произошла ошибка.");
      }
    } catch (error) {
      setLoading(false);
      setMessage("Ошибка сети, попробуйте снова.");
    }
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? "Вход" : "Регистрация"}</Text>

      {message && (
        <Text style={[styles.message, success ? styles.success : styles.error]}>
          {message}
        </Text>
      )}

      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Имя"
          value={name}
          onChangeText={setName}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Пароль"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />



      <TouchableOpacity
        style={[styles.button, success ? styles.successButton : {}]}
        onPress={handleSubmit}
        disabled={loading || success}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>
            {success ? "Зарегистрировано!" : isLogin ? "Войти" : "Регистрация"}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.switchText}>
          {isLogin ? "Переключиться на регистрацию" : "Переключиться на вход"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 5,
  },
  button: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
  successButton: {
    backgroundColor: "green",
  },
  switchText: {
    color: "#007BFF",
    marginTop: 10,
  },
  message: {
    fontSize: 14,
    marginBottom: 10,
  },
  success: {
    color: "green",
  },
  error: {
    color: "red",
  },
});

export default AuthScreen;
