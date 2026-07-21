import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

interface Bubble {
  size: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  opacity: number;
}

const BUBBLES: Bubble[] = [
  { size: 120, top: -30, left: -30, opacity: 0.12 },
  { size: 70, top: 90, right: 30, opacity: 0.15 },
  { size: 36, top: 60, left: 60, opacity: 0.18 },
  { size: 160, bottom: -60, right: -50, opacity: 0.1 },
  { size: 90, bottom: 40, left: -30, opacity: 0.13 },
  { size: 24, bottom: 140, right: 90, opacity: 0.2 },
  { size: 48, top: 220, right: -10, opacity: 0.12 },
  { size: 18, bottom: 220, left: 50, opacity: 0.22 },
];

export default function SplashScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      navigation.replace('Home');
    }, 1100);
    return () => clearTimeout(timer);
  }, [navigation, opacity]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <View style={styles.bubbleLayer} pointerEvents="none">
        {BUBBLES.map((bubble, index) => (
          <View
            key={index}
            style={[
              styles.bubble,
              {
                width: bubble.size,
                height: bubble.size,
                borderRadius: bubble.size / 2,
                top: bubble.top,
                bottom: bubble.bottom,
                left: bubble.left,
                right: bubble.right,
                opacity: bubble.opacity,
              },
            ]}
          />
        ))}
      </View>

      <Animated.View style={{ opacity, alignItems: 'center' }}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>RC</Text>
        </View>
        <Text style={styles.title}>RCPOS App</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  bubbleLayer: { ...StyleSheet.absoluteFillObject },
  bubble: { position: 'absolute', backgroundColor: '#FFFFFF' },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoText: { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },
  title: { fontSize: 18, fontWeight: '600', color: '#FFFFFF', textAlign: 'center' },
});
