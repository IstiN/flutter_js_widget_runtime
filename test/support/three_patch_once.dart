import 'package:flutter_test/flutter_test.dart';

/// Structural, name-independent patch anchors: the widget bundle is
/// re-minified on every prepare, so exact minified identifiers drift. Every
/// patch is guarded to match exactly once and fails loud otherwise.
String patchOnce(
  String source,
  String label,
  RegExp re,
  String Function(Match) build,
) {
  final matches = re.allMatches(source).toList();
  expect(
    matches,
    hasLength(1),
    reason: '$label anchor drifted after a re-prepare: $re',
  );
  return source.replaceRange(
    matches.single.start,
    matches.single.end,
    build(matches.single),
  );
}
