import React, { useState, useEffect } from "react";
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  View,
  Animated,
  Platform 
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
const API_URL = process.env.EXPO_PUBLIC_API_URL;

const AddToCartButton = ({ productId, mini = false }) => {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [animation] = useState(new Animated.Value(1));

  useEffect(() => {
    const checkCart = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`${API_URL}/cart_items`, {
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

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleAddToCart = async () => {
    if (added) return;

    try {
      setLoading(true);
      animateButton();
      
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        alert("Вы не авторизованы. Пожалуйста, войдите в систему.");
        return;
      }

      const response = await fetch(`${API_URL}/cart_items`, {
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

  if (mini) {
    return (
      <Animated.View style={{ transform: [{ scale: animation }] }}>
        <TouchableOpacity
          style={[styles.miniButton, added && styles.buttonAdded]}
          onPress={handleAddToCart}
          disabled={loading || added}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : added ? (
            <Icon name="check" size={20} color="white" />
          ) : (
            <Icon name="add-shopping-cart" size={20} color="white" />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: animation }] }}>
      <TouchableOpacity
        style={[styles.button, added && styles.buttonAdded]}
        onPress={handleAddToCart}
        disabled={loading || added}
        activeOpacity={0.8}
      >
        <View style={styles.buttonContent}>
          {loading ? (
            <>
              <ActivityIndicator size="small" color="white" style={styles.icon} />
              <Text style={styles.text}>Добавление...</Text>
            </>
          ) : added ? (
            <>
              <Icon name="check" size={24} color="white" style={styles.icon} />
              <Text style={styles.text}>В корзине</Text>
            </>
          ) : (
            <>
              <Icon name="shopping-cart" size={24} color="white" style={styles.icon} />
              <Text style={styles.text}>Добавить в корзину</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#007AFF",
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  buttonAdded: {
    backgroundColor: "#34C759",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  miniButton: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#007AFF",
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});

export default AddToCartButton;
