import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
const API_URL = process.env.EXPO_PUBLIC_API_URL;


const STRIPE_PK = "pk_test_51Qu9QKKHwD7tNZiZSjDPbyg6qBXzTBa3AP2mJVsBpm3DT6jVLzVO1yuxFPBTfNjXYgzPK744b6h5Z9Gipu28XClh00fGcbfKLB";

const CheckoutScreen = () => {
  console.log("🚀 Rendering CheckoutScreen");
  
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [amount, setAmount] = useState(0);
  const [stripeReady, setStripeReady] = useState(false);
  
  // Состояния для полей карты
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  // Добавим состояние для хранения товаров
  const [cartItems, setCartItems] = useState([]);

  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    console.log("🔄 Component mounted");
    fetchCartTotal();
    fetchCartItems(); // Добавим загрузку товаров
    setStripeReady(true);
  }, []);

  // Форматирование номера карты с сохранением позиции курсора
  const handleCardNumberChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = '';
    
    for (let i = 0; i < cleaned.length && i < 16; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += ' ';
      }
      formatted += cleaned[i];
    }
    
    setCardNumber(formatted);
  };

  // Форматирование срока действия
  const handleExpiryChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    
    if (cleaned.length >= 2) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    
    setExpiry(formatted);
  };

  // Форматирование CVC
  const handleCvcChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 3) {
      setCvc(cleaned);
    }
  };

  // Добавим функцию проверки валидности карты
  const isCardNumberValid = (number) => {
    const cleaned = number.replace(/\s/g, '');
    return cleaned.length === 16 && /^\d+$/.test(cleaned);
  };

  const isExpiryValid = (expiry) => {
    if (!expiry.includes('/')) return false;
    const [month, year] = expiry.split('/');
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    return monthNum >= 1 && 
           monthNum <= 12 && 
           yearNum >= currentYear && 
           (yearNum > currentYear || monthNum >= currentMonth);
  };

  const isCvcValid = (cvc) => {
    return /^\d{3}$/.test(cvc);
  };

  const isFormValid = () => {
    const isValid = isCardNumberValid(cardNumber) && 
                   isExpiryValid(expiry) && 
                   isCvcValid(cvc);
    
    console.log("Form validation:", {
      cardNumberValid: isCardNumberValid(cardNumber),
      expiryValid: isExpiryValid(expiry),
      cvcValid: isCvcValid(cvc),
      overall: isValid
    });
    
    return isValid;
  };

  const fetchCartTotal = async () => {
    try {
      console.log("🔄 Fetching cart total...");
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Ошибка", "Вы не авторизованы");
        router.replace("/login");        return;
      }

      const response = await fetch(`${API_URL}/cart_total`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        console.log("✅ Cart total fetched:", data.total);
        setAmount(data.total);
      } else {
        throw new Error(data.message || "Не удалось получить сумму заказа");
      }
    } catch (error) {
      console.error("❌ Error fetching cart total:", error);
      Alert.alert("Ошибка", error.message);
    }
  };

  const fetchCartItems = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Не авторизован");

      const response = await fetch(`${API_URL}/cart_items`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        console.log("✅ Cart items fetched:", data);
        setCartItems(data);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("❌ Error fetching cart items:", error);
    }
  };

  const fetchPaymentSheetParams = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Не авторизован");

      console.log("📡 Fetching payment sheet params...");
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
      console.log("✅ Payment sheet params received");
      
      // Сохраняем ID заказа
      if (data.orderId) {
        setOrderId(data.orderId);
      }
      
      return data;
    } catch (error) {
      console.error("❌ Error fetching payment sheet params:", error);
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

      console.log("🔄 Initializing payment sheet...");
      const { error } = await initPaymentSheet({
        merchantDisplayName: "Your Store Name",
        customerId: data.customer,
        customerEphemeralKeySecret: data.ephemeralKey,
        paymentIntentClientSecret: data.paymentIntent,
        // Удалим лишние параметры
        defaultBillingDetails: {}
      });

      if (error) {
        console.error("❌ Error initializing payment sheet:", error);
        Alert.alert("Ошибка", error.message);
      } else {
        console.log("✅ Payment sheet initialized");
        setReady(true);
      }
    } catch (error) {
      console.error("❌ Error in initializePaymentSheet:", error);
      Alert.alert("Ошибка", error.message);
    } finally {
      setLoading(false);
    }
  };

  const openPaymentSheet = async () => {
    if (!ready) {
      Alert.alert("Подождите", "Форма оплаты еще загружается");
      return;
    }

    try {
      const { error } = await presentPaymentSheet();

      if (error) {
        console.log(`❌ Payment sheet error:`, error);
        
        if (error.code === 'Canceled') {
          // Обрабатываем отмену платежа
          await handlePaymentCancel();
          router.replace("/orders");
          return;
        }
        
        Alert.alert(`Ошибка оплаты`, error.message);
      } else {
        console.log("✅ Payment successful!");
        Alert.alert(
          'Успех!', 
          'Ваш заказ успешно оплачен',
          [
            {
              text: 'OK',
              onPress: () => router.replace("/orders")
            }
          ]
        );
      }
    } catch (error) {
      console.error("❌ Error in openPaymentSheet:", error);
      Alert.alert("Ошибка", error.message);
    }
  };

  useEffect(() => {
    initializePaymentSheet();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Оплата</Text>
      <Text style={styles.amount}>Сумма: {amount} $</Text>

      <TouchableOpacity
        style={[styles.payButton, (!ready || loading) && styles.payButtonDisabled]}
        onPress={openPaymentSheet}
        disabled={!ready || loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.payButtonText}>
            {ready ? "Оплатить" : "Подготовка формы оплаты..."}
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

