package com.zavtrak.devinos.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import com.zavtrak.devinos.DevinOSApplication
import com.zavtrak.devinos.data.LauncherApp
import com.zavtrak.devinos.data.SettingsRepository
import com.zavtrak.devinos.data.ThemePref
import com.zavtrak.devinos.data.WallpaperPref
import com.zavtrak.devinos.ui.theme.DevinOSTheme
import kotlinx.coroutines.launch

private enum class Page { Home, Drawer, Settings }

@Composable
fun LauncherShell() {
    val context = LocalContext.current
    val app = remember { DevinOSApplication.instance }
    val appRepo = app.appRepository
    val settingsRepo = app.settingsRepository
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) { appRepo.reload() }

    val apps by appRepo.apps.collectAsState()
    val settings by settingsRepo.settingsFlow.collectAsState(
        initial = com.zavtrak.devinos.data.Settings(
            theme = ThemePref.Dark,
            wallpaper = WallpaperPref.Aurora,
            dock = emptyList(),
        )
    )

    var page by remember { mutableStateOf(Page.Home) }

    val dockApps = remember(apps, settings.dock) {
        // If user hasn't customized the dock, prefer common apps if found,
        // otherwise just take the first 4.
        if (settings.dock.isNotEmpty()) {
            settings.dock.mapNotNull { pkg -> apps.firstOrNull { it.packageName == pkg } }.take(4)
        } else {
            val preferred = listOf(
                "com.android.dialer", "com.google.android.dialer",
                "com.android.messaging", "com.google.android.apps.messaging",
                "com.android.chrome", "org.mozilla.firefox",
                "com.android.camera", "com.android.camera2",
            )
            val byPreferred = preferred.mapNotNull { pkg -> apps.firstOrNull { it.packageName == pkg } }
            (byPreferred + apps).distinctBy { it.packageName }.take(4)
        }
    }

    DevinOSTheme(themePref = settings.theme) {
        Box(modifier = Modifier.fillMaxSize()) {
            WallpaperBackground(pref = settings.wallpaper)

            HomeScreen(
                apps = apps,
                dock = dockApps,
                onAppClick = { appRepo.launch(it) },
                onAppLongClick = { appRepo.openAppInfo(it.packageName) },
                onOpenDrawer = { page = Page.Drawer },
                onOpenSettings = { page = Page.Settings },
            )

            AnimatedVisibility(
                visible = page == Page.Drawer,
                enter = slideInVertically { it } + fadeIn(),
                exit = slideOutVertically { it } + fadeOut(),
            ) {
                AppDrawerScreen(
                    apps = apps,
                    onAppClick = { appRepo.launch(it) },
                    onAppLongClick = { appRepo.openAppInfo(it.packageName) },
                    onClose = { page = Page.Home },
                )
            }

            AnimatedVisibility(
                visible = page == Page.Settings,
                enter = slideInVertically { it / 2 } + fadeIn(),
                exit = slideOutVertically { it / 2 } + fadeOut(),
            ) {
                SettingsScreen(
                    theme = settings.theme,
                    wallpaper = settings.wallpaper,
                    onThemeChange = { scope.launch { settingsRepo.setTheme(it) } },
                    onWallpaperChange = { scope.launch { settingsRepo.setWallpaper(it) } },
                    onSetDefaultLauncher = {
                        try {
                            context.startActivity(appRepo.resolveDefaultLauncherIntent())
                        } catch (_: Exception) {}
                    },
                    onBack = { page = Page.Home },
                )
            }
        }
    }
}
