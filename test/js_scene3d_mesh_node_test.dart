import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

/// Unit cube centered at the origin, 8 vertices, 12 triangles.
Map<String, dynamic> _cubeMesh() => {
  'vertices': [
    [-0.5, -0.5, -0.5],
    [0.5, -0.5, -0.5],
    [0.5, 0.5, -0.5],
    [-0.5, 0.5, -0.5],
    [-0.5, -0.5, 0.5],
    [0.5, -0.5, 0.5],
    [0.5, 0.5, 0.5],
    [-0.5, 0.5, 0.5],
  ],
  'faces': [
    [0, 1, 2], [0, 2, 3], // back
    [4, 6, 5], [4, 7, 6], // front
    [0, 3, 7], [0, 7, 4], // left
    [1, 5, 6], [1, 6, 2], // right
    [3, 2, 6], [3, 6, 7], // top
    [0, 4, 5], [0, 5, 1], // bottom
  ],
  'color': '#4fc3f7',
};

Map<String, dynamic> _cubeNode({Map<String, dynamic>? extra}) => {
  'type': 'scene3d',
  'width': 300,
  'height': 300,
  'meshes': [_cubeMesh()],
  ...?extra,
};

void main() {
  group('Scene3dProjector', () {
    const size = Size(300, 300);

    test('projects all 8 cube vertices inside the viewport', () {
      final config = parseScene3dConfig(_cubeNode());
      final projector = Scene3dProjector(
        camera: config.camera,
        rotation: config.rotation,
      );
      for (final v in config.meshes.single.vertices) {
        final p = projector.project(v[0], v[1], v[2], size);
        expect(p, isNotNull, reason: 'vertex $v behind near plane');
        expect(p!.$1.dx, inInclusiveRange(0, size.width));
        expect(p.$1.dy, inInclusiveRange(0, size.height));
      }
    });

    test('rotation changes the projection', () {
      final base = parseScene3dConfig(_cubeNode());
      final rotated = parseScene3dConfig(
        _cubeNode(
          extra: {
            'rotation': {'x': 25, 'y': 40, 'z': 10},
          },
        ),
      );
      final p0 = Scene3dProjector(camera: base.camera, rotation: base.rotation);
      final p1 = Scene3dProjector(
        camera: rotated.camera,
        rotation: rotated.rotation,
      );
      var moved = 0;
      for (final v in base.meshes.single.vertices) {
        final a = p0.project(v[0], v[1], v[2], size)!.$1;
        final b = p1.project(v[0], v[1], v[2], size)!.$1;
        if ((a - b).distance > 1) moved++;
      }
      expect(moved, greaterThan(4));
    });
  });

  group('JsScene3dMeshNode', () {
    testWidgets('renders a CustomPaint for a meshes scene', (tester) async {
      final renderer = JsonWidgetRenderer(onEvent: (_, __) {});
      await tester.pumpWidget(
        MaterialApp(home: Scaffold(body: renderer.build(_cubeNode()))),
      );
      expect(find.byType(JsScene3dMeshNode), findsOneWidget);
      expect(find.byType(CustomPaint), findsWidgets);
    });

    testWidgets('host scenes without meshes still render a placeholder', (
      tester,
    ) async {
      final renderer = JsonWidgetRenderer(onEvent: (_, __) {});
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: renderer.build({
              'type': 'scene3d',
              'id': 'main',
              'width': 300,
              'height': 200,
            }),
          ),
        ),
      );
      expect(find.byType(JsScene3dMeshNode), findsNothing);
      expect(find.byType(Icon), findsOneWidget);
    });

    testWidgets('fires onTap with local coordinates', (tester) async {
      final events = <Map<String, dynamic>>[];
      final renderer = JsonWidgetRenderer(
        onEvent: (id, payload) => events.add({'id': id, ...payload}),
      );
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Center(
              child: renderer.build(_cubeNode(extra: {'onTap': 'cube-tap'})),
            ),
          ),
        ),
      );
      await tester.tap(find.byType(JsScene3dMeshNode));
      expect(events, hasLength(1));
      expect(events.single['id'], 'cube-tap');
      expect(events.single['x'], isA<double>());
      expect(events.single['y'], isA<double>());
    });

    testWidgets('tolerates garbage input', (tester) async {
      final renderer = JsonWidgetRenderer(onEvent: (_, __) {});
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: renderer.build({
              'type': 'scene3d',
              'width': 'wide',
              'height': 300,
              'meshes': [
                'not-a-mesh',
                {'vertices': 'nope', 'faces': 42},
                {
                  'vertices': [
                    [0, 0],
                    ['x', null, 1],
                  ],
                  'faces': [
                    [0, 1, 99],
                    ['a', 'b', 'c'],
                  ],
                  'color': 'not-a-color',
                },
              ],
              'camera': {'position': 'everywhere', 'fov': 'wide'},
              'rotation': {'x': 'spin'},
              'light': {'direction': 7},
            }),
          ),
        ),
      );
      expect(find.byType(JsScene3dMeshNode), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  });
}
