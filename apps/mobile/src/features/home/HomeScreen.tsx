import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen.tsx';
import { PrimaryButton } from '../../components/PrimaryButton.tsx';
import type { RootStackParamList } from '../../navigation/routes.ts';
import { useFavorites } from '../favorites/FavoritesProvider.tsx';
import { usePlace } from '../location/PlaceProvider.tsx';
import { useTheme } from '../../theme/ThemeProvider.tsx';

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { place } = usePlace();
  const { has, toggle, failure } = useFavorites();
  const theme = useTheme();
  return (
    <Screen title="Zenith" caption={place === null ? 'No place selected' : place.name}>
      <View style={styles.actions}>
        <PrimaryButton label="Choose a place" onPress={() => navigation.navigate('LocationSearch')} />
        {place === null ? null : (
          <>
            <Text style={[styles.coordinates, { color: theme.mutedText }]}>
              {`${place.latitude.toFixed(2)}, ${place.longitude.toFixed(2)}`}
            </Text>
            <PrimaryButton
              label={has(place) ? 'Remove from favorites' : 'Add to favorites'}
              onPress={() => void toggle(place)}
            />
          </>
        )}
        {failure === null ? null : (
          <Text accessibilityRole="alert" style={{ color: theme.text }}>
            {failure}
          </Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { marginTop: 24, alignItems: 'center', gap: 12 },
  coordinates: { fontSize: 14 },
});
