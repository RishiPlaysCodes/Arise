// ============================================================================
// APP BLOCKER SERVICE
//
// IMPORTANT / HONEST NOTE ON CAPABILITIES:
// ------------------------------------------------------------------
// True system-wide blocking of OTHER apps (Instagram, YouTube, etc.) on
// Android is only possible via an Accessibility Service or the UsageStats +
// overlay approach, which require sensitive permissions the user must grant
// manually in system settings, and which Google Play reviews strictly.
//
// This service provides:
//   1. A fully-working IN-APP lockdown (enforced by the app itself) - 100%
//      functional with no special permissions.
//   2. A bridge interface (`NativeAppBlocker`) that, when the optional native
//      Accessibility module is installed (see /android-accessibility docs),
//      will actually intercept and block the configured apps. If the native
//      module is absent, we degrade gracefully to reminders + overlay prompts.
//
// We NEVER silently pretend blocking works. `getCapability()` reports the
// real, current enforcement level so the UI can be honest with the user.
// ============================================================================

import { NativeModules, Platform, Linking } from 'react-native';

const NativeAppBlocker = NativeModules.SoloAppBlocker || null;

// Friendly name -> Android package name(s). Extend as needed.
export const PACKAGE_MAP = {
  Instagram: ['com.instagram.android'],
  'Twitter/X': ['com.twitter.android'],
  Facebook: ['com.facebook.katana'],
  TikTok: ['com.zhiliaoapp.musically', 'com.ss.android.ugc.trill'],
  Snapchat: ['com.snapchat.android'],
  Reddit: ['com.reddit.frontpage'],
  YouTube: ['com.google.android.youtube'],
  Netflix: ['com.netflix.mediaclient'],
  'Disney+': ['com.disney.disneyplus'],
  'Prime Video': ['com.amazon.avod.thirdpartyclient'],
  Spotify: ['com.spotify.music'],
  Games: [],
  Twitch: ['tv.twitch.android.app'],
};

export function toPackageNames(friendlyNames) {
  const out = [];
  for (const n of friendlyNames) {
    const pkgs = PACKAGE_MAP[n];
    if (pkgs) out.push(...pkgs);
  }
  return out;
}

export const AppBlockerService = {
  // Reports the REAL enforcement level available right now.
  async getCapability() {
    if (Platform.OS !== 'android') {
      return { level: 'in_app_only', reason: 'System-wide app blocking is Android-only.' };
    }
    if (!NativeAppBlocker) {
      return {
        level: 'in_app_only',
        reason: 'Native accessibility blocker not installed. In-app lockdown is active; system-wide blocking requires the optional native module + Accessibility permission.',
      };
    }
    try {
      const enabled = await NativeAppBlocker.isAccessibilityEnabled();
      return enabled
        ? { level: 'system_wide', reason: 'Accessibility service active — configured apps will be blocked device-wide.' }
        : { level: 'permission_needed', reason: 'Grant Accessibility permission to enable system-wide blocking.' };
    } catch {
      return { level: 'in_app_only', reason: 'Native module error; falling back to in-app lockdown.' };
    }
  },

  // Open the system Accessibility settings so the user can grant permission.
  async requestSystemPermission() {
    if (NativeAppBlocker?.openAccessibilitySettings) {
      return NativeAppBlocker.openAccessibilitySettings();
    }
    // Fallback: open general accessibility settings
    if (Platform.OS === 'android') {
      try {
        await Linking.sendIntent('android.settings.ACCESSIBILITY_SETTINGS');
        return true;
      } catch {
        return false;
      }
    }
    return false;
  },

  // Push the list of package names to block to the native service (if present).
  async setBlockedApps(packageNames, untilIso) {
    if (NativeAppBlocker?.setBlockedApps) {
      return NativeAppBlocker.setBlockedApps(packageNames, untilIso);
    }
    return false; // in-app lockdown handles enforcement within our app
  },

  async clearBlocks() {
    if (NativeAppBlocker?.clearBlocks) {
      return NativeAppBlocker.clearBlocks();
    }
    return false;
  },

  isNativeAvailable() {
    return !!NativeAppBlocker;
  },
};

export default AppBlockerService;
