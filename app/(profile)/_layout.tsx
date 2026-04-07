import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="profile-basic" />
      <Stack.Screen name="profile-intro" />
      <Stack.Screen name="profile-academic" />
      <Stack.Screen name="profile-availability" />
      <Stack.Screen name="profile-picture" />
    </Stack>
  );
}