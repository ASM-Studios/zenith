import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { username } from 'better-auth/plugins';
import { db } from '../db/index.ts';
import * as schema from '../db/schema/index.ts';
import { existingAccountMail, verificationMail } from './auth.mail.ts';
import { sendMail } from './mailer.ts';
import { hashPassword, verifyPassword } from './password.ts';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    onExistingUserSignUp: ({ user }) => sendMail(existingAccountMail(user)),
    password: {
      hash: hashPassword,
      verify: ({ hash, password }) => verifyPassword(hash, password),
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    sendVerificationEmail: ({ user, url }) => sendMail(verificationMail(user, url)),
  },
  user: { deleteUser: { enabled: true } },
  plugins: [username()],
});
