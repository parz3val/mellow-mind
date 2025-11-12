import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
  Alert,
  Button,
  StyleSheet,
  Switch
} from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';

export default function SurveyScreen() {
  const [feeling, setFeeling] = useState(3);
  const [productivity, setProductivity] = useState(3);
  const [connected, setConnected] = useState(3);
  const [breaks, setBreaks] = useState(false);
  const [stress, setStress] = useState(3);
  const [sleep, setSleep] = useState(3);

  const handleSubmit = async () => {
    const surveyData = {
      feeling,
      productivity,
      connected,
      breaks,
      stress,
      sleep,
      timestamp: new Date().toISOString(),
    };

    try {
      const existingData = await AsyncStorage.getItem('surveyData');
      const data = existingData ? JSON.parse(existingData) : [];
      data.push(surveyData);
      await AsyncStorage.setItem('surveyData', JSON.stringify(data));
      Alert.alert('Success', 'Your check-in has been submitted.');
    } catch (error) {
      console.error('Failed to save data', error);
      Alert.alert('Error', 'Failed to submit your check-in.');
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
        <ThemedText type="title">Your Daily Check-in</ThemedText>
      </ThemedView>
      <ThemedView style={styles.questionContainer}>
        <ThemedText style={styles.question}>How are you feeling today?</ThemedText>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={5}
          step={1}
          value={feeling}
          onValueChange={setFeeling}
        />
        <ThemedText>{feeling}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.questionContainer}>
        <ThemedText style={styles.question}>How productive were you today?</ThemedText>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={5}
          step={1}
          value={productivity}
          onValueChange={setProductivity}
        />
        <ThemedText>{productivity}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.questionContainer}>
        <ThemedText style={styles.question}>How connected do you feel to your team?</ThemedText>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={5}
          step={1}
          value={connected}
          onValueChange={setConnected}
        />
        <ThemedText>{connected}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.questionContainer}>
        <ThemedText style={styles.question}>How stressed have you felt today?</ThemedText>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={5}
          step={1}
          value={stress}
          onValueChange={setStress}
        />
        <ThemedText>{stress}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.questionContainer}>
        <ThemedText style={styles.question}>How well did you sleep last night?</ThemedText>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={5}
          step={1}
          value={sleep}
          onValueChange={setSleep}
        />
        <ThemedText>{sleep}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.switchContainer}>
        <ThemedText style={styles.question}>Did you take breaks today?</ThemedText>
        <Switch value={breaks} onValueChange={setBreaks} />
      </ThemedView>

      <Button title="Submit Check-In" onPress={handleSubmit} />
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questionContainer: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
  },
  question: {
    fontSize: 18,
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  bannerImage: {
    height: '100%',
    width: '100%',
    position: 'absolute',
  },
});