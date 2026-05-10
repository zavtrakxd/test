package com.zavtrak.devinos.ui

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.BlendMode
import com.zavtrak.devinos.data.WallpaperPref
import kotlin.math.cos
import kotlin.math.sin

private data class WallpaperPalette(
    val base: List<Color>,
    val blob1: Color,
    val blob2: Color,
    val blob3: Color,
)

private fun paletteFor(pref: WallpaperPref): WallpaperPalette = when (pref) {
    WallpaperPref.Aurora -> WallpaperPalette(
        base = listOf(Color(0xFF0B0820), Color(0xFF1B0C2C), Color(0xFF2D0F3A)),
        blob1 = Color(0xFF6F3CFF),
        blob2 = Color(0xFFFF3D9A),
        blob3 = Color(0xFF2DC7FF),
    )
    WallpaperPref.Sunset -> WallpaperPalette(
        base = listOf(Color(0xFF2B0A1C), Color(0xFF43102A), Color(0xFF5B1832)),
        blob1 = Color(0xFFFF6B3D),
        blob2 = Color(0xFFFF2D80),
        blob3 = Color(0xFFFFA53D),
    )
    WallpaperPref.Ocean -> WallpaperPalette(
        base = listOf(Color(0xFF04111D), Color(0xFF0B2A3F), Color(0xFF114E63)),
        blob1 = Color(0xFF2DC1FF),
        blob2 = Color(0xFF00D3A8),
        blob3 = Color(0xFF355CFF),
    )
    WallpaperPref.Mono -> WallpaperPalette(
        base = listOf(Color(0xFF060608), Color(0xFF0E0E12), Color(0xFF16161B)),
        blob1 = Color(0xFF2A2A30),
        blob2 = Color(0xFF15151A),
        blob3 = Color(0xFF22222A),
    )
}

@Composable
fun WallpaperBackground(pref: WallpaperPref, modifier: Modifier = Modifier) {
    val palette = paletteFor(pref)

    val transition = rememberInfiniteTransition(label = "wallpaper")
    val phase by transition.animateFloat(
        initialValue = 0f,
        targetValue = (Math.PI * 2).toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 22_000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart,
        ),
        label = "phase",
    )

    Box(modifier = modifier.fillMaxSize()) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            // Base vertical gradient
            drawRect(
                brush = Brush.verticalGradient(palette.base),
                size = size,
            )

            val w = size.width
            val h = size.height
            val r = (w + h) * 0.45f

            fun blob(color: Color, cx: Float, cy: Float) {
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(color.copy(alpha = 0.55f), color.copy(alpha = 0f)),
                        center = Offset(cx, cy),
                        radius = r,
                    ),
                    center = Offset(cx, cy),
                    radius = r,
                    blendMode = BlendMode.Plus,
                )
            }

            // Three slow-moving radial blobs to keep the wallpaper alive.
            blob(
                palette.blob1,
                cx = w * (0.25f + 0.15f * cos(phase)),
                cy = h * (0.20f + 0.10f * sin(phase * 0.9f)),
            )
            blob(
                palette.blob2,
                cx = w * (0.80f + 0.10f * sin(phase * 0.7f)),
                cy = h * (0.65f + 0.12f * cos(phase * 1.1f)),
            )
            blob(
                palette.blob3,
                cx = w * (0.55f + 0.15f * cos(phase * 0.5f)),
                cy = h * (0.95f + 0.08f * sin(phase)),
            )

            // Subtle vignette so foreground UI stays crisp.
            drawRect(
                brush = Brush.radialGradient(
                    colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.35f)),
                    center = Offset(w / 2f, h / 2f),
                    radius = (w + h) * 0.6f,
                ),
                size = Size(w, h),
            )
        }
    }
}
