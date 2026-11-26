import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton.tsx';
import { TextField } from '../components/TextField.tsx';
import { useTheme } from '../theme/ThemeProvider.tsx';
import { authErrorMessage } from './auth-error.ts';
import { hasErrors, validateSignIn, validateSignUp, type CredentialErrors, type SignUpInput } from './credentials.ts';

type AuthFormProps = {
  withName: boolean;
  submitLabel: string;
  alternateLabel: string;
  onAlternate: () => void;
  onSubmit: (input: SignUpInput) => Promise<void>;
};

export function AuthForm({ withName, submitLabel, alternateLabel, onAlternate, onSubmit }: AuthFormProps) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<CredentialErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const input = { name, email, password };
    const found = withName ? validateSignUp(input) : validateSignIn(input);
    setErrors(found);
    setFailure(null);
    if (hasErrors(found) || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(input);
    } catch (error) {
      setFailure(authErrorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {withName ? (
        <TextField
          autoCapitalize="words"
          autoComplete="name"
          error={errors.name}
          label="Name"
          onChangeText={setName}
          value={name}
        />
      ) : null}
      <TextField
        autoCapitalize="none"
        autoComplete="email"
        error={errors.email}
        keyboardType="email-address"
        label="Email"
        onChangeText={setEmail}
        value={email}
      />
      <TextField
        autoCapitalize="none"
        autoComplete={withName ? 'new-password' : 'current-password'}
        error={errors.password}
        label="Password"
        onChangeText={setPassword}
        secureTextEntry
        textContentType={withName ? 'newPassword' : 'password'}
        value={password}
      />
      {failure === null ? null : (
        <Text accessibilityRole="alert" style={{ color: theme.text }}>
          {failure}
        </Text>
      )}
      <PrimaryButton label={submitting ? 'Please wait' : submitLabel} onPress={() => void submit()} />
      <PrimaryButton label={alternateLabel} onPress={onAlternate} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 16, gap: 12 } });
