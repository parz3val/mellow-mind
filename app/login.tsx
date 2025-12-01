import { ThemedText } from '@/components/themed-text';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Button, Platform, StyleSheet, TextInput, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const setItem = async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      try {
        window.localStorage.setItem(key, value);
      } catch {}
      return;
    }
    await AsyncStorage.setItem(key, value);
  };

  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert('Required', 'Please enter email and password');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('https://api-backend-shy-hill-7779.fly.dev/api/v1/application/login/employee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Login failed');
      }
      const data = await res.json();
      const token: string | undefined = data?.accessToken;
      if (!token) {
        throw new Error('No accessToken returned from API');
      }
      const profile = data?.profile ? JSON.stringify(data.profile) : undefined;
      await setItem('authToken', token);
      if (profile) await setItem('userProfile', profile);
      if (email) await setItem('userEmail', email);
      router.replace('/(tabs)/survey');
    } catch (e: any) {
      Alert.alert('Login Error', e.message || 'Unable to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.page}>
      <Image
        source={require('@/assets/images/banner2.png')}
        style={styles.bgImage}
        contentFit="cover"
      />
      <View style={styles.overlay} />
      <ThemedText style={styles.appTitle}>DMAFB</ThemedText>
      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Login</ThemedText>
        <View style={styles.field}>
          <ThemedText style={styles.label}>Email</ThemedText>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            style={styles.input}
            placeholderTextColor="#6b7280"
          />
        </View>
        <View style={styles.field}>
          <ThemedText style={styles.label}>Password</ThemedText>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            style={styles.input}
            placeholderTextColor="#6b7280"
          />
        </View>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Button title="Login" onPress={onLogin} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  card: {
    width: '90%',
    maxWidth: 420,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 6px 12px rgba(0,0,0,0.12)' }
      : {
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 4,
        }),
    gap: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  field: {
    gap: 8,
  },
  label: {
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: '#9ca3af',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
  },
});
