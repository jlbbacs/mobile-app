import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ProgressBar } from './ProgressBar';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  progress?: number;
}

export function LoadingOverlay({ visible, message = 'Uploading...', progress }: LoadingOverlayProps) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.message, { color: theme.colors.text }]}>{message}</Text>
          {typeof progress === 'number' ? (
            <ProgressBar progress={progress} style={{ marginTop: 12, width: 200 }} />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { paddingVertical: 28, paddingHorizontal: 32, alignItems: 'center', minWidth: 220 },
  message: { marginTop: 14, fontSize: 15, fontWeight: '500' },
});
