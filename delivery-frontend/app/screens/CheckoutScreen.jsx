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
  
  const { createPaymentMethod, handleCardAction, confirmPayment } = useStripe();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(0);
  const [stripeReady, setStripeReady] = useState(false);
  
  // Состояния для полей карты
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  // Добавим состояние для хранения товаров
  const [cartItems, setCartItems] = useState([]);

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

  // Валидация полей карты
  const isCardNumberValid = () => cardNumber.replace(/\s/g, '').length === 16;
  const isExpiryValid = () => {
    const [month, year] = expiry.split('/');
    if (!month || !year) return false;
    
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;

    if (monthNum < 1 || monthNum > 12) return false;
    if (yearNum < currentYear) return false;
    if (yearNum === currentYear && monthNum < currentMonth) return false;
    
    return true;
  };
  const isCvcValid = () => cvc.length === 3;
  const isFormValid = () => isCardNumberValid() && isExpiryValid() && isCvcValid();

  const fetchCartTotal = async () => {
    try {
      console.log("🔄 Fetching cart total...");
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Ошибка", "Вы не авторизованы");
        router.replace("/login");
        return;
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

  const handlePayPress = async () => {
    if (!isFormValid()) {
      Alert.alert("Ошибка", "Пожалуйста, проверьте данные карты");
      return;
    }

    try {
      setLoading(true);
      console.log("💳 Creating order...");

      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Не авторизован");

      // Формируем данные заказа с ценой для каждого товара
      const orderData = {
        order: {
          total: amount,
          order_items_attributes: cartItems.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.product.price // Добавляем цену из продукта
          }))
        }
      };

      console.log("📦 Order data:", JSON.stringify(orderData, null, 2));

      // 1. Создаем заказ
      const orderResponse = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData)
      });

      const orderResult = await orderResponse.json();
      if (!orderResponse.ok) {
        console.error("❌ Order creation failed:", orderResult);
        throw new Error(orderResult.errors?.join(', ') || 'Ошибка создания заказа');
      }

      console.log("✅ Order created:", orderResult);

      // 2. Создаем платежный метод
      console.log("💳 Creating payment method...");
      const { paymentMethod, error: pmError } = await createPaymentMethod({
        paymentMethodType: 'Card',
        billingDetails: {
          email: 'example@example.com',
        },
        card: {
          number: cardNumber.replace(/\s/g, ''),
          exp_month: parseInt(expiry.split('/')[0]),
          exp_year: parseInt('20' + expiry.split('/')[1]),
          cvc: cvc,
        },
      });

      if (pmError) {
        console.error("❌ Payment method error:", pmError);
        throw new Error(pmError.message);
      }

      console.log("✅ Payment method created:", paymentMethod.id);

      // 3. Подтверждаем платеж
      console.log("💳 Confirming payment...");
      const { error: confirmError } = await confirmPayment(orderResult.client_secret, {
        paymentMethodType: 'Card',
        paymentMethod: paymentMethod.id,
      });

      if (confirmError) {
        console.error("❌ Confirm payment error:", confirmError);
        throw new Error(confirmError.message);
      }

      console.log("✅ Payment confirmed");

      // 4. Подтверждаем оплату на бэкенде
      const confirmResponse = await fetch(`${API_URL}/confirm_payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: orderResult.order.id,
          payment_intent_id: orderResult.order.payment_intent_id
        })
      });

      const confirmData = await confirmResponse.json();
      if (!confirmResponse.ok) {
        throw new Error(confirmData.message || 'Ошибка подтверждения оплаты');
      }

      console.log("✅ Payment completed successfully");
      Alert.alert("Успех", "Заказ успешно оплачен!");
      router.push("/success");

    } catch (error) {
      console.error("❌ Payment error:", error);
      Alert.alert("Ошибка", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!stripeReady) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Инициализация платежной системы...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Оплата</Text>
      <Text style={styles.amount}>Сумма: {amount} $</Text>

      <View style={styles.cardContainer}>
        <Text style={styles.label}>Номер карты</Text>
        <TextInput
          style={styles.input}
          placeholder="4242 4242 4242 4242"
          value={cardNumber}
          onChangeText={handleCardNumberChange}
          keyboardType="numeric"
          maxLength={19} // 16 цифр + 3 пробела
        />
        <Text style={styles.validationText}>
          {cardNumber ? (isCardNumberValid() ? "✅" : "❌") : ""}
        </Text>

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Срок действия</Text>
            <TextInput
              style={styles.input}
              placeholder="MM/YY"
              value={expiry}
              onChangeText={handleExpiryChange}
              keyboardType="numeric"
              maxLength={5} // MM/YY
            />
            <Text style={styles.validationText}>
              {expiry ? (isExpiryValid() ? "✅" : "❌") : ""}
            </Text>
          </View>

          <View style={styles.halfWidth}>
            <Text style={styles.label}>CVC</Text>
            <TextInput
              style={styles.input}
              placeholder="123"
              value={cvc}
              onChangeText={handleCvcChange}
              keyboardType="numeric"
              maxLength={3}
              secureTextEntry
            />
            <Text style={styles.validationText}>
              {cvc ? (isCvcValid() ? "✅" : "❌") : ""}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Тестовая карта:{'\n'}
          4242 4242 4242 4242{'\n'}
          Любая будущая дата (MM/YY){'\n'}
          Любые 3 цифры
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.payButton, !isFormValid() && styles.payButtonDisabled]}
        onPress={handlePayPress}
        disabled={!isFormValid() || loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.payButtonText}>
            {isFormValid() ? "Оплатить" : "Введите данные карты"}
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
    textAlign: 'center',
    marginVertical: 20,
  },
  amount: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 30,
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  halfWidth: {
    width: '48%',
  },
  validationText: {
    fontSize: 16,
    marginLeft: 5,
    marginTop: 2,
  },
  infoContainer: {
    backgroundColor: '#e8e8e8',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  payButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  payButtonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  debugText: {
    marginTop: 20,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  statusContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    marginVertical: 2,
  },
});

export default CheckoutScreen;
