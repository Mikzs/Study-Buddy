import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { C, PrimaryButton, ProgressHeader, s, T } from '../../components/AuthShared';

const DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday',
  'Friday', 'Saturday', 'Sunday',
];

const TIMES = [
  'Morning (6AM-12PM)',
  'Afternoon (12PM-6PM)',
  'Evening (6PM-10PM)',
  'Late Night (10PM+)',
];

function DropdownPicker({
  label, value, options, onSelect, error,
}: {
  label: string; value: string; options: string[];
  onSelect: (v: string) => void; error?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={T.label}>{label}</Text>
      <TouchableOpacity
        style={[s.dropdown, error ? s.dropdownError : {}]}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={value ? s.dropdownTextSelected : s.dropdownText}>
          {value || 'Select'}
        </Text>
        <Text style={s.dropdownArrow}>›</Text>
      </TouchableOpacity>
      {error ? <Text style={T.error}>{error}</Text> : null}

      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPressOut={() => setVisible(false)}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>{label}</Text>
            <ScrollView>
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={s.option}
                  onPress={() => { onSelect(opt); setVisible(false); }}
                >
                  <Text style={[s.optionText, value === opt && s.optionTextSelected]}>{opt}</Text>
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

export default function ProfileAvailabilityScreen() {
  const router = useRouter();

  const [days, setDays] = useState('');
  const [time, setTime] = useState('');
  const [errors, setErrors] = useState<{ days: string; time: string }>({ days: '', time: '' });

  const validate = () => {
    const newErrors = { days: '', time: '' };
    let isValid = true;
    if (!days) { newErrors.days = 'Please select preferred study days';  isValid = false; }
    if (!time) { newErrors.time = 'Please select preferred study time';  isValid = false; }
    setErrors(newErrors);
    return isValid;
  };

  return (
    <SafeAreaView style={s.screen}>
      <ProgressHeader step={4} totalSteps={5} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[s.container, { paddingBottom: 48 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={T.heading}>Availability Schedule</Text>
          <Text style={T.subheading}>
            Accurate information ensures you get personalized content and services.
          </Text>

          <DropdownPicker
            label="Preferred Study Days"
            value={days}
            options={DAYS}
            onSelect={(v) => { setDays(v); setErrors((p) => ({ ...p, days: '' })); }}
            error={errors.days}
          />

          <DropdownPicker
            label="Preferred Study Time"
            value={time}
            options={TIMES}
            onSelect={(v) => { setTime(v); setErrors((p) => ({ ...p, time: '' })); }}
            error={errors.time}
          />

          <View style={{ marginTop: 4 }}>
            <PrimaryButton
              label="Next"
              onPress={() => { if (validate()) router.push('/(profile)/profile-picture'); }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}