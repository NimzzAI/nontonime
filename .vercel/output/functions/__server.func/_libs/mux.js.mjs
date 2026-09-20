import { t as __commonJSMin } from "../_runtime.mjs";
//#region node_modules/mux.js/lib/utils/numbers.js
var require_numbers = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var MAX_UINT32 = Math.pow(2, 32);
	var getUint64 = function(uint8) {
		var dv = new DataView(uint8.buffer, uint8.byteOffset, uint8.byteLength);
		var value;
		if (dv.getBigUint64) {
			value = dv.getBigUint64(0);
			if (value < Number.MAX_SAFE_INTEGER) return Number(value);
			return value;
		}
		return dv.getUint32(0) * MAX_UINT32 + dv.getUint32(4);
	};
	module.exports = {
		getUint64,
		MAX_UINT32
	};
}));
//#endregion
//#region node_modules/mux.js/lib/tools/parse-sidx.js
var require_parse_sidx = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var getUint64 = require_numbers().getUint64;
	var parseSidx = function(data) {
		var view = new DataView(data.buffer, data.byteOffset, data.byteLength), result = {
			version: data[0],
			flags: new Uint8Array(data.subarray(1, 4)),
			references: [],
			referenceId: view.getUint32(4),
			timescale: view.getUint32(8)
		}, i = 12;
		if (result.version === 0) {
			result.earliestPresentationTime = view.getUint32(i);
			result.firstOffset = view.getUint32(i + 4);
			i += 8;
		} else {
			result.earliestPresentationTime = getUint64(data.subarray(i));
			result.firstOffset = getUint64(data.subarray(i + 8));
			i += 16;
		}
		i += 2;
		var referenceCount = view.getUint16(i);
		i += 2;
		for (; referenceCount > 0; i += 12, referenceCount--) result.references.push({
			referenceType: (data[i] & 128) >>> 7,
			referencedSize: view.getUint32(i) & 2147483647,
			subsegmentDuration: view.getUint32(i + 4),
			startsWithSap: !!(data[i + 8] & 128),
			sapType: (data[i + 8] & 112) >>> 4,
			sapDeltaTime: view.getUint32(i + 8) & 268435455
		});
		return result;
	};
	module.exports = parseSidx;
}));
//#endregion
//#region node_modules/mux.js/lib/utils/clock.js
var require_clock = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* mux.js
	*
	* Copyright (c) Brightcove
	* Licensed Apache-2.0 https://github.com/videojs/mux.js/blob/master/LICENSE
	*/
	var ONE_SECOND_IN_TS = 9e4;
	var secondsToVideoTs = function(seconds) {
		return seconds * ONE_SECOND_IN_TS;
	};
	var secondsToAudioTs = function(seconds, sampleRate) {
		return seconds * sampleRate;
	};
	var videoTsToSeconds = function(timestamp) {
		return timestamp / ONE_SECOND_IN_TS;
	};
	var audioTsToSeconds = function(timestamp, sampleRate) {
		return timestamp / sampleRate;
	};
	var audioTsToVideoTs = function(timestamp, sampleRate) {
		return secondsToVideoTs(audioTsToSeconds(timestamp, sampleRate));
	};
	var videoTsToAudioTs = function(timestamp, sampleRate) {
		return secondsToAudioTs(videoTsToSeconds(timestamp), sampleRate);
	};
	var metadataTsToSeconds = function(timestamp, timelineStartPts, keepOriginalTimestamps) {
		return videoTsToSeconds(keepOriginalTimestamps ? timestamp : timestamp - timelineStartPts);
	};
	module.exports = {
		ONE_SECOND_IN_TS,
		secondsToVideoTs,
		secondsToAudioTs,
		videoTsToSeconds,
		audioTsToSeconds,
		audioTsToVideoTs,
		videoTsToAudioTs,
		metadataTsToSeconds
	};
}));
//#endregion
export { require_parse_sidx as n, require_clock as t };
