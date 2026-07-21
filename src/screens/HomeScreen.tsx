import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
      <ScrollView
        contentContainerStyle={[styles.content, { paddingHorizontal: theme.spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.brandMark, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.brandMarkText}>RC</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            hitSlop={12}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="settings-outline" size={20} color={theme.colors.text} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Welcome</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Collect personal information, capture a photo, and save it directly to Google
            Sheets and Drive.
          </Text>
        </View>

        <Button
          label="New Registration"
          onPress={() => navigation.navigate('RegistrationForm')}
          style={styles.primaryAction}
        />

        <View style={styles.tileRow}>
          <ActionTile
            icon="qr-code-outline"
            label="Scan QR Code"
            onPress={() => navigation.navigate('Scan')}
          />
          <ActionTile
            icon="search-outline"
            label="Search Records"
            onPress={() => navigation.navigate('Search')}
          />
        </View>

        {pendingCount > 0 ? (
          <Card style={styles.pendingCard}>
            <View style={styles.pendingRow}>
              <Ionicons name="cloud-upload-outline" size={20} color={theme.colors.warning} />
              <View style={styles.pendingText}>
                <Text style={{ color: theme.colors.warning, fontWeight: '600' }}>
                  {pendingCount} submission{pendingCount > 1 ? 's' : ''} waiting to sync
                </Text>
                <Text style={{ color: theme.colors.textMuted, marginTop: 2, fontSize: 13 }}>
                  They will upload automatically once you're back online.
                </Text>
              </View>
            </View>
          </Card>
        ) : null}

        <View style={styles.spacer} />

        <Pressable
          onPress={() => navigation.navigate('Admin')}
          style={({ pressed }) => [styles.adminLink, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="shield-checkmark-outline" size={14} color={theme.colors.textMuted} />
          <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '500' }}>Admin</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionTile({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.tileWrapper}>
      {({ pressed }) => (
        <Card style={[styles.tile, { opacity: pressed ? 0.75 : 1 }]}>
          <View style={[styles.tileIcon, { backgroundColor: theme.colors.surfaceAlt }]}>
            <Ionicons name={icon} size={22} color={theme.colors.primary} />
          </View>
          <Text style={[styles.tileLabel, { color: theme.colors.text }]}>{label}</Text>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingTop: 8, paddingBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandMark: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { alignItems: 'center', marginTop: 36, marginBottom: 36, paddingHorizontal: 12 },
  title: { fontSize: 30, fontWeight: '700', marginBottom: 10, letterSpacing: 0.2 },
  subtitle: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  primaryAction: { marginBottom: 14 },
  tileRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  tileWrapper: { flex: 1 },
  tile: { alignItems: 'center', paddingVertical: 20 },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tileLabel: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  pendingCard: { marginTop: 20 },
  pendingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  pendingText: { flex: 1 },
  spacer: { flex: 1, minHeight: 24 },
  adminLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
});
