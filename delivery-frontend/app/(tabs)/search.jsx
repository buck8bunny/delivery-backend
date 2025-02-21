import React, { useState, useEffect } from "react";
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router"; // Для перехода на другую страницу

const SearchScreen = () => {
  const router = useRouter();
  const [products, setProducts] = useState([]); // Все товары
  const [searchText, setSearchText] = useState(""); // Текст поиска
  const [filteredProducts, setFilteredProducts] = useState([]); // Отфильтрованные товары

  // Загружаем товары при первом рендере
  useEffect(() => {
    fetch("http://localhost:3000/products") // Заменить на твой API
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setFilteredProducts(data); // Изначально показываем все товары
      })
      .catch((err) => console.error(err));
  }, []);

  // Обрабатываем текст поиска
  const handleSearch = (text) => {
    setSearchText(text);
    // Фильтруем товары по названию и описанию
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(text.toLowerCase()) ||
        product.description.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  // Обрабатываем нажатие на карточку товара
  const handlePress = (id) => {
    router.push(`/product/${id}`); // Переход на страницу продукта
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Поиск товара</Text>
      {/* Поле для ввода текста */}
      <TextInput
        style={styles.searchInput}
        placeholder="Введите название или описание товара"
        value={searchText}
        onChangeText={handleSearch} // Вызываем фильтрацию при изменении текста
      />

      {/* Если товары не найдены */}
      {filteredProducts.length === 0 ? (
        <Text style={styles.noResults}>Товары не найдены</Text>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.product} onPress={() => handlePress(item.id)}>
              <Image source={{ uri: item.image_url }} style={styles.image} />
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>{item.price} $</Text>
              <Text style={styles.productDescription}>{item.description}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  searchInput: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 16,
  },
  noResults: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
    marginTop: 20,
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
  productDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 10,
  },
});

export default SearchScreen;
