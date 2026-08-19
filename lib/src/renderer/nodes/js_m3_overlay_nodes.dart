part of '../json_widget_renderer.dart';

/// Material 3 overlay and navigation node builders for [JsonWidgetRenderer]:
/// `bottomSheet`, `dialog`, `snackBar`, `datePicker`, `timePicker`,
/// `navigationRail`, and `carousel`.
///
/// The overlay nodes drive modal surfaces (`showModalBottomSheet`,
/// `showDialog`, `ScaffoldMessenger.showSnackBar`, `showDatePicker`,
/// `showTimePicker`) and render as zero-size placeholders in the tree; each
/// shows once per mount and posts its dismiss event (`onDismiss` or a
/// per-type default) when the surface closes without a selection while the
/// node is still in the tree.
extension on JsonWidgetRenderer {
  /// `bottomSheet` — `{child, height?, color?, dismissible? (default true),
  /// onDismiss?}`; closing the sheet posts `onDismiss ?? 'bottomSheetDismiss'`.
  Widget _bottomSheetNode(Map<String, dynamic> m) =>
      _JsBottomSheetNode(renderer: this, node: m);

  /// `dialog` — `{title?, message?, child?, actions?: [{label, onTap}],
  /// dismissible? (default true), onDismiss?}`; barrier dismissal posts
  /// `onDismiss ?? 'dialogDismiss'`.
  Widget _dialogNode(Map<String, dynamic> m) =>
      _JsDialogNode(renderer: this, node: m);

  /// `snackBar` — `{message, actionLabel?, onAction?, durationMs?}`; no-op
  /// without a `ScaffoldMessenger` ancestor.
  Widget _snackBarNode(Map<String, dynamic> m) =>
      _JsSnackBarNode(renderer: this, node: m);

  /// `datePicker` — `{initialDate? (ISO 'YYYY-MM-DD'), firstDate?, lastDate?,
  /// onSelected, onDismiss?}` (defaults: today, 1900-01-01, 2100-12-31);
  /// picking posts `{'value': 'YYYY-MM-DD'}` to `onSelected`, cancelling posts
  /// `onDismiss ?? 'datePickerDismiss'`.
  Widget _datePickerNode(Map<String, dynamic> m) =>
      _JsDatePickerNode(renderer: this, node: m);

  /// `timePicker` — `{initialTime? ('HH:MM'), onSelected, onDismiss?}`;
  /// picking posts `{'value': 'HH:MM'}` (24h, zero-padded) to `onSelected`,
  /// cancelling posts `onDismiss ?? 'timePickerDismiss'`.
  Widget _timePickerNode(Map<String, dynamic> m) =>
      _JsTimePickerNode(renderer: this, node: m);

  /// `navigationRail` — `{destinations: [{icon, label}], selectedIndex,
  /// onChanged}`; selection posts `{'value': index}`.
  Widget _navigationRailNode(Map<String, dynamic> m) {
    final destinations = (m['destinations'] as List? ?? const <dynamic>[])
        .map(_navigationRailDestination)
        .toList();
    if (destinations.isEmpty) return const SizedBox.shrink();
    final selected = _int(
      m['selectedIndex'],
      0,
    ).clamp(0, destinations.length - 1);
    return NavigationRail(
      selectedIndex: selected,
      destinations: destinations,
      onDestinationSelected: (index) => _postValue(m, index),
    );
  }

  NavigationRailDestination _navigationRailDestination(dynamic raw) {
    final item = raw is Map ? raw.cast<String, dynamic>() : <String, dynamic>{};
    return NavigationRailDestination(
      icon: Icon(_iconData(item['icon'] as String? ?? 'info')),
      label: Text('${item['label'] ?? ''}'),
    );
  }

  /// `carousel` — `{children, itemExtent? (default 200), shrinkExtent?
  /// (default 0)}`; needs a bounded cross-axis extent from its parent.
  Widget _carouselNode(Map<String, dynamic> m) {
    final children = _children(m);
    if (children.isEmpty) return const SizedBox.shrink();
    return CarouselView(
      itemExtent: _double(m['itemExtent'], 200),
      shrinkExtent: _double(m['shrinkExtent'], 0),
      children: children,
    );
  }
}

/// Shared lifecycle for the overlay driver nodes ([_JsBottomSheetNode],
/// [_JsDialogNode], [_JsDatePickerNode], [_JsTimePickerNode]): presents the
/// overlay once per mount in a post-frame callback, and on unmount pops the
/// route (guarded — cannot throw).
mixin _JsOverlayState<T extends StatefulWidget> on State<T> {
  bool _showing = false;
  NavigatorState? _navigator;

  /// Presents the overlay; the returned future completes when it closes.
  Future<void> present();

  /// Called after the overlay closed while the node is still mounted.
  void onOverlayClosed();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _show());
  }

  Future<void> _show() async {
    if (_showing || !mounted) return;
    _showing = true;
    _navigator = Navigator.maybeOf(context);
    await present();
    _showing = false;
    if (mounted) onOverlayClosed();
  }

  @override
  void dispose() {
    if (_showing) {
      _showing = false;
      final navigator = _navigator;
      if (navigator != null && navigator.mounted && navigator.canPop()) {
        navigator.pop();
      }
    }
    super.dispose();
  }
}

/// Placeholder that opens a modal bottom sheet once mounted and closes it
/// when removed from the tree.
class _JsBottomSheetNode extends StatefulWidget {
  const _JsBottomSheetNode({required this.renderer, required this.node});

  final JsonWidgetRenderer renderer;
  final Map<String, dynamic> node;

  @override
  State<_JsBottomSheetNode> createState() => _JsBottomSheetNodeState();
}

class _JsBottomSheetNodeState extends State<_JsBottomSheetNode>
    with _JsOverlayState {
  @override
  Future<void> present() {
    final m = widget.node;
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      isDismissible: m['dismissible'] as bool? ?? true,
      builder: (_) => _sheetContent(m),
    );
  }

  Widget _sheetContent(Map<String, dynamic> m) {
    final r = widget.renderer;
    Widget content = r._child(m) ?? const SizedBox.shrink();
    final height = r._doubleOrNull(m['height']);
    if (height != null) content = SizedBox(height: height, child: content);
    final color = r._color(m['color'] as String?);
    if (color != null) content = Container(color: color, child: content);
    return content;
  }

  @override
  void onOverlayClosed() {
    final m = widget.node;
    widget.renderer.onEvent(
      '${m['onDismiss'] ?? 'bottomSheetDismiss'}',
      const <String, dynamic>{},
    );
  }

  @override
  Widget build(BuildContext context) => const SizedBox.shrink();
}

/// Placeholder that opens an [AlertDialog] once mounted and closes it when
/// removed from the tree.
class _JsDialogNode extends StatefulWidget {
  const _JsDialogNode({required this.renderer, required this.node});

  final JsonWidgetRenderer renderer;
  final Map<String, dynamic> node;

  @override
  State<_JsDialogNode> createState() => _JsDialogNodeState();
}

class _JsDialogNodeState extends State<_JsDialogNode> with _JsOverlayState {
  bool _closedByAction = false;

  @override
  Future<void> present() {
    final m = widget.node;
    return showDialog<void>(
      context: context,
      barrierDismissible: m['dismissible'] as bool? ?? true,
      builder: _buildDialog,
    );
  }

  Widget _buildDialog(BuildContext dialogContext) {
    final m = widget.node;
    return AlertDialog(
      title: m['title'] == null ? null : Text('${m['title']}'),
      content: _dialogContent(m),
      actions: _dialogActions(m, dialogContext),
    );
  }

  Widget? _dialogContent(Map<String, dynamic> m) {
    final message = m['message'];
    if (message != null) return Text('$message');
    return widget.renderer._child(m);
  }

  List<Widget> _dialogActions(Map<String, dynamic> m, BuildContext ctx) {
    final r = widget.renderer;
    return [
      for (final raw in m['actions'] as List? ?? const <dynamic>[])
        if (raw is Map)
          TextButton(
            onPressed: () {
              _closedByAction = true;
              Navigator.of(ctx).pop();
              r._tapHandler(raw['onTap'], raw['payload'])?.call();
            },
            child: Text('${raw['label'] ?? ''}'),
          ),
    ];
  }

  @override
  void onOverlayClosed() {
    if (_closedByAction) return;
    final m = widget.node;
    widget.renderer.onEvent(
      '${m['onDismiss'] ?? 'dialogDismiss'}',
      const <String, dynamic>{},
    );
  }

  @override
  Widget build(BuildContext context) => const SizedBox.shrink();
}

/// Placeholder that shows a [SnackBar] on the nearest `ScaffoldMessenger`
/// once mounted. No-op when there is no messenger ancestor.
class _JsSnackBarNode extends StatefulWidget {
  const _JsSnackBarNode({required this.renderer, required this.node});

  final JsonWidgetRenderer renderer;
  final Map<String, dynamic> node;

  @override
  State<_JsSnackBarNode> createState() => _JsSnackBarNodeState();
}

class _JsSnackBarNodeState extends State<_JsSnackBarNode> {
  bool _shown = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _show());
  }

  void _show() {
    if (_shown || !mounted) return;
    _shown = true;
    final messenger = ScaffoldMessenger.maybeOf(context);
    if (messenger == null) return;
    final m = widget.node;
    final r = widget.renderer;
    final actionLabel = m['actionLabel'] as String?;
    messenger.showSnackBar(
      SnackBar(
        content: Text('${m['message'] ?? ''}'),
        duration: Duration(milliseconds: r._int(m['durationMs'], 4000)),
        action: actionLabel == null
            ? null
            : SnackBarAction(
                label: actionLabel,
                onPressed: r._tapHandler(m['onAction'], m['payload']) ?? () {},
              ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) => const SizedBox.shrink();
}

String _jsPad2(int v) => v.toString().padLeft(2, '0');

/// Formats a picked date as ISO `YYYY-MM-DD` (no intl dependency).
String _jsFormatDate(DateTime d) =>
    '${d.year.toString().padLeft(4, '0')}-${_jsPad2(d.month)}-${_jsPad2(d.day)}';

/// Formats a picked time as 24h zero-padded `HH:MM`.
String _jsFormatTime(TimeOfDay t) => '${_jsPad2(t.hour)}:${_jsPad2(t.minute)}';

/// Parses an ISO `YYYY-MM-DD` string; returns null for unusable input.
DateTime? _jsParseDate(dynamic raw) {
  if (raw is! String) return null;
  final parts = raw.split('-');
  if (parts.length != 3) return null;
  final year = int.tryParse(parts[0]);
  final month = int.tryParse(parts[1]);
  final day = int.tryParse(parts[2]);
  if (year == null || month == null || day == null) return null;
  return DateTime(year, month, day);
}

/// Parses a `HH:MM` string; returns null for unusable input.
TimeOfDay? _jsParseTime(dynamic raw) {
  if (raw is! String) return null;
  final parts = raw.split(':');
  if (parts.length != 2) return null;
  final hour = int.tryParse(parts[0]);
  final minute = int.tryParse(parts[1]);
  if (hour == null || minute == null) return null;
  return TimeOfDay(hour: hour, minute: minute);
}

/// Shared close handling for the picker overlay nodes: a non-null [value]
/// posts `{'value': value}` to the node's `onSelected` action (when set),
/// otherwise the dismiss event (`onDismiss ?? [defaultDismiss]`) fires.
void _jsPostPickerResult(
  JsonWidgetRenderer renderer,
  Map<String, dynamic> m,
  String? value,
  String defaultDismiss,
) {
  if (value != null) {
    final action = m['onSelected'];
    if (action != null) {
      renderer.onEvent('$action', <String, dynamic>{'value': value});
    }
    return;
  }
  renderer.onEvent(
    '${m['onDismiss'] ?? defaultDismiss}',
    const <String, dynamic>{},
  );
}

/// Placeholder that opens [showDatePicker] once mounted and closes it when
/// removed from the tree.
class _JsDatePickerNode extends StatefulWidget {
  const _JsDatePickerNode({required this.renderer, required this.node});

  final JsonWidgetRenderer renderer;
  final Map<String, dynamic> node;

  @override
  State<_JsDatePickerNode> createState() => _JsDatePickerNodeState();
}

class _JsDatePickerNodeState extends State<_JsDatePickerNode>
    with _JsOverlayState {
  DateTime? _selected;

  @override
  Future<void> present() async {
    final m = widget.node;
    _selected = await showDatePicker(
      context: context,
      initialDate: _jsParseDate(m['initialDate']) ?? DateTime.now(),
      firstDate: _jsParseDate(m['firstDate']) ?? DateTime(1900),
      lastDate: _jsParseDate(m['lastDate']) ?? DateTime(2100),
    );
  }

  @override
  void onOverlayClosed() {
    final selected = _selected;
    _jsPostPickerResult(
      widget.renderer,
      widget.node,
      selected == null ? null : _jsFormatDate(selected),
      'datePickerDismiss',
    );
  }

  @override
  Widget build(BuildContext context) => const SizedBox.shrink();
}

/// Placeholder that opens [showTimePicker] once mounted and closes it when
/// removed from the tree.
class _JsTimePickerNode extends StatefulWidget {
  const _JsTimePickerNode({required this.renderer, required this.node});

  final JsonWidgetRenderer renderer;
  final Map<String, dynamic> node;

  @override
  State<_JsTimePickerNode> createState() => _JsTimePickerNodeState();
}

class _JsTimePickerNodeState extends State<_JsTimePickerNode>
    with _JsOverlayState {
  TimeOfDay? _selected;

  @override
  Future<void> present() async {
    final m = widget.node;
    final now = TimeOfDay.now();
    _selected = await showTimePicker(
      context: context,
      initialTime: _jsParseTime(m['initialTime']) ?? now,
    );
  }

  @override
  void onOverlayClosed() {
    final selected = _selected;
    _jsPostPickerResult(
      widget.renderer,
      widget.node,
      selected == null ? null : _jsFormatTime(selected),
      'timePickerDismiss',
    );
  }

  @override
  Widget build(BuildContext context) => const SizedBox.shrink();
}
