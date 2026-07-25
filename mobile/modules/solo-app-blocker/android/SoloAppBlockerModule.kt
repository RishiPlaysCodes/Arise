package com.sololevelling.appblocker

import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.text.TextUtils
import com.facebook.react.bridge.*

/**
 * Classic React Native native module exposed as `NativeModules.SoloAppBlocker`
 * (matches src/services/appBlocker.js). Bridges JS <-> the AccessibilityService.
 */
class SoloAppBlockerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "SoloAppBlocker"

    @ReactMethod
    fun isAccessibilityEnabled(promise: Promise) {
        try {
            val expected = "${reactContext.packageName}/${AppBlockerAccessibilityService::class.java.name}"
            val enabled = Settings.Secure.getString(
                reactContext.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: ""
            val splitter = TextUtils.SimpleStringSplitter(':')
            splitter.setString(enabled)
            var found = false
            while (splitter.hasNext()) {
                if (splitter.next().equals(expected, ignoreCase = true)) { found = true; break }
            }
            promise.resolve(found)
        } catch (e: Exception) {
            promise.reject("ERR", e)
        }
    }

    @ReactMethod
    fun openAccessibilitySettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR", e)
        }
    }

    @ReactMethod
    fun setBlockedApps(packageNames: ReadableArray, untilIso: String, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences(
                AppBlockerAccessibilityService.PREFS, Context.MODE_PRIVATE
            )
            val set = HashSet<String>()
            for (i in 0 until packageNames.size()) packageNames.getString(i)?.let { set.add(it) }
            val untilMs = try { java.time.Instant.parse(untilIso).toEpochMilli() } catch (e: Exception) { 0L }
            prefs.edit()
                .putStringSet(AppBlockerAccessibilityService.KEY_BLOCKED, set)
                .putLong(AppBlockerAccessibilityService.KEY_UNTIL, untilMs)
                .apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR", e)
        }
    }

    @ReactMethod
    fun clearBlocks(promise: Promise) {
        try {
            reactContext.getSharedPreferences(AppBlockerAccessibilityService.PREFS, Context.MODE_PRIVATE)
                .edit().clear().apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR", e)
        }
    }
}
