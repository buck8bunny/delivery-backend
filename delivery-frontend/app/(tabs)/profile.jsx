import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import EditableField from "../components/EditableField";
import { useUser } from "../context/UserContext"; // Импортируем контекст

export default function ProfileScreen() {
  const { updateUserName } = useUser(); // Используем контекст для обновления имени
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [editing, setEditing] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadUserData = async () => {
      const token = await AsyncStorage.getItem("token");

      if (token) {
        try {
          const response = await fetch("http://localhost:3000/auth/validate", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          });
          const result = await response.json();
          if (result.valid && result.user) {
            setUserName(result.user.name);
            setEmail(result.user.email);
          }
        } catch (error) {
          console.error("Ошибка при загрузке данных пользователя:", error);
        }
      }
    };

    loadUserData();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    router.push("/");
  };

  const handleSaveChanges = async () => {
    setErrorMessage("");

    try {
      const token = await AsyncStorage.getItem("token");
      let endpoint = "";
      let bodyData = {};

      if (editing === "name") {
        // Изменение имени без пароля
        endpoint = "http://localhost:3000/users/update_name";
        bodyData = { name: userName };
      } else if (editing === "email" && newEmail) {
        // Изменение почты требует текущий пароль
        if (!currentPassword) {
          setErrorMessage("Введите текущий пароль.");
          return;
        }
        endpoint = "http://localhost:3000/users/update_email";
        bodyData = { email: newEmail, password: currentPassword };
      } else if (editing === "password" && newPassword) {
        // Изменение пароля требует текущий пароль
        if (!currentPassword) {
          setErrorMessage("Введите текущий пароль.");
          return;
        }
        endpoint = "http://localhost:3000/users/password/update";
        bodyData = { current_password: currentPassword, new_password: newPassword };
      } else {
        setErrorMessage("Пожалуйста, заполните все поля.");
        return;
      }

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });

      const result = await response.json();
      if (result.success) {
        if (editing === "name") {
          updateUserName(userName); // Обновляем имя через контекст
          await AsyncStorage.setItem("userName", userName);
        } else if (editing === "email") {
          setEmail(newEmail);
        }
        setEditing(null);
        setCurrentPassword("");
        setNewPassword("");
        setNewEmail("");
      } else {
        setErrorMessage(result.message || "Ошибка при обновлении данных.");
      }
    } catch (error) {
      console.error("Ошибка при обновлении данных:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Профиль</Text>

      <EditableField
        label="Имя"
        value={userName}
        isEditing={editing === "name"}
        onEdit={() => setEditing("name")}
        onChange={setUserName}
        placeholder="Введите имя"
      />

      <EditableField
        label="Почта"
        value={editing === "email" ? newEmail : email} // Показываем старую почту до редактирования
        isEditing={editing === "email"}
        onEdit={() => {
          setNewEmail(email); // Устанавливаем старую почту перед редактированием
          setEditing("email");
        }}
        onChange={setNewEmail}
        placeholder="Введите новую почту"
      />


      <EditableField
        label="Пароль"
        value=""
        isEditing={editing === "password"}
        onEdit={() => setEditing("password")}
        onChange={setNewPassword}
        placeholder="Введите новый пароль"
        secureTextEntry
      />

      {editing &&  editing !== "name" && (
        <EditableField
          label="Текущий пароль"
          value={currentPassword}
          isEditing={true}
          onChange={setCurrentPassword}
          placeholder="Введите текущий пароль"
          secureTextEntry
        />
      )}

      {errorMessage && <Text style={styles.errorMessage}>{errorMessage}</Text>}

      {editing && <Button title="Сохранить изменения" onPress={handleSaveChanges} />}
      <Button  title="Выйти" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  errorMessage: { color: "red", fontSize: 14, marginBottom: 10 },
 
});
