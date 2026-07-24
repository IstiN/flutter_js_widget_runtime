import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/json_widget_renderer.dart';

/// In-memory tile provider so tests never hit the network.
class _TransparentTileProvider extends TileProvider {
  static final Uint8List _bytes = base64Decode(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk'
    'YPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  );

  @override
  ImageProvider getImage(TileCoordinates coordinates, TileLayer options) =>
      MemoryImage(_bytes);
}

void main() {
  group('JsonWidgetRenderer map node', () {
    late List<(String, Map<String, dynamic>)> events;
    late JsonWidgetRenderer renderer;

    setUp(() {
      events = [];
      renderer = JsonWidgetRenderer(
        onEvent: (id, payload) => events.add((id, payload)),
        mapTileProvider: _TransparentTileProvider(),
      );
    });

    Widget buildTree(Map<String, dynamic> tree) {
      return MaterialApp(
        home: Scaffold(
          body: SizedBox(width: 400, height: 300, child: renderer.build(tree)),
        ),
      );
    }

    testWidgets('renders with center, zoom and markers', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'map',
          'center': {'lat': 51.5, 'lng': -0.09},
          'zoom': 11,
          'markers': [
            {'id': 'a', 'lat': 51.5, 'lng': -0.09, 'label': 'Home'},
            {'id': 'b', 'lat': 51.51, 'lng': -0.1, 'color': '#00FF00'},
          ],
        }),
      );
      await tester.pump();

      expect(find.byType(FlutterMap), findsOneWidget);
      expect(find.byType(MarkerLayer), findsOneWidget);
      expect(find.byIcon(Icons.location_pin), findsNWidgets(2));
      expect(find.text('Home'), findsOneWidget);

      final map = tester.widget<FlutterMap>(find.byType(FlutterMap));
      expect(map.options.initialCenter.latitude, 51.5);
      expect(map.options.initialCenter.longitude, -0.09);
      expect(map.options.initialZoom, 11);
    });

    testWidgets('renders polylines', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'map',
          'polylines': [
            {
              'points': [
                [51.5, -0.09],
                [51.51, -0.1],
              ],
              'color': '#1e88e5',
              'width': 4,
            },
          ],
        }),
      );
      await tester.pump();
      expect(find.byType(PolylineLayer), findsOneWidget);
      final layer = tester.widget<PolylineLayer>(find.byType(PolylineLayer));
      expect(layer.polylines, hasLength(1));
      expect(layer.polylines.single.strokeWidth, 4);
    });

    testWidgets('marker tap fires onMarkerTap with id', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'map',
          'center': {'lat': 51.5, 'lng': -0.09},
          'zoom': 14,
          'markers': [
            {'id': 'pin-1', 'lat': 51.5, 'lng': -0.09, 'label': 'Pin'},
          ],
          'onMarkerTap': 'marker-tap',
        }),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.byIcon(Icons.location_pin));
      await tester.pump();

      expect(events, hasLength(1));
      expect(events.single.$1, 'marker-tap');
      expect(events.single.$2, {'id': 'pin-1'});
    });

    testWidgets('map tap fires onTap with lat/lng', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'map',
          'center': {'lat': 51.5, 'lng': -0.09},
          'zoom': 13,
          'onTap': 'map-tap',
        }),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.byType(FlutterMap));
      // Let flutter_map's internal tap/double-tap disambiguation settle.
      await tester.pump(const Duration(milliseconds: 500));
      await tester.pump();

      expect(events, hasLength(1));
      expect(events.single.$1, 'map-tap');
      final payload = events.single.$2;
      expect(payload['lat'], isA<double>());
      expect(payload['lng'], isA<double>());
      // Tapping the center of the map yields (approximately) the center.
      expect((payload['lat']! as double) - 51.5, closeTo(0, 0.01));
      expect((payload['lng']! as double) - -0.09, closeTo(0, 0.01));
    });

    testWidgets('fitBounds true fits camera to markers', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'map',
          'fitBounds': true,
          'markers': [
            {'id': 'a', 'lat': 51.5, 'lng': -0.09},
            {'id': 'b', 'lat': 52.0, 'lng': 0.5},
          ],
        }),
      );
      await tester.pump();
      final map = tester.widget<FlutterMap>(find.byType(FlutterMap));
      expect(map.options.initialCameraFit, isNotNull);
    });

    testWidgets('fitBounds accepts explicit corner list', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'map',
          'fitBounds': [
            [51.0, -1.0],
            [52.0, 1.0],
          ],
        }),
      );
      await tester.pump();
      final map = tester.widget<FlutterMap>(find.byType(FlutterMap));
      expect(map.options.initialCameraFit, isNotNull);
    });

    testWidgets('renders nothing interactive without events', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'map',
          'center': {'lat': 0, 'lng': 0},
        }),
      );
      await tester.pump();
      final map = tester.widget<FlutterMap>(find.byType(FlutterMap));
      expect(map.options.onTap, isNull);
    });

    testWidgets('skips malformed markers and polylines', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'map',
          'center': {'lat': 0, 'lng': 0},
          'zoom': 13,
          'markers': [
            {'id': 'bad'},
            'not-a-map',
            {'id': 'ok', 'lat': 0.0005, 'lng': 0.0005},
          ],
          'polylines': [
            {
              'points': [
                [1, 2],
              ],
            },
            'junk',
          ],
        }),
      );
      await tester.pump();
      expect(find.byIcon(Icons.location_pin), findsOneWidget);
      expect(find.byType(PolylineLayer), findsNothing);
    });
  });
}
