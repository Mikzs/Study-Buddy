import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey:            'AIzaSyBBDZje4mqVv70VRCU6YIZNX_IMrnGPpLI',
  authDomain:        'study-buddy-2ea7e.firebaseapp.com',
  projectId:         'study-buddy-2ea7e',
  storageBucket:     'study-buddy-2ea7e.firebasestorage.app',
  messagingSenderId: '273078573240',
  appId:             '1:273078573240:web:b87319546e96c0f26cbc4d',
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const functions = getFunctions(app);

if (__DEV__) {
  connectFunctionsEmulator(functions, '192.168.100.29', 5001);
  connectAuthEmulator(auth, 'http://192.168.100.29:9099');
}