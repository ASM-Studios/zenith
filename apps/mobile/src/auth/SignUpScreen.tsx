import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/routes.ts';
import { AuthForm } from './AuthForm.tsx';
import { useSession } from './SessionProvider.tsx';

export function SignUpScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'SignUp'>) {
  const { signUp } = useSession();
  return (
    <AuthForm
      alternateLabel="I already have an account"
      onAlternate={() => navigation.replace('SignIn')}
      onSubmit={async (input) => {
        await signUp(input);
        navigation.goBack();
      }}
      submitLabel="Create account"
      withName
    />
  );
}
