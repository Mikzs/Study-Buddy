import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';

const MicrosoftIcon = () => (
  <View style={ic.msGrid}>
    <View style={ic.msRow}>
      <View style={[ic.msSquare, { backgroundColor: '#F25022' }]} />
      <View style={[ic.msSquare, { backgroundColor: '#7FBA00' }]} />
    </View>
    <View style={ic.msRow}>
      <View style={[ic.msSquare, { backgroundColor: '#00A4EF' }]} />
      <View style={[ic.msSquare, { backgroundColor: '#FFB900' }]} />
    </View>
  </View>
);

const GoogleIcon = () => (
  <Image
    source={require('../assets/images/google-icon.png')}
    style={{ width: 20, height: 20 }}
    resizeMode="contain"
  />
);

export default function LoginScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (provider: 'google' | 'microsoft') => {
    setIsLoading(true);
    
    try {
      // Simulate login delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log(`Logging in with ${provider}...`);
      
      // Navigate to onboarding after "successful login"
      router.replace('/onboarding');
      
    } catch (error: any) {
      console.error('Login Error:', error);
      Alert.alert('Login Failed', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={ls.screen}>
      <View style={ls.headerContainer}>
        <Image
          source={require('../assets/images/upper.png')}
          style={ls.headerImage}
          resizeMode="stretch"
        />
      </View>

      <View style={ls.shapesWrapper}>
        <View style={ls.shapesContainer}>
          <View style={[ls.shape, { width: 140, height: 135, backgroundColor: '#B1C9EF', top: 0, left: 10 }]} />
          <View style={[ls.shape, { width: 110, height: 105, backgroundColor: '#628ECB', top: 30, left: 170 }]} />
          <View style={[ls.shape, { width: 85, height: 80, backgroundColor: '#395886', top: 150, left: 230 }]} />
          <View style={[ls.shape, { width: 120, height: 115, backgroundColor: '#D5DEEF', top: 180, left: -20 }]} />
          <View style={[ls.shape, { width: 95, height: 90, backgroundColor: '#8AAEE0', top: 230, left: 110 }]} />
        </View>
      </View>

      <View style={ls.authContainer}>
        <TouchableOpacity
          style={[ls.authBtn, isLoading && { opacity: 0.5 }]}
          onPress={() => handleLogin('microsoft')}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#395886" />
          ) : (
            <>
              <MicrosoftIcon />
              <Text style={ls.authBtnText}>Sign in with Microsoft</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[ls.authBtn, isLoading && { opacity: 0.5 }]}
          onPress={() => handleLogin('google')}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#395886" />
          ) : (
            <>
              <GoogleIcon />
              <Text style={ls.authBtnText}>Sign in with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={ls.footerText}>
          Your first login creates your account, and in doing so you agree to our{' '}
          <Text style={ls.boldText}>Terms of Service</Text> and{' '}
          <Text style={ls.boldText}>Privacy Policy</Text>.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const ls = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E6F0FF' },
  headerContainer: { width: '100%', height: 180 },
  headerImage: { width: '100%', height: '100%' },
  shapesWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shapesContainer: {
    width: 320,
    height: 350,
    position: 'relative',
  },
  shape: {
    position: 'absolute',
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 15,
  },
  authContainer: { paddingHorizontal: 40, paddingBottom: 40, alignItems: 'center' },
  authBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: 60,
    borderRadius: 20,
    marginBottom: 15,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  authBtnText: { fontSize: 16, color: '#395886', fontWeight: '600' },
  footerText: { fontSize: 12, color: '#628ECB', textAlign: 'center', lineHeight: 18, marginTop: 10 },
  boldText: { fontWeight: 'bold', color: '#395886' },
});

const ic = StyleSheet.create({
  msGrid: { width: 18, height: 18, gap: 2 },
  msRow: { flexDirection: 'row', gap: 2, flex: 1 },
  msSquare: { flex: 1 },
});
