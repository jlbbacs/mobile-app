import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ProgressBarProps {
  progress: number; // 0..1
  style?: ViewStyle;
}

export function ProgressBar({ progress, style }: ProgressBarProps) {
  const { theme } = useTheme();
  const animated = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.timing(animated, {
      toValue: Math.max(0, Math.min(1, progress)),
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [progress, animated]);

  const width = animated.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={[styles.track, { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.pill }, style]}>
      <Animated.View style={[styles.fill, { width, backgroundColor: theme.colors.primary, borderRadius: theme.radius.pill }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, overflow: 'hidden' },
  fill: { height: '100%' },
});
