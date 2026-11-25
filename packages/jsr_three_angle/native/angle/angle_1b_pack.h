// angle_1b_pack.h — tiny C packer mirroring tool/three/gen/g1_packer.js.
//
// The M2 demo renderer (a1b_render_triangle) emits the exact byte stream
// the JS packer would produce — [u32 opcode LE][args per the method's
// format string] — and executes it through a1b_gl_dispatch, so the smoke
// exercises the single G1 code path end to end. Header-only statics; the
// demo is the only consumer.
#ifndef ANGLE_1B_PACK_H
#define ANGLE_1B_PACK_H

#include <string.h>

#include "angle_1b.h"
#include "gen/g1_tables.h"

#define A1B_PACK_CAP 4096
static uint8_t a1b_pack_buf[A1B_PACK_CAP];
static int a1b_pack_len;

static void a1bp_reset(void) { a1b_pack_len = 0; }

static void a1bp_u32(uint32_t v) {
  memcpy(a1b_pack_buf + a1b_pack_len, &v, 4);
  a1b_pack_len += 4;
}

static void a1bp_op(uint32_t opcode) {
  a1bp_reset();
  a1bp_u32(opcode);
}

static void a1bp_i32(int32_t v) { a1bp_u32((uint32_t)v); }

static void a1bp_f32(float v) { a1bp_u32(((const uint32_t *)&v)[0]); }

static void a1bp_str(const char *s) {
  uint32_t n = (uint32_t)strlen(s);
  a1bp_u32(n);
  memcpy(a1b_pack_buf + a1b_pack_len, s, n);
  a1b_pack_len += (int)n;
}

// Typed-array-or-size 'b' arg: (ptr,bytes) uploads bytes; (NULL,n) is the
// size-only convention (writes the length alone, decoder sees NULL).
static void a1bp_blob(const void *p, uint32_t n) {
  a1bp_u32(n);
  if (p) {
    memcpy(a1b_pack_buf + a1b_pack_len, p, n);
    a1b_pack_len += (int)n;
  }
}

// Dispatches the buffered command; returns the int64 result (0 = ok;
// negative = protocol error; poll getError for GL errors).
static int64_t a1bp_send(void) {
  return a1b_gl_dispatch(a1b_pack_buf, a1b_pack_len);
}

#endif // ANGLE_1B_PACK_H
