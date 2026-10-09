<div align="center">

<img src="public/og-image.jpg" alt="nontonime" width="100%" />

# nontonime

**Indonesian-subtitled anime streaming and tracking site, now with social features**

A catalog merged from six scrapers, no third-party API, and a player that switches servers on its own when a stream fails.

[![Demo](https://img.shields.io/badge/demo-nontonime.vercel.app-6366f1?style=for-the-badge&logo=vercel&logoColor=white)](https://nontonime.vercel.app/)
[![Repo](https://img.shields.io/badge/github-NimzzAI%2Fnontonime-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/NimzzAI/nontonime)
[![License](https://img.shields.io/github/license/NimzzAI/nontonime?style=flat-square)](./LICENSE)

</div>

> 🌐 **Language / Bahasa:** [Indonesia](README.md) · English (this page)

---

## Table of Contents

1. [Overview](#-overview)
2. [Features](#-features)
3. [Social and Community Features](#-social-and-community-features)
4. [Data Sources](#-data-sources)
5. [Search](#-search)
6. [Backend Architecture](#-backend-architecture)
7. [Directory Structure](#-directory-structure)
8. [Running Locally](#-running-locally)
9. [Environment Variables](#-environment-variables)
10. [Firebase and Supabase Setup](#-firebase-and-supabase-setup)
11. [Deploying to Vercel](#-deploying-to-vercel)
12. [Adding a New Source](#-adding-a-new-source)
13. [Troubleshooting](#-troubleshooting)
14. [Streaming Notes](#-streaming-notes)
15. [Known Limitations](#-known-limitations)
16. [npm Scripts](#-npm-scripts)
17. [Disclaimer and Credits](#-disclaimer-and-credits)

---

## // Overview

nontonime is a web app for watching and managing a collection of Indonesian-subtitled anime. It is built on TanStack Start (React 19 with SSR), TanStack Router, TanStack Query, and Tailwind CSS v4.

Anime data, release schedules, genres, and streaming servers come straight from the source sites through scrapers that run on this app's own server. Results from every source are merged into one catalog. Accounts, comments, and the social layer use Firebase (Auth and Firestore), and profile images live in Supabase Storage.

Anime IDs are prefixed by their source (for example `na_one-piece` or `ai_1234`). Otakudesu is **not** a source in this version.

---

## // Features

| Category       | Feature                          | Description                                                                                                        |
| :------------- | :------------------------------- | :----------------------------------------------------------------------------------------------------------------- |
| **Catalog**    | Multi-source                     | Home, latest, popular, search, genres, and schedule are merged from several sites. Duplicate titles show once.     |
| **Catalog**    | Cross-source search              | One keyword goes to every source at once, ranked by title match and season. See [Search](#-search).                |
| **Streaming**  | Multi-server player              | Direct files (MP4 or HLS) and embeds, with servers grouped by quality.                                             |
| **Streaming**  | Auto failover and retry          | A failed, stalled (over 10 s), or dead stream moves on to the next server.                                         |
| **Streaming**  | Autoplay next episode            | A cancelable countdown before the next episode starts.                                                             |
| **Streaming**  | Range-aware proxy                | `/api/stream-proxy` forwards the `Range` header (RFC 7233), so seeking does not wait for the full download.        |
| **Streaming**  | Diagnostics panel                | Shows source URL, upstream Content-Type, 206 status, ping, and buffer duration.                                    |
| **Search**     | Spotlight (`Ctrl+K` or `/`)      | Search modal with keyboard navigation and debounce.                                                                |
| **Offline**    | Segmented downloader             | Video is downloaded in 2 MB blocks to IndexedDB, pausable and resumable.                                           |
| **Offline**    | Offline player                   | Saved episodes play without a connection, or export as MP4.                                                        |
| **Collection** | Watchlist and history            | Planned, Watching, Completed, last position saved, JSON export and import.                                         |
| **Gamification** | Levels and badges              | EXP and badges earned from watching.                                                                               |
| **Mobile**     | PWA and bottom navigation        | Installable, safe-area aware, with optional push notifications.                                                    |
| **Extras**     | Characters and voice actors      | On the anime detail page, adapted from the hianime-api project.                                                    |
| **Extras**     | Next-episode countdown           | Time until the next episode airs, adapted from hianime-api.                                                        |
| **Extras**     | Anime news and Top Search        | A `/berita` page and trending keyword chips on the search page, adapted from hianime-api.                          |
| **Social**     | Community                        | Comment replies, friends, followers, clans, public profiles, chat, and notifications. See below.                   |

---

## // Social and Community Features

nontonime now works like a small social network on top of Firebase (accounts, Firestore) and Supabase (profile images).

| Feature                 | How it works                                                                                                                                                                     |
| :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Automatic owner**     | A Google account with the email `nimzz8444@gmail.com` (must be verified) automatically becomes **Owner**: badge, displayed level 999, Royal border, and comment moderation.      |
| **Comments and replies**| One-level replies (`parentId`), a notification to the person replied to, likes, spoilers, delete. A parent comment that has replies is blanked instead of removed.                |
| **Banner and avatar**   | Uploaded from the Profile page, compressed in the browser, stored in Supabase Storage through the server. The banner shows on the profile and above the user's comments.        |
| **Border effects**      | Seven border styles (neon, sakura, sunset, aurora, gold, and an owner-only Royal). Borders unlock by level and apply to the avatar and comment cards.                            |
| **Clan name**           | The clan tag and name show on comments, public profiles, and user search results.                                                                                                |
| **Public profile**      | `/u/<uid>`: banner, avatar, level, clan, bio, and follower, following, and friend counts.                                                                                        |
| **Follow and friends**  | Follow users, and send and accept friend requests at `/komunitas`.                                                                                                                |
| **Chat**                | Direct messages between users at `/chat`, realtime through Firestore.                                                                                                             |
| **Notifications**       | The header bell shows replies, new followers, friend requests, messages, and site update announcements. The owner can post announcements from the notification panel.            |

Firestore data layout:

| Collection                           | Contents                                                                  | Access                                              |
| :----------------------------------- | :------------------------------------------------------------------------ | :-------------------------------------------------- |
| `users/{uid}`                        | Private data (including email), watchlist, history.                       | Owner of the document only.                         |
| `profiles/{uid}`                     | Public-safe copy: name, avatar, banner, border, level, clan, role.        | Anyone reads, only the owner writes.                |
| `follows/{a}_{b}`                    | Follow relation.                                                          | Anyone reads, the follower creates and deletes.     |
| `friendRequests/{a}_{b}`             | Friend requests.                                                          | The two people involved.                            |
| `friendships/{a}_{b}`                | Friendships (id = sorted uids).                                           | Created by the recipient, only if a request exists. |
| `chats/{a}_{b}/messages/{id}`        | Chat messages.                                                            | The two participants.                               |
| `users/{uid}/notifications/{id}`     | Notification inbox.                                                       | Owner reads, others can only add.                   |
| `announcements/{id}`                 | Site update announcements.                                                | Anyone reads, only the owner writes.                |
| `clans/{id}` and `.../members/{uid}` | Clans and their members.                                                  | Leader manages, members join and leave.             |
| `episodes/{id}/comments/{id}`        | Comments and replies.                                                     | Author, owner (moderation), and likes by anyone.    |

> Notifications run in realtime through Firestore and as browser system notifications while the site or PWA is still open (including a background tab). Push while the browser is fully closed needs Firebase Cloud Messaging with a service account, and is not included.

---

## // Data Sources

Each source is one file in `src/lib/sources/` implementing the `AnimeSource` interface. Not every source supports every feature, so some pages are filled only from the sources that do.

| Source        | Env ID          | Home                                      | Latest | Popular | Search | Genre | Schedule | Detail | Stream | Download |
| :------------ | :-------------- | :---------------------------------------- | :----: | :-----: | :----: | :---: | :------: | :----: | :----: | :------: |
| AnimeIn       | `animein`       | slider, today, hot, popular, new, waiting |  yes   |   yes   |  yes   |  yes  |   yes    |  yes   |  yes   |    no    |
| NontonAnimeID | `nontonanimeid` | latest, popular, movies                   |  yes   |   yes   |  yes   |  yes  |   yes    |  yes   |  yes   |   yes    |
| Gomunime      | `gomunime`      | latest, popular                           |   no   |   no    |  yes   |  yes  |    no    |  yes   |  yes   |    no    |
| Aniwatch      | `aniwatch`      | latest, popular                           |   no   |   no    |  yes   |  yes  |    no    |  yes   |  yes   |    no    |
| Stucknime     | `stucknime`     | latest                                    |   no   |   no    |  yes   |  yes  |    no    |  yes   |  yes   |    no    |
| Samehadaku    | `samehadaku`    | latest, popular, movies                   |   no   |   no    |  yes   |  no   |    no    |  yes   |  yes   |   yes    |
| Kusonime      | none            | download batch search only                |   no   |   no    |  yes   |  no   |    no    |   no   |   no   |   yes    |

Notes:

- **Home** is filled from all sources, interleaving each section across them.
- **Latest** and **Popular** load every source on page one. Page two onward comes only from AnimeIn and NontonAnimeID, the only sources with paginated lists.
- **Schedule** is filled only from AnimeIn and NontonAnimeID.
- **Kusonime** is not a streaming source. It finds download batches by anime title and shows them as a batch button on the detail page.
- One anime belongs to one source. If the same title exists in two, the source earlier in `registry.server.ts` wins.
- The extras (characters, countdown, news, top search) come from `sources/extras.server.ts`, ported from hianime-api. They match by exact title, hide themselves on failure, and stay disabled until `EXTRAS_URL` is set.

---

## // Search

Queries are cleaned before reaching the source sites (`src/lib/search-query.ts`):

- Noise words such as `sub indo`, `nonton`, `streaming`, `batch`, and `episode N` are removed. Previously they were sent as-is, so `yuru camp sub indo season 2` matched nothing on WordPress sites that require every word.
- The season number is detected from `season 2`, `s2`, `2nd season`, `musim 2`, `season ii`, or a trailing number (`yuru camp 2`). The season is **not** sent to the sites as a filter. It is used for ranking: titles with the matching season rise and other seasons drop.
- Every source searches the core title, and page one also tries other names (Romaji, English, synonyms, and `<name> Season N`).
- The local alias dictionary tolerates typos (for example `tokinawa` resolves to Tonikaku Kawaii/Tonikawa). AniList results are used only when the title really resembles what was typed.

> Otakudesu is **not** a source in this version. The `provider` parameter still defaulting to `"otakudesu"` in the code is a leftover from the old API and is unused.

---

## // Backend Architecture

### Request flow

```text
Browser
  -> TanStack Query (queries.ts)
  -> Server Function (anime.functions.ts, extras.functions.ts, media.functions.ts)
  -> Merge layer (anime-service.server.ts)
       |-- cache, duplicate-request merging, stale data on failure (sources/cache.server.ts)
       |-- every source is called at once, failures are skipped
       |     |-- animein.server.ts         (JSON API)
       |     |-- nontonanimeid.server.ts   (HTML, cheerio)
       |     |-- gomunime.server.ts        (HTML, cheerio, AES-GCM decryption)
       |     |-- aniwatch.server.ts        (HTML, cheerio)
       |     |-- stucknime.server.ts       (HTML, cheerio)
       |     |-- samehadaku.server.ts      (HTML, cheerio, player over AJAX)
       |-- kusonime.server.ts              (batch search)
       |-- extras.server.ts                (characters, countdown, news, top search)
  -> Results mapped to AnimeSummary, AnimeDetail, StreamResult (anime-types.ts)
```

### Modules

| File                                 | Purpose                                                                                               |
| :----------------------------------- | :---------------------------------------------------------------------------------------------------- |
| `src/lib/anime-service.server.ts`    | Backend entry point. Merges sources, maps data to frontend types, handles cache and timeouts.         |
| `src/lib/search-query.ts`            | Query cleaning, season detection, title matching helpers.                                             |
| `src/lib/sources/types.ts`           | `AnimeSource` interface and internal types.                                                           |
| `src/lib/sources/registry.server.ts` | Source list and priority order.                                                                       |
| `src/lib/sources/ids.ts`             | Source-prefixed ID creation and parsing, title normalization.                                         |
| `src/lib/sources/http.server.ts`     | `fetch` wrapper with timeout, browser User-Agent, and source-named errors.                            |
| `src/lib/sources/cache.server.ts`    | In-memory cache, duplicate-request merging, `withTimeout`.                                            |
| `src/lib/sources/token.server.ts`    | Encodes server references into tokens and checks for public URLs.                                     |
| `src/lib/social.ts`                  | Public profiles, follow, friends, user search.                                                        |
| `src/lib/social-notifications.ts`    | Social notifications, announcements, realtime notifier.                                               |
| `src/lib/chat.ts`                    | Direct messages.                                                                                      |
| `src/lib/media-upload.server.ts`     | Verifies the Firebase token and stores images in Supabase.                                            |

### ID format

| Kind    | Format                  | Example                       |
| :------ | :---------------------- | :---------------------------- |
| Anime   | `<prefix>_<slug>`       | `na_one-piece`, `ai_1234`     |
| Episode | `<prefix>_ep_<slug>`    | `na_ep_one-piece-episode-1`   |
| Batch   | `ks_<slug>`             | `ks_one-piece-batch-sub-indo` |

Source prefixes: `ai` AnimeIn, `na` NontonAnimeID, `gm` Gomunime, `aw` Aniwatch, `stk` Stucknime, `sh` Samehadaku, `ks` Kusonime.

### Cache

The cache lives in process memory, at most 500 entries, oldest evicted first.

| Data                         | TTL        |
| :--------------------------- | :--------- |
| Home, latest, search         | 5 minutes  |
| Popular                      | 10 minutes |
| Anime detail, genre pages    | 15 minutes |
| Release schedule             | 30 minutes |
| Download batches             | 30 minutes |
| Genre list                   | 60 minutes |
| Kusonime batch search        | 6 hours    |
| Episode stream               | 3 minutes  |
| News, top search, next episode, characters | 15 min, 30 min, 5 min, 6 hours |

Behavior:

- **Duplicate requests merge.** Concurrent requests for the same data send a single request to the source.
- **Stale data on failure.** If a refresh fails and an old copy exists, the old copy is returned instead of an error screen.
- **The cache lives as long as the process.** On Vercel each function instance has its own cache, which disappears when the instance stops.

### Merging results

- All sources are called at once. A source that fails or takes over 14 seconds is skipped and logged (`[sources] name.action failed`).
- Each source's results are interleaved so no single source dominates.
- Duplicate titles are dropped after normalization (lowercase, without words like "sub indo", "nonton", "streaming", "season", "musim", and without punctuation).
- If every source fails, list pages show an error while the home page returns empty sections so it still opens.
- Search is ranked by title match, alias match, and season match (see [Search](#-search)).

### Streaming servers

The server list is grouped by quality. Each server reaches the browser as an opaque token (`srv1.` followed by base64url data), not a raw URL, and is decoded again on the server through `resolveServer`.

- Direct URL servers open as-is. If an embed page contains a `.m3u8` or `.mp4` address, the server tries to extract it so the in-app player can play it.
- NontonAnimeID keeps backup servers behind an AJAX request with a nonce. The token carries what is needed and the player URL is requested on selection.
- Samehadaku puts some players behind an AJAX request (`player_ajax`). The token carries `post`, `nume`, and `type`, and the iframe URL is requested on selection.
- Gomunime uses the Putarin player whose config is AES-256-GCM encrypted. The server fetches the key and decrypts it, falling back to a regular embed.

### Security

- Server tokens come from the browser, so their contents are untrusted. URLs must use `http` or `https` and may not point to `localhost`, private IPs, or cloud metadata addresses.
- NontonAnimeID AJAX endpoints must use the same host as the source site.
- The stream proxy applies the same private-host check and restricts ports.
- All calls to source sites happen on the server. No keys or source URLs reach the client bundle.
- Image uploads verify the Firebase ID token on the server, check the real file type from its bytes, and use the Supabase service role key that never leaves the server.
- `firestore.rules` stop identity forgery: users cannot read other users' private documents, cannot claim the owner role, and cannot change others' comments except to like them.

---

## // Directory Structure

```text
nontonime/
├── public/                         # Public assets, favicon, PWA manifest, service worker
├── src/
│   ├── components/
│   │   ├── anime/                  # Anime components (Player, Card, Shelf, Modal, Navigation)
│   │   ├── social/                 # AvatarFrame, badges, relation buttons, profile customizer
│   │   └── ui/                     # UI primitives
│   ├── lib/
│   │   ├── sources/                # One scraper per source and their helpers
│   │   │   └── extras.server.ts    # Characters, next episode, news, top search
│   │   ├── anime-service.server.ts # Source merger, backend entry point
│   │   ├── search-query.ts         # Query cleaning and season detection
│   │   ├── social.ts               # Public profiles, follow, friends
│   │   ├── social-notifications.ts # Notifications and announcements
│   │   ├── chat.ts                 # Direct messages
│   │   ├── roles.ts                # Owner (verified email), displayed level
│   │   ├── profile-style.ts        # Border effects and level requirements
│   │   ├── media-client.ts         # Image compression in the browser
│   │   └── media-upload.server.ts  # Token check and Supabase upload
│   ├── routes/                     # TanStack Router file-based routes (u/, komunitas, chat, berita)
│   ├── server.ts                   # Server entry point
│   └── styles.css                  # Global Tailwind v4 styles and border effects
├── supabase/setup.sql              # Creates the avatars and banners buckets
├── firestore.rules                 # Firestore security rules (redeploy after updating)
├── package.json
├── README.md                       # Indonesian
└── README.en.md                    # English
```

---

## // Running Locally

### Prerequisites

- Node.js 20.x or 22.x
- npm 10.x or newer

### Steps

```bash
git clone https://github.com/NimzzAI/nontonime.git
cd nontonime
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The anime part needs no configuration, so the app runs with all six sources without filling `.env`.

Production build test:

```bash
npm run build
npm run start
```

---

## // Environment Variables

Anime sources use no environment variables at all. Addresses, the source list, and priorities are in code.

The variables below are for Firebase accounts, the social features, image upload, and push. All are optional for the anime part.

| Variable                           | Purpose                                                                                        |
| :--------------------------------- | :--------------------------------------------------------------------------------------------- |
| `VITE_FIREBASE_API_KEY`            | Firebase API key for accounts and social. The server also uses it to verify logins.            |
| `VITE_FIREBASE_AUTH_DOMAIN`        | Firebase auth domain.                                                                          |
| `VITE_FIREBASE_PROJECT_ID`         | Firebase project ID.                                                                           |
| `SUPABASE_URL`                     | Supabase project URL, for example `https://xxxx.supabase.co`. Server only.                     |
| `SUPABASE_SERVICE_ROLE_KEY`        | Supabase service role key. **Secret**, server only, never prefix it with `VITE_`.              |
| `VAPID_PRIVATE_KEY`                | Web Push private key, server only.                                                             |
| `VITE_VAPID_PUBLIC_KEY`            | Web Push public key for the browser.                                                           |
| `EXTRAS_URL`, `EXTRAS_CDN_URL`     | Optional. `EXTRAS_URL` is the source address for the extras (characters, countdown, news, top search); empty means disabled. |

If a source moves, change the constants at the top of its file in `src/lib/sources/`: `DEFAULT_BASE` for NontonAnimeID, Gomunime, Aniwatch, Stucknime, and Kusonime, `DEFAULT_DOMAINS` for Samehadaku, and `BASE_URL` and `API_BASE` for AnimeIn. To disable a source or reorder priority, edit `DEFAULT_SOURCE_IDS` in `registry.server.ts`.

> Never put `VAPID_PRIVATE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or any server secret in a `VITE_` variable. Those are shipped to the browser.

---

## // Firebase and Supabase Setup

### 1. Firebase (accounts, comments, social, notifications)

1. Enable **Authentication** (Google and Email/Password) and **Firestore** in the Firebase Console.
2. Deploy the latest security rules. `firestore.rules` **changed** in this version, so it must be redeployed:

   ```bash
   firebase deploy --only firestore:rules
   ```

   Or paste its contents into Firebase Console, Firestore, Rules, then Publish.
3. Make yourself owner: sign in with **Google** using `nimzz8444@gmail.com`. The email must be verified, and the Firestore rules check the same thing, so nobody else can claim owner. To change the email, edit `OWNER_EMAILS` in `src/lib/roles.ts` and the `isOwner()` function in `firestore.rules`.
4. Sign in as owner and open the **Clans** page once. Default clans can only be created by the owner, and other users can join them only after they exist.

### 2. Supabase (avatars and banners)

1. Create a Supabase project and run `supabase/setup.sql` in the SQL Editor. It creates the public `avatars` and `banners` buckets.
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (Project Settings, API) in `.env` or in Vercel Environment Variables.
3. Upload flow: the browser shrinks the image (avatar 512x512, banner 1600x600, WebP) and sends it to the server with the Firebase ID token. The server verifies the token through Identity Toolkit, checks the file type from its content (not its name), stores it under `avatars/<uid>/...` or `banners/<uid>/...`, and deletes that user's older files. The Supabase key never reaches the browser.

---

## // Deploying to Vercel

1. Import the repository in Vercel. The framework is detected as TanStack Start through `vercel.json`.
2. Set the Firebase, Supabase, and VAPID variables if you use those features. The anime part needs none.
3. Deploy. Scrapers run in the same server function as the app, there is no second service.

Vercel notes:

- Loading anime detail from AnimeIn can take several sequential requests (episodes are fetched per page, up to 10 pages). Make sure your plan's function duration limit is enough for long series.
- Some source sites block datacenter IPs. If one source always fails in production but works locally, check the function logs for the HTTP status, then remove it from `DEFAULT_SOURCE_IDS` or change its address.
- The in-memory cache is not shared between instances, so the first request to a new instance is always slower.
- Image uploads go through a server function, so the 4.5 MB request body limit applies. The browser compresses images well below that.

---

## // Adding a New Source

1. Create `src/lib/sources/sourcename.server.ts` and export an `AnimeSource` object:

   ```ts
   import type { AnimeSource } from "./types";

   export const sourcename: AnimeSource = {
     id: "sourcename",
     label: "Source Name",
     async search(keyword, page) {
       /* return { items, hasNext } */
     },
     async getDetail(slug) {
       /* return SourceDetail */
     },
     async getStream(slug) {
       /* return SourceStream */
     },
     // Optional: getHome, getLatest, getPopular, getGenres, getByGenre, getSchedule
   };
   ```

2. Add the new ID to `SourceId` in `types.ts` and its short prefix to `SOURCE_PREFIX` and `PREFIX_TO_SOURCE` in `ids.ts`. Update the patterns in `parseId` too.
3. Register it in `registry.server.ts` in `ALL_SOURCES` and `DEFAULT_SOURCE_IDS`.
4. Use `makeItem`, `toAnimeId`, and `toEpisodeId` for uniform IDs and scores, and `fetchText` or `fetchJson` from `http.server.ts` for consistent timeouts and error messages.

Unimplemented methods are fine. The merge layer skips sources that lack them.

---

## // Troubleshooting

| Symptom                                    | Likely cause and fix                                                                                                                                   |
| :----------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Empty home page                            | Every source failed. Look for `[sources] ... failed` in the server log, then check each source's address.                                              |
| One source never appears                   | Its domain moved or its HTML changed. Update `DEFAULT_BASE` in its file, or check the selectors there.                                                 |
| A title is missing from search             | See [Search](#-search). Try the core title only (`yuru camp`) and check the log. A source whose domain moved will stay empty.                           |
| A server in the player is empty or errors | Token failed to decode, the host failed the security check, or a NontonAnimeID nonce expired. Reload the episode page.                                  |
| Avatar or banner upload fails              | Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, make sure `supabase/setup.sql` ran, and that you are not in guest mode. The error names the cause. |
| `Missing or insufficient permissions`      | The latest `firestore.rules` is not deployed, or the user is not signed in (guest mode cannot comment, chat, or add friends).                          |
| Cannot join a default clan                 | Default clans are created by the owner. Sign in as owner and open the Clans page once.                                                                 |
| Characters, countdown, or news are empty   | The extras depend on an external source and hide on failure. Make sure `EXTRAS_URL` is set (empty means disabled) and check the server log.                                                  |
| 403 from one source in production          | The source blocks datacenter IPs. Remove it from `DEFAULT_SOURCE_IDS` or use a mirror address.                                                         |

---

## // Streaming Notes

1. **Server choice.** The first server in the list is tried first. If it fails, the player moves to the next.
2. **HTTP Range.** The player uses `/api/stream-proxy` to forward byte ranges, so seeking does not wait for the full video.
3. **Autoplay and Sleep Timer.** Autoplay has a 5-second countdown. The Sleep Timer ranges from 15 to 60 minutes.
4. **Server memory.** The proxy streams data through and never buffers the whole file in memory.

---

## // Known Limitations

- Scrapers read other sites' HTML. If a site changes its layout, the selectors may stop working and need updating. Source domains can also move.
- Scrapers have no automated tests against the real sites. The offline-testable parts (ID format, tokens, cache, URL checks, query cleaning, alias matching) were tried, but each source's HTML parsing needs a live check after deploy.
- Only AnimeIn and NontonAnimeID have paginated latest and popular lists and a schedule. Other sources show up on page one, in search, and in genres.
- AnimeIn episode lists are fetched 30 at a time with a 10-page limit, so one anime shows at most 300 episodes (`MAX_EPISODE_PAGES` in `sources/animein.server.ts`).
- Genres are merged by name. Differently spelled genre names across sites can appear as two genres.
- The social features have no server-side rate limiting. The Firestore rules prevent identity forgery, but not message or notification spam from real accounts.
- Level and EXP are stored in the user's own document, so the owner of that document can tamper with them. Level is therefore used only for display and for unlocking borders, never for permissions. Owner rights come from the verified email.
- Chat has no block or report feature, and there is no push while the browser is fully closed.
- The hianime-api extras match anime by exact title, so an anime written differently across sites gets no characters or countdown.
- The Samehadaku scraper's search and AJAX player calls use generic WordPress patterns and need a live check. Samehadaku genres are unavailable.

---

## // npm Scripts

```bash
npm run dev      # Local development server
npm run build    # Production build
npm run start    # Run the build
npm run lint     # ESLint
npm run format   # Prettier
```

---

## // Disclaimer and Credits

nontonime does not store or host any video files. All content comes from third-party sites and the copyright belongs to the respective holders. Content owners may request removal through the source sites' administrators.

- **Developer**: [NimzzAI](https://github.com/NimzzAI)
- **Scraper logic base**: the hwaverseB backend
- **Extras (characters, countdown, news, top search)**: adapted from the hianime-api project
- **License**: [MIT License](./LICENSE)
