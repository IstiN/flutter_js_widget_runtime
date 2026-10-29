import 'package:js_widget_runtime/src/renderer/nodes/js_voxel_node.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_bridge.dart';

const _maxQuickjsLogs = 200;

/// Shared log and bridge-state diagnostics for the native QuickJS backends.
mixin QuickjsBackendDiagnostics {
  /// Bridge whose exported state and voxel world are exposed by the backend.
  JsWidgetBridge get quickjsBridge;

  final List<Map<String, dynamic>> quickjsConsoleLogs =
      <Map<String, dynamic>>[];

  List<Map<String, dynamic>> flushLogs() {
    final logs = List<Map<String, dynamic>>.from(quickjsConsoleLogs);
    quickjsConsoleLogs.clear();
    return logs;
  }

  List<Map<String, dynamic>> peekLogs() =>
      List<Map<String, dynamic>>.from(quickjsConsoleLogs);

  Map<String, dynamic>? get exportedState => quickjsBridge.exportedState;

  JsVoxelWorld? get voxelWorld => quickjsBridge.voxelWorld;

  void appendQuickjsLog(String message) {
    quickjsConsoleLogs.add({
      'ts': DateTime.now().millisecondsSinceEpoch,
      'msg': message,
    });
    if (quickjsConsoleLogs.length > _maxQuickjsLogs) {
      quickjsConsoleLogs.removeRange(
        0,
        quickjsConsoleLogs.length - _maxQuickjsLogs,
      );
    }
  }
}
