package com.pocketwisdom

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import android.text.TextUtils
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.pocketwisdom.specs.NativeShareCardSpec
import java.io.File
import java.io.FileOutputStream

/**
 * 把一问一答画成一张分享图片：顶部应用图标和名字，中间问题（灰底圆角）与回答，
 * 底部一句介绍和下载地址。直接用 Canvas 画，不依赖屏幕上的视图，
 * 所以长回复也能完整出图（超长时截断并加省略号）。
 */
@ReactModule(name = NativeShareCardSpec.NAME)
class ShareCardModule(reactContext: ReactApplicationContext) :
    NativeShareCardSpec(reactContext) {

  override fun render(
      brand: String,
      question: String,
      answer: String,
      tagline: String,
      link: String,
      dark: Boolean,
      promise: Promise
  ) {
    Thread {
      try {
        promise.resolve("file://" + draw(brand, question, answer, tagline, link, dark))
      } catch (e: Throwable) {
        promise.reject("share_card_failed", e.message, e)
      }
    }.start()
  }

  private fun textPaint(size: Float, color: Int, bold: Boolean = false) =
      TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
        textSize = size
        this.color = color
        typeface = if (bold) Typeface.DEFAULT_BOLD else Typeface.DEFAULT
      }

  private fun layout(text: String, paint: TextPaint, width: Int, maxLines: Int, spacing: Float) =
      StaticLayout.Builder.obtain(text, 0, text.length, paint, width)
          .setAlignment(Layout.Alignment.ALIGN_NORMAL)
          .setLineSpacing(0f, spacing)
          .setIncludePad(false)
          .setMaxLines(maxLines)
          .setEllipsize(TextUtils.TruncateAt.END)
          .build()

  private fun draw(
      brand: String,
      question: String,
      answer: String,
      tagline: String,
      link: String,
      dark: Boolean
  ): String {
    val bg = if (dark) Color.parseColor("#0A0A0A") else Color.WHITE
    val fg = if (dark) Color.parseColor("#EDEDED") else Color.parseColor("#111111")
    val muted = if (dark) Color.parseColor("#A1A1A1") else Color.parseColor("#666666")
    val soft = if (dark) Color.parseColor("#1F1F1F") else Color.parseColor("#F2F2F2")
    val line = if (dark) Color.parseColor("#2E2E2E") else Color.parseColor("#EAEAEA")

    val inner = WIDTH - PAD * 2
    val bubblePad = 36
    val iconSize = 96

    val brandPaint = textPaint(46f, fg, bold = true)
    val questionLayout =
        if (question.isBlank()) null
        else layout(question.trim(), textPaint(40f, fg), inner - bubblePad * 2, 6, 1.4f)
    val answerLayout = layout(answer.trim(), textPaint(44f, fg), inner, MAX_ANSWER_LINES, 1.5f)
    val taglineLayout = layout(tagline, textPaint(32f, muted), inner, 2, 1.3f)
    val linkLayout = layout(link, textPaint(30f, muted), inner, 1, 1.3f)

    var height = PAD + iconSize + 56
    if (questionLayout != null) height += questionLayout.height + bubblePad * 2 + 48
    height += answerLayout.height + 64 + 2 + 40
    height += taglineLayout.height + 8 + linkLayout.height + PAD

    val bitmap = Bitmap.createBitmap(WIDTH, height, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    canvas.drawColor(bg)

    var y = PAD.toFloat()

    // 应用图标 + 名字
    try {
      val icon = reactApplicationContext.packageManager
          .getApplicationIcon(reactApplicationContext.packageName)
      icon.setBounds(PAD, y.toInt(), PAD + iconSize, y.toInt() + iconSize)
      icon.draw(canvas)
    } catch (_: Throwable) {}
    val fm = brandPaint.fontMetrics
    canvas.drawText(
        brand, (PAD + iconSize + 28).toFloat(), y + iconSize / 2f - (fm.ascent + fm.descent) / 2f,
        brandPaint)
    y += iconSize + 56

    // 问题：灰底圆角块
    if (questionLayout != null) {
      val rect = RectF(
          PAD.toFloat(), y, (WIDTH - PAD).toFloat(), y + questionLayout.height + bubblePad * 2)
      canvas.drawRoundRect(rect, 32f, 32f, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = soft })
      canvas.save()
      canvas.translate((PAD + bubblePad).toFloat(), y + bubblePad)
      questionLayout.draw(canvas)
      canvas.restore()
      y = rect.bottom + 48
    }

    // 回答
    canvas.save()
    canvas.translate(PAD.toFloat(), y)
    answerLayout.draw(canvas)
    canvas.restore()
    y += answerLayout.height + 64

    // 分隔线 + 介绍 + 地址
    canvas.drawRect(
        PAD.toFloat(), y, (WIDTH - PAD).toFloat(), y + 2, Paint().apply { color = line })
    y += 2 + 40
    canvas.save()
    canvas.translate(PAD.toFloat(), y)
    taglineLayout.draw(canvas)
    canvas.translate(0f, (taglineLayout.height + 8).toFloat())
    linkLayout.draw(canvas)
    canvas.restore()

    val dir = File(reactApplicationContext.cacheDir, "share_cards").apply { mkdirs() }
    dir.listFiles()?.forEach { it.delete() }
    val file = File(dir, "koudai-ai-${System.currentTimeMillis()}.png")
    FileOutputStream(file).use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
    bitmap.recycle()
    return file.absolutePath
  }

  companion object {
    private const val WIDTH = 1080
    private const val PAD = 72
    private const val MAX_ANSWER_LINES = 60
  }
}
