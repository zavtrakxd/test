package com.zavtrak.superbrowser.ui

import android.webkit.WebView

/**
 * Lightweight reader mode: hides ads, navigation chrome and other clutter and
 * applies a comfortable reading layout. This is intentionally heuristic — it
 * does not depend on the page's structure being well-formed and falls back to
 * the original page content if the heuristics produce nothing useful.
 */
internal fun WebView.injectReaderMode() {
    val js = """
    (function() {
      try {
        var doc = document.cloneNode(true);
        var article = doc.querySelector('article')
            || doc.querySelector('main')
            || doc.querySelector('[itemtype*="Article"]')
            || doc.body;
        if (!article) return;

        // Try to keep the most text-dense container.
        function score(node) {
          if (!node) return 0;
          var t = (node.innerText || '').length;
          var p = node.querySelectorAll && node.querySelectorAll('p').length;
          return t + (p || 0) * 25;
        }
        var candidates = [article];
        doc.querySelectorAll('main, article, section, div').forEach(function(el){
          if (score(el) > score(candidates[0])) candidates[0] = el;
        });
        var content = candidates[0].innerHTML;

        var title = (document.querySelector('h1') && document.querySelector('h1').innerText)
                    || document.title;

        document.documentElement.innerHTML =
          '<head><meta charset="utf-8"><title>' + title + '</title>' +
          '<style>' +
          ' html,body{background:#111;color:#eee;font-family:Georgia,serif;line-height:1.65;}' +
          ' body{margin:0;padding:24px;max-width:720px;margin:auto;font-size:18px;}' +
          ' h1,h2,h3{color:#fff;line-height:1.25;}' +
          ' a{color:#82b1ff;}' +
          ' img,video{max-width:100%;height:auto;border-radius:8px;}' +
          ' pre,code{background:#222;color:#eee;border-radius:4px;padding:2px 6px;}' +
          ' figure,figcaption{margin:1em 0;}' +
          ' nav,header,footer,aside,.ad,.advert,[id*="ad-"],[class*="ad-"],[class*="banner"]{display:none!important;}' +
          '</style></head>' +
          '<body><h1>' + title + '</h1>' + content + '</body>';
      } catch (e) { /* fail silently */ }
    })();
    """.trimIndent()
    evaluateJavascript(js, null)
}
