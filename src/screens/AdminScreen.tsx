import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { storageService } from '../services/storageService';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { DEFAULT_ADMIN_PASSWORD } from '../constants/config';
import type { AdminStats } from '../types/settings';

export default function AdminScreen() {
  const { theme } = useTheme();
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [stats, setStats] = useState<AdminStats>({ submissionCount: 0, pendingUploads: 0 });
  const { queue, retryNow } = useOfflineQueue();

  useEffect(() => {
    if (!unlocked) return;
    void storageService.getAdminStats().then(setStats);
  }, [unlocked, queue]);

  const handleUnlock = () => {
    if (password === DEFAULT_ADMIN_PASSWORD) {
      setUnlocked(true);
      setError(undefined);
    } else {
      setError('Incorrect password.');
    }
  };

  const pendingUploads = queue.filter((item) => item.status !== 'success').length;
  const failedUploads = queue.filter((item) => item.status === 'failed').length;

  if (!unlocked) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
        <View style={styles.gateContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Admin Access</Text>
          <Input
            label="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            error={error}
          />
          <Button label="Unlock" onPress={handleUnlock} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Admin Dashboard</Text>

        <Card style={styles.section}>
          <Row label="Total Submissions" value={String(stats.submissionCount)} theme={theme} />
          <Row
            label="Last Upload"
            value={stats.lastUploadAt ? new Date(stats.lastUploadAt).toLocaleString() : 'Never'}
            theme={theme}
          />
          <Row label="Pending Uploads" value={String(pendingUploads)} theme={theme} />
          <Row label="Failed Uploads" value={String(failedUploads)} theme={theme} />
          <Row label="Sync Status" value={pendingUploads > 0 ? 'Syncing pending items' : 'Up to date'} theme={theme} />
        </Card>

        {pendingUploads > 0 ? (
          <Button label="Retry Pending Uploads Now" onPress={retryNow} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, theme }: { label: string; value: string; theme: ReturnType<typeof useTheme>['theme'] }) {
  return (
    <View style={styles.row}>
      <Text style={{ color: theme.colors.textMuted }}>{label}</Text>
      <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gateContainer: { flex: 1, justifyContent: 'center', padding: 32 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
  section: { marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
});
