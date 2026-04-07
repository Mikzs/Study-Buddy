import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { C, PrimaryButton, ProgressHeader, s, T } from '../../components/AuthShared';

const COURSES = ['BSIT', 'BSCS', 'BSCE', 'BSA', 'BSBA', 'BEED', 'BSED'];
const YEARS   = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

function DropdownPicker({
  label, value, options, onSelect, error,
}: {
  label: string; value: string; options: string[];
  onSelect: (v: string) => void; error?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={T.label}>{label}</Text>
      <TouchableOpacity
        style={[s.dropdown, error ? s.dropdownError : {}]}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={value ? s.dropdownTextSelected : s.dropdownText}>
          {value || `Select ${label}`}
        </Text>
        <Text style={s.dropdownArrow}>›</Text>
      </TouchableOpacity>
      {error ? <Text style={T.error}>{error}</Text> : null}

      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity style={s.overlay} onPress={() => setVisible(false)} activeOpacity={1}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>{label}</Text>
            <ScrollView>
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={s.option}
                  onPress={() => { onSelect(opt); setVisible(false); }}
                >
                  <Text style={[s.optionText, value === opt && s.optionTextSelected]}>
                    {opt}
                  </Text>
                  {value === opt && <Text style={{ color: C.primaryMid, fontSize: 16 }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export default function ProfileBasicScreen() {
  const router = useRouter();

  const [studentId, setStudentId]               = useState('');
  const [course, setCourse]                     = useState('');
  const [year, setYear]                         = useState('');
  const [address, setAddress]                   = useState('');
  const [brgy, setBrgy]                         = useState('');
  const [city, setCity]                         = useState('');
  const [showLocationFields, setShowLocationFields] = useState(false);
  const [loadingLocation, setLoadingLocation]   = useState(false);
  const [errors, setErrors] = useState({ studentId: '', course: '', year: '', location: '' });

  const handleStudentIdChange = (text: string) => {
    const filtered = text.replace(/[^0-9-]/g, '');
    setStudentId(filtered);
    setErrors({ ...errors, studentId: '' });
  };

  const locationDisplay = [address, brgy, city].filter(Boolean).join(', ');

  const detectLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to auto-detect your location.');
        setLoadingLocation(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const geo = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (geo.length > 0) {
        const place = geo[0];
        setAddress(place.street || place.name || '');
        setBrgy(place.district || place.subregion || '');
        setCity(place.city || place.region || '');
        setErrors({ ...errors, location: '' });
      }
      setShowLocationFields(true);
    } catch {
      Alert.alert('Error', 'Could not get location. Please enter manually.');
      setShowLocationFields(true);
    }
    setLoadingLocation(false);
  };

  const validate = () => {
    const e = { studentId: '', course: '', year: '', location: '' };
    let valid = true;
    if (!studentId.trim()) { e.studentId = 'Student ID is required'; valid = false; }
    else if (!/^\d{2}-\d{4}$/.test(studentId.trim())) { e.studentId = 'Invalid format. Example: 23-2498'; valid = false; }
    if (!course) { e.course = 'Please select a course'; valid = false; }
    if (!year)   { e.year = 'Please select a year level'; valid = false; }
    if (!brgy.trim() || !city.trim()) { e.location = 'Please enter your Barangay and City'; valid = false; }
    setErrors(e);
    return valid;
  };

  return (
    <SafeAreaView style={s.screen}>
      <ProgressHeader step={1} totalSteps={5} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[s.container, { paddingBottom: 48 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={T.heading}>Basic Info</Text>
          <Text style={T.subheading}>
            Accurate information ensures you get personalized content and services.
          </Text>

          {/* Student ID */}
          <Text style={T.label}>Student ID</Text>
          <View style={[s.inputWrapper, errors.studentId ? s.inputWrapperError : {}]}>
            <TextInput
              style={s.inputField}
              value={studentId}
              onChangeText={handleStudentIdChange}
              keyboardType="numeric"
              placeholder="e.g. 23-2498"
              placeholderTextColor="#BBCCE0"
              maxLength={7}
            />
          </View>
          {errors.studentId ? <Text style={[T.error, { marginTop: -10 }]}>{errors.studentId}</Text> : null}

          <DropdownPicker
            label="Course / Program"
            value={course}
            options={COURSES}
            onSelect={(v) => { setCourse(v); setErrors({ ...errors, course: '' }); }}
            error={errors.course}
          />

          <DropdownPicker
            label="Year Level"
            value={year}
            options={YEARS}
            onSelect={(v) => { setYear(v); setErrors({ ...errors, year: '' }); }}
            error={errors.year}
          />

          {/* Location */}
          <Text style={[T.label, { marginTop: 4 }]}>Location</Text>
          <View style={[ls.locationRow, errors.location ? { borderColor: C.red } : {}]}>
            <TouchableOpacity
              style={ls.locationLeft}
              onPress={() => { setShowLocationFields(!showLocationFields); setErrors({ ...errors, location: '' }); }}
            >
              <Ionicons name="location-outline" size={16} color={C.muted} style={{ marginRight: 8 }} />
              <Text
                style={[s.inputField, { color: locationDisplay ? C.text : '#BBCCE0' }]}
                numberOfLines={1}
              >
                {locationDisplay || 'Tap to enter location'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={ls.detectBtn} onPress={detectLocation} disabled={loadingLocation}>
              {loadingLocation
                ? <ActivityIndicator size="small" color={C.white} />
                : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="navigate-outline" size={12} color={C.white} />
                    <Text style={ls.detectText}>Detect</Text>
                  </View>
                )
              }
            </TouchableOpacity>
          </View>
          {errors.location ? <Text style={T.error}>{errors.location}</Text> : null}

          {showLocationFields && (
            <View style={ls.locationBox}>
              <Text style={T.label}>Address / Street</Text>
              <View style={s.inputWrapper}>
                <TextInput style={s.inputField} value={address} onChangeText={setAddress}
                  placeholder="e.g. 123 Mabini St." placeholderTextColor="#BBCCE0" />
              </View>

              <Text style={T.label}>Barangay</Text>
              <View style={s.inputWrapper}>
                <TextInput style={s.inputField} value={brgy}
                  onChangeText={(t) => { setBrgy(t); setErrors({ ...errors, location: '' }); }}
                  placeholder="e.g. Tandang Sora" placeholderTextColor="#BBCCE0" />
              </View>

              <Text style={T.label}>City / Municipality</Text>
              <View style={[s.inputWrapper, { marginBottom: 0 }]}>
                <TextInput style={s.inputField} value={city}
                  onChangeText={(t) => { setCity(t); setErrors({ ...errors, location: '' }); }}
                  placeholder="e.g. Quezon City" placeholderTextColor="#BBCCE0" />
              </View>
            </View>
          )}

          <View style={{ marginTop: 20 }}>
            <PrimaryButton
              label="Next"
              onPress={() => { if (validate()) router.push('/(profile)/profile-intro'); }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const ls = StyleSheet.create({
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: C.white,
    marginBottom: 6,
  },
  locationLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detectBtn: {
    backgroundColor: C.primaryMid,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  detectText: {
    color: C.white,
    fontSize: 12,
    fontWeight: '600',
  },
  locationBox: {
    backgroundColor: '#F0F6FC',
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: C.border,
  },
});