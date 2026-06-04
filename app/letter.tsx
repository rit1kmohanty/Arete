import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

function ninetyDaysFrom(iso: string) {
  const d = new Date(iso);
  d.setDate(d.getDate() + 90);
  return d.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

export default function LetterScreen() {
  const insets = useSafeAreaInsets();
  const [letter, setLetter] = useState<string | null>(null);
  const [letterDate, setLetterDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [text, date] = await Promise.all([
        SecureStore.getItemAsync('future_letter'),
        SecureStore.getItemAsync('letter_date'),
      ]);
      setLetter(text);
      setLetterDate(date);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <View style={{ flex: 1, backgroundColor: '#030315' }} />;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.seal}>🔮</Text>
        <Text style={styles.fromLabel}>FROM YOUR FUTURE SELF</Text>
        {letterDate && (
          <Text style={styles.receivedLabel}>Sealed on {formatDate(letterDate)}</Text>
        )}

        <View style={styles.letterCard}>
          {letter ? (
            <Text style={styles.letterText}>{letter}</Text>
          ) : (
            <Text style={styles.emptyText}>No letter found. Complete onboarding to generate yours.</Text>
          )}
        </View>

        {letterDate && (
          <View style={styles.horizonRow}>
            <Text style={styles.horizonLabel}>✦  Your horizon</Text>
            <Text style={styles.horizonDate}>{ninetyDaysFrom(letterDate)}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#030315',
  },
  container: {
    padding: 24,
    paddingBottom: 64,
  },
  seal: {
    fontSize: 52,
    textAlign: 'center',
    marginBottom: 14,
  },
  fromLabel: {
    textAlign: 'center',
    fontSize: 11,
    color: '#C9A84C',
    letterSpacing: 3.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  receivedLabel: {
    textAlign: 'center',
    fontSize: 12,
    color: '#7B6D9A',
    fontStyle: 'italic',
    marginBottom: 32,
  },
  letterCard: {
    backgroundColor: 'rgba(200,160,80,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(200,160,80,0.18)',
    borderRadius: 20,
    padding: 28,
    marginBottom: 28,
  },
  letterText: {
    fontSize: 16,
    color: '#F0E6D3',
    lineHeight: 30,
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 14,
    color: '#7B6D9A',
    lineHeight: 22,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  horizonRow: {
    alignItems: 'center',
    gap: 4,
  },
  horizonLabel: {
    fontSize: 11,
    color: '#7B6D9A',
    letterSpacing: 2,
  },
  horizonDate: {
    fontSize: 14,
    color: '#C9A84C',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
