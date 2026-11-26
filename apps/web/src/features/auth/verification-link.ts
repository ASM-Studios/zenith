import type { MessageTone } from './message-tone.ts';

export type VerificationNotice = 'verified' | 'expired' | 'invalid';

const noticeTones: Record<VerificationNotice, MessageTone> = {
  verified: 'ok',
  expired: 'watch',
  invalid: 'danger',
};

export function verificationNoticeTone(notice: VerificationNotice): MessageTone {
  return noticeTones[notice];
}

export function verificationCallback(origin: string, language: string): string {
  return `${origin}/${language}/verify-email`;
}

export function signInAfterVerification(language: string, error?: string): string {
  const params = new URLSearchParams({ verified: '1', ...(error ? { error } : {}) });
  return `/${language}/sign-in?${params.toString()}`;
}

export function verificationNotice(search: string): VerificationNotice | undefined {
  const params = new URLSearchParams(search);
  const error = params.get('error');
  if (error === 'TOKEN_EXPIRED') {
    return 'expired';
  }
  if (error !== null) {
    return 'invalid';
  }
  return params.has('verified') ? 'verified' : undefined;
}
