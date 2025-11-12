import { Image } from 'expo-image';
import { Dimensions, StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LineChart } from 'react-native-chart-kit';

type SurveyEntry = {
  feeling: number;
  productivity: number;
  connected: number;
  breaks: boolean;
  stress: number;
  sleep: number;
  timestamp: string;
};

export default function HomeScreen() {
  const [entries, setEntries] = useState<SurveyEntry[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const existingData = await AsyncStorage.getItem('surveyData');
      const data: SurveyEntry[] = existingData ? JSON.parse(existingData) : [];
      // show most recent 7 check-ins
      const lastSeven = data.slice(-7);
      setEntries(lastSeven);
    };
    loadData();
  }, []);

  const labels = entries.map((e) => {
    const d = new Date(e.timestamp);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });

  const width = Dimensions.get('window').width - 64; // leave content padding room

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/banner2.png')}
          style={styles.bannerImage}
          contentFit="cover"
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Mellow Mind</ThemedText>
      </ThemedView>
      {entries.length === 0 ? (
        <ThemedView style={styles.stepContainer}>
          <ThemedText>No check-ins yet. Start one from the Surveys tab.</ThemedText>
        </ThemedView>
      ) : (
        <ThemedView style={{ gap: 12 }}>
          <ThemedText type="subtitle">Recent Check-ins</ThemedText>
          <LineChart
            data={{
              labels,
              datasets: [
                {
                  data: entries.map((e) => e.feeling),
                  color: (opacity = 1) => `rgba(44, 160, 44, ${opacity})`,
                  strokeWidth: 2,
                },
                {
                  data: entries.map((e) => e.productivity),
                  color: (opacity = 1) => `rgba(66, 135, 245, ${opacity})`,
                  strokeWidth: 2,
                },
                {
                  data: entries.map((e) => e.connected),
                  color: (opacity = 1) => `rgba(255, 165, 0, ${opacity})`,
                  strokeWidth: 2,
                },
                {
                  data: entries.map((e) => e.stress),
                  color: (opacity = 1) => `rgba(220, 20, 60, ${opacity})`,
                  strokeWidth: 2,
                },
                {
                  data: entries.map((e) => e.sleep),
                  color: (opacity = 1) => `rgba(128, 0, 128, ${opacity})`,
                  strokeWidth: 2,
                },
              ],
              legend: ['Feeling', 'Productivity', 'Connected', 'Stress', 'Sleep'],
            }}
            width={width}
            height={260}
            yAxisSuffix=""
            yAxisInterval={1}
            chartConfig={{
              backgroundColor: '#1D3D47',
              backgroundGradientFrom: '#1D3D47',
              backgroundGradientTo: '#1D3D47',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              propsForDots: { r: '3' },
            }}
            bezier
            fromZero
            withShadow={false}
            style={{ borderRadius: 12 }}
          />
        </ThemedView>
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
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  bannerImage: {
    height: '100%',
    width: '100%',
    position: 'absolute',
  },
});
