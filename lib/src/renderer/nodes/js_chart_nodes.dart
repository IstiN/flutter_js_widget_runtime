part of '../json_widget_renderer.dart';

/// Default color palette for `flChart` series/sections/bars/spots when the
/// node does not specify an explicit color.
const _flChartPalette = <Color>[
  Color(0xFF818CF8),
  Color(0xFFA78BFA),
  Color(0xFF22D3EE),
  Color(0xFFF59E0B),
  Color(0xFFEF4444),
];

/// fl_chart-backed chart node builder for [JsonWidgetRenderer] (`flChart`).
///
/// Unlike the lightweight `chart` node (CustomPainter sparklines/bars),
/// `flChart` renders full fl_chart widgets. Unknown `chartType` values fall
/// back to `'line'`; nodes with no usable data render `SizedBox.shrink()`.
extension on JsonWidgetRenderer {
  /// `flChart` — `{chartType: 'line'|'bar'|'pie'|'radar'|'scatter', ...}`.
  /// See the per-type builders for their props.
  Widget _flChartNode(Map<String, dynamic> m) => switch (m['chartType']) {
    'bar' => _flBarChart(m),
    'pie' => _flPieChart(m),
    'radar' => _flRadarChart(m),
    'scatter' => _flScatterChart(m),
    _ => _flLineChart(m),
  };

  Color _flChartColor(dynamic raw, int index) =>
      _color(raw as String?) ??
      _flChartPalette[index % _flChartPalette.length];

  List<double> _flChartDoubles(dynamic raw) => raw is List
      ? raw.map(jsDoubleOrNull).whereType<double>().toList()
      : const <double>[];

  /// `line` — `{series: [{label?, color?, points: [num...]}], minY?, maxY?,
  /// showGrid? (default true), curved? (default true)}`; x is the point index.
  Widget _flLineChart(Map<String, dynamic> m) {
    final rawSeries = m['series'] as List? ?? const <dynamic>[];
    final curved = jsBool(m['curved'], true);
    final bars = <LineChartBarData>[
      for (var i = 0; i < rawSeries.length; i++)
        if (rawSeries[i] is Map)
          if (_flLineBar(rawSeries[i] as Map, i, curved) case final bar?)
            bar,
    ];
    if (bars.isEmpty) return const SizedBox.shrink();
    return LineChart(
      LineChartData(
        lineBarsData: bars,
        minY: _doubleOrNull(m['minY']),
        maxY: _doubleOrNull(m['maxY']),
        gridData: FlGridData(show: jsBool(m['showGrid'], true)),
        borderData: FlBorderData(show: false),
        titlesData: const FlTitlesData(show: false),
      ),
    );
  }

  LineChartBarData? _flLineBar(Map<dynamic, dynamic> raw, int index, bool curved) {
    final points = _flChartDoubles(raw['points']);
    if (points.isEmpty) return null;
    return LineChartBarData(
      spots: [
        for (var x = 0; x < points.length; x++)
          FlSpot(x.toDouble(), points[x]),
      ],
      isCurved: curved,
      dotData: const FlDotData(show: false),
      color: _flChartColor(raw['color'], index),
      barWidth: 2,
    );
  }

  /// `bar` — `{values: [num...], color?}`; one group per index, no titles,
  /// grid or border.
  Widget _flBarChart(Map<String, dynamic> m) {
    final values = _flChartDoubles(m['values']);
    if (values.isEmpty) return const SizedBox.shrink();
    final color = _color(m['color'] as String?);
    return BarChart(
      BarChartData(
        barGroups: [
          for (var i = 0; i < values.length; i++)
            BarChartGroupData(
              x: i,
              barRods: [
                BarChartRodData(
                  toY: values[i],
                  color: color ?? _flChartColor(null, i),
                  width: 12,
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(3),
                  ),
                ),
              ],
            ),
        ],
        gridData: const FlGridData(show: false),
        borderData: FlBorderData(show: false),
        titlesData: const FlTitlesData(show: false),
      ),
    );
  }

  /// `pie` — `{sections: [{label?, value: num, color?, radius?}],
  /// centerSpaceRadius? (default 32)}`; section titles are hidden. Section
  /// `radius` is the ring thickness in logical px — fl_chart defaults it to
  /// an absolute 40, so a pie whose box is smaller than
  /// `2 * (centerSpaceRadius + 40)` paints past its bounds unless every
  /// section sets an explicit radius.
  Widget _flPieChart(Map<String, dynamic> m) {
    final rawSections = m['sections'] as List? ?? const <dynamic>[];
    final sections = <PieChartSectionData>[
      for (var i = 0; i < rawSections.length; i++)
        if (rawSections[i] is Map)
          if (_flPieSection(rawSections[i] as Map, i) case final section?)
            section,
    ];
    if (sections.isEmpty) return const SizedBox.shrink();
    return PieChart(
      PieChartData(
        sections: sections,
        centerSpaceRadius: _double(m['centerSpaceRadius'], 32),
      ),
    );
  }

  PieChartSectionData? _flPieSection(Map<dynamic, dynamic> raw, int index) {
    final value = jsDoubleOrNull(raw['value']);
    if (value == null) return null;
    return PieChartSectionData(
      value: value,
      color: _flChartColor(raw['color'], index),
      radius: jsDoubleOrNull(raw['radius']) ?? 40,
      showTitle: false,
    );
  }

  /// `radar` — `{features: [String...], entries: [{label?, color?, values:
  /// [num...]}]}`; feature names become tiny muted titles, ticks are hidden.
  Widget _flRadarChart(Map<String, dynamic> m) {
    final features = [
      for (final f in m['features'] as List? ?? const <dynamic>[]) '$f',
    ];
    final rawEntries = m['entries'] as List? ?? const <dynamic>[];
    final dataSets = <RadarDataSet>[
      for (var i = 0; i < rawEntries.length; i++)
        if (rawEntries[i] is Map)
          if (_flRadarSet(rawEntries[i] as Map, i, features.length)
              case final set?)
            set,
    ];
    if (features.isEmpty || dataSets.isEmpty) {
      return const SizedBox.shrink();
    }
    final muted = _effectiveTheme.muted;
    return RadarChart(
      RadarChartData(
        dataSets: dataSets,
        getTitle: (index, angle) => RadarChartTitle(
          text: index < features.length ? features[index] : '',
        ),
        titleTextStyle: TextStyle(fontSize: 10, color: muted),
        tickCount: 1,
        ticksTextStyle: const TextStyle(
          fontSize: 9,
          color: Colors.transparent,
        ),
        tickBorderData: BorderSide.none,
        radarBorderData: BorderSide.none,
        gridBorderData: BorderSide(color: muted.withValues(alpha: 0.3)),
      ),
    );
  }

  RadarDataSet? _flRadarSet(
    Map<dynamic, dynamic> raw,
    int index,
    int featureCount,
  ) {
    final values = _flChartDoubles(raw['values']);
    if (values.isEmpty) return null;
    // RadarDataSet asserts >= 3 entries and equal lengths across sets.
    final count = featureCount < 3 ? 3 : featureCount;
    final color = _flChartColor(raw['color'], index);
    return RadarDataSet(
      dataEntries: [
        for (var j = 0; j < count; j++)
          RadarEntry(value: j < values.length ? values[j] : 0),
      ],
      fillColor: color.withValues(alpha: 0.2),
      borderColor: color,
      borderWidth: 2,
      entryRadius: 2,
    );
  }

  /// `scatter` — `{points: [{x, y, radius?, color?}], minX?, maxX?, minY?,
  /// maxY?}`; titles and grid are hidden.
  Widget _flScatterChart(Map<String, dynamic> m) {
    final rawPoints = m['points'] as List? ?? const <dynamic>[];
    final spots = <ScatterSpot>[
      for (var i = 0; i < rawPoints.length; i++)
        if (rawPoints[i] is Map)
          if (_flScatterSpot(rawPoints[i] as Map, i) case final spot?) spot,
    ];
    if (spots.isEmpty) return const SizedBox.shrink();
    return ScatterChart(
      ScatterChartData(
        scatterSpots: spots,
        minX: _doubleOrNull(m['minX']),
        maxX: _doubleOrNull(m['maxX']),
        minY: _doubleOrNull(m['minY']),
        maxY: _doubleOrNull(m['maxY']),
        gridData: const FlGridData(show: false),
        borderData: FlBorderData(show: false),
        titlesData: const FlTitlesData(show: false),
      ),
    );
  }

  ScatterSpot? _flScatterSpot(Map<dynamic, dynamic> raw, int index) {
    final x = jsDoubleOrNull(raw['x']);
    final y = jsDoubleOrNull(raw['y']);
    if (x == null || y == null) return null;
    return ScatterSpot(
      x,
      y,
      dotPainter: FlDotCirclePainter(
        radius: jsDouble(raw['radius'], 5),
        color: _flChartColor(raw['color'], index),
      ),
    );
  }
}
