package com.zavtrak.superbrowser.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.zavtrak.superbrowser.browser.BrowserViewModel

@Composable
fun TabsScreen(viewModel: BrowserViewModel) {
    val tabs by viewModel.tabs.collectAsState()
    val current by viewModel.currentTabId.collectAsState()

    Column(modifier = Modifier.fillMaxWidth().padding(16.dp).heightIn(min = 320.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("Вкладки", style = MaterialTheme.typography.titleLarge)
            Spacer(Modifier.weight(1f))
            TextButton(onClick = { viewModel.closeAllTabs() }) { Text("Закрыть все") }
        }
        Spacer(Modifier.heightIn(min = 8.dp))
        Row(modifier = Modifier.fillMaxWidth()) {
            TextButton(onClick = {
                viewModel.newTab(incognito = false, foreground = true)
                viewModel.closeDrawer()
            }) {
                Icon(Icons.Default.Add, null); Spacer(Modifier.width(4.dp)); Text("Новая")
            }
            TextButton(onClick = {
                viewModel.newTab(incognito = true, foreground = true)
                viewModel.closeDrawer()
            }) {
                Icon(Icons.Default.Lock, null); Spacer(Modifier.width(4.dp)); Text("Инкогнито")
            }
        }
        LazyVerticalGrid(columns = GridCells.Fixed(2), verticalArrangement = Arrangement.spacedBy(8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(tabs, key = { it.id }) { tab ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            viewModel.selectTab(tab.id)
                            viewModel.closeDrawer()
                        },
                    shape = RoundedCornerShape(12.dp),
                ) {
                    Column(modifier = Modifier.padding(8.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            if (tab.isIncognito) {
                                Icon(Icons.Default.Lock, null, modifier = Modifier.heightIn(max = 16.dp))
                                Spacer(Modifier.width(4.dp))
                            }
                            Text(
                                text = tab.title.ifBlank { "Новая вкладка" },
                                style = MaterialTheme.typography.titleSmall,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.weight(1f)
                            )
                            IconButton(
                                onClick = { viewModel.closeTab(tab.id) },
                                modifier = Modifier.heightIn(max = 28.dp)
                            ) {
                                Icon(Icons.Default.Close, null)
                            }
                        }
                        Text(
                            text = tab.url,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        if (tab.id == current) {
                            Spacer(Modifier.heightIn(min = 6.dp))
                            Surface(
                                color = MaterialTheme.colorScheme.primary,
                                shape = RoundedCornerShape(50)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .padding(horizontal = 8.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        "Активна",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onPrimary
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
