const THREE = globalThis.THREE;

// VRML is parsed with the pinned official Chevrotain/VRMLLoader at prepare
// time. Runtime only reconstructs the deterministic Object3D JSON payload.
// A plain Loader-shaped function avoids QuickJS CommonJS/ESM class interop.
function VRMLLoader(manager) {
  this.manager = manager || THREE.DefaultLoadingManager;
  this.path = '';
  this.requestHeader = {};
  this.withCredentials = false;
}
VRMLLoader.prototype.setPath = function (value) { this.path = value; return this; };
VRMLLoader.prototype.setRequestHeader = function (value) { this.requestHeader = value; return this; };
VRMLLoader.prototype.setWithCredentials = function (value) { this.withCredentials = value; return this; };
VRMLLoader.prototype.load = function (url, onLoad, onProgress, onError) {
  const loader = new THREE.FileLoader(this.manager);
  loader.setPath(this.path).setRequestHeader(this.requestHeader);
  loader.setWithCredentials(this.withCredentials);
  loader.load(url, text => {
    try { onLoad(this.parse(text)); }
    catch (error) { if (onError) onError(error); else console.error(error); }
  }, onProgress, onError);
};
VRMLLoader.prototype.parse = function (text) {
  const payload = JSON.parse(text);
  if (!payload.jsrPreparedVrml) throw new Error('three.prepare: expected a prepare-parsed VRML scene');
  if (payload.warning) console.warn('three: ' + payload.warning);
  return new THREE.ObjectLoader().parse(payload.scene);
};

module.exports = { VRMLLoader };
