# Account deletion

A signed-in user deletes their own account with Better Auth's `delete-user` endpoint, enabled in `apps/api/src/lib/auth.ts`. The catch-all in `apps/api/src/modules/auth/auth.routes.ts` forwards it.

## Route

`POST /api/auth/delete-user`, with the session cookie and an `Origin` header. An anonymous request is refused with `401`.

```json
{ "password": "..." }
```

## Confirming the deletion

| Body | Accepted when |
| --- | --- |
| `{ "password": "..." }` | The password matches the credential account. A wrong password is refused with `400` (`INVALID_PASSWORD`). |
| `{}` | The session is fresh, meaning younger than `session.freshAge` (1 day by default). An older session is refused. |

## Responses

| Status | Body | Case |
| --- | --- | --- |
| `200` | `{ "success": true, "message": "User deleted" }` | The user is deleted |
| `400` | `{ "code": "INVALID_PASSWORD", ... }` | Wrong password |
| `401` | Better Auth error body | No session |

## What is deleted

The `user` row is deleted and the foreign keys cascade to every row owned by that user:

- `session`
- `account`
- `location`
- `user_preference`

Other users' rows are untouched, including locations at the same coordinates. The schema is described in `database.md`.

## Bruno

`bruno/auth/` signs up a throwaway user, tries the wrong password, deletes the account, then signs user A in again so the later folders keep their session.
