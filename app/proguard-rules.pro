# Keep WebView JS-bridge methods if any are added in the future.
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Compose preview
-dontwarn androidx.compose.**
