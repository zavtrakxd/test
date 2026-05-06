package com.zavtrak.superbrowser.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.zavtrak.superbrowser.BrowserApplication
import com.zavtrak.superbrowser.browser.BrowserViewModel

@Composable
fun BookmarksScreen(viewModel: BrowserViewModel) {
    val app = BrowserApplication.instance
    var refreshTick by remember { mutableIntStateOf(0) }
    val items = remember(refreshTick) { app.store.bookmarks().sortedByDescending { it.createdAt } }

    Column(modifier = Modifier.fillMaxWidth().padding(16.dp).heightIn(min = 320.dp)) {
        Text("Закладки", style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.heightIn(min = 8.dp))
        if (items.isEmpty()) {
            Text("Закладок пока нет", color = MaterialTheme.colorScheme.onSurfaceVariant)
        } else {
            LazyColumn {
                items(items, key = { it.url }) { b ->
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                val tab = viewModel.current() ?: return@clickable
                                tab.url = b.url
                                tab.liveWebViewRef?.get()?.loadUrl(b.url)
                                viewModel.closeDrawer()
                            }
                            .padding(vertical = 6.dp)
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                b.title.ifBlank { b.url },
                                style = MaterialTheme.typography.bodyLarge,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                b.url,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                        IconButton(onClick = {
                            app.store.removeBookmark(b.url)
                            refreshTick++
                        }) {
                            Icon(Icons.Default.Delete, contentDescription = null)
                        }
                    }
                }
            }
        }
    }
}
