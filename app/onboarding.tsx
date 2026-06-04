import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const GOALS = [
  'Lose weight',
  'Build muscle',
  'Build better habits',
  'Improve mental health',
];

async function generateLetter(
  name: string, goal: string,
  holdingBack: string, vision: string, toChange: string,
): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_api_key_here') throw new Error('No API key');

  const prompt = `You are writing a deeply personal letter from ${name}'s future self, exactly 90 days from today.

Their name is ${name}. Their main goal was: ${goal}.

Here is what they shared when they began their journey:
- What was holding them back: "${holdingBack}"
- Their vision for 90 days from now: "${vision}"
- The most important thing they wanted to change: "${toChange}"

Write a warm, honest, and deeply personal letter from ${name}'s future self to their present self. The letter should:
- Be addressed directly to ${name}
- Feel like it was genuinely written by someone who lived through this specific 90-day journey
- Acknowledge the real struggles they described, without sugarcoating
- Be specific to their goals and fears — not generic motivation
- Include a moment of real breakthrough or realization from along the way
- Be 3–4 paragraphs, emotionally resonant but not overdramatic
- Feel earned, not like a greeting card

Start with: Dear ${name},
End with: With love,\n${name} — 90 days from now

Write only the letter. No preamble or explanation.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) throw new Error(`API ${response.status}`);
  const data = await response.json();
  return data.content[0].text as string;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<string | null>(null);
  const [nameFocused, setNameFocused] = useState(false);

  // Step 2
  const [holdingBack, setHoldingBack] = useState('');
  const [vision, setVision] = useState('');
  const [toChange, setToChange] = useState('');

  const step1Ready = name.trim().length > 0 && goal !== null;
  const step2Ready = holdingBack.trim().length > 0 && vision.trim().length > 0 && toChange.trim().length > 0;

  async function handleGenerate() {
    setStep(3);
    let letter: string;
    try {
      letter = await generateLetter(name.trim(), goal!, holdingBack.trim(), vision.trim(), toChange.trim());
    } catch {
      letter = `Dear ${name},\n\nYou did it. Ninety days ago you decided to change — and you did.\n\nIt wasn't easy. There were days you almost quit. But every single morning you showed up, even when it didn't feel like it counted. It all counted.\n\nTrust the version of yourself that made this decision. They knew something.\n\nWith love,\n${name} — 90 days from now`;
    }
    await Promise.all([
      SecureStore.setItemAsync('onboarding_complete', 'true'),
      SecureStore.setItemAsync('user_name', name.trim()),
      SecureStore.setItemAsync('user_goal', goal!),
      SecureStore.setItemAsync('future_letter', letter),
      SecureStore.setItemAsync('letter_date', new Date().toISOString()),
    ]);
    router.replace('/');
  }

  // Step 3: Loading
  if (step === 3) {
    return (
      <View style={styles.loadingRoot}>
        <Text style={styles.loadingStar}>✦</Text>
        <Text style={styles.loadingTitle}>Your future self{'\n'}is writing to you…</Text>
        <ActivityIndicator color="#C9A84C" style={{ marginTop: 28 }} size="large" />
        <Text style={styles.loadingNote}>This will only take a moment</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#030315' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.appName}>Arete</Text>
        <Text style={styles.tagline}>Your path to excellence</Text>

        {step === 1 && (
          <>
            <Text style={styles.heading}>Welcome.{'\n'}Let's get started.</Text>

            <View style={styles.field}>
              <Text style={styles.label}>What's your name?</Text>
              <TextInput
                style={[styles.input, nameFocused && styles.inputFocused]}
                placeholder="Enter your name"
                placeholderTextColor="#3A3050"
                value={name}
                onChangeText={setName}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                autoCapitalize="words"
                returnKeyType="done"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>What's your main goal?</Text>
              {GOALS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.goalBtn, goal === g && styles.goalBtnSelected]}
                  onPress={() => setGoal(g)}
                >
                  <Text style={[styles.goalText, goal === g && styles.goalTextSelected]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.btn, !step1Ready && styles.btnDisabled]}
              onPress={() => setStep(2)}
              disabled={!step1Ready}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnText, !step1Ready && styles.btnTextDisabled]}>
                Continue  →
              </Text>
            </TouchableOpacity>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.heading}>Now, go{'\n'}deeper.</Text>
            <Text style={styles.subheading}>
              Your answers shape the letter your future self will write to you.
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>What's been holding you back from becoming who you want to be?</Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                placeholder="Be honest with yourself…"
                placeholderTextColor="#3A3050"
                value={holdingBack}
                onChangeText={setHoldingBack}
                multiline
                blurOnSubmit
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Describe your life in 90 days — if everything goes right.</Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                placeholder="Paint the picture…"
                placeholderTextColor="#3A3050"
                value={vision}
                onChangeText={setVision}
                multiline
                blurOnSubmit
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>What's the one thing you've always known you need to change?</Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                placeholder="The thing you avoid thinking about…"
                placeholderTextColor="#3A3050"
                value={toChange}
                onChangeText={setToChange}
                multiline
                blurOnSubmit
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, !step2Ready && styles.btnDisabled]}
              onPress={handleGenerate}
              disabled={!step2Ready}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnText, !step2Ready && styles.btnTextDisabled]}>
                ✦  Generate My Letter
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#030315',
    padding: 24,
    paddingTop: 72,
    paddingBottom: 48,
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: '#030315',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingStar: {
    fontSize: 52,
    color: '#C9A84C',
    marginBottom: 24,
  },
  loadingTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F0E6D3',
    textAlign: 'center',
    lineHeight: 36,
  },
  loadingNote: {
    marginTop: 20,
    fontSize: 13,
    color: '#7B6D9A',
    fontStyle: 'italic',
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#C9A84C',
    letterSpacing: 4,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 12,
    color: '#7B6D9A',
    letterSpacing: 1.5,
    marginBottom: 44,
  },
  heading: {
    fontSize: 30,
    fontWeight: '800',
    color: '#F0E6D3',
    marginBottom: 8,
    lineHeight: 38,
  },
  subheading: {
    fontSize: 13,
    color: '#7B6D9A',
    marginBottom: 32,
    lineHeight: 20,
  },
  field: {
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    color: '#A090C0',
    marginBottom: 10,
    lineHeight: 20,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: '#F0E6D3',
    fontSize: 15,
  },
  inputFocused: {
    borderColor: '#C9A84C',
  },
  inputMulti: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  goalBtn: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  goalBtnSelected: {
    borderColor: '#C9A84C',
    backgroundColor: 'rgba(200,160,80,0.10)',
  },
  goalText: {
    color: '#7B6D9A',
    fontSize: 15,
    fontWeight: '500',
  },
  goalTextSelected: {
    color: '#C9A84C',
  },
  btn: {
    backgroundColor: '#C9A84C',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  btnDisabled: {
    backgroundColor: 'rgba(200,160,80,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(200,160,80,0.18)',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnText: {
    color: '#030315',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  btnTextDisabled: {
    color: 'rgba(200,160,80,0.35)',
  },
  backBtn: {
    alignItems: 'center',
    paddingTop: 20,
  },
  backText: {
    color: '#7B6D9A',
    fontSize: 14,
  },
});
