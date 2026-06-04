import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="check-in"
        options={{
          title: 'DAILY RITUAL',
          headerStyle: { backgroundColor: '#030315' },
          headerTintColor: '#C9A84C',
          headerShadowVisible: false,
          headerTitleStyle: { fontSize: 12, fontWeight: '700' },
        }}
      />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen
        name="letter"
        options={{
          title: '',
          headerStyle: { backgroundColor: '#030315' },
          headerTintColor: '#C9A84C',
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
