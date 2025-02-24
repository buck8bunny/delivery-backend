import React, { useEffect } from "react";
import CheckoutScreen from "./screens/CheckoutScreen";// Импортируем компонент
import { StripeProvider } from '@stripe/stripe-react-native';
import { View, Text } from 'react-native';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("🔴 Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Что-то пошло не так!</Text>
          <Text>{this.state.error?.toString()}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function CheckoutPage() {
  console.log("🔄 Rendering CheckoutPage");
  
  return (
    <ErrorBoundary>
      <StripeProvider 
        publishableKey="pk_test_51Qu9QKKHwD7tNZiZSjDPbyg6qBXzTBa3AP2mJVsBpm3DT6jVLzVO1yuxFPBTfNjXYgzPK744b6h5Z9Gipu28XClh00fGcbfKLB"
       
      >
        <CheckoutScreen />
      </StripeProvider>
    </ErrorBoundary>
  );
}
