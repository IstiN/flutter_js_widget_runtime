// A bounded, dependency-free XML DOM profile for the official model loaders.
// It intentionally implements elements/text/attributes and the selector forms
// used by Collada, 3MF and KMZ; it is not a browser HTML parser.
const MAX_XML_BYTES = 16 * 1024 * 1024;
const MAX_XML_NODES = 500000;
const MAX_XML_DEPTH = 512;
const MAX_XML_ATTRIBUTES = 256;
const MAX_SELECTOR_NODES = 500000;

class JsrXmlNode {
  constructor(type, name, document) {
    this.nodeType = type;
    this.nodeName = name;
    this.ownerDocument = document || null;
    this.parentNode = null;
    this.childNodes = [];
  }

  get children() {
    return this.childNodes.filter(node => node.nodeType === 1);
  }

  get firstChild() { return this.childNodes[0] || null; }
  get lastChild() { return this.childNodes[this.childNodes.length - 1] || null; }
  get parentElement() { return this.parentNode && this.parentNode.nodeType === 1 ? this.parentNode : null; }
  get nextSibling() {
    if (!this.parentNode) return null;
    const siblings = this.parentNode.childNodes;
    return siblings[siblings.indexOf(this) + 1] || null;
  }

  get previousSibling() {
    if (!this.parentNode) return null;
    const siblings = this.parentNode.childNodes;
    return siblings[siblings.indexOf(this) - 1] || null;
  }

  get textContent() {
    if (this.nodeType === 3 || this.nodeType === 4) return this.nodeValue;
    let output = '';
    const stack = [];
    for (let index = this.childNodes.length - 1; index >= 0; index--) stack.push(this.childNodes[index]);
    let visited = 0;
    while (stack.length) {
      const node = stack.pop();
      if (++visited > MAX_XML_NODES) throw new Error('three.xml: textContent node quota exceeded');
      if (node.nodeType === 3 || node.nodeType === 4) output += node.nodeValue;
      for (let index = node.childNodes.length - 1; index >= 0; index--) stack.push(node.childNodes[index]);
    }
    return output;
  }

  set textContent(value) {
    if (this.nodeType === 3 || this.nodeType === 4) {
      this.nodeValue = String(value);
      return;
    }
    this.childNodes = [];
    if (value !== '' && value !== null && value !== undefined) {
      this.appendChild(new JsrXmlText(String(value), this.ownerDocument));
    }
  }

  appendChild(node) {
    if (node.parentNode) node.parentNode.removeChild(node);
    node.parentNode = this;
    this.childNodes.push(node);
    return node;
  }

  removeChild(node) {
    const index = this.childNodes.indexOf(node);
    if (index < 0) throw new Error('three.xml: removeChild target is not a child');
    this.childNodes.splice(index, 1);
    node.parentNode = null;
    return node;
  }

  getElementsByTagName(name) {
    return collectElements(this, false, element => name === '*' || element.nodeName === name);
  }

  getElementsByTagNameNS(namespace, localName) {
    return collectElements(this, false, element =>
      (namespace === '*' || element.namespaceURI === namespace) &&
      (localName === '*' || element.localName === localName));
  }

  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  querySelectorAll(selector) { return select(this, selector, false); }
}

class JsrXmlText extends JsrXmlNode {
  constructor(value, document, cdata = false) {
    super(cdata ? 4 : 3, cdata ? '#cdata-section' : '#text', document);
    this.nodeValue = value;
    this.data = value;
  }
}

class JsrXmlElement extends JsrXmlNode {
  constructor(name, document) {
    super(1, name, document);
    this.tagName = name;
    const colon = name.indexOf(':');
    this.prefix = colon < 0 ? null : name.slice(0, colon);
    this.localName = colon < 0 ? name : name.slice(colon + 1);
    this.namespaceURI = null;
    this.attributes = [];
    this._namespaces = null;
  }

  get id() { return this.getAttribute('id') || ''; }
  set id(value) { this.setAttribute('id', value); }

  getAttribute(name) {
    const attribute = this.attributes.find(item => item.name === name);
    return attribute ? attribute.value : null;
  }

  getAttributeNS(namespace, localName) {
    const attribute = this.attributes.find(item =>
      item.localName === localName && (namespace === '*' || item.namespaceURI === namespace));
    return attribute ? attribute.value : null;
  }

  hasAttribute(name) { return this.attributes.some(item => item.name === name); }
  hasAttributeNS(namespace, localName) {
    return this.attributes.some(item => item.localName === localName &&
      (namespace === '*' || item.namespaceURI === namespace));
  }

  setAttribute(name, value) {
    const existing = this.attributes.find(item => item.name === name);
    if (existing) {
      existing.value = String(value);
      existing.nodeValue = existing.value;
      return;
    }
    addAttribute(this, name, String(value));
  }
}

class JsrXmlDocument extends JsrXmlNode {
  constructor() {
    super(9, '#document', null);
    this.ownerDocument = this;
  }

  get documentElement() { return this.childNodes.find(node => node.nodeType === 1) || null; }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  querySelectorAll(selector) { return select(this, selector, true); }
  createElement(name) { return new JsrXmlElement(name, this); }
  createTextNode(value) { return new JsrXmlText(String(value), this); }
}

function collectElements(root, includeDocument, predicate) {
  const output = [];
  const stack = includeDocument ? [root] : [];
  if (!includeDocument) {
    for (let index = root.childNodes.length - 1; index >= 0; index--) stack.push(root.childNodes[index]);
  }
  let visited = 0;
  while (stack.length) {
    const node = stack.pop();
    if (++visited > MAX_SELECTOR_NODES) throw new Error('three.xml: traversal quota exceeded');
    if (node.nodeType === 1 && predicate(node)) output.push(node);
    for (let index = node.childNodes.length - 1; index >= 0; index--) stack.push(node.childNodes[index]);
  }
  return output;
}

function addAttribute(element, name, value) {
  if (element.attributes.length >= MAX_XML_ATTRIBUTES) throw new Error('three.xml: attribute quota exceeded');
  const colon = name.indexOf(':');
  const attribute = {
    name, nodeName: name, value, nodeValue: value, specified: true,
    localName: colon < 0 ? name : name.slice(colon + 1),
    prefix: colon < 0 ? null : name.slice(0, colon), namespaceURI: null
  };
  element.attributes.push(attribute);
  // Named access is used by a few XML consumers alongside indexed access.
  if (!Object.hasOwn(element.attributes, name)) element.attributes[name] = attribute;
}

function decodeEntities(value) {
  return value.replace(/&(#x[0-9a-f]+|#[0-9]+|amp|lt|gt|quot|apos);/gi, (match, entity) => {
    if (entity === 'amp' || entity === 'AMP') return '&';
    if (entity === 'lt' || entity === 'LT') return '<';
    if (entity === 'gt' || entity === 'GT') return '>';
    if (entity === 'quot' || entity === 'QUOT') return '"';
    if (entity === 'apos' || entity === 'APOS') return "'";
    const hexadecimal = entity[1] === 'x' || entity[1] === 'X';
    const number = Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
    if (!Number.isFinite(number) || number < 0 || number > 0x10ffff) return '\ufffd';
    return String.fromCodePoint(number);
  });
}

function skipMarkup(text, index, closing) {
  const end = text.indexOf(closing, index);
  if (end < 0) throw new Error('three.xml: unterminated markup declaration');
  return end + closing.length;
}

function parseAttributes(element, source) {
  let index = 0;
  while (index < source.length) {
    while (/\s/.test(source[index] || '')) index++;
    if (index >= source.length) break;
    const start = index;
    while (index < source.length && !/[\s=]/.test(source[index])) index++;
    const name = source.slice(start, index);
    if (!name) throw new Error('three.xml: invalid attribute name');
    while (/\s/.test(source[index] || '')) index++;
    if (source[index] !== '=') throw new Error(`three.xml: attribute ${name} has no value`);
    index++;
    while (/\s/.test(source[index] || '')) index++;
    const quote = source[index++];
    if (quote !== '"' && quote !== "'") throw new Error(`three.xml: attribute ${name} is not quoted`);
    const end = source.indexOf(quote, index);
    if (end < 0) throw new Error(`three.xml: attribute ${name} is unterminated`);
    addAttribute(element, name, decodeEntities(source.slice(index, end)));
    index = end + 1;
  }
}

function applyNamespaces(element, parent) {
  const declarations = element.attributes.filter(attribute =>
    attribute.name === 'xmlns' || attribute.name.startsWith('xmlns:'));
  const namespaces = declarations.length ? new Map(parent ? parent._namespaces : []) : parent?._namespaces || new Map();
  for (const attribute of declarations) {
    namespaces.set(attribute.name === 'xmlns' ? '' : attribute.name.slice(6), attribute.value);
  }
  namespaces.set('xml', 'http://www.w3.org/XML/1998/namespace');
  element._namespaces = namespaces;
  element.namespaceURI = namespaces.get(element.prefix || '') || null;
  for (const attribute of element.attributes) {
    if (attribute.name === 'xmlns' || attribute.name.startsWith('xmlns:')) {
      attribute.namespaceURI = 'http://www.w3.org/2000/xmlns/';
    } else if (attribute.prefix) {
      attribute.namespaceURI = namespaces.get(attribute.prefix) || null;
    }
  }
}

function parseXml(text) {
  if (text.length > MAX_XML_BYTES) throw new Error('three.xml: input exceeds 16 MiB');
  const document = new JsrXmlDocument();
  const stack = [document];
  let index = 0;
  let nodes = 0;
  const append = node => {
    if (++nodes > MAX_XML_NODES) throw new Error('three.xml: node quota exceeded');
    stack[stack.length - 1].appendChild(node);
  };
  while (index < text.length) {
    const opening = text.indexOf('<', index);
    if (opening < 0) {
      if (index < text.length) append(new JsrXmlText(decodeEntities(text.slice(index)), document));
      break;
    }
    if (opening > index) append(new JsrXmlText(decodeEntities(text.slice(index, opening)), document));
    if (text.startsWith('<!--', opening)) {
      index = skipMarkup(text, opening + 4, '-->');
      continue;
    }
    if (text.startsWith('<![CDATA[', opening)) {
      const end = text.indexOf(']]>', opening + 9);
      if (end < 0) throw new Error('three.xml: unterminated CDATA');
      append(new JsrXmlText(text.slice(opening + 9, end), document, true));
      index = end + 3;
      continue;
    }
    if (text.startsWith('<?', opening)) {
      index = skipMarkup(text, opening + 2, '?>');
      continue;
    }
    if (/^<!DOCTYPE\b/i.test(text.slice(opening, opening + 10))) {
      // Official assets do not require DTD expansion. Skip a bounded internal
      // subset as well as the ordinary one-line doctype.
      let cursor = opening + 9;
      let subset = 0;
      let quote = null;
      for (; cursor < text.length; cursor++) {
        const character = text[cursor];
        if (quote) {
          if (character === quote) quote = null;
        } else if (character === '"' || character === "'") quote = character;
        else if (character === '[') subset++;
        else if (character === ']') subset--;
        else if (character === '>' && subset === 0) break;
      }
      if (cursor >= text.length) throw new Error('three.xml: unterminated DOCTYPE');
      index = cursor + 1;
      continue;
    }
    if (text.startsWith('</', opening)) {
      const end = text.indexOf('>', opening + 2);
      if (end < 0) throw new Error('three.xml: unterminated closing tag');
      const name = text.slice(opening + 2, end).trim();
      if (stack.length <= 1 || stack[stack.length - 1].nodeName !== name) {
        throw new Error(`three.xml: mismatched closing tag ${name}`);
      }
      stack.pop();
      index = end + 1;
      continue;
    }
    const end = text.indexOf('>', opening + 1);
    if (end < 0) throw new Error('three.xml: unterminated opening tag');
    let body = text.slice(opening + 1, end);
    const selfClosing = /\/\s*$/.test(body);
    if (selfClosing) body = body.replace(/\/\s*$/, '');
    const nameMatch = /^([^\s/>]+)/.exec(body);
    if (!nameMatch) throw new Error('three.xml: missing element name');
    if (stack.length > MAX_XML_DEPTH) throw new Error('three.xml: depth quota exceeded');
    const element = new JsrXmlElement(nameMatch[1], document);
    parseAttributes(element, body.slice(nameMatch[0].length));
    applyNamespaces(element, stack[stack.length - 1]);
    append(element);
    if (!selfClosing) stack.push(element);
    index = end + 1;
  }
  if (stack.length !== 1) throw new Error(`three.xml: unclosed element ${stack[stack.length - 1].nodeName}`);
  return document;
}

function parseSimpleSelector(source) {
  const attribute = /\[([^\]=\s]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\]]*))\]\s*$/.exec(source);
  let tag = source;
  let name = null;
  let value = null;
  if (attribute) {
    tag = source.slice(0, attribute.index) || '*';
    name = attribute[1];
    value = attribute[2] ?? attribute[3] ?? attribute[4] ?? '';
  }
  if (!/^(?:\*|[^\s\[\]]+)$/.test(tag)) throw new Error(`three.xml: unsupported selector ${source}`);
  return { tag, name, value };
}

function matchesSimple(element, selector) {
  if (selector.tag !== '*' && element.nodeName !== selector.tag) return false;
  if (selector.name !== null && element.getAttribute(selector.name) !== selector.value) return false;
  return true;
}

function selectorParts(selector) {
  const parts = [];
  let start = 0;
  let bracket = 0;
  let quote = null;
  for (let index = 0; index <= selector.length; index++) {
    const character = selector[index];
    if (quote) {
      if (character === quote) quote = null;
    } else if (character === '"' || character === "'") quote = character;
    else if (character === '[') bracket++;
    else if (character === ']') bracket--;
    else if ((/\s/.test(character || '') || index === selector.length) && bracket === 0) {
      const part = selector.slice(start, index).trim();
      if (part) parts.push(parseSimpleSelector(part));
      while (/\s/.test(selector[index + 1] || '')) index++;
      start = index + 1;
    }
  }
  if (!parts.length || bracket !== 0 || quote) throw new Error(`three.xml: invalid selector ${selector}`);
  return parts;
}

function select(root, selector, documentRoot) {
  if (typeof selector !== 'string' || selector.length > 512) throw new Error('three.xml: invalid selector');
  let current = [root];
  for (const part of selectorParts(selector)) {
    const next = [];
    const seen = new Set();
    for (const element of current) {
      const candidates = collectElements(element, documentRoot && element === root, node => matchesSimple(node, part));
      for (const candidate of candidates) {
        if (!seen.has(candidate)) {
          seen.add(candidate);
          next.push(candidate);
        }
      }
    }
    current = next;
    documentRoot = false;
  }
  return current;
}

function parserError(message) {
  const document = new JsrXmlDocument();
  const error = new JsrXmlElement('parsererror', document);
  const detail = new JsrXmlElement('div', document);
  detail.appendChild(new JsrXmlText(String(message), document));
  error.appendChild(detail);
  document.appendChild(error);
  return document;
}

export class JsrDOMParser {
  parseFromString(text, _mimeType) {
    try {
      return parseXml(String(text));
    } catch (error) {
      return parserError(error && error.message ? error.message : error);
    }
  }
}
