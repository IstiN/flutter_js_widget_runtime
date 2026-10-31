import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, readdir, stat, mkdir, writeFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { helperFastPathPlugin } from './helper_fast_path_plugin.mjs';

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
    }]
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
          }
    ]
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
    ]
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
    ]
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
    assets: []
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
    assets: []
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
    assets: []
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
    ]
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
    assets: []
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
                "output": "snowflake1.png",
                "sha256": "7b0c12c16b37b0d03e73009da109e97cdfdd1f40f047fd025c80954a8422d220"
          },
          {
                "url": "textures/sprites/snowflake2.png",
                "mime": "image/png",
                "output": "snowflake2.png",
                "sha256": "0396d0c5f997fc830cecd62d6e554611e7ee747906413d19cfc94e4e2900161e"
          },
          {
                "url": "textures/sprites/snowflake3.png",
                "mime": "image/png",
                "output": "snowflake3.png",
                "sha256": "57d673741e314cbb727a9eebf545397a8fac6dc8156bf9489adcf3fa1a877065"
          },
          {
                "url": "textures/sprites/snowflake4.png",
                "mime": "image/png",
                "output": "snowflake4.png",
                "sha256": "4f0b530617e0dae36ff8ca955d0567327001df407875668a1b6822e99913dd8f"
          },
          {
                "url": "textures/sprites/snowflake5.png",
                "mime": "image/png",
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
    assets: []
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
    assets: []
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
          }
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
    assets: []
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
    inlineScripts: extractInlineScripts(html)
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

async function prepareAssets(source, definitions) {
  const assets = [];
  for (const pinned of definitions) {
    let definition = pinned;
    let bytes = await readFile(path.join(source, 'examples', definition.url));
    if (sha(bytes) !== definition.sha256) throw new Error(`${definition.url} differs from the pinned r186 bytes`);
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
      assets.push({ ...definition, bytes });
      continue;
    }
    else if (definition.mime === 'application/octet-stream') {
      // Raw model payloads (PLY/OBJ and friends): the sha256 pin above is
      // the only integrity gate; loaders parse at runtime.
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
  const [html, license, assets] = await Promise.all([
    readFile(htmlPath), readFile(licensePath), prepareAssets(source, definition.assets)
  ]);
  if (sha(html) !== definition.expected.html) {
    throw new Error(`Official ${options.example} HTML differs from the pinned r186 bytes`);
  }
  const extracted = extractOfficial(html);
  if (sha(extracted.moduleBytes) !== definition.expected.module) {
    throw new Error(`Extracted official ${options.example} module differs from the pinned r186 bytes`);
  }
  const exportNames = await discoverExports(source);
  const facadeSource = facadeModule(exportNames, definition.id, definition.facadeWraps || null);
  const adapterAssets = assets.map(asset => ({
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
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'neutral',
    target: ['es2020'],
    minify: true,
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
      addonShims: definition.addonShims || null
    })],
    define: {
      __JSR_THREE_EXAMPLE_ID__: JSON.stringify(options.example),
      __JSR_THREE_WIDGET_ID__: JSON.stringify(definition.id),
      __JSR_THREE_EXAMPLE_ASSETS_JSON__: JSON.stringify(JSON.stringify(adapterAssets)),
      __JSR_THREE_EXAMPLE_SCRIPTS_JSON__: JSON.stringify(JSON.stringify(extracted.inlineScripts))
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
  for (const asset of assets) await addInput(`source/examples/${asset.url}`, asset.bytes);
  for (const file of ['prepare.mjs', 'example_adapter.js', 'example_canvas2d.js', 'lil_gui_adapter.js', 'stats_adapter.js']) {
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
