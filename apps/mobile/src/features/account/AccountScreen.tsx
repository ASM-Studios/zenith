import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import { useSession } from '../../auth/SessionProvider.tsx';
import { PrimaryButton } from '../../components/PrimaryButton.tsx';
import { Screen } from '../../components/Screen.tsx';
import type { RootStackParamList } from '../../navigation/routes.ts';

const signedOutCaption = 'You use Zenith without an account. Your favorites stay on this device.';

export function AccountScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { state, signOut } = useSession();

  if (state.status === 'loading') {
    return <Screen title="Account" caption="Checking your account" />;
  }
  if (state.status === 'signedIn') {
    return (
      <Screen title="Account" caption={`${state.user.name}, ${state.user.email}`}>
        <View style={styles.actions}>
          <PrimaryButton label="Sign out" onPress={() => void signOut()} />
        </View>
      </Screen>
    );
  }
  return (
    <Screen title="Account" caption={signedOutCaption}>
      <View style={styles.actions}>
        <PrimaryButton label="Sign in" onPress={() => navigation.navigate('SignIn')} />
        <PrimaryButton label="Create an account" onPress={() => navigation.navigate('SignUp')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ actions: { marginTop: 24, alignItems: 'center', gap: 12 } });
