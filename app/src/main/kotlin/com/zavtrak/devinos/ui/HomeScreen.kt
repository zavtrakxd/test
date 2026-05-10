package com.zavtrak.devinos.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectVerticalDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
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
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.zavtrak.devinos.data.LauncherApp

@Composable
fun HomeScreen(
    apps: List<LauncherApp>,
    dock: List<LauncherApp>,
    onAppClick: (LauncherApp) -> Unit,
    onAppLongClick: (LauncherApp) -> Unit,
    onOpenDrawer: () -> Unit,
    onOpenSettings: () -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .pointerInput(Unit) {
                detectVerticalDragGestures { _, dragAmount ->
                    // Strong upward swipe opens app drawer.
                    if (dragAmount < -22f) onOpenDrawer()
                }
            }
            .windowInsetsPadding(WindowInsets.systemBars)
            .padding(top = 8.dp, bottom = 8.dp),
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // ============ Search bar ============
            Row(
                modifier = Modifier
                    .padding(horizontal = 18.dp, vertical = 12.dp)
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(18.dp))
                    .background(Color.White.copy(alpha = 0.10f))
                    .border(1.dp, Color.White.copy(alpha = 0.14f), RoundedCornerShape(18.dp))
                    .clickable { onOpenDrawer() }
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(
                    Icons.Default.Search,
                    contentDescription = null,
                    tint = Color.White.copy(alpha = 0.78f),
                    modifier = Modifier.size(18.dp),
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    "Поиск приложений",
                    color = Color.White.copy(alpha = 0.78f),
                    fontSize = 14.sp,
                )
                Spacer(modifier = Modifier.weight(1f))
                Icon(
                    Icons.Default.Settings,
                    contentDescription = "Настройки",
                    tint = Color.White.copy(alpha = 0.78f),
                    modifier = Modifier
                        .size(18.dp)
                        .clickable { onOpenSettings() },
                )
            }

            // ============ Big widgets ============
            Row(
                modifier = Modifier
                    .padding(horizontal = 18.dp)
                    .fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                WeatherWidget(modifier = Modifier.weight(1f))
                ClockWidget(modifier = Modifier.weight(1f))
            }

            Spacer(Modifier.height(16.dp))

            // ============ App grid ============
            // Show first ~28 apps on home; rest live in the drawer.
            val homeApps = remember(apps) { apps.take(28) }
            LazyVerticalGrid(
                columns = GridCells.Fixed(4),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(0.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
                modifier = Modifier.weight(1f),
            ) {
                items(homeApps, key = { it.packageName + "/" + it.activityName }) { app ->
                    Box(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        AppIconTile(
                            app = app,
                            size = 60,
                            showLabel = true,
                            onClick = { onAppClick(app) },
                            onLongClick = { onAppLongClick(app) },
                        )
                    }
                }
            }

            // ============ Dock ============
            DockBar(
                dock = dock.take(4),
                onAppClick = onAppClick,
                onAppLongClick = onAppLongClick,
                modifier = Modifier
                    .padding(horizontal = 16.dp)
                    .fillMaxWidth(),
            )

            Spacer(Modifier.height(8.dp))
        }
    }
}

@Composable
private fun DockBar(
    dock: List<LauncherApp>,
    onAppClick: (LauncherApp) -> Unit,
    onAppLongClick: (LauncherApp) -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(28.dp))
            .background(Color.White.copy(alpha = 0.10f))
            .border(1.dp, Color.White.copy(alpha = 0.14f), RoundedCornerShape(28.dp))
            .padding(horizontal = 12.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceEvenly,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (dock.isEmpty()) {
            // Placeholder bubbles
            repeat(4) {
                Box(
                    modifier = Modifier
                        .size(60.dp)
                        .clip(RoundedCornerShape(18.dp))
                        .background(Color.White.copy(alpha = 0.06f)),
                )
            }
        } else {
            dock.forEach { app ->
                AppIconTile(
                    app = app,
                    size = 56,
                    showLabel = false,
                    onClick = { onAppClick(app) },
                    onLongClick = { onAppLongClick(app) },
                )
            }
        }
    }
}
