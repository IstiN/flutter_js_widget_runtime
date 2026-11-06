import assert from 'node:assert/strict';
import test from 'node:test';

import { JsrDOMParser } from '../vendor/xml_dom.js';

test('XML elements expose bounded browser-style inline CSS properties', () => {
  const document = new JsrDOMParser().parseFromString(
    '<svg><g style="fill: #d1792e; fill-opacity:0.75; stroke:#000"><path fill="#fff"/></g></svg>',
    'image/svg+xml',
  );
  const group = document.documentElement.firstChild;
  const path = group.firstChild;
  assert.equal(group.style.fill, '#d1792e');
  assert.equal(group.style['fill-opacity'], '0.75');
  assert.equal(group.style.fillOpacity, '0.75');
  assert.equal(group.style.stroke, '#000');
  assert.equal(group.style.visibility, '');
  assert.equal(group.getAttribute('style'), 'fill: #d1792e; fill-opacity:0.75; stroke:#000');
  assert.equal(path.style.fill, '');
  assert.equal(path.getAttribute('fill'), '#fff');
});
