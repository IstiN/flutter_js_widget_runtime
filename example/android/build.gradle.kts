allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

// F3a Android (issue #7): classpath access for the flutter_js alignment
// block below (the Kotlin Gradle Plugin version must match the one the
// settings file resolves: org.jetbrains.kotlin.android 2.4.0).
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:2.4.0")
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

// F3a Android (issue #7): flutter_js 0.8.7 compiles its Java sources with
// target 11 while its Kotlin tasks stay on the 1.8 default; Kotlin 2.4 (the
// template toolchain) turns that mismatch into a hard configuration
// failure. Raise flutter_js's Kotlin to 11 to match its Java (the root
// cause lives upstream — drop this block when flutter_js migrates to
// built-in Kotlin).
subprojects {
    if (name == "flutter_js") {
        afterEvaluate {
            tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>()
                .configureEach {
                    compilerOptions.jvmTarget.set(
                        org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_11,
                    )
                }
        }
    }
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
