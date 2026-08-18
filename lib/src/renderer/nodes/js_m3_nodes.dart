part of '../json_widget_renderer.dart';

/// Material 3 node builders for [JsonWidgetRenderer]: `appBar`,
/// `navigationBar`, `tabBar`, `fab`, `segmentedButton`, `radio`, `searchBar`,
/// `tooltip`, `popupMenu`, `banner`, and `bottomAppBar`.
///
/// Value-changing nodes post `{'value': ...}` to the action named by
/// `onChange`/`onChanged` (or `onSelected` for `popupMenu`); tap-only
/// actions post the action id through `_tapHandler`.
extension on JsonWidgetRenderer {
  /// `appBar` — `{title, leading?: {icon, onTap}, actions?: [{icon, onTap,
  /// tooltip?}], color?}`.
  Widget _appBarNode(Map<String, dynamic> m) {
    final leading = m['leading'];
    final actions = m['actions'] as List? ?? const <dynamic>[];
    return AppBar(
      title: Text('${m['title'] ?? ''}'),
      backgroundColor: _color(m['color'] as String?),
      leading: leading is Map ? _appBarIcon(leading) : null,
      actions: [
        for (final action in actions)
          if (action is Map) _appBarIcon(action),
      ],
    );
  }

  Widget _appBarIcon(Map<dynamic, dynamic> raw) {
    final item = raw.cast<String, dynamic>();
    return IconButton(
      icon: Icon(_iconData(item['icon'] as String? ?? 'info')),
      tooltip: item['tooltip'] as String?,
      onPressed: _tapHandler(item['onTap'], item['payload']),
    );
  }

  /// `navigationBar` — `{destinations: [{icon, label}], selectedIndex,
  /// onChanged}`; selection posts `{'value': index}`.
  Widget _navigationBarNode(Map<String, dynamic> m) {
    final destinations = (m['destinations'] as List? ?? const <dynamic>[])
        .map(_navigationDestination)
        .toList();
    if (destinations.isEmpty) return const SizedBox.shrink();
    final selected = _int(m['selectedIndex'], 0).clamp(
      0,
      destinations.length - 1,
    );
    return NavigationBar(
      selectedIndex: selected,
      destinations: destinations,
      onDestinationSelected: (index) => _postValue(m, index),
    );
  }

  NavigationDestination _navigationDestination(dynamic raw) {
    final item = raw is Map
        ? raw.cast<String, dynamic>()
        : <String, dynamic>{};
    return NavigationDestination(
      icon: Icon(_iconData(item['icon'] as String? ?? 'info')),
      label: '${item['label'] ?? ''}',
    );
  }

  void _postValue(Map<String, dynamic> m, dynamic value) {
    final action = m['onChange'] ?? m['onChanged'] ?? m['onSelected'];
    if (action == null) return;
    onEvent('$action', <String, dynamic>{'value': value});
  }

  /// `tabBar` — `{tabs: [string], children: [node]}`; children shorter than
  /// tabs are padded with empty views.
  Widget _tabBarNode(Map<String, dynamic> m) {
    final tabs = (m['tabs'] as List? ?? const <dynamic>[])
        .map((t) => Tab(text: '$t'))
        .toList();
    if (tabs.isEmpty) return const SizedBox.shrink();
    final rawChildren = m['children'] as List? ?? const <dynamic>[];
    final children = <Widget>[
      for (var i = 0; i < tabs.length; i++)
        i < rawChildren.length ? _build(rawChildren[i]) : const SizedBox(),
    ];
    return DefaultTabController(
      length: tabs.length,
      child: Column(
        children: [
          TabBar(tabs: tabs),
          Expanded(child: TabBarView(children: children)),
        ],
      ),
    );
  }

  /// `fab` — `{icon?, label?, onTap, mini?}`; a `label` renders the
  /// extended variant.
  Widget _fabNode(Map<String, dynamic> m) {
    final onTap = _tapHandler(m['onTap'], m['payload']);
    final icon = m['icon'] as String?;
    final label = m['label'] as String?;
    if (label != null) {
      return FloatingActionButton.extended(
        onPressed: onTap ?? () {},
        icon: icon == null ? null : Icon(_iconData(icon)),
        label: Text(label),
      );
    }
    return FloatingActionButton(
      mini: m['mini'] as bool? ?? false,
      onPressed: onTap,
      child: Icon(_iconData(icon ?? 'add')),
    );
  }

  /// `segmentedButton` — `{segments: [{value, label, icon?}], selected:
  /// [value], multiSelect?, onChanged}`; selection posts `{'value': list}` in
  /// multi mode, `{'value': first}` otherwise.
  Widget _segmentedButtonNode(Map<String, dynamic> m) {
    final segments = (m['segments'] as List? ?? const <dynamic>[])
        .map(_buttonSegment)
        .toList();
    if (segments.isEmpty) return const SizedBox.shrink();
    final multi = m['multiSelect'] as bool? ?? false;
    final selected = (m['selected'] as List? ?? const <dynamic>[])
        .map((v) => '$v')
        .toSet();
    return SegmentedButton<String>(
      segments: segments,
      selected: selected,
      multiSelectionEnabled: multi,
      emptySelectionAllowed: true,
      onSelectionChanged: (next) =>
          _postValue(m, multi ? next.toList() : next.firstOrNull),
    );
  }

  ButtonSegment<String> _buttonSegment(dynamic raw) {
    final item = raw is Map
        ? raw.cast<String, dynamic>()
        : <String, dynamic>{'value': '$raw'};
    final value = '${item['value'] ?? item['label'] ?? ''}';
    final icon = item['icon'] as String?;
    return ButtonSegment<String>(
      value: value,
      label: Text('${item['label'] ?? value}'),
      icon: icon == null ? null : Icon(_iconData(icon)),
    );
  }

  /// `radio` — `{value, groupValue, label?, onChanged}`; selecting posts
  /// `{'value': value}`.
  Widget _radioNode(Map<String, dynamic> m) {
    final handler = _changeHandler<String>(m);
    final control = Radio<String>(
      value: '${m['value']}',
      // ignore: deprecated_member_use
      groupValue: m['groupValue']?.toString(),
      // ignore: deprecated_member_use
      onChanged: handler == null
          ? null
          : (next) {
              if (next != null) handler(next);
            },
    );
    final label = m['label'] as String?;
    if (label == null) return control;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        control,
        const SizedBox(width: 8),
        Flexible(child: Text(label)),
      ],
    );
  }

  /// `searchBar` — `{hint?, onChanged?, onSubmitted?}`; both callbacks post
  /// `{'value': text}`.
  Widget _searchBarNode(Map<String, dynamic> m) {
    return SearchBar(
      hintText: m['hint'] as String?,
      onChanged: (text) {
        final action = m['onChange'] ?? m['onChanged'];
        if (action != null) {
          onEvent('$action', <String, dynamic>{'value': text});
        }
      },
      onSubmitted: (text) {
        final action = m['onSubmitted'];
        if (action != null) {
          onEvent('$action', <String, dynamic>{'value': text});
        }
      },
    );
  }

  /// `tooltip` — `{message, child}`.
  Widget _tooltipNode(Map<String, dynamic> m) => Tooltip(
    message: '${m['message'] ?? ''}',
    child: _child(m) ?? const SizedBox(),
  );

  /// `popupMenu` — `{items: [{value, label, icon?}], icon?, onSelected}`;
  /// selection posts `{'value': selected}`.
  Widget _popupMenuNode(Map<String, dynamic> m) {
    final items = (m['items'] as List? ?? const <dynamic>[])
        .map(_popupMenuItem)
        .toList();
    final icon = m['icon'] as String?;
    return PopupMenuButton<String>(
      icon: icon == null ? null : Icon(_iconData(icon)),
      itemBuilder: (_) => items,
      onSelected: (value) => _postValue(m, value),
    );
  }

  PopupMenuItem<String> _popupMenuItem(dynamic raw) {
    final item = raw is Map
        ? raw.cast<String, dynamic>()
        : <String, dynamic>{'value': '$raw'};
    final value = '${item['value'] ?? item['label'] ?? ''}';
    final icon = item['icon'] as String?;
    final label = Text('${item['label'] ?? value}');
    return PopupMenuItem<String>(
      value: value,
      child: icon == null
          ? label
          : Row(
              children: [
                Icon(_iconData(icon), size: 18),
                const SizedBox(width: 8),
                Flexible(child: label),
              ],
            ),
    );
  }

  /// `banner` — `{message, icon?, actions: [{label, onTap}]}`.
  Widget _bannerNode(Map<String, dynamic> m) {
    final icon = m['icon'] as String?;
    final actions = (m['actions'] as List? ?? const <dynamic>[])
        .map(_bannerAction)
        .toList();
    return MaterialBanner(
      content: Row(
        children: [
          if (icon != null) ...[
            Icon(_iconData(icon)),
            const SizedBox(width: 12),
          ],
          Expanded(child: Text('${m['message'] ?? ''}')),
        ],
      ),
      // MaterialBanner requires at least one action slot.
      actions: actions.isEmpty ? const <Widget>[SizedBox()] : actions,
    );
  }

  Widget _bannerAction(dynamic raw) {
    final item = raw is Map
        ? raw.cast<String, dynamic>()
        : <String, dynamic>{};
    return TextButton(
      onPressed: _tapHandler(item['onTap'], item['payload']),
      child: Text('${item['label'] ?? ''}'),
    );
  }

  /// `bottomAppBar` — `{children: [node], color?, height?}`.
  Widget _bottomAppBarNode(Map<String, dynamic> m) => BottomAppBar(
    color: _color(m['color'] as String?),
    child: SizedBox(
      height: _doubleOrNull(m['height']),
      child: Row(children: _children(m)),
    ),
  );
}
