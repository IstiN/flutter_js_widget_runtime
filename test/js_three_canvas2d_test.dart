import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/flutter_gpu_three_host.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_host.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';

Map<String, dynamic> _request({
  String engineId = 'engine-a',
  String surfaceId = 'main#1',
  String canvasId = '2d-1',
  int generation = 1,
  int requestId = 1,
  int width = 16,
  int height = 16,
  String action = 'rasterize',
  List<Object?>? commands,
}) => {
  'engineId': engineId,
  'surfaceId': surfaceId,
  'canvasId': canvasId,
  'generation': generation,
  'requestId': requestId,
  'width': width,
  'height': height,
  'action': action,
  'commands': commands ??
      [
        {
          'op': 'fillRect',
          'x': 0,
          'y': 0,
          'width': width,
          'height': height,
          'style': {
            'kind': 'radial',
            'centerX': width / 2,
            'centerY': height / 2,
            'radius': width / 2,
            'stops': [
              {'offset': 0.1, 'color': 'rgba(210,210,210,1)'},
              {'offset': 1, 'color': 'rgba(255,255,255,1)'},
            ],
          },
        },
      ],
};

Uint8List _pixels(int width, int height, int value) {
  final result = Uint8List(width * height * 4);
  for (var offset = 0; offset < result.length; offset += 4) {
    result[offset] = value;
    result[offset + 1] = value;
    result[offset + 2] = value;
    result[offset + 3] = 255;
  }
  return result;
}

Uint8List _disposePacket(String engine, String surface) {
  final engineBytes = utf8.encode(engine);
  final surfaceBytes = utf8.encode(surface);
  final header = 32 + engineBytes.length + surfaceBytes.length;
  final out = Uint8List(header + 20);
  final data = ByteData.sublistView(out);
  out.setAll(0, ascii.encode('JSR3'));
  out[4] = 1;
  out[5] = 1;
  data.setUint16(6, header, Endian.little);
  data.setUint32(8, 1, Endian.little);
  data.setUint32(12, 20, Endian.little);
  data.setUint16(16, engineBytes.length, Endian.little);
  data.setUint16(18, surfaceBytes.length, Endian.little);
  data.setUint32(24, out.length, Endian.little);
  out.setAll(32, engineBytes);
  out.setAll(32 + engineBytes.length, surfaceBytes);
  out.setAll(header, ascii.encode('JSR1'));
  data.setUint16(header + 4, 1, Endian.little);
  data.setUint32(header + 8, 1, Endian.little);
  out[header + 12] = 10;
  return out;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('Flutter Canvas radial gradient returns exact raw RGBA pixels', () async {
    final host = createFlutterGpuThreeHost();
    final result = await host.rasterizeCanvas2D('engine-a', _request());
    final data = result.data!;
    expect(result.engineId, 'engine-a');
    expect(result.surfaceId, 'main#1');
    expect(result.canvasId, '2d-1');
    expect(result.generation, 1);
    expect(result.requestId, 1);
    expect(result.width, 16);
    expect(result.height, 16);
    expect(result.stale, isFalse);
    expect(data.length, 16 * 16 * 4);
    final center = (8 * 16 + 8) * 4;
    expect(data.sublist(center, center + 4), [210, 210, 210, 255]);
    expect(data.sublist(0, 4), [255, 255, 255, 255]);
    for (var offset = 0; offset < data.length; offset += 4) {
      expect(data[offset + 3], 255);
      expect(data[offset], data[offset + 1]);
      expect(data[offset + 1], data[offset + 2]);
    }
    host.disposeEngine('engine-a');
  });

  test('protocol rejects cross-engine, dimensions, quotas and operations', () async {
    final host = createFlutterGpuThreeHost();
    await expectLater(
      host.rasterizeCanvas2D('engine-b', _request()),
      throwsA(isA<JsThreeProtocolException>()),
    );
    await expectLater(
      host.rasterizeCanvas2D('engine-a', _request(width: 4097)),
      throwsA(isA<FormatException>()),
    );
    await expectLater(
      host.rasterizeCanvas2D(
        'engine-a',
        _request(commands: List.filled(1025, const {})),
      ),
      throwsA(isA<FormatException>()),
    );
    await expectLater(
      host.rasterizeCanvas2D(
        'engine-a',
        _request(commands: [
          {'op': 'drawImage'},
        ]),
      ),
      throwsA(isA<JsThreeUnsupportedException>()),
    );
    host.disposeEngine('engine-a');
  });

  test('newer requests win and returned storage owns its bytes', () async {
    final pending = <Completer<Uint8List>>[];
    final host = FlutterGpuThreeHost(
      shaderAsset: 'unused',
      canvas2dRasterizer: (request) {
        final completer = Completer<Uint8List>();
        pending.add(completer);
        return completer.future;
      },
    );
    final first = host.rasterizeCanvas2D('engine-a', _request());
    final second = host.rasterizeCanvas2D(
      'engine-a',
      _request(requestId: 2),
    );
    expect(pending, hasLength(2));
    final secondBytes = _pixels(16, 16, 2);
    pending[1].complete(secondBytes);
    final secondResult = await second;
    expect(secondResult.stale, isFalse);
    expect(secondResult.data, everyElement(anything));
    secondBytes.fillRange(0, secondBytes.length, 99);
    expect(secondResult.data![0], 2, reason: 'host result owns an explicit byte copy');
    pending[0].complete(_pixels(16, 16, 1));
    final firstResult = await first;
    expect(firstResult.stale, isTrue);
    expect(firstResult.data, isNull);
    host.disposeEngine('engine-a');
  });

  test('canvas, engine and R1 surface disposal invalidate in-flight writes', () async {
    final pending = <Completer<Uint8List>>[];
    final host = FlutterGpuThreeHost(
      shaderAsset: 'unused',
      canvas2dRasterizer: (request) {
        final completer = Completer<Uint8List>();
        pending.add(completer);
        return completer.future;
      },
    );
    final canvasDispose = host.rasterizeCanvas2D('engine-a', _request());
    final disposed = await host.rasterizeCanvas2D(
      'engine-a',
      _request(action: 'dispose', requestId: 2, width: 0, height: 0, commands: []),
    );
    expect(disposed.stale, isTrue);
    pending[0].complete(_pixels(16, 16, 1));
    expect((await canvasDispose).stale, isTrue);

    final engineDispose = host.rasterizeCanvas2D('engine-a', _request());
    host.disposeEngine('engine-a');
    pending[1].complete(_pixels(16, 16, 2));
    expect((await engineDispose).stale, isTrue);

    final surfaceDispose = host.rasterizeCanvas2D('engine-a', _request());
    host.submit('engine-a', _disposePacket('engine-a', 'main#1'));
    pending[2].complete(_pixels(16, 16, 3));
    expect((await surfaceDispose).stale, isTrue);
  });

  test('same canvas id is isolated by engine and surface', () async {
    final host = createFlutterGpuThreeHost();
    final results = await Future.wait([
      host.rasterizeCanvas2D('engine-a', _request(width: 1, height: 1)),
      host.rasterizeCanvas2D(
        'engine-b',
        _request(engineId: 'engine-b', width: 1, height: 1),
      ),
      host.rasterizeCanvas2D(
        'engine-a',
        _request(surfaceId: 'other#1', width: 1, height: 1),
      ),
    ]);
    expect(results.map((result) => result.stale), everyElement(isFalse));
    expect(results.map((result) => result.data!.length), everyElement(4));
    host.disposeEngine('engine-a');
    host.disposeEngine('engine-b');
  });
}
