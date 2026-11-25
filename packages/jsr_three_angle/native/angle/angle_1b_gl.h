// angle_1b_gl.h - internal minimal EGL/GLES3 declarations for the 1B shim.
//
// macOS ships no EGL/GLES SDK headers, and the shim loads ANGLE at runtime
// anyway, so the small set of types/constants/entry points it needs is
// declared here. `sym` in the X-lists is the exact dlsym name (ANGLE also
// exports internal GL_* spellings - always resolve the public gl*/egl*).
//
// M2: entry-point pointers and globals are `extern` here; the single
// definition lives in angle_1b.c. angle_1b_dispatch.c includes this header
// to share the same tables (no per-TU copies).
#ifndef ANGLE_1B_GL_H
#define ANGLE_1B_GL_H

#include <stddef.h>
#include <stdint.h>

#include <CoreFoundation/CoreFoundation.h>
#include <IOSurface/IOSurface.h>

typedef void *EGLDisplay; typedef void *EGLConfig; typedef void *EGLSurface;
typedef void *EGLContext; typedef void *EGLClientBuffer;
typedef int32_t EGLint; typedef unsigned EGLenum; typedef int EGLBoolean;
typedef intptr_t EGLAttrib;

#define EGL_NO_DISPLAY ((EGLDisplay)0)
#define EGL_NO_CONTEXT ((EGLContext)0)
#define EGL_NO_SURFACE ((EGLSurface)0)
#define EGL_DEFAULT_DISPLAY ((void *)0)
#define EGL_FALSE 0
#define EGL_TRUE 1
#define EGL_NONE 0x3038
#define EGL_VENDOR 0x3053
#define EGL_VERSION 0x3054
#define EGL_EXTENSIONS 0x3055
#define EGL_SURFACE_TYPE 0x3033
#define EGL_PBUFFER_BIT 0x0001
#define EGL_WINDOW_BIT 0x0004
#define EGL_RENDERABLE_TYPE 0x3040
#define EGL_OPENGL_ES3_BIT 0x00000040
#define EGL_RED_SIZE 0x3024
#define EGL_GREEN_SIZE 0x3023
#define EGL_BLUE_SIZE 0x3022
#define EGL_ALPHA_SIZE 0x3021
#define EGL_BIND_TO_TEXTURE_RGBA 0x3032
#define EGL_DEPTH_SIZE 0x3025
#define EGL_STENCIL_SIZE 0x3026
#define EGL_WIDTH 0x3057
#define EGL_HEIGHT 0x3056
#define EGL_TEXTURE_FORMAT 0x3080
#define EGL_TEXTURE_TARGET 0x3081
#define EGL_TEXTURE_RGBA 0x305E
#define EGL_TEXTURE_2D 0x305F
#define EGL_OPENGL_ES_API 0x30A0
#define EGL_CONTEXT_CLIENT_VERSION 0x3098
#define EGL_PLATFORM_ANGLE_ANGLE 0x3202
#define EGL_PLATFORM_ANGLE_TYPE_ANGLE 0x3203
#define EGL_PLATFORM_ANGLE_TYPE_METAL_ANGLE 0x3489
#define EGL_IOSURFACE_ANGLE 0x3454
#define EGL_IOSURFACE_PLANE_ANGLE 0x345A
#define EGL_TEXTURE_TYPE_ANGLE 0x345C
#define EGL_TEXTURE_INTERNAL_FORMAT_ANGLE 0x345D
#define GL_UNSIGNED_BYTE 0x1401
#define GL_BGRA_EXT 0x80E1
#define GL_RGBA 0x1908
#define A1B_MAX_SURFACES 16

typedef struct {
  int used;
  EGLSurface egl_surface;
  EGLContext ctx; // per-surface context (phase 7: depth/stencil configs are
                  // not eglMakeCurrent-compatible with the legacy context)
  IOSurfaceRef io;
  int width, height;
  int fallback; // 1 = pbuffer + CPU readback, 0 = direct IOSurface path
} a1b_surface_t;

// Shared state — defined once in angle_1b.c.
extern void *g_egl_lib, *g_gles_lib;
extern EGLDisplay g_display;
extern EGLConfig g_config;
extern EGLContext g_context;
extern int g_io_ext; // EGL_ANGLE_iosurface_client_buffer available
extern int g_current_valid; // a1b_make_current succeeded and no destroy since
extern int g_finish_flag; // post-swap glFinish (default 1)
extern char g_info_vendor[128], g_info_version[128], g_info_renderer[256];
extern a1b_surface_t g_surfaces[A1B_MAX_SURFACES];

// Entry-point tables. `sym` is the exact dlsym name (ANGLE also exports
// internal GL_* spellings — always resolve the public gl*/egl* ones).
#define A1B_EGL_LIST(X) \
  X(EGLint, EGLGetError, eglGetError, (void)) \
  X(EGLDisplay, GetDisplay, eglGetDisplay, (void *)) \
  X(EGLBoolean, Initialize, eglInitialize, (EGLDisplay, EGLint *, EGLint *)) \
  X(EGLBoolean, Terminate, eglTerminate, (EGLDisplay)) \
  X(const char *, QueryString, eglQueryString, (EGLDisplay, EGLint)) \
  X(EGLBoolean, ChooseConfig, eglChooseConfig, (EGLDisplay, const EGLint *, EGLConfig *, EGLint, EGLint *)) \
  X(EGLBoolean, BindAPI, eglBindAPI, (EGLenum)) \
  X(EGLContext, CreateContext, eglCreateContext, (EGLDisplay, EGLConfig, EGLContext, const EGLint *)) \
  X(EGLBoolean, DestroyContext, eglDestroyContext, (EGLDisplay, EGLContext)) \
  X(EGLSurface, CreatePbufferSurface, eglCreatePbufferSurface, (EGLDisplay, EGLConfig, const EGLint *)) \
  X(EGLSurface, CreatePbufferFromClientBuffer, eglCreatePbufferFromClientBuffer, (EGLDisplay, EGLenum, EGLClientBuffer, EGLConfig, const EGLint *)) \
  X(EGLBoolean, DestroySurface, eglDestroySurface, (EGLDisplay, EGLSurface)) \
  X(EGLBoolean, MakeCurrent, eglMakeCurrent, (EGLDisplay, EGLSurface, EGLSurface, EGLContext)) \
  X(EGLBoolean, SwapBuffers, eglSwapBuffers, (EGLDisplay, EGLSurface)) \
  X(EGLDisplay, GetPlatformDisplayEXT, eglGetPlatformDisplayEXT, (EGLenum, void *, const EGLint *)) \
  X(void *, GetProcAddress, eglGetProcAddress, (const char *))

// M1 core first, then the M2 G1 dispatch surface. Note the two ANGLE
// spellings that differ from the GLES3 names: glGetQueryObject{iv,ui64v}EXT
// (the non-EXT names are not exported) and glGetCompressedTexImageANGLE.
#define A1B_GL_LIST(X) \
  X(void, GenVertexArrays, glGenVertexArrays, (int, unsigned *)) \
  X(void, BindVertexArray, glBindVertexArray, (unsigned)) \
  X(void, DeleteVertexArrays, glDeleteVertexArrays, (int, const unsigned *)) \
  X(unsigned char, IsVertexArray, glIsVertexArray, (unsigned)) \
  X(void, GenBuffers, glGenBuffers, (int, unsigned *)) \
  X(void, DeleteBuffers, glDeleteBuffers, (int, const unsigned *)) \
  X(unsigned char, IsBuffer, glIsBuffer, (unsigned)) \
  X(void, BindBuffer, glBindBuffer, (unsigned, unsigned)) \
  X(void, BufferData, glBufferData, (unsigned, ptrdiff_t, const void *, unsigned)) \
  X(void, BufferSubData, glBufferSubData, (unsigned, ptrdiff_t, ptrdiff_t, const void *)) \
  X(void, CopyBufferSubData, glCopyBufferSubData, (unsigned, unsigned, ptrdiff_t, ptrdiff_t, ptrdiff_t)) \
  X(void, GetBufferParameteriv, glGetBufferParameteriv, (unsigned, unsigned, int *)) \
  X(void, BindBufferBase, glBindBufferBase, (unsigned, unsigned, unsigned)) \
  X(void, BindBufferRange, glBindBufferRange, (unsigned, unsigned, unsigned, ptrdiff_t, ptrdiff_t)) \
  X(void *, MapBufferRange, glMapBufferRange, (unsigned, ptrdiff_t, ptrdiff_t, unsigned)) \
  X(unsigned char, UnmapBuffer, glUnmapBuffer, (unsigned)) \
  X(void, GetIntegeri_v, glGetIntegeri_v, (unsigned, unsigned, int *)) \
  X(void, GetInteger64i_v, glGetInteger64i_v, (unsigned, unsigned, int64_t *)) \
  X(unsigned, CreateShader, glCreateShader, (unsigned)) \
  X(void, ShaderSource, glShaderSource, (unsigned, int, const char *const *, const int *)) \
  X(void, CompileShader, glCompileShader, (unsigned)) \
  X(void, DeleteShader, glDeleteShader, (unsigned)) \
  X(unsigned char, IsShader, glIsShader, (unsigned)) \
  X(void, GetShaderiv, glGetShaderiv, (unsigned, unsigned, int *)) \
  X(void, GetShaderInfoLog, glGetShaderInfoLog, (unsigned, int, int *, char *)) \
  X(void, GetShaderSource, glGetShaderSource, (unsigned, int, int *, char *)) \
  X(void, GetShaderPrecisionFormat, glGetShaderPrecisionFormat, (unsigned, unsigned, int *, int *)) \
  X(unsigned, CreateProgram, glCreateProgram, (void)) \
  X(void, DeleteProgram, glDeleteProgram, (unsigned)) \
  X(unsigned char, IsProgram, glIsProgram, (unsigned)) \
  X(void, AttachShader, glAttachShader, (unsigned, unsigned)) \
  X(void, DetachShader, glDetachShader, (unsigned, unsigned)) \
  X(void, LinkProgram, glLinkProgram, (unsigned)) \
  X(void, ValidateProgram, glValidateProgram, (unsigned)) \
  X(void, GetProgramiv, glGetProgramiv, (unsigned, unsigned, int *)) \
  X(void, GetProgramInfoLog, glGetProgramInfoLog, (unsigned, int, int *, char *)) \
  X(void, UseProgram, glUseProgram, (unsigned)) \
  X(void, BindAttribLocation, glBindAttribLocation, (unsigned, unsigned, const char *)) \
  X(int, GetAttribLocation, glGetAttribLocation, (unsigned, const char *)) \
  X(int, GetFragDataLocation, glGetFragDataLocation, (unsigned, const char *)) \
  X(void, GetActiveAttrib, glGetActiveAttrib, (unsigned, unsigned, int, int *, int *, unsigned *, char *)) \
  X(void, GetActiveUniform, glGetActiveUniform, (unsigned, unsigned, int, int *, int *, unsigned *, char *)) \
  X(int, GetUniformLocation, glGetUniformLocation, (unsigned, const char *)) \
  X(void, GetUniformIndices, glGetUniformIndices, (unsigned, int, const char *const *, unsigned *)) \
  X(void, GetActiveUniformsiv, glGetActiveUniformsiv, (unsigned, int, const unsigned *, unsigned, int *)) \
  X(unsigned, GetUniformBlockIndex, glGetUniformBlockIndex, (unsigned, const char *)) \
  X(void, GetActiveUniformBlockiv, glGetActiveUniformBlockiv, (unsigned, unsigned, unsigned, int *)) \
  X(void, GetActiveUniformBlockName, glGetActiveUniformBlockName, (unsigned, unsigned, int, int *, char *)) \
  X(void, UniformBlockBinding, glUniformBlockBinding, (unsigned, unsigned, unsigned)) \
  X(void, GetTransformFeedbackVarying, glGetTransformFeedbackVarying, (unsigned, unsigned, int, int *, int *, unsigned *, char *)) \
  X(void, TransformFeedbackVaryings, glTransformFeedbackVaryings, (unsigned, int, const char *const *, unsigned)) \
  X(void, Uniform1f, glUniform1f, (int, float)) \
  X(void, Uniform2f, glUniform2f, (int, float, float)) \
  X(void, Uniform3f, glUniform3f, (int, float, float, float)) \
  X(void, Uniform4f, glUniform4f, (int, float, float, float, float)) \
  X(void, Uniform1i, glUniform1i, (int, int)) \
  X(void, Uniform2i, glUniform2i, (int, int, int)) \
  X(void, Uniform3i, glUniform3i, (int, int, int, int)) \
  X(void, Uniform4i, glUniform4i, (int, int, int, int, int)) \
  X(void, Uniform1ui, glUniform1ui, (int, unsigned)) \
  X(void, Uniform2ui, glUniform2ui, (int, unsigned, unsigned)) \
  X(void, Uniform3ui, glUniform3ui, (int, unsigned, unsigned, unsigned)) \
  X(void, Uniform4ui, glUniform4ui, (int, unsigned, unsigned, unsigned, unsigned)) \
  X(void, Uniform1fv, glUniform1fv, (int, int, const float *)) \
  X(void, Uniform2fv, glUniform2fv, (int, int, const float *)) \
  X(void, Uniform3fv, glUniform3fv, (int, int, const float *)) \
  X(void, Uniform4fv, glUniform4fv, (int, int, const float *)) \
  X(void, Uniform1iv, glUniform1iv, (int, int, const int *)) \
  X(void, Uniform2iv, glUniform2iv, (int, int, const int *)) \
  X(void, Uniform3iv, glUniform3iv, (int, int, const int *)) \
  X(void, Uniform4iv, glUniform4iv, (int, int, const int *)) \
  X(void, Uniform1uiv, glUniform1uiv, (int, int, const unsigned *)) \
  X(void, Uniform2uiv, glUniform2uiv, (int, int, const unsigned *)) \
  X(void, Uniform3uiv, glUniform3uiv, (int, int, const unsigned *)) \
  X(void, Uniform4uiv, glUniform4uiv, (int, int, const unsigned *)) \
  X(void, UniformMatrix2fv, glUniformMatrix2fv, (int, unsigned char, int, const float *)) \
  X(void, UniformMatrix3fv, glUniformMatrix3fv, (int, unsigned char, int, const float *)) \
  X(void, UniformMatrix4fv, glUniformMatrix4fv, (int, unsigned char, int, const float *)) \
  X(void, UniformMatrix2x3fv, glUniformMatrix2x3fv, (int, unsigned char, int, const float *)) \
  X(void, UniformMatrix3x2fv, glUniformMatrix3x2fv, (int, unsigned char, int, const float *)) \
  X(void, UniformMatrix2x4fv, glUniformMatrix2x4fv, (int, unsigned char, int, const float *)) \
  X(void, UniformMatrix4x2fv, glUniformMatrix4x2fv, (int, unsigned char, int, const float *)) \
  X(void, UniformMatrix3x4fv, glUniformMatrix3x4fv, (int, unsigned char, int, const float *)) \
  X(void, UniformMatrix4x3fv, glUniformMatrix4x3fv, (int, unsigned char, int, const float *)) \
  X(void, GenTextures, glGenTextures, (int, unsigned *)) \
  X(void, DeleteTextures, glDeleteTextures, (int, const unsigned *)) \
  X(unsigned char, IsTexture, glIsTexture, (unsigned)) \
  X(void, BindTexture, glBindTexture, (unsigned, unsigned)) \
  X(void, ActiveTexture, glActiveTexture, (unsigned)) \
  X(void, TexImage2D, glTexImage2D, (unsigned, int, int, int, int, int, unsigned, unsigned, const void *)) \
  X(void, TexSubImage2D, glTexSubImage2D, (unsigned, int, int, int, int, int, unsigned, unsigned, const void *)) \
  X(void, TexImage3D, glTexImage3D, (unsigned, int, int, int, int, int, int, unsigned, unsigned, const void *)) \
  X(void, TexSubImage3D, glTexSubImage3D, (unsigned, int, int, int, int, int, int, int, unsigned, unsigned, const void *)) \
  X(void, CopyTexImage2D, glCopyTexImage2D, (unsigned, int, unsigned, int, int, int, int, int)) \
  X(void, CopyTexSubImage2D, glCopyTexSubImage2D, (unsigned, int, int, int, int, int, int, int)) \
  X(void, CopyTexSubImage3D, glCopyTexSubImage3D, (unsigned, int, int, int, int, int, int, int, int)) \
  X(void, TexParameteri, glTexParameteri, (unsigned, unsigned, int)) \
  X(void, TexParameterf, glTexParameterf, (unsigned, unsigned, float)) \
  X(void, GetTexParameteriv, glGetTexParameteriv, (unsigned, unsigned, int *)) \
  X(void, GetTexLevelParameteriv, glGetTexLevelParameteriv, (unsigned, int, unsigned, int *)) \
  X(void, TexStorage2D, glTexStorage2D, (unsigned, int, unsigned, int, int)) \
  X(void, TexStorage3D, glTexStorage3D, (unsigned, int, unsigned, int, int, int)) \
  X(void, GenerateMipmap, glGenerateMipmap, (unsigned)) \
  X(void, CompressedTexImage2D, glCompressedTexImage2D, (unsigned, int, unsigned, int, int, int, int, const void *)) \
  X(void, CompressedTexImage3D, glCompressedTexImage3D, (unsigned, int, unsigned, int, int, int, int, int, const void *)) \
  X(void, CompressedTexSubImage2D, glCompressedTexSubImage2D, (unsigned, int, int, int, int, int, unsigned, int, const void *)) \
  X(void, CompressedTexSubImage3D, glCompressedTexSubImage3D, (unsigned, int, int, int, int, int, int, int, unsigned, int, const void *)) \
  X(void, GetCompressedTexImage, glGetCompressedTexImageANGLE, (unsigned, int, void *)) \
  X(void, GetInternalformativ, glGetInternalformativ, (unsigned, unsigned, unsigned, int, int *)) \
  X(void, GenSamplers, glGenSamplers, (int, unsigned *)) \
  X(void, DeleteSamplers, glDeleteSamplers, (int, const unsigned *)) \
  X(unsigned char, IsSampler, glIsSampler, (unsigned)) \
  X(void, BindSampler, glBindSampler, (unsigned, unsigned)) \
  X(void, SamplerParameteri, glSamplerParameteri, (unsigned, unsigned, int)) \
  X(void, SamplerParameterf, glSamplerParameterf, (unsigned, unsigned, float)) \
  X(void, GetSamplerParameteriv, glGetSamplerParameteriv, (unsigned, unsigned, int *)) \
  X(void, EnableVertexAttribArray, glEnableVertexAttribArray, (unsigned)) \
  X(void, DisableVertexAttribArray, glDisableVertexAttribArray, (unsigned)) \
  X(void, VertexAttribPointer, glVertexAttribPointer, (unsigned, int, unsigned, unsigned char, int, const void *)) \
  X(void, VertexAttribIPointer, glVertexAttribIPointer, (unsigned, int, unsigned, int, const void *)) \
  X(void, VertexAttribDivisor, glVertexAttribDivisor, (unsigned, unsigned)) \
  X(void, VertexAttrib1f, glVertexAttrib1f, (unsigned, float)) \
  X(void, VertexAttrib2f, glVertexAttrib2f, (unsigned, float, float)) \
  X(void, VertexAttrib3f, glVertexAttrib3f, (unsigned, float, float, float)) \
  X(void, VertexAttrib4f, glVertexAttrib4f, (unsigned, float, float, float, float)) \
  X(void, VertexAttrib1fv, glVertexAttrib1fv, (unsigned, const float *)) \
  X(void, VertexAttrib2fv, glVertexAttrib2fv, (unsigned, const float *)) \
  X(void, VertexAttrib3fv, glVertexAttrib3fv, (unsigned, const float *)) \
  X(void, VertexAttrib4fv, glVertexAttrib4fv, (unsigned, const float *)) \
  X(void, VertexAttribI4i, glVertexAttribI4i, (unsigned, int, int, int, int)) \
  X(void, VertexAttribI4ui, glVertexAttribI4ui, (unsigned, unsigned, unsigned, unsigned, unsigned)) \
  X(void, VertexAttribI4iv, glVertexAttribI4iv, (unsigned, const int *)) \
  X(void, VertexAttribI4uiv, glVertexAttribI4uiv, (unsigned, const unsigned *)) \
  X(void, GetVertexAttribiv, glGetVertexAttribiv, (unsigned, unsigned, int *)) \
  X(void, GetVertexAttribPointerv, glGetVertexAttribPointerv, (unsigned, unsigned, void **)) \
  X(void, GenFramebuffers, glGenFramebuffers, (int, unsigned *)) \
  X(void, DeleteFramebuffers, glDeleteFramebuffers, (int, const unsigned *)) \
  X(unsigned char, IsFramebuffer, glIsFramebuffer, (unsigned)) \
  X(void, BindFramebuffer, glBindFramebuffer, (unsigned, unsigned)) \
  X(void, FramebufferTexture2D, glFramebufferTexture2D, (unsigned, unsigned, unsigned, unsigned, int)) \
  X(void, FramebufferTextureLayer, glFramebufferTextureLayer, (unsigned, unsigned, unsigned, int, int)) \
  X(void, FramebufferRenderbuffer, glFramebufferRenderbuffer, (unsigned, unsigned, unsigned, unsigned)) \
  X(void, GenRenderbuffers, glGenRenderbuffers, (int, unsigned *)) \
  X(void, DeleteRenderbuffers, glDeleteRenderbuffers, (int, const unsigned *)) \
  X(unsigned char, IsRenderbuffer, glIsRenderbuffer, (unsigned)) \
  X(void, BindRenderbuffer, glBindRenderbuffer, (unsigned, unsigned)) \
  X(void, RenderbufferStorage, glRenderbufferStorage, (unsigned, unsigned, int, int)) \
  X(void, RenderbufferStorageMultisample, glRenderbufferStorageMultisample, (unsigned, int, unsigned, int, int)) \
  X(void, GetRenderbufferParameteriv, glGetRenderbufferParameteriv, (unsigned, unsigned, int *)) \
  X(unsigned, CheckFramebufferStatus, glCheckFramebufferStatus, (unsigned)) \
  X(void, GetFramebufferAttachmentParameteriv, glGetFramebufferAttachmentParameteriv, (unsigned, unsigned, unsigned, int *)) \
  X(void, InvalidateFramebuffer, glInvalidateFramebuffer, (unsigned, int, const unsigned *)) \
  X(void, InvalidateSubFramebuffer, glInvalidateSubFramebuffer, (unsigned, int, const unsigned *, int, int, int, int)) \
  X(void, DrawBuffers, glDrawBuffers, (int, const unsigned *)) \
  X(void, ReadBuffer, glReadBuffer, (unsigned)) \
  X(void, BlitFramebuffer, glBlitFramebuffer, (int, int, int, int, int, int, int, int, unsigned, unsigned)) \
  X(void, DrawArrays, glDrawArrays, (unsigned, int, int)) \
  X(void, DrawElements, glDrawElements, (unsigned, int, unsigned, const void *)) \
  X(void, DrawArraysInstanced, glDrawArraysInstanced, (unsigned, int, int, int)) \
  X(void, DrawElementsInstanced, glDrawElementsInstanced, (unsigned, int, unsigned, const void *, int)) \
  X(void, DrawRangeElements, glDrawRangeElements, (unsigned, unsigned, unsigned, int, unsigned, const void *)) \
  X(void, Viewport, glViewport, (int, int, int, int)) \
  X(void, ClearColor, glClearColor, (float, float, float, float)) \
  X(void, ClearDepthf, glClearDepthf, (float)) \
  X(void, ClearStencil, glClearStencil, (int)) \
  X(void, Clear, glClear, (unsigned)) \
  X(void, ClearBufferfv, glClearBufferfv, (unsigned, int, const float *)) \
  X(void, ClearBufferiv, glClearBufferiv, (unsigned, int, const int *)) \
  X(void, ClearBufferuiv, glClearBufferuiv, (unsigned, int, const unsigned *)) \
  X(void, ClearBufferfi, glClearBufferfi, (unsigned, int, float, int)) \
  X(void, Enable, glEnable, (unsigned)) \
  X(void, Disable, glDisable, (unsigned)) \
  X(unsigned char, IsEnabled, glIsEnabled, (unsigned)) \
  X(void, LineWidth, glLineWidth, (float)) \
  X(void, PolygonOffset, glPolygonOffset, (float, float)) \
  X(void, DepthRangef, glDepthRangef, (float, float)) \
  X(void, DepthFunc, glDepthFunc, (unsigned)) \
  X(void, DepthMask, glDepthMask, (unsigned char)) \
  X(void, ColorMask, glColorMask, (unsigned char, unsigned char, unsigned char, unsigned char)) \
  X(void, CullFace, glCullFace, (unsigned)) \
  X(void, FrontFace, glFrontFace, (unsigned)) \
  X(void, Hint, glHint, (unsigned, unsigned)) \
  X(void, PixelStorei, glPixelStorei, (unsigned, int)) \
  X(void, BlendColor, glBlendColor, (float, float, float, float)) \
  X(void, BlendEquation, glBlendEquation, (unsigned)) \
  X(void, BlendEquationSeparate, glBlendEquationSeparate, (unsigned, unsigned)) \
  X(void, BlendFunc, glBlendFunc, (unsigned, unsigned)) \
  X(void, BlendFuncSeparate, glBlendFuncSeparate, (unsigned, unsigned, unsigned, unsigned)) \
  X(void, SampleCoverage, glSampleCoverage, (float, unsigned char)) \
  X(void, StencilFunc, glStencilFunc, (unsigned, int, unsigned)) \
  X(void, StencilFuncSeparate, glStencilFuncSeparate, (unsigned, unsigned, int, unsigned)) \
  X(void, StencilOp, glStencilOp, (unsigned, unsigned, unsigned)) \
  X(void, StencilOpSeparate, glStencilOpSeparate, (unsigned, unsigned, unsigned, unsigned)) \
  X(void, StencilMask, glStencilMask, (unsigned)) \
  X(void, StencilMaskSeparate, glStencilMaskSeparate, (unsigned, unsigned)) \
  X(void, Scissor, glScissor, (int, int, int, int)) \
  X(void, GetIntegerv, glGetIntegerv, (unsigned, int *)) \
  X(void, GetFloatv, glGetFloatv, (unsigned, float *)) \
  X(void, GetInteger64v, glGetInteger64v, (unsigned, int64_t *)) \
  X(void, GetBooleanv, glGetBooleanv, (unsigned, unsigned char *)) \
  X(const unsigned char *, GetString, glGetString, (unsigned)) \
  X(const unsigned char *, GetStringi, glGetStringi, (unsigned, unsigned)) \
  X(void *, FenceSync, glFenceSync, (unsigned, unsigned)) \
  X(unsigned, ClientWaitSync, glClientWaitSync, (void *, unsigned, uint64_t)) \
  X(void, WaitSync, glWaitSync, (void *, unsigned, uint64_t)) \
  X(void, DeleteSync, glDeleteSync, (void *)) \
  X(unsigned char, IsSync, glIsSync, (void *)) \
  X(void, GetSynciv, glGetSynciv, (void *, unsigned, int, int *, int *)) \
  X(void, GenQueries, glGenQueries, (int, unsigned *)) \
  X(void, DeleteQueries, glDeleteQueries, (int, const unsigned *)) \
  X(unsigned char, IsQuery, glIsQuery, (unsigned)) \
  X(void, BeginQuery, glBeginQuery, (unsigned, unsigned)) \
  X(void, EndQuery, glEndQuery, (unsigned)) \
  X(void, GetQueryiv, glGetQueryiv, (unsigned, unsigned, int *)) \
  X(void, GetQueryObjectivEXT, glGetQueryObjectivEXT, (unsigned, unsigned, int *)) \
  X(void, GetQueryObjectui64vEXT, glGetQueryObjectui64vEXT, (unsigned, unsigned, uint64_t *)) \
  X(void, GenTransformFeedbacks, glGenTransformFeedbacks, (int, unsigned *)) \
  X(void, DeleteTransformFeedbacks, glDeleteTransformFeedbacks, (int, const unsigned *)) \
  X(unsigned char, IsTransformFeedback, glIsTransformFeedback, (unsigned)) \
  X(void, BindTransformFeedback, glBindTransformFeedback, (unsigned, unsigned)) \
  X(void, BeginTransformFeedback, glBeginTransformFeedback, (unsigned)) \
  X(void, EndTransformFeedback, glEndTransformFeedback, (void)) \
  X(void, PauseTransformFeedback, glPauseTransformFeedback, (void)) \
  X(void, ResumeTransformFeedback, glResumeTransformFeedback, (void)) \
  X(void, Flush, glFlush, (void)) \
  X(void, Finish, glFinish, (void)) \
  X(void, ReadPixels, glReadPixels, (int, int, int, int, unsigned, unsigned, void *)) \
  X(unsigned, GetError, glGetError, (void))

// extern declarations of every entry-point pointer (defined in angle_1b.c).
#define A1B_PTR_DECL(rett, name, sym, args) extern rett (*g_##name) args;
A1B_EGL_LIST(A1B_PTR_DECL)
A1B_GL_LIST(A1B_PTR_DECL)
#undef A1B_PTR_DECL

#endif // ANGLE_1B_GL_H
