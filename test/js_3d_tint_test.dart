import 'dart:ui';

import 'package:flame_3d/game.dart';
import 'package:flame_3d/model.dart';
import 'package:flame_3d/resources.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/hosts/js_3d_host_utils.dart';

Surface _surface(Material material) => Surface(
      vertices: [
        Vertex(position: Vector3(0, 0, 0), texCoord: Vector2(0, 0)),
        Vertex(position: Vector3(1, 0, 0), texCoord: Vector2(1, 0)),
        Vertex(position: Vector3(0, 1, 0), texCoord: Vector2(0, 1)),
      ],
      indices: const [0, 1, 2],
      material: material,
    );

Model _modelWith(List<Surface> surfaces, {bool withEmptyNode = false}) {
  final mesh = Mesh();
  for (final surface in surfaces) {
    mesh.addSurface(surface);
  }
  return Model(
    nodes: {
      0: ModelNode.simple(nodeIndex: 0, mesh: mesh),
      if (withEmptyNode) 1: ModelNode.simple(nodeIndex: 1, mesh: null),
    },
    animations: const [],
  );
}

void main() {
  group('js3dTintModel', () {
    test('multiplies SpatialMaterial albedo by the tint', () {
      final material = SpatialMaterial(albedoColor: const Color(0xFF804040));
      final model = _modelWith([_surface(material)]);

      js3dTintModel(model, '#808080');

      expect((material.albedoColor.r * 255).round(), 64);
      expect((material.albedoColor.g * 255).round(), 32);
      expect((material.albedoColor.b * 255).round(), 32);
      expect((material.albedoColor.a * 255).round(), 255);
    });

    test('tints UnlitMaterial surfaces too', () {
      final material = UnlitMaterial(albedoColor: const Color(0xFF808080));
      final model = _modelWith([_surface(material)]);

      js3dTintModel(model, '#ff0000');

      expect((material.albedoColor.r * 255).round(), 128);
      expect((material.albedoColor.g * 255).round(), 0);
      expect((material.albedoColor.b * 255).round(), 0);
    });

    test('white tint leaves the albedo unchanged', () {
      final material = SpatialMaterial(albedoColor: const Color(0xFF336699));
      final model = _modelWith([_surface(material)]);

      js3dTintModel(model, '#ffffff');

      expect((material.albedoColor.r * 255).round(), 0x33);
      expect((material.albedoColor.g * 255).round(), 0x66);
      expect((material.albedoColor.b * 255).round(), 0x99);
    });

    test('malformed color falls back to white (no visible change)', () {
      final material = SpatialMaterial(albedoColor: const Color(0xFF336699));
      final model = _modelWith([_surface(material)]);

      js3dTintModel(model, 'not-a-color');

      expect((material.albedoColor.r * 255).round(), 0x33);
    });

    test('nodes without a mesh are skipped', () {
      final material = SpatialMaterial(albedoColor: const Color(0xFF804040));
      final model = _modelWith([_surface(material)], withEmptyNode: true);

      js3dTintModel(model, '#808080');

      expect((material.albedoColor.r * 255).round(), 64);
    });

    test('null color is a no-op', () {
      final material = SpatialMaterial(albedoColor: const Color(0xFF336699));
      final model = _modelWith([_surface(material)]);

      js3dTintModel(model, null);

      expect((material.albedoColor.r * 255).round(), 0x33);
    });
  });
}
