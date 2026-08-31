import 'dart:async';
import 'dart:js_interop';
import 'dart:ui_web' as ui_web;

import 'package:flutter/widgets.dart';
import 'package:js_widget_runtime/src/renderer/media/js_media_controller.dart';
import 'package:js_widget_runtime/src/renderer/media/js_media_host.dart';
import 'package:web/web.dart' as web;

/// Creates the web implementation of [JsMediaHost]: HTML `<video>` /
/// `<audio>` elements driven through [JsMediaController]. The video
/// surface is an [HtmlElementView] platform view; audio is headless.
///
/// Browser autoplay policies apply: [JsMediaController.play] rejects
/// without a user gesture unless the element is muted — the renderer's
/// transport controls call `play()` from tap handlers, which qualifies.
JsMediaHost createWebMediaHost() => const WebMediaHost();

/// HTML-element-backed [JsMediaHost] for Flutter web.
class WebMediaHost extends JsMediaHost {
  const WebMediaHost();

  static int _instances = 0;

  @override
  JsVideoController createVideoController(String src) =>
      _WebVideoController(src, 'jsr-video-${_instances++}');

  @override
  JsAudioController createAudioController(String src) =>
      _WebAudioController(src);
}

/// Shared plumbing for `<video>`/`<audio>` element controllers.
mixin _ElementController<T extends web.HTMLMediaElement>
    implements JsMediaController {
  late final T element;

  final _positionCtrl = StreamController<Duration>.broadcast();
  final _durationCtrl = StreamController<Duration>.broadcast();
  final _playingCtrl = StreamController<bool>.broadcast();
  bool _disposed = false;

  void initElement(T el, String src) {
    element = el;
    el.src = src;
    el.preload = 'metadata';
    void on(String type, void Function() fn) =>
        el.addEventListener(type, ((web.Event _) => fn()).toJS);
    on('timeupdate', () {
      if (!_disposed) {
        _positionCtrl.add(Duration(milliseconds: (el.currentTime * 1000).round()));
      }
    });
    on('durationchange', () {
      if (!_disposed && !el.duration.isNaN) {
        _durationCtrl.add(Duration(milliseconds: (el.duration * 1000).round()));
      }
    });
    on('loadedmetadata', () {
      if (!_disposed && !el.duration.isNaN) {
        _durationCtrl.add(Duration(milliseconds: (el.duration * 1000).round()));
      }
    });
    on('play', () {
      if (!_disposed) _playingCtrl.add(true);
    });
    on('pause', () {
      if (!_disposed) _playingCtrl.add(false);
    });
    on('ended', () {
      if (!_disposed) _playingCtrl.add(false);
    });
  }

  @override
  Stream<Duration> get positionStream => _positionCtrl.stream;
  @override
  Stream<Duration> get durationStream => _durationCtrl.stream;
  @override
  Stream<bool> get playingStream => _playingCtrl.stream;

  @override
  Future<void> play() async {
    try {
      await element.play().toDart;
    } catch (_) {
      // Autoplay policy rejection — the UI stays paused.
    }
  }

  @override
  Future<void> pause() async {
    element.pause();
  }

  @override
  Future<void> seek(Duration position) async {
    element.currentTime = position.inMilliseconds / 1000.0;
  }

  @override
  Future<void> setVolume(double volume) async {
    element.volume = volume.clamp(0.0, 1.0);
  }

  @override
  Future<void> setLoop(bool loop) async {
    element.loop = loop;
  }

  @override
  Future<void> dispose() async {
    _disposed = true;
    element.pause();
    element.removeAttribute('src');
    element.load(); // release the media resource
    await _positionCtrl.close();
    await _durationCtrl.close();
    await _playingCtrl.close();
  }
}

class _WebVideoController extends JsVideoController
    with _ElementController<web.HTMLVideoElement> {
  _WebVideoController(String src, this._viewType) {
    final el = web.document.createElement('video') as web.HTMLVideoElement;
    initElement(el, src);
    el.controls = false;
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.display = 'block';
    el.style.backgroundColor = 'black';
    ui_web.platformViewRegistry.registerViewFactory(_viewType, (int _) => el);
  }

  final String _viewType;
  final _aspectCtrl = StreamController<double?>.broadcast();
  double? _aspect;

  @override
  void initElement(web.HTMLVideoElement el, String src) {
    super.initElement(el, src);
    el.addEventListener(
      'loadedmetadata',
      ((web.Event _) {
        if (el.videoWidth > 0 && el.videoHeight > 0) {
          _aspect = el.videoWidth / el.videoHeight;
          if (!_disposed) _aspectCtrl.add(_aspect);
        }
      }).toJS,
    );
  }

  @override
  double? get aspectRatio => _aspect;

  @override
  Stream<double?> get aspectRatioStream => _aspectCtrl.stream;

  @override
  Widget buildVideo(
    BuildContext context, {
    BoxFit fit = BoxFit.contain,
    double? width,
    double? height,
  }) {
    element.style.objectFit = switch (fit) {
      BoxFit.cover => 'cover',
      BoxFit.fill => 'fill',
      _ => 'contain',
    };
    return SizedBox(
      width: width,
      height: height,
      child: HtmlElementView(viewType: _viewType),
    );
  }

  @override
  Future<void> dispose() async {
    await super.dispose();
    await _aspectCtrl.close();
  }
}

class _WebAudioController extends JsAudioController
    with _ElementController<web.HTMLAudioElement> {
  _WebAudioController(String src) {
    initElement(web.document.createElement('audio') as web.HTMLAudioElement, src);
  }
}
