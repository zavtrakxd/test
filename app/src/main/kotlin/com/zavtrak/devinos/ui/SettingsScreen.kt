package com.zavtrak.devinos.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.systemBars
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.zavtrak.devinos.BuildConfig
import com.zavtrak.devinos.data.ThemePref
import com.zavtrak.devinos.data.WallpaperPref

@Composable
fun SettingsScreen(
    theme: ThemePref,
    wallpaper: WallpaperPref,
    onThemeChange: (ThemePref) -> Unit,
    onWallpaperChange: (WallpaperPref) -> Unit,
    onSetDefaultLauncher: () -> Unit,
    onBack: () -> Unit,
) {
    val scroll = rememberScrollState()
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.55f))
            .windowInsetsPadding(WindowInsets.systemBars),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scroll)
                .padding(horizontal = 18.dp, vertical = 12.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(50))
                        .background(Color.White.copy(alpha = 0.10f))
                        .border(1.dp, Color.White.copy(alpha = 0.14f), RoundedCornerShape(50))
                        .clickable(onClick = onBack),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Назад",
                        tint = Color.White,
                        modifier = Modifier.size(20.dp),
                    )
                }
                Spacer(Modifier.width(12.dp))
                Text(
                    "Настройки",
                    color = Color.White,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.SemiBold,
                )
            }

            Spacer(Modifier.height(20.dp))

            // Theme
            SectionHeader("ТЕМА")
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                ThemeCard(
                    label = "Тёмная",
                    bg = listOf(Color(0xFF12121C), Color(0xFF1F1F2E)),
                    selected = theme == ThemePref.Dark,
                    modifier = Modifier.weight(1f),
                    onClick = { onThemeChange(ThemePref.Dark) },
                )
                ThemeCard(
                    label = "Светлая",
                    bg = listOf(Color(0xFFEFEFF4), Color(0xFFFAFAFC)),
                    selected = theme == ThemePref.Light,
                    modifier = Modifier.weight(1f),
                    onClick = { onThemeChange(ThemePref.Light) },
                )
                ThemeCard(
                    label = "Системная",
                    bg = listOf(Color(0xFF6F3CFF), Color(0xFFFF3D9A)),
                    selected = theme == ThemePref.System,
                    modifier = Modifier.weight(1f),
                    onClick = { onThemeChange(ThemePref.System) },
                )
            }

            Spacer(Modifier.height(24.dp))

            // Wallpaper
            SectionHeader("ОБОИ")
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                WallpaperCard(
                    label = "Aurora",
                    gradient = listOf(Color(0xFF1B0C2C), Color(0xFF6F3CFF), Color(0xFFFF3D9A)),
                    selected = wallpaper == WallpaperPref.Aurora,
                    modifier = Modifier.weight(1f),
                    onClick = { onWallpaperChange(WallpaperPref.Aurora) },
                )
                WallpaperCard(
                    label = "Sunset",
                    gradient = listOf(Color(0xFF2B0A1C), Color(0xFFFF6B3D), Color(0xFFFF2D80)),
                    selected = wallpaper == WallpaperPref.Sunset,
                    modifier = Modifier.weight(1f),
                    onClick = { onWallpaperChange(WallpaperPref.Sunset) },
                )
            }
            Spacer(Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                WallpaperCard(
                    label = "Ocean",
                    gradient = listOf(Color(0xFF04111D), Color(0xFF114E63), Color(0xFF2DC1FF)),
                    selected = wallpaper == WallpaperPref.Ocean,
                    modifier = Modifier.weight(1f),
                    onClick = { onWallpaperChange(WallpaperPref.Ocean) },
                )
                WallpaperCard(
                    label = "Mono",
                    gradient = listOf(Color(0xFF060608), Color(0xFF15151A), Color(0xFF2A2A30)),
                    selected = wallpaper == WallpaperPref.Mono,
                    modifier = Modifier.weight(1f),
                    onClick = { onWallpaperChange(WallpaperPref.Mono) },
                )
            }

            Spacer(Modifier.height(24.dp))

            // Set as default launcher
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(18.dp))
                    .background(
                        Brush.linearGradient(
                            listOf(Color(0xFFFF8A3D), Color(0xFFFF3D6E))
                        )
                    )
                    .clickable(onClick = onSetDefaultLauncher)
                    .padding(vertical = 14.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    "Сделать DevinOS лаунчером по умолчанию",
                    color = Color.White,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 15.sp,
                )
            }

            Spacer(Modifier.height(28.dp))

            // About
            SectionHeader("О ЛАУНЧЕРЕ")
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(18.dp))
                    .background(Color.White.copy(alpha = 0.08f))
                    .border(1.dp, Color.White.copy(alpha = 0.12f), RoundedCornerShape(18.dp))
                    .padding(16.dp),
            ) {
                Column {
                    Text("DevinOS", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "HyperOS-style launcher · версия ${BuildConfig.VERSION_NAME}",
                        color = Color.White.copy(alpha = 0.7f),
                        fontSize = 12.sp,
                    )
                }
            }

            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun SectionHeader(text: String) {
    Text(
        text,
        color = Color.White.copy(alpha = 0.55f),
        fontSize = 11.sp,
        fontWeight = FontWeight.SemiBold,
        modifier = Modifier.padding(start = 4.dp, top = 4.dp, bottom = 10.dp),
    )
}

@Composable
private fun ThemeCard(
    label: String,
    bg: List<Color>,
    selected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    Column(modifier = modifier.clickable(onClick = onClick)) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(80.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(Brush.linearGradient(bg))
                .border(
                    width = if (selected) 2.dp else 1.dp,
                    color = if (selected) Color(0xFFFF8A3D) else Color.White.copy(alpha = 0.14f),
                    shape = RoundedCornerShape(16.dp),
                ),
        )
        Spacer(Modifier.height(6.dp))
        Text(label, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Medium)
    }
}

@Composable
private fun WallpaperCard(
    label: String,
    gradient: List<Color>,
    selected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    Column(modifier = modifier.clickable(onClick = onClick)) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(80.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(Brush.linearGradient(gradient))
                .border(
                    width = if (selected) 2.dp else 1.dp,
                    color = if (selected) Color(0xFFFF8A3D) else Color.White.copy(alpha = 0.14f),
                    shape = RoundedCornerShape(16.dp),
                ),
        )
        Spacer(Modifier.height(6.dp))
        Text(label, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Medium)
    }
}
