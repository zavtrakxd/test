# DevinOS — HyperOS-style mobile shell

Beautiful, interactive mobile-OS shell in pure HTML/CSS/JS, inspired by
HyperOS / MIUI / iOS. Runs in any modern browser — including the one on
your phone.

> ⚠ This is not a real Android replacement. It's a high-fidelity,
> clickable simulation of a modern mobile OS that runs in a browser.

## Features

- **Lock screen** with big clock, date, weather + music widgets,
  flashlight / camera shortcuts, swipe-up to unlock.
- **Home screen** with weather + clock big widgets, app grid (18 apps),
  HyperOS-style squircle icons, dock with glassmorphism, page dots.
- **Control center** (swipe down from top-right) with quick toggles,
  brightness / volume sliders, music card, mini toggles, theme switch.
- **Notification panel** (swipe down from top-left) with stacked
  notification cards and entrance animation.
- **App switcher / recents** (long swipe up from the bottom).
- **18 working app screens** — Settings, Calculator (functional),
  Weather (hourly + weekly), Notes, Photos, Calendar (live month),
  Clock (world time + alarms), Music, Messages, Phone, Mail, Browser,
  Camera (viewfinder), Maps, Files, Wallet, Store, Themes.
- **Light / dark themes** + 4 wallpapers (Aurora, Sunset, Ocean, Mono)
  with animated gradient blobs.
- **Live status bar** clock, animated analog clock widget, smooth
  spring animations, glassmorphism panels.
- Fully responsive — looks like a phone in a frame on desktop, fills
  the whole viewport on mobile.

## Run locally

```sh
# any static server works
python3 -m http.server 8000
# → open http://localhost:8000
```

## Files

```
index.html   # markup, layered screens, panels, app host
styles.css   # full theme system, animations, glassmorphism
app.js       # apps registry, screen state, gestures, app renderers
```

## Gestures / shortcuts

| Action | Effect |
| --- | --- |
| Swipe ↑ from bottom (locked) | Unlock |
| Swipe ↑ from bottom (in app) | Close app |
| Long swipe ↑ from bottom | Open recents |
| Swipe ↓ top-right | Open Control Center |
| Swipe ↓ top-left  | Open Notifications |
| Tap outside panel | Close panel |
| `Esc` | Close panel / app / lock |
