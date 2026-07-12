# @app/mobile-delivery

Native delivery-partner app — offer accept/reject, navigation, OTP delivery handoff, earnings/wallet. Screens correspond to plates 15–17 in the [Wireframe Gallery](../../docs/05-ui-wireframes/wireframe-gallery.html).

**Expo, with a flagged exception:** per [Architecture ADR-007](../../docs/02-architecture/ARCHITECTURE.md#adr-007-react-native-for-customer--delivery-partner-apps), background location tracking while the app is backgrounded (needed for live-location pings mid-delivery) is the one feature that may need a native module beyond Expo's managed-workflow location APIs. Start managed (`expo-location`'s background task support covers most of this); only eject to bare workflow if a Phase 7/8 spike finds it insufficient — don't pre-emptively eject.

## Status

Scaffolded (Phase 6). Implementation begins Phase 8.
