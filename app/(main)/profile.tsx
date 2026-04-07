import { SafeAreaView, StyleSheet, Text } from 'react-native';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={s.screen}>
      <Text style={s.text}>Profile Coming Soon</Text>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F9FC' },
  text: { fontSize: 18, color: '#5F6368' },
});