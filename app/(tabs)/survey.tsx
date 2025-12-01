import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

type SurveyItem = {
  surveyID: string;
  title: string;
  description?: string;
  status: 'IN_PROGRESS' | 'NOT_STARTED' | 'COMPLETED' | 'ABANDONED';
  userID?: string;
  currentQuestionID?: string;
  completedQuestionIds?: string[] | null;
};

export default function SurveyScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SurveyItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchSurveys = async (forceRefetch?: boolean) => {
      let token = await AsyncStorage.getItem('authToken');
      if (!token && Platform.OS === 'web') {
        try {
          token = window.localStorage.getItem('authToken');
        } catch {}
      }
      if (!token) {
        router.replace('/login');
        return;
      }
      try {
        setLoading(true);
        const key = 'cache_surveys';
        if (!forceRefetch) {
          let cachedStr = await AsyncStorage.getItem(key);
          if (!cachedStr && Platform.OS === 'web') {
            try { cachedStr = window.localStorage.getItem(key); } catch {}
          }
          if (cachedStr) {
            const cached = JSON.parse(cachedStr);
            if (cached?.ts && Date.now() - cached.ts < 10000 && Array.isArray(cached.data)) {
              const mapped: SurveyItem[] = cached.data.map((d: any) => ({
                surveyID: d.surveyID,
                title: d.surveyMeta?.title ?? d.surveyID,
                description: d.surveyMeta?.description,
                status: d.status ?? 'NOT_STARTED',
                userID: d.userID,
                currentQuestionID: d.currentQuestionID,
                completedQuestionIds: d.completedQuestionIds ?? null,
              }));
              setItems(mapped);
              setLoading(false);
              return;
            }
          }
        }
        const res = await fetch(
          'https://api-backend-shy-hill-7779.fly.dev/api/v1/application/surveys',
          {
            headers: {
              Authorization: token,
            },
          }
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Failed to load surveys');
        }
        const data: Array<{
          userID: string;
          surveyID: string;
          status?: SurveyItem['status'];
          startedAt?: string;
          surveyMeta: { title: string; description?: string };
          lastUpdatedAt?: string;
          completedAt?: string;
          currentQuestionID?: string;
          completedQuestionIds?: string[] | null;
        }> = await res.json();
        const mapped: SurveyItem[] = data.map((d) => ({
          surveyID: d.surveyID,
          title: d.surveyMeta?.title ?? d.surveyID,
          description: d.surveyMeta?.description,
          status: d.status ?? 'NOT_STARTED',
          userID: d.userID,
          currentQuestionID: d.currentQuestionID,
          completedQuestionIds: d.completedQuestionIds ?? null,
        }));
        setItems(mapped);
        const payload = JSON.stringify({ ts: Date.now(), data });
        try {
          await AsyncStorage.setItem('cache_surveys', payload);
        } catch {}
        if (Platform.OS === 'web') {
          try { window.localStorage.setItem('cache_surveys', payload); } catch {}
        }
      } catch (e: any) {
        setError(e.message || 'Error fetching surveys');
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchSurveys(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSurveys(true);
    }, [])
  );

  const renderItem = ({ item }: { item: SurveyItem }) => {
    const isNotStarted = item.status === 'NOT_STARTED';
    const canTapCard = item.status === 'IN_PROGRESS';
    const openSurvey = async () => {
      const progress = {
        userID: item.userID,
        surveyID: item.surveyID,
        status: item.status,
        startedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        completedAt: '0001-01-01T00:00:00Z',
        currentQuestionID: item.currentQuestionID ?? '',
        completedQuestionIds: item.completedQuestionIds ?? [],
      };
      try {
        if (Platform.OS === 'web') {
          window.localStorage.setItem(`surveyProgress_${item.surveyID}`, JSON.stringify(progress));
        } else {
          await AsyncStorage.setItem(
            `surveyProgress_${item.surveyID}`,
            JSON.stringify(progress)
          );
        }
      } catch {}
      router.push(`/survey/${item.surveyID}`);
    };
    const CardInner = (
      <ThemedView style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
          {!isNotStarted ? <StatusBadge status={item.status} /> : null}
        </View>
        {item.description ? (
          <ThemedText style={styles.cardDescription}>{item.description}</ThemedText>
        ) : null}
        <View style={styles.cardFooter}>
          {isNotStarted ? (
            <Pressable
              onPress={openSurvey}
              style={styles.cardButton}
            >
              <ThemedText style={styles.cardButtonText}>Start</ThemedText>
            </Pressable>
          ) : null}
        </View>
      </ThemedView>
    );
    return canTapCard ? (
      <Pressable onPress={openSurvey}>{CardInner}</Pressable>
    ) : (
      CardInner
    );
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
        <ThemedText type="title">Surveys</ThemedText>
      </ThemedView>
      <ThemedView style={{ alignItems: 'center' }}>
        <ThemedText style={styles.appTitle}>DMAFB</ThemedText>
      </ThemedView>
      {loading ? (
        <ActivityIndicator />
      ) : error ? (
        <ThemedText>{error}</ThemedText>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        >
          {items.map((item) => (
            <View key={item.surveyID}>{renderItem({ item })}</View>
          ))}
        </ScrollView>
      )}
    </ParallaxScrollView>
  );
}


function StatusBadge({ status }: { status: SurveyItem['status'] }) {
  const color =
    status === 'COMPLETED'
      ? '#2ca02c'
      : status === 'IN_PROGRESS'
      ? '#4287f5'
      : status === 'NOT_STARTED'
      ? '#ff9900'
      : '#999999';
  return (
    <View style={[styles.badge, { backgroundColor: color }]}> 
      <ThemedText style={{ color: '#fff' }}>{status}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1D3D47',
    marginRight: 12,
    minWidth: 280,
    maxWidth: 320,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 6px 10px rgba(0,0,0,0.12)' }
      : {
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
          elevation: 3,
        }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
    paddingRight: 12,
    color: '#e2e8f0',
  },
  cardDescription: {
    fontSize: 13,
    opacity: 0.85,
    marginBottom: 12,
    color: '#cbd5e1',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cardButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#4287f5',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 8px rgba(0,0,0,0.12)' }
      : {
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
        }),
  },
  cardButtonDisabled: {
    backgroundColor: '#555555',
  },
  cardButtonText: {
    color: '#ffffff',
  },
  horizontalList: {
    paddingHorizontal: 16,
    alignItems: 'stretch',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  bannerImage: {
    height: '100%',
    width: '100%',
    position: 'absolute',
  },
});
