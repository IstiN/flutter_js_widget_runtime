var THREE=(()=>{var Sh=Object.defineProperty;var g0=Object.getOwnPropertyDescriptor;var _0=Object.getOwnPropertyNames;var x0=Object.prototype.hasOwnProperty;var Ah=(o,e)=>{for(var t in e)Sh(o,t,{get:e[t],enumerable:!0})},y0=(o,e,t,i)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of _0(e))!x0.call(o,r)&&r!==t&&Sh(o,r,{get:()=>e[r],enumerable:!(i=g0(e,r))||i.enumerable});return o};var v0=o=>y0(Sh({},"__esModule",{value:!0}),o);var Lb={};Ah(Lb,{ACESFilmicToneMapping:()=>Bh,AddEquation:()=>Ih,AddOperation:()=>Q0,AdditiveAnimationBlendMode:()=>Xo,AdditiveBlending:()=>P0,AgXToneMapping:()=>Oh,AlphaFormat:()=>zo,AlwaysCompare:()=>Nx,AlwaysDepth:()=>Fa,AlwaysStencilFunc:()=>Yh,AmbientLight:()=>eo,AnimationAction:()=>fo,AnimationClip:()=>Pt,AnimationLoader:()=>hc,AnimationMixer:()=>ya,AnimationObjectGroup:()=>Tc,AnimationUtils:()=>ac,ArcCurve:()=>ha,ArrayCamera:()=>bc,ArrowHelper:()=>eh,AttachedBindMode:()=>Ga,Audio:()=>Sr,AudioAnalyser:()=>Ac,AudioContext:()=>Li,AudioListener:()=>Mc,AudioLoader:()=>vc,AxesHelper:()=>th,BackSide:()=>yi,BasicDepthPacking:()=>Xh,BasicShadowMap:()=>C0,BatchedMesh:()=>Es,BezierInterpolant:()=>Ks,Bone:()=>Si,BooleanKeyframeTrack:()=>di,Box2:()=>po,Box3:()=>ye,Box3Helper:()=>jc,BoxGeometry:()=>Ci,BoxHelper:()=>Kc,BufferAttribute:()=>$,BufferGeometry:()=>D,BufferGeometryLoader:()=>so,ByteType:()=>Po,Cache:()=>nt,Camera:()=>Pi,CameraHelper:()=>Zc,CanvasTexture:()=>Bl,CapsuleGeometry:()=>zl,CatmullRomCurve3:()=>ua,CineonToneMapping:()=>Dh,CircleGeometry:()=>kl,ClampToEdgeWrapping:()=>Be,Clock:()=>Nc,Color:()=>L,ColorKeyframeTrack:()=>on,ColorManagement:()=>ze,Compatibility:()=>Xx,CompressedArrayTexture:()=>Nl,CompressedCubeTexture:()=>Dl,CompressedTexture:()=>Ai,CompressedTextureLoader:()=>uc,ConeGeometry:()=>Ls,ConstantAlphaFactor:()=>K0,ConstantColorFactor:()=>Z0,Controls:()=>rh,CubeCamera:()=>co,CubeDepthTexture:()=>Ol,CubeReflectionMapping:()=>At,CubeRefractionMapping:()=>Ui,CubeTexture:()=>Ti,CubeTextureLoader:()=>dc,CubeUVReflectionMapping:()=>Io,CubicBezierCurve:()=>$r,CubicBezierCurve3:()=>da,CubicInterpolant:()=>Zs,CullFaceBack:()=>S0,CullFaceFront:()=>A0,CullFaceFrontBack:()=>T0,CullFaceNone:()=>M0,Curve:()=>Ee,CurvePath:()=>Ns,CustomBlending:()=>Eh,CustomToneMapping:()=>Fh,CylinderGeometry:()=>Ps,Cylindrical:()=>Bc,Data3DTexture:()=>sr,DataArrayTexture:()=>os,DataTexture:()=>Le,DataTextureLoader:()=>vh,DataUtils:()=>sl,DecrementStencilOp:()=>mx,DecrementWrapStencilOp:()=>_x,DefaultLoadingManager:()=>cc,DepthFormat:()=>er,DepthStencilFormat:()=>Vo,DepthTexture:()=>Rs,DetachedBindMode:()=>zh,DirectionalLight:()=>br,DirectionalLightHelper:()=>Xc,DiscreteInterpolant:()=>Js,DodecahedronGeometry:()=>Vl,DoubleSide:()=>Co,DstAlphaFactor:()=>H0,DstColorFactor:()=>q0,DynamicCopyUsage:()=>zx,DynamicDrawUsage:()=>Zh,DynamicReadUsage:()=>Fx,EdgesGeometry:()=>ql,EllipseCurve:()=>Zi,EqualCompare:()=>Ex,EqualDepth:()=>Ua,EqualStencilFunc:()=>wx,EquirectangularReflectionMapping:()=>Eo,EquirectangularRefractionMapping:()=>kh,Euler:()=>$e,EventDispatcher:()=>Fe,ExternalTexture:()=>Ul,ExtrudeGeometry:()=>Jl,FileLoader:()=>ji,Float16BufferAttribute:()=>xu,Float32BufferAttribute:()=>R,FloatType:()=>Tt,Fog:()=>us,FogExp2:()=>hs,FramebufferTexture:()=>Ll,FrontSide:()=>Oi,Frustum:()=>It,FrustumArray:()=>Cs,GLBufferAttribute:()=>Pc,GLSL1:()=>Vx,GLSL3:()=>Gx,GLTFLoader:()=>wh,GreaterCompare:()=>Rx,GreaterDepth:()=>ka,GreaterEqualCompare:()=>Lx,GreaterEqualDepth:()=>za,GreaterEqualStencilFunc:()=>Ax,GreaterStencilFunc:()=>Mx,GridHelper:()=>Hc,Group:()=>vt,HTMLTexture:()=>Fl,HalfFloatType:()=>zi,HemisphereLight:()=>Qs,HemisphereLightHelper:()=>Gc,IcosahedronGeometry:()=>Kl,ImageBitmapLoader:()=>oo,ImageLoader:()=>So,ImageUtils:()=>ss,IncrementStencilOp:()=>px,IncrementWrapStencilOp:()=>gx,InstancedBufferAttribute:()=>ft,InstancedBufferGeometry:()=>no,InstancedInterleavedBuffer:()=>Rc,InstancedMesh:()=>pr,Int16BufferAttribute:()=>gu,Int32BufferAttribute:()=>_u,Int8BufferAttribute:()=>fu,IntType:()=>Do,InterleavedBuffer:()=>Vt,InterleavedBufferAttribute:()=>Gt,Interpolant:()=>gt,InterpolateBezier:()=>Ha,InterpolateDiscrete:()=>bi,InterpolateLinear:()=>tr,InterpolateSmooth:()=>qo,InterpolationSamplingMode:()=>qx,InterpolationSamplingType:()=>Wx,InvertStencilOp:()=>xx,JsrPMREMGenerator:()=>of,JsrThreeCanvas:()=>Ta,KeepStencilOp:()=>Zo,KeyframeTrack:()=>Oe,LOD:()=>As,LatheGeometry:()=>jl,Layers:()=>ar,LessCompare:()=>Cx,LessDepth:()=>Oa,LessEqualCompare:()=>Ix,LessEqualDepth:()=>wn,LessEqualStencilFunc:()=>bx,LessStencilFunc:()=>vx,Light:()=>et,LightProbe:()=>io,LightShadow:()=>Ii,Line:()=>Ze,Line3:()=>Uc,LineBasicMaterial:()=>oe,LineCurve:()=>Qr,LineCurve3:()=>fa,LineDashedMaterial:()=>Ys,LineLoop:()=>mr,LineSegments:()=>Ce,LinearFilter:()=>xe,LinearInterpolant:()=>xr,LinearMipMapLinearFilter:()=>rx,LinearMipMapNearestFilter:()=>ix,LinearMipmapLinearFilter:()=>Yt,LinearMipmapNearestFilter:()=>Ro,LinearSRGBColorSpace:()=>ct,LinearToneMapping:()=>Lh,LinearTransfer:()=>Wa,Loader:()=>ce,LoaderUtils:()=>qt,LoadingManager:()=>an,LoopOnce:()=>Gh,LoopPingPong:()=>Wh,LoopRepeat:()=>Hh,MOUSE:()=>w0,Material:()=>te,MaterialBlending:()=>D0,MaterialLoader:()=>ro,MathUtils:()=>Ya,Matrix2:()=>Fc,Matrix3:()=>Z,Matrix4:()=>z,MaxEquation:()=>U0,Mesh:()=>ae,MeshBasicMaterial:()=>_e,MeshDepthMaterial:()=>Ws,MeshDistanceMaterial:()=>qs,MeshLambertMaterial:()=>Hs,MeshMatcapMaterial:()=>Xs,MeshNormalMaterial:()=>Gs,MeshPhongMaterial:()=>ks,MeshPhysicalMaterial:()=>rt,MeshStandardMaterial:()=>ui,MeshToonMaterial:()=>Vs,MinEquation:()=>O0,MirroredRepeatWrapping:()=>si,MixOperation:()=>$0,MultiplyBlending:()=>N0,MultiplyOperation:()=>Rr,NearestFilter:()=>me,NearestMipMapLinearFilter:()=>tx,NearestMipMapNearestFilter:()=>ex,NearestMipmapLinearFilter:()=>Lr,NearestMipmapNearestFilter:()=>Pr,NeutralToneMapping:()=>Uh,NeverCompare:()=>Tx,NeverDepth:()=>Ba,NeverStencilFunc:()=>yx,NoBlending:()=>Qi,NoColorSpace:()=>kr,NoNormalPacking:()=>cx,NoToneMapping:()=>bn,NormalAnimationBlendMode:()=>zr,NormalBlending:()=>Ch,NormalGAPacking:()=>ux,NormalRGPacking:()=>hx,NotEqualCompare:()=>Px,NotEqualDepth:()=>Va,NotEqualStencilFunc:()=>Sx,NumberKeyframeTrack:()=>fi,Object3D:()=>q,ObjectLoader:()=>xc,ObjectSpaceNormalMap:()=>lx,OctahedronGeometry:()=>Bs,OneFactor:()=>k0,OneMinusConstantAlphaFactor:()=>j0,OneMinusConstantColorFactor:()=>J0,OneMinusDstAlphaFactor:()=>W0,OneMinusDstColorFactor:()=>X0,OneMinusSrcAlphaFactor:()=>Ph,OneMinusSrcColorFactor:()=>G0,OrthographicCamera:()=>ii,PCFShadowMap:()=>E0,PCFSoftShadowMap:()=>I0,PMREMGenerator:()=>of,Path:()=>Ei,PerspectiveCamera:()=>be,Plane:()=>Ht,PlaneGeometry:()=>$l,PlaneHelper:()=>$c,PointLight:()=>wr,PointLightHelper:()=>Vc,Points:()=>gr,PointsMaterial:()=>$t,PolarGridHelper:()=>Wc,PolyhedronGeometry:()=>Qt,PositionalAudio:()=>Sc,PropertyBinding:()=>le,PropertyMixer:()=>uo,QuadraticBezierCurve:()=>en,QuadraticBezierCurve3:()=>tn,Quaternion:()=>ge,QuaternionKeyframeTrack:()=>ti,QuaternionLinearInterpolant:()=>js,R11_EAC_Format:()=>Rn,RED_GREEN_RGTC2_Format:()=>Qn,RED_RGTC1_Format:()=>jn,REVISION:()=>Th,RG11_EAC_Format:()=>Ln,RGBADepthPacking:()=>sx,RGBAFormat:()=>je,RGBAIntegerFormat:()=>Wo,RGBA_ASTC_10x10_Format:()=>qn,RGBA_ASTC_10x5_Format:()=>Gn,RGBA_ASTC_10x6_Format:()=>Hn,RGBA_ASTC_10x8_Format:()=>Wn,RGBA_ASTC_12x10_Format:()=>Xn,RGBA_ASTC_12x12_Format:()=>Yn,RGBA_ASTC_4x4_Format:()=>Dn,RGBA_ASTC_5x4_Format:()=>Bn,RGBA_ASTC_5x5_Format:()=>Fn,RGBA_ASTC_6x5_Format:()=>On,RGBA_ASTC_6x6_Format:()=>Un,RGBA_ASTC_8x5_Format:()=>zn,RGBA_ASTC_8x6_Format:()=>kn,RGBA_ASTC_8x8_Format:()=>Vn,RGBA_BPTC_Format:()=>Zn,RGBA_ETC2_EAC_Format:()=>In,RGBA_PVRTC_2BPPV1_Format:()=>Tn,RGBA_PVRTC_4BPPV1_Format:()=>An,RGBA_S3TC_DXT1_Format:()=>Br,RGBA_S3TC_DXT3_Format:()=>Fr,RGBA_S3TC_DXT5_Format:()=>Or,RGBDepthPacking:()=>ox,RGBFormat:()=>ko,RGBIntegerFormat:()=>nx,RGB_BPTC_SIGNED_Format:()=>Jn,RGB_BPTC_UNSIGNED_Format:()=>Kn,RGB_ETC1_Format:()=>Cn,RGB_ETC2_Format:()=>En,RGB_PVRTC_2BPPV1_Format:()=>Sn,RGB_PVRTC_4BPPV1_Format:()=>Mn,RGB_S3TC_DXT1_Format:()=>Dr,RGDepthPacking:()=>ax,RGFormat:()=>Go,RGIntegerFormat:()=>Ho,RawShaderMaterial:()=>zs,Ray:()=>Et,Raycaster:()=>Lc,RectAreaLight:()=>to,RedFormat:()=>wi,RedIntegerFormat:()=>Nr,ReinhardToneMapping:()=>Nh,RenderObjectRefreshType:()=>Yx,RenderTarget:()=>nr,RenderTarget3D:()=>Cc,RepeatWrapping:()=>Ft,ReplaceStencilOp:()=>fx,ReverseSubtractEquation:()=>F0,RingGeometry:()=>Ql,SIGNED_R11_EAC_Format:()=>Pn,SIGNED_RED_GREEN_RGTC2_Format:()=>es,SIGNED_RED_RGTC1_Format:()=>$n,SIGNED_RG11_EAC_Format:()=>Nn,SRGBColorSpace:()=>ve,SRGBTransfer:()=>Ae,Scene:()=>ds,ShaderChunk:()=>ie,ShaderLib:()=>sh,ShaderMaterial:()=>St,ShadowMaterial:()=>Os,Shape:()=>ei,ShapeGeometry:()=>ec,ShapePath:()=>ih,ShapeUtils:()=>Mt,ShortType:()=>Lo,Skeleton:()=>fr,SkeletonHelper:()=>va,SkinnedMesh:()=>dr,Source:()=>Za,Sphere:()=>pe,SphereGeometry:()=>Fs,Spherical:()=>Dc,SphericalHarmonics3:()=>Mr,SplineCurve:()=>rn,SpotLight:()=>vr,SpotLightHelper:()=>zc,Sprite:()=>Ss,SpriteMaterial:()=>ur,SrcAlphaFactor:()=>Rh,SrcAlphaSaturateFactor:()=>Y0,SrcColorFactor:()=>V0,StaticCopyUsage:()=>Ux,StaticDrawUsage:()=>Vr,StaticReadUsage:()=>Bx,StereoCamera:()=>wc,StreamCopyUsage:()=>kx,StreamDrawUsage:()=>Dx,StreamReadUsage:()=>Ox,StringKeyframeTrack:()=>pi,SubtractEquation:()=>B0,SubtractiveBlending:()=>L0,TOUCH:()=>b0,TangentSpaceNormalMap:()=>Ot,TetrahedronGeometry:()=>tc,Texture:()=>ne,TextureLoader:()=>yn,TextureSource:()=>ut,TextureUtils:()=>nh,ThreeCapabilityError:()=>Ma,ThreeCompatibilityRuntime:()=>Ca,Timer:()=>ho,TimestampQuery:()=>Hx,TorusGeometry:()=>ic,TorusKnotGeometry:()=>rc,Triangle:()=>Ct,TriangleFanDrawMode:()=>ts,TriangleStripDrawMode:()=>Yo,TrianglesDrawMode:()=>qh,TubeGeometry:()=>nc,UVMapping:()=>vi,Uint16BufferAttribute:()=>$o,Uint32BufferAttribute:()=>Qo,Uint8BufferAttribute:()=>pu,Uint8ClampedBufferAttribute:()=>mu,Uniform:()=>Ec,UniformsGroup:()=>Ic,UniformsLib:()=>U,UniformsUtils:()=>up,UnsignedByteType:()=>Zt,UnsignedInt101111Type:()=>Uo,UnsignedInt248Type:()=>Vh,UnsignedInt5999Type:()=>Oo,UnsignedIntType:()=>oi,UnsignedShort4444Type:()=>Bo,UnsignedShort5551Type:()=>Fo,UnsignedShortType:()=>No,VSMShadowMap:()=>R0,Vector2:()=>E,Vector3:()=>w,Vector4:()=>Te,VectorKeyframeTrack:()=>mi,VideoFrameTexture:()=>Pl,VideoTexture:()=>Is,WebGL3DRenderTarget:()=>Ka,WebGLArrayRenderTarget:()=>Ja,WebGLCoordinateSystem:()=>tt,WebGLCubeRenderTarget:()=>ah,WebGLRenderTarget:()=>Kt,WebGLRenderer:()=>Mo,WebGLUtils:()=>M_,WebGPUCoordinateSystem:()=>Jt,WebGPURenderer:()=>lh,WebXRController:()=>el,WireframeGeometry:()=>sc,WrapAroundEnding:()=>Ur,ZeroCurvatureEnding:()=>ki,ZeroFactor:()=>z0,ZeroSlopeEnding:()=>Vi,ZeroStencilOp:()=>dx,createCanvasElement:()=>pf,error:()=>K,getConsoleFunction:()=>gf,getNativeRaycastDiagnostics:()=>L_,log:()=>Jo,setConsoleFunction:()=>mf,warn:()=>O,warnOnce:()=>Ut});var Th="186",w0={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},b0={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},M0=0,S0=1,A0=2,T0=3,C0=0,E0=1,I0=2,R0=3,Oi=0,yi=1,Co=2,Qi=0,Ch=1,P0=2,L0=3,N0=4,Eh=5,D0=6,Ih=100,B0=101,F0=102,O0=103,U0=104,z0=200,k0=201,V0=202,G0=203,Rh=204,Ph=205,H0=206,W0=207,q0=208,X0=209,Y0=210,Z0=211,J0=212,K0=213,j0=214,Ba=0,Fa=1,Oa=2,wn=3,Ua=4,za=5,ka=6,Va=7,Rr=0,$0=1,Q0=2,bn=0,Lh=1,Nh=2,Dh=3,Bh=4,Fh=5,Oh=6,Uh=7,Ga="attached",zh="detached",vi=300,At=301,Ui=302,Eo=303,kh=304,Io=306,Ft=1e3,Be=1001,si=1002,me=1003,Pr=1004,ex=1004,Lr=1005,tx=1005,xe=1006,Ro=1007,ix=1007,Yt=1008,rx=1008,Zt=1009,Po=1010,Lo=1011,No=1012,Do=1013,oi=1014,Tt=1015,zi=1016,Bo=1017,Fo=1018,Vh=1020,Oo=35902,Uo=35899,zo=1021,ko=1022,je=1023,er=1026,Vo=1027,wi=1028,Nr=1029,Go=1030,Ho=1031,nx=1032,Wo=1033,Dr=33776,Br=33777,Fr=33778,Or=33779,Mn=35840,Sn=35841,An=35842,Tn=35843,Cn=36196,En=37492,In=37496,Rn=37488,Pn=37489,Ln=37490,Nn=37491,Dn=37808,Bn=37809,Fn=37810,On=37811,Un=37812,zn=37813,kn=37814,Vn=37815,Gn=37816,Hn=37817,Wn=37818,qn=37819,Xn=37820,Yn=37821,Zn=36492,Jn=36494,Kn=36495,jn=36283,$n=36284,Qn=36285,es=36286,Gh=2200,Hh=2201,Wh=2202,bi=2300,tr=2301,qo=2302,Ha=2303,ki=2400,Vi=2401,Ur=2402,zr=2500,Xo=2501,qh=0,Yo=1,ts=2,Xh=3200,sx=3201,ox=3202,ax=3203,Ot=0,lx=1,kr="",ve="srgb",ct="srgb-linear",Wa="linear",Ae="srgb",cx="",hx="rg",ux="ga",dx=0,Zo=7680,fx=7681,px=7682,mx=7683,gx=34055,_x=34056,xx=5386,yx=512,vx=513,wx=514,bx=515,Mx=516,Sx=517,Ax=518,Yh=519,Tx=512,Cx=513,Ex=514,Ix=515,Rx=516,Px=517,Lx=518,Nx=519,Vr=35044,Zh=35048,Dx=35040,Bx=35045,Fx=35049,Ox=35041,Ux=35046,zx=35050,kx=35042,Vx="100",Gx="300 es",tt=2e3,Jt=2001,Hx={COMPUTE:"compute",RENDER:"render"},Wx={PERSPECTIVE:"perspective",LINEAR:"linear",FLAT:"flat"},qx={NORMAL:"normal",CENTROID:"centroid",SAMPLE:"sample",FIRST:"first",EITHER:"either"},Xx={TEXTURE_COMPARE:"depthTextureCompare"},Yx={NONE:0,SHARED:1,FULL:2};function ff(o){for(let e=o.length-1;e>=0;--e)if(o[e]>=65535)return!0;return!1}var Zx={Int8Array,Uint8Array,Uint8ClampedArray,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array};function rr(o,e){return new Zx[o](e)}function qa(o){return ArrayBuffer.isView(o)&&!(o instanceof DataView)}function is(o){return document.createElementNS("http://www.w3.org/1999/xhtml",o)}function pf(){let o=is("canvas");return o.style.display="block",o}var df={},ir=null;function mf(o){ir=o}function gf(){return ir}function Jo(...o){let e="THREE."+o.shift();ir?ir("log",e,...o):console.log(e,...o)}function _f(o){let e=o[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=o[1];t&&t.isStackTrace?o[0]+=" "+t.getLocation():o[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return o}function O(...o){o=_f(o);let e="THREE."+o.shift();if(ir)ir("warn",e,...o);else{let t=o[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...o)}}function K(...o){o=_f(o);let e="THREE."+o.shift();if(ir)ir("error",e,...o);else{let t=o[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...o)}}function Ut(...o){let e=o.join(" ");e in df||(df[e]=!0,O(...o))}var Fb={[Ba]:Fa,[Oa]:ka,[Ua]:Va,[wn]:za,[Fa]:Ba,[ka]:Oa,[Va]:Ua,[za]:wn};var Fe=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){let i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){let i=this._listeners;if(i===void 0)return;let r=i[e];if(r!==void 0){let n=r.indexOf(t);n!==-1&&r.splice(n,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let i=t[e.type];if(i!==void 0){e.target=this;let r=i.slice(0);for(let n=0,s=r.length;n<s;n++)r[n].call(this,e);e.target=null}}};var ht=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],xf=1234567,Mi=Math.PI/180,Gr=180/Math.PI;function Pe(){let o=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(ht[o&255]+ht[o>>8&255]+ht[o>>16&255]+ht[o>>24&255]+"-"+ht[e&255]+ht[e>>8&255]+"-"+ht[e>>16&15|64]+ht[e>>24&255]+"-"+ht[t&63|128]+ht[t>>8&255]+"-"+ht[t>>16&255]+ht[t>>24&255]+ht[i&255]+ht[i>>8&255]+ht[i>>16&255]+ht[i>>24&255]).toLowerCase()}function W(o,e,t){return Math.max(e,Math.min(t,o))}function Xa(o,e){return(o%e+e)%e}function Jx(o,e,t,i,r){return i+(o-e)*(r-i)/(t-e)}function Kx(o,e,t){return o!==e?(t-o)/(e-o):0}function rs(o,e,t){return(1-t)*o+t*e}function jx(o,e,t,i){return rs(o,e,1-Math.exp(-t*i))}function $x(o,e=1){return e-Math.abs(Xa(o,e*2)-e)}function Qx(o,e,t){return o<=e?0:o>=t?1:(o=(o-e)/(t-e),o*o*(3-2*o))}function ey(o,e,t){return o<=e?0:o>=t?1:(o=(o-e)/(t-e),o*o*o*(o*(o*6-15)+10))}function ty(o,e){return o+Math.floor(Math.random()*(e-o+1))}function iy(o,e){return o+Math.random()*(e-o)}function ry(o){return o*(.5-Math.random())}function ny(o){o!==void 0&&(xf=o);let e=xf+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function sy(o){return o*Mi}function oy(o){return o*Gr}function ay(o){return o>0&&Number.isInteger(o)&&2**Math.round(Math.log2(o))===o}function ly(o){return Math.pow(2,Math.ceil(Math.log(o)/Math.LN2))}function cy(o){return Math.pow(2,Math.floor(Math.log(o)/Math.LN2))}function hy(o,e,t,i,r){let n=Math.cos,s=Math.sin,a=n(t/2),l=s(t/2),c=n((e+i)/2),h=s((e+i)/2),u=n((e-i)/2),d=s((e-i)/2),f=n((i-e)/2),p=s((i-e)/2);switch(r){case"XYX":o.set(a*h,l*u,l*d,a*c);break;case"YZY":o.set(l*d,a*h,l*u,a*c);break;case"ZXZ":o.set(l*u,l*d,a*h,a*c);break;case"XZX":o.set(a*h,l*p,l*f,a*c);break;case"YXY":o.set(l*f,a*h,l*p,a*c);break;case"ZYZ":o.set(l*p,l*f,a*h,a*c);break;default:O("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function it(o,e){switch(e.constructor){case Float32Array:return o;case Uint32Array:return o/4294967295;case Uint16Array:return o/65535;case Uint8Array:case Uint8ClampedArray:return o/255;case Int32Array:return Math.max(o/2147483647,-1);case Int16Array:return Math.max(o/32767,-1);case Int8Array:return Math.max(o/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function j(o,e){switch(e.constructor){case Float32Array:return o;case Uint32Array:return Math.round(o*4294967295);case Uint16Array:return Math.round(o*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(o*255);case Int32Array:return Math.round(o*2147483647);case Int16Array:return Math.round(o*32767);case Int8Array:return Math.round(o*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var Ya={DEG2RAD:Mi,RAD2DEG:Gr,generateUUID:Pe,clamp:W,euclideanModulo:Xa,mapLinear:Jx,inverseLerp:Kx,lerp:rs,damp:jx,pingpong:$x,smoothstep:Qx,smootherstep:ey,randInt:ty,randFloat:iy,randFloatSpread:ry,seededRandom:ny,degToRad:sy,radToDeg:oy,isPowerOfTwo:ay,ceilPowerOfTwo:ly,floorPowerOfTwo:cy,setQuaternionFromProperEuler:hy,normalize:j,denormalize:it};var Jh=class Jh{constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=W(this.x,e.x,t.x),this.y=W(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=W(this.x,e,t),this.y=W(this.y,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(W(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(W(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),r=Math.sin(t),n=this.x-e.x,s=this.y-e.y;return this.x=n*i-s*r+e.x,this.y=n*r+s*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};Jh.prototype.isVector2=!0;var E=Jh;var ge=class{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,n,s,a){let l=i[r+0],c=i[r+1],h=i[r+2],u=i[r+3],d=n[s+0],f=n[s+1],p=n[s+2],m=n[s+3];if(u!==m||l!==d||c!==f||h!==p){let _=l*d+c*f+h*p+u*m;_<0&&(d=-d,f=-f,p=-p,m=-m,_=-_);let g=1-a;if(_<.9995){let x=Math.acos(_),y=Math.sin(x);g=Math.sin(g*x)/y,a=Math.sin(a*x)/y,l=l*g+d*a,c=c*g+f*a,h=h*g+p*a,u=u*g+m*a}else{l=l*g+d*a,c=c*g+f*a,h=h*g+p*a,u=u*g+m*a;let x=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=x,c*=x,h*=x,u*=x}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,i,r,n,s){let a=i[r],l=i[r+1],c=i[r+2],h=i[r+3],u=n[s],d=n[s+1],f=n[s+2],p=n[s+3];return e[t]=a*p+h*u+l*f-c*d,e[t+1]=l*p+h*d+c*u-a*f,e[t+2]=c*p+h*f+a*d-l*u,e[t+3]=h*p-a*u-l*d-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,r=e._y,n=e._z,s=e._order,a=Math.cos,l=Math.sin,c=a(i/2),h=a(r/2),u=a(n/2),d=l(i/2),f=l(r/2),p=l(n/2);switch(s){case"XYZ":this._x=d*h*u+c*f*p,this._y=c*f*u-d*h*p,this._z=c*h*p+d*f*u,this._w=c*h*u-d*f*p;break;case"YXZ":this._x=d*h*u+c*f*p,this._y=c*f*u-d*h*p,this._z=c*h*p-d*f*u,this._w=c*h*u+d*f*p;break;case"ZXY":this._x=d*h*u-c*f*p,this._y=c*f*u+d*h*p,this._z=c*h*p+d*f*u,this._w=c*h*u-d*f*p;break;case"ZYX":this._x=d*h*u-c*f*p,this._y=c*f*u+d*h*p,this._z=c*h*p-d*f*u,this._w=c*h*u+d*f*p;break;case"YZX":this._x=d*h*u+c*f*p,this._y=c*f*u+d*h*p,this._z=c*h*p-d*f*u,this._w=c*h*u-d*f*p;break;case"XZY":this._x=d*h*u-c*f*p,this._y=c*f*u-d*h*p,this._z=c*h*p+d*f*u,this._w=c*h*u+d*f*p;break;default:O("Quaternion: .setFromEuler() encountered an unknown order: "+s)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],r=t[4],n=t[8],s=t[1],a=t[5],l=t[9],c=t[2],h=t[6],u=t[10],d=i+a+u;if(d>0){let f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(h-l)*f,this._y=(n-c)*f,this._z=(s-r)*f}else if(i>a&&i>u){let f=2*Math.sqrt(1+i-a-u);this._w=(h-l)/f,this._x=.25*f,this._y=(r+s)/f,this._z=(n+c)/f}else if(a>u){let f=2*Math.sqrt(1+a-i-u);this._w=(n-c)/f,this._x=(r+s)/f,this._y=.25*f,this._z=(l+h)/f}else{let f=2*Math.sqrt(1+u-i-a);this._w=(s-r)/f,this._x=(n+c)/f,this._y=(l+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(W(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,r=e._y,n=e._z,s=e._w,a=t._x,l=t._y,c=t._z,h=t._w;return this._x=i*h+s*a+r*c-n*l,this._y=r*h+s*l+n*a-i*c,this._z=n*h+s*c+i*l-r*a,this._w=s*h-i*a-r*l-n*c,this._onChangeCallback(),this}slerp(e,t){let i=e._x,r=e._y,n=e._z,s=e._w,a=this.dot(e);a<0&&(i=-i,r=-r,n=-n,s=-s,a=-a);let l=1-t;if(a<.9995){let c=Math.acos(a),h=Math.sin(c);l=Math.sin(l*c)/h,t=Math.sin(t*c)/h,this._x=this._x*l+i*t,this._y=this._y*l+r*t,this._z=this._z*l+n*t,this._w=this._w*l+s*t,this._onChangeCallback()}else this._x=this._x*l+i*t,this._y=this._y*l+r*t,this._z=this._z*l+n*t,this._w=this._w*l+s*t,this.normalize();return this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),n=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),n*Math.sin(t),n*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}};var jh=class jh{constructor(e=0,t=0,i=0){this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(yf.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(yf.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,r=this.z,n=e.elements;return this.x=n[0]*t+n[3]*i+n[6]*r,this.y=n[1]*t+n[4]*i+n[7]*r,this.z=n[2]*t+n[5]*i+n[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,r=this.z,n=e.elements,s=1/(n[3]*t+n[7]*i+n[11]*r+n[15]);return this.x=(n[0]*t+n[4]*i+n[8]*r+n[12])*s,this.y=(n[1]*t+n[5]*i+n[9]*r+n[13])*s,this.z=(n[2]*t+n[6]*i+n[10]*r+n[14])*s,this}applyQuaternion(e){let t=this.x,i=this.y,r=this.z,n=e.x,s=e.y,a=e.z,l=e.w,c=2*(s*r-a*i),h=2*(a*t-n*r),u=2*(n*i-s*t);return this.x=t+l*c+s*u-a*h,this.y=i+l*h+a*c-n*u,this.z=r+l*u+n*h-s*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,r=this.z,n=e.elements;return this.x=n[0]*t+n[4]*i+n[8]*r,this.y=n[1]*t+n[5]*i+n[9]*r,this.z=n[2]*t+n[6]*i+n[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=W(this.x,e.x,t.x),this.y=W(this.y,e.y,t.y),this.z=W(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=W(this.x,e,t),this.y=W(this.y,e,t),this.z=W(this.z,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(W(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,r=e.y,n=e.z,s=t.x,a=t.y,l=t.z;return this.x=r*l-n*a,this.y=n*s-i*l,this.z=i*a-r*s,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return Kh.copy(this).projectOnVector(e),this.sub(Kh)}reflect(e){return this.sub(Kh.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(W(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};jh.prototype.isVector3=!0;var w=jh,Kh=new w,yf=new ge;var Qh=class Qh{constructor(e,t,i,r,n,s,a,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,n,s,a,l,c)}set(e,t,i,r,n,s,a,l,c){let h=this.elements;return h[0]=e,h[1]=r,h[2]=a,h[3]=t,h[4]=n,h[5]=l,h[6]=i,h[7]=s,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,r=t.elements,n=this.elements,s=i[0],a=i[3],l=i[6],c=i[1],h=i[4],u=i[7],d=i[2],f=i[5],p=i[8],m=r[0],_=r[3],g=r[6],x=r[1],y=r[4],v=r[7],M=r[2],A=r[5],T=r[8];return n[0]=s*m+a*x+l*M,n[3]=s*_+a*y+l*A,n[6]=s*g+a*v+l*T,n[1]=c*m+h*x+u*M,n[4]=c*_+h*y+u*A,n[7]=c*g+h*v+u*T,n[2]=d*m+f*x+p*M,n[5]=d*_+f*y+p*A,n[8]=d*g+f*v+p*T,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],r=e[2],n=e[3],s=e[4],a=e[5],l=e[6],c=e[7],h=e[8];return t*s*h-t*a*c-i*n*h+i*a*l+r*n*c-r*s*l}invert(){let e=this.elements,t=e[0],i=e[1],r=e[2],n=e[3],s=e[4],a=e[5],l=e[6],c=e[7],h=e[8],u=h*s-a*c,d=a*l-h*n,f=c*n-s*l,p=t*u+i*d+r*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let m=1/p;return e[0]=u*m,e[1]=(r*c-h*i)*m,e[2]=(a*i-r*s)*m,e[3]=d*m,e[4]=(h*t-r*l)*m,e[5]=(r*n-a*t)*m,e[6]=f*m,e[7]=(i*l-c*t)*m,e[8]=(s*t-i*n)*m,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,n,s,a){let l=Math.cos(n),c=Math.sin(n);return this.set(i*l,i*c,-i*(l*s+c*a)+s+e,-r*c,r*l,-r*(-c*s+l*a)+a+t,0,0,1),this}scale(e,t){return Ut("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply($h.makeScale(e,t)),this}rotate(e){return Ut("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply($h.makeRotation(-e)),this}translate(e,t){return Ut("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply($h.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}};Qh.prototype.isMatrix3=!0;var Z=Qh,$h=new Z;var vf=new Z().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),wf=new Z().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function uy(){let o={enabled:!0,workingColorSpace:ct,spaces:{},convert:function(r,n,s){return this.enabled===!1||n===s||!n||!s||(this.spaces[n].transfer===Ae&&(r.r=ai(r.r),r.g=ai(r.g),r.b=ai(r.b)),this.spaces[n].primaries!==this.spaces[s].primaries&&(r.applyMatrix3(this.spaces[n].toXYZ),r.applyMatrix3(this.spaces[s].fromXYZ)),this.spaces[s].transfer===Ae&&(r.r=Hr(r.r),r.g=Hr(r.g),r.b=Hr(r.b))),r},workingToColorSpace:function(r,n){return this.convert(r,this.workingColorSpace,n)},colorSpaceToWorking:function(r,n){return this.convert(r,n,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===kr?Wa:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,n=this.workingColorSpace){return r.fromArray(this.spaces[n].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,n,s){return r.copy(this.spaces[n].toXYZ).multiply(this.spaces[s].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,n){return Ut("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),o.workingToColorSpace(r,n)},toWorkingColorSpace:function(r,n){return Ut("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),o.colorSpaceToWorking(r,n)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return o.define({[ct]:{primaries:e,whitePoint:i,transfer:Wa,toXYZ:vf,fromXYZ:wf,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:ve},outputColorSpaceConfig:{drawingBufferColorSpace:ve}},[ve]:{primaries:e,whitePoint:i,transfer:Ae,toXYZ:vf,fromXYZ:wf,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:ve}}}),o}var ze=uy();function ai(o){return o<.04045?o*.0773993808:Math.pow(o*.9478672986+.0521327014,2.4)}function Hr(o){return o<.0031308?o*12.92:1.055*Math.pow(o,.41666)-.055}var ns,ss=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{ns===void 0&&(ns=is("canvas")),ns.width=e.width,ns.height=e.height;let r=ns.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),i=ns}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=is("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let r=i.getImageData(0,0,e.width,e.height),n=r.data;for(let s=0;s<n.length;s++)n[s]=ai(n[s]/255)*255;return i.putImageData(r,0,0),t}else if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(ai(t[i]/255)*255):t[i]=ai(t[i]);return{data:t,width:e.width,height:e.height}}else return O("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}};var dy=0,ut=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:dy++}),this.uuid=Pe(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let n;if(Array.isArray(r)){n=[];for(let s=0,a=r.length;s<a;s++)r[s].isDataTexture?n.push(eu(r[s].image)):n.push(eu(r[s]))}else n=eu(r);i.url=n}return t||(e.images[this.uuid]=i),i}};function eu(o){return typeof HTMLImageElement<"u"&&o instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&o instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&o instanceof ImageBitmap?ss.getDataURL(o):o.data?{data:Array.from(o.data),width:o.width,height:o.height,type:o.data.constructor.name}:(O("Texture: Unable to serialize Texture."),{})}var Za=class extends ut{constructor(e=null){Ut('Source: "Source" has been renamed to "TextureSource". Please update your code to use "THREE.TextureSource" instead.'),super(e),this.isSource=!0}};var fy=0,tu=new w,ne=class o extends Fe{constructor(e=o.DEFAULT_IMAGE,t=o.DEFAULT_MAPPING,i=Be,r=Be,n=xe,s=Yt,a=je,l=Zt,c=o.DEFAULT_ANISOTROPY,h=kr){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:fy++}),this.uuid=Pe(),this.name="",this.source=new ut(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=n,this.minFilter=s,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new E(0,0),this.repeat=new E(1,1),this.center=new E(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Z,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(tu).x}get height(){return this.source.getSize(tu).y}get depth(){return this.source.getSize(tu).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let i=e[t];if(i===void 0){O(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){O(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&i&&r.isVector2&&i.isVector2||r&&i&&r.isVector3&&i.isVector3||r&&i&&r.isMatrix3&&i.isMatrix3?r.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==vi)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Ft:e.x=e.x-Math.floor(e.x);break;case Be:e.x=e.x<0?0:1;break;case si:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Ft:e.y=e.y-Math.floor(e.y);break;case Be:e.y=e.y<0?0:1;break;case si:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};ne.DEFAULT_IMAGE=null;ne.DEFAULT_MAPPING=vi;ne.DEFAULT_ANISOTROPY=1;var iu=class iu{constructor(e=0,t=0,i=0,r=1){this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,r=this.z,n=this.w,s=e.elements;return this.x=s[0]*t+s[4]*i+s[8]*r+s[12]*n,this.y=s[1]*t+s[5]*i+s[9]*r+s[13]*n,this.z=s[2]*t+s[6]*i+s[10]*r+s[14]*n,this.w=s[3]*t+s[7]*i+s[11]*r+s[15]*n,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,n,l=e.elements,c=l[0],h=l[4],u=l[8],d=l[1],f=l[5],p=l[9],m=l[2],_=l[6],g=l[10];if(Math.abs(h-d)<.01&&Math.abs(u-m)<.01&&Math.abs(p-_)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+m)<.1&&Math.abs(p+_)<.1&&Math.abs(c+f+g-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let y=(c+1)/2,v=(f+1)/2,M=(g+1)/2,A=(h+d)/4,T=(u+m)/4,S=(p+_)/4;return y>v&&y>M?y<.01?(i=0,r=.707106781,n=.707106781):(i=Math.sqrt(y),r=A/i,n=T/i):v>M?v<.01?(i=.707106781,r=0,n=.707106781):(r=Math.sqrt(v),i=A/r,n=S/r):M<.01?(i=.707106781,r=.707106781,n=0):(n=Math.sqrt(M),i=T/n,r=S/n),this.set(i,r,n,t),this}let x=Math.sqrt((_-p)*(_-p)+(u-m)*(u-m)+(d-h)*(d-h));return Math.abs(x)<.001&&(x=1),this.x=(_-p)/x,this.y=(u-m)/x,this.z=(d-h)/x,this.w=Math.acos((c+f+g-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=W(this.x,e.x,t.x),this.y=W(this.y,e.y,t.y),this.z=W(this.z,e.z,t.z),this.w=W(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=W(this.x,e,t),this.y=W(this.y,e,t),this.z=W(this.z,e,t),this.w=W(this.w,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(W(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};iu.prototype.isVector4=!0;var Te=iu;var nr=class extends Fe{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:xe,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new Te(0,0,e,t),this.scissorTest=!1,this.viewport=new Te(0,0,e,t),this.textures=[];let r={width:e,height:t,depth:i.depth},n=new ne(r),s=i.count;for(let a=0;a<s;a++)this.textures[a]=n.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveColorBuffer=i.resolveColorBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.storeMultisampledColorBuffer=i.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=i.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=i.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:xe,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let r=0,n=this.textures.length;r<n;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=i,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let r=Object.assign({},e.textures[t].image);this.textures[t].source=new ut(r)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}};var Kt=class extends nr{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}};var os=class extends ne{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=me,this.minFilter=me,this.wrapR=Be,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var Ja=class extends Kt{constructor(e=1,t=1,i=1,r={}){super(e,t,r),this.isWebGLArrayRenderTarget=!0,this.depth=i,this.texture=new os(null,e,t,i),this._setTextureOptions(r),this.texture.isRenderTargetTexture=!0}};var sr=class extends ne{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=me,this.minFilter=me,this.wrapR=Be,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}};var Ka=class extends Kt{constructor(e=1,t=1,i=1,r={}){super(e,t,r),this.isWebGL3DRenderTarget=!0,this.depth=i,this.texture=new sr(null,e,t,i),this._setTextureOptions(r),this.texture.isRenderTargetTexture=!0}};var $a=class $a{constructor(e,t,i,r,n,s,a,l,c,h,u,d,f,p,m,_){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,n,s,a,l,c,h,u,d,f,p,m,_)}set(e,t,i,r,n,s,a,l,c,h,u,d,f,p,m,_){let g=this.elements;return g[0]=e,g[4]=t,g[8]=i,g[12]=r,g[1]=n,g[5]=s,g[9]=a,g[13]=l,g[2]=c,g[6]=h,g[10]=u,g[14]=d,g[3]=f,g[7]=p,g[11]=m,g[15]=_,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new $a().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),i.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,i=e.elements,r=1/as.setFromMatrixColumn(e,0).length(),n=1/as.setFromMatrixColumn(e,1).length(),s=1/as.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*n,t[5]=i[5]*n,t[6]=i[6]*n,t[7]=0,t[8]=i[8]*s,t[9]=i[9]*s,t[10]=i[10]*s,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,r=e.y,n=e.z,s=Math.cos(i),a=Math.sin(i),l=Math.cos(r),c=Math.sin(r),h=Math.cos(n),u=Math.sin(n);if(e.order==="XYZ"){let d=s*h,f=s*u,p=a*h,m=a*u;t[0]=l*h,t[4]=-l*u,t[8]=c,t[1]=f+p*c,t[5]=d-m*c,t[9]=-a*l,t[2]=m-d*c,t[6]=p+f*c,t[10]=s*l}else if(e.order==="YXZ"){let d=l*h,f=l*u,p=c*h,m=c*u;t[0]=d+m*a,t[4]=p*a-f,t[8]=s*c,t[1]=s*u,t[5]=s*h,t[9]=-a,t[2]=f*a-p,t[6]=m+d*a,t[10]=s*l}else if(e.order==="ZXY"){let d=l*h,f=l*u,p=c*h,m=c*u;t[0]=d-m*a,t[4]=-s*u,t[8]=p+f*a,t[1]=f+p*a,t[5]=s*h,t[9]=m-d*a,t[2]=-s*c,t[6]=a,t[10]=s*l}else if(e.order==="ZYX"){let d=s*h,f=s*u,p=a*h,m=a*u;t[0]=l*h,t[4]=p*c-f,t[8]=d*c+m,t[1]=l*u,t[5]=m*c+d,t[9]=f*c-p,t[2]=-c,t[6]=a*l,t[10]=s*l}else if(e.order==="YZX"){let d=s*l,f=s*c,p=a*l,m=a*c;t[0]=l*h,t[4]=m-d*u,t[8]=p*u+f,t[1]=u,t[5]=s*h,t[9]=-a*h,t[2]=-c*h,t[6]=f*u+p,t[10]=d-m*u}else if(e.order==="XZY"){let d=s*l,f=s*c,p=a*l,m=a*c;t[0]=l*h,t[4]=-u,t[8]=c*h,t[1]=d*u+m,t[5]=s*h,t[9]=f*u-p,t[2]=p*u-f,t[6]=a*h,t[10]=m*u+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(py,e,my)}lookAt(e,t,i){let r=this.elements;return zt.subVectors(e,t),zt.lengthSq()===0&&(zt.z=1),zt.normalize(),or.crossVectors(i,zt),or.lengthSq()===0&&(Math.abs(i.z)===1?zt.x+=1e-4:zt.z+=1e-4,zt.normalize(),or.crossVectors(i,zt)),or.normalize(),ja.crossVectors(zt,or),r[0]=or.x,r[4]=ja.x,r[8]=zt.x,r[1]=or.y,r[5]=ja.y,r[9]=zt.y,r[2]=or.z,r[6]=ja.z,r[10]=zt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,r=t.elements,n=this.elements,s=i[0],a=i[4],l=i[8],c=i[12],h=i[1],u=i[5],d=i[9],f=i[13],p=i[2],m=i[6],_=i[10],g=i[14],x=i[3],y=i[7],v=i[11],M=i[15],A=r[0],T=r[4],S=r[8],b=r[12],C=r[1],I=r[5],B=r[9],N=r[13],k=r[2],V=r[6],J=r[10],Q=r[14],Me=r[3],he=r[7],ue=r[11],de=r[15];return n[0]=s*A+a*C+l*k+c*Me,n[4]=s*T+a*I+l*V+c*he,n[8]=s*S+a*B+l*J+c*ue,n[12]=s*b+a*N+l*Q+c*de,n[1]=h*A+u*C+d*k+f*Me,n[5]=h*T+u*I+d*V+f*he,n[9]=h*S+u*B+d*J+f*ue,n[13]=h*b+u*N+d*Q+f*de,n[2]=p*A+m*C+_*k+g*Me,n[6]=p*T+m*I+_*V+g*he,n[10]=p*S+m*B+_*J+g*ue,n[14]=p*b+m*N+_*Q+g*de,n[3]=x*A+y*C+v*k+M*Me,n[7]=x*T+y*I+v*V+M*he,n[11]=x*S+y*B+v*J+M*ue,n[15]=x*b+y*N+v*Q+M*de,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],r=e[8],n=e[12],s=e[1],a=e[5],l=e[9],c=e[13],h=e[2],u=e[6],d=e[10],f=e[14],p=e[3],m=e[7],_=e[11],g=e[15],x=l*f-c*d,y=a*f-c*u,v=a*d-l*u,M=s*f-c*h,A=s*d-l*h,T=s*u-a*h;return t*(m*x-_*y+g*v)-i*(p*x-_*M+g*A)+r*(p*y-m*M+g*T)-n*(p*v-m*A+_*T)}determinantAffine(){let e=this.elements,t=e[0],i=e[4],r=e[8],n=e[1],s=e[5],a=e[9],l=e[2],c=e[6],h=e[10];return t*(s*h-a*c)-i*(n*h-a*l)+r*(n*c-s*l)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],r=e[2],n=e[3],s=e[4],a=e[5],l=e[6],c=e[7],h=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],_=e[14],g=e[15],x=t*a-i*s,y=t*l-r*s,v=t*c-n*s,M=i*l-r*a,A=i*c-n*a,T=r*c-n*l,S=h*m-u*p,b=h*_-d*p,C=h*g-f*p,I=u*_-d*m,B=u*g-f*m,N=d*g-f*_,k=x*N-y*B+v*I+M*C-A*b+T*S;if(k===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let V=1/k;return e[0]=(a*N-l*B+c*I)*V,e[1]=(r*B-i*N-n*I)*V,e[2]=(m*T-_*A+g*M)*V,e[3]=(d*A-u*T-f*M)*V,e[4]=(l*C-s*N-c*b)*V,e[5]=(t*N-r*C+n*b)*V,e[6]=(_*v-p*T-g*y)*V,e[7]=(h*T-d*v+f*y)*V,e[8]=(s*B-a*C+c*S)*V,e[9]=(i*C-t*B-n*S)*V,e[10]=(p*A-m*v+g*x)*V,e[11]=(u*v-h*A-f*x)*V,e[12]=(a*b-s*I-l*S)*V,e[13]=(t*I-i*b+r*S)*V,e[14]=(m*y-p*M-_*x)*V,e[15]=(h*M-u*y+d*x)*V,this}scale(e){let t=this.elements,i=e.x,r=e.y,n=e.z;return t[0]*=i,t[4]*=r,t[8]*=n,t[1]*=i,t[5]*=r,t[9]*=n,t[2]*=i,t[6]*=r,t[10]*=n,t[3]*=i,t[7]*=r,t[11]*=n,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),r=Math.sin(t),n=1-i,s=e.x,a=e.y,l=e.z,c=n*s,h=n*a;return this.set(c*s+i,c*a-r*l,c*l+r*a,0,c*a+r*l,h*a+i,h*l-r*s,0,c*l-r*a,h*l+r*s,n*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,n,s){return this.set(1,i,n,0,e,1,s,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){let r=this.elements,n=t._x,s=t._y,a=t._z,l=t._w,c=n+n,h=s+s,u=a+a,d=n*c,f=n*h,p=n*u,m=s*h,_=s*u,g=a*u,x=l*c,y=l*h,v=l*u,M=i.x,A=i.y,T=i.z;return r[0]=(1-(m+g))*M,r[1]=(f+v)*M,r[2]=(p-y)*M,r[3]=0,r[4]=(f-v)*A,r[5]=(1-(d+g))*A,r[6]=(_+x)*A,r[7]=0,r[8]=(p+y)*T,r[9]=(_-x)*T,r[10]=(1-(d+m))*T,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let n=this.determinantAffine();if(n===0)return i.set(1,1,1),t.identity(),this;let s=as.set(r[0],r[1],r[2]).length(),a=as.set(r[4],r[5],r[6]).length(),l=as.set(r[8],r[9],r[10]).length();n<0&&(s=-s),li.copy(this);let c=1/s,h=1/a,u=1/l;return li.elements[0]*=c,li.elements[1]*=c,li.elements[2]*=c,li.elements[4]*=h,li.elements[5]*=h,li.elements[6]*=h,li.elements[8]*=u,li.elements[9]*=u,li.elements[10]*=u,t.setFromRotationMatrix(li),i.x=s,i.y=a,i.z=l,this}makePerspective(e,t,i,r,n,s,a=tt,l=!1){let c=this.elements,h=2*n/(t-e),u=2*n/(i-r),d=(t+e)/(t-e),f=(i+r)/(i-r),p,m;if(l)p=n/(s-n),m=s*n/(s-n);else if(a===tt)p=-(s+n)/(s-n),m=-2*s*n/(s-n);else if(a===Jt)p=-s/(s-n),m=-s*n/(s-n);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=h,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,i,r,n,s,a=tt,l=!1){let c=this.elements,h=2/(t-e),u=2/(i-r),d=-(t+e)/(t-e),f=-(i+r)/(i-r),p,m;if(l)p=1/(s-n),m=s/(s-n);else if(a===tt)p=-2/(s-n),m=-(s+n)/(s-n);else if(a===Jt)p=-1/(s-n),m=-n/(s-n);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=h,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}};$a.prototype.isMatrix4=!0;var z=$a,as=new w,li=new z,py=new w(0,0,0),my=new w(1,1,1),or=new w,ja=new w,zt=new w;var bf=new z,Mf=new ge,$e=class o{constructor(e=0,t=0,i=0,r=o.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let r=e.elements,n=r[0],s=r[4],a=r[8],l=r[1],c=r[5],h=r[9],u=r[2],d=r[6],f=r[10];switch(t){case"XYZ":this._y=Math.asin(W(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-s,n)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-W(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,n),this._z=0);break;case"ZXY":this._x=Math.asin(W(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-s,c)):(this._y=0,this._z=Math.atan2(l,n));break;case"ZYX":this._y=Math.asin(-W(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(l,n)):(this._x=0,this._z=Math.atan2(-s,c));break;case"YZX":this._z=Math.asin(W(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,n)):(this._x=0,this._y=Math.atan2(a,f));break;case"XZY":this._z=Math.asin(-W(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(a,n)):(this._x=Math.atan2(-h,f),this._y=0);break;default:O("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return bf.makeRotationFromQuaternion(e),this.setFromRotationMatrix(bf,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Mf.setFromEuler(this),this.setFromQuaternion(Mf,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};$e.DEFAULT_ORDER="XYZ";var ar=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}};var gy=0,Sf=new w,ls=new ge,Gi=new z,Qa=new w,Ko=new w,_y=new w,xy=new ge,Af=new w(1,0,0),Tf=new w(0,1,0),Cf=new w(0,0,1),Ef={type:"added"},yy={type:"removed"},cs={type:"childadded",child:null},ru={type:"childremoved",child:null},q=class o extends Fe{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:gy++}),this.uuid=Pe(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=o.DEFAULT_UP.clone();let e=new w,t=new $e,i=new ge,r=new w(1,1,1);function n(){i.setFromEuler(t,!1)}function s(){t.setFromQuaternion(i,void 0,!1)}t._onChange(n),i._onChange(s),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new z},normalMatrix:{value:new Z}}),this.matrix=new z,this.matrixWorld=new z,this.matrixAutoUpdate=o.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=o.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new ar,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return ls.setFromAxisAngle(e,t),this.quaternion.multiply(ls),this}rotateOnWorldAxis(e,t){return ls.setFromAxisAngle(e,t),this.quaternion.premultiply(ls),this}rotateX(e){return this.rotateOnAxis(Af,e)}rotateY(e){return this.rotateOnAxis(Tf,e)}rotateZ(e){return this.rotateOnAxis(Cf,e)}translateOnAxis(e,t){return Sf.copy(e).applyQuaternion(this.quaternion),this.position.add(Sf.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Af,e)}translateY(e){return this.translateOnAxis(Tf,e)}translateZ(e){return this.translateOnAxis(Cf,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Gi.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Qa.copy(e):Qa.set(e,t,i);let r=this.parent;this.updateWorldMatrix(!0,!1),Ko.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Gi.lookAt(Ko,Qa,this.up):Gi.lookAt(Qa,Ko,this.up),this.quaternion.setFromRotationMatrix(Gi),r&&(Gi.extractRotation(r.matrixWorld),ls.setFromRotationMatrix(Gi),this.quaternion.premultiply(ls.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(K("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Ef),cs.child=e,this.dispatchEvent(cs),cs.child=null):K("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(yy),ru.child=e,this.dispatchEvent(ru),ru.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Gi.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Gi.multiply(e.parent.matrixWorld)),e.applyMatrix4(Gi),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Ef),cs.child=e,this.dispatchEvent(cs),cs.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){let s=this.children[i].getObjectByProperty(e,t);if(s!==void 0)return s}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let r=this.children;for(let n=0,s=r.length;n<s;n++)r[n].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ko,e,_y),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ko,xy,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,i=e.y,r=e.z,n=this.matrix.elements;n[12]+=t-n[0]*t-n[4]*i-n[8]*r,n[13]+=i-n[1]*t-n[5]*i-n[9]*r,n[14]+=r-n[2]*t-n[6]*i-n[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t,i=!1){let r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),t===!0){let n=this.children;for(let s=0,a=n.length;s<a;s++)n[s].updateWorldMatrix(!1,!0,i)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(a=>({...a})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function n(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=n(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let l=a.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let u=l[c];n(e.shapes,u)}else n(e.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(n(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(n(e.materials,this.material[l]));r.material=a}else r.material=n(e.materials,this.material);if(this.children.length>0){r.children=[];for(let a=0;a<this.children.length;a++)r.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let a=0;a<this.animations.length;a++){let l=this.animations[a];r.animations.push(n(e.animations,l))}}if(t){let a=s(e.geometries),l=s(e.materials),c=s(e.textures),h=s(e.images),u=s(e.shapes),d=s(e.skeletons),f=s(e.animations),p=s(e.nodes);a.length>0&&(i.geometries=a),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),h.length>0&&(i.images=h),u.length>0&&(i.shapes=u),d.length>0&&(i.skeletons=d),f.length>0&&(i.animations=f),p.length>0&&(i.nodes=p)}return i.object=r,i;function s(a){let l=[];for(let c in a){let h=a[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let r=e.children[i];this.add(r.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};q.DEFAULT_UP=new w(0,1,0);q.DEFAULT_MATRIX_AUTO_UPDATE=!0;q.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var vt=class extends q{constructor(){super(),this.isGroup=!0,this.type="Group"}};var vy={type:"move"},el=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new vt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new vt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new w,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new w),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new vt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new w,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new w,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,n=null,s=null,a=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){s=!0;for(let m of e.hand.values()){let _=t.getJointPose(m,i),g=this._getHandJoint(c,m);_!==null&&(g.matrix.fromArray(_.transform.matrix),g.matrix.decompose(g.position,g.rotation,g.scale),g.matrixWorldNeedsUpdate=!0,g.jointRadius=_.radius),g.visible=_!==null}let h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],d=h.position.distanceTo(u.position),f=.02,p=.005;c.inputState.pinching&&d>f+p?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&d<=f-p&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(n=t.getPose(e.gripSpace,i),n!==null&&(l.matrix.fromArray(n.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,n.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(n.linearVelocity)):l.hasLinearVelocity=!1,n.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(n.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));a!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&n!==null&&(r=n),r!==null&&(a.matrix.fromArray(r.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,r.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(r.linearVelocity)):a.hasLinearVelocity=!1,r.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(r.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(vy)))}return a!==null&&(a.visible=r!==null),l!==null&&(l.visible=n!==null),c!==null&&(c.visible=s!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new vt;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}};var If={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},lr={h:0,s:0,l:0},tl={h:0,s:0,l:0};function nu(o,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?o+(e-o)*6*t:t<1/2?e:t<2/3?o+(e-o)*6*(2/3-t):o}var L=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=ve){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,ze.colorSpaceToWorking(this,t),this}setRGB(e,t,i,r=ze.workingColorSpace){return this.r=e,this.g=t,this.b=i,ze.colorSpaceToWorking(this,r),this}setHSL(e,t,i,r=ze.workingColorSpace){if(e=Xa(e,1),t=W(t,0,1),i=W(i,0,1),t===0)this.r=this.g=this.b=i;else{let n=i<=.5?i*(1+t):i+t-i*t,s=2*i-n;this.r=nu(s,n,e+1/3),this.g=nu(s,n,e),this.b=nu(s,n,e-1/3)}return ze.colorSpaceToWorking(this,r),this}setStyle(e,t=ve){function i(n){n!==void 0&&parseFloat(n)<1&&O("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let n,s=r[1],a=r[2];switch(s){case"rgb":case"rgba":if(n=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(n[4]),this.setRGB(Math.min(255,parseInt(n[1],10))/255,Math.min(255,parseInt(n[2],10))/255,Math.min(255,parseInt(n[3],10))/255,t);if(n=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(n[4]),this.setRGB(Math.min(100,parseInt(n[1],10))/100,Math.min(100,parseInt(n[2],10))/100,Math.min(100,parseInt(n[3],10))/100,t);break;case"hsl":case"hsla":if(n=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(n[4]),this.setHSL(parseFloat(n[1])/360,parseFloat(n[2])/100,parseFloat(n[3])/100,t);break;default:O("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let n=r[1],s=n.length;if(s===3)return this.setRGB(parseInt(n.charAt(0),16)/15,parseInt(n.charAt(1),16)/15,parseInt(n.charAt(2),16)/15,t);if(s===6)return this.setHex(parseInt(n,16),t);O("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=ve){let i=If[e.toLowerCase()];return i!==void 0?this.setHex(i,t):O("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=ai(e.r),this.g=ai(e.g),this.b=ai(e.b),this}copyLinearToSRGB(e){return this.r=Hr(e.r),this.g=Hr(e.g),this.b=Hr(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=ve){return ze.workingToColorSpace(dt.copy(this),e),Math.round(W(dt.r*255,0,255))*65536+Math.round(W(dt.g*255,0,255))*256+Math.round(W(dt.b*255,0,255))}getHexString(e=ve){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=ze.workingColorSpace){ze.workingToColorSpace(dt.copy(this),t);let i=dt.r,r=dt.g,n=dt.b,s=Math.max(i,r,n),a=Math.min(i,r,n),l,c,h=(a+s)/2;if(a===s)l=0,c=0;else{let u=s-a;switch(c=h<=.5?u/(s+a):u/(2-s-a),s){case i:l=(r-n)/u+(r<n?6:0);break;case r:l=(n-i)/u+2;break;case n:l=(i-r)/u+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=ze.workingColorSpace){return ze.workingToColorSpace(dt.copy(this),t),e.r=dt.r,e.g=dt.g,e.b=dt.b,e}getStyle(e=ve){ze.workingToColorSpace(dt.copy(this),e);let t=dt.r,i=dt.g,r=dt.b;return e!==ve?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,t,i){return this.getHSL(lr),this.setHSL(lr.h+e,lr.s+t,lr.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(lr),e.getHSL(tl);let i=rs(lr.h,tl.h,t),r=rs(lr.s,tl.s,t),n=rs(lr.l,tl.l,t);return this.setHSL(i,r,n),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,r=this.b,n=e.elements;return this.r=n[0]*t+n[3]*i+n[6]*r,this.g=n[1]*t+n[4]*i+n[7]*r,this.b=n[2]*t+n[5]*i+n[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},dt=new L;L.NAMES=If;var hs=class o{constructor(e,t=25e-5){this.isFogExp2=!0,this.name="",this.color=new L(e),this.density=t}clone(){return new o(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}};var us=class o{constructor(e,t=1,i=1e3){this.isFog=!0,this.name="",this.color=new L(e),this.near=t,this.far=i}clone(){return new o(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}};var ds=class extends q{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new $e,this.environmentIntensity=1,this.environmentRotation=new $e,this.overrideMaterial=null}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}};var ci=new w,Hi=new w,su=new w,Wi=new w,fs=new w,ps=new w,Rf=new w,ou=new w,au=new w,lu=new w,cu=new Te,hu=new Te,uu=new Te,Ct=class o{constructor(e=new w,t=new w,i=new w){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),ci.subVectors(e,t),r.cross(ci);let n=r.lengthSq();return n>0?r.multiplyScalar(1/Math.sqrt(n)):r.set(0,0,0)}static getBarycoord(e,t,i,r,n){ci.subVectors(r,t),Hi.subVectors(i,t),su.subVectors(e,t);let s=ci.dot(ci),a=ci.dot(Hi),l=ci.dot(su),c=Hi.dot(Hi),h=Hi.dot(su),u=s*c-a*a;if(u===0)return n.set(0,0,0),null;let d=1/u,f=(c*l-a*h)*d,p=(s*h-a*l)*d;return n.set(1-f-p,p,f)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,Wi)===null?!1:Wi.x>=0&&Wi.y>=0&&Wi.x+Wi.y<=1}static getInterpolation(e,t,i,r,n,s,a,l){return this.getBarycoord(e,t,i,r,Wi)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(n,Wi.x),l.addScaledVector(s,Wi.y),l.addScaledVector(a,Wi.z),l)}static getInterpolatedAttribute(e,t,i,r,n,s){return cu.setScalar(0),hu.setScalar(0),uu.setScalar(0),cu.fromBufferAttribute(e,t),hu.fromBufferAttribute(e,i),uu.fromBufferAttribute(e,r),s.setScalar(0),s.addScaledVector(cu,n.x),s.addScaledVector(hu,n.y),s.addScaledVector(uu,n.z),s}static isFrontFacing(e,t,i,r){return ci.subVectors(i,t),Hi.subVectors(e,t),ci.cross(Hi).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return ci.subVectors(this.c,this.b),Hi.subVectors(this.a,this.b),ci.cross(Hi).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return o.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return o.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,r,n){return o.getInterpolation(e,this.a,this.b,this.c,t,i,r,n)}containsPoint(e){return o.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return o.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,r=this.b,n=this.c,s,a;fs.subVectors(r,i),ps.subVectors(n,i),ou.subVectors(e,i);let l=fs.dot(ou),c=ps.dot(ou);if(l<=0&&c<=0)return t.copy(i);au.subVectors(e,r);let h=fs.dot(au),u=ps.dot(au);if(h>=0&&u<=h)return t.copy(r);let d=l*u-h*c;if(d<=0&&l>=0&&h<=0)return s=l/(l-h),t.copy(i).addScaledVector(fs,s);lu.subVectors(e,n);let f=fs.dot(lu),p=ps.dot(lu);if(p>=0&&f<=p)return t.copy(n);let m=f*c-l*p;if(m<=0&&c>=0&&p<=0)return a=c/(c-p),t.copy(i).addScaledVector(ps,a);let _=h*p-f*u;if(_<=0&&u-h>=0&&f-p>=0)return Rf.subVectors(n,r),a=(u-h)/(u-h+(f-p)),t.copy(r).addScaledVector(Rf,a);let g=1/(_+m+d);return s=m*g,a=d*g,t.copy(i).addScaledVector(fs,s).addScaledVector(ps,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}};var ye=class{constructor(e=new w(1/0,1/0,1/0),t=new w(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(hi.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(hi.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=hi.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let n=i.getAttribute("position");if(t===!0&&n!==void 0&&e.isInstancedMesh!==!0)for(let s=0,a=n.count;s<a;s++)e.isMesh===!0?e.getVertexPosition(s,hi):hi.fromBufferAttribute(n,s),hi.applyMatrix4(e.matrixWorld),this.expandByPoint(hi);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),il.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),il.copy(i.boundingBox)),il.applyMatrix4(e.matrixWorld),this.union(il)}let r=e.children;for(let n=0,s=r.length;n<s;n++)this.expandByObject(r[n],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,hi),hi.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(jo),rl.subVectors(this.max,jo),ms.subVectors(e.a,jo),gs.subVectors(e.b,jo),_s.subVectors(e.c,jo),cr.subVectors(gs,ms),hr.subVectors(_s,gs),Wr.subVectors(ms,_s);let t=[0,-cr.z,cr.y,0,-hr.z,hr.y,0,-Wr.z,Wr.y,cr.z,0,-cr.x,hr.z,0,-hr.x,Wr.z,0,-Wr.x,-cr.y,cr.x,0,-hr.y,hr.x,0,-Wr.y,Wr.x,0];return!du(t,ms,gs,_s,rl)||(t=[1,0,0,0,1,0,0,0,1],!du(t,ms,gs,_s,rl))?!1:(nl.crossVectors(cr,hr),t=[nl.x,nl.y,nl.z],du(t,ms,gs,_s,rl))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,hi).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(hi).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(qi[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),qi[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),qi[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),qi[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),qi[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),qi[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),qi[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),qi[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(qi),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},qi=[new w,new w,new w,new w,new w,new w,new w,new w],hi=new w,il=new ye,ms=new w,gs=new w,_s=new w,cr=new w,hr=new w,Wr=new w,jo=new w,rl=new w,nl=new w,qr=new w;function du(o,e,t,i,r){for(let n=0,s=o.length-3;n<=s;n+=3){qr.fromArray(o,n);let a=r.x*Math.abs(qr.x)+r.y*Math.abs(qr.y)+r.z*Math.abs(qr.z),l=e.dot(qr),c=t.dot(qr),h=i.dot(qr);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>a)return!1}return!0}var Xi=wy();function wy(){let o=new ArrayBuffer(4),e=new Float32Array(o),t=new Uint32Array(o),i=new Uint32Array(512),r=new Uint32Array(512);for(let l=0;l<256;++l){let c=l-127;c<-27?(i[l]=0,i[l|256]=32768,r[l]=24,r[l|256]=24):c<-14?(i[l]=1024>>-c-14,i[l|256]=1024>>-c-14|32768,r[l]=-c-1,r[l|256]=-c-1):c<=15?(i[l]=c+15<<10,i[l|256]=c+15<<10|32768,r[l]=13,r[l|256]=13):c<128?(i[l]=31744,i[l|256]=64512,r[l]=24,r[l|256]=24):(i[l]=31744,i[l|256]=64512,r[l]=13,r[l|256]=13)}let n=new Uint32Array(2048),s=new Uint32Array(64),a=new Uint32Array(64);for(let l=1;l<1024;++l){let c=l<<13,h=0;for(;(c&8388608)===0;)c<<=1,h-=8388608;c&=-8388609,h+=947912704,n[l]=c|h}for(let l=1024;l<2048;++l)n[l]=939524096+(l-1024<<13);for(let l=1;l<31;++l)s[l]=l<<23;s[31]=1199570944,s[32]=2147483648;for(let l=33;l<63;++l)s[l]=2147483648+(l-32<<23);s[63]=3347054592;for(let l=1;l<64;++l)l!==32&&(a[l]=1024);return{floatView:e,uint32View:t,baseTable:i,shiftTable:r,mantissaTable:n,exponentTable:s,offsetTable:a}}function wt(o){Math.abs(o)>65504&&O("DataUtils.toHalfFloat(): Value out of range."),o=W(o,-65504,65504),Xi.floatView[0]=o;let e=Xi.uint32View[0],t=e>>23&511;return Xi.baseTable[t]+((e&8388607)>>Xi.shiftTable[t])}function xs(o){let e=o>>10;return Xi.uint32View[0]=Xi.mantissaTable[Xi.offsetTable[e]+(o&1023)]+Xi.exponentTable[e],Xi.floatView[0]}var sl=class{static toHalfFloat(e){return wt(e)}static fromHalfFloat(e){return xs(e)}};var We=new w,ol=new E,by=0,$=class extends Fe{constructor(e,t,i=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:by++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=Vr,this.updateRanges=[],this.gpuType=Tt,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,n=this.itemSize;r<n;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)ol.fromBufferAttribute(this,t),ol.applyMatrix3(e),this.setXY(t,ol.x,ol.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)We.fromBufferAttribute(this,t),We.applyMatrix3(e),this.setXYZ(t,We.x,We.y,We.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)We.fromBufferAttribute(this,t),We.applyMatrix4(e),this.setXYZ(t,We.x,We.y,We.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)We.fromBufferAttribute(this,t),We.applyNormalMatrix(e),this.setXYZ(t,We.x,We.y,We.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)We.fromBufferAttribute(this,t),We.transformDirection(e),this.setXYZ(t,We.x,We.y,We.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=it(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=j(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=it(t,this.array)),t}setX(e,t){return this.normalized&&(t=j(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=it(t,this.array)),t}setY(e,t){return this.normalized&&(t=j(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=it(t,this.array)),t}setZ(e,t){return this.normalized&&(t=j(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=it(t,this.array)),t}setW(e,t){return this.normalized&&(t=j(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=j(t,this.array),i=j(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=j(t,this.array),i=j(i,this.array),r=j(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,n){return e*=this.itemSize,this.normalized&&(t=j(t,this.array),i=j(i,this.array),r=j(r,this.array),n=j(n,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=n,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}},fu=class extends ${constructor(e,t,i){super(new Int8Array(e),t,i)}},pu=class extends ${constructor(e,t,i){super(new Uint8Array(e),t,i)}},mu=class extends ${constructor(e,t,i){super(new Uint8ClampedArray(e),t,i)}},gu=class extends ${constructor(e,t,i){super(new Int16Array(e),t,i)}},$o=class extends ${constructor(e,t,i){super(new Uint16Array(e),t,i)}},_u=class extends ${constructor(e,t,i){super(new Int32Array(e),t,i)}},Qo=class extends ${constructor(e,t,i){super(new Uint32Array(e),t,i)}},xu=class extends ${constructor(e,t,i){super(new Uint16Array(e),t,i),this.isFloat16BufferAttribute=!0}getX(e){let t=xs(this.array[e*this.itemSize]);return this.normalized&&(t=it(t,this.array)),t}setX(e,t){return this.normalized&&(t=j(t,this.array)),this.array[e*this.itemSize]=wt(t),this}getY(e){let t=xs(this.array[e*this.itemSize+1]);return this.normalized&&(t=it(t,this.array)),t}setY(e,t){return this.normalized&&(t=j(t,this.array)),this.array[e*this.itemSize+1]=wt(t),this}getZ(e){let t=xs(this.array[e*this.itemSize+2]);return this.normalized&&(t=it(t,this.array)),t}setZ(e,t){return this.normalized&&(t=j(t,this.array)),this.array[e*this.itemSize+2]=wt(t),this}getW(e){let t=xs(this.array[e*this.itemSize+3]);return this.normalized&&(t=it(t,this.array)),t}setW(e,t){return this.normalized&&(t=j(t,this.array)),this.array[e*this.itemSize+3]=wt(t),this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=j(t,this.array),i=j(i,this.array)),this.array[e+0]=wt(t),this.array[e+1]=wt(i),this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=j(t,this.array),i=j(i,this.array),r=j(r,this.array)),this.array[e+0]=wt(t),this.array[e+1]=wt(i),this.array[e+2]=wt(r),this}setXYZW(e,t,i,r,n){return e*=this.itemSize,this.normalized&&(t=j(t,this.array),i=j(i,this.array),r=j(r,this.array),n=j(n,this.array)),this.array[e+0]=wt(t),this.array[e+1]=wt(i),this.array[e+2]=wt(r),this.array[e+3]=wt(n),this}},R=class extends ${constructor(e,t,i){super(new Float32Array(e),t,i)}};var My=new ye,ea=new w,yu=new w,pe=class{constructor(e=new w,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):My.setFromPoints(e).getCenter(i);let r=0;for(let n=0,s=e.length;n<s;n++)r=Math.max(r,i.distanceToSquared(e[n]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;ea.subVectors(e,this.center);let t=ea.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),r=(i-this.radius)*.5;this.center.addScaledVector(ea,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(yu.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(ea.copy(e.center).add(yu)),this.expandByPoint(ea.copy(e.center).sub(yu))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}};var Sy=0,jt=new z,vu=new q,ys=new w,kt=new ye,ta=new ye,Qe=new w,D=class o extends Fe{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Sy++}),this.uuid=Pe(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(ff(e)?Qo:$o)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let n=new Z().getNormalMatrix(e);i.applyNormalMatrix(n),i.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return jt.makeRotationFromQuaternion(e),this.applyMatrix4(jt),this}rotateX(e){return jt.makeRotationX(e),this.applyMatrix4(jt),this}rotateY(e){return jt.makeRotationY(e),this.applyMatrix4(jt),this}rotateZ(e){return jt.makeRotationZ(e),this.applyMatrix4(jt),this}translate(e,t,i){return jt.makeTranslation(e,t,i),this.applyMatrix4(jt),this}scale(e,t,i){return jt.makeScale(e,t,i),this.applyMatrix4(jt),this}lookAt(e){return vu.lookAt(e),vu.updateMatrix(),this.applyMatrix4(vu.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ys).negate(),this.translate(ys.x,ys.y,ys.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let i=[];for(let r=0,n=e.length;r<n;r++){let s=e[r];i.push(s.x,s.y,s.z||0)}this.setAttribute("position",new R(i,3))}else{let i=Math.min(e.length,t.count);for(let r=0;r<i;r++){let n=e[r];t.setXYZ(r,n.x,n.y,n.z||0)}e.length>t.count&&O("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ye);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){K("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new w(-1/0,-1/0,-1/0),new w(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){let n=t[i];kt.setFromBufferAttribute(n),this.morphTargetsRelative?(Qe.addVectors(this.boundingBox.min,kt.min),this.boundingBox.expandByPoint(Qe),Qe.addVectors(this.boundingBox.max,kt.max),this.boundingBox.expandByPoint(Qe)):(this.boundingBox.expandByPoint(kt.min),this.boundingBox.expandByPoint(kt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&K('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new pe);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){K("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new w,1/0);return}if(e){let i=this.boundingSphere.center;if(kt.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){let a=t[n];ta.setFromBufferAttribute(a),this.morphTargetsRelative?(Qe.addVectors(kt.min,ta.min),kt.expandByPoint(Qe),Qe.addVectors(kt.max,ta.max),kt.expandByPoint(Qe)):(kt.expandByPoint(ta.min),kt.expandByPoint(ta.max))}kt.getCenter(i);let r=0;for(let n=0,s=e.count;n<s;n++)Qe.fromBufferAttribute(e,n),r=Math.max(r,i.distanceToSquared(Qe));if(t)for(let n=0,s=t.length;n<s;n++){let a=t[n],l=this.morphTargetsRelative;for(let c=0,h=a.count;c<h;c++)Qe.fromBufferAttribute(a,c),l&&(ys.fromBufferAttribute(e,c),Qe.add(ys)),r=Math.max(r,i.distanceToSquared(Qe))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&K('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){K("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.position,r=t.normal,n=t.uv,s=this.getAttribute("tangent");(s===void 0||s.count!==i.count)&&(s=new $(new Float32Array(4*i.count),4),this.setAttribute("tangent",s));let a=[],l=[];for(let S=0;S<i.count;S++)a[S]=new w,l[S]=new w;let c=new w,h=new w,u=new w,d=new E,f=new E,p=new E,m=new w,_=new w;function g(S,b,C){c.fromBufferAttribute(i,S),h.fromBufferAttribute(i,b),u.fromBufferAttribute(i,C),d.fromBufferAttribute(n,S),f.fromBufferAttribute(n,b),p.fromBufferAttribute(n,C),h.sub(c),u.sub(c),f.sub(d),p.sub(d);let I=1/(f.x*p.y-p.x*f.y);isFinite(I)&&(m.copy(h).multiplyScalar(p.y).addScaledVector(u,-f.y).multiplyScalar(I),_.copy(u).multiplyScalar(f.x).addScaledVector(h,-p.x).multiplyScalar(I),a[S].add(m),a[b].add(m),a[C].add(m),l[S].add(_),l[b].add(_),l[C].add(_))}let x=this.groups;x.length===0&&(x=[{start:0,count:e.count}]);for(let S=0,b=x.length;S<b;++S){let C=x[S],I=C.start,B=C.count;for(let N=I,k=I+B;N<k;N+=3)g(e.getX(N+0),e.getX(N+1),e.getX(N+2))}let y=new w,v=new w,M=new w,A=new w;function T(S){M.fromBufferAttribute(r,S),A.copy(M);let b=a[S];y.copy(b),y.sub(M.multiplyScalar(M.dot(b))).normalize(),v.crossVectors(A,b);let I=v.dot(l[S])<0?-1:1;s.setXYZW(S,y.x,y.y,y.z,I)}for(let S=0,b=x.length;S<b;++S){let C=x[S],I=C.start,B=C.count;for(let N=I,k=I+B;N<k;N+=3)T(e.getX(N+0)),T(e.getX(N+1)),T(e.getX(N+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==t.count)i=new $(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let d=0,f=i.count;d<f;d++)i.setXYZ(d,0,0,0);let r=new w,n=new w,s=new w,a=new w,l=new w,c=new w,h=new w,u=new w;if(e)for(let d=0,f=e.count;d<f;d+=3){let p=e.getX(d+0),m=e.getX(d+1),_=e.getX(d+2);r.fromBufferAttribute(t,p),n.fromBufferAttribute(t,m),s.fromBufferAttribute(t,_),h.subVectors(s,n),u.subVectors(r,n),h.cross(u),a.fromBufferAttribute(i,p),l.fromBufferAttribute(i,m),c.fromBufferAttribute(i,_),a.add(h),l.add(h),c.add(h),i.setXYZ(p,a.x,a.y,a.z),i.setXYZ(m,l.x,l.y,l.z),i.setXYZ(_,c.x,c.y,c.z)}else for(let d=0,f=t.count;d<f;d+=3)r.fromBufferAttribute(t,d+0),n.fromBufferAttribute(t,d+1),s.fromBufferAttribute(t,d+2),h.subVectors(s,n),u.subVectors(r,n),h.cross(u),i.setXYZ(d+0,h.x,h.y,h.z),i.setXYZ(d+1,h.x,h.y,h.z),i.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Qe.fromBufferAttribute(e,t),Qe.normalize(),e.setXYZ(t,Qe.x,Qe.y,Qe.z)}toNonIndexed(){function e(a,l){let c=a.array,h=a.itemSize,u=a.normalized,d=new c.constructor(l.length*h),f=0,p=0;for(let m=0,_=l.length;m<_;m++){a.isInterleavedBufferAttribute?f=l[m]*a.data.stride+a.offset:f=l[m]*h;for(let g=0;g<h;g++)d[p++]=c[f++]}return new $(d,h,u)}if(this.index===null)return O("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new o,i=this.index.array,r=this.attributes;for(let a in r){let l=r[a],c=e(l,i);t.setAttribute(a,c)}let n=this.morphAttributes;for(let a in n){let l=[],c=n[a];for(let h=0,u=c.length;h<u;h++){let d=c[h],f=e(d,i);l.push(f)}t.morphAttributes[a]=l}t.morphTargetsRelative=this.morphTargetsRelative;let s=this.groups;for(let a=0,l=s.length;a<l;a++){let c=s[a];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let l in i){let c=i[l];e.data.attributes[l]=c.toJSON(e.data)}let r={},n=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let u=0,d=c.length;u<d;u++){let f=c[u];h.push(f.toJSON(e.data))}h.length>0&&(r[l]=h,n=!0)}n&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let s=this.groups;s.length>0&&(e.data.groups=JSON.parse(JSON.stringify(s)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere=a.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone());let r=e.attributes;for(let c in r){let h=r[c];this.setAttribute(c,h.clone(t))}let n=e.morphAttributes;for(let c in n){let h=[],u=n[c];for(let d=0,f=u.length;d<f;d++)h.push(u[d].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let s=e.groups;for(let c=0,h=s.length;c<h;c++){let u=s[c];this.addGroup(u.start,u.count,u.materialIndex)}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var Vt=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=Vr,this.updateRanges=[],this.version=0,this.uuid=Pe()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,i){e*=this.stride,i*=t.stride;for(let r=0,n=this.stride;r<n;r++)this.array[e+r]=t.array[i+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Pe()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),i=new this.constructor(t,this.stride);return i.setUsage(this.usage),i}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Pe()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer)));let t={uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride};return t.usage=this.usage,t}};var bt=new w,Gt=class o{constructor(e,t,i,r=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=i,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,i=this.data.count;t<i;t++)bt.fromBufferAttribute(this,t),bt.applyMatrix4(e),this.setXYZ(t,bt.x,bt.y,bt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)bt.fromBufferAttribute(this,t),bt.applyNormalMatrix(e),this.setXYZ(t,bt.x,bt.y,bt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)bt.fromBufferAttribute(this,t),bt.transformDirection(e),this.setXYZ(t,bt.x,bt.y,bt.z);return this}getComponent(e,t){let i=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(i=it(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=j(i,this.array)),this.data.array[e*this.data.stride+this.offset+t]=i,this}setX(e,t){return this.normalized&&(t=j(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=j(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=j(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=j(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=it(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=it(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=it(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=it(t,this.array)),t}setXY(e,t,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=j(t,this.array),i=j(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this}setXYZ(e,t,i,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=j(t,this.array),i=j(i,this.array),r=j(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=r,this}setXYZW(e,t,i,r,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=j(t,this.array),i=j(i,this.array),r=j(r,this.array),n=j(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=r,this.data.array[e+3]=n,this}clone(e){if(e===void 0){Jo("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let r=i*this.data.stride+this.offset;for(let n=0;n<this.itemSize;n++)t.push(this.data.array[r+n])}return new $(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new o(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){Jo("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let r=i*this.data.stride+this.offset;for(let n=0;n<this.itemSize;n++)t.push(this.data.array[r+n])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}};var wu=new w,Ay=new w,Ty=new Z,Ht=class{constructor(e=new w(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let r=wu.subVectors(i,t).cross(Ay.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,i=!0){let r=e.delta(wu),n=this.normal.dot(r);if(n===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let s=-(e.start.dot(this.normal)+this.constant)/n;return i===!0&&(s<0||s>1)?null:t.copy(e.start).addScaledVector(r,s)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||Ty.getNormalMatrix(e),r=this.coplanarPoint(wu).applyMatrix4(e),n=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(n),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}};var Cy=0,te=class extends Fe{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Cy++}),this.uuid=Pe(),this.name="",this.type="Material",this.blending=Ch,this.side=Oi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Rh,this.blendDst=Ph,this.blendEquation=Ih,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new L(0,0,0),this.blendAlpha=0,this.depthFunc=wn,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Yh,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Zo,this.stencilZFail=Zo,this.stencilZPass=Zo,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){O(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){O(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector2&&i&&i.isVector2||r&&r.isEuler&&i&&i.isEuler||r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,i.blending=this.blending,i.side=this.side,i.shadowSide=this.shadowSide,i.vertexColors=this.vertexColors,i.opacity=this.opacity,i.transparent=this.transparent,i.blendSrc=this.blendSrc,i.blendDst=this.blendDst,i.blendEquation=this.blendEquation,i.blendSrcAlpha=this.blendSrcAlpha,i.blendDstAlpha=this.blendDstAlpha,i.blendEquationAlpha=this.blendEquationAlpha,i.blendColor=this.blendColor.getHex(),i.blendAlpha=this.blendAlpha,i.depthFunc=this.depthFunc,i.depthTest=this.depthTest,i.depthWrite=this.depthWrite,i.colorWrite=this.colorWrite,i.clipIntersection=this.clipIntersection,i.clipShadows=this.clipShadows,i.stencilWriteMask=this.stencilWriteMask,i.stencilFunc=this.stencilFunc,i.stencilRef=this.stencilRef,i.stencilFuncMask=this.stencilFuncMask,i.stencilFail=this.stencilFail,i.stencilZFail=this.stencilZFail,i.stencilZPass=this.stencilZPass,i.stencilWrite=this.stencilWrite,i.polygonOffset=this.polygonOffset,i.polygonOffsetFactor=this.polygonOffsetFactor,i.polygonOffsetUnits=this.polygonOffsetUnits,i.dithering=this.dithering,i.alphaTest=this.alphaTest,i.alphaHash=this.alphaHash,i.alphaToCoverage=this.alphaToCoverage,i.premultipliedAlpha=this.premultipliedAlpha,i.forceSinglePass=this.forceSinglePass,i.allowOverride=this.allowOverride,i.visible=this.visible,i.toneMapped=this.toneMapped,i.name=this.name,this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(i.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(i.clippingPlanes=this.clippingPlanes.map(n=>n.toJSON())),this.rotation!==void 0&&(i.rotation=this.rotation),this.depthPacking!==void 0&&(i.depthPacking=this.depthPacking),this.linewidth!==void 0&&(i.linewidth=this.linewidth),this.linecap!==void 0&&(i.linecap=this.linecap),this.linejoin!==void 0&&(i.linejoin=this.linejoin),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.wireframe!==void 0&&(i.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(i.flatShading=this.flatShading),this.fog!==void 0&&(i.fog=this.fog),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(n){let s=[];for(let a in n){let l=n[a];delete l.metadata,s.push(l)}return s}if(t){let n=r(e.textures),s=r(e.images);n.length>0&&(i.textures=n),s.length>0&&(i.images=s)}return i}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new L().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(i=>new Ht().fromJSON(i))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let i=e.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new E().fromArray(i)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new E().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let r=t.length;i=new Array(r);for(let n=0;n!==r;++n)i[n]=t[n].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}};var ur=class extends te{constructor(e){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new L(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}};var vs,ia=new w,ws=new w,bs=new w,Ms=new E,ra=new E,Nf=new z,al=new w,na=new w,ll=new w,Pf=new E,bu=new E,Lf=new E,Ss=class extends q{constructor(e=new ur){if(super(),this.isSprite=!0,this.type="Sprite",vs===void 0){vs=new D;let t=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),i=new Vt(t,5);vs.setIndex([0,1,2,0,2,3]),vs.setAttribute("position",new Gt(i,3,0,!1)),vs.setAttribute("uv",new Gt(i,2,3,!1))}this.geometry=vs,this.material=e,this.center=new E(.5,.5),this.count=1}intersectsFrustum(e){return e.intersectsSprite(this)}raycast(e,t){e.camera===null&&K('Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),ws.setFromMatrixScale(this.matrixWorld),Nf.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),bs.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&ws.multiplyScalar(-bs.z);let i=this.material.rotation,r,n;i!==0&&(n=Math.cos(i),r=Math.sin(i));let s=this.center;cl(al.set(-.5,-.5,0),bs,s,ws,r,n),cl(na.set(.5,-.5,0),bs,s,ws,r,n),cl(ll.set(.5,.5,0),bs,s,ws,r,n),Pf.set(0,0),bu.set(1,0),Lf.set(1,1);let a=e.ray.intersectTriangle(al,na,ll,!1,ia);if(a===null&&(cl(na.set(-.5,.5,0),bs,s,ws,r,n),bu.set(0,1),a=e.ray.intersectTriangle(al,ll,na,!1,ia),a===null))return;let l=e.ray.origin.distanceTo(ia);l<e.near||l>e.far||t.push({distance:l,point:ia.clone(),uv:Ct.getInterpolation(ia,al,na,ll,Pf,bu,Lf,new E),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}};function cl(o,e,t,i,r,n){Ms.subVectors(o,t).addScalar(.5).multiply(i),r!==void 0?(ra.x=n*Ms.x-r*Ms.y,ra.y=r*Ms.x+n*Ms.y):ra.copy(Ms),o.copy(e),o.x+=ra.x,o.y+=ra.y,o.applyMatrix4(Nf)}var hl=new w,Df=new w,As=class extends q{constructor(){super(),this.isLOD=!0,this._currentLevel=0,this.type="LOD",Object.defineProperties(this,{levels:{enumerable:!0,value:[]}}),this.autoUpdate=!0}copy(e){super.copy(e,!1);let t=e.levels;for(let i=0,r=t.length;i<r;i++){let n=t[i];this.addLevel(n.object.clone(),n.distance,n.hysteresis)}return this.autoUpdate=e.autoUpdate,this}addLevel(e,t=0,i=0){t=Math.abs(t);let r=this.levels,n;for(n=0;n<r.length&&!(t<r[n].distance);n++);return r.splice(n,0,{distance:t,hysteresis:i,object:e}),this.add(e),this}removeLevel(e){let t=this.levels;for(let i=0;i<t.length;i++)if(t[i].distance===e){let r=t.splice(i,1);return this.remove(r[0].object),!0}return!1}getCurrentLevel(){return this._currentLevel}getObjectForDistance(e){let t=this.levels;if(t.length>0){let i,r;for(i=1,r=t.length;i<r;i++){let n=t[i].distance;if(t[i].object.visible&&(n-=n*t[i].hysteresis),e<n)break}return t[i-1].object}return null}raycast(e,t){if(this.levels.length>0){hl.setFromMatrixPosition(this.matrixWorld);let r=e.ray.origin.distanceTo(hl);this.getObjectForDistance(r).raycast(e,t)}}update(e){let t=this.levels;if(t.length>1){hl.setFromMatrixPosition(e.matrixWorld),Df.setFromMatrixPosition(this.matrixWorld);let i=hl.distanceTo(Df)/e.zoom;t[0].object.visible=!0;let r,n;for(r=1,n=t.length;r<n;r++){let s=t[r].distance;if(t[r].object.visible&&(s-=s*t[r].hysteresis),i>=s)t[r-1].object.visible=!1,t[r].object.visible=!0;else break}for(this._currentLevel=r-1;r<n;r++)t[r].object.visible=!1}}toJSON(e){let t=super.toJSON(e);t.object.autoUpdate=this.autoUpdate,t.object.levels=[];let i=this.levels;for(let r=0,n=i.length;r<n;r++){let s=i[r];t.object.levels.push({object:s.object.uuid,distance:s.distance,hysteresis:s.hysteresis})}return t}};var Yi=new w,Mu=new w,ul=new w,dl=new w,Et=class{constructor(e=new w,t=new w(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Yi)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Yi.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Yi.copy(this.origin).addScaledVector(this.direction,t),Yi.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){Mu.copy(e).add(t).multiplyScalar(.5),ul.copy(t).sub(e).normalize(),dl.copy(this.origin).sub(Mu);let n=e.distanceTo(t)*.5,s=-this.direction.dot(ul),a=dl.dot(this.direction),l=-dl.dot(ul),c=dl.lengthSq(),h=Math.abs(1-s*s),u,d,f,p;if(h>0)if(u=s*l-a,d=s*a-l,p=n*h,u>=0)if(d>=-p)if(d<=p){let m=1/h;u*=m,d*=m,f=u*(u+s*d+2*a)+d*(s*u+d+2*l)+c}else d=n,u=Math.max(0,-(s*d+a)),f=-u*u+d*(d+2*l)+c;else d=-n,u=Math.max(0,-(s*d+a)),f=-u*u+d*(d+2*l)+c;else d<=-p?(u=Math.max(0,-(-s*n+a)),d=u>0?-n:Math.min(Math.max(-n,-l),n),f=-u*u+d*(d+2*l)+c):d<=p?(u=0,d=Math.min(Math.max(-n,-l),n),f=d*(d+2*l)+c):(u=Math.max(0,-(s*n+a)),d=u>0?n:Math.min(Math.max(-n,-l),n),f=-u*u+d*(d+2*l)+c);else d=s>0?-n:n,u=Math.max(0,-(s*d+a)),f=-u*u+d*(d+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(Mu).addScaledVector(ul,d),f}intersectSphere(e,t){if(e.radius<0)return null;Yi.subVectors(e.center,this.origin);let i=Yi.dot(this.direction),r=Yi.dot(Yi)-i*i,n=e.radius*e.radius;if(r>n)return null;let s=Math.sqrt(n-r),a=i-s,l=i+s;return l<0?null:a<0?this.at(l,t):this.at(a,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,n,s,a,l,c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(i=(e.min.x-d.x)*c,r=(e.max.x-d.x)*c):(i=(e.max.x-d.x)*c,r=(e.min.x-d.x)*c),h>=0?(n=(e.min.y-d.y)*h,s=(e.max.y-d.y)*h):(n=(e.max.y-d.y)*h,s=(e.min.y-d.y)*h),i>s||n>r||((n>i||isNaN(i))&&(i=n),(s<r||isNaN(r))&&(r=s),u>=0?(a=(e.min.z-d.z)*u,l=(e.max.z-d.z)*u):(a=(e.max.z-d.z)*u,l=(e.min.z-d.z)*u),i>l||a>r)||((a>i||i!==i)&&(i=a),(l<r||r!==r)&&(r=l),r<0)?null:this.at(i>=0?i:r,t)}intersectsBox(e){return this.intersectBox(e,Yi)!==null}intersectTriangle(e,t,i,r,n){let s=this.origin,a=this.direction,l=a.x,c=a.y,h=a.z,u=e.x-s.x,d=e.y-s.y,f=e.z-s.z,p=t.x-s.x,m=t.y-s.y,_=t.z-s.z,g=i.x-s.x,x=i.y-s.y,y=i.z-s.z,v=Math.abs(l),M=Math.abs(c),A=Math.abs(h),T,S,b,C,I,B,N,k,V,J,Q,Me;if(v>=M&&v>=A?(b=l,B=u,V=p,Me=g,l>=0?(T=c,S=h,C=d,I=f,N=m,k=_,J=x,Q=y):(T=h,S=c,C=f,I=d,N=_,k=m,J=y,Q=x)):M>=A?(b=c,B=d,V=m,Me=x,c>=0?(T=h,S=l,C=f,I=u,N=_,k=p,J=y,Q=g):(T=l,S=h,C=u,I=f,N=p,k=_,J=g,Q=y)):(b=h,B=f,V=_,Me=y,h>=0?(T=l,S=c,C=u,I=d,N=p,k=m,J=g,Q=x):(T=c,S=l,C=d,I=u,N=m,k=p,J=x,Q=g)),b===0)return null;let he=T/b,ue=S/b,de=1/b,Ie=C-he*B,He=I-ue*B,Ke=N-he*V,lt=k-ue*V,we=J-he*Me,Da=Q-ue*Me,$i=we*lt-Da*Ke,yt=Ie*Da-He*we,xi=Ke*He-lt*Ie;if(r){if($i<0||yt<0||xi<0)return null}else if(($i<0||yt<0||xi<0)&&($i>0||yt>0||xi>0))return null;let To=$i+yt+xi;if(To===0)return null;let Nt=de*($i*B+yt*V+xi*Me);return(To>0?Nt<0:Nt>0)?null:this.at(Nt/To,n)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}};var _e=class extends te{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new L(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new $e,this.combine=Rr,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var Bf=new z,Xr=new Et,fl=new pe,Ff=new w,pl=new w,ml=new w,gl=new w,Su=new w,_l=new w,Of=new w,xl=new w,ae=class extends q{constructor(e=new D,t=new _e){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let n=0,s=r.length;n<s;n++){let a=r[n].name||String(n);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=n}}}}getVertexPosition(e,t){let i=this.geometry,r=i.attributes.position,n=i.morphAttributes.position,s=i.morphTargetsRelative;t.fromBufferAttribute(r,e);let a=this.morphTargetInfluences;if(n&&a){_l.set(0,0,0);for(let l=0,c=n.length;l<c;l++){let h=a[l],u=n[l];h!==0&&(Su.fromBufferAttribute(u,e),s?_l.addScaledVector(Su,h):_l.addScaledVector(Su.sub(t),h))}t.add(_l)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let i=this.geometry,r=this.material,n=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),fl.copy(i.boundingSphere),fl.applyMatrix4(n),Xr.copy(e.ray).recast(e.near),!(fl.containsPoint(Xr.origin)===!1&&(Xr.intersectSphere(fl,Ff)===null||Xr.origin.distanceToSquared(Ff)>(e.far-e.near)**2))&&(Bf.copy(n).invert(),Xr.copy(e.ray).applyMatrix4(Bf),!(i.boundingBox!==null&&Xr.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,Xr)))}_computeIntersections(e,t,i){let r,n=this.geometry,s=this.material,a=n.index,l=n.attributes.position,c=n.attributes.uv,h=n.attributes.uv1,u=n.attributes.normal,d=n.groups,f=n.drawRange;if(a!==null)if(Array.isArray(s))for(let p=0,m=d.length;p<m;p++){let _=d[p],g=s[_.materialIndex],x=Math.max(_.start,f.start),y=Math.min(a.count,Math.min(_.start+_.count,f.start+f.count));for(let v=x,M=y;v<M;v+=3){let A=a.getX(v),T=a.getX(v+1),S=a.getX(v+2);r=yl(this,g,e,i,c,h,u,A,T,S),r&&(r.faceIndex=Math.floor(v/3),r.face.materialIndex=_.materialIndex,t.push(r))}}else{let p=Math.max(0,f.start),m=Math.min(a.count,f.start+f.count);for(let _=p,g=m;_<g;_+=3){let x=a.getX(_),y=a.getX(_+1),v=a.getX(_+2);r=yl(this,s,e,i,c,h,u,x,y,v),r&&(r.faceIndex=Math.floor(_/3),t.push(r))}}else if(l!==void 0)if(Array.isArray(s))for(let p=0,m=d.length;p<m;p++){let _=d[p],g=s[_.materialIndex],x=Math.max(_.start,f.start),y=Math.min(l.count,Math.min(_.start+_.count,f.start+f.count));for(let v=x,M=y;v<M;v+=3){let A=v,T=v+1,S=v+2;r=yl(this,g,e,i,c,h,u,A,T,S),r&&(r.faceIndex=Math.floor(v/3),r.face.materialIndex=_.materialIndex,t.push(r))}}else{let p=Math.max(0,f.start),m=Math.min(l.count,f.start+f.count);for(let _=p,g=m;_<g;_+=3){let x=_,y=_+1,v=_+2;r=yl(this,s,e,i,c,h,u,x,y,v),r&&(r.faceIndex=Math.floor(_/3),t.push(r))}}}};function Ey(o,e,t,i,r,n,s,a){let l;if(e.side===yi?l=i.intersectTriangle(s,n,r,!0,a):l=i.intersectTriangle(r,n,s,e.side===Oi,a),l===null)return null;xl.copy(a),xl.applyMatrix4(o.matrixWorld);let c=t.ray.origin.distanceTo(xl);return c<t.near||c>t.far?null:{distance:c,point:xl.clone(),object:o}}function yl(o,e,t,i,r,n,s,a,l,c){o.getVertexPosition(a,pl),o.getVertexPosition(l,ml),o.getVertexPosition(c,gl);let h=Ey(o,e,t,i,pl,ml,gl,Of);if(h){let u=new w;Ct.getBarycoord(Of,pl,ml,gl,u),r&&(h.uv=Ct.getInterpolatedAttribute(r,a,l,c,u,new E)),n&&(h.uv1=Ct.getInterpolatedAttribute(n,a,l,c,u,new E)),s&&(h.normal=Ct.getInterpolatedAttribute(s,a,l,c,u,new w),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));let d={a,b:l,c,normal:new w,materialIndex:0};Ct.getNormal(pl,ml,gl,d.normal),h.face=d,h.barycoord=u}return h}var sa=new Te,Uf=new Te,zf=new Te,Iy=new Te,kf=new z,vl=new w,Au=new pe,Vf=new z,Tu=new Et,dr=class extends ae{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=Ga,this.bindMatrix=new z,this.bindMatrixInverse=new z,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){let e=this.geometry;this.boundingBox===null&&(this.boundingBox=new ye),this.boundingBox.makeEmpty();let t=e.getAttribute("position");for(let i=0;i<t.count;i++)this.getVertexPosition(i,vl),this.boundingBox.expandByPoint(vl)}computeBoundingSphere(){let e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new pe),this.boundingSphere.makeEmpty();let t=e.getAttribute("position");for(let i=0;i<t.count;i++)this.getVertexPosition(i,vl),this.boundingSphere.expandByPoint(vl)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}raycast(e,t){let i=this.material,r=this.matrixWorld;i!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Au.copy(this.boundingSphere),Au.applyMatrix4(r),e.ray.intersectsSphere(Au)!==!1&&(Vf.copy(r).invert(),Tu.copy(e.ray).applyMatrix4(Vf),!(this.boundingBox!==null&&Tu.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(e,t,Tu)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){let e=new Te,t=this.geometry.attributes.skinWeight;for(let i=0,r=t.count;i<r;i++){e.fromBufferAttribute(t,i);let n=1/e.manhattanLength();n!==1/0?e.multiplyScalar(n):e.set(1,0,0,0),t.setXYZW(i,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===Ga?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===zh?this.bindMatrixInverse.copy(this.bindMatrix).invert():O("SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){let i=this.skeleton,r=this.geometry;Uf.fromBufferAttribute(r.attributes.skinIndex,e),zf.fromBufferAttribute(r.attributes.skinWeight,e),t.isVector4?(sa.copy(t),t.set(0,0,0,0)):(sa.set(...t,1),t.set(0,0,0)),sa.applyMatrix4(this.bindMatrix);for(let n=0;n<4;n++){let s=zf.getComponent(n);if(s!==0){let a=Uf.getComponent(n);kf.multiplyMatrices(i.bones[a].matrixWorld,i.boneInverses[a]),t.addScaledVector(Iy.copy(sa).applyMatrix4(kf),s)}}return t.isVector4&&(t.w=sa.w),t.applyMatrix4(this.bindMatrixInverse)}};var Si=class extends q{constructor(){super(),this.isBone=!0,this.type="Bone"}};var Le=class extends ne{constructor(e=null,t=1,i=1,r,n,s,a,l,c=me,h=me,u,d){super(null,s,a,l,c,h,r,n,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Gf=new z,Ry=new z,fr=class o{constructor(e=[],t=[]){this.uuid=Pe(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){let e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){O("Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let i=0,r=this.bones.length;i<r;i++)this.boneInverses.push(new z)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){let i=new z;this.bones[e]&&i.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(i)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){let i=this.bones[e];i&&i.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){let i=this.bones[e];i&&(i.parent&&i.parent.isBone?(i.matrix.copy(i.parent.matrixWorld).invert(),i.matrix.multiply(i.matrixWorld)):i.matrix.copy(i.matrixWorld),i.matrix.decompose(i.position,i.quaternion,i.scale))}}update(){let e=this.bones,t=this.boneInverses,i=this.boneMatrices,r=this.boneTexture;for(let n=0,s=e.length;n<s;n++){let a=e[n]?e[n].matrixWorld:Ry;Gf.multiplyMatrices(a,t[n]),Gf.toArray(i,n*16)}r!==null&&(r.needsUpdate=!0)}clone(){return new o(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);let t=new Float32Array(e*e*4);t.set(this.boneMatrices);let i=new Le(t,e,e,je,Tt);return i.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=i,this}getBoneByName(e){for(let t=0,i=this.bones.length;t<i;t++){let r=this.bones[t];if(r.name===e)return r}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let i=0,r=e.bones.length;i<r;i++){let n=e.bones[i],s=t[n];s===void 0&&(O("Skeleton: No bone found with UUID:",n),s=new Si),this.bones.push(s),this.boneInverses.push(new z().fromArray(e.boneInverses[i]))}return this.init(),this}toJSON(){let e={metadata:{version:4.7,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;let t=this.bones,i=this.boneInverses;for(let r=0,n=t.length;r<n;r++){let s=t[r];e.bones.push(s.uuid);let a=i[r];e.boneInverses.push(a.toArray())}return e}};var ft=class extends ${constructor(e,t,i,r=1){super(e,t,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}};var Ts=new z,Hf=new z,wl=[],Wf=new ye,Py=new z,oa=new ae,aa=new pe,pr=class extends ae{constructor(e,t,i){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new ft(new Float32Array(i*16),16),this.instanceColor=null,this.morphTexture=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let r=0;r<i;r++)this.setMatrixAt(r,Py)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new ye),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,Ts),Wf.copy(e.boundingBox).applyMatrix4(Ts),this.boundingBox.union(Wf)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new pe),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,Ts),aa.copy(e.boundingSphere).applyMatrix4(Ts),this.boundingSphere.union(aa)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let i=t.morphTargetInfluences,r=this.morphTexture.source.data.data,n=i.length+1,s=e*n+1;for(let a=0;a<i.length;a++)i[a]=r[s+a]}raycast(e,t){let i=this.matrixWorld,r=this.count;if(oa.geometry=this.geometry,oa.material=this.material,oa.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),aa.copy(this.boundingSphere),aa.applyMatrix4(i),e.ray.intersectsSphere(aa)!==!1))for(let n=0;n<r;n++){this.getMatrixAt(n,Ts),Hf.multiplyMatrices(i,Ts),oa.matrixWorld=Hf,oa.raycast(e,wl);for(let s=0,a=wl.length;s<a;s++){let l=wl[s];l.instanceId=n,l.object=this,t.push(l)}wl.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new ft(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let i=t.morphTargetInfluences,r=i.length+1;this.morphTexture===null&&(this.morphTexture=new Le(new Float32Array(r*this.count),r,this.count,wi,Tt));let n=this.morphTexture.source.data.data,s=0;for(let c=0;c<i.length;c++)s+=i[c];let a=this.geometry.morphTargetsRelative?1:1-s,l=r*e;return n[l]=a,n.set(i,l+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}};var Yr=new pe,Ly=new E(.5,.5),bl=new w,It=class{constructor(e=new Ht,t=new Ht,i=new Ht,r=new Ht,n=new Ht,s=new Ht){this.planes=[e,t,i,r,n,s]}set(e,t,i,r,n,s){let a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(i),a[3].copy(r),a[4].copy(n),a[5].copy(s),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=tt,i=!1){let r=this.planes,n=e.elements,s=n[0],a=n[1],l=n[2],c=n[3],h=n[4],u=n[5],d=n[6],f=n[7],p=n[8],m=n[9],_=n[10],g=n[11],x=n[12],y=n[13],v=n[14],M=n[15];if(r[0].setComponents(c-s,f-h,g-p,M-x).normalize(),r[1].setComponents(c+s,f+h,g+p,M+x).normalize(),r[2].setComponents(c+a,f+u,g+m,M+y).normalize(),r[3].setComponents(c-a,f-u,g-m,M-y).normalize(),i)r[4].setComponents(l,d,_,v).normalize(),r[5].setComponents(c-l,f-d,g-_,M-v).normalize();else if(r[4].setComponents(c-l,f-d,g-_,M-v).normalize(),t===tt)r[5].setComponents(c+l,f+d,g+_,M+v).normalize();else if(t===Jt)r[5].setComponents(l,d,_,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Yr.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Yr.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Yr)}intersectsSprite(e){Yr.center.set(0,0,0);let t=Ly.distanceTo(e.center);return Yr.radius=.7071067811865476+t,Yr.applyMatrix4(e.matrixWorld),this.intersectsSphere(Yr)}intersectsSphere(e){let t=this.planes,i=e.center,r=-e.radius;for(let n=0;n<6;n++)if(t[n].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let r=t[i];if(bl.x=r.normal.x>0?e.max.x:e.min.x,bl.y=r.normal.y>0?e.max.y:e.min.y,bl.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(bl)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var qf=new z,Cs=class o{constructor(){this.coordinateSystem=tt,this._frustums=[],this._count=0}setFromArrayCamera(e){let t=e.cameras,i=this._frustums;for(let r=0;r<t.length;r++){let n=t[r];qf.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),i[r]===void 0&&(i[r]=new It),i[r].setFromProjectionMatrix(qf,n.coordinateSystem,n.reversedDepth)}return this._count=t.length,this}intersectsObject(e){let t=this._frustums;for(let i=0;i<this._count;i++)if(t[i].intersectsObject(e))return!0;return!1}intersectsSprite(e){let t=this._frustums;for(let i=0;i<this._count;i++)if(t[i].intersectsSprite(e))return!0;return!1}intersectsSphere(e){let t=this._frustums;for(let i=0;i<this._count;i++)if(t[i].intersectsSphere(e))return!0;return!1}intersectsBox(e){let t=this._frustums;for(let i=0;i<this._count;i++)if(t[i].intersectsBox(e))return!0;return!1}containsPoint(e){let t=this._frustums;for(let i=0;i<this._count;i++)if(t[i].containsPoint(e))return!0;return!1}copy(e){this.coordinateSystem=e.coordinateSystem;let t=this._frustums,i=e._frustums;for(let r=0;r<e._count;r++)t[r]===void 0&&(t[r]=new It),t[r].copy(i[r]);return this._count=e._count,this}clone(){return new o().copy(this)}};function Cu(o,e){return o-e}function Ny(o,e){return o.z-e.z}function Dy(o,e){return e.z-o.z}var Iu=class{constructor(){this.index=0,this.pool=[],this.list=[]}push(e,t,i,r){let n=this.pool,s=this.list;this.index>=n.length&&n.push({start:-1,count:-1,z:-1,index:-1});let a=n[this.index];s.push(a),this.index++,a.start=e,a.count=t,a.z=i,a.index=r}reset(){this.list.length=0,this.index=0}},Rt=new z,By=new L(1,1,1),Fy=new It,Oy=new Cs,Ml=new ye,Zr=new pe,la=new w,Xf=new w,Uy=new w,Eu=new Iu,pt=new ae,Sl=[];function zy(o,e,t=0){let i=e.itemSize;if(o.isInterleavedBufferAttribute||o.array.constructor!==e.array.constructor){let r=o.count;for(let n=0;n<r;n++)for(let s=0;s<i;s++)e.setComponent(n+t,s,o.getComponent(n,s))}else e.array.set(o.array,t*i);e.needsUpdate=!0}function Jr(o,e){if(o.constructor!==e.constructor){let t=Math.min(o.length,e.length);for(let i=0;i<t;i++)e[i]=o[i]}else{let t=Math.min(o.length,e.length);e.set(new o.constructor(o.buffer,0,t))}}var Es=class extends ae{constructor(e,t,i=t*2,r){super(new D,r),this.isBatchedMesh=!0,this.perObjectFrustumCulled=!0,this.sortObjects=!0,this.boundingBox=null,this.boundingSphere=null,this.customSort=null,this._instanceInfo=[],this._geometryInfo=[],this._availableInstanceIds=[],this._availableGeometryIds=[],this._nextIndexStart=0,this._nextVertexStart=0,this._geometryCount=0,this._visibilityChanged=!0,this._geometryInitialized=!1,this._maxInstanceCount=e,this._maxVertexCount=t,this._maxIndexCount=i,this._multiDrawCounts=new Int32Array(e),this._multiDrawStarts=new Int32Array(e),this._multiDrawCount=0,this._multiDrawBytesPerElement=1,this._matricesTexture=null,this._indirectTexture=null,this._colorsTexture=null,this._initMatricesTexture(),this._initIndirectTexture()}get maxInstanceCount(){return this._maxInstanceCount}get instanceCount(){return this._instanceInfo.length-this._availableInstanceIds.length}get unusedVertexCount(){return this._maxVertexCount-this._nextVertexStart}get unusedIndexCount(){return this._maxIndexCount-this._nextIndexStart}_initMatricesTexture(){let e=Math.sqrt(this._maxInstanceCount*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);let t=new Float32Array(e*e*4),i=new Le(t,e,e,je,Tt);this._matricesTexture=i}_initIndirectTexture(){let e=Math.sqrt(this._maxInstanceCount);e=Math.ceil(e);let t=new Uint32Array(e*e),i=new Le(t,e,e,Nr,oi);this._indirectTexture=i}_initColorsTexture(){let e=Math.sqrt(this._maxInstanceCount);e=Math.ceil(e);let t=new Float32Array(e*e*4).fill(1),i=new Le(t,e,e,je,Tt);i.colorSpace=ze.workingColorSpace,this._colorsTexture=i}_initializeGeometry(e){let t=this.geometry,i=this._maxVertexCount,r=this._maxIndexCount;if(this._geometryInitialized===!1){for(let n in e.attributes){let s=e.getAttribute(n),{array:a,itemSize:l,normalized:c}=s,h=new a.constructor(i*l),u=new $(h,l,c);t.setAttribute(n,u)}if(e.getIndex()!==null){let n=i>65535?new Uint32Array(r):new Uint16Array(r);t.setIndex(new $(n,1))}this._geometryInitialized=!0}}_validateGeometry(e){let t=this.geometry;if(!!e.getIndex()!=!!t.getIndex())throw new Error('THREE.BatchedMesh: All geometries must consistently have "index".');for(let i in t.attributes){if(!e.hasAttribute(i))throw new Error(`THREE.BatchedMesh: Added geometry missing "${i}". All geometries must have consistent attributes.`);let r=e.getAttribute(i),n=t.getAttribute(i);if(r.itemSize!==n.itemSize||r.normalized!==n.normalized)throw new Error("THREE.BatchedMesh: All attributes must have a consistent itemSize and normalized value.")}}validateInstanceId(e){let t=this._instanceInfo;if(e<0||e>=t.length||t[e].active===!1)throw new Error(`THREE.BatchedMesh: Invalid instanceId ${e}. Instance is either out of range or has been deleted.`)}validateGeometryId(e){let t=this._geometryInfo;if(e<0||e>=t.length||t[e].active===!1)throw new Error(`THREE.BatchedMesh: Invalid geometryId ${e}. Geometry is either out of range or has been deleted.`)}setCustomSort(e){return this.customSort=e,this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ye);let e=this.boundingBox,t=this._instanceInfo;e.makeEmpty();for(let i=0,r=t.length;i<r;i++){if(t[i].active===!1)continue;let n=t[i].geometryIndex;this.getMatrixAt(i,Rt),this.getBoundingBoxAt(n,Ml).applyMatrix4(Rt),e.union(Ml)}}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new pe);let e=this.boundingSphere,t=this._instanceInfo;e.makeEmpty();for(let i=0,r=t.length;i<r;i++){if(t[i].active===!1)continue;let n=t[i].geometryIndex;this.getMatrixAt(i,Rt),this.getBoundingSphereAt(n,Zr).applyMatrix4(Rt),e.union(Zr)}}addInstance(e){if(this._instanceInfo.length>=this.maxInstanceCount&&this._availableInstanceIds.length===0)throw new Error("THREE.BatchedMesh: Maximum item count reached.");let i={visible:!0,active:!0,geometryIndex:e},r=null;this._availableInstanceIds.length>0?(this._availableInstanceIds.sort(Cu),r=this._availableInstanceIds.shift(),this._instanceInfo[r]=i):(r=this._instanceInfo.length,this._instanceInfo.push(i));let n=this._matricesTexture;Rt.identity().toArray(n.image.data,r*16),n.needsUpdate=!0;let s=this._colorsTexture;return s&&(By.toArray(s.image.data,r*4),s.needsUpdate=!0),this._visibilityChanged=!0,r}addGeometry(e,t=-1,i=-1){this._initializeGeometry(e),this._validateGeometry(e);let r={vertexStart:-1,vertexCount:-1,reservedVertexCount:-1,indexStart:-1,indexCount:-1,reservedIndexCount:-1,start:-1,count:-1,boundingBox:null,boundingSphere:null,active:!0},n=this._geometryInfo;r.vertexStart=this._nextVertexStart,r.reservedVertexCount=t===-1?e.getAttribute("position").count:t;let s=e.getIndex();if(s!==null&&(r.indexStart=this._nextIndexStart,r.reservedIndexCount=i===-1?s.count:i),r.indexStart!==-1&&r.indexStart+r.reservedIndexCount>this._maxIndexCount||r.vertexStart+r.reservedVertexCount>this._maxVertexCount)throw new Error("THREE.BatchedMesh: Reserved space request exceeds the maximum buffer size.");let l;return this._availableGeometryIds.length>0?(this._availableGeometryIds.sort(Cu),l=this._availableGeometryIds.shift(),n[l]=r):(l=this._geometryCount,this._geometryCount++,n.push(r)),this.setGeometryAt(l,e),this._nextIndexStart=r.indexStart+r.reservedIndexCount,this._nextVertexStart=r.vertexStart+r.reservedVertexCount,l}setGeometryAt(e,t){if(e>=this._geometryCount)throw new Error("THREE.BatchedMesh: Maximum geometry count reached.");this._validateGeometry(t);let i=this.geometry,r=i.getIndex()!==null,n=i.getIndex(),s=t.getIndex(),a=this._geometryInfo[e];if(r&&s.count>a.reservedIndexCount||t.attributes.position.count>a.reservedVertexCount)throw new Error("THREE.BatchedMesh: Reserved space not large enough for provided geometry.");let l=a.vertexStart,c=a.reservedVertexCount;a.vertexCount=t.getAttribute("position").count;for(let h in i.attributes){let u=t.getAttribute(h),d=i.getAttribute(h);zy(u,d,l);let f=u.itemSize;for(let p=u.count,m=c;p<m;p++){let _=l+p;for(let g=0;g<f;g++)d.setComponent(_,g,0)}d.needsUpdate=!0,d.addUpdateRange(l*f,c*f)}if(r){let h=a.indexStart,u=a.reservedIndexCount;a.indexCount=t.getIndex().count;for(let d=0;d<s.count;d++)n.setX(h+d,l+s.getX(d));for(let d=s.count,f=u;d<f;d++)n.setX(h+d,l);n.needsUpdate=!0,n.addUpdateRange(h,a.reservedIndexCount)}return a.start=r?a.indexStart:a.vertexStart,a.count=r?a.indexCount:a.vertexCount,a.boundingBox=null,t.boundingBox!==null&&(a.boundingBox=t.boundingBox.clone()),a.boundingSphere=null,t.boundingSphere!==null&&(a.boundingSphere=t.boundingSphere.clone()),this._visibilityChanged=!0,e}deleteGeometry(e){let t=this._geometryInfo;if(e>=t.length||t[e].active===!1)return this;let i=this._instanceInfo;for(let r=0,n=i.length;r<n;r++)i[r].active&&i[r].geometryIndex===e&&this.deleteInstance(r);return t[e].active=!1,this._availableGeometryIds.push(e),this._visibilityChanged=!0,this}deleteInstance(e){return this.validateInstanceId(e),this._instanceInfo[e].active=!1,this._availableInstanceIds.push(e),this._visibilityChanged=!0,this}optimize(){let e=0,t=0,i=this._geometryInfo,r=i.map((s,a)=>a).sort((s,a)=>i[s].vertexStart-i[a].vertexStart),n=this.geometry;for(let s=0,a=i.length;s<a;s++){let l=r[s],c=i[l];if(c.active!==!1){if(n.index!==null){if(c.indexStart!==t){let{indexStart:h,vertexStart:u,reservedIndexCount:d}=c,f=n.index,p=f.array,m=e-u;for(let _=h;_<h+d;_++)p[_]=p[_]+m;f.array.copyWithin(t,h,h+d),f.addUpdateRange(t,d),f.needsUpdate=!0,c.indexStart=t}t+=c.reservedIndexCount}if(c.vertexStart!==e){let{vertexStart:h,reservedVertexCount:u}=c,d=n.attributes;for(let f in d){let p=d[f],{array:m,itemSize:_}=p;m.copyWithin(e*_,h*_,(h+u)*_),p.addUpdateRange(e*_,u*_),p.needsUpdate=!0}c.vertexStart=e}e+=c.reservedVertexCount,c.start=n.index?c.indexStart:c.vertexStart}}return this._nextIndexStart=t,this._nextVertexStart=e,this._visibilityChanged=!0,this}getBoundingBoxAt(e,t){if(e>=this._geometryCount)return null;let i=this.geometry,r=this._geometryInfo[e];if(r.boundingBox===null){let n=new ye,s=i.index,a=i.attributes.position;for(let l=r.start,c=r.start+r.count;l<c;l++){let h=l;s&&(h=s.getX(h)),n.expandByPoint(la.fromBufferAttribute(a,h))}r.boundingBox=n}return t.copy(r.boundingBox),t}getBoundingSphereAt(e,t){if(e>=this._geometryCount)return null;let i=this.geometry,r=this._geometryInfo[e];if(r.boundingSphere===null){let n=new pe;this.getBoundingBoxAt(e,Ml),Ml.getCenter(n.center);let s=i.index,a=i.attributes.position,l=0;for(let c=r.start,h=r.start+r.count;c<h;c++){let u=c;s&&(u=s.getX(u)),la.fromBufferAttribute(a,u),l=Math.max(l,n.center.distanceToSquared(la))}n.radius=Math.sqrt(l),r.boundingSphere=n}return t.copy(r.boundingSphere),t}setMatrixAt(e,t){this.validateInstanceId(e);let i=this._matricesTexture,r=this._matricesTexture.image.data;return t.toArray(r,e*16),i.needsUpdate=!0,this}getMatrixAt(e,t){return this.validateInstanceId(e),t.fromArray(this._matricesTexture.image.data,e*16)}setColorAt(e,t){return this.validateInstanceId(e),this._colorsTexture===null&&this._initColorsTexture(),t.toArray(this._colorsTexture.image.data,e*4),this._colorsTexture.needsUpdate=!0,this}getColorAt(e,t){return this.validateInstanceId(e),this._colorsTexture===null?t.isVector4?t.set(1,1,1,1):t.setRGB(1,1,1):t.fromArray(this._colorsTexture.image.data,e*4)}setVisibleAt(e,t){return this.validateInstanceId(e),this._instanceInfo[e].visible===t?this:(this._instanceInfo[e].visible=t,this._visibilityChanged=!0,this)}getVisibleAt(e){return this.validateInstanceId(e),this._instanceInfo[e].visible}setGeometryIdAt(e,t){return this.validateInstanceId(e),this.validateGeometryId(t),this._instanceInfo[e].geometryIndex=t,this._visibilityChanged=!0,this}getGeometryIdAt(e){return this.validateInstanceId(e),this._instanceInfo[e].geometryIndex}getGeometryRangeAt(e,t={}){this.validateGeometryId(e);let i=this._geometryInfo[e];return t.vertexStart=i.vertexStart,t.vertexCount=i.vertexCount,t.reservedVertexCount=i.reservedVertexCount,t.indexStart=i.indexStart,t.indexCount=i.indexCount,t.reservedIndexCount=i.reservedIndexCount,t.start=i.start,t.count=i.count,t}setInstanceCount(e){let t=this._availableInstanceIds,i=this._instanceInfo;for(t.sort(Cu);t[t.length-1]===i.length-1;)i.pop(),t.pop();if(e<i.length)throw new Error(`THREE.BatchedMesh: Instance ids outside the range ${e} are being used. Cannot shrink instance count.`);let r=new Int32Array(e),n=new Int32Array(e);Jr(this._multiDrawCounts,r),Jr(this._multiDrawStarts,n),this._multiDrawCounts=r,this._multiDrawStarts=n,this._maxInstanceCount=e;let s=this._indirectTexture,a=this._matricesTexture,l=this._colorsTexture;s.dispose(),this._initIndirectTexture(),Jr(s.image.data,this._indirectTexture.image.data),a.dispose(),this._initMatricesTexture(),Jr(a.image.data,this._matricesTexture.image.data),l&&(l.dispose(),this._initColorsTexture(),Jr(l.image.data,this._colorsTexture.image.data))}setGeometrySize(e,t){let i=[...this._geometryInfo].filter(a=>a.active);if(Math.max(...i.map(a=>a.vertexStart+a.reservedVertexCount))>e)throw new Error(`THREE.BatchedMesh: Geometry vertex values are being used outside the range ${t}. Cannot shrink further.`);if(this.geometry.index&&Math.max(...i.map(l=>l.indexStart+l.reservedIndexCount))>t)throw new Error(`THREE.BatchedMesh: Geometry index values are being used outside the range ${t}. Cannot shrink further.`);let n=this.geometry;n.dispose(),this._maxVertexCount=e,this._maxIndexCount=t,this._geometryInitialized&&(this._geometryInitialized=!1,this.geometry=new D,this._initializeGeometry(n));let s=this.geometry;n.index&&Jr(n.index.array,s.index.array);for(let a in n.attributes)Jr(n.attributes[a].array,s.attributes[a].array)}raycast(e,t){let i=this._instanceInfo,r=this._geometryInfo,n=this.matrixWorld,s=this.geometry;pt.material=this.material,pt.geometry.index=s.index,pt.geometry.attributes=s.attributes,pt.geometry.boundingBox===null&&(pt.geometry.boundingBox=new ye),pt.geometry.boundingSphere===null&&(pt.geometry.boundingSphere=new pe);for(let a=0,l=i.length;a<l;a++){if(!i[a].visible||!i[a].active)continue;let c=i[a].geometryIndex,h=r[c];pt.geometry.setDrawRange(h.start,h.count),this.getMatrixAt(a,pt.matrixWorld).premultiply(n),this.getBoundingBoxAt(c,pt.geometry.boundingBox),this.getBoundingSphereAt(c,pt.geometry.boundingSphere),pt.raycast(e,Sl);for(let u=0,d=Sl.length;u<d;u++){let f=Sl[u];f.object=this,f.batchId=a,t.push(f)}Sl.length=0}pt.material=null,pt.geometry.index=null,pt.geometry.attributes={},pt.geometry.setDrawRange(0,1/0)}copy(e){return super.copy(e),this.geometry=e.geometry.clone(),this.perObjectFrustumCulled=e.perObjectFrustumCulled,this.sortObjects=e.sortObjects,this.boundingBox=e.boundingBox!==null?e.boundingBox.clone():null,this.boundingSphere=e.boundingSphere!==null?e.boundingSphere.clone():null,this._geometryInfo=e._geometryInfo.map(t=>({...t,boundingBox:t.boundingBox!==null?t.boundingBox.clone():null,boundingSphere:t.boundingSphere!==null?t.boundingSphere.clone():null})),this._instanceInfo=e._instanceInfo.map(t=>({...t})),this._availableInstanceIds=e._availableInstanceIds.slice(),this._availableGeometryIds=e._availableGeometryIds.slice(),this._nextIndexStart=e._nextIndexStart,this._nextVertexStart=e._nextVertexStart,this._geometryCount=e._geometryCount,this._maxInstanceCount=e._maxInstanceCount,this._maxVertexCount=e._maxVertexCount,this._maxIndexCount=e._maxIndexCount,this._geometryInitialized=e._geometryInitialized,this._multiDrawCounts=e._multiDrawCounts.slice(),this._multiDrawStarts=e._multiDrawStarts.slice(),this._multiDrawBytesPerElement=e._multiDrawBytesPerElement,this._indirectTexture=e._indirectTexture.clone(),this._indirectTexture.image.data=this._indirectTexture.image.data.slice(),this._matricesTexture=e._matricesTexture.clone(),this._matricesTexture.image.data=this._matricesTexture.image.data.slice(),this._colorsTexture!==null&&(this._colorsTexture=e._colorsTexture.clone(),this._colorsTexture.image.data=this._colorsTexture.image.data.slice()),this}dispose(){super.dispose(),this.geometry.dispose(),this._matricesTexture.dispose(),this._matricesTexture=null,this._indirectTexture.dispose(),this._indirectTexture=null,this._colorsTexture!==null&&(this._colorsTexture.dispose(),this._colorsTexture=null)}onBeforeRender(e,t,i,r,n){if(!this._visibilityChanged&&!this.perObjectFrustumCulled&&!this.sortObjects)return;let s=r.getIndex(),a=s===null?1:s.array.BYTES_PER_ELEMENT,l=1;n.wireframe&&(l=2,a=r.attributes.position.count>65535?4:2);let c=this._instanceInfo,h=this._multiDrawStarts,u=this._multiDrawCounts,d=this._geometryInfo,f=this.perObjectFrustumCulled,p=this._indirectTexture,m=p.image.data,_=i.isArrayCamera?Oy:Fy;f&&(i.isArrayCamera?_.setFromArrayCamera(i):(Rt.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse).multiply(this.matrixWorld),_.setFromProjectionMatrix(Rt,i.coordinateSystem,i.reversedDepth)));let g=0;if(this.sortObjects){Rt.copy(this.matrixWorld).invert(),la.setFromMatrixPosition(i.matrixWorld).applyMatrix4(Rt),Xf.set(0,0,-1).transformDirection(i.matrixWorld).transformDirection(Rt);for(let v=0,M=c.length;v<M;v++)if(c[v].visible&&c[v].active){let A=c[v].geometryIndex;this.getMatrixAt(v,Rt),this.getBoundingSphereAt(A,Zr).applyMatrix4(Rt);let T=!1;if(f&&(T=!_.intersectsSphere(Zr)),!T){let S=d[A],b=Uy.subVectors(Zr.center,la).dot(Xf);Eu.push(S.start,S.count,b,v)}}let x=Eu.list,y=this.customSort;y===null?x.sort(n.transparent?Dy:Ny):y.call(this,x,i);for(let v=0,M=x.length;v<M;v++){let A=x[v];h[g]=A.start*a*l,u[g]=A.count*l,m[g]=A.index,g++}Eu.reset()}else for(let x=0,y=c.length;x<y;x++)if(c[x].visible&&c[x].active){let v=c[x].geometryIndex,M=!1;if(f&&(this.getMatrixAt(x,Rt),this.getBoundingSphereAt(v,Zr).applyMatrix4(Rt),M=!_.intersectsSphere(Zr)),!M){let A=d[v];h[g]=A.start*a*l,u[g]=A.count*l,m[g]=x,g++}}p.needsUpdate=!0,this._multiDrawCount=g,this._multiDrawBytesPerElement=a,this._visibilityChanged=!1}onBeforeShadow(e,t,i,r,n,s){this.onBeforeRender(e,null,r,n,s)}};var oe=class extends te{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new L(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}};var Cl=new w,El=new w,Yf=new z,ca=new Et,Al=new pe,Ru=new w,Zf=new w,Ze=class extends q{constructor(e=new D,t=new oe){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[0];for(let r=1,n=t.count;r<n;r++)Cl.fromBufferAttribute(t,r-1),El.fromBufferAttribute(t,r),i[r]=i[r-1],i[r]+=Cl.distanceTo(El);e.setAttribute("lineDistance",new R(i,1))}else O("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let i=this.geometry,r=this.matrixWorld,n=e.params.Line.threshold,s=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Al.copy(i.boundingSphere),Al.applyMatrix4(r),Al.radius+=n,e.ray.intersectsSphere(Al)===!1)return;Yf.copy(r).invert(),ca.copy(e.ray).applyMatrix4(Yf);let a=n/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=this.isLineSegments?2:1,h=i.index,d=i.attributes.position;if(h!==null){let f=Math.max(0,s.start),p=Math.min(h.count,s.start+s.count);for(let m=f,_=p-1;m<_;m+=c){let g=h.getX(m),x=h.getX(m+1),y=Tl(this,e,ca,l,g,x,m);y&&t.push(y)}if(this.isLineLoop){let m=h.getX(p-1),_=h.getX(f),g=Tl(this,e,ca,l,m,_,p-1);g&&t.push(g)}}else{let f=Math.max(0,s.start),p=Math.min(d.count,s.start+s.count);for(let m=f,_=p-1;m<_;m+=c){let g=Tl(this,e,ca,l,m,m+1,m);g&&t.push(g)}if(this.isLineLoop){let m=Tl(this,e,ca,l,p-1,f,p-1);m&&t.push(m)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let n=0,s=r.length;n<s;n++){let a=r[n].name||String(n);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=n}}}}};function Tl(o,e,t,i,r,n,s){let a=o.geometry.attributes.position;if(Cl.fromBufferAttribute(a,r),El.fromBufferAttribute(a,n),t.distanceSqToSegment(Cl,El,Ru,Zf)>i)return;Ru.applyMatrix4(o.matrixWorld);let c=e.ray.origin.distanceTo(Ru);if(!(c<e.near||c>e.far))return{distance:c,point:Zf.clone().applyMatrix4(o.matrixWorld),index:s,face:null,faceIndex:null,barycoord:null,object:o}}var Jf=new w,Kf=new w,Ce=class extends Ze{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[];for(let r=0,n=t.count;r<n;r+=2)Jf.fromBufferAttribute(t,r),Kf.fromBufferAttribute(t,r+1),i[r]=r===0?0:i[r-1],i[r+1]=i[r]+Jf.distanceTo(Kf);e.setAttribute("lineDistance",new R(i,1))}else O("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}};var mr=class extends Ze{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}};var $t=class extends te{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new L(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}};var jf=new z,Pu=new Et,Il=new pe,Rl=new w,gr=class extends q{constructor(e=new D,t=new $t){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let i=this.geometry,r=this.matrixWorld,n=e.params.Points.threshold,s=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Il.copy(i.boundingSphere),Il.applyMatrix4(r),Il.radius+=n,e.ray.intersectsSphere(Il)===!1)return;jf.copy(r).invert(),Pu.copy(e.ray).applyMatrix4(jf);let a=n/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=i.index,u=i.attributes.position;if(c!==null){let d=Math.max(0,s.start),f=Math.min(c.count,s.start+s.count);for(let p=d,m=f;p<m;p++){let _=c.getX(p);Rl.fromBufferAttribute(u,_),$f(Rl,_,l,r,e,t,this)}}else{let d=Math.max(0,s.start),f=Math.min(u.count,s.start+s.count);for(let p=d,m=f;p<m;p++)Rl.fromBufferAttribute(u,p),$f(Rl,p,l,r,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let n=0,s=r.length;n<s;n++){let a=r[n].name||String(n);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=n}}}}};function $f(o,e,t,i,r,n,s){let a=Pu.distanceSqToPoint(o);if(a<t){let l=new w;Pu.closestPointToPoint(o,l),l.applyMatrix4(i);let c=r.ray.origin.distanceTo(l);if(c<r.near||c>r.far)return;n.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:s})}}var Is=class extends ne{constructor(e,t,i,r,n=xe,s=xe,a,l,c){super(e,t,i,r,n,s,a,l,c),this.isVideoTexture=!0,this.generateMipmaps=!1,this._requestVideoFrameCallbackId=0;let h=this;function u(){h.needsUpdate=!0,h._requestVideoFrameCallbackId=e.requestVideoFrameCallback(u)}"requestVideoFrameCallback"in e&&(this._requestVideoFrameCallbackId=e.requestVideoFrameCallback(u))}clone(){return new this.constructor(this.image).copy(this)}update(){let e=this.image;"requestVideoFrameCallback"in e===!1&&e.readyState>=e.HAVE_CURRENT_DATA&&(this.needsUpdate=!0)}dispose(){this._requestVideoFrameCallbackId!==0&&(this.source.data.cancelVideoFrameCallback(this._requestVideoFrameCallbackId),this._requestVideoFrameCallbackId=0),super.dispose()}};var Pl=class extends Is{constructor(e,t,i,r,n,s,a,l){super({},e,t,i,r,n,s,a,l),this.isVideoFrameTexture=!0}update(){}clone(){return new this.constructor().copy(this)}setFrame(e){this.image=e,this.needsUpdate=!0}};var Ll=class extends ne{constructor(e,t){super({width:e,height:t}),this.isFramebufferTexture=!0,this.magFilter=me,this.minFilter=me,this.generateMipmaps=!1,this.needsUpdate=!0}};var Ai=class extends ne{constructor(e,t,i,r,n,s,a,l,c,h,u,d){super(null,s,a,l,c,h,r,n,u,d),this.isCompressedTexture=!0,this.image={width:t,height:i},this.mipmaps=e,this.flipY=!1,this.generateMipmaps=!1}};var Nl=class extends Ai{constructor(e,t,i,r,n,s){super(e,t,i,n,s),this.isCompressedArrayTexture=!0,this.image.depth=r,this.wrapR=Be,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var Dl=class extends Ai{constructor(e,t,i){super(void 0,e[0].width,e[0].height,t,i,At),this.isCompressedCubeTexture=!0,this.isCubeTexture=!0,this.image=e}};var Ti=class extends ne{constructor(e=[],t=At,i,r,n,s,a,l,c,h){super(e,t,i,r,n,s,a,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}};var Bl=class extends ne{constructor(e,t,i,r,n,s,a,l,c){super(e,t,i,r,n,s,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}};var Fl=class extends ne{constructor(e,t,i,r,n,s,a,l,c){super(e,t,i,r,n,s,a,l,c),this.isHTMLTexture=!0,this.generateMipmaps=!1,this.needsUpdate=!0;let h=e?e.parentNode:null;h!==null&&"requestPaint"in h&&(h.onpaint=()=>{this.needsUpdate=!0},h.requestPaint())}dispose(){let e=this.image?this.image.parentNode:null;e!==null&&"onpaint"in e&&(e.onpaint=null),super.dispose()}};var Rs=class extends ne{constructor(e,t,i=oi,r,n,s,a=me,l=me,c,h=er,u=1){if(h!==er&&h!==Vo)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let d={width:e,height:t,depth:u};super(d,r,n,s,a,l,h,i,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new ut(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}};var Ol=class extends Rs{constructor(e,t=oi,i=At,r,n,s=me,a=me,l,c=er){let h={width:e,height:e,depth:1},u=[h,h,h,h,h,h];super(e,e,t,i,r,n,s,a,l,c),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}};var Ul=class extends ne{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}};var oc={};Ah(oc,{BoxGeometry:()=>Ci,CapsuleGeometry:()=>zl,CircleGeometry:()=>kl,ConeGeometry:()=>Ls,CylinderGeometry:()=>Ps,DodecahedronGeometry:()=>Vl,EdgesGeometry:()=>ql,ExtrudeGeometry:()=>Jl,IcosahedronGeometry:()=>Kl,LatheGeometry:()=>jl,OctahedronGeometry:()=>Bs,PlaneGeometry:()=>$l,PolyhedronGeometry:()=>Qt,RingGeometry:()=>Ql,ShapeGeometry:()=>ec,SphereGeometry:()=>Fs,TetrahedronGeometry:()=>tc,TorusGeometry:()=>ic,TorusKnotGeometry:()=>rc,TubeGeometry:()=>nc,WireframeGeometry:()=>sc});var Ci=class o extends D{constructor(e=1,t=1,i=1,r=1,n=1,s=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:n,depthSegments:s};let a=this;r=Math.floor(r),n=Math.floor(n),s=Math.floor(s);let l=[],c=[],h=[],u=[],d=0,f=0;p("z","y","x",-1,-1,i,t,e,s,n,0),p("z","y","x",1,-1,i,t,-e,s,n,1),p("x","z","y",1,1,e,i,t,r,s,2),p("x","z","y",1,-1,e,i,-t,r,s,3),p("x","y","z",1,-1,e,t,i,r,n,4),p("x","y","z",-1,-1,e,t,-i,r,n,5),this.setIndex(l),this.setAttribute("position",new R(c,3)),this.setAttribute("normal",new R(h,3)),this.setAttribute("uv",new R(u,2));function p(m,_,g,x,y,v,M,A,T,S,b){let C=v/T,I=M/S,B=v/2,N=M/2,k=A/2,V=T+1,J=S+1,Q=0,Me=0,he=new w;for(let ue=0;ue<J;ue++){let de=ue*I-N;for(let Ie=0;Ie<V;Ie++){let He=Ie*C-B;he[m]=He*x,he[_]=de*y,he[g]=k,c.push(he.x,he.y,he.z),he[m]=0,he[_]=0,he[g]=A>0?1:-1,h.push(he.x,he.y,he.z),u.push(Ie/T),u.push(1-ue/S),Q+=1}}for(let ue=0;ue<S;ue++)for(let de=0;de<T;de++){let Ie=d+de+V*ue,He=d+de+V*(ue+1),Ke=d+(de+1)+V*(ue+1),lt=d+(de+1)+V*ue;l.push(Ie,He,lt),l.push(He,Ke,lt),Me+=6}a.addGroup(f,Me,b),f+=Me,d+=Q}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new o(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};var zl=class o extends D{constructor(e=1,t=1,i=4,r=8,n=1){super(),this.type="CapsuleGeometry",this.parameters={radius:e,height:t,capSegments:i,radialSegments:r,heightSegments:n},t=Math.max(0,t),i=Math.max(1,Math.floor(i)),r=Math.max(3,Math.floor(r)),n=Math.max(1,Math.floor(n));let s=[],a=[],l=[],c=[],h=t/2,u=Math.PI/2*e,d=t,f=2*u+d,p=i*2+n,m=r+1,_=new w,g=new w;for(let x=0;x<=p;x++){let y=0,v=0,M=0,A=0;if(x<=i){let b=x/i,C=b*Math.PI/2;v=-h-e*Math.cos(C),M=e*Math.sin(C),A=-e*Math.cos(C),y=b*u}else if(x<=i+n){let b=(x-i)/n;v=-h+b*t,M=e,A=0,y=u+b*d}else{let b=(x-i-n)/i,C=b*Math.PI/2;v=h+e*Math.sin(C),M=e*Math.cos(C),A=e*Math.sin(C),y=u+d+b*u}let T=Math.max(0,Math.min(1,y/f)),S=0;x===0?S=.5/r:x===p&&(S=-.5/r);for(let b=0;b<=r;b++){let C=b/r,I=C*Math.PI*2,B=Math.sin(I),N=Math.cos(I);g.x=-M*N,g.y=v,g.z=M*B,a.push(g.x,g.y,g.z),_.set(-M*N,A,M*B),_.normalize(),l.push(_.x,_.y,_.z),c.push(C+S,T)}if(x>0){let b=(x-1)*m;for(let C=0;C<r;C++){let I=b+C,B=b+C+1,N=x*m+C,k=x*m+C+1;s.push(I,B,N),s.push(B,k,N)}}}this.setIndex(s),this.setAttribute("position",new R(a,3)),this.setAttribute("normal",new R(l,3)),this.setAttribute("uv",new R(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new o(e.radius,e.height,e.capSegments,e.radialSegments,e.heightSegments)}};var kl=class o extends D{constructor(e=1,t=32,i=0,r=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:i,thetaLength:r},t=Math.max(3,t);let n=[],s=[],a=[],l=[],c=new w,h=new E;s.push(0,0,0),a.push(0,0,1),l.push(.5,.5);for(let u=0,d=3;u<=t;u++,d+=3){let f=i+u/t*r;c.x=e*Math.cos(f),c.y=e*Math.sin(f),s.push(c.x,c.y,c.z),a.push(0,0,1),h.x=(s[d]/e+1)/2,h.y=(s[d+1]/e+1)/2,l.push(h.x,h.y)}for(let u=1;u<=t;u++)n.push(u,u+1,0);this.setIndex(n),this.setAttribute("position",new R(s,3)),this.setAttribute("normal",new R(a,3)),this.setAttribute("uv",new R(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new o(e.radius,e.segments,e.thetaStart,e.thetaLength)}};var Ps=class o extends D{constructor(e=1,t=1,i=1,r=32,n=1,s=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:r,heightSegments:n,openEnded:s,thetaStart:a,thetaLength:l};let c=this;r=Math.floor(r),n=Math.floor(n);let h=[],u=[],d=[],f=[],p=0,m=[],_=i/2,g=0;x(),s===!1&&(e>0&&y(!0),t>0&&y(!1)),this.setIndex(h),this.setAttribute("position",new R(u,3)),this.setAttribute("normal",new R(d,3)),this.setAttribute("uv",new R(f,2));function x(){let v=new w,M=new w,A=0,T=(t-e)/i;for(let S=0;S<=n;S++){let b=[],C=S/n,I=C*(t-e)+e;for(let B=0;B<=r;B++){let N=B/r,k=N*l+a,V=Math.sin(k),J=Math.cos(k);M.x=I*V,M.y=-C*i+_,M.z=I*J,u.push(M.x,M.y,M.z),v.set(V,T,J).normalize(),d.push(v.x,v.y,v.z),f.push(N,1-C),b.push(p++)}m.push(b)}for(let S=0;S<r;S++)for(let b=0;b<n;b++){let C=m[b][S],I=m[b+1][S],B=m[b+1][S+1],N=m[b][S+1];(e>0||b!==0)&&(h.push(C,I,N),A+=3),(t>0||b!==n-1)&&(h.push(I,B,N),A+=3)}c.addGroup(g,A,0),g+=A}function y(v){let M=p,A=new E,T=new w,S=0,b=v===!0?e:t,C=v===!0?1:-1;for(let B=1;B<=r;B++)u.push(0,_*C,0),d.push(0,C,0),f.push(.5,.5),p++;let I=p;for(let B=0;B<=r;B++){let k=B/r*l+a,V=Math.cos(k),J=Math.sin(k);T.x=b*J,T.y=_*C,T.z=b*V,u.push(T.x,T.y,T.z),d.push(0,C,0),A.x=V*.5+.5,A.y=J*.5*C+.5,f.push(A.x,A.y),p++}for(let B=0;B<r;B++){let N=M+B,k=I+B;v===!0?h.push(k,k+1,N):h.push(k+1,k,N),S+=3}c.addGroup(g,S,v===!0?1:2),g+=S}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new o(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}};var Ls=class o extends Ps{constructor(e=1,t=1,i=32,r=1,n=!1,s=0,a=Math.PI*2){super(0,e,t,i,r,n,s,a),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:i,heightSegments:r,openEnded:n,thetaStart:s,thetaLength:a}}static fromJSON(e){return new o(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}};var Qt=class o extends D{constructor(e=[],t=[],i=1,r=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:i,detail:r};let n=[],s=[];a(r),c(i),h(),this.setAttribute("position",new R(n,3)),this.setAttribute("normal",new R(n.slice(),3)),this.setAttribute("uv",new R(s,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function a(x){let y=new w,v=new w,M=new w;for(let A=0;A<t.length;A+=3)f(t[A+0],y),f(t[A+1],v),f(t[A+2],M),l(y,v,M,x)}function l(x,y,v,M){let A=M+1,T=[];for(let S=0;S<=A;S++){T[S]=[];let b=x.clone().lerp(v,S/A),C=y.clone().lerp(v,S/A),I=A-S;for(let B=0;B<=I;B++)B===0&&S===A?T[S][B]=b:T[S][B]=b.clone().lerp(C,B/I)}for(let S=0;S<A;S++)for(let b=0;b<2*(A-S)-1;b++){let C=Math.floor(b/2);b%2===0?(d(T[S][C+1]),d(T[S+1][C]),d(T[S][C])):(d(T[S][C+1]),d(T[S+1][C+1]),d(T[S+1][C]))}}function c(x){let y=new w;for(let v=0;v<n.length;v+=3)y.x=n[v+0],y.y=n[v+1],y.z=n[v+2],y.normalize().multiplyScalar(x),n[v+0]=y.x,n[v+1]=y.y,n[v+2]=y.z}function h(){let x=new w;for(let y=0;y<n.length;y+=3){x.x=n[y+0],x.y=n[y+1],x.z=n[y+2];let v=_(x)/2/Math.PI+.5,M=g(x)/Math.PI+.5;s.push(v,1-M)}p(),u()}function u(){for(let x=0;x<s.length;x+=6){let y=s[x+0],v=s[x+2],M=s[x+4],A=Math.max(y,v,M),T=Math.min(y,v,M);A>.9&&T<.1&&(y<.2&&(s[x+0]+=1),v<.2&&(s[x+2]+=1),M<.2&&(s[x+4]+=1))}}function d(x){n.push(x.x,x.y,x.z)}function f(x,y){let v=x*3;y.x=e[v+0],y.y=e[v+1],y.z=e[v+2]}function p(){let x=new w,y=new w,v=new w,M=new w,A=new E,T=new E,S=new E;for(let b=0,C=0;b<n.length;b+=9,C+=6){x.set(n[b+0],n[b+1],n[b+2]),y.set(n[b+3],n[b+4],n[b+5]),v.set(n[b+6],n[b+7],n[b+8]),A.set(s[C+0],s[C+1]),T.set(s[C+2],s[C+3]),S.set(s[C+4],s[C+5]),M.copy(x).add(y).add(v).divideScalar(3);let I=_(M);m(A,C+0,x,I),m(T,C+2,y,I),m(S,C+4,v,I)}}function m(x,y,v,M){M<0&&x.x===1&&(s[y]=x.x-1),v.x===0&&v.z===0&&(s[y]=M/2/Math.PI+.5)}function _(x){return Math.atan2(x.z,-x.x)}function g(x){return Math.atan2(-x.y,Math.sqrt(x.x*x.x+x.z*x.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new o(e.vertices,e.indices,e.radius,e.detail)}};var Vl=class o extends Qt{constructor(e=1,t=0){let i=(1+Math.sqrt(5))/2,r=1/i,n=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-r,-i,0,-r,i,0,r,-i,0,r,i,-r,-i,0,-r,i,0,r,-i,0,r,i,0,-i,0,-r,i,0,-r,-i,0,r,i,0,r],s=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(n,s,e,t),this.type="DodecahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new o(e.radius,e.detail)}};var Gl=new w,Hl=new w,Lu=new w,Wl=new Ct,ql=class extends D{constructor(e=null,t=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:e,thresholdAngle:t},e!==null){let r=Math.pow(10,4),n=Math.cos(Mi*t),s=e.getIndex(),a=e.getAttribute("position"),l=s?s.count:a.count,c=[0,0,0],h=["a","b","c"],u=new Array(3),d={},f=[];for(let p=0;p<l;p+=3){s?(c[0]=s.getX(p),c[1]=s.getX(p+1),c[2]=s.getX(p+2)):(c[0]=p,c[1]=p+1,c[2]=p+2);let{a:m,b:_,c:g}=Wl;if(m.fromBufferAttribute(a,c[0]),_.fromBufferAttribute(a,c[1]),g.fromBufferAttribute(a,c[2]),Wl.getNormal(Lu),u[0]=`${Math.round(m.x*r)},${Math.round(m.y*r)},${Math.round(m.z*r)}`,u[1]=`${Math.round(_.x*r)},${Math.round(_.y*r)},${Math.round(_.z*r)}`,u[2]=`${Math.round(g.x*r)},${Math.round(g.y*r)},${Math.round(g.z*r)}`,!(u[0]===u[1]||u[1]===u[2]||u[2]===u[0]))for(let x=0;x<3;x++){let y=(x+1)%3,v=u[x],M=u[y],A=Wl[h[x]],T=Wl[h[y]],S=`${v}_${M}`,b=`${M}_${v}`;b in d&&d[b]?(Lu.dot(d[b].normal)<=n&&(f.push(A.x,A.y,A.z),f.push(T.x,T.y,T.z)),d[b]=null):S in d||(d[S]={index0:c[x],index1:c[y],normal:Lu.clone()})}}for(let p in d)if(d[p]){let{index0:m,index1:_}=d[p];Gl.fromBufferAttribute(a,m),Hl.fromBufferAttribute(a,_),f.push(Gl.x,Gl.y,Gl.z),f.push(Hl.x,Hl.y,Hl.z)}this.setAttribute("position",new R(f,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}};var _r={};Ah(_r,{ArcCurve:()=>ha,CatmullRomCurve3:()=>ua,CubicBezierCurve:()=>$r,CubicBezierCurve3:()=>da,EllipseCurve:()=>Zi,LineCurve:()=>Qr,LineCurve3:()=>fa,QuadraticBezierCurve:()=>en,QuadraticBezierCurve3:()=>tn,SplineCurve:()=>rn});var Ee=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){O("Curve: .getPoint() not implemented.")}getPointAt(e,t){let i=this.getUtoTmapping(e);return this.getPoint(i,t)}getPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return t}getSpacedPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPointAt(i/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],i,r=this.getPoint(0),n=0;t.push(0);for(let s=1;s<=e;s++)i=this.getPoint(s/e),n+=i.distanceTo(r),t.push(n),r=i;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let i=this.getLengths(),r=0,n=i.length,s;t?s=t:s=e*i[n-1];let a=0,l=n-1,c;for(;a<=l;)if(r=Math.floor(a+(l-a)/2),c=i[r]-s,c<0)a=r+1;else if(c>0)l=r-1;else{l=r;break}if(r=l,i[r]===s)return r/(n-1);let h=i[r],d=i[r+1]-h,f=(s-h)/d;return(r+f)/(n-1)}getTangent(e,t){let r=e-1e-4,n=e+1e-4;r<0&&(r=0),n>1&&(n=1);let s=this.getPoint(r),a=this.getPoint(n),l=t||(s.isVector2?new E:new w);return l.copy(a).sub(s).normalize(),l}getTangentAt(e,t){let i=this.getUtoTmapping(e);return this.getTangent(i,t)}computeFrenetFrames(e,t=!1){let i=new w,r=[],n=[],s=[],a=new w,l=new z;for(let f=0;f<=e;f++){let p=f/e;r[f]=this.getTangentAt(p,new w)}n[0]=new w,s[0]=new w;let c=Number.MAX_VALUE,h=Math.abs(r[0].x),u=Math.abs(r[0].y),d=Math.abs(r[0].z);h<=c&&(c=h,i.set(1,0,0)),u<=c&&(c=u,i.set(0,1,0)),d<=c&&i.set(0,0,1),a.crossVectors(r[0],i).normalize(),n[0].crossVectors(r[0],a),s[0].crossVectors(r[0],n[0]);for(let f=1;f<=e;f++){if(n[f]=n[f-1].clone(),s[f]=s[f-1].clone(),a.crossVectors(r[f-1],r[f]),a.length()>Number.EPSILON){a.normalize();let p=Math.acos(W(r[f-1].dot(r[f]),-1,1));n[f].applyMatrix4(l.makeRotationAxis(a,p))}s[f].crossVectors(r[f],n[f])}if(t===!0){let f=Math.acos(W(n[0].dot(n[e]),-1,1));f/=e,r[0].dot(a.crossVectors(n[0],n[e]))>0&&(f=-f);for(let p=1;p<=e;p++)n[p].applyMatrix4(l.makeRotationAxis(r[p],f*p)),s[p].crossVectors(r[p],n[p])}return{tangents:r,normals:n,binormals:s}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}};var Zi=class extends Ee{constructor(e=0,t=0,i=1,r=1,n=0,s=Math.PI*2,a=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=i,this.yRadius=r,this.aStartAngle=n,this.aEndAngle=s,this.aClockwise=a,this.aRotation=l}getPoint(e,t=new E){let i=t,r=Math.PI*2,n=this.aEndAngle-this.aStartAngle,s=Math.abs(n)<Number.EPSILON;for(;n<0;)n+=r;for(;n>r;)n-=r;n<Number.EPSILON&&(s?n=0:n=r),this.aClockwise===!0&&!s&&(n===r?n=-r:n=n-r);let a=this.aStartAngle+e*n,l=this.aX+this.xRadius*Math.cos(a),c=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){let h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),d=l-this.aX,f=c-this.aY;l=d*h-f*u+this.aX,c=d*u+f*h+this.aY}return i.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}};var ha=class extends Zi{constructor(e,t,i,r,n,s){super(e,t,i,i,r,n,s),this.isArcCurve=!0,this.type="ArcCurve"}};function Fu(){let o=0,e=0,t=0,i=0;function r(n,s,a,l){o=n,e=a,t=-3*n+3*s-2*a-l,i=2*n-2*s+a+l}return{initCatmullRom:function(n,s,a,l,c){r(s,a,c*(a-n),c*(l-s))},initNonuniformCatmullRom:function(n,s,a,l,c,h,u){let d=(s-n)/c-(a-n)/(c+h)+(a-s)/h,f=(a-s)/h-(l-s)/(h+u)+(l-a)/u;d*=h,f*=h,r(s,a,d,f)},calc:function(n){let s=n*n,a=s*n;return o+e*n+t*s+i*a}}}var Qf=new w,ep=new w,Nu=new Fu,Du=new Fu,Bu=new Fu,ua=class extends Ee{constructor(e=[],t=!1,i="centripetal",r=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=i,this.tension=r}getPoint(e,t=new w){let i=t,r=this.points,n=r.length,s=(n-(this.closed?0:1))*e,a=Math.floor(s),l=s-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/n)+1)*n:l===0&&a===n-1&&(a=n-2,l=1);let c,h;this.closed||a>0?c=r[(a-1)%n]:(ep.subVectors(r[0],r[1]).add(r[0]),c=ep);let u=r[a%n],d=r[(a+1)%n];if(this.closed||a+2<n?h=r[(a+2)%n]:(Qf.subVectors(r[n-1],r[n-2]).add(r[n-1]),h=Qf),this.curveType==="centripetal"||this.curveType==="chordal"){let f=this.curveType==="chordal"?.5:.25,p=Math.pow(c.distanceToSquared(u),f),m=Math.pow(u.distanceToSquared(d),f),_=Math.pow(d.distanceToSquared(h),f);m<1e-4&&(m=1),p<1e-4&&(p=m),_<1e-4&&(_=m),Nu.initNonuniformCatmullRom(c.x,u.x,d.x,h.x,p,m,_),Du.initNonuniformCatmullRom(c.y,u.y,d.y,h.y,p,m,_),Bu.initNonuniformCatmullRom(c.z,u.z,d.z,h.z,p,m,_)}else this.curveType==="catmullrom"&&(Nu.initCatmullRom(c.x,u.x,d.x,h.x,this.tension),Du.initCatmullRom(c.y,u.y,d.y,h.y,this.tension),Bu.initCatmullRom(c.z,u.z,d.z,h.z,this.tension));return i.set(Nu.calc(l),Du.calc(l),Bu.calc(l)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(r.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let r=this.points[t];e.points.push(r.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(new w().fromArray(r))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function Ou(o,e,t,i,r){let n=(i-e)*.5,s=(r-t)*.5,a=o*o,l=o*a;return(2*t-2*i+n+s)*l+(-3*t+3*i-2*n-s)*a+n*o+t}function ky(o,e){let t=1-o;return t*t*e}function Vy(o,e){return 2*(1-o)*o*e}function Gy(o,e){return o*o*e}function Kr(o,e,t,i){return ky(o,e)+Vy(o,t)+Gy(o,i)}function Hy(o,e){let t=1-o;return t*t*t*e}function Wy(o,e){let t=1-o;return 3*t*t*o*e}function qy(o,e){return 3*(1-o)*o*o*e}function Xy(o,e){return o*o*o*e}function jr(o,e,t,i,r){return Hy(o,e)+Wy(o,t)+qy(o,i)+Xy(o,r)}var $r=class extends Ee{constructor(e=new E,t=new E,i=new E,r=new E){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=i,this.v3=r}getPoint(e,t=new E){let i=t,r=this.v0,n=this.v1,s=this.v2,a=this.v3;return i.set(jr(e,r.x,n.x,s.x,a.x),jr(e,r.y,n.y,s.y,a.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}};var da=class extends Ee{constructor(e=new w,t=new w,i=new w,r=new w){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=i,this.v3=r}getPoint(e,t=new w){let i=t,r=this.v0,n=this.v1,s=this.v2,a=this.v3;return i.set(jr(e,r.x,n.x,s.x,a.x),jr(e,r.y,n.y,s.y,a.y),jr(e,r.z,n.z,s.z,a.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}};var Qr=class extends Ee{constructor(e=new E,t=new E){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new E){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new E){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}};var fa=class extends Ee{constructor(e=new w,t=new w){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new w){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new w){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}};var en=class extends Ee{constructor(e=new E,t=new E,i=new E){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new E){let i=t,r=this.v0,n=this.v1,s=this.v2;return i.set(Kr(e,r.x,n.x,s.x),Kr(e,r.y,n.y,s.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}};var tn=class extends Ee{constructor(e=new w,t=new w,i=new w){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new w){let i=t,r=this.v0,n=this.v1,s=this.v2;return i.set(Kr(e,r.x,n.x,s.x),Kr(e,r.y,n.y,s.y),Kr(e,r.z,n.z,s.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}};var rn=class extends Ee{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new E){let i=t,r=this.points,n=(r.length-1)*e,s=Math.floor(n),a=n-s,l=r[s===0?s:s-1],c=r[s],h=r[s>r.length-2?r.length-1:s+1],u=r[s>r.length-3?r.length-1:s+2];return i.set(Ou(a,l.x,c.x,h.x,u.x),Ou(a,l.y,c.y,h.y,u.y)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(r.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let r=this.points[t];e.points.push(r.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(new E().fromArray(r))}return this}};var Ns=class extends Ee{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let i=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new _r[i](t,e))}return this}getPoint(e,t){let i=e*this.getLength(),r=this.getCurveLengths(),n=0;for(;n<r.length;){if(r[n]>=i){let s=r[n]-i,a=this.curves[n],l=a.getLength(),c=l===0?0:1-s/l;return a.getPointAt(c,t)}n++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let i=0,r=this.curves.length;i<r;i++)t+=this.curves[i].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],i;for(let r=0,n=this.curves;r<n.length;r++){let s=n[r],a=s.isEllipseCurve?e*2:s.isLineCurve||s.isLineCurve3?1:s.isSplineCurve?e*s.points.length:e,l=s.getPoints(a);for(let c=0;c<l.length;c++){let h=l[c];i&&i.equals(h)||(t.push(h),i=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let r=e.curves[t];this.curves.push(r.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,i=this.curves.length;t<i;t++){let r=this.curves[t];e.curves.push(r.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let r=e.curves[t];this.curves.push(new _r[r.type]().fromJSON(r))}return this}};var Ei=class extends Ns{constructor(e){super(),this.type="Path",this.currentPoint=new E,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,i=e.length;t<i;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let i=new Qr(this.currentPoint.clone(),new E(e,t));return this.curves.push(i),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,i,r){let n=new en(this.currentPoint.clone(),new E(e,t),new E(i,r));return this.curves.push(n),this.currentPoint.set(i,r),this}bezierCurveTo(e,t,i,r,n,s){let a=new $r(this.currentPoint.clone(),new E(e,t),new E(i,r),new E(n,s));return this.curves.push(a),this.currentPoint.set(n,s),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),i=new rn(t);return this.curves.push(i),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,i,r,n,s){let a=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+a,t+l,i,r,n,s),this}absarc(e,t,i,r,n,s){return this.absellipse(e,t,i,i,r,n,s),this}ellipse(e,t,i,r,n,s,a,l){let c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+c,t+h,i,r,n,s,a,l),this}absellipse(e,t,i,r,n,s,a,l){let c=new Zi(e,t,i,r,n,s,a,l);if(this.curves.length>0){let u=c.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(c);let h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}};var ei=class extends Ei{constructor(e){super(e),this.uuid=Pe(),this.type="Shape",this.holes=[]}getPointsHoles(e){let t=[];for(let i=0,r=this.holes.length;i<r;i++)t[i]=this.holes[i].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let r=e.holes[t];this.holes.push(r.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,i=this.holes.length;t<i;t++){let r=this.holes[t];e.holes.push(r.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let r=e.holes[t];this.holes.push(new Ei().fromJSON(r))}return this}};function ku(o,e,t=2){let i=e&&e.length,r=i?e[0]*t:o.length,n=ip(o,0,r,t,!0),s=[];if(!n||n.next===n.prev)return s;let a,l,c;if(i&&(n=jy(o,e,n,t)),o.length>80*t){a=o[0],l=o[1];let h=a,u=l;for(let d=t;d<r;d+=t){let f=o[d],p=o[d+1];f<a&&(a=f),p<l&&(l=p),f>h&&(h=f),p>u&&(u=p)}c=Math.max(h-a,u-l),c=c!==0?32767/c:0}return ma(n,s,t,a,l,c,0),s}function ip(o,e,t,i,r){let n;if(r===lv(o,e,t,i)>0)for(let s=e;s<t;s+=i)n=tp(s/i|0,o[s],o[s+1],n);else for(let s=t-i;s>=e;s-=i)n=tp(s/i|0,o[s],o[s+1],n);return n&&Ds(n,n.next)&&(_a(n),n=n.next),n}function nn(o,e){if(!o)return o;e||(e=o);let t=o,i;do if(i=!1,!t.steiner&&(Ds(t,t.next)||Ne(t.prev,t,t.next)===0)){if(_a(t),t=e=t.prev,t===t.next)break;i=!0}else t=t.next;while(i||t!==e);return e}function ma(o,e,t,i,r,n,s){if(!o)return;!s&&n&&iv(o,i,r,n);let a=o;for(;o.prev!==o.next;){let l=o.prev,c=o.next;if(n?Zy(o,i,r,n):Yy(o)){e.push(l.i,o.i,c.i),_a(o),o=c.next,a=c.next;continue}if(o=c,o===a){s?s===1?(o=Jy(nn(o),e),ma(o,e,t,i,r,n,2)):s===2&&Ky(o,e,t,i,r,n):ma(nn(o),e,t,i,r,n,1);break}}}function Yy(o){let e=o.prev,t=o,i=o.next;if(Ne(e,t,i)>=0)return!1;let r=e.x,n=t.x,s=i.x,a=e.y,l=t.y,c=i.y,h=Math.min(r,n,s),u=Math.min(a,l,c),d=Math.max(r,n,s),f=Math.max(a,l,c),p=i.next;for(;p!==e;){if(p.x>=h&&p.x<=d&&p.y>=u&&p.y<=f&&pa(r,a,n,l,s,c,p.x,p.y)&&Ne(p.prev,p,p.next)>=0)return!1;p=p.next}return!0}function Zy(o,e,t,i){let r=o.prev,n=o,s=o.next;if(Ne(r,n,s)>=0)return!1;let a=r.x,l=n.x,c=s.x,h=r.y,u=n.y,d=s.y,f=Math.min(a,l,c),p=Math.min(h,u,d),m=Math.max(a,l,c),_=Math.max(h,u,d),g=Uu(f,p,e,t,i),x=Uu(m,_,e,t,i),y=o.prevZ,v=o.nextZ;for(;y&&y.z>=g&&v&&v.z<=x;){if(y.x>=f&&y.x<=m&&y.y>=p&&y.y<=_&&y!==r&&y!==s&&pa(a,h,l,u,c,d,y.x,y.y)&&Ne(y.prev,y,y.next)>=0||(y=y.prevZ,v.x>=f&&v.x<=m&&v.y>=p&&v.y<=_&&v!==r&&v!==s&&pa(a,h,l,u,c,d,v.x,v.y)&&Ne(v.prev,v,v.next)>=0))return!1;v=v.nextZ}for(;y&&y.z>=g;){if(y.x>=f&&y.x<=m&&y.y>=p&&y.y<=_&&y!==r&&y!==s&&pa(a,h,l,u,c,d,y.x,y.y)&&Ne(y.prev,y,y.next)>=0)return!1;y=y.prevZ}for(;v&&v.z<=x;){if(v.x>=f&&v.x<=m&&v.y>=p&&v.y<=_&&v!==r&&v!==s&&pa(a,h,l,u,c,d,v.x,v.y)&&Ne(v.prev,v,v.next)>=0)return!1;v=v.nextZ}return!0}function Jy(o,e){let t=o;do{let i=t.prev,r=t.next.next;!Ds(i,r)&&np(i,t,t.next,r)&&ga(i,r)&&ga(r,i)&&(e.push(i.i,t.i,r.i),_a(t),_a(t.next),t=o=r),t=t.next}while(t!==o);return nn(t)}function Ky(o,e,t,i,r,n){let s=o;do{let a=s.next.next;for(;a!==s.prev;){if(s.i!==a.i&&sv(s,a)){let l=sp(s,a);s=nn(s,s.next),l=nn(l,l.next),ma(s,e,t,i,r,n,0),ma(l,e,t,i,r,n,0);return}a=a.next}s=s.next}while(s!==o)}function jy(o,e,t,i){let r=[];for(let n=0,s=e.length;n<s;n++){let a=e[n]*i,l=n<s-1?e[n+1]*i:o.length,c=ip(o,a,l,i,!1);c===c.next&&(c.steiner=!0),r.push(nv(c))}r.sort($y);for(let n=0;n<r.length;n++)t=Qy(r[n],t);return t}function $y(o,e){let t=o.x-e.x;if(t===0&&(t=o.y-e.y,t===0)){let i=(o.next.y-o.y)/(o.next.x-o.x),r=(e.next.y-e.y)/(e.next.x-e.x);t=i-r}return t}function Qy(o,e){let t=ev(o,e);if(!t)return e;let i=sp(t,o);return nn(i,i.next),nn(t,t.next)}function ev(o,e){let t=e,i=o.x,r=o.y,n=-1/0,s;if(Ds(o,t))return t;do{if(Ds(o,t.next))return t.next;if(r<=t.y&&r>=t.next.y&&t.next.y!==t.y){let u=t.x+(r-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(u<=i&&u>n&&(n=u,s=t.x<t.next.x?t:t.next,u===i))return s}t=t.next}while(t!==e);if(!s)return null;let a=s,l=s.x,c=s.y,h=1/0;t=s;do{if(i>=t.x&&t.x>=l&&i!==t.x&&rp(r<c?i:n,r,l,c,r<c?n:i,r,t.x,t.y)){let u=Math.abs(r-t.y)/(i-t.x);ga(t,o)&&(u<h||u===h&&(t.x>s.x||t.x===s.x&&tv(s,t)))&&(s=t,h=u)}t=t.next}while(t!==a);return s}function tv(o,e){return Ne(o.prev,o,e.prev)<0&&Ne(e.next,o,o.next)<0}function iv(o,e,t,i){let r=o;do r.z===0&&(r.z=Uu(r.x,r.y,e,t,i)),r.prevZ=r.prev,r.nextZ=r.next,r=r.next;while(r!==o);r.prevZ.nextZ=null,r.prevZ=null,rv(r)}function rv(o){let e,t=1;do{let i=o,r;o=null;let n=null;for(e=0;i;){e++;let s=i,a=0;for(let c=0;c<t&&(a++,s=s.nextZ,!!s);c++);let l=t;for(;a>0||l>0&&s;)a!==0&&(l===0||!s||i.z<=s.z)?(r=i,i=i.nextZ,a--):(r=s,s=s.nextZ,l--),n?n.nextZ=r:o=r,r.prevZ=n,n=r;i=s}n.nextZ=null,t*=2}while(e>1);return o}function Uu(o,e,t,i,r){return o=(o-t)*r|0,e=(e-i)*r|0,o=(o|o<<8)&16711935,o=(o|o<<4)&252645135,o=(o|o<<2)&858993459,o=(o|o<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,o|e<<1}function nv(o){let e=o,t=o;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==o);return t}function rp(o,e,t,i,r,n,s,a){return(r-s)*(e-a)>=(o-s)*(n-a)&&(o-s)*(i-a)>=(t-s)*(e-a)&&(t-s)*(n-a)>=(r-s)*(i-a)}function pa(o,e,t,i,r,n,s,a){return!(o===s&&e===a)&&rp(o,e,t,i,r,n,s,a)}function sv(o,e){return o.next.i!==e.i&&o.prev.i!==e.i&&!ov(o,e)&&(ga(o,e)&&ga(e,o)&&av(o,e)&&(Ne(o.prev,o,e.prev)||Ne(o,e.prev,e))||Ds(o,e)&&Ne(o.prev,o,o.next)>0&&Ne(e.prev,e,e.next)>0)}function Ne(o,e,t){return(e.y-o.y)*(t.x-e.x)-(e.x-o.x)*(t.y-e.y)}function Ds(o,e){return o.x===e.x&&o.y===e.y}function np(o,e,t,i){let r=Yl(Ne(o,e,t)),n=Yl(Ne(o,e,i)),s=Yl(Ne(t,i,o)),a=Yl(Ne(t,i,e));return!!(r!==n&&s!==a||r===0&&Xl(o,t,e)||n===0&&Xl(o,i,e)||s===0&&Xl(t,o,i)||a===0&&Xl(t,e,i))}function Xl(o,e,t){return e.x<=Math.max(o.x,t.x)&&e.x>=Math.min(o.x,t.x)&&e.y<=Math.max(o.y,t.y)&&e.y>=Math.min(o.y,t.y)}function Yl(o){return o>0?1:o<0?-1:0}function ov(o,e){let t=o;do{if(t.i!==o.i&&t.next.i!==o.i&&t.i!==e.i&&t.next.i!==e.i&&np(t,t.next,o,e))return!0;t=t.next}while(t!==o);return!1}function ga(o,e){return Ne(o.prev,o,o.next)<0?Ne(o,e,o.next)>=0&&Ne(o,o.prev,e)>=0:Ne(o,e,o.prev)<0||Ne(o,o.next,e)<0}function av(o,e){let t=o,i=!1,r=(o.x+e.x)/2,n=(o.y+e.y)/2;do t.y>n!=t.next.y>n&&t.next.y!==t.y&&r<(t.next.x-t.x)*(n-t.y)/(t.next.y-t.y)+t.x&&(i=!i),t=t.next;while(t!==o);return i}function sp(o,e){let t=zu(o.i,o.x,o.y),i=zu(e.i,e.x,e.y),r=o.next,n=e.prev;return o.next=e,e.prev=o,t.next=r,r.prev=t,i.next=t,t.prev=i,n.next=i,i.prev=n,i}function tp(o,e,t,i){let r=zu(o,e,t);return i?(r.next=i.next,r.prev=i,i.next.prev=r,i.next=r):(r.prev=r,r.next=r),r}function _a(o){o.next.prev=o.prev,o.prev.next=o.next,o.prevZ&&(o.prevZ.nextZ=o.nextZ),o.nextZ&&(o.nextZ.prevZ=o.prevZ)}function zu(o,e,t){return{i:o,x:e,y:t,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function lv(o,e,t,i){let r=0;for(let n=e,s=t-i;n<t;n+=i)r+=(o[s]-o[n])*(o[n+1]+o[s+1]),s=n;return r}var Zl=class{static triangulate(e,t,i=2){return ku(e,t,i)}};var Mt=class o{static area(e){let t=e.length,i=0;for(let r=t-1,n=0;n<t;r=n++)i+=e[r].x*e[n].y-e[n].x*e[r].y;return i*.5}static isClockWise(e){return o.area(e)<0}static triangulateShape(e,t){let i=[],r=[],n=[];op(e),ap(i,e);let s=e.length;t.forEach(op);for(let l=0;l<t.length;l++)r.push(s),s+=t[l].length,ap(i,t[l]);let a=Zl.triangulate(i,r);for(let l=0;l<a.length;l+=3)n.push(a.slice(l,l+3));return n}};function op(o){let e=o.length;e>2&&o[e-1].equals(o[0])&&o.pop()}function ap(o,e){for(let t=0;t<e.length;t++)o.push(e[t].x),o.push(e[t].y)}var Jl=class o extends D{constructor(e=new ei([new E(.5,.5),new E(-.5,.5),new E(-.5,-.5),new E(.5,-.5)]),t={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:e,options:t},e=Array.isArray(e)?e:[e];let i=this,r=[],n=[];for(let a=0,l=e.length;a<l;a++){let c=e[a];s(c)}this.setAttribute("position",new R(r,3)),this.setAttribute("uv",new R(n,2)),this.computeVertexNormals();function s(a){let l=[],c=t.curveSegments!==void 0?t.curveSegments:12,h=t.steps!==void 0?t.steps:1,u=t.depth!==void 0?t.depth:1,d=t.bevelEnabled!==void 0?t.bevelEnabled:!0,f=t.bevelThickness!==void 0?t.bevelThickness:.2,p=t.bevelSize!==void 0?t.bevelSize:f-.1,m=t.bevelOffset!==void 0?t.bevelOffset:0,_=t.bevelSegments!==void 0?t.bevelSegments:3,g=t.extrudePath,x=t.UVGenerator!==void 0?t.UVGenerator:cv,y,v=!1,M,A,T,S;if(g){y=g.getSpacedPoints(h),v=!0,d=!1;let F=g.isCatmullRomCurve3?g.closed:!1;M=g.computeFrenetFrames(h,F),A=new w,T=new w,S=new w}d||(_=0,f=0,p=0,m=0);let b=a.extractPoints(c),C=b.shape,I=b.holes;if(!Mt.isClockWise(C)){C=C.reverse();for(let F=0,G=I.length;F<G;F++){let H=I[F];Mt.isClockWise(H)&&(I[F]=H.reverse())}}function N(F){let H=10000000000000001e-36,Y=F[0];for(let X=1;X<=F.length;X++){let fe=X%F.length,ee=F[fe],Se=ee.x-Y.x,Re=ee.y-Y.y,Ye=Se*Se+Re*Re,Dt=Math.max(Math.abs(ee.x),Math.abs(ee.y),Math.abs(Y.x),Math.abs(Y.y)),Ir=H*Dt*Dt;if(Ye<=Ir){F.splice(fe,1),X--;continue}Y=ee}}N(C),I.forEach(N);let k=I.length,V=C;for(let F=0;F<k;F++){let G=I[F];C=C.concat(G)}function J(F,G,H){return G||K("ExtrudeGeometry: vec does not exist"),F.clone().addScaledVector(G,H)}let Q=C.length;function Me(F,G,H){let Y,X,fe,ee=F.x-G.x,Se=F.y-G.y,Re=H.x-F.x,Ye=H.y-F.y,Dt=ee*ee+Se*Se,Ir=ee*Ye-Se*Re;if(Math.abs(Ir)>Number.EPSILON){let Bt=Math.sqrt(Dt),af=Math.sqrt(Re*Re+Ye*Ye),lf=G.x-Se/Bt,cf=G.y+ee/Bt,p0=H.x-Ye/af,m0=H.y+Re/af,hf=((p0-lf)*Ye-(m0-cf)*Re)/(ee*Ye-Se*Re);Y=lf+ee*hf-F.x,X=cf+Se*hf-F.y;let uf=Y*Y+X*X;if(uf<=2)return new E(Y,X);fe=Math.sqrt(uf/2)}else{let Bt=!1;ee>Number.EPSILON?Re>Number.EPSILON&&(Bt=!0):ee<-Number.EPSILON?Re<-Number.EPSILON&&(Bt=!0):Math.sign(Se)===Math.sign(Ye)&&(Bt=!0),Bt?(Y=-Se,X=ee,fe=Math.sqrt(Dt)):(Y=ee,X=Se,fe=Math.sqrt(Dt/2))}return new E(Y/fe,X/fe)}let he=[];for(let F=0,G=V.length,H=G-1,Y=F+1;F<G;F++,H++,Y++)H===G&&(H=0),Y===G&&(Y=0),he[F]=Me(V[F],V[H],V[Y]);let ue=[],de,Ie=he.concat();for(let F=0,G=k;F<G;F++){let H=I[F];de=[];for(let Y=0,X=H.length,fe=X-1,ee=Y+1;Y<X;Y++,fe++,ee++)fe===X&&(fe=0),ee===X&&(ee=0),de[Y]=Me(H[Y],H[fe],H[ee]);ue.push(de),Ie=Ie.concat(de)}let He;if(_===0)He=Mt.triangulateShape(V,I);else{let F=[],G=[];for(let H=0;H<_;H++){let Y=H/_,X=f*Math.cos(Y*Math.PI/2),fe=p*Math.sin(Y*Math.PI/2)+m;for(let ee=0,Se=V.length;ee<Se;ee++){let Re=J(V[ee],he[ee],fe);yt(Re.x,Re.y,-X),Y===0&&F.push(Re)}for(let ee=0,Se=k;ee<Se;ee++){let Re=I[ee];de=ue[ee];let Ye=[];for(let Dt=0,Ir=Re.length;Dt<Ir;Dt++){let Bt=J(Re[Dt],de[Dt],fe);yt(Bt.x,Bt.y,-X),Y===0&&Ye.push(Bt)}Y===0&&G.push(Ye)}}He=Mt.triangulateShape(F,G)}let Ke=He.length,lt=p+m;for(let F=0;F<Q;F++){let G=d?J(C[F],Ie[F],lt):C[F];v?(T.copy(M.normals[0]).multiplyScalar(G.x),A.copy(M.binormals[0]).multiplyScalar(G.y),S.copy(y[0]).add(T).add(A),yt(S.x,S.y,S.z)):yt(G.x,G.y,0)}for(let F=1;F<=h;F++)for(let G=0;G<Q;G++){let H=d?J(C[G],Ie[G],lt):C[G];v?(T.copy(M.normals[F]).multiplyScalar(H.x),A.copy(M.binormals[F]).multiplyScalar(H.y),S.copy(y[F]).add(T).add(A),yt(S.x,S.y,S.z)):yt(H.x,H.y,u/h*F)}for(let F=_-1;F>=0;F--){let G=F/_,H=f*Math.cos(G*Math.PI/2),Y=p*Math.sin(G*Math.PI/2)+m;for(let X=0,fe=V.length;X<fe;X++){let ee=J(V[X],he[X],Y);yt(ee.x,ee.y,u+H)}for(let X=0,fe=I.length;X<fe;X++){let ee=I[X];de=ue[X];for(let Se=0,Re=ee.length;Se<Re;Se++){let Ye=J(ee[Se],de[Se],Y);v?yt(Ye.x,Ye.y+y[h-1].y,y[h-1].x+H):yt(Ye.x,Ye.y,u+H)}}}we(),Da();function we(){let F=r.length/3;if(d){let G=0,H=Q*G;for(let Y=0;Y<Ke;Y++){let X=He[Y];xi(X[2]+H,X[1]+H,X[0]+H)}G=h+_*2,H=Q*G;for(let Y=0;Y<Ke;Y++){let X=He[Y];xi(X[0]+H,X[1]+H,X[2]+H)}}else{for(let G=0;G<Ke;G++){let H=He[G];xi(H[2],H[1],H[0])}for(let G=0;G<Ke;G++){let H=He[G];xi(H[0]+Q*h,H[1]+Q*h,H[2]+Q*h)}}i.addGroup(F,r.length/3-F,0)}function Da(){let F=r.length/3,G=0;$i(V,G),G+=V.length;for(let H=0,Y=I.length;H<Y;H++){let X=I[H];$i(X,G),G+=X.length}i.addGroup(F,r.length/3-F,1)}function $i(F,G){let H=F.length;for(;--H>=0;){let Y=H,X=H-1;X<0&&(X=F.length-1);for(let fe=0,ee=h+_*2;fe<ee;fe++){let Se=Q*fe,Re=Q*(fe+1),Ye=G+Y+Se,Dt=G+X+Se,Ir=G+X+Re,Bt=G+Y+Re;To(Ye,Dt,Ir,Bt)}}}function yt(F,G,H){l.push(F),l.push(G),l.push(H)}function xi(F,G,H){Nt(F),Nt(G),Nt(H);let Y=r.length/3,X=x.generateTopUV(i,r,Y-3,Y-2,Y-1);Fi(X[0]),Fi(X[1]),Fi(X[2])}function To(F,G,H,Y){Nt(F),Nt(G),Nt(Y),Nt(G),Nt(H),Nt(Y);let X=r.length/3,fe=x.generateSideWallUV(i,r,X-6,X-3,X-2,X-1);Fi(fe[0]),Fi(fe[1]),Fi(fe[3]),Fi(fe[1]),Fi(fe[2]),Fi(fe[3])}function Nt(F){r.push(l[F*3+0]),r.push(l[F*3+1]),r.push(l[F*3+2])}function Fi(F){n.push(F.x),n.push(F.y)}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes,i=this.parameters.options;return hv(t,i,e)}static fromJSON(e,t){let i=[];for(let n=0,s=e.shapes.length;n<s;n++){let a=t[e.shapes[n]];i.push(a)}let r=e.options.extrudePath;return r!==void 0&&(e.options.extrudePath=new _r[r.type]().fromJSON(r)),new o(i,e.options)}},cv={generateTopUV:function(o,e,t,i,r){let n=e[t*3],s=e[t*3+1],a=e[i*3],l=e[i*3+1],c=e[r*3],h=e[r*3+1];return[new E(n,s),new E(a,l),new E(c,h)]},generateSideWallUV:function(o,e,t,i,r,n){let s=e[t*3],a=e[t*3+1],l=e[t*3+2],c=e[i*3],h=e[i*3+1],u=e[i*3+2],d=e[r*3],f=e[r*3+1],p=e[r*3+2],m=e[n*3],_=e[n*3+1],g=e[n*3+2];return Math.abs(a-h)<Math.abs(s-c)?[new E(s,1-l),new E(c,1-u),new E(d,1-p),new E(m,1-g)]:[new E(a,1-l),new E(h,1-u),new E(f,1-p),new E(_,1-g)]}};function hv(o,e,t){if(t.shapes=[],Array.isArray(o))for(let i=0,r=o.length;i<r;i++){let n=o[i];t.shapes.push(n.uuid)}else t.shapes.push(o.uuid);return t.options=Object.assign({},e),e.extrudePath!==void 0&&(t.options.extrudePath=e.extrudePath.toJSON()),t}var Kl=class o extends Qt{constructor(e=1,t=0){let i=(1+Math.sqrt(5))/2,r=[-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],n=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(r,n,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new o(e.radius,e.detail)}};var jl=class o extends D{constructor(e=[new E(0,-.5),new E(.5,0),new E(0,.5)],t=12,i=0,r=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:i,phiLength:r},t=Math.floor(t),r=W(r,0,Math.PI*2);let n=[],s=[],a=[],l=[],c=[],h=1/t,u=new w,d=new E,f=new w,p=new w,m=new w,_=0,g=0;for(let x=0;x<=e.length-1;x++)switch(x){case 0:_=e[x+1].x-e[x].x,g=e[x+1].y-e[x].y,f.x=g*1,f.y=-_,f.z=g*0,m.copy(f),f.normalize(),l.push(f.x,f.y,f.z);break;case e.length-1:l.push(m.x,m.y,m.z);break;default:_=e[x+1].x-e[x].x,g=e[x+1].y-e[x].y,f.x=g*1,f.y=-_,f.z=g*0,p.copy(f),f.x+=m.x,f.y+=m.y,f.z+=m.z,f.normalize(),l.push(f.x,f.y,f.z),m.copy(p)}for(let x=0;x<=t;x++){let y=i+x*h*r,v=Math.sin(y),M=Math.cos(y);for(let A=0;A<=e.length-1;A++){u.x=e[A].x*v,u.y=e[A].y,u.z=e[A].x*M,s.push(u.x,u.y,u.z),d.x=x/t,d.y=A/(e.length-1),a.push(d.x,d.y);let T=l[3*A+0]*v,S=l[3*A+1],b=l[3*A+0]*M;c.push(T,S,b)}}for(let x=0;x<t;x++)for(let y=0;y<e.length-1;y++){let v=y+x*e.length,M=v,A=v+e.length,T=v+e.length+1,S=v+1;n.push(M,A,S),n.push(T,S,A)}this.setIndex(n),this.setAttribute("position",new R(s,3)),this.setAttribute("uv",new R(a,2)),this.setAttribute("normal",new R(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new o(e.points,e.segments,e.phiStart,e.phiLength)}};var Bs=class o extends Qt{constructor(e=1,t=0){let i=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],r=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(i,r,e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new o(e.radius,e.detail)}};var $l=class o extends D{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};let n=e/2,s=t/2,a=Math.floor(i),l=Math.floor(r),c=a+1,h=l+1,u=e/a,d=t/l,f=[],p=[],m=[],_=[];for(let g=0;g<h;g++){let x=g*d-s;for(let y=0;y<c;y++){let v=y*u-n;p.push(v,-x,0),m.push(0,0,1),_.push(y/a),_.push(1-g/l)}}for(let g=0;g<l;g++)for(let x=0;x<a;x++){let y=x+c*g,v=x+c*(g+1),M=x+1+c*(g+1),A=x+1+c*g;f.push(y,v,A),f.push(v,M,A)}this.setIndex(f),this.setAttribute("position",new R(p,3)),this.setAttribute("normal",new R(m,3)),this.setAttribute("uv",new R(_,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new o(e.width,e.height,e.widthSegments,e.heightSegments)}};var Ql=class o extends D{constructor(e=.5,t=1,i=32,r=1,n=0,s=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:i,phiSegments:r,thetaStart:n,thetaLength:s},i=Math.max(3,i),r=Math.max(1,r);let a=[],l=[],c=[],h=[],u=e,d=(t-e)/r,f=new w,p=new E;for(let m=0;m<=r;m++){for(let _=0;_<=i;_++){let g=n+_/i*s;f.x=u*Math.cos(g),f.y=u*Math.sin(g),l.push(f.x,f.y,f.z),c.push(0,0,1),p.x=(f.x/t+1)/2,p.y=(f.y/t+1)/2,h.push(p.x,p.y)}u+=d}for(let m=0;m<r;m++){let _=m*(i+1);for(let g=0;g<i;g++){let x=g+_,y=x,v=x+i+1,M=x+i+2,A=x+1;a.push(y,v,A),a.push(v,M,A)}}this.setIndex(a),this.setAttribute("position",new R(l,3)),this.setAttribute("normal",new R(c,3)),this.setAttribute("uv",new R(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new o(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}};var ec=class o extends D{constructor(e=new ei([new E(0,.5),new E(-.5,-.5),new E(.5,-.5)]),t=12){super(),this.type="ShapeGeometry",this.parameters={shapes:e,curveSegments:t};let i=[],r=[],n=[],s=[],a=0,l=0;if(Array.isArray(e)===!1)c(e);else for(let h=0;h<e.length;h++)c(e[h]),this.addGroup(a,l,h),a+=l,l=0;this.setIndex(i),this.setAttribute("position",new R(r,3)),this.setAttribute("normal",new R(n,3)),this.setAttribute("uv",new R(s,2));function c(h){let u=r.length/3,d=h.extractPoints(t),f=d.shape,p=d.holes;Mt.isClockWise(f)===!1&&(f=f.reverse());for(let _=0,g=p.length;_<g;_++){let x=p[_];Mt.isClockWise(x)===!0&&(p[_]=x.reverse())}let m=Mt.triangulateShape(f,p);for(let _=0,g=p.length;_<g;_++){let x=p[_];f=f.concat(x)}for(let _=0,g=f.length;_<g;_++){let x=f[_];r.push(x.x,x.y,0),n.push(0,0,1),s.push(x.x,x.y)}for(let _=0,g=m.length;_<g;_++){let x=m[_],y=x[0]+u,v=x[1]+u,M=x[2]+u;i.push(y,v,M),l+=3}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes;return uv(t,e)}static fromJSON(e,t){let i=[];for(let r=0,n=e.shapes.length;r<n;r++){let s=t[e.shapes[r]];i.push(s)}return new o(i,e.curveSegments)}};function uv(o,e){if(e.shapes=[],Array.isArray(o))for(let t=0,i=o.length;t<i;t++){let r=o[t];e.shapes.push(r.uuid)}else e.shapes.push(o.uuid);return e}var Fs=class o extends D{constructor(e=1,t=32,i=16,r=0,n=Math.PI*2,s=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:r,phiLength:n,thetaStart:s,thetaLength:a},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));let l=Math.min(s+a,Math.PI),c=0,h=[],u=new w,d=new w,f=[],p=[],m=[],_=[];for(let g=0;g<=i;g++){let x=[],y=g/i,v=s+y*a,M=e*Math.cos(v),A=Math.sqrt(e*e-M*M),T=0;g===0&&s===0?T=.5/t:g===i&&l===Math.PI&&(T=-.5/t);for(let S=0;S<=t;S++){let b=S/t,C=r+b*n;u.x=-A*Math.cos(C),u.y=M,u.z=A*Math.sin(C),p.push(u.x,u.y,u.z),d.copy(u).normalize(),m.push(d.x,d.y,d.z),_.push(b+T,1-y),x.push(c++)}h.push(x)}for(let g=0;g<i;g++)for(let x=0;x<t;x++){let y=h[g][x+1],v=h[g][x],M=h[g+1][x],A=h[g+1][x+1];(g!==0||s>0)&&f.push(y,v,A),(g!==i-1||l<Math.PI)&&f.push(v,M,A)}this.setIndex(f),this.setAttribute("position",new R(p,3)),this.setAttribute("normal",new R(m,3)),this.setAttribute("uv",new R(_,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new o(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var tc=class o extends Qt{constructor(e=1,t=0){let i=[1,1,1,-1,-1,1,-1,1,-1,1,-1,-1],r=[2,1,0,0,3,2,1,3,0,2,3,1];super(i,r,e,t),this.type="TetrahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new o(e.radius,e.detail)}};var ic=class o extends D{constructor(e=1,t=.4,i=12,r=48,n=Math.PI*2,s=0,a=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:i,tubularSegments:r,arc:n,thetaStart:s,thetaLength:a},i=Math.floor(i),r=Math.floor(r);let l=[],c=[],h=[],u=[],d=new w,f=new w,p=new w;for(let m=0;m<=i;m++){let _=s+m/i*a;for(let g=0;g<=r;g++){let x=g/r*n;f.x=(e+t*Math.cos(_))*Math.cos(x),f.y=(e+t*Math.cos(_))*Math.sin(x),f.z=t*Math.sin(_),c.push(f.x,f.y,f.z),d.x=e*Math.cos(x),d.y=e*Math.sin(x),p.subVectors(f,d).normalize(),h.push(p.x,p.y,p.z),u.push(g/r),u.push(m/i)}}for(let m=1;m<=i;m++)for(let _=1;_<=r;_++){let g=(r+1)*m+_-1,x=(r+1)*(m-1)+_-1,y=(r+1)*(m-1)+_,v=(r+1)*m+_;l.push(g,x,v),l.push(x,y,v)}this.setIndex(l),this.setAttribute("position",new R(c,3)),this.setAttribute("normal",new R(h,3)),this.setAttribute("uv",new R(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new o(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc,e.thetaStart,e.thetaLength)}};var rc=class o extends D{constructor(e=1,t=.4,i=64,r=8,n=2,s=3){super(),this.type="TorusKnotGeometry",this.parameters={radius:e,tube:t,tubularSegments:i,radialSegments:r,p:n,q:s},i=Math.floor(i),r=Math.floor(r);let a=[],l=[],c=[],h=[],u=new w,d=new w,f=new w,p=new w,m=new w,_=new w,g=new w;for(let y=0;y<=i;++y){let v=y/i*n*Math.PI*2;x(v,n,s,e,f),x(v+.01,n,s,e,p),_.subVectors(p,f),g.addVectors(p,f),m.crossVectors(_,g),g.crossVectors(m,_),m.normalize(),g.normalize();for(let M=0;M<=r;++M){let A=M/r*Math.PI*2,T=-t*Math.cos(A),S=t*Math.sin(A);u.x=f.x+(T*g.x+S*m.x),u.y=f.y+(T*g.y+S*m.y),u.z=f.z+(T*g.z+S*m.z),l.push(u.x,u.y,u.z),d.subVectors(u,f).normalize(),c.push(d.x,d.y,d.z),h.push(y/i),h.push(M/r)}}for(let y=1;y<=i;y++)for(let v=1;v<=r;v++){let M=(r+1)*(y-1)+(v-1),A=(r+1)*y+(v-1),T=(r+1)*y+v,S=(r+1)*(y-1)+v;a.push(M,A,S),a.push(A,T,S)}this.setIndex(a),this.setAttribute("position",new R(l,3)),this.setAttribute("normal",new R(c,3)),this.setAttribute("uv",new R(h,2));function x(y,v,M,A,T){let S=Math.cos(y),b=Math.sin(y),C=M/v*y,I=Math.cos(C);T.x=A*(2+I)*.5*S,T.y=A*(2+I)*b*.5,T.z=A*Math.sin(C)*.5}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new o(e.radius,e.tube,e.tubularSegments,e.radialSegments,e.p,e.q)}};var nc=class o extends D{constructor(e=new tn(new w(-1,-1,0),new w(-1,1,0),new w(1,1,0)),t=64,i=1,r=8,n=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:i,radialSegments:r,closed:n};let s=e.computeFrenetFrames(t,n);this.tangents=s.tangents,this.normals=s.normals,this.binormals=s.binormals;let a=new w,l=new w,c=new E,h=new w,u=[],d=[],f=[],p=[];m(),this.setIndex(p),this.setAttribute("position",new R(u,3)),this.setAttribute("normal",new R(d,3)),this.setAttribute("uv",new R(f,2));function m(){for(let y=0;y<t;y++)_(y);_(n===!1?t:0),x(),g()}function _(y){h=e.getPointAt(y/t,h);let v=s.normals[y],M=s.binormals[y];for(let A=0;A<=r;A++){let T=A/r*Math.PI*2,S=Math.sin(T),b=-Math.cos(T);l.x=b*v.x+S*M.x,l.y=b*v.y+S*M.y,l.z=b*v.z+S*M.z,l.normalize(),d.push(l.x,l.y,l.z),a.x=h.x+i*l.x,a.y=h.y+i*l.y,a.z=h.z+i*l.z,u.push(a.x,a.y,a.z)}}function g(){for(let y=1;y<=t;y++)for(let v=1;v<=r;v++){let M=(r+1)*(y-1)+(v-1),A=(r+1)*y+(v-1),T=(r+1)*y+v,S=(r+1)*(y-1)+v;p.push(M,A,S),p.push(A,T,S)}}function x(){for(let y=0;y<=t;y++)for(let v=0;v<=r;v++)c.x=y/t,c.y=v/r,f.push(c.x,c.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new o(new _r[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}};var sc=class extends D{constructor(e=null){if(super(),this.type="WireframeGeometry",this.parameters={geometry:e},e!==null){let t=[],i=new Set,r=new w,n=new w;if(e.index!==null){let s=e.attributes.position,a=e.index,l=e.groups;l.length===0&&(l=[{start:0,count:a.count,materialIndex:0}]);for(let c=0,h=l.length;c<h;++c){let u=l[c],d=u.start,f=u.count;for(let p=d,m=d+f;p<m;p+=3)for(let _=0;_<3;_++){let g=a.getX(p+_),x=a.getX(p+(_+1)%3);r.fromBufferAttribute(s,g),n.fromBufferAttribute(s,x),lp(r,n,i)===!0&&(t.push(r.x,r.y,r.z),t.push(n.x,n.y,n.z))}}}else{let s=e.attributes.position;for(let a=0,l=s.count/3;a<l;a++)for(let c=0;c<3;c++){let h=3*a+c,u=3*a+(c+1)%3;r.fromBufferAttribute(s,h),n.fromBufferAttribute(s,u),lp(r,n,i)===!0&&(t.push(r.x,r.y,r.z),t.push(n.x,n.y,n.z))}}this.setAttribute("position",new R(t,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}};function lp(o,e,t){let i=`${o.x},${o.y},${o.z}-${e.x},${e.y},${e.z}`,r=`${e.x},${e.y},${e.z}-${o.x},${o.y},${o.z}`;return t.has(i)===!0||t.has(r)===!0?!1:(t.add(i),t.add(r),!0)}var Os=class extends te{constructor(e){super(),this.isShadowMaterial=!0,this.type="ShadowMaterial",this.color=new L(0),this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.fog=e.fog,this}};function Us(o){let e={};for(let t in o){e[t]={};for(let i in o[t]){let r=o[t][i];if(cp(r))r.isRenderTargetTexture?(O("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone();else if(Array.isArray(r))if(cp(r[0])){let n=[];for(let s=0,a=r.length;s<a;s++)n[s]=r[s].clone();e[t][i]=n}else e[t][i]=r.slice();else e[t][i]=r}}return e}function mt(o){let e={};for(let t=0;t<o.length;t++){let i=Us(o[t]);for(let r in i)e[r]=i[r]}return e}function cp(o){return o&&(o.isColor||o.isMatrix3||o.isMatrix4||o.isVector2||o.isVector3||o.isVector4||o.isTexture||o.isQuaternion)}function hp(o){let e=[];for(let t=0;t<o.length;t++)e.push(o[t].clone());return e}var up={clone:Us,merge:mt};var dp=`
void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;var fp=`
void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}
`;var St=class extends te{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=dp,this.fragmentShader=fp,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Us(e.uniforms),this.uniformsGroups=hp(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let r in this.uniforms){let s=this.uniforms[r].value;s&&s.isTexture?t.uniforms[r]={type:"t",value:s.toJSON(e).uuid}:s&&s.isColor?t.uniforms[r]={type:"c",value:s.getHex()}:s&&s.isVector2?t.uniforms[r]={type:"v2",value:s.toArray()}:s&&s.isVector3?t.uniforms[r]={type:"v3",value:s.toArray()}:s&&s.isVector4?t.uniforms[r]={type:"v4",value:s.toArray()}:s&&s.isMatrix3?t.uniforms[r]={type:"m3",value:s.toArray()}:s&&s.isMatrix4?t.uniforms[r]={type:"m4",value:s.toArray()}:t.uniforms[r]={value:s}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let i in e.uniforms){let r=e.uniforms[i];switch(this.uniforms[i]={},r.type){case"t":this.uniforms[i].value=t[r.value]||null;break;case"c":this.uniforms[i].value=new L().setHex(r.value);break;case"v2":this.uniforms[i].value=new E().fromArray(r.value);break;case"v3":this.uniforms[i].value=new w().fromArray(r.value);break;case"v4":this.uniforms[i].value=new Te().fromArray(r.value);break;case"m3":this.uniforms[i].value=new Z().fromArray(r.value);break;case"m4":this.uniforms[i].value=new z().fromArray(r.value);break;default:this.uniforms[i].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let i in e.extensions)this.extensions[i]=e.extensions[i];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}};var zs=class extends St{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var ui=class extends te{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new L(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new L(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Ot,this.normalScale=new E(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new $e,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var rt=class extends ui{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new E(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return W(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new L(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new L(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new L(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._retroreflectivity=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get retroreflectivity(){return this._retroreflectivity}set retroreflectivity(e){this._retroreflectivity>0!=e>0&&this.version++,this._retroreflectivity=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.retroreflectivity=e.retroreflectivity,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}};var ks=class extends te{constructor(e){super(),this.isMeshPhongMaterial=!0,this.type="MeshPhongMaterial",this.color=new L(16777215),this.specular=new L(1118481),this.shininess=30,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new L(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Ot,this.normalScale=new E(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new $e,this.combine=Rr,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.specular.copy(e.specular),this.shininess=e.shininess,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var Vs=class extends te{constructor(e){super(),this.isMeshToonMaterial=!0,this.defines={TOON:""},this.type="MeshToonMaterial",this.color=new L(16777215),this.map=null,this.gradientMap=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new L(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Ot,this.normalScale=new E(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.alphaMap=null,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.gradientMap=e.gradientMap,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.alphaMap=e.alphaMap,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var Gs=class extends te{constructor(e){super(),this.isMeshNormalMaterial=!0,this.type="MeshNormalMaterial",this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Ot,this.normalScale=new E(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.flatShading=!1,this.setValues(e)}copy(e){return super.copy(e),this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.flatShading=e.flatShading,this}};var Hs=class extends te{constructor(e){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new L(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new L(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Ot,this.normalScale=new E(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new $e,this.combine=Rr,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var Ws=class extends te{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Xh,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}};var qs=class extends te{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};var Xs=class extends te{constructor(e){super(),this.isMeshMatcapMaterial=!0,this.defines={MATCAP:""},this.type="MeshMatcapMaterial",this.color=new L(16777215),this.matcap=null,this.map=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Ot,this.normalScale=new E(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.alphaMap=null,this.wireframe=!1,this.wireframeLinewidth=1,this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={MATCAP:""},this.color.copy(e.color),this.matcap=e.matcap,this.map=e.map,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.alphaMap=e.alphaMap,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.flatShading=e.flatShading,this.fog=e.fog,this}};var Ys=class extends oe{constructor(e){super(),this.isLineDashedMaterial=!0,this.type="LineDashedMaterial",this.scale=1,this.dashSize=3,this.gapSize=1,this.setValues(e)}copy(e){return super.copy(e),this.scale=e.scale,this.dashSize=e.dashSize,this.gapSize=e.gapSize,this}};function Wt(o,e){return!o||o.constructor===e?o:typeof e.BYTES_PER_ELEMENT=="number"?new e(o):Array.prototype.slice.call(o)}function sn(o){return o!==void 0&&o.inTangents!==void 0&&o.outTangents!==void 0}function Vu(o){function e(r,n){return o[r]-o[n]}let t=o.length,i=new Array(t);for(let r=0;r!==t;++r)i[r]=r;return i.sort(e),i}function lc(o,e,t){let i=o.length,r=new o.constructor(i);for(let n=0,s=0;s!==i;++n){let a=t[n]*e;for(let l=0;l!==e;++l)r[s++]=o[a+l]}return r}function Gu(o,e,t,i){let r=1,n=o[0];for(;n!==void 0&&n[i]===void 0;)n=o[r++];if(n===void 0)return;let s=n[i];if(s!==void 0)if(Array.isArray(s))do s=n[i],s!==void 0&&(e.push(n.time),t.push(...s)),n=o[r++];while(n!==void 0);else if(s.toArray!==void 0)do s=n[i],s!==void 0&&(e.push(n.time),s.toArray(t,t.length)),n=o[r++];while(n!==void 0);else do s=n[i],s!==void 0&&(e.push(n.time),t.push(s)),n=o[r++];while(n!==void 0)}function dv(o,e,t,i,r=30){let n=o.clone();n.name=e;let s=[];for(let l=0;l<n.tracks.length;++l){let c=n.tracks[l],h=c.getValueSize(),u=[],d=[];for(let f=0;f<c.times.length;++f){let p=c.times[f]*r;if(!(p<t||p>=i)){u.push(c.times[f]);for(let m=0;m<h;++m)d.push(c.values[f*h+m])}}u.length!==0&&(c.times=Wt(u,c.times.constructor),c.values=Wt(d,c.values.constructor),s.push(c))}n.tracks=s;let a=1/0;for(let l=0;l<n.tracks.length;++l)a>n.tracks[l].times[0]&&(a=n.tracks[l].times[0]);for(let l=0;l<n.tracks.length;++l)n.tracks[l].shift(-1*a);return n.resetDuration(),n}function fv(o,e=0,t=o,i=30){i<=0&&(i=30);let r=t.tracks.length,n=e/i;for(let s=0;s<r;++s){let a=t.tracks[s],l=a.ValueTypeName;if(l==="bool"||l==="string")continue;let c=o.tracks.find(function(g){return g.name===a.name&&g.ValueTypeName===l});if(c===void 0)continue;let h=0,u=a.getValueSize();a.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline&&(h=u/3);let d=0,f=c.getValueSize();c.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline&&(d=f/3);let p=a.times.length-1,m;if(n<=a.times[0]){let g=h,x=u-h;m=a.values.slice(g,x)}else if(n>=a.times[p]){let g=p*u+h,x=g+u-h;m=a.values.slice(g,x)}else{let g=a.createInterpolant(),x=h,y=u-h;g.evaluate(n),m=g.resultBuffer.slice(x,y)}l==="quaternion"&&new ge().fromArray(m).normalize().conjugate().toArray(m);let _=c.times.length;for(let g=0;g<_;++g){let x=g*f+d;if(l==="quaternion")ge.multiplyQuaternionsFlat(c.values,x,m,0,c.values,x);else{let y=f-d*2;for(let v=0;v<y;++v)c.values[x+v]-=m[v]}}}return o.blendMode=Xo,o}var ac=class{static convertArray(e,t){return Wt(e,t)}static isTypedArray(e){return qa(e)}static hasTangents(e){return sn(e)}static getKeyframeOrder(e){return Vu(e)}static sortedArray(e,t,i){return lc(e,t,i)}static flattenJSON(e,t,i,r){Gu(e,t,i,r)}static subclip(e,t,i,r,n=30){return dv(e,t,i,r,n)}static makeClipAdditive(e,t=0,i=e,r=30){return fv(e,t,i,r)}};var gt=class{constructor(e,t,i,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r!==void 0?r:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,i=this._cachedIndex,r=t[i],n=t[i-1];e:{t:{let s;i:{r:if(!(e<r)){for(let a=i+2;;){if(r===void 0){if(e<n)break r;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===a)break;if(n=r,r=t[++i],e<r)break t}s=t.length;break i}if(!(e>=n)){let a=t[1];e<a&&(i=2,n=a);for(let l=i-2;;){if(n===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(r=n,n=t[--i-1],e>=n)break t}s=i,i=0;break i}break e}for(;i<s;){let a=i+s>>>1;e<t[a]?s=a:i=a+1}if(r=t[i],n=t[i-1],n===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,n,r)}return this.interpolate_(i,n,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,r=this.valueSize,n=e*r;for(let s=0;s!==r;++s)t[s]=i[n+s];return t}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}};var Zs=class extends gt{constructor(e,t,i,r){super(e,t,i,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:ki,endingEnd:ki}}intervalChanged_(e,t,i){let r=this.parameterPositions,n=e-2,s=e+1,a=r[n],l=r[s];if(a===void 0)switch(this.getSettings_().endingStart){case Vi:n=e,a=2*t-i;break;case Ur:n=r.length-2,a=t+r[n]-r[n+1];break;default:n=e,a=i}if(l===void 0)switch(this.getSettings_().endingEnd){case Vi:s=e,l=2*i-t;break;case Ur:s=1,l=i+r[1]-r[0];break;default:s=e-1,l=t}let c=(i-t)*.5,h=this.valueSize;this._weightPrev=c/(t-a),this._weightNext=c/(l-i),this._offsetPrev=n*h,this._offsetNext=s*h}interpolate_(e,t,i,r){let n=this.resultBuffer,s=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,h=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(i-t)/(r-t),m=p*p,_=m*p,g=-d*_+2*d*m-d*p,x=(1+d)*_+(-1.5-2*d)*m+(-.5+d)*p+1,y=(-1-f)*_+(1.5+f)*m+.5*p,v=f*_-f*m;for(let M=0;M!==a;++M)n[M]=g*s[h+M]+x*s[c+M]+y*s[l+M]+v*s[u+M];return n}};var xr=class extends gt{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e,t,i,r){let n=this.resultBuffer,s=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,h=(i-t)/(r-t),u=1-h;for(let d=0;d!==a;++d)n[d]=s[c+d]*u+s[l+d]*h;return n}};var Js=class extends gt{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e){return this.copySampleValue_(e-1)}};var Ks=class extends gt{interpolate_(e,t,i,r){let n=this.resultBuffer,s=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,h=this.inTangents,u=this.outTangents;if(!h||!u){let p=(i-t)/(r-t),m=1-p;for(let _=0;_!==a;++_)n[_]=s[c+_]*m+s[l+_]*p;return n}let d=a*2,f=e-1;for(let p=0;p!==a;++p){let m=s[c+p],_=s[l+p],g=f*d+p*2,x=u[g],y=u[g+1],v=e*d+p*2,M=h[v],A=h[v+1],T=mv(i,t,x,M,r);n[p]=mp(T,m,y,A,_)}return n}};function mp(o,e,t,i,r){let n=1-o;return n*n*n*e+3*n*n*o*t+3*n*o*o*i+o*o*o*r}function pv(o,e,t,i,r){let n=1-o;return 3*n*n*(t-e)+6*n*o*(i-t)+3*o*o*(r-i)}function mv(o,e,t,i,r){let n=(o-e)/(r-e);for(let s=0;s<8;s++){let a=mp(n,e,t,i,r)-o;if(Math.abs(a)<1e-10)break;let l=pv(n,e,t,i,r);if(Math.abs(l)<1e-10)break;n=Math.max(0,Math.min(1,n-a/l))}return n}var Oe=class{constructor(e,t,i,r){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Wt(t,this.TimeBufferType),this.values=Wt(i,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:Wt(e.times,Array),values:Wt(e.values,Array)};let r=e.getInterpolation();r!==e.DefaultInterpolation&&(i.interpolation=r),sn(e.settings)&&(i.settings={inTangents:Wt(e.settings.inTangents,Array),outTangents:Wt(e.settings.outTangents,Array)})}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new Js(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new xr(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Zs(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new Ks(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case bi:t=this.InterpolantFactoryMethodDiscrete;break;case tr:t=this.InterpolantFactoryMethodLinear;break;case qo:t=this.InterpolantFactoryMethodSmooth;break;case Ha:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return O("KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return bi;case this.InterpolantFactoryMethodLinear:return tr;case this.InterpolantFactoryMethodSmooth:return qo;case this.InterpolantFactoryMethodBezier:return Ha}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let i=0,r=t.length;i!==r;++i)t[i]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let i=0,r=t.length;i!==r;++i)t[i]*=e;sn(this.settings)&&(gp(this.settings.inTangents,e),gp(this.settings.outTangents,e))}return this}trim(e,t){let i=this.times,r=i.length,n=0,s=r-1;for(;n!==r&&i[n]<e;)++n;for(;s!==-1&&i[s]>t;)--s;if(++s,n!==0||s!==r){n>=s&&(s=Math.max(s,1),n=s-1);let a=this.getValueSize();this.times=i.slice(n,s),this.values=this.values.slice(n*a,s*a)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(K("KeyframeTrack: Invalid value size in track.",this),e=!1);let i=this.times,r=this.values,n=i.length;n===0&&(K("KeyframeTrack: Track is empty.",this),e=!1);let s=null;for(let a=0;a!==n;a++){let l=i[a];if(typeof l=="number"&&isNaN(l)){K("KeyframeTrack: Time is not a valid number.",this,a,l),e=!1;break}if(s!==null&&s>l){K("KeyframeTrack: Out of order keys.",this,a,l,s),e=!1;break}s=l}if(r!==void 0&&qa(r))for(let a=0,l=r.length;a!==l;++a){let c=r[a];if(isNaN(c)){K("KeyframeTrack: Value is not a valid number.",this,a,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),r=this.getInterpolation()===qo,n=e.length-1,s=1;for(let a=1;a<n;++a){let l=!1,c=e[a],h=e[a+1];if(c!==h&&(a!==1||c!==e[0]))if(r)l=!0;else{let u=a*i,d=u-i,f=u+i;for(let p=0;p!==i;++p){let m=t[u+p];if(m!==t[d+p]||m!==t[f+p]){l=!0;break}}}if(l){if(a!==s){e[s]=e[a];let u=a*i,d=s*i;for(let f=0;f!==i;++f)t[d+f]=t[u+f]}++s}}if(n>0){e[s]=e[n];for(let a=n*i,l=s*i,c=0;c!==i;++c)t[l+c]=t[a+c];++s}return s!==e.length?(this.times=e.slice(0,s),this.values=t.slice(0,s*i)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),i=this.constructor,r=new i(this.name,e,t);return r.createInterpolant=this.createInterpolant,sn(this.settings)&&(r.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),r}};function gp(o,e){for(let t=0,i=o.length;t!==i;t+=2)o[t]*=e}Oe.prototype.ValueTypeName="";Oe.prototype.TimeBufferType=Float32Array;Oe.prototype.ValueBufferType=Float32Array;Oe.prototype.DefaultInterpolation=tr;var di=class extends Oe{constructor(e,t,i){super(e,t,i)}};di.prototype.ValueTypeName="bool";di.prototype.ValueBufferType=Array;di.prototype.DefaultInterpolation=bi;di.prototype.InterpolantFactoryMethodLinear=void 0;di.prototype.InterpolantFactoryMethodSmooth=void 0;var on=class extends Oe{constructor(e,t,i,r){super(e,t,i,r)}};on.prototype.ValueTypeName="color";var fi=class extends Oe{constructor(e,t,i,r){super(e,t,i,r)}};fi.prototype.ValueTypeName="number";var js=class extends gt{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e,t,i,r){let n=this.resultBuffer,s=this.sampleValues,a=this.valueSize,l=(i-t)/(r-t),c=e*a;for(let h=c+a;c!==h;c+=4)ge.slerpFlat(n,0,s,c-a,s,c,l);return n}};var ti=class extends Oe{constructor(e,t,i,r){super(e,t,i,r)}InterpolantFactoryMethodLinear(e){return new js(this.times,this.values,this.getValueSize(),e)}};ti.prototype.ValueTypeName="quaternion";ti.prototype.InterpolantFactoryMethodSmooth=void 0;var pi=class extends Oe{constructor(e,t,i){super(e,t,i)}};pi.prototype.ValueTypeName="string";pi.prototype.ValueBufferType=Array;pi.prototype.DefaultInterpolation=bi;pi.prototype.InterpolantFactoryMethodLinear=void 0;pi.prototype.InterpolantFactoryMethodSmooth=void 0;var mi=class extends Oe{constructor(e,t,i,r){super(e,t,i,r)}};mi.prototype.ValueTypeName="vector";var Pt=class{constructor(e="",t=-1,i=[],r=zr){this.name=e,this.tracks=i,this.duration=t,this.blendMode=r,this.uuid=Pe(),this.userData={},this.duration<0&&this.resetDuration()}static parse(e){let t=[],i=e.tracks,r=1/(e.fps||1);for(let s=0,a=i.length;s!==a;++s)t.push(_v(i[s]).scale(r));let n=new this(e.name,e.duration,t,e.blendMode);return n.uuid=e.uuid,n.userData=JSON.parse(e.userData||"{}"),n}static toJSON(e){let t=[],i=e.tracks,r={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode,userData:JSON.stringify(e.userData)};for(let n=0,s=i.length;n!==s;++n)t.push(Oe.toJSON(i[n]));return r}static CreateFromMorphTargetSequence(e,t,i,r){let n=t.length,s=[];for(let a=0;a<n;a++){let l=[],c=[];l.push((a+n-1)%n,a,(a+1)%n),c.push(0,1,0);let h=Vu(l);l=lc(l,1,h),c=lc(c,1,h),!r&&l[0]===0&&(l.push(n),c.push(c[0])),s.push(new fi(".morphTargetInfluences["+t[a].name+"]",l,c).scale(1/i))}return new this(e,-1,s)}static findByName(e,t){let i=e;if(!Array.isArray(e)){let r=e;i=r.geometry&&r.geometry.animations||r.animations}for(let r=0;r<i.length;r++)if(i[r].name===t)return i[r];return null}static CreateClipsFromMorphTargetSequences(e,t,i){let r={},n=/^([\w-]*?)([\d]+)$/;for(let a=0,l=e.length;a<l;a++){let c=e[a],h=c.name.match(n);if(h&&h.length>1){let u=h[1],d=r[u];d||(r[u]=d=[]),d.push(c)}}let s=[];for(let a in r)s.push(this.CreateFromMorphTargetSequence(a,r[a],t,i));return s}resetDuration(){let e=this.tracks,t=0;for(let i=0,r=e.length;i!==r;++i){let n=this.tracks[i];t=Math.max(t,n.times[n.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){let e=[];for(let i=0;i<this.tracks.length;i++)e.push(this.tracks[i].clone());let t=new this.constructor(this.name,this.duration,e,this.blendMode);return t.userData=JSON.parse(JSON.stringify(this.userData)),t}toJSON(){return this.constructor.toJSON(this)}};function gv(o){switch(o.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return fi;case"vector":case"vector2":case"vector3":case"vector4":return mi;case"color":return on;case"quaternion":return ti;case"bool":case"boolean":return di;case"string":return pi}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+o)}function _v(o){if(o.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");let e=gv(o.type);if(o.times===void 0){let i=[],r=[];Gu(o.keys,i,r,"value"),o.times=i,o.values=r}let t;return e.parse!==void 0?t=e.parse(o):t=new e(o.name,o.times,o.values,o.interpolation),sn(o.settings)&&(t.settings={inTangents:Wt(o.settings.inTangents,Float32Array),outTangents:Wt(o.settings.outTangents,Float32Array)}),t}var nt={enabled:!1,files:{},add:function(o,e){this.enabled!==!1&&(_p(o)||(this.files[o]=e))},get:function(o){if(this.enabled!==!1&&!_p(o))return this.files[o]},remove:function(o){delete this.files[o]},clear:function(){this.files={}}};function _p(o){try{let e=o.slice(o.indexOf(":")+1);return new URL(e).protocol==="blob:"}catch{return!1}}var an=class{constructor(e,t,i){let r=this,n=!1,s=0,a=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this._abortController=null,this.itemStart=function(h){a++,n===!1&&r.onStart!==void 0&&r.onStart(h,s,a),n=!0},this.itemEnd=function(h){s++,r.onProgress!==void 0&&r.onProgress(h,s,a),s===a&&(n=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(h){r.onError!==void 0&&r.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){let u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,d=c.length;u<d;u+=2){let f=c[u],p=c[u+1];if(f.global&&(f.lastIndex=0),f.test(h))return p}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},cc=new an;var ce=class{constructor(e){this.manager=e!==void 0?e:cc,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let i=this;return new Promise(function(r,n){i.load(e,r,t,n)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};ce.DEFAULT_MATERIAL_NAME="__DEFAULT";var Ji={},Hu=class extends Error{constructor(e,t){super(e),this.response=t}},st=class extends ce{constructor(e){super(e),this.mimeType="",this.responseType="",this._abortController=new AbortController}load(e,t,i,r){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let n=nt.get(`file:${e}`);if(n!==void 0){this.manager.itemStart(e),setTimeout(()=>{t&&t(n),this.manager.itemEnd(e)},0);return}if(Ji[e]!==void 0){Ji[e].push({onLoad:t,onProgress:i,onError:r});return}Ji[e]=[],Ji[e].push({onLoad:t,onProgress:i,onError:r});let s=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",signal:typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),a=this.mimeType,l=this.responseType;fetch(s).then(c=>{if(c.status===200||c.status===0){if(c.status===0&&O("FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||c.body===void 0||c.body.getReader===void 0)return c;let h=Ji[e],u=c.body.getReader(),d=c.headers.get("X-File-Size")||c.headers.get("Content-Length"),f=d?parseInt(d):0,p=f!==0,m=0,_=new ReadableStream({start(g){x();function x(){u.read().then(({done:y,value:v})=>{if(y)g.close();else{m+=v.byteLength;let M=new ProgressEvent("progress",{lengthComputable:p,loaded:m,total:f});for(let A=0,T=h.length;A<T;A++){let S=h[A];S.onProgress&&S.onProgress(M)}g.enqueue(v),x()}},y=>{g.error(y)})}}});return new Response(_)}else throw new Hu(`fetch for "${c.url}" responded with ${c.status}: ${c.statusText}`,c)}).then(c=>{switch(l){case"arraybuffer":return c.arrayBuffer();case"blob":return c.blob();case"document":return c.text().then(h=>new DOMParser().parseFromString(h,a));case"json":return c.json();default:if(a==="")return c.text();{let u=/charset="?([^;"\s]*)"?/i.exec(a),d=u&&u[1]?u[1].toLowerCase():void 0,f=new TextDecoder(d);return c.arrayBuffer().then(p=>f.decode(p))}}}).then(c=>{nt.add(`file:${e}`,c);let h=Ji[e];delete Ji[e];for(let u=0,d=h.length;u<d;u++){let f=h[u];f.onLoad&&f.onLoad(c)}}).catch(c=>{let h=Ji[e];if(h===void 0)throw this.manager.itemError(e),c;delete Ji[e];for(let u=0,d=h.length;u<d;u++){let f=h[u];f.onError&&f.onError(c)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}};var hc=class extends ce{constructor(e){super(e)}load(e,t,i,r){let n=this,s=new st(this.manager);s.setPath(this.path),s.setRequestHeader(this.requestHeader),s.setWithCredentials(this.withCredentials),s.load(e,function(a){try{t(n.parse(JSON.parse(a)))}catch(l){r?r(l):K(l),n.manager.itemError(e)}},i,r)}parse(e){let t=[];for(let i=0;i<e.length;i++){let r=Pt.parse(e[i]);t.push(r)}return t}};var uc=class extends ce{constructor(e){super(e)}load(e,t,i,r){let n=this,s=[],a=new Ai,l=new st(this.manager);l.setPath(this.path),l.setResponseType("arraybuffer"),l.setRequestHeader(this.requestHeader),l.setWithCredentials(n.withCredentials);let c=0;function h(u){l.load(e[u],function(d){let f=n.parse(d,!0);s[u]={width:f.width,height:f.height,format:f.format,mipmaps:f.mipmaps},c+=1,c===6&&(f.mipmapCount===1&&(a.minFilter=xe),a.image=s,a.format=f.format,a.needsUpdate=!0,t&&t(a))},i,r)}if(Array.isArray(e))for(let u=0,d=e.length;u<d;++u)h(u);else l.load(e,function(u){let d=n.parse(u,!0);if(d.isCubemap){let f=d.mipmaps.length/d.mipmapCount;for(let p=0;p<f;p++){s[p]={mipmaps:[]};for(let m=0;m<d.mipmapCount;m++)s[p].mipmaps.push(d.mipmaps[p*d.mipmapCount+m]),s[p].format=d.format,s[p].width=d.width,s[p].height=d.height}a.image=s}else a.image.width=d.width,a.image.height=d.height,a.mipmaps=d.mipmaps;d.mipmapCount===1&&(a.minFilter=xe),a.format=d.format,a.needsUpdate=!0,t&&t(a)},i,r);return a}};var $s=new WeakMap,ln=class extends ce{constructor(e){super(e)}load(e,t,i,r){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let n=this,s=nt.get(`image:${e}`);if(s!==void 0){if(s.complete===!0)n.manager.itemStart(e),setTimeout(function(){t&&t(s),n.manager.itemEnd(e)},0);else{let u=$s.get(s);u===void 0&&(u=[],$s.set(s,u)),u.push({onLoad:t,onError:r})}return s}let a=is("img");function l(){h(),t&&t(this);let u=$s.get(this)||[];for(let d=0;d<u.length;d++){let f=u[d];f.onLoad&&f.onLoad(this)}$s.delete(this),n.manager.itemEnd(e)}function c(u){h(),r&&r(u),nt.remove(`image:${e}`);let d=$s.get(this)||[];for(let f=0;f<d.length;f++){let p=d[f];p.onError&&p.onError(u)}$s.delete(this),n.manager.itemError(e),n.manager.itemEnd(e)}function h(){a.removeEventListener("load",l,!1),a.removeEventListener("error",c,!1)}return a.addEventListener("load",l,!1),a.addEventListener("error",c,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(a.crossOrigin=this.crossOrigin),nt.add(`image:${e}`,a),n.manager.itemStart(e),a.src=e,a}};var dc=class extends ce{constructor(e){super(e)}load(e,t,i,r){let n=new Ti;n.colorSpace=ve;let s=new ln(this.manager);s.setCrossOrigin(this.crossOrigin),s.setPath(this.path);let a=0;function l(c){s.load(e[c],function(h){n.images[c]=h,a++,a===6&&(n.needsUpdate=!0,t&&t(n))},void 0,r)}for(let c=0;c<e.length;++c)l(c);return n}};var xa=class extends ce{constructor(e){super(e)}load(e,t,i,r){let n=this,s=new Le,a=new st(this.manager);return a.setResponseType("arraybuffer"),a.setRequestHeader(this.requestHeader),a.setPath(this.path),a.setWithCredentials(n.withCredentials),a.load(e,function(l){let c;try{c=n.parse(l)}catch(h){r!==void 0?r(h):K(h);return}n._applyTexData(s,c),t&&t(s,c)},i,r),s}createDataTexture(e){let t=new Le;return this._applyTexData(t,this.parse(e)),t}_applyTexData(e,t){t.image!==void 0?e.image=t.image:t.data!==void 0&&(e.image.width=t.width,e.image.height=t.height,e.image.data=t.data),e.wrapS=t.wrapS!==void 0?t.wrapS:Be,e.wrapT=t.wrapT!==void 0?t.wrapT:Be,e.magFilter=t.magFilter!==void 0?t.magFilter:xe,e.minFilter=t.minFilter!==void 0?t.minFilter:xe,e.anisotropy=t.anisotropy!==void 0?t.anisotropy:1,t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.mipmaps!==void 0&&(e.mipmaps=t.mipmaps,e.minFilter=Yt),t.mipmapCount===1&&(e.minFilter=xe),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),e.needsUpdate=!0}};var et=class extends q{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new L(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}};var Qs=class extends et{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(q.DEFAULT_UP),this.updateMatrix(),this.groundColor=new L(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}};var Wu=new z,xp=new w,yp=new w,Ii=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new E(512,512),this.mapType=Zt,this.map=null,this.mapPass=null,this.matrix=new z,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new It,this._frameExtents=new E(1,1),this._viewportCount=1,this._viewports=[new Te(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;xp.setFromMatrixPosition(e.matrixWorld),t.position.copy(xp),yp.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(yp),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,i,r){Wu.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),i.setFromProjectionMatrix(Wu,e.coordinateSystem,e.reversedDepth);let n=this._frameExtents,s=r?r.z/n.x:1,a=r?r.w/n.y:1,l=r?r.x/n.x:0,c=r?r.y/n.y:0;e.coordinateSystem===Jt||e.reversedDepth?t.set(.5*s,0,0,.5*s+l,0,.5*a,0,.5*a+c,0,0,1,0,0,0,0,1):t.set(.5*s,0,0,.5*s+l,0,.5*a,0,.5*a+c,0,0,.5,.5,0,0,0,1),t.multiply(Wu)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}};var fc=new w,pc=new ge,Ri=new w,Pi=class extends q{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new z,this.projectionMatrix=new z,this.projectionMatrixInverse=new z,this.coordinateSystem=tt,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(fc,pc,Ri),Ri.x===1&&Ri.y===1&&Ri.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(fc,pc,Ri.set(1,1,1)).invert()}updateWorldMatrix(e,t,i=!1){super.updateWorldMatrix(e,t,i),this.matrixWorld.decompose(fc,pc,Ri),Ri.x===1&&Ri.y===1&&Ri.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(fc,pc,Ri.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}};var yr=new w,vp=new E,wp=new E,be=class extends Pi{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Gr*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Mi*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Gr*2*Math.atan(Math.tan(Mi*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){yr.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(yr.x,yr.y).multiplyScalar(-e/yr.z),yr.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(yr.x,yr.y).multiplyScalar(-e/yr.z)}getViewSize(e,t){return this.getViewBounds(e,vp,wp),t.subVectors(wp,vp)}setViewOffset(e,t,i,r,n,s){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=n,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Mi*.5*this.fov)/this.zoom,i=2*t,r=this.aspect*i,n=-.5*r,s=this.view;if(this.view!==null&&this.view.enabled){let l=s.fullWidth,c=s.fullHeight;n+=s.offsetX*r/l,t-=s.offsetY*i/c,r*=s.width/l,i*=s.height/c}let a=this.filmOffset;a!==0&&(n+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(n,n+r,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}};var mc=class extends Ii{constructor(){super(new be(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(e){let t=this.camera,i=Gr*2*e.angle*this.focus,r=this.mapSize.width/this.mapSize.height*this.aspect,n=e.distance||t.far;(i!==t.fov||r!==t.aspect||n!==t.far)&&(t.fov=i,t.aspect=r,t.far=n,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this.aspect=e.aspect,this}toJSON(){let e=super.toJSON();return e.focus=this.focus,e.aspect=this.aspect,e}};var vr=class extends et{constructor(e,t,i=0,r=Math.PI/3,n=0,s=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(q.DEFAULT_UP),this.updateMatrix(),this.target=new q,this.distance=i,this.angle=r,this.penumbra=n,this.decay=s,this.map=null,this.shadow=new mc}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.map=e.map,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.angle=this.angle,t.object.decay=this.decay,t.object.penumbra=this.penumbra,t.object.target=this.target.uuid,this.map&&this.map.isTexture&&(t.object.map=this.map.toJSON(e).uuid),t.object.shadow=this.shadow.toJSON(),t}};var gc=class extends Ii{constructor(){super(new be(90,1,.5,500)),this.isPointLightShadow=!0}};var wr=class extends et{constructor(e,t,i=0,r=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=r,this.shadow=new gc}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}};var ii=class extends Pi{constructor(e=-1,t=1,i=1,r=-1,n=.1,s=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=n,this.far=s,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,n,s){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=n,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2,n=i-e,s=i+e,a=r+t,l=r-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;n+=c*this.view.offsetX,s=n+c*this.view.width,a-=h*this.view.offsetY,l=a-h*this.view.height}this.projectionMatrix.makeOrthographic(n,s,a,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}};var _c=class extends Ii{constructor(){super(new ii(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}};var br=class extends et{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(q.DEFAULT_UP),this.updateMatrix(),this.target=new q,this.shadow=new _c}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}};var eo=class extends et{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}};var to=class extends et{constructor(e,t,i=10,r=10){super(e,t),this.isRectAreaLight=!0,this.type="RectAreaLight",this.width=i,this.height=r}get power(){return this.intensity*this.width*this.height*Math.PI}set power(e){this.intensity=e/(this.width*this.height*Math.PI)}copy(e){return super.copy(e),this.width=e.width,this.height=e.height,this}toJSON(e){let t=super.toJSON(e);return t.object.width=this.width,t.object.height=this.height,t}};var Mr=class{constructor(){this.isSphericalHarmonics3=!0,this.coefficients=[];for(let e=0;e<9;e++)this.coefficients.push(new w)}set(e){for(let t=0;t<9;t++)this.coefficients[t].copy(e[t]);return this}zero(){for(let e=0;e<9;e++)this.coefficients[e].set(0,0,0);return this}getAt(e,t){let i=e.x,r=e.y,n=e.z,s=this.coefficients;return t.copy(s[0]).multiplyScalar(.282095),t.addScaledVector(s[1],.488603*r),t.addScaledVector(s[2],.488603*n),t.addScaledVector(s[3],.488603*i),t.addScaledVector(s[4],1.092548*(i*r)),t.addScaledVector(s[5],1.092548*(r*n)),t.addScaledVector(s[6],.315392*(3*n*n-1)),t.addScaledVector(s[7],1.092548*(i*n)),t.addScaledVector(s[8],.546274*(i*i-r*r)),t}getIrradianceAt(e,t){let i=e.x,r=e.y,n=e.z,s=this.coefficients;return t.copy(s[0]).multiplyScalar(.886227),t.addScaledVector(s[1],2*.511664*r),t.addScaledVector(s[2],2*.511664*n),t.addScaledVector(s[3],2*.511664*i),t.addScaledVector(s[4],2*.429043*i*r),t.addScaledVector(s[5],2*.429043*r*n),t.addScaledVector(s[6],.743125*n*n-.247708),t.addScaledVector(s[7],2*.429043*i*n),t.addScaledVector(s[8],.429043*(i*i-r*r)),t}add(e){for(let t=0;t<9;t++)this.coefficients[t].add(e.coefficients[t]);return this}addScaledSH(e,t){for(let i=0;i<9;i++)this.coefficients[i].addScaledVector(e.coefficients[i],t);return this}scale(e){for(let t=0;t<9;t++)this.coefficients[t].multiplyScalar(e);return this}lerp(e,t){for(let i=0;i<9;i++)this.coefficients[i].lerp(e.coefficients[i],t);return this}equals(e){for(let t=0;t<9;t++)if(!this.coefficients[t].equals(e.coefficients[t]))return!1;return!0}copy(e){return this.set(e.coefficients)}clone(){return new this.constructor().copy(this)}fromArray(e,t=0){let i=this.coefficients;for(let r=0;r<9;r++)i[r].fromArray(e,t+r*3);return this}toArray(e=[],t=0){let i=this.coefficients;for(let r=0;r<9;r++)i[r].toArray(e,t+r*3);return e}static getBasisAt(e,t){let i=e.x,r=e.y,n=e.z;t[0]=.282095,t[1]=.488603*r,t[2]=.488603*n,t[3]=.488603*i,t[4]=1.092548*i*r,t[5]=1.092548*r*n,t[6]=.315392*(3*n*n-1),t[7]=1.092548*i*n,t[8]=.546274*(i*i-r*r)}};var io=class extends et{constructor(e=new Mr,t=1){super(void 0,t),this.isLightProbe=!0,this.sh=e}copy(e){return super.copy(e),this.sh.copy(e.sh),this}toJSON(e){let t=super.toJSON(e);return t.object.sh=this.sh.toArray(),t}};var bp={},ro=class o extends ce{constructor(e){super(e),this.textures={}}load(e,t,i,r){let n=this,s=new st(n.manager);s.setPath(n.path),s.setRequestHeader(n.requestHeader),s.setWithCredentials(n.withCredentials),s.load(e,function(a){try{t(n.parse(JSON.parse(a)))}catch(l){r?r(l):K(l),n.manager.itemError(e)}},i,r)}parse(e){let t=this.createMaterialFromType(e.type);return t.fromJSON(e,this.textures),t}setTextures(e){return this.textures=e,this}createMaterialFromType(e){return o.createMaterialFromType(e)}static createMaterialFromType(e){let i={ShadowMaterial:Os,SpriteMaterial:ur,RawShaderMaterial:zs,ShaderMaterial:St,PointsMaterial:$t,MeshPhysicalMaterial:rt,MeshStandardMaterial:ui,MeshPhongMaterial:ks,MeshToonMaterial:Vs,MeshNormalMaterial:Gs,MeshLambertMaterial:Hs,MeshDepthMaterial:Ws,MeshDistanceMaterial:qs,MeshBasicMaterial:_e,MeshMatcapMaterial:Xs,LineDashedMaterial:Ys,LineBasicMaterial:oe,Material:te,...bp}[e],r;return i===void 0?(Ut(`MaterialLoader: Unknown material type "${e}". Use .registerMaterial() before starting the deserialization process.`),r=new te):r=new i,r}static registerMaterial(e,t){bp[e]=t}};var qt=class{static extractUrlBase(e){let t=e.lastIndexOf("/");return t===-1?"./":e.slice(0,t+1)}static resolveURL(e,t){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}};var no=class extends D{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(e){return super.copy(e),this.instanceCount=e.instanceCount,this}toJSON(){let e=super.toJSON();return e.instanceCount=this.instanceCount,e.isInstancedBufferGeometry=!0,e}};var so=class extends ce{constructor(e){super(e)}load(e,t,i,r){let n=this,s=new st(n.manager);s.setPath(n.path),s.setRequestHeader(n.requestHeader),s.setWithCredentials(n.withCredentials),s.load(e,function(a){try{t(n.parse(JSON.parse(a)))}catch(l){r?r(l):K(l),n.manager.itemError(e)}},i,r)}parse(e){let t={},i={};function r(f,p){if(t[p]!==void 0)return t[p];let _=f.interleavedBuffers[p],g=n(f,_.buffer),x=rr(_.type,g),y=new Vt(x,_.stride);return y.uuid=_.uuid,_.usage!==void 0&&y.setUsage(_.usage),t[p]=y,y}function n(f,p){if(i[p]!==void 0)return i[p];let _=f.arrayBuffers[p],g=new Uint32Array(_).buffer;return i[p]=g,g}let s=e.isInstancedBufferGeometry?new no:new D,a=e.data.index;if(a!==void 0){let f=rr(a.type,a.array);s.setIndex(new $(f,1))}let l=e.data.attributes;for(let f in l){let p=l[f],m;if(p.isInterleavedBufferAttribute){let _=r(e.data,p.data);m=new Gt(_,p.itemSize,p.offset,p.normalized)}else{let _=rr(p.type,p.array),g=p.isInstancedBufferAttribute?ft:$;m=new g(_,p.itemSize,p.normalized)}p.name!==void 0&&(m.name=p.name),p.usage!==void 0&&m.setUsage(p.usage),p.gpuType!==void 0&&(m.gpuType=p.gpuType),s.setAttribute(f,m)}let c=e.data.morphAttributes;if(c)for(let f in c){let p=c[f],m=[];for(let _=0,g=p.length;_<g;_++){let x=p[_],y;if(x.isInterleavedBufferAttribute){let v=r(e.data,x.data);y=new Gt(v,x.itemSize,x.offset,x.normalized)}else{let v=rr(x.type,x.array);y=new $(v,x.itemSize,x.normalized)}x.name!==void 0&&(y.name=x.name),x.usage!==void 0&&y.setUsage(x.usage),x.gpuType!==void 0&&(y.gpuType=x.gpuType),m.push(y)}s.morphAttributes[f]=m}e.data.morphTargetsRelative&&(s.morphTargetsRelative=!0);let u=e.data.groups||e.data.drawcalls||e.data.offsets;if(u!==void 0)for(let f=0,p=u.length;f!==p;++f){let m=u[f];s.addGroup(m.start,m.count,m.materialIndex)}let d=e.data.boundingSphere;return d!==void 0&&(s.boundingSphere=new pe().fromJSON(d)),e.name&&(s.name=e.name),e.userData&&(s.userData=e.userData),s}};var qu={},xc=class extends ce{constructor(e){super(e)}load(e,t,i,r){let n=this,s=this.path===""?qt.extractUrlBase(e):this.path;this.resourcePath=this.resourcePath||s;let a=new st(this.manager);a.setPath(this.path),a.setRequestHeader(this.requestHeader),a.setWithCredentials(this.withCredentials),a.load(e,function(l){let c=null;try{c=JSON.parse(l)}catch(u){r!==void 0&&r(u),K("ObjectLoader: Can't parse "+e+".",u.message);return}let h=c.metadata;if(h===void 0||h.type===void 0||h.type.toLowerCase()==="geometry"){r!==void 0&&r(new Error("THREE.ObjectLoader: Can't load "+e)),K("ObjectLoader: Can't load "+e);return}n.parse(c,t)},i,r)}async loadAsync(e,t){let i=this,r=this.path===""?qt.extractUrlBase(e):this.path;this.resourcePath=this.resourcePath||r;let n=new st(this.manager);n.setPath(this.path),n.setRequestHeader(this.requestHeader),n.setWithCredentials(this.withCredentials);let s=await n.loadAsync(e,t),a;try{a=JSON.parse(s)}catch(c){throw new Error("THREE.ObjectLoader: Can't parse "+e+". "+c.message)}let l=a.metadata;if(l===void 0||l.type===void 0||l.type.toLowerCase()==="geometry")throw new Error("THREE.ObjectLoader: Can't load "+e);return await i.parseAsync(a)}parse(e,t){let i=this.parseAnimations(e.animations),r=this.parseShapes(e.shapes),n=this.parseGeometries(e.geometries,r),s=this.parseImages(e.images,function(){t!==void 0&&t(c)}),a=this.parseTextures(e.textures,s),l=this.parseMaterials(e.materials,a),c=this.parseObject(e.object,n,l,a,i),h=this.parseSkeletons(e.skeletons,c);if(this.bindSkeletons(c,h),this.bindLightTargets(c),t!==void 0){let u=!1;for(let d in s)if(s[d].data instanceof HTMLImageElement){u=!0;break}u===!1&&t(c)}return c}async parseAsync(e){let t=this.parseAnimations(e.animations),i=this.parseShapes(e.shapes),r=this.parseGeometries(e.geometries,i),n=await this.parseImagesAsync(e.images),s=this.parseTextures(e.textures,n),a=this.parseMaterials(e.materials,s),l=this.parseObject(e.object,r,a,s,t),c=this.parseSkeletons(e.skeletons,l);return this.bindSkeletons(l,c),this.bindLightTargets(l),l}static registerGeometry(e,t){qu[e]=t}parseShapes(e){let t={};if(e!==void 0)for(let i=0,r=e.length;i<r;i++){let n=new ei().fromJSON(e[i]);t[n.uuid]=n}return t}parseSkeletons(e,t){let i={},r={};if(t.traverse(function(n){n.isBone&&(r[n.uuid]=n)}),e!==void 0)for(let n=0,s=e.length;n<s;n++){let a=new fr().fromJSON(e[n],r);i[a.uuid]=a}return i}parseGeometries(e,t){let i={};if(e!==void 0){let r=new so;for(let n=0,s=e.length;n<s;n++){let a,l=e[n];switch(l.type){case"BufferGeometry":case"InstancedBufferGeometry":a=r.parse(l);break;default:l.type in oc?a=oc[l.type].fromJSON(l,t):l.type in qu?a=qu[l.type].fromJSON(l,t):O(`ObjectLoader: Unknown geometry type "${l.type}". Use .registerGeometry() before starting the deserialization process.`)}a.uuid=l.uuid,l.name!==void 0&&(a.name=l.name),l.userData!==void 0&&(a.userData=l.userData),i[l.uuid]=a}}return i}parseMaterials(e,t){let i={},r={};if(e!==void 0){let n=new ro;n.setTextures(t);for(let s=0,a=e.length;s<a;s++){let l=e[s];i[l.uuid]===void 0&&(i[l.uuid]=n.parse(l)),r[l.uuid]=i[l.uuid]}}return r}parseAnimations(e){let t={};if(e!==void 0)for(let i=0;i<e.length;i++){let r=e[i],n=Pt.parse(r);t[n.uuid]=n}return t}parseImages(e,t){let i=this,r={},n;function s(l){return l=i.manager.resolveURL(l),i.manager.itemStart(l),n.load(l,function(){i.manager.itemEnd(l)},void 0,function(){i.manager.itemError(l),i.manager.itemEnd(l)})}function a(l){if(typeof l=="string"){let c=l,h=/^(\/\/)|([a-z]+:(\/\/)?)/i.test(c)?c:i.resourcePath+c;return s(h)}else return l.data?{data:rr(l.type,l.data),width:l.width,height:l.height}:null}if(e!==void 0&&e.length>0){let l=new an(t);n=new ln(l),n.setCrossOrigin(this.crossOrigin);for(let c=0,h=e.length;c<h;c++){let u=e[c],d=u.url;if(Array.isArray(d)){let f=[];for(let p=0,m=d.length;p<m;p++){let _=d[p],g=a(_);g!==null&&(g instanceof HTMLImageElement?f.push(g):f.push(new Le(g.data,g.width,g.height)))}r[u.uuid]=new ut(f)}else{let f=a(u.url);r[u.uuid]=new ut(f)}}}return r}async parseImagesAsync(e){let t=this,i={},r;async function n(s){if(typeof s=="string"){let a=s,l=/^(\/\/)|([a-z]+:(\/\/)?)/i.test(a)?a:t.resourcePath+a;return await r.loadAsync(l)}else return s.data?{data:rr(s.type,s.data),width:s.width,height:s.height}:null}if(e!==void 0&&e.length>0){r=new ln(this.manager),r.setCrossOrigin(this.crossOrigin);for(let s=0,a=e.length;s<a;s++){let l=e[s],c=l.url;if(Array.isArray(c)){let h=[];for(let u=0,d=c.length;u<d;u++){let f=c[u],p=await n(f);p!==null&&(p instanceof HTMLImageElement?h.push(p):h.push(new Le(p.data,p.width,p.height)))}i[l.uuid]=new ut(h)}else{let h=await n(l.url);i[l.uuid]=new ut(h)}}}return i}parseTextures(e,t){function i(n,s){return typeof n=="number"?n:(O("ObjectLoader.parseTexture: Constant should be in numeric form.",n),s[n])}let r={};if(e!==void 0)for(let n=0,s=e.length;n<s;n++){let a=e[n];a.image===void 0&&O('ObjectLoader: No "image" specified for',a.uuid),t[a.image]===void 0&&O("ObjectLoader: Undefined image",a.image);let l=t[a.image],c=l.data,h;Array.isArray(c)?(h=new Ti,c.length===6&&(h.needsUpdate=!0)):(c&&c.data?h=new Le:h=new ne,c&&(h.needsUpdate=!0)),h.source=l,h.uuid=a.uuid,a.name!==void 0&&(h.name=a.name),a.mapping!==void 0&&(h.mapping=i(a.mapping,xv)),a.channel!==void 0&&(h.channel=a.channel),a.offset!==void 0&&h.offset.fromArray(a.offset),a.repeat!==void 0&&h.repeat.fromArray(a.repeat),a.center!==void 0&&h.center.fromArray(a.center),a.rotation!==void 0&&(h.rotation=a.rotation),a.wrap!==void 0&&(h.wrapS=i(a.wrap[0],Mp),h.wrapT=i(a.wrap[1],Mp)),a.format!==void 0&&(h.format=a.format),a.internalFormat!==void 0&&(h.internalFormat=a.internalFormat),a.type!==void 0&&(h.type=a.type),a.colorSpace!==void 0&&(h.colorSpace=a.colorSpace),a.minFilter!==void 0&&(h.minFilter=i(a.minFilter,Sp)),a.magFilter!==void 0&&(h.magFilter=i(a.magFilter,Sp)),a.anisotropy!==void 0&&(h.anisotropy=a.anisotropy),a.flipY!==void 0&&(h.flipY=a.flipY),a.generateMipmaps!==void 0&&(h.generateMipmaps=a.generateMipmaps),a.premultiplyAlpha!==void 0&&(h.premultiplyAlpha=a.premultiplyAlpha),a.unpackAlignment!==void 0&&(h.unpackAlignment=a.unpackAlignment),a.compareFunction!==void 0&&(h.compareFunction=a.compareFunction),a.normalized!==void 0&&(h.normalized=a.normalized),a.userData!==void 0&&(h.userData=a.userData),r[a.uuid]=h}return r}parseObject(e,t,i,r,n){let s;function a(d){return t[d]===void 0&&O("ObjectLoader: Undefined geometry",d),t[d]}function l(d){if(d!==void 0){if(Array.isArray(d)){let f=[];for(let p=0,m=d.length;p<m;p++){let _=d[p];i[_]===void 0&&O("ObjectLoader: Undefined material",_),f.push(i[_])}return f}return i[d]===void 0&&O("ObjectLoader: Undefined material",d),i[d]}}function c(d){return r[d]===void 0&&O("ObjectLoader: Undefined texture",d),r[d]}let h,u;switch(e.type){case"Scene":s=new ds,e.background!==void 0&&(Number.isInteger(e.background)?s.background=new L(e.background):s.background=c(e.background)),e.environment!==void 0&&(s.environment=c(e.environment)),e.fog!==void 0&&(e.fog.type==="Fog"?s.fog=new us(e.fog.color,e.fog.near,e.fog.far):e.fog.type==="FogExp2"&&(s.fog=new hs(e.fog.color,e.fog.density)),e.fog.name!==""&&(s.fog.name=e.fog.name)),e.backgroundBlurriness!==void 0&&(s.backgroundBlurriness=e.backgroundBlurriness),e.backgroundIntensity!==void 0&&(s.backgroundIntensity=e.backgroundIntensity),e.backgroundRotation!==void 0&&s.backgroundRotation.fromArray(e.backgroundRotation),e.environmentIntensity!==void 0&&(s.environmentIntensity=e.environmentIntensity),e.environmentRotation!==void 0&&s.environmentRotation.fromArray(e.environmentRotation);break;case"PerspectiveCamera":s=new be(e.fov,e.aspect,e.near,e.far),e.focus!==void 0&&(s.focus=e.focus),e.zoom!==void 0&&(s.zoom=e.zoom),e.filmGauge!==void 0&&(s.filmGauge=e.filmGauge),e.filmOffset!==void 0&&(s.filmOffset=e.filmOffset),e.view!==void 0&&(s.view=Object.assign({},e.view));break;case"OrthographicCamera":s=new ii(e.left,e.right,e.top,e.bottom,e.near,e.far),e.zoom!==void 0&&(s.zoom=e.zoom),e.view!==void 0&&(s.view=Object.assign({},e.view));break;case"AmbientLight":s=new eo(e.color,e.intensity);break;case"DirectionalLight":s=new br(e.color,e.intensity),s.target=e.target||"";break;case"PointLight":s=new wr(e.color,e.intensity,e.distance,e.decay);break;case"RectAreaLight":s=new to(e.color,e.intensity,e.width,e.height);break;case"SpotLight":s=new vr(e.color,e.intensity,e.distance,e.angle,e.penumbra,e.decay),s.target=e.target||"";break;case"HemisphereLight":s=new Qs(e.color,e.groundColor,e.intensity);break;case"LightProbe":let d=new Mr().fromArray(e.sh);s=new io(d,e.intensity);break;case"SkinnedMesh":h=a(e.geometry),u=l(e.material),s=new dr(h,u),e.bindMode!==void 0&&(s.bindMode=e.bindMode),e.bindMatrix!==void 0&&s.bindMatrix.fromArray(e.bindMatrix),e.skeleton!==void 0&&(s.skeleton=e.skeleton);break;case"Mesh":h=a(e.geometry),u=l(e.material),s=new ae(h,u);break;case"InstancedMesh":h=a(e.geometry),u=l(e.material);let f=e.count,p=e.instanceMatrix,m=e.instanceColor;s=new pr(h,u,f),s.instanceMatrix=new ft(new Float32Array(p.array),16),m!==void 0&&(s.instanceColor=new ft(new Float32Array(m.array),m.itemSize));break;case"BatchedMesh":h=a(e.geometry),u=l(e.material),s=new Es(e.maxInstanceCount,e.maxVertexCount,e.maxIndexCount,u),s.geometry=h,s.perObjectFrustumCulled=e.perObjectFrustumCulled,s.sortObjects=e.sortObjects,s._drawRanges=e.drawRanges,s._reservedRanges=e.reservedRanges,s._geometryInfo=e.geometryInfo.map(_=>{let g=null,x=null;return _.boundingBox!==void 0&&(g=new ye().fromJSON(_.boundingBox)),_.boundingSphere!==void 0&&(x=new pe().fromJSON(_.boundingSphere)),{..._,boundingBox:g,boundingSphere:x}}),s._instanceInfo=e.instanceInfo,s._availableInstanceIds=e._availableInstanceIds,s._availableGeometryIds=e._availableGeometryIds,s._nextIndexStart=e.nextIndexStart,s._nextVertexStart=e.nextVertexStart,s._geometryCount=e.geometryCount,s._maxInstanceCount=e.maxInstanceCount,s._maxVertexCount=e.maxVertexCount,s._maxIndexCount=e.maxIndexCount,s._geometryInitialized=e.geometryInitialized,s._matricesTexture=c(e.matricesTexture.uuid),s._indirectTexture=c(e.indirectTexture.uuid),e.colorsTexture!==void 0&&(s._colorsTexture=c(e.colorsTexture.uuid)),e.boundingSphere!==void 0&&(s.boundingSphere=new pe().fromJSON(e.boundingSphere)),e.boundingBox!==void 0&&(s.boundingBox=new ye().fromJSON(e.boundingBox));break;case"LOD":s=new As;break;case"Line":s=new Ze(a(e.geometry),l(e.material));break;case"LineLoop":s=new mr(a(e.geometry),l(e.material));break;case"LineSegments":s=new Ce(a(e.geometry),l(e.material));break;case"PointCloud":case"Points":s=new gr(a(e.geometry),l(e.material));break;case"Sprite":s=new Ss(l(e.material));break;case"Group":s=new vt;break;case"Bone":s=new Si;break;default:s=new q}if(s.uuid=e.uuid,e.name!==void 0&&(s.name=e.name),e.matrix!==void 0?(s.matrix.fromArray(e.matrix),e.matrixAutoUpdate!==void 0&&(s.matrixAutoUpdate=e.matrixAutoUpdate),s.matrixAutoUpdate&&s.matrix.decompose(s.position,s.quaternion,s.scale)):(e.position!==void 0&&s.position.fromArray(e.position),e.rotation!==void 0&&s.rotation.fromArray(e.rotation),e.quaternion!==void 0&&s.quaternion.fromArray(e.quaternion),e.scale!==void 0&&s.scale.fromArray(e.scale)),e.up!==void 0&&s.up.fromArray(e.up),e.pivot!==void 0&&(s.pivot=new w().fromArray(e.pivot)),e.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),e.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=e.morphTargetInfluences.slice()),e.castShadow!==void 0&&(s.castShadow=e.castShadow),e.receiveShadow!==void 0&&(s.receiveShadow=e.receiveShadow),e.shadow&&(e.shadow.intensity!==void 0&&(s.shadow.intensity=e.shadow.intensity),e.shadow.bias!==void 0&&(s.shadow.bias=e.shadow.bias),e.shadow.normalBias!==void 0&&(s.shadow.normalBias=e.shadow.normalBias),e.shadow.radius!==void 0&&(s.shadow.radius=e.shadow.radius),e.shadow.blurSamples!==void 0&&(s.shadow.blurSamples=e.shadow.blurSamples),e.shadow.focus!==void 0&&(s.shadow.focus=e.shadow.focus),e.shadow.aspect!==void 0&&(s.shadow.aspect=e.shadow.aspect),e.shadow.mapSize!==void 0&&s.shadow.mapSize.fromArray(e.shadow.mapSize),e.shadow.camera!==void 0&&(s.shadow.camera=this.parseObject(e.shadow.camera))),e.visible!==void 0&&(s.visible=e.visible),e.frustumCulled!==void 0&&(s.frustumCulled=e.frustumCulled),e.renderOrder!==void 0&&(s.renderOrder=e.renderOrder),e.static!==void 0&&(s.static=e.static),e.userData!==void 0&&(s.userData=e.userData),e.layers!==void 0&&(s.layers.mask=e.layers),e.children!==void 0){let d=e.children;for(let f=0;f<d.length;f++)s.add(this.parseObject(d[f],t,i,r,n))}if(e.animations!==void 0){let d=e.animations;for(let f=0;f<d.length;f++){let p=d[f];s.animations.push(n[p])}}if(e.type==="LOD"){e.autoUpdate!==void 0&&(s.autoUpdate=e.autoUpdate);let d=e.levels;for(let f=0;f<d.length;f++){let p=d[f],m=s.getObjectByProperty("uuid",p.object);m!==void 0&&s.addLevel(m,p.distance,p.hysteresis)}}return s}bindSkeletons(e,t){Object.keys(t).length!==0&&e.traverse(function(i){if(i.isSkinnedMesh===!0&&i.skeleton!==void 0){let r=t[i.skeleton];r===void 0?O("ObjectLoader: No skeleton found with UUID:",i.skeleton):i.bind(r,i.bindMatrix)}})}bindLightTargets(e){e.traverse(function(t){if(t.isDirectionalLight||t.isSpotLight){let i=t.target,r=e.getObjectByProperty("uuid",i);r!==void 0?t.target=r:t.target=new q}})}},xv={UVMapping:vi,CubeReflectionMapping:At,CubeRefractionMapping:Ui,EquirectangularReflectionMapping:Eo,EquirectangularRefractionMapping:kh,CubeUVReflectionMapping:Io},Mp={RepeatWrapping:Ft,ClampToEdgeWrapping:Be,MirroredRepeatWrapping:si},Sp={NearestFilter:me,NearestMipmapNearestFilter:Pr,NearestMipmapLinearFilter:Lr,LinearFilter:xe,LinearMipmapNearestFilter:Ro,LinearMipmapLinearFilter:Yt};var Xu=new WeakMap,oo=class extends ce{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&O("ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&O("ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"},this._abortController=new AbortController}setOptions(e){return this.options=e,this}load(e,t,i,r){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let n=this,s=nt.get(`image-bitmap:${e}`);if(s!==void 0){if(n.manager.itemStart(e),s.then){s.then(c=>{Xu.has(s)===!0?(r&&r(Xu.get(s)),n.manager.itemError(e),n.manager.itemEnd(e)):(t&&t(c),n.manager.itemEnd(e))});return}setTimeout(function(){t&&t(s),n.manager.itemEnd(e)},0);return}let a={};a.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",a.headers=this.requestHeader,a.signal=typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal;let l=fetch(e,a).then(function(c){return c.blob()}).then(function(c){return createImageBitmap(c,Object.assign({},n.options,{colorSpaceConversion:"none"}))}).then(function(c){return nt.add(`image-bitmap:${e}`,c),t&&t(c),n.manager.itemEnd(e),c}).catch(function(c){r&&r(c),Xu.set(l,c),nt.remove(`image-bitmap:${e}`),n.manager.itemError(e),n.manager.itemEnd(e)});nt.add(`image-bitmap:${e}`,l),n.manager.itemStart(e)}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}};var yc,Li=class{static getContext(){return yc===void 0&&(yc=new(window.AudioContext||window.webkitAudioContext)),yc}static setContext(e){yc=e}};var vc=class extends ce{constructor(e){super(e)}load(e,t,i,r){let n=this,s=new st(this.manager);s.setResponseType("arraybuffer"),s.setPath(this.path),s.setRequestHeader(this.requestHeader),s.setWithCredentials(this.withCredentials),s.load(e,function(l){try{let c=l.slice(0),h=Li.getContext(),u=e+"#decode";n.manager.itemStart(u),h.decodeAudioData(c,function(d){t(d),n.manager.itemEnd(u)}).catch(function(d){a(d),n.manager.itemEnd(u)})}catch(c){a(c)}},i,r);function a(l){r?r(l):K(l),n.manager.itemError(e)}}};var Ap=new z,Tp=new z,cn=new z,wc=class{constructor(){this.type="StereoCamera",this.aspect=1,this.eyeSep=.064,this.cameraL=new be,this.cameraL.layers.enable(1),this.cameraL.matrixAutoUpdate=!1,this.cameraR=new be,this.cameraR.layers.enable(2),this.cameraR.matrixAutoUpdate=!1,this._cache={focus:null,fov:null,aspect:null,near:null,far:null,zoom:null,eyeSep:null}}update(e){let t=this._cache;if(t.focus!==e.focus||t.fov!==e.fov||t.aspect!==e.aspect*this.aspect||t.near!==e.near||t.far!==e.far||t.zoom!==e.zoom||t.eyeSep!==this.eyeSep){t.focus=e.focus,t.fov=e.fov,t.aspect=e.aspect*this.aspect,t.near=e.near,t.far=e.far,t.zoom=e.zoom,t.eyeSep=this.eyeSep,cn.copy(e.projectionMatrix);let r=t.eyeSep/2,n=r*t.near/t.focus,s=t.near*Math.tan(Mi*t.fov*.5)/t.zoom,a,l;Tp.elements[12]=-r,Ap.elements[12]=r,a=-s*t.aspect+n,l=s*t.aspect+n,cn.elements[0]=2*t.near/(l-a),cn.elements[8]=(l+a)/(l-a),this.cameraL.projectionMatrix.copy(cn),a=-s*t.aspect-n,l=s*t.aspect-n,cn.elements[0]=2*t.near/(l-a),cn.elements[8]=(l+a)/(l-a),this.cameraR.projectionMatrix.copy(cn)}this.cameraL.matrix.copy(e.matrixWorld).multiply(Tp),this.cameraL.matrixWorldNeedsUpdate=!0,this.cameraR.matrix.copy(e.matrixWorld).multiply(Ap),this.cameraR.matrixWorldNeedsUpdate=!0}};var ao=-90,lo=1,co=class extends q{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new be(ao,lo,e,t);r.layers=this.layers,this.add(r);let n=new be(ao,lo,e,t);n.layers=this.layers,this.add(n);let s=new be(ao,lo,e,t);s.layers=this.layers,this.add(s);let a=new be(ao,lo,e,t);a.layers=this.layers,this.add(a);let l=new be(ao,lo,e,t);l.layers=this.layers,this.add(l);let c=new be(ao,lo,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,r,n,s,a,l]=t;for(let c of t)this.remove(c);if(e===tt)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),n.up.set(0,0,-1),n.lookAt(0,1,0),s.up.set(0,0,1),s.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Jt)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),n.up.set(0,0,1),n.lookAt(0,1,0),s.up.set(0,0,-1),s.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[n,s,a,l,c,h]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let m=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let _=!1;e.isWebGLRenderer===!0?_=e.state.buffers.depth.getReversed():_=e.reversedDepthBuffer,e.setRenderTarget(i,0,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(t,n),e.setRenderTarget(i,1,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(i,2,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(i,3,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(i,4,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),i.texture.generateMipmaps=m,e.setRenderTarget(i,5,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),e.setRenderTarget(u,d,f),e.xr.enabled=p,i.texture.needsPMREMUpdate=!0}};var bc=class extends be{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var ho=class{constructor(){this._previousTime=0,this._currentTime=0,this._startTime=performance.now(),this._delta=0,this._elapsed=0,this._timescale=1,this._document=null,this._pageVisibilityHandler=null}connect(e){this._document=e,e.hidden!==void 0&&(this._pageVisibilityHandler=yv.bind(this),e.addEventListener("visibilitychange",this._pageVisibilityHandler,!1))}disconnect(){this._pageVisibilityHandler!==null&&(this._document.removeEventListener("visibilitychange",this._pageVisibilityHandler),this._pageVisibilityHandler=null),this._document=null}getDelta(){return this._delta/1e3}getElapsed(){return this._elapsed/1e3}getTimescale(){return this._timescale}setTimescale(e){return this._timescale=e,this}reset(){return this._currentTime=performance.now()-this._startTime,this}dispose(){this.disconnect()}update(e){return this._pageVisibilityHandler!==null&&this._document.hidden===!0?this._delta=0:(this._previousTime=this._currentTime,this._currentTime=(e!==void 0?e:performance.now())-this._startTime,this._delta=(this._currentTime-this._previousTime)*this._timescale,this._elapsed+=this._delta),this}};function yv(){this._document.hidden===!1&&this.reset()}var hn=new w,Yu=new ge,vv=new w,un=new w,dn=new w,Mc=class extends q{constructor(){super(),this.type="AudioListener",this.context=Li.getContext(),this.gain=this.context.createGain(),this.gain.connect(this.context.destination),this.filter=null,this.timeDelta=0,this._timer=new ho}getInput(){return this.gain}removeFilter(){return this.filter!==null&&(this.gain.disconnect(this.filter),this.filter.disconnect(this.context.destination),this.gain.connect(this.context.destination),this.filter=null),this}getFilter(){return this.filter}setFilter(e){return this.filter!==null?(this.gain.disconnect(this.filter),this.filter.disconnect(this.context.destination)):this.gain.disconnect(this.context.destination),this.filter=e,this.gain.connect(this.filter),this.filter.connect(this.context.destination),this}getMasterVolume(){return this.gain.gain.value}setMasterVolume(e){return this.gain.gain.setTargetAtTime(e,this.context.currentTime,.01),this}updateMatrixWorld(e){super.updateMatrixWorld(e),this._timer.update();let t=this.context.listener;if(this.timeDelta=this._timer.getDelta(),this.matrixWorld.decompose(hn,Yu,vv),un.set(0,0,-1).applyQuaternion(Yu),dn.set(0,1,0).applyQuaternion(Yu),t.positionX){let i=this.context.currentTime+this.timeDelta;t.positionX.linearRampToValueAtTime(hn.x,i),t.positionY.linearRampToValueAtTime(hn.y,i),t.positionZ.linearRampToValueAtTime(hn.z,i),t.forwardX.linearRampToValueAtTime(un.x,i),t.forwardY.linearRampToValueAtTime(un.y,i),t.forwardZ.linearRampToValueAtTime(un.z,i),t.upX.linearRampToValueAtTime(dn.x,i),t.upY.linearRampToValueAtTime(dn.y,i),t.upZ.linearRampToValueAtTime(dn.z,i)}else t.setPosition(hn.x,hn.y,hn.z),t.setOrientation(un.x,un.y,un.z,dn.x,dn.y,dn.z)}};var Sr=class extends q{constructor(e){super(),this.type="Audio",this.listener=e,this.context=e.context,this.gain=this.context.createGain(),this.gain.connect(e.getInput()),this.autoplay=!1,this.buffer=null,this.detune=0,this.loop=!1,this.loopStart=0,this.loopEnd=0,this.offset=0,this.duration=void 0,this.playbackRate=1,this.isPlaying=!1,this.hasPlaybackControl=!0,this.source=null,this.sourceType="empty",this._startedAt=0,this._progress=0,this._connected=!1,this.filters=[]}getOutput(){return this.gain}setNodeSource(e){return this.hasPlaybackControl=!1,this.sourceType="audioNode",this.source=e,this.connect(),this}setMediaElementSource(e){return this.hasPlaybackControl=!1,this.sourceType="mediaNode",this.source=this.context.createMediaElementSource(e),this.connect(),this}setMediaStreamSource(e){return this.hasPlaybackControl=!1,this.sourceType="mediaStreamNode",this.source=this.context.createMediaStreamSource(e),this.connect(),this}setBuffer(e){return this.buffer=e,this.sourceType="buffer",this.autoplay&&this.play(),this}play(e=0){if(this.isPlaying===!0){O("Audio: Audio is already playing.");return}if(this.hasPlaybackControl===!1){O("Audio: this Audio has no playback control.");return}this._startedAt=this.context.currentTime+e;let t=this.context.createBufferSource();return t.buffer=this.buffer,t.loop=this.loop,t.loopStart=this.loopStart,t.loopEnd=this.loopEnd,t.onended=this.onEnded.bind(this),t.start(this._startedAt,this._progress+this.offset,this.duration),this.isPlaying=!0,this.source=t,this.setDetune(this.detune),this.setPlaybackRate(this.playbackRate),this.connect()}pause(){if(this.hasPlaybackControl===!1){O("Audio: this Audio has no playback control.");return}return this.isPlaying===!0&&(this._progress+=Math.max(this.context.currentTime-this._startedAt,0)*this.playbackRate,this.loop===!0&&(this._progress=this._progress%(this.duration||this.buffer.duration)),this.source.stop(),this.source.onended=null,this.isPlaying=!1),this}stop(e=0){if(this.hasPlaybackControl===!1){O("Audio: this Audio has no playback control.");return}return this._progress=0,this.source!==null&&(this.source.stop(this.context.currentTime+e),this.source.onended=null),this.isPlaying=!1,this}connect(){if(this.filters.length>0){this.source.connect(this.filters[0]);for(let e=1,t=this.filters.length;e<t;e++)this.filters[e-1].connect(this.filters[e]);this.filters[this.filters.length-1].connect(this.getOutput())}else this.source.connect(this.getOutput());return this._connected=!0,this}disconnect(){if(this._connected!==!1){if(this.filters.length>0){this.source.disconnect(this.filters[0]);for(let e=1,t=this.filters.length;e<t;e++)this.filters[e-1].disconnect(this.filters[e]);this.filters[this.filters.length-1].disconnect(this.getOutput())}else this.source.disconnect(this.getOutput());return this._connected=!1,this}}getFilters(){return this.filters}setFilters(e){return e||(e=[]),this._connected===!0?(this.disconnect(),this.filters=e.slice(),this.connect()):this.filters=e.slice(),this}setDetune(e){return this.detune=e,this.isPlaying===!0&&this.source.detune!==void 0&&this.source.detune.setTargetAtTime(this.detune,this.context.currentTime,.01),this}getDetune(){return this.detune}getFilter(){return this.getFilters()[0]}setFilter(e){return this.setFilters(e?[e]:[])}setPlaybackRate(e){if(this.hasPlaybackControl===!1){O("Audio: this Audio has no playback control.");return}return this.playbackRate=e,this.isPlaying===!0&&this.source.playbackRate.setTargetAtTime(this.playbackRate,this.context.currentTime,.01),this}getPlaybackRate(){return this.playbackRate}onEnded(){this.isPlaying=!1,this._progress=0}getLoop(){return this.hasPlaybackControl===!1?(O("Audio: this Audio has no playback control."),!1):this.loop}setLoop(e){if(this.hasPlaybackControl===!1){O("Audio: this Audio has no playback control.");return}return this.loop=e,this.isPlaying===!0&&(this.source.loop=this.loop),this}setLoopStart(e){return this.loopStart=e,this}setLoopEnd(e){return this.loopEnd=e,this}getVolume(){return this.gain.gain.value}setVolume(e){return this.gain.gain.setTargetAtTime(e,this.context.currentTime,.01),this}copy(e,t){return super.copy(e,t),e.sourceType!=="buffer"?(O("Audio: Audio source type cannot be copied."),this):(this.autoplay=e.autoplay,this.buffer=e.buffer,this.detune=e.detune,this.loop=e.loop,this.loopStart=e.loopStart,this.loopEnd=e.loopEnd,this.offset=e.offset,this.duration=e.duration,this.playbackRate=e.playbackRate,this.hasPlaybackControl=e.hasPlaybackControl,this.sourceType=e.sourceType,this.filters=e.filters.slice(),this)}clone(e){return new this.constructor(this.listener).copy(this,e)}};var fn=new w,Cp=new ge,wv=new w,pn=new w,Sc=class extends Sr{constructor(e){super(e),this.panner=this.context.createPanner(),this.panner.panningModel="HRTF",this.panner.connect(this.gain)}connect(){return super.connect(),this.panner.connect(this.gain),this}disconnect(){return super.disconnect(),this.panner.disconnect(this.gain),this}getOutput(){return this.panner}getRefDistance(){return this.panner.refDistance}setRefDistance(e){return this.panner.refDistance=e,this}getRolloffFactor(){return this.panner.rolloffFactor}setRolloffFactor(e){return this.panner.rolloffFactor=e,this}getDistanceModel(){return this.panner.distanceModel}setDistanceModel(e){return this.panner.distanceModel=e,this}getMaxDistance(){return this.panner.maxDistance}setMaxDistance(e){return this.panner.maxDistance=e,this}setDirectionalCone(e,t,i){return this.panner.coneInnerAngle=e,this.panner.coneOuterAngle=t,this.panner.coneOuterGain=i,this}updateMatrixWorld(e){if(super.updateMatrixWorld(e),this.hasPlaybackControl===!0&&this.isPlaying===!1)return;this.matrixWorld.decompose(fn,Cp,wv),pn.set(0,0,1).applyQuaternion(Cp);let t=this.panner;if(t.positionX){let i=this.context.currentTime+this.listener.timeDelta;t.positionX.linearRampToValueAtTime(fn.x,i),t.positionY.linearRampToValueAtTime(fn.y,i),t.positionZ.linearRampToValueAtTime(fn.z,i),t.orientationX.linearRampToValueAtTime(pn.x,i),t.orientationY.linearRampToValueAtTime(pn.y,i),t.orientationZ.linearRampToValueAtTime(pn.z,i)}else t.setPosition(fn.x,fn.y,fn.z),t.setOrientation(pn.x,pn.y,pn.z)}};var Ac=class{constructor(e,t=2048){this.analyser=e.context.createAnalyser(),this.analyser.fftSize=t,this.data=new Uint8Array(this.analyser.frequencyBinCount),e.getOutput().connect(this.analyser)}getFrequencyData(){return this.analyser.getByteFrequencyData(this.data),this.data}getAverageFrequency(){let e=0,t=this.getFrequencyData();for(let i=0;i<t.length;i++)e+=t[i];return e/t.length}};var uo=class{constructor(e,t,i){this.binding=e,this.valueSize=i;let r,n,s;switch(t){case"quaternion":r=this._slerp,n=this._slerpAdditive,s=this._setAdditiveIdentityQuaternion,this.buffer=new Float64Array(i*6),this._workIndex=5;break;case"string":case"bool":r=this._select,n=this._select,s=this._setAdditiveIdentityOther,this.buffer=new Array(i*5);break;default:r=this._lerp,n=this._lerpAdditive,s=this._setAdditiveIdentityNumeric,this.buffer=new Float64Array(i*5)}this._mixBufferRegion=r,this._mixBufferRegionAdditive=n,this._setIdentity=s,this._origIndex=3,this._addIndex=4,this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,this.useCount=0,this.referenceCount=0}accumulate(e,t){let i=this.buffer,r=this.valueSize,n=e*r+r,s=this.cumulativeWeight;if(s===0){for(let a=0;a!==r;++a)i[n+a]=i[a];s=t}else{s+=t;let a=t/s;this._mixBufferRegion(i,n,0,a,r)}this.cumulativeWeight=s}accumulateAdditive(e){let t=this.buffer,i=this.valueSize,r=i*this._addIndex;this.cumulativeWeightAdditive===0&&this._setIdentity(),this._mixBufferRegionAdditive(t,r,0,e,i),this.cumulativeWeightAdditive+=e}apply(e){let t=this.valueSize,i=this.buffer,r=e*t+t,n=this.cumulativeWeight,s=this.cumulativeWeightAdditive,a=this.binding;if(this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,n<1){let l=t*this._origIndex;this._mixBufferRegion(i,r,l,1-n,t)}s>0&&this._mixBufferRegionAdditive(i,r,this._addIndex*t,1,t);for(let l=t,c=t+t;l!==c;++l)if(i[l]!==i[l+t]){a.setValue(i,r);break}}saveOriginalState(){let e=this.binding,t=this.buffer,i=this.valueSize,r=i*this._origIndex;e.getValue(t,r);for(let n=i,s=r;n!==s;++n)t[n]=t[r+n%i];this._setIdentity(),this.cumulativeWeight=0,this.cumulativeWeightAdditive=0}restoreOriginalState(){let e=this.valueSize*3;this.binding.setValue(this.buffer,e)}_setAdditiveIdentityNumeric(){let e=this._addIndex*this.valueSize,t=e+this.valueSize;for(let i=e;i<t;i++)this.buffer[i]=0}_setAdditiveIdentityQuaternion(){this._setAdditiveIdentityNumeric(),this.buffer[this._addIndex*this.valueSize+3]=1}_setAdditiveIdentityOther(){let e=this._origIndex*this.valueSize,t=this._addIndex*this.valueSize;for(let i=0;i<this.valueSize;i++)this.buffer[t+i]=this.buffer[e+i]}_select(e,t,i,r,n){if(r>=.5)for(let s=0;s!==n;++s)e[t+s]=e[i+s]}_slerp(e,t,i,r){ge.slerpFlat(e,t,e,t,e,i,r)}_slerpAdditive(e,t,i,r,n){let s=this._workIndex*n;ge.multiplyQuaternionsFlat(e,s,e,t,e,i),ge.slerpFlat(e,t,e,t,e,s,r)}_lerp(e,t,i,r,n){let s=1-r;for(let a=0;a!==n;++a){let l=t+a;e[l]=e[l]*s+e[i+a]*r}}_lerpAdditive(e,t,i,r,n){for(let s=0;s!==n;++s){let a=t+s;e[a]=e[a]+e[i+s]*r}}};var Ju="\\[\\]\\.:\\/",bv=new RegExp("["+Ju+"]","g"),Ku="[^"+Ju+"]",Mv="[^"+Ju.replace("\\.","")+"]",Sv=/((?:WC+[\/:])*)/.source.replace("WC",Ku),Av=/(WCOD+)?/.source.replace("WCOD",Mv),Tv=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Ku),Cv=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Ku),Ev=new RegExp("^"+Sv+Av+Tv+Cv+"$"),Iv=["material","materials","bones","map"],Zu=class{constructor(e,t,i){let r=i||le.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let i=this._targetGroup.nCachedObjects_,r=this._bindings[i];r!==void 0&&r.getValue(e,t)}setValue(e,t){let i=this._bindings;for(let r=this._targetGroup.nCachedObjects_,n=i.length;r!==n;++r)i[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].unbind()}},le=class o{constructor(e,t,i){this.path=t,this.parsedPath=i||o.parseTrackName(t),this.node=o.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new o.Composite(e,t,i):new o(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(bv,"")}static parseTrackName(e){let t=Ev.exec(e);if(t===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+e);let i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=i.nodeName&&i.nodeName.lastIndexOf(".");if(r!==void 0&&r!==-1){let n=i.nodeName.substring(r+1);Iv.indexOf(n)!==-1&&(i.nodeName=i.nodeName.substring(0,r),i.objectName=n)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){let i=function(n){for(let s=0;s<n.length;s++){let a=n[s];if(a.name===t||a.uuid===t)return a;let l=i(a.children);if(l)return l}return null},r=i(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let i=this.resolvedProperty;for(let r=0,n=i.length;r!==n;++r)e[t++]=i[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let i=this.resolvedProperty;for(let r=0,n=i.length;r!==n;++r)i[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let i=this.resolvedProperty;for(let r=0,n=i.length;r!==n;++r)i[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let i=this.resolvedProperty;for(let r=0,n=i.length;r!==n;++r)i[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,i=t.objectName,r=t.propertyName,n=t.propertyIndex;if(e||(e=o.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){O("PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=t.objectIndex;switch(i){case"materials":if(!e.material){K("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){K("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){K("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){K("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){K("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[i]===void 0){K("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[i]}if(c!==void 0){if(e[c]===void 0){K("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let s=e[r];if(s===void 0){let c=t.nodeName;K("PropertyBinding: Trying to update property for track: "+c+"."+r+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?a=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(n!==void 0){if(r==="morphTargetInfluences"){if(!e.geometry){K("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){K("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[n]!==void 0&&(n=e.morphTargetDictionary[n])}l=this.BindingType.ArrayElement,this.resolvedProperty=s,this.propertyIndex=n}else s.fromArray!==void 0&&s.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=s):Array.isArray(s)?(l=this.BindingType.EntireArray,this.resolvedProperty=s):this.propertyName=r;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};le.Composite=Zu;le.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};le.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};le.prototype.GetterByBindingType=[le.prototype._getValue_direct,le.prototype._getValue_array,le.prototype._getValue_arrayElement,le.prototype._getValue_toArray];le.prototype.SetterByBindingTypeAndVersioning=[[le.prototype._setValue_direct,le.prototype._setValue_direct_setNeedsUpdate,le.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[le.prototype._setValue_array,le.prototype._setValue_array_setNeedsUpdate,le.prototype._setValue_array_setMatrixWorldNeedsUpdate],[le.prototype._setValue_arrayElement,le.prototype._setValue_arrayElement_setNeedsUpdate,le.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[le.prototype._setValue_fromArray,le.prototype._setValue_fromArray_setNeedsUpdate,le.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Tc=class{constructor(){this.isAnimationObjectGroup=!0,this.uuid=Pe(),this._objects=Array.prototype.slice.call(arguments),this.nCachedObjects_=0;let e={};this._indicesByUUID=e;for(let i=0,r=arguments.length;i!==r;++i)e[arguments[i].uuid]=i;this._paths=[],this._parsedPaths=[],this._bindings=[],this._bindingsIndicesByPath={};let t=this;this.stats={objects:{get total(){return t._objects.length},get inUse(){return this.total-t.nCachedObjects_}},get bindingsPerObject(){return t._bindings.length}}}add(){let e=this._objects,t=this._indicesByUUID,i=this._paths,r=this._parsedPaths,n=this._bindings,s=n.length,a,l=e.length,c=this.nCachedObjects_;for(let h=0,u=arguments.length;h!==u;++h){let d=arguments[h],f=d.uuid,p=t[f];if(p===void 0){p=l++,t[f]=p,e.push(d);for(let m=0,_=s;m!==_;++m)n[m].push(new le(d,i[m],r[m]))}else if(p<c){a=e[p];let m=--c,_=e[m];t[_.uuid]=p,e[p]=_,t[f]=m,e[m]=d;for(let g=0,x=s;g!==x;++g){let y=n[g],v=y[m],M=y[p];y[p]=v,M===void 0&&(M=new le(d,i[g],r[g])),y[m]=M}}else e[p]!==a&&K("AnimationObjectGroup: Different objects with the same UUID detected. Clean the caches or recreate your infrastructure when reloading scenes.")}this.nCachedObjects_=c}remove(){let e=this._objects,t=this._indicesByUUID,i=this._bindings,r=i.length,n=this.nCachedObjects_;for(let s=0,a=arguments.length;s!==a;++s){let l=arguments[s],c=l.uuid,h=t[c];if(h!==void 0&&h>=n){let u=n++,d=e[u];t[d.uuid]=h,e[h]=d,t[c]=u,e[u]=l;for(let f=0,p=r;f!==p;++f){let m=i[f],_=m[u],g=m[h];m[h]=_,m[u]=g}}}this.nCachedObjects_=n}uncache(){let e=this._objects,t=this._indicesByUUID,i=this._bindings,r=i.length,n=this.nCachedObjects_,s=e.length;for(let a=0,l=arguments.length;a!==l;++a){let c=arguments[a],h=c.uuid,u=t[h];if(u!==void 0)if(delete t[h],u<n){let d=--n,f=e[d],p=--s,m=e[p];u!==d&&(t[f.uuid]=u),e[u]=f,d!==p&&(t[m.uuid]=d),e[d]=m,e.pop();for(let _=0,g=r;_!==g;++_){let x=i[_],y=x[d],v=x[p];x[u]=y,x[d]=v,x.pop()}}else{let d=--s,f=e[d];u!==d&&(t[f.uuid]=u),e[u]=f,e.pop();for(let p=0,m=r;p!==m;++p){let _=i[p];_[u]=_[d],_.pop()}}}this.nCachedObjects_=n}subscribe_(e,t){let i=this._bindingsIndicesByPath,r=i[e],n=this._bindings;if(r!==void 0)return n[r];let s=this._paths,a=this._parsedPaths,l=this._objects,c=l.length,h=this.nCachedObjects_,u=new Array(c);r=n.length,i[e]=r,s.push(e),a.push(t),n.push(u);for(let d=h,f=l.length;d!==f;++d){let p=l[d];u[d]=new le(p,e,t)}return u}unsubscribe_(e){let t=this._bindingsIndicesByPath,i=t[e];if(i!==void 0){let r=this._paths,n=this._parsedPaths,s=this._bindings,a=s.length-1,l=s[a],c=r[a];t[c]=i,s[i]=l,s.pop(),n[i]=n[a],n.pop(),r[i]=r[a],r.pop()}}};var fo=class{constructor(e,t,i=null,r=t.blendMode){this._mixer=e,this._clip=t,this._localRoot=i,this.blendMode=r;let n=t.tracks,s=n.length,a=new Array(s),l={endingStart:ki,endingEnd:ki};for(let c=0;c!==s;++c){let h=n[c].createInterpolant(null);a[c]=h,h.settings=l}this._interpolantSettings=l,this._interpolants=a,this._propertyBindings=new Array(s),this._cacheIndex=null,this._byClipCacheIndex=null,this._timeScaleInterpolant=null,this._restoreTimeScale=null,this._weightInterpolant=null,this.loop=Hh,this._loopCount=-1,this._startTime=null,this.time=0,this.timeScale=1,this._effectiveTimeScale=1,this.weight=1,this._effectiveWeight=1,this.repetitions=1/0,this.paused=!1,this.enabled=!0,this.clampWhenFinished=!1,this.zeroSlopeAtStart=!0,this.zeroSlopeAtEnd=!0}play(){return this._mixer._activateAction(this),this}stop(){return this._mixer._deactivateAction(this),this.reset()}reset(){return this.paused=!1,this.enabled=!0,this.time=0,this._loopCount=-1,this._startTime=null,this.stopFading().stopWarping()}isRunning(){return this.enabled&&!this.paused&&this.timeScale!==0&&this._startTime===null&&this._mixer._isActiveAction(this)}isScheduled(){return this._mixer._isActiveAction(this)}startAt(e){return this._startTime=e,this}setLoop(e,t){return this.loop=e,this.repetitions=t,this}setEffectiveWeight(e){return this.weight=e,this._effectiveWeight=this.enabled?e:0,this.stopFading()}getEffectiveWeight(){return this._effectiveWeight}fadeIn(e){return this._scheduleFading(e,0,1)}fadeOut(e){return this._scheduleFading(e,1,0)}crossFadeFrom(e,t,i=!1){if(e.fadeOut(t),this.fadeIn(t),i===!0){let r=this._clip.duration,n=e._clip.duration,s=n/r,a=r/n;e._restoreTimeScale=e.timeScale,this._restoreTimeScale=this.timeScale,e.warp(1,s,t),this.warp(a,1,t)}return this}crossFadeTo(e,t,i=!1){return e.crossFadeFrom(this,t,i)}stopFading(){let e=this._weightInterpolant;return e!==null&&(this._weightInterpolant=null,this._mixer._takeBackControlInterpolant(e)),this}setEffectiveTimeScale(e){return this.timeScale=e,this._effectiveTimeScale=this.paused?0:e,this.stopWarping()}getEffectiveTimeScale(){return this._effectiveTimeScale}setDuration(e){return this.timeScale=this._clip.duration/e,this.stopWarping()}syncWith(e){return this.time=e.time,this.timeScale=e.timeScale,this.stopWarping()}halt(e){return this.warp(this._effectiveTimeScale,0,e)}warp(e,t,i){let r=this._mixer,n=r.time,s=this.timeScale,a=this._timeScaleInterpolant;a===null&&(a=r._lendControlInterpolant(),this._timeScaleInterpolant=a);let l=a.parameterPositions,c=a.sampleValues;return l[0]=n,l[1]=n+i,c[0]=e/s,c[1]=t/s,this}stopWarping(){let e=this._timeScaleInterpolant;return e!==null&&(this._timeScaleInterpolant=null,this._mixer._takeBackControlInterpolant(e)),this._restoreTimeScale=null,this}getMixer(){return this._mixer}getClip(){return this._clip}getRoot(){return this._localRoot||this._mixer._root}_update(e,t,i,r){if(!this.enabled){this._updateWeight(e);return}let n=this._startTime;if(n!==null){let l=(e-n)*i;l<0||i===0?t=0:(this._startTime=null,t=i*l)}t*=this._updateTimeScale(e);let s=this._updateTime(t),a=this._updateWeight(e);if(a>0){let l=this._interpolants,c=this._propertyBindings;switch(this.blendMode){case Xo:for(let h=0,u=l.length;h!==u;++h)l[h].evaluate(s),c[h].accumulateAdditive(a);break;case zr:default:for(let h=0,u=l.length;h!==u;++h)l[h].evaluate(s),c[h].accumulate(r,a)}}}_updateWeight(e){let t=0;if(this.enabled){t=this.weight;let i=this._weightInterpolant;if(i!==null){let r=i.evaluate(e)[0];t*=r,e>i.parameterPositions[1]&&(this.stopFading(),r===0&&(this.enabled=!1))}}return this._effectiveWeight=t,t}_updateTimeScale(e){let t=0;if(!this.paused){t=this.timeScale;let i=this._timeScaleInterpolant;if(i!==null){let r=i.evaluate(e)[0];t*=r,e>i.parameterPositions[1]&&(t===0?this.paused=!0:(this._restoreTimeScale!==null&&(t=this._restoreTimeScale),this.timeScale=t),this.stopWarping())}}return this._effectiveTimeScale=t,t}_updateTime(e){let t=this._clip.duration,i=this.loop,r=this.time+e,n=this._loopCount,s=i===Wh;if(e===0)return n===-1?r:s&&(n&1)===1?t-r:r;if(i===Gh){n===-1&&(this._loopCount=0,this._setEndings(!0,!0,!1));e:{if(r>=t)r=t;else if(r<0)r=0;else{this.time=r;break e}this.clampWhenFinished?this.paused=!0:this.enabled=!1,this.time=r,this._mixer.dispatchEvent({type:"finished",action:this,direction:e<0?-1:1})}}else{if(n===-1&&(e>=0?(n=0,this._setEndings(!0,this.repetitions===0,s)):this._setEndings(this.repetitions===0,!0,s)),r>=t||r<0){let a=Math.floor(r/t);r-=t*a,n+=Math.abs(a);let l=this.repetitions-n;if(l<=0)this.clampWhenFinished?this.paused=!0:this.enabled=!1,r=e>0?t:0,this.time=r,this._mixer.dispatchEvent({type:"finished",action:this,direction:e>0?1:-1});else{if(l===1){let c=e<0;this._setEndings(c,!c,s)}else this._setEndings(!1,!1,s);this._loopCount=n,this.time=r,this._mixer.dispatchEvent({type:"loop",action:this,loopDelta:a})}}else this._loopCount=n,this.time=r;if(s&&(n&1)===1)return t-r}return r}_setEndings(e,t,i){let r=this._interpolantSettings;i?(r.endingStart=Vi,r.endingEnd=Vi):(e?r.endingStart=this.zeroSlopeAtStart?Vi:ki:r.endingStart=Ur,t?r.endingEnd=this.zeroSlopeAtEnd?Vi:ki:r.endingEnd=Ur)}_scheduleFading(e,t,i){let r=this._mixer,n=r.time,s=this._weightInterpolant;s===null&&(s=r._lendControlInterpolant(),this._weightInterpolant=s);let a=s.parameterPositions,l=s.sampleValues;return a[0]=n,l[0]=t,a[1]=n+e,l[1]=i,this}};var Rv=new Float32Array(1),ya=class extends Fe{constructor(e){super(),this._root=e,this._initMemoryManager(),this._accuIndex=0,this.time=0,this.timeScale=1}_bindAction(e,t){let i=e._localRoot||this._root,r=e._clip.tracks,n=r.length,s=e._propertyBindings,a=e._interpolants,l=i.uuid,c=this._bindingsByRootAndName,h=c[l];h===void 0&&(h={},c[l]=h);for(let u=0;u!==n;++u){let d=r[u],f=d.name,p=h[f];if(p!==void 0)++p.referenceCount,s[u]=p;else{if(p=s[u],p!==void 0){p._cacheIndex===null&&(++p.referenceCount,this._addInactiveBinding(p,l,f));continue}let m=t&&t._propertyBindings[u].binding.parsedPath;p=new uo(le.create(i,f,m),d.ValueTypeName,d.getValueSize()),++p.referenceCount,this._addInactiveBinding(p,l,f),s[u]=p}a[u].resultBuffer=p.buffer}}_activateAction(e){if(!this._isActiveAction(e)){if(e._cacheIndex===null){let i=(e._localRoot||this._root).uuid,r=e._clip.uuid,n=this._actionsByClip[r];this._bindAction(e,n&&n.knownActions[0]),this._addInactiveAction(e,r,i)}let t=e._propertyBindings;for(let i=0,r=t.length;i!==r;++i){let n=t[i];n.useCount++===0&&(this._lendBinding(n),n.saveOriginalState())}this._lendAction(e)}}_deactivateAction(e){if(this._isActiveAction(e)){let t=e._propertyBindings;for(let i=0,r=t.length;i!==r;++i){let n=t[i];--n.useCount===0&&(n.restoreOriginalState(),this._takeBackBinding(n))}this._takeBackAction(e)}}_initMemoryManager(){this._actions=[],this._nActiveActions=0,this._actionsByClip={},this._bindings=[],this._nActiveBindings=0,this._bindingsByRootAndName={},this._controlInterpolants=[],this._nActiveControlInterpolants=0;let e=this;this.stats={actions:{get total(){return e._actions.length},get inUse(){return e._nActiveActions}},bindings:{get total(){return e._bindings.length},get inUse(){return e._nActiveBindings}},controlInterpolants:{get total(){return e._controlInterpolants.length},get inUse(){return e._nActiveControlInterpolants}}}}_isActiveAction(e){let t=e._cacheIndex;return t!==null&&t<this._nActiveActions}_addInactiveAction(e,t,i){let r=this._actions,n=this._actionsByClip,s=n[t];if(s===void 0)s={knownActions:[e],actionByRoot:{}},e._byClipCacheIndex=0,n[t]=s;else{let a=s.knownActions;e._byClipCacheIndex=a.length,a.push(e)}e._cacheIndex=r.length,r.push(e),s.actionByRoot[i]=e}_removeInactiveAction(e){let t=this._actions,i=t[t.length-1],r=e._cacheIndex;i._cacheIndex=r,t[r]=i,t.pop(),e._cacheIndex=null;let n=e._clip.uuid,s=this._actionsByClip,a=s[n],l=a.knownActions,c=l[l.length-1],h=e._byClipCacheIndex;c._byClipCacheIndex=h,l[h]=c,l.pop(),e._byClipCacheIndex=null;let u=a.actionByRoot,d=(e._localRoot||this._root).uuid;delete u[d],l.length===0&&delete s[n],this._removeInactiveBindingsForAction(e)}_removeInactiveBindingsForAction(e){let t=e._propertyBindings;for(let i=0,r=t.length;i!==r;++i){let n=t[i];--n.referenceCount===0&&this._removeInactiveBinding(n)}}_lendAction(e){let t=this._actions,i=e._cacheIndex,r=this._nActiveActions++,n=t[r];e._cacheIndex=r,t[r]=e,n._cacheIndex=i,t[i]=n}_takeBackAction(e){let t=this._actions,i=e._cacheIndex,r=--this._nActiveActions,n=t[r];e._cacheIndex=r,t[r]=e,n._cacheIndex=i,t[i]=n}_addInactiveBinding(e,t,i){let r=this._bindingsByRootAndName,n=this._bindings,s=r[t];s===void 0&&(s={},r[t]=s),s[i]=e,e._cacheIndex=n.length,n.push(e)}_removeInactiveBinding(e){let t=this._bindings,i=e.binding,r=i.rootNode.uuid,n=i.path,s=this._bindingsByRootAndName,a=s[r],l=t[t.length-1],c=e._cacheIndex;l._cacheIndex=c,t[c]=l,t.pop(),delete a[n],Object.keys(a).length===0&&delete s[r]}_lendBinding(e){let t=this._bindings,i=e._cacheIndex,r=this._nActiveBindings++,n=t[r];e._cacheIndex=r,t[r]=e,n._cacheIndex=i,t[i]=n}_takeBackBinding(e){let t=this._bindings,i=e._cacheIndex,r=--this._nActiveBindings,n=t[r];e._cacheIndex=r,t[r]=e,n._cacheIndex=i,t[i]=n}_lendControlInterpolant(){let e=this._controlInterpolants,t=this._nActiveControlInterpolants++,i=e[t];return i===void 0&&(i=new xr(new Float32Array(2),new Float32Array(2),1,Rv),i.__cacheIndex=t,e[t]=i),i}_takeBackControlInterpolant(e){let t=this._controlInterpolants,i=e.__cacheIndex,r=--this._nActiveControlInterpolants,n=t[r];e.__cacheIndex=r,t[r]=e,n.__cacheIndex=i,t[i]=n}clipAction(e,t,i){let r=t||this._root,n=r.uuid,s=typeof e=="string"?Pt.findByName(r,e):e,a=s!==null?s.uuid:e,l=this._actionsByClip[a],c=null;if(i===void 0&&(s!==null?i=s.blendMode:i=zr),l!==void 0){let u=l.actionByRoot[n];if(u!==void 0&&u.blendMode===i)return u;c=l.knownActions[0],s===null&&(s=c._clip)}if(s===null)return null;let h=new fo(this,s,t,i);return this._bindAction(h,c),this._addInactiveAction(h,a,n),h}existingAction(e,t){let i=t||this._root,r=i.uuid,n=typeof e=="string"?Pt.findByName(i,e):e,s=n?n.uuid:e,a=this._actionsByClip[s];return a!==void 0&&a.actionByRoot[r]||null}stopAllAction(){let e=this._actions,t=this._nActiveActions;for(let i=t-1;i>=0;--i)e[i].stop();return this}update(e){e*=this.timeScale;let t=this._actions,i=this._nActiveActions,r=this.time+=e,n=Math.sign(e),s=this._accuIndex^=1;for(let c=0;c!==i;++c)t[c]._update(r,e,n,s);let a=this._bindings,l=this._nActiveBindings;for(let c=0;c!==l;++c)a[c].apply(s);return this}setTime(e){this.time=0;for(let t=0;t<this._actions.length;t++)this._actions[t].time=0;return this.update(e)}getRoot(){return this._root}uncacheClip(e){let t=this._actions,i=e.uuid,r=this._actionsByClip,n=r[i];if(n!==void 0){let s=n.knownActions;for(let a=0,l=s.length;a!==l;++a){let c=s[a];this._deactivateAction(c);let h=c._cacheIndex,u=t[t.length-1];c._cacheIndex=null,c._byClipCacheIndex=null,u._cacheIndex=h,t[h]=u,t.pop(),this._removeInactiveBindingsForAction(c)}delete r[i]}}uncacheRoot(e){let t=e.uuid,i=this._actionsByClip;for(let s in i){let a=i[s].actionByRoot,l=a[t];l!==void 0&&(this._deactivateAction(l),this._removeInactiveAction(l))}let r=this._bindingsByRootAndName,n=r[t];if(n!==void 0)for(let s in n){let a=n[s];a.restoreOriginalState(),this._removeInactiveBinding(a)}}uncacheAction(e,t){let i=this.existingAction(e,t);i!==null&&(this._deactivateAction(i),this._removeInactiveAction(i))}};var Cc=class extends nr{constructor(e=1,t=1,i=1,r={}){super(e,t,r),this.isRenderTarget3D=!0,this.depth=i;for(let n=0;n<this.textures.length;n++){let s=new sr(null,e,t,i);s.isRenderTargetTexture=!0,s.renderTarget=this,this.textures[n]=s}this._setTextureOptions(r)}};var Ec=class o{constructor(e){this.value=e}clone(){return new o(this.value.clone===void 0?this.value:this.value.clone())}};var Pv=0,Ic=class extends Fe{constructor(){super(),this.isUniformsGroup=!0,Object.defineProperty(this,"id",{value:Pv++}),this.name="",this.usage=Vr,this.uniforms=[]}add(e){return this.uniforms.push(e),this}remove(e){let t=this.uniforms.indexOf(e);return t!==-1&&this.uniforms.splice(t,1),this}setName(e){return this.name=e,this}setUsage(e){return this.usage=e,this}dispose(){this.dispatchEvent({type:"dispose"})}copy(e){this.name=e.name,this.usage=e.usage;let t=e.uniforms;this.uniforms.length=0;for(let i=0,r=t.length;i<r;i++){let n=Array.isArray(t[i])?t[i]:[t[i]];for(let s=0;s<n.length;s++)this.uniforms.push(n[s].clone())}return this}clone(){return new this.constructor().copy(this)}};var Rc=class extends Vt{constructor(e,t,i=1){super(e,t),this.isInstancedInterleavedBuffer=!0,this.meshPerAttribute=i}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}clone(e){let t=super.clone(e);return t.meshPerAttribute=this.meshPerAttribute,t}toJSON(e){let t=super.toJSON(e);return t.isInstancedInterleavedBuffer=!0,t.meshPerAttribute=this.meshPerAttribute,t}};var Pc=class{constructor(e,t,i,r,n,s=!1){this.isGLBufferAttribute=!0,this.name="",this.buffer=e,this.type=t,this.itemSize=i,this.elementSize=r,this.count=n,this.normalized=s,this.version=0}set needsUpdate(e){e===!0&&this.version++}setBuffer(e){return this.buffer=e,this}setType(e,t){return this.type=e,this.elementSize=t,this}setItemSize(e){return this.itemSize=e,this}setCount(e){return this.count=e,this}};var Ep=new z,Lc=class{constructor(e,t,i=0,r=1/0){this.ray=new Et(e,t),this.near=i,this.far=r,this.camera=null,this.layers=new ar,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,t.projectionMatrix.elements[14]).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):K("Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return Ep.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Ep),this}intersectObject(e,t=!0,i=[]){return ju(e,this,i,t),i.sort(Ip),i}intersectObjects(e,t=!0,i=[]){for(let r=0,n=e.length;r<n;r++)ju(e[r],this,i,t);return i.sort(Ip),i}};function Ip(o,e){return o.distance-e.distance}function ju(o,e,t,i){let r=!0;if(o.layers.test(e.layers)&&o.raycast(e,t)===!1&&(r=!1),r===!0&&i===!0){let n=o.children;for(let s=0,a=n.length;s<a;s++)ju(n[s],e,t,!0)}}var Nc=class{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1,O("Clock: This module has been deprecated. Please use THREE.Timer instead.")}start(){this.startTime=performance.now(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){let t=performance.now();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}};var Dc=class{constructor(e=1,t=0,i=0){this.radius=e,this.phi=t,this.theta=i}set(e,t,i){return this.radius=e,this.phi=t,this.theta=i,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=W(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,i){return this.radius=Math.sqrt(e*e+t*t+i*i),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,i),this.phi=Math.acos(W(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var Bc=class{constructor(e=1,t=0,i=0){this.radius=e,this.theta=t,this.y=i}set(e,t,i){return this.radius=e,this.theta=t,this.y=i,this}copy(e){return this.radius=e.radius,this.theta=e.theta,this.y=e.y,this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,i){return this.radius=Math.sqrt(e*e+i*i),this.theta=Math.atan2(e,i),this.y=t,this}clone(){return new this.constructor().copy(this)}};var $u=class $u{constructor(e,t,i,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,i,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let i=0;i<4;i++)this.elements[i]=e[i+t];return this}set(e,t,i,r){let n=this.elements;return n[0]=e,n[2]=t,n[1]=i,n[3]=r,this}};$u.prototype.isMatrix2=!0;var Fc=$u;var Rp=new E,po=class{constructor(e=new E(1/0,1/0),t=new E(-1/0,-1/0)){this.isBox2=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=Rp.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=1/0,this.max.x=this.max.y=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y}getCenter(e){return this.isEmpty()?e.set(0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Rp).distanceTo(e)}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}};var Pp=new w,Oc=new w,mo=new w,go=new w,Qu=new w,Lv=new w,Nv=new w,Uc=class{constructor(e=new w,t=new w){this.start=e,this.end=t}set(e,t){return this.start.copy(e),this.end.copy(t),this}copy(e){return this.start.copy(e.start),this.end.copy(e.end),this}getCenter(e){return e.addVectors(this.start,this.end).multiplyScalar(.5)}delta(e){return e.subVectors(this.end,this.start)}distanceSq(){return this.start.distanceToSquared(this.end)}distance(){return this.start.distanceTo(this.end)}at(e,t){return this.delta(t).multiplyScalar(e).add(this.start)}closestPointToPointParameter(e,t){Pp.subVectors(e,this.start),Oc.subVectors(this.end,this.start);let i=Oc.dot(Oc);if(i===0)return 0;let n=Oc.dot(Pp)/i;return t&&(n=W(n,0,1)),n}closestPointToPoint(e,t,i){let r=this.closestPointToPointParameter(e,t);return this.delta(i).multiplyScalar(r).add(this.start)}distanceSqToLine3(e,t=Lv,i=Nv){let r=10000000000000001e-32,n,s,a=this.start,l=e.start,c=this.end,h=e.end;mo.subVectors(c,a),go.subVectors(h,l),Qu.subVectors(a,l);let u=mo.dot(mo),d=go.dot(go),f=go.dot(Qu);if(u<=r&&d<=r)return t.copy(a),i.copy(l),t.sub(i),t.dot(t);if(u<=r)n=0,s=f/d,s=W(s,0,1);else{let p=mo.dot(Qu);if(d<=r)s=0,n=W(-p/u,0,1);else{let m=mo.dot(go),_=u*d-m*m;_!==0?n=W((m*f-p*d)/_,0,1):n=0,s=(m*n+f)/d,s<0?(s=0,n=W(-p/u,0,1)):s>1&&(s=1,n=W((m-p)/u,0,1))}}return t.copy(a).addScaledVector(mo,n),i.copy(l).addScaledVector(go,s),t.distanceToSquared(i)}applyMatrix4(e){return this.start.applyMatrix4(e),this.end.applyMatrix4(e),this}equals(e){return e.start.equals(this.start)&&e.end.equals(this.end)}clone(){return new this.constructor().copy(this)}};var Lp=new w,zc=class extends q{constructor(e,t){super(),this.light=e,this.matrixAutoUpdate=!1,this.color=t,this.type="SpotLightHelper";let i=new D,r=[0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,-1,0,1,0,0,0,0,1,1,0,0,0,0,-1,1];for(let s=0,a=1,l=32;s<l;s++,a++){let c=s/l*Math.PI*2,h=a/l*Math.PI*2;r.push(Math.cos(c),Math.sin(c),1,Math.cos(h),Math.sin(h),1)}i.setAttribute("position",new R(r,3));let n=new oe({fog:!1,toneMapped:!1});this.cone=new Ce(i,n),this.add(this.cone),this.update()}dispose(){super.dispose(),this.cone.geometry.dispose(),this.cone.material.dispose()}update(){this.light.updateWorldMatrix(!0,!1),this.light.target.updateWorldMatrix(!0,!1),this.parent?(this.parent.updateWorldMatrix(!0),this.matrix.copy(this.parent.matrixWorld).invert().multiply(this.light.matrixWorld)):this.matrix.copy(this.light.matrixWorld),this.matrixWorldNeedsUpdate=!0;let e=this.light.distance?this.light.distance:1e3,t=e*Math.tan(this.light.angle);this.cone.scale.set(t,t,e),Lp.setFromMatrixPosition(this.light.target.matrixWorld),this.cone.lookAt(Lp),this.color!==void 0?this.cone.material.color.set(this.color):this.cone.material.color.copy(this.light.color)}};var Ar=new w,kc=new z,ed=new z,va=class extends Ce{constructor(e){let t=Np(e),i=new D,r=[],n=[];for(let c=0;c<t.length;c++){let h=t[c];h.parent&&h.parent.isBone&&(r.push(0,0,0),r.push(0,0,0),n.push(0,0,0),n.push(0,0,0))}i.setAttribute("position",new R(r,3)),i.setAttribute("color",new R(n,3));let s=new oe({vertexColors:!0,depthTest:!1,depthWrite:!1,toneMapped:!1,transparent:!0});super(i,s),this.isSkeletonHelper=!0,this.type="SkeletonHelper",this.root=e,this.bones=t,this.matrix=e.matrixWorld,this.matrixAutoUpdate=!1;let a=new L(255),l=new L(65280);this.setColors(a,l)}updateMatrixWorld(e){let t=this.bones,i=this.geometry,r=i.getAttribute("position");ed.copy(this.root.matrixWorld).invert();for(let n=0,s=0;n<t.length;n++){let a=t[n];a.parent&&a.parent.isBone&&(kc.multiplyMatrices(ed,a.matrixWorld),Ar.setFromMatrixPosition(kc),r.setXYZ(s,Ar.x,Ar.y,Ar.z),kc.multiplyMatrices(ed,a.parent.matrixWorld),Ar.setFromMatrixPosition(kc),r.setXYZ(s+1,Ar.x,Ar.y,Ar.z),s+=2)}i.getAttribute("position").needsUpdate=!0,super.updateMatrixWorld(e)}setColors(e,t){let r=this.geometry.getAttribute("color");for(let n=0;n<r.count;n+=2)r.setXYZ(n,e.r,e.g,e.b),r.setXYZ(n+1,t.r,t.g,t.b);return r.needsUpdate=!0,this}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};function Np(o){let e=[];o.isBone===!0&&e.push(o);for(let t=0;t<o.children.length;t++)e.push(...Np(o.children[t]));return e}var Vc=class extends ae{constructor(e,t,i){let r=new Fs(t,4,2),n=new _e({wireframe:!0,fog:!1,toneMapped:!1});super(r,n),this.light=e,this.color=i,this.type="PointLightHelper",this.matrix=this.light.matrixWorld,this.matrixAutoUpdate=!1,this.update()}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}update(){this.matrixWorldNeedsUpdate=!0,this.light.updateWorldMatrix(!0,!1),this.color!==void 0?this.material.color.set(this.color):this.material.color.copy(this.light.color)}};var Dv=new w,Dp=new L,Bp=new L,Gc=class extends q{constructor(e,t,i){super(),this.light=e,this.matrix=e.matrixWorld,this.matrixAutoUpdate=!1,this.color=i,this.type="HemisphereLightHelper";let r=new Bs(t);r.rotateY(Math.PI*.5),this.material=new _e({wireframe:!0,fog:!1,toneMapped:!1}),this.color===void 0&&(this.material.vertexColors=!0);let n=r.getAttribute("position"),s=new Float32Array(n.count*3);r.setAttribute("color",new $(s,3)),this.add(new ae(r,this.material)),this.update()}dispose(){super.dispose(),this.children[0].geometry.dispose(),this.children[0].material.dispose()}update(){let e=this.children[0];if(this.color!==void 0)this.material.color.set(this.color);else{let t=e.geometry.getAttribute("color");Dp.copy(this.light.color),Bp.copy(this.light.groundColor);for(let i=0,r=t.count;i<r;i++){let n=i<r/2?Dp:Bp;t.setXYZ(i,n.r,n.g,n.b)}t.needsUpdate=!0}this.matrixWorldNeedsUpdate=!0,this.light.updateWorldMatrix(!0,!1),e.lookAt(Dv.setFromMatrixPosition(this.light.matrixWorld).negate())}};var Hc=class extends Ce{constructor(e=10,t=10,i=4473924,r=8947848){i=new L(i),r=new L(r);let n=t/2,s=e/t,a=e/2,l=[],c=[];for(let d=0,f=0,p=-a;d<=t;d++,p+=s){l.push(-a,0,p,a,0,p),l.push(p,0,-a,p,0,a);let m=d===n?i:r;m.toArray(c,f),f+=3,m.toArray(c,f),f+=3,m.toArray(c,f),f+=3,m.toArray(c,f),f+=3}let h=new D;h.setAttribute("position",new R(l,3)),h.setAttribute("color",new R(c,3));let u=new oe({vertexColors:!0,toneMapped:!1});super(h,u),this.type="GridHelper"}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};var Wc=class extends Ce{constructor(e=10,t=16,i=8,r=64,n=4473924,s=8947848){n=new L(n),s=new L(s);let a=[],l=[];if(t>1)for(let u=0;u<t;u++){let d=u/t*(Math.PI*2),f=Math.sin(d)*e,p=Math.cos(d)*e;a.push(0,0,0),a.push(f,0,p);let m=u&1?n:s;l.push(m.r,m.g,m.b),l.push(m.r,m.g,m.b)}for(let u=0;u<i;u++){let d=u&1?n:s,f=e-e/i*u;for(let p=0;p<r;p++){let m=p/r*(Math.PI*2),_=Math.sin(m)*f,g=Math.cos(m)*f;a.push(_,0,g),l.push(d.r,d.g,d.b),m=(p+1)/r*(Math.PI*2),_=Math.sin(m)*f,g=Math.cos(m)*f,a.push(_,0,g),l.push(d.r,d.g,d.b)}}let c=new D;c.setAttribute("position",new R(a,3)),c.setAttribute("color",new R(l,3));let h=new oe({vertexColors:!0,toneMapped:!1});super(c,h),this.type="PolarGridHelper"}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};var Fp=new w,qc=new w,Op=new w,Xc=class extends q{constructor(e,t,i){super(),this.light=e,this.matrix=e.matrixWorld,this.matrixAutoUpdate=!1,this.color=i,this.type="DirectionalLightHelper",t===void 0&&(t=1);let r=new D;r.setAttribute("position",new R([-t,t,0,t,t,0,t,-t,0,-t,-t,0,-t,t,0],3));let n=new oe({fog:!1,toneMapped:!1});this.lightPlane=new Ze(r,n),this.add(this.lightPlane),r=new D,r.setAttribute("position",new R([0,0,0,0,0,1],3)),this.targetLine=new Ze(r,n),this.add(this.targetLine),this.update()}dispose(){super.dispose(),this.lightPlane.geometry.dispose(),this.lightPlane.material.dispose(),this.targetLine.geometry.dispose(),this.targetLine.material.dispose()}update(){this.matrixWorldNeedsUpdate=!0,this.light.updateWorldMatrix(!0,!1),this.light.target.updateWorldMatrix(!0,!1),Fp.setFromMatrixPosition(this.light.matrixWorld),qc.setFromMatrixPosition(this.light.target.matrixWorld),Op.subVectors(qc,Fp),this.lightPlane.lookAt(qc),this.color!==void 0?(this.lightPlane.material.color.set(this.color),this.targetLine.material.color.set(this.color)):(this.lightPlane.material.color.copy(this.light.color),this.targetLine.material.color.copy(this.light.color)),this.targetLine.lookAt(qc),this.targetLine.scale.z=Op.length()}};var Yc=new w,Ue=new Pi,Zc=class extends Ce{constructor(e){let t=new D,i=new oe({color:16777215,vertexColors:!0,toneMapped:!1}),r=[],n=[],s={};a("n1","n2"),a("n2","n4"),a("n4","n3"),a("n3","n1"),a("f1","f2"),a("f2","f4"),a("f4","f3"),a("f3","f1"),a("n1","f1"),a("n2","f2"),a("n3","f3"),a("n4","f4"),a("p","n1"),a("p","n2"),a("p","n3"),a("p","n4"),a("u1","u2"),a("u2","u3"),a("u3","u1"),a("c","t"),a("p","c"),a("cn1","cn2"),a("cn3","cn4"),a("cf1","cf2"),a("cf3","cf4");function a(p,m){l(p),l(m)}function l(p){r.push(0,0,0),n.push(0,0,0),s[p]===void 0&&(s[p]=[]),s[p].push(r.length/3-1)}t.setAttribute("position",new R(r,3)),t.setAttribute("color",new R(n,3)),super(t,i),this.type="CameraHelper",this.camera=e,this.camera.updateProjectionMatrix&&this.camera.updateProjectionMatrix(),this.matrix=e.matrixWorld,this.matrixAutoUpdate=!1,this.pointMap=s,this.update();let c=new L(16755200),h=new L(16711680),u=new L(43775),d=new L(16777215),f=new L(3355443);this.setColors(c,h,u,d,f)}setColors(e,t,i,r,n){let a=this.geometry.getAttribute("color");return a.setXYZ(0,e.r,e.g,e.b),a.setXYZ(1,e.r,e.g,e.b),a.setXYZ(2,e.r,e.g,e.b),a.setXYZ(3,e.r,e.g,e.b),a.setXYZ(4,e.r,e.g,e.b),a.setXYZ(5,e.r,e.g,e.b),a.setXYZ(6,e.r,e.g,e.b),a.setXYZ(7,e.r,e.g,e.b),a.setXYZ(8,e.r,e.g,e.b),a.setXYZ(9,e.r,e.g,e.b),a.setXYZ(10,e.r,e.g,e.b),a.setXYZ(11,e.r,e.g,e.b),a.setXYZ(12,e.r,e.g,e.b),a.setXYZ(13,e.r,e.g,e.b),a.setXYZ(14,e.r,e.g,e.b),a.setXYZ(15,e.r,e.g,e.b),a.setXYZ(16,e.r,e.g,e.b),a.setXYZ(17,e.r,e.g,e.b),a.setXYZ(18,e.r,e.g,e.b),a.setXYZ(19,e.r,e.g,e.b),a.setXYZ(20,e.r,e.g,e.b),a.setXYZ(21,e.r,e.g,e.b),a.setXYZ(22,e.r,e.g,e.b),a.setXYZ(23,e.r,e.g,e.b),a.setXYZ(24,t.r,t.g,t.b),a.setXYZ(25,t.r,t.g,t.b),a.setXYZ(26,t.r,t.g,t.b),a.setXYZ(27,t.r,t.g,t.b),a.setXYZ(28,t.r,t.g,t.b),a.setXYZ(29,t.r,t.g,t.b),a.setXYZ(30,t.r,t.g,t.b),a.setXYZ(31,t.r,t.g,t.b),a.setXYZ(32,i.r,i.g,i.b),a.setXYZ(33,i.r,i.g,i.b),a.setXYZ(34,i.r,i.g,i.b),a.setXYZ(35,i.r,i.g,i.b),a.setXYZ(36,i.r,i.g,i.b),a.setXYZ(37,i.r,i.g,i.b),a.setXYZ(38,r.r,r.g,r.b),a.setXYZ(39,r.r,r.g,r.b),a.setXYZ(40,n.r,n.g,n.b),a.setXYZ(41,n.r,n.g,n.b),a.setXYZ(42,n.r,n.g,n.b),a.setXYZ(43,n.r,n.g,n.b),a.setXYZ(44,n.r,n.g,n.b),a.setXYZ(45,n.r,n.g,n.b),a.setXYZ(46,n.r,n.g,n.b),a.setXYZ(47,n.r,n.g,n.b),a.setXYZ(48,n.r,n.g,n.b),a.setXYZ(49,n.r,n.g,n.b),a.needsUpdate=!0,this}update(){let e=this.geometry,t=this.pointMap,i=1,r=1,n,s;if(Ue.projectionMatrixInverse.copy(this.camera.projectionMatrixInverse),this.camera.reversedDepth===!0)n=1,s=0;else if(this.camera.coordinateSystem===tt)n=-1,s=1;else if(this.camera.coordinateSystem===Jt)n=0,s=1;else throw new Error("THREE.CameraHelper.update(): Invalid coordinate system: "+this.camera.coordinateSystem);ke("c",t,e,Ue,0,0,n),ke("t",t,e,Ue,0,0,s),ke("n1",t,e,Ue,-i,-r,n),ke("n2",t,e,Ue,i,-r,n),ke("n3",t,e,Ue,-i,r,n),ke("n4",t,e,Ue,i,r,n),ke("f1",t,e,Ue,-i,-r,s),ke("f2",t,e,Ue,i,-r,s),ke("f3",t,e,Ue,-i,r,s),ke("f4",t,e,Ue,i,r,s),ke("u1",t,e,Ue,i*.7,r*1.1,n),ke("u2",t,e,Ue,-i*.7,r*1.1,n),ke("u3",t,e,Ue,0,r*2,n),ke("cf1",t,e,Ue,-i,0,s),ke("cf2",t,e,Ue,i,0,s),ke("cf3",t,e,Ue,0,-r,s),ke("cf4",t,e,Ue,0,r,s),ke("cn1",t,e,Ue,-i,0,n),ke("cn2",t,e,Ue,i,0,n),ke("cn3",t,e,Ue,0,-r,n),ke("cn4",t,e,Ue,0,r,n),e.getAttribute("position").needsUpdate=!0}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};function ke(o,e,t,i,r,n,s){Yc.set(r,n,s).unproject(i);let a=e[o];if(a!==void 0){let l=t.getAttribute("position");for(let c=0,h=a.length;c<h;c++)l.setXYZ(a[c],Yc.x,Yc.y,Yc.z)}}var Jc=new ye,Kc=class extends Ce{constructor(e,t=16776960){let i=new Uint16Array([0,1,1,2,2,3,3,0,4,5,5,6,6,7,7,4,0,4,1,5,2,6,3,7]),r=new Float32Array(8*3),n=new D;n.setIndex(new $(i,1)),n.setAttribute("position",new $(r,3)),super(n,new oe({color:t,toneMapped:!1})),this.object=e,this.type="BoxHelper",this.matrixAutoUpdate=!1,this.update()}update(){if(this.object!==void 0&&Jc.setFromObject(this.object),Jc.isEmpty())return;let e=Jc.min,t=Jc.max,i=this.geometry.attributes.position,r=i.array;r[0]=t.x,r[1]=t.y,r[2]=t.z,r[3]=e.x,r[4]=t.y,r[5]=t.z,r[6]=e.x,r[7]=e.y,r[8]=t.z,r[9]=t.x,r[10]=e.y,r[11]=t.z,r[12]=t.x,r[13]=t.y,r[14]=e.z,r[15]=e.x,r[16]=t.y,r[17]=e.z,r[18]=e.x,r[19]=e.y,r[20]=e.z,r[21]=t.x,r[22]=e.y,r[23]=e.z,i.needsUpdate=!0,this.geometry.computeBoundingSphere()}setFromObject(e){return this.object=e,this.update(),this}copy(e,t){return super.copy(e,t),this.object=e.object,this}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};var jc=class extends Ce{constructor(e,t=16776960){let i=new Uint16Array([0,1,1,2,2,3,3,0,4,5,5,6,6,7,7,4,0,4,1,5,2,6,3,7]),r=[1,1,1,-1,1,1,-1,-1,1,1,-1,1,1,1,-1,-1,1,-1,-1,-1,-1,1,-1,-1],n=new D;n.setIndex(new $(i,1)),n.setAttribute("position",new R(r,3)),super(n,new oe({color:t,toneMapped:!1})),this.box=e,this.type="Box3Helper",this.geometry.computeBoundingSphere()}updateMatrixWorld(e){let t=this.box;t.isEmpty()||(t.getCenter(this.position),t.getSize(this.scale),this.scale.multiplyScalar(.5),super.updateMatrixWorld(e))}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};var $c=class extends Ze{constructor(e,t=1,i=16776960){let r=i,n=[1,-1,0,-1,1,0,-1,-1,0,1,1,0,-1,1,0,-1,-1,0,1,-1,0,1,1,0],s=new D;s.setAttribute("position",new R(n,3)),s.computeBoundingSphere(),super(s,new oe({color:r,toneMapped:!1})),this.type="PlaneHelper",this.plane=e,this.size=t;let a=[1,1,0,-1,1,0,-1,-1,0,1,1,0,-1,-1,0,1,-1,0],l=new D;l.setAttribute("position",new R(a,3)),l.computeBoundingSphere(),this.add(new ae(l,new _e({color:r,opacity:.2,transparent:!0,depthWrite:!1,toneMapped:!1})))}updateMatrixWorld(e){this.position.set(0,0,0),this.scale.set(.5*this.size,.5*this.size,1),this.lookAt(this.plane.normal),this.translateZ(-this.plane.constant),super.updateMatrixWorld(e)}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose(),this.children[0].geometry.dispose(),this.children[0].material.dispose()}};var Up=new w,Qc,td,eh=class extends q{constructor(e=new w(0,0,1),t=new w(0,0,0),i=1,r=16776960,n=i*.2,s=n*.2){super(),this.type="ArrowHelper",Qc===void 0&&(Qc=new D,Qc.setAttribute("position",new R([0,0,0,0,1,0],3)),td=new Ls(.5,1,5,1),td.translate(0,-.5,0)),this.position.copy(t),this.line=new Ze(Qc,new oe({color:r,toneMapped:!1})),this.line.matrixAutoUpdate=!1,this.add(this.line),this.cone=new ae(td,new _e({color:r,toneMapped:!1})),this.cone.matrixAutoUpdate=!1,this.add(this.cone),this.setDirection(e),this.setLength(i,n,s)}setDirection(e){if(e.y>.99999)this.quaternion.set(0,0,0,1);else if(e.y<-.99999)this.quaternion.set(1,0,0,0);else{Up.set(e.z,0,-e.x).normalize();let t=Math.acos(e.y);this.quaternion.setFromAxisAngle(Up,t)}}setLength(e,t=e*.2,i=t*.2){this.line.scale.set(1,Math.max(1e-4,e-t),1),this.line.updateMatrix(),this.cone.scale.set(i,t,i),this.cone.position.y=e,this.cone.updateMatrix()}setColor(e){this.line.material.color.set(e),this.cone.material.color.set(e)}copy(e){return super.copy(e,!1),this.line.copy(e.line),this.cone.copy(e.cone),this}dispose(){super.dispose(),this.line.geometry.dispose(),this.line.material.dispose(),this.cone.geometry.dispose(),this.cone.material.dispose()}};var th=class extends Ce{constructor(e=1){let t=[0,0,0,e,0,0,0,0,0,0,e,0,0,0,0,0,0,e],i=[1,0,0,1,.6,0,0,1,0,.6,1,0,0,0,1,0,.6,1],r=new D;r.setAttribute("position",new R(t,3)),r.setAttribute("color",new R(i,3));let n=new oe({vertexColors:!0,toneMapped:!1});super(r,n),this.type="AxesHelper"}setColors(e,t,i){let r=new L,n=this.geometry.attributes.color.array;return r.set(e),r.toArray(n,0),r.toArray(n,3),r.set(t),r.toArray(n,6),r.toArray(n,9),r.set(i),r.toArray(n,12),r.toArray(n,15),this.geometry.attributes.color.needsUpdate=!0,this}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};var ih=class{constructor(){this.type="ShapePath",this.color=new L,this.subPaths=[],this.currentPath=null,this.userData={}}moveTo(e,t){return this.currentPath=new Ei,this.subPaths.push(this.currentPath),this.currentPath.moveTo(e,t),this}lineTo(e,t){return this.currentPath.lineTo(e,t),this}quadraticCurveTo(e,t,i,r){return this.currentPath.quadraticCurveTo(e,t,i,r),this}bezierCurveTo(e,t,i,r,n,s){return this.currentPath.bezierCurveTo(e,t,i,r,n,s),this}splineThru(e){return this.currentPath.splineThru(e),this}toShapes(){function e(l,c){let h=!1,u=c.length;for(let d=0,f=u-1;d<u;f=d++){let p=c[d],m=c[f];p.y>l.y!=m.y>l.y&&l.x<(m.x-p.x)*(l.y-p.y)/(m.y-p.y)+p.x&&(h=!h)}return h}function t(l,c){let h=c.getCenter(new E);if(e(h,l))return h;let u=h.y,d=[],f=l.length;for(let p=0;p<f;p++){let m=l[p],_=l[(p+1)%f];if(m.y>u!=_.y>u){let g=m.x+(u-m.y)*(_.x-m.x)/(_.y-m.y);d.push(g)}}return d.length>1&&(d.sort((p,m)=>p-m),h.x=(d[0]+d[1])/2),h}let i=this.userData.style&&this.userData.style.fillRule||"nonzero";i!=="nonzero"&&i!=="evenodd"&&(O('Fill-rule "'+i+'" is not supported, falling back to "nonzero".'),i="nonzero");let r=i==="nonzero"?l=>l!==0:l=>(l&1)!==0,n=[];for(let l of this.subPaths){let c=l.getPoints();if(c.length<3)continue;let h=Mt.area(c);if(h===0)continue;let u=new po;for(let d=0;d<c.length;d++)u.expandByPoint(c[d]);n.push({subPath:l,points:c,boundingBox:u,interiorPoint:t(c,u),absArea:Math.abs(h),winding:h<0?-1:1,container:null,exclude:!1,role:null})}n.sort((l,c)=>c.absArea-l.absArea);for(let l=0;l<n.length;l++){let c=n[l],h=0;for(let u=l-1;u>=0;u--){let d=n[u];if(d.boundingBox.containsBox(c.boundingBox)&&e(c.interiorPoint,d.points)){c.container=d.exclude?d.container:d,h=d.winding,c.winding+=h;break}}r(c.winding)===r(h)&&(c.exclude=!0)}for(let l of n)l.exclude||(l.role=l.container===null||l.container.role==="hole"?"outer":"hole");let s=[],a=new Map;for(let l of n){if(l.exclude||l.role!=="outer")continue;let c=new ei;c.curves=l.subPath.curves,s.push(c),a.set(l,c)}for(let l of n){if(l.exclude||l.role!=="hole")continue;let c=a.get(l.container);if(!c)continue;let h=new Ei;h.curves=l.subPath.curves,c.holes.push(h)}return s}};var rh=class extends Fe{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}};function Bv(o,e){let t=o.image&&o.image.width?o.image.width/o.image.height:1;return t>e?(o.repeat.x=1,o.repeat.y=t/e,o.offset.x=0,o.offset.y=(1-o.repeat.y)/2):(o.repeat.x=e/t,o.repeat.y=1,o.offset.x=(1-o.repeat.x)/2,o.offset.y=0),o}function Fv(o,e){let t=o.image&&o.image.width?o.image.width/o.image.height:1;return t>e?(o.repeat.x=e/t,o.repeat.y=1,o.offset.x=(1-o.repeat.x)/2,o.offset.y=0):(o.repeat.x=1,o.repeat.y=t/e,o.offset.x=0,o.offset.y=(1-o.repeat.y)/2),o}function Ov(o){return o.repeat.x=1,o.repeat.y=1,o.offset.x=0,o.offset.y=0,o}function Uv(o,e,t,i){let r=zv(i);switch(t){case zo:return o*e;case wi:return o*e/r.components*r.byteLength;case Nr:return o*e/r.components*r.byteLength;case Go:return o*e*2/r.components*r.byteLength;case Ho:return o*e*2/r.components*r.byteLength;case ko:return o*e*3/r.components*r.byteLength;case je:return o*e*4/r.components*r.byteLength;case Wo:return o*e*4/r.components*r.byteLength;case Dr:case Br:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*8;case Fr:case Or:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*16;case Sn:case Tn:return Math.max(o,16)*Math.max(e,8)/4;case Mn:case An:return Math.max(o,8)*Math.max(e,8)/2;case Cn:case En:case Rn:case Pn:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*8;case In:case Ln:case Nn:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*16;case Dn:return Math.floor((o+3)/4)*Math.floor((e+3)/4)*16;case Bn:return Math.floor((o+4)/5)*Math.floor((e+3)/4)*16;case Fn:return Math.floor((o+4)/5)*Math.floor((e+4)/5)*16;case On:return Math.floor((o+5)/6)*Math.floor((e+4)/5)*16;case Un:return Math.floor((o+5)/6)*Math.floor((e+5)/6)*16;case zn:return Math.floor((o+7)/8)*Math.floor((e+4)/5)*16;case kn:return Math.floor((o+7)/8)*Math.floor((e+5)/6)*16;case Vn:return Math.floor((o+7)/8)*Math.floor((e+7)/8)*16;case Gn:return Math.floor((o+9)/10)*Math.floor((e+4)/5)*16;case Hn:return Math.floor((o+9)/10)*Math.floor((e+5)/6)*16;case Wn:return Math.floor((o+9)/10)*Math.floor((e+7)/8)*16;case qn:return Math.floor((o+9)/10)*Math.floor((e+9)/10)*16;case Xn:return Math.floor((o+11)/12)*Math.floor((e+9)/10)*16;case Yn:return Math.floor((o+11)/12)*Math.floor((e+11)/12)*16;case Zn:case Jn:case Kn:return Math.ceil(o/4)*Math.ceil(e/4)*16;case jn:case $n:return Math.ceil(o/4)*Math.ceil(e/4)*8;case Qn:case es:return Math.ceil(o/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function zv(o){switch(o){case Zt:case Po:return{byteLength:1,components:1};case No:case Lo:case zi:return{byteLength:2,components:1};case Bo:case Fo:return{byteLength:2,components:4};case oi:case Do:case Tt:return{byteLength:4,components:1};case Oo:case Uo:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${o}.`)}var nh=class{static contain(e,t){return Bv(e,t)}static cover(e,t){return Fv(e,t)}static fill(e){return Ov(e)}static getByteLength(e,t,i,r){return Uv(e,t,i,r)}};typeof window<"u"&&(window.__THREE__?O("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Th);var zp=`
#ifdef USE_ALPHAHASH

	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;

#endif
`;var kp=`
#ifdef USE_ALPHAHASH

	/**
	 * See: https://casual-effects.com/research/Wyman2017Hashed/index.html
	 */

	const float ALPHA_HASH_SCALE = 0.05; // Derived from trials only, and may be changed.

	float hash2D( vec2 value ) {

		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );

	}

	float hash3D( vec3 value ) {

		return hash2D( vec2( hash2D( value.xy ), value.z ) );

	}

	float getAlphaHashThreshold( vec3 position ) {

		// Find the discretized derivatives of our coordinates
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );

		// Find two nearest log-discretized noise scales
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);

		// Compute alpha thresholds at our two noise scales
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);

		// Factor to interpolate lerp with
		float lerpFactor = fract( log2( pixScale ) );

		// Interpolate alpha threshold from noise at two scales
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;

		// Pass into CDF to compute uniformly distrib threshold
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);

		// Find our final, uniformly distributed alpha threshold (\u03B1\u03C4)
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;

		// Avoids \u03B1\u03C4 == 0. Could also do \u03B1\u03C4 =1-\u03B1\u03C4
		return clamp( threshold , 1.0e-6, 1.0 );

	}

#endif
`;var Vp=`
#ifdef USE_ALPHAMAP

	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;

#endif
`;var Gp=`
#ifdef USE_ALPHAMAP

	uniform sampler2D alphaMap;

#endif
`;var Hp=`
#ifdef USE_ALPHATEST

	#ifdef ALPHA_TO_COVERAGE

	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;

	#else

	if ( diffuseColor.a < alphaTest ) discard;

	#endif

#endif
`;var Wp=`
#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif
`;var qp=`
#ifdef USE_AOMAP

	// reads channel R, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;

	reflectedLight.indirectDiffuse *= ambientOcclusion;

	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif

	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif

	#if defined( USE_ENVMAP ) && defined( STANDARD )

		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );

		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );

	#endif

#endif
`;var Xp=`
#ifdef USE_AOMAP

	uniform sampler2D aoMap;
	uniform float aoMapIntensity;

#endif
`;var Yp=`
#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif

	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {

		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );

	}

	float getIndirectIndex( const in int i ) {

		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );

	}

#endif

#ifdef USE_BATCHING_COLOR

	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {

		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );

	}

#endif
`;var Zp=`
#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif
`;var Jp=`
vec3 transformed = vec3( position );

#ifdef USE_ALPHAHASH

	vPosition = vec3( position );

#endif
`;var Kp=`
vec3 objectNormal = vec3( normal );

#ifdef USE_TANGENT

	vec3 objectTangent = vec3( tangent.xyz );

#endif
`;var jp=`

float G_BlinnPhong_Implicit( /* const in float dotNL, const in float dotNV */ ) {

	// geometry term is (n dot l)(n dot v) / 4(n dot l)(n dot v)
	return 0.25;

}

float D_BlinnPhong( const in float shininess, const in float dotNH ) {

	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );

}

vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {

	vec3 halfDir = normalize( lightDir + viewDir );

	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );

	vec3 F = F_Schlick( specularColor, 1.0, dotVH );

	float G = G_BlinnPhong_Implicit( /* dotNL, dotNV */ );

	float D = D_BlinnPhong( shininess, dotNH );

	return F * ( G * D );

} // validated

`;var $p=`

#ifdef USE_IRIDESCENCE

	// XYZ to linear-sRGB color space
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);

	// Assume air interface for top
	// Note: We don't handle the case fresnel0 == 1
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {

		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );

	}

	// Conversion FO/IOR
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {

		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );

	}

	// ior is a value between 1.0 and 3.0. 1.0 is air interface
	float IorToFresnel0( float transmittedIor, float incidentIor ) {

		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));

	}

	// Fresnel equations for dielectric/dielectric interfaces.
	// Ref: https://belcour.github.io/blog/research/2017/05/01/brdf-thin-film.html
	// Evaluation XYZ sensitivity curves in Fourier space
	vec3 evalSensitivity( float OPD, vec3 shift ) {

		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );

		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;

		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;

	}

	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {

		vec3 I;

		// Force iridescenceIOR -> outsideIOR when thinFilmThickness -> 0.0
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		// Evaluate the cosTheta on the base layer (Snell law)
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );

		// Handle TIR:
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {

			return vec3( 1.0 );

		}

		float cosTheta2 = sqrt( cosTheta2Sq );

		// First interface
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;

		// Second interface
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) ); // guard against 1.0
		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;

		// Phase shift
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;

		// Compound terms
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );

		// Reflectance term for m = 0 (DC term amplitude)
		vec3 C0 = R12 + Rs;
		I = C0;

		// Reflectance term for m > 0 (pairs of diracs)
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {

			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;

		}

		// Since out of gamut colors might be produced, negative color values are clamped to 0.
		return max( I, vec3( 0.0 ) );

	}

#endif

`;var Qp=`
#ifdef USE_BUMPMAP

	uniform sampler2D bumpMap;
	uniform float bumpScale;

	// Bump Mapping Unparametrized Surfaces on the GPU by Morten S. Mikkelsen
	// https://mmikk.github.io/papers3d/mm_sfgrad_bump.pdf

	// Evaluate the derivative of the height w.r.t. screen-space using forward differencing (listing 2)

	vec2 dHdxy_fwd() {

		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );

		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;

		return vec2( dBx, dBy );

	}

	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {

		// normalize is done to ensure that the bump map looks the same regardless of the texture's scale
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm; // normalized

		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );

		float fDet = dot( vSigmaX, R1 ) * faceDirection;

		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );

	}

#endif
`;var em=`
#if NUM_CLIPPING_PLANES > 0

	vec4 plane;

	#ifdef ALPHA_TO_COVERAGE

		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;

		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {

			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );

			if ( clipOpacity == 0.0 ) discard;

		}
		#pragma unroll_loop_end

		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES

			float unionClipOpacity = 1.0;

			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {

				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );

			}
			#pragma unroll_loop_end

			clipOpacity *= 1.0 - unionClipOpacity;

		#endif

		diffuseColor.a *= clipOpacity;

		if ( diffuseColor.a == 0.0 ) discard;

	#else

		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {

			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;

		}
		#pragma unroll_loop_end

		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES

			bool clipped = true;

			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {

				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;

			}
			#pragma unroll_loop_end

			if ( clipped ) discard;

		#endif

	#endif

#endif
`;var tm=`
#if NUM_CLIPPING_PLANES > 0

	varying vec3 vClipPosition;

	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];

#endif
`;var im=`
#if NUM_CLIPPING_PLANES > 0

	varying vec3 vClipPosition;

#endif
`;var rm=`
#if NUM_CLIPPING_PLANES > 0

	vClipPosition = - mvPosition.xyz;

#endif
`;var nm=`
#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )

	diffuseColor *= vColor;

#endif
`;var sm=`
#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )

	varying vec4 vColor;

#endif
`;var om=`
#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )

	varying vec4 vColor;

#endif
`;var am=`
#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )

	vColor = vec4( 1.0 );

#endif

#ifdef USE_COLOR_ALPHA

	vColor *= color;

#elif defined( USE_COLOR )

	vColor.rgb *= color;

#endif

#ifdef USE_INSTANCING_COLOR

	vColor.rgb *= instanceColor.rgb;

#endif

#ifdef USE_BATCHING_COLOR

	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );

#endif
`;var lm=`
#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6

#ifndef saturate
// <tonemapping_pars_fragment> may have defined saturate() already
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )

float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }

// expects values in the range of [0,1]x[0,1], returns values in the [0,1] range.
// do not collapse into a single function per: http://byteblacksmith.com/improvements-to-the-canonical-one-liner-glsl-rand-for-opengl-es-2-0/
highp float rand( const in vec2 uv ) {

	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );

	return fract( sin( sn ) * c );

}

#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif

struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};

struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};

#ifdef USE_ALPHAHASH

	varying vec3 vPosition;

#endif

vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

}

#define inverseTransformDirection transformDirectionByInverseViewMatrix // @deprecated r185

vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {

	// upper-left 3x3 of view matrix is assumed to be orthogonal

	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );

}

vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {

	// upper-left 3x3 of view matrix is assumed to be orthogonal

	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );

}

bool isPerspectiveMatrix( mat4 m ) {

	return m[ 2 ][ 3 ] == - 1.0;

}

vec2 equirectUv( in vec3 dir ) {

	// dir is assumed to be unit length

	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;

	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;

	return vec2( u, v );

}

vec3 BRDF_Lambert( const in vec3 diffuseColor ) {

	return RECIPROCAL_PI * diffuseColor;

} // validated

vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {

	// Original approximation by Christophe Schlick '94
	// float fresnel = pow( 1.0 - dotVH, 5.0 );

	// Optimized variant (presented by Epic at SIGGRAPH '13)
	// https://cdn2.unrealengine.com/Resources/files/2013SiggraphPresentationsNotes-26915738.pdf
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );

	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );

} // validated

float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {

	// Original approximation by Christophe Schlick '94
	// float fresnel = pow( 1.0 - dotVH, 5.0 );

	// Optimized variant (presented by Epic at SIGGRAPH '13)
	// https://cdn2.unrealengine.com/Resources/files/2013SiggraphPresentationsNotes-26915738.pdf
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );

	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );

} // validated
`;var cm=`
#ifdef ENVMAP_TYPE_CUBE_UV

	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0

	// These shader functions convert between the UV coordinates of a single face of
	// a cubemap, the 0-5 integer index of a cube face, and the direction vector for
	// sampling a textureCube (not generally normalized ).

	float getFace( vec3 direction ) {

		vec3 absDirection = abs( direction );

		float face = - 1.0;

		if ( absDirection.x > absDirection.z ) {

			if ( absDirection.x > absDirection.y )

				face = direction.x > 0.0 ? 0.0 : 3.0;

			else

				face = direction.y > 0.0 ? 1.0 : 4.0;

		} else {

			if ( absDirection.z > absDirection.y )

				face = direction.z > 0.0 ? 2.0 : 5.0;

			else

				face = direction.y > 0.0 ? 1.0 : 4.0;

		}

		return face;

	}

	// RH coordinate system; PMREM face-indexing convention
	vec2 getUV( vec3 direction, float face ) {

		vec2 uv;

		if ( face == 0.0 ) {

			uv = vec2( direction.z, direction.y ) / abs( direction.x ); // pos x

		} else if ( face == 1.0 ) {

			uv = vec2( - direction.x, - direction.z ) / abs( direction.y ); // pos y

		} else if ( face == 2.0 ) {

			uv = vec2( - direction.x, direction.y ) / abs( direction.z ); // pos z

		} else if ( face == 3.0 ) {

			uv = vec2( - direction.z, direction.y ) / abs( direction.x ); // neg x

		} else if ( face == 4.0 ) {

			uv = vec2( - direction.x, direction.z ) / abs( direction.y ); // neg y

		} else {

			uv = vec2( direction.x, direction.y ) / abs( direction.z ); // neg z

		}

		return 0.5 * ( uv + 1.0 );

	}

	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {

		float face = getFace( direction );

		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );

		mipInt = max( mipInt, cubeUV_minMipLevel );

		float faceSize = exp2( mipInt );

		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0; // #25071

		if ( face > 2.0 ) {

			uv.y += faceSize;

			face -= 3.0;

		}

		uv.x += face * faceSize;

		uv.x += filterInt * 3.0 * cubeUV_minTileSize;

		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );

		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;

		#ifdef texture2DGradEXT

			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb; // disable anisotropic filtering

		#else

			return texture2D( envMap, uv ).rgb;

		#endif

	}

	// These defines must match with PMREMGenerator

	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0

	float roughnessToMip( float roughness ) {

		float mip = 0.0;

		if ( roughness >= cubeUV_r1 ) {

			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;

		} else if ( roughness >= cubeUV_r4 ) {

			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;

		} else if ( roughness >= cubeUV_r5 ) {

			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;

		} else if ( roughness >= cubeUV_r6 ) {

			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;

		} else {

			mip = - 2.0 * log2( 1.16 * roughness ); // 1.16 = 1.79^0.25
		}

		return mip;

	}

	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {

		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );

		float mipF = fract( mip );

		float mipInt = floor( mip );

		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );

		if ( mipF == 0.0 ) {

			return vec4( color0, 1.0 );

		} else {

			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );

			return vec4( mix( color0, color1, mipF ), 1.0 );

		}

	}

#endif
`;var hm=`

vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT

	vec3 transformedTangent = objectTangent;

#endif

#ifdef USE_BATCHING

	// this is in lieu of a per-instance normal-matrix
	// non-uniform scaling in the instance matrix is supported
	// shear transforms are not supported

	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;

	#ifdef USE_TANGENT

		transformedTangent = bm * transformedTangent;

	#endif

#endif

#ifdef USE_INSTANCING

	// this is in lieu of a per-instance normal-matrix
	// non-uniform scaling in the instance matrix is supported
	// shear transforms are not supported

	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;

	#ifdef USE_TANGENT

		transformedTangent = im * transformedTangent;

	#endif

#endif

transformedNormal = normalMatrix * transformedNormal;

#ifdef FLIP_SIDED

	transformedNormal = - transformedNormal;

#endif

#ifdef USE_TANGENT

	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;

#endif
`;var um=`
#ifdef USE_DISPLACEMENTMAP

	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;

#endif
`;var dm=`
#ifdef USE_DISPLACEMENTMAP

	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );

#endif
`;var fm=`
#ifdef USE_EMISSIVEMAP

	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );

	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE

		// use inline sRGB decode until browsers properly support SRGB8_ALPHA8 with video textures (#26516)

		emissiveColor = sRGBTransferEOTF( emissiveColor );

	#endif

	totalEmissiveRadiance *= emissiveColor.rgb;

#endif
`;var pm=`
#ifdef USE_EMISSIVEMAP

	uniform sampler2D emissiveMap;

#endif
`;var mm=`
gl_FragColor = linearToOutputTexel( gl_FragColor );
`;var gm=`

vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}

vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}

vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}

`;var _m=`
#ifdef USE_ENVMAP

	#ifdef ENV_WORLDPOS

		vec3 cameraToFrag;

		if ( isOrthographic ) {

			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );

		} else {

			cameraToFrag = normalize( vWorldPosition - cameraPosition );

		}

		// Transforming Normal Vectors with the Inverse Transformation
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );

		#ifdef ENVMAP_MODE_REFLECTION

			vec3 reflectVec = reflect( cameraToFrag, worldNormal );

		#else

			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );

		#endif

	#else

		vec3 reflectVec = vReflect;

	#endif

	#ifdef ENVMAP_TYPE_CUBE

		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );

		#ifdef ENVMAP_BLENDING_MULTIPLY

			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );

		#elif defined( ENVMAP_BLENDING_MIX )

			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );

		#elif defined( ENVMAP_BLENDING_ADD )

			outgoingLight += envColor.xyz * specularStrength * reflectivity;

		#endif

	#endif

#endif
`;var xm=`
#ifdef USE_ENVMAP

	uniform float envMapIntensity;
	uniform mat3 envMapRotation;

	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif

#endif
`;var ym=`
#ifdef USE_ENVMAP

	uniform float reflectivity;

	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )

		#define ENV_WORLDPOS

	#endif

	#ifdef ENV_WORLDPOS

		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif

#endif
`;var vm=`
#ifdef USE_ENVMAP

	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )

		#define ENV_WORLDPOS

	#endif

	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;

	#else

		varying vec3 vReflect;
		uniform float refractionRatio;

	#endif

#endif
`;var wm=`
#ifdef USE_ENVMAP

	#ifdef ENV_WORLDPOS

		vWorldPosition = worldPosition.xyz;

	#else

		vec3 cameraToVertex;

		if ( isOrthographic ) {

			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );

		} else {

			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );

		}

		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );

		#ifdef ENVMAP_MODE_REFLECTION

			vReflect = reflect( cameraToVertex, worldNormal );

		#else

			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );

		#endif

	#endif

#endif
`;var bm=`
#ifdef USE_FOG

	vFogDepth = - mvPosition.z;

#endif
`;var Mm=`
#ifdef USE_FOG

	varying float vFogDepth;

#endif
`;var Sm=`
#ifdef USE_FOG

	#ifdef FOG_EXP2

		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );

	#else

		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );

	#endif

	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );

#endif
`;var Am=`
#ifdef USE_FOG

	uniform vec3 fogColor;
	varying float vFogDepth;

	#ifdef FOG_EXP2

		uniform float fogDensity;

	#else

		uniform float fogNear;
		uniform float fogFar;

	#endif

#endif
`;var Tm=`

#ifdef USE_GRADIENTMAP

	uniform sampler2D gradientMap;

#endif

vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {

	// dotNL will be from -1.0 to 1.0
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );

	#ifdef USE_GRADIENTMAP

		return vec3( texture2D( gradientMap, coord ).r );

	#else

		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );

	#endif

}
`;var Cm=`
#ifdef USE_LIGHTMAP

	uniform sampler2D lightMap;
	uniform float lightMapIntensity;

#endif
`;var Em=`
LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;
`;var Im=`
varying vec3 vViewPosition;

struct LambertMaterial {

	vec3 diffuseColor;
	float specularStrength;

};

void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {

	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;

	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );

}

void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {

	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );

}

#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert
`;var Rm=`
uniform bool receiveShadow;
uniform vec3 ambientLightColor;

#if defined( USE_LIGHT_PROBES )

	uniform vec3 lightProbe[ 9 ];

#endif

// get the irradiance (radiance convolved with cosine lobe) at the point 'normal' on the unit sphere
// source: https://graphics.stanford.edu/papers/envmap/envmap.pdf
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {

	// normal is assumed to have unit length

	float x = normal.x, y = normal.y, z = normal.z;

	// band 0
	vec3 result = shCoefficients[ 0 ] * 0.886227;

	// band 1
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;

	// band 2
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );

	return result;

}

vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {

	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );

	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );

	return irradiance;

}

vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {

	vec3 irradiance = ambientLightColor;

	return irradiance;

}

float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {

	// based upon Frostbite 3 Moving to Physically-based Rendering
	// page 32, equation 26: E[window1]
	// https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );

	if ( cutoffDistance > 0.0 ) {

		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );

	}

	return distanceFalloff;

}

float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {

	return smoothstep( coneCosine, penumbraCosine, angleCosine );

}

#if NUM_SUN_LIGHTS > 0

	struct SunLight {
		vec3 direction;
		vec3 color;
	};

	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];

	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {

		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;

	}

#endif


#if NUM_DIR_LIGHTS > 0

	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};

	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];

	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {

		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;

	}

#endif


#if NUM_POINT_LIGHTS > 0

	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};

	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];

	// light is an out parameter as having it as a return value caused compiler errors on some devices
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {

		vec3 lVector = pointLight.position - geometryPosition;

		light.direction = normalize( lVector );

		float lightDistance = length( lVector );

		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );

	}

#endif


#if NUM_SPOT_LIGHTS > 0

	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};

	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];

	// light is an out parameter as having it as a return value caused compiler errors on some devices
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {

		vec3 lVector = spotLight.position - geometryPosition;

		light.direction = normalize( lVector );

		float angleCos = dot( light.direction, spotLight.direction );

		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );

		if ( spotAttenuation > 0.0 ) {

			float lightDistance = length( lVector );

			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );

		} else {

			light.color = vec3( 0.0 );
			light.visible = false;

		}

	}

#endif


#if NUM_RECT_AREA_LIGHTS > 0

	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};

	// Pre-computed values of LinearTransformedCosine approximation of BRDF
	// BRDF approximation Texture is 64x64
	uniform sampler2D ltc_1; // RGBA Float
	uniform sampler2D ltc_2; // RGBA Float

	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];

#endif


#if NUM_HEMI_LIGHTS > 0

	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};

	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];

	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {

		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;

		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );

		return irradiance;

	}

#endif

#include <lightprobes_pars_fragment>
`;var Pm=`
#ifdef USE_ENVMAP

	vec3 getIBLIrradiance( const in vec3 normal ) {

		#ifdef ENVMAP_TYPE_CUBE_UV

			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );

			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );

			return PI * envMapColor.rgb * envMapIntensity;

		#else

			return vec3( 0.0 );

		#endif

	}

	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {

		#ifdef ENVMAP_TYPE_CUBE_UV

			vec3 reflectVec = reflect( - viewDir, normal );

			// Mixing the reflection with the normal is more accurate and keeps rough objects from gathering light from behind their tangent plane.
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );

			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );

			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );

			return envMapColor.rgb * envMapIntensity;

		#else

			return vec3( 0.0 );

		#endif

	}

	#ifdef USE_RETROREFLECTION

		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {

			#ifdef ENVMAP_TYPE_CUBE_UV

				// The retroreflective lobe returns light toward its source, so the environment is sampled along the view direction
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );

				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );

				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );

				return envMapColor.rgb * envMapIntensity;

			#else

				return vec3( 0.0 );

			#endif

		}

	#endif

	#ifdef USE_ANISOTROPY

		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {

			#ifdef ENVMAP_TYPE_CUBE_UV

			  // https://google.github.io/filament/Filament.md.html#lighting/imagebasedlights/anisotropy
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );

				return getIBLRadiance( viewDir, bentNormal, roughness );

			#else

				return vec3( 0.0 );

			#endif

		}

		#ifdef USE_RETROREFLECTION

			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {

				#ifdef ENVMAP_TYPE_CUBE_UV

				  // https://google.github.io/filament/Filament.md.html#lighting/imagebasedlights/anisotropy
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );

					return getIBLRetroRadiance( viewDir, bentNormal, roughness );

				#else

					return vec3( 0.0 );

				#endif

			}

		#endif

	#endif

#endif
`;var Lm=`
ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;
`;var Nm=`
varying vec3 vViewPosition;

struct ToonMaterial {

	vec3 diffuseColor;

};

void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {

	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;

	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );

}

void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {

	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );

}

#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon
`;var Dm=`
BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;
`;var Bm=`
varying vec3 vViewPosition;

struct BlinnPhongMaterial {

	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;

};

void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {

	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;

	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );

	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;

}

void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {

	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );

}

#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong
`;var Fm=`
PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;

vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );

material.roughness = max( roughnessFactor, 0.0525 );// 0.0525 corresponds to the base mip of a 256 cubemap.
material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );

#ifdef IOR

	material.ior = ior;

	#ifdef USE_SPECULAR

		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;

		#ifdef USE_SPECULAR_COLORMAP

			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;

		#endif

		#ifdef USE_SPECULAR_INTENSITYMAP

			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;

		#endif

		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );

	#else

		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;

	#endif

	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );

#else

	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;

#endif

#ifdef USE_CLEARCOAT

	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;

	#ifdef USE_CLEARCOATMAP

		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;

	#endif

	#ifdef USE_CLEARCOAT_ROUGHNESSMAP

		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;

	#endif

	material.clearcoat = saturate( material.clearcoat ); // Burley clearcoat model
	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );

#endif

#ifdef USE_DISPERSION

	material.dispersion = dispersion;

#endif

#ifdef USE_RETROREFLECTION

	material.retroreflectivity = retroreflectivity;

#endif

#ifdef USE_IRIDESCENCE

	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;

	#ifdef USE_IRIDESCENCEMAP

		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;

	#endif

	#ifdef USE_IRIDESCENCE_THICKNESSMAP

		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;

	#else

		material.iridescenceThickness = iridescenceThicknessMaximum;

	#endif

#endif

#ifdef USE_SHEEN

	material.sheenColor = sheenColor;

	#ifdef USE_SHEEN_COLORMAP

		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;

	#endif

	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );

	#ifdef USE_SHEEN_ROUGHNESSMAP

		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;

	#endif

#endif

#ifdef USE_ANISOTROPY

	#ifdef USE_ANISOTROPYMAP

		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;

	#else

		vec2 anisotropyV = anisotropyVector;

	#endif

	material.anisotropy = length( anisotropyV );

	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}

	// Roughness along the anisotropy bitangent is the material roughness, while the tangent roughness increases with anisotropy.
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );

	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;

#endif
`;var Om=`

uniform sampler2D dfgLUT;

struct PhysicalMaterial {

	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;

	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;

	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif

	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif

	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif

	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif

	#ifdef IOR
		float ior;
	#endif

	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif

	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif

};

// temporary
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );

vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );

    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}

// Moving Frostbite to Physically Based Rendering 3.0 - page 12, listing 2
// https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {

	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );

	return 0.5 / max( gv + gl, EPSILON );

}

// Microfacet Models for Refraction through Rough Surfaces - equation (33)
// http://graphicrants.blogspot.com/2013/08/specular-brdf-reference.html
// alpha is "roughness squared" in Disney\u2019s reparameterization
float D_GGX( const in float alpha, const in float dotNH ) {

	float a2 = pow2( alpha );

	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0; // avoid alpha = 0 with dotNH = 1

	return RECIPROCAL_PI * a2 / pow2( denom );

}

// https://google.github.io/filament/Filament.md.html#materialsystem/anisotropicmodel/anisotropicspecularbrdf
#ifdef USE_ANISOTROPY

	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {

		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );

	}

	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {

		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;

		return RECIPROCAL_PI * a2 * pow2 ( w2 );

	}

#endif

#ifdef USE_CLEARCOAT

	// GGX Distribution, Schlick Fresnel, GGX_SmithCorrelated Visibility
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {

		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;

		float alpha = pow2( roughness ); // UE4's roughness

		vec3 halfDir = normalize( lightDir + viewDir );

		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );

		vec3 F = F_Schlick( f0, f90, dotVH );

		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );

		float D = D_GGX( alpha, dotNH );

		return F * ( V * D );

	}

#endif

vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {

	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;

	float alpha = pow2( roughness ); // UE4's roughness

	vec3 halfDir = normalize( lightDir + viewDir );

	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );

	vec3 F = F_Schlick( f0, f90, dotVH );

	#ifdef USE_IRIDESCENCE

		F = mix( F, material.iridescenceFresnel, material.iridescence );

	#endif

	#ifdef USE_ANISOTROPY

		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );

		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );

		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );

	#else

		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );

		float D = D_GGX( alpha, dotNH );

	#endif

	return F * ( V * D );

}

// Rect Area Light

// Real-Time Polygonal-Light Shading with Linearly Transformed Cosines
// by Eric Heitz, Jonathan Dupuy, Stephen Hill and David Neubelt
// code: https://github.com/selfshadow/ltc_code/

vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {

	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;

	float dotNV = saturate( dot( N, V ) );

	// texture parameterized by sqrt( GGX alpha ) and sqrt( 1 - cos( theta ) )
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );

	uv = uv * LUT_SCALE + LUT_BIAS;

	return uv;

}

float LTC_ClippedSphereFormFactor( const in vec3 f ) {

	// Real-Time Area Lighting: a Journey from Research to Production (p.102)
	// An approximation of the form factor of a horizon-clipped rectangle.

	float l = length( f );

	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );

}

vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {

	float x = dot( v1, v2 );

	float y = abs( x );

	// rational polynomial approximation to theta / sin( theta ) / 2PI
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;

	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;

	return cross( v1, v2 ) * theta_sintheta;

}

vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {

	// bail if point is on back side of plane of light
	// assumes ccw winding order of light vertices
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );

	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );

	// construct orthonormal basis around N
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 ); // negated from paper; possibly due to a different handedness of world coordinate system

	// compute transform
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );

	// transform rect
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );

	// project rect onto sphere
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );

	// calculate vector form factor
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );

	// adjust for horizon clipping
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );

/*
	// alternate method of adjusting for horizon clipping (see reference)
	// refactoring required
	float len = length( vectorFormFactor );
	float z = vectorFormFactor.z / len;

	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;

	// tabulated horizon-clipped sphere, apparently...
	vec2 uv = vec2( z * 0.5 + 0.5, len );
	uv = uv * LUT_SCALE + LUT_BIAS;

	float scale = texture2D( ltc_2, uv ).w;

	float result = len * scale;
*/

	return vec3( result );

}

// End Rect Area Light

#if defined( USE_SHEEN )

// https://github.com/google/filament/blob/master/shaders/src/brdf.fs
float D_Charlie( float roughness, float dotNH ) {

	float alpha = pow2( roughness );

	// Estevez and Kulla 2017, "Production Friendly Microfacet Sheen BRDF"
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 ); // 2^(-14/2), so sin2h^2 > 0 in fp16

	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );

}

// https://github.com/google/filament/blob/master/shaders/src/brdf.fs
float V_Neubelt( float dotNV, float dotNL ) {

	// Neubelt and Pettineo 2013, "Crafting a Next-gen Material Pipeline for The Order: 1886"
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );

}

vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {

	vec3 halfDir = normalize( lightDir + viewDir );

	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );

	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );

	return sheenColor * ( D * V );

}

#endif

// This is a curve-fit approximation to the "Charlie sheen" BRDF integrated over the hemisphere from
// Estevez and Kulla 2017, "Production Friendly Microfacet Sheen BRDF".
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {

	float dotNV = saturate( dot( normal, viewDir ) );

	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );

	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;

	float DG = exp( a * dotNV + b );

	return saturate( DG );

}

vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {

	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;

	return specularColor * fab.x + specularF90 * fab.y;

}

// Fdez-Ag\xFCera's "Multiple-Scattering Microfacet Model for Real-Time Image Based Lighting"
// Approximates multiscattering in order to preserve energy.
// http://www.jcgt.org/published/0008/01/03/
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif

	#ifdef USE_IRIDESCENCE

		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );

	#else

		vec3 Fr = specularColor;

	#endif

	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;

	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;

	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619; // 1/21
	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );

	singleScatter += FssEss;
	multiScatter += Fms * Ems;

}

#if NUM_RECT_AREA_LIGHTS > 0

	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {

		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;

		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight; // counterclockwise; light shines in local neg z direction
		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;

		vec2 uv = LTC_Uv( normal, viewDir, roughness );

		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );

		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);

		// LTC Fresnel Approximation by Stephen Hill
		// http://blog.selfshadow.com/publications/s2016-advances/s2016_ltc_fresnel.pdf
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );

		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );

		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );

		#ifdef USE_CLEARCOAT

			vec3 Ncc = geometryClearcoatNormal;

			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );

			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );

			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);

			// LTC Fresnel Approximation for clearcoat
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;

			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );

		#endif

	}

#endif

void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {

	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );

	vec3 irradiance = dotNL * directLight.color;

	#ifdef USE_CLEARCOAT

		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );

		vec3 ccIrradiance = dotNLcc * directLight.color;

		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );

	#endif

	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif

	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );

	#ifdef USE_RETROREFLECTION

		// Minimal Retroreflective Microfacet Model:
		// https://jcgt.org/published/0015/01/04/
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );

		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );

	#endif

	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;

	// Light reflected by the specular interface is not available to the diffuse layer ( glTF fresnel_mix )
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );

	#ifdef USE_RETROREFLECTION

		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );

		F = mix( F, retroF, saturate( material.retroreflectivity ) );

	#endif

	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}

void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {

	// Energy reflected by the specular lobe is not available to the diffuse layer
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );

	#ifdef USE_IRIDESCENCE

		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );

	#else

		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );

	#endif

	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );

	#ifdef USE_SHEEN

		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );

		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;

		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;

		diffuse *= sheenEnergyComp;

	#endif

	reflectedLight.indirectDiffuse += diffuse;

}

void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {

	#ifdef USE_CLEARCOAT

		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );

	#endif

	#ifdef USE_SHEEN

		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;

 	#endif

	// Both indirect specular and indirect diffuse light accumulate here
	// Compute multiscattering separately for dielectric and metallic, then mix

	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );

	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );

	#ifdef USE_IRIDESCENCE

		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );

	#else

		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );

	#endif

	// Mix based on metalness
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );

	// Diffuse energy conservation uses dielectric path
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );

	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;

	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;

	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;

	#ifdef USE_SHEEN

		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );

		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;

		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;

	#endif

	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;

}

#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical

// ref: https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {

	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );

}
`;var Um=`
/**
 * This is a template that can be used to light a material, it uses pluggable
 * RenderEquations (RE)for specific lighting scenarios.
 *
 * Instructions for use:
 * - Ensure that both RE_Direct, RE_IndirectDiffuse and RE_IndirectSpecular are defined
 * - Create a material parameter that is to be passed as the third parameter to your lighting functions.
 *
 * TODO:
 * - Add area light support.
 * - Add sphere light support.
 * - Add diffuse light probe (irradiance cubemap) support.
 */

vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );

vec3 geometryClearcoatNormal = vec3( 0.0 );

#ifdef USE_CLEARCOAT

	geometryClearcoatNormal = clearcoatNormal;

#endif

#ifdef USE_IRIDESCENCE

	float dotNVi = saturate( dot( normal, geometryViewDir ) );

	if ( material.iridescenceThickness == 0.0 ) {

		material.iridescence = 0.0;

	} else {

		material.iridescence = saturate( material.iridescence );

	}

	if ( material.iridescence > 0.0 ) {

		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );

		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );

		// Iridescence F0 approximation
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );

	}

#endif

#ifdef STANDARD

	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );

	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;

	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )

		// Multi-scattering energy compensation for direct lighting
		// Based on "Practical Multiple Scattering Compensation for Microfacet Models"
		// https://blog.selfshadow.com/publications/turquin/ms_comp_final.pdf

		// Energy of the single-scattering lobe in a white furnace ( F0 = F90 = 1 )
		float EssMs = material.dfg.x + material.dfg.y;

		// Compensate for the energy lost to multiple scattering, tinting the added term by F0 ( equation 16 )
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );

	#endif

#endif

IncidentLight directLight;

#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )

	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {

		pointLight = pointLights[ i ];

		getPointLightInfo( pointLight, geometryPosition, directLight );

		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif

		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );

	}
	#pragma unroll_loop_end

#endif

#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )

	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;

	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {

		spotLight = spotLights[ i ];

		getSpotLightInfo( spotLight, geometryPosition, directLight );

		// spot lights are ordered [shadows with maps, shadows without maps, maps without shadows, none]
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif

		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif

		#undef SPOT_LIGHT_MAP_INDEX

		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif

		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );

	}
	#pragma unroll_loop_end

#endif

#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )

	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {

		sunLight = sunLights[ i ];

		getSunLightInfo( sunLight, directLight );

		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif

		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );

	}
	#pragma unroll_loop_end

#endif

#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )

	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {

		directionalLight = directionalLights[ i ];

		getDirectionalLightInfo( directionalLight, directLight );

		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif

		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );

	}
	#pragma unroll_loop_end

#endif

#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )

	RectAreaLight rectAreaLight;

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {

		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );

	}
	#pragma unroll_loop_end

#endif

#if defined( RE_IndirectDiffuse )

	vec3 iblIrradiance = vec3( 0.0 );

	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );

	#if defined( USE_LIGHT_PROBES )

		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );

	#endif

	#if ( NUM_HEMI_LIGHTS > 0 )

		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {

			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );

		}
		#pragma unroll_loop_end

	#endif

	#ifdef USE_LIGHT_PROBES_GRID

		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );

	#endif

#endif

#if defined( RE_IndirectSpecular )

	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );

#endif
`;var zm=`
#if defined( RE_IndirectDiffuse )

	#ifdef USE_LIGHTMAP

		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;

		irradiance += lightMapIrradiance;

	#endif

	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )

		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )

			iblIrradiance += getIBLIrradiance( geometryNormal );

		#endif

	#endif

#endif

#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )

	#ifdef USE_ANISOTROPY

		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );

	#else

		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );

	#endif

	#ifdef USE_RETROREFLECTION

		#ifdef USE_ANISOTROPY

			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );

		#else

			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );

		#endif

		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );

	#endif

	radiance += iblRadiance;

	#ifdef USE_CLEARCOAT

		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );

	#endif

#endif
`;var km=`
#if defined( RE_IndirectDiffuse )

	#if defined( LAMBERT ) || defined( PHONG )

		irradiance += iblIrradiance;

	#endif

	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );

#endif

#if defined( RE_IndirectSpecular )

	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );

#endif
`;var Vm=`
#ifdef USE_LIGHT_PROBES_GRID

// Single atlas 3D texture that stores all 7 SH sub-volumes stacked along Z.
// Atlas depth = 7 * ( nz + 2 ) where nz = probesResolution.z.
// Each sub-volume occupies ( nz + 2 ) slices: 1 padding + nz data + 1 padding.
// Padding is a copy of the first / last data slice and prevents color bleeding
// when the hardware linear filter reads across a sub-volume boundary.
uniform highp sampler3D probesSH;

uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;

vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {

	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;

	// Offset sample position along normal by half a probe spacing
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );

	// Remap to texel centers of the probe grid (XY and Z)
	uvw = uvw * resMinusOne / res + 0.5 / res;

	// Atlas UV mapping along Z:
	//   paddedSlices = nz + 2  (1 padding texel at each end of every sub-volume)
	//   atlasDepth   = 7 * paddedSlices
	//   For sub-volume t the first DATA texel sits at atlas slice t*paddedSlices + 1.
	//   Given probe-grid texel-centre UVZ = ( iz + 0.5 ) / nz the atlas UV is:
	//     atlasUvZ = ( uvw.z * nz + t * paddedSlices + 1 ) / atlasDepth
	//
	// uvZBase encodes the nz-scaled Z plus the intra-volume offset (+ 1 for padding),
	// so adding t*paddedSlices steps to each successive sub-volume.
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;

	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );

	// Unpack 9 vec3 SH L2 coefficients
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;

	// Evaluate L2 irradiance
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;

	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );

	return max( result, vec3( 0.0 ) );

}

#endif
`;var Gm=`
#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )

	// Doing a strict comparison with == 1.0 can cause noise artifacts
	// on some platforms. See issue #17623.
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;

#endif
`;var Hm=`
#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )

	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;

#endif
`;var Wm=`
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER

	varying float vFragDepth;
	varying float vIsPerspective;

#endif
`;var qm=`
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER

	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );

#endif
`;var Xm=`
#ifdef USE_MAP

	vec4 sampledDiffuseColor = texture2D( map, vMapUv );

	#ifdef DECODE_VIDEO_TEXTURE

		// use inline sRGB decode until browsers properly support SRGB8_ALPHA8 with video textures (#26516)

		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );

	#endif

	diffuseColor *= sampledDiffuseColor;

#endif
`;var Ym=`
#ifdef USE_MAP

	uniform sampler2D map;

#endif
`;var Zm=`
#if defined( USE_MAP ) || defined( USE_ALPHAMAP )

	#if defined( USE_POINTS_UV )

		vec2 uv = vUv;

	#else

		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;

	#endif

#endif

#ifdef USE_MAP

	diffuseColor *= texture2D( map, uv );

#endif

#ifdef USE_ALPHAMAP

	diffuseColor.a *= texture2D( alphaMap, uv ).g;

#endif
`;var Jm=`
#if defined( USE_POINTS_UV )

	varying vec2 vUv;

#else

	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )

		uniform mat3 uvTransform;

	#endif

#endif

#ifdef USE_MAP

	uniform sampler2D map;

#endif

#ifdef USE_ALPHAMAP

	uniform sampler2D alphaMap;

#endif
`;var Km=`
float metalnessFactor = metalness;

#ifdef USE_METALNESSMAP

	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );

	// reads channel B, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
	metalnessFactor *= texelMetalness.b;

#endif
`;var jm=`
#ifdef USE_METALNESSMAP

	uniform sampler2D metalnessMap;

#endif
`;var $m=`
#ifdef USE_INSTANCING_MORPH

	float morphTargetInfluences[ MORPHTARGETS_COUNT ];

	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;

	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {

		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;

	}
#endif
`;var Qm=`
#if defined( USE_MORPHCOLORS )

	// morphTargetBaseInfluence is set based on BufferGeometry.morphTargetsRelative value:
	// When morphTargetsRelative is false, this is set to 1 - sum(influences); this results in normal = sum((target - base) * influence)
	// When morphTargetsRelative is true, this is set to 1; as a result, all morph targets are simply added to the base after weighting
	vColor *= morphTargetBaseInfluence;

	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {

		#if defined( USE_COLOR_ALPHA )

			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];

		#elif defined( USE_COLOR )

			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];

		#endif

	}

#endif
`;var eg=`
#ifdef USE_MORPHNORMALS

	// morphTargetBaseInfluence is set based on BufferGeometry.morphTargetsRelative value:
	// When morphTargetsRelative is false, this is set to 1 - sum(influences); this results in normal = sum((target - base) * influence)
	// When morphTargetsRelative is true, this is set to 1; as a result, all morph targets are simply added to the base after weighting
	objectNormal *= morphTargetBaseInfluence;

	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {

		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];

	}

#endif
`;var tg=`
#ifdef USE_MORPHTARGETS

	#ifndef USE_INSTANCING_MORPH

		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];

	#endif

	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;

	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {

		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;

		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );

	}

#endif
`;var ig=`
#ifdef USE_MORPHTARGETS

	// morphTargetBaseInfluence is set based on BufferGeometry.morphTargetsRelative value:
	// When morphTargetsRelative is false, this is set to 1 - sum(influences); this results in position = sum((target - base) * influence)
	// When morphTargetsRelative is true, this is set to 1; as a result, all morph targets are simply added to the base after weighting
	transformed *= morphTargetBaseInfluence;

	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {

		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];

	}

#endif
`;var rg=`
float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;

#ifdef FLAT_SHADED

	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );

#else

	vec3 normal = normalize( vNormal );

	#ifdef DOUBLE_SIDED

		normal *= faceDirection;

	#endif

#endif

#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )

	#ifdef USE_TANGENT

		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );

	#else

		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);

	#endif

	#ifdef DOUBLE_SIDED

		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;

	#endif

#endif

#ifdef USE_CLEARCOAT_NORMALMAP

	#ifdef USE_TANGENT

		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );

	#else

		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );

	#endif

	#ifdef DOUBLE_SIDED

		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;

	#endif

#endif

// non perturbed normal for clearcoat among others

vec3 nonPerturbedNormal = normal;

`;var ng=`

#ifdef USE_NORMALMAP_OBJECTSPACE

	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0; // overrides both flatShading and attribute normals

	#ifdef FLIP_SIDED

		normal = - normal;

	#endif

	#ifdef DOUBLE_SIDED

		normal = normal * faceDirection;

	#endif

	normal = normalize( normalMatrix * normal );

#elif defined( USE_NORMALMAP_TANGENTSPACE )

	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;

	#if defined( USE_PACKED_NORMALMAP )

		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );

	#endif

	mapN.xy *= normalScale;

	normal = normalize( tbn * mapN );

#elif defined( USE_BUMPMAP )

	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );

#endif
`;var sg=`
#ifndef FLAT_SHADED

	varying vec3 vNormal;

	#ifdef USE_TANGENT

		varying vec3 vTangent;
		varying vec3 vBitangent;

	#endif

#endif
`;var og=`
#ifndef FLAT_SHADED

	varying vec3 vNormal;

	#ifdef USE_TANGENT

		varying vec3 vTangent;
		varying vec3 vBitangent;

	#endif

#endif
`;var ag=`
#ifndef FLAT_SHADED // normal is computed with derivatives when FLAT_SHADED

	vNormal = normalize( transformedNormal );

	#ifdef USE_TANGENT

		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );

		#ifdef FLIP_SIDED

			vBitangent = - vBitangent;

		#endif

	#endif

#endif
`;var lg=`
#ifdef USE_NORMALMAP

	uniform sampler2D normalMap;
	uniform vec2 normalScale;

#endif

#ifdef USE_NORMALMAP_OBJECTSPACE

	uniform mat3 normalMatrix;

#endif

#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )

	// Normal Mapping Without Precomputed Tangents
	// http://www.thetenthplanet.de/archives/1180

	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {

		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );

		vec3 N = surf_norm; // normalized

		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );

		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;

		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );

		return mat3( T * scale, B * scale, N );

	}

#endif
`;var cg=`
#ifdef USE_CLEARCOAT

	vec3 clearcoatNormal = nonPerturbedNormal;

#endif
`;var hg=`
#ifdef USE_CLEARCOAT_NORMALMAP

	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;

	clearcoatNormal = normalize( tbn2 * clearcoatMapN );

#endif
`;var ug=`

#ifdef USE_CLEARCOATMAP

	uniform sampler2D clearcoatMap;

#endif

#ifdef USE_CLEARCOAT_NORMALMAP

	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;

#endif

#ifdef USE_CLEARCOAT_ROUGHNESSMAP

	uniform sampler2D clearcoatRoughnessMap;

#endif
`;var dg=`

#ifdef USE_IRIDESCENCEMAP

	uniform sampler2D iridescenceMap;

#endif

#ifdef USE_IRIDESCENCE_THICKNESSMAP

	uniform sampler2D iridescenceThicknessMap;

#endif
`;var fg=`
#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif

#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif

gl_FragColor = vec4( outgoingLight, diffuseColor.a );
`;var pg=`
vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}

vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}

const float PackUpscale = 256. / 255.; // fraction -> 0..1 (including 1)
const float UnpackDownscale = 255. / 256.; // 0..1 -> fraction (excluding 1)
const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;

const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );

const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );

vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}

vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	// the 0.9999 tweak is unimportant, very tiny empirical improvement
	// return vec3( vuf * Inv255, gf * PackUpscale, bf * 0.9999 );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}

vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}

float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}

float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}

float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}

vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}

vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}

// NOTE: viewZ, the z-coordinate in camera space, is negative for points in front of the camera

float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	// -near maps to 0; -far maps to 1
	return ( viewZ + near ) / ( near - far );
}

float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {

	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;

	#else

		return depth * ( near - far ) - near;

	#endif
}

// NOTE: https://twitter.com/gonnavis/status/1377183786949959682

float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	// -near maps to 0; -far maps to 1
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}

float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER

		return ( near * far ) / ( ( near - far ) * depth - near );

	#else

		return ( near * far ) / ( ( far - near ) * depth - far );

	#endif
}
`;var mg=`
#ifdef PREMULTIPLIED_ALPHA

	gl_FragColor.rgb *= gl_FragColor.a;

#endif
`;var gg=`
vec4 mvPosition = vec4( transformed, 1.0 );

#ifdef USE_BATCHING

	mvPosition = batchingMatrix * mvPosition;

#endif

#ifdef USE_INSTANCING

	mvPosition = instanceMatrix * mvPosition;

#endif

mvPosition = modelViewMatrix * mvPosition;

gl_Position = projectionMatrix * mvPosition;
`;var _g=`
#ifdef DITHERING

	gl_FragColor.rgb = dithering( gl_FragColor.rgb );

#endif
`;var xg=`
#ifdef DITHERING

	// based on https://www.shadertoy.com/view/MslGR8
	vec3 dithering( vec3 color ) {
		//Calculate grid position
		float grid_position = rand( gl_FragCoord.xy );

		//Shift the individual colors differently, thus making it even harder to see the dithering pattern
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );

		//modify shift according to grid position.
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );

		//shift the color by dither_shift
		return color + dither_shift_RGB;
	}

#endif
`;var yg=`
float roughnessFactor = roughness;

#ifdef USE_ROUGHNESSMAP

	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );

	// reads channel G, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
	roughnessFactor *= texelRoughness.g;

#endif
`;var vg=`
#ifdef USE_ROUGHNESSMAP

	uniform sampler2D roughnessMap;

#endif
`;var wg=`
#if NUM_SPOT_LIGHT_COORDS > 0

	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];

#endif

#if NUM_SPOT_LIGHT_MAPS > 0

	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];

#endif

#ifdef USE_SHADOWMAP

	#if NUM_SUN_LIGHT_SHADOWS > 0

		// must match the cascade count in SunLightShadow

		#define SUN_LIGHT_CASCADES 2

		#if defined( SHADOWMAP_TYPE_PCF )

			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];

		#else

			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];

		#endif

		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;

		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};

		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];

	#endif

	#if NUM_DIR_LIGHT_SHADOWS > 0

		#if defined( SHADOWMAP_TYPE_PCF )

			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];

		#else

			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];

		#endif

		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];

		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};

		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];

	#endif

	#if NUM_SPOT_LIGHT_SHADOWS > 0

		#if defined( SHADOWMAP_TYPE_PCF )

			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];

		#else

			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];

		#endif

		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};

		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];

	#endif

	#if NUM_POINT_LIGHT_SHADOWS > 0

		#if defined( SHADOWMAP_TYPE_PCF )

			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];

		#elif defined( SHADOWMAP_TYPE_BASIC )

			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];

		#endif

		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];

		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};

		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];

	#endif

	#if defined( SHADOWMAP_TYPE_PCF )

		// Interleaved Gradient Noise for randomizing sampling patterns
		float interleavedGradientNoise( vec2 position ) {

			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );

		}

		// Vogel disk sampling for uniform circular distribution
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {

			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;

		}

	#endif

	#if defined( SHADOWMAP_TYPE_PCF )

		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {

			float shadow = 1.0;

			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;

			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;

			if ( frustumTest ) {

				// Hardware PCF with LinearFilter gives us 4-tap filtering per sample
				// 5 samples using Vogel disk + IGN = effectively 20 filtered taps with better distribution
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;

				// Use IGN to rotate sampling pattern per pixel
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;

				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;

			}

			return mix( 1.0, shadow, shadowIntensity );

		}

	#elif defined( SHADOWMAP_TYPE_VSM )

		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {

			float shadow = 1.0;

			shadowCoord.xyz /= shadowCoord.w;

			#ifdef USE_REVERSED_DEPTH_BUFFER

				shadowCoord.z -= shadowBias;

			#else

				shadowCoord.z += shadowBias;

			#endif

			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;

			if ( frustumTest ) {

				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;

				float mean = distribution.x;
				float variance = distribution.y * distribution.y;

				#ifdef USE_REVERSED_DEPTH_BUFFER

					float hard_shadow = step( mean, shadowCoord.z );

				#else

					float hard_shadow = step( shadowCoord.z, mean );

				#endif
				
				// Early return if fully lit
				if ( hard_shadow == 1.0 ) {

					shadow = 1.0;

				} else {

					// Variance must be non-zero to avoid division by zero
					variance = max( variance, 0.0000001 );

					// Distance from mean
					float d = shadowCoord.z - mean;

					// Chebyshev's inequality for upper bound on probability
					float p_max = variance / ( variance + d * d );

					// Reduce light bleeding by remapping [amount, 1] to [0, 1]
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );

					shadow = max( hard_shadow, p_max );

				}

			}

			return mix( 1.0, shadow, shadowIntensity );

		}

	#else // SHADOWMAP_TYPE_BASIC

		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {

			float shadow = 1.0;

			shadowCoord.xyz /= shadowCoord.w;

			#ifdef USE_REVERSED_DEPTH_BUFFER

				shadowCoord.z -= shadowBias;

			#else

				shadowCoord.z += shadowBias;

			#endif

			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;

			if ( frustumTest ) {

				float depth = texture2D( shadowMap, shadowCoord.xy ).r;

				#ifdef USE_REVERSED_DEPTH_BUFFER

					shadow = step( depth, shadowCoord.z );

				#else

					shadow = step( shadowCoord.z, depth );

				#endif

			}

			return mix( 1.0, shadow, shadowIntensity );

		}

	#endif

	#if NUM_SUN_LIGHT_SHADOWS > 0

		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {

			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;

			float shadow = 1.0;

			// walk the cascades back to front so each fade band can blend with the shadow behind it

			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {

				// ( begin, end, fade start ) view depths of the cascade

				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];

				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {

					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);

					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );

				}

			}

			return shadow;

		}

	#endif

	#if NUM_POINT_LIGHT_SHADOWS > 0

	#if defined( SHADOWMAP_TYPE_PCF )

	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {

		float shadow = 1.0;

		// for point lights, the uniform @vShadowCoord is re-purposed to hold
		// the vector from the light to the world-space position of the fragment.
		vec3 lightToPosition = shadowCoord.xyz;

		// Direction from light to fragment
		vec3 bd3D = normalize( lightToPosition );

		// For cube shadow maps, depth is stored as distance along each face's view axis, not radial distance
		// The view-space depth is the maximum component of the direction vector (which face is sampled)
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );

		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {

			// viewZ to perspective depth

			#ifdef USE_REVERSED_DEPTH_BUFFER

				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;

			#else

				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;

			#endif

			// Hardware PCF with LinearFilter gives us 4-tap filtering per sample
			// Use Vogel disk + IGN sampling for better quality
			float texelSize = shadowRadius / shadowMapSize.x;

			// Build a tangent-space coordinate system for applying offsets
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );

			// Use IGN to rotate sampling pattern per pixel
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;

			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );

			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;

		}

		return mix( 1.0, shadow, shadowIntensity );

	}

	#elif defined( SHADOWMAP_TYPE_BASIC )

	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {

		float shadow = 1.0;

		// for point lights, the uniform @vShadowCoord is re-purposed to hold
		// the vector from the light to the world-space position of the fragment.
		vec3 lightToPosition = shadowCoord.xyz;

		// For cube shadow maps, depth is stored as distance along each face's view axis, not radial distance
		// The view-space depth is the maximum component of the direction vector (which face is sampled)
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );

		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {

			// viewZ to perspective depth

			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;

			// Direction from light to fragment
			vec3 bd3D = normalize( lightToPosition );

			float depth = textureCube( shadowMap, bd3D ).r;

			#ifdef USE_REVERSED_DEPTH_BUFFER

				depth = 1.0 - depth;

			#endif

			shadow = step( dp, depth );

		}

		return mix( 1.0, shadow, shadowIntensity );

	}

	#endif

	#endif

#endif
`;var bg=`

#if NUM_SPOT_LIGHT_COORDS > 0

	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];

#endif

#ifdef USE_SHADOWMAP

	#if NUM_SUN_LIGHT_SHADOWS > 0

		// cascade selection and shadow coordinates are computed per fragment

		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;

	#endif

	#if NUM_DIR_LIGHT_SHADOWS > 0

		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];

		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};

		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];

	#endif

	#if NUM_SPOT_LIGHT_SHADOWS > 0

		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};

		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];

	#endif

	#if NUM_POINT_LIGHT_SHADOWS > 0

		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];

		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};

		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];

	#endif

	/*
	#if NUM_RECT_AREA_LIGHTS > 0

		// TODO (abelnation): uniforms for area light shadows

	#endif
	*/

#endif
`;var Mg=`

#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )

	#ifdef HAS_NORMAL

		// Offsetting the position used for querying occlusion along the world normal can be used to reduce shadow acne.

		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );

	#else

		vec3 shadowWorldNormal = vec3( 0.0 ); // fallback, see #21483

	#endif

	vec4 shadowWorldPosition;

#endif

#if defined( USE_SHADOWMAP )

	#if NUM_SUN_LIGHT_SHADOWS > 0

		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;

	#endif

	#if NUM_DIR_LIGHT_SHADOWS > 0

		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {

			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;

		}
		#pragma unroll_loop_end

	#endif

	#if NUM_POINT_LIGHT_SHADOWS > 0

		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {

			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;

		}
		#pragma unroll_loop_end

	#endif

	/*
	#if NUM_RECT_AREA_LIGHTS > 0

		// TODO (abelnation): update vAreaShadowCoord with area light info

	#endif
	*/

#endif

// spot lights can be evaluated without active shadow mapping (when SpotLight.map is used)

#if NUM_SPOT_LIGHT_COORDS > 0

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {

		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;

	}
	#pragma unroll_loop_end

#endif


`;var Sg=`
float getShadowMask() {

	float shadow = 1.0;

	#ifdef USE_SHADOWMAP

	#if NUM_SUN_LIGHT_SHADOWS > 0

	SunLightShadow sunLight;

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {

		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;

	}
	#pragma unroll_loop_end

	#endif

	#if NUM_DIR_LIGHT_SHADOWS > 0

	DirectionalLightShadow directionalLight;

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {

		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;

	}
	#pragma unroll_loop_end

	#endif

	#if NUM_SPOT_LIGHT_SHADOWS > 0

	SpotLightShadow spotLight;

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {

		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;

	}
	#pragma unroll_loop_end

	#endif

	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )

	PointLightShadow pointLight;

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {

		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;

	}
	#pragma unroll_loop_end

	#endif

	/*
	#if NUM_RECT_AREA_LIGHTS > 0

		// TODO (abelnation): update shadow for Area light

	#endif
	*/

	#endif

	return shadow;

}
`;var Ag=`
#ifdef USE_SKINNING

	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );

#endif
`;var Tg=`
#ifdef USE_SKINNING

	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;

	uniform highp sampler2D boneTexture;

	mat4 getBoneMatrix( const in float i ) {

		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );

		return mat4( v1, v2, v3, v4 );

	}

#endif
`;var Cg=`
#ifdef USE_SKINNING

	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );

	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;

	transformed = ( bindMatrixInverse * skinned ).xyz;

#endif
`;var Eg=`
#ifdef USE_SKINNING

	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;

	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;

	#ifdef USE_TANGENT

		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;

	#endif

#endif
`;var Ig=`
float specularStrength;

#ifdef USE_SPECULARMAP

	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;

#else

	specularStrength = 1.0;

#endif
`;var Rg=`
#ifdef USE_SPECULARMAP

	uniform sampler2D specularMap;

#endif
`;var Pg=`
#if defined( TONE_MAPPING )

	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );

#endif
`;var Lg=`
#ifndef saturate
// <common> may have defined saturate() already
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif

uniform float toneMappingExposure;

// exposure only
vec3 LinearToneMapping( vec3 color ) {

	return saturate( toneMappingExposure * color );

}

// source: https://www.cs.utah.edu/docs/techreports/2002/pdf/UUCS-02-001.pdf
vec3 ReinhardToneMapping( vec3 color ) {

	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );

}

// source: http://filmicworlds.com/blog/filmic-tonemapping-operators/
vec3 CineonToneMapping( vec3 color ) {

	// filmic operator by Jim Hejl and Richard Burgess-Dawson
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );

}

// source: https://github.com/selfshadow/ltc_code/blob/master/webgl/shaders/ltc/ltc_blit.fs
vec3 RRTAndODTFit( vec3 v ) {

	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;

}

// this implementation of ACES is modified to accommodate a brighter viewing environment.
// the scale factor of 1/0.6 is subjective. see discussion in #19621.

vec3 ACESFilmicToneMapping( vec3 color ) {

	// sRGB => XYZ => D65_2_D60 => AP1 => RRT_SAT
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ), // transposed from source
		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);

	// ODT_SAT => XYZ => D60_2_D65 => sRGB
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ), // transposed from source
		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);

	color *= toneMappingExposure / 0.6;

	color = ACESInputMat * color;

	// Apply RRT and ODT
	color = RRTAndODTFit( color );

	color = ACESOutputMat * color;

	// Clamp to [0, 1]
	return saturate( color );

}

// Matrices for rec 2020 <> rec 709 color space conversion
// matrix provided in row-major order so it has been transposed
// https://www.itu.int/pub/R-REP-BT.2407-2017
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);

const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);

// https://iolite-engine.com/blog_posts/minimal_agx_implementation
// Mean error^2: 3.6705141e-06
vec3 agxDefaultContrastApprox( vec3 x ) {

	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;

	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;

}

// AgX Tone Mapping implementation based on Filament, which in turn is based
// on Blender's implementation using rec 2020 primaries
// https://github.com/google/filament/pull/7236
// Inputs and outputs are encoded as Linear-sRGB.

vec3 AgXToneMapping( vec3 color ) {

	// AgX constants
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);

	// explicit AgXOutsetMatrix generated from Filaments AgXOutsetMatrixInv
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);

	// LOG2_MIN      = -10.0
	// LOG2_MAX      =  +6.5
	// MIDDLE_GRAY   =  0.18
	const float AgxMinEv = - 12.47393;  // log2( pow( 2, LOG2_MIN ) * MIDDLE_GRAY )
	const float AgxMaxEv = 4.026069;    // log2( pow( 2, LOG2_MAX ) * MIDDLE_GRAY )

	color *= toneMappingExposure;

	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;

	color = AgXInsetMatrix * color;

	// Log2 encoding
	color = max( color, 1e-10 ); // avoid 0 or negative numbers for log2
	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );

	color = clamp( color, 0.0, 1.0 );

	// Apply sigmoid
	color = agxDefaultContrastApprox( color );

	// Apply AgX look
	// v = agxLook(v, look);

	color = AgXOutsetMatrix * color;

	// Linearize
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );

	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;

	// Gamut mapping. Simple clamp for now.
	color = clamp( color, 0.0, 1.0 );

	return color;

}

// https://modelviewer.dev/examples/tone-mapping

vec3 NeutralToneMapping( vec3 color ) {

	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;

	color *= toneMappingExposure;

	float x = min( color.r, min( color.g, color.b ) );

	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;

	color -= offset;

	float peak = max( color.r, max( color.g, color.b ) );

	if ( peak < StartCompression ) return color;

	float d = 1. - StartCompression;

	float newPeak = 1. - d * d / ( peak + d - StartCompression );

	color *= newPeak / peak;

	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );

	return mix( color, vec3( newPeak ), g );

}

vec3 CustomToneMapping( vec3 color ) { return color; }
`;var Ng=`
#ifdef USE_TRANSMISSION

	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;

	#ifdef USE_TRANSMISSIONMAP

		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;

	#endif

	#ifdef USE_THICKNESSMAP

		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;

	#endif

	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );

	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );

	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );

	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );

#endif
`;var Dg=`
#ifdef USE_TRANSMISSION

	// Transmission code is based on glTF-Sampler-Viewer
	// https://github.com/KhronosGroup/glTF-Sample-Viewer

	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;

	#ifdef USE_TRANSMISSIONMAP

		uniform sampler2D transmissionMap;

	#endif

	#ifdef USE_THICKNESSMAP

		uniform sampler2D thicknessMap;

	#endif

	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;

	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;

	varying vec3 vWorldPosition;

	// Mipped Bicubic Texture Filtering by N8
	// https://www.shadertoy.com/view/Dl2SDW

	float w0( float a ) {

		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );

	}

	float w1( float a ) {

		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );

	}

	float w2( float a ){

		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );

	}

	float w3( float a ) {

		return ( 1.0 / 6.0 ) * ( a * a * a );

	}

	// g0 and g1 are the two amplitude functions
	float g0( float a ) {

		return w0( a ) + w1( a );

	}

	float g1( float a ) {

		return w2( a ) + w3( a );

	}

	// h0 and h1 are the two offset functions
	float h0( float a ) {

		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );

	}

	float h1( float a ) {

		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );

	}

	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {

		uv = uv * texelSize.zw + 0.5;

		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );

		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );

		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;

		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );

	}

	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {

		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );

	}

	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {

		// Direction of refracted light.
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );

		// Compute rotation-independent scaling of the model matrix.
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );

		// The thickness is specified in local space.
		return normalize( refractionVector ) * thickness * modelScale;

	}

	float applyIorToRoughness( const in float roughness, const in float ior ) {

		// Scale roughness with IOR so that an IOR of 1.0 results in no microfacet refraction and
		// an IOR of 1.5 results in the default amount of microfacet refraction.
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );

	}

	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {

		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );

	}

	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {

		if ( isinf( attenuationDistance ) ) {

			// Attenuation distance is +\u221E, i.e. the transmitted color is not attenuated at all.
			return vec3( 1.0 );

		} else {

			// Compute light attenuation using Beer's law.
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance ); // Beer's law
			return transmittance;

		}

	}

	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {

		vec4 transmittedLight;
		vec3 transmittance;

		#ifdef USE_DISPERSION

			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );

			for ( int i = 0; i < 3; i ++ ) {

				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;

				// Project refracted vector on the framebuffer, while mapping to normalized device coordinates.
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;

				// Sample framebuffer to get pixel the refracted ray hits.
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;

				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];

			}

			transmittedLight.a /= 3.0;

		#else

			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;

			// Project refracted vector on the framebuffer, while mapping to normalized device coordinates.
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;

			// Sample framebuffer to get pixel the refracted ray hits.
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );

		#endif

		vec3 attenuatedColor = transmittance * transmittedLight.rgb;

		// Get the specular component.
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );

		// As less light is transmitted, the opacity should be increased. This simple approximation does a decent job
		// of modulating a CSS background, and has no effect when the buffer is opaque, due to a solid object or clear color.
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;

		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );

	}
#endif
`;var Bg=`
#if defined( USE_UV ) || defined( USE_ANISOTROPY )

	varying vec2 vUv;

#endif
#ifdef USE_MAP

	varying vec2 vMapUv;

#endif
#ifdef USE_ALPHAMAP

	varying vec2 vAlphaMapUv;

#endif
#ifdef USE_LIGHTMAP

	varying vec2 vLightMapUv;

#endif
#ifdef USE_AOMAP

	varying vec2 vAoMapUv;

#endif
#ifdef USE_BUMPMAP

	varying vec2 vBumpMapUv;

#endif
#ifdef USE_NORMALMAP

	varying vec2 vNormalMapUv;

#endif
#ifdef USE_EMISSIVEMAP

	varying vec2 vEmissiveMapUv;

#endif
#ifdef USE_METALNESSMAP

	varying vec2 vMetalnessMapUv;

#endif
#ifdef USE_ROUGHNESSMAP

	varying vec2 vRoughnessMapUv;

#endif
#ifdef USE_ANISOTROPYMAP

	varying vec2 vAnisotropyMapUv;

#endif
#ifdef USE_CLEARCOATMAP

	varying vec2 vClearcoatMapUv;

#endif
#ifdef USE_CLEARCOAT_NORMALMAP

	varying vec2 vClearcoatNormalMapUv;

#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP

	varying vec2 vClearcoatRoughnessMapUv;

#endif
#ifdef USE_IRIDESCENCEMAP

	varying vec2 vIridescenceMapUv;

#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP

	varying vec2 vIridescenceThicknessMapUv;

#endif
#ifdef USE_SHEEN_COLORMAP

	varying vec2 vSheenColorMapUv;

#endif
#ifdef USE_SHEEN_ROUGHNESSMAP

	varying vec2 vSheenRoughnessMapUv;

#endif
#ifdef USE_SPECULARMAP

	varying vec2 vSpecularMapUv;

#endif
#ifdef USE_SPECULAR_COLORMAP

	varying vec2 vSpecularColorMapUv;

#endif
#ifdef USE_SPECULAR_INTENSITYMAP

	varying vec2 vSpecularIntensityMapUv;

#endif
#ifdef USE_TRANSMISSIONMAP

	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;

#endif
#ifdef USE_THICKNESSMAP

	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;

#endif
`;var Fg=`
#if defined( USE_UV ) || defined( USE_ANISOTROPY )

	varying vec2 vUv;

#endif
#ifdef USE_MAP

	uniform mat3 mapTransform;
	varying vec2 vMapUv;

#endif
#ifdef USE_ALPHAMAP

	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;

#endif
#ifdef USE_LIGHTMAP

	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;

#endif
#ifdef USE_AOMAP

	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;

#endif
#ifdef USE_BUMPMAP

	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;

#endif
#ifdef USE_NORMALMAP

	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;

#endif
#ifdef USE_DISPLACEMENTMAP

	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;

#endif
#ifdef USE_EMISSIVEMAP

	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;

#endif
#ifdef USE_METALNESSMAP

	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;

#endif
#ifdef USE_ROUGHNESSMAP

	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;

#endif
#ifdef USE_ANISOTROPYMAP

	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;

#endif
#ifdef USE_CLEARCOATMAP

	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;

#endif
#ifdef USE_CLEARCOAT_NORMALMAP

	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;

#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP

	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;

#endif
#ifdef USE_SHEEN_COLORMAP

	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;

#endif
#ifdef USE_SHEEN_ROUGHNESSMAP

	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;

#endif
#ifdef USE_IRIDESCENCEMAP

	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;

#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP

	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;

#endif
#ifdef USE_SPECULARMAP

	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;

#endif
#ifdef USE_SPECULAR_COLORMAP

	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;

#endif
#ifdef USE_SPECULAR_INTENSITYMAP

	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;

#endif
#ifdef USE_TRANSMISSIONMAP

	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;

#endif
#ifdef USE_THICKNESSMAP

	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;

#endif
`;var Og=`
#if defined( USE_UV ) || defined( USE_ANISOTROPY )

	vUv = vec3( uv, 1 ).xy;

#endif
#ifdef USE_MAP

	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;

#endif
#ifdef USE_ALPHAMAP

	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_LIGHTMAP

	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_AOMAP

	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_BUMPMAP

	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_NORMALMAP

	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_DISPLACEMENTMAP

	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_EMISSIVEMAP

	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_METALNESSMAP

	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_ROUGHNESSMAP

	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_ANISOTROPYMAP

	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_CLEARCOATMAP

	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_CLEARCOAT_NORMALMAP

	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP

	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_IRIDESCENCEMAP

	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP

	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_SHEEN_COLORMAP

	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_SHEEN_ROUGHNESSMAP

	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_SPECULARMAP

	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_SPECULAR_COLORMAP

	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_SPECULAR_INTENSITYMAP

	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_TRANSMISSIONMAP

	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;

#endif
#ifdef USE_THICKNESSMAP

	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;

#endif
`;var Ug=`
#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0

	vec4 worldPosition = vec4( transformed, 1.0 );

	#ifdef USE_BATCHING

		worldPosition = batchingMatrix * worldPosition;

	#endif

	#ifdef USE_INSTANCING

		worldPosition = instanceMatrix * worldPosition;

	#endif

	worldPosition = modelMatrix * worldPosition;

#endif
`;var zg=`
varying vec2 vUv;
uniform mat3 uvTransform;

void main() {

	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;

	gl_Position = vec4( position.xy, 1.0, 1.0 );

}
`,kg=`
uniform sampler2D t2D;
uniform float backgroundIntensity;

varying vec2 vUv;

void main() {

	vec4 texColor = texture2D( t2D, vUv );

	#ifdef DECODE_VIDEO_TEXTURE

		// use inline sRGB decode until browsers properly support SRGB8_ALPHA8 with video textures

		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );

	#endif

	texColor.rgb *= backgroundIntensity;

	gl_FragColor = texColor;

	#include <tonemapping_fragment>
	#include <colorspace_fragment>

}
`;var Vg=`
varying vec3 vWorldDirection;

#include <common>

void main() {

	vWorldDirection = transformDirection( position, modelMatrix );

	#include <begin_vertex>
	#include <project_vertex>

	gl_Position.z = gl_Position.w; // set z to camera.far

}
`,Gg=`

#ifdef ENVMAP_TYPE_CUBE

	uniform samplerCube envMap;

#elif defined( ENVMAP_TYPE_CUBE_UV )

	uniform sampler2D envMap;

#endif

uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;

varying vec3 vWorldDirection;

#include <cube_uv_reflection_fragment>

void main() {

	#ifdef ENVMAP_TYPE_CUBE

		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );

	#elif defined( ENVMAP_TYPE_CUBE_UV )

		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );

	#else

		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );

	#endif

	texColor.rgb *= backgroundIntensity;

	gl_FragColor = texColor;

	#include <tonemapping_fragment>
	#include <colorspace_fragment>

}
`;var Hg=`
varying vec3 vWorldDirection;

#include <common>

void main() {

	vWorldDirection = transformDirection( position, modelMatrix );

	#include <begin_vertex>
	#include <project_vertex>

	gl_Position.z = gl_Position.w; // set z to camera.far

}
`,Wg=`
uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;

varying vec3 vWorldDirection;

void main() {

	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );

	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;

	#include <tonemapping_fragment>
	#include <colorspace_fragment>

}
`;var qg=`
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

// This is used for computing an equivalent of gl_FragCoord.z that is as high precision as possible.
// Some platforms compute gl_FragCoord at a lower precision which makes the manually computed value better for
// depth-based postprocessing effects. Reproduced on iPad with A10 processor / iPadOS 13.3.1.
varying vec2 vHighPrecisionZW;

void main() {

	#include <uv_vertex>

	#include <batching_vertex>
	#include <skinbase_vertex>

	#include <morphinstance_vertex>

	#ifdef USE_DISPLACEMENTMAP

		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>

	#endif

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vHighPrecisionZW = gl_Position.zw;

}
`,Xg=`
#if DEPTH_PACKING == 3200

	uniform float opacity;

#endif

#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

varying vec2 vHighPrecisionZW;

void main() {

	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>

	#if DEPTH_PACKING == 3200

		diffuseColor.a = opacity;

	#endif

	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>

	#include <logdepthbuf_fragment>

	// Higher precision equivalent of gl_FragCoord.z

	#ifdef USE_REVERSED_DEPTH_BUFFER

		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];

	#else

		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;

	#endif

	#if DEPTH_PACKING == 3200

		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );

	#elif DEPTH_PACKING == 3201

		// TODO Deprecate
		gl_FragColor = packDepthToRGBA( fragCoordZ );

	#elif DEPTH_PACKING == 3202

		// TODO Deprecate
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );

	#elif DEPTH_PACKING == 3203

		// TODO Deprecate
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );

	#endif

}
`;var Yg=`
#define DISTANCE

varying vec3 vWorldPosition;

#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>

	#include <batching_vertex>
	#include <skinbase_vertex>

	#include <morphinstance_vertex>

	#ifdef USE_DISPLACEMENTMAP

		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>

	#endif

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>

	vWorldPosition = worldPosition.xyz;

}
`,Zg=`
#define DISTANCE

uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;

#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>

	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>

	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist ); // clamp to [ 0, 1 ]

	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );

}
`;var Jg=`
varying vec3 vWorldDirection;

#include <common>

void main() {

	vWorldDirection = transformDirection( position, modelMatrix );

	#include <begin_vertex>
	#include <project_vertex>

}
`,Kg=`
uniform sampler2D tEquirect;

varying vec3 vWorldDirection;

#include <common>

void main() {

	vec3 direction = normalize( vWorldDirection );

	vec2 sampleUV = equirectUv( direction );

	gl_FragColor = texture2D( tEquirect, sampleUV );

	#include <tonemapping_fragment>
	#include <colorspace_fragment>

}
`;var jg=`
uniform float scale;
attribute float lineDistance;

varying float vLineDistance;

#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	vLineDistance = scale * lineDistance;

	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>

}
`,$g=`
uniform vec3 diffuse;
uniform float opacity;

uniform float dashSize;
uniform float totalSize;

varying float vLineDistance;

#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>

	if ( mod( vLineDistance, totalSize ) > dashSize ) {

		discard;

	}

	vec3 outgoingLight = vec3( 0.0 );

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>

	outgoingLight = diffuseColor.rgb; // simple shader

	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>

}
`;var Qg=`
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>

	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )

		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>

	#endif

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>

}
`,e_=`
uniform vec3 diffuse;
uniform float opacity;

#ifndef FLAT_SHADED

	varying vec3 vNormal;

#endif

#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>

	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );

	// accumulation (baked indirect lighting only)
	#ifdef USE_LIGHTMAP

		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;

	#else

		reflectedLight.indirectDiffuse += vec3( 1.0 );

	#endif

	// modulation
	#include <aomap_fragment>

	reflectedLight.indirectDiffuse *= diffuseColor.rgb;

	vec3 outgoingLight = reflectedLight.indirectDiffuse;

	#include <envmap_fragment>

	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}
`;var t_=`
#define LAMBERT

varying vec3 vViewPosition;

#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vViewPosition = - mvPosition.xyz;

	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>

}
`,i_=`
#define LAMBERT

uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;

#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>

	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>

	// accumulation
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	// modulation
	#include <aomap_fragment>

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;

	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}
`;var r_=`
#define MATCAP

varying vec3 vViewPosition;

#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>

#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>

	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>

	vViewPosition = - mvPosition.xyz;

}
`,n_=`
#define MATCAP

uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;

varying vec3 vViewPosition;

#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>

	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5; // 0.495 to remove artifacts caused by undersized matcap disks

	#ifdef USE_MATCAP

		vec4 matcapColor = texture2D( matcap, uv );

	#else

		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 ); // default if matcap is missing

	#endif

	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;

	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}
`;var s_=`
#define NORMAL

#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )

	varying vec3 vViewPosition;

#endif

#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>
	#include <batching_vertex>

	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )

	vViewPosition = - mvPosition.xyz;

#endif

}
`,o_=`
#define NORMAL

uniform float opacity;

#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )

	varying vec3 vViewPosition;

#endif

#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );

	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>

	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );

	#ifdef OPAQUE

		gl_FragColor.a = 1.0;

	#endif

}
`;var a_=`
#define PHONG

varying vec3 vViewPosition;

#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>

	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vViewPosition = - mvPosition.xyz;

	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>

}
`,l_=`
#define PHONG

uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;

#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>

	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>

	// accumulation
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	// modulation
	#include <aomap_fragment>

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}
`;var c_=`
#define STANDARD

varying vec3 vViewPosition;

#ifdef USE_TRANSMISSION

	varying vec3 vWorldPosition;

#endif

#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vViewPosition = - mvPosition.xyz;

	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>

#ifdef USE_TRANSMISSION

	vWorldPosition = worldPosition.xyz;

#endif
}
`,h_=`
#define STANDARD

#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif

uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;

#ifdef IOR
	uniform float ior;
#endif

#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;

	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif

	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif

#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif

#ifdef USE_DISPERSION
	uniform float dispersion;
#endif

#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif

#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif

#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;

	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif

	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif

#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;

	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif

varying vec3 vViewPosition;

#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>

	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>

	// accumulation
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	// modulation
	#include <aomap_fragment>

	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;

	#include <transmission_fragment>

	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;

	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif

	#ifdef USE_CLEARCOAT

		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );

		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );

		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;

	#endif

	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}
`;var u_=`
#define TOON

varying vec3 vViewPosition;

#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vViewPosition = - mvPosition.xyz;

	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>

}
`,d_=`
#define TOON

uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;

#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>

	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>

	// accumulation
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	// modulation
	#include <aomap_fragment>

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;

	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}
`;var f_=`
uniform float size;
uniform float scale;

#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

#ifdef USE_POINTS_UV

	varying vec2 vUv;
	uniform mat3 uvTransform;

#endif

void main() {

	#ifdef USE_POINTS_UV

		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;

	#endif

	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>

	gl_PointSize = size;

	#ifdef USE_SIZEATTENUATION

		bool isPerspective = isPerspectiveMatrix( projectionMatrix );

		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );

	#endif

	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>

}
`,p_=`
uniform vec3 diffuse;
uniform float opacity;

#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>

	vec3 outgoingLight = vec3( 0.0 );

	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>

	outgoingLight = diffuseColor.rgb;

	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>

}
`;var m_=`
#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>

void main() {

	#include <batching_vertex>

	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>

	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>

}
`,g_=`
uniform vec3 color;
uniform float opacity;

#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>

void main() {

	#include <logdepthbuf_fragment>

	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );

	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>

}
`;var __=`
uniform float rotation;
uniform vec2 center;

#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <uv_vertex>

	vec4 mvPosition = modelViewMatrix[ 3 ];

	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );

	#ifndef USE_SIZEATTENUATION

		bool isPerspective = isPerspectiveMatrix( projectionMatrix );

		if ( isPerspective ) scale *= - mvPosition.z;

	#endif

	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;

	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;

	mvPosition.xy += rotatedPosition;

	gl_Position = projectionMatrix * mvPosition;

	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>

}
`,x_=`
uniform vec3 diffuse;
uniform float opacity;

#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>

	vec3 outgoingLight = vec3( 0.0 );

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>

	outgoingLight = diffuseColor.rgb;

	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>

}
`;var ie={alphahash_fragment:zp,alphahash_pars_fragment:kp,alphamap_fragment:Vp,alphamap_pars_fragment:Gp,alphatest_fragment:Hp,alphatest_pars_fragment:Wp,aomap_fragment:qp,aomap_pars_fragment:Xp,batching_pars_vertex:Yp,batching_vertex:Zp,begin_vertex:Jp,beginnormal_vertex:Kp,bsdfs:jp,iridescence_fragment:$p,bumpmap_pars_fragment:Qp,clipping_planes_fragment:em,clipping_planes_pars_fragment:tm,clipping_planes_pars_vertex:im,clipping_planes_vertex:rm,color_fragment:nm,color_pars_fragment:sm,color_pars_vertex:om,color_vertex:am,common:lm,cube_uv_reflection_fragment:cm,defaultnormal_vertex:hm,displacementmap_pars_vertex:um,displacementmap_vertex:dm,emissivemap_fragment:fm,emissivemap_pars_fragment:pm,colorspace_fragment:mm,colorspace_pars_fragment:gm,envmap_fragment:_m,envmap_common_pars_fragment:xm,envmap_pars_fragment:ym,envmap_pars_vertex:vm,envmap_physical_pars_fragment:Pm,envmap_vertex:wm,fog_vertex:bm,fog_pars_vertex:Mm,fog_fragment:Sm,fog_pars_fragment:Am,gradientmap_pars_fragment:Tm,lightmap_pars_fragment:Cm,lights_lambert_fragment:Em,lights_lambert_pars_fragment:Im,lights_pars_begin:Rm,lights_toon_fragment:Lm,lights_toon_pars_fragment:Nm,lights_phong_fragment:Dm,lights_phong_pars_fragment:Bm,lights_physical_fragment:Fm,lights_physical_pars_fragment:Om,lights_fragment_begin:Um,lights_fragment_maps:zm,lights_fragment_end:km,lightprobes_pars_fragment:Vm,logdepthbuf_fragment:Gm,logdepthbuf_pars_fragment:Hm,logdepthbuf_pars_vertex:Wm,logdepthbuf_vertex:qm,map_fragment:Xm,map_pars_fragment:Ym,map_particle_fragment:Zm,map_particle_pars_fragment:Jm,metalnessmap_fragment:Km,metalnessmap_pars_fragment:jm,morphinstance_vertex:$m,morphcolor_vertex:Qm,morphnormal_vertex:eg,morphtarget_pars_vertex:tg,morphtarget_vertex:ig,normal_fragment_begin:rg,normal_fragment_maps:ng,normal_pars_fragment:sg,normal_pars_vertex:og,normal_vertex:ag,normalmap_pars_fragment:lg,clearcoat_normal_fragment_begin:cg,clearcoat_normal_fragment_maps:hg,clearcoat_pars_fragment:ug,iridescence_pars_fragment:dg,opaque_fragment:fg,packing:pg,premultiplied_alpha_fragment:mg,project_vertex:gg,dithering_fragment:_g,dithering_pars_fragment:xg,roughnessmap_fragment:yg,roughnessmap_pars_fragment:vg,shadowmap_pars_fragment:wg,shadowmap_pars_vertex:bg,shadowmap_vertex:Mg,shadowmask_pars_fragment:Sg,skinbase_vertex:Ag,skinning_pars_vertex:Tg,skinning_vertex:Cg,skinnormal_vertex:Eg,specularmap_fragment:Ig,specularmap_pars_fragment:Rg,tonemapping_fragment:Pg,tonemapping_pars_fragment:Lg,transmission_fragment:Ng,transmission_pars_fragment:Dg,uv_pars_fragment:Bg,uv_pars_vertex:Fg,uv_vertex:Og,worldpos_vertex:Ug,background_vert:zg,background_frag:kg,backgroundCube_vert:Vg,backgroundCube_frag:Gg,cube_vert:Hg,cube_frag:Wg,depth_vert:qg,depth_frag:Xg,distance_vert:Yg,distance_frag:Zg,equirect_vert:Jg,equirect_frag:Kg,linedashed_vert:jg,linedashed_frag:$g,meshbasic_vert:Qg,meshbasic_frag:e_,meshlambert_vert:t_,meshlambert_frag:i_,meshmatcap_vert:r_,meshmatcap_frag:n_,meshnormal_vert:s_,meshnormal_frag:o_,meshphong_vert:a_,meshphong_frag:l_,meshphysical_vert:c_,meshphysical_frag:h_,meshtoon_vert:u_,meshtoon_frag:d_,points_vert:f_,points_frag:p_,shadow_vert:m_,shadow_frag:g_,sprite_vert:__,sprite_frag:x_};var U={common:{diffuse:{value:new L(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Z},alphaMap:{value:null},alphaMapTransform:{value:new Z},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Z}},envmap:{envMap:{value:null},envMapRotation:{value:new Z},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Z}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Z}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Z},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Z},normalScale:{value:new E(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Z},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Z}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Z}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Z}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new L(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new w},probesMax:{value:new w},probesResolution:{value:new w}},points:{diffuse:{value:new L(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Z},alphaTest:{value:0},uvTransform:{value:new Z}},sprite:{diffuse:{value:new L(16777215)},opacity:{value:1},center:{value:new E(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Z},alphaMap:{value:null},alphaMapTransform:{value:new Z},alphaTest:{value:0}}};var sh={basic:{uniforms:mt([U.common,U.specularmap,U.envmap,U.aomap,U.lightmap,U.fog]),vertexShader:ie.meshbasic_vert,fragmentShader:ie.meshbasic_frag},lambert:{uniforms:mt([U.common,U.specularmap,U.envmap,U.aomap,U.lightmap,U.emissivemap,U.bumpmap,U.normalmap,U.displacementmap,U.fog,U.lights,{emissive:{value:new L(0)},envMapIntensity:{value:1}}]),vertexShader:ie.meshlambert_vert,fragmentShader:ie.meshlambert_frag},phong:{uniforms:mt([U.common,U.specularmap,U.envmap,U.aomap,U.lightmap,U.emissivemap,U.bumpmap,U.normalmap,U.displacementmap,U.fog,U.lights,{emissive:{value:new L(0)},specular:{value:new L(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:ie.meshphong_vert,fragmentShader:ie.meshphong_frag},standard:{uniforms:mt([U.common,U.envmap,U.aomap,U.lightmap,U.emissivemap,U.bumpmap,U.normalmap,U.displacementmap,U.roughnessmap,U.metalnessmap,U.fog,U.lights,{emissive:{value:new L(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:ie.meshphysical_vert,fragmentShader:ie.meshphysical_frag},toon:{uniforms:mt([U.common,U.aomap,U.lightmap,U.emissivemap,U.bumpmap,U.normalmap,U.displacementmap,U.gradientmap,U.fog,U.lights,{emissive:{value:new L(0)}}]),vertexShader:ie.meshtoon_vert,fragmentShader:ie.meshtoon_frag},matcap:{uniforms:mt([U.common,U.bumpmap,U.normalmap,U.displacementmap,U.fog,{matcap:{value:null}}]),vertexShader:ie.meshmatcap_vert,fragmentShader:ie.meshmatcap_frag},points:{uniforms:mt([U.points,U.fog]),vertexShader:ie.points_vert,fragmentShader:ie.points_frag},dashed:{uniforms:mt([U.common,U.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:ie.linedashed_vert,fragmentShader:ie.linedashed_frag},depth:{uniforms:mt([U.common,U.displacementmap]),vertexShader:ie.depth_vert,fragmentShader:ie.depth_frag},normal:{uniforms:mt([U.common,U.bumpmap,U.normalmap,U.displacementmap,{opacity:{value:1}}]),vertexShader:ie.meshnormal_vert,fragmentShader:ie.meshnormal_frag},sprite:{uniforms:mt([U.sprite,U.fog]),vertexShader:ie.sprite_vert,fragmentShader:ie.sprite_frag},background:{uniforms:{uvTransform:{value:new Z},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:ie.background_vert,fragmentShader:ie.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Z}},vertexShader:ie.backgroundCube_vert,fragmentShader:ie.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:ie.cube_vert,fragmentShader:ie.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:ie.equirect_vert,fragmentShader:ie.equirect_frag},distance:{uniforms:mt([U.common,U.displacementmap,{referencePosition:{value:new w},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:ie.distance_vert,fragmentShader:ie.distance_frag},shadow:{uniforms:mt([U.lights,U.fog,{color:{value:new L(0)},opacity:{value:1}}]),vertexShader:ie.shadow_vert,fragmentShader:ie.shadow_frag}};sh.physical={uniforms:mt([sh.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Z},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Z},clearcoatNormalScale:{value:new E(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Z},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Z},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Z},sheen:{value:0},sheenColor:{value:new L(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Z},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Z},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Z},transmissionSamplerSize:{value:new E},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Z},attenuationDistance:{value:0},attenuationColor:{value:new L(0)},specularColor:{value:new L(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Z},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Z},anisotropyVector:{value:new E},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Z}}]),vertexShader:ie.meshphysical_vert,fragmentShader:ie.meshphysical_frag};var xo=4,rw=6,nw=20,sw=256,wa=new ii,y_=new L,id=null,rd=0,nd=0,sd=!1,ow=new w,mn=new w,ba=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,i=.1,r=100,n={}){let{size:s=256,position:a=ow}=n;id=this._renderer.getRenderTarget(),rd=this._renderer.getActiveCubeFace(),nd=this._renderer.getActiveMipmapLevel(),sd=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(s);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,i,r,l,a),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=b_(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=w_(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(id,rd,nd),this._renderer.xr.enabled=sd,e.scissorTest=!1,_o(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===At||e.mapping===Ui?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),id=this._renderer.getRenderTarget(),rd=this._renderer.getActiveCubeFace(),nd=this._renderer.getActiveMipmapLevel(),sd=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:xe,minFilter:xe,generateMipmaps:!1,type:zi,format:je,colorSpace:ct,depthBuffer:!1},r=v_(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=v_(e,t,i);let{_lodMax:n}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=aw(n)),this._blurMaterial=cw(n,e,t),this._ggxMaterial=lw(n,e,t)}return r}_compileMaterial(e){let t=new ae(new D,e);this._renderer.compile(t,wa)}_sceneToCubeUV(e,t,i,r,n){let l=new be(90,1,t,i),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],u=this._renderer,d=u.autoClear,f=u.toneMapping;u.getClearColor(y_),u.toneMapping=bn,u.autoClear=!1,u.state.buffers.depth.getReversed()&&(u.setRenderTarget(r),u.clearDepth(),u.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new ae(new Ci,new _e({name:"PMREM.Background",side:yi,depthWrite:!1,depthTest:!1})));let m=this._backgroundBox,_=m.material,g=!1,x=e.background;x?x.isColor&&(_.color.copy(x),e.background=null,g=!0):(_.color.copy(y_),g=!0);for(let y=0;y<6;y++){let v=y%3;v===0?(l.up.set(0,c[y],0),l.position.set(n.x,n.y,n.z),l.lookAt(n.x+h[y],n.y,n.z)):v===1?(l.up.set(0,0,c[y]),l.position.set(n.x,n.y,n.z),l.lookAt(n.x,n.y+h[y],n.z)):(l.up.set(0,c[y],0),l.position.set(n.x,n.y,n.z),l.lookAt(n.x,n.y,n.z+h[y]));let M=this._cubeSize;_o(r,v*M,y>2?M:0,M,M),u.setRenderTarget(r),g&&u.render(m,l),u.render(e,l)}u.toneMapping=f,u.autoClear=d,e.background=x}_textureToCubeUV(e,t){let i=this._renderer,r=e.mapping===At||e.mapping===Ui;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=b_()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=w_());let n=r?this._cubemapMaterial:this._equirectMaterial,s=this._lodMeshes[0];s.material=n;let a=n.uniforms;a.envMap.value=e;let l=this._cubeSize;_o(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(s,wa)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let r=this._lodMeshes.length;for(let n=1;n<r;n++)this._applyGGXFilter(e,n-1,n);t.autoClear=i}_applyGGXFilter(e,t,i){let r=this._renderer,n=this._pingPongRenderTarget,s=this._ggxMaterial,a=this._lodMeshes[i];a.material=s;let l=s.uniforms,c=i/(this._lodMeshes.length-1),h=t/(this._lodMeshes.length-1),u=Math.sqrt(c*c-h*h),d=c*1.25,f=u*d,{_lodMax:p}=this,m=this._sizeLods[i],_=3*m*(i>p-xo?i-p+xo:0),g=4*(this._cubeSize-m);l.envMap.value=e.texture,l.roughness.value=f,l.mipInt.value=p-t,_o(n,_,g,3*m,2*m),r.setRenderTarget(n),r.render(a,wa),l.envMap.value=n.texture,l.roughness.value=0,l.mipInt.value=p-i,_o(e,_,g,3*m,2*m),r.setRenderTarget(e),r.render(a,wa)}_blur(e,t,i,r){let n=this._pingPongRenderTarget,s=Math.min(r,Math.PI)/Math.SQRT2;this._blurPass(e,n,t,i,s),this._blurPass(n,e,i,i,s)}_blurPass(e,t,i,r,n){let s=this._renderer,a=this._blurMaterial,l=this._lodMeshes[r];l.material=a;let c=a.uniforms;c.envMap.value=e.texture,c.sigma.value=n,c.mipInt.value=this._lodMax-i;let h=this._sizeLods[r],u=3*h*(r>this._lodMax-xo?r-this._lodMax+xo:0),d=4*(this._cubeSize-h);_o(t,u,d,3*h,2*h),s.setRenderTarget(t),s.render(l,wa)}};function aw(o){let e=[],t=[],i=o,r=o-xo+1+rw;for(let n=0;n<r;n++){let s=Math.pow(2,i);e.push(s);let a=1/(s-2),l=-a,c=1+a,h=[l,l,c,l,c,c,l,l,c,c,l,c],u=6,d=6,f=3,p=new Float32Array(f*d*u),m=new Float32Array(f*d*u);for(let g=0;g<u;g++){let x=g%3*2/3-1,y=g>2?0:-1,v=[x,y,0,x+2/3,y,0,x+2/3,y+1,0,x,y,0,x+2/3,y+1,0,x,y+1,0];p.set(v,f*d*g);for(let M=0;M<d;M++){let A=h[M*2]*2-1,T=h[M*2+1]*2-1;g===0?mn.set(1,T,A):g===1?mn.set(-A,1,-T):g===2?mn.set(-A,T,1):g===3?mn.set(-1,T,-A):g===4?mn.set(-A,-1,T):mn.set(A,T,-1),mn.toArray(m,(g*d+M)*f)}}let _=new D;_.setAttribute("position",new $(p,f)),_.setAttribute("outputDirection",new $(m,f)),t.push(new ae(_,null)),i>xo&&i--}return{lodMeshes:t,sizeLods:e}}function v_(o,e,t){let i=new Kt(o,e,t);return i.texture.mapping=Io,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function _o(o,e,t,i,r){o.viewport.set(e,t,i,r),o.scissor.set(e,t,i,r)}function lw(o,e,t){return new St({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:sw,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${o}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:oh(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:Qi,depthTest:!1,depthWrite:!1})}function cw(o,e,t){return new St({name:"SphericalGaussianBlur",defines:{SAMPLES:nw,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${o}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:oh(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:Qi,depthTest:!1,depthWrite:!1})}function w_(){return new St({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:oh(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Qi,depthTest:!1,depthWrite:!1})}function b_(){return new St({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:oh(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Qi,depthTest:!1,depthWrite:!1})}function oh(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var ah=class extends Kt{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new Ti(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new Ci(5,5,5),n=new St({name:"CubemapFromEquirect",uniforms:Us(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:yi,blending:Qi});n.uniforms.tEquirect.value=t;let s=new ae(r,n),a=t.minFilter;return t.minFilter===Yt&&(t.minFilter=xe),new co(1,10,this).update(e,s),t.minFilter=a,s.geometry.dispose(),s.material.dispose(),this}clear(e,t=!0,i=!0,r=!0){let n=e.getRenderTarget();for(let s=0;s<6;s++)e.setRenderTarget(this,s),e.clear(t,i,r);e.setRenderTarget(n)}};function M_(o,e){function t(i,r=kr){let n,s=ze.getTransfer(r);if(i===Zt)return o.UNSIGNED_BYTE;if(i===Bo)return o.UNSIGNED_SHORT_4_4_4_4;if(i===Fo)return o.UNSIGNED_SHORT_5_5_5_1;if(i===Oo)return o.UNSIGNED_INT_5_9_9_9_REV;if(i===Uo)return o.UNSIGNED_INT_10F_11F_11F_REV;if(i===Po)return o.BYTE;if(i===Lo)return o.SHORT;if(i===No)return o.UNSIGNED_SHORT;if(i===Do)return o.INT;if(i===oi)return o.UNSIGNED_INT;if(i===Tt)return o.FLOAT;if(i===zi)return o.HALF_FLOAT;if(i===zo)return o.ALPHA;if(i===ko)return o.RGB;if(i===je)return o.RGBA;if(i===er)return o.DEPTH_COMPONENT;if(i===Vo)return o.DEPTH_STENCIL;if(i===wi)return o.RED;if(i===Nr)return o.RED_INTEGER;if(i===Go)return o.RG;if(i===Ho)return o.RG_INTEGER;if(i===Wo)return o.RGBA_INTEGER;if(i===Dr||i===Br||i===Fr||i===Or)if(s===Ae)if(n=e.get("WEBGL_compressed_texture_s3tc_srgb"),n!==null){if(i===Dr)return n.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===Br)return n.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Fr)return n.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Or)return n.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(n=e.get("WEBGL_compressed_texture_s3tc"),n!==null){if(i===Dr)return n.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===Br)return n.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Fr)return n.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Or)return n.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===Mn||i===Sn||i===An||i===Tn)if(n=e.get("WEBGL_compressed_texture_pvrtc"),n!==null){if(i===Mn)return n.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Sn)return n.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===An)return n.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Tn)return n.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Cn||i===En||i===In||i===Rn||i===Pn||i===Ln||i===Nn)if(n=e.get("WEBGL_compressed_texture_etc"),n!==null){if(i===Cn||i===En)return s===Ae?n.COMPRESSED_SRGB8_ETC2:n.COMPRESSED_RGB8_ETC2;if(i===In)return s===Ae?n.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:n.COMPRESSED_RGBA8_ETC2_EAC;if(i===Rn)return n.COMPRESSED_R11_EAC;if(i===Pn)return n.COMPRESSED_SIGNED_R11_EAC;if(i===Ln)return n.COMPRESSED_RG11_EAC;if(i===Nn)return n.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===Dn||i===Bn||i===Fn||i===On||i===Un||i===zn||i===kn||i===Vn||i===Gn||i===Hn||i===Wn||i===qn||i===Xn||i===Yn)if(n=e.get("WEBGL_compressed_texture_astc"),n!==null){if(i===Dn)return s===Ae?n.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:n.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===Bn)return s===Ae?n.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:n.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===Fn)return s===Ae?n.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:n.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===On)return s===Ae?n.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:n.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===Un)return s===Ae?n.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:n.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===zn)return s===Ae?n.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:n.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===kn)return s===Ae?n.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:n.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Vn)return s===Ae?n.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:n.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Gn)return s===Ae?n.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:n.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Hn)return s===Ae?n.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:n.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Wn)return s===Ae?n.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:n.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===qn)return s===Ae?n.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:n.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Xn)return s===Ae?n.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:n.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Yn)return s===Ae?n.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:n.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Zn||i===Jn||i===Kn)if(n=e.get("EXT_texture_compression_bptc"),n!==null){if(i===Zn)return s===Ae?n.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:n.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Jn)return n.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Kn)return n.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===jn||i===$n||i===Qn||i===es)if(n=e.get("EXT_texture_compression_rgtc"),n!==null){if(i===jn)return n.COMPRESSED_RED_RGTC1_EXT;if(i===$n)return n.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Qn)return n.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===es)return n.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===Vh?o.UNSIGNED_INT_24_8:o[i]!==void 0?o[i]:null}return{convert:t}}var Ma=class extends Error{constructor(e,t,i="1B"){super(`three.unsupported: ${e}${t?` (${t})`:""}${i==="1B"?"; native R1 does not provide this capability; use the 1B backend where available":""}`),this.name="ThreeCapabilityError",this.code="three.unsupported",this.feature=e,this.backend=i}};function P(o,e,t){throw new Ma(o,e,t)}var lh=class{constructor(){P("WebGPU","WebGPU/TSL compute is outside both the R1 and WebGL2 bundles","none")}};function ot(o,e){let t=new Error(`three.assetFailure: ${o}${e?`: ${e}`:""}`);return t.name="ThreeAssetError",t.code="three.assetFailure",t.url=o,t}function De(o,e){if(typeof o!="number"||!Number.isFinite(o))throw new Error(`three.invalid: ${e} must be finite`);return o}function qe(o,e){if(!Number.isInteger(o)||o<0||o>4294967295)throw new Error(`three.invalid: ${e} is outside u32`);return o>>>0}var Xt=typeof globalThis<"u"?globalThis:{},hw="three.audio",uw=64*1024*1024,dw=0;function S_(){return Xt.performance&&typeof Xt.performance.now=="function"?Xt.performance.now():Date.now()}function gi(o,e=0){return Number.isFinite(o)?o:e}function Ki(o,e,t){return Math.max(e,Math.min(t,o))}function fw(o){if(o instanceof Uint8Array)return new Uint8Array(o);if(o instanceof ArrayBuffer)return new Uint8Array(o.slice(0));if(ArrayBuffer.isView(o))return new Uint8Array(o.buffer.slice(o.byteOffset,o.byteOffset+o.byteLength));throw new Error("three.invalid: audio data must be an ArrayBuffer or typed array")}function gd(o,e,t=""){let i=fw(e);if(i.length===0||i.length>uw)throw new Error("three.invalid: encoded audio must contain 1..67108864 bytes");let r=mw(i,t);return{isJsrAudioBuffer:!0,data:i,mime:t||pw(i),duration:r.duration,sampleRate:r.sampleRate,length:Math.floor(r.duration*r.sampleRate),numberOfChannels:0,getChannelData(){P("audioDecode","native THREE audio hands encoded bytes to the media host")},copyFromChannel(){P("audioDecode","native THREE audio does not expose decoded PCM channels")},copyToChannel(){P("audioDecode","native THREE audio does not expose decoded PCM channels")}}}function pw(o){return o.length>=12&&String.fromCharCode(...o.subarray(0,4))==="RIFF"&&String.fromCharCode(...o.subarray(8,12))==="WAVE"?"audio/wav":o.length>=4&&String.fromCharCode(...o.subarray(0,4))==="OggS"?"audio/ogg":o.length>=4&&String.fromCharCode(...o.subarray(0,4))==="fLaC"?"audio/flac":o.length>=12&&String.fromCharCode(...o.subarray(4,8))==="ftyp"?"audio/mp4":o.length>=3&&o[0]===73&&o[1]===68&&o[2]===51||o.length>=2&&o[0]===255&&(o[1]&224)===224?"audio/mpeg":"application/octet-stream"}function mw(o,e){return o.length>=12&&String.fromCharCode(...o.subarray(0,4))==="RIFF"&&String.fromCharCode(...o.subarray(8,12))==="WAVE"?gw(o):/mpeg|mp3/i.test(e)||o.length>=2&&o[0]===255&&(o[1]&224)===224||o.length>=3&&o[0]===73&&o[1]===68&&o[2]===51?_w(o):{duration:0,sampleRate:0}}function gw(o){let e=12,t=0,i=0,r=0;for(;e+8<=o.length;){let n=od(o,e+4,!0),s=String.fromCharCode(...o.subarray(e,e+4));s==="fmt "&&n>=16&&e+8+n<=o.length?(i=od(o,e+12,!0),t=od(o,e+16,!0)):s==="data"&&(r=Math.min(n,Math.max(0,o.length-e-8))),e+=8+n+(n&1)}return{duration:t>0?r/t:0,sampleRate:i||0}}function od(o,e,t){return e<0||e+4>o.length?0:t?(o[e]|o[e+1]<<8|o[e+2]<<16|o[e+3]<<24)>>>0:(o[e]<<24|o[e+1]<<16|o[e+2]<<8|o[e+3])>>>0}function _w(o){let e=0;o.length>=10&&o[0]===73&&o[1]===68&&o[2]===51&&(e=10+((o[6]&127)<<21|(o[7]&127)<<14|(o[8]&127)<<7|o[9]&127)+(o[5]&16?10:0));let t=0,i=0;for(;e+4<=o.length;){let r=xw(o,e);if(!r){e++;continue}t+=r.samples/r.sampleRate,i=r.sampleRate,e+=r.length}return{duration:t,sampleRate:i}}function xw(o,e){if(o[e]!==255||(o[e+1]&224)!==224)return null;let t=o[e+1]>>3&3,i=o[e+1]>>1&3,r=o[e+2]>>4&15,n=o[e+2]>>2&3;if(t===1||i===0||r===0||r===15||n===3)return null;let a=Math.floor([44100,48e3,32e3][n]/(t===2?2:t===0?4:1)),l=yw(t,i,r);if(!l||!a)return null;let c=i===3?384:i===2||t===3?1152:576,h=o[e+2]>>1&1,u=i===3?(Math.floor(12e3*l/a)+h)*4:Math.floor((i===1&&t!==3?72e3:144e3)*l/a)+h;return u>=4&&e+u<=o.length?{length:u,samples:c,sampleRate:a}:null}function yw(o,e,t){return(o===3?e===3?[0,32,40,48,56,64,80,96,112,128,160,192,224,256,320]:e===2?[0,32,48,56,64,80,96,112,128,160,192,224,256,320,384]:[0,32,64,96,128,160,192,224,256,288,320,352,384,416,448]:e===3?[0,32,48,56,64,80,96,112,128,144,160,176,192,224,256]:[0,8,16,24,32,40,48,56,64,80,96,112,128,144,160])[t]||0}var Ve=class{constructor(e,t,i){this.context=e,this._value=t,this._onChange=i,this.defaultValue=t,this.minValue=-34028234663852886e22,this.maxValue=34028234663852886e22,this.automationRate="a-rate"}get value(){return this._value}set value(e){this.setValueAtTime(e,this.context.currentTime)}setValueAtTime(e){if(!Number.isFinite(e))throw new TypeError("three.invalid: non-finite AudioParam value");return this._value=e,this._onChange&&this._onChange(),this}linearRampToValueAtTime(e){return this.setValueAtTime(e)}exponentialRampToValueAtTime(e){return this.setValueAtTime(e)}setTargetAtTime(e){return this.setValueAtTime(e)}cancelScheduledValues(){return this}cancelAndHoldAtTime(){return this}},gn=class{constructor(e,t){this.context=e,this.kind=t,this.outputs=new Set,this.channelCount=2,this.channelCountMode="max",this.channelInterpretation="speakers"}connect(e){if(!e||e.context!==this.context||typeof e.kind!="string")throw new TypeError("three.invalid: audio nodes must belong to one native AudioContext");return this.outputs.add(e),this.context._refresh(),e}disconnect(e){e===void 0?this.outputs.clear():this.outputs.delete(e),this.context._refresh()}},cd=class extends gn{constructor(e){super(e,"gain"),this.gain=new Ve(e,1,()=>e._refresh())}},hd=class{constructor(e){this.context=e;let t=()=>e._refresh();this.positionX=new Ve(e,0,t),this.positionY=new Ve(e,0,t),this.positionZ=new Ve(e,0,t),this.forwardX=new Ve(e,0,t),this.forwardY=new Ve(e,0,t),this.forwardZ=new Ve(e,-1,t),this.upX=new Ve(e,0,t),this.upY=new Ve(e,1,t),this.upZ=new Ve(e,0,t)}setPosition(e,t,i){this.positionX.value=e,this.positionY.value=t,this.positionZ.value=i}setOrientation(e,t,i,r,n,s){this.forwardX.value=e,this.forwardY.value=t,this.forwardZ.value=i,this.upX.value=r,this.upY.value=n,this.upZ.value=s}},ud=class extends gn{constructor(e){super(e,"panner");let t=()=>e._refresh();this.positionX=new Ve(e,0,t),this.positionY=new Ve(e,0,t),this.positionZ=new Ve(e,0,t),this.orientationX=new Ve(e,1,t),this.orientationY=new Ve(e,0,t),this.orientationZ=new Ve(e,0,t),this._refDistance=1,this._maxDistance=1e4,this._rolloffFactor=1,this._distanceModel="inverse",this._coneInnerAngle=360,this._coneOuterAngle=360,this._coneOuterGain=0,this.panningModel="equalpower"}get refDistance(){return this._refDistance}set refDistance(e){this._refDistance=ad(e,"refDistance"),this.context._refresh()}get maxDistance(){return this._maxDistance}set maxDistance(e){this._maxDistance=ad(e,"maxDistance"),this.context._refresh()}get rolloffFactor(){return this._rolloffFactor}set rolloffFactor(e){this._rolloffFactor=ad(e,"rolloffFactor"),this.context._refresh()}get distanceModel(){return this._distanceModel}set distanceModel(e){if(!["linear","inverse","exponential"].includes(e))throw new TypeError("three.invalid: PannerNode distanceModel");this._distanceModel=e,this.context._refresh()}get coneInnerAngle(){return this._coneInnerAngle}set coneInnerAngle(e){this._coneInnerAngle=Ki(gi(e),0,360),this.context._refresh()}get coneOuterAngle(){return this._coneOuterAngle}set coneOuterAngle(e){this._coneOuterAngle=Ki(gi(e),0,360),this.context._refresh()}get coneOuterGain(){return this._coneOuterGain}set coneOuterGain(e){this._coneOuterGain=Ki(gi(e),0,1),this.context._refresh()}setPosition(e,t,i){this.positionX.value=e,this.positionY.value=t,this.positionZ.value=i}setOrientation(e,t,i){this.orientationX.value=e,this.orientationY.value=t,this.orientationZ.value=i}};function ad(o,e){if(!Number.isFinite(o)||o<0)throw new RangeError(`three.invalid: PannerNode ${e} must be non-negative and finite`);return o}var dd=class extends gn{constructor(e){super(e,"analyser"),this.fftSize=2048,this.minDecibels=-100,this.maxDecibels=-30,this.smoothingTimeConstant=.8}get frequencyBinCount(){return this.fftSize>>1}getByteFrequencyData(e){this.context._warnAnalyser(),e.fill(0)}getByteTimeDomainData(e){this.context._warnAnalyser(),e.fill(0)}getFloatFrequencyData(e){this.context._warnAnalyser(),e.fill(0)}getFloatTimeDomainData(e){this.context._warnAnalyser(),e.fill(0)}},Sa=class extends gn{constructor(e){super(e,"bufferSource"),this.buffer=null,this._loop=!1,this.loopStart=0,this.loopEnd=0,this.onended=null,this.playbackRate=new Ve(e,1,()=>this._transportChanged()),this.detune=new Ve(e,0,()=>this._transportChanged()),this._started=!1,this._stopped=!1,this._sent=!1,this._offset=0,this._duration=void 0,this._delay=0,this._endTimer=null,this._stopAction="stop",this._sourceId=`source-${++e._sourceSequence}`}get loop(){return this._loop}set loop(e){this._loop=!!e,this._transportChanged()}start(e=0,t=0,i){if(this._started)throw new Error("three.invalid: AudioBufferSourceNode can only be started once");if(!this.buffer||!this.buffer.isJsrAudioBuffer)throw new Error("three.invalid: AudioBufferSourceNode requires an AudioLoader buffer");this._started=!0,this._stopped=!1,this._offset=Math.max(0,gi(t)),this._duration=i,this._delay=Math.max(0,gi(e)-this.context.currentTime),this.context._sources.add(this),this.context._queue(this)}stop(e=0){!this._started||this._stopped||(this._stopped=!0,this._cancelEnd(),this.context._sources.delete(this),this._sent&&(this._sent=!1,this.context._send(this._stopAction||"stop",{sourceId:this._sourceId,delay:Math.max(0,gi(e)-this.context.currentTime),release:!0})))}_flush(){!this._started||this._stopped||this._sent||this.context.state!=="running"||(this._sent=!0,this.context._send("play",this._playPayload()),this._scheduleEnd())}_playPayload(){return Object.assign(this.context._spatialPayload(this),{sourceId:this._sourceId,data:_d(this.buffer.data),mime:this.buffer.mime,offset:this._offset,duration:this._duration,delay:this._delay,loop:this._loop,playbackRate:this._effectiveRate()})}_effectiveRate(){return Math.max(1e-4,this.playbackRate.value*Math.pow(2,this.detune.value/1200))}_transportChanged(){!this._sent||this._stopped||(this.context._send("update",Object.assign(this.context._spatialPayload(this),{sourceId:this._sourceId,loop:this._loop,playbackRate:this._effectiveRate()})),this._scheduleEnd())}_spatialChanged(){!this._sent||this._stopped||this.context._send("update",Object.assign(this.context._spatialPayload(this),{sourceId:this._sourceId,loop:this._loop,playbackRate:this._effectiveRate()}))}_scheduleEnd(){if(this._cancelEnd(),!this._sent||this._loop||typeof Xt.setTimeout!="function")return;let e=this._duration===void 0?this.buffer.duration:this._duration;if(!(e>0))return;let t=Math.max(0,e-this._offset)/this._effectiveRate()+this._delay;this._delay=0,this._endTimer=Xt.setTimeout(()=>this._finish(),Math.min(2147483647,t*1e3))}_finish(){this._endTimer=null,!(!this._sent||this._stopped)&&(this._sent=!1,this._stopped=!0,this.context._sources.delete(this),this.context._send("dispose",{sourceId:this._sourceId}),typeof this.onended=="function"&&this.onended())}_cancelEnd(){this._endTimer!==null&&typeof Xt.clearTimeout=="function"&&Xt.clearTimeout(this._endTimer),this._endTimer=null}},fd=class extends Sa{constructor(e,t){super(e),this.kind="mediaElementSource",this.element=t,this._loadPromise=null,this._sourceId=`media-${++e._sourceSequence}`,t._jsrNativePlay=()=>this.start(0,gi(t.currentTime)),t._jsrNativePause=()=>this.stop(0),t._jsrMediaPlaying&&this.start(0,gi(t.currentTime))}start(e=0,t=0){return this._started&&!this._stopped||(this._started=!0,this._stopped=!1,this._offset=Math.max(0,gi(t)),this._delay=Math.max(0,gi(e)-this.context.currentTime),this.context._sources.add(this),this.context._queue(this)),Promise.resolve()}stop(){this._stopAction="pause",this._sent&&(this._sent=!1,this.context._send("pause",{sourceId:this._sourceId,delay:0,release:!1})),this._stopped=!0,this._cancelEnd(),this.context._sources.delete(this)}_flush(){if(this.buffer){super._flush();return}if(this._loadPromise||typeof this.element._jsrAudioLoad!="function"){typeof this.element._jsrAudioLoad!="function"&&this.context._report(new Error("three.assetFailure: native audio element has no registered source"));return}this._loadPromise=Promise.resolve(this.element._jsrAudioLoad()).then(e=>{this.buffer=gd(this.context,e.bytes||e.data,e.mime),this._loadPromise=null,this.context._queue(this)}).catch(e=>{this._loadPromise=null,this.context._report(e)})}_playPayload(){return Object.assign(super._playPayload(),{loop:!!this.element.loop})}_transportChanged(){this.buffer&&super._transportChanged()}},pd=class extends Sa{constructor(e){super(e),this.kind="oscillator",this._type="sine",this.frequency=new Ve(e,440,()=>this._frequencyChanged()),this.loop=!0}get type(){return this._type}set type(e){if(!["sine","square","sawtooth","triangle"].includes(e))throw new TypeError("three.invalid: OscillatorNode type");this._type=e,this._frequencyChanged()}start(e=0){this._replaceWave(),super.start(e,0)}_frequencyChanged(){!this._started||this._stopped||(this._replaceWave(),this._sent=!1,this.context._queue(this))}_replaceWave(){this.buffer=gd(this.context,vw(this.frequency.value,this._type),"audio/wav")}};function vw(o,e){let r=new Uint8Array(44144),n=new DataView(r.buffer);ld(r,0,"RIFF"),n.setUint32(4,r.length-8,!0),ld(r,8,"WAVEfmt "),n.setUint32(16,16,!0),n.setUint16(20,1,!0),n.setUint16(22,1,!0),n.setUint32(24,22050,!0),n.setUint32(28,22050*2,!0),n.setUint16(32,2,!0),n.setUint16(34,16,!0),ld(r,36,"data"),n.setUint32(40,44100,!0);let s=Ki(Math.abs(gi(o,440)),1,22050/2);for(let a=0;a<22050;a++){let l=a*s/22050%1,c=Math.sin(l*Math.PI*2);e==="square"?c=l<.5?1:-1:e==="sawtooth"?c=l*2-1:e==="triangle"&&(c=1-4*Math.abs(l-.5)),n.setInt16(44+a*2,Math.round(Ki(c,-1,1)*32767),!0)}return r}function ld(o,e,t){for(let i=0;i<t.length;i++)o[e+i]=t.charCodeAt(i)}var md=class{constructor(e){this.runtime=e,this.contextId=++dw,this.state="suspended",this.sampleRate=48e3,this.baseLatency=0,this.outputLatency=0,this._time=0,this._runningSince=0,this._resumePromise=null,this._sourceSequence=0,this._sources=new Set,this._queueScheduled=!1,this._refreshScheduled=!1,this._analyserWarned=!1,this.hasAudioGraph=!1,this.destination=new gn(this,"destination"),this.destination.maxChannelCount=2,this.listener=new hd(this)}get currentTime(){return this.state==="running"?this._time+Math.max(0,S_()-this._runningSince)/1e3:this._time}createGain(){return this.hasAudioGraph=!0,new cd(this)}createPanner(){return new ud(this)}createAnalyser(){return new dd(this)}createBufferSource(){return new Sa(this)}createOscillator(){return new pd(this)}createMediaElementSource(e){if(!e)throw new TypeError("three.invalid: media element is required");return new fd(this,e)}createMediaStreamSource(){return P("mediaStreamAudio","native THREE supports encoded buffers and registered media elements")}decodeAudioData(e,t,i){return Promise.resolve().then(()=>gd(this,e)).then(r=>(typeof t=="function"&&t(r),r)).catch(r=>{throw typeof i=="function"&&i(r),r})}resume(){return this.state==="running"?Promise.resolve():this._resumePromise?this._resumePromise:(this._resumePromise=this._call("resume",{}).then(()=>{this._runningSince=S_(),this.state="running",this._refresh();for(let e of this._sources)this._queue(e)}).finally(()=>{this._resumePromise=null}),this._resumePromise)}close(){for(let e of Array.from(this._sources))e.stop();return this.state="closed",this._call("disposeEngine",{})}_queue(){this._queueScheduled||(this._queueScheduled=!0,Promise.resolve().then(()=>{this._queueScheduled=!1;for(let e of Array.from(this._sources))e._flush()}))}_refresh(){this._refreshScheduled||(this._refreshScheduled=!0,Promise.resolve().then(()=>{this._refreshScheduled=!1;for(let e of this._sources)e._spatialChanged()}))}_send(e,t){let i=this._call(e,t);return i.catch(r=>this._report(r)),i}_call(e,t){let i=this.runtime&&this.runtime.jsr;return!i||typeof i.hostCall!="function"?Promise.reject(new Error("three.unsupported: audio requires jsr.hostCall and a three.audio media host")):Promise.resolve(i.hostCall(hw,Object.assign({engineId:this.runtime.engineId,action:e},t)))}_report(e){Xt.console&&typeof Xt.console.error=="function"&&Xt.console.error(e)}_warnAnalyser(){this._analyserWarned||(this._analyserWarned=!0,Xt.console&&typeof Xt.console.warn=="function"&&Xt.console.warn("three: native AnalyserNode FFT is unavailable; frequency/time-domain data is explicitly zero-filled."))}_spatialPayload(e){let t=0,i=0,r=new Set,n=(s,a,l)=>{if(!r.has(s)){if(r.add(s),s===this.destination){t+=a,i=l;return}for(let c of s.outputs)if(c.kind==="gain")n(c,a*c.gain.value,l);else if(c.kind==="panner"){let h=this._pannerSpatial(c);n(c,a*h.volume,h.balance)}else n(c,a,l);r.delete(s)}};return n(e,1,0),{volume:Ki(t,0,1),balance:Ki(i,-1,1)}}_pannerSpatial(e){let t=this.listener,i=e.positionX.value-t.positionX.value,r=e.positionY.value-t.positionY.value,n=e.positionZ.value-t.positionZ.value,s=Math.sqrt(i*i+r*r+n*n),a=ww(e,s);a*=bw(e,t,i,r,n);let l=Mw(t),c=s>0?(i*l[0]+r*l[1]+n*l[2])/s:0;return{volume:a,balance:c}}};function ww(o,e){let t=Math.max(1e-6,o.refDistance),i=Math.max(0,o.rolloffFactor);if(o.distanceModel==="linear"){let r=Math.max(t,o.maxDistance);return r===t?e<=t?1:0:Ki(1-i*(e-t)/(r-t),0,1)}return o.distanceModel==="exponential"?Math.pow(Math.max(e,t)/t,-i):t/(t+i*(Math.max(e,t)-t))}function bw(o,e,t,i,r){if(o.coneInnerAngle>=360||o.coneOuterAngle>=360)return 1;let n=Math.sqrt(t*t+i*i+r*r),s=o.orientationX.value,a=o.orientationY.value,l=o.orientationZ.value,c=Math.sqrt(s*s+a*a+l*l);if(n===0||c===0)return 1;let h=Ki((-t*s-i*a-r*l)/(n*c),-1,1),u=Math.acos(h)*180/Math.PI,d=o.coneInnerAngle/2,f=o.coneOuterAngle/2;return u<=d?1:u>=f?o.coneOuterGain:1+(u-d)/Math.max(1e-6,f-d)*(o.coneOuterGain-1)}function Mw(o){let e=o.forwardX.value,t=o.forwardY.value,i=o.forwardZ.value,r=o.upX.value,n=o.upY.value,s=o.upZ.value,a=t*s-i*n,l=i*r-e*s,c=e*n-t*r,h=Math.sqrt(a*a+l*l+c*c)||1;return[a/h,l/h,c/h]}function Sw(){let o=Sr.prototype;if(o.pause.__jsrNativeAudio)return;let e=o.pause,t=function(...i){let r=this.source;r&&r.kind==="bufferSource"&&(r._stopAction="pause");try{return e.apply(this,i)}finally{r&&r.kind==="bufferSource"&&(r._stopAction="stop")}};Object.defineProperty(t,"__jsrNativeAudio",{value:!0}),o.pause=t}function A_(o){if(o._nativeAudioContext)return o._nativeAudioContext;let e=new md(o);return Object.defineProperty(o,"_nativeAudioContext",{value:e}),Li.setContext(e),Sw(),e}var re=typeof globalThis<"u"?globalThis:{};function Aw(){if(typeof re.AbortController=="function")return;class o{constructor(){this.aborted=!1,this.reason=void 0,this.onabort=null,this._listeners=[]}addEventListener(i,r){i==="abort"&&r&&this._listeners.push(r)}removeEventListener(i,r){if(i!=="abort")return;let n=this._listeners.indexOf(r);n>=0&&this._listeners.splice(n,1)}throwIfAborted(){if(this.aborted)throw this.reason}_fire(i){this.aborted=!0,this.reason=i;let r={type:"abort",target:this};typeof this.onabort=="function"&&this.onabort(r);for(let n of this._listeners.splice(0))typeof n=="function"?n(r):n&&n.handleEvent&&n.handleEvent(r)}}class e{constructor(){this.signal=new o}abort(i){this.signal.aborted||this.signal._fire(i)}}re.AbortController=e,re.AbortSignal=o}function Tw(){typeof re.Headers>"u"&&(re.Headers=class{constructor(t={}){if(this._values=new Map,t&&typeof t.forEach=="function"&&!Array.isArray(t))t.forEach((i,r)=>this.set(r,i));else if(Array.isArray(t))for(let i of t)i&&i.length>=2&&this.set(i[0],i[1]);else if(t&&typeof t=="object")for(let i of Object.keys(t))this.set(i,t[i])}append(t,i){this.set(t,this.has(t)?`${this.get(t)}, ${i}`:i)}delete(t){this._values.delete(String(t).toLowerCase())}get(t){let i=this._values.get(String(t).toLowerCase());return i===void 0?null:i}has(t){return this._values.has(String(t).toLowerCase())}set(t,i){this._values.set(String(t).toLowerCase(),String(i))}forEach(t,i){this._values.forEach((r,n)=>t.call(i,r,n,this))}entries(){return this._values.entries()}}),typeof re.Request>"u"&&(re.Request=class{constructor(t,i={}){this.url=String(t&&t.url!==void 0?t.url:t),this.headers=new re.Headers(t&&t.headers?t.headers:i.headers||{}),this.credentials=i.credentials||"same-origin",this.signal=i.signal||t&&t.signal}});let o=e=>e==null?new Uint8Array:e instanceof Uint8Array?new Uint8Array(e):e instanceof ArrayBuffer?new Uint8Array(e.slice(0)):ArrayBuffer.isView(e)?new Uint8Array(e.buffer.slice(e.byteOffset,e.byteOffset+e.byteLength)):yo(String(e));typeof re.Response>"u"&&(re.Response=class{constructor(t=null,i={}){this._bytes=o(t),this.status=i.status===void 0?200:i.status,this.statusText=i.statusText||"",this.headers=new re.Headers(i.headers||{}),this.url=i.url||"",this.body=void 0}async arrayBuffer(){return this._bytes.buffer.slice(this._bytes.byteOffset,this._bytes.byteOffset+this._bytes.byteLength)}async text(){return ch(this._bytes)}async json(){return JSON.parse(await this.text())}async blob(){return typeof Blob>"u"?this._bytes:new Blob([this._bytes],{type:this.headers.get("Content-Type")||""})}}),typeof re.fetch>"u"&&(re.fetch=e=>{let t=e&&e.url!==void 0?e:new re.Request(e),i=Ni;return i?t.signal&&t.signal.aborted?Promise.reject(t.signal.reason||new Error("request aborted")):i.loadAsset(t.url).then(r=>{if(t.signal&&t.signal.aborted)throw t.signal.reason||new Error("request aborted");return new re.Response(r.bytes,{status:200,url:t.url,headers:{"Content-Type":r.mime||"application/octet-stream","Content-Length":String(r.bytes.length)}})}):Promise.reject(new Error("three.assetFailure: THREE runtime is not initialized"))})}var Aa="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",Ni=null;function yo(o,e=!0){let t=String(o);if(e&&typeof TextEncoder<"u")return new TextEncoder().encode(t);let i=[];for(let r=0;r<t.length;r++){let n=t.charCodeAt(r);if(n>=55296&&n<=56319&&r+1<t.length){let s=t.charCodeAt(r+1);s>=56320&&s<=57343?(n=65536+(n-55296<<10)+s-56320,r++):n=65533}else n>=55296&&n<=57343&&(n=65533);n<128?i.push(n):n<2048?i.push(192|n>>6,128|n&63):n<65536?i.push(224|n>>12,128|n>>6&63,128|n&63):i.push(240|n>>18,128|n>>12&63,128|n>>6&63,128|n&63)}return new Uint8Array(i)}function ch(o){let e="";for(let t=0;t<o.length;){let i=o[t++],r=i,n=0,s=0;if(i>=194&&i<=223)r=i&31,n=1,s=128;else if(i>=224&&i<=239)r=i&15,n=2,s=2048;else if(i>=240&&i<=244)r=i&7,n=3,s=65536;else if(i>=128){e+="\uFFFD";continue}if(t+n>o.length){e+="\uFFFD";break}let a=!0;for(let l=0;l<n;l++){let c=o[t++];if((c&192)!==128){a=!1,t--;break}r=r<<6|c&63}!a||r<s||r>1114111||r>=55296&&r<=57343?e+="\uFFFD":e+=String.fromCodePoint(r)}return e}function Cw(){typeof re.TextDecoder>"u"&&(re.TextDecoder=class{constructor(o="utf-8"){let e=String(o).toLowerCase().replace("_","-");if(e!=="utf-8"&&e!=="utf8")throw new RangeError(`three.invalid: unsupported TextDecoder label ${o}`)}decode(o){if(o===void 0)return"";if(!(o instanceof ArrayBuffer)&&!ArrayBuffer.isView(o))throw new TypeError("three.invalid: TextDecoder.decode expects an ArrayBuffer or view");return ch(Tr(o))}}),typeof re.TextEncoder>"u"&&(re.TextEncoder=class{encode(o){return yo(o,!1)}})}function Tr(o){if(o instanceof Uint8Array)return new Uint8Array(o);if(o instanceof ArrayBuffer)return new Uint8Array(o.slice(0));if(ArrayBuffer.isView(o))return new Uint8Array(o.buffer.slice(o.byteOffset,o.byteOffset+o.byteLength));if(typeof o!="string")throw ot("<bytes>","expected base64 or a typed array");let e=o.replace(/\s/g,"");if(e.length%4===1||/[^A-Za-z0-9+/=_-]/.test(e))throw ot("<bytes>","invalid base64");let t=e.replace(/-/g,"+").replace(/_/g,"/"),i=[],r=0,n=0;for(let s=0;s<t.length;s++){let a=t[s];if(a==="=")break;let l=Aa.indexOf(a);if(l<0)throw ot("<bytes>","invalid base64");r=r<<6|l,n+=6,n>=8&&(n-=8,i.push(r>>n&255))}return new Uint8Array(i)}function _d(o){let e=Tr(o),t="";for(let i=0;i<e.length;i+=3){let r=e[i],n=i+1<e.length?e[i+1]:0,s=i+2<e.length?e[i+2]:0,a=r<<16|n<<8|s;t+=Aa[a>>18&63]+Aa[a>>12&63]+(i+1<e.length?Aa[a>>6&63]:"=")+(i+2<e.length?Aa[a&63]:"=")}return t}function xd(o,e,t){let i=yo(o);if(i.length<1||i.length>t)throw new Error(`three.invalid: ${e} UTF-8 length must be 1..${t}`);return String(o)}function T_(o){return o._listeners=new Map,o.addEventListener=function(e,t,i){if(!t)return;let r=this._listeners.get(e)||[],n=i===!0||!!(i&&i.capture);r.some(s=>s.callback===t&&s.capture===n)||(r.push({callback:t,capture:n,once:!!(i&&i.once)}),this._listeners.set(e,r),this._listenBacking&&this._listenBacking(e))},o.removeEventListener=function(e,t,i){let r=this._listeners.get(e);if(!r)return;let n=i===!0||!!(i&&i.capture);this._listeners.set(e,r.filter(s=>s.callback!==t||s.capture!==n))},o.dispatchEvent=function(e){if(typeof e=="string"&&(e={type:e}),!e||!e.type)throw new Error("three.invalid: event.type is required");e.preventDefault||(e.preventDefault=function(){this.defaultPrevented=!0}),e.stopPropagation||(e.stopPropagation=function(){this.cancelBubble=!0});try{e.target||(e.target=this)}catch{}try{e.currentTarget=this}catch{}let t=(this._listeners.get(e.type)||[]).slice();for(let i of t)i.once&&this.removeEventListener(e.type,i.callback,{capture:i.capture}),typeof i.callback=="function"?i.callback.call(this,e):i.callback&&typeof i.callback.handleEvent=="function"&&i.callback.handleEvent(e);return!e.defaultPrevented},o}var yd=class{constructor(e){this.runtime=e,this.visibilityState="visible",this.hidden=!1,this.activeElement=null,this.documentElement={style:{}},this.defaultView={Math:re.Math,get devicePixelRatio(){return e.pixelRatio},get innerWidth(){return e.width},get innerHeight(){return e.height},location:{search:"",hash:"",href:"jsr://three/",origin:"null",pathname:"/",assign(){},replace(){},reload(){}},addEventListener:(t,i,r)=>this.addEventListener(t,i,r),removeEventListener:(t,i,r)=>this.removeEventListener(t,i,r),requestAnimationFrame:t=>e.requestAnimationFrame(t),cancelAnimationFrame:t=>e.cancelAnimationFrame(t)},T_(this)}hasFocus(){return this.activeElement!==null}_setVisibility(e){this.hidden=!!e,this.visibilityState=e?"hidden":"visible",this.dispatchEvent({type:"visibilitychange"})}},Ta=class{constructor(e,t,i,r={}){this.runtime=e,this.canvasId=t,this.engineId=e.engineId,this.generation=i,this.surfaceId=r.surfaceId||`${t}#${i}`,xd(this.surfaceId,"surfaceId",128),this.isJsrThreeCanvas=!0,this.style={},this._pixelRatio=r.pixelRatio||e.pixelRatio,this._cssWidth=r.width||300,this._cssHeight=r.height||150,this._width=Math.max(0,Math.floor(this._cssWidth*this._pixelRatio)),this._height=Math.max(0,Math.floor(this._cssHeight*this._pixelRatio)),this._captured=new Set,this._disposed=!1,this._mounted=!1,this._assetEpoch=0,this._focused=!1,this.ownerDocument=e.document,this.tabIndex=0,this._backing=null,this._backingListeners=new Map,T_(this),e.web&&this._createBacking(r)}_createBacking(e){let t=e.canvas||e.offscreenCanvas;t?this._backing=t:typeof OffscreenCanvas<"u"?this._backing=new OffscreenCanvas(this._width,this._height):typeof document<"u"&&document.createElement?(this._backing=document.createElement("canvas"),this._backing.width=this._width,this._backing.height=this._height):P("webgl2","OffscreenCanvas or a canvas element is required"),this._backing.style&&(this.style=this._backing.style),this._backing.ownerDocument&&(this.ownerDocument=this._backing.ownerDocument),this._backing.width=this._width,this._backing.height=this._height}_listenBacking(e){if(!this._backing||this._backingListeners.has(e)||!this._backing.addEventListener)return;let t=i=>this.dispatchEvent(i);this._backingListeners.set(e,t),this._backing.addEventListener(e,t)}get width(){return this._width}set width(e){this._setPhysicalSize(e,this._height)}get height(){return this._height}set height(e){this._setPhysicalSize(this._width,e)}get clientWidth(){return this._cssWidth}get clientHeight(){return this._cssHeight}get pixelRatio(){return this._pixelRatio}get devicePixelRatio(){return this._pixelRatio}get disposed(){return this._disposed}get mounted(){return this._mounted}get context(){return this._context||null}_setPhysicalSize(e,t){if(!Number.isFinite(e)||!Number.isFinite(t)||e<0||t<0)throw new Error("three.invalid: canvas dimensions must be non-negative finite numbers");this._width=Math.floor(e),this._height=Math.floor(t),this._cssWidth=this._width/this._pixelRatio,this._cssHeight=this._height/this._pixelRatio,this._backing&&(this._backing.width=this._width,this._backing.height=this._height)}_setSize(e,t,i,r){if(!Number.isFinite(e)||!Number.isFinite(t)||e<0||t<0||e>16384||t>16384)throw new Error("three.invalid: canvas size must be within 0..16384");if(!Number.isFinite(i)||i<=0||i>16)throw new Error("three.invalid: pixel ratio must be within (0,16]");if(this._cssWidth=e,this._cssHeight=t,this._pixelRatio=i,this._width=Math.floor(e*i),this._height=Math.floor(t*i),this._width>16384||this._height>16384)throw new Error("three.invalid: drawing buffer exceeds 16384 pixels");this._backing&&(this._backing.width=this._width,this._backing.height=this._height),r!==!1&&(this.style.width=`${e}px`,this.style.height=`${t}px`)}setPixelRatio(e){this._setSize(this._cssWidth,this._cssHeight,e,!1)}setSize(e,t,i=!0){this._setSize(e,t,this._pixelRatio,i)}getContext(e,t){if(this._disposed)throw new Error("three.surface: canvas is disposed");this.runtime.web||P("rawWebGL",`canvas.getContext(${e}) requires the 1B backend`),e!=="webgl2"&&e!=="webgl"&&P("canvasContext",e),(!this._backing||!this._backing.getContext)&&P("webgl2","backing canvas has no getContext");let i=this._backing.getContext(e==="webgl"?"webgl2":e,t);return i||P("webgl2","WebGL2 context creation failed"),this._context=i,i}setAttribute(e,t){this._backing&&this._backing.setAttribute?this._backing.setAttribute(e,t):this[`_${e}`]=t}getAttribute(e){return this._backing&&this._backing.getAttribute?this._backing.getAttribute(e):this[`_${e}`]}removeAttribute(e){this._backing&&this._backing.removeAttribute&&this._backing.removeAttribute(e)}focus(){this._disposed||(this._backing&&this._backing.focus&&this._backing.focus(),this._focused=!0,this.ownerDocument.activeElement=this,this.dispatchEvent({type:"focus"}))}blur(){this._backing&&this._backing.blur&&this._backing.blur(),this._focused=!1,this.ownerDocument.activeElement===this&&(this.ownerDocument.activeElement=null),this.dispatchEvent({type:"blur"})}setPointerCapture(e){this._captured.add(e),this._backing&&this._backing.setPointerCapture&&this._backing.setPointerCapture(e),this.dispatchEvent({type:"gotpointercapture",pointerId:e})}releasePointerCapture(e){if(this._captured.delete(e),this._backing&&this._backing.releasePointerCapture)try{this._backing.releasePointerCapture(e)}catch{}this.dispatchEvent({type:"lostpointercapture",pointerId:e})}hasPointerCapture(e){return this._captured.has(e)}getBoundingClientRect(){return this._backing&&this._backing.getBoundingClientRect?this._backing.getBoundingClientRect():{x:0,y:0,left:0,top:0,width:this.clientWidth,height:this.clientHeight,right:this.clientWidth,bottom:this.clientHeight}}present(e){return this.runtime.present(this,e)}transferToImageBitmap(){if(this._backing&&this._backing.transferToImageBitmap)return this._backing.transferToImageBitmap();P("present","transferToImageBitmap is unavailable on the backing canvas")}transferControlToOffscreen(){P("offscreenTransfer","canvas is already owned by the JSR surface")}toDataURL(){P("canvas2d","capture belongs to the JSR host")}toBlob(){P("canvas2d","capture belongs to the JSR host")}_detach(){this._mounted=!1,this._assetEpoch++,this.runtime._clearInput(this,!0)}dispose(){if(!this._disposed){if(this._detach(),this._disposed=!0,this._listeners.clear(),this._backing&&this._backing.removeEventListener)for(let[e,t]of this._backingListeners)this._backing.removeEventListener(e,t);this._backingListeners.clear(),this.runtime._canvasDisposed(this)}}},Ca=class{constructor(e,t=!1,i={}){this.jsr=e,this.web=t,this.engineId=xd(e.instanceId===void 0?"default":e.instanceId,"engineId",128),this.pixelRatio=Number.isFinite(i.devicePixelRatio)?i.devicePixelRatio:Number.isFinite(re.devicePixelRatio)?re.devicePixelRatio:1,this.width=Number.isFinite(i.width)?i.width:Number.isFinite(re.innerWidth)?re.innerWidth:640,this.height=Number.isFinite(i.height)?i.height:Number.isFinite(re.innerHeight)?re.innerHeight:360,this.canvases=new Map,this.assets=new Map,this.generations=new Map,this.presentHook=null,this.heldKeys=new Map,this.activeCanvas=null,this.hostAssetLoader=typeof i.loadAssetBytes=="function"?i.loadAssetBytes:null,this.document=new yd(this),this.capabilities=Object.freeze({backend:t?"webgl2":"flutterGpu",rawWebGL:!!t,webgl2:!!t,r1:!t,shaderMaterial:!!t,webgpu:!1,dom:!1,getMaxAnisotropy:()=>1})}createCanvas(e="main",t={}){e=String(e||"main"),xd(e,"canvasId",112);let i=this.canvases.get(e);if(i&&!i.disposed)return i;let r=(this.generations.get(e)||0)+1;this.generations.set(e,r);let n=new Ta(this,e,r,t);return this.canvases.set(e,n),n}getCanvas(e="main"){return this.canvases.get(String(e))||null}_canvasDisposed(e){this.web&&this._releaseWebCanvas(e,!0),this.activeCanvas===e&&(this.activeCanvas=null),this.document.activeElement===e&&(this.document.activeElement=null),this.canvases.get(e.canvasId)===e&&this.canvases.delete(e.canvasId)}_prepareTree(e){let t=new Set,i=new Set,r=n=>{if(!(!n||typeof n!="object"||t.has(n))){if(t.add(n),n.type==="three"){let s=n.canvasId===void 0?"main":String(n.canvasId),a=this.createCanvas(s);n.canvasId=s,n.engineId=a.engineId,n.surfaceId=a.surfaceId,n.generation=a.generation,a._mounted=!0,a._webFrames&&(a._webFrames.released=!1),i.add(a)}if(Array.isArray(n))for(let s of n)r(s);else for(let s of Object.keys(n))s!=="canvas"&&s!=="renderer"&&r(n[s])}};r(e);for(let n of this.canvases.values())n.mounted&&!i.has(n)&&n._detach();return e}_keyEvent(e,t){let i=Object.assign({},e,{type:t?"keydown":"keyup",down:t,key:e.key||"",code:e.code||e.key||"",repeat:!!e.repeat}),r=i.code||i.key;t?this.heldKeys.set(r,i):this.heldKeys.delete(r),this.document.dispatchEvent(i);let n=this.document.activeElement,s=n&&n.isJsrThreeCanvas?n:this.document.hasFocus()?null:this.activeCanvas;return s&&!s.disposed&&s.dispatchEvent(i),!0}_pointerEvent(e,t){let i=e.dispatchEvent(t),r=e.ownerDocument;return r&&r.runtime===this&&r.dispatchEvent(t),i}_clearInput(e,t){let i=Array.from(this.heldKeys.values());this.heldKeys.clear();for(let n of i){let s=Object.assign({},n,{type:"keyup",down:!1,repeat:!1});this.document.dispatchEvent(s);let a=e||this.activeCanvas;a&&!a.disposed&&a.dispatchEvent(s)}let r=e?[e]:Array.from(this.canvases.values());for(let n of r){for(let s of Array.from(n._captured))this._pointerEvent(n,{type:"pointercancel",pointerId:s,pointerType:"unknown"}),this._pointerEvent(n,{type:"pointerup",pointerId:s,pointerType:"unknown",button:0}),n.hasPointerCapture(s)&&n.releasePointerCapture(s);t&&n.blur()}return t&&this.document.dispatchEvent({type:"blur"}),!0}_hostEvent(e,t={}){if(e==="key")return this._keyEvent(t,t.down!==!1);if(e==="blur")return this._clearInput(null,!0);if(e==="viewport")return this._setViewport(t.width,t.height,t.pixelRatio||t.dpr);if(e==="frameAck"||e==="release"||e==="jsr.three.frameAck"||e==="jsr.three.release")return this._frameControl(Object.assign({},t,{type:e==="frameAck"||e==="release"?`jsr.three.${e}`:e}));if(typeof e=="string"&&e.startsWith("input:"))return this._dispatchEvent(e.slice(6),t);throw new Error(`three.invalid: unknown host event ${e}`)}_dispatchEvent(e,t={}){let i=this.getCanvas(e);if(!i||i.disposed)return!1;let r=t.type||"";if(r==="keydown"||r==="keyup")return this._keyEvent(t,r==="keydown");if(r==="blur")return this._clearInput(i,!0);if(r==="visibility"||r==="visibilitychange"){let s=t.hidden!==void 0?!!t.hidden:!t.visible;return s&&this._clearInput(i,!0),this.document._setVisibility(s),i.dispatchEvent(Object.assign({},t,{type:"visibilitychange",hidden:s}))}if(r==="resize")return Number.isFinite(t.width)&&Number.isFinite(t.height)&&((t.pixelRatio!==void 0||t.dpr!==void 0)&&i.setPixelRatio(t.pixelRatio||t.dpr),i.renderer?i.renderer.setSize(t.width,t.height,!1):i.setSize(t.width,t.height,!1)),this._setViewport(t.width,t.height,t.pixelRatio||t.dpr),i.dispatchEvent(t);r==="pointerdown"&&(this.activeCanvas=i,i.focus());let n=r.startsWith("pointer")?this._pointerEvent(i,t):i.dispatchEvent(t);return(r==="pointerup"||r==="pointercancel")&&i.hasPointerCapture(t.pointerId)&&i.releasePointerCapture(t.pointerId),n}_setViewport(e,t,i){Number.isFinite(e)&&(this.width=e),Number.isFinite(t)&&(this.height=t),Number.isFinite(i)&&(this.pixelRatio=i),this.document.dispatchEvent({type:"resize",width:this.width,height:this.height,pixelRatio:this.pixelRatio})}registerAsset(e,t){if(e=String(e),e.startsWith("data:")){let r=this._parseDataUrl(e);return this.assets.set(e,r),r}let i=this._assetRecord(e,t);return this.assets.set(e,i),i}_parseDataUrl(e){let t=e.indexOf(",");if(t<0)throw ot(e,"malformed data URI");let i=e.slice(5,t),r=i.split(";")[0]||"application/octet-stream";if(!/;base64/i.test(i))throw ot(e,"only base64 data URIs are supported");return this._assetRecord(e,{data:e.slice(t+1),mime:r})}_assetRecord(e,t){if(t==null)throw ot(e,"missing asset bytes");let i=typeof t=="object"&&!(t instanceof Uint8Array)&&!(t instanceof ArrayBuffer)&&!ArrayBuffer.isView(t)?t:{data:t},r=i.data!==void 0?i.data:i.bytes,n=Tr(r);if(n.length>64*1024*1024)throw ot(e,"asset exceeds 64 MiB");return{url:e,data:typeof r=="string"?r:_d(n),bytes:n,mime:i.mime||i.mimeType||"",width:Number.isFinite(i.width)?i.width:0,height:Number.isFinite(i.height)?i.height:0}}resolveAsset(e){return e=String(e),e.startsWith("data:")?(this.assets.has(e)||this.registerAsset(e),this.assets.get(e)):this.assets.get(e)||this.assets.get(e.replace(/^\.\//,""))||null}_checkAssetGuard(e,t){if(t&&t.canvas&&(t.canvas.disposed||t.canvas.generation!==t.generation||t.canvas._assetEpoch!==t.epoch))throw ot(e,"surface was disposed or detached during asset load")}async loadAsset(e,t){e=String(e),this._checkAssetGuard(e,t);let i=this.resolveAsset(e);if(i)return i;let r;try{if(this.hostAssetLoader)r=await this.hostAssetLoader(e);else if(this.jsr&&typeof this.jsr.hostCall=="function")r=await this.jsr.hostCall("three.asset",{url:e});else throw ot(e,"asset is not registered and no host asset loader is available")}catch(n){throw n&&n.code==="three.assetFailure"?n:ot(e,n&&n.message?n.message:"host load failed")}return this._checkAssetGuard(e,t),this.registerAsset(e,r)}requestAnimationFrame(e){return this.jsr&&this.jsr.requestAnimationFrame?this.jsr.requestAnimationFrame.call(this.jsr,e):re.requestAnimationFrame?re.requestAnimationFrame(e):re.setTimeout(()=>e(Date.now()),16)}cancelAnimationFrame(e){return this.jsr&&this.jsr.cancelAnimationFrame?this.jsr.cancelAnimationFrame.call(this.jsr,e):re.cancelAnimationFrame?re.cancelAnimationFrame(e):re.clearTimeout(e)}sendR1(e){return(!this.jsr||typeof this.jsr.hostCallBinary!="function")&&P("three.r1","jsr.hostCallBinary is required"),this.jsr.hostCallBinary("three.r1",e)}setPresentHook(e){if(e!==null&&typeof e!="function")throw new TypeError("three.invalid: present hook must be a function or null");this.presentHook=e}_webState(e){return e._webFrames||(e._webFrames={nextId:0,pending:new Map,capturing:!1,dirty:!1,released:!1})}_frameMessage(e,t,i,r){let n={type:t,engineId:e.engineId,surfaceId:e.surfaceId,canvasId:e.canvasId,generation:e.generation};return i!==void 0&&(n.frameId=i),r!==void 0&&(n.bitmap=r,n.width=e.width,n.height=e.height),n}_postStructured(e,t){typeof re.postMessage!="function"&&P("present","dedicated Worker postMessage is required"),t===void 0?re.postMessage(e):re.postMessage(e,[t])}_postWebFrame(e,t,i){let r=++t.nextId;if(!Number.isSafeInteger(r))throw new Error("three.surface: frameId exhausted");t.pending.set(r,!0);try{this._postStructured(this._frameMessage(e,"jsr.three.frame",r,i),i)}catch(n){throw t.pending.delete(r),t.dirty=!0,i&&i.close&&i.close(),n}return r}_flushWebPresent(e){let t=this._webState(e);if(!t.dirty||t.released||e.disposed||t.capturing||t.pending.size>=2)return!1;t.dirty=!1;let i=e._backing;if(i&&i.transferToImageBitmap){let r=i.transferToImageBitmap();return this._postWebFrame(e,t,r),!0}return i&&typeof re.createImageBitmap=="function"?(t.capturing=!0,Promise.resolve(re.createImageBitmap(i)).then(r=>{if(t.capturing=!1,t.released||e.disposed){r&&r.close&&r.close();return}this._postWebFrame(e,t,r),t.dirty&&this._flushWebPresent(e)},r=>{t.capturing=!1,t.dirty=!1,P("present",r&&r.message)}),!0):(t.dirty=!1,P("present","OffscreenCanvas.transferToImageBitmap or createImageBitmap is required"))}_surfaceForMessage(e){if(!e||typeof e!="object"||e.engineId!==void 0&&e.engineId!==this.engineId)return null;for(let t of this.canvases.values())if(!(e.canvasId!==void 0&&e.canvasId!==t.canvasId)&&!(e.surfaceId!==void 0&&e.surfaceId!==t.surfaceId)&&!(e.generation!==void 0&&e.generation!==t.generation))return t;return null}_frameControl(e){let t=this._surfaceForMessage(e);if(!t||!this.web)return!1;let i=this._webState(t);return e.type==="jsr.three.release"?(i.released=!0,i.dirty=!1,i.pending.clear(),!0):e.type!=="jsr.three.frameAck"?!1:(i.pending.delete(e.frameId),i.dirty&&this._flushWebPresent(t),!0)}_releaseWebCanvas(e,t){if(!this.web)return;let i=this._webState(e);i.released=!0,i.dirty=!1,i.pending.clear(),t&&this._postStructured(this._frameMessage(e,"jsr.three.release"))}present(e,t){if(e.disposed)return!1;if(this.presentHook)return this.presentHook({canvas:e,canvasId:e.canvasId,surfaceId:e.surfaceId,engineId:e.engineId,generation:e.generation,payload:t});if(!this.web)return!1;let i=this._webState(e);return i.released?!1:(i.dirty=!0,this._flushWebPresent(e),!0)}getCapabilities(){return{...this.capabilities}}install(e){let t=this,i=Object.assign({},e,{createCanvas:(r,n)=>t.createCanvas(r,n),getCanvas:r=>t.getCanvas(r),registerAsset:(r,n)=>t.registerAsset(r,n),resolveAsset:r=>t.resolveAsset(r),loadAsset:r=>t.loadAsset(r),loadAssetBytes:r=>t.loadAsset(r),getCapabilities:()=>t.getCapabilities(),capabilities:t.capabilities,setPresentHook:r=>t.setPresentHook(r),present:(r,n)=>{let s=t.getCanvas(r);return s?s.present(n):!1},_prepareTree:r=>t._prepareTree(r),_hostEvent:(r,n)=>t._hostEvent(r,n),_frameControl:r=>t._frameControl(r),_dispatchEvent:(r,n)=>t._dispatchEvent(r,n),_setViewport:(r,n,s)=>t._setViewport(r,n,s),_resumeAudio:()=>t._nativeAudioContext&&t._nativeAudioContext.hasAudioGraph?t._nativeAudioContext.resume():Promise.resolve(),engineId:t.engineId,devicePixelRatio:t.pixelRatio});return Object.defineProperty(i,"_runtime",{value:t,enumerable:!1}),i}};function vd(o){Cw(),Aw(),Tw();let e=re.jsr||(re.jsr={}),t=e.three||{};if(Ni&&Ni.web===!!o&&t._runtime===Ni)return Ni;if(Ni=new Ca(e,!!o,t),o||A_(Ni),e.three=Ni.install(t),typeof e.render=="function"&&!e.render.__jsrThreeRenderWrapper){let i=e.render,r=function(n,...s){let a=e.three&&e.three._runtime;return a&&a._prepareTree(n),i.call(this,n,...s)};Object.defineProperties(r,{__jsrThreeRenderWrapper:{value:!0},__jsrThreeOriginalRender:{value:i}}),e.render=r}return Ni}function vo(o=!1){return Ni||vd(o)}var C_=4096,Ew=16777216,Iw=1024,Rw=64,Pw=64*1024*1024*4/3+8;function hh(o,e){if(!Number.isFinite(o)||o<0||o>C_)throw new Error(`three.invalid: canvas2d ${e} must be within 0..${C_}`);return Math.floor(o)}function E_(o){for(let e of o)if(De(e,"canvas2d rectangle"),Math.abs(e)>1e7)throw new Error("three.invalid: canvas2d rectangle is outside the bounded coordinate range");return o}function I_(o){if(typeof o!="string"||o.length<1||o.length>128)throw new Error("three.invalid: canvas2d color must be a nonempty bounded string");return o}function Md(o){return!!(o&&o.isJsrNativeCanvas2D)}var uh=class{constructor(e,t,i,r,n,s){if(E_([e,t,i,r,n,s]),i<0||s<0)throw new Error("three.invalid: canvas2d gradient radii must be non-negative");(e!==r||t!==n||i!==0)&&P("canvas2d.radialGradient","Flutter R1 currently supports concentric radial gradients with r0=0"),this.centerX=r,this.centerY=n,this.radius=s,this.stops=[]}addColorStop(e,t){if(De(e,"canvas2d gradient offset"),e<0||e>1)throw new Error("three.invalid: canvas2d gradient offset must be within 0..1");if(this.stops.length>=Rw)throw new Error("three.invalid: canvas2d gradient stop quota exceeded");this.stops.push({offset:e,color:I_(t)})}snapshot(){this.stops.length<2&&P("canvas2d.gradient","at least two color stops are required");let e=this.stops.map(t=>({offset:t.offset,color:t.color}));for(let t=1;t<e.length;t++)e[t].offset<e[t-1].offset&&P("canvas2d.gradient","color stops must be added in nondecreasing offset order");return{kind:"radial",centerX:this.centerX,centerY:this.centerY,radius:this.radius,stops:e}}},wd=class{constructor(e){this.canvas=e,this._fillStyle="#000000"}get fillStyle(){return this._fillStyle}set fillStyle(e){typeof e!="string"&&!(e instanceof uh)&&P("canvas2d.fillStyle","only CSS colors and native radial gradients are supported"),this._fillStyle=typeof e=="string"?I_(e):e}createRadialGradient(e,t,i,r,n,s){return new uh(e,t,i,r,n,s)}fillRect(e,t,i,r){E_([e,t,i,r]);let n=typeof this._fillStyle=="string"?{kind:"color",color:this._fillStyle}:this._fillStyle.snapshot();this.canvas._record({op:"fillRect",x:e,y:t,width:i,height:r,style:n})}clearRect(){P("canvas2d.clearRect","not included in the bounded native Canvas2D profile")}drawImage(){P("canvas2d.drawImage","not included in the bounded native Canvas2D profile")}fillText(){P("canvas2d.fillText","not included in the bounded native Canvas2D profile")}getImageData(){P("canvas2d.getImageData","readback belongs to the Flutter host")}putImageData(){P("canvas2d.putImageData","not included in the bounded native Canvas2D profile")}},bd=class{constructor(e,t,i,r={}){this.runtime=e,this.surface=t,this.canvasId=i,this.engineId=e.engineId,this.surfaceId=t.surfaceId,this.surfaceGeneration=t.generation,this.isJsrNativeCanvas2D=!0,this.isJsrThreeExampleLocal=!0,this.style={},this._width=hh(r.width===void 0?300:r.width,"width"),this._height=hh(r.height===void 0?150:r.height,"height"),this._context=new wd(this),this._commands=[],this._listeners=new Map,this._readyListeners=new Set,this._revision=0,this._sentRevision=0,this._requestId=0,this._readyVersion=0,this._ready=!1,this._rgba=null,this._scheduled=!1,this._inFlight=!1,this._disposed=!1,this.error=null}get width(){return this._width}set width(e){this._resize(hh(e,"width"),this._height)}get height(){return this._height}set height(e){this._resize(this._width,hh(e,"height"))}get disposed(){return this._disposed}get ready(){return this._ready}_resize(e,t){if(!this._disposed&&!(e===this._width&&t===this._height)){if(e*t>Ew)throw new Error("three.invalid: canvas2d pixel quota exceeded");this._width=e,this._height=t,this._commands=[],this._touch()}}getContext(e){if(this._disposed)throw new Error("three.surface: canvas2d is disposed");return e!=="2d"&&P("canvasContext",e),this._context}addEventListener(e,t){if(!t)return;let i=this._listeners.get(e)||[];i.includes(t)||i.push(t),this._listeners.set(e,i)}removeEventListener(e,t){let i=this._listeners.get(e);i&&this._listeners.set(e,i.filter(r=>r!==t))}dispatchEvent(e){if(!e||!e.type)throw new Error("three.invalid: canvas2d event.type is required");e.target=this,e.currentTarget=this;for(let t of(this._listeners.get(e.type)||[]).slice())typeof t=="function"?t.call(this,e):t&&t.handleEvent&&t.handleEvent(e);return!0}_addReadyListener(e){return this._disposed?()=>{}:(this._readyListeners.add(e),()=>this._readyListeners.delete(e))}_record(e){if(this._disposed)throw new Error("three.surface: canvas2d is disposed");if(this._commands.length>=Iw)throw new Error("three.invalid: canvas2d command quota exceeded");this._commands.push(e),this._touch()}_touch(){this._revision++,this._ready=!1,this._rgba=null,this.error=null,this._schedule()}_schedule(){this._scheduled||this._disposed||(this._scheduled=!0,Promise.resolve().then(()=>{this._scheduled=!1,this._flush()}))}_args(e,t){return{engineId:this.engineId,surfaceId:this.surfaceId,canvasId:this.canvasId,generation:this.surfaceGeneration,requestId:e,width:this._width,height:this._height,commands:t}}_flush(){if(this._disposed||this._inFlight||this._sentRevision===this._revision||!this._width||!this._height)return;let e=this._revision,t=++this._requestId,i=this._commands.slice();this._sentRevision=e,this._inFlight=!0,this.runtime.jsr.hostCall("three.canvas2d",this._args(t,i)).then(r=>{if(this._disposed||t!==this._requestId||e!==this._revision||!r||r.stale)return;if(r.engineId!==this.engineId||r.surfaceId!==this.surfaceId||r.canvasId!==this.canvasId||r.generation!==this.surfaceGeneration||r.requestId!==t||r.width!==this._width||r.height!==this._height||typeof r.data!="string"||r.data.length>Pw)throw new Error("three.canvas2d: host response identity or dimensions do not match the request");let n=Tr(r.data);if(n.byteLength!==this._width*this._height*4)throw new Error("three.canvas2d: host returned an invalid raw RGBA byte length");this._rgba=n,this._readyVersion++,this._ready=!0,this.error=null;for(let s of Array.from(this._readyListeners))s(this);this.dispatchEvent({type:"ready"})}).catch(r=>{this._disposed||t!==this._requestId||e!==this._revision||(this.error=r instanceof Error?r:new Error(String(r)),this.dispatchEvent({type:"error",error:this.error}))}).then(()=>{this._inFlight=!1,this._sentRevision!==this._revision&&this._schedule()})}dispose(){this._disposed||(this._disposed=!0,this._requestId++,this._commands=[],this._rgba=null,this._ready=!1,this._readyListeners.clear(),this._listeners.clear(),this.surface._nativeCanvas2d&&this.surface._nativeCanvas2d.delete(this),this.runtime.jsr.hostCall("three.canvas2d",{action:"dispose",engineId:this.engineId,surfaceId:this.surfaceId,canvasId:this.canvasId,generation:this.surfaceGeneration,requestId:this._requestId,width:0,height:0,commands:[]}).catch(()=>{}))}toDataURL(){P("canvas2d.capture","capture belongs to the JSR host")}toBlob(){P("canvas2d.capture","capture belongs to the JSR host")}};function R_(o){if(!o||o.web)return;let e=0,t=(i="main",r={})=>{let n=typeof i=="object"?i:o.getCanvas(i);if(!n||n.disposed||!n.isJsrThreeCanvas)throw new Error("three.surface: canvas2d requires a live JSR THREE surface");let s=new bd(o,n,`2d-${++e}`,r),a=n._nativeCanvas2d||(n._nativeCanvas2d=new Set);if(a.add(s),!n._nativeCanvas2dDisposeWrapped){n._nativeCanvas2dDisposeWrapped=!0;let l=n.dispose;n.dispose=function(){for(let c of Array.from(a))c.dispose();return l.call(this)}}return s};o.createCanvas2D=t,o.jsr.three.createCanvas2D=t}var P_=new WeakMap,Ea={builds:0,queries:0,candidateTriangles:0,fallbacks:0};function L_(){return{...Ea}}function N_(o){let e=o.prototype._computeIntersections;if(typeof e!="function")throw new Error("three.invalid: upstream Mesh intersection path is unavailable");o.prototype._computeIntersections=function(t,i,r){let n=Lw(this,r);if(n===null)return Ea.fallbacks++,e.call(this,t,i,r);if(Ea.queries++,Ea.candidateTriangles+=n.length,n.length===0)return;let s=this.geometry,a=s.index,l=i.length;s.index=zw(a,n);try{e.call(this,t,i,r)}finally{s.index=a}for(let c=l;c<i.length;c++){let h=i[c],u=h&&h.faceIndex;Number.isInteger(u)&&n[u]!==void 0&&(h.faceIndex=n[u])}}}function Lw(o,e){let t=o.geometry;if(!t||o.isSkinnedMesh||Array.isArray(o.material)||t.morphAttributes&&t.morphAttributes.position)return null;let i=t.attributes&&t.attributes.position,r=t.index;if(!Nw(i,r)||!Dw(t))return null;let n=P_.get(t);return Bw(n,i,r)||(n=Fw(i,r),P_.set(t,n),Ea.builds++),Ow(n,e)}function Nw(o,e){return!!(o&&e&&o.isBufferAttribute&&e.isBufferAttribute&&!o.isInterleavedBufferAttribute&&!e.isInterleavedBufferAttribute&&o.itemSize===3&&e.itemSize===1&&!o.normalized&&!e.normalized&&o.array&&e.array&&e.count>=1024*3&&e.count%3===0)}function Dw(o){let e=o.drawRange;return!e||e.start===0&&e.count===1/0}function Bw(o,e,t){return!!(o&&o.position===e&&o.index===t&&o.positionArray===e.array&&o.indexArray===t.array&&o.positionVersion===e.version&&o.indexVersion===t.version)}function Fw(o,e){let t=o.array,i=e.array,r=e.count/3,n=new Uint32Array(r),s=new Float64Array(r*3),a=new Float64Array(r*6);for(let c=0;c<r;c++){n[c]=c;let h=c*3,u=i[h]*3,d=i[h+1]*3,f=i[h+2]*3,p=c*6;for(let m=0;m<3;m++){let _=t[u+m],g=t[d+m],x=t[f+m],y=Math.min(_,g,x)-1e-7,v=Math.max(_,g,x)+1e-7;a[p+m]=y,a[p+m+3]=v,s[h+m]=(_+g+x)/3}}let l=[];return Sd(l,n,s,a,0,r),{position:o,index:e,positionArray:t,indexArray:i,positionVersion:o.version,indexVersion:e.version,nodes:l,order:n}}function Sd(o,e,t,i,r,n){let s={minX:1/0,minY:1/0,minZ:1/0,maxX:-1/0,maxY:-1/0,maxZ:-1/0,centroidMinX:1/0,centroidMinY:1/0,centroidMinZ:1/0,centroidMaxX:-1/0,centroidMaxY:-1/0,centroidMaxZ:-1/0,start:-1,count:-1,left:-1,right:-1},a=o.length;o.push(s);for(let m=r;m<n;m++){let _=e[m],g=_*6,x=_*3;s.minX=Math.min(s.minX,i[g]),s.minY=Math.min(s.minY,i[g+1]),s.minZ=Math.min(s.minZ,i[g+2]),s.maxX=Math.max(s.maxX,i[g+3]),s.maxY=Math.max(s.maxY,i[g+4]),s.maxZ=Math.max(s.maxZ,i[g+5]),s.centroidMinX=Math.min(s.centroidMinX,t[x]),s.centroidMinY=Math.min(s.centroidMinY,t[x+1]),s.centroidMinZ=Math.min(s.centroidMinZ,t[x+2]),s.centroidMaxX=Math.max(s.centroidMaxX,t[x]),s.centroidMaxY=Math.max(s.centroidMaxY,t[x+1]),s.centroidMaxZ=Math.max(s.centroidMaxZ,t[x+2])}let l=n-r;if(l<=8)return s.start=r,s.count=l,a;let c=s.centroidMaxX-s.centroidMinX,h=s.centroidMaxY-s.centroidMinY,u=s.centroidMaxZ-s.centroidMinZ,d=c>=h&&c>=u?0:h>=u?1:2,f=e.slice(r,n);f.sort((m,_)=>t[m*3+d]-t[_*3+d]||m-_),e.set(f,r);let p=r+Math.floor(l/2);return s.left=Sd(o,e,t,i,r,p),s.right=Sd(o,e,t,i,p,n),a}function Ow(o,e){let t=o.nodes,i=o.order,r=new Int32Array(t.length),n=[],s=e.origin,a=e.direction,l=0;for(r[l++]=0;l>0;){let c=t[r[--l]];if(Uw(c,s,a))if(c.count>=0){let h=c.start+c.count;for(let u=c.start;u<h;u++)n.push(i[u])}else r[l++]=c.left,r[l++]=c.right}return n.sort((c,h)=>c-h),n}function Uw(o,e,t){let i=0,r=1/0;if(t.x===0){if(e.x<o.minX||e.x>o.maxX)return!1}else{let n=(o.minX-e.x)/t.x,s=(o.maxX-e.x)/t.x;if(n>s){let a=n;n=s,s=a}if(i=Math.max(i,n),r=Math.min(r,s),r<i)return!1}if(t.y===0){if(e.y<o.minY||e.y>o.maxY)return!1}else{let n=(o.minY-e.y)/t.y,s=(o.maxY-e.y)/t.y;if(n>s){let a=n;n=s,s=a}if(i=Math.max(i,n),r=Math.min(r,s),r<i)return!1}if(t.z===0){if(e.z<o.minZ||e.z>o.maxZ)return!1}else{let n=(o.minZ-e.z)/t.z,s=(o.maxZ-e.z)/t.z;if(n>s){let a=n;n=s,s=a}if(i=Math.max(i,n),r=Math.min(r,s),r<i)return!1}return!0}function zw(o,e){let t=o.array,i=new o.array.constructor(e.length*3);for(let r=0;r<e.length;r++){let n=e[r]*3,s=r*3;i[s]=t[n],i[s+1]=t[n+1],i[s+2]=t[n+2]}return new o.constructor(i,1,o.normalized)}var kw=1,Vw=6,Gw=1,F_=64*1024*1024,xt=Object.freeze({GEOMETRY:1,TEXTURE:2,MATERIAL:3,NODE:4,REMOVE_NODE:5,CAMERA:6,LIGHT:7,FRAME:8,DISPOSE_RESOURCE:9,DISPOSE_SURFACE:10,DRAW_BATCH:11,REMOVE_BATCH:12,CLIPPING:13,RENDER_TARGET:14}),D_=Object.freeze({cast:1,receive:2}),Hw=Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),_n=Object.freeze({width:0,height:0,bias:0,normalBias:0,radius:1,matrix:Hw}),_t=class{constructor(e=256){this.buffer=new ArrayBuffer(Math.max(16,e)),this.view=new DataView(this.buffer),this.length=0}ensure(e){if(this.length+e<=this.buffer.byteLength)return;let t=this.buffer.byteLength;for(;t<this.length+e;)t*=2;let i=new ArrayBuffer(t);new Uint8Array(i).set(new Uint8Array(this.buffer,0,this.length)),this.buffer=i,this.view=new DataView(i)}u8(e){this.ensure(1),this.view.setUint8(this.length,e),this.length+=1}u16(e){this.ensure(2),this.view.setUint16(this.length,e,!0),this.length+=2}u32(e){this.ensure(4),this.view.setUint32(this.length,qe(e,"u32"),!0),this.length+=4}f32(e){this.ensure(4),this.view.setFloat32(this.length,e,!0),this.length+=4}bytes(e){let t=e instanceof Uint8Array?e:new Uint8Array(e);this.ensure(t.length),new Uint8Array(this.buffer,this.length,t.length).set(t),this.length+=t.length}floats(e){for(let t=0;t<e.length;t++)this.f32(e[t])}finish(){return new Uint8Array(this.buffer,0,this.length).slice()}};function Lt(o,e=new Uint8Array(0)){if(e.length>4294967295)throw new Error("three.invalid: command body is too large");return{opcode:o,body:e}}function Xe(o){if(!o||!Number.isInteger(o.id)||o.id<0||o.id>4294967295)throw new Error("three.invalid: upstream object id is not u32");return o.id===0?4294967295:o.id>>>0}function O_(o,e,t,i){if(!Array.isArray(o)||o.length>1e5)throw new Error("three.invalid: R1 command count exceeds 100000");qe(i,"sequence");let r=yo(e),n=yo(t);if(!r.length||r.length>128||!n.length||n.length>128)throw new Error("three.invalid: T1 identity length");let s=new _t(12+o.length*16);s.bytes(new Uint8Array([74,83,82,49])),s.u16(Vw),s.u16(0),s.u32(o.length);for(let d of o){if(!d||!Number.isInteger(d.opcode)||d.opcode<1||d.opcode>255)throw new Error("three.invalid: R1 opcode");s.u8(d.opcode),s.u8(0),s.u16(0),s.u32(d.body.length),s.bytes(d.body)}let a=s.finish(),l=32+r.length+n.length,c=l+a.length;if(c>F_)throw new Error("three.invalid: T1 envelope exceeds 64 MiB");let h=new Uint8Array(c),u=new DataView(h.buffer);return h.set([74,83,82,51],0),u.setUint8(4,kw),u.setUint8(5,Gw),u.setUint16(6,l,!0),u.setUint32(8,i,!0),u.setUint32(12,a.length,!0),u.setUint16(16,r.length,!0),u.setUint16(18,n.length,!0),u.setUint32(20,0,!0),u.setUint32(24,c,!0),u.setUint32(28,0,!0),h.set(r,32),h.set(n,32+r.length),h.set(a,l),h}function U_(o,e,t,i,r,n,s=null){let a=n?n.length:0,l=0,c=["position","normal","uv","color"];for(let d=0;d<c.length;d++)r[c[d]]&&(l|=1<<d);if(s&&(t!==0||s.length%2!==0))throw new Error("three.invalid: wire indices require complete triangle-mesh edges");let h=s?4+s.length*4:0,u=new _t(28+a*4+h+64);u.u32(o),u.u32(e),u.u32(l),u.u32(i),u.u32(a),u.u32(t),u.u32(0);for(let d of c){let f=r[d];f&&(u.u32(f.byteLength),u.bytes(new Uint8Array(f.buffer,f.byteOffset,f.byteLength)))}if(n)for(let d=0;d<n.length;d++)u.u32(n[d]);if(s){u.u32(s.length);for(let d=0;d<s.length;d++)u.u32(s[d])}return Lt(xt.GEOMETRY,u.finish())}function Ad(o,e,t,i,r,n,s){let a=new _t(28+s.length);return a.u32(o),a.u32(e),a.u32(t),a.u32(i),a.u32(r),a.u32(n),a.u32(s.length),a.bytes(s),Lt(xt.TEXTURE,a.finish())}var v5=Object.freeze({intersection:1,shadows:2});function z_(o,e,t,i,r,n){let s=new _t(28);return s.u32(qe(o,"renderTarget.id")),s.u32(qe(e,"renderTarget.version")),s.u32(qe(t,"renderTarget.width")),s.u32(qe(i,"renderTarget.height")),s.u32(qe(r,"renderTarget.textureId")),s.u32(qe(n,"renderTarget.flags")),s.u32(0),Lt(xt.RENDER_TARGET,s.finish())}function k_(o,e,t,i,r,n,s,a,l,c,h,u,d=null,f=0,p=null,m=1,_=0,g=0,x=null,y=null,v=null,M=null){if(t===5!=(d!==null))throw new Error("three.invalid: Phong material requires exactly one specular payload");if(p!==null&&t!==1&&t!==2&&t!==5&&t!==8)throw new Error("three.invalid: emissive payload requires a lit mesh material");if(!Number.isInteger(_)||_<0)throw new Error("three.invalid: material clip id");if(g!==0&&g!==1&&g!==2&&g!==3)throw new Error("three.invalid: material clip flags");let A=x||{alphaMapId:0,envMapId:0,envMapIntensity:1,mapUvMatrix:null,alphaMapUvMatrix:null};for(let C of["mapUvMatrix","alphaMapUvMatrix"]){let I=A[C];if(I&&I.length!==9)throw new Error("three.invalid: material uv matrix requires nine floats")}let T=y||{matcapId:0,gradientMapId:0,rotation:0};if(!Number.isFinite(T.rotation))throw new Error("three.invalid: material sprite rotation must be finite");let S=v||{normalMapId:0,normalScaleX:1,normalScaleY:1,bumpMapId:0,bumpScale:1,roughnessMapId:0,metalnessMapId:0};if(!Number.isFinite(S.normalScaleX)||!Number.isFinite(S.normalScaleY))throw new Error("three.invalid: material normalScale must be finite");if(!Number.isFinite(S.bumpScale))throw new Error("three.invalid: material bumpScale must be finite");let b=new _t(192+(d?16:0)+(p?16:0));b.u32(o),b.u32(e),b.u32(t),b.u32(i),b.u32(r),b.u32(n),b.f32(s.r),b.f32(s.g),b.f32(s.b),b.f32(a),b.f32(l),b.f32(c),b.f32(h),b.f32(u),b.u32(_),b.u32(g),b.u32(A.alphaMapId),b.u32(A.envMapId),b.f32(A.envMapIntensity);for(let C=0;C<9;C++)b.f32(A.mapUvMatrix?A.mapUvMatrix[C]:C%4===0?1:0);for(let C=0;C<9;C++)b.f32(A.alphaMapUvMatrix?A.alphaMapUvMatrix[C]:C%4===0?1:0);return b.u32(T.matcapId),b.u32(T.gradientMapId),b.f32(T.rotation),b.u32(0),b.u32(S.normalMapId),b.f32(S.normalScaleX),b.f32(S.normalScaleY),b.u32(S.bumpMapId),b.f32(S.bumpScale),b.u32(S.roughnessMapId),b.u32(S.metalnessMapId),d&&(b.f32(d.r),b.f32(d.g),b.f32(d.b),b.f32(f)),p&&(b.f32(p.r),b.f32(p.g),b.f32(p.b),b.f32(m)),b.u32(M?qe(M.rightId,"anaglyph.rightId"):0),b.u32(0),b.u32(0),b.u32(0),B_(b,M?.left),B_(b,M?.right),Lt(xt.MATERIAL,b.finish())}function B_(o,e){if(e&&e.length!==9)throw new Error("three.invalid: Dubois matrix requires nine floats");for(let t=0;t<3;t++){for(let i=0;i<3;i++){let r=e?e[t*3+i]:0;if(!Number.isFinite(r))throw new Error("three.invalid: Dubois matrix must be finite");o.f32(r)}o.f32(0)}}function V_(o,e,t,i,r,n,s,a={},l=null){let c=l||{x:.5,y:.5},h=new _t(108);return h.u32(o),h.u32(e),h.u32(t),h.u32(i),h.u32(r?1:0),h.u32(n),h.floats(s.elements||s),h.u32((a.cast?D_.cast:0)|(a.receive?D_.receive:0)),h.f32(c.x),h.f32(c.y),h.u32(0),Lt(xt.NODE,h.finish())}function G_(o){let e=new _t(4);return e.u32(o),Lt(xt.REMOVE_NODE,e.finish())}function H_(o,e,t,i,r,n=null,s=null){if(qe(o,"batch nodeId"),qe(e,"batch version"),qe(t,"batch instanceCount"),i<0||i>3)throw new Error("three.invalid: batch flags");if((i&2)!==0&&(i&1)===0)throw new Error("three.invalid: instance colors require instanced batches");if(i===0&&t!==1)throw new Error("three.invalid: non-instanced batch instanceCount must be one");if(!Array.isArray(r))throw new Error("three.invalid: batch parts");qe(r.length,"batch partCount");let a=i===1||i===3?t*16:0;if(a>0&&(!n||n.length<a))throw new Error("three.invalid: batch instance matrix payload");let l=i===3?t*3:0;if(l>0){if(!s||s.length<l)throw new Error("three.invalid: batch instance color payload");for(let u=0;u<l;u++)if(!Number.isFinite(s[u]))throw new Error("three.invalid: batch instance colors must be finite")}let c=20+r.length*16+a*4+l*4;if(c>F_)throw new Error("three.invalid: batch exceeds 64 MiB");let h=new _t(c);h.u32(o),h.u32(e),h.u32(t),h.u32(i),h.u32(r.length);for(let u of r)h.u32(u.geometryId),h.u32(u.materialId),h.u32(u.offset),h.u32(u.count);if(ArrayBuffer.isView(n))h.bytes(new Uint8Array(n.buffer,n.byteOffset,a*4));else for(let u=0;u<a;u++)h.f32(n[u]);if(ArrayBuffer.isView(s))h.bytes(new Uint8Array(s.buffer,s.byteOffset,l*4));else for(let u=0;u<l;u++)h.f32(s[u]);return Lt(xt.DRAW_BATCH,h.finish())}function dh(o){let e=new _t(4);return e.u32(o),Lt(xt.REMOVE_BATCH,e.finish())}function W_(o,e,t,i,r){let n=new _t(200);return n.u32(o),n.u32(e),n.floats(t.elements||t),n.floats(i.elements||i),n.floats(r.elements||r),Lt(xt.CAMERA,n.finish())}function q_(o,e,t,i,r,n,s=null,a=null){if(e===3!=(s!==null))throw new Error("three.invalid: HemisphereLight requires exactly one ground color payload");if(e===4!=(a!==null))throw new Error("three.invalid: SpotLight requires exactly one spot payload");let l=new _t(64);if(l.u32(o),l.u32(e),l.f32(t.r),l.f32(t.g),l.f32(t.b),l.f32(i),l.f32(r.x),l.f32(r.y),l.f32(r.z),l.f32(n.x),l.f32(n.y),l.f32(n.z),s&&(l.f32(s.r),l.f32(s.g),l.f32(s.b),l.u32(0)),a){if(!Number.isFinite(a.angle)||a.angle<=0||a.angle>Math.PI/2)throw new Error("three.invalid: SpotLight angle must be within (0, PI/2]");if(!Number.isFinite(a.penumbra)||a.penumbra<0||a.penumbra>8)throw new Error("three.invalid: SpotLight penumbra must be within [0, 8]");if(!Number.isFinite(a.distance)||a.distance<0||!Number.isFinite(a.decay)||a.decay<0)throw new Error("three.invalid: SpotLight distance/decay must be finite and non-negative");l.f32(a.angle),l.f32(a.penumbra),l.f32(a.distance),l.f32(a.decay)}return Lt(xt.LIGHT,l.finish())}function X_(o,e,t){if(qe(o,"clipping id"),qe(e,"clipping version"),!Array.isArray(t)||t.length===0||t.length>16)throw new Error("three.invalid: clipping plane count must be within 1..16");for(let r of t){if(!r||!Number.isFinite(r.normalX)||!Number.isFinite(r.normalY)||!Number.isFinite(r.normalZ)||!Number.isFinite(r.constant))throw new Error("three.invalid: clipping plane components must be finite");if(r.normalX*r.normalX+r.normalY*r.normalY+r.normalZ*r.normalZ<=0)throw new Error("three.invalid: clipping plane normal must be nonzero")}let i=new _t(16+t.length*16);i.u32(o),i.u32(e),i.u32(t.length);for(let r of t)i.f32(r.normalX),i.f32(r.normalY),i.f32(r.normalZ),i.f32(r.constant);return Lt(xt.CLIPPING,i.finish())}function Y_(o,e,t,i,r,n=_n,s=[],a=[],l=0,c=0,h=null,u=null){let d=n.contentRevision!==void 0,f=u!==null,p=s.length||a.length||d||f,m=(p?4+s.length*4:0)+(a.length||d||f?4+a.length*4:0)+(d?4:0),_=h||{active:0,x:0,y:0,z:0,far:0},g=new _t(172+m);if(g.u32(o),g.u32(e),g.f32(t.r),g.f32(t.g),g.f32(t.b),g.f32(t.a),g.f32(i),g.u32(r.mode),g.f32(r.color.r),g.f32(r.color.g),g.f32(r.color.b),g.f32(r.near),g.f32(r.far),g.u32(c),g.f32(r.mode===2?r.density:0),g.u32(_.active),g.u32(0),g.f32(_.active?_.x:0),g.f32(_.active?_.y:0),g.f32(_.active?_.z:0),g.f32(_.active?_.far:0),g.u32(n.width),g.u32(n.height),g.f32(n.bias),g.f32(n.normalBias),g.f32(n.radius),g.floats(n.matrix.elements||n.matrix),g.u32(l),p){g.u32(s.length);for(let x of s)g.u32(x)}if(a.length||d||f){g.u32(a.length);for(let x of a)g.u32(x)}return d?g.u32(n.contentRevision):f&&g.u32(0),f&&Ww(g,u),Lt(xt.FRAME,g.finish())}function Ww(o,e){o.u32(1180193610),o.u32(1),o.u32(qe(e.targetId,"frame.targetId")),o.u32(qe(e.width,"frame.targetWidth")),o.u32(qe(e.height,"frame.targetHeight"));for(let t of[e.viewport.x,e.viewport.y,e.viewport.z,e.viewport.w,e.scissor.x,e.scissor.y,e.scissor.z,e.scissor.w]){if(!Number.isFinite(t))throw new Error("three.invalid: frame rectangle must be finite");o.f32(t)}o.u32(qe(e.flags,"frame.flags")),o.u32(0)}function Ia(o,e){let t=new _t(8);return t.u32(o),t.u32(e),Lt(xt.DISPOSE_RESOURCE,t.finish())}function Z_(){return Lt(xt.DISPOSE_SURFACE)}var _h=["position","normal","uv","color"],qw=new Set([bn,Lh,Nh,Dh,Bh,Fh,Oh,Uh]),J_=1e6,Xw=16,Yw=16*1024*1024,wo=Object.freeze({clearColor:1,clearDepth:2,scissor:4,viewport:8}),K_=1024,ri={geometry:1,texture:2,material:3,node:4,light:5,camera:6,renderTarget:7},Zw=new w,Jw=new w(0,1,0),Je=new w,bo=new w,_i=new w,fh=new It,ph=new z,j_=new WeakMap,Kw=1;function Cr(o){if(!o||typeof o!="object"&&typeof o!="function")return 0;let e=j_.get(o);return e||(e=Kw++,j_.set(o,e)),e}function Di(o,e){for(let t=0;t<o.length;t++)De(o[t],e)}function Td(o){return o.elements.join(",")}function Cd(o,e){if(!o)return!1;let t=e.elements;for(let i=0;i<16;i++)if(o[i]!==t[i])return!1;return!0}function xn(o){return o?(o.version||0)+(o.data?o.data.version*65536:0):-1}function $_(o){return o?[o.id,o.version,o.itemSize,o.normalized?1:0,o.count,Cr(o.array),o.data?o.data.version:0,o.data?Cr(o.data.array):0,o.offset||0].join(":"):"-"}function mh(o){if(!o||!o.length)return 0;let e=2166136261,t=o.length;for(let i=0;i<t;i++)e^=o[i]|0,e=e*16777619|0;return e>>>0}function gh(o){return!!o&&(o._r1DynamicContent===!0||o.usage===Zh)}function jw(o,e,t){let i=_h.map(s=>$_(o.attributes[s])).join("|"),r=o.index,n=o.drawRange||{start:0,count:1/0};return[e,t,i,r?$_(r):"-",n.start,n.count].join(";")}function La(o,e){let t=o.drawRange||{start:0,count:1/0},i=o.index?o.index.array:null,r=i?i.length:e;if(!Number.isInteger(t.start)||t.start<0||t.count!==1/0&&(!Number.isInteger(t.count)||t.count<0))throw new Error("three.invalid: geometry drawRange");let n=Math.max(0,Math.min(r,t.start)),s=Math.min(t.count===1/0?r-n:t.count,r-n);if(!Number.isInteger(s)||s<0)throw new Error("three.invalid: geometry drawRange");return{start:n,count:s,available:r}}function yh(o,e){let t=La(o,e),i=o.index?o.index.array:null,r=new Array(t.count);for(let n=0;n<t.count;n++)r[n]=i?i[t.start+n]:t.start+n;return r}function $w(o){return o instanceof Int8Array?1/127:o instanceof Int16Array?1/32767:o instanceof Int32Array?1/2147483647:o instanceof Uint8Array||o instanceof Uint8ClampedArray?1/255:o instanceof Uint16Array?1/65535:o instanceof Uint32Array?1/4294967295:0}function Qw(o,e,t,i,r=0){if(!o)return null;if((typeof o.getComponent!="function"||o.isGLBufferAttribute)&&P("rawGLAttribute",i),o.itemSize!==t||o.count<r+e)throw new Error(`three.invalid: ${i} attribute must have ${t} components per vertex`);let n=e*t,s=new Float32Array(n),a=o.array,l=r*t;if(a&&!o.isInterleavedBufferAttribute&&a.length>=l+n)if(o.normalized){let c=$w(a);if(c){let h=a instanceof Int8Array||a instanceof Int16Array||a instanceof Int32Array;for(let u=0;u<n;u++){let d=a[l+u]*c;s[u]=h?Math.max(d,-1):d}return s}}else if(a instanceof Float32Array||a instanceof Float64Array){for(let c=0;c<n;c++){let h=a[l+c];De(h,`${i} attribute`),s[c]=h}return s}else{for(let c=0;c<n;c++)s[c]=a[l+c];return s}for(let c=0;c<e;c++)for(let h=0;h<t;h++){let u=o.getComponent(r+c,h);De(u,`${i} attribute`),s[c*t+h]=u}return s}function eb(o,e,t,i){if(!o.index&&t!=="line"&&o.drawRange.start===0&&o.drawRange.count===1/0){if(e===0&&i%3!==0||e===1&&i%2!==0)throw new Error("three.invalid: primitive vertex count is not aligned");return null}let r=yh(o,i);if(t==="line"){if(r.length<2)throw new Error("three.invalid: Line needs at least two vertices");let n=new Array((r.length-1)*2);for(let s=0;s<r.length-1;s++)n[s*2]=r[s],n[s*2+1]=r[s+1];r=n}if(!o.index&&t!=="line"&&o.drawRange.start===0&&o.drawRange.count===1/0&&(r=null),r){for(let n of r)if(!Number.isInteger(n)||n<0||n>=i)throw new Error("three.invalid: geometry index is outside vertexCount");if(e===0&&r.length%3!==0||e===1&&r.length%2!==0)throw new Error("three.invalid: primitive index count is not aligned")}else if(e===0&&i%3!==0||e===1&&i%2!==0)throw new Error("three.invalid: primitive vertex count is not aligned");return r}function tb(o,e){let t=yh(o,e),i=o.attributes.position,r=new Array(e),n=new Set,s=[],a=c=>{let h=r[c];return h===void 0&&(h=[i.getComponent(c,0),i.getComponent(c,1),i.getComponent(c,2)].join(","),r[c]=h),h},l=(c,h)=>{let u=a(c),d=a(h),f=u<=d?`${u}|${d}`:`${d}|${u}`;n.has(f)||(n.add(f),s.push(c,h))};for(let c=0;c<t.length;c+=3){let h=t[c],u=t[c+1],d=t[c+2];l(h,u),l(u,d),l(d,h)}if(s.length>12e6)throw new Error("three.invalid: wireIndexCount exceeds 12000000");return s}function Q_(o){let e=o.minFilter===me||o.minFilter===Pr||o.minFilter===Lr;return(o.colorSpace===ve?1:0)|(o.flipY?2:0)|(o.magFilter===me?4:0)|(e?8:0)|(o.generateMipmaps?16:0)|(o.wrapS===Ft||o.wrapS===si?32:0)|(o.wrapT===Ft||o.wrapT===si?64:0)}function e0(o){let e=o.image;return[o.version,o.source?o.source.version:0,Cr(e),e&&Cr(e.data),e&&e.width,e&&e.height,e&&e.encoding,e&&e.mime,o.colorSpace,o.flipY,o.magFilter,o.minFilter,o.generateMipmaps,o.wrapS,o.wrapT,o.format,o.type].join("|")}function t0(o){if(!o)return null;o.matrixAutoUpdate&&o.updateMatrix();let e=o.matrix&&o.matrix.elements;(!Array.isArray(e)||e.length!==9)&&P("textureTransform","uv transform requires a 3x3 matrix");for(let i=0;i<9;i++)De(e[i],"uv transform matrix");if(!o.isRenderTargetTexture)return e;let t=e;return[t[0],-t[1],t[2],t[3],-t[4],t[5],t[6],1-t[7],t[8]]}function ib(o){if(o._r1Background)return 10;if(o.isMeshBasicMaterial)return 0;if(o.isMeshLambertMaterial)return 1;if(o.isMeshStandardMaterial)return 2;if(o.isLineBasicMaterial&&!o.isLineDashedMaterial)return 3;if(o.isPointsMaterial)return 4;if(o.isMeshPhongMaterial)return 5;if(o.isMeshNormalMaterial)return 6;if(o.isShadowMaterial)return 7;if(o.isSpriteMaterial)return 0;if(o.isMeshToonMaterial)return 8;if(o.isMeshMatcapMaterial)return 9;P("material",o.type||"unknown material")}function n0(o){return o.isMeshLambertMaterial||o.isMeshPhongMaterial||o.isMeshStandardMaterial||o.isMeshToonMaterial}function xh(o){return String(o||"").replace(/\s+/g,"")}function rb(o){return`${xh(o.fragmentShader)} ${xh(o.vertexShader)}`}var i0="varyingvec2vUv;voidmain(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",nb="varyingvec2vUv;uniformsampler2DtDiffuse;voidmain(){gl_FragColor=texture2D(tDiffuse,vUv);#include<colorspace_fragment>}",sb="varyingvec2vUv;uniformfloattime;voidmain(){floatr=vUv.x;if(vUv.y<0.5)r=0.0;floatg=vUv.y;if(vUv.x<0.5)g=0.0;gl_FragColor=vec4(r,g,time,1.0);}",ob="varyingvec2vUv;voidmain(){vUv=vec2(uv.x,uv.y);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",ab="uniformsampler2DmapLeft;uniformsampler2DmapRight;varyingvec2vUv;uniformmat3colorMatrixLeft;uniformmat3colorMatrixRight;voidmain(){vec2uv=vUv;vec4colorL=texture2D(mapLeft,uv);vec4colorR=texture2D(mapRight,uv);vec3color=clamp(colorMatrixLeft*colorL.rgb+colorMatrixRight*colorR.rgb,0.,1.);gl_FragColor=vec4(color.r,color.g,color.b,max(colorL.a,colorR.a));#include<tonemapping_fragment>#include<colorspace_fragment>}";function lb(o){let e=o.uniforms||{},t=["mapLeft","mapRight","tDiffuse"].map(r=>e[r]?.value?Xe(e[r].value):0),i=["colorMatrixLeft","colorMatrixRight"].map(r=>e[r]?.value?.elements?.join(",")||"");return[o.version,rb(o),...t,...i].join("|")}function Ed(o,e){return e.side=o.side,e.depthTest=o.depthTest,e.depthWrite=o.depthWrite,e.transparent=o.transparent,e.opacity=o.opacity,e.alphaTest=o.alphaTest,e.blending=o.blending,e.toneMapped=o.toneMapped,e.fog=o.fog,e}function cb(o,e){let t=o.attributes.position,i=o.attributes.uv;if(!t||!i||t.itemSize!==3||i.itemSize!==2)return null;let r=1/0,n=1/0,s=-1/0,a=-1/0;for(let p=0;p<t.count;p++)r=Math.min(r,t.getX(p)),s=Math.max(s,t.getX(p)),n=Math.min(n,t.getY(p)),a=Math.max(a,t.getY(p));if(![r,n,s,a].every(Number.isFinite))return null;let l=[],c=[],h=[],u=[],d=[[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]];for(let p=0;p<2;p++)for(let m=0;m<2;m++)for(let[_,g]of d){let x=(m+_)/2,y=(p+g)/2;l.push(r+(s-r)*x,n+(a-n)*y,0),c.push(0,0,1),h.push(x,y),u.push(y<.5?x:0,x<.5?y:0,e)}let f=new D;return f.setAttribute("position",new R(l,3)),f.setAttribute("normal",new R(c,3)),f.setAttribute("uv",new R(h,2)),f.setAttribute("color",new R(u,3)),f.computeBoundingSphere(),f._r1ProceduralTime=e,f}function hb(o,e){if(e===void 0)return;let t=o.attributes.color;for(let i=0;i<t.count;i++)t.setZ(i,e);t.needsUpdate=!0}function ub(o){let e=o.material,t=e.uniforms||{},i=xh(e.vertexShader),r=xh(e.fragmentShader);if(t.mapLeft?.value&&t.mapRight?.value&&t.colorMatrixLeft?.value?.elements&&t.colorMatrixRight?.value?.elements&&i===ob&&r===ab){let n=Ed(e,new _e({map:t.mapLeft.value}));return n._r1NativeKind="anaglyph",n._r1Anaglyph={right:t.mapRight.value,left:t.colorMatrixLeft.value.elements,rightMatrix:t.colorMatrixRight.value.elements},{material:n,geometry:o.geometry}}if(t.tDiffuse?.value&&i===i0&&r===nb)return{material:Ed(e,new _e({map:t.tDiffuse.value})),geometry:o.geometry};if(t.time&&i===i0&&r===sb){let n=Ed(e,new _e({vertexColors:!0})),s=cb(o.geometry,t.time.value);return s?(n._r1ProceduralTime=t.time,{material:n,geometry:s}):null}return null}function db(o){(o.isShaderMaterial||o.isRawShaderMaterial)&&P("ShaderMaterial","arbitrary shaders require 1B"),o.isMeshPhysicalMaterial&&!o._r1PhysicalWarned&&(o._r1PhysicalWarned=!0,console.warn("three: R1 shades MeshPhysicalMaterial as MeshStandardMaterial (physical-only lobes dropped).")),o.wireframe&&!(o.isMeshBasicMaterial||o.isMeshLambertMaterial||o.isMeshPhongMaterial||o.isMeshNormalMaterial||o.isMeshStandardMaterial||o.isMeshToonMaterial||o.isMeshMatcapMaterial)&&P("wireframe","R1 wireframe requires a mesh material"),o.wireframe&&(o.wireframeLinewidth!==1||o.wireframeLinecap!=="round"||o.wireframeLinejoin!=="round")&&P("wireframeStyle","R1 supports one-pixel round wireframe lines"),o.blending===Eh&&P("materialBlending"),(o.alphaHash||o.premultipliedAlpha||o.colorWrite===!1||o.stencilWrite)&&P("materialState","alphaHash/premultipliedAlpha/colorWrite/stencil"),o.polygonOffset&&!o._r1PolygonOffsetWarned&&(o._r1PolygonOffsetWarned=!0,console.warn("three: R1 drops material.polygonOffset (depth bias stays disabled).")),Object.prototype.hasOwnProperty.call(o,"onBeforeCompile")&&P("onBeforeCompile","arbitrary shaders require 1B");let e=["aoMap","emissiveMap","lightMap","clearcoatMap","transmissionMap"];o.isMeshNormalMaterial||e.push("displacementMap");for(let t of e)o[t]&&P("materialTexture",`${o.type}.${t}`);for(let t of["specularMap"])if(o[t]){let i=`${o.type}.${t}`;o._r1DroppedMaps||(o._r1DroppedMaps={}),o._r1DroppedMaps[i]||(o._r1DroppedMaps[i]=!0,console.warn(`three: R1 drops ${i} (unsupported); base shading kept.`)),o[t]=null}if(o.envMap&&!(o.isMeshBasicMaterial||o.isMeshLambertMaterial||o.isMeshStandardMaterial||o.isMeshPhongMaterial)&&P("materialTexture",`${o.type}.envMap`),o.isMeshNormalMaterial&&(o.displacementMap=null),o.isMeshNormalMaterial&&(o.normalMap||o.bumpMap)&&(o.normalMap=null,o.bumpMap=null),(o.normalMap||o.bumpMap)&&!(o.isMeshLambertMaterial||o.isMeshPhongMaterial||o.isMeshStandardMaterial)&&P("materialTexture",`${o.type}.normalMap/bumpMap`),o.bumpMap&&!Number.isFinite(o.bumpScale))throw new Error("three.invalid: material bumpScale must be finite");if((o.roughnessMap||o.metalnessMap)&&!o.isMeshStandardMaterial&&P("materialTexture",`${o.type}.roughnessMap/metalnessMap`),o.normalMap&&o.normalScale&&(!Number.isFinite(o.normalScale.x)||!Number.isFinite(o.normalScale.y)))throw new Error("three.invalid: material normalScale must be finite");o.matcap&&!o.isMeshMatcapMaterial&&P("materialTexture",`${o.type}.matcap`),o.gradientMap&&!o.isMeshToonMaterial&&P("materialTexture",`${o.type}.gradientMap`),!n0(o)&&o.emissive&&(o.emissive.r!==0||o.emissive.g!==0||o.emissive.b!==0)&&P("emissiveMaterial",`${o.type} has no upstream emissive support`)}function Ra(o,e,t){o[e]||(o[e]=!0,console.warn(`three: ${t}`))}function Id(o,e){return new oe({color:o.color||new L(16777215),opacity:o.opacity===void 0?1:o.opacity,transparent:!!o.transparent,vertexColors:e,side:o.side,depthTest:o.depthTest,depthWrite:o.depthWrite,blending:o.blending,alphaTest:o.alphaTest||0,fog:o.fog})}function at(o){return o?`${o.id}:${xn(o)}:${Cr(o.array)}`:"-"}function fb(o){let e=o.drawRange||{start:0,count:1/0},t={start:e.start,count:e.count},i=t.count;if(i%3!==0||i>4e6)throw new Error("three.invalid: procedural vertex count");let r=new Float32Array(i*3),n=new Float32Array(i*3),s=new ArrayBuffer(4),a=new Float32Array(s),l=new Uint32Array(s),c=g=>(a[0]=g,l[0]),h=g=>(l[0]=g>>>0,a[0]),u=g=>{let x=g>>>0;return x=x+(x<<10)>>>0,x=(x^x>>>6)>>>0,x=x+(x<<3)>>>0,x=(x^x>>>11)>>>0,x=x+(x<<15)>>>0,x>>>0},d=(g,x,y,v)=>{let M=u((c(y)^u(c(v)))>>>0);return M=(M&8388607|1065353216)>>>0,g+x*(h(M)-1)},f=(g,x,y,v,M)=>{let A=x-g;v[M]=d(g,A,y,0),v[M+1]=d(g,A,y,1),v[M+2]=d(g,A,y,2)},p=new Float32Array(3),m=new Float32Array(3);for(let g=0;g<i;g++){let x=t.start+g,y=Math.floor(x/3);f(-1,1,y,p,0),f(-1/64,1/64,x,m,0),f(.25,1,y,n,g*3),r[g*3]=p[0]+m[0],r[g*3+1]=p[1]+m[1],r[g*3+2]=p[2]+m[2]}let _=new D;return _.setAttribute("position",new R(r,3)),_.setAttribute("color",new R(n,3)),_.computeBoundingSphere(),_}function r0(o,e,t){let i=o.attributes.position,r=o.attributes.color,n=o.attributes.lineDistance,s=t.scale===void 0?1:t.scale,a=t.dashSize===void 0?1:t.dashSize,l=t.gapSize===void 0?1:t.gapSize;if(![s,a,l].every(Number.isFinite)||s<=0||a<0||l<0||a+l<=0)throw new Error("three.invalid: dashed line scale/dashSize/gapSize");let c=La(o,i.count),h=yh(o,i.count).slice(c.start,c.start+c.count),u=e?Math.floor(h.length/2):h.length-1,d=[],f=[],p=a+l,m=0,_=(x,y,v,M,A,T)=>{for(let S=0;S<3;S++){let b=i.getComponent(v,S),C=i.getComponent(M,S);d.push(b+(C-b)*A)}for(let S=0;S<3;S++){let b=i.getComponent(v,S),C=i.getComponent(M,S);d.push(b+(C-b)*T)}if(r){let S=r.itemSize;for(let b of[A,T])for(let C=0;C<S;C++){let I=r.getComponent(v,C),B=r.getComponent(M,C);f.push(I+(B-I)*b)}}};for(let x=0;x<u;x++){let y=h[e?x*2:x],v=h[e?x*2+1:x+1],M=Math.hypot(i.getComponent(v,0)-i.getComponent(y,0),i.getComponent(v,1)-i.getComponent(y,1),i.getComponent(v,2)-i.getComponent(y,2));if(!(M>0))continue;let A=n?n.getComponent(y,0)*s:e?0:m*s,T=M*s,S=A+T,b=A,C=0;for(;b<S-1e-7&&C++<4e6;){let I=(b%p+p)%p,B=I<=a,N=B?b+a-I:b+p-I,k=Math.min(S,Math.max(b+1e-7,N));if(B&&_(y,v,y,v,(b-A)/T,(k-A)/T),b=k,d.length/3>4e6)throw new Error("three.invalid: dashed line vertex quota")}m+=M}let g=new D;return g.setAttribute("position",new R(d,3)),r&&g.setAttribute("color",new R(f,r.itemSize)),g.computeBoundingSphere(),g}function pb(o){let e=o.attributes.instanceStart,t=o.attributes.instanceEnd;if(!e||!t||e.itemSize!==3||t.itemSize!==3)return null;let i=Math.min(e.count,t.count);if(!Number.isInteger(i)||i<=0||i>2e6)throw new Error("three.invalid: fat line segment count");let r=new Float32Array(i*6);for(let c=0;c<i;c++)for(let h=0;h<3;h++)r[c*6+h]=e.getComponent(c,h),r[c*6+3+h]=t.getComponent(c,h);let n=o.attributes.instanceColorStart,s=o.attributes.instanceColorEnd,a=null;if(n&&s&&n.itemSize===3&&s.itemSize===3){a=new Float32Array(i*6);for(let c=0;c<i;c++)for(let h=0;h<3;h++)a[c*6+h]=n.getComponent(c,h),a[c*6+3+h]=s.getComponent(c,h)}let l=new D;return l.setAttribute("position",new R(r,3)),a&&l.setAttribute("color",new R(a,3)),l.computeBoundingSphere(),l}function mb(o){let e=o.attributes.position,t=o.attributes.vertColor,i=o.attributes.visible,r=yh(o,e.count),n=[],s=[];for(let l=0;l+1<r.length;l+=2){let c=r[l],h=r[l+1];if(!(i.getComponent(c,0)<=0&&i.getComponent(h,0)<=0))for(let u of[c,h]){for(let d=0;d<3;d++)n.push(e.getComponent(u,d));for(let d=0;d<3;d++)s.push(t.getComponent(u,d))}}let a=new D;return a.setAttribute("position",new R(n,3)),a.setAttribute("color",new R(s,3)),a.computeBoundingSphere(),a}var Pa=null;function gb(){if(Pa)return Pa;let o=32,e=new Uint8Array(o*o*4);for(let t=0;t<o;t++)for(let i=0;i<o;i++){let r=(i+.5)/o-.5,n=(t+.5)/o-.5,s=(t*o+i)*4;e[s]=e[s+1]=e[s+2]=255,e[s+3]=Math.hypot(r,n)<=.475?255:0}return Pa=new Le(e,o,o),Pa.needsUpdate=!0,Pa}function _b(o){if(o===Oi)return 0;if(o===yi)return 1;if(o===Co)return 2;throw new Error("three.invalid: material side")}var Mo=class{constructor(e={}){this.isWebGLRenderer=!0,this.isJsrThreeRenderer=!0,this.runtime=e.runtime||vo(!1),e.context!=null&&P("rawWebGL","native R1 does not accept a caller-provided GL context");let t=e.canvas||this.runtime.createCanvas("main");if(t.isJsrThreeCanvas||P("canvas","native WebGLRenderer requires jsr.three.createCanvas()"),t.renderer&&t.renderer!==this&&!t.renderer._disposed)throw new Error("three.surface: canvas already has an active renderer");this.domElement=t,t.renderer=this,this.capabilities=Object.assign({},this.runtime.capabilities,{rawWebGL:!1,isWebGL2:!1,backend:"flutterGpu",features:Object.freeze({geometry:!0,textures:!0,lambert:!0,standard:!0,phong:!0,normal:!0,emissive:!0,hemisphereLight:!0,spotLight:!0,clipping:!0,wireframe:!0,toneMapping:!0,fogExp2:!0,textureTransform:!0,alphaMap:!0,envMap:!0,sprite:!0,pointLightShadow:!0,toonMaterial:!0,matcapMaterial:!0,cubeEnvMap:!0,dataTexture:!0,rawWebGL:!1,shaderMaterial:!1})}),this.outputColorSpace=ve,this.toneMapping=bn,this.toneMappingExposure=1,this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.shadowMap={enabled:!1,autoUpdate:!0,needsUpdate:!1},this._manualShadowRevision=0,this._autoShadowRevision=0,this._shadowCullingKey=null,this._cachedCulledShadowNodeIds=[],this.xr={enabled:!1},this.info={autoReset:!0,render:{frame:0,calls:0,triangles:0,points:0,lines:0},memory:{geometries:0,textures:0},programs:[],reset:()=>{this.info.render.calls=0,this.info.render.triangles=0,this.info.render.points=0,this.info.render.lines=0}},this._clearColor=new L(0),this._clearAlpha=1,this._pixelRatio=t.pixelRatio||1,this._width=t.clientWidth||t.width,this._height=t.clientHeight||t.height,this._disposed=!1,this._animationLoop=null,this._animationHandle=null,this._pendingDisposals=[],this._resources=new Map,this._renderTargets=new Map,this._renderTargetDisposers=new Map,this._renderTarget=null,this._clearFlags=0,this._viewport={x:0,y:0,z:this._width,w:this._height},this._scissor={x:0,y:0,z:this._width,w:this._height},this._scissorTest=!1,this._geometryModes=new Map,this._geometryResourceKeys=new Map,this._geometryResourceOwners=new Map,this._nextGeometryAlias=2147483648,this._canvasTextures=new Map,this._canvasRefreshHandle=null,this._adaptedLineDraws=new WeakMap,this._adaptedShaderDraws=new WeakMap,this._lastScene=null,this._lastCamera=null,this._state=t._r1State||(t._r1State={sequence:0,geometries:new Map,textures:new Map,materials:new Map,nodes:new Map,batches:new Map,lights:new Map,cameras:new Map,clippings:new Map,renderTargets:new Map})}getContext(){P("rawWebGL","WebGLRenderer.getContext() is a 1B capability")}getContextAttributes(){P("rawWebGL","WebGLRenderer.getContextAttributes() is a 1B capability")}getPixelRatio(){return this._pixelRatio}getSize(e){return e&&e.set?e.set(this._width,this._height):{width:this._width,height:this._height}}getDrawingBufferSize(e){return e&&e.set?e.set(this.domElement.width,this.domElement.height):{width:this.domElement.width,height:this.domElement.height}}getClearColor(e){return e&&e.copy?e.copy(this._clearColor):this._clearColor.clone()}getClearAlpha(){return this._clearAlpha}setPixelRatio(e){if(!Number.isFinite(e)||e<=0||e>16)throw new Error("three.invalid: pixel ratio must be within (0,16]");this._pixelRatio=e,this.setSize(this._width,this._height,!1)}setSize(e,t,i=!0){if(!Number.isFinite(e)||!Number.isFinite(t)||e<0||t<0||e>16384||t>16384)throw new Error("three.invalid: renderer size must be within 0..16384");this._width=e,this._height=t,this.domElement._setSize(e,t,this._pixelRatio,i),this._viewport={x:0,y:0,z:e,w:t}}setClearColor(e,t=1){if(this._clearColor.set(e),!Number.isFinite(t)||t<0||t>1)throw new Error("three.invalid: clear alpha");this._clearAlpha=t}setClearAlpha(e){if(!Number.isFinite(e)||e<0||e>1)throw new Error("three.invalid: clear alpha");this._clearAlpha=e}_rectangle(e,t,i,r){let n=e?.isVector4?{x:e.x,y:e.y,z:e.z,w:e.w}:{x:e,y:t,z:i,w:r};for(let s of[n.x,n.y,n.z,n.w])De(s,"renderer rectangle");return(n.x<0||n.y<0||n.z<0||n.w<0)&&P("renderRect","R1 rectangles must be nonnegative"),n}setViewport(e,t,i,r){this._viewport=this._rectangle(e,t,i,r)}getViewport(e){return e.copy(new Te(this._viewport.x,this._viewport.y,this._viewport.z,this._viewport.w))}setScissor(e,t,i,r){this._scissor=this._rectangle(e,t,i,r)}getScissor(e){return e.copy(new Te(this._scissor.x,this._scissor.y,this._scissor.z,this._scissor.w))}setScissorTest(e){this._scissorTest=!!e}getScissorTest(){return this._scissorTest}setRenderTarget(e){this._renderTarget=e||null,this._renderTarget&&this._validateRenderTarget(this._renderTarget)}getRenderTarget(){return this._renderTarget}clear(e=!0,t=!0){e&&(this._clearFlags|=wo.clearColor),t&&(this._clearFlags|=wo.clearDepth)}clearDepth(){this.clear(!1,!0)}clearColor(){this.clear(!0,!1)}setAnimationLoop(e){if(e!==null&&typeof e!="function")throw new TypeError("three.invalid: animation loop callback");if(this._animationHandle!==null&&(this.runtime.cancelAnimationFrame(this._animationHandle),this._animationHandle=null),this._animationLoop=e,!e||this._disposed)return;let t=i=>{this._disposed||this._animationLoop!==e||(this._animationHandle=this.runtime.requestAnimationFrame(t),e(i))};this._animationHandle=this.runtime.requestAnimationFrame(t)}_mapSet(e,t,i){let r=this._transaction;if(r){let n=r.get(e);n||(n=new Map,r.set(e,n)),n.has(t)||n.set(t,[e.has(t),e.get(t)])}e.set(t,i)}_mapDelete(e,t){let i=this._transaction;if(i){let r=i.get(e);r||(r=new Map,i.set(e,r)),r.has(t)||r.set(t,[e.has(t),e.get(t)])}return e.delete(t)}_geometryResourceId(e,t,i){let r=Xe(e),n=`${r}:${t}:${i}`,s=this._geometryResourceKeys.get(n);if(s!==void 0)return s;let a=r;if(this._geometryResourceOwners.has(a)){let l=this._nextGeometryAlias;do if(a=this._nextGeometryAlias,this._nextGeometryAlias=a===4294967294?2147483648:a+1,this._nextGeometryAlias===l)throw new Error("three.invalid: geometry resource aliases exhausted");while(this._geometryResourceOwners.has(a))}return this._geometryResourceKeys.set(n,a),this._geometryResourceOwners.set(a,n),a}_releaseGeometryResource(e){let t=this._geometryResourceOwners.get(e);t!==void 0&&(this._geometryResourceOwners.delete(e),this._geometryResourceKeys.delete(t))}_listen(e,t,i,r){if(!e||!e.addEventListener)return;let n=this._resources.get(e);if(n){t==="geometries"&&!n.ids.includes(r)&&n.ids.push(r);return}let s={geometries:ri.geometry,textures:ri.texture,materials:ri.material,nodes:ri.node},a={type:t,id:r,ids:[r],listener:null};a.listener=()=>{this._unlisten(e),t==="textures"&&this._unwatchCanvasTexture(e);for(let l of a.ids){if(t==="geometries"&&(this._releaseGeometryResource(l),this._mapDelete(this._geometryModes,l)),!this._state[t].has(l))continue;this._mapDelete(this._state[t],l);let c={id:l,kind:s[t]};t==="nodes"&&this._mapDelete(this._state.batches,l)&&(c.batch=!0),this._pendingDisposals.push(c)}},e.addEventListener("dispose",a.listener),this._resources.set(e,a),this._transactionListens&&this._transactionListens.push(e)}_unlisten(e){let t=this._resources.get(e);t&&(e.removeEventListener("dispose",t.listener),this._resources.delete(e))}_unlistenAll(){for(let[e,t]of this._resources)e.removeEventListener&&e.removeEventListener("dispose",t.listener);this._resources.clear()}_nextVersion(e,t,i){let r=e.get(t);if(r&&r.signature===i)return null;let n=r?r.version+1:1;if(n>4294967295)throw new Error("three.invalid: resource version exhausted");return{signature:i,version:n}}_unwatchCanvasTexture(e){let t=this._canvasTextures.get(e);t&&(t.unlisten(),this._canvasTextures.delete(e))}_watchCanvasTexture(e,t){let i=this._canvasTextures.get(e);if(i&&i.canvas===t)return i;i&&this._unwatchCanvasTexture(e);let r={texture:e,canvas:t,adoptedVersion:0,unlisten:null};return r.unlisten=t._addReadyListener(()=>{this._disposed||this._canvasTextures.get(e)!==r||this._adoptCanvasTexture(r)&&this._scheduleCanvasRefresh()}),this._canvasTextures.set(e,r),r}_adoptCanvasTexture(e){let t=e.canvas;return!t._ready||!t._rgba||e.adoptedVersion===t._readyVersion?!1:(e.adoptedVersion=t._readyVersion,e.texture.userData.jsrCanvas2D=t,e.texture.source.data={width:t.width,height:t.height,data:new Uint8Array(t._rgba),encoding:0,encoded:!1},e.texture.needsUpdate=!0,!0)}_scheduleCanvasRefresh(){this._disposed||this._canvasRefreshHandle!==null||!this._lastScene||!this._lastCamera||(this._canvasRefreshHandle=!0,Promise.resolve().then(()=>{if(this._disposed||!this._lastScene||!this._lastCamera){this._canvasRefreshHandle=null;return}try{this.render(this._lastScene,this._lastCamera)}finally{this._canvasRefreshHandle=null}}))}_canvasForTexture(e){if(Md(e.image))return e.image;if(!e.isCanvasTexture)return null;let t=e.userData&&e.userData.jsrCanvas2D;return Md(t)?t:null}_validateRenderTarget(e){let t=e?.texture;(!e?.isRenderTarget||!t||e.isWebGLCubeRenderTarget||e.depth!==1||e.textures?.length!==1||e.samples!==0||e.stencilBuffer||e.depthTexture)&&P("renderTarget","R1 supports one 2D RGBA8 target with optional depth"),(t.format!==je||t.type!==Zt||t.generateMipmaps||t.flipY||t.colorSpace===ve||t.mapping!==vi)&&P("renderTargetTexture","R1 targets require linear, non-mipmapped RGBA8 textures"),(![me,xe].includes(t.magFilter)||![me,xe].includes(t.minFilter))&&P("renderTargetFilter","R1 target sampling supports nearest/linear only");let i=e.width*e.height;(!Number.isInteger(e.width)||!Number.isInteger(e.height)||e.width<=0||e.height<=0||e.width>8192||e.height>8192||i>Yw)&&P("renderTargetSize","R1 target exceeds the bounded 2D budget")}_renderTargetFlags(e){let t=e.texture;return(t.magFilter===me?1:0)|(t.minFilter===me?2:0)|(t.wrapS!==Be?4:0)|(t.wrapT!==Be?8:0)|(e.depthBuffer?256:0)}_trackRenderTarget(e){this._validateRenderTarget(e),e.texture.renderTarget=e;let t=Xe(e.texture);if(this._renderTargets.has(t))return t;this._renderTargets.size>=Xw&&P("renderTargetLimit","R1 supports at most 16 live targets");let i={id:t,version:Math.max(1,e.version||1),signature:null,target:e},r=()=>{this._renderTargets.has(t)&&(this._mapDelete(this._renderTargets,t),this._mapDelete(this._state.renderTargets,t),this._renderTargetDisposers.delete(t),e.removeEventListener("dispose",r),e.texture.removeEventListener("dispose",r),this._queueDisposal(Ia(t,7)))};return e.addEventListener("dispose",r),e.texture.addEventListener("dispose",r),this._renderTargetDisposers.set(t,r),this._mapSet(this._renderTargets,t,i),this._mapSet(this._state.renderTargets,t,i),t}_ensureRenderTarget(e,t){let i=this._trackRenderTarget(e),r=this._renderTargets.get(i),n=this._renderTargetFlags(e),s=[e.width,e.height,Xe(e.texture),n].join(":");return r.signature!==s&&(r.signature!==null&&r.version++,r.signature=s,t.push(z_(i,r.version,e.width,e.height,Xe(e.texture),n))),i}_ensureRenderTargetTexture(e,t){let i=e.renderTarget;return i||P("renderTargetAssociation","R1 target texture has no owning target"),this._renderTarget===i&&P("renderTargetFeedback","R1 cannot sample its active color target"),this._ensureRenderTarget(i,t),Xe(e)}_ensureTexture(e,t,i="map"){if(!e)return 0;if(e.isRenderTargetTexture)return this._ensureRenderTargetTexture(e,t);e.isTexture||P("texture","material map is not a THREE.Texture"),!e.isCubeTexture&&(e.isDataArrayTexture||e.isData3DTexture||e.isCompressedTexture||e.isVideoTexture||e.isFramebufferTexture||e.isDepthTexture||e.isExternalTexture)&&P("textureType",e.type),e.isCubeTexture&&i!=="envMap"&&P("textureMapping",`R1 ${i} requires a plain 2D texture`);let r=this._canvasForTexture(e);if(e.isCanvasTexture&&!r&&P("canvas2d.source","native CanvasTexture requires a Flutter canvas2d image"),r){let _=this._watchCanvasTexture(e,r);if(this._adoptCanvasTexture(_),!r._ready)return 0}if((i==="envMap"?e.mapping===Eo||e.mapping===vi||e.isCubeTexture&&(e.mapping===At||e.mapping===Ui):e.mapping===vi)||P("textureMapping",i==="envMap"?"R1 envMap supports EquirectangularReflectionMapping on a single 2D texture or CubeReflectionMapping faces":void 0),(e.premultiplyAlpha||e.mipmaps&&e.mipmaps.length)&&P("textureState","premultiplyAlpha/custom mipmaps"),(Number.isFinite(e.anisotropy)===!1||e.anisotropy<0)&&P("textureState","anisotropy must be a nonnegative number"),e.channel!==0&&P("textureChannel","R1 maps texture channel 0 only"),e.isCubeTexture&&e.mapping===Ui&&!e._r1RefractionWarned&&(e._r1RefractionWarned=!0,console.warn("three: R1 samples CubeRefractionMapping as reflection (refraction stays 1B).")),e.isCubeTexture)return this._ensureCubeTexture(e,t);let s=e.image;if(!s||!s.data)return 0;let a=Xe(e),l=this._frameTextures.get(a);if(l!==void 0)return l;this._listen(e,"textures",this._state.textures,a);let c=e0(e),h=this._nextVersion(this._state.textures,a,c);if(!h)return this._frameTextures.set(a,a),a;let u=s.data;if(!(u instanceof Uint8Array)&&!ArrayBuffer.isView(u))throw new Error("three.invalid: texture data must be a typed array");let d=u instanceof Uint8Array?u:new Uint8Array(u.buffer,u.byteOffset,u.byteLength);if(d.length>64*1024*1024)throw new Error("three.invalid: texture exceeds 64 MiB");let f=s.encoding,p=s.width||0,m=s.height||0;if(f===void 0){let _=String(s.mime||"").toLowerCase();e.isDataTexture||s.encoded===!1?f=0:d.length>=8&&d[0]===137&&d[1]===80&&d[2]===78&&d[3]===71?f=1:d.length>=2&&d[0]===255&&d[1]===216?f=2:_.includes("png")?f=1:_.includes("jpeg")||_.includes("jpg")?f=2:f=0}if(f===0){if(e.format!==je&&e.format!==wi&&P("textureFormat","R1 raw textures require RGBA8 or R8/UnsignedByteType"),e.type===zi){if(e.format!==je||!(u instanceof Uint16Array)||p*m*4!==u.length)throw new Error("three.invalid: half-float raw textures must be RGBA Uint16 data with matching dimensions");let _=new Uint8Array(p*m*4);for(let g=0;g<u.length;g++){let x=u[g],y=x>>10&31,v=x&1023,M;y===0?M=v/16777216:y===31?M=v||x&32768?0:1:(M=(1+v/1024)*Math.pow(2,y-15),x&32768&&(M=-M));let A=M<=0?0:M>=1?255:M*255+.5;_[g]=A}d=_}else e.type!==Zt&&P("textureFormat","R1 raw textures require RGBA8 or R8/UnsignedByteType");if(!p||!m)throw new Error("three.invalid: raw texture dimensions must be nonzero");if(e.format===wi){if(p*m!==d.length)throw new Error("three.invalid: R8 raw texture dimensions/data length");let _=new Uint8Array(p*m*4);for(let g=0;g<p*m;g++)_[g*4]=d[g],_[g*4+1]=d[g],_[g*4+2]=d[g],_[g*4+3]=255;d=_}else if(p*m*4!==d.byteLength)throw new Error("three.invalid: raw RGBA8 texture dimensions/data length")}else f!==1&&f!==2&&P("textureEncoding",f);if(f!==0&&d.length===0)throw new Error("three.invalid: encoded texture bytes must be nonempty");return t.push(Ad(a,h.version,p,m,f,Q_(e),d)),this._mapSet(this._state.textures,a,{signature:c,version:h.version,object:e}),this._frameTextures.set(a,a),a}_ensureCubeTexture(e,t){let i=e.image;if(Array.isArray(i)&&i.length===0)return 0;(!Array.isArray(i)||i.length!==6)&&P("textureType","R1 cube textures require exactly six faces");let r=Xe(e),n=this._frameTextures.get(r);if(n!==void 0)return n;this._listen(e,"textures",this._state.textures,r);let s=e0(e),a=this._nextVersion(this._state.textures,r,s);if(!a)return this._frameTextures.set(r,r),r;let l=i[0].width,c=i[0].height;if(!Number.isInteger(l)||!Number.isInteger(c)||l<=0||c<=0)throw new Error("three.invalid: cube face dimensions");let h=l*c*4,u=new Uint8Array(h*6);for(let f=0;f<6;f++){let p=i[f],m=p&&p.data;if(!m||p.width!==l||p.height!==c)throw new Error("three.invalid: cube faces must share raw RGBA8 dimensions");let _=m instanceof Uint8Array?m:new Uint8Array(m.buffer,m.byteOffset,m.byteLength);if(_.length!==h)throw new Error("three.invalid: cube face payload must be raw RGBA8");u.set(_,f*h)}let d=Q_(e)&-17|128;return t.push(Ad(r,a.version,l,c,0,d,u)),this._mapSet(this._state.textures,r,{signature:s,version:a.version,object:e}),this._frameTextures.set(r,r),r}_ensureMaterial(e,t){e._r1EnvFromScene?(e.envMap=this._sceneEnvironment||null,this._sceneEnvironment||(e._r1EnvFromScene=!1)):this._sceneEnvironment&&!e.envMap&&(e.isMeshBasicMaterial||e.isMeshLambertMaterial||e.isMeshPhongMaterial||e.isMeshStandardMaterial)&&(e.envMap=this._sceneEnvironment,e._r1EnvFromScene=!0);let i=e._r1NativeKind==="anaglyph"?11:ib(e);db(e);let r=Xe(e),n=this._frameMaterials.get(r);if(n!==void 0)return n;this._listen(e,"materials",this._state.materials,r);let s=this._ensureTexture(e.map||null,t),a=e._r1Anaglyph||null,l=i===11?this._ensureTexture(a.right,t):0,c=this._ensureTexture(e.alphaMap||null,t),h=this._ensureTexture(e.envMap||null,t,"envMap"),u=e.isMeshMatcapMaterial?this._ensureTexture(e.matcap||null,t,"matcap"):e.matcap?P("materialTexture",`${e.type}.matcap`):0,d=e.isMeshToonMaterial?this._ensureTexture(e.gradientMap||null,t,"gradientMap"):e.gradientMap?P("materialTexture",`${e.type}.gradientMap`):0,f=this._ensureTexture(e.normalMap||null,t,"map"),p=e.normalMap&&e.normalScale?e.normalScale.x:1,m=e.normalMap&&e.normalScale?e.normalScale.y:1,_=this._ensureTexture(e.bumpMap||null,t,"map"),g=e.bumpMap&&e.bumpScale!==void 0?e.bumpScale:1,x=this._ensureTexture(e.roughnessMap||null,t,"map"),y=this._ensureTexture(e.metalnessMap||null,t,"map"),v=e.isSpriteMaterial?e.rotation:0;if(v&&!Number.isFinite(v))throw new Error("three.invalid: material sprite rotation must be finite");let M=t0(e.map||null),A=t0(i===11?a.right:e.alphaMap||null),T=e.envMap&&e.envMapIntensity!==void 0?e.envMapIntensity:1;if(!Number.isFinite(T)||T<0)throw new Error("three.invalid: material envMapIntensity must be finite and nonnegative");let S=e.color||new L(16777215),b=e.opacity===void 0?1:e.opacity,C=e.roughness===void 0?0:e.roughness,I=e.metalness===void 0?0:e.metalness,B=e.alphaTest||0,N=e.size===void 0?1:e.size,k=i===5?e.specular:null,V=i===5?e.shininess:0,J=n0(e)?e.emissive:null,Q=J?e.emissiveIntensity:1;if(De(S.r,"material color"),De(S.g,"material color"),De(S.b,"material color"),!Number.isFinite(b)||b<0||b>1||!Number.isFinite(C)||C<0||C>1||!Number.isFinite(I)||I<0||I>1||!Number.isFinite(B)||B<0||B>1||!Number.isFinite(N)||N<=0)throw new Error("three.invalid: material scalar range");if(k&&(De(k.r,"material specular"),De(k.g,"material specular"),De(k.b,"material specular"),!Number.isFinite(V)||V<0))throw new Error("three.invalid: material shininess must be finite and nonnegative");if(J&&(De(J.r,"material emissive"),De(J.g,"material emissive"),De(J.b,"material emissive"),!Number.isFinite(Q)||Q<0))throw new Error("three.invalid: material emissiveIntensity must be finite and nonnegative");let Me=_b(e.side),he=(e.vertexColors?1:0)|(e.flatShading?2:0)|(e.transparent?4:0)|(e.depthTest?8:0)|(e.depthWrite?16:0)|(e.wireframe?32:0)|(e.sizeAttenuation===!1?64:0)|(e.blending||0)<<7,ue=this._resolveClipping(e,t),de=[i,s,e.map&&this._state.textures.get(Xe(e.map))?.version||0,he,Me,S.r,S.g,S.b,b,C,I,B,N,k?k.r:0,k?k.g:0,k?k.b:0,V,J?J.r:0,J?J.g:0,J?J.b:0,Q,e.version,ue.signature,ue.flags,c,h,T,M?M.join(","):"I",A?A.join(","):"I",u,d,v,f,p,m,_,g,x,y,l,a?a.left.join(","):"",a?a.rightMatrix.join(","):""].join("|"),Ie=this._nextVersion(this._state.materials,r,de);return Ie&&(t.push(k_(r,Ie.version,i,s,he,Me,S,b,C,I,B,N,k,V,J,Q,ue.id,ue.flags,{alphaMapId:c,envMapId:h,envMapIntensity:T,mapUvMatrix:M,alphaMapUvMatrix:A},{matcapId:u,gradientMapId:d,rotation:v},{normalMapId:f,normalScaleX:p,normalScaleY:m,bumpMapId:_,bumpScale:g,roughnessMapId:x,metalnessMapId:y},i===11?{rightId:l,left:a.left,right:a.rightMatrix}:null)),this._mapSet(this._state.materials,r,{signature:de,version:Ie.version,object:e})),this._frameMaterials.set(r,r),r}_resolveClipping(e,t){let i=this.localClippingEnabled&&Array.isArray(e.clippingPlanes)?e.clippingPlanes:null,r=[];if(this.clippingPlanes.length&&r.push(...this.clippingPlanes),i&&r.push(...i),!r.length)return{id:0,flags:0,signature:"none"};r.length>16&&P("clippingPlanes","R1 supports at most 16 clipping planes");let n=r.map(h=>{if(!h||h.isPlane!==!0)throw new Error("three.invalid: clipping planes must be THREE.Plane instances");let u=Math.hypot(h.normal.x,h.normal.y,h.normal.z);if(!Number.isFinite(u)||u<=0)throw new Error("three.invalid: clipping plane normal must be finite and nonzero");if(!Number.isFinite(h.constant))throw new Error("three.invalid: clipping plane constant must be finite");return{normalX:h.normal.x/u,normalY:h.normal.y/u,normalZ:h.normal.z/u,constant:h.constant/u}}),s=n.map(h=>`${h.normalX}:${h.normalY}:${h.normalZ}:${h.constant}`).join("|"),a=Xe(e),l=this._nextVersion(this._state.clippings,a,s);l&&(t.push(X_(a,l.version,n)),this._mapSet(this._state.clippings,a,{signature:s,version:l.version}));let c=(e.clipIntersection?1:0)|(e.clipShadows?2:0);return{id:a,flags:c,signature:s}}_geometrySignatureCached(e,t,i,r){let n=(this._geometrySignatureCache,null),s=this._geometrySignatureCache||(this._geometrySignatureCache=new Map);n=s.get(e);let a=e.drawRange||{start:0,count:1/0};if(n&&n.primitive===t&&n.mode===i&&n.wire===(r?1:0)&&n.rangeStart===a.start&&n.rangeCount===a.count){let u=!0,d=!1,f=_h;for(let p=0;p<f.length;p++){let m=e.attributes[f[p]],_=xn(m);if(_!==n.versions[p])if(m&&!gh(m)&&mh(m.array)===n.hashes[p])n.versions[p]=_,d=!0;else{u=!1;break}}if(u){let p=e.index,m=p?p.version:-1;m!==n.versions[4]&&(p&&!gh(p)&&mh(p.array)===n.hashes[4]?(n.versions[4]=m,d=!0):u=!1)}if(u)return n.sig}let l=[-1,-1,-1,-1,-1],c=[0,0,0,0,0];for(let u=0;u<_h.length;u++){let d=e.attributes[_h[u]];d&&(l[u]=xn(d),c[u]=gh(d)?0:mh(d.array))}e.index&&(l[4]=e.index.version,c[4]=gh(e.index)?0:mh(e.index.array));let h=`${jw(e,t,i)};wire:${r?1:0}`;return s.set(e,{primitive:t,mode:i,wire:r?1:0,rangeStart:a.start,rangeCount:a.count,versions:l,hashes:c,sig:h}),h}_uploadAttribute(e,t,i,r,n,s,a){let l=e.attributes||(e.attributes=[]),c=l[t];if(c&&c.attribute===i&&c.array===(i?i.array:null)&&c.version===xn(i)&&c.vertexCount===r&&c.components===n&&c.vertexOffset===a)return c.values;let h=Qw(i,r,n,s,a);return l[t]={attribute:i,array:i?i.array:null,version:xn(i),vertexCount:r,components:n,vertexOffset:a,values:h},h}_ensureGeometry(e,t,i,r,n=!1){(!e||!e.isBufferGeometry)&&P("geometry","only BufferGeometry is supported"),e.isInstancedBufferGeometry&&P("instancedGeometry"),e.index&&(!e.index.array||e.index.isGLBufferAttribute)&&P("rawGLAttribute","index");let s=e.attributes.position;if(!s)throw new Error("three.invalid: position attribute is required");let a=s.count;if(!Number.isInteger(a)||a<=0||a>4e6)throw new Error("three.invalid: vertexCount");let l=this._geometryResourceId(e,t,i),c=this._state.geometries.get(l),h=t===0&&(n||c&&c.hasWireIndices),u=La(e,a),d=!e.index&&!h&&i!=="line"&&u.count>0&&(u.start!==0||u.count!==a),f=d?u.start:0,p=d?u.count:a;if(d&&(t===0&&p%3!==0||t===1&&p%2!==0))throw new Error("three.invalid: primitive draw-range vertex count is not aligned");let m=this._frameGeometries.get(l);if(m&&(!n||m.hasWireIndices))return m;this._listen(e,"geometries",this._state.geometries,l),this._mapSet(this._geometryModes,l,{primitive:t,mode:i});let _=this._geometrySignatureCached(e,t,i,h),g=this._nextVersion(this._state.geometries,l,_);if(!g){let N=this._state.geometries.get(l),k={id:l,vertexCount:p,drawCount:N.drawCount,indexed:N.indexed,rangeStart:N.rangeStart,rangeCount:N.rangeCount,sourceCount:N.sourceCount,hasWireIndices:N.hasWireIndices,wireDrawCount:N.wireDrawCount};return this._frameGeometries.set(l,k),k}let x=this._geometryUploadCache||(this._geometryUploadCache=new Map),y=x.get(e);(!y||y.primitive!==t||y.mode!==i||y.rangeStart!==u.start||y.rangeCount!==u.count)&&(y={primitive:t,mode:i,rangeStart:u.start,rangeCount:u.count},x.set(e,y));let v=e.attributes.color,M={position:this._uploadAttribute(y,0,s,p,3,"position",f),normal:this._uploadAttribute(y,1,e.attributes.normal,p,3,"normal",f),uv:this._uploadAttribute(y,2,e.attributes.uv,p,2,"uv",f),color:v?this._uploadAttribute(y,3,v,p,v.itemSize,"color",f):null};if(v&&v.itemSize!==3&&v.itemSize!==4)throw new Error("three.invalid: color attribute must have 3 or 4 components");let A=e.index,T=null;d||(y.indices&&y.index===A&&y.indexArray===(A?A.array:null)&&y.indexVersion===xn(A)?T=y.indices:(T=eb(e,t,i,a),y.index=A,y.indexArray=A?A.array:null,y.indexVersion=xn(A),y.indices=T));let S=h?tb(e,a):null,b=T?T.length:0;if(b>12e6)throw new Error("three.invalid: indexCount");r.push(U_(l,g.version,t,p,M,T,S));let C=T?b:p,I={signature:_,version:g.version,object:e,drawCount:C,indexed:!!T,rangeStart:u.start,rangeCount:u.count,sourceCount:u.available,hasWireIndices:!!S,wireDrawCount:S?S.length:0};this._mapSet(this._state.geometries,l,I);let B={id:l,vertexCount:p,drawCount:C,indexed:I.indexed,rangeStart:u.start,rangeCount:u.count,sourceCount:u.available,hasWireIndices:I.hasWireIndices,wireDrawCount:I.wireDrawCount};return this._frameGeometries.set(l,B),B}_updateNode(e,t,i,r,n,s,a,l,c){let h=e.matrixWorld,u=e.castShadow===!0&&!e.isSprite,d=e.receiveShadow===!0&&!e.isSprite,f=this._state.nodes.get(t);f&&f.parentId===i&&f.geometryId===r&&f.materialId===n&&f.visible===s&&f.objectKind===a&&f.castShadow===u&&f.receiveShadow===d&&f.spriteCenterX===c.x&&f.spriteCenterY===c.y&&Cd(f.matrix,h)||(Di(h.elements,"matrixWorld"),De(c.x,"sprite center"),De(c.y,"sprite center"),l.push(V_(t,i,r,n,s,a,h,{cast:u,receive:d},c)),this._mapSet(this._state.nodes,t,{parentId:i,geometryId:r,materialId:n,visible:s,objectKind:a,castShadow:u,receiveShadow:d,matrix:h.elements.slice(),object:e,spriteCenterX:c.x,spriteCenterY:c.y}))}_removeBatch(e,t){this._mapDelete(this._state.batches,e)&&t.push(dh(e))}_instanceData(e,t){e.morphTexture&&P("morphTargets","instanced morph textures");let i=e.count;if(!Number.isInteger(i)||i<0||i>J_)throw new Error(`three.invalid: InstancedMesh.count must be within 0..${J_}`);let r=e.instanceMatrix;if(!r||!r.isInstancedBufferAttribute||r.isGLBufferAttribute||r.itemSize!==16)throw new Error("three.invalid: instanceMatrix must be a 16-component InstancedBufferAttribute");let n=r.array;if(!n||!ArrayBuffer.isView(n)||typeof n.length!="number")throw new Error("three.invalid: instanceMatrix array");if(!Number.isInteger(r.count)||r.count<0||i>r.count)throw new Error("three.invalid: InstancedMesh.count exceeds instanceMatrix capacity");let s=i*16;if(s>n.length)throw new Error("three.invalid: instanceMatrix payload is outside its array bounds");let a=null,l=0,c=null;if(e.instanceColor){if(c=e.instanceColor,!c||!c.isInstancedBufferAttribute||c.isGLBufferAttribute||c.itemSize!==3)throw new Error("three.invalid: instanceColor must be a 3-component InstancedBufferAttribute");if(!c.array||!ArrayBuffer.isView(c.array))throw new Error("three.invalid: instanceColor array");if(!Number.isInteger(c.count)||i>c.count)throw new Error("three.invalid: InstancedMesh.count exceeds instanceColor capacity");if(l=i*3,l>c.array.length)throw new Error("three.invalid: instanceColor payload is outside its array bounds");a=c.array}return{count:i,array:n,valueCount:s,colors:a,colorCount:l,signature:[r.version,Cr(r),Cr(n),r.count,a?`${c.version}:${Cr(a)}:${c.count}`:"nocolor"].join(":")}}_ensureBatchParts(e,t,i,r){if(e.isInstancedMesh&&!Array.isArray(e.material))return[{geometryId:t.id,materialId:this._ensureMaterial(i[0],r),offset:0,count:t.drawCount}];let n=e.geometry.groups;if((!n||n.length===0)&&P("multiMaterialGroups","material arrays require BufferGeometry.groups"),n.length>K_)throw new Error(`three.invalid: batch partCount exceeds ${K_}`);let s=t.rangeStart+t.rangeCount,a=[];for(let l of n){if(!l||!Number.isInteger(l.start)||l.start<0||!Number.isInteger(l.count)||l.count<0)throw new Error("three.invalid: geometry group start/count");if(!Number.isInteger(l.materialIndex)||l.materialIndex<0||l.materialIndex>=i.length)throw new Error("three.invalid: geometry group materialIndex");if(l.start>t.sourceCount||l.count>t.sourceCount-l.start)throw new Error("three.invalid: geometry group is outside geometry bounds");if(l.start%3!==0)throw new Error("three.invalid: triangle group start is not aligned");if(l.count%3!==0)throw new Error("three.invalid: triangle group count is not aligned");let c=l.start+l.count,h=Math.min(s,Math.max(t.rangeStart,l.start)),u=Math.min(s,Math.max(t.rangeStart,c)),d=Math.max(0,u-h);if(d%3!==0)throw new Error("three.invalid: clipped triangle group count is not aligned");let f=h-t.rangeStart;if(f>t.drawCount||d>t.drawCount-f)throw new Error("three.invalid: batch part is outside the uploaded geometry");a.push({geometryId:t.id,materialId:this._ensureMaterial(i[l.materialIndex],r),offset:f,count:d})}return a}_ensureBatch(e,t,i,r,n){let s=e.isInstancedMesh&&!Array.isArray(e.material),a=e.isInstancedMesh?this._instanceData(e,r):null,l=0,c=this._state.batches.get(t);if(s){l=this._ensureMaterial(r[0],n);let p=e.instanceMatrix,m=e.instanceColor||null,_=this._state.geometries.get(i.id),g=this._state.materials.get(l);if(c&&c.simpleInstanced&&c.object===e&&c.geometry===e.geometry&&c.geometryVersion===_.version&&c.material===r[0]&&c.materialVersion===g.version&&c.instanceMatrix===p&&c.instanceVersion===p.version&&c.instanceAttributeCount===p.count&&c.instanceArray===p.array&&c.instanceColor===m&&c.instanceColorVersion===(m?m.version:0)&&c.instanceColorArray===(m?m.array:null)&&c.instanceColorCapacity===(m?m.count:0)&&c.instanceCount===e.count&&c.parts.length===1&&c.parts[0].geometryId===i.id&&c.parts[0].materialId===l&&c.parts[0].offset===0&&c.parts[0].count===i.drawCount)return this._listen(e,"nodes",this._state.nodes,t),{primitive:0,parts:c.parts,instanceCount:e.count}}let h=s?[{geometryId:i.id,materialId:l,offset:0,count:i.drawCount}]:this._ensureBatchParts(e,i,r,n),u=h.map(p=>[p.geometryId,p.materialId,p.offset,p.count].join(":")).join("|"),d=`${a?`1:${a.count}:${a.signature}`:"0:1:-"};${u}`,f=this._nextVersion(this._state.batches,t,d);if(f){if(a){for(let m=0;m<a.valueCount;m++)De(a.array[m],"instanceMatrix");if(a.colors)for(let m=0;m<a.colorCount;m++)De(a.colors[m],"instanceColor")}let p=a?a.count:1;n.push(H_(t,f.version,p,a?a.colors?3:1:0,h,a?a.array:null,a?a.colors:null)),this._mapSet(this._state.batches,t,{signature:d,version:f.version,object:e,parts:h,simpleInstanced:s,geometry:e.geometry,geometryVersion:this._state.geometries.get(i.id).version,material:s?r[0]:null,materialVersion:s?this._state.materials.get(l).version:0,instanceMatrix:a?e.instanceMatrix:null,instanceVersion:a?e.instanceMatrix.version:0,instanceAttributeCount:a?e.instanceMatrix.count:0,instanceArray:a?a.array:null,instanceColor:a&&e.instanceColor||null,instanceColorVersion:a&&e.instanceColor?e.instanceColor.version:0,instanceColorArray:a&&e.instanceColor?e.instanceColor.array:null,instanceColorCapacity:a&&e.instanceColor?e.instanceColor.count:0,instanceCount:a?a.count:0})}return this._listen(e,"nodes",this._state.nodes,t),{primitive:0,parts:h,instanceCount:a?a.count:1}}_applyMorphTargets(e){let t=e.geometry,i=e.morphTargetInfluences;if(!t||!t.morphAttributes||!i||!i.length)return;let r=t.morphAttributes.position,n=t.morphAttributes.normal;if((!r||!r.length)&&(!n||!n.length))return;t._r1MorphBase||(t._r1MorphBase={position:t.attributes.position.array.slice(),normal:t.attributes.normal?t.attributes.normal.array.slice():null,key:""});let s=t._r1MorphBase,a=i.join(","),l=this._frameMorphKeys;if(l){let d=l.get(t);if(d||(d=new Set,l.set(t,d)),d.has(a))return;d.add(a)}if(s.key===a)return;s.key=a;let c=!!t.morphTargetsRelative,h=1;if(!c)for(let d=0;d<i.length;d++)h-=i[d];let u=(d,f,p)=>{let m=t.attributes[d];if(!m||!f||!f.length||!p)return;let _=m.array,g=_.length;for(let x=0;x<g;x++){let y=c?p[x]:p[x]*h;for(let v=0;v<f.length&&v<i.length;v++){let M=i[v];if(M===0)continue;let A=f[v].array;y+=M*A[x]}_[x]=y}m._r1DynamicContent=!0,m.version++};r&&r.length&&u("position",r,s.position),n&&n.length&&s.normal&&u("normal",n,s.normal)}_applySkining(e){let t=e.geometry,i=e.skeleton;if(!t||!i)return;i.update();let r=t.attributes.position;if(!r)return;t._r1SkinBase||(t._r1SkinBase={position:r.array.slice(),normal:t.attributes.normal?t.attributes.normal.array.slice():null});let n=t._r1SkinBase,s=i.bones.length,a=i.boneMatrices,l=t.attributes.skinIndex,c=t.attributes.skinWeight,h=t._r1MorphBase?t._r1MorphBase.key:"",u=e._r1SkinCache;(!u||u.boneMatrices.length!==s*16)&&(u={boneMatrices:new Float32Array(s*16),valid:!1},e._r1SkinCache=u);let d=u.valid&&u.geometry===t&&u.skinIndex===l&&u.skinIndexArray===l.array&&u.skinWeight===c&&u.skinWeightArray===c.array&&u.skinIndexVersion===l.version&&u.skinWeightVersion===c.version&&u.morphKey===h&&Cd(u.bindMatrix,e.bindMatrix)&&Cd(u.bindMatrixInverse,e.bindMatrixInverse);if(d){for(let b=0;b<a.length;b++)if(u.boneMatrices[b]!==a[b]){d=!1;break}}if(d)return;let f=b=>{let C=!!b.isInterleavedBufferAttribute,I=1;if(b.normalized){let B=b.array;B instanceof Uint8Array?I=1/255:B instanceof Uint16Array?I=1/65535:B instanceof Uint32Array?I=1/4294967295:B instanceof Int8Array?I=1/127:B instanceof Int16Array?I=1/32767:B instanceof Int32Array&&(I=1/2147483647)}return{array:b.array,stride:C?b.data.stride:b.itemSize,offset:C?b.offset:0,scale:I}},p=n.skin;if(!p||p.index!==l||p.weight!==c||p.indexArray!==l.array||p.weightArray!==c.array||p.indexVersion!==l.version||p.weightVersion!==c.version){let b=f(l),C=f(c),I=new Int32Array(r.count*4),B=new Float32Array(r.count*4);for(let N=0,k=0;N<r.count;N++,k+=4){let V=N*b.stride+b.offset,J=N*C.stride+C.offset;for(let Q=0;Q<4;Q++)I[k+Q]=b.array[V+Q]*16,B[k+Q]=C.array[J+Q]*C.scale}p={index:l,weight:c,indexArray:l.array,weightArray:c.array,indexVersion:l.version,weightVersion:c.version,indices:I,weights:B},n.skin=p}let m=p.indices,_=p.weights;(!this._r1SkinMatrices||this._r1SkinMatrices.length<s*16)&&(this._r1SkinMatrices=new Float32Array(s*16));let g=this._r1SkinMatrices,x=this._r1SkinTmpA||(this._r1SkinTmpA=new e.bindMatrix.constructor),y=this._r1SkinTmpB||(this._r1SkinTmpB=new e.bindMatrix.constructor);for(let b=0;b<s;b++)x.fromArray(i.boneMatrices,b*16),y.multiplyMatrices(e.bindMatrixInverse,x),x.multiplyMatrices(y,e.bindMatrix),g.set(x.elements,b*16);let v=n.position,M=r.array,A=t.attributes.normal,T=n.normal,S=A?A.array:null;for(let b=0,C=0,I=0;b<r.count;b++,C+=3,I+=4){let B=v[C],N=v[C+1],k=v[C+2],V=T?T[C]:0,J=T?T[C+1]:0,Q=T?T[C+2]:0,Me=0,he=0,ue=0,de=0,Ie=0,He=0;for(let Ke=0;Ke<4;Ke++){let lt=_[I+Ke];if(lt===0)continue;let we=m[I+Ke];Me+=lt*(g[we]*B+g[we+4]*N+g[we+8]*k+g[we+12]),he+=lt*(g[we+1]*B+g[we+5]*N+g[we+9]*k+g[we+13]),ue+=lt*(g[we+2]*B+g[we+6]*N+g[we+10]*k+g[we+14]),S&&(de+=lt*(g[we]*V+g[we+4]*J+g[we+8]*Q),Ie+=lt*(g[we+1]*V+g[we+5]*J+g[we+9]*Q),He+=lt*(g[we+2]*V+g[we+6]*J+g[we+10]*Q))}if(M[C]=Me,M[C+1]=he,M[C+2]=ue,S){let Ke=Math.sqrt(de*de+Ie*Ie+He*He)||1;S[C]=de/Ke,S[C+1]=Ie/Ke,S[C+2]=He/Ke}}r._r1DynamicContent=!0,r.version++,A&&(A._r1DynamicContent=!0,A.version++),u.geometry=t,u.skinIndex=l,u.skinIndexArray=l.array,u.skinWeight=c,u.skinWeightArray=c.array,u.skinIndexVersion=l.version,u.skinWeightVersion=c.version,u.morphKey=h,u.bindMatrix=e.bindMatrix.elements.slice(),u.bindMatrixInverse=e.bindMatrixInverse.elements.slice(),u.boneMatrices.set(a),u.valid=!0}_adaptLineDraw(e){let t=e.geometry,i=e.material;if(!t||!i||Array.isArray(i))return null;let r=e.isLineSegments2===!0,n=i.isLineDashedMaterial===!0||r&&i.dashed===!0;if(!r&&!n)return null;let s=t.attributes,a=r?["fat",at(s.instanceStart),at(s.instanceEnd),at(s.instanceColorStart),at(s.instanceColorEnd),i.color?`${i.color.r}:${i.color.g}:${i.color.b}`:"-",i.vertexColors,i.dashed,i.dashScale,i.dashSize,i.gapSize,i.opacity,i.transparent,i.version].join("|"):["dash",at(s.position),at(s.color),at(t.index),at(s.lineDistance),t.drawRange.start,t.drawRange.count,i.scale,i.dashSize,i.gapSize,i.color?`${i.color.r}:${i.color.g}:${i.color.b}`:"-",i.opacity,i.transparent,i.version].join("|"),l=this._adaptedLineDraws.get(e);if(l&&l.source===t&&l.sourceMaterial===i&&l.signature===a)return{geometry:l.geometry,material:l.material,lineSegments:r||e.isLineSegments};let c,h;if(r){if(c=pb(t),!c)return null;let u=!!c.attributes.color&&i.vertexColors!==!1;h=Id(i,u),i.dashed===!0&&(c=r0(c,!0,{scale:i.dashScale===void 0?1:i.dashScale,dashSize:i.dashSize===void 0?1:i.dashSize,gapSize:i.gapSize===void 0?1:i.gapSize})),Ra(i,"_r1FatLineWarned","R1 lowers Line2/LineSegments2 to native line segments; linewidth and alphaToCoverage are dropped.")}else c=r0(t,!!e.isLineSegments,i),h=Id(i,!!t.attributes.color);return l&&(l.geometry!==c&&l.geometry!==t&&l.geometry.dispose(),l.material!==h&&l.material.dispose()),this._adaptedLineDraws.set(e,{source:t,sourceMaterial:i,signature:a,geometry:c,material:h}),{geometry:c,material:h,lineSegments:r||e.isLineSegments}}_adaptShaderDraw(e){let t=e.geometry,i=e.material;if(!t||!i||Array.isArray(i)||!(i.isShaderMaterial||i.isRawShaderMaterial))return null;let r=t.attributes,n=i.uniforms||{},s=null;if(!r.position&&i.isRawShaderMaterial&&String(i.vertexShader).includes("pseudoRandomVec3")&&String(i.vertexShader).includes("gl_VertexID")?s="procedural":e.isLineSegments&&r.position&&r.vertColor&&r.visible&&String(i.fragmentShader).includes("vVisible")?s="selective":e.isPoints&&r.position&&(r.customColor||r.size||r.scale)?s="points":e.isMesh&&r.position&&r.normal&&r.customColor&&r.displacement&&n.amplitude&&String(i.vertexShader).includes("amplitude")&&(s="tessellation"),!s){let m=lb(i),_=this._adaptedShaderDraws.get(e);if(_&&_.kind==="bounded"&&_.source===t&&_.sourceMaterial===i&&_.signature===m)return{geometry:_.geometry,material:_.material};let g=ub(e);return g?(_&&_.kind==="bounded"&&(_.geometry!==t&&_.geometry.dispose(),_.material.dispose()),this._adaptedShaderDraws.set(e,{kind:"bounded",source:t,sourceMaterial:i,signature:m,material:g.material,geometry:g.geometry}),g):null}let a=s==="tessellation"?Number(n.amplitude.value):0,l=s==="points"&&(r.size||r.scale)||null,c=1;if(l){let m=0;for(let _=0;_<l.count;_++){let g=l.getComponent(_,0);De(g,"point size attribute"),m+=g}c=l.count?m/l.count:1,c>0||(c=.001)}let h=n.color&&n.color.value,u=[s,at(r.position),at(r.normal),at(r.color),at(r.customColor),at(r.vertColor),at(r.visible),at(r.displacement),at(l),at(t.index),t.drawRange.start,t.drawRange.count,a,c,i.version,i.opacity,i.transparent,h&&h.isColor?`${h.r}:${h.g}:${h.b}`:"-",n.pointTexture&&n.pointTexture.value?Xe(n.pointTexture.value):0,n.alphaTest?n.alphaTest.value:0].join("|"),d=this._adaptedShaderDraws.get(e);if(d&&d.source===t&&d.sourceMaterial===i&&d.signature===u)return{geometry:d.geometry,material:d.material,lineSegments:s==="selective"?!0:void 0};let f,p;if(s==="procedural")f=fb(t),p=new _e({vertexColors:!0,side:i.side,fog:i.fog}),Ra(i,"_r1ProceduralWarned","R1 evaluates the bounded gl_VertexID procedural shader into native position/color attributes.");else if(s==="selective")f=mb(t),p=Id(i,!0),Ra(i,"_r1SelectiveWarned","R1 lowers the selective-draw visibility shader to filtered native line segments.");else if(s==="points"){r.customColor?(f=new D,f.setAttribute("position",r.position),f.setAttribute("color",r.customColor),f.setDrawRange(t.drawRange.start,t.drawRange.count),f.boundingSphere=t.boundingSphere):f=t;let m=n.pointTexture&&n.pointTexture.value,_=n.alphaTest?Number(n.alphaTest.value):0;!m&&String(i.fragmentShader).includes("gl_PointCoord")&&(m=gb(),_||(_=.5)),p=new $t({color:h&&h.isColor?h:new L(16777215),size:c,sizeAttenuation:!0,map:m||null,alphaTest:_,vertexColors:!!(r.customColor||r.color),transparent:!!i.transparent,opacity:i.opacity,depthTest:i.depthTest,depthWrite:i.depthWrite,blending:i.blending,fog:i.fog}),Ra(i,"_r1PointShaderWarned","R1 lowers the bounded point shader; per-point sizes are represented by their current mean.")}else{let m=r.position.count;!d||d.kind!==s||d.geometry.attributes.position.count!==m?(f=new D,f.setAttribute("position",new R(new Float32Array(m*3),3)),f.setAttribute("normal",r.normal),f.setAttribute("color",new R(new Float32Array(m*3),3)),f.setDrawRange(t.drawRange.start,t.drawRange.count)):f=d.geometry;let _=f.attributes.position,g=f.attributes.color;for(let x=0;x<m;x++){let y=r.normal.getComponent(x,0),v=r.normal.getComponent(x,1),M=r.normal.getComponent(x,2),A=r.displacement.getComponent(x,0)*a;for(let S=0;S<3;S++){let b=S===0?y:S===1?v:M;_.array[x*3+S]=r.position.getComponent(x,S)+b*A}let T=.4+Math.max(0,(y+v+M)/Math.sqrt(3));for(let S=0;S<3;S++)g.array[x*3+S]=r.customColor.getComponent(x,S)*T}_._r1DynamicContent=!0,g._r1DynamicContent=!0,_.needsUpdate=!0,g.needsUpdate=!0,f.computeBoundingSphere(),p=d&&d.kind===s?d.material:new _e({vertexColors:!0,side:i.side,fog:i.fog}),Ra(i,"_r1TessellationWarned","R1 evaluates the tessellation displacement shader on the CPU and bakes its bounded directional color.")}return d&&(d.geometry!==f&&d.geometry!==t&&d.geometry.dispose(),d.material!==p&&d.material.dispose()),this._adaptedShaderDraws.set(e,{kind:s,source:t,sourceMaterial:i,signature:u,geometry:f,material:p}),{geometry:f,material:p,lineSegments:s==="selective"?!0:void 0}}_adaptDrawable(e){return this._adaptLineDraw(e)||this._adaptShaderDraw(e)}_ensureNode(e,t,i,r){let n=Xe(e),s=!e.material||e.material.visible!==!1,a=!!e.visible&&s,l=!!e.isInstancedMesh||!!(e.isMesh&&Array.isArray(e.material)),c=e.isSprite?e.center||{x:.5,y:.5}:{x:.5,y:.5};if((!r||!s)&&!e.isLight&&!e.isCamera){let m=this._objectKind(e);return l||this._removeBatch(n,i),this._updateNode(e,n,t,0,0,a,m,i,c),{id:n,draw:null}}if(e.isInstancedMesh&&e.count===0){if(e.userData&&e.userData.jsrRetainEmptyBatch){let m=Array.isArray(e.material)?e.material:[e.material];m.some(g=>g.wireframe)&&P("wireframeBatch","R1 wireframe requires a single-material non-instanced Mesh");let _=this._ensureGeometry(e.geometry,0,"triangles",i);this._ensureBatch(e,n,_,m,i)}else this._removeBatch(n,i);return this._updateNode(e,n,t,0,0,a,1,i,c),{id:n,draw:null}}let h=0,u=0,d=0,f=null,p=null;if(e.isSprite){Array.isArray(e.material)&&P("multiMaterial","R1 sprites take a single material");let m=e.material;(!m||!m.isSpriteMaterial)&&P("material","R1 sprites require a SpriteMaterial");let _=this._ensureGeometry(e.geometry,0,"triangles",i);h=_.id,u=this._ensureMaterial(m,i),d=4,f={primitive:0,count:_.drawCount}}else if(e.isMesh||e.isLine||e.isLineSegments||e.isPoints){let m=e.geometry,_=m&&m.attributes.position;if(_&&La(m,_.count).count===0)return l||this._removeBatch(n,i),this._updateNode(e,n,t,0,0,a,this._objectKind(e),i,c),{id:n,draw:null};this._applyMorphTargets(e),e.isSkinnedMesh&&this._applySkining(e),(e.isBatchedMesh||e.isSprite)&&P("objectType",e.type),e.isLineLoop&&P("LineLoop");let g=this._adaptDrawable(e),x=g?g.material:e.material,y=g?g.geometry:e.geometry;if(x._r1ProceduralTime&&hb(y,x._r1ProceduralTime.value),g){let b=y.attributes.position;if(!b||La(y,b.count).count===0)return l||this._removeBatch(n,i),this._updateNode(e,n,t,0,0,a,this._objectKind(e),i,c),{id:n,draw:null}}if(!x||Array.isArray(x)&&x.length===0)throw new Error("three.invalid: drawable has no material");let v=0,M="triangles";d=1,g&&g.lineSegments!==void 0?(v=1,M=g.lineSegments?"lines":"line",d=2):e.isPoints?(v=2,M="points",d=3):(e.isLine||e.isLineSegments)&&(v=1,M=e.isLineSegments?"lines":"line",d=2),Array.isArray(x)&&v!==0&&P("multiMaterial","R1 material arrays require triangle meshes");let A=Array.isArray(x)?x:[x],T=v===0&&A.some(b=>b.wireframe);l&&T&&P("wireframeBatch","R1 wireframe requires a single-material non-instanced Mesh");let S=this._ensureGeometry(y,v,M,i,T);l?p={geometry:S,materials:A}:(h=S.id,u=this._ensureMaterial(x,i),f={primitive:T?1:v,count:T?S.wireDrawCount:S.drawCount})}else{if(e.isLight||e.isCamera)return null;(e.isInstancedMesh||e.isBatchedMesh)&&P("objectType",e.type)}return l||this._removeBatch(n,i),this._updateNode(e,n,t,h,u,a,d,i,c),p&&(f=this._ensureBatch(e,n,p.geometry,p.materials,i)),{id:n,draw:f}}_objectKind(e){return e.isMesh?1:e.isSprite?4:e.isPoints?3:e.isLine||e.isLineSegments?2:0}_ensureLight(e,t){let i;e.isAmbientLight?i=0:e.isDirectionalLight?i=1:e.isPointLight?i=2:e.isHemisphereLight?i=3:e.isSpotLight?i=4:e.type==="SunLight"?i=1:P("light",e.type);let r=Xe(e);e.getWorldPosition(Je),_i.set(0,0,0),e.type==="SunLight"?(bo.set(0,0,0),_i.copy(Je).sub(bo).normalize()):e.isDirectionalLight||e.isSpotLight?(e.target.updateMatrixWorld(!0),bo.setFromMatrixPosition(e.target.matrixWorld),_i.copy(Je).sub(bo).normalize()):e.isHemisphereLight&&_i.copy(Je).normalize();let n=e.isHemisphereLight?e.groundColor:null,s=e.isSpotLight?{angle:e.angle,penumbra:e.penumbra,distance:e.distance,decay:e.decay}:null,a=[i,e.color.r,e.color.g,e.color.b,e.intensity,Je.x,Je.y,Je.z,_i.x,_i.y,_i.z,n?n.r:0,n?n.g:0,n?n.b:0,s?s.angle:0,s?s.penumbra:0,s?s.distance:0,s?s.decay:0].join("|"),l=this._state.lights.get(r);if(!l||l.signature!==a){if(!Number.isFinite(e.intensity)||e.intensity<0)throw new Error("three.invalid: light intensity");Di([e.color.r,e.color.g,e.color.b,Je.x,Je.y,Je.z,_i.x,_i.y,_i.z],"light"),n&&Di([n.r,n.g,n.b],"light groundColor"),t.push(q_(r,i,e.color,e.intensity,Je,_i,n,s)),this._mapSet(this._state.lights,r,{signature:a,object:e})}return r}_ensureCamera(e,t){(!e||!e.isPerspectiveCamera&&!e.isOrthographicCamera)&&P("camera","R1 supports perspective and orthographic cameras");let i=Xe(e);Di(e.matrixWorld.elements,"camera matrixWorld"),Di(e.matrixWorldInverse.elements,"camera matrixWorldInverse"),Di(e.projectionMatrix.elements,"camera projectionMatrix");let r=[e.isPerspectiveCamera?0:1,Td(e.matrixWorldInverse),Td(e.projectionMatrix),Td(e.matrixWorld)].join("|"),n=this._state.cameras.get(i);return(!n||n.signature!==r)&&(t.push(W_(i,e.isPerspectiveCamera?0:1,e.matrixWorldInverse,e.projectionMatrix,e.matrixWorld)),this._mapSet(this._state.cameras,i,{signature:r,object:e})),i}_background(e){let t=e.background;return t==null?{r:this._clearColor.r,g:this._clearColor.g,b:this._clearColor.b,a:this._clearAlpha}:t.isTexture?{r:0,g:0,b:0,a:1}:(t.isColor||P("backgroundTexture","R1 accepts a Color, Texture or null background"),{r:t.r,g:t.g,b:t.b,a:1})}_ensureBackgroundNode(e,t,i,r){let n=e.background;if(!n||!n.isTexture||!(n.isCubeTexture?Array.isArray(n.image)&&n.image.length===6&&n.image.every(c=>c&&c.data):!!(n.image&&n.image.data)))return;if(!this._backgroundMesh){let c=new _e({side:yi,depthWrite:!1,fog:!1});c._r1Background=!0;let h=new Ci(2,2,2);h.clearGroups(),this._backgroundMesh=new ae(h,c),this._backgroundMesh.frustumCulled=!1}let a=this._backgroundMesh;a.material.envMap=n,t.getWorldPosition(Je),a.position.copy(Je),a.scale.setScalar(Math.max(.001,(t.near||.1)*2)),a.updateMatrixWorld(!0);let l=this._ensureNode(a,Xe(e),i,!0);l&&r.add(l.id)}_fog(e){let t=e.fog;if(t==null)return{mode:0,color:{r:0,g:0,b:0},near:0,far:0,density:0};if(t.isFogExp2){if(Di([t.color.r,t.color.g,t.color.b,t.density],"fog"),t.density<0)throw new Error("three.invalid: FogExp2 density must be nonnegative");return{mode:2,color:t.color,near:0,far:0,density:t.density}}if(t.isFog||P("fogType","R1 supports linear Fog and FogExp2"),Di([t.color.r,t.color.g,t.color.b,t.near,t.far],"fog"),t.near<0||t.far<=t.near)throw new Error("three.invalid: fog requires 0 <= near < far");return{mode:1,color:t.color,near:t.near,far:t.far,density:0}}_shadow(e,t,i){if(!this.shadowMap.enabled)return _n;if(!t||!t.shadow||!t.shadow.camera||!t.shadow.mapSize)return _n;let r=t.shadow,n=Math.floor(r.mapSize.x),s=Math.floor(r.mapSize.y);if(t.isPointLight)return this._pointShadow(t,r,n,s);if(t.isSunLight){r.updateMatrices(t,i),t._r1SunShadowWarned||(t._r1SunShadowWarned=!0,console.warn("three: R1 uses the first SunLight shadow cascade (second cascade dropped)."));let a=r.getCamera(0),l=r._r1SingleMatrix||(r._r1SingleMatrix=new z),c=r._r1SingleFrustum||(r._r1SingleFrustum=new It);return r._updateMatrix(a,l,c),this._directionalShadowMetadata(r,n,s,l,a)}return t.target.updateMatrixWorld(!0),r.camera.updateProjectionMatrix(),r.updateMatrices(t),this._directionalShadowMetadata(r,n,s)}_shadowContentRevision(e){return e?this._manualShadowRevision:(this._shadowContentChanged&&(this._autoShadowRevision=this._autoShadowRevision+1>>>0,this._autoShadowRevision===0&&(this._autoShadowRevision=1)),this._autoShadowRevision)}_directionalShadowMetadata(e,t,i,r=e.matrix,n=e.camera){let s=this.shadowMap.autoUpdate===!1;s&&this.shadowMap.needsUpdate===!0&&(this._manualShadowRevision=this._manualShadowRevision+1>>>0,this._manualShadowRevision===0&&(this._manualShadowRevision=1),this.shadowMap.needsUpdate=!1);let a=!0;if(s){let l=this._manualShadowRevision+"|"+t+"|"+i+"|"+e.bias+"|"+e.normalBias+"|"+r.elements.join(",");a=l!==this._shadowCullingKey,this._shadowCullingKey=l}return{width:t,height:i,bias:e.bias,normalBias:e.normalBias,radius:e.radius,matrix:r,camera:n,contentRevision:this._shadowContentRevision(s),refreshCulling:a}}_pointShadow(e,t,i,r){let n=this.shadowMap.autoUpdate===!1;n&&this.shadowMap.needsUpdate===!0&&(this._manualShadowRevision=this._manualShadowRevision+1>>>0,this._manualShadowRevision===0&&(this._manualShadowRevision=1),this.shadowMap.needsUpdate=!1),e.getWorldPosition(Je);let s=e.distance||t.camera.far,a=new z;if(a.lookAt(Je,Zw,Jw),bo.copy(Je).negate().applyMatrix4(a),a.setPosition(bo),!Number.isFinite(s)||s<=0)throw new Error("three.invalid: point shadow far must be positive");return Di(a.elements,"point shadow view"),{width:i,height:r,bias:t.bias,normalBias:t.normalBias,radius:t.radius,matrix:a,camera:null,contentRevision:this._shadowContentRevision(n),refreshCulling:!1,pointShadow:{active:1,x:Je.x,y:Je.y,z:Je.z,far:s}}}_emit(e){let t=this.domElement,i=this._state.sequence+1,r=O_(e,t.engineId,t.surfaceId,i);this.runtime.sendR1(r),this._state.sequence=i}_frameTargetSpec(e){let t=this._renderTarget,i=t?this._ensureRenderTarget(t,e):0,r=t?t.viewport:this._viewport,n=t?t.scissor:this._scissor,s=this._rectangle(r.x,r.y,r.z,r.w),a=this._rectangle(n.x,n.y,n.z,n.w),l=t?t.scissorTest:this._scissorTest,c=wo.viewport|(l?wo.scissor:0)|this._clearFlags;return this.autoClear&&this.autoClearColor&&(c|=wo.clearColor),this.autoClear&&this.autoClearDepth&&(c|=wo.clearDepth),{targetId:i,width:t?t.width:0,height:t?t.height:0,viewport:s,scissor:a,flags:c}}render(e,t){let i=this._pendingDisposals.slice(),r=this._state.sequence;this._transaction=new Map,this._transactionListens=[];try{let n=this._render(e,t);return this._transaction=null,this._transactionListens=null,this.domElement._r1State=this._state,n}catch(n){let s=this._transaction,a=this._transactionListens;this._transaction=null,this._transactionListens=null;for(let l of a)this._unlisten(l);for(let[l,c]of s)for(let[h,u]of c)u[0]?l.set(h,u[1]):l.delete(h);throw this._state.sequence=r,this._pendingDisposals=i,n}}_render(e,t){if(this._disposed)throw new Error("three.surface: renderer is disposed");if(this.domElement.disposed)throw new Error("three.surface: canvas is disposed");if(!e||!e.isObject3D)throw new Error("three.invalid: render requires an Object3D");if(this.outputColorSpace!==ve&&P("outputColorSpace","native R1 requires SRGBColorSpace"),qw.has(this.toneMapping)||P("toneMapping",`${this.toneMapping} is not an upstream tone mapping constant`),this.xr.enabled&&P("xr"),e.overrideMaterial&&P("sceneFeature","overrideMaterial is outside R1 v1"),this._sceneEnvironment=e.environment&&e.environment.isTexture?e.environment:null,!Array.isArray(this.clippingPlanes))throw new Error("three.invalid: renderer.clippingPlanes must be an array");this.clippingPlanes.length>16&&P("clippingPlanes","R1 supports at most 16 clipping planes"),(!t||!t.isPerspectiveCamera&&!t.isOrthographicCamera)&&P("camera","R1 supports perspective and orthographic cameras"),e.matrixWorldAutoUpdate===!0&&e.updateMatrixWorld(),t.parent===null&&t.matrixWorldAutoUpdate===!0&&t.updateMatrixWorld(),t.matrixWorldInverse.copy(t.matrixWorld).invert(),this._frameGeometries=new Map,this._frameMaterials=new Map,this._frameTextures=new Map,this._frameMorphKeys=new Map;let i=[],r=this._pendingDisposals.splice(0);for(let b of r)b.batch&&i.push(dh(b.id)),i.push(Ia(b.id,b.kind));let n=new Set,s=new Set,a=Xe(e),l=null,c=[],h=new Map,u=new Map,d=0,f=0,p=0,m=0,_=[],g=[];this._ensureBackgroundNode(e,t,i,n),ph.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),fh.setFromProjectionMatrix(ph),e.traverseVisible(b=>{b.isLOD&&b.update(t);let I=(b.parent?u.get(b.parent)??!0:!0)&&!!b.visible&&(!b.material||b.material.visible!==!1);if(u.set(b,I),b.isLight){if(b.visible){let k=this._ensureLight(b,i);s.add(k);let V=this._state.lights.get(k);V&&(V.sceneId=a)}!l&&b.visible&&b.castShadow&&(b.isDirectionalLight||b.isSpotLight||b.isPointLight||b.isSunLight)&&(l=b),h.set(b,h.get(b.parent)||0);return}if(b.isCamera){h.set(b,h.get(b.parent)||0);return}let B=h.get(b.parent)||0;if(!I){h.set(b,B);return}let N=this._ensureNode(b,B,i,I);if(N){n.add(N.id);let k=this._state.nodes.get(N.id);k&&(k.sceneId=a),h.set(b,N.id),N.draw&&b.castShadow&&!b.isSprite&&g.push(b);let V=N.draw&&b.frustumCulled&&!fh.intersectsObject(b);if(V&&_.push(N.id),!V&&N.draw&&N.draw.parts){if(N.draw.instanceCount>0)for(let J of N.draw.parts)J.count!==0&&(d++,f+=J.count/3*N.draw.instanceCount)}else!V&&N.draw&&(d++,N.draw.primitive===0?f+=N.draw.count/3:N.draw.primitive===1?p+=N.draw.count/2:m+=N.draw.count)}else h.set(b,B)});for(let[b,C]of this._state.nodes)!n.has(b)&&C.sceneId===a&&(this._removeBatch(b,i),i.push(G_(b)),this._mapDelete(this._state.nodes,b),c.push(C.object));for(let[b]of this._state.lights)!s.has(b)&&this._state.lights.get(b)?.sceneId===a&&(i.push(Ia(b,ri.light)),this._mapDelete(this._state.lights,b));let x=this._ensureCamera(t,i),y=this._background(e),v=this._fog(e);this._shadowContentChanged=!1;for(let b of i)if(b.opcode!==xt.CAMERA){this._shadowContentChanged=!0;break}let M=this._shadow(e,l,t),A=M.camera&&M.refreshCulling===!1?this._cachedCulledShadowNodeIds:[];if(M.camera&&M.refreshCulling!==!1){ph.multiplyMatrices(M.camera.projectionMatrix,M.camera.matrixWorldInverse),fh.setFromProjectionMatrix(ph);for(let b of g)b.frustumCulled&&!fh.intersectsObject(b)&&A.push(Xe(b));this._cachedCulledShadowNodeIds=A}if(!Number.isFinite(this.toneMappingExposure)||this.toneMappingExposure<=0)throw new Error("three.invalid: exposure must be positive finite");Di([y.r,y.g,y.b,y.a],"background");let T=M===_n||!l?0:l.isSpotLight?2:l.isPointLight?3:1,S=l&&l.isPointLight&&M!==_n&&M.pointShadow?M.pointShadow:null;if(l&&l.isPointLight&&M!==_n&&!S)throw new Error("three.invalid: point light shadow matrix is required");i.push(Y_(Xe(e),x,y,this.toneMappingExposure,v,M,_,A,T,this.toneMapping,S,this._frameTargetSpec(i))),this._emit(i),this._clearFlags=0,this._lastScene=e,this._lastCamera=t;for(let b of c)this._unlisten(b);this.info.render.frame++,this.info.render.calls=d,this.info.render.triangles=f,this.info.render.lines=p,this.info.render.points=m,this.info.memory.geometries=this._state.geometries.size,this.info.memory.textures=this._state.textures.size}dispose(){if(this._disposed)return;this._disposed=!0,this.setAnimationLoop(null),this._canvasRefreshHandle=null;for(let r of Array.from(this._canvasTextures.keys()))this._unwatchCanvasTexture(r);this._lastScene=null,this._lastCamera=null;let e=[],t=new Set,i=(r,n)=>{let s=`${n}:${r}`;t.has(s)||(t.add(s),e.push(Ia(r,n)))};for(let[r]of this._state.batches)e.push(dh(r));for(let[r]of this._state.geometries)i(r,ri.geometry);for(let[r]of this._state.textures)i(r,ri.texture);for(let[r]of this._state.renderTargets)i(r,ri.renderTarget);for(let[r]of this._state.materials)i(r,ri.material);for(let[r]of this._state.nodes)i(r,ri.node);for(let[r]of this._state.lights)i(r,ri.light);for(let[r]of this._state.cameras)i(r,ri.camera);e.push(Z_());try{this._emit(e)}finally{this._unlistenAll(),this._state.geometries.clear(),this._state.textures.clear(),this._state.materials.clear(),this._state.nodes.clear(),this._state.batches.clear(),this._state.lights.clear(),this._state.cameras.clear(),this._state.renderTargets.clear();for(let[r,n]of this._renderTargets){let s=this._renderTargetDisposers.get(r);n.target.removeEventListener("dispose",s),n.target.texture.removeEventListener("dispose",s)}this._renderTargetDisposers.clear(),this._renderTargets.clear(),this.domElement.dispose(),this.domElement.renderer===this&&(this.domElement.renderer=null)}}};function s0(o){return ch(o)}function xb(o){return o.buffer.slice(o.byteOffset,o.byteOffset+o.byteLength)}var ji=class extends ce{constructor(e){super(e),this.mimeType="",this.responseType="",this._aborted=!1,this.canvas=null}setCanvas(e){return this.canvas=e,this}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._aborted=!0,this}load(e,t,i,r){e===void 0&&(e=""),e=this.path+e,e=this.manager.resolveURL(e);let n=vo(!1),s=this.canvas||n.getCanvas("main"),a=s?{canvas:s,generation:s.generation,epoch:s._assetEpoch}:null,l=nt.get(`file:${e}`),c=(d,f)=>{if(this._aborted)throw ot(e,"request aborted");if(s&&(s.disposed||s.generation!==a.generation))throw ot(e,"surface was disposed during file load");f&&f(d)},h=d=>{let f=d.bytes||Tr(d.data);switch(this.responseType){case"arraybuffer":return xb(f);case"json":return JSON.parse(s0(f));case"blob":return typeof Blob<"u"?new Blob([f],{type:d.mime||this.mimeType}):f;case"document":P("DOMParser","native FileLoader cannot parse XML/HTML documents");default:return s0(f)}},u=d=>{r?r(d):typeof console<"u"&&console.error&&console.error(d)};if(l!==void 0){this.manager.itemStart(e),Promise.resolve().then(()=>c(l,t)).catch(u).finally(()=>this.manager.itemEnd(e));return}this.manager.itemStart(e),n.loadAsset(e,a).then(d=>{let f=h(d);nt.add(`file:${e}`,f),c(f,t)}).catch(d=>{u(d),this.manager.itemError(e)}).finally(()=>this.manager.itemEnd(e))}};function yb(o){let e=o.bytes,t=String(o.mime||"").toLowerCase();if(t.includes("rgba")||t.includes("raw"))return{encoding:0,encoded:!1};if(e.length>=8&&e[0]===137&&e[1]===80&&e[2]===78&&e[3]===71)return{encoding:1,encoded:!0};if(e.length>=2&&e[0]===255&&e[1]===216)return{encoding:2,encoded:!0};if(t.includes("png"))return{encoding:1,encoded:!0};if(t.includes("jpeg")||t.includes("jpg"))return{encoding:2,encoded:!0};throw ot(o.url||"<texture>","only PNG, JPEG, or registered raw RGBA8 bytes are supported")}function vb(o,e){let t=o._r1Pixels,i=0,r=0,n=t.width,s=t.height,a,l,c,h;e.length===2?(a=e[0],l=e[1],c=n,h=s):e.length===4?(a=e[0],l=e[1],c=e[2],h=e[3]):e.length===8?(i=e[0],r=e[1],n=e[2],s=e[3],a=e[4],l=e[5],c=e[6],h=e[7]):P("canvas2d.drawImage","expected 2, 4, or 8 numeric arguments after the image");let u=[i,r,n,s,a,l,c,h];for(let _ of u)if(!Number.isFinite(_))throw new Error("three.invalid: canvas2d drawImage coordinates");(n<=0||s<=0||c<=0||h<=0||i<0||r<0||i+n>t.width||r+s>t.height)&&P("canvas2d.drawImage","raw image crop is outside its source or has a non-positive size");let d=Math.floor(c),f=Math.floor(h);if(d<=0||f<=0||d*f>16777216)throw new Error("three.invalid: canvas2d drawImage output quota");let p=new Uint8ClampedArray(d*f*4),m=t.data;if(i===Math.floor(i)&&r===Math.floor(r)&&n===d&&s===f){let _=d*4,g=Math.floor(i),x=Math.floor(r);for(let y=0;y<f;y++){let v=((x+y)*t.width+g)*4;p.set(m.subarray(v,v+_),y*_)}}else for(let _=0;_<f;_++){let g=Math.min(t.height-1,Math.floor(r+(_+.5)*s/h));for(let x=0;x<d;x++){let y=Math.min(t.width-1,Math.floor(i+(x+.5)*n/c)),v=(g*t.width+y)*4,M=(_*d+x)*4;p[M]=m[v],p[M+1]=m[v+1],p[M+2]=m[v+2],p[M+3]=m[v+3]}}return{image:{data:p,width:d,height:f},x:a,y:l}}function wb(){let o=globalThis.document;if(!o||o._r1RawImageDrawImage||typeof o.createElement!="function")return;let e=o.createElement;o.createElement=function(t,...i){let r=e.call(this,t,...i);if(String(t).toLowerCase()!=="canvas"||!r||r._r1RawImageCanvas)return r;let n=r.getContext;return typeof n!="function"||(r._r1RawImageCanvas=!0,r.getContext=function(s){let a=n.call(this,s);if(s!=="2d"||!a||a._r1RawImageContext)return a;let l=a.drawImage;return a._r1RawImageContext=!0,a.drawImage=function(c,...h){if(!c||!c._r1Pixels){if(typeof l=="function")return l.apply(this,[c,...h]);P("canvas2d.drawImage")}let u=vb(c,h);typeof this.putImageData!="function"&&P("canvas2d.drawImage","raw RGBA target required"),this.putImageData(u.image,u.x,u.y)},a}),r},o._r1RawImageDrawImage=!0}var So=class o extends ce{constructor(e){super(e),this.canvas=null}setCanvas(e){return this.canvas=e,this}load(e,t,i,r){wb();let n=new Map,s={complete:!1,width:0,height:0,data:null,addEventListener(f,p){let m=n.get(f)||[];m.includes(p)||m.push(p),n.set(f,m)},removeEventListener(f,p){let m=n.get(f);m&&n.set(f,m.filter(_=>_!==p))},dispatchEvent(f){for(let p of(n.get(f.type)||[]).slice())p.call(s,f)}};e=this.path+(e===void 0?"":e),e=this.manager.resolveURL(e);let a=vo(!1),l=this.canvas||a.getCanvas("main"),c=l?l.generation:0,h=l?{canvas:l,generation:c,epoch:l._assetEpoch}:null,u=++o._requestId,d=`image-decode-${u}`;return this.manager.itemStart(e),a.loadAsset(e,h).then(f=>{if(l&&(l.disposed||l.generation!==c||l._assetEpoch!==h.epoch))throw ot(e,"surface was disposed during image load");return(!a.jsr||typeof a.jsr.hostCall!="function")&&P("imageDecode","native host image decoding is unavailable"),a.jsr.hostCall("three.canvas2d",{action:"decodeImage",engineId:a.engineId,surfaceId:l.surfaceId,canvasId:d,generation:c,requestId:u,width:0,height:0,commands:[],data:f.data})}).then(f=>{if(!f||f.stale||f.engineId!==a.engineId||f.surfaceId!==l.surfaceId||f.canvasId!==d||f.generation!==c||f.requestId!==u||!Number.isInteger(f.width)||!Number.isInteger(f.height)||f.width<=0||f.height<=0||typeof f.data!="string")throw new Error("three.canvas2d: invalid decoded image response");let p=Tr(f.data);if(p.length!==f.width*f.height*4)throw new Error("three.canvas2d: decoded image RGBA length");s.width=f.width,s.height=f.height,s.naturalWidth=f.width,s.naturalHeight=f.height,s.data=p,s.encoding=0,s.encoded=!1,s._r1Pixels={data:new Uint8ClampedArray(p),width:f.width,height:f.height},s.complete=!0,t&&t(s),s.dispatchEvent({type:"load"})}).catch(f=>{s.complete=!1,r&&r(f),s.dispatchEvent({type:"error",error:f}),this.manager.itemError(e)}).finally(()=>this.manager.itemEnd(e)),s}};So._requestId=0;var yn=class extends ce{constructor(e){super(e),this.canvas=null}setCanvas(e){return this.canvas=e,this}load(e,t,i,r){let n=new ne;e=this.path+(e===void 0?"":e),e=this.manager.resolveURL(e);let s=vo(!1),a=this.canvas||s.getCanvas("main"),l=a?a.generation:0,c=a?{canvas:a,generation:l,epoch:a._assetEpoch}:null;return this.manager.itemStart(e),s.loadAsset(e,c).then(h=>{if(a&&(a.disposed||a.generation!==l||a._assetEpoch!==c.epoch))throw ot(e,"surface was disposed during texture load");let u=yb(h);n.image={data:h.bytes,width:h.width||0,height:h.height||0,mime:h.mime||"",encoding:u.encoding,encoded:u.encoded},n.needsUpdate=!0,n.userData.jsrAssetUrl=e,t&&t(n)}).catch(h=>{r&&r(h),this.manager.itemError(e)}).finally(()=>this.manager.itemEnd(e)),n}};var vh=class extends xa{load(e,t,i,r){let n=this,s=new Le,a=new ji(this.manager);return a.setResponseType("arraybuffer"),a.setRequestHeader(this.requestHeader),a.setPath(this.path),a.setWithCredentials(n.withCredentials),a.load(e,l=>{let c;try{c=n.parse(l)}catch(h){r!==void 0?r(h):typeof console<"u"&&console.error&&console.error(h);return}n._applyTexData(s,c),t&&t(s,c)},i,r),s}};function Rd(o,e){if(e===qh)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),o;if(e===ts||e===Yo){let t=o.getIndex();if(t===null){let n=[],s=o.getAttribute("position");if(s!==void 0){for(let a=0;a<s.count;a++)n.push(a);o.setIndex(n),t=o.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),o}let i=t.count-2,r=[];if(e===ts)for(let n=1;n<=i;n++)r.push(t.getX(0)),r.push(t.getX(n)),r.push(t.getX(n+1));else for(let n=0;n<i;n++)n%2===0?(r.push(t.getX(n)),r.push(t.getX(n+1)),r.push(t.getX(n+2))):(r.push(t.getX(n+2)),r.push(t.getX(n+1)),r.push(t.getX(n)));return r.length/3!==i&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles."),o.setIndex(r),o.clearGroups(),o}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",e),o}function o0(o){let e=new Map,t=new Map,i=o.clone();return a0(o,i,function(r,n){e.set(n,r),t.set(r,n)}),i.traverse(function(r){if(!r.isSkinnedMesh)return;let n=r,s=e.get(r),a=s.skeleton.bones;n.skeleton=s.skeleton.clone(),n.bindMatrix.copy(s.bindMatrix),n.skeleton.bones=a.map(function(l){return t.get(l)}),n.bind(n.skeleton,n.bindMatrix)}),i}function a0(o,e,t){t(o,e);for(let i=0;i<o.children.length;i++)a0(o.children[i],e.children[i],t)}var wh=class extends ce{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new Od(t)}),this.register(function(t){return new Ud(t)}),this.register(function(t){return new Yd(t)}),this.register(function(t){return new Zd(t)}),this.register(function(t){return new Jd(t)}),this.register(function(t){return new kd(t)}),this.register(function(t){return new Vd(t)}),this.register(function(t){return new Gd(t)}),this.register(function(t){return new Hd(t)}),this.register(function(t){return new Fd(t)}),this.register(function(t){return new Wd(t)}),this.register(function(t){return new zd(t)}),this.register(function(t){return new Xd(t)}),this.register(function(t){return new qd(t)}),this.register(function(t){return new Dd(t)}),this.register(function(t){return new bh(t,se.EXT_MESHOPT_COMPRESSION)}),this.register(function(t){return new bh(t,se.KHR_MESHOPT_COMPRESSION)}),this.register(function(t){return new Kd(t)})}load(e,t,i,r){let n=this,s;if(this.resourcePath!=="")s=this.resourcePath;else if(this.path!==""){let c=qt.extractUrlBase(e);s=qt.resolveURL(c,this.path)}else s=qt.extractUrlBase(e);this.manager.itemStart(e);let a=function(c){r?r(c):console.error(c),n.manager.itemError(e),n.manager.itemEnd(e)},l=new ji(this.manager);l.setPath(this.path),l.setResponseType("arraybuffer"),l.setRequestHeader(this.requestHeader),l.setWithCredentials(this.withCredentials),l.load(e,function(c){try{n.parse(c,s,function(h){t(h),n.manager.itemEnd(e)},a)}catch(h){a(h)}},i,a)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,i,r){let n,s={},a={},l=new TextDecoder;if(typeof e=="string")n=JSON.parse(e);else if(e instanceof ArrayBuffer)if(l.decode(new Uint8Array(e,0,4))===d0){try{s[se.KHR_BINARY_GLTF]=new jd(e)}catch(u){r&&r(u);return}n=JSON.parse(s[se.KHR_BINARY_GLTF].content)}else n=JSON.parse(l.decode(e));else n=e;if(n.asset===void 0||n.asset.version[0]<2){r&&r(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}let c=new sf(n,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});c.fileLoader.setRequestHeader(this.requestHeader);for(let h=0;h<this.pluginCallbacks.length;h++){let u=this.pluginCallbacks[h](c);u.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),a[u.name]=u,s[u.name]=!0}if(n.extensionsUsed)for(let h=0;h<n.extensionsUsed.length;++h){let u=n.extensionsUsed[h],d=n.extensionsRequired||[];switch(u){case se.KHR_MATERIALS_UNLIT:s[u]=new Bd;break;case se.KHR_DRACO_MESH_COMPRESSION:s[u]=new $d(n,this.dracoLoader);break;case se.KHR_TEXTURE_TRANSFORM:s[u]=new Qd;break;case se.KHR_MESH_QUANTIZATION:s[u]=new ef;break;default:d.indexOf(u)>=0&&a[u]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+u+'".')}}c.setExtensions(s),c.setPlugins(a),c.parse(i,r)}parseAsync(e,t){let i=this;return new Promise(function(r,n){i.parse(e,t,r,n)})}};function bb(){let o={};return{get:function(e){return o[e]},add:function(e,t){o[e]=t},remove:function(e){delete o[e]},removeAll:function(){o={}}}}function Ge(o,e,t){let i=o.json.materials[e];return i.extensions&&i.extensions[t]?i.extensions[t]:null}var se={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",KHR_MESHOPT_COMPRESSION:"KHR_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"},Dd=class{constructor(e){this.parser=e,this.name=se.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){let e=this.parser,t=this.parser.json.nodes||[];for(let i=0,r=t.length;i<r;i++){let n=t[i];n.extensions&&n.extensions[this.name]&&n.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,n.extensions[this.name].light)}}_loadLight(e){let t=this.parser,i="light:"+e,r=t.cache.get(i);if(r)return r;let n=t.json,l=((n.extensions&&n.extensions[this.name]||{}).lights||[])[e],c,h=new L(16777215);l.color!==void 0&&h.setRGB(l.color[0],l.color[1],l.color[2],ct);let u=l.range!==void 0?l.range:0;switch(l.type){case"directional":c=new br(h),c.target.position.set(0,0,-1),c.add(c.target);break;case"point":c=new wr(h),c.distance=u;break;case"spot":c=new vr(h),c.distance=u,l.spot=l.spot||{},l.spot.innerConeAngle=l.spot.innerConeAngle!==void 0?l.spot.innerConeAngle:0,l.spot.outerConeAngle=l.spot.outerConeAngle!==void 0?l.spot.outerConeAngle:Math.PI/4,c.angle=l.spot.outerConeAngle,c.penumbra=1-l.spot.innerConeAngle/l.spot.outerConeAngle,c.target.position.set(0,0,-1),c.add(c.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+l.type)}return c.position.set(0,0,0),Bi(c,l),l.intensity!==void 0&&(c.intensity=l.intensity),c.name=t.createUniqueName(l.name||"light_"+e),r=Promise.resolve(c),t.cache.add(i,r),r}getDependency(e,t){if(e==="light")return this._loadLight(t)}createNodeAttachment(e){let t=this,i=this.parser,n=i.json.nodes[e],a=(n.extensions&&n.extensions[this.name]||{}).light;return a===void 0?null:this._loadLight(a).then(function(l){return i._getNodeRef(t.cache,a,l)})}},Bd=class{constructor(){this.name=se.KHR_MATERIALS_UNLIT}getMaterialType(){return _e}extendParams(e,t,i){let r=[];e.color=new L(1,1,1),e.opacity=1;let n=t.pbrMetallicRoughness;if(n){if(Array.isArray(n.baseColorFactor)){let s=n.baseColorFactor;e.color.setRGB(s[0],s[1],s[2],ct),e.opacity=s[3]}n.baseColorTexture!==void 0&&r.push(i.assignTexture(e,"map",n.baseColorTexture,ve))}return Promise.all(r)}},Fd=class{constructor(e){this.parser=e,this.name=se.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){let i=Ge(this.parser,e,this.name);return i===null||i.emissiveStrength!==void 0&&(t.emissiveIntensity=i.emissiveStrength),Promise.resolve()}},Od=class{constructor(e){this.parser=e,this.name=se.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){return Ge(this.parser,e,this.name)!==null?rt:null}extendMaterialParams(e,t){let i=Ge(this.parser,e,this.name);if(i===null)return Promise.resolve();let r=[];if(i.clearcoatFactor!==void 0&&(t.clearcoat=i.clearcoatFactor),i.clearcoatTexture!==void 0&&r.push(this.parser.assignTexture(t,"clearcoatMap",i.clearcoatTexture)),i.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=i.clearcoatRoughnessFactor),i.clearcoatRoughnessTexture!==void 0&&r.push(this.parser.assignTexture(t,"clearcoatRoughnessMap",i.clearcoatRoughnessTexture)),i.clearcoatNormalTexture!==void 0&&(r.push(this.parser.assignTexture(t,"clearcoatNormalMap",i.clearcoatNormalTexture)),i.clearcoatNormalTexture.scale!==void 0)){let n=i.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new E(n,n)}return Promise.all(r)}},Ud=class{constructor(e){this.parser=e,this.name=se.KHR_MATERIALS_DISPERSION}getMaterialType(e){return Ge(this.parser,e,this.name)!==null?rt:null}extendMaterialParams(e,t){let i=Ge(this.parser,e,this.name);return i===null||(t.dispersion=i.dispersion!==void 0?i.dispersion:0),Promise.resolve()}},zd=class{constructor(e){this.parser=e,this.name=se.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){return Ge(this.parser,e,this.name)!==null?rt:null}extendMaterialParams(e,t){let i=Ge(this.parser,e,this.name);if(i===null)return Promise.resolve();let r=[];return i.iridescenceFactor!==void 0&&(t.iridescence=i.iridescenceFactor),i.iridescenceTexture!==void 0&&r.push(this.parser.assignTexture(t,"iridescenceMap",i.iridescenceTexture)),i.iridescenceIor!==void 0&&(t.iridescenceIOR=i.iridescenceIor),t.iridescenceThicknessRange===void 0&&(t.iridescenceThicknessRange=[100,400]),i.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessRange[0]=i.iridescenceThicknessMinimum),i.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessRange[1]=i.iridescenceThicknessMaximum),i.iridescenceThicknessTexture!==void 0&&r.push(this.parser.assignTexture(t,"iridescenceThicknessMap",i.iridescenceThicknessTexture)),Promise.all(r)}},kd=class{constructor(e){this.parser=e,this.name=se.KHR_MATERIALS_SHEEN}getMaterialType(e){return Ge(this.parser,e,this.name)!==null?rt:null}extendMaterialParams(e,t){let i=Ge(this.parser,e,this.name);if(i===null)return Promise.resolve();let r=[];if(t.sheenColor=new L(0,0,0),t.sheenRoughness=0,t.sheen=1,i.sheenColorFactor!==void 0){let n=i.sheenColorFactor;t.sheenColor.setRGB(n[0],n[1],n[2],ct)}return i.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=i.sheenRoughnessFactor),i.sheenColorTexture!==void 0&&r.push(this.parser.assignTexture(t,"sheenColorMap",i.sheenColorTexture,ve)),i.sheenRoughnessTexture!==void 0&&r.push(this.parser.assignTexture(t,"sheenRoughnessMap",i.sheenRoughnessTexture)),Promise.all(r)}},Vd=class{constructor(e){this.parser=e,this.name=se.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){return Ge(this.parser,e,this.name)!==null?rt:null}extendMaterialParams(e,t){let i=Ge(this.parser,e,this.name);if(i===null)return Promise.resolve();let r=[];return i.transmissionFactor!==void 0&&(t.transmission=i.transmissionFactor),i.transmissionTexture!==void 0&&r.push(this.parser.assignTexture(t,"transmissionMap",i.transmissionTexture)),Promise.all(r)}},Gd=class{constructor(e){this.parser=e,this.name=se.KHR_MATERIALS_VOLUME}getMaterialType(e){return Ge(this.parser,e,this.name)!==null?rt:null}extendMaterialParams(e,t){let i=Ge(this.parser,e,this.name);if(i===null)return Promise.resolve();let r=[];t.thickness=i.thicknessFactor!==void 0?i.thicknessFactor:0,i.thicknessTexture!==void 0&&r.push(this.parser.assignTexture(t,"thicknessMap",i.thicknessTexture)),t.attenuationDistance=i.attenuationDistance||1/0;let n=i.attenuationColor||[1,1,1];return t.attenuationColor=new L().setRGB(n[0],n[1],n[2],ct),Promise.all(r)}},Hd=class{constructor(e){this.parser=e,this.name=se.KHR_MATERIALS_IOR}getMaterialType(e){return Ge(this.parser,e,this.name)!==null?rt:null}extendMaterialParams(e,t){let i=Ge(this.parser,e,this.name);return i===null||(t.ior=i.ior!==void 0?i.ior:1.5,t.ior===0&&(t.ior=1e3)),Promise.resolve()}},Wd=class{constructor(e){this.parser=e,this.name=se.KHR_MATERIALS_SPECULAR}getMaterialType(e){return Ge(this.parser,e,this.name)!==null?rt:null}extendMaterialParams(e,t){let i=Ge(this.parser,e,this.name);if(i===null)return Promise.resolve();let r=[];t.specularIntensity=i.specularFactor!==void 0?i.specularFactor:1,i.specularTexture!==void 0&&r.push(this.parser.assignTexture(t,"specularIntensityMap",i.specularTexture));let n=i.specularColorFactor||[1,1,1];return t.specularColor=new L().setRGB(n[0],n[1],n[2],ct),i.specularColorTexture!==void 0&&r.push(this.parser.assignTexture(t,"specularColorMap",i.specularColorTexture,ve)),Promise.all(r)}},qd=class{constructor(e){this.parser=e,this.name=se.EXT_MATERIALS_BUMP}getMaterialType(e){return Ge(this.parser,e,this.name)!==null?rt:null}extendMaterialParams(e,t){let i=Ge(this.parser,e,this.name);if(i===null)return Promise.resolve();let r=[];return t.bumpScale=i.bumpFactor!==void 0?i.bumpFactor:1,i.bumpTexture!==void 0&&r.push(this.parser.assignTexture(t,"bumpMap",i.bumpTexture)),Promise.all(r)}},Xd=class{constructor(e){this.parser=e,this.name=se.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){return Ge(this.parser,e,this.name)!==null?rt:null}extendMaterialParams(e,t){let i=Ge(this.parser,e,this.name);if(i===null)return Promise.resolve();let r=[];return i.anisotropyStrength!==void 0&&(t.anisotropy=i.anisotropyStrength),i.anisotropyRotation!==void 0&&(t.anisotropyRotation=i.anisotropyRotation),i.anisotropyTexture!==void 0&&r.push(this.parser.assignTexture(t,"anisotropyMap",i.anisotropyTexture)),Promise.all(r)}},Yd=class{constructor(e){this.parser=e,this.name=se.KHR_TEXTURE_BASISU}loadTexture(e){let t=this.parser,i=t.json,r=i.textures[e];if(!r.extensions||!r.extensions[this.name])return null;let n=r.extensions[this.name],s=t.options.ktx2Loader;if(!s){if(i.extensionsRequired&&i.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(e,n.source,s)}},Zd=class{constructor(e){this.parser=e,this.name=se.EXT_TEXTURE_WEBP}loadTexture(e){let t=this.name,i=this.parser,r=i.json,n=r.textures[e];if(!n.extensions||!n.extensions[t])return null;let s=n.extensions[t],a=r.images[s.source],l=i.textureLoader;if(a.uri){let c=i.options.manager.getHandler(a.uri);c!==null&&(l=c)}return i.loadTextureImage(e,s.source,l)}},Jd=class{constructor(e){this.parser=e,this.name=se.EXT_TEXTURE_AVIF}loadTexture(e){let t=this.name,i=this.parser,r=i.json,n=r.textures[e];if(!n.extensions||!n.extensions[t])return null;let s=n.extensions[t],a=r.images[s.source],l=i.textureLoader;if(a.uri){let c=i.options.manager.getHandler(a.uri);c!==null&&(l=c)}return i.loadTextureImage(e,s.source,l)}},bh=class{constructor(e,t){this.name=t,this.parser=e}loadBufferView(e){let t=this.parser.json,i=t.bufferViews[e];if(i.extensions&&i.extensions[this.name]){let r=i.extensions[this.name],n=this.parser.getDependency("buffer",r.buffer),s=this.parser.options.meshoptDecoder;if(!s||!s.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return n.then(function(a){let l=r.byteOffset||0,c=r.byteLength||0,h=r.count,u=r.byteStride,d=new Uint8Array(a,l,c);return s.decodeGltfBufferAsync?s.decodeGltfBufferAsync(h,u,d,r.mode,r.filter).then(function(f){return f.buffer}):s.ready.then(function(){let f=new ArrayBuffer(h*u);return s.decodeGltfBuffer(new Uint8Array(f),h,u,d,r.mode,r.filter),f})})}else return null}},Kd=class{constructor(e){this.name=se.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){let t=this.parser.json,i=t.nodes[e];if(!i.extensions||!i.extensions[this.name]||i.mesh===void 0)return null;let r=t.meshes[i.mesh];for(let c of r.primitives)if(c.mode!==ni.TRIANGLES&&c.mode!==ni.TRIANGLE_STRIP&&c.mode!==ni.TRIANGLE_FAN&&c.mode!==void 0)return null;let s=i.extensions[this.name].attributes,a=[],l={};for(let c in s)a.push(this.parser.getDependency("accessor",s[c]).then(h=>(l[c]=h,l[c])));return a.length<1?null:(a.push(this.parser.createNodeMesh(e)),Promise.all(a).then(c=>{let h=c.pop(),u=h.isGroup?h.children:[h],d=c[0].count,f=[];for(let p of u){let m=new z,_=new w,g=new ge,x=new w(1,1,1),y=new pr(p.geometry,p.material,d);for(let M=0;M<d;M++)l.TRANSLATION&&_.fromBufferAttribute(l.TRANSLATION,M),l.ROTATION&&g.fromBufferAttribute(l.ROTATION,M),l.SCALE&&x.fromBufferAttribute(l.SCALE,M),y.setMatrixAt(M,m.compose(_,g,x));let v=null;for(let M in l)if(M==="_COLOR_0"){let A=l[M];y.instanceColor=new ft(A.array,A.itemSize,A.normalized)}else if(M!=="TRANSLATION"&&M!=="ROTATION"&&M!=="SCALE"){if(v===null){let T=y.geometry;v=new D,v.name=T.name;for(let S in T.attributes)v.setAttribute(S,T.attributes[S]);for(let S in T.morphAttributes)v.morphAttributes[S]=T.morphAttributes[S];T.index!==null&&v.setIndex(T.index),v.morphTargetsRelative=T.morphTargetsRelative;for(let S of T.groups)v.addGroup(S.start,S.count,S.materialIndex);T.boundingBox!==null&&(v.boundingBox=T.boundingBox.clone()),T.boundingSphere!==null&&(v.boundingSphere=T.boundingSphere.clone()),v.drawRange.start=T.drawRange.start,v.drawRange.count=T.drawRange.count,v.userData=Object.assign({},T.userData),y.geometry=v}let A=l[M];v.setAttribute(M,new ft(A.array,A.itemSize,A.normalized))}q.prototype.copy.call(y,p),this.parser.assignFinalMaterial(y),f.push(y)}return h.isGroup?(h.clear(),h.add(...f),h):f[0]}))}},d0="glTF",Na=12,l0={JSON:1313821514,BIN:5130562},jd=class{constructor(e){this.name=se.KHR_BINARY_GLTF,this.content=null,this.body=null;let t=new DataView(e,0,Na),i=new TextDecoder;if(this.header={magic:i.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==d0)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");let r=this.header.length-Na,n=new DataView(e,Na),s=0;for(;s<r;){let a=n.getUint32(s,!0);s+=4;let l=n.getUint32(s,!0);if(s+=4,l===l0.JSON){let c=new Uint8Array(e,Na+s,a);this.content=i.decode(c)}else if(l===l0.BIN){let c=Na+s;this.body=e.slice(c,c+a)}s+=a}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}},$d=class{constructor(e,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=se.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){let i=this.json,r=this.dracoLoader,n=e.extensions[this.name].bufferView,s=e.extensions[this.name].attributes,a={},l={},c={};for(let h in s){let u=rf[h]||h.toLowerCase();a[u]=s[h]}for(let h in e.attributes){let u=rf[h]||h.toLowerCase();if(s[h]!==void 0){let d=i.accessors[e.attributes[h]],f=Ao[d.componentType];c[u]=f.name,l[u]=d.normalized===!0}}return t.getDependency("bufferView",n).then(function(h){return new Promise(function(u,d){r.decodeDracoFile(h,function(f){for(let p in f.attributes){let m=f.attributes[p],_=l[p];_!==void 0&&(m.normalized=_)}u(f)},a,c,ct,d)})})}},Qd=class{constructor(){this.name=se.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){if((t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0)return e;if(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),t.rotation!==void 0){let i=Math.cos(e.rotation),r=Math.sin(e.rotation);e.matrix.set(e.repeat.x*i,e.repeat.y*r,e.offset.x,-e.repeat.x*r,e.repeat.y*i,e.offset.y,0,0,1),e.matrixAutoUpdate=!1}return e.needsUpdate=!0,e}},ef=class{constructor(){this.name=se.KHR_MESH_QUANTIZATION}},Mh=class extends gt{constructor(e,t,i,r){super(e,t,i,r)}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,r=this.valueSize,n=e*r*3+r;for(let s=0;s!==r;s++)t[s]=i[n+s];return t}interpolate_(e,t,i,r){let n=this.resultBuffer,s=this.sampleValues,a=this.valueSize,l=a*2,c=a*3,h=r-t,u=(i-t)/h,d=u*u,f=d*u,p=e*c,m=p-c,_=-2*f+3*d,g=f-d,x=1-_,y=g-d+u;for(let v=0;v!==a;v++){let M=s[m+v+a],A=s[m+v+l]*h,T=s[p+v+a],S=s[p+v]*h;n[v]=x*M+y*A+_*T+g*S}return n}},Mb=new ge,tf=class extends Mh{interpolate_(e,t,i,r){let n=super.interpolate_(e,t,i,r);return Mb.fromArray(n).normalize().toArray(n),n}},ni={FLOAT:5126,FLOAT_MAT3:35675,FLOAT_MAT4:35676,FLOAT_VEC2:35664,FLOAT_VEC3:35665,FLOAT_VEC4:35666,LINEAR:9729,REPEAT:10497,SAMPLER_2D:35678,POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6,UNSIGNED_BYTE:5121,UNSIGNED_SHORT:5123},Ao={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},c0={9728:me,9729:xe,9984:Pr,9985:Ro,9986:Lr,9987:Yt},h0={33071:Be,33648:si,10497:Ft},Pd={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},rf={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},Er={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},Sb={CUBICSPLINE:void 0,LINEAR:tr,STEP:bi},Ld={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function Ab(o){return o.DefaultMaterial===void 0&&(o.DefaultMaterial=new ui({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:Oi})),o.DefaultMaterial}function vn(o,e,t){for(let i in t.extensions)o[i]===void 0&&(e.userData.gltfExtensions=e.userData.gltfExtensions||{},e.userData.gltfExtensions[i]=t.extensions[i])}function Bi(o,e){e.extras!==void 0&&(typeof e.extras=="object"?Object.assign(o.userData,e.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+e.extras))}function Tb(o,e,t){let i=!1,r=!1,n=!1;for(let c=0,h=e.length;c<h;c++){let u=e[c];if(u.POSITION!==void 0&&(i=!0),u.NORMAL!==void 0&&(r=!0),u.COLOR_0!==void 0&&(n=!0),i&&r&&n)break}if(!i&&!r&&!n)return Promise.resolve(o);let s=[],a=[],l=[];for(let c=0,h=e.length;c<h;c++){let u=e[c];if(i){let d=u.POSITION!==void 0?t.getDependency("accessor",u.POSITION):o.attributes.position;s.push(d)}if(r){let d=u.NORMAL!==void 0?t.getDependency("accessor",u.NORMAL):o.attributes.normal;a.push(d)}if(n){let d=u.COLOR_0!==void 0?t.getDependency("accessor",u.COLOR_0):o.attributes.color;l.push(d)}}return Promise.all([Promise.all(s),Promise.all(a),Promise.all(l)]).then(function(c){let h=c[0],u=c[1],d=c[2];return i&&(o.morphAttributes.position=h),r&&(o.morphAttributes.normal=u),n&&(o.morphAttributes.color=d),o.morphTargetsRelative=!0,o})}function Cb(o,e){if(o.updateMorphTargets(),e.weights!==void 0)for(let t=0,i=e.weights.length;t<i;t++)o.morphTargetInfluences[t]=e.weights[t];if(e.extras&&Array.isArray(e.extras.targetNames)){let t=e.extras.targetNames;if(o.morphTargetInfluences.length===t.length){o.morphTargetDictionary={};for(let i=0,r=t.length;i<r;i++)o.morphTargetDictionary[t[i]]=i}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function Eb(o){let e,t=o.extensions&&o.extensions[se.KHR_DRACO_MESH_COMPRESSION];if(t?e="draco:"+t.bufferView+":"+t.indices+":"+Nd(t.attributes):e=o.indices+":"+Nd(o.attributes)+":"+o.mode,o.targets!==void 0)for(let i=0,r=o.targets.length;i<r;i++)e+=":"+Nd(o.targets[i]);return e}function Nd(o){let e="",t=Object.keys(o).sort();for(let i=0,r=t.length;i<r;i++)e+=t[i]+":"+o[t[i]]+";";return e}function nf(o){switch(o){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function Ib(o){return o.search(/\.jpe?g($|\?)/i)>0||o.search(/^data\:image\/jpeg/)===0?"image/jpeg":o.search(/\.webp($|\?)/i)>0||o.search(/^data\:image\/webp/)===0?"image/webp":o.search(/\.ktx2($|\?)/i)>0||o.search(/^data\:image\/ktx2/)===0?"image/ktx2":"image/png"}var Rb=new z,sf=class{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new bb,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let i=!1,r=-1,n=!1,s=-1;if(typeof navigator<"u"&&typeof navigator.userAgent<"u"){let a=navigator.userAgent;i=/^((?!chrome|android).)*safari/i.test(a)===!0;let l=a.match(/Version\/(\d+)/);r=i&&l?parseInt(l[1],10):-1,n=a.indexOf("Firefox")>-1,s=n?a.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>"u"||i&&r<17||n&&s<98?this.textureLoader=new yn(this.options.manager):this.textureLoader=new oo(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new ji(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){let i=this,r=this.json,n=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(s){return s._markDefs&&s._markDefs()}),Promise.all(this._invokeAll(function(s){return s.beforeRoot&&s.beforeRoot()})).then(function(){return Promise.all([i.getDependencies("scene"),i.getDependencies("animation"),i.getDependencies("camera")])}).then(function(s){let a={scene:s[0][r.scene||0],scenes:s[0],animations:s[1],cameras:s[2],asset:r.asset,parser:i,userData:{}};return vn(n,a,r),Bi(a,r),Promise.all(i._invokeAll(function(l){return l.afterRoot&&l.afterRoot(a)})).then(function(){for(let l of a.scenes)l.updateMatrixWorld();e(a)})}).catch(t)}_markDefs(){let e=this.json.nodes||[],t=this.json.skins||[],i=this.json.meshes||[];for(let r=0,n=t.length;r<n;r++){let s=t[r].joints;for(let a=0,l=s.length;a<l;a++)e[s[a]].isBone=!0}for(let r=0,n=e.length;r<n;r++){let s=e[r];s.mesh!==void 0&&(this._addNodeRef(this.meshCache,s.mesh),s.skin!==void 0&&(i[s.mesh].isSkinnedMesh=!0)),s.camera!==void 0&&this._addNodeRef(this.cameraCache,s.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,i){if(e.refs[t]<=1)return i;let r=i.clone(),n=(s,a)=>{let l=this.associations.get(s);l!=null&&this.associations.set(a,l);for(let[c,h]of s.children.entries())n(h,a.children[c])};return n(i,r),r.name+="_instance_"+e.uses[t]++,r}_invokeOne(e){let t=Object.values(this.plugins);t.push(this);for(let i=0;i<t.length;i++){let r=e(t[i]);if(r)return r}return null}_invokeAll(e){let t=Object.values(this.plugins);t.unshift(this);let i=[];for(let r=0;r<t.length;r++){let n=e(t[r]);n&&i.push(n)}return i}getDependency(e,t){let i=e+":"+t,r=this.cache.get(i);if(!r){switch(e){case"scene":r=this.loadScene(t);break;case"node":r=this._invokeOne(function(n){return n.loadNode&&n.loadNode(t)});break;case"mesh":r=this._invokeOne(function(n){return n.loadMesh&&n.loadMesh(t)});break;case"accessor":r=this.loadAccessor(t);break;case"bufferView":r=this._invokeOne(function(n){return n.loadBufferView&&n.loadBufferView(t)});break;case"buffer":r=this.loadBuffer(t);break;case"material":r=this._invokeOne(function(n){return n.loadMaterial&&n.loadMaterial(t)});break;case"texture":r=this._invokeOne(function(n){return n.loadTexture&&n.loadTexture(t)});break;case"skin":r=this.loadSkin(t);break;case"animation":r=this._invokeOne(function(n){return n.loadAnimation&&n.loadAnimation(t)});break;case"camera":r=this.loadCamera(t);break;default:if(r=this._invokeOne(function(n){return n!=this&&n.getDependency&&n.getDependency(e,t)}),!r)throw new Error("Unknown type: "+e);break}this.cache.add(i,r)}return r}getDependencies(e){let t=this.cache.get(e);if(!t){let i=this,r=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(r.map(function(n,s){return i.getDependency(e,s)})),this.cache.add(e,t)}return t}loadBuffer(e){let t=this.json.buffers[e],i=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[se.KHR_BINARY_GLTF].body);let r=this.options;return new Promise(function(n,s){i.load(qt.resolveURL(t.uri,r.path),n,void 0,function(){s(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){let t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(i){let r=t.byteLength||0,n=t.byteOffset||0;return i.slice(n,n+r)})}loadAccessor(e){let t=this,i=this.json,r=this.json.accessors[e];if(r.bufferView===void 0&&r.sparse===void 0){let s=Pd[r.type],a=Ao[r.componentType],l=r.normalized===!0,c=new a(r.count*s);return Promise.resolve(new $(c,s,l))}let n=[];return r.bufferView!==void 0?n.push(this.getDependency("bufferView",r.bufferView)):n.push(null),r.sparse!==void 0&&(n.push(this.getDependency("bufferView",r.sparse.indices.bufferView)),n.push(this.getDependency("bufferView",r.sparse.values.bufferView))),Promise.all(n).then(function(s){let a=s[0],l=Pd[r.type],c=Ao[r.componentType],h=c.BYTES_PER_ELEMENT,u=h*l,d=r.byteOffset||0,f=r.bufferView!==void 0?i.bufferViews[r.bufferView].byteStride:void 0,p=r.normalized===!0,m,_;if(f&&f!==u){let g=Math.floor(d/f),x="InterleavedBuffer:"+r.bufferView+":"+r.componentType+":"+g+":"+r.count,y=t.cache.get(x);y||(m=new c(a,g*f,r.count*f/h),y=new Vt(m,f/h),t.cache.add(x,y)),_=new Gt(y,l,d%f/h,p)}else a===null?m=new c(r.count*l):m=new c(a,d,r.count*l),_=new $(m,l,p);if(r.sparse!==void 0){let g=Pd.SCALAR,x=Ao[r.sparse.indices.componentType],y=r.sparse.indices.byteOffset||0,v=r.sparse.values.byteOffset||0,M=new x(s[1],y,r.sparse.count*g),A=new c(s[2],v,r.sparse.count*l);a!==null&&(_=new $(_.array.slice(),_.itemSize,_.normalized)),_.normalized=!1;for(let T=0,S=M.length;T<S;T++){let b=M[T];if(_.setX(b,A[T*l]),l>=2&&_.setY(b,A[T*l+1]),l>=3&&_.setZ(b,A[T*l+2]),l>=4&&_.setW(b,A[T*l+3]),l>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}_.normalized=p}return _})}loadTexture(e){let t=this.json,i=this.options,n=t.textures[e].source,s=t.images[n],a=this.textureLoader;if(s.uri){let l=i.manager.getHandler(s.uri);l!==null&&(a=l)}return this.loadTextureImage(e,n,a)}loadTextureImage(e,t,i){let r=this,n=this.json,s=n.textures[e],a=n.images[t],l=(a.uri||a.bufferView)+":"+s.sampler;if(this.textureCache[l])return this.textureCache[l];let c=this.loadImageSource(t,i).then(function(h){h.flipY=!1,h.name=s.name||a.name||"",h.name===""&&typeof a.uri=="string"&&a.uri.startsWith("data:image/")===!1&&(h.name=a.uri);let d=(n.samplers||{})[s.sampler]||{};return h.magFilter=c0[d.magFilter]||xe,h.minFilter=c0[d.minFilter]||Yt,h.wrapS=h0[d.wrapS]||Ft,h.wrapT=h0[d.wrapT]||Ft,h.generateMipmaps=!h.isCompressedTexture&&h.minFilter!==me&&h.minFilter!==xe,r.associations.set(h,{textures:e}),h}).catch(function(){return null});return this.textureCache[l]=c,c}loadImageSource(e,t){let i=this,r=this.json,n=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(u=>u.clone());let s=r.images[e],a=self.URL||self.webkitURL,l=s.uri||"",c=!1;if(s.bufferView!==void 0)l=i.getDependency("bufferView",s.bufferView).then(function(u){c=!0;let d=new Blob([u],{type:s.mimeType});return l=a.createObjectURL(d),l});else if(s.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");let h=Promise.resolve(l).then(function(u){return new Promise(function(d,f){let p=d;t.isImageBitmapLoader===!0&&(p=function(m){let _=new ne(m);_.needsUpdate=!0,d(_)}),t.load(qt.resolveURL(u,n.path),p,void 0,f)})}).then(function(u){return c===!0&&a.revokeObjectURL(l),Bi(u,s),u.userData.mimeType=s.mimeType||Ib(s.uri),u}).catch(function(u){throw console.error("THREE.GLTFLoader: Couldn't load texture",l),u});return this.sourceCache[e]=h,h}assignTexture(e,t,i,r){let n=this;return this.getDependency("texture",i.index).then(function(s){if(!s)return null;if(i.texCoord!==void 0&&i.texCoord>0&&(s=s.clone(),s.channel=i.texCoord),n.extensions[se.KHR_TEXTURE_TRANSFORM]){let a=i.extensions!==void 0?i.extensions[se.KHR_TEXTURE_TRANSFORM]:void 0;if(a){let l=n.associations.get(s);s=n.extensions[se.KHR_TEXTURE_TRANSFORM].extendTexture(s,a),n.associations.set(s,l)}}return r!==void 0&&(s.colorSpace=r),e[t]=s,s})}assignFinalMaterial(e){let t=e.geometry,i=e.material,r=t.attributes.tangent===void 0,n=t.attributes.color!==void 0,s=t.attributes.normal===void 0;if(e.isPoints){let a="PointsMaterial:"+i.uuid,l=this.cache.get(a);l||(l=new $t,te.prototype.copy.call(l,i),l.color.copy(i.color),l.map=i.map,l.sizeAttenuation=!1,this.cache.add(a,l)),i=l}else if(e.isLine){let a="LineBasicMaterial:"+i.uuid,l=this.cache.get(a);l||(l=new oe,te.prototype.copy.call(l,i),l.color.copy(i.color),l.map=i.map,this.cache.add(a,l)),i=l}if(r||n||s){let a="ClonedMaterial:"+i.uuid+":";r&&(a+="derivative-tangents:"),n&&(a+="vertex-colors:"),s&&(a+="flat-shading:");let l=this.cache.get(a);l||(l=i.clone(),n&&(l.vertexColors=!0),s&&(l.flatShading=!0),r&&(l.normalScale&&(l.normalScale.y*=-1),l.clearcoatNormalScale&&(l.clearcoatNormalScale.y*=-1)),this.cache.add(a,l),this.associations.set(l,this.associations.get(i))),i=l}e.material=i}getMaterialType(){return ui}loadMaterial(e){let t=this,i=this.json,r=this.extensions,n=i.materials[e],s,a={},l=n.extensions||{},c=[];if(l[se.KHR_MATERIALS_UNLIT]){let u=r[se.KHR_MATERIALS_UNLIT];s=u.getMaterialType(),c.push(u.extendParams(a,n,t))}else{let u=n.pbrMetallicRoughness||{};if(a.color=new L(1,1,1),a.opacity=1,Array.isArray(u.baseColorFactor)){let d=u.baseColorFactor;a.color.setRGB(d[0],d[1],d[2],ct),a.opacity=d[3]}u.baseColorTexture!==void 0&&c.push(t.assignTexture(a,"map",u.baseColorTexture,ve)),a.metalness=u.metallicFactor!==void 0?u.metallicFactor:1,a.roughness=u.roughnessFactor!==void 0?u.roughnessFactor:1,u.metallicRoughnessTexture!==void 0&&(c.push(t.assignTexture(a,"metalnessMap",u.metallicRoughnessTexture)),c.push(t.assignTexture(a,"roughnessMap",u.metallicRoughnessTexture))),s=this._invokeOne(function(d){return d.getMaterialType&&d.getMaterialType(e)}),c.push(Promise.all(this._invokeAll(function(d){return d.extendMaterialParams&&d.extendMaterialParams(e,a)})))}n.doubleSided===!0&&(a.side=Co);let h=n.alphaMode||Ld.OPAQUE;if(h===Ld.BLEND?(a.transparent=!0,a.depthWrite=!1):(a.transparent=!1,h===Ld.MASK&&(a.alphaTest=n.alphaCutoff!==void 0?n.alphaCutoff:.5)),n.normalTexture!==void 0&&s!==_e&&(c.push(t.assignTexture(a,"normalMap",n.normalTexture)),a.normalScale=new E(1,1),n.normalTexture.scale!==void 0)){let u=n.normalTexture.scale;a.normalScale.set(u,u)}if(n.occlusionTexture!==void 0&&s!==_e&&(c.push(t.assignTexture(a,"aoMap",n.occlusionTexture)),n.occlusionTexture.strength!==void 0&&(a.aoMapIntensity=n.occlusionTexture.strength)),n.emissiveFactor!==void 0&&s!==_e){let u=n.emissiveFactor;a.emissive=new L().setRGB(u[0],u[1],u[2],ct)}return n.emissiveTexture!==void 0&&s!==_e&&c.push(t.assignTexture(a,"emissiveMap",n.emissiveTexture,ve)),Promise.all(c).then(function(){let u=new s(a);return n.name&&(u.name=n.name),Bi(u,n),t.associations.set(u,{materials:e}),n.extensions&&vn(r,u,n),u})}createUniqueName(e){let t=le.sanitizeNodeName(e||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){let t=this,i=this.extensions,r=this.primitiveCache;function n(a){return i[se.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(a,t).then(function(l){return u0(l,a,t)})}let s=[];for(let a=0,l=e.length;a<l;a++){let c=e[a],h=Eb(c),u=r[h];if(u)s.push(u.promise);else{let d;c.extensions&&c.extensions[se.KHR_DRACO_MESH_COMPRESSION]?d=n(c):d=u0(new D,c,t),c.mode===ni.TRIANGLE_STRIP?d=d.then(f=>Rd(f,Yo)):c.mode===ni.TRIANGLE_FAN&&(d=d.then(f=>Rd(f,ts))),r[h]={primitive:c,promise:d},s.push(d)}}return Promise.all(s)}loadMesh(e){let t=this,i=this.json,r=this.extensions,n=i.meshes[e],s=n.primitives,a=[];for(let l=0,c=s.length;l<c;l++){let h=s[l].material===void 0?Ab(this.cache):this.getDependency("material",s[l].material);a.push(h)}return a.push(t.loadGeometries(s)),Promise.all(a).then(async function(l){let c=l.slice(0,l.length-1),h=l[l.length-1],u=[];for(let f=0,p=h.length;f<p;f++){let m=h[f],_=s[f],g,x=c[f];if(_.mode===ni.TRIANGLES||_.mode===ni.TRIANGLE_STRIP||_.mode===ni.TRIANGLE_FAN||_.mode===void 0){let y=n.isSkinnedMesh===!0,v=m.hasAttribute("skinIndex")&&m.hasAttribute("skinWeight");y&&v===!1&&console.warn("THREE.GLTFLoader: Missing skinIndex or skinWeight attributes. Skinning disabled."),g=y&&v?new dr(m,x):new ae(m,x),g.isSkinnedMesh===!0&&g.normalizeSkinWeights()}else if(_.mode===ni.LINES)g=new Ce(m,x);else if(_.mode===ni.LINE_STRIP)g=new Ze(m,x);else if(_.mode===ni.LINE_LOOP)g=new mr(m,x);else if(_.mode===ni.POINTS)g=new gr(m,x);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+_.mode);Object.keys(g.geometry.morphAttributes).length>0&&Cb(g,n),g.name=t.createUniqueName(n.name||"mesh_"+e),Bi(g,n),_.extensions&&vn(r,g,_),t.assignFinalMaterial(g),u.push(g)}for(let f=0,p=u.length;f<p;f++)t.associations.set(u[f],{meshes:e,primitives:f});if(u.length===1)return n.extensions&&vn(r,u[0],n),u[0];let d=new vt;n.extensions&&vn(r,d,n),t.associations.set(d,{meshes:e});for(let f=0,p=u.length;f<p;f++)d.add(u[f]);return d})}loadCamera(e){let t,i=this.json.cameras[e],r=i[i.type];if(!r){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return i.type==="perspective"?t=new be(Ya.radToDeg(r.yfov),r.aspectRatio||1,r.znear||1,r.zfar||2e6):i.type==="orthographic"&&(t=new ii(-r.xmag,r.xmag,r.ymag,-r.ymag,r.znear,r.zfar)),i.name&&(t.name=this.createUniqueName(i.name)),Bi(t,i),Promise.resolve(t)}loadSkin(e){let t=this.json.skins[e],i=[];for(let r=0,n=t.joints.length;r<n;r++)i.push(this._loadNodeShallow(t.joints[r]));return t.inverseBindMatrices!==void 0?i.push(this.getDependency("accessor",t.inverseBindMatrices)):i.push(null),Promise.all(i).then(function(r){let n=r.pop(),s=r,a=[],l=[];for(let c=0,h=s.length;c<h;c++){let u=s[c];if(u){a.push(u);let d=new z;n!==null&&d.fromArray(n.array,c*16),l.push(d)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[c])}return new fr(a,l)})}loadAnimation(e){let t=this.json,i=this,r=t.animations[e],n=r.name?r.name:"animation_"+e,s=[],a=[],l=[],c=[],h=[];for(let u=0,d=r.channels.length;u<d;u++){let f=r.channels[u],p=r.samplers[f.sampler],m=f.target,_=m.node,g=r.parameters!==void 0?r.parameters[p.input]:p.input,x=r.parameters!==void 0?r.parameters[p.output]:p.output;m.node!==void 0&&(s.push(this.getDependency("node",_)),a.push(this.getDependency("accessor",g)),l.push(this.getDependency("accessor",x)),c.push(p),h.push(m))}return Promise.all([Promise.all(s),Promise.all(a),Promise.all(l),Promise.all(c),Promise.all(h)]).then(function(u){let d=u[0],f=u[1],p=u[2],m=u[3],_=u[4],g=[];for(let y=0,v=d.length;y<v;y++){let M=d[y],A=f[y],T=p[y],S=m[y],b=_[y];if(M===void 0)continue;M.updateMatrix&&M.updateMatrix();let C=i._createAnimationTracks(M,A,T,S,b);if(C)for(let I=0;I<C.length;I++)g.push(C[I])}let x=new Pt(n,void 0,g);return Bi(x,r),x})}createNodeMesh(e){let t=this.json,i=this,r=t.nodes[e];return r.mesh===void 0?null:i.getDependency("mesh",r.mesh).then(function(n){let s=i._getNodeRef(i.meshCache,r.mesh,n);return r.weights!==void 0&&s.traverse(function(a){if(a.isMesh)for(let l=0,c=r.weights.length;l<c;l++)a.morphTargetInfluences[l]=r.weights[l]}),s})}loadNode(e){let t=this.json,i=this,r=t.nodes[e],n=i._loadNodeShallow(e),s=[],a=r.children||[];for(let c=0,h=a.length;c<h;c++)s.push(i.getDependency("node",a[c]));let l=r.skin===void 0?Promise.resolve(null):i.getDependency("skin",r.skin);return Promise.all([n,Promise.all(s),l]).then(function(c){let h=c[0],u=c[1],d=c[2];d!==null&&h.traverse(function(f){f.isSkinnedMesh&&f.bind(d,Rb)});for(let f=0,p=u.length;f<p;f++)h.add(u[f]);if(h.userData.pivot!==void 0&&u.length>0){let f=h.userData.pivot,p=u[0];h.pivot=new w().fromArray(f),h.position.x-=f[0],h.position.y-=f[1],h.position.z-=f[2],p.position.set(0,0,0),delete h.userData.pivot}return h})}_loadNodeShallow(e){let t=this.json,i=this.extensions,r=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];let n=t.nodes[e],s=n.name?r.createUniqueName(n.name):"",a=[],l=r._invokeOne(function(c){return c.createNodeMesh&&c.createNodeMesh(e)});return l&&a.push(l),n.camera!==void 0&&a.push(r.getDependency("camera",n.camera).then(function(c){return r._getNodeRef(r.cameraCache,n.camera,c)})),r._invokeAll(function(c){return c.createNodeAttachment&&c.createNodeAttachment(e)}).forEach(function(c){a.push(c)}),this.nodeCache[e]=Promise.all(a).then(function(c){let h;if(n.isBone===!0?h=new Si:c.length>1?h=new vt:c.length===1?h=c[0]:h=new q,h!==c[0])for(let u=0,d=c.length;u<d;u++)h.add(c[u]);if(n.name&&(h.userData.name=n.name,h.name=s),Bi(h,n),n.extensions&&vn(i,h,n),n.matrix!==void 0){let u=new z;u.fromArray(n.matrix),h.applyMatrix4(u)}else n.translation!==void 0&&h.position.fromArray(n.translation),n.rotation!==void 0&&h.quaternion.fromArray(n.rotation),n.scale!==void 0&&h.scale.fromArray(n.scale);if(!r.associations.has(h))r.associations.set(h,{});else if(n.mesh!==void 0&&r.meshCache.refs[n.mesh]>1){let u=r.associations.get(h);r.associations.set(h,{...u})}return r.associations.get(h).nodes=e,h}),this.nodeCache[e]}loadScene(e){let t=this.extensions,i=this.json.scenes[e],r=this,n=new vt;i.name&&(n.name=r.createUniqueName(i.name)),Bi(n,i),i.extensions&&vn(t,n,i);let s=i.nodes||[],a=[];for(let l=0,c=s.length;l<c;l++)a.push(r.getDependency("node",s[l]));return Promise.all(a).then(function(l){for(let h=0,u=l.length;h<u;h++){let d=l[h];d.parent!==null?n.add(o0(d)):n.add(d)}let c=h=>{let u=new Map;for(let[d,f]of r.associations)(d instanceof te||d instanceof ne)&&u.set(d,f);return h.traverse(d=>{let f=r.associations.get(d);f!=null&&u.set(d,f)}),u};return r.associations=c(n),n})}_createAnimationTracks(e,t,i,r,n){let s=[],a=e.name?e.name:e.uuid,l=[];function c(f){f.morphTargetInfluences&&l.push(f.name?f.name:f.uuid)}Er[n.path]===Er.weights?(c(e),e.isGroup&&e.children.forEach(c)):l.push(a);let h;switch(Er[n.path]){case Er.weights:h=fi;break;case Er.rotation:h=ti;break;case Er.translation:case Er.scale:h=mi;break;default:switch(i.itemSize){case 1:h=fi;break;case 2:case 3:default:h=mi;break}break}let u=r.interpolation!==void 0?Sb[r.interpolation]:tr,d=this._getArrayFromAccessor(i);for(let f=0,p=l.length;f<p;f++){let m=new h(l[f]+"."+Er[n.path],t.array,d,u);r.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(m),s.push(m)}return s}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){let i=nf(t.constructor),r=new Float32Array(t.length);for(let n=0,s=t.length;n<s;n++)r[n]=t[n]*i;t=r}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(i){let r=this instanceof ti?tf:Mh;return new r(this.times,this.values,this.getValueSize()/3,i)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}};function Pb(o,e,t){let i=e.attributes,r=new ye;if(i.POSITION!==void 0){let a=t.json.accessors[i.POSITION],l=a.min,c=a.max;if(l!==void 0&&c!==void 0){if(r.set(new w(l[0],l[1],l[2]),new w(c[0],c[1],c[2])),a.normalized){let h=nf(Ao[a.componentType]);r.min.multiplyScalar(h),r.max.multiplyScalar(h)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;let n=e.targets;if(n!==void 0){let a=new w,l=new w;for(let c=0,h=n.length;c<h;c++){let u=n[c];if(u.POSITION!==void 0){let d=t.json.accessors[u.POSITION],f=d.min,p=d.max;if(f!==void 0&&p!==void 0){if(l.setX(Math.max(Math.abs(f[0]),Math.abs(p[0]))),l.setY(Math.max(Math.abs(f[1]),Math.abs(p[1]))),l.setZ(Math.max(Math.abs(f[2]),Math.abs(p[2]))),d.normalized){let m=nf(Ao[d.componentType]);l.multiplyScalar(m)}a.max(l)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}r.expandByVector(a)}o.boundingBox=r;let s=new pe;r.getCenter(s.center),s.radius=r.min.distanceTo(r.max)/2,o.boundingSphere=s}function u0(o,e,t){let i=e.attributes,r=[];function n(s,a){return t.getDependency("accessor",s).then(function(l){o.setAttribute(a,l)})}for(let s in i){let a=rf[s]||s.toLowerCase();a in o.attributes||r.push(n(i[s],a))}if(e.indices!==void 0&&!o.index){let s=t.getDependency("accessor",e.indices).then(function(a){o.setIndex(a)});r.push(s)}return ze.workingColorSpace!==ct&&"COLOR_0"in i&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${ze.workingColorSpace}" not supported.`),Bi(o,e),Pb(o,e,t),Promise.all(r).then(function(){return e.targets!==void 0?Tb(o,e.targets,t):o})}R_(vd(!1));N_(ae);var f0=new WeakSet,of=class extends ba{fromScene(e,t=0,i=.1,r=100,n={}){let s=this._renderer;return s instanceof Mo?(f0.has(s)||(f0.add(s),console.warn("three: R1 omits PMREM scene environments (offscreen CubeUV targets are unavailable); direct lighting remains active.")),{texture:null,dispose(){}}):super.fromScene(e,t,i,r,n)}};return v0(Lb);})();
