import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { SuccessAnimation } from '../components/SuccessAnimation';
import { Button } from '../components/Button';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Success'>;

export default function SuccessScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const message = route.params?.result.message ?? 'Your information has been saved.';

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        <SuccessAnimation />
        <Text style={[styles.title, { color: theme.colors.text }]}>Registration Successful</Text>
        <Text style={[styles.message, { color: theme.colors.textMuted }]}>{message}</Text>

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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 24, textAlign: 'center' },
  message: { fontSize: 15, marginTop: 10, textAlign: 'center', lineHeight: 21 },
  actions: { width: '100%', marginTop: 36, gap: 12 },
  button: { width: '100%' },
});
