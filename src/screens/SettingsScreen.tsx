import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export default function SettingsScreen() {
  const { theme, themeOverride, setThemeOverride } = useTheme();
  const { settings, updateSettings } = useSettings();

  const [apiEndpoint, setApiEndpoint] = useState(settings.apiEndpoint);
  const [googleSheetUrl, setGoogleSheetUrl] = useState(settings.googleSheetUrl);
  const [googleDriveFolderId, setGoogleDriveFolderId] = useState(settings.googleDriveFolderId);
  const [saved, setSaved] = useState(false);

  const [adminPassword, setAdminPassword] = useState(settings.adminPassword);
  const [adminError, setAdminError] = useState<string | undefined>();
  const [adminSaved, setAdminSaved] = useState(false);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const handleSave = async () => {
    await updateSettings({ apiEndpoint: apiEndpoint.trim(), googleSheetUrl: googleSheetUrl.trim(), googleDriveFolderId: googleDriveFolderId.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveAdminPassword = async () => {
    const trimmed = adminPassword.trim();
    if (!trimmed) {
      setAdminError('Password cannot be empty.');
      return;
    }
    setAdminError(undefined);
    await updateSettings({ adminPassword: trimmed });
    setAdminSaved(true);
    setTimeout(() => setAdminSaved(false), 2000);
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Settings</Text>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Backend Configuration</Text>
          <Input
            label="Google Apps Script API Endpoint"
            placeholder="https://script.google.com/macros/s/.../exec"
            value={apiEndpoint}
            onChangeText={setApiEndpoint}
            autoCapitalize="none"
          />
          <Input
            label="Google Sheet URL"
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={googleSheetUrl}
            onChangeText={setGoogleSheetUrl}
            autoCapitalize="none"
          />
          <Input
            label="Google Drive Folder ID"
            placeholder="Personal Registrations folder ID"
            value={googleDriveFolderId}
            onChangeText={setGoogleDriveFolderId}
            autoCapitalize="none"
          />
          <Button label={saved ? 'Saved ✓' : 'Save'} onPress={handleSave} />
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Appearance</Text>
          <View style={styles.row}>
            <Text style={{ color: theme.colors.text }}>Dark Mode</Text>
            <Switch
              value={themeOverride === 'dark' || (themeOverride === 'system' && theme.mode === 'dark')}
              onValueChange={(value) => setThemeOverride(value ? 'dark' : 'light')}
            />
          </View>
          <Button
            label="Use System Setting"
            onPress={() => setThemeOverride('system')}
            variant="ghost"
            style={styles.systemButton}
          />
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Admin</Text>
          <Input
            label="Admin Password"
            secureTextEntry
            value={adminPassword}
            onChangeText={setAdminPassword}
            error={adminError}
          />
          <Button label={adminSaved ? 'Saved ✓' : 'Save'} onPress={handleSaveAdminPassword} />
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>About</Text>
          <View style={styles.row}>
            <Text style={{ color: theme.colors.textMuted }}>App Version</Text>
            <Text style={{ color: theme.colors.text }}>{appVersion}</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  systemButton: { alignSelf: 'flex-start', marginTop: 4 },
});
