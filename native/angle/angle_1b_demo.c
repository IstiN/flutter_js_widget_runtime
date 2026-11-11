// angle_1b_demo.c — deterministic demo triangle for the smoke test (M2).
//
// Every GL call is emitted as a G1 command buffer through the C packer in
// angle_1b_pack.h and executed via a1b_gl_dispatch — the same byte stream
// the JS packer (tool/three/gen/g1_packer.js) produces, so the smoke proves
// the single dispatch code path end to end. The M1 direct gl* calls were
// removed on purpose.
#include "angle_1b.h"

#include <stdio.h>

#include "angle_1b_gl.h"
#include "angle_1b_pack.h"

static int a1b_fail(const char *what) {
  fprintf(stderr, "[angle_1b] error: %s\n", what);
  return -1;
}

static a1b_surface_t *a1b_find(int64_t id) {
  if (id < 1 || id > A1B_MAX_SURFACES) return NULL;
  return g_surfaces[id - 1].used ? &g_surfaces[id - 1] : NULL;
}

// ---- demo renderer (G1 dispatch path; the direct gl* calls were removed
// in M2 so the demo exercises the exact byte stream the JS packer emits).
#define A1B_CHK(EXPR) do { \
  if ((EXPR) != 0) return a1b_fail("G1 dispatch failed: " #EXPR); \
} while (0)

static int a1b_g1_compile(unsigned type, const char *src, int64_t *out_shader) {
  a1bp_op(G1_OP_CREATE_SHADER);
  a1bp_u32(type);
  int64_t sh = a1bp_send();
  if (sh <= 0) return a1b_fail("G1 createShader");
  a1bp_op(G1_OP_SHADER_SOURCE);
  a1bp_u32((uint32_t)sh);
  a1bp_str(src);
  A1B_CHK(a1bp_send());
  a1bp_op(G1_OP_COMPILE_SHADER);
  a1bp_u32((uint32_t)sh);
  A1B_CHK(a1bp_send());
  a1bp_op(G1_OP_GET_SHADER_PARAMETER);
  a1bp_u32((uint32_t)sh);
  a1bp_u32(0x8B81 /*COMPILE_STATUS*/);
  if (a1bp_send() == 0) return a1b_fail("shader compile failed");
  *out_shader = sh;
  return 0;
}

int a1b_render_triangle(int64_t surface) {
  a1b_surface_t *s = a1b_find(surface);
  if (!s) return a1b_fail("unknown surface");
  static int64_t prog = 0, vao = 0;
  if (!prog) {
    const char *vs = "#version 300 es\n"
      "layout(location=0) in vec2 a_pos; layout(location=1) in vec3 a_color;\n"
      "out vec3 v_color; void main(){ v_color = a_color; gl_Position = vec4(a_pos, 0.0, 1.0); }\n";
    const char *fs = "#version 300 es\n"
      "precision mediump float; in vec3 v_color; out vec4 o_color;\n"
      "void main(){ o_color = vec4(v_color, 1.0); }\n";
    int64_t vsh = 0, fsh = 0;
    if (a1b_g1_compile(0x8B31 /*VERTEX*/, vs, &vsh) != 0) return -1;
    if (a1b_g1_compile(0x8B30 /*FRAGMENT*/, fs, &fsh) != 0) return -1;
    a1bp_op(G1_OP_CREATE_PROGRAM);
    prog = a1bp_send();
    if (prog <= 0) return a1b_fail("G1 createProgram");
    a1bp_op(G1_OP_ATTACH_SHADER);
    a1bp_u32((uint32_t)prog);
    a1bp_u32((uint32_t)vsh);
    A1B_CHK(a1bp_send());
    a1bp_op(G1_OP_ATTACH_SHADER);
    a1bp_u32((uint32_t)prog);
    a1bp_u32((uint32_t)fsh);
    A1B_CHK(a1bp_send());
    a1bp_op(G1_OP_LINK_PROGRAM);
    a1bp_u32((uint32_t)prog);
    A1B_CHK(a1bp_send());
    a1bp_op(G1_OP_GET_PROGRAM_PARAMETER);
    a1bp_u32((uint32_t)prog);
    a1bp_u32(0x8B82 /*LINK_STATUS*/);
    if (a1bp_send() == 0) return a1b_fail("program link failed");
    a1bp_op(G1_OP_CREATE_VERTEX_ARRAY);
    vao = a1bp_send();
    if (vao <= 0) return a1b_fail("G1 createVertexArray");
    a1bp_op(G1_OP_BIND_VERTEX_ARRAY);
    a1bp_u32((uint32_t)vao);
    A1B_CHK(a1bp_send());
    a1bp_op(G1_OP_CREATE_BUFFER);
    int64_t vbo = a1bp_send();
    if (vbo <= 0) return a1b_fail("G1 createBuffer");
    a1bp_op(G1_OP_BIND_BUFFER);
    a1bp_u32(0x8892 /*ARRAY_BUFFER*/);
    a1bp_u32((uint32_t)vbo);
    A1B_CHK(a1bp_send());
    // x,y, r,g,b — wide base, apex top-center; corners stay clear-colored.
    static const float verts[3][5] = {{-0.9f, -0.9f, 1, 0, 0},
                                       {0.9f, -0.9f, 0, 1, 0},
                                       {0.0f, 0.9f, 0, 0, 1}};
    a1bp_op(G1_OP_BUFFER_DATA);
    a1bp_u32(0x8892);
    a1bp_blob(verts, (uint32_t)sizeof(verts));
    a1bp_u32(0x88E4 /*STATIC_DRAW*/);
    A1B_CHK(a1bp_send());
    a1bp_op(G1_OP_ENABLE_VERTEX_ATTRIB_ARRAY);
    a1bp_u32(0);
    A1B_CHK(a1bp_send());
    a1bp_op(G1_OP_ENABLE_VERTEX_ATTRIB_ARRAY);
    a1bp_u32(1);
    A1B_CHK(a1bp_send());
    a1bp_op(G1_OP_VERTEX_ATTRIB_POINTER);
    a1bp_u32(0);
    a1bp_i32(2);
    a1bp_u32(0x1406 /*FLOAT*/);
    a1bp_u32(0);
    a1bp_i32(5 * 4);
    a1bp_i32(0);
    A1B_CHK(a1bp_send());
    a1bp_op(G1_OP_VERTEX_ATTRIB_POINTER);
    a1bp_u32(1);
    a1bp_i32(3);
    a1bp_u32(0x1406);
    a1bp_u32(0);
    a1bp_i32(5 * 4);
    a1bp_i32(2 * 4);
    A1B_CHK(a1bp_send());
  }
  a1bp_op(G1_OP_BIND_VERTEX_ARRAY);
  a1bp_u32((uint32_t)vao);
  A1B_CHK(a1bp_send());
  a1bp_op(G1_OP_USE_PROGRAM);
  a1bp_u32((uint32_t)prog);
  A1B_CHK(a1bp_send());
  a1bp_op(G1_OP_VIEWPORT);
  a1bp_i32(0);
  a1bp_i32(0);
  a1bp_i32(s->width);
  a1bp_i32(s->height);
  A1B_CHK(a1bp_send());
  a1bp_op(G1_OP_CLEAR_COLOR);
  a1bp_f32(0.05f);
  a1bp_f32(0.10f);
  a1bp_f32(0.30f);
  a1bp_f32(1.0f); // deterministic dark blue
  A1B_CHK(a1bp_send());
  a1bp_op(G1_OP_CLEAR);
  a1bp_u32(0x00004000 /*COLOR_BUFFER_BIT*/);
  A1B_CHK(a1bp_send());
  a1bp_op(G1_OP_DRAW_ARRAYS);
  a1bp_u32(0x0004 /*TRIANGLES*/);
  a1bp_i32(0);
  a1bp_i32(3);
  A1B_CHK(a1bp_send());
  a1bp_op(G1_OP_GET_ERROR);
  int64_t glerr = a1bp_send();
  if (glerr != 0) return a1b_fail("glDrawArrays (GL error)");
  return 0;
}

