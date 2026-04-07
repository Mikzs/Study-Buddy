import { Tabs } from 'expo-router';
import { Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../../components/AuthShared';

export default function MainLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.blue,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 6,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#eee',
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen name="messages" options={{ title: 'Messages', tabBarIcon: ({ color }) => (
        <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1041/1041916.png' }} style={[styles.icon, { tintColor: color }]} />
      )}} />
      <Tabs.Screen name="home" options={{ title: 'Connect', tabBarIcon: ({ color }) => (
        <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/681/681494.png' }} style={[styles.icon, { tintColor: color }]} />
      )}} />
      <Tabs.Screen name="moments" options={{ title: 'Study Moments', tabBarIcon: ({ color }) => (
        <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2232/2232688.png' }} style={[styles.icon, { tintColor: color }]} />
      )}} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => (
        <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1077/1077063.png' }} style={[styles.icon, { tintColor: color }]} />
      )}} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: { width: 24, height: 24 },
});