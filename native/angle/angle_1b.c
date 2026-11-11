// angle_1b.c — ANGLE 1B spike shim (M1). Loads ANGLE's libEGL/libGLESv2 with
// dlopen (no link-time dependency) and mirrors the flutter_angle (Knightro63,
// MIT) macOS interop recipe: IOSurface -> eglCreatePbufferFromClientBuffer
// (EGL_IOSURFACE_ANGLE) on the Metal backend, wrapped by a CVPixelBuffer
// feeding a FlutterTexture. Fallback without EGL_ANGLE_iosurface_client_buffer:
// plain pbuffer + glReadPixels CPU copy into the IOSurface (loud warning).
// Build: native/angle/build.sh. ABI: angle_1b.h.
#include "angle_1b.h"

#include <dlfcn.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <CoreFoundation/CoreFoundation.h>
#include <IOSurface/IOSurface.h>

// ---- EGL/GLES3 declarations + dynlib entry-point tables --------------------
#include "angle_1b_gl.h"

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
// Per-context depth/stencil parity (phase 7): full config matrix indexed
// [msaa][depth][stencil], mirroring Chrome's default-framebuffer allocation
// driven by the canvas getContext attributes (depth:true -> 24-bit,
// stencil:true -> 8-bit). Fallback chain: exact cell -> same MSAA cell with
// depth/stencil 0 -> legacy unpinned msaa config.
static EGLConfig g_cfg_ds[2][2][2];
static int g_cfg_ds_ok[2][2][2];
static int g_has_single = 0;
static int g_HasSingleLogged = 0;
EGLContext g_context;
int g_io_ext; // EGL_ANGLE_iosurface_client_buffer available
int g_current_valid; // set by a1b_make_current, cleared by destroy/shutdown
int g_finish_flag = 1; // post-swap glFinish (M1 discovery #4), default ON
char g_info_vendor[128], g_info_version[128], g_info_renderer[256];
a1b_surface_t g_surfaces[A1B_MAX_SURFACES];

#include "angle_1b_pack.h"

// ---- error helpers ---------------------------------------------------------
static int a1b_fail(const char *what) {
  fprintf(stderr, "[angle_1b] error: %s\n", what);
  return -1;
}

static int a1b_egl_fail(const char *what) {
  fprintf(stderr, "[angle_1b] EGL error 0x%x in %s\n", g_EGLGetError(), what);
  return a1b_fail(what);
}

// ---- dylib loading ---------------------------------------------------------
// ANGLE dylibs: the shim's own directory first (dladdr), then well-known
// relative/absolute fallbacks.
static int a1b_load_dylibs(void) {
  char dir[1024] = {0};
  Dl_info self;
  if (dladdr((void *)a1b_load_dylibs, &self) && self.dli_fname) {
    const char *slash = strrchr(self.dli_fname, '/');
    if (slash && (size_t)(slash - self.dli_fname) < sizeof(dir))
      memcpy(dir, self.dli_fname, slash - self.dli_fname);
  }
  const char *candidates[8];
  int n = 0;
  if (dir[0]) candidates[n++] = dir; // same dir as libangle_1b.dylib
  candidates[n++] = "native/angle"; // repo-root CWD
  candidates[n++] = "../native/angle"; // example/ CWD
  candidates[n++] = "/Users/Uladzimir_Klyshevich/git/flutter_js_widget_runtime/native/angle";

  for (int i = 0; i < n; i++) {
    char gles[1300], egl[1300];
    snprintf(gles, sizeof(gles), "%s/libGLESv2.dylib", candidates[i]);
    snprintf(egl, sizeof(egl), "%s/libEGL.dylib", candidates[i]);
    g_gles_lib = dlopen(gles, RTLD_LOCAL | RTLD_LAZY);
    if (!g_gles_lib) continue;
    g_egl_lib = dlopen(egl, RTLD_LOCAL | RTLD_LAZY);
    if (g_egl_lib) {
      fprintf(stderr, "[angle_1b] loaded ANGLE from %s\n", candidates[i]);
      return 0;
    }
    dlclose(g_gles_lib);
    g_gles_lib = NULL;
  }
  fprintf(stderr, "[angle_1b] could not dlopen ANGLE dylibs\n");
  return -1;
}

static int a1b_resolve(void) {
  if (!g_egl_lib) return a1b_fail("ANGLE dylibs not loaded");
  const char *syms[320];
  void **ptrs[320];
  int n = 0;
#define A1B_COLLECT(rett, name, sym, args) { syms[n] = #sym; ptrs[n] = (void **)&g_##name; n++; }
  A1B_EGL_LIST(A1B_COLLECT)
  int n_egl = n;
  A1B_GL_LIST(A1B_COLLECT)
#undef A1B_COLLECT
  // Prefer the exported entry points; eglGetProcAddress only as a fallback
  // (this build returns internal GL_* stubs for some names — e.g. its
  // glPixelStorei raises GL_INVALID_ENUM).
  for (int i = 0; i < n; i++) {
    void *p = (i < n_egl) ? dlsym(g_egl_lib, syms[i]) : dlsym(g_gles_lib, syms[i]);
    if (!p && g_GetProcAddress) p = g_GetProcAddress(syms[i]);
    if (!p) {
      fprintf(stderr, "[angle_1b] missing symbol %s\n", syms[i]);
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

  // The DEFAULT platform type on this ANGLE build selects the legacy
  // OpenGL/CGL backend (single config, no IOSurface client buffers) — ask
  // for Metal explicitly and only fall back to DEFAULT / eglGetDisplay.
  const char *client_exts = g_QueryString(EGL_NO_DISPLAY, EGL_EXTENSIONS);
  if (client_exts && strstr(client_exts, "EGL_ANGLE_platform_angle")) {
    EGLint metal[] = {EGL_PLATFORM_ANGLE_TYPE_ANGLE,
                      EGL_PLATFORM_ANGLE_TYPE_METAL_ANGLE, EGL_NONE};
    g_display = g_GetPlatformDisplayEXT(EGL_PLATFORM_ANGLE_ANGLE, 0, metal);
  }
  if (!g_display) g_display = g_GetDisplay(EGL_DEFAULT_DISPLAY);
  if (g_display == EGL_NO_DISPLAY) return a1b_egl_fail("eglGetDisplay");

  EGLint major = 0, minor = 0;
  if (g_Initialize(g_display, &major, &minor) != EGL_TRUE)
    return a1b_egl_fail("eglInitialize");

  const char *vendor = g_QueryString(g_display, EGL_VENDOR);
  const char *version = g_QueryString(g_display, EGL_VERSION);
  snprintf(g_info_vendor, sizeof(g_info_vendor), "%s", vendor ? vendor : "?");
  snprintf(g_info_version, sizeof(g_info_version), "%s", version ? version : "?");

  const char *exts = g_QueryString(g_display, EGL_EXTENSIONS);
  g_io_ext = exts && strstr(exts, "EGL_ANGLE_iosurface_client_buffer");
  if (!g_io_ext)
    fprintf(stderr, "[angle_1b] WARNING: EGL_ANGLE_iosurface_client_buffer "
                    "missing; using readback fallback\n");

  // BIND_TO_TEXTURE_RGBA is required by this ANGLE version's IOSurface
  // texture-target validation (configs without it are rejected).
  #ifndef EGL_SAMPLE_BUFFERS
#define EGL_SAMPLE_BUFFERS 0x3032
#define EGL_SAMPLES 0x3031
#endif
  // Two config axes: Chrome's default WebGL framebuffer is single-sampled
  // unless antialias:true, and ANGLE Metal otherwise hands out a 4x MSAA
  // config whose resolve shifts rasterization (line examples diverge
  // pixel-wise). Phase 7 adds the depth/stencil axis: three.js defaults to
  // depth:true, so Chrome allocates a 24-bit depth buffer while the legacy
  // EGL config here had DEPTH_SIZE 0 (translucent geometry resolved by draw
  // order instead of depth test). Config matrix [msaa][depth][stencil]:
  // g_cfg_ds[0][0][0] == g_config_single, g_cfg_ds[1][0][0] == g_config_msaa.
  for (int mi = 0; mi < 2; mi++) {
    for (int di = 0; di < 2; di++) {
      for (int si = 0; si < 2; si++) {
        EGLint cfg[] = {EGL_SURFACE_TYPE, EGL_PBUFFER_BIT | EGL_WINDOW_BIT,
                        EGL_RENDERABLE_TYPE, EGL_OPENGL_ES3_BIT,
                        EGL_RED_SIZE, 8, EGL_GREEN_SIZE, 8, EGL_BLUE_SIZE, 8,
                        EGL_ALPHA_SIZE, 8, EGL_BIND_TO_TEXTURE_RGBA, EGL_TRUE,
                        EGL_DEPTH_SIZE, di ? 24 : 0,
                        EGL_STENCIL_SIZE, si ? 8 : 0,
                        EGL_SAMPLE_BUFFERS, mi ? 1 : 0, EGL_SAMPLES, mi ? 4 : 0,
                        EGL_NONE};
        // Phase 6 proved the unpinned pick yields the same 4x MSAA as Chrome
        // for antialias:true; drop the sample pins for the msaa axis.
        if (mi) {
          int k;
          for (k = 0; cfg[k] != EGL_NONE; k++);
          // remove the last two pairs (SAMPLE_BUFFERS/SAMPLES)
          cfg[k - 4] = EGL_NONE;
        }
        EGLint nc = 0;
        EGLConfig chosen = NULL;
        if (g_ChooseConfig(g_display, cfg, &chosen, 1, &nc) != EGL_TRUE || nc < 1) {
          // Relax depth/stencil and retry before giving up on the cell
          // (indices: DEPTH_SIZE value 15, STENCIL_SIZE value 17).
          cfg[15] = 0; cfg[17] = 0;
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
    fprintf(stderr, "[angle_1b] single-sample config unavailable; msaa-only\n");
    g_HasSingleLogged = 1;
  }
  if (g_config_msaa == NULL) return a1b_egl_fail("eglChooseConfig");
  g_config = g_config_msaa; // legacy default for a1b_create_surface()
  if (g_BindAPI(EGL_OPENGL_ES_API) != EGL_TRUE) return a1b_egl_fail("eglBindAPI");
  EGLint ctx_attrs[] = {EGL_CONTEXT_CLIENT_VERSION, 3, EGL_NONE};
  g_context = g_CreateContext(g_display, g_config, EGL_NO_CONTEXT, ctx_attrs);
  if (g_context == EGL_NO_CONTEXT) return a1b_egl_fail("eglCreateContext");

  // Renderer string: bind a throwaway 1x1 pbuffer and ask GL directly.
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
  fprintf(stderr, "[angle_1b] EGL %d.%d %s | %s | iosurface_client_buffer=%d\n",
          major, minor, g_info_version, g_info_renderer, g_io_ext);
  return 0;
}

const char *a1b_egl_info(int what) {
  static const char *const infos[4] = {g_info_vendor, g_info_version,
                                       g_info_renderer, NULL};
  if (what == 3) return g_io_ext ? "1" : "0";
  return (what >= 0 && what < 3) ? infos[what] : "";
}

// ---- surfaces ----------------------------------------------------------------
static a1b_surface_t *a1b_find(int64_t id) {
  if (id < 1 || id > A1B_MAX_SURFACES) return NULL;
  return g_surfaces[id - 1].used ? &g_surfaces[id - 1] : NULL;
}

static IOSurfaceRef a1b_create_iosurface(int width, int height) {
  size_t bpr = (size_t)IOSurfaceAlignProperty(kIOSurfaceBytesPerRow, width * 4);
  size_t alloc = (size_t)IOSurfaceAlignProperty(kIOSurfaceAllocSize, bpr * height);
  int32_t fmt = (int32_t)'BGRA';
  const void *keys[] = {kIOSurfaceWidth, kIOSurfaceHeight, kIOSurfacePixelFormat,
                        kIOSurfaceBytesPerElement, kIOSurfaceBytesPerRow,
                        kIOSurfaceAllocSize};
  long nums[6] = {width, height, fmt, 4, (long)bpr, (long)alloc};
  const void *vals[6];
  for (int i = 0; i < 6; i++)
    vals[i] = CFNumberCreate(kCFAllocatorDefault, kCFNumberLongType, &nums[i]);
  CFDictionaryRef props = CFDictionaryCreate(
      kCFAllocatorDefault, keys, vals, 6, &kCFTypeDictionaryKeyCallBacks,
      &kCFTypeDictionaryValueCallBacks);
  for (int i = 0; i < 6; i++) CFRelease(vals[i]);
  IOSurfaceRef io = props ? IOSurfaceCreate(props) : NULL;
  if (props) CFRelease(props);
  return io;
}

static int64_t a1b_create_surface_cfg(int width, int height, EGLConfig config, uint32_t *out_iosurface_id);

int64_t a1b_create_surface_ex(int width, int height, int samples, uint32_t *out_iosurface_id) {
  EGLConfig config = (samples > 1 || !g_has_single) ? g_config_msaa : g_config_single;
  return a1b_create_surface_cfg(width, height, config, out_iosurface_id);
}

int64_t a1b_create_surface_ex2(int width, int height, int samples, int depth,
                               int stencil, uint32_t *out_iosurface_id) {
  int mi = (samples > 1 || !g_has_single) ? 1 : 0;
  int di = depth ? 1 : 0, si = stencil ? 1 : 0;
  EGLConfig config =
      g_cfg_ds_ok[mi][di][si] ? g_cfg_ds[mi][di][si]
      : g_cfg_ds_ok[mi][0][0] ? g_cfg_ds[mi][0][0]
                              : g_config_msaa;
  return a1b_create_surface_cfg(width, height, config, out_iosurface_id);
}

static int64_t a1b_create_surface_cfg(int width, int height, EGLConfig config, uint32_t *out_iosurface_id) {
  if (!g_display) return a1b_fail("not initialized");
  if (width < 1 || height < 1) return a1b_fail("bad size");

  int slot = -1;
  for (int i = 0; i < A1B_MAX_SURFACES && slot < 0; i++)
    if (!g_surfaces[i].used) slot = i;
  if (slot < 0) return a1b_fail("surface table full");

  IOSurfaceRef io = a1b_create_iosurface(width, height);
  if (!io) return a1b_fail("IOSurfaceCreate failed");

  a1b_surface_t *s = &g_surfaces[slot];
  memset(s, 0, sizeof(*s));
  s->width = width;
  s->height = height;
  s->io = io;

  if (g_io_ext) {
    // This ANGLE fork requires EGL_TEXTURE_FORMAT=EGL_TEXTURE_RGBA plus a
    // matching EGL_TEXTURE_TARGET on top of the classic plane/format attribs.
    EGLint attribs[] = {EGL_WIDTH, width, EGL_HEIGHT, height,
                        EGL_TEXTURE_FORMAT, EGL_TEXTURE_RGBA, EGL_TEXTURE_TARGET, EGL_TEXTURE_2D,
                        EGL_TEXTURE_INTERNAL_FORMAT_ANGLE, GL_BGRA_EXT, EGL_TEXTURE_TYPE_ANGLE,
                        GL_UNSIGNED_BYTE, EGL_IOSURFACE_PLANE_ANGLE, 0, EGL_NONE};
    s->egl_surface = g_CreatePbufferFromClientBuffer(
        g_display, EGL_IOSURFACE_ANGLE, (EGLClientBuffer)io, config, attribs);
    if (s->egl_surface != EGL_NO_SURFACE) {
      s->fallback = 0;
    } else {
      fprintf(stderr, "[angle_1b] iosurface surface failed (0x%x), trying "
                      "readback fallback\n", g_EGLGetError());
      g_io_ext = 0; // stop advertising a path that just failed
    }
  }
  if (s->egl_surface == EGL_NO_SURFACE) { // pbuffer fallback
    EGLint attribs[] = {EGL_WIDTH, width, EGL_HEIGHT, height, EGL_NONE};
    s->egl_surface = g_CreatePbufferSurface(g_display, config, attribs);
    if (s->egl_surface == EGL_NO_SURFACE) {
      CFRelease(io);
      return a1b_egl_fail("eglCreatePbufferSurface");
    }
    s->fallback = 1;
    fprintf(stderr, "[angle_1b] WARNING: readback fallback active (slow path)\n");
  }

  s->used = 1;
  // A surface's EGL config may differ from the legacy g_config (per-context
  // depth/stencil parity, phase 7) and ANGLE rejects MakeCurrent across
  // mismatched configs (EGL_BAD_MATCH). Surfaces whose config IS the legacy
  // config keep using g_context unchanged (the smoke demo caches GL objects
  // across surfaces); only off-config surfaces get their own context, in
  // g_context's share group so object namespaces stay compatible. A corpus
  // scene run only ever uses one surface/context.
  if (config != g_config) {
    EGLint ctx_attrs[] = {EGL_CONTEXT_CLIENT_VERSION, 3, EGL_NONE};
    s->ctx = g_CreateContext(g_display, config, g_context, ctx_attrs);
    if (s->ctx == EGL_NO_CONTEXT) {
      CFRelease(io);
      s->used = 0;
      return a1b_egl_fail("eglCreateContext");
    }
  }
  if (out_iosurface_id) *out_iosurface_id = IOSurfaceGetID(io);
  return slot + 1;
}

int64_t a1b_create_surface(int width, int height, uint32_t *out_iosurface_id) {
  return a1b_create_surface_ex(width, height, 4, out_iosurface_id);
}

int a1b_get_iosurface_extension(int64_t surface) {
  a1b_surface_t *s = a1b_find(surface);
  return s ? (s->fallback ? 0 : 1) : -1;
}

int a1b_make_current(int64_t surface) {
  a1b_surface_t *s = a1b_find(surface);
  if (!s) return a1b_fail("unknown surface");
  int ok = g_MakeCurrent(g_display, s->egl_surface, s->egl_surface,
                         s->ctx ? s->ctx : g_context) == EGL_TRUE;
  g_current_valid = ok;
  return ok ? 0 : a1b_egl_fail("eglMakeCurrent");
}

// Post-swap glFinish residency flush (M1 discovery #4); default ON.
void a1b_set_finish_flag(int on) { g_finish_flag = on ? 1 : 0; }

// Drain any pending GL error flags before swap/readback. Scenes may leave
// stale errors (deferred validation, unsupported-enum probes); the harness
// readback models the browser compositor, which is unaffected by the GL
// error flag, and a stale flag would otherwise make the post-readPixels
// getError() checks report false failures.
static void a1b_drain_gl_errors(const char *where) {
  unsigned err, n = 0;
  while ((err = g_GetError()) != 0 && n++ < 16)
    fprintf(stderr, "[angle_1b] %s: drained stale GL error 0x%x\n", where, err);
}

int a1b_swap_buffers(int64_t surface) {
  a1b_surface_t *s = a1b_find(surface);
  if (!s) return a1b_fail("unknown surface");
  g_Flush();
  if (!s->fallback) {
    if (g_SwapBuffers(g_display, s->egl_surface) != EGL_TRUE)
      return a1b_egl_fail("eglSwapBuffers");
    // Make the Metal command buffer fully resident in the IOSurface before
    // the engine samples it (without this the IOSurface can stay zeroed).
    if (g_finish_flag) g_Finish();
    return 0;
  }
  // Fallback: copy the pbuffer into the IOSurface for the texture layer.
  size_t n = (size_t)s->width * s->height * 4, bpr = IOSurfaceGetBytesPerRow(s->io);
  uint8_t *tmp = malloc(n), *dst = NULL;
  if (!tmp) return a1b_fail("oom");
  a1b_drain_gl_errors("swapBuffers");
  g_ReadPixels(0, 0, s->width, s->height, GL_BGRA_EXT, GL_UNSIGNED_BYTE, tmp);
  if (g_GetError() != 0) { free(tmp); return a1b_egl_fail("glReadPixels"); }
  IOSurfaceLock(s->io, 0, NULL);
  dst = IOSurfaceGetBaseAddress(s->io);
  for (int y = 0; y < s->height; y++)
    memcpy(dst + y * bpr, tmp + (size_t)y * s->width * 4, (size_t)s->width * 4);
  IOSurfaceUnlock(s->io, 0, NULL);
  free(tmp);
  return 0;
}

// ---- readback ------------------------------------------------------------------
int a1b_read_pixels(int64_t surface, uint8_t *dst_rgba, int *width, int *height) {
  a1b_surface_t *s = a1b_find(surface);
  if (!s || !dst_rgba) return a1b_fail("bad args");
  a1b_drain_gl_errors("readPixels");
  size_t n = (size_t)s->width * s->height * 4;
  uint8_t *tmp = malloc(n);
  if (!tmp) return a1b_fail("oom");
  g_ReadPixels(0, 0, s->width, s->height, GL_BGRA_EXT, GL_UNSIGNED_BYTE, tmp);
  unsigned err = g_GetError();
  if (err != 0) { // retry as RGBA (then no conversion needed)
    g_ReadPixels(0, 0, s->width, s->height, GL_RGBA, GL_UNSIGNED_BYTE, tmp);
    err = g_GetError();
    if (err != 0) {
      fprintf(stderr, "[angle_1b] glReadPixels failed: GL error 0x%x (EGL 0x%x)\n", err, g_EGLGetError());
      free(tmp); return a1b_egl_fail("glReadPixels");
    }
    memcpy(dst_rgba, tmp, n);
  } else { // BGRA -> RGBA
    for (size_t i = 0; i < n; i += 4) {
      uint8_t b0 = tmp[i], b2 = tmp[i + 2];
      dst_rgba[i] = b2; dst_rgba[i + 1] = tmp[i + 1];
      dst_rgba[i + 2] = b0; dst_rgba[i + 3] = tmp[i + 3];
    }
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
  g_MakeCurrent(g_display, EGL_NO_SURFACE, EGL_NO_SURFACE, EGL_NO_CONTEXT);
  g_current_valid = 0;
  if (s->ctx) g_DestroyContext(g_display, s->ctx);
  g_DestroySurface(g_display, s->egl_surface);
  if (s->io) CFRelease(s->io);
  memset(s, 0, sizeof(*s));
}

void a1b_shutdown(void) {
  for (int i = 1; i <= A1B_MAX_SURFACES; i++)
    if (g_surfaces[i - 1].used) a1b_destroy_surface(i);
  if (!g_display) return;
  g_MakeCurrent(g_display, EGL_NO_SURFACE, EGL_NO_SURFACE, EGL_NO_CONTEXT);
  g_current_valid = 0;
  if (g_context) g_DestroyContext(g_display, g_context);
  g_context = EGL_NO_CONTEXT;
  g_Terminate(g_display);
  g_display = EGL_NO_DISPLAY;
  if (g_egl_lib) dlclose(g_egl_lib);
  if (g_gles_lib) dlclose(g_gles_lib);
  g_egl_lib = g_gles_lib = NULL;
}
