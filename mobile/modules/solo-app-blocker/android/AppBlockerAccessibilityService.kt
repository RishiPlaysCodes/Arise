package com.sololevelling.appblocker

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.content.SharedPreferences
import android.view.accessibility.AccessibilityEvent

/**
 * Watches the foreground app. When a punishment is active and the current
 * package is on the block list, it sends the user back to the home screen
 * (a non-destructive, policy-friendly "nudge"). Battery-safe: it only reacts
 * to window-state-change events; it does not poll.
 *
 * Block list + active-until timestamp are written by SoloAppBlockerModule
 * into SharedPreferences, so this service needs no direct JS bridge.
 */
class AppBlockerAccessibilityService : AccessibilityService() {

    private lateinit var prefs: SharedPreferences

    override fun onServiceConnected() {
        super.onServiceConnected()
        prefs = getSharedPreferences(PREFS, MODE_PRIVATE)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null || event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
        val pkg = event.packageName?.toString() ?: return

        // Never block ourselves or the launcher/system UI.
        if (pkg == packageName || pkg.contains("launcher") || pkg == "com.android.systemui") return

        val until = prefs.getLong(KEY_UNTIL, 0L)
        if (until <= System.currentTimeMillis()) return // no active block window

        val blocked = prefs.getStringSet(KEY_BLOCKED, emptySet()) ?: emptySet()
        if (blocked.contains(pkg)) {
            // Return to home — a soft block that respects user control.
            val home = Intent(Intent.ACTION_MAIN).apply {
                addCategory(Intent.CATEGORY_HOME)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            startActivity(home)
        }
    }

    override fun onInterrupt() {}

    companion object {
        const val PREFS = "solo_app_blocker"
        const val KEY_BLOCKED = "blocked_packages"
        const val KEY_UNTIL = "blocked_until_ms"
    }
}
