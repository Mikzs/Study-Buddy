import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
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

export default function ProfileIntroScreen() {
  const router = useRouter();

  const [name, setName]       = useState('');
  const [birthday, setBirthday] = useState('');
  const [date, setDate]       = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [gender, setGender]   = useState('');

  const [errors, setErrors] = useState({ name: '', birthday: '', gender: '' });

  const onDateChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') setShowPicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      const yyyy = selectedDate.getFullYear();
      setBirthday(`${mm}/${dd}/${yyyy}`);
      setErrors((p) => ({ ...p, birthday: '' }));
    }
  };

  const handleNameChange = (text: string) => {
    if (/^[A-Za-z\s]*$/.test(text) || text === '') {
      setName(text);
      setErrors((p) => ({ ...p, name: '' }));
    }
  };

  const validate = () => {
    const e = { name: '', birthday: '', gender: '' };
    let valid = true;
    if (!name.trim())          { e.name = 'Name is required'; valid = false; }
    else if (name.trim().length < 2) { e.name = 'Name must be at least 2 characters'; valid = false; }
    if (!birthday)             { e.birthday = 'Birthday is required'; valid = false; }
    if (!gender)               { e.gender = 'Please select a gender'; valid = false; }
    setErrors(e);
    return valid;
  };

  return (
    <SafeAreaView style={s.screen}>
      <ProgressHeader step={2} totalSteps={5} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[s.container, { paddingBottom: 48 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={T.heading}>Introduction</Text>
          <Text style={T.subheading}>
            Accurate information ensures you get personalized content and services.
          </Text>

          {/* Name */}
          <Text style={T.label}>Name</Text>
          <View style={[s.inputWrapper, errors.name ? s.inputWrapperError : {}]}>
            <TextInput
              style={s.inputField}
              value={name}
              onChangeText={handleNameChange}
              placeholder="Your full name"
              placeholderTextColor="#BBCCE0"
            />
          </View>
          {errors.name ? <Text style={[T.error, { marginTop: -10 }]}>{errors.name}</Text> : null}

          {/* Birthday */}
          <Text style={T.label}>Birthday</Text>
          <TouchableOpacity
            style={[s.dropdown, errors.birthday ? s.dropdownError : {}]}
            onPress={() => setShowPicker(true)}
            activeOpacity={0.8}
          >
            <Text style={birthday ? s.dropdownTextSelected : s.dropdownText}>
              {birthday || 'MM/DD/YYYY'}
            </Text>
            <Text style={[s.dropdownArrow, { fontSize: 18, marginTop: 2 }]}>⌄</Text>
          </TouchableOpacity>
          {errors.birthday ? <Text style={T.error}>{errors.birthday}</Text> : null}

          {showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}

          {/* Gender */}
          <Text style={[T.label, { marginTop: 4 }]}>Gender</Text>
          <View style={is.genderRow}>
            {['Male', 'Female'].map((g) => (
              <TouchableOpacity
                key={g}
                style={[is.genderBtn, gender === g ? is.genderActive : is.genderInactive]}
                onPress={() => { setGender(g); setErrors((p) => ({ ...p, gender: '' })); }}
                activeOpacity={0.8}
              >
                <Text style={[is.genderText, gender === g ? is.genderTextActive : is.genderTextInactive]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.gender ? <Text style={T.error}>{errors.gender}</Text> : null}

          <View style={{ marginTop: 20 }}>
            <PrimaryButton
              label="Next"
              onPress={() => { if (validate()) router.push('/(profile)/profile-academic'); }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const is = StyleSheet.create({
  genderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  genderBtn: {
    flex: 1,
    height: 52,           // matches input height
    borderRadius: 12,     // matches input radius
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  genderActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  genderInactive: {
    backgroundColor: C.white,
    borderColor: C.border,
  },
  genderText: {
    fontSize: 15,
    fontWeight: '600',
  },
  genderTextActive: {
    color: C.white,
  },
  genderTextInactive: {
    color: C.muted,
  },
});