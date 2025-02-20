import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { useLocalSearchParams } from "expo-router";
import Icon from "react-native-vector-icons/MaterialIcons"; // Импортируем иконки
import AsyncStorage from "@react-native-async-storage/async-storage"; // Для получения токена

const ProductDetailScreen = ({ navigation }) => {
  const { id } = useLocalSearchParams(); // Получаем id из URL
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:3000/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleAddToCart = async () => {
    try {
      const token = await AsyncStorage.getItem('token'); // Получаем токен из AsyncStorage

      if (!token) {
        alert("Вы не авторизованы. Пожалуйста, войдите в систему.");
        return;
      }

      // Отправляем запрос на добавление товара в корзину
      const response = await fetch("http://localhost:3000/cart_items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Передаем токен в заголовке
        },
        body: JSON.stringify({
          product_id: product.id,
          quantity: 1, // Например, добавляем 1 единицу товара
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Товар добавлен в корзину!");
      } else {
        alert(data.message || "Не удалось добавить товар в корзину.");
      }
    } catch (error) {
      console.error("Ошибка при добавлении товара в корзину:", error);
      alert("Произошла ошибка при добавлении товара в корзину.");
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />;
  }

  if (!product) {
    return <Text style={styles.errorText}>Товар не найден</Text>;
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: product.image }} style={styles.image} />
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.description}>{product.description}</Text>
      <Text style={styles.price}>{product.price} $</Text>
      <Text style={styles.stock}>В наличии: {product.stock} шт.</Text>

      <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
        <Icon name="shopping-cart" size={24} color="white" />
        <Text style={styles.addToCartText}>Добавить в корзину</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: "center",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  image: {
    width: 250,
    height: 250,
    borderRadius: 10,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    color: "green",
    fontWeight: "bold",
    marginBottom: 8,
  },
  stock: {
    fontSize: 16,
    color: "#555",
    marginBottom: 16,
  },
  addToCartButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addToCartText: {
    color: "white",
    fontSize: 18,
    marginLeft: 8,
  },
});

export default ProductDetailScreen;
