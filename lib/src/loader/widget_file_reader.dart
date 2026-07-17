/// Abstracts file reads for widget loading so the host can provide the
/// implementation (filesystem on VM, indexed DB/assets on web).
abstract class WidgetFileReader {
  Future<String?> readString(String path);

  /// Returns true if [path] exists and is readable.
  Future<bool> exists(String path);
}

/// Simple in-memory [WidgetFileReader] backed by a map of path → content.
class MemoryWidgetFileReader implements WidgetFileReader {
  MemoryWidgetFileReader(this.files);

  final Map<String, String> files;

  @override
  Future<String?> readString(String path) async => files[path];

  @override
  Future<bool> exists(String path) async => files.containsKey(path);
}
