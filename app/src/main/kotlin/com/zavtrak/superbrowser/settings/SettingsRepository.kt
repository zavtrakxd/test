package com.zavtrak.superbrowser.settings

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.zavtrak.superbrowser.search.SearchEngine
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

enum class DarkThemeChoice { System, Light, Dark }

data class AppSettings(
    val searchEngine: SearchEngine = SearchEngine.DUCKDUCKGO,
    val homepage: String = "",
    val adBlockEnabled: Boolean = true,
    val forceDarkSites: Boolean = false,
    val javascriptEnabled: Boolean = true,
    val blockPopups: Boolean = true,
    val acceptCookies: Boolean = true,
    val acceptThirdPartyCookies: Boolean = false,
    val sendDoNotTrack: Boolean = true,
    val desktopModeDefault: Boolean = false,
    val pageZoomPercent: Int = 100,
    val darkThemeChoice: DarkThemeChoice = DarkThemeChoice.System,
    val useMaterialYou: Boolean = true,
    val appLockEnabled: Boolean = false,
    val customUserAgent: String = "",
    val readerModeEnabled: Boolean = true,
    val swipeRefreshEnabled: Boolean = true,
)

class SettingsRepository(context: Context) {

    private val ds = context.applicationContext.dataStore

    val flow: Flow<AppSettings> = ds.data.map { p -> p.toAppSettings() }

    suspend fun update(transform: (AppSettings) -> AppSettings) {
        ds.edit { prefs ->
            val current = prefs.toAppSettings()
            val next = transform(current)
            prefs.applySettings(next)
        }
    }

    private fun Preferences.toAppSettings(): AppSettings = AppSettings(
        searchEngine = runCatching {
            SearchEngine.valueOf(this[K_SEARCH_ENGINE] ?: SearchEngine.DUCKDUCKGO.name)
        }.getOrDefault(SearchEngine.DUCKDUCKGO),
        homepage = this[K_HOMEPAGE] ?: "",
        adBlockEnabled = this[K_ADBLOCK] ?: true,
        forceDarkSites = this[K_FORCE_DARK] ?: false,
        javascriptEnabled = this[K_JS] ?: true,
        blockPopups = this[K_BLOCK_POPUPS] ?: true,
        acceptCookies = this[K_ACCEPT_COOKIES] ?: true,
        acceptThirdPartyCookies = this[K_ACCEPT_3P_COOKIES] ?: false,
        sendDoNotTrack = this[K_DNT] ?: true,
        desktopModeDefault = this[K_DESKTOP_DEFAULT] ?: false,
        pageZoomPercent = this[K_ZOOM] ?: 100,
        darkThemeChoice = runCatching {
            DarkThemeChoice.valueOf(this[K_THEME] ?: DarkThemeChoice.System.name)
        }.getOrDefault(DarkThemeChoice.System),
        useMaterialYou = this[K_MATERIAL_YOU] ?: true,
        appLockEnabled = this[K_APP_LOCK] ?: false,
        customUserAgent = this[K_USER_AGENT] ?: "",
        readerModeEnabled = this[K_READER] ?: true,
        swipeRefreshEnabled = this[K_SWIPE_REFRESH] ?: true,
    )

    private fun androidx.datastore.preferences.core.MutablePreferences.applySettings(s: AppSettings) {
        this[K_SEARCH_ENGINE] = s.searchEngine.name
        this[K_HOMEPAGE] = s.homepage
        this[K_ADBLOCK] = s.adBlockEnabled
        this[K_FORCE_DARK] = s.forceDarkSites
        this[K_JS] = s.javascriptEnabled
        this[K_BLOCK_POPUPS] = s.blockPopups
        this[K_ACCEPT_COOKIES] = s.acceptCookies
        this[K_ACCEPT_3P_COOKIES] = s.acceptThirdPartyCookies
        this[K_DNT] = s.sendDoNotTrack
        this[K_DESKTOP_DEFAULT] = s.desktopModeDefault
        this[K_ZOOM] = s.pageZoomPercent
        this[K_THEME] = s.darkThemeChoice.name
        this[K_MATERIAL_YOU] = s.useMaterialYou
        this[K_APP_LOCK] = s.appLockEnabled
        this[K_USER_AGENT] = s.customUserAgent
        this[K_READER] = s.readerModeEnabled
        this[K_SWIPE_REFRESH] = s.swipeRefreshEnabled
    }

    private companion object {
        val K_SEARCH_ENGINE = stringPreferencesKey("search_engine")
        val K_HOMEPAGE = stringPreferencesKey("homepage")
        val K_ADBLOCK = booleanPreferencesKey("adblock")
        val K_FORCE_DARK = booleanPreferencesKey("force_dark")
        val K_JS = booleanPreferencesKey("javascript")
        val K_BLOCK_POPUPS = booleanPreferencesKey("block_popups")
        val K_ACCEPT_COOKIES = booleanPreferencesKey("accept_cookies")
        val K_ACCEPT_3P_COOKIES = booleanPreferencesKey("accept_3p_cookies")
        val K_DNT = booleanPreferencesKey("dnt")
        val K_DESKTOP_DEFAULT = booleanPreferencesKey("desktop_default")
        val K_ZOOM = intPreferencesKey("zoom")
        val K_THEME = stringPreferencesKey("theme")
        val K_MATERIAL_YOU = booleanPreferencesKey("material_you")
        val K_APP_LOCK = booleanPreferencesKey("app_lock")
        val K_USER_AGENT = stringPreferencesKey("user_agent")
        val K_READER = booleanPreferencesKey("reader_mode")
        val K_SWIPE_REFRESH = booleanPreferencesKey("swipe_refresh")
    }
}
