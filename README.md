# DevinOS Launcher — HyperOS-style Android launcher

Real Android launcher app written in Kotlin + Jetpack Compose, inspired
by HyperOS / MIUI. Replaces your home screen and app drawer with a
beautiful glassmorphism UI, animated wallpapers, light/dark themes, and
your real installed apps.

> ⚠ This is a **launcher**, not a custom ROM. It replaces the home
> screen / app drawer / wallpaper, the same way MIUI and HyperOS layer
> on top of Android. It does **not** replace lock screen, system
> Settings, or kernel — those need a full custom ROM, which is built
> per device and takes 6+ months.

## What you get

- **Animated wallpapers** — Aurora / Sunset / Ocean / Mono with
  GPU-rendered radial blob fields drifting in real time.
- **Home screen** — search bar, weather + analog clock widgets, live
  app icon grid (your real installed apps), glass dock.
- **App drawer** — fast list of all installed apps with live search
  (swipe up from home, swipe down to dismiss).
- **Settings** — picker for theme (Dark / Light / System) and
  wallpaper, one-tap "Set as default launcher" button.
- **Real launcher integration** — registered as a HOME activity, queries
  `PackageManager` for installed apps, launches them via the standard
  Android launcher intent.
- **Persistent prefs** via DataStore.
- **API 26+** (Android 8.0 Oreo and newer).

## Install

1. Download the APK from the latest PR / release on this repo (or
   build it yourself, see below).
2. On your phone: `Settings → Privacy & security → Install unknown apps`,
   allow your file manager.
3. Open the APK file → Install.
4. Press the HOME button → choose **DevinOS** → **Always**. Done.

To switch back to your previous launcher: `Settings → Apps → Default
apps → Home app`.

## Build

```sh
# Requires JDK 17 + Android SDK with platforms;android-34, build-tools;34.0.0
./gradlew :app:assembleRelease
# APK at app/build/outputs/apk/release/app-release.apk
```

The release build is signed with the standard Android **debug
keystore** (the same one Android Studio uses for `./gradlew installDebug`)
so the APK is installable without you needing your own keystore. Replace
the signing config in `app/build.gradle.kts` before publishing to a store.

## Project layout

```
app/src/main/
├── AndroidManifest.xml
├── kotlin/com/zavtrak/devinos/
│   ├── DevinOSApplication.kt
│   ├── MainActivity.kt
│   ├── data/
│   │   ├── AppRepository.kt        # PackageManager queries + launching
│   │   └── SettingsRepository.kt   # DataStore for theme + wallpaper
│   └── ui/
│       ├── LauncherShell.kt        # nav between Home / Drawer / Settings
│       ├── HomeScreen.kt           # search, widgets, app grid, dock
│       ├── AppDrawer.kt            # all-apps grid with search
│       ├── SettingsScreen.kt       # theme + wallpaper picker
│       ├── Wallpaper.kt            # animated radial blob wallpaper
│       ├── Widgets.kt              # weather + analog clock widgets
│       ├── AppIcon.kt              # icon tile with rounded squircle
│       └── theme/Theme.kt          # Material 3 dark/light color schemes
└── res/                            # icons, themes, strings
```

## License

MIT (or whatever zavtrakxd/test prefers).
