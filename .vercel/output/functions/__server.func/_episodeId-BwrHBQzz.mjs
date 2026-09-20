import { r as __toESM } from "./_runtime.mjs";
import { t as require_jsx_dev_runtime } from "./_libs/react.mjs";
import { i as LoadingState, n as ErrorState, s as cn } from "./_ssr/StateViews-DYwrW7w1.mjs";
import { a as require_react, n as useQuery } from "./_libs/react+tanstack__react-query.mjs";
import { y as Link } from "./_libs/@tanstack/react-router+[...].mjs";
import { D as fetchResolveServer, E as streamQuery, c as saveHistory, g as animeDetailQuery, l as ShareButton, n as Route } from "./_ssr/router-hgNVPbCS.mjs";
import { t as videojs } from "./_libs/video.js+videojs-vtt.js.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_episodeId-BwrHBQzz.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_dev_runtime = require_jsx_dev_runtime();
var _jsxFileName$1 = "/app/applet/src/components/anime/VideoPlayer.tsx";
function isDirectSource(url) {
	return /\.(m3u8|mp4)(\?|$)/i.test(url);
}
function NativePlayer({ src }) {
	const containerRef = (0, import_react.useRef)(null);
	const playerRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!containerRef.current) return;
		const element = document.createElement("video-js");
		element.classList.add("vjs-big-play-centered", "h-full", "w-full");
		containerRef.current.appendChild(element);
		const player = videojs(element, {
			controls: true,
			fluid: false,
			preload: "auto",
			playsinline: true,
			sources: [{
				src,
				type: src.includes(".m3u8") ? "application/x-mpegURL" : "video/mp4"
			}]
		});
		playerRef.current = player;
		return () => {
			player.dispose();
			playerRef.current = null;
		};
	}, [src]);
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		ref: containerRef,
		className: "h-full w-full",
		"data-vjs-player": true
	}, void 0, false, {
		fileName: _jsxFileName$1,
		lineNumber: 35,
		columnNumber: 10
	}, this);
}
function VideoPlayer({ src, onToggleTheater, isTheater = false }) {
	const [hasError, setHasError] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setHasError(false);
	}, [src]);
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "space-y-2",
		children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "relative aspect-video w-full overflow-hidden rounded-2xl border border-border/80 bg-black shadow-2xl",
			children: !src ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "flex h-full w-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("i", { className: "fa-solid fa-circle-notch fa-spin text-2xl text-primary" }, void 0, false, {
					fileName: _jsxFileName$1,
					lineNumber: 58,
					columnNumber: 13
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Menyiapkan pemutar video..." }, void 0, false, {
					fileName: _jsxFileName$1,
					lineNumber: 59,
					columnNumber: 13
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName$1,
				lineNumber: 57,
				columnNumber: 11
			}, this) : isDirectSource(src) ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(NativePlayer, { src }, void 0, false, {
				fileName: _jsxFileName$1,
				lineNumber: 62,
				columnNumber: 11
			}, this) : hasError ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground",
				children: [
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("i", { className: "fa-solid fa-triangle-exclamation text-3xl text-amber-500" }, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 65,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
						className: "max-w-md text-sm",
						children: "Pemutar video mengalami kendala saat dimuat di dalam bingkai ini."
					}, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 66,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("a", {
						href: src,
						target: "_blank",
						rel: "noopener noreferrer",
						className: "inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("i", { className: "fa-solid fa-arrow-up-right-from-square" }, void 0, false, {
							fileName: _jsxFileName$1,
							lineNumber: 75,
							columnNumber: 15
						}, this), "Buka Stream di Tab Baru"]
					}, void 0, true, {
						fileName: _jsxFileName$1,
						lineNumber: 69,
						columnNumber: 13
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName$1,
				lineNumber: 64,
				columnNumber: 11
			}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("iframe", {
				src,
				title: "Pemutar video",
				className: "h-full w-full border-0",
				allowFullScreen: true,
				allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen",
				referrerPolicy: "no-referrer",
				onError: () => setHasError(true)
			}, src, false, {
				fileName: _jsxFileName$1,
				lineNumber: 80,
				columnNumber: 11
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName$1,
			lineNumber: 55,
			columnNumber: 7
		}, this), src ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "flex items-center justify-between px-1 text-xs text-muted-foreground",
			children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
				className: "flex items-center gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "h-2 w-2 rounded-full bg-emerald-500 animate-pulse" }, void 0, false, {
					fileName: _jsxFileName$1,
					lineNumber: 96,
					columnNumber: 13
				}, this), "Player Aktif"]
			}, void 0, true, {
				fileName: _jsxFileName$1,
				lineNumber: 95,
				columnNumber: 11
			}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "flex items-center gap-2",
				children: [onToggleTheater ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
					onClick: onToggleTheater,
					className: "inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-card-foreground transition hover:bg-accent",
					children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("i", { className: isTheater ? "fa-solid fa-compress" : "fa-solid fa-expand" }, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 105,
						columnNumber: 17
					}, this), isTheater ? "Tampilan Normal" : "Mode Bioskop"]
				}, void 0, true, {
					fileName: _jsxFileName$1,
					lineNumber: 101,
					columnNumber: 15
				}, this) : null, /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("a", {
					href: src,
					target: "_blank",
					rel: "noopener noreferrer",
					className: "inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-card-foreground transition hover:bg-accent hover:text-primary",
					children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("i", { className: "fa-solid fa-arrow-up-right-from-square text-[10px]" }, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 115,
						columnNumber: 15
					}, this), "Buka di Tab Baru"]
				}, void 0, true, {
					fileName: _jsxFileName$1,
					lineNumber: 109,
					columnNumber: 13
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName$1,
				lineNumber: 99,
				columnNumber: 11
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName$1,
			lineNumber: 94,
			columnNumber: 9
		}, this) : null]
	}, void 0, true, {
		fileName: _jsxFileName$1,
		lineNumber: 54,
		columnNumber: 5
	}, this);
}
var _jsxFileName = "/app/applet/src/routes/watch/$episodeId.tsx?tsr-split=component";
function WatchPage() {
	const { episodeId } = Route.useParams();
	const { a: searchAnimeId } = Route.useSearch();
	const [isTheater, setIsTheater] = (0, import_react.useState)(false);
	const stream = useQuery(streamQuery(episodeId));
	const resolvedAnimeId = searchAnimeId || stream.data?.animeId || "";
	const anime = useQuery({
		...animeDetailQuery(resolvedAnimeId),
		enabled: Boolean(resolvedAnimeId)
	});
	const [currentStreamUrl, setCurrentStreamUrl] = (0, import_react.useState)(null);
	const [selectedQuality, setSelectedQuality] = (0, import_react.useState)(null);
	const [selectedServerId, setSelectedServerId] = (0, import_react.useState)(null);
	const [isResolving, setIsResolving] = (0, import_react.useState)(false);
	const [episodeFilter, setEpisodeFilter] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if (stream.data?.defaultStreamingUrl) setCurrentStreamUrl(stream.data.defaultStreamingUrl);
		setSelectedServerId(null);
		setSelectedQuality(null);
	}, [episodeId, stream.data?.defaultStreamingUrl]);
	const qualityGroups = (0, import_react.useMemo)(() => {
		return stream.data?.servers?.qualities ?? [];
	}, [stream.data?.servers?.qualities]);
	(0, import_react.useEffect)(() => {
		if (!selectedQuality && qualityGroups.length > 0) {
			const preferred = qualityGroups.find((q) => q.quality.includes("720")) ?? qualityGroups.find((q) => q.quality.includes("480")) ?? qualityGroups[0];
			if (preferred) setSelectedQuality(preferred.quality);
		}
	}, [qualityGroups, selectedQuality]);
	const activeGroup = (0, import_react.useMemo)(() => {
		return qualityGroups.find((q) => q.quality === selectedQuality) ?? qualityGroups[0];
	}, [qualityGroups, selectedQuality]);
	const handleServerSelect = async (serverId) => {
		if (serverId === selectedServerId || isResolving) return;
		setSelectedServerId(serverId);
		setIsResolving(true);
		try {
			const res = await fetchResolveServer({ data: { serverId } });
			if (res.url) setCurrentStreamUrl(res.url);
		} catch (err) {
			console.error("Gagal mengganti server:", err);
		} finally {
			setIsResolving(false);
		}
	};
	const episodeList = (0, import_react.useMemo)(() => {
		if (anime.data?.episodes && anime.data.episodes.length > 0) return anime.data.episodes;
		if (stream.data?.info?.episodeList && stream.data.info.episodeList.length > 0) return stream.data.info.episodeList.map((ep) => ({
			id: ep.episodeId,
			number: ep.eps,
			title: ep.title
		}));
		return [];
	}, [anime.data?.episodes, stream.data?.info?.episodeList]);
	const sortedEpisodes = (0, import_react.useMemo)(() => {
		return [...episodeList].sort((a, b) => a.number - b.number);
	}, [episodeList]);
	const filteredEpisodes = (0, import_react.useMemo)(() => {
		if (!episodeFilter.trim()) return sortedEpisodes;
		const q = episodeFilter.toLowerCase().trim();
		return sortedEpisodes.filter((ep) => String(ep.number).includes(q) || ep.title.toLowerCase().includes(q));
	}, [sortedEpisodes, episodeFilter]);
	const activeIndex = sortedEpisodes.findIndex((ep) => ep.id === episodeId);
	const prevEp = activeIndex > 0 ? sortedEpisodes[activeIndex - 1] : void 0;
	const nextEp = activeIndex >= 0 && activeIndex < sortedEpisodes.length - 1 ? sortedEpisodes[activeIndex + 1] : void 0;
	const prevEpisodeId = prevEp?.id ?? stream.data?.prevEpisodeId ?? null;
	const nextEpisodeId = nextEp?.id ?? stream.data?.nextEpisodeId ?? null;
	(0, import_react.useEffect)(() => {
		if (!stream.data) return;
		const animeTitle = anime.data?.title || stream.data.title;
		const poster = anime.data?.poster || "";
		saveHistory({
			episodeId,
			animeId: resolvedAnimeId,
			animeTitle,
			episodeTitle: stream.data.title,
			poster,
			watchedAt: Date.now()
		});
	}, [
		stream.data,
		anime.data,
		resolvedAnimeId,
		episodeId
	]);
	if (stream.isPending) return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(LoadingState, { label: "Menyiapkan episode & server streaming..." }, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 123,
		columnNumber: 32
	}, this);
	if (stream.error) return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "mx-auto max-w-3xl px-4 py-12",
		children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ErrorState, {
			error: stream.error,
			onRetry: () => stream.refetch()
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 126,
			columnNumber: 9
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 125,
		columnNumber: 12
	}, this);
	const episodeData = stream.data;
	const animeTitle = anime.data?.title || episodeData.title;
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: cn("mx-auto px-4 py-6 transition-all duration-300", isTheater ? "max-w-full" : "max-w-7xl"),
		children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground",
			children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "flex items-center gap-2 overflow-hidden",
				children: [
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
						to: "/",
						className: "hover:text-primary transition-colors shrink-0",
						children: "Beranda"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 135,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("i", { className: "fa-solid fa-chevron-right text-[10px] shrink-0" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 138,
						columnNumber: 11
					}, this),
					resolvedAnimeId ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(import_jsx_dev_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
						to: "/anime/$animeId",
						params: { animeId: resolvedAnimeId },
						className: "hover:text-primary transition-colors truncate max-w-[200px] sm:max-w-xs font-medium",
						children: animeTitle
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 140,
						columnNumber: 15
					}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("i", { className: "fa-solid fa-chevron-right text-[10px] shrink-0" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 145,
						columnNumber: 15
					}, this)] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 139,
						columnNumber: 30
					}, this) : null,
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
						className: "text-foreground font-semibold truncate",
						children: episodeData.title
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 147,
						columnNumber: 11
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 134,
				columnNumber: 9
			}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "flex items-center gap-2 shrink-0",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ShareButton, { title: episodeData.title }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 151,
					columnNumber: 11
				}, this), resolvedAnimeId ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
					to: "/anime/$animeId",
					params: { animeId: resolvedAnimeId },
					className: "inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-3 py-1 font-medium text-foreground hover:bg-accent",
					children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("i", { className: "fa-solid fa-circle-info text-primary" }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 155,
						columnNumber: 15
					}, this), "Detail Anime"]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 152,
					columnNumber: 30
				}, this) : null]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 150,
				columnNumber: 9
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 133,
			columnNumber: 7
		}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "grid gap-6 lg:grid-cols-12",
			children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: cn("space-y-4", isTheater ? "lg:col-span-12" : "lg:col-span-8 xl:col-span-9"),
				children: [
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "relative rounded-2xl overflow-hidden shadow-2xl bg-black border border-border/80",
						children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(VideoPlayer, {
							src: currentStreamUrl,
							isTheater,
							onToggleTheater: () => setIsTheater((prev) => !prev)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 166,
							columnNumber: 13
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 165,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "rounded-2xl border border-border/80 bg-card p-4 space-y-4 shadow-sm",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-3",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", {
								className: "font-display text-base sm:text-lg font-bold text-foreground",
								children: episodeData.title
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 174,
								columnNumber: 17
							}, this), episodeData.releaseTime ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
								className: "text-xs text-muted-foreground",
								children: episodeData.releaseTime
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 177,
								columnNumber: 44
							}, this) : null] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 173,
								columnNumber: 15
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "flex items-center gap-2",
								children: [prevEpisodeId ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
									to: "/watch/$episodeId",
									params: { episodeId: prevEpisodeId },
									search: { a: resolvedAnimeId },
									className: "press-soft inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent",
									children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("i", { className: "fa-solid fa-backward-step" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 187,
										columnNumber: 21
									}, this), "Eps Sebelumnya"]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 182,
									columnNumber: 34
								}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
									disabled: true,
									className: "inline-flex items-center gap-1.5 rounded-xl border border-border/40 bg-muted/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground/50 cursor-not-allowed",
									children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("i", { className: "fa-solid fa-backward-step" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 190,
										columnNumber: 21
									}, this), "Eps Sebelumnya"]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 189,
									columnNumber: 29
								}, this), nextEpisodeId ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
									to: "/watch/$episodeId",
									params: { episodeId: nextEpisodeId },
									search: { a: resolvedAnimeId },
									className: "press-soft inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90",
									children: ["Eps Berikutnya", /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("i", { className: "fa-solid fa-forward-step" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 200,
										columnNumber: 21
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 194,
									columnNumber: 34
								}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
									disabled: true,
									className: "inline-flex items-center gap-1.5 rounded-xl border border-border/40 bg-muted/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground/50 cursor-not-allowed",
									children: ["Eps Berikutnya", /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("i", { className: "fa-solid fa-forward-step" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 203,
										columnNumber: 21
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 201,
									columnNumber: 29
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 181,
								columnNumber: 15
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 172,
							columnNumber: 13
						}, this), qualityGroups.length > 0 ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "space-y-3",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "flex flex-wrap items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
										className: "text-xs font-bold text-foreground uppercase tracking-wide",
										children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("i", { className: "fa-solid fa-server text-primary mr-1.5" }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 213,
											columnNumber: 23
										}, this), "Pilihan Server"]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 212,
										columnNumber: 21
									}, this), isResolving ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
										className: "inline-flex items-center gap-1 text-[11px] font-medium text-primary",
										children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("i", { className: "fa-solid fa-circle-notch animate-spin text-[10px]" }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 217,
											columnNumber: 25
										}, this), "Mengganti server..."]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 216,
										columnNumber: 36
									}, this) : null]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 211,
									columnNumber: 19
								}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: "flex items-center gap-1.5",
									children: qualityGroups.map((q) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
										onClick: () => setSelectedQuality(q.quality),
										className: cn("rounded-lg px-2.5 py-1 text-xs font-bold transition-all", selectedQuality === q.quality ? "bg-primary text-primary-foreground shadow-xs" : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"),
										children: q.quality
									}, q.quality, false, {
										fileName: _jsxFileName,
										lineNumber: 224,
										columnNumber: 45
									}, this))
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 223,
									columnNumber: 19
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 210,
								columnNumber: 17
							}, this), activeGroup && activeGroup.serverList.length > 0 ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "flex flex-wrap items-center gap-2",
								children: activeGroup.serverList.map((srv) => {
									const isSelected = selectedServerId === srv.serverId;
									return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
										onClick: () => handleServerSelect(srv.serverId),
										disabled: isResolving,
										className: cn("press-soft inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all", isSelected ? "border-primary bg-primary/15 text-primary shadow-xs" : "border-border/80 bg-background text-foreground hover:border-primary/50 hover:bg-accent"),
										children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: cn("h-1.5 w-1.5 rounded-full", isSelected ? "bg-primary" : "bg-muted-foreground/60") }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 235,
											columnNumber: 27
										}, this), srv.title]
									}, srv.serverId, true, {
										fileName: _jsxFileName,
										lineNumber: 234,
										columnNumber: 24
									}, this);
								})
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 231,
								columnNumber: 69
							}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
								className: "text-xs text-muted-foreground",
								children: "Gunakan pemutar bawaan di atas."
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 239,
								columnNumber: 28
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 209,
							columnNumber: 41
						}, this) : null]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 170,
						columnNumber: 11
					}, this),
					episodeData.downloads && episodeData.downloads.length > 0 ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "rounded-2xl border border-border/80 bg-card p-4 sm:p-5 space-y-4 shadow-sm",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "flex items-center gap-2 border-b border-border/60 pb-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("i", { className: "fa-solid fa-download text-primary" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 246,
									columnNumber: 17
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h3", {
									className: "font-display text-sm font-bold text-foreground",
									children: "Unduh Episode Ini"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 247,
									columnNumber: 17
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
									className: "text-xs text-muted-foreground ml-auto",
									children: "Berbagai pilihan resolusi & penyedia"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 250,
									columnNumber: 17
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 245,
							columnNumber: 15
						}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
							children: episodeData.downloads.map((dl) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "rounded-xl border border-border/70 bg-background/60 p-3 space-y-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: "flex items-center justify-between text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
										className: "font-bold text-foreground bg-primary/15 text-primary px-2 py-0.5 rounded-md",
										children: dl.quality
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 258,
										columnNumber: 23
									}, this), dl.size ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
										className: "font-semibold text-muted-foreground",
										children: dl.size
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 261,
										columnNumber: 34
									}, this) : null]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 257,
									columnNumber: 21
								}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: "flex flex-wrap gap-1.5",
									children: dl.urls.map((link) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("a", {
										href: link.url,
										target: "_blank",
										rel: "noopener noreferrer",
										className: "press-soft inline-flex items-center gap-1 rounded-lg border border-border/70 bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-accent hover:border-primary/50",
										children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("i", { className: "fa-solid fa-cloud-arrow-down text-[10px] text-primary" }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 266,
											columnNumber: 27
										}, this), link.title]
									}, link.title + link.url, true, {
										fileName: _jsxFileName,
										lineNumber: 265,
										columnNumber: 44
									}, this))
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 264,
									columnNumber: 21
								}, this)]
							}, dl.quality, true, {
								fileName: _jsxFileName,
								lineNumber: 256,
								columnNumber: 50
							}, this))
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 255,
							columnNumber: 15
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 244,
						columnNumber: 72
					}, this) : null
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 164,
				columnNumber: 9
			}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: cn("space-y-4", isTheater ? "lg:col-span-12" : "lg:col-span-4 xl:col-span-3"),
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "rounded-2xl border border-border/80 bg-card p-4 space-y-3 shadow-sm sticky top-20",
					children: [
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "flex items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("i", { className: "fa-solid fa-list-ul text-primary text-sm" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 280,
									columnNumber: 17
								}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h3", {
									className: "font-display text-sm font-bold text-foreground",
									children: "Daftar Episode"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 281,
									columnNumber: 17
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 279,
								columnNumber: 15
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
								className: "text-xs font-semibold text-muted-foreground",
								children: [sortedEpisodes.length, " Eps"]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 283,
								columnNumber: 15
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 278,
							columnNumber: 13
						}, this),
						sortedEpisodes.length > 8 ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", {
								type: "text",
								placeholder: "Cari nomor episode...",
								value: episodeFilter,
								onChange: (e) => setEpisodeFilter(e.target.value),
								className: "h-8 w-full rounded-lg border border-border/80 bg-background pl-7 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 290,
								columnNumber: 17
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("i", { className: "fa-solid fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 291,
								columnNumber: 17
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 289,
							columnNumber: 42
						}, this) : null,
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "max-h-[500px] overflow-y-auto space-y-1.5 pr-1 no-scrollbar",
							children: filteredEpisodes.length > 0 ? filteredEpisodes.map((ep) => {
								const isActive = ep.id === episodeId;
								return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
									to: "/watch/$episodeId",
									params: { episodeId: ep.id },
									search: { a: resolvedAnimeId },
									className: cn("press-soft flex items-center justify-between gap-2 rounded-xl p-2.5 text-xs font-medium transition-all", isActive ? "bg-primary text-primary-foreground font-bold shadow-xs" : "bg-background/80 text-card-foreground hover:bg-accent border border-border/60"),
									children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
										className: "flex items-center gap-2 truncate",
										children: [isActive ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("i", { className: "fa-solid fa-play text-[10px] animate-pulse" }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 304,
											columnNumber: 37
										}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
											className: "flex h-5 w-5 items-center justify-center rounded-md bg-muted text-[10px] font-bold text-muted-foreground shrink-0",
											children: ep.number
										}, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 304,
											columnNumber: 100
										}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
											className: "truncate",
											children: ["Episode ", ep.number]
										}, void 0, true, {
											fileName: _jsxFileName,
											lineNumber: 307,
											columnNumber: 25
										}, this)]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 303,
										columnNumber: 23
									}, this), isActive ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
										className: "text-[10px] uppercase font-bold tracking-wider shrink-0",
										children: "Memutar"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 310,
										columnNumber: 35
									}, this) : null]
								}, ep.id, true, {
									fileName: _jsxFileName,
									lineNumber: 298,
									columnNumber: 22
								}, this);
							}) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "p-4 text-center text-xs text-muted-foreground",
								children: "Episode tidak ditemukan."
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 314,
								columnNumber: 18
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 295,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 277,
					columnNumber: 11
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 276,
				columnNumber: 9
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 162,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 131,
		columnNumber: 10
	}, this);
}
//#endregion
export { WatchPage as component };
