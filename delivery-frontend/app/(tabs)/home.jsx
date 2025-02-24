import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useUser } from "../context/UserContext"; // Импортируем контекст
const API_URL = process.env.EXPO_PUBLIC_API_URL;


const HomeScreen = () => {
  const router = useRouter();
  const { userName, updateUserName } = useUser(); // Используем контекст для имени пользователя
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserName = async () => {
      const storedUserName = await AsyncStorage.getItem("userName");

      if (storedUserName) {
        updateUserName(storedUserName); // Обновляем имя через контекст
        setIsLoading(false);
      } else {
        const token = await AsyncStorage.getItem("token");

        if (token) {
          try {
            const response = await fetch(`${API_URL}/auth/validate`, {
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
            });

            const result = await response.json();

            if (result.valid && result.user) {
              const name = result.user.name || "";
              updateUserName(name); // Обновляем имя через контекст
              await AsyncStorage.setItem("userName", name);
              setIsLoading(false);
            }
          } catch (error) {
            console.error("Ошибка при получении имени пользователя:", error);
            setIsLoading(false);
          }
        }
      }
    };

    fetchUserName();

    fetch(`${API_URL}/products`)
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error(err));
  }, []);

  const handlePress = (id) => {
    router.push(`/product/${id}`);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.product} onPress={() => handlePress(item.id)}>
      <Image source={{ uri: item.image_url }} style={styles.image} />
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productPrice}>{item.price} $</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Загрузка...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Добро пожаловать, {userName}!</Text>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  product: {
    flex: 1,
    margin: 8,
    borderRadius: 10,
    backgroundColor: "#fff",
    elevation: 3,
    padding: 10,
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 150,
    borderRadius: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
  },
  productPrice: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },
  row: {
    flex: 1,
    justifyContent: "space-between",
    marginBottom: 16,
  },
});

export default HomeScreen;
