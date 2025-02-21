import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";

export default function EditableField({ label, value, isEditing, onEdit, onChange, placeholder, secureTextEntry }) {
  return (
    <View>
      <Text style={styles.label}>{label}:</Text>
      {isEditing ? (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
        />
      ) : (
        <View style={styles.row}>
          <Text style={styles.infoText}>{secureTextEntry ? "******" : value}</Text>
          <TouchableOpacity onPress={onEdit}>
            <Text style={styles.editButton}>Редактировать</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
    label: {
      fontSize: 18,
      fontWeight: "600",
      color: "#495057",
      marginVertical: 10,
    },
    input: {
      borderWidth: 1,
      borderColor: "#ced4da",
      padding: 12,
      borderRadius: 8,
      backgroundColor: "#ffffff",
      fontSize: 16,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    infoText: {
      fontSize: 16,
      color: "#495057",
    },
    editButton: {
      color: "#007BFF",
      fontSize: 16,
      fontWeight: "500",
      textDecorationLine: "underline",
    },
    saveButton: {
      backgroundColor: "#007BFF",
      borderRadius: 25,  // Закругленные углы
      paddingVertical: 12,  // Отступы сверху и снизу
      paddingHorizontal: 24,  // Отступы по бокам
      alignSelf: "flex-start",  // Чтобы кнопка не растягивалась на весь экран
      marginVertical: 10,  // Отступы сверху и снизу
    },
    saveButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
      textAlign: "center",  // Текст по центру
    },
  });
  