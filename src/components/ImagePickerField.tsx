import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Button } from './Button';
import type { PickedImage } from '../services/imageService';

interface ImagePickerFieldProps {
  image: PickedImage | null;
  onCapture: () => void;
  onPickFromGallery: () => void;
  onDelete: () => void;
  error?: string;
}

export function ImagePickerField({
  image,
  onCapture,
  onPickFromGallery,
  onDelete,
  error,
}: ImagePickerFieldProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>
        Profile Photo<Text style={{ color: theme.colors.error }}> *</Text>
      </Text>

      <View
        style={[
          styles.preview,
          {
            backgroundColor: theme.colors.surfaceAlt,
            borderRadius: theme.radius.lg,
            borderColor: error ? theme.colors.error : theme.colors.border,
          },
        ]}
      >
        {image ? (
          <Image source={{ uri: image.uri }} style={styles.image} resizeMode="cover" />
        ) : (
          <Text style={{ color: theme.colors.textMuted }}>No photo selected</Text>
        )}
      </View>

      <View style={styles.actions}>
        <Button
          label={image ? 'Retake Photo' : 'Open Camera'}
          onPress={onCapture}
          variant="secondary"
          style={styles.actionButton}
        />
        <Button
          label="Upload Photo"
          onPress={onPickFromGallery}
          variant="secondary"
          style={styles.actionButton}
        />
      </View>
      {image ? <Button label="Delete Photo" onPress={onDelete} variant="ghost" /> : null}

      {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  label: { fontSize: 13, marginBottom: 8, fontWeight: '500' },
  preview: {
    height: 220,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 10,
  },
  image: { width: '100%', height: '100%' },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  actionButton: { flex: 1 },
  error: { fontSize: 12, marginTop: 4 },
});
