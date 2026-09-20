import { r as __toESM } from "../_runtime.mjs";
import { b as Stream, y as decodeB64ToUint8Array } from "./global+videojs__vhs-utils.mjs";
import { t as require_extends } from "./babel__runtime.mjs";
//#region node_modules/m3u8-parser/dist/m3u8-parser.es.js
/*! @name m3u8-parser @version 7.2.0 @license Apache-2.0 */
var import_extends = /* @__PURE__ */ __toESM(require_extends());
/**
* @file m3u8/line-stream.js
*/
/**
* A stream that buffers string input and generates a `data` event for each
* line.
*
* @class LineStream
* @extends Stream
*/
var LineStream = class extends Stream {
	constructor() {
		super();
		this.buffer = "";
	}
	/**
	* Add new data to be parsed.
	*
	* @param {string} data the text to process
	*/
	push(data) {
		let nextNewline;
		this.buffer += data;
		nextNewline = this.buffer.indexOf("\n");
		for (; nextNewline > -1; nextNewline = this.buffer.indexOf("\n")) {
			this.trigger("data", this.buffer.substring(0, nextNewline));
			this.buffer = this.buffer.substring(nextNewline + 1);
		}
	}
};
var TAB = String.fromCharCode(9);
var parseByterange = function(byterangeString) {
	const match = /([0-9.]*)?@?([0-9.]*)?/.exec(byterangeString || "");
	const result = {};
	if (match[1]) result.length = parseInt(match[1], 10);
	if (match[2]) result.offset = parseInt(match[2], 10);
	return result;
};
/**
* "forgiving" attribute list psuedo-grammar:
* attributes -> keyvalue (',' keyvalue)*
* keyvalue   -> key '=' value
* key        -> [^=]*
* value      -> '"' [^"]* '"' | [^,]*
*/
var attributeSeparator = function() {
	return /* @__PURE__ */ new RegExp("(?:^|,)((?:[^=]*)=(?:\"[^\"]*\"|[^,]*))");
};
/**
* Parse attributes from a line given the separator
*
* @param {string} attributes the attribute line to parse
*/
var parseAttributes = function(attributes) {
	const result = {};
	if (!attributes) return result;
	const attrs = attributes.split(attributeSeparator());
	let i = attrs.length;
	let attr;
	while (i--) {
		if (attrs[i] === "") continue;
		attr = /([^=]*)=(.*)/.exec(attrs[i]).slice(1);
		attr[0] = attr[0].replace(/^\s+|\s+$/g, "");
		attr[1] = attr[1].replace(/^\s+|\s+$/g, "");
		attr[1] = attr[1].replace(/^['"](.*)['"]$/g, "$1");
		result[attr[0]] = attr[1];
	}
	return result;
};
/**
* Converts a string into a resolution object
*
* @param {string} resolution a string such as 3840x2160
*
* @return {Object} An object representing the resolution
*
*/
var parseResolution = (resolution) => {
	const split = resolution.split("x");
	const result = {};
	if (split[0]) result.width = parseInt(split[0], 10);
	if (split[1]) result.height = parseInt(split[1], 10);
	return result;
};
/**
* A line-level M3U8 parser event stream. It expects to receive input one
* line at a time and performs a context-free parse of its contents. A stream
* interpretation of a manifest can be useful if the manifest is expected to
* be too large to fit comfortably into memory or the entirety of the input
* is not immediately available. Otherwise, it's probably much easier to work
* with a regular `Parser` object.
*
* Produces `data` events with an object that captures the parser's
* interpretation of the input. That object has a property `tag` that is one
* of `uri`, `comment`, or `tag`. URIs only have a single additional
* property, `line`, which captures the entirety of the input without
* interpretation. Comments similarly have a single additional property
* `text` which is the input without the leading `#`.
*
* Tags always have a property `tagType` which is the lower-cased version of
* the M3U8 directive without the `#EXT` or `#EXT-X-` prefix. For instance,
* `#EXT-X-MEDIA-SEQUENCE` becomes `media-sequence` when parsed. Unrecognized
* tags are given the tag type `unknown` and a single additional property
* `data` with the remainder of the input.
*
* @class ParseStream
* @extends Stream
*/
var ParseStream = class extends Stream {
	constructor() {
		super();
		this.customParsers = [];
		this.tagMappers = [];
	}
	/**
	* Parses an additional line of input.
	*
	* @param {string} line a single line of an M3U8 file to parse
	*/
	push(line) {
		let match;
		let event;
		line = line.trim();
		if (line.length === 0) return;
		if (line[0] !== "#") {
			this.trigger("data", {
				type: "uri",
				uri: line
			});
			return;
		}
		this.tagMappers.reduce((acc, mapper) => {
			const mappedLine = mapper(line);
			if (mappedLine === line) return acc;
			return acc.concat([mappedLine]);
		}, [line]).forEach((newLine) => {
			for (let i = 0; i < this.customParsers.length; i++) if (this.customParsers[i].call(this, newLine)) return;
			if (newLine.indexOf("#EXT") !== 0) {
				this.trigger("data", {
					type: "comment",
					text: newLine.slice(1)
				});
				return;
			}
			newLine = newLine.replace("\r", "");
			match = /^#EXTM3U/.exec(newLine);
			if (match) {
				this.trigger("data", {
					type: "tag",
					tagType: "m3u"
				});
				return;
			}
			match = /^#EXTINF:([0-9\.]*)?,?(.*)?$/.exec(newLine);
			if (match) {
				event = {
					type: "tag",
					tagType: "inf"
				};
				if (match[1]) event.duration = parseFloat(match[1]);
				if (match[2]) event.title = match[2];
				this.trigger("data", event);
				return;
			}
			match = /^#EXT-X-TARGETDURATION:([0-9.]*)?/.exec(newLine);
			if (match) {
				event = {
					type: "tag",
					tagType: "targetduration"
				};
				if (match[1]) event.duration = parseInt(match[1], 10);
				this.trigger("data", event);
				return;
			}
			match = /^#EXT-X-VERSION:([0-9.]*)?/.exec(newLine);
			if (match) {
				event = {
					type: "tag",
					tagType: "version"
				};
				if (match[1]) event.version = parseInt(match[1], 10);
				this.trigger("data", event);
				return;
			}
			match = /^#EXT-X-MEDIA-SEQUENCE:(\-?[0-9.]*)?/.exec(newLine);
			if (match) {
				event = {
					type: "tag",
					tagType: "media-sequence"
				};
				if (match[1]) event.number = parseInt(match[1], 10);
				this.trigger("data", event);
				return;
			}
			match = /^#EXT-X-DISCONTINUITY-SEQUENCE:(\-?[0-9.]*)?/.exec(newLine);
			if (match) {
				event = {
					type: "tag",
					tagType: "discontinuity-sequence"
				};
				if (match[1]) event.number = parseInt(match[1], 10);
				this.trigger("data", event);
				return;
			}
			match = /^#EXT-X-PLAYLIST-TYPE:(.*)?$/.exec(newLine);
			if (match) {
				event = {
					type: "tag",
					tagType: "playlist-type"
				};
				if (match[1]) event.playlistType = match[1];
				this.trigger("data", event);
				return;
			}
			match = /^#EXT-X-BYTERANGE:(.*)?$/.exec(newLine);
			if (match) {
				event = (0, import_extends.default)(parseByterange(match[1]), {
					type: "tag",
					tagType: "byterange"
				});
				this.trigger("data", event);
				return;
			}
			match = /^#EXT-X-ALLOW-CACHE:(YES|NO)?/.exec(newLine);
			if (match) {
				event = {
					type: "tag",
					tagType: "allow-cache"
				};
				if (match[1]) event.allowed = !/NO/.test(match[1]);
				this.trigger("data", event);
				return;
			}
			match = /^#EXT-X-MAP:(.*)$/.exec(newLine);
			if (match) {
				event = {
					type: "tag",
					tagType: "map"
				};
				if (match[1]) {
					const attributes = parseAttributes(match[1]);
					if (attributes.URI) event.uri = attributes.URI;
					if (attributes.BYTERANGE) event.byterange = parseByterange(attributes.BYTERANGE);
				}
				this.trigger("data", event);
				return;
			}
			match = /^#EXT-X-STREAM-INF:(.*)$/.exec(newLine);
			if (match) {
				event = {
					type: "tag",
					tagType: "stream-inf"
				};
				if (match[1]) {
					event.attributes = parseAttributes(match[1]);
					if (event.attributes.RESOLUTION) event.attributes.RESOLUTION = parseResolution(event.attributes.RESOLUTION);
					if (event.attributes.BANDWIDTH) event.attributes.BANDWIDTH = parseInt(event.attributes.BANDWIDTH, 10);
					if (event.attributes["FRAME-RATE"]) event.attributes["FRAME-RATE"] = parseFloat(event.attributes["FRAME-RATE"]);
					if (event.attributes["PROGRAM-ID"]) event.attributes["PROGRAM-ID"] = parseInt(event.attributes["PROGRAM-ID"], 10);
				}
				this.trigger("data", event);
				return;
			}
			match = /^#EXT-X-MEDIA:(.*)$/.exec(newLine);
			if (match) {
				event = {
					type: "tag",
					tagType: "media"
				};
				if (match[1]) event.attributes = parseAttributes(match[1]);
				this.trigger("data", event);
				return;
			}
			match = /^#EXT-X-ENDLIST/.exec(newLine);
			if (match) {
				this.trigger("data", {
					type: "tag",
					tagType: "endlist"
				});
				return;
			}
			match = /^#EXT-X-DISCONTINUITY/.exec(newLine);
			if (match) {
				this.trigger("data", {
					type: "tag",
					tagType: "discontinuity"
				});
				return;
			}
			match = /^#EXT-X-PROGRAM-DATE-TIME:(.*)$/.exec(newLine);
			if (match) {
				event = {
					type: "tag",
					tagType: "program-date-time"
				};
				if (match[1]) {
					event.dateTimeString = match[1];
					event.dateTimeObject = new Date(match[1]);
				}
				this.trigger("data", event);
				return;
			}
			match = /^#EXT-X-KEY:(.*)$/.exec(newLine);
			if (match) {
				event = {
					type: "tag",
					tagType: "key"
				};
				if (match[1]) {
					event.attributes = parseAttributes(match[1]);
					if (event.attributes.IV) {
						if (event.attributes.IV.substring(0, 2).toLowerCase() === "0x") event.attributes.IV = event.attributes.IV.substring(2);
						event.attributes.IV = event.attributes.IV.match(/.{8}/g);
						event.attributes.IV[0] = parseInt(event.attributes.IV[0], 16);
						event.attributes.IV[1] = parseInt(event.attributes.IV[1], 16);
						event.attributes.IV[2] = parseInt(event.attributes.IV[2], 16);
						event.attributes.IV[3] = parseInt(event.attributes.IV[3], 16);
						event.attributes.IV = new Uint32Array(event.attributes.IV);
					}
				}
				this.trigger("data", event);
				return;
			}
			match = /^#EXT-X-START:(.*)$/.exec(newLine);
			if (match) {
				event = {
					type: "tag",
					tagType: "start"
				};
				if (match[1]) {
					event.attributes = parseAttributes(match[1]);
					event.attributes["TIME-OFFSET"] = parseFloat(event.attributes["TIME-OFFSET"]);
					event.attributes.PRECISE = /YES/.test(event.attributes.PRECISE);
				}
				this.trigger("data", event);
				return;
			}
			match = /^#EXT-X-CUE-OUT-CONT:(.*)?$/.exec(newLine);
			if (match) {
				event = {
					type: "tag",
					tagType: "cue-out-cont"
				};
				if (match[1]) event.data = match[1];
				else event.data = "";
				this.trigger("data", event);
				return;
			}
			match = /^#EXT-X-CUE-OUT:(.*)?$/.exec(newLine);
			if (match) {
				event = {
					type: "tag",
					tagType: "cue-out"
				};
				if (match[1]) event.data = match[1];
				else event.data = "";
				this.trigger("data", event);
				return;
			}
			match = /^#EXT-X-CUE-IN:?(.*)?$/.exec(newLine);
			if (match) {
				event = {
					type: "tag",
					tagType: "cue-in"
				};
				if (match[1]) event.data = match[1];
				else event.data = "";
				this.trigger("data", event);
				return;
			}
			match = /^#EXT-X-SKIP:(.*)$/.exec(newLine);
			if (match && match[1]) {
				event = {
					type: "tag",
					tagType: "skip"
				};
				event.attributes = parseAttributes(match[1]);
				if (event.attributes.hasOwnProperty("SKIPPED-SEGMENTS")) event.attributes["SKIPPED-SEGMENTS"] = parseInt(event.attributes["SKIPPED-SEGMENTS"], 10);
				if (event.attributes.hasOwnProperty("RECENTLY-REMOVED-DATERANGES")) event.attributes["RECENTLY-REMOVED-DATERANGES"] = event.attributes["RECENTLY-REMOVED-DATERANGES"].split(TAB);
				this.trigger("data", event);
				return;
			}
			match = /^#EXT-X-PART:(.*)$/.exec(newLine);
			if (match && match[1]) {
				event = {
					type: "tag",
					tagType: "part"
				};
				event.attributes = parseAttributes(match[1]);
				["DURATION"].forEach(function(key) {
					if (event.attributes.hasOwnProperty(key)) event.attributes[key] = parseFloat(event.attributes[key]);
				});
				["INDEPENDENT", "GAP"].forEach(function(key) {
					if (event.attributes.hasOwnProperty(key)) event.attributes[key] = /YES/.test(event.attributes[key]);
				});
				if (event.attributes.hasOwnProperty("BYTERANGE")) event.attributes.byterange = parseByterange(event.attributes.BYTERANGE);
				this.trigger("data", event);
				return;
			}
			match = /^#EXT-X-SERVER-CONTROL:(.*)$/.exec(newLine);
			if (match && match[1]) {
				event = {
					type: "tag",
					tagType: "server-control"
				};
				event.attributes = parseAttributes(match[1]);
				[
					"CAN-SKIP-UNTIL",
					"PART-HOLD-BACK",
					"HOLD-BACK"
				].forEach(function(key) {
					if (event.attributes.hasOwnProperty(key)) event.attributes[key] = parseFloat(event.attributes[key]);
				});
				["CAN-SKIP-DATERANGES", "CAN-BLOCK-RELOAD"].forEach(function(key) {
					if (event.attributes.hasOwnProperty(key)) event.attributes[key] = /YES/.test(event.attributes[key]);
				});
				this.trigger("data", event);
				return;
			}
			match = /^#EXT-X-PART-INF:(.*)$/.exec(newLine);
			if (match && match[1]) {
				event = {
					type: "tag",
					tagType: "part-inf"
				};
				event.attributes = parseAttributes(match[1]);
				["PART-TARGET"].forEach(function(key) {
					if (event.attributes.hasOwnProperty(key)) event.attributes[key] = parseFloat(event.attributes[key]);
				});
				this.trigger("data", event);
				return;
			}
			match = /^#EXT-X-PRELOAD-HINT:(.*)$/.exec(newLine);
			if (match && match[1]) {
				event = {
					type: "tag",
					tagType: "preload-hint"
				};
				event.attributes = parseAttributes(match[1]);
				["BYTERANGE-START", "BYTERANGE-LENGTH"].forEach(function(key) {
					if (event.attributes.hasOwnProperty(key)) {
						event.attributes[key] = parseInt(event.attributes[key], 10);
						const subkey = key === "BYTERANGE-LENGTH" ? "length" : "offset";
						event.attributes.byterange = event.attributes.byterange || {};
						event.attributes.byterange[subkey] = event.attributes[key];
						delete event.attributes[key];
					}
				});
				this.trigger("data", event);
				return;
			}
			match = /^#EXT-X-RENDITION-REPORT:(.*)$/.exec(newLine);
			if (match && match[1]) {
				event = {
					type: "tag",
					tagType: "rendition-report"
				};
				event.attributes = parseAttributes(match[1]);
				["LAST-MSN", "LAST-PART"].forEach(function(key) {
					if (event.attributes.hasOwnProperty(key)) event.attributes[key] = parseInt(event.attributes[key], 10);
				});
				this.trigger("data", event);
				return;
			}
			match = /^#EXT-X-DATERANGE:(.*)$/.exec(newLine);
			if (match && match[1]) {
				event = {
					type: "tag",
					tagType: "daterange"
				};
				event.attributes = parseAttributes(match[1]);
				["ID", "CLASS"].forEach(function(key) {
					if (event.attributes.hasOwnProperty(key)) event.attributes[key] = String(event.attributes[key]);
				});
				["START-DATE", "END-DATE"].forEach(function(key) {
					if (event.attributes.hasOwnProperty(key)) event.attributes[key] = new Date(event.attributes[key]);
				});
				["DURATION", "PLANNED-DURATION"].forEach(function(key) {
					if (event.attributes.hasOwnProperty(key)) event.attributes[key] = parseFloat(event.attributes[key]);
				});
				["END-ON-NEXT"].forEach(function(key) {
					if (event.attributes.hasOwnProperty(key)) event.attributes[key] = /YES/i.test(event.attributes[key]);
				});
				[
					"SCTE35-CMD",
					" SCTE35-OUT",
					"SCTE35-IN"
				].forEach(function(key) {
					if (event.attributes.hasOwnProperty(key)) event.attributes[key] = event.attributes[key].toString(16);
				});
				const clientAttributePattern = /^X-([A-Z]+-)+[A-Z]+$/;
				for (const key in event.attributes) {
					if (!clientAttributePattern.test(key)) continue;
					const isHexaDecimal = /[0-9A-Fa-f]{6}/g.test(event.attributes[key]);
					const isDecimalFloating = /^\d+(\.\d+)?$/.test(event.attributes[key]);
					event.attributes[key] = isHexaDecimal ? event.attributes[key].toString(16) : isDecimalFloating ? parseFloat(event.attributes[key]) : String(event.attributes[key]);
				}
				this.trigger("data", event);
				return;
			}
			match = /^#EXT-X-INDEPENDENT-SEGMENTS/.exec(newLine);
			if (match) {
				this.trigger("data", {
					type: "tag",
					tagType: "independent-segments"
				});
				return;
			}
			match = /^#EXT-X-I-FRAMES-ONLY/.exec(newLine);
			if (match) {
				this.trigger("data", {
					type: "tag",
					tagType: "i-frames-only"
				});
				return;
			}
			match = /^#EXT-X-CONTENT-STEERING:(.*)$/.exec(newLine);
			if (match) {
				event = {
					type: "tag",
					tagType: "content-steering"
				};
				event.attributes = parseAttributes(match[1]);
				this.trigger("data", event);
				return;
			}
			match = /^#EXT-X-I-FRAME-STREAM-INF:(.*)$/.exec(newLine);
			if (match) {
				event = {
					type: "tag",
					tagType: "i-frame-playlist"
				};
				event.attributes = parseAttributes(match[1]);
				if (event.attributes.URI) event.uri = event.attributes.URI;
				if (event.attributes.BANDWIDTH) event.attributes.BANDWIDTH = parseInt(event.attributes.BANDWIDTH, 10);
				if (event.attributes.RESOLUTION) event.attributes.RESOLUTION = parseResolution(event.attributes.RESOLUTION);
				if (event.attributes["AVERAGE-BANDWIDTH"]) event.attributes["AVERAGE-BANDWIDTH"] = parseInt(event.attributes["AVERAGE-BANDWIDTH"], 10);
				if (event.attributes["FRAME-RATE"]) event.attributes["FRAME-RATE"] = parseFloat(event.attributes["FRAME-RATE"]);
				this.trigger("data", event);
				return;
			}
			match = /^#EXT-X-DEFINE:(.*)$/.exec(newLine);
			if (match) {
				event = {
					type: "tag",
					tagType: "define"
				};
				event.attributes = parseAttributes(match[1]);
				this.trigger("data", event);
				return;
			}
			this.trigger("data", {
				type: "tag",
				data: newLine.slice(4)
			});
		});
	}
	/**
	* Add a parser for custom headers
	*
	* @param {Object}   options              a map of options for the added parser
	* @param {RegExp}   options.expression   a regular expression to match the custom header
	* @param {string}   options.customType   the custom type to register to the output
	* @param {Function} [options.dataParser] function to parse the line into an object
	* @param {boolean}  [options.segment]    should tag data be attached to the segment object
	*/
	addParser({ expression, customType, dataParser, segment }) {
		if (typeof dataParser !== "function") dataParser = (line) => line;
		this.customParsers.push((line) => {
			if (expression.exec(line)) {
				this.trigger("data", {
					type: "custom",
					data: dataParser(line),
					customType,
					segment
				});
				return true;
			}
		});
	}
	/**
	* Add a custom header mapper
	*
	* @param {Object}   options
	* @param {RegExp}   options.expression   a regular expression to match the custom header
	* @param {Function} options.map          function to translate tag into a different tag
	*/
	addTagMapper({ expression, map }) {
		const mapFn = (line) => {
			if (expression.test(line)) return map(line);
			return line;
		};
		this.tagMappers.push(mapFn);
	}
};
var camelCase = (str) => str.toLowerCase().replace(/-(\w)/g, (a) => a[1].toUpperCase());
var camelCaseKeys = function(attributes) {
	const result = {};
	Object.keys(attributes).forEach(function(key) {
		result[camelCase(key)] = attributes[key];
	});
	return result;
};
var setHoldBack = function(manifest) {
	const { serverControl, targetDuration, partTargetDuration } = manifest;
	if (!serverControl) return;
	const tag = "#EXT-X-SERVER-CONTROL";
	const hb = "holdBack";
	const phb = "partHoldBack";
	const minTargetDuration = targetDuration && targetDuration * 3;
	const minPartDuration = partTargetDuration && partTargetDuration * 2;
	if (targetDuration && !serverControl.hasOwnProperty(hb)) {
		serverControl[hb] = minTargetDuration;
		this.trigger("info", { message: `${tag} defaulting HOLD-BACK to targetDuration * 3 (${minTargetDuration}).` });
	}
	if (minTargetDuration && serverControl[hb] < minTargetDuration) {
		this.trigger("warn", { message: `${tag} clamping HOLD-BACK (${serverControl[hb]}) to targetDuration * 3 (${minTargetDuration})` });
		serverControl[hb] = minTargetDuration;
	}
	if (partTargetDuration && !serverControl.hasOwnProperty(phb)) {
		serverControl[phb] = partTargetDuration * 3;
		this.trigger("info", { message: `${tag} defaulting PART-HOLD-BACK to partTargetDuration * 3 (${serverControl[phb]}).` });
	}
	if (partTargetDuration && serverControl[phb] < minPartDuration) {
		this.trigger("warn", { message: `${tag} clamping PART-HOLD-BACK (${serverControl[phb]}) to partTargetDuration * 2 (${minPartDuration}).` });
		serverControl[phb] = minPartDuration;
	}
};
/**
* A parser for M3U8 files. The current interpretation of the input is
* exposed as a property `manifest` on parser objects. It's just two lines to
* create and parse a manifest once you have the contents available as a string:
*
* ```js
* var parser = new m3u8.Parser();
* parser.push(xhr.responseText);
* ```
*
* New input can later be applied to update the manifest object by calling
* `push` again.
*
* The parser attempts to create a usable manifest object even if the
* underlying input is somewhat nonsensical. It emits `info` and `warning`
* events during the parse if it encounters input that seems invalid or
* requires some property of the manifest object to be defaulted.
*
* @class Parser
* @param {Object} [opts] Options for the constructor, needed for substitutions
* @param {string} [opts.uri] URL to check for query params
* @param {Object} [opts.mainDefinitions] Definitions on main playlist that can be imported
* @extends Stream
*/
var Parser = class extends Stream {
	constructor(opts = {}) {
		super();
		this.lineStream = new LineStream();
		this.parseStream = new ParseStream();
		this.lineStream.pipe(this.parseStream);
		this.mainDefinitions = opts.mainDefinitions || {};
		this.params = new URL(opts.uri, "https://a.com").searchParams;
		this.lastProgramDateTime = null;
		const self = this;
		const uris = [];
		let currentUri = {};
		let currentMap;
		let key;
		let hasParts = false;
		const noop = function() {};
		const defaultMediaGroups = {
			"AUDIO": {},
			"VIDEO": {},
			"CLOSED-CAPTIONS": {},
			"SUBTITLES": {}
		};
		const widevineUuid = "urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed";
		let currentTimeline = 0;
		this.manifest = {
			allowCache: true,
			discontinuityStarts: [],
			dateRanges: [],
			iFramePlaylists: [],
			segments: []
		};
		let lastByterangeEnd = 0;
		let lastPartByterangeEnd = 0;
		const dateRangeTags = {};
		this.on("end", () => {
			if (currentUri.uri || !currentUri.parts && !currentUri.preloadHints) return;
			if (!currentUri.map && currentMap) currentUri.map = currentMap;
			if (!currentUri.key && key) currentUri.key = key;
			if (!currentUri.timeline && typeof currentTimeline === "number") currentUri.timeline = currentTimeline;
			this.manifest.preloadSegment = currentUri;
		});
		this.parseStream.on("data", function(entry) {
			let mediaGroup;
			let rendition;
			if (self.manifest.definitions) for (const def in self.manifest.definitions) {
				if (entry.uri) entry.uri = entry.uri.replace(`{$${def}}`, self.manifest.definitions[def]);
				if (entry.attributes) {
					for (const attr in entry.attributes) if (typeof entry.attributes[attr] === "string") entry.attributes[attr] = entry.attributes[attr].replace(`{$${def}}`, self.manifest.definitions[def]);
				}
			}
			({
				tag() {
					({
						version() {
							if (entry.version) this.manifest.version = entry.version;
						},
						"allow-cache"() {
							this.manifest.allowCache = entry.allowed;
							if (!("allowed" in entry)) {
								this.trigger("info", { message: "defaulting allowCache to YES" });
								this.manifest.allowCache = true;
							}
						},
						byterange() {
							const byterange = {};
							if ("length" in entry) {
								currentUri.byterange = byterange;
								byterange.length = entry.length;
								if (!("offset" in entry)) entry.offset = lastByterangeEnd;
							}
							if ("offset" in entry) {
								currentUri.byterange = byterange;
								byterange.offset = entry.offset;
							}
							lastByterangeEnd = byterange.offset + byterange.length;
						},
						endlist() {
							this.manifest.endList = true;
						},
						inf() {
							if (!("mediaSequence" in this.manifest)) {
								this.manifest.mediaSequence = 0;
								this.trigger("info", { message: "defaulting media sequence to zero" });
							}
							if (!("discontinuitySequence" in this.manifest)) {
								this.manifest.discontinuitySequence = 0;
								this.trigger("info", { message: "defaulting discontinuity sequence to zero" });
							}
							if (entry.title) currentUri.title = entry.title;
							if (entry.duration > 0) currentUri.duration = entry.duration;
							if (entry.duration === 0) {
								currentUri.duration = .01;
								this.trigger("info", { message: "updating zero segment duration to a small value" });
							}
							this.manifest.segments = uris;
						},
						key() {
							if (!entry.attributes) {
								this.trigger("warn", { message: "ignoring key declaration without attribute list" });
								return;
							}
							if (entry.attributes.METHOD === "NONE") {
								key = null;
								return;
							}
							if (!entry.attributes.URI) {
								this.trigger("warn", { message: "ignoring key declaration without URI" });
								return;
							}
							if (entry.attributes.KEYFORMAT === "com.apple.streamingkeydelivery") {
								this.manifest.contentProtection = this.manifest.contentProtection || {};
								this.manifest.contentProtection["com.apple.fps.1_0"] = { attributes: entry.attributes };
								return;
							}
							if (entry.attributes.KEYFORMAT === "com.microsoft.playready") {
								this.manifest.contentProtection = this.manifest.contentProtection || {};
								this.manifest.contentProtection["com.microsoft.playready"] = { uri: entry.attributes.URI };
								return;
							}
							if (entry.attributes.KEYFORMAT === widevineUuid) {
								if ([
									"SAMPLE-AES",
									"SAMPLE-AES-CTR",
									"SAMPLE-AES-CENC"
								].indexOf(entry.attributes.METHOD) === -1) {
									this.trigger("warn", { message: "invalid key method provided for Widevine" });
									return;
								}
								if (entry.attributes.METHOD === "SAMPLE-AES-CENC") this.trigger("warn", { message: "SAMPLE-AES-CENC is deprecated, please use SAMPLE-AES-CTR instead" });
								if (entry.attributes.URI.substring(0, 23) !== "data:text/plain;base64,") {
									this.trigger("warn", { message: "invalid key URI provided for Widevine" });
									return;
								}
								if (!(entry.attributes.KEYID && entry.attributes.KEYID.substring(0, 2) === "0x")) {
									this.trigger("warn", { message: "invalid key ID provided for Widevine" });
									return;
								}
								this.manifest.contentProtection = this.manifest.contentProtection || {};
								this.manifest.contentProtection["com.widevine.alpha"] = {
									attributes: {
										schemeIdUri: entry.attributes.KEYFORMAT,
										keyId: entry.attributes.KEYID.substring(2)
									},
									pssh: decodeB64ToUint8Array(entry.attributes.URI.split(",")[1])
								};
								return;
							}
							if (!entry.attributes.METHOD) this.trigger("warn", { message: "defaulting key method to AES-128" });
							key = {
								method: entry.attributes.METHOD || "AES-128",
								uri: entry.attributes.URI
							};
							if (typeof entry.attributes.IV !== "undefined") key.iv = entry.attributes.IV;
						},
						"media-sequence"() {
							if (!isFinite(entry.number)) {
								this.trigger("warn", { message: "ignoring invalid media sequence: " + entry.number });
								return;
							}
							this.manifest.mediaSequence = entry.number;
						},
						"discontinuity-sequence"() {
							if (!isFinite(entry.number)) {
								this.trigger("warn", { message: "ignoring invalid discontinuity sequence: " + entry.number });
								return;
							}
							this.manifest.discontinuitySequence = entry.number;
							currentTimeline = entry.number;
						},
						"playlist-type"() {
							if (!/VOD|EVENT/.test(entry.playlistType)) {
								this.trigger("warn", { message: "ignoring unknown playlist type: " + entry.playlist });
								return;
							}
							this.manifest.playlistType = entry.playlistType;
						},
						map() {
							currentMap = {};
							if (entry.uri) currentMap.uri = entry.uri;
							if (entry.byterange) currentMap.byterange = entry.byterange;
							if (key) currentMap.key = key;
						},
						"stream-inf"() {
							this.manifest.playlists = uris;
							this.manifest.mediaGroups = this.manifest.mediaGroups || defaultMediaGroups;
							if (!entry.attributes) {
								this.trigger("warn", { message: "ignoring empty stream-inf attributes" });
								return;
							}
							if (!currentUri.attributes) currentUri.attributes = {};
							(0, import_extends.default)(currentUri.attributes, entry.attributes);
						},
						media() {
							this.manifest.mediaGroups = this.manifest.mediaGroups || defaultMediaGroups;
							if (!(entry.attributes && entry.attributes.TYPE && entry.attributes["GROUP-ID"] && entry.attributes.NAME)) {
								this.trigger("warn", { message: "ignoring incomplete or missing media group" });
								return;
							}
							const mediaGroupType = this.manifest.mediaGroups[entry.attributes.TYPE];
							mediaGroupType[entry.attributes["GROUP-ID"]] = mediaGroupType[entry.attributes["GROUP-ID"]] || {};
							mediaGroup = mediaGroupType[entry.attributes["GROUP-ID"]];
							rendition = { default: /yes/i.test(entry.attributes.DEFAULT) };
							if (rendition.default) rendition.autoselect = true;
							else rendition.autoselect = /yes/i.test(entry.attributes.AUTOSELECT);
							if (entry.attributes.LANGUAGE) rendition.language = entry.attributes.LANGUAGE;
							if (entry.attributes.URI) rendition.uri = entry.attributes.URI;
							if (entry.attributes["INSTREAM-ID"]) rendition.instreamId = entry.attributes["INSTREAM-ID"];
							if (entry.attributes.CHARACTERISTICS) rendition.characteristics = entry.attributes.CHARACTERISTICS;
							if (entry.attributes.FORCED) rendition.forced = /yes/i.test(entry.attributes.FORCED);
							mediaGroup[entry.attributes.NAME] = rendition;
						},
						discontinuity() {
							currentTimeline += 1;
							currentUri.discontinuity = true;
							this.manifest.discontinuityStarts.push(uris.length);
						},
						"program-date-time"() {
							if (typeof this.manifest.dateTimeString === "undefined") {
								this.manifest.dateTimeString = entry.dateTimeString;
								this.manifest.dateTimeObject = entry.dateTimeObject;
							}
							currentUri.dateTimeString = entry.dateTimeString;
							currentUri.dateTimeObject = entry.dateTimeObject;
							const { lastProgramDateTime } = this;
							this.lastProgramDateTime = new Date(entry.dateTimeString).getTime();
							if (lastProgramDateTime === null) this.manifest.segments.reduceRight((programDateTime, segment) => {
								segment.programDateTime = programDateTime - segment.duration * 1e3;
								return segment.programDateTime;
							}, this.lastProgramDateTime);
						},
						targetduration() {
							if (!isFinite(entry.duration) || entry.duration < 0) {
								this.trigger("warn", { message: "ignoring invalid target duration: " + entry.duration });
								return;
							}
							this.manifest.targetDuration = entry.duration;
							setHoldBack.call(this, this.manifest);
						},
						start() {
							if (!entry.attributes || isNaN(entry.attributes["TIME-OFFSET"])) {
								this.trigger("warn", { message: "ignoring start declaration without appropriate attribute list" });
								return;
							}
							this.manifest.start = {
								timeOffset: entry.attributes["TIME-OFFSET"],
								precise: entry.attributes.PRECISE
							};
						},
						"cue-out"() {
							currentUri.cueOut = entry.data;
						},
						"cue-out-cont"() {
							currentUri.cueOutCont = entry.data;
						},
						"cue-in"() {
							currentUri.cueIn = entry.data;
						},
						"skip"() {
							this.manifest.skip = camelCaseKeys(entry.attributes);
							this.warnOnMissingAttributes_("#EXT-X-SKIP", entry.attributes, ["SKIPPED-SEGMENTS"]);
						},
						"part"() {
							hasParts = true;
							const segmentIndex = this.manifest.segments.length;
							const part = camelCaseKeys(entry.attributes);
							currentUri.parts = currentUri.parts || [];
							currentUri.parts.push(part);
							if (part.byterange) {
								if (!part.byterange.hasOwnProperty("offset")) part.byterange.offset = lastPartByterangeEnd;
								lastPartByterangeEnd = part.byterange.offset + part.byterange.length;
							}
							const partIndex = currentUri.parts.length - 1;
							this.warnOnMissingAttributes_(`#EXT-X-PART #${partIndex} for segment #${segmentIndex}`, entry.attributes, ["URI", "DURATION"]);
							if (this.manifest.renditionReports) this.manifest.renditionReports.forEach((r, i) => {
								if (!r.hasOwnProperty("lastPart")) this.trigger("warn", { message: `#EXT-X-RENDITION-REPORT #${i} lacks required attribute(s): LAST-PART` });
							});
						},
						"server-control"() {
							const attrs = this.manifest.serverControl = camelCaseKeys(entry.attributes);
							if (!attrs.hasOwnProperty("canBlockReload")) {
								attrs.canBlockReload = false;
								this.trigger("info", { message: "#EXT-X-SERVER-CONTROL defaulting CAN-BLOCK-RELOAD to false" });
							}
							setHoldBack.call(this, this.manifest);
							if (attrs.canSkipDateranges && !attrs.hasOwnProperty("canSkipUntil")) this.trigger("warn", { message: "#EXT-X-SERVER-CONTROL lacks required attribute CAN-SKIP-UNTIL which is required when CAN-SKIP-DATERANGES is set" });
						},
						"preload-hint"() {
							const segmentIndex = this.manifest.segments.length;
							const hint = camelCaseKeys(entry.attributes);
							const isPart = hint.type && hint.type === "PART";
							currentUri.preloadHints = currentUri.preloadHints || [];
							currentUri.preloadHints.push(hint);
							if (hint.byterange) {
								if (!hint.byterange.hasOwnProperty("offset")) {
									hint.byterange.offset = isPart ? lastPartByterangeEnd : 0;
									if (isPart) lastPartByterangeEnd = hint.byterange.offset + hint.byterange.length;
								}
							}
							const index = currentUri.preloadHints.length - 1;
							this.warnOnMissingAttributes_(`#EXT-X-PRELOAD-HINT #${index} for segment #${segmentIndex}`, entry.attributes, ["TYPE", "URI"]);
							if (!hint.type) return;
							for (let i = 0; i < currentUri.preloadHints.length - 1; i++) {
								const otherHint = currentUri.preloadHints[i];
								if (!otherHint.type) continue;
								if (otherHint.type === hint.type) this.trigger("warn", { message: `#EXT-X-PRELOAD-HINT #${index} for segment #${segmentIndex} has the same TYPE ${hint.type} as preload hint #${i}` });
							}
						},
						"rendition-report"() {
							const report = camelCaseKeys(entry.attributes);
							this.manifest.renditionReports = this.manifest.renditionReports || [];
							this.manifest.renditionReports.push(report);
							const index = this.manifest.renditionReports.length - 1;
							const required = ["LAST-MSN", "URI"];
							if (hasParts) required.push("LAST-PART");
							this.warnOnMissingAttributes_(`#EXT-X-RENDITION-REPORT #${index}`, entry.attributes, required);
						},
						"part-inf"() {
							this.manifest.partInf = camelCaseKeys(entry.attributes);
							this.warnOnMissingAttributes_("#EXT-X-PART-INF", entry.attributes, ["PART-TARGET"]);
							if (this.manifest.partInf.partTarget) this.manifest.partTargetDuration = this.manifest.partInf.partTarget;
							setHoldBack.call(this, this.manifest);
						},
						"daterange"() {
							this.manifest.dateRanges.push(camelCaseKeys(entry.attributes));
							const index = this.manifest.dateRanges.length - 1;
							this.warnOnMissingAttributes_(`#EXT-X-DATERANGE #${index}`, entry.attributes, ["ID", "START-DATE"]);
							const dateRange = this.manifest.dateRanges[index];
							if (dateRange.endDate && dateRange.startDate && new Date(dateRange.endDate) < new Date(dateRange.startDate)) this.trigger("warn", { message: "EXT-X-DATERANGE END-DATE must be equal to or later than the value of the START-DATE" });
							if (dateRange.duration && dateRange.duration < 0) this.trigger("warn", { message: "EXT-X-DATERANGE DURATION must not be negative" });
							if (dateRange.plannedDuration && dateRange.plannedDuration < 0) this.trigger("warn", { message: "EXT-X-DATERANGE PLANNED-DURATION must not be negative" });
							const endOnNextYes = !!dateRange.endOnNext;
							if (endOnNextYes && !dateRange.class) this.trigger("warn", { message: "EXT-X-DATERANGE with an END-ON-NEXT=YES attribute must have a CLASS attribute" });
							if (endOnNextYes && (dateRange.duration || dateRange.endDate)) this.trigger("warn", { message: "EXT-X-DATERANGE with an END-ON-NEXT=YES attribute must not contain DURATION or END-DATE attributes" });
							if (dateRange.duration && dateRange.endDate) {
								const newDateInSeconds = dateRange.startDate.getTime() + dateRange.duration * 1e3;
								this.manifest.dateRanges[index].endDate = new Date(newDateInSeconds);
							}
							if (!dateRangeTags[dateRange.id]) dateRangeTags[dateRange.id] = dateRange;
							else {
								for (const attribute in dateRangeTags[dateRange.id]) if (!!dateRange[attribute] && JSON.stringify(dateRangeTags[dateRange.id][attribute]) !== JSON.stringify(dateRange[attribute])) {
									this.trigger("warn", { message: "EXT-X-DATERANGE tags with the same ID in a playlist must have the same attributes values" });
									break;
								}
								const dateRangeWithSameId = this.manifest.dateRanges.findIndex((dateRangeToFind) => dateRangeToFind.id === dateRange.id);
								this.manifest.dateRanges[dateRangeWithSameId] = (0, import_extends.default)(this.manifest.dateRanges[dateRangeWithSameId], dateRange);
								dateRangeTags[dateRange.id] = (0, import_extends.default)(dateRangeTags[dateRange.id], dateRange);
								this.manifest.dateRanges.pop();
							}
						},
						"independent-segments"() {
							this.manifest.independentSegments = true;
						},
						"i-frames-only"() {
							this.manifest.iFramesOnly = true;
							this.requiredCompatibilityversion(this.manifest.version, 4);
						},
						"content-steering"() {
							this.manifest.contentSteering = camelCaseKeys(entry.attributes);
							this.warnOnMissingAttributes_("#EXT-X-CONTENT-STEERING", entry.attributes, ["SERVER-URI"]);
						},
						/** @this {Parser} */
						define() {
							this.manifest.definitions = this.manifest.definitions || {};
							const addDef = (n, v) => {
								if (n in this.manifest.definitions) {
									this.trigger("error", { message: `EXT-X-DEFINE: Duplicate name ${n}` });
									return;
								}
								this.manifest.definitions[n] = v;
							};
							if ("QUERYPARAM" in entry.attributes) {
								if ("NAME" in entry.attributes || "IMPORT" in entry.attributes) {
									this.trigger("error", { message: "EXT-X-DEFINE: Invalid attributes" });
									return;
								}
								const val = this.params.get(entry.attributes.QUERYPARAM);
								if (!val) {
									this.trigger("error", { message: `EXT-X-DEFINE: No query param ${entry.attributes.QUERYPARAM}` });
									return;
								}
								addDef(entry.attributes.QUERYPARAM, decodeURIComponent(val));
								return;
							}
							if ("NAME" in entry.attributes) {
								if ("IMPORT" in entry.attributes) {
									this.trigger("error", { message: "EXT-X-DEFINE: Invalid attributes" });
									return;
								}
								if (!("VALUE" in entry.attributes) || typeof entry.attributes.VALUE !== "string") {
									this.trigger("error", { message: `EXT-X-DEFINE: No value for ${entry.attributes.NAME}` });
									return;
								}
								addDef(entry.attributes.NAME, entry.attributes.VALUE);
								return;
							}
							if ("IMPORT" in entry.attributes) {
								if (!this.mainDefinitions[entry.attributes.IMPORT]) {
									this.trigger("error", { message: `EXT-X-DEFINE: No value ${entry.attributes.IMPORT} to import, or IMPORT used on main playlist` });
									return;
								}
								addDef(entry.attributes.IMPORT, this.mainDefinitions[entry.attributes.IMPORT]);
								return;
							}
							this.trigger("error", { message: "EXT-X-DEFINE: No attribute" });
						},
						"i-frame-playlist"() {
							this.manifest.iFramePlaylists.push({
								attributes: entry.attributes,
								uri: entry.uri,
								timeline: currentTimeline
							});
							this.warnOnMissingAttributes_("#EXT-X-I-FRAME-STREAM-INF", entry.attributes, ["BANDWIDTH", "URI"]);
						}
					}[entry.tagType] || noop).call(self);
				},
				uri() {
					currentUri.uri = entry.uri;
					uris.push(currentUri);
					if (this.manifest.targetDuration && !("duration" in currentUri)) {
						this.trigger("warn", { message: "defaulting segment duration to the target duration" });
						currentUri.duration = this.manifest.targetDuration;
					}
					if (key) currentUri.key = key;
					currentUri.timeline = currentTimeline;
					if (currentMap) currentUri.map = currentMap;
					lastPartByterangeEnd = 0;
					if (this.lastProgramDateTime !== null) {
						currentUri.programDateTime = this.lastProgramDateTime;
						this.lastProgramDateTime += currentUri.duration * 1e3;
					}
					currentUri = {};
				},
				comment() {},
				custom() {
					if (entry.segment) {
						currentUri.custom = currentUri.custom || {};
						currentUri.custom[entry.customType] = entry.data;
					} else {
						this.manifest.custom = this.manifest.custom || {};
						this.manifest.custom[entry.customType] = entry.data;
					}
				}
			})[entry.type].call(self);
		});
	}
	requiredCompatibilityversion(currentVersion, targetVersion) {
		if (currentVersion < targetVersion || !currentVersion) this.trigger("warn", { message: `manifest must be at least version ${targetVersion}` });
	}
	warnOnMissingAttributes_(identifier, attributes, required) {
		const missing = [];
		required.forEach(function(key) {
			if (!attributes.hasOwnProperty(key)) missing.push(key);
		});
		if (missing.length) this.trigger("warn", { message: `${identifier} lacks required attribute(s): ${missing.join(", ")}` });
	}
	/**
	* Parse the input string and update the manifest object.
	*
	* @param {string} chunk a potentially incomplete portion of the manifest
	*/
	push(chunk) {
		this.lineStream.push(chunk);
	}
	/**
	* Flush any remaining input. This can be handy if the last line of an M3U8
	* manifest did not contain a trailing newline but the file has been
	* completely received.
	*/
	end() {
		this.lineStream.push("\n");
		if (this.manifest.dateRanges.length && this.lastProgramDateTime === null) this.trigger("warn", { message: "A playlist with EXT-X-DATERANGE tag must contain atleast one EXT-X-PROGRAM-DATE-TIME tag" });
		this.lastProgramDateTime = null;
		this.trigger("end");
	}
	/**
	* Add an additional parser for non-standard tags
	*
	* @param {Object}   options              a map of options for the added parser
	* @param {RegExp}   options.expression   a regular expression to match the custom header
	* @param {string}   options.customType   the custom type to register to the output
	* @param {Function} [options.dataParser] function to parse the line into an object
	* @param {boolean}  [options.segment]    should tag data be attached to the segment object
	*/
	addParser(options) {
		this.parseStream.addParser(options);
	}
	/**
	* Add a custom header mapper
	*
	* @param {Object}   options
	* @param {RegExp}   options.expression   a regular expression to match the custom header
	* @param {Function} options.map          function to translate tag into a different tag
	*/
	addTagMapper(options) {
		this.parseStream.addTagMapper(options);
	}
};
//#endregion
export { Parser as t };
