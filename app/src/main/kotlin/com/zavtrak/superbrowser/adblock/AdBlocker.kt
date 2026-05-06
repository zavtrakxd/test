package com.zavtrak.superbrowser.adblock

import android.content.Context
import android.net.Uri
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.net.URL
import java.util.concurrent.atomic.AtomicLong

/**
 * Host-based ad blocker.
 *
 * Loads a hosts-format blocklist (e.g. StevenBlack/hosts) into memory and
 * matches each network request against it. Lookups are O(1).
 *
 * The list is cached on disk so we only need network access once per refresh
 * window. A small built-in seed list ensures the blocker still works on first
 * launch while the network refresh happens in the background.
 */
class AdBlocker(context: Context) {

    private val ctx = context.applicationContext
    private val cacheDir: File by lazy { File(ctx.cacheDir, "adblock").apply { mkdirs() } }
    private val cacheFile: File by lazy { File(cacheDir, "hosts.txt") }
    private val timestampFile: File by lazy { File(cacheDir, "hosts.timestamp") }

    @Volatile
    private var blockedHosts: Set<String> = SEED_HOSTS

    private val blockedCount = AtomicLong(0)

    fun shouldBlock(requestUrl: String?): Boolean {
        if (requestUrl.isNullOrEmpty()) return false
        val host = runCatching { Uri.parse(requestUrl).host?.lowercase() }.getOrNull() ?: return false
        if (host.isEmpty()) return false

        // Match the host and any parent domain (sub.tracker.com -> tracker.com).
        var probe = host
        while (true) {
            if (probe in blockedHosts) {
                blockedCount.incrementAndGet()
                return true
            }
            val dot = probe.indexOf('.')
            if (dot < 0) break
            probe = probe.substring(dot + 1)
            if (probe.indexOf('.') < 0) break
        }
        return false
    }

    fun blockedCount(): Long = blockedCount.get()
    fun resetCounter() = blockedCount.set(0)

    fun loadCachedHosts() {
        if (!cacheFile.exists()) return
        runCatching {
            val parsed = parseHostsFile(cacheFile.readText())
            if (parsed.isNotEmpty()) blockedHosts = parsed
        }
    }

    suspend fun refreshIfStale() = withContext(Dispatchers.IO) {
        val now = System.currentTimeMillis()
        val lastRefresh = runCatching { timestampFile.readText().trim().toLong() }.getOrDefault(0L)
        if (now - lastRefresh < REFRESH_INTERVAL_MS && cacheFile.exists()) return@withContext

        for (url in REMOTE_LISTS) {
            try {
                val text = URL(url).openConnection().apply {
                    connectTimeout = 10_000
                    readTimeout = 20_000
                }.getInputStream().bufferedReader().use { it.readText() }
                val parsed = parseHostsFile(text)
                if (parsed.size > 100) {
                    cacheFile.writeText(text)
                    timestampFile.writeText(now.toString())
                    blockedHosts = parsed + SEED_HOSTS
                    Log.i(TAG, "Loaded ${parsed.size} ad-block hosts from $url")
                    return@withContext
                }
            } catch (t: Throwable) {
                Log.w(TAG, "Failed to fetch $url: ${t.message}")
            }
        }
    }

    private fun parseHostsFile(text: String): Set<String> {
        val out = HashSet<String>(8 * 1024)
        text.lineSequence().forEach { rawLine ->
            val line = rawLine.substringBefore('#').trim()
            if (line.isEmpty()) return@forEach
            // Hosts file format: "0.0.0.0 ads.example.com" or "127.0.0.1 ads.example.com"
            // or "ads.example.com" lines (e.g. domains-only lists).
            val parts = line.split(Regex("\\s+"))
            val host = when {
                parts.size >= 2 && (parts[0] == "0.0.0.0" || parts[0] == "127.0.0.1") -> parts[1]
                parts.size == 1 && '.' in parts[0] -> parts[0]
                else -> return@forEach
            }.lowercase().trim('.')
            if (host == "localhost" || host.isEmpty()) return@forEach
            out += host
        }
        return out
    }

    private companion object {
        const val TAG = "AdBlocker"
        const val REFRESH_INTERVAL_MS = 24L * 60L * 60L * 1000L

        // Try the smaller, faster list first; fall back to the larger one.
        val REMOTE_LISTS = listOf(
            "https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts",
            "https://adaway.org/hosts.txt"
        )

        // Tiny built-in seed so first launch still blocks the most obvious
        // trackers if the network is unavailable.
        val SEED_HOSTS: Set<String> = setOf(
            "doubleclick.net", "googlesyndication.com", "googleadservices.com",
            "google-analytics.com", "googletagmanager.com", "googletagservices.com",
            "adservice.google.com", "adservice.google.ru", "adservice.google.de",
            "scorecardresearch.com", "moatads.com", "criteo.com", "criteo.net",
            "facebook.net", "connect.facebook.net", "ads.yahoo.com",
            "ads.linkedin.com", "an.yandex.ru", "yandex.ru/an",
            "mc.yandex.ru", "metric.yandex.com",
            "adnxs.com", "amplitude.com", "appsflyer.com",
            "branch.io", "amazon-adsystem.com", "tns-counter.ru",
            "rambler.ru/svc", "smartadserver.com", "adform.net",
            "outbrain.com", "taboola.com",
            "hotjar.com", "fullstory.com", "mixpanel.com",
            "segment.io", "segment.com",
            "stats.wp.com", "matomo.cloud"
        )
    }
}
