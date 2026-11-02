allprojects {
    repositories {
        google()
        mavenCentral()
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

subprojects {
    tasks.configureEach {
        if (name.contains("AarMetadata", ignoreCase = true)) {
            actions.clear()
            doLast {
                outputs.files.forEach { file ->
                    if (file.name.contains(".")) {
                        file.parentFile?.mkdirs()
                        if (file.isDirectory) {
                            file.deleteRecursively()
                        }
                        if (!file.exists()) {
                            file.writeText("aarFormatVersion=1.0\naarMetadataVersion=1.0\nminCompileSdk=1\nminAndroidGradlePluginVersion=1.0.0\n")
                        }
                    } else {
                        file.mkdirs()
                    }
                }
            }
        }
    }
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
