import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, useWindowDimensions, StatusBar,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const HABITS = [
  { id: 'mood',    name: 'Mood',    emoji: '✨', x: 0.14, y: 0.70 },
  { id: 'move',    name: 'Move',    emoji: '🔥', x: 0.42, y: 0.52 },
  { id: 'sleep',   name: 'Sleep',   emoji: '🌙', x: 0.74, y: 0.66 },
  { id: 'focus',   name: 'Focus',   emoji: '💎', x: 0.27, y: 0.28 },
  { id: 'nourish', name: 'Nourish', emoji: '⚡', x: 0.60, y: 0.18 },
  { id: 'reflect', name: 'Reflect', emoji: '🌟', x: 0.86, y: 0.38 },
];

const CONNECTIONS = [[0,1],[1,2],[1,3],[3,4],[4,5],[2,5],[0,3]];

const BG_STARS: { l: `${number}%`; t: `${number}%`; s: number; o: number }[] = [
  { l:'6%',  t:'4%',  s:1.5, o:0.7 }, { l:'21%', t:'2%',  s:1,   o:0.5 },
  { l:'44%', t:'7%',  s:2,   o:0.6 }, { l:'67%', t:'3%',  s:1,   o:0.4 },
  { l:'84%', t:'11%', s:1.5, o:0.7 }, { l:'93%', t:'2%',  s:1,   o:0.5 },
  { l:'2%',  t:'24%', s:1,   o:0.4 }, { l:'17%', t:'17%', s:2,   o:0.6 },
  { l:'54%', t:'14%', s:1,   o:0.5 }, { l:'77%', t:'21%', s:1.5, o:0.7 },
  { l:'96%', t:'29%', s:1,   o:0.4 }, { l:'9%',  t:'44%', s:1.5, o:0.5 },
  { l:'89%', t:'47%', s:2,   o:0.6 }, { l:'4%',  t:'61%', s:1,   o:0.4 },
  { l:'91%', t:'64%', s:1.5, o:0.7 }, { l:'14%', t:'81%', s:1,   o:0.5 },
  { l:'51%', t:'89%', s:2,   o:0.6 }, { l:'79%', t:'84%', s:1,   o:0.4 },
  { l:'34%', t:'94%', s:1.5, o:0.5 }, { l:'66%', t:'91%', s:1,   o:0.7 },
  { l:'38%', t:'35%', s:1,   o:0.4 }, { l:'72%', t:'50%', s:1.5, o:0.5 },
];

const CONST_HEIGHT = 320;

function ConstellationLine({ x1, y1, x2, y2 }: { x1:number; y1:number; x2:number; y2:number }) {
  const dx = x2 - x1, dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return (
    <View style={{
      position: 'absolute',
      width: length,
      height: 1,
      backgroundColor: 'rgba(200,160,80,0.22)',
      left: (x1 + x2) / 2 - length / 2,
      top: (y1 + y2) / 2,
      transform: [{ rotate: `${angle}deg` }],
    }} />
  );
}

function HabitStar({
  habit, completed, px, py,
}: { habit: typeof HABITS[0]; completed: boolean; px: number; py: number }) {
  return (
    <View style={{ position: 'absolute', left: px - 30, top: py - 34, alignItems: 'center', width: 60 }}>
      <View style={[styles.starCircle, completed && styles.starCircleDone]}>
        <Text style={styles.starEmoji}>{habit.emoji}</Text>
      </View>
      <Text style={[styles.starLabel, completed && styles.starLabelDone]}>{habit.name}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const constWidth = width - 32;

  const [loading, setLoading] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [userName, setUserName] = useState('');
  const [streak, setStreak] = useState(0);
  const [momentum, setMomentum] = useState(0);
  const [checkedInToday, setCheckedInToday] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const [done, name, count, lastDate, mom] = await Promise.all([
          SecureStore.getItemAsync('onboarding_complete'),
          SecureStore.getItemAsync('user_name'),
          SecureStore.getItemAsync('streak_count'),
          SecureStore.getItemAsync('last_checkin_date'),
          SecureStore.getItemAsync('momentum_score'),
        ]);
        setOnboardingDone(!!done);
        setUserName(name ?? '');
        setStreak(count ? parseInt(count, 10) : 0);
        setMomentum(mom ? parseInt(mom, 10) : 0);
        setCheckedInToday(lastDate === todayStr());
        setLoading(false);
      }
      load();
    }, [])
  );

  async function handleReset() {
    await Promise.all([
      SecureStore.deleteItemAsync('onboarding_complete'),
      SecureStore.deleteItemAsync('user_name'),
      SecureStore.deleteItemAsync('user_goal'),
      SecureStore.deleteItemAsync('streak_count'),
      SecureStore.deleteItemAsync('last_checkin_date'),
      SecureStore.deleteItemAsync('momentum_score'),
      SecureStore.deleteItemAsync('future_letter'),
      SecureStore.deleteItemAsync('letter_date'),
    ]);
    router.replace('/onboarding');
  }

  if (loading) return <View style={{ flex: 1, backgroundColor: '#030315' }} />;
  if (!onboardingDone) return <Redirect href="/onboarding" />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {BG_STARS.map((s, i) => (
        <View key={i} style={{
          position: 'absolute',
          left: s.l,
          top: s.t,
          width: s.s,
          height: s.s,
          borderRadius: s.s / 2,
          backgroundColor: '#fff',
          opacity: s.o,
        }} />
      ))}

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name}>{userName}</Text>
          </View>
          <View style={styles.momentumBadge}>
            <Text style={styles.momentumValue}>{momentum.toLocaleString()}</Text>
            <Text style={styles.momentumLabel}>MOMENTUM</Text>
          </View>
        </View>

        {/* Streak pill */}
        <View style={styles.streakRow}>
          <View style={styles.streakPill}>
            <Text style={styles.streakFlame}>🔥</Text>
            <Text style={styles.streakCount}>{streak}</Text>
            <Text style={styles.streakText}> day streak</Text>
          </View>
        </View>

        {/* Constellation */}
        <Text style={styles.sectionLabel}>YOUR CONSTELLATION</Text>
        <View style={{ width: constWidth, height: CONST_HEIGHT, alignSelf: 'center', marginBottom: 32 }}>
          {CONNECTIONS.map(([a, b], i) => {
            const s1 = HABITS[a], s2 = HABITS[b];
            return (
              <ConstellationLine
                key={i}
                x1={s1.x * constWidth} y1={s1.y * CONST_HEIGHT}
                x2={s2.x * constWidth} y2={s2.y * CONST_HEIGHT}
              />
            );
          })}
          {HABITS.map((h) => (
            <HabitStar
              key={h.id}
              habit={h}
              completed={checkedInToday}
              px={h.x * constWidth}
              py={h.y * CONST_HEIGHT}
            />
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.checkInBtn, checkedInToday && styles.checkInBtnDone]}
          onPress={() => router.push('/check-in')}
          disabled={checkedInToday}
          activeOpacity={0.85}
        >
          <Text style={[styles.checkInText, checkedInToday && styles.checkInTextDone]}>
            {checkedInToday ? '✦  Cosmos aligned for today' : '✦  Begin Daily Ritual'}
          </Text>
        </TouchableOpacity>

        {checkedInToday && (
          <Text style={styles.returnNote}>Return tomorrow to continue your journey</Text>
        )}

        {/* Letter */}
        <TouchableOpacity
          style={styles.letterBtn}
          onPress={() => router.push('/letter')}
          activeOpacity={0.8}
        >
          <Text style={styles.letterBtnIcon}>🔮</Text>
          <Text style={styles.letterBtnText}>Letter from your future self</Text>
        </TouchableOpacity>

        {/* DEV: Reset */}
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.6}>
          <Text style={styles.resetText}>Reset App (dev only)</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#030315',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  greeting: {
    fontSize: 12,
    color: '#7B6D9A',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F0E6D3',
    letterSpacing: 0.3,
  },
  momentumBadge: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(200,160,80,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(200,160,80,0.22)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  momentumValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#C9A84C',
    letterSpacing: 0.5,
  },
  momentumLabel: {
    fontSize: 9,
    color: '#7B6D9A',
    letterSpacing: 2.5,
  },
  streakRow: {
    alignItems: 'center',
    marginBottom: 28,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  streakFlame: { fontSize: 15 },
  streakCount: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F0E6D3',
    marginLeft: 6,
  },
  streakText: {
    fontSize: 13,
    color: '#7B6D9A',
  },
  sectionLabel: {
    fontSize: 10,
    color: '#7B6D9A',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 8,
  },
  starCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starCircleDone: {
    backgroundColor: 'rgba(200,160,80,0.14)',
    borderColor: '#C9A84C',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 14,
    elevation: 10,
  },
  starEmoji: { fontSize: 20 },
  starLabel: {
    fontSize: 9,
    color: '#7B6D9A',
    marginTop: 5,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  starLabelDone: {
    color: '#C9A84C',
  },
  checkInBtn: {
    backgroundColor: '#C9A84C',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  checkInBtnDone: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(200,160,80,0.28)',
    shadowOpacity: 0,
    elevation: 0,
  },
  checkInText: {
    color: '#030315',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 2,
  },
  checkInTextDone: {
    color: 'rgba(200,160,80,0.6)',
  },
  returnNote: {
    textAlign: 'center',
    color: '#7B6D9A',
    fontSize: 12,
    marginTop: 14,
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  letterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(200,160,80,0.2)',
    backgroundColor: 'rgba(200,160,80,0.05)',
  },
  letterBtnIcon: { fontSize: 18 },
  letterBtnText: {
    color: '#C9A84C',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  resetBtn: {
    alignItems: 'center',
    marginTop: 32,
    paddingVertical: 8,
  },
  resetText: {
    color: '#3A3050',
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
