// app/auth.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter(); // Для навигации

  const handleSubmit = async () => {
    const url = isLogin
      ? 'http://localhost:3000/users/sign_in'  // API для логина
      : 'http://localhost:3000/users';         // API для регистрации

    const data = new URLSearchParams();
    data.append('user[email]', email);
    data.append('user[password]', password);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: data.toString(),
      });

      const result = await response.json();

      if (response.ok) {
        const token = result.token;
        await AsyncStorage.setItem('token', token);  // Сохраняем токен
        router.push('/home');  // Переходим на главную страницу
      } else {
        alert(result.message || 'Something went wrong');
      }
    } catch (error) {
      console.error(error);
      alert('Something went wrong, please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Login' : 'Register'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button title={isLogin ? 'Login' : 'Register'} onPress={handleSubmit} />

      <Button
        title={isLogin ? 'Switch to Register' : 'Switch to Login'}
        onPress={() => setIsLogin(!isLogin)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 5,
  },
});

export default AuthScreen;
