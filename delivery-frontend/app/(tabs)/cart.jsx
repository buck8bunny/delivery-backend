import React, { useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
const API_URL = process.env.EXPO_PUBLIC_API_URL;



const CartScreen = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        alert("Вы не авторизованы. Пожалуйста, войдите в систему.");
        return;
      }

      const response = await fetch(`${API_URL}/cart_items`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setCartItems(data);
      } else {
        alert(data.message || "Не удалось загрузить корзину.");
      }
    } catch (error) {
      console.error("Ошибка при загрузке корзины:", error);
      alert("Произошла ошибка при загрузке корзины.");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) {
      deleteCartItem(cartItemId);
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${API_URL}/cart_items/${cartItemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (response.ok) {
        fetchCartItems();
      } else {
        alert("Не удалось обновить количество товара.");
      }
    } catch (error) {
      console.error("Ошибка при обновлении количества:", error);
    }
  };

  const deleteCartItem = async (cartItemId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${API_URL}/cart_items/${cartItemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchCartItems();
      } else {
        alert("Не удалось удалить товар.");
      }
    } catch (error) {
      console.error("Ошибка при удалении товара:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCartItems();
    }, [])
  );

  // Подсчет общей суммы корзины
  const totalAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toFixed(2);
  }, [cartItems]);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />;
  }

  if (!cartItems.length) {
    return <Text style={styles.errorText}>Корзина пуста</Text>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cartItems}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/product/${item.product.id}`)} >
            <View style={styles.cartItem}>
              <Text style={styles.productName}>{item.product.name}</Text>
              <Text>
                {item.product.price} $ x {item.quantity} = {(item.product.price * item.quantity).toFixed(2)} $
              </Text>

              <View style={styles.quantityContainer}>
                <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)} style={styles.button}>
                  <Text style={styles.buttonText}>-</Text>
                </TouchableOpacity>

                <Text style={styles.quantity}>{item.quantity}</Text>

                <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} style={styles.button}>
                  <Text style={styles.buttonText}>+</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => deleteCartItem(item.id)} style={styles.deleteButton}>
                  <Text style={styles.deleteText}>Удалить</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id.toString()}
      />

      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>Общая сумма: {totalAmount} $</Text>

        {/* Кнопка "Оплатить" */}
        <TouchableOpacity style={styles.payButton} onPress={() => router.push("/checkout")}>
          <Text style={styles.payButtonText}>Оплатить</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cartItem: {
    marginBottom: 16,
    borderBottomWidth: 1,
    paddingBottom: 8,
    paddingHorizontal: 10,
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  button: {
    backgroundColor: "#ddd",
    padding: 8,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  quantity: {
    fontSize: 18,
    fontWeight: "bold",
    minWidth: 30,
    textAlign: "center",
  },
  deleteButton: {
    marginLeft: 20,
    backgroundColor: "red",
    padding: 8,
    borderRadius: 5,
  },
  deleteText: {
    color: "white",
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  totalContainer: { 
    paddingVertical: 10, 
    borderTopWidth: 1, 
    marginTop: 10, 
    alignItems: "center" 
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "right",
  },

   // Стиль для кнопки "Оплатить"
   payButton: {
    marginTop:10,
    backgroundColor: "green",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  payButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CartScreen;
