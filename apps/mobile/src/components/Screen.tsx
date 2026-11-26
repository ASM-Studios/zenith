import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider.tsx';

type ScreenProps = { title: string; caption?: string };

export function Screen({ title, caption }: ScreenProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
        {title}
      </Text>
      {caption === undefined ? null : <Text style={[styles.caption, { color: theme.mutedText }]}>{caption}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '700' },
  caption: { marginTop: 8, fontSize: 14 },
});
