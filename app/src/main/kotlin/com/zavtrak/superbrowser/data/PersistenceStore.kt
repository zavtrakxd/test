package com.zavtrak.superbrowser.data

import android.content.Context
import androidx.core.content.edit
import kotlinx.coroutines.flow.MutableStateFlow
import org.json.JSONArray
import org.json.JSONObject

/**
 * Lightweight key/value persistence backed by SharedPreferences and JSON for
 * lists. Avoids the build/codegen overhead of Room while still giving us
 * structured storage for bookmarks, history and downloads.
 */
class PersistenceStore(context: Context) {

    private val ctx = context.applicationContext
    private val prefs = ctx.getSharedPreferences("super_browser", Context.MODE_PRIVATE)

    val pendingIntentUrl = MutableStateFlow<String?>(null)

    // ---- Bookmarks ----------------------------------------------------------

    fun bookmarks(): List<Bookmark> = readList(KEY_BOOKMARKS).map(Bookmark::fromJson)

    fun addBookmark(b: Bookmark) {
        val items = bookmarks().toMutableList()
        if (items.none { it.url == b.url }) {
            items += b
            writeList(KEY_BOOKMARKS, items.map(Bookmark::toJson))
        }
    }

    fun removeBookmark(url: String) {
        val items = bookmarks().filterNot { it.url == url }
        writeList(KEY_BOOKMARKS, items.map(Bookmark::toJson))
    }

    fun isBookmarked(url: String): Boolean = bookmarks().any { it.url == url }

    // ---- History ------------------------------------------------------------

    fun history(): List<HistoryEntry> = readList(KEY_HISTORY).map(HistoryEntry::fromJson)

    fun pushHistory(entry: HistoryEntry, max: Int = 1000) {
        val items = history().toMutableList()
        // Coalesce consecutive duplicates.
        if (items.firstOrNull()?.url == entry.url) return
        items.add(0, entry)
        if (items.size > max) {
            while (items.size > max) items.removeAt(items.size - 1)
        }
        writeList(KEY_HISTORY, items.map(HistoryEntry::toJson))
    }

    fun clearHistory() = prefs.edit { remove(KEY_HISTORY) }

    // ---- Downloads ----------------------------------------------------------

    fun downloads(): List<DownloadEntry> = readList(KEY_DOWNLOADS).map(DownloadEntry::fromJson)

    fun addDownload(entry: DownloadEntry) {
        val items = downloads().toMutableList()
        items.add(0, entry)
        writeList(KEY_DOWNLOADS, items.map(DownloadEntry::toJson))
    }

    fun clearDownloads() = prefs.edit { remove(KEY_DOWNLOADS) }

    // ---- Helpers ------------------------------------------------------------

    private fun readList(key: String): List<JSONObject> {
        val raw = prefs.getString(key, null) ?: return emptyList()
        return runCatching {
            val arr = JSONArray(raw)
            (0 until arr.length()).map { arr.getJSONObject(it) }
        }.getOrDefault(emptyList())
    }

    private fun writeList(key: String, items: List<JSONObject>) {
        val arr = JSONArray()
        items.forEach { arr.put(it) }
        prefs.edit { putString(key, arr.toString()) }
    }

    private companion object {
        const val KEY_BOOKMARKS = "bookmarks"
        const val KEY_HISTORY = "history"
        const val KEY_DOWNLOADS = "downloads"
    }
}

data class Bookmark(val title: String, val url: String, val createdAt: Long) {
    fun toJson(): JSONObject = JSONObject()
        .put("title", title).put("url", url).put("createdAt", createdAt)

    companion object {
        fun fromJson(o: JSONObject) = Bookmark(
            title = o.optString("title"),
            url = o.optString("url"),
            createdAt = o.optLong("createdAt")
        )
    }
}

data class HistoryEntry(val title: String, val url: String, val visitedAt: Long) {
    fun toJson(): JSONObject = JSONObject()
        .put("title", title).put("url", url).put("visitedAt", visitedAt)

    companion object {
        fun fromJson(o: JSONObject) = HistoryEntry(
            title = o.optString("title"),
            url = o.optString("url"),
            visitedAt = o.optLong("visitedAt")
        )
    }
}

data class DownloadEntry(
    val filename: String,
    val url: String,
    val mimeType: String,
    val sizeBytes: Long,
    val startedAt: Long
) {
    fun toJson(): JSONObject = JSONObject()
        .put("filename", filename).put("url", url).put("mimeType", mimeType)
        .put("sizeBytes", sizeBytes).put("startedAt", startedAt)

    companion object {
        fun fromJson(o: JSONObject) = DownloadEntry(
            filename = o.optString("filename"),
            url = o.optString("url"),
            mimeType = o.optString("mimeType"),
            sizeBytes = o.optLong("sizeBytes"),
            startedAt = o.optLong("startedAt")
        )
    }
}
