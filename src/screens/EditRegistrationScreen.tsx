import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Dropdown } from '../components/Dropdown';
import { ErrorBanner } from '../components/ErrorBanner';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { updateRegistration } from '../services/registrationService';
import { imageService, ImageValidationError, type PickedImage } from '../services/imageService';
import { toFriendlyMessage } from '../utils/errorMessages';
import { CIVIL_STATUS_OPTIONS, SEX_OPTIONS } from '../constants/config';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'EditRegistration'>;

const STATUS_OPTIONS = ['Active', 'Inactive'] as const;

export default function EditRegistrationScreen({ navigation, route }: Props) {
  const { record } = route.params;
  const { theme } = useTheme();
  const { settings } = useSettings();

  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | undefined>();

  const [firstName, setFirstName] = useState(record.firstName);
  const [middleName, setMiddleName] = useState(record.middleName);
  const [lastName, setLastName] = useState(record.lastName);
  const [age, setAge] = useState(record.age);
  const [sex, setSex] = useState(record.sex);
  const [civilStatus, setCivilStatus] = useState(record.civilStatus);
  const [nationality, setNationality] = useState(record.nationality);
  const [phoneNumber, setPhoneNumber] = useState(record.phoneNumber);
  const [email, setEmail] = useState(record.email);
  const [completeAddress, setCompleteAddress] = useState(record.completeAddress);
  const [status, setStatus] = useState(record.status || 'Active');
  const [newImage, setNewImage] = useState<PickedImage | null>(null);
  const [imageError, setImageError] = useState<string | undefined>();

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>();

  const handleUnlock = () => {
    if (password === settings.adminPassword) {
      setUnlocked(true);
      setPasswordError(undefined);
    } else {
      setPasswordError('Incorrect password.');
    }
  };

  const handleReplacePhoto = async () => {
    try {
      setImageError(undefined);
      const picked = await imageService.pickFromGallery();
      if (!picked) return;
      const compressed = await imageService.compress(picked);
      imageService.assertWithinSizeLimit(compressed);
      setNewImage(compressed);
    } catch (err) {
      setImageError(err instanceof ImageValidationError ? err.message : 'Could not select photo.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(undefined);
    try {
      await updateRegistration(settings.apiEndpoint, record.registrationId, {
        firstName,
        middleName,
        lastName,
        age,
        sex,
        civilStatus,
        nationality,
        phoneNumber,
        email,
        completeAddress,
        status,
        ...(newImage?.base64
          ? {
              imageBase64: newImage.base64,
              imageFileName: imageService.buildFileName(lastName, firstName, new Date()),
              imageMimeType: newImage.mimeType,
            }
          : {}),
      });
      navigation.replace('Profile', { registrationId: record.registrationId });
    } catch (err) {
      setSaveError(toFriendlyMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!unlocked) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
        <View style={styles.gateContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Admin Access</Text>
          <Text style={{ color: theme.colors.textMuted, marginBottom: 16 }}>
            Editing records requires the admin password.
          </Text>
          <Input label="Password" secureTextEntry value={password} onChangeText={setPassword} error={passwordError} />
          <Button label="Unlock" onPress={handleUnlock} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: theme.colors.text }]}>Edit {record.registrationId}</Text>

          {saveError ? <ErrorBanner message={saveError} onRetry={() => void handleSave()} /> : null}

          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Profile Photo</Text>
            <View style={styles.photoRow}>
              <Image
                source={{ uri: newImage?.uri || record.imageUrl }}
                style={[styles.photo, { backgroundColor: theme.colors.surfaceAlt }]}
              />
              <View style={styles.photoActions}>
                <Button label="Replace Picture" variant="secondary" onPress={() => void handleReplacePhoto()} />
                {newImage ? (
                  <Button label="Keep Original" variant="ghost" onPress={() => setNewImage(null)} />
                ) : null}
              </View>
            </View>
            {imageError ? <Text style={{ color: theme.colors.error, fontSize: 12, marginTop: 6 }}>{imageError}</Text> : null}
          </Card>

          <Card style={styles.section}>
            <Input label="First Name" required value={firstName} onChangeText={setFirstName} />
            <Input label="Middle Name" value={middleName} onChangeText={setMiddleName} />
            <Input label="Last Name" required value={lastName} onChangeText={setLastName} />
            <Input label="Age" required value={age} onChangeText={setAge} keyboardType="number-pad" />
            <Dropdown label="Sex" options={SEX_OPTIONS} value={sex} onChange={setSex} />
            <Dropdown label="Civil Status" options={CIVIL_STATUS_OPTIONS} value={civilStatus} onChange={setCivilStatus} />
            <Input label="Nationality" value={nationality} onChangeText={setNationality} />
            <Input label="Phone Number" required value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
            <Input label="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Input label="Complete Address" required value={completeAddress} onChangeText={setCompleteAddress} multiline numberOfLines={3} />
            <Dropdown label="Status" options={STATUS_OPTIONS} value={status} onChange={setStatus} />
          </Card>

          <Button label="Save Changes" onPress={() => void handleSave()} loading={saving} style={styles.saveButton} />
        </ScrollView>
      </KeyboardAvoidingView>
      <LoadingOverlay visible={saving} message="Saving changes..." />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gateContainer: { flex: 1, justifyContent: 'center', padding: 32 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  photo: { width: 88, height: 88, borderRadius: 44 },
  photoActions: { flex: 1, gap: 8 },
  saveButton: { marginBottom: 40 },
});
