// webgl2_facade.js — WebGL2RenderingContext facade over the G1 binary packer
// (g1.<method>(...), tool/three/gen/g1_packer.js). GL handles are u32 names;
// per-class wrappers are cached for browser-style JS identity. Data-returning
// calls read global __jsr1b_result() (base64 of the 64 KB C scratch). STRICT:
// missing g1 method or stub entry throws Error('webgl.<name>: named
// unsupported'). Constants: https://registry.khronos.org/webgl/specs/latest/2.0/
(function () {
'use strict';
var root = typeof globalThis !== 'undefined' ? globalThis : this;

var C = {
  // misc caps / masks
  DEPTH_BUFFER_BIT: 0x00000100, STENCIL_BUFFER_BIT: 0x00000400, COLOR_BUFFER_BIT: 0x00004000,
  POINTS: 0x0000, LINES: 0x0001, LINE_LOOP: 0x0002, LINE_STRIP: 0x0003, TRIANGLES: 0x0004, TRIANGLE_STRIP: 0x0005, TRIANGLE_FAN: 0x0006,
  ZERO: 0, ONE: 1, SRC_COLOR: 0x0300, ONE_MINUS_SRC_COLOR: 0x0301, SRC_ALPHA: 0x0302, ONE_MINUS_SRC_ALPHA: 0x0303,
  DST_ALPHA: 0x0304, ONE_MINUS_DST_ALPHA: 0x0305, DST_COLOR: 0x0306, ONE_MINUS_DST_COLOR: 0x0307, SRC_ALPHA_SATURATE: 0x0308,
  FUNC_ADD: 0x8006, FUNC_SUBTRACT: 0x800A, FUNC_REVERSE_SUBTRACT: 0x800B, MIN: 0x8007, MAX: 0x8008,
  BLEND_EQUATION: 0x8009, BLEND_EQUATION_RGB: 0x8009, BLEND_EQUATION_ALPHA: 0x883D,
  BLEND_DST_RGB: 0x80C8, BLEND_SRC_RGB: 0x80C9, BLEND_DST_ALPHA: 0x80CA, BLEND_SRC_ALPHA: 0x80CB,
  CONSTANT_COLOR: 0x8001, ONE_MINUS_CONSTANT_COLOR: 0x8002, CONSTANT_ALPHA: 0x8003, ONE_MINUS_CONSTANT_ALPHA: 0x8004, BLEND_COLOR: 0x8005,
  ARRAY_BUFFER: 0x8892, ELEMENT_ARRAY_BUFFER: 0x8893, ARRAY_BUFFER_BINDING: 0x8894, ELEMENT_ARRAY_BUFFER_BINDING: 0x8895,
  COPY_READ_BUFFER: 0x8F36, COPY_WRITE_BUFFER: 0x8F37, PIXEL_PACK_BUFFER: 0x88EB, PIXEL_UNPACK_BUFFER: 0x88EC,
  PIXEL_PACK_BUFFER_BINDING: 0x88ED, PIXEL_UNPACK_BUFFER_BINDING: 0x88EF, TRANSFORM_FEEDBACK_BUFFER: 0x8C8E, TRANSFORM_FEEDBACK_BUFFER_BINDING: 0x8C8F,
  STREAM_DRAW: 0x88E0, STREAM_READ: 0x88E1, STREAM_COPY: 0x88E2, STATIC_DRAW: 0x88E4, STATIC_READ: 0x88E5, STATIC_COPY: 0x88E6,
  DYNAMIC_DRAW: 0x88E8, DYNAMIC_READ: 0x88E9, DYNAMIC_COPY: 0x88EA, BUFFER_SIZE: 0x8764, BUFFER_USAGE: 0x8765,
  FRONT: 0x0404, BACK: 0x0405, FRONT_AND_BACK: 0x0408, CULL_FACE: 0x0B44, BLEND: 0x0BE2, DITHER: 0x0BD0,
  STENCIL_TEST: 0x0B90, DEPTH_TEST: 0x0B71, SCISSOR_TEST: 0x0C11, POLYGON_OFFSET_FILL: 0x8037, RASTERIZER_DISCARD: 0x8C89,
  SAMPLE_ALPHA_TO_COVERAGE: 0x809E, SAMPLE_COVERAGE: 0x80A0, NO_ERROR: 0, INVALID_ENUM: 0x0500,
  INVALID_VALUE: 0x0501, INVALID_OPERATION: 0x0502, OUT_OF_MEMORY: 0x0505, CONTEXT_LOST_WEBGL: 0x9242,
  CW: 0x0900, CCW: 0x0901, LINE_WIDTH: 0x0B21, CULL_FACE_MODE: 0x0B45, FRONT_FACE: 0x0B46,
  DEPTH_RANGE: 0x0B70, DEPTH_WRITEMASK: 0x0B72, DEPTH_CLEAR_VALUE: 0x0B73, DEPTH_FUNC: 0x0B74,
  STENCIL_CLEAR_VALUE: 0x0B91, STENCIL_FUNC: 0x0B92, STENCIL_FAIL: 0x0B94, STENCIL_PASS_DEPTH_FAIL: 0x0B95,
  STENCIL_PASS_DEPTH_PASS: 0x0B96, STENCIL_REF: 0x0B97, STENCIL_VALUE_MASK: 0x0B93, STENCIL_WRITEMASK: 0x0B98,
  STENCIL_BACK_FUNC: 0x8800, STENCIL_BACK_FAIL: 0x8801, STENCIL_BACK_PASS_DEPTH_FAIL: 0x8802, STENCIL_BACK_PASS_DEPTH_PASS: 0x8803,
  STENCIL_BACK_REF: 0x8CA3, STENCIL_BACK_VALUE_MASK: 0x8CA4, STENCIL_BACK_WRITEMASK: 0x8CA5,
  VIEWPORT: 0x0BA2, SCISSOR_BOX: 0x0C10, COLOR_CLEAR_VALUE: 0x0C22, COLOR_WRITEMASK: 0x0C23,
  UNPACK_ALIGNMENT: 0x0CF5, UNPACK_ROW_LENGTH: 0x0CF2, UNPACK_SKIP_ROWS: 0x0CF3, UNPACK_SKIP_PIXELS: 0x0CF4,
  UNPACK_IMAGE_HEIGHT: 0x806E, UNPACK_SKIP_IMAGES: 0x806D, PACK_ALIGNMENT: 0x0D05, PACK_ROW_LENGTH: 0x0D02,
  PACK_SKIP_ROWS: 0x0D03, PACK_SKIP_PIXELS: 0x0D04, UNPACK_COLORSPACE_CONVERSION_WEBGL: 0x9243, BROWSER_DEFAULT_WEBGL: 0x9244,
  MAX_TEXTURE_SIZE: 0x0D33, MAX_VIEWPORT_DIMS: 0x0D3A, SUBPIXEL_BITS: 0x0D50, RED_BITS: 0x0D52, GREEN_BITS: 0x0D53,
  BLUE_BITS: 0x0D54, ALPHA_BITS: 0x0D55, DEPTH_BITS: 0x0D56, STENCIL_BITS: 0x0D57, POLYGON_OFFSET_UNITS: 0x2A00,
  POLYGON_OFFSET_FACTOR: 0x8038, TEXTURE_BINDING_2D: 0x8069, SAMPLE_BUFFERS: 0x80A8, SAMPLES: 0x80A9, SAMPLE_MASK_VALUE: 0x8E52,
  TEXTURE_2D: 0x0DE1, TEXTURE_3D: 0x806F, TEXTURE_2D_ARRAY: 0x8C1A, TEXTURE_CUBE_MAP: 0x8513, TEXTURE_BINDING_3D: 0x806A,
  TEXTURE_BINDING_2D_ARRAY: 0x8C1D, TEXTURE_BINDING_CUBE_MAP: 0x8514, TEXTURE_CUBE_MAP_POSITIVE_X: 0x8515, TEXTURE_CUBE_MAP_NEGATIVE_X: 0x8516,
  TEXTURE_CUBE_MAP_POSITIVE_Y: 0x8517, TEXTURE_CUBE_MAP_NEGATIVE_Y: 0x8518, TEXTURE_CUBE_MAP_POSITIVE_Z: 0x8519, TEXTURE_CUBE_MAP_NEGATIVE_Z: 0x851A,
  MAX_CUBE_MAP_TEXTURE_SIZE: 0x851C, MAX_3D_TEXTURE_SIZE: 0x8073, MAX_ARRAY_TEXTURE_LAYERS: 0x88FF, MAX_TEXTURE_LOD_BIAS: 0x84FD,
  ACTIVE_TEXTURE: 0x84E0, REPEAT: 0x2901, CLAMP_TO_EDGE: 0x812F, MIRRORED_REPEAT: 0x8370,
  TEXTURE_WRAP_S: 0x2802, TEXTURE_WRAP_T: 0x2803, TEXTURE_WRAP_R: 0x8072, TEXTURE_MAG_FILTER: 0x2800, TEXTURE_MIN_FILTER: 0x2801,
  TEXTURE_BASE_LEVEL: 0x813C, TEXTURE_MAX_LEVEL: 0x813D, TEXTURE_MIN_LOD: 0x813A, TEXTURE_MAX_LOD: 0x813B,
  TEXTURE_IMMUTABLE_LEVELS: 0x82DF, TEXTURE_IMMUTABLE_FORMAT: 0x912F, TEXTURE_COMPARE_MODE: 0x884C, TEXTURE_COMPARE_FUNC: 0x884D, COMPARE_REF_TO_TEXTURE: 0x884E,
  NEAREST: 0x2600, LINEAR: 0x2601, NEAREST_MIPMAP_NEAREST: 0x2700, LINEAR_MIPMAP_NEAREST: 0x2701, NEAREST_MIPMAP_LINEAR: 0x2702, LINEAR_MIPMAP_LINEAR: 0x2703,
  DEPTH_STENCIL: 0x84F9, UNSIGNED_INT_24_8: 0x84FA, DEPTH_COMPONENT16: 0x81A5, DEPTH_COMPONENT24: 0x81A6, DEPTH_COMPONENT32F: 0x8CAC,
  DEPTH24_STENCIL8: 0x88F0, DEPTH32F_STENCIL8: 0x8CAD, RENDERBUFFER: 0x8D41, MAX_RENDERBUFFER_SIZE: 0x84E8, RENDERBUFFER_SAMPLES: 0x8CAB,
  FRAMEBUFFER: 0x8D40, READ_FRAMEBUFFER: 0x8CA8, DRAW_FRAMEBUFFER: 0x8CA9, FRAMEBUFFER_BINDING: 0x8CA6, RENDERBUFFER_BINDING: 0x8CA7,
  READ_FRAMEBUFFER_BINDING: 0x8CAA, RGBA4: 0x8056, RGB5_A1: 0x8057, RGB565: 0x8D62, STENCIL_INDEX8: 0x8D48,
  RENDERBUFFER_WIDTH: 0x8D42, RENDERBUFFER_HEIGHT: 0x8D43, RENDERBUFFER_INTERNAL_FORMAT: 0x8D44, RENDERBUFFER_RED_SIZE: 0x8D50,
  RENDERBUFFER_GREEN_SIZE: 0x8D51, RENDERBUFFER_BLUE_SIZE: 0x8D52, RENDERBUFFER_ALPHA_SIZE: 0x8D53, RENDERBUFFER_DEPTH_SIZE: 0x8D54, RENDERBUFFER_STENCIL_SIZE: 0x8D55,
  FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE: 0x8CD0, FRAMEBUFFER_ATTACHMENT_OBJECT_NAME: 0x8CD1, FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL: 0x8CD2,
  FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE: 0x8CD3, FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER: 0x8CD4,
  COLOR_ATTACHMENT0: 0x8CE0, DEPTH_ATTACHMENT: 0x8D00, STENCIL_ATTACHMENT: 0x8D20, DEPTH_STENCIL_ATTACHMENT: 0x821A, NONE: 0,
  FRAMEBUFFER_COMPLETE: 0x8CD5, FRAMEBUFFER_INCOMPLETE_ATTACHMENT: 0x8CD6, FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: 0x8CD7,
  FRAMEBUFFER_INCOMPLETE_DIMENSIONS: 0x8CD9, FRAMEBUFFER_UNSUPPORTED: 0x8CDD, FRAMEBUFFER_INCOMPLETE_MULTISAMPLE: 0x8D56,
  MAX_COLOR_ATTACHMENTS: 0x8CDF, MAX_SAMPLES: 0x8D57, MAX_DRAW_BUFFERS: 0x8824,
  RGBA: 0x1908, RGB: 0x1907, RG: 0x8227, LUMINANCE_ALPHA: 0x190A, LUMINANCE: 0x1909, ALPHA: 0x1906, RED: 0x1903,
  RED_INTEGER: 0x8D94, RG_INTEGER: 0x8228, RGB_INTEGER: 0x8D98, RGBA_INTEGER: 0x8D99, SRGB: 0x8C40, SRGB8: 0x8C41,
  SRGB8_ALPHA8: 0x8C43, R8: 0x8229, RG8: 0x822B, RGB8: 0x8051, RGBA8: 0x8058, R8_SNORM: 0x8F94, RG8_SNORM: 0x8F95,
  RGB8_SNORM: 0x8F96, RGBA8_SNORM: 0x8F97, R8UI: 0x8232, RG8UI: 0x8238, RGB8UI: 0x8D7D, RGBA8UI: 0x8D7C,
  R8I: 0x8231, RG8I: 0x8237, RGB8I: 0x8D8F, RGBA8I: 0x8D8E, R16UI: 0x8234, RG16UI: 0x823A, RGBA16UI: 0x8D76,
  R16I: 0x8233, RG16I: 0x8239, RGBA16I: 0x8D8A, R32UI: 0x8236, RG32UI: 0x823C, RGBA32UI: 0x8D70, R32I: 0x8235,
  RG32I: 0x823B, RGBA32I: 0x8D82, R16F: 0x822D, RG16F: 0x822F, RGB16F: 0x881B, RGBA16F: 0x881A, R32F: 0x822E,
  RG32F: 0x8230, RGB32F: 0x8815, RGBA32F: 0x8814, R11F_G11F_B10F: 0x8C3A, RGB9_E5: 0x8C3D, RGB10_A2: 0x8059,
  RGB10_A2UI: 0x906F, RGB32UI: 0x8D71, RGB16UI: 0x8D77, RGB32I: 0x8D83, RGB16I: 0x8D89,
  UNSIGNED_BYTE: 0x1401, UNSIGNED_SHORT: 0x1403, UNSIGNED_INT: 0x1405, FLOAT: 0x1406, BYTE: 0x1400, SHORT: 0x1402,
  INT: 0x1404, HALF_FLOAT: 0x140B, UNSIGNED_SHORT_4_4_4_4: 0x8033, UNSIGNED_SHORT_5_5_5_1: 0x8034, UNSIGNED_SHORT_5_6_5: 0x8363,
  UNSIGNED_INT_2_10_10_10_REV: 0x8368, UNSIGNED_INT_10F_11F_11F_REV: 0x8C3B, UNSIGNED_INT_5_9_9_9_REV: 0x8C3E,
  FLOAT_32_UNSIGNED_INT_24_8_REV: 0x8DAD, HALF_FLOAT_OES: 0x8D61,
  FRAGMENT_SHADER: 0x8B30, VERTEX_SHADER: 0x8B31, SHADER_TYPE: 0x8B4F, DELETE_STATUS: 0x8B80, COMPILE_STATUS: 0x8B81,
  LINK_STATUS: 0x8B82, VALIDATE_STATUS: 0x8B83, INFO_LOG_LENGTH: 0x8B84, ATTACHED_SHADERS: 0x8B85, ACTIVE_UNIFORMS: 0x8B86,
  ACTIVE_UNIFORM_MAX_LENGTH: 0x8B87, SHADER_SOURCE_LENGTH: 0x8B88, ACTIVE_ATTRIBUTES: 0x8B89, ACTIVE_ATTRIBUTE_MAX_LENGTH: 0x8B8A,
  SHADING_LANGUAGE_VERSION: 0x8B8C, CURRENT_PROGRAM: 0x8B8D, COMPILE_STATUS_KHR: 0x8B81, SHADER_COMPILER: 0x8DFA,
  MAX_VERTEX_ATTRIBS: 0x8869, MAX_VERTEX_UNIFORM_VECTORS: 0x8DFB, MAX_VARYING_VECTORS: 0x8DFC, MAX_FRAGMENT_UNIFORM_VECTORS: 0x8DFD,
  MAX_VERTEX_TEXTURE_IMAGE_UNITS: 0x8B4C, MAX_TEXTURE_IMAGE_UNITS: 0x8872, MAX_COMBINED_TEXTURE_IMAGE_UNITS: 0x8B4D,
  MAX_FRAGMENT_UNIFORM_BLOCKS: 0x8A2D, MAX_VERTEX_UNIFORM_BLOCKS: 0x8A2B, MAX_COMBINED_UNIFORM_BLOCKS: 0x8A2E,
  MAX_UNIFORM_BUFFER_BINDINGS: 0x8A2F, MAX_UNIFORM_BLOCK_SIZE: 0x8A30, MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS: 0x8A31,
  MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS: 0x8A33, UNIFORM_BUFFER_OFFSET_ALIGNMENT: 0x8A34, UNIFORM_BUFFER: 0x8A11,
  UNIFORM_BUFFER_BINDING: 0x8A28, UNIFORM_BUFFER_START: 0x8A29, UNIFORM_BUFFER_SIZE: 0x8A2A, MAX_VERTEX_UNIFORM_COMPONENTS: 0x8B4A,
  MAX_FRAGMENT_UNIFORM_COMPONENTS: 0x8B49, MAX_VERTEX_OUTPUT_COMPONENTS: 0x9122, MAX_FRAGMENT_INPUT_COMPONENTS: 0x9125,
  MAX_VARYING_COMPONENTS: 0x8B4B, MAX_ELEMENT_INDEX: 0x8D6B, NUM_COMPRESSED_TEXTURE_FORMATS: 0x86A2, COMPRESSED_TEXTURE_FORMATS: 0x86A3,
  VENDOR: 0x1F00, RENDERER: 0x1F01, VERSION: 0x1F02, IMPLEMENTATION_COLOR_READ_TYPE: 0x8B9A, IMPLEMENTATION_COLOR_READ_FORMAT: 0x8B9B,
  VERTEX_ATTRIB_ARRAY_ENABLED: 0x8622, VERTEX_ATTRIB_ARRAY_SIZE: 0x8623, VERTEX_ATTRIB_ARRAY_STRIDE: 0x8624,
  VERTEX_ATTRIB_ARRAY_TYPE: 0x8625, VERTEX_ATTRIB_ARRAY_NORMALIZED: 0x886A, VERTEX_ATTRIB_ARRAY_POINTER: 0x8645,
  VERTEX_ATTRIB_ARRAY_BUFFER_BINDING: 0x889F, VERTEX_ATTRIB_ARRAY_INTEGER: 0x88FD, VERTEX_ATTRIB_ARRAY_DIVISOR: 0x88FE,
  TRANSFORM_FEEDBACK: 0x8E22, TRANSFORM_FEEDBACK_PAUSED: 0x8E23, TRANSFORM_FEEDBACK_ACTIVE: 0x8E24, TRANSFORM_FEEDBACK_BINDING: 0x8E25,
  INTERLEAVED_ATTRIBS: 0x8C8C, SEPARATE_ATTRIBS: 0x8C8D, PRIMITIVES_GENERATED: 0x8C87, TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN: 0x8C88,
  SAMPLES_PASSED: 0x8914, ANY_SAMPLES_PASSED: 0x8C2F, ANY_SAMPLES_PASSED_CONSERVATIVE: 0x8D6A,
  TIME_ELAPSED_EXT: 0x88BF, TIMESTAMP_EXT: 0x8E28, GPU_DISJOINT_EXT: 0x8FBB, QUERY_RESULT: 0x8866, QUERY_RESULT_AVAILABLE: 0x8867, CURRENT_QUERY: 0x8865,
  MAX_CLIENT_WAIT_TIMEOUT_WEBGL: 0x9247, SYNC_FENCE: 0x9116, SYNC_FLAGS: 0x9115, SYNC_STATUS: 0x9114, SYNC_CONDITION: 0x9113,
  OBJECT_TYPE: 0x9112, SYNC_GPU_COMMANDS_COMPLETE: 0x9117, ALREADY_SIGNALED: 0x911A, TIMEOUT_EXPIRED: 0x911B, CONDITION_SATISFIED: 0x911C,
  WAIT_FAILED: 0x911D, TIMEOUT_IGNORED: -1, TEXTURE_MAX_ANISOTROPY_EXT: 0x84FE, UNMASKED_VENDOR_WEBGL: 0x9245, UNMASKED_RENDERER_WEBGL: 0x9246,
  POINT_SIZE_RANGE: 0x0B12, ALIASED_POINT_SIZE_RANGE: 0x846D, ALIASED_LINE_WIDTH_RANGE: 0x846E, POLYGON_OFFSET_POINT: 0x2A01,
  POLYGON_OFFSET_LINE: 0x2A02, TEXTURE_FIXED_SAMPLE_LOCATIONS: 0x9101, TRANSFORM_FEEDBACK_VARYING_MAX_LENGTH: 0x8C76, TRANSFORM_FEEDBACK_VARYINGS: 0x8C83,
  NEVER: 0x0200, LESS: 0x0201, EQUAL: 0x0202, LEQUAL: 0x0203, GREATER: 0x0204, GEQUAL: 0x0205,
  NOTEQUAL: 0x0206, ALWAYS: 0x0207, KEEP: 0x1E00, REPLACE: 0x1E01, INCR: 0x1E02, DECR: 0x1E03,
  INVERT: 0x150A, INCR_WRAP: 0x8507, DECR_WRAP: 0x8508, DEPTH_COMPONENT: 0x1902, SYNC_FLUSH_COMMANDS_BIT: 0x00000001,
  LOW_FLOAT: 0x8DF0, MEDIUM_FLOAT: 0x8DF1, HIGH_FLOAT: 0x8DF2, LOW_INT: 0x8DF3, MEDIUM_INT: 0x8DF4, HIGH_INT: 0x8DF5,
  FLOAT_VEC2: 0x8B50, FLOAT_VEC3: 0x8B51, FLOAT_VEC4: 0x8B52, INT_VEC2: 0x8B53, INT_VEC3: 0x8B54, INT_VEC4: 0x8B55,
  BOOL: 0x8B56, BOOL_VEC2: 0x8B57, BOOL_VEC3: 0x8B58, BOOL_VEC4: 0x8B59, FLOAT_MAT2: 0x8B5A, FLOAT_MAT3: 0x8B5B,
  FLOAT_MAT4: 0x8B5C, SAMPLER_2D: 0x8B5E, SAMPLER_3D: 0x8B5F, SAMPLER_CUBE: 0x8B60, SAMPLER_2D_SHADOW: 0x8B62,
  SAMPLER_2D_ARRAY: 0x8DC1, SAMPLER_2D_ARRAY_SHADOW: 0x8DC4, SAMPLER_CUBE_SHADOW: 0x8DC5,
  UNSIGNED_INT_VEC2: 0x8DC6, UNSIGNED_INT_VEC3: 0x8DC7, UNSIGNED_INT_VEC4: 0x8DC8,
  INT_SAMPLER_2D: 0x8DCA, INT_SAMPLER_3D: 0x8DCB, INT_SAMPLER_CUBE: 0x8DCC, INT_SAMPLER_2D_ARRAY: 0x8DCF,
  UNSIGNED_INT_SAMPLER_2D: 0x8DD2, UNSIGNED_INT_SAMPLER_3D: 0x8DD3, UNSIGNED_INT_SAMPLER_CUBE: 0x8DD4,
  UNSIGNED_INT_SAMPLER_2D_ARRAY: 0x8DD7,
  UNPACK_FLIP_Y_WEBGL: 0x9240, UNPACK_PREMULTIPLY_ALPHA_WEBGL: 0x9241
};
for (var _ti = 0; _ti < 32; _ti++) C['TEXTURE' + _ti] = 0x84C0 + _ti; // TEXTURE0..TEXTURE31
for (var _ci = 1; _ci < 16; _ci++) C['COLOR_ATTACHMENT' + _ci] = 0x8CE0 + _ci; // 1..15
for (var _di = 0; _di < 16; _di++) C['DRAW_BUFFER' + _di] = 0x8825 + _di; // DRAW_BUFFER0..15

// Full WebGL2 IDL method surface (https://www.w3.org/TR/webgl2/); special
// cases below override where IDL semantics differ (identity, scratch, overloads).
var METHODS = (
  'activeTexture attachShader beginQuery beginTransformFeedback bindAttribLocation bindBuffer bindBufferBase bindBufferRange bindFramebuffer bindRenderbuffer bindSampler bindTexture bindTransformFeedback bindVertexArray blendColor blendEquation blendEquationSeparate blendFunc blendFuncSeparate blitFramebuffer bufferData bufferSubData checkFramebufferStatus clear clearBufferfi clearBufferfv clearBufferiv clearBufferuiv clearColor clearDepth clearStencil clientWaitSync colorMask compileShader compressedTexImage2D compressedTexImage3D compressedTexSubImage2D compressedTexSubImage3D copyBufferSubData copyTexImage2D copyTexSubImage2D copyTexSubImage3D createBuffer createFramebuffer createProgram createQuery createRenderbuffer createSampler createShader ' +
  'createTexture createTransformFeedback createVertexArray cullFace deleteBuffer deleteFramebuffer deleteProgram deleteQuery deleteRenderbuffer deleteSampler deleteShader deleteSync deleteTexture deleteTransformFeedback deleteVertexArray depthFunc depthMask depthRange detachShader disable disableVertexAttribArray drawArrays drawArraysInstanced drawBuffers drawElements drawElementsInstanced drawRangeElements enable enableVertexAttribArray endQuery endTransformFeedback fenceSync finish flush framebufferRenderbuffer framebufferTexture2D framebufferTextureLayer frontFace generateMipmap getActiveAttrib getActiveUniform getActiveUniformBlockName getActiveUniformBlockParameter getActiveUniforms getAttachedShaders getAttribLocation getBufferParameter ' +
  'getBufferSubData getCompressedTexImage getContextAttributes getError getExtension getFragDataLocation getFramebufferAttachmentParameter getIndexedBufferParameter getInternalformatParameter getParameter getProgramInfoLog getProgramParameter getQuery getQueryParameter getRenderbufferParameter getSamplerParameter getShaderInfoLog getShaderParameter getShaderPrecisionFormat getShaderSource getSupportedExtensions getSyncParameter getTexParameter getTransformFeedbackVarying getUniformBlockIndex getUniformLocation getUniformIndices getVertexAttrib getVertexAttribOffset hint invalidateFramebuffer invalidateSubFramebuffer isBuffer isContextLost isEnabled isFramebuffer isProgram isQuery isRenderbuffer isSampler isShader isSync isTexture isTransformFeedback ' +
  'isVertexArray lineWidth linkProgram makeXRCompatible pauseTransformFeedback pixelStorei polygonOffset readBuffer readPixels renderbufferStorage renderbufferStorageMultisample resumeTransformFeedback sampleCoverage samplerParameterf samplerParameteri scissor shaderSource stencilFunc stencilFuncSeparate stencilMask stencilMaskSeparate stencilOp stencilOpSeparate texImage2D texImage3D texParameterf texParameteri texStorage2D texStorage3D texSubImage2D texSubImage3D transformFeedbackVaryings uniform1f uniform1fv uniform1i uniform1iv uniform1ui uniform1uiv uniform2f uniform2fv uniform2i uniform2iv uniform2ui uniform2uiv uniform3f uniform3fv uniform3i uniform3iv uniform3ui uniform3uiv uniform4f uniform4fv uniform4i uniform4iv uniform4ui uniform4uiv uniformBlockBinding uniformMatrix2fv ' +
'uniformMatrix2x3fv uniformMatrix2x4fv uniformMatrix3fv uniformMatrix3x2fv uniformMatrix3x4fv uniformMatrix4fv uniformMatrix4x2fv uniformMatrix4x3fv useProgram validateProgram vertexAttrib1f vertexAttrib1fv vertexAttrib2f vertexAttrib2fv vertexAttrib3f vertexAttrib3fv vertexAttrib4f vertexAttrib4fv vertexAttribDivisor vertexAttribI4i vertexAttribI4iv vertexAttribI4ui vertexAttribI4uiv vertexAttribIPointer vertexAttribPointer viewport waitSync')
.split(' ');

function decodeUtf8(bytes) {
  // Minimal UTF-8 decode (scratch payloads are ASCII in practice).
  var s = '';
  for (var i = 0; i < bytes.length; i++) {
    var c = bytes[i];
    if (c < 0x80) { s += String.fromCharCode(c); }
    else if (c < 0xE0) { s += String.fromCharCode(((c & 31) << 6) | (bytes[++i] & 63)); }
    else if (c < 0xF0) { s += String.fromCharCode(((c & 15) << 12) | ((bytes[++i] & 63) << 6) | (bytes[++i] & 63)); }
    else { s += String.fromCharCode(((c & 15) << 18) | ((bytes[++i] & 63) << 12) | ((bytes[++i] & 63) << 6) | (bytes[++i] & 63)); }
  }
  return s;
}

function createFacade(canvas, attrs) {
  if (typeof g1 === 'undefined' || typeof G1 === 'undefined') {
    throw new Error('webgl.facade: g1 packer global not loaded');
  }
  // Chrome parity for the default framebuffer: antialias:false -> single
  // sample, antialias:true -> MSAA (~4x, like ANGLE/Chrome). Reported before
  // the first GL dispatch so the host builds the surface with a matching
  // EGL config (1B only; no-op on the web tier).
  if (typeof root !== 'undefined' && root.__jsr1b_set_samples) {
    root.__jsr1b_set_samples((attrs && attrs.antialias !== undefined ? !!attrs.antialias : true) ? 4 : 0);
  }
  // Depth/stencil parity (phase 7): Chrome allocates a depth buffer whenever
  // the context attributes don't say depth:false (three.js default depth:true)
  // and an 8-bit stencil when stencil:true. Reported with the samples above,
  // before the first GL dispatch (1B only; no-op on the web tier).
  if (typeof root !== 'undefined' && root.__jsr1b_set_depth) {
    root.__jsr1b_set_depth(attrs && attrs.depth !== undefined ? !!attrs.depth : true);
    root.__jsr1b_set_stencil(attrs && attrs.stencil !== undefined ? !!attrs.stencil : false);
  }
  attrs = attrs || {};
  function dflt(k, d) { return attrs[k] !== undefined ? !!attrs[k] : d; }
  var contextAttributes = {
    alpha: dflt('alpha', true), antialias: dflt('antialias', true), depth: dflt('depth', true),
    desynchronized: !!attrs.desynchronized, failIfMajorPerformanceCaveat: !!attrs.failIfMajorPerformanceCaveat,
    powerPreference: attrs.powerPreference || 'default', premultipliedAlpha: dflt('premultipliedAlpha', true),
    preserveDrawingBuffer: !!attrs.preserveDrawingBuffer, stencil: dflt('stencil', false), xrCompatible: !!attrs.xrCompatible
  };

  // Per-class wrapper caches: GL name (u32) -> wrapper, browser-style identity.
  function wclass() {
    function W(name) { Object.defineProperty(this, '__g1name', { value: name >>> 0 }); }
    W.prototype.toString = function () { return '[object ' + W.n + ']'; };
    var cache = new Map();
    return {
      wrap: function (name) {
        name = name >>> 0;
        if (name === 0) return null;
        var w = cache.get(name);
        if (!w) { w = new W(name); cache.set(name, w); }
        return w;
      },
      // Uniform locations are the one GL handle class where name 0 is VALID
      // (GL returns 0 for the first active uniform; only -1 means not found).
      wrapValid: function (name) {
        name = name >>> 0;
        var w = cache.get(name);
        if (!w) { w = new W(name); cache.set(name, w); }
        return w;
      },
      name: function (w) { return (w == null) ? 0 : (w.__g1name >>> 0); },
      ctor: W
    };
  }
  var classes = {};
  ['WebGLBuffer', 'WebGLFramebuffer', 'WebGLProgram', 'WebGLRenderbuffer', 'WebGLShader', 'WebGLTexture', 'WebGLTransformFeedback',
   'WebGLVertexArrayObject', 'WebGLSampler', 'WebGLQuery', 'WebGLSync', 'WebGLUniformLocation']
    .forEach(function (n) { classes[n] = wclass(); classes[n].ctor.n = n; });

  var stats = { used: Object.create(null), missing: Object.create(null), stubThrows: 0 };
  var attached = new Map(); // program name -> [shader wrapper...] for getAttachedShaders

  // __jsr1b_result: sync host fn -> base64 of the C scratch (a1b_gl_result).
  function fetchScratch() {
    var b64 = root.__jsr1b_result();
    return (typeof b64 === 'string') ? base64ToBytes(b64) : new Uint8Array(0);
  }
  function base64ToBytes(b64) {
    var bin = root.atob(b64), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function call(name, args) {
    stats.used[name] = (stats.used[name] || 0) + 1;
    var fn = g1[name];
    if (typeof fn !== 'function') {
      stats.missing[name] = (stats.missing[name] || 0) + 1;
      throw new Error('webgl.' + name + ': named unsupported');
    }
    try { return fn.apply(null, args); }
    catch (e) { if (e && /unsupported/.test(String(e && e.message))) stats.stubThrows++; throw e; }
  }
  function u(v) { return (v == null) ? 0 : (v.__g1name !== undefined ? v.__g1name : v); } // unwrap wrappers / null->0
  function viewOrZero(v) { return (v == null) ? 0 : v; } // typed arrays pass through to G1.blob; null data -> 0

  var gl = {};
  gl.canvas = canvas;
  gl.drawingBufferColorSpace = 'srgb';
  gl.unpackColorSpace = 'srgb';
  for (var cname in C) gl[cname] = C[cname]; // full WebGL2 constant table

  // --- generic delegation for the plain packer-shaped methods ---
  var CREATORS = { createBuffer: 'WebGLBuffer', createFramebuffer: 'WebGLFramebuffer', createProgram: 'WebGLProgram',
    createQuery: 'WebGLQuery', createRenderbuffer: 'WebGLRenderbuffer', createSampler: 'WebGLSampler', createShader: 'WebGLShader',
    createTexture: 'WebGLTexture', createTransformFeedback: 'WebGLTransformFeedback', createVertexArray: 'WebGLVertexArrayObject' };
  var VEC_SUFFIX = /^(uniform[1234][fiu]v|uniformMatrix[234](fv|x[234]fv)|vertexAttrib[1234]fv|vertexAttribI4[ui]v)$/;
  function vecArg(v, name) {
    if (v == null) return 0;
    if (typeof v === 'object' && v.constructor === Array) {
      return /uiv$/.test(name) ? new Uint32Array(v) : (/iv$/.test(name) ? new Int32Array(v) : new Float32Array(v));
    }
    return v;
  }
  var generic = {};
  METHODS.forEach(function (name) {
    if (['getParameter', 'getActiveUniform', 'getActiveAttrib', 'getShaderInfoLog', 'getProgramInfoLog',
         'getShaderSource', 'getShaderPrecisionFormat', 'getUniformLocation', 'getContextAttributes',
         'getExtension', 'getAttachedShaders', 'getBufferSubData', 'readPixels', 'makeXRCompatible',
         'isContextLost', 'getSupportedExtensions', 'attachShader', 'detachShader', 'getActiveUniformBlockName',
         'fenceSync', 'texImage2D', 'texSubImage2D', 'texImage3D', 'texSubImage3D'].indexOf(name) >= 0) return;
    generic[name] = function () {
      var a = new Array(arguments.length);
      for (var i = 0; i < a.length; i++) a[i] = u(arguments[i]);
      if (VEC_SUFFIX.test(name)) {
        // convert only the data argument (last); for uniformMatrix*fv that
        // is index 2 (index 1 is the transpose boolean).
        a[a.length - 1] = vecArg(a[a.length - 1], name);
      }
      var rc = call(name, a);
      if (Object.prototype.hasOwnProperty.call(CREATORS, name)) return classes[CREATORS[name]].wrap(rc >>> 0);
      return rc;
    };
  });
  for (var k in generic) gl[k] = generic[k];
  gl.fenceSync = function (condition, flags) {
    return classes.WebGLSync.wrap(call('fenceSync', [condition, flags]) >>> 0);
  };
  gl.getActiveUniformBlockName = function (program, index) {
    call('getActiveUniformBlockName', [u(program), index]);
    return decodeUtf8(fetchScratch());
  };

  // --- texImage* DOM-source overload normalization ---
  // three r186 uploads plain Texture/CanvasTexture via the DOM-source IDL
  // overloads (texSubImage2D(target, level, x, y, format, type, source) after
  // texStorage2D, texImage2D(target, level, ifmt, format, type, source)). The
  // corpus stubs carry decoded RGBA in source.data; expand to the numeric
  // (width/height/...) packer shape so the C decoder receives real dims.
  // UNPACK_FLIP_Y_WEBGL: the corpus image stubs hand top-down RGBA, so the
  // row flip the browser would apply inside texImage* is applied here on the
  // JS side (and the pname is dropped around the dispatch: no double flip if
  // the C side also honors it).
  var unpackFlipY = false;
  gl.pixelStorei = function (pname, param) {
    if (pname === C.UNPACK_FLIP_Y_WEBGL) unpackFlipY = !!param;
    return call('pixelStorei', [pname, param ? 1 : 0]);
  };
  function hasDomData(src) {
    return src && typeof src === 'object' && src.data && typeof src.data.byteLength === 'number' &&
      typeof src.width === 'number' && typeof src.height === 'number';
  }
  function flipDomRows(src) {
    var w = src.width | 0, h = src.height | 0, d = src.data;
    if (!unpackFlipY) return d;
    if (d.byteLength !== w * h * 4) return d; // only RGBA8 stub data is flipped here
    var out = new Uint8Array(d.byteLength), row = new Uint8Array(w * 4);
    for (var y = 0; y < h; y++) {
      var a = y * w * 4, b = (h - 1 - y) * w * 4;
      row.set(d.subarray(a, a + w * 4), 0);
      out.set(d.subarray(b, b + w * 4), a);
      out.set(row, b);
    }
    return out;
  }
  function domUpload(fn) {
    if (!unpackFlipY) return fn();
    call('pixelStorei', [C.UNPACK_FLIP_Y_WEBGL, 0]);
    var rc = fn();
    call('pixelStorei', [C.UNPACK_FLIP_Y_WEBGL, 1]);
    return rc;
  }
  gl.texImage2D = function (a0, a1, a2, a3, a4, a5, a6, a7, a8) {
    if (arguments.length === 6 && hasDomData(a5)) {
      return domUpload(function () {
        return call('texImage2D', [a0, a1, a2, a5.width, a5.height, 0, a3, a4, flipDomRows(a5)]);
      });
    }
    return call('texImage2D', [a0, a1, a2, a3, a4, a5, a6, a7, viewOrZero(a8)]);
  };
  gl.texSubImage2D = function (a0, a1, a2, a3, a4, a5, a6, a7, a8) {
    if (arguments.length === 7 && hasDomData(a6)) {
      return domUpload(function () {
        return call('texSubImage2D', [a0, a1, a2, a3, a6.width, a6.height, a4, a5, flipDomRows(a6)]);
      });
    }
    return call('texSubImage2D', [a0, a1, a2, a3, a4, a5, a6, a7, viewOrZero(a8)]);
  };
  gl.texImage3D = function (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    if (arguments.length === 10 && hasDomData(a9)) {
      return call('texImage3D', [a0, a1, a2, a9.width, a9.height, a9.depth || 1, 0, a7, a8, a9.data]);
    }
    return call('texImage3D', [a0, a1, a2, a3, a4, a5, a6, a7, a8, viewOrZero(a9)]);
  };
  gl.texSubImage3D = function (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    if (arguments.length === 11 && hasDomData(a10)) {
      return call('texSubImage3D', [a0, a1, a2, a3, a4, a10.width, a10.height, a10.depth || 1, a7, a8, a10.data]);
    }
    return call('texSubImage3D', [a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, viewOrZero(a10)]);
  };

  // --- special cases ---
  gl.getError = function () { return call('getError', []) | 0; };

  var STR_PNAME = {}; [C.VENDOR, C.RENDERER, C.VERSION, C.SHADING_LANGUAGE_VERSION, C.UNMASKED_VENDOR_WEBGL, C.UNMASKED_RENDERER_WEBGL]
    .forEach(function (p) { STR_PNAME[p] = 1; });
  var IVEC4_PNAME = {}; [C.VIEWPORT, C.SCISSOR_BOX].forEach(function (p) { IVEC4_PNAME[p] = 1; });
  var IVEC2_PNAME = {}; [C.MAX_VIEWPORT_DIMS].forEach(function (p) { IVEC2_PNAME[p] = 1; });
  var FVEC_PNAME = {}; [C.DEPTH_RANGE, C.POINT_SIZE_RANGE, C.ALIASED_POINT_SIZE_RANGE, C.ALIASED_LINE_WIDTH_RANGE, C.BLEND_COLOR, C.COLOR_CLEAR_VALUE]
    .forEach(function (p) { FVEC_PNAME[p] = 1; });
  var BOOL_PNAME = {}; [C.SHADER_COMPILER, C.SAMPLE_BUFFERS, C.DEPTH_WRITEMASK, C.STENCIL_WRITEMASK,
    C.UNPACK_COLORSPACE_CONVERSION_WEBGL].forEach(function (p) { BOOL_PNAME[p] = 1; });
  var BOOL_PAIR = {}; [C.COLOR_WRITEMASK, C.STENCIL_BACK_WRITEMASK, C.STENCIL_BACK_VALUE_MASK].forEach(function (p) { BOOL_PAIR[p] = 1; });

  gl.getParameter = function (pname) {
    var rc = call('getParameter', [pname]) >>> 0;
    if (STR_PNAME[pname]) return decodeUtf8(fetchScratch());
    if (IVEC4_PNAME[pname] || IVEC2_PNAME[pname] || FVEC_PNAME[pname] || BOOL_PAIR[pname] || pname === C.COMPRESSED_TEXTURE_FORMATS) {
      var bytes = fetchScratch();
      if (FVEC_PNAME[pname]) {
        var fv = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength >> 2), fa = [];
        for (var i = 0; i < fv.length; i++) fa.push(fv[i]);
        return fa;
      }
      var iv = new Int32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength >> 2), ia = [];
      for (var j = 0; j < iv.length; j++) ia.push(iv[j]);
      return ia;
    }
    if (BOOL_PNAME[pname]) return rc !== 0;
    return rc;
  };

  // getActiveUniform/Attrib scratch layout (locked ABI): [u32 nameLen][UTF-8
  // name][i32 size][u32 type] LE.
  function parseActive() {
    var b = fetchScratch();
    var nameLen = (b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >>> 0;
    var name = decodeUtf8(b.subarray(4, 4 + nameLen));
    var off = 4 + nameLen;
    var size = b[off] | (b[off + 1] << 8) | (b[off + 2] << 16) | (b[off + 3] << 24);
    var type = (b[off + 4] | (b[off + 5] << 8) | (b[off + 6] << 16) | (b[off + 7] << 24)) >>> 0;
    return { name: name, size: size, type: type };
  }
  gl.getActiveUniform = function (program, index) { call('getActiveUniform', [u(program), index]); return parseActive(); };
  gl.getActiveAttrib = function (program, index) { call('getActiveAttrib', [u(program), index]); return parseActive(); };

  gl.getShaderInfoLog = function (s) { call('getShaderInfoLog', [u(s)]); return decodeUtf8(fetchScratch()); };
  gl.getProgramInfoLog = function (p) { call('getProgramInfoLog', [u(p)]); return decodeUtf8(fetchScratch()); };
  gl.getShaderSource = function (s) { call('getShaderSource', [u(s)]); return decodeUtf8(fetchScratch()); };
  gl.getShaderPrecisionFormat = function (shType, precType) {
    call('getShaderPrecisionFormat', [shType, precType]);
    var iv = new Int32Array(fetchScratch().buffer, 0, 3);
    return { rangeMin: iv[0], rangeMax: iv[1], precision: iv[2] };
  };

  gl.getUniformLocation = function (program, name) {
    var rc = call('getUniformLocation', [u(program), name == null ? '' : String(name)]) | 0;
    return rc < 0 ? null : classes.WebGLUniformLocation.wrapValid(rc >>> 0);
  };
  gl.getAttribLocation = function (program, name) { return call('getAttribLocation', [u(program), String(name)]) | 0; };
  gl.getFragDataLocation = function (program, name) { return call('getFragDataLocation', [u(program), String(name)]) | 0; };

  gl.getAttachedShaders = function (program) {
    var list = attached.get(u(program));
    return list ? list.slice() : [];
  };
  gl.attachShader = function (program, shader) {
    var pn = u(program), sn = u(shader);
    var list = attached.get(pn) || [];
    if (list.indexOf(shader) < 0) list.push(shader);
    attached.set(pn, list);
    return call('attachShader', [pn, sn]);
  };
  gl.detachShader = function (program, shader) {
    var list = attached.get(u(program)) || [];
    var idx = list.indexOf(shader);
    if (idx >= 0) list.splice(idx, 1);
    return call('detachShader', [u(program), u(shader)]);
  };

  function copyScratchInto(view) { // shared by readPixels/getBufferSubData
    var b = fetchScratch();
    if (!view || !view.buffer) return;
    var n = Math.min(b.length, view.byteLength);
    var dst = new Uint8Array(view.buffer, view.byteOffset, n);
    for (var i = 0; i < n; i++) dst[i] = b[i];
  }
  gl.readPixels = function (x, y, w, h, format, type, pixels) {
    call('readPixels', [x, y, w, h, format, type]);
    copyScratchInto(pixels);
  };
  gl.getBufferSubData = function (target, srcByteOffset, dstBuffer) {
    // size-only convention: a number writes just the length (no byte upload).
    call('getBufferSubData', [target, srcByteOffset, dstBuffer ? dstBuffer.byteLength : 0]);
    copyScratchInto(dstBuffer);
  };

  var EXTENSIONS = {
    'EXT_color_buffer_float': {}, 'EXT_color_buffer_half_float': {}, 'OES_texture_float_linear': {},
    'EXT_float_blend': {}, 'KHR_parallel_shader_compile': { COMPLETION_STATUS_KHR: 0x91B1 },
    'WEBGL_debug_renderer_info': { UNMASKED_VENDOR_WEBGL: C.UNMASKED_VENDOR_WEBGL, UNMASKED_RENDERER_WEBGL: C.UNMASKED_RENDERER_WEBGL },
    'OES_element_index_uint': {} // WebGL2 has it natively; three still probes
  };
  gl.getExtension = function (name) {
    if (Object.prototype.hasOwnProperty.call(EXTENSIONS, name)) {
      if (typeof g1.getExtension === 'function') {
        var rc = call('getExtension', [name]) | 0;
        return rc !== 0 ? EXTENSIONS[name] : null; // honest: C-side availability bit
      }
      return EXTENSIONS[name]; // packer lacks the opcode: facade-side grant (documented)
    }
    return null; // never fake success
  };
  gl.getSupportedExtensions = function () { return Object.keys(EXTENSIONS); };

  // Non-GL-command IDL members.
  gl.getContextAttributes = function () {
    var a = contextAttributes;
    return { alpha: a.alpha, antialias: a.antialias, depth: a.depth, desynchronized: a.desynchronized, failIfMajorPerformanceCaveat: a.failIfMajorPerformanceCaveat,
      powerPreference: a.powerPreference, premultipliedAlpha: a.premultipliedAlpha, preserveDrawingBuffer: a.preserveDrawingBuffer, stencil: a.stencil, xrCompatible: a.xrCompatible };
  };
  gl.isContextLost = function () { return false; };
  gl.makeXRCompatible = function () { return Promise.resolve(); };

  // drawingBuffer size mirrors the canvas (spec: matches canvas bitmap size).
  Object.defineProperty(gl, 'drawingBufferWidth', { get: function () { return canvas.width | 0; } });
  Object.defineProperty(gl, 'drawingBufferHeight', { get: function () { return canvas.height | 0; } });

  // Default-FB MSAA (attrs.antialias): one-time infra dispatch; per-frame
  // resolve is C-side default-FB semantics in M3.
  if (contextAttributes.antialias && typeof g1.createRenderbuffer === 'function' && typeof g1.renderbufferStorageMultisample === 'function') {
    var msaaRbo = call('createRenderbuffer', []) >>> 0;
    if (msaaRbo) {
      call('bindRenderbuffer', [C.RENDERBUFFER, msaaRbo]);
      call('renderbufferStorageMultisample', [C.RENDERBUFFER, 4, C.RGBA8, canvas.width || 1, canvas.height || 1]);
      call('bindRenderbuffer', [C.RENDERBUFFER, 0]);
    }
  }

  gl.__stats = stats; // trace/diagnostics hook (not part of the IDL)
  return gl;
}

var api = { createFacade: createFacade, decodeUtf8: decodeUtf8, CONSTANTS: C };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
root.AngleWebGL2Facade = api;
})();
