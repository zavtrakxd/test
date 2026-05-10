package com.zavtrak.devinos

import android.app.Application
import com.zavtrak.devinos.data.AppRepository
import com.zavtrak.devinos.data.SettingsRepository

class DevinOSApplication : Application() {

    lateinit var appRepository: AppRepository
        private set

    lateinit var settingsRepository: SettingsRepository
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this
        appRepository = AppRepository(this)
        settingsRepository = SettingsRepository(this)
    }

    companion object {
        @Volatile
        lateinit var instance: DevinOSApplication
            private set
    }
}
