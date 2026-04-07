/**
 * MessagesScreen.tsx — Buddy Talk / Chat System
 * Fully refactored: real timestamps, polished UI, file/photo sending, exact header design.
 *
 * DEPENDENCIES:
 *   expo install expo-camera expo-clipboard expo-sharing expo-media-library expo-haptics
 *   expo install expo-document-picker expo-image-picker
 *   npm install react-native-qrcode-svg react-native-svg
 *   npm install react-native-safe-area-context
 */

import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import {
  ActionSheetIOS,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primary:      '#2563EB',
  primaryLight: '#3B82F6',
  primaryBg:    '#EFF6FF',
  primaryDark:  '#1D4ED8',
  bg:           '#F1F5F9',
  white:        '#FFFFFF',
  text:         '#0F172A',
  textSec:      '#475569',
  subtext:      '#94A3B8',
  muted:        '#CBD5E1',
  border:       '#E2E8F0',
  borderSoft:   '#F1F5F9',
  red:          '#EF4444',
  green:        '#22C55E',
  orange:       '#F59E0B',
  recvBubble:   '#F1F5F9',
  sentBubble:   '#2563EB',
  shadow:       '#0F172A',
  online:       '#22C55E',
  headerBg:     '#FFFFFF',
  inputBg:      '#F8FAFC',
};

const FONT = {
  black:    '700' as const,
  bold:     '600' as const,
  medium:   '500' as const,
  regular:  '400' as const,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function nowTime(): string {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatTime(isoOrSimple: string): string {
  // If it's already a formatted time string (legacy), return as-is
  if (!isoOrSimple.includes('T')) return isoOrSimple;
  try {
    return new Date(isoOrSimple).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch {
    return isoOrSimple;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Msg = {
  id: string;
  text: string;
  sent: boolean;
  time: string; // ISO string for new messages
  type?: 'text' | 'wave' | 'typing' | 'image' | 'file';
  uri?: string;      // for image messages
  fileName?: string; // for file messages
  fileSize?: string; // for file messages
};

type Conv = {
  id: string;
  name: string;
  lastMsg: string;
  time: string;
  unread: number;
  online: boolean;
  messages: Msg[];
  course: string;
  school: string;
  matches: number;
  bio: string;
  interests: string[];
  verified: boolean;
};

// ─── Seed Data ────────────────────────────────────────────────────────────────
const CURRENT_USER = { name: 'Nath Legaspina', id: 'studybuddy.nathlegaspina' };

const SEED: Conv[] = [
  {
    id: '1', name: 'Red', lastMsg: 'Red waved at you!', time: '12:30 AM',
    unread: 1, online: true,
    course: 'BSIT · BSME · BSED · BSBA', school: 'QCU', matches: 10,
    bio: 'BSIT student from QCU. I like group study sessions and sharing notes. If you need help in basic programming, I got you!',
    interests: ['Valorant', 'NBA', 'Reading'], verified: true,
    messages: [
      { id: 'm1', text: '👋', sent: false, time: '12:20 AM', type: 'wave' },
      { id: 'm2', text: 'Red waved at you!', sent: false, time: '12:30 AM' },
    ],
  },
  {
    id: '2', name: 'Jordan', lastMsg: 'Jordan waved at you!', time: '12:31 AM',
    unread: 1, online: true,
    course: 'BSIT · BSME · BSED · BSBA', school: 'QCU', matches: 5,
    bio: "Hey! I love studying with others. Let's connect!",
    interests: ['Math', 'Science', 'History'], verified: false,
    messages: [{ id: 'm1', text: '👋 Jordan waved at you!', sent: false, time: '12:31 AM' }],
  },
];

// ─── Reducer ──────────────────────────────────────────────────────────────────
type Action =
  | { type: 'SEND'; id: string; text: string }
  | { type: 'SEND_IMAGE'; id: string; uri: string }
  | { type: 'SEND_FILE'; id: string; fileName: string; fileSize: string }
  | { type: 'MARK_READ'; id: string }
  | { type: 'REMOVE'; id: string }
  | { type: 'CLEAR_MSGS'; id: string };

function convReducer(state: Conv[], a: Action): Conv[] {
  switch (a.type) {
    case 'SEND': {
      const ts = new Date().toISOString();
      const formatted = nowTime();
      return state.map(c => c.id !== a.id ? c : {
        ...c,
        lastMsg: a.text,
        time: formatted,
        unread: 0,
        messages: [...c.messages, {
          id: `msg_${Date.now()}`,
          text: a.text,
          sent: true,
          time: ts,
        }],
      });
    }
    case 'SEND_IMAGE': {
      const ts = new Date().toISOString();
      return state.map(c => c.id !== a.id ? c : {
        ...c,
        lastMsg: '📷 Photo',
        time: nowTime(),
        unread: 0,
        messages: [...c.messages, {
          id: `msg_${Date.now()}`,
          text: '📷 Photo',
          sent: true,
          time: ts,
          type: 'image' as const,
          uri: a.uri,
        }],
      });
    }
    case 'SEND_FILE': {
      const ts = new Date().toISOString();
      return state.map(c => c.id !== a.id ? c : {
        ...c,
        lastMsg: `📎 ${a.fileName}`,
        time: nowTime(),
        unread: 0,
        messages: [...c.messages, {
          id: `msg_${Date.now()}`,
          text: a.fileName,
          sent: true,
          time: ts,
          type: 'file' as const,
          fileName: a.fileName,
          fileSize: a.fileSize,
        }],
      });
    }
    case 'MARK_READ':
      return state.map(c => c.id === a.id ? { ...c, unread: 0 } : c);
    case 'REMOVE':
      return state.filter(c => c.id !== a.id);
    case 'CLEAR_MSGS':
      return state.map(c => c.id === a.id ? { ...c, messages: [], lastMsg: '' } : c);
    default:
      return state;
  }
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
const AV_COLORS = [
  '#6366F1', '#EC4899', '#14B8A6', '#F97316',
  '#8B5CF6', '#06B6D4', '#EF4444', '#10B981',
];

function Avatar({
  name,
  size = 44,
  online,
}: {
  name: string;
  size?: number;
  online?: boolean;
}) {
  const bg = AV_COLORS[name.charCodeAt(0) % AV_COLORS.length];
  const dotSize = Math.round(size * 0.28);
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: bg, justifyContent: 'center', alignItems: 'center',
          shadowColor: bg, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
          elevation: 3,
        }}
      >
        <Text style={{ color: '#FFF', fontSize: size * 0.38, fontWeight: '700', includeFontPadding: false }}>
          {name[0].toUpperCase()}
        </Text>
      </View>
      {online != null && (
        <View style={{
          position: 'absolute', bottom: 0, right: 0,
          width: dotSize, height: dotSize, borderRadius: dotSize / 2,
          backgroundColor: online ? C.green : C.muted,
          borderWidth: 2, borderColor: C.white,
        }} />
      )}
    </View>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDots(d => (d + 1) % 4), 400);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={ty.row}>
      {[0, 1, 2].map(i => (
        <Animated.View key={i} style={[ty.dot, { opacity: dots > i ? 1 : 0.3 }]} />
      ))}
    </View>
  );
}
const ty = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 4 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.subtext },
});

// ═════════════════════════════════════════════════════════════════════════════
//  QR SCANNER SCREEN
// ═════════════════════════════════════════════════════════════════════════════
function QRScannerScreen({
  onClose,
  onScanned,
}: {
  onClose: () => void;
  onScanned: (data: string) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const insets = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  if (!permission) {
    return (
      <View style={scan.center}>
        <Text style={{ color: C.subtext, fontSize: 15 }}>Requesting camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={scan.center}>
        <Text style={scan.permTitle}>Camera Access Required</Text>
        <Text style={scan.permSub}>Allow camera access to scan QR codes and connect with study buddies.</Text>
        <TouchableOpacity style={scan.permBtn} onPress={requestPermission} activeOpacity={0.85}>
          <Text style={scan.permBtnTxt}>Allow Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 14 }} onPress={onClose}>
          <Text style={{ color: C.subtext, fontSize: 15 }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleScan = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onScanned(data);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" />
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleScan}
      />
      {/* Dark overlay with transparent window */}
      <View style={scan.overlay}>
        <View style={[scan.topBar, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={onClose} style={scan.closeBtn} activeOpacity={0.8}>
            <Text style={scan.closeTxt}>✕</Text>
          </TouchableOpacity>
          <Text style={scan.scanTitle}>Scan QR Code</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={scan.frameWrap}>
          <Animated.View style={[scan.frame, { transform: [{ scale: pulseAnim }] }]}>
            {/* Corner brackets */}
            {[scan.tl, scan.tr, scan.bl, scan.br].map((style, i) => (
              <View key={i} style={[scan.corner, style]} />
            ))}
          </Animated.View>
        </View>

        <View style={{ alignItems: 'center', paddingBottom: insets.bottom + 40, gap: 16 }}>
          <Text style={scan.hint}>Point camera at a StudyBuddy QR code</Text>
          {scanned && (
            <TouchableOpacity
              style={scan.rescanBtn}
              onPress={() => setScanned(false)}
              activeOpacity={0.85}
            >
              <Text style={scan.rescanTxt}>Tap to Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const scan = StyleSheet.create({
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.white, padding: 32 },
  permTitle:  { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 10, textAlign: 'center' },
  permSub:    { fontSize: 14, color: C.subtext, textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  permBtn:    { backgroundColor: C.primary, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 },
  permBtnTxt: { color: C.white, fontSize: 16, fontWeight: '600' },
  overlay:    { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  topBar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, backgroundColor: 'rgba(0,0,0,0.6)' },
  closeBtn:   { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  closeTxt:   { color: C.white, fontSize: 18, fontWeight: '600' },
  scanTitle:  { color: C.white, fontSize: 18, fontWeight: '700' },
  frameWrap:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  frame:      { width: 250, height: 250, position: 'relative' },
  corner:     { position: 'absolute', width: 40, height: 40, borderColor: C.white, borderWidth: 3.5 },
  tl:         { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  tr:         { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  bl:         { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  br:         { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  hint:       { color: 'rgba(255,255,255,0.85)', fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  rescanBtn:  { backgroundColor: C.primary, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 13 },
  rescanTxt:  { color: C.white, fontSize: 15, fontWeight: '600' },
});

// ═════════════════════════════════════════════════════════════════════════════
//  QR CODE SCREEN
// ═════════════════════════════════════════════════════════════════════════════
function QRScreen({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [showScanner, setShowScanner] = useState(false);

  const qrData = JSON.stringify({
    app: 'StudyBuddy',
    userId: CURRENT_USER.id,
    name: CURRENT_USER.name,
    link: `studybuddy://user/${CURRENT_USER.id}`,
    ts: Date.now(),
  });

  const handleScanned = (data: string) => {
    setShowScanner(false);
    try {
      const parsed = JSON.parse(data);
      Alert.alert(
        '✅ Connected!',
        parsed.name ? `Found: ${parsed.name}\nID: ${parsed.userId}` : `Data: ${data}`,
        [{ text: 'Connect', style: 'default' }, { text: 'Dismiss', style: 'cancel' }]
      );
    } catch {
      Alert.alert('QR Scanned', data, [{ text: 'OK' }]);
    }
  };

  const handleCopyId = async () => {
    await Clipboard.setStringAsync(CURRENT_USER.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', 'Your Study Buddy ID has been copied.');
  };

  const handleSaveImage = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow media library access to save your QR code.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Saved! ✓', 'QR Code saved to your gallery.');
  };

  const handleShare = async () => {
    const available = await Sharing.isAvailableAsync();
    if (!available) { Alert.alert('Sharing not available on this device.'); return; }
    Alert.alert('Share', 'Sharing your Study Buddy profile…');
  };

  if (showScanner) {
    return (
      <Modal visible animationType="slide" statusBarTranslucent>
        <QRScannerScreen onClose={() => setShowScanner(false)} onScanned={handleScanned} />
      </Modal>
    );
  }

  return (
    <Modal visible animationType="slide" statusBarTranslucent>
      <View style={[qrs.screen, { paddingTop: insets.top }]}>
        <View style={qrs.header}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={qrs.close}>✕</Text>
          </TouchableOpacity>
          <Text style={qrs.title}>Buddy Talk</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={qrs.body} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={qrs.scanRow} onPress={() => setShowScanner(true)} activeOpacity={0.8}>
            <View style={qrs.scanIcon}>
              <Text style={{ fontSize: 20 }}>⬡</Text>
            </View>
            <Text style={qrs.scanLbl}>Scan QR Code</Text>
            <Text style={{ fontSize: 18, color: C.muted }}>›</Text>
          </TouchableOpacity>

          <View style={qrs.userCard}>
            <Avatar name={CURRENT_USER.name} size={48} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={qrs.uName}>{CURRENT_USER.name}</Text>
              <Text style={qrs.uId}>{CURRENT_USER.id}</Text>
            </View>
            <TouchableOpacity style={qrs.copyBtn} onPress={handleCopyId} activeOpacity={0.8}>
              <Text style={qrs.copyTxt}>Copy ID</Text>
            </TouchableOpacity>
          </View>

          <View style={qrs.qrWrap}>
            <QRCode value={qrData} size={200} color={C.text} backgroundColor={C.white} />
          </View>
          <Text style={qrs.qrHint}>Others can scan this to connect with you</Text>

          <TouchableOpacity style={qrs.saveBtn} onPress={handleSaveImage} activeOpacity={0.8}>
            <Text style={qrs.saveTxt}>⬇  Save as Image</Text>
          </TouchableOpacity>
          <TouchableOpacity style={qrs.shareBtn} onPress={handleShare} activeOpacity={0.85}>
            <Text style={qrs.shareTxt}>↑  Share QR Code</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const qrs = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: C.white },
  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  close:    { fontSize: 18, color: C.text, fontWeight: '500' },
  title:    { fontSize: 17, fontWeight: '700', color: C.text },
  body:     { padding: 20, paddingBottom: 48 },
  scanRow:  { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 14, padding: 16, marginBottom: 14, gap: 12 },
  scanIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.primaryBg, justifyContent: 'center', alignItems: 'center' },
  scanLbl:  { flex: 1, fontSize: 15, color: C.text, fontWeight: '600' },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 14, padding: 16, marginBottom: 28 },
  uName:    { fontSize: 15, fontWeight: '700', color: C.text },
  uId:      { fontSize: 12, color: C.subtext, marginTop: 3 },
  copyBtn:  { backgroundColor: C.primaryBg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  copyTxt:  { color: C.primary, fontSize: 12, fontWeight: '700' },
  qrWrap:   { alignSelf: 'center', padding: 24, backgroundColor: C.white, borderRadius: 20, marginBottom: 10, borderWidth: 1, borderColor: C.border, shadowColor: C.shadow, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  qrHint:   { textAlign: 'center', fontSize: 13, color: C.subtext, marginBottom: 32 },
  saveBtn:  { borderWidth: 1.5, borderColor: C.border, borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  saveTxt:  { fontSize: 15, color: C.text, fontWeight: '500' },
  shareBtn: { backgroundColor: C.primary, borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center', shadowColor: C.primary, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  shareTxt: { fontSize: 15, color: C.white, fontWeight: '700' },
});

// ═════════════════════════════════════════════════════════════════════════════
//  BLOCK / REPORT SHEET
// ═════════════════════════════════════════════════════════════════════════════
function BlockSheet({
  visible, name, onBlock, onReport, onClose,
}: {
  visible: boolean; name: string;
  onBlock: () => void; onReport: () => void; onClose: () => void;
}) {
  const insets = useSafeAreaInsets();

  const confirmBlock = () => {
    onClose();
    setTimeout(() => {
      Alert.alert(
        `Block ${name}?`,
        `${name} will no longer be able to message you.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Block', style: 'destructive', onPress: onBlock },
        ]
      );
    }, 400);
  };

  const confirmReport = () => {
    onClose();
    setTimeout(() => {
      Alert.alert('Report User', `Why are you reporting ${name}?`, [
        { text: 'Spam', onPress: () => { onReport(); Alert.alert('Reported', 'Thank you. We will review this.'); } },
        { text: 'Inappropriate Content', onPress: () => { onReport(); Alert.alert('Reported', 'Thank you. We will review this.'); } },
        { text: 'Harassment', onPress: () => { onReport(); Alert.alert('Reported', 'Thank you. We will review this.'); } },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }, 400);
  };

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="slide">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={bsh.overlay}>
          <TouchableWithoutFeedback>
            <View style={[bsh.sheet, { paddingBottom: insets.bottom + 16 }]}>
              <View style={bsh.handle} />
              <TouchableOpacity style={bsh.item} onPress={confirmBlock} activeOpacity={0.7}>
                <Text style={bsh.red}>🚫  Block</Text>
              </TouchableOpacity>
              <View style={bsh.div} />
              <TouchableOpacity style={bsh.item} onPress={confirmReport} activeOpacity={0.7}>
                <Text style={bsh.red}>⚠️  Report</Text>
              </TouchableOpacity>
              <TouchableOpacity style={bsh.cancelBtn} onPress={onClose} activeOpacity={0.85}>
                <Text style={bsh.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const bsh = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:     { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10 },
  handle:    { width: 40, height: 5, borderRadius: 3, backgroundColor: C.muted, alignSelf: 'center', marginBottom: 20 },
  item:      { paddingVertical: 18, alignItems: 'center' },
  div:       { height: StyleSheet.hairlineWidth, backgroundColor: C.border },
  red:       { fontSize: 17, color: C.red, fontWeight: '600' },
  cancelBtn: { marginTop: 14, backgroundColor: C.primary, borderRadius: 16, height: 52, justifyContent: 'center', alignItems: 'center' },
  cancelTxt: { color: C.white, fontSize: 16, fontWeight: '700' },
});

// ═════════════════════════════════════════════════════════════════════════════
//  MODALS
// ═════════════════════════════════════════════════════════════════════════════
function ChatEndedModal({
  visible, onRemove, onContinue,
}: { visible: boolean; onRemove: () => void; onContinue: () => void }) {
  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="fade">
      <TouchableWithoutFeedback onPress={onContinue}>
        <View style={mod.overlay}>
          <TouchableWithoutFeedback>
            <View style={mod.card}>
              <Text style={mod.emoji}>🎓</Text>
              <Text style={mod.title}>How Was Your Study Session?</Text>
              <Text style={mod.body}>
                Great session! You may remove this match or keep the connection for future study sessions.
              </Text>
              <View style={mod.row}>
                <TouchableOpacity style={mod.outBtn} onPress={onRemove} activeOpacity={0.8}>
                  <Text style={mod.outTxt}>Remove Match</Text>
                </TouchableOpacity>
                <TouchableOpacity style={mod.solBtn} onPress={onContinue} activeOpacity={0.85}>
                  <Text style={mod.solTxt}>Keep Connected</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

function VerificationModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [done, setDone] = useState(false);
  const handleVerify = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDone(true);
  };
  const handleClose = () => { setDone(false); onClose(); };
  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="fade">
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={mod.overlay}>
          <TouchableWithoutFeedback>
            <View style={mod.card}>
              {!done ? (
                <>
                  <Text style={mod.emoji}>🆔</Text>
                  <Text style={mod.title}>Student ID Verification</Text>
                  <Text style={mod.body}>
                    Verify your identity with your QCU Student ID to unlock calls and premium features.
                  </Text>
                  <View style={mod.row}>
                    <TouchableOpacity style={mod.outBtn} onPress={handleClose} activeOpacity={0.8}>
                      <Text style={mod.outTxt}>Maybe Later</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={mod.solBtn} onPress={handleVerify} activeOpacity={0.85}>
                      <Text style={mod.solTxt}>Verify Now</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={[mod.emoji, { fontSize: 44 }]}>✅</Text>
                  <Text style={mod.title}>Submitted!</Text>
                  <Text style={mod.body}>
                    Your Student ID has been submitted for review. You will be notified once verified.
                  </Text>
                  <TouchableOpacity style={[mod.solBtn, { alignSelf: 'stretch' }]} onPress={handleClose}>
                    <Text style={mod.solTxt}>Got it</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const mod = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  card:    { backgroundColor: C.white, borderRadius: 22, padding: 24, width: '100%', shadowColor: C.shadow, shadowOpacity: 0.15, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 10, alignItems: 'flex-start' },
  emoji:   { fontSize: 36, marginBottom: 12 },
  title:   { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 8 },
  body:    { fontSize: 14, color: C.textSec, lineHeight: 22, marginBottom: 22 },
  row:     { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  outBtn:  { flex: 1, height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  outTxt:  { fontSize: 14, color: C.textSec, fontWeight: '600' },
  solBtn:  { flex: 1, height: 46, borderRadius: 12, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  solTxt:  { fontSize: 14, color: C.white, fontWeight: '700', textAlign: 'center' },
});

// ═════════════════════════════════════════════════════════════════════════════
//  PROFILE VIEW
// ═════════════════════════════════════════════════════════════════════════════
function ProfileView({
  conv, onClose, onBlock,
}: { conv: Conv; onClose: () => void; onBlock?: () => void }) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'about' | 'moments'>('about');
  const [sheet, setSheet] = useState(false);

  return (
    <Modal visible animationType="slide" statusBarTranslucent>
      <View style={[pvs.screen, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <View style={pvs.header}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={pvs.back}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => setSheet(true)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={pvs.dots}>•••</Text>
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={pvs.bannerWrap}>
            <View style={pvs.banner} />
            <View style={pvs.avatarRing}>
              <Avatar name={conv.name} size={80} online={conv.online} />
            </View>
            <View style={pvs.matchBadge}>
              <Text style={pvs.matchTxt}>🎯 {conv.matches} Matches</Text>
            </View>
          </View>
          <View style={pvs.infoBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Text style={pvs.name}>{conv.name}</Text>
              {conv.verified && (
                <View style={pvs.verBadge}>
                  <Text style={{ color: C.white, fontSize: 10, fontWeight: '700' }}>✓</Text>
                </View>
              )}
            </View>
            <Text style={pvs.idTxt}>🏠 Active recently</Text>
            <Text style={pvs.courseTxt}>{conv.course}</Text>
            <Text style={pvs.bio}>{conv.bio}</Text>
          </View>
          <View style={pvs.tabs}>
            {(['about', 'moments'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[pvs.tab, tab === t && pvs.tabActive]}
                onPress={() => setTab(t)}
              >
                <Text style={[pvs.tabTxt, tab === t && pvs.tabTxtActive]}>
                  {t === 'about' ? 'About Me' : 'Study Moments'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {tab === 'about' ? (
            <View style={pvs.section}>
              <Text style={pvs.secLbl}>Interests</Text>
              <View style={pvs.chips}>
                {conv.interests.map(i => (
                  <View key={i} style={pvs.chip}>
                    <Text style={pvs.chipTxt}>{i}</Text>
                  </View>
                ))}
              </View>
              <Text style={[pvs.secLbl, { marginTop: 24 }]}>Personal Info</Text>
              {['Address', 'Gender', 'Birthday'].map(f => (
                <View key={f} style={pvs.field}>
                  <Text style={pvs.fieldLbl}>{f}</Text>
                  <View style={pvs.fieldLine} />
                </View>
              ))}
            </View>
          ) : (
            <View style={{ padding: 48, alignItems: 'center' }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📸</Text>
              <Text style={{ color: C.subtext, fontSize: 15, fontWeight: '500' }}>No study moments yet</Text>
            </View>
          )}
        </ScrollView>
        <BlockSheet
          visible={sheet}
          name={conv.name}
          onBlock={() => { setSheet(false); onBlock?.(); onClose(); }}
          onReport={() => setSheet(false)}
          onClose={() => setSheet(false)}
        />
      </View>
    </Modal>
  );
}

const pvs = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: C.bg },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.white },
  back:         { fontSize: 34, color: C.text, lineHeight: 36 },
  dots:         { fontSize: 20, color: C.subtext, letterSpacing: 2 },
  bannerWrap:   { height: 140, position: 'relative', marginBottom: 50 },
  banner:       { height: 106, backgroundColor: '#DBEAFE' },
  avatarRing:   { position: 'absolute', bottom: -38, left: 22, borderWidth: 3, borderColor: C.white, borderRadius: 999 },
  matchBadge:   { position: 'absolute', bottom: -28, right: 18, backgroundColor: C.primaryBg, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  matchTxt:     { fontSize: 12, color: C.primary, fontWeight: '700' },
  infoBox:      { paddingHorizontal: 22, paddingBottom: 20, backgroundColor: C.white },
  name:         { fontSize: 22, fontWeight: '700', color: C.text },
  verBadge:     { backgroundColor: C.primary, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  idTxt:        { fontSize: 12, color: C.subtext, marginBottom: 3 },
  courseTxt:    { fontSize: 12, color: C.subtext, marginBottom: 10 },
  bio:          { fontSize: 14, color: C.text, lineHeight: 22 },
  tabs:         { flexDirection: 'row', backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border, marginTop: 8 },
  tab:          { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive:    { borderBottomWidth: 2.5, borderBottomColor: C.primary },
  tabTxt:       { fontSize: 14, color: C.subtext, fontWeight: '500' },
  tabTxtActive: { color: C.primary, fontWeight: '700' },
  section:      { padding: 22, backgroundColor: C.white },
  secLbl:       { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  chips:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:         { backgroundColor: C.primaryBg, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7 },
  chipTxt:      { fontSize: 13, color: C.primary, fontWeight: '600' },
  field:        { marginBottom: 18 },
  fieldLbl:     { fontSize: 13, color: C.subtext, marginBottom: 8, fontWeight: '500' },
  fieldLine:    { height: StyleSheet.hairlineWidth * 2, backgroundColor: C.border },
});

// ═════════════════════════════════════════════════════════════════════════════
//  CHAT SETTINGS
// ═════════════════════════════════════════════════════════════════════════════
function ChatSettings({
  conv, onClose, onBlock, onClearHistory,
}: {
  conv: Conv; onClose: () => void; onBlock: () => void; onClearHistory: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [notif, setNotif]   = useState(true);
  const [pinned, setPinned] = useState(false);

  const confirmBlock = () => {
    Alert.alert(
      `Block ${conv.name}?`,
      `${conv.name} will no longer be able to message you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Block', style: 'destructive', onPress: () => { onBlock(); onClose(); } },
      ]
    );
  };

  const confirmClear = () => {
    Alert.alert(
      'Clear Chat History?',
      'All messages will be permanently deleted. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: () => { onClearHistory(); onClose(); } },
      ]
    );
  };

  const handleReport = () => {
    Alert.alert('Report User', `Why are you reporting ${conv.name}?`, [
      { text: 'Spam', onPress: () => Alert.alert('Reported', 'Thank you. We will review this.') },
      { text: 'Inappropriate Content', onPress: () => Alert.alert('Reported', 'Thank you. We will review this.') },
      { text: 'Harassment', onPress: () => Alert.alert('Reported', 'Thank you. We will review this.') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const settingRows = [
    {
      icon: '🔔', label: 'Notifications', color: '#EBF5FF',
      right: <Switch value={notif} onValueChange={(v) => { setNotif(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} trackColor={{ true: C.primary }} thumbColor={C.white} />,
      onPress: undefined,
    },
    {
      icon: '📁', label: 'Shared Files', color: '#F3F0FF',
      right: <Text style={{ fontSize: 18, color: C.muted }}>›</Text>,
      onPress: () => Alert.alert('Shared Files', 'No files shared in this conversation yet.'),
    },
    {
      icon: '📌', label: 'Pin to Top', color: '#FFFBEB',
      right: <Switch value={pinned} onValueChange={(v) => { setPinned(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} trackColor={{ true: C.primary }} thumbColor={C.white} />,
      onPress: undefined,
    },
  ];

  const dangerRows = [
    { icon: '🗑️', label: 'Clear Chat History', color: '#FEE2E2', textColor: C.red, onPress: confirmClear },
    { icon: '🚫', label: 'Block User', color: '#FEE2E2', textColor: C.red, onPress: confirmBlock },
    { icon: '⚠️', label: 'Report User', color: '#FEF3C7', textColor: C.orange, onPress: handleReport },
  ];

  return (
    <Modal visible animationType="slide" statusBarTranslucent>
      <View style={[cset.screen, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <View style={cset.header}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={cset.back}>‹</Text>
          </TouchableOpacity>
          <Text style={cset.title}>Chat Settings</Text>
          <View style={{ width: 32 }} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={cset.profileCard}>
            <Avatar name={conv.name} size={76} online={conv.online} />
            <Text style={cset.pName}>{conv.name}{conv.verified ? ' ✓' : ''}</Text>
            <Text style={cset.pSub}>{conv.course}</Text>
          </View>

          <View style={cset.group}>
            {settingRows.map((row, i) => (
              <React.Fragment key={row.label}>
                <TouchableOpacity
                  style={cset.row}
                  onPress={row.onPress ?? undefined}
                  activeOpacity={row.onPress ? 0.7 : 1}
                  disabled={!row.onPress}
                >
                  <View style={[cset.ico, { backgroundColor: row.color }]}>
                    <Text style={{ fontSize: 18 }}>{row.icon}</Text>
                  </View>
                  <Text style={cset.lbl}>{row.label}</Text>
                  {row.right}
                </TouchableOpacity>
                {i < settingRows.length - 1 && <View style={cset.sep} />}
              </React.Fragment>
            ))}
          </View>

          <View style={[cset.group, { marginTop: 16 }]}>
            {dangerRows.map((row, i) => (
              <React.Fragment key={row.label}>
                <TouchableOpacity style={cset.row} onPress={row.onPress} activeOpacity={0.7}>
                  <View style={[cset.ico, { backgroundColor: row.color }]}>
                    <Text style={{ fontSize: 18 }}>{row.icon}</Text>
                  </View>
                  <Text style={[cset.lbl, { color: row.textColor }]}>{row.label}</Text>
                </TouchableOpacity>
                {i < dangerRows.length - 1 && <View style={cset.sep} />}
              </React.Fragment>
            ))}
          </View>
          <View style={{ height: insets.bottom + 32 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const cset = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: C.bg },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  back:        { fontSize: 34, color: C.text, lineHeight: 36 },
  title:       { fontSize: 17, fontWeight: '700', color: C.text },
  profileCard: { alignItems: 'center', paddingVertical: 32, backgroundColor: C.white, marginBottom: 16 },
  pName:       { fontSize: 20, fontWeight: '700', color: C.text, marginTop: 14 },
  pSub:        { fontSize: 13, color: C.subtext, marginTop: 4 },
  group:       { backgroundColor: C.white, borderRadius: 16, marginHorizontal: 16, overflow: 'hidden' },
  row:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, gap: 14 },
  ico:         { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  lbl:         { flex: 1, fontSize: 15, color: C.text, fontWeight: '500' },
  sep:         { height: StyleSheet.hairlineWidth * 2, backgroundColor: C.border, marginLeft: 68 },
});

// ═════════════════════════════════════════════════════════════════════════════
//  CHAT HEADER
// ═════════════════════════════════════════════════════════════════════════════
function ChatHeader({
  conv, onBack, onProfile, onCall, onOptions,
}: {
  conv: Conv; onBack: () => void; onProfile: () => void; onCall: () => void; onOptions: () => void;
}) {
  return (
    <View style={chdr.bar}>
      <TouchableOpacity
        onPress={onBack}
        style={chdr.backBtn}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 6 }}
        activeOpacity={0.6}
      >
        <Text style={chdr.backTxt}>‹</Text>
      </TouchableOpacity>

      <Pressable style={chdr.nameWrap} onPress={onProfile}>
        {({ pressed }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', opacity: pressed ? 0.7 : 1 }}>
            <Avatar name={conv.name} size={40} online={conv.online} />
            <View style={{ marginLeft: 11 }}>
              <Text style={chdr.name}>{conv.name}</Text>
              <Text style={chdr.status}>
                {conv.online
                  ? <Text style={{ color: C.green }}>● Online</Text>
                  : <Text style={{ color: C.subtext }}>● Offline</Text>
                }
              </Text>
            </View>
          </View>
        )}
      </Pressable>

      <TouchableOpacity
        onPress={onCall}
        style={chdr.iconBtn}
        hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
        activeOpacity={0.7}
      >
        <View style={chdr.iconCircle}>
          <Text style={{ fontSize: 17 }}>📞</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onOptions}
        style={chdr.iconBtn}
        hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
        activeOpacity={0.7}
      >
        <View style={chdr.iconCircle}>
          <Text style={chdr.dots}>•••</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const chdr = StyleSheet.create({
  bar:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 10, backgroundColor: C.white, borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: C.border },
  backBtn:    { marginRight: 2, paddingHorizontal: 4 },
  backTxt:    { fontSize: 38, color: C.text, lineHeight: 40, includeFontPadding: false },
  nameWrap:   { flex: 1 },
  name:       { fontSize: 16, fontWeight: '700', color: C.text, lineHeight: 20 },
  status:     { fontSize: 12, fontWeight: '500', marginTop: 1 },
  iconBtn:    { marginLeft: 4 },
  iconCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  dots:       { fontSize: 14, color: C.textSec, letterSpacing: 1.5, fontWeight: '600' },
});

// ═════════════════════════════════════════════════════════════════════════════
//  CHAT BUBBLE
// ═════════════════════════════════════════════════════════════════════════════
import { Image } from 'react-native';

function ChatBubble({ msg, senderName }: { msg: Msg; senderName: string }) {
  const displayTime = formatTime(msg.time);
  const isWave = msg.type === 'wave';
  const isImage = msg.type === 'image';
  const isFile = msg.type === 'file';

  const renderContent = () => {
    if (isImage && msg.uri) {
      return (
        <View style={[cbub.bubble, msg.sent ? cbub.sent : cbub.recv, { padding: 3 }]}>
          <Image
            source={{ uri: msg.uri }}
            style={cbub.imgPreview}
            resizeMode="cover"
          />
        </View>
      );
    }
    if (isFile) {
      return (
        <View style={[cbub.bubble, msg.sent ? cbub.sent : cbub.recv, cbub.fileBubble]}>
          <View style={cbub.fileIcon}>
            <Text style={{ fontSize: 22 }}>📎</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[cbub.fileName, msg.sent ? cbub.txtSent : cbub.txtRecv]} numberOfLines={2}>
              {msg.fileName}
            </Text>
            {msg.fileSize ? (
              <Text style={[cbub.fileSize, msg.sent ? { color: 'rgba(255,255,255,0.65)' } : { color: C.subtext }]}>
                {msg.fileSize}
              </Text>
            ) : null}
          </View>
        </View>
      );
    }
    return (
      <View style={[
        cbub.bubble,
        msg.sent ? cbub.sent : cbub.recv,
        isWave && cbub.waveBubble,
      ]}>
        <Text style={[
          cbub.txt,
          msg.sent ? cbub.txtSent : cbub.txtRecv,
          isWave && cbub.waveTxt,
        ]}>
          {msg.text}
        </Text>
      </View>
    );
  };

  return (
    <View style={[cbub.row, msg.sent ? cbub.rowRight : cbub.rowLeft]}>
      {!msg.sent && (
        <View style={cbub.avWrap}>
          <Avatar name={senderName} size={30} />
        </View>
      )}
      <View style={[cbub.col, msg.sent ? cbub.colRight : cbub.colLeft]}>
        {renderContent()}
        <Text style={[cbub.time, msg.sent && { textAlign: 'right' }]}>
          {displayTime}
        </Text>
      </View>
    </View>
  );
}

const cbub = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6, paddingHorizontal: 14 },
  rowLeft:    { justifyContent: 'flex-start' },
  rowRight:   { justifyContent: 'flex-end' },
  avWrap:     { marginRight: 8, marginBottom: 16 },
  col:        { maxWidth: '75%' },
  colLeft:    {},
  colRight:   { alignItems: 'flex-end' },
  bubble:     { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  recv:       { backgroundColor: C.recvBubble, borderBottomLeftRadius: 5 },
  sent:       { backgroundColor: C.sentBubble, borderBottomRightRadius: 5, shadowColor: C.primary, shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  waveBubble: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 24 },
  txt:        { fontSize: 15, lineHeight: 22 },
  txtRecv:    { color: C.text },
  txtSent:    { color: C.white },
  waveTxt:    { fontSize: 22 },
  time:       { fontSize: 11, color: C.subtext, marginTop: 4, marginHorizontal: 4 },
  // Image message
  imgPreview: { width: 200, height: 200, borderRadius: 18 },
  // File message
  fileBubble: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 10, minWidth: 180 },
  fileIcon:   { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  fileName:   { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  fileSize:   { fontSize: 11, marginTop: 2 },
});

// ═════════════════════════════════════════════════════════════════════════════
//  CHAT INPUT
// ═════════════════════════════════════════════════════════════════════════════
function ChatInput({
  onSend, onPlus,
}: { onSend: (t: string) => void; onPlus: () => void }) {
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0;

  const send = useCallback(() => {
    const t = text.trim();
    if (!t) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend(t);
    setText('');
  }, [text, onSend]);

  return (
    <View style={cin.bar}>
      <TouchableOpacity
        style={cin.plusBtn}
        onPress={onPlus}
        activeOpacity={0.75}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={cin.plusTxt}>+</Text>
      </TouchableOpacity>

      <TextInput
        style={cin.input}
        placeholder="Type a message…"
        placeholderTextColor={C.subtext}
        value={text}
        onChangeText={setText}
        multiline
        blurOnSubmit={false}
        returnKeyType="default"
      />

      <TouchableOpacity
        style={[cin.sendBtn, !canSend && cin.sendBtnDisabled]}
        onPress={canSend ? send : undefined}
        activeOpacity={canSend ? 0.8 : 1}
      >
        <Text style={[cin.sendTxt, !canSend && cin.sendTxtDisabled]}>
          ↑
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const cin = StyleSheet.create({
  bar:             { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: C.white, borderTopWidth: StyleSheet.hairlineWidth * 2, borderTopColor: C.border, gap: 8 },
  plusBtn:         { width: 38, height: 38, borderRadius: 19, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', marginBottom: 1 },
  plusTxt:         { color: C.primary, fontSize: 26, lineHeight: 28, fontWeight: '300', includeFontPadding: false },
  input:           { flex: 1, minHeight: 40, maxHeight: 120, backgroundColor: C.inputBg, borderRadius: 22, paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 10 : 8, paddingBottom: Platform.OS === 'ios' ? 10 : 8, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border },
  sendBtn:         { width: 38, height: 38, borderRadius: 19, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 1, shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  sendBtnDisabled: { backgroundColor: C.bg, shadowOpacity: 0, elevation: 0 },
  sendTxt:         { color: C.white, fontSize: 18, fontWeight: '700', lineHeight: 20, includeFontPadding: false },
  sendTxtDisabled: { color: C.muted },
});

// ═════════════════════════════════════════════════════════════════════════════
//  CHAT SCREEN
// ═════════════════════════════════════════════════════════════════════════════
function ChatScreen({
  conv, onBack, onSend, onSendImage, onSendFile, onBlock, onClearHistory,
}: {
  conv: Conv; onBack: () => void;
  onSend: (text: string) => void;
  onSendImage: (uri: string) => void;
  onSendFile: (fileName: string, fileSize: string) => void;
  onBlock: () => void;
  onClearHistory: () => void;
}) {
  const insets   = useSafeAreaInsets();
  const listRef  = useRef<FlatList>(null);
  const [showProfile,  setShowProfile]  = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEnded,    setShowEnded]    = useState(false);
  const [showVerify,   setShowVerify]   = useState(false);
  const [showAttach,   setShowAttach]   = useState(false);

  const scrollToBottom = useCallback((animated = true) => {
    if (conv.messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated }), 50);
    }
  }, [conv.messages.length]);

  const handleSend = useCallback((text: string) => {
    onSend(text);
    scrollToBottom(true);
  }, [onSend, scrollToBottom]);

  const handleCall = () => {
    Alert.alert(
      `Call ${conv.name}`,
      'Voice calls require a verified QCU Student ID.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Verify & Call', onPress: () => setShowVerify(true) },
      ]
    );
  };

  const handleOptions = () => {
    const options = ['Cancel', 'View Profile', 'Chat Settings', 'End Chat'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 0, destructiveButtonIndex: 3 },
        (i) => {
          if (i === 1) setShowProfile(true);
          if (i === 2) setShowSettings(true);
          if (i === 3) setShowEnded(true);
        }
      );
    } else {
      Alert.alert('Options', undefined, [
        { text: 'View Profile',  onPress: () => setShowProfile(true) },
        { text: 'Chat Settings', onPress: () => setShowSettings(true) },
        { text: 'End Chat',      style: 'destructive', onPress: () => setShowEnded(true) },
        { text: 'Cancel',        style: 'cancel' },
      ]);
    }
  };

  // ── Real file / photo handlers ──────────────────────────────────────────
  const handlePickPhoto = async () => {
    setShowAttach(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow photo library access to send photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSendImage(result.assets[0].uri);
      scrollToBottom(true);
    }
  };

  const handleTakePhoto = async () => {
    setShowAttach(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera access to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSendImage(result.assets[0].uri);
      scrollToBottom(true);
    }
  };

  const handlePickFile = async () => {
    setShowAttach(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const name = asset.name ?? 'Unknown file';
        const bytes = asset.size ?? 0;
        const size = bytes > 1024 * 1024
          ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
          : bytes > 1024
          ? `${(bytes / 1024).toFixed(0)} KB`
          : `${bytes} B`;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSendFile(name, size);
        scrollToBottom(true);
      }
    } catch {
      Alert.alert('Error', 'Could not open file picker.');
    }
  };

  const attachItems = [
    { icon: '🖼️', label: 'Photo Library', action: handlePickPhoto },
    { icon: '📷', label: 'Camera',         action: handleTakePhoto },
    { icon: '📎', label: 'Send File',       action: handlePickFile },
    { icon: '🆔', label: 'Verify ID',       action: () => { setShowAttach(false); setShowVerify(true); } },
    { icon: '📅', label: 'Schedule',        action: () => { setShowAttach(false); Alert.alert('Schedule', 'Study session scheduler coming soon!'); } },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 60 : 0}
    >
      <StatusBar barStyle="dark-content" />
      <View style={{ height: insets.top, backgroundColor: C.white }} />

      <ChatHeader
        conv={conv}
        onBack={onBack}
        onProfile={() => setShowProfile(true)}
        onCall={handleCall}
        onOptions={handleOptions}
      />

      <FlatList
        ref={listRef}
        data={conv.messages}
        keyExtractor={m => m.id}
        renderItem={({ item }) => <ChatBubble msg={item} senderName={conv.name} />}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 12 }}
        onContentSizeChange={() => scrollToBottom(false)}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        style={{ flex: 1, backgroundColor: C.white }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.primaryBg, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 36 }}>👋</Text>
            </View>
            <Text style={{ color: C.subtext, fontSize: 15, fontWeight: '500' }}>Say hi to {conv.name}!</Text>
          </View>
        }
      />

      {/* Attachment Tray */}
      {showAttach && (
        <View style={chs.tray}>
          {attachItems.map(a => (
            <TouchableOpacity key={a.label} style={chs.trayItem} onPress={a.action} activeOpacity={0.7}>
              <View style={chs.trayIcon}>
                <Text style={{ fontSize: 24 }}>{a.icon}</Text>
              </View>
              <Text style={chs.trayLbl}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={{ paddingBottom: insets.bottom }}>
        <ChatInput onSend={handleSend} onPlus={() => setShowAttach(v => !v)} />
      </View>

      {showProfile && (
        <ProfileView
          conv={conv}
          onClose={() => setShowProfile(false)}
          onBlock={() => { onBlock(); onBack(); }}
        />
      )}
      {showSettings && (
        <ChatSettings
          conv={conv}
          onClose={() => setShowSettings(false)}
          onBlock={() => { onBlock(); onBack(); }}
          onClearHistory={onClearHistory}
        />
      )}
      <ChatEndedModal
        visible={showEnded}
        onRemove={() => { setShowEnded(false); onBack(); }}
        onContinue={() => setShowEnded(false)}
      />
      <VerificationModal visible={showVerify} onClose={() => setShowVerify(false)} />
    </KeyboardAvoidingView>
  );
}

const chs = StyleSheet.create({
  tray:     { flexDirection: 'row', backgroundColor: C.white, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: C.border, gap: 24 },
  trayItem: { alignItems: 'center', gap: 6 },
  trayIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', shadowColor: C.shadow, shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  trayLbl:  { fontSize: 11, color: C.textSec, textAlign: 'center', maxWidth: 70, fontWeight: '500' },
});

// ═════════════════════════════════════════════════════════════════════════════
//  MESSAGE LIST ITEM
// ═════════════════════════════════════════════════════════════════════════════
function MessageItem({ conv, onPress }: { conv: Conv; onPress: () => void }) {
  return (
    <TouchableOpacity style={mit.row} onPress={onPress} activeOpacity={0.8}>
      <Avatar name={conv.name} size={54} online={conv.online} />
      <View style={mit.body}>
        <View style={mit.topRow}>
          <Text style={mit.name} numberOfLines={1}>{conv.name}</Text>
          <Text style={mit.time}>{conv.time}</Text>
        </View>
        <View style={mit.bottomRow}>
          <Text style={[mit.last, conv.unread > 0 && mit.lastUnread]} numberOfLines={1}>
            {conv.lastMsg}
          </Text>
          {conv.unread > 0 && (
            <View style={mit.badge}>
              <Text style={mit.badgeTxt}>{conv.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const mit = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, backgroundColor: C.white, gap: 14 },
  body:       { flex: 1, minWidth: 0 },
  topRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  bottomRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name:       { fontSize: 15, fontWeight: '700', color: C.text, flex: 1 },
  time:       { fontSize: 11, color: C.subtext, fontWeight: '400' },
  last:       { fontSize: 13, color: C.subtext, flex: 1 },
  lastUnread: { color: C.textSec, fontWeight: '500' },
  badge:      { backgroundColor: C.primary, borderRadius: 11, minWidth: 22, height: 22, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  badgeTxt:   { color: C.white, fontSize: 11, fontWeight: '700' },
});

// ═════════════════════════════════════════════════════════════════════════════
//  MESSAGES LIST — Root Export
// ═════════════════════════════════════════════════════════════════════════════
export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const [convs, dispatch] = useReducer(convReducer, SEED);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState<Conv | null>(null);
  const [showQR, setShowQR] = useState(false);

  const liveConv = active ? (convs.find(c => c.id === active.id) ?? null) : null;

  const filtered = useMemo(
    () => convs.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMsg.toLowerCase().includes(search.toLowerCase())
    ),
    [convs, search]
  );

  if (liveConv) {
    return (
      <ChatScreen
        conv={liveConv}
        onBack={() => setActive(null)}
        onSend={text => dispatch({ type: 'SEND', id: liveConv.id, text })}
        onSendImage={uri => dispatch({ type: 'SEND_IMAGE', id: liveConv.id, uri })}
        onSendFile={(fileName, fileSize) => dispatch({ type: 'SEND_FILE', id: liveConv.id, fileName, fileSize })}
        onBlock={() => dispatch({ type: 'REMOVE', id: liveConv.id })}
        onClearHistory={() => dispatch({ type: 'CLEAR_MSGS', id: liveConv.id })}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      {/* ── Header ── */}
      <View style={[ml.header, { paddingTop: insets.top }]}>
        <View style={ml.titleRow}>
          <Text style={ml.title}>Buddy Talk</Text>
          <TouchableOpacity
            onPress={() => setShowQR(true)}
            style={ml.addBtn}
            activeOpacity={0.85}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={ml.addTxt}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={ml.banner}
          activeOpacity={0.85}
          onPress={() => Alert.alert('Start Matching', 'Browse and match with 4,900+ online study buddies!')}
        >
          <Text style={ml.bannerTitle}>Start Matching</Text>
          <View style={ml.bannerSubRow}>
            <View style={ml.onlineDot} />
            <Text style={ml.bannerSub}>4900 Online</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Search Bar ── */}
      <View style={ml.searchWrap}>
        <View style={ml.searchBox}>
          <Text style={{ fontSize: 15, color: C.subtext }}>🔍</Text>
          <TextInput
            style={ml.searchInput}
            placeholder="Search conversations…"
            placeholderTextColor={C.subtext}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {search.length > 0 && Platform.OS === 'android' && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ color: C.muted, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Conversation List ── */}
      <FlatList
        data={filtered}
        keyExtractor={c => c.id}
        renderItem={({ item }) => (
          <MessageItem
            conv={item}
            onPress={() => {
              dispatch({ type: 'MARK_READ', id: item.id });
              setActive(item);
            }}
          />
        )}
        ItemSeparatorComponent={() => (
          <View style={{ height: StyleSheet.hairlineWidth * 2, backgroundColor: C.borderSoft, marginLeft: 84 }} />
        )}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 100, gap: 14 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: C.primaryBg, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 40 }}>💬</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: C.text }}>No conversations yet</Text>
            <Text style={{ fontSize: 14, color: C.subtext, textAlign: 'center', paddingHorizontal: 40 }}>
              Start matching with study buddies to begin chatting!
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: C.primary, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 13, marginTop: 8 }}
              onPress={() => Alert.alert('Start Matching', 'Browse and match with study buddies!')}
              activeOpacity={0.85}
            >
              <Text style={{ color: C.white, fontSize: 15, fontWeight: '700' }}>Start Matching</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {showQR && <QRScreen onClose={() => setShowQR(false)} />}
    </View>
  );
}

const ml = StyleSheet.create({
  // Header is a white block, stacked vertically
  header:       { backgroundColor: C.white, paddingHorizontal: 18, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  // Title row: "Buddy Talk" left, "+" right — same horizontal line
  titleRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 12 },
  title:        { fontSize: 20, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  addBtn:       { width: 34, height: 34, justifyContent: 'center', alignItems: 'center' },
  addTxt:       { color: C.text, fontSize: 28, lineHeight: 30, fontWeight: '300', includeFontPadding: false },
  // Full-width blue rounded banner below the title row
  banner:       {
    backgroundColor: C.primary,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: C.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  bannerTitle:  { color: C.white, fontSize: 16, fontWeight: '700' },
  bannerSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  onlineDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: C.green },
  bannerSub:    { color: 'rgba(255,255,255,0.88)', fontSize: 13, fontWeight: '500' },
  // Search bar
  searchWrap:   { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.white, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.borderSoft },
  searchBox:    { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 24, paddingHorizontal: 14, height: 44, gap: 8 },
  searchInput:  { flex: 1, fontSize: 15, color: C.text, paddingVertical: 0 },
});