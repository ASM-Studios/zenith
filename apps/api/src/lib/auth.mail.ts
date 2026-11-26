import type { Mail } from './mailer.ts';

interface Recipient {
  email: string;
  name: string;
}

export function verificationMail(user: Recipient, url: string): Mail {
  return {
    to: user.email,
    subject: 'Confirm your Zenith email address',
    text: [
      `Hello ${user.name},`,
      '',
      'Open this link to confirm your email address and activate your Zenith account:',
      url,
      '',
      'If you did not create an account, ignore this message.',
    ].join('\n'),
  };
}

export function existingAccountMail(user: Recipient): Mail {
  return {
    to: user.email,
    subject: 'Someone tried to create a Zenith account with your address',
    text: [
      `Hello ${user.name},`,
      '',
      'A sign-up was attempted with your email address, which already has a Zenith account.',
      'If it was you, sign in with your existing password. Otherwise no action is needed.',
    ].join('\n'),
  };
}
