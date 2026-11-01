export function useNeedleProgressive() {
  console.warn('three: Needle progressive remote LOD payloads are unavailable offline; loading pinned local glTF stand-ins through the ordinary native GLTFLoader path.');
  return { enable() {}, disable() {}, dispose() {} };
}
