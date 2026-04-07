import React, { useState } from 'react';
import {
  FlatList, Image, Modal,
  SafeAreaView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../../components/AuthShared';

const FILTERS = ['All', 'Match Partners', 'Gender'];
const TAGS = ['CC108', 'SIA102', '+'];

const USERS: {
  id: string;
  name: string;
  avatar: string;
  subjects: string[];
  bio: string;
  match: number;
  active: boolean;
}[] = [];

export default function HomeScreen() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [showQuickMatch, setShowQuickMatch] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <SafeAreaView style={{ backgroundColor: '#F5F9FC' }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Find Study Buddy</Text>
          <TouchableOpacity>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1163/1163766.png' }}
              style={styles.filterIcon}
            />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[styles.filterTab, activeFilter === f && styles.filterTabActive]}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Subject Tags */}
        <View style={styles.tagRow}>
          {TAGS.map((t) => (
            <TouchableOpacity key={t} style={styles.tag}>
              <Text style={styles.tagText}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {/* User List */}
      <FlatList
        data={USERS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 160, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4076/4076549.png' }}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>No Study Buddies Found</Text>
            <Text style={styles.emptySubText}>
              Once matched, your study partners will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.name}</Text>
                <View style={styles.subjectRow}>
                  {item.subjects.map((sub) => (
                    <Text key={sub} style={styles.subject}>{sub}</Text>
                  ))}
                </View>
                <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>
                <View style={styles.cardMeta}>
                  <Text style={[styles.activeTag, { color: item.active ? 'green' : C.muted }]}>
                    {item.active ? '● Active Now' : '● Offline'}
                  </Text>
                  <Text style={styles.matchText}>{item.match}% Match</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.connectBtn}>
                <Text style={styles.connectText}>Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Fixed Quick Match Button - above tab bar */}
      <View style={[styles.fixedBottom, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.quickMatchBtn} onPress={() => setShowQuickMatch(true)}>
          <Text style={styles.quickMatchText}>⚡ Quick Match</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Match Modal */}
      <Modal visible={showQuickMatch} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowQuickMatch(false)}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Quick Match!</Text>
            <Text style={styles.modalSub}>We found your ideal study buddy!</Text>
            <View style={styles.matchRow}>
              <View style={styles.userBubble}>
                <Text style={styles.bubbleText}>N</Text>
              </View>
              <Text style={styles.wave}>〜</Text>
              <View style={[styles.userBubble, { backgroundColor: C.blue }]}>
                <Text style={styles.bubbleText}>?</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F9FC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.darkBlue },
  filterIcon: { width: 22, height: 22, tintColor: C.darkBlue },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 10 },
  filterTab: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: C.border },
  filterTabActive: { backgroundColor: C.blue, borderColor: C.blue },
  filterText: { fontSize: 13, color: C.muted },
  filterTextActive: { color: C.white, fontWeight: '600' },
  tagRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 10 },
  tag: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 12 },
  tagText: { fontSize: 12, color: C.darkBlue, fontWeight: '600' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyIcon: { width: 80, height: 80, marginBottom: 16, opacity: 0.4 },
  emptyText: { fontSize: 16, fontWeight: '700', color: C.darkBlue, marginBottom: 8 },
  emptySubText: { fontSize: 13, color: C.muted, textAlign: 'center', paddingHorizontal: 30 },
  card: { backgroundColor: C.white, borderRadius: 12, padding: 14, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  cardTop: { flexDirection: 'row', gap: 10 },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: C.darkBlue },
  subjectRow: { flexDirection: 'row', gap: 4, marginVertical: 4 },
  subject: { fontSize: 10, backgroundColor: '#EAF4FB', color: C.blue, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  bio: { fontSize: 12, color: C.muted, lineHeight: 17 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  activeTag: { fontSize: 11 },
  matchText: { fontSize: 11, color: C.blue, fontWeight: '600' },
  connectBtn: { backgroundColor: C.blue, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  connectText: { color: C.white, fontSize: 12, fontWeight: '600' },
  fixedBottom: {
    position: 'absolute',
    bottom: 60, // sits above tab bar
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
  quickMatchBtn: { backgroundColor: C.darkBlue, borderRadius: 30, paddingVertical: 16, alignItems: 'center', width: '100%' },
  quickMatchText: { color: C.white, fontWeight: '700', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: C.blue, borderRadius: 20, padding: 30, width: '80%', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 12, left: 12 },
  closeText: { color: C.white, fontSize: 18 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: C.white, marginBottom: 6 },
  modalSub: { fontSize: 13, color: C.white, marginBottom: 24 },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  userBubble: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'green', justifyContent: 'center', alignItems: 'center' },
  bubbleText: { fontSize: 28, color: C.white, fontWeight: 'bold' },
  wave: { fontSize: 24, color: C.white },
});