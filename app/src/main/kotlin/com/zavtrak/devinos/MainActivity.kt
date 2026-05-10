package com.zavtrak.devinos

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowCompat
import com.zavtrak.devinos.ui.LauncherShell

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        WindowCompat.setDecorFitsSystemWindows(window, false)
        setContent {
            LauncherShell()
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        // The HOME button re-launches the launcher; nothing extra to do —
        // Compose state stays put.
    }

    @Deprecated("Use onBackPressedDispatcher")
    @Suppress("OVERRIDE_DEPRECATION")
    override fun onBackPressed() {
        // Acting as a launcher, BACK should never exit us; absorb it.
        // Page-level back is handled inside Compose by setting page = Home.
    }
}
