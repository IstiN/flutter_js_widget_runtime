import 'package:flutter_test/flutter_test.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

import 'runner_fixture.dart';

/// flutter_js_widget_runtime#13: `jsr.secrets.*` and `jsr.loadAsset`
/// promises never resolved on the conformance runner — the secrets handlers
/// were stubbed out and the round trip hung on the pre-fetch screen. The
/// runner now serves in-memory secrets and reads assets from the fixture
/// directory (the default appDir handler).
void main() {
  if (!QuickjsFfi.isAvailable) {
    return; // CI builds the bridge first (see pr.yml job conformance).
  }

  testWidgets('secrets set/get round trip resolves', (tester) async {
    final result = await runInlineFixture(
      tester,
      id: 'issue13_secrets',
      meta: <String, dynamic>{'capabilities': <String>['secrets']},
      widgetJs: '''
(function() {
  jsr.render({type: 'text', data: 'secret: (none)'});
  jsr.secrets.set('api.token', 's3cret').then(function() {
    return jsr.secrets.get('api.token');
  }).then(function(value) {
    jsr.setTitle('secret ok: ' + (value === 's3cret'));
    jsr.render({type: 'text', data: 'secret: ' + (value === 's3cret')});
  });
})();
''',
    );

    final trace = (result['trace'] as List).cast<String>();
    expect(trace, containsAll(<String>['secrets_set', 'secrets_get']));
    expect(result['title'], 'secret ok: true');
  });

  testWidgets('loadAsset reads the fixture directory', (tester) async {
    final result = await runInlineFixture(
      tester,
      id: 'issue13_assets',
      meta: <String, dynamic>{'capabilities': <String>['assets']},
      widgetJs: '''
(function() {
  jsr.render({type: 'text', data: 'asset: (missing)'});
  jsr.loadAsset('data.txt').then(function(text) {
    jsr.setTitle('asset: ' + String(text).trim());
    jsr.render({type: 'text', data: 'asset says: ' + String(text).trim()});
  });
})();
''',
      files: <String, String>{'data.txt': 'asset payload 7\n'},
    );

    final trace = (result['trace'] as List).cast<String>();
    expect(trace, contains('load_asset'));
    expect(result['title'], 'asset: asset payload 7');
  });
}
