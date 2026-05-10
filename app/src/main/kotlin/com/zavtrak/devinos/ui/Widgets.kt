package com.zavtrak.devinos.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun rememberLiveTime(): Date {
    var time by remember { mutableStateOf(Date()) }
    LaunchedEffect(Unit) {
        while (true) {
            time = Date()
            delay(1000)
        }
    }
    return time
}

@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(24.dp))
            .background(Color.White.copy(alpha = 0.10f))
            .border(1.dp, Color.White.copy(alpha = 0.16f), RoundedCornerShape(24.dp))
            .padding(14.dp),
    ) {
        content()
    }
}

@Composable
fun WeatherWidget(modifier: Modifier = Modifier) {
    GlassCard(modifier = modifier) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                "+18°",
                color = Color.White,
                fontSize = 36.sp,
                fontWeight = FontWeight.Light,
            )
            Spacer(Modifier.width(12.dp))
            Column(Modifier.fillMaxWidth().weight(1f)) {
                Text("Москва", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                Text("Облачно с прояснениями", color = Color.White.copy(alpha = 0.7f), fontSize = 12.sp)
            }
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(50))
                    .background(
                        Brush.linearGradient(
                            listOf(Color(0xFFFFD86B), Color(0xFFFF8A3D))
                        )
                    ),
            )
        }
    }
}

@Composable
fun ClockWidget(modifier: Modifier = Modifier, onClick: () -> Unit = {}) {
    val time = rememberLiveTime()
    GlassCard(modifier = modifier.clickable { onClick() }) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            AnalogClock(time, modifier = Modifier.size(72.dp))
            Spacer(Modifier.width(12.dp))
            Column {
                Text("Москва", color = Color.White.copy(alpha = 0.7f), fontSize = 12.sp)
                Text(
                    SimpleDateFormat("H:mm", Locale.getDefault()).format(time),
                    color = Color.White,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Medium,
                )
            }
        }
    }
}

@Composable
fun AnalogClock(time: Date, modifier: Modifier = Modifier) {
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val cx = w / 2f
        val cy = h / 2f
        val r = (minOf(w, h) / 2f) - 2f

        // Face
        drawCircle(
            color = Color.White.copy(alpha = 0.10f),
            center = Offset(cx, cy),
            radius = r,
        )
        drawCircle(
            color = Color.White.copy(alpha = 0.25f),
            center = Offset(cx, cy),
            radius = r,
            style = androidx.compose.ui.graphics.drawscope.Stroke(width = 2f),
        )

        // Ticks at 12, 3, 6, 9
        val tickColor = Color.White.copy(alpha = 0.6f)
        listOf(0.0, PI / 2, PI, 3 * PI / 2).forEach { angle ->
            val sx = cx + (r - 6f) * cos(angle - PI / 2).toFloat()
            val sy = cy + (r - 6f) * sin(angle - PI / 2).toFloat()
            val ex = cx + r * cos(angle - PI / 2).toFloat()
            val ey = cy + r * sin(angle - PI / 2).toFloat()
            drawLine(tickColor, start = Offset(sx, sy), end = Offset(ex, ey), strokeWidth = 2f)
        }

        // Calculate hand positions
        val cal = java.util.Calendar.getInstance().apply { this.time = time }
        val hour = cal.get(java.util.Calendar.HOUR) + cal.get(java.util.Calendar.MINUTE) / 60.0
        val minute = cal.get(java.util.Calendar.MINUTE) + cal.get(java.util.Calendar.SECOND) / 60.0
        val second = cal.get(java.util.Calendar.SECOND).toDouble()

        fun hand(angle: Double, length: Float, color: Color, width: Float) {
            val a = angle - PI / 2
            val ex = cx + length * cos(a).toFloat()
            val ey = cy + length * sin(a).toFloat()
            drawLine(color, start = Offset(cx, cy), end = Offset(ex, ey), strokeWidth = width)
        }

        hand(hour * (PI * 2 / 12), r * 0.50f, Color.White, 4f)
        hand(minute * (PI * 2 / 60), r * 0.72f, Color.White.copy(alpha = 0.85f), 3f)
        hand(second * (PI * 2 / 60), r * 0.78f, Color(0xFFFF6E3C), 1.5f)

        drawCircle(Color(0xFFFF6E3C), center = Offset(cx, cy), radius = 4f)
    }
}
