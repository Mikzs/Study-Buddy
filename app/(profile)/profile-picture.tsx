import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Animated,
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { C, PrimaryButton, ProgressHeader, s, T } from '../../components/AuthShared';

const INITIAL = 'N';

// ─── Success Toast ────────────────────────────────────────────────────────────
function SuccessToast({ visible }: { visible: boolean }) {
  const translateY = useRef(new Animated.Value(120)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 180,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 120,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Animated.View
      style={[ts.toast, { transform: [{ translateY }], opacity }]}
      pointerEvents="none"
    >
      <View style={{ flex: 1 }}>
        <Text style={ts.title}>Your account has been created successfully !</Text>
      </View>
    </Animated.View>
  );
}

const ts = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E8EDF5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 8,
  },
  icon:  { fontSize: 24 },
  title: { fontSize: 14, fontWeight: '700', color: '#111111', marginBottom: 2 },
  sub:   { fontSize: 12, color: '#666666', lineHeight: 17 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ProfilePictureScreen() {
  const router = useRouter();
  const [photo, setPhoto]         = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const openGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to your camera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const handlePickImage = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take Photo', 'Choose from Library'], cancelButtonIndex: 0 },
        (index) => {
          if (index === 1) openCamera();
          else if (index === 2) openGallery();
        }
      );
    } else {
      Alert.alert('Add Photo', 'Choose an option', [
        { text: 'Take Photo', onPress: openCamera },
        { text: 'Choose from Library', onPress: openGallery },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleStartMatching = () => {
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setTimeout(() => router.replace('/(main)/home'), 300);
    }, 2200);
  };

  return (
    <SafeAreaView style={s.screen}>
      <ProgressHeader step={5} totalSteps={5} />

      <View style={ps.content}>
        <Text style={T.heading}>Add a Profile Picture</Text>
        <Text style={T.subheading}>
          Last step! A real photo helps others get to know you better.
        </Text>

        <View style={ps.avatarWrapper}>
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.85}>
            {photo ? (
              <Image source={{ uri: photo }} style={ps.avatar} />
            ) : (
              <View style={ps.avatar}>
                <Text style={ps.avatarInitial}>{INITIAL}</Text>
              </View>
            )}
            <View style={ps.badge}>
              <Text style={ps.badgePlus}>+</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={ps.hint}>Tap the circle to add a photo</Text>
      </View>

      <View style={ps.footer}>
        <PrimaryButton label="Start Matching" onPress={handleStartMatching} />
      </View>

      <SuccessToast visible={showToast} />
    </SafeAreaView>
  );
}

const ps = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: 'flex-start',
  },
  avatarWrapper: {
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: C.primaryMid,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarInitial: {
    fontSize: 54,
    color: C.white,
    fontWeight: '700',
    includeFontPadding: false,
  },
  badge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: C.bg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  badgePlus: {
    color: C.white,
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 20,
    includeFontPadding: false,
  },
  hint: {
    alignSelf: 'center',
    marginTop: 14,
    fontSize: 12,
    color: C.subtle,
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 12,
    backgroundColor: C.bg,
  },
});