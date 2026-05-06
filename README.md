# Super Browser

A snappy WebView-based Android browser written in Kotlin + Jetpack Compose.

It runs on top of the system WebView (Chromium) and adds a stack of features
on top:

- **Multiple tabs** with a grid switcher and incognito-mode tabs.
- **Built-in ad / tracker blocker** powered by a hosts-format block list
  (StevenBlack) cached on device.
- **Force dark mode for any site** via `WebSettingsCompat`.
- **Search engine picker**: DuckDuckGo, Google, Bing, Yandex, Brave, Startpage,
  Ecosia.
- **Bookmarks, history, and downloads** with their own bottom-sheet screens.
- **Find in page** with next / previous navigation.
- **Reader mode** (heuristic JS injection — works on most article pages).
- **Desktop site toggle** per tab + a global default.
- **Save current page as PDF** via Android's print framework.
- **Material 3 theming** with optional Material You dynamic color (Android 12+)
  and an app-wide light / dark / system theme switch.
- **Biometric / device-credential app lock**.
- **Custom User-Agent**, page zoom slider (50–200%), Do-Not-Track header,
  cookie controls, popup blocking and JavaScript toggle.
- **Default browser support** — opens HTTP(S) intents and `Intent.ACTION_SEND`
  shares from other apps.

## Building

Requires JDK 17 and an Android SDK with `platforms;android-34` and
`build-tools;34.0.0` installed.

```sh
export ANDROID_HOME=/path/to/android-sdk
./gradlew :app:assembleRelease
# APK at app/build/outputs/apk/release/app-release.apk
```

The release APK is signed with the standard Android debug keystore that ships
in the repo so the produced APK is installable on any device. **Replace the
keystore before publishing to a real store.**

## Project layout

```
app/
├── src/main/AndroidManifest.xml
├── src/main/kotlin/com/zavtrak/superbrowser/
│   ├── BrowserApplication.kt          # app entry, settings cache, ad-blocker bootstrap
│   ├── MainActivity.kt                # Compose host, intent routing
│   ├── adblock/AdBlocker.kt           # hosts-list ad/tracker blocker
│   ├── browser/                       # tabs, ViewModel, WebView clients
│   ├── data/PersistenceStore.kt       # bookmarks, history, downloads (JSON in prefs)
│   ├── search/SearchEngine.kt         # search engine catalog + URL classifier
│   ├── settings/SettingsRepository.kt # DataStore-backed settings
│   └── ui/                            # Jetpack Compose screens
└── src/main/res/                      # icons, strings, themes
```
