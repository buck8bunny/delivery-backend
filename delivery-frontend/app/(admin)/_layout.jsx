import { Tabs, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="new-product"
        options={{
          presentation: 'modal',
          headerShown: false
        }}
      />
      <Stack.Screen
        name="edit-product/[id]"
        options={{
          presentation: 'modal',
          headerShown: false
        }}
      />
    </Stack>
  );
}
