package com.zavtrak.superbrowser

import android.content.Intent
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.fragment.app.FragmentActivity
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.lifecycle.viewmodel.compose.viewModel
import com.zavtrak.superbrowser.browser.BrowserViewModel
import com.zavtrak.superbrowser.browser.BrowserViewModelFactory
import com.zavtrak.superbrowser.settings.AppSettings
import com.zavtrak.superbrowser.ui.AppLockScreen
import com.zavtrak.superbrowser.ui.BrowserShell
import com.zavtrak.superbrowser.ui.theme.SuperBrowserTheme

class MainActivity : FragmentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val app = application as BrowserApplication

        // Surface initial intent URL into the persistence store so the shell
        // composable can pick it up via its pendingIntentUrl flow.
        intent?.let { extractUrl(it) }?.let { app.store.pendingIntentUrl.value = it }

        setContent {
            val settings by app.settings.flow.collectAsState(initial = AppSettings())
            SuperBrowserTheme(
                darkTheme = settings.darkThemeChoice,
                useDynamicColor = settings.useMaterialYou
            ) {
                val viewModel: BrowserViewModel = viewModel(
                    factory = remember { BrowserViewModelFactory(app) }
                )

                val unlocked by viewModel.unlocked.collectAsState()
                if (settings.appLockEnabled && !unlocked) {
                    AppLockScreen(
                        activity = this,
                        onUnlock = { viewModel.markUnlocked() }
                    )
                } else {
                    BrowserShell(
                        viewModel = viewModel,
                        settings = settings,
                        onUpdateSettings = { update -> app.settings.update(update) }
                    )
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        val url = extractUrl(intent) ?: return
        val app = application as BrowserApplication
        app.store.pendingIntentUrl.value = url
    }

    private fun extractUrl(intent: Intent): String? {
        return when (intent.action) {
            Intent.ACTION_VIEW -> intent.data?.toString()
            Intent.ACTION_SEND -> intent.getStringExtra(Intent.EXTRA_TEXT)
            else -> null
        }?.takeIf { it.isNotBlank() }
    }
}
