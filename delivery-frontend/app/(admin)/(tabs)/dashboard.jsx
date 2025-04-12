import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats({
        totalOrders: data.total_orders || 0,
        totalUsers: data.total_users || 0,
        totalProducts: data.total_products || 0,
        revenue: parseFloat(data.total_revenue || 0).toFixed(2)
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Загружаем статистику при монтировании
  useEffect(() => {
    fetchStats();
  }, []);

  // Обновляем статистику при фокусе на экране
  useFocusEffect(
    React.useCallback(() => {
      fetchStats();
    }, [])
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, []);

  const navigateToTab = (tabName) => {
    router.navigate(tabName);
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
      >
        <Text style={styles.title}>Admin Dashboard</Text>
        
        <View style={styles.statsGrid}>
          <TouchableOpacity 
            style={styles.statsCard}
            onPress={() => navigateToTab('orders')}
            activeOpacity={0.7}
          >
            <View style={styles.statsIconLeft}>
              <View style={[styles.iconBackground, styles.ordersIcon]}>
                <Ionicons name="list" size={22} color="white" />
              </View>
            </View>
            <View style={styles.statsContent}>
              <Text style={styles.statsNumber}>{stats.totalOrders}</Text>
              <Text style={styles.statsLabel}>Orders</Text>
            </View>
            <View style={styles.statsIconRight}>
              <Ionicons name="chevron-forward" size={18} color="#007AFF" />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statsCard}
            onPress={() => navigateToTab('users')}
            activeOpacity={0.7}
          >
            <View style={styles.statsIconLeft}>
              <View style={[styles.iconBackground, styles.usersIcon]}>
                <Ionicons name="people" size={22} color="white" />
              </View>
            </View>
            <View style={styles.statsContent}>
              <Text style={styles.statsNumber}>{stats.totalUsers}</Text>
              <Text style={styles.statsLabel}>Users</Text>
            </View>
            <View style={styles.statsIconRight}>
              <Ionicons name="chevron-forward" size={18} color="#007AFF" />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statsCard}
            onPress={() => navigateToTab('products')}
            activeOpacity={0.7}
          >
            <View style={styles.statsIconLeft}>
              <View style={[styles.iconBackground, styles.productsIcon]}>
                <Ionicons name="cube" size={22} color="white" />
              </View>
            </View>
            <View style={styles.statsContent}>
              <Text style={styles.statsNumber}>{stats.totalProducts}</Text>
              <Text style={styles.statsLabel}>Products</Text>
            </View>
            <View style={styles.statsIconRight}>
              <Ionicons name="chevron-forward" size={18} color="#007AFF" />
            </View>
          </TouchableOpacity>
          
          <View style={styles.statsCard}>
            <View style={styles.statsIconLeft}>
              <View style={[styles.iconBackground, styles.revenueIcon]}>
                <Ionicons name="cash" size={22} color="white" />
              </View>
            </View>
            <View style={styles.statsContent}>
              <Text style={styles.statsNumber}>${stats.revenue}</Text>
              <Text style={styles.statsLabel}>Revenue</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionDivider}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
        </View>

        <View style={styles.quickGrid}>
          <TouchableOpacity 
            style={styles.quickCard}
            onPress={() => navigateToTab('profile')}
            activeOpacity={0.7}
          >
            <Ionicons name="person" size={24} color="#007AFF" />
            <Text style={styles.quickLabel}>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickCard}
            onPress={() => router.push('/(admin)/new-product')}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={24} color="#4CAF50" />
            <Text style={styles.quickLabel}>Add Product</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsIconLeft: {
    marginRight: 12,
  },
  iconBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ordersIcon: {
    backgroundColor: '#FF9800',
  },
  usersIcon: {
    backgroundColor: '#2196F3',
  },
  productsIcon: {
    backgroundColor: '#673AB7',
  },
  revenueIcon: {
    backgroundColor: '#4CAF50',
  },
  statsContent: {
    flex: 1,
  },
  statsNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 14,
    color: '#666',
  },
  statsIconRight: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionDivider: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  quickGrid: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  quickCard: {
    width: 100,
    height: 100,
    backgroundColor: 'white',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickLabel: {
    marginTop: 8,
    fontSize: 14,
    color: '#333',
  },
}); 