package com.zavtrak.devinos.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import com.zavtrak.devinos.data.ThemePref

private val DarkColors = darkColorScheme(
    primary = Color(0xFFFF8A3D),
    onPrimary = Color.White,
    secondary = Color(0xFFFF3D6E),
    onSecondary = Color.White,
    background = Color(0xFF0A0B12),
    onBackground = Color(0xFFF5F6FB),
    surface = Color(0xFF14161E),
    onSurface = Color(0xFFF5F6FB),
    surfaceVariant = Color(0xFF1F2230),
    onSurfaceVariant = Color(0xFFC9CDD9),
)

private val LightColors = lightColorScheme(
    primary = Color(0xFFFF6E3C),
    onPrimary = Color.White,
    secondary = Color(0xFFFF2D6E),
    onSecondary = Color.White,
    background = Color(0xFFF4F5FA),
    onBackground = Color(0xFF0D0E12),
    surface = Color(0xFFFFFFFF),
    onSurface = Color(0xFF0D0E12),
    surfaceVariant = Color(0xFFE9EAEF),
    onSurfaceVariant = Color(0xFF45474F),
)

@Composable
fun DevinOSTheme(themePref: ThemePref, content: @Composable () -> Unit) {
    val isDark = when (themePref) {
        ThemePref.Dark -> true
        ThemePref.Light -> false
        ThemePref.System -> androidx.compose.foundation.isSystemInDarkTheme()
    }
    MaterialTheme(
        colorScheme = if (isDark) DarkColors else LightColors,
        typography = MaterialTheme.typography,
        content = content,
    )
}
