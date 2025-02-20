import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, Button } from "react-native";
import { router } from "expo-router";

export default function ProfileScreen() {
     const handleLogout = async () => {
        await AsyncStorage.removeItem("token");
        router.push("/auth");
      };

  return (
    <View>
      <Text>Profile</Text>
         <Button title="Выйти" onPress={handleLogout} />
    </View>
  );
}