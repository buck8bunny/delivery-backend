import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen 
        name="home" 
        options={{ 
          title: "Главная",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="favorites" 
        options={{ 
          title: "Избранное",
          tabBarIcon: ({ color, size }) => <Ionicons name="heart" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="search" 
        options={{ 
          title: "Поиск",
          tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="cart" 
        options={{ 
          title: "Корзина",
          tabBarIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: "Профиль",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />
        }} 
      />
    </Tabs>
  );
}
