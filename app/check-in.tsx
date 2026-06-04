import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const MOODS = [
  { emoji: '😞', label: 'Rough' },
  { emoji: '😕', label: 'Low'   },
  { emoji: '😐', label: 'Okay'  },
  { emoji: '🙂', label: 'Good'  },
  { emoji: '😄', label: 'Great' },
];

const SLEEP_OPTIONS = ['Poor', 'Okay', 'Great'];

export default function CheckInScreen() {
  const router = useRouter();
  const [mood, setMood] = useState<number | null>(null);
  const [sleep, setSleep] = useState<string | null>(null);
  const [workout, setWorkout] = useState<boolean | null>(null);

  const allAnswered = mood !== null && sleep !== null && workout !== null;

  async function handleSubmit() {
    const [currentStreak, currentMomentum] = await Promise.all([
      SecureStore.getItemAsync('streak_count'),
      SecureStore.getItemAsync('momentum_score'),
    ]);
    const streak = currentStreak ? parseInt(currentStreak, 10) : 0;
    const newStreak = streak + 1;
    const newMomentum = (currentMomentum ? parseInt(currentMomentum, 10) : 0) + 50 + (newStreak * 5);
    await Promise.all([
      SecureStore.setItemAsync('streak_count', String(newStreak)),
      SecureStore.setItemAsync('last_checkin_date', todayStr()),
      SecureStore.setItemAsync('momentum_score', String(newMomentum)),
    ]);
    router.back();
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>How are you{'\n'}doing today?</Text>
        <Text style={styles.subtitle}>Complete your ritual to align your constellation.</Text>

        {/* Mood */}
        <View style={styles.card}>
          <Text style={styles.cardTag}>✦  MOOD</Text>
          <Text style={styles.cardQuestion}>How are you feeling right now?</Text>
          <View style={styles.moodRow}>
            {MOODS.map((m, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.moodBtn, mood === i && styles.moodBtnSelected]}
                onPress={() => setMood(i)}
                activeOpacity={0.75}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text style={[styles.moodLabel, mood === i && styles.moodLabelSelected]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sleep */}
        <View style={styles.card}>
          <Text style={styles.cardTag}>✦  SLEEP</Text>
          <Text style={styles.cardQuestion}>How did you sleep last night?</Text>
          <View style={styles.optionRow}>
            {SLEEP_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.optionBtn, sleep === opt && styles.optionBtnSelected]}
                onPress={() => setSleep(opt)}
                activeOpacity={0.75}
              >
                <Text style={[styles.optionText, sleep === opt && styles.optionTextSelected]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Workout */}
        <View style={styles.card}>
          <Text style={styles.cardTag}>✦  MOVEMENT</Text>
          <Text style={styles.cardQuestion}>Did you move your body today?</Text>
          <View style={styles.optionRow}>
            {([true, false] as const).map((val) => (
              <TouchableOpacity
                key={String(val)}
                style={[styles.optionBtn, workout === val && styles.optionBtnSelected]}
                onPress={() => setWorkout(val)}
                activeOpacity={0.75}
              >
                <Text style={[styles.optionText, workout === val && styles.optionTextSelected]}>
                  {val ? 'Yes' : 'No'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, !allAnswered && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!allAnswered}
          activeOpacity={0.85}
        >
          <Text style={[styles.submitText, !allAnswered && styles.submitTextDisabled]}>
            ✦  Align Your Cosmos
          </Text>
        </TouchableOpacity>

        {!allAnswered && (
          <Text style={styles.hint}>Answer all three to complete your ritual</Text>
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
    padding: 20,
    paddingTop: 8,
    paddingBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F0E6D3',
    letterSpacing: 0.3,
    marginBottom: 8,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#7B6D9A',
    marginBottom: 28,
    lineHeight: 20,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
  },
  cardTag: {
    fontSize: 10,
    color: '#C9A84C',
    letterSpacing: 3,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardQuestion: {
    fontSize: 16,
    color: '#F0E6D3',
    fontWeight: '500',
    marginBottom: 18,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.03)',
    width: 56,
  },
  moodBtnSelected: {
    borderColor: '#C9A84C',
    backgroundColor: 'rgba(200,160,80,0.12)',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 6,
  },
  moodEmoji: { fontSize: 26 },
  moodLabel: {
    fontSize: 9,
    color: '#7B6D9A',
    marginTop: 5,
    letterSpacing: 0.3,
  },
  moodLabelSelected: {
    color: '#C9A84C',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  optionBtnSelected: {
    borderColor: '#C9A84C',
    backgroundColor: 'rgba(200,160,80,0.12)',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 6,
  },
  optionText: {
    fontSize: 14,
    color: '#7B6D9A',
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#C9A84C',
  },
  submitBtn: {
    backgroundColor: '#C9A84C',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  submitBtnDisabled: {
    backgroundColor: 'rgba(200,160,80,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(200,160,80,0.18)',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: {
    color: '#030315',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 2,
  },
  submitTextDisabled: {
    color: 'rgba(200,160,80,0.35)',
  },
  hint: {
    textAlign: 'center',
    color: '#7B6D9A',
    fontSize: 12,
    marginTop: 12,
    fontStyle: 'italic',
  },
});
