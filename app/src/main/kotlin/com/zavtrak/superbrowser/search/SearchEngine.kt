package com.zavtrak.superbrowser.search

import android.net.Uri

enum class SearchEngine(val displayName: String, private val template: String) {
    GOOGLE("Google", "https://www.google.com/search?q=%s"),
    DUCKDUCKGO("DuckDuckGo", "https://duckduckgo.com/?q=%s"),
    BING("Bing", "https://www.bing.com/search?q=%s"),
    YANDEX("Yandex", "https://yandex.ru/search/?text=%s"),
    BRAVE("Brave Search", "https://search.brave.com/search?q=%s"),
    STARTPAGE("Startpage", "https://www.startpage.com/do/search?query=%s"),
    ECOSIA("Ecosia", "https://www.ecosia.org/search?q=%s");

    fun searchUrl(query: String): String =
        template.replace("%s", Uri.encode(query))

    val homepage: String
        get() = when (this) {
            GOOGLE -> "https://www.google.com/"
            DUCKDUCKGO -> "https://duckduckgo.com/"
            BING -> "https://www.bing.com/"
            YANDEX -> "https://yandex.ru/"
            BRAVE -> "https://search.brave.com/"
            STARTPAGE -> "https://www.startpage.com/"
            ECOSIA -> "https://www.ecosia.org/"
        }
}

object UrlClassifier {
    private val schemeRegex = Regex("^[a-zA-Z][a-zA-Z0-9+.-]*://")
    private val hostishRegex = Regex(
        "^([a-zA-Z0-9][-a-zA-Z0-9]*\\.)+[a-zA-Z]{2,}(/.*)?$"
    )
    private val ipv4Regex = Regex("^\\d{1,3}(\\.\\d{1,3}){3}(:\\d+)?(/.*)?$")

    /**
     * Decides whether [input] looks like a navigable URL or should be treated
     * as a search query. Returns either the canonicalised URL or null if a
     * search should be issued instead.
     */
    fun toUrlOrNull(input: String): String? {
        val trimmed = input.trim()
        if (trimmed.isEmpty()) return null
        if (trimmed.startsWith("about:") || trimmed.startsWith("javascript:")) return trimmed
        if (schemeRegex.containsMatchIn(trimmed)) return trimmed
        if (trimmed == "localhost" || trimmed.startsWith("localhost:") || trimmed.startsWith("localhost/")) {
            return "http://$trimmed"
        }
        if (ipv4Regex.matches(trimmed)) return "http://$trimmed"
        if (hostishRegex.matches(trimmed) && !trimmed.contains(' ')) return "https://$trimmed"
        return null
    }
}
