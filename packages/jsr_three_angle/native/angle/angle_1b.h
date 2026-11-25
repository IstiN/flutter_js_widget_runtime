// angle_1b.h — ANGLE 1B spike shim: public C ABI over the ANGLE dylibs.
//
// M1: init/teardown, IOSurface-backed surfaces, a deterministic demo
// triangle, readback. M2: G1 binary GL dispatch (a1b_gl_dispatch) + the
// 64 KB result scratch (a1b_gl_result) that backs the JS facade's data
// calls, plus dispatch statistics.
//
// All functions return 0 on success or a negative errno-style code on
// failure unless noted.
#ifndef ANGLE_1B_H
#define ANGLE_1B_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

// dlopen ANGLE dylibs, create+init the default EGL display (ANGLE Metal),
// choose a config, create the ES3 context, probe extensions.
int a1b_init(void);

// 1 if the surface renders through the EGL_ANGLE_iosurface_client_buffer
// fast path, 0 if it uses the pbuffer + readback fallback.
int a1b_get_iosurface_extension(int64_t surface);

// Create a surface. Returns a surface id (>= 1) or negative. On success
// *out_iosurface_id receives the IOSurfaceID to hand to the platform
// texture plugin.
int64_t a1b_create_surface(int width, int height, uint32_t *out_iosurface_id);

int a1b_make_current(int64_t surface);

// glFlush + eglSwapBuffers; marks a frame available for the texture layer.
int a1b_swap_buffers(int64_t surface);

// Read back the surface as tightly packed RGBA8 into dst (caller allocates
// width*height*4 bytes). *width/*height are filled with the surface size.
// Converts BGRA->RGBA in C when the driver reports BGRA order.
int a1b_read_pixels(int64_t surface, uint8_t *dst_rgba, int *width, int *height);

// Deterministic demo renderer for the smoke test: clears dark blue and
// draws a gradient triangle that covers most of the surface. M2: every GL
// call goes through the G1 dispatch path (single code path, see
// angle_1b_pack.h).
int a1b_render_triangle(int64_t surface);

void a1b_destroy_surface(int64_t surface);
void a1b_shutdown(void);

// Diagnostics: 0 = EGL vendor, 1 = EGL version, 2 = renderer device string,
// 3 = comma flag "1" when the IOSurface client-buffer extension is present.
// Returns an empty string when unknown; never NULL after a1b_init.
const char *a1b_egl_info(int what);

// M2 G1 ABI. One synchronous host call per GL command:
//   buf = [u32 opcode LE][args...] (arg formats per the methods table at
//   tool/three/webgl2_g1_methods.json).
// Returns: 0 = ok (void; GL errors are polled via getError, never auto
// reported), >0 = scalar GL result (getError, checkFramebufferStatus,
// name creation, parameters), -1 = named stub, -(opcode) = unknown opcode,
// -0x7ffffffe = malformed command, -0x7fffffff = no current surface.
// Consumed in place; no pointers are retained.
int64_t a1b_gl_dispatch(const uint8_t *buf, int len);

// Two-call data lane for scratch-returning commands (getActiveUniform,
// info logs, getParameter vectors, readPixels, ...): dispatch first, then
// copy the per-context scratch into dst (up to max_len). Returns the full
// scratch length regardless of max_len.
int a1b_gl_result(uint8_t *dst, int max_len);

// Dispatch statistics: total command count and wire bytes.
void a1b_gl_stats(int64_t *calls, int64_t *bytes);

// Post-swap glFinish residency flush (M1 discovery #4). Default 1 (ON);
// set 0 to let frame pacing replace it in later milestones.
void a1b_set_finish_flag(int on);

#ifdef __cplusplus
}
#endif

#endif // ANGLE_1B_H
