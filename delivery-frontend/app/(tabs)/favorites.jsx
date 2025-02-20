import React from "react";
import { View, Text, StyleSheet } from "react-native";

const FavoritesScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Избранное</Text>
      {/* Здесь добавишь логику для отображения избранных товаров */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
  },
});

export default FavoritesScreen;
