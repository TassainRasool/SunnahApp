import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const CARD_WIDTH = Dimensions.get('window').width * 0.9;
const CARD_PADDING = 24;

export default function HadithShareCard({ hadith }) {
  if (!hadith) return null;

  const number = hadith?.hadithnumber || hadith?.hadithNumber || '';
  const collection = hadith?.collectionName || '';
  const text = hadith?.text || '';
  const arabic = hadith?.arabic || '';
  const grade = hadith?.grades?.[0]?.grade || '';
  const reference = hadith?.reference?.book
    ? `Book ${hadith.reference.book}, Hadith ${hadith.reference.hadith}`
    : '';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.goldBar} />

        <Text style={styles.header}>
          {collection.charAt(0).toUpperCase() + collection.slice(1)} · #{number}
        </Text>

        {arabic ? (
          <Text style={styles.arabic}>{arabic}</Text>
        ) : null}

        <Text style={styles.body}>{text}</Text>

        {reference ? (
          <Text style={styles.reference}>{reference}</Text>
        ) : null}

        {grade ? (
          <View style={styles.gradeRow}>
            <View style={styles.gradeBadge}>
              <Text style={styles.gradeText}>{grade}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Shared via Sunnah App</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: '#0e0e1a',
    borderRadius: 20,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: '#16163a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a55',
    padding: CARD_PADDING,
  },
  goldBar: {
    height: 3,
    backgroundColor: '#d4af7a',
    borderRadius: 2,
    marginBottom: 20,
    width: 60,
  },
  header: {
    fontSize: 13,
    color: '#d4af7a',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  arabic: {
    fontSize: 22,
    color: '#e8d5a0',
    textAlign: 'right',
    lineHeight: 40,
    marginBottom: 16,
    writingDirection: 'rtl',
  },
  body: {
    fontSize: 15,
    color: '#e8e8f0',
    lineHeight: 26,
    marginBottom: 12,
  },
  reference: {
    fontSize: 12,
    color: '#8888aa',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  gradeRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  gradeBadge: {
    backgroundColor: '#1a2a1a',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 0.5,
    borderColor: '#5a9a5a',
  },
  gradeText: {
    fontSize: 11,
    color: '#5a9a5a',
    fontWeight: '500',
  },
  footer: {
    borderTopWidth: 0.5,
    borderTopColor: '#2a2a55',
    paddingTop: 14,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#5a5a7a',
    letterSpacing: 0.5,
  },
});
