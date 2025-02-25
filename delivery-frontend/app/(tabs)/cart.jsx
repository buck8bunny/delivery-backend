import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Animated,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const CartScreen = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteAnimation] = useState(new Animated.Value(1));
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

  const renderCartItem = ({ item }) => (
    <Animated.View
      style={[
        styles.cartItem,
        {
          opacity: deleteAnimation,
          transform: [
            {
              scale: deleteAnimation,
            },
          ],
        },
      ]}
    >
      <Image
        source={{ uri: item.product.image_url }}
        style={styles.productImage}
        defaultSource={require("../../assets/placeholder.png")}
      />
      
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.product.name}</Text>
        <Text style={styles.productPrice}>${item.product.price}</Text>
        
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, item.quantity - 1)}
          >
            <Ionicons name="remove" size={20} color="#007AFF" />
          </TouchableOpacity>

          <Text style={styles.quantity}>{item.quantity}</Text>

          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, item.quantity + 1)}
          >
            <Ionicons name="add" size={20} color="#007AFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteCartItem(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!cartItems.length) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="cart-outline" size={80} color="#999" />
        <Text style={styles.emptyText}>Ваша корзина пуста</Text>
        <TouchableOpacity
          style={styles.shopButton}
          onPress={() => router.push("/home")}
        >
          <Text style={styles.shopButtonText}>Перейти к покупкам</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Корзина</Text>
      
      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} style={styles.bottomContainer}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Итого:</Text>
            <Text style={styles.totalAmount}>${totalAmount}</Text>
          </View>

          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={() => router.push("/checkout")}
          >
            <Text style={styles.checkoutButtonText}>Оформить заказ</Text>
          </TouchableOpacity>
        </BlurView>
      ) : (
        <View style={[styles.bottomContainer, { backgroundColor: 'white' }]}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Итого:</Text>
            <Text style={styles.totalAmount}>${totalAmount}</Text>
          </View>

          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={() => router.push("/checkout")}
          >
            <Text style={styles.checkoutButtonText}>Оформить заказ</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    paddingTop: 60,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  cartItem: {
    flexDirection: "row",
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
    shadowRadius: 8,
    elevation: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 15,
    color: "#007AFF",
    fontWeight: "600",
    marginBottom: 12,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    backgroundColor: "#F2F2F7",
    borderRadius: 8,
    padding: 8,
  },
  quantity: {
    fontSize: 17,
    fontWeight: "600",
    marginHorizontal: 16,
  },
  deleteButton: {
    marginLeft: "auto",
    backgroundColor: "#FFE5E5",
    borderRadius: 8,
    padding: 8,
  },
  emptyText: {
    fontSize: 17,
    color: "#999",
    marginTop: 16,
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  shopButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 17,
    color: "#666",
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "bold",
  },
  checkoutButton: {
    backgroundColor: "#007AFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  checkoutButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
  },
});

export default CartScreen;
