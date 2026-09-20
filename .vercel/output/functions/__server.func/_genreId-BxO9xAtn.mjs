import { t as require_jsx_dev_runtime } from "./_libs/react.mjs";
import { n as ErrorState, o as SectionTitle, r as GridSkeleton } from "./_ssr/StateViews-DYwrW7w1.mjs";
import { n as useQuery } from "./_libs/react+tanstack__react-query.mjs";
import { b as useNavigate } from "./_libs/@tanstack/react-router+[...].mjs";
import { b as genreAnimeQuery, r as Route$1 } from "./_ssr/router-hgNVPbCS.mjs";
import { t as Pagination } from "./_ssr/Pagination-B5JCLLd-.mjs";
import { t as AnimeGrid } from "./_ssr/AnimeGrid-DBwgAvi3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_genreId-BxO9xAtn.js
var import_jsx_dev_runtime = require_jsx_dev_runtime();
var _jsxFileName = "/app/applet/src/routes/genre/$genreId.tsx?tsr-split=component";
function GenreDetailPage() {
	const { genreId } = Route$1.useParams();
	const { page, name } = Route$1.useSearch();
	const navigate = useNavigate();
	const { data, isPending, error, refetch } = useQuery(genreAnimeQuery(genreId, page));
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "mx-auto max-w-7xl space-y-6 px-4 py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(SectionTitle, {
				title: `Genre: ${name ?? `#${genreId}`}`,
				icon: "fa-solid fa-tag"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 24,
				columnNumber: 7
			}, this),
			isPending ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(GridSkeleton, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 25,
				columnNumber: 20
			}, this) : null,
			error ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ErrorState, {
				error,
				onRetry: () => refetch()
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 26,
				columnNumber: 16
			}, this) : null,
			data ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(import_jsx_dev_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AnimeGrid, { items: data.items }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 28,
				columnNumber: 11
			}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Pagination, {
				page,
				hasNext: data.hasNext,
				onChange: (next) => navigate({
					to: "/genre/$genreId",
					params: { genreId },
					search: {
						page: next,
						name
					}
				})
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 29,
				columnNumber: 11
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 27,
				columnNumber: 15
			}, this) : null
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 23,
		columnNumber: 10
	}, this);
}
//#endregion
export { GenreDetailPage as component };
