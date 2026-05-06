package com.zavtrak.superbrowser

import android.app.Application
import android.webkit.CookieManager
import com.zavtrak.superbrowser.adblock.AdBlocker
import com.zavtrak.superbrowser.data.PersistenceStore
import com.zavtrak.superbrowser.settings.AppSettings
import com.zavtrak.superbrowser.settings.SettingsRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class BrowserApplication : Application() {

    val appScope: CoroutineScope by lazy {
        CoroutineScope(SupervisorJob() + Dispatchers.Default)
    }

    val store: PersistenceStore by lazy { PersistenceStore(this) }
    val settings: SettingsRepository by lazy { SettingsRepository(this) }
    val adBlocker: AdBlocker by lazy { AdBlocker(this) }

    /**
     * Snapshot of the current settings, kept up to date by collecting the
     * DataStore flow on a background coroutine. Synchronous code paths (e.g.
     * WebView intercept callbacks) read this rather than blocking on the flow.
     */
    @Volatile
    var currentSettings: AppSettings = AppSettings()
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this

        CookieManager.getInstance().setAcceptCookie(true)

        appScope.launch {
            settings.flow.collect { currentSettings = it }
        }

        appScope.launch {
            adBlocker.loadCachedHosts()
            adBlocker.refreshIfStale()
        }
    }

    companion object {
        @Volatile
        lateinit var instance: BrowserApplication
            private set
    }
}
