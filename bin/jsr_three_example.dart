import 'dart:io';

const _examples = <String>{
  'webgl_geometry_minecraft',
  'webgl_geometry_colors',
  'webgl_lines_colors',
};

/// Prepares generated widgets from a pinned, local three.js source tree.
Future<void> main(List<String> arguments) async {
  if (arguments.length == 1 &&
      (arguments.single == '--help' || arguments.single == '-h')) {
    _usage();
    return;
  }
  if (arguments.length < 2 ||
      arguments[0] != 'prepare' ||
      !_examples.contains(arguments[1])) {
    stderr.writeln('Expected: prepare <supported official example>');
    _usage(stderr);
    exitCode = 64;
    return;
  }

  final script = File.fromUri(Platform.script).absolute;
  final root = script.parent.parent;
  final helper = File(
    '${root.path}${Platform.pathSeparator}tool${Platform.pathSeparator}'
    'three_example${Platform.pathSeparator}prepare.mjs',
  );
  if (!helper.existsSync()) {
    stderr.writeln(
      'Cannot locate ${helper.path}; run from the package checkout.',
    );
    exitCode = 1;
    return;
  }

  try {
    final process = await Process.start(
      'node',
      <String>[helper.path, ...arguments.skip(1)],
      workingDirectory: root.path,
      mode: ProcessStartMode.inheritStdio,
    );
    exitCode = await process.exitCode;
  } on ProcessException catch (error) {
    stderr.writeln('Unable to run Node.js: ${error.message}');
    exitCode = 1;
  }
}

void _usage([IOSink? sink]) {
  (sink ?? stdout).writeln(
    'Usage: dart run bin/jsr_three_example.dart prepare '
    '<webgl_geometry_minecraft|webgl_geometry_colors|webgl_lines_colors> '
    '[--source <three-r186-dir>] [--offline] [--verify]\n'
    'THREE_SRC may supply the source directory. Resolution is always local-only.',
  );
}
