import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const CheckoutScreen = () => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [amount, setAmount] = useState(0);
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    fetchCartTotal();
    initializePaymentSheet();
  }, []);

  const fetchCartTotal = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "You are not authorized");
        router.replace("/login");
        return;
      }

      const response = await fetch(`${API_URL}/cart_total`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        setAmount(data.total);
      } else {
        throw new Error(data.message || "Failed to get order amount");
      }
    } catch (error) {
      console.error("Error fetching cart total:", error);
      Alert.alert("Error", error.message);
    }
  };

  const fetchPaymentSheetParams = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Not authorized");

      const response = await fetch(`${API_URL}/payment-sheet`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Network response was not ok');
      }

      const data = await response.json();
      if (data.orderId) {
        setOrderId(data.orderId);
      }
      
      return data;
    } catch (error) {
      console.error("Error fetching payment sheet params:", error);
      throw error;
    }
  };

  const handlePaymentCancel = async () => {
    if (!orderId) return;

    try {
      const token = await AsyncStorage.getItem("token");
      await fetch(`${API_URL}/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }
      });
    } catch (error) {
      console.error("Error canceling order:", error);
    }
  };

  const initializePaymentSheet = async () => {
    try {
      setLoading(true);
      const data = await fetchPaymentSheetParams();

      const { error } = await initPaymentSheet({
        merchantDisplayName: "Test Store",
        customerId: data.customer,
        customerEphemeralKeySecret: data.ephemeralKey,
        paymentIntentClientSecret: data.paymentIntent,
        defaultBillingDetails: {}
      });

      if (error) {
        console.error("Error initializing payment sheet:", error);
        Alert.alert("Error", error.message);
      } else {
        setReady(true);
      }
    } catch (error) {
      console.error("Error in initializePaymentSheet:", error);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const openPaymentSheet = async () => {
    if (!ready) {
      Alert.alert("Wait", "Payment form is still loading");
      return;
    }

    try {
      const { error } = await presentPaymentSheet();

      if (error) {
        if (error.code === 'Canceled') {
          await handlePaymentCancel();
          router.replace("/orders");
          return;
        }
        
        Alert.alert(`Payment error`, error.message);
      } else {
        try {
          // Обновляем stock после успешной оплаты
          const token = await AsyncStorage.getItem("token");
          await fetch(`${API_URL}/orders/${orderId}/update_stock`, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            }
          });

          Alert.alert(
            'Success!', 
            'Your order has been paid',
            [
              {
                text: 'OK',
                onPress: () => router.replace("/orders")
              }
            ]
          );
        } catch (error) {
          console.error("Error updating stock:", error);
          Alert.alert(
            'Payment successful',
            'Your order has been paid, but there was an error updating the stock.',
            [
              {
                text: 'OK',
                onPress: () => router.replace("/orders")
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error("Error in openPaymentSheet:", error);
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment</Text>
      <Text style={styles.amount}>Amount: ${amount}</Text>

      <TouchableOpacity
        style={[styles.payButton, (!ready || loading) && styles.payButtonDisabled]}
        onPress={openPaymentSheet}
        disabled={!ready || loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.payButtonText}>
            {ready ? "Pay" : "Preparing payment form..."}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  amount: {
    fontSize: 18,
    marginBottom: 30,
  },
  payButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CheckoutScreen;

