import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, FlatList } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface DropdownProps {
  label: string;
  required?: boolean;
  value?: string;
  options: readonly string[];
  placeholder?: string;
  onChange: (value: string) => void;
  error?: string;
}

export function Dropdown({
  label,
  required,
  value,
  options,
  placeholder = 'Select...',
  onChange,
  error,
}: DropdownProps) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>
        {label}
        {required ? <Text style={{ color: theme.colors.error }}> *</Text> : null}
      </Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.field,
          {
            backgroundColor: theme.colors.surfaceAlt,
            borderRadius: theme.radius.sm,
            borderColor: error ? theme.colors.error : 'transparent',
            borderWidth: error ? 1 : 0,
          },
        ]}
      >
        <Text style={{ color: value ? theme.colors.text : theme.colors.textMuted, fontSize: 15 }}>
          {value || placeholder}
        </Text>
      </Pressable>
      {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg }]}>
            <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                  style={[styles.option, { borderBottomColor: theme.colors.border }]}
                >
                  <Text style={{ color: item === value ? theme.colors.primary : theme.colors.text, fontSize: 15 }}>
                    {item}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  label: { fontSize: 13, marginBottom: 6, fontWeight: '500' },
  field: { minHeight: 48, paddingHorizontal: 14, justifyContent: 'center' },
  error: { fontSize: 12, marginTop: 4 },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { padding: 16, maxHeight: '60%' },
  sheetTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  option: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
});
