package com.zavtrak.devinos.data

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ResolveInfo
import android.graphics.drawable.Drawable
import android.os.UserHandle
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import java.text.Collator
import java.util.Locale

data class LauncherApp(
    val packageName: String,
    val activityName: String,
    val label: String,
    val icon: Drawable,
)

class AppRepository(private val context: Context) {

    private val pm: PackageManager = context.packageManager
    private val collator: Collator = Collator.getInstance(Locale("ru")).apply { strength = Collator.PRIMARY }

    private val _apps = MutableStateFlow<List<LauncherApp>>(emptyList())
    val apps: StateFlow<List<LauncherApp>> = _apps.asStateFlow()

    suspend fun reload() = withContext(Dispatchers.Default) {
        val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
        val flags = PackageManager.MATCH_DEFAULT_ONLY
        val resolved: List<ResolveInfo> = try {
            pm.queryIntentActivities(intent, flags)
        } catch (_: Exception) {
            emptyList()
        }
        val list = resolved
            .asSequence()
            .filter { it.activityInfo != null && it.activityInfo.packageName != context.packageName }
            .map { ri ->
                val ai = ri.activityInfo
                LauncherApp(
                    packageName = ai.packageName,
                    activityName = ai.name,
                    label = ri.loadLabel(pm).toString().ifBlank { ai.packageName },
                    icon = ri.loadIcon(pm),
                )
            }
            .sortedWith(compareBy(collator) { it.label })
            .toList()
        _apps.value = list
    }

    fun launch(app: LauncherApp): Boolean {
        val intent = Intent().apply {
            setClassName(app.packageName, app.activityName)
            action = Intent.ACTION_MAIN
            addCategory(Intent.CATEGORY_LAUNCHER)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED or
                Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        return try {
            context.startActivity(intent)
            true
        } catch (_: Exception) {
            try {
                pm.getLaunchIntentForPackage(app.packageName)?.let {
                    context.startActivity(it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                    true
                } ?: false
            } catch (_: Exception) {
                false
            }
        }
    }

    fun openAppInfo(packageName: String) {
        val intent = Intent("android.settings.APPLICATION_DETAILS_SETTINGS").apply {
            data = android.net.Uri.parse("package:$packageName")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        try {
            context.startActivity(intent)
        } catch (_: Exception) { }
    }

    @Suppress("UNUSED_PARAMETER")
    fun resolveDefaultLauncherIntent(unused: UserHandle? = null): Intent {
        return Intent("android.settings.HOME_SETTINGS").apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
    }
}
