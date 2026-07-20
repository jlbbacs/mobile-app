import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { SuccessAnimation } from '../components/SuccessAnimation';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { qrService, qrImageUrl } from '../services/qrService';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Success'>;

export default function SuccessScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const result = route.params?.result;
  const registrationId = result?.registrationId;
  const message = result?.message ?? 'Your information has been saved.';

  const checklist = registrationId
    ? [
        'Registration Successful',
        'QR Code Generated',
        'Data Uploaded to Google Sheets',
        'Image Uploaded to Google Drive',
        ...(result?.qrCodeUrl ? ['QR Code Saved'] : []),
      ]
    : null;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <SuccessAnimation />
        <Text style={[styles.title, { color: theme.colors.text }]}>Registration Successful</Text>
        <Text style={[styles.message, { color: theme.colors.textMuted }]}>{message}</Text>

        {checklist ? (
          <View style={styles.checklist}>
            {checklist.map((item) => (
              <Text key={item} style={[styles.checkItem, { color: theme.colors.success }]}>
                ✓ <Text style={{ color: theme.colors.textMuted }}>{item}</Text>
              </Text>
            ))}
          </View>
        ) : null}

        {registrationId ? (
          <Card style={styles.qrCard}>
            <Text style={[styles.qrLabel, { color: theme.colors.textMuted }]}>Your Registration ID</Text>
            <Text style={[styles.registrationId, { color: theme.colors.text }]}>{registrationId}</Text>
            <Image
              source={{ uri: result?.qrCodeUrl || qrImageUrl(registrationId) }}
              style={styles.qrImage}
              resizeMode="contain"
            />
            <View style={styles.qrActions}>
              <Button
                label="Download"
                variant="secondary"
                style={styles.qrActionButton}
                onPress={() => void qrService.download(registrationId, result?.qrCodeUrl)}
              />
              <Button
                label="Share"
                variant="secondary"
                style={styles.qrActionButton}
                onPress={() => void qrService.share(registrationId, result?.qrCodeUrl)}
              />
              <Button
                label="Print"
                variant="secondary"
                style={styles.qrActionButton}
                onPress={() => void qrService.print(registrationId)}
              />
            </View>
          </Card>
        ) : null}

        <View style={styles.actions}>
          <Button
            label="Register Another"
            onPress={() => navigation.replace('RegistrationForm')}
            style={styles.button}
          />
          <Button
            label="Home"
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
            variant="secondary"
            style={styles.button}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { alignItems: 'center', padding: 24, paddingTop: 40 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 20, textAlign: 'center' },
  message: { fontSize: 15, marginTop: 8, textAlign: 'center', lineHeight: 21 },
  checklist: { marginTop: 16, alignSelf: 'stretch', alignItems: 'center', gap: 4 },
  checkItem: { fontSize: 14, fontWeight: '600' },
  qrCard: { marginTop: 20, alignSelf: 'stretch', alignItems: 'center' },
  qrLabel: { fontSize: 13, fontWeight: '500' },
  registrationId: { fontSize: 17, fontWeight: '700', letterSpacing: 1, marginTop: 4, marginBottom: 12 },
  qrImage: { width: 200, height: 200, backgroundColor: '#FFFFFF', borderRadius: 8 },
  qrActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  qrActionButton: { flex: 1, minHeight: 44 },
  actions: { width: '100%', marginTop: 24, gap: 12 },
  button: { width: '100%' },
});
