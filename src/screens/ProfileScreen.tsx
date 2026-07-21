import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ErrorBanner } from '../components/ErrorBanner';
import { lookupRegistration, NetworkUnreachableError } from '../services/registrationService';
import { qrService, qrImageUrl } from '../services/qrService';
import { toFriendlyMessage } from '../utils/errorMessages';
import type { RegistrationRecord } from '../types/registration';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation, route }: Props) {
  const { registrationId } = route.params;
  const { theme } = useTheme();
  const { settings } = useSettings();
  const isOnline = useNetworkStatus();

  const [record, setRecord] = useState<RegistrationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [wasOffline, setWasOffline] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const result = await lookupRegistration(settings.apiEndpoint, registrationId);
      setRecord(result);
      setWasOffline(false);
    } catch (err) {
      if (err instanceof NetworkUnreachableError) {
        setWasOffline(true);
        setError('You are offline. The profile will load automatically once you are back online.');
      } else {
        setError(toFriendlyMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, [settings.apiEndpoint, registrationId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Offline support: the scanned ID is already stored in history; once the
  // connection returns, fetch the record automatically without user action.
  useEffect(() => {
    if (isOnline && wasOffline && !record) {
      void load();
    }
  }, [isOnline, wasOffline, record, load]);

  const fullName = record
    ? [record.firstName, record.middleName, record.lastName].filter(Boolean).join(' ')
    : '';

  const handleDownload = async () => {
    if (!record) return;
    setDownloading(true);
    setDownloadFeedback(null);
    const outcome = await qrService.download(record.registrationId, record.qrCodeUrl);
    setDownloadFeedback(outcome);
    setDownloading(false);
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ color: theme.colors.textMuted, marginTop: 12 }}>Loading profile...</Text>
          </View>
        ) : error ? (
          <ErrorBanner message={error} onRetry={() => void load()} />
        ) : record ? (
          <View>
            <Card style={[styles.section, styles.headerCard]}>
              {record.imageUrl ? (
                <Image source={{ uri: record.imageUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: theme.colors.surfaceAlt }]} />
              )}
              <Text style={[styles.name, { color: theme.colors.text }]}>{fullName}</Text>
              <Text style={[styles.registrationId, { color: theme.colors.primary }]}>
                {record.registrationId}
              </Text>
              <Text style={{ color: theme.colors.success, fontWeight: '600', marginTop: 2 }}>
                {record.status || 'Active'}
              </Text>
            </Card>

            <Card style={styles.section}>
              <Row label="Age" value={record.age} theme={theme} />
              <Row label="Sex" value={record.sex} theme={theme} />
              <Row label="Civil Status" value={record.civilStatus} theme={theme} />
              <Row label="Nationality" value={record.nationality} theme={theme} />
              <Row label="Phone Number" value={record.phoneNumber} theme={theme} />
              <Row label="Email" value={record.email} theme={theme} />
              <Row label="Complete Address" value={record.completeAddress} theme={theme} />
              <Row
                label="Registration Date"
                value={record.timestamp ? new Date(record.timestamp).toLocaleString() : ''}
                theme={theme}
              />
            </Card>

            <Card style={[styles.section, styles.qrCard]}>
              <Image
                source={{ uri: record.qrCodeUrl || qrImageUrl(record.registrationId) }}
                style={styles.qrImage}
                resizeMode="contain"
              />
              {downloadFeedback ? (
                <Text
                  style={[
                    styles.downloadFeedback,
                    { color: downloadFeedback.success ? theme.colors.success : theme.colors.error },
                  ]}
                >
                  {downloadFeedback.message}
                </Text>
              ) : null}
            </Card>

            <View style={styles.buttonGrid}>
              <Button
                label="Edit Information"
                onPress={() => navigation.navigate('EditRegistration', { record })}
                style={styles.gridButton}
              />
              <Button
                label="Save QR Code"
                variant="secondary"
                loading={downloading}
                onPress={() => void handleDownload()}
                style={styles.gridButton}
              />
              <Button
                label="Print QR"
                variant="secondary"
                onPress={() => void qrService.print(record.registrationId)}
                style={styles.gridButton}
              />
              <Button
                label="Share"
                variant="secondary"
                onPress={() => void qrService.share(record.registrationId, record.qrCodeUrl)}
                style={styles.gridButton}
              />
              <Button
                label="ID Card (Landscape)"
                variant="ghost"
                onPress={() => void qrService.printIdCard(record, 'landscape')}
                style={styles.gridButton}
              />
              <Button
                label="ID Card (Portrait)"
                variant="ghost"
                onPress={() => void qrService.printIdCard(record, 'portrait')}
                style={styles.gridButton}
              />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, theme }: { label: string; value: string; theme: ReturnType<typeof useTheme>['theme'] }) {
  return (
    <View style={styles.row}>
      <Text style={{ color: theme.colors.textMuted, flex: 1 }}>{label}</Text>
      <Text style={{ color: theme.colors.text, fontWeight: '500', flex: 2, textAlign: 'right' }}>
        {value || '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { alignItems: 'center', paddingTop: 80 },
  section: { marginBottom: 16 },
  headerCard: { alignItems: 'center' },
  avatar: { width: 110, height: 110, borderRadius: 55, marginBottom: 12 },
  name: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  registrationId: { fontSize: 14, fontWeight: '600', letterSpacing: 1, marginTop: 4 },
  row: { flexDirection: 'row', paddingVertical: 8, gap: 12 },
  qrCard: { alignItems: 'center' },
  qrImage: { width: 180, height: 180, backgroundColor: '#FFFFFF', borderRadius: 8 },
  downloadFeedback: { fontSize: 12, marginTop: 10, textAlign: 'center' },
  buttonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 },
  gridButton: { flexBasis: '47%', flexGrow: 1 },
});
