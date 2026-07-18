import 'dart:io';

import 'package:flutter/widgets.dart';

/// VM/native implementation that resolves a file path to a [FileImage].
ImageProvider? resolveFileImageProvider(String path) => FileImage(File(path));
