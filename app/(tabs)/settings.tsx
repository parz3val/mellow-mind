import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

type Profile = {
  workspace_id?: string;
  user_id?: string;
  member_id?: string;
  role?: string;
  company_name?: string;
  first_name?: string;
  last_name?: string;
};

export default function SettingsScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      let profileStr = await AsyncStorage.getItem('userProfile');
      let emailStr = await AsyncStorage.getItem('userEmail');
      if (Platform.OS === 'web') {
        try {
          profileStr = profileStr || window.localStorage.getItem('userProfile');
          emailStr = emailStr || window.localStorage.getItem('userEmail');
        } catch {}
      }
      setProfile(profileStr ? JSON.parse(profileStr) : null);
      setEmail(emailStr);
    };
    load();
  }, []);

  const logout = async () => {
    await AsyncStorage.multiRemove(['authToken', 'userProfile', 'userEmail']);
    if (Platform.OS === 'web') {
      try {
        window.localStorage.removeItem('authToken');
        window.localStorage.removeItem('userProfile');
        window.localStorage.removeItem('userEmail');
      } catch {}
    }
    router.replace('/login');
  };

  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Unknown User';
  const company = profile?.company_name || 'Unknown Company';
  const role = profile?.role || 'Member';

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={{ uri: 'https://picsum.photos/seed/dmafb-profile-header/1200/600' }}
          style={styles.bannerImage}
          contentFit="cover"
        />
      }>
      <ThemedView style={styles.container}>
        <View style={styles.profileRow}>
          <Image
            source={{ uri: 'https://picsum.photos/seed/dmafb-profile/200' }}
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.nameText}>{name}</ThemedText>
            <ThemedText>{company}</ThemedText>
            <ThemedText>Role: {role}</ThemedText>
          </View>
        </View>
        <View style={styles.actions}>
          <Pressable onPress={logout} style={styles.logoutButton}>
            <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    </ParallaxScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 999,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '700',
  },
  actions: {
    marginTop: 16,
    alignItems: 'stretch',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
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
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  bannerImage: {
    height: '100%',
    width: '100%',
    position: 'absolute',
  },
});
