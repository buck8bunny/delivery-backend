import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  Modal,
  ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import AddToCartButton from "../components/AddToCartButton";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const SearchScreen = () => {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products`);
      const data = await response.json();
      setProducts(data);
      setFilteredProducts(data);
    } catch (err) {
      console.error("Ошибка загрузки товаров:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchText(text);
    applyFilters(text, sortBy, selectedCategory);
  };

  const applyFilters = (search = searchText, sort = sortBy, category = selectedCategory) => {
    let filtered = [...products];

    // Поиск по тексту
    if (search) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(search.toLowerCase()) ||
          product.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Фильтрация по категории
    if (category !== 'all') {
      filtered = filtered.filter(product => product.category === category);
    }

    // Сортировка
    switch (sort) {
      case 'priceAsc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'priceDesc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'nameAsc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'nameDesc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
  };

  const handleFilterPress = () => {
    setShowFilterModal(true);
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    applyFilters(searchText, sort, selectedCategory);
    setShowFilterModal(false);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    applyFilters(searchText, sortBy, category);
    setShowFilterModal(false);
  };

  const getCategories = () => {
    return ['all', ...new Set(products.map(product => product.category))];
  };

  const handlePress = (id) => {
    router.push(`/product/${id}`);
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handlePress(item.id)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.image_url }}
        style={styles.productImage}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <View style={styles.bottomContainer}>
          <Text style={styles.productPrice}>${item.price}</Text>
          <AddToCartButton 
            productId={item.id} 
            mini={true} 
            stock={item.stock}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilterModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowFilterModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Фильтры</Text>
            <TouchableOpacity 
              onPress={() => setShowFilterModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.filterSectionTitle}>Сортировка</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity 
                style={[styles.filterOption, sortBy === 'default' && styles.filterOptionActive]}
                onPress={() => handleSortChange('default')}
              >
                <Text style={[styles.filterOptionText, sortBy === 'default' && styles.filterOptionTextActive]}>
                  По умолчанию
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterOption, sortBy === 'priceAsc' && styles.filterOptionActive]}
                onPress={() => handleSortChange('priceAsc')}
              >
                <Text style={[styles.filterOptionText, sortBy === 'priceAsc' && styles.filterOptionTextActive]}>
                  Цена (по возрастанию)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterOption, sortBy === 'priceDesc' && styles.filterOptionActive]}
                onPress={() => handleSortChange('priceDesc')}
              >
                <Text style={[styles.filterOptionText, sortBy === 'priceDesc' && styles.filterOptionTextActive]}>
                  Цена (по убыванию)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterOption, sortBy === 'nameAsc' && styles.filterOptionActive]}
                onPress={() => handleSortChange('nameAsc')}
              >
                <Text style={[styles.filterOptionText, sortBy === 'nameAsc' && styles.filterOptionTextActive]}>
                  Название (А-Я)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterOption, sortBy === 'nameDesc' && styles.filterOptionActive]}
                onPress={() => handleSortChange('nameDesc')}
              >
                <Text style={[styles.filterOptionText, sortBy === 'nameDesc' && styles.filterOptionTextActive]}>
                  Название (Я-А)
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSectionTitle}>Категории</Text>
            <View style={styles.filterOptions}>
              {getCategories().map((category) => (
                <TouchableOpacity 
                  key={category}
                  style={[styles.filterOption, selectedCategory === category && styles.filterOptionActive]}
                  onPress={() => handleCategoryChange(category)}
                >
                  <Text style={[styles.filterOptionText, selectedCategory === category && styles.filterOptionTextActive]}>
                    {category === 'all' ? 'Все категории' : category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Поиск</Text>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск товаров..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={handleSearch}
        />
        {searchText !== "" && (
          <TouchableOpacity 
            onPress={() => handleSearch("")}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          onPress={handleFilterPress}
          style={styles.filterButton}
        >
          <Ionicons name="filter" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {renderFilterModal()}

      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#CCC" />
          <Text style={styles.noResults}>
            {searchText === "" ? "Начните поиск" : "Товары не найдены"}
          </Text>
          <Text style={styles.noResultsSubtext}>
            {searchText === "" 
              ? "Введите название или описание товара"
              : "Попробуйте изменить параметры поиска"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.productList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    paddingTop: 60,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: "#000",
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  productList: {
    padding: 16,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  productImage: {
    width: 120,
    height: 120,
  },
  productInfo: {
    flex: 1,
    padding: 10,
    justifyContent: "space-between",
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  productPrice: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  noResults: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
  },
  filterButton: {
    padding: 4,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    flex: 1,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#666',
  },
  filterOptions: {
    marginBottom: 24,
  },
  filterOption: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F2F2F7',
  },
  filterOptionActive: {
    backgroundColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#000',
  },
  filterOptionTextActive: {
    color: '#FFF',
  },
});

export default SearchScreen;
