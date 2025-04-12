import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');

  const fetchUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUserDetail = async (userId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }

      const data = await response.json();
      setSelectedUser(data);
      setShowUserDetail(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      Alert.alert('Error', 'Failed to load user details. Please try again.');
    }
  };

  const updateUserRole = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token || !editingUser) return;

      const response = await fetch(`${API_URL}/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          user: {
            name: editName,
            role: editRole
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }

      // Success - update the user in the list
      const updatedUser = await response.json();
      setUsers(users.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      ));

      // Close the edit modal
      setEditingUser(null);
      
      // If the detailed user view is open and it's the same user, update that too
      if (selectedUser && selectedUser.id === updatedUser.id) {
        setSelectedUser({...selectedUser, ...updatedUser});
      }

      Alert.alert('Success', 'User information updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', error.message || 'Failed to update user. Please try again.');
    }
  };

  const deleteUser = async (userId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      // Remove user from the list
      setUsers(users.filter(user => user.id !== userId));
      
      // If the detailed user view is open and it's the same user, close it
      if (selectedUser && selectedUser.id === userId) {
        setShowUserDetail(false);
        setSelectedUser(null);
      }

      Alert.alert('Success', 'User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      Alert.alert('Error', error.message || 'Failed to delete user. Please try again.');
    }
  };

  const confirmDeleteUser = (user) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete user ${user.name || user.email}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteUser(user.id)
        }
      ]
    );
  };

  // Load users when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  // Refresh users when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUsers();
    }, [])
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, []);

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditRole(user.role || 'user');
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getRoleBadgeStyle = (role) => {
    return role === 'admin' 
      ? styles.adminBadge
      : styles.userBadge;
  };

  const getRoleTextStyle = (role) => {
    return role === 'admin'
      ? styles.adminText
      : styles.userText;
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userCard}
      onPress={() => fetchUserDetail(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.userHeader}>
        <View style={styles.userAvatar}>
          <Text style={styles.avatarText}>
            {item.name?.charAt(0)?.toUpperCase() || item.email?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name || 'Unnamed User'}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <View style={[styles.roleBadge, getRoleBadgeStyle(item.role)]}>
          <Text style={[styles.roleText, getRoleTextStyle(item.role)]}>
            {item.role}
          </Text>
        </View>
      </View>
      
      <View style={styles.userDetail}>
        <View style={styles.userStat}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.userStatText}>
            Joined: {formatDate(item.created_at)}
          </Text>
        </View>
        <View style={styles.userStat}>
          <Ionicons name="cart-outline" size={16} color="#666" />
          <Text style={styles.userStatText}>
            Orders: {item.orders_count || 0}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
      <View style={styles.container}>
        <Text style={styles.title}>User Management</Text>
        
        {users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderUserItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.usersList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#007AFF"
              />
            }
          />
        )}

        {/* User Detail Modal */}
        <Modal
          visible={showUserDetail}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowUserDetail(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>User Details</Text>
                <TouchableOpacity 
                  onPress={() => setShowUserDetail(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {selectedUser && (
                <ScrollView style={styles.modalContent}>
                  <View style={styles.userDetailHeader}>
                    <View style={[styles.userAvatar, styles.userAvatarLarge]}>
                      <Text style={[styles.avatarText, styles.avatarTextLarge]}>
                        {selectedUser.name?.charAt(0)?.toUpperCase() || 
                         selectedUser.email?.charAt(0)?.toUpperCase() || '?'}
                      </Text>
                    </View>
                    <Text style={styles.userDetailName}>{selectedUser.name || 'Unnamed User'}</Text>
                    <Text style={styles.userDetailEmail}>{selectedUser.email}</Text>
                    <View style={[styles.roleBadge, getRoleBadgeStyle(selectedUser.role)]}>
                      <Text style={[styles.roleText, getRoleTextStyle(selectedUser.role)]}>
                        {selectedUser.role}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Account Information</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>ID:</Text>
                      <Text style={styles.detailValue}>{selectedUser.id}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Joined:</Text>
                      <Text style={styles.detailValue}>{formatDate(selectedUser.created_at)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Last Updated:</Text>
                      <Text style={styles.detailValue}>{formatDate(selectedUser.updated_at)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Orders:</Text>
                      <Text style={styles.detailValue}>{selectedUser.orders_count || 0}</Text>
                    </View>
                  </View>

                  {selectedUser.orders && selectedUser.orders.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Recent Orders</Text>
                      {selectedUser.orders.map(order => (
                        <View key={order.id} style={styles.orderItem}>
                          <View style={styles.orderHeader}>
                            <Text style={styles.orderTitle}>Order #{order.id}</Text>
                            <Text style={[
                              styles.orderStatus, 
                              order.status === 'completed' ? styles.statusCompleted :
                              order.status === 'pending' ? styles.statusPending :
                              styles.statusFailed
                            ]}>
                              {order.status}
                            </Text>
                          </View>
                          <View style={styles.orderDetails}>
                            <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                            <Text style={styles.orderTotal}>${parseFloat(order.total).toFixed(2)}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={styles.editButton}
                      onPress={() => {
                        setShowUserDetail(false);
                        openEditModal(selectedUser);
                      }}
                    >
                      <Ionicons name="create-outline" size={18} color="white" />
                      <Text style={styles.buttonText}>Edit User</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => {
                        setShowUserDetail(false);
                        confirmDeleteUser(selectedUser);
                      }}
                    >
                      <Ionicons name="trash-outline" size={18} color="white" />
                      <Text style={styles.buttonText}>Delete User</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Edit User Modal */}
        <Modal
          visible={!!editingUser}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setEditingUser(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit User</Text>
                <TouchableOpacity 
                  onPress={() => setEditingUser(null)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalContent}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter user name"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Role</Text>
                  <View style={styles.roleSelector}>
                    <TouchableOpacity
                      style={[
                        styles.roleOption,
                        editRole === 'user' && styles.roleOptionSelected
                      ]}
                      onPress={() => setEditRole('user')}
                    >
                      <Ionicons 
                        name={editRole === 'user' ? "checkbox" : "square-outline"}
                        size={22} 
                        color={editRole === 'user' ? "#007AFF" : "#666"} 
                      />
                      <Text style={[
                        styles.roleOptionText,
                        editRole === 'user' && styles.roleOptionTextSelected
                      ]}>
                        User
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.roleOption,
                        editRole === 'admin' && styles.roleOptionSelected
                      ]}
                      onPress={() => setEditRole('admin')}
                    >
                      <Ionicons 
                        name={editRole === 'admin' ? "checkbox" : "square-outline"}
                        size={22} 
                        color={editRole === 'admin' ? "#007AFF" : "#666"} 
                      />
                      <Text style={[
                        styles.roleOptionText,
                        editRole === 'admin' && styles.roleOptionTextSelected
                      ]}>
                        Administrator
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formActions}>
                  <TouchableOpacity 
                    style={styles.cancelFormButton}
                    onPress={() => setEditingUser(null)}
                  >
                    <Text style={styles.cancelFormButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.saveFormButton}
                    onPress={updateUserRole}
                  >
                    <Text style={styles.saveFormButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </View>
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
    marginBottom: 20,
  },
  usersList: {
    paddingBottom: 24,
  },
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadge: {
    backgroundColor: '#E3F2FD',
  },
  userBadge: {
    backgroundColor: '#F5F5F5',
  },
  roleText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  adminText: {
    color: '#0D47A1',
  },
  userText: {
    color: '#757575',
  },
  userDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userStatText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 16,
  },
  userDetailHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  userAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 0,
    marginBottom: 12,
  },
  avatarTextLarge: {
    fontSize: 30,
  },
  userDetailName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userDetailEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  detailSection: {
    marginBottom: 20,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
  },
  detailSectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 15,
    color: '#666',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  orderItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  orderStatus: {
    fontSize: 13,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusCompleted: {
    backgroundColor: '#E8F5E9',
    color: '#388E3C',
  },
  statusPending: {
    backgroundColor: '#FFF8E1',
    color: '#FFA000',
  },
  statusFailed: {
    backgroundColor: '#FFEBEE',
    color: '#D32F2F',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderDate: {
    fontSize: 13,
    color: '#666',
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  roleSelector: {
    marginTop: 8,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  roleOptionSelected: {
    backgroundColor: '#E3F2FD',
  },
  roleOptionText: {
    fontSize: 16,
    marginLeft: 8,
    color: '#666',
  },
  roleOptionTextSelected: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelFormButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelFormButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  saveFormButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  saveFormButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
}); 