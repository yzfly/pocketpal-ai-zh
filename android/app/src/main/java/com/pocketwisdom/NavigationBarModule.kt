package com.pocketwisdom

import android.os.Build
import android.view.View
import android.view.WindowInsetsController
import androidx.core.view.WindowInsetsControllerCompat
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.module.annotations.ReactModule
import com.pocketwisdom.specs.NativeNavigationBarSpec

@ReactModule(name = NativeNavigationBarSpec.NAME)
class NavigationBarModule(reactContext: ReactApplicationContext) :
    NativeNavigationBarSpec(reactContext), LifecycleEventListener {

  private var lastIsDark: Boolean? = null

  init {
    reactContext.addLifecycleEventListener(this)
  }

  override fun setNavigationBarDark(isDark: Boolean) {
    UiThreadUtil.runOnUiThread {
      lastIsDark = isDark
      applyToCurrentActivity()
    }
  }

  override fun onHostResume() {
    applyToCurrentActivity()
  }

  override fun onHostPause() {}

  override fun onHostDestroy() {}

  override fun invalidate() {
    super.invalidate()
    reactApplicationContext.removeLifecycleEventListener(this)
  }

  private fun applyToCurrentActivity() {
    val isDark = lastIsDark ?: return
    val window = reactApplicationContext.currentActivity?.window ?: return
    val controller = WindowInsetsControllerCompat(window, window.decorView)
    controller.isAppearanceLightNavigationBars = !isDark
    // 口袋AI：状态栏文字颜色跟随主题。RN 的 StatusBar 在 Android 12+ 只改
    // WindowInsetsController 的外观，enableEdgeToEdge 在浅色系统下留下的旧
    // SYSTEM_UI_FLAG_LIGHT_STATUS_BAR 不会被清掉，MIUI 等系统按旧标志显示，
    // 导致深色主题下状态栏仍是黑字。这里两套标志一起设。
    // 先写旧标志，再设新外观（反过来时新外观会被旧标志的重算覆盖）。
    @Suppress("DEPRECATION")
    val flags = window.decorView.systemUiVisibility
    @Suppress("DEPRECATION")
    window.decorView.systemUiVisibility =
        if (isDark) flags and View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR.inv()
        else flags or View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      window.insetsController?.setSystemBarsAppearance(
          if (isDark) 0 else WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS,
          WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS,
      )
    } else {
      controller.isAppearanceLightStatusBars = !isDark
    }
  }
}
