import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function SuccessAnimation() {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  return (
    <Animated.View
      style={[
        styles.circle,
        {
          backgroundColor: theme.colors.success,
          transform: [{ scale }],
        },
      ]}
    >
      <Text style={styles.check}>✓</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    fontSize: 48,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
