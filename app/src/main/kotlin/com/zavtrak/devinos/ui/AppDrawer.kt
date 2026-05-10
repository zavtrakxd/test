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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.zavtrak.devinos.data.LauncherApp

@Composable
fun AppDrawerScreen(
    apps: List<LauncherApp>,
    onAppClick: (LauncherApp) -> Unit,
    onAppLongClick: (LauncherApp) -> Unit,
    onClose: () -> Unit,
) {
    var query by remember { mutableStateOf("") }
    val filtered = remember(query, apps) {
        if (query.isBlank()) apps
        else apps.filter { it.label.contains(query, ignoreCase = true) }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.42f))
            .pointerInput(Unit) {
                detectVerticalDragGestures { _, dragAmount ->
                    if (dragAmount > 22f) onClose()
                }
            }
            .windowInsetsPadding(WindowInsets.systemBars),
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Header with search + close
            Row(
                modifier = Modifier
                    .padding(horizontal = 14.dp, vertical = 10.dp)
                    .fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(18.dp))
                        .background(Color.White.copy(alpha = 0.10f))
                        .border(1.dp, Color.White.copy(alpha = 0.14f), RoundedCornerShape(18.dp))
                        .padding(horizontal = 14.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(
                        Icons.Default.Search,
                        contentDescription = null,
                        tint = Color.White.copy(alpha = 0.7f),
                        modifier = Modifier.size(18.dp),
                    )
                    Spacer(Modifier.width(10.dp))
                    Box(modifier = Modifier.weight(1f)) {
                        if (query.isEmpty()) {
                            Text(
                                "Поиск приложений",
                                color = Color.White.copy(alpha = 0.55f),
                                fontSize = 14.sp,
                            )
                        }
                        BasicTextField(
                            value = query,
                            onValueChange = { query = it },
                            singleLine = true,
                            cursorBrush = SolidColor(Color.White),
                            textStyle = TextStyle(
                                color = Color.White,
                                fontSize = 14.sp,
                            ),
                            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                            keyboardActions = KeyboardActions(onSearch = {
                                filtered.firstOrNull()?.let(onAppClick)
                            }),
                        )
                    }
                    if (query.isNotEmpty()) {
                        Icon(
                            Icons.Default.Close,
                            contentDescription = "Очистить",
                            tint = Color.White.copy(alpha = 0.7f),
                            modifier = Modifier
                                .size(18.dp)
                                .clip(RoundedCornerShape(50))
                                .clickable { query = "" }
                                .padding(2.dp),
                        )
                    }
                }
                Spacer(Modifier.width(10.dp))
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(50))
                        .background(Color.White.copy(alpha = 0.10f))
                        .border(1.dp, Color.White.copy(alpha = 0.14f), RoundedCornerShape(50))
                        .clickable(onClick = onClose),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        Icons.Default.Close,
                        contentDescription = "Закрыть",
                        tint = Color.White,
                        modifier = Modifier.size(20.dp),
                    )
                }
            }

            Text(
                text = "Все приложения · ${filtered.size}",
                color = Color.White.copy(alpha = 0.7f),
                fontSize = 12.sp,
                modifier = Modifier.padding(horizontal = 18.dp, vertical = 4.dp),
            )

            LazyVerticalGrid(
                columns = GridCells.Fixed(4),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(0.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
                modifier = Modifier.weight(1f),
            ) {
                items(filtered, key = { it.packageName + "/" + it.activityName }) { app ->
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

            Spacer(Modifier.height(8.dp))
        }
    }
}
