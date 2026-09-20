import { t as __commonJSMin } from "../_runtime.mjs";
//#region node_modules/@xmldom/xmldom/lib/conventions.js
var require_conventions = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* Ponyfill for `Array.prototype.find` which is only available in ES6 runtimes.
	*
	* Works with anything that has a `length` property and index access properties, including NodeList.
	*
	* @template {unknown} T
	* @param {Array<T> | ({length:number, [number]: T})} list
	* @param {function (item: T, index: number, list:Array<T> | ({length:number, [number]: T})):boolean} predicate
	* @param {Partial<Pick<ArrayConstructor['prototype'], 'find'>>?} ac `Array.prototype` by default,
	* 				allows injecting a custom implementation in tests
	* @returns {T | undefined}
	*
	* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
	* @see https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.find
	*/
	function find(list, predicate, ac) {
		if (ac === void 0) ac = Array.prototype;
		if (list && typeof ac.find === "function") return ac.find.call(list, predicate);
		for (var i = 0; i < list.length; i++) if (Object.prototype.hasOwnProperty.call(list, i)) {
			var item = list[i];
			if (predicate.call(void 0, item, i, list)) return item;
		}
	}
	/**
	* "Shallow freezes" an object to render it immutable.
	* Uses `Object.freeze` if available,
	* otherwise the immutability is only in the type.
	*
	* Is used to create "enum like" objects.
	*
	* @template T
	* @param {T} object the object to freeze
	* @param {Pick<ObjectConstructor, 'freeze'> = Object} oc `Object` by default,
	* 				allows to inject custom object constructor for tests
	* @returns {Readonly<T>}
	*
	* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
	*/
	function freeze(object, oc) {
		if (oc === void 0) oc = Object;
		return oc && typeof oc.freeze === "function" ? oc.freeze(object) : object;
	}
	/**
	* Since we can not rely on `Object.assign` we provide a simplified version
	* that is sufficient for our needs.
	*
	* @param {Object} target
	* @param {Object | null | undefined} source
	*
	* @returns {Object} target
	* @throws TypeError if target is not an object
	*
	* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
	* @see https://tc39.es/ecma262/multipage/fundamental-objects.html#sec-object.assign
	*/
	function assign(target, source) {
		if (target === null || typeof target !== "object") throw new TypeError("target is not an object");
		for (var key in source) if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
		return target;
	}
	/**
	* All mime types that are allowed as input to `DOMParser.parseFromString`
	*
	* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString#Argument02 MDN
	* @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#domparsersupportedtype WHATWG HTML Spec
	* @see DOMParser.prototype.parseFromString
	*/
	var MIME_TYPE = freeze({
		/**
		* `text/html`, the only mime type that triggers treating an XML document as HTML.
		*
		* @see DOMParser.SupportedType.isHTML
		* @see https://www.iana.org/assignments/media-types/text/html IANA MimeType registration
		* @see https://en.wikipedia.org/wiki/HTML Wikipedia
		* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString MDN
		* @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-domparser-parsefromstring WHATWG HTML Spec
		*/
		HTML: "text/html",
		/**
		* Helper method to check a mime type if it indicates an HTML document
		*
		* @param {string} [value]
		* @returns {boolean}
		*
		* @see https://www.iana.org/assignments/media-types/text/html IANA MimeType registration
		* @see https://en.wikipedia.org/wiki/HTML Wikipedia
		* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString MDN
		* @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-domparser-parsefromstring 	 */
		isHTML: function(value) {
			return value === MIME_TYPE.HTML;
		},
		/**
		* `application/xml`, the standard mime type for XML documents.
		*
		* @see https://www.iana.org/assignments/media-types/application/xml IANA MimeType registration
		* @see https://tools.ietf.org/html/rfc7303#section-9.1 RFC 7303
		* @see https://en.wikipedia.org/wiki/XML_and_MIME Wikipedia
		*/
		XML_APPLICATION: "application/xml",
		/**
		* `text/html`, an alias for `application/xml`.
		*
		* @see https://tools.ietf.org/html/rfc7303#section-9.2 RFC 7303
		* @see https://www.iana.org/assignments/media-types/text/xml IANA MimeType registration
		* @see https://en.wikipedia.org/wiki/XML_and_MIME Wikipedia
		*/
		XML_TEXT: "text/xml",
		/**
		* `application/xhtml+xml`, indicates an XML document that has the default HTML namespace,
		* but is parsed as an XML document.
		*
		* @see https://www.iana.org/assignments/media-types/application/xhtml+xml IANA MimeType registration
		* @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocument WHATWG DOM Spec
		* @see https://en.wikipedia.org/wiki/XHTML Wikipedia
		*/
		XML_XHTML_APPLICATION: "application/xhtml+xml",
		/**
		* `image/svg+xml`,
		*
		* @see https://www.iana.org/assignments/media-types/image/svg+xml IANA MimeType registration
		* @see https://www.w3.org/TR/SVG11/ W3C SVG 1.1
		* @see https://en.wikipedia.org/wiki/Scalable_Vector_Graphics Wikipedia
		*/
		XML_SVG_IMAGE: "image/svg+xml"
	});
	/**
	* Namespaces that are used in this code base.
	*
	* @see http://www.w3.org/TR/REC-xml-names
	*/
	var NAMESPACE = freeze({
		/**
		* The XHTML namespace.
		*
		* @see http://www.w3.org/1999/xhtml
		*/
		HTML: "http://www.w3.org/1999/xhtml",
		/**
		* Checks if `uri` equals `NAMESPACE.HTML`.
		*
		* @param {string} [uri]
		*
		* @see NAMESPACE.HTML
		*/
		isHTML: function(uri) {
			return uri === NAMESPACE.HTML;
		},
		/**
		* The SVG namespace.
		*
		* @see http://www.w3.org/2000/svg
		*/
		SVG: "http://www.w3.org/2000/svg",
		/**
		* The `xml:` namespace.
		*
		* @see http://www.w3.org/XML/1998/namespace
		*/
		XML: "http://www.w3.org/XML/1998/namespace",
		/**
		* The `xmlns:` namespace
		*
		* @see https://www.w3.org/2000/xmlns/
		*/
		XMLNS: "http://www.w3.org/2000/xmlns/"
	});
	var nameStartChar = /[A-Z_a-z\xC0-\xD6\xD8-\xF6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
	var nameChar = new RegExp("[\\-\\.0-9" + nameStartChar.source.slice(1, -1) + "\\u00B7\\u0300-\\u036F\\u203F-\\u2040]");
	var tagNamePattern = new RegExp("^" + nameStartChar.source + nameChar.source + "*(?::" + nameStartChar.source + nameChar.source + "*)?$");
	exports.assign = assign;
	exports.find = find;
	exports.freeze = freeze;
	exports.MIME_TYPE = MIME_TYPE;
	exports.NAMESPACE = NAMESPACE;
	exports.nameStartChar = nameStartChar;
	exports.nameChar = nameChar;
	exports.tagNamePattern = tagNamePattern;
}));
//#endregion
//#region node_modules/@xmldom/xmldom/lib/dom.js
var require_dom = /* @__PURE__ */ __commonJSMin(((exports) => {
	var conventions = require_conventions();
	var find = conventions.find;
	var NAMESPACE = conventions.NAMESPACE;
	var tagNamePattern = conventions.tagNamePattern;
	/**
	* A prerequisite for `[].filter`, to drop elements that are empty
	* @param {string} input
	* @returns {boolean}
	*/
	function notEmptyString(input) {
		return input !== "";
	}
	/**
	* @see https://infra.spec.whatwg.org/#split-on-ascii-whitespace
	* @see https://infra.spec.whatwg.org/#ascii-whitespace
	*
	* @param {string} input
	* @returns {string[]} (can be empty)
	*/
	function splitOnASCIIWhitespace(input) {
		return input ? input.split(/[\t\n\f\r ]+/).filter(notEmptyString) : [];
	}
	/**
	* Adds element as a key to current if it is not already present.
	*
	* @param {Record<string, boolean | undefined>} current
	* @param {string} element
	* @returns {Record<string, boolean | undefined>}
	*/
	function orderedSetReducer(current, element) {
		if (!current.hasOwnProperty(element)) current[element] = true;
		return current;
	}
	/**
	* @see https://infra.spec.whatwg.org/#ordered-set
	* @param {string} input
	* @returns {string[]}
	*/
	function toOrderedSet(input) {
		if (!input) return [];
		var list = splitOnASCIIWhitespace(input);
		return Object.keys(list.reduce(orderedSetReducer, {}));
	}
	/**
	* Uses `list.indexOf` to implement something like `Array.prototype.includes`,
	* which we can not rely on being available.
	*
	* @param {any[]} list
	* @returns {function(any): boolean}
	*/
	function arrayIncludes(list) {
		return function(element) {
			return list && list.indexOf(element) !== -1;
		};
	}
	function copy(src, dest) {
		for (var p in src) if (Object.prototype.hasOwnProperty.call(src, p)) dest[p] = src[p];
	}
	/**
	^\w+\.prototype\.([_\w]+)\s*=\s*((?:.*\{\s*?[\r\n][\s\S]*?^})|\S.*?(?=[;\r\n]));?
	^\w+\.prototype\.([_\w]+)\s*=\s*(\S.*?(?=[;\r\n]));?
	*/
	function _extends(Class, Super) {
		var pt = Class.prototype;
		if (!(pt instanceof Super)) {
			function t() {}
			t.prototype = Super.prototype;
			t = new t();
			copy(pt, t);
			Class.prototype = pt = t;
		}
		if (pt.constructor != Class) {
			if (typeof Class != "function") console.error("unknown Class:" + Class);
			pt.constructor = Class;
		}
	}
	var NodeType = {};
	var ELEMENT_NODE = NodeType.ELEMENT_NODE = 1;
	var ATTRIBUTE_NODE = NodeType.ATTRIBUTE_NODE = 2;
	var TEXT_NODE = NodeType.TEXT_NODE = 3;
	var CDATA_SECTION_NODE = NodeType.CDATA_SECTION_NODE = 4;
	var ENTITY_REFERENCE_NODE = NodeType.ENTITY_REFERENCE_NODE = 5;
	var ENTITY_NODE = NodeType.ENTITY_NODE = 6;
	var PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE = 7;
	var COMMENT_NODE = NodeType.COMMENT_NODE = 8;
	var DOCUMENT_NODE = NodeType.DOCUMENT_NODE = 9;
	var DOCUMENT_TYPE_NODE = NodeType.DOCUMENT_TYPE_NODE = 10;
	var DOCUMENT_FRAGMENT_NODE = NodeType.DOCUMENT_FRAGMENT_NODE = 11;
	var NOTATION_NODE = NodeType.NOTATION_NODE = 12;
	var ExceptionCode = {};
	var ExceptionMessage = {};
	ExceptionCode.INDEX_SIZE_ERR = (ExceptionMessage[1] = "Index size error", 1);
	ExceptionCode.DOMSTRING_SIZE_ERR = (ExceptionMessage[2] = "DOMString size error", 2);
	var HIERARCHY_REQUEST_ERR = ExceptionCode.HIERARCHY_REQUEST_ERR = (ExceptionMessage[3] = "Hierarchy request error", 3);
	ExceptionCode.WRONG_DOCUMENT_ERR = (ExceptionMessage[4] = "Wrong document", 4);
	var INVALID_CHARACTER_ERR = ExceptionCode.INVALID_CHARACTER_ERR = (ExceptionMessage[5] = "Invalid character", 5);
	ExceptionCode.NO_DATA_ALLOWED_ERR = (ExceptionMessage[6] = "No data allowed", 6);
	ExceptionCode.NO_MODIFICATION_ALLOWED_ERR = (ExceptionMessage[7] = "No modification allowed", 7);
	var NOT_FOUND_ERR = ExceptionCode.NOT_FOUND_ERR = (ExceptionMessage[8] = "Not found", 8);
	ExceptionCode.NOT_SUPPORTED_ERR = (ExceptionMessage[9] = "Not supported", 9);
	var INUSE_ATTRIBUTE_ERR = ExceptionCode.INUSE_ATTRIBUTE_ERR = (ExceptionMessage[10] = "Attribute in use", 10);
	var INVALID_STATE_ERR = ExceptionCode.INVALID_STATE_ERR = (ExceptionMessage[11] = "Invalid state", 11);
	ExceptionCode.SYNTAX_ERR = (ExceptionMessage[12] = "Syntax error", 12);
	ExceptionCode.INVALID_MODIFICATION_ERR = (ExceptionMessage[13] = "Invalid modification", 13);
	ExceptionCode.NAMESPACE_ERR = (ExceptionMessage[14] = "Invalid namespace", 14);
	ExceptionCode.INVALID_ACCESS_ERR = (ExceptionMessage[15] = "Invalid access", 15);
	/**
	* DOM Level 2
	* Object DOMException
	* @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/ecma-script-binding.html
	* @see http://www.w3.org/TR/REC-DOM-Level-1/ecma-script-language-binding.html
	*/
	function DOMException(code, message) {
		if (message instanceof Error) var error = message;
		else {
			error = this;
			Error.call(this, ExceptionMessage[code]);
			this.message = ExceptionMessage[code];
			if (Error.captureStackTrace) Error.captureStackTrace(this, DOMException);
		}
		error.code = code;
		if (message) this.message = this.message + ": " + message;
		return error;
	}
	DOMException.prototype = Error.prototype;
	copy(ExceptionCode, DOMException);
	/**
	* @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#ID-536297177
	* The NodeList interface provides the abstraction of an ordered collection of nodes, without defining or constraining how this collection is implemented. NodeList objects in the DOM are live.
	* The items in the NodeList are accessible via an integral index, starting from 0.
	*/
	function NodeList() {}
	NodeList.prototype = {
		/**
		* The number of nodes in the list. The range of valid child node indices is 0 to length-1 inclusive.
		* @standard level1
		*/
		length: 0,
		/**
		* Returns the indexth item in the collection. If index is greater than or equal to the number of nodes in the list, this returns null.
		* @standard level1
		* @param index  unsigned long
		*   Index into the collection.
		* @return Node
		* 	The node at the indexth position in the NodeList, or null if that is not a valid index.
		*/
		item: function(index) {
			return index >= 0 && index < this.length ? this[index] : null;
		},
		toString: function(isHTML, nodeFilter, options) {
			var requireWellFormed = !!options && !!options.requireWellFormed;
			for (var buf = [], i = 0; i < this.length; i++) serializeToString(this[i], buf, isHTML, nodeFilter, null, requireWellFormed);
			return buf.join("");
		},
		/**
		* @private
		* @param {function (Node):boolean} predicate
		* @returns {Node[]}
		*/
		filter: function(predicate) {
			return Array.prototype.filter.call(this, predicate);
		},
		/**
		* @private
		* @param {Node} item
		* @returns {number}
		*/
		indexOf: function(item) {
			return Array.prototype.indexOf.call(this, item);
		}
	};
	function LiveNodeList(node, refresh) {
		this._node = node;
		this._refresh = refresh;
		_updateLiveList(this);
	}
	function _updateLiveList(list) {
		var inc = list._node._inc || list._node.ownerDocument._inc;
		if (list._inc !== inc) {
			var ls = list._refresh(list._node);
			__set__(list, "length", ls.length);
			if (!list.$$length || ls.length < list.$$length) {
				for (var i = ls.length; i in list; i++) if (Object.prototype.hasOwnProperty.call(list, i)) delete list[i];
			}
			copy(ls, list);
			list._inc = inc;
		}
	}
	LiveNodeList.prototype.item = function(i) {
		_updateLiveList(this);
		return this[i] || null;
	};
	_extends(LiveNodeList, NodeList);
	/**
	* Objects implementing the NamedNodeMap interface are used
	* to represent collections of nodes that can be accessed by name.
	* Note that NamedNodeMap does not inherit from NodeList;
	* NamedNodeMaps are not maintained in any particular order.
	* Objects contained in an object implementing NamedNodeMap may also be accessed by an ordinal index,
	* but this is simply to allow convenient enumeration of the contents of a NamedNodeMap,
	* and does not imply that the DOM specifies an order to these Nodes.
	* NamedNodeMap objects in the DOM are live.
	* used for attributes or DocumentType entities
	*/
	function NamedNodeMap() {
		this._nameIndex = Object.create(null);
	}
	function _findNodeIndex(list, node) {
		var i = list.length;
		while (i--) if (list[i] === node) return i;
	}
	function _nnmIndexAdd(list, attr) {
		list._nameIndex[attr.nodeName] = attr;
	}
	function _nnmIndexRemove(list, attr) {
		if (list._nameIndex[attr.nodeName] === attr) delete list._nameIndex[attr.nodeName];
	}
	function _addNamedNode(el, list, newAttr, oldAttr) {
		if (oldAttr) {
			list[_findNodeIndex(list, oldAttr)] = newAttr;
			_nnmIndexRemove(list, oldAttr);
		} else list[list.length++] = newAttr;
		_nnmIndexAdd(list, newAttr);
		if (el) {
			newAttr.ownerElement = el;
			var doc = el.ownerDocument;
			if (doc) {
				oldAttr && _onRemoveAttribute(doc, el, oldAttr);
				_onAddAttribute(doc, el, newAttr);
			}
		}
	}
	function _removeNamedNode(el, list, attr) {
		var i = _findNodeIndex(list, attr);
		if (i >= 0) {
			var lastIndex = list.length - 1;
			while (i < lastIndex) list[i] = list[++i];
			list.length = lastIndex;
			_nnmIndexRemove(list, attr);
			if (el) {
				var doc = el.ownerDocument;
				if (doc) {
					_onRemoveAttribute(doc, el, attr);
					attr.ownerElement = null;
				}
			}
		} else throw new DOMException(NOT_FOUND_ERR, /* @__PURE__ */ new Error(el.tagName + "@" + attr));
	}
	NamedNodeMap.prototype = {
		length: 0,
		item: NodeList.prototype.item,
		getNamedItem: function(key) {
			var i = this.length;
			while (i--) {
				var attr = this[i];
				if (attr.nodeName == key) return attr;
			}
		},
		setNamedItem: function(attr) {
			var el = attr.ownerElement;
			if (el && el != this._ownerElement) throw new DOMException(INUSE_ATTRIBUTE_ERR);
			var oldAttr = this._nameIndex[attr.nodeName];
			_addNamedNode(this._ownerElement, this, attr, oldAttr);
			return oldAttr;
		},
		setNamedItemNS: function(attr) {
			var el = attr.ownerElement, oldAttr;
			if (el && el != this._ownerElement) throw new DOMException(INUSE_ATTRIBUTE_ERR);
			oldAttr = this.getNamedItemNS(attr.namespaceURI, attr.localName);
			_addNamedNode(this._ownerElement, this, attr, oldAttr);
			return oldAttr;
		},
		removeNamedItem: function(key) {
			var attr = this.getNamedItem(key);
			_removeNamedNode(this._ownerElement, this, attr);
			return attr;
		},
		removeNamedItemNS: function(namespaceURI, localName) {
			var attr = this.getNamedItemNS(namespaceURI, localName);
			_removeNamedNode(this._ownerElement, this, attr);
			return attr;
		},
		getNamedItemNS: function(namespaceURI, localName) {
			var i = this.length;
			while (i--) {
				var node = this[i];
				if (node.localName == localName && node.namespaceURI == namespaceURI) return node;
			}
			return null;
		}
	};
	/**
	* The DOMImplementation interface represents an object providing methods
	* which are not dependent on any particular document.
	* Such an object is returned by the `Document.implementation` property.
	*
	* __The individual methods describe the differences compared to the specs.__
	*
	* @constructor
	*
	* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation MDN
	* @see https://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html#ID-102161490 DOM Level 1 Core (Initial)
	* @see https://www.w3.org/TR/DOM-Level-2-Core/core.html#ID-102161490 DOM Level 2 Core
	* @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-102161490 DOM Level 3 Core
	* @see https://dom.spec.whatwg.org/#domimplementation DOM Living Standard
	*/
	function DOMImplementation() {}
	DOMImplementation.prototype = {
		/**
		* The DOMImplementation.hasFeature() method returns a Boolean flag indicating if a given feature is supported.
		* The different implementations fairly diverged in what kind of features were reported.
		* The latest version of the spec settled to force this method to always return true, where the functionality was accurate and in use.
		*
		* @deprecated It is deprecated and modern browsers return true in all cases.
		*
		* @param {string} feature
		* @param {string} [version]
		* @returns {boolean} always true
		*
		* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/hasFeature MDN
		* @see https://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html#ID-5CED94D7 DOM Level 1 Core
		* @see https://dom.spec.whatwg.org/#dom-domimplementation-hasfeature DOM Living Standard
		*/
		hasFeature: function(feature, version) {
			return true;
		},
		/**
		* Creates an XML Document object of the specified type with its document element.
		*
		* __It behaves slightly different from the description in the living standard__:
		* - There is no interface/class `XMLDocument`, it returns a `Document` instance.
		* - `contentType`, `encoding`, `mode`, `origin`, `url` fields are currently not declared.
		* - this implementation is not validating names or qualified names
		*   (when parsing XML strings, the SAX parser takes care of that)
		*
		* @param {string|null} namespaceURI
		* @param {string} qualifiedName
		* @param {DocumentType=null} doctype
		* @returns {Document}
		*
		* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/createDocument MDN
		* @see https://www.w3.org/TR/DOM-Level-2-Core/core.html#Level-2-Core-DOM-createDocument DOM Level 2 Core (initial)
		* @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocument  DOM Level 2 Core
		*
		* @see https://dom.spec.whatwg.org/#validate-and-extract DOM: Validate and extract
		* @see https://www.w3.org/TR/xml/#NT-NameStartChar XML Spec: Names
		* @see https://www.w3.org/TR/xml-names/#ns-qualnames XML Namespaces: Qualified names
		*/
		createDocument: function(namespaceURI, qualifiedName, doctype) {
			var doc = new Document();
			doc.implementation = this;
			doc.childNodes = new NodeList();
			doc.doctype = doctype || null;
			if (doctype) doc.appendChild(doctype);
			if (qualifiedName) {
				var root = doc.createElementNS(namespaceURI, qualifiedName);
				doc.appendChild(root);
			}
			return doc;
		},
		/**
		* Returns a doctype, with the given `qualifiedName`, `publicId`, and `systemId`.
		*
		* __This implementation differs from the specification:__
		* - this implementation is not validating names or qualified names
		*   (when parsing XML strings, the SAX parser takes care of that)
		*
		* Note: `internalSubset` can only be introduced via a direct property write to `node.internalSubset` after creation.
		* Creation-time validation of `publicId`, `systemId` is not enforced.
		* The serializer-level check covers all mutation vectors, including direct property writes.
		* `internalSubset` is only serialized as `[ ... ]` when both `publicId` and `systemId` are
		* absent (empty or `'.'`) — if either external identifier is present, `internalSubset` is
		* silently omitted from the serialized output.
		*
		* @param {string} qualifiedName
		* @param {string} [publicId]
		* The external subset public identifier. Stored verbatim including surrounding quotes.
		* When serialized with `requireWellFormed: true` (via the 4th-parameter options object),
		* throws `DOMException` with code `INVALID_STATE_ERR` if the value is non-empty and does
		* not match the XML `PubidLiteral` production (W3C DOM Parsing §3.2.1.3; XML 1.0 [12]).
		* @param {string} [systemId]
		* The external subset system identifier. Stored verbatim including surrounding quotes.
		* When serialized with `requireWellFormed: true`, throws `DOMException` with code
		* `INVALID_STATE_ERR` if the value is non-empty and does not match the XML `SystemLiteral`
		* production (W3C DOM Parsing §3.2.1.3; XML 1.0 [11]).
		* @returns {DocumentType} which can either be used with `DOMImplementation.createDocument` upon document creation
		* 				  or can be put into the document via methods like `Node.insertBefore()` or `Node.replaceChild()`
		*
		* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/createDocumentType MDN
		* @see https://www.w3.org/TR/DOM-Level-2-Core/core.html#Level-2-Core-DOM-createDocType DOM Level 2 Core
		* @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocumenttype DOM Living Standard
		*
		* @see https://dom.spec.whatwg.org/#validate-and-extract DOM: Validate and extract
		* @see https://www.w3.org/TR/xml/#NT-NameStartChar XML Spec: Names
		* @see https://www.w3.org/TR/xml-names/#ns-qualnames XML Namespaces: Qualified names
		*/
		createDocumentType: function(qualifiedName, publicId, systemId) {
			var node = new DocumentType();
			node.name = qualifiedName;
			node.nodeName = qualifiedName;
			node.publicId = publicId || "";
			node.systemId = systemId || "";
			return node;
		}
	};
	/**
	* @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#ID-1950641247
	*/
	function Node() {}
	Node.prototype = {
		firstChild: null,
		lastChild: null,
		previousSibling: null,
		nextSibling: null,
		attributes: null,
		parentNode: null,
		childNodes: null,
		ownerDocument: null,
		nodeValue: null,
		namespaceURI: null,
		prefix: null,
		localName: null,
		insertBefore: function(newChild, refChild) {
			return _insertBefore(this, newChild, refChild);
		},
		replaceChild: function(newChild, oldChild) {
			_insertBefore(this, newChild, oldChild, assertPreReplacementValidityInDocument);
			if (oldChild) this.removeChild(oldChild);
		},
		removeChild: function(oldChild) {
			return _removeChild(this, oldChild);
		},
		appendChild: function(newChild) {
			return this.insertBefore(newChild, null);
		},
		hasChildNodes: function() {
			return this.firstChild != null;
		},
		cloneNode: function(deep) {
			return cloneNode(this.ownerDocument || this, this, deep);
		},
		/**
		* Puts the specified node and all of its subtree into a "normalized" form. In a normalized
		* subtree, no text nodes in the subtree are empty and there are no adjacent text nodes.
		*
		* Specifically, this method merges any adjacent text nodes (i.e., nodes for which `nodeType`
		* is `TEXT_NODE`) into a single node with the combined data. It also removes any empty text
		* nodes.
		*
		* This method iteratively traverses all child nodes to normalize all descendant nodes within
		* the subtree.
		*
		* @throws {DOMException}
		* May throw a DOMException if operations within removeChild or appendData (which are
		* potentially invoked in this method) do not meet their specific constraints.
		* @see {@link Node.removeChild}
		* @see {@link CharacterData.appendData}
		* @see ../docs/walk-dom.md.
		*/
		normalize: function() {
			walkDOM(this, null, { enter: function(node) {
				var child = node.firstChild;
				while (child) {
					var next = child.nextSibling;
					if (next !== null && next.nodeType === TEXT_NODE && child.nodeType === TEXT_NODE) {
						var tail = [];
						var sibling = next;
						while (sibling !== null && sibling.nodeType === TEXT_NODE) {
							tail.push(sibling.data);
							sibling = sibling.nextSibling;
						}
						var removed = child.nextSibling;
						while (removed !== sibling) {
							var following = removed.nextSibling;
							removed.parentNode = null;
							removed.previousSibling = null;
							removed.nextSibling = null;
							removed = following;
						}
						child.nextSibling = sibling;
						if (sibling !== null) sibling.previousSibling = child;
						else node.lastChild = child;
						child.appendData(tail.join(""));
						_onUpdateChild(node.ownerDocument, node);
						child = sibling;
					} else child = next;
				}
				return true;
			} });
		},
		isSupported: function(feature, version) {
			return this.ownerDocument.implementation.hasFeature(feature, version);
		},
		hasAttributes: function() {
			return this.attributes.length > 0;
		},
		/**
		* Look up the prefix associated to the given namespace URI, starting from this node.
		* **The default namespace declarations are ignored by this method.**
		* See Namespace Prefix Lookup for details on the algorithm used by this method.
		*
		* _Note: The implementation seems to be incomplete when compared to the algorithm described in the specs._
		*
		* @param {string | null} namespaceURI
		* @returns {string | null}
		* @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-lookupNamespacePrefix
		* @see https://www.w3.org/TR/DOM-Level-3-Core/namespaces-algorithms.html#lookupNamespacePrefixAlgo
		* @see https://dom.spec.whatwg.org/#dom-node-lookupprefix
		* @see https://github.com/xmldom/xmldom/issues/322
		*/
		lookupPrefix: function(namespaceURI) {
			var el = this;
			while (el) {
				var map = el._nsMap;
				if (map) {
					for (var n in map) if (Object.prototype.hasOwnProperty.call(map, n) && map[n] === namespaceURI) return n;
				}
				el = el.nodeType == ATTRIBUTE_NODE ? el.ownerDocument : el.parentNode;
			}
			return null;
		},
		lookupNamespaceURI: function(prefix) {
			var el = this;
			while (el) {
				var map = el._nsMap;
				if (map) {
					if (Object.prototype.hasOwnProperty.call(map, prefix)) return map[prefix];
				}
				el = el.nodeType == ATTRIBUTE_NODE ? el.ownerDocument : el.parentNode;
			}
			return null;
		},
		isDefaultNamespace: function(namespaceURI) {
			return this.lookupPrefix(namespaceURI) == null;
		}
	};
	function _xmlEncoder(c) {
		return c == "<" && "&lt;" || c == ">" && "&gt;" || c == "&" && "&amp;" || c == "\"" && "&quot;" || "&#" + c.charCodeAt() + ";";
	}
	copy(NodeType, Node);
	copy(NodeType, Node.prototype);
	/**
	* @param {Node} node
	* Root of the subtree to visit.
	* @param {function(Node): boolean} callback
	* Called for each node in depth-first pre-order. Return a truthy value to stop traversal early.
	* @return {boolean} `true` if traversal was aborted by the callback, `false` otherwise.
	*/
	function _visitNode(node, callback) {
		return walkDOM(node, null, { enter: function(n) {
			return callback(n) ? walkDOM.STOP : true;
		} }) === walkDOM.STOP;
	}
	/**
	* Depth-first pre/post-order DOM tree walker.
	*
	* Visits every node in the subtree rooted at `node`. For each node:
	*
	* 1. Calls `callbacks.enter(node, context)` before descending into the node's children. The
	* return value becomes the `context` passed to each child's `enter` call and to the matching
	* `exit` call.
	* 2. If `enter` returns `null` or `undefined`, the node's children are skipped;
	* sibling traversal continues normally.
	* 3. If `enter` returns `walkDOM.STOP`, the entire traversal is aborted immediately — no
	* further `enter` or `exit` calls are made.
	* 4. `lastChild` and `previousSibling` are read **after** `enter` returns, so `enter` may
	* safely modify the node's own child list before the walker descends. Modifying siblings of
	* the current node or any other part of the tree produces unpredictable results: nodes already
	* queued on the stack are visited regardless of DOM changes, and newly inserted nodes outside
	* the current child list are never visited.
	* 5. Calls `callbacks.exit(node, context)` (if provided) after all of a node's children have
	* been visited, passing the same `context` that `enter`
	* returned for that node.
	*
	* This implementation uses an explicit stack and does not recurse — it is safe on arbitrarily
	* deep trees.
	*
	* @param {Node} node
	* Root of the subtree to walk.
	* @param {*} context
	* Initial context value passed to the root node's `enter`.
	* @param {{ enter: function(Node, *): *, exit?: function(Node, *): void }} callbacks
	* @returns {void | walkDOM.STOP}
	* @see ../docs/walk-dom.md.
	*/
	function walkDOM(node, context, callbacks) {
		var stack = [{
			node,
			context,
			phase: walkDOM.ENTER
		}];
		while (stack.length > 0) {
			var frame = stack.pop();
			if (frame.phase === walkDOM.ENTER) {
				var childContext = callbacks.enter(frame.node, frame.context);
				if (childContext === walkDOM.STOP) return walkDOM.STOP;
				stack.push({
					node: frame.node,
					context: childContext,
					phase: walkDOM.EXIT
				});
				if (childContext === null || childContext === void 0) continue;
				var child = frame.node.lastChild;
				while (child) {
					stack.push({
						node: child,
						context: childContext,
						phase: walkDOM.ENTER
					});
					child = child.previousSibling;
				}
			} else if (callbacks.exit) callbacks.exit(frame.node, frame.context);
		}
	}
	/**
	* Sentinel value returned from a `walkDOM` `enter` callback to abort the entire traversal
	* immediately.
	*
	* @type {symbol}
	*/
	walkDOM.STOP = Symbol("walkDOM.STOP");
	/**
	* Phase constant for a stack frame that has not yet been visited.
	* The `enter` callback is called and children are scheduled.
	*
	* @type {number}
	*/
	walkDOM.ENTER = 0;
	/**
	* Phase constant for a stack frame whose subtree has been fully visited.
	* The `exit` callback is called.
	*
	* @type {number}
	*/
	walkDOM.EXIT = 1;
	function Document() {
		this.ownerDocument = this;
	}
	function _onAddAttribute(doc, el, newAttr) {
		doc && doc._inc++;
		if (newAttr.namespaceURI === NAMESPACE.XMLNS) el._nsMap[newAttr.prefix ? newAttr.localName : ""] = newAttr.value;
	}
	function _onRemoveAttribute(doc, el, newAttr, remove) {
		doc && doc._inc++;
		if (newAttr.namespaceURI === NAMESPACE.XMLNS) delete el._nsMap[newAttr.prefix ? newAttr.localName : ""];
	}
	/**
	* Updates `el.childNodes`, updating the indexed items and it's `length`.
	* Passing `newChild` means it will be appended.
	* Otherwise it's assumed that an item has been removed,
	* and `el.firstNode` and it's `.nextSibling` are used
	* to walk the current list of child nodes.
	*
	* @param {Document} doc
	* @param {Node} el
	* @param {Node} [newChild]
	* @private
	*/
	function _onUpdateChild(doc, el, newChild) {
		if (doc && doc._inc) {
			doc._inc++;
			var cs = el.childNodes;
			if (newChild) cs[cs.length++] = newChild;
			else {
				var child = el.firstChild;
				var i = 0;
				while (child) {
					cs[i++] = child;
					child = child.nextSibling;
				}
				cs.length = i;
				delete cs[cs.length];
			}
		}
	}
	/**
	* Removes the connections between `parentNode` and `child`
	* and any existing `child.previousSibling` or `child.nextSibling`.
	*
	* @see https://github.com/xmldom/xmldom/issues/135
	* @see https://github.com/xmldom/xmldom/issues/145
	*
	* @param {Node} parentNode
	* @param {Node} child
	* @returns {Node} the child that was removed.
	* @private
	*/
	function _removeChild(parentNode, child) {
		var previous = child.previousSibling;
		var next = child.nextSibling;
		if (previous) previous.nextSibling = next;
		else parentNode.firstChild = next;
		if (next) next.previousSibling = previous;
		else parentNode.lastChild = previous;
		child.parentNode = null;
		child.previousSibling = null;
		child.nextSibling = null;
		_onUpdateChild(parentNode.ownerDocument, parentNode);
		return child;
	}
	/**
	* Returns `true` if `node` can be a parent for insertion.
	* @param {Node} node
	* @returns {boolean}
	*/
	function hasValidParentNodeType(node) {
		return node && (node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.ELEMENT_NODE);
	}
	/**
	* Returns `true` if `node` can be inserted according to it's `nodeType`.
	* @param {Node} node
	* @returns {boolean}
	*/
	function hasInsertableNodeType(node) {
		return node && (isElementNode(node) || isTextNode(node) || isDocTypeNode(node) || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.COMMENT_NODE || node.nodeType === Node.PROCESSING_INSTRUCTION_NODE);
	}
	/**
	* Returns true if `node` is a DOCTYPE node
	* @param {Node} node
	* @returns {boolean}
	*/
	function isDocTypeNode(node) {
		return node && node.nodeType === Node.DOCUMENT_TYPE_NODE;
	}
	/**
	* Returns true if the node is an element
	* @param {Node} node
	* @returns {boolean}
	*/
	function isElementNode(node) {
		return node && node.nodeType === Node.ELEMENT_NODE;
	}
	/**
	* Returns true if `node` is a text node
	* @param {Node} node
	* @returns {boolean}
	*/
	function isTextNode(node) {
		return node && node.nodeType === Node.TEXT_NODE;
	}
	/**
	* Check if en element node can be inserted before `child`, or at the end if child is falsy,
	* according to the presence and position of a doctype node on the same level.
	*
	* @param {Document} doc The document node
	* @param {Node} child the node that would become the nextSibling if the element would be inserted
	* @returns {boolean} `true` if an element can be inserted before child
	* @private
	* https://dom.spec.whatwg.org/#concept-node-ensure-pre-insertion-validity
	*/
	function isElementInsertionPossible(doc, child) {
		var parentChildNodes = doc.childNodes || [];
		if (find(parentChildNodes, isElementNode) || isDocTypeNode(child)) return false;
		var docTypeNode = find(parentChildNodes, isDocTypeNode);
		return !(child && docTypeNode && parentChildNodes.indexOf(docTypeNode) > parentChildNodes.indexOf(child));
	}
	/**
	* Check if en element node can be inserted before `child`, or at the end if child is falsy,
	* according to the presence and position of a doctype node on the same level.
	*
	* @param {Node} doc The document node
	* @param {Node} child the node that would become the nextSibling if the element would be inserted
	* @returns {boolean} `true` if an element can be inserted before child
	* @private
	* https://dom.spec.whatwg.org/#concept-node-ensure-pre-insertion-validity
	*/
	function isElementReplacementPossible(doc, child) {
		var parentChildNodes = doc.childNodes || [];
		function hasElementChildThatIsNotChild(node) {
			return isElementNode(node) && node !== child;
		}
		if (find(parentChildNodes, hasElementChildThatIsNotChild)) return false;
		var docTypeNode = find(parentChildNodes, isDocTypeNode);
		return !(child && docTypeNode && parentChildNodes.indexOf(docTypeNode) > parentChildNodes.indexOf(child));
	}
	/**
	* @private
	* Steps 1-5 of the checks before inserting and before replacing a child are the same.
	*
	* @param {Node} parent the parent node to insert `node` into
	* @param {Node} node the node to insert
	* @param {Node=} child the node that should become the `nextSibling` of `node`
	* @returns {Node}
	* @throws DOMException for several node combinations that would create a DOM that is not well-formed.
	* @throws DOMException if `child` is provided but is not a child of `parent`.
	* @see https://dom.spec.whatwg.org/#concept-node-ensure-pre-insertion-validity
	* @see https://dom.spec.whatwg.org/#concept-node-replace
	*/
	function assertPreInsertionValidity1to5(parent, node, child) {
		if (!hasValidParentNodeType(parent)) throw new DOMException(HIERARCHY_REQUEST_ERR, "Unexpected parent node type " + parent.nodeType);
		if (child && child.parentNode !== parent) throw new DOMException(NOT_FOUND_ERR, "child not in parent");
		if (!hasInsertableNodeType(node) || isDocTypeNode(node) && parent.nodeType !== Node.DOCUMENT_NODE) throw new DOMException(HIERARCHY_REQUEST_ERR, "Unexpected node type " + node.nodeType + " for parent node type " + parent.nodeType);
	}
	/**
	* @private
	* Step 6 of the checks before inserting and before replacing a child are different.
	*
	* @param {Document} parent the parent node to insert `node` into
	* @param {Node} node the node to insert
	* @param {Node | undefined} child the node that should become the `nextSibling` of `node`
	* @returns {Node}
	* @throws DOMException for several node combinations that would create a DOM that is not well-formed.
	* @throws DOMException if `child` is provided but is not a child of `parent`.
	* @see https://dom.spec.whatwg.org/#concept-node-ensure-pre-insertion-validity
	* @see https://dom.spec.whatwg.org/#concept-node-replace
	*/
	function assertPreInsertionValidityInDocument(parent, node, child) {
		var parentChildNodes = parent.childNodes || [];
		var nodeChildNodes = node.childNodes || [];
		if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
			var nodeChildElements = nodeChildNodes.filter(isElementNode);
			if (nodeChildElements.length > 1 || find(nodeChildNodes, isTextNode)) throw new DOMException(HIERARCHY_REQUEST_ERR, "More than one element or text in fragment");
			if (nodeChildElements.length === 1 && !isElementInsertionPossible(parent, child)) throw new DOMException(HIERARCHY_REQUEST_ERR, "Element in fragment can not be inserted before doctype");
		}
		if (isElementNode(node)) {
			if (!isElementInsertionPossible(parent, child)) throw new DOMException(HIERARCHY_REQUEST_ERR, "Only one element can be added and only after doctype");
		}
		if (isDocTypeNode(node)) {
			if (find(parentChildNodes, isDocTypeNode)) throw new DOMException(HIERARCHY_REQUEST_ERR, "Only one doctype is allowed");
			var parentElementChild = find(parentChildNodes, isElementNode);
			if (child && parentChildNodes.indexOf(parentElementChild) < parentChildNodes.indexOf(child)) throw new DOMException(HIERARCHY_REQUEST_ERR, "Doctype can only be inserted before an element");
			if (!child && parentElementChild) throw new DOMException(HIERARCHY_REQUEST_ERR, "Doctype can not be appended since element is present");
		}
	}
	/**
	* @private
	* Step 6 of the checks before inserting and before replacing a child are different.
	*
	* @param {Document} parent the parent node to insert `node` into
	* @param {Node} node the node to insert
	* @param {Node | undefined} child the node that should become the `nextSibling` of `node`
	* @returns {Node}
	* @throws DOMException for several node combinations that would create a DOM that is not well-formed.
	* @throws DOMException if `child` is provided but is not a child of `parent`.
	* @see https://dom.spec.whatwg.org/#concept-node-ensure-pre-insertion-validity
	* @see https://dom.spec.whatwg.org/#concept-node-replace
	*/
	function assertPreReplacementValidityInDocument(parent, node, child) {
		var parentChildNodes = parent.childNodes || [];
		var nodeChildNodes = node.childNodes || [];
		if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
			var nodeChildElements = nodeChildNodes.filter(isElementNode);
			if (nodeChildElements.length > 1 || find(nodeChildNodes, isTextNode)) throw new DOMException(HIERARCHY_REQUEST_ERR, "More than one element or text in fragment");
			if (nodeChildElements.length === 1 && !isElementReplacementPossible(parent, child)) throw new DOMException(HIERARCHY_REQUEST_ERR, "Element in fragment can not be inserted before doctype");
		}
		if (isElementNode(node)) {
			if (!isElementReplacementPossible(parent, child)) throw new DOMException(HIERARCHY_REQUEST_ERR, "Only one element can be added and only after doctype");
		}
		if (isDocTypeNode(node)) {
			function hasDoctypeChildThatIsNotChild(node) {
				return isDocTypeNode(node) && node !== child;
			}
			if (find(parentChildNodes, hasDoctypeChildThatIsNotChild)) throw new DOMException(HIERARCHY_REQUEST_ERR, "Only one doctype is allowed");
			var parentElementChild = find(parentChildNodes, isElementNode);
			if (child && parentChildNodes.indexOf(parentElementChild) < parentChildNodes.indexOf(child)) throw new DOMException(HIERARCHY_REQUEST_ERR, "Doctype can only be inserted before an element");
		}
	}
	/**
	* @private
	* @param {Node} parent the parent node to insert `node` into
	* @param {Node} node the node to insert
	* @param {Node=} child the node that should become the `nextSibling` of `node`
	* @returns {Node}
	* @throws DOMException for several node combinations that would create a DOM that is not well-formed.
	* @throws DOMException if `child` is provided but is not a child of `parent`.
	* @see https://dom.spec.whatwg.org/#concept-node-ensure-pre-insertion-validity
	*/
	function _insertBefore(parent, node, child, _inDocumentAssertion) {
		assertPreInsertionValidity1to5(parent, node, child);
		if (parent.nodeType === Node.DOCUMENT_NODE) (_inDocumentAssertion || assertPreInsertionValidityInDocument)(parent, node, child);
		var cp = node.parentNode;
		if (cp) cp.removeChild(node);
		if (node.nodeType === DOCUMENT_FRAGMENT_NODE) {
			var newFirst = node.firstChild;
			if (newFirst == null) return node;
			var newLast = node.lastChild;
		} else newFirst = newLast = node;
		var pre = child ? child.previousSibling : parent.lastChild;
		newFirst.previousSibling = pre;
		newLast.nextSibling = child;
		if (pre) pre.nextSibling = newFirst;
		else parent.firstChild = newFirst;
		if (child == null) parent.lastChild = newLast;
		else child.previousSibling = newLast;
		do {
			newFirst.parentNode = parent;
			var targetDoc = parent.ownerDocument || parent;
			_updateOwnerDocument(newFirst, targetDoc);
		} while (newFirst !== newLast && (newFirst = newFirst.nextSibling));
		_onUpdateChild(parent.ownerDocument || parent, parent);
		if (node.nodeType == DOCUMENT_FRAGMENT_NODE) node.firstChild = node.lastChild = null;
		return node;
	}
	/**
	* Recursively updates the ownerDocument property for a node and all its descendants
	* @param {Node} node
	* @param {Document} newOwnerDocument
	* @private
	*/
	function _updateOwnerDocument(node, newOwnerDocument) {
		if (node.ownerDocument === newOwnerDocument) return;
		node.ownerDocument = newOwnerDocument;
		if (node.nodeType === ELEMENT_NODE && node.attributes) for (var i = 0; i < node.attributes.length; i++) {
			var attr = node.attributes.item(i);
			if (attr) attr.ownerDocument = newOwnerDocument;
		}
		var child = node.firstChild;
		while (child) {
			_updateOwnerDocument(child, newOwnerDocument);
			child = child.nextSibling;
		}
	}
	/**
	* Appends `newChild` to `parentNode`.
	* If `newChild` is already connected to a `parentNode` it is first removed from it.
	*
	* @see https://github.com/xmldom/xmldom/issues/135
	* @see https://github.com/xmldom/xmldom/issues/145
	* @param {Node} parentNode
	* @param {Node} newChild
	* @returns {Node}
	* @private
	*/
	function _appendSingleChild(parentNode, newChild) {
		if (newChild.parentNode) newChild.parentNode.removeChild(newChild);
		newChild.parentNode = parentNode;
		newChild.previousSibling = parentNode.lastChild;
		newChild.nextSibling = null;
		if (newChild.previousSibling) newChild.previousSibling.nextSibling = newChild;
		else parentNode.firstChild = newChild;
		parentNode.lastChild = newChild;
		_onUpdateChild(parentNode.ownerDocument, parentNode, newChild);
		_updateOwnerDocument(newChild, parentNode.ownerDocument || parentNode);
		return newChild;
	}
	Document.prototype = {
		nodeName: "#document",
		nodeType: DOCUMENT_NODE,
		/**
		* The DocumentType node of the document.
		*
		* @readonly
		* @type DocumentType
		*/
		doctype: null,
		documentElement: null,
		_inc: 1,
		insertBefore: function(newChild, refChild) {
			if (newChild.nodeType == DOCUMENT_FRAGMENT_NODE) {
				var child = newChild.firstChild;
				while (child) {
					var next = child.nextSibling;
					this.insertBefore(child, refChild);
					child = next;
				}
				return newChild;
			}
			_insertBefore(this, newChild, refChild);
			_updateOwnerDocument(newChild, this);
			if (this.documentElement === null && newChild.nodeType === ELEMENT_NODE) this.documentElement = newChild;
			return newChild;
		},
		removeChild: function(oldChild) {
			if (this.documentElement == oldChild) this.documentElement = null;
			return _removeChild(this, oldChild);
		},
		replaceChild: function(newChild, oldChild) {
			_insertBefore(this, newChild, oldChild, assertPreReplacementValidityInDocument);
			_updateOwnerDocument(newChild, this);
			if (oldChild) this.removeChild(oldChild);
			if (isElementNode(newChild)) this.documentElement = newChild;
		},
		importNode: function(importedNode, deep) {
			return importNode(this, importedNode, deep);
		},
		getElementById: function(id) {
			var rtv = null;
			_visitNode(this.documentElement, function(node) {
				if (node.nodeType == ELEMENT_NODE) {
					if (node.getAttribute("id") == id) {
						rtv = node;
						return true;
					}
				}
			});
			return rtv;
		},
		/**
		* The `getElementsByClassName` method of `Document` interface returns an array-like object
		* of all child elements which have **all** of the given class name(s).
		*
		* Returns an empty list if `classeNames` is an empty string or only contains HTML white space characters.
		*
		*
		* Warning: This is a live LiveNodeList.
		* Changes in the DOM will reflect in the array as the changes occur.
		* If an element selected by this array no longer qualifies for the selector,
		* it will automatically be removed. Be aware of this for iteration purposes.
		*
		* @param {string} classNames is a string representing the class name(s) to match; multiple class names are separated by (ASCII-)whitespace
		*
		* @see https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementsByClassName
		* @see https://dom.spec.whatwg.org/#concept-getelementsbyclassname
		*/
		getElementsByClassName: function(classNames) {
			var classNamesSet = toOrderedSet(classNames);
			return new LiveNodeList(this, function(base) {
				var ls = [];
				if (classNamesSet.length > 0) _visitNode(base.documentElement, function(node) {
					if (node !== base && node.nodeType === ELEMENT_NODE) {
						var nodeClassNames = node.getAttribute("class");
						if (nodeClassNames) {
							var matches = classNames === nodeClassNames;
							if (!matches) {
								var nodeClassNamesSet = toOrderedSet(nodeClassNames);
								matches = classNamesSet.every(arrayIncludes(nodeClassNamesSet));
							}
							if (matches) ls.push(node);
						}
					}
				});
				return ls;
			});
		},
		createElement: function(tagName) {
			var node = new Element();
			node.ownerDocument = this;
			node.nodeName = tagName;
			node.tagName = tagName;
			node.localName = tagName;
			node.childNodes = new NodeList();
			var attrs = node.attributes = new NamedNodeMap();
			attrs._ownerElement = node;
			return node;
		},
		createDocumentFragment: function() {
			var node = new DocumentFragment();
			node.ownerDocument = this;
			node.childNodes = new NodeList();
			return node;
		},
		createTextNode: function(data) {
			var node = new Text();
			node.ownerDocument = this;
			node.appendData(data);
			return node;
		},
		createComment: function(data) {
			var node = new Comment();
			node.ownerDocument = this;
			node.appendData(data);
			return node;
		},
		/**
		* Returns a new CDATASection node whose data is `data`.
		*
		* __This implementation differs from the specification:__
		* - calling this method on an HTML document does not throw `NotSupportedError`.
		*
		* @param {string} data
		* @returns {CDATASection}
		* @throws DOMException with code `INVALID_CHARACTER_ERR` if `data` contains `"]]>"`.
		* @see https://developer.mozilla.org/en-US/docs/Web/API/Document/createCDATASection
		* @see https://dom.spec.whatwg.org/#dom-document-createcdatasection
		*/
		createCDATASection: function(data) {
			if (data.indexOf("]]>") !== -1) throw new DOMException(INVALID_CHARACTER_ERR, "data contains \"]]>\"");
			var node = new CDATASection();
			node.ownerDocument = this;
			node.appendData(data);
			return node;
		},
		/**
		* Returns a ProcessingInstruction node whose target is target and data is data.
		*
		* __This implementation differs from the specification:__
		* - it does not do any input validation on the arguments and doesn't throw "InvalidCharacterError".
		*
		* Note: When the resulting document is serialized with `requireWellFormed: true`, the
		* serializer throws with code `INVALID_STATE_ERR` if `.target` is not a valid XML `NCName`
		* (a `Name` with no colon) or is an ASCII case-insensitive match for `"xml"`, or if `.data`
		* contains `?>` (W3C DOM Parsing §3.2.1.7). Without that option the target and data are
		* emitted verbatim.
		*
		* @param {string} target
		* @param {string} data
		* @returns {ProcessingInstruction}
		* @see https://developer.mozilla.org/docs/Web/API/Document/createProcessingInstruction
		* @see https://dom.spec.whatwg.org/#dom-document-createprocessinginstruction
		* @see https://www.w3.org/TR/DOM-Parsing/#dfn-concept-serialize-xml §3.2.1.7
		*/
		createProcessingInstruction: function(target, data) {
			var node = new ProcessingInstruction();
			node.ownerDocument = this;
			node.tagName = node.nodeName = node.target = target;
			node.nodeValue = node.data = data;
			return node;
		},
		createAttribute: function(name) {
			var node = new Attr();
			node.ownerDocument = this;
			node.name = name;
			node.nodeName = name;
			node.localName = name;
			node.specified = true;
			return node;
		},
		/**
		* Creates an EntityReference object, serialized as `&name;`.
		*
		* The `name` is validated against the XML `Name` production at creation time; an invalid name
		* throws a `DOMException` with code `INVALID_CHARACTER_ERR`. When the resulting node is
		* serialized with `requireWellFormed: true`, the serializer re-validates `nodeName` and throws
		* a `DOMException` with code `INVALID_STATE_ERR` if a later `nodeName` mutation made it invalid;
		* without that option the name is emitted verbatim.
		*
		* Note: xmldom does not expand entities — the parser resolves entity references inline and never
		* constructs `EntityReference` nodes, so this method is the only producer.
		*
		* @param {string} name The name of the entity to reference.
		* @returns {EntityReference}
		* @throws {DOMException} With code `INVALID_CHARACTER_ERR` when `name` is not a valid XML `Name`.
		* @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-392B75AE
		*/
		createEntityReference: function(name) {
			if (!tagNamePattern.test(name)) throw new DOMException(INVALID_CHARACTER_ERR, "not a valid xml name \"" + name + "\"");
			var node = new EntityReference();
			node.ownerDocument = this;
			node.nodeName = name;
			return node;
		},
		createElementNS: function(namespaceURI, qualifiedName) {
			var node = new Element();
			var pl = qualifiedName.split(":");
			var attrs = node.attributes = new NamedNodeMap();
			node.childNodes = new NodeList();
			node.ownerDocument = this;
			node.nodeName = qualifiedName;
			node.tagName = qualifiedName;
			node.namespaceURI = namespaceURI;
			if (pl.length == 2) {
				node.prefix = pl[0];
				node.localName = pl[1];
			} else node.localName = qualifiedName;
			attrs._ownerElement = node;
			return node;
		},
		createAttributeNS: function(namespaceURI, qualifiedName) {
			var node = new Attr();
			var pl = qualifiedName.split(":");
			node.ownerDocument = this;
			node.nodeName = qualifiedName;
			node.name = qualifiedName;
			node.namespaceURI = namespaceURI;
			node.specified = true;
			if (pl.length == 2) {
				node.prefix = pl[0];
				node.localName = pl[1];
			} else node.localName = qualifiedName;
			return node;
		}
	};
	_extends(Document, Node);
	function Element() {
		this._nsMap = {};
	}
	Element.prototype = {
		nodeType: ELEMENT_NODE,
		hasAttribute: function(name) {
			return this.getAttributeNode(name) != null;
		},
		getAttribute: function(name) {
			var attr = this.getAttributeNode(name);
			return attr && attr.value || "";
		},
		getAttributeNode: function(name) {
			return this.attributes.getNamedItem(name);
		},
		setAttribute: function(name, value) {
			var attr = this.ownerDocument.createAttribute(name);
			attr.value = attr.nodeValue = "" + value;
			this.setAttributeNode(attr);
		},
		removeAttribute: function(name) {
			var attr = this.getAttributeNode(name);
			attr && this.removeAttributeNode(attr);
		},
		appendChild: function(newChild) {
			if (newChild.nodeType === DOCUMENT_FRAGMENT_NODE) return this.insertBefore(newChild, null);
			else return _appendSingleChild(this, newChild);
		},
		setAttributeNode: function(newAttr) {
			return this.attributes.setNamedItem(newAttr);
		},
		setAttributeNodeNS: function(newAttr) {
			return this.attributes.setNamedItemNS(newAttr);
		},
		removeAttributeNode: function(oldAttr) {
			return this.attributes.removeNamedItem(oldAttr.nodeName);
		},
		removeAttributeNS: function(namespaceURI, localName) {
			var old = this.getAttributeNodeNS(namespaceURI, localName);
			old && this.removeAttributeNode(old);
		},
		hasAttributeNS: function(namespaceURI, localName) {
			return this.getAttributeNodeNS(namespaceURI, localName) != null;
		},
		getAttributeNS: function(namespaceURI, localName) {
			var attr = this.getAttributeNodeNS(namespaceURI, localName);
			return attr && attr.value || "";
		},
		setAttributeNS: function(namespaceURI, qualifiedName, value) {
			var attr = this.ownerDocument.createAttributeNS(namespaceURI, qualifiedName);
			attr.value = attr.nodeValue = "" + value;
			this.setAttributeNode(attr);
		},
		getAttributeNodeNS: function(namespaceURI, localName) {
			return this.attributes.getNamedItemNS(namespaceURI, localName);
		},
		getElementsByTagName: function(tagName) {
			return new LiveNodeList(this, function(base) {
				var ls = [];
				_visitNode(base, function(node) {
					if (node !== base && node.nodeType == ELEMENT_NODE && (tagName === "*" || node.tagName == tagName)) ls.push(node);
				});
				return ls;
			});
		},
		getElementsByTagNameNS: function(namespaceURI, localName) {
			return new LiveNodeList(this, function(base) {
				var ls = [];
				_visitNode(base, function(node) {
					if (node !== base && node.nodeType === ELEMENT_NODE && (namespaceURI === "*" || node.namespaceURI === namespaceURI) && (localName === "*" || node.localName == localName)) ls.push(node);
				});
				return ls;
			});
		}
	};
	Document.prototype.getElementsByTagName = Element.prototype.getElementsByTagName;
	Document.prototype.getElementsByTagNameNS = Element.prototype.getElementsByTagNameNS;
	_extends(Element, Node);
	function Attr() {}
	Attr.prototype.nodeType = ATTRIBUTE_NODE;
	_extends(Attr, Node);
	function CharacterData() {}
	CharacterData.prototype = {
		data: "",
		substringData: function(offset, count) {
			return this.data.substring(offset, offset + count);
		},
		appendData: function(text) {
			text = this.data + text;
			this.nodeValue = this.data = text;
			this.length = text.length;
		},
		insertData: function(offset, text) {
			this.replaceData(offset, 0, text);
		},
		appendChild: function(newChild) {
			throw new Error(ExceptionMessage[HIERARCHY_REQUEST_ERR]);
		},
		deleteData: function(offset, count) {
			this.replaceData(offset, count, "");
		},
		replaceData: function(offset, count, text) {
			var start = this.data.substring(0, offset);
			var end = this.data.substring(offset + count);
			text = start + text + end;
			this.nodeValue = this.data = text;
			this.length = text.length;
		}
	};
	_extends(CharacterData, Node);
	function Text() {}
	Text.prototype = {
		nodeName: "#text",
		nodeType: TEXT_NODE,
		splitText: function(offset) {
			var text = this.data;
			var newText = text.substring(offset);
			text = text.substring(0, offset);
			this.data = this.nodeValue = text;
			this.length = text.length;
			var newNode = this.ownerDocument.createTextNode(newText);
			if (this.parentNode) this.parentNode.insertBefore(newNode, this.nextSibling);
			return newNode;
		}
	};
	_extends(Text, CharacterData);
	function Comment() {}
	Comment.prototype = {
		nodeName: "#comment",
		nodeType: COMMENT_NODE
	};
	_extends(Comment, CharacterData);
	function CDATASection() {}
	CDATASection.prototype = {
		nodeName: "#cdata-section",
		nodeType: CDATA_SECTION_NODE
	};
	_extends(CDATASection, CharacterData);
	/**
	* Represents a DocumentType node (the `<!DOCTYPE ...>` declaration).
	*
	* `name`, `publicId`, `systemId`, and `internalSubset` are plain own-property assignments.
	* xmldom does not enforce the `readonly` constraint declared by the WHATWG DOM spec —
	* direct property writes succeed silently. Values are serialized verbatim when
	* `requireWellFormed` is false (the default). When the serializer is invoked with
	* `requireWellFormed: true` (via the 4th-parameter options object), it validates each
	* field — including `name`, which is checked against the XML `Name` production — and throws
	* `DOMException` with code `INVALID_STATE_ERR` on invalid values.
	*
	* @class
	* @see https://developer.mozilla.org/docs/Web/API/DocumentType MDN
	*/
	function DocumentType() {}
	DocumentType.prototype.nodeType = DOCUMENT_TYPE_NODE;
	_extends(DocumentType, Node);
	function Notation() {}
	Notation.prototype.nodeType = NOTATION_NODE;
	_extends(Notation, Node);
	function Entity() {}
	Entity.prototype.nodeType = ENTITY_NODE;
	_extends(Entity, Node);
	/**
	* Represents an EntityReference node, serialized as `&nodeName;`.
	*
	* `nodeName` is the referenced entity's name, stored verbatim. When serialized with
	* `requireWellFormed: true`, the serializer validates `nodeName` against the XML `Name` production
	* and throws a `DOMException` with code `INVALID_STATE_ERR` if it does not match; without that
	* option the name is emitted verbatim between `&` and `;`.
	*
	* Note: xmldom does not expand entities — the parser resolves entity references inline and never
	* constructs `EntityReference` nodes, so the only producer is `Document.createEntityReference`.
	*
	* @class
	* @see https://www.w3.org/TR/xml/#NT-Name
	*/
	function EntityReference() {}
	EntityReference.prototype.nodeType = ENTITY_REFERENCE_NODE;
	_extends(EntityReference, Node);
	function DocumentFragment() {}
	DocumentFragment.prototype.nodeName = "#document-fragment";
	DocumentFragment.prototype.nodeType = DOCUMENT_FRAGMENT_NODE;
	_extends(DocumentFragment, Node);
	function ProcessingInstruction() {}
	ProcessingInstruction.prototype.nodeType = PROCESSING_INSTRUCTION_NODE;
	_extends(ProcessingInstruction, Node);
	function XMLSerializer() {}
	/**
	* Returns the result of serializing `node` to XML.
	*
	* When `options.requireWellFormed` is `true`, the serializer throws for content that would
	* produce ill-formed XML.
	*
	* __This implementation differs from the specification:__
	* - CDATASection nodes whose data contains `]]>` are serialized by splitting the section
	*   at each `]]>` occurrence (following W3C DOM Level 3 Core `split-cdata-sections`
	*   default behaviour) unless `requireWellFormed` is `true`.
	* - when `requireWellFormed` is `true`, `DOMException` with code `INVALID_STATE_ERR`
	*   is only thrown to prevent injection vectors, not for all the spec mandated checks.
	*
	* @param {Node} node
	* @param {boolean} [isHtml]
	* @param {function} [nodeFilter]
	* @param {Object} [options]
	* @param {boolean} [options.requireWellFormed=false]
	* When `true`, throws for content that would produce ill-formed XML.
	* @returns {string}
	* @throws {DOMException}
	* With code `INVALID_STATE_ERR` when `requireWellFormed` is `true` and:
	* - an Element's qualified name (including any namespace prefix) is not a valid XML QName,
	* - an attribute's qualified name (including a synthesized `xmlns:` namespace declaration) is
	*   not a valid XML QName,
	* - a CDATASection node's data contains `"]]>"`,
	* - a Comment node's data contains `"-->"` (bare `"--"` does not throw on this branch),
	* - a ProcessingInstruction's target is not a valid XML `NCName` (a `Name` with no colon) or is
	*   an ASCII case-insensitive match for `"xml"`, or its data contains `"?>"`,
	* - a DocumentType's `name` is not a valid XML `Name` (XML 1.0 production [5]),
	* - a DocumentType's `publicId` is non-empty and does not match the XML `PubidLiteral`
	*   production,
	* - a DocumentType's `systemId` is non-empty and does not match the XML `SystemLiteral`
	*   production,
	* - a DocumentType's `internalSubset` contains `"]>"`, or
	* - an EntityReference's `nodeName` is not a valid XML `Name` (XML 1.0 production [5]).
	* Note: xmldom does not enforce `readonly` on DocumentType fields — direct property
	* writes succeed and are covered by the serializer-level checks above.
	* @see https://html.spec.whatwg.org/#dom-xmlserializer-serializetostring
	* @see https://w3c.github.io/DOM-Parsing/#xml-serialization
	* @see https://github.com/w3c/DOM-Parsing/issues/84
	*/
	XMLSerializer.prototype.serializeToString = function(node, isHtml, nodeFilter, options) {
		return nodeSerializeToString.call(node, isHtml, nodeFilter, options);
	};
	Node.prototype.toString = nodeSerializeToString;
	function nodeSerializeToString(isHtml, nodeFilter, options) {
		var requireWellFormed = !!options && !!options.requireWellFormed;
		var buf = [];
		var refNode = this.nodeType == 9 && this.documentElement || this;
		var prefix = refNode.prefix;
		var uri = refNode.namespaceURI;
		if (uri && prefix == null) {
			var prefix = refNode.lookupPrefix(uri);
			if (prefix == null) var visibleNamespaces = [{
				namespace: uri,
				prefix: null
			}];
		}
		serializeToString(this, buf, isHtml, nodeFilter, visibleNamespaces, requireWellFormed);
		return buf.join("");
	}
	function needNamespaceDefine(node, isHTML, visibleNamespaces) {
		var prefix = node.prefix || "";
		var uri = node.namespaceURI;
		if (!uri) return false;
		if (prefix === "xml" && uri === NAMESPACE.XML || uri === NAMESPACE.XMLNS) return false;
		var i = visibleNamespaces.length;
		while (i--) {
			var ns = visibleNamespaces[i];
			if (ns.prefix === prefix) return ns.namespace !== uri;
		}
		return true;
	}
	/**
	* Well-formed constraint: No < in Attribute Values
	* > The replacement text of any entity referred to directly or indirectly
	* > in an attribute value must not contain a <.
	* @see https://www.w3.org/TR/xml11/#CleanAttrVals
	* @see https://www.w3.org/TR/xml11/#NT-AttValue
	*
	* Literal whitespace other than space that appear in attribute values
	* are serialized as their entity references, so they will be preserved.
	* (In contrast to whitespace literals in the input which are normalized to spaces)
	* @see https://www.w3.org/TR/xml11/#AVNormalize
	* @see https://w3c.github.io/DOM-Parsing/#serializing-an-element-s-attributes
	*/
	function addSerializedAttribute(buf, qualifiedName, value, requireWellFormed) {
		if (requireWellFormed && !tagNamePattern.test(qualifiedName)) throw new DOMException(INVALID_STATE_ERR, "The attribute name \"" + qualifiedName + "\" is not a valid XML QName");
		buf.push(" ", qualifiedName, "=\"", value.replace(/[<>&"\t\n\r]/g, _xmlEncoder), "\"");
	}
	function serializeToString(node, buf, isHTML, nodeFilter, visibleNamespaces, requireWellFormed) {
		if (!visibleNamespaces) visibleNamespaces = [];
		walkDOM(node, {
			ns: visibleNamespaces,
			isHTML
		}, {
			enter: function(n, ctx) {
				var ns = ctx.ns;
				var html = ctx.isHTML;
				if (nodeFilter) {
					n = nodeFilter(n);
					if (n) {
						if (typeof n == "string") {
							buf.push(n);
							return null;
						}
					} else return null;
				}
				switch (n.nodeType) {
					case ELEMENT_NODE:
						var attrs = n.attributes;
						var len = attrs.length;
						var nodeName = n.tagName;
						html = NAMESPACE.isHTML(n.namespaceURI) || html;
						var prefixedNodeName = nodeName;
						if (!html && !n.prefix && n.namespaceURI) {
							var defaultNS;
							for (var ai = 0; ai < attrs.length; ai++) if (attrs.item(ai).name === "xmlns") {
								defaultNS = attrs.item(ai).value;
								break;
							}
							if (!defaultNS) for (var nsi = ns.length - 1; nsi >= 0; nsi--) {
								var nsEntry = ns[nsi];
								if (nsEntry.prefix === "" && nsEntry.namespace === n.namespaceURI) {
									defaultNS = nsEntry.namespace;
									break;
								}
							}
							if (defaultNS !== n.namespaceURI) for (var nsi = ns.length - 1; nsi >= 0; nsi--) {
								var nsEntry = ns[nsi];
								if (nsEntry.namespace === n.namespaceURI) {
									if (nsEntry.prefix) prefixedNodeName = nsEntry.prefix + ":" + nodeName;
									break;
								}
							}
						}
						if (requireWellFormed && !tagNamePattern.test(prefixedNodeName)) throw new DOMException(INVALID_STATE_ERR, "The element name \"" + prefixedNodeName + "\" is not a valid XML QName");
						buf.push("<", prefixedNodeName);
						var childNs = ns.slice();
						for (var i = 0; i < len; i++) {
							var attr = attrs.item(i);
							if (attr.prefix == "xmlns") childNs.push({
								prefix: attr.localName,
								namespace: attr.value
							});
							else if (attr.nodeName == "xmlns") childNs.push({
								prefix: "",
								namespace: attr.value
							});
						}
						for (var i = 0; i < len; i++) {
							var attr = attrs.item(i);
							if (needNamespaceDefine(attr, html, childNs)) {
								var attrPrefix = attr.prefix || "";
								var uri = attr.namespaceURI;
								addSerializedAttribute(buf, attrPrefix ? "xmlns:" + attrPrefix : "xmlns", uri, requireWellFormed);
								childNs.push({
									prefix: attrPrefix,
									namespace: uri
								});
							}
							var filteredAttr = nodeFilter ? nodeFilter(attr) : attr;
							if (filteredAttr) {
								if (typeof filteredAttr === "string") buf.push(filteredAttr);
								else addSerializedAttribute(buf, filteredAttr.name, filteredAttr.value, requireWellFormed);
							}
						}
						if (nodeName === prefixedNodeName && needNamespaceDefine(n, html, childNs)) {
							var nodePrefix = n.prefix || "";
							var uri = n.namespaceURI;
							addSerializedAttribute(buf, nodePrefix ? "xmlns:" + nodePrefix : "xmlns", uri, requireWellFormed);
							childNs.push({
								prefix: nodePrefix,
								namespace: uri
							});
						}
						var child = n.firstChild;
						if (child || html && !/^(?:meta|link|img|br|hr|input)$/i.test(nodeName)) {
							buf.push(">");
							if (html && /^script$/i.test(nodeName)) {
								while (child) {
									if (child.data) buf.push(child.data);
									else serializeToString(child, buf, html, nodeFilter, childNs.slice(), requireWellFormed);
									child = child.nextSibling;
								}
								buf.push("</", nodeName, ">");
								return null;
							}
							return {
								ns: childNs,
								isHTML: html,
								tag: prefixedNodeName
							};
						} else {
							buf.push("/>");
							return null;
						}
					case DOCUMENT_NODE:
					case DOCUMENT_FRAGMENT_NODE: return {
						ns: ns.slice(),
						isHTML: html,
						tag: null
					};
					case ATTRIBUTE_NODE:
						addSerializedAttribute(buf, n.name, n.value, requireWellFormed);
						return null;
					case TEXT_NODE:
						/**
						* The ampersand character (&) and the left angle bracket (<) must not appear in their literal form,
						* except when used as markup delimiters, or within a comment, a processing instruction, or a CDATA section.
						* If they are needed elsewhere, they must be escaped using either numeric character references or the strings
						* `&amp;` and `&lt;` respectively.
						* The right angle bracket (>) may be represented using the string " &gt; ", and must, for compatibility,
						* be escaped using either `&gt;` or a character reference when it appears in the string `]]>` in content,
						* when that string is not marking the end of a CDATA section.
						*
						* In the content of elements, character data is any string of characters
						* which does not contain the start-delimiter of any markup
						* and does not include the CDATA-section-close delimiter, `]]>`.
						*
						* @see https://www.w3.org/TR/xml/#NT-CharData
						* @see https://w3c.github.io/DOM-Parsing/#xml-serializing-a-text-node
						*/
						buf.push(n.data.replace(/[<&>]/g, _xmlEncoder));
						return null;
					case CDATA_SECTION_NODE:
						if (requireWellFormed && n.data.indexOf("]]>") !== -1) throw new DOMException(INVALID_STATE_ERR, "The CDATASection data contains \"]]>\"");
						buf.push("<![CDATA[", n.data.replace(/]]>/g, "]]]]><![CDATA[>"), "]]>");
						return null;
					case COMMENT_NODE:
						if (requireWellFormed && n.data.indexOf("-->") !== -1) throw new DOMException(INVALID_STATE_ERR, "The comment node data contains \"-->\"");
						buf.push("<!--", n.data, "-->");
						return null;
					case DOCUMENT_TYPE_NODE:
						if (requireWellFormed) {
							if (!tagNamePattern.test(n.name)) throw new DOMException(INVALID_STATE_ERR, "The doctype name \"" + n.name + "\" is not a valid XML Name");
							if (n.publicId && !/^("[\x20\r\na-zA-Z0-9\-()+,.\/:=?;!*#@$_%']*"|'[\x20\r\na-zA-Z0-9\-()+,.\/:=?;!*#@$_%'"]*')$/.test(n.publicId)) throw new DOMException(INVALID_STATE_ERR, "DocumentType publicId is not a valid PubidLiteral");
							if (n.systemId && !/^("[^"]*"|'[^']*')$/.test(n.systemId)) throw new DOMException(INVALID_STATE_ERR, "DocumentType systemId is not a valid SystemLiteral");
							if (n.internalSubset && n.internalSubset.indexOf("]>") !== -1) throw new DOMException(INVALID_STATE_ERR, "DocumentType internalSubset contains \"]>\"");
						}
						var pubid = n.publicId;
						var sysid = n.systemId;
						buf.push("<!DOCTYPE ", n.name);
						if (pubid) {
							buf.push(" PUBLIC ", pubid);
							if (sysid && sysid != ".") buf.push(" ", sysid);
							buf.push(">");
						} else if (sysid && sysid != ".") buf.push(" SYSTEM ", sysid, ">");
						else {
							var sub = n.internalSubset;
							if (sub) buf.push(" [", sub, "]");
							buf.push(">");
						}
						return null;
					case PROCESSING_INSTRUCTION_NODE:
						if (requireWellFormed) {
							if (!tagNamePattern.test(n.target) || n.target.indexOf(":") !== -1 || n.target.toLowerCase() === "xml") throw new DOMException(INVALID_STATE_ERR, "The processing instruction target \"" + n.target + "\" is not a valid XML NCName or is reserved");
							if (n.data.indexOf("?>") !== -1) throw new DOMException(INVALID_STATE_ERR, "The ProcessingInstruction data contains \"?>\"");
						}
						buf.push("<?", n.target, " ", n.data, "?>");
						return null;
					case ENTITY_REFERENCE_NODE:
						if (requireWellFormed && !tagNamePattern.test(n.nodeName)) throw new DOMException(INVALID_STATE_ERR, "The entity reference name \"" + n.nodeName + "\" is not a valid XML Name");
						buf.push("&", n.nodeName, ";");
						return null;
					default:
						buf.push("??", n.nodeName);
						return null;
				}
			},
			exit: function(n, childCtx) {
				if (childCtx && childCtx.tag) buf.push("</", childCtx.tag, ">");
			}
		});
	}
	/**
	* Imports a node from a different document into `doc`, creating a new copy.
	* Delegates to {@link walkDOM} for traversal. Each node in the subtree is shallow-cloned,
	* stamped with `doc` as its `ownerDocument`, and detached (`parentNode` set to `null`).
	* Children are imported recursively when `deep` is `true`; for {@link Attr} nodes `deep` is
	* always forced to `true`
	* because an attribute's value lives in a child text node.
	*
	* @param {Document} doc
	* The document that will own the imported node.
	* @param {Node} node
	* The node to import.
	* @param {boolean} deep
	* If `true`, descendants are imported recursively.
	* @returns {Node}
	* The newly imported node, now owned by `doc`.
	*/
	function importNode(doc, node, deep) {
		var destRoot;
		walkDOM(node, null, { enter: function(srcNode, destParent) {
			var destNode = srcNode.cloneNode(false);
			destNode.ownerDocument = doc;
			destNode.parentNode = null;
			if (destParent === null) destRoot = destNode;
			else destParent.appendChild(destNode);
			return srcNode.nodeType === ATTRIBUTE_NODE || deep ? destNode : null;
		} });
		return destRoot;
	}
	function cloneNode(doc, node, deep) {
		var destRoot;
		walkDOM(node, null, { enter: function(srcNode, destParent) {
			var destNode = new srcNode.constructor();
			for (var n in srcNode) if (Object.prototype.hasOwnProperty.call(srcNode, n)) {
				var v = srcNode[n];
				if (typeof v != "object") {
					if (v != destNode[n]) destNode[n] = v;
				}
			}
			if (srcNode.childNodes) destNode.childNodes = new NodeList();
			destNode.ownerDocument = doc;
			var shouldDeep = deep;
			switch (destNode.nodeType) {
				case ELEMENT_NODE:
					var attrs = srcNode.attributes;
					var attrs2 = destNode.attributes = new NamedNodeMap();
					var len = attrs.length;
					attrs2._ownerElement = destNode;
					for (var i = 0; i < len; i++) destNode.setAttributeNode(cloneNode(doc, attrs.item(i), true));
					break;
				case ATTRIBUTE_NODE: shouldDeep = true;
			}
			if (destParent !== null) destParent.appendChild(destNode);
			else destRoot = destNode;
			return shouldDeep ? destNode : null;
		} });
		return destRoot;
	}
	function __set__(object, key, value) {
		object[key] = value;
	}
	try {
		if (Object.defineProperty) {
			Object.defineProperty(LiveNodeList.prototype, "length", { get: function() {
				_updateLiveList(this);
				return this.$$length;
			} });
			/**
			* The text content of this node and its descendants.
			*
			* Setting `textContent` on an element or document fragment replaces all child nodes with a
			* single text node; on other nodes it sets `data`, `value`, and `nodeValue` directly.
			*
			* @type {string | null}
			* @see {@link https://dom.spec.whatwg.org/#dom-node-textcontent}
			*/
			Object.defineProperty(Node.prototype, "textContent", {
				get: function() {
					if (this.nodeType === ELEMENT_NODE || this.nodeType === DOCUMENT_FRAGMENT_NODE) {
						var buf = [];
						walkDOM(this, null, { enter: function(n) {
							if (n.nodeType === ELEMENT_NODE || n.nodeType === DOCUMENT_FRAGMENT_NODE) return true;
							if (n.nodeType === PROCESSING_INSTRUCTION_NODE || n.nodeType === COMMENT_NODE) return null;
							buf.push(n.nodeValue);
						} });
						return buf.join("");
					}
					return this.nodeValue;
				},
				set: function(data) {
					switch (this.nodeType) {
						case ELEMENT_NODE:
						case DOCUMENT_FRAGMENT_NODE:
							while (this.firstChild) this.removeChild(this.firstChild);
							if (data || String(data)) this.appendChild(this.ownerDocument.createTextNode(data));
							break;
						default:
							this.data = data;
							this.value = data;
							this.nodeValue = data;
					}
				}
			});
			__set__ = function(object, key, value) {
				object["$$" + key] = value;
			};
		}
	} catch (e) {}
	exports.DocumentType = DocumentType;
	exports.DOMException = DOMException;
	exports.DOMImplementation = DOMImplementation;
	exports.Element = Element;
	exports.Node = Node;
	exports.NodeList = NodeList;
	exports.walkDOM = walkDOM;
	exports.XMLSerializer = XMLSerializer;
}));
//#endregion
//#region node_modules/@xmldom/xmldom/lib/entities.js
var require_entities = /* @__PURE__ */ __commonJSMin(((exports) => {
	var freeze = require_conventions().freeze;
	/**
	* The entities that are predefined in every XML document.
	*
	* @see https://www.w3.org/TR/2006/REC-xml11-20060816/#sec-predefined-ent W3C XML 1.1
	* @see https://www.w3.org/TR/2008/REC-xml-20081126/#sec-predefined-ent W3C XML 1.0
	* @see https://en.wikipedia.org/wiki/List_of_XML_and_HTML_character_entity_references#Predefined_entities_in_XML Wikipedia
	*/
	exports.XML_ENTITIES = freeze({
		amp: "&",
		apos: "'",
		gt: ">",
		lt: "<",
		quot: "\""
	});
	/**
	* A map of all entities that are detected in an HTML document.
	* They contain all entries from `XML_ENTITIES`.
	*
	* @see XML_ENTITIES
	* @see DOMParser.parseFromString
	* @see DOMImplementation.prototype.createHTMLDocument
	* @see https://html.spec.whatwg.org/#named-character-references WHATWG HTML(5) Spec
	* @see https://html.spec.whatwg.org/entities.json JSON
	* @see https://www.w3.org/TR/xml-entity-names/ W3C XML Entity Names
	* @see https://www.w3.org/TR/html4/sgml/entities.html W3C HTML4/SGML
	* @see https://en.wikipedia.org/wiki/List_of_XML_and_HTML_character_entity_references#Character_entity_references_in_HTML Wikipedia (HTML)
	* @see https://en.wikipedia.org/wiki/List_of_XML_and_HTML_character_entity_references#Entities_representing_special_characters_in_XHTML Wikpedia (XHTML)
	*/
	exports.HTML_ENTITIES = freeze({
		Aacute: "Á",
		aacute: "á",
		Abreve: "Ă",
		abreve: "ă",
		ac: "∾",
		acd: "∿",
		acE: "∾̳",
		Acirc: "Â",
		acirc: "â",
		acute: "´",
		Acy: "А",
		acy: "а",
		AElig: "Æ",
		aelig: "æ",
		af: "⁡",
		Afr: "𝔄",
		afr: "𝔞",
		Agrave: "À",
		agrave: "à",
		alefsym: "ℵ",
		aleph: "ℵ",
		Alpha: "Α",
		alpha: "α",
		Amacr: "Ā",
		amacr: "ā",
		amalg: "⨿",
		AMP: "&",
		amp: "&",
		And: "⩓",
		and: "∧",
		andand: "⩕",
		andd: "⩜",
		andslope: "⩘",
		andv: "⩚",
		ang: "∠",
		ange: "⦤",
		angle: "∠",
		angmsd: "∡",
		angmsdaa: "⦨",
		angmsdab: "⦩",
		angmsdac: "⦪",
		angmsdad: "⦫",
		angmsdae: "⦬",
		angmsdaf: "⦭",
		angmsdag: "⦮",
		angmsdah: "⦯",
		angrt: "∟",
		angrtvb: "⊾",
		angrtvbd: "⦝",
		angsph: "∢",
		angst: "Å",
		angzarr: "⍼",
		Aogon: "Ą",
		aogon: "ą",
		Aopf: "𝔸",
		aopf: "𝕒",
		ap: "≈",
		apacir: "⩯",
		apE: "⩰",
		ape: "≊",
		apid: "≋",
		apos: "'",
		ApplyFunction: "⁡",
		approx: "≈",
		approxeq: "≊",
		Aring: "Å",
		aring: "å",
		Ascr: "𝒜",
		ascr: "𝒶",
		Assign: "≔",
		ast: "*",
		asymp: "≈",
		asympeq: "≍",
		Atilde: "Ã",
		atilde: "ã",
		Auml: "Ä",
		auml: "ä",
		awconint: "∳",
		awint: "⨑",
		backcong: "≌",
		backepsilon: "϶",
		backprime: "‵",
		backsim: "∽",
		backsimeq: "⋍",
		Backslash: "∖",
		Barv: "⫧",
		barvee: "⊽",
		Barwed: "⌆",
		barwed: "⌅",
		barwedge: "⌅",
		bbrk: "⎵",
		bbrktbrk: "⎶",
		bcong: "≌",
		Bcy: "Б",
		bcy: "б",
		bdquo: "„",
		becaus: "∵",
		Because: "∵",
		because: "∵",
		bemptyv: "⦰",
		bepsi: "϶",
		bernou: "ℬ",
		Bernoullis: "ℬ",
		Beta: "Β",
		beta: "β",
		beth: "ℶ",
		between: "≬",
		Bfr: "𝔅",
		bfr: "𝔟",
		bigcap: "⋂",
		bigcirc: "◯",
		bigcup: "⋃",
		bigodot: "⨀",
		bigoplus: "⨁",
		bigotimes: "⨂",
		bigsqcup: "⨆",
		bigstar: "★",
		bigtriangledown: "▽",
		bigtriangleup: "△",
		biguplus: "⨄",
		bigvee: "⋁",
		bigwedge: "⋀",
		bkarow: "⤍",
		blacklozenge: "⧫",
		blacksquare: "▪",
		blacktriangle: "▴",
		blacktriangledown: "▾",
		blacktriangleleft: "◂",
		blacktriangleright: "▸",
		blank: "␣",
		blk12: "▒",
		blk14: "░",
		blk34: "▓",
		block: "█",
		bne: "=⃥",
		bnequiv: "≡⃥",
		bNot: "⫭",
		bnot: "⌐",
		Bopf: "𝔹",
		bopf: "𝕓",
		bot: "⊥",
		bottom: "⊥",
		bowtie: "⋈",
		boxbox: "⧉",
		boxDL: "╗",
		boxDl: "╖",
		boxdL: "╕",
		boxdl: "┐",
		boxDR: "╔",
		boxDr: "╓",
		boxdR: "╒",
		boxdr: "┌",
		boxH: "═",
		boxh: "─",
		boxHD: "╦",
		boxHd: "╤",
		boxhD: "╥",
		boxhd: "┬",
		boxHU: "╩",
		boxHu: "╧",
		boxhU: "╨",
		boxhu: "┴",
		boxminus: "⊟",
		boxplus: "⊞",
		boxtimes: "⊠",
		boxUL: "╝",
		boxUl: "╜",
		boxuL: "╛",
		boxul: "┘",
		boxUR: "╚",
		boxUr: "╙",
		boxuR: "╘",
		boxur: "└",
		boxV: "║",
		boxv: "│",
		boxVH: "╬",
		boxVh: "╫",
		boxvH: "╪",
		boxvh: "┼",
		boxVL: "╣",
		boxVl: "╢",
		boxvL: "╡",
		boxvl: "┤",
		boxVR: "╠",
		boxVr: "╟",
		boxvR: "╞",
		boxvr: "├",
		bprime: "‵",
		Breve: "˘",
		breve: "˘",
		brvbar: "¦",
		Bscr: "ℬ",
		bscr: "𝒷",
		bsemi: "⁏",
		bsim: "∽",
		bsime: "⋍",
		bsol: "\\",
		bsolb: "⧅",
		bsolhsub: "⟈",
		bull: "•",
		bullet: "•",
		bump: "≎",
		bumpE: "⪮",
		bumpe: "≏",
		Bumpeq: "≎",
		bumpeq: "≏",
		Cacute: "Ć",
		cacute: "ć",
		Cap: "⋒",
		cap: "∩",
		capand: "⩄",
		capbrcup: "⩉",
		capcap: "⩋",
		capcup: "⩇",
		capdot: "⩀",
		CapitalDifferentialD: "ⅅ",
		caps: "∩︀",
		caret: "⁁",
		caron: "ˇ",
		Cayleys: "ℭ",
		ccaps: "⩍",
		Ccaron: "Č",
		ccaron: "č",
		Ccedil: "Ç",
		ccedil: "ç",
		Ccirc: "Ĉ",
		ccirc: "ĉ",
		Cconint: "∰",
		ccups: "⩌",
		ccupssm: "⩐",
		Cdot: "Ċ",
		cdot: "ċ",
		cedil: "¸",
		Cedilla: "¸",
		cemptyv: "⦲",
		cent: "¢",
		CenterDot: "·",
		centerdot: "·",
		Cfr: "ℭ",
		cfr: "𝔠",
		CHcy: "Ч",
		chcy: "ч",
		check: "✓",
		checkmark: "✓",
		Chi: "Χ",
		chi: "χ",
		cir: "○",
		circ: "ˆ",
		circeq: "≗",
		circlearrowleft: "↺",
		circlearrowright: "↻",
		circledast: "⊛",
		circledcirc: "⊚",
		circleddash: "⊝",
		CircleDot: "⊙",
		circledR: "®",
		circledS: "Ⓢ",
		CircleMinus: "⊖",
		CirclePlus: "⊕",
		CircleTimes: "⊗",
		cirE: "⧃",
		cire: "≗",
		cirfnint: "⨐",
		cirmid: "⫯",
		cirscir: "⧂",
		ClockwiseContourIntegral: "∲",
		CloseCurlyDoubleQuote: "”",
		CloseCurlyQuote: "’",
		clubs: "♣",
		clubsuit: "♣",
		Colon: "∷",
		colon: ":",
		Colone: "⩴",
		colone: "≔",
		coloneq: "≔",
		comma: ",",
		commat: "@",
		comp: "∁",
		compfn: "∘",
		complement: "∁",
		complexes: "ℂ",
		cong: "≅",
		congdot: "⩭",
		Congruent: "≡",
		Conint: "∯",
		conint: "∮",
		ContourIntegral: "∮",
		Copf: "ℂ",
		copf: "𝕔",
		coprod: "∐",
		Coproduct: "∐",
		COPY: "©",
		copy: "©",
		copysr: "℗",
		CounterClockwiseContourIntegral: "∳",
		crarr: "↵",
		Cross: "⨯",
		cross: "✗",
		Cscr: "𝒞",
		cscr: "𝒸",
		csub: "⫏",
		csube: "⫑",
		csup: "⫐",
		csupe: "⫒",
		ctdot: "⋯",
		cudarrl: "⤸",
		cudarrr: "⤵",
		cuepr: "⋞",
		cuesc: "⋟",
		cularr: "↶",
		cularrp: "⤽",
		Cup: "⋓",
		cup: "∪",
		cupbrcap: "⩈",
		CupCap: "≍",
		cupcap: "⩆",
		cupcup: "⩊",
		cupdot: "⊍",
		cupor: "⩅",
		cups: "∪︀",
		curarr: "↷",
		curarrm: "⤼",
		curlyeqprec: "⋞",
		curlyeqsucc: "⋟",
		curlyvee: "⋎",
		curlywedge: "⋏",
		curren: "¤",
		curvearrowleft: "↶",
		curvearrowright: "↷",
		cuvee: "⋎",
		cuwed: "⋏",
		cwconint: "∲",
		cwint: "∱",
		cylcty: "⌭",
		Dagger: "‡",
		dagger: "†",
		daleth: "ℸ",
		Darr: "↡",
		dArr: "⇓",
		darr: "↓",
		dash: "‐",
		Dashv: "⫤",
		dashv: "⊣",
		dbkarow: "⤏",
		dblac: "˝",
		Dcaron: "Ď",
		dcaron: "ď",
		Dcy: "Д",
		dcy: "д",
		DD: "ⅅ",
		dd: "ⅆ",
		ddagger: "‡",
		ddarr: "⇊",
		DDotrahd: "⤑",
		ddotseq: "⩷",
		deg: "°",
		Del: "∇",
		Delta: "Δ",
		delta: "δ",
		demptyv: "⦱",
		dfisht: "⥿",
		Dfr: "𝔇",
		dfr: "𝔡",
		dHar: "⥥",
		dharl: "⇃",
		dharr: "⇂",
		DiacriticalAcute: "´",
		DiacriticalDot: "˙",
		DiacriticalDoubleAcute: "˝",
		DiacriticalGrave: "`",
		DiacriticalTilde: "˜",
		diam: "⋄",
		Diamond: "⋄",
		diamond: "⋄",
		diamondsuit: "♦",
		diams: "♦",
		die: "¨",
		DifferentialD: "ⅆ",
		digamma: "ϝ",
		disin: "⋲",
		div: "÷",
		divide: "÷",
		divideontimes: "⋇",
		divonx: "⋇",
		DJcy: "Ђ",
		djcy: "ђ",
		dlcorn: "⌞",
		dlcrop: "⌍",
		dollar: "$",
		Dopf: "𝔻",
		dopf: "𝕕",
		Dot: "¨",
		dot: "˙",
		DotDot: "⃜",
		doteq: "≐",
		doteqdot: "≑",
		DotEqual: "≐",
		dotminus: "∸",
		dotplus: "∔",
		dotsquare: "⊡",
		doublebarwedge: "⌆",
		DoubleContourIntegral: "∯",
		DoubleDot: "¨",
		DoubleDownArrow: "⇓",
		DoubleLeftArrow: "⇐",
		DoubleLeftRightArrow: "⇔",
		DoubleLeftTee: "⫤",
		DoubleLongLeftArrow: "⟸",
		DoubleLongLeftRightArrow: "⟺",
		DoubleLongRightArrow: "⟹",
		DoubleRightArrow: "⇒",
		DoubleRightTee: "⊨",
		DoubleUpArrow: "⇑",
		DoubleUpDownArrow: "⇕",
		DoubleVerticalBar: "∥",
		DownArrow: "↓",
		Downarrow: "⇓",
		downarrow: "↓",
		DownArrowBar: "⤓",
		DownArrowUpArrow: "⇵",
		DownBreve: "̑",
		downdownarrows: "⇊",
		downharpoonleft: "⇃",
		downharpoonright: "⇂",
		DownLeftRightVector: "⥐",
		DownLeftTeeVector: "⥞",
		DownLeftVector: "↽",
		DownLeftVectorBar: "⥖",
		DownRightTeeVector: "⥟",
		DownRightVector: "⇁",
		DownRightVectorBar: "⥗",
		DownTee: "⊤",
		DownTeeArrow: "↧",
		drbkarow: "⤐",
		drcorn: "⌟",
		drcrop: "⌌",
		Dscr: "𝒟",
		dscr: "𝒹",
		DScy: "Ѕ",
		dscy: "ѕ",
		dsol: "⧶",
		Dstrok: "Đ",
		dstrok: "đ",
		dtdot: "⋱",
		dtri: "▿",
		dtrif: "▾",
		duarr: "⇵",
		duhar: "⥯",
		dwangle: "⦦",
		DZcy: "Џ",
		dzcy: "џ",
		dzigrarr: "⟿",
		Eacute: "É",
		eacute: "é",
		easter: "⩮",
		Ecaron: "Ě",
		ecaron: "ě",
		ecir: "≖",
		Ecirc: "Ê",
		ecirc: "ê",
		ecolon: "≕",
		Ecy: "Э",
		ecy: "э",
		eDDot: "⩷",
		Edot: "Ė",
		eDot: "≑",
		edot: "ė",
		ee: "ⅇ",
		efDot: "≒",
		Efr: "𝔈",
		efr: "𝔢",
		eg: "⪚",
		Egrave: "È",
		egrave: "è",
		egs: "⪖",
		egsdot: "⪘",
		el: "⪙",
		Element: "∈",
		elinters: "⏧",
		ell: "ℓ",
		els: "⪕",
		elsdot: "⪗",
		Emacr: "Ē",
		emacr: "ē",
		empty: "∅",
		emptyset: "∅",
		EmptySmallSquare: "◻",
		emptyv: "∅",
		EmptyVerySmallSquare: "▫",
		emsp: " ",
		emsp13: " ",
		emsp14: " ",
		ENG: "Ŋ",
		eng: "ŋ",
		ensp: " ",
		Eogon: "Ę",
		eogon: "ę",
		Eopf: "𝔼",
		eopf: "𝕖",
		epar: "⋕",
		eparsl: "⧣",
		eplus: "⩱",
		epsi: "ε",
		Epsilon: "Ε",
		epsilon: "ε",
		epsiv: "ϵ",
		eqcirc: "≖",
		eqcolon: "≕",
		eqsim: "≂",
		eqslantgtr: "⪖",
		eqslantless: "⪕",
		Equal: "⩵",
		equals: "=",
		EqualTilde: "≂",
		equest: "≟",
		Equilibrium: "⇌",
		equiv: "≡",
		equivDD: "⩸",
		eqvparsl: "⧥",
		erarr: "⥱",
		erDot: "≓",
		Escr: "ℰ",
		escr: "ℯ",
		esdot: "≐",
		Esim: "⩳",
		esim: "≂",
		Eta: "Η",
		eta: "η",
		ETH: "Ð",
		eth: "ð",
		Euml: "Ë",
		euml: "ë",
		euro: "€",
		excl: "!",
		exist: "∃",
		Exists: "∃",
		expectation: "ℰ",
		ExponentialE: "ⅇ",
		exponentiale: "ⅇ",
		fallingdotseq: "≒",
		Fcy: "Ф",
		fcy: "ф",
		female: "♀",
		ffilig: "ﬃ",
		fflig: "ﬀ",
		ffllig: "ﬄ",
		Ffr: "𝔉",
		ffr: "𝔣",
		filig: "ﬁ",
		FilledSmallSquare: "◼",
		FilledVerySmallSquare: "▪",
		fjlig: "fj",
		flat: "♭",
		fllig: "ﬂ",
		fltns: "▱",
		fnof: "ƒ",
		Fopf: "𝔽",
		fopf: "𝕗",
		ForAll: "∀",
		forall: "∀",
		fork: "⋔",
		forkv: "⫙",
		Fouriertrf: "ℱ",
		fpartint: "⨍",
		frac12: "½",
		frac13: "⅓",
		frac14: "¼",
		frac15: "⅕",
		frac16: "⅙",
		frac18: "⅛",
		frac23: "⅔",
		frac25: "⅖",
		frac34: "¾",
		frac35: "⅗",
		frac38: "⅜",
		frac45: "⅘",
		frac56: "⅚",
		frac58: "⅝",
		frac78: "⅞",
		frasl: "⁄",
		frown: "⌢",
		Fscr: "ℱ",
		fscr: "𝒻",
		gacute: "ǵ",
		Gamma: "Γ",
		gamma: "γ",
		Gammad: "Ϝ",
		gammad: "ϝ",
		gap: "⪆",
		Gbreve: "Ğ",
		gbreve: "ğ",
		Gcedil: "Ģ",
		Gcirc: "Ĝ",
		gcirc: "ĝ",
		Gcy: "Г",
		gcy: "г",
		Gdot: "Ġ",
		gdot: "ġ",
		gE: "≧",
		ge: "≥",
		gEl: "⪌",
		gel: "⋛",
		geq: "≥",
		geqq: "≧",
		geqslant: "⩾",
		ges: "⩾",
		gescc: "⪩",
		gesdot: "⪀",
		gesdoto: "⪂",
		gesdotol: "⪄",
		gesl: "⋛︀",
		gesles: "⪔",
		Gfr: "𝔊",
		gfr: "𝔤",
		Gg: "⋙",
		gg: "≫",
		ggg: "⋙",
		gimel: "ℷ",
		GJcy: "Ѓ",
		gjcy: "ѓ",
		gl: "≷",
		gla: "⪥",
		glE: "⪒",
		glj: "⪤",
		gnap: "⪊",
		gnapprox: "⪊",
		gnE: "≩",
		gne: "⪈",
		gneq: "⪈",
		gneqq: "≩",
		gnsim: "⋧",
		Gopf: "𝔾",
		gopf: "𝕘",
		grave: "`",
		GreaterEqual: "≥",
		GreaterEqualLess: "⋛",
		GreaterFullEqual: "≧",
		GreaterGreater: "⪢",
		GreaterLess: "≷",
		GreaterSlantEqual: "⩾",
		GreaterTilde: "≳",
		Gscr: "𝒢",
		gscr: "ℊ",
		gsim: "≳",
		gsime: "⪎",
		gsiml: "⪐",
		Gt: "≫",
		GT: ">",
		gt: ">",
		gtcc: "⪧",
		gtcir: "⩺",
		gtdot: "⋗",
		gtlPar: "⦕",
		gtquest: "⩼",
		gtrapprox: "⪆",
		gtrarr: "⥸",
		gtrdot: "⋗",
		gtreqless: "⋛",
		gtreqqless: "⪌",
		gtrless: "≷",
		gtrsim: "≳",
		gvertneqq: "≩︀",
		gvnE: "≩︀",
		Hacek: "ˇ",
		hairsp: " ",
		half: "½",
		hamilt: "ℋ",
		HARDcy: "Ъ",
		hardcy: "ъ",
		hArr: "⇔",
		harr: "↔",
		harrcir: "⥈",
		harrw: "↭",
		Hat: "^",
		hbar: "ℏ",
		Hcirc: "Ĥ",
		hcirc: "ĥ",
		hearts: "♥",
		heartsuit: "♥",
		hellip: "…",
		hercon: "⊹",
		Hfr: "ℌ",
		hfr: "𝔥",
		HilbertSpace: "ℋ",
		hksearow: "⤥",
		hkswarow: "⤦",
		hoarr: "⇿",
		homtht: "∻",
		hookleftarrow: "↩",
		hookrightarrow: "↪",
		Hopf: "ℍ",
		hopf: "𝕙",
		horbar: "―",
		HorizontalLine: "─",
		Hscr: "ℋ",
		hscr: "𝒽",
		hslash: "ℏ",
		Hstrok: "Ħ",
		hstrok: "ħ",
		HumpDownHump: "≎",
		HumpEqual: "≏",
		hybull: "⁃",
		hyphen: "‐",
		Iacute: "Í",
		iacute: "í",
		ic: "⁣",
		Icirc: "Î",
		icirc: "î",
		Icy: "И",
		icy: "и",
		Idot: "İ",
		IEcy: "Е",
		iecy: "е",
		iexcl: "¡",
		iff: "⇔",
		Ifr: "ℑ",
		ifr: "𝔦",
		Igrave: "Ì",
		igrave: "ì",
		ii: "ⅈ",
		iiiint: "⨌",
		iiint: "∭",
		iinfin: "⧜",
		iiota: "℩",
		IJlig: "Ĳ",
		ijlig: "ĳ",
		Im: "ℑ",
		Imacr: "Ī",
		imacr: "ī",
		image: "ℑ",
		ImaginaryI: "ⅈ",
		imagline: "ℐ",
		imagpart: "ℑ",
		imath: "ı",
		imof: "⊷",
		imped: "Ƶ",
		Implies: "⇒",
		in: "∈",
		incare: "℅",
		infin: "∞",
		infintie: "⧝",
		inodot: "ı",
		Int: "∬",
		int: "∫",
		intcal: "⊺",
		integers: "ℤ",
		Integral: "∫",
		intercal: "⊺",
		Intersection: "⋂",
		intlarhk: "⨗",
		intprod: "⨼",
		InvisibleComma: "⁣",
		InvisibleTimes: "⁢",
		IOcy: "Ё",
		iocy: "ё",
		Iogon: "Į",
		iogon: "į",
		Iopf: "𝕀",
		iopf: "𝕚",
		Iota: "Ι",
		iota: "ι",
		iprod: "⨼",
		iquest: "¿",
		Iscr: "ℐ",
		iscr: "𝒾",
		isin: "∈",
		isindot: "⋵",
		isinE: "⋹",
		isins: "⋴",
		isinsv: "⋳",
		isinv: "∈",
		it: "⁢",
		Itilde: "Ĩ",
		itilde: "ĩ",
		Iukcy: "І",
		iukcy: "і",
		Iuml: "Ï",
		iuml: "ï",
		Jcirc: "Ĵ",
		jcirc: "ĵ",
		Jcy: "Й",
		jcy: "й",
		Jfr: "𝔍",
		jfr: "𝔧",
		jmath: "ȷ",
		Jopf: "𝕁",
		jopf: "𝕛",
		Jscr: "𝒥",
		jscr: "𝒿",
		Jsercy: "Ј",
		jsercy: "ј",
		Jukcy: "Є",
		jukcy: "є",
		Kappa: "Κ",
		kappa: "κ",
		kappav: "ϰ",
		Kcedil: "Ķ",
		kcedil: "ķ",
		Kcy: "К",
		kcy: "к",
		Kfr: "𝔎",
		kfr: "𝔨",
		kgreen: "ĸ",
		KHcy: "Х",
		khcy: "х",
		KJcy: "Ќ",
		kjcy: "ќ",
		Kopf: "𝕂",
		kopf: "𝕜",
		Kscr: "𝒦",
		kscr: "𝓀",
		lAarr: "⇚",
		Lacute: "Ĺ",
		lacute: "ĺ",
		laemptyv: "⦴",
		lagran: "ℒ",
		Lambda: "Λ",
		lambda: "λ",
		Lang: "⟪",
		lang: "⟨",
		langd: "⦑",
		langle: "⟨",
		lap: "⪅",
		Laplacetrf: "ℒ",
		laquo: "«",
		Larr: "↞",
		lArr: "⇐",
		larr: "←",
		larrb: "⇤",
		larrbfs: "⤟",
		larrfs: "⤝",
		larrhk: "↩",
		larrlp: "↫",
		larrpl: "⤹",
		larrsim: "⥳",
		larrtl: "↢",
		lat: "⪫",
		lAtail: "⤛",
		latail: "⤙",
		late: "⪭",
		lates: "⪭︀",
		lBarr: "⤎",
		lbarr: "⤌",
		lbbrk: "❲",
		lbrace: "{",
		lbrack: "[",
		lbrke: "⦋",
		lbrksld: "⦏",
		lbrkslu: "⦍",
		Lcaron: "Ľ",
		lcaron: "ľ",
		Lcedil: "Ļ",
		lcedil: "ļ",
		lceil: "⌈",
		lcub: "{",
		Lcy: "Л",
		lcy: "л",
		ldca: "⤶",
		ldquo: "“",
		ldquor: "„",
		ldrdhar: "⥧",
		ldrushar: "⥋",
		ldsh: "↲",
		lE: "≦",
		le: "≤",
		LeftAngleBracket: "⟨",
		LeftArrow: "←",
		Leftarrow: "⇐",
		leftarrow: "←",
		LeftArrowBar: "⇤",
		LeftArrowRightArrow: "⇆",
		leftarrowtail: "↢",
		LeftCeiling: "⌈",
		LeftDoubleBracket: "⟦",
		LeftDownTeeVector: "⥡",
		LeftDownVector: "⇃",
		LeftDownVectorBar: "⥙",
		LeftFloor: "⌊",
		leftharpoondown: "↽",
		leftharpoonup: "↼",
		leftleftarrows: "⇇",
		LeftRightArrow: "↔",
		Leftrightarrow: "⇔",
		leftrightarrow: "↔",
		leftrightarrows: "⇆",
		leftrightharpoons: "⇋",
		leftrightsquigarrow: "↭",
		LeftRightVector: "⥎",
		LeftTee: "⊣",
		LeftTeeArrow: "↤",
		LeftTeeVector: "⥚",
		leftthreetimes: "⋋",
		LeftTriangle: "⊲",
		LeftTriangleBar: "⧏",
		LeftTriangleEqual: "⊴",
		LeftUpDownVector: "⥑",
		LeftUpTeeVector: "⥠",
		LeftUpVector: "↿",
		LeftUpVectorBar: "⥘",
		LeftVector: "↼",
		LeftVectorBar: "⥒",
		lEg: "⪋",
		leg: "⋚",
		leq: "≤",
		leqq: "≦",
		leqslant: "⩽",
		les: "⩽",
		lescc: "⪨",
		lesdot: "⩿",
		lesdoto: "⪁",
		lesdotor: "⪃",
		lesg: "⋚︀",
		lesges: "⪓",
		lessapprox: "⪅",
		lessdot: "⋖",
		lesseqgtr: "⋚",
		lesseqqgtr: "⪋",
		LessEqualGreater: "⋚",
		LessFullEqual: "≦",
		LessGreater: "≶",
		lessgtr: "≶",
		LessLess: "⪡",
		lesssim: "≲",
		LessSlantEqual: "⩽",
		LessTilde: "≲",
		lfisht: "⥼",
		lfloor: "⌊",
		Lfr: "𝔏",
		lfr: "𝔩",
		lg: "≶",
		lgE: "⪑",
		lHar: "⥢",
		lhard: "↽",
		lharu: "↼",
		lharul: "⥪",
		lhblk: "▄",
		LJcy: "Љ",
		ljcy: "љ",
		Ll: "⋘",
		ll: "≪",
		llarr: "⇇",
		llcorner: "⌞",
		Lleftarrow: "⇚",
		llhard: "⥫",
		lltri: "◺",
		Lmidot: "Ŀ",
		lmidot: "ŀ",
		lmoust: "⎰",
		lmoustache: "⎰",
		lnap: "⪉",
		lnapprox: "⪉",
		lnE: "≨",
		lne: "⪇",
		lneq: "⪇",
		lneqq: "≨",
		lnsim: "⋦",
		loang: "⟬",
		loarr: "⇽",
		lobrk: "⟦",
		LongLeftArrow: "⟵",
		Longleftarrow: "⟸",
		longleftarrow: "⟵",
		LongLeftRightArrow: "⟷",
		Longleftrightarrow: "⟺",
		longleftrightarrow: "⟷",
		longmapsto: "⟼",
		LongRightArrow: "⟶",
		Longrightarrow: "⟹",
		longrightarrow: "⟶",
		looparrowleft: "↫",
		looparrowright: "↬",
		lopar: "⦅",
		Lopf: "𝕃",
		lopf: "𝕝",
		loplus: "⨭",
		lotimes: "⨴",
		lowast: "∗",
		lowbar: "_",
		LowerLeftArrow: "↙",
		LowerRightArrow: "↘",
		loz: "◊",
		lozenge: "◊",
		lozf: "⧫",
		lpar: "(",
		lparlt: "⦓",
		lrarr: "⇆",
		lrcorner: "⌟",
		lrhar: "⇋",
		lrhard: "⥭",
		lrm: "‎",
		lrtri: "⊿",
		lsaquo: "‹",
		Lscr: "ℒ",
		lscr: "𝓁",
		Lsh: "↰",
		lsh: "↰",
		lsim: "≲",
		lsime: "⪍",
		lsimg: "⪏",
		lsqb: "[",
		lsquo: "‘",
		lsquor: "‚",
		Lstrok: "Ł",
		lstrok: "ł",
		Lt: "≪",
		LT: "<",
		lt: "<",
		ltcc: "⪦",
		ltcir: "⩹",
		ltdot: "⋖",
		lthree: "⋋",
		ltimes: "⋉",
		ltlarr: "⥶",
		ltquest: "⩻",
		ltri: "◃",
		ltrie: "⊴",
		ltrif: "◂",
		ltrPar: "⦖",
		lurdshar: "⥊",
		luruhar: "⥦",
		lvertneqq: "≨︀",
		lvnE: "≨︀",
		macr: "¯",
		male: "♂",
		malt: "✠",
		maltese: "✠",
		Map: "⤅",
		map: "↦",
		mapsto: "↦",
		mapstodown: "↧",
		mapstoleft: "↤",
		mapstoup: "↥",
		marker: "▮",
		mcomma: "⨩",
		Mcy: "М",
		mcy: "м",
		mdash: "—",
		mDDot: "∺",
		measuredangle: "∡",
		MediumSpace: " ",
		Mellintrf: "ℳ",
		Mfr: "𝔐",
		mfr: "𝔪",
		mho: "℧",
		micro: "µ",
		mid: "∣",
		midast: "*",
		midcir: "⫰",
		middot: "·",
		minus: "−",
		minusb: "⊟",
		minusd: "∸",
		minusdu: "⨪",
		MinusPlus: "∓",
		mlcp: "⫛",
		mldr: "…",
		mnplus: "∓",
		models: "⊧",
		Mopf: "𝕄",
		mopf: "𝕞",
		mp: "∓",
		Mscr: "ℳ",
		mscr: "𝓂",
		mstpos: "∾",
		Mu: "Μ",
		mu: "μ",
		multimap: "⊸",
		mumap: "⊸",
		nabla: "∇",
		Nacute: "Ń",
		nacute: "ń",
		nang: "∠⃒",
		nap: "≉",
		napE: "⩰̸",
		napid: "≋̸",
		napos: "ŉ",
		napprox: "≉",
		natur: "♮",
		natural: "♮",
		naturals: "ℕ",
		nbsp: "\xA0",
		nbump: "≎̸",
		nbumpe: "≏̸",
		ncap: "⩃",
		Ncaron: "Ň",
		ncaron: "ň",
		Ncedil: "Ņ",
		ncedil: "ņ",
		ncong: "≇",
		ncongdot: "⩭̸",
		ncup: "⩂",
		Ncy: "Н",
		ncy: "н",
		ndash: "–",
		ne: "≠",
		nearhk: "⤤",
		neArr: "⇗",
		nearr: "↗",
		nearrow: "↗",
		nedot: "≐̸",
		NegativeMediumSpace: "​",
		NegativeThickSpace: "​",
		NegativeThinSpace: "​",
		NegativeVeryThinSpace: "​",
		nequiv: "≢",
		nesear: "⤨",
		nesim: "≂̸",
		NestedGreaterGreater: "≫",
		NestedLessLess: "≪",
		NewLine: "\n",
		nexist: "∄",
		nexists: "∄",
		Nfr: "𝔑",
		nfr: "𝔫",
		ngE: "≧̸",
		nge: "≱",
		ngeq: "≱",
		ngeqq: "≧̸",
		ngeqslant: "⩾̸",
		nges: "⩾̸",
		nGg: "⋙̸",
		ngsim: "≵",
		nGt: "≫⃒",
		ngt: "≯",
		ngtr: "≯",
		nGtv: "≫̸",
		nhArr: "⇎",
		nharr: "↮",
		nhpar: "⫲",
		ni: "∋",
		nis: "⋼",
		nisd: "⋺",
		niv: "∋",
		NJcy: "Њ",
		njcy: "њ",
		nlArr: "⇍",
		nlarr: "↚",
		nldr: "‥",
		nlE: "≦̸",
		nle: "≰",
		nLeftarrow: "⇍",
		nleftarrow: "↚",
		nLeftrightarrow: "⇎",
		nleftrightarrow: "↮",
		nleq: "≰",
		nleqq: "≦̸",
		nleqslant: "⩽̸",
		nles: "⩽̸",
		nless: "≮",
		nLl: "⋘̸",
		nlsim: "≴",
		nLt: "≪⃒",
		nlt: "≮",
		nltri: "⋪",
		nltrie: "⋬",
		nLtv: "≪̸",
		nmid: "∤",
		NoBreak: "⁠",
		NonBreakingSpace: "\xA0",
		Nopf: "ℕ",
		nopf: "𝕟",
		Not: "⫬",
		not: "¬",
		NotCongruent: "≢",
		NotCupCap: "≭",
		NotDoubleVerticalBar: "∦",
		NotElement: "∉",
		NotEqual: "≠",
		NotEqualTilde: "≂̸",
		NotExists: "∄",
		NotGreater: "≯",
		NotGreaterEqual: "≱",
		NotGreaterFullEqual: "≧̸",
		NotGreaterGreater: "≫̸",
		NotGreaterLess: "≹",
		NotGreaterSlantEqual: "⩾̸",
		NotGreaterTilde: "≵",
		NotHumpDownHump: "≎̸",
		NotHumpEqual: "≏̸",
		notin: "∉",
		notindot: "⋵̸",
		notinE: "⋹̸",
		notinva: "∉",
		notinvb: "⋷",
		notinvc: "⋶",
		NotLeftTriangle: "⋪",
		NotLeftTriangleBar: "⧏̸",
		NotLeftTriangleEqual: "⋬",
		NotLess: "≮",
		NotLessEqual: "≰",
		NotLessGreater: "≸",
		NotLessLess: "≪̸",
		NotLessSlantEqual: "⩽̸",
		NotLessTilde: "≴",
		NotNestedGreaterGreater: "⪢̸",
		NotNestedLessLess: "⪡̸",
		notni: "∌",
		notniva: "∌",
		notnivb: "⋾",
		notnivc: "⋽",
		NotPrecedes: "⊀",
		NotPrecedesEqual: "⪯̸",
		NotPrecedesSlantEqual: "⋠",
		NotReverseElement: "∌",
		NotRightTriangle: "⋫",
		NotRightTriangleBar: "⧐̸",
		NotRightTriangleEqual: "⋭",
		NotSquareSubset: "⊏̸",
		NotSquareSubsetEqual: "⋢",
		NotSquareSuperset: "⊐̸",
		NotSquareSupersetEqual: "⋣",
		NotSubset: "⊂⃒",
		NotSubsetEqual: "⊈",
		NotSucceeds: "⊁",
		NotSucceedsEqual: "⪰̸",
		NotSucceedsSlantEqual: "⋡",
		NotSucceedsTilde: "≿̸",
		NotSuperset: "⊃⃒",
		NotSupersetEqual: "⊉",
		NotTilde: "≁",
		NotTildeEqual: "≄",
		NotTildeFullEqual: "≇",
		NotTildeTilde: "≉",
		NotVerticalBar: "∤",
		npar: "∦",
		nparallel: "∦",
		nparsl: "⫽⃥",
		npart: "∂̸",
		npolint: "⨔",
		npr: "⊀",
		nprcue: "⋠",
		npre: "⪯̸",
		nprec: "⊀",
		npreceq: "⪯̸",
		nrArr: "⇏",
		nrarr: "↛",
		nrarrc: "⤳̸",
		nrarrw: "↝̸",
		nRightarrow: "⇏",
		nrightarrow: "↛",
		nrtri: "⋫",
		nrtrie: "⋭",
		nsc: "⊁",
		nsccue: "⋡",
		nsce: "⪰̸",
		Nscr: "𝒩",
		nscr: "𝓃",
		nshortmid: "∤",
		nshortparallel: "∦",
		nsim: "≁",
		nsime: "≄",
		nsimeq: "≄",
		nsmid: "∤",
		nspar: "∦",
		nsqsube: "⋢",
		nsqsupe: "⋣",
		nsub: "⊄",
		nsubE: "⫅̸",
		nsube: "⊈",
		nsubset: "⊂⃒",
		nsubseteq: "⊈",
		nsubseteqq: "⫅̸",
		nsucc: "⊁",
		nsucceq: "⪰̸",
		nsup: "⊅",
		nsupE: "⫆̸",
		nsupe: "⊉",
		nsupset: "⊃⃒",
		nsupseteq: "⊉",
		nsupseteqq: "⫆̸",
		ntgl: "≹",
		Ntilde: "Ñ",
		ntilde: "ñ",
		ntlg: "≸",
		ntriangleleft: "⋪",
		ntrianglelefteq: "⋬",
		ntriangleright: "⋫",
		ntrianglerighteq: "⋭",
		Nu: "Ν",
		nu: "ν",
		num: "#",
		numero: "№",
		numsp: " ",
		nvap: "≍⃒",
		nVDash: "⊯",
		nVdash: "⊮",
		nvDash: "⊭",
		nvdash: "⊬",
		nvge: "≥⃒",
		nvgt: ">⃒",
		nvHarr: "⤄",
		nvinfin: "⧞",
		nvlArr: "⤂",
		nvle: "≤⃒",
		nvlt: "<⃒",
		nvltrie: "⊴⃒",
		nvrArr: "⤃",
		nvrtrie: "⊵⃒",
		nvsim: "∼⃒",
		nwarhk: "⤣",
		nwArr: "⇖",
		nwarr: "↖",
		nwarrow: "↖",
		nwnear: "⤧",
		Oacute: "Ó",
		oacute: "ó",
		oast: "⊛",
		ocir: "⊚",
		Ocirc: "Ô",
		ocirc: "ô",
		Ocy: "О",
		ocy: "о",
		odash: "⊝",
		Odblac: "Ő",
		odblac: "ő",
		odiv: "⨸",
		odot: "⊙",
		odsold: "⦼",
		OElig: "Œ",
		oelig: "œ",
		ofcir: "⦿",
		Ofr: "𝔒",
		ofr: "𝔬",
		ogon: "˛",
		Ograve: "Ò",
		ograve: "ò",
		ogt: "⧁",
		ohbar: "⦵",
		ohm: "Ω",
		oint: "∮",
		olarr: "↺",
		olcir: "⦾",
		olcross: "⦻",
		oline: "‾",
		olt: "⧀",
		Omacr: "Ō",
		omacr: "ō",
		Omega: "Ω",
		omega: "ω",
		Omicron: "Ο",
		omicron: "ο",
		omid: "⦶",
		ominus: "⊖",
		Oopf: "𝕆",
		oopf: "𝕠",
		opar: "⦷",
		OpenCurlyDoubleQuote: "“",
		OpenCurlyQuote: "‘",
		operp: "⦹",
		oplus: "⊕",
		Or: "⩔",
		or: "∨",
		orarr: "↻",
		ord: "⩝",
		order: "ℴ",
		orderof: "ℴ",
		ordf: "ª",
		ordm: "º",
		origof: "⊶",
		oror: "⩖",
		orslope: "⩗",
		orv: "⩛",
		oS: "Ⓢ",
		Oscr: "𝒪",
		oscr: "ℴ",
		Oslash: "Ø",
		oslash: "ø",
		osol: "⊘",
		Otilde: "Õ",
		otilde: "õ",
		Otimes: "⨷",
		otimes: "⊗",
		otimesas: "⨶",
		Ouml: "Ö",
		ouml: "ö",
		ovbar: "⌽",
		OverBar: "‾",
		OverBrace: "⏞",
		OverBracket: "⎴",
		OverParenthesis: "⏜",
		par: "∥",
		para: "¶",
		parallel: "∥",
		parsim: "⫳",
		parsl: "⫽",
		part: "∂",
		PartialD: "∂",
		Pcy: "П",
		pcy: "п",
		percnt: "%",
		period: ".",
		permil: "‰",
		perp: "⊥",
		pertenk: "‱",
		Pfr: "𝔓",
		pfr: "𝔭",
		Phi: "Φ",
		phi: "φ",
		phiv: "ϕ",
		phmmat: "ℳ",
		phone: "☎",
		Pi: "Π",
		pi: "π",
		pitchfork: "⋔",
		piv: "ϖ",
		planck: "ℏ",
		planckh: "ℎ",
		plankv: "ℏ",
		plus: "+",
		plusacir: "⨣",
		plusb: "⊞",
		pluscir: "⨢",
		plusdo: "∔",
		plusdu: "⨥",
		pluse: "⩲",
		PlusMinus: "±",
		plusmn: "±",
		plussim: "⨦",
		plustwo: "⨧",
		pm: "±",
		Poincareplane: "ℌ",
		pointint: "⨕",
		Popf: "ℙ",
		popf: "𝕡",
		pound: "£",
		Pr: "⪻",
		pr: "≺",
		prap: "⪷",
		prcue: "≼",
		prE: "⪳",
		pre: "⪯",
		prec: "≺",
		precapprox: "⪷",
		preccurlyeq: "≼",
		Precedes: "≺",
		PrecedesEqual: "⪯",
		PrecedesSlantEqual: "≼",
		PrecedesTilde: "≾",
		preceq: "⪯",
		precnapprox: "⪹",
		precneqq: "⪵",
		precnsim: "⋨",
		precsim: "≾",
		Prime: "″",
		prime: "′",
		primes: "ℙ",
		prnap: "⪹",
		prnE: "⪵",
		prnsim: "⋨",
		prod: "∏",
		Product: "∏",
		profalar: "⌮",
		profline: "⌒",
		profsurf: "⌓",
		prop: "∝",
		Proportion: "∷",
		Proportional: "∝",
		propto: "∝",
		prsim: "≾",
		prurel: "⊰",
		Pscr: "𝒫",
		pscr: "𝓅",
		Psi: "Ψ",
		psi: "ψ",
		puncsp: " ",
		Qfr: "𝔔",
		qfr: "𝔮",
		qint: "⨌",
		Qopf: "ℚ",
		qopf: "𝕢",
		qprime: "⁗",
		Qscr: "𝒬",
		qscr: "𝓆",
		quaternions: "ℍ",
		quatint: "⨖",
		quest: "?",
		questeq: "≟",
		QUOT: "\"",
		quot: "\"",
		rAarr: "⇛",
		race: "∽̱",
		Racute: "Ŕ",
		racute: "ŕ",
		radic: "√",
		raemptyv: "⦳",
		Rang: "⟫",
		rang: "⟩",
		rangd: "⦒",
		range: "⦥",
		rangle: "⟩",
		raquo: "»",
		Rarr: "↠",
		rArr: "⇒",
		rarr: "→",
		rarrap: "⥵",
		rarrb: "⇥",
		rarrbfs: "⤠",
		rarrc: "⤳",
		rarrfs: "⤞",
		rarrhk: "↪",
		rarrlp: "↬",
		rarrpl: "⥅",
		rarrsim: "⥴",
		Rarrtl: "⤖",
		rarrtl: "↣",
		rarrw: "↝",
		rAtail: "⤜",
		ratail: "⤚",
		ratio: "∶",
		rationals: "ℚ",
		RBarr: "⤐",
		rBarr: "⤏",
		rbarr: "⤍",
		rbbrk: "❳",
		rbrace: "}",
		rbrack: "]",
		rbrke: "⦌",
		rbrksld: "⦎",
		rbrkslu: "⦐",
		Rcaron: "Ř",
		rcaron: "ř",
		Rcedil: "Ŗ",
		rcedil: "ŗ",
		rceil: "⌉",
		rcub: "}",
		Rcy: "Р",
		rcy: "р",
		rdca: "⤷",
		rdldhar: "⥩",
		rdquo: "”",
		rdquor: "”",
		rdsh: "↳",
		Re: "ℜ",
		real: "ℜ",
		realine: "ℛ",
		realpart: "ℜ",
		reals: "ℝ",
		rect: "▭",
		REG: "®",
		reg: "®",
		ReverseElement: "∋",
		ReverseEquilibrium: "⇋",
		ReverseUpEquilibrium: "⥯",
		rfisht: "⥽",
		rfloor: "⌋",
		Rfr: "ℜ",
		rfr: "𝔯",
		rHar: "⥤",
		rhard: "⇁",
		rharu: "⇀",
		rharul: "⥬",
		Rho: "Ρ",
		rho: "ρ",
		rhov: "ϱ",
		RightAngleBracket: "⟩",
		RightArrow: "→",
		Rightarrow: "⇒",
		rightarrow: "→",
		RightArrowBar: "⇥",
		RightArrowLeftArrow: "⇄",
		rightarrowtail: "↣",
		RightCeiling: "⌉",
		RightDoubleBracket: "⟧",
		RightDownTeeVector: "⥝",
		RightDownVector: "⇂",
		RightDownVectorBar: "⥕",
		RightFloor: "⌋",
		rightharpoondown: "⇁",
		rightharpoonup: "⇀",
		rightleftarrows: "⇄",
		rightleftharpoons: "⇌",
		rightrightarrows: "⇉",
		rightsquigarrow: "↝",
		RightTee: "⊢",
		RightTeeArrow: "↦",
		RightTeeVector: "⥛",
		rightthreetimes: "⋌",
		RightTriangle: "⊳",
		RightTriangleBar: "⧐",
		RightTriangleEqual: "⊵",
		RightUpDownVector: "⥏",
		RightUpTeeVector: "⥜",
		RightUpVector: "↾",
		RightUpVectorBar: "⥔",
		RightVector: "⇀",
		RightVectorBar: "⥓",
		ring: "˚",
		risingdotseq: "≓",
		rlarr: "⇄",
		rlhar: "⇌",
		rlm: "‏",
		rmoust: "⎱",
		rmoustache: "⎱",
		rnmid: "⫮",
		roang: "⟭",
		roarr: "⇾",
		robrk: "⟧",
		ropar: "⦆",
		Ropf: "ℝ",
		ropf: "𝕣",
		roplus: "⨮",
		rotimes: "⨵",
		RoundImplies: "⥰",
		rpar: ")",
		rpargt: "⦔",
		rppolint: "⨒",
		rrarr: "⇉",
		Rrightarrow: "⇛",
		rsaquo: "›",
		Rscr: "ℛ",
		rscr: "𝓇",
		Rsh: "↱",
		rsh: "↱",
		rsqb: "]",
		rsquo: "’",
		rsquor: "’",
		rthree: "⋌",
		rtimes: "⋊",
		rtri: "▹",
		rtrie: "⊵",
		rtrif: "▸",
		rtriltri: "⧎",
		RuleDelayed: "⧴",
		ruluhar: "⥨",
		rx: "℞",
		Sacute: "Ś",
		sacute: "ś",
		sbquo: "‚",
		Sc: "⪼",
		sc: "≻",
		scap: "⪸",
		Scaron: "Š",
		scaron: "š",
		sccue: "≽",
		scE: "⪴",
		sce: "⪰",
		Scedil: "Ş",
		scedil: "ş",
		Scirc: "Ŝ",
		scirc: "ŝ",
		scnap: "⪺",
		scnE: "⪶",
		scnsim: "⋩",
		scpolint: "⨓",
		scsim: "≿",
		Scy: "С",
		scy: "с",
		sdot: "⋅",
		sdotb: "⊡",
		sdote: "⩦",
		searhk: "⤥",
		seArr: "⇘",
		searr: "↘",
		searrow: "↘",
		sect: "§",
		semi: ";",
		seswar: "⤩",
		setminus: "∖",
		setmn: "∖",
		sext: "✶",
		Sfr: "𝔖",
		sfr: "𝔰",
		sfrown: "⌢",
		sharp: "♯",
		SHCHcy: "Щ",
		shchcy: "щ",
		SHcy: "Ш",
		shcy: "ш",
		ShortDownArrow: "↓",
		ShortLeftArrow: "←",
		shortmid: "∣",
		shortparallel: "∥",
		ShortRightArrow: "→",
		ShortUpArrow: "↑",
		shy: "­",
		Sigma: "Σ",
		sigma: "σ",
		sigmaf: "ς",
		sigmav: "ς",
		sim: "∼",
		simdot: "⩪",
		sime: "≃",
		simeq: "≃",
		simg: "⪞",
		simgE: "⪠",
		siml: "⪝",
		simlE: "⪟",
		simne: "≆",
		simplus: "⨤",
		simrarr: "⥲",
		slarr: "←",
		SmallCircle: "∘",
		smallsetminus: "∖",
		smashp: "⨳",
		smeparsl: "⧤",
		smid: "∣",
		smile: "⌣",
		smt: "⪪",
		smte: "⪬",
		smtes: "⪬︀",
		SOFTcy: "Ь",
		softcy: "ь",
		sol: "/",
		solb: "⧄",
		solbar: "⌿",
		Sopf: "𝕊",
		sopf: "𝕤",
		spades: "♠",
		spadesuit: "♠",
		spar: "∥",
		sqcap: "⊓",
		sqcaps: "⊓︀",
		sqcup: "⊔",
		sqcups: "⊔︀",
		Sqrt: "√",
		sqsub: "⊏",
		sqsube: "⊑",
		sqsubset: "⊏",
		sqsubseteq: "⊑",
		sqsup: "⊐",
		sqsupe: "⊒",
		sqsupset: "⊐",
		sqsupseteq: "⊒",
		squ: "□",
		Square: "□",
		square: "□",
		SquareIntersection: "⊓",
		SquareSubset: "⊏",
		SquareSubsetEqual: "⊑",
		SquareSuperset: "⊐",
		SquareSupersetEqual: "⊒",
		SquareUnion: "⊔",
		squarf: "▪",
		squf: "▪",
		srarr: "→",
		Sscr: "𝒮",
		sscr: "𝓈",
		ssetmn: "∖",
		ssmile: "⌣",
		sstarf: "⋆",
		Star: "⋆",
		star: "☆",
		starf: "★",
		straightepsilon: "ϵ",
		straightphi: "ϕ",
		strns: "¯",
		Sub: "⋐",
		sub: "⊂",
		subdot: "⪽",
		subE: "⫅",
		sube: "⊆",
		subedot: "⫃",
		submult: "⫁",
		subnE: "⫋",
		subne: "⊊",
		subplus: "⪿",
		subrarr: "⥹",
		Subset: "⋐",
		subset: "⊂",
		subseteq: "⊆",
		subseteqq: "⫅",
		SubsetEqual: "⊆",
		subsetneq: "⊊",
		subsetneqq: "⫋",
		subsim: "⫇",
		subsub: "⫕",
		subsup: "⫓",
		succ: "≻",
		succapprox: "⪸",
		succcurlyeq: "≽",
		Succeeds: "≻",
		SucceedsEqual: "⪰",
		SucceedsSlantEqual: "≽",
		SucceedsTilde: "≿",
		succeq: "⪰",
		succnapprox: "⪺",
		succneqq: "⪶",
		succnsim: "⋩",
		succsim: "≿",
		SuchThat: "∋",
		Sum: "∑",
		sum: "∑",
		sung: "♪",
		Sup: "⋑",
		sup: "⊃",
		sup1: "¹",
		sup2: "²",
		sup3: "³",
		supdot: "⪾",
		supdsub: "⫘",
		supE: "⫆",
		supe: "⊇",
		supedot: "⫄",
		Superset: "⊃",
		SupersetEqual: "⊇",
		suphsol: "⟉",
		suphsub: "⫗",
		suplarr: "⥻",
		supmult: "⫂",
		supnE: "⫌",
		supne: "⊋",
		supplus: "⫀",
		Supset: "⋑",
		supset: "⊃",
		supseteq: "⊇",
		supseteqq: "⫆",
		supsetneq: "⊋",
		supsetneqq: "⫌",
		supsim: "⫈",
		supsub: "⫔",
		supsup: "⫖",
		swarhk: "⤦",
		swArr: "⇙",
		swarr: "↙",
		swarrow: "↙",
		swnwar: "⤪",
		szlig: "ß",
		Tab: "	",
		target: "⌖",
		Tau: "Τ",
		tau: "τ",
		tbrk: "⎴",
		Tcaron: "Ť",
		tcaron: "ť",
		Tcedil: "Ţ",
		tcedil: "ţ",
		Tcy: "Т",
		tcy: "т",
		tdot: "⃛",
		telrec: "⌕",
		Tfr: "𝔗",
		tfr: "𝔱",
		there4: "∴",
		Therefore: "∴",
		therefore: "∴",
		Theta: "Θ",
		theta: "θ",
		thetasym: "ϑ",
		thetav: "ϑ",
		thickapprox: "≈",
		thicksim: "∼",
		ThickSpace: "  ",
		thinsp: " ",
		ThinSpace: " ",
		thkap: "≈",
		thksim: "∼",
		THORN: "Þ",
		thorn: "þ",
		Tilde: "∼",
		tilde: "˜",
		TildeEqual: "≃",
		TildeFullEqual: "≅",
		TildeTilde: "≈",
		times: "×",
		timesb: "⊠",
		timesbar: "⨱",
		timesd: "⨰",
		tint: "∭",
		toea: "⤨",
		top: "⊤",
		topbot: "⌶",
		topcir: "⫱",
		Topf: "𝕋",
		topf: "𝕥",
		topfork: "⫚",
		tosa: "⤩",
		tprime: "‴",
		TRADE: "™",
		trade: "™",
		triangle: "▵",
		triangledown: "▿",
		triangleleft: "◃",
		trianglelefteq: "⊴",
		triangleq: "≜",
		triangleright: "▹",
		trianglerighteq: "⊵",
		tridot: "◬",
		trie: "≜",
		triminus: "⨺",
		TripleDot: "⃛",
		triplus: "⨹",
		trisb: "⧍",
		tritime: "⨻",
		trpezium: "⏢",
		Tscr: "𝒯",
		tscr: "𝓉",
		TScy: "Ц",
		tscy: "ц",
		TSHcy: "Ћ",
		tshcy: "ћ",
		Tstrok: "Ŧ",
		tstrok: "ŧ",
		twixt: "≬",
		twoheadleftarrow: "↞",
		twoheadrightarrow: "↠",
		Uacute: "Ú",
		uacute: "ú",
		Uarr: "↟",
		uArr: "⇑",
		uarr: "↑",
		Uarrocir: "⥉",
		Ubrcy: "Ў",
		ubrcy: "ў",
		Ubreve: "Ŭ",
		ubreve: "ŭ",
		Ucirc: "Û",
		ucirc: "û",
		Ucy: "У",
		ucy: "у",
		udarr: "⇅",
		Udblac: "Ű",
		udblac: "ű",
		udhar: "⥮",
		ufisht: "⥾",
		Ufr: "𝔘",
		ufr: "𝔲",
		Ugrave: "Ù",
		ugrave: "ù",
		uHar: "⥣",
		uharl: "↿",
		uharr: "↾",
		uhblk: "▀",
		ulcorn: "⌜",
		ulcorner: "⌜",
		ulcrop: "⌏",
		ultri: "◸",
		Umacr: "Ū",
		umacr: "ū",
		uml: "¨",
		UnderBar: "_",
		UnderBrace: "⏟",
		UnderBracket: "⎵",
		UnderParenthesis: "⏝",
		Union: "⋃",
		UnionPlus: "⊎",
		Uogon: "Ų",
		uogon: "ų",
		Uopf: "𝕌",
		uopf: "𝕦",
		UpArrow: "↑",
		Uparrow: "⇑",
		uparrow: "↑",
		UpArrowBar: "⤒",
		UpArrowDownArrow: "⇅",
		UpDownArrow: "↕",
		Updownarrow: "⇕",
		updownarrow: "↕",
		UpEquilibrium: "⥮",
		upharpoonleft: "↿",
		upharpoonright: "↾",
		uplus: "⊎",
		UpperLeftArrow: "↖",
		UpperRightArrow: "↗",
		Upsi: "ϒ",
		upsi: "υ",
		upsih: "ϒ",
		Upsilon: "Υ",
		upsilon: "υ",
		UpTee: "⊥",
		UpTeeArrow: "↥",
		upuparrows: "⇈",
		urcorn: "⌝",
		urcorner: "⌝",
		urcrop: "⌎",
		Uring: "Ů",
		uring: "ů",
		urtri: "◹",
		Uscr: "𝒰",
		uscr: "𝓊",
		utdot: "⋰",
		Utilde: "Ũ",
		utilde: "ũ",
		utri: "▵",
		utrif: "▴",
		uuarr: "⇈",
		Uuml: "Ü",
		uuml: "ü",
		uwangle: "⦧",
		vangrt: "⦜",
		varepsilon: "ϵ",
		varkappa: "ϰ",
		varnothing: "∅",
		varphi: "ϕ",
		varpi: "ϖ",
		varpropto: "∝",
		vArr: "⇕",
		varr: "↕",
		varrho: "ϱ",
		varsigma: "ς",
		varsubsetneq: "⊊︀",
		varsubsetneqq: "⫋︀",
		varsupsetneq: "⊋︀",
		varsupsetneqq: "⫌︀",
		vartheta: "ϑ",
		vartriangleleft: "⊲",
		vartriangleright: "⊳",
		Vbar: "⫫",
		vBar: "⫨",
		vBarv: "⫩",
		Vcy: "В",
		vcy: "в",
		VDash: "⊫",
		Vdash: "⊩",
		vDash: "⊨",
		vdash: "⊢",
		Vdashl: "⫦",
		Vee: "⋁",
		vee: "∨",
		veebar: "⊻",
		veeeq: "≚",
		vellip: "⋮",
		Verbar: "‖",
		verbar: "|",
		Vert: "‖",
		vert: "|",
		VerticalBar: "∣",
		VerticalLine: "|",
		VerticalSeparator: "❘",
		VerticalTilde: "≀",
		VeryThinSpace: " ",
		Vfr: "𝔙",
		vfr: "𝔳",
		vltri: "⊲",
		vnsub: "⊂⃒",
		vnsup: "⊃⃒",
		Vopf: "𝕍",
		vopf: "𝕧",
		vprop: "∝",
		vrtri: "⊳",
		Vscr: "𝒱",
		vscr: "𝓋",
		vsubnE: "⫋︀",
		vsubne: "⊊︀",
		vsupnE: "⫌︀",
		vsupne: "⊋︀",
		Vvdash: "⊪",
		vzigzag: "⦚",
		Wcirc: "Ŵ",
		wcirc: "ŵ",
		wedbar: "⩟",
		Wedge: "⋀",
		wedge: "∧",
		wedgeq: "≙",
		weierp: "℘",
		Wfr: "𝔚",
		wfr: "𝔴",
		Wopf: "𝕎",
		wopf: "𝕨",
		wp: "℘",
		wr: "≀",
		wreath: "≀",
		Wscr: "𝒲",
		wscr: "𝓌",
		xcap: "⋂",
		xcirc: "◯",
		xcup: "⋃",
		xdtri: "▽",
		Xfr: "𝔛",
		xfr: "𝔵",
		xhArr: "⟺",
		xharr: "⟷",
		Xi: "Ξ",
		xi: "ξ",
		xlArr: "⟸",
		xlarr: "⟵",
		xmap: "⟼",
		xnis: "⋻",
		xodot: "⨀",
		Xopf: "𝕏",
		xopf: "𝕩",
		xoplus: "⨁",
		xotime: "⨂",
		xrArr: "⟹",
		xrarr: "⟶",
		Xscr: "𝒳",
		xscr: "𝓍",
		xsqcup: "⨆",
		xuplus: "⨄",
		xutri: "△",
		xvee: "⋁",
		xwedge: "⋀",
		Yacute: "Ý",
		yacute: "ý",
		YAcy: "Я",
		yacy: "я",
		Ycirc: "Ŷ",
		ycirc: "ŷ",
		Ycy: "Ы",
		ycy: "ы",
		yen: "¥",
		Yfr: "𝔜",
		yfr: "𝔶",
		YIcy: "Ї",
		yicy: "ї",
		Yopf: "𝕐",
		yopf: "𝕪",
		Yscr: "𝒴",
		yscr: "𝓎",
		YUcy: "Ю",
		yucy: "ю",
		Yuml: "Ÿ",
		yuml: "ÿ",
		Zacute: "Ź",
		zacute: "ź",
		Zcaron: "Ž",
		zcaron: "ž",
		Zcy: "З",
		zcy: "з",
		Zdot: "Ż",
		zdot: "ż",
		zeetrf: "ℨ",
		ZeroWidthSpace: "​",
		Zeta: "Ζ",
		zeta: "ζ",
		Zfr: "ℨ",
		zfr: "𝔷",
		ZHcy: "Ж",
		zhcy: "ж",
		zigrarr: "⇝",
		Zopf: "ℤ",
		zopf: "𝕫",
		Zscr: "𝒵",
		zscr: "𝓏",
		zwj: "‍",
		zwnj: "‌"
	});
	/**
	* @deprecated use `HTML_ENTITIES` instead
	* @see HTML_ENTITIES
	*/
	exports.entityMap = exports.HTML_ENTITIES;
}));
//#endregion
//#region node_modules/@xmldom/xmldom/lib/sax.js
var require_sax = /* @__PURE__ */ __commonJSMin(((exports) => {
	var NAMESPACE = require_conventions().NAMESPACE;
	var tagNamePattern = require_conventions().tagNamePattern;
	var S_TAG = 0;
	var S_ATTR = 1;
	var S_ATTR_SPACE = 2;
	var S_EQ = 3;
	var S_ATTR_NOQUOT_VALUE = 4;
	var S_ATTR_END = 5;
	var S_TAG_SPACE = 6;
	var S_TAG_CLOSE = 7;
	/**
	* Creates an error that will not be caught by XMLReader aka the SAX parser.
	*
	* @param {string} message
	* @param {any?} locator Optional, can provide details about the location in the source
	* @constructor
	*/
	function ParseError(message, locator) {
		this.message = message;
		this.locator = locator;
		if (Error.captureStackTrace) Error.captureStackTrace(this, ParseError);
	}
	ParseError.prototype = /* @__PURE__ */ new Error();
	ParseError.prototype.name = ParseError.name;
	function XMLReader() {}
	XMLReader.prototype = { parse: function(source, defaultNSMap, entityMap) {
		var domBuilder = this.domBuilder;
		domBuilder.startDocument();
		_copy(defaultNSMap, defaultNSMap = {});
		parse(source, defaultNSMap, entityMap, domBuilder, this.errorHandler);
		domBuilder.endDocument();
	} };
	function parse(source, defaultNSMapCopy, entityMap, domBuilder, errorHandler) {
		function fixedFromCharCode(code) {
			if (code > 65535) {
				code -= 65536;
				var surrogate1 = 55296 + (code >> 10), surrogate2 = 56320 + (code & 1023);
				return String.fromCharCode(surrogate1, surrogate2);
			} else return String.fromCharCode(code);
		}
		function entityReplacer(a) {
			var k = a.slice(1, -1);
			if (Object.hasOwnProperty.call(entityMap, k)) return entityMap[k];
			else if (k.charAt(0) === "#") return fixedFromCharCode(parseInt(k.substr(1).replace("x", "0x")));
			else {
				errorHandler.error("entity not found:" + a);
				return a;
			}
		}
		function appendText(end) {
			if (end > start) {
				var xt = source.substring(start, end).replace(/&#?\w+;/g, entityReplacer);
				locator && position(start);
				domBuilder.characters(xt, 0, end - start);
				start = end;
			}
		}
		function position(p, m) {
			while (p >= lineEnd && (m = linePattern.exec(source))) {
				lineStart = m.index;
				lineEnd = lineStart + m[0].length;
				locator.lineNumber++;
			}
			locator.columnNumber = p - lineStart + 1;
		}
		var lineStart = 0;
		var lineEnd = 0;
		var linePattern = /.*(?:\r\n?|\n)|.*$/g;
		var locator = domBuilder.locator;
		var parseStack = [{ currentNSMap: defaultNSMapCopy }];
		var closeMap = {};
		var start = 0;
		while (true) {
			try {
				var tagStart = source.indexOf("<", start);
				if (tagStart < 0) {
					if (!source.substr(start).match(/^\s*$/)) {
						var doc = domBuilder.doc;
						var text = doc.createTextNode(source.substr(start));
						doc.appendChild(text);
						domBuilder.currentElement = text;
					}
					return;
				}
				if (tagStart > start) appendText(tagStart);
				switch (source.charAt(tagStart + 1)) {
					case "/":
						var end = source.indexOf(">", tagStart + 3);
						var tagName = source.substring(tagStart + 2, end).replace(/^([\s\S]*?[^ \t\n\r])?[ \t\n\r]*$/, "$1");
						var config = parseStack.pop();
						if (end < 0) {
							tagName = source.substring(tagStart + 2).replace(/[\s<].*/, "");
							errorHandler.error("end tag name: " + tagName + " is not complete:" + config.tagName);
							end = tagStart + 1 + tagName.length;
						} else if (tagName.match(/\s</)) {
							tagName = tagName.replace(/[\s<].*/, "");
							errorHandler.error("end tag name: " + tagName + " maybe not complete");
							end = tagStart + 1 + tagName.length;
						} else if (/[ \t\n\r]/.test(tagName) && tagNamePattern.test(tagName.split(/[ \t\n\r]/)[0])) errorHandler.error("end tag name is followed by whitespace and trailing content: \"" + tagName + "\"");
						var localNSMap = config.localNSMap;
						var endMatch = config.tagName == tagName;
						if (endMatch || config.tagName && config.tagName.toLowerCase() == tagName.toLowerCase()) {
							domBuilder.endElement(config.uri, config.localName, tagName);
							if (localNSMap) {
								for (var prefix in localNSMap) if (Object.prototype.hasOwnProperty.call(localNSMap, prefix)) domBuilder.endPrefixMapping(prefix);
							}
							if (!endMatch) errorHandler.fatalError("end tag name: " + tagName + " is not match the current start tagName:" + config.tagName);
						} else parseStack.push(config);
						end++;
						break;
					case "?":
						locator && position(tagStart);
						end = parseInstruction(source, tagStart, domBuilder);
						break;
					case "!":
						locator && position(tagStart);
						end = parseDCC(source, tagStart, domBuilder, errorHandler);
						break;
					default:
						locator && position(tagStart);
						var el = new ElementAttributes();
						var currentNSMap = parseStack[parseStack.length - 1].currentNSMap;
						var end = parseElementStartPart(source, tagStart, el, currentNSMap, entityReplacer, errorHandler);
						var len = el.length;
						if (!el.closed && fixSelfClosed(source, end, el.tagName, closeMap)) {
							el.closed = true;
							if (!entityMap.nbsp) errorHandler.warning("unclosed xml attribute");
						}
						if (locator && len) {
							var locator2 = copyLocator(locator, {});
							for (var i = 0; i < len; i++) {
								var a = el[i];
								position(a.offset);
								a.locator = copyLocator(locator, {});
							}
							domBuilder.locator = locator2;
							if (appendElement(el, domBuilder, currentNSMap)) parseStack.push(el);
							domBuilder.locator = locator;
						} else if (appendElement(el, domBuilder, currentNSMap)) parseStack.push(el);
						if (NAMESPACE.isHTML(el.uri) && !el.closed) end = parseHtmlSpecialContent(source, end, el.tagName, entityReplacer, domBuilder);
						else end++;
				}
			} catch (e) {
				if (e instanceof ParseError) throw e;
				errorHandler.error("element parse error: " + e);
				end = -1;
			}
			if (end > start) start = end;
			else appendText(Math.max(tagStart, start) + 1);
		}
	}
	function copyLocator(f, t) {
		t.lineNumber = f.lineNumber;
		t.columnNumber = f.columnNumber;
		return t;
	}
	/**
	* @see #appendElement(source,elStartEnd,el,selfClosed,entityReplacer,domBuilder,parseStack);
	* @return end of the elementStartPart(end of elementEndPart for selfClosed el)
	*/
	function parseElementStartPart(source, start, el, currentNSMap, entityReplacer, errorHandler) {
		/**
		* @param {string} qname
		* @param {string} value
		* @param {number} startIndex
		*/
		function addAttribute(qname, value, startIndex) {
			if (el.attributeNames.hasOwnProperty(qname)) errorHandler.fatalError("Attribute " + qname + " redefined");
			el.addValue(qname, value.replace(/[\t\n\r]/g, " ").replace(/&#?\w+;/g, entityReplacer), startIndex);
		}
		var attrName;
		var value;
		var p = ++start;
		var s = S_TAG;
		while (true) {
			var c = source.charAt(p);
			if (s === S_TAG && c === "<") throw new Error("unexpected < in tag name: " + source.slice(start, p));
			switch (c) {
				case "=":
					if (s === S_ATTR) {
						attrName = source.slice(start, p);
						s = S_EQ;
					} else if (s === S_ATTR_SPACE) s = S_EQ;
					else throw new Error("attribute equal must after attrName");
					break;
				case "'":
				case "\"":
					if (s === S_EQ || s === S_ATTR) {
						if (s === S_ATTR) {
							errorHandler.warning("attribute value must after \"=\"");
							attrName = source.slice(start, p);
						}
						start = p + 1;
						p = source.indexOf(c, start);
						if (p > 0) {
							value = source.slice(start, p);
							addAttribute(attrName, value, start - 1);
							s = S_ATTR_END;
						} else throw new Error("attribute value no end '" + c + "' match");
					} else if (s == S_ATTR_NOQUOT_VALUE) {
						value = source.slice(start, p);
						addAttribute(attrName, value, start);
						errorHandler.warning("attribute \"" + attrName + "\" missed start quot(" + c + ")!!");
						start = p + 1;
						s = S_ATTR_END;
					} else throw new Error("attribute value must after \"=\"");
					break;
				case "/":
					switch (s) {
						case S_TAG: el.setTagName(source.slice(start, p));
						case S_ATTR_END:
						case S_TAG_SPACE:
						case S_TAG_CLOSE:
							s = S_TAG_CLOSE;
							el.closed = true;
						case S_ATTR_NOQUOT_VALUE:
						case S_ATTR: break;
						case S_ATTR_SPACE:
							el.closed = true;
							break;
						default: throw new Error("attribute invalid close char('/')");
					}
					break;
				case "":
					errorHandler.error("unexpected end of input");
					if (s == S_TAG) el.setTagName(source.slice(start, p));
					return p;
				case ">":
					switch (s) {
						case S_TAG: el.setTagName(source.slice(start, p));
						case S_ATTR_END:
						case S_TAG_SPACE:
						case S_TAG_CLOSE: break;
						case S_ATTR_NOQUOT_VALUE:
						case S_ATTR:
							value = source.slice(start, p);
							if (value.slice(-1) === "/") {
								el.closed = true;
								value = value.slice(0, -1);
							}
						case S_ATTR_SPACE:
							if (s === S_ATTR_SPACE) value = attrName;
							if (s == S_ATTR_NOQUOT_VALUE) {
								errorHandler.warning("attribute \"" + value + "\" missed quot(\")!");
								addAttribute(attrName, value, start);
							} else {
								if (!NAMESPACE.isHTML(currentNSMap[""]) || !value.match(/^(?:disabled|checked|selected)$/i)) errorHandler.warning("attribute \"" + value + "\" missed value!! \"" + value + "\" instead!!");
								addAttribute(value, value, start);
							}
							break;
						case S_EQ: throw new Error("attribute value missed!!");
					}
					return p;
				case "": c = " ";
				default: if (c <= " ") switch (s) {
					case S_TAG:
						el.setTagName(source.slice(start, p));
						s = S_TAG_SPACE;
						break;
					case S_ATTR:
						attrName = source.slice(start, p);
						s = S_ATTR_SPACE;
						break;
					case S_ATTR_NOQUOT_VALUE:
						var value = source.slice(start, p);
						errorHandler.warning("attribute \"" + value + "\" missed quot(\")!!");
						addAttribute(attrName, value, start);
					case S_ATTR_END: s = S_TAG_SPACE;
				}
				else switch (s) {
					case S_ATTR_SPACE:
						el.tagName;
						if (!NAMESPACE.isHTML(currentNSMap[""]) || !attrName.match(/^(?:disabled|checked|selected)$/i)) errorHandler.warning("attribute \"" + attrName + "\" missed value!! \"" + attrName + "\" instead2!!");
						addAttribute(attrName, attrName, start);
						start = p;
						s = S_ATTR;
						break;
					case S_ATTR_END: errorHandler.warning("attribute space is required\"" + attrName + "\"!!");
					case S_TAG_SPACE:
						s = S_ATTR;
						start = p;
						break;
					case S_EQ:
						s = S_ATTR_NOQUOT_VALUE;
						start = p;
						break;
					case S_TAG_CLOSE: throw new Error("elements closed character '/' and '>' must be connected to");
				}
			}
			p++;
		}
	}
	/**
	* @return true if has new namespace define
	*/
	function appendElement(el, domBuilder, currentNSMap) {
		var tagName = el.tagName;
		var localNSMap = null;
		var i = el.length;
		while (i--) {
			var a = el[i];
			var qName = a.qName;
			var value = a.value;
			var nsp = qName.indexOf(":");
			if (nsp > 0) {
				var prefix = a.prefix = qName.slice(0, nsp);
				var localName = qName.slice(nsp + 1);
				var nsPrefix = prefix === "xmlns" && localName;
			} else {
				localName = qName;
				prefix = null;
				nsPrefix = qName === "xmlns" && "";
			}
			a.localName = localName;
			if (nsPrefix !== false) {
				if (localNSMap == null) {
					localNSMap = {};
					currentNSMap = Object.create(currentNSMap);
				}
				currentNSMap[nsPrefix] = localNSMap[nsPrefix] = value;
				a.uri = NAMESPACE.XMLNS;
				domBuilder.startPrefixMapping(nsPrefix, value);
			}
		}
		var i = el.length;
		while (i--) {
			a = el[i];
			var prefix = a.prefix;
			if (prefix) {
				if (prefix === "xml") a.uri = NAMESPACE.XML;
				if (prefix !== "xmlns") a.uri = currentNSMap[prefix || ""];
			}
		}
		var nsp = tagName.indexOf(":");
		if (nsp > 0) {
			prefix = el.prefix = tagName.slice(0, nsp);
			localName = el.localName = tagName.slice(nsp + 1);
		} else {
			prefix = null;
			localName = el.localName = tagName;
		}
		var ns = el.uri = currentNSMap[prefix || ""];
		domBuilder.startElement(ns, localName, tagName, el);
		if (el.closed) {
			domBuilder.endElement(ns, localName, tagName);
			if (localNSMap) {
				for (prefix in localNSMap) if (Object.prototype.hasOwnProperty.call(localNSMap, prefix)) domBuilder.endPrefixMapping(prefix);
			}
		} else {
			el.currentNSMap = currentNSMap;
			el.localNSMap = localNSMap;
			return true;
		}
	}
	function parseHtmlSpecialContent(source, elStartEnd, tagName, entityReplacer, domBuilder) {
		if (/^(?:script|textarea)$/i.test(tagName)) {
			var elEndStart = source.indexOf("</" + tagName + ">", elStartEnd);
			var text = source.substring(elStartEnd + 1, elEndStart);
			if (/[&<]/.test(text)) {
				if (/^script$/i.test(tagName)) {
					domBuilder.characters(text, 0, text.length);
					return elEndStart;
				}
				text = text.replace(/&#?\w+;/g, entityReplacer);
				domBuilder.characters(text, 0, text.length);
				return elEndStart;
			}
		}
		return elStartEnd + 1;
	}
	function fixSelfClosed(source, elStartEnd, tagName, closeMap) {
		var pos = closeMap[tagName];
		if (pos == null) {
			pos = source.lastIndexOf("</" + tagName + ">");
			if (pos < elStartEnd) pos = source.lastIndexOf("</" + tagName);
			closeMap[tagName] = pos;
		}
		return pos < elStartEnd;
	}
	function _copy(source, target) {
		for (var n in source) if (Object.prototype.hasOwnProperty.call(source, n)) target[n] = source[n];
	}
	function parseDCC(source, start, domBuilder, errorHandler) {
		switch (source.charAt(start + 2)) {
			case "-": if (source.charAt(start + 3) === "-") {
				var end = source.indexOf("-->", start + 4);
				if (end > start) {
					domBuilder.comment(source, start + 4, end - start - 4);
					return end + 3;
				} else {
					errorHandler.error("Unclosed comment");
					return -1;
				}
			} else return -1;
			default:
				if (source.substr(start + 3, 6) == "CDATA[") {
					var end = source.indexOf("]]>", start + 9);
					domBuilder.startCDATA();
					domBuilder.characters(source, start + 9, end - start - 9);
					domBuilder.endCDATA();
					return end + 3;
				}
				var matchs = split(source, start);
				var len = matchs.length;
				if (len > 1 && /!doctype/i.test(matchs[0][0])) {
					var name = matchs[1][0];
					var pubid = false;
					var sysid = false;
					if (len > 3) {
						if (/^public$/i.test(matchs[2][0])) {
							pubid = matchs[3][0];
							sysid = len > 4 && matchs[4][0];
						} else if (/^system$/i.test(matchs[2][0])) sysid = matchs[3][0];
					}
					var lastMatch = matchs[len - 1];
					domBuilder.startDTD(name, pubid, sysid);
					domBuilder.endDTD();
					return lastMatch.index + lastMatch[0].length;
				}
		}
		return -1;
	}
	function parseInstruction(source, start, domBuilder) {
		var end = source.indexOf("?>", start);
		if (end) {
			var match = source.substring(start, end).match(/^<\?(\S*)\s*([\s\S]*?)$/);
			if (match) {
				match[0].length;
				domBuilder.processingInstruction(match[1], match[2]);
				return end + 2;
			} else return -1;
		}
		return -1;
	}
	function ElementAttributes() {
		this.attributeNames = {};
	}
	ElementAttributes.prototype = {
		setTagName: function(tagName) {
			if (!tagNamePattern.test(tagName)) throw new Error("invalid tagName:" + tagName);
			this.tagName = tagName;
		},
		addValue: function(qName, value, offset) {
			if (!tagNamePattern.test(qName)) throw new Error("invalid attribute:" + qName);
			this.attributeNames[qName] = this.length;
			this[this.length++] = {
				qName,
				value,
				offset
			};
		},
		length: 0,
		getLocalName: function(i) {
			return this[i].localName;
		},
		getLocator: function(i) {
			return this[i].locator;
		},
		getQName: function(i) {
			return this[i].qName;
		},
		getURI: function(i) {
			return this[i].uri;
		},
		getValue: function(i) {
			return this[i].value;
		}
	};
	function split(source, start) {
		var match;
		var buf = [];
		var reg = /'[^']+'|"[^"]+"|[^\s<>\/=]+=?|(\/?\s*>|<)/g;
		reg.lastIndex = start;
		reg.exec(source);
		while (match = reg.exec(source)) {
			buf.push(match);
			if (match[1]) return buf;
		}
	}
	exports.XMLReader = XMLReader;
	exports.ParseError = ParseError;
}));
//#endregion
//#region node_modules/@xmldom/xmldom/lib/dom-parser.js
var require_dom_parser = /* @__PURE__ */ __commonJSMin(((exports) => {
	var conventions = require_conventions();
	var dom = require_dom();
	var entities = require_entities();
	var sax = require_sax();
	var DOMImplementation = dom.DOMImplementation;
	var NAMESPACE = conventions.NAMESPACE;
	var ParseError = sax.ParseError;
	var XMLReader = sax.XMLReader;
	/**
	* Normalizes line ending according to https://www.w3.org/TR/xml11/#sec-line-ends:
	*
	* > XML parsed entities are often stored in computer files which,
	* > for editing convenience, are organized into lines.
	* > These lines are typically separated by some combination
	* > of the characters CARRIAGE RETURN (#xD) and LINE FEED (#xA).
	* >
	* > To simplify the tasks of applications, the XML processor must behave
	* > as if it normalized all line breaks in external parsed entities (including the document entity)
	* > on input, before parsing, by translating all of the following to a single #xA character:
	* >
	* > 1. the two-character sequence #xD #xA
	* > 2. the two-character sequence #xD #x85
	* > 3. the single character #x85
	* > 4. the single character #x2028
	* > 5. any #xD character that is not immediately followed by #xA or #x85.
	*
	* @param {string} input
	* @returns {string}
	*/
	function normalizeLineEndings(input) {
		return input.replace(/\r[\n\u0085]/g, "\n").replace(/[\r\u0085\u2028]/g, "\n");
	}
	/**
	* @typedef Locator
	* @property {number} [columnNumber]
	* @property {number} [lineNumber]
	*/
	/**
	* @typedef DOMParserOptions
	* @property {DOMHandler} [domBuilder]
	* @property {Function} [errorHandler]
	* @property {(string) => string} [normalizeLineEndings] used to replace line endings before parsing
	* 						defaults to `normalizeLineEndings`
	* @property {Locator} [locator]
	* @property {Record<string, string>} [xmlns]
	*
	* @see normalizeLineEndings
	*/
	/**
	* The DOMParser interface provides the ability to parse XML or HTML source code
	* from a string into a DOM `Document`.
	*
	* _xmldom is different from the spec in that it allows an `options` parameter,
	* to override the default behavior._
	*
	* @param {DOMParserOptions} [options]
	* @constructor
	*
	* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser
	* @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-parsing-and-serialization
	*/
	function DOMParser(options) {
		this.options = options || { locator: {} };
	}
	DOMParser.prototype.parseFromString = function(source, mimeType) {
		var options = this.options;
		var sax = new XMLReader();
		var domBuilder = options.domBuilder || new DOMHandler();
		var errorHandler = options.errorHandler;
		var locator = options.locator;
		var defaultNSMap = options.xmlns || {};
		var isHTML = /\/x?html?$/.test(mimeType);
		var entityMap = isHTML ? entities.HTML_ENTITIES : entities.XML_ENTITIES;
		if (locator) domBuilder.setDocumentLocator(locator);
		sax.errorHandler = buildErrorHandler(errorHandler, domBuilder, locator);
		sax.domBuilder = options.domBuilder || domBuilder;
		if (isHTML) defaultNSMap[""] = NAMESPACE.HTML;
		defaultNSMap.xml = defaultNSMap.xml || NAMESPACE.XML;
		var normalize = options.normalizeLineEndings || normalizeLineEndings;
		if (source && typeof source === "string") sax.parse(normalize(source), defaultNSMap, entityMap);
		else sax.errorHandler.error("invalid doc source");
		return domBuilder.doc;
	};
	function buildErrorHandler(errorImpl, domBuilder, locator) {
		if (!errorImpl) {
			if (domBuilder instanceof DOMHandler) return domBuilder;
			errorImpl = domBuilder;
		}
		var errorHandler = {};
		var isCallback = errorImpl instanceof Function;
		locator = locator || {};
		function build(key) {
			var fn = errorImpl[key];
			if (!fn && isCallback) fn = errorImpl.length == 2 ? function(msg) {
				errorImpl(key, msg);
			} : errorImpl;
			errorHandler[key] = fn && function(msg) {
				fn("[xmldom " + key + "]	" + msg + _locator(locator));
			} || function() {};
		}
		build("warning");
		build("error");
		build("fatalError");
		return errorHandler;
	}
	/**
	* +ContentHandler+ErrorHandler
	* +LexicalHandler+EntityResolver2
	* -DeclHandler-DTDHandler
	*
	* DefaultHandler:EntityResolver, DTDHandler, ContentHandler, ErrorHandler
	* DefaultHandler2:DefaultHandler,LexicalHandler, DeclHandler, EntityResolver2
	* @link http://www.saxproject.org/apidoc/org/xml/sax/helpers/DefaultHandler.html
	*/
	function DOMHandler() {
		this.cdata = false;
	}
	function position(locator, node) {
		node.lineNumber = locator.lineNumber;
		node.columnNumber = locator.columnNumber;
	}
	/**
	* @see org.xml.sax.ContentHandler#startDocument
	* @link http://www.saxproject.org/apidoc/org/xml/sax/ContentHandler.html
	*/
	DOMHandler.prototype = {
		startDocument: function() {
			this.doc = new DOMImplementation().createDocument(null, null, null);
			if (this.locator) this.doc.documentURI = this.locator.systemId;
		},
		startElement: function(namespaceURI, localName, qName, attrs) {
			var doc = this.doc;
			var el = doc.createElementNS(namespaceURI, qName || localName);
			var len = attrs.length;
			appendElement(this, el);
			this.currentElement = el;
			this.locator && position(this.locator, el);
			for (var i = 0; i < len; i++) {
				var namespaceURI = attrs.getURI(i);
				var value = attrs.getValue(i);
				var qName = attrs.getQName(i);
				var attr = doc.createAttributeNS(namespaceURI, qName);
				this.locator && position(attrs.getLocator(i), attr);
				attr.value = attr.nodeValue = value;
				el.setAttributeNode(attr);
			}
		},
		endElement: function(namespaceURI, localName, qName) {
			var current = this.currentElement;
			current.tagName;
			this.currentElement = current.parentNode;
		},
		startPrefixMapping: function(prefix, uri) {},
		endPrefixMapping: function(prefix) {},
		processingInstruction: function(target, data) {
			var ins = this.doc.createProcessingInstruction(target, data);
			this.locator && position(this.locator, ins);
			appendElement(this, ins);
		},
		ignorableWhitespace: function(ch, start, length) {},
		characters: function(chars, start, length) {
			chars = _toString.apply(this, arguments);
			if (chars) {
				if (this.cdata) var charNode = this.doc.createCDATASection(chars);
				else var charNode = this.doc.createTextNode(chars);
				if (this.currentElement) this.currentElement.appendChild(charNode);
				else if (/^\s*$/.test(chars)) this.doc.appendChild(charNode);
				this.locator && position(this.locator, charNode);
			}
		},
		skippedEntity: function(name) {},
		endDocument: function() {
			this.doc.normalize();
		},
		setDocumentLocator: function(locator) {
			if (this.locator = locator) locator.lineNumber = 0;
		},
		comment: function(chars, start, length) {
			chars = _toString.apply(this, arguments);
			var comm = this.doc.createComment(chars);
			this.locator && position(this.locator, comm);
			appendElement(this, comm);
		},
		startCDATA: function() {
			this.cdata = true;
		},
		endCDATA: function() {
			this.cdata = false;
		},
		startDTD: function(name, publicId, systemId) {
			var impl = this.doc.implementation;
			if (impl && impl.createDocumentType) {
				var dt = impl.createDocumentType(name, publicId, systemId);
				this.locator && position(this.locator, dt);
				appendElement(this, dt);
				this.doc.doctype = dt;
			}
		},
		/**
		* @see org.xml.sax.ErrorHandler
		* @link http://www.saxproject.org/apidoc/org/xml/sax/ErrorHandler.html
		*/
		warning: function(error) {
			console.warn("[xmldom warning]	" + error, _locator(this.locator));
		},
		error: function(error) {
			console.error("[xmldom error]	" + error, _locator(this.locator));
		},
		fatalError: function(error) {
			throw new ParseError(error, this.locator);
		}
	};
	function _locator(l) {
		if (l) return "\n@" + (l.systemId || "") + "#[line:" + l.lineNumber + ",col:" + l.columnNumber + "]";
	}
	function _toString(chars, start, length) {
		if (typeof chars == "string") return chars.substr(start, length);
		else {
			if (chars.length >= start + length || start) return new java.lang.String(chars, start, length) + "";
			return chars;
		}
	}
	"endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g, function(key) {
		DOMHandler.prototype[key] = function() {
			return null;
		};
	});
	function appendElement(hander, node) {
		if (!hander.currentElement) hander.doc.appendChild(node);
		else hander.currentElement.appendChild(node);
	}
	exports.__DOMHandler = DOMHandler;
	exports.normalizeLineEndings = normalizeLineEndings;
	exports.DOMParser = DOMParser;
}));
//#endregion
//#region node_modules/@xmldom/xmldom/lib/index.js
var require_lib = /* @__PURE__ */ __commonJSMin(((exports) => {
	var dom = require_dom();
	exports.DOMImplementation = dom.DOMImplementation;
	exports.XMLSerializer = dom.XMLSerializer;
	exports.DOMParser = require_dom_parser().DOMParser;
}));
//#endregion
export { require_lib as t };
