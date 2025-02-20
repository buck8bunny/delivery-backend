// app/auth.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    setLoading(true);
    setMessage(null);
    setSuccess(false);

    const url = isLogin
      ? 'http://localhost:3000/users/sign_in'
      : 'http://localhost:3000/users';

    const data = new URLSearchParams();
    data.append('user[email]', email);
    data.append('user[password]', password);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: data.toString(),
      });

      const result = await response.json();
      setLoading(false);

      if (response.ok) {
        if (isLogin) {
          await AsyncStorage.setItem('token', result.token);
          router.push('/home');
        } else {
          setSuccess(true);
          setMessage('Registration successful!');
          setTimeout(() => {
            setSuccess(false);
            setIsLogin(true);
          }, 2000);
        }
      } else {
        setMessage(result.message || 'An error occurred.');
      }
    } catch (error) {
      setLoading(false);
      setMessage('Network error, please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Login' : 'Register'}</Text>

      {message && <Text style={[styles.message, success ? styles.success : styles.error]}>{message}</Text>}

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

      <TouchableOpacity
        style={[styles.button, success ? styles.successButton : {}]}
        onPress={handleSubmit}
        disabled={loading || success}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>
            {success ? 'Registered!' : isLogin ? 'Login' : 'Register'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.switchText}>
          {isLogin ? 'Switch to Register' : 'Switch to Login'}
        </Text>
      </TouchableOpacity>
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
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  successButton: {
    backgroundColor: 'green',
  },
  switchText: {
    color: '#007BFF',
    marginTop: 10,
  },
  message: {
    fontSize: 14,
    marginBottom: 10,
  },
  success: {
    color: 'green',
  },
  error: {
    color: 'red',
  },
});

export default AuthScreen;
