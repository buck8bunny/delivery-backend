import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native';
import AuthScreen from './auth';

const App = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AuthScreen />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
};

export default App;
