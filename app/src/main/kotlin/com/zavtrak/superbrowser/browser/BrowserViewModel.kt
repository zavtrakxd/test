package com.zavtrak.superbrowser.browser

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.zavtrak.superbrowser.BrowserApplication
import com.zavtrak.superbrowser.data.HistoryEntry
import com.zavtrak.superbrowser.data.PersistenceStore
import com.zavtrak.superbrowser.search.SearchEngine
import com.zavtrak.superbrowser.search.UrlClassifier
import com.zavtrak.superbrowser.settings.AppSettings
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.util.concurrent.atomic.AtomicLong

class BrowserViewModel(app: Application) : AndroidViewModel(app) {

    private val application: BrowserApplication = app as BrowserApplication
    val store: PersistenceStore get() = application.store
    val settings get() = application.settings

    private val _tabs = MutableStateFlow<List<BrowserTab>>(emptyList())
    val tabs: StateFlow<List<BrowserTab>> = _tabs.asStateFlow()

    private val _currentTabId = MutableStateFlow<Long?>(null)
    val currentTabId: StateFlow<Long?> = _currentTabId.asStateFlow()

    private val _showTabSwitcher = MutableStateFlow(false)
    val showTabSwitcher: StateFlow<Boolean> = _showTabSwitcher.asStateFlow()

    private val _drawer = MutableStateFlow(DrawerScreen.Browser)
    val drawer: StateFlow<DrawerScreen> = _drawer.asStateFlow()

    private val _findInPageQuery = MutableStateFlow<String?>(null)
    val findInPageQuery: StateFlow<String?> = _findInPageQuery.asStateFlow()

    private val _unlocked = MutableStateFlow(false)
    val unlocked: StateFlow<Boolean> = _unlocked.asStateFlow()

    private val tabIdCounter = AtomicLong(0)

    init {
        // Always start with one tab.
        viewModelScope.launch {
            val initialSettings = settings.flow.first()
            val homepage = initialSettings.homepageOrDefault()
            newTab(url = homepage, incognito = false, foreground = true)
        }
    }

    fun current(): BrowserTab? = _tabs.value.firstOrNull { it.id == _currentTabId.value }

    fun newTab(url: String = "", incognito: Boolean = false, foreground: Boolean = true): BrowserTab {
        val tab = BrowserTab(
            id = tabIdCounter.incrementAndGet(),
            initialUrl = url,
            isIncognito = incognito,
        )
        _tabs.value = _tabs.value + tab
        if (foreground) _currentTabId.value = tab.id
        return tab
    }

    fun selectTab(id: Long) {
        if (_tabs.value.any { it.id == id }) {
            _currentTabId.value = id
        }
    }

    fun closeTab(id: Long) {
        val before = _tabs.value
        val after = before.filterNot { it.id == id }
        _tabs.value = after
        if (_currentTabId.value == id) {
            _currentTabId.value = after.lastOrNull()?.id
        }
        if (after.isEmpty()) {
            // Always have at least one tab to interact with.
            viewModelScope.launch {
                val s = settings.flow.first()
                newTab(s.homepageOrDefault(), incognito = false, foreground = true)
            }
        }
    }

    fun closeAllTabs(onlyIncognito: Boolean = false) {
        val keep = if (onlyIncognito) _tabs.value.filterNot { it.isIncognito } else emptyList()
        _tabs.value = keep
        _currentTabId.value = keep.lastOrNull()?.id
        if (keep.isEmpty()) {
            viewModelScope.launch {
                val s = settings.flow.first()
                newTab(s.homepageOrDefault(), incognito = false, foreground = true)
            }
        }
    }

    fun toggleTabSwitcher(show: Boolean = !_showTabSwitcher.value) {
        _showTabSwitcher.value = show
    }

    fun openDrawer(screen: DrawerScreen) {
        _drawer.value = screen
    }

    fun closeDrawer() {
        _drawer.value = DrawerScreen.Browser
    }

    fun setFindQuery(q: String?) { _findInPageQuery.value = q }

    fun markUnlocked() { _unlocked.value = true }

    /**
     * Translates a free-form address-bar string into either a URL or a search.
     */
    suspend fun navigateFromAddressBar(input: String, tab: BrowserTab) {
        val s = settings.flow.first()
        val resolved = UrlClassifier.toUrlOrNull(input)
            ?: s.searchEngine.searchUrl(input)
        tab.url = resolved
    }

    /** Records a non-incognito visit in the history. */
    fun recordVisit(tab: BrowserTab, url: String, title: String?) {
        if (tab.isIncognito) return
        if (url.isBlank() || url.startsWith("about:") || url.startsWith("javascript:")) return
        viewModelScope.launch {
            store.pushHistory(
                HistoryEntry(
                    title = title?.takeIf { it.isNotBlank() } ?: url,
                    url = url,
                    visitedAt = System.currentTimeMillis()
                )
            )
        }
    }

    fun openInForegroundTabIfNew(url: String) {
        val existing = _tabs.value.firstOrNull { it.url == url }
        if (existing != null) {
            _currentTabId.value = existing.id
        } else {
            newTab(url = url, foreground = true)
        }
    }

    private fun AppSettings.homepageOrDefault(): String =
        if (homepage.isNotBlank()) homepage else searchEngine.homepage
}

class BrowserViewModelFactory(private val app: BrowserApplication) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return BrowserViewModel(app) as T
    }
}

enum class DrawerScreen { Browser, Tabs, Bookmarks, History, Downloads, Settings, FindInPage }
