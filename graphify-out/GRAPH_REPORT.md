# Graph Report - try-v31  (2026-10-23)

## Corpus Check
- 72 files · ~64,836 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .example 1, .rules 1)

## Summary
- 510 nodes · 1411 edges · 19 communities (18 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6c86b70a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- matchmaker.js
- App.jsx
- rooms.rules.test.js
- ui.jsx
- exportImage.js
- 🏸 Bad Matchup
- HelpSheet.jsx
- CostSplitSheet.jsx
- share.js
- package.json
- dependencies
- devDependencies
- CLAUDE.md
- scripts
- vite.config.js
- rooms.rules.test.js
- make-icons.mjs
- roomRemote.js
- App.jsx

## God Nodes (most connected - your core abstractions)
1. `cx()` - 68 edges
2. `App()` - 45 edges
3. `Button()` - 32 edges
4. `CostSplitSheet()` - 27 edges
5. `Card()` - 24 edges
6. `Sheet()` - 24 edges
7. `PlayTab()` - 23 edges
8. `react` - 20 edges
9. `SettingsTab()` - 19 edges
10. `vitest` - 16 edges

## Surprising Connections (you probably didn't know these)
- `CourtsTab()` --indirect_call--> `isAvailable()`  [INFERRED]
  src/components/CourtsTab.jsx → src/lib/matchmaker.js
- `PaymentCard()` --indirect_call--> `loadPayment()`  [INFERRED]
  src/components/PaymentCard.jsx → src/lib/payment.js
- `PlayTab()` --indirect_call--> `isAvailable()`  [INFERRED]
  src/components/PlayTab.jsx → src/lib/matchmaker.js
- `SettingsTab()` --indirect_call--> `loadSkinFont()`  [INFERRED]
  src/components/SettingsTab.jsx → src/lib/skins.js
- `newPlayer()` --calls--> `uid()`  [EXTRACTED]
  src/lib/ops.js → src/lib/matchmaker.js

## Import Cycles
- None detected.

## Communities (19 total, 1 thin omitted)

### Community 0 - "matchmaker.js"
Cohesion: 0.07
Nodes (67): vitest, HOURS, MINUTES, Pick(), RoundAdvisor(), Row(), attempts(), buildOnce() (+59 more)

### Community 1 - "App.jsx"
Cohesion: 0.10
Nodes (25): DEFAULT_LEVEL, DEFAULT_OPTIONS, DEFAULT_WEIGHTS, newPlayer(), ops, player(), sample(), DEFAULT_SKIN (+17 more)

### Community 2 - "rooms.rules.test.js"
Cohesion: 0.19
Nodes (10): players(), PREVIEW_URL, savedState(), seed(), shareHash(), STORAGE_KEY, EIGHT, EIGHT (+2 more)

### Community 3 - "ui.jsx"
Cohesion: 0.10
Nodes (64): react, Icon(), CourtIcon(), CourtsTab(), analyse(), FairnessReport(), MeetGrid(), MatchCard() (+56 more)

### Community 4 - "exportImage.js"
Cohesion: 0.20
Nodes (15): ImageSheet(), asFile(), canSharePng(), downloadPng(), drawSchedule(), ellipsize(), F, filename() (+7 more)

### Community 5 - "🏸 Bad Matchup"
Cohesion: 0.09
Nodes (22): 🏸 Bad Matchup, Data and privacy, Deployment, During the session, Everything else, Features, Getting started, Highlights (+14 more)

### Community 6 - "HelpSheet.jsx"
Cohesion: 0.11
Nodes (31): PAIRINGS, REST, Heatmap(), HelpInsight(), LEVEL, OPTIONS, PairArt(), PolishArt() (+23 more)

### Community 7 - "CostSplitSheet.jsx"
Cohesion: 0.10
Nodes (41): uqr, CostSplitSheet(), MoneyInput(), ROUNDINGS, sessionPlayers(), Working(), QrCode(), loadPaid() (+33 more)

### Community 8 - "share.js"
Cohesion: 0.33
Nodes (10): buildShareUrl(), canCompress(), decodeShare(), deflate(), encodeShare(), fromB64Url(), inflate(), packSession() (+2 more)

### Community 9 - "package.json"
Cohesion: 0.14
Nodes (13): description, name, private, type, version, firebase-tools, @fontsource/inter, @fontsource/kanit (+5 more)

### Community 10 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, firebase, @fontsource/inter, @fontsource/kanit, @fontsource/mali, @fontsource/mitr, @fontsource/noto-sans-thai, @fontsource/noto-serif-thai (+3 more)

### Community 11 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, @firebase/rules-unit-testing, firebase-tools, @playwright/test, tailwindcss, @tailwindcss/vite, vite, vite-plugin-pwa (+2 more)

### Community 13 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, dev:emulator, e2e, emulators, preview, test (+1 more)

### Community 14 - "vite.config.js"
Cohesion: 0.29
Nodes (5): @tailwindcss/vite, vite, vite-plugin-pwa, @vitejs/plugin-react, FONTS

### Community 15 - "rooms.rules.test.js"
Cohesion: 0.27
Nodes (7): @firebase/rules-unit-testing, as(), join(), KEY, room(), seed(), writeResult()

### Community 16 - "make-icons.mjs"
Cohesion: 0.40
Nodes (3): icons, square, svg

### Community 38 - "roomRemote.js"
Cohesion: 0.19
Nodes (16): firebase, app, auth, config, db, closeRoom(), createRoom(), deleteRoom() (+8 more)

### Community 51 - "App.jsx"
Cohesion: 0.06
Nodes (61): react-dom, App(), Header(), ICONS, loadRemote(), TABS, LinkCard(), LiveRoomSheet() (+53 more)

## Knowledge Gaps
- **6 isolated node(s):** `@fontsource/kanit`, `@fontsource/mali`, `@fontsource/mitr`, `@fontsource/noto-serif-thai`, `firebase-tools` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 123 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cx()` connect `ui.jsx` to `matchmaker.js`, `App.jsx`, `HelpSheet.jsx`, `CostSplitSheet.jsx`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `CostSplitSheet()` (e.g. with `loadPayment()` and `loadSplitView()`) actually correct?**
  _`CostSplitSheet()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@fontsource/kanit`, `@fontsource/mali`, `@fontsource/mitr` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `matchmaker.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07368421052631578 - nodes in this community are weakly interconnected._
- **Why does `react` connect `ui.jsx` to `exportImage.js`, `HelpSheet.jsx`, `CostSplitSheet.jsx`, `package.json`, `App.jsx`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09815078236130868 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `matchmaker.js` to `App.jsx`, `CostSplitSheet.jsx`, `package.json`, `vite.config.js`, `rooms.rules.test.js`, `App.jsx`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._