import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/routes.ts';
import { AuthForm } from './AuthForm.tsx';
import { useSession } from './SessionProvider.tsx';

export function SignInScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'SignIn'>) {
  const { signIn } = useSession();
  return (
    <AuthForm
      alternateLabel="Create an account"
      onAlternate={() => navigation.replace('SignUp')}
      onSubmit={async ({ email, password }) => {
        await signIn({ email, password });
        navigation.goBack();
      }}
      submitLabel="Sign in"
      withName={false}
    />
  );
}
