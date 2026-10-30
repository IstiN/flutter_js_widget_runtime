import 'dart:io';

const _examples = <String>{
  'webgl_interactive_raycasting_points',
  'webgl_interactive_cubes',
  'webgl_interactive_cubes_ortho',
  'webgl_interactive_lines',
  'webgl_geometry_extrude_shapes',
  'webgl_math_obb',
  'webgl_buffergeometry_points_interleaved',
  'webgl_interactive_voxelpainter',
  'webgl_panorama_equirectangular',
  'webgl_geometry_minecraft',
  'webgl_geometry_colors',
  'webgl_lines_colors',
  'webgl_buffergeometry_uint',
  'webgl_buffergeometry_indexed',
  'webgl_buffergeometry_lines_indexed',
  'webgl_buffergeometry_points',
  'webgl_geometry_terrain_raycast',
  'webgl_math_orientation_transform',
  'webgl_instancing_raycast',
  'webgl_instancing_scatter',
  'webgl_interactive_buffergeometry',
  'webgl_clipping',
  'webgl_clipping_intersection',
  'webgl_lights_spotlights',
  'webgl_lights_hemisphere',
  'webgl_interactive_points',
  'webgl_points_billboards',
  'webgl_helpers',
  'webgl_geometry_spline_editor',
  'webgl_buffergeometry',
  'webgl_buffergeometry_lines',
  'webgl_camera',
  'webgl_clipping_advanced',
  'webgl_geometry_teapot',
  'webgl_geometry_extrude_splines',
  'webgl_lights_physical',
  'webgl_lights_spotlight',
  'webgl_loader_ply',
  'webgl_loader_stl',
  'webgl_materials_matcap',
  'webgl_materials_toon',
  'webgl_materials_normalmap',
  'webgl_materials_bumpmap',
  'webgl_materials_displacementmap',
  'webgl_geometry_shapes',
  'webgl_geometry_text_shapes',
  'webgl_sprites',
  'webgl_raycaster_sprite',
  'webgl_raycaster_texture',
  'webgl_camera_logarithmicdepthbuffer',
  'webgl_instancing_performance',
  'webgl_shadowmap_pointlight',
  'webgl_loader_xyz',
  'webgl_geometry_convex',
  'webgl_materials_texture_filters',
  'webgl_materials_cubemap_refraction',
  'webgl_geometry_cube',
  'webgl_materials_texture_anisotropy',
  'webgl_materials_texture_canvas',
  'webgl_materials_texture_partialupdate',
  'webgl_materials_texture_rotation',
  'webgl_materials_modified',
};

/// Prepares generated widgets from a pinned, local three.js source tree.
Future<void> main(List<String> arguments) async {
  if (arguments.length == 1 &&
      (arguments.single == '--help' || arguments.single == '-h')) {
    _usage();
    return;
  }
  if (arguments.length < 2 ||
      arguments[0] != 'prepare' ||
      !_examples.contains(arguments[1])) {
    stderr.writeln('Expected: prepare <supported official example>');
    _usage(stderr);
    exitCode = 64;
    return;
  }

  final script = File.fromUri(Platform.script).absolute;
  final root = script.parent.parent;
  final helper = File(
    '${root.path}${Platform.pathSeparator}tool${Platform.pathSeparator}'
    'three_example${Platform.pathSeparator}prepare.mjs',
  );
  if (!helper.existsSync()) {
    stderr.writeln(
      'Cannot locate ${helper.path}; run from the package checkout.',
    );
    exitCode = 1;
    return;
  }

  try {
    final process = await Process.start(
      'node',
      <String>[helper.path, ...arguments.skip(1)],
      workingDirectory: root.path,
      mode: ProcessStartMode.inheritStdio,
    );
    exitCode = await process.exitCode;
  } on ProcessException catch (error) {
    stderr.writeln('Unable to run Node.js: ${error.message}');
    exitCode = 1;
  }
}

void _usage([IOSink? sink]) {
  (sink ?? stdout).writeln(
    'Usage: dart run bin/jsr_three_example.dart prepare '
    '<webgl_interactive_raycasting_points|webgl_interactive_cubes|'
    'webgl_interactive_cubes_ortho|webgl_interactive_lines|'
    'webgl_geometry_extrude_shapes|webgl_math_obb|'
    'webgl_buffergeometry_points_interleaved|webgl_interactive_voxelpainter|'
    'webgl_panorama_equirectangular|'
    'webgl_geometry_minecraft|webgl_geometry_colors|webgl_lines_colors|'
    'webgl_buffergeometry_uint|webgl_buffergeometry_indexed|'
    'webgl_buffergeometry_lines_indexed|'
    'webgl_buffergeometry_points|webgl_geometry_terrain_raycast|'
    'webgl_math_orientation_transform|'
    'webgl_instancing_raycast|webgl_interactive_buffergeometry|webgl_clipping|'
    'webgl_clipping_intersection|webgl_lights_spotlights|'
    'webgl_lights_hemisphere|webgl_interactive_points|webgl_helpers|'
    'webgl_geometry_spline_editor> '
    '[--source <three-r186-dir>] [--offline] [--verify]\n'
    'THREE_SRC may supply the source directory. Resolution is always local-only.',
  );
}
