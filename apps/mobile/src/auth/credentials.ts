export const minPasswordLength = 8;
export const maxPasswordLength = 128;

export type CredentialField = 'name' | 'email' | 'password';
export type CredentialErrors = Partial<Record<CredentialField, string>>;

export type SignInInput = { email: string; password: string };
export type SignUpInput = SignInInput & { name: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function failing(field: CredentialField, failed: boolean, message: string): CredentialErrors {
  return failed ? { [field]: message } : {};
}

function emailErrors(email: string): CredentialErrors {
  return failing('email', !emailPattern.test(email.trim()), 'Enter a valid email address.');
}

function newPasswordErrors(password: string): CredentialErrors {
  if (password.length < minPasswordLength) {
    return failing('password', true, `Use at least ${minPasswordLength} characters.`);
  }
  return failing('password', password.length > maxPasswordLength, `Use at most ${maxPasswordLength} characters.`);
}

export function validateSignIn({ email, password }: SignInInput): CredentialErrors {
  return { ...emailErrors(email), ...failing('password', password === '', 'Enter your password.') };
}

export function validateSignUp({ name, email, password }: SignUpInput): CredentialErrors {
  return {
    ...failing('name', name.trim() === '', 'Enter your name.'),
    ...emailErrors(email),
    ...newPasswordErrors(password),
  };
}

export function hasErrors(errors: CredentialErrors): boolean {
  return Object.keys(errors).length > 0;
}
