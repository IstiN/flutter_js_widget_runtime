import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/hosts/flame_3d_host.dart'
    show Js3dUrlGlbParser;

Uint8List _syntheticGlb() {
  final json = utf8.encode('{"asset":{"version":"2.0"}}');
  // Pad the JSON chunk to 4 bytes with spaces, per the glTF spec.
  final padded = Uint8List((json.length + 3) & ~3);
  padded.setRange(0, json.length, json);
  for (var i = json.length; i < padded.length; i++) {
    padded[i] = 0x20;
  }
  final total = 12 + 8 + padded.length;
  final out = BytesBuilder();
  out.add(utf8.encode('glTF'));
  out.add(_u32(2));
  out.add(_u32(total));
  out.add(_u32(padded.length));
  out.add(utf8.encode('JSON'));
  out.add(padded);
  return out.takeBytes();
}

Uint8List _u32(int v) =>
    (ByteData(4)..setUint32(0, v, Endian.little)).buffer.asUint8List();

void main() {
  test('Js3dUrlGlbParser walks a synthetic GLB container', () {
    final glb = Js3dUrlGlbParser.parseGlbBytes(
      _syntheticGlb(),
      'https://x.test/model.glb',
    );
    expect(glb.version, 2);
    expect(glb.prefix, 'https://x.test/');
    expect(glb.jsonChunk()['asset'], isA<Map>());
  });

  test('Js3dUrlGlbParser rejects a bad magic number', () {
    final bytes = Uint8List.fromList([
      ...utf8.encode('NOPE'),
      ..._u32(2), ..._u32(12),
    ]);
    expect(
      () => Js3dUrlGlbParser.parseGlbBytes(bytes, 'https://x.test/m.glb'),
      throwsA(isA<Exception>()),
    );
  });

  group('non-URL resolution order', () {
    tearDown(() => Js3dUrlGlbParser.fileBytesLoader = null);

    test('fileBytesLoader bytes win over everything else', () async {
      Js3dUrlGlbParser.fileBytesLoader =
          (src) async => src == 'apps/x/coach.glb' ? _syntheticGlb() : null;
      final glb = await Js3dUrlGlbParser().parseGlb('apps/x/coach.glb');
      expect(glb.prefix, 'apps/x/');
      expect(glb.jsonChunk()['asset'], isA<Map>());
    });

    test('loader null falls through to a real local file', () async {
      Js3dUrlGlbParser.fileBytesLoader = (_) async => null;
      final tmp = File(
        '${Directory.systemTemp.path}/jsr_test_model.glb',
      );
      tmp.writeAsBytesSync(_syntheticGlb());
      addTearDown(() => tmp.deleteSync());
      final glb = await Js3dUrlGlbParser().parseGlb(tmp.path);
      expect(glb.jsonChunk()['asset'], isA<Map>());
      // file:// scheme is stripped before the filesystem read.
      final viaScheme = await Js3dUrlGlbParser().parseGlb('file://${tmp.path}');
      expect(viaScheme.jsonChunk()['asset'], isA<Map>());
    });

    test('no loader and no local file delegates to the asset parser', () async {
      // The stock asset-bundle parser throws on a missing asset — proof we
      // reached the delegate branch rather than returning early.
      await expectLater(
        Js3dUrlGlbParser().parseGlb('no/such/file.glb'),
        throwsA(anything),
      );
    });
  });
}
