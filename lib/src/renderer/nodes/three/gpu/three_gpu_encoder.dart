part of '../flutter_gpu_three_backend.dart';

final class _GpuBatch {
  const _GpuBatch(this.source, this.buffer, this.view);

  final JsThreeDrawBatchUpsert source;
  final gpu.DeviceBuffer buffer;
  final gpu.BufferView view;
}

/// Whether the point-shadow texture pair may be bound for a frame. Pure
/// predicate over plain values — extracted from the encoder so the policy
/// is unit-testable without a GPU device.
bool threePointShadowLaneActive(
  bool shadowFrameActive,
  int hasPointShadow,
  bool frontTextureReady,
  bool backTextureReady,
) =>
    shadowFrameActive &&
    hasPointShadow != 0 &&
    frontTextureReady &&
    backTextureReady;

final class _ThreeUniformSlots {
  const _ThreeUniformSlots(
    this.frame,
    this.lights,
    this.material,
    this.clipping,
    this.map,
    this.shadowMap,
    this.vertex,
    this.alphaMap,
    this.envMap,
    this.matcap,
    this.gradientMap,
    this.pointShadowFront,
    this.pointShadowBack,
    this.normalMap,
    this.bumpMap,
    this.roughnessMap,
    this.metalnessMap,
    this.mapRight,
  );

  final gpu.UniformSlot frame;
  final gpu.UniformSlot lights;
  final gpu.UniformSlot material;
  final gpu.UniformSlot clipping;
  final gpu.UniformSlot map;
  final gpu.UniformSlot shadowMap;
  final gpu.UniformSlot vertex;
  final gpu.UniformSlot alphaMap;
  final gpu.UniformSlot envMap;
  final gpu.UniformSlot matcap;
  final gpu.UniformSlot gradientMap;
  final gpu.UniformSlot pointShadowFront;
  final gpu.UniformSlot pointShadowBack;
  final gpu.UniformSlot normalMap;
  final gpu.UniformSlot bumpMap;
  final gpu.UniformSlot roughnessMap;
  final gpu.UniformSlot metalnessMap;
  final gpu.UniformSlot mapRight;
}

_GpuGeometry? _threeGeometryForDraw(
  FlutterGpuThreeBackend backend,
  ThreeDrawItem draw,
) {
  final geometry = backend._geometries[backend._key(draw.geometry.geometryId)];
  if (geometry == null || !identical(geometry.source, draw.geometry)) {
    return null;
  }
  return geometry;
}

final class _ThreeFrameEncoder {
  const _ThreeFrameEncoder(
    this.backend,
    this.plan,
    this.pointSizeScale,
    this.viewportHeight,
  );

  final FlutterGpuThreeBackend backend;
  final ThreeDrawPlan plan;
  final double pointSizeScale;
  final double viewportHeight;

  bool _pointShadowActive() => threePointShadowLaneActive(
    backend._shadowFrameActive,
    plan.frame!.hasPointShadow,
    backend._pointShadowFrontColorTexture != null,
    backend._pointShadowBackColorTexture != null,
  );

  void _bindPointShadowTextures(_ThreeUniformSlots slots, gpu.RenderPass pass) {
    final active = _pointShadowActive();
    pass.bindTexture(
      slots.pointShadowFront,
      active
          ? backend._pointShadowFrontColorTexture!
          : backend._fallbackTexture,
    );
    pass.bindTexture(
      slots.pointShadowBack,
      active ? backend._pointShadowBackColorTexture! : backend._fallbackTexture,
    );
  }

  int record(gpu.RenderPass pass) {
    // Bind the pipeline before reflected uniforms for backends that validate
    // uniform and texture bindings against the active pipeline.
    pass.bindPipeline(backend._pipeline);
    final slots = _ThreeUniformSlots(
      backend._fragmentShader.getUniformSlot('FrameInfo'),
      backend._fragmentShader.getUniformSlot('Lights'),
      backend._fragmentShader.getUniformSlot('MaterialInfo'),
      backend._fragmentShader.getUniformSlot('ClippingInfo'),
      backend._fragmentShader.getUniformSlot('mapTexture'),
      backend._fragmentShader.getUniformSlot('shadowMapTexture'),
      backend._vertexShader.getUniformSlot('VertexInfo'),
      backend._fragmentShader.getUniformSlot('alphaMapTexture'),
      backend._fragmentShader.getUniformSlot('envMapTexture'),
      backend._fragmentShader.getUniformSlot('matcapTexture'),
      backend._fragmentShader.getUniformSlot('gradientMapTexture'),
      backend._fragmentShader.getUniformSlot('pointShadowFrontTexture'),
      backend._fragmentShader.getUniformSlot('pointShadowBackTexture'),
      backend._fragmentShader.getUniformSlot('normalMapTexture'),
      backend._fragmentShader.getUniformSlot('bumpMapTexture'),
      backend._fragmentShader.getUniformSlot('roughnessMapTexture'),
      backend._fragmentShader.getUniformSlot('metalnessMapTexture'),
      backend._fragmentShader.getUniformSlot('mapRightTexture'),
    );
    final frameUniform = _bindThreeUniform(
      backend,
      pass,
      slots.frame,
      _threeFrameUniform(plan, shadowEnabled: backend._shadowFrameActive),
    );
    final lightsUniform = _bindThreeUniform(
      backend,
      pass,
      slots.lights,
      _threeLightsUniform(plan),
    );
    pass.bindTexture(
      slots.shadowMap,
      (backend._shadowFrameActive ? backend._shadowColorTexture : null) ??
          backend._fallbackTexture,
    );
    _bindPointShadowTextures(slots, pass);
    var recordedDraws = 0;
    for (final draw in plan.mainDraws) {
      recordedDraws += _recordDraw(
        pass,
        slots,
        draw,
        frameUniform,
        lightsUniform,
      );
    }
    return recordedDraws;
  }

  int recordShadow(gpu.CommandBuffer command) {
    final frame = plan.frame!;
    if (!frame.hasShadow) return 0;
    if (frame.hasPointShadowMap) {
      return _recordPointShadowPasses(command, frame);
    }
    return _recordProjectedShadowPass(command, frame);
  }

  int _recordProjectedShadowPass(
    gpu.CommandBuffer command,
    JsThreeSubmitFrame frame,
  ) {
    if (!_prepareShadow(frame)) return 0;
    backend._shadowFrameActive = true;
    final pass = _createShadowPass(command, frame, backend._shadowPipeline!);
    final vertexSlot = backend._vertexShader.getUniformSlot('VertexInfo');
    final clippingSlot = _shadowClippingSlot(backend._shadowFragmentShader);
    return _recordShadowDraws(pass, vertexSlot, clippingSlot);
  }

  // R1 v5 point-light shadow pass — a dual paraboloid map (see
  // three_r1.vert): two full passes over the casters, one per light-space
  // hemisphere, storing the exact light-space distance per texel. No face
  // culling: back-hemisphere geometry must still write depth (upstream
  // point shadows render double-sided too).
  int _recordPointShadowPasses(
    gpu.CommandBuffer command,
    JsThreeSubmitFrame frame,
  ) {
    if (backend._pointShadowPipeline == null) {
      backend._note('point shadow pipeline is unavailable');
      return 0;
    }
    if (!_ensureThreePointShadowTargets(
      backend,
      frame.shadowMapWidth,
      frame.shadowMapHeight,
    )) {
      backend._note('R32Float point shadow targets are unsupported');
      return 0;
    }
    backend._shadowFrameActive = true;
    var recordedDraws = 0;
    recordedDraws += _recordPointShadowFace(command, frame, 1);
    // Metal forbids two open render encoders on one command buffer: the
    // back hemisphere gets its own buffer, submitted ahead of the main one.
    final backCommand = backend._context.createCommandBuffer();
    recordedDraws += _recordPointShadowFace(backCommand, frame, 2);
    _submitThreeShadow(backend, backCommand);
    return recordedDraws;
  }

  gpu.RenderTarget _pointShadowFaceTarget(int face) =>
      gpu.RenderTarget.singleColor(
        gpu.ColorAttachment(
          texture: face == 1
              ? backend._pointShadowFrontColorTexture!
              : backend._pointShadowBackColorTexture!,
          clearValue: vm.Vector4(1, 1, 1, 1),
        ),
        depthStencilAttachment: gpu.DepthStencilAttachment(
          texture: face == 1
              ? backend._pointShadowFrontDepthTexture!
              : backend._pointShadowBackDepthTexture!,
          depthClearValue: 1,
        ),
      );

  int _recordPointShadowFaceDraws(
    gpu.RenderPass pass,
    JsThreeSubmitFrame frame,
    int face,
    gpu.UniformSlot vertexSlot,
    gpu.UniformSlot materialSlot,
    gpu.UniformSlot? clippingSlot,
    gpu.UniformSlot alphaMapSlot,
  ) {
    var recordedDraws = 0;
    for (final draw in plan.draws) {
      if (frame.culledShadowNodeIds.contains(draw.node.nodeId)) continue;
      recordedDraws += _recordPointShadowDraw(
        pass,
        vertexSlot,
        materialSlot,
        clippingSlot,
        alphaMapSlot,
        draw,
        face,
      );
    }
    return recordedDraws;
  }

  int _recordPointShadowFace(
    gpu.CommandBuffer command,
    JsThreeSubmitFrame frame,
    int face,
  ) {
    final pass = command.createRenderPass(_pointShadowFaceTarget(face));
    _configureShadowPass(pass, backend._pointShadowPipeline!, frame);
    pass.setCullMode(gpu.CullMode.none);
    final vertexSlot = backend._vertexShader.getUniformSlot('VertexInfo');
    final materialSlot = backend._pointShadowFragmentShader!.getUniformSlot(
      'MaterialInfo',
    );
    final clippingSlot = _shadowClippingSlot(
      backend._pointShadowFragmentShader,
    );
    final alphaMapSlot = backend._pointShadowFragmentShader!.getUniformSlot(
      'alphaMapTexture',
    );
    return _recordPointShadowFaceDraws(
      pass,
      frame,
      face,
      vertexSlot,
      materialSlot,
      clippingSlot,
      alphaMapSlot,
    );
  }

  int _recordPointShadowDraw(
    gpu.RenderPass pass,
    gpu.UniformSlot vertexSlot,
    gpu.UniformSlot materialSlot,
    gpu.UniformSlot? clippingSlot,
    gpu.UniformSlot alphaMapSlot,
    ThreeDrawItem draw,
    int face,
  ) {
    if (!_isShadowCaster(draw)) return 0;
    final geometry = _bindShadowGeometry(
      pass,
      vertexSlot,
      draw,
      pointShadowFace: face,
    );
    if (geometry == null) return 0;
    _bindThreeUniform(
      backend,
      pass,
      materialSlot,
      _threeMaterialUniform(draw, plan),
    );
    _bindShadowClipping(backend, pass, clippingSlot, plan, draw.material);
    final alphaBinding = backend._textureBinding(
      draw.material.alphaMapTextureId,
    );
    pass.bindTexture(
      alphaMapSlot,
      alphaBinding.texture,
      sampler: alphaBinding.sampler(),
    );
    _drawThreeGeometry(pass, draw, geometry);
    return 1;
  }

  int _recordShadowDraws(
    gpu.RenderPass pass,
    gpu.UniformSlot vertexSlot,
    gpu.UniformSlot? clippingSlot,
  ) {
    final frame = plan.frame!;
    var recordedDraws = 0;
    for (final draw in plan.draws) {
      if (frame.culledShadowNodeIds.contains(draw.node.nodeId)) continue;
      recordedDraws += _recordShadowDraw(pass, vertexSlot, clippingSlot, draw);
    }
    return recordedDraws;
  }

  bool _prepareShadow(JsThreeSubmitFrame frame) {
    if (backend._shadowPipeline == null) {
      backend._note('directional shadow pipeline is unavailable');
      return false;
    }
    if (!_ensureThreeShadowTargets(
      backend,
      frame.shadowMapWidth,
      frame.shadowMapHeight,
    )) {
      backend._note('R32Float shadow render targets are unsupported');
      return false;
    }
    return true;
  }

  gpu.RenderPass _createShadowPass(
    gpu.CommandBuffer command,
    JsThreeSubmitFrame frame,
    gpu.RenderPipeline pipeline,
  ) {
    final pass = command.createRenderPass(
      gpu.RenderTarget.singleColor(
        gpu.ColorAttachment(
          texture: backend._shadowColorTexture!,
          clearValue: vm.Vector4(1, 1, 1, 1),
        ),
        depthStencilAttachment: gpu.DepthStencilAttachment(
          texture: backend._shadowDepthTexture!,
          depthClearValue: 1,
        ),
      ),
    );
    _configureShadowPass(pass, pipeline, frame);
    return pass;
  }

  void _configureShadowPass(
    gpu.RenderPass pass,
    gpu.RenderPipeline pipeline,
    JsThreeSubmitFrame frame,
  ) {
    pass
      ..bindPipeline(pipeline)
      ..setViewport(
        gpu.Viewport(
          width: frame.shadowMapWidth,
          height: frame.shadowMapHeight,
        ),
      )
      ..setWindingOrder(gpu.WindingOrder.counterClockwise)
      ..setPrimitiveType(gpu.PrimitiveType.triangle)
      ..setDepthCompareOperation(gpu.CompareFunction.lessEqual)
      ..setDepthWriteEnable(true)
      ..setColorBlendEnable(false);
  }

  bool _isShadowCaster(ThreeDrawItem draw) =>
      // Sprites never cast shadows (upstream Sprite docs); the native scan
      // already omits them, this guards hand-built plans too.
      draw.node.objectKind != JsThreeObjectKind.sprite &&
      draw.node.castShadow &&
      draw.primitive == ThreeDrawPrimitive.triangles;

  ({_GpuGeometry geometry, gpu.BufferView instances})? _shadowResources(
    ThreeDrawItem draw,
  ) {
    final geometry = _threeGeometryForDraw(backend, draw);
    final instances = _threeInstanceView(backend, draw);
    if (geometry == null || instances == null) return null;
    return (geometry: geometry, instances: instances);
  }

  int _recordShadowDraw(
    gpu.RenderPass pass,
    gpu.UniformSlot vertexSlot,
    gpu.UniformSlot? clippingSlot,
    ThreeDrawItem draw,
  ) {
    if (!_isShadowCaster(draw)) return 0;
    pass.setCullMode(_threeShadowCull(draw));
    final geometry = _bindShadowGeometry(pass, vertexSlot, draw);
    if (geometry == null) return 0;
    _bindShadowClipping(backend, pass, clippingSlot, plan, draw.material);
    _drawThreeGeometry(pass, draw, geometry);
    return 1;
  }

  _GpuGeometry? _bindShadowGeometry(
    gpu.RenderPass pass,
    gpu.UniformSlot vertexSlot,
    ThreeDrawItem draw, {
    int? pointShadowFace,
  }) {
    final resources = _shadowResources(draw);
    if (resources == null) {
      backend._skippedDrawCount++;
      return null;
    }
    final geometry = resources.geometry;
    pass.bindVertexBuffer(resources.instances, slot: 1);
    _bindThreeVertices(pass, geometry, draw);
    _bindThreeIndices(pass, geometry, draw);
    _bindThreeUniform(
      backend,
      pass,
      vertexSlot,
      _threeVertexUniform(
        draw,
        plan,
        pointSizeScale,
        viewportHeight: viewportHeight,
        shadowPass: true,
        pointShadowFace: pointShadowFace ?? 0,
      ),
    );
    return geometry;
  }

  int _recordDraw(
    gpu.RenderPass pass,
    _ThreeUniformSlots slots,
    ThreeDrawItem draw,
    gpu.BufferView frameUniform,
    gpu.BufferView lightsUniform,
  ) {
    final geometry = _threeGeometryForDraw(backend, draw);
    if (geometry == null) {
      backend._skippedDrawCount++;
      backend._note(
        'node ${draw.node.nodeId} skipped: geometry upload unavailable',
      );
      return 0;
    }
    final instances = _threeInstanceView(backend, draw);
    if (instances == null) {
      backend._skippedDrawCount++;
      backend._note(
        'node ${draw.node.nodeId} skipped: instance upload unavailable',
      );
      return 0;
    }
    pass
      ..bindPipeline(backend._pipeline)
      ..setPrimitiveType(_threePrimitiveTypes[draw.primitive]!)
      ..setCullMode(_threeCull(draw))
      ..setDepthCompareOperation(_threeDepthCompare[draw.material.depthTest]!)
      ..setDepthWriteEnable(draw.material.depthWrite)
      ..setColorBlendEnable(_threeBlendEnable(draw.material))
      ..setColorBlendEquation(_threeBlendEquation(draw.material))
      ..bindVertexBuffer(instances, slot: 1);
    _bindThreeVertices(pass, geometry, draw);
    _bindThreeIndices(pass, geometry, draw);
    _bindThreeDrawUniforms(
      backend,
      pass,
      slots,
      draw,
      plan,
      pointSizeScale,
      viewportHeight,
      frameUniform,
      lightsUniform,
    );
    _drawThreeGeometry(pass, draw, geometry);
    return 1;
  }
}

gpu.BufferView? _threeInstanceView(
  FlutterGpuThreeBackend backend,
  ThreeDrawItem draw,
) {
  if (draw.autoInstanced) return _threeAutoInstanceView(backend, draw);
  return _explicitBatchInstanceView(backend, draw);
}

gpu.BufferView? _explicitBatchInstanceView(
  FlutterGpuThreeBackend backend,
  ThreeDrawItem draw,
) {
  final batch = draw.batch;
  if (batch == null || !batch.instanced) {
    return backend._identityInstanceView;
  }
  final cached = backend._batches[backend._key(batch.nodeId)];
  return _uploadedThreeBatchView(cached, batch);
}

gpu.BufferView? _uploadedThreeBatchView(
  _GpuBatch? cached,
  JsThreeDrawBatchUpsert source,
) {
  if (cached == null || !identical(cached.source, source)) return null;
  return cached.view;
}
