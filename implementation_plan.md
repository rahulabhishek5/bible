# Architecture Consolidation & Migration Plan

This document evaluates the feasibility of eliminating the dedicated backend infrastructure for the Bible application, aiming for a unified, low-maintenance architecture while preserving all data integrity, search functionality, and UI/UX features.

## Step 1: Codebase & Data Layer Audit (Summary)
- **Data Storage**: The app uses three read-only SQLite databases (`kjv_en.db`, `telugu_bsi.db`, `hindi_bible.db`) totaling ~51MB uncompressed. 
- **API Mapping**: The Express server exposes three endpoints:
  1. `/navigation-menu`: Queries `PRAGMA table_info` and aggregates books/chapters.
  2. `/chapter/:book/:chapter`: Fetches and maps verses (with custom blob parsing for Hindi).
  3. `/search?q=...`: Performs concurrent `LIKE` queries across all databases and zips results.
- **Client Integrity Requirements**: 
  - Grapheme-cluster-safe highlighting using `NFC` normalization and RegExp.
  - Native clipboard event interception (`handleNativeCopy`).
  - Dynamic CSS variable-based theming and font scaling.

---

## Step 2: Architectural Trade-Off Matrix

| Feature | Current (Express + SQLite) | Pattern A: Static JSON Chunks | Pattern B: Edge API | Pattern C: In-Browser SQLite (WASM) |
| :--- | :--- | :--- | :--- | :--- |
| **Operational Cost** | Medium (Requires Node container) | **Zero** | Low (Serverless limits) | **Zero (Static Hosting)** |
| **Cold-Start Latency**| Medium | Fast (CDN) | Slow (Serverless Cold Start)| **Instant (After initial load)** |
| **Search Execution** | Fast (Server-side SQL) | Slow (Requires client indexing) | Fast (Edge SQL) | **Fast (WASM SQLite)** |
| **Offline Capability**| No | **Yes (PWA)** | No | **Yes (OPFS / IndexedDB)** |
| **Build Complexity** | Low | High (Chunk generation scripts)| Medium | Medium (WASM setup) |
| **Maintenance** | Medium (Server upkeep) | Low | Low | **Zero (Once deployed)** |

---

## Recommended Target Architecture: Pattern C (In-Browser Embedded Database via WASM)

**Recommendation Rationale**: 
Given the read-only nature of the data and the total uncompressed size of ~51MB (which compresses to ~15-20MB over the wire), **Pattern C (WASM SQLite with OPFS/IndexedDB caching)** is the absolute best fit. 

It completely eliminates the need for a backend server, reducing operational costs to zero. By leveraging `sql.js` or the official SQLite WASM build, the exact same SQL queries (including the complex concurrent search zipping and Hindi text parsing) can execute directly in the user's browser. Once downloaded, the app becomes a fully offline-capable Progressive Web App (PWA).

> [!IMPORTANT]
> **Data Transfer Optimization**
> To prevent a massive 50MB initial payload penalty, the databases should be fetched asynchronously in the background using a Service Worker and cached in the browser's Origin Private File System (OPFS), displaying a loading progress bar only on the first visit.

---

## Migration Roadmap

To transition to Pattern C without breaking existing functionality, we will follow these phases:

### Phase 1: Dependency & WASM Integration (Client-Side)
1. Install `sql.js` (or `@sqlite.org/sqlite-wasm`) in the React `client` project.
2. Move the three `.db` files into the `public/data/` directory of the Vite React app so they are served statically.
3. Create a Web Worker (`db.worker.js`) to offload all database fetching, initialization, and querying to a background thread to guarantee the UI remains strictly 60fps.

### Phase 2: Logic Porting (Server to Client Worker)
1. Port the `initDatabases()` logic from `bibleRoutes.js` into the Web Worker.
2. Translate the three API routes into Web Worker message handlers:
   - `MESSAGE_GET_NAV` -> Returns cached navigation structure.
   - `MESSAGE_GET_CHAPTER` -> Executes chapter fetch and the crucial Hindi blob parsing regex.
   - `MESSAGE_SEARCH` -> Executes the unified `LIKE` queries.

### Phase 3: UI Layer Refactoring
1. Refactor `App.jsx` to replace `fetch(API_BASE + '...')` calls with asynchronous messaging to the Web Worker.
2. Implement a global "Initial Data Sync" loading overlay for the first visit to handle the ~20MB background download of the DB files.
3. Preserve the `handleNativeCopy` and `highlightText` functions exactly as they are—they operate entirely on the DOM and string manipulation levels, completely independent of the data fetch layer.

### Phase 4: Final Consolidation & Cleanup
1. Delete the `bible-imported/server` folder entirely.
2. Merge the resulting standalone Vite PWA directly into the main Church Website (`sanctuary-light`) codebase under a `/bible` subpath route.
3. Verify accessibility focus states and custom theming remain unaffected.

---

## User Review Required

Does this In-Browser WASM SQLite approach align with your expectations for a zero-maintenance architecture? If approved, I can begin executing Phase 1 and 2 to convert the database layer to run natively in the browser.
