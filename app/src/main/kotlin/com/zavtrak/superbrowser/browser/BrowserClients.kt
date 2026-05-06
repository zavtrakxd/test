package com.zavtrak.superbrowser.browser

import android.app.DownloadManager
import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import android.os.Environment
import android.os.Message
import android.view.View
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.URLUtil
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import com.zavtrak.superbrowser.BrowserApplication
import com.zavtrak.superbrowser.data.DownloadEntry
import java.io.ByteArrayInputStream

/**
 * Custom WebViewClient that integrates the ad-blocker, persists history and
 * keeps tab metadata in sync with the underlying WebView.
 */
class BrowserWebViewClient(
    private val app: BrowserApplication,
    private val viewModel: BrowserViewModel,
    private val tab: BrowserTab,
) : WebViewClient() {

    override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
        super.onPageStarted(view, url, favicon)
        if (url != null) tab.url = url
        tab.isLoading = true
    }

    override fun onPageFinished(view: WebView, url: String?) {
        super.onPageFinished(view, url)
        if (url != null) tab.url = url
        tab.title = view.title?.takeIf { it.isNotBlank() } ?: tab.url
        tab.isLoading = false
        tab.canGoBack = view.canGoBack()
        tab.canGoForward = view.canGoForward()
        viewModel.recordVisit(tab, tab.url, tab.title)
    }

    override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
        val url = request?.url?.toString() ?: return false
        // Hand off non-http(s) schemes (mailto, tel, intent://) to Android.
        if (!url.startsWith("http://") && !url.startsWith("https://") &&
            !url.startsWith("about:") && !url.startsWith("javascript:")) {
            return runCatching {
                val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, Uri.parse(url))
                intent.flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK
                view?.context?.startActivity(intent)
                true
            }.getOrDefault(true)
        }
        return false
    }

    override fun shouldInterceptRequest(
        view: WebView?,
        request: WebResourceRequest?,
    ): WebResourceResponse? {
        val url = request?.url?.toString() ?: return null
        if (!app.currentSettings.adBlockEnabled) return null
        if (!app.adBlocker.shouldBlock(url)) return null
        tab.blockedRequests = tab.blockedRequests + 1
        return WebResourceResponse(
            "text/plain",
            "utf-8",
            ByteArrayInputStream(ByteArray(0))
        )
    }
}

class BrowserWebChromeClient(
    private val viewModel: BrowserViewModel,
    private val tab: BrowserTab,
    private val onShowCustomView: (View?, WebChromeClient.CustomViewCallback?) -> Unit,
    private val onHideCustomView: () -> Unit,
    private val onCreateWindow: (Boolean) -> WebView?,
) : WebChromeClient() {

    override fun onProgressChanged(view: WebView?, newProgress: Int) {
        tab.progress = newProgress
    }

    override fun onReceivedTitle(view: WebView?, title: String?) {
        if (!title.isNullOrBlank()) tab.title = title
    }

    override fun onReceivedIcon(view: WebView?, icon: Bitmap?) {
        tab.favicon = icon
    }

    override fun onShowCustomView(view: View?, callback: CustomViewCallback?) {
        onShowCustomView(view, callback)
    }

    override fun onHideCustomView() {
        onHideCustomView()
    }

    override fun onCreateWindow(
        view: WebView?,
        isDialog: Boolean,
        isUserGesture: Boolean,
        resultMsg: Message?
    ): Boolean {
        val newWebView = onCreateWindow(isUserGesture) ?: return false
        val transport = resultMsg?.obj as? WebView.WebViewTransport ?: return false
        transport.webView = newWebView
        resultMsg.sendToTarget()
        return true
    }
}

/**
 * Hook into the WebView download path: forward to the system DownloadManager
 * and record the download so it shows up in the in-app Downloads tab.
 */
fun installDownloadListener(context: Context, webView: WebView, app: BrowserApplication) {
    webView.setDownloadListener { url, userAgent, contentDisposition, mimeType, contentLength ->
        try {
            val cookies = CookieManager.getInstance().getCookie(url) ?: ""
            val filename = URLUtil.guessFileName(url, contentDisposition, mimeType)
            val request = DownloadManager.Request(Uri.parse(url))
                .addRequestHeader("Cookie", cookies)
                .addRequestHeader("User-Agent", userAgent)
                .setMimeType(mimeType)
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename)
                .setAllowedOverMetered(true)
                .setAllowedOverRoaming(false)
                .setTitle(filename)
                .setDescription("Загрузка из Super Browser")
            val dm = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            dm.enqueue(request)
            app.store.addDownload(
                DownloadEntry(
                    filename = filename,
                    url = url,
                    mimeType = mimeType ?: "application/octet-stream",
                    sizeBytes = contentLength,
                    startedAt = System.currentTimeMillis()
                )
            )
            Toast.makeText(context, "Загрузка: $filename", Toast.LENGTH_SHORT).show()
        } catch (t: Throwable) {
            Toast.makeText(context, "Не удалось начать загрузку: ${t.message}", Toast.LENGTH_LONG).show()
        }
    }
}

internal fun WebView.detachFromParent() {
    val parent = parent as? ViewGroup ?: return
    parent.removeView(this)
}
