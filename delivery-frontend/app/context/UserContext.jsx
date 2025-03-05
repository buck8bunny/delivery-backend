import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";

// Явно указываем URL API
const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Создаем контекст
const UserContext = createContext();

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export default function UserProvider({ children }) {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Проверяем авторизацию при запуске
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('Initializing auth...');
      await checkUser();
    };
    initializeAuth();
  }, []);

  const checkUser = async () => {
    console.log('Checking user authentication...');
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      console.log('Stored token value:', token?.substring(0, 20) + '...');

      if (!token) {
        console.log('No token found, redirecting to login');
        await clearAuthData();
        router.push('/(auth)/login');
        return;
      }

      try {
        console.log('Validating token with server...');
        console.log('Request URL:', `${API_URL}/users/profile`);
        console.log('Request headers:', {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        });

        const response = await fetch(`${API_URL}/users/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        console.log('Server response status:', response.status);
        const data = await response.json();
        console.log('Server response:', data);

        if (response.ok) {
          console.log('Token is valid, user role:', data.role);
          setUser(data);
          setUserName(data.name || "");
          setEmail(data.email || "");
          
          if (data.name) {
            await AsyncStorage.setItem('userName', data.name);
          }

          // Перенаправляем пользователя в зависимости от роли
          const redirectPath = data.role === 'admin' ? '/(admin)/dashboard' : '/(tabs)/home';
          console.log('Redirecting to:', redirectPath);
          router.push(redirectPath);
        } else {
          console.log('Token is invalid, clearing auth data');
          await clearAuthData();
          router.push('/(auth)/login');
        }
      } catch (error) {
        console.error('Error validating token:', error);
        await clearAuthData();
        router.push('/(auth)/login');
      }
    } catch (error) {
      console.error('Error checking user:', error);
      await clearAuthData();
      router.push('/(auth)/login');
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuthData = async () => {
    console.log('Clearing auth data...');
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userName');
      setUser(null);
      setUserName("");
      setEmail("");
      console.log('Auth data cleared');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  const updateUserName = async (name) => {
    try {
      await AsyncStorage.setItem('userName', name);
      setUserName(name);
      if (user) {
        setUser({ ...user, name });
      }
    } catch (error) {
      console.error('Error updating user name:', error);
    }
  };

  const updateEmail = (newEmail) => {
    setEmail(newEmail);
    if (user) {
      setUser({ ...user, email: newEmail });
    }
  };

  const login = async (email, password) => {
    console.log('Attempting login...');
    try {
      const response = await fetch(`${API_URL}/users/sign_in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          user: { email, password }
        })
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (response.ok) {
        console.log('Login successful, saving data...');
        await AsyncStorage.setItem('token', data.token);
        setUser(data.user);
        setUserName(data.user.name || "");
        setEmail(data.user.email || "");
        
        if (data.user.name) {
          await AsyncStorage.setItem('userName', data.user.name);
        }

        const redirectPath = data.user.role === 'admin' ? '/(admin)/dashboard' : '/(tabs)/home';
        console.log('Redirecting to:', redirectPath);
        router.push(redirectPath);
        
        return { success: true };
      } else {
        console.log('Login failed:', data.error);
        return { 
          success: false, 
          error: data.error || 'Неверный email или пароль' 
        };
      }
    } catch (error) {
      console.error('Error during login:', error);
      return { 
        success: false, 
        error: 'Ошибка сети. Пожалуйста, попробуйте позже.' 
      };
    }
  };

  const logout = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/users/sign_out`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      await clearAuthData();
      router.push('/(auth)/login');
    }
  };

  const value = {
    user,
    userName,
    email,
    isLoading,
    updateUserName,
    updateEmail,
    login,
    logout,
    isAdmin: user?.role === 'admin',
    checkUser,
    setUser
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
} 
