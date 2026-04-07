import React, { useCallback, useReducer, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────
type Comment = { id: string; author: string; avatar: string; text: string; time: string };
type Post = {
  id: string;
  author: string;
  avatar: string;
  course: string;
  time: string;
  text: string;
  image?: string;
  likes: number;
  liked: boolean;
  comments: Comment[];
};

// ─── Initial Data ─────────────────────────────────────────────────────────────
const INITIAL_POSTS: Post[] = [
  {
    id: '1',
    author: 'Jordan',
    avatar: '',
    course: 'BSIT · BSME · BSED · BSBA',
    time: '4 minutes ago',
    text: 'Study session at the library later 📚 Who\'s joining? Let\'s review CC106 together 🎯',
    image: undefined,
    likes: 21,
    liked: false,
    comments: [
      { id: 'c1', author: 'Shainne', avatar: '', text: 'HI', time: '2m ago' },
    ],
  },
  {
    id: '2',
    author: 'Shainne',
    avatar: '',
    course: 'BSIT · BSME · BSED · BSBA',
    time: '27 minutes ago',
    text: 'Coffee + coding = classmates 🫶 Study buddy meetup later! Message me if you want to join.',
    image: undefined,
    likes: 20,
    liked: false,
    comments: [],
  },
  {
    id: '3',
    author: 'Shainne',
    avatar: '',
    course: 'BSIT · BSME · BSED · BSBA',
    time: '27 minutes ago',
    text: 'Coffee + coding = classmates 🫶 Study buddy meetup later! Message me if you want to join.',
    image: undefined,
    likes: 20,
    liked: false,
    comments: [],
  },
];

// ─── Reducer ──────────────────────────────────────────────────────────────────
type Action =
  | { type: 'TOGGLE_LIKE'; id: string }
  | { type: 'ADD_COMMENT'; id: string; comment: Comment }
  | { type: 'DELETE_COMMENT'; postId: string; commentId: string }
  | { type: 'EDIT_COMMENT'; postId: string; commentId: string; text: string }
  | { type: 'ADD_POST'; post: Post }
  | { type: 'REFRESH' };

function reducer(state: Post[], action: Action): Post[] {
  switch (action.type) {
    case 'TOGGLE_LIKE':
      return state.map(p =>
        p.id === action.id
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      );
    case 'ADD_COMMENT':
      return state.map(p =>
        p.id === action.id ? { ...p, comments: [...p.comments, action.comment] } : p
      );
    case 'DELETE_COMMENT':
      return state.map(p =>
        p.id === action.postId
          ? { ...p, comments: p.comments.filter(c => c.id !== action.commentId) }
          : p
      );
    case 'EDIT_COMMENT':
      return state.map(p =>
        p.id === action.postId
          ? { ...p, comments: p.comments.map(c => c.id === action.commentId ? { ...c, text: action.text } : c) }
          : p
      );
    case 'ADD_POST':
      return [action.post, ...state];
    default:
      return state;
  }
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 36, uri }: { name: string; size?: number; uri?: string }) {
  const colors = ['#4A90D9', '#E8943A', '#5CB85C', '#9B59B6', '#E74C3C', '#1ABC9C'];
  const color  = colors[name.charCodeAt(0) % colors.length];
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontSize: size * 0.4, fontWeight: '700' }}>{name[0]?.toUpperCase()}</Text>
    </View>
  );
}

// ─── Like Button with animation ───────────────────────────────────────────────
function LikeButton({ liked, count, onPress }: { liked: boolean; count: number; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.4, useNativeDriver: true, speed: 50 }),
      Animated.spring(scale, { toValue: 1,   useNativeDriver: true, speed: 50 }),
    ]).start();
    onPress();
  };
  return (
    <TouchableOpacity style={st.actionBtn} onPress={handlePress} activeOpacity={0.7}>
      <Animated.Text style={[st.actionIcon, { transform: [{ scale }], color: liked ? '#E74C3C' : '#8A98B4' }]}>
        {liked ? '♥' : '♡'}
      </Animated.Text>
      <Text style={[st.actionCount, liked && { color: '#E74C3C' }]}>{count}</Text>
    </TouchableOpacity>
  );
}

// ─── Image placeholder ────────────────────────────────────────────────────────
function ImagePlaceholder() {
  return (
    <View style={st.imagePlaceholder}>
      <Text style={{ fontSize: 28, color: '#C8D8E8' }}>🖼</Text>
    </View>
  );
}

// ─── Detail / Comments Modal ──────────────────────────────────────────────────
function DetailModal({
  post,
  visible,
  onClose,
  onLike,
  onAddComment,
  onDeleteComment,
  onEditComment,
  currentUser,
}: {
  post: Post | null;
  visible: boolean;
  onClose: () => void;
  onLike: () => void;
  onAddComment: (text: string) => void;
  onDeleteComment: (commentId: string) => void;
  onEditComment: (commentId: string, text: string) => void;
  currentUser: string;
}) {
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [pendingEdit, setPendingEdit] = useState<{ id: string; text: string } | null>(null);

  if (!post) return null;

  const handleSend = () => {
    if (!input.trim()) return;
    onAddComment(input.trim());
    setInput('');
  };

  const handleLongPressComment = (comment: Comment) => {
    if (comment.author !== currentUser) return;
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Delete', 'Edit'], cancelButtonIndex: 0, destructiveButtonIndex: 1 },
        (idx) => {
          if (idx === 1) onDeleteComment(comment.id);
          if (idx === 2) { setEditingId(comment.id); setEditText(comment.text); }
        }
      );
    } else {
      Alert.alert('Comment', '', [
        { text: 'Delete', style: 'destructive', onPress: () => onDeleteComment(comment.id) },
        { text: 'Edit', onPress: () => { setEditingId(comment.id); setEditText(comment.text); } },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleSaveEdit = () => {
    if (editingId && editText.trim()) {
      setPendingEdit({ id: editingId, text: editText.trim() });
      setShowSaveDialog(true);
    }
  };

  const confirmEdit = () => {
    if (pendingEdit) {
      onEditComment(pendingEdit.id, pendingEdit.text);
      setEditingId(null);
      setEditText('');
      setPendingEdit(null);
    }
    setShowSaveDialog(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* Header */}
        <View style={dm.header}>
          <TouchableOpacity onPress={onClose} style={dm.backBtn}>
            <Text style={dm.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={dm.headerTitle}>Details</Text>
        </View>

        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          {/* Post */}
          <View style={dm.postSection}>
            <View style={dm.postHeader}>
              <Avatar name={post.author} size={44} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={dm.postAuthor}>{post.author}</Text>
                <Text style={dm.postCourse}>{post.course}</Text>
              </View>
              <Text style={dm.postTime}>{post.time}</Text>
            </View>
            <Text style={dm.postText}>{post.text}</Text>
            {post.image ? (
              <Image source={{ uri: post.image }} style={dm.postImage} />
            ) : (
              <ImagePlaceholder />
            )}

            {/* Reactions row */}
            <View style={dm.reactRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 14 }}>❤️</Text>
                <Text style={dm.reactCount}>{post.likes}</Text>
              </View>
              <Text style={dm.reactCount}>{post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}</Text>
            </View>

            {/* Avatars of likers */}
            <View style={dm.likerRow}>
              {['J','S','K','A','M','R'].map((l, i) => (
                <View key={i} style={[dm.likerAvatar, { marginLeft: i > 0 ? -8 : 0, zIndex: 10 - i }]}>
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{l}</Text>
                </View>
              ))}
              <Text style={dm.andOthers}>and 5 others</Text>
            </View>

            {/* Action buttons */}
            <View style={dm.actionRow}>
              <LikeButton liked={post.liked} count={post.likes} onPress={onLike} />
              <View style={st.actionBtn}>
                <Text style={[st.actionIcon, { color: '#8A98B4' }]}>💬</Text>
                <Text style={st.actionCount}>{post.comments.length}</Text>
              </View>
            </View>
          </View>

          {/* Comments */}
          <View style={dm.commentsSection}>
            <Text style={dm.commentsTitle}>Comments({post.comments.length})</Text>
            {post.comments.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={dm.commentRow}
                onLongPress={() => handleLongPressComment(c)}
                activeOpacity={0.8}
              >
                <Avatar name={c.author} size={32} />
                <View style={dm.commentBubble}>
                  <Text style={dm.commentAuthor}>{c.author}</Text>
                  {editingId === c.id ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <TextInput
                        style={dm.editInput}
                        value={editText}
                        onChangeText={setEditText}
                        autoFocus
                      />
                      <TouchableOpacity onPress={handleSaveEdit} style={dm.saveEditBtn}>
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={dm.commentText}>{c.text}</Text>
                  )}
                </View>
                <TouchableOpacity style={{ padding: 4 }}>
                  <Text style={{ color: '#8A98B4', fontSize: 18 }}>♡</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={dm.inputRow}>
            <Avatar name={currentUser} size={32} />
            <TextInput
              style={dm.commentInput}
              placeholder="Type a message..."
              placeholderTextColor="#BBCCE0"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            {input.length > 0 && (
              <TouchableOpacity onPress={handleSend} style={dm.sendBtn}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Send</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>

        {/* Save Edit Dialog */}
        <Modal visible={showSaveDialog} transparent animationType="fade">
          <View style={dm.dialogOverlay}>
            <View style={dm.dialogBox}>
              <Text style={dm.dialogTitle}>Save this edit?</Text>
              <TouchableOpacity style={dm.dialogYes} onPress={confirmEdit}>
                <Text style={dm.dialogYesText}>YES</Text>
              </TouchableOpacity>
              <TouchableOpacity style={dm.dialogNo} onPress={() => setShowSaveDialog(false)}>
                <Text style={dm.dialogNoText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const dm = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F4FA' },
  backBtn:      { marginRight: 8 },
  backIcon:     { fontSize: 32, color: '#0D2260', lineHeight: 32 },
  headerTitle:  { fontSize: 17, fontWeight: '700', color: '#111' },
  postSection:  { padding: 16, borderBottomWidth: 6, borderBottomColor: '#F5F7FA' },
  postHeader:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  postAuthor:   { fontSize: 15, fontWeight: '700', color: '#111' },
  postCourse:   { fontSize: 11, color: '#8A98B4', marginTop: 1 },
  postTime:     { fontSize: 11, color: '#BBCCE0' },
  postText:     { fontSize: 14, color: '#2D3A5A', lineHeight: 21, marginBottom: 12 },
  postImage:    { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
  reactRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  reactCount:   { fontSize: 13, color: '#6B7A99' },
  likerRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  likerAvatar:  { width: 22, height: 22, borderRadius: 11, backgroundColor: '#4A90D9', borderWidth: 1.5, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  andOthers:    { fontSize: 11, color: '#8A98B4', marginLeft: 8 },
  actionRow:    { flexDirection: 'row', gap: 20, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F0F4FA' },
  commentsSection: { padding: 16 },
  commentsTitle: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 14 },
  commentRow:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 10 },
  commentBubble: { flex: 1, backgroundColor: '#F5F7FA', borderRadius: 12, padding: 10 },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: '#111', marginBottom: 2 },
  commentText:  { fontSize: 13, color: '#444' },
  editInput:    { flex: 1, fontSize: 13, color: '#111', borderBottomWidth: 1, borderBottomColor: '#D4E0F0', paddingBottom: 2 },
  saveEditBtn:  { backgroundColor: '#2563C7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  inputRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F0F4FA', gap: 10, backgroundColor: '#fff' },
  commentInput: { flex: 1, height: 40, backgroundColor: '#F5F7FA', borderRadius: 20, paddingHorizontal: 14, fontSize: 14, color: '#2D3A5A' },
  sendBtn:      { backgroundColor: '#2563C7', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 },
  dialogOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  dialogBox:    { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 36, alignItems: 'center' },
  dialogTitle:  { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 20 },
  dialogYes:    { backgroundColor: '#2563C7', borderRadius: 12, width: '100%', height: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  dialogYesText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dialogNo:     { backgroundColor: '#F0F4FA', borderRadius: 12, width: '100%', height: 48, justifyContent: 'center', alignItems: 'center' },
  dialogNoText: { color: '#444', fontSize: 16, fontWeight: '600' },
});

// ─── Create Post Modal ────────────────────────────────────────────────────────
function CreatePostModal({
  visible,
  onClose,
  onPost,
  currentUser,
}: {
  visible: boolean;
  onClose: () => void;
  onPost: (text: string) => void;
  currentUser: string;
}) {
  const [text, setText] = useState('');

  const handlePost = () => {
    if (!text.trim()) return;
    onPost(text.trim());
    setText('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={cp.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={cp.closeBtn}>✕</Text>
          </TouchableOpacity>
          <Text style={cp.title}>Study Moments</Text>
          <TouchableOpacity style={[cp.postBtn, !text.trim() && { opacity: 0.4 }]} onPress={handlePost} disabled={!text.trim()}>
            <Text style={cp.postBtnText}>Post</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={{ flexDirection: 'row', padding: 16, gap: 12 }}>
            <Avatar name={currentUser} size={40} />
            <TextInput
              style={cp.input}
              placeholder="What's your study highlight today?"
              placeholderTextColor="#BBCCE0"
              multiline
              value={text}
              onChangeText={setText}
              autoFocus
            />
          </View>

          <View style={cp.toolbar}>
            <TouchableOpacity style={cp.toolBtn}>
              <Text style={cp.toolIcon}>🖼</Text>
            </TouchableOpacity>
            <TouchableOpacity style={cp.toolBtn}>
              <Text style={cp.toolIcon}>📎</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const cp = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F4FA' },
  closeBtn:    { fontSize: 18, color: '#555', padding: 4 },
  title:       { fontSize: 16, fontWeight: '700', color: '#111' },
  postBtn:     { backgroundColor: '#2563C7', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 6 },
  postBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  input:       { flex: 1, fontSize: 15, color: '#2D3A5A', lineHeight: 22, minHeight: 100 },
  toolbar:     { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F0F4FA', gap: 16, position: 'absolute', bottom: 0, left: 0, right: 0 },
  toolBtn:     { padding: 4 },
  toolIcon:    { fontSize: 22 },
});

// ─── Moment Card ──────────────────────────────────────────────────────────────
function MomentCard({
  post,
  onLike,
  onOpenDetail,
}: {
  post: Post;
  onLike: () => void;
  onOpenDetail: () => void;
}) {
  return (
    <TouchableOpacity style={mc.card} onPress={onOpenDetail} activeOpacity={0.92}>
      <View style={mc.header}>
        <Avatar name={post.author} size={38} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={mc.author}>{post.author}</Text>
          <Text style={mc.course}>{post.course}</Text>
        </View>
        <Text style={mc.time}>{post.time}</Text>
      </View>

      <Text style={mc.text} numberOfLines={3}>{post.text}</Text>

      {post.image ? (
        <Image source={{ uri: post.image }} style={mc.image} />
      ) : (
        <ImagePlaceholder />
      )}

      <View style={mc.actions}>
        <LikeButton liked={post.liked} count={post.likes} onPress={onLike} />
        <TouchableOpacity style={st.actionBtn} onPress={onOpenDetail}>
          <Text style={[st.actionIcon, { color: '#8A98B4' }]}>💬</Text>
          <Text style={st.actionCount}>{post.comments.length}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const mc = StyleSheet.create({
  card:    { backgroundColor: '#fff', marginHorizontal: 0, marginBottom: 8, paddingHorizontal: 16, paddingVertical: 14 },
  header:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  author:  { fontSize: 14, fontWeight: '700', color: '#111' },
  course:  { fontSize: 11, color: '#8A98B4', marginTop: 1 },
  time:    { fontSize: 11, color: '#BBCCE0' },
  text:    { fontSize: 14, color: '#2D3A5A', lineHeight: 20, marginBottom: 10 },
  image:   { width: '100%', height: 180, borderRadius: 10, marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F5F7FA' },
});

// ─── Notifications Modal ──────────────────────────────────────────────────────
function NotificationsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const tabs = ['All', 'Comments', 'New Study Moments', 'Likes'];
  const [tab, setTab] = useState('All');
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={nm.header}>
          <TouchableOpacity onPress={onClose}><Text style={nm.close}>✕</Text></TouchableOpacity>
          <Text style={nm.title}>Study Moments Notices</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={nm.tabsRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {tabs.map(t => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} style={[nm.tab, tab === t && nm.tabActive]}>
              <Text style={[nm.tabText, tab === t && nm.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#BBCCE0', fontSize: 14 }}>No notifications yet</Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const nm = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F4FA' },
  close:        { fontSize: 18, color: '#555', marginRight: 12 },
  title:        { fontSize: 16, fontWeight: '700', color: '#111' },
  tabsRow:      { borderBottomWidth: 1, borderBottomColor: '#F0F4FA', maxHeight: 48 },
  tab:          { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  tabActive:    { backgroundColor: '#EBF2FF' },
  tabText:      { fontSize: 13, color: '#8A98B4' },
  tabTextActive: { color: '#2563C7', fontWeight: '600' },
});

// ─── Shared action styles ─────────────────────────────────────────────────────
const st = StyleSheet.create({
  actionBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionIcon:  { fontSize: 18 },
  actionCount: { fontSize: 13, color: '#8A98B4', fontWeight: '500' },
  imagePlaceholder: { width: '100%', height: 160, borderRadius: 10, backgroundColor: '#F0F4FA', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const CURRENT_USER = 'N';

export default function MomentsScreen() {
  const [posts, dispatch]         = useReducer(reducer, INITIAL_POSTS);
  const [detailPost, setDetailPost] = useState<Post | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const openDetail = (post: Post) => setDetailPost(post);
  const closeDetail = () => setDetailPost(null);

  // Keep detail post in sync with state
  const syncedDetailPost = detailPost ? posts.find(p => p.id === detailPost.id) ?? null : null;

  const renderItem = useCallback(({ item }: { item: Post }) => (
    <MomentCard
      post={item}
      onLike={() => dispatch({ type: 'TOGGLE_LIKE', id: item.id })}
      onOpenDetail={() => openDetail(item)}
    />
  ), [posts]);

  const insets = useSafeAreaInsets();

  return (
    <View style={ms.screen}>
      {/* Header */}
      <View style={[ms.header, { paddingTop: insets.top + 10 }]}>
        <View style={ms.searchBox}>
          <Text style={ms.searchIcon}>🔍</Text>
          <Text style={ms.searchPlaceholder}>Search</Text>
        </View>
        <TouchableOpacity onPress={() => setShowNotifs(true)} style={ms.iconBtn}>
          <Text style={{ fontSize: 20 }}>🔔</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowCreate(true)} style={ms.iconBtn}>
          <Text style={{ fontSize: 20, color: '#2563C7' }}>✏️</Text>
        </TouchableOpacity>
      </View>

      {/* Feed */}
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 32 }}
        ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2563C7" />
        }
      />

      {/* Modals */}
      <CreatePostModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onPost={(text) => {
          dispatch({
            type: 'ADD_POST',
            post: {
              id: Date.now().toString(),
              author: 'You',
              avatar: '',
              course: 'BSIT · Student',
              time: 'Just now',
              text,
              likes: 0,
              liked: false,
              comments: [],
            },
          });
        }}
        currentUser={CURRENT_USER}
      />

      <DetailModal
        post={syncedDetailPost}
        visible={!!syncedDetailPost}
        onClose={closeDetail}
        onLike={() => syncedDetailPost && dispatch({ type: 'TOGGLE_LIKE', id: syncedDetailPost.id })}
        onAddComment={(text) => {
          if (!syncedDetailPost) return;
          dispatch({
            type: 'ADD_COMMENT',
            id: syncedDetailPost.id,
            comment: {
              id: Date.now().toString(),
              author: 'You',
              avatar: '',
              text,
              time: 'Just now',
            },
          });
        }}
        onDeleteComment={(commentId) => syncedDetailPost && dispatch({ type: 'DELETE_COMMENT', postId: syncedDetailPost.id, commentId })}
        onEditComment={(commentId, text) => syncedDetailPost && dispatch({ type: 'EDIT_COMMENT', postId: syncedDetailPost.id, commentId, text })}
        currentUser={CURRENT_USER}
      />

      <NotificationsModal visible={showNotifs} onClose={() => setShowNotifs(false)} />
    </View>
  );
}

const ms = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: '#F5F7FA' },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F4FA', gap: 8 },
  searchBox:   { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4FA', borderRadius: 20, paddingHorizontal: 12, height: 36, gap: 6 },
  searchIcon:  { fontSize: 13 },
  searchPlaceholder: { fontSize: 14, color: '#BBCCE0' },
  iconBtn:     { padding: 6 },
});