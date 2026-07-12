# @app/mobile-customer

Native customer app — Expo/React Native, per [Architecture ADR-007](../../docs/02-architecture/ARCHITECTURE.md#adr-007-react-native-for-customer--delivery-partner-apps). Screens correspond to plates 01–07 in the [Wireframe Gallery](../../docs/05-ui-wireframes/wireframe-gallery.html).

**Why Expo, specifically:** managed workflow gives OTA updates (ship a bug fix without an app-store review cycle — meaningful for a small team's first months live) and covers every native API this app needs (maps, secure storage, push, camera) without ejecting. Bare React Native is the fallback only if a specific native module proves incompatible with the managed workflow — not expected here, unlike `@app/mobile-delivery`'s background-location caveat.

## Status

Scaffolded (Phase 6). Implementation begins Phase 8. `app.config.example.json` → copy to `app.config.json` (git-ignored) for local runs.
