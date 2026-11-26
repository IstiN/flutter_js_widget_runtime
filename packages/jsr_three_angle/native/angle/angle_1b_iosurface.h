// angle_1b_iosurface.h — IOSurface include with an iOS SDK fallback (F3b).
//
// The macOS SDK ships <IOSurface/IOSurface.h> inside IOSurface.framework.
// The iPhoneOS SDK does not (verified Xcode 16.4 / iPhoneOS18.5, CI run
// 45753628959: the framework bundle carries no public headers), although
// the C API itself is public, documented and ABI-stable on iOS since
// iOS 11 — the symbols live in IOSurface.framework and resolve when the
// app loads the shim next to it. In that case declare the exact subset
// the shim uses, mirroring <IOSurface/IOSurface.h> 1:1. Force the
// fallback on any platform with -DA1B_IOS_SDK_NO_PUBLIC_HEADER (tests).
#ifndef ANGLE_1B_IOSURFACE_H
#define ANGLE_1B_IOSURFACE_H

#if !defined(A1B_IOS_SDK_NO_PUBLIC_HEADER) && __has_include(<IOSurface/IOSurface.h>)
#include <IOSurface/IOSurface.h>
#else
#include <CoreFoundation/CoreFoundation.h>
#include <mach/kern_return.h>

typedef struct CF_BRIDGED_TYPE(id) __IOSurface *IOSurfaceRef;
typedef uint32_t IOSurfaceID;

extern CFStringRef kIOSurfaceWidth;
extern CFStringRef kIOSurfaceHeight;
extern CFStringRef kIOSurfacePixelFormat;
extern CFStringRef kIOSurfaceBytesPerElement;
extern CFStringRef kIOSurfaceBytesPerRow;
extern CFStringRef kIOSurfaceAllocSize;

IOSurfaceRef IOSurfaceCreate(CFDictionaryRef properties);
IOSurfaceRef IOSurfaceLookup(IOSurfaceID cSid);
IOSurfaceID IOSurfaceGetID(IOSurfaceRef surface);
size_t IOSurfaceAlignProperty(CFStringRef property, size_t value);
size_t IOSurfaceGetBytesPerRow(IOSurfaceRef surface);
void *IOSurfaceGetBaseAddress(IOSurfaceRef surface);
kern_return_t IOSurfaceLock(IOSurfaceRef surface, uint32_t options, uint32_t *seed);
kern_return_t IOSurfaceUnlock(IOSurfaceRef surface, uint32_t options, uint32_t *seed);

#endif
#endif
