package com.zavtrak.superbrowser.ui

import android.content.Intent
import android.print.PrintAttributes
import android.print.PrintManager
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Tab
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import com.zavtrak.superbrowser.BrowserApplication
import com.zavtrak.superbrowser.browser.BrowserViewModel
import com.zavtrak.superbrowser.browser.DrawerScreen
import com.zavtrak.superbrowser.data.Bookmark
import com.zavtrak.superbrowser.settings.AppSettings
import kotlinx.coroutines.launch

@Composable
fun BrowserShell(
    viewModel: BrowserViewModel,
    settings: AppSettings,
    onUpdateSettings: suspend ((AppSettings) -> AppSettings) -> Unit,
) {
    val tabs by viewModel.tabs.collectAsState()
    val currentId by viewModel.currentTabId.collectAsState()
    val current = tabs.firstOrNull { it.id == currentId }
    val drawer by viewModel.drawer.collectAsState()
    val findQuery by viewModel.findInPageQuery.collectAsState()

    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val keyboard = LocalSoftwareKeyboardController.current
    val app = BrowserApplication.instance

    var addressBarText by remember(current?.id) { mutableStateOf(current?.url.orEmpty()) }
    LaunchedEffect(current?.url, current?.id) {
        addressBarText = current?.url.orEmpty()
    }

    // Pending external intent (URL the user shared into the app while running).
    val pendingIntentUrl by app.store.pendingIntentUrl.collectAsState()
    LaunchedEffect(pendingIntentUrl) {
        pendingIntentUrl?.let {
            viewModel.openInForegroundTabIfNew(it)
            app.store.pendingIntentUrl.value = null
        }
    }

    BackHandler(enabled = current != null) {
        val tab = current ?: return@BackHandler
        val wv = tab.liveWebViewRef?.get()
        if (wv != null && wv.canGoBack()) wv.goBack()
        else viewModel.closeTab(tab.id)
    }

    Scaffold(
        modifier = Modifier.fillMaxSize().imePadding(),
        topBar = {
            Column {
                AddressBar(
                    text = addressBarText,
                    onTextChanged = { addressBarText = it },
                    onSubmit = {
                        keyboard?.hide()
                        current?.let { tab ->
                            coroutineScope.launch {
                                viewModel.navigateFromAddressBar(addressBarText, tab)
                            }
                        }
                    },
                    onReload = { current?.liveWebViewRef?.get()?.reload() },
                    isLoading = current?.isLoading ?: false,
                    isIncognito = current?.isIncognito ?: false,
                )
                if ((current?.progress ?: 100) in 1..99) {
                    LinearProgressIndicator(
                        progress = { (current?.progress ?: 0) / 100f },
                        modifier = Modifier.fillMaxWidth().height(2.dp)
                    )
                }
                if (findQuery != null) {
                    FindInPageBar(
                        query = findQuery!!,
                        onQuery = { q ->
                            viewModel.setFindQuery(q)
                            current?.liveWebViewRef?.get()?.findAllAsync(q)
                        },
                        onNext = { current?.liveWebViewRef?.get()?.findNext(true) },
                        onPrev = { current?.liveWebViewRef?.get()?.findNext(false) },
                        onClose = {
                            current?.liveWebViewRef?.get()?.clearMatches()
                            viewModel.setFindQuery(null)
                        }
                    )
                }
            }
        },
        bottomBar = {
            BrowserBottomBar(
                canGoBack = current?.canGoBack ?: false,
                canGoForward = current?.canGoForward ?: false,
                tabCount = tabs.size,
                isIncognito = current?.isIncognito ?: false,
                isBookmarked = current?.url?.let { app.store.isBookmarked(it) } ?: false,
                onBack = { current?.liveWebViewRef?.get()?.goBack() },
                onForward = { current?.liveWebViewRef?.get()?.goForward() },
                onTabs = { viewModel.openDrawer(DrawerScreen.Tabs) },
                onMenu = { viewModel.openDrawer(DrawerScreen.Settings) },
                onHome = {
                    val home = settings.homepage.ifBlank { settings.searchEngine.homepage }
                    current?.let {
                        it.url = home
                        it.liveWebViewRef?.get()?.loadUrl(home)
                    }
                },
                onBookmarkToggle = {
                    val tab = current ?: return@BrowserBottomBar
                    if (app.store.isBookmarked(tab.url)) {
                        app.store.removeBookmark(tab.url)
                    } else {
                        app.store.addBookmark(
                            Bookmark(
                                title = tab.title.ifBlank { tab.url },
                                url = tab.url,
                                createdAt = System.currentTimeMillis()
                            )
                        )
                    }
                }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            current?.let { tab ->
                WebViewHost(
                    tab = tab,
                    settings = settings,
                    viewModel = viewModel,
                    modifier = Modifier.fillMaxSize()
                )
            }
        }
    }

    if (drawer != DrawerScreen.Browser) {
        val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        ModalBottomSheet(
            onDismissRequest = { viewModel.closeDrawer() },
            sheetState = sheetState
        ) {
            when (drawer) {
                DrawerScreen.Tabs -> TabsScreen(viewModel = viewModel)
                DrawerScreen.Bookmarks -> BookmarksScreen(viewModel = viewModel)
                DrawerScreen.History -> HistoryScreen(viewModel = viewModel)
                DrawerScreen.Downloads -> DownloadsScreen()
                DrawerScreen.Settings -> SettingsMenu(
                    settings = settings,
                    viewModel = viewModel,
                    onUpdateSettings = onUpdateSettings,
                    onShare = {
                        val url = current?.url ?: return@SettingsMenu
                        val intent = Intent(Intent.ACTION_SEND).apply {
                            type = "text/plain"
                            putExtra(Intent.EXTRA_TEXT, url)
                        }
                        context.startActivity(Intent.createChooser(intent, "Поделиться"))
                    },
                    onSavePdf = {
                        val tab = current ?: return@SettingsMenu
                        val wv = tab.liveWebViewRef?.get() ?: return@SettingsMenu
                        val pm = context.getSystemService(android.content.Context.PRINT_SERVICE)
                            as PrintManager
                        val adapter = wv.createPrintDocumentAdapter(tab.title.ifBlank { "page" })
                        pm.print(
                            tab.title.ifBlank { "page" },
                            adapter,
                            PrintAttributes.Builder().build()
                        )
                    },
                    onFindInPage = {
                        viewModel.setFindQuery("")
                        viewModel.closeDrawer()
                    },
                    onToggleDesktop = {
                        val tab = current ?: return@SettingsMenu
                        tab.desktopMode = !tab.desktopMode
                        tab.liveWebViewRef?.get()?.reload()
                    },
                    onReader = {
                        val tab = current ?: return@SettingsMenu
                        tab.liveWebViewRef?.get()?.injectReaderMode()
                    },
                    onClearAll = {
                        coroutineScope.launch {
                            app.store.clearHistory()
                            android.webkit.CookieManager.getInstance().removeAllCookies(null)
                            android.webkit.WebStorage.getInstance().deleteAllData()
                            current?.liveWebViewRef?.get()?.clearCache(true)
                        }
                    }
                )
                DrawerScreen.FindInPage -> {} // bar is rendered above
                DrawerScreen.Browser -> {}
            }
        }
    }
}

@Composable
private fun AddressBar(
    text: String,
    onTextChanged: (String) -> Unit,
    onSubmit: () -> Unit,
    onReload: () -> Unit,
    isLoading: Boolean,
    isIncognito: Boolean,
) {
    val focus = remember { FocusRequester() }
    Surface(
        tonalElevation = 2.dp,
        color = MaterialTheme.colorScheme.surface,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = if (isIncognito) Icons.Default.Lock else Icons.Default.LockOpen,
                contentDescription = null,
                tint = if (isIncognito) MaterialTheme.colorScheme.tertiary
                else MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(20.dp)
            )
            Spacer(Modifier.width(6.dp))
            TextField(
                value = text,
                onValueChange = onTextChanged,
                singleLine = true,
                placeholder = { Text("Поиск или адрес") },
                modifier = Modifier
                    .heightIn(min = 44.dp)
                    .padding(0.dp)
                    .focusRequester(focus)
                    .fillMaxWidth(0.85f),
                shape = RoundedCornerShape(24.dp),
                colors = TextFieldDefaults.colors(
                    focusedIndicatorColor = Color.Transparent,
                    unfocusedIndicatorColor = Color.Transparent,
                    disabledIndicatorColor = Color.Transparent,
                ),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Go),
                keyboardActions = KeyboardActions(onGo = { onSubmit() }, onSend = { onSubmit() })
            )
            Spacer(Modifier.width(2.dp))
            IconButton(onClick = onReload) {
                Icon(
                    imageVector = if (isLoading) Icons.Default.Close else Icons.Default.Refresh,
                    contentDescription = "Обновить"
                )
            }
        }
    }
}

@Composable
private fun BrowserBottomBar(
    canGoBack: Boolean,
    canGoForward: Boolean,
    tabCount: Int,
    isIncognito: Boolean,
    isBookmarked: Boolean,
    onBack: () -> Unit,
    onForward: () -> Unit,
    onTabs: () -> Unit,
    onMenu: () -> Unit,
    onHome: () -> Unit,
    onBookmarkToggle: () -> Unit,
) {
    Surface(
        tonalElevation = 2.dp,
        color = MaterialTheme.colorScheme.surface,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 6.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack, enabled = canGoBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад")
            }
            IconButton(onClick = onForward, enabled = canGoForward) {
                Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = "Вперёд")
            }
            IconButton(onClick = onHome) {
                Icon(Icons.Default.Home, contentDescription = "Домой")
            }
            IconButton(onClick = onBookmarkToggle) {
                Icon(
                    imageVector = if (isBookmarked) Icons.Default.Bookmark else Icons.Default.BookmarkBorder,
                    contentDescription = "Закладка"
                )
            }
            Box(contentAlignment = Alignment.Center) {
                IconButton(onClick = onTabs) {
                    Icon(Icons.Default.Tab, contentDescription = "Вкладки")
                }
                Surface(
                    shape = RoundedCornerShape(50),
                    color = if (isIncognito) MaterialTheme.colorScheme.tertiary
                    else MaterialTheme.colorScheme.primary,
                    modifier = Modifier
                        .size(20.dp)
                        .padding(0.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            text = tabCount.coerceAtMost(99).toString(),
                            color = MaterialTheme.colorScheme.onPrimary,
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                }
            }
            IconButton(onClick = onMenu) {
                Icon(Icons.Default.MoreVert, contentDescription = "Меню")
            }
        }
    }
}

@Composable
private fun FindInPageBar(
    query: String,
    onQuery: (String) -> Unit,
    onNext: () -> Unit,
    onPrev: () -> Unit,
    onClose: () -> Unit,
) {
    Surface(color = MaterialTheme.colorScheme.surface, modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            TextField(
                value = query,
                onValueChange = onQuery,
                singleLine = true,
                placeholder = { Text("Найти на странице") },
                colors = TextFieldDefaults.colors(
                    focusedIndicatorColor = Color.Transparent,
                    unfocusedIndicatorColor = Color.Transparent
                ),
                modifier = Modifier.fillMaxWidth(0.7f)
            )
            Spacer(Modifier.weight(1f))
            IconButton(onClick = onPrev) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) }
            IconButton(onClick = onNext) { Icon(Icons.AutoMirrored.Filled.ArrowForward, null) }
            IconButton(onClick = onClose) { Icon(Icons.Default.Close, null) }
        }
    }
}


