import { t as require_jsx_dev_runtime } from "./_libs/react.mjs";
import { i as LoadingState, n as ErrorState } from "./_ssr/StateViews-DYwrW7w1.mjs";
import { n as useQuery } from "./_libs/react+tanstack__react-query.mjs";
import { y as Link } from "./_libs/@tanstack/react-router+[...].mjs";
import { _ as batchQuery, g as animeDetailQuery, i as Route$3 } from "./_ssr/router-hgNVPbCS.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_batchId-BPC55mTA.js
var import_jsx_dev_runtime = require_jsx_dev_runtime();
var _jsxFileName = "/app/applet/src/routes/download/$batchId.tsx?tsr-split=component";
function BatchPage() {
	const { batchId } = Route$3.useParams();
	const batchRes = useQuery(batchQuery(batchId));
	const animeRes = useQuery({
		...animeDetailQuery(batchId),
		enabled: Boolean(batchRes.isError || !batchRes.data && !batchRes.isPending)
	});
	if (batchRes.isPending) return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(LoadingState, { label: "Memuat paket unduhan batch..." }, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 18,
		columnNumber: 34
	}, this);
	const batchData = batchRes.data;
	if (batchData && batchData.downloadUrl?.formats?.length > 0) return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "mx-auto max-w-4xl space-y-8 px-4 py-8",
		children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "flex flex-col sm:flex-row items-start gap-5",
			children: [batchData.poster ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("img", {
				src: batchData.poster,
				alt: batchData.title,
				className: "w-32 sm:w-40 rounded-2xl border border-border/80 object-cover shadow-lg shrink-0"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 23,
				columnNumber: 31
			}, this) : null, /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
						className: "inline-flex items-center gap-1.5 rounded-full bg-primary/15 text-primary px-3 py-0.5 text-xs font-bold",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("i", { className: "fa-solid fa-box-archive" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 26,
							columnNumber: 15
						}, this), "PAKET BATCH LENGKAP"]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 25,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", {
						className: "font-display text-2xl sm:text-3xl font-black text-foreground",
						children: batchData.title
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 29,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
						className: "text-sm text-muted-foreground",
						children: "Unduh seluruh episode dalam satu paket arsip subtitle Indonesia."
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 32,
						columnNumber: 13
					}, this),
					batchData.animeId ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
						to: "/anime/$animeId",
						params: { animeId: batchData.animeId },
						className: "inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline pt-2",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("i", { className: "fa-solid fa-arrow-left text-xs" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 38,
							columnNumber: 17
						}, this), "Kembali ke detail anime"]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 35,
						columnNumber: 34
					}, this) : null
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 24,
				columnNumber: 11
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 22,
			columnNumber: 9
		}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "space-y-6",
			children: batchData.downloadUrl.formats.map((fmt, idx) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-sm",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", {
					className: "font-display text-base font-bold text-foreground border-b border-border/60 pb-2.5",
					children: fmt.title
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 47,
					columnNumber: 15
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "grid gap-3 sm:grid-cols-2 md:grid-cols-3",
					children: fmt.qualities.map((q) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "rounded-xl border border-border/70 bg-background/70 p-3.5 space-y-2.5",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "flex items-center justify-between text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
								className: "font-bold text-foreground bg-primary/15 text-primary px-2 py-0.5 rounded-md",
								children: q.title
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 54,
								columnNumber: 23
							}, this), q.size ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
								className: "font-semibold text-muted-foreground",
								children: q.size
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 57,
								columnNumber: 33
							}, this) : null]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 53,
							columnNumber: 21
						}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "flex flex-wrap gap-1.5",
							children: q.urls.map((link) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("a", {
								href: link.url,
								target: "_blank",
								rel: "noopener noreferrer",
								className: "press-soft inline-flex items-center gap-1 rounded-lg border border-border/80 bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent hover:border-primary/50",
								children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("i", { className: "fa-solid fa-download text-[10px] text-primary" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 62,
									columnNumber: 27
								}, this), link.title]
							}, link.title + link.url, true, {
								fileName: _jsxFileName,
								lineNumber: 61,
								columnNumber: 43
							}, this))
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 60,
							columnNumber: 21
						}, this)]
					}, q.title, true, {
						fileName: _jsxFileName,
						lineNumber: 52,
						columnNumber: 41
					}, this))
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 51,
					columnNumber: 15
				}, this)]
			}, fmt.title || idx, true, {
				fileName: _jsxFileName,
				lineNumber: 46,
				columnNumber: 60
			}, this))
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 45,
			columnNumber: 9
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 21,
		columnNumber: 12
	}, this);
	if (animeRes.data) {
		const anime = animeRes.data;
		return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "mx-auto max-w-4xl space-y-8 px-4 py-8",
			children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "flex items-start gap-4",
				children: [anime.poster ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("img", {
					src: anime.poster,
					alt: anime.title,
					className: "w-28 rounded-2xl border border-border object-cover"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 78,
					columnNumber: 27
				}, this) : null, /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", {
							className: "font-display text-2xl font-bold text-foreground",
							children: anime.title
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 80,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
							className: "text-sm text-muted-foreground",
							children: "Tautan unduhan per episode tersedia di dalam halaman nonton episode terkait."
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 81,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
							to: "/anime/$animeId",
							params: { animeId: batchId },
							className: "inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("i", { className: "fa-solid fa-arrow-left" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 87,
								columnNumber: 15
							}, this), "Kembali ke detail anime"]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 84,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 79,
					columnNumber: 11
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 77,
				columnNumber: 9
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 76,
			columnNumber: 12
		}, this);
	}
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "mx-auto max-w-3xl px-4 py-12",
		children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ErrorState, {
			error: batchRes.error || /* @__PURE__ */ new Error("Paket unduhan batch tidak ditemukan"),
			onRetry: () => batchRes.refetch()
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 95,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 94,
		columnNumber: 10
	}, this);
}
//#endregion
export { BatchPage as component };
