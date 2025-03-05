import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import EditableField from "../components/EditableField";
import { useUser } from "../context/UserContext";
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ProfileScreen() {
  const { userName, updateUserName, email, updateEmail } = useUser();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [tempUserName, setTempUserName] = useState(userName);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`${API_URL}/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          updateEmail(data.email);
          if (data.name) {
            updateUserName(data.name);
            setTempUserName(data.name);
            await AsyncStorage.setItem("userName", data.name);
          }
        }
      } catch (error) {
        console.error("Ошибка при загрузке данных пользователя:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    router.replace("/(auth)/login");
  };

  const handleSaveChanges = async () => {
    setErrorMessage("");

    try {
      const token = await AsyncStorage.getItem("token");
      let endpoint = "";
      let bodyData = {};

      if (editing === "name") {
        endpoint = `${API_URL}/users/update_name`;
        bodyData = { name: tempUserName };
      } else if (editing === "email" && newEmail) {
        if (!currentPassword) {
          setErrorMessage("Введите текущий пароль");
          return;
        }
        endpoint = `${API_URL}/users/update_email`;
        bodyData = { email: newEmail, password: currentPassword };
      } else if (editing === "password" && newPassword) {
        if (!currentPassword) {
          setErrorMessage("Введите текущий пароль");
          return;
        }
        endpoint = `${API_URL}/users/password/update`;
        bodyData = { current_password: currentPassword, new_password: newPassword };
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

      if (response.ok) {
        if (editing === "name") {
          updateUserName(tempUserName);
          await AsyncStorage.setItem("userName", tempUserName);
        } else if (editing === "email") {
          updateEmail(newEmail);
        }
        setEditing(null);
        setCurrentPassword("");
        setNewPassword("");
        setNewEmail("");
      } else {
        setErrorMessage(result.message || "Ошибка при обновлении данных");
      }
    } catch (error) {
      console.error("Ошибка при обновлении данных:", error);
      setErrorMessage("Произошла ошибка при обновлении данных");
    }
  };

  const renderSection = (title, value, onEdit, isPassword = false) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        <Text style={styles.sectionValue}>
          {isPassword ? "••••••••" : value}
        </Text>
        <TouchableOpacity onPress={onEdit} style={styles.editButton}>
          <Ionicons name="pencil" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userName?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>
        </View>
        <Text style={styles.welcomeText}>Добро пожаловать,</Text>
        <Text style={styles.userName}>{userName}</Text>
      </View>

      <View style={styles.content}>
        {editing ? (
          <View style={styles.editingContainer}>
            <Text style={styles.editingTitle}>
              {editing === "name" ? "Изменение имени" :
               editing === "email" ? "Изменение почты" :
               "Изменение пароля"}
            </Text>
            
            {editing === "name" && (
              <EditableField
                label="Новое имя"
                value={tempUserName}
                onChange={setTempUserName}
                placeholder="Введите новое имя"
              />
            )}

            {editing === "email" && (
              <EditableField
                label="Новая почта"
                value={newEmail}
                onChange={setNewEmail}
                placeholder="Введите новую почту"
              />
            )}

            {editing === "password" && (
              <EditableField
                label="Новый пароль"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Введите новый пароль"
                secureTextEntry
              />
            )}

            {editing !== "name" && (
              <EditableField
                label="Текущий пароль"
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder="Введите текущий пароль"
                secureTextEntry
              />
            )}

            {errorMessage && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}

            <View style={styles.editingButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setEditing(null);
                  setErrorMessage("");
                  setCurrentPassword("");
                  setNewPassword("");
                  setNewEmail("");
                }}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveChanges}
              >
                <Text style={styles.saveButtonText}>Сохранить</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {renderSection("Имя", userName, () => setEditing("name"))}
            {renderSection("Почта", email, () => setEditing("email"))}
            {renderSection("Пароль", "••••••••", () => setEditing("password"), true)}
            
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
              <Text style={styles.logoutText}>Выйти</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 40,
    color: "white",
    fontWeight: "bold",
  },
  welcomeText: {
    fontSize: 17,
    color: "#666",
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  content: {
    padding: 16,
    paddingTop: 24,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionValue: {
    fontSize: 17,
    color: "#000",
    flex: 1,
  },
  editButton: {
    padding: 8,
  },
  editingContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  editingTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#000",
  },
  editingButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F2F2F7",
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    marginLeft: 8,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 17,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 8,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFE5E5",
    padding: 16,
    borderRadius: 16,
    marginTop:12,
  },
  logoutText: {
    color: "#FF3B30",
    fontSize: 17,
    fontWeight: "600",
    marginLeft: 8,
  },
});
