/// Shared JavaScript bootstrap injected before a widget's JS code.
///
/// It defines the `jsr` API, `console`, timers and
/// `requestAnimationFrame`. The runtime must provide a global `sendMessage`
/// function that accepts `(channelName, jsonString)`.
///
/// Hosts can extend `jsr` with host-specific APIs by evaluating additional JS
/// after the bootstrap. For example, YoLoIT may add `jsr.yoloit = {...}`
/// before the widget code runs.
const String kJsWidgetBootstrap = r'''
var __cbs = {};
var __iv_cbs = {};
var __raf_cbs = {};
var __nid = function(){return Math.random().toString(36).slice(2)+Date.now().toString(36);};

var console = {
  log:   function(){sendMessage('__jsr_log', Array.prototype.slice.call(arguments).join(' '));},
  warn:  function(){sendMessage('__jsr_log', '[W] '+Array.prototype.slice.call(arguments).join(' '));},
  error: function(){sendMessage('__jsr_log', '[E] '+Array.prototype.slice.call(arguments).join(' '));}
};

var setTimeout = function(fn,ms){ var id=__nid(); __iv_cbs[id]=function(){fn();clearInterval(id);}; sendMessage('__jsr_set_interval',JSON.stringify({id:id,ms:ms||0})); return id; };
var clearTimeout = function(id){ sendMessage('__jsr_clear_interval', String(id)); };
var setInterval = function(fn,ms){ var id=__nid(); __iv_cbs[id]=fn; sendMessage('__jsr_set_interval',JSON.stringify({id:id,ms:ms||1000})); return id; };
var clearInterval = function(id){ sendMessage('__jsr_clear_interval', String(id)); delete __iv_cbs[String(id)]; };

var requestAnimationFrame = function(fn){ var id=__nid(); __raf_cbs[id]=fn; sendMessage('__jsr_raf',JSON.stringify({id:id})); return id; };
var cancelAnimationFrame = function(id){ delete __raf_cbs[String(id)]; sendMessage('__jsr_caf', String(id)); };

var jsr = {
  // Easing helpers for animations and tweening in widget code.
  ease: {
    linear: function(t){ return t; },
    easeIn: function(t){ return t*t; },
    easeOut: function(t){ return 1-(1-t)*(1-t); },
    easeInOut: function(t){ return t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2; },
    bounce: function(t){ var n=7.5625,d=2.75; if(t<1/d){ return n*t*t; } else if(t<2/d){ t-=1.5/d; return n*t*t+0.75; } else if(t<2.5/d){ t-=2.25/d; return n*t*t+0.9375; } else { t-=2.625/d; return n*t*t+0.984375; } },
    elastic: function(t){ if(t===0||t===1)return t; var c4=(2*Math.PI)/3; return -Math.pow(2,10*t-10)*Math.sin((t*10-10.75)*c4); },
    backIn: function(t){ var c1=1.70158,c3=c1+1; return c3*t*t*t-c1*t*t; },
    backOut: function(t){ var c1=1.70158,c3=c1+1; return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2); },
  },

  render: function(tree){ try{ tree.__iid = __IID; }catch(e){} sendMessage('__jsr_render', JSON.stringify(tree)); },

  setTitle: function(t){ sendMessage('__jsr_set_title', String(t)); },

  fetchJson: function(url,opts){
    return new Promise(function(resolve,reject){
      var id=__nid();
      __cbs[id]=function(r){if(r&&r.__error)reject(new Error(r.__error));else resolve(r);};
      sendMessage('__jsr_fetch', JSON.stringify({id:id,url:url,method:(opts&&opts.method)||'GET',headers:(opts&&opts.headers)||{}}));
    });
  },

  exec: function(cmd){
    return new Promise(function(resolve,reject){
      var id=__nid();
      __cbs[id]=function(r){if(r&&r.__error)reject(new Error(r.__error));else resolve(r);};
      sendMessage('__jsr_exec', JSON.stringify({id:id,cmd:cmd}));
    });
  },

  storage:{
    _c:{},
    get:function(key){
      if(key in this._c)return Promise.resolve(this._c[key]);
      var self=this;
      return new Promise(function(resolve){
        var id=__nid();
        __cbs[id]=function(v){self._c[key]=v;resolve(v);};
        sendMessage('__jsr_storage_get', JSON.stringify({id:id,key:key}));
      });
    },
    set:function(key,val){
      this._c[key]=val;
      sendMessage('__jsr_storage_set', JSON.stringify({key:key,value:val}));
      return Promise.resolve();
    }
  },

  // Structured state for CLI (jsr app:state)
  exportState:function(obj){sendMessage('__jsr_export_state', JSON.stringify(obj||{}));},

  // Event handler registration — called from IIFE widgets:
  //   jsr.onEvent(function handleEvent(actionId, payload) { ... });
  _handler: null,
  onEvent: function(fn){ jsr._handler = fn; },

  // Keyboard handler registration for game-style widgets:
  //   jsr.onKey(function(ev) { ... });
  // ev = {key:'a'|'arrowLeft'|'arrowRight'|'arrowUp'|'arrowDown'|'space'|...,
  //       code:'KeyA', down:true|false, repeat:true|false}
  _keyHandler: null,
  onKey: function(fn){ jsr._keyHandler = fn; },

  // Theme — updated by Dart when the user switches themes
  theme: {isDark:true,bg:'#0f172a',surface:'#1e293b',border:'#334155',accent:'#818cf8',text:'#f1f5f9',muted:'#64748b'},
  _onThemeChange: null,
  onThemeChange: function(fn){ jsr._onThemeChange = fn; },

  // Encrypted secure storage — sandboxed per widget ID
  secrets:{
    get:function(key){
      return new Promise(function(resolve){
        var id=__nid();
        __cbs[id]=function(v){resolve(v);};
        sendMessage('__jsr_secrets_get', JSON.stringify({id:id,key:key}));
      });
    },
    set:function(key,val){
      return new Promise(function(resolve){
        var id=__nid();
        __cbs[id]=function(ok){resolve(ok);};
        sendMessage('__jsr_secrets_set', JSON.stringify({id:id,key:key,value:val}));
      });
    },
    delete:function(key){
      return new Promise(function(resolve){
        var id=__nid();
        __cbs[id]=function(ok){resolve(ok);};
        sendMessage('__jsr_secrets_set', JSON.stringify({id:id,key:key,value:null}));
      });
    }
  },

  showError:function(msg){
    jsr.render({type:'center',child:{type:'padding',padding:[16,16,16,16],child:{
      type:'column',mainAxisSize:'min',children:[
        {type:'text',data:'\u26a0\ufe0f',style:{fontSize:28}},
        {type:'sizedBox',height:8},
        {type:'text',data:String(msg),style:{color:'#ef4444',fontSize:13,textAlign:'center'}}
      ]
    }}});
  },

  loadAsset: function(path) {
    return new Promise(function(resolve) {
      var id = __nid();
      __cbs[id] = function(v) { resolve(v); };
      sendMessage('__jsr_load_asset', JSON.stringify({id: id, path: path}));
    });
  },

  // 3D scene API. The host provides the actual engine via Js3dHost.
  scene3d: {
    _send: function(kind, sceneId, payload) {
      sendMessage('__jsr_scene3d_command', JSON.stringify({
        kind: kind,
        sceneId: sceneId,
        payload: payload || {}
      }));
    },
    create: function(sceneId, config) {
      this._send('create', sceneId, config);
    },
    destroy: function(sceneId) {
      this._send('destroy', sceneId);
    },
    addModel: function(sceneId, options) {
      this._send('addModel', sceneId, options);
    },
    removeModel: function(sceneId, modelId) {
      this._send('removeModel', sceneId, {modelId: modelId});
    },
    setTransform: function(sceneId, modelId, transform) {
      var payload = {modelId: modelId};
      if (transform) {
        for (var k in transform) { payload[k] = transform[k]; }
      }
      this._send('setTransform', sceneId, payload);
    },
    // Batched transforms: one bridge message instead of N.
    // items = [{modelId, position?, rotation?, scale?}, ...]
    setTransforms: function(sceneId, items) {
      this._send('setTransforms', sceneId, {items: items || []});
    },
    // options: an animation name (string, skeletal), or an object
    // {name, loop, speed} for skeletal animations / {axis, speed} for the
    // built-in axis rotation.
    playAnimation: function(sceneId, modelId, options) {
      var payload = {modelId: modelId};
      if (typeof options === 'string') {
        payload.name = options;
      } else if (options) {
        for (var k in options) { payload[k] = options[k]; }
      }
      this._send('playAnimation', sceneId, payload);
    },
    stopAnimation: function(sceneId, modelId) {
      this._send('stopAnimation', sceneId, {modelId: modelId});
    },
    // Tap picking: handler receives {modelId, point:[x,y,z]} for the nearest
    // hit, or {modelId: null} on a miss.
    _tapHandlers: {},
    onTap: function(sceneId, fn) {
      this._tapHandlers[sceneId] = fn;
    },
    setCamera: function(sceneId, camera) {
      this._send('setCamera', sceneId, camera);
    },
    setLight: function(sceneId, light) {
      this._send('setLight', sceneId, light);
    }
  }
};

// Fire-and-forget host-originated events (keyboard, scene3d tap picking).
// The Dart engine calls this global; it never crosses the bridge channels.
var __jsrHostEvent = function(target, payload) {
  try {
    if (target === 'key') {
      if (jsr._keyHandler) jsr._keyHandler(payload);
    } else if (target.indexOf('scene3d.tap:') === 0) {
      var h = jsr.scene3d._tapHandlers[target.substring('scene3d.tap:'.length)];
      if (h) h(payload);
    }
  } catch (e) {
    console.error('jsr host event error: ' + (e && e.message ? e.message : String(e)));
  }
};
''';
