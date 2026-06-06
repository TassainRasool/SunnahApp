import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Share,
} from 'react-native';
import {
  addBookmark,
  removeBookmark,
  isBookmarked,
  getNote,
  saveNote,
  addRecent,
} from '../../services/storage';
import { colors, spacing, radius } from '../../utils/theme';

export default function ReaderScreen({ route, navigation }) {
  const { hadith } = route.params || {};
  const [bookmarked, setBookmarked] = useState(false);
  const [note, setNote] = useState('');
  const [editingNote, setEditingNote] = useState(false);

  const collectionName = hadith?.collectionName || 'bukhari';
  const hadithNumber = hadith?.hadithnumber || hadith?.hadithNumber;

  useEffect(() => {
    if (hadith) {
      checkBookmark();
      loadNote();
      addRecent(hadith);
      navigation.setOptions({ title: collectionName });
    }
  }, [hadith]);

  const checkBookmark = async () => {
    const result = await isBookmarked(collectionName, hadithNumber);
    setBookmarked(result);
  };

  const loadNote = async () => {
    const n = await getNote(collectionName, hadithNumber);
    setNote(n);
  };

  const toggleBookmark = async () => {
    if (bookmarked) {
      await removeBookmark(collectionName, hadithNumber);
      setBookmarked(false);
    } else {
      await addBookmark(hadith);
      setBookmarked(true);
    }
  };

  const handleShare = async () => {
    const text = hadith?.text || '';
    const ref = `${collectionName} #${hadithNumber}`;
    await Share.share({ message: `"${text}"\n\n— ${ref}\n\nShared via Sunnah App` });
  };

  const handleSaveNote = async () => {
    await saveNote(collectionName, hadithNumber, note);
    setEditingNote(false);
  };

  const grade = hadith?.grades?.[0]?.grade || '';
  const reference = hadith?.reference?.book
    ? `Book ${hadith.reference.book}, Hadith ${hadith.reference.hadith}`
    : '';

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: colors.primary, fontSize: 16 }}>←</Text>
          <Text style={styles.backText}>{collectionName}</Text>
        </TouchableOpacity>
        <View style={styles.topActions}>
          <TouchableOpacity onPress={toggleBookmark} style={styles.actionBtn}>
            <Text style={{ fontSize: 20 }}>{bookmarked ? '🔖' : '📌'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.actionBtn}>
            <Text style={{ fontSize: 20 }}>📤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Hadith number badge */}
        <View style={styles.numberRow}>
          <Text style={styles.hadithNumber}>Hadith #{hadithNumber}</Text>
          {grade ? (
            <View style={styles.gradeBadge}>
              <Text style={styles.gradeText}>{grade}</Text>
            </View>
          ) : null}
        </View>

        {/* Arabic */}
        {hadith?.arabic ? (
          <View style={styles.arabicCard}>
            <Text style={styles.arabicText}>{hadith.arabic}</Text>
          </View>
        ) : null}

        {/* English */}
        <View style={styles.bodyCard}>
          <Text style={styles.bodyText}>{hadith?.text || ''}</Text>
          {hadith?.sectionName ? (
            <Text style={styles.narrator}>— {hadith.sectionName}</Text>
          ) : null}
          {reference ? (
            <Text style={styles.reference}>{reference}</Text>
          ) : null}
        </View>

        {/* Notes */}
        <View style={styles.notesSection}>
          <View style={styles.notesHeader}>
            <Text style={styles.notesLabel}>MY NOTES</Text>
            <TouchableOpacity onPress={() => setEditingNote(!editingNote)}>
              <Text style={styles.editNote}>{editingNote ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>
          {editingNote ? (
            <>
              <TextInput
                style={styles.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder="Write your reflection..."
                placeholderTextColor={colors.textDim}
                multiline
                autoFocus
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNote}>
                <Text style={styles.saveBtnText}>Save Note</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={() => setEditingNote(true)}>
              <Text style={note ? styles.noteText : styles.notePlaceholder}>
                {note || 'Tap to add a personal note or reflection...'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backText: { color: colors.primary, fontSize: 15 },
  topActions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { padding: spacing.xs },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 40 },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  hadithNumber: { fontSize: 13, color: colors.gold, fontWeight: '500' },
  gradeBadge: {
    borderWidth: 0.5,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.successBg,
    borderColor: colors.success,
  },
  gradeText: { fontSize: 11, color: colors.success },
  arabicCard: {
    backgroundColor: '#16163a',
    borderRadius: radius.md,
    borderWidth: 0.5,
    borderColor: '#2a2a55',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  arabicText: {
    fontSize: 20,
    color: colors.arabic,
    textAlign: 'right',
    lineHeight: 36,
  },
  bodyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 0.5,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  bodyText: { fontSize: 15, color: colors.text, lineHeight: 26 },
  narrator: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  reference: { fontSize: 12, color: colors.textDim, marginTop: spacing.xs },
  notesSection: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 0.5,
    borderColor: colors.border,
    padding: spacing.md,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  notesLabel: {
    fontSize: 10,
    color: colors.textDim,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  editNote: { fontSize: 13, color: colors.primary },
  noteText: { fontSize: 14, color: colors.text, lineHeight: 22 },
  notePlaceholder: { fontSize: 14, color: colors.textDim, fontStyle: 'italic' },
  noteInput: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  saveBtn: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.sm,
    padding: spacing.sm,
    alignItems: 'center',
  },
  saveBtnText: { color: colors.primary, fontWeight: '500' },
});
