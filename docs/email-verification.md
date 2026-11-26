# Email verification

Sign-up creates the user unverified and mails a verification link. Better Auth is configured with `requireEmailVerification: true` in `apps/api/src/lib/auth.ts`. Mail is sent by `apps/api/src/lib/mailer.ts` and its texts come from `apps/api/src/lib/auth.mail.ts`. The `/api/me/*` routes only serve verified users, see [Responses](#responses).

## Settings

| Variable | Required | Example | Purpose |
| --- | --- | --- | --- |
| `SMTP_URL` | yes | `smtp://user:pass@smtp.example.com:587` | SMTP server, `smtp://` or `smtps://`, credentials allowed. Mailpit locally: `smtp://localhost:1025` |
| `MAIL_FROM` | yes | `Zenith <no-reply@zenith.example>` | Sender of the verification and notice mails |

Mail is sent with nodemailer over SMTP, so any provider's relay works. Tests mock mail sending.

## Flow

1. `POST /api/auth/sign-up/email` creates the user, unverified, and mails a link to `GET /api/auth/verify-email?token=...`.
2. Opening the link marks the address verified.
3. `POST /api/auth/sign-in/email` answers `200` with the session cookie.

A sign-in before step 2 is refused with `403`, sets no cookie and mails a fresh link.

## Responses

| Status | Body | Case |
| --- | --- | --- |
| `200` | `{ "token": null, "user": { ... } }`, no cookie | Sign-up, new address: user created, verification link mailed |
| `200` | `{ "token": null, "user": { ... } }`, no cookie | Sign-up, address already registered: same shape, the user is synthetic, nothing created, notice mailed to the owner |
| `403` | `{ "code": "EMAIL_NOT_VERIFIED", ... }`, no cookie | Sign-in, address not verified: fresh link mailed |
| `200` | user and session cookie | Sign-in, address verified |
| `401` | Better Auth error body | `/api/me/*`, no session |
| `403` | Error body | `/api/me/*`, session of a user not verified (sessions that predate verification) |

## Enumeration notes

- Sign-up answers the same status and body shape for a new and an already registered address. The response never reveals whether the address exists.
- A duplicate sign-up creates no row and sends no verification mail. The owner of the address gets a notice that someone tried to register with it.
- Sign-in checks the password before the verification state. An unknown address and a wrong password both answer `401`, and the `403` only reaches a caller who already holds the right password.

## Legacy accounts

Accounts created before this change and never verified cannot sign in until they use a link. Signing in sends a fresh link to the address on the account.
