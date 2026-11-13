package com.pocketwisdom

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.pocketwisdom.specs.NativeAppUpdateSpec
import com.pocketwisdom.specs.NativeShareCardSpec

class AppUpdatePackage : TurboReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return when (name) {
      NativeAppUpdateSpec.NAME -> AppUpdateModule(reactContext)
      NativeShareCardSpec.NAME -> ShareCardModule(reactContext)
      else -> null
    }
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      listOf(NativeAppUpdateSpec.NAME, NativeShareCardSpec.NAME).associateWith { name ->
        ReactModuleInfo(
          name,
          name,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          false, // hasConstants
          false, // isCxxModule
          true   // isTurboModule
        )
      }
    }
  }
}

