import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Platform 
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useUser } from "../context/UserContext";
import { Ionicons } from "@expo/vector-icons";
import AddToCartButton from "../components/AddToCartButton";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const HomeScreen = () => {
  const router = useRouter();
  const { userName, updateUserName } = useUser();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserName = async () => {
      const storedUserName = await AsyncStorage.getItem("userName");

      if (storedUserName) {
        updateUserName(storedUserName);
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
              updateUserName(name);
              await AsyncStorage.setItem("userName", name);
            }
          } catch (error) {
            console.error("Ошибка при получении имени пользователя:", error);
          }
        }
      }
    };

    Promise.all([
      fetchUserName(),
      fetch(`${API_URL}/products`).then(res => res.json())
    ])
      .then(([_, productsData]) => {
        setProducts(productsData);
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const handlePress = (id) => {
    router.push(`/product/${id}`);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => handlePress(item.id)}
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: item.image_url }} 
        style={styles.productImage}
        defaultSource={require("../../assets/placeholder.png")}
      />
      <View style={styles.productInfo}>
        <View style={styles.productTexts}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.productPrice}>${item.price}</Text>
          <View style={styles.addButtonContainer}>
            <AddToCartButton productId={item.id} mini />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Добро пожаловать,</Text>
          <Text style={styles.userName}>{userName}!</Text>
        </View>
        <TouchableOpacity style={styles.cartButton} onPress={() => router.push("/cart")}>
          <Ionicons name="cart-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.productList}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 17,
    color: "#666",
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
  },
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  productList: {
    padding: 8,
    paddingBottom: 24,
  },
  row: {
    justifyContent: "space-between",
  },
  productCard: {
    flex: 1,
    margin: 8,
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    maxWidth: '47%',
  },
  productImage: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  productInfo: {
    padding: 12,
    flex: 1,
    justifyContent: "space-between",
    minHeight: 140,
  },
  productTexts: {
    flex: 1,
    marginBottom: 8,
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
    color: "#000",
    minHeight: 36,
  },
  productDescription: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
    minHeight: 32,
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 'auto',
  },
  productPrice: {
    fontSize: 17,
    fontWeight: "600",
    color: "#007AFF",
  },
  addButtonContainer: {
    width: 40,
  },
});

export default HomeScreen;
