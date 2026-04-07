import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verification" />
      <Stack.Screen name="new-password" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(profile)" />
      <Stack.Screen name="(main)" />
    </Stack>
  );
}