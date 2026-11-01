export function installTslCompat() {
  const THREE = globalThis.THREE;
  if (!THREE || !THREE.WebGLRenderer) return;
  const prototype = THREE.WebGLRenderer.prototype;
  if (typeof prototype.setNodesHandler !== 'function') {
    prototype.setNodesHandler = function(handler) {
      this.nodesHandler = handler;
    };
  }
}
