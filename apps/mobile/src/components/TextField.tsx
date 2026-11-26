import type { TextInputProps } from 'react-native';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider.tsx';

type TextFieldProps = Pick<
  TextInputProps,
  'autoCapitalize' | 'autoComplete' | 'keyboardType' | 'secureTextEntry' | 'textContentType'
> & { label: string; value: string; onChangeText: (value: string) => void; error?: string };

export function TextField({ label, value, onChangeText, error, ...inputProps }: TextFieldProps) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <TextInput
        {...inputProps}
        accessibilityLabel={label}
        autoCorrect={false}
        onChangeText={onChangeText}
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.surface,
            borderColor: error === undefined ? theme.border : theme.accent,
          },
        ]}
        value={value}
      />
      {error === undefined ? null : (
        <Text accessibilityRole="alert" style={{ color: theme.text }}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 4 },
  label: { fontSize: 14, fontWeight: '600' },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 16 },
});
