import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../utils/theme';

const gradeColor = (grade = '') => {
  const g = grade.toLowerCase();
  if (g.includes('sahih') || g.includes('authentic')) return colors.success;
  if (g.includes('hasan') || g.includes('good')) return '#7aaaf0';
  if (g.includes('da\'if') || g.includes('weak')) return '#cc7755';
  return colors.textMuted;
};

export default function HadithCard({
  hadith,
  showArabic = true,
  showGrade = true,
  onPress,
  onBookmark,
  isBookmarked = false,
  compact = false,
}) {
  // Support both old and new data structures
  const text = hadith?.text || hadith?.hadith?.[0]?.body || '';
  const arabic = hadith?.arabic || hadith?.hadith?.[0]?.arabic || '';
  const grade = hadith?.grades?.[0]?.grade || hadith?.hadith?.[0]?.grades?.[0]?.grade || '';
  const collection = hadith?.collectionName || hadith?.collection || '';
  const number = hadith?.hadithnumber || hadith?.hadithNumber || hadith?.number || '';
  const sectionName = hadith?.sectionName || hadith?.hadith?.[0]?.chapterTitle || '';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={styles.meta}>
          {collection.charAt(0).toUpperCase() + collection.slice(1)} · #{number}
        </Text>
        <View style={styles.actions}>
          {showGrade && grade ? (
            <View style={[styles.gradeBadge, { borderColor: gradeColor(grade) }]}>
              <Text style={[styles.gradeText, { color: gradeColor(grade) }]}>{grade}</Text>
            </View>
          ) : null}
          {onBookmark && (
            <TouchableOpacity onPress={onBookmark} style={styles.iconBtn} hitSlop={8}>
              <Text style={{ fontSize: 16 }}>{isBookmarked ? '🔖' : '📌'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showArabic && arabic && !compact ? (
        <Text style={styles.arabic}>{arabic}</Text>
      ) : null}

      {showArabic && arabic && !compact ? (
        <View style={styles.divider} />
      ) : null}

      <Text style={styles.body} numberOfLines={compact ? 3 : undefined}>
        {text}
      </Text>

      {sectionName && !compact ? (
        <Text style={styles.narrator}>— {sectionName}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 0.5,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  meta: { fontSize: 12, color: colors.gold, fontWeight: '500' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  gradeBadge: {
    borderWidth: 0.5,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.successBg,
  },
  gradeText: { fontSize: 10, fontWeight: '500' },
  iconBtn: { padding: 2 },
  arabic: {
    fontSize: 17,
    color: colors.arabic,
    textAlign: 'right',
    lineHeight: 30,
    marginBottom: spacing.sm,
  },
  divider: { height: 0.5, backgroundColor: colors.border, marginVertical: spacing.sm },
  body: { fontSize: 14, color: colors.text, lineHeight: 22 },
  narrator: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm, fontStyle: 'italic' },
});
