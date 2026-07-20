import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { storageService } from '../services/storageService';
import { REGISTRATION_ID_PATTERN } from '../constants/config';
import type { ScanHistoryEntry } from '../types/registration';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Scan'>;

export default function ScanScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [manualId, setManualId] = useState('');
  const [scanError, setScanError] = useState<string | undefined>();
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const handledRef = useRef(false);

  const refreshHistory = useCallback(async () => {
    setHistory(await storageService.getScanHistory());
  }, []);

  useEffect(() => {
    void refreshHistory();
    if (isFocused) handledRef.current = false;
  }, [isFocused, refreshHistory]);

  const openRegistration = useCallback(
    async (raw: string) => {
      const registrationId = raw.trim();
      if (!REGISTRATION_ID_PATTERN.test(registrationId)) {
        setScanError('That QR code is not a valid registration ID.');
        handledRef.current = false;
        return;
      }
      setScanError(undefined);
      await storageService.addScanHistoryEntry(registrationId);
      await refreshHistory();
      navigation.navigate('Profile', { registrationId });
    },
    [navigation, refreshHistory]
  );

  const onBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (handledRef.current) return;
      handledRef.current = true;
      void openRegistration(data);
    },
    [openRegistration]
  );

  const cameraSupported = Platform.OS !== 'web';

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.registrationId}
        contentContainerStyle={{ padding: theme.spacing.lg }}
        ListHeaderComponent={
          <View>
            <Text style={[styles.title, { color: theme.colors.text }]}>Scan QR Code</Text>

            {cameraSupported ? (
              permission?.granted ? (
                <View style={[styles.cameraWrap, { borderRadius: theme.radius.lg }]}>
                  {isFocused ? (
                    <CameraView
                      style={styles.camera}
                      facing="back"
                      enableTorch={torchOn}
                      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                      onBarcodeScanned={onBarcodeScanned}
                    />
                  ) : null}
                  <Button
                    label={torchOn ? 'Flashlight Off' : 'Flashlight On'}
                    variant="secondary"
                    onPress={() => setTorchOn((v) => !v)}
                    style={styles.torchButton}
                  />
                </View>
              ) : (
                <Card style={styles.section}>
                  <Text style={{ color: theme.colors.textMuted, marginBottom: 12 }}>
                    Camera access is needed to scan QR codes.
                  </Text>
                  <Button label="Allow Camera" onPress={() => void requestPermission()} />
                </Card>
              )
            ) : (
              <Card style={styles.section}>
                <Text style={{ color: theme.colors.textMuted }}>
                  Live scanning isn't available in the browser — enter the Registration ID below, or
                  use the app on your phone to scan.
                </Text>
              </Card>
            )}

            <Card style={styles.section}>
              <Input
                label="Enter Registration ID"
                placeholder="REG-20260719-000001"
                value={manualId}
                onChangeText={setManualId}
                autoCapitalize="characters"
                error={scanError}
              />
              <Button label="Look Up" onPress={() => void openRegistration(manualId)} />
            </Card>

            <View style={styles.historyHeader}>
              <Text style={[styles.historyTitle, { color: theme.colors.text }]}>Scan History</Text>
              {history.length > 0 ? (
                <Button
                  label="Clear"
                  variant="ghost"
                  style={styles.clearButton}
                  onPress={() => {
                    void storageService.clearScanHistory().then(refreshHistory);
                  }}
                />
              ) : null}
            </View>
            {history.length === 0 ? (
              <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>No scans yet.</Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.historyItem}>
            <View style={styles.historyRow}>
              <View>
                <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{item.registrationId}</Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>
                  {new Date(item.scannedAt).toLocaleString()}
                </Text>
              </View>
              <Button
                label="View"
                variant="ghost"
                style={styles.viewButton}
                onPress={() => navigation.navigate('Profile', { registrationId: item.registrationId })}
              />
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  cameraWrap: { overflow: 'hidden', marginBottom: 16 },
  camera: { height: 280 },
  torchButton: { marginTop: 8 },
  section: { marginBottom: 16 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  historyTitle: { fontSize: 16, fontWeight: '600' },
  clearButton: { minHeight: 36, paddingHorizontal: 12 },
  historyItem: { marginBottom: 8 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewButton: { minHeight: 36, paddingHorizontal: 14 },
});
