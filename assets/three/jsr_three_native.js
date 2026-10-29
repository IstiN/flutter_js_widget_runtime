var THREE=(()=>{var nh=Object.defineProperty;var x_=Object.getOwnPropertyDescriptor;var y_=Object.getOwnPropertyNames;var v_=Object.prototype.hasOwnProperty;var sh=(a,e)=>{for(var t in e)nh(a,t,{get:e[t],enumerable:!0})},b_=(a,e,t,i)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of y_(e))!v_.call(a,r)&&r!==t&&nh(a,r,{get:()=>e[r],enumerable:!(i=x_(e,r))||i.enumerable});return a};var S_=a=>b_(nh({},"__esModule",{value:!0}),a);var lb={};sh(lb,{ACESFilmicToneMapping:()=>ox,AddEquation:()=>ah,AddOperation:()=>ix,AdditiveAnimationBlendMode:()=>Po,AdditiveBlending:()=>N_,AgXToneMapping:()=>lx,AlphaFormat:()=>wo,AlwaysCompare:()=>Hx,AlwaysDepth:()=>_a,AlwaysStencilFunc:()=>yh,AmbientLight:()=>Hs,AnimationAction:()=>io,AnimationClip:()=>yt,AnimationLoader:()=>ql,AnimationMixer:()=>ra,AnimationObjectGroup:()=>lc,AnimationUtils:()=>Gl,ArcCurve:()=>Jo,ArrayCamera:()=>nc,ArrowHelper:()=>Oc,AttachedBindMode:()=>Ma,Audio:()=>eo,AudioAnalyser:()=>ac,AudioContext:()=>ur,AudioListener:()=>sc,AudioLoader:()=>ic,AxesHelper:()=>Fc,BackSide:()=>wi,BasicDepthPacking:()=>xh,BasicShadowMap:()=>I_,BatchedMesh:()=>_s,BezierInterpolant:()=>zs,Bone:()=>ci,BooleanKeyframeTrack:()=>ti,Box2:()=>ro,Box3:()=>he,Box3Helper:()=>Nc,BoxGeometry:()=>rr,BoxHelper:()=>Lc,BufferAttribute:()=>j,BufferGeometry:()=>P,BufferGeometryLoader:()=>Zs,ByteType:()=>go,Cache:()=>Je,Camera:()=>gi,CameraHelper:()=>Rc,CanvasTexture:()=>gl,CapsuleGeometry:()=>vl,CatmullRomCurve3:()=>jo,CineonToneMapping:()=>sx,CircleGeometry:()=>bl,ClampToEdgeWrapping:()=>Ue,Clock:()=>mc,Color:()=>I,ColorKeyframeTrack:()=>Jr,ColorManagement:()=>Le,Compatibility:()=>r0,CompressedArrayTexture:()=>pl,CompressedCubeTexture:()=>ml,CompressedTexture:()=>ui,CompressedTextureLoader:()=>Xl,ConeGeometry:()=>bs,ConstantAlphaFactor:()=>Q_,ConstantColorFactor:()=>K_,Controls:()=>zc,CubeCamera:()=>$s,CubeDepthTexture:()=>xl,CubeReflectionMapping:()=>Bt,CubeRefractionMapping:()=>un,CubeTexture:()=>fi,CubeTextureLoader:()=>Yl,CubeUVReflectionMapping:()=>po,CubicBezierCurve:()=>Gr,CubicBezierCurve3:()=>Ko,CubicInterpolant:()=>Fs,CullFaceBack:()=>T_,CullFaceFront:()=>C_,CullFaceFrontBack:()=>E_,CullFaceNone:()=>A_,Curve:()=>we,CurvePath:()=>Ss,CustomBlending:()=>O_,CustomToneMapping:()=>ax,CylinderGeometry:()=>vs,Cylindrical:()=>_c,Data3DTexture:()=>qi,DataArrayTexture:()=>Jn,DataTexture:()=>ze,DataTextureLoader:()=>Zl,DataUtils:()=>ka,DecrementStencilOp:()=>Ax,DecrementWrapStencilOp:()=>Cx,DefaultLoadingManager:()=>Wl,DepthFormat:()=>ki,DepthStencilFormat:()=>To,DepthTexture:()=>ys,DetachedBindMode:()=>hh,DirectionalLight:()=>cr,DirectionalLightHelper:()=>Ec,DiscreteInterpolant:()=>Us,DodecahedronGeometry:()=>Sl,DoubleSide:()=>uo,DstAlphaFactor:()=>X_,DstColorFactor:()=>Z_,DynamicCopyUsage:()=>jx,DynamicDrawUsage:()=>Wx,DynamicReadUsage:()=>Yx,EdgesGeometry:()=>Tl,EllipseCurve:()=>Ni,EqualCompare:()=>Ux,EqualDepth:()=>ya,EqualStencilFunc:()=>Px,EquirectangularReflectionMapping:()=>uh,EquirectangularRefractionMapping:()=>fh,Euler:()=>Ge,EventDispatcher:()=>Ie,ExternalTexture:()=>yl,ExtrudeGeometry:()=>Rl,FileLoader:()=>mr,Float16BufferAttribute:()=>Hh,Float32BufferAttribute:()=>R,FloatType:()=>mt,Fog:()=>es,FogExp2:()=>Qn,FramebufferTexture:()=>dl,FrontSide:()=>Mi,Frustum:()=>Lt,FrustumArray:()=>gs,GLBufferAttribute:()=>dc,GLSL1:()=>$x,GLSL3:()=>Qx,GLTFLoader:()=>th,GreaterCompare:()=>kx,GreaterDepth:()=>ba,GreaterEqualCompare:()=>Gx,GreaterEqualDepth:()=>va,GreaterEqualStencilFunc:()=>Bx,GreaterStencilFunc:()=>Nx,GridHelper:()=>Ac,Group:()=>ct,HTMLTexture:()=>_l,HalfFloatType:()=>br,HemisphereLight:()=>Gs,HemisphereLightHelper:()=>wc,IcosahedronGeometry:()=>Pl,ImageBitmapLoader:()=>Js,ImageLoader:()=>Bi,ImageUtils:()=>Zn,IncrementStencilOp:()=>wx,IncrementWrapStencilOp:()=>Tx,InstancedBufferAttribute:()=>tt,InstancedBufferGeometry:()=>Ys,InstancedInterleavedBuffer:()=>fc,InstancedMesh:()=>er,Int16BufferAttribute:()=>Vh,Int32BufferAttribute:()=>Gh,Int8BufferAttribute:()=>Uh,IntType:()=>yo,InterleavedBuffer:()=>It,InterleavedBufferAttribute:()=>Rt,Interpolant:()=>nt,InterpolateBezier:()=>wa,InterpolateDiscrete:()=>ai,InterpolateLinear:()=>Vi,InterpolateSmooth:()=>Ro,InterpolationSamplingMode:()=>i0,InterpolationSamplingType:()=>t0,InvertStencilOp:()=>Ex,JsrThreeCanvas:()=>la,KeepStencilOp:()=>No,KeyframeTrack:()=>Re,LOD:()=>ps,LatheGeometry:()=>Ll,Layers:()=>Yi,LessCompare:()=>Fx,LessDepth:()=>xa,LessEqualCompare:()=>zx,LessEqualDepth:()=>cn,LessEqualStencilFunc:()=>Lx,LessStencilFunc:()=>Rx,Light:()=>qe,LightProbe:()=>qs,LightShadow:()=>pi,Line:()=>ke,Line3:()=>vc,LineBasicMaterial:()=>re,LineCurve:()=>Hr,LineCurve3:()=>$o,LineDashedMaterial:()=>Os,LineLoop:()=>tr,LineSegments:()=>Me,LinearFilter:()=>de,LinearInterpolant:()=>sr,LinearMipMapLinearFilter:()=>dx,LinearMipMapNearestFilter:()=>fx,LinearMipmapLinearFilter:()=>Ot,LinearMipmapNearestFilter:()=>mo,LinearSRGBColorSpace:()=>Ke,LinearToneMapping:()=>rx,LinearTransfer:()=>Aa,Loader:()=>le,LoaderUtils:()=>Dt,LoadingManager:()=>jr,LoopOnce:()=>ph,LoopPingPong:()=>gh,LoopRepeat:()=>mh,MOUSE:()=>M_,Material:()=>$,MaterialBlending:()=>F_,MaterialLoader:()=>Xs,MathUtils:()=>Ea,Matrix2:()=>xc,Matrix3:()=>Y,Matrix4:()=>F,MaxEquation:()=>V_,Mesh:()=>ae,MeshBasicMaterial:()=>Se,MeshDepthMaterial:()=>Ns,MeshDistanceMaterial:()=>Ds,MeshLambertMaterial:()=>Ls,MeshMatcapMaterial:()=>Bs,MeshNormalMaterial:()=>Ps,MeshPhongMaterial:()=>Is,MeshPhysicalMaterial:()=>Ze,MeshStandardMaterial:()=>ei,MeshToonMaterial:()=>Rs,MinEquation:()=>k_,MirroredRepeatWrapping:()=>Yt,MixOperation:()=>tx,MultiplyBlending:()=>B_,MultiplyOperation:()=>xr,NearestFilter:()=>fe,NearestMipMapLinearFilter:()=>ux,NearestMipMapNearestFilter:()=>hx,NearestMipmapLinearFilter:()=>vr,NearestMipmapNearestFilter:()=>yr,NeutralToneMapping:()=>cx,NeverCompare:()=>Ox,NeverDepth:()=>ga,NeverStencilFunc:()=>Ix,NoBlending:()=>Ui,NoColorSpace:()=>Rr,NoNormalPacking:()=>yx,NoToneMapping:()=>hn,NormalAnimationBlendMode:()=>Ir,NormalBlending:()=>fo,NormalGAPacking:()=>bx,NormalRGPacking:()=>vx,NotEqualCompare:()=>Vx,NotEqualDepth:()=>Sa,NotEqualStencilFunc:()=>Dx,NumberKeyframeTrack:()=>ii,Object3D:()=>G,ObjectLoader:()=>ec,ObjectSpaceNormalMap:()=>xx,OctahedronGeometry:()=>ws,OneFactor:()=>H_,OneMinusConstantAlphaFactor:()=>ex,OneMinusConstantColorFactor:()=>$_,OneMinusDstAlphaFactor:()=>Y_,OneMinusDstColorFactor:()=>J_,OneMinusSrcAlphaFactor:()=>ch,OneMinusSrcColorFactor:()=>q_,OrthographicCamera:()=>Ht,PCFShadowMap:()=>R_,PCFSoftShadowMap:()=>P_,PMREMGenerator:()=>Gc,Path:()=>di,PerspectiveCamera:()=>ge,Plane:()=>Pt,PlaneGeometry:()=>Nl,PlaneHelper:()=>Dc,PointLight:()=>lr,PointLightHelper:()=>Mc,Points:()=>ir,PointsMaterial:()=>hi,PolarGridHelper:()=>Tc,PolyhedronGeometry:()=>kt,PositionalAudio:()=>oc,PropertyBinding:()=>ne,PropertyMixer:()=>to,QuadraticBezierCurve:()=>Wr,QuadraticBezierCurve3:()=>qr,Quaternion:()=>ce,QuaternionKeyframeTrack:()=>Gt,QuaternionLinearInterpolant:()=>ks,R11_EAC_Format:()=>yn,RED_GREEN_RGTC2_Format:()=>Gn,RED_RGTC1_Format:()=>kn,REVISION:()=>oh,RG11_EAC_Format:()=>bn,RGBADepthPacking:()=>mx,RGBAFormat:()=>je,RGBAIntegerFormat:()=>Io,RGBA_ASTC_10x10_Format:()=>Dn,RGBA_ASTC_10x5_Format:()=>Pn,RGBA_ASTC_10x6_Format:()=>Ln,RGBA_ASTC_10x8_Format:()=>Nn,RGBA_ASTC_12x10_Format:()=>Bn,RGBA_ASTC_12x12_Format:()=>On,RGBA_ASTC_4x4_Format:()=>Mn,RGBA_ASTC_5x4_Format:()=>wn,RGBA_ASTC_5x5_Format:()=>An,RGBA_ASTC_6x5_Format:()=>Tn,RGBA_ASTC_6x6_Format:()=>Cn,RGBA_ASTC_8x5_Format:()=>En,RGBA_ASTC_8x6_Format:()=>In,RGBA_ASTC_8x8_Format:()=>Rn,RGBA_BPTC_Format:()=>Fn,RGBA_ETC2_EAC_Format:()=>xn,RGBA_PVRTC_2BPPV1_Format:()=>mn,RGBA_PVRTC_4BPPV1_Format:()=>pn,RGBA_S3TC_DXT1_Format:()=>Ar,RGBA_S3TC_DXT3_Format:()=>Tr,RGBA_S3TC_DXT5_Format:()=>Cr,RGBDepthPacking:()=>gx,RGBFormat:()=>Ao,RGBIntegerFormat:()=>px,RGB_BPTC_SIGNED_Format:()=>Un,RGB_BPTC_UNSIGNED_Format:()=>zn,RGB_ETC1_Format:()=>gn,RGB_ETC2_Format:()=>_n,RGB_PVRTC_2BPPV1_Format:()=>dn,RGB_PVRTC_4BPPV1_Format:()=>fn,RGB_S3TC_DXT1_Format:()=>wr,RGDepthPacking:()=>_x,RGFormat:()=>Co,RGIntegerFormat:()=>Eo,RawShaderMaterial:()=>Es,Ray:()=>_t,Raycaster:()=>pc,RectAreaLight:()=>Ws,RedFormat:()=>Sr,RedIntegerFormat:()=>Mr,ReinhardToneMapping:()=>nx,RenderObjectRefreshType:()=>n0,RenderTarget:()=>Wi,RenderTarget3D:()=>cc,RepeatWrapping:()=>wt,ReplaceStencilOp:()=>Mx,ReverseSubtractEquation:()=>z_,RingGeometry:()=>Dl,SIGNED_R11_EAC_Format:()=>vn,SIGNED_RED_GREEN_RGTC2_Format:()=>Hn,SIGNED_RED_RGTC1_Format:()=>Vn,SIGNED_RG11_EAC_Format:()=>Sn,SRGBColorSpace:()=>me,SRGBTransfer:()=>be,Scene:()=>ts,ShaderChunk:()=>Q,ShaderLib:()=>Vc,ShaderMaterial:()=>dt,ShadowMaterial:()=>Ts,Shape:()=>Vt,ShapeGeometry:()=>Bl,ShapePath:()=>Uc,ShapeUtils:()=>ft,ShortType:()=>_o,Skeleton:()=>Qi,SkeletonHelper:()=>na,SkinnedMesh:()=>$i,Source:()=>Ia,Sphere:()=>oe,SphereGeometry:()=>As,Spherical:()=>gc,SphericalHarmonics3:()=>hr,SplineCurve:()=>Xr,SpotLight:()=>ar,SpotLightHelper:()=>bc,Sprite:()=>ds,SpriteMaterial:()=>Ki,SrcAlphaFactor:()=>lh,SrcAlphaSaturateFactor:()=>j_,SrcColorFactor:()=>W_,StaticCopyUsage:()=>Jx,StaticDrawUsage:()=>Pr,StaticReadUsage:()=>Xx,StereoCamera:()=>rc,StreamCopyUsage:()=>Kx,StreamDrawUsage:()=>qx,StreamReadUsage:()=>Zx,StringKeyframeTrack:()=>ri,SubtractEquation:()=>U_,SubtractiveBlending:()=>D_,TOUCH:()=>w_,TangentSpaceNormalMap:()=>At,TetrahedronGeometry:()=>Ol,Texture:()=>te,TextureLoader:()=>an,TextureSource:()=>Qe,TextureUtils:()=>kc,ThreeCapabilityError:()=>oa,ThreeCompatibilityRuntime:()=>ca,Timer:()=>Qs,TimestampQuery:()=>e0,TorusGeometry:()=>Fl,TorusKnotGeometry:()=>Ul,Triangle:()=>gt,TriangleFanDrawMode:()=>Wn,TriangleStripDrawMode:()=>Lo,TrianglesDrawMode:()=>_h,TubeGeometry:()=>zl,UVMapping:()=>zi,Uint16BufferAttribute:()=>Fo,Uint32BufferAttribute:()=>Uo,Uint8BufferAttribute:()=>zh,Uint8ClampedBufferAttribute:()=>kh,Uniform:()=>hc,UniformsGroup:()=>uc,UniformsLib:()=>O,UniformsUtils:()=>vd,UnsignedByteType:()=>Zt,UnsignedInt101111Type:()=>Mo,UnsignedInt248Type:()=>dh,UnsignedInt5999Type:()=>So,UnsignedIntType:()=>Jt,UnsignedShort4444Type:()=>vo,UnsignedShort5551Type:()=>bo,UnsignedShortType:()=>xo,VSMShadowMap:()=>L_,Vector2:()=>T,Vector3:()=>y,Vector4:()=>Ne,VectorKeyframeTrack:()=>ni,VideoFrameTexture:()=>fl,VideoTexture:()=>xs,WebGL3DRenderTarget:()=>Pa,WebGLArrayRenderTarget:()=>Ra,WebGLCoordinateSystem:()=>Xe,WebGLCubeRenderTarget:()=>Wc,WebGLRenderTarget:()=>Ut,WebGLRenderer:()=>eh,WebGLUtils:()=>Lg,WebGPUCoordinateSystem:()=>Ft,WebGPURenderer:()=>qc,WebXRController:()=>Ba,WireframeGeometry:()=>kl,WrapAroundEnding:()=>Er,ZeroCurvatureEnding:()=>Ai,ZeroFactor:()=>G_,ZeroSlopeEnding:()=>Ti,ZeroStencilOp:()=>Sx,createCanvasElement:()=>Mf,error:()=>Z,getConsoleFunction:()=>Af,getNativeRaycastDiagnostics:()=>zg,log:()=>Do,setConsoleFunction:()=>wf,warn:()=>B,warnOnce:()=>Tt});var oh="186",M_={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},w_={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},A_=0,T_=1,C_=2,E_=3,I_=0,R_=1,P_=2,L_=3,Mi=0,wi=1,uo=2,Ui=0,fo=1,N_=2,D_=3,B_=4,O_=5,F_=6,ah=100,U_=101,z_=102,k_=103,V_=104,G_=200,H_=201,W_=202,q_=203,lh=204,ch=205,X_=206,Y_=207,Z_=208,J_=209,j_=210,K_=211,$_=212,Q_=213,ex=214,ga=0,_a=1,xa=2,cn=3,ya=4,va=5,ba=6,Sa=7,xr=0,tx=1,ix=2,hn=0,rx=1,nx=2,sx=3,ox=4,ax=5,lx=6,cx=7,Ma="attached",hh="detached",zi=300,Bt=301,un=302,uh=303,fh=304,po=306,wt=1e3,Ue=1001,Yt=1002,fe=1003,yr=1004,hx=1004,vr=1005,ux=1005,de=1006,mo=1007,fx=1007,Ot=1008,dx=1008,Zt=1009,go=1010,_o=1011,xo=1012,yo=1013,Jt=1014,mt=1015,br=1016,vo=1017,bo=1018,dh=1020,So=35902,Mo=35899,wo=1021,Ao=1022,je=1023,ki=1026,To=1027,Sr=1028,Mr=1029,Co=1030,Eo=1031,px=1032,Io=1033,wr=33776,Ar=33777,Tr=33778,Cr=33779,fn=35840,dn=35841,pn=35842,mn=35843,gn=36196,_n=37492,xn=37496,yn=37488,vn=37489,bn=37490,Sn=37491,Mn=37808,wn=37809,An=37810,Tn=37811,Cn=37812,En=37813,In=37814,Rn=37815,Pn=37816,Ln=37817,Nn=37818,Dn=37819,Bn=37820,On=37821,Fn=36492,Un=36494,zn=36495,kn=36283,Vn=36284,Gn=36285,Hn=36286,ph=2200,mh=2201,gh=2202,ai=2300,Vi=2301,Ro=2302,wa=2303,Ai=2400,Ti=2401,Er=2402,Ir=2500,Po=2501,_h=0,Lo=1,Wn=2,xh=3200,mx=3201,gx=3202,_x=3203,At=0,xx=1,Rr="",me="srgb",Ke="srgb-linear",Aa="linear",be="srgb",yx="",vx="rg",bx="ga",Sx=0,No=7680,Mx=7681,wx=7682,Ax=7683,Tx=34055,Cx=34056,Ex=5386,Ix=512,Rx=513,Px=514,Lx=515,Nx=516,Dx=517,Bx=518,yh=519,Ox=512,Fx=513,Ux=514,zx=515,kx=516,Vx=517,Gx=518,Hx=519,Pr=35044,Wx=35048,qx=35040,Xx=35045,Yx=35049,Zx=35041,Jx=35046,jx=35050,Kx=35042,$x="100",Qx="300 es",Xe=2e3,Ft=2001,e0={COMPUTE:"compute",RENDER:"render"},t0={PERSPECTIVE:"perspective",LINEAR:"linear",FLAT:"flat"},i0={NORMAL:"normal",CENTROID:"centroid",SAMPLE:"sample",FIRST:"first",EITHER:"either"},r0={TEXTURE_COMPARE:"depthTextureCompare"},n0={NONE:0,SHARED:1,FULL:2};function Sf(a){for(let e=a.length-1;e>=0;--e)if(a[e]>=65535)return!0;return!1}var s0={Int8Array,Uint8Array,Uint8ClampedArray,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array};function Hi(a,e){return new s0[a](e)}function Ta(a){return ArrayBuffer.isView(a)&&!(a instanceof DataView)}function qn(a){return document.createElementNS("http://www.w3.org/1999/xhtml",a)}function Mf(){let a=qn("canvas");return a.style.display="block",a}var bf={},Gi=null;function wf(a){Gi=a}function Af(){return Gi}function Do(...a){let e="THREE."+a.shift();Gi?Gi("log",e,...a):console.log(e,...a)}function Tf(a){let e=a[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=a[1];t&&t.isStackTrace?a[0]+=" "+t.getLocation():a[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return a}function B(...a){a=Tf(a);let e="THREE."+a.shift();if(Gi)Gi("warn",e,...a);else{let t=a[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...a)}}function Z(...a){a=Tf(a);let e="THREE."+a.shift();if(Gi)Gi("error",e,...a);else{let t=a[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...a)}}function Tt(...a){let e=a.join(" ");e in bf||(bf[e]=!0,B(...a))}var fb={[ga]:_a,[xa]:ba,[ya]:Sa,[cn]:va,[_a]:ga,[ba]:xa,[Sa]:ya,[va]:cn};var Ie=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){let i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){let i=this._listeners;if(i===void 0)return;let r=i[e];if(r!==void 0){let n=r.indexOf(t);n!==-1&&r.splice(n,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let i=t[e.type];if(i!==void 0){e.target=this;let r=i.slice(0);for(let n=0,s=r.length;n<s;n++)r[n].call(this,e);e.target=null}}};var $e=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Cf=1234567,li=Math.PI/180,Lr=180/Math.PI;function Te(){let a=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return($e[a&255]+$e[a>>8&255]+$e[a>>16&255]+$e[a>>24&255]+"-"+$e[e&255]+$e[e>>8&255]+"-"+$e[e>>16&15|64]+$e[e>>24&255]+"-"+$e[t&63|128]+$e[t>>8&255]+"-"+$e[t>>16&255]+$e[t>>24&255]+$e[i&255]+$e[i>>8&255]+$e[i>>16&255]+$e[i>>24&255]).toLowerCase()}function k(a,e,t){return Math.max(e,Math.min(t,a))}function Ca(a,e){return(a%e+e)%e}function o0(a,e,t,i,r){return i+(a-e)*(r-i)/(t-e)}function a0(a,e,t){return a!==e?(t-a)/(e-a):0}function Xn(a,e,t){return(1-t)*a+t*e}function l0(a,e,t,i){return Xn(a,e,1-Math.exp(-t*i))}function c0(a,e=1){return e-Math.abs(Ca(a,e*2)-e)}function h0(a,e,t){return a<=e?0:a>=t?1:(a=(a-e)/(t-e),a*a*(3-2*a))}function u0(a,e,t){return a<=e?0:a>=t?1:(a=(a-e)/(t-e),a*a*a*(a*(a*6-15)+10))}function f0(a,e){return a+Math.floor(Math.random()*(e-a+1))}function d0(a,e){return a+Math.random()*(e-a)}function p0(a){return a*(.5-Math.random())}function m0(a){a!==void 0&&(Cf=a);let e=Cf+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function g0(a){return a*li}function _0(a){return a*Lr}function x0(a){return a>0&&Number.isInteger(a)&&2**Math.round(Math.log2(a))===a}function y0(a){return Math.pow(2,Math.ceil(Math.log(a)/Math.LN2))}function v0(a){return Math.pow(2,Math.floor(Math.log(a)/Math.LN2))}function b0(a,e,t,i,r){let n=Math.cos,s=Math.sin,o=n(t/2),l=s(t/2),c=n((e+i)/2),h=s((e+i)/2),u=n((e-i)/2),f=s((e-i)/2),d=n((i-e)/2),p=s((i-e)/2);switch(r){case"XYX":a.set(o*h,l*u,l*f,o*c);break;case"YZY":a.set(l*f,o*h,l*u,o*c);break;case"ZXZ":a.set(l*u,l*f,o*h,o*c);break;case"XZX":a.set(o*h,l*p,l*d,o*c);break;case"YXY":a.set(l*d,o*h,l*p,o*c);break;case"ZYZ":a.set(l*p,l*d,o*h,o*c);break;default:B("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function Ye(a,e){switch(e.constructor){case Float32Array:return a;case Uint32Array:return a/4294967295;case Uint16Array:return a/65535;case Uint8Array:case Uint8ClampedArray:return a/255;case Int32Array:return Math.max(a/2147483647,-1);case Int16Array:return Math.max(a/32767,-1);case Int8Array:return Math.max(a/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function J(a,e){switch(e.constructor){case Float32Array:return a;case Uint32Array:return Math.round(a*4294967295);case Uint16Array:return Math.round(a*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(a*255);case Int32Array:return Math.round(a*2147483647);case Int16Array:return Math.round(a*32767);case Int8Array:return Math.round(a*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var Ea={DEG2RAD:li,RAD2DEG:Lr,generateUUID:Te,clamp:k,euclideanModulo:Ca,mapLinear:o0,inverseLerp:a0,lerp:Xn,damp:l0,pingpong:c0,smoothstep:h0,smootherstep:u0,randInt:f0,randFloat:d0,randFloatSpread:p0,seededRandom:m0,degToRad:g0,radToDeg:_0,isPowerOfTwo:x0,ceilPowerOfTwo:y0,floorPowerOfTwo:v0,setQuaternionFromProperEuler:b0,normalize:J,denormalize:Ye};var vh=class vh{constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=k(this.x,e.x,t.x),this.y=k(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=k(this.x,e,t),this.y=k(this.y,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(k(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(k(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),r=Math.sin(t),n=this.x-e.x,s=this.y-e.y;return this.x=n*i-s*r+e.x,this.y=n*r+s*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};vh.prototype.isVector2=!0;var T=vh;var ce=class{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,n,s,o){let l=i[r+0],c=i[r+1],h=i[r+2],u=i[r+3],f=n[s+0],d=n[s+1],p=n[s+2],m=n[s+3];if(u!==m||l!==f||c!==d||h!==p){let g=l*f+c*d+h*p+u*m;g<0&&(f=-f,d=-d,p=-p,m=-m,g=-g);let _=1-o;if(g<.9995){let x=Math.acos(g),v=Math.sin(x);_=Math.sin(_*x)/v,o=Math.sin(o*x)/v,l=l*_+f*o,c=c*_+d*o,h=h*_+p*o,u=u*_+m*o}else{l=l*_+f*o,c=c*_+d*o,h=h*_+p*o,u=u*_+m*o;let x=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=x,c*=x,h*=x,u*=x}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,i,r,n,s){let o=i[r],l=i[r+1],c=i[r+2],h=i[r+3],u=n[s],f=n[s+1],d=n[s+2],p=n[s+3];return e[t]=o*p+h*u+l*d-c*f,e[t+1]=l*p+h*f+c*u-o*d,e[t+2]=c*p+h*d+o*f-l*u,e[t+3]=h*p-o*u-l*f-c*d,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,r=e._y,n=e._z,s=e._order,o=Math.cos,l=Math.sin,c=o(i/2),h=o(r/2),u=o(n/2),f=l(i/2),d=l(r/2),p=l(n/2);switch(s){case"XYZ":this._x=f*h*u+c*d*p,this._y=c*d*u-f*h*p,this._z=c*h*p+f*d*u,this._w=c*h*u-f*d*p;break;case"YXZ":this._x=f*h*u+c*d*p,this._y=c*d*u-f*h*p,this._z=c*h*p-f*d*u,this._w=c*h*u+f*d*p;break;case"ZXY":this._x=f*h*u-c*d*p,this._y=c*d*u+f*h*p,this._z=c*h*p+f*d*u,this._w=c*h*u-f*d*p;break;case"ZYX":this._x=f*h*u-c*d*p,this._y=c*d*u+f*h*p,this._z=c*h*p-f*d*u,this._w=c*h*u+f*d*p;break;case"YZX":this._x=f*h*u+c*d*p,this._y=c*d*u+f*h*p,this._z=c*h*p-f*d*u,this._w=c*h*u-f*d*p;break;case"XZY":this._x=f*h*u-c*d*p,this._y=c*d*u-f*h*p,this._z=c*h*p+f*d*u,this._w=c*h*u+f*d*p;break;default:B("Quaternion: .setFromEuler() encountered an unknown order: "+s)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],r=t[4],n=t[8],s=t[1],o=t[5],l=t[9],c=t[2],h=t[6],u=t[10],f=i+o+u;if(f>0){let d=.5/Math.sqrt(f+1);this._w=.25/d,this._x=(h-l)*d,this._y=(n-c)*d,this._z=(s-r)*d}else if(i>o&&i>u){let d=2*Math.sqrt(1+i-o-u);this._w=(h-l)/d,this._x=.25*d,this._y=(r+s)/d,this._z=(n+c)/d}else if(o>u){let d=2*Math.sqrt(1+o-i-u);this._w=(n-c)/d,this._x=(r+s)/d,this._y=.25*d,this._z=(l+h)/d}else{let d=2*Math.sqrt(1+u-i-o);this._w=(s-r)/d,this._x=(n+c)/d,this._y=(l+h)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(k(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,r=e._y,n=e._z,s=e._w,o=t._x,l=t._y,c=t._z,h=t._w;return this._x=i*h+s*o+r*c-n*l,this._y=r*h+s*l+n*o-i*c,this._z=n*h+s*c+i*l-r*o,this._w=s*h-i*o-r*l-n*c,this._onChangeCallback(),this}slerp(e,t){let i=e._x,r=e._y,n=e._z,s=e._w,o=this.dot(e);o<0&&(i=-i,r=-r,n=-n,s=-s,o=-o);let l=1-t;if(o<.9995){let c=Math.acos(o),h=Math.sin(c);l=Math.sin(l*c)/h,t=Math.sin(t*c)/h,this._x=this._x*l+i*t,this._y=this._y*l+r*t,this._z=this._z*l+n*t,this._w=this._w*l+s*t,this._onChangeCallback()}else this._x=this._x*l+i*t,this._y=this._y*l+r*t,this._z=this._z*l+n*t,this._w=this._w*l+s*t,this.normalize();return this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),n=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),n*Math.sin(t),n*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}};var Sh=class Sh{constructor(e=0,t=0,i=0){this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Ef.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Ef.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,r=this.z,n=e.elements;return this.x=n[0]*t+n[3]*i+n[6]*r,this.y=n[1]*t+n[4]*i+n[7]*r,this.z=n[2]*t+n[5]*i+n[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,r=this.z,n=e.elements,s=1/(n[3]*t+n[7]*i+n[11]*r+n[15]);return this.x=(n[0]*t+n[4]*i+n[8]*r+n[12])*s,this.y=(n[1]*t+n[5]*i+n[9]*r+n[13])*s,this.z=(n[2]*t+n[6]*i+n[10]*r+n[14])*s,this}applyQuaternion(e){let t=this.x,i=this.y,r=this.z,n=e.x,s=e.y,o=e.z,l=e.w,c=2*(s*r-o*i),h=2*(o*t-n*r),u=2*(n*i-s*t);return this.x=t+l*c+s*u-o*h,this.y=i+l*h+o*c-n*u,this.z=r+l*u+n*h-s*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,r=this.z,n=e.elements;return this.x=n[0]*t+n[4]*i+n[8]*r,this.y=n[1]*t+n[5]*i+n[9]*r,this.z=n[2]*t+n[6]*i+n[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=k(this.x,e.x,t.x),this.y=k(this.y,e.y,t.y),this.z=k(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=k(this.x,e,t),this.y=k(this.y,e,t),this.z=k(this.z,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(k(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,r=e.y,n=e.z,s=t.x,o=t.y,l=t.z;return this.x=r*l-n*o,this.y=n*s-i*l,this.z=i*o-r*s,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return bh.copy(this).projectOnVector(e),this.sub(bh)}reflect(e){return this.sub(bh.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(k(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};Sh.prototype.isVector3=!0;var y=Sh,bh=new y,Ef=new ce;var wh=class wh{constructor(e,t,i,r,n,s,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,n,s,o,l,c)}set(e,t,i,r,n,s,o,l,c){let h=this.elements;return h[0]=e,h[1]=r,h[2]=o,h[3]=t,h[4]=n,h[5]=l,h[6]=i,h[7]=s,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,r=t.elements,n=this.elements,s=i[0],o=i[3],l=i[6],c=i[1],h=i[4],u=i[7],f=i[2],d=i[5],p=i[8],m=r[0],g=r[3],_=r[6],x=r[1],v=r[4],b=r[7],M=r[2],S=r[5],A=r[8];return n[0]=s*m+o*x+l*M,n[3]=s*g+o*v+l*S,n[6]=s*_+o*b+l*A,n[1]=c*m+h*x+u*M,n[4]=c*g+h*v+u*S,n[7]=c*_+h*b+u*A,n[2]=f*m+d*x+p*M,n[5]=f*g+d*v+p*S,n[8]=f*_+d*b+p*A,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],r=e[2],n=e[3],s=e[4],o=e[5],l=e[6],c=e[7],h=e[8];return t*s*h-t*o*c-i*n*h+i*o*l+r*n*c-r*s*l}invert(){let e=this.elements,t=e[0],i=e[1],r=e[2],n=e[3],s=e[4],o=e[5],l=e[6],c=e[7],h=e[8],u=h*s-o*c,f=o*l-h*n,d=c*n-s*l,p=t*u+i*f+r*d;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let m=1/p;return e[0]=u*m,e[1]=(r*c-h*i)*m,e[2]=(o*i-r*s)*m,e[3]=f*m,e[4]=(h*t-r*l)*m,e[5]=(r*n-o*t)*m,e[6]=d*m,e[7]=(i*l-c*t)*m,e[8]=(s*t-i*n)*m,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,n,s,o){let l=Math.cos(n),c=Math.sin(n);return this.set(i*l,i*c,-i*(l*s+c*o)+s+e,-r*c,r*l,-r*(-c*s+l*o)+o+t,0,0,1),this}scale(e,t){return Tt("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Mh.makeScale(e,t)),this}rotate(e){return Tt("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Mh.makeRotation(-e)),this}translate(e,t){return Tt("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Mh.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}};wh.prototype.isMatrix3=!0;var Y=wh,Mh=new Y;var If=new Y().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Rf=new Y().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function S0(){let a={enabled:!0,workingColorSpace:Ke,spaces:{},convert:function(r,n,s){return this.enabled===!1||n===s||!n||!s||(this.spaces[n].transfer===be&&(r.r=jt(r.r),r.g=jt(r.g),r.b=jt(r.b)),this.spaces[n].primaries!==this.spaces[s].primaries&&(r.applyMatrix3(this.spaces[n].toXYZ),r.applyMatrix3(this.spaces[s].fromXYZ)),this.spaces[s].transfer===be&&(r.r=Nr(r.r),r.g=Nr(r.g),r.b=Nr(r.b))),r},workingToColorSpace:function(r,n){return this.convert(r,this.workingColorSpace,n)},colorSpaceToWorking:function(r,n){return this.convert(r,n,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===Rr?Aa:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,n=this.workingColorSpace){return r.fromArray(this.spaces[n].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,n,s){return r.copy(this.spaces[n].toXYZ).multiply(this.spaces[s].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,n){return Tt("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),a.workingToColorSpace(r,n)},toWorkingColorSpace:function(r,n){return Tt("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),a.colorSpaceToWorking(r,n)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return a.define({[Ke]:{primaries:e,whitePoint:i,transfer:Aa,toXYZ:If,fromXYZ:Rf,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:me},outputColorSpaceConfig:{drawingBufferColorSpace:me}},[me]:{primaries:e,whitePoint:i,transfer:be,toXYZ:If,fromXYZ:Rf,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:me}}}),a}var Le=S0();function jt(a){return a<.04045?a*.0773993808:Math.pow(a*.9478672986+.0521327014,2.4)}function Nr(a){return a<.0031308?a*12.92:1.055*Math.pow(a,.41666)-.055}var Yn,Zn=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{Yn===void 0&&(Yn=qn("canvas")),Yn.width=e.width,Yn.height=e.height;let r=Yn.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),i=Yn}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=qn("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let r=i.getImageData(0,0,e.width,e.height),n=r.data;for(let s=0;s<n.length;s++)n[s]=jt(n[s]/255)*255;return i.putImageData(r,0,0),t}else if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(jt(t[i]/255)*255):t[i]=jt(t[i]);return{data:t,width:e.width,height:e.height}}else return B("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}};var M0=0,Qe=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:M0++}),this.uuid=Te(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let n;if(Array.isArray(r)){n=[];for(let s=0,o=r.length;s<o;s++)r[s].isDataTexture?n.push(Ah(r[s].image)):n.push(Ah(r[s]))}else n=Ah(r);i.url=n}return t||(e.images[this.uuid]=i),i}};function Ah(a){return typeof HTMLImageElement<"u"&&a instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&a instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&a instanceof ImageBitmap?Zn.getDataURL(a):a.data?{data:Array.from(a.data),width:a.width,height:a.height,type:a.data.constructor.name}:(B("Texture: Unable to serialize Texture."),{})}var Ia=class extends Qe{constructor(e=null){Tt('Source: "Source" has been renamed to "TextureSource". Please update your code to use "THREE.TextureSource" instead.'),super(e),this.isSource=!0}};var w0=0,Th=new y,te=class a extends Ie{constructor(e=a.DEFAULT_IMAGE,t=a.DEFAULT_MAPPING,i=Ue,r=Ue,n=de,s=Ot,o=je,l=Zt,c=a.DEFAULT_ANISOTROPY,h=Rr){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:w0++}),this.uuid=Te(),this.name="",this.source=new Qe(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=n,this.minFilter=s,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new T(0,0),this.repeat=new T(1,1),this.center=new T(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Y,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Th).x}get height(){return this.source.getSize(Th).y}get depth(){return this.source.getSize(Th).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let i=e[t];if(i===void 0){B(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){B(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&i&&r.isVector2&&i.isVector2||r&&i&&r.isVector3&&i.isVector3||r&&i&&r.isMatrix3&&i.isMatrix3?r.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==zi)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case wt:e.x=e.x-Math.floor(e.x);break;case Ue:e.x=e.x<0?0:1;break;case Yt:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case wt:e.y=e.y-Math.floor(e.y);break;case Ue:e.y=e.y<0?0:1;break;case Yt:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};te.DEFAULT_IMAGE=null;te.DEFAULT_MAPPING=zi;te.DEFAULT_ANISOTROPY=1;var Ch=class Ch{constructor(e=0,t=0,i=0,r=1){this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,r=this.z,n=this.w,s=e.elements;return this.x=s[0]*t+s[4]*i+s[8]*r+s[12]*n,this.y=s[1]*t+s[5]*i+s[9]*r+s[13]*n,this.z=s[2]*t+s[6]*i+s[10]*r+s[14]*n,this.w=s[3]*t+s[7]*i+s[11]*r+s[15]*n,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,n,l=e.elements,c=l[0],h=l[4],u=l[8],f=l[1],d=l[5],p=l[9],m=l[2],g=l[6],_=l[10];if(Math.abs(h-f)<.01&&Math.abs(u-m)<.01&&Math.abs(p-g)<.01){if(Math.abs(h+f)<.1&&Math.abs(u+m)<.1&&Math.abs(p+g)<.1&&Math.abs(c+d+_-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let v=(c+1)/2,b=(d+1)/2,M=(_+1)/2,S=(h+f)/4,A=(u+m)/4,w=(p+g)/4;return v>b&&v>M?v<.01?(i=0,r=.707106781,n=.707106781):(i=Math.sqrt(v),r=S/i,n=A/i):b>M?b<.01?(i=.707106781,r=0,n=.707106781):(r=Math.sqrt(b),i=S/r,n=w/r):M<.01?(i=.707106781,r=.707106781,n=0):(n=Math.sqrt(M),i=A/n,r=w/n),this.set(i,r,n,t),this}let x=Math.sqrt((g-p)*(g-p)+(u-m)*(u-m)+(f-h)*(f-h));return Math.abs(x)<.001&&(x=1),this.x=(g-p)/x,this.y=(u-m)/x,this.z=(f-h)/x,this.w=Math.acos((c+d+_-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=k(this.x,e.x,t.x),this.y=k(this.y,e.y,t.y),this.z=k(this.z,e.z,t.z),this.w=k(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=k(this.x,e,t),this.y=k(this.y,e,t),this.z=k(this.z,e,t),this.w=k(this.w,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(k(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Ch.prototype.isVector4=!0;var Ne=Ch;var Wi=class extends Ie{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:de,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new Ne(0,0,e,t),this.scissorTest=!1,this.viewport=new Ne(0,0,e,t),this.textures=[];let r={width:e,height:t,depth:i.depth},n=new te(r),s=i.count;for(let o=0;o<s;o++)this.textures[o]=n.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveColorBuffer=i.resolveColorBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.storeMultisampledColorBuffer=i.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=i.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=i.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:de,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let r=0,n=this.textures.length;r<n;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=i,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let r=Object.assign({},e.textures[t].image);this.textures[t].source=new Qe(r)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}};var Ut=class extends Wi{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}};var Jn=class extends te{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=fe,this.minFilter=fe,this.wrapR=Ue,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var Ra=class extends Ut{constructor(e=1,t=1,i=1,r={}){super(e,t,r),this.isWebGLArrayRenderTarget=!0,this.depth=i,this.texture=new Jn(null,e,t,i),this._setTextureOptions(r),this.texture.isRenderTargetTexture=!0}};var qi=class extends te{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=fe,this.minFilter=fe,this.wrapR=Ue,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}};var Pa=class extends Ut{constructor(e=1,t=1,i=1,r={}){super(e,t,r),this.isWebGL3DRenderTarget=!0,this.depth=i,this.texture=new qi(null,e,t,i),this._setTextureOptions(r),this.texture.isRenderTargetTexture=!0}};var Na=class Na{constructor(e,t,i,r,n,s,o,l,c,h,u,f,d,p,m,g){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,n,s,o,l,c,h,u,f,d,p,m,g)}set(e,t,i,r,n,s,o,l,c,h,u,f,d,p,m,g){let _=this.elements;return _[0]=e,_[4]=t,_[8]=i,_[12]=r,_[1]=n,_[5]=s,_[9]=o,_[13]=l,_[2]=c,_[6]=h,_[10]=u,_[14]=f,_[3]=d,_[7]=p,_[11]=m,_[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Na().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),i.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,i=e.elements,r=1/jn.setFromMatrixColumn(e,0).length(),n=1/jn.setFromMatrixColumn(e,1).length(),s=1/jn.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*n,t[5]=i[5]*n,t[6]=i[6]*n,t[7]=0,t[8]=i[8]*s,t[9]=i[9]*s,t[10]=i[10]*s,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,r=e.y,n=e.z,s=Math.cos(i),o=Math.sin(i),l=Math.cos(r),c=Math.sin(r),h=Math.cos(n),u=Math.sin(n);if(e.order==="XYZ"){let f=s*h,d=s*u,p=o*h,m=o*u;t[0]=l*h,t[4]=-l*u,t[8]=c,t[1]=d+p*c,t[5]=f-m*c,t[9]=-o*l,t[2]=m-f*c,t[6]=p+d*c,t[10]=s*l}else if(e.order==="YXZ"){let f=l*h,d=l*u,p=c*h,m=c*u;t[0]=f+m*o,t[4]=p*o-d,t[8]=s*c,t[1]=s*u,t[5]=s*h,t[9]=-o,t[2]=d*o-p,t[6]=m+f*o,t[10]=s*l}else if(e.order==="ZXY"){let f=l*h,d=l*u,p=c*h,m=c*u;t[0]=f-m*o,t[4]=-s*u,t[8]=p+d*o,t[1]=d+p*o,t[5]=s*h,t[9]=m-f*o,t[2]=-s*c,t[6]=o,t[10]=s*l}else if(e.order==="ZYX"){let f=s*h,d=s*u,p=o*h,m=o*u;t[0]=l*h,t[4]=p*c-d,t[8]=f*c+m,t[1]=l*u,t[5]=m*c+f,t[9]=d*c-p,t[2]=-c,t[6]=o*l,t[10]=s*l}else if(e.order==="YZX"){let f=s*l,d=s*c,p=o*l,m=o*c;t[0]=l*h,t[4]=m-f*u,t[8]=p*u+d,t[1]=u,t[5]=s*h,t[9]=-o*h,t[2]=-c*h,t[6]=d*u+p,t[10]=f-m*u}else if(e.order==="XZY"){let f=s*l,d=s*c,p=o*l,m=o*c;t[0]=l*h,t[4]=-u,t[8]=c*h,t[1]=f*u+m,t[5]=s*h,t[9]=d*u-p,t[2]=p*u-d,t[6]=o*h,t[10]=m*u+f}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(A0,e,T0)}lookAt(e,t,i){let r=this.elements;return Ct.subVectors(e,t),Ct.lengthSq()===0&&(Ct.z=1),Ct.normalize(),Xi.crossVectors(i,Ct),Xi.lengthSq()===0&&(Math.abs(i.z)===1?Ct.x+=1e-4:Ct.z+=1e-4,Ct.normalize(),Xi.crossVectors(i,Ct)),Xi.normalize(),La.crossVectors(Ct,Xi),r[0]=Xi.x,r[4]=La.x,r[8]=Ct.x,r[1]=Xi.y,r[5]=La.y,r[9]=Ct.y,r[2]=Xi.z,r[6]=La.z,r[10]=Ct.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,r=t.elements,n=this.elements,s=i[0],o=i[4],l=i[8],c=i[12],h=i[1],u=i[5],f=i[9],d=i[13],p=i[2],m=i[6],g=i[10],_=i[14],x=i[3],v=i[7],b=i[11],M=i[15],S=r[0],A=r[4],w=r[8],E=r[12],C=r[1],N=r[5],V=r[9],X=r[13],ee=r[2],q=r[6],ue=r[10],_e=r[14],Ve=r[3],pe=r[7],xe=r[11],ye=r[15];return n[0]=s*S+o*C+l*ee+c*Ve,n[4]=s*A+o*N+l*q+c*pe,n[8]=s*w+o*V+l*ue+c*xe,n[12]=s*E+o*X+l*_e+c*ye,n[1]=h*S+u*C+f*ee+d*Ve,n[5]=h*A+u*N+f*q+d*pe,n[9]=h*w+u*V+f*ue+d*xe,n[13]=h*E+u*X+f*_e+d*ye,n[2]=p*S+m*C+g*ee+_*Ve,n[6]=p*A+m*N+g*q+_*pe,n[10]=p*w+m*V+g*ue+_*xe,n[14]=p*E+m*X+g*_e+_*ye,n[3]=x*S+v*C+b*ee+M*Ve,n[7]=x*A+v*N+b*q+M*pe,n[11]=x*w+v*V+b*ue+M*xe,n[15]=x*E+v*X+b*_e+M*ye,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],r=e[8],n=e[12],s=e[1],o=e[5],l=e[9],c=e[13],h=e[2],u=e[6],f=e[10],d=e[14],p=e[3],m=e[7],g=e[11],_=e[15],x=l*d-c*f,v=o*d-c*u,b=o*f-l*u,M=s*d-c*h,S=s*f-l*h,A=s*u-o*h;return t*(m*x-g*v+_*b)-i*(p*x-g*M+_*S)+r*(p*v-m*M+_*A)-n*(p*b-m*S+g*A)}determinantAffine(){let e=this.elements,t=e[0],i=e[4],r=e[8],n=e[1],s=e[5],o=e[9],l=e[2],c=e[6],h=e[10];return t*(s*h-o*c)-i*(n*h-o*l)+r*(n*c-s*l)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],r=e[2],n=e[3],s=e[4],o=e[5],l=e[6],c=e[7],h=e[8],u=e[9],f=e[10],d=e[11],p=e[12],m=e[13],g=e[14],_=e[15],x=t*o-i*s,v=t*l-r*s,b=t*c-n*s,M=i*l-r*o,S=i*c-n*o,A=r*c-n*l,w=h*m-u*p,E=h*g-f*p,C=h*_-d*p,N=u*g-f*m,V=u*_-d*m,X=f*_-d*g,ee=x*X-v*V+b*N+M*C-S*E+A*w;if(ee===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let q=1/ee;return e[0]=(o*X-l*V+c*N)*q,e[1]=(r*V-i*X-n*N)*q,e[2]=(m*A-g*S+_*M)*q,e[3]=(f*S-u*A-d*M)*q,e[4]=(l*C-s*X-c*E)*q,e[5]=(t*X-r*C+n*E)*q,e[6]=(g*b-p*A-_*v)*q,e[7]=(h*A-f*b+d*v)*q,e[8]=(s*V-o*C+c*w)*q,e[9]=(i*C-t*V-n*w)*q,e[10]=(p*S-m*b+_*x)*q,e[11]=(u*b-h*S-d*x)*q,e[12]=(o*E-s*N-l*w)*q,e[13]=(t*N-i*E+r*w)*q,e[14]=(m*v-p*M-g*x)*q,e[15]=(h*M-u*v+f*x)*q,this}scale(e){let t=this.elements,i=e.x,r=e.y,n=e.z;return t[0]*=i,t[4]*=r,t[8]*=n,t[1]*=i,t[5]*=r,t[9]*=n,t[2]*=i,t[6]*=r,t[10]*=n,t[3]*=i,t[7]*=r,t[11]*=n,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),r=Math.sin(t),n=1-i,s=e.x,o=e.y,l=e.z,c=n*s,h=n*o;return this.set(c*s+i,c*o-r*l,c*l+r*o,0,c*o+r*l,h*o+i,h*l-r*s,0,c*l-r*o,h*l+r*s,n*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,n,s){return this.set(1,i,n,0,e,1,s,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){let r=this.elements,n=t._x,s=t._y,o=t._z,l=t._w,c=n+n,h=s+s,u=o+o,f=n*c,d=n*h,p=n*u,m=s*h,g=s*u,_=o*u,x=l*c,v=l*h,b=l*u,M=i.x,S=i.y,A=i.z;return r[0]=(1-(m+_))*M,r[1]=(d+b)*M,r[2]=(p-v)*M,r[3]=0,r[4]=(d-b)*S,r[5]=(1-(f+_))*S,r[6]=(g+x)*S,r[7]=0,r[8]=(p+v)*A,r[9]=(g-x)*A,r[10]=(1-(f+m))*A,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let n=this.determinantAffine();if(n===0)return i.set(1,1,1),t.identity(),this;let s=jn.set(r[0],r[1],r[2]).length(),o=jn.set(r[4],r[5],r[6]).length(),l=jn.set(r[8],r[9],r[10]).length();n<0&&(s=-s),Kt.copy(this);let c=1/s,h=1/o,u=1/l;return Kt.elements[0]*=c,Kt.elements[1]*=c,Kt.elements[2]*=c,Kt.elements[4]*=h,Kt.elements[5]*=h,Kt.elements[6]*=h,Kt.elements[8]*=u,Kt.elements[9]*=u,Kt.elements[10]*=u,t.setFromRotationMatrix(Kt),i.x=s,i.y=o,i.z=l,this}makePerspective(e,t,i,r,n,s,o=Xe,l=!1){let c=this.elements,h=2*n/(t-e),u=2*n/(i-r),f=(t+e)/(t-e),d=(i+r)/(i-r),p,m;if(l)p=n/(s-n),m=s*n/(s-n);else if(o===Xe)p=-(s+n)/(s-n),m=-2*s*n/(s-n);else if(o===Ft)p=-s/(s-n),m=-s*n/(s-n);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=f,c[12]=0,c[1]=0,c[5]=u,c[9]=d,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,i,r,n,s,o=Xe,l=!1){let c=this.elements,h=2/(t-e),u=2/(i-r),f=-(t+e)/(t-e),d=-(i+r)/(i-r),p,m;if(l)p=1/(s-n),m=s/(s-n);else if(o===Xe)p=-2/(s-n),m=-(s+n)/(s-n);else if(o===Ft)p=-1/(s-n),m=-n/(s-n);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=0,c[12]=f,c[1]=0,c[5]=u,c[9]=0,c[13]=d,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}};Na.prototype.isMatrix4=!0;var F=Na,jn=new y,Kt=new F,A0=new y(0,0,0),T0=new y(1,1,1),Xi=new y,La=new y,Ct=new y;var Pf=new F,Lf=new ce,Ge=class a{constructor(e=0,t=0,i=0,r=a.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let r=e.elements,n=r[0],s=r[4],o=r[8],l=r[1],c=r[5],h=r[9],u=r[2],f=r[6],d=r[10];switch(t){case"XYZ":this._y=Math.asin(k(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,d),this._z=Math.atan2(-s,n)):(this._x=Math.atan2(f,c),this._z=0);break;case"YXZ":this._x=Math.asin(-k(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,d),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,n),this._z=0);break;case"ZXY":this._x=Math.asin(k(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-u,d),this._z=Math.atan2(-s,c)):(this._y=0,this._z=Math.atan2(l,n));break;case"ZYX":this._y=Math.asin(-k(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(f,d),this._z=Math.atan2(l,n)):(this._x=0,this._z=Math.atan2(-s,c));break;case"YZX":this._z=Math.asin(k(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,n)):(this._x=0,this._y=Math.atan2(o,d));break;case"XZY":this._z=Math.asin(-k(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(f,c),this._y=Math.atan2(o,n)):(this._x=Math.atan2(-h,d),this._y=0);break;default:B("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return Pf.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Pf,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Lf.setFromEuler(this),this.setFromQuaternion(Lf,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Ge.DEFAULT_ORDER="XYZ";var Yi=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}};var C0=0,Nf=new y,Kn=new ce,Ci=new F,Da=new y,Bo=new y,E0=new y,I0=new ce,Df=new y(1,0,0),Bf=new y(0,1,0),Of=new y(0,0,1),Ff={type:"added"},R0={type:"removed"},$n={type:"childadded",child:null},Eh={type:"childremoved",child:null},G=class a extends Ie{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:C0++}),this.uuid=Te(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=a.DEFAULT_UP.clone();let e=new y,t=new Ge,i=new ce,r=new y(1,1,1);function n(){i.setFromEuler(t,!1)}function s(){t.setFromQuaternion(i,void 0,!1)}t._onChange(n),i._onChange(s),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new F},normalMatrix:{value:new Y}}),this.matrix=new F,this.matrixWorld=new F,this.matrixAutoUpdate=a.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=a.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Yi,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Kn.setFromAxisAngle(e,t),this.quaternion.multiply(Kn),this}rotateOnWorldAxis(e,t){return Kn.setFromAxisAngle(e,t),this.quaternion.premultiply(Kn),this}rotateX(e){return this.rotateOnAxis(Df,e)}rotateY(e){return this.rotateOnAxis(Bf,e)}rotateZ(e){return this.rotateOnAxis(Of,e)}translateOnAxis(e,t){return Nf.copy(e).applyQuaternion(this.quaternion),this.position.add(Nf.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Df,e)}translateY(e){return this.translateOnAxis(Bf,e)}translateZ(e){return this.translateOnAxis(Of,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Ci.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Da.copy(e):Da.set(e,t,i);let r=this.parent;this.updateWorldMatrix(!0,!1),Bo.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Ci.lookAt(Bo,Da,this.up):Ci.lookAt(Da,Bo,this.up),this.quaternion.setFromRotationMatrix(Ci),r&&(Ci.extractRotation(r.matrixWorld),Kn.setFromRotationMatrix(Ci),this.quaternion.premultiply(Kn.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Z("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Ff),$n.child=e,this.dispatchEvent($n),$n.child=null):Z("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(R0),Eh.child=e,this.dispatchEvent(Eh),Eh.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Ci.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Ci.multiply(e.parent.matrixWorld)),e.applyMatrix4(Ci),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Ff),$n.child=e,this.dispatchEvent($n),$n.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){let s=this.children[i].getObjectByProperty(e,t);if(s!==void 0)return s}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let r=this.children;for(let n=0,s=r.length;n<s;n++)r[n].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Bo,e,E0),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Bo,I0,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,i=e.y,r=e.z,n=this.matrix.elements;n[12]+=t-n[0]*t-n[4]*i-n[8]*r,n[13]+=i-n[1]*t-n[5]*i-n[9]*r,n[14]+=r-n[2]*t-n[6]*i-n[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t,i=!1){let r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),t===!0){let n=this.children;for(let s=0,o=n.length;s<o;s++)n[s].updateWorldMatrix(!1,!0,i)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(o=>({...o})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function n(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=n(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let u=l[c];n(e.shapes,u)}else n(e.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(n(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(n(e.materials,this.material[l]));r.material=o}else r.material=n(e.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];r.animations.push(n(e.animations,l))}}if(t){let o=s(e.geometries),l=s(e.materials),c=s(e.textures),h=s(e.images),u=s(e.shapes),f=s(e.skeletons),d=s(e.animations),p=s(e.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),h.length>0&&(i.images=h),u.length>0&&(i.shapes=u),f.length>0&&(i.skeletons=f),d.length>0&&(i.animations=d),p.length>0&&(i.nodes=p)}return i.object=r,i;function s(o){let l=[];for(let c in o){let h=o[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let r=e.children[i];this.add(r.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};G.DEFAULT_UP=new y(0,1,0);G.DEFAULT_MATRIX_AUTO_UPDATE=!0;G.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var ct=class extends G{constructor(){super(),this.isGroup=!0,this.type="Group"}};var P0={type:"move"},Ba=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ct,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ct,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new y,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new y),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ct,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new y,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new y,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,n=null,s=null,o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){s=!0;for(let m of e.hand.values()){let g=t.getJointPose(m,i),_=this._getHandJoint(c,m);g!==null&&(_.matrix.fromArray(g.transform.matrix),_.matrix.decompose(_.position,_.rotation,_.scale),_.matrixWorldNeedsUpdate=!0,_.jointRadius=g.radius),_.visible=g!==null}let h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],f=h.position.distanceTo(u.position),d=.02,p=.005;c.inputState.pinching&&f>d+p?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&f<=d-p&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(n=t.getPose(e.gripSpace,i),n!==null&&(l.matrix.fromArray(n.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,n.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(n.linearVelocity)):l.hasLinearVelocity=!1,n.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(n.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&n!==null&&(r=n),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(P0)))}return o!==null&&(o.visible=r!==null),l!==null&&(l.visible=n!==null),c!==null&&(c.visible=s!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new ct;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}};var Uf={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Zi={h:0,s:0,l:0},Oa={h:0,s:0,l:0};function Ih(a,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?a+(e-a)*6*t:t<1/2?e:t<2/3?a+(e-a)*6*(2/3-t):a}var I=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=me){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Le.colorSpaceToWorking(this,t),this}setRGB(e,t,i,r=Le.workingColorSpace){return this.r=e,this.g=t,this.b=i,Le.colorSpaceToWorking(this,r),this}setHSL(e,t,i,r=Le.workingColorSpace){if(e=Ca(e,1),t=k(t,0,1),i=k(i,0,1),t===0)this.r=this.g=this.b=i;else{let n=i<=.5?i*(1+t):i+t-i*t,s=2*i-n;this.r=Ih(s,n,e+1/3),this.g=Ih(s,n,e),this.b=Ih(s,n,e-1/3)}return Le.colorSpaceToWorking(this,r),this}setStyle(e,t=me){function i(n){n!==void 0&&parseFloat(n)<1&&B("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let n,s=r[1],o=r[2];switch(s){case"rgb":case"rgba":if(n=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(n[4]),this.setRGB(Math.min(255,parseInt(n[1],10))/255,Math.min(255,parseInt(n[2],10))/255,Math.min(255,parseInt(n[3],10))/255,t);if(n=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(n[4]),this.setRGB(Math.min(100,parseInt(n[1],10))/100,Math.min(100,parseInt(n[2],10))/100,Math.min(100,parseInt(n[3],10))/100,t);break;case"hsl":case"hsla":if(n=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(n[4]),this.setHSL(parseFloat(n[1])/360,parseFloat(n[2])/100,parseFloat(n[3])/100,t);break;default:B("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let n=r[1],s=n.length;if(s===3)return this.setRGB(parseInt(n.charAt(0),16)/15,parseInt(n.charAt(1),16)/15,parseInt(n.charAt(2),16)/15,t);if(s===6)return this.setHex(parseInt(n,16),t);B("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=me){let i=Uf[e.toLowerCase()];return i!==void 0?this.setHex(i,t):B("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=jt(e.r),this.g=jt(e.g),this.b=jt(e.b),this}copyLinearToSRGB(e){return this.r=Nr(e.r),this.g=Nr(e.g),this.b=Nr(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=me){return Le.workingToColorSpace(et.copy(this),e),Math.round(k(et.r*255,0,255))*65536+Math.round(k(et.g*255,0,255))*256+Math.round(k(et.b*255,0,255))}getHexString(e=me){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Le.workingColorSpace){Le.workingToColorSpace(et.copy(this),t);let i=et.r,r=et.g,n=et.b,s=Math.max(i,r,n),o=Math.min(i,r,n),l,c,h=(o+s)/2;if(o===s)l=0,c=0;else{let u=s-o;switch(c=h<=.5?u/(s+o):u/(2-s-o),s){case i:l=(r-n)/u+(r<n?6:0);break;case r:l=(n-i)/u+2;break;case n:l=(i-r)/u+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=Le.workingColorSpace){return Le.workingToColorSpace(et.copy(this),t),e.r=et.r,e.g=et.g,e.b=et.b,e}getStyle(e=me){Le.workingToColorSpace(et.copy(this),e);let t=et.r,i=et.g,r=et.b;return e!==me?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,t,i){return this.getHSL(Zi),this.setHSL(Zi.h+e,Zi.s+t,Zi.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(Zi),e.getHSL(Oa);let i=Xn(Zi.h,Oa.h,t),r=Xn(Zi.s,Oa.s,t),n=Xn(Zi.l,Oa.l,t);return this.setHSL(i,r,n),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,r=this.b,n=e.elements;return this.r=n[0]*t+n[3]*i+n[6]*r,this.g=n[1]*t+n[4]*i+n[7]*r,this.b=n[2]*t+n[5]*i+n[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},et=new I;I.NAMES=Uf;var Qn=class a{constructor(e,t=25e-5){this.isFogExp2=!0,this.name="",this.color=new I(e),this.density=t}clone(){return new a(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}};var es=class a{constructor(e,t=1,i=1e3){this.isFog=!0,this.name="",this.color=new I(e),this.near=t,this.far=i}clone(){return new a(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}};var ts=class extends G{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Ge,this.environmentIntensity=1,this.environmentRotation=new Ge,this.overrideMaterial=null}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}};var $t=new y,Ei=new y,Rh=new y,Ii=new y,is=new y,rs=new y,zf=new y,Ph=new y,Lh=new y,Nh=new y,Dh=new Ne,Bh=new Ne,Oh=new Ne,gt=class a{constructor(e=new y,t=new y,i=new y){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),$t.subVectors(e,t),r.cross($t);let n=r.lengthSq();return n>0?r.multiplyScalar(1/Math.sqrt(n)):r.set(0,0,0)}static getBarycoord(e,t,i,r,n){$t.subVectors(r,t),Ei.subVectors(i,t),Rh.subVectors(e,t);let s=$t.dot($t),o=$t.dot(Ei),l=$t.dot(Rh),c=Ei.dot(Ei),h=Ei.dot(Rh),u=s*c-o*o;if(u===0)return n.set(0,0,0),null;let f=1/u,d=(c*l-o*h)*f,p=(s*h-o*l)*f;return n.set(1-d-p,p,d)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,Ii)===null?!1:Ii.x>=0&&Ii.y>=0&&Ii.x+Ii.y<=1}static getInterpolation(e,t,i,r,n,s,o,l){return this.getBarycoord(e,t,i,r,Ii)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(n,Ii.x),l.addScaledVector(s,Ii.y),l.addScaledVector(o,Ii.z),l)}static getInterpolatedAttribute(e,t,i,r,n,s){return Dh.setScalar(0),Bh.setScalar(0),Oh.setScalar(0),Dh.fromBufferAttribute(e,t),Bh.fromBufferAttribute(e,i),Oh.fromBufferAttribute(e,r),s.setScalar(0),s.addScaledVector(Dh,n.x),s.addScaledVector(Bh,n.y),s.addScaledVector(Oh,n.z),s}static isFrontFacing(e,t,i,r){return $t.subVectors(i,t),Ei.subVectors(e,t),$t.cross(Ei).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return $t.subVectors(this.c,this.b),Ei.subVectors(this.a,this.b),$t.cross(Ei).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return a.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return a.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,r,n){return a.getInterpolation(e,this.a,this.b,this.c,t,i,r,n)}containsPoint(e){return a.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return a.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,r=this.b,n=this.c,s,o;is.subVectors(r,i),rs.subVectors(n,i),Ph.subVectors(e,i);let l=is.dot(Ph),c=rs.dot(Ph);if(l<=0&&c<=0)return t.copy(i);Lh.subVectors(e,r);let h=is.dot(Lh),u=rs.dot(Lh);if(h>=0&&u<=h)return t.copy(r);let f=l*u-h*c;if(f<=0&&l>=0&&h<=0)return s=l/(l-h),t.copy(i).addScaledVector(is,s);Nh.subVectors(e,n);let d=is.dot(Nh),p=rs.dot(Nh);if(p>=0&&d<=p)return t.copy(n);let m=d*c-l*p;if(m<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(i).addScaledVector(rs,o);let g=h*p-d*u;if(g<=0&&u-h>=0&&d-p>=0)return zf.subVectors(n,r),o=(u-h)/(u-h+(d-p)),t.copy(r).addScaledVector(zf,o);let _=1/(g+m+f);return s=m*_,o=f*_,t.copy(i).addScaledVector(is,s).addScaledVector(rs,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}};var he=class{constructor(e=new y(1/0,1/0,1/0),t=new y(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(Qt.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(Qt.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=Qt.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let n=i.getAttribute("position");if(t===!0&&n!==void 0&&e.isInstancedMesh!==!0)for(let s=0,o=n.count;s<o;s++)e.isMesh===!0?e.getVertexPosition(s,Qt):Qt.fromBufferAttribute(n,s),Qt.applyMatrix4(e.matrixWorld),this.expandByPoint(Qt);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Fa.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Fa.copy(i.boundingBox)),Fa.applyMatrix4(e.matrixWorld),this.union(Fa)}let r=e.children;for(let n=0,s=r.length;n<s;n++)this.expandByObject(r[n],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Qt),Qt.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Oo),Ua.subVectors(this.max,Oo),ns.subVectors(e.a,Oo),ss.subVectors(e.b,Oo),os.subVectors(e.c,Oo),Ji.subVectors(ss,ns),ji.subVectors(os,ss),Dr.subVectors(ns,os);let t=[0,-Ji.z,Ji.y,0,-ji.z,ji.y,0,-Dr.z,Dr.y,Ji.z,0,-Ji.x,ji.z,0,-ji.x,Dr.z,0,-Dr.x,-Ji.y,Ji.x,0,-ji.y,ji.x,0,-Dr.y,Dr.x,0];return!Fh(t,ns,ss,os,Ua)||(t=[1,0,0,0,1,0,0,0,1],!Fh(t,ns,ss,os,Ua))?!1:(za.crossVectors(Ji,ji),t=[za.x,za.y,za.z],Fh(t,ns,ss,os,Ua))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Qt).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Qt).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Ri[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Ri[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Ri[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Ri[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Ri[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Ri[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Ri[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Ri[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Ri),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Ri=[new y,new y,new y,new y,new y,new y,new y,new y],Qt=new y,Fa=new he,ns=new y,ss=new y,os=new y,Ji=new y,ji=new y,Dr=new y,Oo=new y,Ua=new y,za=new y,Br=new y;function Fh(a,e,t,i,r){for(let n=0,s=a.length-3;n<=s;n+=3){Br.fromArray(a,n);let o=r.x*Math.abs(Br.x)+r.y*Math.abs(Br.y)+r.z*Math.abs(Br.z),l=e.dot(Br),c=t.dot(Br),h=i.dot(Br);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}var Pi=L0();function L0(){let a=new ArrayBuffer(4),e=new Float32Array(a),t=new Uint32Array(a),i=new Uint32Array(512),r=new Uint32Array(512);for(let l=0;l<256;++l){let c=l-127;c<-27?(i[l]=0,i[l|256]=32768,r[l]=24,r[l|256]=24):c<-14?(i[l]=1024>>-c-14,i[l|256]=1024>>-c-14|32768,r[l]=-c-1,r[l|256]=-c-1):c<=15?(i[l]=c+15<<10,i[l|256]=c+15<<10|32768,r[l]=13,r[l|256]=13):c<128?(i[l]=31744,i[l|256]=64512,r[l]=24,r[l|256]=24):(i[l]=31744,i[l|256]=64512,r[l]=13,r[l|256]=13)}let n=new Uint32Array(2048),s=new Uint32Array(64),o=new Uint32Array(64);for(let l=1;l<1024;++l){let c=l<<13,h=0;for(;(c&8388608)===0;)c<<=1,h-=8388608;c&=-8388609,h+=947912704,n[l]=c|h}for(let l=1024;l<2048;++l)n[l]=939524096+(l-1024<<13);for(let l=1;l<31;++l)s[l]=l<<23;s[31]=1199570944,s[32]=2147483648;for(let l=33;l<63;++l)s[l]=2147483648+(l-32<<23);s[63]=3347054592;for(let l=1;l<64;++l)l!==32&&(o[l]=1024);return{floatView:e,uint32View:t,baseTable:i,shiftTable:r,mantissaTable:n,exponentTable:s,offsetTable:o}}function ht(a){Math.abs(a)>65504&&B("DataUtils.toHalfFloat(): Value out of range."),a=k(a,-65504,65504),Pi.floatView[0]=a;let e=Pi.uint32View[0],t=e>>23&511;return Pi.baseTable[t]+((e&8388607)>>Pi.shiftTable[t])}function as(a){let e=a>>10;return Pi.uint32View[0]=Pi.mantissaTable[Pi.offsetTable[e]+(a&1023)]+Pi.exponentTable[e],Pi.floatView[0]}var ka=class{static toHalfFloat(e){return ht(e)}static fromHalfFloat(e){return as(e)}};var Oe=new y,Va=new T,N0=0,j=class extends Ie{constructor(e,t,i=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:N0++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=Pr,this.updateRanges=[],this.gpuType=mt,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,n=this.itemSize;r<n;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)Va.fromBufferAttribute(this,t),Va.applyMatrix3(e),this.setXY(t,Va.x,Va.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)Oe.fromBufferAttribute(this,t),Oe.applyMatrix3(e),this.setXYZ(t,Oe.x,Oe.y,Oe.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)Oe.fromBufferAttribute(this,t),Oe.applyMatrix4(e),this.setXYZ(t,Oe.x,Oe.y,Oe.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Oe.fromBufferAttribute(this,t),Oe.applyNormalMatrix(e),this.setXYZ(t,Oe.x,Oe.y,Oe.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Oe.fromBufferAttribute(this,t),Oe.transformDirection(e),this.setXYZ(t,Oe.x,Oe.y,Oe.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=Ye(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=J(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Ye(t,this.array)),t}setX(e,t){return this.normalized&&(t=J(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Ye(t,this.array)),t}setY(e,t){return this.normalized&&(t=J(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Ye(t,this.array)),t}setZ(e,t){return this.normalized&&(t=J(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Ye(t,this.array)),t}setW(e,t){return this.normalized&&(t=J(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=J(t,this.array),i=J(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=J(t,this.array),i=J(i,this.array),r=J(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,n){return e*=this.itemSize,this.normalized&&(t=J(t,this.array),i=J(i,this.array),r=J(r,this.array),n=J(n,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=n,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}},Uh=class extends j{constructor(e,t,i){super(new Int8Array(e),t,i)}},zh=class extends j{constructor(e,t,i){super(new Uint8Array(e),t,i)}},kh=class extends j{constructor(e,t,i){super(new Uint8ClampedArray(e),t,i)}},Vh=class extends j{constructor(e,t,i){super(new Int16Array(e),t,i)}},Fo=class extends j{constructor(e,t,i){super(new Uint16Array(e),t,i)}},Gh=class extends j{constructor(e,t,i){super(new Int32Array(e),t,i)}},Uo=class extends j{constructor(e,t,i){super(new Uint32Array(e),t,i)}},Hh=class extends j{constructor(e,t,i){super(new Uint16Array(e),t,i),this.isFloat16BufferAttribute=!0}getX(e){let t=as(this.array[e*this.itemSize]);return this.normalized&&(t=Ye(t,this.array)),t}setX(e,t){return this.normalized&&(t=J(t,this.array)),this.array[e*this.itemSize]=ht(t),this}getY(e){let t=as(this.array[e*this.itemSize+1]);return this.normalized&&(t=Ye(t,this.array)),t}setY(e,t){return this.normalized&&(t=J(t,this.array)),this.array[e*this.itemSize+1]=ht(t),this}getZ(e){let t=as(this.array[e*this.itemSize+2]);return this.normalized&&(t=Ye(t,this.array)),t}setZ(e,t){return this.normalized&&(t=J(t,this.array)),this.array[e*this.itemSize+2]=ht(t),this}getW(e){let t=as(this.array[e*this.itemSize+3]);return this.normalized&&(t=Ye(t,this.array)),t}setW(e,t){return this.normalized&&(t=J(t,this.array)),this.array[e*this.itemSize+3]=ht(t),this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=J(t,this.array),i=J(i,this.array)),this.array[e+0]=ht(t),this.array[e+1]=ht(i),this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=J(t,this.array),i=J(i,this.array),r=J(r,this.array)),this.array[e+0]=ht(t),this.array[e+1]=ht(i),this.array[e+2]=ht(r),this}setXYZW(e,t,i,r,n){return e*=this.itemSize,this.normalized&&(t=J(t,this.array),i=J(i,this.array),r=J(r,this.array),n=J(n,this.array)),this.array[e+0]=ht(t),this.array[e+1]=ht(i),this.array[e+2]=ht(r),this.array[e+3]=ht(n),this}},R=class extends j{constructor(e,t,i){super(new Float32Array(e),t,i)}};var D0=new he,zo=new y,Wh=new y,oe=class{constructor(e=new y,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):D0.setFromPoints(e).getCenter(i);let r=0;for(let n=0,s=e.length;n<s;n++)r=Math.max(r,i.distanceToSquared(e[n]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;zo.subVectors(e,this.center);let t=zo.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),r=(i-this.radius)*.5;this.center.addScaledVector(zo,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Wh.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(zo.copy(e.center).add(Wh)),this.expandByPoint(zo.copy(e.center).sub(Wh))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}};var B0=0,zt=new F,qh=new G,ls=new y,Et=new he,ko=new he,He=new y,P=class a extends Ie{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:B0++}),this.uuid=Te(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Sf(e)?Uo:Fo)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let n=new Y().getNormalMatrix(e);i.applyNormalMatrix(n),i.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return zt.makeRotationFromQuaternion(e),this.applyMatrix4(zt),this}rotateX(e){return zt.makeRotationX(e),this.applyMatrix4(zt),this}rotateY(e){return zt.makeRotationY(e),this.applyMatrix4(zt),this}rotateZ(e){return zt.makeRotationZ(e),this.applyMatrix4(zt),this}translate(e,t,i){return zt.makeTranslation(e,t,i),this.applyMatrix4(zt),this}scale(e,t,i){return zt.makeScale(e,t,i),this.applyMatrix4(zt),this}lookAt(e){return qh.lookAt(e),qh.updateMatrix(),this.applyMatrix4(qh.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ls).negate(),this.translate(ls.x,ls.y,ls.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let i=[];for(let r=0,n=e.length;r<n;r++){let s=e[r];i.push(s.x,s.y,s.z||0)}this.setAttribute("position",new R(i,3))}else{let i=Math.min(e.length,t.count);for(let r=0;r<i;r++){let n=e[r];t.setXYZ(r,n.x,n.y,n.z||0)}e.length>t.count&&B("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new he);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Z("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new y(-1/0,-1/0,-1/0),new y(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){let n=t[i];Et.setFromBufferAttribute(n),this.morphTargetsRelative?(He.addVectors(this.boundingBox.min,Et.min),this.boundingBox.expandByPoint(He),He.addVectors(this.boundingBox.max,Et.max),this.boundingBox.expandByPoint(He)):(this.boundingBox.expandByPoint(Et.min),this.boundingBox.expandByPoint(Et.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Z('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new oe);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Z("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new y,1/0);return}if(e){let i=this.boundingSphere.center;if(Et.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){let o=t[n];ko.setFromBufferAttribute(o),this.morphTargetsRelative?(He.addVectors(Et.min,ko.min),Et.expandByPoint(He),He.addVectors(Et.max,ko.max),Et.expandByPoint(He)):(Et.expandByPoint(ko.min),Et.expandByPoint(ko.max))}Et.getCenter(i);let r=0;for(let n=0,s=e.count;n<s;n++)He.fromBufferAttribute(e,n),r=Math.max(r,i.distanceToSquared(He));if(t)for(let n=0,s=t.length;n<s;n++){let o=t[n],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)He.fromBufferAttribute(o,c),l&&(ls.fromBufferAttribute(e,c),He.add(ls)),r=Math.max(r,i.distanceToSquared(He))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&Z('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Z("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.position,r=t.normal,n=t.uv,s=this.getAttribute("tangent");(s===void 0||s.count!==i.count)&&(s=new j(new Float32Array(4*i.count),4),this.setAttribute("tangent",s));let o=[],l=[];for(let w=0;w<i.count;w++)o[w]=new y,l[w]=new y;let c=new y,h=new y,u=new y,f=new T,d=new T,p=new T,m=new y,g=new y;function _(w,E,C){c.fromBufferAttribute(i,w),h.fromBufferAttribute(i,E),u.fromBufferAttribute(i,C),f.fromBufferAttribute(n,w),d.fromBufferAttribute(n,E),p.fromBufferAttribute(n,C),h.sub(c),u.sub(c),d.sub(f),p.sub(f);let N=1/(d.x*p.y-p.x*d.y);isFinite(N)&&(m.copy(h).multiplyScalar(p.y).addScaledVector(u,-d.y).multiplyScalar(N),g.copy(u).multiplyScalar(d.x).addScaledVector(h,-p.x).multiplyScalar(N),o[w].add(m),o[E].add(m),o[C].add(m),l[w].add(g),l[E].add(g),l[C].add(g))}let x=this.groups;x.length===0&&(x=[{start:0,count:e.count}]);for(let w=0,E=x.length;w<E;++w){let C=x[w],N=C.start,V=C.count;for(let X=N,ee=N+V;X<ee;X+=3)_(e.getX(X+0),e.getX(X+1),e.getX(X+2))}let v=new y,b=new y,M=new y,S=new y;function A(w){M.fromBufferAttribute(r,w),S.copy(M);let E=o[w];v.copy(E),v.sub(M.multiplyScalar(M.dot(E))).normalize(),b.crossVectors(S,E);let N=b.dot(l[w])<0?-1:1;s.setXYZW(w,v.x,v.y,v.z,N)}for(let w=0,E=x.length;w<E;++w){let C=x[w],N=C.start,V=C.count;for(let X=N,ee=N+V;X<ee;X+=3)A(e.getX(X+0)),A(e.getX(X+1)),A(e.getX(X+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==t.count)i=new j(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let f=0,d=i.count;f<d;f++)i.setXYZ(f,0,0,0);let r=new y,n=new y,s=new y,o=new y,l=new y,c=new y,h=new y,u=new y;if(e)for(let f=0,d=e.count;f<d;f+=3){let p=e.getX(f+0),m=e.getX(f+1),g=e.getX(f+2);r.fromBufferAttribute(t,p),n.fromBufferAttribute(t,m),s.fromBufferAttribute(t,g),h.subVectors(s,n),u.subVectors(r,n),h.cross(u),o.fromBufferAttribute(i,p),l.fromBufferAttribute(i,m),c.fromBufferAttribute(i,g),o.add(h),l.add(h),c.add(h),i.setXYZ(p,o.x,o.y,o.z),i.setXYZ(m,l.x,l.y,l.z),i.setXYZ(g,c.x,c.y,c.z)}else for(let f=0,d=t.count;f<d;f+=3)r.fromBufferAttribute(t,f+0),n.fromBufferAttribute(t,f+1),s.fromBufferAttribute(t,f+2),h.subVectors(s,n),u.subVectors(r,n),h.cross(u),i.setXYZ(f+0,h.x,h.y,h.z),i.setXYZ(f+1,h.x,h.y,h.z),i.setXYZ(f+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)He.fromBufferAttribute(e,t),He.normalize(),e.setXYZ(t,He.x,He.y,He.z)}toNonIndexed(){function e(o,l){let c=o.array,h=o.itemSize,u=o.normalized,f=new c.constructor(l.length*h),d=0,p=0;for(let m=0,g=l.length;m<g;m++){o.isInterleavedBufferAttribute?d=l[m]*o.data.stride+o.offset:d=l[m]*h;for(let _=0;_<h;_++)f[p++]=c[d++]}return new j(f,h,u)}if(this.index===null)return B("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new a,i=this.index.array,r=this.attributes;for(let o in r){let l=r[o],c=e(l,i);t.setAttribute(o,c)}let n=this.morphAttributes;for(let o in n){let l=[],c=n[o];for(let h=0,u=c.length;h<u;h++){let f=c[h],d=e(f,i);l.push(d)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;let s=this.groups;for(let o=0,l=s.length;o<l;o++){let c=s[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let l in i){let c=i[l];e.data.attributes[l]=c.toJSON(e.data)}let r={},n=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let u=0,f=c.length;u<f;u++){let d=c[u];h.push(d.toJSON(e.data))}h.length>0&&(r[l]=h,n=!0)}n&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let s=this.groups;s.length>0&&(e.data.groups=JSON.parse(JSON.stringify(s)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone());let r=e.attributes;for(let c in r){let h=r[c];this.setAttribute(c,h.clone(t))}let n=e.morphAttributes;for(let c in n){let h=[],u=n[c];for(let f=0,d=u.length;f<d;f++)h.push(u[f].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let s=e.groups;for(let c=0,h=s.length;c<h;c++){let u=s[c];this.addGroup(u.start,u.count,u.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var It=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=Pr,this.updateRanges=[],this.version=0,this.uuid=Te()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,i){e*=this.stride,i*=t.stride;for(let r=0,n=this.stride;r<n;r++)this.array[e+r]=t.array[i+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Te()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),i=new this.constructor(t,this.stride);return i.setUsage(this.usage),i}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Te()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer)));let t={uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride};return t.usage=this.usage,t}};var ut=new y,Rt=class a{constructor(e,t,i,r=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=i,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,i=this.data.count;t<i;t++)ut.fromBufferAttribute(this,t),ut.applyMatrix4(e),this.setXYZ(t,ut.x,ut.y,ut.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)ut.fromBufferAttribute(this,t),ut.applyNormalMatrix(e),this.setXYZ(t,ut.x,ut.y,ut.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)ut.fromBufferAttribute(this,t),ut.transformDirection(e),this.setXYZ(t,ut.x,ut.y,ut.z);return this}getComponent(e,t){let i=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(i=Ye(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=J(i,this.array)),this.data.array[e*this.data.stride+this.offset+t]=i,this}setX(e,t){return this.normalized&&(t=J(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=J(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=J(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=J(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=Ye(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=Ye(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=Ye(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=Ye(t,this.array)),t}setXY(e,t,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=J(t,this.array),i=J(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this}setXYZ(e,t,i,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=J(t,this.array),i=J(i,this.array),r=J(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=r,this}setXYZW(e,t,i,r,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=J(t,this.array),i=J(i,this.array),r=J(r,this.array),n=J(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=r,this.data.array[e+3]=n,this}clone(e){if(e===void 0){Do("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let r=i*this.data.stride+this.offset;for(let n=0;n<this.itemSize;n++)t.push(this.data.array[r+n])}return new j(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new a(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){Do("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let r=i*this.data.stride+this.offset;for(let n=0;n<this.itemSize;n++)t.push(this.data.array[r+n])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}};var Xh=new y,O0=new y,F0=new Y,Pt=class{constructor(e=new y(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let r=Xh.subVectors(i,t).cross(O0.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,i=!0){let r=e.delta(Xh),n=this.normal.dot(r);if(n===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let s=-(e.start.dot(this.normal)+this.constant)/n;return i===!0&&(s<0||s>1)?null:t.copy(e.start).addScaledVector(r,s)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||F0.getNormalMatrix(e),r=this.coplanarPoint(Xh).applyMatrix4(e),n=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(n),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}};var U0=0,$=class extends Ie{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:U0++}),this.uuid=Te(),this.name="",this.type="Material",this.blending=fo,this.side=Mi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=lh,this.blendDst=ch,this.blendEquation=ah,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new I(0,0,0),this.blendAlpha=0,this.depthFunc=cn,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=yh,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=No,this.stencilZFail=No,this.stencilZPass=No,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){B(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){B(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector2&&i&&i.isVector2||r&&r.isEuler&&i&&i.isEuler||r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,i.blending=this.blending,i.side=this.side,i.shadowSide=this.shadowSide,i.vertexColors=this.vertexColors,i.opacity=this.opacity,i.transparent=this.transparent,i.blendSrc=this.blendSrc,i.blendDst=this.blendDst,i.blendEquation=this.blendEquation,i.blendSrcAlpha=this.blendSrcAlpha,i.blendDstAlpha=this.blendDstAlpha,i.blendEquationAlpha=this.blendEquationAlpha,i.blendColor=this.blendColor.getHex(),i.blendAlpha=this.blendAlpha,i.depthFunc=this.depthFunc,i.depthTest=this.depthTest,i.depthWrite=this.depthWrite,i.colorWrite=this.colorWrite,i.clipIntersection=this.clipIntersection,i.clipShadows=this.clipShadows,i.stencilWriteMask=this.stencilWriteMask,i.stencilFunc=this.stencilFunc,i.stencilRef=this.stencilRef,i.stencilFuncMask=this.stencilFuncMask,i.stencilFail=this.stencilFail,i.stencilZFail=this.stencilZFail,i.stencilZPass=this.stencilZPass,i.stencilWrite=this.stencilWrite,i.polygonOffset=this.polygonOffset,i.polygonOffsetFactor=this.polygonOffsetFactor,i.polygonOffsetUnits=this.polygonOffsetUnits,i.dithering=this.dithering,i.alphaTest=this.alphaTest,i.alphaHash=this.alphaHash,i.alphaToCoverage=this.alphaToCoverage,i.premultipliedAlpha=this.premultipliedAlpha,i.forceSinglePass=this.forceSinglePass,i.allowOverride=this.allowOverride,i.visible=this.visible,i.toneMapped=this.toneMapped,i.name=this.name,this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(i.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(i.clippingPlanes=this.clippingPlanes.map(n=>n.toJSON())),this.rotation!==void 0&&(i.rotation=this.rotation),this.depthPacking!==void 0&&(i.depthPacking=this.depthPacking),this.linewidth!==void 0&&(i.linewidth=this.linewidth),this.linecap!==void 0&&(i.linecap=this.linecap),this.linejoin!==void 0&&(i.linejoin=this.linejoin),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.wireframe!==void 0&&(i.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(i.flatShading=this.flatShading),this.fog!==void 0&&(i.fog=this.fog),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(n){let s=[];for(let o in n){let l=n[o];delete l.metadata,s.push(l)}return s}if(t){let n=r(e.textures),s=r(e.images);n.length>0&&(i.textures=n),s.length>0&&(i.images=s)}return i}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new I().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(i=>new Pt().fromJSON(i))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let i=e.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new T().fromArray(i)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new T().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let r=t.length;i=new Array(r);for(let n=0;n!==r;++n)i[n]=t[n].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}};var Ki=class extends ${constructor(e){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new I(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}};var cs,Vo=new y,hs=new y,us=new y,fs=new T,Go=new T,Gf=new F,Ga=new y,Ho=new y,Ha=new y,kf=new T,Yh=new T,Vf=new T,ds=class extends G{constructor(e=new Ki){if(super(),this.isSprite=!0,this.type="Sprite",cs===void 0){cs=new P;let t=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),i=new It(t,5);cs.setIndex([0,1,2,0,2,3]),cs.setAttribute("position",new Rt(i,3,0,!1)),cs.setAttribute("uv",new Rt(i,2,3,!1))}this.geometry=cs,this.material=e,this.center=new T(.5,.5),this.count=1}intersectsFrustum(e){return e.intersectsSprite(this)}raycast(e,t){e.camera===null&&Z('Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),hs.setFromMatrixScale(this.matrixWorld),Gf.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),us.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&hs.multiplyScalar(-us.z);let i=this.material.rotation,r,n;i!==0&&(n=Math.cos(i),r=Math.sin(i));let s=this.center;Wa(Ga.set(-.5,-.5,0),us,s,hs,r,n),Wa(Ho.set(.5,-.5,0),us,s,hs,r,n),Wa(Ha.set(.5,.5,0),us,s,hs,r,n),kf.set(0,0),Yh.set(1,0),Vf.set(1,1);let o=e.ray.intersectTriangle(Ga,Ho,Ha,!1,Vo);if(o===null&&(Wa(Ho.set(-.5,.5,0),us,s,hs,r,n),Yh.set(0,1),o=e.ray.intersectTriangle(Ga,Ha,Ho,!1,Vo),o===null))return;let l=e.ray.origin.distanceTo(Vo);l<e.near||l>e.far||t.push({distance:l,point:Vo.clone(),uv:gt.getInterpolation(Vo,Ga,Ho,Ha,kf,Yh,Vf,new T),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}};function Wa(a,e,t,i,r,n){fs.subVectors(a,t).addScalar(.5).multiply(i),r!==void 0?(Go.x=n*fs.x-r*fs.y,Go.y=r*fs.x+n*fs.y):Go.copy(fs),a.copy(e),a.x+=Go.x,a.y+=Go.y,a.applyMatrix4(Gf)}var qa=new y,Hf=new y,ps=class extends G{constructor(){super(),this.isLOD=!0,this._currentLevel=0,this.type="LOD",Object.defineProperties(this,{levels:{enumerable:!0,value:[]}}),this.autoUpdate=!0}copy(e){super.copy(e,!1);let t=e.levels;for(let i=0,r=t.length;i<r;i++){let n=t[i];this.addLevel(n.object.clone(),n.distance,n.hysteresis)}return this.autoUpdate=e.autoUpdate,this}addLevel(e,t=0,i=0){t=Math.abs(t);let r=this.levels,n;for(n=0;n<r.length&&!(t<r[n].distance);n++);return r.splice(n,0,{distance:t,hysteresis:i,object:e}),this.add(e),this}removeLevel(e){let t=this.levels;for(let i=0;i<t.length;i++)if(t[i].distance===e){let r=t.splice(i,1);return this.remove(r[0].object),!0}return!1}getCurrentLevel(){return this._currentLevel}getObjectForDistance(e){let t=this.levels;if(t.length>0){let i,r;for(i=1,r=t.length;i<r;i++){let n=t[i].distance;if(t[i].object.visible&&(n-=n*t[i].hysteresis),e<n)break}return t[i-1].object}return null}raycast(e,t){if(this.levels.length>0){qa.setFromMatrixPosition(this.matrixWorld);let r=e.ray.origin.distanceTo(qa);this.getObjectForDistance(r).raycast(e,t)}}update(e){let t=this.levels;if(t.length>1){qa.setFromMatrixPosition(e.matrixWorld),Hf.setFromMatrixPosition(this.matrixWorld);let i=qa.distanceTo(Hf)/e.zoom;t[0].object.visible=!0;let r,n;for(r=1,n=t.length;r<n;r++){let s=t[r].distance;if(t[r].object.visible&&(s-=s*t[r].hysteresis),i>=s)t[r-1].object.visible=!1,t[r].object.visible=!0;else break}for(this._currentLevel=r-1;r<n;r++)t[r].object.visible=!1}}toJSON(e){let t=super.toJSON(e);t.object.autoUpdate=this.autoUpdate,t.object.levels=[];let i=this.levels;for(let r=0,n=i.length;r<n;r++){let s=i[r];t.object.levels.push({object:s.object.uuid,distance:s.distance,hysteresis:s.hysteresis})}return t}};var Li=new y,Zh=new y,Xa=new y,Ya=new y,_t=class{constructor(e=new y,t=new y(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Li)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Li.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Li.copy(this.origin).addScaledVector(this.direction,t),Li.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){Zh.copy(e).add(t).multiplyScalar(.5),Xa.copy(t).sub(e).normalize(),Ya.copy(this.origin).sub(Zh);let n=e.distanceTo(t)*.5,s=-this.direction.dot(Xa),o=Ya.dot(this.direction),l=-Ya.dot(Xa),c=Ya.lengthSq(),h=Math.abs(1-s*s),u,f,d,p;if(h>0)if(u=s*l-o,f=s*o-l,p=n*h,u>=0)if(f>=-p)if(f<=p){let m=1/h;u*=m,f*=m,d=u*(u+s*f+2*o)+f*(s*u+f+2*l)+c}else f=n,u=Math.max(0,-(s*f+o)),d=-u*u+f*(f+2*l)+c;else f=-n,u=Math.max(0,-(s*f+o)),d=-u*u+f*(f+2*l)+c;else f<=-p?(u=Math.max(0,-(-s*n+o)),f=u>0?-n:Math.min(Math.max(-n,-l),n),d=-u*u+f*(f+2*l)+c):f<=p?(u=0,f=Math.min(Math.max(-n,-l),n),d=f*(f+2*l)+c):(u=Math.max(0,-(s*n+o)),f=u>0?n:Math.min(Math.max(-n,-l),n),d=-u*u+f*(f+2*l)+c);else f=s>0?-n:n,u=Math.max(0,-(s*f+o)),d=-u*u+f*(f+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(Zh).addScaledVector(Xa,f),d}intersectSphere(e,t){if(e.radius<0)return null;Li.subVectors(e.center,this.origin);let i=Li.dot(this.direction),r=Li.dot(Li)-i*i,n=e.radius*e.radius;if(r>n)return null;let s=Math.sqrt(n-r),o=i-s,l=i+s;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,n,s,o,l,c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,f=this.origin;return c>=0?(i=(e.min.x-f.x)*c,r=(e.max.x-f.x)*c):(i=(e.max.x-f.x)*c,r=(e.min.x-f.x)*c),h>=0?(n=(e.min.y-f.y)*h,s=(e.max.y-f.y)*h):(n=(e.max.y-f.y)*h,s=(e.min.y-f.y)*h),i>s||n>r||((n>i||isNaN(i))&&(i=n),(s<r||isNaN(r))&&(r=s),u>=0?(o=(e.min.z-f.z)*u,l=(e.max.z-f.z)*u):(o=(e.max.z-f.z)*u,l=(e.min.z-f.z)*u),i>l||o>r)||((o>i||i!==i)&&(i=o),(l<r||r!==r)&&(r=l),r<0)?null:this.at(i>=0?i:r,t)}intersectsBox(e){return this.intersectBox(e,Li)!==null}intersectTriangle(e,t,i,r,n){let s=this.origin,o=this.direction,l=o.x,c=o.y,h=o.z,u=e.x-s.x,f=e.y-s.y,d=e.z-s.z,p=t.x-s.x,m=t.y-s.y,g=t.z-s.z,_=i.x-s.x,x=i.y-s.y,v=i.z-s.z,b=Math.abs(l),M=Math.abs(c),S=Math.abs(h),A,w,E,C,N,V,X,ee,q,ue,_e,Ve;if(b>=M&&b>=S?(E=l,V=u,q=p,Ve=_,l>=0?(A=c,w=h,C=f,N=d,X=m,ee=g,ue=x,_e=v):(A=h,w=c,C=d,N=f,X=g,ee=m,ue=v,_e=x)):M>=S?(E=c,V=f,q=m,Ve=x,c>=0?(A=h,w=l,C=d,N=u,X=g,ee=p,ue=v,_e=_):(A=l,w=h,C=u,N=d,X=p,ee=g,ue=_,_e=v)):(E=h,V=d,q=g,Ve=v,h>=0?(A=l,w=c,C=u,N=f,X=p,ee=m,ue=_,_e=x):(A=c,w=l,C=f,N=u,X=m,ee=p,ue=x,_e=_)),E===0)return null;let pe=A/E,xe=w/E,ye=1/E,pt=C-pe*V,at=N-xe*V,bi=X-pe*q,Oi=ee-xe*q,pa=ue-pe*Ve,ma=_e-xe*Ve,Fi=pa*Oi-ma*bi,lt=pt*ma-at*pa,oi=bi*at-Oi*pt;if(r){if(Fi<0||lt<0||oi<0)return null}else if((Fi<0||lt<0||oi<0)&&(Fi>0||lt>0||oi>0))return null;let ho=Fi+lt+oi;if(ho===0)return null;let bt=ye*(Fi*V+lt*q+oi*Ve);return(ho>0?bt<0:bt>0)?null:this.at(bt/ho,n)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}};var Se=class extends ${constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new I(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ge,this.combine=xr,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var Wf=new F,Or=new _t,Za=new oe,qf=new y,Ja=new y,ja=new y,Ka=new y,Jh=new y,$a=new y,Xf=new y,Qa=new y,ae=class extends G{constructor(e=new P,t=new Se){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let n=0,s=r.length;n<s;n++){let o=r[n].name||String(n);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=n}}}}getVertexPosition(e,t){let i=this.geometry,r=i.attributes.position,n=i.morphAttributes.position,s=i.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(n&&o){$a.set(0,0,0);for(let l=0,c=n.length;l<c;l++){let h=o[l],u=n[l];h!==0&&(Jh.fromBufferAttribute(u,e),s?$a.addScaledVector(Jh,h):$a.addScaledVector(Jh.sub(t),h))}t.add($a)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let i=this.geometry,r=this.material,n=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Za.copy(i.boundingSphere),Za.applyMatrix4(n),Or.copy(e.ray).recast(e.near),!(Za.containsPoint(Or.origin)===!1&&(Or.intersectSphere(Za,qf)===null||Or.origin.distanceToSquared(qf)>(e.far-e.near)**2))&&(Wf.copy(n).invert(),Or.copy(e.ray).applyMatrix4(Wf),!(i.boundingBox!==null&&Or.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,Or)))}_computeIntersections(e,t,i){let r,n=this.geometry,s=this.material,o=n.index,l=n.attributes.position,c=n.attributes.uv,h=n.attributes.uv1,u=n.attributes.normal,f=n.groups,d=n.drawRange;if(o!==null)if(Array.isArray(s))for(let p=0,m=f.length;p<m;p++){let g=f[p],_=s[g.materialIndex],x=Math.max(g.start,d.start),v=Math.min(o.count,Math.min(g.start+g.count,d.start+d.count));for(let b=x,M=v;b<M;b+=3){let S=o.getX(b),A=o.getX(b+1),w=o.getX(b+2);r=el(this,_,e,i,c,h,u,S,A,w),r&&(r.faceIndex=Math.floor(b/3),r.face.materialIndex=g.materialIndex,t.push(r))}}else{let p=Math.max(0,d.start),m=Math.min(o.count,d.start+d.count);for(let g=p,_=m;g<_;g+=3){let x=o.getX(g),v=o.getX(g+1),b=o.getX(g+2);r=el(this,s,e,i,c,h,u,x,v,b),r&&(r.faceIndex=Math.floor(g/3),t.push(r))}}else if(l!==void 0)if(Array.isArray(s))for(let p=0,m=f.length;p<m;p++){let g=f[p],_=s[g.materialIndex],x=Math.max(g.start,d.start),v=Math.min(l.count,Math.min(g.start+g.count,d.start+d.count));for(let b=x,M=v;b<M;b+=3){let S=b,A=b+1,w=b+2;r=el(this,_,e,i,c,h,u,S,A,w),r&&(r.faceIndex=Math.floor(b/3),r.face.materialIndex=g.materialIndex,t.push(r))}}else{let p=Math.max(0,d.start),m=Math.min(l.count,d.start+d.count);for(let g=p,_=m;g<_;g+=3){let x=g,v=g+1,b=g+2;r=el(this,s,e,i,c,h,u,x,v,b),r&&(r.faceIndex=Math.floor(g/3),t.push(r))}}}};function z0(a,e,t,i,r,n,s,o){let l;if(e.side===wi?l=i.intersectTriangle(s,n,r,!0,o):l=i.intersectTriangle(r,n,s,e.side===Mi,o),l===null)return null;Qa.copy(o),Qa.applyMatrix4(a.matrixWorld);let c=t.ray.origin.distanceTo(Qa);return c<t.near||c>t.far?null:{distance:c,point:Qa.clone(),object:a}}function el(a,e,t,i,r,n,s,o,l,c){a.getVertexPosition(o,Ja),a.getVertexPosition(l,ja),a.getVertexPosition(c,Ka);let h=z0(a,e,t,i,Ja,ja,Ka,Xf);if(h){let u=new y;gt.getBarycoord(Xf,Ja,ja,Ka,u),r&&(h.uv=gt.getInterpolatedAttribute(r,o,l,c,u,new T)),n&&(h.uv1=gt.getInterpolatedAttribute(n,o,l,c,u,new T)),s&&(h.normal=gt.getInterpolatedAttribute(s,o,l,c,u,new y),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));let f={a:o,b:l,c,normal:new y,materialIndex:0};gt.getNormal(Ja,ja,Ka,f.normal),h.face=f,h.barycoord=u}return h}var Wo=new Ne,Yf=new Ne,Zf=new Ne,k0=new Ne,Jf=new F,tl=new y,jh=new oe,jf=new F,Kh=new _t,$i=class extends ae{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=Ma,this.bindMatrix=new F,this.bindMatrixInverse=new F,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){let e=this.geometry;this.boundingBox===null&&(this.boundingBox=new he),this.boundingBox.makeEmpty();let t=e.getAttribute("position");for(let i=0;i<t.count;i++)this.getVertexPosition(i,tl),this.boundingBox.expandByPoint(tl)}computeBoundingSphere(){let e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new oe),this.boundingSphere.makeEmpty();let t=e.getAttribute("position");for(let i=0;i<t.count;i++)this.getVertexPosition(i,tl),this.boundingSphere.expandByPoint(tl)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}raycast(e,t){let i=this.material,r=this.matrixWorld;i!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),jh.copy(this.boundingSphere),jh.applyMatrix4(r),e.ray.intersectsSphere(jh)!==!1&&(jf.copy(r).invert(),Kh.copy(e.ray).applyMatrix4(jf),!(this.boundingBox!==null&&Kh.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(e,t,Kh)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){let e=new Ne,t=this.geometry.attributes.skinWeight;for(let i=0,r=t.count;i<r;i++){e.fromBufferAttribute(t,i);let n=1/e.manhattanLength();n!==1/0?e.multiplyScalar(n):e.set(1,0,0,0),t.setXYZW(i,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===Ma?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===hh?this.bindMatrixInverse.copy(this.bindMatrix).invert():B("SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){let i=this.skeleton,r=this.geometry;Yf.fromBufferAttribute(r.attributes.skinIndex,e),Zf.fromBufferAttribute(r.attributes.skinWeight,e),t.isVector4?(Wo.copy(t),t.set(0,0,0,0)):(Wo.set(...t,1),t.set(0,0,0)),Wo.applyMatrix4(this.bindMatrix);for(let n=0;n<4;n++){let s=Zf.getComponent(n);if(s!==0){let o=Yf.getComponent(n);Jf.multiplyMatrices(i.bones[o].matrixWorld,i.boneInverses[o]),t.addScaledVector(k0.copy(Wo).applyMatrix4(Jf),s)}}return t.isVector4&&(t.w=Wo.w),t.applyMatrix4(this.bindMatrixInverse)}};var ci=class extends G{constructor(){super(),this.isBone=!0,this.type="Bone"}};var ze=class extends te{constructor(e=null,t=1,i=1,r,n,s,o,l,c=fe,h=fe,u,f){super(null,s,o,l,c,h,r,n,u,f),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Kf=new F,V0=new F,Qi=class a{constructor(e=[],t=[]){this.uuid=Te(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){let e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){B("Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let i=0,r=this.bones.length;i<r;i++)this.boneInverses.push(new F)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){let i=new F;this.bones[e]&&i.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(i)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){let i=this.bones[e];i&&i.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){let i=this.bones[e];i&&(i.parent&&i.parent.isBone?(i.matrix.copy(i.parent.matrixWorld).invert(),i.matrix.multiply(i.matrixWorld)):i.matrix.copy(i.matrixWorld),i.matrix.decompose(i.position,i.quaternion,i.scale))}}update(){let e=this.bones,t=this.boneInverses,i=this.boneMatrices,r=this.boneTexture;for(let n=0,s=e.length;n<s;n++){let o=e[n]?e[n].matrixWorld:V0;Kf.multiplyMatrices(o,t[n]),Kf.toArray(i,n*16)}r!==null&&(r.needsUpdate=!0)}clone(){return new a(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);let t=new Float32Array(e*e*4);t.set(this.boneMatrices);let i=new ze(t,e,e,je,mt);return i.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=i,this}getBoneByName(e){for(let t=0,i=this.bones.length;t<i;t++){let r=this.bones[t];if(r.name===e)return r}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let i=0,r=e.bones.length;i<r;i++){let n=e.bones[i],s=t[n];s===void 0&&(B("Skeleton: No bone found with UUID:",n),s=new ci),this.bones.push(s),this.boneInverses.push(new F().fromArray(e.boneInverses[i]))}return this.init(),this}toJSON(){let e={metadata:{version:4.7,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;let t=this.bones,i=this.boneInverses;for(let r=0,n=t.length;r<n;r++){let s=t[r];e.bones.push(s.uuid);let o=i[r];e.boneInverses.push(o.toArray())}return e}};var tt=class extends j{constructor(e,t,i,r=1){super(e,t,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}};var ms=new F,$f=new F,il=[],Qf=new he,G0=new F,qo=new ae,Xo=new oe,er=class extends ae{constructor(e,t,i){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new tt(new Float32Array(i*16),16),this.instanceColor=null,this.morphTexture=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let r=0;r<i;r++)this.setMatrixAt(r,G0)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new he),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,ms),Qf.copy(e.boundingBox).applyMatrix4(ms),this.boundingBox.union(Qf)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new oe),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,ms),Xo.copy(e.boundingSphere).applyMatrix4(ms),this.boundingSphere.union(Xo)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let i=t.morphTargetInfluences,r=this.morphTexture.source.data.data,n=i.length+1,s=e*n+1;for(let o=0;o<i.length;o++)i[o]=r[s+o]}raycast(e,t){let i=this.matrixWorld,r=this.count;if(qo.geometry=this.geometry,qo.material=this.material,qo.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Xo.copy(this.boundingSphere),Xo.applyMatrix4(i),e.ray.intersectsSphere(Xo)!==!1))for(let n=0;n<r;n++){this.getMatrixAt(n,ms),$f.multiplyMatrices(i,ms),qo.matrixWorld=$f,qo.raycast(e,il);for(let s=0,o=il.length;s<o;s++){let l=il[s];l.instanceId=n,l.object=this,t.push(l)}il.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new tt(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let i=t.morphTargetInfluences,r=i.length+1;this.morphTexture===null&&(this.morphTexture=new ze(new Float32Array(r*this.count),r,this.count,Sr,mt));let n=this.morphTexture.source.data.data,s=0;for(let c=0;c<i.length;c++)s+=i[c];let o=this.geometry.morphTargetsRelative?1:1-s,l=r*e;return n[l]=o,n.set(i,l+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}};var Fr=new oe,H0=new T(.5,.5),rl=new y,Lt=class{constructor(e=new Pt,t=new Pt,i=new Pt,r=new Pt,n=new Pt,s=new Pt){this.planes=[e,t,i,r,n,s]}set(e,t,i,r,n,s){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(i),o[3].copy(r),o[4].copy(n),o[5].copy(s),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=Xe,i=!1){let r=this.planes,n=e.elements,s=n[0],o=n[1],l=n[2],c=n[3],h=n[4],u=n[5],f=n[6],d=n[7],p=n[8],m=n[9],g=n[10],_=n[11],x=n[12],v=n[13],b=n[14],M=n[15];if(r[0].setComponents(c-s,d-h,_-p,M-x).normalize(),r[1].setComponents(c+s,d+h,_+p,M+x).normalize(),r[2].setComponents(c+o,d+u,_+m,M+v).normalize(),r[3].setComponents(c-o,d-u,_-m,M-v).normalize(),i)r[4].setComponents(l,f,g,b).normalize(),r[5].setComponents(c-l,d-f,_-g,M-b).normalize();else if(r[4].setComponents(c-l,d-f,_-g,M-b).normalize(),t===Xe)r[5].setComponents(c+l,d+f,_+g,M+b).normalize();else if(t===Ft)r[5].setComponents(l,f,g,b).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Fr.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Fr.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Fr)}intersectsSprite(e){Fr.center.set(0,0,0);let t=H0.distanceTo(e.center);return Fr.radius=.7071067811865476+t,Fr.applyMatrix4(e.matrixWorld),this.intersectsSphere(Fr)}intersectsSphere(e){let t=this.planes,i=e.center,r=-e.radius;for(let n=0;n<6;n++)if(t[n].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let r=t[i];if(rl.x=r.normal.x>0?e.max.x:e.min.x,rl.y=r.normal.y>0?e.max.y:e.min.y,rl.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(rl)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var ed=new F,gs=class a{constructor(){this.coordinateSystem=Xe,this._frustums=[],this._count=0}setFromArrayCamera(e){let t=e.cameras,i=this._frustums;for(let r=0;r<t.length;r++){let n=t[r];ed.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),i[r]===void 0&&(i[r]=new Lt),i[r].setFromProjectionMatrix(ed,n.coordinateSystem,n.reversedDepth)}return this._count=t.length,this}intersectsObject(e){let t=this._frustums;for(let i=0;i<this._count;i++)if(t[i].intersectsObject(e))return!0;return!1}intersectsSprite(e){let t=this._frustums;for(let i=0;i<this._count;i++)if(t[i].intersectsSprite(e))return!0;return!1}intersectsSphere(e){let t=this._frustums;for(let i=0;i<this._count;i++)if(t[i].intersectsSphere(e))return!0;return!1}intersectsBox(e){let t=this._frustums;for(let i=0;i<this._count;i++)if(t[i].intersectsBox(e))return!0;return!1}containsPoint(e){let t=this._frustums;for(let i=0;i<this._count;i++)if(t[i].containsPoint(e))return!0;return!1}copy(e){this.coordinateSystem=e.coordinateSystem;let t=this._frustums,i=e._frustums;for(let r=0;r<e._count;r++)t[r]===void 0&&(t[r]=new Lt),t[r].copy(i[r]);return this._count=e._count,this}clone(){return new a().copy(this)}};function $h(a,e){return a-e}function W0(a,e){return a.z-e.z}function q0(a,e){return e.z-a.z}var eu=class{constructor(){this.index=0,this.pool=[],this.list=[]}push(e,t,i,r){let n=this.pool,s=this.list;this.index>=n.length&&n.push({start:-1,count:-1,z:-1,index:-1});let o=n[this.index];s.push(o),this.index++,o.start=e,o.count=t,o.z=i,o.index=r}reset(){this.list.length=0,this.index=0}},xt=new F,X0=new I(1,1,1),Y0=new Lt,Z0=new gs,nl=new he,Ur=new oe,Yo=new y,td=new y,J0=new y,Qh=new eu,it=new ae,sl=[];function j0(a,e,t=0){let i=e.itemSize;if(a.isInterleavedBufferAttribute||a.array.constructor!==e.array.constructor){let r=a.count;for(let n=0;n<r;n++)for(let s=0;s<i;s++)e.setComponent(n+t,s,a.getComponent(n,s))}else e.array.set(a.array,t*i);e.needsUpdate=!0}function zr(a,e){if(a.constructor!==e.constructor){let t=Math.min(a.length,e.length);for(let i=0;i<t;i++)e[i]=a[i]}else{let t=Math.min(a.length,e.length);e.set(new a.constructor(a.buffer,0,t))}}var _s=class extends ae{constructor(e,t,i=t*2,r){super(new P,r),this.isBatchedMesh=!0,this.perObjectFrustumCulled=!0,this.sortObjects=!0,this.boundingBox=null,this.boundingSphere=null,this.customSort=null,this._instanceInfo=[],this._geometryInfo=[],this._availableInstanceIds=[],this._availableGeometryIds=[],this._nextIndexStart=0,this._nextVertexStart=0,this._geometryCount=0,this._visibilityChanged=!0,this._geometryInitialized=!1,this._maxInstanceCount=e,this._maxVertexCount=t,this._maxIndexCount=i,this._multiDrawCounts=new Int32Array(e),this._multiDrawStarts=new Int32Array(e),this._multiDrawCount=0,this._multiDrawBytesPerElement=1,this._matricesTexture=null,this._indirectTexture=null,this._colorsTexture=null,this._initMatricesTexture(),this._initIndirectTexture()}get maxInstanceCount(){return this._maxInstanceCount}get instanceCount(){return this._instanceInfo.length-this._availableInstanceIds.length}get unusedVertexCount(){return this._maxVertexCount-this._nextVertexStart}get unusedIndexCount(){return this._maxIndexCount-this._nextIndexStart}_initMatricesTexture(){let e=Math.sqrt(this._maxInstanceCount*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);let t=new Float32Array(e*e*4),i=new ze(t,e,e,je,mt);this._matricesTexture=i}_initIndirectTexture(){let e=Math.sqrt(this._maxInstanceCount);e=Math.ceil(e);let t=new Uint32Array(e*e),i=new ze(t,e,e,Mr,Jt);this._indirectTexture=i}_initColorsTexture(){let e=Math.sqrt(this._maxInstanceCount);e=Math.ceil(e);let t=new Float32Array(e*e*4).fill(1),i=new ze(t,e,e,je,mt);i.colorSpace=Le.workingColorSpace,this._colorsTexture=i}_initializeGeometry(e){let t=this.geometry,i=this._maxVertexCount,r=this._maxIndexCount;if(this._geometryInitialized===!1){for(let n in e.attributes){let s=e.getAttribute(n),{array:o,itemSize:l,normalized:c}=s,h=new o.constructor(i*l),u=new j(h,l,c);t.setAttribute(n,u)}if(e.getIndex()!==null){let n=i>65535?new Uint32Array(r):new Uint16Array(r);t.setIndex(new j(n,1))}this._geometryInitialized=!0}}_validateGeometry(e){let t=this.geometry;if(!!e.getIndex()!=!!t.getIndex())throw new Error('THREE.BatchedMesh: All geometries must consistently have "index".');for(let i in t.attributes){if(!e.hasAttribute(i))throw new Error(`THREE.BatchedMesh: Added geometry missing "${i}". All geometries must have consistent attributes.`);let r=e.getAttribute(i),n=t.getAttribute(i);if(r.itemSize!==n.itemSize||r.normalized!==n.normalized)throw new Error("THREE.BatchedMesh: All attributes must have a consistent itemSize and normalized value.")}}validateInstanceId(e){let t=this._instanceInfo;if(e<0||e>=t.length||t[e].active===!1)throw new Error(`THREE.BatchedMesh: Invalid instanceId ${e}. Instance is either out of range or has been deleted.`)}validateGeometryId(e){let t=this._geometryInfo;if(e<0||e>=t.length||t[e].active===!1)throw new Error(`THREE.BatchedMesh: Invalid geometryId ${e}. Geometry is either out of range or has been deleted.`)}setCustomSort(e){return this.customSort=e,this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new he);let e=this.boundingBox,t=this._instanceInfo;e.makeEmpty();for(let i=0,r=t.length;i<r;i++){if(t[i].active===!1)continue;let n=t[i].geometryIndex;this.getMatrixAt(i,xt),this.getBoundingBoxAt(n,nl).applyMatrix4(xt),e.union(nl)}}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new oe);let e=this.boundingSphere,t=this._instanceInfo;e.makeEmpty();for(let i=0,r=t.length;i<r;i++){if(t[i].active===!1)continue;let n=t[i].geometryIndex;this.getMatrixAt(i,xt),this.getBoundingSphereAt(n,Ur).applyMatrix4(xt),e.union(Ur)}}addInstance(e){if(this._instanceInfo.length>=this.maxInstanceCount&&this._availableInstanceIds.length===0)throw new Error("THREE.BatchedMesh: Maximum item count reached.");let i={visible:!0,active:!0,geometryIndex:e},r=null;this._availableInstanceIds.length>0?(this._availableInstanceIds.sort($h),r=this._availableInstanceIds.shift(),this._instanceInfo[r]=i):(r=this._instanceInfo.length,this._instanceInfo.push(i));let n=this._matricesTexture;xt.identity().toArray(n.image.data,r*16),n.needsUpdate=!0;let s=this._colorsTexture;return s&&(X0.toArray(s.image.data,r*4),s.needsUpdate=!0),this._visibilityChanged=!0,r}addGeometry(e,t=-1,i=-1){this._initializeGeometry(e),this._validateGeometry(e);let r={vertexStart:-1,vertexCount:-1,reservedVertexCount:-1,indexStart:-1,indexCount:-1,reservedIndexCount:-1,start:-1,count:-1,boundingBox:null,boundingSphere:null,active:!0},n=this._geometryInfo;r.vertexStart=this._nextVertexStart,r.reservedVertexCount=t===-1?e.getAttribute("position").count:t;let s=e.getIndex();if(s!==null&&(r.indexStart=this._nextIndexStart,r.reservedIndexCount=i===-1?s.count:i),r.indexStart!==-1&&r.indexStart+r.reservedIndexCount>this._maxIndexCount||r.vertexStart+r.reservedVertexCount>this._maxVertexCount)throw new Error("THREE.BatchedMesh: Reserved space request exceeds the maximum buffer size.");let l;return this._availableGeometryIds.length>0?(this._availableGeometryIds.sort($h),l=this._availableGeometryIds.shift(),n[l]=r):(l=this._geometryCount,this._geometryCount++,n.push(r)),this.setGeometryAt(l,e),this._nextIndexStart=r.indexStart+r.reservedIndexCount,this._nextVertexStart=r.vertexStart+r.reservedVertexCount,l}setGeometryAt(e,t){if(e>=this._geometryCount)throw new Error("THREE.BatchedMesh: Maximum geometry count reached.");this._validateGeometry(t);let i=this.geometry,r=i.getIndex()!==null,n=i.getIndex(),s=t.getIndex(),o=this._geometryInfo[e];if(r&&s.count>o.reservedIndexCount||t.attributes.position.count>o.reservedVertexCount)throw new Error("THREE.BatchedMesh: Reserved space not large enough for provided geometry.");let l=o.vertexStart,c=o.reservedVertexCount;o.vertexCount=t.getAttribute("position").count;for(let h in i.attributes){let u=t.getAttribute(h),f=i.getAttribute(h);j0(u,f,l);let d=u.itemSize;for(let p=u.count,m=c;p<m;p++){let g=l+p;for(let _=0;_<d;_++)f.setComponent(g,_,0)}f.needsUpdate=!0,f.addUpdateRange(l*d,c*d)}if(r){let h=o.indexStart,u=o.reservedIndexCount;o.indexCount=t.getIndex().count;for(let f=0;f<s.count;f++)n.setX(h+f,l+s.getX(f));for(let f=s.count,d=u;f<d;f++)n.setX(h+f,l);n.needsUpdate=!0,n.addUpdateRange(h,o.reservedIndexCount)}return o.start=r?o.indexStart:o.vertexStart,o.count=r?o.indexCount:o.vertexCount,o.boundingBox=null,t.boundingBox!==null&&(o.boundingBox=t.boundingBox.clone()),o.boundingSphere=null,t.boundingSphere!==null&&(o.boundingSphere=t.boundingSphere.clone()),this._visibilityChanged=!0,e}deleteGeometry(e){let t=this._geometryInfo;if(e>=t.length||t[e].active===!1)return this;let i=this._instanceInfo;for(let r=0,n=i.length;r<n;r++)i[r].active&&i[r].geometryIndex===e&&this.deleteInstance(r);return t[e].active=!1,this._availableGeometryIds.push(e),this._visibilityChanged=!0,this}deleteInstance(e){return this.validateInstanceId(e),this._instanceInfo[e].active=!1,this._availableInstanceIds.push(e),this._visibilityChanged=!0,this}optimize(){let e=0,t=0,i=this._geometryInfo,r=i.map((s,o)=>o).sort((s,o)=>i[s].vertexStart-i[o].vertexStart),n=this.geometry;for(let s=0,o=i.length;s<o;s++){let l=r[s],c=i[l];if(c.active!==!1){if(n.index!==null){if(c.indexStart!==t){let{indexStart:h,vertexStart:u,reservedIndexCount:f}=c,d=n.index,p=d.array,m=e-u;for(let g=h;g<h+f;g++)p[g]=p[g]+m;d.array.copyWithin(t,h,h+f),d.addUpdateRange(t,f),d.needsUpdate=!0,c.indexStart=t}t+=c.reservedIndexCount}if(c.vertexStart!==e){let{vertexStart:h,reservedVertexCount:u}=c,f=n.attributes;for(let d in f){let p=f[d],{array:m,itemSize:g}=p;m.copyWithin(e*g,h*g,(h+u)*g),p.addUpdateRange(e*g,u*g),p.needsUpdate=!0}c.vertexStart=e}e+=c.reservedVertexCount,c.start=n.index?c.indexStart:c.vertexStart}}return this._nextIndexStart=t,this._nextVertexStart=e,this._visibilityChanged=!0,this}getBoundingBoxAt(e,t){if(e>=this._geometryCount)return null;let i=this.geometry,r=this._geometryInfo[e];if(r.boundingBox===null){let n=new he,s=i.index,o=i.attributes.position;for(let l=r.start,c=r.start+r.count;l<c;l++){let h=l;s&&(h=s.getX(h)),n.expandByPoint(Yo.fromBufferAttribute(o,h))}r.boundingBox=n}return t.copy(r.boundingBox),t}getBoundingSphereAt(e,t){if(e>=this._geometryCount)return null;let i=this.geometry,r=this._geometryInfo[e];if(r.boundingSphere===null){let n=new oe;this.getBoundingBoxAt(e,nl),nl.getCenter(n.center);let s=i.index,o=i.attributes.position,l=0;for(let c=r.start,h=r.start+r.count;c<h;c++){let u=c;s&&(u=s.getX(u)),Yo.fromBufferAttribute(o,u),l=Math.max(l,n.center.distanceToSquared(Yo))}n.radius=Math.sqrt(l),r.boundingSphere=n}return t.copy(r.boundingSphere),t}setMatrixAt(e,t){this.validateInstanceId(e);let i=this._matricesTexture,r=this._matricesTexture.image.data;return t.toArray(r,e*16),i.needsUpdate=!0,this}getMatrixAt(e,t){return this.validateInstanceId(e),t.fromArray(this._matricesTexture.image.data,e*16)}setColorAt(e,t){return this.validateInstanceId(e),this._colorsTexture===null&&this._initColorsTexture(),t.toArray(this._colorsTexture.image.data,e*4),this._colorsTexture.needsUpdate=!0,this}getColorAt(e,t){return this.validateInstanceId(e),this._colorsTexture===null?t.isVector4?t.set(1,1,1,1):t.setRGB(1,1,1):t.fromArray(this._colorsTexture.image.data,e*4)}setVisibleAt(e,t){return this.validateInstanceId(e),this._instanceInfo[e].visible===t?this:(this._instanceInfo[e].visible=t,this._visibilityChanged=!0,this)}getVisibleAt(e){return this.validateInstanceId(e),this._instanceInfo[e].visible}setGeometryIdAt(e,t){return this.validateInstanceId(e),this.validateGeometryId(t),this._instanceInfo[e].geometryIndex=t,this._visibilityChanged=!0,this}getGeometryIdAt(e){return this.validateInstanceId(e),this._instanceInfo[e].geometryIndex}getGeometryRangeAt(e,t={}){this.validateGeometryId(e);let i=this._geometryInfo[e];return t.vertexStart=i.vertexStart,t.vertexCount=i.vertexCount,t.reservedVertexCount=i.reservedVertexCount,t.indexStart=i.indexStart,t.indexCount=i.indexCount,t.reservedIndexCount=i.reservedIndexCount,t.start=i.start,t.count=i.count,t}setInstanceCount(e){let t=this._availableInstanceIds,i=this._instanceInfo;for(t.sort($h);t[t.length-1]===i.length-1;)i.pop(),t.pop();if(e<i.length)throw new Error(`THREE.BatchedMesh: Instance ids outside the range ${e} are being used. Cannot shrink instance count.`);let r=new Int32Array(e),n=new Int32Array(e);zr(this._multiDrawCounts,r),zr(this._multiDrawStarts,n),this._multiDrawCounts=r,this._multiDrawStarts=n,this._maxInstanceCount=e;let s=this._indirectTexture,o=this._matricesTexture,l=this._colorsTexture;s.dispose(),this._initIndirectTexture(),zr(s.image.data,this._indirectTexture.image.data),o.dispose(),this._initMatricesTexture(),zr(o.image.data,this._matricesTexture.image.data),l&&(l.dispose(),this._initColorsTexture(),zr(l.image.data,this._colorsTexture.image.data))}setGeometrySize(e,t){let i=[...this._geometryInfo].filter(o=>o.active);if(Math.max(...i.map(o=>o.vertexStart+o.reservedVertexCount))>e)throw new Error(`THREE.BatchedMesh: Geometry vertex values are being used outside the range ${t}. Cannot shrink further.`);if(this.geometry.index&&Math.max(...i.map(l=>l.indexStart+l.reservedIndexCount))>t)throw new Error(`THREE.BatchedMesh: Geometry index values are being used outside the range ${t}. Cannot shrink further.`);let n=this.geometry;n.dispose(),this._maxVertexCount=e,this._maxIndexCount=t,this._geometryInitialized&&(this._geometryInitialized=!1,this.geometry=new P,this._initializeGeometry(n));let s=this.geometry;n.index&&zr(n.index.array,s.index.array);for(let o in n.attributes)zr(n.attributes[o].array,s.attributes[o].array)}raycast(e,t){let i=this._instanceInfo,r=this._geometryInfo,n=this.matrixWorld,s=this.geometry;it.material=this.material,it.geometry.index=s.index,it.geometry.attributes=s.attributes,it.geometry.boundingBox===null&&(it.geometry.boundingBox=new he),it.geometry.boundingSphere===null&&(it.geometry.boundingSphere=new oe);for(let o=0,l=i.length;o<l;o++){if(!i[o].visible||!i[o].active)continue;let c=i[o].geometryIndex,h=r[c];it.geometry.setDrawRange(h.start,h.count),this.getMatrixAt(o,it.matrixWorld).premultiply(n),this.getBoundingBoxAt(c,it.geometry.boundingBox),this.getBoundingSphereAt(c,it.geometry.boundingSphere),it.raycast(e,sl);for(let u=0,f=sl.length;u<f;u++){let d=sl[u];d.object=this,d.batchId=o,t.push(d)}sl.length=0}it.material=null,it.geometry.index=null,it.geometry.attributes={},it.geometry.setDrawRange(0,1/0)}copy(e){return super.copy(e),this.geometry=e.geometry.clone(),this.perObjectFrustumCulled=e.perObjectFrustumCulled,this.sortObjects=e.sortObjects,this.boundingBox=e.boundingBox!==null?e.boundingBox.clone():null,this.boundingSphere=e.boundingSphere!==null?e.boundingSphere.clone():null,this._geometryInfo=e._geometryInfo.map(t=>({...t,boundingBox:t.boundingBox!==null?t.boundingBox.clone():null,boundingSphere:t.boundingSphere!==null?t.boundingSphere.clone():null})),this._instanceInfo=e._instanceInfo.map(t=>({...t})),this._availableInstanceIds=e._availableInstanceIds.slice(),this._availableGeometryIds=e._availableGeometryIds.slice(),this._nextIndexStart=e._nextIndexStart,this._nextVertexStart=e._nextVertexStart,this._geometryCount=e._geometryCount,this._maxInstanceCount=e._maxInstanceCount,this._maxVertexCount=e._maxVertexCount,this._maxIndexCount=e._maxIndexCount,this._geometryInitialized=e._geometryInitialized,this._multiDrawCounts=e._multiDrawCounts.slice(),this._multiDrawStarts=e._multiDrawStarts.slice(),this._multiDrawBytesPerElement=e._multiDrawBytesPerElement,this._indirectTexture=e._indirectTexture.clone(),this._indirectTexture.image.data=this._indirectTexture.image.data.slice(),this._matricesTexture=e._matricesTexture.clone(),this._matricesTexture.image.data=this._matricesTexture.image.data.slice(),this._colorsTexture!==null&&(this._colorsTexture=e._colorsTexture.clone(),this._colorsTexture.image.data=this._colorsTexture.image.data.slice()),this}dispose(){super.dispose(),this.geometry.dispose(),this._matricesTexture.dispose(),this._matricesTexture=null,this._indirectTexture.dispose(),this._indirectTexture=null,this._colorsTexture!==null&&(this._colorsTexture.dispose(),this._colorsTexture=null)}onBeforeRender(e,t,i,r,n){if(!this._visibilityChanged&&!this.perObjectFrustumCulled&&!this.sortObjects)return;let s=r.getIndex(),o=s===null?1:s.array.BYTES_PER_ELEMENT,l=1;n.wireframe&&(l=2,o=r.attributes.position.count>65535?4:2);let c=this._instanceInfo,h=this._multiDrawStarts,u=this._multiDrawCounts,f=this._geometryInfo,d=this.perObjectFrustumCulled,p=this._indirectTexture,m=p.image.data,g=i.isArrayCamera?Z0:Y0;d&&(i.isArrayCamera?g.setFromArrayCamera(i):(xt.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse).multiply(this.matrixWorld),g.setFromProjectionMatrix(xt,i.coordinateSystem,i.reversedDepth)));let _=0;if(this.sortObjects){xt.copy(this.matrixWorld).invert(),Yo.setFromMatrixPosition(i.matrixWorld).applyMatrix4(xt),td.set(0,0,-1).transformDirection(i.matrixWorld).transformDirection(xt);for(let b=0,M=c.length;b<M;b++)if(c[b].visible&&c[b].active){let S=c[b].geometryIndex;this.getMatrixAt(b,xt),this.getBoundingSphereAt(S,Ur).applyMatrix4(xt);let A=!1;if(d&&(A=!g.intersectsSphere(Ur)),!A){let w=f[S],E=J0.subVectors(Ur.center,Yo).dot(td);Qh.push(w.start,w.count,E,b)}}let x=Qh.list,v=this.customSort;v===null?x.sort(n.transparent?q0:W0):v.call(this,x,i);for(let b=0,M=x.length;b<M;b++){let S=x[b];h[_]=S.start*o*l,u[_]=S.count*l,m[_]=S.index,_++}Qh.reset()}else for(let x=0,v=c.length;x<v;x++)if(c[x].visible&&c[x].active){let b=c[x].geometryIndex,M=!1;if(d&&(this.getMatrixAt(x,xt),this.getBoundingSphereAt(b,Ur).applyMatrix4(xt),M=!g.intersectsSphere(Ur)),!M){let S=f[b];h[_]=S.start*o*l,u[_]=S.count*l,m[_]=x,_++}}p.needsUpdate=!0,this._multiDrawCount=_,this._multiDrawBytesPerElement=o,this._visibilityChanged=!1}onBeforeShadow(e,t,i,r,n,s){this.onBeforeRender(e,null,r,n,s)}};var re=class extends ${constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new I(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}};var ll=new y,cl=new y,id=new F,Zo=new _t,ol=new oe,tu=new y,rd=new y,ke=class extends G{constructor(e=new P,t=new re){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[0];for(let r=1,n=t.count;r<n;r++)ll.fromBufferAttribute(t,r-1),cl.fromBufferAttribute(t,r),i[r]=i[r-1],i[r]+=ll.distanceTo(cl);e.setAttribute("lineDistance",new R(i,1))}else B("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let i=this.geometry,r=this.matrixWorld,n=e.params.Line.threshold,s=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),ol.copy(i.boundingSphere),ol.applyMatrix4(r),ol.radius+=n,e.ray.intersectsSphere(ol)===!1)return;id.copy(r).invert(),Zo.copy(e.ray).applyMatrix4(id);let o=n/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,h=i.index,f=i.attributes.position;if(h!==null){let d=Math.max(0,s.start),p=Math.min(h.count,s.start+s.count);for(let m=d,g=p-1;m<g;m+=c){let _=h.getX(m),x=h.getX(m+1),v=al(this,e,Zo,l,_,x,m);v&&t.push(v)}if(this.isLineLoop){let m=h.getX(p-1),g=h.getX(d),_=al(this,e,Zo,l,m,g,p-1);_&&t.push(_)}}else{let d=Math.max(0,s.start),p=Math.min(f.count,s.start+s.count);for(let m=d,g=p-1;m<g;m+=c){let _=al(this,e,Zo,l,m,m+1,m);_&&t.push(_)}if(this.isLineLoop){let m=al(this,e,Zo,l,p-1,d,p-1);m&&t.push(m)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let n=0,s=r.length;n<s;n++){let o=r[n].name||String(n);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=n}}}}};function al(a,e,t,i,r,n,s){let o=a.geometry.attributes.position;if(ll.fromBufferAttribute(o,r),cl.fromBufferAttribute(o,n),t.distanceSqToSegment(ll,cl,tu,rd)>i)return;tu.applyMatrix4(a.matrixWorld);let c=e.ray.origin.distanceTo(tu);if(!(c<e.near||c>e.far))return{distance:c,point:rd.clone().applyMatrix4(a.matrixWorld),index:s,face:null,faceIndex:null,barycoord:null,object:a}}var nd=new y,sd=new y,Me=class extends ke{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[];for(let r=0,n=t.count;r<n;r+=2)nd.fromBufferAttribute(t,r),sd.fromBufferAttribute(t,r+1),i[r]=r===0?0:i[r-1],i[r+1]=i[r]+nd.distanceTo(sd);e.setAttribute("lineDistance",new R(i,1))}else B("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}};var tr=class extends ke{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}};var hi=class extends ${constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new I(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}};var od=new F,iu=new _t,hl=new oe,ul=new y,ir=class extends G{constructor(e=new P,t=new hi){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let i=this.geometry,r=this.matrixWorld,n=e.params.Points.threshold,s=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),hl.copy(i.boundingSphere),hl.applyMatrix4(r),hl.radius+=n,e.ray.intersectsSphere(hl)===!1)return;od.copy(r).invert(),iu.copy(e.ray).applyMatrix4(od);let o=n/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=i.index,u=i.attributes.position;if(c!==null){let f=Math.max(0,s.start),d=Math.min(c.count,s.start+s.count);for(let p=f,m=d;p<m;p++){let g=c.getX(p);ul.fromBufferAttribute(u,g),ad(ul,g,l,r,e,t,this)}}else{let f=Math.max(0,s.start),d=Math.min(u.count,s.start+s.count);for(let p=f,m=d;p<m;p++)ul.fromBufferAttribute(u,p),ad(ul,p,l,r,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let n=0,s=r.length;n<s;n++){let o=r[n].name||String(n);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=n}}}}};function ad(a,e,t,i,r,n,s){let o=iu.distanceSqToPoint(a);if(o<t){let l=new y;iu.closestPointToPoint(a,l),l.applyMatrix4(i);let c=r.ray.origin.distanceTo(l);if(c<r.near||c>r.far)return;n.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:s})}}var xs=class extends te{constructor(e,t,i,r,n=de,s=de,o,l,c){super(e,t,i,r,n,s,o,l,c),this.isVideoTexture=!0,this.generateMipmaps=!1,this._requestVideoFrameCallbackId=0;let h=this;function u(){h.needsUpdate=!0,h._requestVideoFrameCallbackId=e.requestVideoFrameCallback(u)}"requestVideoFrameCallback"in e&&(this._requestVideoFrameCallbackId=e.requestVideoFrameCallback(u))}clone(){return new this.constructor(this.image).copy(this)}update(){let e=this.image;"requestVideoFrameCallback"in e===!1&&e.readyState>=e.HAVE_CURRENT_DATA&&(this.needsUpdate=!0)}dispose(){this._requestVideoFrameCallbackId!==0&&(this.source.data.cancelVideoFrameCallback(this._requestVideoFrameCallbackId),this._requestVideoFrameCallbackId=0),super.dispose()}};var fl=class extends xs{constructor(e,t,i,r,n,s,o,l){super({},e,t,i,r,n,s,o,l),this.isVideoFrameTexture=!0}update(){}clone(){return new this.constructor().copy(this)}setFrame(e){this.image=e,this.needsUpdate=!0}};var dl=class extends te{constructor(e,t){super({width:e,height:t}),this.isFramebufferTexture=!0,this.magFilter=fe,this.minFilter=fe,this.generateMipmaps=!1,this.needsUpdate=!0}};var ui=class extends te{constructor(e,t,i,r,n,s,o,l,c,h,u,f){super(null,s,o,l,c,h,r,n,u,f),this.isCompressedTexture=!0,this.image={width:t,height:i},this.mipmaps=e,this.flipY=!1,this.generateMipmaps=!1}};var pl=class extends ui{constructor(e,t,i,r,n,s){super(e,t,i,n,s),this.isCompressedArrayTexture=!0,this.image.depth=r,this.wrapR=Ue,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var ml=class extends ui{constructor(e,t,i){super(void 0,e[0].width,e[0].height,t,i,Bt),this.isCompressedCubeTexture=!0,this.isCubeTexture=!0,this.image=e}};var fi=class extends te{constructor(e=[],t=Bt,i,r,n,s,o,l,c,h){super(e,t,i,r,n,s,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}};var gl=class extends te{constructor(e,t,i,r,n,s,o,l,c){super(e,t,i,r,n,s,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}};var _l=class extends te{constructor(e,t,i,r,n,s,o,l,c){super(e,t,i,r,n,s,o,l,c),this.isHTMLTexture=!0,this.generateMipmaps=!1,this.needsUpdate=!0;let h=e?e.parentNode:null;h!==null&&"requestPaint"in h&&(h.onpaint=()=>{this.needsUpdate=!0},h.requestPaint())}dispose(){let e=this.image?this.image.parentNode:null;e!==null&&"onpaint"in e&&(e.onpaint=null),super.dispose()}};var ys=class extends te{constructor(e,t,i=Jt,r,n,s,o=fe,l=fe,c,h=ki,u=1){if(h!==ki&&h!==To)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let f={width:e,height:t,depth:u};super(f,r,n,s,o,l,h,i,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Qe(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}};var xl=class extends ys{constructor(e,t=Jt,i=Bt,r,n,s=fe,o=fe,l,c=ki){let h={width:e,height:e,depth:1},u=[h,h,h,h,h,h];super(e,e,t,i,r,n,s,o,l,c),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}};var yl=class extends te{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}};var Vl={};sh(Vl,{BoxGeometry:()=>rr,CapsuleGeometry:()=>vl,CircleGeometry:()=>bl,ConeGeometry:()=>bs,CylinderGeometry:()=>vs,DodecahedronGeometry:()=>Sl,EdgesGeometry:()=>Tl,ExtrudeGeometry:()=>Rl,IcosahedronGeometry:()=>Pl,LatheGeometry:()=>Ll,OctahedronGeometry:()=>ws,PlaneGeometry:()=>Nl,PolyhedronGeometry:()=>kt,RingGeometry:()=>Dl,ShapeGeometry:()=>Bl,SphereGeometry:()=>As,TetrahedronGeometry:()=>Ol,TorusGeometry:()=>Fl,TorusKnotGeometry:()=>Ul,TubeGeometry:()=>zl,WireframeGeometry:()=>kl});var rr=class a extends P{constructor(e=1,t=1,i=1,r=1,n=1,s=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:n,depthSegments:s};let o=this;r=Math.floor(r),n=Math.floor(n),s=Math.floor(s);let l=[],c=[],h=[],u=[],f=0,d=0;p("z","y","x",-1,-1,i,t,e,s,n,0),p("z","y","x",1,-1,i,t,-e,s,n,1),p("x","z","y",1,1,e,i,t,r,s,2),p("x","z","y",1,-1,e,i,-t,r,s,3),p("x","y","z",1,-1,e,t,i,r,n,4),p("x","y","z",-1,-1,e,t,-i,r,n,5),this.setIndex(l),this.setAttribute("position",new R(c,3)),this.setAttribute("normal",new R(h,3)),this.setAttribute("uv",new R(u,2));function p(m,g,_,x,v,b,M,S,A,w,E){let C=b/A,N=M/w,V=b/2,X=M/2,ee=S/2,q=A+1,ue=w+1,_e=0,Ve=0,pe=new y;for(let xe=0;xe<ue;xe++){let ye=xe*N-X;for(let pt=0;pt<q;pt++){let at=pt*C-V;pe[m]=at*x,pe[g]=ye*v,pe[_]=ee,c.push(pe.x,pe.y,pe.z),pe[m]=0,pe[g]=0,pe[_]=S>0?1:-1,h.push(pe.x,pe.y,pe.z),u.push(pt/A),u.push(1-xe/w),_e+=1}}for(let xe=0;xe<w;xe++)for(let ye=0;ye<A;ye++){let pt=f+ye+q*xe,at=f+ye+q*(xe+1),bi=f+(ye+1)+q*(xe+1),Oi=f+(ye+1)+q*xe;l.push(pt,at,Oi),l.push(at,bi,Oi),Ve+=6}o.addGroup(d,Ve,E),d+=Ve,f+=_e}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new a(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};var vl=class a extends P{constructor(e=1,t=1,i=4,r=8,n=1){super(),this.type="CapsuleGeometry",this.parameters={radius:e,height:t,capSegments:i,radialSegments:r,heightSegments:n},t=Math.max(0,t),i=Math.max(1,Math.floor(i)),r=Math.max(3,Math.floor(r)),n=Math.max(1,Math.floor(n));let s=[],o=[],l=[],c=[],h=t/2,u=Math.PI/2*e,f=t,d=2*u+f,p=i*2+n,m=r+1,g=new y,_=new y;for(let x=0;x<=p;x++){let v=0,b=0,M=0,S=0;if(x<=i){let E=x/i,C=E*Math.PI/2;b=-h-e*Math.cos(C),M=e*Math.sin(C),S=-e*Math.cos(C),v=E*u}else if(x<=i+n){let E=(x-i)/n;b=-h+E*t,M=e,S=0,v=u+E*f}else{let E=(x-i-n)/i,C=E*Math.PI/2;b=h+e*Math.sin(C),M=e*Math.cos(C),S=e*Math.sin(C),v=u+f+E*u}let A=Math.max(0,Math.min(1,v/d)),w=0;x===0?w=.5/r:x===p&&(w=-.5/r);for(let E=0;E<=r;E++){let C=E/r,N=C*Math.PI*2,V=Math.sin(N),X=Math.cos(N);_.x=-M*X,_.y=b,_.z=M*V,o.push(_.x,_.y,_.z),g.set(-M*X,S,M*V),g.normalize(),l.push(g.x,g.y,g.z),c.push(C+w,A)}if(x>0){let E=(x-1)*m;for(let C=0;C<r;C++){let N=E+C,V=E+C+1,X=x*m+C,ee=x*m+C+1;s.push(N,V,X),s.push(V,ee,X)}}}this.setIndex(s),this.setAttribute("position",new R(o,3)),this.setAttribute("normal",new R(l,3)),this.setAttribute("uv",new R(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new a(e.radius,e.height,e.capSegments,e.radialSegments,e.heightSegments)}};var bl=class a extends P{constructor(e=1,t=32,i=0,r=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:i,thetaLength:r},t=Math.max(3,t);let n=[],s=[],o=[],l=[],c=new y,h=new T;s.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let u=0,f=3;u<=t;u++,f+=3){let d=i+u/t*r;c.x=e*Math.cos(d),c.y=e*Math.sin(d),s.push(c.x,c.y,c.z),o.push(0,0,1),h.x=(s[f]/e+1)/2,h.y=(s[f+1]/e+1)/2,l.push(h.x,h.y)}for(let u=1;u<=t;u++)n.push(u,u+1,0);this.setIndex(n),this.setAttribute("position",new R(s,3)),this.setAttribute("normal",new R(o,3)),this.setAttribute("uv",new R(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new a(e.radius,e.segments,e.thetaStart,e.thetaLength)}};var vs=class a extends P{constructor(e=1,t=1,i=1,r=32,n=1,s=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:r,heightSegments:n,openEnded:s,thetaStart:o,thetaLength:l};let c=this;r=Math.floor(r),n=Math.floor(n);let h=[],u=[],f=[],d=[],p=0,m=[],g=i/2,_=0;x(),s===!1&&(e>0&&v(!0),t>0&&v(!1)),this.setIndex(h),this.setAttribute("position",new R(u,3)),this.setAttribute("normal",new R(f,3)),this.setAttribute("uv",new R(d,2));function x(){let b=new y,M=new y,S=0,A=(t-e)/i;for(let w=0;w<=n;w++){let E=[],C=w/n,N=C*(t-e)+e;for(let V=0;V<=r;V++){let X=V/r,ee=X*l+o,q=Math.sin(ee),ue=Math.cos(ee);M.x=N*q,M.y=-C*i+g,M.z=N*ue,u.push(M.x,M.y,M.z),b.set(q,A,ue).normalize(),f.push(b.x,b.y,b.z),d.push(X,1-C),E.push(p++)}m.push(E)}for(let w=0;w<r;w++)for(let E=0;E<n;E++){let C=m[E][w],N=m[E+1][w],V=m[E+1][w+1],X=m[E][w+1];(e>0||E!==0)&&(h.push(C,N,X),S+=3),(t>0||E!==n-1)&&(h.push(N,V,X),S+=3)}c.addGroup(_,S,0),_+=S}function v(b){let M=p,S=new T,A=new y,w=0,E=b===!0?e:t,C=b===!0?1:-1;for(let V=1;V<=r;V++)u.push(0,g*C,0),f.push(0,C,0),d.push(.5,.5),p++;let N=p;for(let V=0;V<=r;V++){let ee=V/r*l+o,q=Math.cos(ee),ue=Math.sin(ee);A.x=E*ue,A.y=g*C,A.z=E*q,u.push(A.x,A.y,A.z),f.push(0,C,0),S.x=q*.5+.5,S.y=ue*.5*C+.5,d.push(S.x,S.y),p++}for(let V=0;V<r;V++){let X=M+V,ee=N+V;b===!0?h.push(ee,ee+1,X):h.push(ee+1,ee,X),w+=3}c.addGroup(_,w,b===!0?1:2),_+=w}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new a(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}};var bs=class a extends vs{constructor(e=1,t=1,i=32,r=1,n=!1,s=0,o=Math.PI*2){super(0,e,t,i,r,n,s,o),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:i,heightSegments:r,openEnded:n,thetaStart:s,thetaLength:o}}static fromJSON(e){return new a(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}};var kt=class a extends P{constructor(e=[],t=[],i=1,r=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:i,detail:r};let n=[],s=[];o(r),c(i),h(),this.setAttribute("position",new R(n,3)),this.setAttribute("normal",new R(n.slice(),3)),this.setAttribute("uv",new R(s,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function o(x){let v=new y,b=new y,M=new y;for(let S=0;S<t.length;S+=3)d(t[S+0],v),d(t[S+1],b),d(t[S+2],M),l(v,b,M,x)}function l(x,v,b,M){let S=M+1,A=[];for(let w=0;w<=S;w++){A[w]=[];let E=x.clone().lerp(b,w/S),C=v.clone().lerp(b,w/S),N=S-w;for(let V=0;V<=N;V++)V===0&&w===S?A[w][V]=E:A[w][V]=E.clone().lerp(C,V/N)}for(let w=0;w<S;w++)for(let E=0;E<2*(S-w)-1;E++){let C=Math.floor(E/2);E%2===0?(f(A[w][C+1]),f(A[w+1][C]),f(A[w][C])):(f(A[w][C+1]),f(A[w+1][C+1]),f(A[w+1][C]))}}function c(x){let v=new y;for(let b=0;b<n.length;b+=3)v.x=n[b+0],v.y=n[b+1],v.z=n[b+2],v.normalize().multiplyScalar(x),n[b+0]=v.x,n[b+1]=v.y,n[b+2]=v.z}function h(){let x=new y;for(let v=0;v<n.length;v+=3){x.x=n[v+0],x.y=n[v+1],x.z=n[v+2];let b=g(x)/2/Math.PI+.5,M=_(x)/Math.PI+.5;s.push(b,1-M)}p(),u()}function u(){for(let x=0;x<s.length;x+=6){let v=s[x+0],b=s[x+2],M=s[x+4],S=Math.max(v,b,M),A=Math.min(v,b,M);S>.9&&A<.1&&(v<.2&&(s[x+0]+=1),b<.2&&(s[x+2]+=1),M<.2&&(s[x+4]+=1))}}function f(x){n.push(x.x,x.y,x.z)}function d(x,v){let b=x*3;v.x=e[b+0],v.y=e[b+1],v.z=e[b+2]}function p(){let x=new y,v=new y,b=new y,M=new y,S=new T,A=new T,w=new T;for(let E=0,C=0;E<n.length;E+=9,C+=6){x.set(n[E+0],n[E+1],n[E+2]),v.set(n[E+3],n[E+4],n[E+5]),b.set(n[E+6],n[E+7],n[E+8]),S.set(s[C+0],s[C+1]),A.set(s[C+2],s[C+3]),w.set(s[C+4],s[C+5]),M.copy(x).add(v).add(b).divideScalar(3);let N=g(M);m(S,C+0,x,N),m(A,C+2,v,N),m(w,C+4,b,N)}}function m(x,v,b,M){M<0&&x.x===1&&(s[v]=x.x-1),b.x===0&&b.z===0&&(s[v]=M/2/Math.PI+.5)}function g(x){return Math.atan2(x.z,-x.x)}function _(x){return Math.atan2(-x.y,Math.sqrt(x.x*x.x+x.z*x.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new a(e.vertices,e.indices,e.radius,e.detail)}};var Sl=class a extends kt{constructor(e=1,t=0){let i=(1+Math.sqrt(5))/2,r=1/i,n=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-r,-i,0,-r,i,0,r,-i,0,r,i,-r,-i,0,-r,i,0,r,-i,0,r,i,0,-i,0,-r,i,0,-r,-i,0,r,i,0,r],s=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(n,s,e,t),this.type="DodecahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new a(e.radius,e.detail)}};var Ml=new y,wl=new y,ru=new y,Al=new gt,Tl=class extends P{constructor(e=null,t=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:e,thresholdAngle:t},e!==null){let r=Math.pow(10,4),n=Math.cos(li*t),s=e.getIndex(),o=e.getAttribute("position"),l=s?s.count:o.count,c=[0,0,0],h=["a","b","c"],u=new Array(3),f={},d=[];for(let p=0;p<l;p+=3){s?(c[0]=s.getX(p),c[1]=s.getX(p+1),c[2]=s.getX(p+2)):(c[0]=p,c[1]=p+1,c[2]=p+2);let{a:m,b:g,c:_}=Al;if(m.fromBufferAttribute(o,c[0]),g.fromBufferAttribute(o,c[1]),_.fromBufferAttribute(o,c[2]),Al.getNormal(ru),u[0]=`${Math.round(m.x*r)},${Math.round(m.y*r)},${Math.round(m.z*r)}`,u[1]=`${Math.round(g.x*r)},${Math.round(g.y*r)},${Math.round(g.z*r)}`,u[2]=`${Math.round(_.x*r)},${Math.round(_.y*r)},${Math.round(_.z*r)}`,!(u[0]===u[1]||u[1]===u[2]||u[2]===u[0]))for(let x=0;x<3;x++){let v=(x+1)%3,b=u[x],M=u[v],S=Al[h[x]],A=Al[h[v]],w=`${b}_${M}`,E=`${M}_${b}`;E in f&&f[E]?(ru.dot(f[E].normal)<=n&&(d.push(S.x,S.y,S.z),d.push(A.x,A.y,A.z)),f[E]=null):w in f||(f[w]={index0:c[x],index1:c[v],normal:ru.clone()})}}for(let p in f)if(f[p]){let{index0:m,index1:g}=f[p];Ml.fromBufferAttribute(o,m),wl.fromBufferAttribute(o,g),d.push(Ml.x,Ml.y,Ml.z),d.push(wl.x,wl.y,wl.z)}this.setAttribute("position",new R(d,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}};var nr={};sh(nr,{ArcCurve:()=>Jo,CatmullRomCurve3:()=>jo,CubicBezierCurve:()=>Gr,CubicBezierCurve3:()=>Ko,EllipseCurve:()=>Ni,LineCurve:()=>Hr,LineCurve3:()=>$o,QuadraticBezierCurve:()=>Wr,QuadraticBezierCurve3:()=>qr,SplineCurve:()=>Xr});var we=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){B("Curve: .getPoint() not implemented.")}getPointAt(e,t){let i=this.getUtoTmapping(e);return this.getPoint(i,t)}getPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return t}getSpacedPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPointAt(i/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],i,r=this.getPoint(0),n=0;t.push(0);for(let s=1;s<=e;s++)i=this.getPoint(s/e),n+=i.distanceTo(r),t.push(n),r=i;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let i=this.getLengths(),r=0,n=i.length,s;t?s=t:s=e*i[n-1];let o=0,l=n-1,c;for(;o<=l;)if(r=Math.floor(o+(l-o)/2),c=i[r]-s,c<0)o=r+1;else if(c>0)l=r-1;else{l=r;break}if(r=l,i[r]===s)return r/(n-1);let h=i[r],f=i[r+1]-h,d=(s-h)/f;return(r+d)/(n-1)}getTangent(e,t){let r=e-1e-4,n=e+1e-4;r<0&&(r=0),n>1&&(n=1);let s=this.getPoint(r),o=this.getPoint(n),l=t||(s.isVector2?new T:new y);return l.copy(o).sub(s).normalize(),l}getTangentAt(e,t){let i=this.getUtoTmapping(e);return this.getTangent(i,t)}computeFrenetFrames(e,t=!1){let i=new y,r=[],n=[],s=[],o=new y,l=new F;for(let d=0;d<=e;d++){let p=d/e;r[d]=this.getTangentAt(p,new y)}n[0]=new y,s[0]=new y;let c=Number.MAX_VALUE,h=Math.abs(r[0].x),u=Math.abs(r[0].y),f=Math.abs(r[0].z);h<=c&&(c=h,i.set(1,0,0)),u<=c&&(c=u,i.set(0,1,0)),f<=c&&i.set(0,0,1),o.crossVectors(r[0],i).normalize(),n[0].crossVectors(r[0],o),s[0].crossVectors(r[0],n[0]);for(let d=1;d<=e;d++){if(n[d]=n[d-1].clone(),s[d]=s[d-1].clone(),o.crossVectors(r[d-1],r[d]),o.length()>Number.EPSILON){o.normalize();let p=Math.acos(k(r[d-1].dot(r[d]),-1,1));n[d].applyMatrix4(l.makeRotationAxis(o,p))}s[d].crossVectors(r[d],n[d])}if(t===!0){let d=Math.acos(k(n[0].dot(n[e]),-1,1));d/=e,r[0].dot(o.crossVectors(n[0],n[e]))>0&&(d=-d);for(let p=1;p<=e;p++)n[p].applyMatrix4(l.makeRotationAxis(r[p],d*p)),s[p].crossVectors(r[p],n[p])}return{tangents:r,normals:n,binormals:s}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}};var Ni=class extends we{constructor(e=0,t=0,i=1,r=1,n=0,s=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=i,this.yRadius=r,this.aStartAngle=n,this.aEndAngle=s,this.aClockwise=o,this.aRotation=l}getPoint(e,t=new T){let i=t,r=Math.PI*2,n=this.aEndAngle-this.aStartAngle,s=Math.abs(n)<Number.EPSILON;for(;n<0;)n+=r;for(;n>r;)n-=r;n<Number.EPSILON&&(s?n=0:n=r),this.aClockwise===!0&&!s&&(n===r?n=-r:n=n-r);let o=this.aStartAngle+e*n,l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){let h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),f=l-this.aX,d=c-this.aY;l=f*h-d*u+this.aX,c=f*u+d*h+this.aY}return i.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}};var Jo=class extends Ni{constructor(e,t,i,r,n,s){super(e,t,i,i,r,n,s),this.isArcCurve=!0,this.type="ArcCurve"}};function au(){let a=0,e=0,t=0,i=0;function r(n,s,o,l){a=n,e=o,t=-3*n+3*s-2*o-l,i=2*n-2*s+o+l}return{initCatmullRom:function(n,s,o,l,c){r(s,o,c*(o-n),c*(l-s))},initNonuniformCatmullRom:function(n,s,o,l,c,h,u){let f=(s-n)/c-(o-n)/(c+h)+(o-s)/h,d=(o-s)/h-(l-s)/(h+u)+(l-o)/u;f*=h,d*=h,r(s,o,f,d)},calc:function(n){let s=n*n,o=s*n;return a+e*n+t*s+i*o}}}var ld=new y,cd=new y,nu=new au,su=new au,ou=new au,jo=class extends we{constructor(e=[],t=!1,i="centripetal",r=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=i,this.tension=r}getPoint(e,t=new y){let i=t,r=this.points,n=r.length,s=(n-(this.closed?0:1))*e,o=Math.floor(s),l=s-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/n)+1)*n:l===0&&o===n-1&&(o=n-2,l=1);let c,h;this.closed||o>0?c=r[(o-1)%n]:(cd.subVectors(r[0],r[1]).add(r[0]),c=cd);let u=r[o%n],f=r[(o+1)%n];if(this.closed||o+2<n?h=r[(o+2)%n]:(ld.subVectors(r[n-1],r[n-2]).add(r[n-1]),h=ld),this.curveType==="centripetal"||this.curveType==="chordal"){let d=this.curveType==="chordal"?.5:.25,p=Math.pow(c.distanceToSquared(u),d),m=Math.pow(u.distanceToSquared(f),d),g=Math.pow(f.distanceToSquared(h),d);m<1e-4&&(m=1),p<1e-4&&(p=m),g<1e-4&&(g=m),nu.initNonuniformCatmullRom(c.x,u.x,f.x,h.x,p,m,g),su.initNonuniformCatmullRom(c.y,u.y,f.y,h.y,p,m,g),ou.initNonuniformCatmullRom(c.z,u.z,f.z,h.z,p,m,g)}else this.curveType==="catmullrom"&&(nu.initCatmullRom(c.x,u.x,f.x,h.x,this.tension),su.initCatmullRom(c.y,u.y,f.y,h.y,this.tension),ou.initCatmullRom(c.z,u.z,f.z,h.z,this.tension));return i.set(nu.calc(l),su.calc(l),ou.calc(l)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(r.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let r=this.points[t];e.points.push(r.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(new y().fromArray(r))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function lu(a,e,t,i,r){let n=(i-e)*.5,s=(r-t)*.5,o=a*a,l=a*o;return(2*t-2*i+n+s)*l+(-3*t+3*i-2*n-s)*o+n*a+t}function K0(a,e){let t=1-a;return t*t*e}function $0(a,e){return 2*(1-a)*a*e}function Q0(a,e){return a*a*e}function kr(a,e,t,i){return K0(a,e)+$0(a,t)+Q0(a,i)}function ey(a,e){let t=1-a;return t*t*t*e}function ty(a,e){let t=1-a;return 3*t*t*a*e}function iy(a,e){return 3*(1-a)*a*a*e}function ry(a,e){return a*a*a*e}function Vr(a,e,t,i,r){return ey(a,e)+ty(a,t)+iy(a,i)+ry(a,r)}var Gr=class extends we{constructor(e=new T,t=new T,i=new T,r=new T){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=i,this.v3=r}getPoint(e,t=new T){let i=t,r=this.v0,n=this.v1,s=this.v2,o=this.v3;return i.set(Vr(e,r.x,n.x,s.x,o.x),Vr(e,r.y,n.y,s.y,o.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}};var Ko=class extends we{constructor(e=new y,t=new y,i=new y,r=new y){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=i,this.v3=r}getPoint(e,t=new y){let i=t,r=this.v0,n=this.v1,s=this.v2,o=this.v3;return i.set(Vr(e,r.x,n.x,s.x,o.x),Vr(e,r.y,n.y,s.y,o.y),Vr(e,r.z,n.z,s.z,o.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}};var Hr=class extends we{constructor(e=new T,t=new T){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new T){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new T){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}};var $o=class extends we{constructor(e=new y,t=new y){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new y){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new y){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}};var Wr=class extends we{constructor(e=new T,t=new T,i=new T){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new T){let i=t,r=this.v0,n=this.v1,s=this.v2;return i.set(kr(e,r.x,n.x,s.x),kr(e,r.y,n.y,s.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}};var qr=class extends we{constructor(e=new y,t=new y,i=new y){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new y){let i=t,r=this.v0,n=this.v1,s=this.v2;return i.set(kr(e,r.x,n.x,s.x),kr(e,r.y,n.y,s.y),kr(e,r.z,n.z,s.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}};var Xr=class extends we{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new T){let i=t,r=this.points,n=(r.length-1)*e,s=Math.floor(n),o=n-s,l=r[s===0?s:s-1],c=r[s],h=r[s>r.length-2?r.length-1:s+1],u=r[s>r.length-3?r.length-1:s+2];return i.set(lu(o,l.x,c.x,h.x,u.x),lu(o,l.y,c.y,h.y,u.y)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(r.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let r=this.points[t];e.points.push(r.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(new T().fromArray(r))}return this}};var Ss=class extends we{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let i=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new nr[i](t,e))}return this}getPoint(e,t){let i=e*this.getLength(),r=this.getCurveLengths(),n=0;for(;n<r.length;){if(r[n]>=i){let s=r[n]-i,o=this.curves[n],l=o.getLength(),c=l===0?0:1-s/l;return o.getPointAt(c,t)}n++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let i=0,r=this.curves.length;i<r;i++)t+=this.curves[i].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],i;for(let r=0,n=this.curves;r<n.length;r++){let s=n[r],o=s.isEllipseCurve?e*2:s.isLineCurve||s.isLineCurve3?1:s.isSplineCurve?e*s.points.length:e,l=s.getPoints(o);for(let c=0;c<l.length;c++){let h=l[c];i&&i.equals(h)||(t.push(h),i=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let r=e.curves[t];this.curves.push(r.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,i=this.curves.length;t<i;t++){let r=this.curves[t];e.curves.push(r.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let r=e.curves[t];this.curves.push(new nr[r.type]().fromJSON(r))}return this}};var di=class extends Ss{constructor(e){super(),this.type="Path",this.currentPoint=new T,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,i=e.length;t<i;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let i=new Hr(this.currentPoint.clone(),new T(e,t));return this.curves.push(i),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,i,r){let n=new Wr(this.currentPoint.clone(),new T(e,t),new T(i,r));return this.curves.push(n),this.currentPoint.set(i,r),this}bezierCurveTo(e,t,i,r,n,s){let o=new Gr(this.currentPoint.clone(),new T(e,t),new T(i,r),new T(n,s));return this.curves.push(o),this.currentPoint.set(n,s),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),i=new Xr(t);return this.curves.push(i),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,i,r,n,s){let o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+o,t+l,i,r,n,s),this}absarc(e,t,i,r,n,s){return this.absellipse(e,t,i,i,r,n,s),this}ellipse(e,t,i,r,n,s,o,l){let c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+c,t+h,i,r,n,s,o,l),this}absellipse(e,t,i,r,n,s,o,l){let c=new Ni(e,t,i,r,n,s,o,l);if(this.curves.length>0){let u=c.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(c);let h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}};var Vt=class extends di{constructor(e){super(e),this.uuid=Te(),this.type="Shape",this.holes=[]}getPointsHoles(e){let t=[];for(let i=0,r=this.holes.length;i<r;i++)t[i]=this.holes[i].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let r=e.holes[t];this.holes.push(r.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,i=this.holes.length;t<i;t++){let r=this.holes[t];e.holes.push(r.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let r=e.holes[t];this.holes.push(new di().fromJSON(r))}return this}};function uu(a,e,t=2){let i=e&&e.length,r=i?e[0]*t:a.length,n=ud(a,0,r,t,!0),s=[];if(!n||n.next===n.prev)return s;let o,l,c;if(i&&(n=ly(a,e,n,t)),a.length>80*t){o=a[0],l=a[1];let h=o,u=l;for(let f=t;f<r;f+=t){let d=a[f],p=a[f+1];d<o&&(o=d),p<l&&(l=p),d>h&&(h=d),p>u&&(u=p)}c=Math.max(h-o,u-l),c=c!==0?32767/c:0}return ea(n,s,t,o,l,c,0),s}function ud(a,e,t,i,r){let n;if(r===yy(a,e,t,i)>0)for(let s=e;s<t;s+=i)n=hd(s/i|0,a[s],a[s+1],n);else for(let s=t-i;s>=e;s-=i)n=hd(s/i|0,a[s],a[s+1],n);return n&&Ms(n,n.next)&&(ia(n),n=n.next),n}function Yr(a,e){if(!a)return a;e||(e=a);let t=a,i;do if(i=!1,!t.steiner&&(Ms(t,t.next)||Ce(t.prev,t,t.next)===0)){if(ia(t),t=e=t.prev,t===t.next)break;i=!0}else t=t.next;while(i||t!==e);return e}function ea(a,e,t,i,r,n,s){if(!a)return;!s&&n&&dy(a,i,r,n);let o=a;for(;a.prev!==a.next;){let l=a.prev,c=a.next;if(n?sy(a,i,r,n):ny(a)){e.push(l.i,a.i,c.i),ia(a),a=c.next,o=c.next;continue}if(a=c,a===o){s?s===1?(a=oy(Yr(a),e),ea(a,e,t,i,r,n,2)):s===2&&ay(a,e,t,i,r,n):ea(Yr(a),e,t,i,r,n,1);break}}}function ny(a){let e=a.prev,t=a,i=a.next;if(Ce(e,t,i)>=0)return!1;let r=e.x,n=t.x,s=i.x,o=e.y,l=t.y,c=i.y,h=Math.min(r,n,s),u=Math.min(o,l,c),f=Math.max(r,n,s),d=Math.max(o,l,c),p=i.next;for(;p!==e;){if(p.x>=h&&p.x<=f&&p.y>=u&&p.y<=d&&Qo(r,o,n,l,s,c,p.x,p.y)&&Ce(p.prev,p,p.next)>=0)return!1;p=p.next}return!0}function sy(a,e,t,i){let r=a.prev,n=a,s=a.next;if(Ce(r,n,s)>=0)return!1;let o=r.x,l=n.x,c=s.x,h=r.y,u=n.y,f=s.y,d=Math.min(o,l,c),p=Math.min(h,u,f),m=Math.max(o,l,c),g=Math.max(h,u,f),_=cu(d,p,e,t,i),x=cu(m,g,e,t,i),v=a.prevZ,b=a.nextZ;for(;v&&v.z>=_&&b&&b.z<=x;){if(v.x>=d&&v.x<=m&&v.y>=p&&v.y<=g&&v!==r&&v!==s&&Qo(o,h,l,u,c,f,v.x,v.y)&&Ce(v.prev,v,v.next)>=0||(v=v.prevZ,b.x>=d&&b.x<=m&&b.y>=p&&b.y<=g&&b!==r&&b!==s&&Qo(o,h,l,u,c,f,b.x,b.y)&&Ce(b.prev,b,b.next)>=0))return!1;b=b.nextZ}for(;v&&v.z>=_;){if(v.x>=d&&v.x<=m&&v.y>=p&&v.y<=g&&v!==r&&v!==s&&Qo(o,h,l,u,c,f,v.x,v.y)&&Ce(v.prev,v,v.next)>=0)return!1;v=v.prevZ}for(;b&&b.z<=x;){if(b.x>=d&&b.x<=m&&b.y>=p&&b.y<=g&&b!==r&&b!==s&&Qo(o,h,l,u,c,f,b.x,b.y)&&Ce(b.prev,b,b.next)>=0)return!1;b=b.nextZ}return!0}function oy(a,e){let t=a;do{let i=t.prev,r=t.next.next;!Ms(i,r)&&dd(i,t,t.next,r)&&ta(i,r)&&ta(r,i)&&(e.push(i.i,t.i,r.i),ia(t),ia(t.next),t=a=r),t=t.next}while(t!==a);return Yr(t)}function ay(a,e,t,i,r,n){let s=a;do{let o=s.next.next;for(;o!==s.prev;){if(s.i!==o.i&&gy(s,o)){let l=pd(s,o);s=Yr(s,s.next),l=Yr(l,l.next),ea(s,e,t,i,r,n,0),ea(l,e,t,i,r,n,0);return}o=o.next}s=s.next}while(s!==a)}function ly(a,e,t,i){let r=[];for(let n=0,s=e.length;n<s;n++){let o=e[n]*i,l=n<s-1?e[n+1]*i:a.length,c=ud(a,o,l,i,!1);c===c.next&&(c.steiner=!0),r.push(my(c))}r.sort(cy);for(let n=0;n<r.length;n++)t=hy(r[n],t);return t}function cy(a,e){let t=a.x-e.x;if(t===0&&(t=a.y-e.y,t===0)){let i=(a.next.y-a.y)/(a.next.x-a.x),r=(e.next.y-e.y)/(e.next.x-e.x);t=i-r}return t}function hy(a,e){let t=uy(a,e);if(!t)return e;let i=pd(t,a);return Yr(i,i.next),Yr(t,t.next)}function uy(a,e){let t=e,i=a.x,r=a.y,n=-1/0,s;if(Ms(a,t))return t;do{if(Ms(a,t.next))return t.next;if(r<=t.y&&r>=t.next.y&&t.next.y!==t.y){let u=t.x+(r-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(u<=i&&u>n&&(n=u,s=t.x<t.next.x?t:t.next,u===i))return s}t=t.next}while(t!==e);if(!s)return null;let o=s,l=s.x,c=s.y,h=1/0;t=s;do{if(i>=t.x&&t.x>=l&&i!==t.x&&fd(r<c?i:n,r,l,c,r<c?n:i,r,t.x,t.y)){let u=Math.abs(r-t.y)/(i-t.x);ta(t,a)&&(u<h||u===h&&(t.x>s.x||t.x===s.x&&fy(s,t)))&&(s=t,h=u)}t=t.next}while(t!==o);return s}function fy(a,e){return Ce(a.prev,a,e.prev)<0&&Ce(e.next,a,a.next)<0}function dy(a,e,t,i){let r=a;do r.z===0&&(r.z=cu(r.x,r.y,e,t,i)),r.prevZ=r.prev,r.nextZ=r.next,r=r.next;while(r!==a);r.prevZ.nextZ=null,r.prevZ=null,py(r)}function py(a){let e,t=1;do{let i=a,r;a=null;let n=null;for(e=0;i;){e++;let s=i,o=0;for(let c=0;c<t&&(o++,s=s.nextZ,!!s);c++);let l=t;for(;o>0||l>0&&s;)o!==0&&(l===0||!s||i.z<=s.z)?(r=i,i=i.nextZ,o--):(r=s,s=s.nextZ,l--),n?n.nextZ=r:a=r,r.prevZ=n,n=r;i=s}n.nextZ=null,t*=2}while(e>1);return a}function cu(a,e,t,i,r){return a=(a-t)*r|0,e=(e-i)*r|0,a=(a|a<<8)&16711935,a=(a|a<<4)&252645135,a=(a|a<<2)&858993459,a=(a|a<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,a|e<<1}function my(a){let e=a,t=a;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==a);return t}function fd(a,e,t,i,r,n,s,o){return(r-s)*(e-o)>=(a-s)*(n-o)&&(a-s)*(i-o)>=(t-s)*(e-o)&&(t-s)*(n-o)>=(r-s)*(i-o)}function Qo(a,e,t,i,r,n,s,o){return!(a===s&&e===o)&&fd(a,e,t,i,r,n,s,o)}function gy(a,e){return a.next.i!==e.i&&a.prev.i!==e.i&&!_y(a,e)&&(ta(a,e)&&ta(e,a)&&xy(a,e)&&(Ce(a.prev,a,e.prev)||Ce(a,e.prev,e))||Ms(a,e)&&Ce(a.prev,a,a.next)>0&&Ce(e.prev,e,e.next)>0)}function Ce(a,e,t){return(e.y-a.y)*(t.x-e.x)-(e.x-a.x)*(t.y-e.y)}function Ms(a,e){return a.x===e.x&&a.y===e.y}function dd(a,e,t,i){let r=El(Ce(a,e,t)),n=El(Ce(a,e,i)),s=El(Ce(t,i,a)),o=El(Ce(t,i,e));return!!(r!==n&&s!==o||r===0&&Cl(a,t,e)||n===0&&Cl(a,i,e)||s===0&&Cl(t,a,i)||o===0&&Cl(t,e,i))}function Cl(a,e,t){return e.x<=Math.max(a.x,t.x)&&e.x>=Math.min(a.x,t.x)&&e.y<=Math.max(a.y,t.y)&&e.y>=Math.min(a.y,t.y)}function El(a){return a>0?1:a<0?-1:0}function _y(a,e){let t=a;do{if(t.i!==a.i&&t.next.i!==a.i&&t.i!==e.i&&t.next.i!==e.i&&dd(t,t.next,a,e))return!0;t=t.next}while(t!==a);return!1}function ta(a,e){return Ce(a.prev,a,a.next)<0?Ce(a,e,a.next)>=0&&Ce(a,a.prev,e)>=0:Ce(a,e,a.prev)<0||Ce(a,a.next,e)<0}function xy(a,e){let t=a,i=!1,r=(a.x+e.x)/2,n=(a.y+e.y)/2;do t.y>n!=t.next.y>n&&t.next.y!==t.y&&r<(t.next.x-t.x)*(n-t.y)/(t.next.y-t.y)+t.x&&(i=!i),t=t.next;while(t!==a);return i}function pd(a,e){let t=hu(a.i,a.x,a.y),i=hu(e.i,e.x,e.y),r=a.next,n=e.prev;return a.next=e,e.prev=a,t.next=r,r.prev=t,i.next=t,t.prev=i,n.next=i,i.prev=n,i}function hd(a,e,t,i){let r=hu(a,e,t);return i?(r.next=i.next,r.prev=i,i.next.prev=r,i.next=r):(r.prev=r,r.next=r),r}function ia(a){a.next.prev=a.prev,a.prev.next=a.next,a.prevZ&&(a.prevZ.nextZ=a.nextZ),a.nextZ&&(a.nextZ.prevZ=a.prevZ)}function hu(a,e,t){return{i:a,x:e,y:t,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function yy(a,e,t,i){let r=0;for(let n=e,s=t-i;n<t;n+=i)r+=(a[s]-a[n])*(a[n+1]+a[s+1]),s=n;return r}var Il=class{static triangulate(e,t,i=2){return uu(e,t,i)}};var ft=class a{static area(e){let t=e.length,i=0;for(let r=t-1,n=0;n<t;r=n++)i+=e[r].x*e[n].y-e[n].x*e[r].y;return i*.5}static isClockWise(e){return a.area(e)<0}static triangulateShape(e,t){let i=[],r=[],n=[];md(e),gd(i,e);let s=e.length;t.forEach(md);for(let l=0;l<t.length;l++)r.push(s),s+=t[l].length,gd(i,t[l]);let o=Il.triangulate(i,r);for(let l=0;l<o.length;l+=3)n.push(o.slice(l,l+3));return n}};function md(a){let e=a.length;e>2&&a[e-1].equals(a[0])&&a.pop()}function gd(a,e){for(let t=0;t<e.length;t++)a.push(e[t].x),a.push(e[t].y)}var Rl=class a extends P{constructor(e=new Vt([new T(.5,.5),new T(-.5,.5),new T(-.5,-.5),new T(.5,-.5)]),t={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:e,options:t},e=Array.isArray(e)?e:[e];let i=this,r=[],n=[];for(let o=0,l=e.length;o<l;o++){let c=e[o];s(c)}this.setAttribute("position",new R(r,3)),this.setAttribute("uv",new R(n,2)),this.computeVertexNormals();function s(o){let l=[],c=t.curveSegments!==void 0?t.curveSegments:12,h=t.steps!==void 0?t.steps:1,u=t.depth!==void 0?t.depth:1,f=t.bevelEnabled!==void 0?t.bevelEnabled:!0,d=t.bevelThickness!==void 0?t.bevelThickness:.2,p=t.bevelSize!==void 0?t.bevelSize:d-.1,m=t.bevelOffset!==void 0?t.bevelOffset:0,g=t.bevelSegments!==void 0?t.bevelSegments:3,_=t.extrudePath,x=t.UVGenerator!==void 0?t.UVGenerator:vy,v,b=!1,M,S,A,w;if(_){v=_.getSpacedPoints(h),b=!0,f=!1;let D=_.isCatmullRomCurve3?_.closed:!1;M=_.computeFrenetFrames(h,D),S=new y,A=new y,w=new y}f||(g=0,d=0,p=0,m=0);let E=o.extractPoints(c),C=E.shape,N=E.holes;if(!ft.isClockWise(C)){C=C.reverse();for(let D=0,U=N.length;D<U;D++){let z=N[D];ft.isClockWise(z)&&(N[D]=z.reverse())}}function X(D){let z=10000000000000001e-36,W=D[0];for(let H=1;H<=D.length;H++){let se=H%D.length,K=D[se],ve=K.x-W.x,Ae=K.y-W.y,Fe=ve*ve+Ae*Ae,St=Math.max(Math.abs(K.x),Math.abs(K.y),Math.abs(W.x),Math.abs(W.y)),_r=z*St*St;if(Fe<=_r){D.splice(se,1),H--;continue}W=K}}X(C),N.forEach(X);let ee=N.length,q=C;for(let D=0;D<ee;D++){let U=N[D];C=C.concat(U)}function ue(D,U,z){return U||Z("ExtrudeGeometry: vec does not exist"),D.clone().addScaledVector(U,z)}let _e=C.length;function Ve(D,U,z){let W,H,se,K=D.x-U.x,ve=D.y-U.y,Ae=z.x-D.x,Fe=z.y-D.y,St=K*K+ve*ve,_r=K*Fe-ve*Ae;if(Math.abs(_r)>Number.EPSILON){let Mt=Math.sqrt(St),gf=Math.sqrt(Ae*Ae+Fe*Fe),_f=U.x-ve/Mt,xf=U.y+K/Mt,g_=z.x-Fe/gf,__=z.y+Ae/gf,yf=((g_-_f)*Fe-(__-xf)*Ae)/(K*Fe-ve*Ae);W=_f+K*yf-D.x,H=xf+ve*yf-D.y;let vf=W*W+H*H;if(vf<=2)return new T(W,H);se=Math.sqrt(vf/2)}else{let Mt=!1;K>Number.EPSILON?Ae>Number.EPSILON&&(Mt=!0):K<-Number.EPSILON?Ae<-Number.EPSILON&&(Mt=!0):Math.sign(ve)===Math.sign(Fe)&&(Mt=!0),Mt?(W=-ve,H=K,se=Math.sqrt(St)):(W=K,H=ve,se=Math.sqrt(St/2))}return new T(W/se,H/se)}let pe=[];for(let D=0,U=q.length,z=U-1,W=D+1;D<U;D++,z++,W++)z===U&&(z=0),W===U&&(W=0),pe[D]=Ve(q[D],q[z],q[W]);let xe=[],ye,pt=pe.concat();for(let D=0,U=ee;D<U;D++){let z=N[D];ye=[];for(let W=0,H=z.length,se=H-1,K=W+1;W<H;W++,se++,K++)se===H&&(se=0),K===H&&(K=0),ye[W]=Ve(z[W],z[se],z[K]);xe.push(ye),pt=pt.concat(ye)}let at;if(g===0)at=ft.triangulateShape(q,N);else{let D=[],U=[];for(let z=0;z<g;z++){let W=z/g,H=d*Math.cos(W*Math.PI/2),se=p*Math.sin(W*Math.PI/2)+m;for(let K=0,ve=q.length;K<ve;K++){let Ae=ue(q[K],pe[K],se);lt(Ae.x,Ae.y,-H),W===0&&D.push(Ae)}for(let K=0,ve=ee;K<ve;K++){let Ae=N[K];ye=xe[K];let Fe=[];for(let St=0,_r=Ae.length;St<_r;St++){let Mt=ue(Ae[St],ye[St],se);lt(Mt.x,Mt.y,-H),W===0&&Fe.push(Mt)}W===0&&U.push(Fe)}}at=ft.triangulateShape(D,U)}let bi=at.length,Oi=p+m;for(let D=0;D<_e;D++){let U=f?ue(C[D],pt[D],Oi):C[D];b?(A.copy(M.normals[0]).multiplyScalar(U.x),S.copy(M.binormals[0]).multiplyScalar(U.y),w.copy(v[0]).add(A).add(S),lt(w.x,w.y,w.z)):lt(U.x,U.y,0)}for(let D=1;D<=h;D++)for(let U=0;U<_e;U++){let z=f?ue(C[U],pt[U],Oi):C[U];b?(A.copy(M.normals[D]).multiplyScalar(z.x),S.copy(M.binormals[D]).multiplyScalar(z.y),w.copy(v[D]).add(A).add(S),lt(w.x,w.y,w.z)):lt(z.x,z.y,u/h*D)}for(let D=g-1;D>=0;D--){let U=D/g,z=d*Math.cos(U*Math.PI/2),W=p*Math.sin(U*Math.PI/2)+m;for(let H=0,se=q.length;H<se;H++){let K=ue(q[H],pe[H],W);lt(K.x,K.y,u+z)}for(let H=0,se=N.length;H<se;H++){let K=N[H];ye=xe[H];for(let ve=0,Ae=K.length;ve<Ae;ve++){let Fe=ue(K[ve],ye[ve],W);b?lt(Fe.x,Fe.y+v[h-1].y,v[h-1].x+z):lt(Fe.x,Fe.y,u+z)}}}pa(),ma();function pa(){let D=r.length/3;if(f){let U=0,z=_e*U;for(let W=0;W<bi;W++){let H=at[W];oi(H[2]+z,H[1]+z,H[0]+z)}U=h+g*2,z=_e*U;for(let W=0;W<bi;W++){let H=at[W];oi(H[0]+z,H[1]+z,H[2]+z)}}else{for(let U=0;U<bi;U++){let z=at[U];oi(z[2],z[1],z[0])}for(let U=0;U<bi;U++){let z=at[U];oi(z[0]+_e*h,z[1]+_e*h,z[2]+_e*h)}}i.addGroup(D,r.length/3-D,0)}function ma(){let D=r.length/3,U=0;Fi(q,U),U+=q.length;for(let z=0,W=N.length;z<W;z++){let H=N[z];Fi(H,U),U+=H.length}i.addGroup(D,r.length/3-D,1)}function Fi(D,U){let z=D.length;for(;--z>=0;){let W=z,H=z-1;H<0&&(H=D.length-1);for(let se=0,K=h+g*2;se<K;se++){let ve=_e*se,Ae=_e*(se+1),Fe=U+W+ve,St=U+H+ve,_r=U+H+Ae,Mt=U+W+Ae;ho(Fe,St,_r,Mt)}}}function lt(D,U,z){l.push(D),l.push(U),l.push(z)}function oi(D,U,z){bt(D),bt(U),bt(z);let W=r.length/3,H=x.generateTopUV(i,r,W-3,W-2,W-1);Si(H[0]),Si(H[1]),Si(H[2])}function ho(D,U,z,W){bt(D),bt(U),bt(W),bt(U),bt(z),bt(W);let H=r.length/3,se=x.generateSideWallUV(i,r,H-6,H-3,H-2,H-1);Si(se[0]),Si(se[1]),Si(se[3]),Si(se[1]),Si(se[2]),Si(se[3])}function bt(D){r.push(l[D*3+0]),r.push(l[D*3+1]),r.push(l[D*3+2])}function Si(D){n.push(D.x),n.push(D.y)}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes,i=this.parameters.options;return by(t,i,e)}static fromJSON(e,t){let i=[];for(let n=0,s=e.shapes.length;n<s;n++){let o=t[e.shapes[n]];i.push(o)}let r=e.options.extrudePath;return r!==void 0&&(e.options.extrudePath=new nr[r.type]().fromJSON(r)),new a(i,e.options)}},vy={generateTopUV:function(a,e,t,i,r){let n=e[t*3],s=e[t*3+1],o=e[i*3],l=e[i*3+1],c=e[r*3],h=e[r*3+1];return[new T(n,s),new T(o,l),new T(c,h)]},generateSideWallUV:function(a,e,t,i,r,n){let s=e[t*3],o=e[t*3+1],l=e[t*3+2],c=e[i*3],h=e[i*3+1],u=e[i*3+2],f=e[r*3],d=e[r*3+1],p=e[r*3+2],m=e[n*3],g=e[n*3+1],_=e[n*3+2];return Math.abs(o-h)<Math.abs(s-c)?[new T(s,1-l),new T(c,1-u),new T(f,1-p),new T(m,1-_)]:[new T(o,1-l),new T(h,1-u),new T(d,1-p),new T(g,1-_)]}};function by(a,e,t){if(t.shapes=[],Array.isArray(a))for(let i=0,r=a.length;i<r;i++){let n=a[i];t.shapes.push(n.uuid)}else t.shapes.push(a.uuid);return t.options=Object.assign({},e),e.extrudePath!==void 0&&(t.options.extrudePath=e.extrudePath.toJSON()),t}var Pl=class a extends kt{constructor(e=1,t=0){let i=(1+Math.sqrt(5))/2,r=[-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],n=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(r,n,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new a(e.radius,e.detail)}};var Ll=class a extends P{constructor(e=[new T(0,-.5),new T(.5,0),new T(0,.5)],t=12,i=0,r=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:i,phiLength:r},t=Math.floor(t),r=k(r,0,Math.PI*2);let n=[],s=[],o=[],l=[],c=[],h=1/t,u=new y,f=new T,d=new y,p=new y,m=new y,g=0,_=0;for(let x=0;x<=e.length-1;x++)switch(x){case 0:g=e[x+1].x-e[x].x,_=e[x+1].y-e[x].y,d.x=_*1,d.y=-g,d.z=_*0,m.copy(d),d.normalize(),l.push(d.x,d.y,d.z);break;case e.length-1:l.push(m.x,m.y,m.z);break;default:g=e[x+1].x-e[x].x,_=e[x+1].y-e[x].y,d.x=_*1,d.y=-g,d.z=_*0,p.copy(d),d.x+=m.x,d.y+=m.y,d.z+=m.z,d.normalize(),l.push(d.x,d.y,d.z),m.copy(p)}for(let x=0;x<=t;x++){let v=i+x*h*r,b=Math.sin(v),M=Math.cos(v);for(let S=0;S<=e.length-1;S++){u.x=e[S].x*b,u.y=e[S].y,u.z=e[S].x*M,s.push(u.x,u.y,u.z),f.x=x/t,f.y=S/(e.length-1),o.push(f.x,f.y);let A=l[3*S+0]*b,w=l[3*S+1],E=l[3*S+0]*M;c.push(A,w,E)}}for(let x=0;x<t;x++)for(let v=0;v<e.length-1;v++){let b=v+x*e.length,M=b,S=b+e.length,A=b+e.length+1,w=b+1;n.push(M,S,w),n.push(A,w,S)}this.setIndex(n),this.setAttribute("position",new R(s,3)),this.setAttribute("uv",new R(o,2)),this.setAttribute("normal",new R(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new a(e.points,e.segments,e.phiStart,e.phiLength)}};var ws=class a extends kt{constructor(e=1,t=0){let i=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],r=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(i,r,e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new a(e.radius,e.detail)}};var Nl=class a extends P{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};let n=e/2,s=t/2,o=Math.floor(i),l=Math.floor(r),c=o+1,h=l+1,u=e/o,f=t/l,d=[],p=[],m=[],g=[];for(let _=0;_<h;_++){let x=_*f-s;for(let v=0;v<c;v++){let b=v*u-n;p.push(b,-x,0),m.push(0,0,1),g.push(v/o),g.push(1-_/l)}}for(let _=0;_<l;_++)for(let x=0;x<o;x++){let v=x+c*_,b=x+c*(_+1),M=x+1+c*(_+1),S=x+1+c*_;d.push(v,b,S),d.push(b,M,S)}this.setIndex(d),this.setAttribute("position",new R(p,3)),this.setAttribute("normal",new R(m,3)),this.setAttribute("uv",new R(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new a(e.width,e.height,e.widthSegments,e.heightSegments)}};var Dl=class a extends P{constructor(e=.5,t=1,i=32,r=1,n=0,s=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:i,phiSegments:r,thetaStart:n,thetaLength:s},i=Math.max(3,i),r=Math.max(1,r);let o=[],l=[],c=[],h=[],u=e,f=(t-e)/r,d=new y,p=new T;for(let m=0;m<=r;m++){for(let g=0;g<=i;g++){let _=n+g/i*s;d.x=u*Math.cos(_),d.y=u*Math.sin(_),l.push(d.x,d.y,d.z),c.push(0,0,1),p.x=(d.x/t+1)/2,p.y=(d.y/t+1)/2,h.push(p.x,p.y)}u+=f}for(let m=0;m<r;m++){let g=m*(i+1);for(let _=0;_<i;_++){let x=_+g,v=x,b=x+i+1,M=x+i+2,S=x+1;o.push(v,b,S),o.push(b,M,S)}}this.setIndex(o),this.setAttribute("position",new R(l,3)),this.setAttribute("normal",new R(c,3)),this.setAttribute("uv",new R(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new a(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}};var Bl=class a extends P{constructor(e=new Vt([new T(0,.5),new T(-.5,-.5),new T(.5,-.5)]),t=12){super(),this.type="ShapeGeometry",this.parameters={shapes:e,curveSegments:t};let i=[],r=[],n=[],s=[],o=0,l=0;if(Array.isArray(e)===!1)c(e);else for(let h=0;h<e.length;h++)c(e[h]),this.addGroup(o,l,h),o+=l,l=0;this.setIndex(i),this.setAttribute("position",new R(r,3)),this.setAttribute("normal",new R(n,3)),this.setAttribute("uv",new R(s,2));function c(h){let u=r.length/3,f=h.extractPoints(t),d=f.shape,p=f.holes;ft.isClockWise(d)===!1&&(d=d.reverse());for(let g=0,_=p.length;g<_;g++){let x=p[g];ft.isClockWise(x)===!0&&(p[g]=x.reverse())}let m=ft.triangulateShape(d,p);for(let g=0,_=p.length;g<_;g++){let x=p[g];d=d.concat(x)}for(let g=0,_=d.length;g<_;g++){let x=d[g];r.push(x.x,x.y,0),n.push(0,0,1),s.push(x.x,x.y)}for(let g=0,_=m.length;g<_;g++){let x=m[g],v=x[0]+u,b=x[1]+u,M=x[2]+u;i.push(v,b,M),l+=3}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes;return Sy(t,e)}static fromJSON(e,t){let i=[];for(let r=0,n=e.shapes.length;r<n;r++){let s=t[e.shapes[r]];i.push(s)}return new a(i,e.curveSegments)}};function Sy(a,e){if(e.shapes=[],Array.isArray(a))for(let t=0,i=a.length;t<i;t++){let r=a[t];e.shapes.push(r.uuid)}else e.shapes.push(a.uuid);return e}var As=class a extends P{constructor(e=1,t=32,i=16,r=0,n=Math.PI*2,s=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:r,phiLength:n,thetaStart:s,thetaLength:o},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));let l=Math.min(s+o,Math.PI),c=0,h=[],u=new y,f=new y,d=[],p=[],m=[],g=[];for(let _=0;_<=i;_++){let x=[],v=_/i,b=s+v*o,M=e*Math.cos(b),S=Math.sqrt(e*e-M*M),A=0;_===0&&s===0?A=.5/t:_===i&&l===Math.PI&&(A=-.5/t);for(let w=0;w<=t;w++){let E=w/t,C=r+E*n;u.x=-S*Math.cos(C),u.y=M,u.z=S*Math.sin(C),p.push(u.x,u.y,u.z),f.copy(u).normalize(),m.push(f.x,f.y,f.z),g.push(E+A,1-v),x.push(c++)}h.push(x)}for(let _=0;_<i;_++)for(let x=0;x<t;x++){let v=h[_][x+1],b=h[_][x],M=h[_+1][x],S=h[_+1][x+1];(_!==0||s>0)&&d.push(v,b,S),(_!==i-1||l<Math.PI)&&d.push(b,M,S)}this.setIndex(d),this.setAttribute("position",new R(p,3)),this.setAttribute("normal",new R(m,3)),this.setAttribute("uv",new R(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new a(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var Ol=class a extends kt{constructor(e=1,t=0){let i=[1,1,1,-1,-1,1,-1,1,-1,1,-1,-1],r=[2,1,0,0,3,2,1,3,0,2,3,1];super(i,r,e,t),this.type="TetrahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new a(e.radius,e.detail)}};var Fl=class a extends P{constructor(e=1,t=.4,i=12,r=48,n=Math.PI*2,s=0,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:i,tubularSegments:r,arc:n,thetaStart:s,thetaLength:o},i=Math.floor(i),r=Math.floor(r);let l=[],c=[],h=[],u=[],f=new y,d=new y,p=new y;for(let m=0;m<=i;m++){let g=s+m/i*o;for(let _=0;_<=r;_++){let x=_/r*n;d.x=(e+t*Math.cos(g))*Math.cos(x),d.y=(e+t*Math.cos(g))*Math.sin(x),d.z=t*Math.sin(g),c.push(d.x,d.y,d.z),f.x=e*Math.cos(x),f.y=e*Math.sin(x),p.subVectors(d,f).normalize(),h.push(p.x,p.y,p.z),u.push(_/r),u.push(m/i)}}for(let m=1;m<=i;m++)for(let g=1;g<=r;g++){let _=(r+1)*m+g-1,x=(r+1)*(m-1)+g-1,v=(r+1)*(m-1)+g,b=(r+1)*m+g;l.push(_,x,b),l.push(x,v,b)}this.setIndex(l),this.setAttribute("position",new R(c,3)),this.setAttribute("normal",new R(h,3)),this.setAttribute("uv",new R(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new a(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc,e.thetaStart,e.thetaLength)}};var Ul=class a extends P{constructor(e=1,t=.4,i=64,r=8,n=2,s=3){super(),this.type="TorusKnotGeometry",this.parameters={radius:e,tube:t,tubularSegments:i,radialSegments:r,p:n,q:s},i=Math.floor(i),r=Math.floor(r);let o=[],l=[],c=[],h=[],u=new y,f=new y,d=new y,p=new y,m=new y,g=new y,_=new y;for(let v=0;v<=i;++v){let b=v/i*n*Math.PI*2;x(b,n,s,e,d),x(b+.01,n,s,e,p),g.subVectors(p,d),_.addVectors(p,d),m.crossVectors(g,_),_.crossVectors(m,g),m.normalize(),_.normalize();for(let M=0;M<=r;++M){let S=M/r*Math.PI*2,A=-t*Math.cos(S),w=t*Math.sin(S);u.x=d.x+(A*_.x+w*m.x),u.y=d.y+(A*_.y+w*m.y),u.z=d.z+(A*_.z+w*m.z),l.push(u.x,u.y,u.z),f.subVectors(u,d).normalize(),c.push(f.x,f.y,f.z),h.push(v/i),h.push(M/r)}}for(let v=1;v<=i;v++)for(let b=1;b<=r;b++){let M=(r+1)*(v-1)+(b-1),S=(r+1)*v+(b-1),A=(r+1)*v+b,w=(r+1)*(v-1)+b;o.push(M,S,w),o.push(S,A,w)}this.setIndex(o),this.setAttribute("position",new R(l,3)),this.setAttribute("normal",new R(c,3)),this.setAttribute("uv",new R(h,2));function x(v,b,M,S,A){let w=Math.cos(v),E=Math.sin(v),C=M/b*v,N=Math.cos(C);A.x=S*(2+N)*.5*w,A.y=S*(2+N)*E*.5,A.z=S*Math.sin(C)*.5}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new a(e.radius,e.tube,e.tubularSegments,e.radialSegments,e.p,e.q)}};var zl=class a extends P{constructor(e=new qr(new y(-1,-1,0),new y(-1,1,0),new y(1,1,0)),t=64,i=1,r=8,n=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:i,radialSegments:r,closed:n};let s=e.computeFrenetFrames(t,n);this.tangents=s.tangents,this.normals=s.normals,this.binormals=s.binormals;let o=new y,l=new y,c=new T,h=new y,u=[],f=[],d=[],p=[];m(),this.setIndex(p),this.setAttribute("position",new R(u,3)),this.setAttribute("normal",new R(f,3)),this.setAttribute("uv",new R(d,2));function m(){for(let v=0;v<t;v++)g(v);g(n===!1?t:0),x(),_()}function g(v){h=e.getPointAt(v/t,h);let b=s.normals[v],M=s.binormals[v];for(let S=0;S<=r;S++){let A=S/r*Math.PI*2,w=Math.sin(A),E=-Math.cos(A);l.x=E*b.x+w*M.x,l.y=E*b.y+w*M.y,l.z=E*b.z+w*M.z,l.normalize(),f.push(l.x,l.y,l.z),o.x=h.x+i*l.x,o.y=h.y+i*l.y,o.z=h.z+i*l.z,u.push(o.x,o.y,o.z)}}function _(){for(let v=1;v<=t;v++)for(let b=1;b<=r;b++){let M=(r+1)*(v-1)+(b-1),S=(r+1)*v+(b-1),A=(r+1)*v+b,w=(r+1)*(v-1)+b;p.push(M,S,w),p.push(S,A,w)}}function x(){for(let v=0;v<=t;v++)for(let b=0;b<=r;b++)c.x=v/t,c.y=b/r,d.push(c.x,c.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new a(new nr[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}};var kl=class extends P{constructor(e=null){if(super(),this.type="WireframeGeometry",this.parameters={geometry:e},e!==null){let t=[],i=new Set,r=new y,n=new y;if(e.index!==null){let s=e.attributes.position,o=e.index,l=e.groups;l.length===0&&(l=[{start:0,count:o.count,materialIndex:0}]);for(let c=0,h=l.length;c<h;++c){let u=l[c],f=u.start,d=u.count;for(let p=f,m=f+d;p<m;p+=3)for(let g=0;g<3;g++){let _=o.getX(p+g),x=o.getX(p+(g+1)%3);r.fromBufferAttribute(s,_),n.fromBufferAttribute(s,x),_d(r,n,i)===!0&&(t.push(r.x,r.y,r.z),t.push(n.x,n.y,n.z))}}}else{let s=e.attributes.position;for(let o=0,l=s.count/3;o<l;o++)for(let c=0;c<3;c++){let h=3*o+c,u=3*o+(c+1)%3;r.fromBufferAttribute(s,h),n.fromBufferAttribute(s,u),_d(r,n,i)===!0&&(t.push(r.x,r.y,r.z),t.push(n.x,n.y,n.z))}}this.setAttribute("position",new R(t,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}};function _d(a,e,t){let i=`${a.x},${a.y},${a.z}-${e.x},${e.y},${e.z}`,r=`${e.x},${e.y},${e.z}-${a.x},${a.y},${a.z}`;return t.has(i)===!0||t.has(r)===!0?!1:(t.add(i),t.add(r),!0)}var Ts=class extends ${constructor(e){super(),this.isShadowMaterial=!0,this.type="ShadowMaterial",this.color=new I(0),this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.fog=e.fog,this}};function Cs(a){let e={};for(let t in a){e[t]={};for(let i in a[t]){let r=a[t][i];if(xd(r))r.isRenderTargetTexture?(B("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone();else if(Array.isArray(r))if(xd(r[0])){let n=[];for(let s=0,o=r.length;s<o;s++)n[s]=r[s].clone();e[t][i]=n}else e[t][i]=r.slice();else e[t][i]=r}}return e}function rt(a){let e={};for(let t=0;t<a.length;t++){let i=Cs(a[t]);for(let r in i)e[r]=i[r]}return e}function xd(a){return a&&(a.isColor||a.isMatrix3||a.isMatrix4||a.isVector2||a.isVector3||a.isVector4||a.isTexture||a.isQuaternion)}function yd(a){let e=[];for(let t=0;t<a.length;t++)e.push(a[t].clone());return e}var vd={clone:Cs,merge:rt};var bd=`
void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;var Sd=`
void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}
`;var dt=class extends ${constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=bd,this.fragmentShader=Sd,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Cs(e.uniforms),this.uniformsGroups=yd(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let r in this.uniforms){let s=this.uniforms[r].value;s&&s.isTexture?t.uniforms[r]={type:"t",value:s.toJSON(e).uuid}:s&&s.isColor?t.uniforms[r]={type:"c",value:s.getHex()}:s&&s.isVector2?t.uniforms[r]={type:"v2",value:s.toArray()}:s&&s.isVector3?t.uniforms[r]={type:"v3",value:s.toArray()}:s&&s.isVector4?t.uniforms[r]={type:"v4",value:s.toArray()}:s&&s.isMatrix3?t.uniforms[r]={type:"m3",value:s.toArray()}:s&&s.isMatrix4?t.uniforms[r]={type:"m4",value:s.toArray()}:t.uniforms[r]={value:s}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let i in e.uniforms){let r=e.uniforms[i];switch(this.uniforms[i]={},r.type){case"t":this.uniforms[i].value=t[r.value]||null;break;case"c":this.uniforms[i].value=new I().setHex(r.value);break;case"v2":this.uniforms[i].value=new T().fromArray(r.value);break;case"v3":this.uniforms[i].value=new y().fromArray(r.value);break;case"v4":this.uniforms[i].value=new Ne().fromArray(r.value);break;case"m3":this.uniforms[i].value=new Y().fromArray(r.value);break;case"m4":this.uniforms[i].value=new F().fromArray(r.value);break;default:this.uniforms[i].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let i in e.extensions)this.extensions[i]=e.extensions[i];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}};var Es=class extends dt{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var ei=class extends ${constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new I(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new I(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=At,this.normalScale=new T(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ge,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var Ze=class extends ei{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new T(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return k(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new I(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new I(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new I(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._retroreflectivity=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get retroreflectivity(){return this._retroreflectivity}set retroreflectivity(e){this._retroreflectivity>0!=e>0&&this.version++,this._retroreflectivity=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.retroreflectivity=e.retroreflectivity,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}};var Is=class extends ${constructor(e){super(),this.isMeshPhongMaterial=!0,this.type="MeshPhongMaterial",this.color=new I(16777215),this.specular=new I(1118481),this.shininess=30,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new I(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=At,this.normalScale=new T(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ge,this.combine=xr,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.specular.copy(e.specular),this.shininess=e.shininess,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var Rs=class extends ${constructor(e){super(),this.isMeshToonMaterial=!0,this.defines={TOON:""},this.type="MeshToonMaterial",this.color=new I(16777215),this.map=null,this.gradientMap=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new I(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=At,this.normalScale=new T(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.alphaMap=null,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.gradientMap=e.gradientMap,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.alphaMap=e.alphaMap,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var Ps=class extends ${constructor(e){super(),this.isMeshNormalMaterial=!0,this.type="MeshNormalMaterial",this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=At,this.normalScale=new T(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.flatShading=!1,this.setValues(e)}copy(e){return super.copy(e),this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.flatShading=e.flatShading,this}};var Ls=class extends ${constructor(e){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new I(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new I(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=At,this.normalScale=new T(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ge,this.combine=xr,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var Ns=class extends ${constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=xh,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}};var Ds=class extends ${constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};var Bs=class extends ${constructor(e){super(),this.isMeshMatcapMaterial=!0,this.defines={MATCAP:""},this.type="MeshMatcapMaterial",this.color=new I(16777215),this.matcap=null,this.map=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=At,this.normalScale=new T(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.alphaMap=null,this.wireframe=!1,this.wireframeLinewidth=1,this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={MATCAP:""},this.color.copy(e.color),this.matcap=e.matcap,this.map=e.map,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.alphaMap=e.alphaMap,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.flatShading=e.flatShading,this.fog=e.fog,this}};var Os=class extends re{constructor(e){super(),this.isLineDashedMaterial=!0,this.type="LineDashedMaterial",this.scale=1,this.dashSize=3,this.gapSize=1,this.setValues(e)}copy(e){return super.copy(e),this.scale=e.scale,this.dashSize=e.dashSize,this.gapSize=e.gapSize,this}};function Nt(a,e){return!a||a.constructor===e?a:typeof e.BYTES_PER_ELEMENT=="number"?new e(a):Array.prototype.slice.call(a)}function Zr(a){return a!==void 0&&a.inTangents!==void 0&&a.outTangents!==void 0}function fu(a){function e(r,n){return a[r]-a[n]}let t=a.length,i=new Array(t);for(let r=0;r!==t;++r)i[r]=r;return i.sort(e),i}function Hl(a,e,t){let i=a.length,r=new a.constructor(i);for(let n=0,s=0;s!==i;++n){let o=t[n]*e;for(let l=0;l!==e;++l)r[s++]=a[o+l]}return r}function du(a,e,t,i){let r=1,n=a[0];for(;n!==void 0&&n[i]===void 0;)n=a[r++];if(n===void 0)return;let s=n[i];if(s!==void 0)if(Array.isArray(s))do s=n[i],s!==void 0&&(e.push(n.time),t.push(...s)),n=a[r++];while(n!==void 0);else if(s.toArray!==void 0)do s=n[i],s!==void 0&&(e.push(n.time),s.toArray(t,t.length)),n=a[r++];while(n!==void 0);else do s=n[i],s!==void 0&&(e.push(n.time),t.push(s)),n=a[r++];while(n!==void 0)}function My(a,e,t,i,r=30){let n=a.clone();n.name=e;let s=[];for(let l=0;l<n.tracks.length;++l){let c=n.tracks[l],h=c.getValueSize(),u=[],f=[];for(let d=0;d<c.times.length;++d){let p=c.times[d]*r;if(!(p<t||p>=i)){u.push(c.times[d]);for(let m=0;m<h;++m)f.push(c.values[d*h+m])}}u.length!==0&&(c.times=Nt(u,c.times.constructor),c.values=Nt(f,c.values.constructor),s.push(c))}n.tracks=s;let o=1/0;for(let l=0;l<n.tracks.length;++l)o>n.tracks[l].times[0]&&(o=n.tracks[l].times[0]);for(let l=0;l<n.tracks.length;++l)n.tracks[l].shift(-1*o);return n.resetDuration(),n}function wy(a,e=0,t=a,i=30){i<=0&&(i=30);let r=t.tracks.length,n=e/i;for(let s=0;s<r;++s){let o=t.tracks[s],l=o.ValueTypeName;if(l==="bool"||l==="string")continue;let c=a.tracks.find(function(_){return _.name===o.name&&_.ValueTypeName===l});if(c===void 0)continue;let h=0,u=o.getValueSize();o.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline&&(h=u/3);let f=0,d=c.getValueSize();c.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline&&(f=d/3);let p=o.times.length-1,m;if(n<=o.times[0]){let _=h,x=u-h;m=o.values.slice(_,x)}else if(n>=o.times[p]){let _=p*u+h,x=_+u-h;m=o.values.slice(_,x)}else{let _=o.createInterpolant(),x=h,v=u-h;_.evaluate(n),m=_.resultBuffer.slice(x,v)}l==="quaternion"&&new ce().fromArray(m).normalize().conjugate().toArray(m);let g=c.times.length;for(let _=0;_<g;++_){let x=_*d+f;if(l==="quaternion")ce.multiplyQuaternionsFlat(c.values,x,m,0,c.values,x);else{let v=d-f*2;for(let b=0;b<v;++b)c.values[x+b]-=m[b]}}}return a.blendMode=Po,a}var Gl=class{static convertArray(e,t){return Nt(e,t)}static isTypedArray(e){return Ta(e)}static hasTangents(e){return Zr(e)}static getKeyframeOrder(e){return fu(e)}static sortedArray(e,t,i){return Hl(e,t,i)}static flattenJSON(e,t,i,r){du(e,t,i,r)}static subclip(e,t,i,r,n=30){return My(e,t,i,r,n)}static makeClipAdditive(e,t=0,i=e,r=30){return wy(e,t,i,r)}};var nt=class{constructor(e,t,i,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r!==void 0?r:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,i=this._cachedIndex,r=t[i],n=t[i-1];e:{t:{let s;i:{r:if(!(e<r)){for(let o=i+2;;){if(r===void 0){if(e<n)break r;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===o)break;if(n=r,r=t[++i],e<r)break t}s=t.length;break i}if(!(e>=n)){let o=t[1];e<o&&(i=2,n=o);for(let l=i-2;;){if(n===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(r=n,n=t[--i-1],e>=n)break t}s=i,i=0;break i}break e}for(;i<s;){let o=i+s>>>1;e<t[o]?s=o:i=o+1}if(r=t[i],n=t[i-1],n===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,n,r)}return this.interpolate_(i,n,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,r=this.valueSize,n=e*r;for(let s=0;s!==r;++s)t[s]=i[n+s];return t}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}};var Fs=class extends nt{constructor(e,t,i,r){super(e,t,i,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Ai,endingEnd:Ai}}intervalChanged_(e,t,i){let r=this.parameterPositions,n=e-2,s=e+1,o=r[n],l=r[s];if(o===void 0)switch(this.getSettings_().endingStart){case Ti:n=e,o=2*t-i;break;case Er:n=r.length-2,o=t+r[n]-r[n+1];break;default:n=e,o=i}if(l===void 0)switch(this.getSettings_().endingEnd){case Ti:s=e,l=2*i-t;break;case Er:s=1,l=i+r[1]-r[0];break;default:s=e-1,l=t}let c=(i-t)*.5,h=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(l-i),this._offsetPrev=n*h,this._offsetNext=s*h}interpolate_(e,t,i,r){let n=this.resultBuffer,s=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=this._offsetPrev,u=this._offsetNext,f=this._weightPrev,d=this._weightNext,p=(i-t)/(r-t),m=p*p,g=m*p,_=-f*g+2*f*m-f*p,x=(1+f)*g+(-1.5-2*f)*m+(-.5+f)*p+1,v=(-1-d)*g+(1.5+d)*m+.5*p,b=d*g-d*m;for(let M=0;M!==o;++M)n[M]=_*s[h+M]+x*s[c+M]+v*s[l+M]+b*s[u+M];return n}};var sr=class extends nt{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e,t,i,r){let n=this.resultBuffer,s=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=(i-t)/(r-t),u=1-h;for(let f=0;f!==o;++f)n[f]=s[c+f]*u+s[l+f]*h;return n}};var Us=class extends nt{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e){return this.copySampleValue_(e-1)}};var zs=class extends nt{interpolate_(e,t,i,r){let n=this.resultBuffer,s=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=this.inTangents,u=this.outTangents;if(!h||!u){let p=(i-t)/(r-t),m=1-p;for(let g=0;g!==o;++g)n[g]=s[c+g]*m+s[l+g]*p;return n}let f=o*2,d=e-1;for(let p=0;p!==o;++p){let m=s[c+p],g=s[l+p],_=d*f+p*2,x=u[_],v=u[_+1],b=e*f+p*2,M=h[b],S=h[b+1],A=Ty(i,t,x,M,r);n[p]=wd(A,m,v,S,g)}return n}};function wd(a,e,t,i,r){let n=1-a;return n*n*n*e+3*n*n*a*t+3*n*a*a*i+a*a*a*r}function Ay(a,e,t,i,r){let n=1-a;return 3*n*n*(t-e)+6*n*a*(i-t)+3*a*a*(r-i)}function Ty(a,e,t,i,r){let n=(a-e)/(r-e);for(let s=0;s<8;s++){let o=wd(n,e,t,i,r)-a;if(Math.abs(o)<1e-10)break;let l=Ay(n,e,t,i,r);if(Math.abs(l)<1e-10)break;n=Math.max(0,Math.min(1,n-o/l))}return n}var Re=class{constructor(e,t,i,r){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Nt(t,this.TimeBufferType),this.values=Nt(i,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:Nt(e.times,Array),values:Nt(e.values,Array)};let r=e.getInterpolation();r!==e.DefaultInterpolation&&(i.interpolation=r),Zr(e.settings)&&(i.settings={inTangents:Nt(e.settings.inTangents,Array),outTangents:Nt(e.settings.outTangents,Array)})}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new Us(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new sr(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Fs(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new zs(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case ai:t=this.InterpolantFactoryMethodDiscrete;break;case Vi:t=this.InterpolantFactoryMethodLinear;break;case Ro:t=this.InterpolantFactoryMethodSmooth;break;case wa:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return B("KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return ai;case this.InterpolantFactoryMethodLinear:return Vi;case this.InterpolantFactoryMethodSmooth:return Ro;case this.InterpolantFactoryMethodBezier:return wa}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let i=0,r=t.length;i!==r;++i)t[i]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let i=0,r=t.length;i!==r;++i)t[i]*=e;Zr(this.settings)&&(Ad(this.settings.inTangents,e),Ad(this.settings.outTangents,e))}return this}trim(e,t){let i=this.times,r=i.length,n=0,s=r-1;for(;n!==r&&i[n]<e;)++n;for(;s!==-1&&i[s]>t;)--s;if(++s,n!==0||s!==r){n>=s&&(s=Math.max(s,1),n=s-1);let o=this.getValueSize();this.times=i.slice(n,s),this.values=this.values.slice(n*o,s*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(Z("KeyframeTrack: Invalid value size in track.",this),e=!1);let i=this.times,r=this.values,n=i.length;n===0&&(Z("KeyframeTrack: Track is empty.",this),e=!1);let s=null;for(let o=0;o!==n;o++){let l=i[o];if(typeof l=="number"&&isNaN(l)){Z("KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(s!==null&&s>l){Z("KeyframeTrack: Out of order keys.",this,o,l,s),e=!1;break}s=l}if(r!==void 0&&Ta(r))for(let o=0,l=r.length;o!==l;++o){let c=r[o];if(isNaN(c)){Z("KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),r=this.getInterpolation()===Ro,n=e.length-1,s=1;for(let o=1;o<n;++o){let l=!1,c=e[o],h=e[o+1];if(c!==h&&(o!==1||c!==e[0]))if(r)l=!0;else{let u=o*i,f=u-i,d=u+i;for(let p=0;p!==i;++p){let m=t[u+p];if(m!==t[f+p]||m!==t[d+p]){l=!0;break}}}if(l){if(o!==s){e[s]=e[o];let u=o*i,f=s*i;for(let d=0;d!==i;++d)t[f+d]=t[u+d]}++s}}if(n>0){e[s]=e[n];for(let o=n*i,l=s*i,c=0;c!==i;++c)t[l+c]=t[o+c];++s}return s!==e.length?(this.times=e.slice(0,s),this.values=t.slice(0,s*i)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),i=this.constructor,r=new i(this.name,e,t);return r.createInterpolant=this.createInterpolant,Zr(this.settings)&&(r.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),r}};function Ad(a,e){for(let t=0,i=a.length;t!==i;t+=2)a[t]*=e}Re.prototype.ValueTypeName="";Re.prototype.TimeBufferType=Float32Array;Re.prototype.ValueBufferType=Float32Array;Re.prototype.DefaultInterpolation=Vi;var ti=class extends Re{constructor(e,t,i){super(e,t,i)}};ti.prototype.ValueTypeName="bool";ti.prototype.ValueBufferType=Array;ti.prototype.DefaultInterpolation=ai;ti.prototype.InterpolantFactoryMethodLinear=void 0;ti.prototype.InterpolantFactoryMethodSmooth=void 0;var Jr=class extends Re{constructor(e,t,i,r){super(e,t,i,r)}};Jr.prototype.ValueTypeName="color";var ii=class extends Re{constructor(e,t,i,r){super(e,t,i,r)}};ii.prototype.ValueTypeName="number";var ks=class extends nt{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e,t,i,r){let n=this.resultBuffer,s=this.sampleValues,o=this.valueSize,l=(i-t)/(r-t),c=e*o;for(let h=c+o;c!==h;c+=4)ce.slerpFlat(n,0,s,c-o,s,c,l);return n}};var Gt=class extends Re{constructor(e,t,i,r){super(e,t,i,r)}InterpolantFactoryMethodLinear(e){return new ks(this.times,this.values,this.getValueSize(),e)}};Gt.prototype.ValueTypeName="quaternion";Gt.prototype.InterpolantFactoryMethodSmooth=void 0;var ri=class extends Re{constructor(e,t,i){super(e,t,i)}};ri.prototype.ValueTypeName="string";ri.prototype.ValueBufferType=Array;ri.prototype.DefaultInterpolation=ai;ri.prototype.InterpolantFactoryMethodLinear=void 0;ri.prototype.InterpolantFactoryMethodSmooth=void 0;var ni=class extends Re{constructor(e,t,i,r){super(e,t,i,r)}};ni.prototype.ValueTypeName="vector";var yt=class{constructor(e="",t=-1,i=[],r=Ir){this.name=e,this.tracks=i,this.duration=t,this.blendMode=r,this.uuid=Te(),this.userData={},this.duration<0&&this.resetDuration()}static parse(e){let t=[],i=e.tracks,r=1/(e.fps||1);for(let s=0,o=i.length;s!==o;++s)t.push(Ey(i[s]).scale(r));let n=new this(e.name,e.duration,t,e.blendMode);return n.uuid=e.uuid,n.userData=JSON.parse(e.userData||"{}"),n}static toJSON(e){let t=[],i=e.tracks,r={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode,userData:JSON.stringify(e.userData)};for(let n=0,s=i.length;n!==s;++n)t.push(Re.toJSON(i[n]));return r}static CreateFromMorphTargetSequence(e,t,i,r){let n=t.length,s=[];for(let o=0;o<n;o++){let l=[],c=[];l.push((o+n-1)%n,o,(o+1)%n),c.push(0,1,0);let h=fu(l);l=Hl(l,1,h),c=Hl(c,1,h),!r&&l[0]===0&&(l.push(n),c.push(c[0])),s.push(new ii(".morphTargetInfluences["+t[o].name+"]",l,c).scale(1/i))}return new this(e,-1,s)}static findByName(e,t){let i=e;if(!Array.isArray(e)){let r=e;i=r.geometry&&r.geometry.animations||r.animations}for(let r=0;r<i.length;r++)if(i[r].name===t)return i[r];return null}static CreateClipsFromMorphTargetSequences(e,t,i){let r={},n=/^([\w-]*?)([\d]+)$/;for(let o=0,l=e.length;o<l;o++){let c=e[o],h=c.name.match(n);if(h&&h.length>1){let u=h[1],f=r[u];f||(r[u]=f=[]),f.push(c)}}let s=[];for(let o in r)s.push(this.CreateFromMorphTargetSequence(o,r[o],t,i));return s}resetDuration(){let e=this.tracks,t=0;for(let i=0,r=e.length;i!==r;++i){let n=this.tracks[i];t=Math.max(t,n.times[n.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){let e=[];for(let i=0;i<this.tracks.length;i++)e.push(this.tracks[i].clone());let t=new this.constructor(this.name,this.duration,e,this.blendMode);return t.userData=JSON.parse(JSON.stringify(this.userData)),t}toJSON(){return this.constructor.toJSON(this)}};function Cy(a){switch(a.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return ii;case"vector":case"vector2":case"vector3":case"vector4":return ni;case"color":return Jr;case"quaternion":return Gt;case"bool":case"boolean":return ti;case"string":return ri}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+a)}function Ey(a){if(a.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");let e=Cy(a.type);if(a.times===void 0){let i=[],r=[];du(a.keys,i,r,"value"),a.times=i,a.values=r}let t;return e.parse!==void 0?t=e.parse(a):t=new e(a.name,a.times,a.values,a.interpolation),Zr(a.settings)&&(t.settings={inTangents:Nt(a.settings.inTangents,Float32Array),outTangents:Nt(a.settings.outTangents,Float32Array)}),t}var Je={enabled:!1,files:{},add:function(a,e){this.enabled!==!1&&(Td(a)||(this.files[a]=e))},get:function(a){if(this.enabled!==!1&&!Td(a))return this.files[a]},remove:function(a){delete this.files[a]},clear:function(){this.files={}}};function Td(a){try{let e=a.slice(a.indexOf(":")+1);return new URL(e).protocol==="blob:"}catch{return!1}}var jr=class{constructor(e,t,i){let r=this,n=!1,s=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this._abortController=null,this.itemStart=function(h){o++,n===!1&&r.onStart!==void 0&&r.onStart(h,s,o),n=!0},this.itemEnd=function(h){s++,r.onProgress!==void 0&&r.onProgress(h,s,o),s===o&&(n=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(h){r.onError!==void 0&&r.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){let u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,f=c.length;u<f;u+=2){let d=c[u],p=c[u+1];if(d.global&&(d.lastIndex=0),d.test(h))return p}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},Wl=new jr;var le=class{constructor(e){this.manager=e!==void 0?e:Wl,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let i=this;return new Promise(function(r,n){i.load(e,r,t,n)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};le.DEFAULT_MATERIAL_NAME="__DEFAULT";var Di={},pu=class extends Error{constructor(e,t){super(e),this.response=t}},We=class extends le{constructor(e){super(e),this.mimeType="",this.responseType="",this._abortController=new AbortController}load(e,t,i,r){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let n=Je.get(`file:${e}`);if(n!==void 0){this.manager.itemStart(e),setTimeout(()=>{t&&t(n),this.manager.itemEnd(e)},0);return}if(Di[e]!==void 0){Di[e].push({onLoad:t,onProgress:i,onError:r});return}Di[e]=[],Di[e].push({onLoad:t,onProgress:i,onError:r});let s=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",signal:typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),o=this.mimeType,l=this.responseType;fetch(s).then(c=>{if(c.status===200||c.status===0){if(c.status===0&&B("FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||c.body===void 0||c.body.getReader===void 0)return c;let h=Di[e],u=c.body.getReader(),f=c.headers.get("X-File-Size")||c.headers.get("Content-Length"),d=f?parseInt(f):0,p=d!==0,m=0,g=new ReadableStream({start(_){x();function x(){u.read().then(({done:v,value:b})=>{if(v)_.close();else{m+=b.byteLength;let M=new ProgressEvent("progress",{lengthComputable:p,loaded:m,total:d});for(let S=0,A=h.length;S<A;S++){let w=h[S];w.onProgress&&w.onProgress(M)}_.enqueue(b),x()}},v=>{_.error(v)})}}});return new Response(g)}else throw new pu(`fetch for "${c.url}" responded with ${c.status}: ${c.statusText}`,c)}).then(c=>{switch(l){case"arraybuffer":return c.arrayBuffer();case"blob":return c.blob();case"document":return c.text().then(h=>new DOMParser().parseFromString(h,o));case"json":return c.json();default:if(o==="")return c.text();{let u=/charset="?([^;"\s]*)"?/i.exec(o),f=u&&u[1]?u[1].toLowerCase():void 0,d=new TextDecoder(f);return c.arrayBuffer().then(p=>d.decode(p))}}}).then(c=>{Je.add(`file:${e}`,c);let h=Di[e];delete Di[e];for(let u=0,f=h.length;u<f;u++){let d=h[u];d.onLoad&&d.onLoad(c)}}).catch(c=>{let h=Di[e];if(h===void 0)throw this.manager.itemError(e),c;delete Di[e];for(let u=0,f=h.length;u<f;u++){let d=h[u];d.onError&&d.onError(c)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}};var ql=class extends le{constructor(e){super(e)}load(e,t,i,r){let n=this,s=new We(this.manager);s.setPath(this.path),s.setRequestHeader(this.requestHeader),s.setWithCredentials(this.withCredentials),s.load(e,function(o){try{t(n.parse(JSON.parse(o)))}catch(l){r?r(l):Z(l),n.manager.itemError(e)}},i,r)}parse(e){let t=[];for(let i=0;i<e.length;i++){let r=yt.parse(e[i]);t.push(r)}return t}};var Xl=class extends le{constructor(e){super(e)}load(e,t,i,r){let n=this,s=[],o=new ui,l=new We(this.manager);l.setPath(this.path),l.setResponseType("arraybuffer"),l.setRequestHeader(this.requestHeader),l.setWithCredentials(n.withCredentials);let c=0;function h(u){l.load(e[u],function(f){let d=n.parse(f,!0);s[u]={width:d.width,height:d.height,format:d.format,mipmaps:d.mipmaps},c+=1,c===6&&(d.mipmapCount===1&&(o.minFilter=de),o.image=s,o.format=d.format,o.needsUpdate=!0,t&&t(o))},i,r)}if(Array.isArray(e))for(let u=0,f=e.length;u<f;++u)h(u);else l.load(e,function(u){let f=n.parse(u,!0);if(f.isCubemap){let d=f.mipmaps.length/f.mipmapCount;for(let p=0;p<d;p++){s[p]={mipmaps:[]};for(let m=0;m<f.mipmapCount;m++)s[p].mipmaps.push(f.mipmaps[p*f.mipmapCount+m]),s[p].format=f.format,s[p].width=f.width,s[p].height=f.height}o.image=s}else o.image.width=f.width,o.image.height=f.height,o.mipmaps=f.mipmaps;f.mipmapCount===1&&(o.minFilter=de),o.format=f.format,o.needsUpdate=!0,t&&t(o)},i,r);return o}};var Vs=new WeakMap,Bi=class extends le{constructor(e){super(e)}load(e,t,i,r){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let n=this,s=Je.get(`image:${e}`);if(s!==void 0){if(s.complete===!0)n.manager.itemStart(e),setTimeout(function(){t&&t(s),n.manager.itemEnd(e)},0);else{let u=Vs.get(s);u===void 0&&(u=[],Vs.set(s,u)),u.push({onLoad:t,onError:r})}return s}let o=qn("img");function l(){h(),t&&t(this);let u=Vs.get(this)||[];for(let f=0;f<u.length;f++){let d=u[f];d.onLoad&&d.onLoad(this)}Vs.delete(this),n.manager.itemEnd(e)}function c(u){h(),r&&r(u),Je.remove(`image:${e}`);let f=Vs.get(this)||[];for(let d=0;d<f.length;d++){let p=f[d];p.onError&&p.onError(u)}Vs.delete(this),n.manager.itemError(e),n.manager.itemEnd(e)}function h(){o.removeEventListener("load",l,!1),o.removeEventListener("error",c,!1)}return o.addEventListener("load",l,!1),o.addEventListener("error",c,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),Je.add(`image:${e}`,o),n.manager.itemStart(e),o.src=e,o}};var Yl=class extends le{constructor(e){super(e)}load(e,t,i,r){let n=new fi;n.colorSpace=me;let s=new Bi(this.manager);s.setCrossOrigin(this.crossOrigin),s.setPath(this.path);let o=0;function l(c){s.load(e[c],function(h){n.images[c]=h,o++,o===6&&(n.needsUpdate=!0,t&&t(n))},void 0,r)}for(let c=0;c<e.length;++c)l(c);return n}};var Zl=class extends le{constructor(e){super(e)}load(e,t,i,r){let n=this,s=new ze,o=new We(this.manager);return o.setResponseType("arraybuffer"),o.setRequestHeader(this.requestHeader),o.setPath(this.path),o.setWithCredentials(n.withCredentials),o.load(e,function(l){let c;try{c=n.parse(l)}catch(h){r!==void 0?r(h):Z(h);return}n._applyTexData(s,c),t&&t(s,c)},i,r),s}createDataTexture(e){let t=new ze;return this._applyTexData(t,this.parse(e)),t}_applyTexData(e,t){t.image!==void 0?e.image=t.image:t.data!==void 0&&(e.image.width=t.width,e.image.height=t.height,e.image.data=t.data),e.wrapS=t.wrapS!==void 0?t.wrapS:Ue,e.wrapT=t.wrapT!==void 0?t.wrapT:Ue,e.magFilter=t.magFilter!==void 0?t.magFilter:de,e.minFilter=t.minFilter!==void 0?t.minFilter:de,e.anisotropy=t.anisotropy!==void 0?t.anisotropy:1,t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.mipmaps!==void 0&&(e.mipmaps=t.mipmaps,e.minFilter=Ot),t.mipmapCount===1&&(e.minFilter=de),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),e.needsUpdate=!0}};var qe=class extends G{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new I(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}};var Gs=class extends qe{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(G.DEFAULT_UP),this.updateMatrix(),this.groundColor=new I(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}};var mu=new F,Cd=new y,Ed=new y,pi=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new T(512,512),this.mapType=Zt,this.map=null,this.mapPass=null,this.matrix=new F,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Lt,this._frameExtents=new T(1,1),this._viewportCount=1,this._viewports=[new Ne(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;Cd.setFromMatrixPosition(e.matrixWorld),t.position.copy(Cd),Ed.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Ed),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,i,r){mu.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),i.setFromProjectionMatrix(mu,e.coordinateSystem,e.reversedDepth);let n=this._frameExtents,s=r?r.z/n.x:1,o=r?r.w/n.y:1,l=r?r.x/n.x:0,c=r?r.y/n.y:0;e.coordinateSystem===Ft||e.reversedDepth?t.set(.5*s,0,0,.5*s+l,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):t.set(.5*s,0,0,.5*s+l,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),t.multiply(mu)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}};var Jl=new y,jl=new ce,mi=new y,gi=class extends G{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new F,this.projectionMatrix=new F,this.projectionMatrixInverse=new F,this.coordinateSystem=Xe,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Jl,jl,mi),mi.x===1&&mi.y===1&&mi.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Jl,jl,mi.set(1,1,1)).invert()}updateWorldMatrix(e,t,i=!1){super.updateWorldMatrix(e,t,i),this.matrixWorld.decompose(Jl,jl,mi),mi.x===1&&mi.y===1&&mi.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Jl,jl,mi.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}};var or=new y,Id=new T,Rd=new T,ge=class extends gi{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Lr*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(li*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Lr*2*Math.atan(Math.tan(li*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){or.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(or.x,or.y).multiplyScalar(-e/or.z),or.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(or.x,or.y).multiplyScalar(-e/or.z)}getViewSize(e,t){return this.getViewBounds(e,Id,Rd),t.subVectors(Rd,Id)}setViewOffset(e,t,i,r,n,s){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=n,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(li*.5*this.fov)/this.zoom,i=2*t,r=this.aspect*i,n=-.5*r,s=this.view;if(this.view!==null&&this.view.enabled){let l=s.fullWidth,c=s.fullHeight;n+=s.offsetX*r/l,t-=s.offsetY*i/c,r*=s.width/l,i*=s.height/c}let o=this.filmOffset;o!==0&&(n+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(n,n+r,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}};var Kl=class extends pi{constructor(){super(new ge(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(e){let t=this.camera,i=Lr*2*e.angle*this.focus,r=this.mapSize.width/this.mapSize.height*this.aspect,n=e.distance||t.far;(i!==t.fov||r!==t.aspect||n!==t.far)&&(t.fov=i,t.aspect=r,t.far=n,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this.aspect=e.aspect,this}toJSON(){let e=super.toJSON();return e.focus=this.focus,e.aspect=this.aspect,e}};var ar=class extends qe{constructor(e,t,i=0,r=Math.PI/3,n=0,s=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(G.DEFAULT_UP),this.updateMatrix(),this.target=new G,this.distance=i,this.angle=r,this.penumbra=n,this.decay=s,this.map=null,this.shadow=new Kl}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.map=e.map,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.angle=this.angle,t.object.decay=this.decay,t.object.penumbra=this.penumbra,t.object.target=this.target.uuid,this.map&&this.map.isTexture&&(t.object.map=this.map.toJSON(e).uuid),t.object.shadow=this.shadow.toJSON(),t}};var $l=class extends pi{constructor(){super(new ge(90,1,.5,500)),this.isPointLightShadow=!0}};var lr=class extends qe{constructor(e,t,i=0,r=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=r,this.shadow=new $l}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}};var Ht=class extends gi{constructor(e=-1,t=1,i=1,r=-1,n=.1,s=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=n,this.far=s,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,n,s){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=n,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2,n=i-e,s=i+e,o=r+t,l=r-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;n+=c*this.view.offsetX,s=n+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(n,s,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}};var Ql=class extends pi{constructor(){super(new Ht(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}};var cr=class extends qe{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(G.DEFAULT_UP),this.updateMatrix(),this.target=new G,this.shadow=new Ql}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}};var Hs=class extends qe{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}};var Ws=class extends qe{constructor(e,t,i=10,r=10){super(e,t),this.isRectAreaLight=!0,this.type="RectAreaLight",this.width=i,this.height=r}get power(){return this.intensity*this.width*this.height*Math.PI}set power(e){this.intensity=e/(this.width*this.height*Math.PI)}copy(e){return super.copy(e),this.width=e.width,this.height=e.height,this}toJSON(e){let t=super.toJSON(e);return t.object.width=this.width,t.object.height=this.height,t}};var hr=class{constructor(){this.isSphericalHarmonics3=!0,this.coefficients=[];for(let e=0;e<9;e++)this.coefficients.push(new y)}set(e){for(let t=0;t<9;t++)this.coefficients[t].copy(e[t]);return this}zero(){for(let e=0;e<9;e++)this.coefficients[e].set(0,0,0);return this}getAt(e,t){let i=e.x,r=e.y,n=e.z,s=this.coefficients;return t.copy(s[0]).multiplyScalar(.282095),t.addScaledVector(s[1],.488603*r),t.addScaledVector(s[2],.488603*n),t.addScaledVector(s[3],.488603*i),t.addScaledVector(s[4],1.092548*(i*r)),t.addScaledVector(s[5],1.092548*(r*n)),t.addScaledVector(s[6],.315392*(3*n*n-1)),t.addScaledVector(s[7],1.092548*(i*n)),t.addScaledVector(s[8],.546274*(i*i-r*r)),t}getIrradianceAt(e,t){let i=e.x,r=e.y,n=e.z,s=this.coefficients;return t.copy(s[0]).multiplyScalar(.886227),t.addScaledVector(s[1],2*.511664*r),t.addScaledVector(s[2],2*.511664*n),t.addScaledVector(s[3],2*.511664*i),t.addScaledVector(s[4],2*.429043*i*r),t.addScaledVector(s[5],2*.429043*r*n),t.addScaledVector(s[6],.743125*n*n-.247708),t.addScaledVector(s[7],2*.429043*i*n),t.addScaledVector(s[8],.429043*(i*i-r*r)),t}add(e){for(let t=0;t<9;t++)this.coefficients[t].add(e.coefficients[t]);return this}addScaledSH(e,t){for(let i=0;i<9;i++)this.coefficients[i].addScaledVector(e.coefficients[i],t);return this}scale(e){for(let t=0;t<9;t++)this.coefficients[t].multiplyScalar(e);return this}lerp(e,t){for(let i=0;i<9;i++)this.coefficients[i].lerp(e.coefficients[i],t);return this}equals(e){for(let t=0;t<9;t++)if(!this.coefficients[t].equals(e.coefficients[t]))return!1;return!0}copy(e){return this.set(e.coefficients)}clone(){return new this.constructor().copy(this)}fromArray(e,t=0){let i=this.coefficients;for(let r=0;r<9;r++)i[r].fromArray(e,t+r*3);return this}toArray(e=[],t=0){let i=this.coefficients;for(let r=0;r<9;r++)i[r].toArray(e,t+r*3);return e}static getBasisAt(e,t){let i=e.x,r=e.y,n=e.z;t[0]=.282095,t[1]=.488603*r,t[2]=.488603*n,t[3]=.488603*i,t[4]=1.092548*i*r,t[5]=1.092548*r*n,t[6]=.315392*(3*n*n-1),t[7]=1.092548*i*n,t[8]=.546274*(i*i-r*r)}};var qs=class extends qe{constructor(e=new hr,t=1){super(void 0,t),this.isLightProbe=!0,this.sh=e}copy(e){return super.copy(e),this.sh.copy(e.sh),this}toJSON(e){let t=super.toJSON(e);return t.object.sh=this.sh.toArray(),t}};var Pd={},Xs=class a extends le{constructor(e){super(e),this.textures={}}load(e,t,i,r){let n=this,s=new We(n.manager);s.setPath(n.path),s.setRequestHeader(n.requestHeader),s.setWithCredentials(n.withCredentials),s.load(e,function(o){try{t(n.parse(JSON.parse(o)))}catch(l){r?r(l):Z(l),n.manager.itemError(e)}},i,r)}parse(e){let t=this.createMaterialFromType(e.type);return t.fromJSON(e,this.textures),t}setTextures(e){return this.textures=e,this}createMaterialFromType(e){return a.createMaterialFromType(e)}static createMaterialFromType(e){let i={ShadowMaterial:Ts,SpriteMaterial:Ki,RawShaderMaterial:Es,ShaderMaterial:dt,PointsMaterial:hi,MeshPhysicalMaterial:Ze,MeshStandardMaterial:ei,MeshPhongMaterial:Is,MeshToonMaterial:Rs,MeshNormalMaterial:Ps,MeshLambertMaterial:Ls,MeshDepthMaterial:Ns,MeshDistanceMaterial:Ds,MeshBasicMaterial:Se,MeshMatcapMaterial:Bs,LineDashedMaterial:Os,LineBasicMaterial:re,Material:$,...Pd}[e],r;return i===void 0?(Tt(`MaterialLoader: Unknown material type "${e}". Use .registerMaterial() before starting the deserialization process.`),r=new $):r=new i,r}static registerMaterial(e,t){Pd[e]=t}};var Dt=class{static extractUrlBase(e){let t=e.lastIndexOf("/");return t===-1?"./":e.slice(0,t+1)}static resolveURL(e,t){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}};var Ys=class extends P{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(e){return super.copy(e),this.instanceCount=e.instanceCount,this}toJSON(){let e=super.toJSON();return e.instanceCount=this.instanceCount,e.isInstancedBufferGeometry=!0,e}};var Zs=class extends le{constructor(e){super(e)}load(e,t,i,r){let n=this,s=new We(n.manager);s.setPath(n.path),s.setRequestHeader(n.requestHeader),s.setWithCredentials(n.withCredentials),s.load(e,function(o){try{t(n.parse(JSON.parse(o)))}catch(l){r?r(l):Z(l),n.manager.itemError(e)}},i,r)}parse(e){let t={},i={};function r(d,p){if(t[p]!==void 0)return t[p];let g=d.interleavedBuffers[p],_=n(d,g.buffer),x=Hi(g.type,_),v=new It(x,g.stride);return v.uuid=g.uuid,g.usage!==void 0&&v.setUsage(g.usage),t[p]=v,v}function n(d,p){if(i[p]!==void 0)return i[p];let g=d.arrayBuffers[p],_=new Uint32Array(g).buffer;return i[p]=_,_}let s=e.isInstancedBufferGeometry?new Ys:new P,o=e.data.index;if(o!==void 0){let d=Hi(o.type,o.array);s.setIndex(new j(d,1))}let l=e.data.attributes;for(let d in l){let p=l[d],m;if(p.isInterleavedBufferAttribute){let g=r(e.data,p.data);m=new Rt(g,p.itemSize,p.offset,p.normalized)}else{let g=Hi(p.type,p.array),_=p.isInstancedBufferAttribute?tt:j;m=new _(g,p.itemSize,p.normalized)}p.name!==void 0&&(m.name=p.name),p.usage!==void 0&&m.setUsage(p.usage),p.gpuType!==void 0&&(m.gpuType=p.gpuType),s.setAttribute(d,m)}let c=e.data.morphAttributes;if(c)for(let d in c){let p=c[d],m=[];for(let g=0,_=p.length;g<_;g++){let x=p[g],v;if(x.isInterleavedBufferAttribute){let b=r(e.data,x.data);v=new Rt(b,x.itemSize,x.offset,x.normalized)}else{let b=Hi(x.type,x.array);v=new j(b,x.itemSize,x.normalized)}x.name!==void 0&&(v.name=x.name),x.usage!==void 0&&v.setUsage(x.usage),x.gpuType!==void 0&&(v.gpuType=x.gpuType),m.push(v)}s.morphAttributes[d]=m}e.data.morphTargetsRelative&&(s.morphTargetsRelative=!0);let u=e.data.groups||e.data.drawcalls||e.data.offsets;if(u!==void 0)for(let d=0,p=u.length;d!==p;++d){let m=u[d];s.addGroup(m.start,m.count,m.materialIndex)}let f=e.data.boundingSphere;return f!==void 0&&(s.boundingSphere=new oe().fromJSON(f)),e.name&&(s.name=e.name),e.userData&&(s.userData=e.userData),s}};var gu={},ec=class extends le{constructor(e){super(e)}load(e,t,i,r){let n=this,s=this.path===""?Dt.extractUrlBase(e):this.path;this.resourcePath=this.resourcePath||s;let o=new We(this.manager);o.setPath(this.path),o.setRequestHeader(this.requestHeader),o.setWithCredentials(this.withCredentials),o.load(e,function(l){let c=null;try{c=JSON.parse(l)}catch(u){r!==void 0&&r(u),Z("ObjectLoader: Can't parse "+e+".",u.message);return}let h=c.metadata;if(h===void 0||h.type===void 0||h.type.toLowerCase()==="geometry"){r!==void 0&&r(new Error("THREE.ObjectLoader: Can't load "+e)),Z("ObjectLoader: Can't load "+e);return}n.parse(c,t)},i,r)}async loadAsync(e,t){let i=this,r=this.path===""?Dt.extractUrlBase(e):this.path;this.resourcePath=this.resourcePath||r;let n=new We(this.manager);n.setPath(this.path),n.setRequestHeader(this.requestHeader),n.setWithCredentials(this.withCredentials);let s=await n.loadAsync(e,t),o;try{o=JSON.parse(s)}catch(c){throw new Error("THREE.ObjectLoader: Can't parse "+e+". "+c.message)}let l=o.metadata;if(l===void 0||l.type===void 0||l.type.toLowerCase()==="geometry")throw new Error("THREE.ObjectLoader: Can't load "+e);return await i.parseAsync(o)}parse(e,t){let i=this.parseAnimations(e.animations),r=this.parseShapes(e.shapes),n=this.parseGeometries(e.geometries,r),s=this.parseImages(e.images,function(){t!==void 0&&t(c)}),o=this.parseTextures(e.textures,s),l=this.parseMaterials(e.materials,o),c=this.parseObject(e.object,n,l,o,i),h=this.parseSkeletons(e.skeletons,c);if(this.bindSkeletons(c,h),this.bindLightTargets(c),t!==void 0){let u=!1;for(let f in s)if(s[f].data instanceof HTMLImageElement){u=!0;break}u===!1&&t(c)}return c}async parseAsync(e){let t=this.parseAnimations(e.animations),i=this.parseShapes(e.shapes),r=this.parseGeometries(e.geometries,i),n=await this.parseImagesAsync(e.images),s=this.parseTextures(e.textures,n),o=this.parseMaterials(e.materials,s),l=this.parseObject(e.object,r,o,s,t),c=this.parseSkeletons(e.skeletons,l);return this.bindSkeletons(l,c),this.bindLightTargets(l),l}static registerGeometry(e,t){gu[e]=t}parseShapes(e){let t={};if(e!==void 0)for(let i=0,r=e.length;i<r;i++){let n=new Vt().fromJSON(e[i]);t[n.uuid]=n}return t}parseSkeletons(e,t){let i={},r={};if(t.traverse(function(n){n.isBone&&(r[n.uuid]=n)}),e!==void 0)for(let n=0,s=e.length;n<s;n++){let o=new Qi().fromJSON(e[n],r);i[o.uuid]=o}return i}parseGeometries(e,t){let i={};if(e!==void 0){let r=new Zs;for(let n=0,s=e.length;n<s;n++){let o,l=e[n];switch(l.type){case"BufferGeometry":case"InstancedBufferGeometry":o=r.parse(l);break;default:l.type in Vl?o=Vl[l.type].fromJSON(l,t):l.type in gu?o=gu[l.type].fromJSON(l,t):B(`ObjectLoader: Unknown geometry type "${l.type}". Use .registerGeometry() before starting the deserialization process.`)}o.uuid=l.uuid,l.name!==void 0&&(o.name=l.name),l.userData!==void 0&&(o.userData=l.userData),i[l.uuid]=o}}return i}parseMaterials(e,t){let i={},r={};if(e!==void 0){let n=new Xs;n.setTextures(t);for(let s=0,o=e.length;s<o;s++){let l=e[s];i[l.uuid]===void 0&&(i[l.uuid]=n.parse(l)),r[l.uuid]=i[l.uuid]}}return r}parseAnimations(e){let t={};if(e!==void 0)for(let i=0;i<e.length;i++){let r=e[i],n=yt.parse(r);t[n.uuid]=n}return t}parseImages(e,t){let i=this,r={},n;function s(l){return l=i.manager.resolveURL(l),i.manager.itemStart(l),n.load(l,function(){i.manager.itemEnd(l)},void 0,function(){i.manager.itemError(l),i.manager.itemEnd(l)})}function o(l){if(typeof l=="string"){let c=l,h=/^(\/\/)|([a-z]+:(\/\/)?)/i.test(c)?c:i.resourcePath+c;return s(h)}else return l.data?{data:Hi(l.type,l.data),width:l.width,height:l.height}:null}if(e!==void 0&&e.length>0){let l=new jr(t);n=new Bi(l),n.setCrossOrigin(this.crossOrigin);for(let c=0,h=e.length;c<h;c++){let u=e[c],f=u.url;if(Array.isArray(f)){let d=[];for(let p=0,m=f.length;p<m;p++){let g=f[p],_=o(g);_!==null&&(_ instanceof HTMLImageElement?d.push(_):d.push(new ze(_.data,_.width,_.height)))}r[u.uuid]=new Qe(d)}else{let d=o(u.url);r[u.uuid]=new Qe(d)}}}return r}async parseImagesAsync(e){let t=this,i={},r;async function n(s){if(typeof s=="string"){let o=s,l=/^(\/\/)|([a-z]+:(\/\/)?)/i.test(o)?o:t.resourcePath+o;return await r.loadAsync(l)}else return s.data?{data:Hi(s.type,s.data),width:s.width,height:s.height}:null}if(e!==void 0&&e.length>0){r=new Bi(this.manager),r.setCrossOrigin(this.crossOrigin);for(let s=0,o=e.length;s<o;s++){let l=e[s],c=l.url;if(Array.isArray(c)){let h=[];for(let u=0,f=c.length;u<f;u++){let d=c[u],p=await n(d);p!==null&&(p instanceof HTMLImageElement?h.push(p):h.push(new ze(p.data,p.width,p.height)))}i[l.uuid]=new Qe(h)}else{let h=await n(l.url);i[l.uuid]=new Qe(h)}}}return i}parseTextures(e,t){function i(n,s){return typeof n=="number"?n:(B("ObjectLoader.parseTexture: Constant should be in numeric form.",n),s[n])}let r={};if(e!==void 0)for(let n=0,s=e.length;n<s;n++){let o=e[n];o.image===void 0&&B('ObjectLoader: No "image" specified for',o.uuid),t[o.image]===void 0&&B("ObjectLoader: Undefined image",o.image);let l=t[o.image],c=l.data,h;Array.isArray(c)?(h=new fi,c.length===6&&(h.needsUpdate=!0)):(c&&c.data?h=new ze:h=new te,c&&(h.needsUpdate=!0)),h.source=l,h.uuid=o.uuid,o.name!==void 0&&(h.name=o.name),o.mapping!==void 0&&(h.mapping=i(o.mapping,Iy)),o.channel!==void 0&&(h.channel=o.channel),o.offset!==void 0&&h.offset.fromArray(o.offset),o.repeat!==void 0&&h.repeat.fromArray(o.repeat),o.center!==void 0&&h.center.fromArray(o.center),o.rotation!==void 0&&(h.rotation=o.rotation),o.wrap!==void 0&&(h.wrapS=i(o.wrap[0],Ld),h.wrapT=i(o.wrap[1],Ld)),o.format!==void 0&&(h.format=o.format),o.internalFormat!==void 0&&(h.internalFormat=o.internalFormat),o.type!==void 0&&(h.type=o.type),o.colorSpace!==void 0&&(h.colorSpace=o.colorSpace),o.minFilter!==void 0&&(h.minFilter=i(o.minFilter,Nd)),o.magFilter!==void 0&&(h.magFilter=i(o.magFilter,Nd)),o.anisotropy!==void 0&&(h.anisotropy=o.anisotropy),o.flipY!==void 0&&(h.flipY=o.flipY),o.generateMipmaps!==void 0&&(h.generateMipmaps=o.generateMipmaps),o.premultiplyAlpha!==void 0&&(h.premultiplyAlpha=o.premultiplyAlpha),o.unpackAlignment!==void 0&&(h.unpackAlignment=o.unpackAlignment),o.compareFunction!==void 0&&(h.compareFunction=o.compareFunction),o.normalized!==void 0&&(h.normalized=o.normalized),o.userData!==void 0&&(h.userData=o.userData),r[o.uuid]=h}return r}parseObject(e,t,i,r,n){let s;function o(f){return t[f]===void 0&&B("ObjectLoader: Undefined geometry",f),t[f]}function l(f){if(f!==void 0){if(Array.isArray(f)){let d=[];for(let p=0,m=f.length;p<m;p++){let g=f[p];i[g]===void 0&&B("ObjectLoader: Undefined material",g),d.push(i[g])}return d}return i[f]===void 0&&B("ObjectLoader: Undefined material",f),i[f]}}function c(f){return r[f]===void 0&&B("ObjectLoader: Undefined texture",f),r[f]}let h,u;switch(e.type){case"Scene":s=new ts,e.background!==void 0&&(Number.isInteger(e.background)?s.background=new I(e.background):s.background=c(e.background)),e.environment!==void 0&&(s.environment=c(e.environment)),e.fog!==void 0&&(e.fog.type==="Fog"?s.fog=new es(e.fog.color,e.fog.near,e.fog.far):e.fog.type==="FogExp2"&&(s.fog=new Qn(e.fog.color,e.fog.density)),e.fog.name!==""&&(s.fog.name=e.fog.name)),e.backgroundBlurriness!==void 0&&(s.backgroundBlurriness=e.backgroundBlurriness),e.backgroundIntensity!==void 0&&(s.backgroundIntensity=e.backgroundIntensity),e.backgroundRotation!==void 0&&s.backgroundRotation.fromArray(e.backgroundRotation),e.environmentIntensity!==void 0&&(s.environmentIntensity=e.environmentIntensity),e.environmentRotation!==void 0&&s.environmentRotation.fromArray(e.environmentRotation);break;case"PerspectiveCamera":s=new ge(e.fov,e.aspect,e.near,e.far),e.focus!==void 0&&(s.focus=e.focus),e.zoom!==void 0&&(s.zoom=e.zoom),e.filmGauge!==void 0&&(s.filmGauge=e.filmGauge),e.filmOffset!==void 0&&(s.filmOffset=e.filmOffset),e.view!==void 0&&(s.view=Object.assign({},e.view));break;case"OrthographicCamera":s=new Ht(e.left,e.right,e.top,e.bottom,e.near,e.far),e.zoom!==void 0&&(s.zoom=e.zoom),e.view!==void 0&&(s.view=Object.assign({},e.view));break;case"AmbientLight":s=new Hs(e.color,e.intensity);break;case"DirectionalLight":s=new cr(e.color,e.intensity),s.target=e.target||"";break;case"PointLight":s=new lr(e.color,e.intensity,e.distance,e.decay);break;case"RectAreaLight":s=new Ws(e.color,e.intensity,e.width,e.height);break;case"SpotLight":s=new ar(e.color,e.intensity,e.distance,e.angle,e.penumbra,e.decay),s.target=e.target||"";break;case"HemisphereLight":s=new Gs(e.color,e.groundColor,e.intensity);break;case"LightProbe":let f=new hr().fromArray(e.sh);s=new qs(f,e.intensity);break;case"SkinnedMesh":h=o(e.geometry),u=l(e.material),s=new $i(h,u),e.bindMode!==void 0&&(s.bindMode=e.bindMode),e.bindMatrix!==void 0&&s.bindMatrix.fromArray(e.bindMatrix),e.skeleton!==void 0&&(s.skeleton=e.skeleton);break;case"Mesh":h=o(e.geometry),u=l(e.material),s=new ae(h,u);break;case"InstancedMesh":h=o(e.geometry),u=l(e.material);let d=e.count,p=e.instanceMatrix,m=e.instanceColor;s=new er(h,u,d),s.instanceMatrix=new tt(new Float32Array(p.array),16),m!==void 0&&(s.instanceColor=new tt(new Float32Array(m.array),m.itemSize));break;case"BatchedMesh":h=o(e.geometry),u=l(e.material),s=new _s(e.maxInstanceCount,e.maxVertexCount,e.maxIndexCount,u),s.geometry=h,s.perObjectFrustumCulled=e.perObjectFrustumCulled,s.sortObjects=e.sortObjects,s._drawRanges=e.drawRanges,s._reservedRanges=e.reservedRanges,s._geometryInfo=e.geometryInfo.map(g=>{let _=null,x=null;return g.boundingBox!==void 0&&(_=new he().fromJSON(g.boundingBox)),g.boundingSphere!==void 0&&(x=new oe().fromJSON(g.boundingSphere)),{...g,boundingBox:_,boundingSphere:x}}),s._instanceInfo=e.instanceInfo,s._availableInstanceIds=e._availableInstanceIds,s._availableGeometryIds=e._availableGeometryIds,s._nextIndexStart=e.nextIndexStart,s._nextVertexStart=e.nextVertexStart,s._geometryCount=e.geometryCount,s._maxInstanceCount=e.maxInstanceCount,s._maxVertexCount=e.maxVertexCount,s._maxIndexCount=e.maxIndexCount,s._geometryInitialized=e.geometryInitialized,s._matricesTexture=c(e.matricesTexture.uuid),s._indirectTexture=c(e.indirectTexture.uuid),e.colorsTexture!==void 0&&(s._colorsTexture=c(e.colorsTexture.uuid)),e.boundingSphere!==void 0&&(s.boundingSphere=new oe().fromJSON(e.boundingSphere)),e.boundingBox!==void 0&&(s.boundingBox=new he().fromJSON(e.boundingBox));break;case"LOD":s=new ps;break;case"Line":s=new ke(o(e.geometry),l(e.material));break;case"LineLoop":s=new tr(o(e.geometry),l(e.material));break;case"LineSegments":s=new Me(o(e.geometry),l(e.material));break;case"PointCloud":case"Points":s=new ir(o(e.geometry),l(e.material));break;case"Sprite":s=new ds(l(e.material));break;case"Group":s=new ct;break;case"Bone":s=new ci;break;default:s=new G}if(s.uuid=e.uuid,e.name!==void 0&&(s.name=e.name),e.matrix!==void 0?(s.matrix.fromArray(e.matrix),e.matrixAutoUpdate!==void 0&&(s.matrixAutoUpdate=e.matrixAutoUpdate),s.matrixAutoUpdate&&s.matrix.decompose(s.position,s.quaternion,s.scale)):(e.position!==void 0&&s.position.fromArray(e.position),e.rotation!==void 0&&s.rotation.fromArray(e.rotation),e.quaternion!==void 0&&s.quaternion.fromArray(e.quaternion),e.scale!==void 0&&s.scale.fromArray(e.scale)),e.up!==void 0&&s.up.fromArray(e.up),e.pivot!==void 0&&(s.pivot=new y().fromArray(e.pivot)),e.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),e.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=e.morphTargetInfluences.slice()),e.castShadow!==void 0&&(s.castShadow=e.castShadow),e.receiveShadow!==void 0&&(s.receiveShadow=e.receiveShadow),e.shadow&&(e.shadow.intensity!==void 0&&(s.shadow.intensity=e.shadow.intensity),e.shadow.bias!==void 0&&(s.shadow.bias=e.shadow.bias),e.shadow.normalBias!==void 0&&(s.shadow.normalBias=e.shadow.normalBias),e.shadow.radius!==void 0&&(s.shadow.radius=e.shadow.radius),e.shadow.blurSamples!==void 0&&(s.shadow.blurSamples=e.shadow.blurSamples),e.shadow.focus!==void 0&&(s.shadow.focus=e.shadow.focus),e.shadow.aspect!==void 0&&(s.shadow.aspect=e.shadow.aspect),e.shadow.mapSize!==void 0&&s.shadow.mapSize.fromArray(e.shadow.mapSize),e.shadow.camera!==void 0&&(s.shadow.camera=this.parseObject(e.shadow.camera))),e.visible!==void 0&&(s.visible=e.visible),e.frustumCulled!==void 0&&(s.frustumCulled=e.frustumCulled),e.renderOrder!==void 0&&(s.renderOrder=e.renderOrder),e.static!==void 0&&(s.static=e.static),e.userData!==void 0&&(s.userData=e.userData),e.layers!==void 0&&(s.layers.mask=e.layers),e.children!==void 0){let f=e.children;for(let d=0;d<f.length;d++)s.add(this.parseObject(f[d],t,i,r,n))}if(e.animations!==void 0){let f=e.animations;for(let d=0;d<f.length;d++){let p=f[d];s.animations.push(n[p])}}if(e.type==="LOD"){e.autoUpdate!==void 0&&(s.autoUpdate=e.autoUpdate);let f=e.levels;for(let d=0;d<f.length;d++){let p=f[d],m=s.getObjectByProperty("uuid",p.object);m!==void 0&&s.addLevel(m,p.distance,p.hysteresis)}}return s}bindSkeletons(e,t){Object.keys(t).length!==0&&e.traverse(function(i){if(i.isSkinnedMesh===!0&&i.skeleton!==void 0){let r=t[i.skeleton];r===void 0?B("ObjectLoader: No skeleton found with UUID:",i.skeleton):i.bind(r,i.bindMatrix)}})}bindLightTargets(e){e.traverse(function(t){if(t.isDirectionalLight||t.isSpotLight){let i=t.target,r=e.getObjectByProperty("uuid",i);r!==void 0?t.target=r:t.target=new G}})}},Iy={UVMapping:zi,CubeReflectionMapping:Bt,CubeRefractionMapping:un,EquirectangularReflectionMapping:uh,EquirectangularRefractionMapping:fh,CubeUVReflectionMapping:po},Ld={RepeatWrapping:wt,ClampToEdgeWrapping:Ue,MirroredRepeatWrapping:Yt},Nd={NearestFilter:fe,NearestMipmapNearestFilter:yr,NearestMipmapLinearFilter:vr,LinearFilter:de,LinearMipmapNearestFilter:mo,LinearMipmapLinearFilter:Ot};var _u=new WeakMap,Js=class extends le{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&B("ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&B("ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"},this._abortController=new AbortController}setOptions(e){return this.options=e,this}load(e,t,i,r){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let n=this,s=Je.get(`image-bitmap:${e}`);if(s!==void 0){if(n.manager.itemStart(e),s.then){s.then(c=>{_u.has(s)===!0?(r&&r(_u.get(s)),n.manager.itemError(e),n.manager.itemEnd(e)):(t&&t(c),n.manager.itemEnd(e))});return}setTimeout(function(){t&&t(s),n.manager.itemEnd(e)},0);return}let o={};o.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",o.headers=this.requestHeader,o.signal=typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal;let l=fetch(e,o).then(function(c){return c.blob()}).then(function(c){return createImageBitmap(c,Object.assign({},n.options,{colorSpaceConversion:"none"}))}).then(function(c){return Je.add(`image-bitmap:${e}`,c),t&&t(c),n.manager.itemEnd(e),c}).catch(function(c){r&&r(c),_u.set(l,c),Je.remove(`image-bitmap:${e}`),n.manager.itemError(e),n.manager.itemEnd(e)});Je.add(`image-bitmap:${e}`,l),n.manager.itemStart(e)}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}};var tc,ur=class{static getContext(){return tc===void 0&&(tc=new(window.AudioContext||window.webkitAudioContext)),tc}static setContext(e){tc=e}};var ic=class extends le{constructor(e){super(e)}load(e,t,i,r){let n=this,s=new We(this.manager);s.setResponseType("arraybuffer"),s.setPath(this.path),s.setRequestHeader(this.requestHeader),s.setWithCredentials(this.withCredentials),s.load(e,function(l){try{let c=l.slice(0),h=ur.getContext(),u=e+"#decode";n.manager.itemStart(u),h.decodeAudioData(c,function(f){t(f),n.manager.itemEnd(u)}).catch(function(f){o(f),n.manager.itemEnd(u)})}catch(c){o(c)}},i,r);function o(l){r?r(l):Z(l),n.manager.itemError(e)}}};var Dd=new F,Bd=new F,Kr=new F,rc=class{constructor(){this.type="StereoCamera",this.aspect=1,this.eyeSep=.064,this.cameraL=new ge,this.cameraL.layers.enable(1),this.cameraL.matrixAutoUpdate=!1,this.cameraR=new ge,this.cameraR.layers.enable(2),this.cameraR.matrixAutoUpdate=!1,this._cache={focus:null,fov:null,aspect:null,near:null,far:null,zoom:null,eyeSep:null}}update(e){let t=this._cache;if(t.focus!==e.focus||t.fov!==e.fov||t.aspect!==e.aspect*this.aspect||t.near!==e.near||t.far!==e.far||t.zoom!==e.zoom||t.eyeSep!==this.eyeSep){t.focus=e.focus,t.fov=e.fov,t.aspect=e.aspect*this.aspect,t.near=e.near,t.far=e.far,t.zoom=e.zoom,t.eyeSep=this.eyeSep,Kr.copy(e.projectionMatrix);let r=t.eyeSep/2,n=r*t.near/t.focus,s=t.near*Math.tan(li*t.fov*.5)/t.zoom,o,l;Bd.elements[12]=-r,Dd.elements[12]=r,o=-s*t.aspect+n,l=s*t.aspect+n,Kr.elements[0]=2*t.near/(l-o),Kr.elements[8]=(l+o)/(l-o),this.cameraL.projectionMatrix.copy(Kr),o=-s*t.aspect-n,l=s*t.aspect-n,Kr.elements[0]=2*t.near/(l-o),Kr.elements[8]=(l+o)/(l-o),this.cameraR.projectionMatrix.copy(Kr)}this.cameraL.matrix.copy(e.matrixWorld).multiply(Bd),this.cameraL.matrixWorldNeedsUpdate=!0,this.cameraR.matrix.copy(e.matrixWorld).multiply(Dd),this.cameraR.matrixWorldNeedsUpdate=!0}};var js=-90,Ks=1,$s=class extends G{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new ge(js,Ks,e,t);r.layers=this.layers,this.add(r);let n=new ge(js,Ks,e,t);n.layers=this.layers,this.add(n);let s=new ge(js,Ks,e,t);s.layers=this.layers,this.add(s);let o=new ge(js,Ks,e,t);o.layers=this.layers,this.add(o);let l=new ge(js,Ks,e,t);l.layers=this.layers,this.add(l);let c=new ge(js,Ks,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,r,n,s,o,l]=t;for(let c of t)this.remove(c);if(e===Xe)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),n.up.set(0,0,-1),n.lookAt(0,1,0),s.up.set(0,0,1),s.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Ft)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),n.up.set(0,0,1),n.lookAt(0,1,0),s.up.set(0,0,-1),s.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[n,s,o,l,c,h]=this.children,u=e.getRenderTarget(),f=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let m=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let g=!1;e.isWebGLRenderer===!0?g=e.state.buffers.depth.getReversed():g=e.reversedDepthBuffer,e.setRenderTarget(i,0,r),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,n),e.setRenderTarget(i,1,r),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(i,2,r),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(i,3,r),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(i,4,r),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),i.texture.generateMipmaps=m,e.setRenderTarget(i,5,r),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),e.setRenderTarget(u,f,d),e.xr.enabled=p,i.texture.needsPMREMUpdate=!0}};var nc=class extends ge{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var Qs=class{constructor(){this._previousTime=0,this._currentTime=0,this._startTime=performance.now(),this._delta=0,this._elapsed=0,this._timescale=1,this._document=null,this._pageVisibilityHandler=null}connect(e){this._document=e,e.hidden!==void 0&&(this._pageVisibilityHandler=Ry.bind(this),e.addEventListener("visibilitychange",this._pageVisibilityHandler,!1))}disconnect(){this._pageVisibilityHandler!==null&&(this._document.removeEventListener("visibilitychange",this._pageVisibilityHandler),this._pageVisibilityHandler=null),this._document=null}getDelta(){return this._delta/1e3}getElapsed(){return this._elapsed/1e3}getTimescale(){return this._timescale}setTimescale(e){return this._timescale=e,this}reset(){return this._currentTime=performance.now()-this._startTime,this}dispose(){this.disconnect()}update(e){return this._pageVisibilityHandler!==null&&this._document.hidden===!0?this._delta=0:(this._previousTime=this._currentTime,this._currentTime=(e!==void 0?e:performance.now())-this._startTime,this._delta=(this._currentTime-this._previousTime)*this._timescale,this._elapsed+=this._delta),this}};function Ry(){this._document.hidden===!1&&this.reset()}var $r=new y,xu=new ce,Py=new y,Qr=new y,en=new y,sc=class extends G{constructor(){super(),this.type="AudioListener",this.context=ur.getContext(),this.gain=this.context.createGain(),this.gain.connect(this.context.destination),this.filter=null,this.timeDelta=0,this._timer=new Qs}getInput(){return this.gain}removeFilter(){return this.filter!==null&&(this.gain.disconnect(this.filter),this.filter.disconnect(this.context.destination),this.gain.connect(this.context.destination),this.filter=null),this}getFilter(){return this.filter}setFilter(e){return this.filter!==null?(this.gain.disconnect(this.filter),this.filter.disconnect(this.context.destination)):this.gain.disconnect(this.context.destination),this.filter=e,this.gain.connect(this.filter),this.filter.connect(this.context.destination),this}getMasterVolume(){return this.gain.gain.value}setMasterVolume(e){return this.gain.gain.setTargetAtTime(e,this.context.currentTime,.01),this}updateMatrixWorld(e){super.updateMatrixWorld(e),this._timer.update();let t=this.context.listener;if(this.timeDelta=this._timer.getDelta(),this.matrixWorld.decompose($r,xu,Py),Qr.set(0,0,-1).applyQuaternion(xu),en.set(0,1,0).applyQuaternion(xu),t.positionX){let i=this.context.currentTime+this.timeDelta;t.positionX.linearRampToValueAtTime($r.x,i),t.positionY.linearRampToValueAtTime($r.y,i),t.positionZ.linearRampToValueAtTime($r.z,i),t.forwardX.linearRampToValueAtTime(Qr.x,i),t.forwardY.linearRampToValueAtTime(Qr.y,i),t.forwardZ.linearRampToValueAtTime(Qr.z,i),t.upX.linearRampToValueAtTime(en.x,i),t.upY.linearRampToValueAtTime(en.y,i),t.upZ.linearRampToValueAtTime(en.z,i)}else t.setPosition($r.x,$r.y,$r.z),t.setOrientation(Qr.x,Qr.y,Qr.z,en.x,en.y,en.z)}};var eo=class extends G{constructor(e){super(),this.type="Audio",this.listener=e,this.context=e.context,this.gain=this.context.createGain(),this.gain.connect(e.getInput()),this.autoplay=!1,this.buffer=null,this.detune=0,this.loop=!1,this.loopStart=0,this.loopEnd=0,this.offset=0,this.duration=void 0,this.playbackRate=1,this.isPlaying=!1,this.hasPlaybackControl=!0,this.source=null,this.sourceType="empty",this._startedAt=0,this._progress=0,this._connected=!1,this.filters=[]}getOutput(){return this.gain}setNodeSource(e){return this.hasPlaybackControl=!1,this.sourceType="audioNode",this.source=e,this.connect(),this}setMediaElementSource(e){return this.hasPlaybackControl=!1,this.sourceType="mediaNode",this.source=this.context.createMediaElementSource(e),this.connect(),this}setMediaStreamSource(e){return this.hasPlaybackControl=!1,this.sourceType="mediaStreamNode",this.source=this.context.createMediaStreamSource(e),this.connect(),this}setBuffer(e){return this.buffer=e,this.sourceType="buffer",this.autoplay&&this.play(),this}play(e=0){if(this.isPlaying===!0){B("Audio: Audio is already playing.");return}if(this.hasPlaybackControl===!1){B("Audio: this Audio has no playback control.");return}this._startedAt=this.context.currentTime+e;let t=this.context.createBufferSource();return t.buffer=this.buffer,t.loop=this.loop,t.loopStart=this.loopStart,t.loopEnd=this.loopEnd,t.onended=this.onEnded.bind(this),t.start(this._startedAt,this._progress+this.offset,this.duration),this.isPlaying=!0,this.source=t,this.setDetune(this.detune),this.setPlaybackRate(this.playbackRate),this.connect()}pause(){if(this.hasPlaybackControl===!1){B("Audio: this Audio has no playback control.");return}return this.isPlaying===!0&&(this._progress+=Math.max(this.context.currentTime-this._startedAt,0)*this.playbackRate,this.loop===!0&&(this._progress=this._progress%(this.duration||this.buffer.duration)),this.source.stop(),this.source.onended=null,this.isPlaying=!1),this}stop(e=0){if(this.hasPlaybackControl===!1){B("Audio: this Audio has no playback control.");return}return this._progress=0,this.source!==null&&(this.source.stop(this.context.currentTime+e),this.source.onended=null),this.isPlaying=!1,this}connect(){if(this.filters.length>0){this.source.connect(this.filters[0]);for(let e=1,t=this.filters.length;e<t;e++)this.filters[e-1].connect(this.filters[e]);this.filters[this.filters.length-1].connect(this.getOutput())}else this.source.connect(this.getOutput());return this._connected=!0,this}disconnect(){if(this._connected!==!1){if(this.filters.length>0){this.source.disconnect(this.filters[0]);for(let e=1,t=this.filters.length;e<t;e++)this.filters[e-1].disconnect(this.filters[e]);this.filters[this.filters.length-1].disconnect(this.getOutput())}else this.source.disconnect(this.getOutput());return this._connected=!1,this}}getFilters(){return this.filters}setFilters(e){return e||(e=[]),this._connected===!0?(this.disconnect(),this.filters=e.slice(),this.connect()):this.filters=e.slice(),this}setDetune(e){return this.detune=e,this.isPlaying===!0&&this.source.detune!==void 0&&this.source.detune.setTargetAtTime(this.detune,this.context.currentTime,.01),this}getDetune(){return this.detune}getFilter(){return this.getFilters()[0]}setFilter(e){return this.setFilters(e?[e]:[])}setPlaybackRate(e){if(this.hasPlaybackControl===!1){B("Audio: this Audio has no playback control.");return}return this.playbackRate=e,this.isPlaying===!0&&this.source.playbackRate.setTargetAtTime(this.playbackRate,this.context.currentTime,.01),this}getPlaybackRate(){return this.playbackRate}onEnded(){this.isPlaying=!1,this._progress=0}getLoop(){return this.hasPlaybackControl===!1?(B("Audio: this Audio has no playback control."),!1):this.loop}setLoop(e){if(this.hasPlaybackControl===!1){B("Audio: this Audio has no playback control.");return}return this.loop=e,this.isPlaying===!0&&(this.source.loop=this.loop),this}setLoopStart(e){return this.loopStart=e,this}setLoopEnd(e){return this.loopEnd=e,this}getVolume(){return this.gain.gain.value}setVolume(e){return this.gain.gain.setTargetAtTime(e,this.context.currentTime,.01),this}copy(e,t){return super.copy(e,t),e.sourceType!=="buffer"?(B("Audio: Audio source type cannot be copied."),this):(this.autoplay=e.autoplay,this.buffer=e.buffer,this.detune=e.detune,this.loop=e.loop,this.loopStart=e.loopStart,this.loopEnd=e.loopEnd,this.offset=e.offset,this.duration=e.duration,this.playbackRate=e.playbackRate,this.hasPlaybackControl=e.hasPlaybackControl,this.sourceType=e.sourceType,this.filters=e.filters.slice(),this)}clone(e){return new this.constructor(this.listener).copy(this,e)}};var tn=new y,Od=new ce,Ly=new y,rn=new y,oc=class extends eo{constructor(e){super(e),this.panner=this.context.createPanner(),this.panner.panningModel="HRTF",this.panner.connect(this.gain)}connect(){return super.connect(),this.panner.connect(this.gain),this}disconnect(){return super.disconnect(),this.panner.disconnect(this.gain),this}getOutput(){return this.panner}getRefDistance(){return this.panner.refDistance}setRefDistance(e){return this.panner.refDistance=e,this}getRolloffFactor(){return this.panner.rolloffFactor}setRolloffFactor(e){return this.panner.rolloffFactor=e,this}getDistanceModel(){return this.panner.distanceModel}setDistanceModel(e){return this.panner.distanceModel=e,this}getMaxDistance(){return this.panner.maxDistance}setMaxDistance(e){return this.panner.maxDistance=e,this}setDirectionalCone(e,t,i){return this.panner.coneInnerAngle=e,this.panner.coneOuterAngle=t,this.panner.coneOuterGain=i,this}updateMatrixWorld(e){if(super.updateMatrixWorld(e),this.hasPlaybackControl===!0&&this.isPlaying===!1)return;this.matrixWorld.decompose(tn,Od,Ly),rn.set(0,0,1).applyQuaternion(Od);let t=this.panner;if(t.positionX){let i=this.context.currentTime+this.listener.timeDelta;t.positionX.linearRampToValueAtTime(tn.x,i),t.positionY.linearRampToValueAtTime(tn.y,i),t.positionZ.linearRampToValueAtTime(tn.z,i),t.orientationX.linearRampToValueAtTime(rn.x,i),t.orientationY.linearRampToValueAtTime(rn.y,i),t.orientationZ.linearRampToValueAtTime(rn.z,i)}else t.setPosition(tn.x,tn.y,tn.z),t.setOrientation(rn.x,rn.y,rn.z)}};var ac=class{constructor(e,t=2048){this.analyser=e.context.createAnalyser(),this.analyser.fftSize=t,this.data=new Uint8Array(this.analyser.frequencyBinCount),e.getOutput().connect(this.analyser)}getFrequencyData(){return this.analyser.getByteFrequencyData(this.data),this.data}getAverageFrequency(){let e=0,t=this.getFrequencyData();for(let i=0;i<t.length;i++)e+=t[i];return e/t.length}};var to=class{constructor(e,t,i){this.binding=e,this.valueSize=i;let r,n,s;switch(t){case"quaternion":r=this._slerp,n=this._slerpAdditive,s=this._setAdditiveIdentityQuaternion,this.buffer=new Float64Array(i*6),this._workIndex=5;break;case"string":case"bool":r=this._select,n=this._select,s=this._setAdditiveIdentityOther,this.buffer=new Array(i*5);break;default:r=this._lerp,n=this._lerpAdditive,s=this._setAdditiveIdentityNumeric,this.buffer=new Float64Array(i*5)}this._mixBufferRegion=r,this._mixBufferRegionAdditive=n,this._setIdentity=s,this._origIndex=3,this._addIndex=4,this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,this.useCount=0,this.referenceCount=0}accumulate(e,t){let i=this.buffer,r=this.valueSize,n=e*r+r,s=this.cumulativeWeight;if(s===0){for(let o=0;o!==r;++o)i[n+o]=i[o];s=t}else{s+=t;let o=t/s;this._mixBufferRegion(i,n,0,o,r)}this.cumulativeWeight=s}accumulateAdditive(e){let t=this.buffer,i=this.valueSize,r=i*this._addIndex;this.cumulativeWeightAdditive===0&&this._setIdentity(),this._mixBufferRegionAdditive(t,r,0,e,i),this.cumulativeWeightAdditive+=e}apply(e){let t=this.valueSize,i=this.buffer,r=e*t+t,n=this.cumulativeWeight,s=this.cumulativeWeightAdditive,o=this.binding;if(this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,n<1){let l=t*this._origIndex;this._mixBufferRegion(i,r,l,1-n,t)}s>0&&this._mixBufferRegionAdditive(i,r,this._addIndex*t,1,t);for(let l=t,c=t+t;l!==c;++l)if(i[l]!==i[l+t]){o.setValue(i,r);break}}saveOriginalState(){let e=this.binding,t=this.buffer,i=this.valueSize,r=i*this._origIndex;e.getValue(t,r);for(let n=i,s=r;n!==s;++n)t[n]=t[r+n%i];this._setIdentity(),this.cumulativeWeight=0,this.cumulativeWeightAdditive=0}restoreOriginalState(){let e=this.valueSize*3;this.binding.setValue(this.buffer,e)}_setAdditiveIdentityNumeric(){let e=this._addIndex*this.valueSize,t=e+this.valueSize;for(let i=e;i<t;i++)this.buffer[i]=0}_setAdditiveIdentityQuaternion(){this._setAdditiveIdentityNumeric(),this.buffer[this._addIndex*this.valueSize+3]=1}_setAdditiveIdentityOther(){let e=this._origIndex*this.valueSize,t=this._addIndex*this.valueSize;for(let i=0;i<this.valueSize;i++)this.buffer[t+i]=this.buffer[e+i]}_select(e,t,i,r,n){if(r>=.5)for(let s=0;s!==n;++s)e[t+s]=e[i+s]}_slerp(e,t,i,r){ce.slerpFlat(e,t,e,t,e,i,r)}_slerpAdditive(e,t,i,r,n){let s=this._workIndex*n;ce.multiplyQuaternionsFlat(e,s,e,t,e,i),ce.slerpFlat(e,t,e,t,e,s,r)}_lerp(e,t,i,r,n){let s=1-r;for(let o=0;o!==n;++o){let l=t+o;e[l]=e[l]*s+e[i+o]*r}}_lerpAdditive(e,t,i,r,n){for(let s=0;s!==n;++s){let o=t+s;e[o]=e[o]+e[i+s]*r}}};var vu="\\[\\]\\.:\\/",Ny=new RegExp("["+vu+"]","g"),bu="[^"+vu+"]",Dy="[^"+vu.replace("\\.","")+"]",By=/((?:WC+[\/:])*)/.source.replace("WC",bu),Oy=/(WCOD+)?/.source.replace("WCOD",Dy),Fy=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",bu),Uy=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",bu),zy=new RegExp("^"+By+Oy+Fy+Uy+"$"),ky=["material","materials","bones","map"],yu=class{constructor(e,t,i){let r=i||ne.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let i=this._targetGroup.nCachedObjects_,r=this._bindings[i];r!==void 0&&r.getValue(e,t)}setValue(e,t){let i=this._bindings;for(let r=this._targetGroup.nCachedObjects_,n=i.length;r!==n;++r)i[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].unbind()}},ne=class a{constructor(e,t,i){this.path=t,this.parsedPath=i||a.parseTrackName(t),this.node=a.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new a.Composite(e,t,i):new a(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(Ny,"")}static parseTrackName(e){let t=zy.exec(e);if(t===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+e);let i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=i.nodeName&&i.nodeName.lastIndexOf(".");if(r!==void 0&&r!==-1){let n=i.nodeName.substring(r+1);ky.indexOf(n)!==-1&&(i.nodeName=i.nodeName.substring(0,r),i.objectName=n)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){let i=function(n){for(let s=0;s<n.length;s++){let o=n[s];if(o.name===t||o.uuid===t)return o;let l=i(o.children);if(l)return l}return null},r=i(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let i=this.resolvedProperty;for(let r=0,n=i.length;r!==n;++r)e[t++]=i[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let i=this.resolvedProperty;for(let r=0,n=i.length;r!==n;++r)i[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let i=this.resolvedProperty;for(let r=0,n=i.length;r!==n;++r)i[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let i=this.resolvedProperty;for(let r=0,n=i.length;r!==n;++r)i[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,i=t.objectName,r=t.propertyName,n=t.propertyIndex;if(e||(e=a.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){B("PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=t.objectIndex;switch(i){case"materials":if(!e.material){Z("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){Z("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){Z("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){Z("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){Z("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[i]===void 0){Z("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[i]}if(c!==void 0){if(e[c]===void 0){Z("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let s=e[r];if(s===void 0){let c=t.nodeName;Z("PropertyBinding: Trying to update property for track: "+c+"."+r+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?o=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(n!==void 0){if(r==="morphTargetInfluences"){if(!e.geometry){Z("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){Z("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[n]!==void 0&&(n=e.morphTargetDictionary[n])}l=this.BindingType.ArrayElement,this.resolvedProperty=s,this.propertyIndex=n}else s.fromArray!==void 0&&s.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=s):Array.isArray(s)?(l=this.BindingType.EntireArray,this.resolvedProperty=s):this.propertyName=r;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};ne.Composite=yu;ne.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};ne.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};ne.prototype.GetterByBindingType=[ne.prototype._getValue_direct,ne.prototype._getValue_array,ne.prototype._getValue_arrayElement,ne.prototype._getValue_toArray];ne.prototype.SetterByBindingTypeAndVersioning=[[ne.prototype._setValue_direct,ne.prototype._setValue_direct_setNeedsUpdate,ne.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[ne.prototype._setValue_array,ne.prototype._setValue_array_setNeedsUpdate,ne.prototype._setValue_array_setMatrixWorldNeedsUpdate],[ne.prototype._setValue_arrayElement,ne.prototype._setValue_arrayElement_setNeedsUpdate,ne.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[ne.prototype._setValue_fromArray,ne.prototype._setValue_fromArray_setNeedsUpdate,ne.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var lc=class{constructor(){this.isAnimationObjectGroup=!0,this.uuid=Te(),this._objects=Array.prototype.slice.call(arguments),this.nCachedObjects_=0;let e={};this._indicesByUUID=e;for(let i=0,r=arguments.length;i!==r;++i)e[arguments[i].uuid]=i;this._paths=[],this._parsedPaths=[],this._bindings=[],this._bindingsIndicesByPath={};let t=this;this.stats={objects:{get total(){return t._objects.length},get inUse(){return this.total-t.nCachedObjects_}},get bindingsPerObject(){return t._bindings.length}}}add(){let e=this._objects,t=this._indicesByUUID,i=this._paths,r=this._parsedPaths,n=this._bindings,s=n.length,o,l=e.length,c=this.nCachedObjects_;for(let h=0,u=arguments.length;h!==u;++h){let f=arguments[h],d=f.uuid,p=t[d];if(p===void 0){p=l++,t[d]=p,e.push(f);for(let m=0,g=s;m!==g;++m)n[m].push(new ne(f,i[m],r[m]))}else if(p<c){o=e[p];let m=--c,g=e[m];t[g.uuid]=p,e[p]=g,t[d]=m,e[m]=f;for(let _=0,x=s;_!==x;++_){let v=n[_],b=v[m],M=v[p];v[p]=b,M===void 0&&(M=new ne(f,i[_],r[_])),v[m]=M}}else e[p]!==o&&Z("AnimationObjectGroup: Different objects with the same UUID detected. Clean the caches or recreate your infrastructure when reloading scenes.")}this.nCachedObjects_=c}remove(){let e=this._objects,t=this._indicesByUUID,i=this._bindings,r=i.length,n=this.nCachedObjects_;for(let s=0,o=arguments.length;s!==o;++s){let l=arguments[s],c=l.uuid,h=t[c];if(h!==void 0&&h>=n){let u=n++,f=e[u];t[f.uuid]=h,e[h]=f,t[c]=u,e[u]=l;for(let d=0,p=r;d!==p;++d){let m=i[d],g=m[u],_=m[h];m[h]=g,m[u]=_}}}this.nCachedObjects_=n}uncache(){let e=this._objects,t=this._indicesByUUID,i=this._bindings,r=i.length,n=this.nCachedObjects_,s=e.length;for(let o=0,l=arguments.length;o!==l;++o){let c=arguments[o],h=c.uuid,u=t[h];if(u!==void 0)if(delete t[h],u<n){let f=--n,d=e[f],p=--s,m=e[p];u!==f&&(t[d.uuid]=u),e[u]=d,f!==p&&(t[m.uuid]=f),e[f]=m,e.pop();for(let g=0,_=r;g!==_;++g){let x=i[g],v=x[f],b=x[p];x[u]=v,x[f]=b,x.pop()}}else{let f=--s,d=e[f];u!==f&&(t[d.uuid]=u),e[u]=d,e.pop();for(let p=0,m=r;p!==m;++p){let g=i[p];g[u]=g[f],g.pop()}}}this.nCachedObjects_=n}subscribe_(e,t){let i=this._bindingsIndicesByPath,r=i[e],n=this._bindings;if(r!==void 0)return n[r];let s=this._paths,o=this._parsedPaths,l=this._objects,c=l.length,h=this.nCachedObjects_,u=new Array(c);r=n.length,i[e]=r,s.push(e),o.push(t),n.push(u);for(let f=h,d=l.length;f!==d;++f){let p=l[f];u[f]=new ne(p,e,t)}return u}unsubscribe_(e){let t=this._bindingsIndicesByPath,i=t[e];if(i!==void 0){let r=this._paths,n=this._parsedPaths,s=this._bindings,o=s.length-1,l=s[o],c=r[o];t[c]=i,s[i]=l,s.pop(),n[i]=n[o],n.pop(),r[i]=r[o],r.pop()}}};var io=class{constructor(e,t,i=null,r=t.blendMode){this._mixer=e,this._clip=t,this._localRoot=i,this.blendMode=r;let n=t.tracks,s=n.length,o=new Array(s),l={endingStart:Ai,endingEnd:Ai};for(let c=0;c!==s;++c){let h=n[c].createInterpolant(null);o[c]=h,h.settings=l}this._interpolantSettings=l,this._interpolants=o,this._propertyBindings=new Array(s),this._cacheIndex=null,this._byClipCacheIndex=null,this._timeScaleInterpolant=null,this._restoreTimeScale=null,this._weightInterpolant=null,this.loop=mh,this._loopCount=-1,this._startTime=null,this.time=0,this.timeScale=1,this._effectiveTimeScale=1,this.weight=1,this._effectiveWeight=1,this.repetitions=1/0,this.paused=!1,this.enabled=!0,this.clampWhenFinished=!1,this.zeroSlopeAtStart=!0,this.zeroSlopeAtEnd=!0}play(){return this._mixer._activateAction(this),this}stop(){return this._mixer._deactivateAction(this),this.reset()}reset(){return this.paused=!1,this.enabled=!0,this.time=0,this._loopCount=-1,this._startTime=null,this.stopFading().stopWarping()}isRunning(){return this.enabled&&!this.paused&&this.timeScale!==0&&this._startTime===null&&this._mixer._isActiveAction(this)}isScheduled(){return this._mixer._isActiveAction(this)}startAt(e){return this._startTime=e,this}setLoop(e,t){return this.loop=e,this.repetitions=t,this}setEffectiveWeight(e){return this.weight=e,this._effectiveWeight=this.enabled?e:0,this.stopFading()}getEffectiveWeight(){return this._effectiveWeight}fadeIn(e){return this._scheduleFading(e,0,1)}fadeOut(e){return this._scheduleFading(e,1,0)}crossFadeFrom(e,t,i=!1){if(e.fadeOut(t),this.fadeIn(t),i===!0){let r=this._clip.duration,n=e._clip.duration,s=n/r,o=r/n;e._restoreTimeScale=e.timeScale,this._restoreTimeScale=this.timeScale,e.warp(1,s,t),this.warp(o,1,t)}return this}crossFadeTo(e,t,i=!1){return e.crossFadeFrom(this,t,i)}stopFading(){let e=this._weightInterpolant;return e!==null&&(this._weightInterpolant=null,this._mixer._takeBackControlInterpolant(e)),this}setEffectiveTimeScale(e){return this.timeScale=e,this._effectiveTimeScale=this.paused?0:e,this.stopWarping()}getEffectiveTimeScale(){return this._effectiveTimeScale}setDuration(e){return this.timeScale=this._clip.duration/e,this.stopWarping()}syncWith(e){return this.time=e.time,this.timeScale=e.timeScale,this.stopWarping()}halt(e){return this.warp(this._effectiveTimeScale,0,e)}warp(e,t,i){let r=this._mixer,n=r.time,s=this.timeScale,o=this._timeScaleInterpolant;o===null&&(o=r._lendControlInterpolant(),this._timeScaleInterpolant=o);let l=o.parameterPositions,c=o.sampleValues;return l[0]=n,l[1]=n+i,c[0]=e/s,c[1]=t/s,this}stopWarping(){let e=this._timeScaleInterpolant;return e!==null&&(this._timeScaleInterpolant=null,this._mixer._takeBackControlInterpolant(e)),this._restoreTimeScale=null,this}getMixer(){return this._mixer}getClip(){return this._clip}getRoot(){return this._localRoot||this._mixer._root}_update(e,t,i,r){if(!this.enabled){this._updateWeight(e);return}let n=this._startTime;if(n!==null){let l=(e-n)*i;l<0||i===0?t=0:(this._startTime=null,t=i*l)}t*=this._updateTimeScale(e);let s=this._updateTime(t),o=this._updateWeight(e);if(o>0){let l=this._interpolants,c=this._propertyBindings;switch(this.blendMode){case Po:for(let h=0,u=l.length;h!==u;++h)l[h].evaluate(s),c[h].accumulateAdditive(o);break;case Ir:default:for(let h=0,u=l.length;h!==u;++h)l[h].evaluate(s),c[h].accumulate(r,o)}}}_updateWeight(e){let t=0;if(this.enabled){t=this.weight;let i=this._weightInterpolant;if(i!==null){let r=i.evaluate(e)[0];t*=r,e>i.parameterPositions[1]&&(this.stopFading(),r===0&&(this.enabled=!1))}}return this._effectiveWeight=t,t}_updateTimeScale(e){let t=0;if(!this.paused){t=this.timeScale;let i=this._timeScaleInterpolant;if(i!==null){let r=i.evaluate(e)[0];t*=r,e>i.parameterPositions[1]&&(t===0?this.paused=!0:(this._restoreTimeScale!==null&&(t=this._restoreTimeScale),this.timeScale=t),this.stopWarping())}}return this._effectiveTimeScale=t,t}_updateTime(e){let t=this._clip.duration,i=this.loop,r=this.time+e,n=this._loopCount,s=i===gh;if(e===0)return n===-1?r:s&&(n&1)===1?t-r:r;if(i===ph){n===-1&&(this._loopCount=0,this._setEndings(!0,!0,!1));e:{if(r>=t)r=t;else if(r<0)r=0;else{this.time=r;break e}this.clampWhenFinished?this.paused=!0:this.enabled=!1,this.time=r,this._mixer.dispatchEvent({type:"finished",action:this,direction:e<0?-1:1})}}else{if(n===-1&&(e>=0?(n=0,this._setEndings(!0,this.repetitions===0,s)):this._setEndings(this.repetitions===0,!0,s)),r>=t||r<0){let o=Math.floor(r/t);r-=t*o,n+=Math.abs(o);let l=this.repetitions-n;if(l<=0)this.clampWhenFinished?this.paused=!0:this.enabled=!1,r=e>0?t:0,this.time=r,this._mixer.dispatchEvent({type:"finished",action:this,direction:e>0?1:-1});else{if(l===1){let c=e<0;this._setEndings(c,!c,s)}else this._setEndings(!1,!1,s);this._loopCount=n,this.time=r,this._mixer.dispatchEvent({type:"loop",action:this,loopDelta:o})}}else this._loopCount=n,this.time=r;if(s&&(n&1)===1)return t-r}return r}_setEndings(e,t,i){let r=this._interpolantSettings;i?(r.endingStart=Ti,r.endingEnd=Ti):(e?r.endingStart=this.zeroSlopeAtStart?Ti:Ai:r.endingStart=Er,t?r.endingEnd=this.zeroSlopeAtEnd?Ti:Ai:r.endingEnd=Er)}_scheduleFading(e,t,i){let r=this._mixer,n=r.time,s=this._weightInterpolant;s===null&&(s=r._lendControlInterpolant(),this._weightInterpolant=s);let o=s.parameterPositions,l=s.sampleValues;return o[0]=n,l[0]=t,o[1]=n+e,l[1]=i,this}};var Vy=new Float32Array(1),ra=class extends Ie{constructor(e){super(),this._root=e,this._initMemoryManager(),this._accuIndex=0,this.time=0,this.timeScale=1}_bindAction(e,t){let i=e._localRoot||this._root,r=e._clip.tracks,n=r.length,s=e._propertyBindings,o=e._interpolants,l=i.uuid,c=this._bindingsByRootAndName,h=c[l];h===void 0&&(h={},c[l]=h);for(let u=0;u!==n;++u){let f=r[u],d=f.name,p=h[d];if(p!==void 0)++p.referenceCount,s[u]=p;else{if(p=s[u],p!==void 0){p._cacheIndex===null&&(++p.referenceCount,this._addInactiveBinding(p,l,d));continue}let m=t&&t._propertyBindings[u].binding.parsedPath;p=new to(ne.create(i,d,m),f.ValueTypeName,f.getValueSize()),++p.referenceCount,this._addInactiveBinding(p,l,d),s[u]=p}o[u].resultBuffer=p.buffer}}_activateAction(e){if(!this._isActiveAction(e)){if(e._cacheIndex===null){let i=(e._localRoot||this._root).uuid,r=e._clip.uuid,n=this._actionsByClip[r];this._bindAction(e,n&&n.knownActions[0]),this._addInactiveAction(e,r,i)}let t=e._propertyBindings;for(let i=0,r=t.length;i!==r;++i){let n=t[i];n.useCount++===0&&(this._lendBinding(n),n.saveOriginalState())}this._lendAction(e)}}_deactivateAction(e){if(this._isActiveAction(e)){let t=e._propertyBindings;for(let i=0,r=t.length;i!==r;++i){let n=t[i];--n.useCount===0&&(n.restoreOriginalState(),this._takeBackBinding(n))}this._takeBackAction(e)}}_initMemoryManager(){this._actions=[],this._nActiveActions=0,this._actionsByClip={},this._bindings=[],this._nActiveBindings=0,this._bindingsByRootAndName={},this._controlInterpolants=[],this._nActiveControlInterpolants=0;let e=this;this.stats={actions:{get total(){return e._actions.length},get inUse(){return e._nActiveActions}},bindings:{get total(){return e._bindings.length},get inUse(){return e._nActiveBindings}},controlInterpolants:{get total(){return e._controlInterpolants.length},get inUse(){return e._nActiveControlInterpolants}}}}_isActiveAction(e){let t=e._cacheIndex;return t!==null&&t<this._nActiveActions}_addInactiveAction(e,t,i){let r=this._actions,n=this._actionsByClip,s=n[t];if(s===void 0)s={knownActions:[e],actionByRoot:{}},e._byClipCacheIndex=0,n[t]=s;else{let o=s.knownActions;e._byClipCacheIndex=o.length,o.push(e)}e._cacheIndex=r.length,r.push(e),s.actionByRoot[i]=e}_removeInactiveAction(e){let t=this._actions,i=t[t.length-1],r=e._cacheIndex;i._cacheIndex=r,t[r]=i,t.pop(),e._cacheIndex=null;let n=e._clip.uuid,s=this._actionsByClip,o=s[n],l=o.knownActions,c=l[l.length-1],h=e._byClipCacheIndex;c._byClipCacheIndex=h,l[h]=c,l.pop(),e._byClipCacheIndex=null;let u=o.actionByRoot,f=(e._localRoot||this._root).uuid;delete u[f],l.length===0&&delete s[n],this._removeInactiveBindingsForAction(e)}_removeInactiveBindingsForAction(e){let t=e._propertyBindings;for(let i=0,r=t.length;i!==r;++i){let n=t[i];--n.referenceCount===0&&this._removeInactiveBinding(n)}}_lendAction(e){let t=this._actions,i=e._cacheIndex,r=this._nActiveActions++,n=t[r];e._cacheIndex=r,t[r]=e,n._cacheIndex=i,t[i]=n}_takeBackAction(e){let t=this._actions,i=e._cacheIndex,r=--this._nActiveActions,n=t[r];e._cacheIndex=r,t[r]=e,n._cacheIndex=i,t[i]=n}_addInactiveBinding(e,t,i){let r=this._bindingsByRootAndName,n=this._bindings,s=r[t];s===void 0&&(s={},r[t]=s),s[i]=e,e._cacheIndex=n.length,n.push(e)}_removeInactiveBinding(e){let t=this._bindings,i=e.binding,r=i.rootNode.uuid,n=i.path,s=this._bindingsByRootAndName,o=s[r],l=t[t.length-1],c=e._cacheIndex;l._cacheIndex=c,t[c]=l,t.pop(),delete o[n],Object.keys(o).length===0&&delete s[r]}_lendBinding(e){let t=this._bindings,i=e._cacheIndex,r=this._nActiveBindings++,n=t[r];e._cacheIndex=r,t[r]=e,n._cacheIndex=i,t[i]=n}_takeBackBinding(e){let t=this._bindings,i=e._cacheIndex,r=--this._nActiveBindings,n=t[r];e._cacheIndex=r,t[r]=e,n._cacheIndex=i,t[i]=n}_lendControlInterpolant(){let e=this._controlInterpolants,t=this._nActiveControlInterpolants++,i=e[t];return i===void 0&&(i=new sr(new Float32Array(2),new Float32Array(2),1,Vy),i.__cacheIndex=t,e[t]=i),i}_takeBackControlInterpolant(e){let t=this._controlInterpolants,i=e.__cacheIndex,r=--this._nActiveControlInterpolants,n=t[r];e.__cacheIndex=r,t[r]=e,n.__cacheIndex=i,t[i]=n}clipAction(e,t,i){let r=t||this._root,n=r.uuid,s=typeof e=="string"?yt.findByName(r,e):e,o=s!==null?s.uuid:e,l=this._actionsByClip[o],c=null;if(i===void 0&&(s!==null?i=s.blendMode:i=Ir),l!==void 0){let u=l.actionByRoot[n];if(u!==void 0&&u.blendMode===i)return u;c=l.knownActions[0],s===null&&(s=c._clip)}if(s===null)return null;let h=new io(this,s,t,i);return this._bindAction(h,c),this._addInactiveAction(h,o,n),h}existingAction(e,t){let i=t||this._root,r=i.uuid,n=typeof e=="string"?yt.findByName(i,e):e,s=n?n.uuid:e,o=this._actionsByClip[s];return o!==void 0&&o.actionByRoot[r]||null}stopAllAction(){let e=this._actions,t=this._nActiveActions;for(let i=t-1;i>=0;--i)e[i].stop();return this}update(e){e*=this.timeScale;let t=this._actions,i=this._nActiveActions,r=this.time+=e,n=Math.sign(e),s=this._accuIndex^=1;for(let c=0;c!==i;++c)t[c]._update(r,e,n,s);let o=this._bindings,l=this._nActiveBindings;for(let c=0;c!==l;++c)o[c].apply(s);return this}setTime(e){this.time=0;for(let t=0;t<this._actions.length;t++)this._actions[t].time=0;return this.update(e)}getRoot(){return this._root}uncacheClip(e){let t=this._actions,i=e.uuid,r=this._actionsByClip,n=r[i];if(n!==void 0){let s=n.knownActions;for(let o=0,l=s.length;o!==l;++o){let c=s[o];this._deactivateAction(c);let h=c._cacheIndex,u=t[t.length-1];c._cacheIndex=null,c._byClipCacheIndex=null,u._cacheIndex=h,t[h]=u,t.pop(),this._removeInactiveBindingsForAction(c)}delete r[i]}}uncacheRoot(e){let t=e.uuid,i=this._actionsByClip;for(let s in i){let o=i[s].actionByRoot,l=o[t];l!==void 0&&(this._deactivateAction(l),this._removeInactiveAction(l))}let r=this._bindingsByRootAndName,n=r[t];if(n!==void 0)for(let s in n){let o=n[s];o.restoreOriginalState(),this._removeInactiveBinding(o)}}uncacheAction(e,t){let i=this.existingAction(e,t);i!==null&&(this._deactivateAction(i),this._removeInactiveAction(i))}};var cc=class extends Wi{constructor(e=1,t=1,i=1,r={}){super(e,t,r),this.isRenderTarget3D=!0,this.depth=i;for(let n=0;n<this.textures.length;n++){let s=new qi(null,e,t,i);s.isRenderTargetTexture=!0,s.renderTarget=this,this.textures[n]=s}this._setTextureOptions(r)}};var hc=class a{constructor(e){this.value=e}clone(){return new a(this.value.clone===void 0?this.value:this.value.clone())}};var Gy=0,uc=class extends Ie{constructor(){super(),this.isUniformsGroup=!0,Object.defineProperty(this,"id",{value:Gy++}),this.name="",this.usage=Pr,this.uniforms=[]}add(e){return this.uniforms.push(e),this}remove(e){let t=this.uniforms.indexOf(e);return t!==-1&&this.uniforms.splice(t,1),this}setName(e){return this.name=e,this}setUsage(e){return this.usage=e,this}dispose(){this.dispatchEvent({type:"dispose"})}copy(e){this.name=e.name,this.usage=e.usage;let t=e.uniforms;this.uniforms.length=0;for(let i=0,r=t.length;i<r;i++){let n=Array.isArray(t[i])?t[i]:[t[i]];for(let s=0;s<n.length;s++)this.uniforms.push(n[s].clone())}return this}clone(){return new this.constructor().copy(this)}};var fc=class extends It{constructor(e,t,i=1){super(e,t),this.isInstancedInterleavedBuffer=!0,this.meshPerAttribute=i}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}clone(e){let t=super.clone(e);return t.meshPerAttribute=this.meshPerAttribute,t}toJSON(e){let t=super.toJSON(e);return t.isInstancedInterleavedBuffer=!0,t.meshPerAttribute=this.meshPerAttribute,t}};var dc=class{constructor(e,t,i,r,n,s=!1){this.isGLBufferAttribute=!0,this.name="",this.buffer=e,this.type=t,this.itemSize=i,this.elementSize=r,this.count=n,this.normalized=s,this.version=0}set needsUpdate(e){e===!0&&this.version++}setBuffer(e){return this.buffer=e,this}setType(e,t){return this.type=e,this.elementSize=t,this}setItemSize(e){return this.itemSize=e,this}setCount(e){return this.count=e,this}};var Fd=new F,pc=class{constructor(e,t,i=0,r=1/0){this.ray=new _t(e,t),this.near=i,this.far=r,this.camera=null,this.layers=new Yi,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,t.projectionMatrix.elements[14]).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):Z("Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return Fd.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Fd),this}intersectObject(e,t=!0,i=[]){return Su(e,this,i,t),i.sort(Ud),i}intersectObjects(e,t=!0,i=[]){for(let r=0,n=e.length;r<n;r++)Su(e[r],this,i,t);return i.sort(Ud),i}};function Ud(a,e){return a.distance-e.distance}function Su(a,e,t,i){let r=!0;if(a.layers.test(e.layers)&&a.raycast(e,t)===!1&&(r=!1),r===!0&&i===!0){let n=a.children;for(let s=0,o=n.length;s<o;s++)Su(n[s],e,t,!0)}}var mc=class{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1,B("Clock: This module has been deprecated. Please use THREE.Timer instead.")}start(){this.startTime=performance.now(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){let t=performance.now();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}};var gc=class{constructor(e=1,t=0,i=0){this.radius=e,this.phi=t,this.theta=i}set(e,t,i){return this.radius=e,this.phi=t,this.theta=i,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=k(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,i){return this.radius=Math.sqrt(e*e+t*t+i*i),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,i),this.phi=Math.acos(k(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var _c=class{constructor(e=1,t=0,i=0){this.radius=e,this.theta=t,this.y=i}set(e,t,i){return this.radius=e,this.theta=t,this.y=i,this}copy(e){return this.radius=e.radius,this.theta=e.theta,this.y=e.y,this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,i){return this.radius=Math.sqrt(e*e+i*i),this.theta=Math.atan2(e,i),this.y=t,this}clone(){return new this.constructor().copy(this)}};var Mu=class Mu{constructor(e,t,i,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,i,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let i=0;i<4;i++)this.elements[i]=e[i+t];return this}set(e,t,i,r){let n=this.elements;return n[0]=e,n[2]=t,n[1]=i,n[3]=r,this}};Mu.prototype.isMatrix2=!0;var xc=Mu;var zd=new T,ro=class{constructor(e=new T(1/0,1/0),t=new T(-1/0,-1/0)){this.isBox2=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=zd.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=1/0,this.max.x=this.max.y=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y}getCenter(e){return this.isEmpty()?e.set(0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,zd).distanceTo(e)}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}};var kd=new y,yc=new y,no=new y,so=new y,wu=new y,Hy=new y,Wy=new y,vc=class{constructor(e=new y,t=new y){this.start=e,this.end=t}set(e,t){return this.start.copy(e),this.end.copy(t),this}copy(e){return this.start.copy(e.start),this.end.copy(e.end),this}getCenter(e){return e.addVectors(this.start,this.end).multiplyScalar(.5)}delta(e){return e.subVectors(this.end,this.start)}distanceSq(){return this.start.distanceToSquared(this.end)}distance(){return this.start.distanceTo(this.end)}at(e,t){return this.delta(t).multiplyScalar(e).add(this.start)}closestPointToPointParameter(e,t){kd.subVectors(e,this.start),yc.subVectors(this.end,this.start);let i=yc.dot(yc);if(i===0)return 0;let n=yc.dot(kd)/i;return t&&(n=k(n,0,1)),n}closestPointToPoint(e,t,i){let r=this.closestPointToPointParameter(e,t);return this.delta(i).multiplyScalar(r).add(this.start)}distanceSqToLine3(e,t=Hy,i=Wy){let r=10000000000000001e-32,n,s,o=this.start,l=e.start,c=this.end,h=e.end;no.subVectors(c,o),so.subVectors(h,l),wu.subVectors(o,l);let u=no.dot(no),f=so.dot(so),d=so.dot(wu);if(u<=r&&f<=r)return t.copy(o),i.copy(l),t.sub(i),t.dot(t);if(u<=r)n=0,s=d/f,s=k(s,0,1);else{let p=no.dot(wu);if(f<=r)s=0,n=k(-p/u,0,1);else{let m=no.dot(so),g=u*f-m*m;g!==0?n=k((m*d-p*f)/g,0,1):n=0,s=(m*n+d)/f,s<0?(s=0,n=k(-p/u,0,1)):s>1&&(s=1,n=k((m-p)/u,0,1))}}return t.copy(o).addScaledVector(no,n),i.copy(l).addScaledVector(so,s),t.distanceToSquared(i)}applyMatrix4(e){return this.start.applyMatrix4(e),this.end.applyMatrix4(e),this}equals(e){return e.start.equals(this.start)&&e.end.equals(this.end)}clone(){return new this.constructor().copy(this)}};var Vd=new y,bc=class extends G{constructor(e,t){super(),this.light=e,this.matrixAutoUpdate=!1,this.color=t,this.type="SpotLightHelper";let i=new P,r=[0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,-1,0,1,0,0,0,0,1,1,0,0,0,0,-1,1];for(let s=0,o=1,l=32;s<l;s++,o++){let c=s/l*Math.PI*2,h=o/l*Math.PI*2;r.push(Math.cos(c),Math.sin(c),1,Math.cos(h),Math.sin(h),1)}i.setAttribute("position",new R(r,3));let n=new re({fog:!1,toneMapped:!1});this.cone=new Me(i,n),this.add(this.cone),this.update()}dispose(){super.dispose(),this.cone.geometry.dispose(),this.cone.material.dispose()}update(){this.light.updateWorldMatrix(!0,!1),this.light.target.updateWorldMatrix(!0,!1),this.parent?(this.parent.updateWorldMatrix(!0),this.matrix.copy(this.parent.matrixWorld).invert().multiply(this.light.matrixWorld)):this.matrix.copy(this.light.matrixWorld),this.matrixWorldNeedsUpdate=!0;let e=this.light.distance?this.light.distance:1e3,t=e*Math.tan(this.light.angle);this.cone.scale.set(t,t,e),Vd.setFromMatrixPosition(this.light.target.matrixWorld),this.cone.lookAt(Vd),this.color!==void 0?this.cone.material.color.set(this.color):this.cone.material.color.copy(this.light.color)}};var fr=new y,Sc=new F,Au=new F,na=class extends Me{constructor(e){let t=Gd(e),i=new P,r=[],n=[];for(let c=0;c<t.length;c++){let h=t[c];h.parent&&h.parent.isBone&&(r.push(0,0,0),r.push(0,0,0),n.push(0,0,0),n.push(0,0,0))}i.setAttribute("position",new R(r,3)),i.setAttribute("color",new R(n,3));let s=new re({vertexColors:!0,depthTest:!1,depthWrite:!1,toneMapped:!1,transparent:!0});super(i,s),this.isSkeletonHelper=!0,this.type="SkeletonHelper",this.root=e,this.bones=t,this.matrix=e.matrixWorld,this.matrixAutoUpdate=!1;let o=new I(255),l=new I(65280);this.setColors(o,l)}updateMatrixWorld(e){let t=this.bones,i=this.geometry,r=i.getAttribute("position");Au.copy(this.root.matrixWorld).invert();for(let n=0,s=0;n<t.length;n++){let o=t[n];o.parent&&o.parent.isBone&&(Sc.multiplyMatrices(Au,o.matrixWorld),fr.setFromMatrixPosition(Sc),r.setXYZ(s,fr.x,fr.y,fr.z),Sc.multiplyMatrices(Au,o.parent.matrixWorld),fr.setFromMatrixPosition(Sc),r.setXYZ(s+1,fr.x,fr.y,fr.z),s+=2)}i.getAttribute("position").needsUpdate=!0,super.updateMatrixWorld(e)}setColors(e,t){let r=this.geometry.getAttribute("color");for(let n=0;n<r.count;n+=2)r.setXYZ(n,e.r,e.g,e.b),r.setXYZ(n+1,t.r,t.g,t.b);return r.needsUpdate=!0,this}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};function Gd(a){let e=[];a.isBone===!0&&e.push(a);for(let t=0;t<a.children.length;t++)e.push(...Gd(a.children[t]));return e}var Mc=class extends ae{constructor(e,t,i){let r=new As(t,4,2),n=new Se({wireframe:!0,fog:!1,toneMapped:!1});super(r,n),this.light=e,this.color=i,this.type="PointLightHelper",this.matrix=this.light.matrixWorld,this.matrixAutoUpdate=!1,this.update()}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}update(){this.matrixWorldNeedsUpdate=!0,this.light.updateWorldMatrix(!0,!1),this.color!==void 0?this.material.color.set(this.color):this.material.color.copy(this.light.color)}};var qy=new y,Hd=new I,Wd=new I,wc=class extends G{constructor(e,t,i){super(),this.light=e,this.matrix=e.matrixWorld,this.matrixAutoUpdate=!1,this.color=i,this.type="HemisphereLightHelper";let r=new ws(t);r.rotateY(Math.PI*.5),this.material=new Se({wireframe:!0,fog:!1,toneMapped:!1}),this.color===void 0&&(this.material.vertexColors=!0);let n=r.getAttribute("position"),s=new Float32Array(n.count*3);r.setAttribute("color",new j(s,3)),this.add(new ae(r,this.material)),this.update()}dispose(){super.dispose(),this.children[0].geometry.dispose(),this.children[0].material.dispose()}update(){let e=this.children[0];if(this.color!==void 0)this.material.color.set(this.color);else{let t=e.geometry.getAttribute("color");Hd.copy(this.light.color),Wd.copy(this.light.groundColor);for(let i=0,r=t.count;i<r;i++){let n=i<r/2?Hd:Wd;t.setXYZ(i,n.r,n.g,n.b)}t.needsUpdate=!0}this.matrixWorldNeedsUpdate=!0,this.light.updateWorldMatrix(!0,!1),e.lookAt(qy.setFromMatrixPosition(this.light.matrixWorld).negate())}};var Ac=class extends Me{constructor(e=10,t=10,i=4473924,r=8947848){i=new I(i),r=new I(r);let n=t/2,s=e/t,o=e/2,l=[],c=[];for(let f=0,d=0,p=-o;f<=t;f++,p+=s){l.push(-o,0,p,o,0,p),l.push(p,0,-o,p,0,o);let m=f===n?i:r;m.toArray(c,d),d+=3,m.toArray(c,d),d+=3,m.toArray(c,d),d+=3,m.toArray(c,d),d+=3}let h=new P;h.setAttribute("position",new R(l,3)),h.setAttribute("color",new R(c,3));let u=new re({vertexColors:!0,toneMapped:!1});super(h,u),this.type="GridHelper"}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};var Tc=class extends Me{constructor(e=10,t=16,i=8,r=64,n=4473924,s=8947848){n=new I(n),s=new I(s);let o=[],l=[];if(t>1)for(let u=0;u<t;u++){let f=u/t*(Math.PI*2),d=Math.sin(f)*e,p=Math.cos(f)*e;o.push(0,0,0),o.push(d,0,p);let m=u&1?n:s;l.push(m.r,m.g,m.b),l.push(m.r,m.g,m.b)}for(let u=0;u<i;u++){let f=u&1?n:s,d=e-e/i*u;for(let p=0;p<r;p++){let m=p/r*(Math.PI*2),g=Math.sin(m)*d,_=Math.cos(m)*d;o.push(g,0,_),l.push(f.r,f.g,f.b),m=(p+1)/r*(Math.PI*2),g=Math.sin(m)*d,_=Math.cos(m)*d,o.push(g,0,_),l.push(f.r,f.g,f.b)}}let c=new P;c.setAttribute("position",new R(o,3)),c.setAttribute("color",new R(l,3));let h=new re({vertexColors:!0,toneMapped:!1});super(c,h),this.type="PolarGridHelper"}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};var qd=new y,Cc=new y,Xd=new y,Ec=class extends G{constructor(e,t,i){super(),this.light=e,this.matrix=e.matrixWorld,this.matrixAutoUpdate=!1,this.color=i,this.type="DirectionalLightHelper",t===void 0&&(t=1);let r=new P;r.setAttribute("position",new R([-t,t,0,t,t,0,t,-t,0,-t,-t,0,-t,t,0],3));let n=new re({fog:!1,toneMapped:!1});this.lightPlane=new ke(r,n),this.add(this.lightPlane),r=new P,r.setAttribute("position",new R([0,0,0,0,0,1],3)),this.targetLine=new ke(r,n),this.add(this.targetLine),this.update()}dispose(){super.dispose(),this.lightPlane.geometry.dispose(),this.lightPlane.material.dispose(),this.targetLine.geometry.dispose(),this.targetLine.material.dispose()}update(){this.matrixWorldNeedsUpdate=!0,this.light.updateWorldMatrix(!0,!1),this.light.target.updateWorldMatrix(!0,!1),qd.setFromMatrixPosition(this.light.matrixWorld),Cc.setFromMatrixPosition(this.light.target.matrixWorld),Xd.subVectors(Cc,qd),this.lightPlane.lookAt(Cc),this.color!==void 0?(this.lightPlane.material.color.set(this.color),this.targetLine.material.color.set(this.color)):(this.lightPlane.material.color.copy(this.light.color),this.targetLine.material.color.copy(this.light.color)),this.targetLine.lookAt(Cc),this.targetLine.scale.z=Xd.length()}};var Ic=new y,Pe=new gi,Rc=class extends Me{constructor(e){let t=new P,i=new re({color:16777215,vertexColors:!0,toneMapped:!1}),r=[],n=[],s={};o("n1","n2"),o("n2","n4"),o("n4","n3"),o("n3","n1"),o("f1","f2"),o("f2","f4"),o("f4","f3"),o("f3","f1"),o("n1","f1"),o("n2","f2"),o("n3","f3"),o("n4","f4"),o("p","n1"),o("p","n2"),o("p","n3"),o("p","n4"),o("u1","u2"),o("u2","u3"),o("u3","u1"),o("c","t"),o("p","c"),o("cn1","cn2"),o("cn3","cn4"),o("cf1","cf2"),o("cf3","cf4");function o(p,m){l(p),l(m)}function l(p){r.push(0,0,0),n.push(0,0,0),s[p]===void 0&&(s[p]=[]),s[p].push(r.length/3-1)}t.setAttribute("position",new R(r,3)),t.setAttribute("color",new R(n,3)),super(t,i),this.type="CameraHelper",this.camera=e,this.camera.updateProjectionMatrix&&this.camera.updateProjectionMatrix(),this.matrix=e.matrixWorld,this.matrixAutoUpdate=!1,this.pointMap=s,this.update();let c=new I(16755200),h=new I(16711680),u=new I(43775),f=new I(16777215),d=new I(3355443);this.setColors(c,h,u,f,d)}setColors(e,t,i,r,n){let o=this.geometry.getAttribute("color");return o.setXYZ(0,e.r,e.g,e.b),o.setXYZ(1,e.r,e.g,e.b),o.setXYZ(2,e.r,e.g,e.b),o.setXYZ(3,e.r,e.g,e.b),o.setXYZ(4,e.r,e.g,e.b),o.setXYZ(5,e.r,e.g,e.b),o.setXYZ(6,e.r,e.g,e.b),o.setXYZ(7,e.r,e.g,e.b),o.setXYZ(8,e.r,e.g,e.b),o.setXYZ(9,e.r,e.g,e.b),o.setXYZ(10,e.r,e.g,e.b),o.setXYZ(11,e.r,e.g,e.b),o.setXYZ(12,e.r,e.g,e.b),o.setXYZ(13,e.r,e.g,e.b),o.setXYZ(14,e.r,e.g,e.b),o.setXYZ(15,e.r,e.g,e.b),o.setXYZ(16,e.r,e.g,e.b),o.setXYZ(17,e.r,e.g,e.b),o.setXYZ(18,e.r,e.g,e.b),o.setXYZ(19,e.r,e.g,e.b),o.setXYZ(20,e.r,e.g,e.b),o.setXYZ(21,e.r,e.g,e.b),o.setXYZ(22,e.r,e.g,e.b),o.setXYZ(23,e.r,e.g,e.b),o.setXYZ(24,t.r,t.g,t.b),o.setXYZ(25,t.r,t.g,t.b),o.setXYZ(26,t.r,t.g,t.b),o.setXYZ(27,t.r,t.g,t.b),o.setXYZ(28,t.r,t.g,t.b),o.setXYZ(29,t.r,t.g,t.b),o.setXYZ(30,t.r,t.g,t.b),o.setXYZ(31,t.r,t.g,t.b),o.setXYZ(32,i.r,i.g,i.b),o.setXYZ(33,i.r,i.g,i.b),o.setXYZ(34,i.r,i.g,i.b),o.setXYZ(35,i.r,i.g,i.b),o.setXYZ(36,i.r,i.g,i.b),o.setXYZ(37,i.r,i.g,i.b),o.setXYZ(38,r.r,r.g,r.b),o.setXYZ(39,r.r,r.g,r.b),o.setXYZ(40,n.r,n.g,n.b),o.setXYZ(41,n.r,n.g,n.b),o.setXYZ(42,n.r,n.g,n.b),o.setXYZ(43,n.r,n.g,n.b),o.setXYZ(44,n.r,n.g,n.b),o.setXYZ(45,n.r,n.g,n.b),o.setXYZ(46,n.r,n.g,n.b),o.setXYZ(47,n.r,n.g,n.b),o.setXYZ(48,n.r,n.g,n.b),o.setXYZ(49,n.r,n.g,n.b),o.needsUpdate=!0,this}update(){let e=this.geometry,t=this.pointMap,i=1,r=1,n,s;if(Pe.projectionMatrixInverse.copy(this.camera.projectionMatrixInverse),this.camera.reversedDepth===!0)n=1,s=0;else if(this.camera.coordinateSystem===Xe)n=-1,s=1;else if(this.camera.coordinateSystem===Ft)n=0,s=1;else throw new Error("THREE.CameraHelper.update(): Invalid coordinate system: "+this.camera.coordinateSystem);De("c",t,e,Pe,0,0,n),De("t",t,e,Pe,0,0,s),De("n1",t,e,Pe,-i,-r,n),De("n2",t,e,Pe,i,-r,n),De("n3",t,e,Pe,-i,r,n),De("n4",t,e,Pe,i,r,n),De("f1",t,e,Pe,-i,-r,s),De("f2",t,e,Pe,i,-r,s),De("f3",t,e,Pe,-i,r,s),De("f4",t,e,Pe,i,r,s),De("u1",t,e,Pe,i*.7,r*1.1,n),De("u2",t,e,Pe,-i*.7,r*1.1,n),De("u3",t,e,Pe,0,r*2,n),De("cf1",t,e,Pe,-i,0,s),De("cf2",t,e,Pe,i,0,s),De("cf3",t,e,Pe,0,-r,s),De("cf4",t,e,Pe,0,r,s),De("cn1",t,e,Pe,-i,0,n),De("cn2",t,e,Pe,i,0,n),De("cn3",t,e,Pe,0,-r,n),De("cn4",t,e,Pe,0,r,n),e.getAttribute("position").needsUpdate=!0}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};function De(a,e,t,i,r,n,s){Ic.set(r,n,s).unproject(i);let o=e[a];if(o!==void 0){let l=t.getAttribute("position");for(let c=0,h=o.length;c<h;c++)l.setXYZ(o[c],Ic.x,Ic.y,Ic.z)}}var Pc=new he,Lc=class extends Me{constructor(e,t=16776960){let i=new Uint16Array([0,1,1,2,2,3,3,0,4,5,5,6,6,7,7,4,0,4,1,5,2,6,3,7]),r=new Float32Array(8*3),n=new P;n.setIndex(new j(i,1)),n.setAttribute("position",new j(r,3)),super(n,new re({color:t,toneMapped:!1})),this.object=e,this.type="BoxHelper",this.matrixAutoUpdate=!1,this.update()}update(){if(this.object!==void 0&&Pc.setFromObject(this.object),Pc.isEmpty())return;let e=Pc.min,t=Pc.max,i=this.geometry.attributes.position,r=i.array;r[0]=t.x,r[1]=t.y,r[2]=t.z,r[3]=e.x,r[4]=t.y,r[5]=t.z,r[6]=e.x,r[7]=e.y,r[8]=t.z,r[9]=t.x,r[10]=e.y,r[11]=t.z,r[12]=t.x,r[13]=t.y,r[14]=e.z,r[15]=e.x,r[16]=t.y,r[17]=e.z,r[18]=e.x,r[19]=e.y,r[20]=e.z,r[21]=t.x,r[22]=e.y,r[23]=e.z,i.needsUpdate=!0,this.geometry.computeBoundingSphere()}setFromObject(e){return this.object=e,this.update(),this}copy(e,t){return super.copy(e,t),this.object=e.object,this}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};var Nc=class extends Me{constructor(e,t=16776960){let i=new Uint16Array([0,1,1,2,2,3,3,0,4,5,5,6,6,7,7,4,0,4,1,5,2,6,3,7]),r=[1,1,1,-1,1,1,-1,-1,1,1,-1,1,1,1,-1,-1,1,-1,-1,-1,-1,1,-1,-1],n=new P;n.setIndex(new j(i,1)),n.setAttribute("position",new R(r,3)),super(n,new re({color:t,toneMapped:!1})),this.box=e,this.type="Box3Helper",this.geometry.computeBoundingSphere()}updateMatrixWorld(e){let t=this.box;t.isEmpty()||(t.getCenter(this.position),t.getSize(this.scale),this.scale.multiplyScalar(.5),super.updateMatrixWorld(e))}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};var Dc=class extends ke{constructor(e,t=1,i=16776960){let r=i,n=[1,-1,0,-1,1,0,-1,-1,0,1,1,0,-1,1,0,-1,-1,0,1,-1,0,1,1,0],s=new P;s.setAttribute("position",new R(n,3)),s.computeBoundingSphere(),super(s,new re({color:r,toneMapped:!1})),this.type="PlaneHelper",this.plane=e,this.size=t;let o=[1,1,0,-1,1,0,-1,-1,0,1,1,0,-1,-1,0,1,-1,0],l=new P;l.setAttribute("position",new R(o,3)),l.computeBoundingSphere(),this.add(new ae(l,new Se({color:r,opacity:.2,transparent:!0,depthWrite:!1,toneMapped:!1})))}updateMatrixWorld(e){this.position.set(0,0,0),this.scale.set(.5*this.size,.5*this.size,1),this.lookAt(this.plane.normal),this.translateZ(-this.plane.constant),super.updateMatrixWorld(e)}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose(),this.children[0].geometry.dispose(),this.children[0].material.dispose()}};var Yd=new y,Bc,Tu,Oc=class extends G{constructor(e=new y(0,0,1),t=new y(0,0,0),i=1,r=16776960,n=i*.2,s=n*.2){super(),this.type="ArrowHelper",Bc===void 0&&(Bc=new P,Bc.setAttribute("position",new R([0,0,0,0,1,0],3)),Tu=new bs(.5,1,5,1),Tu.translate(0,-.5,0)),this.position.copy(t),this.line=new ke(Bc,new re({color:r,toneMapped:!1})),this.line.matrixAutoUpdate=!1,this.add(this.line),this.cone=new ae(Tu,new Se({color:r,toneMapped:!1})),this.cone.matrixAutoUpdate=!1,this.add(this.cone),this.setDirection(e),this.setLength(i,n,s)}setDirection(e){if(e.y>.99999)this.quaternion.set(0,0,0,1);else if(e.y<-.99999)this.quaternion.set(1,0,0,0);else{Yd.set(e.z,0,-e.x).normalize();let t=Math.acos(e.y);this.quaternion.setFromAxisAngle(Yd,t)}}setLength(e,t=e*.2,i=t*.2){this.line.scale.set(1,Math.max(1e-4,e-t),1),this.line.updateMatrix(),this.cone.scale.set(i,t,i),this.cone.position.y=e,this.cone.updateMatrix()}setColor(e){this.line.material.color.set(e),this.cone.material.color.set(e)}copy(e){return super.copy(e,!1),this.line.copy(e.line),this.cone.copy(e.cone),this}dispose(){super.dispose(),this.line.geometry.dispose(),this.line.material.dispose(),this.cone.geometry.dispose(),this.cone.material.dispose()}};var Fc=class extends Me{constructor(e=1){let t=[0,0,0,e,0,0,0,0,0,0,e,0,0,0,0,0,0,e],i=[1,0,0,1,.6,0,0,1,0,.6,1,0,0,0,1,0,.6,1],r=new P;r.setAttribute("position",new R(t,3)),r.setAttribute("color",new R(i,3));let n=new re({vertexColors:!0,toneMapped:!1});super(r,n),this.type="AxesHelper"}setColors(e,t,i){let r=new I,n=this.geometry.attributes.color.array;return r.set(e),r.toArray(n,0),r.toArray(n,3),r.set(t),r.toArray(n,6),r.toArray(n,9),r.set(i),r.toArray(n,12),r.toArray(n,15),this.geometry.attributes.color.needsUpdate=!0,this}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};var Uc=class{constructor(){this.type="ShapePath",this.color=new I,this.subPaths=[],this.currentPath=null,this.userData={}}moveTo(e,t){return this.currentPath=new di,this.subPaths.push(this.currentPath),this.currentPath.moveTo(e,t),this}lineTo(e,t){return this.currentPath.lineTo(e,t),this}quadraticCurveTo(e,t,i,r){return this.currentPath.quadraticCurveTo(e,t,i,r),this}bezierCurveTo(e,t,i,r,n,s){return this.currentPath.bezierCurveTo(e,t,i,r,n,s),this}splineThru(e){return this.currentPath.splineThru(e),this}toShapes(){function e(l,c){let h=!1,u=c.length;for(let f=0,d=u-1;f<u;d=f++){let p=c[f],m=c[d];p.y>l.y!=m.y>l.y&&l.x<(m.x-p.x)*(l.y-p.y)/(m.y-p.y)+p.x&&(h=!h)}return h}function t(l,c){let h=c.getCenter(new T);if(e(h,l))return h;let u=h.y,f=[],d=l.length;for(let p=0;p<d;p++){let m=l[p],g=l[(p+1)%d];if(m.y>u!=g.y>u){let _=m.x+(u-m.y)*(g.x-m.x)/(g.y-m.y);f.push(_)}}return f.length>1&&(f.sort((p,m)=>p-m),h.x=(f[0]+f[1])/2),h}let i=this.userData.style&&this.userData.style.fillRule||"nonzero";i!=="nonzero"&&i!=="evenodd"&&(B('Fill-rule "'+i+'" is not supported, falling back to "nonzero".'),i="nonzero");let r=i==="nonzero"?l=>l!==0:l=>(l&1)!==0,n=[];for(let l of this.subPaths){let c=l.getPoints();if(c.length<3)continue;let h=ft.area(c);if(h===0)continue;let u=new ro;for(let f=0;f<c.length;f++)u.expandByPoint(c[f]);n.push({subPath:l,points:c,boundingBox:u,interiorPoint:t(c,u),absArea:Math.abs(h),winding:h<0?-1:1,container:null,exclude:!1,role:null})}n.sort((l,c)=>c.absArea-l.absArea);for(let l=0;l<n.length;l++){let c=n[l],h=0;for(let u=l-1;u>=0;u--){let f=n[u];if(f.boundingBox.containsBox(c.boundingBox)&&e(c.interiorPoint,f.points)){c.container=f.exclude?f.container:f,h=f.winding,c.winding+=h;break}}r(c.winding)===r(h)&&(c.exclude=!0)}for(let l of n)l.exclude||(l.role=l.container===null||l.container.role==="hole"?"outer":"hole");let s=[],o=new Map;for(let l of n){if(l.exclude||l.role!=="outer")continue;let c=new Vt;c.curves=l.subPath.curves,s.push(c),o.set(l,c)}for(let l of n){if(l.exclude||l.role!=="hole")continue;let c=o.get(l.container);if(!c)continue;let h=new di;h.curves=l.subPath.curves,c.holes.push(h)}return s}};var zc=class extends Ie{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}};function Xy(a,e){let t=a.image&&a.image.width?a.image.width/a.image.height:1;return t>e?(a.repeat.x=1,a.repeat.y=t/e,a.offset.x=0,a.offset.y=(1-a.repeat.y)/2):(a.repeat.x=e/t,a.repeat.y=1,a.offset.x=(1-a.repeat.x)/2,a.offset.y=0),a}function Yy(a,e){let t=a.image&&a.image.width?a.image.width/a.image.height:1;return t>e?(a.repeat.x=e/t,a.repeat.y=1,a.offset.x=(1-a.repeat.x)/2,a.offset.y=0):(a.repeat.x=1,a.repeat.y=t/e,a.offset.x=0,a.offset.y=(1-a.repeat.y)/2),a}function Zy(a){return a.repeat.x=1,a.repeat.y=1,a.offset.x=0,a.offset.y=0,a}function Jy(a,e,t,i){let r=jy(i);switch(t){case wo:return a*e;case Sr:return a*e/r.components*r.byteLength;case Mr:return a*e/r.components*r.byteLength;case Co:return a*e*2/r.components*r.byteLength;case Eo:return a*e*2/r.components*r.byteLength;case Ao:return a*e*3/r.components*r.byteLength;case je:return a*e*4/r.components*r.byteLength;case Io:return a*e*4/r.components*r.byteLength;case wr:case Ar:return Math.floor((a+3)/4)*Math.floor((e+3)/4)*8;case Tr:case Cr:return Math.floor((a+3)/4)*Math.floor((e+3)/4)*16;case dn:case mn:return Math.max(a,16)*Math.max(e,8)/4;case fn:case pn:return Math.max(a,8)*Math.max(e,8)/2;case gn:case _n:case yn:case vn:return Math.floor((a+3)/4)*Math.floor((e+3)/4)*8;case xn:case bn:case Sn:return Math.floor((a+3)/4)*Math.floor((e+3)/4)*16;case Mn:return Math.floor((a+3)/4)*Math.floor((e+3)/4)*16;case wn:return Math.floor((a+4)/5)*Math.floor((e+3)/4)*16;case An:return Math.floor((a+4)/5)*Math.floor((e+4)/5)*16;case Tn:return Math.floor((a+5)/6)*Math.floor((e+4)/5)*16;case Cn:return Math.floor((a+5)/6)*Math.floor((e+5)/6)*16;case En:return Math.floor((a+7)/8)*Math.floor((e+4)/5)*16;case In:return Math.floor((a+7)/8)*Math.floor((e+5)/6)*16;case Rn:return Math.floor((a+7)/8)*Math.floor((e+7)/8)*16;case Pn:return Math.floor((a+9)/10)*Math.floor((e+4)/5)*16;case Ln:return Math.floor((a+9)/10)*Math.floor((e+5)/6)*16;case Nn:return Math.floor((a+9)/10)*Math.floor((e+7)/8)*16;case Dn:return Math.floor((a+9)/10)*Math.floor((e+9)/10)*16;case Bn:return Math.floor((a+11)/12)*Math.floor((e+9)/10)*16;case On:return Math.floor((a+11)/12)*Math.floor((e+11)/12)*16;case Fn:case Un:case zn:return Math.ceil(a/4)*Math.ceil(e/4)*16;case kn:case Vn:return Math.ceil(a/4)*Math.ceil(e/4)*8;case Gn:case Hn:return Math.ceil(a/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function jy(a){switch(a){case Zt:case go:return{byteLength:1,components:1};case xo:case _o:case br:return{byteLength:2,components:1};case vo:case bo:return{byteLength:2,components:4};case Jt:case yo:case mt:return{byteLength:4,components:1};case So:case Mo:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${a}.`)}var kc=class{static contain(e,t){return Xy(e,t)}static cover(e,t){return Yy(e,t)}static fill(e){return Zy(e)}static getByteLength(e,t,i,r){return Jy(e,t,i,r)}};typeof window<"u"&&(window.__THREE__?B("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=oh);var Zd=`
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
`;var jd=`
#ifdef USE_ALPHAMAP

	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;

#endif
`;var Kd=`
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
`;var jp=`
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
`;var Kp=`
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
`;var jm=`
varying vec3 vWorldDirection;

#include <common>

void main() {

	vWorldDirection = transformDirection( position, modelMatrix );

	#include <begin_vertex>
	#include <project_vertex>

	gl_Position.z = gl_Position.w; // set z to camera.far

}
`,Km=`

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
`;var Q={alphahash_fragment:Zd,alphahash_pars_fragment:Jd,alphamap_fragment:jd,alphamap_pars_fragment:Kd,alphatest_fragment:$d,alphatest_pars_fragment:Qd,aomap_fragment:ep,aomap_pars_fragment:tp,batching_pars_vertex:ip,batching_vertex:rp,begin_vertex:np,beginnormal_vertex:sp,bsdfs:op,iridescence_fragment:ap,bumpmap_pars_fragment:lp,clipping_planes_fragment:cp,clipping_planes_pars_fragment:hp,clipping_planes_pars_vertex:up,clipping_planes_vertex:fp,color_fragment:dp,color_pars_fragment:pp,color_pars_vertex:mp,color_vertex:gp,common:_p,cube_uv_reflection_fragment:xp,defaultnormal_vertex:yp,displacementmap_pars_vertex:vp,displacementmap_vertex:bp,emissivemap_fragment:Sp,emissivemap_pars_fragment:Mp,colorspace_fragment:wp,colorspace_pars_fragment:Ap,envmap_fragment:Tp,envmap_common_pars_fragment:Cp,envmap_pars_fragment:Ep,envmap_pars_vertex:Ip,envmap_physical_pars_fragment:kp,envmap_vertex:Rp,fog_vertex:Pp,fog_pars_vertex:Lp,fog_fragment:Np,fog_pars_fragment:Dp,gradientmap_pars_fragment:Bp,lightmap_pars_fragment:Op,lights_lambert_fragment:Fp,lights_lambert_pars_fragment:Up,lights_pars_begin:zp,lights_toon_fragment:Vp,lights_toon_pars_fragment:Gp,lights_phong_fragment:Hp,lights_phong_pars_fragment:Wp,lights_physical_fragment:qp,lights_physical_pars_fragment:Xp,lights_fragment_begin:Yp,lights_fragment_maps:Zp,lights_fragment_end:Jp,lightprobes_pars_fragment:jp,logdepthbuf_fragment:Kp,logdepthbuf_pars_fragment:$p,logdepthbuf_pars_vertex:Qp,logdepthbuf_vertex:em,map_fragment:tm,map_pars_fragment:im,map_particle_fragment:rm,map_particle_pars_fragment:nm,metalnessmap_fragment:sm,metalnessmap_pars_fragment:om,morphinstance_vertex:am,morphcolor_vertex:lm,morphnormal_vertex:cm,morphtarget_pars_vertex:hm,morphtarget_vertex:um,normal_fragment_begin:fm,normal_fragment_maps:dm,normal_pars_fragment:pm,normal_pars_vertex:mm,normal_vertex:gm,normalmap_pars_fragment:_m,clearcoat_normal_fragment_begin:xm,clearcoat_normal_fragment_maps:ym,clearcoat_pars_fragment:vm,iridescence_pars_fragment:bm,opaque_fragment:Sm,packing:Mm,premultiplied_alpha_fragment:wm,project_vertex:Am,dithering_fragment:Tm,dithering_pars_fragment:Cm,roughnessmap_fragment:Em,roughnessmap_pars_fragment:Im,shadowmap_pars_fragment:Rm,shadowmap_pars_vertex:Pm,shadowmap_vertex:Lm,shadowmask_pars_fragment:Nm,skinbase_vertex:Dm,skinning_pars_vertex:Bm,skinning_vertex:Om,skinnormal_vertex:Fm,specularmap_fragment:Um,specularmap_pars_fragment:zm,tonemapping_fragment:km,tonemapping_pars_fragment:Vm,transmission_fragment:Gm,transmission_pars_fragment:Hm,uv_pars_fragment:Wm,uv_pars_vertex:qm,uv_vertex:Xm,worldpos_vertex:Ym,background_vert:Zm,background_frag:Jm,backgroundCube_vert:jm,backgroundCube_frag:Km,cube_vert:$m,cube_frag:Qm,depth_vert:eg,depth_frag:tg,distance_vert:ig,distance_frag:rg,equirect_vert:ng,equirect_frag:sg,linedashed_vert:og,linedashed_frag:ag,meshbasic_vert:lg,meshbasic_frag:cg,meshlambert_vert:hg,meshlambert_frag:ug,meshmatcap_vert:fg,meshmatcap_frag:dg,meshnormal_vert:pg,meshnormal_frag:mg,meshphong_vert:gg,meshphong_frag:_g,meshphysical_vert:xg,meshphysical_frag:yg,meshtoon_vert:vg,meshtoon_frag:bg,points_vert:Sg,points_frag:Mg,shadow_vert:wg,shadow_frag:Ag,sprite_vert:Tg,sprite_frag:Cg};var O={common:{diffuse:{value:new I(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Y},alphaMap:{value:null},alphaMapTransform:{value:new Y},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Y}},envmap:{envMap:{value:null},envMapRotation:{value:new Y},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Y}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Y}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Y},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Y},normalScale:{value:new T(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Y},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Y}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Y}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Y}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new I(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new y},probesMax:{value:new y},probesResolution:{value:new y}},points:{diffuse:{value:new I(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Y},alphaTest:{value:0},uvTransform:{value:new Y}},sprite:{diffuse:{value:new I(16777215)},opacity:{value:1},center:{value:new T(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Y},alphaMap:{value:null},alphaMapTransform:{value:new Y},alphaTest:{value:0}}};var Vc={basic:{uniforms:rt([O.common,O.specularmap,O.envmap,O.aomap,O.lightmap,O.fog]),vertexShader:Q.meshbasic_vert,fragmentShader:Q.meshbasic_frag},lambert:{uniforms:rt([O.common,O.specularmap,O.envmap,O.aomap,O.lightmap,O.emissivemap,O.bumpmap,O.normalmap,O.displacementmap,O.fog,O.lights,{emissive:{value:new I(0)},envMapIntensity:{value:1}}]),vertexShader:Q.meshlambert_vert,fragmentShader:Q.meshlambert_frag},phong:{uniforms:rt([O.common,O.specularmap,O.envmap,O.aomap,O.lightmap,O.emissivemap,O.bumpmap,O.normalmap,O.displacementmap,O.fog,O.lights,{emissive:{value:new I(0)},specular:{value:new I(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Q.meshphong_vert,fragmentShader:Q.meshphong_frag},standard:{uniforms:rt([O.common,O.envmap,O.aomap,O.lightmap,O.emissivemap,O.bumpmap,O.normalmap,O.displacementmap,O.roughnessmap,O.metalnessmap,O.fog,O.lights,{emissive:{value:new I(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Q.meshphysical_vert,fragmentShader:Q.meshphysical_frag},toon:{uniforms:rt([O.common,O.aomap,O.lightmap,O.emissivemap,O.bumpmap,O.normalmap,O.displacementmap,O.gradientmap,O.fog,O.lights,{emissive:{value:new I(0)}}]),vertexShader:Q.meshtoon_vert,fragmentShader:Q.meshtoon_frag},matcap:{uniforms:rt([O.common,O.bumpmap,O.normalmap,O.displacementmap,O.fog,{matcap:{value:null}}]),vertexShader:Q.meshmatcap_vert,fragmentShader:Q.meshmatcap_frag},points:{uniforms:rt([O.points,O.fog]),vertexShader:Q.points_vert,fragmentShader:Q.points_frag},dashed:{uniforms:rt([O.common,O.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Q.linedashed_vert,fragmentShader:Q.linedashed_frag},depth:{uniforms:rt([O.common,O.displacementmap]),vertexShader:Q.depth_vert,fragmentShader:Q.depth_frag},normal:{uniforms:rt([O.common,O.bumpmap,O.normalmap,O.displacementmap,{opacity:{value:1}}]),vertexShader:Q.meshnormal_vert,fragmentShader:Q.meshnormal_frag},sprite:{uniforms:rt([O.sprite,O.fog]),vertexShader:Q.sprite_vert,fragmentShader:Q.sprite_frag},background:{uniforms:{uvTransform:{value:new Y},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Q.background_vert,fragmentShader:Q.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Y}},vertexShader:Q.backgroundCube_vert,fragmentShader:Q.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Q.cube_vert,fragmentShader:Q.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Q.equirect_vert,fragmentShader:Q.equirect_frag},distance:{uniforms:rt([O.common,O.displacementmap,{referencePosition:{value:new y},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Q.distance_vert,fragmentShader:Q.distance_frag},shadow:{uniforms:rt([O.lights,O.fog,{color:{value:new I(0)},opacity:{value:1}}]),vertexShader:Q.shadow_vert,fragmentShader:Q.shadow_frag}};Vc.physical={uniforms:rt([Vc.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Y},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Y},clearcoatNormalScale:{value:new T(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Y},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Y},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Y},sheen:{value:0},sheenColor:{value:new I(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Y},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Y},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Y},transmissionSamplerSize:{value:new T},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Y},attenuationDistance:{value:0},attenuationColor:{value:new I(0)},specularColor:{value:new I(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Y},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Y},anisotropyVector:{value:new T},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Y}}]),vertexShader:Q.meshphysical_vert,fragmentShader:Q.meshphysical_frag};var ao=4,pv=6,mv=20,gv=256,sa=new Ht,Eg=new I,Cu=null,Eu=0,Iu=0,Ru=!1,_v=new y,nn=new y,Gc=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,i=.1,r=100,n={}){let{size:s=256,position:o=_v}=n;Cu=this._renderer.getRenderTarget(),Eu=this._renderer.getActiveCubeFace(),Iu=this._renderer.getActiveMipmapLevel(),Ru=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(s);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,i,r,l,o),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Pg(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Rg(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Cu,Eu,Iu),this._renderer.xr.enabled=Ru,e.scissorTest=!1,oo(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Bt||e.mapping===un?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Cu=this._renderer.getRenderTarget(),Eu=this._renderer.getActiveCubeFace(),Iu=this._renderer.getActiveMipmapLevel(),Ru=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:de,minFilter:de,generateMipmaps:!1,type:br,format:je,colorSpace:Ke,depthBuffer:!1},r=Ig(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Ig(e,t,i);let{_lodMax:n}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=xv(n)),this._blurMaterial=vv(n,e,t),this._ggxMaterial=yv(n,e,t)}return r}_compileMaterial(e){let t=new ae(new P,e);this._renderer.compile(t,sa)}_sceneToCubeUV(e,t,i,r,n){let l=new ge(90,1,t,i),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],u=this._renderer,f=u.autoClear,d=u.toneMapping;u.getClearColor(Eg),u.toneMapping=hn,u.autoClear=!1,u.state.buffers.depth.getReversed()&&(u.setRenderTarget(r),u.clearDepth(),u.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new ae(new rr,new Se({name:"PMREM.Background",side:wi,depthWrite:!1,depthTest:!1})));let m=this._backgroundBox,g=m.material,_=!1,x=e.background;x?x.isColor&&(g.color.copy(x),e.background=null,_=!0):(g.color.copy(Eg),_=!0);for(let v=0;v<6;v++){let b=v%3;b===0?(l.up.set(0,c[v],0),l.position.set(n.x,n.y,n.z),l.lookAt(n.x+h[v],n.y,n.z)):b===1?(l.up.set(0,0,c[v]),l.position.set(n.x,n.y,n.z),l.lookAt(n.x,n.y+h[v],n.z)):(l.up.set(0,c[v],0),l.position.set(n.x,n.y,n.z),l.lookAt(n.x,n.y,n.z+h[v]));let M=this._cubeSize;oo(r,b*M,v>2?M:0,M,M),u.setRenderTarget(r),_&&u.render(m,l),u.render(e,l)}u.toneMapping=d,u.autoClear=f,e.background=x}_textureToCubeUV(e,t){let i=this._renderer,r=e.mapping===Bt||e.mapping===un;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Pg()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Rg());let n=r?this._cubemapMaterial:this._equirectMaterial,s=this._lodMeshes[0];s.material=n;let o=n.uniforms;o.envMap.value=e;let l=this._cubeSize;oo(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(s,sa)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let r=this._lodMeshes.length;for(let n=1;n<r;n++)this._applyGGXFilter(e,n-1,n);t.autoClear=i}_applyGGXFilter(e,t,i){let r=this._renderer,n=this._pingPongRenderTarget,s=this._ggxMaterial,o=this._lodMeshes[i];o.material=s;let l=s.uniforms,c=i/(this._lodMeshes.length-1),h=t/(this._lodMeshes.length-1),u=Math.sqrt(c*c-h*h),f=c*1.25,d=u*f,{_lodMax:p}=this,m=this._sizeLods[i],g=3*m*(i>p-ao?i-p+ao:0),_=4*(this._cubeSize-m);l.envMap.value=e.texture,l.roughness.value=d,l.mipInt.value=p-t,oo(n,g,_,3*m,2*m),r.setRenderTarget(n),r.render(o,sa),l.envMap.value=n.texture,l.roughness.value=0,l.mipInt.value=p-i,oo(e,g,_,3*m,2*m),r.setRenderTarget(e),r.render(o,sa)}_blur(e,t,i,r){let n=this._pingPongRenderTarget,s=Math.min(r,Math.PI)/Math.SQRT2;this._blurPass(e,n,t,i,s),this._blurPass(n,e,i,i,s)}_blurPass(e,t,i,r,n){let s=this._renderer,o=this._blurMaterial,l=this._lodMeshes[r];l.material=o;let c=o.uniforms;c.envMap.value=e.texture,c.sigma.value=n,c.mipInt.value=this._lodMax-i;let h=this._sizeLods[r],u=3*h*(r>this._lodMax-ao?r-this._lodMax+ao:0),f=4*(this._cubeSize-h);oo(t,u,f,3*h,2*h),s.setRenderTarget(t),s.render(l,sa)}};function xv(a){let e=[],t=[],i=a,r=a-ao+1+pv;for(let n=0;n<r;n++){let s=Math.pow(2,i);e.push(s);let o=1/(s-2),l=-o,c=1+o,h=[l,l,c,l,c,c,l,l,c,c,l,c],u=6,f=6,d=3,p=new Float32Array(d*f*u),m=new Float32Array(d*f*u);for(let _=0;_<u;_++){let x=_%3*2/3-1,v=_>2?0:-1,b=[x,v,0,x+2/3,v,0,x+2/3,v+1,0,x,v,0,x+2/3,v+1,0,x,v+1,0];p.set(b,d*f*_);for(let M=0;M<f;M++){let S=h[M*2]*2-1,A=h[M*2+1]*2-1;_===0?nn.set(1,A,S):_===1?nn.set(-S,1,-A):_===2?nn.set(-S,A,1):_===3?nn.set(-1,A,-S):_===4?nn.set(-S,-1,A):nn.set(S,A,-1),nn.toArray(m,(_*f+M)*d)}}let g=new P;g.setAttribute("position",new j(p,d)),g.setAttribute("outputDirection",new j(m,d)),t.push(new ae(g,null)),i>ao&&i--}return{lodMeshes:t,sizeLods:e}}function Ig(a,e,t){let i=new Ut(a,e,t);return i.texture.mapping=po,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function oo(a,e,t,i,r){a.viewport.set(e,t,i,r),a.scissor.set(e,t,i,r)}function yv(a,e,t){return new dt({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:gv,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${a}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Hc(),fragmentShader:`

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
		`,blending:Ui,depthTest:!1,depthWrite:!1})}function vv(a,e,t){return new dt({name:"SphericalGaussianBlur",defines:{SAMPLES:mv,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${a}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Hc(),fragmentShader:`

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
		`,blending:Ui,depthTest:!1,depthWrite:!1})}function Rg(){return new dt({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Hc(),fragmentShader:`

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
		`,blending:Ui,depthTest:!1,depthWrite:!1})}function Pg(){return new dt({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Hc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Ui,depthTest:!1,depthWrite:!1})}function Hc(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var Wc=class extends Ut{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new fi(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new rr(5,5,5),n=new dt({name:"CubemapFromEquirect",uniforms:Cs(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:wi,blending:Ui});n.uniforms.tEquirect.value=t;let s=new ae(r,n),o=t.minFilter;return t.minFilter===Ot&&(t.minFilter=de),new $s(1,10,this).update(e,s),t.minFilter=o,s.geometry.dispose(),s.material.dispose(),this}clear(e,t=!0,i=!0,r=!0){let n=e.getRenderTarget();for(let s=0;s<6;s++)e.setRenderTarget(this,s),e.clear(t,i,r);e.setRenderTarget(n)}};function Lg(a,e){function t(i,r=Rr){let n,s=Le.getTransfer(r);if(i===Zt)return a.UNSIGNED_BYTE;if(i===vo)return a.UNSIGNED_SHORT_4_4_4_4;if(i===bo)return a.UNSIGNED_SHORT_5_5_5_1;if(i===So)return a.UNSIGNED_INT_5_9_9_9_REV;if(i===Mo)return a.UNSIGNED_INT_10F_11F_11F_REV;if(i===go)return a.BYTE;if(i===_o)return a.SHORT;if(i===xo)return a.UNSIGNED_SHORT;if(i===yo)return a.INT;if(i===Jt)return a.UNSIGNED_INT;if(i===mt)return a.FLOAT;if(i===br)return a.HALF_FLOAT;if(i===wo)return a.ALPHA;if(i===Ao)return a.RGB;if(i===je)return a.RGBA;if(i===ki)return a.DEPTH_COMPONENT;if(i===To)return a.DEPTH_STENCIL;if(i===Sr)return a.RED;if(i===Mr)return a.RED_INTEGER;if(i===Co)return a.RG;if(i===Eo)return a.RG_INTEGER;if(i===Io)return a.RGBA_INTEGER;if(i===wr||i===Ar||i===Tr||i===Cr)if(s===be)if(n=e.get("WEBGL_compressed_texture_s3tc_srgb"),n!==null){if(i===wr)return n.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===Ar)return n.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Tr)return n.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Cr)return n.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(n=e.get("WEBGL_compressed_texture_s3tc"),n!==null){if(i===wr)return n.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===Ar)return n.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Tr)return n.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Cr)return n.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===fn||i===dn||i===pn||i===mn)if(n=e.get("WEBGL_compressed_texture_pvrtc"),n!==null){if(i===fn)return n.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===dn)return n.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===pn)return n.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===mn)return n.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===gn||i===_n||i===xn||i===yn||i===vn||i===bn||i===Sn)if(n=e.get("WEBGL_compressed_texture_etc"),n!==null){if(i===gn||i===_n)return s===be?n.COMPRESSED_SRGB8_ETC2:n.COMPRESSED_RGB8_ETC2;if(i===xn)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:n.COMPRESSED_RGBA8_ETC2_EAC;if(i===yn)return n.COMPRESSED_R11_EAC;if(i===vn)return n.COMPRESSED_SIGNED_R11_EAC;if(i===bn)return n.COMPRESSED_RG11_EAC;if(i===Sn)return n.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===Mn||i===wn||i===An||i===Tn||i===Cn||i===En||i===In||i===Rn||i===Pn||i===Ln||i===Nn||i===Dn||i===Bn||i===On)if(n=e.get("WEBGL_compressed_texture_astc"),n!==null){if(i===Mn)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:n.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===wn)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:n.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===An)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:n.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===Tn)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:n.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===Cn)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:n.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===En)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:n.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===In)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:n.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Rn)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:n.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Pn)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:n.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Ln)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:n.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Nn)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:n.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Dn)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:n.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Bn)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:n.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===On)return s===be?n.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:n.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Fn||i===Un||i===zn)if(n=e.get("EXT_texture_compression_bptc"),n!==null){if(i===Fn)return s===be?n.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:n.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Un)return n.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===zn)return n.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===kn||i===Vn||i===Gn||i===Hn)if(n=e.get("EXT_texture_compression_rgtc"),n!==null){if(i===kn)return n.COMPRESSED_RED_RGTC1_EXT;if(i===Vn)return n.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Gn)return n.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Hn)return n.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===dh?a.UNSIGNED_INT_24_8:a[i]!==void 0?a[i]:null}return{convert:t}}var oa=class extends Error{constructor(e,t,i="1B"){super(`three.unsupported: ${e}${t?` (${t})`:""}${i==="1B"?"; native R1 does not provide this capability; use the 1B backend where available":""}`),this.name="ThreeCapabilityError",this.code="three.unsupported",this.feature=e,this.backend=i}};function L(a,e,t){throw new oa(a,e,t)}var qc=class{constructor(){L("WebGPU","WebGPU/TSL compute is outside both the R1 and WebGL2 bundles","none")}};function st(a,e){let t=new Error(`three.assetFailure: ${a}${e?`: ${e}`:""}`);return t.name="ThreeAssetError",t.code="three.assetFailure",t.url=a,t}function ot(a,e){if(typeof a!="number"||!Number.isFinite(a))throw new Error(`three.invalid: ${e} must be finite`);return a}function sn(a,e){if(!Number.isInteger(a)||a<0||a>4294967295)throw new Error(`three.invalid: ${e} is outside u32`);return a>>>0}var Ee=typeof globalThis<"u"?globalThis:{},aa="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",dr=null;function ha(a,e=!0){let t=String(a);if(e&&typeof TextEncoder<"u")return new TextEncoder().encode(t);let i=[];for(let r=0;r<t.length;r++){let n=t.charCodeAt(r);if(n>=55296&&n<=56319&&r+1<t.length){let s=t.charCodeAt(r+1);s>=56320&&s<=57343?(n=65536+(n-55296<<10)+s-56320,r++):n=65533}else n>=55296&&n<=57343&&(n=65533);n<128?i.push(n):n<2048?i.push(192|n>>6,128|n&63):n<65536?i.push(224|n>>12,128|n>>6&63,128|n&63):i.push(240|n>>18,128|n>>12&63,128|n>>6&63,128|n&63)}return new Uint8Array(i)}function Nu(a){let e="";for(let t=0;t<a.length;){let i=a[t++],r=i,n=0,s=0;if(i>=194&&i<=223)r=i&31,n=1,s=128;else if(i>=224&&i<=239)r=i&15,n=2,s=2048;else if(i>=240&&i<=244)r=i&7,n=3,s=65536;else if(i>=128){e+="\uFFFD";continue}if(t+n>a.length){e+="\uFFFD";break}let o=!0;for(let l=0;l<n;l++){let c=a[t++];if((c&192)!==128){o=!1,t--;break}r=r<<6|c&63}!o||r<s||r>1114111||r>=55296&&r<=57343?e+="\uFFFD":e+=String.fromCodePoint(r)}return e}function bv(){typeof Ee.TextDecoder>"u"&&(Ee.TextDecoder=class{constructor(a="utf-8"){let e=String(a).toLowerCase().replace("_","-");if(e!=="utf-8"&&e!=="utf8")throw new RangeError(`three.invalid: unsupported TextDecoder label ${a}`)}decode(a){if(a===void 0)return"";if(!(a instanceof ArrayBuffer)&&!ArrayBuffer.isView(a))throw new TypeError("three.invalid: TextDecoder.decode expects an ArrayBuffer or view");return Nu(on(a))}}),typeof Ee.TextEncoder>"u"&&(Ee.TextEncoder=class{encode(a){return ha(a,!1)}})}function on(a){if(a instanceof Uint8Array)return new Uint8Array(a);if(a instanceof ArrayBuffer)return new Uint8Array(a.slice(0));if(ArrayBuffer.isView(a))return new Uint8Array(a.buffer.slice(a.byteOffset,a.byteOffset+a.byteLength));if(typeof a!="string")throw st("<bytes>","expected base64 or a typed array");let e=a.replace(/\s/g,"");if(e.length%4===1||/[^A-Za-z0-9+/=_-]/.test(e))throw st("<bytes>","invalid base64");let t=e.replace(/-/g,"+").replace(/_/g,"/"),i=[],r=0,n=0;for(let s=0;s<t.length;s++){let o=t[s];if(o==="=")break;let l=aa.indexOf(o);if(l<0)throw st("<bytes>","invalid base64");r=r<<6|l,n+=6,n>=8&&(n-=8,i.push(r>>n&255))}return new Uint8Array(i)}function Sv(a){let e=on(a),t="";for(let i=0;i<e.length;i+=3){let r=e[i],n=i+1<e.length?e[i+1]:0,s=i+2<e.length?e[i+2]:0,o=r<<16|n<<8|s;t+=aa[o>>18&63]+aa[o>>12&63]+(i+1<e.length?aa[o>>6&63]:"=")+(i+2<e.length?aa[o&63]:"=")}return t}function Pu(a,e,t){let i=ha(a);if(i.length<1||i.length>t)throw new Error(`three.invalid: ${e} UTF-8 length must be 1..${t}`);return String(a)}function Ng(a){return a._listeners=new Map,a.addEventListener=function(e,t,i){if(!t)return;let r=this._listeners.get(e)||[],n=i===!0||!!(i&&i.capture);r.some(s=>s.callback===t&&s.capture===n)||(r.push({callback:t,capture:n,once:!!(i&&i.once)}),this._listeners.set(e,r),this._listenBacking&&this._listenBacking(e))},a.removeEventListener=function(e,t,i){let r=this._listeners.get(e);if(!r)return;let n=i===!0||!!(i&&i.capture);this._listeners.set(e,r.filter(s=>s.callback!==t||s.capture!==n))},a.dispatchEvent=function(e){if(typeof e=="string"&&(e={type:e}),!e||!e.type)throw new Error("three.invalid: event.type is required");e.preventDefault||(e.preventDefault=function(){this.defaultPrevented=!0}),e.stopPropagation||(e.stopPropagation=function(){this.cancelBubble=!0});try{e.target||(e.target=this)}catch{}try{e.currentTarget=this}catch{}let t=(this._listeners.get(e.type)||[]).slice();for(let i of t)i.once&&this.removeEventListener(e.type,i.callback,{capture:i.capture}),typeof i.callback=="function"?i.callback.call(this,e):i.callback&&typeof i.callback.handleEvent=="function"&&i.callback.handleEvent(e);return!e.defaultPrevented},a}var Lu=class{constructor(e){this.runtime=e,this.visibilityState="visible",this.hidden=!1,this.activeElement=null,this.documentElement={style:{}},this.defaultView={get devicePixelRatio(){return e.pixelRatio},get innerWidth(){return e.width},get innerHeight(){return e.height},addEventListener:(t,i,r)=>this.addEventListener(t,i,r),removeEventListener:(t,i,r)=>this.removeEventListener(t,i,r),requestAnimationFrame:t=>e.requestAnimationFrame(t),cancelAnimationFrame:t=>e.cancelAnimationFrame(t)},Ng(this)}hasFocus(){return this.activeElement!==null}_setVisibility(e){this.hidden=!!e,this.visibilityState=e?"hidden":"visible",this.dispatchEvent({type:"visibilitychange"})}},la=class{constructor(e,t,i,r={}){this.runtime=e,this.canvasId=t,this.engineId=e.engineId,this.generation=i,this.surfaceId=r.surfaceId||`${t}#${i}`,Pu(this.surfaceId,"surfaceId",128),this.isJsrThreeCanvas=!0,this.style={},this._pixelRatio=r.pixelRatio||e.pixelRatio,this._cssWidth=r.width||300,this._cssHeight=r.height||150,this._width=Math.max(0,Math.floor(this._cssWidth*this._pixelRatio)),this._height=Math.max(0,Math.floor(this._cssHeight*this._pixelRatio)),this._captured=new Set,this._disposed=!1,this._mounted=!1,this._assetEpoch=0,this._focused=!1,this.ownerDocument=e.document,this.tabIndex=0,this._backing=null,this._backingListeners=new Map,Ng(this),e.web&&this._createBacking(r)}_createBacking(e){let t=e.canvas||e.offscreenCanvas;t?this._backing=t:typeof OffscreenCanvas<"u"?this._backing=new OffscreenCanvas(this._width,this._height):typeof document<"u"&&document.createElement?(this._backing=document.createElement("canvas"),this._backing.width=this._width,this._backing.height=this._height):L("webgl2","OffscreenCanvas or a canvas element is required"),this._backing.style&&(this.style=this._backing.style),this._backing.ownerDocument&&(this.ownerDocument=this._backing.ownerDocument),this._backing.width=this._width,this._backing.height=this._height}_listenBacking(e){if(!this._backing||this._backingListeners.has(e)||!this._backing.addEventListener)return;let t=i=>this.dispatchEvent(i);this._backingListeners.set(e,t),this._backing.addEventListener(e,t)}get width(){return this._width}set width(e){this._setPhysicalSize(e,this._height)}get height(){return this._height}set height(e){this._setPhysicalSize(this._width,e)}get clientWidth(){return this._cssWidth}get clientHeight(){return this._cssHeight}get pixelRatio(){return this._pixelRatio}get devicePixelRatio(){return this._pixelRatio}get disposed(){return this._disposed}get mounted(){return this._mounted}get context(){return this._context||null}_setPhysicalSize(e,t){if(!Number.isFinite(e)||!Number.isFinite(t)||e<0||t<0)throw new Error("three.invalid: canvas dimensions must be non-negative finite numbers");this._width=Math.floor(e),this._height=Math.floor(t),this._cssWidth=this._width/this._pixelRatio,this._cssHeight=this._height/this._pixelRatio,this._backing&&(this._backing.width=this._width,this._backing.height=this._height)}_setSize(e,t,i,r){if(!Number.isFinite(e)||!Number.isFinite(t)||e<0||t<0||e>16384||t>16384)throw new Error("three.invalid: canvas size must be within 0..16384");if(!Number.isFinite(i)||i<=0||i>16)throw new Error("three.invalid: pixel ratio must be within (0,16]");if(this._cssWidth=e,this._cssHeight=t,this._pixelRatio=i,this._width=Math.floor(e*i),this._height=Math.floor(t*i),this._width>16384||this._height>16384)throw new Error("three.invalid: drawing buffer exceeds 16384 pixels");this._backing&&(this._backing.width=this._width,this._backing.height=this._height),r!==!1&&(this.style.width=`${e}px`,this.style.height=`${t}px`)}setPixelRatio(e){this._setSize(this._cssWidth,this._cssHeight,e,!1)}setSize(e,t,i=!0){this._setSize(e,t,this._pixelRatio,i)}getContext(e,t){if(this._disposed)throw new Error("three.surface: canvas is disposed");this.runtime.web||L("rawWebGL",`canvas.getContext(${e}) requires the 1B backend`),e!=="webgl2"&&e!=="webgl"&&L("canvasContext",e),(!this._backing||!this._backing.getContext)&&L("webgl2","backing canvas has no getContext");let i=this._backing.getContext(e==="webgl"?"webgl2":e,t);return i||L("webgl2","WebGL2 context creation failed"),this._context=i,i}setAttribute(e,t){this._backing&&this._backing.setAttribute?this._backing.setAttribute(e,t):this[`_${e}`]=t}getAttribute(e){return this._backing&&this._backing.getAttribute?this._backing.getAttribute(e):this[`_${e}`]}removeAttribute(e){this._backing&&this._backing.removeAttribute&&this._backing.removeAttribute(e)}focus(){this._disposed||(this._backing&&this._backing.focus&&this._backing.focus(),this._focused=!0,this.ownerDocument.activeElement=this,this.dispatchEvent({type:"focus"}))}blur(){this._backing&&this._backing.blur&&this._backing.blur(),this._focused=!1,this.ownerDocument.activeElement===this&&(this.ownerDocument.activeElement=null),this.dispatchEvent({type:"blur"})}setPointerCapture(e){this._captured.add(e),this._backing&&this._backing.setPointerCapture&&this._backing.setPointerCapture(e),this.dispatchEvent({type:"gotpointercapture",pointerId:e})}releasePointerCapture(e){if(this._captured.delete(e),this._backing&&this._backing.releasePointerCapture)try{this._backing.releasePointerCapture(e)}catch{}this.dispatchEvent({type:"lostpointercapture",pointerId:e})}hasPointerCapture(e){return this._captured.has(e)}getBoundingClientRect(){return this._backing&&this._backing.getBoundingClientRect?this._backing.getBoundingClientRect():{x:0,y:0,left:0,top:0,width:this.clientWidth,height:this.clientHeight,right:this.clientWidth,bottom:this.clientHeight}}present(e){return this.runtime.present(this,e)}transferToImageBitmap(){if(this._backing&&this._backing.transferToImageBitmap)return this._backing.transferToImageBitmap();L("present","transferToImageBitmap is unavailable on the backing canvas")}transferControlToOffscreen(){L("offscreenTransfer","canvas is already owned by the JSR surface")}toDataURL(){L("canvas2d","capture belongs to the JSR host")}toBlob(){L("canvas2d","capture belongs to the JSR host")}_detach(){this._mounted=!1,this._assetEpoch++,this.runtime._clearInput(this,!0)}dispose(){if(!this._disposed){if(this._detach(),this._disposed=!0,this._listeners.clear(),this._backing&&this._backing.removeEventListener)for(let[e,t]of this._backingListeners)this._backing.removeEventListener(e,t);this._backingListeners.clear(),this.runtime._canvasDisposed(this)}}},ca=class{constructor(e,t=!1,i={}){this.jsr=e,this.web=t,this.engineId=Pu(e.instanceId===void 0?"default":e.instanceId,"engineId",128),this.pixelRatio=Number.isFinite(i.devicePixelRatio)?i.devicePixelRatio:Number.isFinite(Ee.devicePixelRatio)?Ee.devicePixelRatio:1,this.width=Number.isFinite(i.width)?i.width:Number.isFinite(Ee.innerWidth)?Ee.innerWidth:640,this.height=Number.isFinite(i.height)?i.height:Number.isFinite(Ee.innerHeight)?Ee.innerHeight:360,this.canvases=new Map,this.assets=new Map,this.generations=new Map,this.presentHook=null,this.heldKeys=new Map,this.activeCanvas=null,this.hostAssetLoader=typeof i.loadAssetBytes=="function"?i.loadAssetBytes:null,this.document=new Lu(this),this.capabilities=Object.freeze({backend:t?"webgl2":"flutterGpu",rawWebGL:!!t,webgl2:!!t,r1:!t,shaderMaterial:!!t,webgpu:!1,dom:!1})}createCanvas(e="main",t={}){e=String(e||"main"),Pu(e,"canvasId",112);let i=this.canvases.get(e);if(i&&!i.disposed)return i;let r=(this.generations.get(e)||0)+1;this.generations.set(e,r);let n=new la(this,e,r,t);return this.canvases.set(e,n),n}getCanvas(e="main"){return this.canvases.get(String(e))||null}_canvasDisposed(e){this.web&&this._releaseWebCanvas(e,!0),this.activeCanvas===e&&(this.activeCanvas=null),this.document.activeElement===e&&(this.document.activeElement=null),this.canvases.get(e.canvasId)===e&&this.canvases.delete(e.canvasId)}_prepareTree(e){let t=new Set,i=new Set,r=n=>{if(!(!n||typeof n!="object"||t.has(n))){if(t.add(n),n.type==="three"){let s=n.canvasId===void 0?"main":String(n.canvasId),o=this.createCanvas(s);n.canvasId=s,n.engineId=o.engineId,n.surfaceId=o.surfaceId,n.generation=o.generation,o._mounted=!0,o._webFrames&&(o._webFrames.released=!1),i.add(o)}if(Array.isArray(n))for(let s of n)r(s);else for(let s of Object.keys(n))s!=="canvas"&&s!=="renderer"&&r(n[s])}};r(e);for(let n of this.canvases.values())n.mounted&&!i.has(n)&&n._detach();return e}_keyEvent(e,t){let i=Object.assign({},e,{type:t?"keydown":"keyup",down:t,key:e.key||"",code:e.code||e.key||"",repeat:!!e.repeat}),r=i.code||i.key;t?this.heldKeys.set(r,i):this.heldKeys.delete(r),this.document.dispatchEvent(i);let n=this.document.activeElement,s=n&&n.isJsrThreeCanvas?n:this.document.hasFocus()?null:this.activeCanvas;return s&&!s.disposed&&s.dispatchEvent(i),!0}_pointerEvent(e,t){let i=e.dispatchEvent(t),r=e.ownerDocument;return r&&r.runtime===this&&r.dispatchEvent(t),i}_clearInput(e,t){let i=Array.from(this.heldKeys.values());this.heldKeys.clear();for(let n of i){let s=Object.assign({},n,{type:"keyup",down:!1,repeat:!1});this.document.dispatchEvent(s);let o=e||this.activeCanvas;o&&!o.disposed&&o.dispatchEvent(s)}let r=e?[e]:Array.from(this.canvases.values());for(let n of r){for(let s of Array.from(n._captured))this._pointerEvent(n,{type:"pointercancel",pointerId:s,pointerType:"unknown"}),this._pointerEvent(n,{type:"pointerup",pointerId:s,pointerType:"unknown",button:0}),n.hasPointerCapture(s)&&n.releasePointerCapture(s);t&&n.blur()}return t&&this.document.dispatchEvent({type:"blur"}),!0}_hostEvent(e,t={}){if(e==="key")return this._keyEvent(t,t.down!==!1);if(e==="blur")return this._clearInput(null,!0);if(e==="viewport")return this._setViewport(t.width,t.height,t.pixelRatio||t.dpr);if(e==="frameAck"||e==="release"||e==="jsr.three.frameAck"||e==="jsr.three.release")return this._frameControl(Object.assign({},t,{type:e==="frameAck"||e==="release"?`jsr.three.${e}`:e}));if(typeof e=="string"&&e.startsWith("input:"))return this._dispatchEvent(e.slice(6),t);throw new Error(`three.invalid: unknown host event ${e}`)}_dispatchEvent(e,t={}){let i=this.getCanvas(e);if(!i||i.disposed)return!1;let r=t.type||"";if(r==="keydown"||r==="keyup")return this._keyEvent(t,r==="keydown");if(r==="blur")return this._clearInput(i,!0);if(r==="visibility"||r==="visibilitychange"){let s=t.hidden!==void 0?!!t.hidden:!t.visible;return s&&this._clearInput(i,!0),this.document._setVisibility(s),i.dispatchEvent(Object.assign({},t,{type:"visibilitychange",hidden:s}))}if(r==="resize")return Number.isFinite(t.width)&&Number.isFinite(t.height)&&((t.pixelRatio!==void 0||t.dpr!==void 0)&&i.setPixelRatio(t.pixelRatio||t.dpr),i.renderer?i.renderer.setSize(t.width,t.height,!1):i.setSize(t.width,t.height,!1)),this._setViewport(t.width,t.height,t.pixelRatio||t.dpr),i.dispatchEvent(t);r==="pointerdown"&&(this.activeCanvas=i,i.focus());let n=r.startsWith("pointer")?this._pointerEvent(i,t):i.dispatchEvent(t);return(r==="pointerup"||r==="pointercancel")&&i.hasPointerCapture(t.pointerId)&&i.releasePointerCapture(t.pointerId),n}_setViewport(e,t,i){Number.isFinite(e)&&(this.width=e),Number.isFinite(t)&&(this.height=t),Number.isFinite(i)&&(this.pixelRatio=i),this.document.dispatchEvent({type:"resize",width:this.width,height:this.height,pixelRatio:this.pixelRatio})}registerAsset(e,t){if(e=String(e),e.startsWith("data:")){let r=this._parseDataUrl(e);return this.assets.set(e,r),r}let i=this._assetRecord(e,t);return this.assets.set(e,i),i}_parseDataUrl(e){let t=e.indexOf(",");if(t<0)throw st(e,"malformed data URI");let i=e.slice(5,t),r=i.split(";")[0]||"application/octet-stream";if(!/;base64/i.test(i))throw st(e,"only base64 data URIs are supported");return this._assetRecord(e,{data:e.slice(t+1),mime:r})}_assetRecord(e,t){if(t==null)throw st(e,"missing asset bytes");let i=typeof t=="object"&&!(t instanceof Uint8Array)&&!(t instanceof ArrayBuffer)&&!ArrayBuffer.isView(t)?t:{data:t},r=i.data!==void 0?i.data:i.bytes,n=on(r);if(n.length>64*1024*1024)throw st(e,"asset exceeds 64 MiB");return{url:e,data:typeof r=="string"?r:Sv(n),bytes:n,mime:i.mime||i.mimeType||"",width:Number.isFinite(i.width)?i.width:0,height:Number.isFinite(i.height)?i.height:0}}resolveAsset(e){return e=String(e),e.startsWith("data:")?(this.assets.has(e)||this.registerAsset(e),this.assets.get(e)):this.assets.get(e)||this.assets.get(e.replace(/^\.\//,""))||null}_checkAssetGuard(e,t){if(t&&t.canvas&&(t.canvas.disposed||t.canvas.generation!==t.generation||t.canvas._assetEpoch!==t.epoch))throw st(e,"surface was disposed or detached during asset load")}async loadAsset(e,t){e=String(e),this._checkAssetGuard(e,t);let i=this.resolveAsset(e);if(i)return i;let r;try{if(this.hostAssetLoader)r=await this.hostAssetLoader(e);else if(this.jsr&&typeof this.jsr.hostCall=="function")r=await this.jsr.hostCall("three.asset",{url:e});else throw st(e,"asset is not registered and no host asset loader is available")}catch(n){throw n&&n.code==="three.assetFailure"?n:st(e,n&&n.message?n.message:"host load failed")}return this._checkAssetGuard(e,t),this.registerAsset(e,r)}requestAnimationFrame(e){return this.jsr&&this.jsr.requestAnimationFrame?this.jsr.requestAnimationFrame.call(this.jsr,e):Ee.requestAnimationFrame?Ee.requestAnimationFrame(e):Ee.setTimeout(()=>e(Date.now()),16)}cancelAnimationFrame(e){return this.jsr&&this.jsr.cancelAnimationFrame?this.jsr.cancelAnimationFrame.call(this.jsr,e):Ee.cancelAnimationFrame?Ee.cancelAnimationFrame(e):Ee.clearTimeout(e)}sendR1(e){return(!this.jsr||typeof this.jsr.hostCallBinary!="function")&&L("three.r1","jsr.hostCallBinary is required"),this.jsr.hostCallBinary("three.r1",e)}setPresentHook(e){if(e!==null&&typeof e!="function")throw new TypeError("three.invalid: present hook must be a function or null");this.presentHook=e}_webState(e){return e._webFrames||(e._webFrames={nextId:0,pending:new Map,capturing:!1,dirty:!1,released:!1})}_frameMessage(e,t,i,r){let n={type:t,engineId:e.engineId,surfaceId:e.surfaceId,canvasId:e.canvasId,generation:e.generation};return i!==void 0&&(n.frameId=i),r!==void 0&&(n.bitmap=r,n.width=e.width,n.height=e.height),n}_postStructured(e,t){typeof Ee.postMessage!="function"&&L("present","dedicated Worker postMessage is required"),t===void 0?Ee.postMessage(e):Ee.postMessage(e,[t])}_postWebFrame(e,t,i){let r=++t.nextId;if(!Number.isSafeInteger(r))throw new Error("three.surface: frameId exhausted");t.pending.set(r,!0);try{this._postStructured(this._frameMessage(e,"jsr.three.frame",r,i),i)}catch(n){throw t.pending.delete(r),t.dirty=!0,i&&i.close&&i.close(),n}return r}_flushWebPresent(e){let t=this._webState(e);if(!t.dirty||t.released||e.disposed||t.capturing||t.pending.size>=2)return!1;t.dirty=!1;let i=e._backing;if(i&&i.transferToImageBitmap){let r=i.transferToImageBitmap();return this._postWebFrame(e,t,r),!0}return i&&typeof Ee.createImageBitmap=="function"?(t.capturing=!0,Promise.resolve(Ee.createImageBitmap(i)).then(r=>{if(t.capturing=!1,t.released||e.disposed){r&&r.close&&r.close();return}this._postWebFrame(e,t,r),t.dirty&&this._flushWebPresent(e)},r=>{t.capturing=!1,t.dirty=!1,L("present",r&&r.message)}),!0):(t.dirty=!1,L("present","OffscreenCanvas.transferToImageBitmap or createImageBitmap is required"))}_surfaceForMessage(e){if(!e||typeof e!="object"||e.engineId!==void 0&&e.engineId!==this.engineId)return null;for(let t of this.canvases.values())if(!(e.canvasId!==void 0&&e.canvasId!==t.canvasId)&&!(e.surfaceId!==void 0&&e.surfaceId!==t.surfaceId)&&!(e.generation!==void 0&&e.generation!==t.generation))return t;return null}_frameControl(e){let t=this._surfaceForMessage(e);if(!t||!this.web)return!1;let i=this._webState(t);return e.type==="jsr.three.release"?(i.released=!0,i.dirty=!1,i.pending.clear(),!0):e.type!=="jsr.three.frameAck"?!1:(i.pending.delete(e.frameId),i.dirty&&this._flushWebPresent(t),!0)}_releaseWebCanvas(e,t){if(!this.web)return;let i=this._webState(e);i.released=!0,i.dirty=!1,i.pending.clear(),t&&this._postStructured(this._frameMessage(e,"jsr.three.release"))}present(e,t){if(e.disposed)return!1;if(this.presentHook)return this.presentHook({canvas:e,canvasId:e.canvasId,surfaceId:e.surfaceId,engineId:e.engineId,generation:e.generation,payload:t});if(!this.web)return!1;let i=this._webState(e);return i.released?!1:(i.dirty=!0,this._flushWebPresent(e),!0)}getCapabilities(){return{...this.capabilities}}install(e){let t=this,i=Object.assign({},e,{createCanvas:(r,n)=>t.createCanvas(r,n),getCanvas:r=>t.getCanvas(r),registerAsset:(r,n)=>t.registerAsset(r,n),resolveAsset:r=>t.resolveAsset(r),loadAsset:r=>t.loadAsset(r),loadAssetBytes:r=>t.loadAsset(r),getCapabilities:()=>t.getCapabilities(),capabilities:t.capabilities,setPresentHook:r=>t.setPresentHook(r),present:(r,n)=>{let s=t.getCanvas(r);return s?s.present(n):!1},_prepareTree:r=>t._prepareTree(r),_hostEvent:(r,n)=>t._hostEvent(r,n),_frameControl:r=>t._frameControl(r),_dispatchEvent:(r,n)=>t._dispatchEvent(r,n),_setViewport:(r,n,s)=>t._setViewport(r,n,s),engineId:t.engineId,devicePixelRatio:t.pixelRatio});return Object.defineProperty(i,"_runtime",{value:t,enumerable:!1}),i}};function Du(a){bv();let e=Ee.jsr||(Ee.jsr={}),t=e.three||{};if(dr&&dr.web===!!a&&t._runtime===dr)return dr;if(dr=new ca(e,!!a,t),e.three=dr.install(t),typeof e.render=="function"&&!e.render.__jsrThreeRenderWrapper){let i=e.render,r=function(n,...s){let o=e.three&&e.three._runtime;return o&&o._prepareTree(n),i.call(this,n,...s)};Object.defineProperties(r,{__jsrThreeRenderWrapper:{value:!0},__jsrThreeOriginalRender:{value:i}}),e.render=r}return dr}function ua(a=!1){return dr||Du(a)}var Dg=4096,Mv=16777216,wv=1024,Av=64,Tv=64*1024*1024*4/3+8;function Xc(a,e){if(!Number.isFinite(a)||a<0||a>Dg)throw new Error(`three.invalid: canvas2d ${e} must be within 0..${Dg}`);return Math.floor(a)}function Bg(a){for(let e of a)if(ot(e,"canvas2d rectangle"),Math.abs(e)>1e7)throw new Error("three.invalid: canvas2d rectangle is outside the bounded coordinate range");return a}function Og(a){if(typeof a!="string"||a.length<1||a.length>128)throw new Error("three.invalid: canvas2d color must be a nonempty bounded string");return a}function Fu(a){return!!(a&&a.isJsrNativeCanvas2D)}var Yc=class{constructor(e,t,i,r,n,s){if(Bg([e,t,i,r,n,s]),i<0||s<0)throw new Error("three.invalid: canvas2d gradient radii must be non-negative");(e!==r||t!==n||i!==0)&&L("canvas2d.radialGradient","Flutter R1 currently supports concentric radial gradients with r0=0"),this.centerX=r,this.centerY=n,this.radius=s,this.stops=[]}addColorStop(e,t){if(ot(e,"canvas2d gradient offset"),e<0||e>1)throw new Error("three.invalid: canvas2d gradient offset must be within 0..1");if(this.stops.length>=Av)throw new Error("three.invalid: canvas2d gradient stop quota exceeded");this.stops.push({offset:e,color:Og(t)})}snapshot(){this.stops.length<2&&L("canvas2d.gradient","at least two color stops are required");let e=this.stops.map(t=>({offset:t.offset,color:t.color}));for(let t=1;t<e.length;t++)e[t].offset<e[t-1].offset&&L("canvas2d.gradient","color stops must be added in nondecreasing offset order");return{kind:"radial",centerX:this.centerX,centerY:this.centerY,radius:this.radius,stops:e}}},Bu=class{constructor(e){this.canvas=e,this._fillStyle="#000000"}get fillStyle(){return this._fillStyle}set fillStyle(e){typeof e!="string"&&!(e instanceof Yc)&&L("canvas2d.fillStyle","only CSS colors and native radial gradients are supported"),this._fillStyle=typeof e=="string"?Og(e):e}createRadialGradient(e,t,i,r,n,s){return new Yc(e,t,i,r,n,s)}fillRect(e,t,i,r){Bg([e,t,i,r]);let n=typeof this._fillStyle=="string"?{kind:"color",color:this._fillStyle}:this._fillStyle.snapshot();this.canvas._record({op:"fillRect",x:e,y:t,width:i,height:r,style:n})}clearRect(){L("canvas2d.clearRect","not included in the bounded native Canvas2D profile")}drawImage(){L("canvas2d.drawImage","not included in the bounded native Canvas2D profile")}fillText(){L("canvas2d.fillText","not included in the bounded native Canvas2D profile")}getImageData(){L("canvas2d.getImageData","readback belongs to the Flutter host")}putImageData(){L("canvas2d.putImageData","not included in the bounded native Canvas2D profile")}},Ou=class{constructor(e,t,i,r={}){this.runtime=e,this.surface=t,this.canvasId=i,this.engineId=e.engineId,this.surfaceId=t.surfaceId,this.surfaceGeneration=t.generation,this.isJsrNativeCanvas2D=!0,this.isJsrThreeExampleLocal=!0,this.style={},this._width=Xc(r.width===void 0?300:r.width,"width"),this._height=Xc(r.height===void 0?150:r.height,"height"),this._context=new Bu(this),this._commands=[],this._listeners=new Map,this._readyListeners=new Set,this._revision=0,this._sentRevision=0,this._requestId=0,this._readyVersion=0,this._ready=!1,this._rgba=null,this._scheduled=!1,this._inFlight=!1,this._disposed=!1,this.error=null}get width(){return this._width}set width(e){this._resize(Xc(e,"width"),this._height)}get height(){return this._height}set height(e){this._resize(this._width,Xc(e,"height"))}get disposed(){return this._disposed}get ready(){return this._ready}_resize(e,t){if(!this._disposed&&!(e===this._width&&t===this._height)){if(e*t>Mv)throw new Error("three.invalid: canvas2d pixel quota exceeded");this._width=e,this._height=t,this._commands=[],this._touch()}}getContext(e){if(this._disposed)throw new Error("three.surface: canvas2d is disposed");return e!=="2d"&&L("canvasContext",e),this._context}addEventListener(e,t){if(!t)return;let i=this._listeners.get(e)||[];i.includes(t)||i.push(t),this._listeners.set(e,i)}removeEventListener(e,t){let i=this._listeners.get(e);i&&this._listeners.set(e,i.filter(r=>r!==t))}dispatchEvent(e){if(!e||!e.type)throw new Error("three.invalid: canvas2d event.type is required");e.target=this,e.currentTarget=this;for(let t of(this._listeners.get(e.type)||[]).slice())typeof t=="function"?t.call(this,e):t&&t.handleEvent&&t.handleEvent(e);return!0}_addReadyListener(e){return this._disposed?()=>{}:(this._readyListeners.add(e),()=>this._readyListeners.delete(e))}_record(e){if(this._disposed)throw new Error("three.surface: canvas2d is disposed");if(this._commands.length>=wv)throw new Error("three.invalid: canvas2d command quota exceeded");this._commands.push(e),this._touch()}_touch(){this._revision++,this._ready=!1,this._rgba=null,this.error=null,this._schedule()}_schedule(){this._scheduled||this._disposed||(this._scheduled=!0,Promise.resolve().then(()=>{this._scheduled=!1,this._flush()}))}_args(e,t){return{engineId:this.engineId,surfaceId:this.surfaceId,canvasId:this.canvasId,generation:this.surfaceGeneration,requestId:e,width:this._width,height:this._height,commands:t}}_flush(){if(this._disposed||this._inFlight||this._sentRevision===this._revision||!this._width||!this._height)return;let e=this._revision,t=++this._requestId,i=this._commands.slice();this._sentRevision=e,this._inFlight=!0,this.runtime.jsr.hostCall("three.canvas2d",this._args(t,i)).then(r=>{if(this._disposed||t!==this._requestId||e!==this._revision||!r||r.stale)return;if(r.engineId!==this.engineId||r.surfaceId!==this.surfaceId||r.canvasId!==this.canvasId||r.generation!==this.surfaceGeneration||r.requestId!==t||r.width!==this._width||r.height!==this._height||typeof r.data!="string"||r.data.length>Tv)throw new Error("three.canvas2d: host response identity or dimensions do not match the request");let n=on(r.data);if(n.byteLength!==this._width*this._height*4)throw new Error("three.canvas2d: host returned an invalid raw RGBA byte length");this._rgba=n,this._readyVersion++,this._ready=!0,this.error=null;for(let s of Array.from(this._readyListeners))s(this);this.dispatchEvent({type:"ready"})}).catch(r=>{this._disposed||t!==this._requestId||e!==this._revision||(this.error=r instanceof Error?r:new Error(String(r)),this.dispatchEvent({type:"error",error:this.error}))}).then(()=>{this._inFlight=!1,this._sentRevision!==this._revision&&this._schedule()})}dispose(){this._disposed||(this._disposed=!0,this._requestId++,this._commands=[],this._rgba=null,this._ready=!1,this._readyListeners.clear(),this._listeners.clear(),this.surface._nativeCanvas2d&&this.surface._nativeCanvas2d.delete(this),this.runtime.jsr.hostCall("three.canvas2d",{action:"dispose",engineId:this.engineId,surfaceId:this.surfaceId,canvasId:this.canvasId,generation:this.surfaceGeneration,requestId:this._requestId,width:0,height:0,commands:[]}).catch(()=>{}))}toDataURL(){L("canvas2d.capture","capture belongs to the JSR host")}toBlob(){L("canvas2d.capture","capture belongs to the JSR host")}};function Fg(a){if(!a||a.web)return;let e=0,t=(i="main",r={})=>{let n=typeof i=="object"?i:a.getCanvas(i);if(!n||n.disposed||!n.isJsrThreeCanvas)throw new Error("three.surface: canvas2d requires a live JSR THREE surface");let s=new Ou(a,n,`2d-${++e}`,r),o=n._nativeCanvas2d||(n._nativeCanvas2d=new Set);if(o.add(s),!n._nativeCanvas2dDisposeWrapped){n._nativeCanvas2dDisposeWrapped=!0;let l=n.dispose;n.dispose=function(){for(let c of Array.from(o))c.dispose();return l.call(this)}}return s};a.createCanvas2D=t,a.jsr.three.createCanvas2D=t}var Ug=new WeakMap,fa={builds:0,queries:0,candidateTriangles:0,fallbacks:0};function zg(){return{...fa}}function kg(a){let e=a.prototype._computeIntersections;if(typeof e!="function")throw new Error("three.invalid: upstream Mesh intersection path is unavailable");a.prototype._computeIntersections=function(t,i,r){let n=Cv(this,r);if(n===null)return fa.fallbacks++,e.call(this,t,i,r);if(fa.queries++,fa.candidateTriangles+=n.length,n.length===0)return;let s=this.geometry,o=s.index,l=i.length;s.index=Dv(o,n);try{e.call(this,t,i,r)}finally{s.index=o}for(let c=l;c<i.length;c++){let h=i[c],u=h&&h.faceIndex;Number.isInteger(u)&&n[u]!==void 0&&(h.faceIndex=n[u])}}}function Cv(a,e){let t=a.geometry;if(!t||a.isSkinnedMesh||Array.isArray(a.material)||t.morphAttributes&&t.morphAttributes.position)return null;let i=t.attributes&&t.attributes.position,r=t.index;if(!Ev(i,r)||!Iv(t))return null;let n=Ug.get(t);return Rv(n,i,r)||(n=Pv(i,r),Ug.set(t,n),fa.builds++),Lv(n,e)}function Ev(a,e){return!!(a&&e&&a.isBufferAttribute&&e.isBufferAttribute&&!a.isInterleavedBufferAttribute&&!e.isInterleavedBufferAttribute&&a.itemSize===3&&e.itemSize===1&&!a.normalized&&!e.normalized&&a.array&&e.array&&e.count>=1024*3&&e.count%3===0)}function Iv(a){let e=a.drawRange;return!e||e.start===0&&e.count===1/0}function Rv(a,e,t){return!!(a&&a.position===e&&a.index===t&&a.positionArray===e.array&&a.indexArray===t.array&&a.positionVersion===e.version&&a.indexVersion===t.version)}function Pv(a,e){let t=a.array,i=e.array,r=e.count/3,n=new Uint32Array(r),s=new Float64Array(r*3),o=new Float64Array(r*6);for(let c=0;c<r;c++){n[c]=c;let h=c*3,u=i[h]*3,f=i[h+1]*3,d=i[h+2]*3,p=c*6;for(let m=0;m<3;m++){let g=t[u+m],_=t[f+m],x=t[d+m],v=Math.min(g,_,x)-1e-7,b=Math.max(g,_,x)+1e-7;o[p+m]=v,o[p+m+3]=b,s[h+m]=(g+_+x)/3}}let l=[];return Uu(l,n,s,o,0,r),{position:a,index:e,positionArray:t,indexArray:i,positionVersion:a.version,indexVersion:e.version,nodes:l,order:n}}function Uu(a,e,t,i,r,n){let s={minX:1/0,minY:1/0,minZ:1/0,maxX:-1/0,maxY:-1/0,maxZ:-1/0,centroidMinX:1/0,centroidMinY:1/0,centroidMinZ:1/0,centroidMaxX:-1/0,centroidMaxY:-1/0,centroidMaxZ:-1/0,start:-1,count:-1,left:-1,right:-1},o=a.length;a.push(s);for(let m=r;m<n;m++){let g=e[m],_=g*6,x=g*3;s.minX=Math.min(s.minX,i[_]),s.minY=Math.min(s.minY,i[_+1]),s.minZ=Math.min(s.minZ,i[_+2]),s.maxX=Math.max(s.maxX,i[_+3]),s.maxY=Math.max(s.maxY,i[_+4]),s.maxZ=Math.max(s.maxZ,i[_+5]),s.centroidMinX=Math.min(s.centroidMinX,t[x]),s.centroidMinY=Math.min(s.centroidMinY,t[x+1]),s.centroidMinZ=Math.min(s.centroidMinZ,t[x+2]),s.centroidMaxX=Math.max(s.centroidMaxX,t[x]),s.centroidMaxY=Math.max(s.centroidMaxY,t[x+1]),s.centroidMaxZ=Math.max(s.centroidMaxZ,t[x+2])}let l=n-r;if(l<=8)return s.start=r,s.count=l,o;let c=s.centroidMaxX-s.centroidMinX,h=s.centroidMaxY-s.centroidMinY,u=s.centroidMaxZ-s.centroidMinZ,f=c>=h&&c>=u?0:h>=u?1:2,d=e.slice(r,n);d.sort((m,g)=>t[m*3+f]-t[g*3+f]||m-g),e.set(d,r);let p=r+Math.floor(l/2);return s.left=Uu(a,e,t,i,r,p),s.right=Uu(a,e,t,i,p,n),o}function Lv(a,e){let t=a.nodes,i=a.order,r=new Int32Array(t.length),n=[],s=e.origin,o=e.direction,l=0;for(r[l++]=0;l>0;){let c=t[r[--l]];if(Nv(c,s,o))if(c.count>=0){let h=c.start+c.count;for(let u=c.start;u<h;u++)n.push(i[u])}else r[l++]=c.left,r[l++]=c.right}return n.sort((c,h)=>c-h),n}function Nv(a,e,t){let i=0,r=1/0;if(t.x===0){if(e.x<a.minX||e.x>a.maxX)return!1}else{let n=(a.minX-e.x)/t.x,s=(a.maxX-e.x)/t.x;if(n>s){let o=n;n=s,s=o}if(i=Math.max(i,n),r=Math.min(r,s),r<i)return!1}if(t.y===0){if(e.y<a.minY||e.y>a.maxY)return!1}else{let n=(a.minY-e.y)/t.y,s=(a.maxY-e.y)/t.y;if(n>s){let o=n;n=s,s=o}if(i=Math.max(i,n),r=Math.min(r,s),r<i)return!1}if(t.z===0){if(e.z<a.minZ||e.z>a.maxZ)return!1}else{let n=(a.minZ-e.z)/t.z,s=(a.maxZ-e.z)/t.z;if(n>s){let o=n;n=s,s=o}if(i=Math.max(i,n),r=Math.min(r,s),r<i)return!1}return!0}function Dv(a,e){let t=a.array,i=new a.array.constructor(e.length*3);for(let r=0;r<e.length;r++){let n=e[r]*3,s=r*3;i[s]=t[n],i[s+1]=t[n+1],i[s+2]=t[n+2]}return new a.constructor(i,1,a.normalized)}var Bv=1,Ov=2,Fv=1,Gg=64*1024*1024,Wt=Object.freeze({GEOMETRY:1,TEXTURE:2,MATERIAL:3,NODE:4,REMOVE_NODE:5,CAMERA:6,LIGHT:7,FRAME:8,DISPOSE_RESOURCE:9,DISPOSE_SURFACE:10,DRAW_BATCH:11,REMOVE_BATCH:12}),Vg=Object.freeze({cast:1,receive:2}),Uv=Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),Zc=Object.freeze({width:0,height:0,bias:0,normalBias:0,radius:1,matrix:Uv}),vt=class{constructor(e=256){this.buffer=new ArrayBuffer(Math.max(16,e)),this.view=new DataView(this.buffer),this.length=0}ensure(e){if(this.length+e<=this.buffer.byteLength)return;let t=this.buffer.byteLength;for(;t<this.length+e;)t*=2;let i=new ArrayBuffer(t);new Uint8Array(i).set(new Uint8Array(this.buffer,0,this.length)),this.buffer=i,this.view=new DataView(i)}u8(e){this.ensure(1),this.view.setUint8(this.length,e),this.length+=1}u16(e){this.ensure(2),this.view.setUint16(this.length,e,!0),this.length+=2}u32(e){this.ensure(4),this.view.setUint32(this.length,sn(e,"u32"),!0),this.length+=4}f32(e){this.ensure(4),this.view.setFloat32(this.length,e,!0),this.length+=4}bytes(e){let t=e instanceof Uint8Array?e:new Uint8Array(e);this.ensure(t.length),new Uint8Array(this.buffer,this.length,t.length).set(t),this.length+=t.length}floats(e){for(let t=0;t<e.length;t++)this.f32(e[t])}finish(){return new Uint8Array(this.buffer,0,this.length).slice()}};function qt(a,e=new Uint8Array(0)){if(e.length>4294967295)throw new Error("three.invalid: command body is too large");return{opcode:a,body:e}}function _i(a){if(!a||!Number.isInteger(a.id)||a.id<0||a.id>4294967295)throw new Error("three.invalid: upstream object id is not u32");return a.id===0?4294967295:a.id>>>0}function Hg(a,e,t,i){if(!Array.isArray(a)||a.length>1e5)throw new Error("three.invalid: R1 command count exceeds 100000");sn(i,"sequence");let r=ha(e),n=ha(t);if(!r.length||r.length>128||!n.length||n.length>128)throw new Error("three.invalid: T1 identity length");let s=new vt(12+a.length*16);s.bytes(new Uint8Array([74,83,82,49])),s.u16(Ov),s.u16(0),s.u32(a.length);for(let f of a){if(!f||!Number.isInteger(f.opcode)||f.opcode<1||f.opcode>255)throw new Error("three.invalid: R1 opcode");s.u8(f.opcode),s.u8(0),s.u16(0),s.u32(f.body.length),s.bytes(f.body)}let o=s.finish(),l=32+r.length+n.length,c=l+o.length;if(c>Gg)throw new Error("three.invalid: T1 envelope exceeds 64 MiB");let h=new Uint8Array(c),u=new DataView(h.buffer);return h.set([74,83,82,51],0),u.setUint8(4,Bv),u.setUint8(5,Fv),u.setUint16(6,l,!0),u.setUint32(8,i,!0),u.setUint32(12,o.length,!0),u.setUint16(16,r.length,!0),u.setUint16(18,n.length,!0),u.setUint32(20,0,!0),u.setUint32(24,c,!0),u.setUint32(28,0,!0),h.set(r,32),h.set(n,32+r.length),h.set(o,l),h}function Wg(a,e,t,i,r,n,s=null){let o=n?n.length:0,l=0,c=["position","normal","uv","color"];for(let f=0;f<c.length;f++)r[c[f]]&&(l|=1<<f);if(s&&(t!==0||s.length%2!==0))throw new Error("three.invalid: wire indices require complete triangle-mesh edges");let h=s?4+s.length*4:0,u=new vt(28+o*4+h+64);u.u32(a),u.u32(e),u.u32(l),u.u32(i),u.u32(o),u.u32(t),u.u32(0);for(let f of c){let d=r[f];d&&(u.u32(d.byteLength),u.bytes(new Uint8Array(d.buffer,d.byteOffset,d.byteLength)))}if(n)for(let f=0;f<n.length;f++)u.u32(n[f]);if(s){u.u32(s.length);for(let f=0;f<s.length;f++)u.u32(s[f])}return qt(Wt.GEOMETRY,u.finish())}function qg(a,e,t,i,r,n,s){let o=new vt(28+s.length);return o.u32(a),o.u32(e),o.u32(t),o.u32(i),o.u32(r),o.u32(n),o.u32(s.length),o.bytes(s),qt(Wt.TEXTURE,o.finish())}function Xg(a,e,t,i,r,n,s,o,l,c,h,u,f=null,d=0,p=null,m=1){if(t===5!=(f!==null))throw new Error("three.invalid: Phong material requires exactly one specular payload");if(p!==null&&t!==1&&t!==2&&t!==5)throw new Error("three.invalid: emissive payload requires a lit mesh material");let g=new vt(56+(f?16:0)+(p?16:0));return g.u32(a),g.u32(e),g.u32(t),g.u32(i),g.u32(r),g.u32(n),g.f32(s.r),g.f32(s.g),g.f32(s.b),g.f32(o),g.f32(l),g.f32(c),g.f32(h),g.f32(u),f&&(g.f32(f.r),g.f32(f.g),g.f32(f.b),g.f32(d)),p&&(g.f32(p.r),g.f32(p.g),g.f32(p.b),g.f32(m)),qt(Wt.MATERIAL,g.finish())}function Yg(a,e,t,i,r,n,s,o={}){let l=new vt(92);return l.u32(a),l.u32(e),l.u32(t),l.u32(i),l.u32(r?1:0),l.u32(n),l.floats(s.elements||s),l.u32((o.cast?Vg.cast:0)|(o.receive?Vg.receive:0)),qt(Wt.NODE,l.finish())}function Zg(a){let e=new vt(4);return e.u32(a),qt(Wt.REMOVE_NODE,e.finish())}function Jg(a,e,t,i,r,n=null){if(sn(a,"batch nodeId"),sn(e,"batch version"),sn(t,"batch instanceCount"),i!==0&&i!==1)throw new Error("three.invalid: batch flags");if(i===0&&t!==1)throw new Error("three.invalid: non-instanced batch instanceCount must be one");if(!Array.isArray(r))throw new Error("three.invalid: batch parts");sn(r.length,"batch partCount");let s=i===1?t*16:0;if(s>0&&(!n||n.length<s))throw new Error("three.invalid: batch instance matrix payload");let o=20+r.length*16+s*4;if(o>Gg)throw new Error("three.invalid: batch exceeds 64 MiB");let l=new vt(o);l.u32(a),l.u32(e),l.u32(t),l.u32(i),l.u32(r.length);for(let c of r)l.u32(c.geometryId),l.u32(c.materialId),l.u32(c.offset),l.u32(c.count);if(ArrayBuffer.isView(n))l.bytes(new Uint8Array(n.buffer,n.byteOffset,s*4));else for(let c=0;c<s;c++)l.f32(n[c]);return qt(Wt.DRAW_BATCH,l.finish())}function Jc(a){let e=new vt(4);return e.u32(a),qt(Wt.REMOVE_BATCH,e.finish())}function jg(a,e,t,i,r){let n=new vt(200);return n.u32(a),n.u32(e),n.floats(t.elements||t),n.floats(i.elements||i),n.floats(r.elements||r),qt(Wt.CAMERA,n.finish())}function Kg(a,e,t,i,r,n,s=null){if(e===3!=(s!==null))throw new Error("three.invalid: HemisphereLight requires exactly one ground color payload");let o=new vt(s?64:48);return o.u32(a),o.u32(e),o.f32(t.r),o.f32(t.g),o.f32(t.b),o.f32(i),o.f32(r.x),o.f32(r.y),o.f32(r.z),o.f32(n.x),o.f32(n.y),o.f32(n.z),s&&(o.f32(s.r),o.f32(s.g),o.f32(s.b),o.u32(0)),qt(Wt.LIGHT,o.finish())}function $g(a,e,t,i,r,n=Zc,s=[],o=[]){let l=n.contentRevision!==void 0,c=s.length||o.length||l,h=(c?4+s.length*4:0)+(o.length||l?4+o.length*4:0)+(l?4:0),u=new vt(136+h);if(u.u32(a),u.u32(e),u.f32(t.r),u.f32(t.g),u.f32(t.b),u.f32(t.a),u.f32(i),u.u32(r.mode),u.f32(r.color.r),u.f32(r.color.g),u.f32(r.color.b),u.f32(r.near),u.f32(r.far),u.u32(n.width),u.u32(n.height),u.f32(n.bias),u.f32(n.normalBias),u.f32(n.radius),u.floats(n.matrix.elements||n.matrix),c){u.u32(s.length);for(let f of s)u.u32(f)}if(o.length||l){u.u32(o.length);for(let f of o)u.u32(f)}return l&&u.u32(n.contentRevision),qt(Wt.FRAME,u.finish())}function jc(a,e){let t=new vt(8);return t.u32(a),t.u32(e),qt(Wt.DISPOSE_RESOURCE,t.finish())}function Qg(){return qt(Wt.DISPOSE_SURFACE)}var zv=["position","normal","uv","color"],e_=1e6,t_=1024,si={geometry:1,texture:2,material:3,node:4,light:5,camera:6},iH=new y,xi=new y,i_=new y,yi=new y,Kc=new Lt,$c=new F,r_=new WeakMap,kv=1;function lo(a){if(!a||typeof a!="object"&&typeof a!="function")return 0;let e=r_.get(a);return e||(e=kv++,r_.set(a,e)),e}function pr(a,e){for(let t=0;t<a.length;t++)ot(a[t],e)}function zu(a){return a.elements.join(",")}function Vv(a,e){if(!a)return!1;let t=e.elements;for(let i=0;i<16;i++)if(a[i]!==t[i])return!1;return!0}function n_(a){return a?[a.id,a.version,a.itemSize,a.normalized?1:0,a.count,lo(a.array),a.data?a.data.version:0,a.data?lo(a.data.array):0,a.offset||0].join(":"):"-"}function Gv(a,e,t){let i=zv.map(s=>n_(a.attributes[s])).join("|"),r=a.index,n=a.drawRange||{start:0,count:1/0};return[e,t,i,r?n_(r):"-",n.start,n.count].join(";")}function s_(a,e){let t=a.drawRange||{start:0,count:1/0},i=a.index?a.index.array:null,r=i?i.length:e;if(!Number.isInteger(t.start)||t.start<0||t.count!==1/0&&(!Number.isInteger(t.count)||t.count<0))throw new Error("three.invalid: geometry drawRange");let n=Math.max(0,Math.min(r,t.start)),s=Math.min(t.count===1/0?r-n:t.count,r-n);if(!Number.isInteger(s)||s<0)throw new Error("three.invalid: geometry drawRange");return{start:n,count:s,available:r}}function o_(a,e){let t=s_(a,e),i=a.index?a.index.array:null,r=new Array(t.count);for(let n=0;n<t.count;n++)r[n]=i?i[t.start+n]:t.start+n;return r}function Qc(a,e,t,i){if(!a)return null;if((typeof a.getComponent!="function"||a.isGLBufferAttribute)&&L("rawGLAttribute",i),a.itemSize!==t||a.count!==e)throw new Error(`three.invalid: ${i} attribute must have ${t} components per vertex`);let r=new Float32Array(e*t);for(let n=0;n<e;n++)for(let s=0;s<t;s++){let o=a.getComponent(n,s);ot(o,`${i} attribute`),r[n*t+s]=o}return r}function Hv(a,e,t,i){let r=o_(a,i);if(t==="line"){if(r.length<2)throw new Error("three.invalid: Line needs at least two vertices");let n=new Array((r.length-1)*2);for(let s=0;s<r.length-1;s++)n[s*2]=r[s],n[s*2+1]=r[s+1];r=n}if(!a.index&&t!=="line"&&a.drawRange.start===0&&a.drawRange.count===1/0&&(r=null),r){for(let n of r)if(!Number.isInteger(n)||n<0||n>=i)throw new Error("three.invalid: geometry index is outside vertexCount");if(e===0&&r.length%3!==0||e===1&&r.length%2!==0)throw new Error("three.invalid: primitive index count is not aligned")}else if(e===0&&i%3!==0||e===1&&i%2!==0)throw new Error("three.invalid: primitive vertex count is not aligned");return r}function Wv(a,e){let t=o_(a,e),i=a.attributes.position,r=new Array(e),n=new Set,s=[],o=c=>{let h=r[c];return h===void 0&&(h=[i.getComponent(c,0),i.getComponent(c,1),i.getComponent(c,2)].join(","),r[c]=h),h},l=(c,h)=>{let u=o(c),f=o(h),d=u<=f?`${u}|${f}`:`${f}|${u}`;n.has(d)||(n.add(d),s.push(c,h))};for(let c=0;c<t.length;c+=3){let h=t[c],u=t[c+1],f=t[c+2];l(h,u),l(u,f),l(f,h)}if(s.length>12e6)throw new Error("three.invalid: wireIndexCount exceeds 12000000");return s}function qv(a){let e=a.minFilter===fe||a.minFilter===yr||a.minFilter===vr;return(a.colorSpace===me?1:0)|(a.flipY?2:0)|(a.magFilter===fe?4:0)|(e?8:0)|(a.generateMipmaps?16:0)|(a.wrapS===wt||a.wrapS===Yt?32:0)|(a.wrapT===wt||a.wrapT===Yt?64:0)}function Xv(a){let e=a.image;return[a.version,a.source?a.source.version:0,lo(e),e&&lo(e.data),e&&e.width,e&&e.height,e&&e.encoding,e&&e.mime,a.colorSpace,a.flipY,a.magFilter,a.minFilter,a.generateMipmaps,a.wrapS,a.wrapT,a.format,a.type].join("|")}function Yv(a){if(a.isMeshBasicMaterial)return 0;if(a.isMeshLambertMaterial)return 1;if(a.isMeshStandardMaterial&&!a.isMeshPhysicalMaterial)return 2;if(a.isLineBasicMaterial&&!a.isLineDashedMaterial)return 3;if(a.isPointsMaterial)return 4;if(a.isMeshPhongMaterial)return 5;if(a.isMeshNormalMaterial)return 6;L("material",a.type||"unknown material")}function a_(a){return a.isMeshLambertMaterial||a.isMeshPhongMaterial||a.isMeshStandardMaterial&&!a.isMeshPhysicalMaterial}function Zv(a){(a.isShaderMaterial||a.isRawShaderMaterial)&&L("ShaderMaterial","arbitrary shaders require 1B"),a.wireframe&&!(a.isMeshBasicMaterial||a.isMeshLambertMaterial||a.isMeshPhongMaterial||a.isMeshNormalMaterial||a.isMeshStandardMaterial&&!a.isMeshPhysicalMaterial)&&L("wireframe","R1 wireframe requires a mesh material"),a.wireframe&&(a.wireframeLinewidth!==1||a.wireframeLinecap!=="round"||a.wireframeLinejoin!=="round")&&L("wireframeStyle","R1 supports one-pixel round wireframe lines"),a.blending!==fo&&L("materialBlending"),(a.alphaHash||a.premultipliedAlpha||a.colorWrite===!1||a.stencilWrite||a.polygonOffset)&&L("materialState","alphaHash/premultipliedAlpha/colorWrite/stencil/polygonOffset"),a.clippingPlanes&&a.clippingPlanes.length&&L("clippingPlanes"),Object.prototype.hasOwnProperty.call(a,"onBeforeCompile")&&L("onBeforeCompile","arbitrary shaders require 1B");let e=["alphaMap","aoMap","bumpMap","displacementMap","emissiveMap","envMap","lightMap","metalnessMap","normalMap","roughnessMap","specularMap","clearcoatMap","transmissionMap"];for(let t of e)a[t]&&L("materialTexture",`${a.type}.${t}`);!a_(a)&&a.emissive&&(a.emissive.r!==0||a.emissive.g!==0||a.emissive.b!==0)&&L("emissiveMaterial",`${a.type} has no upstream emissive support`)}function Jv(a){if(a===Mi)return 0;if(a===wi)return 1;if(a===uo)return 2;throw new Error("three.invalid: material side")}var eh=class{constructor(e={}){this.isWebGLRenderer=!0,this.isJsrThreeRenderer=!0,this.runtime=e.runtime||ua(!1),e.context!=null&&L("rawWebGL","native R1 does not accept a caller-provided GL context");let t=e.canvas||this.runtime.createCanvas("main");if(t.isJsrThreeCanvas||L("canvas","native WebGLRenderer requires jsr.three.createCanvas()"),t.renderer&&t.renderer!==this&&!t.renderer._disposed)throw new Error("three.surface: canvas already has an active renderer");this.domElement=t,t.renderer=this,this.capabilities=Object.assign({},this.runtime.capabilities,{rawWebGL:!1,isWebGL2:!1,backend:"flutterGpu",features:Object.freeze({geometry:!0,textures:!0,lambert:!0,standard:!0,phong:!0,normal:!0,emissive:!0,hemisphereLight:!0,wireframe:!0,rawWebGL:!1,shaderMaterial:!1})}),this.outputColorSpace=me,this.toneMapping=hn,this.toneMappingExposure=1,this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.shadowMap={enabled:!1,autoUpdate:!0,needsUpdate:!1},this._manualShadowRevision=0,this._shadowCullingKey=null,this._cachedCulledShadowNodeIds=[],this.xr={enabled:!1},this.info={autoReset:!0,render:{frame:0,calls:0,triangles:0,points:0,lines:0},memory:{geometries:0,textures:0},programs:[],reset:()=>{this.info.render.calls=0,this.info.render.triangles=0,this.info.render.points=0,this.info.render.lines=0}},this._clearColor=new I(0),this._clearAlpha=0,this._pixelRatio=t.pixelRatio||1,this._width=t.clientWidth||t.width,this._height=t.clientHeight||t.height,this._disposed=!1,this._animationLoop=null,this._animationHandle=null,this._pendingDisposals=[],this._resources=new Map,this._geometryModes=new Map,this._canvasTextures=new Map,this._canvasRefreshHandle=null,this._lastScene=null,this._lastCamera=null,this._state=t._r1State||(t._r1State={sequence:0,geometries:new Map,textures:new Map,materials:new Map,nodes:new Map,batches:new Map,lights:new Map,cameras:new Map})}getContext(){L("rawWebGL","WebGLRenderer.getContext() is a 1B capability")}getContextAttributes(){L("rawWebGL","WebGLRenderer.getContextAttributes() is a 1B capability")}getPixelRatio(){return this._pixelRatio}getSize(e){return e&&e.set?e.set(this._width,this._height):{width:this._width,height:this._height}}getDrawingBufferSize(e){return e&&e.set?e.set(this.domElement.width,this.domElement.height):{width:this.domElement.width,height:this.domElement.height}}getClearColor(e){return e&&e.copy?e.copy(this._clearColor):this._clearColor.clone()}getClearAlpha(){return this._clearAlpha}setPixelRatio(e){if(!Number.isFinite(e)||e<=0||e>16)throw new Error("three.invalid: pixel ratio must be within (0,16]");this._pixelRatio=e,this.setSize(this._width,this._height,!1)}setSize(e,t,i=!0){if(!Number.isFinite(e)||!Number.isFinite(t)||e<0||t<0||e>16384||t>16384)throw new Error("three.invalid: renderer size must be within 0..16384");this._width=e,this._height=t,this.domElement._setSize(e,t,this._pixelRatio,i)}setClearColor(e,t=1){if(this._clearColor.set(e),!Number.isFinite(t)||t<0||t>1)throw new Error("three.invalid: clear alpha");this._clearAlpha=t}setClearAlpha(e){if(!Number.isFinite(e)||e<0||e>1)throw new Error("three.invalid: clear alpha");this._clearAlpha=e}setViewport(){}setScissor(){}setScissorTest(){}setRenderTarget(e){e!=null&&L("renderTarget","R1 renders only the attached surface")}getRenderTarget(){return null}clear(){}setAnimationLoop(e){if(e!==null&&typeof e!="function")throw new TypeError("three.invalid: animation loop callback");if(this._animationHandle!==null&&(this.runtime.cancelAnimationFrame(this._animationHandle),this._animationHandle=null),this._animationLoop=e,!e||this._disposed)return;let t=i=>{this._disposed||this._animationLoop!==e||(this._animationHandle=this.runtime.requestAnimationFrame(t),e(i))};this._animationHandle=this.runtime.requestAnimationFrame(t)}_mapSet(e,t,i){let r=this._transaction;if(r){let n=r.get(e);n||(n=new Map,r.set(e,n)),n.has(t)||n.set(t,[e.has(t),e.get(t)])}e.set(t,i)}_mapDelete(e,t){let i=this._transaction;if(i){let r=i.get(e);r||(r=new Map,i.set(e,r)),r.has(t)||r.set(t,[e.has(t),e.get(t)])}return e.delete(t)}_listen(e,t,i,r){if(!e||!e.addEventListener||this._resources.has(e))return;let n={geometries:si.geometry,textures:si.texture,materials:si.material,nodes:si.node},s=()=>{if(this._unlisten(e),t==="textures"&&this._unwatchCanvasTexture(e),t==="geometries"&&this._mapDelete(this._geometryModes,r),this._state[t].has(r)){this._mapDelete(this._state[t],r);let o={id:r,kind:n[t]};t==="nodes"&&this._mapDelete(this._state.batches,r)&&(o.batch=!0),this._pendingDisposals.push(o)}};e.addEventListener("dispose",s),this._resources.set(e,{type:t,id:r,listener:s}),this._transactionListens&&this._transactionListens.push(e)}_unlisten(e){let t=this._resources.get(e);t&&(e.removeEventListener("dispose",t.listener),this._resources.delete(e))}_unlistenAll(){for(let[e,t]of this._resources)e.removeEventListener&&e.removeEventListener("dispose",t.listener);this._resources.clear()}_nextVersion(e,t,i){let r=e.get(t);if(r&&r.signature===i)return null;let n=r?r.version+1:1;if(n>4294967295)throw new Error("three.invalid: resource version exhausted");return{signature:i,version:n}}_unwatchCanvasTexture(e){let t=this._canvasTextures.get(e);t&&(t.unlisten(),this._canvasTextures.delete(e))}_watchCanvasTexture(e,t){let i=this._canvasTextures.get(e);if(i&&i.canvas===t)return i;i&&this._unwatchCanvasTexture(e);let r={texture:e,canvas:t,adoptedVersion:0,unlisten:null};return r.unlisten=t._addReadyListener(()=>{this._disposed||this._canvasTextures.get(e)!==r||this._adoptCanvasTexture(r)&&this._scheduleCanvasRefresh()}),this._canvasTextures.set(e,r),r}_adoptCanvasTexture(e){let t=e.canvas;return!t._ready||!t._rgba||e.adoptedVersion===t._readyVersion?!1:(e.adoptedVersion=t._readyVersion,e.texture.userData.jsrCanvas2D=t,e.texture.source.data={width:t.width,height:t.height,data:new Uint8Array(t._rgba),encoding:0,encoded:!1},e.texture.needsUpdate=!0,!0)}_scheduleCanvasRefresh(){this._disposed||this._canvasRefreshHandle!==null||!this._lastScene||!this._lastCamera||(this._canvasRefreshHandle=!0,Promise.resolve().then(()=>{if(this._disposed||!this._lastScene||!this._lastCamera){this._canvasRefreshHandle=null;return}try{this.render(this._lastScene,this._lastCamera)}finally{this._canvasRefreshHandle=null}}))}_canvasForTexture(e){if(!e.isCanvasTexture)return null;if(Fu(e.image))return e.image;let t=e.userData&&e.userData.jsrCanvas2D;return Fu(t)?t:null}_ensureTexture(e,t){if(!e)return 0;e.isTexture||L("texture","material map is not a THREE.Texture"),(e.isCubeTexture||e.isDataArrayTexture||e.isData3DTexture||e.isCompressedTexture||e.isVideoTexture||e.isFramebufferTexture||e.isDepthTexture||e.isExternalTexture)&&L("textureType",e.type);let i=this._canvasForTexture(e);if(e.isCanvasTexture&&!i&&L("canvas2d.source","native CanvasTexture requires a Flutter canvas2d image"),i){let p=this._watchCanvasTexture(e,i);if(this._adoptCanvasTexture(p),!i._ready)return 0}e.mapping!==zi&&L("textureMapping"),(e.premultiplyAlpha||e.anisotropy>1||e.mipmaps&&e.mipmaps.length)&&L("textureState","premultiplyAlpha/anisotropy/custom mipmaps"),(e.channel!==0||e.offset.x!==0||e.offset.y!==0||e.repeat.x!==1||e.repeat.y!==1||e.center.x!==0||e.center.y!==0||e.rotation!==0)&&L("textureTransform","R1 v1 has no UV transform fields");let r=e.image;if(!r||!r.data)return 0;let n=_i(e),s=this._frameTextures.get(n);if(s!==void 0)return s;this._listen(e,"textures",this._state.textures,n);let o=Xv(e),l=this._nextVersion(this._state.textures,n,o);if(!l)return this._frameTextures.set(n,n),n;let c=r.data;if(!(c instanceof Uint8Array)&&!ArrayBuffer.isView(c))throw new Error("three.invalid: texture data must be a typed array");let h=c instanceof Uint8Array?c:new Uint8Array(c.buffer,c.byteOffset,c.byteLength);if(h.length>64*1024*1024)throw new Error("three.invalid: texture exceeds 64 MiB");let u=r.encoding,f=r.width||0,d=r.height||0;if(u===void 0){let p=String(r.mime||"").toLowerCase();e.isDataTexture||r.encoded===!1?u=0:h.length>=8&&h[0]===137&&h[1]===80&&h[2]===78&&h[3]===71?u=1:h.length>=2&&h[0]===255&&h[1]===216?u=2:p.includes("png")?u=1:p.includes("jpeg")||p.includes("jpg")?u=2:u=0}if(u===0){if((e.format!==je||e.type!==Zt)&&L("textureFormat","R1 raw textures require RGBA8/UnsignedByteType"),!f||!d||f*d*4!==h.byteLength)throw new Error("three.invalid: raw RGBA8 texture dimensions/data length")}else u!==1&&u!==2&&L("textureEncoding",u);if(u!==0&&h.length===0)throw new Error("three.invalid: encoded texture bytes must be nonempty");return t.push(qg(n,l.version,f,d,u,qv(e),h)),this._mapSet(this._state.textures,n,{signature:o,version:l.version,object:e}),this._frameTextures.set(n,n),n}_ensureMaterial(e,t){let i=Yv(e);Zv(e);let r=_i(e),n=this._frameMaterials.get(r);if(n!==void 0)return n;this._listen(e,"materials",this._state.materials,r);let s=this._ensureTexture(e.map||null,t),o=e.color||new I(16777215),l=e.opacity===void 0?1:e.opacity,c=e.roughness===void 0?0:e.roughness,h=e.metalness===void 0?0:e.metalness,u=e.alphaTest||0,f=e.size===void 0?1:e.size,d=i===5?e.specular:null,p=i===5?e.shininess:0,m=a_(e)?e.emissive:null,g=m?e.emissiveIntensity:1;if(ot(o.r,"material color"),ot(o.g,"material color"),ot(o.b,"material color"),!Number.isFinite(l)||l<0||l>1||!Number.isFinite(c)||c<0||c>1||!Number.isFinite(h)||h<0||h>1||!Number.isFinite(u)||u<0||u>1||!Number.isFinite(f)||f<=0)throw new Error("three.invalid: material scalar range");if(d&&(ot(d.r,"material specular"),ot(d.g,"material specular"),ot(d.b,"material specular"),!Number.isFinite(p)||p<0))throw new Error("three.invalid: material shininess must be finite and nonnegative");if(m&&(ot(m.r,"material emissive"),ot(m.g,"material emissive"),ot(m.b,"material emissive"),!Number.isFinite(g)||g<0))throw new Error("three.invalid: material emissiveIntensity must be finite and nonnegative");let _=Jv(e.side),x=(e.vertexColors?1:0)|(e.flatShading?2:0)|(e.transparent?4:0)|(e.depthTest?8:0)|(e.depthWrite?16:0)|(e.wireframe?32:0),v=[i,s,e.map&&this._state.textures.get(_i(e.map))?.version||0,x,_,o.r,o.g,o.b,l,c,h,u,f,d?d.r:0,d?d.g:0,d?d.b:0,p,m?m.r:0,m?m.g:0,m?m.b:0,g,e.version].join("|"),b=this._nextVersion(this._state.materials,r,v);return b&&(t.push(Xg(r,b.version,i,s,x,_,o,l,c,h,u,f,d,p,m,g)),this._mapSet(this._state.materials,r,{signature:v,version:b.version,object:e})),this._frameMaterials.set(r,r),r}_ensureGeometry(e,t,i,r,n=!1){(!e||!e.isBufferGeometry)&&L("geometry","only BufferGeometry is supported"),e.isInstancedBufferGeometry&&L("instancedGeometry"),e.index&&(!e.index.array||e.index.isGLBufferAttribute)&&L("rawGLAttribute","index"),e.morphAttributes&&Object.keys(e.morphAttributes).some(A=>e.morphAttributes[A]&&e.morphAttributes[A].length)&&L("morphTargets");let s=e.attributes.position;if(!s)throw new Error("three.invalid: position attribute is required");let o=s.count;if(!Number.isInteger(o)||o<=0||o>4e6)throw new Error("three.invalid: vertexCount");let l=_i(e),c=this._geometryModes.get(l);c&&(c.primitive!==t||c.mode!==i)&&L("sharedGeometryPrimitive","one geometry cannot be used with multiple R1 primitive modes on a surface");let h=this._state.geometries.get(l),u=t===0&&(n||h&&h.hasWireIndices),f=this._frameGeometries.get(l);if(f&&(!n||f.hasWireIndices))return f;this._mapSet(this._geometryModes,l,{primitive:t,mode:i}),this._listen(e,"geometries",this._state.geometries,l);let d=`${Gv(e,t,i)};wire:${u?1:0}`,p=this._nextVersion(this._state.geometries,l,d);if(!p){let A=this._state.geometries.get(l),w={id:l,vertexCount:o,drawCount:A.drawCount,indexed:A.indexed,rangeStart:A.rangeStart,rangeCount:A.rangeCount,sourceCount:A.sourceCount,hasWireIndices:A.hasWireIndices,wireDrawCount:A.wireDrawCount};return this._frameGeometries.set(l,w),w}let m={position:Qc(s,o,3,"position"),normal:Qc(e.attributes.normal,o,3,"normal"),uv:Qc(e.attributes.uv,o,2,"uv"),color:e.attributes.color?Qc(e.attributes.color,o,e.attributes.color.itemSize,"color"):null};if(e.attributes.color&&e.attributes.color.itemSize!==3&&e.attributes.color.itemSize!==4)throw new Error("three.invalid: color attribute must have 3 or 4 components");let g=Hv(e,t,i,o),_=u?Wv(e,o):null,x=g?g.length:0;if(x>12e6)throw new Error("three.invalid: indexCount");r.push(Wg(l,p.version,t,o,m,g,_));let v=g?x:o,b=s_(e,o),M={signature:d,version:p.version,object:e,drawCount:v,indexed:!!g,rangeStart:b.start,rangeCount:b.count,sourceCount:b.available,hasWireIndices:!!_,wireDrawCount:_?_.length:0};this._mapSet(this._state.geometries,l,M);let S={id:l,vertexCount:o,drawCount:v,indexed:M.indexed,rangeStart:b.start,rangeCount:b.count,sourceCount:b.available,hasWireIndices:M.hasWireIndices,wireDrawCount:M.wireDrawCount};return this._frameGeometries.set(l,S),S}_updateNode(e,t,i,r,n,s,o,l){let c=e.matrixWorld,h=e.castShadow===!0,u=e.receiveShadow===!0,f=this._state.nodes.get(t);f&&f.parentId===i&&f.geometryId===r&&f.materialId===n&&f.visible===s&&f.objectKind===o&&f.castShadow===h&&f.receiveShadow===u&&Vv(f.matrix,c)||(pr(c.elements,"matrixWorld"),l.push(Yg(t,i,r,n,s,o,c,{cast:h,receive:u})),this._mapSet(this._state.nodes,t,{parentId:i,geometryId:r,materialId:n,visible:s,objectKind:o,castShadow:h,receiveShadow:u,matrix:c.elements.slice(),object:e}))}_removeBatch(e,t){this._mapDelete(this._state.batches,e)&&t.push(Jc(e))}_instanceData(e,t){e.instanceColor&&L("instanceColor","R1 instancing supports matrices only");for(let o of t)o.transparent&&L("transparentInstancedMesh","R1 instanced draws must be opaque");e.morphTexture&&L("morphTargets","instanced morph textures");let i=e.count;if(!Number.isInteger(i)||i<0||i>e_)throw new Error(`three.invalid: InstancedMesh.count must be within 0..${e_}`);let r=e.instanceMatrix;if(!r||!r.isInstancedBufferAttribute||r.isGLBufferAttribute||r.itemSize!==16)throw new Error("three.invalid: instanceMatrix must be a 16-component InstancedBufferAttribute");let n=r.array;if(!n||!ArrayBuffer.isView(n)||typeof n.length!="number")throw new Error("three.invalid: instanceMatrix array");if(!Number.isInteger(r.count)||r.count<0||i>r.count)throw new Error("three.invalid: InstancedMesh.count exceeds instanceMatrix capacity");let s=i*16;if(s>n.length)throw new Error("three.invalid: instanceMatrix payload is outside its array bounds");return{count:i,array:n,valueCount:s,signature:[r.version,lo(r),lo(n),r.count].join(":")}}_ensureBatchParts(e,t,i,r){if(e.isInstancedMesh&&!Array.isArray(e.material))return[{geometryId:t.id,materialId:this._ensureMaterial(i[0],r),offset:0,count:t.drawCount}];let n=e.geometry.groups;if((!n||n.length===0)&&L("multiMaterialGroups","material arrays require BufferGeometry.groups"),n.length>t_)throw new Error(`three.invalid: batch partCount exceeds ${t_}`);!e.geometry.index&&(n.length!==1||n[0].start!==0||n[0].count!==t.sourceCount)&&L("nonIndexedGroups","R1 supports only one full-geometry group for non-indexed material arrays");let s=t.rangeStart+t.rangeCount,o=[];for(let l of n){if(!l||!Number.isInteger(l.start)||l.start<0||!Number.isInteger(l.count)||l.count<0)throw new Error("three.invalid: geometry group start/count");if(!Number.isInteger(l.materialIndex)||l.materialIndex<0||l.materialIndex>=i.length)throw new Error("three.invalid: geometry group materialIndex");if(l.start>t.sourceCount||l.count>t.sourceCount-l.start)throw new Error("three.invalid: geometry group is outside geometry bounds");if(l.count%3!==0)throw new Error("three.invalid: triangle group count is not aligned");let c=l.start+l.count,h=Math.min(s,Math.max(t.rangeStart,l.start)),u=Math.min(s,Math.max(t.rangeStart,c)),f=Math.max(0,u-h);if(f%3!==0)throw new Error("three.invalid: clipped triangle group count is not aligned");let d=h-t.rangeStart;if(d>t.drawCount||f>t.drawCount-d)throw new Error("three.invalid: batch part is outside the uploaded geometry");o.push({geometryId:t.id,materialId:this._ensureMaterial(i[l.materialIndex],r),offset:d,count:f})}return o}_ensureBatch(e,t,i,r,n){let s=e.isInstancedMesh&&!Array.isArray(e.material),o=e.isInstancedMesh?this._instanceData(e,r):null,l=0,c=this._state.batches.get(t);if(s){l=this._ensureMaterial(r[0],n);let p=e.instanceMatrix,m=this._state.geometries.get(i.id),g=this._state.materials.get(l);if(c&&c.simpleInstanced&&c.object===e&&c.geometry===e.geometry&&c.geometryVersion===m.version&&c.material===r[0]&&c.materialVersion===g.version&&c.instanceMatrix===p&&c.instanceVersion===p.version&&c.instanceAttributeCount===p.count&&c.instanceArray===p.array&&c.instanceCount===e.count&&c.parts.length===1&&c.parts[0].geometryId===i.id&&c.parts[0].materialId===l&&c.parts[0].offset===0&&c.parts[0].count===i.drawCount)return this._listen(e,"nodes",this._state.nodes,t),{primitive:0,parts:c.parts,instanceCount:e.count}}let h=s?[{geometryId:i.id,materialId:l,offset:0,count:i.drawCount}]:this._ensureBatchParts(e,i,r,n),u=h.map(p=>[p.geometryId,p.materialId,p.offset,p.count].join(":")).join("|"),f=`${o?`1:${o.count}:${o.signature}`:"0:1:-"};${u}`,d=this._nextVersion(this._state.batches,t,f);if(d){if(o)for(let m=0;m<o.valueCount;m++)ot(o.array[m],"instanceMatrix");let p=o?o.count:1;n.push(Jg(t,d.version,p,o?1:0,h,o?o.array:null)),this._mapSet(this._state.batches,t,{signature:f,version:d.version,object:e,parts:h,simpleInstanced:s,geometry:e.geometry,geometryVersion:this._state.geometries.get(i.id).version,material:s?r[0]:null,materialVersion:s?this._state.materials.get(l).version:0,instanceMatrix:o?e.instanceMatrix:null,instanceVersion:o?e.instanceMatrix.version:0,instanceAttributeCount:o?e.instanceMatrix.count:0,instanceArray:o?o.array:null,instanceCount:o?o.count:0})}return this._listen(e,"nodes",this._state.nodes,t),{primitive:0,parts:h,instanceCount:o?o.count:1}}_ensureNode(e,t,i,r){let n=_i(e),s=!e.material||e.material.visible!==!1,o=!!e.visible&&s,l=!!e.isInstancedMesh||!!(e.isMesh&&Array.isArray(e.material));if((!r||!s)&&!e.isLight&&!e.isCamera){let p=e.isMesh?1:e.isPoints?3:e.isLine||e.isLineSegments?2:0;return l||this._removeBatch(n,i),this._updateNode(e,n,t,0,0,o,p,i),{id:n,draw:null}}if(e.isInstancedMesh&&e.count===0){if(e.userData&&e.userData.jsrRetainEmptyBatch){let p=Array.isArray(e.material)?e.material:[e.material];p.some(g=>g.wireframe)&&L("wireframeBatch","R1 wireframe requires a single-material non-instanced Mesh");let m=this._ensureGeometry(e.geometry,0,"triangles",i);this._ensureBatch(e,n,m,p,i)}else this._removeBatch(n,i);return this._updateNode(e,n,t,0,0,o,1,i),{id:n,draw:null}}let c=0,h=0,u=0,f=null,d=null;if(e.isMesh||e.isLine||e.isLineSegments||e.isPoints){(e.isSkinnedMesh||e.isBatchedMesh||e.isSprite)&&L("objectType",e.type),e.isLineLoop&&L("LineLoop");let p=e.material;if(!p||Array.isArray(p)&&p.length===0)throw new Error("three.invalid: drawable has no material");let m=0,g="triangles";u=1,e.isPoints?(m=2,g="points",u=3):(e.isLine||e.isLineSegments)&&(m=1,g=e.isLineSegments?"lines":"line",u=2),Array.isArray(p)&&m!==0&&L("multiMaterial","R1 material arrays require triangle meshes");let _=Array.isArray(p)?p:[p],x=m===0&&_.some(b=>b.wireframe);l&&x&&L("wireframeBatch","R1 wireframe requires a single-material non-instanced Mesh");let v=this._ensureGeometry(e.geometry,m,g,i,x);l?d={geometry:v,materials:_}:(c=v.id,h=this._ensureMaterial(p,i),f={primitive:x?1:m,count:x?v.wireDrawCount:v.drawCount})}else{if(e.isLight||e.isCamera)return null;(e.isSkinnedMesh||e.isInstancedMesh||e.isBatchedMesh||e.isSprite||e.isLOD)&&L("objectType",e.type)}return l||this._removeBatch(n,i),this._updateNode(e,n,t,c,h,o,u,i),d&&(f=this._ensureBatch(e,n,d.geometry,d.materials,i)),{id:n,draw:f}}_ensureLight(e,t){let i;e.isAmbientLight?i=0:e.isDirectionalLight?i=1:e.isPointLight?i=2:e.isHemisphereLight?i=3:L("light",e.type);let r=_i(e);e.getWorldPosition(xi),yi.set(0,0,0),e.isDirectionalLight?(e.target.updateMatrixWorld(!0),i_.setFromMatrixPosition(e.target.matrixWorld),yi.copy(xi).sub(i_).normalize()):e.isHemisphereLight&&yi.copy(xi).normalize();let n=e.isHemisphereLight?e.groundColor:null,s=[i,e.color.r,e.color.g,e.color.b,e.intensity,xi.x,xi.y,xi.z,yi.x,yi.y,yi.z,n?n.r:0,n?n.g:0,n?n.b:0].join("|"),o=this._state.lights.get(r);if(!o||o.signature!==s){if(!Number.isFinite(e.intensity)||e.intensity<0)throw new Error("three.invalid: light intensity");pr([e.color.r,e.color.g,e.color.b,xi.x,xi.y,xi.z,yi.x,yi.y,yi.z],"light"),n&&pr([n.r,n.g,n.b],"light groundColor"),t.push(Kg(r,i,e.color,e.intensity,xi,yi,n)),this._mapSet(this._state.lights,r,{signature:s,object:e})}return r}_ensureCamera(e,t){(!e||!e.isPerspectiveCamera&&!e.isOrthographicCamera)&&L("camera","R1 supports perspective and orthographic cameras");let i=_i(e);pr(e.matrixWorld.elements,"camera matrixWorld"),pr(e.matrixWorldInverse.elements,"camera matrixWorldInverse"),pr(e.projectionMatrix.elements,"camera projectionMatrix");let r=[e.isPerspectiveCamera?0:1,zu(e.matrixWorldInverse),zu(e.projectionMatrix),zu(e.matrixWorld)].join("|"),n=this._state.cameras.get(i);return(!n||n.signature!==r)&&(t.push(jg(i,e.isPerspectiveCamera?0:1,e.matrixWorldInverse,e.projectionMatrix,e.matrixWorld)),this._mapSet(this._state.cameras,i,{signature:r,object:e})),i}_background(e){let t=e.background;return t==null?{r:this._clearColor.r,g:this._clearColor.g,b:this._clearColor.b,a:this._clearAlpha}:(t.isColor||L("backgroundTexture","R1 v1 accepts a Color or null background"),{r:t.r,g:t.g,b:t.b,a:1})}_fog(e){let t=e.fog;if(t==null)return{mode:0,color:{r:0,g:0,b:0},near:0,far:0};if(t.isFog||L("fogType","R1 supports linear THREE.Fog"),pr([t.color.r,t.color.g,t.color.b,t.near,t.far],"fog"),t.near<0||t.far<=t.near)throw new Error("three.invalid: fog requires 0 <= near < far");return{mode:1,color:t.color,near:t.near,far:t.far}}_shadow(e,t){if(!this.shadowMap.enabled)return Zc;if(!t||!t.shadow||!t.shadow.camera||!t.shadow.mapSize)return Zc;let i=t.shadow,r=Math.floor(i.mapSize.x),n=Math.floor(i.mapSize.y);t.target.updateMatrixWorld(!0),i.camera.updateProjectionMatrix(),i.updateMatrices(t);let s=this.shadowMap.autoUpdate===!1;s&&this.shadowMap.needsUpdate===!0&&(this._manualShadowRevision=this._manualShadowRevision+1>>>0,this._manualShadowRevision===0&&(this._manualShadowRevision=1),this.shadowMap.needsUpdate=!1);let o=!0;if(s){let l=this._manualShadowRevision+"|"+r+"|"+n+"|"+i.bias+"|"+i.normalBias+"|"+i.matrix.elements.join(",");o=l!==this._shadowCullingKey,this._shadowCullingKey=l}return{width:r,height:n,bias:i.bias,normalBias:i.normalBias,radius:i.radius,matrix:i.matrix,camera:i.camera,contentRevision:s?this._manualShadowRevision:void 0,refreshCulling:o}}_emit(e){let t=this.domElement,i=this._state.sequence+1,r=Hg(e,t.engineId,t.surfaceId,i);this.runtime.sendR1(r),this._state.sequence=i}render(e,t){let i=this._pendingDisposals.slice(),r=this._state.sequence;this._transaction=new Map,this._transactionListens=[];try{let n=this._render(e,t);return this._transaction=null,this._transactionListens=null,this.domElement._r1State=this._state,n}catch(n){let s=this._transaction,o=this._transactionListens;this._transaction=null,this._transactionListens=null;for(let l of o)this._unlisten(l);for(let[l,c]of s)for(let[h,u]of c)u[0]?l.set(h,u[1]):l.delete(h);throw this._state.sequence=r,this._pendingDisposals=i,n}}_render(e,t){if(this._disposed)throw new Error("three.surface: renderer is disposed");if(this.domElement.disposed)throw new Error("three.surface: canvas is disposed");if(!e||!e.isScene)throw new Error("three.invalid: render requires a Scene");this.outputColorSpace!==me&&L("outputColorSpace","native R1 requires SRGBColorSpace"),this.toneMapping!==hn&&L("toneMapping","native R1 requires NoToneMapping"),this.xr.enabled&&L("xr"),(this.localClippingEnabled||this.clippingPlanes.length)&&L("clippingPlanes"),(e.environment||e.overrideMaterial)&&L("sceneFeature","environment/overrideMaterial are outside R1 v1"),(!t||!t.isPerspectiveCamera&&!t.isOrthographicCamera)&&L("camera","R1 supports perspective and orthographic cameras"),e.matrixWorldAutoUpdate===!0&&e.updateMatrixWorld(),t.parent===null&&t.matrixWorldAutoUpdate===!0&&t.updateMatrixWorld(),t.matrixWorldInverse.copy(t.matrixWorld).invert(),this._frameGeometries=new Map,this._frameMaterials=new Map,this._frameTextures=new Map;let i=[],r=this._pendingDisposals.splice(0);for(let S of r)S.batch&&i.push(Jc(S.id)),i.push(jc(S.id,S.kind));let n=new Set,s=new Set,o=null,l=[],c=new Map,h=new Map,u=0,f=0,d=0,p=0,m=[],g=[];$c.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),Kc.setFromProjectionMatrix($c),e.traverseVisible(S=>{let w=(S.parent?h.get(S.parent)??!0:!0)&&!!S.visible&&(!S.material||S.material.visible!==!1);if(h.set(S,w),S.isLight){S.visible&&s.add(this._ensureLight(S,i)),!o&&S.isDirectionalLight&&S.visible&&S.castShadow&&(o=S),c.set(S,c.get(S.parent)||0);return}if(S.isCamera){c.set(S,c.get(S.parent)||0);return}let E=c.get(S.parent)||0;if(!w){c.set(S,E);return}let C=this._ensureNode(S,E,i,w);if(C){n.add(C.id),c.set(S,C.id),C.draw&&S.castShadow&&g.push(S);let N=C.draw&&S.frustumCulled&&!Kc.intersectsObject(S);if(N&&m.push(C.id),!N&&C.draw&&C.draw.parts){if(C.draw.instanceCount>0)for(let V of C.draw.parts)V.count!==0&&(u++,f+=V.count/3*C.draw.instanceCount)}else!N&&C.draw&&(u++,C.draw.primitive===0?f+=C.draw.count/3:C.draw.primitive===1?d+=C.draw.count/2:p+=C.draw.count)}else c.set(S,E)});for(let[S,A]of this._state.nodes)n.has(S)||(this._removeBatch(S,i),i.push(Zg(S)),this._mapDelete(this._state.nodes,S),l.push(A.object));for(let[S]of this._state.lights)s.has(S)||(i.push(jc(S,si.light)),this._mapDelete(this._state.lights,S));let _=this._ensureCamera(t,i),x=this._background(e),v=this._fog(e),b=this._shadow(e,o),M=b.camera&&b.refreshCulling===!1?this._cachedCulledShadowNodeIds:[];if(b.camera&&b.refreshCulling!==!1){$c.multiplyMatrices(b.camera.projectionMatrix,b.camera.matrixWorldInverse),Kc.setFromProjectionMatrix($c);for(let S of g)S.frustumCulled&&!Kc.intersectsObject(S)&&M.push(_i(S));this._cachedCulledShadowNodeIds=M}if(!Number.isFinite(this.toneMappingExposure)||this.toneMappingExposure<=0)throw new Error("three.invalid: exposure must be positive finite");pr([x.r,x.g,x.b,x.a],"background"),i.push($g(_i(e),_,x,this.toneMappingExposure,v,b,m,M)),this._emit(i),this._lastScene=e,this._lastCamera=t;for(let S of l)this._unlisten(S);this.info.render.frame++,this.info.render.calls=u,this.info.render.triangles=f,this.info.render.lines=d,this.info.render.points=p,this.info.memory.geometries=this._state.geometries.size,this.info.memory.textures=this._state.textures.size}dispose(){if(this._disposed)return;this._disposed=!0,this.setAnimationLoop(null),this._canvasRefreshHandle=null;for(let r of Array.from(this._canvasTextures.keys()))this._unwatchCanvasTexture(r);this._lastScene=null,this._lastCamera=null;let e=[],t=new Set,i=(r,n)=>{let s=`${n}:${r}`;t.has(s)||(t.add(s),e.push(jc(r,n)))};for(let[r]of this._state.batches)e.push(Jc(r));for(let[r]of this._state.geometries)i(r,si.geometry);for(let[r]of this._state.textures)i(r,si.texture);for(let[r]of this._state.materials)i(r,si.material);for(let[r]of this._state.nodes)i(r,si.node);for(let[r]of this._state.lights)i(r,si.light);for(let[r]of this._state.cameras)i(r,si.camera);e.push(Qg());try{this._emit(e)}finally{this._unlistenAll(),this._state.geometries.clear(),this._state.textures.clear(),this._state.materials.clear(),this._state.nodes.clear(),this._state.batches.clear(),this._state.lights.clear(),this._state.cameras.clear(),this.domElement.dispose(),this.domElement.renderer===this&&(this.domElement.renderer=null)}}};function l_(a){return Nu(a)}function jv(a){return a.buffer.slice(a.byteOffset,a.byteOffset+a.byteLength)}var mr=class extends le{constructor(e){super(e),this.mimeType="",this.responseType="",this._aborted=!1,this.canvas=null}setCanvas(e){return this.canvas=e,this}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._aborted=!0,this}load(e,t,i,r){e===void 0&&(e=""),e=this.path+e,e=this.manager.resolveURL(e);let n=ua(!1),s=this.canvas||n.getCanvas("main"),o=s?{canvas:s,generation:s.generation,epoch:s._assetEpoch}:null,l=Je.get(`file:${e}`),c=(u,f)=>{if(this._aborted)throw st(e,"request aborted");if(s&&(s.disposed||s.generation!==o.generation||s._assetEpoch!==o.epoch))throw st(e,"surface was disposed during file load");f&&f(u)},h=u=>{let f=u.bytes||on(u.data);switch(this.responseType){case"arraybuffer":return jv(f);case"json":return JSON.parse(l_(f));case"blob":return typeof Blob<"u"?new Blob([f],{type:u.mime||this.mimeType}):f;case"document":L("DOMParser","native FileLoader cannot parse XML/HTML documents");default:return l_(f)}};if(l!==void 0){this.manager.itemStart(e),Promise.resolve().then(()=>c(l,t)).catch(u=>{r&&r(u)}).finally(()=>this.manager.itemEnd(e));return}this.manager.itemStart(e),n.loadAsset(e,o).then(u=>{let f=h(u);Je.add(`file:${e}`,f),c(f,t)}).catch(u=>{r&&r(u),this.manager.itemError(e)}).finally(()=>this.manager.itemEnd(e))}};function Kv(a){let e=a.bytes,t=String(a.mime||"").toLowerCase();if(t.includes("rgba")||t.includes("raw"))return{encoding:0,encoded:!1};if(e.length>=8&&e[0]===137&&e[1]===80&&e[2]===78&&e[3]===71)return{encoding:1,encoded:!0};if(e.length>=2&&e[0]===255&&e[1]===216)return{encoding:2,encoded:!0};if(t.includes("png"))return{encoding:1,encoded:!0};if(t.includes("jpeg")||t.includes("jpg"))return{encoding:2,encoded:!0};throw st(a.url||"<texture>","only PNG, JPEG, or registered raw RGBA8 bytes are supported")}var an=class extends le{constructor(e){super(e),this.canvas=null}setCanvas(e){return this.canvas=e,this}load(e,t,i,r){let n=new te;e=this.path+(e===void 0?"":e),e=this.manager.resolveURL(e);let s=ua(!1),o=this.canvas||s.getCanvas("main"),l=o?o.generation:0,c=o?{canvas:o,generation:l,epoch:o._assetEpoch}:null;return this.manager.itemStart(e),s.loadAsset(e,c).then(h=>{if(o&&(o.disposed||o.generation!==l||o._assetEpoch!==c.epoch))throw st(e,"surface was disposed during texture load");let u=Kv(h);n.image={data:h.bytes,width:h.width||0,height:h.height||0,mime:h.mime||"",encoding:u.encoding,encoded:u.encoded},n.needsUpdate=!0,n.userData.jsrAssetUrl=e,t&&t(n)}).catch(h=>{r&&r(h),this.manager.itemError(e)}).finally(()=>this.manager.itemEnd(e)),n}};function ku(a,e){if(e===_h)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),a;if(e===Wn||e===Lo){let t=a.getIndex();if(t===null){let n=[],s=a.getAttribute("position");if(s!==void 0){for(let o=0;o<s.count;o++)n.push(o);a.setIndex(n),t=a.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),a}let i=t.count-2,r=[];if(e===Wn)for(let n=1;n<=i;n++)r.push(t.getX(0)),r.push(t.getX(n)),r.push(t.getX(n+1));else for(let n=0;n<i;n++)n%2===0?(r.push(t.getX(n)),r.push(t.getX(n+1)),r.push(t.getX(n+2))):(r.push(t.getX(n+2)),r.push(t.getX(n+1)),r.push(t.getX(n)));return r.length/3!==i&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles."),a.setIndex(r),a.clearGroups(),a}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",e),a}function c_(a){let e=new Map,t=new Map,i=a.clone();return h_(a,i,function(r,n){e.set(n,r),t.set(r,n)}),i.traverse(function(r){if(!r.isSkinnedMesh)return;let n=r,s=e.get(r),o=s.skeleton.bones;n.skeleton=s.skeleton.clone(),n.bindMatrix.copy(s.bindMatrix),n.skeleton.bones=o.map(function(l){return t.get(l)}),n.bind(n.skeleton,n.bindMatrix)}),i}function h_(a,e,t){t(a,e);for(let i=0;i<a.children.length;i++)h_(a.children[i],e.children[i],t)}var th=class extends le{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new Yu(t)}),this.register(function(t){return new Zu(t)}),this.register(function(t){return new nf(t)}),this.register(function(t){return new sf(t)}),this.register(function(t){return new of(t)}),this.register(function(t){return new ju(t)}),this.register(function(t){return new Ku(t)}),this.register(function(t){return new $u(t)}),this.register(function(t){return new Qu(t)}),this.register(function(t){return new Xu(t)}),this.register(function(t){return new ef(t)}),this.register(function(t){return new Ju(t)}),this.register(function(t){return new rf(t)}),this.register(function(t){return new tf(t)}),this.register(function(t){return new Wu(t)}),this.register(function(t){return new ih(t,ie.EXT_MESHOPT_COMPRESSION)}),this.register(function(t){return new ih(t,ie.KHR_MESHOPT_COMPRESSION)}),this.register(function(t){return new af(t)})}load(e,t,i,r){let n=this,s;if(this.resourcePath!=="")s=this.resourcePath;else if(this.path!==""){let c=Dt.extractUrlBase(e);s=Dt.resolveURL(c,this.path)}else s=Dt.extractUrlBase(e);this.manager.itemStart(e);let o=function(c){r?r(c):console.error(c),n.manager.itemError(e),n.manager.itemEnd(e)},l=new mr(this.manager);l.setPath(this.path),l.setResponseType("arraybuffer"),l.setRequestHeader(this.requestHeader),l.setWithCredentials(this.withCredentials),l.load(e,function(c){try{n.parse(c,s,function(h){t(h),n.manager.itemEnd(e)},o)}catch(h){o(h)}},i,o)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,i,r){let n,s={},o={},l=new TextDecoder;if(typeof e=="string")n=JSON.parse(e);else if(e instanceof ArrayBuffer)if(l.decode(new Uint8Array(e,0,4))===m_){try{s[ie.KHR_BINARY_GLTF]=new lf(e)}catch(u){r&&r(u);return}n=JSON.parse(s[ie.KHR_BINARY_GLTF].content)}else n=JSON.parse(l.decode(e));else n=e;if(n.asset===void 0||n.asset.version[0]<2){r&&r(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}let c=new mf(n,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});c.fileLoader.setRequestHeader(this.requestHeader);for(let h=0;h<this.pluginCallbacks.length;h++){let u=this.pluginCallbacks[h](c);u.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),o[u.name]=u,s[u.name]=!0}if(n.extensionsUsed)for(let h=0;h<n.extensionsUsed.length;++h){let u=n.extensionsUsed[h],f=n.extensionsRequired||[];switch(u){case ie.KHR_MATERIALS_UNLIT:s[u]=new qu;break;case ie.KHR_DRACO_MESH_COMPRESSION:s[u]=new cf(n,this.dracoLoader);break;case ie.KHR_TEXTURE_TRANSFORM:s[u]=new hf;break;case ie.KHR_MESH_QUANTIZATION:s[u]=new uf;break;default:f.indexOf(u)>=0&&o[u]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+u+'".')}}c.setExtensions(s),c.setPlugins(o),c.parse(i,r)}parseAsync(e,t){let i=this;return new Promise(function(r,n){i.parse(e,t,r,n)})}};function $v(){let a={};return{get:function(e){return a[e]},add:function(e,t){a[e]=t},remove:function(e){delete a[e]},removeAll:function(){a={}}}}function Be(a,e,t){let i=a.json.materials[e];return i.extensions&&i.extensions[t]?i.extensions[t]:null}var ie={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",KHR_MESHOPT_COMPRESSION:"KHR_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"},Wu=class{constructor(e){this.parser=e,this.name=ie.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){let e=this.parser,t=this.parser.json.nodes||[];for(let i=0,r=t.length;i<r;i++){let n=t[i];n.extensions&&n.extensions[this.name]&&n.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,n.extensions[this.name].light)}}_loadLight(e){let t=this.parser,i="light:"+e,r=t.cache.get(i);if(r)return r;let n=t.json,l=((n.extensions&&n.extensions[this.name]||{}).lights||[])[e],c,h=new I(16777215);l.color!==void 0&&h.setRGB(l.color[0],l.color[1],l.color[2],Ke);let u=l.range!==void 0?l.range:0;switch(l.type){case"directional":c=new cr(h),c.target.position.set(0,0,-1),c.add(c.target);break;case"point":c=new lr(h),c.distance=u;break;case"spot":c=new ar(h),c.distance=u,l.spot=l.spot||{},l.spot.innerConeAngle=l.spot.innerConeAngle!==void 0?l.spot.innerConeAngle:0,l.spot.outerConeAngle=l.spot.outerConeAngle!==void 0?l.spot.outerConeAngle:Math.PI/4,c.angle=l.spot.outerConeAngle,c.penumbra=1-l.spot.innerConeAngle/l.spot.outerConeAngle,c.target.position.set(0,0,-1),c.add(c.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+l.type)}return c.position.set(0,0,0),vi(c,l),l.intensity!==void 0&&(c.intensity=l.intensity),c.name=t.createUniqueName(l.name||"light_"+e),r=Promise.resolve(c),t.cache.add(i,r),r}getDependency(e,t){if(e==="light")return this._loadLight(t)}createNodeAttachment(e){let t=this,i=this.parser,n=i.json.nodes[e],o=(n.extensions&&n.extensions[this.name]||{}).light;return o===void 0?null:this._loadLight(o).then(function(l){return i._getNodeRef(t.cache,o,l)})}},qu=class{constructor(){this.name=ie.KHR_MATERIALS_UNLIT}getMaterialType(){return Se}extendParams(e,t,i){let r=[];e.color=new I(1,1,1),e.opacity=1;let n=t.pbrMetallicRoughness;if(n){if(Array.isArray(n.baseColorFactor)){let s=n.baseColorFactor;e.color.setRGB(s[0],s[1],s[2],Ke),e.opacity=s[3]}n.baseColorTexture!==void 0&&r.push(i.assignTexture(e,"map",n.baseColorTexture,me))}return Promise.all(r)}},Xu=class{constructor(e){this.parser=e,this.name=ie.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){let i=Be(this.parser,e,this.name);return i===null||i.emissiveStrength!==void 0&&(t.emissiveIntensity=i.emissiveStrength),Promise.resolve()}},Yu=class{constructor(e){this.parser=e,this.name=ie.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){return Be(this.parser,e,this.name)!==null?Ze:null}extendMaterialParams(e,t){let i=Be(this.parser,e,this.name);if(i===null)return Promise.resolve();let r=[];if(i.clearcoatFactor!==void 0&&(t.clearcoat=i.clearcoatFactor),i.clearcoatTexture!==void 0&&r.push(this.parser.assignTexture(t,"clearcoatMap",i.clearcoatTexture)),i.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=i.clearcoatRoughnessFactor),i.clearcoatRoughnessTexture!==void 0&&r.push(this.parser.assignTexture(t,"clearcoatRoughnessMap",i.clearcoatRoughnessTexture)),i.clearcoatNormalTexture!==void 0&&(r.push(this.parser.assignTexture(t,"clearcoatNormalMap",i.clearcoatNormalTexture)),i.clearcoatNormalTexture.scale!==void 0)){let n=i.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new T(n,n)}return Promise.all(r)}},Zu=class{constructor(e){this.parser=e,this.name=ie.KHR_MATERIALS_DISPERSION}getMaterialType(e){return Be(this.parser,e,this.name)!==null?Ze:null}extendMaterialParams(e,t){let i=Be(this.parser,e,this.name);return i===null||(t.dispersion=i.dispersion!==void 0?i.dispersion:0),Promise.resolve()}},Ju=class{constructor(e){this.parser=e,this.name=ie.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){return Be(this.parser,e,this.name)!==null?Ze:null}extendMaterialParams(e,t){let i=Be(this.parser,e,this.name);if(i===null)return Promise.resolve();let r=[];return i.iridescenceFactor!==void 0&&(t.iridescence=i.iridescenceFactor),i.iridescenceTexture!==void 0&&r.push(this.parser.assignTexture(t,"iridescenceMap",i.iridescenceTexture)),i.iridescenceIor!==void 0&&(t.iridescenceIOR=i.iridescenceIor),t.iridescenceThicknessRange===void 0&&(t.iridescenceThicknessRange=[100,400]),i.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessRange[0]=i.iridescenceThicknessMinimum),i.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessRange[1]=i.iridescenceThicknessMaximum),i.iridescenceThicknessTexture!==void 0&&r.push(this.parser.assignTexture(t,"iridescenceThicknessMap",i.iridescenceThicknessTexture)),Promise.all(r)}},ju=class{constructor(e){this.parser=e,this.name=ie.KHR_MATERIALS_SHEEN}getMaterialType(e){return Be(this.parser,e,this.name)!==null?Ze:null}extendMaterialParams(e,t){let i=Be(this.parser,e,this.name);if(i===null)return Promise.resolve();let r=[];if(t.sheenColor=new I(0,0,0),t.sheenRoughness=0,t.sheen=1,i.sheenColorFactor!==void 0){let n=i.sheenColorFactor;t.sheenColor.setRGB(n[0],n[1],n[2],Ke)}return i.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=i.sheenRoughnessFactor),i.sheenColorTexture!==void 0&&r.push(this.parser.assignTexture(t,"sheenColorMap",i.sheenColorTexture,me)),i.sheenRoughnessTexture!==void 0&&r.push(this.parser.assignTexture(t,"sheenRoughnessMap",i.sheenRoughnessTexture)),Promise.all(r)}},Ku=class{constructor(e){this.parser=e,this.name=ie.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){return Be(this.parser,e,this.name)!==null?Ze:null}extendMaterialParams(e,t){let i=Be(this.parser,e,this.name);if(i===null)return Promise.resolve();let r=[];return i.transmissionFactor!==void 0&&(t.transmission=i.transmissionFactor),i.transmissionTexture!==void 0&&r.push(this.parser.assignTexture(t,"transmissionMap",i.transmissionTexture)),Promise.all(r)}},$u=class{constructor(e){this.parser=e,this.name=ie.KHR_MATERIALS_VOLUME}getMaterialType(e){return Be(this.parser,e,this.name)!==null?Ze:null}extendMaterialParams(e,t){let i=Be(this.parser,e,this.name);if(i===null)return Promise.resolve();let r=[];t.thickness=i.thicknessFactor!==void 0?i.thicknessFactor:0,i.thicknessTexture!==void 0&&r.push(this.parser.assignTexture(t,"thicknessMap",i.thicknessTexture)),t.attenuationDistance=i.attenuationDistance||1/0;let n=i.attenuationColor||[1,1,1];return t.attenuationColor=new I().setRGB(n[0],n[1],n[2],Ke),Promise.all(r)}},Qu=class{constructor(e){this.parser=e,this.name=ie.KHR_MATERIALS_IOR}getMaterialType(e){return Be(this.parser,e,this.name)!==null?Ze:null}extendMaterialParams(e,t){let i=Be(this.parser,e,this.name);return i===null||(t.ior=i.ior!==void 0?i.ior:1.5,t.ior===0&&(t.ior=1e3)),Promise.resolve()}},ef=class{constructor(e){this.parser=e,this.name=ie.KHR_MATERIALS_SPECULAR}getMaterialType(e){return Be(this.parser,e,this.name)!==null?Ze:null}extendMaterialParams(e,t){let i=Be(this.parser,e,this.name);if(i===null)return Promise.resolve();let r=[];t.specularIntensity=i.specularFactor!==void 0?i.specularFactor:1,i.specularTexture!==void 0&&r.push(this.parser.assignTexture(t,"specularIntensityMap",i.specularTexture));let n=i.specularColorFactor||[1,1,1];return t.specularColor=new I().setRGB(n[0],n[1],n[2],Ke),i.specularColorTexture!==void 0&&r.push(this.parser.assignTexture(t,"specularColorMap",i.specularColorTexture,me)),Promise.all(r)}},tf=class{constructor(e){this.parser=e,this.name=ie.EXT_MATERIALS_BUMP}getMaterialType(e){return Be(this.parser,e,this.name)!==null?Ze:null}extendMaterialParams(e,t){let i=Be(this.parser,e,this.name);if(i===null)return Promise.resolve();let r=[];return t.bumpScale=i.bumpFactor!==void 0?i.bumpFactor:1,i.bumpTexture!==void 0&&r.push(this.parser.assignTexture(t,"bumpMap",i.bumpTexture)),Promise.all(r)}},rf=class{constructor(e){this.parser=e,this.name=ie.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){return Be(this.parser,e,this.name)!==null?Ze:null}extendMaterialParams(e,t){let i=Be(this.parser,e,this.name);if(i===null)return Promise.resolve();let r=[];return i.anisotropyStrength!==void 0&&(t.anisotropy=i.anisotropyStrength),i.anisotropyRotation!==void 0&&(t.anisotropyRotation=i.anisotropyRotation),i.anisotropyTexture!==void 0&&r.push(this.parser.assignTexture(t,"anisotropyMap",i.anisotropyTexture)),Promise.all(r)}},nf=class{constructor(e){this.parser=e,this.name=ie.KHR_TEXTURE_BASISU}loadTexture(e){let t=this.parser,i=t.json,r=i.textures[e];if(!r.extensions||!r.extensions[this.name])return null;let n=r.extensions[this.name],s=t.options.ktx2Loader;if(!s){if(i.extensionsRequired&&i.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(e,n.source,s)}},sf=class{constructor(e){this.parser=e,this.name=ie.EXT_TEXTURE_WEBP}loadTexture(e){let t=this.name,i=this.parser,r=i.json,n=r.textures[e];if(!n.extensions||!n.extensions[t])return null;let s=n.extensions[t],o=r.images[s.source],l=i.textureLoader;if(o.uri){let c=i.options.manager.getHandler(o.uri);c!==null&&(l=c)}return i.loadTextureImage(e,s.source,l)}},of=class{constructor(e){this.parser=e,this.name=ie.EXT_TEXTURE_AVIF}loadTexture(e){let t=this.name,i=this.parser,r=i.json,n=r.textures[e];if(!n.extensions||!n.extensions[t])return null;let s=n.extensions[t],o=r.images[s.source],l=i.textureLoader;if(o.uri){let c=i.options.manager.getHandler(o.uri);c!==null&&(l=c)}return i.loadTextureImage(e,s.source,l)}},ih=class{constructor(e,t){this.name=t,this.parser=e}loadBufferView(e){let t=this.parser.json,i=t.bufferViews[e];if(i.extensions&&i.extensions[this.name]){let r=i.extensions[this.name],n=this.parser.getDependency("buffer",r.buffer),s=this.parser.options.meshoptDecoder;if(!s||!s.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return n.then(function(o){let l=r.byteOffset||0,c=r.byteLength||0,h=r.count,u=r.byteStride,f=new Uint8Array(o,l,c);return s.decodeGltfBufferAsync?s.decodeGltfBufferAsync(h,u,f,r.mode,r.filter).then(function(d){return d.buffer}):s.ready.then(function(){let d=new ArrayBuffer(h*u);return s.decodeGltfBuffer(new Uint8Array(d),h,u,f,r.mode,r.filter),d})})}else return null}},af=class{constructor(e){this.name=ie.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){let t=this.parser.json,i=t.nodes[e];if(!i.extensions||!i.extensions[this.name]||i.mesh===void 0)return null;let r=t.meshes[i.mesh];for(let c of r.primitives)if(c.mode!==Xt.TRIANGLES&&c.mode!==Xt.TRIANGLE_STRIP&&c.mode!==Xt.TRIANGLE_FAN&&c.mode!==void 0)return null;let s=i.extensions[this.name].attributes,o=[],l={};for(let c in s)o.push(this.parser.getDependency("accessor",s[c]).then(h=>(l[c]=h,l[c])));return o.length<1?null:(o.push(this.parser.createNodeMesh(e)),Promise.all(o).then(c=>{let h=c.pop(),u=h.isGroup?h.children:[h],f=c[0].count,d=[];for(let p of u){let m=new F,g=new y,_=new ce,x=new y(1,1,1),v=new er(p.geometry,p.material,f);for(let M=0;M<f;M++)l.TRANSLATION&&g.fromBufferAttribute(l.TRANSLATION,M),l.ROTATION&&_.fromBufferAttribute(l.ROTATION,M),l.SCALE&&x.fromBufferAttribute(l.SCALE,M),v.setMatrixAt(M,m.compose(g,_,x));let b=null;for(let M in l)if(M==="_COLOR_0"){let S=l[M];v.instanceColor=new tt(S.array,S.itemSize,S.normalized)}else if(M!=="TRANSLATION"&&M!=="ROTATION"&&M!=="SCALE"){if(b===null){let A=v.geometry;b=new P,b.name=A.name;for(let w in A.attributes)b.setAttribute(w,A.attributes[w]);for(let w in A.morphAttributes)b.morphAttributes[w]=A.morphAttributes[w];A.index!==null&&b.setIndex(A.index),b.morphTargetsRelative=A.morphTargetsRelative;for(let w of A.groups)b.addGroup(w.start,w.count,w.materialIndex);A.boundingBox!==null&&(b.boundingBox=A.boundingBox.clone()),A.boundingSphere!==null&&(b.boundingSphere=A.boundingSphere.clone()),b.drawRange.start=A.drawRange.start,b.drawRange.count=A.drawRange.count,b.userData=Object.assign({},A.userData),v.geometry=b}let S=l[M];b.setAttribute(M,new tt(S.array,S.itemSize,S.normalized))}G.prototype.copy.call(v,p),this.parser.assignFinalMaterial(v),d.push(v)}return h.isGroup?(h.clear(),h.add(...d),h):d[0]}))}},m_="glTF",da=12,u_={JSON:1313821514,BIN:5130562},lf=class{constructor(e){this.name=ie.KHR_BINARY_GLTF,this.content=null,this.body=null;let t=new DataView(e,0,da),i=new TextDecoder;if(this.header={magic:i.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==m_)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");let r=this.header.length-da,n=new DataView(e,da),s=0;for(;s<r;){let o=n.getUint32(s,!0);s+=4;let l=n.getUint32(s,!0);if(s+=4,l===u_.JSON){let c=new Uint8Array(e,da+s,o);this.content=i.decode(c)}else if(l===u_.BIN){let c=da+s;this.body=e.slice(c,c+o)}s+=o}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}},cf=class{constructor(e,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=ie.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){let i=this.json,r=this.dracoLoader,n=e.extensions[this.name].bufferView,s=e.extensions[this.name].attributes,o={},l={},c={};for(let h in s){let u=df[h]||h.toLowerCase();o[u]=s[h]}for(let h in e.attributes){let u=df[h]||h.toLowerCase();if(s[h]!==void 0){let f=i.accessors[e.attributes[h]],d=co[f.componentType];c[u]=d.name,l[u]=f.normalized===!0}}return t.getDependency("bufferView",n).then(function(h){return new Promise(function(u,f){r.decodeDracoFile(h,function(d){for(let p in d.attributes){let m=d.attributes[p],g=l[p];g!==void 0&&(m.normalized=g)}u(d)},o,c,Ke,f)})})}},hf=class{constructor(){this.name=ie.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){if((t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0)return e;if(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),t.rotation!==void 0){let i=Math.cos(e.rotation),r=Math.sin(e.rotation);e.matrix.set(e.repeat.x*i,e.repeat.y*r,e.offset.x,-e.repeat.x*r,e.repeat.y*i,e.offset.y,0,0,1),e.matrixAutoUpdate=!1}return e.needsUpdate=!0,e}},uf=class{constructor(){this.name=ie.KHR_MESH_QUANTIZATION}},rh=class extends nt{constructor(e,t,i,r){super(e,t,i,r)}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,r=this.valueSize,n=e*r*3+r;for(let s=0;s!==r;s++)t[s]=i[n+s];return t}interpolate_(e,t,i,r){let n=this.resultBuffer,s=this.sampleValues,o=this.valueSize,l=o*2,c=o*3,h=r-t,u=(i-t)/h,f=u*u,d=f*u,p=e*c,m=p-c,g=-2*d+3*f,_=d-f,x=1-g,v=_-f+u;for(let b=0;b!==o;b++){let M=s[m+b+o],S=s[m+b+l]*h,A=s[p+b+o],w=s[p+b]*h;n[b]=x*M+v*S+g*A+_*w}return n}},Qv=new ce,ff=class extends rh{interpolate_(e,t,i,r){let n=super.interpolate_(e,t,i,r);return Qv.fromArray(n).normalize().toArray(n),n}},Xt={FLOAT:5126,FLOAT_MAT3:35675,FLOAT_MAT4:35676,FLOAT_VEC2:35664,FLOAT_VEC3:35665,FLOAT_VEC4:35666,LINEAR:9729,REPEAT:10497,SAMPLER_2D:35678,POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6,UNSIGNED_BYTE:5121,UNSIGNED_SHORT:5123},co={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},f_={9728:fe,9729:de,9984:yr,9985:mo,9986:vr,9987:Ot},d_={33071:Ue,33648:Yt,10497:wt},Vu={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},df={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},gr={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},eb={CUBICSPLINE:void 0,LINEAR:Vi,STEP:ai},Gu={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function tb(a){return a.DefaultMaterial===void 0&&(a.DefaultMaterial=new ei({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:Mi})),a.DefaultMaterial}function ln(a,e,t){for(let i in t.extensions)a[i]===void 0&&(e.userData.gltfExtensions=e.userData.gltfExtensions||{},e.userData.gltfExtensions[i]=t.extensions[i])}function vi(a,e){e.extras!==void 0&&(typeof e.extras=="object"?Object.assign(a.userData,e.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+e.extras))}function ib(a,e,t){let i=!1,r=!1,n=!1;for(let c=0,h=e.length;c<h;c++){let u=e[c];if(u.POSITION!==void 0&&(i=!0),u.NORMAL!==void 0&&(r=!0),u.COLOR_0!==void 0&&(n=!0),i&&r&&n)break}if(!i&&!r&&!n)return Promise.resolve(a);let s=[],o=[],l=[];for(let c=0,h=e.length;c<h;c++){let u=e[c];if(i){let f=u.POSITION!==void 0?t.getDependency("accessor",u.POSITION):a.attributes.position;s.push(f)}if(r){let f=u.NORMAL!==void 0?t.getDependency("accessor",u.NORMAL):a.attributes.normal;o.push(f)}if(n){let f=u.COLOR_0!==void 0?t.getDependency("accessor",u.COLOR_0):a.attributes.color;l.push(f)}}return Promise.all([Promise.all(s),Promise.all(o),Promise.all(l)]).then(function(c){let h=c[0],u=c[1],f=c[2];return i&&(a.morphAttributes.position=h),r&&(a.morphAttributes.normal=u),n&&(a.morphAttributes.color=f),a.morphTargetsRelative=!0,a})}function rb(a,e){if(a.updateMorphTargets(),e.weights!==void 0)for(let t=0,i=e.weights.length;t<i;t++)a.morphTargetInfluences[t]=e.weights[t];if(e.extras&&Array.isArray(e.extras.targetNames)){let t=e.extras.targetNames;if(a.morphTargetInfluences.length===t.length){a.morphTargetDictionary={};for(let i=0,r=t.length;i<r;i++)a.morphTargetDictionary[t[i]]=i}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function nb(a){let e,t=a.extensions&&a.extensions[ie.KHR_DRACO_MESH_COMPRESSION];if(t?e="draco:"+t.bufferView+":"+t.indices+":"+Hu(t.attributes):e=a.indices+":"+Hu(a.attributes)+":"+a.mode,a.targets!==void 0)for(let i=0,r=a.targets.length;i<r;i++)e+=":"+Hu(a.targets[i]);return e}function Hu(a){let e="",t=Object.keys(a).sort();for(let i=0,r=t.length;i<r;i++)e+=t[i]+":"+a[t[i]]+";";return e}function pf(a){switch(a){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function sb(a){return a.search(/\.jpe?g($|\?)/i)>0||a.search(/^data\:image\/jpeg/)===0?"image/jpeg":a.search(/\.webp($|\?)/i)>0||a.search(/^data\:image\/webp/)===0?"image/webp":a.search(/\.ktx2($|\?)/i)>0||a.search(/^data\:image\/ktx2/)===0?"image/ktx2":"image/png"}var ob=new F,mf=class{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new $v,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let i=!1,r=-1,n=!1,s=-1;if(typeof navigator<"u"&&typeof navigator.userAgent<"u"){let o=navigator.userAgent;i=/^((?!chrome|android).)*safari/i.test(o)===!0;let l=o.match(/Version\/(\d+)/);r=i&&l?parseInt(l[1],10):-1,n=o.indexOf("Firefox")>-1,s=n?o.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>"u"||i&&r<17||n&&s<98?this.textureLoader=new an(this.options.manager):this.textureLoader=new Js(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new mr(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){let i=this,r=this.json,n=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(s){return s._markDefs&&s._markDefs()}),Promise.all(this._invokeAll(function(s){return s.beforeRoot&&s.beforeRoot()})).then(function(){return Promise.all([i.getDependencies("scene"),i.getDependencies("animation"),i.getDependencies("camera")])}).then(function(s){let o={scene:s[0][r.scene||0],scenes:s[0],animations:s[1],cameras:s[2],asset:r.asset,parser:i,userData:{}};return ln(n,o,r),vi(o,r),Promise.all(i._invokeAll(function(l){return l.afterRoot&&l.afterRoot(o)})).then(function(){for(let l of o.scenes)l.updateMatrixWorld();e(o)})}).catch(t)}_markDefs(){let e=this.json.nodes||[],t=this.json.skins||[],i=this.json.meshes||[];for(let r=0,n=t.length;r<n;r++){let s=t[r].joints;for(let o=0,l=s.length;o<l;o++)e[s[o]].isBone=!0}for(let r=0,n=e.length;r<n;r++){let s=e[r];s.mesh!==void 0&&(this._addNodeRef(this.meshCache,s.mesh),s.skin!==void 0&&(i[s.mesh].isSkinnedMesh=!0)),s.camera!==void 0&&this._addNodeRef(this.cameraCache,s.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,i){if(e.refs[t]<=1)return i;let r=i.clone(),n=(s,o)=>{let l=this.associations.get(s);l!=null&&this.associations.set(o,l);for(let[c,h]of s.children.entries())n(h,o.children[c])};return n(i,r),r.name+="_instance_"+e.uses[t]++,r}_invokeOne(e){let t=Object.values(this.plugins);t.push(this);for(let i=0;i<t.length;i++){let r=e(t[i]);if(r)return r}return null}_invokeAll(e){let t=Object.values(this.plugins);t.unshift(this);let i=[];for(let r=0;r<t.length;r++){let n=e(t[r]);n&&i.push(n)}return i}getDependency(e,t){let i=e+":"+t,r=this.cache.get(i);if(!r){switch(e){case"scene":r=this.loadScene(t);break;case"node":r=this._invokeOne(function(n){return n.loadNode&&n.loadNode(t)});break;case"mesh":r=this._invokeOne(function(n){return n.loadMesh&&n.loadMesh(t)});break;case"accessor":r=this.loadAccessor(t);break;case"bufferView":r=this._invokeOne(function(n){return n.loadBufferView&&n.loadBufferView(t)});break;case"buffer":r=this.loadBuffer(t);break;case"material":r=this._invokeOne(function(n){return n.loadMaterial&&n.loadMaterial(t)});break;case"texture":r=this._invokeOne(function(n){return n.loadTexture&&n.loadTexture(t)});break;case"skin":r=this.loadSkin(t);break;case"animation":r=this._invokeOne(function(n){return n.loadAnimation&&n.loadAnimation(t)});break;case"camera":r=this.loadCamera(t);break;default:if(r=this._invokeOne(function(n){return n!=this&&n.getDependency&&n.getDependency(e,t)}),!r)throw new Error("Unknown type: "+e);break}this.cache.add(i,r)}return r}getDependencies(e){let t=this.cache.get(e);if(!t){let i=this,r=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(r.map(function(n,s){return i.getDependency(e,s)})),this.cache.add(e,t)}return t}loadBuffer(e){let t=this.json.buffers[e],i=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[ie.KHR_BINARY_GLTF].body);let r=this.options;return new Promise(function(n,s){i.load(Dt.resolveURL(t.uri,r.path),n,void 0,function(){s(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){let t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(i){let r=t.byteLength||0,n=t.byteOffset||0;return i.slice(n,n+r)})}loadAccessor(e){let t=this,i=this.json,r=this.json.accessors[e];if(r.bufferView===void 0&&r.sparse===void 0){let s=Vu[r.type],o=co[r.componentType],l=r.normalized===!0,c=new o(r.count*s);return Promise.resolve(new j(c,s,l))}let n=[];return r.bufferView!==void 0?n.push(this.getDependency("bufferView",r.bufferView)):n.push(null),r.sparse!==void 0&&(n.push(this.getDependency("bufferView",r.sparse.indices.bufferView)),n.push(this.getDependency("bufferView",r.sparse.values.bufferView))),Promise.all(n).then(function(s){let o=s[0],l=Vu[r.type],c=co[r.componentType],h=c.BYTES_PER_ELEMENT,u=h*l,f=r.byteOffset||0,d=r.bufferView!==void 0?i.bufferViews[r.bufferView].byteStride:void 0,p=r.normalized===!0,m,g;if(d&&d!==u){let _=Math.floor(f/d),x="InterleavedBuffer:"+r.bufferView+":"+r.componentType+":"+_+":"+r.count,v=t.cache.get(x);v||(m=new c(o,_*d,r.count*d/h),v=new It(m,d/h),t.cache.add(x,v)),g=new Rt(v,l,f%d/h,p)}else o===null?m=new c(r.count*l):m=new c(o,f,r.count*l),g=new j(m,l,p);if(r.sparse!==void 0){let _=Vu.SCALAR,x=co[r.sparse.indices.componentType],v=r.sparse.indices.byteOffset||0,b=r.sparse.values.byteOffset||0,M=new x(s[1],v,r.sparse.count*_),S=new c(s[2],b,r.sparse.count*l);o!==null&&(g=new j(g.array.slice(),g.itemSize,g.normalized)),g.normalized=!1;for(let A=0,w=M.length;A<w;A++){let E=M[A];if(g.setX(E,S[A*l]),l>=2&&g.setY(E,S[A*l+1]),l>=3&&g.setZ(E,S[A*l+2]),l>=4&&g.setW(E,S[A*l+3]),l>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}g.normalized=p}return g})}loadTexture(e){let t=this.json,i=this.options,n=t.textures[e].source,s=t.images[n],o=this.textureLoader;if(s.uri){let l=i.manager.getHandler(s.uri);l!==null&&(o=l)}return this.loadTextureImage(e,n,o)}loadTextureImage(e,t,i){let r=this,n=this.json,s=n.textures[e],o=n.images[t],l=(o.uri||o.bufferView)+":"+s.sampler;if(this.textureCache[l])return this.textureCache[l];let c=this.loadImageSource(t,i).then(function(h){h.flipY=!1,h.name=s.name||o.name||"",h.name===""&&typeof o.uri=="string"&&o.uri.startsWith("data:image/")===!1&&(h.name=o.uri);let f=(n.samplers||{})[s.sampler]||{};return h.magFilter=f_[f.magFilter]||de,h.minFilter=f_[f.minFilter]||Ot,h.wrapS=d_[f.wrapS]||wt,h.wrapT=d_[f.wrapT]||wt,h.generateMipmaps=!h.isCompressedTexture&&h.minFilter!==fe&&h.minFilter!==de,r.associations.set(h,{textures:e}),h}).catch(function(){return null});return this.textureCache[l]=c,c}loadImageSource(e,t){let i=this,r=this.json,n=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(u=>u.clone());let s=r.images[e],o=self.URL||self.webkitURL,l=s.uri||"",c=!1;if(s.bufferView!==void 0)l=i.getDependency("bufferView",s.bufferView).then(function(u){c=!0;let f=new Blob([u],{type:s.mimeType});return l=o.createObjectURL(f),l});else if(s.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");let h=Promise.resolve(l).then(function(u){return new Promise(function(f,d){let p=f;t.isImageBitmapLoader===!0&&(p=function(m){let g=new te(m);g.needsUpdate=!0,f(g)}),t.load(Dt.resolveURL(u,n.path),p,void 0,d)})}).then(function(u){return c===!0&&o.revokeObjectURL(l),vi(u,s),u.userData.mimeType=s.mimeType||sb(s.uri),u}).catch(function(u){throw console.error("THREE.GLTFLoader: Couldn't load texture",l),u});return this.sourceCache[e]=h,h}assignTexture(e,t,i,r){let n=this;return this.getDependency("texture",i.index).then(function(s){if(!s)return null;if(i.texCoord!==void 0&&i.texCoord>0&&(s=s.clone(),s.channel=i.texCoord),n.extensions[ie.KHR_TEXTURE_TRANSFORM]){let o=i.extensions!==void 0?i.extensions[ie.KHR_TEXTURE_TRANSFORM]:void 0;if(o){let l=n.associations.get(s);s=n.extensions[ie.KHR_TEXTURE_TRANSFORM].extendTexture(s,o),n.associations.set(s,l)}}return r!==void 0&&(s.colorSpace=r),e[t]=s,s})}assignFinalMaterial(e){let t=e.geometry,i=e.material,r=t.attributes.tangent===void 0,n=t.attributes.color!==void 0,s=t.attributes.normal===void 0;if(e.isPoints){let o="PointsMaterial:"+i.uuid,l=this.cache.get(o);l||(l=new hi,$.prototype.copy.call(l,i),l.color.copy(i.color),l.map=i.map,l.sizeAttenuation=!1,this.cache.add(o,l)),i=l}else if(e.isLine){let o="LineBasicMaterial:"+i.uuid,l=this.cache.get(o);l||(l=new re,$.prototype.copy.call(l,i),l.color.copy(i.color),l.map=i.map,this.cache.add(o,l)),i=l}if(r||n||s){let o="ClonedMaterial:"+i.uuid+":";r&&(o+="derivative-tangents:"),n&&(o+="vertex-colors:"),s&&(o+="flat-shading:");let l=this.cache.get(o);l||(l=i.clone(),n&&(l.vertexColors=!0),s&&(l.flatShading=!0),r&&(l.normalScale&&(l.normalScale.y*=-1),l.clearcoatNormalScale&&(l.clearcoatNormalScale.y*=-1)),this.cache.add(o,l),this.associations.set(l,this.associations.get(i))),i=l}e.material=i}getMaterialType(){return ei}loadMaterial(e){let t=this,i=this.json,r=this.extensions,n=i.materials[e],s,o={},l=n.extensions||{},c=[];if(l[ie.KHR_MATERIALS_UNLIT]){let u=r[ie.KHR_MATERIALS_UNLIT];s=u.getMaterialType(),c.push(u.extendParams(o,n,t))}else{let u=n.pbrMetallicRoughness||{};if(o.color=new I(1,1,1),o.opacity=1,Array.isArray(u.baseColorFactor)){let f=u.baseColorFactor;o.color.setRGB(f[0],f[1],f[2],Ke),o.opacity=f[3]}u.baseColorTexture!==void 0&&c.push(t.assignTexture(o,"map",u.baseColorTexture,me)),o.metalness=u.metallicFactor!==void 0?u.metallicFactor:1,o.roughness=u.roughnessFactor!==void 0?u.roughnessFactor:1,u.metallicRoughnessTexture!==void 0&&(c.push(t.assignTexture(o,"metalnessMap",u.metallicRoughnessTexture)),c.push(t.assignTexture(o,"roughnessMap",u.metallicRoughnessTexture))),s=this._invokeOne(function(f){return f.getMaterialType&&f.getMaterialType(e)}),c.push(Promise.all(this._invokeAll(function(f){return f.extendMaterialParams&&f.extendMaterialParams(e,o)})))}n.doubleSided===!0&&(o.side=uo);let h=n.alphaMode||Gu.OPAQUE;if(h===Gu.BLEND?(o.transparent=!0,o.depthWrite=!1):(o.transparent=!1,h===Gu.MASK&&(o.alphaTest=n.alphaCutoff!==void 0?n.alphaCutoff:.5)),n.normalTexture!==void 0&&s!==Se&&(c.push(t.assignTexture(o,"normalMap",n.normalTexture)),o.normalScale=new T(1,1),n.normalTexture.scale!==void 0)){let u=n.normalTexture.scale;o.normalScale.set(u,u)}if(n.occlusionTexture!==void 0&&s!==Se&&(c.push(t.assignTexture(o,"aoMap",n.occlusionTexture)),n.occlusionTexture.strength!==void 0&&(o.aoMapIntensity=n.occlusionTexture.strength)),n.emissiveFactor!==void 0&&s!==Se){let u=n.emissiveFactor;o.emissive=new I().setRGB(u[0],u[1],u[2],Ke)}return n.emissiveTexture!==void 0&&s!==Se&&c.push(t.assignTexture(o,"emissiveMap",n.emissiveTexture,me)),Promise.all(c).then(function(){let u=new s(o);return n.name&&(u.name=n.name),vi(u,n),t.associations.set(u,{materials:e}),n.extensions&&ln(r,u,n),u})}createUniqueName(e){let t=ne.sanitizeNodeName(e||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){let t=this,i=this.extensions,r=this.primitiveCache;function n(o){return i[ie.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(o,t).then(function(l){return p_(l,o,t)})}let s=[];for(let o=0,l=e.length;o<l;o++){let c=e[o],h=nb(c),u=r[h];if(u)s.push(u.promise);else{let f;c.extensions&&c.extensions[ie.KHR_DRACO_MESH_COMPRESSION]?f=n(c):f=p_(new P,c,t),c.mode===Xt.TRIANGLE_STRIP?f=f.then(d=>ku(d,Lo)):c.mode===Xt.TRIANGLE_FAN&&(f=f.then(d=>ku(d,Wn))),r[h]={primitive:c,promise:f},s.push(f)}}return Promise.all(s)}loadMesh(e){let t=this,i=this.json,r=this.extensions,n=i.meshes[e],s=n.primitives,o=[];for(let l=0,c=s.length;l<c;l++){let h=s[l].material===void 0?tb(this.cache):this.getDependency("material",s[l].material);o.push(h)}return o.push(t.loadGeometries(s)),Promise.all(o).then(async function(l){let c=l.slice(0,l.length-1),h=l[l.length-1],u=[];for(let d=0,p=h.length;d<p;d++){let m=h[d],g=s[d],_,x=c[d];if(g.mode===Xt.TRIANGLES||g.mode===Xt.TRIANGLE_STRIP||g.mode===Xt.TRIANGLE_FAN||g.mode===void 0){let v=n.isSkinnedMesh===!0,b=m.hasAttribute("skinIndex")&&m.hasAttribute("skinWeight");v&&b===!1&&console.warn("THREE.GLTFLoader: Missing skinIndex or skinWeight attributes. Skinning disabled."),_=v&&b?new $i(m,x):new ae(m,x),_.isSkinnedMesh===!0&&_.normalizeSkinWeights()}else if(g.mode===Xt.LINES)_=new Me(m,x);else if(g.mode===Xt.LINE_STRIP)_=new ke(m,x);else if(g.mode===Xt.LINE_LOOP)_=new tr(m,x);else if(g.mode===Xt.POINTS)_=new ir(m,x);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+g.mode);Object.keys(_.geometry.morphAttributes).length>0&&rb(_,n),_.name=t.createUniqueName(n.name||"mesh_"+e),vi(_,n),g.extensions&&ln(r,_,g),t.assignFinalMaterial(_),u.push(_)}for(let d=0,p=u.length;d<p;d++)t.associations.set(u[d],{meshes:e,primitives:d});if(u.length===1)return n.extensions&&ln(r,u[0],n),u[0];let f=new ct;n.extensions&&ln(r,f,n),t.associations.set(f,{meshes:e});for(let d=0,p=u.length;d<p;d++)f.add(u[d]);return f})}loadCamera(e){let t,i=this.json.cameras[e],r=i[i.type];if(!r){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return i.type==="perspective"?t=new ge(Ea.radToDeg(r.yfov),r.aspectRatio||1,r.znear||1,r.zfar||2e6):i.type==="orthographic"&&(t=new Ht(-r.xmag,r.xmag,r.ymag,-r.ymag,r.znear,r.zfar)),i.name&&(t.name=this.createUniqueName(i.name)),vi(t,i),Promise.resolve(t)}loadSkin(e){let t=this.json.skins[e],i=[];for(let r=0,n=t.joints.length;r<n;r++)i.push(this._loadNodeShallow(t.joints[r]));return t.inverseBindMatrices!==void 0?i.push(this.getDependency("accessor",t.inverseBindMatrices)):i.push(null),Promise.all(i).then(function(r){let n=r.pop(),s=r,o=[],l=[];for(let c=0,h=s.length;c<h;c++){let u=s[c];if(u){o.push(u);let f=new F;n!==null&&f.fromArray(n.array,c*16),l.push(f)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[c])}return new Qi(o,l)})}loadAnimation(e){let t=this.json,i=this,r=t.animations[e],n=r.name?r.name:"animation_"+e,s=[],o=[],l=[],c=[],h=[];for(let u=0,f=r.channels.length;u<f;u++){let d=r.channels[u],p=r.samplers[d.sampler],m=d.target,g=m.node,_=r.parameters!==void 0?r.parameters[p.input]:p.input,x=r.parameters!==void 0?r.parameters[p.output]:p.output;m.node!==void 0&&(s.push(this.getDependency("node",g)),o.push(this.getDependency("accessor",_)),l.push(this.getDependency("accessor",x)),c.push(p),h.push(m))}return Promise.all([Promise.all(s),Promise.all(o),Promise.all(l),Promise.all(c),Promise.all(h)]).then(function(u){let f=u[0],d=u[1],p=u[2],m=u[3],g=u[4],_=[];for(let v=0,b=f.length;v<b;v++){let M=f[v],S=d[v],A=p[v],w=m[v],E=g[v];if(M===void 0)continue;M.updateMatrix&&M.updateMatrix();let C=i._createAnimationTracks(M,S,A,w,E);if(C)for(let N=0;N<C.length;N++)_.push(C[N])}let x=new yt(n,void 0,_);return vi(x,r),x})}createNodeMesh(e){let t=this.json,i=this,r=t.nodes[e];return r.mesh===void 0?null:i.getDependency("mesh",r.mesh).then(function(n){let s=i._getNodeRef(i.meshCache,r.mesh,n);return r.weights!==void 0&&s.traverse(function(o){if(o.isMesh)for(let l=0,c=r.weights.length;l<c;l++)o.morphTargetInfluences[l]=r.weights[l]}),s})}loadNode(e){let t=this.json,i=this,r=t.nodes[e],n=i._loadNodeShallow(e),s=[],o=r.children||[];for(let c=0,h=o.length;c<h;c++)s.push(i.getDependency("node",o[c]));let l=r.skin===void 0?Promise.resolve(null):i.getDependency("skin",r.skin);return Promise.all([n,Promise.all(s),l]).then(function(c){let h=c[0],u=c[1],f=c[2];f!==null&&h.traverse(function(d){d.isSkinnedMesh&&d.bind(f,ob)});for(let d=0,p=u.length;d<p;d++)h.add(u[d]);if(h.userData.pivot!==void 0&&u.length>0){let d=h.userData.pivot,p=u[0];h.pivot=new y().fromArray(d),h.position.x-=d[0],h.position.y-=d[1],h.position.z-=d[2],p.position.set(0,0,0),delete h.userData.pivot}return h})}_loadNodeShallow(e){let t=this.json,i=this.extensions,r=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];let n=t.nodes[e],s=n.name?r.createUniqueName(n.name):"",o=[],l=r._invokeOne(function(c){return c.createNodeMesh&&c.createNodeMesh(e)});return l&&o.push(l),n.camera!==void 0&&o.push(r.getDependency("camera",n.camera).then(function(c){return r._getNodeRef(r.cameraCache,n.camera,c)})),r._invokeAll(function(c){return c.createNodeAttachment&&c.createNodeAttachment(e)}).forEach(function(c){o.push(c)}),this.nodeCache[e]=Promise.all(o).then(function(c){let h;if(n.isBone===!0?h=new ci:c.length>1?h=new ct:c.length===1?h=c[0]:h=new G,h!==c[0])for(let u=0,f=c.length;u<f;u++)h.add(c[u]);if(n.name&&(h.userData.name=n.name,h.name=s),vi(h,n),n.extensions&&ln(i,h,n),n.matrix!==void 0){let u=new F;u.fromArray(n.matrix),h.applyMatrix4(u)}else n.translation!==void 0&&h.position.fromArray(n.translation),n.rotation!==void 0&&h.quaternion.fromArray(n.rotation),n.scale!==void 0&&h.scale.fromArray(n.scale);if(!r.associations.has(h))r.associations.set(h,{});else if(n.mesh!==void 0&&r.meshCache.refs[n.mesh]>1){let u=r.associations.get(h);r.associations.set(h,{...u})}return r.associations.get(h).nodes=e,h}),this.nodeCache[e]}loadScene(e){let t=this.extensions,i=this.json.scenes[e],r=this,n=new ct;i.name&&(n.name=r.createUniqueName(i.name)),vi(n,i),i.extensions&&ln(t,n,i);let s=i.nodes||[],o=[];for(let l=0,c=s.length;l<c;l++)o.push(r.getDependency("node",s[l]));return Promise.all(o).then(function(l){for(let h=0,u=l.length;h<u;h++){let f=l[h];f.parent!==null?n.add(c_(f)):n.add(f)}let c=h=>{let u=new Map;for(let[f,d]of r.associations)(f instanceof $||f instanceof te)&&u.set(f,d);return h.traverse(f=>{let d=r.associations.get(f);d!=null&&u.set(f,d)}),u};return r.associations=c(n),n})}_createAnimationTracks(e,t,i,r,n){let s=[],o=e.name?e.name:e.uuid,l=[];function c(d){d.morphTargetInfluences&&l.push(d.name?d.name:d.uuid)}gr[n.path]===gr.weights?(c(e),e.isGroup&&e.children.forEach(c)):l.push(o);let h;switch(gr[n.path]){case gr.weights:h=ii;break;case gr.rotation:h=Gt;break;case gr.translation:case gr.scale:h=ni;break;default:switch(i.itemSize){case 1:h=ii;break;case 2:case 3:default:h=ni;break}break}let u=r.interpolation!==void 0?eb[r.interpolation]:Vi,f=this._getArrayFromAccessor(i);for(let d=0,p=l.length;d<p;d++){let m=new h(l[d]+"."+gr[n.path],t.array,f,u);r.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(m),s.push(m)}return s}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){let i=pf(t.constructor),r=new Float32Array(t.length);for(let n=0,s=t.length;n<s;n++)r[n]=t[n]*i;t=r}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(i){let r=this instanceof Gt?ff:rh;return new r(this.times,this.values,this.getValueSize()/3,i)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}};function ab(a,e,t){let i=e.attributes,r=new he;if(i.POSITION!==void 0){let o=t.json.accessors[i.POSITION],l=o.min,c=o.max;if(l!==void 0&&c!==void 0){if(r.set(new y(l[0],l[1],l[2]),new y(c[0],c[1],c[2])),o.normalized){let h=pf(co[o.componentType]);r.min.multiplyScalar(h),r.max.multiplyScalar(h)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;let n=e.targets;if(n!==void 0){let o=new y,l=new y;for(let c=0,h=n.length;c<h;c++){let u=n[c];if(u.POSITION!==void 0){let f=t.json.accessors[u.POSITION],d=f.min,p=f.max;if(d!==void 0&&p!==void 0){if(l.setX(Math.max(Math.abs(d[0]),Math.abs(p[0]))),l.setY(Math.max(Math.abs(d[1]),Math.abs(p[1]))),l.setZ(Math.max(Math.abs(d[2]),Math.abs(p[2]))),f.normalized){let m=pf(co[f.componentType]);l.multiplyScalar(m)}o.max(l)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}r.expandByVector(o)}a.boundingBox=r;let s=new oe;r.getCenter(s.center),s.radius=r.min.distanceTo(r.max)/2,a.boundingSphere=s}function p_(a,e,t){let i=e.attributes,r=[];function n(s,o){return t.getDependency("accessor",s).then(function(l){a.setAttribute(o,l)})}for(let s in i){let o=df[s]||s.toLowerCase();o in a.attributes||r.push(n(i[s],o))}if(e.indices!==void 0&&!a.index){let s=t.getDependency("accessor",e.indices).then(function(o){a.setIndex(o)});r.push(s)}return Le.workingColorSpace!==Ke&&"COLOR_0"in i&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${Le.workingColorSpace}" not supported.`),vi(a,e),ab(a,e,t),Promise.all(r).then(function(){return e.targets!==void 0?ib(a,e.targets,t):a})}Fg(Du(!1));kg(ae);return S_(lb);})();
