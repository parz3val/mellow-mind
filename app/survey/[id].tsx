import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

export default function SurveyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [startedAt] = useState<string>(() => new Date().toISOString());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{
    userID?: string;
    surveyID?: string;
    status?: 'IN_PROGRESS' | 'NOT_STARTED' | 'COMPLETED' | 'ABANDONED';
    startedAt?: string;
    lastUpdatedAt?: string;
    completedAt?: string;
    currentQuestionID?: string;
    completedQuestionIds?: string[];
  } | null>(null);

  type QuestionItem = {
    questionID: string;
    text: string;
    options: string[];
    sectionTitle: string;
    scale?: string;
  };

  const flattenedQuestions: QuestionItem[] = useMemo(() => {
    if (!data?.sections) return [];
    const list: QuestionItem[] = [];
    for (const section of data.sections as any[]) {
      const opts: string[] = section?.content?.options ?? [];
      const qs: any[] = section?.content?.questions ?? [];
      for (const q of qs) {
        list.push({
          questionID: q.id,
          text: q.text,
          options: opts,
          sectionTitle: section?.title,
          scale: section?.scale,
        });
      }
    }
    // If IN_PROGRESS, skip completed question IDs
    const completed = progress?.completedQuestionIds ?? [];
    if (progress?.status === 'IN_PROGRESS' && completed.length) {
      return list.filter((q) => !completed.includes(q.questionID));
    }
    return list;
  }, [data, progress]);

  useEffect(() => {
    const fetchSurvey = async () => {
      let token = await AsyncStorage.getItem('authToken');
      if (!token && Platform.OS === 'web') {
        try {
          token = window.localStorage.getItem('authToken');
        } catch {}
      }
      if (!token) {
        setError('Missing auth token');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await fetch(`https://api-backend-shy-hill-7779.fly.dev/api/v1/survey/${id}`, {
          headers: { Authorization: token },
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Failed to load survey');
        }
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setError(e.message || 'Error fetching survey');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchSurvey();
  }, [id]);

  useEffect(() => {
    const loadProgress = async () => {
      if (!id) return;
      try {
        let stored: string | null = await AsyncStorage.getItem(`surveyProgress_${id}`);
        if (!stored && Platform.OS === 'web') {
          try {
            stored = window.localStorage.getItem(`surveyProgress_${id}`);
          } catch {}
        }
        const parsed = stored ? JSON.parse(stored) : null;
        setProgress(parsed);
      } catch {}
    };
    loadProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, data]);

  useEffect(() => {
    if (!flattenedQuestions.length) return;
    if (progress?.status === 'IN_PROGRESS' && progress?.currentQuestionID) {
      const idx = flattenedQuestions.findIndex(
        (q) => q.questionID === progress.currentQuestionID
      );
      setCurrentIndex(idx >= 0 ? idx : 0);
    } else {
      setCurrentIndex(0);
    }
  }, [flattenedQuestions, progress]);

  const submitAndNext = async () => {
    if (!selectedOption || !id) return;
    // Gather storage values
    let token = await AsyncStorage.getItem('authToken');
    if (!token && Platform.OS === 'web') {
      try { token = window.localStorage.getItem('authToken'); } catch {}
    }
    let profileStr = await AsyncStorage.getItem('userProfile');
    if (!profileStr && Platform.OS === 'web') {
      try { profileStr = window.localStorage.getItem('userProfile'); } catch {}
    }
    const userID = profileStr ? JSON.parse(profileStr)?.user_id : undefined;
    if (!token || !userID) {
      Alert.alert('Error', 'Missing auth or user profile');
      return;
    }
    const isLast = currentIndex >= flattenedQuestions.length - 1;
    const opts = flattenedQuestions[currentIndex].options;
    const idx = opts.indexOf(selectedOption);
    const value = idx >= 0 ? idx + 1 : undefined;
    const body = {
      userID,
      surveyID: id,
      startedAt,
      completedAt: isLast ? new Date().toISOString() : '0001-01-01T00:00:00Z',
      responses: [
        {
          questionID: flattenedQuestions[currentIndex].questionID,
          response: value !== undefined ? { value, label: selectedOption } : { label: selectedOption },
        },
      ],
    };
    try {
      setSubmitting(true);
      const res = await fetch('https://api-backend-shy-hill-7779.fly.dev/api/v1/application/surveys/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to submit response');
      }
      // Update local progress
      try {
        const nextIndex = currentIndex + 1;
        const nextQuestionID = flattenedQuestions[nextIndex]?.questionID ?? '';
        const newCompleted = [
          ...(progress?.completedQuestionIds ?? []),
          flattenedQuestions[currentIndex].questionID,
        ];
        const updated = {
          ...(progress ?? {}),
          userID,
          surveyID: id,
          lastUpdatedAt: new Date().toISOString(),
          currentQuestionID: isLast ? '' : nextQuestionID,
          completedQuestionIds: newCompleted,
        };
        const key = `surveyProgress_${id}`;
        if (Platform.OS === 'web') {
          window.localStorage.setItem(key, JSON.stringify(updated));
        } else {
          await AsyncStorage.setItem(key, JSON.stringify(updated));
        }
        setProgress(updated);
      } catch {}

      setSelectedOption(null);
      if (isLast) {
        // Call complete endpoint
        try {
          await fetch(
            `https://api-backend-shy-hill-7779.fly.dev/api/v1/application/surveys/complete/${id}/${userID}`,
            { method: 'POST', headers: { Authorization: token } }
          );
        } catch {}
        Alert.alert('Survey Complete', 'Thank you for your responses.');
        router.back();
      } else {
        setCurrentIndex((i) => i + 1);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/explore-banner.png')}
          style={styles.bannerImage}
          contentFit="cover"
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Survey</ThemedText>
      </ThemedView>
      {loading ? (
        <ActivityIndicator />
      ) : error ? (
        <ThemedText>{error}</ThemedText>
      ) : flattenedQuestions.length === 0 ? (
        <ThemedText>No questions available.</ThemedText>
      ) : (
        <View style={styles.questionContainer}>
          <ThemedText style={styles.sectionTitle}>
            {flattenedQuestions[currentIndex].sectionTitle}
          </ThemedText>
          {flattenedQuestions[currentIndex].scale ? (
            <ThemedText style={styles.scaleText}>
              Scale: {flattenedQuestions[currentIndex].scale}
            </ThemedText>
          ) : null}
          <ThemedText style={styles.questionText}>
            {flattenedQuestions[currentIndex].text}
          </ThemedText>
          <View style={styles.optionsContainer}>
            {flattenedQuestions[currentIndex].options.map((opt) => {
              const selected = selectedOption === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => setSelectedOption(opt)}
                  style={[styles.optionChip, selected && styles.optionChipSelected]}
                >
                  <ThemedText style={selected ? styles.optionTextSelected : undefined}>
                    {opt}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            disabled={!selectedOption || submitting}
            onPress={submitAndNext}
            style={[styles.nextButton, (!selectedOption || submitting) && styles.nextButtonDisabled]}
          >
            <ThemedText style={styles.nextButtonText}>
              {currentIndex >= flattenedQuestions.length - 1 ? 'Finish' : 'Next'}
            </ThemedText>
          </Pressable>
        </View>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questionContainer: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  scaleText: {
    opacity: 0.8,
  },
  questionText: {
    fontSize: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#9ca3af',
  },
  optionChipSelected: {
    backgroundColor: '#1D3D47',
    borderColor: '#1D3D47',
  },
  optionTextSelected: {
    color: '#ffffff',
  },
  nextButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#4287f5',
  },
  nextButtonDisabled: {
    backgroundColor: '#555555',
  },
  nextButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  bannerImage: {
    height: '100%',
    width: '100%',
    position: 'absolute',
  },
});
