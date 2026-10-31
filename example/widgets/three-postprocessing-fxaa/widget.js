(()=>{function mt(o){if(!Number.isFinite(o)||o<0||o>4096)throw new Error("three.invalid: example canvas dimensions are outside 0..4096");return Math.floor(o)}function st(o){if(typeof o!="string")return null;let e=o.trim().toLowerCase();if(e==="black")return[0,0,0,255];if(e==="white")return[255,255,255,255];if(e==="transparent")return[0,0,0,0];if(/^#[0-9a-f]{6}$/.test(e))return[parseInt(e.slice(1,3),16),parseInt(e.slice(3,5),16),parseInt(e.slice(5,7),16),255];if(/^#[0-9a-f]{3}$/.test(e))return[parseInt(e[1]+e[1],16),parseInt(e[2]+e[2],16),parseInt(e[3]+e[3],16),255];let r=/^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*(?:,\s*([0-9.]+)\s*)?\)$/.exec(e);if(!r)return null;let a=r[4]===void 0?1:Number(r[4]),n=[Number(r[1]),Number(r[2]),Number(r[3])];return n.some(s=>s>255)||!(a>=0&&a<=1)?null:[...n.map(s=>Math.round(s)),Math.round(a*255)]}var Fe={A:[2,5,7,5,5],B:[6,5,6,5,6],C:[3,4,4,4,3],D:[6,5,5,5,6],E:[7,4,6,4,7],F:[7,4,6,4,4],G:[3,4,5,5,3],H:[5,5,7,5,5],I:[7,2,2,2,7],J:[1,1,1,5,6],K:[5,5,6,5,5],L:[4,4,4,4,7],M:[5,7,7,5,5],N:[5,7,7,7,5],O:[2,5,5,5,2],P:[6,5,6,4,4],Q:[2,5,5,6,3],R:[6,5,6,5,5],S:[3,4,2,1,6],T:[7,2,2,2,2],U:[5,5,5,5,7],V:[5,5,5,5,2],W:[5,5,7,7,5],X:[5,5,2,5,5],Y:[5,5,2,2,2],Z:[7,1,2,4,7],0:[7,5,5,5,7],1:[2,6,2,2,7],2:[6,1,7,4,7],3:[6,1,2,1,6],4:[5,5,7,1,1],5:[7,4,6,1,6],6:[3,4,7,5,7],7:[7,1,2,2,2],8:[7,5,7,5,7],9:[7,5,7,1,6],"-":[0,0,7,0,0],".":[0,0,0,0,2]};function O(o,e,r,a){if(![o,e,r,a].every(Number.isFinite))throw new Error("three.invalid: example canvas rectangle must be finite")}function kt(o){if(!o||!Number.isInteger(o.width)||!Number.isInteger(o.height)||o.width<=0||o.height<=0||o.width>4096||o.height>4096||o.width*o.height>16777216||!(o.data instanceof Uint8ClampedArray)||o.data.length!==o.width*o.height*4)throw new Error("three.unsupported: example canvas drawImage source is not local RGBA");return o}var Dt=class{constructor(e,r){if(e*r>16777216)throw new Error("three.invalid: example canvas pixel quota exceeded");this.width=e,this.height=r,this.data=new Uint8ClampedArray(e*r*4)}resize(e,r){if(e*r>16777216)throw new Error("three.invalid: example canvas pixel quota exceeded");this.width=e,this.height=r,this.data=new Uint8ClampedArray(e*r*4)}clearRect(e,r,a,n){O(e,r,a,n);let s=Math.max(0,Math.floor(Math.min(e,e+a))),i=Math.min(this.width,Math.ceil(Math.max(e,e+a))),c=Math.max(0,Math.floor(Math.min(r,r+n))),l=Math.min(this.height,Math.ceil(Math.max(r,r+n)));for(let p=c;p<l;p++)for(let d=s;d<i;d++){let u=(p*this.width+d)*4;this.data[u]=0,this.data[u+1]=0,this.data[u+2]=0,this.data[u+3]=0}}fillRect(e,r,a,n,s){O(e,r,a,n);let i=st(s);if(!i)throw new Error("three.unsupported: software example canvas requires a bounded CSS color fill");let c=Math.max(0,Math.floor(Math.min(e,e+a))),l=Math.min(this.width,Math.ceil(Math.max(e,e+a))),p=Math.max(0,Math.floor(Math.min(r,r+n))),d=Math.min(this.height,Math.ceil(Math.max(r,r+n)));for(let u=p;u<d;u++)for(let f=c;f<l;f++){let E=(u*this.width+f)*4;this.data[E]=i[0],this.data[E+1]=i[1],this.data[E+2]=i[2],this.data[E+3]=i[3]}}fillText(e,r,a,n,s){if(O(r,a,0,0),!st(n))throw new Error("three.unsupported: example canvas text requires a bounded CSS color");let c=/([0-9]+(?:\.[0-9]+)?)\s*(px|pt)?/i.exec(String(s||"")),l=c?Number(c[1]):10;c&&c[2]&&c[2].toLowerCase()==="pt"&&(l*=4/3);let p=Math.max(1,Math.min(8,Math.round(l/8))),d=String(e).slice(0,256).toUpperCase(),u=Math.round(r),f=Math.round(a)-5*p;for(let E of d){let S=Fe[E];if(S)for(let M=0;M<5;M++)for(let L=0;L<3;L++)(S[M]&1<<2-L)!==0&&this.fillRect(u+L*p,f+M*p,p,p,n);u+=4*p}}getImageData(e,r,a,n){O(e,r,a,n),a=mt(a),n=mt(n);let s=new Uint8ClampedArray(a*n*4);for(let i=0;i<n;i++){let c=Math.floor(r)+i;if(!(c<0||c>=this.height))for(let l=0;l<a;l++){let p=Math.floor(e)+l;if(p<0||p>=this.width)continue;let d=(c*this.width+p)*4,u=(i*a+l)*4;s[u]=this.data[d],s[u+1]=this.data[d+1],s[u+2]=this.data[d+2],s[u+3]=this.data[d+3]}}return{data:s,width:a,height:n}}putImageData(e,r,a){if(!e||!(e.data instanceof Uint8ClampedArray)||!Number.isInteger(e.width)||!Number.isInteger(e.height)||e.width<0||e.height<0||e.data.length!==e.width*e.height*4)throw new Error("three.invalid: invalid example canvas ImageData");O(r,a,0,0);for(let n=0;n<e.height;n++){let s=Math.floor(a)+n;if(!(s<0||s>=this.height))for(let i=0;i<e.width;i++){let c=Math.floor(r)+i;if(c<0||c>=this.width)continue;let l=(n*e.width+i)*4,p=(s*this.width+c)*4;this.data[p]=e.data[l],this.data[p+1]=e.data[l+1],this.data[p+2]=e.data[l+2],this.data[p+3]=e.data[l+3]}}}drawImage(e,r,a,n,s,i,c,l,p){if(e=kt(e),O(r,a,n,s),O(i,c,l,p),n<=0||s<=0||l<=0||p<=0||r<0||a<0||r+n>e.width||a+s>e.height)throw new Error("three.unsupported: example canvas drawImage requires a positive in-bounds source and destination");if(l*p>16777216)throw new Error("three.invalid: example canvas drawImage output quota exceeded");let d=Math.max(0,Math.floor(i)),u=Math.min(this.width,Math.ceil(i+l)),f=Math.max(0,Math.floor(c)),E=Math.min(this.height,Math.ceil(c+p)),S=Math.floor(r),M=Math.ceil(r+n)-1,L=Math.floor(a),j=Math.ceil(a+s)-1;for(let A=f;A<E;A++){let P=a+(A+.5-c)*s/p-.5,H=Math.max(L,Math.min(j,P)),I=Math.floor(H),h=Math.min(j,I+1),_=H-I;for(let m=d;m<u;m++){let T=r+(m+.5-i)*n/l-.5,z=Math.max(S,Math.min(M,T)),N=Math.floor(z),J=Math.min(M,N+1),G=z-N,q=(I*e.width+N)*4,Y=(I*e.width+J)*4,V=(h*e.width+N)*4,Ot=(h*e.width+J)*4,ut=(A*this.width+m)*4,dt=1-_,bt=(e.data[q+3]*(1-G)*dt+e.data[Y+3]*G*dt+e.data[V+3]*(1-G)*_+e.data[Ot+3]*G*_)/255,Ut=1-bt;for(let X=0;X<3;X++){let ve=e.data[q+X]*(1-G)*dt+e.data[Y+X]*G*dt+e.data[V+X]*(1-G)*_+e.data[Ot+X]*G*_;this.data[ut+X]=ve*bt+this.data[ut+X]*Ut}this.data[ut+3]=bt*255+this.data[ut+3]*Ut}}}blendPixel(e,r,a){if(e<0||r<0||e>=this.width||r>=this.height)return;let n=(r*this.width+e)*4,s=a[3]/255,i=1-s;for(let c=0;c<3;c++)this.data[n+c]=a[c]*s+this.data[n+c]*i;this.data[n+3]=a[3]+this.data[n+3]*i}stroke(e,r,a){let n=st(r);if(!n)throw new Error("three.unsupported: example canvas stroke requires a bounded CSS color");if(!Number.isFinite(a)||a<=0||a>4096)throw new Error("three.invalid: example canvas stroke width is outside the bounded range");let s=Math.max(.5,a/2),i=s*s,c=0;for(let l of e){let p=l.points,d=p.length+(l.closed&&p.length>1?0:-1);for(let u=0;u<d;u++){let f=p[u],E=p[(u+1)%p.length],S=Math.max(0,Math.floor(Math.min(f.x,E.x)-s)),M=Math.min(this.width,Math.ceil(Math.max(f.x,E.x)+s)),L=Math.max(0,Math.floor(Math.min(f.y,E.y)-s)),j=Math.min(this.height,Math.ceil(Math.max(f.y,E.y)+s));if(c+=Math.max(0,M-S)*Math.max(0,j-L),c>16777216)throw new Error("three.invalid: example canvas stroke raster quota exceeded");let A=E.x-f.x,P=E.y-f.y,H=A*A+P*P;for(let I=L;I<j;I++)for(let h=S;h<M;h++){let _=h+.5-f.x,m=I+.5-f.y,T=H===0?0:Math.max(0,Math.min(1,(_*A+m*P)/H)),z=_-T*A,N=m-T*P;z*z+N*N<=i&&this.blendPixel(h,I,n)}}}}fill(e,r){let a=st(r);if(!a)throw new Error("three.unsupported: example canvas path fill requires a bounded CSS color");let n=e.filter(d=>d.points.length>=3);if(n.length===0)return;let s=1/0,i=-1/0;for(let d of n)for(let u of d.points)s=Math.min(s,u.y),i=Math.max(i,u.y);let c=Math.max(0,Math.floor(s)),l=Math.min(this.height,Math.ceil(i)),p=[];for(let d=c;d<l;d++){p.length=0;let u=d+.5;for(let f of n){let E=f.points,S=E[E.length-1];for(let M of E)S.y>u!=M.y>u&&p.push(S.x+(u-S.y)*(M.x-S.x)/(M.y-S.y)),S=M}p.sort((f,E)=>f-E);for(let f=0;f+1<p.length;f+=2){let E=Math.max(0,Math.ceil(p[f]-.5)),S=Math.min(this.width,Math.ceil(p[f+1]-.5));for(let M=E;M<S;M++)this.blendPixel(M,d,a)}}}};function jt(o,e,r){let a=o.three.createCanvas2D(e,r),n=a.getContext("2d"),s=new Set,i=null,c=0,l=1,p=1,d="10px sans-serif",u="#000000",f=1,E=[],S=null,M=0,L=[],j={isJsrNativeCanvas2D:!0,isJsrThreeExampleLocal:!0,style:a.style,get width(){return i?i.width:a.width},set width(h){h=mt(h),i?i.resize(h,i.height):(a.width=h,L=[])},get height(){return i?i.height:a.height},set height(h){h=mt(h),i?i.resize(i.width,h):(a.height=h,L=[])},get _ready(){return i?!0:a._ready},get _rgba(){return i?i.data:a._rgba},get _readyVersion(){return i?c:a._readyVersion},getContext(h){if(h!=="2d")throw new Error(`three.unsupported: example canvas context ${h}`);return I},_addReadyListener(h){s.add(h);let _=a._addReadyListener(()=>h(j));return()=>{s.delete(h),_()}},addEventListener(h,_){a.addEventListener(h,_)},removeEventListener(h,_){a.removeEventListener(h,_)},dispose(){s.clear(),a.dispose()}};function A(){if(i)return i;let h=new Dt(a.width,a.height);for(let _ of L)h.fillRect(_.x,_.y,_.width,_.height,_.style);return i=h,c=a._readyVersion+1,h}function P(){c++;for(let h of Array.from(s))h(j)}function H(h,_){if(O(h,_,0,0),++M>1024)throw new Error("three.invalid: example canvas path command quota exceeded");return{x:h*l,y:_*p}}let I={get fillStyle(){return n.fillStyle},set fillStyle(h){n.fillStyle=h},get font(){return d},set font(h){d=String(h)},get strokeStyle(){return u},set strokeStyle(h){u=h},get lineWidth(){return f},set lineWidth(h){if(!Number.isFinite(h)||h<=0||h>4096)throw new Error("three.invalid: example canvas lineWidth is outside the bounded range");f=h},createRadialGradient(...h){return n.createRadialGradient(...h)},fillRect(h,_,m,T){if(O(h,_,m,T),i||l!==1||p!==1){A().fillRect(h*l,_*p,m*l,T*p,n.fillStyle),P();return}if(typeof n.fillStyle!="string"){n.fillRect(h,_,m,T),L.push({x:h,y:_,width:m,height:T,style:null});return}if(!st(n.fillStyle))throw new Error("three.unsupported: unsupported example canvas CSS color");n.fillRect(h,_,m,T),L.push({x:h,y:_,width:m,height:T,style:n.fillStyle})},clearRect(h,_,m,T){O(h,_,m,T),A().clearRect(h*l,_*p,m*l,T*p),P()},getImageData(h,_,m,T){return A().getImageData(h,_,m,T)},putImageData(h,_,m){A().putImageData(h,_,m),P()},scale(h,_){if(O(h,_,0,0),!(h>0&&_>0))throw new Error("three.unsupported: example canvas scale must be positive");l*=h,p*=_},drawImage(h,..._){if(h&&h.complete===!1)return;let m=kt(h&&h._examplePixels),T=0,z=0,N=m.width,J=m.height,G,q,Y,V;if(_.length===2)[G,q]=_,Y=N,V=J;else if(_.length===4)[G,q,Y,V]=_;else if(_.length===8)[T,z,N,J,G,q,Y,V]=_;else throw new Error("three.unsupported: example canvas drawImage expects 2, 4, or 8 coordinates");A().drawImage(m,T,z,N,J,G*l,q*p,Y*l,V*p),P()},beginPath(){E=[],S=null,M=0},moveTo(h,_){S={points:[H(h,_)],closed:!1},E.push(S)},lineTo(h,_){let m=H(h,_);S?S.points.push(m):(S={points:[m],closed:!1},E.push(S))},closePath(){S&&(S.closed=!0)},stroke(){A().stroke(E,u,f*(l+p)/2),P()},fill(){A().fill(E,n.fillStyle),P()},fillText(h,_,m){A().fillText(h,_,m,n.fillStyle,d),P()}};return Object.defineProperty(j,"_examplePixels",{get(){return i}}),j}var b=globalThis;typeof b.self>"u"&&(b.self=b);var ur=b.document||null,Ge="webgl_postprocessing_fxaa",y="three-postprocessing-fxaa",Et=JSON.parse("[]"),Be=new Map(Et.map(o=>[o.url,o])),g=b.jsr;if(!g||!g.three||typeof g.three.createCanvas!="function"||typeof g.three.registerAsset!="function"||typeof g.three._prepareTree!="function")throw new Error(`${y}: evaluate the JSR three.native.js/three.web.js bundle first`);if(typeof g.render!="function"||typeof g.exportState!="function")throw new Error(`${y}: jsr.render and jsr.exportState are required`);var B=g.three.createCanvas("main"),C=B.ownerDocument;B.getRootNode=()=>C;var Ie=B.dispatchEvent;B.dispatchEvent=function(o){return o&&(String(o.type).startsWith("pointer")||o.type==="wheel")&&(o.clientX===void 0&&(o.clientX=o.pageX||0),o.clientY===void 0&&(o.clientY=o.pageY||0),o.pageX===void 0&&(o.pageX=o.clientX),o.pageY===void 0&&(o.pageY=o.clientY)),Ie.call(this,o)};if(!C||!C.defaultView)throw new Error(`${y}: the JSR runtime document facade is unavailable`);var W=null,At=!1,Ne={phase:"idle",frames:0,fps:0,frameTimeMs:0,begins:0,ends:0,updates:0,mode:0},Oe={roots:0,controllers:0,changes:0,finishes:0,values:[]},wt={};for(let o of Et)wt[o.url]={url:o.url,bytes:o.bytes,registered:!0};function K(o){return Number.isFinite(o)?o:0}function ft(){let o=W&&W.info?W.info:{},e=o.render||{},r=o.memory||{},a=g.three.getCapabilities?g.three.getCapabilities():{},n={example:Ge,backend:W&&W.capabilities&&W.capabilities.backend||a.backend||"unknown",canvasCount:1,mounted:At,assets:wt,renderer:{frame:K(e.frame),calls:K(e.calls),triangles:K(e.triangles),points:K(e.points),lines:K(e.lines),geometries:K(r.geometries),textures:K(r.textures)},stats:Object.assign({},Ne),gui:Oe};for(let s of Et)s.diagnostic&&(n[s.diagnostic]=wt[s.url]);g.exportState(n)}C&&typeof C.addEventListener!="function"&&tt(C);var Ue=g.render;g.render=function(o){return Ue.call(this,g.three._prepareTree(o))};for(let o of Et)g.three.registerAsset(o.url,{data:o.data,mime:o.mime,width:o.width,height:o.height});function tt(o){let e=new Map;return o.addEventListener=function(r,a){if(!a)return;let n=e.get(r)||[];n.includes(a)||n.push(a),e.set(r,n)},o.removeEventListener=function(r,a){let n=e.get(r);n&&e.set(r,n.filter(s=>s!==a))},o.dispatchEvent=function(r){if(!r||!r.type)throw new Error(`${y}: event.type is required`);r.preventDefault||(r.preventDefault=function(){this.defaultPrevented=!0});try{r.target||(r.target=o)}catch{}try{r.currentTarget=o}catch{}for(let a of(e.get(r.type)||[]).slice())typeof a=="function"?a.call(o,r):a.handleEvent&&a.handleEvent(r);return!r.defaultPrevented},o}function Rt(o,e){let r=o.children.indexOf(e);return r>=0&&o.children.splice(r,1),o.children.push(e),e.parentNode=o,e}function Xt(o,e){if(e!==B)throw new Error(`${y}: exactly one main canvas is supported`);if(Rt(o,e),W=e.renderer||W,!At){At=!0;let r=g.three._guiRerender;if(ft(),typeof r=="function"&&r())return;g.render({type:"three",canvasId:"main"})}return ft(),e}function nt(o){let e=tt({__jsrThreeExampleLocal:!0,tagName:String(o).toUpperCase(),style:{},children:[],parentNode:null,classList:{_names:new Set,add(...r){for(let a of r)this._names.add(String(a))},remove(...r){for(let a of r)this._names.delete(String(a))},toggle(r){return this._names.has(r)?(this._names.delete(r),!1):(this._names.add(r),!0)},contains(r){return this._names.has(r)}}});return e.ownerDocument=C,e.getRootNode=()=>C,e.appendChild=function(r){if(r&&r.isJsrThreeCanvas&&this.tagName==="DIV")return Xt(this,r);if(!r||!r.__jsrThreeExampleLocal)throw new Error(`${y}: only local diagnostic children are supported`);return Rt(this,r)},e.removeChild=function(r){let a=this.children.indexOf(r);if(a<0)throw new Error(`${y}: child is not mounted`);return this.children.splice(a,1),r.parentNode=null,r},e.remove=function(){this.parentNode&&typeof this.parentNode.removeChild=="function"&&this.parentNode.removeChild(this)},e.click=function(){this.__jsrClicked=!0,this.dispatchEvent({type:"click"})},e}var ke="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",je=0;function He(o){if(typeof o!="string")throw new Error(`${y}: decoded image data must be base64`);let e=o.replace(/\s/g,"");if(e.length%4===1||/[^A-Za-z0-9+/=_-]/.test(e))throw new Error(`${y}: decoded image data is invalid base64`);let r=e.replace(/-/g,"+").replace(/_/g,"/"),a=r.endsWith("==")?2:r.endsWith("=")?1:0,n=new Uint8Array(Math.floor(r.length*3/4)-a),s=0,i=0,c=0;for(let l=0;l<r.length;l++){let p=r[l];if(p==="=")break;let d=ke.indexOf(p);if(d<0)throw new Error(`${y}: decoded image data is invalid base64`);if(s=s<<6|d,i+=6,i>=8){if(i-=8,c>=n.length)throw new Error(`${y}: decoded image data has invalid padding`);n[c++]=s>>i&255}}if(c!==n.length)throw new Error(`${y}: decoded image data has an invalid length`);return n}function ze(o,e){let r=e.bytes,a=String(e.mime||"").toLowerCase();if(a.includes("rgba")||a.includes("raw")){let l=e.width||0,p=e.height||0;if(!Number.isInteger(l)||!Number.isInteger(p)||l<=0||p<=0||!r||r.length!==l*p*4)throw new Error(`${y}: invalid raw RGBA image ${o}`);return{bytes:r,width:l,height:p,encoding:0,encoded:!1}}if(typeof g.hostCall!="function")throw new Error(`${y}: native host image decoding is unavailable for ${o}`);let s=++je,i=`example-image-decode-${s}`,c=B.generation;return g.hostCall("three.canvas2d",{action:"decodeImage",engineId:B.engineId,surfaceId:B.surfaceId,canvasId:i,generation:c,requestId:s,width:0,height:0,commands:[],data:e.data}).then(l=>{if(!l||l.stale||l.engineId!==B.engineId||l.surfaceId!==B.surfaceId||l.canvasId!==i||l.generation!==c||l.requestId!==s||!Number.isInteger(l.width)||!Number.isInteger(l.height)||l.width<=0||l.height<=0||typeof l.data!="string")throw new Error(`${y}: invalid decoded image response for ${o}`);let p=He(l.data);if(p.length!==l.width*l.height*4)throw new Error(`${y}: decoded image RGBA length mismatch for ${o}`);return{bytes:p,width:l.width,height:l.height,encoding:0,encoded:!1}})}function Xe(){if(typeof b.OffscreenCanvas!="function"){let r=tt({complete:!1,width:0,height:0,naturalWidth:0,naturalHeight:0,data:null,_examplePixels:null}),a="";return Object.defineProperty(r,"src",{configurable:!0,get(){return a},set(n){a=String(n),g.three.loadAsset(a).then(s=>{if(!s.bytes)throw new Error(`${y}: asset ${a} has no bytes`);return ze(a,s)}).then(s=>{if(B.disposed)throw new Error(`${y}: surface disposed during image decode`);let i=new Uint8ClampedArray(s.bytes);r.data=s.bytes,r.width=s.width,r.height=s.height,r.naturalWidth=s.width,r.naturalHeight=s.height,r.encoding=s.encoding,r.encoded=s.encoded,r._examplePixels={data:i,width:s.width,height:s.height},r.complete=!0,r.dispatchEvent({type:"load"})}).catch(s=>{r.complete=!1,r.dispatchEvent({type:"error",error:s})})}}),r}let o=tt(new b.OffscreenCanvas(1,1));o.complete=!1;let e="";return Object.defineProperty(o,"src",{configurable:!0,get(){return e},set(r){e=String(r),Promise.resolve().then(async()=>{let a=Be.get(e);if(!a)throw new Error(`${y}: unregistered image URL ${e}`);if(typeof b.atob!="function"||typeof b.Blob!="function"||typeof b.createImageBitmap!="function")throw new Error(`${y}: local image decoding requires atob, Blob and createImageBitmap`);o.width=a.width,o.height=a.height,o.naturalWidth=a.width,o.naturalHeight=a.height;let n=b.atob(a.data),s=new Uint8Array(n.length);for(let c=0;c<n.length;c++)s[c]=n.charCodeAt(c);let i=await b.createImageBitmap(new b.Blob([s],{type:a.mime}));try{let c=o.getContext("2d");if(!c)throw new Error(`${y}: OffscreenCanvas 2D decoding is unavailable`);c.clearRect(0,0,o.width,o.height),c.drawImage(i,0,0),o.complete=!0,o.dispatchEvent({type:"load"})}finally{i.close&&i.close()}}).catch(a=>{o.complete=!1,o.dispatchEvent({type:"error",error:a})})}}),o}function We(){if(g.three.getCapabilities().backend==="flutterGpu"){if(typeof g.three.createCanvas2D!="function")throw new Error(`${y}: native Flutter canvas2d is unavailable`);return jt(g,"main",{width:300,height:150})}if(typeof b.OffscreenCanvas!="function")throw new Error(`${y}: local 2D canvases require OffscreenCanvas`);return tt(new b.OffscreenCanvas(300,150))}function Wt(o){let e=String(o).toLowerCase();return e==="canvas"?We():e==="img"||e==="image"?Xe():nt(e)}C.createElement=Wt;C.createElementNS=function(o,e){return String(e).toLowerCase()==="canvas"?g.three.createCanvas("main"):Wt(e)};var it=nt("div");it.id="container";it.appendChild=function(o){if(o&&o.isJsrThreeCanvas)return Xt(this,o);if(!o||!o.__jsrThreeExampleLocal)throw new Error(`${y}: container accepts only the main canvas and local stats DOM`);return Rt(this,o),ft(),o};var qt=nt("body");qt.appendChild=it.appendChild;C.body=qt;var Yt=nt("div");Yt.id="info";function Vt(o){let e=tt({__jsrThreeExampleLocal:!0,tagName:"AUDIO",id:o.id||"",style:{},children:[],parentNode:null,loop:!!o.loop,preload:"auto",currentTime:0,volume:1,muted:!1,paused:!0,_jsrMediaPlaying:!1,_jsrAudioLoad:()=>g.three.loadAsset(o.url)});return e.play=function(){return this._jsrMediaPlaying=!0,this.paused=!1,typeof this._jsrNativePlay=="function"?Promise.resolve(this._jsrNativePlay()):Promise.resolve()},e.pause=function(){this._jsrMediaPlaying=!1,this.paused=!0,typeof this._jsrNativePause=="function"&&this._jsrNativePause()},e.remove=function(){},e}typeof b.Audio!="function"&&(b.Audio=function(o){return Vt({url:String(o||""),mime:"audio/mpeg",loop:!1})});var Ht=JSON.parse("{}"),zt=JSON.parse("{}"),Z=new Map;C.getElementById=function(o){if(o==="container")return it;if(o==="info")return Yt;if(Object.prototype.hasOwnProperty.call(zt,o))return Z.has(o)||Z.set(o,Vt(zt[o])),Z.get(o);if(Object.prototype.hasOwnProperty.call(Ht,o))return{id:o,textContent:Ht[o]};if(!Z.has(o)){let e=nt("div");e.id=String(o),e.innerHTML="",Z.set(o,e)}return Z.get(o)};C.querySelector=function(o){let e=String(o);if(e===".container")return it;if(e.startsWith("#")&&e.length>1)return C.getElementById(e.slice(1));if(/^\.[A-Za-z_][\w-]*$/.test(e)){let r=C.getElementById(e.slice(1));return r.className=e.slice(1),r}return null};for(let o of["pointerdown","pointermove","pointerup","pointercancel"])C.addEventListener(o,e=>{if(o==="pointerdown"){let a=Z.get("startButton");a&&!a.__jsrClicked&&a.click(),typeof g.three._resumeAudio=="function"&&Promise.resolve(g.three._resumeAudio()).catch(n=>{typeof console<"u"&&console.error&&console.error(n)})}let r=Object.assign({},e,{clientX:e.clientX===void 0?e.pageX:e.clientX,clientY:e.clientY===void 0?e.pageY:e.clientY});for(let a=B.parentNode;a&&!(a===C||typeof a.dispatchEvent!="function");a=a.parentNode)a.dispatchEvent(Object.assign({},r));o==="pointermove"&&C.dispatchEvent(Object.assign({},r,{type:"mousemove"}))});b.document=C;b.window=C.defaultView;ft();var t=globalThis.THREE;if(!t)throw new Error("three-postprocessing-fxaa: globalThis.THREE is not initialized");var Kt=t.ACESFilmicToneMapping,mr=t.AddEquation,fr=t.AddOperation,Er=t.AdditiveAnimationBlendMode,xr=t.AdditiveBlending,Zt=t.AgXToneMapping,gr=t.AlphaFormat,Sr=t.AlwaysCompare,yr=t.AlwaysDepth,Mr=t.AlwaysStencilFunc,Cr=t.AmbientLight,Tr=t.AnimationAction,br=t.AnimationClip,Dr=t.AnimationLoader,Ar=t.AnimationMixer,wr=t.AnimationObjectGroup,Rr=t.AnimationUtils,Lr=t.ArcCurve,Pr=t.ArrayCamera,vr=t.ArrowHelper,Fr=t.AttachedBindMode,Gr=t.Audio,Br=t.AudioAnalyser,Ir=t.AudioContext,Nr=t.AudioListener,Or=t.AudioLoader,Ur=t.AxesHelper,kr=t.BackSide,jr=t.BasicDepthPacking,Hr=t.BasicShadowMap,zr=t.BatchedMesh,Xr=t.BezierInterpolant,Wr=t.Bone,qr=t.BooleanKeyframeTrack,Yr=t.Box2,Vr=t.Box3,Kr=t.Box3Helper,Zr=t.BoxGeometry,$r=t.BoxHelper,Qr=t.BufferAttribute,$t=t.BufferGeometry,Jr=t.BufferGeometryLoader,to=t.ByteType,eo=t.Cache,ro=t.Camera,oo=t.CameraHelper,ao=t.CanvasTexture,so=t.CapsuleGeometry,no=t.CatmullRomCurve3,Qt=t.CineonToneMapping,io=t.CircleGeometry,ho=t.ClampToEdgeWrapping,lo=t.Clock,Jt=t.Color,co=t.ColorKeyframeTrack,te=t.ColorManagement,po=t.Compatibility,_o=t.CompressedArrayTexture,uo=t.CompressedCubeTexture,mo=t.CompressedTexture,fo=t.CompressedTextureLoader,Eo=t.ConeGeometry,xo=t.ConstantAlphaFactor,go=t.ConstantColorFactor,ee=t.Controls,So=t.CubeCamera,yo=t.CubeDepthTexture,Mo=t.CubeReflectionMapping,Co=t.CubeRefractionMapping,To=t.CubeTexture,bo=t.CubeTextureLoader,Do=t.CubeUVReflectionMapping,Ao=t.CubicBezierCurve,wo=t.CubicBezierCurve3,Ro=t.CubicInterpolant,Lo=t.CullFaceBack,Po=t.CullFaceFront,vo=t.CullFaceFrontBack,Fo=t.CullFaceNone,Go=t.Curve,Bo=t.CurvePath,Io=t.CustomBlending,re=t.CustomToneMapping,No=t.CylinderGeometry,Oo=t.Cylindrical,Uo=t.Data3DTexture,ko=t.DataArrayTexture,jo=t.DataTexture,Ho=t.DataTextureLoader,zo=t.DataUtils,Xo=t.DecrementStencilOp,Wo=t.DecrementWrapStencilOp,qo=t.DefaultLoadingManager,Yo=t.DepthFormat,Vo=t.DepthStencilFormat,Ko=t.DepthTexture,Zo=t.DetachedBindMode,oe=t.DirectionalLight,$o=t.DirectionalLightHelper,Qo=t.DiscreteInterpolant,Jo=t.DodecahedronGeometry,ta=t.DoubleSide,ea=t.DstAlphaFactor,ra=t.DstColorFactor,oa=t.DynamicCopyUsage,aa=t.DynamicDrawUsage,sa=t.DynamicReadUsage,na=t.EdgesGeometry,ia=t.EllipseCurve,ha=t.EqualCompare,la=t.EqualDepth,ca=t.EqualStencilFunc,pa=t.EquirectangularReflectionMapping,_a=t.EquirectangularRefractionMapping,ua=t.Euler,da=t.EventDispatcher,ma=t.ExternalTexture,fa=t.ExtrudeGeometry,Ea=t.FileLoader,xa=t.Float16BufferAttribute,Lt=t.Float32BufferAttribute,ga=t.FloatType,Sa=t.Fog,ya=t.FogExp2,Ma=t.FramebufferTexture,Ca=t.FrontSide,Ta=t.Frustum,ba=t.FrustumArray,Da=t.GLBufferAttribute,Aa=t.GLSL1,wa=t.GLSL3,Ra=t.GLTFLoader,La=t.GreaterCompare,Pa=t.GreaterDepth,va=t.GreaterEqualCompare,Fa=t.GreaterEqualDepth,Ga=t.GreaterEqualStencilFunc,Ba=t.GreaterStencilFunc,Ia=t.GridHelper,Na=t.Group,Oa=t.HTMLTexture,ae=t.HalfFloatType,se=t.HemisphereLight,Ua=t.HemisphereLightHelper,ka=t.IcosahedronGeometry,ja=t.ImageBitmapLoader,Ha=t.ImageLoader,za=t.ImageUtils,Xa=t.IncrementStencilOp,Wa=t.IncrementWrapStencilOp,qa=t.InstancedBufferAttribute,Ya=t.InstancedBufferGeometry,Va=t.InstancedInterleavedBuffer,ne=t.InstancedMesh,Ka=t.Int16BufferAttribute,Za=t.Int32BufferAttribute,$a=t.Int8BufferAttribute,Qa=t.IntType,Ja=t.InterleavedBuffer,ts=t.InterleavedBufferAttribute,es=t.Interpolant,rs=t.InterpolateBezier,os=t.InterpolateDiscrete,as=t.InterpolateLinear,ss=t.InterpolateSmooth,ns=t.InterpolationSamplingMode,is=t.InterpolationSamplingType,hs=t.InvertStencilOp,ls=t.JsrPMREMGenerator,cs=t.JsrThreeCanvas,ps=t.KeepStencilOp,_s=t.KeyframeTrack,us=t.LOD,ds=t.LatheGeometry,ms=t.Layers,fs=t.LessCompare,Es=t.LessDepth,xs=t.LessEqualCompare,gs=t.LessEqualDepth,Ss=t.LessEqualStencilFunc,ys=t.LessStencilFunc,Ms=t.Light,Cs=t.LightProbe,Ts=t.LightShadow,bs=t.Line,Ds=t.Line3,As=t.LineBasicMaterial,ws=t.LineCurve,Rs=t.LineCurve3,Ls=t.LineDashedMaterial,Ps=t.LineLoop,vs=t.LineSegments,Fs=t.LinearFilter,Gs=t.LinearInterpolant,Bs=t.LinearMipMapLinearFilter,Is=t.LinearMipMapNearestFilter,Ns=t.LinearMipmapLinearFilter,Os=t.LinearMipmapNearestFilter,Us=t.LinearSRGBColorSpace,ie=t.LinearToneMapping,ks=t.LinearTransfer,js=t.Loader,Hs=t.LoaderUtils,zs=t.LoadingManager,Xs=t.LoopOnce,Ws=t.LoopPingPong,qs=t.LoopRepeat,$=t.MOUSE,Ys=t.Material,Vs=t.MaterialBlending,Ks=t.MaterialLoader,he=t.MathUtils,Zs=t.Matrix2,$s=t.Matrix3,Qs=t.Matrix4,Js=t.MaxEquation,le=t.Mesh,tn=t.MeshBasicMaterial,en=t.MeshDepthMaterial,rn=t.MeshDistanceMaterial,on=t.MeshLambertMaterial,an=t.MeshMatcapMaterial,sn=t.MeshNormalMaterial,nn=t.MeshPhongMaterial,hn=t.MeshPhysicalMaterial,ce=t.MeshStandardMaterial,ln=t.MeshToonMaterial,cn=t.MinEquation,pn=t.MirroredRepeatWrapping,_n=t.MixOperation,un=t.MultiplyBlending,dn=t.MultiplyOperation,mn=t.NearestFilter,fn=t.NearestMipMapLinearFilter,En=t.NearestMipMapNearestFilter,xn=t.NearestMipmapLinearFilter,gn=t.NearestMipmapNearestFilter,pe=t.NeutralToneMapping,Sn=t.NeverCompare,yn=t.NeverDepth,Mn=t.NeverStencilFunc,_e=t.NoBlending,Cn=t.NoColorSpace,Tn=t.NoNormalPacking,bn=t.NoToneMapping,Dn=t.NormalAnimationBlendMode,An=t.NormalBlending,wn=t.NormalGAPacking,Rn=t.NormalRGPacking,Ln=t.NotEqualCompare,Pn=t.NotEqualDepth,vn=t.NotEqualStencilFunc,Fn=t.NumberKeyframeTrack,ue=t.Object3D,Gn=t.ObjectLoader,Bn=t.ObjectSpaceNormalMap,In=t.OctahedronGeometry,Nn=t.OneFactor,On=t.OneMinusConstantAlphaFactor,Un=t.OneMinusConstantColorFactor,kn=t.OneMinusDstAlphaFactor,jn=t.OneMinusDstColorFactor,Hn=t.OneMinusSrcAlphaFactor,zn=t.OneMinusSrcColorFactor,de=t.OrthographicCamera,Xn=t.PCFShadowMap,Wn=t.PCFSoftShadowMap,qn=t.PMREMGenerator,Yn=t.Path,me=t.PerspectiveCamera,fe=t.Plane,Vn=t.PlaneGeometry,Kn=t.PlaneHelper,Zn=t.PointLight,$n=t.PointLightHelper,Qn=t.Points,Jn=t.PointsMaterial,ti=t.PolarGridHelper,ei=t.PolyhedronGeometry,ri=t.PositionalAudio,oi=t.PropertyBinding,ai=t.PropertyMixer,si=t.QuadraticBezierCurve,ni=t.QuadraticBezierCurve3,Pt=t.Quaternion,ii=t.QuaternionKeyframeTrack,hi=t.QuaternionLinearInterpolant,li=t.R11_EAC_Format,ci=t.RED_GREEN_RGTC2_Format,pi=t.RED_RGTC1_Format,_i=t.REVISION,ui=t.RG11_EAC_Format,di=t.RGBADepthPacking,mi=t.RGBAFormat,fi=t.RGBAIntegerFormat,Ei=t.RGBA_ASTC_10x10_Format,xi=t.RGBA_ASTC_10x5_Format,gi=t.RGBA_ASTC_10x6_Format,Si=t.RGBA_ASTC_10x8_Format,yi=t.RGBA_ASTC_12x10_Format,Mi=t.RGBA_ASTC_12x12_Format,Ci=t.RGBA_ASTC_4x4_Format,Ti=t.RGBA_ASTC_5x4_Format,bi=t.RGBA_ASTC_5x5_Format,Di=t.RGBA_ASTC_6x5_Format,Ai=t.RGBA_ASTC_6x6_Format,wi=t.RGBA_ASTC_8x5_Format,Ri=t.RGBA_ASTC_8x6_Format,Li=t.RGBA_ASTC_8x8_Format,Pi=t.RGBA_BPTC_Format,vi=t.RGBA_ETC2_EAC_Format,Fi=t.RGBA_PVRTC_2BPPV1_Format,Gi=t.RGBA_PVRTC_4BPPV1_Format,Bi=t.RGBA_S3TC_DXT1_Format,Ii=t.RGBA_S3TC_DXT3_Format,Ni=t.RGBA_S3TC_DXT5_Format,Oi=t.RGBDepthPacking,Ui=t.RGBFormat,ki=t.RGBIntegerFormat,ji=t.RGB_BPTC_SIGNED_Format,Hi=t.RGB_BPTC_UNSIGNED_Format,zi=t.RGB_ETC1_Format,Xi=t.RGB_ETC2_Format,Wi=t.RGB_PVRTC_2BPPV1_Format,qi=t.RGB_PVRTC_4BPPV1_Format,Yi=t.RGB_S3TC_DXT1_Format,Vi=t.RGDepthPacking,Ki=t.RGFormat,Zi=t.RGIntegerFormat,Ee=t.RawShaderMaterial,xe=t.Ray,$i=t.Raycaster,Qi=t.RectAreaLight,Ji=t.RedFormat,th=t.RedIntegerFormat,ge=t.ReinhardToneMapping,eh=t.RenderObjectRefreshType,rh=t.RenderTarget,oh=t.RenderTarget3D,ah=t.RepeatWrapping,sh=t.ReplaceStencilOp,nh=t.ReverseSubtractEquation,ih=t.RingGeometry,hh=t.SIGNED_R11_EAC_Format,lh=t.SIGNED_RED_GREEN_RGTC2_Format,ch=t.SIGNED_RED_RGTC1_Format,ph=t.SIGNED_RG11_EAC_Format,_h=t.SRGBColorSpace,Se=t.SRGBTransfer,ye=t.Scene,uh=t.ShaderChunk,dh=t.ShaderLib,vt=t.ShaderMaterial,mh=t.ShadowMaterial,fh=t.Shape,Eh=t.ShapeGeometry,xh=t.ShapePath,gh=t.ShapeUtils,Sh=t.ShortType,yh=t.Skeleton,Mh=t.SkeletonHelper,Ch=t.SkinnedMesh,Th=t.Source,bh=t.Sphere,Dh=t.SphereGeometry,Ft=t.Spherical,Ah=t.SphericalHarmonics3,wh=t.SplineCurve,Rh=t.SpotLight,Lh=t.SpotLightHelper,Ph=t.Sprite,vh=t.SpriteMaterial,Fh=t.SrcAlphaFactor,Gh=t.SrcAlphaSaturateFactor,Bh=t.SrcColorFactor,Ih=t.StaticCopyUsage,Nh=t.StaticDrawUsage,Oh=t.StaticReadUsage,Uh=t.StereoCamera,kh=t.StreamCopyUsage,jh=t.StreamDrawUsage,Hh=t.StreamReadUsage,zh=t.StringKeyframeTrack,Xh=t.SubtractEquation,Wh=t.SubtractiveBlending,Q=t.TOUCH,qh=t.TangentSpaceNormalMap,Me=t.TetrahedronGeometry,Yh=t.Texture,Vh=t.TextureLoader,Kh=t.TextureSource,Zh=t.TextureUtils,$h=t.ThreeCapabilityError,Qh=t.ThreeCompatibilityRuntime,Ce=t.Timer,Jh=t.TimestampQuery,tl=t.TorusGeometry,el=t.TorusKnotGeometry,rl=t.Triangle,ol=t.TriangleFanDrawMode,al=t.TriangleStripDrawMode,sl=t.TrianglesDrawMode,nl=t.TubeGeometry,il=t.UVMapping,hl=t.Uint16BufferAttribute,ll=t.Uint32BufferAttribute,cl=t.Uint8BufferAttribute,pl=t.Uint8ClampedBufferAttribute,_l=t.Uniform,ul=t.UniformsGroup,dl=t.UniformsLib,xt=t.UniformsUtils,ml=t.UnsignedByteType,fl=t.UnsignedInt101111Type,El=t.UnsignedInt248Type,xl=t.UnsignedInt5999Type,gl=t.UnsignedIntType,Sl=t.UnsignedShort4444Type,yl=t.UnsignedShort5551Type,Ml=t.UnsignedShortType,Cl=t.VSMShadowMap,w=t.Vector2,U=t.Vector3,Tl=t.Vector4,bl=t.VectorKeyframeTrack,Dl=t.VideoFrameTexture,Al=t.VideoTexture,wl=t.WebGL3DRenderTarget,Rl=t.WebGLArrayRenderTarget,Ll=t.WebGLCoordinateSystem,Pl=t.WebGLCubeRenderTarget,Te=t.WebGLRenderTarget,be=t.WebGLRenderer,vl=t.WebGLUtils,Fl=t.WebGPUCoordinateSystem,Gl=t.WebGPURenderer,Bl=t.WebXRController,Il=t.WireframeGeometry,Nl=t.WrapAroundEnding,Ol=t.ZeroCurvatureEnding,Ul=t.ZeroFactor,kl=t.ZeroSlopeEnding,jl=t.ZeroStencilOp,Hl=t.createCanvasElement,zl=t.error,Xl=t.getConsoleFunction,Wl=t.getNativeRaycastDiagnostics,ql=t.log,Yl=t.setConsoleFunction,Vl=t.warn,Kl=t.warnOnce;var De={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};var k=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}},Ye=new de(-1,1,1,-1,0,1),Gt=class extends $t{constructor(){super(),this.setAttribute("position",new Lt([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new Lt([0,2,0,0,2,0],2))}},Ve=new Gt,et=class{constructor(e){this._mesh=new le(Ve,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,Ye)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}};var rt=class extends k{constructor(e,r="tDiffuse"){super(),this.textureID=r,this.uniforms=null,this.material=null,e instanceof vt?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=xt.clone(e.uniforms),this.material=new vt({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new et(this.material)}render(e,r,a){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=a.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(r),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}};var ht=class extends k{constructor(e,r){super(),this.scene=e,this.camera=r,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,r,a){let n=e.getContext(),s=e.state;s.buffers.color.setMask(!1),s.buffers.depth.setMask(!1),s.buffers.color.setLocked(!0),s.buffers.depth.setLocked(!0);let i,c;this.inverse?(i=0,c=1):(i=1,c=0),s.buffers.stencil.setTest(!0),s.buffers.stencil.setOp(n.REPLACE,n.REPLACE,n.REPLACE),s.buffers.stencil.setFunc(n.ALWAYS,i,4294967295),s.buffers.stencil.setClear(c),s.buffers.stencil.setLocked(!0),e.setRenderTarget(a),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(r),this.clear&&e.clear(),e.render(this.scene,this.camera),s.buffers.color.setLocked(!1),s.buffers.depth.setLocked(!1),s.buffers.color.setMask(!0),s.buffers.depth.setMask(!0),s.buffers.stencil.setLocked(!1),s.buffers.stencil.setFunc(n.EQUAL,1,4294967295),s.buffers.stencil.setOp(n.KEEP,n.KEEP,n.KEEP),s.buffers.stencil.setLocked(!0)}},gt=class extends k{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}};var lt=class{constructor(e,r){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),r===void 0){let a=e.getSize(new w);this._width=a.width,this._height=a.height,r=new Te(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:ae}),r.texture.name="EffectComposer.rt1"}else this._width=r.width,this._height=r.height;this.renderTarget1=r,this.renderTarget2=r.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new rt(De),this.copyPass.material.blending=_e,this.timer=new Ce}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,r){this.passes.splice(r,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let r=this.passes.indexOf(e);r!==-1&&this.passes.splice(r,1)}isLastEnabledPass(e){for(let r=e+1;r<this.passes.length;r++)if(this.passes[r].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());let r=this.renderer.getRenderTarget(),a=!1;for(let n=0,s=this.passes.length;n<s;n++){let i=this.passes[n];if(i.enabled!==!1){if(i.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(n),i.render(this.renderer,this.writeBuffer,this.readBuffer,e,a),i.needsSwap){if(a){let c=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(c.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),l.setFunc(c.EQUAL,1,4294967295)}this.swapBuffers()}ht!==void 0&&(i instanceof ht?a=!0:i instanceof gt&&(a=!1))}}this.renderer.setRenderTarget(r)}reset(e){if(e===void 0){let r=this.renderer.getSize(new w);this._pixelRatio=this.renderer.getPixelRatio(),this._width=r.width,this._height=r.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,r){this._width=e,this._height=r;let a=this._width*this._pixelRatio,n=this._height*this._pixelRatio;this.renderTarget1.setSize(a,n),this.renderTarget2.setSize(a,n);for(let s=0;s<this.passes.length;s++)this.passes[s].setSize(a,n)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}};var St=class extends k{constructor(e,r,a=null,n=null,s=null){super(),this.scene=e,this.camera=r,this.overrideMaterial=a,this.clearColor=n,this.clearAlpha=s,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new Jt}render(e,r,a){let n=e.autoClear;e.autoClear=!1;let s,i;this.overrideMaterial!==null&&(i=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(s=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:a),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(s),this.overrideMaterial!==null&&(this.scene.overrideMaterial=i),e.autoClear=n}};var ct={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#elif defined( CUSTOM_TONE_MAPPING )

				gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};var yt=class extends k{constructor(){super(),this.isOutputPass=!0,this.uniforms=xt.clone(ct.uniforms),this.material=new Ee({name:ct.name,uniforms:this.uniforms,vertexShader:ct.vertexShader,fragmentShader:ct.fragmentShader}),this._fsQuad=new et(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,r,a){this.uniforms.tDiffuse.value=a.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},te.getTransfer(this._outputColorSpace)===Se&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===ie?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===ge?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===Qt?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===Kt?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===Zt?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===pe?this.material.defines.NEUTRAL_TONE_MAPPING="":this._toneMapping===re&&(this.material.defines.CUSTOM_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(r),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}};var Ae={name:"FXAAShader",uniforms:{tDiffuse:{value:null},resolution:{value:new w(1/1024,1/512)}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec2 resolution;
		varying vec2 vUv;

		#define EDGE_STEP_COUNT 6
		#define EDGE_GUESS 8.0
		#define EDGE_STEPS 1.0, 1.5, 2.0, 2.0, 2.0, 4.0
		const float edgeSteps[EDGE_STEP_COUNT] = float[EDGE_STEP_COUNT]( EDGE_STEPS );

		float _ContrastThreshold = 0.0312;
		float _RelativeThreshold = 0.063;
		float _SubpixelBlending = 1.0;

		vec4 Sample( sampler2D  tex2D, vec2 uv ) {

			return texture( tex2D, uv );

		}

		float SampleLuminance( sampler2D tex2D, vec2 uv ) {

			return dot( Sample( tex2D, uv ).rgb, vec3( 0.3, 0.59, 0.11 ) );

		}

		float SampleLuminance( sampler2D tex2D, vec2 texSize, vec2 uv, float uOffset, float vOffset ) {

			uv += texSize * vec2(uOffset, vOffset);
			return SampleLuminance(tex2D, uv);

		}

		struct LuminanceData {

			float m, n, e, s, w;
			float ne, nw, se, sw;
			float highest, lowest, contrast;

		};

		LuminanceData SampleLuminanceNeighborhood( sampler2D tex2D, vec2 texSize, vec2 uv ) {

			LuminanceData l;
			l.m = SampleLuminance( tex2D, uv );
			l.n = SampleLuminance( tex2D, texSize, uv,  0.0,  1.0 );
			l.e = SampleLuminance( tex2D, texSize, uv,  1.0,  0.0 );
			l.s = SampleLuminance( tex2D, texSize, uv,  0.0, -1.0 );
			l.w = SampleLuminance( tex2D, texSize, uv, -1.0,  0.0 );

			l.ne = SampleLuminance( tex2D, texSize, uv,  1.0,  1.0 );
			l.nw = SampleLuminance( tex2D, texSize, uv, -1.0,  1.0 );
			l.se = SampleLuminance( tex2D, texSize, uv,  1.0, -1.0 );
			l.sw = SampleLuminance( tex2D, texSize, uv, -1.0, -1.0 );

			l.highest = max( max( max( max( l.n, l.e ), l.s ), l.w ), l.m );
			l.lowest = min( min( min( min( l.n, l.e ), l.s ), l.w ), l.m );
			l.contrast = l.highest - l.lowest;
			return l;

		}

		bool ShouldSkipPixel( LuminanceData l ) {

			float threshold = max( _ContrastThreshold, _RelativeThreshold * l.highest );
			return l.contrast < threshold;

		}

		float DeterminePixelBlendFactor( LuminanceData l ) {

			float f = 2.0 * ( l.n + l.e + l.s + l.w );
			f += l.ne + l.nw + l.se + l.sw;
			f *= 1.0 / 12.0;
			f = abs( f - l.m );
			f = clamp( f / l.contrast, 0.0, 1.0 );

			float blendFactor = smoothstep( 0.0, 1.0, f );
			return blendFactor * blendFactor * _SubpixelBlending;

		}

		struct EdgeData {

			bool isHorizontal;
			float pixelStep;
			float oppositeLuminance, gradient;

		};

		EdgeData DetermineEdge( vec2 texSize, LuminanceData l ) {

			EdgeData e;
			float horizontal =
				abs( l.n + l.s - 2.0 * l.m ) * 2.0 +
				abs( l.ne + l.se - 2.0 * l.e ) +
				abs( l.nw + l.sw - 2.0 * l.w );
			float vertical =
				abs( l.e + l.w - 2.0 * l.m ) * 2.0 +
				abs( l.ne + l.nw - 2.0 * l.n ) +
				abs( l.se + l.sw - 2.0 * l.s );
			e.isHorizontal = horizontal >= vertical;

			float pLuminance = e.isHorizontal ? l.n : l.e;
			float nLuminance = e.isHorizontal ? l.s : l.w;
			float pGradient = abs( pLuminance - l.m );
			float nGradient = abs( nLuminance - l.m );

			e.pixelStep = e.isHorizontal ? texSize.y : texSize.x;

			if (pGradient < nGradient) {

				e.pixelStep = -e.pixelStep;
				e.oppositeLuminance = nLuminance;
				e.gradient = nGradient;

			} else {

				e.oppositeLuminance = pLuminance;
				e.gradient = pGradient;

			}

			return e;

		}

		float DetermineEdgeBlendFactor( sampler2D  tex2D, vec2 texSize, LuminanceData l, EdgeData e, vec2 uv ) {

			vec2 uvEdge = uv;
			vec2 edgeStep;
			if (e.isHorizontal) {

				uvEdge.y += e.pixelStep * 0.5;
				edgeStep = vec2( texSize.x, 0.0 );

			} else {

				uvEdge.x += e.pixelStep * 0.5;
				edgeStep = vec2( 0.0, texSize.y );

			}

			float edgeLuminance = ( l.m + e.oppositeLuminance ) * 0.5;
			float gradientThreshold = e.gradient * 0.25;

			vec2 puv = uvEdge + edgeStep * edgeSteps[0];
			float pLuminanceDelta = SampleLuminance( tex2D, puv ) - edgeLuminance;
			bool pAtEnd = abs( pLuminanceDelta ) >= gradientThreshold;

			for ( int i = 1; i < EDGE_STEP_COUNT && !pAtEnd; i++ ) {

				puv += edgeStep * edgeSteps[i];
				pLuminanceDelta = SampleLuminance( tex2D, puv ) - edgeLuminance;
				pAtEnd = abs( pLuminanceDelta ) >= gradientThreshold;

			}

			if ( !pAtEnd ) {

				puv += edgeStep * EDGE_GUESS;

			}

			vec2 nuv = uvEdge - edgeStep * edgeSteps[0];
			float nLuminanceDelta = SampleLuminance( tex2D, nuv ) - edgeLuminance;
			bool nAtEnd = abs( nLuminanceDelta ) >= gradientThreshold;

			for ( int i = 1; i < EDGE_STEP_COUNT && !nAtEnd; i++ ) {

				nuv -= edgeStep * edgeSteps[i];
				nLuminanceDelta = SampleLuminance( tex2D, nuv ) - edgeLuminance;
				nAtEnd = abs( nLuminanceDelta ) >= gradientThreshold;

			}

			if ( !nAtEnd ) {

				nuv -= edgeStep * EDGE_GUESS;

			}

			float pDistance, nDistance;
			if ( e.isHorizontal ) {

				pDistance = puv.x - uv.x;
				nDistance = uv.x - nuv.x;

			} else {

				pDistance = puv.y - uv.y;
				nDistance = uv.y - nuv.y;

			}

			float shortestDistance;
			bool deltaSign;
			if ( pDistance <= nDistance ) {

				shortestDistance = pDistance;
				deltaSign = pLuminanceDelta >= 0.0;

			} else {

				shortestDistance = nDistance;
				deltaSign = nLuminanceDelta >= 0.0;

			}

			if ( deltaSign == ( l.m - edgeLuminance >= 0.0 ) ) {

				return 0.0;

			}

			return 0.5 - shortestDistance / ( pDistance + nDistance );

		}

		vec4 ApplyFXAA( sampler2D  tex2D, vec2 texSize, vec2 uv ) {

			LuminanceData luminance = SampleLuminanceNeighborhood( tex2D, texSize, uv );
			if ( ShouldSkipPixel( luminance ) ) {

				return Sample( tex2D, uv );

			}

			float pixelBlend = DeterminePixelBlendFactor( luminance );
			EdgeData edge = DetermineEdge( texSize, luminance );
			float edgeBlend = DetermineEdgeBlendFactor( tex2D, texSize, luminance, edge, uv );
			float finalBlend = max( pixelBlend, edgeBlend );

			if (edge.isHorizontal) {

				uv.y += edge.pixelStep * finalBlend;

			} else {

				uv.x += edge.pixelStep * finalBlend;

			}

			return Sample( tex2D, uv );

		}

		void main() {

			gl_FragColor = ApplyFXAA( tDiffuse, resolution.xy, vUv );

		}`};var Mt=class extends rt{constructor(){super(Ae)}setSize(e,r){this.material.uniforms.resolution.value.set(1/e,1/r)}};var we={type:"change"},It={type:"start"},Le={type:"end"},Ct=new xe,Re=new fe,Ke=Math.cos(70*he.DEG2RAD),D=new U,v=2*Math.PI,x={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Bt=1e-6,Tt=class extends ee{constructor(e,r=null){super(e,r),this.state=x.NONE,this.target=new U,this.cursor=new U,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:$.ROTATE,MIDDLE:$.DOLLY,RIGHT:$.PAN},this.touches={ONE:Q.ROTATE,TWO:Q.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle="auto",this._domElementKeyEvents=null,this._lastPosition=new U,this._lastQuaternion=new Pt,this._lastTargetPosition=new U,this._quat=new Pt().setFromUnitVectors(e.up,new U(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Ft,this._sphericalDelta=new Ft,this._scale=1,this._panOffset=new U,this._rotateStart=new w,this._rotateEnd=new w,this._rotateDelta=new w,this._panStart=new w,this._panEnd=new w,this._panDelta=new w,this._dollyStart=new w,this._dollyEnd=new w,this._dollyDelta=new w,this._dollyDirection=new U,this._mouse=new w,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=$e.bind(this),this._onPointerDown=Ze.bind(this),this._onPointerUp=Qe.bind(this),this._onContextMenu=sr.bind(this),this._onMouseWheel=er.bind(this),this._onKeyDown=rr.bind(this),this._onTouchStart=or.bind(this),this._onTouchMove=ar.bind(this),this._onMouseDown=Je.bind(this),this._onMouseMove=tr.bind(this),this._interceptControlDown=nr.bind(this),this._interceptControlUp=ir.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(e){this._cursorStyle=e,e==="grab"?this.domElement.style.cursor="grab":this.domElement.style.cursor="auto"}get cursorStyle(){return this._cursorStyle}connect(e){super.connect(e),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.state=x.NONE,this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents();let e=this.domElement.getRootNode();e.removeEventListener("keydown",this._interceptControlDown,{capture:!0}),e.removeEventListener("keyup",this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction="",this.domElement.style.cursor="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(we),this.update(),this.state=x.NONE}pan(e,r){this._pan(e,r),this.update()}dollyIn(e){this._dollyIn(e),this.update()}dollyOut(e){this._dollyOut(e),this.update()}rotateLeft(e){this._rotateLeft(e),this.update()}rotateUp(e){this._rotateUp(e),this.update()}update(e=null){let r=this.object.position;D.copy(r).sub(this.target),D.applyQuaternion(this._quat),this._spherical.setFromVector3(D),this.autoRotate&&this.state===x.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let a=this.minAzimuthAngle,n=this.maxAzimuthAngle;isFinite(a)&&isFinite(n)&&(a<-Math.PI?a+=v:a>Math.PI&&(a-=v),n<-Math.PI?n+=v:n>Math.PI&&(n-=v),a<=n?this._spherical.theta=Math.max(a,Math.min(n,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(a+n)/2?Math.max(a,this._spherical.theta):Math.min(n,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let s=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let i=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),s=i!=this._spherical.radius}if(D.setFromSpherical(this._spherical),D.applyQuaternion(this._quatInverse),r.copy(this.target).add(D),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let i=null;if(this.object.isPerspectiveCamera){let c=D.length();i=this._clampDistance(c*this._scale);let l=c-i;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),s=!!l}else if(this.object.isOrthographicCamera){let c=new U(this._mouse.x,this._mouse.y,0);c.unproject(this.object);let l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),s=l!==this.object.zoom;let p=new U(this._mouse.x,this._mouse.y,0);p.unproject(this.object),this.object.position.sub(p).add(c),this.object.updateMatrixWorld(),i=D.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;i!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(i).add(this.object.position):(Ct.origin.copy(this.object.position),Ct.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Ct.direction))<Ke?this.object.lookAt(this.target):(Re.setFromNormalAndCoplanarPoint(this.object.up,this.target),Ct.intersectPlane(Re,this.target))))}else if(this.object.isOrthographicCamera){let i=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),i!==this.object.zoom&&(this.object.updateProjectionMatrix(),s=!0)}return this._scale=1,this._performCursorZoom=!1,s||this._lastPosition.distanceToSquared(this.object.position)>Bt||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Bt||this._lastTargetPosition.distanceToSquared(this.target)>Bt?(this.dispatchEvent(we),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?v/60*this.autoRotateSpeed*e:v/60/60*this.autoRotateSpeed}_getZoomScale(e){let r=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*r)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,r){D.setFromMatrixColumn(r,0),D.multiplyScalar(-e),this._panOffset.add(D)}_panUp(e,r){this.screenSpacePanning===!0?D.setFromMatrixColumn(r,1):(D.setFromMatrixColumn(r,0),D.crossVectors(this.object.up,D)),D.multiplyScalar(e),this._panOffset.add(D)}_pan(e,r){let a=this.domElement;if(this.object.isPerspectiveCamera){let n=this.object.position;D.copy(n).sub(this.target);let s=D.length();s*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*s/a.clientHeight,this.object.matrix),this._panUp(2*r*s/a.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/a.clientWidth,this.object.matrix),this._panUp(r*(this.object.top-this.object.bottom)/this.object.zoom/a.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,r){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let a=this.domElement.getBoundingClientRect(),n=e-a.left,s=r-a.top,i=a.width,c=a.height;this._mouse.x=n/i*2-1,this._mouse.y=-(s/c)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let r=this.domElement;this._rotateLeft(v*this._rotateDelta.x/r.clientHeight),this._rotateUp(v*this._rotateDelta.y/r.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let r=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(v*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),r=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-v*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),r=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(v*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),r=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-v*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),r=!0;break}r&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let r=this._getSecondPointerPosition(e),a=.5*(e.pageX+r.x),n=.5*(e.pageY+r.y);this._rotateStart.set(a,n)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let r=this._getSecondPointerPosition(e),a=.5*(e.pageX+r.x),n=.5*(e.pageY+r.y);this._panStart.set(a,n)}}_handleTouchStartDolly(e){let r=this._getSecondPointerPosition(e),a=e.pageX-r.x,n=e.pageY-r.y,s=Math.sqrt(a*a+n*n);this._dollyStart.set(0,s)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let a=this._getSecondPointerPosition(e),n=.5*(e.pageX+a.x),s=.5*(e.pageY+a.y);this._rotateEnd.set(n,s)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let r=this.domElement;this._rotateLeft(v*this._rotateDelta.x/r.clientHeight),this._rotateUp(v*this._rotateDelta.y/r.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let r=this._getSecondPointerPosition(e),a=.5*(e.pageX+r.x),n=.5*(e.pageY+r.y);this._panEnd.set(a,n)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let r=this._getSecondPointerPosition(e),a=e.pageX-r.x,n=e.pageY-r.y,s=Math.sqrt(a*a+n*n);this._dollyEnd.set(0,s),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let i=(e.pageX+r.x)*.5,c=(e.pageY+r.y)*.5;this._updateZoomParameters(i,c)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let r=0;r<this._pointers.length;r++)if(this._pointers[r]==e.pointerId){this._pointers.splice(r,1);return}}_isTrackingPointer(e){for(let r=0;r<this._pointers.length;r++)if(this._pointers[r]==e.pointerId)return!0;return!1}_trackPointer(e){let r=this._pointerPositions[e.pointerId];r===void 0&&(r=new w,this._pointerPositions[e.pointerId]=r),r.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let r=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[r]}_customWheelEvent(e){let r=e.deltaMode,a={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(r){case 1:a.deltaY*=16;break;case 2:a.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(a.deltaY*=10),a}};function Ze(o){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(o.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(o)&&(this._addPointer(o),o.pointerType==="touch"?this._onTouchStart(o):this._onMouseDown(o),this._cursorStyle==="grab"&&(this.domElement.style.cursor="grabbing")))}function $e(o){this.enabled!==!1&&(o.pointerType==="touch"?this._onTouchMove(o):this._onMouseMove(o))}function Qe(o){switch(this._removePointer(o),this._pointers.length){case 0:this.domElement.releasePointerCapture(o.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(Le),this.state=x.NONE,this._cursorStyle==="grab"&&(this.domElement.style.cursor="grab");break;case 1:let e=this._pointers[0],r=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:r.x,pageY:r.y});break}}function Je(o){let e;switch(o.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case $.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(o),this.state=x.DOLLY;break;case $.ROTATE:if(o.ctrlKey||o.metaKey||o.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(o),this.state=x.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(o),this.state=x.ROTATE}break;case $.PAN:if(o.ctrlKey||o.metaKey||o.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(o),this.state=x.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(o),this.state=x.PAN}break;default:this.state=x.NONE}this.state!==x.NONE&&this.dispatchEvent(It)}function tr(o){switch(this.state){case x.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(o);break;case x.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(o);break;case x.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(o);break}}function er(o){this.enabled===!1||this.enableZoom===!1||this.state!==x.NONE||(o.preventDefault(),this.dispatchEvent(It),this._handleMouseWheel(this._customWheelEvent(o)),this.dispatchEvent(Le))}function rr(o){this.enabled!==!1&&this._handleKeyDown(o)}function or(o){switch(this._trackPointer(o),this._pointers.length){case 1:switch(this.touches.ONE){case Q.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(o),this.state=x.TOUCH_ROTATE;break;case Q.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(o),this.state=x.TOUCH_PAN;break;default:this.state=x.NONE}break;case 2:switch(this.touches.TWO){case Q.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(o),this.state=x.TOUCH_DOLLY_PAN;break;case Q.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(o),this.state=x.TOUCH_DOLLY_ROTATE;break;default:this.state=x.NONE}break;default:this.state=x.NONE}this.state!==x.NONE&&this.dispatchEvent(It)}function ar(o){switch(this._trackPointer(o),this.state){case x.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(o),this.update();break;case x.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(o),this.update();break;case x.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(o),this.update();break;case x.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(o),this.update();break;default:this.state=x.NONE}}function sr(o){this.enabled!==!1&&o.preventDefault()}function nr(o){o.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function ir(o){o.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var ot,pt,F,Nt,R,_t,at,Pe;hr();function hr(){R=document.getElementById("container"),ot=new me(45,R.offsetWidth/R.offsetHeight,1,2e3),ot.position.z=500,pt=new ye;let o=new se(16777215,9276813);o.position.set(0,1e3,0),pt.add(o);let e=new oe(16777215,3);e.position.set(-3e3,1e3,-1e3),pt.add(e);let r=new Me(10),a=new ce({color:16200242,flatShading:!0}),n=new ne(r,a,100),s=new ue;for(let l=0;l<100;l++)s.position.x=Math.random()*500-250,s.position.y=Math.random()*500-250,s.position.z=Math.random()*500-250,s.scale.setScalar(Math.random()*2+1),s.rotation.x=Math.random()*Math.PI,s.rotation.y=Math.random()*Math.PI,s.rotation.z=Math.random()*Math.PI,s.updateMatrix(),n.setMatrixAt(l,s.matrix);pt.add(n),F=new be,F.setPixelRatio(window.devicePixelRatio),F.setSize(R.offsetWidth,R.offsetHeight),F.setAnimationLoop(cr),F.autoClear=!1,Nt=new Tt(ot,F.domElement),Nt.autoRotate=!0,R.appendChild(F.domElement);let i=new St(pt,ot);i.clearAlpha=0,Pe=new Mt;let c=new yt;_t=new lt(F),_t.addPass(i),_t.addPass(c),at=new lt(F),at.addPass(i),at.addPass(c),at.addPass(Pe),window.addEventListener("resize",lr)}function lr(){ot.aspect=R.offsetWidth/R.offsetHeight,ot.updateProjectionMatrix(),F.setSize(R.offsetWidth,R.offsetHeight),_t.setSize(R.offsetWidth,R.offsetHeight),at.setSize(R.offsetWidth,R.offsetHeight)}function cr(){let o=R.offsetWidth/2;Nt.update(),F.setScissorTest(!0),F.setScissor(0,0,o-1,R.offsetHeight),_t.render(),F.setScissor(o,0,o,R.offsetHeight),at.render(),F.setScissorTest(!1)}})();
