import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { queue } = useOfflineQueue();
  const pendingCount = queue.filter((item) => item.status !== 'success').length;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, { padding: theme.spacing.lg }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Welcome</Text>
          <Pressable onPress={() => navigation.navigate('Settings')} hitSlop={12}>
            <Text style={{ color: theme.colors.primary, fontSize: 22 }}>⚙</Text>
          </Pressable>
        </View>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Collect personal information, capture a photo, and save it directly to Google Sheets
          and Drive.
        </Text>

        <Button
          label="New Registration"
          onPress={() => navigation.navigate('RegistrationForm')}
          style={styles.primaryAction}
        />
        <View style={styles.secondaryRow}>
          <Button
            label="Scan QR Code"
            variant="secondary"
            onPress={() => navigation.navigate('Scan')}
            style={styles.secondaryButton}
          />
          <Button
            label="Search Records"
            variant="secondary"
            onPress={() => navigation.navigate('Search')}
            style={styles.secondaryButton}
          />
        </View>

        {pendingCount > 0 ? (
          <Card style={styles.pendingCard}>
            <Text style={{ color: theme.colors.warning, fontWeight: '600' }}>
              {pendingCount} submission{pendingCount > 1 ? 's' : ''} waiting to sync
            </Text>
            <Text style={{ color: theme.colors.textMuted, marginTop: 4, fontSize: 13 }}>
              They will upload automatically once you're back online.
            </Text>
          </Card>
        ) : null}

        <Pressable onPress={() => navigation.navigate('Admin')} style={styles.adminLink}>
          <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>Admin</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 15, marginBottom: 28, lineHeight: 21 },
  primaryAction: { marginBottom: 12 },
  secondaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  secondaryButton: { flex: 1 },
  pendingCard: { marginBottom: 16 },
  adminLink: { alignSelf: 'center', marginTop: 24, padding: 8 },
});
