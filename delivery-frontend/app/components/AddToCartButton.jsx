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
import { useCart } from '../context/CartContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const AddToCartButton = ({ productId, mini = false, stock = 0 }) => {
  const [loading, setLoading] = useState(false);
  const [animation] = useState(new Animated.Value(1));
  const { isInCart, getCartItemId, addToCart, removeFromCart, fetchCartItems } = useCart();
  const isOutOfStock = stock <= 0;

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
    try {
      setLoading(true);
      animateButton();
      
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        alert("Please log in to continue");
        return;
      }

      const cartItemId = getCartItemId(productId);
      
      if (isInCart(productId)) {
        // Remove from cart
        const response = await fetch(`${API_URL}/cart_items/${cartItemId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          removeFromCart(cartItemId);
          await fetchCartItems();
        } else {
          alert("Failed to remove item from cart");
        }
      } else {
        // Add to cart
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
          addToCart(data);
          await fetchCartItems();
        } else {
          alert(data.message || "Failed to add item to cart");
        }
      }
    } catch (error) {
      console.error("Error managing cart:", error);
      alert("An error occurred while managing the cart");
    } finally {
      setLoading(false);
    }
  };

  if (mini) {
    return (
      <Animated.View style={{ transform: [{ scale: animation }] }}>
        <TouchableOpacity
          style={[
            styles.miniButton, 
            isInCart(productId) && styles.buttonAdded,
            isOutOfStock && styles.buttonDisabled
          ]}
          onPress={handleAddToCart}
          disabled={loading || isOutOfStock}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : isOutOfStock ? (
            <Icon name="remove-shopping-cart" size={20} color="white" />
          ) : isInCart(productId) ? (
            <Icon name="remove-shopping-cart" size={20} color="white" />
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
        style={[
          styles.button, 
          isInCart(productId) && styles.buttonAdded,
          isOutOfStock && styles.buttonDisabled
        ]}
        onPress={handleAddToCart}
        disabled={loading || isOutOfStock}
        activeOpacity={0.8}
      >
        <View style={styles.buttonContent}>
          {loading ? (
            <>
              <ActivityIndicator size="small" color="white" style={styles.icon} />
              <Text style={styles.text}>Processing...</Text>
            </>
          ) : isOutOfStock ? (
            <>
              <Icon name="remove-shopping-cart" size={24} color="white" style={styles.icon} />
              <Text style={styles.text}>Out of Stock</Text>
            </>
          ) : isInCart(productId) ? (
            <>
              <Icon name="remove-shopping-cart" size={24} color="white" style={styles.icon} />
              <Text style={styles.text}>Remove from Cart</Text>
            </>
          ) : (
            <>
              <Icon name="shopping-cart" size={24} color="white" style={styles.icon} />
              <Text style={styles.text}>Add to Cart</Text>
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
  buttonDisabled: {
    backgroundColor: '#D1D1D6',
  },
});

export default AddToCartButton;
