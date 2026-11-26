# Email verification

Sign-up creates the user unverified and mails a verification link. Better Auth is configured with `requireEmailVerification: true` in `apps/api/src/lib/auth.ts`. Mail is sent by `apps/api/src/lib/mailer.ts` and its texts come from `apps/api/src/lib/auth.mail.ts`. The `/api/me/*` routes only serve verified users, see [Responses](#responses).

## Settings

| Variable | Required | Example | Purpose |
| --- | --- | --- | --- |
| `SMTP_URL` | yes | `smtp://user:pass@smtp.example.com:587` | SMTP server, `smtp://` or `smtps://`, credentials allowed. Mailpit locally: `smtp://localhost:1025` |
| `MAIL_FROM` | yes | `Zenith <no-reply@zenith.example>` | Sender of the verification and notice mails |
| `BETTER_AUTH_TRUSTED_ORIGINS` | no | `http://localhost:5173,http://localhost:8080` | Web origins allowed to call the auth routes and to host the page a mailed link opens |

Mail is sent with nodemailer over SMTP, so any provider's relay works. Tests mock mail sending.

## Flow

1. `POST /api/auth/sign-up/email` creates the user, unverified, and mails a link. With an absolute `callbackURL` the link opens that web page with the token; without one it opens `GET /api/auth/verify-email?token=...`.
2. `GET /api/auth/verify-email?token=...` marks the address verified and signs the user in (`autoSignInAfterVerification`): the `200` answer carries the session cookie. It answers `401` with the code `TOKEN_EXPIRED` or `INVALID_TOKEN` and no cookie for a bad token.
3. Later visits use `POST /api/auth/sign-in/email`, which answers `200` with the session cookie.

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

## Try it in the web app

The web app has plain test pages at `/<lang>/sign-up` and `/<lang>/sign-in`. Both send a `callbackURL` of `<web origin>/<lang>/verify-email`. The API mails a link to that page with the token (`<web origin>/<lang>/verify-email?token=...`), so the link never opens the API. The page sends the token to `GET /api/auth/verify-email`, reads the session the API just opened, and moves to the sign-in page, which reports a confirmed, expired or invalid link and shows the signed-in user. The settings page (`/<lang>/settings`) badges the email as verified. A client that sends no `callbackURL`, or a relative one, still gets the API link.

1. Start Mailpit: `docker run --rm -p 1025:1025 -p 8025:8025 axllent/mailpit`.
2. Keep `BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:5173,http://localhost:8080` in `.env` (see `.env.example`). Better Auth rejects auth requests from any other origin with `403 INVALID_ORIGIN`, and refuses a `callbackURL` outside these origins with `403 INVALID_CALLBACK_URL`, so a mailed link only ever points to a trusted web page.
3. Start the API with `npm run dev` (it needs Postgres and Redis, see the README) and the web app with `npm run dev:web`, then open `http://localhost:5173/en/sign-up`.
4. Read the mail at `http://localhost:8025` and open the link, then sign in and sign out.
