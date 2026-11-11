// angle_1b_dispatch.c — G1 binary GL command decoder (M2).
//
// a1b_gl_dispatch(buf, len): [u32 opcode LE][args...] -> int64.
//   0 = ok (void commands never auto-report GL errors; the caller polls
//   getError), >0 = scalar GL result, -1 = named stub, -(opcode) = unknown
//   opcode, G1_E_MALFORMED = truncated command, -0x7fffffff = no current
//   surface. Data-returning commands publish into a fixed 64 KB per-context
//   scratch, fetched through a1b_gl_result (two-call pattern).
//
// The opcode switch is generated (native/angle/gen/g1_tables.h) from
// tool/three/webgl2_g1_methods.json. Requires a current surface (the caller
// ran a1b_make_current). Build: native/angle/build.sh.
#include "angle_1b.h"

#include <stdio.h>
#include <string.h>

#include "angle_1b_gl.h"

#define G1_SCRATCH_CAP (256 * 1024)
#define G1_E_MALFORMED ((int64_t)-0x7ffffffe)

static uint8_t g1_scratch[G1_SCRATCH_CAP];
static int g1_scratch_len;
static int64_t g1_stats_calls, g1_stats_bytes;

// ---- wire readers ----------------------------------------------------------
typedef struct {
  const uint8_t *p;
  const uint8_t *end;
  int err;
} g1_cur;

static uint32_t g1_rd_u32(g1_cur *c) {
  if (c->end - c->p < 4) { c->err = 1; return 0; }
  uint32_t v;
  memcpy(&v, c->p, 4);
  c->p += 4;
  return v;
}

static float g1_rd_f32(g1_cur *c) {
  uint32_t b = g1_rd_u32(c);
  float v;
  memcpy(&v, &b, 4);
  return v;
}

// Strings are copied into a shared, NUL-terminated buffer (GL entry points
// expect C strings). At most one 's' arg exists per G1 method.
// Three.js r186 physical-material fragment shaders exceed 64 KB; keep the
// string lane well above the largest observed shader source (~100 KB).
static char g1_strbuf[1024 * 1024];
static const char *g1_rd_str(g1_cur *c, uint32_t len) {
  if (c->end - c->p < (ptrdiff_t)len) { c->err = 1; return ""; }
  if (len >= sizeof(g1_strbuf)) len = (uint32_t)sizeof(g1_strbuf) - 1;
  memcpy(g1_strbuf, c->p, len);
  g1_strbuf[len] = 0;
  c->p += len;
  return g1_strbuf;
}

// Blob: when the remaining wire is shorter than the declared length the
// command used the size-only convention (a bare number instead of a typed
// array) and the decoder hands GL a NULL pointer (bufferData size-only,
// texImage2D null-data overloads). A zero-length blob at the very end of
// the buffer is likewise NULL (JS null and an empty array are equivalent
// for uploads).
static const void *g1_rd_blob(g1_cur *c, uint32_t len) {
  ptrdiff_t remaining = c->end - c->p;
  if (remaining < (ptrdiff_t)len || (len == 0 && remaining == 0)) return NULL;
  const uint8_t *p = c->p;
  c->p += len;
  return p;
}

// ---- scratch writers ---------------------------------------------------------
static void g1_scratch_write(uint8_t *sc, int *sc_len, size_t cap,
                             const void *src, size_t n) {
  (void)sc;
  size_t off = (size_t)g1_scratch_len;
  if (off + n > cap) n = cap - off;
  memcpy(g1_scratch + off, src, n);
  g1_scratch_len = (int)(off + n);
  if (sc_len) *sc_len = g1_scratch_len;
}

// ---- sync object table (GLsync opaque pointer <-> u32 id) ---------------------
#define A1B_MAX_SYNCS 256
static void *g1_syncs[A1B_MAX_SYNCS];

static void *g1_sync_ref(uint32_t id) {
  if (id < 1 || id > A1B_MAX_SYNCS) return NULL;
  return g1_syncs[id - 1];
}

static int64_t g1_fence_sync(uint32_t cond, uint32_t flags) {
  void *s = g_FenceSync(cond, flags);
  if (!s) return 0;
  for (int i = 0; i < A1B_MAX_SYNCS; i++)
    if (!g1_syncs[i]) { g1_syncs[i] = s; return i + 1; }
  g_DeleteSync(s);
  return 0;
}

static int64_t g1_client_wait_sync(uint32_t id, uint32_t flags, uint32_t timeout) {
  void *s = g1_sync_ref(id);
  if (!s) return -1;
  return (int64_t)g_ClientWaitSync(s, flags, (uint64_t)timeout);
}

static void g1_wait_sync(uint32_t id, uint32_t flags, uint32_t timeout) {
  void *s = g1_sync_ref(id);
  if (s) g_WaitSync(s, flags, (uint64_t)timeout);
}

static void g1_delete_sync(uint32_t id) {
  void *s = g1_sync_ref(id);
  if (s) {
    g_DeleteSync(s);
    g1_syncs[id - 1] = NULL;
  }
}

static int64_t g1_is_sync(uint32_t id) { return g1_sync_ref(id) != NULL; }

static int64_t g1_get_sync_parameter(uint32_t id, uint32_t pname) {
  void *s = g1_sync_ref(id);
  if (!s) return -1;
  int v = 0;
  g_GetSynciv(s, pname, 1, NULL, &v);
  return (int64_t)(uint32_t)v;
}

static int64_t g1_get_query(uint32_t target, uint32_t pname) {
  int v = 0;
  g_GetQueryiv(target, pname, &v);
  return (int64_t)(uint32_t)v;
}

static int64_t g1_get_query_parameter(uint32_t id, uint32_t pname) {
  if (pname == 0x8867 /*QUERY_RESULT_AVAILABLE*/) {
    int v = 0;
    g_GetQueryObjectivEXT(id, pname, &v);
    return (int64_t)(uint32_t)v;
  }
  uint64_t v = 0;
  g_GetQueryObjectui64vEXT(id, pname, &v);
  return (int64_t)(uint32_t)v;
}

// ---- glue helpers referenced by the generated cases ---------------------------
static int64_t g1_get_parameter(uint32_t pname) {
  switch (pname) {
    case 0x1F00: /*VENDOR*/ case 0x1F01: /*RENDERER*/
    case 0x1F02: /*VERSION*/ case 0x8B8C: /*SHADING_LANGUAGE_VERSION*/ {
      const unsigned char *s = g_GetString(pname);
      size_t n = s ? strlen((const char *)s) : 0;
      if (n > G1_SCRATCH_CAP - 1) n = G1_SCRATCH_CAP - 1;
      memcpy(g1_scratch, s, n);
      g1_scratch[n] = 0; // NUL past sc_len for C-style readers
      g1_scratch_len = (int)n;
      return 0;
    }
    case 0x9245: /*UNMASKED_VENDOR_WEBGL*/ case 0x9246: /*UNMASKED_RENDERER_WEBGL*/ {
      const unsigned char *s = g_GetString(pname == 0x9245 ? 0x1F00 : 0x1F01);
      size_t n = s ? strlen((const char *)s) : 0;
      if (n > G1_SCRATCH_CAP - 1) n = G1_SCRATCH_CAP - 1;
      memcpy(g1_scratch, s, n);
      g1_scratch[n] = 0;
      g1_scratch_len = (int)n;
      return 0;
    }
    case 0x0BA2: /*VIEWPORT*/ case 0x0C10: /*SCISSOR_BOX*/ {
      int v[4];
      g_GetIntegerv(pname, v);
      g1_scratch_write(NULL, NULL, G1_SCRATCH_CAP, v, sizeof(v));
      return 0;
    }
    case 0x0D3A: { /*MAX_VIEWPORT_DIMS*/
      int v[2];
      g_GetIntegerv(pname, v);
      g1_scratch_write(NULL, NULL, G1_SCRATCH_CAP, v, sizeof(v));
      return 0;
    }
    case 0x0B70: /*DEPTH_RANGE*/ case 0x0B12: /*POINT_SIZE_RANGE*/
    case 0x846D: /*ALIASED_POINT_SIZE_RANGE*/ case 0x846E: /*ALIASED_LINE_WIDTH_RANGE*/ {
      float v[2];
      g_GetFloatv(pname, v);
      g1_scratch_write(NULL, NULL, G1_SCRATCH_CAP, v, sizeof(v));
      return 0;
    }
    case 0x8005: /*BLEND_COLOR*/ case 0x0C22: /*COLOR_CLEAR_VALUE*/ {
      float v[4];
      g_GetFloatv(pname, v);
      g1_scratch_write(NULL, NULL, G1_SCRATCH_CAP, v, sizeof(v));
      return 0;
    }
    case 0x86A3: { /*COMPRESSED_TEXTURE_FORMATS*/
      int n = 0;
      g_GetIntegerv(0x86A2 /*NUM_COMPRESSED_TEXTURE_FORMATS*/, &n);
      if (n > G1_SCRATCH_CAP / 4) n = G1_SCRATCH_CAP / 4;
      g_GetIntegerv(pname, (int *)g1_scratch);
      g1_scratch_len = n * 4;
      return 0;
    }
    case 0x9247: { /*MAX_CLIENT_WAIT_TIMEOUT_WEBGL*/
      int64_t v = 0;
      g_GetInteger64v(pname, &v);
      return (int64_t)(uint32_t)v;
    }
    default: {
      int v = 0;
      g_GetIntegerv(pname, &v);
      return (int64_t)(uint32_t)v;
    }
  }
}

static char g1_exts[16384];
static int g1_exts_len = -1;

static int64_t g1_get_extension(const char *name, uint32_t len) {
  (void)len;
  if (g1_exts_len < 0) {
    int n = 0;
    g_GetIntegerv(0x821D /*GL_NUM_EXTENSIONS*/, &n);
    char *d = g1_exts;
    size_t left = sizeof(g1_exts);
    for (int i = 0; i < n && left > 2; i++) {
      const unsigned char *s = g_GetStringi(0x1F03 /*GL_EXTENSIONS*/, (unsigned)i);
      if (!s) continue;
      int k = snprintf(d, left, "%s ", s);
      if (k <= 0 || (size_t)k >= left) break;
      d += k;
      left -= (size_t)k;
    }
    *d = 0;
    g1_exts_len = (int)(d - g1_exts);
  }
  // Token match over the space-separated list. ES3 GetStringi on ANGLE
  // returns GL_-prefixed (desktop-style) names, so accept both spellings:
  // "EXT_x" and "GL_EXT_x".
  size_t nl = strlen(name);
  const char *tok = g1_exts;
  while (*tok) {
    const char *end = strchr(tok, ' ');
    size_t tl = end ? (size_t)(end - tok) : strlen(tok);
    if ((tl == nl && memcmp(tok, name, nl) == 0) ||
        (tl == nl + 3 && memcmp(tok, "GL_", 3) == 0 && memcmp(tok + 3, name, nl) == 0)) {
      return 1;
    }
    tok = end ? end + 1 : tok + tl;
  }
  return 0;
}

static void g1_get_buffer_subdata(uint32_t target, int32_t offset, uint32_t size) {
  void *m = g_MapBufferRange(target, offset, (ptrdiff_t)size, 0x0001 /*GL_MAP_READ_BIT*/);
  if (!m) return;
  g1_scratch_write(NULL, NULL, G1_SCRATCH_CAP, m, size);
  g_UnmapBuffer(target);
}

// Packed active-reflection format (locked ABI): [u32 nameLen][UTF-8 name]
// [i32 size][u32 type], all little-endian (host is LE; see docs).
static void g1_get_active(uint32_t program, uint32_t index, int which) {
  char name[4096];
  int len = 0, size = 0;
  unsigned type = 0;
  if (which == 2)
    g_GetTransformFeedbackVarying(program, index, (int)sizeof(name), &len, &size, &type, name);
  else if (which == 1)
    g_GetActiveAttrib(program, index, (int)sizeof(name), &len, &size, &type, name);
  else
    g_GetActiveUniform(program, index, (int)sizeof(name), &len, &size, &type, name);
  if (len < 0 || len > (int)sizeof(name) - 1) len = 0;
  name[len] = 0;
  uint32_t nl = (uint32_t)len;
  int32_t sz = size;
  uint32_t ty = type;
  memcpy(g1_scratch, &nl, 4);
  memcpy(g1_scratch + 4, name, nl);
  memcpy(g1_scratch + 4 + nl, &sz, 4);
  memcpy(g1_scratch + 8 + nl, &ty, 4);
  g1_scratch_len = 12 + (int)nl;
}

static int g1_split_names(const char *names, uint32_t len, const char **ptrs, int max) {
  int n = 0;
  const char *s = names;
  const char *end = names + len;
  while (s < end && n < max) {
    ptrs[n++] = s;
    const void *z = memchr(s, 0, (size_t)(end - s));
    if (!z) break;
    s = (const char *)z + 1;
  }
  return n;
}

static void g1_get_uniform_indices(uint32_t program, const char *names, uint32_t len) {
  const char *ptrs[128];
  int n = g1_split_names(names, len, ptrs, 128);
  g_GetUniformIndices(program, n, ptrs, (unsigned *)g1_scratch);
  g1_scratch_len = n * 4;
}

static void g1_get_uibp(uint32_t program, uint32_t index, uint32_t pname) {
  if (pname == 0x8A43 /*UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES*/) {
    int count = 0;
    g_GetActiveUniformBlockiv(program, index, 0x8A42 /*ACTIVE_UNIFORMS*/, &count);
    if (count > G1_SCRATCH_CAP / 4) count = G1_SCRATCH_CAP / 4;
    g_GetActiveUniformBlockiv(program, index, pname, (int *)g1_scratch);
    g1_scratch_len = count * 4;
  } else {
    int v = 0;
    g_GetActiveUniformBlockiv(program, index, pname, &v);
    memcpy(g1_scratch, &v, 4);
    g1_scratch_len = 4;
  }
}

static void g1_transform_feedback_varyings(uint32_t program, const char *varyings,
                                           uint32_t len, uint32_t buffer_mode) {
  const char *ptrs[128];
  int n = g1_split_names(varyings, len, ptrs, 128);
  g_TransformFeedbackVaryings(program, n, ptrs, buffer_mode);
}

static int g1_get_compressed_tex_image(uint32_t target, int32_t level) {
  int sz = 0;
  g_GetTexLevelParameteriv(target, level, 0x86A0 /*TEXTURE_COMPRESSED_IMAGE_SIZE*/, &sz);
  if (sz < 0 || sz > G1_SCRATCH_CAP - 4) { g1_scratch_len = 0; return 0; }
  g_GetCompressedTexImage(target, level, g1_scratch + 4);
  uint32_t n = (uint32_t)sz;
  memcpy(g1_scratch, &n, 4);
  g1_scratch_len = 4 + sz;
  return 4 + sz;
}

static int g1_pix_bytes(uint32_t fmt, uint32_t type) {
  int comp;
  switch (fmt) {
    case 0x1906: /*ALPHA*/ case 0x1909: /*LUMINANCE*/ case 0x1903: /*RED*/
    case 0x8D94: /*RED_INTEGER*/ comp = 1; break;
    case 0x190A: /*LUMINANCE_ALPHA*/ case 0x8227: /*RG*/ case 0x8228: comp = 2; break;
    case 0x1907: /*RGB*/ comp = 3; break;
    default: comp = 4; break; // RGBA, DEPTH_COMPONENT+UINT, DEPTH_STENCIL, ...
  }
  int size;
  switch (type) {
    case 0x1400: /*BYTE*/ case 0x1401: /*UNSIGNED_BYTE*/ size = 1; break;
    case 0x1402: /*SHORT*/ case 0x1403: /*UNSIGNED_SHORT*/
    case 0x140B: /*HALF_FLOAT*/ case 0x8033: case 0x8034: case 0x8363:
    case 0x8368: case 0x8D61: size = 2; break;
    case 0x8DAD: /*FLOAT_32_UNSIGNED_INT_24_8_REV*/ size = 8; break;
    default: size = 4; break;
  }
  if (fmt == 0x84F9 /*DEPTH_STENCIL*/) size = (type == 0x8DAD) ? 8 : 4;
  return comp * size;
}

static void g1_read_pixels(int32_t x, int32_t y, int32_t w, int32_t h,
                           uint32_t fmt, uint32_t type) {
  int64_t bytes = (int64_t)w * h * g1_pix_bytes(fmt, type);
  if (w <= 0 || h <= 0 || bytes > G1_SCRATCH_CAP) return;
  g_ReadPixels(x, y, w, h, fmt, type, g1_scratch);
  g1_scratch_len = (int)bytes;
}

// ---- dispatch entry -----------------------------------------------------------
#define A1B_DISPATCH_IMPL
#include "gen/g1_tables.h"
#undef A1B_DISPATCH_IMPL

int64_t a1b_gl_dispatch(const uint8_t *buf, int len) {
  if (!buf || len < 4) return G1_E_MALFORMED;
  if (!g_display || !g_current_valid) return (int64_t)-0x7fffffff;
  g1_cur c = {buf + 4, buf + len, 0};
  uint32_t opcode;
  memcpy(&opcode, buf, 4);
  g1_scratch_len = 0;
  int64_t r = g1_dispatch_op(opcode, c);
  g1_stats_calls++;
  g1_stats_bytes += len;
  return r;
}

int a1b_gl_result(uint8_t *dst, int max_len) {
  int n = g1_scratch_len;
  if (dst && max_len > 0) {
    int k = n < max_len ? n : max_len;
    memcpy(dst, g1_scratch, (size_t)k);
  }
  return n;
}

void a1b_gl_stats(int64_t *calls, int64_t *bytes) {
  if (calls) *calls = g1_stats_calls;
  if (bytes) *bytes = g1_stats_bytes;
}
