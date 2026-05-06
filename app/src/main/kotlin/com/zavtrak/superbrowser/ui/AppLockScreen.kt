package com.zavtrak.superbrowser.ui

import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity

@Composable
fun AppLockScreen(activity: FragmentActivity, onUnlock: () -> Unit) {
    LaunchedEffect(Unit) {
        promptBiometric(activity, onUnlock)
    }

    Box(modifier = Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(Icons.Default.Lock, null, modifier = Modifier.padding(8.dp))
            Text("Super Browser заблокирован", style = MaterialTheme.typography.titleMedium)
            Text(
                "Подтвердите вашу личность, чтобы продолжить",
                style = MaterialTheme.typography.bodyMedium
            )
            Button(onClick = { promptBiometric(activity, onUnlock) }, modifier = Modifier.padding(top = 16.dp)) {
                Text("Разблокировать")
            }
        }
    }
}

private fun promptBiometric(activity: FragmentActivity, onUnlock: () -> Unit) {
    val biometricManager = BiometricManager.from(activity)
    val authenticators = BiometricManager.Authenticators.BIOMETRIC_WEAK or
        BiometricManager.Authenticators.DEVICE_CREDENTIAL
    val canAuthenticate = biometricManager.canAuthenticate(authenticators)
    if (canAuthenticate != BiometricManager.BIOMETRIC_SUCCESS) {
        // Fall through — without an auth method enrolled the app shouldn't
        // permanently lock the user out of their browser.
        onUnlock()
        return
    }

    val executor = ContextCompat.getMainExecutor(activity)
    val prompt = BiometricPrompt(
        activity,
        executor,
        object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                onUnlock()
            }
        }
    )
    val info = BiometricPrompt.PromptInfo.Builder()
        .setTitle("Super Browser")
        .setSubtitle("Подтвердите вход")
        .setAllowedAuthenticators(authenticators)
        .build()
    prompt.authenticate(info)
}
