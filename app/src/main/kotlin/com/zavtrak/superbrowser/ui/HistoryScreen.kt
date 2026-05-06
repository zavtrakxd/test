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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import java.text.DateFormat
import java.util.Date

@Composable
fun HistoryScreen(viewModel: BrowserViewModel) {
    val app = BrowserApplication.instance
    var refreshTick by remember { mutableIntStateOf(0) }
    val items = remember(refreshTick) { app.store.history() }
    val df = remember { DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT) }

    Column(modifier = Modifier.fillMaxWidth().padding(16.dp).heightIn(min = 320.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("История", style = MaterialTheme.typography.titleLarge)
            Spacer(Modifier.weight(1f))
            TextButton(onClick = {
                app.store.clearHistory(); refreshTick++
            }) { Text("Очистить") }
        }
        Spacer(Modifier.heightIn(min = 8.dp))
        if (items.isEmpty()) {
            Text("История пуста", color = MaterialTheme.colorScheme.onSurfaceVariant)
        } else {
            LazyColumn {
                items(items, key = { it.url + it.visitedAt }) { h ->
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                val tab = viewModel.current() ?: return@clickable
                                tab.url = h.url
                                tab.liveWebViewRef?.get()?.loadUrl(h.url)
                                viewModel.closeDrawer()
                            }
                            .padding(vertical = 6.dp)
                    ) {
                        Text(
                            h.title.ifBlank { h.url },
                            style = MaterialTheme.typography.bodyLarge,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            "${df.format(Date(h.visitedAt))}  •  ${h.url}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }
        }
    }
}
