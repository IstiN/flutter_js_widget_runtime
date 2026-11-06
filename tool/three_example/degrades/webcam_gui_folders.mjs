// Groups the official morphtargets-webcam morph GUI (52 flat sliders in one
// root) into bounded prefix folders using the facade's native one-level
// folder support. The official module order is
// `gui.add(influences, index, 0, 1, 0.01).name(key)` — the display name (and
// therefore the folder) is only known AFTER add() returns, so the wrapper
// re-homes each controller into its folder when `.name()` lands.
//
// Facade quotas hold by construction: 8 roots, 64 controllers, 8 folders.
// This example needs 1 root, 52 controllers, 6 folders (brow/cheek/eye/jaw/
// mouth/nose; a miss falls into a single bounded "Other"). Everything else
// stays on the shared facade path: events, listen(), gui.close(), quotas.
//
// Browser (webgl2) builds keep the real lil-gui DOM implementation — the
// wrapper passes it through untouched, exactly like the native-only camera
// lane in webcam_host.mjs.
import GUI from '../lil_gui_adapter.js';

const PREFIX_TITLES = [
  ['brow', 'Brow'],
  ['cheek', 'Cheek'],
  ['eye', 'Eyes'],
  ['jaw', 'Jaw'],
  ['mouth', 'Mouth'],
  ['nose', 'Nose']
];

function folderTitle(name) {
  const lower = String(name).toLowerCase();
  for (const [prefix, title] of PREFIX_TITLES) {
    if (lower.startsWith(prefix)) return title;
  }
  return 'Other';
}

class WebcamGroupedGui {
  constructor(options = {}) {
    const gui = new GUI(options);
    // NativeGUI stamps this.JSR; the browser lil-gui class does not have it.
    if (!gui || gui.JSR !== globalThis.jsr) return gui;
    const folders = new Map();
    const ensureFolder = title => {
      let folder = folders.get(title);
      if (!folder) {
        folder = gui.addFolder(title);
        folders.set(title, folder);
      }
      return folder;
    };
    const originalAdd = gui.add.bind(gui);
    gui.add = (object, property, ...rest) => {
      const controller = originalAdd(object, property, ...rest);
      if (!controller || typeof controller.name !== 'function') return controller;
      const originalName = controller.name.bind(controller);
      controller.name = value => {
        const result = originalName(value);
        const folder = ensureFolder(folderTitle(value));
        if (controller.container !== folder) {
          const siblings = controller.container.controllers;
          const index = siblings.indexOf(controller);
          if (index >= 0) siblings.splice(index, 1);
          folder.controllers.push(controller);
          controller.container = folder;
          // Re-render the overlay with the final folder arrangement (name()
          // already rendered the pre-rehomed tree).
          controller.updateDisplay();
        }
        return result;
      };
      return controller;
    };
    return gui;
  }
}

// The official modules import the NAMED `GUI` export — keep the grouped
// class on both the named and default lanes.
export { WebcamGroupedGui as GUI, WebcamGroupedGui as default };
