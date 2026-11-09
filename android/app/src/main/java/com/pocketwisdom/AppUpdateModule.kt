package com.pocketwisdom

import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.pocketwisdom.specs.NativeAppUpdateSpec
import java.security.MessageDigest

/**
 * 应用内更新：DownloadManager 下载 APK（通知栏显示进度），
 * 校验 SHA-256 后用系统安装器覆盖安装。
 */
@ReactModule(name = NativeAppUpdateSpec.NAME)
class AppUpdateModule(reactContext: ReactApplicationContext) :
    NativeAppUpdateSpec(reactContext) {

  private val dm: DownloadManager
    get() = reactApplicationContext.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager

  override fun download(url: String, fileName: String, title: String, promise: Promise) {
    try {
      // 清掉同名旧包，避免 DownloadManager 自动改名
      reactApplicationContext.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
          ?.resolve(fileName)?.delete()
      val request = DownloadManager.Request(Uri.parse(url))
          .setTitle(title)
          .setMimeType("application/vnd.android.package-archive")
          .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
          .setDestinationInExternalFilesDir(
              reactApplicationContext, Environment.DIRECTORY_DOWNLOADS, fileName)
      promise.resolve(dm.enqueue(request).toString())
    } catch (e: Exception) {
      promise.reject("download_failed", e.message, e)
    }
  }

  override fun getProgress(id: String, promise: Promise) {
    try {
      dm.query(DownloadManager.Query().setFilterById(id.toLong())).use { c ->
        val map = Arguments.createMap()
        if (!c.moveToFirst()) {
          map.putString("status", "failed")
          map.putDouble("downloaded", 0.0)
          map.putDouble("total", 0.0)
        } else {
          val status = c.getInt(c.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))
          map.putString("status", when (status) {
            DownloadManager.STATUS_PENDING -> "pending"
            DownloadManager.STATUS_RUNNING -> "running"
            DownloadManager.STATUS_PAUSED -> "paused"
            DownloadManager.STATUS_SUCCESSFUL -> "successful"
            else -> "failed"
          })
          map.putDouble("downloaded",
              c.getLong(c.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR)).toDouble())
          map.putDouble("total",
              c.getLong(c.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES)).toDouble())
        }
        promise.resolve(map)
      }
    } catch (e: Exception) {
      promise.reject("progress_failed", e.message, e)
    }
  }

  override fun verify(id: String, sha256: String, promise: Promise) {
    if (sha256.isEmpty()) {
      promise.resolve(true)
      return
    }
    Thread {
      try {
        val uri = dm.getUriForDownloadedFile(id.toLong())
        if (uri == null) {
          promise.resolve(false)
          return@Thread
        }
        val digest = MessageDigest.getInstance("SHA-256")
        reactApplicationContext.contentResolver.openInputStream(uri)?.use { input ->
          val buf = ByteArray(1 shl 16)
          while (true) {
            val n = input.read(buf)
            if (n < 0) break
            digest.update(buf, 0, n)
          }
        }
        val hex = digest.digest().joinToString("") { "%02x".format(it) }
        promise.resolve(hex.equals(sha256.trim(), ignoreCase = true))
      } catch (e: Exception) {
        promise.reject("verify_failed", e.message, e)
      }
    }.start()
  }

  override fun canInstall(promise: Promise) {
    promise.resolve(
        Build.VERSION.SDK_INT < Build.VERSION_CODES.O ||
            reactApplicationContext.packageManager.canRequestPackageInstalls())
  }

  override fun openInstallSettings() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val intent = Intent(
        Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
        Uri.parse("package:" + reactApplicationContext.packageName))
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    reactApplicationContext.startActivity(intent)
  }

  override fun install(id: String, promise: Promise) {
    try {
      val uri = dm.getUriForDownloadedFile(id.toLong())
      if (uri == null) {
        promise.reject("not_downloaded", "download not found")
        return
      }
      val intent = Intent(Intent.ACTION_VIEW)
          .setDataAndType(uri, "application/vnd.android.package-archive")
          .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
      reactApplicationContext.startActivity(intent)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("install_failed", e.message, e)
    }
  }
}
