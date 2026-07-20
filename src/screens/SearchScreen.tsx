import React, { useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { ErrorBanner } from '../components/ErrorBanner';
import { searchRegistrations } from '../services/registrationService';
import { toFriendlyMessage } from '../utils/errorMessages';
import type { RegistrationRecord } from '../types/registration';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

export default function SearchScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { settings } = useSettings();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RegistrationRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const runSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(undefined);
    try {
      setResults(await searchRegistrations(settings.apiEndpoint, trimmed));
    } catch (err) {
      setError(toFriendlyMessage(err));
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={results ?? []}
        keyExtractor={(item) => item.registrationId}
        contentContainerStyle={{ padding: theme.spacing.lg }}
        ListHeaderComponent={
          <View>
            <Text style={[styles.title, { color: theme.colors.text }]}>Search Records</Text>
            <Card style={styles.section}>
              <Input
                label="Registration ID, name, phone, or email"
                placeholder="e.g. REG-20260719-000001 or Juan"
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                onSubmitEditing={() => void runSearch()}
              />
              <Button label="Search" onPress={() => void runSearch()} loading={loading} />
            </Card>
            {error ? <ErrorBanner message={error} onRetry={() => void runSearch()} /> : null}
            {results !== null && results.length === 0 && !error ? (
              <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 12 }}>
                Record Not Found
              </Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('Profile', { registrationId: item.registrationId })}>
            <Card style={styles.resultItem}>
              <View style={styles.resultRow}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, { backgroundColor: theme.colors.surfaceAlt }]} />
                )}
                <View style={styles.resultText}>
                  <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
                    {[item.firstName, item.lastName].filter(Boolean).join(' ')}
                  </Text>
                  <Text style={{ color: theme.colors.primary, fontSize: 12, marginTop: 2 }}>
                    {item.registrationId}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>
                    {item.phoneNumber}
                  </Text>
                </View>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  section: { marginBottom: 16 },
  resultItem: { marginBottom: 8 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 48, height: 48, borderRadius: 24 },
  resultText: { flex: 1 },
});
