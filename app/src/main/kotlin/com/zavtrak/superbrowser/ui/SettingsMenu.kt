package com.zavtrak.superbrowser.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.CleaningServices
import androidx.compose.material.icons.filled.DesktopWindows
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.PictureAsPdf
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.AssistChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.zavtrak.superbrowser.browser.BrowserViewModel
import com.zavtrak.superbrowser.browser.DrawerScreen
import com.zavtrak.superbrowser.search.SearchEngine
import com.zavtrak.superbrowser.settings.AppSettings
import com.zavtrak.superbrowser.settings.DarkThemeChoice
import kotlinx.coroutines.launch

@Composable
fun SettingsMenu(
    settings: AppSettings,
    viewModel: BrowserViewModel,
    onUpdateSettings: suspend ((AppSettings) -> AppSettings) -> Unit,
    onShare: () -> Unit,
    onSavePdf: () -> Unit,
    onFindInPage: () -> Unit,
    onToggleDesktop: () -> Unit,
    onReader: () -> Unit,
    onClearAll: () -> Unit,
) {
    val scope = rememberCoroutineScope()
    val scroll = rememberScrollState()
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
            .heightIn(min = 320.dp)
            .verticalScroll(scroll)
    ) {
        Text("Меню", style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.heightIn(min = 8.dp))

        // ---- Quick actions row -------------------------------------------
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            QuickAction("Закладки", Icons.Default.Bookmark) { viewModel.openDrawer(DrawerScreen.Bookmarks) }
            QuickAction("История", Icons.Default.History) { viewModel.openDrawer(DrawerScreen.History) }
            QuickAction("Загрузки", Icons.Default.Download) { viewModel.openDrawer(DrawerScreen.Downloads) }
        }
        Spacer(Modifier.heightIn(min = 8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            QuickAction("Поделиться", Icons.Default.Share, onShare)
            QuickAction("PDF", Icons.Default.PictureAsPdf, onSavePdf)
            QuickAction("Найти", Icons.Default.Search, onFindInPage)
        }
        Spacer(Modifier.heightIn(min = 8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            QuickAction("ПК-сайт", Icons.Default.DesktopWindows, onToggleDesktop)
            QuickAction("Чтение", Icons.AutoMirrored.Filled.MenuBook, onReader)
            QuickAction("Очистить", Icons.Default.CleaningServices, onClearAll)
        }

        Spacer(Modifier.heightIn(min = 16.dp))
        HorizontalDivider()
        Spacer(Modifier.heightIn(min = 16.dp))

        // ---- Settings ----------------------------------------------------
        Section("Поиск и стартовая страница")
        SearchEngineDropdown(settings) { engine ->
            scope.launch { onUpdateSettings { it.copy(searchEngine = engine) } }
        }
        OutlinedTextField(
            value = settings.homepage,
            onValueChange = { v -> scope.launch { onUpdateSettings { it.copy(homepage = v) } } },
            label = { Text("Стартовая страница") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        Section("Внешний вид")
        ThemeRow(settings) { choice ->
            scope.launch { onUpdateSettings { it.copy(darkThemeChoice = choice) } }
        }
        ToggleRow(
            label = "Material You (Android 12+)",
            checked = settings.useMaterialYou
        ) { v -> scope.launch { onUpdateSettings { it.copy(useMaterialYou = v) } } }
        ToggleRow(
            label = "Тёмная тема для всех сайтов",
            checked = settings.forceDarkSites
        ) { v -> scope.launch { onUpdateSettings { it.copy(forceDarkSites = v) } } }

        Section("Конфиденциальность")
        ToggleRow("Блокировка рекламы и трекеров", settings.adBlockEnabled) { v ->
            scope.launch { onUpdateSettings { it.copy(adBlockEnabled = v) } }
        }
        ToggleRow("JavaScript", settings.javascriptEnabled) { v ->
            scope.launch { onUpdateSettings { it.copy(javascriptEnabled = v) } }
        }
        ToggleRow("Блокировать всплывающие окна", settings.blockPopups) { v ->
            scope.launch { onUpdateSettings { it.copy(blockPopups = v) } }
        }
        ToggleRow("Принимать cookies", settings.acceptCookies) { v ->
            scope.launch { onUpdateSettings { it.copy(acceptCookies = v) } }
        }
        ToggleRow("Сторонние cookies", settings.acceptThirdPartyCookies) { v ->
            scope.launch { onUpdateSettings { it.copy(acceptThirdPartyCookies = v) } }
        }
        ToggleRow("Отправлять Do Not Track", settings.sendDoNotTrack) { v ->
            scope.launch { onUpdateSettings { it.copy(sendDoNotTrack = v) } }
        }
        ToggleRow("Замок (отпечаток/PIN)", settings.appLockEnabled) { v ->
            scope.launch { onUpdateSettings { it.copy(appLockEnabled = v) } }
        }

        Section("Поведение страниц")
        ToggleRow("По умолчанию ПК-сайт", settings.desktopModeDefault) { v ->
            scope.launch { onUpdateSettings { it.copy(desktopModeDefault = v) } }
        }
        Text("Масштаб страницы: ${settings.pageZoomPercent}%")
        Slider(
            value = settings.pageZoomPercent.toFloat(),
            onValueChange = { v ->
                scope.launch { onUpdateSettings { it.copy(pageZoomPercent = v.toInt()) } }
            },
            valueRange = 50f..200f,
            steps = 14
        )
        OutlinedTextField(
            value = settings.customUserAgent,
            onValueChange = { v -> scope.launch { onUpdateSettings { it.copy(customUserAgent = v) } } },
            label = { Text("User-Agent (пусто = по умолчанию)") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(Modifier.heightIn(min = 16.dp))
    }
}

@Composable
private fun Section(title: String) {
    Spacer(Modifier.heightIn(min = 12.dp))
    Text(title, style = MaterialTheme.typography.titleMedium)
    Spacer(Modifier.heightIn(min = 4.dp))
}

@Composable
private fun QuickAction(label: String, icon: androidx.compose.ui.graphics.vector.ImageVector, onClick: () -> Unit) {
    OutlinedButton(onClick = onClick, modifier = Modifier.heightIn(min = 60.dp)) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(icon, contentDescription = null)
            Text(label, style = MaterialTheme.typography.labelSmall)
        }
    }
}

@Composable
private fun ToggleRow(label: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, modifier = Modifier.weight(1f))
        Switch(checked = checked, onCheckedChange = onChange)
    }
}

@Composable
private fun ThemeRow(settings: AppSettings, onPick: (DarkThemeChoice) -> Unit) {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
        DarkThemeChoice.values().forEach { choice ->
            FilterChip(
                selected = settings.darkThemeChoice == choice,
                onClick = { onPick(choice) },
                label = { Text(choice.label()) }
            )
        }
    }
}

private fun DarkThemeChoice.label(): String = when (this) {
    DarkThemeChoice.System -> "Системная"
    DarkThemeChoice.Light -> "Светлая"
    DarkThemeChoice.Dark -> "Тёмная"
}

@Composable
private fun SearchEngineDropdown(settings: AppSettings, onPick: (SearchEngine) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text("Поисковая система:", modifier = Modifier.weight(1f))
        AssistChip(onClick = { expanded = true }, label = { Text(settings.searchEngine.displayName) })
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            SearchEngine.values().forEach { engine ->
                DropdownMenuItem(
                    text = { Text(engine.displayName) },
                    onClick = { expanded = false; onPick(engine) }
                )
            }
        }
    }
}


