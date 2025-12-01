import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
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
      <ThemedView style={styles.centered}>
        <ThemedText type="title">TBD</ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  bannerImage: {
    height: '100%',
    width: '100%',
    position: 'absolute',
  },
});
