import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, readdir, stat, mkdir, writeFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { helperFastPathPlugin } from './helper_fast_path_plugin.mjs';
import { assetDependencyAlias, assetOutputName, discoverAssets } from './asset_discovery.mjs';
import { decodeColladaAsset, decodeDracoAsset, decodeGlbAsset, decodeKtx2Asset, decodeVrmlAsset } from './asset_decode.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const CORE = path.join(ROOT, 'tool/three');
const PIN = JSON.parse(await readFile(path.join(CORE, 'source-pin.json'), 'utf8'));
const require = createRequire(path.join(CORE, 'package.json'));
const esbuild = require('esbuild');
const EXAMPLES = Object.freeze({
  webgl_interactive_raycasting_points: {
    id: 'three-interactive-raycasting-points',
    directory: 'three-interactive-raycasting-points',
    name: 'Raycasting Points — three.js r186',
    description: 'Unmodified official webgl_interactive_raycasting_points module on the JSR THREE R1/WebGL2 runtime.',
    icon: '✨',
    expected: {
      html: '9655038850e98ddf095cdce3dbc57ecaaa9596e5f165036e58530774d232e21e',
      module: 'e48baf7758a70a48ebdc7d8f189a0ed1dad52a505d1b42f592ed6d02baa9699d'
    },
    assets: []
  },
  webgl_interactive_cubes: {
    id: 'three-interactive-cubes',
    directory: 'three-interactive-cubes',
    name: 'Interactive Cubes — three.js r186',
    description: 'Unmodified official webgl_interactive_cubes module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '665b23cfd57c4363ae69d86cfbe9e07b15438f93d875ee48005b36e4a4908390',
      module: '69bee4f741eeb050c2a16a46c13754786358814e5ecb06845a91b9cdf3a6ce1a'
    },
    assets: []
  },
  webgl_interactive_cubes_ortho: {
    id: 'three-interactive-cubes-ortho',
    directory: 'three-interactive-cubes-ortho',
    name: 'Interactive Orthographic Cubes — three.js r186',
    description: 'Unmodified official webgl_interactive_cubes_ortho module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📦',
    expected: {
      html: 'a91c33252326f0caa79147c992c56774818425f698a3fb8936ed912063d364ce',
      module: 'f65518ff74e76c5c531e7447d797bd54da7ab542f3fa19456ef0fac8f069a9f1'
    },
    assets: []
  },
  webgl_interactive_lines: {
    id: 'three-interactive-lines',
    directory: 'three-interactive-lines',
    name: 'Interactive Lines — three.js r186',
    description: 'Unmodified official webgl_interactive_lines module on the JSR THREE R1/WebGL2 runtime.',
    icon: '〰️',
    expected: {
      html: '8bb34d7bc72ad8beb9b5a0ad9a991ece8890bf1bb817ca1eef516389a7f6ddf4',
      module: '403e26a214f2cd7a6ddc3a1389bf444a1ca940993eb90fd9f2676802ac5e74f0'
    },
    assets: []
  },
  webgl_geometry_extrude_shapes: {
    id: 'three-extrude-shapes',
    directory: 'three-extrude-shapes',
    name: 'Extrude Shapes — three.js r186',
    description: 'Unmodified official webgl_geometry_extrude_shapes module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: 'afe16ab46f6e8842b40e1972169e27655ecdb4a5d08267fac74088fc6c23b00a',
      module: '44482c872f96bde77d59a2c30b6a97c6ccd88bcb89621686fa1d619f75a3cc27'
    },
    assets: []
  },
  webgl_math_obb: {
    id: 'three-math-obb',
    directory: 'three-math-obb',
    name: 'Oriented Bounding Boxes — three.js r186',
    description: 'Unmodified official webgl_math_obb module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: 'e13fcaabb7b4a8a1e088757a9d8ac019e4ab67d0eb8335bf7687b7dd4c31a65c',
      module: 'a1e2acbadc56eaa6b596edbceee41735aa1dbdb4b9850274086ef567f7c31a6b'
    },
    assets: []
  },
  webgl_buffergeometry_points_interleaved: {
    id: 'three-buffergeometry-points-interleaved',
    directory: 'three-buffergeometry-points-interleaved',
    name: 'Interleaved BufferGeometry Points — three.js r186',
    description: 'Unmodified official webgl_buffergeometry_points_interleaved module on the JSR THREE R1/WebGL2 runtime.',
    icon: '✨',
    expected: {
      html: '4351a7405346edf378b97a562d415b39cf11986881858bb9718e2bf7d11c1fbe',
      module: '04bf67e452407c12ac29de87a61dc4e89ceb0e02c4a6e09e7da5ab968f625384'
    },
    assets: []
  },
  webgl_interactive_voxelpainter: {
    id: 'three-interactive-voxelpainter',
    directory: 'three-interactive-voxelpainter',
    name: 'Voxel Painter — three.js r186',
    description: 'Unmodified official webgl_interactive_voxelpainter module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧱',
    expected: {
      html: 'dec8afd0c945a59e0b333751930ea4bb2e60c7e44946f6ccb67aa38aafe00a9f',
      module: '0d012790ce1b18ac1ca5a877ef46ea0e902431843d856c03fa643b4a0766c3aa'
    },
    assets: [{
      url: 'textures/square-outline-textured.png',
      output: 'square-outline-textured.png',
      mime: 'image/png',
      diagnostic: 'voxelTexture',
      sha256: 'a217d5f472ae122acd2107d0f5dbd225ba8e197998e89fee579dd5b11fd3e717'
    }]
  },
  webgl_panorama_equirectangular: {
    id: 'three-panorama-equirectangular',
    directory: 'three-panorama-equirectangular',
    name: 'Equirectangular Panorama — three.js r186',
    description: 'Unmodified official webgl_panorama_equirectangular module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🌐',
    expected: {
      html: 'dfdfa57c273051b2bf2b46d0f8621847bf02612ca784a806f2c3dfcea6aec27f',
      module: 'c7da06fcf02a68836cd21af07802134cae1b207b0f2d64bac6eacc90286374e0'
    },
    assets: [{
      url: 'textures/2294472375_24a3b8ef46_o.jpg',
      output: 'panorama.jpg',
      mime: 'image/jpeg',
      diagnostic: 'panorama',
      sha256: '3efa22071f3f84ec26248ee58aa05aba635a0a9d810bca93da5a94f33e907524'
    }]
  },
  webgl_geometry_minecraft: {
    id: 'three-minecraft',
    directory: 'three-minecraft',
    name: 'Minecraft — three.js r186',
    description: 'Unmodified official webgl_geometry_minecraft module on the JSR THREE R1/WebGL2 runtime.',
    icon: '⛏️',
    expected: {
      html: 'fa0a3bd983bed5911d30109c3d1e4eecacbd1de6eee81653983bd0b4d8edb77c',
      module: 'a1b42a234f63ee155e4ced8d55e1a7ade87f5f03efa96a60d1302fb43dd864f8'
    },
    assets: [{
      url: 'textures/minecraft/atlas.png',
      output: 'atlas.png',
      mime: 'image/png',
      diagnostic: 'atlas',
      sha256: '61b423997c1a5e5f9bf8684fe3caed2b238a333b894a3e37223c30327c4b0df0'
    }]
  },
  webgl_geometry_colors: {
    id: 'three-geometry-colors',
    directory: 'three-geometry-colors',
    name: 'Vertex Colors — three.js r186',
    description: 'Unmodified official webgl_geometry_colors module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🎨',
    expected: {
      html: '90d1dc9947c092feba524972199b50daf4b01d2b8975c427d70bc5b6714a496f',
      module: '013a5e27a5bc9eb1a117c1fb95db429d508e8c67e40768e7de50bdecfa57de9f'
    },
    assets: []
  },
  webgl_lines_colors: {
    id: 'three-lines-colors',
    directory: 'three-lines-colors',
    name: 'Line Colors — three.js r186',
    description: 'Unmodified official webgl_lines_colors module on the JSR THREE R1/WebGL2 runtime.',
    icon: '〰️',
    expected: {
      html: 'a89c2291b5497be160e6763de192df8379b2a587ff245b603e25a65593c4b584',
      module: 'e7e9fcee0f8140745a400a30a5d29c9ac97a13409f655b1e618cddbd2c8d406c'
    },
    assets: []
  },
  webgl_buffergeometry_uint: {
    id: 'three-buffergeometry-uint',
    directory: 'three-buffergeometry-uint',
    name: 'Integer BufferGeometry — three.js r186',
    description: 'Unmodified official webgl_buffergeometry_uint module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🔢',
    expected: {
      html: 'a638b634348ecbd8f4c5fcf0889d04dab6c950e652569cab2486429f206dc457',
      module: 'e9b52fe4a7161d6bd32d0e25612eaaa0abc8878d43cfb146782b67400b7afe86'
    },
    assets: []
  },
  webgl_buffergeometry_indexed: {
    id: 'three-buffergeometry-indexed',
    directory: 'three-buffergeometry-indexed',
    name: 'Indexed BufferGeometry — three.js r186',
    description: 'Unmodified official webgl_buffergeometry_indexed module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🔺',
    expected: {
      html: '4370368307e79fcc83c43df84ba2c5f8a2624c66c8e653c8f63ae560801fc827',
      module: '99212fb6c3fcba450bd0faa33106c90eeaf09175fb3d7f002febf03a4ab76608'
    },
    assets: []
  },
  webgl_buffergeometry_lines_indexed: {
    id: 'three-buffergeometry-lines-indexed',
    directory: 'three-buffergeometry-lines-indexed',
    name: 'Indexed BufferGeometry Lines — three.js r186',
    description: 'Unmodified official webgl_buffergeometry_lines_indexed module on the JSR THREE R1/WebGL2 runtime.',
    icon: '❄️',
    expected: {
      html: '2b430176ebda402ca32d86565d3bf838bdc98158dbd37b0f3e21c9ba4e8442ee',
      module: 'a09b6d9af3a93221cf73c03d389a88918d8e65270292f3e20fd64a7ce8a27135'
    },
    assets: []
  },
  webgl_buffergeometry_points: {
    id: 'three-buffergeometry-points',
    directory: 'three-buffergeometry-points',
    name: 'BufferGeometry Points — three.js r186',
    description: 'Unmodified official webgl_buffergeometry_points module on the JSR THREE R1/WebGL2 runtime.',
    icon: '✨',
    expected: {
      html: 'ab181dd67b2e7199f062af3d83a62f425a493c88afeb3751c83d55ac5304e52f',
      module: '0ec6f6cebe58d4fe1373d9448e3ed0eb65f15312a42539ba212a961fa852fb40'
    },
    assets: []
  },
  webgl_geometry_terrain_raycast: {
    id: 'three-geometry-terrain-raycast',
    directory: 'three-geometry-terrain-raycast',
    name: 'Terrain Raycast — three.js r186',
    description: 'Unmodified official webgl_geometry_terrain_raycast module on the JSR THREE R1/WebGL2 runtime.',
    icon: '⛰️',
    expected: {
      html: 'f583b757839640cdb45daaf7896e656ca1bbd6fbc5fb2ab680bf9a9531725a1f',
      module: '1dd4eeafd3e34ceb5baea93fb588df704347c310298c7039d8816421e67df461'
    },
    assets: []
  },
  webgl_math_orientation_transform: {
    id: 'three-math-orientation-transform',
    directory: 'three-math-orientation-transform',
    name: 'Orientation Transform — three.js r186',
    description: 'Unmodified official webgl_math_orientation_transform module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧭',
    expected: {
      html: 'c9922d30273b58b1744fef5f4034c760de981f9ab28b641421ef0addcb7a0c56',
      module: '148bbdb22c24e0c617af871927a589a26d1a296528c2f1c5248f5f56c7fcc94a'
    },
    assets: []
  },
  webgl_instancing_raycast: {
    id: 'three-instancing-raycast',
    directory: 'three-instancing-raycast',
    name: 'Instancing Raycast — three.js r186',
    description: 'Unmodified official webgl_instancing_raycast module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🎯',
    expected: {
      html: '9f5488f1c20afcb93a09c8ab6e4440ab681ce706c8ce904e46b2c51a40cad3cd',
      module: '54b91333db3da2c53a8e34a29d24febb7058249a16c97c728b9f9fc8f41316c3'
    },
    assets: []
  },
  webgl_interactive_buffergeometry: {
    id: 'three-interactive-buffergeometry',
    directory: 'three-interactive-buffergeometry',
    name: 'Interactive BufferGeometry — three.js r186',
    description: 'Unmodified official webgl_interactive_buffergeometry module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🕸️',
    expected: {
      html: '86e1204da36571b57ebc5e157dad1ba63e849d99444c30f620347526b26b0be2',
      module: '579739e4f7a0ad792112b952851ac7fb3a29043feb6f26badd67cc5dfea04add'
    },
    assets: []
  },
  webgl_clipping: {
    id: 'three-clipping',
    directory: 'three-clipping',
    name: 'Clipping — three.js r186',
    description: 'Unmodified official webgl_clipping module on the JSR THREE R1/WebGL2 runtime.',
    icon: '✂️',
    expected: {
      html: 'e752317dcaf15569e2eb4e7939906100771be23fe1b78e9b010bd869bb958fd6',
      module: 'a2c8a7af45c9fce2447ce99c8d17acdb81c58e10bc297a32c0a70ebdbf5faf02'
    },
    assets: []
  },
  webgl_clipping_intersection: {
    id: 'three-clipping-intersection',
    directory: 'three-clipping-intersection',
    name: 'Clipping Intersection — three.js r186',
    description: 'Unmodified official webgl_clipping_intersection module on the JSR THREE R1/WebGL2 runtime.',
    icon: '⧉',
    expected: {
      html: '6fdd5071b3f92616d9ec9d5f7d4d963a72480d6c6f5252c8545426b64545aa0d',
      module: 'b2dc4a5d2bcc01c10a59d7346b6cc33cb7fc9775ec2a871ad74f839507542569'
    },
    assets: []
  },
  webgl_lights_spotlights: {
    id: 'three-lights-spotlights',
    directory: 'three-lights-spotlights',
    name: 'Spot Lights — three.js r186',
    description: 'Unmodified official webgl_lights_spotlights module on the JSR THREE R1/WebGL2 runtime.',
    icon: '💡',
    expected: {
      html: '81fde3f358975457db976ba426fd167bae80f3c44592e6182b5cbf1dc36347e4',
      module: 'd4ae903ca1f3788cde5026d07c02de878ee3b6966e555b7097076cd3d7e0bb83'
    },
    assets: []
  },
  webgl_lights_hemisphere: {
    id: 'three-lights-hemisphere',
    directory: 'three-lights-hemisphere',
    name: 'Hemisphere Light — three.js r186',
    description: 'Unmodified official webgl_lights_hemisphere module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🌤️',
    expected: {
      html: 'e79713c62965513d9a020de4f389314aaf6d184170ab39466becaef0af32a70c',
      module: '3d753e24af9f326cfc0861f276d45de49b8b346eeb77624232996940237bc649'
    },
    assets: [{
      url: 'models/gltf/Flamingo.glb',
      output: 'flamingo.glb',
      mime: 'model/gltf-binary',
      sha256: '9eabeb58587e4e0d11d5e23b30a26b73e4b8e6e8c83f2c36b3c5c3fe04dcf19f',
      diagnostic: 'flamingo'
    }],
    // Keep the sky dome as an unlit BackSide mesh using the official top
    // color. The custom vertical-gradient shader itself remains 1B-only.
    facadeWraps: {
      ShaderMaterial: `Base => {
        let warned = false;
        return class extends __three.MeshBasicMaterial {
          constructor(params = {}) {
            const uniforms = params.uniforms || {};
            const top = uniforms.topColor && uniforms.topColor.value;
            super({ color: top || 0x0077ff, side: params.side });
            this.uniforms = uniforms;
            if (!warned) {
              warned = true;
              console.warn('three-lights-hemisphere: R1 renders a solid-color sky dome; gradient ShaderMaterial dropped.');
            }
          }
        };
      }`
    }
  },
  webgl_interactive_points: {
    id: 'three-interactive-points',
    directory: 'three-interactive-points',
    name: 'Interactive Points — three.js r186',
    description: 'Unmodified official webgl_interactive_points module on the JSR THREE R1/WebGL2 runtime.',
    icon: '✦',
    expected: {
      html: '4b9bfec1d4ef700daf5bb52d65a1712df265576910561534d8fc14b5f533bf12',
      module: '5736b2b91b1f99ffc603bea0a8dfc8b64d4a521d03079e848681f25df93720ba'
    },
    assets: [{
      url: 'textures/sprites/disc.png',
      output: 'disc.png',
      mime: 'image/png',
      sha256: '1f3816715f028ac32065a10f40f5ef218b4efc67eb46f0d908a8d503f25b69cb',
      diagnostic: 'discSprite'
    }]
  },
  webgl_helpers: {
    id: 'three-helpers',
    directory: 'three-helpers',
    name: 'Helpers — three.js r186',
    description: 'Unmodified official webgl_helpers module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧭',
    expected: {
      html: '8c7fe346aeb456b512ea32bdbdbe10e59a251ba4c8dbf7a26e8154ce6b961bcf',
      module: '52cd7651225521b9dbca0a31a5b8c7b11fe740a649762d1a683404c84892cb15'
    },
    assets: [{
      url: 'models/gltf/LeePerrySmith/LeePerrySmith.glb',
      output: 'leeperry.glb',
      mime: 'model/gltf-binary',
      sha256: '402b8a8ac9f03232e6d64b5962929703a069daf99d3c49ac8eb0e48bedc9c576',
      diagnostic: 'leePerry'
    }]
  },
  webgl_geometry_spline_editor: {
    id: 'three-geometry-spline-editor',
    directory: 'three-geometry-spline-editor',
    name: 'Spline Editor — three.js r186',
    description: 'Unmodified official webgl_geometry_spline_editor module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🌀',
    expected: {
      html: 'fb552fe113bb287d28d563dbf579245138edadc869370240991d88ab50fb164c',
      module: '27840098f2ede8b243e8fdaae08853a3906132cff2bfe2b9dedd7e4246ee806b'
    },
    assets: []
  },
  webgl_buffergeometry: {
    id: 'three-buffergeometry',
    directory: 'three-buffergeometry',
    name: 'Buffergeometry — three.js r186',
    description: 'Unmodified official webgl_buffergeometry module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: '7a4ac8162786e2a3e7ceefe0a07434f5c4d5afab790b5dd2462d68211fd0122d',
      module: 'b5e32eeaa0ef1063ded69810983291f05e82d0a637065480c457dab115de706f'
    },
    assets: []
  },
  webgl_camera: {
    id: 'three-camera',
    directory: 'three-camera',
    name: 'Camera — three.js r186',
    description: 'Unmodified official webgl_camera module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: 'a97d4efbc7b530844793187301eca9e68572d78e01c3723704b2624d010b8b87',
      module: '73bb638ac7baea09544e95978016c00652c4b0dd1239c29e8f359d26952667d6'
    },
    assets: []
  },
  webgl_clipping_advanced: {
    id: 'three-clipping-advanced',
    directory: 'three-clipping-advanced',
    name: 'Clipping Advanced — three.js r186',
    description: 'Unmodified official webgl_clipping_advanced module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: 'ea9090598a4218a2ed7d09dd02f4ce0a9d01514d09cf18375a8f9aa135f4cc9e',
      module: '75c429241c6098ec781115b6986291936a6d1225a9ab654e6cb3d478ee4cf345'
    },
    assets: []
  },
  webgl_geometry_teapot: {
    id: 'three-geometry-teapot',
    directory: 'three-geometry-teapot',
    name: 'Geometry Teapot — three.js r186',
    description: 'Unmodified official webgl_geometry_teapot module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: '92daa0b21527b7bd743c0c312e0361b7ca7e317ccb1fa282fc97914883375f91',
      module: '19e25cdad0107ff074d94eea293491c34785e905a0542019ecea486b258e45b6'
    },
    assets: [
          {
                "url": "textures/uv_grid_opengl.jpg",
                "mime": "image/jpeg",
                'output': 'uv_grid_opengl.jpg',
      "sha256": "909d9a1eb2a5d5de9d221a5e8de4e9119d409decddf522d48896bd51523d354d"
          },
          {
                "url": "textures/cube/pisa/px.png",
                "mime": "image/png",
                'output': 'px.png',
      "sha256": "11d859640e7da526ac0654dbfa1cc18f40dd8fc100db197730485218a7c9d24d"
          },
          {
                "url": "textures/cube/pisa/nx.png",
                "mime": "image/png",
                'output': 'nx.png',
      "sha256": "cf01cfc9a168e7c71bf66d0bed8dcad3a4fd353f528e73caaba62d1a097c49a1"
          },
          {
                "url": "textures/cube/pisa/py.png",
                "mime": "image/png",
                'output': 'py.png',
      "sha256": "b34a1cec12e62327c9555ca9f82a38bea73f519915e1368fa69bbd51c82ec712"
          },
          {
                "url": "textures/cube/pisa/ny.png",
                "mime": "image/png",
                'output': 'ny.png',
      "sha256": "61a94678f04f9853509d7a864fd839cf688c6705ee9df02fc4e42bfca858270b"
          },
          {
                "url": "textures/cube/pisa/pz.png",
                "mime": "image/png",
                'output': 'pz.png',
      "sha256": "bd528b739e9e0ea6c1e8627e949caa950991719069c983e8abdc3a8640039667"
          },
          {
                "url": "textures/cube/pisa/nz.png",
                "mime": "image/png",
                'output': 'nz.png',
      "sha256": "e5c1774f9a41d8124f8f223c9810e95d277f256104f8aee57ad2e5ef73a64424"
          },    ]
  },
  webgl_geometry_extrude_splines: {
    id: 'three-geometry-extrude-splines',
    directory: 'three-geometry-extrude-splines',
    name: 'Geometry Extrude Splines — three.js r186',
    description: 'Unmodified official webgl_geometry_extrude_splines module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: 'd3d7cbd515b7e5743b1bfec51272e75fa0dd622b524607621f476084c0c83588',
      module: '72862671e94e84489b95cfc48551cd3d43498bb44ced8592eaaaea1944729522'
    },
    assets: []
  },
  webgl_lights_physical: {
    id: 'three-lights-physical',
    directory: 'three-lights-physical',
    name: 'Lights Physical — three.js r186',
    description: 'Unmodified official webgl_lights_physical module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: '7f92cf57c44e8bd7b95ba49373569f5af793f77766b4e54f04fcbc968941aff7',
      module: 'f9e95c8df76fca71394694fa8ddf6c899aa37bf24692e980a8797fbf99e84730'
    },
    assets: [
          {
                "url": "textures/hardwood2_diffuse.jpg",
                "mime": "image/jpeg",
                'output': 'hardwood2_diffuse.jpg',
      "sha256": "3986fe3bd7d3c24b18e7da17ae72bbef9385dbc355c931c52a04dbfe1412c802"
          },
          {
                "url": "textures/hardwood2_bump.jpg",
                "mime": "image/jpeg",
                'output': 'hardwood2_bump.jpg',
      "sha256": "0f07254a3eb31274b7f7cc71968b74a5a39a799d33e8b290c4b8dca6ce43654d"
          },
          {
                "url": "textures/hardwood2_roughness.jpg",
                "mime": "image/jpeg",
                'output': 'hardwood2_roughness.jpg',
      "sha256": "bdce31ae1138fd110703f5fb37a4979b4b03cd6a057f58897c16d27839d7d17b"
          },
          {
                "url": "textures/brick_diffuse.jpg",
                "mime": "image/jpeg",
                'output': 'brick_diffuse.jpg',
      "sha256": "b49b0ab13aa4455cc7348cb4bfbbffcb344f2f81b17121eb1e57bcd3b387febe"
          },
          {
                "url": "textures/brick_bump.jpg",
                "mime": "image/jpeg",
                'output': 'brick_bump.jpg',
      "sha256": "fad2311729a8f98c2fdcb6d9442e8c2b70c97c169eb653005e5554680fa18a53"
          },
          {
                "url": "textures/planets/earth_atmos_2048.jpg",
                "mime": "image/jpeg",
                'output': 'earth_atmos_2048.jpg',
      "sha256": "2faa400d1eade3bc44caf6750d1b772bd9bbb6d87362c02bc7c3304e78fa0a9d"
          },
          {
                "url": "textures/planets/earth_specular_2048.jpg",
                "mime": "image/jpeg",
                'output': 'earth_specular_2048.jpg',
      "sha256": "2df48906732d7a458b2d0a7cdec51a829262307c6bdee4cfdf079a4dd7c71c69"
          }
    ]
  },
  webgl_lights_spotlight: {
    id: 'three-lights-spotlight',
    directory: 'three-lights-spotlight',
    name: 'Lights Spotlight — three.js r186',
    description: 'Unmodified official webgl_lights_spotlight module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: '0b618837471d5541ddfc4f9a4cd3967e728213473212a736fe91d266dd0e907a',
      module: '53c9479a0cca34cba5e22d3fb1347c2b7e862292bf709876957c135724f0233a'
    },
    assets: [
          {
                "url": "models/ply/binary/Lucy100k.ply",
                "mime": "application/octet-stream",
                'output': 'Lucy100k.ply',
      "sha256": "837f769e67155dc4a6e9a90683a61d6f6b4571a2a97d79586831011f450e66e2"
          }
    ]
  },
webgl_loader_ply: {
    id: 'three-loader-ply',
    directory: 'three-loader-ply',
    name: 'Loader Ply — three.js r186',
    description: 'Unmodified official webgl_loader_ply module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: 'af54a0ced7acec9584290214972696835af2dc8dbd95be87a0762c7c131a80ad',
      module: 'f6e098e707704afecb4383bbc7f2b7ba05a3b113f2121a38559dcd3fa9515b78'
    },
    assets: [
          {
                "url": "models/ply/ascii/dolphins.ply",
                "mime": "application/octet-stream",
                "output": "dolphins.ply",
                "sha256": "1246b1050ebc1e2e6b9de796a004bd3914e525546d402a5e286fbe6f13940c8e"
          },
          {
                "url": "models/ply/binary/Lucy100k.ply",
                "mime": "application/octet-stream",
                "output": "Lucy100k.ply",
                "sha256": "837f769e67155dc4a6e9a90683a61d6f6b4571a2a97d79586831011f450e66e2"
          }
    ]
  },
  webgl_loader_stl: {
    id: 'three-loader-stl',
    directory: 'three-loader-stl',
    name: 'Loader Stl — three.js r186',
    description: 'Unmodified official webgl_loader_stl module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: '9098d9547d5ccb14e4371dd7ff21ff222f4640d16cedc3151049b25803357d82',
      module: 'e8a0ce82285c704e61204a95aff80d92168f3f4adc4df3e5e0621142c5c77082'
    },
    assets: [
          {
                "url": "models/stl/ascii/slotted_disk.stl",
                "mime": "application/octet-stream",
                "output": "slotted_disk.stl",
                "sha256": "5c0d95ca55352ccf5cca12197a5f9fa17eb2e905d1bb3a45c8ba51c9a22699a4"
          },
          {
                "url": "models/stl/binary/pr2_head_pan.stl",
                "mime": "application/octet-stream",
                "output": "pr2_head_pan.stl",
                "sha256": "c4ebcc17156642a8e4df8564a09f730b54db236e783320d71af3e51de17e8315"
          },
          {
                "url": "models/stl/binary/pr2_head_tilt.stl",
                "mime": "application/octet-stream",
                "output": "pr2_head_tilt.stl",
                "sha256": "4c98307430589fbb86f0310b25b1896bbb0ac4c4f5b97d9dc4f03d3250003533"
          },
          {
                "url": "models/stl/binary/colored.stl",
                "mime": "application/octet-stream",
                "output": "colored.stl",
                "sha256": "0012b62d4bb485f902a972192eef29d6ce4b97a9deb2de67a02d30a5b738f461"
          }
    ]
  },
  webgl_materials_matcap: {
    id: 'three-materials-matcap',
    directory: 'three-materials-matcap',
    name: 'Materials Matcap — three.js r186',
    description: 'Unmodified official webgl_materials_matcap module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: '71c8fe686c1e8727c530bea8c493230c13ab5d6b62d16675f931ea1d56ce6a3b',
      module: '0abc2fcda73cb87c7101698653b2419a2e6809ce33b93497db53de8f256d5aa5'
    },
    assets: [
          {
                "url": "textures/matcaps/040full.exr",
                "mime": "application/octet-stream",
                "output": "040full.exr",
      "sha256": "14deb8c88d02cd44d3694c9b63a5a56fb481364298900441a2be42f9eb70a9d3"
          },
          {
                "url": "models/gltf/LeePerrySmith/Infinite-Level_02_Tangent_SmoothUV.jpg",
                "mime": "image/jpeg",
                'output': 'Infinite-Level_02_Tangent_SmoothUV.jpg',
      "sha256": "36925e51ad9b324b94e8faf4692da1b4132809f2762bb8d5bd549ffd215d4ca6"
          },
          {
                "url": "models/gltf/LeePerrySmith/LeePerrySmith.glb",
                "mime": "model/gltf-binary",
                'output': 'LeePerrySmith.glb',
      "sha256": "402b8a8ac9f03232e6d64b5962929703a069daf99d3c49ac8eb0e48bedc9c576"
          }
    ],
    // R1's matcap path is an unlit lookup without tangent-space normal
    // mapping; peel the slot (single warning) instead of rejecting the whole
    // material. Upstream official_module.js bytes stay untouched. The wrap
    // rides the facade binding because THREE's exports are getter-only.
    facadeWraps: {
      MeshMatcapMaterial: `Base => {
        let warned = false;
        return class extends Base {
          constructor(params) {
            if (params && params.normalMap) {
              const peeled = Object.assign({}, params);
              delete peeled.normalMap;
              if (!warned) {
                warned = true;
                console.warn('three-materials-matcap: R1 drops MeshMatcapMaterial.normalMap (unsupported); matcap shading kept.');
              }
              super(peeled);
            } else {
              super(params);
            }
          }
        };
      }`
    }
  },
  webgl_materials_toon: {
    id: 'three-materials-toon',
    directory: 'three-materials-toon',
    name: 'Materials Toon — three.js r186',
    description: 'Unmodified official webgl_materials_toon module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: '9b0536f345ae2c333086f4d45bfc7c65ba67363ed1bba5c0838539b8fd51672f',
      module: 'ed42f109b1bfa322b70da6c2261a18d72f4f108d457e6baae2f1edfe1ae07020'
    },
    assets: [
          {
                "url": "fonts/gentilis_regular.typeface.json",
                "mime": "application/json",
                'output': 'gentilis_regular.typeface.json',
      "sha256": "7ed95f2faa30f59dbe7cfb145b97c42a6ba1188cd2eec01ca61485e8c83ee9de"
          }
    ],
    // OutlineEffect needs arbitrary ShaderMaterial (outside R1): delegate to
    // the underlying renderer so the toon scene renders without the outline
    // pass instead of erroring every frame. Upstream bytes stay untouched.
    addonShims: {
      'three/addons/effects/OutlineEffect.js': `export class OutlineEffect {
  constructor(renderer) { this.renderer = renderer; this.enabled = true; this.autoClear = true; }
  render(scene, camera) { this.renderer.render(scene, camera); }
  setSize(width, height) { this.renderer.setSize(width, height); }
}
`
    }
  },
  webgl_materials_normalmap: {
    id: 'three-materials-normalmap',
    directory: 'three-materials-normalmap',
    name: 'Materials Normalmap — three.js r186',
    description: 'Unmodified official webgl_materials_normalmap module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: '60d920cef908de10d41e946cf0b28c3ff8dff431e310274ba0626f3307983d3b',
      module: '5d8f60caec18ee59f03b595c6905c5a8a224522f37fa26f95a5611b9437680f4'
    },
    assets: [
          {
                "url": "models/gltf/LeePerrySmith/Map-COL.jpg",
                "mime": "image/jpeg",
                'output': 'Map-COL.jpg',
      "sha256": "e976d73b31407f8d0967412bf468019ed26a5d5a32cf5811aabff7e816458a65"
          },
          {
                "url": "models/gltf/LeePerrySmith/Map-SPEC.jpg",
                "mime": "image/jpeg",
                'output': 'Map-SPEC.jpg',
      "sha256": "cbb96b60e355b804d9b6c7338372d13ec8cc7adf664f50a00a3d32c66afd293a"
          },
          {
                "url": "models/gltf/LeePerrySmith/Infinite-Level_02_Tangent_SmoothUV.jpg",
                "mime": "image/jpeg",
                'output': 'Infinite-Level_02_Tangent_SmoothUV.jpg',
      "sha256": "36925e51ad9b324b94e8faf4692da1b4132809f2762bb8d5bd549ffd215d4ca6"
          },
          {
                "url": "models/gltf/LeePerrySmith/LeePerrySmith.glb",
                "mime": "model/gltf-binary",
                'output': 'LeePerrySmith.glb',
      "sha256": "402b8a8ac9f03232e6d64b5962929703a069daf99d3c49ac8eb0e48bedc9c576"
          }
    ],
    // R1 v6 renders the real tangentless normal map; specularMap stays 1B
    // and is peeled once with a warning (upstream bytes stay pinned).
    facadeWraps: {
      MeshPhongMaterial: `Base => {
        let warned = false;
        return class extends Base {
          constructor(params) {
            if (params && params.specularMap) {
              const peeled = Object.assign({}, params);
              delete peeled.specularMap;
              if (!warned) {
                warned = true;
                console.warn('three-materials-normalmap: R1 drops MeshPhongMaterial.specularMap (unsupported); normal mapping kept.');
              }
              super(peeled);
            } else {
              super(params);
            }
          }
        };
      }`
    },
    // The postprocessing chain (bleach/color correction/FXAA) needs
    // arbitrary ShaderMaterial, outside R1: render the scene directly
    // through the composer facade instead of failing every frame.
    addonShims: {
      'three/addons/postprocessing/EffectComposer.js': `export class EffectComposer {
  constructor(renderer) { this.renderer = renderer; this.scene = null; this.camera = null; }
  addPass(pass) {
    if (pass && pass.scene && pass.camera) { this.scene = pass.scene; this.camera = pass.camera; }
  }
  render() { if (this.scene && this.camera) this.renderer.render(this.scene, this.camera); }
  setSize() {}
  setPixelRatio() {}
}
`,
      'three/addons/postprocessing/RenderPass.js': `export class RenderPass {
  constructor(scene, camera) { this.scene = scene; this.camera = camera; this.enabled = true; }
}
`,
      'three/addons/postprocessing/ShaderPass.js': `export class ShaderPass {
  constructor(shader) { this.uniforms = shader && shader.uniforms ? shader.uniforms : {}; this.enabled = true; }
}
`,
      'three/addons/postprocessing/FXAAPass.js': `export class FXAAPass { constructor() { this.enabled = true; } }
`,
      'three/addons/postprocessing/OutputPass.js': `export class OutputPass { constructor() { this.enabled = true; } }
`
    }
  },
  webgl_materials_bumpmap: {
    id: 'three-materials-bumpmap',
    directory: 'three-materials-bumpmap',
    name: 'Materials Bumpmap — three.js r186',
    description: 'Unmodified official webgl_materials_bumpmap module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: '619b576992f4ab8e96247b5289ad7c9e4f2861ed274353d556063ac48ff455a9',
      module: '598cd98dcfcfe0f87d2be38989541543c99c320f1df6cfaf7b143e73f81d21fe'
    },
    assets: [
          {
                "url": "models/gltf/LeePerrySmith/Infinite-Level_02_Disp_NoSmoothUV-4096.jpg",
                "mime": "image/jpeg",
                'output': 'Infinite-Level_02_Disp_NoSmoothUV-4096.jpg',
      "sha256": "937dea3ab1adea4624c9743ea0653fcb022235e6dcdebfb6e739b93f9d2a5cef"
          },
          {
                "url": "models/gltf/LeePerrySmith/LeePerrySmith.glb",
                "mime": "model/gltf-binary",
                'output': 'LeePerrySmith.glb',
      "sha256": "402b8a8ac9f03232e6d64b5962929703a069daf99d3c49ac8eb0e48bedc9c576"
          }
    ]
  },
  webgl_materials_texture_canvas: {
    id: 'three-materials-texture-canvas',
    directory: 'three-materials-texture-canvas',
    name: 'Materials Texture Canvas — three.js r186',
    description: 'Unmodified official webgl_materials_texture_canvas module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: '55d945e495a55dc385532f35521b5d595cff8b5787c152495c96c12d347ef960',
      module: '652b934745aba9cf007602b95bc7d79b69db61a945db0c99ce5fa0afff78f59c'
    },
    assets: []
  },
  webgl_materials_texture_rotation: {
    id: 'three-materials-texture-rotation',
    directory: 'three-materials-texture-rotation',
    name: 'Materials Texture Rotation — three.js r186',
    description: 'Unmodified official webgl_materials_texture_rotation module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: '07b2a844ac657c4324fc0b6bc1ba3e7418f74f1447c36dd8d6bc4fd2b483b74a',
      module: '62748d06a1d4a5ca393025b5dc82186198da21839e9967187f44866ae93c2f0d'
    },
    assets: [
          {
                "url": "textures/uv_grid_opengl.jpg",
                "mime": "image/jpeg",
                'output': 'uv_grid_opengl.jpg',
      "sha256": "909d9a1eb2a5d5de9d221a5e8de4e9119d409decddf522d48896bd51523d354d"
          }
    ]
  },
  webgl_materials_displacementmap: {
    id: 'three-materials-displacementmap',
    directory: 'three-materials-displacementmap',
    name: 'Materials Displacementmap — three.js r186',
    description: 'Unmodified official webgl_materials_displacementmap module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: 'c65e1d2aff2975307afae8c5ecd0a85a6211244bd0263555981cc7b0ad2cf5bd',
      module: '6d582d9a6a7511e96744d6d822005ed0e0b0cbb71ff3ccb98e3534c4545f5463'
    },
    assets: [
          {
                "url": "models/obj/ninja/normal.png",
                "mime": "image/png",
                'output': 'normal.png',
      "sha256": "aa147cbb271787f793b437607b076fb170555f3f8dc3c392cc29910ca7a63d49"
          },
          {
                "url": "models/obj/ninja/ao.jpg",
                "mime": "image/jpeg",
                'output': 'ao.jpg',
      "sha256": "004c1b0c9829fd5c25d413fce2ff0224e5e62f17f8064af9e34d9c2887e6b41b"
          },
          {
                "url": "models/obj/ninja/displacement.jpg",
                "mime": "image/jpeg",
                'output': 'displacement.jpg',
      "sha256": "5da43d969f6c178b1d2d819c5da523c66432a24f351d80afc88b1ada5f2c3f3b"
          },
          {
                "url": "models/obj/ninja/ninjaHead_Low.obj",
                "mime": "application/octet-stream",
                'output': 'ninjaHead_Low.obj',
      "sha256": "07819eacecae77a8539fbaf673d9a0908ec2e6383d1b6cedd94544b2a2f2c53b"
          },
      { rawRgba: true, url: 'textures/cube/SwedishRoyalCastle/px.jpg', output: 'castle-px.jpg', mime: 'image/jpeg', sha256: '10a786132bc7eef6b142bd0d4b00ea94ffc1a1bfccfb1a6ec0baedf966d80734' },
      { rawRgba: true, url: 'textures/cube/SwedishRoyalCastle/nx.jpg', output: 'castle-nx.jpg', mime: 'image/jpeg', sha256: '53a8d90cea6bab188d462c44676b84e5993424e465785c93829d810bbf7c5076' },
      { rawRgba: true, url: 'textures/cube/SwedishRoyalCastle/py.jpg', output: 'castle-py.jpg', mime: 'image/jpeg', sha256: '8b88f7f9af85fa5b442f28fb27532e534a197aba68ae60548bf4b3750f0d50f0' },
      { rawRgba: true, url: 'textures/cube/SwedishRoyalCastle/ny.jpg', output: 'castle-ny.jpg', mime: 'image/jpeg', sha256: '17953cc33b9fec703c286266d4aca6033d758edd17ba0384fb3ebd7630085fd4' },
      { rawRgba: true, url: 'textures/cube/SwedishRoyalCastle/pz.jpg', output: 'castle-pz.jpg', mime: 'image/jpeg', sha256: 'cc9252ba994a79c320ac4aed03aac9000f810c1358179e70a69b598d56e129db' },
      { rawRgba: true, url: 'textures/cube/SwedishRoyalCastle/nz.jpg', output: 'castle-nz.jpg', mime: 'image/jpeg', sha256: '10149242ae21ba4c00663a0673f01a6722da63f201511fdc01941930d800ccff' }
    ],
    // Keep normal + cube environment mapping. AO and vertex displacement
    // still require native material lanes, so peel only those two slots.
    facadeWraps: {
      MeshStandardMaterial: `Base => {
        let warned = false;
        return class extends Base {
          constructor(params) {
            if (params && (params.aoMap || params.displacementMap)) {
              const peeled = Object.assign({}, params);
              delete peeled.aoMap;
              delete peeled.displacementMap;
              if (!warned) {
                warned = true;
                console.warn('three-materials-displacementmap: R1 drops aoMap/displacementMap; normalMap and envMap retained.');
              }
              super(peeled);
            } else super(params);
          }
        };
      }`
    }
  },

  webgl_materials_modified: {
    id: 'three-materials-modified',
    directory: 'three-materials-modified',
    name: 'Materials Modified — three.js r186',
    description: 'Unmodified official webgl_materials_modified module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: '902d2c154d8c2cb8b84b75333c9b5f9aa28540bec31c51e957e57f8806b8e303',
      module: '443b6067810ed01cb763b413148a0218208248ad18399e1554f1640bab405183'
    },
    assets: [
          {
                "url": "models/gltf/LeePerrySmith/LeePerrySmith.glb",
                'output': 'LeePerrySmith.glb',
                "mime": "model/gltf-binary",
      "sha256": "402b8a8ac9f03232e6d64b5962929703a069daf99d3c49ac8eb0e48bedc9c576"
          }
    ],
    // Render both heads with stock MeshNormalMaterial when arbitrary shader
    // injection is unavailable. The prototype setter prevents an own
    // onBeforeCompile property from reaching R1's capability guard.
    facadeWraps: {
      MeshNormalMaterial: `Base => {
        let warned = false;
        return class extends Base {
          get onBeforeCompile() { return undefined; }
          set onBeforeCompile(value) {
            if (typeof value === 'function' && !warned) {
              warned = true;
              console.warn('three-materials-modified: R1 renders static normal heads; onBeforeCompile twist dropped.');
            }
          }
        };
      }`
    }
  },

  webgl_buffergeometry_lines: {
    id: 'three-buffergeometry-lines',
    directory: 'three-buffergeometry-lines',
    name: 'Buffergeometry Lines — three.js r186',
    description: 'Unmodified official webgl_buffergeometry_lines module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: 'ec83469cf911cb4a39a828a74dc33c29db4290dd9da1ed99891dbc6fcc79f824',
      module: '55f3a0ce6d86897acf805c9e19f736c622d99a53c7fa96e98ca918951b42415b'
    },
    assets: []
  },
  webgl_materials_texture_partialupdate: {
    id: 'three-materials-partialupdate',
    directory: 'three-materials-partialupdate',
    name: 'Materials Texture Partialupdate — three.js r186',
    description: 'Unmodified official webgl_materials_texture_partialupdate module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: '61cf6d8f41f8408b62a9e31f22e9267877351383184ddb7961186fb2b53652bc',
      module: 'e08c0ff113b4211624f36ddd598d7f3af604d454f7789d42749ec7a9792d6e43'
    },
    assets: [
          {
                "url": "textures/floors/FloorsCheckerboard_S_Diffuse.jpg",
                "mime": "image/jpeg",
                'output': 'FloorsCheckerboard_S_Diffuse.jpg',
      "sha256": "d7547036c6221a840b80ce11138dc2c1a26df2630419217234c479b00e50a119"
          }
    ]
  },
  webgl_points_billboards: {
    id: 'three-points-billboards',
    directory: 'three-points-billboards',
    name: 'Points Billboards — three.js r186',
    description: 'Unmodified official webgl_points_billboards module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: 'c26f1566bc4a027afd79202f6caee8abe3079cd6037fda281bf31c69f19f6faf',
      module: '88b1c30f87ed0caf00a495b03fc8019e235029ad5518ce3b93b8ca313a8aecd4'
    },
    assets: [
          {
                "url": "textures/sprites/disc.png",
                "mime": "image/png",
                'output': 'disc.png',
      "sha256": "1f3816715f028ac32065a10f40f5ef218b4efc67eb46f0d908a8d503f25b69cb"
          }
    ]
  },
webgl_geometry_shapes: {
    id: 'three-geometry-shapes',
    directory: 'three-geometry-shapes',
    name: 'Geometry Shapes — three.js r186',
    description: 'Unmodified official webgl_geometry_shapes module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: '8c29395a7d7f3eca80383bff1a260408edf26a64ef9426af32e2de60f536b051',
      module: 'b22907f9ba17e46fc75887c6ee1a5377a4e4baef9f14e095378d25b13b2afbc1'
    },
    assets: [
          {
                "url": "textures/uv_grid_opengl.jpg",
                "mime": "image/jpeg",
                "output": "uv_grid_opengl.jpg",
                "sha256": "909d9a1eb2a5d5de9d221a5e8de4e9119d409decddf522d48896bd51523d354d"
          }
    ]
  },
  webgl_geometry_text_shapes: {
    id: 'three-geometry-text-shapes',
    directory: 'three-geometry-text-shapes',
    name: 'Geometry Text Shapes — three.js r186',
    description: 'Unmodified official webgl_geometry_text_shapes module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: '0468d42e536566602bdd72162738238c1bdd3ac0463c29bd2fa88e80b68a1249',
      module: '65f0b38c67536381adfb8dc2191a1b47535f854933dc5a0dc94f93fbc07d954b'
    },
    assets: [
          {
                "url": "fonts/helvetiker_regular.typeface.json",
                "mime": "application/json",
                "output": "helvetiker_regular.typeface.json",
                "sha256": "d5c5467690f74061179a292af83bd85c4c551e0f106b2af99714f11184c96981"
          }
    ]
  },
  webgl_sprites: {
    id: 'three-sprites',
    directory: 'three-sprites',
    name: 'Sprites — three.js r186',
    description: 'Unmodified official webgl_sprites module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: '48d6ae182b791cb2539eb2569fe812d47f7c0c9e85d1111c12adbb7642d12c36',
      module: 'e532443ad7acaa4ecba94e9536874d2c29187e39f636f43ac957034fe80820af'
    },
    assets: [
          {
                "url": "textures/sprite0.png",
                "mime": "image/png",
                "output": "sprite0.png",
                "sha256": "79592d002649e69628ed7ea9dc79ab911c43dded78c716362742e225acec32fb"
          },
          {
                "url": "textures/sprite1.png",
                "mime": "image/png",
                "output": "sprite1.png",
                "sha256": "0c69d3d1eaed72c3f13ddf93db0e233475b0cf850d3e3d9e45fd7a3803cac9e4"
          },
          {
                "url": "textures/sprite2.png",
                "mime": "image/png",
                "output": "sprite2.png",
                "sha256": "85fbb827b321ce6238088d2a7e895c2c53c015ecb7076db855c90c0109b46707"
          }
    ]
  },
  webgl_raycaster_sprite: {
    id: 'three-raycaster-sprite',
    directory: 'three-raycaster-sprite',
    name: 'Raycaster Sprite — three.js r186',
    description: 'Unmodified official webgl_raycaster_sprite module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: '4c33f7db6a19eba628803e57461dc3fc59bb39214f35cd7ad79bf1a74e68ff7a',
      module: '1c666877a6c1c4ca09587f3d4f25255ee568339ce39affd6e98fd0c454968d21'
    },
    assets: []
  },
  webgl_raycaster_texture: {
    id: 'three-raycaster-texture',
    directory: 'three-raycaster-texture',
    name: 'Raycaster Texture — three.js r186',
    description: 'Unmodified official webgl_raycaster_texture module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: '5858801b68cffc10012a39a38b5eb5d6c8cf55a333eb8c105c79426d9807c133',
      module: '623c5c427d235d4d3c48b3a1bf1e130c1091a29ab42000c1de9de9929975dc9b'
    },
    assets: [
          {
                "url": "textures/uv_grid_opengl.jpg",
                "mime": "image/jpeg",
                "output": "uv_grid_opengl.jpg",
                "sha256": "909d9a1eb2a5d5de9d221a5e8de4e9119d409decddf522d48896bd51523d354d"
          }
    ]
  },
  webgl_camera_logarithmicdepthbuffer: {
    id: 'three-camera-logarithmicdepthbuffer',
    directory: 'three-camera-logarithmicdepthbuffer',
    name: 'Camera Logarithmicdepthbuffer — three.js r186',
    description: 'Unmodified official webgl_camera_logarithmicdepthbuffer module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: 'ab3e4d8d3e713cc539f5608f6234333ba585d0a093672dd3a90a7249969ee90c',
      module: '646f52b3453142cd0ec25f5348da4fe2ac235ce7d6b5058b4109ba4b1ed82044'
    },
    assets: [
          {
                "url": "fonts/helvetiker_regular.typeface.json",
                "mime": "application/json",
                "output": "helvetiker_regular.typeface.json",
                "sha256": "d5c5467690f74061179a292af83bd85c4c551e0f106b2af99714f11184c96981"
          }
    ],
    // The official comparison has two renderer objects but one surface in
    // JSR. Share the first R1 renderer; logarithmicDepthBuffer remains a
    // documented native-depth feature, not a reason to lose the whole scene.
    facadeWraps: {
      WebGLRenderer: `Base => {
        let shared = null;
        let warned = false;
        return function(params) {
          if (!shared) shared = new Base(params);
          if (params && params.logarithmicDepthBuffer && !warned) {
            warned = true;
            console.warn('three-camera-logarithmicdepthbuffer: R1 shares one standard-depth renderer; logarithmic depth is not emulated.');
          }
          return shared;
        };
      }`
    }
  },
  webgl_instancing_performance: {
    id: 'three-instancing-performance',
    directory: 'three-instancing-performance',
    name: 'Instancing Performance — three.js r186',
    description: 'Unmodified official webgl_instancing_performance module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: '241ca59d6decbeb027fb17a13a89b364c626141bbb18fabda594a832e7514e2d',
      module: '4aa00c361d5731aa5a6ac583a0179208b2f90f990a53214ab53068e301f9ec16'
    },
    assets: [
      { url: 'models/json/suzanne_buffergeometry.json', sha256: '8aa6f692a08b2ec0991b7903914cfa3154e2f553a4ca72ca3fb5d7e6c16f839f', mime: 'application/octet-stream' }
    ]
  },
  webgl_instancing_scatter: {
    id: 'three-instancing-scatter',
    directory: 'three-instancing-scatter',
    name: 'Instancing Scatter — three.js r186',
    description: 'Unmodified official webgl_instancing_scatter module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🌸',
    expected: {
      html: '9cf99f7c5a7bc480daffbc80ddfaa86dea3db0b48c25f4761a639f1b4e863cf1',
      module: 'd2323dfb47a39a911563bddf159279c9b1318fe27e11691187c8246797ac3e82'
    },
    assets: [{
      url: 'models/gltf/Flower/Flower.glb',
      output: 'Flower.glb',
      mime: 'model/gltf-binary',
      sha256: 'ae6dccf9c7af26ccbd5fdddac9e7209239e67663f4bba6a5aa0339abd19fc163',
      diagnostic: 'flower'
    }]
  },
  webgl_shadowmap_pointlight: {
    id: 'three-shadowmap-pointlight',
    directory: 'three-shadowmap-pointlight',
    name: 'Shadowmap Pointlight — three.js r186',
    description: 'Unmodified official webgl_shadowmap_pointlight module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: '1ee42f8769e1cbc26c34bd9ee478ebf93df2df3969a455ca624b9be0f3097f95',
      module: '31eba24e5b1cad0713afeab9d51c538188760b4b6dfc2f7e5d60a117bf6d45ff'
    },
    assets: []
  },
  webgl_loader_xyz: {
    id: 'three-loader-xyz',
    directory: 'three-loader-xyz',
    name: 'Loader Xyz — three.js r186',
    description: 'Unmodified official webgl_loader_xyz module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: '1f6893f73bfc106d64df9758d9b61a54cc092318b0ca830f11f79286b938755e',
      module: '25864f2a972ad99765e0c97b6d3a7259b8effcc23587cf46cbd074291ec4e14b'
    },
    assets: [
          {
                "url": "models/xyz/helix_201.xyz",
                "mime": "application/octet-stream",
                "output": "helix_201.xyz",
                "sha256": "489c27c4b619c9a47c15df62ebb7a5474791a7ae85f0c9c3f8323a9504288519"
          }
    ]
  },
  webgl_geometry_convex: {
    id: 'three-geometry-convex',
    directory: 'three-geometry-convex',
    name: 'Geometry Convex — three.js r186',
    description: 'Unmodified official webgl_geometry_convex module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: 'f0793807bde99bb16fa436f316846b0b462c0cb1ad6b7c0b15d577806eafcd28',
      module: 'f96da8f9025bbde0d4c1ffe8e6d1f3b5880b09aa943c2b6760f270c3df3ad8cb'
    },
    assets: [
          {
                "url": "textures/sprites/disc.png",
                "mime": "image/png",
                "output": "disc.png",
                "sha256": "1f3816715f028ac32065a10f40f5ef218b4efc67eb46f0d908a8d503f25b69cb"
          }
    ]
  },
  webgl_materials_texture_filters: {
    id: 'three-materials-texture-filters',
    directory: 'three-materials-texture-filters',
    name: 'Materials Texture Filters — three.js r186',
    description: 'Unmodified official webgl_materials_texture_filters module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: 'd6ce875f22df04b91e87151119fc6e8553522e8db3f321dd00850fa1ed3fcd06',
      module: '761da5a03bc502d2737ac6081406a8694e6bd8df9fedd14a02d8744b8176ea14'
    },
    assets: [
          {
                "url": "textures/758px-Canestra_di_frutta_(Caravaggio).jpg",
                "mime": "image/jpeg",
                "output": "758px-Canestra_di_frutta_(Caravaggio).jpg",
                "sha256": "3f9a556c4e12583981427e2d6b7fa268c1a46c9036a23514acd9e179c22ae37f"
          }
    ]
  },
  webgl_materials_cubemap_refraction: {
    id: 'three-materials-cubemap-refraction',
    directory: 'three-materials-cubemap-refraction',
    name: 'Materials Cubemap Refraction — three.js r186',
    description: 'Unmodified official webgl_materials_cubemap_refraction module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: 'db2a94274dc1b4092856947bd65910dbcdcf044f2442eb69d28db901f7afeb10',
      module: '7c9a1e3b6319307f4b87b415565b71b93e0d978a2e87bb28168de8b05146b213'
    },
    assets: [
          {
                "url": "models/ply/binary/Lucy100k.ply",
                "mime": "application/octet-stream",
                "output": "Lucy100k.ply",
                "sha256": "837f769e67155dc4a6e9a90683a61d6f6b4571a2a97d79586831011f450e66e2"
          }
,
      { rawRgba: true, url: 'textures/cube/Park3Med/px.jpg', sha256: '271ef2f791ff6b6f7e5ab45347279ac7195d5f8dab38eb08880036e4bac7d157', mime: 'image/jpeg' },
      { rawRgba: true, url: 'textures/cube/Park3Med/nx.jpg', sha256: '6e27cd535b8ce0400dfec87298f1d7b009aeca54a69b38c8b00834c9d52ce438', mime: 'image/jpeg' },
      { rawRgba: true, url: 'textures/cube/Park3Med/py.jpg', sha256: '27588b1f84b2b7075c56681b2b4893b01ff6c81ab50638884fa9ca8e40266af1', mime: 'image/jpeg' },
      { rawRgba: true, url: 'textures/cube/Park3Med/ny.jpg', sha256: '9c58ffbc9a0a71a61f6b71c002f9367abf3a77e01bea8c6ba7e008c01695ab90', mime: 'image/jpeg' },
      { rawRgba: true, url: 'textures/cube/Park3Med/pz.jpg', sha256: 'f97d0a20187c419622949a4bdb2afb652742bedb6924b9771d00e01d9fd428c7', mime: 'image/jpeg' },
      { rawRgba: true, url: 'textures/cube/Park3Med/nz.jpg', sha256: 'ee32866c05c8221121856b5027d52d1ce0dbcd57185c2295135a5bab656d7503', mime: 'image/jpeg' }
    ]
  },
  webgl_geometry_cube: {
    id: 'three-geometry-cube',
    directory: 'three-geometry-cube',
    name: 'Geometry Cube — three.js r186',
    description: 'Unmodified official webgl_geometry_cube module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: '022a3727ba58f70020ab9a48ac27d510e4881426f75db6d5838f044e1ed18430',
      module: '22beb8e4fc189e649cc7fd9e84e8b71ed35ad85859cfba99c0811867fcc4b742'
    },
    assets: [
          {
                "url": "textures/crate.gif",
                "mime": "image/gif",
                "convertToPng": true,
                "output": "crate.gif",
                "sha256": "a890f0a89eadc083cb39bfbe597c1395d7acf47a19f673b5643d4a9c174ea52f"
          }
    ]
  },
  webgl_materials_texture_anisotropy: {
    id: 'three-materials-texture-anisotropy',
    directory: 'three-materials-texture-anisotropy',
    name: 'Materials Texture Anisotropy — three.js r186',
    description: 'Unmodified official webgl_materials_texture_anisotropy module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: 'f139a7724d0bd0bd38754e6c7dadf248c616c330590f85b20c001a95a950fe00',
      module: 'a22c049a0c3948355984549df2dd9163b7a5e326b9f13b250f39dfda0fd34845'
    },
    assets: [
          {
                "url": "textures/crate.gif",
                "mime": "image/gif",
                "convertToPng": true,
                "output": "crate.gif",
                "sha256": "a890f0a89eadc083cb39bfbe597c1395d7acf47a19f673b5643d4a9c174ea52f"
          }
    ]
  },
  webgl_geometries: {
    id: 'three-geometries',
    directory: 'three-geometries',
    name: 'Geometries — three.js r186',
    description: 'Unmodified official webgl_geometries module on the JSR THREE R1/WebGL2 runtime.',
    icon: '📐',
    expected: {
      html: '5f6d3a380d650a9c0a50d9603c34be4506a6e96fa1396f47a745f16462622b73',
      module: 'b5f19392d16881d8fd99cf2aa2eb77d4af1d6bb647fca3627f80a8b77c23a4e7'
    },
    assets: [{
      url: 'textures/uv_grid_opengl.jpg',
      output: 'uv_grid_opengl.jpg',
      mime: 'image/jpeg',
      sha256: '909d9a1eb2a5d5de9d221a5e8de4e9119d409decddf522d48896bd51523d354d',
      diagnostic: 'uvGrid'
    }]
  },
  webgl_geometry_terrain: {
    id: 'three-geometry-terrain',
    directory: 'three-geometry-terrain',
    name: 'Geometry Terrain — three.js r186',
    description: 'Unmodified official webgl_geometry_terrain module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🏔️',
    expected: {
      html: '3ae22ea15f1cb7042872ad07fadd9d691558165edea6cd1f8a692ff6f79b6b8f',
      module: '7c6483a6e13466e38d628bae4f4f3235a3597dd411acb911ab94eecd5f752afa'
    },
    assets: []
  },
  webgl_lines_dashed: {
    id: 'three-lines-dashed',
    directory: 'three-lines-dashed',
    name: 'Lines Dashed — three.js r186',
    description: 'Unmodified official webgl_lines_dashed module on the JSR THREE R1/WebGL2 runtime.',
    icon: '┄',
    expected: {
      html: '64c55fb32f8ac09c81a449c9e2ce28b2ac0f88283ad28300ed2a14eb7b0d20f9',
      module: '36ea6710efc0104d91e5955e9ce0663795bad02ac23948707b279c6c43894d46'
    },
    assets: []
  },
  webgl_lines_fat: {
    id: 'three-lines-fat',
    directory: 'three-lines-fat',
    name: 'Lines Fat — three.js r186',
    description: 'Unmodified official webgl_lines_fat module on the JSR THREE R1/WebGL2 runtime.',
    icon: '➖',
    expected: {
      html: '140575a54f15465c7c883c223270fef2d261e2390421f0dc1c0d9b973148f9fc',
      module: '2b6d385c4c9a424e38dfd4f45a83021ec2ec9d8392cb41b2cb54f476c988c508'
    },
    assets: []
  },
  webgl_lod: {
    id: 'three-lod',
    directory: 'three-lod',
    name: 'Lod — three.js r186',
    description: 'Unmodified official webgl_lod module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🔭',
    expected: {
      html: 'c00873378be832a6742e120ccdc785abfdd542996094d0a0934af9470855e1c3',
      module: '46e4f39545a573d9239eb79fdace50bf5f29960abd55a858290ed2b175488af8'
    },
    assets: []
  },
  webgl_morphtargets_sphere: {
    id: 'three-morphtargets-sphere',
    directory: 'three-morphtargets-sphere',
    name: 'Morphtargets Sphere — three.js r186',
    description: 'Unmodified official webgl_morphtargets_sphere module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🫧',
    expected: {
      html: 'a55e9abd43d38d768a4e2794597c8d18942baed688ce6d67fc9ed596cfd876e6',
      module: 'ffa7ef69413efb516d8d6413f7b19f7e1b6e9eeb443871938d5549f755c6d520'
    },
    assets: [
          {
                "url": "models/gltf/AnimatedMorphSphere/glTF/AnimatedMorphSphere.bin",
                "mime": "application/octet-stream",
                "output": "AnimatedMorphSphere.bin",
                "sha256": "ce13772de449d2c577cc960bc5f74a7c572e886c15046c73eb028023f9c7d167"
          },
          {
                "url": "models/gltf/AnimatedMorphSphere/glTF/AnimatedMorphSphere.gltf",
                "mime": "application/json",
                "output": "AnimatedMorphSphere.gltf",
                "sha256": "3513fe07ad24f9a8bbb47a961d2d7474b5ff22dbbf87f9273e5982562ced2aee"
          }
    ]
  },
  webgl_points_waves: {
    id: 'three-points-waves',
    directory: 'three-points-waves',
    name: 'Points Waves — three.js r186',
    description: 'Unmodified official webgl_points_waves module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🌊',
    expected: {
      html: '7ec4a045d0f2034e593b10a9449b916e02e44f6996391c8496c8bfe60452e7f5',
      module: '31052219a160f0ad9d458bdf7bcc1d3e16c244a519de41cca919422dbccbdaa5'
    },
    assets: []
  },
  webgl_shader: {
    id: 'three-shader',
    directory: 'three-shader',
    name: 'Shader — three.js r186',
    description: 'Unmodified official webgl_shader module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🎛️',
    expected: {
      html: '18ee0c55d395c7707dbe8f66112b2cfa1d774bfa107f2f7eddfb23c755346b56',
      module: '0b84ce04999ae9182c63d92b5eccbf6d944dfb5d3e5467c865b97151b422112a'
    },
    assets: []
  },
  webgl_materials_blending: {
    id: 'three-materials-blending',
    directory: 'three-materials-blending',
    name: 'Materials Blending — three.js r186',
    description: 'Unmodified official webgl_materials_blending module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🌗',
    expected: {
      html: '1cea23c77de561d18886dfe3612b7907276c9f46d08a2286b971bde5c6739df6',
      module: '6de20b371724a85fa60a3324d842088867ccdb85ea9f3ee706c0ca2bbd8d81b1'
    },
    assets: [
      { url: 'textures/uv_grid_opengl.jpg', output: 'uv_grid_opengl.jpg', mime: 'image/jpeg', sha256: '909d9a1eb2a5d5de9d221a5e8de4e9119d409decddf522d48896bd51523d354d' },
      { url: 'textures/sprite0.jpg', output: 'sprite0.jpg', mime: 'image/jpeg', sha256: '1dad128859c53e70eb0fe6e0291192787a5f1c08613b5e44b52e89fcf29750cb' },
      { url: 'textures/sprite0.png', output: 'sprite0.png', mime: 'image/png', sha256: '79592d002649e69628ed7ea9dc79ab911c43dded78c716362742e225acec32fb' },
      { url: 'textures/lensflare/lensflare0.png', output: 'lensflare0.png', mime: 'image/png', sha256: '5266c28e6597607f5646801469a7a08f98b4eddd358cef1824745698671802b8' },
      { url: 'textures/lensflare/lensflare0_alpha.png', output: 'lensflare0_alpha.png', mime: 'image/png', sha256: '5f632ba4d17b6645b665c06eba4e57eaee39099009e9322ed58269ad88fc0365' }
    ],
    // R1 blends straight alpha only. Keep every official blending mode but
    // degrade the premultipliedAlpha toggle instead of rejecting all 50 draws.
    facadeWraps: {
      MeshBasicMaterial: `Base => {
        let warned = false;
        return class extends Base {
          get premultipliedAlpha() { return false; }
          set premultipliedAlpha(value) {
            if (value && !warned) {
              warned = true;
              console.warn('three-materials-blending: R1 uses straight alpha; premultipliedAlpha dropped.');
            }
          }
        };
      }`
    }
  },
  webgl_multiple_scenes_comparison: {
    id: 'three-multiple-scenes-comparison',
    directory: 'three-multiple-scenes-comparison',
    name: 'Multiple Scenes Comparison — three.js r186',
    description: 'Unmodified official webgl_multiple_scenes_comparison module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🆚',
    expected: {
      html: '784961d69233c8625fac9180a9db1601235eb4d0bc797151d756fe4385a6d996',
      module: '4559ae18461bbc09a2be59781a2180f575facf5912285b180314282a2165fafd'
    },
    assets: []
  },
  webgl_camera_array: {
    id: 'three-camera-array',
    directory: 'three-camera-array',
    name: 'Camera Array — three.js r186',
    description: 'Unmodified official webgl_camera_array module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🎥',
    expected: {
      html: '481047a13ecb55c4ce578d881d256998167aa143a713322c78e4d631dd02a780',
      module: '6f772f893b75961e18795e487530c40cea7086997e14ab129cd7e74779c88646'
    },
    assets: []
  },
  webgl_rtt: {
    id: 'three-rtt',
    directory: 'three-rtt',
    name: 'Rtt — three.js r186',
    description: 'Unmodified official webgl_rtt module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🖼️',
    expected: {
      html: '6af4821d7f1aa384ba720f0574575d92943889274a7b32bfac8a80201802c095',
      module: 'a1abf723003fc8d1a39f04903f02a4781a5e6ecbe7bdf560c8b37ee4f0d3858f'
    },
    assets: []
  },
  webgl_animation_multiple: {
    id: 'three-animation-multiple',
    directory: 'three-animation-multiple',
    name: 'Animation Multiple — three.js r186',
    description: 'Unmodified official webgl_animation_multiple module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: '8d308334a3bd37b470c0b13ce192a206ef5a3922f928ad7f0f91bf3812106b91',
      module: 'a48c8bc917a29b6483bc0fe176e8cf1ca3d928c6a5023a8dbf4364d1cb11e229'
    },
    assets: [
          {
                "url": "models/gltf/Soldier.glb",
                "mime": "model/gltf-binary",
                "output": "Soldier.glb",
                "sha256": "dfb230fc1f942f259dd00281a1186953ad602fc5d69067ce63e24b2aa439736b"
          }
    ]
  },
  webgl_animation_skinning_blending: {
    id: 'three-animation-skinning-blending',
    directory: 'three-animation-skinning-blending',
    name: 'Animation Skinning Blending — three.js r186',
    description: 'Unmodified official webgl_animation_skinning_blending module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: '7dddf931d4a6e5c73a369610e4e34b39a6a333a4d56ff65561ecdbf429747397',
      module: '104f456ba02bc1021467513826432d9ee4d5df8e0f0e9746e15b2dc42fa5fc29'
    },
    assets: [
          {
                "url": "models/gltf/Soldier.glb",
                "mime": "model/gltf-binary",
                "output": "Soldier.glb",
                "sha256": "dfb230fc1f942f259dd00281a1186953ad602fc5d69067ce63e24b2aa439736b"
          }
    ]
  },
  webgl_animation_skinning_morph: {
    id: 'three-animation-skinning-morph',
    directory: 'three-animation-skinning-morph',
    name: 'Animation Skinning Morph — three.js r186',
    description: 'Unmodified official webgl_animation_skinning_morph module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: 'f91f205125aba93ca5c248415c96f68366a410e68a41b0aa601e8cb89de46e1a',
      module: '0728246d2bfaa4b1e066d6440f8ed79a177ce845106269f76ca7b7b6e2f105b2'
    },
    assets: [
          {
                "url": "models/gltf/RobotExpressive/RobotExpressive.glb",
                "mime": "model/gltf-binary",
                "output": "RobotExpressive.glb",
                "sha256": "047f5e5fb3bb6d378bd1df16ca6137f2a596c99b3a1b5690b4020c05aaf6f319"
          }
    ]
  },
  webgl_buffergeometry_attributes_none: {
    id: 'three-buffergeometry-attributes-none',
    directory: 'three-buffergeometry-attributes-none',
    name: 'Buffergeometry Attributes None — three.js r186',
    description: 'Unmodified official webgl_buffergeometry_attributes_none module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: 'd5d13458ca905ce2c50170b9c34b0808571cb9a9e324da4f98c965f8600f15fb',
      module: '771b113e33c7f9a539a2e0f32edd92c17a67b620f76c809883992f565934865e'
    },
    assets: []
  },
  webgl_buffergeometry_drawrange: {
    id: 'three-buffergeometry-drawrange',
    directory: 'three-buffergeometry-drawrange',
    name: 'Buffergeometry Drawrange — three.js r186',
    description: 'Unmodified official webgl_buffergeometry_drawrange module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: '943ded3f7eab696cdb76af7b2b44c7560e010b8f8f836ad450035aeb56375efe',
      module: 'ea2f86d99891f21e4def927343c88916cd8986cf724fef9529592d6af964b394'
    },
    assets: []
  },
  webgl_geometry_colors_lookuptable: {
    id: 'three-geometry-colors-lookuptable',
    directory: 'three-geometry-colors-lookuptable',
    name: 'Geometry Colors Lookuptable — three.js r186',
    description: 'Unmodified official webgl_geometry_colors_lookuptable module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: '4ca93c7951d82af5015a0a7427a5ebfc72fdefa2e0d348ca93768525b97f292e',
      module: '39bb97507b887eaf054e1b1763e1e1bf30f0299e7b9a6b67b024c3467c1895c4'
    },
    assets: [
          {
                "url": "models/json/pressure.json",
                "mime": "application/json",
                "output": "pressure.json",
                "sha256": "07f6e031d4268c2c86c54622b276526843cd6c5f110365cd56a3662bb3aad096"
          }
    ]
  },
  webgl_geometry_text: {
    id: 'three-geometry-text',
    directory: 'three-geometry-text',
    name: 'Geometry Text — three.js r186',
    description: 'Unmodified official webgl_geometry_text module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: 'de2ab6c9f3a9a3b745e41c60ea41d642bd8ec26c42f0aa54ba324928a1805147',
      module: '4f81a9da8b0d5d81f0a2270f2d722f278debf1c92db380c29002af32b8942c55'
    },
    assets: [
      { url: 'fonts/helvetiker_regular.typeface.json', sha256: 'd5c5467690f74061179a292af83bd85c4c551e0f106b2af99714f11184c96981', output: 'helvetiker_regular.typeface.json', mime: 'application/json' },
      { url: 'fonts/helvetiker_bold.typeface.json', sha256: 'bd68159ee0b8d10fe24b9daa2e32f19686f9d8269a79dc8d44203a66298bfa2f', output: 'helvetiker_bold.typeface.json', mime: 'application/json' },
      { url: 'fonts/optimer_regular.typeface.json', sha256: '17e5e14d94d66e0e60eed3bfde403fcfa3e677f3c914e4cbed264c0c0ba95175', output: 'optimer_regular.typeface.json', mime: 'application/json' },
      { url: 'fonts/optimer_bold.typeface.json', sha256: 'd690a5f45706db0c15c39313cc36f8ce62ef154c6a21923809814a89f6df7c98', output: 'optimer_bold.typeface.json', mime: 'application/json' },
      { url: 'fonts/gentilis_regular.typeface.json', sha256: '7ed95f2faa30f59dbe7cfb145b97c42a6ba1188cd2eec01ca61485e8c83ee9de', output: 'gentilis_regular.typeface.json', mime: 'application/json' },
      { url: 'fonts/gentilis_bold.typeface.json', sha256: 'c028fd9c4017e34f1bf46694e4c23479cd22b812d0308f5dfc7446412c41d88c', output: 'gentilis_bold.typeface.json', mime: 'application/json' },
      { url: 'fonts/droid/droid_sans_regular.typeface.json', sha256: '8f0570e6cbb9b0230dc8a19b1942fd414191f0f3bfc76e3f413c2f9cfccd2eac', output: 'fonts_droid_droid_sans_regular.typeface.json', mime: 'application/json' },
      { url: 'fonts/droid/droid_sans_bold.typeface.json', sha256: 'ec40f077e0695e4ce9f74e9953034312eb6d1d5a9eb6c584b1eb0fd84077fb81', output: 'fonts_droid_droid_sans_bold.typeface.json', mime: 'application/json' },
      { url: 'fonts/droid/droid_serif_regular.typeface.json', sha256: '99ff855b8c18bcec3428745f576a75bfb0da5f63fe52c23f2484c2e655c2c64a', output: 'fonts_droid_droid_serif_regular.typeface.json', mime: 'application/json' },
      { url: 'fonts/droid/droid_serif_bold.typeface.json', sha256: 'e9a71de592e239acc3da3601cfbad53836931f498f409ab68535140f2045f29d', output: 'fonts_droid_droid_serif_bold.typeface.json', mime: 'application/json' }
    ]
  },
  webgl_instancing_dynamic: {
    id: 'three-instancing-dynamic',
    directory: 'three-instancing-dynamic',
    name: 'Instancing Dynamic — three.js r186',
    description: 'Unmodified official webgl_instancing_dynamic module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: '1bb7cdf50e4d63065ec00435aa3f912fbc6329ffdfa104118ca557cf91593d92',
      module: '76afd943244d13983dbda73ed46dd68022edd7ae3f9e3b02ef1b0ce47af5402b'
    },
    assets: [
          {
                "url": "textures/edge3.jpg",
                "mime": "image/jpeg",
                "output": "edge3.jpg",
                "sha256": "ca3f16b403df2dfcf9e6e5e1f302b2f8f563d0ce73fa588d9a598d9477cb8b2c"
          }
    ]
  },
  webgl_materials_channels: {
    id: 'three-materials-channels',
    directory: 'three-materials-channels',
    name: 'Materials Channels — three.js r186',
    description: 'Unmodified official webgl_materials_channels module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: 'ebbf6d23efd3e184e941f376768f3f497a219aed6184a35ad0bc6750353cfbaa',
      module: '2ada23382eef4290f9acf68e0aea9871a057cc018e7d43a7116650c64cc44974'
    },
    assets: [
          {
                "url": "models/obj/ninja/ao.jpg",
                "mime": "image/jpeg",
                "output": "ao.jpg",
                "sha256": "004c1b0c9829fd5c25d413fce2ff0224e5e62f17f8064af9e34d9c2887e6b41b"
          },
          {
                "url": "models/obj/ninja/displacement.jpg",
                "mime": "image/jpeg",
                "output": "displacement.jpg",
                "sha256": "5da43d969f6c178b1d2d819c5da523c66432a24f351d80afc88b1ada5f2c3f3b"
          },
          {
                "url": "models/obj/ninja/ninjaHead_Low.obj",
                "mime": "application/octet-stream",
                "output": "ninjaHead_Low.obj",
                "sha256": "07819eacecae77a8539fbaf673d9a0908ec2e6383d1b6cedd94544b2a2f2c53b"
          },
          {
                "url": "models/obj/ninja/normal.png",
                "mime": "image/png",
                "output": "normal.png",
                "sha256": "aa147cbb271787f793b437607b076fb170555f3f8dc3c392cc29910ca7a63d49"
          }
    ]
  },
  webgl_materials_wireframe: {
    id: 'three-materials-wireframe',
    directory: 'three-materials-wireframe',
    name: 'Materials Wireframe — three.js r186',
    description: 'Unmodified official webgl_materials_wireframe module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: 'dfa6aeb93154b75d965cfd3fa4d870f6db90a2bec1f3bda76fcb504cbe8f364b',
      module: '24e97a82389b5f41d1a0c6227dd1fd503a9107f8ba97cf51f891004f404e57d2'
    },
    assets: [
          {
                "url": "models/json/WaltHeadLo_buffergeometry.json",
                "mime": "application/json",
                "output": "WaltHeadLo_buffergeometry.json",
                "sha256": "7fbdd9db5849c7bef4db31e4d883f5ac722f3fdfeb617347825c4e0e659a3a35"
          }
    ],
    // R1 has real indexed wireframe draws. Use that lane for the official
    // barycentric ShaderMaterial head too; thickness remains GUI-compatible
    // through the retained uniforms object but is fixed at one pixel.
    facadeWraps: {
      ShaderMaterial: `Base => {
        let warned = false;
        return class extends __three.MeshBasicMaterial {
          constructor(params = {}) {
            super({ color: 0xe0e0ff, wireframe: true, side: params.side });
            this.uniforms = params.uniforms || {};
            this.alphaToCoverage = !!params.alphaToCoverage;
            if (!warned) {
              warned = true;
              console.warn('three-materials-wireframe: R1 uses one-pixel MeshBasicMaterial wireframe for the shader head.');
            }
          }
        };
      }`
    }
  },
  webgl_modifier_edgesplit: {
    id: 'three-modifier-edgesplit',
    directory: 'three-modifier-edgesplit',
    name: 'Modifier Edgesplit — three.js r186',
    description: 'Unmodified official webgl_modifier_edgesplit module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: 'dbb115e40909c4844f4639f2b9f411b748487cbc7aa8300908eb9cfc56a6c2ea',
      module: '2536872df6ad45c5e1bf3de35f45c67085f14be141613eb6ea74170aa0510017'
    },
    assets: [
      { url: 'models/obj/cerberus/Cerberus.obj', sha256: '0ffac38139fe00145683774bf33d2fb245e2770a68bb71c552812ab9d12ee534', mime: 'application/octet-stream' },
      { rawRgba: true, url: 'models/obj/cerberus/Cerberus_A.jpg', sha256: 'e29e1d326560c635bf2407ba3bf506d632ae603d212082f74ada55c4f22423b6', mime: 'image/jpeg' }
    ]
  },
  webgl_modifier_simplifier: {
    id: 'three-modifier-simplifier',
    directory: 'three-modifier-simplifier',
    name: 'Modifier Simplifier — three.js r186',
    description: 'Unmodified official webgl_modifier_simplifier module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: '6ba92c0619730cd31adf350e0a584c08873e8e668b4dfbc17cc2d567de88bb83',
      module: 'd01fffeaf99f17d6a11705dfa30f5c9a8c2405bfb814d129d35c9c4d87a7c9e8'
    },
    addonShims: {
      'three/addons/modifiers/SimplifyModifier.js': [
        '// Bounded deterministic CPU reduction: the bundled meshopt WASM never',
        '// resolves under QuickJS. Samples complete source triangles with their',
        '// original attributes; reduced quality is explicit, never silent.',
        'export class SimplifyModifier {',
        '  modify(geometry, verticesToRemove = 0) {',
        "    console.warn('three: SimplifyModifier uses deterministic triangle sampling (meshopt unavailable)');",
        '    const index = geometry.getIndex();',
        '    const source = index ? Array.from(index.array) : null;',
        '    const triangleCount = source ? source.length / 3 : geometry.getAttribute(\'position\').count / 3;',
        '    const target = Math.max(1, triangleCount - Math.max(0, verticesToRemove));',
        '    const step = triangleCount / target;',
        '    const indices = [];',
        '    for (let i = 0; i < target; i++) {',
        '      const triangle = Math.min(triangleCount - 1, Math.floor(i * step));',
        '      for (let corner = 0; corner < 3; corner++) {',
        '        indices.push(source ? source[triangle * 3 + corner] : triangle * 3 + corner);',
        '      }',
        '    }',
        '    const result = geometry.clone();',
        '    result.setIndex(indices);',
        '    return result;',
        '  }',
        '}'
      ].join('\n')
    },
    assets: [
          {
                "url": "models/gltf/LeePerrySmith/LeePerrySmith.glb",
                "mime": "model/gltf-binary",
                "output": "LeePerrySmith.glb",
                "sha256": "402b8a8ac9f03232e6d64b5962929703a069daf99d3c49ac8eb0e48bedc9c576"
          }
    ]
  },
  webgl_modifier_subdivision: {
    id: 'three-modifier-subdivision',
    directory: 'three-modifier-subdivision',
    name: 'Modifier Subdivision — three.js r186',
    description: 'Unmodified official webgl_modifier_subdivision module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: 'b1031a5d9a62176dcace1dc7bcf19ff4a0cf425fe1b1698e07765aca7980ddda',
      module: 'd53ea50c9309ba933c0c017e16109fe1d3324b1677954aa474f4654e3f0015fa'
    },
    assets: []
  },
  webgl_modifier_tessellation: {
    id: 'three-modifier-tessellation',
    directory: 'three-modifier-tessellation',
    name: 'Modifier Tessellation — three.js r186',
    description: 'Unmodified official webgl_modifier_tessellation module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: '559d7576c65db4110128b3e6f40dfbbcba2fb9ac610385ef55994ad32e1bb3ed',
      module: '8c23fbc9a8705fb1291b18666b3bdac280c6fcc5a03a2cb3110b4f3fdff2ae9f'
    },
    assets: [
          {
                "url": "fonts/helvetiker_bold.typeface.json",
                "mime": "application/json",
                "output": "helvetiker_bold.typeface.json",
                "sha256": "bd68159ee0b8d10fe24b9daa2e32f19686f9d8269a79dc8d44203a66298bfa2f"
          }
    ]
  },
  webgl_morphtargets: {
    id: 'three-morphtargets',
    directory: 'three-morphtargets',
    name: 'Morphtargets — three.js r186',
    description: 'Unmodified official webgl_morphtargets module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: '2a5cbfd0de2950224c2ce792d09b87536e0b606031112e552db81d4a2157a006',
      module: '9a04b9d580f4cc14c9994d5e692501ef83fe79954834280f357ac3b9ca58e7ce'
    },
    assets: []
  },
  webgl_panorama_cube: {
    id: 'three-panorama-cube',
    directory: 'three-panorama-cube',
    name: 'Panorama Cube — three.js r186',
    description: 'Unmodified official webgl_panorama_cube module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: '51e6540b54d9ba41d9c0b5e2f0fcfcd0c6eb2c660aaa0fdb544f43b26f0ed03a',
      module: '26076676a11238630cb566ca37261d4ce0992fa41e7b7aa43294cce0ae688ad5'
    },
    assets: [
          {
                "url": "textures/cube/sun_temple_stripe.jpg",
                "mime": "image/jpeg",
                "output": "sun_temple_stripe.jpg",
                "sha256": "4aadca4e81b71bae67ab1229e403dc755e33c4fbc498ce4c8d868e3d2a5a0200"
          }
    ]
  },
  webgl_points_sprites: {
    id: 'three-points-sprites',
    directory: 'three-points-sprites',
    name: 'Points Sprites — three.js r186',
    description: 'Unmodified official webgl_points_sprites module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: '5b3ebd2e90db97b173fbd86e831aa5dd533e53cd7e86f8cb0ea971597e28a5de',
      module: '3e28371564fba9f2fd65234a6a5ff00b57032e1737b56ad763adebc6b654ca7b'
    },
    assets: [
          {
                "url": "textures/sprites/snowflake1.png",
                "mime": "image/png",
                "rawRgba": true,
                "output": "snowflake1.png",
                "sha256": "7b0c12c16b37b0d03e73009da109e97cdfdd1f40f047fd025c80954a8422d220"
          },
          {
                "url": "textures/sprites/snowflake2.png",
                "mime": "image/png",
                "rawRgba": true,
                "output": "snowflake2.png",
                "sha256": "0396d0c5f997fc830cecd62d6e554611e7ee747906413d19cfc94e4e2900161e"
          },
          {
                "url": "textures/sprites/snowflake3.png",
                "mime": "image/png",
                "rawRgba": true,
                "output": "snowflake3.png",
                "sha256": "57d673741e314cbb727a9eebf545397a8fac6dc8156bf9489adcf3fa1a877065"
          },
          {
                "url": "textures/sprites/snowflake4.png",
                "mime": "image/png",
                "rawRgba": true,
                "output": "snowflake4.png",
                "sha256": "4f0b530617e0dae36ff8ca955d0567327001df407875668a1b6822e99913dd8f"
          },
          {
                "url": "textures/sprites/snowflake5.png",
                "mime": "image/png",
                "rawRgba": true,
                "output": "snowflake5.png",
                "sha256": "af708f228db2fce1dcc1c85bf80e83c077821ecf20db6fa8cd655a8929ad1ec6"
          }
    ]
  },
  webgl_shadowmap: {
    id: 'three-shadowmap',
    directory: 'three-shadowmap',
    name: 'Shadowmap — three.js r186',
    description: 'Unmodified official webgl_shadowmap module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: '2289caa0a22dfdb8bcdafd08397dbf6470ea737a767d12e67eeb8c129623a731',
      module: '0a99ed07e9f3006037c56d083391fa1e7f017defe347a95e8b646d24b36b1e86'
    },
    assets: [
          {
                "url": "fonts/helvetiker_bold.typeface.json",
                "mime": "application/json",
                "output": "helvetiker_bold.typeface.json",
                "sha256": "bd68159ee0b8d10fe24b9daa2e32f19686f9d8269a79dc8d44203a66298bfa2f"
          },
          {
                "url": "models/gltf/Flamingo.glb",
                "mime": "model/gltf-binary",
                "output": "Flamingo.glb",
                "sha256": "9eabeb58587e4e0d11d5e23b30a26b73e4b8e6e8c83f2c36b3c5c3fe04dcf19f"
          },
          {
                "url": "models/gltf/Horse.glb",
                "mime": "model/gltf-binary",
                "output": "Horse.glb",
                "sha256": "bebaa4a60ba373317e25bf20f049f26ad0f5c86d4731ab67d46eb8c93c920947"
          },
          {
                "url": "models/gltf/Parrot.glb",
                "mime": "model/gltf-binary",
                "output": "Parrot.glb",
                "sha256": "adcc5dae04d0b16957ce20b7bebb84d41c3bff1c01bf5ab1cf56d06345bc5170"
          },
          {
                "url": "models/gltf/Stork.glb",
                "mime": "model/gltf-binary",
                "output": "Stork.glb",
                "sha256": "60ca9355daaddeab33d93d6856d99c12b7ed086f989bf1a1ba288f7e96e1559b"
          }
    ]
  },
  webgl_shadowmap_performance: {
    id: 'three-shadowmap-performance',
    directory: 'three-shadowmap-performance',
    name: 'Shadowmap Performance — three.js r186',
    description: 'Unmodified official webgl_shadowmap_performance module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: 'd630dd50d8b46de46d1166bf0211042d331d8adb21b82aa90ba2e8fefe5863a0',
      module: 'b35dc030c904cebe6943dda387016cb71aeb5e665f1ffb564211645459274530'
    },
    assets: [
          {
                "url": "fonts/helvetiker_bold.typeface.json",
                "mime": "application/json",
                "output": "helvetiker_bold.typeface.json",
                "sha256": "bd68159ee0b8d10fe24b9daa2e32f19686f9d8269a79dc8d44203a66298bfa2f"
          },
          {
                "url": "models/gltf/Horse.glb",
                "mime": "model/gltf-binary",
                "output": "Horse.glb",
                "sha256": "bebaa4a60ba373317e25bf20f049f26ad0f5c86d4731ab67d46eb8c93c920947"
          }
    ]
  },
  webgl_multiple_views: {
    id: 'three-multiple-views',
    directory: 'three-multiple-views',
    name: 'Multiple Views — three.js r186',
    description: 'Unmodified official webgl_multiple_views module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: '8a4de78b3dca79d6dbb1075c573da54399547fed18fb6f950c1f3aad0a373142',
      module: 'fae9a779cd796f1e7a80f24212f1d5a8dfb29d6a1596d30f7cb81e9e85947f44'
    },
    assets: []
  },
  webgl_loader_obj: {
    id: 'three-loader-obj',
    directory: 'three-loader-obj',
    name: 'Loader Obj — three.js r186',
    description: 'Unmodified official webgl_loader_obj module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: '76118733c2a7e048e3380801b8a6a4e86fce09cb61c4942ddcf9001b6f5572a7',
      module: 'd60e281870d37383cd68dcd8967d6e98bd71078bf390930583df3eb14333808e'
    },
    assets: [
          {
                "url": "models/obj/male02/male02.mtl",
                "mime": "application/octet-stream",
                "output": "male02.mtl",
                "sha256": "a1d2f6df681197208221b74e6c32d74207a38fb84119ed55452998ed24b0e8ce"
          },
          {
                "url": "models/obj/male02/male02.obj",
                "mime": "application/octet-stream",
                "output": "male02.obj",
                "sha256": "6e521dceb9cf5b0d9b375c607364f23c7a9db7d56a135f2a74c2da698b7671b3"
          },
          {
                "url": "models/obj/male02/01_-_Default1noCulling.JPG",
                "mime": "image/jpeg",
                "output": "01_-_Default1noCulling.JPG",
                "sha256": "3259a89133a08c2063a565b3eaaa442ba9b9521117ffdddc88d4ae7079b05803"
          },
          {
                "url": "models/obj/male02/male-02-1noCulling.JPG",
                "mime": "image/jpeg",
                "output": "male-02-1noCulling.JPG",
                "sha256": "672bbeb356bbe8a1e30790412573e6794fd2adf69ebc38bbdf090ab811141ab3"
          }
    ]
  },
  webgl_loader_pcd: {
    id: 'three-loader-pcd',
    directory: 'three-loader-pcd',
    name: 'Loader Pcd — three.js r186',
    description: 'Unmodified official webgl_loader_pcd module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: '4189452a6878da428b231a975fda7d58eabdda08125397e5112a9ca40bbd14c6',
      module: '2971b68a9a30dd36b07b6a6b905a9df7a15352c168a63632be6ca2c5cde51daa'
    },
    assets: [
      { url: 'models/pcd/binary/Zaghetto.pcd', sha256: '0efcd6f363c852571e00cfca44fbd2e760df31b9bccb754d2dc27ba225d998ab', mime: 'application/octet-stream' }
    ]
  },
  webgl_materials_cubemap: {
    id: 'three-materials-cubemap',
    directory: 'three-materials-cubemap',
    name: 'Materials Cubemap — three.js r186',
    description: 'Unmodified official webgl_materials_cubemap module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: '0553a5bf7b884d89586724825380b5a890986600eafe0836cec3504c3100ef77',
      module: '97eb1b8c9501140eaa69f2362172bcba48ce61517906f214c794d60dba6f3343'
    },
    assets: [
      { url: 'models/obj/walt/WaltHead.obj', sha256: 'b8276ca88369af967a2329792c9c3df202ce8c02612790ff3842eba3d0dd44b5', mime: 'application/octet-stream' },
      { rawRgba: true, url: 'textures/cube/SwedishRoyalCastle/px.jpg', sha256: '10a786132bc7eef6b142bd0d4b00ea94ffc1a1bfccfb1a6ec0baedf966d80734', mime: 'image/jpeg' },
      { rawRgba: true, url: 'textures/cube/SwedishRoyalCastle/nx.jpg', sha256: '53a8d90cea6bab188d462c44676b84e5993424e465785c93829d810bbf7c5076', mime: 'image/jpeg' },
      { rawRgba: true, url: 'textures/cube/SwedishRoyalCastle/py.jpg', sha256: '8b88f7f9af85fa5b442f28fb27532e534a197aba68ae60548bf4b3750f0d50f0', mime: 'image/jpeg' },
      { rawRgba: true, url: 'textures/cube/SwedishRoyalCastle/ny.jpg', sha256: '17953cc33b9fec703c286266d4aca6033d758edd17ba0384fb3ebd7630085fd4', mime: 'image/jpeg' },
      { rawRgba: true, url: 'textures/cube/SwedishRoyalCastle/pz.jpg', sha256: 'cc9252ba994a79c320ac4aed03aac9000f810c1358179e70a69b598d56e129db', mime: 'image/jpeg' },
      { rawRgba: true, url: 'textures/cube/SwedishRoyalCastle/nz.jpg', sha256: '10149242ae21ba4c00663a0673f01a6722da63f201511fdc01941930d800ccff', mime: 'image/jpeg' }
    ]
  },
  webgl_materials_envmaps: {
    id: 'three-materials-envmaps',
    directory: 'three-materials-envmaps',
    name: 'Materials Envmaps — three.js r186',
    description: 'Unmodified official webgl_materials_envmaps module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: '3b4e3e45ce13320ef29776ad1f1c41efd137e70842c9cc008922f60030c38dd4',
      module: '716b6ebdabf9cf409fa7fee0bb67b5a4b742e3a4cdd088fe94e22a85cf5c463b'
    },
    assets: [
          {
                "url": "textures/2294472375_24a3b8ef46_o.jpg",
                "mime": "image/jpeg",
                "output": "2294472375_24a3b8ef46_o.jpg",
                "sha256": "3efa22071f3f84ec26248ee58aa05aba635a0a9d810bca93da5a94f33e907524"
          },
      { rawRgba: true, url: 'textures/cube/Bridge2/posx.jpg', output: 'bridge2-posx.jpg', mime: 'image/jpeg', sha256: 'bfea380ae3b2f2b44d3040c9fe7a8f3e325450a12b7a0f29561b5ca175f1a250' },
      { rawRgba: true, url: 'textures/cube/Bridge2/negx.jpg', output: 'bridge2-negx.jpg', mime: 'image/jpeg', sha256: '047052e77f698a819903f1d2fe27b40ee56930150fc38913da7e1c58e8dcae70' },
      { rawRgba: true, url: 'textures/cube/Bridge2/posy.jpg', output: 'bridge2-posy.jpg', mime: 'image/jpeg', sha256: 'cc467777340037ee8f95460b19772a8ae6a71c125af1714bfd408db2c1c33d98' },
      { rawRgba: true, url: 'textures/cube/Bridge2/negy.jpg', output: 'bridge2-negy.jpg', mime: 'image/jpeg', sha256: '52b4b95125c777d48ac9ea568d79d55fd3fb62e24a7da37600720cdddb7ab333' },
      { rawRgba: true, url: 'textures/cube/Bridge2/posz.jpg', output: 'bridge2-posz.jpg', mime: 'image/jpeg', sha256: 'd56085e5da2e8f2cee13694519ed153995045f5a11b1d41d25be70380cf15548' },
      { rawRgba: true, url: 'textures/cube/Bridge2/negz.jpg', output: 'bridge2-negz.jpg', mime: 'image/jpeg', sha256: '1bc79f442f31931576d734565821b41b331a017dd86f2ac6a60ac6d3bbbbe6ba' }
    ]
  },
  webgl_materials_normalmap_object_space: {
    id: 'three-materials-normalmap-object-space',
    directory: 'three-materials-normalmap-object-space',
    name: 'Materials Normalmap Object Space — three.js r186',
    description: 'Unmodified official webgl_materials_normalmap_object_space module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: '45c84138ac446bb204a0ab7cac31ad67a55bb004a45874d6b980a7b73420c5ec',
      module: 'ce0124f67ac1f84f45498e6fa60865a481edaa9a1e9cbb5fa677701655a6e88c'
    },
    assets: [
          {
                "url": "models/gltf/Nefertiti/Nefertiti.glb",
                "mime": "model/gltf-binary",
                "externalizeImages": true,
                "output": "Nefertiti.glb",
                "sha256": "d8c00c742b59137695245eefeef0e217d6e33c64eeaeb1904ff39f6b31542639"
          }
    ]
  },
  webgl_materials_physical_clearcoat: {
    id: 'three-materials-physical-clearcoat',
    directory: 'three-materials-physical-clearcoat',
    name: 'Materials Physical Clearcoat — three.js r186',
    description: 'Unmodified official webgl_materials_physical_clearcoat module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: '5550788aa81e4ec3884f154c910a24b479d57dad0e0a0fd86909f820a46182a2',
      module: '06fe3c5a9a763570e573b0999af47cba0b1291c7a00de7cfb7b3225c78772bf6'
    },
    addonShims: {
      'three/addons/loaders/HDRCubeTextureLoader.js': "export { CubeTextureLoader as HDRCubeTextureLoader } from 'three';",
      'three/addons/textures/FlakesTexture.js': [
        'export class FlakesTexture {',
        '  constructor(width = 512, height = 512) {',
        "    const canvas = document.createElement('canvas');",
        '    canvas.width = width; canvas.height = height;',
        "    const context = canvas.getContext('2d');",
        '    const data = new Uint8ClampedArray(width * height * 4);',
        '    for (let i = 0; i < width * height; i++) {',
        '      data[i * 4] = 127; data[i * 4 + 1] = 127; data[i * 4 + 2] = 255; data[i * 4 + 3] = 255;',
        '    }',
        '    for (let i = 0; i < 4000; i++) {',
        '      const x = Math.floor(Math.random() * width), y = Math.floor(Math.random() * height);',
        '      const r = Math.random() * 3 + 3;',
        '      let nx = Math.random() * 2 - 1, ny = Math.random() * 2 - 1, nz = 1.5;',
        '      const l = Math.sqrt(nx * nx + ny * ny + nz * nz);',
        '      nx /= l; ny /= l; nz /= l;',
        '      const red = nx * 127 + 127, green = ny * 127 + 127, blue = nz * 255;',
        '      const size = Math.ceil(2 * r);',
        '      for (let py = 0; py < size; py++) {',
        '        for (let px = 0; px < size; px++) {',
        '          const tx = x + px, ty = y + py;',
        '          if (tx >= width || ty >= height) continue;',
        '          const to = (ty * width + tx) * 4;',
        '          data[to] = red; data[to + 1] = green; data[to + 2] = blue;',
        '        }',
        '      }',
        '    }',
        '    context.putImageData({ data, width, height }, 0, 0);',
        '    return canvas;',
        '  }',
        '}'
      ].join('\n')
    },
    assets: [
          {
                "url": "textures/carbon/Carbon.png",
                "mime": "image/png",
                "output": "Carbon.png",
                "sha256": "f5d4dd14c4b6f7548f50921e2bc75a77e2867fd93916928f60551f4857a96e06"
          },
          {
                "url": "textures/carbon/Carbon_Normal.png",
                "mime": "image/png",
                "output": "Carbon_Normal.png",
                "sha256": "15fe5cbeb3db8e85d8663ee1f67ffd5f0bfa457d01e1209c3011222ba08bb4fd"
          },
          {
                "url": "textures/golfball.jpg",
                "mime": "image/jpeg",
                "output": "golfball.jpg",
                "sha256": "7d5f075891eac89ee55620cd8753efe8a969d89cdd73b54fe0ee444ee5da0b15"
          },
          {
                "url": "textures/pbr/Scratched_gold/Scratched_gold_01_1K_Normal.png",
                "mime": "image/png",
                "output": "Scratched_gold_01_1K_Normal.png",
                "sha256": "f6cbad89a8d43188007532a2545f382e225e6def85778fc530681588fb9f6f9c"
          },
          {
                "url": "textures/water/Water_1_M_Normal.jpg",
                "mime": "image/jpeg",
                "output": "Water_1_M_Normal.jpg",
                "sha256": "6d7825469a374ff84700b4fb1a2890bd1fce0ca1f777bdd4d5ecdaf15833a804"
          }
,
      { hdrRgba: true, url: 'textures/cube/pisaHDR/px.hdr', sha256: '72f6b4f08e657dbf47483367a92ac1b299979fa96906591f6a5260229ef128db', mime: 'image/vnd.radiance' },
      { hdrRgba: true, url: 'textures/cube/pisaHDR/nx.hdr', sha256: '800985acb87cb45cd01ca959b2ee8199af3ebe2a4e3abfa104c064d16b4be6f8', mime: 'image/vnd.radiance' },
      { hdrRgba: true, url: 'textures/cube/pisaHDR/py.hdr', sha256: 'd4bfbe9f1f00d4405618c172155729b4f2051cc37b1aaf6162e06763121da73c', mime: 'image/vnd.radiance' },
      { hdrRgba: true, url: 'textures/cube/pisaHDR/ny.hdr', sha256: '76bac4fe6e6b148fdf37f9addbd90c25d3d4a8007598728c63fae3c35e987492', mime: 'image/vnd.radiance' },
      { hdrRgba: true, url: 'textures/cube/pisaHDR/pz.hdr', sha256: 'ab9495d3e6a9efc8741fe820834446c9b8d0e0fc9771d325683366fe12843f54', mime: 'image/vnd.radiance' },
      { hdrRgba: true, url: 'textures/cube/pisaHDR/nz.hdr', sha256: '9e10429a6dccfedf425c94e1b8be62150d40953b78c804b50b913c6f3bcafb78', mime: 'image/vnd.radiance' }
    ]
  },
  webgl_geometry_nurbs: {
    id: 'three-geometry-nurbs',
    directory: 'three-geometry-nurbs',
    name: 'Geometry Nurbs — three.js r186',
    description: 'Unmodified official webgl_geometry_nurbs module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: '941f3d5658ad7567b61c815e800ababfc133b6c4b90f37b3ef3619ab21a643ae',
      module: '61bc7531ba469d07300e9d335c38c596fa18032ae47a9ca0bd0ecf9eb939953c'
    },
    assets: [
          {
                "url": "textures/uv_grid_opengl.jpg",
                "mime": "image/jpeg",
                "output": "uv_grid_opengl.jpg",
                "sha256": "909d9a1eb2a5d5de9d221a5e8de4e9119d409decddf522d48896bd51523d354d"
          }
    ]
  },
  webgl_geometry_csg: {
    id: 'three-geometry-csg',
    directory: 'three-geometry-csg',
    name: 'Geometry Csg — three.js r186',
    description: 'Unmodified official webgl_geometry_csg module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: '19b9ddb7e5eab66fd40ee01367d90294e0652cb496ca1e4e8faea7be522233ba',
      module: 'fb725b30632b4f3d5bed7c31445f489498d4d4e7d36479abe8282c6b6ce77171'
    },
    assets: []
  },
  webgl_decals: {
    id: 'three-decals',
    directory: 'three-decals',
    name: 'Decals — three.js r186',
    description: 'Unmodified official webgl_decals module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: '56ed46841bc5230626ff89bd49afb441de4d820dfb520f9cbdd8361673429f5b',
      module: '5d126f33907f02d86d124790eb652b04a1aef7457266463afee6bd1059720c0c'
    },
    assets: [
          {
                "url": "models/gltf/LeePerrySmith/Infinite-Level_02_Tangent_SmoothUV.jpg",
                "mime": "image/jpeg",
                "output": "Infinite-Level_02_Tangent_SmoothUV.jpg",
                "sha256": "36925e51ad9b324b94e8faf4692da1b4132809f2762bb8d5bd549ffd215d4ca6"
          },
          {
                "url": "models/gltf/LeePerrySmith/LeePerrySmith.glb",
                "mime": "model/gltf-binary",
                "output": "LeePerrySmith.glb",
                "sha256": "402b8a8ac9f03232e6d64b5962929703a069daf99d3c49ac8eb0e48bedc9c576"
          },
          {
                "url": "models/gltf/LeePerrySmith/Map-COL.jpg",
                "mime": "image/jpeg",
                "output": "Map-COL.jpg",
                "sha256": "e976d73b31407f8d0967412bf468019ed26a5d5a32cf5811aabff7e816458a65"
          },
          {
                "url": "models/gltf/LeePerrySmith/Map-SPEC.jpg",
                "mime": "image/jpeg",
                "output": "Map-SPEC.jpg",
                "sha256": "cbb96b60e355b804d9b6c7338372d13ec8cc7adf664f50a00a3d32c66afd293a"
          },
          {
                "url": "textures/decal/decal-diffuse.png",
                "mime": "image/png",
                "output": "decal-diffuse.png",
                "sha256": "96ebc3fd5e6052271d39df713e02d1684194f4f5cf95d2fb3ed34bf09b428741"
          },
          {
                "url": "textures/decal/decal-normal.jpg",
                "mime": "image/jpeg",
                "output": "decal-normal.jpg",
                "sha256": "a619799e5e125570896100665e262645dfd6ed131269a2f488b633d491e1c120"
          }
    ]
  },
  webgl_geometry_text_stroke: {
    id: 'three-geometry-text-stroke',
    directory: 'three-geometry-text-stroke',
    name: 'Geometry Text Stroke — three.js r186',
    description: 'Unmodified official webgl_geometry_text_stroke module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: '3110bd4c88d46084a779703454cc24fc4fcc243bb5253ff049c2969ededaf9b7',
      module: '54e97560f9b553f39d8dd270e08d9a09cbb8acbffeebe6403fd9d9ac8f01cedc'
    },
    assets: [
          {
                "url": "fonts/MPLUSRounded1c/MPLUSRounded1c-Regular.typeface.json",
                "mime": "application/json",
                "output": "MPLUSRounded1c-Regular.typeface.json",
                "sha256": "89d43653ab7ef8d9d2a08afc815ed510e818511929d71c91e2a5156082971455"
          }
    ]
  },
  webgl_effects_anaglyph: {
    id: 'three-effects-anaglyph',
    directory: 'three-effects-anaglyph',
    name: 'Effects Anaglyph — three.js r186',
    description: 'Unmodified official webgl_effects_anaglyph module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: '9f26032747380b3f82cdb9ee7f201de10dd32db91c5306c62ea8eb6aad735681',
      module: 'ea6ef9c320529378b92a8aee617556154b7d896e240732f6cd32c233faef9f6f'
    },
    assets: []
  },
  webgl_effects_stereo: {
    id: 'three-effects-stereo',
    directory: 'three-effects-stereo',
    name: 'Effects Stereo — three.js r186',
    description: 'Unmodified official webgl_effects_stereo module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: '0db6b652663646a2566e08d7c4fcb194bc014a5a1c10eba997e90728ce496953',
      module: '36e9b7fdd5fcab94ab4da7623bfad1dc43ac869c55543a1ec53b5447358e83ac'
    },
    assets: [
      { rawRgba: true, url: 'textures/cube/Park3Med/px.jpg', sha256: '271ef2f791ff6b6f7e5ab45347279ac7195d5f8dab38eb08880036e4bac7d157', mime: 'image/jpeg' },
      { rawRgba: true, url: 'textures/cube/Park3Med/nx.jpg', sha256: '6e27cd535b8ce0400dfec87298f1d7b009aeca54a69b38c8b00834c9d52ce438', mime: 'image/jpeg' },
      { rawRgba: true, url: 'textures/cube/Park3Med/py.jpg', sha256: '27588b1f84b2b7075c56681b2b4893b01ff6c81ab50638884fa9ca8e40266af1', mime: 'image/jpeg' },
      { rawRgba: true, url: 'textures/cube/Park3Med/ny.jpg', sha256: '9c58ffbc9a0a71a61f6b71c002f9367abf3a77e01bea8c6ba7e008c01695ab90', mime: 'image/jpeg' },
      { rawRgba: true, url: 'textures/cube/Park3Med/pz.jpg', sha256: 'f97d0a20187c419622949a4bdb2afb652742bedb6924b9771d00e01d9fd428c7', mime: 'image/jpeg' },
      { rawRgba: true, url: 'textures/cube/Park3Med/nz.jpg', sha256: 'ee32866c05c8221121856b5027d52d1ce0dbcd57185c2295135a5bab656d7503', mime: 'image/jpeg' }
    ]
  },
  webgl_test_memory: {
    id: 'three-test-memory',
    directory: 'three-test-memory',
    name: 'Test Memory — three.js r186',
    description: 'Unmodified official webgl_test_memory module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: '0138e63d35c7be980c5e94f57ba9999d624c5ad056e22fb7c48d747aa0d1a3c4',
      module: '3709e5a920ecd1933e4fb854cd981a0b50c6e2f0f8f572b324ba102860d1ecf0'
    },
    // This example disposes each CanvasTexture in the same RAF tick that
    // first renders it. Force the bounded example canvas into its synchronous
    // local-RGBA lane before the native renderer can await Flutter readback;
    // otherwise every texture is disposed before it can ever be adopted.
    facadeWraps: {
      CanvasTexture: `Base => class extends Base {
        constructor(canvas, ...args) {
          if (canvas && canvas.isJsrThreeExampleLocal) {
            canvas.getContext('2d').getImageData(0, 0, 1, 1);
          }
          super(canvas, ...args);
        }
      }`
    },
    assets: []
  },
  webgl_buffergeometry_selective_draw: {
    id: 'three-buffergeometry-selective-draw',
    directory: 'three-buffergeometry-selective-draw',
    name: 'Buffergeometry Selective Draw — three.js r186',
    description: 'Unmodified official webgl_buffergeometry_selective_draw module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: 'dd296807eef9f4720d3a79736d5f545f2351b34170f6ec25e36a4151a3924447',
      module: '9cee80b012a9a37011785fc70f8108966bd5c56736ffd897d602447431b40f6f'
    },
    assets: []
  },
  webgl_loader_svg: {
    id: 'three-loader-svg',
    directory: 'three-loader-svg',
    name: 'Loader Svg — three.js r186',
    description: 'Unmodified official webgl_loader_svg module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: 'c0dbe3673ea93e298bc267f823a1a478ab85bb42975a16a74843478df610eb52',
      module: '49ab8cf070370837167dcec312903db6f9a86fcf51a73a1b3ce8dff0920ab0dd'
    },
    assets: [
          {
                "url": "models/svg/blueprint.svg",
                "mime": "image/svg+xml",
                "output": "blueprint.svg",
                "sha256": "435a8827d86969fdb4e0c0023218ef7d8374d58c85fdd6e556270713221aa8f9"
          },
          {
                "url": "models/svg/emoji.svg",
                "mime": "image/svg+xml",
                "output": "emoji.svg",
                "sha256": "0d759b12e1ccc64b5008df9af71dbd22fcec4d4706bcbee35d437f0e3ce5ca8e"
          },
          {
                "url": "models/svg/emptyPath.svg",
                "mime": "image/svg+xml",
                "output": "emptyPath.svg",
                "sha256": "01200b186770c8a6df13b04509a83a161fcd3530084714bb2e533dbe6ec07f21"
          },
          {
                "url": "models/svg/energy.svg",
                "mime": "image/svg+xml",
                "output": "energy.svg",
                "sha256": "13967a23d1e36832431e08d2b583a9ab27378793d201acf87862ea09dc2930aa"
          },
          {
                "url": "models/svg/hexagon.svg",
                "mime": "image/svg+xml",
                "output": "hexagon.svg",
                "sha256": "b2e71c748128a36c74eccb6f2e703d3f96673f7f30d83d6ebf4cebf4171bdfa2"
          },
          {
                "url": "models/svg/lineJoinsAndCaps.svg",
                "mime": "image/svg+xml",
                "output": "lineJoinsAndCaps.svg",
                "sha256": "fbb7fcb4436029da0fade1f8deaa59f9791d102f1bd449cbc37b430757eb3ca7"
          },
          {
                "url": "models/svg/multiple-css-classes.svg",
                "mime": "image/svg+xml",
                "output": "multiple-css-classes.svg",
                "sha256": "31cf266c9a182a639232aa9eddf824c4dd9bb105ed3074190dd727302c8479f5"
          },
          {
                "url": "models/svg/singlePointTest.svg",
                "mime": "image/svg+xml",
                "output": "singlePointTest.svg",
                "sha256": "197c4367dfd2d873caa83ae38549470fd39c74bff388a918f152052711040b09"
          },
          {
                "url": "models/svg/singlePointTest2.svg",
                "mime": "image/svg+xml",
                "output": "singlePointTest2.svg",
                "sha256": "8640811964d64f2dcc4b47782ed76e9760afa655809fe33bb32033deffabdc38"
          },
          {
                "url": "models/svg/singlePointTest3.svg",
                "mime": "image/svg+xml",
                "output": "singlePointTest3.svg",
                "sha256": "5e66ef09cb29bdbd2cb767793050ded931c709bc8df87cbcadb49e7dcac86b65"
          },
          {
                "url": "models/svg/style-css-inside-defs.svg",
                "mime": "image/svg+xml",
                "output": "style-css-inside-defs.svg",
                "sha256": "fb67ee113a5ad04401ae712d3586cf1378afd39fe81e0e7f6579653fea0cb019"
          },
          {
                "url": "models/svg/styled-paths.svg",
                "mime": "image/svg+xml",
                "output": "styled-paths.svg",
                "sha256": "b57e563f1ce5e1ad8cfae4e4526b8e44d886c9263e4ea4b16b401a10be93c29d"
          },
          {
                "url": "models/svg/tests/1.svg",
                "mime": "image/svg+xml",
                "output": "1.svg",
                "sha256": "177ec36979ec90dcaf22c5cfec12655279290381b62f27c4311675929f28cce7"
          },
          {
                "url": "models/svg/tests/2.svg",
                "mime": "image/svg+xml",
                "output": "2.svg",
                "sha256": "e491688ba5d636365a60c5816fa2f24b6b9bcb762620b217d37bd8ae32b4f0d1"
          },
          {
                "url": "models/svg/tests/3.svg",
                "mime": "image/svg+xml",
                "output": "3.svg",
                "sha256": "1f41f5d8d0219626cb0709397f7cfbd6626f2d707c8c2f4b0affa7400045a319"
          },
          {
                "url": "models/svg/tests/4.svg",
                "mime": "image/svg+xml",
                "output": "4.svg",
                "sha256": "2e6e1868a1291e3cca79c532cfd6d9251de69340ab39930dc279c24bb59ae8dc"
          },
          {
                "url": "models/svg/tests/5.svg",
                "mime": "image/svg+xml",
                "output": "5.svg",
                "sha256": "0cb9a4f46a5b9925f315b1e1a0ecbc225105a337e03e9c6d619691ef4f5d6863"
          },
          {
                "url": "models/svg/tests/6.svg",
                "mime": "image/svg+xml",
                "output": "6.svg",
                "sha256": "a789806193afddee2802c9cf0c7140e9ed78b1540ef1a76045931f46dfcd5dc2"
          },
          {
                "url": "models/svg/tests/7.svg",
                "mime": "image/svg+xml",
                "output": "7.svg",
                "sha256": "93fa09cd417d595b3ff0e565574abd4a3a92c27382c4b17df4c09dd63f3f00f0"
          },
          {
                "url": "models/svg/tests/8.svg",
                "mime": "image/svg+xml",
                "output": "8.svg",
                "sha256": "b5774309181f3f8a3b39595fd6fb51bf40fa39a01da22efd984753206f89d2d1"
          },
          {
                "url": "models/svg/tests/9.svg",
                "mime": "image/svg+xml",
                "output": "9.svg",
                "sha256": "652fe0f1c6fb4d4b75d0a85e620c1d57acb98921b734b91c3e864995a6cc991a"
          },
          {
                "url": "models/svg/tests/ellipseTransform.svg",
                "mime": "image/svg+xml",
                "output": "ellipseTransform.svg",
                "sha256": "810f339b4f2f0e9b273673f32f9f57fcd49a4db2023292910cc3b7eea35649e0"
          },
          {
                "url": "models/svg/tests/letter.svg",
                "mime": "image/svg+xml",
                "output": "letter.svg",
                "sha256": "101dd17a2c90bc73cf15f38b55512cb340967397f31239709291a43e0390d1e8"
          },
          {
                "url": "models/svg/tests/ordering.svg",
                "mime": "image/svg+xml",
                "output": "ordering.svg",
                "sha256": "3915ce72ce740d9d4ad067982c33953ee6279be0315142f930862885df8cfec1"
          },
          {
                "url": "models/svg/tests/roundJoinPrecisionIssue.svg",
                "mime": "image/svg+xml",
                "output": "roundJoinPrecisionIssue.svg",
                "sha256": "700bb2b90a0de9f3fc8735dc96fb1b90d2cf97c1a51dad3fa9a792d2a3e8e170"
          },
          {
                "url": "models/svg/tests/styles.svg",
                "mime": "image/svg+xml",
                "output": "styles.svg",
                "sha256": "5153d2bff15a1372ac8ba39c48a9eb6b311e630ec6a4b87e958f03243627921d"
          },
          {
                "url": "models/svg/tests/testDefs/Svg-defs.svg",
                "mime": "image/svg+xml",
                "output": "Svg-defs.svg",
                "sha256": "e547ddeb3348355c29cb2476d6ab80e26e2641b293fc59a8786c8e2c97dad046"
          },
          {
                "url": "models/svg/tests/testDefs/Svg-defs2.svg",
                "mime": "image/svg+xml",
                "output": "Svg-defs2.svg",
                "sha256": "799a090a3aa8cb3395491153ce53c500cf18327a53bc4ee0caf528b59ed0c9e5"
          },
          {
                "url": "models/svg/tests/testDefs/Wave-defs.svg",
                "mime": "image/svg+xml",
                "output": "Wave-defs.svg",
                "sha256": "d223a20c10d7e26504447e543c643cbba329e4ff385f3951346a3a4a5354704d"
          },
          {
                "url": "models/svg/tests/testDefs/defs4.svg",
                "mime": "image/svg+xml",
                "output": "defs4.svg",
                "sha256": "079e1e5f56fec00d22a920de9b78283b3d08f90d666f4d89f81bca5bafba5bcf"
          },
          {
                "url": "models/svg/tests/testDefs/defs5.svg",
                "mime": "image/svg+xml",
                "output": "defs5.svg",
                "sha256": "27b44d235aa433497f2c3c2843b9006ffabeae66d49f4f68c4297caf78c48783"
          },
          {
                "url": "models/svg/tests/units.svg",
                "mime": "image/svg+xml",
                "output": "units.svg",
                "sha256": "58e4f3b4548b220aeb789d0348ad2fc7c7158b577ce8f0caa0957f8c7b7554d4"
          },
          {
                "url": "models/svg/tests/wideStroke.svg",
                "mime": "image/svg+xml",
                "output": "wideStroke.svg",
                "sha256": "073a9e401a7d303ae2366dc91db4120c9644e91c9bd6567c36a24e7f0cd06ce0"
          },
          {
                "url": "models/svg/tiger.svg",
                "mime": "image/svg+xml",
                "output": "tiger.svg",
                "sha256": "e14dab6b4811a6a12abf9aefe69b5e4d5e8af43f9e1cc2dc22416eebf87ed0c7"
          },
          {
                "url": "models/svg/zero-radius.svg",
                "mime": "image/svg+xml",
                "output": "zero-radius.svg",
                "sha256": "0524324812eb6f2cf0a791a19c467472abdbfe9ac15aa7e120c90ec6ff75cc76"
          }
    ]
  },
  webgl_loader_texture_tga: {
    id: 'three-loader-texture-tga',
    directory: 'three-loader-texture-tga',
    name: 'Loader Texture Tga — three.js r186',
    description: 'Unmodified official webgl_loader_texture_tga module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧩',
    expected: {
      html: '71ada14e4ae1f42fc9c95af6820cc70349255d17db431a6bd1cccd40a0f2ebf5',
      module: '1ebfb62f0c34dfbdaf350bb935dbd2b0ce87b7087117965cd6f6ced0ebe852c6'
    },
    assets: [
          {
                "url": "textures/crate_color8.tga",
                "mime": "application/octet-stream",
                "output": "crate_color8.tga",
                "sha256": "b3c7ca4ea77ecd215f086dc5bea152e183e202c108aa77982130efa3eaed8d9d"
          },
          {
                "url": "textures/crate_grey8.tga",
                "mime": "application/octet-stream",
                "output": "crate_grey8.tga",
                "sha256": "6ae83da1bc71f79c03b8bf87bfff664a8b81847297806bb2cf12ef96d29588fa"
          }
    ]
  },
  webaudio_timing: {
    id: 'three-webaudio-timing',
    directory: 'three-webaudio-timing',
    name: 'WebAudio Timing — three.js r186',
    description: 'Unmodified official webaudio_timing module with native positional audio through the host media transport.',
    icon: '🔊',
    expected: {
      html: 'b3298dbf44287b005aedac56232277e0d6e2f3a9d7b4f4fe024608973d4c0b2c',
      module: '607363f6bfcab9453bc87e2aa41248617c7777927ac491a0a7853bef71536e61'
    },
    assets: [
      { url: 'sounds/ping_pong.mp3', output: 'ping_pong.mp3', mime: 'audio/mpeg', diagnostic: 'audioClip', sha256: '51597e0d2fdd9bdb5658452adaf125596f05d07d9eab430994511e3039ea9cf2' }
    ]
  },
  webaudio_orientation: {
    id: 'three-webaudio-orientation',
    directory: 'three-webaudio-orientation',
    name: 'WebAudio Orientation — three.js r186',
    description: 'Unmodified official webaudio_orientation module with native media-element spatialization and directional cones.',
    icon: '🎧',
    expected: {
      html: '9b1b06b97cba0a75a6bcdade25dd8216ec04ff1f6e6442d9a813b17e9c10644a',
      module: '22f20767ba8d5e54cc00cd934b76aae786899007613e5ceb03c955f047cbedf9'
    },
    assets: [
      { url: 'sounds/376737_Skullbeatz___Bad_Cat_Maste.mp3', output: 'skullbeatz.mp3', mime: 'audio/mpeg', diagnostic: 'audioClip', sha256: 'd7263cf4c686eb0a70fb08d4015e88fbe0a0b464050e5ad40c1c9d0cbec07d3e' },
      { url: 'models/gltf/BoomBox.glb', output: 'BoomBox.glb', mime: 'model/gltf-binary', externalizeImages: true, sha256: '3f14d6608669b1ae77485a53686925e987b8d86c8fc81095f69c028c3e3ae81e' },
      { rawRgba: true, url: 'textures/cube/SwedishRoyalCastle/px.jpg', output: 'castle-px.jpg', mime: 'image/jpeg', sha256: '10a786132bc7eef6b142bd0d4b00ea94ffc1a1bfccfb1a6ec0baedf966d80734' },
      { rawRgba: true, url: 'textures/cube/SwedishRoyalCastle/nx.jpg', output: 'castle-nx.jpg', mime: 'image/jpeg', sha256: '53a8d90cea6bab188d462c44676b84e5993424e465785c93829d810bbf7c5076' },
      { rawRgba: true, url: 'textures/cube/SwedishRoyalCastle/py.jpg', output: 'castle-py.jpg', mime: 'image/jpeg', sha256: '8b88f7f9af85fa5b442f28fb27532e534a197aba68ae60548bf4b3750f0d50f0' },
      { rawRgba: true, url: 'textures/cube/SwedishRoyalCastle/ny.jpg', output: 'castle-ny.jpg', mime: 'image/jpeg', sha256: '17953cc33b9fec703c286266d4aca6033d758edd17ba0384fb3ebd7630085fd4' },
      { rawRgba: true, url: 'textures/cube/SwedishRoyalCastle/pz.jpg', output: 'castle-pz.jpg', mime: 'image/jpeg', sha256: 'cc9252ba994a79c320ac4aed03aac9000f810c1358179e70a69b598d56e129db' },
      { rawRgba: true, url: 'textures/cube/SwedishRoyalCastle/nz.jpg', output: 'castle-nz.jpg', mime: 'image/jpeg', sha256: '10149242ae21ba4c00663a0673f01a6722da63f201511fdc01941930d800ccff' }
    ],
    // BoomBox packs occlusion and emissive textures, which have no R1 lanes.
    // Keep base color, normal and metallic/roughness detail with a loud peel.
    facadeWraps: {
      MeshStandardMaterial: `Base => {
        let warned = false;
        return class extends Base {
          constructor(params) {
            if (params && (params.aoMap || params.emissiveMap)) {
              const peeled = Object.assign({}, params);
              delete peeled.aoMap;
              if (peeled.emissiveMap) {
                delete peeled.emissiveMap;
                delete peeled.emissive;
              }
              if (!warned) {
                warned = true;
                console.warn('three-webaudio-orientation: R1 drops BoomBox aoMap/emissiveMap; PBR base and normal detail retained.');
              }
              super(peeled);
            } else super(params);
          }
        };
      }`,
      Line: `Base => {
        let warned = false;
        return class extends Base {
          constructor(geometry, material) {
            if (Array.isArray(material)) {
              if (!warned) {
                warned = true;
                console.warn('three-webaudio-orientation: R1 renders the directional helper with its inner-cone color; line material groups dropped.');
              }
              super(geometry, material[1] || material[0]);
            } else super(geometry, material);
          }
        };
      }`
    }
  },
  webaudio_sandbox: {
    id: 'three-webaudio-sandbox',
    directory: 'three-webaudio-sandbox',
    name: 'sandbox — three.js r186',
    description: 'Unmodified official webaudio_sandbox module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🔊',
    expected: {
      html: 'a65c8a258b79ba064ce3784d29245b3af0e83c579bfd4a1ed0e82a6806efd6ee',
      module: '4da8b0e7758e5a9510506bbf07257bf990e404b7ba933843d4639c3f03e0253c'
    },
    assets: []
  },
  webaudio_visualizer: {
    id: 'three-webaudio-visualizer',
    directory: 'three-webaudio-visualizer',
    name: 'visualizer — three.js r186',
    description: 'Unmodified official webaudio_visualizer module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🔊',
    expected: {
      html: '9517f7b9e4859a4eca2033f43e7f9c378f86e694666b53e3ed8e79793d537e51',
      module: '20be32a9cb66078672a7816d86292c4211de1d5a87ac1628e8fe80994b596dca'
    },
    assets: []
  },
  webgl_animation_keyframes: {
    id: 'three-animation-keyframes',
    directory: 'three-animation-keyframes',
    name: 'animation - keyframes — three.js r186',
    description: 'Unmodified official webgl_animation_keyframes module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '68dd0cf9d8dd135628bfe70a4f06f7d637d6b29c806af9beec2be701decf7106',
      module: '85b28721436f86d762ce31f51d6ad64a3f2b4baf2a4f2da679ea2f877e774134'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_animation_skinning_additive_blending: {
    id: 'three-animation-skinning-additive-blending',
    directory: 'three-animation-skinning-additive-blending',
    name: 'additive animation - skinning — three.js r186',
    description: 'Unmodified official webgl_animation_skinning_additive_blending module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '8059a8d4d4a238aa3a43e3489df2c6c0904da092d4dbc45c66de6b9ac3a905b9',
      module: '5106f804ad37d95462024cf6af1a8cec6cfba1ef2570d7c9e93e931392563132'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_animation_skinning_ik: {
    id: 'three-animation-skinning-ik',
    directory: 'three-animation-skinning-ik',
    name: 'animation - skinning - ik — three.js r186',
    description: 'Unmodified official webgl_animation_skinning_ik module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '81fe03ae043999f28c4201250feab05387a8555afdc0d46706ffdf3e71708de0',
      module: '19574be3bb978c4f746937300813c521730f5cb756848ec74ab54988e381eac7'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_animation_walk: {
    id: 'three-animation-walk',
    directory: 'three-animation-walk',
    name: 'animation - walk — three.js r186',
    description: 'Unmodified official webgl_animation_walk module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '4e490a8d3b5064a0f2caa9a0d51cf6ed25880bde077cb9460cfea472e45b511e',
      module: '4f518577e78e6eae44aeeaec36287f224dff6653436eec1616375ace9e9f4a0f'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_batch_lod_bvh: {
    id: 'three-batch-lod-bvh',
    directory: 'three-batch-lod-bvh',
    name: 'Batch LOD BVH — three.js r186',
    description: 'Unmodified official webgl_batch_lod_bvh module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '4bdcb5a0f3075db8d9905fcf1de3b116b6945d1fcabf1982ea731027e7b74016',
      module: '9c8b90bc8a3de418e52aeddce94979f04a4ffee95f91500ceeef04689c46974e'
    },
    assets: []
  },
  webgl_buffergeometry_attributes_integer: {
    id: 'three-buffergeometry-attributes-integer',
    directory: 'three-buffergeometry-attributes-integer',
    name: 'Buffergeometry Attributes Integer — three.js r186',
    description: 'Unmodified official webgl_buffergeometry_attributes_integer module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'efc4c6de529bdcb3b8c0f98d2edcb4ce5a73cf835ecd549a3def1adc6b7b207b',
      module: 'b8619f32224e4eb2aa4e02e6676d16da2e3735fc484f748c1adbb6777e9b39d9'
    },
    assets: []
  },
  webgl_buffergeometry_custom_attributes_particles: {
    id: 'three-buffergeometry-custom-attributes-particles',
    directory: 'three-buffergeometry-custom-attributes-particles',
    name: 'buffer geometry custom attributes - particles — three.js r186',
    description: 'Unmodified official webgl_buffergeometry_custom_attributes_particles module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '83097a9599d17b6609bb4ad10b25136ea4b6378a74174152f20448bf53496ecb',
      module: 'f750b7828f14d05a5ee5ef6c1489e4dd9f0ec03d8c24a2f36c21c7768f93eaab'
    },
    assets: []
  },
  webgl_buffergeometry_glbufferattribute: {
    id: 'three-buffergeometry-glbufferattribute',
    directory: 'three-buffergeometry-glbufferattribute',
    name: 'buffergeometry - custom VBOs — three.js r186',
    description: 'Unmodified official webgl_buffergeometry_glbufferattribute module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'd93b5975882c4b57f69a6096fda0a5cf9cc768bc78899ac2ca4d5f792bb0d0cf',
      module: '04780167d40b16b578b409ea09d18312b2f68f505d72addc2d9bf736f5ebce48'
    },
    assets: []
  },
  webgl_buffergeometry_instancing: {
    id: 'three-buffergeometry-instancing',
    directory: 'three-buffergeometry-instancing',
    name: 'instancing test (single triangle) — three.js r186',
    description: 'Unmodified official webgl_buffergeometry_instancing module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'e26c4b93f76503b7baffed2a61a9082dfd18b9996e5ca03b578687d250efc095',
      module: 'c34bef33ecc5f1a53b728ebde3849e0a6b064fe10b1e34654201b231dc825479'
    },
    assets: []
  },
  webgl_buffergeometry_instancing_billboards: {
    id: 'three-buffergeometry-instancing-billboards',
    directory: 'three-buffergeometry-instancing-billboards',
    name: 'instanced particles - billboards - colors — three.js r186',
    description: 'Unmodified official webgl_buffergeometry_instancing_billboards module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'e8db25806997271bf21769007435b59d870afeb410a98a64de7dbf9e71ec84b0',
      module: 'f09361e8bf87e5fb1efd20e914ace560cdc301b835d3aade4e8f1c92fc5c94e9'
    },
    assets: []
  },
  webgl_buffergeometry_instancing_interleaved: {
    id: 'three-buffergeometry-instancing-interleaved',
    directory: 'three-buffergeometry-instancing-interleaved',
    name: 'indexed instancing (single box), interleaved buffers — three.js r186',
    description: 'Unmodified official webgl_buffergeometry_instancing_interleaved module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '5998700f98e8a22888c354f9119409bed8a13dcaebcecd6887a2d719f66e8047',
      module: '2f87c044532dfc3f7c6c2bdd01a708dee49913b7a4f1a31274a720ddfe2a3bfa'
    },
    assets: []
  },
  webgl_buffergeometry_rawshader: {
    id: 'three-buffergeometry-rawshader',
    directory: 'three-buffergeometry-rawshader',
    name: 'raw shader — three.js r186',
    description: 'Unmodified official webgl_buffergeometry_rawshader module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '22dd64e21aac42d2d3056ee56dce2ed820c2cf54e06e1ab7719c9b1bbbfd1d2b',
      module: 'a11f5718fbfca8e07ef97ce2f1d2012dbac22aa952e3d35b02aaf50897cdf3c9'
    },
    assets: []
  },
  webgl_clipculldistance: {
    id: 'three-clipculldistance',
    directory: 'three-clipculldistance',
    name: 'Clipculldistance — three.js r186',
    description: 'Unmodified official webgl_clipculldistance module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '0eca3d8ab861d313e275b46acc9671c634fbf815f216e1bb955761ba1bcf379f',
      module: '825cee1715fa8f462bb8d97360465f2b01f53ea02a9c6642b779d6d36c77c57c'
    },
    assets: []
  },
  webgl_clipping_stencil: {
    id: 'three-clipping-stencil',
    directory: 'three-clipping-stencil',
    name: 'clipping stencil — three.js r186',
    description: 'Unmodified official webgl_clipping_stencil module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '8b1ce8143d99faf4ce3bec2ae6289afd4c3738b54cb458a314d9286b99357a59',
      module: '877aeb96e4becc5f647bbe09d2cf446506129fbce5fdc17241ff6825251f639b'
    },
    assets: []
  },
  webgl_custom_attributes: {
    id: 'three-custom-attributes',
    directory: 'three-custom-attributes',
    name: 'custom attributes — three.js r186',
    description: 'Unmodified official webgl_custom_attributes module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'ff29b98376651e2b6342f930e09c3c52ffc12cb4091158fe5cd436fa25ae2811',
      module: 'f4401c81c0f63a37036350401bc0aeafa0aad52d87fb25ff1c9d3dc9617b0c39'
    },
    assets: []
  },
  webgl_custom_attributes_lines: {
    id: 'three-custom-attributes-lines',
    directory: 'three-custom-attributes-lines',
    name: 'custom attributes [lines] — three.js r186',
    description: 'Unmodified official webgl_custom_attributes_lines module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'dd9ba3293b6f3e6689a35e762f74a2f0fcb28be45e4252bf9b2021c88c8b1fdb',
      module: '257a44a4831441384fc58cadcc7d288b4bea1352944a479c2bb6506dd9a67036'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_custom_attributes_points: {
    id: 'three-custom-attributes-points',
    directory: 'three-custom-attributes-points',
    name: 'custom attributes [particles] — three.js r186',
    description: 'Unmodified official webgl_custom_attributes_points module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '5316fb3913d1c75d097c1be1808d0ad6cfe3a093da4bd4a7e511f20794245445',
      module: '421a70a3d955daf5142cbca35c22227c5f223eeaca6e6c29a5940c1eecb28cd0'
    },
    assets: []
  },
  webgl_custom_attributes_points2: {
    id: 'three-custom-attributes-points2',
    directory: 'three-custom-attributes-points2',
    name: 'custom attributes [particles][billboards] — three.js r186',
    description: 'Unmodified official webgl_custom_attributes_points2 module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'f8550792d1801617a32520bfbeb22d443dcca9ce8143c6b1e0e98c9199eaaf51',
      module: '3a10aba832195e7ee4c0eb053d19774606216c1ef61ca1d51c79775515ae7671'
    },
    assets: []
  },
  webgl_custom_attributes_points3: {
    id: 'three-custom-attributes-points3',
    directory: 'three-custom-attributes-points3',
    name: 'custom attributes [particles][billboards][alphatest] — three.js r186',
    description: 'Unmodified official webgl_custom_attributes_points3 module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'c77afb177de54ada7f0a58bb8c9c1198d96aaa114dbaac456e3fdc0210bebcfc',
      module: 'a67ecbde520093412214cdfdaf02f6e8c8ee393db9bddaf241d20f4e0149ab32'
    },
    assets: []
  },
  webgl_depth_texture: {
    id: 'three-depth-texture',
    directory: 'three-depth-texture',
    name: 'Depth Texture — three.js r186',
    description: 'Unmodified official webgl_depth_texture module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '8ee23ac45ac3233941f6e3e6a8832770a966c6ac2db376fbc166f470f3dfe4e3',
      module: '26a0b443827147c6cb2af9912f1e9f882f12d97d331cc56f7ef26fece9b92968'
    },
    assets: []
  },
  webgl_effects_ascii: {
    id: 'three-effects-ascii',
    directory: 'three-effects-ascii',
    name: 'effects - ascii — three.js r186',
    description: 'Unmodified official webgl_effects_ascii module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '09fbb0266e91f0e6a56938310ca5fa0d09f151198bd1a08f9d592870144113dc',
      module: '95345a20fbf27f070f677c7632119a352494018fff20aeb8497b178fcadf3751'
    },
    assets: []
  },
  webgl_effects_parallaxbarrier: {
    id: 'three-effects-parallaxbarrier',
    directory: 'three-effects-parallaxbarrier',
    name: 'effects - parallax barrier — three.js r186',
    description: 'Unmodified official webgl_effects_parallaxbarrier module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'dcc2b4064201d6e68e5e60fbeda8d127017955edd41683e6cc05b3f04da6114f',
      module: 'ab414585c7af40aacc37895652d60a9920c0ae76f2bf9639fe966cddd66e1f9d'
    },
    assets: []
  },
  webgl_framebuffer_texture: {
    id: 'three-framebuffer-texture',
    directory: 'three-framebuffer-texture',
    name: 'framebuffer - texture — three.js r186',
    description: 'Unmodified official webgl_framebuffer_texture module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '4bf200bf1558513434abab3075a4fe09402e13bc66ad97d2d4febb5066ea91f2',
      module: '9d6f9775a490d457d2ac562560246a5b23211ed2c44183ce2d1f19c509f63748'
    },
    assets: []
  },
  webgl_furnace_test: {
    id: 'three-furnace-test',
    directory: 'three-furnace-test',
    name: 'Furnace Test — three.js r186',
    description: 'Unmodified official webgl_furnace_test module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '18853433a206910fc80d3ff2af3cb156670eb5d1dbe39d64a990bf8857187de5',
      module: '4b8e3daa94880bb39abc6224f9c781c12fce919d469c3d24bcc179bb64a9ef69'
    },
    assets: []
  },
  webgl_gpgpu_birds: {
    id: 'three-gpgpu-birds',
    directory: 'three-gpgpu-birds',
    name: 'gpgpu - flocking — three.js r186',
    description: 'Unmodified official webgl_gpgpu_birds module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'd34ee0fbf6a43dea28f0bc0b1f5eb286013356b9d1648fd0492926e6c8779409',
      module: '5f2fe4213d16e936ed957081c2ba449d942ef61bd9d652588167e71762028c9a'
    },
    assets: []
  },
  webgl_gpgpu_birds_gltf: {
    id: 'three-gpgpu-birds-gltf',
    directory: 'three-gpgpu-birds-gltf',
    name: 'gpgpu - flocking — three.js r186',
    description: 'Unmodified official webgl_gpgpu_birds_gltf module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'f3196d89cb4b6e0cd4a237d94caa8d5462c4dba9673501cd8e5a1e3db60e8dbc',
      module: '372a4c0a61ee4edf3fd4fda45fb584812ae698268a11ddba0d627e4adc5a8bb6'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_gpgpu_protoplanet: {
    id: 'three-gpgpu-protoplanet',
    directory: 'three-gpgpu-protoplanet',
    name: 'gpgpu - protoplanet — three.js r186',
    description: 'Unmodified official webgl_gpgpu_protoplanet module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'd6fb9f50fa55f91f0827f8283519481f0a4d7ce675ac72e475275ae7bf1d959b',
      module: 'ddb02a2ade9e87df6090c91ad9691c029f765980c1b2a95379d14d39399e523e'
    },
    assets: []
  },
  webgl_gpgpu_water: {
    id: 'three-gpgpu-water',
    directory: 'three-gpgpu-water',
    name: 'gpgpu - water — three.js r186',
    description: 'Unmodified official webgl_gpgpu_water module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '7116f677e30465bfc895b5da47fa247c3535585ba7a7a6bcfbf81fdabfe31c4e',
      module: 'd43f0c91d94c378ee1b0f6c8cdcaf6314054439c7d6733386a800fda42c40ddf'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_instancing_morph: {
    id: 'three-instancing-morph',
    directory: 'three-instancing-morph',
    name: 'instancing - Morph Target Animations — three.js r186',
    description: 'Unmodified official webgl_instancing_morph module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'd0dc5d19cbfcf0e85dc98f831cf0c14613bdb2f1a03b11fd3df84750a734ca7b',
      module: '311a027c5150185e4fe6989b99d0371d5bab882147efcf50af3cd320f4999819'
    },
    assets: []
  },
  webgl_interactive_cubes_gpu: {
    id: 'three-interactive-cubes-gpu',
    directory: 'three-interactive-cubes-gpu',
    name: 'interactive cubes (gpu) — three.js r186',
    description: 'Unmodified official webgl_interactive_cubes_gpu module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '4600fff76bad6097f29b4d7bbdfd2e36dd7527a7ce8bf98062021b5a04d1084c',
      module: 'b263b5ebee3bf7355c9eb73904be3eb5640bc3cd375f4c19551e3f45356ee8a2'
    },
    assets: []
  },
  webgl_lensflares: {
    id: 'three-lensflares',
    directory: 'three-lensflares',
    name: 'lensflares — three.js r186',
    description: 'Unmodified official webgl_lensflares module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '0c706d5d8aff1a98e2ab4d392c79cbbac5e452074c1ea8e737964e6c46231bf3',
      module: '8abac9c25dc27660583514bb63bd7bfa8b3bbac2b3345027d237ee7fe5099021'
    },
    assets: []
  },
  webgl_lightprobe: {
    id: 'three-lightprobe',
    directory: 'three-lightprobe',
    name: 'light probe — three.js r186',
    description: 'Unmodified official webgl_lightprobe module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '8a60cc69a0484ce3d4530684ce18742c148fe3090d26314d3b9ac8c4b966d0a4',
      module: '4ebbd9301db3285c18e6aae07ad128c65644d3b09e1dbada683a8d0a4c32b181'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_lightprobe_cubecamera: {
    id: 'three-lightprobe-cubecamera',
    directory: 'three-lightprobe-cubecamera',
    name: 'light probe from cubeCamera — three.js r186',
    description: 'Unmodified official webgl_lightprobe_cubecamera module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'b2ad73847b7c05b0d14d6e010150b4a605fb2f929d79a47aa0fe2017b243b78f',
      module: '05acd4e6b535799096ff8d331cffbee9945c62b54e4c3994b649326a6c5647ac'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_lightprobes: {
    id: 'three-lightprobes',
    directory: 'three-lightprobes',
    name: 'light probe volume — three.js r186',
    description: 'Unmodified official webgl_lightprobes module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'f7b18ee2a5b73068484c8b565bbac59a39eee4bfe8328c8933bc0378b7929ba0',
      module: 'bb399dea61b6d0c9812e24769b8fc305643da71c6b5b8ff6483cb6b896d123d4'
    },
    assets: []
  },
  webgl_lightprobes_complex: {
    id: 'three-lightprobes-complex',
    directory: 'three-lightprobes-complex',
    name: 'light probe volume (multi-room) — three.js r186',
    description: 'Unmodified official webgl_lightprobes_complex module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '3d31b46427fa675725d086ecbae084d41f716bfcd35bf833e66113b0effbe264',
      module: '68800c7e625e5eaa89e29b6880186ecba35415fa750dc9afd341313782d92874'
    },
    assets: []
  },
  webgl_lightprobes_sponza: {
    id: 'three-lightprobes-sponza',
    directory: 'three-lightprobes-sponza',
    name: 'light probe volume (Sponza) — three.js r186',
    description: 'Unmodified official webgl_lightprobes_sponza module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '68c658e46b20d34f451d6e80b17491a8faa4d1c596e94022e9ae6ab9a1a04cf9',
      module: '7096bbe4b58c139380283b9caa53f1301646da85f28dfd5e7a06dbd3fc4e8b61'
    },
    assets: []
  },
  webgl_lights_rectarealight: {
    id: 'three-lights-rectarealight',
    directory: 'three-lights-rectarealight',
    name: 'lights - rect area light — three.js r186',
    description: 'Unmodified official webgl_lights_rectarealight module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '0f376a50d0d98bdbf3567f1686736feb2e6f747084e59d0639aa27088eef0c39',
      module: 'dcbc96ace20236b8041c0b310cc23de22631c680b7f76e4c695a2abcb1850bca'
    },
    assets: []
  },
  webgl_lights_sunlight: {
    id: 'three-lights-sunlight',
    directory: 'three-lights-sunlight',
    name: 'lights - sunlight — three.js r186',
    description: 'Unmodified official webgl_lights_sunlight module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '4aa2f47e0ee13d1ef010c857c46a30adb80f6f70b66d5141ac5fd822eafaa4db',
      module: '00ae552dbb2c7cbb1e9d47aaccefa21f437f0fe32de8482a0a4ffd1c8ffe374e'
    },
    assets: []
  },
  webgl_lines_fat_raycasting: {
    id: 'three-lines-fat-raycasting',
    directory: 'three-lines-fat-raycasting',
    name: 'lines - fat — three.js r186',
    description: 'Unmodified official webgl_lines_fat_raycasting module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'd2c6689b94e220e89f495f4cfedcaa3e167162f007b8257d95693adba1d94474',
      module: 'd7ab3e9fcc63fa4bef22d693a51f791f6f5c9dde883421e139052de3f658b3cc'
    },
    assets: []
  },
  webgl_lines_fat_wireframe: {
    id: 'three-lines-fat-wireframe',
    directory: 'three-lines-fat-wireframe',
    name: 'lines - fat - wireframe — three.js r186',
    description: 'Unmodified official webgl_lines_fat_wireframe module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '37a8cf801ae11db21366d84e3ada0f49efa40904387be62955fdcf99586ea85a',
      module: 'f2e7d34eaed21b65eb7849f2bf1f91e30b22a50c7213a0cec119793a90ddadf9'
    },
    assets: []
  },
  webgl_loader_3dm: {
    id: 'three-loader-3dm',
    directory: 'three-loader-3dm',
    name: 'loaders - Rhino 3DM loader — three.js r186',
    description: 'Unmodified official webgl_loader_3dm module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '37fde3f49f1f8efe06fcd045cb8ec18803ad19a4f6db4747fcca7b3f1029d677',
      module: '3dc1a5727a379a841284abc0a8eeff7817a036ada3b6b315396e2c960982e1de'
    },
    addonShims: {
      'three/addons/loaders/3DMLoader.js': rhino3dmLoaderShim()
    },
    discoverAssets: true,
    assets: []
  },
  webgl_loader_3ds: {
    id: 'three-loader-3ds',
    directory: 'three-loader-3ds',
    name: 'loaders - 3DS loader — three.js r186',
    description: 'Unmodified official webgl_loader_3ds module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '856222fcdecd8bd11c5380e0e4d778988d6960380672148120708728777bc77a',
      module: '1392ff28e2ff4a912f6c9145023599724bac75bebf56540f9f9da7d1873d4269'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_loader_3dtiles: {
    id: 'three-loader-3dtiles',
    directory: 'three-loader-3dtiles',
    name: 'Loader 3D Tiles — three.js r186',
    description: 'Unmodified official webgl_loader_3dtiles module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '0d03162026f333914f1d961203b35cf4eccbe6dfee19eab29aeef2f1a70243c8',
      module: '236c799ba6b5fca0fbe851632f20fa3e3d7c7a74e5381a309c16d8ccd1aaaa44'
    },
    assets: []
  },
  webgl_loader_3mf: {
    id: 'three-loader-3mf',
    directory: 'three-loader-3mf',
    name: '3MF — three.js r186',
    description: 'Unmodified official webgl_loader_3mf module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '404fb62573b07e3eb01c9f8b4a00f6bf4d4051d9a83b905adc9bf0819c7492e4',
      module: 'aca96938eb251d4d2ca88da45cad39ee7e3b11320ce006fe1a4911b54e79b7f1'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_loader_3mf_materials: {
    id: 'three-loader-3mf-materials',
    directory: 'three-loader-3mf-materials',
    name: '3MF — three.js r186',
    description: 'Unmodified official webgl_loader_3mf_materials module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'acac936c0f0ff8820c4263ce2db6aeca8a8f8317aca1aac948b59cb60b7d5d5a',
      module: 'c965fce51ad887da0165531b5dbb5bee2ba6d68e46650d16a4da8d3a365bd9b7'
    },
    assets: []
  },
  webgl_loader_amf: {
    id: 'three-loader-amf',
    directory: 'three-loader-amf',
    name: 'AMF — three.js r186',
    description: 'Unmodified official webgl_loader_amf module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '46cbdd7584fd70475b5c080b228f1aa679606b73c2392a43e2665d7cd63ef53e',
      module: '3375334d856c407f28732896efbda843b90e5135328110cf3a6342e8341a0dfe'
    },
    assets: []
  },
  webgl_loader_bvh: {
    id: 'three-loader-bvh',
    directory: 'three-loader-bvh',
    name: 'loaders - BVHLoader — three.js r186',
    description: 'Unmodified official webgl_loader_bvh module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'f62d0300f6d1660ae1e7e5efb1998d03c3c563f598ee593e84034fe88f08794c',
      module: '972f3ebdec06dc61dd4e63ea24304105830549e83d82feec3e42a0973807e2ce'
    },
    assets: []
  },
  webgl_loader_collada: {
    id: 'three-loader-collada',
    directory: 'three-loader-collada',
    name: 'collada — three.js r186',
    description: 'Unmodified official webgl_loader_collada module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'bbb4970bad5d35034e44dfaa529408be5462eaef71cc5732957abf41f399639e',
      module: '97168a046a02998d9e680d9fc51f056b0e17e0dc27794e12553b657e3115a22f'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_loader_collada_kinematics: {
    id: 'three-loader-collada-kinematics',
    directory: 'three-loader-collada-kinematics',
    name: 'collada - kinematics — three.js r186',
    description: 'Unmodified official webgl_loader_collada_kinematics module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '4039717283dcf1e15d6dd38f407f2c651d583c23d0e021b19b8fa06667092a26',
      module: '47825636c4797a252f79e958861d851936314325b99a11bc1034869b7fe32812'
    },
    addonShims: {
      'three/addons/loaders/ColladaLoader.js': preparedColladaLoaderShim()
    },
    discoverAssets: true,
    assets: [{
      url: 'models/collada/abb_irb52_7_120.dae',
      output: 'models__collada__abb_irb52_7_120.dae',
      mime: 'application/xml', prepareCollada: true,
      sha256: 'd016d827423984a2b8f3d0052074304d4ae3f0b0e69663c3c7d9a9523b6317d6'
    }]
  },
  webgl_loader_collada_skinning: {
    id: 'three-loader-collada-skinning',
    directory: 'three-loader-collada-skinning',
    name: 'collada - skinning — three.js r186',
    description: 'Unmodified official webgl_loader_collada_skinning module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '8be3ad01914e8d2ce4eb81a630f31a61c8c9912af52eb68195240fd75703e368',
      module: '5785fcc9370fac33b9b4e81de23ade1a277f9a56c117ade882771144efe15372'
    },
    assets: []
  },
  webgl_loader_draco: {
    id: 'three-loader-draco',
    directory: 'three-loader-draco',
    name: 'loaders - Draco loader — three.js r186',
    description: 'Unmodified official webgl_loader_draco module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '9f13086a8563d24339c701efdf84c4a33a6e1e490414a507819116a04e1c160a',
      module: '2210ceb45a1ed060224752da9685c270af787dc51157a3d3b35f954d6ed648ab'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_loader_fbx: {
    id: 'three-loader-fbx',
    directory: 'three-loader-fbx',
    name: 'FBX loader — three.js r186',
    description: 'Unmodified official webgl_loader_fbx module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '9ad3920575e7a36a2a7797f9ed520d901eccca50de17ec016c3ab1070fe0b839',
      module: 'fdf0048c372f466499603a4e5a9d1dc835080b20df3764c8d172f326100a005f'
    },
    assets: []
  },
  webgl_loader_fbx_nurbs: {
    id: 'three-loader-fbx-nurbs',
    directory: 'three-loader-fbx-nurbs',
    name: 'FBX loader - Nurbs — three.js r186',
    description: 'Unmodified official webgl_loader_fbx_nurbs module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '14e1f463464a16ef4552171c516da45edca62a4b9503aa4991390aa0d73c76df',
      module: 'ee31f759454be8b6e9e18dad180a90ac1ba10c5a59f2c3427e9d613b9bb142b9'
    },
    assets: []
  },
  webgl_loader_gcode: {
    id: 'three-loader-gcode',
    directory: 'three-loader-gcode',
    name: 'loaders - GCode loader — three.js r186',
    description: 'Unmodified official webgl_loader_gcode module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '4dfd6074651e2a95658679539d869e4d92fd4c53d336ff431b201cee7f8fb642',
      module: 'e2267ffbe56df1d6c11e2ab94ec7b90381f5f50db4f9aabf8f5fc7ee2d6edaad'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_loader_gltf: {
    id: 'three-loader-gltf',
    directory: 'three-loader-gltf',
    name: 'GLTFloader — three.js r186',
    description: 'Unmodified official webgl_loader_gltf module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '46564bbb6dc5abbfee13d3718c9853a11ba734087760d89174963e43bf0d5695',
      module: 'ac1330273f078a23cd8d984375b8ba162506ad3ca913bbe2e041cffe92052013'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_loader_gltf_animation_pointer: {
    id: 'three-loader-gltf-animation-pointer',
    directory: 'three-loader-gltf-animation-pointer',
    name: 'animation - keyframes — three.js r186',
    description: 'Unmodified official webgl_loader_gltf_animation_pointer module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '43e8e73510ab4a689decf61fcdf8e4596336fdc6af6e2d5938ce0ca7d4e9b7e2',
      module: 'b56aa30ca003d493c33bc7d21536c4e48cde2074b9bb8cc8ebcdcd94952f5f4c'
    },
    assets: []
  },
  webgl_loader_gltf_anisotropy: {
    id: 'three-loader-gltf-anisotropy',
    directory: 'three-loader-gltf-anisotropy',
    name: 'GLTFloader + Anisotropy — three.js r186',
    description: 'Unmodified official webgl_loader_gltf_anisotropy module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'aeabd8b5985d438afc60f72f83f6495e47b744ce32f8160ac7724ce38b6361b8',
      module: '7d8ecb38a834ac6101ccd205e70be2236cc738c859d6a326f4f7c4f5ab1d0551'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_loader_gltf_avif: {
    id: 'three-loader-gltf-avif',
    directory: 'three-loader-gltf-avif',
    name: 'GLTFloader + EXT_texture_avif — three.js r186',
    description: 'Unmodified official webgl_loader_gltf_avif module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'f6b3e0d31c97a7e78333ea7255ca249f112f82e56704ab7680f98a772f6b3f61',
      module: 'f283071fe8d4159a83da990b0076230985cdf63e562f4af28a45f6d9538cc7de'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_loader_gltf_compressed: {
    id: 'three-loader-gltf-compressed',
    directory: 'three-loader-gltf-compressed',
    name: 'GLTFloader + compressed — three.js r186',
    description: 'Unmodified official webgl_loader_gltf_compressed module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'e1537edce61b1b41ba057a00150c41c2030f6bb0131a46db7c70ecfad2b03413',
      module: '22ec9dbebafd54928146af0b87703233da4d0ce5bfc1e784be057297c3abcf36'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_loader_gltf_dispersion: {
    id: 'three-loader-gltf-dispersion',
    directory: 'three-loader-gltf-dispersion',
    name: 'GLTFloader + Dispersion — three.js r186',
    description: 'Unmodified official webgl_loader_gltf_dispersion module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '6822f939b081ebb4a99d49c74491a5e56f19704046fc0270dbbc7feee276726a',
      module: '2daed2bbce66d791cc73ecf9fd65d59f015f47a9fe28873f3f2b529f96e337df'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_loader_gltf_instancing: {
    id: 'three-loader-gltf-instancing',
    directory: 'three-loader-gltf-instancing',
    name: 'GLTFloader + Instancing — three.js r186',
    description: 'Unmodified official webgl_loader_gltf_instancing module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'd0a5ccd5df8fb32dc9a17f2aa6ac2c29ac0ddb6b1d472fae90ec66d7f9891296',
      module: 'd3e63ccfc116efab51f5a8f2305bdbd6635425e99eae455e84fd98d8296b383f'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_loader_gltf_iridescence: {
    id: 'three-loader-gltf-iridescence',
    directory: 'three-loader-gltf-iridescence',
    name: 'GLTFloader + Iridescence — three.js r186',
    description: 'Unmodified official webgl_loader_gltf_iridescence module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '6f0d8183c62d8746870bd3d65532c75acc2e20c84930b7ac9d5ff67b5b7d72d6',
      module: 'bf429234169eb56702419bfc9ae0c51a8fcace9393f72e0a6e279f77b818d588'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_loader_gltf_progressive_lod: {
    id: 'three-loader-gltf-progressive-lod',
    directory: 'three-loader-gltf-progressive-lod',
    name: 'GLTF with progressive loading — three.js r186',
    description: 'Unmodified official webgl_loader_gltf_progressive_lod module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'ebe4720fef3c7d36ea834967d27586f7d0bd963a93e3da86c3b51688b8011edf',
      module: 'a0e834bbaf145b3b21ddc08fae4c15d2a51a9fe85576cd352efd581a42c11b60'
    },
    assets: []
  },
  webgl_loader_gltf_sheen: {
    id: 'three-loader-gltf-sheen',
    directory: 'three-loader-gltf-sheen',
    name: 'GLTFloader + Sheen — three.js r186',
    description: 'Unmodified official webgl_loader_gltf_sheen module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'b4b191f40cfe8b327da443119d95aa1ea43d5a9aa5a1b389be9e87cca9981ee5',
      module: '31248009ced4e9b9c761bb6549fc76fd48284295de91976a118e1b0afcbc686d'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_loader_gltf_transmission: {
    id: 'three-loader-gltf-transmission',
    directory: 'three-loader-gltf-transmission',
    name: 'GLTFloader + transmission — three.js r186',
    description: 'Unmodified official webgl_loader_gltf_transmission module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '6a604abcba0a092dbdff61e19eb897aa58b869e19534e20f3e0b308fed6cb704',
      module: '715287a7e3e61cca41d2109e365187d300f989ca6a7efcc9ed47fb6ab4afbd59'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_loader_gltf_variants: {
    id: 'three-loader-gltf-variants',
    directory: 'three-loader-gltf-variants',
    name: 'GLTFloader + variants — three.js r186',
    description: 'Unmodified official webgl_loader_gltf_variants module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'a6d1e8fa8e31b5cc5e1dfe37bc4f248bb96e15199aed0d081d1d91581f0d445c',
      module: '7d8ab3353eb9f428939a82666a02c3da105b0788f7793c7c8d1e8b1139a30769'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_loader_ifc: {
    id: 'three-loader-ifc',
    directory: 'three-loader-ifc',
    name: 'IFCLoader — three.js r186',
    description: 'Unmodified official webgl_loader_ifc module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '16bb9fbfac63210fb315a06d81edb95b105052aae5917e21232b9b5186012f56',
      module: '91010b984ba8c5934a725b9b022b9e0741c04aadc043a5fd613a6d24b72a37aa'
    },
    assets: []
  },
  webgl_loader_imagebitmap: {
    id: 'three-loader-imagebitmap',
    directory: 'three-loader-imagebitmap',
    name: 'loader - ImageBitmap — three.js r186',
    description: 'Unmodified official webgl_loader_imagebitmap module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '3616505634c77365a36f6d7a4c6445357df244df8aa14daa13509a827ec33d24',
      module: 'cb3546dfc28d1dfc4444cbc1b0ba683f9304256133daebc3a86efd6518221589'
    },
    assets: []
  },
  webgl_loader_kmz: {
    id: 'three-loader-kmz',
    directory: 'three-loader-kmz',
    name: 'KMZLoader — three.js r186',
    description: 'Unmodified official webgl_loader_kmz module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'af1e01ea1dd3f22cccbdc09a572c5889338837ca7b0a043b2d98371f68d86ea2',
      module: '191ed83bae51c15a8915bc677d8ed37bf630e4098c556c37e590b25408710da5'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_loader_ldraw: {
    id: 'three-loader-ldraw',
    directory: 'three-loader-ldraw',
    name: 'LDrawLoader — three.js r186',
    description: 'Unmodified official webgl_loader_ldraw module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'ca8c1279fecd8707e599961882a65e4243aa22abcbecb511c3189fdfda679837',
      module: '6e2312b5c918168418957bd9304fffecb2dfca572438f88e5975e4832b0e0afa'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_loader_md2: {
    id: 'three-loader-md2',
    directory: 'three-loader-md2',
    name: 'morphtargets - MD2 — three.js r186',
    description: 'Unmodified official webgl_loader_md2 module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '633e5d216df5ccfbbc00f12fab48842df9649685005c7d0e1ac886573871061b',
      module: '6b3d809722cb7838f3b287f49d89e9b67f9f58dac2f58d3c70c988ac8cfc6b2b'
    },
    assets: []
  },
  webgl_loader_md2_control: {
    id: 'three-loader-md2-control',
    directory: 'three-loader-md2-control',
    name: 'morphtargets - MD2 controls — three.js r186',
    description: 'Unmodified official webgl_loader_md2_control module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'e7af43b29f8e44893eff1ed92da36554e1b458e951ff6686251d3d9e464781da',
      module: 'dbe9112206694aec5aa2a723934783f134ebdf5e282b0a3824e54c5a5e0fb4b1'
    },
    assets: []
  },
  webgl_loader_mdd: {
    id: 'three-loader-mdd',
    directory: 'three-loader-mdd',
    name: 'Loader MDD — three.js r186',
    description: 'Unmodified official webgl_loader_mdd module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '1f2ac7b4f32ea19d433762c8cadb1e3f85bc2303fefdfb75b55ef32556ebb0ad',
      module: '6d445b814eaec02bd37c9fd725373025833c76f28daa8f35209a9ea15566063b'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_loader_nrrd: {
    id: 'three-loader-nrrd',
    directory: 'three-loader-nrrd',
    name: 'loaders - NRRD loader — three.js r186',
    description: 'Unmodified official webgl_loader_nrrd module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '8b7a3ce401dfb916364d0424f4cb4b555f23daba408a6b83765d1ae8911508fd',
      module: '1b580ee34fe79c898420e9fa47a49fc30eb399180e4fb9f78af4efc879236ab4'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_loader_pdb: {
    id: 'three-loader-pdb',
    directory: 'three-loader-pdb',
    name: 'molecules — three.js r186',
    description: 'Unmodified official webgl_loader_pdb module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'ed16fe831ea2d161e870f594e7d4113d01aad05f7fe9f3c653d40181910f5bb6',
      module: '4a158ab6fe3f410c22c1b3678bf6e3e8d267e07b403a8cd7ca85257780f0e52e'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_loader_texture_dds: {
    id: 'three-loader-texture-dds',
    directory: 'three-loader-texture-dds',
    name: 'materials - compressed textures — three.js r186',
    description: 'Unmodified official webgl_loader_texture_dds module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '124c55dfa997841b4ed3b0b27cd1e2ce871fa4d4db1f703bbae764872411b672',
      module: 'f818496949c2090c0e995662c7dfc916b3b85d826527f57e1c2fc24166867d46'
    },
    assets: []
  },
  webgl_loader_texture_exr: {
    id: 'three-loader-texture-exr',
    directory: 'three-loader-texture-exr',
    name: 'materials - EXR texture loader — three.js r186',
    description: 'Unmodified official webgl_loader_texture_exr module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'e1c47f465b8a08d1536f151926101db5caaba80c3cabb8773a209033b31427fd',
      module: 'cdcd6b6caa5f7100053ca7c95c07654b2dc55700f576e954165008f4f0542051'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_loader_texture_hdr: {
    id: 'three-loader-texture-hdr',
    directory: 'three-loader-texture-hdr',
    name: 'materials - HDR texture loader — three.js r186',
    description: 'Unmodified official webgl_loader_texture_hdr module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '6c1d4dafed6fa9ccdf4cf7d66b0d5e34242449ee6ec69a9f6009c7798d76895d',
      module: 'fbac30e30798599ba786852f0d77485dc44e16e339e82c760a784a7a83f4fdff'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_loader_texture_ktx: {
    id: 'three-loader-texture-ktx',
    directory: 'three-loader-texture-ktx',
    name: 'materials - compressed textures — three.js r186',
    description: 'Unmodified official webgl_loader_texture_ktx module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'f5bbdb355bb7b95823457dc5ae1afae3f6be5aa19f4eb3ec6c9ca31532ef84d9',
      module: 'dea4d39ec3d78288b6c42318ffec253de32ed1c04ce337fe2801bc587eb39947'
    },
    assets: []
  },
  webgl_loader_texture_ktx2: {
    id: 'three-loader-texture-ktx2',
    directory: 'three-loader-texture-ktx2',
    name: 'KTX2 texture loader — three.js r186',
    description: 'Unmodified official webgl_loader_texture_ktx2 module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '023d48c7ea9585d40c3dca72e5b32980dcecaa7a2f94061c8ae6e397a2f26d84',
      module: 'de2e97c4ad08cf2f77bb50a36ae158a6a2541d26b63f416c3555679d15336876'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_loader_texture_lottie: {
    id: 'three-loader-texture-lottie',
    directory: 'three-loader-texture-lottie',
    name: 'lottie loader — three.js r186',
    description: 'Unmodified official webgl_loader_texture_lottie module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '7f90e7315a5e0646e6da8fe4fd30006ed5737a6194d86f79a04428bf7a6962a8',
      module: 'bb5901b59a83b6349789e84a56b702967b2c0e3981a5eba508e6bc9e9c576b36'
    },
    assets: []
  },
  webgl_loader_texture_pvrtc: {
    id: 'three-loader-texture-pvrtc',
    directory: 'three-loader-texture-pvrtc',
    name: 'materials - compressed textures — three.js r186',
    description: 'Unmodified official webgl_loader_texture_pvrtc module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '7b7005a70fd899a28c83173efdd53a26a41af4da759f2be15c96d48d895e8bfe',
      module: '26a9bb477d8b4f941d42c44c5918cf1210e0ce104a5d082dc542e25ac0603f49'
    },
    assets: []
  },
  webgl_loader_texture_tiff: {
    id: 'three-loader-texture-tiff',
    directory: 'three-loader-texture-tiff',
    name: 'materials - TIFF texture — three.js r186',
    description: 'Unmodified official webgl_loader_texture_tiff module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '6279a81061acb1fc20cbc261208afc02e3185be81a519c291ec29bfbdbb462f9',
      module: '4c8edad288f986d9a023cc700ab68c316d0f081b80a1b93e93fdff92e27831bb'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_loader_texture_ultrahdr: {
    id: 'three-loader-texture-ultrahdr',
    directory: 'three-loader-texture-ultrahdr',
    name: 'materials - UltraHDR texture loader — three.js r186',
    description: 'Unmodified official webgl_loader_texture_ultrahdr module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'f6dccb386d35cd18f347b9af471022e2ac32d5c3bc373eeced650b5bfb67a872',
      module: '9c292884c6082f4702792046adce6ab7d8cbcf7a5148215147325b859e8006ce'
    },
    assets: []
  },
  webgl_loader_ttf: {
    id: 'three-loader-ttf',
    directory: 'three-loader-ttf',
    name: 'loader - ttf — three.js r186',
    description: 'Unmodified official webgl_loader_ttf module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '862381a762da708c344e0d1919054f8d5e470ec30f9a32b82343fe30c4a04c8f',
      module: '5a6b18fa2efc9d3935b901d813929df56e595074b2bd2ece2e3a2da22decf922'
    },
    assets: []
  },
  webgl_loader_usdz: {
    id: 'three-loader-usdz',
    directory: 'three-loader-usdz',
    name: 'loaders - USDZLoader — three.js r186',
    description: 'Unmodified official webgl_loader_usdz module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'd45e9756fe5456e94acc6084db833a7ec7d2bf278bb254c1277f42e46cf1b046',
      module: 'b2253e4e903723acaece947589747bfc2b8fbf963da5fa143bcd3104b8687bf2'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_loader_vox: {
    id: 'three-loader-vox',
    directory: 'three-loader-vox',
    name: 'loaders - vox — three.js r186',
    description: 'Unmodified official webgl_loader_vox module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '9cf4ce7a6f61c05812ff3e786b694ec70237aae1aae97ffd271a657593139dbf',
      module: '77f57f8f3cc112df17e623041d8c03958d8104e8308aaa7bb5a609e5fec1e91b'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_loader_vrml: {
    id: 'three-loader-vrml',
    directory: 'three-loader-vrml',
    name: 'loaders - VRML loader — three.js r186',
    description: 'Unmodified official webgl_loader_vrml module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '2fcc9406cffb725ee89f140037b5d825449f4d1c516d469e7da065391085d065',
      module: '347a5492a0d8947a8815b9b04f030129b5c575460f00575bc18636a3762dcafd'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_marchingcubes: {
    id: 'three-marchingcubes',
    directory: 'three-marchingcubes',
    name: 'marching cubes — three.js r186',
    description: 'Unmodified official webgl_marchingcubes module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'c2aca655ee42782de978c974a2f8d8a6b07a6bbba3416e4b88283b552525359c',
      module: '0d997e00627a867dcc61feebeb5cb9e0f355db3a73d20bc622afb0c3a50e44dc'
    },
    assets: []
  },
  webgl_materials_alphahash: {
    id: 'three-materials-alphahash',
    directory: 'three-materials-alphahash',
    name: 'materials - alpha hash — three.js r186',
    description: 'Unmodified official webgl_materials_alphahash module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'ee15d839afe32e5909149c7761609568010fd5487172e79244c67faec461390f',
      module: '3fc81fa6a86fe3d72c2d325430190c93c14362dc6031a52eb250436f4cc23823'
    },
    assets: []
  },
  webgl_materials_blending_custom: {
    id: 'three-materials-blending-custom',
    directory: 'three-materials-blending-custom',
    name: 'materials - custom blending — three.js r186',
    description: 'Unmodified official webgl_materials_blending_custom module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'c4025f8196aba3b87023a44e8513b2d07bbfaa3009266a092057fa23951e7f86',
      module: '1dcdb5079b11cb808a4c201d5e9984967c3e2a9914db75fbb237e48ae915128a'
    },
    assets: []
  },
  webgl_materials_car: {
    id: 'three-materials-car',
    directory: 'three-materials-car',
    name: 'materials - car — three.js r186',
    description: 'Unmodified official webgl_materials_car module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'e362b6ebc8a5e6da4f05b2d4d6b09933b0c9ab88503b9690e0e598d5b2137ef8',
      module: '34c65d30b07b7b01d97adf805b828ec7601251dc0e7236b7d3040d4863f49c24'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_materials_cubemap_dynamic: {
    id: 'three-materials-cubemap-dynamic',
    directory: 'three-materials-cubemap-dynamic',
    name: 'materials - dynamic cube reflection — three.js r186',
    description: 'Unmodified official webgl_materials_cubemap_dynamic module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '5cb03de22a45e53c571d9a9ac331113ae7ac33560028981de7f4ba7f89f05169',
      module: '4f6d865d179963ee48ca2e7df3705f6f1ecb41b4f79e644bfb01e0e00484be6b'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_materials_cubemap_mipmaps: {
    id: 'three-materials-cubemap-mipmaps',
    directory: 'three-materials-cubemap-mipmaps',
    name: 'materials - cubemap mipmaps — three.js r186',
    description: 'Unmodified official webgl_materials_cubemap_mipmaps module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '81b8fbd05b839fe09d63ffa57c5437a8b2c41a12ce165f366d57b12bbf43d07b',
      module: 'c389d5c2b0d8915429ead2667dc9da72a938178ca0d3601be04afb68a7d81683'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_materials_cubemap_render_to_mipmaps: {
    id: 'three-materials-cubemap-render-to-mipmaps',
    directory: 'three-materials-cubemap-render-to-mipmaps',
    name: 'materials - cubemap mipmaps — three.js r186',
    description: 'Unmodified official webgl_materials_cubemap_render_to_mipmaps module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'be81d353ef03d8d4c7efe1adbac629fe7bbddfec95801a2eb829dd609b4fdabc',
      module: '5d81ebfb68a58974efd263296a5f14719097745328ac78b86a0827062c3cbe29'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_materials_envmaps_exr: {
    id: 'three-materials-envmaps-exr',
    directory: 'three-materials-envmaps-exr',
    name: 'Materials Envmaps EXR — three.js r186',
    description: 'Unmodified official webgl_materials_envmaps_exr module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'ddf161a1c589e9728b7ede5b656da28e2020840f65ba5edac89985c72f7669ff',
      module: '8114d7691e37ce972d26e380a9115a9a8847c4b718752e305f28e54d020bf2e1'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_materials_envmaps_fasthdr: {
    id: 'three-materials-envmaps-fasthdr',
    directory: 'three-materials-envmaps-fasthdr',
    name: 'Materials Envmaps Fasthdr — three.js r186',
    description: 'Unmodified official webgl_materials_envmaps_fasthdr module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'c4a15cd7ecfee7ef26ffa057cc73151ec2458a95c2e6b342fd8e5f5cbcec4622',
      module: 'd3497f62f015a8dabf80bb6e779f150eda71144e88ce9ea606c671bf5896b915'
    },
    addonShims: {
      'three/addons/loaders/KTX2Loader.js': remoteHdrKtx2LoaderShim()
    },
    discoverAssets: true,
    assets: [{
      url: 'textures/equirectangular/blouberg_sunrise_2_1k.hdr',
      output: 'blouberg_sunrise_2_1k.hdr.rgba',
      mime: 'image/vnd.radiance', hdrRgba: true,
      sha256: '1cb809a131ff3cb7df94b639d5967fc6fc08ecd25b6c43930af3b5d99f1d8855'
    }]
  },
  webgl_materials_envmaps_groundprojected: {
    id: 'three-materials-envmaps-groundprojected',
    directory: 'three-materials-envmaps-groundprojected',
    name: 'Materials Envmaps Groundprojected — three.js r186',
    description: 'Unmodified official webgl_materials_envmaps_groundprojected module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '17998c545c4f3b5eef81f66da7ac5f98f0091e00e7a1733581eeceba947c08c7',
      module: '4908129b3d8ad4f2d606234923b12be115d5caeb8bb8de77dc7a28126beb6b3f'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_materials_envmaps_hdr: {
    id: 'three-materials-envmaps-hdr',
    directory: 'three-materials-envmaps-hdr',
    name: 'Materials Envmaps HDR — three.js r186',
    description: 'Unmodified official webgl_materials_envmaps_hdr module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '72869b5fdc7ed08edd3bd638ea8be867dce9c43e4fc4683733db515947428580',
      module: 'ef233a58c6b24f7f6ae5101eab7527359abd1c86b02abfdb3f90cd9643eb760c'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_materials_physical_transmission: {
    id: 'three-materials-physical-transmission',
    directory: 'three-materials-physical-transmission',
    name: 'Materials Physical Transmission — three.js r186',
    description: 'Unmodified official webgl_materials_physical_transmission module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '53574f462a5578c31e7add5506415f78ddd0deaa68a71cad4bc993319b198060',
      module: '494f3562007e6da414a3a5683ba2f901d285838c186cfeb7288dd801d9142e6b'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_materials_physical_transmission_alpha: {
    id: 'three-materials-physical-transmission-alpha',
    directory: 'three-materials-physical-transmission-alpha',
    name: 'Materials Physical Transmission Alpha — three.js r186',
    description: 'Unmodified official webgl_materials_physical_transmission_alpha module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '0e2d88df8deaf5881d1c3667c7dc11d788f10093830ab98a91c12d6c02272804',
      module: '951d83cb01d4ecd1846f5bbc618eed2ae57a88dc49c40c2b60631b045110e18b'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_materials_subsurface_scattering: {
    id: 'three-materials-subsurface-scattering',
    directory: 'three-materials-subsurface-scattering',
    name: 'Fast subsurface scattering in Blinn-Phong shading demo — three.js r186',
    description: 'Unmodified official webgl_materials_subsurface_scattering module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'ebb175bc77ccc8b493c49f7c15ccaba5e70d39bbc5634c407d59e943b454e8e3',
      module: '8ad16204df62a961c7e4f1a1e8701e1fbb4298f2b8fc636fa94851fc72da39a1'
    },
    assets: []
  },
  webgl_materials_texture_html: {
    id: 'three-materials-texture-html',
    directory: 'three-materials-texture-html',
    name: 'materials - html texture — three.js r186',
    description: 'Unmodified official webgl_materials_texture_html module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'd6607aab8c1c61f080ac90cab7b198fe62e347262b715f4e738a076edf10abdc',
      module: 'b0fd81f68d4dd45c11b29454a407d050943f60a76c6529c1f55d8609c7b9b302'
    },
    assets: []
  },
  webgl_materials_texture_manualmipmap: {
    id: 'three-materials-texture-manualmipmap',
    directory: 'three-materials-texture-manualmipmap',
    name: 'materials - manual mipmaping — three.js r186',
    description: 'Unmodified official webgl_materials_texture_manualmipmap module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '59e775b82821b759caad44ccc2bd9976a7fd8b13928ace93ae25a0099b93742d',
      module: '4971a60ae286bdbffd748dc066bb759ce40e828e07115aff4a8b46a3ae048674'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_materials_video: {
    id: 'three-materials-video',
    directory: 'three-materials-video',
    name: 'materials - video — three.js r186',
    description: 'Unmodified official webgl_materials_video module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'e013960d549060f0a9a5513cdf8b13a9182b71689881395b492145d9bab4d87c',
      module: '87e97a8cb7bda7201e4519da38f9c8eb41fad68cd31f4fa28ec752899ab10aa6'
    },
    assets: []
  },
  webgl_materials_video_webcam: {
    id: 'three-materials-video-webcam',
    directory: 'three-materials-video-webcam',
    name: 'materials - video - webcam — three.js r186',
    description: 'Unmodified official webgl_materials_video_webcam module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '5e31f0edbe18c6bc30d521443eccff058af9e6a7fe655539ebef5213c75a069a',
      module: '024a661b385e0d0ae89594c3eb6fe1152e580874f672280ff748b77dd2007bd9'
    },
    assets: []
  },
  webgl_mesh_batch: {
    id: 'three-mesh-batch',
    directory: 'three-mesh-batch',
    name: 'mesh - batch — three.js r186',
    description: 'Unmodified official webgl_mesh_batch module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'b4dd967f53fe7fe823fde275049e3cdad8dd0703f1cf082677d0e2298e41c7b0',
      module: '2769a520666b9ba7bcc655945777b4fa5bc6ad38e0668e0bdd9d2d1a7860ac82'
    },
    assets: []
  },
  webgl_mirror: {
    id: 'three-mirror',
    directory: 'three-mirror',
    name: 'mirror — three.js r186',
    description: 'Unmodified official webgl_mirror module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '1ca2cf1c05ea2ab4792fe1e24c109f403743fca3b6e3fd85193e25d30088af9d',
      module: 'ab230979ae647beadd6a0f9ed4253fa624dd6876c7d962224ac7fa93acadf3ae'
    },
    assets: []
  },
  webgl_modifier_curve: {
    id: 'three-modifier-curve',
    directory: 'three-modifier-curve',
    name: 'curve modifier — three.js r186',
    description: 'Unmodified official webgl_modifier_curve module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '10791eb088492becd320081b4ce0434bdeeab0eaf454891d4538e3442d4066a6',
      module: '2e007b3db942e50c66098ba697c9d21f60353a2a50825f58cb5d21ddcc86114b'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_modifier_curve_instanced: {
    id: 'three-modifier-curve-instanced',
    directory: 'three-modifier-curve-instanced',
    name: 'curve modifier - instanced — three.js r186',
    description: 'Unmodified official webgl_modifier_curve_instanced module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '0181008e92187be2bffc5d6e8e20e46e7dc378f6f68f7d57a332691741769d48',
      module: '76b8e9e196fe3f40deb40ad3f3de99de579780787846c82ac67c04aec1d0883e'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_morphtargets_face: {
    id: 'three-morphtargets-face',
    directory: 'three-morphtargets-face',
    name: 'morph targets - face — three.js r186',
    description: 'Unmodified official webgl_morphtargets_face module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '61f1b2210d4591d7be198275299e602f0e18181d06d1766d1441ac0de13d5ad5',
      module: '9fefd38a7519fdc22e77cd39c46e58165940bc38eecc81ac49864c7e220e4987'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_morphtargets_horse: {
    id: 'three-morphtargets-horse',
    directory: 'three-morphtargets-horse',
    name: 'morph targets - horse — three.js r186',
    description: 'Unmodified official webgl_morphtargets_horse module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '7b3cbce8efbebdd90df29f8a4019ce0a203959004b8f5c8b97381acd1c3d840f',
      module: '1150e606493286f9eb6e0a70ec26e25a703531717ab9a9131e5f98f8ab6d43b7'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_morphtargets_webcam: {
    id: 'three-morphtargets-webcam',
    directory: 'three-morphtargets-webcam',
    name: 'morph targets - webcam — three.js r186',
    description: 'Unmodified official webgl_morphtargets_webcam module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '796c056faaf559a232adae07c74bbf0ca65bea8fee5e71450d11b2d404a83920',
      module: 'c8eac3d132360cb3959f64fe1888b27119ddfe30f44f8a0c486c15c7c8ae4c76'
    },
    assets: []
  },
  webgl_multiple_elements: {
    id: 'three-multiple-elements',
    directory: 'three-multiple-elements',
    name: 'multiple elements — three.js r186',
    description: 'Unmodified official webgl_multiple_elements module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '844f58c11ff8bab14ab39e9103fa7746aca1cf054dbbd9dfcb9fce118411a6b2',
      module: 'b57809a74961c4e34fa28242ecc6d914ae0174b90725911c318c68125c3d5ae7'
    },
    assets: []
  },
  webgl_multiple_elements_text: {
    id: 'three-multiple-elements-text',
    directory: 'three-multiple-elements-text',
    name: 'multiple elements with text — three.js r186',
    description: 'Unmodified official webgl_multiple_elements_text module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'b308c6d9e82e01a21b9373c8aef92860ede881d038cb30be4e476378c53f7781',
      module: 'afc2bed0e3ca62750c111374eb6cdb3ac2ef22a797569814df0229272787c59a'
    },
    assets: []
  },
  webgl_multiple_rendertargets: {
    id: 'three-multiple-rendertargets',
    directory: 'three-multiple-rendertargets',
    name: 'Multiple Render Targets — three.js r186',
    description: 'Unmodified official webgl_multiple_rendertargets module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '5df936e5dea98d7dff3ddeae29454e826e81eea65bcfcf9968b4570dbe9a0c59',
      module: 'c14a5b21f25c06947a60a54eb0cf92577b8d9e849108e2524d66a6d746bcf425'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_multisampled_renderbuffers: {
    id: 'three-multisampled-renderbuffers',
    directory: 'three-multisampled-renderbuffers',
    name: 'Multisampled Renderbuffers — three.js r186',
    description: 'Unmodified official webgl_multisampled_renderbuffers module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '3ac5cd6ec3ebf82fbff6204c6d5afa9e1716b1b984727faa0fea56b964d0239e',
      module: '48c1e5b0346f3df497d16aedb87cb96e963c064d1bab4d82c1d76e51acff10cc'
    },
    assets: []
  },
  webgl_performance: {
    id: 'three-performance',
    directory: 'three-performance',
    name: 'GLTFloader — three.js r186',
    description: 'Unmodified official webgl_performance module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '06af6ab15d64cf9fc424c955067243646810c6be9d6ed12b753a032c75db9664',
      module: 'c300ddf94f7e231a250bdd024ae85bdb20d58f0e67e1733e0a2f829efc0ec9a2'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_pmrem_cubemap: {
    id: 'three-pmrem-cubemap',
    directory: 'three-pmrem-cubemap',
    name: 'pmrem cubemap — three.js r186',
    description: 'Unmodified official webgl_pmrem_cubemap module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'ff7063edc37520c26514897c87a4188c060ed740eefc7967bf750dfa5eb8ea3b',
      module: '762b5d1f0eccdb350ccf0ed7f9005084be323dd941cf178b044c1d49accbf23b'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_pmrem_equirectangular: {
    id: 'three-pmrem-equirectangular',
    directory: 'three-pmrem-equirectangular',
    name: 'pmrem equirectangular — three.js r186',
    description: 'Unmodified official webgl_pmrem_equirectangular module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '223968372809c4dc0e5087d4c0fbf447a92b67e85d8c0867fc11e3b9d6976b19',
      module: '72d9f3656c6ece1778670febb77414cc38e373b4a3b37d77b77a8573eee467e0'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_pmrem_test: {
    id: 'three-pmrem-test',
    directory: 'three-pmrem-test',
    name: 'PMREM Test — three.js r186',
    description: 'Unmodified official webgl_pmrem_test module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '6f6a4366f0376910edd25fa87b97d2cebaf1a35648e444ab9148bb4a63a0d861',
      module: 'ae61a3883372f5d058310f24c0a85ed597431bdfb5671bc98786d3642acb23d8'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_points_dynamic: {
    id: 'three-points-dynamic',
    directory: 'three-points-dynamic',
    name: 'particles - dynamic - postprocessing — three.js r186',
    description: 'Unmodified official webgl_points_dynamic module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'e58edb41d59f4936e0f992fb079b0155d88e9b2ebe274117ec898ee59f7aa491',
      module: '924b88f2ccc330175252a55890b2cac8ab04199390843a8eac49f11f1f39ee8e'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_portal: {
    id: 'three-portal',
    directory: 'three-portal',
    name: 'portal — three.js r186',
    description: 'Unmodified official webgl_portal module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'f6b24f2cacf3c38da74f42d8851753ac6791aeacc0cb77110babddaca5f7072f',
      module: '4d134e45a00b35316b8a1f1e70e5bf906b88bfe683fe5cba8e97079339d52839'
    },
    assets: []
  },
  webgl_postprocessing: {
    id: 'three-postprocessing',
    directory: 'three-postprocessing',
    name: 'postprocessing — three.js r186',
    description: 'Unmodified official webgl_postprocessing module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '2643be173de09bb638683d133d2467eb4593b2e238b49fcbbbbb6a65d25330a4',
      module: '302a2342279ebf8dbdcf1cfc5142ff24b4d2d5547c7e60e7627b4d9197539796'
    },
    assets: []
  },
  webgl_postprocessing_3dlut: {
    id: 'three-postprocessing-3dlut',
    directory: 'three-postprocessing-3dlut',
    name: '3d luts — three.js r186',
    description: 'Unmodified official webgl_postprocessing_3dlut module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '3f57b9d77cee8978fcf614285016bf76a3de40c529aada12a238afc0fe7f68e3',
      module: '3cc7d3eca9c59b868e5acc9cea17735cc61c42912d4e82f5ebbf90bc4f00d6de'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_postprocessing_advanced: {
    id: 'three-postprocessing-advanced',
    directory: 'three-postprocessing-advanced',
    name: 'postprocessing — three.js r186',
    description: 'Unmodified official webgl_postprocessing_advanced module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'a1a0bad144ca0c8f7ec041e35094b4ffade79583f5ec5ce8f161bcdc6a14f5b4',
      module: '4cf957fb47e59c410e1720afc8b8623d64c89d93d84a14a076089b2331f10a02'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_postprocessing_afterimage: {
    id: 'three-postprocessing-afterimage',
    directory: 'three-postprocessing-afterimage',
    name: 'postprocessing - afterimage — three.js r186',
    description: 'Unmodified official webgl_postprocessing_afterimage module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '756d8a42b4ab624feffa2d6f3a538239033ccf03766410dd8dcf90f6e31796d0',
      module: '9a31add8a041ad4d3959defb45586e1d2841696bf29b9827a86ac1471030362e'
    },
    assets: []
  },
  webgl_postprocessing_backgrounds: {
    id: 'three-postprocessing-backgrounds',
    directory: 'three-postprocessing-backgrounds',
    name: 'postprocessing backgrounds — three.js r186',
    description: 'Unmodified official webgl_postprocessing_backgrounds module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '59cfe9f960efd98fe03f6ed3bcaebcf2d301d5314f87de344186bed78f622528',
      module: '9d5e88a362aa49029109fcb7af61477712dce54531c7495c7044d5c00860ef50'
    },
    assets: []
  },
  webgl_postprocessing_dof: {
    id: 'three-postprocessing-dof',
    directory: 'three-postprocessing-dof',
    name: 'postprocessing - depth-of-field — three.js r186',
    description: 'Unmodified official webgl_postprocessing_dof module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'fb11d4701c625832db304996ebe8fcf70c04da92b6bc3c19b6c61e1fe83e4462',
      module: '9ff7ab803a200f9b3691e37a1c585ce36e3eaaaf10a9400ab2f28039338adbc0'
    },
    assets: []
  },
  webgl_postprocessing_dof2: {
    id: 'three-postprocessing-dof2',
    directory: 'three-postprocessing-dof2',
    name: 'postprocessing - depth-of-field — three.js r186',
    description: 'Unmodified official webgl_postprocessing_dof2 module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'c68085e65ad3192e205aa5b7900d9bc597f2ba272ee09af693d340997c267d59',
      module: '7d453ac6fc7c29d0c7721366c79c971b2f92f8e90ddc456baaca8c7a30fe2323'
    },
    assets: []
  },
  webgl_postprocessing_fxaa: {
    id: 'three-postprocessing-fxaa',
    directory: 'three-postprocessing-fxaa',
    name: 'Postprocessing FXAA — three.js r186',
    description: 'Unmodified official webgl_postprocessing_fxaa module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'cb9af97322fbcf4ef08336e41d2a60f20d1c41fa78f8cc1871705fd22d5b17c2',
      module: 'c5211e3a6e1f264c4c0cfe6e03eccf066c74759fc07c77fac9989db1ca76a4fc'
    },
    assets: []
  },
  webgl_postprocessing_glitch: {
    id: 'three-postprocessing-glitch',
    directory: 'three-postprocessing-glitch',
    name: 'postprocessing - digital glitch — three.js r186',
    description: 'Unmodified official webgl_postprocessing_glitch module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'aa631a6123bf97c0d3d68695f21c2283a7cc286074b176ad0afd696db42cf596',
      module: 'd76f49bac3541631dec0cd67ba0ccb6dae9b7091ce9290f20e74ad6aa8fdf34e'
    },
    assets: []
  },
  webgl_postprocessing_godrays: {
    id: 'three-postprocessing-godrays',
    directory: 'three-postprocessing-godrays',
    name: 'postprocessing - godrays — three.js r186',
    description: 'Unmodified official webgl_postprocessing_godrays module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '0d0d4a6bd0033766bdb5820fdb80f0a37cbe6347cde6be05b70de73fd1b8eb8f',
      module: 'b2c42d3bb5897b328236bf1022cc62e63f75d2016028db86ae93258758970eb8'
    },
    assets: []
  },
  webgl_postprocessing_gtao: {
    id: 'three-postprocessing-gtao',
    directory: 'three-postprocessing-gtao',
    name: 'postprocessing - GTAO — three.js r186',
    description: 'Unmodified official webgl_postprocessing_gtao module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '866c247da716612a4d8fef0ea15bb35029a95fad17e9471058504ba9d83d215f',
      module: 'eb741ba1bdca7ef6154f2302ba77c7a1c2ad7bee0280c32c70a597e4fd77c522'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_postprocessing_masking: {
    id: 'three-postprocessing-masking',
    directory: 'three-postprocessing-masking',
    name: 'postprocessing - masking — three.js r186',
    description: 'Unmodified official webgl_postprocessing_masking module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'dff6f7d8f8267cb5f6c90784056238dca42541591ea03646c83ad402e5000de6',
      module: 'ee8d6fd5e46b3c15a5c21d691abeb980a27a2d1570a3a84a1b36afceea4021e5'
    },
    assets: []
  },
  webgl_postprocessing_outline: {
    id: 'three-postprocessing-outline',
    directory: 'three-postprocessing-outline',
    name: 'post processing - Outline Pass — three.js r186',
    description: 'Unmodified official webgl_postprocessing_outline module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '56908a1236290fc58d727bb87cb3c98f9ba40a73db9185eb17024b362f5b6206',
      module: 'dc8ee0c75e27e3f403144bad943dffb5c68be2682b466d7549121a2b086c34f4'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_postprocessing_pixel: {
    id: 'three-postprocessing-pixel',
    directory: 'three-postprocessing-pixel',
    name: 'post processing - pixelation — three.js r186',
    description: 'Unmodified official webgl_postprocessing_pixel module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'ba74140e89cf87eb4875f3a74bfd9aec8e65bbd22d6d1904ef866a9579853fea',
      module: '266557aeea47d2f470ffdab3e947ed9ffb58b95314586cae2429ce5e9bb2beee'
    },
    assets: []
  },
  webgl_postprocessing_procedural: {
    id: 'three-postprocessing-procedural',
    directory: 'three-postprocessing-procedural',
    name: 'postprocessing procedural effects — three.js r186',
    description: 'Unmodified official webgl_postprocessing_procedural module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '85ef7347b0d7d202a2ea790d7590e1861e13f9ed830480ad1f6c47cc64e6f514',
      module: '1af4f2db5f7090836d5d4247b54d17cfc20f465474cc3c83287f21eeda282f4c'
    },
    assets: []
  },
  webgl_postprocessing_rgb_halftone: {
    id: 'three-postprocessing-rgb-halftone',
    directory: 'three-postprocessing-rgb-halftone',
    name: 'postprocessing RGB Halftone — three.js r186',
    description: 'Unmodified official webgl_postprocessing_rgb_halftone module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'cf04a51d84bb35cc0e7a33fb77f25b5be5fe7a70bfba98defb1d4c24210ee3d2',
      module: '21dabcfe83ffc5bf907e8fa5963cbd70e2f5ac632200d9142c8611db5bd5e44a'
    },
    assets: []
  },
  webgl_postprocessing_sao: {
    id: 'three-postprocessing-sao',
    directory: 'three-postprocessing-sao',
    name: 'post processing - Scalable Ambient Occlusion (SAO) — three.js r186',
    description: 'Unmodified official webgl_postprocessing_sao module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '00597698320b8b8afbde81b79ed06823804e5ada4f50bac20422e9e823e79a9e',
      module: '3ed537f5140cd96c06bdac40d0e747fe4c33e388fcfa7020644bb58f47f94927'
    },
    assets: []
  },
  webgl_postprocessing_smaa: {
    id: 'three-postprocessing-smaa',
    directory: 'three-postprocessing-smaa',
    name: 'postprocessing smaa — three.js r186',
    description: 'Unmodified official webgl_postprocessing_smaa module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '3cf9050ca04ef58d74bc65627227bef3bd538d05d3338f4020aaa4339dfe676d',
      module: '5a4db606c93e9a17530c20ffa4ca0b85deb23f10323c75f7f23f6e9fa099e30e'
    },
    assets: []
  },
  webgl_postprocessing_sobel: {
    id: 'three-postprocessing-sobel',
    directory: 'three-postprocessing-sobel',
    name: 'postprocessing - sobel (edge detection) — three.js r186',
    description: 'Unmodified official webgl_postprocessing_sobel module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '267051684a9a15db3fe1529650beaf04e3e88cce3a9e325f41cd51a63acc68b7',
      module: '1da2b987e9a0fbfc14810a56aa70f27d71c91a6e36a7c63c2b673b6e9e0dc765'
    },
    assets: []
  },
  webgl_postprocessing_ssaa: {
    id: 'three-postprocessing-ssaa',
    directory: 'three-postprocessing-ssaa',
    name: 'postprocessing manual ssaa — three.js r186',
    description: 'Unmodified official webgl_postprocessing_ssaa module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'ae46b36c6714bfd99f48ddf32adb6458de907ea79098783b5bba5e04008cc36a',
      module: '214cafc313bb177db42c6073df1a295ab346c6aa6b1e17e0441d509a30e7deec'
    },
    assets: []
  },
  webgl_postprocessing_ssao: {
    id: 'three-postprocessing-ssao',
    directory: 'three-postprocessing-ssao',
    name: 'postprocessing - Screen Space Ambient Occlusion — three.js r186',
    description: 'Unmodified official webgl_postprocessing_ssao module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '10fa42ef38150d3f9874c62864f8464b23f474cd1181044490401ef9f5024dd3',
      module: '59e0813713569371bbaa5a234a13c8d60281df29334e097729efa2776b4f83b2'
    },
    assets: []
  },
  webgl_postprocessing_ssr: {
    id: 'three-postprocessing-ssr',
    directory: 'three-postprocessing-ssr',
    name: 'postprocessing - Screen Space Reflection — three.js r186',
    description: 'Unmodified official webgl_postprocessing_ssr module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'c358f3cc7c563e469dc11be2d7dbb0579f100e5d2ff860b439ac8e8c524c8349',
      module: '2c2eeadc5d5e10c9cae9df9db7048f740addfaf21ff6685167ccc24861ee0a39'
    },
    addonShims: {
      'three/addons/postprocessing/SSRPass.js': ssrPassThroughShim()
    },
    discoverAssets: true,
    assets: []
  },
  webgl_postprocessing_taa: {
    id: 'three-postprocessing-taa',
    directory: 'three-postprocessing-taa',
    name: 'postprocessing manual taa and ssaa — three.js r186',
    description: 'Unmodified official webgl_postprocessing_taa module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '182a74d59e13414a88b2c2b4551595997b73de59ff8d6fc065277df575e5e7ee',
      module: '0e49f271543284d1349b43533bb86127f2bf396af091c2cd7f94f7762a55c4e0'
    },
    assets: []
  },
  webgl_postprocessing_transition: {
    id: 'three-postprocessing-transition',
    directory: 'three-postprocessing-transition',
    name: 'scenes transition — three.js r186',
    description: 'Unmodified official webgl_postprocessing_transition module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'c6e9dfee46147c95905210a15b73e09ff99aa24ee0a5bbf4264706082344a745',
      module: '998f5eacef55395f2f24bf19aaa92188ba26f7fb52bab0aa61ceb7f0b48913e2'
    },
    assets: []
  },
  webgl_postprocessing_unreal_bloom: {
    id: 'three-postprocessing-unreal-bloom',
    directory: 'three-postprocessing-unreal-bloom',
    name: 'postprocessing - unreal bloom — three.js r186',
    description: 'Unmodified official webgl_postprocessing_unreal_bloom module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'c9a014b1fc8cc57d3448e49bc4848a0c6dffebb7c4d05c92e198c00996d6d6c0',
      module: '64d4963fb1135ef97a2dfe70292c598f86ed675e3b414bac6fbffb5bca7b3550'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_postprocessing_unreal_bloom_selective: {
    id: 'three-postprocessing-unreal-bloom-selective',
    directory: 'three-postprocessing-unreal-bloom-selective',
    name: 'postprocessing - unreal bloom selective — three.js r186',
    description: 'Unmodified official webgl_postprocessing_unreal_bloom_selective module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '55e63e413e2d38f4f6b2b7153e6ea63742906b5258038abb4f8b5ffa3e911edb',
      module: 'f2656158135ed99b18140c154397f92804d0882939c9c44b8794f75069204df5'
    },
    assets: []
  },
  webgl_random_uv: {
    id: 'three-random-uv',
    directory: 'three-random-uv',
    name: 'random - uv — three.js r186',
    description: 'Unmodified official webgl_random_uv module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'a4ffb12f8d6ad45c5901abe401b0435418c83c61e11109ae66b9601b8ee73564',
      module: '22c3980618f009a4f42ef878378d5c7fad4bb2d7fba906dd2b89e58bb6c0ac60'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_raycaster_bvh: {
    id: 'three-raycaster-bvh',
    directory: 'three-raycaster-bvh',
    name: 'Raycaster BVH — three.js r186',
    description: 'Unmodified official webgl_raycaster_bvh module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'ec3276652a9c3c0591dcbd1bf55505a894e6ce67d1fff07d5e334fa484c18207',
      module: '82527c68e12110969f3a3a8fb2e0ede996f274bfd22ced814345ee507cf2d763'
    },
    assets: []
  },
  webgl_read_float_buffer: {
    id: 'three-read-float-buffer',
    directory: 'three-read-float-buffer',
    name: 'read float pixels — three.js r186',
    description: 'Unmodified official webgl_read_float_buffer module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '93540252e7b1472697648d4df7b5a5358c373d5a28d89f6904dfa467cfa7d79d',
      module: '82292a18591b12beaea51e00843660788ffcd4ef21d6c6cc396d8caf1d140ec0'
    },
    assets: []
  },
  webgl_refraction: {
    id: 'three-refraction',
    directory: 'three-refraction',
    name: 'Refraction — three.js r186',
    description: 'Unmodified official webgl_refraction module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '526ca2f257e812620ee09fed771494f01608000f5ee78fbe0c97ead4b529c18c',
      module: 'c848049e14d3542c37cf022629c90e4788bc0881d123b27fc79109b0bb7f52e9'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_renderer_pathtracer: {
    id: 'three-renderer-pathtracer',
    directory: 'three-renderer-pathtracer',
    name: 'three-gpu-pathtracer — three.js r186',
    description: 'Unmodified official webgl_renderer_pathtracer module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '44eed0eceac5fed0da348732afe0012e917b930778adb7047cd9f97935f5c647',
      module: 'ea81d81d1ce58c7ba65d2c453139d3b1ad78264242bcd9a0768d093dc1939f5f'
    },
    assets: []
  },
  webgl_rendertarget_texture2darray: {
    id: 'three-rendertarget-texture2darray',
    directory: 'three-rendertarget-texture2darray',
    name: '2D texture array framebuffer attachment — three.js r186',
    description: 'Unmodified official webgl_rendertarget_texture2darray module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '21765c3eed2ffb0cc91f92bdfb927a1c103d879d89fc9308e8d6618bdfe3dc33',
      module: '4b8357e9151e3d4df4773938554bbcf2bd9c3c307c50c877120b6151737b907f'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_reversed_depth_buffer: {
    id: 'three-reversed-depth-buffer',
    directory: 'three-reversed-depth-buffer',
    name: 'reverse depth buffer — three.js r186',
    description: 'Unmodified official webgl_reversed_depth_buffer module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '8f2fd46aef6572ef745f0814fb849955c734c5008a5dfb523a069b4ec6402b9e',
      module: 'f01068331c9d333fecfd64e894fd0b5b7517e0912b6869a009c28f2d1a5ef93e'
    },
    assets: []
  },
  webgl_sculpt: {
    id: 'three-sculpt',
    directory: 'three-sculpt',
    name: 'sculpt — three.js r186',
    description: 'Unmodified official webgl_sculpt module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '83c6e66f69c462a1dd942faae1fa79307cba1a0c46c7ecb0c75b6c0989b3b9ee',
      module: 'ffa7fbc7141e8eb84bf5605f140a25b41818e2b4adf963872a4775df2727efa3'
    },
    assets: []
  },
  webgl_shader_lava: {
    id: 'three-shader-lava',
    directory: 'three-shader-lava',
    name: 'materials - shaders [lava] — three.js r186',
    description: 'Unmodified official webgl_shader_lava module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '2747fd426279ead3cc5c68fa8253c547fc3e8c53e9dadb3772449bdad051c74e',
      module: '6715974dabc7010d7efd634340181b9e2598613fbbb6ec934a21cbc483ebe163'
    },
    assets: []
  },
  webgl_shaders_ocean: {
    id: 'three-shaders-ocean',
    directory: 'three-shaders-ocean',
    name: 'shaders - ocean — three.js r186',
    description: 'Unmodified official webgl_shaders_ocean module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '87b6965af1d05c32eebe21d1dba3e55c6b5981703c7c87992b359416fdc1ff5e',
      module: '1512f890e35a610458f94c484d754469e666c4b40d7bf2515f809a23ebf30a86'
    },
    assets: []
  },
  webgl_shaders_sky: {
    id: 'three-shaders-sky',
    directory: 'three-shaders-sky',
    name: 'shaders - sky sun shader — three.js r186',
    description: 'Unmodified official webgl_shaders_sky module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '0ff9fde8861d424fc633c0d67fb61745849dd669b28a3cf2679814a978a19c23',
      module: '525d77b73e19bb3e142959f446c7cc83bd606a2d7d5e6f4f22ccb9e38e1f0cea'
    },
    assets: []
  },
  webgl_shadow_contact: {
    id: 'three-shadow-contact',
    directory: 'three-shadow-contact',
    name: 'contact shadows — three.js r186',
    description: 'Unmodified official webgl_shadow_contact module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '6a777a477d3b4c27699f19f93d3f9885918c3e691dd5769306b7e3aa190a097d',
      module: '959e7014099db34a499426550aa52fcb552e9c9d48c1ab3ac2852fdb57f1664b'
    },
    assets: []
  },
  webgl_shadowmap_csm: {
    id: 'three-shadowmap-csm',
    directory: 'three-shadowmap-csm',
    name: 'cascaded shadow maps — three.js r186',
    description: 'Unmodified official webgl_shadowmap_csm module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '7c90fec9c3d9146177e7b7d8bd345ad5f1e9f146c35db2e9bb7970edd8b22f8d',
      module: 'bcb92319ba7687ef3307f7a9bec08a5a5a4c9e4a35f219d9ea5d574db1172f3a'
    },
    assets: []
  },
  webgl_shadowmap_pcss: {
    id: 'three-shadowmap-pcss',
    directory: 'three-shadowmap-pcss',
    name: 'percent closer soft-shadows — three.js r186',
    description: 'Unmodified official webgl_shadowmap_pcss module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '96a1c9a3950bb77b78fe92b15563213e739b7fd171e6ce34a0ab4b36abcf9f7f',
      module: '5d9cc2ecacca71266fd7036e89e2dd5b3ddaedea4f200cffb377389d48755f5a'
    },
    assets: []
  },
  webgl_shadowmap_progressive: {
    id: 'three-shadowmap-progressive',
    directory: 'three-shadowmap-progressive',
    name: 'progressive lightmap accumulation — three.js r186',
    description: 'Unmodified official webgl_shadowmap_progressive module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '33f541b5d3187752ed863fbefc746ef5c15fb9ab3daba33b6c8bce3f8eff5f7d',
      module: 'ec13c2c8448fa7ecd702665424f42ffa7a68e9afe9d97d4b3f05f5dea7a0ee7e'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_shadowmap_viewer: {
    id: 'three-shadowmap-viewer',
    directory: 'three-shadowmap-viewer',
    name: 'ShadowMapViewer example — three.js r186',
    description: 'Unmodified official webgl_shadowmap_viewer module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '905e1858f3386306c8b06cfc566d34f561a3d292693de7e779a1b7694d8b91a9',
      module: '199c1b9048649744f7c5266ef5925925287f76416e3f96f4c8cafa28865051db'
    },
    assets: []
  },
  webgl_shadowmap_vsm: {
    id: 'three-shadowmap-vsm',
    directory: 'three-shadowmap-vsm',
    name: 'VSM Shadows example — three.js r186',
    description: 'Unmodified official webgl_shadowmap_vsm module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'c404df3b225269212fbf62cc5354352bc5d7f960227f8fbe60a9bd1cbeed9cdc',
      module: '1c0b6511549fad7e2315e1589821a70c6cebbbd9451b8b4178d25aa11a283357'
    },
    assets: []
  },
  webgl_shadowmesh: {
    id: 'three-shadowmesh',
    directory: 'three-shadowmesh',
    name: 'ShadowMesh — three.js r186',
    description: 'Unmodified official webgl_shadowmesh module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '22879e329cd53abec90fa2ba15b87d9deeae56fe24888fa814d399214fce98e6',
      module: '7435b64e6bee92c8e044e841480758fc2f608b2d920e889822478dfa1ffd2bb2'
    },
    assets: []
  },
  webgl_simple_gi: {
    id: 'three-simple-gi',
    directory: 'three-simple-gi',
    name: 'simple global illumination — three.js r186',
    description: 'Unmodified official webgl_simple_gi module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'bd832f6f9b7cdfba466ab440e9bf72de074f95cbb7c7a93ed5a9caeaa0890972',
      module: 'aecf8c34ea1f966928b55dc49e7a050ea26563df3d9497f919249f740f5beaae'
    },
    assets: []
  },
  webgl_test_memory2: {
    id: 'three-test-memory2',
    directory: 'three-test-memory2',
    name: 'Test Memory2 — three.js r186',
    description: 'Unmodified official webgl_test_memory2 module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '8f11fd31434d1c9cb8c18a1205bdaa851dd5890e936125de01158be0533824a3',
      module: '9dbdd14d45b51e495c0051a2096537c43a0039a4d5679adafad3e7d4abb7beb1'
    },
    assets: []
  },
  webgl_test_wide_gamut: {
    id: 'three-test-wide-gamut',
    directory: 'three-test-wide-gamut',
    name: 'test - wide gamut — three.js r186',
    description: 'Unmodified official webgl_test_wide_gamut module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '4d76ef5eefd9df8f804f34444299b11131b8a7b1a3df0c134fccd044ef84b0cc',
      module: '8f7f47357481537eedc99f6602bbeb58a14826d66920ff714f21baad6d99729c'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_texture2darray: {
    id: 'three-texture2darray',
    directory: 'three-texture2darray',
    name: '2D texture array — three.js r186',
    description: 'Unmodified official webgl_texture2darray module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '57f95a9e1c7ee8dacdef3e33d252bb3947e4202d695f10292e18d1b13c1ac97f',
      module: '00bb94e26c6b3c084eda14b3ef861f5c3bbbf48165dd2144c84d52906c8bd6f6'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_texture2darray_compressed: {
    id: 'three-texture2darray-compressed',
    directory: 'three-texture2darray-compressed',
    name: '2D compressed texture array — three.js r186',
    description: 'Unmodified official webgl_texture2darray_compressed module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '169f7723009b572fab9db7e70aa69db03fc195481b131f1cfc32f95af2b5807e',
      module: '231df131652145fde3729f35f080ef2e5036a8698ff2fd11697f2f0fb0fd4ae4'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_texture2darray_layerupdate: {
    id: 'three-texture2darray-layerupdate',
    directory: 'three-texture2darray-layerupdate',
    name: 'texture array layer update — three.js r186',
    description: 'Unmodified official webgl_texture2darray_layerupdate module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'e8403708a1f26c65dc2c205d8257551f920980df5cda07850609f4e029611d82',
      module: 'bb7b71f6a810966199769db1f7383410f1783cbba7531a0b1632b6bd1f42cde4'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_texture3d: {
    id: 'three-texture3d',
    directory: 'three-texture3d',
    name: 'volume rendering example — three.js r186',
    description: 'Unmodified official webgl_texture3d module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '05c475d9448b419d88b673ba585d0edf77b015e049712187666a2295067907d8',
      module: 'f3a51028281fd3e6456c2057a5a4bb4721a93988a21e7c4e5544986df5f57ec7'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_texture3d_partialupdate: {
    id: 'three-texture3d-partialupdate',
    directory: 'three-texture3d-partialupdate',
    name: 'Texture3d Partialupdate — three.js r186',
    description: 'Unmodified official webgl_texture3d_partialupdate module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'b3c8fcd8b2eb0ee60a903023b81be1de88a9c9d833d90fe834636c444a8b3241',
      module: 'f6a311017a3abff6854a6b09c54bbb3043c4139e4f1d9bc12952c402e42f0c17'
    },
    assets: []
  },
  webgl_tonemapping: {
    id: 'three-tonemapping',
    directory: 'three-tonemapping',
    name: 'tone mapping — three.js r186',
    description: 'Unmodified official webgl_tonemapping module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '62df7691a68a4665c32ffc97995b8247a028d4a387b2a39a883d929b494c1bb2',
      module: 'a5fbae674d3369563392e6cc645c612b5676c767e536c2e69e66c9cf041a37b3'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_tsl_clearcoat: {
    id: 'three-tsl-clearcoat',
    directory: 'three-tsl-clearcoat',
    name: 'TSL Clearcoat — three.js r186',
    description: 'Unmodified official webgl_tsl_clearcoat module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '3106ff1fde2593624f2c9a529e81a138080684c9b7b715038af7a17298c90363',
      module: '3118260a8540e8ae0e5cf212802a2a9d4fe965570bd873b86885cb56f2634048'
    },
    assets: []
  },
  webgl_tsl_instancing: {
    id: 'three-tsl-instancing',
    directory: 'three-tsl-instancing',
    name: 'instancing - performance — three.js r186',
    description: 'Unmodified official webgl_tsl_instancing module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'e1982ef17d9be75ee0724bffb78a0a57e409fab70882c6fc37ac5f8317f85796',
      module: '4e3d3f1651fb4f4d6747872ed9ecf996123b29c8ff76c02f9a5537baf88474ac'
    },
    assets: []
  },
  webgl_tsl_shadowmap: {
    id: 'three-tsl-shadowmap',
    directory: 'three-tsl-shadowmap',
    name: 'TSL Shadowmap — three.js r186',
    description: 'Unmodified official webgl_tsl_shadowmap module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'bb76403130c73d93a1e4ee1937e862ddbc4269eca45fb829898e770593f5c451',
      module: 'f2c3e9e7e85d22275ceaf747efb62156378726f038ad64c4233714dc9dd82bd0'
    },
    assets: []
  },
  webgl_tsl_skinning: {
    id: 'three-tsl-skinning',
    directory: 'three-tsl-skinning',
    name: 'TSL Skinning — three.js r186',
    description: 'Unmodified official webgl_tsl_skinning module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '4098311a21edab107a95383d9348716546b238c5eab11a26459f6735b80cd6fe',
      module: 'ff4f7a0bd888418b6186bed6d831bac842196b5327ef9befc92d03f012ecf5f0'
    },
    assets: []
  },
  webgl_ubo: {
    id: 'three-ubo',
    directory: 'three-ubo',
    name: 'UBO — three.js r186',
    description: 'Unmodified official webgl_ubo module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'b527743237db0c816b577cfc0a1a728452808c651f25c01acb4d036f90798ae9',
      module: 'aa2a3c626d318c4b1c0ab85ed1c7399ad9ead28765182c4d7982b538a1d678d6'
    },
    assets: []
  },
  webgl_ubo_arrays: {
    id: 'three-ubo-arrays',
    directory: 'three-ubo-arrays',
    name: 'UBO Arrays — three.js r186',
    description: 'Unmodified official webgl_ubo_arrays module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '2fcec4cea4a131c86199464ce0cbaae6bfc20b305a68388adb0a49f248191f8e',
      module: '3d30c8b6e761bc2bc63a096ca2e80f3a795724b15b4dbcbd5c09e237a9a97230'
    },
    assets: []
  },
  webgl_video_kinect: {
    id: 'three-video-kinect',
    directory: 'three-video-kinect',
    name: 'Video Kinect — three.js r186',
    description: 'Unmodified official webgl_video_kinect module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '53fb810843a582008fa81ce016b37b096384520d5b57aab92304ba2db042259a',
      module: '8761a5b760de6727c428ca88f64b7f46579548a7f82ad2fa0b6a3b57aac66446'
    },
    assets: []
  },
  webgl_video_panorama_equirectangular: {
    id: 'three-video-panorama-equirectangular',
    directory: 'three-video-panorama-equirectangular',
    name: 'equirectangular video panorama — three.js r186',
    description: 'Unmodified official webgl_video_panorama_equirectangular module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'b72355957601606dd32ff45402e0423aa4be338e2f5ca854b02ab78144cba742',
      module: 'a19ee6ebadb6ea63eb99ffc574d9cc8e9c1d369a0ea9fa09064299b8cfd5ae57'
    },
    assets: []
  },
  webgl_volume_cloud: {
    id: 'three-volume-cloud',
    directory: 'three-volume-cloud',
    name: 'Volume Cloud — three.js r186',
    description: 'Unmodified official webgl_volume_cloud module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '5b2e537af55cefdb2d71c7a353980aa1e44c64cbc72efe539958abedfe9da264',
      module: '5cdd934c6da96246e58c5f881322f5132933b0fc96f403b97ec73f1e4738f578'
    },
    assets: []
  },
  webgl_volume_instancing: {
    id: 'three-volume-instancing',
    directory: 'three-volume-instancing',
    name: 'Volume Instancing — three.js r186',
    description: 'Unmodified official webgl_volume_instancing module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'b04a4f66929083683f2b84d84516c353150383e0249c59f16fab15a65e94cfb4',
      module: '7e107054bb398c136c6a4f9c4e5ff6e0ca89c6505f7af1cb03f2b87200989424'
    },
    discoverAssets: true,
    assets: []
  },
  webgl_volume_perlin: {
    id: 'three-volume-perlin',
    directory: 'three-volume-perlin',
    name: 'Volume Perlin — three.js r186',
    description: 'Unmodified official webgl_volume_perlin module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'cde03b671908e042629699945b22fa2e16bae8b56940894f4687152d4b711bd4',
      module: '663264f259b82b06cf561066e0de7f76ee4c8a8d5cc645c724a4b8a34e9a35cd'
    },
    assets: []
  },
  webgl_watch: {
    id: 'three-watch',
    directory: 'three-watch',
    name: 'watch — three.js r186',
    description: 'Unmodified official webgl_watch module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: 'c64ffbdbce4187114d0ce016101f040b0ab9480a9206fbacdeaad4dd4e864242',
      module: '6cd1c205815d4837ab1bc8698394eb4f61cc6cc837f8b38a39f4f4957007c434'
    },
    assets: []
  },
  webgl_worker_offscreencanvas: {
    id: 'three-worker-offscreencanvas',
    directory: 'three-worker-offscreencanvas',
    name: 'worker - offscreen canvas — three.js r186',
    description: 'Unmodified official webgl_worker_offscreencanvas module on the JSR THREE R1/WebGL2 runtime.',
    icon: '🧊',
    expected: {
      html: '541155a55102491f17004b94cdbc70285ff4ddfd59e28e1a4191438fc5a98ccc',
      module: '78727d2d204dbcf53c71f99c304db6e36ed37e932ec5f9766dc2bc7684d48be5'
    },
    assets: []
  },
});
const slash = value => value.split(path.sep).join('/');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const record = bytes => ({ bytes: bytes.length, sha256: sha(bytes) });
const json = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);

function usage() {
  return `Usage: node tool/three_example/prepare.mjs <${Object.keys(EXAMPLES).join('|')}> [--source <dir>] [--offline] [--verify]`;
}

function parseArgs(argv) {
  const positional = [];
  let source = null;
  let verify = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--source') {
      if (++i >= argv.length) throw new Error('--source requires a directory');
      source = argv[i];
    } else if (arg.startsWith('--source=')) {
      source = arg.slice('--source='.length);
      if (!source) throw new Error('--source requires a directory');
    } else if (arg === '--offline') {
      // Resolution is local-only whether or not this explicit flag is present.
    } else if (arg === '--verify') {
      verify = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(usage());
      process.exit(0);
    } else {
      positional.push(arg);
    }
  }
  if (positional.length !== 1 || !Object.hasOwn(EXAMPLES, positional[0])) {
    throw new Error(`Expected exactly one supported example\n${usage()}`);
  }
  const example = positional[0];
  return {
    example,
    definition: EXAMPLES[example],
    source: path.resolve(source || process.env.THREE_SRC || '/tmp/jsr-three-r186'),
    verify
  };
}

function inside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

async function filesBelow(directory, relative = '') {
  const result = [];
  const entries = await readdir(path.join(directory, relative), { withFileTypes: true });
  for (const entry of entries) {
    const name = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) result.push(...await filesBelow(directory, name));
    else if (entry.isFile()) result.push(name);
  }
  return result;
}

async function sourceTreeHash(source) {
  const hash = createHash('sha256');
  const groups = [
    'src',
    'examples/jsm/loaders/GLTFLoader.js',
    'examples/jsm/utils/BufferGeometryUtils.js',
    'examples/jsm/utils/SkeletonUtils.js'
  ];
  const files = [];
  for (const group of groups) {
    const absolute = path.join(source, group);
    if ((await stat(absolute)).isDirectory()) {
      files.push(...(await filesBelow(absolute)).map(name => `${group}/${name}`));
    } else {
      files.push(group);
    }
  }
  files.sort();
  for (const file of files) {
    hash.update(file);
    hash.update('\0');
    hash.update(await readFile(path.join(source, file)));
    hash.update('\0');
  }
  return { hash: hash.digest('hex'), files };
}

async function verifySource(source) {
  if (!(await stat(source)).isDirectory()) throw new Error(`THREE_SRC is not a directory: ${source}`);
  const revision = JSON.parse(await readFile(path.join(source, 'package.json'), 'utf8'));
  if (revision.version !== '0.186.1') {
    throw new Error(`Expected three.js 0.186.1 (r186), got ${revision.version}`);
  }
  try {
    const commit = execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], {
      stdio: ['ignore', 'pipe', 'ignore']
    }).toString().trim();
    if (commit !== PIN.commit) {
      throw new Error(`three.js source is ${commit}, expected ${PIN.commit}`);
    }
  } catch (error) {
    if (error.message && error.message.includes('expected')) throw error;
    // A source archive has no .git directory; the complete source-input digest
    // below is its immutable identity check, matching tool/three/build.mjs.
  }
  const tree = await sourceTreeHash(source);
  if (tree.hash !== PIN.treeSha256 || tree.files.length !== PIN.sourceFilesHashed) {
    throw new Error(`three.js source digest ${tree.hash} (${tree.files.length} files) does not match pinned ${PIN.treeSha256} (${PIN.sourceFilesHashed} files); use r186 at ${PIN.commit}`);
  }
  return tree;
}

function scriptType(openTag) {
  const match = openTag.match(/\s+type\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  return match ? (match[1] || match[2] || match[3]).trim().toLowerCase() : '';
}

function scriptId(openTag) {
  const match = openTag.match(/\s+id\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  return match ? (match[1] || match[2] || match[3]).trim() : '';
}

// Inline `<script id=... type="x-shader/...">` blocks are the official
// modules' shader sources; the adapter's getElementById serves their text.
function extractInlineScripts(html) {
  const text = html.toString('latin1');
  const opening = /<script\b[^>]*>/gi;
  const scripts = {};
  let match;
  while ((match = opening.exec(text))) {
    const close = /<\/script\s*>/gi;
    close.lastIndex = opening.lastIndex;
    const end = close.exec(text);
    if (!end) throw new Error(`Unclosed script at byte ${match.index}`);
    const type = scriptType(match[0]);
    const id = scriptId(match[0]);
    if (!id || type === 'module' || type === 'importmap') continue;
    scripts[id] = html.toString('utf8', opening.lastIndex, end.index);
    opening.lastIndex = end.index + end[0].length;
  }
  return scripts;
}

function htmlAttribute(tag, name) {
  const expression = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
  const match = tag.match(expression);
  return match ? (match[1] || match[2] || match[3] || '') : null;
}

// Media-element audio stays HTML-declared even though the native adapter has
// no DOM. Extract only the bounded id/source/loop metadata; encoded bytes are
// still pinned and registered through the ordinary asset lane.
function extractAudioElements(html) {
  const text = html.toString('latin1');
  const elements = {};
  const opening = /<audio\b[^>]*>/gi;
  let match;
  while ((match = opening.exec(text))) {
    const close = /<\/audio\s*>/gi;
    close.lastIndex = opening.lastIndex;
    const end = close.exec(text);
    if (!end) throw new Error(`Unclosed audio element at byte ${match.index}`);
    const id = htmlAttribute(match[0], 'id');
    const body = text.slice(opening.lastIndex, end.index);
    const sources = [];
    const sourceOpening = /<source\b[^>]*>/gi;
    let sourceMatch;
    while ((sourceMatch = sourceOpening.exec(body))) {
      const url = htmlAttribute(sourceMatch[0], 'src');
      if (url) sources.push({ url, mime: htmlAttribute(sourceMatch[0], 'type') || '' });
    }
    const selected = sources.find(source => /mpeg|mp3/i.test(source.mime) || /\.mp3(?:$|[?#])/i.test(source.url)) || sources[0];
    if (id && selected) {
      elements[id] = {
        id, url: selected.url, mime: selected.mime || 'application/octet-stream',
        loop: /(?:^|\s)loop(?:\s|=|>|$)/i.test(match[0])
      };
    }
    opening.lastIndex = end.index + end[0].length;
  }
  return elements;
}

function extractOfficial(html) {
  // latin1 gives a one-byte-to-one-character view, so all Buffer offsets and
  // the extracted official bytes remain exact even if the HTML gains UTF-8.
  const text = html.toString('latin1');
  const scripts = [];
  const opening = /<script\b[^>]*>/gi;
  let match;
  while ((match = opening.exec(text))) {
    const close = /<\/script\s*>/gi;
    close.lastIndex = opening.lastIndex;
    const end = close.exec(text);
    if (!end) throw new Error(`Unclosed script at byte ${match.index}`);
    scripts.push({
      type: scriptType(match[0]),
      bytes: html.subarray(opening.lastIndex, end.index)
    });
    opening.lastIndex = end.index + end[0].length;
  }
  const importmaps = scripts.filter(script => script.type === 'importmap');
  const modules = scripts.filter(script => script.type === 'module');
  if (importmaps.length !== 1 || modules.length !== 1) {
    throw new Error(`Expected exactly one importmap and one module script; found ${importmaps.length} and ${modules.length}`);
  }
  let importmap;
  try {
    importmap = JSON.parse(importmaps[0].bytes.toString('utf8'));
  } catch (error) {
    throw new Error(`Official importmap is not valid JSON: ${error.message}`);
  }
  if (!importmap || typeof importmap !== 'object' || !importmap.imports ||
      importmap.imports.three !== '../build/three.module.js' ||
      importmap.imports['three/addons/'] !== './jsm/') {
    throw new Error('Official importmap does not contain the pinned three/addons mappings');
  }
  return {
    importmapBytes: importmaps[0].bytes,
    importmap,
    moduleBytes: modules[0].bytes,
    inlineScripts: extractInlineScripts(html),
    audioElements: extractAudioElements(html)
  };
}

function addonPath(jsmRoot, specifier) {
  const relative = specifier.slice('three/addons/'.length);
  if (!relative || relative.includes('\0')) throw new Error(`Invalid three addon ${specifier}`);
  const resolved = path.resolve(jsmRoot, relative);
  if (!inside(jsmRoot, resolved)) throw new Error(`Addon escapes pinned examples/jsm: ${specifier}`);
  return resolved;
}

function localOnlyPlugin({ source, facadeSource = null, officialBytes = null, final = false, compatSource = null, addonShims = null }) {
  const jsmRoot = path.join(source, 'examples/jsm');
  const allowedRoots = final ? [HERE, jsmRoot] : [path.join(CORE, 'src'), source];
  const shimNames = addonShims ? Object.keys(addonShims) : [];
  return {
    name: final ? 'jsr-three-example-local-only' : 'jsr-three-export-discovery',
    setup(build) {
      build.onResolve({ filter: /^\.\/example_compat\.js$/ }, () => (
        compatSource !== null
          ? { path: 'example_compat.js', namespace: 'jsr-example-compat' }
          : { errors: [{ text: 'No compat module defined for this example' }] }
      ));
      build.onLoad({ filter: /^example_compat\.js$/, namespace: 'jsr-example-compat' }, () => ({
        contents: compatSource,
        loader: 'js',
        resolveDir: HERE
      }));
      build.onResolve({ filter: /^three$/ }, () => {
        if (facadeSource !== null) return { path: 'three', namespace: 'jsr-three-facade' };
        return { path: path.join(source, 'src/Three.js') };
      });
      build.onResolve({ filter: /^three\/addons\/libs\/stats\.module\.js$/ }, () => {
        if (!final) return { path: path.join(jsmRoot, 'libs/stats.module.js') };
        return { path: path.join(HERE, 'stats_adapter.js') };
      });
      build.onResolve({ filter: /^three\/addons\/libs\/lil-gui\.module\.min\.js$/ }, args => {
        if (!final || args.importer === path.join(HERE, 'lil_gui_adapter.js')) {
          return { path: path.join(jsmRoot, 'libs/lil-gui.module.min.js') };
        }
        return { path: path.join(HERE, 'lil_gui_adapter.js') };
      });
      build.onResolve({ filter: /^three\/addons\// }, args => {
        if (final && args.path === 'three/addons/loaders/VRMLLoader.js' && shimNames.includes(args.path)) {
          return { path: path.join(HERE, 'vrml_loader_adapter.js') };
        }
        if (final && shimNames.includes(args.path)) {
          return { path: args.path, namespace: 'jsr-addon-shim' };
        }
        return { path: addonPath(jsmRoot, args.path) };
      });
      build.onLoad({ filter: /.*/, namespace: 'jsr-addon-shim' }, args => ({
        contents: addonShims[args.path],
        loader: 'js',
        resolveDir: HERE
      }));
      build.onResolve({ filter: /^\.\/official_module\.js$/ }, args => {
        if (final && args.importer) return { path: 'official_module.js', namespace: 'jsr-official' };
        return undefined;
      });
      build.onResolve({ filter: /^(?:https?:|data:|node:|npm:|jsr:)|^\/\// }, args => ({
        errors: [{ text: `Remote/non-local imports are forbidden: ${args.path}` }]
      }));
      build.onResolve({ filter: /^[^./]/ }, args => {
        if (args.kind === 'entry-point') return undefined;
        return { errors: [{ text: `Unknown bare import is forbidden: ${args.path}` }] };
      });
      build.onResolve({ filter: /^three(?:\/|$)/ }, args => ({
        errors: [{ text: `Unknown three import is forbidden: ${args.path}` }]
      }));
      build.onLoad({ filter: /^three$/, namespace: 'jsr-three-facade' }, () => ({
        contents: facadeSource,
        loader: 'js',
        resolveDir: HERE
      }));
      build.onLoad({ filter: /^official_module\.js$/, namespace: 'jsr-official' }, () => ({
        contents: officialBytes,
        loader: 'js',
        resolveDir: path.join(source, 'examples')
      }));
      build.onLoad({ filter: /.*/ }, args => {
        if (args.namespace !== 'file') return undefined;
        if (allowedRoots.some(root => inside(root, args.path))) return undefined;
        return { errors: [{ text: `Import is outside the finite local roots: ${args.path}` }] };
      });
    }
  };
}

async function discoverExports(source) {
  const entry = path.join(CORE, 'src/native_entry.js');
  const result = await esbuild.build({
    absWorkingDir: ROOT,
    entryPoints: [entry],
    outfile: path.join(ROOT, 'build/jsr_three_example_export_discovery.js'),
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'neutral',
    target: ['es2020'],
    metafile: true,
    treeShaking: false,
    logLevel: 'silent',
    plugins: [localOnlyPlugin({ source })],
    define: { __THREE_DEVTOOLS__: 'undefined' }
  });
  const output = Object.values(result.metafile.outputs).find(item => item.entryPoint);
  if (!output || !Array.isArray(output.exports)) throw new Error('esbuild did not report the platform entry exports');
  const names = [...new Set(output.exports)].sort();
  for (const required of ['Timer', 'WebGLRenderer', 'TextureLoader', 'Scene', 'PerspectiveCamera']) {
    if (!names.includes(required)) throw new Error(`Platform export discovery omitted ${required}`);
  }
  return names;
}

function facadeModule(names, widgetId, facadeWraps = null) {
  const lines = [
    'const __three = globalThis.THREE;',
    `if (!__three) throw new Error(${JSON.stringify(`${widgetId}: globalThis.THREE is not initialized`)});`
  ];
  const bindings = names.map((name, index) => {
    const local = `__threeExport${index}`;
    // THREE's exports object is getter-only (silent no-op on assignment), so
    // per-example material adaptations must wrap the facade binding itself.
    const wrap = facadeWraps && facadeWraps[name];
    lines.push(wrap
      ? `const ${local} = (${wrap})(__three[${JSON.stringify(name)}]);`
      : `const ${local} = __three[${JSON.stringify(name)}];`);
    return `${local} as ${name}`;
  });
  lines.push(`export { ${bindings.join(', ')} };`, '');
  return lines.join('\n');
}

function pngDimensions(bytes, url) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 24 || signature.some((value, index) => bytes[index] !== value)) {
    throw new Error(`${url} is not a PNG`);
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

// GIF: logical screen descriptor at bytes 6-9 (little-endian width/height)
// after the 6-byte signature ('GIF87a'/'GIF89a').
function gifDimensions(bytes, url) {
  if (bytes.length < 10 || bytes.toString('latin1', 0, 3) !== 'GIF') {
    throw new Error(`${url} is not a GIF`);
  }
  return { width: bytes.readUInt16LE(6), height: bytes.readUInt16LE(8) };
}

function jpegDimensions(bytes, url) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error(`${url} is not a JPEG`);
  }
  const startOfFrame = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7,
    0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf
  ]);
  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error(`${url} has an invalid JPEG marker`);
    while (offset < bytes.length && bytes[offset] === 0xff) offset++;
    if (offset >= bytes.length) break;
    const marker = bytes[offset++];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (marker === 0xd9 || marker === 0xda || offset + 2 > bytes.length) break;
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) {
      throw new Error(`${url} has an invalid JPEG segment`);
    }
    if (startOfFrame.has(marker)) {
      if (length < 7) throw new Error(`${url} has an invalid JPEG frame header`);
      return {
        height: bytes.readUInt16BE(offset + 3),
        width: bytes.readUInt16BE(offset + 5)
      };
    }
    offset += length;
  }
  throw new Error(`${url} has no JPEG dimensions`);
}

function bmpToRgba(bytes, url) {
  if (bytes.toString('latin1', 0, 2) !== 'BM') throw new Error(`${url}: not a BMP`);
  const dataOffset = bytes.readUInt32LE(10);
  const width = bytes.readInt32LE(18);
  const signedHeight = bytes.readInt32LE(22);
  const bpp = bytes.readUInt16LE(28);
  const compression = bytes.readUInt32LE(30);
  if (compression !== 0 || (bpp !== 24 && bpp !== 32)) throw new Error(`${url}: unsupported BMP layout`);
  const height = Math.abs(signedHeight);
  const bottomUp = signedHeight > 0;
  const rowSize = Math.floor((bpp * width + 31) / 32) * 4;
  const pixelBytes = bpp / 8;
  const out = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    const sourceRow = bottomUp ? height - 1 - y : y;
    for (let x = 0; x < width; x++) {
      const from = dataOffset + sourceRow * rowSize + x * pixelBytes;
      const to = (y * width + x) * 4;
      out[to] = bytes[from + 2];
      out[to + 1] = bytes[from + 1];
      out[to + 2] = bytes[from];
      out[to + 3] = bpp === 32 ? bytes[from + 3] : 255;
    }
  }
  return { bytes: out, width, height };
}

async function imageToRgba(bytes, url, stamp) {
  const tmpIn = path.join(process.env.TMPDIR || '/tmp', `jsr-rgba-${stamp}-src`);
  const tmpBmp = path.join(process.env.TMPDIR || '/tmp', `jsr-rgba-${stamp}.bmp`);
  await writeFile(tmpIn, bytes);
  execFileSync('sips', ['-s', 'format', 'bmp', tmpIn, '--out', tmpBmp], { stdio: 'pipe' });
  return bmpToRgba(await readFile(tmpBmp), url);
}

// QuickJS has no DOM Blob/object-URL implementation. GLTFLoader therefore
// cannot consume images embedded as bufferViews: its stock path constructs a
// Blob before calling TextureLoader. For explicitly opted-in pinned GLBs,
// externalize those images at prepare time in their original encoded format
// and rewrite only the generated GLB JSON to relative URIs. The original GLB
// is still sha256-verified before this transformation; official module bytes
// are untouched.
async function externalizeGlbImages(bytes, definition) {
  if (bytes.length < 20 || bytes.toString('latin1', 0, 4) !== 'glTF') {
    throw new Error(`${definition.url} is not a binary glTF asset`);
  }
  let offset = 12;
  let json = null;
  let binary = null;
  const trailingChunks = [];
  while (offset + 8 <= bytes.length) {
    const length = bytes.readUInt32LE(offset);
    const type = bytes.readUInt32LE(offset + 4);
    const end = offset + 8 + length;
    if (end > bytes.length) throw new Error(`${definition.url}: truncated GLB chunk`);
    if (type === 0x4e4f534a) json = JSON.parse(bytes.toString('utf8', offset + 8, end));
    else {
      if (type === 0x004e4942 && !binary) binary = bytes.subarray(offset + 8, end);
      trailingChunks.push(bytes.subarray(offset, end));
    }
    offset = end;
  }
  if (!json || !binary || !Array.isArray(json.images)) {
    throw new Error(`${definition.url}: no embedded GLB images to externalize`);
  }
  const images = [];
  const usedNames = new Set();
  for (let index = 0; index < json.images.length; index++) {
    const image = json.images[index];
    if (image.bufferView === undefined) continue;
    const view = json.bufferViews && json.bufferViews[image.bufferView];
    if (!view) throw new Error(`${definition.url}: image ${index} has an invalid bufferView`);
    const start = view.byteOffset || 0;
    if (!Number.isInteger(start) || !Number.isInteger(view.byteLength) ||
        start < 0 || view.byteLength < 1 || start + view.byteLength > binary.length) {
      throw new Error(`${definition.url}: image ${index} exceeds the GLB binary chunk`);
    }
    let embedded = binary.subarray(start, start + view.byteLength);
    let mime = image.mimeType;
    if (mime === 'image/webp' || mime === 'image/avif') {
      const stamp = `${process.pid}-${index}`;
      const inputExtension = mime === 'image/webp' ? 'webp' : 'avif';
      const tmpIn = path.join(process.env.TMPDIR || '/tmp', `jsr-glb-${stamp}.${inputExtension}`);
      const tmpPng = path.join(process.env.TMPDIR || '/tmp', `jsr-glb-${stamp}.png`);
      await writeFile(tmpIn, embedded);
      execFileSync('sips', ['-s', 'format', 'png', tmpIn, '--out', tmpPng], { stdio: 'pipe' });
      embedded = await readFile(tmpPng);
      mime = 'image/png';
    }
    // Basis images have already become PNG bufferViews in decodeGlbAsset.
    // Any remaining non-browser payload is left embedded and fails loudly.
    if (mime !== 'image/png' && mime !== 'image/jpeg') continue;
    const extension = mime === 'image/png' ? 'png' : 'jpg';
    const name = path.basename(image.name || `embedded-${index}.${extension}`);
    if (!name || usedNames.has(name)) throw new Error(`${definition.url}: duplicate embedded image name ${name}`);
    usedNames.add(name);
    const url = path.posix.join(path.posix.dirname(definition.url), name);
    const dimensions = mime === 'image/png'
      ? pngDimensions(embedded, url)
      : mime === 'image/jpeg'
        ? jpegDimensions(embedded, url)
        : (() => { throw new Error(`${url}: unsupported embedded image MIME ${mime}`); })();
    images.push({
      url, output: definition.discovered ? assetOutputName(url) : name, bytes: embedded,
      width: dimensions.width, height: dimensions.height,
      mime, sourceRecord: record(embedded),
      ...(definition.discovered ? { aliases: [assetDependencyAlias(definition.url, name)] } : {})
    });
    delete image.bufferView;
    image.mimeType = mime;
    image.uri = name;
  }
  for (const texture of json.textures || []) {
    for (const extensionName of ['EXT_texture_webp', 'EXT_texture_avif']) {
      const extension = texture.extensions && texture.extensions[extensionName];
      if (!extension) continue;
      texture.source = extension.source;
      delete texture.extensions[extensionName];
      if (Object.keys(texture.extensions).length === 0) delete texture.extensions;
    }
  }
  for (const key of ['extensionsUsed', 'extensionsRequired']) {
    if (!json[key]) continue;
    json[key] = json[key].filter(name => name !== 'EXT_texture_webp' && name !== 'EXT_texture_avif');
    if (json[key].length === 0) delete json[key];
  }
  if (images.length === 0) {
    if (definition.discovered) return { bytes, images };
    throw new Error(`${definition.url}: no bufferView images found`);
  }
  const jsonText = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonLength = (jsonText.length + 3) & ~3;
  const jsonChunk = Buffer.alloc(8 + jsonLength, 0x20);
  jsonChunk.writeUInt32LE(jsonLength, 0);
  jsonChunk.writeUInt32LE(0x4e4f534a, 4);
  jsonText.copy(jsonChunk, 8);
  const body = Buffer.concat([jsonChunk, ...trailingChunks]);
  const header = Buffer.alloc(12);
  bytes.copy(header, 0, 0, 12);
  header.writeUInt32LE(header.length + body.length, 8);
  return { bytes: Buffer.concat([header, body]), images };
}

function rgbeToRgba(bytes, url) {
  let offset = 0;
  const readLine = () => {
    const end = bytes.indexOf(0x0a, offset);
    const line = bytes.toString('latin1', offset, end);
    offset = end + 1;
    return line;
  };
  if (!readLine().startsWith('#?')) throw new Error(`${url}: not a Radiance HDR`);
  for (;;) { const line = readLine(); if (line === '') break; }
  const dims = readLine().trim().split(/\s+/);
  const height = Number(dims[1]);
  const width = Number(dims[3]);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) throw new Error(`${url}: bad HDR dimensions`);
  const out = Buffer.alloc(width * height * 4);
  const scanline = Buffer.alloc(width * 4);
  const enc = (value) => {
    const v = Math.max(0, Math.min(1, value));
    return Math.round((v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255);
  };
  for (let y = 0; y < height; y++) {
    if (bytes[offset] === 2 && bytes[offset + 1] === 2 && ((bytes[offset + 2] << 8) | bytes[offset + 3]) === width) {
      offset += 4;
      for (let channel = 0; channel < 4; channel++) {
        let x = 0;
        while (x < width) {
          let count = bytes[offset++];
          if (count > 128) {
            const value = bytes[offset++];
            for (let i = 0; i < count - 128; i++) scanline[x++ * 4 + channel] = value;
          } else {
            for (let i = 0; i < count; i++) scanline[x++ * 4 + channel] = bytes[offset++];
          }
        }
      }
    } else {
      for (let x = 0; x < width * 4; x++) scanline[x] = bytes[offset++];
    }
    for (let x = 0; x < width; x++) {
      const e = scanline[x * 4 + 3];
      const to = (y * width + x) * 4;
      if (e === 0) { out[to + 3] = 255; continue; }
      const f = Math.pow(2, e - 136);
      out[to] = enc(scanline[x * 4] * f);
      out[to + 1] = enc(scanline[x * 4 + 1] * f);
      out[to + 2] = enc(scanline[x * 4 + 2] * f);
      out[to + 3] = 255;
    }
  }
  return { bytes: out, width, height };
}

function hdrTextureLoaderShim(name) {
  return `import { TextureLoader } from 'three';
export class ${name} extends TextureLoader {
  load(url, onLoad, onProgress, onError) {
    return super.load(url, texture => {
      const image = texture.image || {};
      if (onLoad) onLoad(texture, { width: image.width || 0, height: image.height || 0 });
    }, onProgress, onError);
  }
}`;
}

function ssrPassThroughShim() {
  return `import { Pass } from 'three/addons/postprocessing/Pass.js';
export class SSRPass extends Pass {
  constructor({ renderer, scene, camera, width = 512, height = 512, selects = null, bouncing = false, groundReflector = null }) {
    super();
    this.renderer = renderer; this.scene = scene; this.camera = camera;
    this.width = width; this.height = height; this.selects = selects;
    this.bouncing = bouncing; this.groundReflector = groundReflector;
    this.resolutionScale = 1; this.thickness = 0.018; this.infiniteThick = false;
    this.fresnel = true; this.distanceAttenuation = true; this.maxDistance = 0.1;
    this.opacity = 1; this.blur = true; this.output = SSRPass.OUTPUT.Default;
    this.needsSwap = false;
    console.warn('three: R1 omits SSR and reflector shader passes; rendering the real beauty scene through the bounded pass-through.');
  }
  setSize(width, height) { this.width = width; this.height = height; }
  dispose() {}
  render(renderer, _writeBuffer, readBuffer) {
    if (this.groundReflector) this.groundReflector.visible = false;
    renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);
    renderer.render(this.scene, this.camera);
  }
}
SSRPass.OUTPUT = { Default: 0, SSR: 1, Beauty: 3, Depth: 4, Normal: 5, Metalness: 7 };
`;
}

function remoteHdrKtx2LoaderShim() {
  return `import { EquirectangularReflectionMapping, TextureLoader } from 'three';
export class KTX2Loader extends TextureLoader {
  detectSupport() { return this; }
  load(_url, onLoad, onProgress, onError) {
    if (!this._warned) {
      this._warned = true;
      console.warn('three: remote needle.tools PMREM KTX2 is unavailable offline; using the pinned blouberg_sunrise HDR with a warned equirectangular/8-bit degrade.');
    }
    return super.load('textures/equirectangular/blouberg_sunrise_2_1k.hdr', texture => {
      if (onLoad) onLoad(texture);
      // The official callback selects CubeUV. Reset after that callback so the
      // native bounded environment sampler sees its supported equirect map.
      Promise.resolve().then(() => {
        texture.mapping = EquirectangularReflectionMapping;
        texture.needsUpdate = true;
      });
    }, onProgress, onError);
  }
}`;
}

function preparedColladaLoaderShim() {
  return `import { FileLoader, GLTFLoader, Loader } from 'three';
export class ColladaLoader extends Loader {
  load(url, onLoad, onProgress, onError) {
    const loader = new FileLoader(this.manager);
    loader.setPath(this.path).setRequestHeader(this.requestHeader).setResponseType('arraybuffer');
    loader.load(url, buffer => {
      new GLTFLoader(this.manager).parse(buffer, '', gltf => {
        const warning = 'collada-kinematics uses a prepare-exported static robot; runtime joint tweening is omitted to bound the QuickJS boot path';
        console.warn('three: ' + warning);
        gltf.scene.userData.warnings = [warning];
        onLoad({
          scene: gltf.scene,
          animations: [],
          kinematics: {
            joints: {},
            getJointValue() { return undefined; },
            setJointValue() { /* explicit static-kinematics degrade */ }
          }
        });
      }, onError);
    }, onProgress, onError);
  }
}`;
}

function rhino3dmLoaderShim() {
  return `import { BoxGeometry, FileLoader, Group, Loader, Mesh, MeshStandardMaterial } from 'three';
export class Rhino3dmLoader extends Loader {
  setLibraryPath() { return this; }
  setWorkerLimit() { return this; }
  setSubdivisionLevel() { return this; }
  load(url, onLoad, onProgress, onError) {
    const loader = new FileLoader(this.manager);
    loader.setPath(this.path).setRequestHeader(this.requestHeader).setResponseType('arraybuffer');
    loader.load(url, () => {
      console.warn('three: rhino3dm 8.32.1 is absent from the pinned r186 tree; Rhino_Logo.3dm is represented by an explicit bounded placeholder, not parsed geometry.');
      const group = new Group();
      group.name = 'Rhino 3DM decoder-unavailable placeholder';
      const material = new MeshStandardMaterial({ color: 0x4b9b75, roughness: 0.55 });
      const sizes = [[18, 4, 5], [5, 12, 5], [12, 3, 5]];
      const positions = [[0, 0, 2.5], [-6, 7, 2.5], [3, 12, 2.5]];
      for (let index = 0; index < sizes.length; index++) {
        const mesh = new Mesh(new BoxGeometry(...sizes[index]), material);
        mesh.position.set(...positions[index]);
        group.add(mesh);
      }
      group.userData.layers = [];
      group.userData.warnings = ['rhino3dm decoder unavailable; bounded placeholder'];
      onLoad(group);
    }, onProgress, onError);
  }
}`;
}

function dracoLoaderShim() {
  return `import { BufferAttribute, BufferGeometry, FileLoader, Loader } from 'three';
export const DRACO_GLTF_CONFIG = { js: '', wasm: '' };
function parsePrepared(buffer) {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 12 || String.fromCharCode(...bytes.subarray(0, 8)) !== 'JSRDRC1\\0') {
    throw new Error('three.prepare: expected JSRDRC1 geometry bytes');
  }
  const headerLength = new DataView(buffer).getUint32(8, true);
  if (headerLength > 65536 || 12 + headerLength > bytes.length) throw new Error('three.prepare: invalid JSRDRC1 header');
  const header = JSON.parse(new TextDecoder().decode(bytes.subarray(12, 12 + headerLength)));
  const start = 12 + ((headerLength + 3) & ~3);
  const types = { Float32Array, Uint32Array, Uint16Array, Uint8Array, Int32Array, Int16Array, Int8Array };
  const geometry = new BufferGeometry();
  const read = descriptor => {
    const Type = types[descriptor.type];
    const offset = start + descriptor.offset;
    if (!Type || descriptor.byteLength % Type.BYTES_PER_ELEMENT || offset + descriptor.byteLength > bytes.length) {
      throw new Error('three.prepare: invalid JSRDRC1 array descriptor');
    }
    return new Type(buffer, offset, descriptor.byteLength / Type.BYTES_PER_ELEMENT);
  };
  for (const [name, descriptor] of Object.entries(header.attributes)) {
    geometry.setAttribute(name, new BufferAttribute(read(descriptor), descriptor.itemSize));
  }
  if (header.index) geometry.setIndex(new BufferAttribute(read(header.index), 1));
  return geometry;
}
export class DRACOLoader extends Loader {
  setDecoderPath() { return this; }
  setDecoderConfig() { return this; }
  setWorkerLimit() { return this; }
  preload() { return this; }
  dispose() { return this; }
  decodeDracoFile() { throw new Error('three.prepare: residual Draco geometry reached the runtime'); }
  load(url, onLoad, onProgress, onError) {
    const loader = new FileLoader(this.manager);
    loader.setPath(this.path).setRequestHeader(this.requestHeader).setResponseType('arraybuffer');
    loader.load(url, buffer => {
      try { onLoad(parsePrepared(buffer)); }
      catch (error) { if (onError) onError(error); else console.error(error); }
    }, onProgress, onError);
  }
  parse(data, onLoad) { onLoad(parsePrepared(data)); }
}`;
}

function ktx2LoaderShim() {
  return `import { DataArrayTexture, DataTexture, FileLoader, LinearFilter, LinearSRGBColorSpace, Loader, RGBAFormat, SRGBColorSpace, UnsignedByteType } from 'three';
export class KTX2Loader extends Loader {
  detectSupport() { return this; }
  setTranscoderPath() { return this; }
  setWorkerLimit() { return this; }
  init() { return Promise.resolve(this); }
  dispose() { return this; }
  load(url, onLoad, onProgress, onError) {
    const loader = new FileLoader(this.manager);
    loader.setPath(this.path).setRequestHeader(this.requestHeader).setResponseType('arraybuffer');
    loader.load(url, buffer => {
      try {
        const bytes = new Uint8Array(buffer);
        const magic = 'JSRKTEX2\\0';
        if (bytes.length < 13 || String.fromCharCode(...bytes.subarray(0, 9)) !== magic) {
          throw new Error(url + ': expected prepare-decoded JSRKTEX2 bytes');
        }
        const view = new DataView(buffer);
        const headerLength = view.getUint32(9, true);
        if (headerLength > 4096 || 13 + headerLength > bytes.length) throw new Error(url + ': invalid JSRKTEX2 header');
        const header = JSON.parse(new TextDecoder().decode(bytes.subarray(13, 13 + headerLength)));
        if (header.error) throw new Error(header.error);
        const data = bytes.subarray(13 + headerLength);
        const expected = header.width * header.height * header.depth * 4;
        if (!header.width || !header.height || !header.depth || data.length !== expected) {
          throw new Error(url + ': invalid prepare-decoded RGBA dimensions');
        }
        const texture = header.depth > 1
          ? new DataArrayTexture(data, header.width, header.height, header.depth)
          : new DataTexture(data, header.width, header.height);
        texture.format = RGBAFormat;
        texture.type = UnsignedByteType;
        texture.colorSpace = header.colorSpace === 'srgb' ? SRGBColorSpace : LinearSRGBColorSpace;
        texture.minFilter = LinearFilter;
        texture.magFilter = LinearFilter;
        texture.generateMipmaps = false;
        if (header.depth > 1) texture.mipmaps = [{ data, width: header.width, height: header.height, depth: header.depth }];
        texture.needsUpdate = true;
        onLoad(texture);
      } catch (error) { if (onError) onError(error); else console.error(error); }
    }, onProgress, onError);
  }
}`;
}

function vrmlLoaderShim() {
  return "export { VRMLoader } from './vrml_loader_adapter.js';";
}

function automaticAssetAddonShims(definitions) {
  const shims = {};
  if (definitions.some(definition => definition.prepareDraco || definition.predecodeGlb)) {
    shims['three/addons/loaders/DRACOLoader.js'] = dracoLoaderShim();
  }
  if (definitions.some(definition => definition.prepareKtx2 || definition.predecodeGlb)) {
    shims['three/addons/loaders/KTX2Loader.js'] = ktx2LoaderShim();
  }
  if (definitions.some(definition => definition.prepareVrml)) {
    shims['three/addons/loaders/VRMLLoader.js'] = vrmlLoaderShim();
  }
  if (definitions.some(definition => definition.hdrRgba)) {
    shims['three/addons/loaders/HDRLoader.js'] = hdrTextureLoaderShim('HDRLoader');
    shims['three/addons/loaders/RGBELoader.js'] = hdrTextureLoaderShim('RGBELoader');
    shims['three/addons/loaders/HDRCubeTextureLoader.js'] = "export { CubeTextureLoader as HDRCubeTextureLoader } from 'three';";
  }
  // UltraHDRLoader's gain-map metadata uses DOMParser. The pinned base JPEG
  // remains a valid SDR environment, so keep that image without the gain map.
  if (definitions.some(definition => definition.url.endsWith('.hdr.jpg'))) {
    shims['three/addons/loaders/UltraHDRLoader.js'] = "export { TextureLoader as UltraHDRLoader } from 'three';";
  }
  return shims;
}

async function prepareAssets(source, definitions) {
  const assets = [];
  for (const pinned of definitions) {
    let definition = pinned;
    let bytes = await readFile(path.join(source, 'examples', definition.url));
    if (sha(bytes) !== definition.sha256) throw new Error(`${definition.url} differs from the pinned r186 bytes`);
    definition = { ...definition, sourceRecord: record(bytes) };
    if (definition.prepareCollada) {
      bytes = await decodeColladaAsset(source, bytes, definition.url);
      assets.push({ ...definition, bytes, mime: 'model/gltf-binary' });
      continue;
    }
    if (definition.prepareDraco) {
      bytes = await decodeDracoAsset(source, bytes, definition.url);
      assets.push({ ...definition, bytes, mime: 'application/x-jsr-draco-geometry' });
      continue;
    }
    if (definition.prepareKtx2) {
      bytes = await decodeKtx2Asset(source, bytes, definition.url);
      assets.push({ ...definition, bytes, mime: 'application/x-jsr-ktx2-rgba' });
      continue;
    }
    if (definition.prepareVrml) {
      bytes = await decodeVrmlAsset(source, bytes, definition.url);
      assets.push({ ...definition, bytes, mime: 'application/json' });
      continue;
    }
    if (definition.predecodeGlb) {
      if (definition.mime !== 'model/gltf-binary') throw new Error(`${definition.url}: predecodeGlb expects a GLB`);
      bytes = await decodeGlbAsset(source, bytes, definition.url);
    }
    if (definition.convertToPng) {
      if (definition.mime !== 'image/gif') throw new Error(`${definition.url}: convertToPng expects a GIF asset`);
      // R1 decodes PNG/JPEG only: transcode the pinned GIF at prepare time
      // (macOS sips) so the registered bytes are PNG under the original URL.
      const stamp = `${process.pid}-${assets.length}`;
      const tmpGif = path.join(process.env.TMPDIR || '/tmp', `jsr-gif-${stamp}.gif`);
      const tmpPng = path.join(process.env.TMPDIR || '/tmp', `jsr-gif-${stamp}.png`);
      await writeFile(tmpGif, bytes);
      execFileSync('sips', ['-s', 'format', 'png', tmpGif, '--out', tmpPng], { stdio: 'pipe' });
      bytes = await readFile(tmpPng);
      definition = { ...definition, mime: 'image/png' };
    }
    if (definition.hdrRgba) {
      const decoded = rgbeToRgba(bytes, definition.url);
      assets.push({ ...definition, bytes: decoded.bytes, width: decoded.width, height: decoded.height, mime: 'application/x-rgba' });
      continue;
    }
    if (definition.rawRgba) {
      const decoded = await imageToRgba(bytes, definition.url, `${process.pid}-${assets.length}`);
      assets.push({ ...definition, bytes: decoded.bytes, width: decoded.width, height: decoded.height, mime: 'application/x-rgba' });
      continue;
    }
    let dimensions;
    if (definition.mime === 'image/png') dimensions = pngDimensions(bytes, definition.url);
    else if (definition.mime === 'image/jpeg') dimensions = jpegDimensions(bytes, definition.url);
    else if (definition.mime === 'image/gif') dimensions = gifDimensions(bytes, definition.url);
    else if (definition.mime === 'model/gltf-binary') {
      // Binary glTF models have no pixel dimensions; validate the GLB magic
      // ('glTF' in ASCII) instead so corrupted files fail at prepare time.
      if (bytes.length < 20 || bytes.toString('latin1', 0, 4) !== 'glTF') {
        throw new Error(`${definition.url} is not a binary glTF asset`);
      }
      if (definition.externalizeImages) {
        const externalized = await externalizeGlbImages(bytes, definition);
        bytes = externalized.bytes;
        assets.push(...externalized.images);
      }
      assets.push({ ...definition, bytes });
      continue;
    }
    else if (definition.mime === 'application/octet-stream' || definition.mime.startsWith('audio/')) {
      // Raw model payloads and encoded audio: the sha256 pin above is the
      // integrity gate; model loaders parse bytes and audio goes to the host.
      assets.push({ ...definition, bytes });
      continue;
    }
    else if (definition.mime === 'application/json') {
      // Pinned data documents (FontLoader .typeface.json and friends): no
      // pixel dimensions to derive; the sha256 gate is the integrity check.
      assets.push({ ...definition, bytes, width: null, height: null });
      continue;
    }
    else throw new Error(`Unsupported prepared asset type: ${definition.mime}`);
    if (!dimensions.width || !dimensions.height) throw new Error(`${definition.url} has invalid texture dimensions`);
    assets.push({ ...definition, bytes, ...dimensions });
  }
  return assets;
}

function sortedRecordMap(values) {
  return Object.fromEntries(Object.keys(values).sort().map(key => [key, values[key]]));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const definition = options.definition;
  const out = path.join(ROOT, 'example/widgets', definition.directory);
  const entryName = `${definition.id}-entry.js`;
  const source = await realpath(options.source);
  const tree = await verifySource(source);
  const htmlPath = path.join(source, `examples/${options.example}.html`);
  const licensePath = path.join(source, 'LICENSE');
  const [html, license] = await Promise.all([readFile(htmlPath), readFile(licensePath)]);
  if (sha(html) !== definition.expected.html) {
    throw new Error(`Official ${options.example} HTML differs from the pinned r186 bytes`);
  }
  const extracted = extractOfficial(html);
  if (sha(extracted.moduleBytes) !== definition.expected.module) {
    throw new Error(`Extracted official ${options.example} module differs from the pinned r186 bytes`);
  }
  const assetDefinitions = definition.discoverAssets
    ? await discoverAssets({
        source,
        moduleSource: extracted.moduleBytes.toString('utf8'),
        explicit: definition.assets
      })
    : definition.assets;
  const assets = await prepareAssets(source, assetDefinitions);
  const addonShims = {
    ...automaticAssetAddonShims(assetDefinitions),
    ...(definition.addonShims || {})
  };
  const exportNames = await discoverExports(source);
  const facadeSource = facadeModule(exportNames, definition.id, definition.facadeWraps || null);
  const adapterAssets = assets.flatMap(asset => [
    asset,
    ...(asset.aliases || []).map(url => ({ ...asset, url }))
  ]).map(asset => ({
    url: asset.url,
    data: asset.bytes.toString('base64'),
    mime: asset.mime,
    width: asset.width ?? 0,
    height: asset.height ?? 0,
    bytes: asset.bytes.length,
    diagnostic: asset.diagnostic
  }));

  const result = await esbuild.build({
    absWorkingDir: ROOT,
    stdin: {
      contents: "import './example_adapter.js';\n" +
        (definition.compat ? "import './example_compat.js';\n" : '') +
        "import './official_module.js';\n",
      resolveDir: HERE,
      sourcefile: entryName,
      loader: 'js'
    },
    outfile: path.join(out, 'widget.js'),
       plugins: [{
      name: 'jsr-addon-shims',
      setup(build) {
        const shims = addonShims;
        build.onResolve({ filter: /^three\/addons\// }, args => shims[args.path]
          ? { path: args.path, namespace: 'jsr-addon-shim' }
          : null);
        build.onLoad({ filter: /.*/, namespace: 'jsr-addon-shim' }, args => ({
          contents: shims[args.path], loader: 'js', resolveDir: HERE
        }));
      }
    }],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'neutral',
    target: ['es2020'],
    minify: !process.env.JSR_PREPARE_NO_MINIFY,
    treeShaking: true,
    legalComments: 'inline',
    sourcemap: false,
    metafile: true,
    logLevel: 'silent',
    plugins: [helperFastPathPlugin(), localOnlyPlugin({
      source,
      facadeSource,
      officialBytes: extracted.moduleBytes,
      final: true,
      compatSource: definition.compat || null,
      addonShims
    })],
    define: {
      __JSR_THREE_EXAMPLE_ID__: JSON.stringify(options.example),
      __JSR_THREE_WIDGET_ID__: JSON.stringify(definition.id),
      __JSR_THREE_EXAMPLE_ASSETS_JSON__: JSON.stringify(JSON.stringify(adapterAssets)),
      __JSR_THREE_EXAMPLE_SCRIPTS_JSON__: JSON.stringify(JSON.stringify(extracted.inlineScripts)),
      __JSR_THREE_EXAMPLE_AUDIO_JSON__: JSON.stringify(JSON.stringify(extracted.audioElements))
    }
  });
  if (result.outputFiles.length !== 1) throw new Error(`Expected one widget output, got ${result.outputFiles.length}`);
  const widget = Buffer.from(result.outputFiles[0].contents);
  for (const input of Object.keys(result.metafile.inputs)) {
    if (input.startsWith('jsr-') || path.basename(input) === entryName) continue;
    const absolute = path.isAbsolute(input) ? input : path.resolve(ROOT, input);
    if (inside(path.join(source, 'src'), absolute)) {
      throw new Error(`A second three.js core copy entered the widget: ${input}`);
    }
  }

  const manifest = json({
    id: definition.id,
    name: definition.name,
    description: definition.description,
    version: '0.1.0',
    icon: definition.icon,
    allowedCommands: [],
    network: false,
    widget: { entry: 'widget.js', interactive: true }
  });
  const outputBytes = {
    'THREE_LICENSE': license,
    'manifest.json': manifest,
    'official_module.js': extracted.moduleBytes,
    'original.html': html,
    'widget.js': widget
  };
  for (const asset of assets) outputBytes[asset.output] = asset.bytes;

  const inputs = {};
  async function addInput(label, bytes) {
    if (!inputs[label]) inputs[label] = record(bytes);
  }
  await addInput(`source/examples/${options.example}.html`, html);
  await addInput('source/LICENSE', license);
  for (const asset of assets) {
    const label = `source/examples/${asset.url}`;
    if (!inputs[label]) inputs[label] = asset.sourceRecord || record(asset.bytes);
  }
  for (const file of ['prepare.mjs', 'asset_discovery.mjs', 'asset_decode.mjs', 'example_adapter.js', 'example_canvas2d.js', 'lil_gui_adapter.js', 'stats_adapter.js']) {
    await addInput(`tool/three_example/${file}`, await readFile(path.join(HERE, file)));
  }
  for (const file of ['source-pin.json', 'src/native_entry.js']) {
    await addInput(`tool/three/${file}`, await readFile(path.join(CORE, file)));
  }
  for (const file of ['assets/three/three.native.js', 'assets/three/three.web.js']) {
    await addInput(file, await readFile(path.join(ROOT, file)));
  }
  for (const input of Object.keys(result.metafile.inputs)) {
    if (input.startsWith('jsr-') || path.basename(input) === entryName) continue;
    const absolute = path.isAbsolute(input) ? input : path.resolve(ROOT, input);
    let label;
    if (inside(source, absolute)) label = `source/${slash(path.relative(source, absolute))}`;
    else if (inside(ROOT, absolute)) label = slash(path.relative(ROOT, absolute));
    else throw new Error(`Cannot label build input ${input}`);
    await addInput(label, await readFile(absolute));
  }

  const prepareManifest = json({
    schema: 'jsr-three-example-prepare-v1',
    id: definition.id,
    example: options.example,
    upstream: {
      name: 'three.js', version: '0.186.1', revision: '186', license: 'MIT',
      sourceCommit: PIN.commit, sourceTagObject: PIN.tagObject,
      sourceTreeSha256: tree.hash, sourceFilesHashed: tree.files.length
    },
    tools: {
      // Keep verification reproducible across local Node and CI Node 22.
      // The exact esbuild version is pinned because it affects output bytes.
      node: '>=22',
      esbuild: esbuild.version,
      esbuildRequire: 'tool/three/package.json'
    },
    build: {
      format: 'iife', platform: 'neutral', target: 'es2020', minify: true,
      offline: true, remoteResolution: false,
      exportDiscovery: 'esbuild ESM/metafile over tool/three/src/native_entry.js',
      adapterOrder: 'ES module dependency: example_adapter.js before official_module.js'
    },
    extraction: {
      importmap: extracted.importmap,
      importmapBytes: record(extracted.importmapBytes),
      officialModule: record(extracted.moduleBytes)
    },
    assetDiscovery: definition.discoverAssets ? assetDefinitions : undefined,
    facade: {
      global: 'globalThis.THREE',
      exports: exportNames,
      source: record(Buffer.from(facadeSource))
    },
    inputs: sortedRecordMap(inputs),
    outputs: sortedRecordMap(Object.fromEntries(
      Object.entries(outputBytes).map(([name, bytes]) => [name, record(bytes)])
    ))
  });
  outputBytes['prepare_manifest.json'] = prepareManifest;

  if (options.verify) {
    for (const name of Object.keys(outputBytes).sort()) {
      const existing = await readFile(path.join(out, name));
      if (!existing.equals(outputBytes[name])) {
        throw new Error(`${name} differs from a clean pinned prepare`);
      }
    }
  } else {
    await mkdir(out, { recursive: true });
    for (const name of Object.keys(outputBytes).sort()) {
      await writeFile(path.join(out, name), outputBytes[name]);
    }
  }
  console.log(JSON.stringify({
    prepared: options.example,
    verified: options.verify,
    output: slash(path.relative(ROOT, out)),
    sourceCommit: PIN.commit,
    offline: true,
    outputs: sortedRecordMap(Object.fromEntries(
      Object.entries(outputBytes).map(([name, bytes]) => [name, record(bytes)])
    ))
  }, null, 2));
}

main().catch(error => {
  console.error(`three-example prepare failed: ${error.message}`);
  process.exitCode = 1;
});
