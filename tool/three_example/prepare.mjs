import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, readdir, stat, mkdir, writeFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

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
    plugins: [localOnlyPlugin({
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
