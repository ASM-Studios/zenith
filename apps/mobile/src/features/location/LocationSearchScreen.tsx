import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '../../components/PrimaryButton.tsx';
import { useTheme } from '../../theme/ThemeProvider.tsx';
import { locateDevice } from './device-location.ts';
import { minQueryLength, searchPlaces } from './geocoding.ts';
import type { Place, PlaceResult } from './place.ts';
import { usePlace } from './PlaceProvider.tsx';

const searchLanguage = 'en';
const searchDebounceMs = 300;

const messages = {
  searchLabel: 'Search a place',
  positionButton: 'Use my position',
  noResults: 'No place found',
  searchFailed: 'Search failed, check your connection',
  permissionDenied: 'Location permission denied, search for a place instead',
  locationUnavailable: 'Position unavailable, search for a place instead',
} as const;

type SearchOutcome = { query: string; results: PlaceResult[]; failed: boolean };

const fetchUrl = (url: string) => globalThis.fetch(url);

function outcomeMessage(outcome: SearchOutcome | null, query: string): string | null {
  if (outcome === null || outcome.query !== query) {
    return null;
  }
  if (outcome.failed) {
    return messages.searchFailed;
  }
  return outcome.results.length === 0 ? messages.noResults : null;
}

export function LocationSearchScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { selectPlace } = usePlace();
  const [query, setQuery] = useState('');
  const [outcome, setOutcome] = useState<SearchOutcome | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const searching = query.trim().length >= minQueryLength;

  useEffect(() => {
    if (!searching) {
      return undefined;
    }
    let current = true;
    const timer = setTimeout(() => {
      searchPlaces(query, searchLanguage, fetchUrl)
        .then((results) => current && setOutcome({ query, results, failed: false }))
        .catch(() => current && setOutcome({ query, results: [], failed: true }));
    }, searchDebounceMs);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [query, searching]);

  function choose(place: Place) {
    selectPlace({ name: place.name, latitude: place.latitude, longitude: place.longitude });
    navigation.goBack();
  }

  async function locateMe() {
    const located = await locateDevice(Location);
    if (located.status === 'granted') {
      choose(located.place);
    } else {
      setNotice(located.status === 'denied' ? messages.permissionDenied : messages.locationUnavailable);
    }
  }

  const results = searching ? (outcome?.results ?? []) : [];
  const statusMessage = searching ? outcomeMessage(outcome, query) : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TextInput
        accessibilityLabel={messages.searchLabel}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={setQuery}
        placeholder={messages.searchLabel}
        placeholderTextColor={theme.mutedText}
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
        value={query}
      />
      <PrimaryButton label={messages.positionButton} onPress={() => void locateMe()} />
      {notice === null ? null : <Text style={{ color: theme.mutedText }}>{notice}</Text>}
      {statusMessage === null ? null : <Text style={{ color: theme.mutedText }}>{statusMessage}</Text>}
      <FlatList
        data={results}
        keyExtractor={(item) => `${item.latitude},${item.longitude}`}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" onPress={() => choose(item)} style={styles.row}>
            <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
            {item.detail === '' ? null : <Text style={{ color: theme.mutedText }}>{item.detail}</Text>}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 16 },
  row: { minHeight: 48, paddingVertical: 8, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '600' },
});
