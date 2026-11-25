# Mobile setup (Android)

Two commands run the app on Android. Both start the Expo dev server (Metro, port 8081) and open the app in Expo Go.

| Command                    | Target                                    | API URL used by the app                          |
| -------------------------- | ----------------------------------------- | ------------------------------------------------ |
| `npm run android:emulator` | Emulator `zenith` on this machine         | `http://10.0.2.2:3000` (the emulator's host alias) |
| `npm run android:phone`    | Physical phone plugged in over USB        | `http://localhost:3000` through `adb reverse`    |

Start the API first (`npm run dev` or `docker compose up -d`): it listens on port 3000.

## Tooling

The commands need `adb` and, for the emulator, `emulator` and `avdmanager`.

- **With devenv (default on NixOS):** nothing to install. The commands re-run themselves inside the opt-in `android` devenv profile, which provides the SDK, the emulator and the Android 36 x86_64 system image. The first run downloads a few GB and accepts the Android SDK license set in `devenv.yaml`. The virtual device lives in `.android/` (ignored by git).
- **Without devenv:** install Android Studio or the command line tools, add `platform-tools`, `emulator`, `platforms;android-36` and `system-images;android-36;google_apis_playstore;x86_64`, and put them on `PATH`.

The emulator needs hardware virtualization: `/dev/kvm` must exist and your user must be in the `kvm` group.

## Emulator

`npm run android:emulator` creates the `zenith` virtual device when it is missing, boots it, waits until Android is ready, then starts Expo on it. Run it again later: a running emulator is reused.

## Phone over USB

1. On the phone, open Settings, About phone, and tap Build number seven times to enable developer options.
2. In Settings, Developer options, turn on USB debugging.
3. Plug the phone in with a data cable, unlock it and accept the "Allow USB debugging" prompt.
4. Run `npm run android:phone`.

The command checks that exactly one authorized phone is connected, then runs `adb reverse tcp:8081 tcp:8081` and `adb reverse tcp:3000 tcp:3000`. Reverse forwarding makes `localhost` on the phone reach Metro and the API on this machine through the cable. No firewall rule, no shared Wi-Fi and no tunnel service are needed. Expo starts with `--localhost`, so Expo Go opens `exp://localhost:8081` instead of the LAN address, which the phone cannot reach without the same Wi-Fi.

## Troubleshooting

| Message or symptom                   | Fix                                                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `adb was not found`                  | Install the tooling above, or install devenv so the `android` profile is used.                       |
| `No phone found`                     | Check the cable (data, not charge only), USB debugging, and that the screen is unlocked.             |
| Phone `unauthorized`                 | Accept the "Allow USB debugging" prompt on the phone. Revoke USB debugging authorizations if it never appears. |
| Phone `no permissions`               | adb cannot open the USB device. Check `adb devices`, the `plugdev` group and the udev rules of your distribution. |
| `/dev/kvm is missing`                | Enable virtualization in the BIOS and add your user to the `kvm` group.                              |
| Several phones connected             | Unplug all but one.                                                                                  |
| The app starts but shows API errors  | Start the API on port 3000. On a release build the API must be https.                                |
| Metro serves a stale bundle          | `npm run dev:mobile -- --clear`.                                                                     |

Avoid `expo start --tunnel`: it goes through a third-party service and an account.
