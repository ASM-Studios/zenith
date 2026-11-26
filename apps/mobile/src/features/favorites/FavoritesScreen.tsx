import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { TabParamList } from '../../navigation/routes.ts';
import { useTheme } from '../../theme/ThemeProvider.tsx';
import { usePlace } from '../location/PlaceProvider.tsx';
import type { Favorite } from './favorites.ts';
import { useFavorites } from './FavoritesProvider.tsx';

export function FavoritesScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const { selectPlace } = usePlace();
  const { favorites, failure, remove } = useFavorites();
  const theme = useTheme();

  function open(favorite: Favorite) {
    selectPlace({ name: favorite.name, latitude: favorite.latitude, longitude: favorite.longitude });
    navigation.navigate('Home');
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {failure === null ? null : (
        <Text accessibilityRole="alert" style={{ color: theme.text }}>
          {failure}
        </Text>
      )}
      <FlatList
        data={favorites}
        keyExtractor={(item) => `${item.latitude},${item.longitude}`}
        ListEmptyComponent={
          <Text style={{ color: theme.mutedText }}>No favorites yet. Choose a place and add it from Home.</Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.row, { borderColor: theme.border }]}>
            <Pressable
              accessibilityLabel={`Show ${item.name}`}
              accessibilityRole="button"
              onPress={() => open(item)}
              style={styles.name}
            >
              <Text style={[styles.title, { color: theme.text }]}>{item.name}</Text>
              <Text
                style={{ color: theme.mutedText }}
              >{`${item.latitude.toFixed(2)}, ${item.longitude.toFixed(2)}`}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={`Remove ${item.name}`}
              accessibilityRole="button"
              onPress={() => void remove(item)}
              style={styles.remove}
            >
              <Text style={{ color: theme.accent }}>Remove</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, minHeight: 56 },
  name: { flex: 1, minHeight: 48, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '600' },
  remove: { minHeight: 48, minWidth: 48, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
});
