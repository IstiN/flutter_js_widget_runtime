// angle_1b_android.c — ANGLE 1B shim, Android host (issue #7, F3a).
//
// Android mirror of angle_1b.c (macOS). Same ABI (angle_1b.h) and the same
// shared G1 dispatch (angle_1b_dispatch.c), but the presentation path is
// decision 4 of docs/angle_1b.md: the Flutter texture plugin creates a
// SurfaceTextureProducer surface, hands the ANativeWindow pointer over the
// method channel, and the shim binds an EGL window surface to it on the
// ANGLE platform display. No GL texture-name sharing, no platform view.
//
// Platform facts baked in here:
// - ANGLE is built for Android with angle_libs_suffix="_angle"
//   (tool/three/pins/angle_pin.json), so the staged libraries are
//   libEGL_angle.so / libGLESv2_angle.so — unique sonames that cannot
//   collide with the /system libEGL.so every Android process already has
//   loaded (bionic dlopen dedupes by soname). libEGL_angle resolves its
//   dispatch library by the baked ANGLE_GLESV2_LIBRARY_NAME
//   ("libGLESv2_angle"), searched in its own module directory.
// - The ANGLE display type is Vulkan (angle_enable_vulkan=true, GL/Metal
//   disabled in the Android GN args of the pin).
// - The Kotlin side (example Android app, Angle1bTexturePlugin) loads this
//   library with System.loadLibrary("angle_1b") for the JNI bridge below
//   (ANativeWindow_fromSurface needs a JNIEnv, which Dart FFI has no way
//   to pass); Dart FFI opens the same .so by bare soname from the APK
//   native library directory.
//
// Build: tool/build_angle.sh --platform android-<abi> (F3a block).
#include "angle_1b.h"

#include <dlfcn.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <android/log.h>
#include <android/native_window.h>
#include <android/native_window_jni.h>
#include <jni.h>

// ---- EGL/GLES3 declarations + dynlib entry-point tables --------------------
#include "angle_1b_gl.h"

#ifndef EGL_PLATFORM_ANGLE_TYPE_VULKAN_ANGLE
#define EGL_PLATFORM_ANGLE_TYPE_VULKAN_ANGLE 0x3450
#endif

#define A1B_LOG_TAG "angle_1b"
#define A1B ALOG(__VA_ARGS__)
#define ALOG(...) __android_log_print(ANDROID_LOG_INFO, A1B_LOG_TAG, __VA_ARGS__)

// Single definitions of the shared entry-point pointers and state (the
// header declares them extern so angle_1b_dispatch.c shares these tables).
#define A1B_DEF(rett, name, sym, args) rett(*g_##name) args;
A1B_EGL_LIST(A1B_DEF)
A1B_GL_LIST(A1B_DEF)
#undef A1B_DEF

void *g_egl_lib, *g_gles_lib;
EGLDisplay g_display;
EGLConfig g_config;
static EGLConfig g_config_single = NULL;
static EGLConfig g_config_msaa = NULL;
// Per-context depth/stencil parity: full config matrix indexed
// [msaa][depth][stencil], mirroring Chrome's default-framebuffer allocation
// (same rationale as angle_1b.c phase 7 on macOS).
static EGLConfig g_cfg_ds[2][2][2];
static int g_cfg_ds_ok[2][2][2];
static int g_has_single = 0;
static int g_HasSingleLogged = 0;
EGLContext g_context;
int g_io_ext; // 0 on Android: presentation is the window-surface path
int g_current_valid; // set by a1b_make_current, cleared by destroy/shutdown
int g_finish_flag = 0; // no Metal-IOSurface residency problem on Vulkan
char g_info_vendor[128], g_info_version[128], g_info_renderer[256];
a1b_surface_t g_surfaces[A1B_MAX_SURFACES];

// The ANativeWindow handed over by the plugin (owned: acquired in the JNI
// bridge via ANativeWindow_fromSurface, released in set/shutdown below).
static struct ANativeWindow *g_window = NULL;

// ---- error helpers ---------------------------------------------------------
static int a1b_fail(const char *what) {
  ALOG("error: %s", what);
  return -1;
}

static int a1b_egl_fail(const char *what) {
  ALOG("EGL error 0x%x in %s", g_EGLGetError(), what);
  return a1b_fail(what);
}

// ---- library loading -------------------------------------------------------
// The renamed ANGLE .so files sit next to the shim in the APK native
// library directory (dladdr finds it; that directory is also in the app
// linker-namespace search path).
static int a1b_load_dylibs(void) {
  char dir[1024] = {0};
  Dl_info self;
  if (dladdr((void *)a1b_load_dylibs, &self) && self.dli_fname) {
    const char *slash = strrchr(self.dli_fname, '/');
    if (slash && (size_t)(slash - self.dli_fname) < sizeof(dir))
      memcpy(dir, self.dli_fname, slash - self.dli_fname);
  }
  const char *candidates[3];
  int n = 0;
  const char *env_dir = getenv("JSR_ANGLE_DIR");
  if (env_dir && env_dir[0]) candidates[n++] = env_dir;
  if (dir[0]) candidates[n++] = dir;
  candidates[n++] = ""; // bare sonames (APK lib dir is on the search path)

  for (int i = 0; i < n; i++) {
    char gles[1100], egl[1100];
    snprintf(gles, sizeof(gles), "%s/libGLESv2_angle.so", candidates[i]);
    snprintf(egl, sizeof(egl), "%s/libEGL_angle.so", candidates[i]);
    g_gles_lib = dlopen(gles, RTLD_LOCAL | RTLD_LAZY);
    if (!g_gles_lib) continue;
    g_egl_lib = dlopen(egl, RTLD_LOCAL | RTLD_LAZY);
    if (g_egl_lib) {
      ALOG("loaded ANGLE from %s", candidates[i]);
      return 0;
    }
    dlclose(g_gles_lib);
    g_gles_lib = NULL;
  }
  ALOG("could not dlopen libEGL_angle.so / libGLESv2_angle.so");
  return -1;
}

static int a1b_resolve(void) {
  if (!g_egl_lib) return a1b_fail("ANGLE libraries not loaded");
  const char *syms[320];
  void **ptrs[320];
  int n = 0;
#define A1B_COLLECT(rett, name, sym, args) \
  { syms[n] = #sym; ptrs[n] = (void **)&g_##name; n++; }
  A1B_EGL_LIST(A1B_COLLECT)
  int n_egl = n;
  A1B_GL_LIST(A1B_COLLECT)
#undef A1B_COLLECT
  // Public exported entry points first; eglGetProcAddress only as fallback
  // (same rule as the macOS shim, M1 discovery #3).
  for (int i = 0; i < n; i++) {
    void *p = (i < n_egl) ? dlsym(g_egl_lib, syms[i]) : dlsym(g_gles_lib, syms[i]);
    if (!p && g_GetProcAddress) p = g_GetProcAddress(syms[i]);
    if (!p) {
      ALOG("missing symbol %s", syms[i]);
      return -1;
    }
    *ptrs[i] = p;
  }
  return 0;
}

// ---- EGL init ---------------------------------------------------------------
int a1b_init(void) {
  if (g_display) return 0;
  if (a1b_load_dylibs() != 0 || a1b_resolve() != 0) return -1;

  // Ask for the Vulkan platform display explicitly (the Android GN args of
  // the pin enable only Vulkan), falling back to the default display.
  const char *client_exts = g_QueryString(EGL_NO_DISPLAY, EGL_EXTENSIONS);
  if (client_exts && strstr(client_exts, "EGL_ANGLE_platform_angle")) {
    EGLint vulkan[] = {EGL_PLATFORM_ANGLE_TYPE_ANGLE,
                       EGL_PLATFORM_ANGLE_TYPE_VULKAN_ANGLE, EGL_NONE};
    g_display = g_GetPlatformDisplayEXT(EGL_PLATFORM_ANGLE_ANGLE, 0, vulkan);
  }
  if (!g_display) g_display = g_GetDisplay(EGL_DEFAULT_DISPLAY);
  if (g_display == EGL_NO_DISPLAY) return a1b_egl_fail("eglGetDisplay");

  EGLint major = 0, minor = 0;
  if (g_Initialize(g_display, &major, &minor) != EGL_TRUE)
    return a1b_egl_fail("eglInitialize");
  snprintf(g_info_vendor, sizeof(g_info_vendor), "%s",
           g_QueryString(g_display, EGL_VENDOR));
  snprintf(g_info_version, sizeof(g_info_version), "%s",
           g_QueryString(g_display, EGL_VERSION));

  // Config matrix [msaa][depth][stencil] — identical selection rules to the
  // macOS shim. WINDOW_BIT surfaces are what we create; the pbuffer bit
  // keeps the 1x1 renderer probe below working.
#ifndef EGL_SAMPLE_BUFFERS
#define EGL_SAMPLE_BUFFERS 0x3032
#define EGL_SAMPLES 0x3031
#endif
  for (int mi = 0; mi < 2; mi++) {
    for (int di = 0; di < 2; di++) {
      for (int si = 0; si < 2; si++) {
        EGLint cfg[] = {EGL_SURFACE_TYPE, EGL_PBUFFER_BIT | EGL_WINDOW_BIT,
                        EGL_RENDERABLE_TYPE, EGL_OPENGL_ES3_BIT,
                        EGL_RED_SIZE, 8, EGL_GREEN_SIZE, 8, EGL_BLUE_SIZE, 8,
                        EGL_ALPHA_SIZE, 8,
                        EGL_DEPTH_SIZE, di ? 24 : 0,
                        EGL_STENCIL_SIZE, si ? 8 : 0,
                        EGL_SAMPLE_BUFFERS, mi ? 1 : 0, EGL_SAMPLES, mi ? 4 : 0,
                        EGL_NONE};
        if (mi) {
          int k;
          for (k = 0; cfg[k] != EGL_NONE; k++);
          cfg[k - 4] = EGL_NONE; // drop SAMPLE_BUFFERS/SAMPLES
        }
        EGLint nc = 0;
        EGLConfig chosen = NULL;
        if (g_ChooseConfig(g_display, cfg, &chosen, 1, &nc) != EGL_TRUE || nc < 1) {
          cfg[13] = 0; cfg[15] = 0; // relax DEPTH_SIZE/STENCIL_SIZE, retry
          nc = 0;
          if (g_ChooseConfig(g_display, cfg, &chosen, 1, &nc) != EGL_TRUE || nc < 1)
            chosen = NULL;
        }
        g_cfg_ds[mi][di][si] = chosen;
        g_cfg_ds_ok[mi][di][si] = chosen != NULL;
      }
    }
  }
  g_has_single = g_cfg_ds_ok[0][0][0];
  g_config_single = g_cfg_ds[0][0][0];
  g_config_msaa = g_cfg_ds[1][0][0];
  if (!g_HasSingleLogged && !g_has_single) {
    ALOG("single-sample config unavailable; msaa-only");
    g_HasSingleLogged = 1;
  }
  if (g_config_msaa == NULL) return a1b_egl_fail("eglChooseConfig");
  g_config = g_config_msaa;
  if (g_BindAPI(EGL_OPENGL_ES_API) != EGL_TRUE) return a1b_egl_fail("eglBindAPI");
  EGLint ctx_attrs[] = {EGL_CONTEXT_CLIENT_VERSION, 3, EGL_NONE};
  g_context = g_CreateContext(g_display, g_config, EGL_NO_CONTEXT, ctx_attrs);
  if (g_context == EGL_NO_CONTEXT) return a1b_egl_fail("eglCreateContext");

  // Renderer string via a throwaway 1x1 pbuffer (works without a window).
  EGLint pb_attrs[] = {EGL_WIDTH, 1, EGL_HEIGHT, 1, EGL_NONE};
  EGLSurface probe = g_CreatePbufferSurface(g_display, g_config, pb_attrs);
  if (probe != EGL_NO_SURFACE &&
      g_MakeCurrent(g_display, probe, probe, g_context) == EGL_TRUE) {
    const unsigned char *r = g_GetString(0x1F01 /*GL_RENDERER*/);
    snprintf(g_info_renderer, sizeof(g_info_renderer), "%s",
             r ? (const char *)r : "?");
    g_MakeCurrent(g_display, EGL_NO_SURFACE, EGL_NO_SURFACE, EGL_NO_CONTEXT);
    g_DestroySurface(g_display, probe);
  }
  ALOG("EGL %d.%d %s | %s | window-surface path", major, minor,
       g_info_version, g_info_renderer);
  return 0;
}

const char *a1b_egl_info(int what) {
  static const char *const infos[4] = {g_info_vendor, g_info_version,
                                       g_info_renderer, NULL};
  if (what == 3) return "1"; // window-surface presentation path (always)
  return (what >= 0 && what < 3) ? infos[what] : "";
}

// ---- native window handshake (plugin -> shim) --------------------------------
void a1b_set_native_window(uintptr_t window) {
  if (g_window) ANativeWindow_release(g_window);
  g_window = (struct ANativeWindow *)window;
}

static a1b_surface_t *a1b_find(int64_t id) {
  if (id < 1 || id > A1B_MAX_SURFACES) return NULL;
  return g_surfaces[id - 1].used ? &g_surfaces[id - 1] : NULL;
}

static int64_t a1b_create_surface_cfg(int width, int height, EGLConfig config) {
  if (!g_display) return a1b_fail("not initialized");
  if (width < 1 || height < 1) return a1b_fail("bad size");
  if (!g_window) return a1b_fail("no native window (plugin createSurface first)");

  int slot = -1;
  for (int i = 0; i < A1B_MAX_SURFACES && slot < 0; i++)
    if (!g_surfaces[i].used) slot = i;
  if (slot < 0) return a1b_fail("surface table full");

  a1b_surface_t *s = &g_surfaces[slot];
  memset(s, 0, sizeof(*s));
  s->width = width;
  s->height = height;

  // eglCreateWindowSurface acquires its own reference on the window; the
  // shim's reference (from the JNI bridge) stays alive until destroy.
  s->egl_surface = g_CreateWindowSurface(g_display, config, g_window, NULL);
  if (s->egl_surface == EGL_NO_SURFACE) return a1b_egl_fail("eglCreateWindowSurface");

  s->used = 1;
  // Same config/context parity rule as the macOS shim: off-config surfaces
  // get their own context in g_context's share group.
  if (config != g_config) {
    EGLint ctx_attrs[] = {EGL_CONTEXT_CLIENT_VERSION, 3, EGL_NONE};
    s->ctx = g_CreateContext(g_display, config, g_context, ctx_attrs);
    if (s->ctx == EGL_NO_CONTEXT) {
      g_DestroySurface(g_display, s->egl_surface);
      s->used = 0;
      return a1b_egl_fail("eglCreateContext");
    }
  }
  return slot + 1;
}

int64_t a1b_create_surface_ex(int width, int height, int samples, uint32_t *out_id) {
  EGLConfig config = (samples > 1 || !g_has_single) ? g_config_msaa : g_config_single;
  int64_t id = a1b_create_surface_cfg(width, height, config);
  if (out_id) *out_id = 0; // no IOSurface: the window is the plugin's Surface
  return id;
}

int64_t a1b_create_surface_ex2(int width, int height, int samples, int depth,
                               int stencil, uint32_t *out_id) {
  int mi = (samples > 1 || !g_has_single) ? 1 : 0;
  int di = depth ? 1 : 0, si = stencil ? 1 : 0;
  EGLConfig config =
      g_cfg_ds_ok[mi][di][si] ? g_cfg_ds[mi][di][si]
      : g_cfg_ds_ok[mi][0][0] ? g_cfg_ds[mi][0][0]
                              : g_config_msaa;
  int64_t id = a1b_create_surface_cfg(width, height, config);
  if (out_id) *out_id = 0; // no IOSurface: the window is the plugin's Surface
  return id;
}

int64_t a1b_create_surface(int width, int height, uint32_t *out_iosurface_id) {
  return a1b_create_surface_ex(width, height, 4, out_iosurface_id);
}

int a1b_get_iosurface_extension(int64_t surface) {
  a1b_surface_t *s = a1b_find(surface);
  return s ? 1 : -1; // window-surface path: presentation never falls back
}

int a1b_make_current(int64_t surface) {
  a1b_surface_t *s = a1b_find(surface);
  if (!s) return a1b_fail("unknown surface");
  int ok = g_MakeCurrent(g_display, s->egl_surface, s->egl_surface,
                         s->ctx ? s->ctx : g_context) == EGL_TRUE;
  g_current_valid = ok;
  return ok ? 0 : a1b_egl_fail("eglMakeCurrent");
}

void a1b_set_finish_flag(int on) { g_finish_flag = on ? 1 : 0; }

static void a1b_drain_gl_errors(const char *where) {
  unsigned err, n = 0;
  while ((err = g_GetError()) != 0 && n++ < 16)
    ALOG("%s: drained stale GL error 0x%x", where, err);
}

int a1b_swap_buffers(int64_t surface) {
  a1b_surface_t *s = a1b_find(surface);
  if (!s) return a1b_fail("unknown surface");
  g_Flush();
  if (g_SwapBuffers(g_display, s->egl_surface) != EGL_TRUE)
    return a1b_egl_fail("eglSwapBuffers");
  // glFinish after swap is a Metal-IOSurface residency workaround (macOS
  // M1 discovery #4); the default OFF is correct for Vulkan presentation.
  if (g_finish_flag) g_Finish();
  return 0;
}

int a1b_read_pixels(int64_t surface, uint8_t *dst_rgba, int *width, int *height) {
  a1b_surface_t *s = a1b_find(surface);
  if (!s || !dst_rgba) return a1b_fail("bad args");
  a1b_drain_gl_errors("readPixels");
  size_t n = (size_t)s->width * s->height * 4;
  uint8_t *tmp = malloc(n);
  if (!tmp) return a1b_fail("oom");
  g_ReadPixels(0, 0, s->width, s->height, GL_RGBA, GL_UNSIGNED_BYTE, tmp);
  unsigned err = g_GetError();
  if (err != 0) { // retry BGRA (implementation-defined read color)
    g_ReadPixels(0, 0, s->width, s->height, GL_BGRA_EXT, GL_UNSIGNED_BYTE, tmp);
    err = g_GetError();
    if (err != 0) {
      ALOG("glReadPixels failed: GL error 0x%x (EGL 0x%x)", err, g_EGLGetError());
      free(tmp);
      return a1b_egl_fail("glReadPixels");
    }
    for (size_t i = 0; i < n; i += 4) { // BGRA -> RGBA
      uint8_t b0 = tmp[i], b2 = tmp[i + 2];
      dst_rgba[i] = b2; dst_rgba[i + 1] = tmp[i + 1];
      dst_rgba[i + 2] = b0; dst_rgba[i + 3] = tmp[i + 3];
    }
  } else {
    memcpy(dst_rgba, tmp, n);
  }
  free(tmp);
  if (width) *width = s->width;
  if (height) *height = s->height;
  return 0;
}

// ---- teardown --------------------------------------------------------------------
void a1b_destroy_surface(int64_t surface) {
  a1b_surface_t *s = a1b_find(surface);
  if (!s) return;
  // Same drain-before-destroy lesson as angle_1b.c (Paravirtual Metal CI
  // finalization segfaults): finish the surface's own in-flight work while
  // its context is still bindable.
  if (s->ctx && g_display &&
      g_MakeCurrent(g_display, s->egl_surface, s->egl_surface, s->ctx) == EGL_TRUE) {
    g_Finish();
  }
  g_MakeCurrent(g_display, EGL_NO_SURFACE, EGL_NO_SURFACE, EGL_NO_CONTEXT);
  g_current_valid = 0;
  if (s->ctx) g_DestroyContext(g_display, s->ctx);
  g_DestroySurface(g_display, s->egl_surface);
  memset(s, 0, sizeof(*s));
}

void a1b_shutdown(void) {
  for (int i = 1; i <= A1B_MAX_SURFACES; i++)
    if (g_surfaces[i - 1].used) a1b_destroy_surface(i);
  if (g_window) {
    ANativeWindow_release(g_window);
    g_window = NULL;
  }
  if (!g_display) return;
  if (g_context &&
      g_MakeCurrent(g_display, EGL_NO_SURFACE, EGL_NO_SURFACE, g_context) == EGL_TRUE) {
    g_Finish();
    g_MakeCurrent(g_display, EGL_NO_SURFACE, EGL_NO_SURFACE, EGL_NO_CONTEXT);
  }
  g_MakeCurrent(g_display, EGL_NO_SURFACE, EGL_NO_SURFACE, EGL_NO_CONTEXT);
  g_current_valid = 0;
  if (g_context) g_DestroyContext(g_display, g_context);
  g_context = EGL_NO_CONTEXT;
  g_Terminate(g_display);
  // See angle_1b.c: drain the client API after terminate; never dlclose
  // beneath possibly-outstanding completion handlers — the OS unloads at
  // process exit.
  g_WaitClient();
  g_display = EGL_NO_DISPLAY;
  g_egl_lib = g_gles_lib = NULL;
}

// ---- JNI bridge (consumed by the Kotlin plugin, not by Dart FFI) ---------------
// The plugin holds the android.view.Surface of the SurfaceTextureProducer it
// just created; only JNI code can turn it into the ANativeWindow pointer the
// EGL window surface needs (ANativeWindow_fromSurface takes a JNIEnv). The
// returned pointer is owned by the shim (a1b_set_native_window releases it).

JNIEXPORT jlong JNICALL
Java_dev_fa1_angle1b_Angle1bJni_nativeWindowFromSurface(JNIEnv *env, jobject thiz,
                                                        jobject surface) {
  (void)thiz;
  if (!surface) return 0;
  struct ANativeWindow *window = ANativeWindow_fromSurface(env, surface);
  return (jlong)(intptr_t)window;
}
