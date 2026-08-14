import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:js_widget_runtime/src/renderer/nodes/js_node_helpers.dart';
import 'package:latlong2/latlong.dart';

/// Builds an OpenStreetMap widget for a `map` node.
///
/// Tiles come from the public OSM tile server (no API key). Pass
/// [tileProvider] to override tile loading — tests must inject an in-memory
/// provider so they never hit the network.
///
/// Props:
/// - `center` ({`lat`, `lng`}): initial map center (default 0,0).
/// - `zoom` (double, default 13): initial zoom level.
/// - `markers` (list): `{id, lat, lng, label?, color?}` entries. Tapping a
///   marker fires the `onMarkerTap` action with payload `{id: <id>}`.
/// - `polylines` (list): `{points: [[lat, lng], ...], color?, width?}`.
/// - `fitBounds` (bool or `[[lat, lng], [lat, lng]]`): when `true`, fits the
///   initial camera to all markers and polyline points; a two-corner list
///   sets explicit bounds. Overrides `center`/`zoom`.
/// - `onTap` (action id): tapping the map fires it with `{lat, lng}`.
/// - `onMarkerTap` (action id): marker taps fire it with `{id}`.
///
/// JS example:
/// ```js
/// jsr.render({
///   type: 'map',
///   center: {lat: 51.5, lng: -0.09},
///   zoom: 13,
///   markers: [
///     {id: 'home', lat: 51.5, lng: -0.09, label: 'Home', color: '#e53935'},
///   ],
///   polylines: [
///     {points: [[51.5, -0.09], [51.51, -0.1]], color: '#1e88e5', width: 3},
///   ],
///   onTap: 'map-tap',
///   onMarkerTap: 'marker-tap',
/// });
/// jsr.onEvent(function(actionId, payload) {
///   if (actionId === 'map-tap') console.log('tapped', payload.lat, payload.lng);
///   if (actionId === 'marker-tap') console.log('marker', payload.id);
/// });
/// ```
Widget buildJsMapNode(
  Map<String, dynamic> m,
  void Function(String actionId, Map<String, dynamic> payload) onEvent, {
  TileProvider? tileProvider,
}) {
  final centerMap = (m['center'] as Map?)?.cast<String, dynamic>() ?? const {};
  final center = LatLng(
    jsDouble(centerMap['lat'], 0),
    jsDouble(centerMap['lng'], 0),
  );
  final zoom = jsDouble(m['zoom'], 13);
  final onTap = m['onTap'] as String?;
  final onMarkerTap = m['onMarkerTap'] as String?;

  // Defer events outside the gesture pipeline — same pattern as the
  // gestureDetector node — to avoid the !_debugDuringDeviceUpdate assertion.
  void fire(String action, Map<String, dynamic> payload) =>
      scheduleMicrotask(() => onEvent(action, payload));

  final markers = <Marker>[];
  final fitPoints = <LatLng>[];
  _collectMarkers(m['markers'], onMarkerTap, fire, markers, fitPoints);
  final polylines =
      _collectPolylines(m['polylines'], fitPoints);

  final bounds = _fitBounds(m['fitBounds'], fitPoints);

  final layers = <Widget>[
    TileLayer(
      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      userAgentPackageName: 'js_widget_runtime',
      tileProvider: tileProvider,
    ),
    if (polylines.isNotEmpty) PolylineLayer(polylines: polylines),
    if (markers.isNotEmpty) MarkerLayer(markers: markers),
  ];

  Widget map = _flutterMap(center, zoom, bounds, onTap, fire, layers);

  final width = jsDoubleOrNull(m['width']);
  final height = jsDoubleOrNull(m['height']);
  if (width != null || height != null) {
    map = SizedBox(width: width, height: height, child: map);
  }
  return map;
}

FlutterMap _flutterMap(
  LatLng center,
  double zoom,
  LatLngBounds? bounds,
  String? onTap,
  void Function(String, Map<String, dynamic>) fire,
  List<Widget> layers,
) {
  return FlutterMap(
    options: MapOptions(
      initialCenter: center,
      initialZoom: zoom,
      initialCameraFit: bounds != null
          ? CameraFit.bounds(bounds: bounds, padding: const EdgeInsets.all(32))
          : null,
      onTap: onTap == null
          ? null
          : (_, latLng) => fire(onTap, <String, dynamic>{
              'lat': latLng.latitude,
              'lng': latLng.longitude,
            }),
    ),
    children: layers,
  );
}

/// Parses the `markers` array into [markers]; valid points also land in
/// [fitPoints] for camera fitting.
void _collectMarkers(
  dynamic rawMarkers,
  String? onMarkerTap,
  void Function(String, Map<String, dynamic>) fire,
  List<Marker> markers,
  List<LatLng> fitPoints,
) {
  for (final (index, raw) in (rawMarkers as List? ?? const []).indexed) {
    if (raw is! Map) continue;
    final marker = _mapMarker(raw.cast<String, dynamic>(), index, onMarkerTap, fire);
    if (marker == null) continue;
    fitPoints.add(marker.point);
    markers.add(marker);
  }
}

/// Builds one map marker, or `null` when lat/lng is missing/invalid.
Marker? _mapMarker(
  Map<String, dynamic> mm,
  int index,
  String? onMarkerTap,
  void Function(String, Map<String, dynamic>) fire,
) {
  final lat = jsDoubleOrNull(mm['lat']);
  final lng = jsDoubleOrNull(mm['lng']);
  if (lat == null || lng == null) return null;
  final point = LatLng(lat, lng);
  final id = (mm['id'] ?? index).toString();
  final label = mm['label'] as String?;
  final color = parseColor(mm['color'] as String?) ?? Colors.red;
  return Marker(
    point: point,
    width: label != null ? 120 : 40,
    height: label != null ? 64 : 40,
    child: GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onMarkerTap == null
          ? null
          : () => fire(onMarkerTap, <String, dynamic>{'id': id}),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.location_pin, color: color, size: 32),
          if (label != null)
            Text(
              label,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 11,
                color: Colors.white,
                shadows: [Shadow(color: Colors.black, blurRadius: 2)],
              ),
            ),
        ],
      ),
    ),
  );
}

/// Parses the `polylines` array; valid points also land in [fitPoints].
List<Polyline> _collectPolylines(dynamic rawPolylines, List<LatLng> fitPoints) {
  final polylines = <Polyline>[];
  for (final raw in rawPolylines as List? ?? const []) {
    final polyline = _mapPolyline(raw, fitPoints);
    if (polyline != null) polylines.add(polyline);
  }
  return polylines;
}

Polyline? _mapPolyline(dynamic raw, List<LatLng> fitPoints) {
  if (raw is! Map) return null;
  final pm = raw.cast<String, dynamic>();
  final points = <LatLng>[
    for (final p in pm['points'] as List? ?? const [])
      if (p is List && p.length >= 2)
        LatLng(jsDouble(p[0], 0), jsDouble(p[1], 0)),
  ];
  if (points.length < 2) return null;
  fitPoints.addAll(points);
  return Polyline(
    points: points,
    color: parseColor(pm['color'] as String?) ?? Colors.blue,
    strokeWidth: jsDouble(pm['width'], 3),
  );
}

LatLngBounds? _fitBounds(dynamic fitBounds, List<LatLng> fitPoints) {
  if (fitBounds == true) {
    if (fitPoints.isEmpty) return null;
    return LatLngBounds.fromPoints(fitPoints);
  }
  if (fitBounds is List && fitBounds.length >= 2) {
    final a = fitBounds[0];
    final b = fitBounds[1];
    if (a is List && a.length >= 2 && b is List && b.length >= 2) {
      return LatLngBounds(
        LatLng(jsDouble(a[0], 0), jsDouble(a[1], 0)),
        LatLng(jsDouble(b[0], 0), jsDouble(b[1], 0)),
      );
    }
  }
  return null;
}
