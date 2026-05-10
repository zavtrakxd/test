package com.zavtrak.devinos.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.settingsStore: DataStore<Preferences> by preferencesDataStore("devinos_settings")

enum class ThemePref { Dark, Light, System }
enum class WallpaperPref { Aurora, Sunset, Ocean, Mono }

data class Settings(
    val theme: ThemePref,
    val wallpaper: WallpaperPref,
    val dock: List<String>,
)

class SettingsRepository(private val context: Context) {

    private val keyTheme = stringPreferencesKey("theme")
    private val keyWallpaper = stringPreferencesKey("wallpaper")
    private val keyDock = stringSetPreferencesKey("dock_packages")

    val settingsFlow: Flow<Settings> = context.settingsStore.data.map { p ->
        Settings(
            theme = ThemePref.entries.firstOrNull { it.name == p[keyTheme] } ?: ThemePref.Dark,
            wallpaper = WallpaperPref.entries.firstOrNull { it.name == p[keyWallpaper] } ?: WallpaperPref.Aurora,
            dock = p[keyDock]?.toList() ?: emptyList(),
        )
    }

    suspend fun setTheme(t: ThemePref) {
        context.settingsStore.edit { it[keyTheme] = t.name }
    }

    suspend fun setWallpaper(w: WallpaperPref) {
        context.settingsStore.edit { it[keyWallpaper] = w.name }
    }

    suspend fun setDock(packages: List<String>) {
        context.settingsStore.edit { it[keyDock] = packages.toSet() }
    }
}
