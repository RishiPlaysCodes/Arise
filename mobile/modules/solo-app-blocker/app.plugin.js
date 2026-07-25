/* eslint-disable */
// ============================================================================
// Expo Config Plugin: solo-app-blocker
//
// Injects the Android AccessibilityService + required permissions during
// `expo prebuild`, so the native app-blocker becomes part of the app.
// Add to app.json plugins: "./modules/solo-app-blocker/app.plugin.js"
// Then run: npx expo prebuild --clean && npx expo run:android
// ============================================================================

const {
  withAndroidManifest,
  withDangerousMod,
  AndroidConfig,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PACKAGE = 'com.sololevelling.appblocker';

function addPermissions(config) {
  const perms = [
    'android.permission.QUERY_ALL_PACKAGES',
    'android.permission.SYSTEM_ALERT_WINDOW',
    'android.permission.FOREGROUND_SERVICE',
  ];
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest['uses-permission'] = manifest['uses-permission'] || [];
    for (const p of perms) {
      if (!manifest['uses-permission'].some((u) => u.$['android:name'] === p)) {
        manifest['uses-permission'].push({ $: { 'android:name': p } });
      }
    }
    return cfg;
  });
}

function addService(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    app.service = app.service || [];
    const name = `${PACKAGE}.AppBlockerAccessibilityService`;
    if (!app.service.some((s) => s.$['android:name'] === name)) {
      app.service.push({
        $: {
          'android:name': name,
          'android:label': 'Arise App Blocker',
          'android:permission': 'android.permission.BIND_ACCESSIBILITY_SERVICE',
          'android:exported': 'false',
        },
        'intent-filter': [{ action: [{ $: { 'android:name': 'android.accessibilityservice.AccessibilityService' } }] }],
        'meta-data': [{ $: { 'android:name': 'android.accessibilityservice', 'android:resource': '@xml/accessibility_service_config' } }],
      });
    }
    return cfg;
  });
}

// Copy the Kotlin sources + xml config into the generated android project.
function copyNativeSources(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const platformRoot = cfg.modRequest.platformProjectRoot;
      const srcDir = path.join(projectRoot, 'modules', 'solo-app-blocker', 'android');
      const javaDest = path.join(platformRoot, 'app', 'src', 'main', 'java', ...PACKAGE.split('.'));
      const xmlDest = path.join(platformRoot, 'app', 'src', 'main', 'res', 'xml');
      fs.mkdirSync(javaDest, { recursive: true });
      fs.mkdirSync(xmlDest, { recursive: true });
      const files = [
        ['SoloAppBlockerModule.kt', javaDest],
        ['SoloAppBlockerPackage.kt', javaDest],
        ['AppBlockerAccessibilityService.kt', javaDest],
      ];
      for (const [f, dest] of files) {
        const from = path.join(srcDir, f);
        if (fs.existsSync(from)) fs.copyFileSync(from, path.join(dest, f));
      }
      const xmlFrom = path.join(srcDir, 'accessibility_service_config.xml');
      if (fs.existsSync(xmlFrom)) fs.copyFileSync(xmlFrom, path.join(xmlDest, 'accessibility_service_config.xml'));
      // NOTE: You must also register SoloAppBlockerPackage in your
      // MainApplication's getPackages(). See modules/solo-app-blocker/README.md.
      return cfg;
    },
  ]);
}

module.exports = function withSoloAppBlocker(config) {
  config = addPermissions(config);
  config = addService(config);
  config = copyNativeSources(config);
  return config;
};
