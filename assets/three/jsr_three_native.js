var THREE=(()=>{var nh=Object.defineProperty;var y_=Object.getOwnPropertyDescriptor;var v_=Object.getOwnPropertyNames;var b_=Object.prototype.hasOwnProperty;var sh=(l,e)=>{for(var t in e)nh(l,t,{get:e[t],enumerable:!0})},S_=(l,e,t,i)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of v_(e))!b_.call(l,r)&&r!==t&&nh(l,r,{get:()=>e[r],enumerable:!(i=y_(e,r))||i.enumerable});return l};var M_=l=>S_(nh({},"__esModule",{value:!0}),l);var cb={};sh(cb,{ACESFilmicToneMapping:()=>ax,AddEquation:()=>ah,AddOperation:()=>rx,AdditiveAnimationBlendMode:()=>Po,AdditiveBlending:()=>D_,AgXToneMapping:()=>cx,AlphaFormat:()=>wo,AlwaysCompare:()=>Wx,AlwaysDepth:()=>xa,AlwaysStencilFunc:()=>yh,AmbientLight:()=>Ws,AnimationAction:()=>ro,AnimationClip:()=>vt,AnimationLoader:()=>Xl,AnimationMixer:()=>ra,AnimationObjectGroup:()=>cc,AnimationUtils:()=>Hl,ArcCurve:()=>Jo,ArrayCamera:()=>sc,ArrowHelper:()=>Fc,AttachedBindMode:()=>wa,Audio:()=>to,AudioAnalyser:()=>lc,AudioContext:()=>fr,AudioListener:()=>oc,AudioLoader:()=>rc,AxesHelper:()=>Uc,BackSide:()=>wi,BasicDepthPacking:()=>xh,BasicShadowMap:()=>R_,BatchedMesh:()=>xs,BezierInterpolant:()=>ks,Bone:()=>hi,BooleanKeyframeTrack:()=>ti,Box2:()=>no,Box3:()=>he,Box3Helper:()=>Dc,BoxGeometry:()=>nr,BoxHelper:()=>Nc,BufferAttribute:()=>K,BufferGeometry:()=>L,BufferGeometryLoader:()=>Js,ByteType:()=>go,Cache:()=>Je,Camera:()=>_i,CameraHelper:()=>Pc,CanvasTexture:()=>_l,CapsuleGeometry:()=>bl,CatmullRomCurve3:()=>Ko,CineonToneMapping:()=>ox,CircleGeometry:()=>Sl,ClampToEdgeWrapping:()=>Ue,Clock:()=>gc,Color:()=>I,ColorKeyframeTrack:()=>Kr,ColorManagement:()=>Le,Compatibility:()=>n0,CompressedArrayTexture:()=>ml,CompressedCubeTexture:()=>gl,CompressedTexture:()=>fi,CompressedTextureLoader:()=>Yl,ConeGeometry:()=>Ss,ConstantAlphaFactor:()=>ex,ConstantColorFactor:()=>$_,Controls:()=>kc,CubeCamera:()=>Qs,CubeDepthTexture:()=>yl,CubeReflectionMapping:()=>Ft,CubeRefractionMapping:()=>fn,CubeTexture:()=>di,CubeTextureLoader:()=>Zl,CubeUVReflectionMapping:()=>po,CubicBezierCurve:()=>Hr,CubicBezierCurve3:()=>jo,CubicInterpolant:()=>Us,CullFaceBack:()=>C_,CullFaceFront:()=>E_,CullFaceFrontBack:()=>I_,CullFaceNone:()=>T_,Curve:()=>we,CurvePath:()=>Ms,CustomBlending:()=>F_,CustomToneMapping:()=>lx,CylinderGeometry:()=>bs,Cylindrical:()=>xc,Data3DTexture:()=>Xi,DataArrayTexture:()=>Kn,DataTexture:()=>ze,DataTextureLoader:()=>Jl,DataUtils:()=>Va,DecrementStencilOp:()=>Tx,DecrementWrapStencilOp:()=>Ex,DefaultLoadingManager:()=>ql,DepthFormat:()=>Vi,DepthStencilFormat:()=>To,DepthTexture:()=>vs,DetachedBindMode:()=>hh,DirectionalLight:()=>hr,DirectionalLightHelper:()=>Ic,DiscreteInterpolant:()=>zs,DodecahedronGeometry:()=>Ml,DoubleSide:()=>uo,DstAlphaFactor:()=>Y_,DstColorFactor:()=>J_,DynamicCopyUsage:()=>jx,DynamicDrawUsage:()=>qx,DynamicReadUsage:()=>Zx,EdgesGeometry:()=>Cl,EllipseCurve:()=>Ni,EqualCompare:()=>zx,EqualDepth:()=>va,EqualStencilFunc:()=>Lx,EquirectangularReflectionMapping:()=>uh,EquirectangularRefractionMapping:()=>fh,Euler:()=>Ge,EventDispatcher:()=>Ie,ExternalTexture:()=>vl,ExtrudeGeometry:()=>Pl,FileLoader:()=>gr,Float16BufferAttribute:()=>Hh,Float32BufferAttribute:()=>R,FloatType:()=>gt,Fog:()=>ts,FogExp2:()=>es,FramebufferTexture:()=>pl,FrontSide:()=>Mi,Frustum:()=>Lt,FrustumArray:()=>_s,GLBufferAttribute:()=>pc,GLSL1:()=>Qx,GLSL3:()=>e0,GLTFLoader:()=>th,GreaterCompare:()=>Vx,GreaterDepth:()=>Sa,GreaterEqualCompare:()=>Hx,GreaterEqualDepth:()=>ba,GreaterEqualStencilFunc:()=>Ox,GreaterStencilFunc:()=>Dx,GridHelper:()=>Tc,Group:()=>ct,HTMLTexture:()=>xl,HalfFloatType:()=>Sr,HemisphereLight:()=>Hs,HemisphereLightHelper:()=>Ac,IcosahedronGeometry:()=>Ll,ImageBitmapLoader:()=>Ks,ImageLoader:()=>Bi,ImageUtils:()=>Jn,IncrementStencilOp:()=>Ax,IncrementWrapStencilOp:()=>Cx,InstancedBufferAttribute:()=>it,InstancedBufferGeometry:()=>Zs,InstancedInterleavedBuffer:()=>dc,InstancedMesh:()=>tr,Int16BufferAttribute:()=>Vh,Int32BufferAttribute:()=>Gh,Int8BufferAttribute:()=>Uh,IntType:()=>yo,InterleavedBuffer:()=>It,InterleavedBufferAttribute:()=>Rt,Interpolant:()=>st,InterpolateBezier:()=>Aa,InterpolateDiscrete:()=>li,InterpolateLinear:()=>Gi,InterpolateSmooth:()=>Ro,InterpolationSamplingMode:()=>r0,InterpolationSamplingType:()=>i0,InvertStencilOp:()=>Ix,JsrThreeCanvas:()=>la,KeepStencilOp:()=>No,KeyframeTrack:()=>Re,LOD:()=>ms,LatheGeometry:()=>Nl,Layers:()=>Zi,LessCompare:()=>Ux,LessDepth:()=>ya,LessEqualCompare:()=>kx,LessEqualDepth:()=>hn,LessEqualStencilFunc:()=>Nx,LessStencilFunc:()=>Px,Light:()=>qe,LightProbe:()=>Xs,LightShadow:()=>mi,Line:()=>ke,Line3:()=>bc,LineBasicMaterial:()=>re,LineCurve:()=>Wr,LineCurve3:()=>$o,LineDashedMaterial:()=>Fs,LineLoop:()=>ir,LineSegments:()=>Me,LinearFilter:()=>de,LinearInterpolant:()=>or,LinearMipMapLinearFilter:()=>px,LinearMipMapNearestFilter:()=>dx,LinearMipmapLinearFilter:()=>Ut,LinearMipmapNearestFilter:()=>mo,LinearSRGBColorSpace:()=>$e,LinearToneMapping:()=>nx,LinearTransfer:()=>Ta,Loader:()=>le,LoaderUtils:()=>Dt,LoadingManager:()=>jr,LoopOnce:()=>ph,LoopPingPong:()=>gh,LoopRepeat:()=>mh,MOUSE:()=>w_,Material:()=>$,MaterialBlending:()=>U_,MaterialLoader:()=>Ys,MathUtils:()=>Ia,Matrix2:()=>yc,Matrix3:()=>Y,Matrix4:()=>F,MaxEquation:()=>G_,Mesh:()=>ae,MeshBasicMaterial:()=>Se,MeshDepthMaterial:()=>Ds,MeshDistanceMaterial:()=>Bs,MeshLambertMaterial:()=>Ns,MeshMatcapMaterial:()=>Os,MeshNormalMaterial:()=>Ls,MeshPhongMaterial:()=>Rs,MeshPhysicalMaterial:()=>Ze,MeshStandardMaterial:()=>ei,MeshToonMaterial:()=>Ps,MinEquation:()=>V_,MirroredRepeatWrapping:()=>Yt,MixOperation:()=>ix,MultiplyBlending:()=>O_,MultiplyOperation:()=>yr,NearestFilter:()=>fe,NearestMipMapLinearFilter:()=>fx,NearestMipMapNearestFilter:()=>ux,NearestMipmapLinearFilter:()=>br,NearestMipmapNearestFilter:()=>vr,NeutralToneMapping:()=>hx,NeverCompare:()=>Fx,NeverDepth:()=>_a,NeverStencilFunc:()=>Rx,NoBlending:()=>zi,NoColorSpace:()=>Pr,NoNormalPacking:()=>vx,NoToneMapping:()=>un,NormalAnimationBlendMode:()=>Rr,NormalBlending:()=>fo,NormalGAPacking:()=>Sx,NormalRGPacking:()=>bx,NotEqualCompare:()=>Gx,NotEqualDepth:()=>Ma,NotEqualStencilFunc:()=>Bx,NumberKeyframeTrack:()=>ii,Object3D:()=>G,ObjectLoader:()=>tc,ObjectSpaceNormalMap:()=>yx,OctahedronGeometry:()=>As,OneFactor:()=>W_,OneMinusConstantAlphaFactor:()=>tx,OneMinusConstantColorFactor:()=>Q_,OneMinusDstAlphaFactor:()=>Z_,OneMinusDstColorFactor:()=>K_,OneMinusSrcAlphaFactor:()=>ch,OneMinusSrcColorFactor:()=>X_,OrthographicCamera:()=>qt,PCFShadowMap:()=>P_,PCFSoftShadowMap:()=>L_,PMREMGenerator:()=>Hc,Path:()=>pi,PerspectiveCamera:()=>ge,Plane:()=>Pt,PlaneGeometry:()=>Dl,PlaneHelper:()=>Bc,PointLight:()=>cr,PointLightHelper:()=>wc,Points:()=>rr,PointsMaterial:()=>ui,PolarGridHelper:()=>Cc,PolyhedronGeometry:()=>Gt,PositionalAudio:()=>ac,PropertyBinding:()=>ne,PropertyMixer:()=>io,QuadraticBezierCurve:()=>qr,QuadraticBezierCurve3:()=>Xr,Quaternion:()=>ce,QuaternionKeyframeTrack:()=>Wt,QuaternionLinearInterpolant:()=>Vs,R11_EAC_Format:()=>vn,RED_GREEN_RGTC2_Format:()=>Hn,RED_RGTC1_Format:()=>Vn,REVISION:()=>oh,RG11_EAC_Format:()=>Sn,RGBADepthPacking:()=>gx,RGBAFormat:()=>je,RGBAIntegerFormat:()=>Io,RGBA_ASTC_10x10_Format:()=>Bn,RGBA_ASTC_10x5_Format:()=>Ln,RGBA_ASTC_10x6_Format:()=>Nn,RGBA_ASTC_10x8_Format:()=>Dn,RGBA_ASTC_12x10_Format:()=>On,RGBA_ASTC_12x12_Format:()=>Fn,RGBA_ASTC_4x4_Format:()=>wn,RGBA_ASTC_5x4_Format:()=>An,RGBA_ASTC_5x5_Format:()=>Tn,RGBA_ASTC_6x5_Format:()=>Cn,RGBA_ASTC_6x6_Format:()=>En,RGBA_ASTC_8x5_Format:()=>In,RGBA_ASTC_8x6_Format:()=>Rn,RGBA_ASTC_8x8_Format:()=>Pn,RGBA_BPTC_Format:()=>Un,RGBA_ETC2_EAC_Format:()=>yn,RGBA_PVRTC_2BPPV1_Format:()=>gn,RGBA_PVRTC_4BPPV1_Format:()=>mn,RGBA_S3TC_DXT1_Format:()=>Tr,RGBA_S3TC_DXT3_Format:()=>Cr,RGBA_S3TC_DXT5_Format:()=>Er,RGBDepthPacking:()=>_x,RGBFormat:()=>Ao,RGBIntegerFormat:()=>mx,RGB_BPTC_SIGNED_Format:()=>zn,RGB_BPTC_UNSIGNED_Format:()=>kn,RGB_ETC1_Format:()=>_n,RGB_ETC2_Format:()=>xn,RGB_PVRTC_2BPPV1_Format:()=>pn,RGB_PVRTC_4BPPV1_Format:()=>dn,RGB_S3TC_DXT1_Format:()=>Ar,RGDepthPacking:()=>xx,RGFormat:()=>Co,RGIntegerFormat:()=>Eo,RawShaderMaterial:()=>Is,Ray:()=>xt,Raycaster:()=>mc,RectAreaLight:()=>qs,RedFormat:()=>Mr,RedIntegerFormat:()=>wr,ReinhardToneMapping:()=>sx,RenderObjectRefreshType:()=>s0,RenderTarget:()=>qi,RenderTarget3D:()=>hc,RepeatWrapping:()=>wt,ReplaceStencilOp:()=>wx,ReverseSubtractEquation:()=>k_,RingGeometry:()=>Bl,SIGNED_R11_EAC_Format:()=>bn,SIGNED_RED_GREEN_RGTC2_Format:()=>Wn,SIGNED_RED_RGTC1_Format:()=>Gn,SIGNED_RG11_EAC_Format:()=>Mn,SRGBColorSpace:()=>me,SRGBTransfer:()=>be,Scene:()=>is,ShaderChunk:()=>Q,ShaderLib:()=>Gc,ShaderMaterial:()=>dt,ShadowMaterial:()=>Cs,Shape:()=>Ht,ShapeGeometry:()=>Ol,ShapePath:()=>zc,ShapeUtils:()=>ft,ShortType:()=>_o,Skeleton:()=>er,SkeletonHelper:()=>na,SkinnedMesh:()=>Qi,Source:()=>Ra,Sphere:()=>oe,SphereGeometry:()=>Ts,Spherical:()=>_c,SphericalHarmonics3:()=>ur,SplineCurve:()=>Yr,SpotLight:()=>lr,SpotLightHelper:()=>Sc,Sprite:()=>ps,SpriteMaterial:()=>$i,SrcAlphaFactor:()=>lh,SrcAlphaSaturateFactor:()=>j_,SrcColorFactor:()=>q_,StaticCopyUsage:()=>Kx,StaticDrawUsage:()=>Lr,StaticReadUsage:()=>Yx,StereoCamera:()=>nc,StreamCopyUsage:()=>$x,StreamDrawUsage:()=>Xx,StreamReadUsage:()=>Jx,StringKeyframeTrack:()=>ri,SubtractEquation:()=>z_,SubtractiveBlending:()=>B_,TOUCH:()=>A_,TangentSpaceNormalMap:()=>At,TetrahedronGeometry:()=>Fl,Texture:()=>te,TextureLoader:()=>ln,TextureSource:()=>et,TextureUtils:()=>Vc,ThreeCapabilityError:()=>oa,ThreeCompatibilityRuntime:()=>ca,Timer:()=>eo,TimestampQuery:()=>t0,TorusGeometry:()=>Ul,TorusKnotGeometry:()=>zl,Triangle:()=>_t,TriangleFanDrawMode:()=>qn,TriangleStripDrawMode:()=>Lo,TrianglesDrawMode:()=>_h,TubeGeometry:()=>kl,UVMapping:()=>ki,Uint16BufferAttribute:()=>Fo,Uint32BufferAttribute:()=>Uo,Uint8BufferAttribute:()=>zh,Uint8ClampedBufferAttribute:()=>kh,Uniform:()=>uc,UniformsGroup:()=>fc,UniformsLib:()=>O,UniformsUtils:()=>vd,UnsignedByteType:()=>Zt,UnsignedInt101111Type:()=>Mo,UnsignedInt248Type:()=>dh,UnsignedInt5999Type:()=>So,UnsignedIntType:()=>Jt,UnsignedShort4444Type:()=>vo,UnsignedShort5551Type:()=>bo,UnsignedShortType:()=>xo,VSMShadowMap:()=>N_,Vector2:()=>T,Vector3:()=>y,Vector4:()=>Ne,VectorKeyframeTrack:()=>ni,VideoFrameTexture:()=>dl,VideoTexture:()=>ys,WebGL3DRenderTarget:()=>La,WebGLArrayRenderTarget:()=>Pa,WebGLCoordinateSystem:()=>Xe,WebGLCubeRenderTarget:()=>qc,WebGLRenderTarget:()=>kt,WebGLRenderer:()=>eh,WebGLUtils:()=>Lg,WebGPUCoordinateSystem:()=>zt,WebGPURenderer:()=>Xc,WebXRController:()=>Oa,WireframeGeometry:()=>Vl,WrapAroundEnding:()=>Ir,ZeroCurvatureEnding:()=>Ai,ZeroFactor:()=>H_,ZeroSlopeEnding:()=>Ti,ZeroStencilOp:()=>Mx,createCanvasElement:()=>Mf,error:()=>Z,getConsoleFunction:()=>Af,getNativeRaycastDiagnostics:()=>zg,log:()=>Do,setConsoleFunction:()=>wf,warn:()=>B,warnOnce:()=>Tt});var oh="186",w_={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},A_={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},T_=0,C_=1,E_=2,I_=3,R_=0,P_=1,L_=2,N_=3,Mi=0,wi=1,uo=2,zi=0,fo=1,D_=2,B_=3,O_=4,F_=5,U_=6,ah=100,z_=101,k_=102,V_=103,G_=104,H_=200,W_=201,q_=202,X_=203,lh=204,ch=205,Y_=206,Z_=207,J_=208,K_=209,j_=210,$_=211,Q_=212,ex=213,tx=214,_a=0,xa=1,ya=2,hn=3,va=4,ba=5,Sa=6,Ma=7,yr=0,ix=1,rx=2,un=0,nx=1,sx=2,ox=3,ax=4,lx=5,cx=6,hx=7,wa="attached",hh="detached",ki=300,Ft=301,fn=302,uh=303,fh=304,po=306,wt=1e3,Ue=1001,Yt=1002,fe=1003,vr=1004,ux=1004,br=1005,fx=1005,de=1006,mo=1007,dx=1007,Ut=1008,px=1008,Zt=1009,go=1010,_o=1011,xo=1012,yo=1013,Jt=1014,gt=1015,Sr=1016,vo=1017,bo=1018,dh=1020,So=35902,Mo=35899,wo=1021,Ao=1022,je=1023,Vi=1026,To=1027,Mr=1028,wr=1029,Co=1030,Eo=1031,mx=1032,Io=1033,Ar=33776,Tr=33777,Cr=33778,Er=33779,dn=35840,pn=35841,mn=35842,gn=35843,_n=36196,xn=37492,yn=37496,vn=37488,bn=37489,Sn=37490,Mn=37491,wn=37808,An=37809,Tn=37810,Cn=37811,En=37812,In=37813,Rn=37814,Pn=37815,Ln=37816,Nn=37817,Dn=37818,Bn=37819,On=37820,Fn=37821,Un=36492,zn=36494,kn=36495,Vn=36283,Gn=36284,Hn=36285,Wn=36286,ph=2200,mh=2201,gh=2202,li=2300,Gi=2301,Ro=2302,Aa=2303,Ai=2400,Ti=2401,Ir=2402,Rr=2500,Po=2501,_h=0,Lo=1,qn=2,xh=3200,gx=3201,_x=3202,xx=3203,At=0,yx=1,Pr="",me="srgb",$e="srgb-linear",Ta="linear",be="srgb",vx="",bx="rg",Sx="ga",Mx=0,No=7680,wx=7681,Ax=7682,Tx=7683,Cx=34055,Ex=34056,Ix=5386,Rx=512,Px=513,Lx=514,Nx=515,Dx=516,Bx=517,Ox=518,yh=519,Fx=512,Ux=513,zx=514,kx=515,Vx=516,Gx=517,Hx=518,Wx=519,Lr=35044,qx=35048,Xx=35040,Yx=35045,Zx=35049,Jx=35041,Kx=35046,jx=35050,$x=35042,Qx="100",e0="300 es",Xe=2e3,zt=2001,t0={COMPUTE:"compute",RENDER:"render"},i0={PERSPECTIVE:"perspective",LINEAR:"linear",FLAT:"flat"},r0={NORMAL:"normal",CENTROID:"centroid",SAMPLE:"sample",FIRST:"first",EITHER:"either"},n0={TEXTURE_COMPARE:"depthTextureCompare"},s0={NONE:0,SHARED:1,FULL:2};function Sf(l){for(let e=l.length-1;e>=0;--e)if(l[e]>=65535)return!0;return!1}var o0={Int8Array,Uint8Array,Uint8ClampedArray,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array};function Wi(l,e){return new o0[l](e)}function Ca(l){return ArrayBuffer.isView(l)&&!(l instanceof DataView)}function Xn(l){return document.createElementNS("http://www.w3.org/1999/xhtml",l)}function Mf(){let l=Xn("canvas");return l.style.display="block",l}var bf={},Hi=null;function wf(l){Hi=l}function Af(){return Hi}function Do(...l){let e="THREE."+l.shift();Hi?Hi("log",e,...l):console.log(e,...l)}function Tf(l){let e=l[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=l[1];t&&t.isStackTrace?l[0]+=" "+t.getLocation():l[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return l}function B(...l){l=Tf(l);let e="THREE."+l.shift();if(Hi)Hi("warn",e,...l);else{let t=l[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...l)}}function Z(...l){l=Tf(l);let e="THREE."+l.shift();if(Hi)Hi("error",e,...l);else{let t=l[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...l)}}function Tt(...l){let e=l.join(" ");e in bf||(bf[e]=!0,B(...l))}var db={[_a]:xa,[ya]:Sa,[va]:Ma,[hn]:ba,[xa]:_a,[Sa]:ya,[Ma]:va,[ba]:hn};var Ie=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){let i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){let i=this._listeners;if(i===void 0)return;let r=i[e];if(r!==void 0){let n=r.indexOf(t);n!==-1&&r.splice(n,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let i=t[e.type];if(i!==void 0){e.target=this;let r=i.slice(0);for(let n=0,s=r.length;n<s;n++)r[n].call(this,e);e.target=null}}};var Qe=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Cf=1234567,ci=Math.PI/180,Nr=180/Math.PI;function Te(){let l=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Qe[l&255]+Qe[l>>8&255]+Qe[l>>16&255]+Qe[l>>24&255]+"-"+Qe[e&255]+Qe[e>>8&255]+"-"+Qe[e>>16&15|64]+Qe[e>>24&255]+"-"+Qe[t&63|128]+Qe[t>>8&255]+"-"+Qe[t>>16&255]+Qe[t>>24&255]+Qe[i&255]+Qe[i>>8&255]+Qe[i>>16&255]+Qe[i>>24&255]).toLowerCase()}function k(l,e,t){return Math.max(e,Math.min(t,l))}function Ea(l,e){return(l%e+e)%e}function a0(l,e,t,i,r){return i+(l-e)*(r-i)/(t-e)}function l0(l,e,t){return l!==e?(t-l)/(e-l):0}function Yn(l,e,t){return(1-t)*l+t*e}function c0(l,e,t,i){return Yn(l,e,1-Math.exp(-t*i))}function h0(l,e=1){return e-Math.abs(Ea(l,e*2)-e)}function u0(l,e,t){return l<=e?0:l>=t?1:(l=(l-e)/(t-e),l*l*(3-2*l))}function f0(l,e,t){return l<=e?0:l>=t?1:(l=(l-e)/(t-e),l*l*l*(l*(l*6-15)+10))}function d0(l,e){return l+Math.floor(Math.random()*(e-l+1))}function p0(l,e){return l+Math.random()*(e-l)}function m0(l){return l*(.5-Math.random())}function g0(l){l!==void 0&&(Cf=l);let e=Cf+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function _0(l){return l*ci}function x0(l){return l*Nr}function y0(l){return l>0&&Number.isInteger(l)&&2**Math.round(Math.log2(l))===l}function v0(l){return Math.pow(2,Math.ceil(Math.log(l)/Math.LN2))}function b0(l){return Math.pow(2,Math.floor(Math.log(l)/Math.LN2))}function S0(l,e,t,i,r){let n=Math.cos,s=Math.sin,o=n(t/2),a=s(t/2),c=n((e+i)/2),h=s((e+i)/2),u=n((e-i)/2),f=s((e-i)/2),d=n((i-e)/2),p=s((i-e)/2);switch(r){case"XYX":l.set(o*h,a*u,a*f,o*c);break;case"YZY":l.set(a*f,o*h,a*u,o*c);break;case"ZXZ":l.set(a*u,a*f,o*h,o*c);break;case"XZX":l.set(o*h,a*p,a*d,o*c);break;case"YXY":l.set(a*d,o*h,a*p,o*c);break;case"ZYZ":l.set(a*p,a*d,o*h,o*c);break;default:B("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function Ye(l,e){switch(e.constructor){case Float32Array:return l;case Uint32Array:return l/4294967295;case Uint16Array:return l/65535;case Uint8Array:case Uint8ClampedArray:return l/255;case Int32Array:return Math.max(l/2147483647,-1);case Int16Array:return Math.max(l/32767,-1);case Int8Array:return Math.max(l/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function J(l,e){switch(e.constructor){case Float32Array:return l;case Uint32Array:return Math.round(l*4294967295);case Uint16Array:return Math.round(l*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(l*255);case Int32Array:return Math.round(l*2147483647);case Int16Array:return Math.round(l*32767);case Int8Array:return Math.round(l*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var Ia={DEG2RAD:ci,RAD2DEG:Nr,generateUUID:Te,clamp:k,euclideanModulo:Ea,mapLinear:a0,inverseLerp:l0,lerp:Yn,damp:c0,pingpong:h0,smoothstep:u0,smootherstep:f0,randInt:d0,randFloat:p0,randFloatSpread:m0,seededRandom:g0,degToRad:_0,radToDeg:x0,isPowerOfTwo:y0,ceilPowerOfTwo:v0,floorPowerOfTwo:b0,setQuaternionFromProperEuler:S0,normalize:J,denormalize:Ye};var vh=class vh{constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=k(this.x,e.x,t.x),this.y=k(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=k(this.x,e,t),this.y=k(this.y,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(k(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(k(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),r=Math.sin(t),n=this.x-e.x,s=this.y-e.y;return this.x=n*i-s*r+e.x,this.y=n*r+s*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};vh.prototype.isVector2=!0;var T=vh;var ce=class{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,n,s,o){let a=i[r+0],c=i[r+1],h=i[r+2],u=i[r+3],f=n[s+0],d=n[s+1],p=n[s+2],m=n[s+3];if(u!==m||a!==f||c!==d||h!==p){let g=a*f+c*d+h*p+u*m;g<0&&(f=-f,d=-d,p=-p,m=-m,g=-g);let _=1-o;if(g<.9995){let x=Math.acos(g),v=Math.sin(x);_=Math.sin(_*x)/v,o=Math.sin(o*x)/v,a=a*_+f*o,c=c*_+d*o,h=h*_+p*o,u=u*_+m*o}else{a=a*_+f*o,c=c*_+d*o,h=h*_+p*o,u=u*_+m*o;let x=1/Math.sqrt(a*a+c*c+h*h+u*u);a*=x,c*=x,h*=x,u*=x}}e[t]=a,e[t+1]=c,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,i,r,n,s){let o=i[r],a=i[r+1],c=i[r+2],h=i[r+3],u=n[s],f=n[s+1],d=n[s+2],p=n[s+3];return e[t]=o*p+h*u+a*d-c*f,e[t+1]=a*p+h*f+c*u-o*d,e[t+2]=c*p+h*d+o*f-a*u,e[t+3]=h*p-o*u-a*f-c*d,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,r=e._y,n=e._z,s=e._order,o=Math.cos,a=Math.sin,c=o(i/2),h=o(r/2),u=o(n/2),f=a(i/2),d=a(r/2),p=a(n/2);switch(s){case"XYZ":this._x=f*h*u+c*d*p,this._y=c*d*u-f*h*p,this._z=c*h*p+f*d*u,this._w=c*h*u-f*d*p;break;case"YXZ":this._x=f*h*u+c*d*p,this._y=c*d*u-f*h*p,this._z=c*h*p-f*d*u,this._w=c*h*u+f*d*p;break;case"ZXY":this._x=f*h*u-c*d*p,this._y=c*d*u+f*h*p,this._z=c*h*p+f*d*u,this._w=c*h*u-f*d*p;break;case"ZYX":this._x=f*h*u-c*d*p,this._y=c*d*u+f*h*p,this._z=c*h*p-f*d*u,this._w=c*h*u+f*d*p;break;case"YZX":this._x=f*h*u+c*d*p,this._y=c*d*u+f*h*p,this._z=c*h*p-f*d*u,this._w=c*h*u-f*d*p;break;case"XZY":this._x=f*h*u-c*d*p,this._y=c*d*u-f*h*p,this._z=c*h*p+f*d*u,this._w=c*h*u+f*d*p;break;default:B("Quaternion: .setFromEuler() encountered an unknown order: "+s)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],r=t[4],n=t[8],s=t[1],o=t[5],a=t[9],c=t[2],h=t[6],u=t[10],f=i+o+u;if(f>0){let d=.5/Math.sqrt(f+1);this._w=.25/d,this._x=(h-a)*d,this._y=(n-c)*d,this._z=(s-r)*d}else if(i>o&&i>u){let d=2*Math.sqrt(1+i-o-u);this._w=(h-a)/d,this._x=.25*d,this._y=(r+s)/d,this._z=(n+c)/d}else if(o>u){let d=2*Math.sqrt(1+o-i-u);this._w=(n-c)/d,this._x=(r+s)/d,this._y=.25*d,this._z=(a+h)/d}else{let d=2*Math.sqrt(1+u-i-o);this._w=(s-r)/d,this._x=(n+c)/d,this._y=(a+h)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(k(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,r=e._y,n=e._z,s=e._w,o=t._x,a=t._y,c=t._z,h=t._w;return this._x=i*h+s*o+r*c-n*a,this._y=r*h+s*a+n*o-i*c,this._z=n*h+s*c+i*a-r*o,this._w=s*h-i*o-r*a-n*c,this._onChangeCallback(),this}slerp(e,t){let i=e._x,r=e._y,n=e._z,s=e._w,o=this.dot(e);o<0&&(i=-i,r=-r,n=-n,s=-s,o=-o);let a=1-t;if(o<.9995){let c=Math.acos(o),h=Math.sin(c);a=Math.sin(a*c)/h,t=Math.sin(t*c)/h,this._x=this._x*a+i*t,this._y=this._y*a+r*t,this._z=this._z*a+n*t,this._w=this._w*a+s*t,this._onChangeCallback()}else this._x=this._x*a+i*t,this._y=this._y*a+r*t,this._z=this._z*a+n*t,this._w=this._w*a+s*t,this.normalize();return this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),n=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),n*Math.sin(t),n*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}};var Sh=class Sh{constructor(e=0,t=0,i=0){this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Ef.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Ef.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,r=this.z,n=e.elements;return this.x=n[0]*t+n[3]*i+n[6]*r,this.y=n[1]*t+n[4]*i+n[7]*r,this.z=n[2]*t+n[5]*i+n[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,r=this.z,n=e.elements,s=1/(n[3]*t+n[7]*i+n[11]*r+n[15]);return this.x=(n[0]*t+n[4]*i+n[8]*r+n[12])*s,this.y=(n[1]*t+n[5]*i+n[9]*r+n[13])*s,this.z=(n[2]*t+n[6]*i+n[10]*r+n[14])*s,this}applyQuaternion(e){let t=this.x,i=this.y,r=this.z,n=e.x,s=e.y,o=e.z,a=e.w,c=2*(s*r-o*i),h=2*(o*t-n*r),u=2*(n*i-s*t);return this.x=t+a*c+s*u-o*h,this.y=i+a*h+o*c-n*u,this.z=r+a*u+n*h-s*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,r=this.z,n=e.elements;return this.x=n[0]*t+n[4]*i+n[8]*r,this.y=n[1]*t+n[5]*i+n[9]*r,this.z=n[2]*t+n[6]*i+n[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=k(this.x,e.x,t.x),this.y=k(this.y,e.y,t.y),this.z=k(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=k(this.x,e,t),this.y=k(this.y,e,t),this.z=k(this.z,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(k(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,r=e.y,n=e.z,s=t.x,o=t.y,a=t.z;return this.x=r*a-n*o,this.y=n*s-i*a,this.z=i*o-r*s,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return bh.copy(this).projectOnVector(e),this.sub(bh)}reflect(e){return this.sub(bh.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(k(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};Sh.prototype.isVector3=!0;var y=Sh,bh=new y,Ef=new ce;var wh=class wh{constructor(e,t,i,r,n,s,o,a,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,n,s,o,a,c)}set(e,t,i,r,n,s,o,a,c){let h=this.elements;return h[0]=e,h[1]=r,h[2]=o,h[3]=t,h[4]=n,h[5]=a,h[6]=i,h[7]=s,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,r=t.elements,n=this.elements,s=i[0],o=i[3],a=i[6],c=i[1],h=i[4],u=i[7],f=i[2],d=i[5],p=i[8],m=r[0],g=r[3],_=r[6],x=r[1],v=r[4],b=r[7],M=r[2],w=r[5],S=r[8];return n[0]=s*m+o*x+a*M,n[3]=s*g+o*v+a*w,n[6]=s*_+o*b+a*S,n[1]=c*m+h*x+u*M,n[4]=c*g+h*v+u*w,n[7]=c*_+h*b+u*S,n[2]=f*m+d*x+p*M,n[5]=f*g+d*v+p*w,n[8]=f*_+d*b+p*S,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],r=e[2],n=e[3],s=e[4],o=e[5],a=e[6],c=e[7],h=e[8];return t*s*h-t*o*c-i*n*h+i*o*a+r*n*c-r*s*a}invert(){let e=this.elements,t=e[0],i=e[1],r=e[2],n=e[3],s=e[4],o=e[5],a=e[6],c=e[7],h=e[8],u=h*s-o*c,f=o*a-h*n,d=c*n-s*a,p=t*u+i*f+r*d;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let m=1/p;return e[0]=u*m,e[1]=(r*c-h*i)*m,e[2]=(o*i-r*s)*m,e[3]=f*m,e[4]=(h*t-r*a)*m,e[5]=(r*n-o*t)*m,e[6]=d*m,e[7]=(i*a-c*t)*m,e[8]=(s*t-i*n)*m,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,n,s,o){let a=Math.cos(n),c=Math.sin(n);return this.set(i*a,i*c,-i*(a*s+c*o)+s+e,-r*c,r*a,-r*(-c*s+a*o)+o+t,0,0,1),this}scale(e,t){return Tt("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Mh.makeScale(e,t)),this}rotate(e){return Tt("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Mh.makeRotation(-e)),this}translate(e,t){return Tt("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Mh.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}};wh.prototype.isMatrix3=!0;var Y=wh,Mh=new Y;var If=new Y().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Rf=new Y().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function M0(){let l={enabled:!0,workingColorSpace:$e,spaces:{},convert:function(r,n,s){return this.enabled===!1||n===s||!n||!s||(this.spaces[n].transfer===be&&(r.r=Kt(r.r),r.g=Kt(r.g),r.b=Kt(r.b)),this.spaces[n].primaries!==this.spaces[s].primaries&&(r.applyMatrix3(this.spaces[n].toXYZ),r.applyMatrix3(this.spaces[s].fromXYZ)),this.spaces[s].transfer===be&&(r.r=Dr(r.r),r.g=Dr(r.g),r.b=Dr(r.b))),r},workingToColorSpace:function(r,n){return this.convert(r,this.workingColorSpace,n)},colorSpaceToWorking:function(r,n){return this.convert(r,n,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===Pr?Ta:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,n=this.workingColorSpace){return r.fromArray(this.spaces[n].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,n,s){return r.copy(this.spaces[n].toXYZ).multiply(this.spaces[s].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,n){return Tt("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),l.workingToColorSpace(r,n)},toWorkingColorSpace:function(r,n){return Tt("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),l.colorSpaceToWorking(r,n)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return l.define({[$e]:{primaries:e,whitePoint:i,transfer:Ta,toXYZ:If,fromXYZ:Rf,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:me},outputColorSpaceConfig:{drawingBufferColorSpace:me}},[me]:{primaries:e,whitePoint:i,transfer:be,toXYZ:If,fromXYZ:Rf,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:me}}}),l}var Le=M0();function Kt(l){return l<.04045?l*.0773993808:Math.pow(l*.9478672986+.0521327014,2.4)}function Dr(l){return l<.0031308?l*12.92:1.055*Math.pow(l,.41666)-.055}var Zn,Jn=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{Zn===void 0&&(Zn=Xn("canvas")),Zn.width=e.width,Zn.height=e.height;let r=Zn.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),i=Zn}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Xn("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let r=i.getImageData(0,0,e.width,e.height),n=r.data;for(let s=0;s<n.length;s++)n[s]=Kt(n[s]/255)*255;return i.putImageData(r,0,0),t}else if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(Kt(t[i]/255)*255):t[i]=Kt(t[i]);return{data:t,width:e.width,height:e.height}}else return B("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}};var w0=0,et=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:w0++}),this.uuid=Te(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let n;if(Array.isArray(r)){n=[];for(let s=0,o=r.length;s<o;s++)r[s].isDataTexture?n.push(Ah(r[s].image)):n.push(Ah(r[s]))}else n=Ah(r);i.url=n}return t||(e.images[this.uuid]=i),i}};function Ah(l){return typeof HTMLImageElement<"u"&&l instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&l instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&l instanceof ImageBitmap?Jn.getDataURL(l):l.data?{data:Array.from(l.data),width:l.width,height:l.height,type:l.data.constructor.name}:(B("Texture: Unable to serialize Texture."),{})}var Ra=class extends et{constructor(e=null){Tt('Source: "Source" has been renamed to "TextureSource". Please update your code to use "THREE.TextureSource" instead.'),super(e),this.isSource=!0}};var A0=0,Th=new y,te=class l extends Ie{constructor(e=l.DEFAULT_IMAGE,t=l.DEFAULT_MAPPING,i=Ue,r=Ue,n=de,s=Ut,o=je,a=Zt,c=l.DEFAULT_ANISOTROPY,h=Pr){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:A0++}),this.uuid=Te(),this.name="",this.source=new et(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=n,this.minFilter=s,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=a,this.offset=new T(0,0),this.repeat=new T(1,1),this.center=new T(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Y,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Th).x}get height(){return this.source.getSize(Th).y}get depth(){return this.source.getSize(Th).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let i=e[t];if(i===void 0){B(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){B(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&i&&r.isVector2&&i.isVector2||r&&i&&r.isVector3&&i.isVector3||r&&i&&r.isMatrix3&&i.isMatrix3?r.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==ki)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case wt:e.x=e.x-Math.floor(e.x);break;case Ue:e.x=e.x<0?0:1;break;case Yt:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case wt:e.y=e.y-Math.floor(e.y);break;case Ue:e.y=e.y<0?0:1;break;case Yt:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};te.DEFAULT_IMAGE=null;te.DEFAULT_MAPPING=ki;te.DEFAULT_ANISOTROPY=1;var Ch=class Ch{constructor(e=0,t=0,i=0,r=1){this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,r=this.z,n=this.w,s=e.elements;return this.x=s[0]*t+s[4]*i+s[8]*r+s[12]*n,this.y=s[1]*t+s[5]*i+s[9]*r+s[13]*n,this.z=s[2]*t+s[6]*i+s[10]*r+s[14]*n,this.w=s[3]*t+s[7]*i+s[11]*r+s[15]*n,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,n,a=e.elements,c=a[0],h=a[4],u=a[8],f=a[1],d=a[5],p=a[9],m=a[2],g=a[6],_=a[10];if(Math.abs(h-f)<.01&&Math.abs(u-m)<.01&&Math.abs(p-g)<.01){if(Math.abs(h+f)<.1&&Math.abs(u+m)<.1&&Math.abs(p+g)<.1&&Math.abs(c+d+_-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let v=(c+1)/2,b=(d+1)/2,M=(_+1)/2,w=(h+f)/4,S=(u+m)/4,A=(p+g)/4;return v>b&&v>M?v<.01?(i=0,r=.707106781,n=.707106781):(i=Math.sqrt(v),r=w/i,n=S/i):b>M?b<.01?(i=.707106781,r=0,n=.707106781):(r=Math.sqrt(b),i=w/r,n=A/r):M<.01?(i=.707106781,r=.707106781,n=0):(n=Math.sqrt(M),i=S/n,r=A/n),this.set(i,r,n,t),this}let x=Math.sqrt((g-p)*(g-p)+(u-m)*(u-m)+(f-h)*(f-h));return Math.abs(x)<.001&&(x=1),this.x=(g-p)/x,this.y=(u-m)/x,this.z=(f-h)/x,this.w=Math.acos((c+d+_-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=k(this.x,e.x,t.x),this.y=k(this.y,e.y,t.y),this.z=k(this.z,e.z,t.z),this.w=k(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=k(this.x,e,t),this.y=k(this.y,e,t),this.z=k(this.z,e,t),this.w=k(this.w,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(k(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Ch.prototype.isVector4=!0;var Ne=Ch;var qi=class extends Ie{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:de,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new Ne(0,0,e,t),this.scissorTest=!1,this.viewport=new Ne(0,0,e,t),this.textures=[];let r={width:e,height:t,depth:i.depth},n=new te(r),s=i.count;for(let o=0;o<s;o++)this.textures[o]=n.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveColorBuffer=i.resolveColorBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.storeMultisampledColorBuffer=i.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=i.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=i.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:de,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let r=0,n=this.textures.length;r<n;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=i,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let r=Object.assign({},e.textures[t].image);this.textures[t].source=new et(r)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}};var kt=class extends qi{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}};var Kn=class extends te{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=fe,this.minFilter=fe,this.wrapR=Ue,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var Pa=class extends kt{constructor(e=1,t=1,i=1,r={}){super(e,t,r),this.isWebGLArrayRenderTarget=!0,this.depth=i,this.texture=new Kn(null,e,t,i),this._setTextureOptions(r),this.texture.isRenderTargetTexture=!0}};var Xi=class extends te{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=fe,this.minFilter=fe,this.wrapR=Ue,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}};var La=class extends kt{constructor(e=1,t=1,i=1,r={}){super(e,t,r),this.isWebGL3DRenderTarget=!0,this.depth=i,this.texture=new Xi(null,e,t,i),this._setTextureOptions(r),this.texture.isRenderTargetTexture=!0}};var Da=class Da{constructor(e,t,i,r,n,s,o,a,c,h,u,f,d,p,m,g){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,n,s,o,a,c,h,u,f,d,p,m,g)}set(e,t,i,r,n,s,o,a,c,h,u,f,d,p,m,g){let _=this.elements;return _[0]=e,_[4]=t,_[8]=i,_[12]=r,_[1]=n,_[5]=s,_[9]=o,_[13]=a,_[2]=c,_[6]=h,_[10]=u,_[14]=f,_[3]=d,_[7]=p,_[11]=m,_[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Da().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),i.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,i=e.elements,r=1/jn.setFromMatrixColumn(e,0).length(),n=1/jn.setFromMatrixColumn(e,1).length(),s=1/jn.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*n,t[5]=i[5]*n,t[6]=i[6]*n,t[7]=0,t[8]=i[8]*s,t[9]=i[9]*s,t[10]=i[10]*s,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,r=e.y,n=e.z,s=Math.cos(i),o=Math.sin(i),a=Math.cos(r),c=Math.sin(r),h=Math.cos(n),u=Math.sin(n);if(e.order==="XYZ"){let f=s*h,d=s*u,p=o*h,m=o*u;t[0]=a*h,t[4]=-a*u,t[8]=c,t[1]=d+p*c,t[5]=f-m*c,t[9]=-o*a,t[2]=m-f*c,t[6]=p+d*c,t[10]=s*a}else if(e.order==="YXZ"){let f=a*h,d=a*u,p=c*h,m=c*u;t[0]=f+m*o,t[4]=p*o-d,t[8]=s*c,t[1]=s*u,t[5]=s*h,t[9]=-o,t[2]=d*o-p,t[6]=m+f*o,t[10]=s*a}else if(e.order==="ZXY"){let f=a*h,d=a*u,p=c*h,m=c*u;t[0]=f-m*o,t[4]=-s*u,t[8]=p+d*o,t[1]=d+p*o,t[5]=s*h,t[9]=m-f*o,t[2]=-s*c,t[6]=o,t[10]=s*a}else if(e.order==="ZYX"){let f=s*h,d=s*u,p=o*h,m=o*u;t[0]=a*h,t[4]=p*c-d,t[8]=f*c+m,t[1]=a*u,t[5]=m*c+f,t[9]=d*c-p,t[2]=-c,t[6]=o*a,t[10]=s*a}else if(e.order==="YZX"){let f=s*a,d=s*c,p=o*a,m=o*c;t[0]=a*h,t[4]=m-f*u,t[8]=p*u+d,t[1]=u,t[5]=s*h,t[9]=-o*h,t[2]=-c*h,t[6]=d*u+p,t[10]=f-m*u}else if(e.order==="XZY"){let f=s*a,d=s*c,p=o*a,m=o*c;t[0]=a*h,t[4]=-u,t[8]=c*h,t[1]=f*u+m,t[5]=s*h,t[9]=d*u-p,t[2]=p*u-d,t[6]=o*h,t[10]=m*u+f}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(T0,e,C0)}lookAt(e,t,i){let r=this.elements;return Ct.subVectors(e,t),Ct.lengthSq()===0&&(Ct.z=1),Ct.normalize(),Yi.crossVectors(i,Ct),Yi.lengthSq()===0&&(Math.abs(i.z)===1?Ct.x+=1e-4:Ct.z+=1e-4,Ct.normalize(),Yi.crossVectors(i,Ct)),Yi.normalize(),Na.crossVectors(Ct,Yi),r[0]=Yi.x,r[4]=Na.x,r[8]=Ct.x,r[1]=Yi.y,r[5]=Na.y,r[9]=Ct.y,r[2]=Yi.z,r[6]=Na.z,r[10]=Ct.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,r=t.elements,n=this.elements,s=i[0],o=i[4],a=i[8],c=i[12],h=i[1],u=i[5],f=i[9],d=i[13],p=i[2],m=i[6],g=i[10],_=i[14],x=i[3],v=i[7],b=i[11],M=i[15],w=r[0],S=r[4],A=r[8],C=r[12],E=r[1],P=r[5],V=r[9],W=r[13],ee=r[2],X=r[6],ue=r[10],_e=r[14],Ve=r[3],pe=r[7],xe=r[11],ye=r[15];return n[0]=s*w+o*E+a*ee+c*Ve,n[4]=s*S+o*P+a*X+c*pe,n[8]=s*A+o*V+a*ue+c*xe,n[12]=s*C+o*W+a*_e+c*ye,n[1]=h*w+u*E+f*ee+d*Ve,n[5]=h*S+u*P+f*X+d*pe,n[9]=h*A+u*V+f*ue+d*xe,n[13]=h*C+u*W+f*_e+d*ye,n[2]=p*w+m*E+g*ee+_*Ve,n[6]=p*S+m*P+g*X+_*pe,n[10]=p*A+m*V+g*ue+_*xe,n[14]=p*C+m*W+g*_e+_*ye,n[3]=x*w+v*E+b*ee+M*Ve,n[7]=x*S+v*P+b*X+M*pe,n[11]=x*A+v*V+b*ue+M*xe,n[15]=x*C+v*W+b*_e+M*ye,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],r=e[8],n=e[12],s=e[1],o=e[5],a=e[9],c=e[13],h=e[2],u=e[6],f=e[10],d=e[14],p=e[3],m=e[7],g=e[11],_=e[15],x=a*d-c*f,v=o*d-c*u,b=o*f-a*u,M=s*d-c*h,w=s*f-a*h,S=s*u-o*h;return t*(m*x-g*v+_*b)-i*(p*x-g*M+_*w)+r*(p*v-m*M+_*S)-n*(p*b-m*w+g*S)}determinantAffine(){let e=this.elements,t=e[0],i=e[4],r=e[8],n=e[1],s=e[5],o=e[9],a=e[2],c=e[6],h=e[10];return t*(s*h-o*c)-i*(n*h-o*a)+r*(n*c-s*a)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],r=e[2],n=e[3],s=e[4],o=e[5],a=e[6],c=e[7],h=e[8],u=e[9],f=e[10],d=e[11],p=e[12],m=e[13],g=e[14],_=e[15],x=t*o-i*s,v=t*a-r*s,b=t*c-n*s,M=i*a-r*o,w=i*c-n*o,S=r*c-n*a,A=h*m-u*p,C=h*g-f*p,E=h*_-d*p,P=u*g-f*m,V=u*_-d*m,W=f*_-d*g,ee=x*W-v*V+b*P+M*E-w*C+S*A;if(ee===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let X=1/ee;return e[0]=(o*W-a*V+c*P)*X,e[1]=(r*V-i*W-n*P)*X,e[2]=(m*S-g*w+_*M)*X,e[3]=(f*w-u*S-d*M)*X,e[4]=(a*E-s*W-c*C)*X,e[5]=(t*W-r*E+n*C)*X,e[6]=(g*b-p*S-_*v)*X,e[7]=(h*S-f*b+d*v)*X,e[8]=(s*V-o*E+c*A)*X,e[9]=(i*E-t*V-n*A)*X,e[10]=(p*w-m*b+_*x)*X,e[11]=(u*b-h*w-d*x)*X,e[12]=(o*C-s*P-a*A)*X,e[13]=(t*P-i*C+r*A)*X,e[14]=(m*v-p*M-g*x)*X,e[15]=(h*M-u*v+f*x)*X,this}scale(e){let t=this.elements,i=e.x,r=e.y,n=e.z;return t[0]*=i,t[4]*=r,t[8]*=n,t[1]*=i,t[5]*=r,t[9]*=n,t[2]*=i,t[6]*=r,t[10]*=n,t[3]*=i,t[7]*=r,t[11]*=n,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),r=Math.sin(t),n=1-i,s=e.x,o=e.y,a=e.z,c=n*s,h=n*o;return this.set(c*s+i,c*o-r*a,c*a+r*o,0,c*o+r*a,h*o+i,h*a-r*s,0,c*a-r*o,h*a+r*s,n*a*a+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,n,s){return this.set(1,i,n,0,e,1,s,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){let r=this.elements,n=t._x,s=t._y,o=t._z,a=t._w,c=n+n,h=s+s,u=o+o,f=n*c,d=n*h,p=n*u,m=s*h,g=s*u,_=o*u,x=a*c,v=a*h,b=a*u,M=i.x,w=i.y,S=i.z;return r[0]=(1-(m+_))*M,r[1]=(d+b)*M,r[2]=(p-v)*M,r[3]=0,r[4]=(d-b)*w,r[5]=(1-(f+_))*w,r[6]=(g+x)*w,r[7]=0,r[8]=(p+v)*S,r[9]=(g-x)*S,r[10]=(1-(f+m))*S,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let n=this.determinantAffine();if(n===0)return i.set(1,1,1),t.identity(),this;let s=jn.set(r[0],r[1],r[2]).length(),o=jn.set(r[4],r[5],r[6]).length(),a=jn.set(r[8],r[9],r[10]).length();n<0&&(s=-s),jt.copy(this);let c=1/s,h=1/o,u=1/a;return jt.elements[0]*=c,jt.elements[1]*=c,jt.elements[2]*=c,jt.elements[4]*=h,jt.elements[5]*=h,jt.elements[6]*=h,jt.elements[8]*=u,jt.elements[9]*=u,jt.elements[10]*=u,t.setFromRotationMatrix(jt),i.x=s,i.y=o,i.z=a,this}makePerspective(e,t,i,r,n,s,o=Xe,a=!1){let c=this.elements,h=2*n/(t-e),u=2*n/(i-r),f=(t+e)/(t-e),d=(i+r)/(i-r),p,m;if(a)p=n/(s-n),m=s*n/(s-n);else if(o===Xe)p=-(s+n)/(s-n),m=-2*s*n/(s-n);else if(o===zt)p=-s/(s-n),m=-s*n/(s-n);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=f,c[12]=0,c[1]=0,c[5]=u,c[9]=d,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,i,r,n,s,o=Xe,a=!1){let c=this.elements,h=2/(t-e),u=2/(i-r),f=-(t+e)/(t-e),d=-(i+r)/(i-r),p,m;if(a)p=1/(s-n),m=s/(s-n);else if(o===Xe)p=-2/(s-n),m=-(s+n)/(s-n);else if(o===zt)p=-1/(s-n),m=-n/(s-n);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=0,c[12]=f,c[1]=0,c[5]=u,c[9]=0,c[13]=d,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}};Da.prototype.isMatrix4=!0;var F=Da,jn=new y,jt=new F,T0=new y(0,0,0),C0=new y(1,1,1),Yi=new y,Na=new y,Ct=new y;var Pf=new F,Lf=new ce,Ge=class l{constructor(e=0,t=0,i=0,r=l.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let r=e.elements,n=r[0],s=r[4],o=r[8],a=r[1],c=r[5],h=r[9],u=r[2],f=r[6],d=r[10];switch(t){case"XYZ":this._y=Math.asin(k(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,d),this._z=Math.atan2(-s,n)):(this._x=Math.atan2(f,c),this._z=0);break;case"YXZ":this._x=Math.asin(-k(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,d),this._z=Math.atan2(a,c)):(this._y=Math.atan2(-u,n),this._z=0);break;case"ZXY":this._x=Math.asin(k(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-u,d),this._z=Math.atan2(-s,c)):(this._y=0,this._z=Math.atan2(a,n));break;case"ZYX":this._y=Math.asin(-k(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(f,d),this._z=Math.atan2(a,n)):(this._x=0,this._z=Math.atan2(-s,c));break;case"YZX":this._z=Math.asin(k(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,n)):(this._x=0,this._y=Math.atan2(o,d));break;case"XZY":this._z=Math.asin(-k(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(f,c),this._y=Math.atan2(o,n)):(this._x=Math.atan2(-h,d),this._y=0);break;default:B("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return Pf.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Pf,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Lf.setFromEuler(this),this.setFromQuaternion(Lf,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Ge.DEFAULT_ORDER="XYZ";var Zi=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}};var E0=0,Nf=new y,$n=new ce,Ci=new F,Ba=new y,Bo=new y,I0=new y,R0=new ce,Df=new y(1,0,0),Bf=new y(0,1,0),Of=new y(0,0,1),Ff={type:"added"},P0={type:"removed"},Qn={type:"childadded",child:null},Eh={type:"childremoved",child:null},G=class l extends Ie{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:E0++}),this.uuid=Te(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=l.DEFAULT_UP.clone();let e=new y,t=new Ge,i=new ce,r=new y(1,1,1);function n(){i.setFromEuler(t,!1)}function s(){t.setFromQuaternion(i,void 0,!1)}t._onChange(n),i._onChange(s),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new F},normalMatrix:{value:new Y}}),this.matrix=new F,this.matrixWorld=new F,this.matrixAutoUpdate=l.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=l.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Zi,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return $n.setFromAxisAngle(e,t),this.quaternion.multiply($n),this}rotateOnWorldAxis(e,t){return $n.setFromAxisAngle(e,t),this.quaternion.premultiply($n),this}rotateX(e){return this.rotateOnAxis(Df,e)}rotateY(e){return this.rotateOnAxis(Bf,e)}rotateZ(e){return this.rotateOnAxis(Of,e)}translateOnAxis(e,t){return Nf.copy(e).applyQuaternion(this.quaternion),this.position.add(Nf.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Df,e)}translateY(e){return this.translateOnAxis(Bf,e)}translateZ(e){return this.translateOnAxis(Of,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Ci.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Ba.copy(e):Ba.set(e,t,i);let r=this.parent;this.updateWorldMatrix(!0,!1),Bo.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Ci.lookAt(Bo,Ba,this.up):Ci.lookAt(Ba,Bo,this.up),this.quaternion.setFromRotationMatrix(Ci),r&&(Ci.extractRotation(r.matrixWorld),$n.setFromRotationMatrix(Ci),this.quaternion.premultiply($n.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Z("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Ff),Qn.child=e,this.dispatchEvent(Qn),Qn.child=null):Z("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(P0),Eh.child=e,this.dispatchEvent(Eh),Eh.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Ci.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Ci.multiply(e.parent.matrixWorld)),e.applyMatrix4(Ci),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Ff),Qn.child=e,this.dispatchEvent(Qn),Qn.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){let s=this.children[i].getObjectByProperty(e,t);if(s!==void 0)return s}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let r=this.children;for(let n=0,s=r.length;n<s;n++)r[n].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Bo,e,I0),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Bo,R0,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,i=e.y,r=e.z,n=this.matrix.elements;n[12]+=t-n[0]*t-n[4]*i-n[8]*r,n[13]+=i-n[1]*t-n[5]*i-n[9]*r,n[14]+=r-n[2]*t-n[6]*i-n[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t,i=!1){let r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),t===!0){let n=this.children;for(let s=0,o=n.length;s<o;s++)n[s].updateWorldMatrix(!1,!0,i)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(o=>({...o})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function n(o,a){return o[a.uuid]===void 0&&(o[a.uuid]=a.toJSON(e)),a.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=n(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let a=o.shapes;if(Array.isArray(a))for(let c=0,h=a.length;c<h;c++){let u=a[c];n(e.shapes,u)}else n(e.shapes,a)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(n(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let a=0,c=this.material.length;a<c;a++)o.push(n(e.materials,this.material[a]));r.material=o}else r.material=n(e.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){let a=this.animations[o];r.animations.push(n(e.animations,a))}}if(t){let o=s(e.geometries),a=s(e.materials),c=s(e.textures),h=s(e.images),u=s(e.shapes),f=s(e.skeletons),d=s(e.animations),p=s(e.nodes);o.length>0&&(i.geometries=o),a.length>0&&(i.materials=a),c.length>0&&(i.textures=c),h.length>0&&(i.images=h),u.length>0&&(i.shapes=u),f.length>0&&(i.skeletons=f),d.length>0&&(i.animations=d),p.length>0&&(i.nodes=p)}return i.object=r,i;function s(o){let a=[];for(let c in o){let h=o[c];delete h.metadata,a.push(h)}return a}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let r=e.children[i];this.add(r.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};G.DEFAULT_UP=new y(0,1,0);G.DEFAULT_MATRIX_AUTO_UPDATE=!0;G.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var ct=class extends G{constructor(){super(),this.isGroup=!0,this.type="Group"}};var L0={type:"move"},Oa=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ct,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ct,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new y,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new y),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ct,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new y,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new y,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,n=null,s=null,o=this._targetRay,a=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){s=!0;for(let m of e.hand.values()){let g=t.getJointPose(m,i),_=this._getHandJoint(c,m);g!==null&&(_.matrix.fromArray(g.transform.matrix),_.matrix.decompose(_.position,_.rotation,_.scale),_.matrixWorldNeedsUpdate=!0,_.jointRadius=g.radius),_.visible=g!==null}let h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],f=h.position.distanceTo(u.position),d=.02,p=.005;c.inputState.pinching&&f>d+p?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&f<=d-p&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else a!==null&&e.gripSpace&&(n=t.getPose(e.gripSpace,i),n!==null&&(a.matrix.fromArray(n.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,n.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(n.linearVelocity)):a.hasLinearVelocity=!1,n.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(n.angularVelocity)):a.hasAngularVelocity=!1,a.eventsEnabled&&a.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&n!==null&&(r=n),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(L0)))}return o!==null&&(o.visible=r!==null),a!==null&&(a.visible=n!==null),c!==null&&(c.visible=s!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new ct;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}};var Uf={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Ji={h:0,s:0,l:0},Fa={h:0,s:0,l:0};function Ih(l,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?l+(e-l)*6*t:t<1/2?e:t<2/3?l+(e-l)*6*(2/3-t):l}var I=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=me){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Le.colorSpaceToWorking(this,t),this}setRGB(e,t,i,r=Le.workingColorSpace){return this.r=e,this.g=t,this.b=i,Le.colorSpaceToWorking(this,r),this}setHSL(e,t,i,r=Le.workingColorSpace){if(e=Ea(e,1),t=k(t,0,1),i=k(i,0,1),t===0)this.r=this.g=this.b=i;else{let n=i<=.5?i*(1+t):i+t-i*t,s=2*i-n;this.r=Ih(s,n,e+1/3),this.g=Ih(s,n,e),this.b=Ih(s,n,e-1/3)}return Le.colorSpaceToWorking(this,r),this}setStyle(e,t=me){function i(n){n!==void 0&&parseFloat(n)<1&&B("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let n,s=r[1],o=r[2];switch(s){case"rgb":case"rgba":if(n=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(n[4]),this.setRGB(Math.min(255,parseInt(n[1],10))/255,Math.min(255,parseInt(n[2],10))/255,Math.min(255,parseInt(n[3],10))/255,t);if(n=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(n[4]),this.setRGB(Math.min(100,parseInt(n[1],10))/100,Math.min(100,parseInt(n[2],10))/100,Math.min(100,parseInt(n[3],10))/100,t);break;case"hsl":case"hsla":if(n=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(n[4]),this.setHSL(parseFloat(n[1])/360,parseFloat(n[2])/100,parseFloat(n[3])/100,t);break;default:B("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let n=r[1],s=n.length;if(s===3)return this.setRGB(parseInt(n.charAt(0),16)/15,parseInt(n.charAt(1),16)/15,parseInt(n.charAt(2),16)/15,t);if(s===6)return this.setHex(parseInt(n,16),t);B("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=me){let i=Uf[e.toLowerCase()];return i!==void 0?this.setHex(i,t):B("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Kt(e.r),this.g=Kt(e.g),this.b=Kt(e.b),this}copyLinearToSRGB(e){return this.r=Dr(e.r),this.g=Dr(e.g),this.b=Dr(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=me){return Le.workingToColorSpace(tt.copy(this),e),Math.round(k(tt.r*255,0,255))*65536+Math.round(k(tt.g*255,0,255))*256+Math.round(k(tt.b*255,0,255))}getHexString(e=me){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Le.workingColorSpace){Le.workingToColorSpace(tt.copy(this),t);let i=tt.r,r=tt.g,n=tt.b,s=Math.max(i,r,n),o=Math.min(i,r,n),a,c,h=(o+s)/2;if(o===s)a=0,c=0;else{let u=s-o;switch(c=h<=.5?u/(s+o):u/(2-s-o),s){case i:a=(r-n)/u+(r<n?6:0);break;case r:a=(n-i)/u+2;break;case n:a=(i-r)/u+4;break}a/=6}return e.h=a,e.s=c,e.l=h,e}getRGB(e,t=Le.workingColorSpace){return Le.workingToColorSpace(tt.copy(this),t),e.r=tt.r,e.g=tt.g,e.b=tt.b,e}getStyle(e=me){Le.workingToColorSpace(tt.copy(this),e);let t=tt.r,i=tt.g,r=tt.b;return e!==me?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,t,i){return this.getHSL(Ji),this.setHSL(Ji.h+e,Ji.s+t,Ji.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(Ji),e.getHSL(Fa);let i=Yn(Ji.h,Fa.h,t),r=Yn(Ji.s,Fa.s,t),n=Yn(Ji.l,Fa.l,t);return this.setHSL(i,r,n),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,r=this.b,n=e.elements;return this.r=n[0]*t+n[3]*i+n[6]*r,this.g=n[1]*t+n[4]*i+n[7]*r,this.b=n[2]*t+n[5]*i+n[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},tt=new I;I.NAMES=Uf;var es=class l{constructor(e,t=25e-5){this.isFogExp2=!0,this.name="",this.color=new I(e),this.density=t}clone(){return new l(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}};var ts=class l{constructor(e,t=1,i=1e3){this.isFog=!0,this.name="",this.color=new I(e),this.near=t,this.far=i}clone(){return new l(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}};var is=class extends G{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Ge,this.environmentIntensity=1,this.environmentRotation=new Ge,this.overrideMaterial=null}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}};var $t=new y,Ei=new y,Rh=new y,Ii=new y,rs=new y,ns=new y,zf=new y,Ph=new y,Lh=new y,Nh=new y,Dh=new Ne,Bh=new Ne,Oh=new Ne,_t=class l{constructor(e=new y,t=new y,i=new y){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),$t.subVectors(e,t),r.cross($t);let n=r.lengthSq();return n>0?r.multiplyScalar(1/Math.sqrt(n)):r.set(0,0,0)}static getBarycoord(e,t,i,r,n){$t.subVectors(r,t),Ei.subVectors(i,t),Rh.subVectors(e,t);let s=$t.dot($t),o=$t.dot(Ei),a=$t.dot(Rh),c=Ei.dot(Ei),h=Ei.dot(Rh),u=s*c-o*o;if(u===0)return n.set(0,0,0),null;let f=1/u,d=(c*a-o*h)*f,p=(s*h-o*a)*f;return n.set(1-d-p,p,d)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,Ii)===null?!1:Ii.x>=0&&Ii.y>=0&&Ii.x+Ii.y<=1}static getInterpolation(e,t,i,r,n,s,o,a){return this.getBarycoord(e,t,i,r,Ii)===null?(a.x=0,a.y=0,"z"in a&&(a.z=0),"w"in a&&(a.w=0),null):(a.setScalar(0),a.addScaledVector(n,Ii.x),a.addScaledVector(s,Ii.y),a.addScaledVector(o,Ii.z),a)}static getInterpolatedAttribute(e,t,i,r,n,s){return Dh.setScalar(0),Bh.setScalar(0),Oh.setScalar(0),Dh.fromBufferAttribute(e,t),Bh.fromBufferAttribute(e,i),Oh.fromBufferAttribute(e,r),s.setScalar(0),s.addScaledVector(Dh,n.x),s.addScaledVector(Bh,n.y),s.addScaledVector(Oh,n.z),s}static isFrontFacing(e,t,i,r){return $t.subVectors(i,t),Ei.subVectors(e,t),$t.cross(Ei).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return $t.subVectors(this.c,this.b),Ei.subVectors(this.a,this.b),$t.cross(Ei).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return l.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return l.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,r,n){return l.getInterpolation(e,this.a,this.b,this.c,t,i,r,n)}containsPoint(e){return l.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return l.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,r=this.b,n=this.c,s,o;rs.subVectors(r,i),ns.subVectors(n,i),Ph.subVectors(e,i);let a=rs.dot(Ph),c=ns.dot(Ph);if(a<=0&&c<=0)return t.copy(i);Lh.subVectors(e,r);let h=rs.dot(Lh),u=ns.dot(Lh);if(h>=0&&u<=h)return t.copy(r);let f=a*u-h*c;if(f<=0&&a>=0&&h<=0)return s=a/(a-h),t.copy(i).addScaledVector(rs,s);Nh.subVectors(e,n);let d=rs.dot(Nh),p=ns.dot(Nh);if(p>=0&&d<=p)return t.copy(n);let m=d*c-a*p;if(m<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(i).addScaledVector(ns,o);let g=h*p-d*u;if(g<=0&&u-h>=0&&d-p>=0)return zf.subVectors(n,r),o=(u-h)/(u-h+(d-p)),t.copy(r).addScaledVector(zf,o);let _=1/(g+m+f);return s=m*_,o=f*_,t.copy(i).addScaledVector(rs,s).addScaledVector(ns,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}};var he=class{constructor(e=new y(1/0,1/0,1/0),t=new y(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(Qt.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(Qt.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=Qt.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let n=i.getAttribute("position");if(t===!0&&n!==void 0&&e.isInstancedMesh!==!0)for(let s=0,o=n.count;s<o;s++)e.isMesh===!0?e.getVertexPosition(s,Qt):Qt.fromBufferAttribute(n,s),Qt.applyMatrix4(e.matrixWorld),this.expandByPoint(Qt);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Ua.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Ua.copy(i.boundingBox)),Ua.applyMatrix4(e.matrixWorld),this.union(Ua)}let r=e.children;for(let n=0,s=r.length;n<s;n++)this.expandByObject(r[n],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Qt),Qt.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Oo),za.subVectors(this.max,Oo),ss.subVectors(e.a,Oo),os.subVectors(e.b,Oo),as.subVectors(e.c,Oo),Ki.subVectors(os,ss),ji.subVectors(as,os),Br.subVectors(ss,as);let t=[0,-Ki.z,Ki.y,0,-ji.z,ji.y,0,-Br.z,Br.y,Ki.z,0,-Ki.x,ji.z,0,-ji.x,Br.z,0,-Br.x,-Ki.y,Ki.x,0,-ji.y,ji.x,0,-Br.y,Br.x,0];return!Fh(t,ss,os,as,za)||(t=[1,0,0,0,1,0,0,0,1],!Fh(t,ss,os,as,za))?!1:(ka.crossVectors(Ki,ji),t=[ka.x,ka.y,ka.z],Fh(t,ss,os,as,za))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Qt).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Qt).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Ri[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Ri[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Ri[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Ri[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Ri[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Ri[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Ri[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Ri[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Ri),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Ri=[new y,new y,new y,new y,new y,new y,new y,new y],Qt=new y,Ua=new he,ss=new y,os=new y,as=new y,Ki=new y,ji=new y,Br=new y,Oo=new y,za=new y,ka=new y,Or=new y;function Fh(l,e,t,i,r){for(let n=0,s=l.length-3;n<=s;n+=3){Or.fromArray(l,n);let o=r.x*Math.abs(Or.x)+r.y*Math.abs(Or.y)+r.z*Math.abs(Or.z),a=e.dot(Or),c=t.dot(Or),h=i.dot(Or);if(Math.max(-Math.max(a,c,h),Math.min(a,c,h))>o)return!1}return!0}var Pi=N0();function N0(){let l=new ArrayBuffer(4),e=new Float32Array(l),t=new Uint32Array(l),i=new Uint32Array(512),r=new Uint32Array(512);for(let a=0;a<256;++a){let c=a-127;c<-27?(i[a]=0,i[a|256]=32768,r[a]=24,r[a|256]=24):c<-14?(i[a]=1024>>-c-14,i[a|256]=1024>>-c-14|32768,r[a]=-c-1,r[a|256]=-c-1):c<=15?(i[a]=c+15<<10,i[a|256]=c+15<<10|32768,r[a]=13,r[a|256]=13):c<128?(i[a]=31744,i[a|256]=64512,r[a]=24,r[a|256]=24):(i[a]=31744,i[a|256]=64512,r[a]=13,r[a|256]=13)}let n=new Uint32Array(2048),s=new Uint32Array(64),o=new Uint32Array(64);for(let a=1;a<1024;++a){let c=a<<13,h=0;for(;(c&8388608)===0;)c<<=1,h-=8388608;c&=-8388609,h+=947912704,n[a]=c|h}for(let a=1024;a<2048;++a)n[a]=939524096+(a-1024<<13);for(let a=1;a<31;++a)s[a]=a<<23;s[31]=1199570944,s[32]=2147483648;for(let a=33;a<63;++a)s[a]=2147483648+(a-32<<23);s[63]=3347054592;for(let a=1;a<64;++a)a!==32&&(o[a]=1024);return{floatView:e,uint32View:t,baseTable:i,shiftTable:r,mantissaTable:n,exponentTable:s,offsetTable:o}}function ht(l){Math.abs(l)>65504&&B("DataUtils.toHalfFloat(): Value out of range."),l=k(l,-65504,65504),Pi.floatView[0]=l;let e=Pi.uint32View[0],t=e>>23&511;return Pi.baseTable[t]+((e&8388607)>>Pi.shiftTable[t])}function ls(l){let e=l>>10;return Pi.uint32View[0]=Pi.mantissaTable[Pi.offsetTable[e]+(l&1023)]+Pi.exponentTable[e],Pi.floatView[0]}var Va=class{static toHalfFloat(e){return ht(e)}static fromHalfFloat(e){return ls(e)}};var Oe=new y,Ga=new T,D0=0,K=class extends Ie{constructor(e,t,i=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:D0++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=Lr,this.updateRanges=[],this.gpuType=gt,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,n=this.itemSize;r<n;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)Ga.fromBufferAttribute(this,t),Ga.applyMatrix3(e),this.setXY(t,Ga.x,Ga.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)Oe.fromBufferAttribute(this,t),Oe.applyMatrix3(e),this.setXYZ(t,Oe.x,Oe.y,Oe.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)Oe.fromBufferAttribute(this,t),Oe.applyMatrix4(e),this.setXYZ(t,Oe.x,Oe.y,Oe.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Oe.fromBufferAttribute(this,t),Oe.applyNormalMatrix(e),this.setXYZ(t,Oe.x,Oe.y,Oe.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Oe.fromBufferAttribute(this,t),Oe.transformDirection(e),this.setXYZ(t,Oe.x,Oe.y,Oe.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=Ye(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=J(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Ye(t,this.array)),t}setX(e,t){return this.normalized&&(t=J(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Ye(t,this.array)),t}setY(e,t){return this.normalized&&(t=J(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Ye(t,this.array)),t}setZ(e,t){return this.normalized&&(t=J(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Ye(t,this.array)),t}setW(e,t){return this.normalized&&(t=J(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=J(t,this.array),i=J(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=J(t,this.array),i=J(i,this.array),r=J(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,n){return e*=this.itemSize,this.normalized&&(t=J(t,this.array),i=J(i,this.array),r=J(r,this.array),n=J(n,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=n,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}},Uh=class extends K{constructor(e,t,i){super(new Int8Array(e),t,i)}},zh=class extends K{constructor(e,t,i){super(new Uint8Array(e),t,i)}},kh=class extends K{constructor(e,t,i){super(new Uint8ClampedArray(e),t,i)}},Vh=class extends K{constructor(e,t,i){super(new Int16Array(e),t,i)}},Fo=class extends K{constructor(e,t,i){super(new Uint16Array(e),t,i)}},Gh=class extends K{constructor(e,t,i){super(new Int32Array(e),t,i)}},Uo=class extends K{constructor(e,t,i){super(new Uint32Array(e),t,i)}},Hh=class extends K{constructor(e,t,i){super(new Uint16Array(e),t,i),this.isFloat16BufferAttribute=!0}getX(e){let t=ls(this.array[e*this.itemSize]);return this.normalized&&(t=Ye(t,this.array)),t}setX(e,t){return this.normalized&&(t=J(t,this.array)),this.array[e*this.itemSize]=ht(t),this}getY(e){let t=ls(this.array[e*this.itemSize+1]);return this.normalized&&(t=Ye(t,this.array)),t}setY(e,t){return this.normalized&&(t=J(t,this.array)),this.array[e*this.itemSize+1]=ht(t),this}getZ(e){let t=ls(this.array[e*this.itemSize+2]);return this.normalized&&(t=Ye(t,this.array)),t}setZ(e,t){return this.normalized&&(t=J(t,this.array)),this.array[e*this.itemSize+2]=ht(t),this}getW(e){let t=ls(this.array[e*this.itemSize+3]);return this.normalized&&(t=Ye(t,this.array)),t}setW(e,t){return this.normalized&&(t=J(t,this.array)),this.array[e*this.itemSize+3]=ht(t),this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=J(t,this.array),i=J(i,this.array)),this.array[e+0]=ht(t),this.array[e+1]=ht(i),this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=J(t,this.array),i=J(i,this.array),r=J(r,this.array)),this.array[e+0]=ht(t),this.array[e+1]=ht(i),this.array[e+2]=ht(r),this}setXYZW(e,t,i,r,n){return e*=this.itemSize,this.normalized&&(t=J(t,this.array),i=J(i,this.array),r=J(r,this.array),n=J(n,this.array)),this.array[e+0]=ht(t),this.array[e+1]=ht(i),this.array[e+2]=ht(r),this.array[e+3]=ht(n),this}},R=class extends K{constructor(e,t,i){super(new Float32Array(e),t,i)}};var B0=new he,zo=new y,Wh=new y,oe=class{constructor(e=new y,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):B0.setFromPoints(e).getCenter(i);let r=0;for(let n=0,s=e.length;n<s;n++)r=Math.max(r,i.distanceToSquared(e[n]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;zo.subVectors(e,this.center);let t=zo.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),r=(i-this.radius)*.5;this.center.addScaledVector(zo,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Wh.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(zo.copy(e.center).add(Wh)),this.expandByPoint(zo.copy(e.center).sub(Wh))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}};var O0=0,Vt=new F,qh=new G,cs=new y,Et=new he,ko=new he,He=new y,L=class l extends Ie{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:O0++}),this.uuid=Te(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Sf(e)?Uo:Fo)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let n=new Y().getNormalMatrix(e);i.applyNormalMatrix(n),i.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return Vt.makeRotationFromQuaternion(e),this.applyMatrix4(Vt),this}rotateX(e){return Vt.makeRotationX(e),this.applyMatrix4(Vt),this}rotateY(e){return Vt.makeRotationY(e),this.applyMatrix4(Vt),this}rotateZ(e){return Vt.makeRotationZ(e),this.applyMatrix4(Vt),this}translate(e,t,i){return Vt.makeTranslation(e,t,i),this.applyMatrix4(Vt),this}scale(e,t,i){return Vt.makeScale(e,t,i),this.applyMatrix4(Vt),this}lookAt(e){return qh.lookAt(e),qh.updateMatrix(),this.applyMatrix4(qh.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(cs).negate(),this.translate(cs.x,cs.y,cs.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let i=[];for(let r=0,n=e.length;r<n;r++){let s=e[r];i.push(s.x,s.y,s.z||0)}this.setAttribute("position",new R(i,3))}else{let i=Math.min(e.length,t.count);for(let r=0;r<i;r++){let n=e[r];t.setXYZ(r,n.x,n.y,n.z||0)}e.length>t.count&&B("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new he);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Z("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new y(-1/0,-1/0,-1/0),new y(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){let n=t[i];Et.setFromBufferAttribute(n),this.morphTargetsRelative?(He.addVectors(this.boundingBox.min,Et.min),this.boundingBox.expandByPoint(He),He.addVectors(this.boundingBox.max,Et.max),this.boundingBox.expandByPoint(He)):(this.boundingBox.expandByPoint(Et.min),this.boundingBox.expandByPoint(Et.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Z('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new oe);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Z("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new y,1/0);return}if(e){let i=this.boundingSphere.center;if(Et.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){let o=t[n];ko.setFromBufferAttribute(o),this.morphTargetsRelative?(He.addVectors(Et.min,ko.min),Et.expandByPoint(He),He.addVectors(Et.max,ko.max),Et.expandByPoint(He)):(Et.expandByPoint(ko.min),Et.expandByPoint(ko.max))}Et.getCenter(i);let r=0;for(let n=0,s=e.count;n<s;n++)He.fromBufferAttribute(e,n),r=Math.max(r,i.distanceToSquared(He));if(t)for(let n=0,s=t.length;n<s;n++){let o=t[n],a=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)He.fromBufferAttribute(o,c),a&&(cs.fromBufferAttribute(e,c),He.add(cs)),r=Math.max(r,i.distanceToSquared(He))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&Z('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Z("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.position,r=t.normal,n=t.uv,s=this.getAttribute("tangent");(s===void 0||s.count!==i.count)&&(s=new K(new Float32Array(4*i.count),4),this.setAttribute("tangent",s));let o=[],a=[];for(let A=0;A<i.count;A++)o[A]=new y,a[A]=new y;let c=new y,h=new y,u=new y,f=new T,d=new T,p=new T,m=new y,g=new y;function _(A,C,E){c.fromBufferAttribute(i,A),h.fromBufferAttribute(i,C),u.fromBufferAttribute(i,E),f.fromBufferAttribute(n,A),d.fromBufferAttribute(n,C),p.fromBufferAttribute(n,E),h.sub(c),u.sub(c),d.sub(f),p.sub(f);let P=1/(d.x*p.y-p.x*d.y);isFinite(P)&&(m.copy(h).multiplyScalar(p.y).addScaledVector(u,-d.y).multiplyScalar(P),g.copy(u).multiplyScalar(d.x).addScaledVector(h,-p.x).multiplyScalar(P),o[A].add(m),o[C].add(m),o[E].add(m),a[A].add(g),a[C].add(g),a[E].add(g))}let x=this.groups;x.length===0&&(x=[{start:0,count:e.count}]);for(let A=0,C=x.length;A<C;++A){let E=x[A],P=E.start,V=E.count;for(let W=P,ee=P+V;W<ee;W+=3)_(e.getX(W+0),e.getX(W+1),e.getX(W+2))}let v=new y,b=new y,M=new y,w=new y;function S(A){M.fromBufferAttribute(r,A),w.copy(M);let C=o[A];v.copy(C),v.sub(M.multiplyScalar(M.dot(C))).normalize(),b.crossVectors(w,C);let P=b.dot(a[A])<0?-1:1;s.setXYZW(A,v.x,v.y,v.z,P)}for(let A=0,C=x.length;A<C;++A){let E=x[A],P=E.start,V=E.count;for(let W=P,ee=P+V;W<ee;W+=3)S(e.getX(W+0)),S(e.getX(W+1)),S(e.getX(W+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==t.count)i=new K(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let f=0,d=i.count;f<d;f++)i.setXYZ(f,0,0,0);let r=new y,n=new y,s=new y,o=new y,a=new y,c=new y,h=new y,u=new y;if(e)for(let f=0,d=e.count;f<d;f+=3){let p=e.getX(f+0),m=e.getX(f+1),g=e.getX(f+2);r.fromBufferAttribute(t,p),n.fromBufferAttribute(t,m),s.fromBufferAttribute(t,g),h.subVectors(s,n),u.subVectors(r,n),h.cross(u),o.fromBufferAttribute(i,p),a.fromBufferAttribute(i,m),c.fromBufferAttribute(i,g),o.add(h),a.add(h),c.add(h),i.setXYZ(p,o.x,o.y,o.z),i.setXYZ(m,a.x,a.y,a.z),i.setXYZ(g,c.x,c.y,c.z)}else for(let f=0,d=t.count;f<d;f+=3)r.fromBufferAttribute(t,f+0),n.fromBufferAttribute(t,f+1),s.fromBufferAttribute(t,f+2),h.subVectors(s,n),u.subVectors(r,n),h.cross(u),i.setXYZ(f+0,h.x,h.y,h.z),i.setXYZ(f+1,h.x,h.y,h.z),i.setXYZ(f+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)He.fromBufferAttribute(e,t),He.normalize(),e.setXYZ(t,He.x,He.y,He.z)}toNonIndexed(){function e(o,a){let c=o.array,h=o.itemSize,u=o.normalized,f=new c.constructor(a.length*h),d=0,p=0;for(let m=0,g=a.length;m<g;m++){o.isInterleavedBufferAttribute?d=a[m]*o.data.stride+o.offset:d=a[m]*h;for(let _=0;_<h;_++)f[p++]=c[d++]}return new K(f,h,u)}if(this.index===null)return B("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new l,i=this.index.array,r=this.attributes;for(let o in r){let a=r[o],c=e(a,i);t.setAttribute(o,c)}let n=this.morphAttributes;for(let o in n){let a=[],c=n[o];for(let h=0,u=c.length;h<u;h++){let f=c[h],d=e(f,i);a.push(d)}t.morphAttributes[o]=a}t.morphTargetsRelative=this.morphTargetsRelative;let s=this.groups;for(let o=0,a=s.length;o<a;o++){let c=s[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let a=this.parameters;for(let c in a)a[c]!==void 0&&(e[c]=a[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let a in i){let c=i[a];e.data.attributes[a]=c.toJSON(e.data)}let r={},n=!1;for(let a in this.morphAttributes){let c=this.morphAttributes[a],h=[];for(let u=0,f=c.length;u<f;u++){let d=c[u];h.push(d.toJSON(e.data))}h.length>0&&(r[a]=h,n=!0)}n&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let s=this.groups;s.length>0&&(e.data.groups=JSON.parse(JSON.stringify(s)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone());let r=e.attributes;for(let c in r){let h=r[c];this.setAttribute(c,h.clone(t))}let n=e.morphAttributes;for(let c in n){let h=[],u=n[c];for(let f=0,d=u.length;f<d;f++)h.push(u[f].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let s=e.groups;for(let c=0,h=s.length;c<h;c++){let u=s[c];this.addGroup(u.start,u.count,u.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let a=e.boundingSphere;return a!==null&&(this.boundingSphere=a.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var It=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=Lr,this.updateRanges=[],this.version=0,this.uuid=Te()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,i){e*=this.stride,i*=t.stride;for(let r=0,n=this.stride;r<n;r++)this.array[e+r]=t.array[i+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Te()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),i=new this.constructor(t,this.stride);return i.setUsage(this.usage),i}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Te()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer)));let t={uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride};return t.usage=this.usage,t}};var ut=new y,Rt=class l{constructor(e,t,i,r=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=i,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,i=this.data.count;t<i;t++)ut.fromBufferAttribute(this,t),ut.applyMatrix4(e),this.setXYZ(t,ut.x,ut.y,ut.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)ut.fromBufferAttribute(this,t),ut.applyNormalMatrix(e),this.setXYZ(t,ut.x,ut.y,ut.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)ut.fromBufferAttribute(this,t),ut.transformDirection(e),this.setXYZ(t,ut.x,ut.y,ut.z);return this}getComponent(e,t){let i=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(i=Ye(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=J(i,this.array)),this.data.array[e*this.data.stride+this.offset+t]=i,this}setX(e,t){return this.normalized&&(t=J(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=J(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=J(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=J(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=Ye(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=Ye(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=Ye(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=Ye(t,this.array)),t}setXY(e,t,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=J(t,this.array),i=J(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this}setXYZ(e,t,i,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=J(t,this.array),i=J(i,this.array),r=J(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=r,this}setXYZW(e,t,i,r,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=J(t,this.array),i=J(i,this.array),r=J(r,this.array),n=J(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=r,this.data.array[e+3]=n,this}clone(e){if(e===void 0){Do("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let r=i*this.data.stride+this.offset;for(let n=0;n<this.itemSize;n++)t.push(this.data.array[r+n])}return new K(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new l(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){Do("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let r=i*this.data.stride+this.offset;for(let n=0;n<this.itemSize;n++)t.push(this.data.array[r+n])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}};var Xh=new y,F0=new y,U0=new Y,Pt=class{constructor(e=new y(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let r=Xh.subVectors(i,t).cross(F0.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,i=!0){let r=e.delta(Xh),n=this.normal.dot(r);if(n===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let s=-(e.start.dot(this.normal)+this.constant)/n;return i===!0&&(s<0||s>1)?null:t.copy(e.start).addScaledVector(r,s)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||U0.getNormalMatrix(e),r=this.coplanarPoint(Xh).applyMatrix4(e),n=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(n),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}};var z0=0,$=class extends Ie{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:z0++}),this.uuid=Te(),this.name="",this.type="Material",this.blending=fo,this.side=Mi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=lh,this.blendDst=ch,this.blendEquation=ah,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new I(0,0,0),this.blendAlpha=0,this.depthFunc=hn,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=yh,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=No,this.stencilZFail=No,this.stencilZPass=No,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){B(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){B(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector2&&i&&i.isVector2||r&&r.isEuler&&i&&i.isEuler||r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,i.blending=this.blending,i.side=this.side,i.shadowSide=this.shadowSide,i.vertexColors=this.vertexColors,i.opacity=this.opacity,i.transparent=this.transparent,i.blendSrc=this.blendSrc,i.blendDst=this.blendDst,i.blendEquation=this.blendEquation,i.blendSrcAlpha=this.blendSrcAlpha,i.blendDstAlpha=this.blendDstAlpha,i.blendEquationAlpha=this.blendEquationAlpha,i.blendColor=this.blendColor.getHex(),i.blendAlpha=this.blendAlpha,i.depthFunc=this.depthFunc,i.depthTest=this.depthTest,i.depthWrite=this.depthWrite,i.colorWrite=this.colorWrite,i.clipIntersection=this.clipIntersection,i.clipShadows=this.clipShadows,i.stencilWriteMask=this.stencilWriteMask,i.stencilFunc=this.stencilFunc,i.stencilRef=this.stencilRef,i.stencilFuncMask=this.stencilFuncMask,i.stencilFail=this.stencilFail,i.stencilZFail=this.stencilZFail,i.stencilZPass=this.stencilZPass,i.stencilWrite=this.stencilWrite,i.polygonOffset=this.polygonOffset,i.polygonOffsetFactor=this.polygonOffsetFactor,i.polygonOffsetUnits=this.polygonOffsetUnits,i.dithering=this.dithering,i.alphaTest=this.alphaTest,i.alphaHash=this.alphaHash,i.alphaToCoverage=this.alphaToCoverage,i.premultipliedAlpha=this.premultipliedAlpha,i.forceSinglePass=this.forceSinglePass,i.allowOverride=this.allowOverride,i.visible=this.visible,i.toneMapped=this.toneMapped,i.name=this.name,this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(i.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(i.clippingPlanes=this.clippingPlanes.map(n=>n.toJSON())),this.rotation!==void 0&&(i.rotation=this.rotation),this.depthPacking!==void 0&&(i.depthPacking=this.depthPacking),this.linewidth!==void 0&&(i.linewidth=this.linewidth),this.linecap!==void 0&&(i.linecap=this.linecap),this.linejoin!==void 0&&(i.linejoin=this.linejoin),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.wireframe!==void 0&&(i.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(i.flatShading=this.flatShading),this.fog!==void 0&&(i.fog=this.fog),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(n){let s=[];for(let o in n){let a=n[o];delete a.metadata,s.push(a)}return s}if(t){let n=r(e.textures),s=r(e.images);n.length>0&&(i.textures=n),s.length>0&&(i.images=s)}return i}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new I().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(i=>new Pt().fromJSON(i))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let i=e.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new T().fromArray(i)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new T().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let r=t.length;i=new Array(r);for(let n=0;n!==r;++n)i[n]=t[n].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}};var $i=class extends ${constructor(e){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new I(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}};var hs,Vo=new y,us=new y,fs=new y,ds=new T,Go=new T,Gf=new F,Ha=new y,Ho=new y,Wa=new y,kf=new T,Yh=new T,Vf=new T,ps=class extends G{constructor(e=new $i){if(super(),this.isSprite=!0,this.type="Sprite",hs===void 0){hs=new L;let t=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),i=new It(t,5);hs.setIndex([0,1,2,0,2,3]),hs.setAttribute("position",new Rt(i,3,0,!1)),hs.setAttribute("uv",new Rt(i,2,3,!1))}this.geometry=hs,this.material=e,this.center=new T(.5,.5),this.count=1}intersectsFrustum(e){return e.intersectsSprite(this)}raycast(e,t){e.camera===null&&Z('Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),us.setFromMatrixScale(this.matrixWorld),Gf.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),fs.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&us.multiplyScalar(-fs.z);let i=this.material.rotation,r,n;i!==0&&(n=Math.cos(i),r=Math.sin(i));let s=this.center;qa(Ha.set(-.5,-.5,0),fs,s,us,r,n),qa(Ho.set(.5,-.5,0),fs,s,us,r,n),qa(Wa.set(.5,.5,0),fs,s,us,r,n),kf.set(0,0),Yh.set(1,0),Vf.set(1,1);let o=e.ray.intersectTriangle(Ha,Ho,Wa,!1,Vo);if(o===null&&(qa(Ho.set(-.5,.5,0),fs,s,us,r,n),Yh.set(0,1),o=e.ray.intersectTriangle(Ha,Wa,Ho,!1,Vo),o===null))return;let a=e.ray.origin.distanceTo(Vo);a<e.near||a>e.far||t.push({distance:a,point:Vo.clone(),uv:_t.getInterpolation(Vo,Ha,Ho,Wa,kf,Yh,Vf,new T),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}};function qa(l,e,t,i,r,n){ds.subVectors(l,t).addScalar(.5).multiply(i),r!==void 0?(Go.x=n*ds.x-r*ds.y,Go.y=r*ds.x+n*ds.y):Go.copy(ds),l.copy(e),l.x+=Go.x,l.y+=Go.y,l.applyMatrix4(Gf)}var Xa=new y,Hf=new y,ms=class extends G{constructor(){super(),this.isLOD=!0,this._currentLevel=0,this.type="LOD",Object.defineProperties(this,{levels:{enumerable:!0,value:[]}}),this.autoUpdate=!0}copy(e){super.copy(e,!1);let t=e.levels;for(let i=0,r=t.length;i<r;i++){let n=t[i];this.addLevel(n.object.clone(),n.distance,n.hysteresis)}return this.autoUpdate=e.autoUpdate,this}addLevel(e,t=0,i=0){t=Math.abs(t);let r=this.levels,n;for(n=0;n<r.length&&!(t<r[n].distance);n++);return r.splice(n,0,{distance:t,hysteresis:i,object:e}),this.add(e),this}removeLevel(e){let t=this.levels;for(let i=0;i<t.length;i++)if(t[i].distance===e){let r=t.splice(i,1);return this.remove(r[0].object),!0}return!1}getCurrentLevel(){return this._currentLevel}getObjectForDistance(e){let t=this.levels;if(t.length>0){let i,r;for(i=1,r=t.length;i<r;i++){let n=t[i].distance;if(t[i].object.visible&&(n-=n*t[i].hysteresis),e<n)break}return t[i-1].object}return null}raycast(e,t){if(this.levels.length>0){Xa.setFromMatrixPosition(this.matrixWorld);let r=e.ray.origin.distanceTo(Xa);this.getObjectForDistance(r).raycast(e,t)}}update(e){let t=this.levels;if(t.length>1){Xa.setFromMatrixPosition(e.matrixWorld),Hf.setFromMatrixPosition(this.matrixWorld);let i=Xa.distanceTo(Hf)/e.zoom;t[0].object.visible=!0;let r,n;for(r=1,n=t.length;r<n;r++){let s=t[r].distance;if(t[r].object.visible&&(s-=s*t[r].hysteresis),i>=s)t[r-1].object.visible=!1,t[r].object.visible=!0;else break}for(this._currentLevel=r-1;r<n;r++)t[r].object.visible=!1}}toJSON(e){let t=super.toJSON(e);t.object.autoUpdate=this.autoUpdate,t.object.levels=[];let i=this.levels;for(let r=0,n=i.length;r<n;r++){let s=i[r];t.object.levels.push({object:s.object.uuid,distance:s.distance,hysteresis:s.hysteresis})}return t}};var Li=new y,Zh=new y,Ya=new y,Za=new y,xt=class{constructor(e=new y,t=new y(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Li)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Li.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Li.copy(this.origin).addScaledVector(this.direction,t),Li.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){Zh.copy(e).add(t).multiplyScalar(.5),Ya.copy(t).sub(e).normalize(),Za.copy(this.origin).sub(Zh);let n=e.distanceTo(t)*.5,s=-this.direction.dot(Ya),o=Za.dot(this.direction),a=-Za.dot(Ya),c=Za.lengthSq(),h=Math.abs(1-s*s),u,f,d,p;if(h>0)if(u=s*a-o,f=s*o-a,p=n*h,u>=0)if(f>=-p)if(f<=p){let m=1/h;u*=m,f*=m,d=u*(u+s*f+2*o)+f*(s*u+f+2*a)+c}else f=n,u=Math.max(0,-(s*f+o)),d=-u*u+f*(f+2*a)+c;else f=-n,u=Math.max(0,-(s*f+o)),d=-u*u+f*(f+2*a)+c;else f<=-p?(u=Math.max(0,-(-s*n+o)),f=u>0?-n:Math.min(Math.max(-n,-a),n),d=-u*u+f*(f+2*a)+c):f<=p?(u=0,f=Math.min(Math.max(-n,-a),n),d=f*(f+2*a)+c):(u=Math.max(0,-(s*n+o)),f=u>0?n:Math.min(Math.max(-n,-a),n),d=-u*u+f*(f+2*a)+c);else f=s>0?-n:n,u=Math.max(0,-(s*f+o)),d=-u*u+f*(f+2*a)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(Zh).addScaledVector(Ya,f),d}intersectSphere(e,t){if(e.radius<0)return null;Li.subVectors(e.center,this.origin);let i=Li.dot(this.direction),r=Li.dot(Li)-i*i,n=e.radius*e.radius;if(r>n)return null;let s=Math.sqrt(n-r),o=i-s,a=i+s;return a<0?null:o<0?this.at(a,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,n,s,o,a,c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,f=this.origin;return c>=0?(i=(e.min.x-f.x)*c,r=(e.max.x-f.x)*c):(i=(e.max.x-f.x)*c,r=(e.min.x-f.x)*c),h>=0?(n=(e.min.y-f.y)*h,s=(e.max.y-f.y)*h):(n=(e.max.y-f.y)*h,s=(e.min.y-f.y)*h),i>s||n>r||((n>i||isNaN(i))&&(i=n),(s<r||isNaN(r))&&(r=s),u>=0?(o=(e.min.z-f.z)*u,a=(e.max.z-f.z)*u):(o=(e.max.z-f.z)*u,a=(e.min.z-f.z)*u),i>a||o>r)||((o>i||i!==i)&&(i=o),(a<r||r!==r)&&(r=a),r<0)?null:this.at(i>=0?i:r,t)}intersectsBox(e){return this.intersectBox(e,Li)!==null}intersectTriangle(e,t,i,r,n){let s=this.origin,o=this.direction,a=o.x,c=o.y,h=o.z,u=e.x-s.x,f=e.y-s.y,d=e.z-s.z,p=t.x-s.x,m=t.y-s.y,g=t.z-s.z,_=i.x-s.x,x=i.y-s.y,v=i.z-s.z,b=Math.abs(a),M=Math.abs(c),w=Math.abs(h),S,A,C,E,P,V,W,ee,X,ue,_e,Ve;if(b>=M&&b>=w?(C=a,V=u,X=p,Ve=_,a>=0?(S=c,A=h,E=f,P=d,W=m,ee=g,ue=x,_e=v):(S=h,A=c,E=d,P=f,W=g,ee=m,ue=v,_e=x)):M>=w?(C=c,V=f,X=m,Ve=x,c>=0?(S=h,A=a,E=d,P=u,W=g,ee=p,ue=v,_e=_):(S=a,A=h,E=u,P=d,W=p,ee=g,ue=_,_e=v)):(C=h,V=d,X=g,Ve=v,h>=0?(S=a,A=c,E=u,P=f,W=p,ee=m,ue=_,_e=x):(S=c,A=a,E=f,P=u,W=m,ee=p,ue=x,_e=_)),C===0)return null;let pe=S/C,xe=A/C,ye=1/C,mt=E-pe*V,at=P-xe*V,bi=W-pe*X,Fi=ee-xe*X,ma=ue-pe*Ve,ga=_e-xe*Ve,Ui=ma*Fi-ga*bi,lt=mt*ga-at*ma,ai=bi*at-Fi*mt;if(r){if(Ui<0||lt<0||ai<0)return null}else if((Ui<0||lt<0||ai<0)&&(Ui>0||lt>0||ai>0))return null;let ho=Ui+lt+ai;if(ho===0)return null;let bt=ye*(Ui*V+lt*X+ai*Ve);return(ho>0?bt<0:bt>0)?null:this.at(bt/ho,n)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}};var Se=class extends ${constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new I(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ge,this.combine=yr,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var Wf=new F,Fr=new xt,Ja=new oe,qf=new y,Ka=new y,ja=new y,$a=new y,Jh=new y,Qa=new y,Xf=new y,el=new y,ae=class extends G{constructor(e=new L,t=new Se){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let n=0,s=r.length;n<s;n++){let o=r[n].name||String(n);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=n}}}}getVertexPosition(e,t){let i=this.geometry,r=i.attributes.position,n=i.morphAttributes.position,s=i.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(n&&o){Qa.set(0,0,0);for(let a=0,c=n.length;a<c;a++){let h=o[a],u=n[a];h!==0&&(Jh.fromBufferAttribute(u,e),s?Qa.addScaledVector(Jh,h):Qa.addScaledVector(Jh.sub(t),h))}t.add(Qa)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let i=this.geometry,r=this.material,n=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Ja.copy(i.boundingSphere),Ja.applyMatrix4(n),Fr.copy(e.ray).recast(e.near),!(Ja.containsPoint(Fr.origin)===!1&&(Fr.intersectSphere(Ja,qf)===null||Fr.origin.distanceToSquared(qf)>(e.far-e.near)**2))&&(Wf.copy(n).invert(),Fr.copy(e.ray).applyMatrix4(Wf),!(i.boundingBox!==null&&Fr.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,Fr)))}_computeIntersections(e,t,i){let r,n=this.geometry,s=this.material,o=n.index,a=n.attributes.position,c=n.attributes.uv,h=n.attributes.uv1,u=n.attributes.normal,f=n.groups,d=n.drawRange;if(o!==null)if(Array.isArray(s))for(let p=0,m=f.length;p<m;p++){let g=f[p],_=s[g.materialIndex],x=Math.max(g.start,d.start),v=Math.min(o.count,Math.min(g.start+g.count,d.start+d.count));for(let b=x,M=v;b<M;b+=3){let w=o.getX(b),S=o.getX(b+1),A=o.getX(b+2);r=tl(this,_,e,i,c,h,u,w,S,A),r&&(r.faceIndex=Math.floor(b/3),r.face.materialIndex=g.materialIndex,t.push(r))}}else{let p=Math.max(0,d.start),m=Math.min(o.count,d.start+d.count);for(let g=p,_=m;g<_;g+=3){let x=o.getX(g),v=o.getX(g+1),b=o.getX(g+2);r=tl(this,s,e,i,c,h,u,x,v,b),r&&(r.faceIndex=Math.floor(g/3),t.push(r))}}else if(a!==void 0)if(Array.isArray(s))for(let p=0,m=f.length;p<m;p++){let g=f[p],_=s[g.materialIndex],x=Math.max(g.start,d.start),v=Math.min(a.count,Math.min(g.start+g.count,d.start+d.count));for(let b=x,M=v;b<M;b+=3){let w=b,S=b+1,A=b+2;r=tl(this,_,e,i,c,h,u,w,S,A),r&&(r.faceIndex=Math.floor(b/3),r.face.materialIndex=g.materialIndex,t.push(r))}}else{let p=Math.max(0,d.start),m=Math.min(a.count,d.start+d.count);for(let g=p,_=m;g<_;g+=3){let x=g,v=g+1,b=g+2;r=tl(this,s,e,i,c,h,u,x,v,b),r&&(r.faceIndex=Math.floor(g/3),t.push(r))}}}};function k0(l,e,t,i,r,n,s,o){let a;if(e.side===wi?a=i.intersectTriangle(s,n,r,!0,o):a=i.intersectTriangle(r,n,s,e.side===Mi,o),a===null)return null;el.copy(o),el.applyMatrix4(l.matrixWorld);let c=t.ray.origin.distanceTo(el);return c<t.near||c>t.far?null:{distance:c,point:el.clone(),object:l}}function tl(l,e,t,i,r,n,s,o,a,c){l.getVertexPosition(o,Ka),l.getVertexPosition(a,ja),l.getVertexPosition(c,$a);let h=k0(l,e,t,i,Ka,ja,$a,Xf);if(h){let u=new y;_t.getBarycoord(Xf,Ka,ja,$a,u),r&&(h.uv=_t.getInterpolatedAttribute(r,o,a,c,u,new T)),n&&(h.uv1=_t.getInterpolatedAttribute(n,o,a,c,u,new T)),s&&(h.normal=_t.getInterpolatedAttribute(s,o,a,c,u,new y),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));let f={a:o,b:a,c,normal:new y,materialIndex:0};_t.getNormal(Ka,ja,$a,f.normal),h.face=f,h.barycoord=u}return h}var Wo=new Ne,Yf=new Ne,Zf=new Ne,V0=new Ne,Jf=new F,il=new y,Kh=new oe,Kf=new F,jh=new xt,Qi=class extends ae{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=wa,this.bindMatrix=new F,this.bindMatrixInverse=new F,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){let e=this.geometry;this.boundingBox===null&&(this.boundingBox=new he),this.boundingBox.makeEmpty();let t=e.getAttribute("position");for(let i=0;i<t.count;i++)this.getVertexPosition(i,il),this.boundingBox.expandByPoint(il)}computeBoundingSphere(){let e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new oe),this.boundingSphere.makeEmpty();let t=e.getAttribute("position");for(let i=0;i<t.count;i++)this.getVertexPosition(i,il),this.boundingSphere.expandByPoint(il)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}raycast(e,t){let i=this.material,r=this.matrixWorld;i!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Kh.copy(this.boundingSphere),Kh.applyMatrix4(r),e.ray.intersectsSphere(Kh)!==!1&&(Kf.copy(r).invert(),jh.copy(e.ray).applyMatrix4(Kf),!(this.boundingBox!==null&&jh.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(e,t,jh)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){let e=new Ne,t=this.geometry.attributes.skinWeight;for(let i=0,r=t.count;i<r;i++){e.fromBufferAttribute(t,i);let n=1/e.manhattanLength();n!==1/0?e.multiplyScalar(n):e.set(1,0,0,0),t.setXYZW(i,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===wa?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===hh?this.bindMatrixInverse.copy(this.bindMatrix).invert():B("SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){let i=this.skeleton,r=this.geometry;Yf.fromBufferAttribute(r.attributes.skinIndex,e),Zf.fromBufferAttribute(r.attributes.skinWeight,e),t.isVector4?(Wo.copy(t),t.set(0,0,0,0)):(Wo.set(...t,1),t.set(0,0,0)),Wo.applyMatrix4(this.bindMatrix);for(let n=0;n<4;n++){let s=Zf.getComponent(n);if(s!==0){let o=Yf.getComponent(n);Jf.multiplyMatrices(i.bones[o].matrixWorld,i.boneInverses[o]),t.addScaledVector(V0.copy(Wo).applyMatrix4(Jf),s)}}return t.isVector4&&(t.w=Wo.w),t.applyMatrix4(this.bindMatrixInverse)}};var hi=class extends G{constructor(){super(),this.isBone=!0,this.type="Bone"}};var ze=class extends te{constructor(e=null,t=1,i=1,r,n,s,o,a,c=fe,h=fe,u,f){super(null,s,o,a,c,h,r,n,u,f),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var jf=new F,G0=new F,er=class l{constructor(e=[],t=[]){this.uuid=Te(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){let e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){B("Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let i=0,r=this.bones.length;i<r;i++)this.boneInverses.push(new F)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){let i=new F;this.bones[e]&&i.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(i)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){let i=this.bones[e];i&&i.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){let i=this.bones[e];i&&(i.parent&&i.parent.isBone?(i.matrix.copy(i.parent.matrixWorld).invert(),i.matrix.multiply(i.matrixWorld)):i.matrix.copy(i.matrixWorld),i.matrix.decompose(i.position,i.quaternion,i.scale))}}update(){let e=this.bones,t=this.boneInverses,i=this.boneMatrices,r=this.boneTexture;for(let n=0,s=e.length;n<s;n++){let o=e[n]?e[n].matrixWorld:G0;jf.multiplyMatrices(o,t[n]),jf.toArray(i,n*16)}r!==null&&(r.needsUpdate=!0)}clone(){return new l(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);let t=new Float32Array(e*e*4);t.set(this.boneMatrices);let i=new ze(t,e,e,je,gt);return i.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=i,this}getBoneByName(e){for(let t=0,i=this.bones.length;t<i;t++){let r=this.bones[t];if(r.name===e)return r}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let i=0,r=e.bones.length;i<r;i++){let n=e.bones[i],s=t[n];s===void 0&&(B("Skeleton: No bone found with UUID:",n),s=new hi),this.bones.push(s),this.boneInverses.push(new F().fromArray(e.boneInverses[i]))}return this.init(),this}toJSON(){let e={metadata:{version:4.7,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;let t=this.bones,i=this.boneInverses;for(let r=0,n=t.length;r<n;r++){let s=t[r];e.bones.push(s.uuid);let o=i[r];e.boneInverses.push(o.toArray())}return e}};var it=class extends K{constructor(e,t,i,r=1){super(e,t,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}};var gs=new F,$f=new F,rl=[],Qf=new he,H0=new F,qo=new ae,Xo=new oe,tr=class extends ae{constructor(e,t,i){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new it(new Float32Array(i*16),16),this.instanceColor=null,this.morphTexture=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let r=0;r<i;r++)this.setMatrixAt(r,H0)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new he),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,gs),Qf.copy(e.boundingBox).applyMatrix4(gs),this.boundingBox.union(Qf)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new oe),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,gs),Xo.copy(e.boundingSphere).applyMatrix4(gs),this.boundingSphere.union(Xo)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let i=t.morphTargetInfluences,r=this.morphTexture.source.data.data,n=i.length+1,s=e*n+1;for(let o=0;o<i.length;o++)i[o]=r[s+o]}raycast(e,t){let i=this.matrixWorld,r=this.count;if(qo.geometry=this.geometry,qo.material=this.material,qo.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Xo.copy(this.boundingSphere),Xo.applyMatrix4(i),e.ray.intersectsSphere(Xo)!==!1))for(let n=0;n<r;n++){this.getMatrixAt(n,gs),$f.multiplyMatrices(i,gs),qo.matrixWorld=$f,qo.raycast(e,rl);for(let s=0,o=rl.length;s<o;s++){let a=rl[s];a.instanceId=n,a.object=this,t.push(a)}rl.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new it(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let i=t.morphTargetInfluences,r=i.length+1;this.morphTexture===null&&(this.morphTexture=new ze(new Float32Array(r*this.count),r,this.count,Mr,gt));let n=this.morphTexture.source.data.data,s=0;for(let c=0;c<i.length;c++)s+=i[c];let o=this.geometry.morphTargetsRelative?1:1-s,a=r*e;return n[a]=o,n.set(i,a+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}};var Ur=new oe,W0=new T(.5,.5),nl=new y,Lt=class{constructor(e=new Pt,t=new Pt,i=new Pt,r=new Pt,n=new Pt,s=new Pt){this.planes=[e,t,i,r,n,s]}set(e,t,i,r,n,s){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(i),o[3].copy(r),o[4].copy(n),o[5].copy(s),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=Xe,i=!1){let r=this.planes,n=e.elements,s=n[0],o=n[1],a=n[2],c=n[3],h=n[4],u=n[5],f=n[6],d=n[7],p=n[8],m=n[9],g=n[10],_=n[11],x=n[12],v=n[13],b=n[14],M=n[15];if(r[0].setComponents(c-s,d-h,_-p,M-x).normalize(),r[1].setComponents(c+s,d+h,_+p,M+x).normalize(),r[2].setComponents(c+o,d+u,_+m,M+v).normalize(),r[3].setComponents(c-o,d-u,_-m,M-v).normalize(),i)r[4].setComponents(a,f,g,b).normalize(),r[5].setComponents(c-a,d-f,_-g,M-b).normalize();else if(r[4].setComponents(c-a,d-f,_-g,M-b).normalize(),t===Xe)r[5].setComponents(c+a,d+f,_+g,M+b).normalize();else if(t===zt)r[5].setComponents(a,f,g,b).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Ur.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Ur.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Ur)}intersectsSprite(e){Ur.center.set(0,0,0);let t=W0.distanceTo(e.center);return Ur.radius=.7071067811865476+t,Ur.applyMatrix4(e.matrixWorld),this.intersectsSphere(Ur)}intersectsSphere(e){let t=this.planes,i=e.center,r=-e.radius;for(let n=0;n<6;n++)if(t[n].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let r=t[i];if(nl.x=r.normal.x>0?e.max.x:e.min.x,nl.y=r.normal.y>0?e.max.y:e.min.y,nl.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(nl)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var ed=new F,_s=class l{constructor(){this.coordinateSystem=Xe,this._frustums=[],this._count=0}setFromArrayCamera(e){let t=e.cameras,i=this._frustums;for(let r=0;r<t.length;r++){let n=t[r];ed.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),i[r]===void 0&&(i[r]=new Lt),i[r].setFromProjectionMatrix(ed,n.coordinateSystem,n.reversedDepth)}return this._count=t.length,this}intersectsObject(e){let t=this._frustums;for(let i=0;i<this._count;i++)if(t[i].intersectsObject(e))return!0;return!1}intersectsSprite(e){let t=this._frustums;for(let i=0;i<this._count;i++)if(t[i].intersectsSprite(e))return!0;return!1}intersectsSphere(e){let t=this._frustums;for(let i=0;i<this._count;i++)if(t[i].intersectsSphere(e))return!0;return!1}intersectsBox(e){let t=this._frustums;for(let i=0;i<this._count;i++)if(t[i].intersectsBox(e))return!0;return!1}containsPoint(e){let t=this._frustums;for(let i=0;i<this._count;i++)if(t[i].containsPoint(e))return!0;return!1}copy(e){this.coordinateSystem=e.coordinateSystem;let t=this._frustums,i=e._frustums;for(let r=0;r<e._count;r++)t[r]===void 0&&(t[r]=new Lt),t[r].copy(i[r]);return this._count=e._count,this}clone(){return new l().copy(this)}};function $h(l,e){return l-e}function q0(l,e){return l.z-e.z}function X0(l,e){return e.z-l.z}var eu=class{constructor(){this.index=0,this.pool=[],this.list=[]}push(e,t,i,r){let n=this.pool,s=this.list;this.index>=n.length&&n.push({start:-1,count:-1,z:-1,index:-1});let o=n[this.index];s.push(o),this.index++,o.start=e,o.count=t,o.z=i,o.index=r}reset(){this.list.length=0,this.index=0}},yt=new F,Y0=new I(1,1,1),Z0=new Lt,J0=new _s,sl=new he,zr=new oe,Yo=new y,td=new y,K0=new y,Qh=new eu,rt=new ae,ol=[];function j0(l,e,t=0){let i=e.itemSize;if(l.isInterleavedBufferAttribute||l.array.constructor!==e.array.constructor){let r=l.count;for(let n=0;n<r;n++)for(let s=0;s<i;s++)e.setComponent(n+t,s,l.getComponent(n,s))}else e.array.set(l.array,t*i);e.needsUpdate=!0}function kr(l,e){if(l.constructor!==e.constructor){let t=Math.min(l.length,e.length);for(let i=0;i<t;i++)e[i]=l[i]}else{let t=Math.min(l.length,e.length);e.set(new l.constructor(l.buffer,0,t))}}var xs=class extends ae{constructor(e,t,i=t*2,r){super(new L,r),this.isBatchedMesh=!0,this.perObjectFrustumCulled=!0,this.sortObjects=!0,this.boundingBox=null,this.boundingSphere=null,this.customSort=null,this._instanceInfo=[],this._geometryInfo=[],this._availableInstanceIds=[],this._availableGeometryIds=[],this._nextIndexStart=0,this._nextVertexStart=0,this._geometryCount=0,this._visibilityChanged=!0,this._geometryInitialized=!1,this._maxInstanceCount=e,this._maxVertexCount=t,this._maxIndexCount=i,this._multiDrawCounts=new Int32Array(e),this._multiDrawStarts=new Int32Array(e),this._multiDrawCount=0,this._multiDrawBytesPerElement=1,this._matricesTexture=null,this._indirectTexture=null,this._colorsTexture=null,this._initMatricesTexture(),this._initIndirectTexture()}get maxInstanceCount(){return this._maxInstanceCount}get instanceCount(){return this._instanceInfo.length-this._availableInstanceIds.length}get unusedVertexCount(){return this._maxVertexCount-this._nextVertexStart}get unusedIndexCount(){return this._maxIndexCount-this._nextIndexStart}_initMatricesTexture(){let e=Math.sqrt(this._maxInstanceCount*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);let t=new Float32Array(e*e*4),i=new ze(t,e,e,je,gt);this._matricesTexture=i}_initIndirectTexture(){let e=Math.sqrt(this._maxInstanceCount);e=Math.ceil(e);let t=new Uint32Array(e*e),i=new ze(t,e,e,wr,Jt);this._indirectTexture=i}_initColorsTexture(){let e=Math.sqrt(this._maxInstanceCount);e=Math.ceil(e);let t=new Float32Array(e*e*4).fill(1),i=new ze(t,e,e,je,gt);i.colorSpace=Le.workingColorSpace,this._colorsTexture=i}_initializeGeometry(e){let t=this.geometry,i=this._maxVertexCount,r=this._maxIndexCount;if(this._geometryInitialized===!1){for(let n in e.attributes){let s=e.getAttribute(n),{array:o,itemSize:a,normalized:c}=s,h=new o.constructor(i*a),u=new K(h,a,c);t.setAttribute(n,u)}if(e.getIndex()!==null){let n=i>65535?new Uint32Array(r):new Uint16Array(r);t.setIndex(new K(n,1))}this._geometryInitialized=!0}}_validateGeometry(e){let t=this.geometry;if(!!e.getIndex()!=!!t.getIndex())throw new Error('THREE.BatchedMesh: All geometries must consistently have "index".');for(let i in t.attributes){if(!e.hasAttribute(i))throw new Error(`THREE.BatchedMesh: Added geometry missing "${i}". All geometries must have consistent attributes.`);let r=e.getAttribute(i),n=t.getAttribute(i);if(r.itemSize!==n.itemSize||r.normalized!==n.normalized)throw new Error("THREE.BatchedMesh: All attributes must have a consistent itemSize and normalized value.")}}validateInstanceId(e){let t=this._instanceInfo;if(e<0||e>=t.length||t[e].active===!1)throw new Error(`THREE.BatchedMesh: Invalid instanceId ${e}. Instance is either out of range or has been deleted.`)}validateGeometryId(e){let t=this._geometryInfo;if(e<0||e>=t.length||t[e].active===!1)throw new Error(`THREE.BatchedMesh: Invalid geometryId ${e}. Geometry is either out of range or has been deleted.`)}setCustomSort(e){return this.customSort=e,this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new he);let e=this.boundingBox,t=this._instanceInfo;e.makeEmpty();for(let i=0,r=t.length;i<r;i++){if(t[i].active===!1)continue;let n=t[i].geometryIndex;this.getMatrixAt(i,yt),this.getBoundingBoxAt(n,sl).applyMatrix4(yt),e.union(sl)}}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new oe);let e=this.boundingSphere,t=this._instanceInfo;e.makeEmpty();for(let i=0,r=t.length;i<r;i++){if(t[i].active===!1)continue;let n=t[i].geometryIndex;this.getMatrixAt(i,yt),this.getBoundingSphereAt(n,zr).applyMatrix4(yt),e.union(zr)}}addInstance(e){if(this._instanceInfo.length>=this.maxInstanceCount&&this._availableInstanceIds.length===0)throw new Error("THREE.BatchedMesh: Maximum item count reached.");let i={visible:!0,active:!0,geometryIndex:e},r=null;this._availableInstanceIds.length>0?(this._availableInstanceIds.sort($h),r=this._availableInstanceIds.shift(),this._instanceInfo[r]=i):(r=this._instanceInfo.length,this._instanceInfo.push(i));let n=this._matricesTexture;yt.identity().toArray(n.image.data,r*16),n.needsUpdate=!0;let s=this._colorsTexture;return s&&(Y0.toArray(s.image.data,r*4),s.needsUpdate=!0),this._visibilityChanged=!0,r}addGeometry(e,t=-1,i=-1){this._initializeGeometry(e),this._validateGeometry(e);let r={vertexStart:-1,vertexCount:-1,reservedVertexCount:-1,indexStart:-1,indexCount:-1,reservedIndexCount:-1,start:-1,count:-1,boundingBox:null,boundingSphere:null,active:!0},n=this._geometryInfo;r.vertexStart=this._nextVertexStart,r.reservedVertexCount=t===-1?e.getAttribute("position").count:t;let s=e.getIndex();if(s!==null&&(r.indexStart=this._nextIndexStart,r.reservedIndexCount=i===-1?s.count:i),r.indexStart!==-1&&r.indexStart+r.reservedIndexCount>this._maxIndexCount||r.vertexStart+r.reservedVertexCount>this._maxVertexCount)throw new Error("THREE.BatchedMesh: Reserved space request exceeds the maximum buffer size.");let a;return this._availableGeometryIds.length>0?(this._availableGeometryIds.sort($h),a=this._availableGeometryIds.shift(),n[a]=r):(a=this._geometryCount,this._geometryCount++,n.push(r)),this.setGeometryAt(a,e),this._nextIndexStart=r.indexStart+r.reservedIndexCount,this._nextVertexStart=r.vertexStart+r.reservedVertexCount,a}setGeometryAt(e,t){if(e>=this._geometryCount)throw new Error("THREE.BatchedMesh: Maximum geometry count reached.");this._validateGeometry(t);let i=this.geometry,r=i.getIndex()!==null,n=i.getIndex(),s=t.getIndex(),o=this._geometryInfo[e];if(r&&s.count>o.reservedIndexCount||t.attributes.position.count>o.reservedVertexCount)throw new Error("THREE.BatchedMesh: Reserved space not large enough for provided geometry.");let a=o.vertexStart,c=o.reservedVertexCount;o.vertexCount=t.getAttribute("position").count;for(let h in i.attributes){let u=t.getAttribute(h),f=i.getAttribute(h);j0(u,f,a);let d=u.itemSize;for(let p=u.count,m=c;p<m;p++){let g=a+p;for(let _=0;_<d;_++)f.setComponent(g,_,0)}f.needsUpdate=!0,f.addUpdateRange(a*d,c*d)}if(r){let h=o.indexStart,u=o.reservedIndexCount;o.indexCount=t.getIndex().count;for(let f=0;f<s.count;f++)n.setX(h+f,a+s.getX(f));for(let f=s.count,d=u;f<d;f++)n.setX(h+f,a);n.needsUpdate=!0,n.addUpdateRange(h,o.reservedIndexCount)}return o.start=r?o.indexStart:o.vertexStart,o.count=r?o.indexCount:o.vertexCount,o.boundingBox=null,t.boundingBox!==null&&(o.boundingBox=t.boundingBox.clone()),o.boundingSphere=null,t.boundingSphere!==null&&(o.boundingSphere=t.boundingSphere.clone()),this._visibilityChanged=!0,e}deleteGeometry(e){let t=this._geometryInfo;if(e>=t.length||t[e].active===!1)return this;let i=this._instanceInfo;for(let r=0,n=i.length;r<n;r++)i[r].active&&i[r].geometryIndex===e&&this.deleteInstance(r);return t[e].active=!1,this._availableGeometryIds.push(e),this._visibilityChanged=!0,this}deleteInstance(e){return this.validateInstanceId(e),this._instanceInfo[e].active=!1,this._availableInstanceIds.push(e),this._visibilityChanged=!0,this}optimize(){let e=0,t=0,i=this._geometryInfo,r=i.map((s,o)=>o).sort((s,o)=>i[s].vertexStart-i[o].vertexStart),n=this.geometry;for(let s=0,o=i.length;s<o;s++){let a=r[s],c=i[a];if(c.active!==!1){if(n.index!==null){if(c.indexStart!==t){let{indexStart:h,vertexStart:u,reservedIndexCount:f}=c,d=n.index,p=d.array,m=e-u;for(let g=h;g<h+f;g++)p[g]=p[g]+m;d.array.copyWithin(t,h,h+f),d.addUpdateRange(t,f),d.needsUpdate=!0,c.indexStart=t}t+=c.reservedIndexCount}if(c.vertexStart!==e){let{vertexStart:h,reservedVertexCount:u}=c,f=n.attributes;for(let d in f){let p=f[d],{array:m,itemSize:g}=p;m.copyWithin(e*g,h*g,(h+u)*g),p.addUpdateRange(e*g,u*g),p.needsUpdate=!0}c.vertexStart=e}e+=c.reservedVertexCount,c.start=n.index?c.indexStart:c.vertexStart}}return this._nextIndexStart=t,this._nextVertexStart=e,this._visibilityChanged=!0,this}getBoundingBoxAt(e,t){if(e>=this._geometryCount)return null;let i=this.geometry,r=this._geometryInfo[e];if(r.boundingBox===null){let n=new he,s=i.index,o=i.attributes.position;for(let a=r.start,c=r.start+r.count;a<c;a++){let h=a;s&&(h=s.getX(h)),n.expandByPoint(Yo.fromBufferAttribute(o,h))}r.boundingBox=n}return t.copy(r.boundingBox),t}getBoundingSphereAt(e,t){if(e>=this._geometryCount)return null;let i=this.geometry,r=this._geometryInfo[e];if(r.boundingSphere===null){let n=new oe;this.getBoundingBoxAt(e,sl),sl.getCenter(n.center);let s=i.index,o=i.attributes.position,a=0;for(let c=r.start,h=r.start+r.count;c<h;c++){let u=c;s&&(u=s.getX(u)),Yo.fromBufferAttribute(o,u),a=Math.max(a,n.center.distanceToSquared(Yo))}n.radius=Math.sqrt(a),r.boundingSphere=n}return t.copy(r.boundingSphere),t}setMatrixAt(e,t){this.validateInstanceId(e);let i=this._matricesTexture,r=this._matricesTexture.image.data;return t.toArray(r,e*16),i.needsUpdate=!0,this}getMatrixAt(e,t){return this.validateInstanceId(e),t.fromArray(this._matricesTexture.image.data,e*16)}setColorAt(e,t){return this.validateInstanceId(e),this._colorsTexture===null&&this._initColorsTexture(),t.toArray(this._colorsTexture.image.data,e*4),this._colorsTexture.needsUpdate=!0,this}getColorAt(e,t){return this.validateInstanceId(e),this._colorsTexture===null?t.isVector4?t.set(1,1,1,1):t.setRGB(1,1,1):t.fromArray(this._colorsTexture.image.data,e*4)}setVisibleAt(e,t){return this.validateInstanceId(e),this._instanceInfo[e].visible===t?this:(this._instanceInfo[e].visible=t,this._visibilityChanged=!0,this)}getVisibleAt(e){return this.validateInstanceId(e),this._instanceInfo[e].visible}setGeometryIdAt(e,t){return this.validateInstanceId(e),this.validateGeometryId(t),this._instanceInfo[e].geometryIndex=t,this._visibilityChanged=!0,this}getGeometryIdAt(e){return this.validateInstanceId(e),this._instanceInfo[e].geometryIndex}getGeometryRangeAt(e,t={}){this.validateGeometryId(e);let i=this._geometryInfo[e];return t.vertexStart=i.vertexStart,t.vertexCount=i.vertexCount,t.reservedVertexCount=i.reservedVertexCount,t.indexStart=i.indexStart,t.indexCount=i.indexCount,t.reservedIndexCount=i.reservedIndexCount,t.start=i.start,t.count=i.count,t}setInstanceCount(e){let t=this._availableInstanceIds,i=this._instanceInfo;for(t.sort($h);t[t.length-1]===i.length-1;)i.pop(),t.pop();if(e<i.length)throw new Error(`THREE.BatchedMesh: Instance ids outside the range ${e} are being used. Cannot shrink instance count.`);let r=new Int32Array(e),n=new Int32Array(e);kr(this._multiDrawCounts,r),kr(this._multiDrawStarts,n),this._multiDrawCounts=r,this._multiDrawStarts=n,this._maxInstanceCount=e;let s=this._indirectTexture,o=this._matricesTexture,a=this._colorsTexture;s.dispose(),this._initIndirectTexture(),kr(s.image.data,this._indirectTexture.image.data),o.dispose(),this._initMatricesTexture(),kr(o.image.data,this._matricesTexture.image.data),a&&(a.dispose(),this._initColorsTexture(),kr(a.image.data,this._colorsTexture.image.data))}setGeometrySize(e,t){let i=[...this._geometryInfo].filter(o=>o.active);if(Math.max(...i.map(o=>o.vertexStart+o.reservedVertexCount))>e)throw new Error(`THREE.BatchedMesh: Geometry vertex values are being used outside the range ${t}. Cannot shrink further.`);if(this.geometry.index&&Math.max(...i.map(a=>a.indexStart+a.reservedIndexCount))>t)throw new Error(`THREE.BatchedMesh: Geometry index values are being used outside the range ${t}. Cannot shrink further.`);let n=this.geometry;n.dispose(),this._maxVertexCount=e,this._maxIndexCount=t,this._geometryInitialized&&(this._geometryInitialized=!1,this.geometry=new L,this._initializeGeometry(n));let s=this.geometry;n.index&&kr(n.index.array,s.index.array);for(let o in n.attributes)kr(n.attributes[o].array,s.attributes[o].array)}raycast(e,t){let i=this._instanceInfo,r=this._geometryInfo,n=this.matrixWorld,s=this.geometry;rt.material=this.material,rt.geometry.index=s.index,rt.geometry.attributes=s.attributes,rt.geometry.boundingBox===null&&(rt.geometry.boundingBox=new he),rt.geometry.boundingSphere===null&&(rt.geometry.boundingSphere=new oe);for(let o=0,a=i.length;o<a;o++){if(!i[o].visible||!i[o].active)continue;let c=i[o].geometryIndex,h=r[c];rt.geometry.setDrawRange(h.start,h.count),this.getMatrixAt(o,rt.matrixWorld).premultiply(n),this.getBoundingBoxAt(c,rt.geometry.boundingBox),this.getBoundingSphereAt(c,rt.geometry.boundingSphere),rt.raycast(e,ol);for(let u=0,f=ol.length;u<f;u++){let d=ol[u];d.object=this,d.batchId=o,t.push(d)}ol.length=0}rt.material=null,rt.geometry.index=null,rt.geometry.attributes={},rt.geometry.setDrawRange(0,1/0)}copy(e){return super.copy(e),this.geometry=e.geometry.clone(),this.perObjectFrustumCulled=e.perObjectFrustumCulled,this.sortObjects=e.sortObjects,this.boundingBox=e.boundingBox!==null?e.boundingBox.clone():null,this.boundingSphere=e.boundingSphere!==null?e.boundingSphere.clone():null,this._geometryInfo=e._geometryInfo.map(t=>({...t,boundingBox:t.boundingBox!==null?t.boundingBox.clone():null,boundingSphere:t.boundingSphere!==null?t.boundingSphere.clone():null})),this._instanceInfo=e._instanceInfo.map(t=>({...t})),this._availableInstanceIds=e._availableInstanceIds.slice(),this._availableGeometryIds=e._availableGeometryIds.slice(),this._nextIndexStart=e._nextIndexStart,this._nextVertexStart=e._nextVertexStart,this._geometryCount=e._geometryCount,this._maxInstanceCount=e._maxInstanceCount,this._maxVertexCount=e._maxVertexCount,this._maxIndexCount=e._maxIndexCount,this._geometryInitialized=e._geometryInitialized,this._multiDrawCounts=e._multiDrawCounts.slice(),this._multiDrawStarts=e._multiDrawStarts.slice(),this._multiDrawBytesPerElement=e._multiDrawBytesPerElement,this._indirectTexture=e._indirectTexture.clone(),this._indirectTexture.image.data=this._indirectTexture.image.data.slice(),this._matricesTexture=e._matricesTexture.clone(),this._matricesTexture.image.data=this._matricesTexture.image.data.slice(),this._colorsTexture!==null&&(this._colorsTexture=e._colorsTexture.clone(),this._colorsTexture.image.data=this._colorsTexture.image.data.slice()),this}dispose(){super.dispose(),this.geometry.dispose(),this._matricesTexture.dispose(),this._matricesTexture=null,this._indirectTexture.dispose(),this._indirectTexture=null,this._colorsTexture!==null&&(this._colorsTexture.dispose(),this._colorsTexture=null)}onBeforeRender(e,t,i,r,n){if(!this._visibilityChanged&&!this.perObjectFrustumCulled&&!this.sortObjects)return;let s=r.getIndex(),o=s===null?1:s.array.BYTES_PER_ELEMENT,a=1;n.wireframe&&(a=2,o=r.attributes.position.count>65535?4:2);let c=this._instanceInfo,h=this._multiDrawStarts,u=this._multiDrawCounts,f=this._geometryInfo,d=this.perObjectFrustumCulled,p=this._indirectTexture,m=p.image.data,g=i.isArrayCamera?J0:Z0;d&&(i.isArrayCamera?g.setFromArrayCamera(i):(yt.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse).multiply(this.matrixWorld),g.setFromProjectionMatrix(yt,i.coordinateSystem,i.reversedDepth)));let _=0;if(this.sortObjects){yt.copy(this.matrixWorld).invert(),Yo.setFromMatrixPosition(i.matrixWorld).applyMatrix4(yt),td.set(0,0,-1).transformDirection(i.matrixWorld).transformDirection(yt);for(let b=0,M=c.length;b<M;b++)if(c[b].visible&&c[b].active){let w=c[b].geometryIndex;this.getMatrixAt(b,yt),this.getBoundingSphereAt(w,zr).applyMatrix4(yt);let S=!1;if(d&&(S=!g.intersectsSphere(zr)),!S){let A=f[w],C=K0.subVectors(zr.center,Yo).dot(td);Qh.push(A.start,A.count,C,b)}}let x=Qh.list,v=this.customSort;v===null?x.sort(n.transparent?X0:q0):v.call(this,x,i);for(let b=0,M=x.length;b<M;b++){let w=x[b];h[_]=w.start*o*a,u[_]=w.count*a,m[_]=w.index,_++}Qh.reset()}else for(let x=0,v=c.length;x<v;x++)if(c[x].visible&&c[x].active){let b=c[x].geometryIndex,M=!1;if(d&&(this.getMatrixAt(x,yt),this.getBoundingSphereAt(b,zr).applyMatrix4(yt),M=!g.intersectsSphere(zr)),!M){let w=f[b];h[_]=w.start*o*a,u[_]=w.count*a,m[_]=x,_++}}p.needsUpdate=!0,this._multiDrawCount=_,this._multiDrawBytesPerElement=o,this._visibilityChanged=!1}onBeforeShadow(e,t,i,r,n,s){this.onBeforeRender(e,null,r,n,s)}};var re=class extends ${constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new I(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}};var cl=new y,hl=new y,id=new F,Zo=new xt,al=new oe,tu=new y,rd=new y,ke=class extends G{constructor(e=new L,t=new re){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[0];for(let r=1,n=t.count;r<n;r++)cl.fromBufferAttribute(t,r-1),hl.fromBufferAttribute(t,r),i[r]=i[r-1],i[r]+=cl.distanceTo(hl);e.setAttribute("lineDistance",new R(i,1))}else B("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let i=this.geometry,r=this.matrixWorld,n=e.params.Line.threshold,s=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),al.copy(i.boundingSphere),al.applyMatrix4(r),al.radius+=n,e.ray.intersectsSphere(al)===!1)return;id.copy(r).invert(),Zo.copy(e.ray).applyMatrix4(id);let o=n/((this.scale.x+this.scale.y+this.scale.z)/3),a=o*o,c=this.isLineSegments?2:1,h=i.index,f=i.attributes.position;if(h!==null){let d=Math.max(0,s.start),p=Math.min(h.count,s.start+s.count);for(let m=d,g=p-1;m<g;m+=c){let _=h.getX(m),x=h.getX(m+1),v=ll(this,e,Zo,a,_,x,m);v&&t.push(v)}if(this.isLineLoop){let m=h.getX(p-1),g=h.getX(d),_=ll(this,e,Zo,a,m,g,p-1);_&&t.push(_)}}else{let d=Math.max(0,s.start),p=Math.min(f.count,s.start+s.count);for(let m=d,g=p-1;m<g;m+=c){let _=ll(this,e,Zo,a,m,m+1,m);_&&t.push(_)}if(this.isLineLoop){let m=ll(this,e,Zo,a,p-1,d,p-1);m&&t.push(m)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let n=0,s=r.length;n<s;n++){let o=r[n].name||String(n);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=n}}}}};function ll(l,e,t,i,r,n,s){let o=l.geometry.attributes.position;if(cl.fromBufferAttribute(o,r),hl.fromBufferAttribute(o,n),t.distanceSqToSegment(cl,hl,tu,rd)>i)return;tu.applyMatrix4(l.matrixWorld);let c=e.ray.origin.distanceTo(tu);if(!(c<e.near||c>e.far))return{distance:c,point:rd.clone().applyMatrix4(l.matrixWorld),index:s,face:null,faceIndex:null,barycoord:null,object:l}}var nd=new y,sd=new y,Me=class extends ke{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[];for(let r=0,n=t.count;r<n;r+=2)nd.fromBufferAttribute(t,r),sd.fromBufferAttribute(t,r+1),i[r]=r===0?0:i[r-1],i[r+1]=i[r]+nd.distanceTo(sd);e.setAttribute("lineDistance",new R(i,1))}else B("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}};var ir=class extends ke{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}};var ui=class extends ${constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new I(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}};var od=new F,iu=new xt,ul=new oe,fl=new y,rr=class extends G{constructor(e=new L,t=new ui){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let i=this.geometry,r=this.matrixWorld,n=e.params.Points.threshold,s=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),ul.copy(i.boundingSphere),ul.applyMatrix4(r),ul.radius+=n,e.ray.intersectsSphere(ul)===!1)return;od.copy(r).invert(),iu.copy(e.ray).applyMatrix4(od);let o=n/((this.scale.x+this.scale.y+this.scale.z)/3),a=o*o,c=i.index,u=i.attributes.position;if(c!==null){let f=Math.max(0,s.start),d=Math.min(c.count,s.start+s.count);for(let p=f,m=d;p<m;p++){let g=c.getX(p);fl.fromBufferAttribute(u,g),ad(fl,g,a,r,e,t,this)}}else{let f=Math.max(0,s.start),d=Math.min(u.count,s.start+s.count);for(let p=f,m=d;p<m;p++)fl.fromBufferAttribute(u,p),ad(fl,p,a,r,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let n=0,s=r.length;n<s;n++){let o=r[n].name||String(n);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=n}}}}};function ad(l,e,t,i,r,n,s){let o=iu.distanceSqToPoint(l);if(o<t){let a=new y;iu.closestPointToPoint(l,a),a.applyMatrix4(i);let c=r.ray.origin.distanceTo(a);if(c<r.near||c>r.far)return;n.push({distance:c,distanceToRay:Math.sqrt(o),point:a,index:e,face:null,faceIndex:null,barycoord:null,object:s})}}var ys=class extends te{constructor(e,t,i,r,n=de,s=de,o,a,c){super(e,t,i,r,n,s,o,a,c),this.isVideoTexture=!0,this.generateMipmaps=!1,this._requestVideoFrameCallbackId=0;let h=this;function u(){h.needsUpdate=!0,h._requestVideoFrameCallbackId=e.requestVideoFrameCallback(u)}"requestVideoFrameCallback"in e&&(this._requestVideoFrameCallbackId=e.requestVideoFrameCallback(u))}clone(){return new this.constructor(this.image).copy(this)}update(){let e=this.image;"requestVideoFrameCallback"in e===!1&&e.readyState>=e.HAVE_CURRENT_DATA&&(this.needsUpdate=!0)}dispose(){this._requestVideoFrameCallbackId!==0&&(this.source.data.cancelVideoFrameCallback(this._requestVideoFrameCallbackId),this._requestVideoFrameCallbackId=0),super.dispose()}};var dl=class extends ys{constructor(e,t,i,r,n,s,o,a){super({},e,t,i,r,n,s,o,a),this.isVideoFrameTexture=!0}update(){}clone(){return new this.constructor().copy(this)}setFrame(e){this.image=e,this.needsUpdate=!0}};var pl=class extends te{constructor(e,t){super({width:e,height:t}),this.isFramebufferTexture=!0,this.magFilter=fe,this.minFilter=fe,this.generateMipmaps=!1,this.needsUpdate=!0}};var fi=class extends te{constructor(e,t,i,r,n,s,o,a,c,h,u,f){super(null,s,o,a,c,h,r,n,u,f),this.isCompressedTexture=!0,this.image={width:t,height:i},this.mipmaps=e,this.flipY=!1,this.generateMipmaps=!1}};var ml=class extends fi{constructor(e,t,i,r,n,s){super(e,t,i,n,s),this.isCompressedArrayTexture=!0,this.image.depth=r,this.wrapR=Ue,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var gl=class extends fi{constructor(e,t,i){super(void 0,e[0].width,e[0].height,t,i,Ft),this.isCompressedCubeTexture=!0,this.isCubeTexture=!0,this.image=e}};var di=class extends te{constructor(e=[],t=Ft,i,r,n,s,o,a,c,h){super(e,t,i,r,n,s,o,a,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}};var _l=class extends te{constructor(e,t,i,r,n,s,o,a,c){super(e,t,i,r,n,s,o,a,c),this.isCanvasTexture=!0,this.needsUpdate=!0}};var xl=class extends te{constructor(e,t,i,r,n,s,o,a,c){super(e,t,i,r,n,s,o,a,c),this.isHTMLTexture=!0,this.generateMipmaps=!1,this.needsUpdate=!0;let h=e?e.parentNode:null;h!==null&&"requestPaint"in h&&(h.onpaint=()=>{this.needsUpdate=!0},h.requestPaint())}dispose(){let e=this.image?this.image.parentNode:null;e!==null&&"onpaint"in e&&(e.onpaint=null),super.dispose()}};var vs=class extends te{constructor(e,t,i=Jt,r,n,s,o=fe,a=fe,c,h=Vi,u=1){if(h!==Vi&&h!==To)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let f={width:e,height:t,depth:u};super(f,r,n,s,o,a,h,i,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new et(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}};var yl=class extends vs{constructor(e,t=Jt,i=Ft,r,n,s=fe,o=fe,a,c=Vi){let h={width:e,height:e,depth:1},u=[h,h,h,h,h,h];super(e,e,t,i,r,n,s,o,a,c),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}};var vl=class extends te{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}};var Gl={};sh(Gl,{BoxGeometry:()=>nr,CapsuleGeometry:()=>bl,CircleGeometry:()=>Sl,ConeGeometry:()=>Ss,CylinderGeometry:()=>bs,DodecahedronGeometry:()=>Ml,EdgesGeometry:()=>Cl,ExtrudeGeometry:()=>Pl,IcosahedronGeometry:()=>Ll,LatheGeometry:()=>Nl,OctahedronGeometry:()=>As,PlaneGeometry:()=>Dl,PolyhedronGeometry:()=>Gt,RingGeometry:()=>Bl,ShapeGeometry:()=>Ol,SphereGeometry:()=>Ts,TetrahedronGeometry:()=>Fl,TorusGeometry:()=>Ul,TorusKnotGeometry:()=>zl,TubeGeometry:()=>kl,WireframeGeometry:()=>Vl});var nr=class l extends L{constructor(e=1,t=1,i=1,r=1,n=1,s=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:n,depthSegments:s};let o=this;r=Math.floor(r),n=Math.floor(n),s=Math.floor(s);let a=[],c=[],h=[],u=[],f=0,d=0;p("z","y","x",-1,-1,i,t,e,s,n,0),p("z","y","x",1,-1,i,t,-e,s,n,1),p("x","z","y",1,1,e,i,t,r,s,2),p("x","z","y",1,-1,e,i,-t,r,s,3),p("x","y","z",1,-1,e,t,i,r,n,4),p("x","y","z",-1,-1,e,t,-i,r,n,5),this.setIndex(a),this.setAttribute("position",new R(c,3)),this.setAttribute("normal",new R(h,3)),this.setAttribute("uv",new R(u,2));function p(m,g,_,x,v,b,M,w,S,A,C){let E=b/S,P=M/A,V=b/2,W=M/2,ee=w/2,X=S+1,ue=A+1,_e=0,Ve=0,pe=new y;for(let xe=0;xe<ue;xe++){let ye=xe*P-W;for(let mt=0;mt<X;mt++){let at=mt*E-V;pe[m]=at*x,pe[g]=ye*v,pe[_]=ee,c.push(pe.x,pe.y,pe.z),pe[m]=0,pe[g]=0,pe[_]=w>0?1:-1,h.push(pe.x,pe.y,pe.z),u.push(mt/S),u.push(1-xe/A),_e+=1}}for(let xe=0;xe<A;xe++)for(let ye=0;ye<S;ye++){let mt=f+ye+X*xe,at=f+ye+X*(xe+1),bi=f+(ye+1)+X*(xe+1),Fi=f+(ye+1)+X*xe;a.push(mt,at,Fi),a.push(at,bi,Fi),Ve+=6}o.addGroup(d,Ve,C),d+=Ve,f+=_e}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new l(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};var bl=class l extends L{constructor(e=1,t=1,i=4,r=8,n=1){super(),this.type="CapsuleGeometry",this.parameters={radius:e,height:t,capSegments:i,radialSegments:r,heightSegments:n},t=Math.max(0,t),i=Math.max(1,Math.floor(i)),r=Math.max(3,Math.floor(r)),n=Math.max(1,Math.floor(n));let s=[],o=[],a=[],c=[],h=t/2,u=Math.PI/2*e,f=t,d=2*u+f,p=i*2+n,m=r+1,g=new y,_=new y;for(let x=0;x<=p;x++){let v=0,b=0,M=0,w=0;if(x<=i){let C=x/i,E=C*Math.PI/2;b=-h-e*Math.cos(E),M=e*Math.sin(E),w=-e*Math.cos(E),v=C*u}else if(x<=i+n){let C=(x-i)/n;b=-h+C*t,M=e,w=0,v=u+C*f}else{let C=(x-i-n)/i,E=C*Math.PI/2;b=h+e*Math.sin(E),M=e*Math.cos(E),w=e*Math.sin(E),v=u+f+C*u}let S=Math.max(0,Math.min(1,v/d)),A=0;x===0?A=.5/r:x===p&&(A=-.5/r);for(let C=0;C<=r;C++){let E=C/r,P=E*Math.PI*2,V=Math.sin(P),W=Math.cos(P);_.x=-M*W,_.y=b,_.z=M*V,o.push(_.x,_.y,_.z),g.set(-M*W,w,M*V),g.normalize(),a.push(g.x,g.y,g.z),c.push(E+A,S)}if(x>0){let C=(x-1)*m;for(let E=0;E<r;E++){let P=C+E,V=C+E+1,W=x*m+E,ee=x*m+E+1;s.push(P,V,W),s.push(V,ee,W)}}}this.setIndex(s),this.setAttribute("position",new R(o,3)),this.setAttribute("normal",new R(a,3)),this.setAttribute("uv",new R(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new l(e.radius,e.height,e.capSegments,e.radialSegments,e.heightSegments)}};var Sl=class l extends L{constructor(e=1,t=32,i=0,r=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:i,thetaLength:r},t=Math.max(3,t);let n=[],s=[],o=[],a=[],c=new y,h=new T;s.push(0,0,0),o.push(0,0,1),a.push(.5,.5);for(let u=0,f=3;u<=t;u++,f+=3){let d=i+u/t*r;c.x=e*Math.cos(d),c.y=e*Math.sin(d),s.push(c.x,c.y,c.z),o.push(0,0,1),h.x=(s[f]/e+1)/2,h.y=(s[f+1]/e+1)/2,a.push(h.x,h.y)}for(let u=1;u<=t;u++)n.push(u,u+1,0);this.setIndex(n),this.setAttribute("position",new R(s,3)),this.setAttribute("normal",new R(o,3)),this.setAttribute("uv",new R(a,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new l(e.radius,e.segments,e.thetaStart,e.thetaLength)}};var bs=class l extends L{constructor(e=1,t=1,i=1,r=32,n=1,s=!1,o=0,a=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:r,heightSegments:n,openEnded:s,thetaStart:o,thetaLength:a};let c=this;r=Math.floor(r),n=Math.floor(n);let h=[],u=[],f=[],d=[],p=0,m=[],g=i/2,_=0;x(),s===!1&&(e>0&&v(!0),t>0&&v(!1)),this.setIndex(h),this.setAttribute("position",new R(u,3)),this.setAttribute("normal",new R(f,3)),this.setAttribute("uv",new R(d,2));function x(){let b=new y,M=new y,w=0,S=(t-e)/i;for(let A=0;A<=n;A++){let C=[],E=A/n,P=E*(t-e)+e;for(let V=0;V<=r;V++){let W=V/r,ee=W*a+o,X=Math.sin(ee),ue=Math.cos(ee);M.x=P*X,M.y=-E*i+g,M.z=P*ue,u.push(M.x,M.y,M.z),b.set(X,S,ue).normalize(),f.push(b.x,b.y,b.z),d.push(W,1-E),C.push(p++)}m.push(C)}for(let A=0;A<r;A++)for(let C=0;C<n;C++){let E=m[C][A],P=m[C+1][A],V=m[C+1][A+1],W=m[C][A+1];(e>0||C!==0)&&(h.push(E,P,W),w+=3),(t>0||C!==n-1)&&(h.push(P,V,W),w+=3)}c.addGroup(_,w,0),_+=w}function v(b){let M=p,w=new T,S=new y,A=0,C=b===!0?e:t,E=b===!0?1:-1;for(let V=1;V<=r;V++)u.push(0,g*E,0),f.push(0,E,0),d.push(.5,.5),p++;let P=p;for(let V=0;V<=r;V++){let ee=V/r*a+o,X=Math.cos(ee),ue=Math.sin(ee);S.x=C*ue,S.y=g*E,S.z=C*X,u.push(S.x,S.y,S.z),f.push(0,E,0),w.x=X*.5+.5,w.y=ue*.5*E+.5,d.push(w.x,w.y),p++}for(let V=0;V<r;V++){let W=M+V,ee=P+V;b===!0?h.push(ee,ee+1,W):h.push(ee+1,ee,W),A+=3}c.addGroup(_,A,b===!0?1:2),_+=A}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new l(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}};var Ss=class l extends bs{constructor(e=1,t=1,i=32,r=1,n=!1,s=0,o=Math.PI*2){super(0,e,t,i,r,n,s,o),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:i,heightSegments:r,openEnded:n,thetaStart:s,thetaLength:o}}static fromJSON(e){return new l(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}};var Gt=class l extends L{constructor(e=[],t=[],i=1,r=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:i,detail:r};let n=[],s=[];o(r),c(i),h(),this.setAttribute("position",new R(n,3)),this.setAttribute("normal",new R(n.slice(),3)),this.setAttribute("uv",new R(s,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function o(x){let v=new y,b=new y,M=new y;for(let w=0;w<t.length;w+=3)d(t[w+0],v),d(t[w+1],b),d(t[w+2],M),a(v,b,M,x)}function a(x,v,b,M){let w=M+1,S=[];for(let A=0;A<=w;A++){S[A]=[];let C=x.clone().lerp(b,A/w),E=v.clone().lerp(b,A/w),P=w-A;for(let V=0;V<=P;V++)V===0&&A===w?S[A][V]=C:S[A][V]=C.clone().lerp(E,V/P)}for(let A=0;A<w;A++)for(let C=0;C<2*(w-A)-1;C++){let E=Math.floor(C/2);C%2===0?(f(S[A][E+1]),f(S[A+1][E]),f(S[A][E])):(f(S[A][E+1]),f(S[A+1][E+1]),f(S[A+1][E]))}}function c(x){let v=new y;for(let b=0;b<n.length;b+=3)v.x=n[b+0],v.y=n[b+1],v.z=n[b+2],v.normalize().multiplyScalar(x),n[b+0]=v.x,n[b+1]=v.y,n[b+2]=v.z}function h(){let x=new y;for(let v=0;v<n.length;v+=3){x.x=n[v+0],x.y=n[v+1],x.z=n[v+2];let b=g(x)/2/Math.PI+.5,M=_(x)/Math.PI+.5;s.push(b,1-M)}p(),u()}function u(){for(let x=0;x<s.length;x+=6){let v=s[x+0],b=s[x+2],M=s[x+4],w=Math.max(v,b,M),S=Math.min(v,b,M);w>.9&&S<.1&&(v<.2&&(s[x+0]+=1),b<.2&&(s[x+2]+=1),M<.2&&(s[x+4]+=1))}}function f(x){n.push(x.x,x.y,x.z)}function d(x,v){let b=x*3;v.x=e[b+0],v.y=e[b+1],v.z=e[b+2]}function p(){let x=new y,v=new y,b=new y,M=new y,w=new T,S=new T,A=new T;for(let C=0,E=0;C<n.length;C+=9,E+=6){x.set(n[C+0],n[C+1],n[C+2]),v.set(n[C+3],n[C+4],n[C+5]),b.set(n[C+6],n[C+7],n[C+8]),w.set(s[E+0],s[E+1]),S.set(s[E+2],s[E+3]),A.set(s[E+4],s[E+5]),M.copy(x).add(v).add(b).divideScalar(3);let P=g(M);m(w,E+0,x,P),m(S,E+2,v,P),m(A,E+4,b,P)}}function m(x,v,b,M){M<0&&x.x===1&&(s[v]=x.x-1),b.x===0&&b.z===0&&(s[v]=M/2/Math.PI+.5)}function g(x){return Math.atan2(x.z,-x.x)}function _(x){return Math.atan2(-x.y,Math.sqrt(x.x*x.x+x.z*x.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new l(e.vertices,e.indices,e.radius,e.detail)}};var Ml=class l extends Gt{constructor(e=1,t=0){let i=(1+Math.sqrt(5))/2,r=1/i,n=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-r,-i,0,-r,i,0,r,-i,0,r,i,-r,-i,0,-r,i,0,r,-i,0,r,i,0,-i,0,-r,i,0,-r,-i,0,r,i,0,r],s=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(n,s,e,t),this.type="DodecahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new l(e.radius,e.detail)}};var wl=new y,Al=new y,ru=new y,Tl=new _t,Cl=class extends L{constructor(e=null,t=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:e,thresholdAngle:t},e!==null){let r=Math.pow(10,4),n=Math.cos(ci*t),s=e.getIndex(),o=e.getAttribute("position"),a=s?s.count:o.count,c=[0,0,0],h=["a","b","c"],u=new Array(3),f={},d=[];for(let p=0;p<a;p+=3){s?(c[0]=s.getX(p),c[1]=s.getX(p+1),c[2]=s.getX(p+2)):(c[0]=p,c[1]=p+1,c[2]=p+2);let{a:m,b:g,c:_}=Tl;if(m.fromBufferAttribute(o,c[0]),g.fromBufferAttribute(o,c[1]),_.fromBufferAttribute(o,c[2]),Tl.getNormal(ru),u[0]=`${Math.round(m.x*r)},${Math.round(m.y*r)},${Math.round(m.z*r)}`,u[1]=`${Math.round(g.x*r)},${Math.round(g.y*r)},${Math.round(g.z*r)}`,u[2]=`${Math.round(_.x*r)},${Math.round(_.y*r)},${Math.round(_.z*r)}`,!(u[0]===u[1]||u[1]===u[2]||u[2]===u[0]))for(let x=0;x<3;x++){let v=(x+1)%3,b=u[x],M=u[v],w=Tl[h[x]],S=Tl[h[v]],A=`${b}_${M}`,C=`${M}_${b}`;C in f&&f[C]?(ru.dot(f[C].normal)<=n&&(d.push(w.x,w.y,w.z),d.push(S.x,S.y,S.z)),f[C]=null):A in f||(f[A]={index0:c[x],index1:c[v],normal:ru.clone()})}}for(let p in f)if(f[p]){let{index0:m,index1:g}=f[p];wl.fromBufferAttribute(o,m),Al.fromBufferAttribute(o,g),d.push(wl.x,wl.y,wl.z),d.push(Al.x,Al.y,Al.z)}this.setAttribute("position",new R(d,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}};var sr={};sh(sr,{ArcCurve:()=>Jo,CatmullRomCurve3:()=>Ko,CubicBezierCurve:()=>Hr,CubicBezierCurve3:()=>jo,EllipseCurve:()=>Ni,LineCurve:()=>Wr,LineCurve3:()=>$o,QuadraticBezierCurve:()=>qr,QuadraticBezierCurve3:()=>Xr,SplineCurve:()=>Yr});var we=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){B("Curve: .getPoint() not implemented.")}getPointAt(e,t){let i=this.getUtoTmapping(e);return this.getPoint(i,t)}getPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return t}getSpacedPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPointAt(i/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],i,r=this.getPoint(0),n=0;t.push(0);for(let s=1;s<=e;s++)i=this.getPoint(s/e),n+=i.distanceTo(r),t.push(n),r=i;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let i=this.getLengths(),r=0,n=i.length,s;t?s=t:s=e*i[n-1];let o=0,a=n-1,c;for(;o<=a;)if(r=Math.floor(o+(a-o)/2),c=i[r]-s,c<0)o=r+1;else if(c>0)a=r-1;else{a=r;break}if(r=a,i[r]===s)return r/(n-1);let h=i[r],f=i[r+1]-h,d=(s-h)/f;return(r+d)/(n-1)}getTangent(e,t){let r=e-1e-4,n=e+1e-4;r<0&&(r=0),n>1&&(n=1);let s=this.getPoint(r),o=this.getPoint(n),a=t||(s.isVector2?new T:new y);return a.copy(o).sub(s).normalize(),a}getTangentAt(e,t){let i=this.getUtoTmapping(e);return this.getTangent(i,t)}computeFrenetFrames(e,t=!1){let i=new y,r=[],n=[],s=[],o=new y,a=new F;for(let d=0;d<=e;d++){let p=d/e;r[d]=this.getTangentAt(p,new y)}n[0]=new y,s[0]=new y;let c=Number.MAX_VALUE,h=Math.abs(r[0].x),u=Math.abs(r[0].y),f=Math.abs(r[0].z);h<=c&&(c=h,i.set(1,0,0)),u<=c&&(c=u,i.set(0,1,0)),f<=c&&i.set(0,0,1),o.crossVectors(r[0],i).normalize(),n[0].crossVectors(r[0],o),s[0].crossVectors(r[0],n[0]);for(let d=1;d<=e;d++){if(n[d]=n[d-1].clone(),s[d]=s[d-1].clone(),o.crossVectors(r[d-1],r[d]),o.length()>Number.EPSILON){o.normalize();let p=Math.acos(k(r[d-1].dot(r[d]),-1,1));n[d].applyMatrix4(a.makeRotationAxis(o,p))}s[d].crossVectors(r[d],n[d])}if(t===!0){let d=Math.acos(k(n[0].dot(n[e]),-1,1));d/=e,r[0].dot(o.crossVectors(n[0],n[e]))>0&&(d=-d);for(let p=1;p<=e;p++)n[p].applyMatrix4(a.makeRotationAxis(r[p],d*p)),s[p].crossVectors(r[p],n[p])}return{tangents:r,normals:n,binormals:s}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}};var Ni=class extends we{constructor(e=0,t=0,i=1,r=1,n=0,s=Math.PI*2,o=!1,a=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=i,this.yRadius=r,this.aStartAngle=n,this.aEndAngle=s,this.aClockwise=o,this.aRotation=a}getPoint(e,t=new T){let i=t,r=Math.PI*2,n=this.aEndAngle-this.aStartAngle,s=Math.abs(n)<Number.EPSILON;for(;n<0;)n+=r;for(;n>r;)n-=r;n<Number.EPSILON&&(s?n=0:n=r),this.aClockwise===!0&&!s&&(n===r?n=-r:n=n-r);let o=this.aStartAngle+e*n,a=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){let h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),f=a-this.aX,d=c-this.aY;a=f*h-d*u+this.aX,c=f*u+d*h+this.aY}return i.set(a,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}};var Jo=class extends Ni{constructor(e,t,i,r,n,s){super(e,t,i,i,r,n,s),this.isArcCurve=!0,this.type="ArcCurve"}};function au(){let l=0,e=0,t=0,i=0;function r(n,s,o,a){l=n,e=o,t=-3*n+3*s-2*o-a,i=2*n-2*s+o+a}return{initCatmullRom:function(n,s,o,a,c){r(s,o,c*(o-n),c*(a-s))},initNonuniformCatmullRom:function(n,s,o,a,c,h,u){let f=(s-n)/c-(o-n)/(c+h)+(o-s)/h,d=(o-s)/h-(a-s)/(h+u)+(a-o)/u;f*=h,d*=h,r(s,o,f,d)},calc:function(n){let s=n*n,o=s*n;return l+e*n+t*s+i*o}}}var ld=new y,cd=new y,nu=new au,su=new au,ou=new au,Ko=class extends we{constructor(e=[],t=!1,i="centripetal",r=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=i,this.tension=r}getPoint(e,t=new y){let i=t,r=this.points,n=r.length,s=(n-(this.closed?0:1))*e,o=Math.floor(s),a=s-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/n)+1)*n:a===0&&o===n-1&&(o=n-2,a=1);let c,h;this.closed||o>0?c=r[(o-1)%n]:(cd.subVectors(r[0],r[1]).add(r[0]),c=cd);let u=r[o%n],f=r[(o+1)%n];if(this.closed||o+2<n?h=r[(o+2)%n]:(ld.subVectors(r[n-1],r[n-2]).add(r[n-1]),h=ld),this.curveType==="centripetal"||this.curveType==="chordal"){let d=this.curveType==="chordal"?.5:.25,p=Math.pow(c.distanceToSquared(u),d),m=Math.pow(u.distanceToSquared(f),d),g=Math.pow(f.distanceToSquared(h),d);m<1e-4&&(m=1),p<1e-4&&(p=m),g<1e-4&&(g=m),nu.initNonuniformCatmullRom(c.x,u.x,f.x,h.x,p,m,g),su.initNonuniformCatmullRom(c.y,u.y,f.y,h.y,p,m,g),ou.initNonuniformCatmullRom(c.z,u.z,f.z,h.z,p,m,g)}else this.curveType==="catmullrom"&&(nu.initCatmullRom(c.x,u.x,f.x,h.x,this.tension),su.initCatmullRom(c.y,u.y,f.y,h.y,this.tension),ou.initCatmullRom(c.z,u.z,f.z,h.z,this.tension));return i.set(nu.calc(a),su.calc(a),ou.calc(a)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(r.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let r=this.points[t];e.points.push(r.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(new y().fromArray(r))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function lu(l,e,t,i,r){let n=(i-e)*.5,s=(r-t)*.5,o=l*l,a=l*o;return(2*t-2*i+n+s)*a+(-3*t+3*i-2*n-s)*o+n*l+t}function $0(l,e){let t=1-l;return t*t*e}function Q0(l,e){return 2*(1-l)*l*e}function ey(l,e){return l*l*e}function Vr(l,e,t,i){return $0(l,e)+Q0(l,t)+ey(l,i)}function ty(l,e){let t=1-l;return t*t*t*e}function iy(l,e){let t=1-l;return 3*t*t*l*e}function ry(l,e){return 3*(1-l)*l*l*e}function ny(l,e){return l*l*l*e}function Gr(l,e,t,i,r){return ty(l,e)+iy(l,t)+ry(l,i)+ny(l,r)}var Hr=class extends we{constructor(e=new T,t=new T,i=new T,r=new T){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=i,this.v3=r}getPoint(e,t=new T){let i=t,r=this.v0,n=this.v1,s=this.v2,o=this.v3;return i.set(Gr(e,r.x,n.x,s.x,o.x),Gr(e,r.y,n.y,s.y,o.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}};var jo=class extends we{constructor(e=new y,t=new y,i=new y,r=new y){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=i,this.v3=r}getPoint(e,t=new y){let i=t,r=this.v0,n=this.v1,s=this.v2,o=this.v3;return i.set(Gr(e,r.x,n.x,s.x,o.x),Gr(e,r.y,n.y,s.y,o.y),Gr(e,r.z,n.z,s.z,o.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}};var Wr=class extends we{constructor(e=new T,t=new T){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new T){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new T){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}};var $o=class extends we{constructor(e=new y,t=new y){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new y){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new y){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}};var qr=class extends we{constructor(e=new T,t=new T,i=new T){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new T){let i=t,r=this.v0,n=this.v1,s=this.v2;return i.set(Vr(e,r.x,n.x,s.x),Vr(e,r.y,n.y,s.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}};var Xr=class extends we{constructor(e=new y,t=new y,i=new y){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new y){let i=t,r=this.v0,n=this.v1,s=this.v2;return i.set(Vr(e,r.x,n.x,s.x),Vr(e,r.y,n.y,s.y),Vr(e,r.z,n.z,s.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}};var Yr=class extends we{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new T){let i=t,r=this.points,n=(r.length-1)*e,s=Math.floor(n),o=n-s,a=r[s===0?s:s-1],c=r[s],h=r[s>r.length-2?r.length-1:s+1],u=r[s>r.length-3?r.length-1:s+2];return i.set(lu(o,a.x,c.x,h.x,u.x),lu(o,a.y,c.y,h.y,u.y)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(r.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let r=this.points[t];e.points.push(r.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(new T().fromArray(r))}return this}};var Ms=class extends we{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let i=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new sr[i](t,e))}return this}getPoint(e,t){let i=e*this.getLength(),r=this.getCurveLengths(),n=0;for(;n<r.length;){if(r[n]>=i){let s=r[n]-i,o=this.curves[n],a=o.getLength(),c=a===0?0:1-s/a;return o.getPointAt(c,t)}n++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let i=0,r=this.curves.length;i<r;i++)t+=this.curves[i].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],i;for(let r=0,n=this.curves;r<n.length;r++){let s=n[r],o=s.isEllipseCurve?e*2:s.isLineCurve||s.isLineCurve3?1:s.isSplineCurve?e*s.points.length:e,a=s.getPoints(o);for(let c=0;c<a.length;c++){let h=a[c];i&&i.equals(h)||(t.push(h),i=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let r=e.curves[t];this.curves.push(r.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,i=this.curves.length;t<i;t++){let r=this.curves[t];e.curves.push(r.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let r=e.curves[t];this.curves.push(new sr[r.type]().fromJSON(r))}return this}};var pi=class extends Ms{constructor(e){super(),this.type="Path",this.currentPoint=new T,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,i=e.length;t<i;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let i=new Wr(this.currentPoint.clone(),new T(e,t));return this.curves.push(i),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,i,r){let n=new qr(this.currentPoint.clone(),new T(e,t),new T(i,r));return this.curves.push(n),this.currentPoint.set(i,r),this}bezierCurveTo(e,t,i,r,n,s){let o=new Hr(this.currentPoint.clone(),new T(e,t),new T(i,r),new T(n,s));return this.curves.push(o),this.currentPoint.set(n,s),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),i=new Yr(t);return this.curves.push(i),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,i,r,n,s){let o=this.currentPoint.x,a=this.currentPoint.y;return this.absarc(e+o,t+a,i,r,n,s),this}absarc(e,t,i,r,n,s){return this.absellipse(e,t,i,i,r,n,s),this}ellipse(e,t,i,r,n,s,o,a){let c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+c,t+h,i,r,n,s,o,a),this}absellipse(e,t,i,r,n,s,o,a){let c=new Ni(e,t,i,r,n,s,o,a);if(this.curves.length>0){let u=c.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(c);let h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}};var Ht=class extends pi{constructor(e){super(e),this.uuid=Te(),this.type="Shape",this.holes=[]}getPointsHoles(e){let t=[];for(let i=0,r=this.holes.length;i<r;i++)t[i]=this.holes[i].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let r=e.holes[t];this.holes.push(r.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,i=this.holes.length;t<i;t++){let r=this.holes[t];e.holes.push(r.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let r=e.holes[t];this.holes.push(new pi().fromJSON(r))}return this}};function uu(l,e,t=2){let i=e&&e.length,r=i?e[0]*t:l.length,n=ud(l,0,r,t,!0),s=[];if(!n||n.next===n.prev)return s;let o,a,c;if(i&&(n=cy(l,e,n,t)),l.length>80*t){o=l[0],a=l[1];let h=o,u=a;for(let f=t;f<r;f+=t){let d=l[f],p=l[f+1];d<o&&(o=d),p<a&&(a=p),d>h&&(h=d),p>u&&(u=p)}c=Math.max(h-o,u-a),c=c!==0?32767/c:0}return ea(n,s,t,o,a,c,0),s}function ud(l,e,t,i,r){let n;if(r===vy(l,e,t,i)>0)for(let s=e;s<t;s+=i)n=hd(s/i|0,l[s],l[s+1],n);else for(let s=t-i;s>=e;s-=i)n=hd(s/i|0,l[s],l[s+1],n);return n&&ws(n,n.next)&&(ia(n),n=n.next),n}function Zr(l,e){if(!l)return l;e||(e=l);let t=l,i;do if(i=!1,!t.steiner&&(ws(t,t.next)||Ce(t.prev,t,t.next)===0)){if(ia(t),t=e=t.prev,t===t.next)break;i=!0}else t=t.next;while(i||t!==e);return e}function ea(l,e,t,i,r,n,s){if(!l)return;!s&&n&&py(l,i,r,n);let o=l;for(;l.prev!==l.next;){let a=l.prev,c=l.next;if(n?oy(l,i,r,n):sy(l)){e.push(a.i,l.i,c.i),ia(l),l=c.next,o=c.next;continue}if(l=c,l===o){s?s===1?(l=ay(Zr(l),e),ea(l,e,t,i,r,n,2)):s===2&&ly(l,e,t,i,r,n):ea(Zr(l),e,t,i,r,n,1);break}}}function sy(l){let e=l.prev,t=l,i=l.next;if(Ce(e,t,i)>=0)return!1;let r=e.x,n=t.x,s=i.x,o=e.y,a=t.y,c=i.y,h=Math.min(r,n,s),u=Math.min(o,a,c),f=Math.max(r,n,s),d=Math.max(o,a,c),p=i.next;for(;p!==e;){if(p.x>=h&&p.x<=f&&p.y>=u&&p.y<=d&&Qo(r,o,n,a,s,c,p.x,p.y)&&Ce(p.prev,p,p.next)>=0)return!1;p=p.next}return!0}function oy(l,e,t,i){let r=l.prev,n=l,s=l.next;if(Ce(r,n,s)>=0)return!1;let o=r.x,a=n.x,c=s.x,h=r.y,u=n.y,f=s.y,d=Math.min(o,a,c),p=Math.min(h,u,f),m=Math.max(o,a,c),g=Math.max(h,u,f),_=cu(d,p,e,t,i),x=cu(m,g,e,t,i),v=l.prevZ,b=l.nextZ;for(;v&&v.z>=_&&b&&b.z<=x;){if(v.x>=d&&v.x<=m&&v.y>=p&&v.y<=g&&v!==r&&v!==s&&Qo(o,h,a,u,c,f,v.x,v.y)&&Ce(v.prev,v,v.next)>=0||(v=v.prevZ,b.x>=d&&b.x<=m&&b.y>=p&&b.y<=g&&b!==r&&b!==s&&Qo(o,h,a,u,c,f,b.x,b.y)&&Ce(b.prev,b,b.next)>=0))return!1;b=b.nextZ}for(;v&&v.z>=_;){if(v.x>=d&&v.x<=m&&v.y>=p&&v.y<=g&&v!==r&&v!==s&&Qo(o,h,a,u,c,f,v.x,v.y)&&Ce(v.prev,v,v.next)>=0)return!1;v=v.prevZ}for(;b&&b.z<=x;){if(b.x>=d&&b.x<=m&&b.y>=p&&b.y<=g&&b!==r&&b!==s&&Qo(o,h,a,u,c,f,b.x,b.y)&&Ce(b.prev,b,b.next)>=0)return!1;b=b.nextZ}return!0}function ay(l,e){let t=l;do{let i=t.prev,r=t.next.next;!ws(i,r)&&dd(i,t,t.next,r)&&ta(i,r)&&ta(r,i)&&(e.push(i.i,t.i,r.i),ia(t),ia(t.next),t=l=r),t=t.next}while(t!==l);return Zr(t)}function ly(l,e,t,i,r,n){let s=l;do{let o=s.next.next;for(;o!==s.prev;){if(s.i!==o.i&&_y(s,o)){let a=pd(s,o);s=Zr(s,s.next),a=Zr(a,a.next),ea(s,e,t,i,r,n,0),ea(a,e,t,i,r,n,0);return}o=o.next}s=s.next}while(s!==l)}function cy(l,e,t,i){let r=[];for(let n=0,s=e.length;n<s;n++){let o=e[n]*i,a=n<s-1?e[n+1]*i:l.length,c=ud(l,o,a,i,!1);c===c.next&&(c.steiner=!0),r.push(gy(c))}r.sort(hy);for(let n=0;n<r.length;n++)t=uy(r[n],t);return t}function hy(l,e){let t=l.x-e.x;if(t===0&&(t=l.y-e.y,t===0)){let i=(l.next.y-l.y)/(l.next.x-l.x),r=(e.next.y-e.y)/(e.next.x-e.x);t=i-r}return t}function uy(l,e){let t=fy(l,e);if(!t)return e;let i=pd(t,l);return Zr(i,i.next),Zr(t,t.next)}function fy(l,e){let t=e,i=l.x,r=l.y,n=-1/0,s;if(ws(l,t))return t;do{if(ws(l,t.next))return t.next;if(r<=t.y&&r>=t.next.y&&t.next.y!==t.y){let u=t.x+(r-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(u<=i&&u>n&&(n=u,s=t.x<t.next.x?t:t.next,u===i))return s}t=t.next}while(t!==e);if(!s)return null;let o=s,a=s.x,c=s.y,h=1/0;t=s;do{if(i>=t.x&&t.x>=a&&i!==t.x&&fd(r<c?i:n,r,a,c,r<c?n:i,r,t.x,t.y)){let u=Math.abs(r-t.y)/(i-t.x);ta(t,l)&&(u<h||u===h&&(t.x>s.x||t.x===s.x&&dy(s,t)))&&(s=t,h=u)}t=t.next}while(t!==o);return s}function dy(l,e){return Ce(l.prev,l,e.prev)<0&&Ce(e.next,l,l.next)<0}function py(l,e,t,i){let r=l;do r.z===0&&(r.z=cu(r.x,r.y,e,t,i)),r.prevZ=r.prev,r.nextZ=r.next,r=r.next;while(r!==l);r.prevZ.nextZ=null,r.prevZ=null,my(r)}function my(l){let e,t=1;do{let i=l,r;l=null;let n=null;for(e=0;i;){e++;let s=i,o=0;for(let c=0;c<t&&(o++,s=s.nextZ,!!s);c++);let a=t;for(;o>0||a>0&&s;)o!==0&&(a===0||!s||i.z<=s.z)?(r=i,i=i.nextZ,o--):(r=s,s=s.nextZ,a--),n?n.nextZ=r:l=r,r.prevZ=n,n=r;i=s}n.nextZ=null,t*=2}while(e>1);return l}function cu(l,e,t,i,r){return l=(l-t)*r|0,e=(e-i)*r|0,l=(l|l<<8)&16711935,l=(l|l<<4)&252645135,l=(l|l<<2)&858993459,l=(l|l<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,l|e<<1}function gy(l){let e=l,t=l;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==l);return t}function fd(l,e,t,i,r,n,s,o){return(r-s)*(e-o)>=(l-s)*(n-o)&&(l-s)*(i-o)>=(t-s)*(e-o)&&(t-s)*(n-o)>=(r-s)*(i-o)}function Qo(l,e,t,i,r,n,s,o){return!(l===s&&e===o)&&fd(l,e,t,i,r,n,s,o)}function _y(l,e){return l.next.i!==e.i&&l.prev.i!==e.i&&!xy(l,e)&&(ta(l,e)&&ta(e,l)&&yy(l,e)&&(Ce(l.prev,l,e.prev)||Ce(l,e.prev,e))||ws(l,e)&&Ce(l.prev,l,l.next)>0&&Ce(e.prev,e,e.next)>0)}function Ce(l,e,t){return(e.y-l.y)*(t.x-e.x)-(e.x-l.x)*(t.y-e.y)}function ws(l,e){return l.x===e.x&&l.y===e.y}function dd(l,e,t,i){let r=Il(Ce(l,e,t)),n=Il(Ce(l,e,i)),s=Il(Ce(t,i,l)),o=Il(Ce(t,i,e));return!!(r!==n&&s!==o||r===0&&El(l,t,e)||n===0&&El(l,i,e)||s===0&&El(t,l,i)||o===0&&El(t,e,i))}function El(l,e,t){return e.x<=Math.max(l.x,t.x)&&e.x>=Math.min(l.x,t.x)&&e.y<=Math.max(l.y,t.y)&&e.y>=Math.min(l.y,t.y)}function Il(l){return l>0?1:l<0?-1:0}function xy(l,e){let t=l;do{if(t.i!==l.i&&t.next.i!==l.i&&t.i!==e.i&&t.next.i!==e.i&&dd(t,t.next,l,e))return!0;t=t.next}while(t!==l);return!1}function ta(l,e){return Ce(l.prev,l,l.next)<0?Ce(l,e,l.next)>=0&&Ce(l,l.prev,e)>=0:Ce(l,e,l.prev)<0||Ce(l,l.next,e)<0}function yy(l,e){let t=l,i=!1,r=(l.x+e.x)/2,n=(l.y+e.y)/2;do t.y>n!=t.next.y>n&&t.next.y!==t.y&&r<(t.next.x-t.x)*(n-t.y)/(t.next.y-t.y)+t.x&&(i=!i),t=t.next;while(t!==l);return i}function pd(l,e){let t=hu(l.i,l.x,l.y),i=hu(e.i,e.x,e.y),r=l.next,n=e.prev;return l.next=e,e.prev=l,t.next=r,r.prev=t,i.next=t,t.prev=i,n.next=i,i.prev=n,i}function hd(l,e,t,i){let r=hu(l,e,t);return i?(r.next=i.next,r.prev=i,i.next.prev=r,i.next=r):(r.prev=r,r.next=r),r}function ia(l){l.next.prev=l.prev,l.prev.next=l.next,l.prevZ&&(l.prevZ.nextZ=l.nextZ),l.nextZ&&(l.nextZ.prevZ=l.prevZ)}function hu(l,e,t){return{i:l,x:e,y:t,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function vy(l,e,t,i){let r=0;for(let n=e,s=t-i;n<t;n+=i)r+=(l[s]-l[n])*(l[n+1]+l[s+1]),s=n;return r}var Rl=class{static triangulate(e,t,i=2){return uu(e,t,i)}};var ft=class l{static area(e){let t=e.length,i=0;for(let r=t-1,n=0;n<t;r=n++)i+=e[r].x*e[n].y-e[n].x*e[r].y;return i*.5}static isClockWise(e){return l.area(e)<0}static triangulateShape(e,t){let i=[],r=[],n=[];md(e),gd(i,e);let s=e.length;t.forEach(md);for(let a=0;a<t.length;a++)r.push(s),s+=t[a].length,gd(i,t[a]);let o=Rl.triangulate(i,r);for(let a=0;a<o.length;a+=3)n.push(o.slice(a,a+3));return n}};function md(l){let e=l.length;e>2&&l[e-1].equals(l[0])&&l.pop()}function gd(l,e){for(let t=0;t<e.length;t++)l.push(e[t].x),l.push(e[t].y)}var Pl=class l extends L{constructor(e=new Ht([new T(.5,.5),new T(-.5,.5),new T(-.5,-.5),new T(.5,-.5)]),t={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:e,options:t},e=Array.isArray(e)?e:[e];let i=this,r=[],n=[];for(let o=0,a=e.length;o<a;o++){let c=e[o];s(c)}this.setAttribute("position",new R(r,3)),this.setAttribute("uv",new R(n,2)),this.computeVertexNormals();function s(o){let a=[],c=t.curveSegments!==void 0?t.curveSegments:12,h=t.steps!==void 0?t.steps:1,u=t.depth!==void 0?t.depth:1,f=t.bevelEnabled!==void 0?t.bevelEnabled:!0,d=t.bevelThickness!==void 0?t.bevelThickness:.2,p=t.bevelSize!==void 0?t.bevelSize:d-.1,m=t.bevelOffset!==void 0?t.bevelOffset:0,g=t.bevelSegments!==void 0?t.bevelSegments:3,_=t.extrudePath,x=t.UVGenerator!==void 0?t.UVGenerator:by,v,b=!1,M,w,S,A;if(_){v=_.getSpacedPoints(h),b=!0,f=!1;let D=_.isCatmullRomCurve3?_.closed:!1;M=_.computeFrenetFrames(h,D),w=new y,S=new y,A=new y}f||(g=0,d=0,p=0,m=0);let C=o.extractPoints(c),E=C.shape,P=C.holes;if(!ft.isClockWise(E)){E=E.reverse();for(let D=0,U=P.length;D<U;D++){let z=P[D];ft.isClockWise(z)&&(P[D]=z.reverse())}}function W(D){let z=10000000000000001e-36,q=D[0];for(let H=1;H<=D.length;H++){let se=H%D.length,j=D[se],ve=j.x-q.x,Ae=j.y-q.y,Fe=ve*ve+Ae*Ae,St=Math.max(Math.abs(j.x),Math.abs(j.y),Math.abs(q.x),Math.abs(q.y)),xr=z*St*St;if(Fe<=xr){D.splice(se,1),H--;continue}q=j}}W(E),P.forEach(W);let ee=P.length,X=E;for(let D=0;D<ee;D++){let U=P[D];E=E.concat(U)}function ue(D,U,z){return U||Z("ExtrudeGeometry: vec does not exist"),D.clone().addScaledVector(U,z)}let _e=E.length;function Ve(D,U,z){let q,H,se,j=D.x-U.x,ve=D.y-U.y,Ae=z.x-D.x,Fe=z.y-D.y,St=j*j+ve*ve,xr=j*Fe-ve*Ae;if(Math.abs(xr)>Number.EPSILON){let Mt=Math.sqrt(St),gf=Math.sqrt(Ae*Ae+Fe*Fe),_f=U.x-ve/Mt,xf=U.y+j/Mt,__=z.x-Fe/gf,x_=z.y+Ae/gf,yf=((__-_f)*Fe-(x_-xf)*Ae)/(j*Fe-ve*Ae);q=_f+j*yf-D.x,H=xf+ve*yf-D.y;let vf=q*q+H*H;if(vf<=2)return new T(q,H);se=Math.sqrt(vf/2)}else{let Mt=!1;j>Number.EPSILON?Ae>Number.EPSILON&&(Mt=!0):j<-Number.EPSILON?Ae<-Number.EPSILON&&(Mt=!0):Math.sign(ve)===Math.sign(Fe)&&(Mt=!0),Mt?(q=-ve,H=j,se=Math.sqrt(St)):(q=j,H=ve,se=Math.sqrt(St/2))}return new T(q/se,H/se)}let pe=[];for(let D=0,U=X.length,z=U-1,q=D+1;D<U;D++,z++,q++)z===U&&(z=0),q===U&&(q=0),pe[D]=Ve(X[D],X[z],X[q]);let xe=[],ye,mt=pe.concat();for(let D=0,U=ee;D<U;D++){let z=P[D];ye=[];for(let q=0,H=z.length,se=H-1,j=q+1;q<H;q++,se++,j++)se===H&&(se=0),j===H&&(j=0),ye[q]=Ve(z[q],z[se],z[j]);xe.push(ye),mt=mt.concat(ye)}let at;if(g===0)at=ft.triangulateShape(X,P);else{let D=[],U=[];for(let z=0;z<g;z++){let q=z/g,H=d*Math.cos(q*Math.PI/2),se=p*Math.sin(q*Math.PI/2)+m;for(let j=0,ve=X.length;j<ve;j++){let Ae=ue(X[j],pe[j],se);lt(Ae.x,Ae.y,-H),q===0&&D.push(Ae)}for(let j=0,ve=ee;j<ve;j++){let Ae=P[j];ye=xe[j];let Fe=[];for(let St=0,xr=Ae.length;St<xr;St++){let Mt=ue(Ae[St],ye[St],se);lt(Mt.x,Mt.y,-H),q===0&&Fe.push(Mt)}q===0&&U.push(Fe)}}at=ft.triangulateShape(D,U)}let bi=at.length,Fi=p+m;for(let D=0;D<_e;D++){let U=f?ue(E[D],mt[D],Fi):E[D];b?(S.copy(M.normals[0]).multiplyScalar(U.x),w.copy(M.binormals[0]).multiplyScalar(U.y),A.copy(v[0]).add(S).add(w),lt(A.x,A.y,A.z)):lt(U.x,U.y,0)}for(let D=1;D<=h;D++)for(let U=0;U<_e;U++){let z=f?ue(E[U],mt[U],Fi):E[U];b?(S.copy(M.normals[D]).multiplyScalar(z.x),w.copy(M.binormals[D]).multiplyScalar(z.y),A.copy(v[D]).add(S).add(w),lt(A.x,A.y,A.z)):lt(z.x,z.y,u/h*D)}for(let D=g-1;D>=0;D--){let U=D/g,z=d*Math.cos(U*Math.PI/2),q=p*Math.sin(U*Math.PI/2)+m;for(let H=0,se=X.length;H<se;H++){let j=ue(X[H],pe[H],q);lt(j.x,j.y,u+z)}for(let H=0,se=P.length;H<se;H++){let j=P[H];ye=xe[H];for(let ve=0,Ae=j.length;ve<Ae;ve++){let Fe=ue(j[ve],ye[ve],q);b?lt(Fe.x,Fe.y+v[h-1].y,v[h-1].x+z):lt(Fe.x,Fe.y,u+z)}}}ma(),ga();function ma(){let D=r.length/3;if(f){let U=0,z=_e*U;for(let q=0;q<bi;q++){let H=at[q];ai(H[2]+z,H[1]+z,H[0]+z)}U=h+g*2,z=_e*U;for(let q=0;q<bi;q++){let H=at[q];ai(H[0]+z,H[1]+z,H[2]+z)}}else{for(let U=0;U<bi;U++){let z=at[U];ai(z[2],z[1],z[0])}for(let U=0;U<bi;U++){let z=at[U];ai(z[0]+_e*h,z[1]+_e*h,z[2]+_e*h)}}i.addGroup(D,r.length/3-D,0)}function ga(){let D=r.length/3,U=0;Ui(X,U),U+=X.length;for(let z=0,q=P.length;z<q;z++){let H=P[z];Ui(H,U),U+=H.length}i.addGroup(D,r.length/3-D,1)}function Ui(D,U){let z=D.length;for(;--z>=0;){let q=z,H=z-1;H<0&&(H=D.length-1);for(let se=0,j=h+g*2;se<j;se++){let ve=_e*se,Ae=_e*(se+1),Fe=U+q+ve,St=U+H+ve,xr=U+H+Ae,Mt=U+q+Ae;ho(Fe,St,xr,Mt)}}}function lt(D,U,z){a.push(D),a.push(U),a.push(z)}function ai(D,U,z){bt(D),bt(U),bt(z);let q=r.length/3,H=x.generateTopUV(i,r,q-3,q-2,q-1);Si(H[0]),Si(H[1]),Si(H[2])}function ho(D,U,z,q){bt(D),bt(U),bt(q),bt(U),bt(z),bt(q);let H=r.length/3,se=x.generateSideWallUV(i,r,H-6,H-3,H-2,H-1);Si(se[0]),Si(se[1]),Si(se[3]),Si(se[1]),Si(se[2]),Si(se[3])}function bt(D){r.push(a[D*3+0]),r.push(a[D*3+1]),r.push(a[D*3+2])}function Si(D){n.push(D.x),n.push(D.y)}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes,i=this.parameters.options;return Sy(t,i,e)}static fromJSON(e,t){let i=[];for(let n=0,s=e.shapes.length;n<s;n++){let o=t[e.shapes[n]];i.push(o)}let r=e.options.extrudePath;return r!==void 0&&(e.options.extrudePath=new sr[r.type]().fromJSON(r)),new l(i,e.options)}},by={generateTopUV:function(l,e,t,i,r){let n=e[t*3],s=e[t*3+1],o=e[i*3],a=e[i*3+1],c=e[r*3],h=e[r*3+1];return[new T(n,s),new T(o,a),new T(c,h)]},generateSideWallUV:function(l,e,t,i,r,n){let s=e[t*3],o=e[t*3+1],a=e[t*3+2],c=e[i*3],h=e[i*3+1],u=e[i*3+2],f=e[r*3],d=e[r*3+1],p=e[r*3+2],m=e[n*3],g=e[n*3+1],_=e[n*3+2];return Math.abs(o-h)<Math.abs(s-c)?[new T(s,1-a),new T(c,1-u),new T(f,1-p),new T(m,1-_)]:[new T(o,1-a),new T(h,1-u),new T(d,1-p),new T(g,1-_)]}};function Sy(l,e,t){if(t.shapes=[],Array.isArray(l))for(let i=0,r=l.length;i<r;i++){let n=l[i];t.shapes.push(n.uuid)}else t.shapes.push(l.uuid);return t.options=Object.assign({},e),e.extrudePath!==void 0&&(t.options.extrudePath=e.extrudePath.toJSON()),t}var Ll=class l extends Gt{constructor(e=1,t=0){let i=(1+Math.sqrt(5))/2,r=[-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],n=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(r,n,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new l(e.radius,e.detail)}};var Nl=class l extends L{constructor(e=[new T(0,-.5),new T(.5,0),new T(0,.5)],t=12,i=0,r=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:i,phiLength:r},t=Math.floor(t),r=k(r,0,Math.PI*2);let n=[],s=[],o=[],a=[],c=[],h=1/t,u=new y,f=new T,d=new y,p=new y,m=new y,g=0,_=0;for(let x=0;x<=e.length-1;x++)switch(x){case 0:g=e[x+1].x-e[x].x,_=e[x+1].y-e[x].y,d.x=_*1,d.y=-g,d.z=_*0,m.copy(d),d.normalize(),a.push(d.x,d.y,d.z);break;case e.length-1:a.push(m.x,m.y,m.z);break;default:g=e[x+1].x-e[x].x,_=e[x+1].y-e[x].y,d.x=_*1,d.y=-g,d.z=_*0,p.copy(d),d.x+=m.x,d.y+=m.y,d.z+=m.z,d.normalize(),a.push(d.x,d.y,d.z),m.copy(p)}for(let x=0;x<=t;x++){let v=i+x*h*r,b=Math.sin(v),M=Math.cos(v);for(let w=0;w<=e.length-1;w++){u.x=e[w].x*b,u.y=e[w].y,u.z=e[w].x*M,s.push(u.x,u.y,u.z),f.x=x/t,f.y=w/(e.length-1),o.push(f.x,f.y);let S=a[3*w+0]*b,A=a[3*w+1],C=a[3*w+0]*M;c.push(S,A,C)}}for(let x=0;x<t;x++)for(let v=0;v<e.length-1;v++){let b=v+x*e.length,M=b,w=b+e.length,S=b+e.length+1,A=b+1;n.push(M,w,A),n.push(S,A,w)}this.setIndex(n),this.setAttribute("position",new R(s,3)),this.setAttribute("uv",new R(o,2)),this.setAttribute("normal",new R(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new l(e.points,e.segments,e.phiStart,e.phiLength)}};var As=class l extends Gt{constructor(e=1,t=0){let i=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],r=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(i,r,e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new l(e.radius,e.detail)}};var Dl=class l extends L{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};let n=e/2,s=t/2,o=Math.floor(i),a=Math.floor(r),c=o+1,h=a+1,u=e/o,f=t/a,d=[],p=[],m=[],g=[];for(let _=0;_<h;_++){let x=_*f-s;for(let v=0;v<c;v++){let b=v*u-n;p.push(b,-x,0),m.push(0,0,1),g.push(v/o),g.push(1-_/a)}}for(let _=0;_<a;_++)for(let x=0;x<o;x++){let v=x+c*_,b=x+c*(_+1),M=x+1+c*(_+1),w=x+1+c*_;d.push(v,b,w),d.push(b,M,w)}this.setIndex(d),this.setAttribute("position",new R(p,3)),this.setAttribute("normal",new R(m,3)),this.setAttribute("uv",new R(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new l(e.width,e.height,e.widthSegments,e.heightSegments)}};var Bl=class l extends L{constructor(e=.5,t=1,i=32,r=1,n=0,s=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:i,phiSegments:r,thetaStart:n,thetaLength:s},i=Math.max(3,i),r=Math.max(1,r);let o=[],a=[],c=[],h=[],u=e,f=(t-e)/r,d=new y,p=new T;for(let m=0;m<=r;m++){for(let g=0;g<=i;g++){let _=n+g/i*s;d.x=u*Math.cos(_),d.y=u*Math.sin(_),a.push(d.x,d.y,d.z),c.push(0,0,1),p.x=(d.x/t+1)/2,p.y=(d.y/t+1)/2,h.push(p.x,p.y)}u+=f}for(let m=0;m<r;m++){let g=m*(i+1);for(let _=0;_<i;_++){let x=_+g,v=x,b=x+i+1,M=x+i+2,w=x+1;o.push(v,b,w),o.push(b,M,w)}}this.setIndex(o),this.setAttribute("position",new R(a,3)),this.setAttribute("normal",new R(c,3)),this.setAttribute("uv",new R(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new l(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}};var Ol=class l extends L{constructor(e=new Ht([new T(0,.5),new T(-.5,-.5),new T(.5,-.5)]),t=12){super(),this.type="ShapeGeometry",this.parameters={shapes:e,curveSegments:t};let i=[],r=[],n=[],s=[],o=0,a=0;if(Array.isArray(e)===!1)c(e);else for(let h=0;h<e.length;h++)c(e[h]),this.addGroup(o,a,h),o+=a,a=0;this.setIndex(i),this.setAttribute("position",new R(r,3)),this.setAttribute("normal",new R(n,3)),this.setAttribute("uv",new R(s,2));function c(h){let u=r.length/3,f=h.extractPoints(t),d=f.shape,p=f.holes;ft.isClockWise(d)===!1&&(d=d.reverse());for(let g=0,_=p.length;g<_;g++){let x=p[g];ft.isClockWise(x)===!0&&(p[g]=x.reverse())}let m=ft.triangulateShape(d,p);for(let g=0,_=p.length;g<_;g++){let x=p[g];d=d.concat(x)}for(let g=0,_=d.length;g<_;g++){let x=d[g];r.push(x.x,x.y,0),n.push(0,0,1),s.push(x.x,x.y)}for(let g=0,_=m.length;g<_;g++){let x=m[g],v=x[0]+u,b=x[1]+u,M=x[2]+u;i.push(v,b,M),a+=3}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes;return My(t,e)}static fromJSON(e,t){let i=[];for(let r=0,n=e.shapes.length;r<n;r++){let s=t[e.shapes[r]];i.push(s)}return new l(i,e.curveSegments)}};function My(l,e){if(e.shapes=[],Array.isArray(l))for(let t=0,i=l.length;t<i;t++){let r=l[t];e.shapes.push(r.uuid)}else e.shapes.push(l.uuid);return e}var Ts=class l extends L{constructor(e=1,t=32,i=16,r=0,n=Math.PI*2,s=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:r,phiLength:n,thetaStart:s,thetaLength:o},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));let a=Math.min(s+o,Math.PI),c=0,h=[],u=new y,f=new y,d=[],p=[],m=[],g=[];for(let _=0;_<=i;_++){let x=[],v=_/i,b=s+v*o,M=e*Math.cos(b),w=Math.sqrt(e*e-M*M),S=0;_===0&&s===0?S=.5/t:_===i&&a===Math.PI&&(S=-.5/t);for(let A=0;A<=t;A++){let C=A/t,E=r+C*n;u.x=-w*Math.cos(E),u.y=M,u.z=w*Math.sin(E),p.push(u.x,u.y,u.z),f.copy(u).normalize(),m.push(f.x,f.y,f.z),g.push(C+S,1-v),x.push(c++)}h.push(x)}for(let _=0;_<i;_++)for(let x=0;x<t;x++){let v=h[_][x+1],b=h[_][x],M=h[_+1][x],w=h[_+1][x+1];(_!==0||s>0)&&d.push(v,b,w),(_!==i-1||a<Math.PI)&&d.push(b,M,w)}this.setIndex(d),this.setAttribute("position",new R(p,3)),this.setAttribute("normal",new R(m,3)),this.setAttribute("uv",new R(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new l(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var Fl=class l extends Gt{constructor(e=1,t=0){let i=[1,1,1,-1,-1,1,-1,1,-1,1,-1,-1],r=[2,1,0,0,3,2,1,3,0,2,3,1];super(i,r,e,t),this.type="TetrahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new l(e.radius,e.detail)}};var Ul=class l extends L{constructor(e=1,t=.4,i=12,r=48,n=Math.PI*2,s=0,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:i,tubularSegments:r,arc:n,thetaStart:s,thetaLength:o},i=Math.floor(i),r=Math.floor(r);let a=[],c=[],h=[],u=[],f=new y,d=new y,p=new y;for(let m=0;m<=i;m++){let g=s+m/i*o;for(let _=0;_<=r;_++){let x=_/r*n;d.x=(e+t*Math.cos(g))*Math.cos(x),d.y=(e+t*Math.cos(g))*Math.sin(x),d.z=t*Math.sin(g),c.push(d.x,d.y,d.z),f.x=e*Math.cos(x),f.y=e*Math.sin(x),p.subVectors(d,f).normalize(),h.push(p.x,p.y,p.z),u.push(_/r),u.push(m/i)}}for(let m=1;m<=i;m++)for(let g=1;g<=r;g++){let _=(r+1)*m+g-1,x=(r+1)*(m-1)+g-1,v=(r+1)*(m-1)+g,b=(r+1)*m+g;a.push(_,x,b),a.push(x,v,b)}this.setIndex(a),this.setAttribute("position",new R(c,3)),this.setAttribute("normal",new R(h,3)),this.setAttribute("uv",new R(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new l(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc,e.thetaStart,e.thetaLength)}};var zl=class l extends L{constructor(e=1,t=.4,i=64,r=8,n=2,s=3){super(),this.type="TorusKnotGeometry",this.parameters={radius:e,tube:t,tubularSegments:i,radialSegments:r,p:n,q:s},i=Math.floor(i),r=Math.floor(r);let o=[],a=[],c=[],h=[],u=new y,f=new y,d=new y,p=new y,m=new y,g=new y,_=new y;for(let v=0;v<=i;++v){let b=v/i*n*Math.PI*2;x(b,n,s,e,d),x(b+.01,n,s,e,p),g.subVectors(p,d),_.addVectors(p,d),m.crossVectors(g,_),_.crossVectors(m,g),m.normalize(),_.normalize();for(let M=0;M<=r;++M){let w=M/r*Math.PI*2,S=-t*Math.cos(w),A=t*Math.sin(w);u.x=d.x+(S*_.x+A*m.x),u.y=d.y+(S*_.y+A*m.y),u.z=d.z+(S*_.z+A*m.z),a.push(u.x,u.y,u.z),f.subVectors(u,d).normalize(),c.push(f.x,f.y,f.z),h.push(v/i),h.push(M/r)}}for(let v=1;v<=i;v++)for(let b=1;b<=r;b++){let M=(r+1)*(v-1)+(b-1),w=(r+1)*v+(b-1),S=(r+1)*v+b,A=(r+1)*(v-1)+b;o.push(M,w,A),o.push(w,S,A)}this.setIndex(o),this.setAttribute("position",new R(a,3)),this.setAttribute("normal",new R(c,3)),this.setAttribute("uv",new R(h,2));function x(v,b,M,w,S){let A=Math.cos(v),C=Math.sin(v),E=M/b*v,P=Math.cos(E);S.x=w*(2+P)*.5*A,S.y=w*(2+P)*C*.5,S.z=w*Math.sin(E)*.5}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new l(e.radius,e.tube,e.tubularSegments,e.radialSegments,e.p,e.q)}};var kl=class l extends L{constructor(e=new Xr(new y(-1,-1,0),new y(-1,1,0),new y(1,1,0)),t=64,i=1,r=8,n=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:i,radialSegments:r,closed:n};let s=e.computeFrenetFrames(t,n);this.tangents=s.tangents,this.normals=s.normals,this.binormals=s.binormals;let o=new y,a=new y,c=new T,h=new y,u=[],f=[],d=[],p=[];m(),this.setIndex(p),this.setAttribute("position",new R(u,3)),this.setAttribute("normal",new R(f,3)),this.setAttribute("uv",new R(d,2));function m(){for(let v=0;v<t;v++)g(v);g(n===!1?t:0),x(),_()}function g(v){h=e.getPointAt(v/t,h);let b=s.normals[v],M=s.binormals[v];for(let w=0;w<=r;w++){let S=w/r*Math.PI*2,A=Math.sin(S),C=-Math.cos(S);a.x=C*b.x+A*M.x,a.y=C*b.y+A*M.y,a.z=C*b.z+A*M.z,a.normalize(),f.push(a.x,a.y,a.z),o.x=h.x+i*a.x,o.y=h.y+i*a.y,o.z=h.z+i*a.z,u.push(o.x,o.y,o.z)}}function _(){for(let v=1;v<=t;v++)for(let b=1;b<=r;b++){let M=(r+1)*(v-1)+(b-1),w=(r+1)*v+(b-1),S=(r+1)*v+b,A=(r+1)*(v-1)+b;p.push(M,w,A),p.push(w,S,A)}}function x(){for(let v=0;v<=t;v++)for(let b=0;b<=r;b++)c.x=v/t,c.y=b/r,d.push(c.x,c.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new l(new sr[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}};var Vl=class extends L{constructor(e=null){if(super(),this.type="WireframeGeometry",this.parameters={geometry:e},e!==null){let t=[],i=new Set,r=new y,n=new y;if(e.index!==null){let s=e.attributes.position,o=e.index,a=e.groups;a.length===0&&(a=[{start:0,count:o.count,materialIndex:0}]);for(let c=0,h=a.length;c<h;++c){let u=a[c],f=u.start,d=u.count;for(let p=f,m=f+d;p<m;p+=3)for(let g=0;g<3;g++){let _=o.getX(p+g),x=o.getX(p+(g+1)%3);r.fromBufferAttribute(s,_),n.fromBufferAttribute(s,x),_d(r,n,i)===!0&&(t.push(r.x,r.y,r.z),t.push(n.x,n.y,n.z))}}}else{let s=e.attributes.position;for(let o=0,a=s.count/3;o<a;o++)for(let c=0;c<3;c++){let h=3*o+c,u=3*o+(c+1)%3;r.fromBufferAttribute(s,h),n.fromBufferAttribute(s,u),_d(r,n,i)===!0&&(t.push(r.x,r.y,r.z),t.push(n.x,n.y,n.z))}}this.setAttribute("position",new R(t,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}};function _d(l,e,t){let i=`${l.x},${l.y},${l.z}-${e.x},${e.y},${e.z}`,r=`${e.x},${e.y},${e.z}-${l.x},${l.y},${l.z}`;return t.has(i)===!0||t.has(r)===!0?!1:(t.add(i),t.add(r),!0)}var Cs=class extends ${constructor(e){super(),this.isShadowMaterial=!0,this.type="ShadowMaterial",this.color=new I(0),this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.fog=e.fog,this}};function Es(l){let e={};for(let t in l){e[t]={};for(let i in l[t]){let r=l[t][i];if(xd(r))r.isRenderTargetTexture?(B("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone();else if(Array.isArray(r))if(xd(r[0])){let n=[];for(let s=0,o=r.length;s<o;s++)n[s]=r[s].clone();e[t][i]=n}else e[t][i]=r.slice();else e[t][i]=r}}return e}function nt(l){let e={};for(let t=0;t<l.length;t++){let i=Es(l[t]);for(let r in i)e[r]=i[r]}return e}function xd(l){return l&&(l.isColor||l.isMatrix3||l.isMatrix4||l.isVector2||l.isVector3||l.isVector4||l.isTexture||l.isQuaternion)}function yd(l){let e=[];for(let t=0;t<l.length;t++)e.push(l[t].clone());return e}var vd={clone:Es,merge:nt};var bd=`
void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;var Sd=`
void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}
`;var dt=class extends ${constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=bd,this.fragmentShader=Sd,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Es(e.uniforms),this.uniformsGroups=yd(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let r in this.uniforms){let s=this.uniforms[r].value;s&&s.isTexture?t.uniforms[r]={type:"t",value:s.toJSON(e).uuid}:s&&s.isColor?t.uniforms[r]={type:"c",value:s.getHex()}:s&&s.isVector2?t.uniforms[r]={type:"v2",value:s.toArray()}:s&&s.isVector3?t.uniforms[r]={type:"v3",value:s.toArray()}:s&&s.isVector4?t.uniforms[r]={type:"v4",value:s.toArray()}:s&&s.isMatrix3?t.uniforms[r]={type:"m3",value:s.toArray()}:s&&s.isMatrix4?t.uniforms[r]={type:"m4",value:s.toArray()}:t.uniforms[r]={value:s}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let i in e.uniforms){let r=e.uniforms[i];switch(this.uniforms[i]={},r.type){case"t":this.uniforms[i].value=t[r.value]||null;break;case"c":this.uniforms[i].value=new I().setHex(r.value);break;case"v2":this.uniforms[i].value=new T().fromArray(r.value);break;case"v3":this.uniforms[i].value=new y().fromArray(r.value);break;case"v4":this.uniforms[i].value=new Ne().fromArray(r.value);break;case"m3":this.uniforms[i].value=new Y().fromArray(r.value);break;case"m4":this.uniforms[i].value=new F().fromArray(r.value);break;default:this.uniforms[i].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let i in e.extensions)this.extensions[i]=e.extensions[i];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}};var Is=class extends dt{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var ei=class extends ${constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new I(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new I(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=At,this.normalScale=new T(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ge,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var Ze=class extends ei{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new T(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return k(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new I(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new I(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new I(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._retroreflectivity=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get retroreflectivity(){return this._retroreflectivity}set retroreflectivity(e){this._retroreflectivity>0!=e>0&&this.version++,this._retroreflectivity=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.retroreflectivity=e.retroreflectivity,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}};var Rs=class extends ${constructor(e){super(),this.isMeshPhongMaterial=!0,this.type="MeshPhongMaterial",this.color=new I(16777215),this.specular=new I(1118481),this.shininess=30,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new I(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=At,this.normalScale=new T(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ge,this.combine=yr,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.specular.copy(e.specular),this.shininess=e.shininess,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var Ps=class extends ${constructor(e){super(),this.isMeshToonMaterial=!0,this.defines={TOON:""},this.type="MeshToonMaterial",this.color=new I(16777215),this.map=null,this.gradientMap=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new I(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=At,this.normalScale=new T(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.alphaMap=null,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.gradientMap=e.gradientMap,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.alphaMap=e.alphaMap,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var Ls=class extends ${constructor(e){super(),this.isMeshNormalMaterial=!0,this.type="MeshNormalMaterial",this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=At,this.normalScale=new T(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.flatShading=!1,this.setValues(e)}copy(e){return super.copy(e),this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.flatShading=e.flatShading,this}};var Ns=class extends ${constructor(e){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new I(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new I(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=At,this.normalScale=new T(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ge,this.combine=yr,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var Ds=class extends ${constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=xh,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}};var Bs=class extends ${constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};var Os=class extends ${constructor(e){super(),this.isMeshMatcapMaterial=!0,this.defines={MATCAP:""},this.type="MeshMatcapMaterial",this.color=new I(16777215),this.matcap=null,this.map=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=At,this.normalScale=new T(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.alphaMap=null,this.wireframe=!1,this.wireframeLinewidth=1,this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={MATCAP:""},this.color.copy(e.color),this.matcap=e.matcap,this.map=e.map,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.alphaMap=e.alphaMap,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.flatShading=e.flatShading,this.fog=e.fog,this}};var Fs=class extends re{constructor(e){super(),this.isLineDashedMaterial=!0,this.type="LineDashedMaterial",this.scale=1,this.dashSize=3,this.gapSize=1,this.setValues(e)}copy(e){return super.copy(e),this.scale=e.scale,this.dashSize=e.dashSize,this.gapSize=e.gapSize,this}};function Nt(l,e){return!l||l.constructor===e?l:typeof e.BYTES_PER_ELEMENT=="number"?new e(l):Array.prototype.slice.call(l)}function Jr(l){return l!==void 0&&l.inTangents!==void 0&&l.outTangents!==void 0}function fu(l){function e(r,n){return l[r]-l[n]}let t=l.length,i=new Array(t);for(let r=0;r!==t;++r)i[r]=r;return i.sort(e),i}function Wl(l,e,t){let i=l.length,r=new l.constructor(i);for(let n=0,s=0;s!==i;++n){let o=t[n]*e;for(let a=0;a!==e;++a)r[s++]=l[o+a]}return r}function du(l,e,t,i){let r=1,n=l[0];for(;n!==void 0&&n[i]===void 0;)n=l[r++];if(n===void 0)return;let s=n[i];if(s!==void 0)if(Array.isArray(s))do s=n[i],s!==void 0&&(e.push(n.time),t.push(...s)),n=l[r++];while(n!==void 0);else if(s.toArray!==void 0)do s=n[i],s!==void 0&&(e.push(n.time),s.toArray(t,t.length)),n=l[r++];while(n!==void 0);else do s=n[i],s!==void 0&&(e.push(n.time),t.push(s)),n=l[r++];while(n!==void 0)}function wy(l,e,t,i,r=30){let n=l.clone();n.name=e;let s=[];for(let a=0;a<n.tracks.length;++a){let c=n.tracks[a],h=c.getValueSize(),u=[],f=[];for(let d=0;d<c.times.length;++d){let p=c.times[d]*r;if(!(p<t||p>=i)){u.push(c.times[d]);for(let m=0;m<h;++m)f.push(c.values[d*h+m])}}u.length!==0&&(c.times=Nt(u,c.times.constructor),c.values=Nt(f,c.values.constructor),s.push(c))}n.tracks=s;let o=1/0;for(let a=0;a<n.tracks.length;++a)o>n.tracks[a].times[0]&&(o=n.tracks[a].times[0]);for(let a=0;a<n.tracks.length;++a)n.tracks[a].shift(-1*o);return n.resetDuration(),n}function Ay(l,e=0,t=l,i=30){i<=0&&(i=30);let r=t.tracks.length,n=e/i;for(let s=0;s<r;++s){let o=t.tracks[s],a=o.ValueTypeName;if(a==="bool"||a==="string")continue;let c=l.tracks.find(function(_){return _.name===o.name&&_.ValueTypeName===a});if(c===void 0)continue;let h=0,u=o.getValueSize();o.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline&&(h=u/3);let f=0,d=c.getValueSize();c.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline&&(f=d/3);let p=o.times.length-1,m;if(n<=o.times[0]){let _=h,x=u-h;m=o.values.slice(_,x)}else if(n>=o.times[p]){let _=p*u+h,x=_+u-h;m=o.values.slice(_,x)}else{let _=o.createInterpolant(),x=h,v=u-h;_.evaluate(n),m=_.resultBuffer.slice(x,v)}a==="quaternion"&&new ce().fromArray(m).normalize().conjugate().toArray(m);let g=c.times.length;for(let _=0;_<g;++_){let x=_*d+f;if(a==="quaternion")ce.multiplyQuaternionsFlat(c.values,x,m,0,c.values,x);else{let v=d-f*2;for(let b=0;b<v;++b)c.values[x+b]-=m[b]}}}return l.blendMode=Po,l}var Hl=class{static convertArray(e,t){return Nt(e,t)}static isTypedArray(e){return Ca(e)}static hasTangents(e){return Jr(e)}static getKeyframeOrder(e){return fu(e)}static sortedArray(e,t,i){return Wl(e,t,i)}static flattenJSON(e,t,i,r){du(e,t,i,r)}static subclip(e,t,i,r,n=30){return wy(e,t,i,r,n)}static makeClipAdditive(e,t=0,i=e,r=30){return Ay(e,t,i,r)}};var st=class{constructor(e,t,i,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r!==void 0?r:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,i=this._cachedIndex,r=t[i],n=t[i-1];e:{t:{let s;i:{r:if(!(e<r)){for(let o=i+2;;){if(r===void 0){if(e<n)break r;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===o)break;if(n=r,r=t[++i],e<r)break t}s=t.length;break i}if(!(e>=n)){let o=t[1];e<o&&(i=2,n=o);for(let a=i-2;;){if(n===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===a)break;if(r=n,n=t[--i-1],e>=n)break t}s=i,i=0;break i}break e}for(;i<s;){let o=i+s>>>1;e<t[o]?s=o:i=o+1}if(r=t[i],n=t[i-1],n===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,n,r)}return this.interpolate_(i,n,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,r=this.valueSize,n=e*r;for(let s=0;s!==r;++s)t[s]=i[n+s];return t}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}};var Us=class extends st{constructor(e,t,i,r){super(e,t,i,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Ai,endingEnd:Ai}}intervalChanged_(e,t,i){let r=this.parameterPositions,n=e-2,s=e+1,o=r[n],a=r[s];if(o===void 0)switch(this.getSettings_().endingStart){case Ti:n=e,o=2*t-i;break;case Ir:n=r.length-2,o=t+r[n]-r[n+1];break;default:n=e,o=i}if(a===void 0)switch(this.getSettings_().endingEnd){case Ti:s=e,a=2*i-t;break;case Ir:s=1,a=i+r[1]-r[0];break;default:s=e-1,a=t}let c=(i-t)*.5,h=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(a-i),this._offsetPrev=n*h,this._offsetNext=s*h}interpolate_(e,t,i,r){let n=this.resultBuffer,s=this.sampleValues,o=this.valueSize,a=e*o,c=a-o,h=this._offsetPrev,u=this._offsetNext,f=this._weightPrev,d=this._weightNext,p=(i-t)/(r-t),m=p*p,g=m*p,_=-f*g+2*f*m-f*p,x=(1+f)*g+(-1.5-2*f)*m+(-.5+f)*p+1,v=(-1-d)*g+(1.5+d)*m+.5*p,b=d*g-d*m;for(let M=0;M!==o;++M)n[M]=_*s[h+M]+x*s[c+M]+v*s[a+M]+b*s[u+M];return n}};var or=class extends st{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e,t,i,r){let n=this.resultBuffer,s=this.sampleValues,o=this.valueSize,a=e*o,c=a-o,h=(i-t)/(r-t),u=1-h;for(let f=0;f!==o;++f)n[f]=s[c+f]*u+s[a+f]*h;return n}};var zs=class extends st{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e){return this.copySampleValue_(e-1)}};var ks=class extends st{interpolate_(e,t,i,r){let n=this.resultBuffer,s=this.sampleValues,o=this.valueSize,a=e*o,c=a-o,h=this.inTangents,u=this.outTangents;if(!h||!u){let p=(i-t)/(r-t),m=1-p;for(let g=0;g!==o;++g)n[g]=s[c+g]*m+s[a+g]*p;return n}let f=o*2,d=e-1;for(let p=0;p!==o;++p){let m=s[c+p],g=s[a+p],_=d*f+p*2,x=u[_],v=u[_+1],b=e*f+p*2,M=h[b],w=h[b+1],S=Cy(i,t,x,M,r);n[p]=wd(S,m,v,w,g)}return n}};function wd(l,e,t,i,r){let n=1-l;return n*n*n*e+3*n*n*l*t+3*n*l*l*i+l*l*l*r}function Ty(l,e,t,i,r){let n=1-l;return 3*n*n*(t-e)+6*n*l*(i-t)+3*l*l*(r-i)}function Cy(l,e,t,i,r){let n=(l-e)/(r-e);for(let s=0;s<8;s++){let o=wd(n,e,t,i,r)-l;if(Math.abs(o)<1e-10)break;let a=Ty(n,e,t,i,r);if(Math.abs(a)<1e-10)break;n=Math.max(0,Math.min(1,n-o/a))}return n}var Re=class{constructor(e,t,i,r){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Nt(t,this.TimeBufferType),this.values=Nt(i,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:Nt(e.times,Array),values:Nt(e.values,Array)};let r=e.getInterpolation();r!==e.DefaultInterpolation&&(i.interpolation=r),Jr(e.settings)&&(i.settings={inTangents:Nt(e.settings.inTangents,Array),outTangents:Nt(e.settings.outTangents,Array)})}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new zs(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new or(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Us(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new ks(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case li:t=this.InterpolantFactoryMethodDiscrete;break;case Gi:t=this.InterpolantFactoryMethodLinear;break;case Ro:t=this.InterpolantFactoryMethodSmooth;break;case Aa:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return B("KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return li;case this.InterpolantFactoryMethodLinear:return Gi;case this.InterpolantFactoryMethodSmooth:return Ro;case this.InterpolantFactoryMethodBezier:return Aa}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let i=0,r=t.length;i!==r;++i)t[i]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let i=0,r=t.length;i!==r;++i)t[i]*=e;Jr(this.settings)&&(Ad(this.settings.inTangents,e),Ad(this.settings.outTangents,e))}return this}trim(e,t){let i=this.times,r=i.length,n=0,s=r-1;for(;n!==r&&i[n]<e;)++n;for(;s!==-1&&i[s]>t;)--s;if(++s,n!==0||s!==r){n>=s&&(s=Math.max(s,1),n=s-1);let o=this.getValueSize();this.times=i.slice(n,s),this.values=this.values.slice(n*o,s*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(Z("KeyframeTrack: Invalid value size in track.",this),e=!1);let i=this.times,r=this.values,n=i.length;n===0&&(Z("KeyframeTrack: Track is empty.",this),e=!1);let s=null;for(let o=0;o!==n;o++){let a=i[o];if(typeof a=="number"&&isNaN(a)){Z("KeyframeTrack: Time is not a valid number.",this,o,a),e=!1;break}if(s!==null&&s>a){Z("KeyframeTrack: Out of order keys.",this,o,a,s),e=!1;break}s=a}if(r!==void 0&&Ca(r))for(let o=0,a=r.length;o!==a;++o){let c=r[o];if(isNaN(c)){Z("KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),r=this.getInterpolation()===Ro,n=e.length-1,s=1;for(let o=1;o<n;++o){let a=!1,c=e[o],h=e[o+1];if(c!==h&&(o!==1||c!==e[0]))if(r)a=!0;else{let u=o*i,f=u-i,d=u+i;for(let p=0;p!==i;++p){let m=t[u+p];if(m!==t[f+p]||m!==t[d+p]){a=!0;break}}}if(a){if(o!==s){e[s]=e[o];let u=o*i,f=s*i;for(let d=0;d!==i;++d)t[f+d]=t[u+d]}++s}}if(n>0){e[s]=e[n];for(let o=n*i,a=s*i,c=0;c!==i;++c)t[a+c]=t[o+c];++s}return s!==e.length?(this.times=e.slice(0,s),this.values=t.slice(0,s*i)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),i=this.constructor,r=new i(this.name,e,t);return r.createInterpolant=this.createInterpolant,Jr(this.settings)&&(r.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),r}};function Ad(l,e){for(let t=0,i=l.length;t!==i;t+=2)l[t]*=e}Re.prototype.ValueTypeName="";Re.prototype.TimeBufferType=Float32Array;Re.prototype.ValueBufferType=Float32Array;Re.prototype.DefaultInterpolation=Gi;var ti=class extends Re{constructor(e,t,i){super(e,t,i)}};ti.prototype.ValueTypeName="bool";ti.prototype.ValueBufferType=Array;ti.prototype.DefaultInterpolation=li;ti.prototype.InterpolantFactoryMethodLinear=void 0;ti.prototype.InterpolantFactoryMethodSmooth=void 0;var Kr=class extends Re{constructor(e,t,i,r){super(e,t,i,r)}};Kr.prototype.ValueTypeName="color";var ii=class extends Re{constructor(e,t,i,r){super(e,t,i,r)}};ii.prototype.ValueTypeName="number";var Vs=class extends st{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e,t,i,r){let n=this.resultBuffer,s=this.sampleValues,o=this.valueSize,a=(i-t)/(r-t),c=e*o;for(let h=c+o;c!==h;c+=4)ce.slerpFlat(n,0,s,c-o,s,c,a);return n}};var Wt=class extends Re{constructor(e,t,i,r){super(e,t,i,r)}InterpolantFactoryMethodLinear(e){return new Vs(this.times,this.values,this.getValueSize(),e)}};Wt.prototype.ValueTypeName="quaternion";Wt.prototype.InterpolantFactoryMethodSmooth=void 0;var ri=class extends Re{constructor(e,t,i){super(e,t,i)}};ri.prototype.ValueTypeName="string";ri.prototype.ValueBufferType=Array;ri.prototype.DefaultInterpolation=li;ri.prototype.InterpolantFactoryMethodLinear=void 0;ri.prototype.InterpolantFactoryMethodSmooth=void 0;var ni=class extends Re{constructor(e,t,i,r){super(e,t,i,r)}};ni.prototype.ValueTypeName="vector";var vt=class{constructor(e="",t=-1,i=[],r=Rr){this.name=e,this.tracks=i,this.duration=t,this.blendMode=r,this.uuid=Te(),this.userData={},this.duration<0&&this.resetDuration()}static parse(e){let t=[],i=e.tracks,r=1/(e.fps||1);for(let s=0,o=i.length;s!==o;++s)t.push(Iy(i[s]).scale(r));let n=new this(e.name,e.duration,t,e.blendMode);return n.uuid=e.uuid,n.userData=JSON.parse(e.userData||"{}"),n}static toJSON(e){let t=[],i=e.tracks,r={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode,userData:JSON.stringify(e.userData)};for(let n=0,s=i.length;n!==s;++n)t.push(Re.toJSON(i[n]));return r}static CreateFromMorphTargetSequence(e,t,i,r){let n=t.length,s=[];for(let o=0;o<n;o++){let a=[],c=[];a.push((o+n-1)%n,o,(o+1)%n),c.push(0,1,0);let h=fu(a);a=Wl(a,1,h),c=Wl(c,1,h),!r&&a[0]===0&&(a.push(n),c.push(c[0])),s.push(new ii(".morphTargetInfluences["+t[o].name+"]",a,c).scale(1/i))}return new this(e,-1,s)}static findByName(e,t){let i=e;if(!Array.isArray(e)){let r=e;i=r.geometry&&r.geometry.animations||r.animations}for(let r=0;r<i.length;r++)if(i[r].name===t)return i[r];return null}static CreateClipsFromMorphTargetSequences(e,t,i){let r={},n=/^([\w-]*?)([\d]+)$/;for(let o=0,a=e.length;o<a;o++){let c=e[o],h=c.name.match(n);if(h&&h.length>1){let u=h[1],f=r[u];f||(r[u]=f=[]),f.push(c)}}let s=[];for(let o in r)s.push(this.CreateFromMorphTargetSequence(o,r[o],t,i));return s}resetDuration(){let e=this.tracks,t=0;for(let i=0,r=e.length;i!==r;++i){let n=this.tracks[i];t=Math.max(t,n.times[n.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){let e=[];for(let i=0;i<this.tracks.length;i++)e.push(this.tracks[i].clone());let t=new this.constructor(this.name,this.duration,e,this.blendMode);return t.userData=JSON.parse(JSON.stringify(this.userData)),t}toJSON(){return this.constructor.toJSON(this)}};function Ey(l){switch(l.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return ii;case"vector":case"vector2":case"vector3":case"vector4":return ni;case"color":return Kr;case"quaternion":return Wt;case"bool":case"boolean":return ti;case"string":return ri}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+l)}function Iy(l){if(l.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");let e=Ey(l.type);if(l.times===void 0){let i=[],r=[];du(l.keys,i,r,"value"),l.times=i,l.values=r}let t;return e.parse!==void 0?t=e.parse(l):t=new e(l.name,l.times,l.values,l.interpolation),Jr(l.settings)&&(t.settings={inTangents:Nt(l.settings.inTangents,Float32Array),outTangents:Nt(l.settings.outTangents,Float32Array)}),t}var Je={enabled:!1,files:{},add:function(l,e){this.enabled!==!1&&(Td(l)||(this.files[l]=e))},get:function(l){if(this.enabled!==!1&&!Td(l))return this.files[l]},remove:function(l){delete this.files[l]},clear:function(){this.files={}}};function Td(l){try{let e=l.slice(l.indexOf(":")+1);return new URL(e).protocol==="blob:"}catch{return!1}}var jr=class{constructor(e,t,i){let r=this,n=!1,s=0,o=0,a,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this._abortController=null,this.itemStart=function(h){o++,n===!1&&r.onStart!==void 0&&r.onStart(h,s,o),n=!0},this.itemEnd=function(h){s++,r.onProgress!==void 0&&r.onProgress(h,s,o),s===o&&(n=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(h){r.onError!==void 0&&r.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),a?a(h):h},this.setURLModifier=function(h){return a=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){let u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,f=c.length;u<f;u+=2){let d=c[u],p=c[u+1];if(d.global&&(d.lastIndex=0),d.test(h))return p}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},ql=new jr;var le=class{constructor(e){this.manager=e!==void 0?e:ql,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let i=this;return new Promise(function(r,n){i.load(e,r,t,n)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};le.DEFAULT_MATERIAL_NAME="__DEFAULT";var Di={},pu=class extends Error{constructor(e,t){super(e),this.response=t}},We=class extends le{constructor(e){super(e),this.mimeType="",this.responseType="",this._abortController=new AbortController}load(e,t,i,r){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let n=Je.get(`file:${e}`);if(n!==void 0){this.manager.itemStart(e),setTimeout(()=>{t&&t(n),this.manager.itemEnd(e)},0);return}if(Di[e]!==void 0){Di[e].push({onLoad:t,onProgress:i,onError:r});return}Di[e]=[],Di[e].push({onLoad:t,onProgress:i,onError:r});let s=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",signal:typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),o=this.mimeType,a=this.responseType;fetch(s).then(c=>{if(c.status===200||c.status===0){if(c.status===0&&B("FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||c.body===void 0||c.body.getReader===void 0)return c;let h=Di[e],u=c.body.getReader(),f=c.headers.get("X-File-Size")||c.headers.get("Content-Length"),d=f?parseInt(f):0,p=d!==0,m=0,g=new ReadableStream({start(_){x();function x(){u.read().then(({done:v,value:b})=>{if(v)_.close();else{m+=b.byteLength;let M=new ProgressEvent("progress",{lengthComputable:p,loaded:m,total:d});for(let w=0,S=h.length;w<S;w++){let A=h[w];A.onProgress&&A.onProgress(M)}_.enqueue(b),x()}},v=>{_.error(v)})}}});return new Response(g)}else throw new pu(`fetch for "${c.url}" responded with ${c.status}: ${c.statusText}`,c)}).then(c=>{switch(a){case"arraybuffer":return c.arrayBuffer();case"blob":return c.blob();case"document":return c.text().then(h=>new DOMParser().parseFromString(h,o));case"json":return c.json();default:if(o==="")return c.text();{let u=/charset="?([^;"\s]*)"?/i.exec(o),f=u&&u[1]?u[1].toLowerCase():void 0,d=new TextDecoder(f);return c.arrayBuffer().then(p=>d.decode(p))}}}).then(c=>{Je.add(`file:${e}`,c);let h=Di[e];delete Di[e];for(let u=0,f=h.length;u<f;u++){let d=h[u];d.onLoad&&d.onLoad(c)}}).catch(c=>{let h=Di[e];if(h===void 0)throw this.manager.itemError(e),c;delete Di[e];for(let u=0,f=h.length;u<f;u++){let d=h[u];d.onError&&d.onError(c)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}};var Xl=class extends le{constructor(e){super(e)}load(e,t,i,r){let n=this,s=new We(this.manager);s.setPath(this.path),s.setRequestHeader(this.requestHeader),s.setWithCredentials(this.withCredentials),s.load(e,function(o){try{t(n.parse(JSON.parse(o)))}catch(a){r?r(a):Z(a),n.manager.itemError(e)}},i,r)}parse(e){let t=[];for(let i=0;i<e.length;i++){let r=vt.parse(e[i]);t.push(r)}return t}};var Yl=class extends le{constructor(e){super(e)}load(e,t,i,r){let n=this,s=[],o=new fi,a=new We(this.manager);a.setPath(this.path),a.setResponseType("arraybuffer"),a.setRequestHeader(this.requestHeader),a.setWithCredentials(n.withCredentials);let c=0;function h(u){a.load(e[u],function(f){let d=n.parse(f,!0);s[u]={width:d.width,height:d.height,format:d.format,mipmaps:d.mipmaps},c+=1,c===6&&(d.mipmapCount===1&&(o.minFilter=de),o.image=s,o.format=d.format,o.needsUpdate=!0,t&&t(o))},i,r)}if(Array.isArray(e))for(let u=0,f=e.length;u<f;++u)h(u);else a.load(e,function(u){let f=n.parse(u,!0);if(f.isCubemap){let d=f.mipmaps.length/f.mipmapCount;for(let p=0;p<d;p++){s[p]={mipmaps:[]};for(let m=0;m<f.mipmapCount;m++)s[p].mipmaps.push(f.mipmaps[p*f.mipmapCount+m]),s[p].format=f.format,s[p].width=f.width,s[p].height=f.height}o.image=s}else o.image.width=f.width,o.image.height=f.height,o.mipmaps=f.mipmaps;f.mipmapCount===1&&(o.minFilter=de),o.format=f.format,o.needsUpdate=!0,t&&t(o)},i,r);return o}};var Gs=new WeakMap,Bi=class extends le{constructor(e){super(e)}load(e,t,i,r){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let n=this,s=Je.get(`image:${e}`);if(s!==void 0){if(s.complete===!0)n.manager.itemStart(e),setTimeout(function(){t&&t(s),n.manager.itemEnd(e)},0);else{let u=Gs.get(s);u===void 0&&(u=[],Gs.set(s,u)),u.push({onLoad:t,onError:r})}return s}let o=Xn("img");function a(){h(),t&&t(this);let u=Gs.get(this)||[];for(let f=0;f<u.length;f++){let d=u[f];d.onLoad&&d.onLoad(this)}Gs.delete(this),n.manager.itemEnd(e)}function c(u){h(),r&&r(u),Je.remove(`image:${e}`);let f=Gs.get(this)||[];for(let d=0;d<f.length;d++){let p=f[d];p.onError&&p.onError(u)}Gs.delete(this),n.manager.itemError(e),n.manager.itemEnd(e)}function h(){o.removeEventListener("load",a,!1),o.removeEventListener("error",c,!1)}return o.addEventListener("load",a,!1),o.addEventListener("error",c,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),Je.add(`image:${e}`,o),n.manager.itemStart(e),o.src=e,o}};var Zl=class extends le{constructor(e){super(e)}load(e,t,i,r){let n=new di;n.colorSpace=me;let s=new Bi(this.manager);s.setCrossOrigin(this.crossOrigin),s.setPath(this.path);let o=0;function a(c){s.load(e[c],function(h){n.images[c]=h,o++,o===6&&(n.needsUpdate=!0,t&&t(n))},void 0,r)}for(let c=0;c<e.length;++c)a(c);return n}};var Jl=class extends le{constructor(e){super(e)}load(e,t,i,r){let n=this,s=new ze,o=new We(this.manager);return o.setResponseType("arraybuffer"),o.setRequestHeader(this.requestHeader),o.setPath(this.path),o.setWithCredentials(n.withCredentials),o.load(e,function(a){let c;try{c=n.parse(a)}catch(h){r!==void 0?r(h):Z(h);return}n._applyTexData(s,c),t&&t(s,c)},i,r),s}createDataTexture(e){let t=new ze;return this._applyTexData(t,this.parse(e)),t}_applyTexData(e,t){t.image!==void 0?e.image=t.image:t.data!==void 0&&(e.image.width=t.width,e.image.height=t.height,e.image.data=t.data),e.wrapS=t.wrapS!==void 0?t.wrapS:Ue,e.wrapT=t.wrapT!==void 0?t.wrapT:Ue,e.magFilter=t.magFilter!==void 0?t.magFilter:de,e.minFilter=t.minFilter!==void 0?t.minFilter:de,e.anisotropy=t.anisotropy!==void 0?t.anisotropy:1,t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.mipmaps!==void 0&&(e.mipmaps=t.mipmaps,e.minFilter=Ut),t.mipmapCount===1&&(e.minFilter=de),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),e.needsUpdate=!0}};var qe=class extends G{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new I(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}};var Hs=class extends qe{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(G.DEFAULT_UP),this.updateMatrix(),this.groundColor=new I(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}};var mu=new F,Cd=new y,Ed=new y,mi=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new T(512,512),this.mapType=Zt,this.map=null,this.mapPass=null,this.matrix=new F,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Lt,this._frameExtents=new T(1,1),this._viewportCount=1,this._viewports=[new Ne(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;Cd.setFromMatrixPosition(e.matrixWorld),t.position.copy(Cd),Ed.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Ed),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,i,r){mu.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),i.setFromProjectionMatrix(mu,e.coordinateSystem,e.reversedDepth);let n=this._frameExtents,s=r?r.z/n.x:1,o=r?r.w/n.y:1,a=r?r.x/n.x:0,c=r?r.y/n.y:0;e.coordinateSystem===zt||e.reversedDepth?t.set(.5*s,0,0,.5*s+a,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):t.set(.5*s,0,0,.5*s+a,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),t.multiply(mu)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}};var Kl=new y,jl=new ce,gi=new y,_i=class extends G{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new F,this.projectionMatrix=new F,this.projectionMatrixInverse=new F,this.coordinateSystem=Xe,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Kl,jl,gi),gi.x===1&&gi.y===1&&gi.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Kl,jl,gi.set(1,1,1)).invert()}updateWorldMatrix(e,t,i=!1){super.updateWorldMatrix(e,t,i),this.matrixWorld.decompose(Kl,jl,gi),gi.x===1&&gi.y===1&&gi.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Kl,jl,gi.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}};var ar=new y,Id=new T,Rd=new T,ge=class extends _i{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Nr*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(ci*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Nr*2*Math.atan(Math.tan(ci*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){ar.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(ar.x,ar.y).multiplyScalar(-e/ar.z),ar.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(ar.x,ar.y).multiplyScalar(-e/ar.z)}getViewSize(e,t){return this.getViewBounds(e,Id,Rd),t.subVectors(Rd,Id)}setViewOffset(e,t,i,r,n,s){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=n,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(ci*.5*this.fov)/this.zoom,i=2*t,r=this.aspect*i,n=-.5*r,s=this.view;if(this.view!==null&&this.view.enabled){let a=s.fullWidth,c=s.fullHeight;n+=s.offsetX*r/a,t-=s.offsetY*i/c,r*=s.width/a,i*=s.height/c}let o=this.filmOffset;o!==0&&(n+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(n,n+r,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}};var $l=class extends mi{constructor(){super(new ge(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(e){let t=this.camera,i=Nr*2*e.angle*this.focus,r=this.mapSize.width/this.mapSize.height*this.aspect,n=e.distance||t.far;(i!==t.fov||r!==t.aspect||n!==t.far)&&(t.fov=i,t.aspect=r,t.far=n,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this.aspect=e.aspect,this}toJSON(){let e=super.toJSON();return e.focus=this.focus,e.aspect=this.aspect,e}};var lr=class extends qe{constructor(e,t,i=0,r=Math.PI/3,n=0,s=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(G.DEFAULT_UP),this.updateMatrix(),this.target=new G,this.distance=i,this.angle=r,this.penumbra=n,this.decay=s,this.map=null,this.shadow=new $l}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.map=e.map,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.angle=this.angle,t.object.decay=this.decay,t.object.penumbra=this.penumbra,t.object.target=this.target.uuid,this.map&&this.map.isTexture&&(t.object.map=this.map.toJSON(e).uuid),t.object.shadow=this.shadow.toJSON(),t}};var Ql=class extends mi{constructor(){super(new ge(90,1,.5,500)),this.isPointLightShadow=!0}};var cr=class extends qe{constructor(e,t,i=0,r=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=r,this.shadow=new Ql}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}};var qt=class extends _i{constructor(e=-1,t=1,i=1,r=-1,n=.1,s=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=n,this.far=s,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,n,s){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=n,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2,n=i-e,s=i+e,o=r+t,a=r-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;n+=c*this.view.offsetX,s=n+c*this.view.width,o-=h*this.view.offsetY,a=o-h*this.view.height}this.projectionMatrix.makeOrthographic(n,s,o,a,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}};var ec=class extends mi{constructor(){super(new qt(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}};var hr=class extends qe{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(G.DEFAULT_UP),this.updateMatrix(),this.target=new G,this.shadow=new ec}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}};var Ws=class extends qe{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}};var qs=class extends qe{constructor(e,t,i=10,r=10){super(e,t),this.isRectAreaLight=!0,this.type="RectAreaLight",this.width=i,this.height=r}get power(){return this.intensity*this.width*this.height*Math.PI}set power(e){this.intensity=e/(this.width*this.height*Math.PI)}copy(e){return super.copy(e),this.width=e.width,this.height=e.height,this}toJSON(e){let t=super.toJSON(e);return t.object.width=this.width,t.object.height=this.height,t}};var ur=class{constructor(){this.isSphericalHarmonics3=!0,this.coefficients=[];for(let e=0;e<9;e++)this.coefficients.push(new y)}set(e){for(let t=0;t<9;t++)this.coefficients[t].copy(e[t]);return this}zero(){for(let e=0;e<9;e++)this.coefficients[e].set(0,0,0);return this}getAt(e,t){let i=e.x,r=e.y,n=e.z,s=this.coefficients;return t.copy(s[0]).multiplyScalar(.282095),t.addScaledVector(s[1],.488603*r),t.addScaledVector(s[2],.488603*n),t.addScaledVector(s[3],.488603*i),t.addScaledVector(s[4],1.092548*(i*r)),t.addScaledVector(s[5],1.092548*(r*n)),t.addScaledVector(s[6],.315392*(3*n*n-1)),t.addScaledVector(s[7],1.092548*(i*n)),t.addScaledVector(s[8],.546274*(i*i-r*r)),t}getIrradianceAt(e,t){let i=e.x,r=e.y,n=e.z,s=this.coefficients;return t.copy(s[0]).multiplyScalar(.886227),t.addScaledVector(s[1],2*.511664*r),t.addScaledVector(s[2],2*.511664*n),t.addScaledVector(s[3],2*.511664*i),t.addScaledVector(s[4],2*.429043*i*r),t.addScaledVector(s[5],2*.429043*r*n),t.addScaledVector(s[6],.743125*n*n-.247708),t.addScaledVector(s[7],2*.429043*i*n),t.addScaledVector(s[8],.429043*(i*i-r*r)),t}add(e){for(let t=0;t<9;t++)this.coefficients[t].add(e.coefficients[t]);return this}addScaledSH(e,t){for(let i=0;i<9;i++)this.coefficients[i].addScaledVector(e.coefficients[i],t);return this}scale(e){for(let t=0;t<9;t++)this.coefficients[t].multiplyScalar(e);return this}lerp(e,t){for(let i=0;i<9;i++)this.coefficients[i].lerp(e.coefficients[i],t);return this}equals(e){for(let t=0;t<9;t++)if(!this.coefficients[t].equals(e.coefficients[t]))return!1;return!0}copy(e){return this.set(e.coefficients)}clone(){return new this.constructor().copy(this)}fromArray(e,t=0){let i=this.coefficients;for(let r=0;r<9;r++)i[r].fromArray(e,t+r*3);return this}toArray(e=[],t=0){let i=this.coefficients;for(let r=0;r<9;r++)i[r].toArray(e,t+r*3);return e}static getBasisAt(e,t){let i=e.x,r=e.y,n=e.z;t[0]=.282095,t[1]=.488603*r,t[2]=.488603*n,t[3]=.488603*i,t[4]=1.092548*i*r,t[5]=1.092548*r*n,t[6]=.315392*(3*n*n-1),t[7]=1.092548*i*n,t[8]=.546274*(i*i-r*r)}};var Xs=class extends qe{constructor(e=new ur,t=1){super(void 0,t),this.isLightProbe=!0,this.sh=e}copy(e){return super.copy(e),this.sh.copy(e.sh),this}toJSON(e){let t=super.toJSON(e);return t.object.sh=this.sh.toArray(),t}};var Pd={},Ys=class l extends le{constructor(e){super(e),this.textures={}}load(e,t,i,r){let n=this,s=new We(n.manager);s.setPath(n.path),s.setRequestHeader(n.requestHeader),s.setWithCredentials(n.withCredentials),s.load(e,function(o){try{t(n.parse(JSON.parse(o)))}catch(a){r?r(a):Z(a),n.manager.itemError(e)}},i,r)}parse(e){let t=this.createMaterialFromType(e.type);return t.fromJSON(e,this.textures),t}setTextures(e){return this.textures=e,this}createMaterialFromType(e){return l.createMaterialFromType(e)}static createMaterialFromType(e){let i={ShadowMaterial:Cs,SpriteMaterial:$i,RawShaderMaterial:Is,ShaderMaterial:dt,PointsMaterial:ui,MeshPhysicalMaterial:Ze,MeshStandardMaterial:ei,MeshPhongMaterial:Rs,MeshToonMaterial:Ps,MeshNormalMaterial:Ls,MeshLambertMaterial:Ns,MeshDepthMaterial:Ds,MeshDistanceMaterial:Bs,MeshBasicMaterial:Se,MeshMatcapMaterial:Os,LineDashedMaterial:Fs,LineBasicMaterial:re,Material:$,...Pd}[e],r;return i===void 0?(Tt(`MaterialLoader: Unknown material type "${e}". Use .registerMaterial() before starting the deserialization process.`),r=new $):r=new i,r}static registerMaterial(e,t){Pd[e]=t}};var Dt=class{static extractUrlBase(e){let t=e.lastIndexOf("/");return t===-1?"./":e.slice(0,t+1)}static resolveURL(e,t){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}};var Zs=class extends L{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(e){return super.copy(e),this.instanceCount=e.instanceCount,this}toJSON(){let e=super.toJSON();return e.instanceCount=this.instanceCount,e.isInstancedBufferGeometry=!0,e}};var Js=class extends le{constructor(e){super(e)}load(e,t,i,r){let n=this,s=new We(n.manager);s.setPath(n.path),s.setRequestHeader(n.requestHeader),s.setWithCredentials(n.withCredentials),s.load(e,function(o){try{t(n.parse(JSON.parse(o)))}catch(a){r?r(a):Z(a),n.manager.itemError(e)}},i,r)}parse(e){let t={},i={};function r(d,p){if(t[p]!==void 0)return t[p];let g=d.interleavedBuffers[p],_=n(d,g.buffer),x=Wi(g.type,_),v=new It(x,g.stride);return v.uuid=g.uuid,g.usage!==void 0&&v.setUsage(g.usage),t[p]=v,v}function n(d,p){if(i[p]!==void 0)return i[p];let g=d.arrayBuffers[p],_=new Uint32Array(g).buffer;return i[p]=_,_}let s=e.isInstancedBufferGeometry?new Zs:new L,o=e.data.index;if(o!==void 0){let d=Wi(o.type,o.array);s.setIndex(new K(d,1))}let a=e.data.attributes;for(let d in a){let p=a[d],m;if(p.isInterleavedBufferAttribute){let g=r(e.data,p.data);m=new Rt(g,p.itemSize,p.offset,p.normalized)}else{let g=Wi(p.type,p.array),_=p.isInstancedBufferAttribute?it:K;m=new _(g,p.itemSize,p.normalized)}p.name!==void 0&&(m.name=p.name),p.usage!==void 0&&m.setUsage(p.usage),p.gpuType!==void 0&&(m.gpuType=p.gpuType),s.setAttribute(d,m)}let c=e.data.morphAttributes;if(c)for(let d in c){let p=c[d],m=[];for(let g=0,_=p.length;g<_;g++){let x=p[g],v;if(x.isInterleavedBufferAttribute){let b=r(e.data,x.data);v=new Rt(b,x.itemSize,x.offset,x.normalized)}else{let b=Wi(x.type,x.array);v=new K(b,x.itemSize,x.normalized)}x.name!==void 0&&(v.name=x.name),x.usage!==void 0&&v.setUsage(x.usage),x.gpuType!==void 0&&(v.gpuType=x.gpuType),m.push(v)}s.morphAttributes[d]=m}e.data.morphTargetsRelative&&(s.morphTargetsRelative=!0);let u=e.data.groups||e.data.drawcalls||e.data.offsets;if(u!==void 0)for(let d=0,p=u.length;d!==p;++d){let m=u[d];s.addGroup(m.start,m.count,m.materialIndex)}let f=e.data.boundingSphere;return f!==void 0&&(s.boundingSphere=new oe().fromJSON(f)),e.name&&(s.name=e.name),e.userData&&(s.userData=e.userData),s}};var gu={},tc=class extends le{constructor(e){super(e)}load(e,t,i,r){let n=this,s=this.path===""?Dt.extractUrlBase(e):this.path;this.resourcePath=this.resourcePath||s;let o=new We(this.manager);o.setPath(this.path),o.setRequestHeader(this.requestHeader),o.setWithCredentials(this.withCredentials),o.load(e,function(a){let c=null;try{c=JSON.parse(a)}catch(u){r!==void 0&&r(u),Z("ObjectLoader: Can't parse "+e+".",u.message);return}let h=c.metadata;if(h===void 0||h.type===void 0||h.type.toLowerCase()==="geometry"){r!==void 0&&r(new Error("THREE.ObjectLoader: Can't load "+e)),Z("ObjectLoader: Can't load "+e);return}n.parse(c,t)},i,r)}async loadAsync(e,t){let i=this,r=this.path===""?Dt.extractUrlBase(e):this.path;this.resourcePath=this.resourcePath||r;let n=new We(this.manager);n.setPath(this.path),n.setRequestHeader(this.requestHeader),n.setWithCredentials(this.withCredentials);let s=await n.loadAsync(e,t),o;try{o=JSON.parse(s)}catch(c){throw new Error("THREE.ObjectLoader: Can't parse "+e+". "+c.message)}let a=o.metadata;if(a===void 0||a.type===void 0||a.type.toLowerCase()==="geometry")throw new Error("THREE.ObjectLoader: Can't load "+e);return await i.parseAsync(o)}parse(e,t){let i=this.parseAnimations(e.animations),r=this.parseShapes(e.shapes),n=this.parseGeometries(e.geometries,r),s=this.parseImages(e.images,function(){t!==void 0&&t(c)}),o=this.parseTextures(e.textures,s),a=this.parseMaterials(e.materials,o),c=this.parseObject(e.object,n,a,o,i),h=this.parseSkeletons(e.skeletons,c);if(this.bindSkeletons(c,h),this.bindLightTargets(c),t!==void 0){let u=!1;for(let f in s)if(s[f].data instanceof HTMLImageElement){u=!0;break}u===!1&&t(c)}return c}async parseAsync(e){let t=this.parseAnimations(e.animations),i=this.parseShapes(e.shapes),r=this.parseGeometries(e.geometries,i),n=await this.parseImagesAsync(e.images),s=this.parseTextures(e.textures,n),o=this.parseMaterials(e.materials,s),a=this.parseObject(e.object,r,o,s,t),c=this.parseSkeletons(e.skeletons,a);return this.bindSkeletons(a,c),this.bindLightTargets(a),a}static registerGeometry(e,t){gu[e]=t}parseShapes(e){let t={};if(e!==void 0)for(let i=0,r=e.length;i<r;i++){let n=new Ht().fromJSON(e[i]);t[n.uuid]=n}return t}parseSkeletons(e,t){let i={},r={};if(t.traverse(function(n){n.isBone&&(r[n.uuid]=n)}),e!==void 0)for(let n=0,s=e.length;n<s;n++){let o=new er().fromJSON(e[n],r);i[o.uuid]=o}return i}parseGeometries(e,t){let i={};if(e!==void 0){let r=new Js;for(let n=0,s=e.length;n<s;n++){let o,a=e[n];switch(a.type){case"BufferGeometry":case"InstancedBufferGeometry":o=r.parse(a);break;default:a.type in Gl?o=Gl[a.type].fromJSON(a,t):a.type in gu?o=gu[a.type].fromJSON(a,t):B(`ObjectLoader: Unknown geometry type "${a.type}". Use .registerGeometry() before starting the deserialization process.`)}o.uuid=a.uuid,a.name!==void 0&&(o.name=a.name),a.userData!==void 0&&(o.userData=a.userData),i[a.uuid]=o}}return i}parseMaterials(e,t){let i={},r={};if(e!==void 0){let n=new Ys;n.setTextures(t);for(let s=0,o=e.length;s<o;s++){let a=e[s];i[a.uuid]===void 0&&(i[a.uuid]=n.parse(a)),r[a.uuid]=i[a.uuid]}}return r}parseAnimations(e){let t={};if(e!==void 0)for(let i=0;i<e.length;i++){let r=e[i],n=vt.parse(r);t[n.uuid]=n}return t}parseImages(e,t){let i=this,r={},n;function s(a){return a=i.manager.resolveURL(a),i.manager.itemStart(a),n.load(a,function(){i.manager.itemEnd(a)},void 0,function(){i.manager.itemError(a),i.manager.itemEnd(a)})}function o(a){if(typeof a=="string"){let c=a,h=/^(\/\/)|([a-z]+:(\/\/)?)/i.test(c)?c:i.resourcePath+c;return s(h)}else return a.data?{data:Wi(a.type,a.data),width:a.width,height:a.height}:null}if(e!==void 0&&e.length>0){let a=new jr(t);n=new Bi(a),n.setCrossOrigin(this.crossOrigin);for(let c=0,h=e.length;c<h;c++){let u=e[c],f=u.url;if(Array.isArray(f)){let d=[];for(let p=0,m=f.length;p<m;p++){let g=f[p],_=o(g);_!==null&&(_ instanceof HTMLImageElement?d.push(_):d.push(new ze(_.data,_.width,_.height)))}r[u.uuid]=new et(d)}else{let d=o(u.url);r[u.uuid]=new et(d)}}}return r}async parseImagesAsync(e){let t=this,i={},r;async function n(s){if(typeof s=="string"){let o=s,a=/^(\/\/)|([a-z]+:(\/\/)?)/i.test(o)?o:t.resourcePath+o;return await r.loadAsync(a)}else return s.data?{data:Wi(s.type,s.data),width:s.width,height:s.height}:null}if(e!==void 0&&e.length>0){r=new Bi(this.manager),r.setCrossOrigin(this.crossOrigin);for(let s=0,o=e.length;s<o;s++){let a=e[s],c=a.url;if(Array.isArray(c)){let h=[];for(let u=0,f=c.length;u<f;u++){let d=c[u],p=await n(d);p!==null&&(p instanceof HTMLImageElement?h.push(p):h.push(new ze(p.data,p.width,p.height)))}i[a.uuid]=new et(h)}else{let h=await n(a.url);i[a.uuid]=new et(h)}}}return i}parseTextures(e,t){function i(n,s){return typeof n=="number"?n:(B("ObjectLoader.parseTexture: Constant should be in numeric form.",n),s[n])}let r={};if(e!==void 0)for(let n=0,s=e.length;n<s;n++){let o=e[n];o.image===void 0&&B('ObjectLoader: No "image" specified for',o.uuid),t[o.image]===void 0&&B("ObjectLoader: Undefined image",o.image);let a=t[o.image],c=a.data,h;Array.isArray(c)?(h=new di,c.length===6&&(h.needsUpdate=!0)):(c&&c.data?h=new ze:h=new te,c&&(h.needsUpdate=!0)),h.source=a,h.uuid=o.uuid,o.name!==void 0&&(h.name=o.name),o.mapping!==void 0&&(h.mapping=i(o.mapping,Ry)),o.channel!==void 0&&(h.channel=o.channel),o.offset!==void 0&&h.offset.fromArray(o.offset),o.repeat!==void 0&&h.repeat.fromArray(o.repeat),o.center!==void 0&&h.center.fromArray(o.center),o.rotation!==void 0&&(h.rotation=o.rotation),o.wrap!==void 0&&(h.wrapS=i(o.wrap[0],Ld),h.wrapT=i(o.wrap[1],Ld)),o.format!==void 0&&(h.format=o.format),o.internalFormat!==void 0&&(h.internalFormat=o.internalFormat),o.type!==void 0&&(h.type=o.type),o.colorSpace!==void 0&&(h.colorSpace=o.colorSpace),o.minFilter!==void 0&&(h.minFilter=i(o.minFilter,Nd)),o.magFilter!==void 0&&(h.magFilter=i(o.magFilter,Nd)),o.anisotropy!==void 0&&(h.anisotropy=o.anisotropy),o.flipY!==void 0&&(h.flipY=o.flipY),o.generateMipmaps!==void 0&&(h.generateMipmaps=o.generateMipmaps),o.premultiplyAlpha!==void 0&&(h.premultiplyAlpha=o.premultiplyAlpha),o.unpackAlignment!==void 0&&(h.unpackAlignment=o.unpackAlignment),o.compareFunction!==void 0&&(h.compareFunction=o.compareFunction),o.normalized!==void 0&&(h.normalized=o.normalized),o.userData!==void 0&&(h.userData=o.userData),r[o.uuid]=h}return r}parseObject(e,t,i,r,n){let s;function o(f){return t[f]===void 0&&B("ObjectLoader: Undefined geometry",f),t[f]}function a(f){if(f!==void 0){if(Array.isArray(f)){let d=[];for(let p=0,m=f.length;p<m;p++){let g=f[p];i[g]===void 0&&B("ObjectLoader: Undefined material",g),d.push(i[g])}return d}return i[f]===void 0&&B("ObjectLoader: Undefined material",f),i[f]}}function c(f){return r[f]===void 0&&B("ObjectLoader: Undefined texture",f),r[f]}let h,u;switch(e.type){case"Scene":s=new is,e.background!==void 0&&(Number.isInteger(e.background)?s.background=new I(e.background):s.background=c(e.background)),e.environment!==void 0&&(s.environment=c(e.environment)),e.fog!==void 0&&(e.fog.type==="Fog"?s.fog=new ts(e.fog.color,e.fog.near,e.fog.far):e.fog.type==="FogExp2"&&(s.fog=new es(e.fog.color,e.fog.density)),e.fog.name!==""&&(s.fog.name=e.fog.name)),e.backgroundBlurriness!==void 0&&(s.backgroundBlurriness=e.backgroundBlurriness),e.backgroundIntensity!==void 0&&(s.backgroundIntensity=e.backgroundIntensity),e.backgroundRotation!==void 0&&s.backgroundRotation.fromArray(e.backgroundRotation),e.environmentIntensity!==void 0&&(s.environmentIntensity=e.environmentIntensity),e.environmentRotation!==void 0&&s.environmentRotation.fromArray(e.environmentRotation);break;case"PerspectiveCamera":s=new ge(e.fov,e.aspect,e.near,e.far),e.focus!==void 0&&(s.focus=e.focus),e.zoom!==void 0&&(s.zoom=e.zoom),e.filmGauge!==void 0&&(s.filmGauge=e.filmGauge),e.filmOffset!==void 0&&(s.filmOffset=e.filmOffset),e.view!==void 0&&(s.view=Object.assign({},e.view));break;case"OrthographicCamera":s=new qt(e.left,e.right,e.top,e.bottom,e.near,e.far),e.zoom!==void 0&&(s.zoom=e.zoom),e.view!==void 0&&(s.view=Object.assign({},e.view));break;case"AmbientLight":s=new Ws(e.color,e.intensity);break;case"DirectionalLight":s=new hr(e.color,e.intensity),s.target=e.target||"";break;case"PointLight":s=new cr(e.color,e.intensity,e.distance,e.decay);break;case"RectAreaLight":s=new qs(e.color,e.intensity,e.width,e.height);break;case"SpotLight":s=new lr(e.color,e.intensity,e.distance,e.angle,e.penumbra,e.decay),s.target=e.target||"";break;case"HemisphereLight":s=new Hs(e.color,e.groundColor,e.intensity);break;case"LightProbe":let f=new ur().fromArray(e.sh);s=new Xs(f,e.intensity);break;case"SkinnedMesh":h=o(e.geometry),u=a(e.material),s=new Qi(h,u),e.bindMode!==void 0&&(s.bindMode=e.bindMode),e.bindMatrix!==void 0&&s.bindMatrix.fromArray(e.bindMatrix),e.skeleton!==void 0&&(s.skeleton=e.skeleton);break;case"Mesh":h=o(e.geometry),u=a(e.material),s=new ae(h,u);break;case"InstancedMesh":h=o(e.geometry),u=a(e.material);let d=e.count,p=e.instanceMatrix,m=e.instanceColor;s=new tr(h,u,d),s.instanceMatrix=new it(new Float32Array(p.array),16),m!==void 0&&(s.instanceColor=new it(new Float32Array(m.array),m.itemSize));break;case"BatchedMesh":h=o(e.geometry),u=a(e.material),s=new xs(e.maxInstanceCount,e.maxVertexCount,e.maxIndexCount,u),s.geometry=h,s.perObjectFrustumCulled=e.perObjectFrustumCulled,s.sortObjects=e.sortObjects,s._drawRanges=e.drawRanges,s._reservedRanges=e.reservedRanges,s._geometryInfo=e.geometryInfo.map(g=>{let _=null,x=null;return g.boundingBox!==void 0&&(_=new he().fromJSON(g.boundingBox)),g.boundingSphere!==void 0&&(x=new oe().fromJSON(g.boundingSphere)),{...g,boundingBox:_,boundingSphere:x}}),s._instanceInfo=e.instanceInfo,s._availableInstanceIds=e._availableInstanceIds,s._availableGeometryIds=e._availableGeometryIds,s._nextIndexStart=e.nextIndexStart,s._nextVertexStart=e.nextVertexStart,s._geometryCount=e.geometryCount,s._maxInstanceCount=e.maxInstanceCount,s._maxVertexCount=e.maxVertexCount,s._maxIndexCount=e.maxIndexCount,s._geometryInitialized=e.geometryInitialized,s._matricesTexture=c(e.matricesTexture.uuid),s._indirectTexture=c(e.indirectTexture.uuid),e.colorsTexture!==void 0&&(s._colorsTexture=c(e.colorsTexture.uuid)),e.boundingSphere!==void 0&&(s.boundingSphere=new oe().fromJSON(e.boundingSphere)),e.boundingBox!==void 0&&(s.boundingBox=new he().fromJSON(e.boundingBox));break;case"LOD":s=new ms;break;case"Line":s=new ke(o(e.geometry),a(e.material));break;case"LineLoop":s=new ir(o(e.geometry),a(e.material));break;case"LineSegments":s=new Me(o(e.geometry),a(e.material));break;case"PointCloud":case"Points":s=new rr(o(e.geometry),a(e.material));break;case"Sprite":s=new ps(a(e.material));break;case"Group":s=new ct;break;case"Bone":s=new hi;break;default:s=new G}if(s.uuid=e.uuid,e.name!==void 0&&(s.name=e.name),e.matrix!==void 0?(s.matrix.fromArray(e.matrix),e.matrixAutoUpdate!==void 0&&(s.matrixAutoUpdate=e.matrixAutoUpdate),s.matrixAutoUpdate&&s.matrix.decompose(s.position,s.quaternion,s.scale)):(e.position!==void 0&&s.position.fromArray(e.position),e.rotation!==void 0&&s.rotation.fromArray(e.rotation),e.quaternion!==void 0&&s.quaternion.fromArray(e.quaternion),e.scale!==void 0&&s.scale.fromArray(e.scale)),e.up!==void 0&&s.up.fromArray(e.up),e.pivot!==void 0&&(s.pivot=new y().fromArray(e.pivot)),e.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),e.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=e.morphTargetInfluences.slice()),e.castShadow!==void 0&&(s.castShadow=e.castShadow),e.receiveShadow!==void 0&&(s.receiveShadow=e.receiveShadow),e.shadow&&(e.shadow.intensity!==void 0&&(s.shadow.intensity=e.shadow.intensity),e.shadow.bias!==void 0&&(s.shadow.bias=e.shadow.bias),e.shadow.normalBias!==void 0&&(s.shadow.normalBias=e.shadow.normalBias),e.shadow.radius!==void 0&&(s.shadow.radius=e.shadow.radius),e.shadow.blurSamples!==void 0&&(s.shadow.blurSamples=e.shadow.blurSamples),e.shadow.focus!==void 0&&(s.shadow.focus=e.shadow.focus),e.shadow.aspect!==void 0&&(s.shadow.aspect=e.shadow.aspect),e.shadow.mapSize!==void 0&&s.shadow.mapSize.fromArray(e.shadow.mapSize),e.shadow.camera!==void 0&&(s.shadow.camera=this.parseObject(e.shadow.camera))),e.visible!==void 0&&(s.visible=e.visible),e.frustumCulled!==void 0&&(s.frustumCulled=e.frustumCulled),e.renderOrder!==void 0&&(s.renderOrder=e.renderOrder),e.static!==void 0&&(s.static=e.static),e.userData!==void 0&&(s.userData=e.userData),e.layers!==void 0&&(s.layers.mask=e.layers),e.children!==void 0){let f=e.children;for(let d=0;d<f.length;d++)s.add(this.parseObject(f[d],t,i,r,n))}if(e.animations!==void 0){let f=e.animations;for(let d=0;d<f.length;d++){let p=f[d];s.animations.push(n[p])}}if(e.type==="LOD"){e.autoUpdate!==void 0&&(s.autoUpdate=e.autoUpdate);let f=e.levels;for(let d=0;d<f.length;d++){let p=f[d],m=s.getObjectByProperty("uuid",p.object);m!==void 0&&s.addLevel(m,p.distance,p.hysteresis)}}return s}bindSkeletons(e,t){Object.keys(t).length!==0&&e.traverse(function(i){if(i.isSkinnedMesh===!0&&i.skeleton!==void 0){let r=t[i.skeleton];r===void 0?B("ObjectLoader: No skeleton found with UUID:",i.skeleton):i.bind(r,i.bindMatrix)}})}bindLightTargets(e){e.traverse(function(t){if(t.isDirectionalLight||t.isSpotLight){let i=t.target,r=e.getObjectByProperty("uuid",i);r!==void 0?t.target=r:t.target=new G}})}},Ry={UVMapping:ki,CubeReflectionMapping:Ft,CubeRefractionMapping:fn,EquirectangularReflectionMapping:uh,EquirectangularRefractionMapping:fh,CubeUVReflectionMapping:po},Ld={RepeatWrapping:wt,ClampToEdgeWrapping:Ue,MirroredRepeatWrapping:Yt},Nd={NearestFilter:fe,NearestMipmapNearestFilter:vr,NearestMipmapLinearFilter:br,LinearFilter:de,LinearMipmapNearestFilter:mo,LinearMipmapLinearFilter:Ut};var _u=new WeakMap,Ks=class extends le{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&B("ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&B("ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"},this._abortController=new AbortController}setOptions(e){return this.options=e,this}load(e,t,i,r){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let n=this,s=Je.get(`image-bitmap:${e}`);if(s!==void 0){if(n.manager.itemStart(e),s.then){s.then(c=>{_u.has(s)===!0?(r&&r(_u.get(s)),n.manager.itemError(e),n.manager.itemEnd(e)):(t&&t(c),n.manager.itemEnd(e))});return}setTimeout(function(){t&&t(s),n.manager.itemEnd(e)},0);return}let o={};o.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",o.headers=this.requestHeader,o.signal=typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal;let a=fetch(e,o).then(function(c){return c.blob()}).then(function(c){return createImageBitmap(c,Object.assign({},n.options,{colorSpaceConversion:"none"}))}).then(function(c){return Je.add(`image-bitmap:${e}`,c),t&&t(c),n.manager.itemEnd(e),c}).catch(function(c){r&&r(c),_u.set(a,c),Je.remove(`image-bitmap:${e}`),n.manager.itemError(e),n.manager.itemEnd(e)});Je.add(`image-bitmap:${e}`,a),n.manager.itemStart(e)}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}};var ic,fr=class{static getContext(){return ic===void 0&&(ic=new(window.AudioContext||window.webkitAudioContext)),ic}static setContext(e){ic=e}};var rc=class extends le{constructor(e){super(e)}load(e,t,i,r){let n=this,s=new We(this.manager);s.setResponseType("arraybuffer"),s.setPath(this.path),s.setRequestHeader(this.requestHeader),s.setWithCredentials(this.withCredentials),s.load(e,function(a){try{let c=a.slice(0),h=fr.getContext(),u=e+"#decode";n.manager.itemStart(u),h.decodeAudioData(c,function(f){t(f),n.manager.itemEnd(u)}).catch(function(f){o(f),n.manager.itemEnd(u)})}catch(c){o(c)}},i,r);function o(a){r?r(a):Z(a),n.manager.itemError(e)}}};var Dd=new F,Bd=new F,$r=new F,nc=class{constructor(){this.type="StereoCamera",this.aspect=1,this.eyeSep=.064,this.cameraL=new ge,this.cameraL.layers.enable(1),this.cameraL.matrixAutoUpdate=!1,this.cameraR=new ge,this.cameraR.layers.enable(2),this.cameraR.matrixAutoUpdate=!1,this._cache={focus:null,fov:null,aspect:null,near:null,far:null,zoom:null,eyeSep:null}}update(e){let t=this._cache;if(t.focus!==e.focus||t.fov!==e.fov||t.aspect!==e.aspect*this.aspect||t.near!==e.near||t.far!==e.far||t.zoom!==e.zoom||t.eyeSep!==this.eyeSep){t.focus=e.focus,t.fov=e.fov,t.aspect=e.aspect*this.aspect,t.near=e.near,t.far=e.far,t.zoom=e.zoom,t.eyeSep=this.eyeSep,$r.copy(e.projectionMatrix);let r=t.eyeSep/2,n=r*t.near/t.focus,s=t.near*Math.tan(ci*t.fov*.5)/t.zoom,o,a;Bd.elements[12]=-r,Dd.elements[12]=r,o=-s*t.aspect+n,a=s*t.aspect+n,$r.elements[0]=2*t.near/(a-o),$r.elements[8]=(a+o)/(a-o),this.cameraL.projectionMatrix.copy($r),o=-s*t.aspect-n,a=s*t.aspect-n,$r.elements[0]=2*t.near/(a-o),$r.elements[8]=(a+o)/(a-o),this.cameraR.projectionMatrix.copy($r)}this.cameraL.matrix.copy(e.matrixWorld).multiply(Bd),this.cameraL.matrixWorldNeedsUpdate=!0,this.cameraR.matrix.copy(e.matrixWorld).multiply(Dd),this.cameraR.matrixWorldNeedsUpdate=!0}};var js=-90,$s=1,Qs=class extends G{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new ge(js,$s,e,t);r.layers=this.layers,this.add(r);let n=new ge(js,$s,e,t);n.layers=this.layers,this.add(n);let s=new ge(js,$s,e,t);s.layers=this.layers,this.add(s);let o=new ge(js,$s,e,t);o.layers=this.layers,this.add(o);let a=new ge(js,$s,e,t);a.layers=this.layers,this.add(a);let c=new ge(js,$s,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,r,n,s,o,a]=t;for(let c of t)this.remove(c);if(e===Xe)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),n.up.set(0,0,-1),n.lookAt(0,1,0),s.up.set(0,0,1),s.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),a.up.set(0,1,0),a.lookAt(0,0,-1);else if(e===zt)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),n.up.set(0,0,1),n.lookAt(0,1,0),s.up.set(0,0,-1),s.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),a.up.set(0,-1,0),a.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[n,s,o,a,c,h]=this.children,u=e.getRenderTarget(),f=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let m=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let g=!1;e.isWebGLRenderer===!0?g=e.state.buffers.depth.getReversed():g=e.reversedDepthBuffer,e.setRenderTarget(i,0,r),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,n),e.setRenderTarget(i,1,r),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(i,2,r),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(i,3,r),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(i,4,r),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),i.texture.generateMipmaps=m,e.setRenderTarget(i,5,r),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),e.setRenderTarget(u,f,d),e.xr.enabled=p,i.texture.needsPMREMUpdate=!0}};var sc=class extends ge{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var eo=class{constructor(){this._previousTime=0,this._currentTime=0,this._startTime=performance.now(),this._delta=0,this._elapsed=0,this._timescale=1,this._document=null,this._pageVisibilityHandler=null}connect(e){this._document=e,e.hidden!==void 0&&(this._pageVisibilityHandler=Py.bind(this),e.addEventListener("visibilitychange",this._pageVisibilityHandler,!1))}disconnect(){this._pageVisibilityHandler!==null&&(this._document.removeEventListener("visibilitychange",this._pageVisibilityHandler),this._pageVisibilityHandler=null),this._document=null}getDelta(){return this._delta/1e3}getElapsed(){return this._elapsed/1e3}getTimescale(){return this._timescale}setTimescale(e){return this._timescale=e,this}reset(){return this._currentTime=performance.now()-this._startTime,this}dispose(){this.disconnect()}update(e){return this._pageVisibilityHandler!==null&&this._document.hidden===!0?this._delta=0:(this._previousTime=this._currentTime,this._currentTime=(e!==void 0?e:performance.now())-this._startTime,this._delta=(this._currentTime-this._previousTime)*this._timescale,this._elapsed+=this._delta),this}};function Py(){this._document.hidden===!1&&this.reset()}var Qr=new y,xu=new ce,Ly=new y,en=new y,tn=new y,oc=class extends G{constructor(){super(),this.type="AudioListener",this.context=fr.getContext(),this.gain=this.context.createGain(),this.gain.connect(this.context.destination),this.filter=null,this.timeDelta=0,this._timer=new eo}getInput(){return this.gain}removeFilter(){return this.filter!==null&&(this.gain.disconnect(this.filter),this.filter.disconnect(this.context.destination),this.gain.connect(this.context.destination),this.filter=null),this}getFilter(){return this.filter}setFilter(e){return this.filter!==null?(this.gain.disconnect(this.filter),this.filter.disconnect(this.context.destination)):this.gain.disconnect(this.context.destination),this.filter=e,this.gain.connect(this.filter),this.filter.connect(this.context.destination),this}getMasterVolume(){return this.gain.gain.value}setMasterVolume(e){return this.gain.gain.setTargetAtTime(e,this.context.currentTime,.01),this}updateMatrixWorld(e){super.updateMatrixWorld(e),this._timer.update();let t=this.context.listener;if(this.timeDelta=this._timer.getDelta(),this.matrixWorld.decompose(Qr,xu,Ly),en.set(0,0,-1).applyQuaternion(xu),tn.set(0,1,0).applyQuaternion(xu),t.positionX){let i=this.context.currentTime+this.timeDelta;t.positionX.linearRampToValueAtTime(Qr.x,i),t.positionY.linearRampToValueAtTime(Qr.y,i),t.positionZ.linearRampToValueAtTime(Qr.z,i),t.forwardX.linearRampToValueAtTime(en.x,i),t.forwardY.linearRampToValueAtTime(en.y,i),t.forwardZ.linearRampToValueAtTime(en.z,i),t.upX.linearRampToValueAtTime(tn.x,i),t.upY.linearRampToValueAtTime(tn.y,i),t.upZ.linearRampToValueAtTime(tn.z,i)}else t.setPosition(Qr.x,Qr.y,Qr.z),t.setOrientation(en.x,en.y,en.z,tn.x,tn.y,tn.z)}};var to=class extends G{constructor(e){super(),this.type="Audio",this.listener=e,this.context=e.context,this.gain=this.context.createGain(),this.gain.connect(e.getInput()),this.autoplay=!1,this.buffer=null,this.detune=0,this.loop=!1,this.loopStart=0,this.loopEnd=0,this.offset=0,this.duration=void 0,this.playbackRate=1,this.isPlaying=!1,this.hasPlaybackControl=!0,this.source=null,this.sourceType="empty",this._startedAt=0,this._progress=0,this._connected=!1,this.filters=[]}getOutput(){return this.gain}setNodeSource(e){return this.hasPlaybackControl=!1,this.sourceType="audioNode",this.source=e,this.connect(),this}setMediaElementSource(e){return this.hasPlaybackControl=!1,this.sourceType="mediaNode",this.source=this.context.createMediaElementSource(e),this.connect(),this}setMediaStreamSource(e){return this.hasPlaybackControl=!1,this.sourceType="mediaStreamNode",this.source=this.context.createMediaStreamSource(e),this.connect(),this}setBuffer(e){return this.buffer=e,this.sourceType="buffer",this.autoplay&&this.play(),this}play(e=0){if(this.isPlaying===!0){B("Audio: Audio is already playing.");return}if(this.hasPlaybackControl===!1){B("Audio: this Audio has no playback control.");return}this._startedAt=this.context.currentTime+e;let t=this.context.createBufferSource();return t.buffer=this.buffer,t.loop=this.loop,t.loopStart=this.loopStart,t.loopEnd=this.loopEnd,t.onended=this.onEnded.bind(this),t.start(this._startedAt,this._progress+this.offset,this.duration),this.isPlaying=!0,this.source=t,this.setDetune(this.detune),this.setPlaybackRate(this.playbackRate),this.connect()}pause(){if(this.hasPlaybackControl===!1){B("Audio: this Audio has no playback control.");return}return this.isPlaying===!0&&(this._progress+=Math.max(this.context.currentTime-this._startedAt,0)*this.playbackRate,this.loop===!0&&(this._progress=this._progress%(this.duration||this.buffer.duration)),this.source.stop(),this.source.onended=null,this.isPlaying=!1),this}stop(e=0){if(this.hasPlaybackControl===!1){B("Audio: this Audio has no playback control.");return}return this._progress=0,this.source!==null&&(this.source.stop(this.context.currentTime+e),this.source.onended=null),this.isPlaying=!1,this}connect(){if(this.filters.length>0){this.source.connect(this.filters[0]);for(let e=1,t=this.filters.length;e<t;e++)this.filters[e-1].connect(this.filters[e]);this.filters[this.filters.length-1].connect(this.getOutput())}else this.source.connect(this.getOutput());return this._connected=!0,this}disconnect(){if(this._connected!==!1){if(this.filters.length>0){this.source.disconnect(this.filters[0]);for(let e=1,t=this.filters.length;e<t;e++)this.filters[e-1].disconnect(this.filters[e]);this.filters[this.filters.length-1].disconnect(this.getOutput())}else this.source.disconnect(this.getOutput());return this._connected=!1,this}}getFilters(){return this.filters}setFilters(e){return e||(e=[]),this._connected===!0?(this.disconnect(),this.filters=e.slice(),this.connect()):this.filters=e.slice(),this}setDetune(e){return this.detune=e,this.isPlaying===!0&&this.source.detune!==void 0&&this.source.detune.setTargetAtTime(this.detune,this.context.currentTime,.01),this}getDetune(){return this.detune}getFilter(){return this.getFilters()[0]}setFilter(e){return this.setFilters(e?[e]:[])}setPlaybackRate(e){if(this.hasPlaybackControl===!1){B("Audio: this Audio has no playback control.");return}return this.playbackRate=e,this.isPlaying===!0&&this.source.playbackRate.setTargetAtTime(this.playbackRate,this.context.currentTime,.01),this}getPlaybackRate(){return this.playbackRate}onEnded(){this.isPlaying=!1,this._progress=0}getLoop(){return this.hasPlaybackControl===!1?(B("Audio: this Audio has no playback control."),!1):this.loop}setLoop(e){if(this.hasPlaybackControl===!1){B("Audio: this Audio has no playback control.");return}return this.loop=e,this.isPlaying===!0&&(this.source.loop=this.loop),this}setLoopStart(e){return this.loopStart=e,this}setLoopEnd(e){return this.loopEnd=e,this}getVolume(){return this.gain.gain.value}setVolume(e){return this.gain.gain.setTargetAtTime(e,this.context.currentTime,.01),this}copy(e,t){return super.copy(e,t),e.sourceType!=="buffer"?(B("Audio: Audio source type cannot be copied."),this):(this.autoplay=e.autoplay,this.buffer=e.buffer,this.detune=e.detune,this.loop=e.loop,this.loopStart=e.loopStart,this.loopEnd=e.loopEnd,this.offset=e.offset,this.duration=e.duration,this.playbackRate=e.playbackRate,this.hasPlaybackControl=e.hasPlaybackControl,this.sourceType=e.sourceType,this.filters=e.filters.slice(),this)}clone(e){return new this.constructor(this.listener).copy(this,e)}};var rn=new y,Od=new ce,Ny=new y,nn=new y,ac=class extends to{constructor(e){super(e),this.panner=this.context.createPanner(),this.panner.panningModel="HRTF",this.panner.connect(this.gain)}connect(){return super.connect(),this.panner.connect(this.gain),this}disconnect(){return super.disconnect(),this.panner.disconnect(this.gain),this}getOutput(){return this.panner}getRefDistance(){return this.panner.refDistance}setRefDistance(e){return this.panner.refDistance=e,this}getRolloffFactor(){return this.panner.rolloffFactor}setRolloffFactor(e){return this.panner.rolloffFactor=e,this}getDistanceModel(){return this.panner.distanceModel}setDistanceModel(e){return this.panner.distanceModel=e,this}getMaxDistance(){return this.panner.maxDistance}setMaxDistance(e){return this.panner.maxDistance=e,this}setDirectionalCone(e,t,i){return this.panner.coneInnerAngle=e,this.panner.coneOuterAngle=t,this.panner.coneOuterGain=i,this}updateMatrixWorld(e){if(super.updateMatrixWorld(e),this.hasPlaybackControl===!0&&this.isPlaying===!1)return;this.matrixWorld.decompose(rn,Od,Ny),nn.set(0,0,1).applyQuaternion(Od);let t=this.panner;if(t.positionX){let i=this.context.currentTime+this.listener.timeDelta;t.positionX.linearRampToValueAtTime(rn.x,i),t.positionY.linearRampToValueAtTime(rn.y,i),t.positionZ.linearRampToValueAtTime(rn.z,i),t.orientationX.linearRampToValueAtTime(nn.x,i),t.orientationY.linearRampToValueAtTime(nn.y,i),t.orientationZ.linearRampToValueAtTime(nn.z,i)}else t.setPosition(rn.x,rn.y,rn.z),t.setOrientation(nn.x,nn.y,nn.z)}};var lc=class{constructor(e,t=2048){this.analyser=e.context.createAnalyser(),this.analyser.fftSize=t,this.data=new Uint8Array(this.analyser.frequencyBinCount),e.getOutput().connect(this.analyser)}getFrequencyData(){return this.analyser.getByteFrequencyData(this.data),this.data}getAverageFrequency(){let e=0,t=this.getFrequencyData();for(let i=0;i<t.length;i++)e+=t[i];return e/t.length}};var io=class{constructor(e,t,i){this.binding=e,this.valueSize=i;let r,n,s;switch(t){case"quaternion":r=this._slerp,n=this._slerpAdditive,s=this._setAdditiveIdentityQuaternion,this.buffer=new Float64Array(i*6),this._workIndex=5;break;case"string":case"bool":r=this._select,n=this._select,s=this._setAdditiveIdentityOther,this.buffer=new Array(i*5);break;default:r=this._lerp,n=this._lerpAdditive,s=this._setAdditiveIdentityNumeric,this.buffer=new Float64Array(i*5)}this._mixBufferRegion=r,this._mixBufferRegionAdditive=n,this._setIdentity=s,this._origIndex=3,this._addIndex=4,this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,this.useCount=0,this.referenceCount=0}accumulate(e,t){let i=this.buffer,r=this.valueSize,n=e*r+r,s=this.cumulativeWeight;if(s===0){for(let o=0;o!==r;++o)i[n+o]=i[o];s=t}else{s+=t;let o=t/s;this._mixBufferRegion(i,n,0,o,r)}this.cumulativeWeight=s}accumulateAdditive(e){let t=this.buffer,i=this.valueSize,r=i*this._addIndex;this.cumulativeWeightAdditive===0&&this._setIdentity(),this._mixBufferRegionAdditive(t,r,0,e,i),this.cumulativeWeightAdditive+=e}apply(e){let t=this.valueSize,i=this.buffer,r=e*t+t,n=this.cumulativeWeight,s=this.cumulativeWeightAdditive,o=this.binding;if(this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,n<1){let a=t*this._origIndex;this._mixBufferRegion(i,r,a,1-n,t)}s>0&&this._mixBufferRegionAdditive(i,r,this._addIndex*t,1,t);for(let a=t,c=t+t;a!==c;++a)if(i[a]!==i[a+t]){o.setValue(i,r);break}}saveOriginalState(){let e=this.binding,t=this.buffer,i=this.valueSize,r=i*this._origIndex;e.getValue(t,r);for(let n=i,s=r;n!==s;++n)t[n]=t[r+n%i];this._setIdentity(),this.cumulativeWeight=0,this.cumulativeWeightAdditive=0}restoreOriginalState(){let e=this.valueSize*3;this.binding.setValue(this.buffer,e)}_setAdditiveIdentityNumeric(){let e=this._addIndex*this.valueSize,t=e+this.valueSize;for(let i=e;i<t;i++)this.buffer[i]=0}_setAdditiveIdentityQuaternion(){this._setAdditiveIdentityNumeric(),this.buffer[this._addIndex*this.valueSize+3]=1}_setAdditiveIdentityOther(){let e=this._origIndex*this.valueSize,t=this._addIndex*this.valueSize;for(let i=0;i<this.valueSize;i++)this.buffer[t+i]=this.buffer[e+i]}_select(e,t,i,r,n){if(r>=.5)for(let s=0;s!==n;++s)e[t+s]=e[i+s]}_slerp(e,t,i,r){ce.slerpFlat(e,t,e,t,e,i,r)}_slerpAdditive(e,t,i,r,n){let s=this._workIndex*n;ce.multiplyQuaternionsFlat(e,s,e,t,e,i),ce.slerpFlat(e,t,e,t,e,s,r)}_lerp(e,t,i,r,n){let s=1-r;for(let o=0;o!==n;++o){let a=t+o;e[a]=e[a]*s+e[i+o]*r}}_lerpAdditive(e,t,i,r,n){for(let s=0;s!==n;++s){let o=t+s;e[o]=e[o]+e[i+s]*r}}};var vu="\\[\\]\\.:\\/",Dy=new RegExp("["+vu+"]","g"),bu="[^"+vu+"]",By="[^"+vu.replace("\\.","")+"]",Oy=/((?:WC+[\/:])*)/.source.replace("WC",bu),Fy=/(WCOD+)?/.source.replace("WCOD",By),Uy=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",bu),zy=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",bu),ky=new RegExp("^"+Oy+Fy+Uy+zy+"$"),Vy=["material","materials","bones","map"],yu=class{constructor(e,t,i){let r=i||ne.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let i=this._targetGroup.nCachedObjects_,r=this._bindings[i];r!==void 0&&r.getValue(e,t)}setValue(e,t){let i=this._bindings;for(let r=this._targetGroup.nCachedObjects_,n=i.length;r!==n;++r)i[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].unbind()}},ne=class l{constructor(e,t,i){this.path=t,this.parsedPath=i||l.parseTrackName(t),this.node=l.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new l.Composite(e,t,i):new l(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(Dy,"")}static parseTrackName(e){let t=ky.exec(e);if(t===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+e);let i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=i.nodeName&&i.nodeName.lastIndexOf(".");if(r!==void 0&&r!==-1){let n=i.nodeName.substring(r+1);Vy.indexOf(n)!==-1&&(i.nodeName=i.nodeName.substring(0,r),i.objectName=n)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){let i=function(n){for(let s=0;s<n.length;s++){let o=n[s];if(o.name===t||o.uuid===t)return o;let a=i(o.children);if(a)return a}return null},r=i(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let i=this.resolvedProperty;for(let r=0,n=i.length;r!==n;++r)e[t++]=i[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let i=this.resolvedProperty;for(let r=0,n=i.length;r!==n;++r)i[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let i=this.resolvedProperty;for(let r=0,n=i.length;r!==n;++r)i[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let i=this.resolvedProperty;for(let r=0,n=i.length;r!==n;++r)i[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,i=t.objectName,r=t.propertyName,n=t.propertyIndex;if(e||(e=l.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){B("PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=t.objectIndex;switch(i){case"materials":if(!e.material){Z("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){Z("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){Z("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){Z("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){Z("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[i]===void 0){Z("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[i]}if(c!==void 0){if(e[c]===void 0){Z("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let s=e[r];if(s===void 0){let c=t.nodeName;Z("PropertyBinding: Trying to update property for track: "+c+"."+r+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?o=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let a=this.BindingType.Direct;if(n!==void 0){if(r==="morphTargetInfluences"){if(!e.geometry){Z("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){Z("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[n]!==void 0&&(n=e.morphTargetDictionary[n])}a=this.BindingType.ArrayElement,this.resolvedProperty=s,this.propertyIndex=n}else s.fromArray!==void 0&&s.toArray!==void 0?(a=this.BindingType.HasFromToArray,this.resolvedProperty=s):Array.isArray(s)?(a=this.BindingType.EntireArray,this.resolvedProperty=s):this.propertyName=r;this.getValue=this.GetterByBindingType[a],this.setValue=this.SetterByBindingTypeAndVersioning[a][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};ne.Composite=yu;ne.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};ne.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};ne.prototype.GetterByBindingType=[ne.prototype._getValue_direct,ne.prototype._getValue_array,ne.prototype._getValue_arrayElement,ne.prototype._getValue_toArray];ne.prototype.SetterByBindingTypeAndVersioning=[[ne.prototype._setValue_direct,ne.prototype._setValue_direct_setNeedsUpdate,ne.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[ne.prototype._setValue_array,ne.prototype._setValue_array_setNeedsUpdate,ne.prototype._setValue_array_setMatrixWorldNeedsUpdate],[ne.prototype._setValue_arrayElement,ne.prototype._setValue_arrayElement_setNeedsUpdate,ne.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[ne.prototype._setValue_fromArray,ne.prototype._setValue_fromArray_setNeedsUpdate,ne.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var cc=class{constructor(){this.isAnimationObjectGroup=!0,this.uuid=Te(),this._objects=Array.prototype.slice.call(arguments),this.nCachedObjects_=0;let e={};this._indicesByUUID=e;for(let i=0,r=arguments.length;i!==r;++i)e[arguments[i].uuid]=i;this._paths=[],this._parsedPaths=[],this._bindings=[],this._bindingsIndicesByPath={};let t=this;this.stats={objects:{get total(){return t._objects.length},get inUse(){return this.total-t.nCachedObjects_}},get bindingsPerObject(){return t._bindings.length}}}add(){let e=this._objects,t=this._indicesByUUID,i=this._paths,r=this._parsedPaths,n=this._bindings,s=n.length,o,a=e.length,c=this.nCachedObjects_;for(let h=0,u=arguments.length;h!==u;++h){let f=arguments[h],d=f.uuid,p=t[d];if(p===void 0){p=a++,t[d]=p,e.push(f);for(let m=0,g=s;m!==g;++m)n[m].push(new ne(f,i[m],r[m]))}else if(p<c){o=e[p];let m=--c,g=e[m];t[g.uuid]=p,e[p]=g,t[d]=m,e[m]=f;for(let _=0,x=s;_!==x;++_){let v=n[_],b=v[m],M=v[p];v[p]=b,M===void 0&&(M=new ne(f,i[_],r[_])),v[m]=M}}else e[p]!==o&&Z("AnimationObjectGroup: Different objects with the same UUID detected. Clean the caches or recreate your infrastructure when reloading scenes.")}this.nCachedObjects_=c}remove(){let e=this._objects,t=this._indicesByUUID,i=this._bindings,r=i.length,n=this.nCachedObjects_;for(let s=0,o=arguments.length;s!==o;++s){let a=arguments[s],c=a.uuid,h=t[c];if(h!==void 0&&h>=n){let u=n++,f=e[u];t[f.uuid]=h,e[h]=f,t[c]=u,e[u]=a;for(let d=0,p=r;d!==p;++d){let m=i[d],g=m[u],_=m[h];m[h]=g,m[u]=_}}}this.nCachedObjects_=n}uncache(){let e=this._objects,t=this._indicesByUUID,i=this._bindings,r=i.length,n=this.nCachedObjects_,s=e.length;for(let o=0,a=arguments.length;o!==a;++o){let c=arguments[o],h=c.uuid,u=t[h];if(u!==void 0)if(delete t[h],u<n){let f=--n,d=e[f],p=--s,m=e[p];u!==f&&(t[d.uuid]=u),e[u]=d,f!==p&&(t[m.uuid]=f),e[f]=m,e.pop();for(let g=0,_=r;g!==_;++g){let x=i[g],v=x[f],b=x[p];x[u]=v,x[f]=b,x.pop()}}else{let f=--s,d=e[f];u!==f&&(t[d.uuid]=u),e[u]=d,e.pop();for(let p=0,m=r;p!==m;++p){let g=i[p];g[u]=g[f],g.pop()}}}this.nCachedObjects_=n}subscribe_(e,t){let i=this._bindingsIndicesByPath,r=i[e],n=this._bindings;if(r!==void 0)return n[r];let s=this._paths,o=this._parsedPaths,a=this._objects,c=a.length,h=this.nCachedObjects_,u=new Array(c);r=n.length,i[e]=r,s.push(e),o.push(t),n.push(u);for(let f=h,d=a.length;f!==d;++f){let p=a[f];u[f]=new ne(p,e,t)}return u}unsubscribe_(e){let t=this._bindingsIndicesByPath,i=t[e];if(i!==void 0){let r=this._paths,n=this._parsedPaths,s=this._bindings,o=s.length-1,a=s[o],c=r[o];t[c]=i,s[i]=a,s.pop(),n[i]=n[o],n.pop(),r[i]=r[o],r.pop()}}};var ro=class{constructor(e,t,i=null,r=t.blendMode){this._mixer=e,this._clip=t,this._localRoot=i,this.blendMode=r;let n=t.tracks,s=n.length,o=new Array(s),a={endingStart:Ai,endingEnd:Ai};for(let c=0;c!==s;++c){let h=n[c].createInterpolant(null);o[c]=h,h.settings=a}this._interpolantSettings=a,this._interpolants=o,this._propertyBindings=new Array(s),this._cacheIndex=null,this._byClipCacheIndex=null,this._timeScaleInterpolant=null,this._restoreTimeScale=null,this._weightInterpolant=null,this.loop=mh,this._loopCount=-1,this._startTime=null,this.time=0,this.timeScale=1,this._effectiveTimeScale=1,this.weight=1,this._effectiveWeight=1,this.repetitions=1/0,this.paused=!1,this.enabled=!0,this.clampWhenFinished=!1,this.zeroSlopeAtStart=!0,this.zeroSlopeAtEnd=!0}play(){return this._mixer._activateAction(this),this}stop(){return this._mixer._deactivateAction(this),this.reset()}reset(){return this.paused=!1,this.enabled=!0,this.time=0,this._loopCount=-1,this._startTime=null,this.stopFading().stopWarping()}isRunning(){return this.enabled&&!this.paused&&this.timeScale!==0&&this._startTime===null&&this._mixer._isActiveAction(this)}isScheduled(){return this._mixer._isActiveAction(this)}startAt(e){return this._startTime=e,this}setLoop(e,t){return this.loop=e,this.repetitions=t,this}setEffectiveWeight(e){return this.weight=e,this._effectiveWeight=this.enabled?e:0,this.stopFading()}getEffectiveWeight(){return this._effectiveWeight}fadeIn(e){return this._scheduleFading(e,0,1)}fadeOut(e){return this._scheduleFading(e,1,0)}crossFadeFrom(e,t,i=!1){if(e.fadeOut(t),this.fadeIn(t),i===!0){let r=this._clip.duration,n=e._clip.duration,s=n/r,o=r/n;e._restoreTimeScale=e.timeScale,this._restoreTimeScale=this.timeScale,e.warp(1,s,t),this.warp(o,1,t)}return this}crossFadeTo(e,t,i=!1){return e.crossFadeFrom(this,t,i)}stopFading(){let e=this._weightInterpolant;return e!==null&&(this._weightInterpolant=null,this._mixer._takeBackControlInterpolant(e)),this}setEffectiveTimeScale(e){return this.timeScale=e,this._effectiveTimeScale=this.paused?0:e,this.stopWarping()}getEffectiveTimeScale(){return this._effectiveTimeScale}setDuration(e){return this.timeScale=this._clip.duration/e,this.stopWarping()}syncWith(e){return this.time=e.time,this.timeScale=e.timeScale,this.stopWarping()}halt(e){return this.warp(this._effectiveTimeScale,0,e)}warp(e,t,i){let r=this._mixer,n=r.time,s=this.timeScale,o=this._timeScaleInterpolant;o===null&&(o=r._lendControlInterpolant(),this._timeScaleInterpolant=o);let a=o.parameterPositions,c=o.sampleValues;return a[0]=n,a[1]=n+i,c[0]=e/s,c[1]=t/s,this}stopWarping(){let e=this._timeScaleInterpolant;return e!==null&&(this._timeScaleInterpolant=null,this._mixer._takeBackControlInterpolant(e)),this._restoreTimeScale=null,this}getMixer(){return this._mixer}getClip(){return this._clip}getRoot(){return this._localRoot||this._mixer._root}_update(e,t,i,r){if(!this.enabled){this._updateWeight(e);return}let n=this._startTime;if(n!==null){let a=(e-n)*i;a<0||i===0?t=0:(this._startTime=null,t=i*a)}t*=this._updateTimeScale(e);let s=this._updateTime(t),o=this._updateWeight(e);if(o>0){let a=this._interpolants,c=this._propertyBindings;switch(this.blendMode){case Po:for(let h=0,u=a.length;h!==u;++h)a[h].evaluate(s),c[h].accumulateAdditive(o);break;case Rr:default:for(let h=0,u=a.length;h!==u;++h)a[h].evaluate(s),c[h].accumulate(r,o)}}}_updateWeight(e){let t=0;if(this.enabled){t=this.weight;let i=this._weightInterpolant;if(i!==null){let r=i.evaluate(e)[0];t*=r,e>i.parameterPositions[1]&&(this.stopFading(),r===0&&(this.enabled=!1))}}return this._effectiveWeight=t,t}_updateTimeScale(e){let t=0;if(!this.paused){t=this.timeScale;let i=this._timeScaleInterpolant;if(i!==null){let r=i.evaluate(e)[0];t*=r,e>i.parameterPositions[1]&&(t===0?this.paused=!0:(this._restoreTimeScale!==null&&(t=this._restoreTimeScale),this.timeScale=t),this.stopWarping())}}return this._effectiveTimeScale=t,t}_updateTime(e){let t=this._clip.duration,i=this.loop,r=this.time+e,n=this._loopCount,s=i===gh;if(e===0)return n===-1?r:s&&(n&1)===1?t-r:r;if(i===ph){n===-1&&(this._loopCount=0,this._setEndings(!0,!0,!1));e:{if(r>=t)r=t;else if(r<0)r=0;else{this.time=r;break e}this.clampWhenFinished?this.paused=!0:this.enabled=!1,this.time=r,this._mixer.dispatchEvent({type:"finished",action:this,direction:e<0?-1:1})}}else{if(n===-1&&(e>=0?(n=0,this._setEndings(!0,this.repetitions===0,s)):this._setEndings(this.repetitions===0,!0,s)),r>=t||r<0){let o=Math.floor(r/t);r-=t*o,n+=Math.abs(o);let a=this.repetitions-n;if(a<=0)this.clampWhenFinished?this.paused=!0:this.enabled=!1,r=e>0?t:0,this.time=r,this._mixer.dispatchEvent({type:"finished",action:this,direction:e>0?1:-1});else{if(a===1){let c=e<0;this._setEndings(c,!c,s)}else this._setEndings(!1,!1,s);this._loopCount=n,this.time=r,this._mixer.dispatchEvent({type:"loop",action:this,loopDelta:o})}}else this._loopCount=n,this.time=r;if(s&&(n&1)===1)return t-r}return r}_setEndings(e,t,i){let r=this._interpolantSettings;i?(r.endingStart=Ti,r.endingEnd=Ti):(e?r.endingStart=this.zeroSlopeAtStart?Ti:Ai:r.endingStart=Ir,t?r.endingEnd=this.zeroSlopeAtEnd?Ti:Ai:r.endingEnd=Ir)}_scheduleFading(e,t,i){let r=this._mixer,n=r.time,s=this._weightInterpolant;s===null&&(s=r._lendControlInterpolant(),this._weightInterpolant=s);let o=s.parameterPositions,a=s.sampleValues;return o[0]=n,a[0]=t,o[1]=n+e,a[1]=i,this}};var Gy=new Float32Array(1),ra=class extends Ie{constructor(e){super(),this._root=e,this._initMemoryManager(),this._accuIndex=0,this.time=0,this.timeScale=1}_bindAction(e,t){let i=e._localRoot||this._root,r=e._clip.tracks,n=r.length,s=e._propertyBindings,o=e._interpolants,a=i.uuid,c=this._bindingsByRootAndName,h=c[a];h===void 0&&(h={},c[a]=h);for(let u=0;u!==n;++u){let f=r[u],d=f.name,p=h[d];if(p!==void 0)++p.referenceCount,s[u]=p;else{if(p=s[u],p!==void 0){p._cacheIndex===null&&(++p.referenceCount,this._addInactiveBinding(p,a,d));continue}let m=t&&t._propertyBindings[u].binding.parsedPath;p=new io(ne.create(i,d,m),f.ValueTypeName,f.getValueSize()),++p.referenceCount,this._addInactiveBinding(p,a,d),s[u]=p}o[u].resultBuffer=p.buffer}}_activateAction(e){if(!this._isActiveAction(e)){if(e._cacheIndex===null){let i=(e._localRoot||this._root).uuid,r=e._clip.uuid,n=this._actionsByClip[r];this._bindAction(e,n&&n.knownActions[0]),this._addInactiveAction(e,r,i)}let t=e._propertyBindings;for(let i=0,r=t.length;i!==r;++i){let n=t[i];n.useCount++===0&&(this._lendBinding(n),n.saveOriginalState())}this._lendAction(e)}}_deactivateAction(e){if(this._isActiveAction(e)){let t=e._propertyBindings;for(let i=0,r=t.length;i!==r;++i){let n=t[i];--n.useCount===0&&(n.restoreOriginalState(),this._takeBackBinding(n))}this._takeBackAction(e)}}_initMemoryManager(){this._actions=[],this._nActiveActions=0,this._actionsByClip={},this._bindings=[],this._nActiveBindings=0,this._bindingsByRootAndName={},this._controlInterpolants=[],this._nActiveControlInterpolants=0;let e=this;this.stats={actions:{get total(){return e._actions.length},get inUse(){return e._nActiveActions}},bindings:{get total(){return e._bindings.length},get inUse(){return e._nActiveBindings}},controlInterpolants:{get total(){return e._controlInterpolants.length},get inUse(){return e._nActiveControlInterpolants}}}}_isActiveAction(e){let t=e._cacheIndex;return t!==null&&t<this._nActiveActions}_addInactiveAction(e,t,i){let r=this._actions,n=this._actionsByClip,s=n[t];if(s===void 0)s={knownActions:[e],actionByRoot:{}},e._byClipCacheIndex=0,n[t]=s;else{let o=s.knownActions;e._byClipCacheIndex=o.length,o.push(e)}e._cacheIndex=r.length,r.push(e),s.actionByRoot[i]=e}_removeInactiveAction(e){let t=this._actions,i=t[t.length-1],r=e._cacheIndex;i._cacheIndex=r,t[r]=i,t.pop(),e._cacheIndex=null;let n=e._clip.uuid,s=this._actionsByClip,o=s[n],a=o.knownActions,c=a[a.length-1],h=e._byClipCacheIndex;c._byClipCacheIndex=h,a[h]=c,a.pop(),e._byClipCacheIndex=null;let u=o.actionByRoot,f=(e._localRoot||this._root).uuid;delete u[f],a.length===0&&delete s[n],this._removeInactiveBindingsForAction(e)}_removeInactiveBindingsForAction(e){let t=e._propertyBindings;for(let i=0,r=t.length;i!==r;++i){let n=t[i];--n.referenceCount===0&&this._removeInactiveBinding(n)}}_lendAction(e){let t=this._actions,i=e._cacheIndex,r=this._nActiveActions++,n=t[r];e._cacheIndex=r,t[r]=e,n._cacheIndex=i,t[i]=n}_takeBackAction(e){let t=this._actions,i=e._cacheIndex,r=--this._nActiveActions,n=t[r];e._cacheIndex=r,t[r]=e,n._cacheIndex=i,t[i]=n}_addInactiveBinding(e,t,i){let r=this._bindingsByRootAndName,n=this._bindings,s=r[t];s===void 0&&(s={},r[t]=s),s[i]=e,e._cacheIndex=n.length,n.push(e)}_removeInactiveBinding(e){let t=this._bindings,i=e.binding,r=i.rootNode.uuid,n=i.path,s=this._bindingsByRootAndName,o=s[r],a=t[t.length-1],c=e._cacheIndex;a._cacheIndex=c,t[c]=a,t.pop(),delete o[n],Object.keys(o).length===0&&delete s[r]}_lendBinding(e){let t=this._bindings,i=e._cacheIndex,r=this._nActiveBindings++,n=t[r];e._cacheIndex=r,t[r]=e,n._cacheIndex=i,t[i]=n}_takeBackBinding(e){let t=this._bindings,i=e._cacheIndex,r=--this._nActiveBindings,n=t[r];e._cacheIndex=r,t[r]=e,n._cacheIndex=i,t[i]=n}_lendControlInterpolant(){let e=this._controlInterpolants,t=this._nActiveControlInterpolants++,i=e[t];return i===void 0&&(i=new or(new Float32Array(2),new Float32Array(2),1,Gy),i.__cacheIndex=t,e[t]=i),i}_takeBackControlInterpolant(e){let t=this._controlInterpolants,i=e.__cacheIndex,r=--this._nActiveControlInterpolants,n=t[r];e.__cacheIndex=r,t[r]=e,n.__cacheIndex=i,t[i]=n}clipAction(e,t,i){let r=t||this._root,n=r.uuid,s=typeof e=="string"?vt.findByName(r,e):e,o=s!==null?s.uuid:e,a=this._actionsByClip[o],c=null;if(i===void 0&&(s!==null?i=s.blendMode:i=Rr),a!==void 0){let u=a.actionByRoot[n];if(u!==void 0&&u.blendMode===i)return u;c=a.knownActions[0],s===null&&(s=c._clip)}if(s===null)return null;let h=new ro(this,s,t,i);return this._bindAction(h,c),this._addInactiveAction(h,o,n),h}existingAction(e,t){let i=t||this._root,r=i.uuid,n=typeof e=="string"?vt.findByName(i,e):e,s=n?n.uuid:e,o=this._actionsByClip[s];return o!==void 0&&o.actionByRoot[r]||null}stopAllAction(){let e=this._actions,t=this._nActiveActions;for(let i=t-1;i>=0;--i)e[i].stop();return this}update(e){e*=this.timeScale;let t=this._actions,i=this._nActiveActions,r=this.time+=e,n=Math.sign(e),s=this._accuIndex^=1;for(let c=0;c!==i;++c)t[c]._update(r,e,n,s);let o=this._bindings,a=this._nActiveBindings;for(let c=0;c!==a;++c)o[c].apply(s);return this}setTime(e){this.time=0;for(let t=0;t<this._actions.length;t++)this._actions[t].time=0;return this.update(e)}getRoot(){return this._root}uncacheClip(e){let t=this._actions,i=e.uuid,r=this._actionsByClip,n=r[i];if(n!==void 0){let s=n.knownActions;for(let o=0,a=s.length;o!==a;++o){let c=s[o];this._deactivateAction(c);let h=c._cacheIndex,u=t[t.length-1];c._cacheIndex=null,c._byClipCacheIndex=null,u._cacheIndex=h,t[h]=u,t.pop(),this._removeInactiveBindingsForAction(c)}delete r[i]}}uncacheRoot(e){let t=e.uuid,i=this._actionsByClip;for(let s in i){let o=i[s].actionByRoot,a=o[t];a!==void 0&&(this._deactivateAction(a),this._removeInactiveAction(a))}let r=this._bindingsByRootAndName,n=r[t];if(n!==void 0)for(let s in n){let o=n[s];o.restoreOriginalState(),this._removeInactiveBinding(o)}}uncacheAction(e,t){let i=this.existingAction(e,t);i!==null&&(this._deactivateAction(i),this._removeInactiveAction(i))}};var hc=class extends qi{constructor(e=1,t=1,i=1,r={}){super(e,t,r),this.isRenderTarget3D=!0,this.depth=i;for(let n=0;n<this.textures.length;n++){let s=new Xi(null,e,t,i);s.isRenderTargetTexture=!0,s.renderTarget=this,this.textures[n]=s}this._setTextureOptions(r)}};var uc=class l{constructor(e){this.value=e}clone(){return new l(this.value.clone===void 0?this.value:this.value.clone())}};var Hy=0,fc=class extends Ie{constructor(){super(),this.isUniformsGroup=!0,Object.defineProperty(this,"id",{value:Hy++}),this.name="",this.usage=Lr,this.uniforms=[]}add(e){return this.uniforms.push(e),this}remove(e){let t=this.uniforms.indexOf(e);return t!==-1&&this.uniforms.splice(t,1),this}setName(e){return this.name=e,this}setUsage(e){return this.usage=e,this}dispose(){this.dispatchEvent({type:"dispose"})}copy(e){this.name=e.name,this.usage=e.usage;let t=e.uniforms;this.uniforms.length=0;for(let i=0,r=t.length;i<r;i++){let n=Array.isArray(t[i])?t[i]:[t[i]];for(let s=0;s<n.length;s++)this.uniforms.push(n[s].clone())}return this}clone(){return new this.constructor().copy(this)}};var dc=class extends It{constructor(e,t,i=1){super(e,t),this.isInstancedInterleavedBuffer=!0,this.meshPerAttribute=i}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}clone(e){let t=super.clone(e);return t.meshPerAttribute=this.meshPerAttribute,t}toJSON(e){let t=super.toJSON(e);return t.isInstancedInterleavedBuffer=!0,t.meshPerAttribute=this.meshPerAttribute,t}};var pc=class{constructor(e,t,i,r,n,s=!1){this.isGLBufferAttribute=!0,this.name="",this.buffer=e,this.type=t,this.itemSize=i,this.elementSize=r,this.count=n,this.normalized=s,this.version=0}set needsUpdate(e){e===!0&&this.version++}setBuffer(e){return this.buffer=e,this}setType(e,t){return this.type=e,this.elementSize=t,this}setItemSize(e){return this.itemSize=e,this}setCount(e){return this.count=e,this}};var Fd=new F,mc=class{constructor(e,t,i=0,r=1/0){this.ray=new xt(e,t),this.near=i,this.far=r,this.camera=null,this.layers=new Zi,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,t.projectionMatrix.elements[14]).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):Z("Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return Fd.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Fd),this}intersectObject(e,t=!0,i=[]){return Su(e,this,i,t),i.sort(Ud),i}intersectObjects(e,t=!0,i=[]){for(let r=0,n=e.length;r<n;r++)Su(e[r],this,i,t);return i.sort(Ud),i}};function Ud(l,e){return l.distance-e.distance}function Su(l,e,t,i){let r=!0;if(l.layers.test(e.layers)&&l.raycast(e,t)===!1&&(r=!1),r===!0&&i===!0){let n=l.children;for(let s=0,o=n.length;s<o;s++)Su(n[s],e,t,!0)}}var gc=class{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1,B("Clock: This module has been deprecated. Please use THREE.Timer instead.")}start(){this.startTime=performance.now(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){let t=performance.now();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}};var _c=class{constructor(e=1,t=0,i=0){this.radius=e,this.phi=t,this.theta=i}set(e,t,i){return this.radius=e,this.phi=t,this.theta=i,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=k(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,i){return this.radius=Math.sqrt(e*e+t*t+i*i),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,i),this.phi=Math.acos(k(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var xc=class{constructor(e=1,t=0,i=0){this.radius=e,this.theta=t,this.y=i}set(e,t,i){return this.radius=e,this.theta=t,this.y=i,this}copy(e){return this.radius=e.radius,this.theta=e.theta,this.y=e.y,this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,i){return this.radius=Math.sqrt(e*e+i*i),this.theta=Math.atan2(e,i),this.y=t,this}clone(){return new this.constructor().copy(this)}};var Mu=class Mu{constructor(e,t,i,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,i,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let i=0;i<4;i++)this.elements[i]=e[i+t];return this}set(e,t,i,r){let n=this.elements;return n[0]=e,n[2]=t,n[1]=i,n[3]=r,this}};Mu.prototype.isMatrix2=!0;var yc=Mu;var zd=new T,no=class{constructor(e=new T(1/0,1/0),t=new T(-1/0,-1/0)){this.isBox2=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=zd.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=1/0,this.max.x=this.max.y=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y}getCenter(e){return this.isEmpty()?e.set(0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,zd).distanceTo(e)}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}};var kd=new y,vc=new y,so=new y,oo=new y,wu=new y,Wy=new y,qy=new y,bc=class{constructor(e=new y,t=new y){this.start=e,this.end=t}set(e,t){return this.start.copy(e),this.end.copy(t),this}copy(e){return this.start.copy(e.start),this.end.copy(e.end),this}getCenter(e){return e.addVectors(this.start,this.end).multiplyScalar(.5)}delta(e){return e.subVectors(this.end,this.start)}distanceSq(){return this.start.distanceToSquared(this.end)}distance(){return this.start.distanceTo(this.end)}at(e,t){return this.delta(t).multiplyScalar(e).add(this.start)}closestPointToPointParameter(e,t){kd.subVectors(e,this.start),vc.subVectors(this.end,this.start);let i=vc.dot(vc);if(i===0)return 0;let n=vc.dot(kd)/i;return t&&(n=k(n,0,1)),n}closestPointToPoint(e,t,i){let r=this.closestPointToPointParameter(e,t);return this.delta(i).multiplyScalar(r).add(this.start)}distanceSqToLine3(e,t=Wy,i=qy){let r=10000000000000001e-32,n,s,o=this.start,a=e.start,c=this.end,h=e.end;so.subVectors(c,o),oo.subVectors(h,a),wu.subVectors(o,a);let u=so.dot(so),f=oo.dot(oo),d=oo.dot(wu);if(u<=r&&f<=r)return t.copy(o),i.copy(a),t.sub(i),t.dot(t);if(u<=r)n=0,s=d/f,s=k(s,0,1);else{let p=so.dot(wu);if(f<=r)s=0,n=k(-p/u,0,1);else{let m=so.dot(oo),g=u*f-m*m;g!==0?n=k((m*d-p*f)/g,0,1):n=0,s=(m*n+d)/f,s<0?(s=0,n=k(-p/u,0,1)):s>1&&(s=1,n=k((m-p)/u,0,1))}}return t.copy(o).addScaledVector(so,n),i.copy(a).addScaledVector(oo,s),t.distanceToSquared(i)}applyMatrix4(e){return this.start.applyMatrix4(e),this.end.applyMatrix4(e),this}equals(e){return e.start.equals(this.start)&&e.end.equals(this.end)}clone(){return new this.constructor().copy(this)}};var Vd=new y,Sc=class extends G{constructor(e,t){super(),this.light=e,this.matrixAutoUpdate=!1,this.color=t,this.type="SpotLightHelper";let i=new L,r=[0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,-1,0,1,0,0,0,0,1,1,0,0,0,0,-1,1];for(let s=0,o=1,a=32;s<a;s++,o++){let c=s/a*Math.PI*2,h=o/a*Math.PI*2;r.push(Math.cos(c),Math.sin(c),1,Math.cos(h),Math.sin(h),1)}i.setAttribute("position",new R(r,3));let n=new re({fog:!1,toneMapped:!1});this.cone=new Me(i,n),this.add(this.cone),this.update()}dispose(){super.dispose(),this.cone.geometry.dispose(),this.cone.material.dispose()}update(){this.light.updateWorldMatrix(!0,!1),this.light.target.updateWorldMatrix(!0,!1),this.parent?(this.parent.updateWorldMatrix(!0),this.matrix.copy(this.parent.matrixWorld).invert().multiply(this.light.matrixWorld)):this.matrix.copy(this.light.matrixWorld),this.matrixWorldNeedsUpdate=!0;let e=this.light.distance?this.light.distance:1e3,t=e*Math.tan(this.light.angle);this.cone.scale.set(t,t,e),Vd.setFromMatrixPosition(this.light.target.matrixWorld),this.cone.lookAt(Vd),this.color!==void 0?this.cone.material.color.set(this.color):this.cone.material.color.copy(this.light.color)}};var dr=new y,Mc=new F,Au=new F,na=class extends Me{constructor(e){let t=Gd(e),i=new L,r=[],n=[];for(let c=0;c<t.length;c++){let h=t[c];h.parent&&h.parent.isBone&&(r.push(0,0,0),r.push(0,0,0),n.push(0,0,0),n.push(0,0,0))}i.setAttribute("position",new R(r,3)),i.setAttribute("color",new R(n,3));let s=new re({vertexColors:!0,depthTest:!1,depthWrite:!1,toneMapped:!1,transparent:!0});super(i,s),this.isSkeletonHelper=!0,this.type="SkeletonHelper",this.root=e,this.bones=t,this.matrix=e.matrixWorld,this.matrixAutoUpdate=!1;let o=new I(255),a=new I(65280);this.setColors(o,a)}updateMatrixWorld(e){let t=this.bones,i=this.geometry,r=i.getAttribute("position");Au.copy(this.root.matrixWorld).invert();for(let n=0,s=0;n<t.length;n++){let o=t[n];o.parent&&o.parent.isBone&&(Mc.multiplyMatrices(Au,o.matrixWorld),dr.setFromMatrixPosition(Mc),r.setXYZ(s,dr.x,dr.y,dr.z),Mc.multiplyMatrices(Au,o.parent.matrixWorld),dr.setFromMatrixPosition(Mc),r.setXYZ(s+1,dr.x,dr.y,dr.z),s+=2)}i.getAttribute("position").needsUpdate=!0,super.updateMatrixWorld(e)}setColors(e,t){let r=this.geometry.getAttribute("color");for(let n=0;n<r.count;n+=2)r.setXYZ(n,e.r,e.g,e.b),r.setXYZ(n+1,t.r,t.g,t.b);return r.needsUpdate=!0,this}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};function Gd(l){let e=[];l.isBone===!0&&e.push(l);for(let t=0;t<l.children.length;t++)e.push(...Gd(l.children[t]));return e}var wc=class extends ae{constructor(e,t,i){let r=new Ts(t,4,2),n=new Se({wireframe:!0,fog:!1,toneMapped:!1});super(r,n),this.light=e,this.color=i,this.type="PointLightHelper",this.matrix=this.light.matrixWorld,this.matrixAutoUpdate=!1,this.update()}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}update(){this.matrixWorldNeedsUpdate=!0,this.light.updateWorldMatrix(!0,!1),this.color!==void 0?this.material.color.set(this.color):this.material.color.copy(this.light.color)}};var Xy=new y,Hd=new I,Wd=new I,Ac=class extends G{constructor(e,t,i){super(),this.light=e,this.matrix=e.matrixWorld,this.matrixAutoUpdate=!1,this.color=i,this.type="HemisphereLightHelper";let r=new As(t);r.rotateY(Math.PI*.5),this.material=new Se({wireframe:!0,fog:!1,toneMapped:!1}),this.color===void 0&&(this.material.vertexColors=!0);let n=r.getAttribute("position"),s=new Float32Array(n.count*3);r.setAttribute("color",new K(s,3)),this.add(new ae(r,this.material)),this.update()}dispose(){super.dispose(),this.children[0].geometry.dispose(),this.children[0].material.dispose()}update(){let e=this.children[0];if(this.color!==void 0)this.material.color.set(this.color);else{let t=e.geometry.getAttribute("color");Hd.copy(this.light.color),Wd.copy(this.light.groundColor);for(let i=0,r=t.count;i<r;i++){let n=i<r/2?Hd:Wd;t.setXYZ(i,n.r,n.g,n.b)}t.needsUpdate=!0}this.matrixWorldNeedsUpdate=!0,this.light.updateWorldMatrix(!0,!1),e.lookAt(Xy.setFromMatrixPosition(this.light.matrixWorld).negate())}};var Tc=class extends Me{constructor(e=10,t=10,i=4473924,r=8947848){i=new I(i),r=new I(r);let n=t/2,s=e/t,o=e/2,a=[],c=[];for(let f=0,d=0,p=-o;f<=t;f++,p+=s){a.push(-o,0,p,o,0,p),a.push(p,0,-o,p,0,o);let m=f===n?i:r;m.toArray(c,d),d+=3,m.toArray(c,d),d+=3,m.toArray(c,d),d+=3,m.toArray(c,d),d+=3}let h=new L;h.setAttribute("position",new R(a,3)),h.setAttribute("color",new R(c,3));let u=new re({vertexColors:!0,toneMapped:!1});super(h,u),this.type="GridHelper"}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};var Cc=class extends Me{constructor(e=10,t=16,i=8,r=64,n=4473924,s=8947848){n=new I(n),s=new I(s);let o=[],a=[];if(t>1)for(let u=0;u<t;u++){let f=u/t*(Math.PI*2),d=Math.sin(f)*e,p=Math.cos(f)*e;o.push(0,0,0),o.push(d,0,p);let m=u&1?n:s;a.push(m.r,m.g,m.b),a.push(m.r,m.g,m.b)}for(let u=0;u<i;u++){let f=u&1?n:s,d=e-e/i*u;for(let p=0;p<r;p++){let m=p/r*(Math.PI*2),g=Math.sin(m)*d,_=Math.cos(m)*d;o.push(g,0,_),a.push(f.r,f.g,f.b),m=(p+1)/r*(Math.PI*2),g=Math.sin(m)*d,_=Math.cos(m)*d,o.push(g,0,_),a.push(f.r,f.g,f.b)}}let c=new L;c.setAttribute("position",new R(o,3)),c.setAttribute("color",new R(a,3));let h=new re({vertexColors:!0,toneMapped:!1});super(c,h),this.type="PolarGridHelper"}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};var qd=new y,Ec=new y,Xd=new y,Ic=class extends G{constructor(e,t,i){super(),this.light=e,this.matrix=e.matrixWorld,this.matrixAutoUpdate=!1,this.color=i,this.type="DirectionalLightHelper",t===void 0&&(t=1);let r=new L;r.setAttribute("position",new R([-t,t,0,t,t,0,t,-t,0,-t,-t,0,-t,t,0],3));let n=new re({fog:!1,toneMapped:!1});this.lightPlane=new ke(r,n),this.add(this.lightPlane),r=new L,r.setAttribute("position",new R([0,0,0,0,0,1],3)),this.targetLine=new ke(r,n),this.add(this.targetLine),this.update()}dispose(){super.dispose(),this.lightPlane.geometry.dispose(),this.lightPlane.material.dispose(),this.targetLine.geometry.dispose(),this.targetLine.material.dispose()}update(){this.matrixWorldNeedsUpdate=!0,this.light.updateWorldMatrix(!0,!1),this.light.target.updateWorldMatrix(!0,!1),qd.setFromMatrixPosition(this.light.matrixWorld),Ec.setFromMatrixPosition(this.light.target.matrixWorld),Xd.subVectors(Ec,qd),this.lightPlane.lookAt(Ec),this.color!==void 0?(this.lightPlane.material.color.set(this.color),this.targetLine.material.color.set(this.color)):(this.lightPlane.material.color.copy(this.light.color),this.targetLine.material.color.copy(this.light.color)),this.targetLine.lookAt(Ec),this.targetLine.scale.z=Xd.length()}};var Rc=new y,Pe=new _i,Pc=class extends Me{constructor(e){let t=new L,i=new re({color:16777215,vertexColors:!0,toneMapped:!1}),r=[],n=[],s={};o("n1","n2"),o("n2","n4"),o("n4","n3"),o("n3","n1"),o("f1","f2"),o("f2","f4"),o("f4","f3"),o("f3","f1"),o("n1","f1"),o("n2","f2"),o("n3","f3"),o("n4","f4"),o("p","n1"),o("p","n2"),o("p","n3"),o("p","n4"),o("u1","u2"),o("u2","u3"),o("u3","u1"),o("c","t"),o("p","c"),o("cn1","cn2"),o("cn3","cn4"),o("cf1","cf2"),o("cf3","cf4");function o(p,m){a(p),a(m)}function a(p){r.push(0,0,0),n.push(0,0,0),s[p]===void 0&&(s[p]=[]),s[p].push(r.length/3-1)}t.setAttribute("position",new R(r,3)),t.setAttribute("color",new R(n,3)),super(t,i),this.type="CameraHelper",this.camera=e,this.camera.updateProjectionMatrix&&this.camera.updateProjectionMatrix(),this.matrix=e.matrixWorld,this.matrixAutoUpdate=!1,this.pointMap=s,this.update();let c=new I(16755200),h=new I(16711680),u=new I(43775),f=new I(16777215),d=new I(3355443);this.setColors(c,h,u,f,d)}setColors(e,t,i,r,n){let o=this.geometry.getAttribute("color");return o.setXYZ(0,e.r,e.g,e.b),o.setXYZ(1,e.r,e.g,e.b),o.setXYZ(2,e.r,e.g,e.b),o.setXYZ(3,e.r,e.g,e.b),o.setXYZ(4,e.r,e.g,e.b),o.setXYZ(5,e.r,e.g,e.b),o.setXYZ(6,e.r,e.g,e.b),o.setXYZ(7,e.r,e.g,e.b),o.setXYZ(8,e.r,e.g,e.b),o.setXYZ(9,e.r,e.g,e.b),o.setXYZ(10,e.r,e.g,e.b),o.setXYZ(11,e.r,e.g,e.b),o.setXYZ(12,e.r,e.g,e.b),o.setXYZ(13,e.r,e.g,e.b),o.setXYZ(14,e.r,e.g,e.b),o.setXYZ(15,e.r,e.g,e.b),o.setXYZ(16,e.r,e.g,e.b),o.setXYZ(17,e.r,e.g,e.b),o.setXYZ(18,e.r,e.g,e.b),o.setXYZ(19,e.r,e.g,e.b),o.setXYZ(20,e.r,e.g,e.b),o.setXYZ(21,e.r,e.g,e.b),o.setXYZ(22,e.r,e.g,e.b),o.setXYZ(23,e.r,e.g,e.b),o.setXYZ(24,t.r,t.g,t.b),o.setXYZ(25,t.r,t.g,t.b),o.setXYZ(26,t.r,t.g,t.b),o.setXYZ(27,t.r,t.g,t.b),o.setXYZ(28,t.r,t.g,t.b),o.setXYZ(29,t.r,t.g,t.b),o.setXYZ(30,t.r,t.g,t.b),o.setXYZ(31,t.r,t.g,t.b),o.setXYZ(32,i.r,i.g,i.b),o.setXYZ(33,i.r,i.g,i.b),o.setXYZ(34,i.r,i.g,i.b),o.setXYZ(35,i.r,i.g,i.b),o.setXYZ(36,i.r,i.g,i.b),o.setXYZ(37,i.r,i.g,i.b),o.setXYZ(38,r.r,r.g,r.b),o.setXYZ(39,r.r,r.g,r.b),o.setXYZ(40,n.r,n.g,n.b),o.setXYZ(41,n.r,n.g,n.b),o.setXYZ(42,n.r,n.g,n.b),o.setXYZ(43,n.r,n.g,n.b),o.setXYZ(44,n.r,n.g,n.b),o.setXYZ(45,n.r,n.g,n.b),o.setXYZ(46,n.r,n.g,n.b),o.setXYZ(47,n.r,n.g,n.b),o.setXYZ(48,n.r,n.g,n.b),o.setXYZ(49,n.r,n.g,n.b),o.needsUpdate=!0,this}update(){let e=this.geometry,t=this.pointMap,i=1,r=1,n,s;if(Pe.projectionMatrixInverse.copy(this.camera.projectionMatrixInverse),this.camera.reversedDepth===!0)n=1,s=0;else if(this.camera.coordinateSystem===Xe)n=-1,s=1;else if(this.camera.coordinateSystem===zt)n=0,s=1;else throw new Error("THREE.CameraHelper.update(): Invalid coordinate system: "+this.camera.coordinateSystem);De("c",t,e,Pe,0,0,n),De("t",t,e,Pe,0,0,s),De("n1",t,e,Pe,-i,-r,n),De("n2",t,e,Pe,i,-r,n),De("n3",t,e,Pe,-i,r,n),De("n4",t,e,Pe,i,r,n),De("f1",t,e,Pe,-i,-r,s),De("f2",t,e,Pe,i,-r,s),De("f3",t,e,Pe,-i,r,s),De("f4",t,e,Pe,i,r,s),De("u1",t,e,Pe,i*.7,r*1.1,n),De("u2",t,e,Pe,-i*.7,r*1.1,n),De("u3",t,e,Pe,0,r*2,n),De("cf1",t,e,Pe,-i,0,s),De("cf2",t,e,Pe,i,0,s),De("cf3",t,e,Pe,0,-r,s),De("cf4",t,e,Pe,0,r,s),De("cn1",t,e,Pe,-i,0,n),De("cn2",t,e,Pe,i,0,n),De("cn3",t,e,Pe,0,-r,n),De("cn4",t,e,Pe,0,r,n),e.getAttribute("position").needsUpdate=!0}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};function De(l,e,t,i,r,n,s){Rc.set(r,n,s).unproject(i);let o=e[l];if(o!==void 0){let a=t.getAttribute("position");for(let c=0,h=o.length;c<h;c++)a.setXYZ(o[c],Rc.x,Rc.y,Rc.z)}}var Lc=new he,Nc=class extends Me{constructor(e,t=16776960){let i=new Uint16Array([0,1,1,2,2,3,3,0,4,5,5,6,6,7,7,4,0,4,1,5,2,6,3,7]),r=new Float32Array(8*3),n=new L;n.setIndex(new K(i,1)),n.setAttribute("position",new K(r,3)),super(n,new re({color:t,toneMapped:!1})),this.object=e,this.type="BoxHelper",this.matrixAutoUpdate=!1,this.update()}update(){if(this.object!==void 0&&Lc.setFromObject(this.object),Lc.isEmpty())return;let e=Lc.min,t=Lc.max,i=this.geometry.attributes.position,r=i.array;r[0]=t.x,r[1]=t.y,r[2]=t.z,r[3]=e.x,r[4]=t.y,r[5]=t.z,r[6]=e.x,r[7]=e.y,r[8]=t.z,r[9]=t.x,r[10]=e.y,r[11]=t.z,r[12]=t.x,r[13]=t.y,r[14]=e.z,r[15]=e.x,r[16]=t.y,r[17]=e.z,r[18]=e.x,r[19]=e.y,r[20]=e.z,r[21]=t.x,r[22]=e.y,r[23]=e.z,i.needsUpdate=!0,this.geometry.computeBoundingSphere()}setFromObject(e){return this.object=e,this.update(),this}copy(e,t){return super.copy(e,t),this.object=e.object,this}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};var Dc=class extends Me{constructor(e,t=16776960){let i=new Uint16Array([0,1,1,2,2,3,3,0,4,5,5,6,6,7,7,4,0,4,1,5,2,6,3,7]),r=[1,1,1,-1,1,1,-1,-1,1,1,-1,1,1,1,-1,-1,1,-1,-1,-1,-1,1,-1,-1],n=new L;n.setIndex(new K(i,1)),n.setAttribute("position",new R(r,3)),super(n,new re({color:t,toneMapped:!1})),this.box=e,this.type="Box3Helper",this.geometry.computeBoundingSphere()}updateMatrixWorld(e){let t=this.box;t.isEmpty()||(t.getCenter(this.position),t.getSize(this.scale),this.scale.multiplyScalar(.5),super.updateMatrixWorld(e))}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};var Bc=class extends ke{constructor(e,t=1,i=16776960){let r=i,n=[1,-1,0,-1,1,0,-1,-1,0,1,1,0,-1,1,0,-1,-1,0,1,-1,0,1,1,0],s=new L;s.setAttribute("position",new R(n,3)),s.computeBoundingSphere(),super(s,new re({color:r,toneMapped:!1})),this.type="PlaneHelper",this.plane=e,this.size=t;let o=[1,1,0,-1,1,0,-1,-1,0,1,1,0,-1,-1,0,1,-1,0],a=new L;a.setAttribute("position",new R(o,3)),a.computeBoundingSphere(),this.add(new ae(a,new Se({color:r,opacity:.2,transparent:!0,depthWrite:!1,toneMapped:!1})))}updateMatrixWorld(e){this.position.set(0,0,0),this.scale.set(.5*this.size,.5*this.size,1),this.lookAt(this.plane.normal),this.translateZ(-this.plane.constant),super.updateMatrixWorld(e)}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose(),this.children[0].geometry.dispose(),this.children[0].material.dispose()}};var Yd=new y,Oc,Tu,Fc=class extends G{constructor(e=new y(0,0,1),t=new y(0,0,0),i=1,r=16776960,n=i*.2,s=n*.2){super(),this.type="ArrowHelper",Oc===void 0&&(Oc=new L,Oc.setAttribute("position",new R([0,0,0,0,1,0],3)),Tu=new Ss(.5,1,5,1),Tu.translate(0,-.5,0)),this.position.copy(t),this.line=new ke(Oc,new re({color:r,toneMapped:!1})),this.line.matrixAutoUpdate=!1,this.add(this.line),this.cone=new ae(Tu,new Se({color:r,toneMapped:!1})),this.cone.matrixAutoUpdate=!1,this.add(this.cone),this.setDirection(e),this.setLength(i,n,s)}setDirection(e){if(e.y>.99999)this.quaternion.set(0,0,0,1);else if(e.y<-.99999)this.quaternion.set(1,0,0,0);else{Yd.set(e.z,0,-e.x).normalize();let t=Math.acos(e.y);this.quaternion.setFromAxisAngle(Yd,t)}}setLength(e,t=e*.2,i=t*.2){this.line.scale.set(1,Math.max(1e-4,e-t),1),this.line.updateMatrix(),this.cone.scale.set(i,t,i),this.cone.position.y=e,this.cone.updateMatrix()}setColor(e){this.line.material.color.set(e),this.cone.material.color.set(e)}copy(e){return super.copy(e,!1),this.line.copy(e.line),this.cone.copy(e.cone),this}dispose(){super.dispose(),this.line.geometry.dispose(),this.line.material.dispose(),this.cone.geometry.dispose(),this.cone.material.dispose()}};var Uc=class extends Me{constructor(e=1){let t=[0,0,0,e,0,0,0,0,0,0,e,0,0,0,0,0,0,e],i=[1,0,0,1,.6,0,0,1,0,.6,1,0,0,0,1,0,.6,1],r=new L;r.setAttribute("position",new R(t,3)),r.setAttribute("color",new R(i,3));let n=new re({vertexColors:!0,toneMapped:!1});super(r,n),this.type="AxesHelper"}setColors(e,t,i){let r=new I,n=this.geometry.attributes.color.array;return r.set(e),r.toArray(n,0),r.toArray(n,3),r.set(t),r.toArray(n,6),r.toArray(n,9),r.set(i),r.toArray(n,12),r.toArray(n,15),this.geometry.attributes.color.needsUpdate=!0,this}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};var zc=class{constructor(){this.type="ShapePath",this.color=new I,this.subPaths=[],this.currentPath=null,this.userData={}}moveTo(e,t){return this.currentPath=new pi,this.subPaths.push(this.currentPath),this.currentPath.moveTo(e,t),this}lineTo(e,t){return this.currentPath.lineTo(e,t),this}quadraticCurveTo(e,t,i,r){return this.currentPath.quadraticCurveTo(e,t,i,r),this}bezierCurveTo(e,t,i,r,n,s){return this.currentPath.bezierCurveTo(e,t,i,r,n,s),this}splineThru(e){return this.currentPath.splineThru(e),this}toShapes(){function e(a,c){let h=!1,u=c.length;for(let f=0,d=u-1;f<u;d=f++){let p=c[f],m=c[d];p.y>a.y!=m.y>a.y&&a.x<(m.x-p.x)*(a.y-p.y)/(m.y-p.y)+p.x&&(h=!h)}return h}function t(a,c){let h=c.getCenter(new T);if(e(h,a))return h;let u=h.y,f=[],d=a.length;for(let p=0;p<d;p++){let m=a[p],g=a[(p+1)%d];if(m.y>u!=g.y>u){let _=m.x+(u-m.y)*(g.x-m.x)/(g.y-m.y);f.push(_)}}return f.length>1&&(f.sort((p,m)=>p-m),h.x=(f[0]+f[1])/2),h}let i=this.userData.style&&this.userData.style.fillRule||"nonzero";i!=="nonzero"&&i!=="evenodd"&&(B('Fill-rule "'+i+'" is not supported, falling back to "nonzero".'),i="nonzero");let r=i==="nonzero"?a=>a!==0:a=>(a&1)!==0,n=[];for(let a of this.subPaths){let c=a.getPoints();if(c.length<3)continue;let h=ft.area(c);if(h===0)continue;let u=new no;for(let f=0;f<c.length;f++)u.expandByPoint(c[f]);n.push({subPath:a,points:c,boundingBox:u,interiorPoint:t(c,u),absArea:Math.abs(h),winding:h<0?-1:1,container:null,exclude:!1,role:null})}n.sort((a,c)=>c.absArea-a.absArea);for(let a=0;a<n.length;a++){let c=n[a],h=0;for(let u=a-1;u>=0;u--){let f=n[u];if(f.boundingBox.containsBox(c.boundingBox)&&e(c.interiorPoint,f.points)){c.container=f.exclude?f.container:f,h=f.winding,c.winding+=h;break}}r(c.winding)===r(h)&&(c.exclude=!0)}for(let a of n)a.exclude||(a.role=a.container===null||a.container.role==="hole"?"outer":"hole");let s=[],o=new Map;for(let a of n){if(a.exclude||a.role!=="outer")continue;let c=new Ht;c.curves=a.subPath.curves,s.push(c),o.set(a,c)}for(let a of n){if(a.exclude||a.role!=="hole")continue;let c=o.get(a.container);if(!c)continue;let h=new pi;h.curves=a.subPath.curves,c.holes.push(h)}return s}};var kc=class extends Ie{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}};function Yy(l,e){let t=l.image&&l.image.width?l.image.width/l.image.height:1;return t>e?(l.repeat.x=1,l.repeat.y=t/e,l.offset.x=0,l.offset.y=(1-l.repeat.y)/2):(l.repeat.x=e/t,l.repeat.y=1,l.offset.x=(1-l.repeat.x)/2,l.offset.y=0),l}function Zy(l,e){let t=l.image&&l.image.width?l.image.width/l.image.height:1;return t>e?(l.repeat.x=e/t,l.repeat.y=1,l.offset.x=(1-l.repeat.x)/2,l.offset.y=0):(l.repeat.x=1,l.repeat.y=t/e,l.offset.x=0,l.offset.y=(1-l.repeat.y)/2),l}function Jy(l){return l.repeat.x=1,l.repeat.y=1,l.offset.x=0,l.offset.y=0,l}function Ky(l,e,t,i){let r=jy(i);switch(t){case wo:return l*e;case Mr:return l*e/r.components*r.byteLength;case wr:return l*e/r.components*r.byteLength;case Co:return l*e*2/r.components*r.byteLength;case Eo:return l*e*2/r.components*r.byteLength;case Ao:return l*e*3/r.components*r.byteLength;case je:return l*e*4/r.components*r.byteLength;case Io:return l*e*4/r.components*r.byteLength;case Ar:case Tr:return Math.floor((l+3)/4)*Math.floor((e+3)/4)*8;case Cr:case Er:return Math.floor((l+3)/4)*Math.floor((e+3)/4)*16;case pn:case gn:return Math.max(l,16)*Math.max(e,8)/4;case dn:case mn:return Math.max(l,8)*Math.max(e,8)/2;case _n:case xn:case vn:case bn:return Math.floor((l+3)/4)*Math.floor((e+3)/4)*8;case yn:case Sn:case Mn:return Math.floor((l+3)/4)*Math.floor((e+3)/4)*16;case wn:return Math.floor((l+3)/4)*Math.floor((e+3)/4)*16;case An:return Math.floor((l+4)/5)*Math.floor((e+3)/4)*16;case Tn:return Math.floor((l+4)/5)*Math.floor((e+4)/5)*16;case Cn:return Math.floor((l+5)/6)*Math.floor((e+4)/5)*16;case En:return Math.floor((l+5)/6)*Math.floor((e+5)/6)*16;case In:return Math.floor((l+7)/8)*Math.floor((e+4)/5)*16;case Rn:return Math.floor((l+7)/8)*Math.floor((e+5)/6)*16;case Pn:return Math.floor((l+7)/8)*Math.floor((e+7)/8)*16;case Ln:return Math.floor((l+9)/10)*Math.floor((e+4)/5)*16;case Nn:return Math.floor((l+9)/10)*Math.floor((e+5)/6)*16;case Dn:return Math.floor((l+9)/10)*Math.floor((e+7)/8)*16;case Bn:return Math.floor((l+9)/10)*Math.floor((e+9)/10)*16;case On:return Math.floor((l+11)/12)*Math.floor((e+9)/10)*16;case Fn:return Math.floor((l+11)/12)*Math.floor((e+11)/12)*16;case Un:case zn:case kn:return Math.ceil(l/4)*Math.ceil(e/4)*16;case Vn:case Gn:return Math.ceil(l/4)*Math.ceil(e/4)*8;case Hn:case Wn:return Math.ceil(l/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function jy(l){switch(l){case Zt:case go:return{byteLength:1,components:1};case xo:case _o:case Sr:return{byteLength:2,components:1};case vo:case bo:return{byteLength:2,components:4};case Jt:case yo:case gt:return{byteLength:4,components:1};case So:case Mo:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${l}.`)}var Vc=class{static contain(e,t){return Yy(e,t)}static cover(e,t){return Zy(e,t)}static fill(e){return Jy(e)}static getByteLength(e,t,i,r){return Ky(e,t,i,r)}};typeof window<"u"&&(window.__THREE__?B("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=oh);var Zd=`
#ifdef USE_ALPHAHASH

	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;

#endif
`;var Jd=`
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
`;var Kd=`
#ifdef USE_ALPHAMAP

	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;

#endif
`;var jd=`
#ifdef USE_ALPHAMAP

	uniform sampler2D alphaMap;

#endif
`;var $d=`
#ifdef USE_ALPHATEST

	#ifdef ALPHA_TO_COVERAGE

	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;

	#else

	if ( diffuseColor.a < alphaTest ) discard;

	#endif

#endif
`;var Qd=`
#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif
`;var ep=`
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
`;var tp=`
#ifdef USE_AOMAP

	uniform sampler2D aoMap;
	uniform float aoMapIntensity;

#endif
`;var ip=`
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
`;var rp=`
#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif
`;var np=`
vec3 transformed = vec3( position );

#ifdef USE_ALPHAHASH

	vPosition = vec3( position );

#endif
`;var sp=`
vec3 objectNormal = vec3( normal );

#ifdef USE_TANGENT

	vec3 objectTangent = vec3( tangent.xyz );

#endif
`;var op=`

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

`;var ap=`

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

`;var lp=`
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
`;var cp=`
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
`;var hp=`
#if NUM_CLIPPING_PLANES > 0

	varying vec3 vClipPosition;

	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];

#endif
`;var up=`
#if NUM_CLIPPING_PLANES > 0

	varying vec3 vClipPosition;

#endif
`;var fp=`
#if NUM_CLIPPING_PLANES > 0

	vClipPosition = - mvPosition.xyz;

#endif
`;var dp=`
#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )

	diffuseColor *= vColor;

#endif
`;var pp=`
#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )

	varying vec4 vColor;

#endif
`;var mp=`
#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )

	varying vec4 vColor;

#endif
`;var gp=`
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
`;var _p=`
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
`;var xp=`
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
`;var yp=`

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
`;var vp=`
#ifdef USE_DISPLACEMENTMAP

	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;

#endif
`;var bp=`
#ifdef USE_DISPLACEMENTMAP

	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );

#endif
`;var Sp=`
#ifdef USE_EMISSIVEMAP

	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );

	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE

		// use inline sRGB decode until browsers properly support SRGB8_ALPHA8 with video textures (#26516)

		emissiveColor = sRGBTransferEOTF( emissiveColor );

	#endif

	totalEmissiveRadiance *= emissiveColor.rgb;

#endif
`;var Mp=`
#ifdef USE_EMISSIVEMAP

	uniform sampler2D emissiveMap;

#endif
`;var wp=`
gl_FragColor = linearToOutputTexel( gl_FragColor );
`;var Ap=`

vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}

vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}

vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}

`;var Tp=`
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
`;var Cp=`
#ifdef USE_ENVMAP

	uniform float envMapIntensity;
	uniform mat3 envMapRotation;

	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif

#endif
`;var Ep=`
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
`;var Ip=`
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
`;var Rp=`
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
`;var Pp=`
#ifdef USE_FOG

	vFogDepth = - mvPosition.z;

#endif
`;var Lp=`
#ifdef USE_FOG

	varying float vFogDepth;

#endif
`;var Np=`
#ifdef USE_FOG

	#ifdef FOG_EXP2

		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );

	#else

		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );

	#endif

	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );

#endif
`;var Dp=`
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
`;var Bp=`

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
`;var Op=`
#ifdef USE_LIGHTMAP

	uniform sampler2D lightMap;
	uniform float lightMapIntensity;

#endif
`;var Fp=`
LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;
`;var Up=`
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
`;var zp=`
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
`;var kp=`
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
`;var Vp=`
ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;
`;var Gp=`
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
`;var Hp=`
BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;
`;var Wp=`
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
`;var qp=`
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
`;var Xp=`

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
`;var Yp=`
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
`;var Zp=`
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
`;var Jp=`
#if defined( RE_IndirectDiffuse )

	#if defined( LAMBERT ) || defined( PHONG )

		irradiance += iblIrradiance;

	#endif

	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );

#endif

#if defined( RE_IndirectSpecular )

	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );

#endif
`;var Kp=`
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
`;var jp=`
#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )

	// Doing a strict comparison with == 1.0 can cause noise artifacts
	// on some platforms. See issue #17623.
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;

#endif
`;var $p=`
#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )

	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;

#endif
`;var Qp=`
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER

	varying float vFragDepth;
	varying float vIsPerspective;

#endif
`;var em=`
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER

	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );

#endif
`;var tm=`
#ifdef USE_MAP

	vec4 sampledDiffuseColor = texture2D( map, vMapUv );

	#ifdef DECODE_VIDEO_TEXTURE

		// use inline sRGB decode until browsers properly support SRGB8_ALPHA8 with video textures (#26516)

		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );

	#endif

	diffuseColor *= sampledDiffuseColor;

#endif
`;var im=`
#ifdef USE_MAP

	uniform sampler2D map;

#endif
`;var rm=`
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
`;var nm=`
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
`;var sm=`
float metalnessFactor = metalness;

#ifdef USE_METALNESSMAP

	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );

	// reads channel B, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
	metalnessFactor *= texelMetalness.b;

#endif
`;var om=`
#ifdef USE_METALNESSMAP

	uniform sampler2D metalnessMap;

#endif
`;var am=`
#ifdef USE_INSTANCING_MORPH

	float morphTargetInfluences[ MORPHTARGETS_COUNT ];

	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;

	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {

		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;

	}
#endif
`;var lm=`
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
`;var cm=`
#ifdef USE_MORPHNORMALS

	// morphTargetBaseInfluence is set based on BufferGeometry.morphTargetsRelative value:
	// When morphTargetsRelative is false, this is set to 1 - sum(influences); this results in normal = sum((target - base) * influence)
	// When morphTargetsRelative is true, this is set to 1; as a result, all morph targets are simply added to the base after weighting
	objectNormal *= morphTargetBaseInfluence;

	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {

		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];

	}

#endif
`;var hm=`
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
`;var um=`
#ifdef USE_MORPHTARGETS

	// morphTargetBaseInfluence is set based on BufferGeometry.morphTargetsRelative value:
	// When morphTargetsRelative is false, this is set to 1 - sum(influences); this results in position = sum((target - base) * influence)
	// When morphTargetsRelative is true, this is set to 1; as a result, all morph targets are simply added to the base after weighting
	transformed *= morphTargetBaseInfluence;

	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {

		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];

	}

#endif
`;var fm=`
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

`;var dm=`

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
`;var pm=`
#ifndef FLAT_SHADED

	varying vec3 vNormal;

	#ifdef USE_TANGENT

		varying vec3 vTangent;
		varying vec3 vBitangent;

	#endif

#endif
`;var mm=`
#ifndef FLAT_SHADED

	varying vec3 vNormal;

	#ifdef USE_TANGENT

		varying vec3 vTangent;
		varying vec3 vBitangent;

	#endif

#endif
`;var gm=`
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
`;var _m=`
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
`;var xm=`
#ifdef USE_CLEARCOAT

	vec3 clearcoatNormal = nonPerturbedNormal;

#endif
`;var ym=`
#ifdef USE_CLEARCOAT_NORMALMAP

	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;

	clearcoatNormal = normalize( tbn2 * clearcoatMapN );

#endif
`;var vm=`

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
`;var bm=`

#ifdef USE_IRIDESCENCEMAP

	uniform sampler2D iridescenceMap;

#endif

#ifdef USE_IRIDESCENCE_THICKNESSMAP

	uniform sampler2D iridescenceThicknessMap;

#endif
`;var Sm=`
#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif

#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif

gl_FragColor = vec4( outgoingLight, diffuseColor.a );
`;var Mm=`
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
`;var wm=`
#ifdef PREMULTIPLIED_ALPHA

	gl_FragColor.rgb *= gl_FragColor.a;

#endif
`;var Am=`
vec4 mvPosition = vec4( transformed, 1.0 );

#ifdef USE_BATCHING

	mvPosition = batchingMatrix * mvPosition;

#endif

#ifdef USE_INSTANCING

	mvPosition = instanceMatrix * mvPosition;

#endif

mvPosition = modelViewMatrix * mvPosition;

gl_Position = projectionMatrix * mvPosition;
`;var Tm=`
#ifdef DITHERING

	gl_FragColor.rgb = dithering( gl_FragColor.rgb );

#endif
`;var Cm=`
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
`;var Em=`
float roughnessFactor = roughness;

#ifdef USE_ROUGHNESSMAP

	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );

	// reads channel G, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
	roughnessFactor *= texelRoughness.g;

#endif
`;var Im=`
#ifdef USE_ROUGHNESSMAP

	uniform sampler2D roughnessMap;

#endif
`;var Rm=`
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
`;var Pm=`

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
`;var Lm=`

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


`;var Nm=`
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
`;var Dm=`
#ifdef USE_SKINNING

	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );

#endif
`;var Bm=`
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
`;var Om=`
#ifdef USE_SKINNING

	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );

	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;

	transformed = ( bindMatrixInverse * skinned ).xyz;

#endif
`;var Fm=`
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
`;var Um=`
float specularStrength;

#ifdef USE_SPECULARMAP

	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;

#else

	specularStrength = 1.0;

#endif
`;var zm=`
#ifdef USE_SPECULARMAP

	uniform sampler2D specularMap;

#endif
`;var km=`
#if defined( TONE_MAPPING )

	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );

#endif
`;var Vm=`
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
`;var Gm=`
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
`;var Hm=`
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
`;var Wm=`
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
`;var qm=`
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
`;var Xm=`
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
`;var Ym=`
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
`;var Zm=`
varying vec2 vUv;
uniform mat3 uvTransform;

void main() {

	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;

	gl_Position = vec4( position.xy, 1.0, 1.0 );

}
`,Jm=`
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
`;var Km=`
varying vec3 vWorldDirection;

#include <common>

void main() {

	vWorldDirection = transformDirection( position, modelMatrix );

	#include <begin_vertex>
	#include <project_vertex>

	gl_Position.z = gl_Position.w; // set z to camera.far

}
`,jm=`

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
`;var $m=`
varying vec3 vWorldDirection;

#include <common>

void main() {

	vWorldDirection = transformDirection( position, modelMatrix );

	#include <begin_vertex>
	#include <project_vertex>

	gl_Position.z = gl_Position.w; // set z to camera.far

}
`,Qm=`
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
`;var eg=`
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
`,tg=`
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
`;var ig=`
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
`,rg=`
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
`;var ng=`
varying vec3 vWorldDirection;

#include <common>

void main() {

	vWorldDirection = transformDirection( position, modelMatrix );

	#include <begin_vertex>
	#include <project_vertex>

}
`,sg=`
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
`;var og=`
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
`,ag=`
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
`;var lg=`
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
`,cg=`
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
`;var hg=`
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
`,ug=`
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
`;var fg=`
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
`,dg=`
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
`;var pg=`
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
`,mg=`
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
`;var gg=`
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
`,_g=`
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
`;var xg=`
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
`,yg=`
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
`;var vg=`
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
`,bg=`
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
`;var Sg=`
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
`,Mg=`
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
`;var wg=`
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
`,Ag=`
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
`;var Tg=`
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
`,Cg=`
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
`;var Q={alphahash_fragment:Zd,alphahash_pars_fragment:Jd,alphamap_fragment:Kd,alphamap_pars_fragment:jd,alphatest_fragment:$d,alphatest_pars_fragment:Qd,aomap_fragment:ep,aomap_pars_fragment:tp,batching_pars_vertex:ip,batching_vertex:rp,begin_vertex:np,beginnormal_vertex:sp,bsdfs:op,iridescence_fragment:ap,bumpmap_pars_fragment:lp,clipping_planes_fragment:cp,clipping_planes_pars_fragment:hp,clipping_planes_pars_vertex:up,clipping_planes_vertex:fp,color_fragment:dp,color_pars_fragment:pp,color_pars_vertex:mp,color_vertex:gp,common:_p,cube_uv_reflection_fragment:xp,defaultnormal_vertex:yp,displacementmap_pars_vertex:vp,displacementmap_vertex:bp,emissivemap_fragment:Sp,emissivemap_pars_fragment:Mp,colorspace_fragment:wp,colorspace_pars_fragment:Ap,envmap_fragment:Tp,envmap_common_pars_fragment:Cp,envmap_pars_fragment:Ep,envmap_pars_vertex:Ip,envmap_physical_pars_fragment:kp,envmap_vertex:Rp,fog_vertex:Pp,fog_pars_vertex:Lp,fog_fragment:Np,fog_pars_fragment:Dp,gradientmap_pars_fragment:Bp,lightmap_pars_fragment:Op,lights_lambert_fragment:Fp,lights_lambert_pars_fragment:Up,lights_pars_begin:zp,lights_toon_fragment:Vp,lights_toon_pars_fragment:Gp,lights_phong_fragment:Hp,lights_phong_pars_fragment:Wp,lights_physical_fragment:qp,lights_physical_pars_fragment:Xp,lights_fragment_begin:Yp,lights_fragment_maps:Zp,lights_fragment_end:Jp,lightprobes_pars_fragment:Kp,logdepthbuf_fragment:jp,logdepthbuf_pars_fragment:$p,logdepthbuf_pars_vertex:Qp,logdepthbuf_vertex:em,map_fragment:tm,map_pars_fragment:im,map_particle_fragment:rm,map_particle_pars_fragment:nm,metalnessmap_fragment:sm,metalnessmap_pars_fragment:om,morphinstance_vertex:am,morphcolor_vertex:lm,morphnormal_vertex:cm,morphtarget_pars_vertex:hm,morphtarget_vertex:um,normal_fragment_begin:fm,normal_fragment_maps:dm,normal_pars_fragment:pm,normal_pars_vertex:mm,normal_vertex:gm,normalmap_pars_fragment:_m,clearcoat_normal_fragment_begin:xm,clearcoat_normal_fragment_maps:ym,clearcoat_pars_fragment:vm,iridescence_pars_fragment:bm,opaque_fragment:Sm,packing:Mm,premultiplied_alpha_fragment:wm,project_vertex:Am,dithering_fragment:Tm,dithering_pars_fragment:Cm,roughnessmap_fragment:Em,roughnessmap_pars_fragment:Im,shadowmap_pars_fragment:Rm,shadowmap_pars_vertex:Pm,shadowmap_vertex:Lm,shadowmask_pars_fragment:Nm,skinbase_vertex:Dm,skinning_pars_vertex:Bm,skinning_vertex:Om,skinnormal_vertex:Fm,specularmap_fragment:Um,specularmap_pars_fragment:zm,tonemapping_fragment:km,tonemapping_pars_fragment:Vm,transmission_fragment:Gm,transmission_pars_fragment:Hm,uv_pars_fragment:Wm,uv_pars_vertex:qm,uv_vertex:Xm,worldpos_vertex:Ym,background_vert:Zm,background_frag:Jm,backgroundCube_vert:Km,backgroundCube_frag:jm,cube_vert:$m,cube_frag:Qm,depth_vert:eg,depth_frag:tg,distance_vert:ig,distance_frag:rg,equirect_vert:ng,equirect_frag:sg,linedashed_vert:og,linedashed_frag:ag,meshbasic_vert:lg,meshbasic_frag:cg,meshlambert_vert:hg,meshlambert_frag:ug,meshmatcap_vert:fg,meshmatcap_frag:dg,meshnormal_vert:pg,meshnormal_frag:mg,meshphong_vert:gg,meshphong_frag:_g,meshphysical_vert:xg,meshphysical_frag:yg,meshtoon_vert:vg,meshtoon_frag:bg,points_vert:Sg,points_frag:Mg,shadow_vert:wg,shadow_frag:Ag,sprite_vert:Tg,sprite_frag:Cg};var O={common:{diffuse:{value:new I(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Y},alphaMap:{value:null},alphaMapTransform:{value:new Y},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Y}},envmap:{envMap:{value:null},envMapRotation:{value:new Y},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Y}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Y}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Y},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Y},normalScale:{value:new T(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Y},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Y}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Y}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Y}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new I(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new y},probesMax:{value:new y},probesResolution:{value:new y}},points:{diffuse:{value:new I(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Y},alphaTest:{value:0},uvTransform:{value:new Y}},sprite:{diffuse:{value:new I(16777215)},opacity:{value:1},center:{value:new T(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Y},alphaMap:{value:null},alphaMapTransform:{value:new Y},alphaTest:{value:0}}};var Gc={basic:{uniforms:nt([O.common,O.specularmap,O.envmap,O.aomap,O.lightmap,O.fog]),vertexShader:Q.meshbasic_vert,fragmentShader:Q.meshbasic_frag},lambert:{uniforms:nt([O.common,O.specularmap,O.envmap,O.aomap,O.lightmap,O.emissivemap,O.bumpmap,O.normalmap,O.displacementmap,O.fog,O.lights,{emissive:{value:new I(0)},envMapIntensity:{value:1}}]),vertexShader:Q.meshlambert_vert,fragmentShader:Q.meshlambert_frag},phong:{uniforms:nt([O.common,O.specularmap,O.envmap,O.aomap,O.lightmap,O.emissivemap,O.bumpmap,O.normalmap,O.displacementmap,O.fog,O.lights,{emissive:{value:new I(0)},specular:{value:new I(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Q.meshphong_vert,fragmentShader:Q.meshphong_frag},standard:{uniforms:nt([O.common,O.envmap,O.aomap,O.lightmap,O.emissivemap,O.bumpmap,O.normalmap,O.displacementmap,O.roughnessmap,O.metalnessmap,O.fog,O.lights,{emissive:{value:new I(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Q.meshphysical_vert,fragmentShader:Q.meshphysical_frag},toon:{uniforms:nt([O.common,O.aomap,O.lightmap,O.emissivemap,O.bumpmap,O.normalmap,O.displacementmap,O.gradientmap,O.fog,O.lights,{emissive:{value:new I(0)}}]),vertexShader:Q.meshtoon_vert,fragmentShader:Q.meshtoon_frag},matcap:{uniforms:nt([O.common,O.bumpmap,O.normalmap,O.displacementmap,O.fog,{matcap:{value:null}}]),vertexShader:Q.meshmatcap_vert,fragmentShader:Q.meshmatcap_frag},points:{uniforms:nt([O.points,O.fog]),vertexShader:Q.points_vert,fragmentShader:Q.points_frag},dashed:{uniforms:nt([O.common,O.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Q.linedashed_vert,fragmentShader:Q.linedashed_frag},depth:{uniforms:nt([O.common,O.displacementmap]),vertexShader:Q.depth_vert,fragmentShader:Q.depth_frag},normal:{uniforms:nt([O.common,O.bumpmap,O.normalmap,O.displacementmap,{opacity:{value:1}}]),vertexShader:Q.meshnormal_vert,fragmentShader:Q.meshnormal_frag},sprite:{uniforms:nt([O.sprite,O.fog]),vertexShader:Q.sprite_vert,fragmentShader:Q.sprite_frag},background:{uniforms:{uvTransform:{value:new Y},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Q.background_vert,fragmentShader:Q.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Y}},vertexShader:Q.backgroundCube_vert,fragmentShader:Q.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Q.cube_vert,fragmentShader:Q.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Q.equirect_vert,fragmentShader:Q.equirect_frag},distance:{uniforms:nt([O.common,O.displacementmap,{referencePosition:{value:new y},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Q.distance_vert,fragmentShader:Q.distance_frag},shadow:{uniforms:nt([O.lights,O.fog,{color:{value:new I(0)},opacity:{value:1}}]),vertexShader:Q.shadow_vert,fragmentShader:Q.shadow_frag}};Gc.physical={uniforms:nt([Gc.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Y},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Y},clearcoatNormalScale:{value:new T(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Y},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Y},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Y},sheen:{value:0},sheenColor:{value:new I(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Y},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Y},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Y},transmissionSamplerSize:{value:new T},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Y},attenuationDistance:{value:0},attenuationColor:{value:new I(0)},specularColor:{value:new I(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Y},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Y},anisotropyVector:{value:new T},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Y}}]),vertexShader:Q.meshphysical_vert,fragmentShader:Q.meshphysical_frag};var lo=4,mv=6,gv=20,_v=256,sa=new qt,Eg=new I,Cu=null,Eu=0,Iu=0,Ru=!1,xv=new y,sn=new y,Hc=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,i=.1,r=100,n={}){let{size:s=256,position:o=xv}=n;Cu=this._renderer.getRenderTarget(),Eu=this._renderer.getActiveCubeFace(),Iu=this._renderer.getActiveMipmapLevel(),Ru=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(s);let a=this._allocateTargets();return a.depthBuffer=!0,this._sceneToCubeUV(e,i,r,a,o),t>0&&this._blur(a,0,0,t),this._applyPMREM(a),this._cleanup(a),a}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Pg(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Rg(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Cu,Eu,Iu),this._renderer.xr.enabled=Ru,e.scissorTest=!1,ao(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Ft||e.mapping===fn?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Cu=this._renderer.getRenderTarget(),Eu=this._renderer.getActiveCubeFace(),Iu=this._renderer.getActiveMipmapLevel(),Ru=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:de,minFilter:de,generateMipmaps:!1,type:Sr,format:je,colorSpace:$e,depthBuffer:!1},r=Ig(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Ig(e,t,i);let{_lodMax:n}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=yv(n)),this._blurMaterial=bv(n,e,t),this._ggxMaterial=vv(n,e,t)}return r}_compileMaterial(e){let t=new ae(new L,e);this._renderer.compile(t,sa)}_sceneToCubeUV(e,t,i,r,n){let a=new ge(90,1,t,i),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],u=this._renderer,f=u.autoClear,d=u.toneMapping;u.getClearColor(Eg),u.toneMapping=un,u.autoClear=!1,u.state.buffers.depth.getReversed()&&(u.setRenderTarget(r),u.clearDepth(),u.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new ae(new nr,new Se({name:"PMREM.Background",side:wi,depthWrite:!1,depthTest:!1})));let m=this._backgroundBox,g=m.material,_=!1,x=e.background;x?x.isColor&&(g.color.copy(x),e.background=null,_=!0):(g.color.copy(Eg),_=!0);for(let v=0;v<6;v++){let b=v%3;b===0?(a.up.set(0,c[v],0),a.position.set(n.x,n.y,n.z),a.lookAt(n.x+h[v],n.y,n.z)):b===1?(a.up.set(0,0,c[v]),a.position.set(n.x,n.y,n.z),a.lookAt(n.x,n.y+h[v],n.z)):(a.up.set(0,c[v],0),a.position.set(n.x,n.y,n.z),a.lookAt(n.x,n.y,n.z+h[v]));let M=this._cubeSize;ao(r,b*M,v>2?M:0,M,M),u.setRenderTarget(r),_&&u.render(m,a),u.render(e,a)}u.toneMapping=d,u.autoClear=f,e.background=x}_textureToCubeUV(e,t){let i=this._renderer,r=e.mapping===Ft||e.mapping===fn;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Pg()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Rg());let n=r?this._cubemapMaterial:this._equirectMaterial,s=this._lodMeshes[0];s.material=n;let o=n.uniforms;o.envMap.value=e;let a=this._cubeSize;ao(t,0,0,3*a,2*a),i.setRenderTarget(t),i.render(s,sa)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let r=this._lodMeshes.length;for(let n=1;n<r;n++)this._applyGGXFilter(e,n-1,n);t.autoClear=i}_applyGGXFilter(e,t,i){let r=this._renderer,n=this._pingPongRenderTarget,s=this._ggxMaterial,o=this._lodMeshes[i];o.material=s;let a=s.uniforms,c=i/(this._lodMeshes.length-1),h=t/(this._lodMeshes.length-1),u=Math.sqrt(c*c-h*h),f=c*1.25,d=u*f,{_lodMax:p}=this,m=this._sizeLods[i],g=3*m*(i>p-lo?i-p+lo:0),_=4*(this._cubeSize-m);a.envMap.value=e.texture,a.roughness.value=d,a.mipInt.value=p-t,ao(n,g,_,3*m,2*m),r.setRenderTarget(n),r.render(o,sa),a.envMap.value=n.texture,a.roughness.value=0,a.mipInt.value=p-i,ao(e,g,_,3*m,2*m),r.setRenderTarget(e),r.render(o,sa)}_blur(e,t,i,r){let n=this._pingPongRenderTarget,s=Math.min(r,Math.PI)/Math.SQRT2;this._blurPass(e,n,t,i,s),this._blurPass(n,e,i,i,s)}_blurPass(e,t,i,r,n){let s=this._renderer,o=this._blurMaterial,a=this._lodMeshes[r];a.material=o;let c=o.uniforms;c.envMap.value=e.texture,c.sigma.value=n,c.mipInt.value=this._lodMax-i;let h=this._sizeLods[r],u=3*h*(r>this._lodMax-lo?r-this._lodMax+lo:0),f=4*(this._cubeSize-h);ao(t,u,f,3*h,2*h),s.setRenderTarget(t),s.render(a,sa)}};function yv(l){let e=[],t=[],i=l,r=l-lo+1+mv;for(let n=0;n<r;n++){let s=Math.pow(2,i);e.push(s);let o=1/(s-2),a=-o,c=1+o,h=[a,a,c,a,c,c,a,a,c,c,a,c],u=6,f=6,d=3,p=new Float32Array(d*f*u),m=new Float32Array(d*f*u);for(let _=0;_<u;_++){let x=_%3*2/3-1,v=_>2?0:-1,b=[x,v,0,x+2/3,v,0,x+2/3,v+1,0,x,v,0,x+2/3,v+1,0,x,v+1,0];p.set(b,d*f*_);for(let M=0;M<f;M++){let w=h[M*2]*2-1,S=h[M*2+1]*2-1;_===0?sn.set(1,S,w):_===1?sn.set(-w,1,-S):_===2?sn.set(-w,S,1):_===3?sn.set(-1,S,-w):_===4?sn.set(-w,-1,S):sn.set(w,S,-1),sn.toArray(m,(_*f+M)*d)}}let g=new L;g.setAttribute("position",new K(p,d)),g.setAttribute("outputDirection",new K(m,d)),t.push(new ae(g,null)),i>lo&&i--}return{lodMeshes:t,sizeLods:e}}function Ig(l,e,t){let i=new kt(l,e,t);return i.texture.mapping=po,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function ao(l,e,t,i,r){l.viewport.set(e,t,i,r),l.scissor.set(e,t,i,r)}function vv(l,e,t){return new dt({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:_v,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${l}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Wc(),fragmentShader:`

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
		`,blending:zi,depthTest:!1,depthWrite:!1})}function bv(l,e,t){return new dt({name:"SphericalGaussianBlur",defines:{SAMPLES:gv,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${l}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Wc(),fragmentShader:`

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
		`,blending:zi,depthTest:!1,depthWrite:!1})}function Rg(){return new dt({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Wc(),fragmentShader:`

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
		`,blending:zi,depthTest:!1,depthWrite:!1})}function Pg(){return new dt({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Wc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:zi,depthTest:!1,depthWrite:!1})}function Wc(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var qc=class extends kt{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new di(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new nr(5,5,5),n=new dt({name:"CubemapFromEquirect",uniforms:Es(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:wi,blending:zi});n.uniforms.tEquirect.value=t;let s=new ae(r,n),o=t.minFilter;return t.minFilter===Ut&&(t.minFilter=de),new Qs(1,10,this).update(e,s),t.minFilter=o,s.geometry.dispose(),s.material.dispose(),this}clear(e,t=!0,i=!0,r=!0){let n=e.getRenderTarget();for(let s=0;s<6;s++)e.setRenderTarget(this,s),e.clear(t,i,r);e.setRenderTarget(n)}};function Lg(l,e){function t(i,r=Pr){let n,s=Le.getTransfer(r);if(i===Zt)return l.UNSIGNED_BYTE;if(i===vo)return l.UNSIGNED_SHORT_4_4_4_4;if(i===bo)return l.UNSIGNED_SHORT_5_5_5_1;if(i===So)return l.UNSIGNED_INT_5_9_9_9_REV;if(i===Mo)return l.UNSIGNED_INT_10F_11F_11F_REV;if(i===go)return l.BYTE;if(i===_o)return l.SHORT;if(i===xo)return l.UNSIGNED_SHORT;if(i===yo)return l.INT;if(i===Jt)return l.UNSIGNED_INT;if(i===gt)return l.FLOAT;if(i===Sr)return l.HALF_FLOAT;if(i===wo)return l.ALPHA;if(i===Ao)return l.RGB;if(i===je)return l.RGBA;if(i===Vi)return l.DEPTH_COMPONENT;if(i===To)return l.DEPTH_STENCIL;if(i===Mr)return l.RED;if(i===wr)return l.RED_INTEGER;if(i===Co)return l.RG;if(i===Eo)return l.RG_INTEGER;if(i===Io)return l.RGBA_INTEGER;if(i===Ar||i===Tr||i===Cr||i===Er)if(s===be)if(n=e.get("WEBGL_compressed_texture_s3tc_srgb"),n!==null){if(i===Ar)return n.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===Tr)return n.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Cr)return n.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Er)return n.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(n=e.get("WEBGL_compressed_texture_s3tc"),n!==null){if(i===Ar)return n.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===Tr)return n.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Cr)return n.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Er)return n.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===dn||i===pn||i===mn||i===gn)if(n=e.get("WEBGL_compressed_texture_pvrtc"),n!==null){if(i===dn)return n.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===pn)return n.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===mn)return n.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===gn)return n.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===_n||i===xn||i===yn||i===vn||i===bn||i===Sn||i===Mn)if(n=e.get("WEBGL_compressed_texture_etc"),n!==null){if(i===_n||i===xn)return s===be?n.COMPRESSED_SRGB8_ETC2:n.COMPRESSED_RGB8_ETC2;if(i===yn)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:n.COMPRESSED_RGBA8_ETC2_EAC;if(i===vn)return n.COMPRESSED_R11_EAC;if(i===bn)return n.COMPRESSED_SIGNED_R11_EAC;if(i===Sn)return n.COMPRESSED_RG11_EAC;if(i===Mn)return n.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===wn||i===An||i===Tn||i===Cn||i===En||i===In||i===Rn||i===Pn||i===Ln||i===Nn||i===Dn||i===Bn||i===On||i===Fn)if(n=e.get("WEBGL_compressed_texture_astc"),n!==null){if(i===wn)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:n.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===An)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:n.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===Tn)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:n.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===Cn)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:n.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===En)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:n.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===In)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:n.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===Rn)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:n.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Pn)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:n.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Ln)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:n.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Nn)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:n.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Dn)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:n.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Bn)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:n.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===On)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:n.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Fn)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:n.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Un||i===zn||i===kn)if(n=e.get("EXT_texture_compression_bptc"),n!==null){if(i===Un)return s===be?n.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:n.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===zn)return n.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===kn)return n.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Vn||i===Gn||i===Hn||i===Wn)if(n=e.get("EXT_texture_compression_rgtc"),n!==null){if(i===Vn)return n.COMPRESSED_RED_RGTC1_EXT;if(i===Gn)return n.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Hn)return n.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Wn)return n.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===dh?l.UNSIGNED_INT_24_8:l[i]!==void 0?l[i]:null}return{convert:t}}var oa=class extends Error{constructor(e,t,i="1B"){super(`three.unsupported: ${e}${t?` (${t})`:""}${i==="1B"?"; native R1 does not provide this capability; use the 1B backend where available":""}`),this.name="ThreeCapabilityError",this.code="three.unsupported",this.feature=e,this.backend=i}};function N(l,e,t){throw new oa(l,e,t)}var Xc=class{constructor(){N("WebGPU","WebGPU/TSL compute is outside both the R1 and WebGL2 bundles","none")}};function ot(l,e){let t=new Error(`three.assetFailure: ${l}${e?`: ${e}`:""}`);return t.name="ThreeAssetError",t.code="three.assetFailure",t.url=l,t}function Ke(l,e){if(typeof l!="number"||!Number.isFinite(l))throw new Error(`three.invalid: ${e} must be finite`);return l}function Oi(l,e){if(!Number.isInteger(l)||l<0||l>4294967295)throw new Error(`three.invalid: ${e} is outside u32`);return l>>>0}var Ee=typeof globalThis<"u"?globalThis:{},aa="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",pr=null;function ha(l,e=!0){let t=String(l);if(e&&typeof TextEncoder<"u")return new TextEncoder().encode(t);let i=[];for(let r=0;r<t.length;r++){let n=t.charCodeAt(r);if(n>=55296&&n<=56319&&r+1<t.length){let s=t.charCodeAt(r+1);s>=56320&&s<=57343?(n=65536+(n-55296<<10)+s-56320,r++):n=65533}else n>=55296&&n<=57343&&(n=65533);n<128?i.push(n):n<2048?i.push(192|n>>6,128|n&63):n<65536?i.push(224|n>>12,128|n>>6&63,128|n&63):i.push(240|n>>18,128|n>>12&63,128|n>>6&63,128|n&63)}return new Uint8Array(i)}function Nu(l){let e="";for(let t=0;t<l.length;){let i=l[t++],r=i,n=0,s=0;if(i>=194&&i<=223)r=i&31,n=1,s=128;else if(i>=224&&i<=239)r=i&15,n=2,s=2048;else if(i>=240&&i<=244)r=i&7,n=3,s=65536;else if(i>=128){e+="\uFFFD";continue}if(t+n>l.length){e+="\uFFFD";break}let o=!0;for(let a=0;a<n;a++){let c=l[t++];if((c&192)!==128){o=!1,t--;break}r=r<<6|c&63}!o||r<s||r>1114111||r>=55296&&r<=57343?e+="\uFFFD":e+=String.fromCodePoint(r)}return e}function Sv(){typeof Ee.TextDecoder>"u"&&(Ee.TextDecoder=class{constructor(l="utf-8"){let e=String(l).toLowerCase().replace("_","-");if(e!=="utf-8"&&e!=="utf8")throw new RangeError(`three.invalid: unsupported TextDecoder label ${l}`)}decode(l){if(l===void 0)return"";if(!(l instanceof ArrayBuffer)&&!ArrayBuffer.isView(l))throw new TypeError("three.invalid: TextDecoder.decode expects an ArrayBuffer or view");return Nu(on(l))}}),typeof Ee.TextEncoder>"u"&&(Ee.TextEncoder=class{encode(l){return ha(l,!1)}})}function on(l){if(l instanceof Uint8Array)return new Uint8Array(l);if(l instanceof ArrayBuffer)return new Uint8Array(l.slice(0));if(ArrayBuffer.isView(l))return new Uint8Array(l.buffer.slice(l.byteOffset,l.byteOffset+l.byteLength));if(typeof l!="string")throw ot("<bytes>","expected base64 or a typed array");let e=l.replace(/\s/g,"");if(e.length%4===1||/[^A-Za-z0-9+/=_-]/.test(e))throw ot("<bytes>","invalid base64");let t=e.replace(/-/g,"+").replace(/_/g,"/"),i=[],r=0,n=0;for(let s=0;s<t.length;s++){let o=t[s];if(o==="=")break;let a=aa.indexOf(o);if(a<0)throw ot("<bytes>","invalid base64");r=r<<6|a,n+=6,n>=8&&(n-=8,i.push(r>>n&255))}return new Uint8Array(i)}function Mv(l){let e=on(l),t="";for(let i=0;i<e.length;i+=3){let r=e[i],n=i+1<e.length?e[i+1]:0,s=i+2<e.length?e[i+2]:0,o=r<<16|n<<8|s;t+=aa[o>>18&63]+aa[o>>12&63]+(i+1<e.length?aa[o>>6&63]:"=")+(i+2<e.length?aa[o&63]:"=")}return t}function Pu(l,e,t){let i=ha(l);if(i.length<1||i.length>t)throw new Error(`three.invalid: ${e} UTF-8 length must be 1..${t}`);return String(l)}function Ng(l){return l._listeners=new Map,l.addEventListener=function(e,t,i){if(!t)return;let r=this._listeners.get(e)||[],n=i===!0||!!(i&&i.capture);r.some(s=>s.callback===t&&s.capture===n)||(r.push({callback:t,capture:n,once:!!(i&&i.once)}),this._listeners.set(e,r),this._listenBacking&&this._listenBacking(e))},l.removeEventListener=function(e,t,i){let r=this._listeners.get(e);if(!r)return;let n=i===!0||!!(i&&i.capture);this._listeners.set(e,r.filter(s=>s.callback!==t||s.capture!==n))},l.dispatchEvent=function(e){if(typeof e=="string"&&(e={type:e}),!e||!e.type)throw new Error("three.invalid: event.type is required");e.preventDefault||(e.preventDefault=function(){this.defaultPrevented=!0}),e.stopPropagation||(e.stopPropagation=function(){this.cancelBubble=!0});try{e.target||(e.target=this)}catch{}try{e.currentTarget=this}catch{}let t=(this._listeners.get(e.type)||[]).slice();for(let i of t)i.once&&this.removeEventListener(e.type,i.callback,{capture:i.capture}),typeof i.callback=="function"?i.callback.call(this,e):i.callback&&typeof i.callback.handleEvent=="function"&&i.callback.handleEvent(e);return!e.defaultPrevented},l}var Lu=class{constructor(e){this.runtime=e,this.visibilityState="visible",this.hidden=!1,this.activeElement=null,this.documentElement={style:{}},this.defaultView={get devicePixelRatio(){return e.pixelRatio},get innerWidth(){return e.width},get innerHeight(){return e.height},location:{search:"",hash:"",href:"jsr://three/",origin:"null",pathname:"/",assign(){},replace(){},reload(){}},addEventListener:(t,i,r)=>this.addEventListener(t,i,r),removeEventListener:(t,i,r)=>this.removeEventListener(t,i,r),requestAnimationFrame:t=>e.requestAnimationFrame(t),cancelAnimationFrame:t=>e.cancelAnimationFrame(t)},Ng(this)}hasFocus(){return this.activeElement!==null}_setVisibility(e){this.hidden=!!e,this.visibilityState=e?"hidden":"visible",this.dispatchEvent({type:"visibilitychange"})}},la=class{constructor(e,t,i,r={}){this.runtime=e,this.canvasId=t,this.engineId=e.engineId,this.generation=i,this.surfaceId=r.surfaceId||`${t}#${i}`,Pu(this.surfaceId,"surfaceId",128),this.isJsrThreeCanvas=!0,this.style={},this._pixelRatio=r.pixelRatio||e.pixelRatio,this._cssWidth=r.width||300,this._cssHeight=r.height||150,this._width=Math.max(0,Math.floor(this._cssWidth*this._pixelRatio)),this._height=Math.max(0,Math.floor(this._cssHeight*this._pixelRatio)),this._captured=new Set,this._disposed=!1,this._mounted=!1,this._assetEpoch=0,this._focused=!1,this.ownerDocument=e.document,this.tabIndex=0,this._backing=null,this._backingListeners=new Map,Ng(this),e.web&&this._createBacking(r)}_createBacking(e){let t=e.canvas||e.offscreenCanvas;t?this._backing=t:typeof OffscreenCanvas<"u"?this._backing=new OffscreenCanvas(this._width,this._height):typeof document<"u"&&document.createElement?(this._backing=document.createElement("canvas"),this._backing.width=this._width,this._backing.height=this._height):N("webgl2","OffscreenCanvas or a canvas element is required"),this._backing.style&&(this.style=this._backing.style),this._backing.ownerDocument&&(this.ownerDocument=this._backing.ownerDocument),this._backing.width=this._width,this._backing.height=this._height}_listenBacking(e){if(!this._backing||this._backingListeners.has(e)||!this._backing.addEventListener)return;let t=i=>this.dispatchEvent(i);this._backingListeners.set(e,t),this._backing.addEventListener(e,t)}get width(){return this._width}set width(e){this._setPhysicalSize(e,this._height)}get height(){return this._height}set height(e){this._setPhysicalSize(this._width,e)}get clientWidth(){return this._cssWidth}get clientHeight(){return this._cssHeight}get pixelRatio(){return this._pixelRatio}get devicePixelRatio(){return this._pixelRatio}get disposed(){return this._disposed}get mounted(){return this._mounted}get context(){return this._context||null}_setPhysicalSize(e,t){if(!Number.isFinite(e)||!Number.isFinite(t)||e<0||t<0)throw new Error("three.invalid: canvas dimensions must be non-negative finite numbers");this._width=Math.floor(e),this._height=Math.floor(t),this._cssWidth=this._width/this._pixelRatio,this._cssHeight=this._height/this._pixelRatio,this._backing&&(this._backing.width=this._width,this._backing.height=this._height)}_setSize(e,t,i,r){if(!Number.isFinite(e)||!Number.isFinite(t)||e<0||t<0||e>16384||t>16384)throw new Error("three.invalid: canvas size must be within 0..16384");if(!Number.isFinite(i)||i<=0||i>16)throw new Error("three.invalid: pixel ratio must be within (0,16]");if(this._cssWidth=e,this._cssHeight=t,this._pixelRatio=i,this._width=Math.floor(e*i),this._height=Math.floor(t*i),this._width>16384||this._height>16384)throw new Error("three.invalid: drawing buffer exceeds 16384 pixels");this._backing&&(this._backing.width=this._width,this._backing.height=this._height),r!==!1&&(this.style.width=`${e}px`,this.style.height=`${t}px`)}setPixelRatio(e){this._setSize(this._cssWidth,this._cssHeight,e,!1)}setSize(e,t,i=!0){this._setSize(e,t,this._pixelRatio,i)}getContext(e,t){if(this._disposed)throw new Error("three.surface: canvas is disposed");this.runtime.web||N("rawWebGL",`canvas.getContext(${e}) requires the 1B backend`),e!=="webgl2"&&e!=="webgl"&&N("canvasContext",e),(!this._backing||!this._backing.getContext)&&N("webgl2","backing canvas has no getContext");let i=this._backing.getContext(e==="webgl"?"webgl2":e,t);return i||N("webgl2","WebGL2 context creation failed"),this._context=i,i}setAttribute(e,t){this._backing&&this._backing.setAttribute?this._backing.setAttribute(e,t):this[`_${e}`]=t}getAttribute(e){return this._backing&&this._backing.getAttribute?this._backing.getAttribute(e):this[`_${e}`]}removeAttribute(e){this._backing&&this._backing.removeAttribute&&this._backing.removeAttribute(e)}focus(){this._disposed||(this._backing&&this._backing.focus&&this._backing.focus(),this._focused=!0,this.ownerDocument.activeElement=this,this.dispatchEvent({type:"focus"}))}blur(){this._backing&&this._backing.blur&&this._backing.blur(),this._focused=!1,this.ownerDocument.activeElement===this&&(this.ownerDocument.activeElement=null),this.dispatchEvent({type:"blur"})}setPointerCapture(e){this._captured.add(e),this._backing&&this._backing.setPointerCapture&&this._backing.setPointerCapture(e),this.dispatchEvent({type:"gotpointercapture",pointerId:e})}releasePointerCapture(e){if(this._captured.delete(e),this._backing&&this._backing.releasePointerCapture)try{this._backing.releasePointerCapture(e)}catch{}this.dispatchEvent({type:"lostpointercapture",pointerId:e})}hasPointerCapture(e){return this._captured.has(e)}getBoundingClientRect(){return this._backing&&this._backing.getBoundingClientRect?this._backing.getBoundingClientRect():{x:0,y:0,left:0,top:0,width:this.clientWidth,height:this.clientHeight,right:this.clientWidth,bottom:this.clientHeight}}present(e){return this.runtime.present(this,e)}transferToImageBitmap(){if(this._backing&&this._backing.transferToImageBitmap)return this._backing.transferToImageBitmap();N("present","transferToImageBitmap is unavailable on the backing canvas")}transferControlToOffscreen(){N("offscreenTransfer","canvas is already owned by the JSR surface")}toDataURL(){N("canvas2d","capture belongs to the JSR host")}toBlob(){N("canvas2d","capture belongs to the JSR host")}_detach(){this._mounted=!1,this._assetEpoch++,this.runtime._clearInput(this,!0)}dispose(){if(!this._disposed){if(this._detach(),this._disposed=!0,this._listeners.clear(),this._backing&&this._backing.removeEventListener)for(let[e,t]of this._backingListeners)this._backing.removeEventListener(e,t);this._backingListeners.clear(),this.runtime._canvasDisposed(this)}}},ca=class{constructor(e,t=!1,i={}){this.jsr=e,this.web=t,this.engineId=Pu(e.instanceId===void 0?"default":e.instanceId,"engineId",128),this.pixelRatio=Number.isFinite(i.devicePixelRatio)?i.devicePixelRatio:Number.isFinite(Ee.devicePixelRatio)?Ee.devicePixelRatio:1,this.width=Number.isFinite(i.width)?i.width:Number.isFinite(Ee.innerWidth)?Ee.innerWidth:640,this.height=Number.isFinite(i.height)?i.height:Number.isFinite(Ee.innerHeight)?Ee.innerHeight:360,this.canvases=new Map,this.assets=new Map,this.generations=new Map,this.presentHook=null,this.heldKeys=new Map,this.activeCanvas=null,this.hostAssetLoader=typeof i.loadAssetBytes=="function"?i.loadAssetBytes:null,this.document=new Lu(this),this.capabilities=Object.freeze({backend:t?"webgl2":"flutterGpu",rawWebGL:!!t,webgl2:!!t,r1:!t,shaderMaterial:!!t,webgpu:!1,dom:!1})}createCanvas(e="main",t={}){e=String(e||"main"),Pu(e,"canvasId",112);let i=this.canvases.get(e);if(i&&!i.disposed)return i;let r=(this.generations.get(e)||0)+1;this.generations.set(e,r);let n=new la(this,e,r,t);return this.canvases.set(e,n),n}getCanvas(e="main"){return this.canvases.get(String(e))||null}_canvasDisposed(e){this.web&&this._releaseWebCanvas(e,!0),this.activeCanvas===e&&(this.activeCanvas=null),this.document.activeElement===e&&(this.document.activeElement=null),this.canvases.get(e.canvasId)===e&&this.canvases.delete(e.canvasId)}_prepareTree(e){let t=new Set,i=new Set,r=n=>{if(!(!n||typeof n!="object"||t.has(n))){if(t.add(n),n.type==="three"){let s=n.canvasId===void 0?"main":String(n.canvasId),o=this.createCanvas(s);n.canvasId=s,n.engineId=o.engineId,n.surfaceId=o.surfaceId,n.generation=o.generation,o._mounted=!0,o._webFrames&&(o._webFrames.released=!1),i.add(o)}if(Array.isArray(n))for(let s of n)r(s);else for(let s of Object.keys(n))s!=="canvas"&&s!=="renderer"&&r(n[s])}};r(e);for(let n of this.canvases.values())n.mounted&&!i.has(n)&&n._detach();return e}_keyEvent(e,t){let i=Object.assign({},e,{type:t?"keydown":"keyup",down:t,key:e.key||"",code:e.code||e.key||"",repeat:!!e.repeat}),r=i.code||i.key;t?this.heldKeys.set(r,i):this.heldKeys.delete(r),this.document.dispatchEvent(i);let n=this.document.activeElement,s=n&&n.isJsrThreeCanvas?n:this.document.hasFocus()?null:this.activeCanvas;return s&&!s.disposed&&s.dispatchEvent(i),!0}_pointerEvent(e,t){let i=e.dispatchEvent(t),r=e.ownerDocument;return r&&r.runtime===this&&r.dispatchEvent(t),i}_clearInput(e,t){let i=Array.from(this.heldKeys.values());this.heldKeys.clear();for(let n of i){let s=Object.assign({},n,{type:"keyup",down:!1,repeat:!1});this.document.dispatchEvent(s);let o=e||this.activeCanvas;o&&!o.disposed&&o.dispatchEvent(s)}let r=e?[e]:Array.from(this.canvases.values());for(let n of r){for(let s of Array.from(n._captured))this._pointerEvent(n,{type:"pointercancel",pointerId:s,pointerType:"unknown"}),this._pointerEvent(n,{type:"pointerup",pointerId:s,pointerType:"unknown",button:0}),n.hasPointerCapture(s)&&n.releasePointerCapture(s);t&&n.blur()}return t&&this.document.dispatchEvent({type:"blur"}),!0}_hostEvent(e,t={}){if(e==="key")return this._keyEvent(t,t.down!==!1);if(e==="blur")return this._clearInput(null,!0);if(e==="viewport")return this._setViewport(t.width,t.height,t.pixelRatio||t.dpr);if(e==="frameAck"||e==="release"||e==="jsr.three.frameAck"||e==="jsr.three.release")return this._frameControl(Object.assign({},t,{type:e==="frameAck"||e==="release"?`jsr.three.${e}`:e}));if(typeof e=="string"&&e.startsWith("input:"))return this._dispatchEvent(e.slice(6),t);throw new Error(`three.invalid: unknown host event ${e}`)}_dispatchEvent(e,t={}){let i=this.getCanvas(e);if(!i||i.disposed)return!1;let r=t.type||"";if(r==="keydown"||r==="keyup")return this._keyEvent(t,r==="keydown");if(r==="blur")return this._clearInput(i,!0);if(r==="visibility"||r==="visibilitychange"){let s=t.hidden!==void 0?!!t.hidden:!t.visible;return s&&this._clearInput(i,!0),this.document._setVisibility(s),i.dispatchEvent(Object.assign({},t,{type:"visibilitychange",hidden:s}))}if(r==="resize")return Number.isFinite(t.width)&&Number.isFinite(t.height)&&((t.pixelRatio!==void 0||t.dpr!==void 0)&&i.setPixelRatio(t.pixelRatio||t.dpr),i.renderer?i.renderer.setSize(t.width,t.height,!1):i.setSize(t.width,t.height,!1)),this._setViewport(t.width,t.height,t.pixelRatio||t.dpr),i.dispatchEvent(t);r==="pointerdown"&&(this.activeCanvas=i,i.focus());let n=r.startsWith("pointer")?this._pointerEvent(i,t):i.dispatchEvent(t);return(r==="pointerup"||r==="pointercancel")&&i.hasPointerCapture(t.pointerId)&&i.releasePointerCapture(t.pointerId),n}_setViewport(e,t,i){Number.isFinite(e)&&(this.width=e),Number.isFinite(t)&&(this.height=t),Number.isFinite(i)&&(this.pixelRatio=i),this.document.dispatchEvent({type:"resize",width:this.width,height:this.height,pixelRatio:this.pixelRatio})}registerAsset(e,t){if(e=String(e),e.startsWith("data:")){let r=this._parseDataUrl(e);return this.assets.set(e,r),r}let i=this._assetRecord(e,t);return this.assets.set(e,i),i}_parseDataUrl(e){let t=e.indexOf(",");if(t<0)throw ot(e,"malformed data URI");let i=e.slice(5,t),r=i.split(";")[0]||"application/octet-stream";if(!/;base64/i.test(i))throw ot(e,"only base64 data URIs are supported");return this._assetRecord(e,{data:e.slice(t+1),mime:r})}_assetRecord(e,t){if(t==null)throw ot(e,"missing asset bytes");let i=typeof t=="object"&&!(t instanceof Uint8Array)&&!(t instanceof ArrayBuffer)&&!ArrayBuffer.isView(t)?t:{data:t},r=i.data!==void 0?i.data:i.bytes,n=on(r);if(n.length>64*1024*1024)throw ot(e,"asset exceeds 64 MiB");return{url:e,data:typeof r=="string"?r:Mv(n),bytes:n,mime:i.mime||i.mimeType||"",width:Number.isFinite(i.width)?i.width:0,height:Number.isFinite(i.height)?i.height:0}}resolveAsset(e){return e=String(e),e.startsWith("data:")?(this.assets.has(e)||this.registerAsset(e),this.assets.get(e)):this.assets.get(e)||this.assets.get(e.replace(/^\.\//,""))||null}_checkAssetGuard(e,t){if(t&&t.canvas&&(t.canvas.disposed||t.canvas.generation!==t.generation||t.canvas._assetEpoch!==t.epoch))throw ot(e,"surface was disposed or detached during asset load")}async loadAsset(e,t){e=String(e),this._checkAssetGuard(e,t);let i=this.resolveAsset(e);if(i)return i;let r;try{if(this.hostAssetLoader)r=await this.hostAssetLoader(e);else if(this.jsr&&typeof this.jsr.hostCall=="function")r=await this.jsr.hostCall("three.asset",{url:e});else throw ot(e,"asset is not registered and no host asset loader is available")}catch(n){throw n&&n.code==="three.assetFailure"?n:ot(e,n&&n.message?n.message:"host load failed")}return this._checkAssetGuard(e,t),this.registerAsset(e,r)}requestAnimationFrame(e){return this.jsr&&this.jsr.requestAnimationFrame?this.jsr.requestAnimationFrame.call(this.jsr,e):Ee.requestAnimationFrame?Ee.requestAnimationFrame(e):Ee.setTimeout(()=>e(Date.now()),16)}cancelAnimationFrame(e){return this.jsr&&this.jsr.cancelAnimationFrame?this.jsr.cancelAnimationFrame.call(this.jsr,e):Ee.cancelAnimationFrame?Ee.cancelAnimationFrame(e):Ee.clearTimeout(e)}sendR1(e){return(!this.jsr||typeof this.jsr.hostCallBinary!="function")&&N("three.r1","jsr.hostCallBinary is required"),this.jsr.hostCallBinary("three.r1",e)}setPresentHook(e){if(e!==null&&typeof e!="function")throw new TypeError("three.invalid: present hook must be a function or null");this.presentHook=e}_webState(e){return e._webFrames||(e._webFrames={nextId:0,pending:new Map,capturing:!1,dirty:!1,released:!1})}_frameMessage(e,t,i,r){let n={type:t,engineId:e.engineId,surfaceId:e.surfaceId,canvasId:e.canvasId,generation:e.generation};return i!==void 0&&(n.frameId=i),r!==void 0&&(n.bitmap=r,n.width=e.width,n.height=e.height),n}_postStructured(e,t){typeof Ee.postMessage!="function"&&N("present","dedicated Worker postMessage is required"),t===void 0?Ee.postMessage(e):Ee.postMessage(e,[t])}_postWebFrame(e,t,i){let r=++t.nextId;if(!Number.isSafeInteger(r))throw new Error("three.surface: frameId exhausted");t.pending.set(r,!0);try{this._postStructured(this._frameMessage(e,"jsr.three.frame",r,i),i)}catch(n){throw t.pending.delete(r),t.dirty=!0,i&&i.close&&i.close(),n}return r}_flushWebPresent(e){let t=this._webState(e);if(!t.dirty||t.released||e.disposed||t.capturing||t.pending.size>=2)return!1;t.dirty=!1;let i=e._backing;if(i&&i.transferToImageBitmap){let r=i.transferToImageBitmap();return this._postWebFrame(e,t,r),!0}return i&&typeof Ee.createImageBitmap=="function"?(t.capturing=!0,Promise.resolve(Ee.createImageBitmap(i)).then(r=>{if(t.capturing=!1,t.released||e.disposed){r&&r.close&&r.close();return}this._postWebFrame(e,t,r),t.dirty&&this._flushWebPresent(e)},r=>{t.capturing=!1,t.dirty=!1,N("present",r&&r.message)}),!0):(t.dirty=!1,N("present","OffscreenCanvas.transferToImageBitmap or createImageBitmap is required"))}_surfaceForMessage(e){if(!e||typeof e!="object"||e.engineId!==void 0&&e.engineId!==this.engineId)return null;for(let t of this.canvases.values())if(!(e.canvasId!==void 0&&e.canvasId!==t.canvasId)&&!(e.surfaceId!==void 0&&e.surfaceId!==t.surfaceId)&&!(e.generation!==void 0&&e.generation!==t.generation))return t;return null}_frameControl(e){let t=this._surfaceForMessage(e);if(!t||!this.web)return!1;let i=this._webState(t);return e.type==="jsr.three.release"?(i.released=!0,i.dirty=!1,i.pending.clear(),!0):e.type!=="jsr.three.frameAck"?!1:(i.pending.delete(e.frameId),i.dirty&&this._flushWebPresent(t),!0)}_releaseWebCanvas(e,t){if(!this.web)return;let i=this._webState(e);i.released=!0,i.dirty=!1,i.pending.clear(),t&&this._postStructured(this._frameMessage(e,"jsr.three.release"))}present(e,t){if(e.disposed)return!1;if(this.presentHook)return this.presentHook({canvas:e,canvasId:e.canvasId,surfaceId:e.surfaceId,engineId:e.engineId,generation:e.generation,payload:t});if(!this.web)return!1;let i=this._webState(e);return i.released?!1:(i.dirty=!0,this._flushWebPresent(e),!0)}getCapabilities(){return{...this.capabilities}}install(e){let t=this,i=Object.assign({},e,{createCanvas:(r,n)=>t.createCanvas(r,n),getCanvas:r=>t.getCanvas(r),registerAsset:(r,n)=>t.registerAsset(r,n),resolveAsset:r=>t.resolveAsset(r),loadAsset:r=>t.loadAsset(r),loadAssetBytes:r=>t.loadAsset(r),getCapabilities:()=>t.getCapabilities(),capabilities:t.capabilities,setPresentHook:r=>t.setPresentHook(r),present:(r,n)=>{let s=t.getCanvas(r);return s?s.present(n):!1},_prepareTree:r=>t._prepareTree(r),_hostEvent:(r,n)=>t._hostEvent(r,n),_frameControl:r=>t._frameControl(r),_dispatchEvent:(r,n)=>t._dispatchEvent(r,n),_setViewport:(r,n,s)=>t._setViewport(r,n,s),engineId:t.engineId,devicePixelRatio:t.pixelRatio});return Object.defineProperty(i,"_runtime",{value:t,enumerable:!1}),i}};function Du(l){Sv();let e=Ee.jsr||(Ee.jsr={}),t=e.three||{};if(pr&&pr.web===!!l&&t._runtime===pr)return pr;if(pr=new ca(e,!!l,t),e.three=pr.install(t),typeof e.render=="function"&&!e.render.__jsrThreeRenderWrapper){let i=e.render,r=function(n,...s){let o=e.three&&e.three._runtime;return o&&o._prepareTree(n),i.call(this,n,...s)};Object.defineProperties(r,{__jsrThreeRenderWrapper:{value:!0},__jsrThreeOriginalRender:{value:i}}),e.render=r}return pr}function ua(l=!1){return pr||Du(l)}var Dg=4096,wv=16777216,Av=1024,Tv=64,Cv=64*1024*1024*4/3+8;function Yc(l,e){if(!Number.isFinite(l)||l<0||l>Dg)throw new Error(`three.invalid: canvas2d ${e} must be within 0..${Dg}`);return Math.floor(l)}function Bg(l){for(let e of l)if(Ke(e,"canvas2d rectangle"),Math.abs(e)>1e7)throw new Error("three.invalid: canvas2d rectangle is outside the bounded coordinate range");return l}function Og(l){if(typeof l!="string"||l.length<1||l.length>128)throw new Error("three.invalid: canvas2d color must be a nonempty bounded string");return l}function Fu(l){return!!(l&&l.isJsrNativeCanvas2D)}var Zc=class{constructor(e,t,i,r,n,s){if(Bg([e,t,i,r,n,s]),i<0||s<0)throw new Error("three.invalid: canvas2d gradient radii must be non-negative");(e!==r||t!==n||i!==0)&&N("canvas2d.radialGradient","Flutter R1 currently supports concentric radial gradients with r0=0"),this.centerX=r,this.centerY=n,this.radius=s,this.stops=[]}addColorStop(e,t){if(Ke(e,"canvas2d gradient offset"),e<0||e>1)throw new Error("three.invalid: canvas2d gradient offset must be within 0..1");if(this.stops.length>=Tv)throw new Error("three.invalid: canvas2d gradient stop quota exceeded");this.stops.push({offset:e,color:Og(t)})}snapshot(){this.stops.length<2&&N("canvas2d.gradient","at least two color stops are required");let e=this.stops.map(t=>({offset:t.offset,color:t.color}));for(let t=1;t<e.length;t++)e[t].offset<e[t-1].offset&&N("canvas2d.gradient","color stops must be added in nondecreasing offset order");return{kind:"radial",centerX:this.centerX,centerY:this.centerY,radius:this.radius,stops:e}}},Bu=class{constructor(e){this.canvas=e,this._fillStyle="#000000"}get fillStyle(){return this._fillStyle}set fillStyle(e){typeof e!="string"&&!(e instanceof Zc)&&N("canvas2d.fillStyle","only CSS colors and native radial gradients are supported"),this._fillStyle=typeof e=="string"?Og(e):e}createRadialGradient(e,t,i,r,n,s){return new Zc(e,t,i,r,n,s)}fillRect(e,t,i,r){Bg([e,t,i,r]);let n=typeof this._fillStyle=="string"?{kind:"color",color:this._fillStyle}:this._fillStyle.snapshot();this.canvas._record({op:"fillRect",x:e,y:t,width:i,height:r,style:n})}clearRect(){N("canvas2d.clearRect","not included in the bounded native Canvas2D profile")}drawImage(){N("canvas2d.drawImage","not included in the bounded native Canvas2D profile")}fillText(){N("canvas2d.fillText","not included in the bounded native Canvas2D profile")}getImageData(){N("canvas2d.getImageData","readback belongs to the Flutter host")}putImageData(){N("canvas2d.putImageData","not included in the bounded native Canvas2D profile")}},Ou=class{constructor(e,t,i,r={}){this.runtime=e,this.surface=t,this.canvasId=i,this.engineId=e.engineId,this.surfaceId=t.surfaceId,this.surfaceGeneration=t.generation,this.isJsrNativeCanvas2D=!0,this.isJsrThreeExampleLocal=!0,this.style={},this._width=Yc(r.width===void 0?300:r.width,"width"),this._height=Yc(r.height===void 0?150:r.height,"height"),this._context=new Bu(this),this._commands=[],this._listeners=new Map,this._readyListeners=new Set,this._revision=0,this._sentRevision=0,this._requestId=0,this._readyVersion=0,this._ready=!1,this._rgba=null,this._scheduled=!1,this._inFlight=!1,this._disposed=!1,this.error=null}get width(){return this._width}set width(e){this._resize(Yc(e,"width"),this._height)}get height(){return this._height}set height(e){this._resize(this._width,Yc(e,"height"))}get disposed(){return this._disposed}get ready(){return this._ready}_resize(e,t){if(!this._disposed&&!(e===this._width&&t===this._height)){if(e*t>wv)throw new Error("three.invalid: canvas2d pixel quota exceeded");this._width=e,this._height=t,this._commands=[],this._touch()}}getContext(e){if(this._disposed)throw new Error("three.surface: canvas2d is disposed");return e!=="2d"&&N("canvasContext",e),this._context}addEventListener(e,t){if(!t)return;let i=this._listeners.get(e)||[];i.includes(t)||i.push(t),this._listeners.set(e,i)}removeEventListener(e,t){let i=this._listeners.get(e);i&&this._listeners.set(e,i.filter(r=>r!==t))}dispatchEvent(e){if(!e||!e.type)throw new Error("three.invalid: canvas2d event.type is required");e.target=this,e.currentTarget=this;for(let t of(this._listeners.get(e.type)||[]).slice())typeof t=="function"?t.call(this,e):t&&t.handleEvent&&t.handleEvent(e);return!0}_addReadyListener(e){return this._disposed?()=>{}:(this._readyListeners.add(e),()=>this._readyListeners.delete(e))}_record(e){if(this._disposed)throw new Error("three.surface: canvas2d is disposed");if(this._commands.length>=Av)throw new Error("three.invalid: canvas2d command quota exceeded");this._commands.push(e),this._touch()}_touch(){this._revision++,this._ready=!1,this._rgba=null,this.error=null,this._schedule()}_schedule(){this._scheduled||this._disposed||(this._scheduled=!0,Promise.resolve().then(()=>{this._scheduled=!1,this._flush()}))}_args(e,t){return{engineId:this.engineId,surfaceId:this.surfaceId,canvasId:this.canvasId,generation:this.surfaceGeneration,requestId:e,width:this._width,height:this._height,commands:t}}_flush(){if(this._disposed||this._inFlight||this._sentRevision===this._revision||!this._width||!this._height)return;let e=this._revision,t=++this._requestId,i=this._commands.slice();this._sentRevision=e,this._inFlight=!0,this.runtime.jsr.hostCall("three.canvas2d",this._args(t,i)).then(r=>{if(this._disposed||t!==this._requestId||e!==this._revision||!r||r.stale)return;if(r.engineId!==this.engineId||r.surfaceId!==this.surfaceId||r.canvasId!==this.canvasId||r.generation!==this.surfaceGeneration||r.requestId!==t||r.width!==this._width||r.height!==this._height||typeof r.data!="string"||r.data.length>Cv)throw new Error("three.canvas2d: host response identity or dimensions do not match the request");let n=on(r.data);if(n.byteLength!==this._width*this._height*4)throw new Error("three.canvas2d: host returned an invalid raw RGBA byte length");this._rgba=n,this._readyVersion++,this._ready=!0,this.error=null;for(let s of Array.from(this._readyListeners))s(this);this.dispatchEvent({type:"ready"})}).catch(r=>{this._disposed||t!==this._requestId||e!==this._revision||(this.error=r instanceof Error?r:new Error(String(r)),this.dispatchEvent({type:"error",error:this.error}))}).then(()=>{this._inFlight=!1,this._sentRevision!==this._revision&&this._schedule()})}dispose(){this._disposed||(this._disposed=!0,this._requestId++,this._commands=[],this._rgba=null,this._ready=!1,this._readyListeners.clear(),this._listeners.clear(),this.surface._nativeCanvas2d&&this.surface._nativeCanvas2d.delete(this),this.runtime.jsr.hostCall("three.canvas2d",{action:"dispose",engineId:this.engineId,surfaceId:this.surfaceId,canvasId:this.canvasId,generation:this.surfaceGeneration,requestId:this._requestId,width:0,height:0,commands:[]}).catch(()=>{}))}toDataURL(){N("canvas2d.capture","capture belongs to the JSR host")}toBlob(){N("canvas2d.capture","capture belongs to the JSR host")}};function Fg(l){if(!l||l.web)return;let e=0,t=(i="main",r={})=>{let n=typeof i=="object"?i:l.getCanvas(i);if(!n||n.disposed||!n.isJsrThreeCanvas)throw new Error("three.surface: canvas2d requires a live JSR THREE surface");let s=new Ou(l,n,`2d-${++e}`,r),o=n._nativeCanvas2d||(n._nativeCanvas2d=new Set);if(o.add(s),!n._nativeCanvas2dDisposeWrapped){n._nativeCanvas2dDisposeWrapped=!0;let a=n.dispose;n.dispose=function(){for(let c of Array.from(o))c.dispose();return a.call(this)}}return s};l.createCanvas2D=t,l.jsr.three.createCanvas2D=t}var Ug=new WeakMap,fa={builds:0,queries:0,candidateTriangles:0,fallbacks:0};function zg(){return{...fa}}function kg(l){let e=l.prototype._computeIntersections;if(typeof e!="function")throw new Error("three.invalid: upstream Mesh intersection path is unavailable");l.prototype._computeIntersections=function(t,i,r){let n=Ev(this,r);if(n===null)return fa.fallbacks++,e.call(this,t,i,r);if(fa.queries++,fa.candidateTriangles+=n.length,n.length===0)return;let s=this.geometry,o=s.index,a=i.length;s.index=Bv(o,n);try{e.call(this,t,i,r)}finally{s.index=o}for(let c=a;c<i.length;c++){let h=i[c],u=h&&h.faceIndex;Number.isInteger(u)&&n[u]!==void 0&&(h.faceIndex=n[u])}}}function Ev(l,e){let t=l.geometry;if(!t||l.isSkinnedMesh||Array.isArray(l.material)||t.morphAttributes&&t.morphAttributes.position)return null;let i=t.attributes&&t.attributes.position,r=t.index;if(!Iv(i,r)||!Rv(t))return null;let n=Ug.get(t);return Pv(n,i,r)||(n=Lv(i,r),Ug.set(t,n),fa.builds++),Nv(n,e)}function Iv(l,e){return!!(l&&e&&l.isBufferAttribute&&e.isBufferAttribute&&!l.isInterleavedBufferAttribute&&!e.isInterleavedBufferAttribute&&l.itemSize===3&&e.itemSize===1&&!l.normalized&&!e.normalized&&l.array&&e.array&&e.count>=1024*3&&e.count%3===0)}function Rv(l){let e=l.drawRange;return!e||e.start===0&&e.count===1/0}function Pv(l,e,t){return!!(l&&l.position===e&&l.index===t&&l.positionArray===e.array&&l.indexArray===t.array&&l.positionVersion===e.version&&l.indexVersion===t.version)}function Lv(l,e){let t=l.array,i=e.array,r=e.count/3,n=new Uint32Array(r),s=new Float64Array(r*3),o=new Float64Array(r*6);for(let c=0;c<r;c++){n[c]=c;let h=c*3,u=i[h]*3,f=i[h+1]*3,d=i[h+2]*3,p=c*6;for(let m=0;m<3;m++){let g=t[u+m],_=t[f+m],x=t[d+m],v=Math.min(g,_,x)-1e-7,b=Math.max(g,_,x)+1e-7;o[p+m]=v,o[p+m+3]=b,s[h+m]=(g+_+x)/3}}let a=[];return Uu(a,n,s,o,0,r),{position:l,index:e,positionArray:t,indexArray:i,positionVersion:l.version,indexVersion:e.version,nodes:a,order:n}}function Uu(l,e,t,i,r,n){let s={minX:1/0,minY:1/0,minZ:1/0,maxX:-1/0,maxY:-1/0,maxZ:-1/0,centroidMinX:1/0,centroidMinY:1/0,centroidMinZ:1/0,centroidMaxX:-1/0,centroidMaxY:-1/0,centroidMaxZ:-1/0,start:-1,count:-1,left:-1,right:-1},o=l.length;l.push(s);for(let m=r;m<n;m++){let g=e[m],_=g*6,x=g*3;s.minX=Math.min(s.minX,i[_]),s.minY=Math.min(s.minY,i[_+1]),s.minZ=Math.min(s.minZ,i[_+2]),s.maxX=Math.max(s.maxX,i[_+3]),s.maxY=Math.max(s.maxY,i[_+4]),s.maxZ=Math.max(s.maxZ,i[_+5]),s.centroidMinX=Math.min(s.centroidMinX,t[x]),s.centroidMinY=Math.min(s.centroidMinY,t[x+1]),s.centroidMinZ=Math.min(s.centroidMinZ,t[x+2]),s.centroidMaxX=Math.max(s.centroidMaxX,t[x]),s.centroidMaxY=Math.max(s.centroidMaxY,t[x+1]),s.centroidMaxZ=Math.max(s.centroidMaxZ,t[x+2])}let a=n-r;if(a<=8)return s.start=r,s.count=a,o;let c=s.centroidMaxX-s.centroidMinX,h=s.centroidMaxY-s.centroidMinY,u=s.centroidMaxZ-s.centroidMinZ,f=c>=h&&c>=u?0:h>=u?1:2,d=e.slice(r,n);d.sort((m,g)=>t[m*3+f]-t[g*3+f]||m-g),e.set(d,r);let p=r+Math.floor(a/2);return s.left=Uu(l,e,t,i,r,p),s.right=Uu(l,e,t,i,p,n),o}function Nv(l,e){let t=l.nodes,i=l.order,r=new Int32Array(t.length),n=[],s=e.origin,o=e.direction,a=0;for(r[a++]=0;a>0;){let c=t[r[--a]];if(Dv(c,s,o))if(c.count>=0){let h=c.start+c.count;for(let u=c.start;u<h;u++)n.push(i[u])}else r[a++]=c.left,r[a++]=c.right}return n.sort((c,h)=>c-h),n}function Dv(l,e,t){let i=0,r=1/0;if(t.x===0){if(e.x<l.minX||e.x>l.maxX)return!1}else{let n=(l.minX-e.x)/t.x,s=(l.maxX-e.x)/t.x;if(n>s){let o=n;n=s,s=o}if(i=Math.max(i,n),r=Math.min(r,s),r<i)return!1}if(t.y===0){if(e.y<l.minY||e.y>l.maxY)return!1}else{let n=(l.minY-e.y)/t.y,s=(l.maxY-e.y)/t.y;if(n>s){let o=n;n=s,s=o}if(i=Math.max(i,n),r=Math.min(r,s),r<i)return!1}if(t.z===0){if(e.z<l.minZ||e.z>l.maxZ)return!1}else{let n=(l.minZ-e.z)/t.z,s=(l.maxZ-e.z)/t.z;if(n>s){let o=n;n=s,s=o}if(i=Math.max(i,n),r=Math.min(r,s),r<i)return!1}return!0}function Bv(l,e){let t=l.array,i=new l.array.constructor(e.length*3);for(let r=0;r<e.length;r++){let n=e[r]*3,s=r*3;i[s]=t[n],i[s+1]=t[n+1],i[s+2]=t[n+2]}return new l.constructor(i,1,l.normalized)}var Ov=1,Fv=3,Uv=1,Gg=64*1024*1024,Bt=Object.freeze({GEOMETRY:1,TEXTURE:2,MATERIAL:3,NODE:4,REMOVE_NODE:5,CAMERA:6,LIGHT:7,FRAME:8,DISPOSE_RESOURCE:9,DISPOSE_SURFACE:10,DRAW_BATCH:11,REMOVE_BATCH:12,CLIPPING:13}),Vg=Object.freeze({cast:1,receive:2}),zv=Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),da=Object.freeze({width:0,height:0,bias:0,normalBias:0,radius:1,matrix:zv}),pt=class{constructor(e=256){this.buffer=new ArrayBuffer(Math.max(16,e)),this.view=new DataView(this.buffer),this.length=0}ensure(e){if(this.length+e<=this.buffer.byteLength)return;let t=this.buffer.byteLength;for(;t<this.length+e;)t*=2;let i=new ArrayBuffer(t);new Uint8Array(i).set(new Uint8Array(this.buffer,0,this.length)),this.buffer=i,this.view=new DataView(i)}u8(e){this.ensure(1),this.view.setUint8(this.length,e),this.length+=1}u16(e){this.ensure(2),this.view.setUint16(this.length,e,!0),this.length+=2}u32(e){this.ensure(4),this.view.setUint32(this.length,Oi(e,"u32"),!0),this.length+=4}f32(e){this.ensure(4),this.view.setFloat32(this.length,e,!0),this.length+=4}bytes(e){let t=e instanceof Uint8Array?e:new Uint8Array(e);this.ensure(t.length),new Uint8Array(this.buffer,this.length,t.length).set(t),this.length+=t.length}floats(e){for(let t=0;t<e.length;t++)this.f32(e[t])}finish(){return new Uint8Array(this.buffer,0,this.length).slice()}};function Ot(l,e=new Uint8Array(0)){if(e.length>4294967295)throw new Error("three.invalid: command body is too large");return{opcode:l,body:e}}function si(l){if(!l||!Number.isInteger(l.id)||l.id<0||l.id>4294967295)throw new Error("three.invalid: upstream object id is not u32");return l.id===0?4294967295:l.id>>>0}function Hg(l,e,t,i){if(!Array.isArray(l)||l.length>1e5)throw new Error("three.invalid: R1 command count exceeds 100000");Oi(i,"sequence");let r=ha(e),n=ha(t);if(!r.length||r.length>128||!n.length||n.length>128)throw new Error("three.invalid: T1 identity length");let s=new pt(12+l.length*16);s.bytes(new Uint8Array([74,83,82,49])),s.u16(Fv),s.u16(0),s.u32(l.length);for(let f of l){if(!f||!Number.isInteger(f.opcode)||f.opcode<1||f.opcode>255)throw new Error("three.invalid: R1 opcode");s.u8(f.opcode),s.u8(0),s.u16(0),s.u32(f.body.length),s.bytes(f.body)}let o=s.finish(),a=32+r.length+n.length,c=a+o.length;if(c>Gg)throw new Error("three.invalid: T1 envelope exceeds 64 MiB");let h=new Uint8Array(c),u=new DataView(h.buffer);return h.set([74,83,82,51],0),u.setUint8(4,Ov),u.setUint8(5,Uv),u.setUint16(6,a,!0),u.setUint32(8,i,!0),u.setUint32(12,o.length,!0),u.setUint16(16,r.length,!0),u.setUint16(18,n.length,!0),u.setUint32(20,0,!0),u.setUint32(24,c,!0),u.setUint32(28,0,!0),h.set(r,32),h.set(n,32+r.length),h.set(o,a),h}function Wg(l,e,t,i,r,n,s=null){let o=n?n.length:0,a=0,c=["position","normal","uv","color"];for(let f=0;f<c.length;f++)r[c[f]]&&(a|=1<<f);if(s&&(t!==0||s.length%2!==0))throw new Error("three.invalid: wire indices require complete triangle-mesh edges");let h=s?4+s.length*4:0,u=new pt(28+o*4+h+64);u.u32(l),u.u32(e),u.u32(a),u.u32(i),u.u32(o),u.u32(t),u.u32(0);for(let f of c){let d=r[f];d&&(u.u32(d.byteLength),u.bytes(new Uint8Array(d.buffer,d.byteOffset,d.byteLength)))}if(n)for(let f=0;f<n.length;f++)u.u32(n[f]);if(s){u.u32(s.length);for(let f=0;f<s.length;f++)u.u32(s[f])}return Ot(Bt.GEOMETRY,u.finish())}function qg(l,e,t,i,r,n,s){let o=new pt(28+s.length);return o.u32(l),o.u32(e),o.u32(t),o.u32(i),o.u32(r),o.u32(n),o.u32(s.length),o.bytes(s),Ot(Bt.TEXTURE,o.finish())}var WG=Object.freeze({intersection:1,shadows:2});function Xg(l,e,t,i,r,n,s,o,a,c,h,u,f=null,d=0,p=null,m=1,g=0,_=0){if(t===5!=(f!==null))throw new Error("three.invalid: Phong material requires exactly one specular payload");if(p!==null&&t!==1&&t!==2&&t!==5)throw new Error("three.invalid: emissive payload requires a lit mesh material");if(!Number.isInteger(g)||g<0)throw new Error("three.invalid: material clip id");if(_!==0&&_!==1&&_!==2&&_!==3)throw new Error("three.invalid: material clip flags");let x=new pt(64+(f?16:0)+(p?16:0));return x.u32(l),x.u32(e),x.u32(t),x.u32(i),x.u32(r),x.u32(n),x.f32(s.r),x.f32(s.g),x.f32(s.b),x.f32(o),x.f32(a),x.f32(c),x.f32(h),x.f32(u),x.u32(g),x.u32(_),f&&(x.f32(f.r),x.f32(f.g),x.f32(f.b),x.f32(d)),p&&(x.f32(p.r),x.f32(p.g),x.f32(p.b),x.f32(m)),Ot(Bt.MATERIAL,x.finish())}function Yg(l,e,t,i,r,n,s,o={}){let a=new pt(92);return a.u32(l),a.u32(e),a.u32(t),a.u32(i),a.u32(r?1:0),a.u32(n),a.floats(s.elements||s),a.u32((o.cast?Vg.cast:0)|(o.receive?Vg.receive:0)),Ot(Bt.NODE,a.finish())}function Zg(l){let e=new pt(4);return e.u32(l),Ot(Bt.REMOVE_NODE,e.finish())}function Jg(l,e,t,i,r,n=null,s=null){if(Oi(l,"batch nodeId"),Oi(e,"batch version"),Oi(t,"batch instanceCount"),i<0||i>3)throw new Error("three.invalid: batch flags");if((i&2)!==0&&(i&1)===0)throw new Error("three.invalid: instance colors require instanced batches");if(i===0&&t!==1)throw new Error("three.invalid: non-instanced batch instanceCount must be one");if(!Array.isArray(r))throw new Error("three.invalid: batch parts");Oi(r.length,"batch partCount");let o=i===1||i===3?t*16:0;if(o>0&&(!n||n.length<o))throw new Error("three.invalid: batch instance matrix payload");let a=i===3?t*3:0;if(a>0){if(!s||s.length<a)throw new Error("three.invalid: batch instance color payload");for(let u=0;u<a;u++)if(!Number.isFinite(s[u]))throw new Error("three.invalid: batch instance colors must be finite")}let c=20+r.length*16+o*4+a*4;if(c>Gg)throw new Error("three.invalid: batch exceeds 64 MiB");let h=new pt(c);h.u32(l),h.u32(e),h.u32(t),h.u32(i),h.u32(r.length);for(let u of r)h.u32(u.geometryId),h.u32(u.materialId),h.u32(u.offset),h.u32(u.count);if(ArrayBuffer.isView(n))h.bytes(new Uint8Array(n.buffer,n.byteOffset,o*4));else for(let u=0;u<o;u++)h.f32(n[u]);if(ArrayBuffer.isView(s))h.bytes(new Uint8Array(s.buffer,s.byteOffset,a*4));else for(let u=0;u<a;u++)h.f32(s[u]);return Ot(Bt.DRAW_BATCH,h.finish())}function Jc(l){let e=new pt(4);return e.u32(l),Ot(Bt.REMOVE_BATCH,e.finish())}function Kg(l,e,t,i,r){let n=new pt(200);return n.u32(l),n.u32(e),n.floats(t.elements||t),n.floats(i.elements||i),n.floats(r.elements||r),Ot(Bt.CAMERA,n.finish())}function jg(l,e,t,i,r,n,s=null,o=null){if(e===3!=(s!==null))throw new Error("three.invalid: HemisphereLight requires exactly one ground color payload");if(e===4!=(o!==null))throw new Error("three.invalid: SpotLight requires exactly one spot payload");let a=new pt(64);if(a.u32(l),a.u32(e),a.f32(t.r),a.f32(t.g),a.f32(t.b),a.f32(i),a.f32(r.x),a.f32(r.y),a.f32(r.z),a.f32(n.x),a.f32(n.y),a.f32(n.z),s&&(a.f32(s.r),a.f32(s.g),a.f32(s.b),a.u32(0)),o){if(!Number.isFinite(o.angle)||o.angle<=0||o.angle>Math.PI/2)throw new Error("three.invalid: SpotLight angle must be within (0, PI/2]");if(!Number.isFinite(o.penumbra)||o.penumbra<0||o.penumbra>8)throw new Error("three.invalid: SpotLight penumbra must be within [0, 8]");if(!Number.isFinite(o.distance)||o.distance<0||!Number.isFinite(o.decay)||o.decay<0)throw new Error("three.invalid: SpotLight distance/decay must be finite and non-negative");a.f32(o.angle),a.f32(o.penumbra),a.f32(o.distance),a.f32(o.decay)}return Ot(Bt.LIGHT,a.finish())}function $g(l,e,t){if(Oi(l,"clipping id"),Oi(e,"clipping version"),!Array.isArray(t)||t.length===0||t.length>8)throw new Error("three.invalid: clipping plane count must be within 1..8");for(let r of t){if(!r||!Number.isFinite(r.normalX)||!Number.isFinite(r.normalY)||!Number.isFinite(r.normalZ)||!Number.isFinite(r.constant))throw new Error("three.invalid: clipping plane components must be finite");if(r.normalX*r.normalX+r.normalY*r.normalY+r.normalZ*r.normalZ<=0)throw new Error("three.invalid: clipping plane normal must be nonzero")}let i=new pt(16+t.length*16);i.u32(l),i.u32(e),i.u32(t.length);for(let r of t)i.f32(r.normalX),i.f32(r.normalY),i.f32(r.normalZ),i.f32(r.constant);return Ot(Bt.CLIPPING,i.finish())}function Qg(l,e,t,i,r,n=da,s=[],o=[],a=0){let c=n.contentRevision!==void 0,h=s.length||o.length||c,u=(h?4+s.length*4:0)+(o.length||c?4+o.length*4:0)+(c?4:0),f=new pt(140+u);if(f.u32(l),f.u32(e),f.f32(t.r),f.f32(t.g),f.f32(t.b),f.f32(t.a),f.f32(i),f.u32(r.mode),f.f32(r.color.r),f.f32(r.color.g),f.f32(r.color.b),f.f32(r.near),f.f32(r.far),f.u32(n.width),f.u32(n.height),f.f32(n.bias),f.f32(n.normalBias),f.f32(n.radius),f.floats(n.matrix.elements||n.matrix),f.u32(a),h){f.u32(s.length);for(let d of s)f.u32(d)}if(o.length||c){f.u32(o.length);for(let d of o)f.u32(d)}return c&&f.u32(n.contentRevision),Ot(Bt.FRAME,f.finish())}function Kc(l,e){let t=new pt(8);return t.u32(l),t.u32(e),Ot(Bt.DISPOSE_RESOURCE,t.finish())}function e_(){return Ot(Bt.DISPOSE_SURFACE)}var kv=["position","normal","uv","color"],t_=1e6,i_=1024,oi={geometry:1,texture:2,material:3,node:4,light:5,camera:6},nH=new y,xi=new y,r_=new y,yi=new y,jc=new Lt,$c=new F,n_=new WeakMap,Vv=1;function an(l){if(!l||typeof l!="object"&&typeof l!="function")return 0;let e=n_.get(l);return e||(e=Vv++,n_.set(l,e)),e}function mr(l,e){for(let t=0;t<l.length;t++)Ke(l[t],e)}function zu(l){return l.elements.join(",")}function Gv(l,e){if(!l)return!1;let t=e.elements;for(let i=0;i<16;i++)if(l[i]!==t[i])return!1;return!0}function s_(l){return l?[l.id,l.version,l.itemSize,l.normalized?1:0,l.count,an(l.array),l.data?l.data.version:0,l.data?an(l.data.array):0,l.offset||0].join(":"):"-"}function Hv(l,e,t){let i=kv.map(s=>s_(l.attributes[s])).join("|"),r=l.index,n=l.drawRange||{start:0,count:1/0};return[e,t,i,r?s_(r):"-",n.start,n.count].join(";")}function o_(l,e){let t=l.drawRange||{start:0,count:1/0},i=l.index?l.index.array:null,r=i?i.length:e;if(!Number.isInteger(t.start)||t.start<0||t.count!==1/0&&(!Number.isInteger(t.count)||t.count<0))throw new Error("three.invalid: geometry drawRange");let n=Math.max(0,Math.min(r,t.start)),s=Math.min(t.count===1/0?r-n:t.count,r-n);if(!Number.isInteger(s)||s<0)throw new Error("three.invalid: geometry drawRange");return{start:n,count:s,available:r}}function a_(l,e){let t=o_(l,e),i=l.index?l.index.array:null,r=new Array(t.count);for(let n=0;n<t.count;n++)r[n]=i?i[t.start+n]:t.start+n;return r}function Qc(l,e,t,i){if(!l)return null;if((typeof l.getComponent!="function"||l.isGLBufferAttribute)&&N("rawGLAttribute",i),l.itemSize!==t||l.count!==e)throw new Error(`three.invalid: ${i} attribute must have ${t} components per vertex`);let r=new Float32Array(e*t);for(let n=0;n<e;n++)for(let s=0;s<t;s++){let o=l.getComponent(n,s);Ke(o,`${i} attribute`),r[n*t+s]=o}return r}function Wv(l,e,t,i){let r=a_(l,i);if(t==="line"){if(r.length<2)throw new Error("three.invalid: Line needs at least two vertices");let n=new Array((r.length-1)*2);for(let s=0;s<r.length-1;s++)n[s*2]=r[s],n[s*2+1]=r[s+1];r=n}if(!l.index&&t!=="line"&&l.drawRange.start===0&&l.drawRange.count===1/0&&(r=null),r){for(let n of r)if(!Number.isInteger(n)||n<0||n>=i)throw new Error("three.invalid: geometry index is outside vertexCount");if(e===0&&r.length%3!==0||e===1&&r.length%2!==0)throw new Error("three.invalid: primitive index count is not aligned")}else if(e===0&&i%3!==0||e===1&&i%2!==0)throw new Error("three.invalid: primitive vertex count is not aligned");return r}function qv(l,e){let t=a_(l,e),i=l.attributes.position,r=new Array(e),n=new Set,s=[],o=c=>{let h=r[c];return h===void 0&&(h=[i.getComponent(c,0),i.getComponent(c,1),i.getComponent(c,2)].join(","),r[c]=h),h},a=(c,h)=>{let u=o(c),f=o(h),d=u<=f?`${u}|${f}`:`${f}|${u}`;n.has(d)||(n.add(d),s.push(c,h))};for(let c=0;c<t.length;c+=3){let h=t[c],u=t[c+1],f=t[c+2];a(h,u),a(u,f),a(f,h)}if(s.length>12e6)throw new Error("three.invalid: wireIndexCount exceeds 12000000");return s}function Xv(l){let e=l.minFilter===fe||l.minFilter===vr||l.minFilter===br;return(l.colorSpace===me?1:0)|(l.flipY?2:0)|(l.magFilter===fe?4:0)|(e?8:0)|(l.generateMipmaps?16:0)|(l.wrapS===wt||l.wrapS===Yt?32:0)|(l.wrapT===wt||l.wrapT===Yt?64:0)}function Yv(l){let e=l.image;return[l.version,l.source?l.source.version:0,an(e),e&&an(e.data),e&&e.width,e&&e.height,e&&e.encoding,e&&e.mime,l.colorSpace,l.flipY,l.magFilter,l.minFilter,l.generateMipmaps,l.wrapS,l.wrapT,l.format,l.type].join("|")}function Zv(l){if(l.isMeshBasicMaterial)return 0;if(l.isMeshLambertMaterial)return 1;if(l.isMeshStandardMaterial&&!l.isMeshPhysicalMaterial)return 2;if(l.isLineBasicMaterial&&!l.isLineDashedMaterial)return 3;if(l.isPointsMaterial)return 4;if(l.isMeshPhongMaterial)return 5;if(l.isMeshNormalMaterial)return 6;if(l.isShadowMaterial)return 7;N("material",l.type||"unknown material")}function l_(l){return l.isMeshLambertMaterial||l.isMeshPhongMaterial||l.isMeshStandardMaterial&&!l.isMeshPhysicalMaterial}function Jv(l){(l.isShaderMaterial||l.isRawShaderMaterial)&&N("ShaderMaterial","arbitrary shaders require 1B"),l.wireframe&&!(l.isMeshBasicMaterial||l.isMeshLambertMaterial||l.isMeshPhongMaterial||l.isMeshNormalMaterial||l.isMeshStandardMaterial&&!l.isMeshPhysicalMaterial)&&N("wireframe","R1 wireframe requires a mesh material"),l.wireframe&&(l.wireframeLinewidth!==1||l.wireframeLinecap!=="round"||l.wireframeLinejoin!=="round")&&N("wireframeStyle","R1 supports one-pixel round wireframe lines"),l.blending!==fo&&N("materialBlending"),(l.alphaHash||l.premultipliedAlpha||l.colorWrite===!1||l.stencilWrite||l.polygonOffset)&&N("materialState","alphaHash/premultipliedAlpha/colorWrite/stencil/polygonOffset"),Object.prototype.hasOwnProperty.call(l,"onBeforeCompile")&&N("onBeforeCompile","arbitrary shaders require 1B");let e=["alphaMap","aoMap","bumpMap","displacementMap","emissiveMap","envMap","lightMap","metalnessMap","normalMap","roughnessMap","specularMap","clearcoatMap","transmissionMap"];for(let t of e)l[t]&&N("materialTexture",`${l.type}.${t}`);!l_(l)&&l.emissive&&(l.emissive.r!==0||l.emissive.g!==0||l.emissive.b!==0)&&N("emissiveMaterial",`${l.type} has no upstream emissive support`)}function Kv(l){if(l===Mi)return 0;if(l===wi)return 1;if(l===uo)return 2;throw new Error("three.invalid: material side")}var eh=class{constructor(e={}){this.isWebGLRenderer=!0,this.isJsrThreeRenderer=!0,this.runtime=e.runtime||ua(!1),e.context!=null&&N("rawWebGL","native R1 does not accept a caller-provided GL context");let t=e.canvas||this.runtime.createCanvas("main");if(t.isJsrThreeCanvas||N("canvas","native WebGLRenderer requires jsr.three.createCanvas()"),t.renderer&&t.renderer!==this&&!t.renderer._disposed)throw new Error("three.surface: canvas already has an active renderer");this.domElement=t,t.renderer=this,this.capabilities=Object.assign({},this.runtime.capabilities,{rawWebGL:!1,isWebGL2:!1,backend:"flutterGpu",features:Object.freeze({geometry:!0,textures:!0,lambert:!0,standard:!0,phong:!0,normal:!0,emissive:!0,hemisphereLight:!0,spotLight:!0,clipping:!0,wireframe:!0,rawWebGL:!1,shaderMaterial:!1})}),this.outputColorSpace=me,this.toneMapping=un,this.toneMappingExposure=1,this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.shadowMap={enabled:!1,autoUpdate:!0,needsUpdate:!1},this._manualShadowRevision=0,this._shadowCullingKey=null,this._cachedCulledShadowNodeIds=[],this.xr={enabled:!1},this.info={autoReset:!0,render:{frame:0,calls:0,triangles:0,points:0,lines:0},memory:{geometries:0,textures:0},programs:[],reset:()=>{this.info.render.calls=0,this.info.render.triangles=0,this.info.render.points=0,this.info.render.lines=0}},this._clearColor=new I(0),this._clearAlpha=0,this._pixelRatio=t.pixelRatio||1,this._width=t.clientWidth||t.width,this._height=t.clientHeight||t.height,this._disposed=!1,this._animationLoop=null,this._animationHandle=null,this._pendingDisposals=[],this._resources=new Map,this._geometryModes=new Map,this._geometryResourceKeys=new Map,this._geometryResourceOwners=new Map,this._nextGeometryAlias=2147483648,this._canvasTextures=new Map,this._canvasRefreshHandle=null,this._lastScene=null,this._lastCamera=null,this._state=t._r1State||(t._r1State={sequence:0,geometries:new Map,textures:new Map,materials:new Map,nodes:new Map,batches:new Map,lights:new Map,cameras:new Map,clippings:new Map})}getContext(){N("rawWebGL","WebGLRenderer.getContext() is a 1B capability")}getContextAttributes(){N("rawWebGL","WebGLRenderer.getContextAttributes() is a 1B capability")}getPixelRatio(){return this._pixelRatio}getSize(e){return e&&e.set?e.set(this._width,this._height):{width:this._width,height:this._height}}getDrawingBufferSize(e){return e&&e.set?e.set(this.domElement.width,this.domElement.height):{width:this.domElement.width,height:this.domElement.height}}getClearColor(e){return e&&e.copy?e.copy(this._clearColor):this._clearColor.clone()}getClearAlpha(){return this._clearAlpha}setPixelRatio(e){if(!Number.isFinite(e)||e<=0||e>16)throw new Error("three.invalid: pixel ratio must be within (0,16]");this._pixelRatio=e,this.setSize(this._width,this._height,!1)}setSize(e,t,i=!0){if(!Number.isFinite(e)||!Number.isFinite(t)||e<0||t<0||e>16384||t>16384)throw new Error("three.invalid: renderer size must be within 0..16384");this._width=e,this._height=t,this.domElement._setSize(e,t,this._pixelRatio,i)}setClearColor(e,t=1){if(this._clearColor.set(e),!Number.isFinite(t)||t<0||t>1)throw new Error("three.invalid: clear alpha");this._clearAlpha=t}setClearAlpha(e){if(!Number.isFinite(e)||e<0||e>1)throw new Error("three.invalid: clear alpha");this._clearAlpha=e}setViewport(){}setScissor(){}setScissorTest(){}setRenderTarget(e){e!=null&&N("renderTarget","R1 renders only the attached surface")}getRenderTarget(){return null}clear(){}setAnimationLoop(e){if(e!==null&&typeof e!="function")throw new TypeError("three.invalid: animation loop callback");if(this._animationHandle!==null&&(this.runtime.cancelAnimationFrame(this._animationHandle),this._animationHandle=null),this._animationLoop=e,!e||this._disposed)return;let t=i=>{this._disposed||this._animationLoop!==e||(this._animationHandle=this.runtime.requestAnimationFrame(t),e(i))};this._animationHandle=this.runtime.requestAnimationFrame(t)}_mapSet(e,t,i){let r=this._transaction;if(r){let n=r.get(e);n||(n=new Map,r.set(e,n)),n.has(t)||n.set(t,[e.has(t),e.get(t)])}e.set(t,i)}_mapDelete(e,t){let i=this._transaction;if(i){let r=i.get(e);r||(r=new Map,i.set(e,r)),r.has(t)||r.set(t,[e.has(t),e.get(t)])}return e.delete(t)}_geometryResourceId(e,t,i){let r=si(e),n=`${r}:${t}:${i}`,s=this._geometryResourceKeys.get(n);if(s!==void 0)return s;let o=r;if(this._geometryResourceOwners.has(o)){let a=this._nextGeometryAlias;do if(o=this._nextGeometryAlias,this._nextGeometryAlias=o===4294967294?2147483648:o+1,this._nextGeometryAlias===a)throw new Error("three.invalid: geometry resource aliases exhausted");while(this._geometryResourceOwners.has(o))}return this._geometryResourceKeys.set(n,o),this._geometryResourceOwners.set(o,n),o}_releaseGeometryResource(e){let t=this._geometryResourceOwners.get(e);t!==void 0&&(this._geometryResourceOwners.delete(e),this._geometryResourceKeys.delete(t))}_listen(e,t,i,r){if(!e||!e.addEventListener)return;let n=this._resources.get(e);if(n){t==="geometries"&&!n.ids.includes(r)&&n.ids.push(r);return}let s={geometries:oi.geometry,textures:oi.texture,materials:oi.material,nodes:oi.node},o={type:t,id:r,ids:[r],listener:null};o.listener=()=>{this._unlisten(e),t==="textures"&&this._unwatchCanvasTexture(e);for(let a of o.ids){if(t==="geometries"&&(this._releaseGeometryResource(a),this._mapDelete(this._geometryModes,a)),!this._state[t].has(a))continue;this._mapDelete(this._state[t],a);let c={id:a,kind:s[t]};t==="nodes"&&this._mapDelete(this._state.batches,a)&&(c.batch=!0),this._pendingDisposals.push(c)}},e.addEventListener("dispose",o.listener),this._resources.set(e,o),this._transactionListens&&this._transactionListens.push(e)}_unlisten(e){let t=this._resources.get(e);t&&(e.removeEventListener("dispose",t.listener),this._resources.delete(e))}_unlistenAll(){for(let[e,t]of this._resources)e.removeEventListener&&e.removeEventListener("dispose",t.listener);this._resources.clear()}_nextVersion(e,t,i){let r=e.get(t);if(r&&r.signature===i)return null;let n=r?r.version+1:1;if(n>4294967295)throw new Error("three.invalid: resource version exhausted");return{signature:i,version:n}}_unwatchCanvasTexture(e){let t=this._canvasTextures.get(e);t&&(t.unlisten(),this._canvasTextures.delete(e))}_watchCanvasTexture(e,t){let i=this._canvasTextures.get(e);if(i&&i.canvas===t)return i;i&&this._unwatchCanvasTexture(e);let r={texture:e,canvas:t,adoptedVersion:0,unlisten:null};return r.unlisten=t._addReadyListener(()=>{this._disposed||this._canvasTextures.get(e)!==r||this._adoptCanvasTexture(r)&&this._scheduleCanvasRefresh()}),this._canvasTextures.set(e,r),r}_adoptCanvasTexture(e){let t=e.canvas;return!t._ready||!t._rgba||e.adoptedVersion===t._readyVersion?!1:(e.adoptedVersion=t._readyVersion,e.texture.userData.jsrCanvas2D=t,e.texture.source.data={width:t.width,height:t.height,data:new Uint8Array(t._rgba),encoding:0,encoded:!1},e.texture.needsUpdate=!0,!0)}_scheduleCanvasRefresh(){this._disposed||this._canvasRefreshHandle!==null||!this._lastScene||!this._lastCamera||(this._canvasRefreshHandle=!0,Promise.resolve().then(()=>{if(this._disposed||!this._lastScene||!this._lastCamera){this._canvasRefreshHandle=null;return}try{this.render(this._lastScene,this._lastCamera)}finally{this._canvasRefreshHandle=null}}))}_canvasForTexture(e){if(!e.isCanvasTexture)return null;if(Fu(e.image))return e.image;let t=e.userData&&e.userData.jsrCanvas2D;return Fu(t)?t:null}_ensureTexture(e,t){if(!e)return 0;e.isTexture||N("texture","material map is not a THREE.Texture"),(e.isCubeTexture||e.isDataArrayTexture||e.isData3DTexture||e.isCompressedTexture||e.isVideoTexture||e.isFramebufferTexture||e.isDepthTexture||e.isExternalTexture)&&N("textureType",e.type);let i=this._canvasForTexture(e);if(e.isCanvasTexture&&!i&&N("canvas2d.source","native CanvasTexture requires a Flutter canvas2d image"),i){let p=this._watchCanvasTexture(e,i);if(this._adoptCanvasTexture(p),!i._ready)return 0}e.mapping!==ki&&N("textureMapping"),(e.premultiplyAlpha||e.anisotropy>1||e.mipmaps&&e.mipmaps.length)&&N("textureState","premultiplyAlpha/anisotropy/custom mipmaps"),(e.channel!==0||e.offset.x!==0||e.offset.y!==0||e.repeat.x!==1||e.repeat.y!==1||e.center.x!==0||e.center.y!==0||e.rotation!==0)&&N("textureTransform","R1 v1 has no UV transform fields");let r=e.image;if(!r||!r.data)return 0;let n=si(e),s=this._frameTextures.get(n);if(s!==void 0)return s;this._listen(e,"textures",this._state.textures,n);let o=Yv(e),a=this._nextVersion(this._state.textures,n,o);if(!a)return this._frameTextures.set(n,n),n;let c=r.data;if(!(c instanceof Uint8Array)&&!ArrayBuffer.isView(c))throw new Error("three.invalid: texture data must be a typed array");let h=c instanceof Uint8Array?c:new Uint8Array(c.buffer,c.byteOffset,c.byteLength);if(h.length>64*1024*1024)throw new Error("three.invalid: texture exceeds 64 MiB");let u=r.encoding,f=r.width||0,d=r.height||0;if(u===void 0){let p=String(r.mime||"").toLowerCase();e.isDataTexture||r.encoded===!1?u=0:h.length>=8&&h[0]===137&&h[1]===80&&h[2]===78&&h[3]===71?u=1:h.length>=2&&h[0]===255&&h[1]===216?u=2:p.includes("png")?u=1:p.includes("jpeg")||p.includes("jpg")?u=2:u=0}if(u===0){if((e.format!==je||e.type!==Zt)&&N("textureFormat","R1 raw textures require RGBA8/UnsignedByteType"),!f||!d||f*d*4!==h.byteLength)throw new Error("three.invalid: raw RGBA8 texture dimensions/data length")}else u!==1&&u!==2&&N("textureEncoding",u);if(u!==0&&h.length===0)throw new Error("three.invalid: encoded texture bytes must be nonempty");return t.push(qg(n,a.version,f,d,u,Xv(e),h)),this._mapSet(this._state.textures,n,{signature:o,version:a.version,object:e}),this._frameTextures.set(n,n),n}_ensureMaterial(e,t){let i=Zv(e);Jv(e);let r=si(e),n=this._frameMaterials.get(r);if(n!==void 0)return n;this._listen(e,"materials",this._state.materials,r);let s=this._ensureTexture(e.map||null,t),o=e.color||new I(16777215),a=e.opacity===void 0?1:e.opacity,c=e.roughness===void 0?0:e.roughness,h=e.metalness===void 0?0:e.metalness,u=e.alphaTest||0,f=e.size===void 0?1:e.size,d=i===5?e.specular:null,p=i===5?e.shininess:0,m=l_(e)?e.emissive:null,g=m?e.emissiveIntensity:1;if(Ke(o.r,"material color"),Ke(o.g,"material color"),Ke(o.b,"material color"),!Number.isFinite(a)||a<0||a>1||!Number.isFinite(c)||c<0||c>1||!Number.isFinite(h)||h<0||h>1||!Number.isFinite(u)||u<0||u>1||!Number.isFinite(f)||f<=0)throw new Error("three.invalid: material scalar range");if(d&&(Ke(d.r,"material specular"),Ke(d.g,"material specular"),Ke(d.b,"material specular"),!Number.isFinite(p)||p<0))throw new Error("three.invalid: material shininess must be finite and nonnegative");if(m&&(Ke(m.r,"material emissive"),Ke(m.g,"material emissive"),Ke(m.b,"material emissive"),!Number.isFinite(g)||g<0))throw new Error("three.invalid: material emissiveIntensity must be finite and nonnegative");let _=Kv(e.side),x=(e.vertexColors?1:0)|(e.flatShading?2:0)|(e.transparent?4:0)|(e.depthTest?8:0)|(e.depthWrite?16:0)|(e.wireframe?32:0)|(e.sizeAttenuation===!1?64:0),v=this._resolveClipping(e,t),b=[i,s,e.map&&this._state.textures.get(si(e.map))?.version||0,x,_,o.r,o.g,o.b,a,c,h,u,f,d?d.r:0,d?d.g:0,d?d.b:0,p,m?m.r:0,m?m.g:0,m?m.b:0,g,e.version,v.signature,v.flags].join("|"),M=this._nextVersion(this._state.materials,r,b);return M&&(t.push(Xg(r,M.version,i,s,x,_,o,a,c,h,u,f,d,p,m,g,v.id,v.flags)),this._mapSet(this._state.materials,r,{signature:b,version:M.version,object:e})),this._frameMaterials.set(r,r),r}_resolveClipping(e,t){let i=this.localClippingEnabled&&Array.isArray(e.clippingPlanes)?e.clippingPlanes:null,r=[];if(this.clippingPlanes.length&&r.push(...this.clippingPlanes),i&&r.push(...i),!r.length)return{id:0,flags:0,signature:"none"};r.length>8&&N("clippingPlanes","R1 supports at most 8 clipping planes");let n=r.map(h=>{if(!h||h.isPlane!==!0)throw new Error("three.invalid: clipping planes must be THREE.Plane instances");let u=Math.hypot(h.normal.x,h.normal.y,h.normal.z);if(!Number.isFinite(u)||u<=0)throw new Error("three.invalid: clipping plane normal must be finite and nonzero");if(!Number.isFinite(h.constant))throw new Error("three.invalid: clipping plane constant must be finite");return{normalX:h.normal.x/u,normalY:h.normal.y/u,normalZ:h.normal.z/u,constant:h.constant/u}}),s=n.map(h=>`${h.normalX}:${h.normalY}:${h.normalZ}:${h.constant}`).join("|"),o=si(e),a=this._nextVersion(this._state.clippings,o,s);a&&(t.push($g(o,a.version,n)),this._mapSet(this._state.clippings,o,{signature:s,version:a.version}));let c=(e.clipIntersection?1:0)|(e.clipShadows?2:0);return{id:o,flags:c,signature:s}}_ensureGeometry(e,t,i,r,n=!1){(!e||!e.isBufferGeometry)&&N("geometry","only BufferGeometry is supported"),e.isInstancedBufferGeometry&&N("instancedGeometry"),e.index&&(!e.index.array||e.index.isGLBufferAttribute)&&N("rawGLAttribute","index"),e.morphAttributes&&Object.keys(e.morphAttributes).some(w=>e.morphAttributes[w]&&e.morphAttributes[w].length)&&N("morphTargets");let s=e.attributes.position;if(!s)throw new Error("three.invalid: position attribute is required");let o=s.count;if(!Number.isInteger(o)||o<=0||o>4e6)throw new Error("three.invalid: vertexCount");let a=this._geometryResourceId(e,t,i),c=this._state.geometries.get(a),h=t===0&&(n||c&&c.hasWireIndices),u=this._frameGeometries.get(a);if(u&&(!n||u.hasWireIndices))return u;this._listen(e,"geometries",this._state.geometries,a),this._mapSet(this._geometryModes,a,{primitive:t,mode:i});let f=`${Hv(e,t,i)};wire:${h?1:0}`,d=this._nextVersion(this._state.geometries,a,f);if(!d){let w=this._state.geometries.get(a),S={id:a,vertexCount:o,drawCount:w.drawCount,indexed:w.indexed,rangeStart:w.rangeStart,rangeCount:w.rangeCount,sourceCount:w.sourceCount,hasWireIndices:w.hasWireIndices,wireDrawCount:w.wireDrawCount};return this._frameGeometries.set(a,S),S}let p={position:Qc(s,o,3,"position"),normal:Qc(e.attributes.normal,o,3,"normal"),uv:Qc(e.attributes.uv,o,2,"uv"),color:e.attributes.color?Qc(e.attributes.color,o,e.attributes.color.itemSize,"color"):null};if(e.attributes.color&&e.attributes.color.itemSize!==3&&e.attributes.color.itemSize!==4)throw new Error("three.invalid: color attribute must have 3 or 4 components");let m=Wv(e,t,i,o),g=h?qv(e,o):null,_=m?m.length:0;if(_>12e6)throw new Error("three.invalid: indexCount");r.push(Wg(a,d.version,t,o,p,m,g));let x=m?_:o,v=o_(e,o),b={signature:f,version:d.version,object:e,drawCount:x,indexed:!!m,rangeStart:v.start,rangeCount:v.count,sourceCount:v.available,hasWireIndices:!!g,wireDrawCount:g?g.length:0};this._mapSet(this._state.geometries,a,b);let M={id:a,vertexCount:o,drawCount:x,indexed:b.indexed,rangeStart:v.start,rangeCount:v.count,sourceCount:v.available,hasWireIndices:b.hasWireIndices,wireDrawCount:b.wireDrawCount};return this._frameGeometries.set(a,M),M}_updateNode(e,t,i,r,n,s,o,a){let c=e.matrixWorld,h=e.castShadow===!0,u=e.receiveShadow===!0,f=this._state.nodes.get(t);f&&f.parentId===i&&f.geometryId===r&&f.materialId===n&&f.visible===s&&f.objectKind===o&&f.castShadow===h&&f.receiveShadow===u&&Gv(f.matrix,c)||(mr(c.elements,"matrixWorld"),a.push(Yg(t,i,r,n,s,o,c,{cast:h,receive:u})),this._mapSet(this._state.nodes,t,{parentId:i,geometryId:r,materialId:n,visible:s,objectKind:o,castShadow:h,receiveShadow:u,matrix:c.elements.slice(),object:e}))}_removeBatch(e,t){this._mapDelete(this._state.batches,e)&&t.push(Jc(e))}_instanceData(e,t){for(let h of t)h.transparent&&N("transparentInstancedMesh","R1 instanced draws must be opaque");e.morphTexture&&N("morphTargets","instanced morph textures");let i=e.count;if(!Number.isInteger(i)||i<0||i>t_)throw new Error(`three.invalid: InstancedMesh.count must be within 0..${t_}`);let r=e.instanceMatrix;if(!r||!r.isInstancedBufferAttribute||r.isGLBufferAttribute||r.itemSize!==16)throw new Error("three.invalid: instanceMatrix must be a 16-component InstancedBufferAttribute");let n=r.array;if(!n||!ArrayBuffer.isView(n)||typeof n.length!="number")throw new Error("three.invalid: instanceMatrix array");if(!Number.isInteger(r.count)||r.count<0||i>r.count)throw new Error("three.invalid: InstancedMesh.count exceeds instanceMatrix capacity");let s=i*16;if(s>n.length)throw new Error("three.invalid: instanceMatrix payload is outside its array bounds");let o=null,a=0,c=null;if(e.instanceColor){if(c=e.instanceColor,!c||!c.isInstancedBufferAttribute||c.isGLBufferAttribute||c.itemSize!==3)throw new Error("three.invalid: instanceColor must be a 3-component InstancedBufferAttribute");if(!c.array||!ArrayBuffer.isView(c.array))throw new Error("three.invalid: instanceColor array");if(!Number.isInteger(c.count)||i>c.count)throw new Error("three.invalid: InstancedMesh.count exceeds instanceColor capacity");if(a=i*3,a>c.array.length)throw new Error("three.invalid: instanceColor payload is outside its array bounds");o=c.array}return{count:i,array:n,valueCount:s,colors:o,colorCount:a,signature:[r.version,an(r),an(n),r.count,o?`${c.version}:${an(o)}:${c.count}`:"nocolor"].join(":")}}_ensureBatchParts(e,t,i,r){if(e.isInstancedMesh&&!Array.isArray(e.material))return[{geometryId:t.id,materialId:this._ensureMaterial(i[0],r),offset:0,count:t.drawCount}];let n=e.geometry.groups;if((!n||n.length===0)&&N("multiMaterialGroups","material arrays require BufferGeometry.groups"),n.length>i_)throw new Error(`three.invalid: batch partCount exceeds ${i_}`);let s=t.rangeStart+t.rangeCount,o=[];for(let a of n){if(!a||!Number.isInteger(a.start)||a.start<0||!Number.isInteger(a.count)||a.count<0)throw new Error("three.invalid: geometry group start/count");if(!Number.isInteger(a.materialIndex)||a.materialIndex<0||a.materialIndex>=i.length)throw new Error("three.invalid: geometry group materialIndex");if(a.start>t.sourceCount||a.count>t.sourceCount-a.start)throw new Error("three.invalid: geometry group is outside geometry bounds");if(a.start%3!==0)throw new Error("three.invalid: triangle group start is not aligned");if(a.count%3!==0)throw new Error("three.invalid: triangle group count is not aligned");let c=a.start+a.count,h=Math.min(s,Math.max(t.rangeStart,a.start)),u=Math.min(s,Math.max(t.rangeStart,c)),f=Math.max(0,u-h);if(f%3!==0)throw new Error("three.invalid: clipped triangle group count is not aligned");let d=h-t.rangeStart;if(d>t.drawCount||f>t.drawCount-d)throw new Error("three.invalid: batch part is outside the uploaded geometry");o.push({geometryId:t.id,materialId:this._ensureMaterial(i[a.materialIndex],r),offset:d,count:f})}return o}_ensureBatch(e,t,i,r,n){let s=e.isInstancedMesh&&!Array.isArray(e.material),o=e.isInstancedMesh?this._instanceData(e,r):null,a=0,c=this._state.batches.get(t);if(s){a=this._ensureMaterial(r[0],n);let p=e.instanceMatrix,m=e.instanceColor||null,g=this._state.geometries.get(i.id),_=this._state.materials.get(a);if(c&&c.simpleInstanced&&c.object===e&&c.geometry===e.geometry&&c.geometryVersion===g.version&&c.material===r[0]&&c.materialVersion===_.version&&c.instanceMatrix===p&&c.instanceVersion===p.version&&c.instanceAttributeCount===p.count&&c.instanceArray===p.array&&c.instanceColor===m&&c.instanceColorVersion===(m?m.version:0)&&c.instanceColorArray===(m?m.array:null)&&c.instanceColorCapacity===(m?m.count:0)&&c.instanceCount===e.count&&c.parts.length===1&&c.parts[0].geometryId===i.id&&c.parts[0].materialId===a&&c.parts[0].offset===0&&c.parts[0].count===i.drawCount)return this._listen(e,"nodes",this._state.nodes,t),{primitive:0,parts:c.parts,instanceCount:e.count}}let h=s?[{geometryId:i.id,materialId:a,offset:0,count:i.drawCount}]:this._ensureBatchParts(e,i,r,n),u=h.map(p=>[p.geometryId,p.materialId,p.offset,p.count].join(":")).join("|"),f=`${o?`1:${o.count}:${o.signature}`:"0:1:-"};${u}`,d=this._nextVersion(this._state.batches,t,f);if(d){if(o){for(let m=0;m<o.valueCount;m++)Ke(o.array[m],"instanceMatrix");if(o.colors)for(let m=0;m<o.colorCount;m++)Ke(o.colors[m],"instanceColor")}let p=o?o.count:1;n.push(Jg(t,d.version,p,o?o.colors?3:1:0,h,o?o.array:null,o?o.colors:null)),this._mapSet(this._state.batches,t,{signature:f,version:d.version,object:e,parts:h,simpleInstanced:s,geometry:e.geometry,geometryVersion:this._state.geometries.get(i.id).version,material:s?r[0]:null,materialVersion:s?this._state.materials.get(a).version:0,instanceMatrix:o?e.instanceMatrix:null,instanceVersion:o?e.instanceMatrix.version:0,instanceAttributeCount:o?e.instanceMatrix.count:0,instanceArray:o?o.array:null,instanceColor:o&&e.instanceColor||null,instanceColorVersion:o&&e.instanceColor?e.instanceColor.version:0,instanceColorArray:o&&e.instanceColor?e.instanceColor.array:null,instanceColorCapacity:o&&e.instanceColor?e.instanceColor.count:0,instanceCount:o?o.count:0})}return this._listen(e,"nodes",this._state.nodes,t),{primitive:0,parts:h,instanceCount:o?o.count:1}}_ensureNode(e,t,i,r){let n=si(e),s=!e.material||e.material.visible!==!1,o=!!e.visible&&s,a=!!e.isInstancedMesh||!!(e.isMesh&&Array.isArray(e.material));if((!r||!s)&&!e.isLight&&!e.isCamera){let p=e.isMesh?1:e.isPoints?3:e.isLine||e.isLineSegments?2:0;return a||this._removeBatch(n,i),this._updateNode(e,n,t,0,0,o,p,i),{id:n,draw:null}}if(e.isInstancedMesh&&e.count===0){if(e.userData&&e.userData.jsrRetainEmptyBatch){let p=Array.isArray(e.material)?e.material:[e.material];p.some(g=>g.wireframe)&&N("wireframeBatch","R1 wireframe requires a single-material non-instanced Mesh");let m=this._ensureGeometry(e.geometry,0,"triangles",i);this._ensureBatch(e,n,m,p,i)}else this._removeBatch(n,i);return this._updateNode(e,n,t,0,0,o,1,i),{id:n,draw:null}}let c=0,h=0,u=0,f=null,d=null;if(e.isMesh||e.isLine||e.isLineSegments||e.isPoints){(e.isSkinnedMesh||e.isBatchedMesh||e.isSprite)&&N("objectType",e.type),e.isLineLoop&&N("LineLoop");let p=e.material;if(!p||Array.isArray(p)&&p.length===0)throw new Error("three.invalid: drawable has no material");let m=0,g="triangles";u=1,e.isPoints?(m=2,g="points",u=3):(e.isLine||e.isLineSegments)&&(m=1,g=e.isLineSegments?"lines":"line",u=2),Array.isArray(p)&&m!==0&&N("multiMaterial","R1 material arrays require triangle meshes");let _=Array.isArray(p)?p:[p],x=m===0&&_.some(b=>b.wireframe);a&&x&&N("wireframeBatch","R1 wireframe requires a single-material non-instanced Mesh");let v=this._ensureGeometry(e.geometry,m,g,i,x);a?d={geometry:v,materials:_}:(c=v.id,h=this._ensureMaterial(p,i),f={primitive:x?1:m,count:x?v.wireDrawCount:v.drawCount})}else{if(e.isLight||e.isCamera)return null;(e.isSkinnedMesh||e.isInstancedMesh||e.isBatchedMesh||e.isSprite||e.isLOD)&&N("objectType",e.type)}return a||this._removeBatch(n,i),this._updateNode(e,n,t,c,h,o,u,i),d&&(f=this._ensureBatch(e,n,d.geometry,d.materials,i)),{id:n,draw:f}}_ensureLight(e,t){let i;e.isAmbientLight?i=0:e.isDirectionalLight?i=1:e.isPointLight?i=2:e.isHemisphereLight?i=3:e.isSpotLight?i=4:N("light",e.type);let r=si(e);e.getWorldPosition(xi),yi.set(0,0,0),e.isDirectionalLight||e.isSpotLight?(e.target.updateMatrixWorld(!0),r_.setFromMatrixPosition(e.target.matrixWorld),yi.copy(xi).sub(r_).normalize()):e.isHemisphereLight&&yi.copy(xi).normalize();let n=e.isHemisphereLight?e.groundColor:null,s=e.isSpotLight?{angle:e.angle,penumbra:e.penumbra,distance:e.distance,decay:e.decay}:null,o=[i,e.color.r,e.color.g,e.color.b,e.intensity,xi.x,xi.y,xi.z,yi.x,yi.y,yi.z,n?n.r:0,n?n.g:0,n?n.b:0,s?s.angle:0,s?s.penumbra:0,s?s.distance:0,s?s.decay:0].join("|"),a=this._state.lights.get(r);if(!a||a.signature!==o){if(!Number.isFinite(e.intensity)||e.intensity<0)throw new Error("three.invalid: light intensity");mr([e.color.r,e.color.g,e.color.b,xi.x,xi.y,xi.z,yi.x,yi.y,yi.z],"light"),n&&mr([n.r,n.g,n.b],"light groundColor"),t.push(jg(r,i,e.color,e.intensity,xi,yi,n,s)),this._mapSet(this._state.lights,r,{signature:o,object:e})}return r}_ensureCamera(e,t){(!e||!e.isPerspectiveCamera&&!e.isOrthographicCamera)&&N("camera","R1 supports perspective and orthographic cameras");let i=si(e);mr(e.matrixWorld.elements,"camera matrixWorld"),mr(e.matrixWorldInverse.elements,"camera matrixWorldInverse"),mr(e.projectionMatrix.elements,"camera projectionMatrix");let r=[e.isPerspectiveCamera?0:1,zu(e.matrixWorldInverse),zu(e.projectionMatrix),zu(e.matrixWorld)].join("|"),n=this._state.cameras.get(i);return(!n||n.signature!==r)&&(t.push(Kg(i,e.isPerspectiveCamera?0:1,e.matrixWorldInverse,e.projectionMatrix,e.matrixWorld)),this._mapSet(this._state.cameras,i,{signature:r,object:e})),i}_background(e){let t=e.background;return t==null?{r:this._clearColor.r,g:this._clearColor.g,b:this._clearColor.b,a:this._clearAlpha}:(t.isColor||N("backgroundTexture","R1 v1 accepts a Color or null background"),{r:t.r,g:t.g,b:t.b,a:1})}_fog(e){let t=e.fog;if(t==null)return{mode:0,color:{r:0,g:0,b:0},near:0,far:0};if(t.isFog||N("fogType","R1 supports linear THREE.Fog"),mr([t.color.r,t.color.g,t.color.b,t.near,t.far],"fog"),t.near<0||t.far<=t.near)throw new Error("three.invalid: fog requires 0 <= near < far");return{mode:1,color:t.color,near:t.near,far:t.far}}_shadow(e,t){if(!this.shadowMap.enabled)return da;if(!t||!t.shadow||!t.shadow.camera||!t.shadow.mapSize)return da;let i=t.shadow,r=Math.floor(i.mapSize.x),n=Math.floor(i.mapSize.y);t.target.updateMatrixWorld(!0),i.camera.updateProjectionMatrix(),i.updateMatrices(t);let s=this.shadowMap.autoUpdate===!1;s&&this.shadowMap.needsUpdate===!0&&(this._manualShadowRevision=this._manualShadowRevision+1>>>0,this._manualShadowRevision===0&&(this._manualShadowRevision=1),this.shadowMap.needsUpdate=!1);let o=!0;if(s){let a=this._manualShadowRevision+"|"+r+"|"+n+"|"+i.bias+"|"+i.normalBias+"|"+i.matrix.elements.join(",");o=a!==this._shadowCullingKey,this._shadowCullingKey=a}return{width:r,height:n,bias:i.bias,normalBias:i.normalBias,radius:i.radius,matrix:i.matrix,camera:i.camera,contentRevision:s?this._manualShadowRevision:void 0,refreshCulling:o}}_emit(e){let t=this.domElement,i=this._state.sequence+1,r=Hg(e,t.engineId,t.surfaceId,i);this.runtime.sendR1(r),this._state.sequence=i}render(e,t){let i=this._pendingDisposals.slice(),r=this._state.sequence;this._transaction=new Map,this._transactionListens=[];try{let n=this._render(e,t);return this._transaction=null,this._transactionListens=null,this.domElement._r1State=this._state,n}catch(n){let s=this._transaction,o=this._transactionListens;this._transaction=null,this._transactionListens=null;for(let a of o)this._unlisten(a);for(let[a,c]of s)for(let[h,u]of c)u[0]?a.set(h,u[1]):a.delete(h);throw this._state.sequence=r,this._pendingDisposals=i,n}}_render(e,t){if(this._disposed)throw new Error("three.surface: renderer is disposed");if(this.domElement.disposed)throw new Error("three.surface: canvas is disposed");if(!e||!e.isScene)throw new Error("three.invalid: render requires a Scene");if(this.outputColorSpace!==me&&N("outputColorSpace","native R1 requires SRGBColorSpace"),this.toneMapping!==un&&N("toneMapping","native R1 requires NoToneMapping"),this.xr.enabled&&N("xr"),(e.environment||e.overrideMaterial)&&N("sceneFeature","environment/overrideMaterial are outside R1 v1"),!Array.isArray(this.clippingPlanes))throw new Error("three.invalid: renderer.clippingPlanes must be an array");this.clippingPlanes.length>8&&N("clippingPlanes","R1 supports at most 8 clipping planes"),(!t||!t.isPerspectiveCamera&&!t.isOrthographicCamera)&&N("camera","R1 supports perspective and orthographic cameras"),e.matrixWorldAutoUpdate===!0&&e.updateMatrixWorld(),t.parent===null&&t.matrixWorldAutoUpdate===!0&&t.updateMatrixWorld(),t.matrixWorldInverse.copy(t.matrixWorld).invert(),this._frameGeometries=new Map,this._frameMaterials=new Map,this._frameTextures=new Map;let i=[],r=this._pendingDisposals.splice(0);for(let S of r)S.batch&&i.push(Jc(S.id)),i.push(Kc(S.id,S.kind));let n=new Set,s=new Set,o=null,a=[],c=new Map,h=new Map,u=0,f=0,d=0,p=0,m=[],g=[];$c.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),jc.setFromProjectionMatrix($c),e.traverseVisible(S=>{let C=(S.parent?h.get(S.parent)??!0:!0)&&!!S.visible&&(!S.material||S.material.visible!==!1);if(h.set(S,C),S.isLight){S.visible&&s.add(this._ensureLight(S,i)),!o&&S.visible&&S.castShadow&&(S.isDirectionalLight||S.isSpotLight)&&(o=S),c.set(S,c.get(S.parent)||0);return}if(S.isCamera){c.set(S,c.get(S.parent)||0);return}let E=c.get(S.parent)||0;if(!C){c.set(S,E);return}let P=this._ensureNode(S,E,i,C);if(P){n.add(P.id),c.set(S,P.id),P.draw&&S.castShadow&&g.push(S);let V=P.draw&&S.frustumCulled&&!jc.intersectsObject(S);if(V&&m.push(P.id),!V&&P.draw&&P.draw.parts){if(P.draw.instanceCount>0)for(let W of P.draw.parts)W.count!==0&&(u++,f+=W.count/3*P.draw.instanceCount)}else!V&&P.draw&&(u++,P.draw.primitive===0?f+=P.draw.count/3:P.draw.primitive===1?d+=P.draw.count/2:p+=P.draw.count)}else c.set(S,E)});for(let[S,A]of this._state.nodes)n.has(S)||(this._removeBatch(S,i),i.push(Zg(S)),this._mapDelete(this._state.nodes,S),a.push(A.object));for(let[S]of this._state.lights)s.has(S)||(i.push(Kc(S,oi.light)),this._mapDelete(this._state.lights,S));let _=this._ensureCamera(t,i),x=this._background(e),v=this._fog(e),b=this._shadow(e,o),M=b.camera&&b.refreshCulling===!1?this._cachedCulledShadowNodeIds:[];if(b.camera&&b.refreshCulling!==!1){$c.multiplyMatrices(b.camera.projectionMatrix,b.camera.matrixWorldInverse),jc.setFromProjectionMatrix($c);for(let S of g)S.frustumCulled&&!jc.intersectsObject(S)&&M.push(si(S));this._cachedCulledShadowNodeIds=M}if(!Number.isFinite(this.toneMappingExposure)||this.toneMappingExposure<=0)throw new Error("three.invalid: exposure must be positive finite");mr([x.r,x.g,x.b,x.a],"background");let w=b===da||!o?0:o.isSpotLight?2:1;i.push(Qg(si(e),_,x,this.toneMappingExposure,v,b,m,M,w)),this._emit(i),this._lastScene=e,this._lastCamera=t;for(let S of a)this._unlisten(S);this.info.render.frame++,this.info.render.calls=u,this.info.render.triangles=f,this.info.render.lines=d,this.info.render.points=p,this.info.memory.geometries=this._state.geometries.size,this.info.memory.textures=this._state.textures.size}dispose(){if(this._disposed)return;this._disposed=!0,this.setAnimationLoop(null),this._canvasRefreshHandle=null;for(let r of Array.from(this._canvasTextures.keys()))this._unwatchCanvasTexture(r);this._lastScene=null,this._lastCamera=null;let e=[],t=new Set,i=(r,n)=>{let s=`${n}:${r}`;t.has(s)||(t.add(s),e.push(Kc(r,n)))};for(let[r]of this._state.batches)e.push(Jc(r));for(let[r]of this._state.geometries)i(r,oi.geometry);for(let[r]of this._state.textures)i(r,oi.texture);for(let[r]of this._state.materials)i(r,oi.material);for(let[r]of this._state.nodes)i(r,oi.node);for(let[r]of this._state.lights)i(r,oi.light);for(let[r]of this._state.cameras)i(r,oi.camera);e.push(e_());try{this._emit(e)}finally{this._unlistenAll(),this._state.geometries.clear(),this._state.textures.clear(),this._state.materials.clear(),this._state.nodes.clear(),this._state.batches.clear(),this._state.lights.clear(),this._state.cameras.clear(),this.domElement.dispose(),this.domElement.renderer===this&&(this.domElement.renderer=null)}}};function c_(l){return Nu(l)}function jv(l){return l.buffer.slice(l.byteOffset,l.byteOffset+l.byteLength)}var gr=class extends le{constructor(e){super(e),this.mimeType="",this.responseType="",this._aborted=!1,this.canvas=null}setCanvas(e){return this.canvas=e,this}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._aborted=!0,this}load(e,t,i,r){e===void 0&&(e=""),e=this.path+e,e=this.manager.resolveURL(e);let n=ua(!1),s=this.canvas||n.getCanvas("main"),o=s?{canvas:s,generation:s.generation,epoch:s._assetEpoch}:null,a=Je.get(`file:${e}`),c=(u,f)=>{if(this._aborted)throw ot(e,"request aborted");if(s&&(s.disposed||s.generation!==o.generation||s._assetEpoch!==o.epoch))throw ot(e,"surface was disposed during file load");f&&f(u)},h=u=>{let f=u.bytes||on(u.data);switch(this.responseType){case"arraybuffer":return jv(f);case"json":return JSON.parse(c_(f));case"blob":return typeof Blob<"u"?new Blob([f],{type:u.mime||this.mimeType}):f;case"document":N("DOMParser","native FileLoader cannot parse XML/HTML documents");default:return c_(f)}};if(a!==void 0){this.manager.itemStart(e),Promise.resolve().then(()=>c(a,t)).catch(u=>{r&&r(u)}).finally(()=>this.manager.itemEnd(e));return}this.manager.itemStart(e),n.loadAsset(e,o).then(u=>{let f=h(u);Je.add(`file:${e}`,f),c(f,t)}).catch(u=>{r&&r(u),this.manager.itemError(e)}).finally(()=>this.manager.itemEnd(e))}};function $v(l){let e=l.bytes,t=String(l.mime||"").toLowerCase();if(t.includes("rgba")||t.includes("raw"))return{encoding:0,encoded:!1};if(e.length>=8&&e[0]===137&&e[1]===80&&e[2]===78&&e[3]===71)return{encoding:1,encoded:!0};if(e.length>=2&&e[0]===255&&e[1]===216)return{encoding:2,encoded:!0};if(t.includes("png"))return{encoding:1,encoded:!0};if(t.includes("jpeg")||t.includes("jpg"))return{encoding:2,encoded:!0};throw ot(l.url||"<texture>","only PNG, JPEG, or registered raw RGBA8 bytes are supported")}var ln=class extends le{constructor(e){super(e),this.canvas=null}setCanvas(e){return this.canvas=e,this}load(e,t,i,r){let n=new te;e=this.path+(e===void 0?"":e),e=this.manager.resolveURL(e);let s=ua(!1),o=this.canvas||s.getCanvas("main"),a=o?o.generation:0,c=o?{canvas:o,generation:a,epoch:o._assetEpoch}:null;return this.manager.itemStart(e),s.loadAsset(e,c).then(h=>{if(o&&(o.disposed||o.generation!==a||o._assetEpoch!==c.epoch))throw ot(e,"surface was disposed during texture load");let u=$v(h);n.image={data:h.bytes,width:h.width||0,height:h.height||0,mime:h.mime||"",encoding:u.encoding,encoded:u.encoded},n.needsUpdate=!0,n.userData.jsrAssetUrl=e,t&&t(n)}).catch(h=>{r&&r(h),this.manager.itemError(e)}).finally(()=>this.manager.itemEnd(e)),n}};function ku(l,e){if(e===_h)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),l;if(e===qn||e===Lo){let t=l.getIndex();if(t===null){let n=[],s=l.getAttribute("position");if(s!==void 0){for(let o=0;o<s.count;o++)n.push(o);l.setIndex(n),t=l.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),l}let i=t.count-2,r=[];if(e===qn)for(let n=1;n<=i;n++)r.push(t.getX(0)),r.push(t.getX(n)),r.push(t.getX(n+1));else for(let n=0;n<i;n++)n%2===0?(r.push(t.getX(n)),r.push(t.getX(n+1)),r.push(t.getX(n+2))):(r.push(t.getX(n+2)),r.push(t.getX(n+1)),r.push(t.getX(n)));return r.length/3!==i&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles."),l.setIndex(r),l.clearGroups(),l}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",e),l}function h_(l){let e=new Map,t=new Map,i=l.clone();return u_(l,i,function(r,n){e.set(n,r),t.set(r,n)}),i.traverse(function(r){if(!r.isSkinnedMesh)return;let n=r,s=e.get(r),o=s.skeleton.bones;n.skeleton=s.skeleton.clone(),n.bindMatrix.copy(s.bindMatrix),n.skeleton.bones=o.map(function(a){return t.get(a)}),n.bind(n.skeleton,n.bindMatrix)}),i}function u_(l,e,t){t(l,e);for(let i=0;i<l.children.length;i++)u_(l.children[i],e.children[i],t)}var th=class extends le{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new Yu(t)}),this.register(function(t){return new Zu(t)}),this.register(function(t){return new nf(t)}),this.register(function(t){return new sf(t)}),this.register(function(t){return new of(t)}),this.register(function(t){return new Ku(t)}),this.register(function(t){return new ju(t)}),this.register(function(t){return new $u(t)}),this.register(function(t){return new Qu(t)}),this.register(function(t){return new Xu(t)}),this.register(function(t){return new ef(t)}),this.register(function(t){return new Ju(t)}),this.register(function(t){return new rf(t)}),this.register(function(t){return new tf(t)}),this.register(function(t){return new Wu(t)}),this.register(function(t){return new ih(t,ie.EXT_MESHOPT_COMPRESSION)}),this.register(function(t){return new ih(t,ie.KHR_MESHOPT_COMPRESSION)}),this.register(function(t){return new af(t)})}load(e,t,i,r){let n=this,s;if(this.resourcePath!=="")s=this.resourcePath;else if(this.path!==""){let c=Dt.extractUrlBase(e);s=Dt.resolveURL(c,this.path)}else s=Dt.extractUrlBase(e);this.manager.itemStart(e);let o=function(c){r?r(c):console.error(c),n.manager.itemError(e),n.manager.itemEnd(e)},a=new gr(this.manager);a.setPath(this.path),a.setResponseType("arraybuffer"),a.setRequestHeader(this.requestHeader),a.setWithCredentials(this.withCredentials),a.load(e,function(c){try{n.parse(c,s,function(h){t(h),n.manager.itemEnd(e)},o)}catch(h){o(h)}},i,o)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,i,r){let n,s={},o={},a=new TextDecoder;if(typeof e=="string")n=JSON.parse(e);else if(e instanceof ArrayBuffer)if(a.decode(new Uint8Array(e,0,4))===g_){try{s[ie.KHR_BINARY_GLTF]=new lf(e)}catch(u){r&&r(u);return}n=JSON.parse(s[ie.KHR_BINARY_GLTF].content)}else n=JSON.parse(a.decode(e));else n=e;if(n.asset===void 0||n.asset.version[0]<2){r&&r(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}let c=new mf(n,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});c.fileLoader.setRequestHeader(this.requestHeader);for(let h=0;h<this.pluginCallbacks.length;h++){let u=this.pluginCallbacks[h](c);u.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),o[u.name]=u,s[u.name]=!0}if(n.extensionsUsed)for(let h=0;h<n.extensionsUsed.length;++h){let u=n.extensionsUsed[h],f=n.extensionsRequired||[];switch(u){case ie.KHR_MATERIALS_UNLIT:s[u]=new qu;break;case ie.KHR_DRACO_MESH_COMPRESSION:s[u]=new cf(n,this.dracoLoader);break;case ie.KHR_TEXTURE_TRANSFORM:s[u]=new hf;break;case ie.KHR_MESH_QUANTIZATION:s[u]=new uf;break;default:f.indexOf(u)>=0&&o[u]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+u+'".')}}c.setExtensions(s),c.setPlugins(o),c.parse(i,r)}parseAsync(e,t){let i=this;return new Promise(function(r,n){i.parse(e,t,r,n)})}};function Qv(){let l={};return{get:function(e){return l[e]},add:function(e,t){l[e]=t},remove:function(e){delete l[e]},removeAll:function(){l={}}}}function Be(l,e,t){let i=l.json.materials[e];return i.extensions&&i.extensions[t]?i.extensions[t]:null}var ie={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",KHR_MESHOPT_COMPRESSION:"KHR_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"},Wu=class{constructor(e){this.parser=e,this.name=ie.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){let e=this.parser,t=this.parser.json.nodes||[];for(let i=0,r=t.length;i<r;i++){let n=t[i];n.extensions&&n.extensions[this.name]&&n.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,n.extensions[this.name].light)}}_loadLight(e){let t=this.parser,i="light:"+e,r=t.cache.get(i);if(r)return r;let n=t.json,a=((n.extensions&&n.extensions[this.name]||{}).lights||[])[e],c,h=new I(16777215);a.color!==void 0&&h.setRGB(a.color[0],a.color[1],a.color[2],$e);let u=a.range!==void 0?a.range:0;switch(a.type){case"directional":c=new hr(h),c.target.position.set(0,0,-1),c.add(c.target);break;case"point":c=new cr(h),c.distance=u;break;case"spot":c=new lr(h),c.distance=u,a.spot=a.spot||{},a.spot.innerConeAngle=a.spot.innerConeAngle!==void 0?a.spot.innerConeAngle:0,a.spot.outerConeAngle=a.spot.outerConeAngle!==void 0?a.spot.outerConeAngle:Math.PI/4,c.angle=a.spot.outerConeAngle,c.penumbra=1-a.spot.innerConeAngle/a.spot.outerConeAngle,c.target.position.set(0,0,-1),c.add(c.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+a.type)}return c.position.set(0,0,0),vi(c,a),a.intensity!==void 0&&(c.intensity=a.intensity),c.name=t.createUniqueName(a.name||"light_"+e),r=Promise.resolve(c),t.cache.add(i,r),r}getDependency(e,t){if(e==="light")return this._loadLight(t)}createNodeAttachment(e){let t=this,i=this.parser,n=i.json.nodes[e],o=(n.extensions&&n.extensions[this.name]||{}).light;return o===void 0?null:this._loadLight(o).then(function(a){return i._getNodeRef(t.cache,o,a)})}},qu=class{constructor(){this.name=ie.KHR_MATERIALS_UNLIT}getMaterialType(){return Se}extendParams(e,t,i){let r=[];e.color=new I(1,1,1),e.opacity=1;let n=t.pbrMetallicRoughness;if(n){if(Array.isArray(n.baseColorFactor)){let s=n.baseColorFactor;e.color.setRGB(s[0],s[1],s[2],$e),e.opacity=s[3]}n.baseColorTexture!==void 0&&r.push(i.assignTexture(e,"map",n.baseColorTexture,me))}return Promise.all(r)}},Xu=class{constructor(e){this.parser=e,this.name=ie.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){let i=Be(this.parser,e,this.name);return i===null||i.emissiveStrength!==void 0&&(t.emissiveIntensity=i.emissiveStrength),Promise.resolve()}},Yu=class{constructor(e){this.parser=e,this.name=ie.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){return Be(this.parser,e,this.name)!==null?Ze:null}extendMaterialParams(e,t){let i=Be(this.parser,e,this.name);if(i===null)return Promise.resolve();let r=[];if(i.clearcoatFactor!==void 0&&(t.clearcoat=i.clearcoatFactor),i.clearcoatTexture!==void 0&&r.push(this.parser.assignTexture(t,"clearcoatMap",i.clearcoatTexture)),i.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=i.clearcoatRoughnessFactor),i.clearcoatRoughnessTexture!==void 0&&r.push(this.parser.assignTexture(t,"clearcoatRoughnessMap",i.clearcoatRoughnessTexture)),i.clearcoatNormalTexture!==void 0&&(r.push(this.parser.assignTexture(t,"clearcoatNormalMap",i.clearcoatNormalTexture)),i.clearcoatNormalTexture.scale!==void 0)){let n=i.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new T(n,n)}return Promise.all(r)}},Zu=class{constructor(e){this.parser=e,this.name=ie.KHR_MATERIALS_DISPERSION}getMaterialType(e){return Be(this.parser,e,this.name)!==null?Ze:null}extendMaterialParams(e,t){let i=Be(this.parser,e,this.name);return i===null||(t.dispersion=i.dispersion!==void 0?i.dispersion:0),Promise.resolve()}},Ju=class{constructor(e){this.parser=e,this.name=ie.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){return Be(this.parser,e,this.name)!==null?Ze:null}extendMaterialParams(e,t){let i=Be(this.parser,e,this.name);if(i===null)return Promise.resolve();let r=[];return i.iridescenceFactor!==void 0&&(t.iridescence=i.iridescenceFactor),i.iridescenceTexture!==void 0&&r.push(this.parser.assignTexture(t,"iridescenceMap",i.iridescenceTexture)),i.iridescenceIor!==void 0&&(t.iridescenceIOR=i.iridescenceIor),t.iridescenceThicknessRange===void 0&&(t.iridescenceThicknessRange=[100,400]),i.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessRange[0]=i.iridescenceThicknessMinimum),i.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessRange[1]=i.iridescenceThicknessMaximum),i.iridescenceThicknessTexture!==void 0&&r.push(this.parser.assignTexture(t,"iridescenceThicknessMap",i.iridescenceThicknessTexture)),Promise.all(r)}},Ku=class{constructor(e){this.parser=e,this.name=ie.KHR_MATERIALS_SHEEN}getMaterialType(e){return Be(this.parser,e,this.name)!==null?Ze:null}extendMaterialParams(e,t){let i=Be(this.parser,e,this.name);if(i===null)return Promise.resolve();let r=[];if(t.sheenColor=new I(0,0,0),t.sheenRoughness=0,t.sheen=1,i.sheenColorFactor!==void 0){let n=i.sheenColorFactor;t.sheenColor.setRGB(n[0],n[1],n[2],$e)}return i.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=i.sheenRoughnessFactor),i.sheenColorTexture!==void 0&&r.push(this.parser.assignTexture(t,"sheenColorMap",i.sheenColorTexture,me)),i.sheenRoughnessTexture!==void 0&&r.push(this.parser.assignTexture(t,"sheenRoughnessMap",i.sheenRoughnessTexture)),Promise.all(r)}},ju=class{constructor(e){this.parser=e,this.name=ie.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){return Be(this.parser,e,this.name)!==null?Ze:null}extendMaterialParams(e,t){let i=Be(this.parser,e,this.name);if(i===null)return Promise.resolve();let r=[];return i.transmissionFactor!==void 0&&(t.transmission=i.transmissionFactor),i.transmissionTexture!==void 0&&r.push(this.parser.assignTexture(t,"transmissionMap",i.transmissionTexture)),Promise.all(r)}},$u=class{constructor(e){this.parser=e,this.name=ie.KHR_MATERIALS_VOLUME}getMaterialType(e){return Be(this.parser,e,this.name)!==null?Ze:null}extendMaterialParams(e,t){let i=Be(this.parser,e,this.name);if(i===null)return Promise.resolve();let r=[];t.thickness=i.thicknessFactor!==void 0?i.thicknessFactor:0,i.thicknessTexture!==void 0&&r.push(this.parser.assignTexture(t,"thicknessMap",i.thicknessTexture)),t.attenuationDistance=i.attenuationDistance||1/0;let n=i.attenuationColor||[1,1,1];return t.attenuationColor=new I().setRGB(n[0],n[1],n[2],$e),Promise.all(r)}},Qu=class{constructor(e){this.parser=e,this.name=ie.KHR_MATERIALS_IOR}getMaterialType(e){return Be(this.parser,e,this.name)!==null?Ze:null}extendMaterialParams(e,t){let i=Be(this.parser,e,this.name);return i===null||(t.ior=i.ior!==void 0?i.ior:1.5,t.ior===0&&(t.ior=1e3)),Promise.resolve()}},ef=class{constructor(e){this.parser=e,this.name=ie.KHR_MATERIALS_SPECULAR}getMaterialType(e){return Be(this.parser,e,this.name)!==null?Ze:null}extendMaterialParams(e,t){let i=Be(this.parser,e,this.name);if(i===null)return Promise.resolve();let r=[];t.specularIntensity=i.specularFactor!==void 0?i.specularFactor:1,i.specularTexture!==void 0&&r.push(this.parser.assignTexture(t,"specularIntensityMap",i.specularTexture));let n=i.specularColorFactor||[1,1,1];return t.specularColor=new I().setRGB(n[0],n[1],n[2],$e),i.specularColorTexture!==void 0&&r.push(this.parser.assignTexture(t,"specularColorMap",i.specularColorTexture,me)),Promise.all(r)}},tf=class{constructor(e){this.parser=e,this.name=ie.EXT_MATERIALS_BUMP}getMaterialType(e){return Be(this.parser,e,this.name)!==null?Ze:null}extendMaterialParams(e,t){let i=Be(this.parser,e,this.name);if(i===null)return Promise.resolve();let r=[];return t.bumpScale=i.bumpFactor!==void 0?i.bumpFactor:1,i.bumpTexture!==void 0&&r.push(this.parser.assignTexture(t,"bumpMap",i.bumpTexture)),Promise.all(r)}},rf=class{constructor(e){this.parser=e,this.name=ie.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){return Be(this.parser,e,this.name)!==null?Ze:null}extendMaterialParams(e,t){let i=Be(this.parser,e,this.name);if(i===null)return Promise.resolve();let r=[];return i.anisotropyStrength!==void 0&&(t.anisotropy=i.anisotropyStrength),i.anisotropyRotation!==void 0&&(t.anisotropyRotation=i.anisotropyRotation),i.anisotropyTexture!==void 0&&r.push(this.parser.assignTexture(t,"anisotropyMap",i.anisotropyTexture)),Promise.all(r)}},nf=class{constructor(e){this.parser=e,this.name=ie.KHR_TEXTURE_BASISU}loadTexture(e){let t=this.parser,i=t.json,r=i.textures[e];if(!r.extensions||!r.extensions[this.name])return null;let n=r.extensions[this.name],s=t.options.ktx2Loader;if(!s){if(i.extensionsRequired&&i.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(e,n.source,s)}},sf=class{constructor(e){this.parser=e,this.name=ie.EXT_TEXTURE_WEBP}loadTexture(e){let t=this.name,i=this.parser,r=i.json,n=r.textures[e];if(!n.extensions||!n.extensions[t])return null;let s=n.extensions[t],o=r.images[s.source],a=i.textureLoader;if(o.uri){let c=i.options.manager.getHandler(o.uri);c!==null&&(a=c)}return i.loadTextureImage(e,s.source,a)}},of=class{constructor(e){this.parser=e,this.name=ie.EXT_TEXTURE_AVIF}loadTexture(e){let t=this.name,i=this.parser,r=i.json,n=r.textures[e];if(!n.extensions||!n.extensions[t])return null;let s=n.extensions[t],o=r.images[s.source],a=i.textureLoader;if(o.uri){let c=i.options.manager.getHandler(o.uri);c!==null&&(a=c)}return i.loadTextureImage(e,s.source,a)}},ih=class{constructor(e,t){this.name=t,this.parser=e}loadBufferView(e){let t=this.parser.json,i=t.bufferViews[e];if(i.extensions&&i.extensions[this.name]){let r=i.extensions[this.name],n=this.parser.getDependency("buffer",r.buffer),s=this.parser.options.meshoptDecoder;if(!s||!s.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return n.then(function(o){let a=r.byteOffset||0,c=r.byteLength||0,h=r.count,u=r.byteStride,f=new Uint8Array(o,a,c);return s.decodeGltfBufferAsync?s.decodeGltfBufferAsync(h,u,f,r.mode,r.filter).then(function(d){return d.buffer}):s.ready.then(function(){let d=new ArrayBuffer(h*u);return s.decodeGltfBuffer(new Uint8Array(d),h,u,f,r.mode,r.filter),d})})}else return null}},af=class{constructor(e){this.name=ie.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){let t=this.parser.json,i=t.nodes[e];if(!i.extensions||!i.extensions[this.name]||i.mesh===void 0)return null;let r=t.meshes[i.mesh];for(let c of r.primitives)if(c.mode!==Xt.TRIANGLES&&c.mode!==Xt.TRIANGLE_STRIP&&c.mode!==Xt.TRIANGLE_FAN&&c.mode!==void 0)return null;let s=i.extensions[this.name].attributes,o=[],a={};for(let c in s)o.push(this.parser.getDependency("accessor",s[c]).then(h=>(a[c]=h,a[c])));return o.length<1?null:(o.push(this.parser.createNodeMesh(e)),Promise.all(o).then(c=>{let h=c.pop(),u=h.isGroup?h.children:[h],f=c[0].count,d=[];for(let p of u){let m=new F,g=new y,_=new ce,x=new y(1,1,1),v=new tr(p.geometry,p.material,f);for(let M=0;M<f;M++)a.TRANSLATION&&g.fromBufferAttribute(a.TRANSLATION,M),a.ROTATION&&_.fromBufferAttribute(a.ROTATION,M),a.SCALE&&x.fromBufferAttribute(a.SCALE,M),v.setMatrixAt(M,m.compose(g,_,x));let b=null;for(let M in a)if(M==="_COLOR_0"){let w=a[M];v.instanceColor=new it(w.array,w.itemSize,w.normalized)}else if(M!=="TRANSLATION"&&M!=="ROTATION"&&M!=="SCALE"){if(b===null){let S=v.geometry;b=new L,b.name=S.name;for(let A in S.attributes)b.setAttribute(A,S.attributes[A]);for(let A in S.morphAttributes)b.morphAttributes[A]=S.morphAttributes[A];S.index!==null&&b.setIndex(S.index),b.morphTargetsRelative=S.morphTargetsRelative;for(let A of S.groups)b.addGroup(A.start,A.count,A.materialIndex);S.boundingBox!==null&&(b.boundingBox=S.boundingBox.clone()),S.boundingSphere!==null&&(b.boundingSphere=S.boundingSphere.clone()),b.drawRange.start=S.drawRange.start,b.drawRange.count=S.drawRange.count,b.userData=Object.assign({},S.userData),v.geometry=b}let w=a[M];b.setAttribute(M,new it(w.array,w.itemSize,w.normalized))}G.prototype.copy.call(v,p),this.parser.assignFinalMaterial(v),d.push(v)}return h.isGroup?(h.clear(),h.add(...d),h):d[0]}))}},g_="glTF",pa=12,f_={JSON:1313821514,BIN:5130562},lf=class{constructor(e){this.name=ie.KHR_BINARY_GLTF,this.content=null,this.body=null;let t=new DataView(e,0,pa),i=new TextDecoder;if(this.header={magic:i.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==g_)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");let r=this.header.length-pa,n=new DataView(e,pa),s=0;for(;s<r;){let o=n.getUint32(s,!0);s+=4;let a=n.getUint32(s,!0);if(s+=4,a===f_.JSON){let c=new Uint8Array(e,pa+s,o);this.content=i.decode(c)}else if(a===f_.BIN){let c=pa+s;this.body=e.slice(c,c+o)}s+=o}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}},cf=class{constructor(e,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=ie.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){let i=this.json,r=this.dracoLoader,n=e.extensions[this.name].bufferView,s=e.extensions[this.name].attributes,o={},a={},c={};for(let h in s){let u=df[h]||h.toLowerCase();o[u]=s[h]}for(let h in e.attributes){let u=df[h]||h.toLowerCase();if(s[h]!==void 0){let f=i.accessors[e.attributes[h]],d=co[f.componentType];c[u]=d.name,a[u]=f.normalized===!0}}return t.getDependency("bufferView",n).then(function(h){return new Promise(function(u,f){r.decodeDracoFile(h,function(d){for(let p in d.attributes){let m=d.attributes[p],g=a[p];g!==void 0&&(m.normalized=g)}u(d)},o,c,$e,f)})})}},hf=class{constructor(){this.name=ie.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){if((t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0)return e;if(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),t.rotation!==void 0){let i=Math.cos(e.rotation),r=Math.sin(e.rotation);e.matrix.set(e.repeat.x*i,e.repeat.y*r,e.offset.x,-e.repeat.x*r,e.repeat.y*i,e.offset.y,0,0,1),e.matrixAutoUpdate=!1}return e.needsUpdate=!0,e}},uf=class{constructor(){this.name=ie.KHR_MESH_QUANTIZATION}},rh=class extends st{constructor(e,t,i,r){super(e,t,i,r)}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,r=this.valueSize,n=e*r*3+r;for(let s=0;s!==r;s++)t[s]=i[n+s];return t}interpolate_(e,t,i,r){let n=this.resultBuffer,s=this.sampleValues,o=this.valueSize,a=o*2,c=o*3,h=r-t,u=(i-t)/h,f=u*u,d=f*u,p=e*c,m=p-c,g=-2*d+3*f,_=d-f,x=1-g,v=_-f+u;for(let b=0;b!==o;b++){let M=s[m+b+o],w=s[m+b+a]*h,S=s[p+b+o],A=s[p+b]*h;n[b]=x*M+v*w+g*S+_*A}return n}},eb=new ce,ff=class extends rh{interpolate_(e,t,i,r){let n=super.interpolate_(e,t,i,r);return eb.fromArray(n).normalize().toArray(n),n}},Xt={FLOAT:5126,FLOAT_MAT3:35675,FLOAT_MAT4:35676,FLOAT_VEC2:35664,FLOAT_VEC3:35665,FLOAT_VEC4:35666,LINEAR:9729,REPEAT:10497,SAMPLER_2D:35678,POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6,UNSIGNED_BYTE:5121,UNSIGNED_SHORT:5123},co={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},d_={9728:fe,9729:de,9984:vr,9985:mo,9986:br,9987:Ut},p_={33071:Ue,33648:Yt,10497:wt},Vu={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},df={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},_r={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},tb={CUBICSPLINE:void 0,LINEAR:Gi,STEP:li},Gu={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function ib(l){return l.DefaultMaterial===void 0&&(l.DefaultMaterial=new ei({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:Mi})),l.DefaultMaterial}function cn(l,e,t){for(let i in t.extensions)l[i]===void 0&&(e.userData.gltfExtensions=e.userData.gltfExtensions||{},e.userData.gltfExtensions[i]=t.extensions[i])}function vi(l,e){e.extras!==void 0&&(typeof e.extras=="object"?Object.assign(l.userData,e.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+e.extras))}function rb(l,e,t){let i=!1,r=!1,n=!1;for(let c=0,h=e.length;c<h;c++){let u=e[c];if(u.POSITION!==void 0&&(i=!0),u.NORMAL!==void 0&&(r=!0),u.COLOR_0!==void 0&&(n=!0),i&&r&&n)break}if(!i&&!r&&!n)return Promise.resolve(l);let s=[],o=[],a=[];for(let c=0,h=e.length;c<h;c++){let u=e[c];if(i){let f=u.POSITION!==void 0?t.getDependency("accessor",u.POSITION):l.attributes.position;s.push(f)}if(r){let f=u.NORMAL!==void 0?t.getDependency("accessor",u.NORMAL):l.attributes.normal;o.push(f)}if(n){let f=u.COLOR_0!==void 0?t.getDependency("accessor",u.COLOR_0):l.attributes.color;a.push(f)}}return Promise.all([Promise.all(s),Promise.all(o),Promise.all(a)]).then(function(c){let h=c[0],u=c[1],f=c[2];return i&&(l.morphAttributes.position=h),r&&(l.morphAttributes.normal=u),n&&(l.morphAttributes.color=f),l.morphTargetsRelative=!0,l})}function nb(l,e){if(l.updateMorphTargets(),e.weights!==void 0)for(let t=0,i=e.weights.length;t<i;t++)l.morphTargetInfluences[t]=e.weights[t];if(e.extras&&Array.isArray(e.extras.targetNames)){let t=e.extras.targetNames;if(l.morphTargetInfluences.length===t.length){l.morphTargetDictionary={};for(let i=0,r=t.length;i<r;i++)l.morphTargetDictionary[t[i]]=i}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function sb(l){let e,t=l.extensions&&l.extensions[ie.KHR_DRACO_MESH_COMPRESSION];if(t?e="draco:"+t.bufferView+":"+t.indices+":"+Hu(t.attributes):e=l.indices+":"+Hu(l.attributes)+":"+l.mode,l.targets!==void 0)for(let i=0,r=l.targets.length;i<r;i++)e+=":"+Hu(l.targets[i]);return e}function Hu(l){let e="",t=Object.keys(l).sort();for(let i=0,r=t.length;i<r;i++)e+=t[i]+":"+l[t[i]]+";";return e}function pf(l){switch(l){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function ob(l){return l.search(/\.jpe?g($|\?)/i)>0||l.search(/^data\:image\/jpeg/)===0?"image/jpeg":l.search(/\.webp($|\?)/i)>0||l.search(/^data\:image\/webp/)===0?"image/webp":l.search(/\.ktx2($|\?)/i)>0||l.search(/^data\:image\/ktx2/)===0?"image/ktx2":"image/png"}var ab=new F,mf=class{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new Qv,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let i=!1,r=-1,n=!1,s=-1;if(typeof navigator<"u"&&typeof navigator.userAgent<"u"){let o=navigator.userAgent;i=/^((?!chrome|android).)*safari/i.test(o)===!0;let a=o.match(/Version\/(\d+)/);r=i&&a?parseInt(a[1],10):-1,n=o.indexOf("Firefox")>-1,s=n?o.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>"u"||i&&r<17||n&&s<98?this.textureLoader=new ln(this.options.manager):this.textureLoader=new Ks(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new gr(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){let i=this,r=this.json,n=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(s){return s._markDefs&&s._markDefs()}),Promise.all(this._invokeAll(function(s){return s.beforeRoot&&s.beforeRoot()})).then(function(){return Promise.all([i.getDependencies("scene"),i.getDependencies("animation"),i.getDependencies("camera")])}).then(function(s){let o={scene:s[0][r.scene||0],scenes:s[0],animations:s[1],cameras:s[2],asset:r.asset,parser:i,userData:{}};return cn(n,o,r),vi(o,r),Promise.all(i._invokeAll(function(a){return a.afterRoot&&a.afterRoot(o)})).then(function(){for(let a of o.scenes)a.updateMatrixWorld();e(o)})}).catch(t)}_markDefs(){let e=this.json.nodes||[],t=this.json.skins||[],i=this.json.meshes||[];for(let r=0,n=t.length;r<n;r++){let s=t[r].joints;for(let o=0,a=s.length;o<a;o++)e[s[o]].isBone=!0}for(let r=0,n=e.length;r<n;r++){let s=e[r];s.mesh!==void 0&&(this._addNodeRef(this.meshCache,s.mesh),s.skin!==void 0&&(i[s.mesh].isSkinnedMesh=!0)),s.camera!==void 0&&this._addNodeRef(this.cameraCache,s.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,i){if(e.refs[t]<=1)return i;let r=i.clone(),n=(s,o)=>{let a=this.associations.get(s);a!=null&&this.associations.set(o,a);for(let[c,h]of s.children.entries())n(h,o.children[c])};return n(i,r),r.name+="_instance_"+e.uses[t]++,r}_invokeOne(e){let t=Object.values(this.plugins);t.push(this);for(let i=0;i<t.length;i++){let r=e(t[i]);if(r)return r}return null}_invokeAll(e){let t=Object.values(this.plugins);t.unshift(this);let i=[];for(let r=0;r<t.length;r++){let n=e(t[r]);n&&i.push(n)}return i}getDependency(e,t){let i=e+":"+t,r=this.cache.get(i);if(!r){switch(e){case"scene":r=this.loadScene(t);break;case"node":r=this._invokeOne(function(n){return n.loadNode&&n.loadNode(t)});break;case"mesh":r=this._invokeOne(function(n){return n.loadMesh&&n.loadMesh(t)});break;case"accessor":r=this.loadAccessor(t);break;case"bufferView":r=this._invokeOne(function(n){return n.loadBufferView&&n.loadBufferView(t)});break;case"buffer":r=this.loadBuffer(t);break;case"material":r=this._invokeOne(function(n){return n.loadMaterial&&n.loadMaterial(t)});break;case"texture":r=this._invokeOne(function(n){return n.loadTexture&&n.loadTexture(t)});break;case"skin":r=this.loadSkin(t);break;case"animation":r=this._invokeOne(function(n){return n.loadAnimation&&n.loadAnimation(t)});break;case"camera":r=this.loadCamera(t);break;default:if(r=this._invokeOne(function(n){return n!=this&&n.getDependency&&n.getDependency(e,t)}),!r)throw new Error("Unknown type: "+e);break}this.cache.add(i,r)}return r}getDependencies(e){let t=this.cache.get(e);if(!t){let i=this,r=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(r.map(function(n,s){return i.getDependency(e,s)})),this.cache.add(e,t)}return t}loadBuffer(e){let t=this.json.buffers[e],i=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[ie.KHR_BINARY_GLTF].body);let r=this.options;return new Promise(function(n,s){i.load(Dt.resolveURL(t.uri,r.path),n,void 0,function(){s(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){let t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(i){let r=t.byteLength||0,n=t.byteOffset||0;return i.slice(n,n+r)})}loadAccessor(e){let t=this,i=this.json,r=this.json.accessors[e];if(r.bufferView===void 0&&r.sparse===void 0){let s=Vu[r.type],o=co[r.componentType],a=r.normalized===!0,c=new o(r.count*s);return Promise.resolve(new K(c,s,a))}let n=[];return r.bufferView!==void 0?n.push(this.getDependency("bufferView",r.bufferView)):n.push(null),r.sparse!==void 0&&(n.push(this.getDependency("bufferView",r.sparse.indices.bufferView)),n.push(this.getDependency("bufferView",r.sparse.values.bufferView))),Promise.all(n).then(function(s){let o=s[0],a=Vu[r.type],c=co[r.componentType],h=c.BYTES_PER_ELEMENT,u=h*a,f=r.byteOffset||0,d=r.bufferView!==void 0?i.bufferViews[r.bufferView].byteStride:void 0,p=r.normalized===!0,m,g;if(d&&d!==u){let _=Math.floor(f/d),x="InterleavedBuffer:"+r.bufferView+":"+r.componentType+":"+_+":"+r.count,v=t.cache.get(x);v||(m=new c(o,_*d,r.count*d/h),v=new It(m,d/h),t.cache.add(x,v)),g=new Rt(v,a,f%d/h,p)}else o===null?m=new c(r.count*a):m=new c(o,f,r.count*a),g=new K(m,a,p);if(r.sparse!==void 0){let _=Vu.SCALAR,x=co[r.sparse.indices.componentType],v=r.sparse.indices.byteOffset||0,b=r.sparse.values.byteOffset||0,M=new x(s[1],v,r.sparse.count*_),w=new c(s[2],b,r.sparse.count*a);o!==null&&(g=new K(g.array.slice(),g.itemSize,g.normalized)),g.normalized=!1;for(let S=0,A=M.length;S<A;S++){let C=M[S];if(g.setX(C,w[S*a]),a>=2&&g.setY(C,w[S*a+1]),a>=3&&g.setZ(C,w[S*a+2]),a>=4&&g.setW(C,w[S*a+3]),a>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}g.normalized=p}return g})}loadTexture(e){let t=this.json,i=this.options,n=t.textures[e].source,s=t.images[n],o=this.textureLoader;if(s.uri){let a=i.manager.getHandler(s.uri);a!==null&&(o=a)}return this.loadTextureImage(e,n,o)}loadTextureImage(e,t,i){let r=this,n=this.json,s=n.textures[e],o=n.images[t],a=(o.uri||o.bufferView)+":"+s.sampler;if(this.textureCache[a])return this.textureCache[a];let c=this.loadImageSource(t,i).then(function(h){h.flipY=!1,h.name=s.name||o.name||"",h.name===""&&typeof o.uri=="string"&&o.uri.startsWith("data:image/")===!1&&(h.name=o.uri);let f=(n.samplers||{})[s.sampler]||{};return h.magFilter=d_[f.magFilter]||de,h.minFilter=d_[f.minFilter]||Ut,h.wrapS=p_[f.wrapS]||wt,h.wrapT=p_[f.wrapT]||wt,h.generateMipmaps=!h.isCompressedTexture&&h.minFilter!==fe&&h.minFilter!==de,r.associations.set(h,{textures:e}),h}).catch(function(){return null});return this.textureCache[a]=c,c}loadImageSource(e,t){let i=this,r=this.json,n=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(u=>u.clone());let s=r.images[e],o=self.URL||self.webkitURL,a=s.uri||"",c=!1;if(s.bufferView!==void 0)a=i.getDependency("bufferView",s.bufferView).then(function(u){c=!0;let f=new Blob([u],{type:s.mimeType});return a=o.createObjectURL(f),a});else if(s.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");let h=Promise.resolve(a).then(function(u){return new Promise(function(f,d){let p=f;t.isImageBitmapLoader===!0&&(p=function(m){let g=new te(m);g.needsUpdate=!0,f(g)}),t.load(Dt.resolveURL(u,n.path),p,void 0,d)})}).then(function(u){return c===!0&&o.revokeObjectURL(a),vi(u,s),u.userData.mimeType=s.mimeType||ob(s.uri),u}).catch(function(u){throw console.error("THREE.GLTFLoader: Couldn't load texture",a),u});return this.sourceCache[e]=h,h}assignTexture(e,t,i,r){let n=this;return this.getDependency("texture",i.index).then(function(s){if(!s)return null;if(i.texCoord!==void 0&&i.texCoord>0&&(s=s.clone(),s.channel=i.texCoord),n.extensions[ie.KHR_TEXTURE_TRANSFORM]){let o=i.extensions!==void 0?i.extensions[ie.KHR_TEXTURE_TRANSFORM]:void 0;if(o){let a=n.associations.get(s);s=n.extensions[ie.KHR_TEXTURE_TRANSFORM].extendTexture(s,o),n.associations.set(s,a)}}return r!==void 0&&(s.colorSpace=r),e[t]=s,s})}assignFinalMaterial(e){let t=e.geometry,i=e.material,r=t.attributes.tangent===void 0,n=t.attributes.color!==void 0,s=t.attributes.normal===void 0;if(e.isPoints){let o="PointsMaterial:"+i.uuid,a=this.cache.get(o);a||(a=new ui,$.prototype.copy.call(a,i),a.color.copy(i.color),a.map=i.map,a.sizeAttenuation=!1,this.cache.add(o,a)),i=a}else if(e.isLine){let o="LineBasicMaterial:"+i.uuid,a=this.cache.get(o);a||(a=new re,$.prototype.copy.call(a,i),a.color.copy(i.color),a.map=i.map,this.cache.add(o,a)),i=a}if(r||n||s){let o="ClonedMaterial:"+i.uuid+":";r&&(o+="derivative-tangents:"),n&&(o+="vertex-colors:"),s&&(o+="flat-shading:");let a=this.cache.get(o);a||(a=i.clone(),n&&(a.vertexColors=!0),s&&(a.flatShading=!0),r&&(a.normalScale&&(a.normalScale.y*=-1),a.clearcoatNormalScale&&(a.clearcoatNormalScale.y*=-1)),this.cache.add(o,a),this.associations.set(a,this.associations.get(i))),i=a}e.material=i}getMaterialType(){return ei}loadMaterial(e){let t=this,i=this.json,r=this.extensions,n=i.materials[e],s,o={},a=n.extensions||{},c=[];if(a[ie.KHR_MATERIALS_UNLIT]){let u=r[ie.KHR_MATERIALS_UNLIT];s=u.getMaterialType(),c.push(u.extendParams(o,n,t))}else{let u=n.pbrMetallicRoughness||{};if(o.color=new I(1,1,1),o.opacity=1,Array.isArray(u.baseColorFactor)){let f=u.baseColorFactor;o.color.setRGB(f[0],f[1],f[2],$e),o.opacity=f[3]}u.baseColorTexture!==void 0&&c.push(t.assignTexture(o,"map",u.baseColorTexture,me)),o.metalness=u.metallicFactor!==void 0?u.metallicFactor:1,o.roughness=u.roughnessFactor!==void 0?u.roughnessFactor:1,u.metallicRoughnessTexture!==void 0&&(c.push(t.assignTexture(o,"metalnessMap",u.metallicRoughnessTexture)),c.push(t.assignTexture(o,"roughnessMap",u.metallicRoughnessTexture))),s=this._invokeOne(function(f){return f.getMaterialType&&f.getMaterialType(e)}),c.push(Promise.all(this._invokeAll(function(f){return f.extendMaterialParams&&f.extendMaterialParams(e,o)})))}n.doubleSided===!0&&(o.side=uo);let h=n.alphaMode||Gu.OPAQUE;if(h===Gu.BLEND?(o.transparent=!0,o.depthWrite=!1):(o.transparent=!1,h===Gu.MASK&&(o.alphaTest=n.alphaCutoff!==void 0?n.alphaCutoff:.5)),n.normalTexture!==void 0&&s!==Se&&(c.push(t.assignTexture(o,"normalMap",n.normalTexture)),o.normalScale=new T(1,1),n.normalTexture.scale!==void 0)){let u=n.normalTexture.scale;o.normalScale.set(u,u)}if(n.occlusionTexture!==void 0&&s!==Se&&(c.push(t.assignTexture(o,"aoMap",n.occlusionTexture)),n.occlusionTexture.strength!==void 0&&(o.aoMapIntensity=n.occlusionTexture.strength)),n.emissiveFactor!==void 0&&s!==Se){let u=n.emissiveFactor;o.emissive=new I().setRGB(u[0],u[1],u[2],$e)}return n.emissiveTexture!==void 0&&s!==Se&&c.push(t.assignTexture(o,"emissiveMap",n.emissiveTexture,me)),Promise.all(c).then(function(){let u=new s(o);return n.name&&(u.name=n.name),vi(u,n),t.associations.set(u,{materials:e}),n.extensions&&cn(r,u,n),u})}createUniqueName(e){let t=ne.sanitizeNodeName(e||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){let t=this,i=this.extensions,r=this.primitiveCache;function n(o){return i[ie.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(o,t).then(function(a){return m_(a,o,t)})}let s=[];for(let o=0,a=e.length;o<a;o++){let c=e[o],h=sb(c),u=r[h];if(u)s.push(u.promise);else{let f;c.extensions&&c.extensions[ie.KHR_DRACO_MESH_COMPRESSION]?f=n(c):f=m_(new L,c,t),c.mode===Xt.TRIANGLE_STRIP?f=f.then(d=>ku(d,Lo)):c.mode===Xt.TRIANGLE_FAN&&(f=f.then(d=>ku(d,qn))),r[h]={primitive:c,promise:f},s.push(f)}}return Promise.all(s)}loadMesh(e){let t=this,i=this.json,r=this.extensions,n=i.meshes[e],s=n.primitives,o=[];for(let a=0,c=s.length;a<c;a++){let h=s[a].material===void 0?ib(this.cache):this.getDependency("material",s[a].material);o.push(h)}return o.push(t.loadGeometries(s)),Promise.all(o).then(async function(a){let c=a.slice(0,a.length-1),h=a[a.length-1],u=[];for(let d=0,p=h.length;d<p;d++){let m=h[d],g=s[d],_,x=c[d];if(g.mode===Xt.TRIANGLES||g.mode===Xt.TRIANGLE_STRIP||g.mode===Xt.TRIANGLE_FAN||g.mode===void 0){let v=n.isSkinnedMesh===!0,b=m.hasAttribute("skinIndex")&&m.hasAttribute("skinWeight");v&&b===!1&&console.warn("THREE.GLTFLoader: Missing skinIndex or skinWeight attributes. Skinning disabled."),_=v&&b?new Qi(m,x):new ae(m,x),_.isSkinnedMesh===!0&&_.normalizeSkinWeights()}else if(g.mode===Xt.LINES)_=new Me(m,x);else if(g.mode===Xt.LINE_STRIP)_=new ke(m,x);else if(g.mode===Xt.LINE_LOOP)_=new ir(m,x);else if(g.mode===Xt.POINTS)_=new rr(m,x);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+g.mode);Object.keys(_.geometry.morphAttributes).length>0&&nb(_,n),_.name=t.createUniqueName(n.name||"mesh_"+e),vi(_,n),g.extensions&&cn(r,_,g),t.assignFinalMaterial(_),u.push(_)}for(let d=0,p=u.length;d<p;d++)t.associations.set(u[d],{meshes:e,primitives:d});if(u.length===1)return n.extensions&&cn(r,u[0],n),u[0];let f=new ct;n.extensions&&cn(r,f,n),t.associations.set(f,{meshes:e});for(let d=0,p=u.length;d<p;d++)f.add(u[d]);return f})}loadCamera(e){let t,i=this.json.cameras[e],r=i[i.type];if(!r){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return i.type==="perspective"?t=new ge(Ia.radToDeg(r.yfov),r.aspectRatio||1,r.znear||1,r.zfar||2e6):i.type==="orthographic"&&(t=new qt(-r.xmag,r.xmag,r.ymag,-r.ymag,r.znear,r.zfar)),i.name&&(t.name=this.createUniqueName(i.name)),vi(t,i),Promise.resolve(t)}loadSkin(e){let t=this.json.skins[e],i=[];for(let r=0,n=t.joints.length;r<n;r++)i.push(this._loadNodeShallow(t.joints[r]));return t.inverseBindMatrices!==void 0?i.push(this.getDependency("accessor",t.inverseBindMatrices)):i.push(null),Promise.all(i).then(function(r){let n=r.pop(),s=r,o=[],a=[];for(let c=0,h=s.length;c<h;c++){let u=s[c];if(u){o.push(u);let f=new F;n!==null&&f.fromArray(n.array,c*16),a.push(f)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[c])}return new er(o,a)})}loadAnimation(e){let t=this.json,i=this,r=t.animations[e],n=r.name?r.name:"animation_"+e,s=[],o=[],a=[],c=[],h=[];for(let u=0,f=r.channels.length;u<f;u++){let d=r.channels[u],p=r.samplers[d.sampler],m=d.target,g=m.node,_=r.parameters!==void 0?r.parameters[p.input]:p.input,x=r.parameters!==void 0?r.parameters[p.output]:p.output;m.node!==void 0&&(s.push(this.getDependency("node",g)),o.push(this.getDependency("accessor",_)),a.push(this.getDependency("accessor",x)),c.push(p),h.push(m))}return Promise.all([Promise.all(s),Promise.all(o),Promise.all(a),Promise.all(c),Promise.all(h)]).then(function(u){let f=u[0],d=u[1],p=u[2],m=u[3],g=u[4],_=[];for(let v=0,b=f.length;v<b;v++){let M=f[v],w=d[v],S=p[v],A=m[v],C=g[v];if(M===void 0)continue;M.updateMatrix&&M.updateMatrix();let E=i._createAnimationTracks(M,w,S,A,C);if(E)for(let P=0;P<E.length;P++)_.push(E[P])}let x=new vt(n,void 0,_);return vi(x,r),x})}createNodeMesh(e){let t=this.json,i=this,r=t.nodes[e];return r.mesh===void 0?null:i.getDependency("mesh",r.mesh).then(function(n){let s=i._getNodeRef(i.meshCache,r.mesh,n);return r.weights!==void 0&&s.traverse(function(o){if(o.isMesh)for(let a=0,c=r.weights.length;a<c;a++)o.morphTargetInfluences[a]=r.weights[a]}),s})}loadNode(e){let t=this.json,i=this,r=t.nodes[e],n=i._loadNodeShallow(e),s=[],o=r.children||[];for(let c=0,h=o.length;c<h;c++)s.push(i.getDependency("node",o[c]));let a=r.skin===void 0?Promise.resolve(null):i.getDependency("skin",r.skin);return Promise.all([n,Promise.all(s),a]).then(function(c){let h=c[0],u=c[1],f=c[2];f!==null&&h.traverse(function(d){d.isSkinnedMesh&&d.bind(f,ab)});for(let d=0,p=u.length;d<p;d++)h.add(u[d]);if(h.userData.pivot!==void 0&&u.length>0){let d=h.userData.pivot,p=u[0];h.pivot=new y().fromArray(d),h.position.x-=d[0],h.position.y-=d[1],h.position.z-=d[2],p.position.set(0,0,0),delete h.userData.pivot}return h})}_loadNodeShallow(e){let t=this.json,i=this.extensions,r=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];let n=t.nodes[e],s=n.name?r.createUniqueName(n.name):"",o=[],a=r._invokeOne(function(c){return c.createNodeMesh&&c.createNodeMesh(e)});return a&&o.push(a),n.camera!==void 0&&o.push(r.getDependency("camera",n.camera).then(function(c){return r._getNodeRef(r.cameraCache,n.camera,c)})),r._invokeAll(function(c){return c.createNodeAttachment&&c.createNodeAttachment(e)}).forEach(function(c){o.push(c)}),this.nodeCache[e]=Promise.all(o).then(function(c){let h;if(n.isBone===!0?h=new hi:c.length>1?h=new ct:c.length===1?h=c[0]:h=new G,h!==c[0])for(let u=0,f=c.length;u<f;u++)h.add(c[u]);if(n.name&&(h.userData.name=n.name,h.name=s),vi(h,n),n.extensions&&cn(i,h,n),n.matrix!==void 0){let u=new F;u.fromArray(n.matrix),h.applyMatrix4(u)}else n.translation!==void 0&&h.position.fromArray(n.translation),n.rotation!==void 0&&h.quaternion.fromArray(n.rotation),n.scale!==void 0&&h.scale.fromArray(n.scale);if(!r.associations.has(h))r.associations.set(h,{});else if(n.mesh!==void 0&&r.meshCache.refs[n.mesh]>1){let u=r.associations.get(h);r.associations.set(h,{...u})}return r.associations.get(h).nodes=e,h}),this.nodeCache[e]}loadScene(e){let t=this.extensions,i=this.json.scenes[e],r=this,n=new ct;i.name&&(n.name=r.createUniqueName(i.name)),vi(n,i),i.extensions&&cn(t,n,i);let s=i.nodes||[],o=[];for(let a=0,c=s.length;a<c;a++)o.push(r.getDependency("node",s[a]));return Promise.all(o).then(function(a){for(let h=0,u=a.length;h<u;h++){let f=a[h];f.parent!==null?n.add(h_(f)):n.add(f)}let c=h=>{let u=new Map;for(let[f,d]of r.associations)(f instanceof $||f instanceof te)&&u.set(f,d);return h.traverse(f=>{let d=r.associations.get(f);d!=null&&u.set(f,d)}),u};return r.associations=c(n),n})}_createAnimationTracks(e,t,i,r,n){let s=[],o=e.name?e.name:e.uuid,a=[];function c(d){d.morphTargetInfluences&&a.push(d.name?d.name:d.uuid)}_r[n.path]===_r.weights?(c(e),e.isGroup&&e.children.forEach(c)):a.push(o);let h;switch(_r[n.path]){case _r.weights:h=ii;break;case _r.rotation:h=Wt;break;case _r.translation:case _r.scale:h=ni;break;default:switch(i.itemSize){case 1:h=ii;break;case 2:case 3:default:h=ni;break}break}let u=r.interpolation!==void 0?tb[r.interpolation]:Gi,f=this._getArrayFromAccessor(i);for(let d=0,p=a.length;d<p;d++){let m=new h(a[d]+"."+_r[n.path],t.array,f,u);r.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(m),s.push(m)}return s}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){let i=pf(t.constructor),r=new Float32Array(t.length);for(let n=0,s=t.length;n<s;n++)r[n]=t[n]*i;t=r}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(i){let r=this instanceof Wt?ff:rh;return new r(this.times,this.values,this.getValueSize()/3,i)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}};function lb(l,e,t){let i=e.attributes,r=new he;if(i.POSITION!==void 0){let o=t.json.accessors[i.POSITION],a=o.min,c=o.max;if(a!==void 0&&c!==void 0){if(r.set(new y(a[0],a[1],a[2]),new y(c[0],c[1],c[2])),o.normalized){let h=pf(co[o.componentType]);r.min.multiplyScalar(h),r.max.multiplyScalar(h)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;let n=e.targets;if(n!==void 0){let o=new y,a=new y;for(let c=0,h=n.length;c<h;c++){let u=n[c];if(u.POSITION!==void 0){let f=t.json.accessors[u.POSITION],d=f.min,p=f.max;if(d!==void 0&&p!==void 0){if(a.setX(Math.max(Math.abs(d[0]),Math.abs(p[0]))),a.setY(Math.max(Math.abs(d[1]),Math.abs(p[1]))),a.setZ(Math.max(Math.abs(d[2]),Math.abs(p[2]))),f.normalized){let m=pf(co[f.componentType]);a.multiplyScalar(m)}o.max(a)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}r.expandByVector(o)}l.boundingBox=r;let s=new oe;r.getCenter(s.center),s.radius=r.min.distanceTo(r.max)/2,l.boundingSphere=s}function m_(l,e,t){let i=e.attributes,r=[];function n(s,o){return t.getDependency("accessor",s).then(function(a){l.setAttribute(o,a)})}for(let s in i){let o=df[s]||s.toLowerCase();o in l.attributes||r.push(n(i[s],o))}if(e.indices!==void 0&&!l.index){let s=t.getDependency("accessor",e.indices).then(function(o){l.setIndex(o)});r.push(s)}return Le.workingColorSpace!==$e&&"COLOR_0"in i&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${Le.workingColorSpace}" not supported.`),vi(l,e),lb(l,e,t),Promise.all(r).then(function(){return e.targets!==void 0?rb(l,e.targets,t):l})}Fg(Du(!1));kg(ae);return M_(cb);})();
