import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider.tsx';

type PrimaryButtonProps = { label: string; onPress: () => void };

export function PrimaryButton({ label, onPress }: PrimaryButtonProps) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.button, { backgroundColor: theme.accent }]}>
      <Text style={[styles.label, { color: theme.background }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 48, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 16, fontWeight: '600' },
});
