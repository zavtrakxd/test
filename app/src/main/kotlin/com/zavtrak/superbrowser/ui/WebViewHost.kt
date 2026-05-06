package com.zavtrak.superbrowser.ui

import android.annotation.SuppressLint
import android.view.ViewGroup
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewFeature
import com.zavtrak.superbrowser.BrowserApplication
import com.zavtrak.superbrowser.browser.BrowserTab
import com.zavtrak.superbrowser.browser.BrowserViewModel
import com.zavtrak.superbrowser.browser.BrowserWebChromeClient
import com.zavtrak.superbrowser.browser.BrowserWebViewClient
import com.zavtrak.superbrowser.browser.detachFromParent
import com.zavtrak.superbrowser.browser.installDownloadListener
import com.zavtrak.superbrowser.settings.AppSettings

private const val DESKTOP_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WebViewHost(
    tab: BrowserTab,
    settings: AppSettings,
    viewModel: BrowserViewModel,
    modifier: Modifier = Modifier,
) {
    val app = BrowserApplication.instance
    val webView = remember(tab.id) {
        WebView(app).also { wv ->
            wv.layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            wv.applyBaseSettings()
            wv.webViewClient = BrowserWebViewClient(app, viewModel, tab)
            wv.webChromeClient = BrowserWebChromeClient(
                viewModel = viewModel,
                tab = tab,
                onShowCustomView = { _, _ -> },
                onHideCustomView = { },
                onCreateWindow = { isUserGesture ->
                    if (!isUserGesture && app.currentSettings.blockPopups) null
                    else {
                        viewModel.newTab(incognito = tab.isIncognito, foreground = false)
                        // The transient WebView returned here is replaced when
                        // the new tab next composes its own WebView. window.open
                        // only needs a destination for the location set.
                        WebView(app).also { wv2 -> wv2.applyBaseSettings() }
                    }
                }
            )
            installDownloadListener(app, wv, app)
            tab.liveWebViewRef = java.lang.ref.WeakReference(wv)
            if (tab.url.isNotBlank()) wv.loadUrl(tab.url)
        }
    }

    SideEffect {
        webView.applyDynamicSettings(settings, tab)
    }

    LaunchedEffect(tab.url) {
        // External code (e.g. address bar submission, bookmark click) updates
        // tab.url; reflect that into the WebView when it differs.
        if (tab.url.isNotBlank() && webView.url != tab.url) {
            webView.loadUrl(tab.url)
        }
    }

    DisposableEffect(tab.id) {
        onDispose {
            webView.detachFromParent()
            // Don't destroy the WebView here — Compose may recompose during
            // configuration changes. Destruction happens when the tab is
            // closed via the VM, not when the host leaves composition.
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
        AndroidView(
            factory = { webView },
            modifier = Modifier.fillMaxSize(),
            update = { /* dynamic settings already applied via SideEffect */ }
        )
    }
}

internal fun WebView.applyBaseSettings() {
    with(settings) {
        javaScriptEnabled = true
        domStorageEnabled = true
        databaseEnabled = true
        loadWithOverviewMode = true
        useWideViewPort = true
        builtInZoomControls = true
        displayZoomControls = false
        setSupportZoom(true)
        mediaPlaybackRequiresUserGesture = true
        cacheMode = WebSettings.LOAD_DEFAULT
        mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
        allowFileAccess = false
        allowContentAccess = false
        setSupportMultipleWindows(true)
        javaScriptCanOpenWindowsAutomatically = false
    }
}

internal fun WebView.applyDynamicSettings(s: AppSettings, tab: BrowserTab) {
    val ws = settings
    ws.javaScriptEnabled = s.javascriptEnabled
    ws.javaScriptCanOpenWindowsAutomatically = !s.blockPopups
    val zoomFactor = s.pageZoomPercent.coerceIn(50, 200)
    ws.textZoom = zoomFactor

    val effectiveDesktop = tab.desktopMode || s.desktopModeDefault
    ws.userAgentString = when {
        s.customUserAgent.isNotBlank() -> s.customUserAgent
        effectiveDesktop -> DESKTOP_UA
        else -> null // null restores the default mobile UA
    }
    ws.useWideViewPort = effectiveDesktop || ws.useWideViewPort
    ws.loadWithOverviewMode = effectiveDesktop || ws.loadWithOverviewMode

    if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
        WebSettingsCompat.setAlgorithmicDarkeningAllowed(ws, s.forceDarkSites)
    } else if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK)) {
        @Suppress("DEPRECATION")
        WebSettingsCompat.setForceDark(
            ws,
            if (s.forceDarkSites) WebSettingsCompat.FORCE_DARK_ON
            else WebSettingsCompat.FORCE_DARK_OFF
        )
    }

    android.webkit.CookieManager.getInstance().apply {
        setAcceptCookie(s.acceptCookies)
        setAcceptThirdPartyCookies(this@applyDynamicSettings, s.acceptThirdPartyCookies)
    }
}
