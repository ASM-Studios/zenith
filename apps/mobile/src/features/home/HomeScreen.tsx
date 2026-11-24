import { StyleSheet, Text, View } from 'react-native';
import { VERSION } from '@zenith/core';

export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zenith</Text>
      <Text style={styles.version}>{`Core ${VERSION}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b1020',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  version: {
    marginTop: 8,
    fontSize: 14,
    color: '#9aa4bf',
  },
});
