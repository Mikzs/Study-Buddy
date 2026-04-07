import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── Design Tokens ───────────────────────────────────────────────────────────
export const C = {
  primary:    '#1B3FAB',   // deep royal blue — single brand color
  primaryDark:'#0D2260',
  primaryMid: '#2563C7',
  accent:     '#4A90D9',
  bg:         '#EAF2FB',
  white:      '#FFFFFF',
  text:       '#2D3A5A',
  muted:      '#6B7A99',
  subtle:     '#8A98B4',
  border:     '#D4E0F0',
  borderLight:'#EEF2F8',
  inputBg:    '#F8FAFD',
  red:        '#E53E3E',
  darkBlue:   '#0D2260',
};

// ─── Typography Scale ─────────────────────────────────────────────────────────
export const T = StyleSheet.create({
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: C.primaryDark,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subheading: {
    fontSize: 13,
    color: C.muted,
    lineHeight: 20,
    marginBottom: 28,
  },
  label: {
    fontSize: 13,
    color: C.text,
    fontWeight: '600',
    marginBottom: 7,
  },
  error: {
    color: C.red,
    fontSize: 11,
    marginBottom: 8,
    marginLeft: 4,
  },
});

// ─── Shared Styles ────────────────────────────────────────────────────────────
export const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  // Standard text input wrapper
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: C.white,
    marginBottom: 16,
  },
  inputWrapperError: {
    borderColor: C.red,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    color: C.text,
    padding: 0,
  },
  inputPlaceholder: {
    fontSize: 15,
    color: '#BBCCE0',
  },
  // Dropdown trigger (same size as input)
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 52,
    paddingVertical: 10,
    backgroundColor: C.white,
    marginBottom: 4,
  },
  dropdownError: {
    borderColor: C.red,
  },
  dropdownText: {
    fontSize: 15,
    color: '#BBCCE0',
  },
  dropdownTextSelected: {
    fontSize: 15,
    color: C.text,
    fontWeight: '500',
  },
  dropdownArrow: {
    color: C.subtle,
    fontSize: 22,
    marginLeft: 8,
  },
  // Modal overlay & box
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,24,60,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.primaryDark,
    marginBottom: 14,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  optionText: {
    fontSize: 15,
    color: C.text,
  },
  optionTextSelected: {
    color: C.primaryMid,
    fontWeight: '700',
  },
  // Primary CTA button
  primaryBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

// ─── ProgressHeader ───────────────────────────────────────────────────────────
export function ProgressHeader({
  step,
  totalSteps,
}: {
  step: number;
  totalSteps: number;
}) {
  return (
    <View style={ph.wrapper}>
      <View style={ph.track}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            style={[
              ph.segment,
              i < step ? ph.segmentFilled : ph.segmentEmpty,
              i < totalSteps - 1 && { marginRight: 5 },
            ]}
          />
        ))}
      </View>
      <Text style={ph.stepText}>
        Step {step} of {totalSteps}
      </Text>
    </View>
  );
}

const ph = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 16,
    backgroundColor: C.bg,
  },
  track: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  segment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  segmentFilled: {
    backgroundColor: C.primary,
  },
  segmentEmpty: {
    backgroundColor: C.border,
  },
  stepText: {
    fontSize: 12,
    color: C.muted,
    fontWeight: '500',
  },
});

// ─── PrimaryButton ────────────────────────────────────────────────────────────
export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[s.primaryBtn, disabled && { opacity: 0.55 }]}
      onPress={onPress}
      activeOpacity={0.82}
      disabled={disabled}
    >
      <Text style={s.primaryBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}