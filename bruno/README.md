# Zenith API collection

Bruno collection in the OpenCollection YAML format. It covers `/ping`, `/api/auth/*`, `/api/me/locations`, `/api/me/preferences` and the request validation of `/api/weather/*`.

## Run

Start the stack (`docker compose up -d --build`), then from this folder:

```
bru run --env local --delay 3500
```

Or open the folder in Bruno and pick the `local` environment.

## Notes

- Requests run in order and share variables: the folders `auth`, `locations`, `preferences` and `isolation` build on each other, so run the whole collection.
- Better Auth rate limits sign-in and sign-up (about 3 per 10 s). Some requests wait 10.5 s before they run, and `--delay` spaces the others.
- Every run signs up two new users with a timestamped email, so the collection can be replayed on the same database.
- Cookie POSTs to `/api/auth/*` need an `Origin` header, set from the `origin` variable.
