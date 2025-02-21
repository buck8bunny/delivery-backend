import React, { useState, useEffect } from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AddToCartButton = ({ productId }) => {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const checkCart = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const response = await fetch("http://localhost:3000/cart_items", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok && Array.isArray(data)) {
          const itemInCart = data.some((item) => item.product_id === productId);
          if (itemInCart) setAdded(true);
        }
      } catch (error) {
        console.error("Ошибка при проверке корзины:", error);
      }
    };

    checkCart();
  }, [productId]);

  const handleAddToCart = async () => {
    if (added) return;

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        alert("Вы не авторизованы. Пожалуйста, войдите в систему.");
        return;
      }

      const response = await fetch("http://localhost:3000/cart_items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: productId, quantity: 1 }),
      });

      const data = await response.json();

      if (response.ok) {
        setAdded(true);
      } else {
        alert(data.message || "Не удалось добавить товар в корзину.");
      }
    } catch (error) {
      console.error("Ошибка при добавлении товара в корзину:", error);
      alert("Произошла ошибка при добавлении товара в корзину.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, added && styles.buttonAdded]}
      onPress={handleAddToCart}
      disabled={loading || added}
    >
      {loading ? (
        <>
          <ActivityIndicator size="small" color="white" />
          <Text style={styles.text}>Добавление...</Text>
        </>
      ) : added ? (
        <>
          <Icon name="check" size={24} color="white" />
          <Text style={styles.text}>Добавлено</Text>
        </>
      ) : (
        <>
          <Icon name="shopping-cart" size={24} color="white" />
          <Text style={styles.text}>Добавить в корзину</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: "center",
  },
  buttonAdded: {
    backgroundColor: "#888", // Серый цвет, если товар уже добавлен
  },
  text: {
    color: "white",
    fontSize: 18,
    marginLeft: 8,
  },
});

export default AddToCartButton;
