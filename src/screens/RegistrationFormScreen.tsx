import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';

import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { Input } from '../components/Input';
import { Dropdown } from '../components/Dropdown';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ImagePickerField } from '../components/ImagePickerField';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { ErrorBanner } from '../components/ErrorBanner';
import {
  registrationSchema,
  isCompleteAddressFilled,
} from '../services/validationService';
import { imageService, ImageValidationError, type PickedImage } from '../services/imageService';
import { locationService } from '../services/locationService';
import { deviceInfoService } from '../services/deviceInfoService';
import { submitRegistration } from '../services/registrationService';
import { storageService } from '../services/storageService';
import { toFriendlyMessage } from '../utils/errorMessages';
import { CIVIL_STATUS_OPTIONS, SEX_OPTIONS } from '../constants/config';
import type { RegistrationFormValues, QueuedSubmission } from '../types/registration';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'RegistrationForm'>;

const DEFAULT_VALUES: RegistrationFormValues = {
  firstName: '',
  middleName: '',
  lastName: '',
  age: '',
  birthdate: '',
  sex: undefined,
  civilStatus: undefined,
  nationality: '',
  phoneNumber: '',
  email: '',
  houseNumber: '',
  street: '',
  barangay: '',
  city: '',
  province: '',
  zipCode: '',
  country: '',
  occupation: '',
  company: '',
  emergencyContactName: '',
  emergencyContactNumber: '',
  relationship: '',
  remarks: '',
};

export default function RegistrationFormScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { settings } = useSettings();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormValues>({
    resolver: yupResolver(registrationSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const [image, setImage] = useState<PickedImage | null>(null);
  const [imageError, setImageError] = useState<string | undefined>();
  const [addressError, setAddressError] = useState<string | undefined>();
  const [location, setLocation] = useState<{ latitude?: number; longitude?: number }>({});
  const [locatingGps, setLocatingGps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();
  const submitLock = useRef(false);

  const handleCapture = async () => {
    try {
      setImageError(undefined);
      const picked = await imageService.capturePhoto();
      if (!picked) return;
      const compressed = await imageService.compress(picked);
      imageService.assertWithinSizeLimit(compressed);
      setImage(compressed);
    } catch (err) {
      setImageError(err instanceof ImageValidationError ? err.message : 'Could not capture photo.');
    }
  };

  const handlePickFromGallery = async () => {
    try {
      setImageError(undefined);
      const picked = await imageService.pickFromGallery();
      if (!picked) return;
      const compressed = await imageService.compress(picked);
      imageService.assertWithinSizeLimit(compressed);
      setImage(compressed);
    } catch (err) {
      setImageError(err instanceof ImageValidationError ? err.message : 'Could not select photo.');
    }
  };

  const handleUseLocation = async () => {
    setLocatingGps(true);
    try {
      const loc = await locationService.requestCurrentLocation();
      setLocation(loc);
    } finally {
      setLocatingGps(false);
    }
  };

  const onSubmit = async (values: RegistrationFormValues) => {
    if (submitLock.current) return;

    if (!image) {
      setImageError('A profile photo is required.');
      return;
    }
    if (!isCompleteAddressFilled(values)) {
      setAddressError('Please provide at least a street, barangay, or city.');
      return;
    }
    setAddressError(undefined);
    setSubmitError(undefined);

    submitLock.current = true;
    setIsSubmitting(true);
    try {
      const imageBase64 = await imageService.toBase64(image.uri);
      const fileName = imageService.buildFileName(values.lastName, values.firstName, new Date());
      const deviceMeta = deviceInfoService.getDeviceMeta();

      const payload = {
        ...values,
        ...deviceMeta,
        ...location,
        imageBase64,
        imageFileName: fileName,
        imageMimeType: image.mimeType,
      };

      try {
        const result = await submitRegistration(settings.apiEndpoint, payload);
        await storageService.incrementSubmissionCount();
        navigation.replace('Success', { result });
      } catch (err) {
        const queued: QueuedSubmission = {
          id: Crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          payload,
          status: 'pending',
          attempts: 0,
        };
        await storageService.enqueue(queued);
        navigation.replace('Success', {
          result: {
            success: true,
            message:
              'No connection right now — your registration was saved on this device and will upload automatically once you are back online.',
          },
        });
      }
    } catch (err) {
      setSubmitError(toFriendlyMessage(err));
    } finally {
      setIsSubmitting(false);
      submitLock.current = false;
    }
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: theme.colors.text }]}>Registration Form</Text>

          {submitError ? <ErrorBanner message={submitError} onRetry={handleSubmit(onSubmit)} /> : null}

          <Card style={styles.section}>
            <ImagePickerField
              image={image}
              onCapture={handleCapture}
              onPickFromGallery={handlePickFromGallery}
              onDelete={() => setImage(null)}
              error={imageError}
            />
          </Card>

          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Personal Information</Text>
            <Controller
              control={control}
              name="firstName"
              render={({ field }) => (
                <Input label="First Name" required value={field.value} onChangeText={field.onChange} error={errors.firstName?.message} />
              )}
            />
            <Controller
              control={control}
              name="middleName"
              render={({ field }) => <Input label="Middle Name" value={field.value} onChangeText={field.onChange} />}
            />
            <Controller
              control={control}
              name="lastName"
              render={({ field }) => (
                <Input label="Last Name" required value={field.value} onChangeText={field.onChange} error={errors.lastName?.message} />
              )}
            />
            <Controller
              control={control}
              name="age"
              render={({ field }) => (
                <Input
                  label="Age"
                  required
                  value={field.value}
                  onChangeText={field.onChange}
                  keyboardType="number-pad"
                  error={errors.age?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="birthdate"
              render={({ field }) => (
                <Input label="Birthdate" placeholder="YYYY-MM-DD" value={field.value} onChangeText={field.onChange} />
              )}
            />
            <Controller
              control={control}
              name="sex"
              render={({ field }) => (
                <Dropdown label="Sex" options={SEX_OPTIONS} value={field.value} onChange={field.onChange} />
              )}
            />
            <Controller
              control={control}
              name="civilStatus"
              render={({ field }) => (
                <Dropdown label="Civil Status" options={CIVIL_STATUS_OPTIONS} value={field.value} onChange={field.onChange} />
              )}
            />
            <Controller
              control={control}
              name="nationality"
              render={({ field }) => <Input label="Nationality" value={field.value} onChangeText={field.onChange} />}
            />
            <Controller
              control={control}
              name="phoneNumber"
              render={({ field }) => (
                <Input
                  label="Phone Number"
                  required
                  value={field.value}
                  onChangeText={field.onChange}
                  keyboardType="phone-pad"
                  error={errors.phoneNumber?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <Input
                  label="Email Address"
                  value={field.value}
                  onChangeText={field.onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email?.message}
                />
              )}
            />
          </Card>

          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Complete Address</Text>
            {addressError ? <Text style={{ color: theme.colors.error, marginBottom: 8, fontSize: 12 }}>{addressError}</Text> : null}
            <Controller control={control} name="houseNumber" render={({ field }) => <Input label="House Number" value={field.value} onChangeText={field.onChange} />} />
            <Controller control={control} name="street" render={({ field }) => <Input label="Street" value={field.value} onChangeText={field.onChange} />} />
            <Controller control={control} name="barangay" render={({ field }) => <Input label="Barangay" value={field.value} onChangeText={field.onChange} />} />
            <Controller control={control} name="city" render={({ field }) => <Input label="City" value={field.value} onChangeText={field.onChange} />} />
            <Controller control={control} name="province" render={({ field }) => <Input label="Province" value={field.value} onChangeText={field.onChange} />} />
            <Controller control={control} name="zipCode" render={({ field }) => <Input label="Zip Code" value={field.value} onChangeText={field.onChange} keyboardType="number-pad" />} />
            <Controller control={control} name="country" render={({ field }) => <Input label="Country" value={field.value} onChangeText={field.onChange} />} />
          </Card>

          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Work</Text>
            <Controller control={control} name="occupation" render={({ field }) => <Input label="Occupation" value={field.value} onChangeText={field.onChange} />} />
            <Controller control={control} name="company" render={({ field }) => <Input label="Company" value={field.value} onChangeText={field.onChange} />} />
          </Card>

          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Emergency Contact</Text>
            <Controller control={control} name="emergencyContactName" render={({ field }) => <Input label="Emergency Contact Name" value={field.value} onChangeText={field.onChange} />} />
            <Controller control={control} name="emergencyContactNumber" render={({ field }) => <Input label="Emergency Contact Number" value={field.value} onChangeText={field.onChange} keyboardType="phone-pad" />} />
            <Controller control={control} name="relationship" render={({ field }) => <Input label="Relationship" value={field.value} onChangeText={field.onChange} />} />
          </Card>

          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Other</Text>
            <Controller control={control} name="remarks" render={({ field }) => <Input label="Remarks" value={field.value} onChangeText={field.onChange} multiline numberOfLines={3} />} />

            <Text style={[styles.label, { color: theme.colors.textMuted }]}>Location (optional)</Text>
            <View style={styles.locationRow}>
              <Button
                label={locatingGps ? 'Getting location...' : 'Use My Current Location'}
                onPress={handleUseLocation}
                variant="secondary"
                loading={locatingGps}
              />
              {location.latitude !== undefined ? (
                <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 6 }}>
                  {location.latitude?.toFixed(5)}, {location.longitude?.toFixed(5)}
                </Text>
              ) : null}
            </View>
          </Card>

          <Button label="Submit" onPress={handleSubmit(onSubmit)} loading={isSubmitting} style={styles.submitButton} />
        </ScrollView>
      </KeyboardAvoidingView>
      <LoadingOverlay visible={isSubmitting} message="Uploading your registration..." />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  label: { fontSize: 13, marginTop: 4, marginBottom: 6, fontWeight: '500' },
  locationRow: { marginBottom: 4 },
  submitButton: { marginTop: 4, marginBottom: 40 },
});
