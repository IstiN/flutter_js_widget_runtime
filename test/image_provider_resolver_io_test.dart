import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/image_provider_resolver_io.dart';

void main() {
  test('resolveFileImageProvider returns FileImage for file path', () {
    final provider = resolveFileImageProvider('/tmp/test_image.png');
    expect(provider, isA<FileImage>());
    final fileImage = provider! as FileImage;
    expect(fileImage.file.path, '/tmp/test_image.png');
  });
}
