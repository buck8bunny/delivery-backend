import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    revenue: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Здесь будет запрос к API для получения статистики
      // const response = await fetch(`${API_URL}/admin/stats`);
      // const data = await response.json();
      // setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Панель управления</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>{stats.totalOrders}</Text>
          <Text style={styles.statsLabel}>Заказов</Text>
        </View>
        
        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>{stats.totalUsers}</Text>
          <Text style={styles.statsLabel}>Пользователей</Text>
        </View>
        
        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>{stats.totalProducts}</Text>
          <Text style={styles.statsLabel}>Товаров</Text>
        </View>
        
        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>${stats.revenue}</Text>
          <Text style={styles.statsLabel}>Выручка</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    padding: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginTop: 60,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsCard: {
    width: '48%',
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
    shadowRadius: 8,
    elevation: 3,
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  statsLabel: {
    fontSize: 16,
    color: '#666',
  },
}); 