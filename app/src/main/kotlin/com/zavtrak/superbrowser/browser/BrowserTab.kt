package com.zavtrak.superbrowser.browser

import android.graphics.Bitmap
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

/**
 * A single browser tab. Heavyweight WebView state is created lazily by
 * [BrowserViewModel] when the tab is selected for rendering.
 */
class BrowserTab(
    val id: Long,
    initialUrl: String,
    val isIncognito: Boolean,
) {
    var url by mutableStateOf(initialUrl)
    var title by mutableStateOf(initialUrl.ifBlank { "Новая вкладка" })
    var progress by mutableIntStateOf(0)
    var isLoading by mutableStateOf(false)
    var canGoBack by mutableStateOf(false)
    var canGoForward by mutableStateOf(false)
    var favicon by mutableStateOf<Bitmap?>(null)
    var desktopMode by mutableStateOf(false)
    var blockedRequests by mutableIntStateOf(0)

    /** Lazily attached WebView snapshot used only by the UI layer. */
    var liveWebViewRef: java.lang.ref.WeakReference<android.webkit.WebView>? = null
}
