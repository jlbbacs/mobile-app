import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { storageService } from '../services/storageService';
import { fetchDashboardStats, listRegistrations } from '../services/registrationService';
import { exportRecordsAsCsv } from '../utils/exportCsv';
import { toFriendlyMessage } from '../utils/errorMessages';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ErrorBanner } from '../components/ErrorBanner';
import type { AdminStats } from '../types/settings';
import type { DashboardStats } from '../types/registration';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Admin'>;

export default function AdminScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { settings } = useSettings();
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [stats, setStats] = useState<AdminStats>({ submissionCount: 0, pendingUploads: 0 });
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [dashboardError, setDashboardError] = useState<string | undefined>();
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { queue, retryNow } = useOfflineQueue();

  useEffect(() => {
    if (!unlocked) return;
    void storageService.getAdminStats().then(setStats);
  }, [unlocked, queue]);

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    setDashboardError(undefined);
    try {
      setDashboard(await fetchDashboardStats(settings.apiEndpoint));
    } catch (err) {
      setDashboardError(toFriendlyMessage(err));
    } finally {
      setDashboardLoading(false);
    }
  }, [settings.apiEndpoint]);

  useEffect(() => {
    if (unlocked) void loadDashboard();
  }, [unlocked, loadDashboard]);

  const handleUnlock = () => {
    if (password === settings.adminPassword) {
      setUnlocked(true);
      setError(undefined);
    } else {
      setError('Incorrect password.');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const records = await listRegistrations(settings.apiEndpoint);
      await exportRecordsAsCsv(records);
    } catch (err) {
      setDashboardError(toFriendlyMessage(err));
    } finally {
      setExporting(false);
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

        {dashboardError ? <ErrorBanner message={dashboardError} onRetry={() => void loadDashboard()} /> : null}

        {dashboard ? (
          <View>
            <View style={styles.tileRow}>
              <StatTile label="Total Registered" value={String(dashboard.total)} theme={theme} />
              <StatTile label="Today" value={String(dashboard.today)} theme={theme} />
            </View>
            <View style={styles.tileRow}>
              <StatTile label="Male" value={String(dashboard.male)} theme={theme} />
              <StatTile label="Female" value={String(dashboard.female)} theme={theme} />
              <StatTile label="Other" value={String(dashboard.other)} theme={theme} />
            </View>
            <View style={styles.tileRow}>
              <StatTile label="Average Age" value={String(dashboard.averageAge)} theme={theme} />
            </View>

            {dashboard.recent.length > 0 ? (
              <Card style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Registrations</Text>
                {dashboard.recent.map((item) => (
                  <Pressable
                    key={item.registrationId}
                    onPress={() => navigation.navigate('Profile', { registrationId: item.registrationId })}
                  >
                    <View style={[styles.recentRow, { borderBottomColor: theme.colors.border }]}>
                      <View>
                        <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{item.name || '—'}</Text>
                        <Text style={{ color: theme.colors.primary, fontSize: 12, marginTop: 2 }}>
                          {item.registrationId}
                        </Text>
                      </View>
                      <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                        {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : ''}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </Card>
            ) : null}
          </View>
        ) : dashboardLoading ? (
          <Text style={{ color: theme.colors.textMuted, marginBottom: 16 }}>Loading dashboard...</Text>
        ) : null}

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Device</Text>
          <Row label="Submissions From This Device" value={String(stats.submissionCount)} theme={theme} />
          <Row
            label="Last Upload"
            value={stats.lastUploadAt ? new Date(stats.lastUploadAt).toLocaleString() : 'Never'}
            theme={theme}
          />
          <Row label="Pending Uploads" value={String(pendingUploads)} theme={theme} />
          <Row label="Failed Uploads" value={String(failedUploads)} theme={theme} />
          <Row label="Sync Status" value={pendingUploads > 0 ? 'Syncing pending items' : 'Up to date'} theme={theme} />
        </Card>

        <View style={styles.actions}>
          <Button label="Export All Data (CSV)" onPress={() => void handleExport()} loading={exporting} />
          <Button label="Search Records" variant="secondary" onPress={() => navigation.navigate('Search')} />
          {pendingUploads > 0 ? (
            <Button label="Retry Pending Uploads Now" variant="secondary" onPress={retryNow} />
          ) : null}
          <Button label="Refresh Dashboard" variant="ghost" onPress={() => void loadDashboard()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatTile({ label, value, theme }: { label: string; value: string; theme: ReturnType<typeof useTheme>['theme'] }) {
  return (
    <Card style={styles.tile}>
      <Text style={{ color: theme.colors.primary, fontSize: 24, fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>{label}</Text>
    </Card>
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
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  tileRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  tile: { flex: 1, alignItems: 'center', paddingVertical: 18 },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  actions: { gap: 10, marginBottom: 32 },
});
