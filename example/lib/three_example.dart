import 'dart:async';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/foundation.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

import 'camera_host.dart';
import 'media_host.dart';
import 'three_load_time_hints.dart';
import 'three_widget_assets.dart';

/// Generated official examples exposed by this runner.
enum ThreeExampleSelection {
  minecraft(
    exampleId: 'webgl_geometry_minecraft',
    label: 'Minecraft',
    widgetId: 'three-minecraft',
    assetPath: 'widgets/three-minecraft/widget.js',
  ),
  geometryColors(
    exampleId: 'webgl_geometry_colors',
    label: 'Vertex Colors',
    widgetId: 'three-geometry-colors',
    assetPath: 'widgets/three-geometry-colors/widget.js',
  ),
  linesColors(
    exampleId: 'webgl_lines_colors',
    label: 'Line Colors',
    widgetId: 'three-lines-colors',
    assetPath: 'widgets/three-lines-colors/widget.js',
  ),
  bufferGeometryUint(
    exampleId: 'webgl_buffergeometry_uint',
    label: 'Integer BufferGeometry',
    widgetId: 'three-buffergeometry-uint',
    assetPath: 'widgets/three-buffergeometry-uint/widget.js',
  ),
  bufferGeometryIndexed(
    exampleId: 'webgl_buffergeometry_indexed',
    label: 'Indexed BufferGeometry',
    widgetId: 'three-buffergeometry-indexed',
    assetPath: 'widgets/three-buffergeometry-indexed/widget.js',
  ),
  bufferGeometryLinesIndexed(
    exampleId: 'webgl_buffergeometry_lines_indexed',
    label: 'Indexed BufferGeometry Lines',
    widgetId: 'three-buffergeometry-lines-indexed',
    assetPath: 'widgets/three-buffergeometry-lines-indexed/widget.js',
  ),
  bufferGeometry(
    exampleId: 'webgl_buffergeometry',
    label: 'BufferGeometry',
    widgetId: 'three-buffergeometry',
    assetPath: 'widgets/three-buffergeometry/widget.js',
  ),
  camera(
    exampleId: 'webgl_camera',
    label: 'Camera (O/P keys)',
    widgetId: 'three-camera',
    assetPath: 'widgets/three-camera/widget.js',
  ),
  clippingAdvanced(
    exampleId: 'webgl_clipping_advanced',
    label: 'Clipping Advanced',
    widgetId: 'three-clipping-advanced',
    assetPath: 'widgets/three-clipping-advanced/widget.js',
  ),
  geometryExtrudeSplines(
    exampleId: 'webgl_geometry_extrude_splines',
    label: 'Extrude Splines',
    widgetId: 'three-geometry-extrude-splines',
    assetPath: 'widgets/three-geometry-extrude-splines/widget.js',
  ),
  materialsTextureRotation(
    exampleId: 'webgl_materials_texture_rotation',
    label: 'Texture Rotation (UV matrix)',
    widgetId: 'three-materials-texture-rotation',
    assetPath: 'widgets/three-materials-texture-rotation/widget.js',
  ),
  geometryShapes(
    exampleId: 'webgl_geometry_shapes',
    label: 'Geometry Shapes',
    widgetId: 'three-geometry-shapes',
    assetPath: 'widgets/three-geometry-shapes/widget.js',
  ),
  pointsBillboards(
    exampleId: 'webgl_points_billboards',
    label: 'Points Billboards (Exp2 Fog)',
    widgetId: 'three-points-billboards',
    assetPath: 'widgets/three-points-billboards/widget.js',
  ),
  shadowmapPointlight(
    exampleId: 'webgl_shadowmap_pointlight',
    label: 'Shadowmap PointLight (alphaMap)',
    widgetId: 'three-shadowmap-pointlight',
    assetPath: 'widgets/three-shadowmap-pointlight/widget.js',
  ),
  loaderPly(
    exampleId: 'webgl_loader_ply',
    label: 'PLY Loader',
    widgetId: 'three-loader-ply',
    assetPath: 'widgets/three-loader-ply/widget.js',
  ),
  loaderStl(
    exampleId: 'webgl_loader_stl',
    label: 'STL Loader',
    widgetId: 'three-loader-stl',
    assetPath: 'widgets/three-loader-stl/widget.js',
  ),
  bufferGeometryPoints(
    exampleId: 'webgl_buffergeometry_points',
    label: 'BufferGeometry Points',
    widgetId: 'three-buffergeometry-points',
    assetPath: 'widgets/three-buffergeometry-points/widget.js',
  ),
  geometryTerrainRaycast(
    exampleId: 'webgl_geometry_terrain_raycast',
    label: 'Terrain Raycast',
    widgetId: 'three-geometry-terrain-raycast',
    assetPath: 'widgets/three-geometry-terrain-raycast/widget.js',
  ),
  mathOrientationTransform(
    exampleId: 'webgl_math_orientation_transform',
    label: 'Orientation Transform',
    widgetId: 'three-math-orientation-transform',
    assetPath: 'widgets/three-math-orientation-transform/widget.js',
  ),
  interactiveRaycastingPoints(
    exampleId: 'webgl_interactive_raycasting_points',
    label: 'Raycasting Points',
    widgetId: 'three-interactive-raycasting-points',
    assetPath: 'widgets/three-interactive-raycasting-points/widget.js',
  ),
  interactiveCubes(
    exampleId: 'webgl_interactive_cubes',
    label: 'Interactive Cubes',
    widgetId: 'three-interactive-cubes',
    assetPath: 'widgets/three-interactive-cubes/widget.js',
  ),
  interactiveCubesOrtho(
    exampleId: 'webgl_interactive_cubes_ortho',
    label: 'Orthographic Cubes',
    widgetId: 'three-interactive-cubes-ortho',
    assetPath: 'widgets/three-interactive-cubes-ortho/widget.js',
  ),
  interactiveLines(
    exampleId: 'webgl_interactive_lines',
    label: 'Interactive Lines',
    widgetId: 'three-interactive-lines',
    assetPath: 'widgets/three-interactive-lines/widget.js',
  ),
  interactiveBufferGeometry(
    exampleId: 'webgl_interactive_buffergeometry',
    label: 'Interactive BufferGeometry',
    widgetId: 'three-interactive-buffergeometry',
    assetPath: 'widgets/three-interactive-buffergeometry/widget.js',
  ),
  clipping(
    exampleId: 'webgl_clipping',
    label: 'Clipping',
    widgetId: 'three-clipping',
    assetPath: 'widgets/three-clipping/widget.js',
  ),
  clippingIntersection(
    exampleId: 'webgl_clipping_intersection',
    label: 'Clipping Intersection',
    widgetId: 'three-clipping-intersection',
    assetPath: 'widgets/three-clipping-intersection/widget.js',
  ),
  lightsSpotlights(
    exampleId: 'webgl_lights_spotlights',
    label: 'Spot Lights',
    widgetId: 'three-lights-spotlights',
    assetPath: 'widgets/three-lights-spotlights/widget.js',
  ),
  lightsHemisphere(
    exampleId: 'webgl_lights_hemisphere',
    label: 'Hemisphere Light',
    widgetId: 'three-lights-hemisphere',
    assetPath: 'widgets/three-lights-hemisphere/widget.js',
  ),
  interactivePoints(
    exampleId: 'webgl_interactive_points',
    label: 'Interactive Points',
    widgetId: 'three-interactive-points',
    assetPath: 'widgets/three-interactive-points/widget.js',
  ),
  helpers(
    exampleId: 'webgl_helpers',
    label: 'Helpers',
    widgetId: 'three-helpers',
    assetPath: 'widgets/three-helpers/widget.js',
  ),
  geometrySplineEditor(
    exampleId: 'webgl_geometry_spline_editor',
    label: 'Spline Editor',
    widgetId: 'three-geometry-spline-editor',
    assetPath: 'widgets/three-geometry-spline-editor/widget.js',
  ),
  instancingRaycast(
    exampleId: 'webgl_instancing_raycast',
    label: 'Instancing Raycast',
    widgetId: 'three-instancing-raycast',
    assetPath: 'widgets/three-instancing-raycast/widget.js',
  ),
  extrudeShapes(
    exampleId: 'webgl_geometry_extrude_shapes',
    label: 'Extrude Shapes',
    widgetId: 'three-extrude-shapes',
    assetPath: 'widgets/three-extrude-shapes/widget.js',
  ),
  mathObb(
    exampleId: 'webgl_math_obb',
    label: 'Oriented Bounding Boxes',
    widgetId: 'three-math-obb',
    assetPath: 'widgets/three-math-obb/widget.js',
  ),
  bufferGeometryPointsInterleaved(
    exampleId: 'webgl_buffergeometry_points_interleaved',
    label: 'Interleaved Points',
    widgetId: 'three-buffergeometry-points-interleaved',
    assetPath: 'widgets/three-buffergeometry-points-interleaved/widget.js',
  ),
  interactiveVoxelPainter(
    exampleId: 'webgl_interactive_voxelpainter',
    label: 'Voxel Painter',
    widgetId: 'three-interactive-voxelpainter',
    assetPath: 'widgets/three-interactive-voxelpainter/widget.js',
  ),
  panoramaEquirectangular(
    exampleId: 'webgl_panorama_equirectangular',
    label: 'Equirectangular Panorama',
    widgetId: 'three-panorama-equirectangular',
    assetPath: 'widgets/three-panorama-equirectangular/widget.js',
  ),
  loaderXyz(
    exampleId: 'webgl_loader_xyz',
    label: 'XYZ Loader',
    widgetId: 'three-loader-xyz',
    assetPath: 'widgets/three-loader-xyz/widget.js',
  ),
  geometryTextShapes(
    exampleId: 'webgl_geometry_text_shapes',
    label: 'Text Shapes',
    widgetId: 'three-geometry-text-shapes',
    assetPath: 'widgets/three-geometry-text-shapes/widget.js',
  ),
  geometryConvex(
    exampleId: 'webgl_geometry_convex',
    label: 'Convex Geometry',
    widgetId: 'three-geometry-convex',
    assetPath: 'widgets/three-geometry-convex/widget.js',
  ),
  geometryCube(
    exampleId: 'webgl_geometry_cube',
    label: 'Geometry Cube',
    widgetId: 'three-geometry-cube',
    assetPath: 'widgets/three-geometry-cube/widget.js',
  ),
  instancingScatter(
    exampleId: 'webgl_instancing_scatter',
    label: 'Instancing Scatter',
    widgetId: 'three-instancing-scatter',
    assetPath: 'widgets/three-instancing-scatter/widget.js',
  ),
  sprites(
    exampleId: 'webgl_sprites',
    label: 'Sprites',
    widgetId: 'three-sprites',
    assetPath: 'widgets/three-sprites/widget.js',
  ),
  raycasterSprite(
    exampleId: 'webgl_raycaster_sprite',
    label: 'Raycaster Sprite',
    widgetId: 'three-raycaster-sprite',
    assetPath: 'widgets/three-raycaster-sprite/widget.js',
  ),
  materialsMatcap(
    exampleId: 'webgl_materials_matcap',
    label: 'Matcap Material',
    widgetId: 'three-materials-matcap',
    assetPath: 'widgets/three-materials-matcap/widget.js',
  ),
  materialsNormalmap(
    exampleId: 'webgl_materials_normalmap',
    label: 'Normal Map Material',
    widgetId: 'three-materials-normalmap',
    assetPath: 'widgets/three-materials-normalmap/widget.js',
  ),
  materialsToon(
    exampleId: 'webgl_materials_toon',
    label: 'Toon Material (gradient map)',
    widgetId: 'three-materials-toon',
    assetPath: 'widgets/three-materials-toon/widget.js',
  ),
  geometryTeapot(
    exampleId: 'webgl_geometry_teapot',
    label: 'Teapot (Lee Perry)',
    widgetId: 'three-geometry-teapot',
    assetPath: 'widgets/three-geometry-teapot/widget.js',
  ),
  lightsSpotlight(
    exampleId: 'webgl_lights_spotlight',
    label: 'Spotlight',
    widgetId: 'three-lights-spotlight',
    assetPath: 'widgets/three-lights-spotlight/widget.js',
  ),
  materialsPartialupdate(
    exampleId: 'webgl_materials_texture_partialupdate',
    label: 'Texture Partial Update',
    widgetId: 'three-materials-partialupdate',
    assetPath: 'widgets/three-materials-partialupdate/widget.js',
  ),
  materialsTextureAnisotropy(
    exampleId: 'webgl_materials_texture_anisotropy',
    label: 'Texture Anisotropy',
    widgetId: 'three-materials-texture-anisotropy',
    assetPath: 'widgets/three-materials-texture-anisotropy/widget.js',
  ),
  materialsTextureFilters(
    exampleId: 'webgl_materials_texture_filters',
    label: 'Texture Filters',
    widgetId: 'three-materials-texture-filters',
    assetPath: 'widgets/three-materials-texture-filters/widget.js',
  ),

  geometries(
    exampleId: 'webgl_geometries',
    label: 'Geometries',
    widgetId: 'three-geometries',
    assetPath: 'widgets/three-geometries/widget.js',
  ),
  lod(
    exampleId: 'webgl_lod',
    label: 'LOD',
    widgetId: 'three-lod',
    assetPath: 'widgets/three-lod/widget.js',
  ),
  cameraArray(
    exampleId: 'webgl_camera_array',
    label: 'Camera Array',
    widgetId: 'three-camera-array',
    assetPath: 'widgets/three-camera-array/widget.js',
  ),
  bufferGeometryDrawRange(
    exampleId: 'webgl_buffergeometry_drawrange',
    label: 'Draw Range',
    widgetId: 'three-buffergeometry-drawrange',
    assetPath: 'widgets/three-buffergeometry-drawrange/widget.js',
  ),
  geometryText(
    exampleId: 'webgl_geometry_text',
    label: 'Geometry Text',
    widgetId: 'three-geometry-text',
    assetPath: 'widgets/three-geometry-text/widget.js',
  ),
  panoramaCube(
    exampleId: 'webgl_panorama_cube',
    label: 'Panorama Cube',
    widgetId: 'three-panorama-cube',
    assetPath: 'widgets/three-panorama-cube/widget.js',
  ),
  pointsSprites(
    exampleId: 'webgl_points_sprites',
    label: 'Points Sprites',
    widgetId: 'three-points-sprites',
    assetPath: 'widgets/three-points-sprites/widget.js',
  ),
  multipleViews(
    exampleId: 'webgl_multiple_views',
    label: 'Multiple Views',
    widgetId: 'three-multiple-views',
    assetPath: 'widgets/three-multiple-views/widget.js',
  ),
  loaderObj(
    exampleId: 'webgl_loader_obj',
    label: 'OBJ Loader',
    widgetId: 'three-loader-obj',
    assetPath: 'widgets/three-loader-obj/widget.js',
  ),
  materialsChannels(
    exampleId: 'webgl_materials_channels',
    label: 'Materials Channels',
    widgetId: 'three-materials-channels',
    assetPath: 'widgets/three-materials-channels/widget.js',
  ),
  materialsNormalmapObjectSpace(
    exampleId: 'webgl_materials_normalmap_object_space',
    label: 'Normal Map Object Space',
    widgetId: 'three-materials-normalmap-object-space',
    assetPath: 'widgets/three-materials-normalmap-object-space/widget.js',
  ),
  materialsPhysicalClearcoat(
    exampleId: 'webgl_materials_physical_clearcoat',
    label: 'Physical Clearcoat',
    widgetId: 'three-materials-physical-clearcoat',
    assetPath: 'widgets/three-materials-physical-clearcoat/widget.js',
  ),
  geometryNurbs(
    exampleId: 'webgl_geometry_nurbs',
    label: 'NURBS',
    widgetId: 'three-geometry-nurbs',
    assetPath: 'widgets/three-geometry-nurbs/widget.js',
  ),
  decals(
    exampleId: 'webgl_decals',
    label: 'Decals',
    widgetId: 'three-decals',
    assetPath: 'widgets/three-decals/widget.js',
  ),
  geometryTextStroke(
    exampleId: 'webgl_geometry_text_stroke',
    label: 'Text Stroke',
    widgetId: 'three-geometry-text-stroke',
    assetPath: 'widgets/three-geometry-text-stroke/widget.js',
  ),
  testMemory(
    exampleId: 'webgl_test_memory',
    label: 'Test Memory',
    widgetId: 'three-test-memory',
    assetPath: 'widgets/three-test-memory/widget.js',
  ),
  loaderTextureTga(
    exampleId: 'webgl_loader_texture_tga',
    label: 'TGA Texture',
    widgetId: 'three-loader-texture-tga',
    assetPath: 'widgets/three-loader-texture-tga/widget.js',
  ),

  morphtargets(
    exampleId: 'webgl_morphtargets',
    label: 'Morph Targets',
    widgetId: 'three-morphtargets',
    assetPath: 'widgets/three-morphtargets/widget.js',
  ),
  morphtargetsSphere(
    exampleId: 'webgl_morphtargets_sphere',
    label: 'Morph Sphere',
    widgetId: 'three-morphtargets-sphere',
    assetPath: 'widgets/three-morphtargets-sphere/widget.js',
  ),
  shadowmap(
    exampleId: 'webgl_shadowmap',
    label: 'Shadow Map',
    widgetId: 'three-shadowmap',
    assetPath: 'widgets/three-shadowmap/widget.js',
  ),
  shadowmapPerformance(
    exampleId: 'webgl_shadowmap_performance',
    label: 'Shadow Map Performance',
    widgetId: 'three-shadowmap-performance',
    assetPath: 'widgets/three-shadowmap-performance/widget.js',
  ),
  animationMultiple(
    exampleId: 'webgl_animation_multiple',
    label: 'Animation Multiple',
    widgetId: 'three-animation-multiple',
    assetPath: 'widgets/three-animation-multiple/widget.js',
  ),
  animationSkinningBlending(
    exampleId: 'webgl_animation_skinning_blending',
    label: 'Skinning Blending',
    widgetId: 'three-animation-skinning-blending',
    assetPath: 'widgets/three-animation-skinning-blending/widget.js',
  ),
  animationSkinningMorph(
    exampleId: 'webgl_animation_skinning_morph',
    label: 'Skinning Morph',
    widgetId: 'three-animation-skinning-morph',
    assetPath: 'widgets/three-animation-skinning-morph/widget.js',
  ),
  buffergeometryAttributesNone(
    exampleId: 'webgl_buffergeometry_attributes_none',
    label: 'Buffergeometry Attributes None',
    widgetId: 'three-buffergeometry-attributes-none',
    assetPath: 'widgets/three-buffergeometry-attributes-none/widget.js',
  ),
  buffergeometryLines(
    exampleId: 'webgl_buffergeometry_lines',
    label: 'Buffergeometry Lines',
    widgetId: 'three-buffergeometry-lines',
    assetPath: 'widgets/three-buffergeometry-lines/widget.js',
  ),
  buffergeometrySelectiveDraw(
    exampleId: 'webgl_buffergeometry_selective_draw',
    label: 'Buffergeometry Selective Draw',
    widgetId: 'three-buffergeometry-selective-draw',
    assetPath: 'widgets/three-buffergeometry-selective-draw/widget.js',
  ),
  cameraLogarithmicdepthbuffer(
    exampleId: 'webgl_camera_logarithmicdepthbuffer',
    label: 'Camera Logarithmicdepthbuffer',
    widgetId: 'three-camera-logarithmicdepthbuffer',
    assetPath: 'widgets/three-camera-logarithmicdepthbuffer/widget.js',
  ),
  effectsAnaglyph(
    exampleId: 'webgl_effects_anaglyph',
    label: 'Effects Anaglyph',
    widgetId: 'three-effects-anaglyph',
    assetPath: 'widgets/three-effects-anaglyph/widget.js',
  ),
  effectsStereo(
    exampleId: 'webgl_effects_stereo',
    label: 'Effects Stereo',
    widgetId: 'three-effects-stereo',
    assetPath: 'widgets/three-effects-stereo/widget.js',
  ),
  geometryColorsLookuptable(
    exampleId: 'webgl_geometry_colors_lookuptable',
    label: 'Geometry Colors Lookuptable',
    widgetId: 'three-geometry-colors-lookuptable',
    assetPath: 'widgets/three-geometry-colors-lookuptable/widget.js',
  ),
  geometryTerrain(
    exampleId: 'webgl_geometry_terrain',
    label: 'Geometry Terrain',
    widgetId: 'three-geometry-terrain',
    assetPath: 'widgets/three-geometry-terrain/widget.js',
  ),
  instancingDynamic(
    exampleId: 'webgl_instancing_dynamic',
    label: 'Instancing Dynamic',
    widgetId: 'three-instancing-dynamic',
    assetPath: 'widgets/three-instancing-dynamic/widget.js',
  ),
  instancingPerformance(
    exampleId: 'webgl_instancing_performance',
    label: 'Instancing Performance',
    widgetId: 'three-instancing-performance',
    assetPath: 'widgets/three-instancing-performance/widget.js',
  ),
  lightsPhysical(
    exampleId: 'webgl_lights_physical',
    label: 'Lights Physical',
    widgetId: 'three-lights-physical',
    assetPath: 'widgets/three-lights-physical/widget.js',
  ),
  linesDashed(
    exampleId: 'webgl_lines_dashed',
    label: 'Lines Dashed',
    widgetId: 'three-lines-dashed',
    assetPath: 'widgets/three-lines-dashed/widget.js',
  ),
  linesFat(
    exampleId: 'webgl_lines_fat',
    label: 'Lines Fat',
    widgetId: 'three-lines-fat',
    assetPath: 'widgets/three-lines-fat/widget.js',
  ),
  loaderPcd(
    exampleId: 'webgl_loader_pcd',
    label: 'Loader Pcd',
    widgetId: 'three-loader-pcd',
    assetPath: 'widgets/three-loader-pcd/widget.js',
  ),
  materialsBlending(
    exampleId: 'webgl_materials_blending',
    label: 'Materials Blending',
    widgetId: 'three-materials-blending',
    assetPath: 'widgets/three-materials-blending/widget.js',
  ),
  materialsBumpmap(
    exampleId: 'webgl_materials_bumpmap',
    label: 'Materials Bumpmap',
    widgetId: 'three-materials-bumpmap',
    assetPath: 'widgets/three-materials-bumpmap/widget.js',
  ),
  materialsCubemap(
    exampleId: 'webgl_materials_cubemap',
    label: 'Materials Cubemap',
    widgetId: 'three-materials-cubemap',
    assetPath: 'widgets/three-materials-cubemap/widget.js',
  ),
  materialsCubemapRefraction(
    exampleId: 'webgl_materials_cubemap_refraction',
    label: 'Materials Cubemap Refraction',
    widgetId: 'three-materials-cubemap-refraction',
    assetPath: 'widgets/three-materials-cubemap-refraction/widget.js',
  ),
  materialsDisplacementmap(
    exampleId: 'webgl_materials_displacementmap',
    label: 'Materials Displacementmap',
    widgetId: 'three-materials-displacementmap',
    assetPath: 'widgets/three-materials-displacementmap/widget.js',
  ),
  materialsEnvmaps(
    exampleId: 'webgl_materials_envmaps',
    label: 'Materials Envmaps',
    widgetId: 'three-materials-envmaps',
    assetPath: 'widgets/three-materials-envmaps/widget.js',
  ),
  materialsModified(
    exampleId: 'webgl_materials_modified',
    label: 'Materials Modified',
    widgetId: 'three-materials-modified',
    assetPath: 'widgets/three-materials-modified/widget.js',
  ),
  materialsTextureCanvas(
    exampleId: 'webgl_materials_texture_canvas',
    label: 'Materials Texture Canvas',
    widgetId: 'three-materials-texture-canvas',
    assetPath: 'widgets/three-materials-texture-canvas/widget.js',
  ),
  materialsWireframe(
    exampleId: 'webgl_materials_wireframe',
    label: 'Materials Wireframe',
    widgetId: 'three-materials-wireframe',
    assetPath: 'widgets/three-materials-wireframe/widget.js',
  ),
  modifierEdgesplit(
    exampleId: 'webgl_modifier_edgesplit',
    label: 'Modifier Edgesplit',
    widgetId: 'three-modifier-edgesplit',
    assetPath: 'widgets/three-modifier-edgesplit/widget.js',
  ),
  modifierSimplifier(
    exampleId: 'webgl_modifier_simplifier',
    label: 'Modifier Simplifier',
    widgetId: 'three-modifier-simplifier',
    assetPath: 'widgets/three-modifier-simplifier/widget.js',
  ),
  modifierTessellation(
    exampleId: 'webgl_modifier_tessellation',
    label: 'Modifier Tessellation',
    widgetId: 'three-modifier-tessellation',
    assetPath: 'widgets/three-modifier-tessellation/widget.js',
  ),
  multipleScenesComparison(
    exampleId: 'webgl_multiple_scenes_comparison',
    label: 'Multiple Scenes Comparison',
    widgetId: 'three-multiple-scenes-comparison',
    assetPath: 'widgets/three-multiple-scenes-comparison/widget.js',
  ),
  pointsWaves(
    exampleId: 'webgl_points_waves',
    label: 'Points Waves',
    widgetId: 'three-points-waves',
    assetPath: 'widgets/three-points-waves/widget.js',
  ),
  raycasterTexture(
    exampleId: 'webgl_raycaster_texture',
    label: 'Raycaster Texture',
    widgetId: 'three-raycaster-texture',
    assetPath: 'widgets/three-raycaster-texture/widget.js',
  ),
  rtt(
    exampleId: 'webgl_rtt',
    label: 'Rtt',
    widgetId: 'three-rtt',
    assetPath: 'widgets/three-rtt/widget.js',
  ),
  shader(
    exampleId: 'webgl_shader',
    label: 'Shader',
    widgetId: 'three-shader',
    assetPath: 'widgets/three-shader/widget.js',
  ),
  sandbox(
    exampleId: 'webaudio_sandbox',
    label: 'sandbox',
    widgetId: 'three-webaudio-sandbox',
    assetPath: 'widgets/three-webaudio-sandbox/widget.js',
  ),
  visualizer(
    exampleId: 'webaudio_visualizer',
    label: 'visualizer',
    widgetId: 'three-webaudio-visualizer',
    assetPath: 'widgets/three-webaudio-visualizer/widget.js',
  ),
  animationKeyframes(
    exampleId: 'webgl_animation_keyframes',
    label: 'animation - keyframes',
    widgetId: 'three-animation-keyframes',
    assetPath: 'widgets/three-animation-keyframes/widget.js',
  ),
  animationSkinningAdditiveBlending(
    exampleId: 'webgl_animation_skinning_additive_blending',
    label: 'additive animation - skinning',
    widgetId: 'three-animation-skinning-additive-blending',
    assetPath: 'widgets/three-animation-skinning-additive-blending/widget.js',
  ),
  animationSkinningIk(
    exampleId: 'webgl_animation_skinning_ik',
    label: 'animation - skinning - ik',
    widgetId: 'three-animation-skinning-ik',
    assetPath: 'widgets/three-animation-skinning-ik/widget.js',
  ),
  animationWalk(
    exampleId: 'webgl_animation_walk',
    label: 'animation - walk',
    widgetId: 'three-animation-walk',
    assetPath: 'widgets/three-animation-walk/widget.js',
  ),
  buffergeometryAttributesInteger(
    exampleId: 'webgl_buffergeometry_attributes_integer',
    label: 'Buffergeometry Attributes Integer',
    widgetId: 'three-buffergeometry-attributes-integer',
    assetPath: 'widgets/three-buffergeometry-attributes-integer/widget.js',
  ),
  buffergeometryCustomAttributesParticles(
    exampleId: 'webgl_buffergeometry_custom_attributes_particles',
    label: 'buffer geometry custom attributes - particles',
    widgetId: 'three-buffergeometry-custom-attributes-particles',
    assetPath:
        'widgets/three-buffergeometry-custom-attributes-particles/widget.js',
  ),
  buffergeometryGlbufferattribute(
    exampleId: 'webgl_buffergeometry_glbufferattribute',
    label: 'buffergeometry - custom VBOs',
    widgetId: 'three-buffergeometry-glbufferattribute',
    assetPath: 'widgets/three-buffergeometry-glbufferattribute/widget.js',
  ),
  buffergeometryInstancing(
    exampleId: 'webgl_buffergeometry_instancing',
    label: 'instancing test (single triangle)',
    widgetId: 'three-buffergeometry-instancing',
    assetPath: 'widgets/three-buffergeometry-instancing/widget.js',
  ),
  buffergeometryInstancingBillboards(
    exampleId: 'webgl_buffergeometry_instancing_billboards',
    label: 'instanced particles - billboards - colors',
    widgetId: 'three-buffergeometry-instancing-billboards',
    assetPath: 'widgets/three-buffergeometry-instancing-billboards/widget.js',
  ),
  buffergeometryInstancingInterleaved(
    exampleId: 'webgl_buffergeometry_instancing_interleaved',
    label: 'indexed instancing (single box), interleaved buffers',
    widgetId: 'three-buffergeometry-instancing-interleaved',
    assetPath: 'widgets/three-buffergeometry-instancing-interleaved/widget.js',
  ),
  buffergeometryRawshader(
    exampleId: 'webgl_buffergeometry_rawshader',
    label: 'raw shader',
    widgetId: 'three-buffergeometry-rawshader',
    assetPath: 'widgets/three-buffergeometry-rawshader/widget.js',
  ),
  clipculldistance(
    exampleId: 'webgl_clipculldistance',
    label: 'Clipculldistance',
    widgetId: 'three-clipculldistance',
    assetPath: 'widgets/three-clipculldistance/widget.js',
  ),
  clippingStencil(
    exampleId: 'webgl_clipping_stencil',
    label: 'clipping stencil',
    widgetId: 'three-clipping-stencil',
    assetPath: 'widgets/three-clipping-stencil/widget.js',
  ),
  customAttributes(
    exampleId: 'webgl_custom_attributes',
    label: 'custom attributes',
    widgetId: 'three-custom-attributes',
    assetPath: 'widgets/three-custom-attributes/widget.js',
  ),
  customAttributesLines(
    exampleId: 'webgl_custom_attributes_lines',
    label: 'custom attributes [lines]',
    widgetId: 'three-custom-attributes-lines',
    assetPath: 'widgets/three-custom-attributes-lines/widget.js',
  ),
  customAttributesPoints(
    exampleId: 'webgl_custom_attributes_points',
    label: 'custom attributes [particles]',
    widgetId: 'three-custom-attributes-points',
    assetPath: 'widgets/three-custom-attributes-points/widget.js',
  ),
  customAttributesPoints2(
    exampleId: 'webgl_custom_attributes_points2',
    label: 'custom attributes [particles][billboards]',
    widgetId: 'three-custom-attributes-points2',
    assetPath: 'widgets/three-custom-attributes-points2/widget.js',
  ),
  customAttributesPoints3(
    exampleId: 'webgl_custom_attributes_points3',
    label: 'custom attributes [particles][billboards][alphatest]',
    widgetId: 'three-custom-attributes-points3',
    assetPath: 'widgets/three-custom-attributes-points3/widget.js',
  ),
  depthTexture(
    exampleId: 'webgl_depth_texture',
    label: 'Depth Texture',
    widgetId: 'three-depth-texture',
    assetPath: 'widgets/three-depth-texture/widget.js',
  ),
  effectsAscii(
    exampleId: 'webgl_effects_ascii',
    label: 'effects - ascii',
    widgetId: 'three-effects-ascii',
    assetPath: 'widgets/three-effects-ascii/widget.js',
  ),
  effectsParallaxbarrier(
    exampleId: 'webgl_effects_parallaxbarrier',
    label: 'effects - parallax barrier',
    widgetId: 'three-effects-parallaxbarrier',
    assetPath: 'widgets/three-effects-parallaxbarrier/widget.js',
  ),
  framebufferTexture(
    exampleId: 'webgl_framebuffer_texture',
    label: 'framebuffer - texture',
    widgetId: 'three-framebuffer-texture',
    assetPath: 'widgets/three-framebuffer-texture/widget.js',
  ),
  furnaceTest(
    exampleId: 'webgl_furnace_test',
    label: 'Furnace Test',
    widgetId: 'three-furnace-test',
    assetPath: 'widgets/three-furnace-test/widget.js',
  ),
  gpgpuBirds(
    exampleId: 'webgl_gpgpu_birds',
    label: 'gpgpu - flocking',
    widgetId: 'three-gpgpu-birds',
    assetPath: 'widgets/three-gpgpu-birds/widget.js',
  ),
  gpgpuBirdsGltf(
    exampleId: 'webgl_gpgpu_birds_gltf',
    label: 'gpgpu - flocking',
    widgetId: 'three-gpgpu-birds-gltf',
    assetPath: 'widgets/three-gpgpu-birds-gltf/widget.js',
  ),
  gpgpuProtoplanet(
    exampleId: 'webgl_gpgpu_protoplanet',
    label: 'gpgpu - protoplanet',
    widgetId: 'three-gpgpu-protoplanet',
    assetPath: 'widgets/three-gpgpu-protoplanet/widget.js',
  ),
  gpgpuWater(
    exampleId: 'webgl_gpgpu_water',
    label: 'gpgpu - water',
    widgetId: 'three-gpgpu-water',
    assetPath: 'widgets/three-gpgpu-water/widget.js',
  ),
  instancingMorph(
    exampleId: 'webgl_instancing_morph',
    label: 'instancing - Morph Target Animations',
    widgetId: 'three-instancing-morph',
    assetPath: 'widgets/three-instancing-morph/widget.js',
  ),
  interactiveCubesGpu(
    exampleId: 'webgl_interactive_cubes_gpu',
    label: 'interactive cubes (gpu)',
    widgetId: 'three-interactive-cubes-gpu',
    assetPath: 'widgets/three-interactive-cubes-gpu/widget.js',
  ),
  lensflares(
    exampleId: 'webgl_lensflares',
    label: 'lensflares',
    widgetId: 'three-lensflares',
    assetPath: 'widgets/three-lensflares/widget.js',
  ),
  lightprobe(
    exampleId: 'webgl_lightprobe',
    label: 'light probe',
    widgetId: 'three-lightprobe',
    assetPath: 'widgets/three-lightprobe/widget.js',
  ),
  lightprobeCubecamera(
    exampleId: 'webgl_lightprobe_cubecamera',
    label: 'light probe from cubeCamera',
    widgetId: 'three-lightprobe-cubecamera',
    assetPath: 'widgets/three-lightprobe-cubecamera/widget.js',
  ),
  lightprobes(
    exampleId: 'webgl_lightprobes',
    label: 'light probe volume',
    widgetId: 'three-lightprobes',
    assetPath: 'widgets/three-lightprobes/widget.js',
  ),
  lightprobesComplex(
    exampleId: 'webgl_lightprobes_complex',
    label: 'light probe volume (multi-room)',
    widgetId: 'three-lightprobes-complex',
    assetPath: 'widgets/three-lightprobes-complex/widget.js',
  ),
  lightprobesSponza(
    exampleId: 'webgl_lightprobes_sponza',
    label: 'light probe volume (Sponza)',
    widgetId: 'three-lightprobes-sponza',
    assetPath: 'widgets/three-lightprobes-sponza/widget.js',
  ),
  lightsRectarealight(
    exampleId: 'webgl_lights_rectarealight',
    label: 'lights - rect area light',
    widgetId: 'three-lights-rectarealight',
    assetPath: 'widgets/three-lights-rectarealight/widget.js',
  ),
  lightsSunlight(
    exampleId: 'webgl_lights_sunlight',
    label: 'lights - sunlight',
    widgetId: 'three-lights-sunlight',
    assetPath: 'widgets/three-lights-sunlight/widget.js',
  ),
  linesFatRaycasting(
    exampleId: 'webgl_lines_fat_raycasting',
    label: 'lines - fat',
    widgetId: 'three-lines-fat-raycasting',
    assetPath: 'widgets/three-lines-fat-raycasting/widget.js',
  ),
  linesFatWireframe(
    exampleId: 'webgl_lines_fat_wireframe',
    label: 'lines - fat - wireframe',
    widgetId: 'three-lines-fat-wireframe',
    assetPath: 'widgets/three-lines-fat-wireframe/widget.js',
  ),
  loader3dm(
    exampleId: 'webgl_loader_3dm',
    label: 'loaders - Rhino 3DM loader',
    widgetId: 'three-loader-3dm',
    assetPath: 'widgets/three-loader-3dm/widget.js',
  ),
  loader3ds(
    exampleId: 'webgl_loader_3ds',
    label: 'loaders - 3DS loader',
    widgetId: 'three-loader-3ds',
    assetPath: 'widgets/three-loader-3ds/widget.js',
  ),
  loader3mf(
    exampleId: 'webgl_loader_3mf',
    label: '3MF',
    widgetId: 'three-loader-3mf',
    assetPath: 'widgets/three-loader-3mf/widget.js',
  ),
  loader3mfMaterials(
    exampleId: 'webgl_loader_3mf_materials',
    label: '3MF',
    widgetId: 'three-loader-3mf-materials',
    assetPath: 'widgets/three-loader-3mf-materials/widget.js',
  ),
  loaderAmf(
    exampleId: 'webgl_loader_amf',
    label: 'AMF',
    widgetId: 'three-loader-amf',
    assetPath: 'widgets/three-loader-amf/widget.js',
  ),
  loaderBvh(
    exampleId: 'webgl_loader_bvh',
    label: 'loaders - BVHLoader',
    widgetId: 'three-loader-bvh',
    assetPath: 'widgets/three-loader-bvh/widget.js',
  ),
  loaderCollada(
    exampleId: 'webgl_loader_collada',
    label: 'collada',
    widgetId: 'three-loader-collada',
    assetPath: 'widgets/three-loader-collada/widget.js',
  ),
  loaderColladaKinematics(
    exampleId: 'webgl_loader_collada_kinematics',
    label: 'collada - kinematics',
    widgetId: 'three-loader-collada-kinematics',
    assetPath: 'widgets/three-loader-collada-kinematics/widget.js',
  ),
  loaderColladaSkinning(
    exampleId: 'webgl_loader_collada_skinning',
    label: 'collada - skinning',
    widgetId: 'three-loader-collada-skinning',
    assetPath: 'widgets/three-loader-collada-skinning/widget.js',
  ),
  loaderDraco(
    exampleId: 'webgl_loader_draco',
    label: 'loaders - Draco loader',
    widgetId: 'three-loader-draco',
    assetPath: 'widgets/three-loader-draco/widget.js',
  ),
  loaderFbx(
    exampleId: 'webgl_loader_fbx',
    label: 'FBX loader',
    widgetId: 'three-loader-fbx',
    assetPath: 'widgets/three-loader-fbx/widget.js',
  ),
  loaderFbxNurbs(
    exampleId: 'webgl_loader_fbx_nurbs',
    label: 'FBX loader - Nurbs',
    widgetId: 'three-loader-fbx-nurbs',
    assetPath: 'widgets/three-loader-fbx-nurbs/widget.js',
  ),
  loaderGcode(
    exampleId: 'webgl_loader_gcode',
    label: 'loaders - GCode loader',
    widgetId: 'three-loader-gcode',
    assetPath: 'widgets/three-loader-gcode/widget.js',
  ),
  loaderGltf(
    exampleId: 'webgl_loader_gltf',
    label: 'GLTFloader',
    widgetId: 'three-loader-gltf',
    assetPath: 'widgets/three-loader-gltf/widget.js',
  ),
  loaderGltfAnisotropy(
    exampleId: 'webgl_loader_gltf_anisotropy',
    label: 'GLTFloader + Anisotropy',
    widgetId: 'three-loader-gltf-anisotropy',
    assetPath: 'widgets/three-loader-gltf-anisotropy/widget.js',
  ),
  loaderGltfAvif(
    exampleId: 'webgl_loader_gltf_avif',
    label: 'GLTFloader + EXT_texture_avif',
    widgetId: 'three-loader-gltf-avif',
    assetPath: 'widgets/three-loader-gltf-avif/widget.js',
  ),
  loaderGltfCompressed(
    exampleId: 'webgl_loader_gltf_compressed',
    label: 'GLTFloader + compressed',
    widgetId: 'three-loader-gltf-compressed',
    assetPath: 'widgets/three-loader-gltf-compressed/widget.js',
  ),
  loaderGltfDispersion(
    exampleId: 'webgl_loader_gltf_dispersion',
    label: 'GLTFloader + Dispersion',
    widgetId: 'three-loader-gltf-dispersion',
    assetPath: 'widgets/three-loader-gltf-dispersion/widget.js',
  ),
  loaderGltfInstancing(
    exampleId: 'webgl_loader_gltf_instancing',
    label: 'GLTFloader + Instancing',
    widgetId: 'three-loader-gltf-instancing',
    assetPath: 'widgets/three-loader-gltf-instancing/widget.js',
  ),
  loaderGltfIridescence(
    exampleId: 'webgl_loader_gltf_iridescence',
    label: 'GLTFloader + Iridescence',
    widgetId: 'three-loader-gltf-iridescence',
    assetPath: 'widgets/three-loader-gltf-iridescence/widget.js',
  ),
  loaderGltfSheen(
    exampleId: 'webgl_loader_gltf_sheen',
    label: 'GLTFloader + Sheen',
    widgetId: 'three-loader-gltf-sheen',
    assetPath: 'widgets/three-loader-gltf-sheen/widget.js',
  ),
  loaderGltfTransmission(
    exampleId: 'webgl_loader_gltf_transmission',
    label: 'GLTFloader + transmission',
    widgetId: 'three-loader-gltf-transmission',
    assetPath: 'widgets/three-loader-gltf-transmission/widget.js',
  ),
  loaderGltfVariants(
    exampleId: 'webgl_loader_gltf_variants',
    label: 'GLTFloader + variants',
    widgetId: 'three-loader-gltf-variants',
    assetPath: 'widgets/three-loader-gltf-variants/widget.js',
  ),
  loaderImagebitmap(
    exampleId: 'webgl_loader_imagebitmap',
    label: 'loader - ImageBitmap',
    widgetId: 'three-loader-imagebitmap',
    assetPath: 'widgets/three-loader-imagebitmap/widget.js',
  ),
  loaderKmz(
    exampleId: 'webgl_loader_kmz',
    label: 'KMZLoader',
    widgetId: 'three-loader-kmz',
    assetPath: 'widgets/three-loader-kmz/widget.js',
  ),
  loaderLdraw(
    exampleId: 'webgl_loader_ldraw',
    label: 'LDrawLoader',
    widgetId: 'three-loader-ldraw',
    assetPath: 'widgets/three-loader-ldraw/widget.js',
  ),
  loaderMd2(
    exampleId: 'webgl_loader_md2',
    label: 'morphtargets - MD2',
    widgetId: 'three-loader-md2',
    assetPath: 'widgets/three-loader-md2/widget.js',
  ),
  loaderMd2Control(
    exampleId: 'webgl_loader_md2_control',
    label: 'morphtargets - MD2 controls',
    widgetId: 'three-loader-md2-control',
    assetPath: 'widgets/three-loader-md2-control/widget.js',
  ),
  loaderMdd(
    exampleId: 'webgl_loader_mdd',
    label: 'Loader MDD',
    widgetId: 'three-loader-mdd',
    assetPath: 'widgets/three-loader-mdd/widget.js',
  ),
  loaderNrrd(
    exampleId: 'webgl_loader_nrrd',
    label: 'loaders - NRRD loader',
    widgetId: 'three-loader-nrrd',
    assetPath: 'widgets/three-loader-nrrd/widget.js',
  ),
  loaderPdb(
    exampleId: 'webgl_loader_pdb',
    label: 'molecules',
    widgetId: 'three-loader-pdb',
    assetPath: 'widgets/three-loader-pdb/widget.js',
  ),
  loaderTextureDds(
    exampleId: 'webgl_loader_texture_dds',
    label: 'materials - compressed textures',
    widgetId: 'three-loader-texture-dds',
    assetPath: 'widgets/three-loader-texture-dds/widget.js',
  ),
  loaderTextureExr(
    exampleId: 'webgl_loader_texture_exr',
    label: 'materials - EXR texture loader',
    widgetId: 'three-loader-texture-exr',
    assetPath: 'widgets/three-loader-texture-exr/widget.js',
  ),
  loaderTextureHdr(
    exampleId: 'webgl_loader_texture_hdr',
    label: 'materials - HDR texture loader',
    widgetId: 'three-loader-texture-hdr',
    assetPath: 'widgets/three-loader-texture-hdr/widget.js',
  ),
  loaderTextureKtx(
    exampleId: 'webgl_loader_texture_ktx',
    label: 'materials - compressed textures',
    widgetId: 'three-loader-texture-ktx',
    assetPath: 'widgets/three-loader-texture-ktx/widget.js',
  ),
  loaderTextureKtx2(
    exampleId: 'webgl_loader_texture_ktx2',
    label: 'KTX2 texture loader',
    widgetId: 'three-loader-texture-ktx2',
    assetPath: 'widgets/three-loader-texture-ktx2/widget.js',
  ),
  loaderTexturePvrtc(
    exampleId: 'webgl_loader_texture_pvrtc',
    label: 'materials - compressed textures',
    widgetId: 'three-loader-texture-pvrtc',
    assetPath: 'widgets/three-loader-texture-pvrtc/widget.js',
  ),
  loaderTextureTiff(
    exampleId: 'webgl_loader_texture_tiff',
    label: 'materials - TIFF texture',
    widgetId: 'three-loader-texture-tiff',
    assetPath: 'widgets/three-loader-texture-tiff/widget.js',
  ),
  loaderTextureUltrahdr(
    exampleId: 'webgl_loader_texture_ultrahdr',
    label: 'materials - UltraHDR texture loader',
    widgetId: 'three-loader-texture-ultrahdr',
    assetPath: 'widgets/three-loader-texture-ultrahdr/widget.js',
  ),
  loaderUsdz(
    exampleId: 'webgl_loader_usdz',
    label: 'loaders - USDZLoader',
    widgetId: 'three-loader-usdz',
    assetPath: 'widgets/three-loader-usdz/widget.js',
  ),
  loaderVox(
    exampleId: 'webgl_loader_vox',
    label: 'loaders - vox',
    widgetId: 'three-loader-vox',
    assetPath: 'widgets/three-loader-vox/widget.js',
  ),
  loaderVrml(
    exampleId: 'webgl_loader_vrml',
    label: 'loaders - VRML loader',
    widgetId: 'three-loader-vrml',
    assetPath: 'widgets/three-loader-vrml/widget.js',
  ),
  marchingcubes(
    exampleId: 'webgl_marchingcubes',
    label: 'marching cubes',
    widgetId: 'three-marchingcubes',
    assetPath: 'widgets/three-marchingcubes/widget.js',
  ),
  materialsAlphahash(
    exampleId: 'webgl_materials_alphahash',
    label: 'materials - alpha hash',
    widgetId: 'three-materials-alphahash',
    assetPath: 'widgets/three-materials-alphahash/widget.js',
  ),
  materialsBlendingCustom(
    exampleId: 'webgl_materials_blending_custom',
    label: 'materials - custom blending',
    widgetId: 'three-materials-blending-custom',
    assetPath: 'widgets/three-materials-blending-custom/widget.js',
  ),
  materialsCar(
    exampleId: 'webgl_materials_car',
    label: 'materials - car',
    widgetId: 'three-materials-car',
    assetPath: 'widgets/three-materials-car/widget.js',
  ),
  materialsCubemapDynamic(
    exampleId: 'webgl_materials_cubemap_dynamic',
    label: 'materials - dynamic cube reflection',
    widgetId: 'three-materials-cubemap-dynamic',
    assetPath: 'widgets/three-materials-cubemap-dynamic/widget.js',
  ),
  materialsCubemapMipmaps(
    exampleId: 'webgl_materials_cubemap_mipmaps',
    label: 'materials - cubemap mipmaps',
    widgetId: 'three-materials-cubemap-mipmaps',
    assetPath: 'widgets/three-materials-cubemap-mipmaps/widget.js',
  ),
  materialsCubemapRenderToMipmaps(
    exampleId: 'webgl_materials_cubemap_render_to_mipmaps',
    label: 'materials - cubemap mipmaps',
    widgetId: 'three-materials-cubemap-render-to-mipmaps',
    assetPath: 'widgets/three-materials-cubemap-render-to-mipmaps/widget.js',
  ),
  materialsEnvmapsExr(
    exampleId: 'webgl_materials_envmaps_exr',
    label: 'Materials Envmaps EXR',
    widgetId: 'three-materials-envmaps-exr',
    assetPath: 'widgets/three-materials-envmaps-exr/widget.js',
  ),
  materialsEnvmapsFasthdr(
    exampleId: 'webgl_materials_envmaps_fasthdr',
    label: 'Materials Envmaps Fasthdr',
    widgetId: 'three-materials-envmaps-fasthdr',
    assetPath: 'widgets/three-materials-envmaps-fasthdr/widget.js',
  ),
  materialsEnvmapsGroundprojected(
    exampleId: 'webgl_materials_envmaps_groundprojected',
    label: 'Materials Envmaps Groundprojected',
    widgetId: 'three-materials-envmaps-groundprojected',
    assetPath: 'widgets/three-materials-envmaps-groundprojected/widget.js',
  ),
  materialsEnvmapsHdr(
    exampleId: 'webgl_materials_envmaps_hdr',
    label: 'Materials Envmaps HDR',
    widgetId: 'three-materials-envmaps-hdr',
    assetPath: 'widgets/three-materials-envmaps-hdr/widget.js',
  ),
  materialsPhysicalTransmission(
    exampleId: 'webgl_materials_physical_transmission',
    label: 'Materials Physical Transmission',
    widgetId: 'three-materials-physical-transmission',
    assetPath: 'widgets/three-materials-physical-transmission/widget.js',
  ),
  materialsPhysicalTransmissionAlpha(
    exampleId: 'webgl_materials_physical_transmission_alpha',
    label: 'Materials Physical Transmission Alpha',
    widgetId: 'three-materials-physical-transmission-alpha',
    assetPath: 'widgets/three-materials-physical-transmission-alpha/widget.js',
  ),
  materialsSubsurfaceScattering(
    exampleId: 'webgl_materials_subsurface_scattering',
    label: 'Fast subsurface scattering in Blinn-Phong shading demo',
    widgetId: 'three-materials-subsurface-scattering',
    assetPath: 'widgets/three-materials-subsurface-scattering/widget.js',
  ),
  materialsTextureManualmipmap(
    exampleId: 'webgl_materials_texture_manualmipmap',
    label: 'materials - manual mipmaping',
    widgetId: 'three-materials-texture-manualmipmap',
    assetPath: 'widgets/three-materials-texture-manualmipmap/widget.js',
  ),
  materialsVideo(
    exampleId: 'webgl_materials_video',
    label: 'materials - video',
    widgetId: 'three-materials-video',
    assetPath: 'widgets/three-materials-video/widget.js',
  ),
  materialsVideoWebcam(
    exampleId: 'webgl_materials_video_webcam',
    label: 'materials - video - webcam',
    widgetId: 'three-materials-video-webcam',
    assetPath: 'widgets/three-materials-video-webcam/widget.js',
  ),
  meshBatch(
    exampleId: 'webgl_mesh_batch',
    label: 'mesh - batch',
    widgetId: 'three-mesh-batch',
    assetPath: 'widgets/three-mesh-batch/widget.js',
  ),
  mirror(
    exampleId: 'webgl_mirror',
    label: 'mirror',
    widgetId: 'three-mirror',
    assetPath: 'widgets/three-mirror/widget.js',
  ),
  modifierCurve(
    exampleId: 'webgl_modifier_curve',
    label: 'curve modifier',
    widgetId: 'three-modifier-curve',
    assetPath: 'widgets/three-modifier-curve/widget.js',
  ),
  modifierCurveInstanced(
    exampleId: 'webgl_modifier_curve_instanced',
    label: 'curve modifier - instanced',
    widgetId: 'three-modifier-curve-instanced',
    assetPath: 'widgets/three-modifier-curve-instanced/widget.js',
  ),
  morphtargetsFace(
    exampleId: 'webgl_morphtargets_face',
    label: 'morph targets - face',
    widgetId: 'three-morphtargets-face',
    assetPath: 'widgets/three-morphtargets-face/widget.js',
  ),
  morphtargetsHorse(
    exampleId: 'webgl_morphtargets_horse',
    label: 'morph targets - horse',
    widgetId: 'three-morphtargets-horse',
    assetPath: 'widgets/three-morphtargets-horse/widget.js',
  ),
  multipleElements(
    exampleId: 'webgl_multiple_elements',
    label: 'multiple elements',
    widgetId: 'three-multiple-elements',
    assetPath: 'widgets/three-multiple-elements/widget.js',
  ),
  multipleElementsText(
    exampleId: 'webgl_multiple_elements_text',
    label: 'multiple elements with text',
    widgetId: 'three-multiple-elements-text',
    assetPath: 'widgets/three-multiple-elements-text/widget.js',
  ),
  multipleRendertargets(
    exampleId: 'webgl_multiple_rendertargets',
    label: 'Multiple Render Targets',
    widgetId: 'three-multiple-rendertargets',
    assetPath: 'widgets/three-multiple-rendertargets/widget.js',
  ),
  multisampledRenderbuffers(
    exampleId: 'webgl_multisampled_renderbuffers',
    label: 'Multisampled Renderbuffers',
    widgetId: 'three-multisampled-renderbuffers',
    assetPath: 'widgets/three-multisampled-renderbuffers/widget.js',
  ),
  performance(
    exampleId: 'webgl_performance',
    label: 'GLTFloader',
    widgetId: 'three-performance',
    assetPath: 'widgets/three-performance/widget.js',
  ),
  pmremCubemap(
    exampleId: 'webgl_pmrem_cubemap',
    label: 'pmrem cubemap',
    widgetId: 'three-pmrem-cubemap',
    assetPath: 'widgets/three-pmrem-cubemap/widget.js',
  ),
  pmremEquirectangular(
    exampleId: 'webgl_pmrem_equirectangular',
    label: 'pmrem equirectangular',
    widgetId: 'three-pmrem-equirectangular',
    assetPath: 'widgets/three-pmrem-equirectangular/widget.js',
  ),
  pmremTest(
    exampleId: 'webgl_pmrem_test',
    label: 'PMREM Test',
    widgetId: 'three-pmrem-test',
    assetPath: 'widgets/three-pmrem-test/widget.js',
  ),
  pointsDynamic(
    exampleId: 'webgl_points_dynamic',
    label: 'particles - dynamic - postprocessing',
    widgetId: 'three-points-dynamic',
    assetPath: 'widgets/three-points-dynamic/widget.js',
  ),
  portal(
    exampleId: 'webgl_portal',
    label: 'portal',
    widgetId: 'three-portal',
    assetPath: 'widgets/three-portal/widget.js',
  ),
  postprocessing(
    exampleId: 'webgl_postprocessing',
    label: 'postprocessing',
    widgetId: 'three-postprocessing',
    assetPath: 'widgets/three-postprocessing/widget.js',
  ),
  postprocessing3dlut(
    exampleId: 'webgl_postprocessing_3dlut',
    label: '3d luts',
    widgetId: 'three-postprocessing-3dlut',
    assetPath: 'widgets/three-postprocessing-3dlut/widget.js',
  ),
  postprocessingAdvanced(
    exampleId: 'webgl_postprocessing_advanced',
    label: 'postprocessing',
    widgetId: 'three-postprocessing-advanced',
    assetPath: 'widgets/three-postprocessing-advanced/widget.js',
  ),
  postprocessingAfterimage(
    exampleId: 'webgl_postprocessing_afterimage',
    label: 'postprocessing - afterimage',
    widgetId: 'three-postprocessing-afterimage',
    assetPath: 'widgets/three-postprocessing-afterimage/widget.js',
  ),
  postprocessingBackgrounds(
    exampleId: 'webgl_postprocessing_backgrounds',
    label: 'postprocessing backgrounds',
    widgetId: 'three-postprocessing-backgrounds',
    assetPath: 'widgets/three-postprocessing-backgrounds/widget.js',
  ),
  postprocessingDof(
    exampleId: 'webgl_postprocessing_dof',
    label: 'postprocessing - depth-of-field',
    widgetId: 'three-postprocessing-dof',
    assetPath: 'widgets/three-postprocessing-dof/widget.js',
  ),
  postprocessingDof2(
    exampleId: 'webgl_postprocessing_dof2',
    label: 'postprocessing - depth-of-field',
    widgetId: 'three-postprocessing-dof2',
    assetPath: 'widgets/three-postprocessing-dof2/widget.js',
  ),
  postprocessingFxaa(
    exampleId: 'webgl_postprocessing_fxaa',
    label: 'Postprocessing FXAA',
    widgetId: 'three-postprocessing-fxaa',
    assetPath: 'widgets/three-postprocessing-fxaa/widget.js',
  ),
  postprocessingGlitch(
    exampleId: 'webgl_postprocessing_glitch',
    label: 'postprocessing - digital glitch',
    widgetId: 'three-postprocessing-glitch',
    assetPath: 'widgets/three-postprocessing-glitch/widget.js',
  ),
  postprocessingGtao(
    exampleId: 'webgl_postprocessing_gtao',
    label: 'postprocessing - GTAO',
    widgetId: 'three-postprocessing-gtao',
    assetPath: 'widgets/three-postprocessing-gtao/widget.js',
  ),
  postprocessingMasking(
    exampleId: 'webgl_postprocessing_masking',
    label: 'postprocessing - masking',
    widgetId: 'three-postprocessing-masking',
    assetPath: 'widgets/three-postprocessing-masking/widget.js',
  ),
  postprocessingOutline(
    exampleId: 'webgl_postprocessing_outline',
    label: 'post processing - Outline Pass',
    widgetId: 'three-postprocessing-outline',
    assetPath: 'widgets/three-postprocessing-outline/widget.js',
  ),
  postprocessingPixel(
    exampleId: 'webgl_postprocessing_pixel',
    label: 'post processing - pixelation',
    widgetId: 'three-postprocessing-pixel',
    assetPath: 'widgets/three-postprocessing-pixel/widget.js',
  ),
  postprocessingProcedural(
    exampleId: 'webgl_postprocessing_procedural',
    label: 'postprocessing procedural effects',
    widgetId: 'three-postprocessing-procedural',
    assetPath: 'widgets/three-postprocessing-procedural/widget.js',
  ),
  postprocessingRgbHalftone(
    exampleId: 'webgl_postprocessing_rgb_halftone',
    label: 'postprocessing RGB Halftone',
    widgetId: 'three-postprocessing-rgb-halftone',
    assetPath: 'widgets/three-postprocessing-rgb-halftone/widget.js',
  ),
  postprocessingSao(
    exampleId: 'webgl_postprocessing_sao',
    label: 'post processing - Scalable Ambient Occlusion (SAO)',
    widgetId: 'three-postprocessing-sao',
    assetPath: 'widgets/three-postprocessing-sao/widget.js',
  ),
  postprocessingSmaa(
    exampleId: 'webgl_postprocessing_smaa',
    label: 'postprocessing smaa',
    widgetId: 'three-postprocessing-smaa',
    assetPath: 'widgets/three-postprocessing-smaa/widget.js',
  ),
  postprocessingSobel(
    exampleId: 'webgl_postprocessing_sobel',
    label: 'postprocessing - sobel (edge detection)',
    widgetId: 'three-postprocessing-sobel',
    assetPath: 'widgets/three-postprocessing-sobel/widget.js',
  ),
  postprocessingSsaa(
    exampleId: 'webgl_postprocessing_ssaa',
    label: 'postprocessing manual ssaa',
    widgetId: 'three-postprocessing-ssaa',
    assetPath: 'widgets/three-postprocessing-ssaa/widget.js',
  ),
  postprocessingSsao(
    exampleId: 'webgl_postprocessing_ssao',
    label: 'postprocessing - Screen Space Ambient Occlusion',
    widgetId: 'three-postprocessing-ssao',
    assetPath: 'widgets/three-postprocessing-ssao/widget.js',
  ),
  postprocessingSsr(
    exampleId: 'webgl_postprocessing_ssr',
    label: 'postprocessing - Screen Space Reflection',
    widgetId: 'three-postprocessing-ssr',
    assetPath: 'widgets/three-postprocessing-ssr/widget.js',
  ),
  postprocessingTaa(
    exampleId: 'webgl_postprocessing_taa',
    label: 'postprocessing manual taa and ssaa',
    widgetId: 'three-postprocessing-taa',
    assetPath: 'widgets/three-postprocessing-taa/widget.js',
  ),
  postprocessingTransition(
    exampleId: 'webgl_postprocessing_transition',
    label: 'scenes transition',
    widgetId: 'three-postprocessing-transition',
    assetPath: 'widgets/three-postprocessing-transition/widget.js',
  ),
  postprocessingUnrealBloom(
    exampleId: 'webgl_postprocessing_unreal_bloom',
    label: 'postprocessing - unreal bloom',
    widgetId: 'three-postprocessing-unreal-bloom',
    assetPath: 'widgets/three-postprocessing-unreal-bloom/widget.js',
  ),
  postprocessingUnrealBloomSelective(
    exampleId: 'webgl_postprocessing_unreal_bloom_selective',
    label: 'postprocessing - unreal bloom selective',
    widgetId: 'three-postprocessing-unreal-bloom-selective',
    assetPath: 'widgets/three-postprocessing-unreal-bloom-selective/widget.js',
  ),
  randomUv(
    exampleId: 'webgl_random_uv',
    label: 'random - uv',
    widgetId: 'three-random-uv',
    assetPath: 'widgets/three-random-uv/widget.js',
  ),
  readFloatBuffer(
    exampleId: 'webgl_read_float_buffer',
    label: 'read float pixels',
    widgetId: 'three-read-float-buffer',
    assetPath: 'widgets/three-read-float-buffer/widget.js',
  ),
  refraction(
    exampleId: 'webgl_refraction',
    label: 'Refraction',
    widgetId: 'three-refraction',
    assetPath: 'widgets/three-refraction/widget.js',
  ),
  rendertargetTexture2darray(
    exampleId: 'webgl_rendertarget_texture2darray',
    label: '2D texture array framebuffer attachment',
    widgetId: 'three-rendertarget-texture2darray',
    assetPath: 'widgets/three-rendertarget-texture2darray/widget.js',
  ),
  reversedDepthBuffer(
    exampleId: 'webgl_reversed_depth_buffer',
    label: 'reverse depth buffer',
    widgetId: 'three-reversed-depth-buffer',
    assetPath: 'widgets/three-reversed-depth-buffer/widget.js',
  ),
  sculpt(
    exampleId: 'webgl_sculpt',
    label: 'sculpt',
    widgetId: 'three-sculpt',
    assetPath: 'widgets/three-sculpt/widget.js',
  ),
  shaderLava(
    exampleId: 'webgl_shader_lava',
    label: 'materials - shaders [lava]',
    widgetId: 'three-shader-lava',
    assetPath: 'widgets/three-shader-lava/widget.js',
  ),
  shadersOcean(
    exampleId: 'webgl_shaders_ocean',
    label: 'shaders - ocean',
    widgetId: 'three-shaders-ocean',
    assetPath: 'widgets/three-shaders-ocean/widget.js',
  ),
  shadersSky(
    exampleId: 'webgl_shaders_sky',
    label: 'shaders - sky sun shader',
    widgetId: 'three-shaders-sky',
    assetPath: 'widgets/three-shaders-sky/widget.js',
  ),
  shadowContact(
    exampleId: 'webgl_shadow_contact',
    label: 'contact shadows',
    widgetId: 'three-shadow-contact',
    assetPath: 'widgets/three-shadow-contact/widget.js',
  ),
  shadowmapCsm(
    exampleId: 'webgl_shadowmap_csm',
    label: 'cascaded shadow maps',
    widgetId: 'three-shadowmap-csm',
    assetPath: 'widgets/three-shadowmap-csm/widget.js',
  ),
  shadowmapPcss(
    exampleId: 'webgl_shadowmap_pcss',
    label: 'percent closer soft-shadows',
    widgetId: 'three-shadowmap-pcss',
    assetPath: 'widgets/three-shadowmap-pcss/widget.js',
  ),
  shadowmapProgressive(
    exampleId: 'webgl_shadowmap_progressive',
    label: 'progressive lightmap accumulation',
    widgetId: 'three-shadowmap-progressive',
    assetPath: 'widgets/three-shadowmap-progressive/widget.js',
  ),
  shadowmapViewer(
    exampleId: 'webgl_shadowmap_viewer',
    label: 'ShadowMapViewer example',
    widgetId: 'three-shadowmap-viewer',
    assetPath: 'widgets/three-shadowmap-viewer/widget.js',
  ),
  shadowmapVsm(
    exampleId: 'webgl_shadowmap_vsm',
    label: 'VSM Shadows example',
    widgetId: 'three-shadowmap-vsm',
    assetPath: 'widgets/three-shadowmap-vsm/widget.js',
  ),
  shadowmesh(
    exampleId: 'webgl_shadowmesh',
    label: 'ShadowMesh',
    widgetId: 'three-shadowmesh',
    assetPath: 'widgets/three-shadowmesh/widget.js',
  ),
  simpleGi(
    exampleId: 'webgl_simple_gi',
    label: 'simple global illumination',
    widgetId: 'three-simple-gi',
    assetPath: 'widgets/three-simple-gi/widget.js',
  ),
  testMemory2(
    exampleId: 'webgl_test_memory2',
    label: 'Test Memory2',
    widgetId: 'three-test-memory2',
    assetPath: 'widgets/three-test-memory2/widget.js',
  ),
  testWideGamut(
    exampleId: 'webgl_test_wide_gamut',
    label: 'test - wide gamut',
    widgetId: 'three-test-wide-gamut',
    assetPath: 'widgets/three-test-wide-gamut/widget.js',
  ),
  texture2darray(
    exampleId: 'webgl_texture2darray',
    label: '2D texture array',
    widgetId: 'three-texture2darray',
    assetPath: 'widgets/three-texture2darray/widget.js',
  ),
  texture2darrayCompressed(
    exampleId: 'webgl_texture2darray_compressed',
    label: '2D compressed texture array',
    widgetId: 'three-texture2darray-compressed',
    assetPath: 'widgets/three-texture2darray-compressed/widget.js',
  ),
  texture2darrayLayerupdate(
    exampleId: 'webgl_texture2darray_layerupdate',
    label: 'texture array layer update',
    widgetId: 'three-texture2darray-layerupdate',
    assetPath: 'widgets/three-texture2darray-layerupdate/widget.js',
  ),
  texture3d(
    exampleId: 'webgl_texture3d',
    label: 'volume rendering example',
    widgetId: 'three-texture3d',
    assetPath: 'widgets/three-texture3d/widget.js',
  ),
  texture3dPartialupdate(
    exampleId: 'webgl_texture3d_partialupdate',
    label: 'Texture3d Partialupdate',
    widgetId: 'three-texture3d-partialupdate',
    assetPath: 'widgets/three-texture3d-partialupdate/widget.js',
  ),
  tonemapping(
    exampleId: 'webgl_tonemapping',
    label: 'tone mapping',
    widgetId: 'three-tonemapping',
    assetPath: 'widgets/three-tonemapping/widget.js',
  ),
  ubo(
    exampleId: 'webgl_ubo',
    label: 'UBO',
    widgetId: 'three-ubo',
    assetPath: 'widgets/three-ubo/widget.js',
  ),
  uboArrays(
    exampleId: 'webgl_ubo_arrays',
    label: 'UBO Arrays',
    widgetId: 'three-ubo-arrays',
    assetPath: 'widgets/three-ubo-arrays/widget.js',
  ),
  videoKinect(
    exampleId: 'webgl_video_kinect',
    label: 'Video Kinect',
    widgetId: 'three-video-kinect',
    assetPath: 'widgets/three-video-kinect/widget.js',
  ),
  videoPanoramaEquirectangular(
    exampleId: 'webgl_video_panorama_equirectangular',
    label: 'equirectangular video panorama',
    widgetId: 'three-video-panorama-equirectangular',
    assetPath: 'widgets/three-video-panorama-equirectangular/widget.js',
  ),
  volumeCloud(
    exampleId: 'webgl_volume_cloud',
    label: 'Volume Cloud',
    widgetId: 'three-volume-cloud',
    assetPath: 'widgets/three-volume-cloud/widget.js',
  ),
  volumeInstancing(
    exampleId: 'webgl_volume_instancing',
    label: 'Volume Instancing',
    widgetId: 'three-volume-instancing',
    assetPath: 'widgets/three-volume-instancing/widget.js',
  ),
  volumePerlin(
    exampleId: 'webgl_volume_perlin',
    label: 'Volume Perlin',
    widgetId: 'three-volume-perlin',
    assetPath: 'widgets/three-volume-perlin/widget.js',
  ),
  batchLodBvh(
    exampleId: 'webgl_batch_lod_bvh',
    label: 'Batch LOD BVH',
    widgetId: 'three-batch-lod-bvh',
    assetPath: 'widgets/three-batch-lod-bvh/widget.js',
  ),
  geometryCsg(
    exampleId: 'webgl_geometry_csg',
    label: 'Geometry CSG',
    widgetId: 'three-geometry-csg',
    assetPath: 'widgets/three-geometry-csg/widget.js',
  ),
  loader3dtiles(
    exampleId: 'webgl_loader_3dtiles',
    label: 'Loader 3D Tiles',
    widgetId: 'three-loader-3dtiles',
    assetPath: 'widgets/three-loader-3dtiles/widget.js',
  ),
  loaderGltfAnimationPointer(
    exampleId: 'webgl_loader_gltf_animation_pointer',
    label: 'animation - keyframes',
    widgetId: 'three-loader-gltf-animation-pointer',
    assetPath: 'widgets/three-loader-gltf-animation-pointer/widget.js',
  ),
  loaderGltfProgressiveLod(
    exampleId: 'webgl_loader_gltf_progressive_lod',
    label: 'GLTF with progressive loading',
    widgetId: 'three-loader-gltf-progressive-lod',
    assetPath: 'widgets/three-loader-gltf-progressive-lod/widget.js',
  ),
  loaderIfc(
    exampleId: 'webgl_loader_ifc',
    label: 'IFCLoader',
    widgetId: 'three-loader-ifc',
    assetPath: 'widgets/three-loader-ifc/widget.js',
  ),
  loaderSvg(
    exampleId: 'webgl_loader_svg',
    label: 'svg loader',
    widgetId: 'three-loader-svg',
    assetPath: 'widgets/three-loader-svg/widget.js',
  ),
  loaderTextureLottie(
    exampleId: 'webgl_loader_texture_lottie',
    label: 'lottie loader',
    widgetId: 'three-loader-texture-lottie',
    assetPath: 'widgets/three-loader-texture-lottie/widget.js',
  ),
  loaderTtf(
    exampleId: 'webgl_loader_ttf',
    label: 'loader - ttf',
    widgetId: 'three-loader-ttf',
    assetPath: 'widgets/three-loader-ttf/widget.js',
  ),
  materialsTextureHtml(
    exampleId: 'webgl_materials_texture_html',
    label: 'materials - html texture',
    widgetId: 'three-materials-texture-html',
    assetPath: 'widgets/three-materials-texture-html/widget.js',
  ),
  modifierSubdivision(
    exampleId: 'webgl_modifier_subdivision',
    label: 'modifier - subdivision',
    widgetId: 'three-modifier-subdivision',
    assetPath: 'widgets/three-modifier-subdivision/widget.js',
  ),
  postprocessingGodrays(
    exampleId: 'webgl_postprocessing_godrays',
    label: 'postprocessing - godrays',
    widgetId: 'three-postprocessing-godrays',
    assetPath: 'widgets/three-postprocessing-godrays/widget.js',
  ),
  raycasterBvh(
    exampleId: 'webgl_raycaster_bvh',
    label: 'Raycaster BVH',
    widgetId: 'three-raycaster-bvh',
    assetPath: 'widgets/three-raycaster-bvh/widget.js',
  ),
  rendererPathtracer(
    exampleId: 'webgl_renderer_pathtracer',
    label: 'three-gpu-pathtracer',
    widgetId: 'three-renderer-pathtracer',
    assetPath: 'widgets/three-renderer-pathtracer/widget.js',
  ),
  tslClearcoat(
    exampleId: 'webgl_tsl_clearcoat',
    label: 'TSL Clearcoat',
    widgetId: 'three-tsl-clearcoat',
    assetPath: 'widgets/three-tsl-clearcoat/widget.js',
  ),
  tslInstancing(
    exampleId: 'webgl_tsl_instancing',
    label: 'instancing - performance',
    widgetId: 'three-tsl-instancing',
    assetPath: 'widgets/three-tsl-instancing/widget.js',
  ),
  tslShadowmap(
    exampleId: 'webgl_tsl_shadowmap',
    label: 'TSL Shadowmap',
    widgetId: 'three-tsl-shadowmap',
    assetPath: 'widgets/three-tsl-shadowmap/widget.js',
  ),
  tslSkinning(
    exampleId: 'webgl_tsl_skinning',
    label: 'TSL Skinning',
    widgetId: 'three-tsl-skinning',
    assetPath: 'widgets/three-tsl-skinning/widget.js',
  ),
  watch(
    exampleId: 'webgl_watch',
    label: 'watch',
    widgetId: 'three-watch',
    assetPath: 'widgets/three-watch/widget.js',
  ),
  workerOffscreencanvas(
    exampleId: 'webgl_worker_offscreencanvas',
    label: 'worker - offscreen canvas',
    widgetId: 'three-worker-offscreencanvas',
    assetPath: 'widgets/three-worker-offscreencanvas/widget.js',
  ),
  morphtargetsWebcam(
    exampleId: 'webgl_morphtargets_webcam',
    label: 'morph targets - webcam',
    widgetId: 'three-morphtargets-webcam',
    assetPath: 'widgets/three-morphtargets-webcam/widget.js',
  ),
  audioTiming(
    exampleId: 'webaudio_timing',
    label: 'WebAudio Timing',
    widgetId: 'three-webaudio-timing',
    assetPath: 'widgets/three-webaudio-timing/widget.js',
  ),
  audioOrientation(
    exampleId: 'webaudio_orientation',
    label: 'WebAudio Orientation',
    widgetId: 'three-webaudio-orientation',
    assetPath: 'widgets/three-webaudio-orientation/widget.js',
  ),
  cinematicShowcase(
    // Custom (non-upstream) module: its own exampleId namespace, consumed
    // only via JSR_THREE_EXAMPLE / JSR_*_LIST so it never collides with the
    // official prepare-manifest lookups keyed by upstream example ids.
    exampleId: 'custom_cinematic_showcase',
    label: 'Cinematic Showcase',
    widgetId: 'three-cinematic-showcase',
    assetPath: 'widgets/three-cinematic-showcase/widget.js',
  );

  const ThreeExampleSelection({
    required this.exampleId,
    required this.label,
    required this.widgetId,
    required this.assetPath,
  });

  static ThreeExampleSelection get initial {
    // Runtime override first: lets headless sweeps drive one build through
    // the whole catalog without a rebuild per example (debug tooling).
    final exampleId = Platform.environment['JSR_THREE_EXAMPLE'] ??
        const String.fromEnvironment('JSR_THREE_EXAMPLE');
    if (exampleId.isEmpty) return clipping;
    for (final selection in values) {
      if (selection.exampleId == exampleId) return selection;
    }
    throw ArgumentError.value(
      exampleId,
      'JSR_THREE_EXAMPLE',
      'Unsupported official three.js example',
    );
  }

  /// Sidebar order: newest modules first so additions are visible without
  /// scrolling, then the launch order of the original set.
  ///
  /// Excluded from the sidebar (documented 1B-only gaps, see their tests):
  /// lightsHemisphere and interactivePoints render a ShaderMaterial
  /// (skydome / point sprites) that native R1 does not provide by design.
  static final List<ThreeExampleSelection> sidebarOrder = [
    cinematicShowcase,
    morphtargetsWebcam,
    batchLodBvh,
    geometryCsg,
    loader3dtiles,
    loaderGltfAnimationPointer,
    loaderGltfProgressiveLod,
    loaderIfc,
    loaderSvg,
    loaderTextureLottie,
    loaderTtf,
    materialsTextureHtml,
    modifierSubdivision,
    postprocessingGodrays,
    raycasterBvh,
    rendererPathtracer,
    tslClearcoat,
    tslInstancing,
    tslShadowmap,
    tslSkinning,
    watch,
    workerOffscreencanvas,
    sandbox,
    visualizer,
    animationKeyframes,
    animationSkinningAdditiveBlending,
    animationSkinningIk,
    animationWalk,
    buffergeometryAttributesInteger,
    buffergeometryCustomAttributesParticles,
    buffergeometryGlbufferattribute,
    buffergeometryInstancing,
    buffergeometryInstancingBillboards,
    buffergeometryInstancingInterleaved,
    buffergeometryRawshader,
    clipculldistance,
    clippingStencil,
    customAttributes,
    customAttributesLines,
    customAttributesPoints,
    customAttributesPoints2,
    customAttributesPoints3,
    depthTexture,
    effectsAscii,
    effectsParallaxbarrier,
    framebufferTexture,
    furnaceTest,
    gpgpuBirds,
    gpgpuBirdsGltf,
    gpgpuProtoplanet,
    gpgpuWater,
    instancingMorph,
    interactiveCubesGpu,
    lensflares,
    lightprobe,
    lightprobeCubecamera,
    lightprobes,
    lightprobesComplex,
    lightprobesSponza,
    lightsRectarealight,
    lightsSunlight,
    linesFatRaycasting,
    linesFatWireframe,
    loader3dm,
    loader3ds,
    loader3mf,
    loader3mfMaterials,
    loaderAmf,
    loaderBvh,
    loaderCollada,
    loaderColladaKinematics,
    loaderColladaSkinning,
    loaderDraco,
    loaderFbx,
    loaderFbxNurbs,
    loaderGcode,
    loaderGltf,
    loaderGltfAnisotropy,
    loaderGltfAvif,
    loaderGltfCompressed,
    loaderGltfDispersion,
    loaderGltfInstancing,
    loaderGltfIridescence,
    loaderGltfSheen,
    loaderGltfTransmission,
    loaderGltfVariants,
    loaderImagebitmap,
    loaderKmz,
    loaderLdraw,
    loaderMd2,
    loaderMd2Control,
    loaderMdd,
    loaderNrrd,
    loaderPdb,
    loaderTextureDds,
    loaderTextureExr,
    loaderTextureHdr,
    loaderTextureKtx,
    loaderTextureKtx2,
    loaderTexturePvrtc,
    loaderTextureTiff,
    loaderTextureUltrahdr,
    loaderUsdz,
    loaderVox,
    loaderVrml,
    marchingcubes,
    materialsAlphahash,
    materialsBlendingCustom,
    materialsCar,
    materialsCubemapDynamic,
    materialsCubemapMipmaps,
    materialsCubemapRenderToMipmaps,
    materialsEnvmapsExr,
    materialsEnvmapsFasthdr,
    materialsEnvmapsGroundprojected,
    materialsEnvmapsHdr,
    materialsPhysicalTransmission,
    materialsPhysicalTransmissionAlpha,
    materialsSubsurfaceScattering,
    materialsTextureManualmipmap,
    materialsVideo,
    materialsVideoWebcam,
    meshBatch,
    mirror,
    modifierCurve,
    modifierCurveInstanced,
    morphtargetsFace,
    morphtargetsHorse,
    multipleElements,
    multipleElementsText,
    multipleRendertargets,
    multisampledRenderbuffers,
    performance,
    pmremCubemap,
    pmremEquirectangular,
    pmremTest,
    pointsDynamic,
    portal,
    postprocessing,
    postprocessing3dlut,
    postprocessingAdvanced,
    postprocessingAfterimage,
    postprocessingBackgrounds,
    postprocessingDof,
    postprocessingDof2,
    postprocessingFxaa,
    postprocessingGlitch,
    postprocessingGtao,
    postprocessingMasking,
    postprocessingOutline,
    postprocessingPixel,
    postprocessingProcedural,
    postprocessingRgbHalftone,
    postprocessingSao,
    postprocessingSmaa,
    postprocessingSobel,
    postprocessingSsaa,
    postprocessingSsao,
    postprocessingSsr,
    postprocessingTaa,
    postprocessingTransition,
    postprocessingUnrealBloom,
    postprocessingUnrealBloomSelective,
    randomUv,
    readFloatBuffer,
    refraction,
    rendertargetTexture2darray,
    reversedDepthBuffer,
    sculpt,
    shaderLava,
    shadersOcean,
    shadersSky,
    shadowContact,
    shadowmapCsm,
    shadowmapPcss,
    shadowmapProgressive,
    shadowmapViewer,
    shadowmapVsm,
    shadowmesh,
    simpleGi,
    testMemory2,
    testWideGamut,
    texture2darray,
    texture2darrayCompressed,
    texture2darrayLayerupdate,
    texture3d,
    texture3dPartialupdate,
    tonemapping,
    ubo,
    uboArrays,
    videoKinect,
    videoPanoramaEquirectangular,
    volumeCloud,
    volumeInstancing,
    volumePerlin,
    audioOrientation,
    audioTiming,
    morphtargets,
    morphtargetsSphere,
    shadowmap,
    shadowmapPerformance,
    animationMultiple,
    animationSkinningBlending,
    animationSkinningMorph,
    geometries,
    lod,
    cameraArray,
    bufferGeometryDrawRange,
    geometryText,
    panoramaCube,
    pointsSprites,
    multipleViews,
    loaderObj,
    materialsChannels,
    materialsNormalmapObjectSpace,
    materialsPhysicalClearcoat,
    geometryNurbs,
    decals,
    geometryTextStroke,
    testMemory,
    loaderTextureTga,
    clipping,
    clippingIntersection,
    lightsSpotlights,
    helpers,
    geometrySplineEditor,
    interactiveLines,
    interactiveBufferGeometry,
    instancingRaycast,
    instancingScatter,
    sprites,
    raycasterSprite,
    materialsMatcap,
    materialsNormalmap,
    materialsToon,
    extrudeShapes,
    ..._launchOrder,
  ];

  static final List<ThreeExampleSelection> _launchOrder = [
    minecraft,
    geometryColors,
    linesColors,
    bufferGeometryUint,
    bufferGeometryIndexed,
    bufferGeometryLinesIndexed,
    bufferGeometryPoints,
    geometryTerrainRaycast,
    mathOrientationTransform,
    interactiveRaycastingPoints,
    interactiveCubes,
    interactiveCubesOrtho,
    mathObb,
    bufferGeometry,
    camera,
    clippingAdvanced,
    geometryExtrudeSplines,
    loaderPly,
    loaderStl,
    bufferGeometryPointsInterleaved,
    interactiveVoxelPainter,
    panoramaEquirectangular,
  ];

  final String exampleId;
  final String label;
  final String widgetId;
  final String assetPath;
}

/// Samples the rate of frames actually presented by a THREE surface.
class ThreeFpsSampler {
  int? _presentedFrames;
  DateTime? _sampledAt;
  double? _fps;

  double? get fps => _fps;

  double? sample(int presentedFrames, DateTime now) {
    final previousFrames = _presentedFrames;
    final previousSample = _sampledAt;
    _presentedFrames = presentedFrames;
    _sampledAt = now;
    if (previousFrames == null ||
        previousSample == null ||
        presentedFrames < previousFrames) {
      return _fps = null;
    }
    final seconds = now.difference(previousSample).inMicroseconds / 1000000;
    if (seconds <= 0) return _fps;
    return _fps = (presentedFrames - previousFrames) / seconds;
  }
}

/// Runs unmodified official three.js r186 example modules.
///
/// Native: upstream object model + R1 + Flutter GPU. Web: real WebGL2 in the
/// existing Worker + ImageBitmap presentation. No WebView is used.
Future<void> main() async {
  runApp(const ThreeExampleApp());
}

class ThreeExampleApp extends StatefulWidget {
  const ThreeExampleApp({super.key});

  @override
  State<ThreeExampleApp> createState() => _ThreeExampleAppState();
}

class _ThreeExampleAppState extends State<ThreeExampleApp> {
  static const _autoMs = int.fromEnvironment('JSR_THREE_AUTO');
  static final String _captureDir = Platform.environment['JSR_CAPTURE_DIR'] ??
      const String.fromEnvironment('JSR_CAPTURE_DIR');
  final GlobalKey _captureKey = GlobalKey();
  Timer? _captureTimer;
  ThreeExampleSelection _selection = ThreeExampleSelection.initial;
  ThreeExampleSelection? _pendingSelection;
  Timer? _autoTimer;
  int _autoIndex = 0;

  @override
  void initState() {
    super.initState();
    _scheduleCapture(_selection);
    if (_autoMs > 0) {
      _autoTimer = Timer.periodic(Duration(milliseconds: _autoMs), (_) {
        if (!mounted) return;
        final order = ThreeExampleSelection.sidebarOrder;
        _autoIndex = (_autoIndex + 1) % order.length;
        debugPrint('AUTO switch -> ${order[_autoIndex].exampleId}');
        _selectExample(order[_autoIndex]);
      });
    }
  }

  @override
  void dispose() {
    _captureTimer?.cancel();
    _autoTimer?.cancel();
    super.dispose();
  }

  /// Screenshot mode for visual parity checks against the official WebGL
  /// examples: after the selection settles, capture the preview boundary.
  void _scheduleCapture(ThreeExampleSelection selection) {
    if (_captureDir.isEmpty) return;
    _captureTimer?.cancel();
    _captureTimer = Timer(const Duration(seconds: 7), () async {
      final boundary = _captureKey.currentContext?.findRenderObject();
      if (boundary is! RenderRepaintBoundary) return;
      final image = await boundary.toImage(pixelRatio: 2);
      final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
      if (bytes == null) return;
      final file = File('$_captureDir/${selection.exampleId}.png');
      await file.create(recursive: true);
      await file.writeAsBytes(bytes.buffer.asUint8List(), flush: true);
      debugPrint('CAPTURED ${selection.exampleId} ${bytes.lengthInBytes}');
      image.dispose();
    });
  }

  void _selectExample(ThreeExampleSelection selection) {
    final displayedSelection = _pendingSelection ?? _selection;
    if (selection == displayedSelection) return;
    if (selection == _selection) {
      setState(() => _pendingSelection = null);
      return;
    }

    // Paint the loading overlay before disposing the old engine and starting
    // the next one. Both operations can synchronously occupy the UI isolate.
    setState(() => _pendingSelection = selection);
    _scheduleCapture(selection);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || _pendingSelection != selection) return;
      setState(() {
        _selection = selection;
        _pendingSelection = null;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final displayedSelection = _pendingSelection ?? _selection;
    final pendingSelection = _pendingSelection;
    return MaterialApp(
      title: 'THREE r186 Samples',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(useMaterial3: true),
      home: Scaffold(
        body: Row(
          children: [
            _ThreeExampleSidebar(
              selection: displayedSelection,
              onChanged: _selectExample,
            ),
            Expanded(
              child: RepaintBoundary(
                key: _captureKey,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    ThreeExamplePage(
                      key: ValueKey(_selection),
                      selection: _selection,
                    ),
                    if (pendingSelection != null)
                      Positioned.fill(
                        child: _ThreeExampleLoading(
                          selection: pendingSelection,
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Muted first-paint expectation for catalog entries measured above 5s
/// ("≈8s — collada XML parse in QuickJS"). Data-driven: the line renders only
/// for widget ids listed in `three_load_time_hints.dart` (regenerated from
/// tool/three_example/three_first_present.json); fast widgets render nothing.
class ThreeLoadTimeHintLine extends StatelessWidget {
  const ThreeLoadTimeHintLine({super.key, required this.widgetId});

  final String widgetId;

  @override
  Widget build(BuildContext context) {
    final hint = threeLoadTimeHint(widgetId);
    if (hint == null) return const SizedBox.shrink();
    return Text(
      '${hint.label} — ${hint.reason}',
      maxLines: 2,
      overflow: TextOverflow.ellipsis,
      style: const TextStyle(
        color: Color(0xFF64748B),
        fontSize: 10,
        height: 1.2,
      ),
    );
  }
}

class _ThreeExampleSidebar extends StatefulWidget {
  const _ThreeExampleSidebar({
    required this.selection,
    required this.onChanged,
  });

  final ThreeExampleSelection selection;
  final ValueChanged<ThreeExampleSelection> onChanged;

  @override
  State<_ThreeExampleSidebar> createState() => _ThreeExampleSidebarState();
}

class _ThreeExampleSidebarState extends State<_ThreeExampleSidebar> {
  final TextEditingController _filterController = TextEditingController();
  String _filter = '';

  @override
  void dispose() {
    _filterController.dispose();
    super.dispose();
  }

  /// Case-insensitive substring match over the widget id and the human label.
  bool _matches(ThreeExampleSelection example) {
    final query = _filter.trim().toLowerCase();
    if (query.isEmpty) return true;
    return example.widgetId.toLowerCase().contains(query) ||
        example.label.toLowerCase().contains(query);
  }

  @override
  Widget build(BuildContext context) => Material(
    color: const Color(0xFF111827),
    child: Container(
      width: 248,
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: Text(
              'THREE r186',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
            ),
          ),
          const Padding(
            padding: EdgeInsets.fromLTRB(20, 4, 20, 18),
            child: Text(
              'OFFICIAL SAMPLES  •  0.186.1',
              style: TextStyle(
                color: Color(0xFF94A3B8),
                fontSize: 10,
                letterSpacing: 1.1,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
            child: TextField(
              controller: _filterController,
              onChanged: (value) => setState(() => _filter = value),
              style: const TextStyle(fontSize: 13, color: Color(0xFFE2E8F0)),
              decoration: InputDecoration(
                isDense: true,
                hintText: 'Search examples…',
                hintStyle: const TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 13,
                ),
                prefixIcon: const Icon(Icons.search, size: 16),
                suffixIcon: _filter.isEmpty
                    ? null
                    : IconButton(
                        visualDensity: VisualDensity.compact,
                        icon: const Icon(Icons.close, size: 14),
                        onPressed: () {
                          _filterController.clear();
                          setState(() => _filter = '');
                        },
                      ),
                filled: true,
                fillColor: const Color(0xFF1F2937),
                contentPadding: const EdgeInsets.symmetric(
                  vertical: 8,
                  horizontal: 10,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          Expanded(
            child: ListView(
              children: [
                for (final example in ThreeExampleSelection.sidebarOrder)
                  if (_matches(example))
                    ListTile(
                      dense: true,
                      selected: example == widget.selection,
                      selectedColor: const Color(0xFFE0F2FE),
                      selectedTileColor: const Color(0xFF164E63),
                      leading: _ThreeExamplePreview(
                        widgetId: example.widgetId,
                        selected: example == widget.selection,
                      ),
                      title: Text(example.label),
                      subtitle: ThreeLoadTimeHintLine(
                        widgetId: example.widgetId,
                      ),
                      onTap: () => widget.onChanged(example),
                    ),
              ],
            ),
          ),
          const Padding(
            padding: EdgeInsets.fromLTRB(20, 12, 20, 0),
            child: Text(
              'QuickJS isolate  /  R1  /  Flutter GPU\n20 integrated native samples',
              style: TextStyle(
                color: Color(0xFF64748B),
                fontSize: 11,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

/// Sidebar thumbnail: the captured still of the example's own GPU frame
/// (`assets/three_previews/<widgetId>.png`, generated by the screenshot
/// runner). Falls back to the play icon when no capture shipped.
class _ThreeExamplePreview extends StatelessWidget {
  const _ThreeExamplePreview({required this.widgetId, required this.selected});

  final String widgetId;
  final bool selected;

  @override
  Widget build(BuildContext context) => ClipRRect(
    borderRadius: BorderRadius.circular(6),
    child: Container(
      width: 40,
      height: 40,
      color: const Color(0xFF1F2937),
      child: Image.asset(
        'assets/three_previews/$widgetId.png',
        width: 40,
        height: 40,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => Icon(
          selected ? Icons.play_circle_fill : Icons.play_circle_outline,
          size: 19,
        ),
      ),
    ),
  );
}

class ThreeExamplePage extends StatefulWidget {
  const ThreeExamplePage({
    super.key,
    this.selection = ThreeExampleSelection.minecraft,
  });

  final ThreeExampleSelection selection;

  @override
  State<ThreeExamplePage> createState() => _ThreeExamplePageState();
}

class _ThreeExamplePageState extends State<ThreeExamplePage> {
  static const _switchLog = bool.fromEnvironment('JSR_SWITCH_LOG');
  final Stopwatch _openSw = Stopwatch()..start();
  bool _loggedSource = false;
  bool _loggedFirstFrame = false;
  late final String _engineId = '${widget.selection.widgetId}-example';
  late final JsThreeHost _threeHost = kIsWeb
      ? createWebThreeHost(diagnosticsEnabled: true)
      : createFlutterGpuThreeHost(
          assetLoader: WidgetBundleThreeAssets.forWidget(
            widget.selection.widgetId,
          ).load,
        );
  late final JsThreeAudioHost _audioHost = JsThreeAudioHost(
    engineId: _engineId,
    mediaHost: const ExampleMediaHost(),
    onError: (error) => debugPrint('THREE audio: $error'),
  );
  final ExampleCameraHost _cameraHost = ExampleCameraHost();
  late final Future<String> _source = _loadSource();
  late final JsRuntimeConfig _config = JsRuntimeConfig(
    widgetId: widget.selection.widgetId,
    instanceId: _engineId,
    threeEnabled: true,
    threeHost: _threeHost,
    backendFactory: kIsWeb ? null : createQuickjsIsolateWidgetEngineBackend,
    onHostCall: _cameraHost.chainedWith(_audioHost.handleCall),
    onRender: (_) {},
    onSetTitle: (_) {},
    onStorageUpdate: (_) {},
  );
  final ThreeFpsSampler _fpsSampler = ThreeFpsSampler();
  Timer? _diagnosticsTimer;
  Object? _error;
  bool _ready = false;
  bool _startRuntime = false;

  Future<String> _loadSource() async {
    try {
      final source = await rootBundle.loadString(widget.selection.assetPath);
      if (_switchLog && !_loggedSource) {
        _loggedSource = true;
        debugPrint(
          'SWITCH ${widget.selection.exampleId}: sourceLoaded='
          '${_openSw.elapsedMilliseconds}ms bytes=${source.length}',
        );
      }
      return source;
    } catch (error) {
      _showError(error);
      rethrow;
    }
  }

  void _showError(Object error) {
    if (!mounted) return;
    setState(() {
      _error = error;
      _ready = false;
    });
  }

  Future<void> _copyExampleId() async {
    final exampleId = widget.selection.exampleId;
    await Clipboard.setData(ClipboardData(text: exampleId));
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..clearSnackBars()
      ..showSnackBar(
        SnackBar(
          content: Text('Copied scene ID: $exampleId'),
          duration: const Duration(seconds: 1),
        ),
      );
  }

  @override
  void initState() {
    super.initState();
    // Paint the loader once before creating the engine. Native QuickJS then
    // evaluates in its own isolate, so the indicator keeps animating.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) setState(() => _startRuntime = true);
    });
    _diagnosticsTimer = Timer.periodic(const Duration(milliseconds: 250), (_) {
      if (!mounted) return;
      final frames =
          (_threeHost
                      .findSurface(_engineId, 'main#1')
                      ?.diagnostics['presentedFrames'] ??
                  0)
              .toInt();
      if (frames > 0 && _error == null) {
        _ready = true;
        if (_switchLog && !_loggedFirstFrame) {
          _loggedFirstFrame = true;
          debugPrint(
            'SWITCH ${widget.selection.exampleId}: firstFrame='
            '${_openSw.elapsedMilliseconds}ms',
          );
        }
      }
      _fpsSampler.sample(frames, DateTime.now());
      if (_switchLog) {
        final diagnostics = _threeHost
            .findSurface(_engineId, 'main#1')
            ?.diagnostics;
        debugPrint(
          'FPS ${widget.selection.exampleId}: '
          '${_fpsSampler.fps?.toStringAsFixed(1) ?? '-'} $diagnostics',
        );
      }
      setState(() {});
    });
  }

  @override
  void dispose() {
    _diagnosticsTimer?.cancel();
    // Release the webcam capture session so the macOS camera indicator
    // turns off as soon as the example page closes.
    unawaited(_cameraHost.handleCall('camera.stop', const <String, dynamic>{}));
    // Ordered teardown: release every audio player (pause mutes first,
    // bounded so a hung audioplayers dispose cannot defer engine
    // teardown forever) BEFORE the engine goes away. On timeout or
    // failure the host dispose keeps draining unawaited — the sources
    // are already paused by then.
    unawaited(
      _audioHost
          .dispose()
          .timeout(const Duration(seconds: 2))
          .then(
            (_) => _threeHost.disposeEngine(_engineId),
            onError: (Object _) => _threeHost.disposeEngine(_engineId),
          ),
    );
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: const Color(0xFF0F172A),
    body: Stack(
      fit: StackFit.expand,
      children: [
        FutureBuilder<String>(
          future: _source,
          builder: (context, snapshot) {
            if (snapshot.hasError) {
              return Center(
                child: Text('three.assetFailure: ${snapshot.error}'),
              );
            }
            final source = snapshot.data;
            if (source == null || !_startRuntime) {
              return const SizedBox.expand();
            }
            return JsWidgetRuntimeWidget(
              jsSource: source,
              config: _config,
              onError: (error, stackTrace) {
                debugPrint('THREE example error: $error');
                _showError(error);
              },
            );
          },
        ),
        Positioned(
          left: 16,
          top: 16,
          child: IgnorePointer(
            child: _ThreeDiagnostics(
              host: _threeHost,
              engineId: _engineId,
              fps: _fpsSampler.fps,
            ),
          ),
        ),
        Positioned(
          right: 16,
          top: 16,
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: const Color(0xB8000000),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 4, 4, 4),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IgnorePointer(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          widget.selection.label,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        Text(
                          widget.selection.exampleId,
                          style: const TextStyle(
                            color: Color(0xFF94A3B8),
                            fontFamily: 'monospace',
                            fontSize: 9,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    tooltip: 'Copy scene ID',
                    onPressed: _copyExampleId,
                    visualDensity: VisualDensity.compact,
                    color: const Color(0xFFE0F2FE),
                    icon: const Icon(Icons.copy_rounded, size: 16),
                  ),
                ],
              ),
            ),
          ),
        ),
        Positioned.fill(
          child: IgnorePointer(
            ignoring: _ready,
            child: ExcludeSemantics(
              excluding: _ready,
              child: AnimatedOpacity(
                opacity: _ready ? 0 : 1,
                duration: _ready
                    ? const Duration(milliseconds: 300)
                    : Duration.zero,
                curve: Curves.easeOut,
                child: _ThreeExampleLoading(
                  selection: widget.selection,
                  error: _error,
                ),
              ),
            ),
          ),
        ),
      ],
    ),
  );
}

class _ThreeExampleLoading extends StatelessWidget {
  const _ThreeExampleLoading({required this.selection, this.error});

  final ThreeExampleSelection selection;
  final Object? error;

  @override
  Widget build(BuildContext context) {
    final error = this.error;
    return ColoredBox(
      color: const Color(0xFF0F172A),
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (error == null)
                Container(
                  width: 76,
                  height: 76,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: Color(0xFF111C31),
                    boxShadow: [
                      BoxShadow(color: Color(0x3338BDF8), blurRadius: 32),
                    ],
                  ),
                  child: const Stack(
                    alignment: Alignment.center,
                    children: [
                      SizedBox(
                        width: 52,
                        height: 52,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          strokeCap: StrokeCap.round,
                          color: Color(0xFF38BDF8),
                          backgroundColor: Color(0xFF1E3A4C),
                        ),
                      ),
                      Icon(
                        Icons.view_in_ar_outlined,
                        color: Color(0xFFE0F2FE),
                        size: 21,
                      ),
                    ],
                  ),
                )
              else
                const Icon(
                  Icons.error_outline_rounded,
                  color: Color(0xFFFCA5A5),
                  size: 52,
                ),
              const SizedBox(height: 24),
              Text(
                error == null
                    ? 'Loading ${selection.label}'
                    : 'Could not load ${selection.label}',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Color(0xFFF1F5F9),
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 9),
              Text(
                error == null
                    ? selection.exampleId
                    : 'three.assetFailure: $error',
                textAlign: TextAlign.center,
                maxLines: 4,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Color(0xFF94A3B8),
                  fontFamily: 'monospace',
                  fontSize: 11,
                  height: 1.5,
                ),
              ),
              if (error == null) ...[
                const SizedBox(height: 18),
                const Text(
                  'Starting the scene and preparing the first frame',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 12),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _ThreeDiagnostics extends StatelessWidget {
  const _ThreeDiagnostics({
    required this.host,
    required this.engineId,
    required this.fps,
  });

  final JsThreeHost host;
  final String engineId;
  final double? fps;

  @override
  Widget build(BuildContext context) {
    final surface = host.findSurface(engineId, 'main#1');
    final values = surface?.diagnostics ?? const <String, num>{};
    final backend = kIsWeb ? 'WebGL2 / Worker' : 'R1 / Flutter GPU';
    String number(String key, [int digits = 0]) =>
        (values[key] ?? 0).toStringAsFixed(digits);
    return DecoratedBox(
      decoration: BoxDecoration(
        color: const Color(0xC4000000),
        border: Border.all(color: const Color(0x22FFFFFF)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  fps?.toStringAsFixed(1) ?? '—',
                  style: const TextStyle(
                    color: Color(0xFF7DD3FC),
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    height: 1,
                  ),
                ),
                const SizedBox(width: 7),
                const Padding(
                  padding: EdgeInsets.only(bottom: 2),
                  child: Text(
                    'FPS\npresented',
                    style: TextStyle(
                      color: Color(0xFF94A3B8),
                      fontSize: 9,
                      height: 1.2,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 9),
            Text(
              backend,
              style: const TextStyle(
                color: Color(0xFFE2E8F0),
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'frame ${number('frameMs', 2)} ms  ·  decode ${number('decodeMs', 2)} ms\n'
              'calls ${number('calls')}  ·  triangles ${number('triangles')}\n'
              'frames ${number('presentedFrames')}  ·  uploads ${number('uploads')}',
              style: const TextStyle(
                color: Color(0xFF94A3B8),
                fontFamily: 'monospace',
                fontSize: 9,
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
