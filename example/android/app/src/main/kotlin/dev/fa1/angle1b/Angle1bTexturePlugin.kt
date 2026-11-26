package dev.fa1.angle1b

import android.os.Build
import android.view.Surface
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import io.flutter.view.TextureRegistry

/**
 * Angle1bTexturePlugin — ANGLE 1B texture bridge, Android host (issue #7, F3a).
 *
 * Android mirror of example/macos/Runner/Angle1bTexturePlugin.swift with the
 * decision-4 handshake of docs/angle_1b.md: createSurface(width, height)
 * creates a TextureRegistry.SurfaceTextureProducer surface (SurfaceProducer),
 * converts its android.view.Surface into the ANativeWindow pointer through
 * the JNI bridge in libangle_1b.so and returns {textureId, nativeWindow}; the
 * Dart host (jsr_three_angle) then binds the shim's EGL window surface to
 * that window on the ANGLE platform display. frameAvailable schedules the
 * Texture frame after every shim swap. No GL texture-name sharing, no
 * platform view.
 */
class Angle1bTexturePlugin : FlutterPlugin, MethodChannel.MethodCallHandler {
  private var registry: TextureRegistry? = null
  private var channel: MethodChannel? = null
  private val producers = HashMap<Long, TextureRegistry.SurfaceProducer>()

  override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    registry = binding.textureRegistry
    channel = MethodChannel(binding.binaryMessenger, CHANNEL).also {
      it.setMethodCallHandler(this)
    }
  }

  override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    channel?.setMethodCallHandler(null)
    channel = null
    registry = null
    producers.clear()
  }

  override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
    when (call.method) {
      // Probe (d) input of ADR-0003: the 1B selection requires API >= 28.
      "apiLevel" -> result.success(Build.VERSION.SDK_INT)
      "createSurface" -> createSurface(call.arguments, result)
      "destroySurface" -> destroySurface(call.arguments, result)
      "frameAvailable" -> frameAvailable(call.arguments, result)
      else -> result.notImplemented()
    }
  }

  // args: [width, height]. Opposite order from macOS: the window does not
  // exist yet, so the producer is created HERE and the window pointer is
  // returned to Dart before the shim can create its EGL surface.
  private fun createSurface(args: Any?, result: MethodChannel.Result) {
    val reg = registry
    if (reg == null) {
      result.error("NO_REGISTRY", "plugin detached", null)
      return
    }
    val list = args as? List<*>
    val width = (list?.getOrNull(0) as? Number)?.toInt()
    val height = (list?.getOrNull(1) as? Number)?.toInt()
    if (width == null || width <= 0 || height == null || height <= 0) {
      result.error("BAD_ARGS", "expected [width, height]", null)
      return
    }
    val producer = reg.createSurfaceProducer()
    producer.setSize(width, height)
    val window = Angle1bJni.nativeWindowFromSurface(producer.surface)
    if (window == 0L) {
      producer.release()
      result.error("NATIVE_WINDOW", "ANativeWindow_fromSurface failed", null)
      return
    }
    producers[producer.id()] = producer
    result.success(mapOf("textureId" to producer.id(), "nativeWindow" to window))
  }

  private fun textureId(args: Any?): Long? {
    val first = (args as? List<*>)?.firstOrNull()
    return (first as? Number)?.toLong()
  }

  // Dart destroys the shim surface first (its own ANativeWindow reference is
  // released there); releasing the producer here drops the framework side.
  private fun destroySurface(args: Any?, result: MethodChannel.Result) {
    val id = textureId(args)
    if (id == null) {
      result.error("BAD_ARGS", "expected [textureId]", null)
      return
    }
    producers.remove(id)?.release()
    result.success(null)
  }

  private fun frameAvailable(args: Any?, result: MethodChannel.Result) {
    val id = textureId(args)
    if (id == null) {
      result.error("BAD_ARGS", "expected [textureId]", null)
      return
    }
    producers[id]?.scheduleFrame()
    result.success(null)
  }

  private companion object {
    const val CHANNEL = "angle_1b"
  }
}

/** JNI bridge into libangle_1b.so (angle_1b_android.c): only JNI code can
 * turn a Surface into the ANativeWindow pointer (ANativeWindow_fromSurface
 * needs a JNIEnv, which Dart FFI has no way to pass). The returned pointer
 * is owned by the shim. */
object Angle1bJni {
  init {
    System.loadLibrary("angle_1b")
  }

  external fun nativeWindowFromSurface(surface: Surface): Long
}
