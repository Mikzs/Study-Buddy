import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { C, PrimaryButton, ProgressHeader, s, T } from '../../components/AuthShared';

const STYLES = ['Visual', 'Reading/Writing', 'Group Study', 'One-on-One', 'Online', 'In-Person'];

const INITIAL_COURSES = [
  { id: 'CC106',  code: 'CC106',  name: 'Application Development and Emerging Technologies', recommended: true },
  { id: 'SIA102', code: 'SIA102', name: 'System Integration Architecture',                   recommended: true },
  { id: 'CC103',  code: 'CC103',  name: 'Data Structures and Algorithms',                     recommended: false },
  { id: 'CC104',  code: 'CC104',  name: 'Object Oriented Programming',                        recommended: false },
  { id: 'IT101',  code: 'IT101',  name: 'Introduction to Information Technology',             recommended: false },
  { id: 'NET201', code: 'NET201', name: 'Computer Networks and Communications',               recommended: false },
  { id: 'DB301',  code: 'DB301',  name: 'Database Management Systems',                        recommended: false },
  { id: 'WEB202', code: 'WEB202', name: 'Web Development Technologies',                       recommended: false },
];

const STAR_LABELS: Record<number, string> = {
  1: 'Slight help needed',
  2: 'Some help needed',
  3: 'Moderate help needed',
  4: 'Much help needed',
  5: 'Urgent help needed',
};

// ─── Star Selector ────────────────────────────────────────────────────────────
function StarSelector({ rating, onRate }: { rating: number; onRate: (r: number) => void }) {
  return (
    <View style={star.row}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity key={i} onPress={() => onRate(i)} activeOpacity={0.7} style={star.btn}>
          <Text style={[star.star, i <= rating ? star.filled : star.empty]}>★</Text>
        </TouchableOpacity>
      ))}
      {rating > 0 && <Text style={star.label}>{STAR_LABELS[rating]}</Text>}
    </View>
  );
}

const star = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap' },
  btn:    { marginRight: 2, padding: 1 },
  star:   { fontSize: 20 },
  filled: { color: C.primaryMid },
  empty:  { color: C.border },
  label:  { fontSize: 11, color: C.muted, marginLeft: 8, fontStyle: 'italic' },
});

// ─── Add Course Modal ─────────────────────────────────────────────────────────
function AddCourseModal({
  visible, onClose, onAdd,
}: { visible: boolean; onClose: () => void; onAdd: (code: string, name: string, desc: string) => void; }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [errors, setErrors] = useState({ code: '', name: '' });

  const handleSave = () => {
    const e = { code: '', name: '' };
    let valid = true;
    if (!code.trim()) { e.code = 'Course code is required'; valid = false; }
    if (!name.trim()) { e.name = 'Course name is required'; valid = false; }
    setErrors(e);
    if (!valid) return;
    onAdd(code.trim().toUpperCase(), name.trim(), desc.trim());
    setCode(''); setName(''); setDesc('');
    setErrors({ code: '', name: '' });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={ac.overlay}>
        <View style={ac.sheet}>
          <View style={ac.handle} />
          <Text style={ac.title}>Add New Course</Text>
          <Text style={ac.sub}>Fill in the details to add a course to the list.</Text>

          <Text style={T.label}>Course Code *</Text>
          <View style={[s.inputWrapper, errors.code ? s.inputWrapperError : {}]}>
            <TextInput style={s.inputField} placeholder="e.g. CC106" placeholderTextColor="#BBCCE0"
              value={code} onChangeText={(t) => { setCode(t); setErrors(p => ({ ...p, code: '' })); }}
              autoCapitalize="characters" />
          </View>
          {errors.code ? <Text style={[T.error, { marginTop: -10 }]}>{errors.code}</Text> : null}

          <Text style={T.label}>Course Name *</Text>
          <View style={[s.inputWrapper, errors.name ? s.inputWrapperError : {}]}>
            <TextInput style={s.inputField} placeholder="e.g. Data Structures and Algorithms"
              placeholderTextColor="#BBCCE0" value={name}
              onChangeText={(t) => { setName(t); setErrors(p => ({ ...p, name: '' })); }} />
          </View>
          {errors.name ? <Text style={[T.error, { marginTop: -10 }]}>{errors.name}</Text> : null}

          <Text style={T.label}>Description (Optional)</Text>
          <View style={[s.inputWrapper, { height: 80, alignItems: 'flex-start', paddingTop: 12 }]}>
            <TextInput style={[s.inputField, { textAlignVertical: 'top' }]}
              placeholder="Brief course description..." placeholderTextColor="#BBCCE0"
              value={desc} onChangeText={setDesc} multiline numberOfLines={3} />
          </View>

          <View style={ac.btnRow}>
            <TouchableOpacity style={ac.cancelBtn} onPress={onClose}>
              <Text style={ac.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ac.saveBtn} onPress={handleSave}>
              <Text style={ac.saveText}>Save Course</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const ac = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(10,24,60,0.45)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16 },
  handle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 20 },
  title:   { fontSize: 18, fontWeight: '700', color: C.primaryDark, marginBottom: 4 },
  sub:     { fontSize: 13, color: C.muted, marginBottom: 20 },
  btnRow:  { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  cancelText: { color: C.muted, fontSize: 15, fontWeight: '600' },
  saveBtn:  { flex: 1.4, height: 52, borderRadius: 14, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  saveText: { color: C.white, fontSize: 15, fontWeight: '700' },
});

// ─── Subject Picker Modal ─────────────────────────────────────────────────────
function SubjectPickerModal({
  visible, title, selectedId, selectedRating, onSelect, onClose,
}: {
  visible: boolean; title: string; selectedId: string; selectedRating: number;
  onSelect: (id: string, rating: number) => void; onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [courses, setCourses] = useState(INITIAL_COURSES);
  const [ratings, setRatings] = useState<Record<string, number>>({ [selectedId]: selectedRating });
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = courses.filter(
    (c) => c.code.toLowerCase().includes(search.toLowerCase()) ||
           c.name.toLowerCase().includes(search.toLowerCase())
  );
  const recommended = filtered.filter((c) => c.recommended);
  const others      = filtered.filter((c) => !c.recommended);

  const handleRate = (id: string, r: number) => {
    setRatings((prev) => ({ ...prev, [id]: r }));
    onSelect(id, r);
  };

  const handleAddCourse = (code: string, name: string, _desc: string) => {
    const id = code + '_' + Date.now();
    setCourses((prev) => [...prev, { id, code, name, recommended: false }]);
  };

  const renderCourse = (course: typeof INITIAL_COURSES[0]) => {
    const rating     = ratings[course.id] ?? 0;
    const isSelected = selectedId === course.id;
    return (
      <View key={course.id} style={sm.courseCard}>
        <View style={sm.courseTop}>
          <View style={{ flex: 1 }}>
            <Text style={sm.courseCode}>{course.code}</Text>
            <Text style={sm.courseName}>{course.name}</Text>
          </View>
          {isSelected && rating > 0 && (
            <View style={sm.badge}><Text style={sm.badgeText}>Selected</Text></View>
          )}
        </View>
        <StarSelector rating={rating} onRate={(r) => handleRate(course.id, r)} />
        <View style={sm.divider} />
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.white }}>
        <StatusBar barStyle="dark-content" backgroundColor={C.white} />

        <View style={sm.header}>
          <TouchableOpacity onPress={onClose} style={sm.backBtn} activeOpacity={0.7}>
            <Text style={sm.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={sm.headerTitle}>{title}</Text>
        </View>

        <View style={sm.searchRow}>
          <View style={sm.searchBox}>
            <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
            <TextInput style={sm.searchInput} placeholder="Search" placeholderTextColor="#AAAAAA"
              value={search} onChangeText={setSearch} />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={{ color: '#AAAAAA', fontSize: 16, paddingHorizontal: 4 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={sm.addBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.85}>
            <Text style={sm.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={sm.legendRow}>
          <Text style={sm.legendText}>Tap stars to rate help needed</Text>
          <View style={{ flexDirection: 'row' }}>
            <Text style={[star.star, star.filled, { fontSize: 12 }]}>★</Text>
            <Text style={sm.legendText}> = slight  </Text>
            <Text style={[star.star, star.filled, { fontSize: 12 }]}>★★★★★</Text>
            <Text style={sm.legendText}> = urgent</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {recommended.length > 0 && (
            <>
              <View style={sm.sectionHeader}>
                <Text style={sm.sectionLabel}>Recommended</Text>
              </View>
              {recommended.map(renderCourse)}
            </>
          )}
          {others.length > 0 && others.map(renderCourse)}
          {filtered.length === 0 && (
            <View style={sm.emptyState}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📚</Text>
              <Text style={sm.emptyText}>No courses found</Text>
              <Text style={sm.emptySub}>Try a different search or add a new course</Text>
            </View>
          )}
        </ScrollView>

        <View style={sm.footer}>
          <TouchableOpacity style={s.primaryBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={s.primaryBtnText}>Done</Text>
          </TouchableOpacity>
        </View>

        <AddCourseModal visible={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddCourse} />
      </SafeAreaView>
    </Modal>
  );
}

const sm = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.borderLight, backgroundColor: C.white },
  backBtn:     { marginRight: 10, padding: 4, borderRadius: 8 },
  backArrow:   { fontSize: 32, color: C.primaryDark, lineHeight: 32, includeFontPadding: false },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.primaryDark, flex: 1 },
  searchRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10, backgroundColor: C.white },
  searchBox:   { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4FA', borderRadius: 24, paddingHorizontal: 14, height: 44 },
  searchInput: { flex: 1, fontSize: 14, color: C.text, paddingVertical: 0 },
  addBtn:      { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primaryMid, alignItems: 'center', justifyContent: 'center', shadowColor: C.primaryMid, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  addBtnText:  { color: C.white, fontSize: 24, lineHeight: 26, fontWeight: '300', includeFontPadding: false },
  legendRow:   { paddingHorizontal: 16, paddingBottom: 10, paddingTop: 6, backgroundColor: '#F8FAFD', borderBottomWidth: 1, borderBottomColor: C.borderLight, gap: 2 },
  legendText:  { fontSize: 11, color: C.subtle },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
  sectionLabel:  { fontSize: 12, fontWeight: '700', color: C.text, textTransform: 'uppercase', letterSpacing: 0.8 },
  courseCard:  { paddingHorizontal: 16, paddingTop: 14, backgroundColor: C.white },
  courseTop:   { flexDirection: 'row', alignItems: 'flex-start' },
  courseCode:  { fontSize: 15, fontWeight: '700', color: C.primaryDark, marginBottom: 2 },
  courseName:  { fontSize: 12, color: C.muted, lineHeight: 17, paddingRight: 8 },
  badge:       { backgroundColor: '#EBF2FF', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText:   { fontSize: 10, color: C.primaryMid, fontWeight: '600' },
  divider:     { height: 1, backgroundColor: C.borderLight, marginTop: 12 },
  emptyState:  { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyText:   { fontSize: 16, fontWeight: '600', color: C.text, marginBottom: 4 },
  emptySub:    { fontSize: 13, color: C.subtle, textAlign: 'center' },
  footer:      { paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 32 : 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.borderLight, backgroundColor: C.white },
});

// ─── Subject Field ────────────────────────────────────────────────────────────
function SubjectField({
  label, courseId, rating, onPress, error,
}: { label: string; courseId: string; rating: number; onPress: () => void; error?: string; }) {
  const course      = INITIAL_COURSES.find((c) => c.id === courseId);
  const displayText = course ? course.code : 'Select a subject';

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={T.label}>{label}</Text>
      <TouchableOpacity
        style={[s.dropdown, error ? s.dropdownError : {}]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={{ flex: 1 }}>
          <Text style={course ? s.dropdownTextSelected : s.dropdownText}>{displayText}</Text>
          {course && <Text style={{ fontSize: 11, color: C.subtle, marginTop: 2 }} numberOfLines={1}>{course.name}</Text>}
          {rating > 0 && (
            <View style={{ flexDirection: 'row', marginTop: 4 }}>
              {[1,2,3,4,5].map(i => (
                <Text key={i} style={{ fontSize: 13, color: i <= rating ? C.primaryMid : C.border }}>★</Text>
              ))}
              <Text style={{ fontSize: 11, color: C.muted, marginLeft: 6, marginTop: 1 }}>{STAR_LABELS[rating]}</Text>
            </View>
          )}
        </View>
        <Text style={s.dropdownArrow}>›</Text>
      </TouchableOpacity>
      {error ? <Text style={T.error}>{error}</Text> : null}
    </View>
  );
}

// ─── Inline Dropdown ──────────────────────────────────────────────────────────
function DropdownPicker({
  label, value, options, onSelect, error,
}: { label: string; value: string; options: string[]; onSelect: (v: string) => void; error?: string; }) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={T.label}>{label}</Text>
      <TouchableOpacity
        style={[s.dropdown, error ? s.dropdownError : {}]}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={value ? s.dropdownTextSelected : s.dropdownText}>{value || 'Select'}</Text>
        <Text style={s.dropdownArrow}>›</Text>
      </TouchableOpacity>
      {error ? <Text style={T.error}>{error}</Text> : null}

      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity style={s.overlay} onPress={() => setVisible(false)} activeOpacity={1}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>{label}</Text>
            <ScrollView>
              {options.map((opt) => (
                <TouchableOpacity key={opt} style={s.option} onPress={() => { onSelect(opt); setVisible(false); }}>
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

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ProfileAcademicScreen() {
  const router = useRouter();

  const [needHelpId,     setNeedHelpId]     = useState('');
  const [needHelpRating, setNeedHelpRating] = useState(0);
  const [canHelpId,      setCanHelpId]      = useState('');
  const [canHelpRating,  setCanHelpRating]  = useState(0);
  const [style,          setStyle]          = useState('');
  const [showNeedHelp,   setShowNeedHelp]   = useState(false);
  const [showCanHelp,    setShowCanHelp]    = useState(false);
  const [errors, setErrors] = useState({ needHelp: '', canHelp: '', style: '' });

  const validate = () => {
    const e = { needHelp: '', canHelp: '', style: '' };
    let valid = true;
    if (!needHelpId) { e.needHelp = 'Please select a subject'; valid = false; }
    if (!canHelpId)  { e.canHelp  = 'Please select a subject'; valid = false; }
    if (!style)      { e.style    = 'Please select a study style'; valid = false; }
    setErrors(e);
    return valid;
  };

  return (
    <SafeAreaView style={s.screen}>
      <ProgressHeader step={3} totalSteps={5} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[s.container, { paddingBottom: 48 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={T.heading}>Academic Preferences</Text>
          <Text style={T.subheading}>
            Accurate information ensures you get personalized content and services.
          </Text>

          <SubjectField
            label="Subjects You Need Help With"
            courseId={needHelpId}
            rating={needHelpRating}
            onPress={() => setShowNeedHelp(true)}
            error={errors.needHelp}
          />

          <SubjectField
            label="Subjects You Can Help Others With"
            courseId={canHelpId}
            rating={canHelpRating}
            onPress={() => setShowCanHelp(true)}
            error={errors.canHelp}
          />

          <DropdownPicker
            label="Preferred Study Style"
            value={style}
            options={STYLES}
            onSelect={(v) => { setStyle(v); setErrors({ ...errors, style: '' }); }}
            error={errors.style}
          />

          <View style={{ marginTop: 4 }}>
            <PrimaryButton
              label="Next"
              onPress={() => { if (validate()) router.push('/(profile)/profile-availability'); }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <SubjectPickerModal
        visible={showNeedHelp}
        title="Subjects I Need Help With"
        selectedId={needHelpId}
        selectedRating={needHelpRating}
        onSelect={(id, rating) => { setNeedHelpId(id); setNeedHelpRating(rating); setErrors({ ...errors, needHelp: '' }); }}
        onClose={() => setShowNeedHelp(false)}
      />
      <SubjectPickerModal
        visible={showCanHelp}
        title="Subjects You Can Help Others With"
        selectedId={canHelpId}
        selectedRating={canHelpRating}
        onSelect={(id, rating) => { setCanHelpId(id); setCanHelpRating(rating); setErrors({ ...errors, canHelp: '' }); }}
        onClose={() => setShowCanHelp(false)}
      />
    </SafeAreaView>
  );
}