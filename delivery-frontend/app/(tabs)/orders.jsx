import React, { useState, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity,
  RefreshControl 
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const OrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        alert("Пожалуйста, войдите в систему");
        return;
      }

      const response = await fetch(`${API_URL}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setOrders(data);
      } else {
        alert(data.message || "Не удалось загрузить заказы");
      }
    } catch (error) {
      console.error("Ошибка при загрузке заказов:", error);
      alert("Произошла ошибка при загрузке заказов");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#4CAF50'; // Зеленый
      case 'pending':
        return '#FFC107'; // Желтый
      case 'failed':
        return '#F44336'; // Красный
      default:
        return '#9E9E9E'; // Серый
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Выполнен';
      case 'pending':
        return 'В обработке';
      case 'failed':
        return 'Отменён';
      default:
        return 'Неизвестно';
    }
  };

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>Заказ #{item.id}</Text>
        <Text style={[
          styles.orderStatus, 
          { color: getStatusColor(item.status) }
        ]}>
          {getStatusText(item.status)}
        </Text>
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.orderDate}>
          {new Date(item.created_at).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
        <Text style={styles.orderTotal}>Сумма: ${item.total}</Text>
      </View>

      <View style={styles.orderItems}>
        {item.order_items?.map((orderItem, index) => (
          <Text key={index} style={styles.orderItem}>
            {`${orderItem.product?.name || 'Неизвестный товар'} x ${orderItem.quantity} ($${orderItem.price})`}
          </Text>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!orders.length) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>У вас пока нет заказов</Text>
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
      <Text style={styles.title}>Мои заказы</Text>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    paddingHorizontal: 16
  },
  listContainer: {
    padding: 16
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  orderStatus: {
    fontSize: 16,
    fontWeight: '500'
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  orderDate: {
    color: '#666'
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '500'
  },
  orderItems: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12
  },
  orderItem: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20
  },
  shopButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25
  },
  shopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500'
  }
});

export default OrdersScreen;
