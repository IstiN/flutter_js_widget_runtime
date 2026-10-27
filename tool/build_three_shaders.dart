import 'dart:convert';
import 'dart:io';

const _bundleName = 'three_r1';

Future<void> main() async {
  final root = _findPackageRoot(Directory.current);
  final shaders = Directory.fromUri(root.uri.resolve('shaders/'));
  final output = File.fromUri(
    root.uri.resolve('assets/three/$_bundleName.shaderbundle'),
  );
  final vertex = File.fromUri(shaders.uri.resolve('$_bundleName.vert'));
  final fragment = File.fromUri(shaders.uri.resolve('$_bundleName.frag'));
  final shadowFragment = File.fromUri(
    shaders.uri.resolve('${_bundleName}_shadow.frag'),
  );
  for (final source in [vertex, fragment, shadowFragment]) {
    if (!source.existsSync()) {
      throw StateError('Missing shader source: ${source.path}');
    }
  }

  final impellerc = _findImpellerc();
  output.parent.createSync(recursive: true);
  final temporary = File('${output.path}.tmp');
  final description = <String, Object>{
    'ThreeR1ShadowFragment': <String, String>{
      'type': 'fragment',
      'file': shadowFragment.absolute.path,
    },
    'ThreeR1Fragment': <String, String>{
      'type': 'fragment',
      'file': fragment.absolute.path,
    },
    'ThreeR1Vertex': <String, String>{
      'type': 'vertex',
      'file': vertex.absolute.path,
    },
  };
  final result = await Process.run(impellerc.absolute.path, <String>[
    '--sl=${temporary.absolute.path}',
    '--shader-bundle=${jsonEncode(description)}',
    '--include=${shaders.absolute.path}',
    '--include=${impellerc.parent.uri.resolve('shader_lib/').toFilePath()}',
  ], workingDirectory: root.path);
  stdout.write(result.stdout);
  stderr.write(result.stderr);
  if (result.exitCode != 0) {
    if (temporary.existsSync()) {
      temporary.deleteSync();
    }
    throw ProcessException(
      impellerc.path,
      <String>['--shader-bundle'],
      'impellerc failed',
      result.exitCode,
    );
  }
  temporary.renameSync(output.path);
  stdout.writeln('Built ${output.path}');
}

Directory _findPackageRoot(Directory start) {
  var directory = start.absolute;
  while (true) {
    if (File.fromUri(directory.uri.resolve('pubspec.yaml')).existsSync() &&
        File.fromUri(
          directory.uri.resolve('shaders/$_bundleName.vert'),
        ).existsSync()) {
      return directory;
    }
    final parent = directory.parent;
    if (parent.path == directory.path) {
      throw StateError('Run from the js_widget_runtime package checkout.');
    }
    directory = parent;
  }
}

File _findImpellerc() {
  final configured = Platform.environment['IMPELLERC'];
  if (configured != null && configured.isNotEmpty) {
    final file = File(configured);
    if (!file.existsSync()) {
      throw StateError('IMPELLERC does not exist: $configured');
    }
    return file.absolute;
  }

  final executable = Uri.file(Platform.resolvedExecutable);
  final segments = executable.pathSegments;
  for (var i = segments.length - 1; i >= 0; i--) {
    if (segments[i] != 'dart-sdk' && segments[i] != 'artifacts') {
      continue;
    }
    final cache = executable.replace(
      pathSegments: <String>[...segments.sublist(0, i), ''],
    );
    final host = switch (Platform.operatingSystem) {
      'macos' => 'darwin-x64/impellerc',
      'linux' => 'linux-x64/impellerc',
      'windows' => 'windows-x64/impellerc.exe',
      _ => null,
    };
    if (host != null) {
      final candidate = File.fromUri(cache.resolve('artifacts/engine/$host'));
      if (candidate.existsSync()) {
        return candidate.absolute;
      }
    }
  }
  throw StateError(
    'Unable to locate impellerc. Use the Flutter Dart SDK or set IMPELLERC.',
  );
}
