import 'dart:async';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/foundation.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

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
  ;

  const ThreeExampleSelection({
    required this.exampleId,
    required this.label,
    required this.widgetId,
    required this.assetPath,
  });

  static ThreeExampleSelection get initial {
    const exampleId = String.fromEnvironment('JSR_THREE_EXAMPLE');
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
  static const _captureDir = String.fromEnvironment('JSR_CAPTURE_DIR');
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
                      child: _ThreeExampleLoading(selection: pendingSelection),
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

class _ThreeExampleSidebar extends StatelessWidget {
  const _ThreeExampleSidebar({
    required this.selection,
    required this.onChanged,
  });

  final ThreeExampleSelection selection;
  final ValueChanged<ThreeExampleSelection> onChanged;

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
          Expanded(
            child: ListView(
              children: [
                for (final example in ThreeExampleSelection.sidebarOrder)
                  ListTile(
                    dense: true,
                    selected: example == selection,
                    selectedColor: const Color(0xFFE0F2FE),
                    selectedTileColor: const Color(0xFF164E63),
                    leading: _ThreeExamplePreview(
                      widgetId: example.widgetId,
                      selected: example == selection,
                    ),
                    title: Text(example.label),
                    onTap: () => onChanged(example),
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
  const _ThreeExamplePreview({
    required this.widgetId,
    required this.selected,
  });

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
      : createFlutterGpuThreeHost();
  late final Future<String> _source = _loadSource();
  late final JsRuntimeConfig _config = JsRuntimeConfig(
    widgetId: widget.selection.widgetId,
    instanceId: _engineId,
    threeEnabled: true,
    threeHost: _threeHost,
    backendFactory: kIsWeb ? null : createQuickjsIsolateWidgetEngineBackend,
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
    _threeHost.disposeEngine(_engineId);
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
          child: IgnorePointer(
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: const Color(0xB8000000),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
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
