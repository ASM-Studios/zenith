# Mobile setup (Android and iOS)

Each command below starts the Expo dev server (Metro, port 8081) and opens the app in Expo Go, on the Android emulator, on a phone, or in the iOS simulator.

| Command                    | Target                                    | API URL used by the app                            |
| -------------------------- | ----------------------------------------- | -------------------------------------------------- |
| `npm run android:emulator` | Emulator `zenith` on this machine         | `http://10.0.2.2:3000` (the emulator's host alias) |
| `npm run android:phone`    | Physical phone plugged in over USB        | `http://localhost:3000` through `adb reverse`      |
| `npm run ios:simulator`    | iOS simulator on a Mac                    | `http://localhost:3000` (the simulator shares the Mac network) |

Start the API first (`npm run dev` or `docker compose up -d`): it listens on port 3000.

## Tooling

The install lines below apply to Linux. On a Mac, follow the [macOS](#macos) section instead.

The commands need `adb` and, for the emulator, `emulator` and `avdmanager`.

- **With devenv (default on NixOS):** nothing to install. The commands re-run themselves inside the opt-in `android` devenv profile, which provides the SDK, the emulator and the Android 36 system images for `x86_64` and `arm64-v8a`. The first run downloads a few GB and accepts the Android SDK license set in `devenv.yaml`. The virtual device lives in `.android/` (ignored by git).
- **Without devenv:** install a JDK 17 or newer (`openjdk-17-jre-headless` on Debian and Ubuntu, `java-21-openjdk-headless` on Fedora, `jre17-openjdk-headless` on Arch), `curl` and `unzip`, then run `bash apps/mobile/scripts/dev-env/install-sdk.sh`. It installs the command line tools, `platform-tools`, `emulator`, `platforms;android-36` and the system image of your architecture in `~/Android/Sdk`, accepts the licenses and prints the `ANDROID_HOME` and `PATH` lines to add to your shell profile.

The system image follows the machine: `x86_64` on Intel and AMD, `arm64-v8a` on ARM Linux.

The emulator needs hardware virtualization: `/dev/kvm` must exist and your user must be in the `kvm` group. The command prints the fix for your distribution when it does not.

## Check the setup on a clean distribution

A clean Ubuntu or Fedora container installs the packages, the SDK and Node, then boots the emulator without a window. It needs Docker and `/dev/kvm`, so it also runs on NixOS:

```sh
bash apps/mobile/scripts/dev-env/run-in-docker.sh ubuntu:24.04
bash apps/mobile/scripts/dev-env/run-in-docker.sh fedora:42
```

The `Dev environment` workflow runs the same two commands on every pull request that touches the mobile scripts or `devenv.nix`. A distribution is supported when its job is green.

## Emulator

`npm run android:emulator` creates the `zenith` virtual device when it is missing, boots it, waits until Android is ready, then starts Expo on it. Run it again later: a running emulator is reused.

## Phone over USB

1. On the phone, open Settings, About phone, and tap Build number seven times to enable developer options.
2. In Settings, Developer options, turn on USB debugging.
3. Plug the phone in with a data cable, unlock it and accept the "Allow USB debugging" prompt.
4. Run `npm run android:phone`.

The command checks that exactly one authorized phone is connected, then runs `adb reverse tcp:8081 tcp:8081` and `adb reverse tcp:3000 tcp:3000`. Reverse forwarding makes `localhost` on the phone reach Metro and the API on this machine through the cable. No firewall rule, no shared Wi-Fi and no tunnel service are needed. Expo starts with `--localhost`, so Expo Go opens `exp://localhost:8081` instead of the LAN address, which the phone cannot reach without the same Wi-Fi.

## macOS

### iOS simulator

1. Install Xcode from the App Store.
2. Select it as the active developer directory: `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`.
3. Open Xcode once to finish its first launch, or run `sudo xcodebuild -runFirstLaunch`.
4. Download the iOS platform: `xcodebuild -downloadPlatform iOS`.
5. Install Watchman, which Expo recommends for file watching on macOS: `brew install watchman`.

Then run `npm run ios:simulator`. The command works on macOS only and refuses Linux. It checks that Xcode is selected and that `xcrun simctl` runs, then lists the iPhone simulators. It reuses a booted one, or boots an iPhone of the newest iOS runtime. It opens the Simulator app, then runs `expo start --ios`, which installs Expo Go on the simulator and opens the app. The home screen shows "Core" with the version of `@zenith/core`. The app calls the API at `http://localhost:3000`, because the simulator shares the Mac network. `EXPO_PUBLIC_API_URL` overrides it.

No Apple developer account, no Expo account and no tunnel service are needed. A real iPhone is out of scope.

### Android emulator on a Mac

The Android emulator works on Intel and Apple Silicon Macs with `npm run android:emulator`.

1. Install a JDK 17 or newer: `brew install openjdk@17`.
2. Run `bash apps/mobile/scripts/dev-env/install-sdk.sh`. On macOS it downloads the Mac command line tools and installs them in `~/Library/Android/sdk`, the Android Studio location, unless `ANDROID_HOME` is set. It prints the `ANDROID_HOME` and `PATH` lines to add to `~/.zshrc`.

The system image is `arm64-v8a` on Apple Silicon and `x86_64` on Intel. macOS uses Hypervisor.framework, so there is no KVM step.

An Android Studio SDK at `~/Library/Android/sdk` works too, as long as `adb`, `emulator` and `avdmanager` are on `PATH`.

The devenv `android` profile is the Linux path. It is tested on Ubuntu and Fedora in CI, not on macOS.

## Troubleshooting

| Message or symptom                   | Fix                                                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `adb was not found`                  | Install the tooling above, or install devenv so the `android` profile is used.                       |
| `No phone found`                     | Check the cable (data, not charge only), USB debugging, and that the screen is unlocked.             |
| Phone `unauthorized`                 | Accept the "Allow USB debugging" prompt on the phone. Revoke USB debugging authorizations if it never appears. |
| Phone `no permissions`               | adb cannot open the USB device. Apply the udev fix below, replug the phone and run `adb kill-server`. |
| `/dev/kvm is missing` or not accessible | Enable virtualization in the BIOS, then use the fix the command prints (see KVM below).           |
| Several phones connected             | Unplug all but one.                                                                                  |
| `The iOS simulator needs macOS`      | Use the Android emulator on Linux: `npm run android:emulator`.                                        |
| `Xcode was not found` or `Only the Command Line Tools are selected` | Install Xcode from the App Store, then run `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`. |
| `Xcode is not set up yet`            | Run `sudo xcodebuild -runFirstLaunch` (it needs an admin password).                                  |
| `No iPhone simulator found`          | Run `xcodebuild -downloadPlatform iOS`, or download the iOS platform in Xcode, Settings, Components. |
| The app starts but shows API errors  | Start the API on port 3000. On a release build the API must be https.                                |
| The iOS app shows API errors         | Start the API on port 3000. `localhost` is the Mac, so the API must run on this machine.             |
| Metro serves a stale bundle          | `npm run dev:mobile -- --clear`.                                                                     |

### udev rules for the phone

| Distribution      | Fix                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------ |
| Debian and Ubuntu | `sudo apt install android-sdk-platform-tools-common && sudo usermod -aG plugdev "$USER"`   |
| Fedora            | `sudo dnf install android-tools` (its udev rules grant the logged-in user access)          |
| Arch              | `sudo pacman -S android-udev && sudo usermod -aG adbusers "$USER"`                         |

Log out and in again after a group change, then replug the phone.

### KVM

| Distribution      | Fix                                                                     |
| ----------------- | ----------------------------------------------------------------------- |
| Debian and Ubuntu | `sudo apt install qemu-kvm && sudo adduser "$USER" kvm`                 |
| Fedora            | `sudo dnf install qemu-kvm && sudo usermod -aG kvm "$USER"`             |
| Arch              | `sudo pacman -S qemu-base && sudo usermod -aG kvm "$USER"`              |

Avoid `expo start --tunnel`: it goes through a third-party service and an account.
