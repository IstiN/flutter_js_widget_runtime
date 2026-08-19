import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

void main() {
  group('JsonWidgetRenderer flChart node', () {
    late JsonWidgetRenderer renderer;

    setUp(() {
      renderer = JsonWidgetRenderer(onEvent: (_, _) {});
    });

    Widget buildTree(Map<String, dynamic> tree) {
      return MaterialApp(
        home: Scaffold(
          body: SizedBox(
            width: 320,
            height: 220,
            child: renderer.build(tree),
          ),
        ),
      );
    }

    testWidgets('line renders one bar per series with index x', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'flChart',
          'chartType': 'line',
          'minY': 0,
          'maxY': 10,
          'series': [
            {
              'label': 'a',
              'color': '#FF0000',
              // Numeric strings are tolerated.
              'points': [1, '2.5', 2, 4],
            },
            {
              'points': [3, 1],
            },
          ],
        }),
      );
      final chart = tester.widget<LineChart>(find.byType(LineChart));
      expect(chart.data.lineBarsData, hasLength(2));
      final first = chart.data.lineBarsData.first;
      expect(first.spots, hasLength(4));
      expect(first.spots[1], const FlSpot(1, 2.5));
      expect(first.color, const Color(0xFFFF0000));
      // curved and showGrid default to true; titles/border are hidden.
      expect(first.isCurved, isTrue);
      expect(first.dotData.show, isFalse);
      expect(chart.data.gridData.show, isTrue);
      expect(chart.data.titlesData.show, isFalse);
      expect(chart.data.borderData.show, isFalse);
      expect(chart.data.minY, 0);
      expect(chart.data.maxY, 10);
    });

    testWidgets('line honors curved/showGrid flags and unknown chartType', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'flChart',
          'chartType': 'nope',
          'curved': false,
          'showGrid': false,
          'series': [
            {
              'points': [1, 2],
            },
          ],
        }),
      );
      final chart = tester.widget<LineChart>(find.byType(LineChart));
      expect(chart.data.lineBarsData.single.isCurved, isFalse);
      expect(chart.data.gridData.show, isFalse);
    });

    testWidgets('line with no usable series renders nothing', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'flChart',
          'chartType': 'line',
          'series': [
            {'label': 'empty'},
          ],
        }),
      );
      expect(find.byType(LineChart), findsNothing);
    });

    testWidgets('bar renders one group per value', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'flChart',
          'chartType': 'bar',
          'color': '#00FF00',
          'values': [1, '2.5', 3],
        }),
      );
      final chart = tester.widget<BarChart>(find.byType(BarChart));
      expect(chart.data.barGroups, hasLength(3));
      expect(chart.data.barGroups[1].x, 1);
      expect(chart.data.barGroups[1].barRods.single.toY, 2.5);
      expect(
        chart.data.barGroups[1].barRods.single.color,
        const Color(0xFF00FF00),
      );
      expect(chart.data.gridData.show, isFalse);
      expect(chart.data.titlesData.show, isFalse);
      expect(chart.data.borderData.show, isFalse);
    });

    testWidgets('bar without explicit color cycles the palette', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'flChart',
          'chartType': 'bar',
          'values': [5],
        }),
      );
      final chart = tester.widget<BarChart>(find.byType(BarChart));
      expect(
        chart.data.barGroups.single.barRods.single.color,
        const Color(0xFF818CF8),
      );
    });

    testWidgets('bar with no values renders nothing', (tester) async {
      await tester.pumpWidget(
        buildTree({'type': 'flChart', 'chartType': 'bar'}),
      );
      expect(find.byType(BarChart), findsNothing);
    });

    testWidgets('pie renders sections with hidden titles', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'flChart',
          'chartType': 'pie',
          'centerSpaceRadius': 20,
          'sections': [
            {'label': 'a', 'value': 30},
            {'label': 'b', 'value': '45', 'color': '#123456'},
            {'label': 'c', 'value': 25},
            {'label': 'skipped'},
          ],
        }),
      );
      final chart = tester.widget<PieChart>(find.byType(PieChart));
      expect(chart.data.sections, hasLength(3));
      expect(chart.data.sections[1].value, 45);
      expect(chart.data.sections[1].color, const Color(0xFF123456));
      expect(chart.data.sections.every((s) => !s.showTitle), isTrue);
      expect(chart.data.centerSpaceRadius, 20);
    });

    testWidgets('pie with no usable sections renders nothing', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'flChart',
          'chartType': 'pie',
          'sections': [
            {'label': 'no value'},
          ],
        }),
      );
      expect(find.byType(PieChart), findsNothing);
    });

    testWidgets('radar renders a data set per entry', (tester) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'flChart',
          'chartType': 'radar',
          'features': ['Speed', 'Power', 'Range', 'Armor'],
          'entries': [
            {
              'label': 'a',
              'values': [3, 4, 5],
            },
            {
              'label': 'b',
              'color': '#22D3EE',
              'values': [1, 2, 3, 4],
            },
          ],
        }),
      );
      final chart = tester.widget<RadarChart>(find.byType(RadarChart));
      expect(chart.data.dataSets, hasLength(2));
      // Short value lists are zero-padded up to the feature count.
      expect(chart.data.dataSets.first.dataEntries, hasLength(4));
      expect(chart.data.dataSets.first.dataEntries.last.value, 0);
      expect(
        chart.data.dataSets.last.borderColor,
        const Color(0xFF22D3EE),
      );
      // Feature names become titles; ticks are visually hidden.
      expect(chart.data.getTitle!(1, 0).text, 'Power');
      expect(chart.data.getTitle!(9, 0).text, '');
      expect(chart.data.tickCount, 1);
      expect(chart.data.tickBorderData, BorderSide.none);
    });

    testWidgets('radar with fewer than 3 features still renders', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'flChart',
          'chartType': 'radar',
          'features': ['A', 'B'],
          'entries': [
            {
              'values': [1, 2],
            },
          ],
        }),
      );
      final chart = tester.widget<RadarChart>(find.byType(RadarChart));
      // RadarDataSet asserts >= 3 entries, so short lists pad to 3.
      expect(chart.data.dataSets.single.dataEntries, hasLength(3));
    });

    testWidgets('radar without features or entries renders nothing', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'flChart',
          'chartType': 'radar',
          'features': ['A', 'B', 'C'],
        }),
      );
      expect(find.byType(RadarChart), findsNothing);
    });

    testWidgets('scatter renders spots with per-point radius and color', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'flChart',
          'chartType': 'scatter',
          'minX': 0,
          'maxX': 10,
          'minY': 0,
          'maxY': 10,
          'points': [
            {'x': '1.5', 'y': 2, 'radius': 7, 'color': '#FF0000'},
            {'x': 3, 'y': 4},
            {'x': 5},
          ],
        }),
      );
      final chart = tester.widget<ScatterChart>(find.byType(ScatterChart));
      // The point without y is dropped.
      expect(chart.data.scatterSpots, hasLength(2));
      final first = chart.data.scatterSpots.first;
      expect(first.x, 1.5);
      expect(first.y, 2);
      final painter = first.dotPainter as FlDotCirclePainter;
      expect(painter.radius, 7);
      expect(painter.color, const Color(0xFFFF0000));
      expect(chart.data.titlesData.show, isFalse);
      expect(chart.data.gridData.show, isFalse);
      expect(chart.data.minX, 0);
      expect(chart.data.maxY, 10);
    });

    testWidgets('scatter with no usable points renders nothing', (
      tester,
    ) async {
      await tester.pumpWidget(
        buildTree({
          'type': 'flChart',
          'chartType': 'scatter',
          'points': [
            {'radius': 3},
          ],
        }),
      );
      expect(find.byType(ScatterChart), findsNothing);
    });
  });
}
