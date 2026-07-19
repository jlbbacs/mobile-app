import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Button } from './Button';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.error, borderRadius: theme.radius.md },
      ]}
    >
      <Text style={[styles.text, { color: theme.colors.error }]}>{message}</Text>
      {onRetry ? (
        <Button label="Retry" onPress={onRetry} variant="ghost" style={styles.retryButton} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, padding: 14, marginVertical: 8 },
  text: { fontSize: 14, fontWeight: '500' },
  retryButton: { marginTop: 8, alignSelf: 'flex-start', minHeight: 40, paddingHorizontal: 12 },
});
