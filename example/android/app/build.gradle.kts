plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "dev.fa1.jsr_example"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        applicationId = "dev.fa1.jsr_example"
        // Plan F3: Android minSdk 24; the 1B selection probe (d) additionally
        // requires API >= 28 (ADR-0003) — enforced in Dart, not here.
        minSdk = 24
        targetSdk = flutter.targetSdkVersion
        // Uses the version code from pubspec.yaml. When using split APKs, 1000 * ABI_VERSION
        // is added automatically by Flutter. (https://developer.android.com/studio/build/configure-apk-splits#configure-APK-versions)
        // You can force using the value of versionCode by specifying the `-P force-version-code-ignoring-abi=true`
        // flag during build.
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        release {
            // TODO: Add your own signing config for the release build.
            // Signing with the debug keys for now, so `flutter run --release` works.
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    sourceSets {
        // F3a Android: the pinned ANGLE libraries (libEGL_angle.so,
        // libGLESv2_angle.so) and the libangle_1b.so shim are staged per ABI
        // into example/build/angle-jniLibs by tool/stage_angle_android.sh
        // (CI job angle-android). The directory is inside the gitignored
        // build/ tree — binaries are never committed (REG-SUPPLY-1).
        getByName("main").jniLibs.srcDir(File(rootDir, "../build/angle-jniLibs"))
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
