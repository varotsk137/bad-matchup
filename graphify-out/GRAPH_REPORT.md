# Graph Report - v31-polish  (2026-10-24)

## Corpus Check
- 76 files · ~67,182 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .example 1, .rules 1)

## Summary
- 536 nodes · 1512 edges · 20 communities (19 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `44a3a943`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- matchmaker.js
- App.jsx
- rooms.rules.test.js
- cx
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
- ui.jsx
- roomRemote.js
- App.jsx

## God Nodes (most connected - your core abstractions)
1. `cx()` - 69 edges
2. `App()` - 46 edges
3. `Button()` - 30 edges
4. `CostSplitSheet()` - 27 edges
5. `Card()` - 26 edges
6. `PlayTab()` - 23 edges
7. `Sheet()` - 22 edges
8. `PlayersTab()` - 21 edges
9. `react` - 20 edges
10. `SettingsTab()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `Icon()` --calls--> `cx()`  [EXTRACTED]
  src/App.jsx → src/components/ui.jsx
- `PaymentCard()` --indirect_call--> `loadPayment()`  [INFERRED]
  src/components/PaymentCard.jsx → src/lib/payment.js
- `PlayTab()` --indirect_call--> `isAvailable()`  [INFERRED]
  src/components/PlayTab.jsx → src/lib/matchmaker.js
- `newPlayer()` --calls--> `uid()`  [EXTRACTED]
  src/lib/ops.js → src/lib/matchmaker.js
- `App()` --calls--> `CourtsTab()`  [EXTRACTED]
  src/App.jsx → src/components/CourtsTab.jsx

## Import Cycles
- None detected.

## Communities (20 total, 1 thin omitted)

### Community 0 - "matchmaker.js"
Cohesion: 0.08
Nodes (60): vitest, HOURS, MINUTES, Pick(), RoundAdvisor(), Row(), attempts(), buildOnce() (+52 more)

### Community 1 - "App.jsx"
Cohesion: 0.09
Nodes (27): DEFAULT_LEVEL, DEFAULT_OPTIONS, DEFAULT_WEIGHTS, newPlayer(), ops, player(), sample(), DEFAULT_SKIN (+19 more)

### Community 2 - "rooms.rules.test.js"
Cohesion: 0.19
Nodes (10): players(), PREVIEW_URL, savedState(), seed(), shareHash(), STORAGE_KEY, EIGHT, EIGHT (+2 more)

### Community 3 - "cx"
Cohesion: 0.14
Nodes (35): analyse(), FairnessReport(), MeetGrid(), MatchCard(), SCORE_TONE, ScoreBox(), SIDE, Slot() (+27 more)

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
Cohesion: 0.26
Nodes (12): buildShareUrl(), canCompress(), clearShareHash(), decodeShare(), deflate(), encodeShare(), fromB64Url(), inflate() (+4 more)

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

### Community 17 - "ui.jsx"
Cohesion: 0.11
Nodes (53): react, CourtIcon(), CourtsTab(), PaymentCard(), levelLabel(), NameCount(), nextStatus(), PlayerEditor() (+45 more)

### Community 38 - "roomRemote.js"
Cohesion: 0.18
Nodes (17): firebase, loadRemote(), app, auth, config, db, closeRoom(), createRoom() (+9 more)

### Community 51 - "App.jsx"
Cohesion: 0.06
Nodes (61): react-dom, App(), Header(), Icon(), ICONS, TABS, LinkCard(), LiveRoomSheet() (+53 more)

## Knowledge Gaps
- **6 isolated node(s):** `@fontsource/kanit`, `@fontsource/mali`, `@fontsource/mitr`, `@fontsource/noto-serif-thai`, `firebase-tools` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 124 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cx()` connect `cx` to `matchmaker.js`, `HelpSheet.jsx`, `CostSplitSheet.jsx`, `ui.jsx`, `App.jsx`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `CostSplitSheet()` (e.g. with `loadPayment()` and `loadSplitView()`) actually correct?**
  _`CostSplitSheet()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@fontsource/kanit`, `@fontsource/mali`, `@fontsource/mitr` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `matchmaker.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07945566286215978 - nodes in this community are weakly interconnected._
- **Why does `react` connect `ui.jsx` to `cx`, `exportImage.js`, `HelpSheet.jsx`, `CostSplitSheet.jsx`, `package.json`, `App.jsx`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09102564102564102 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `matchmaker.js` to `App.jsx`, `CostSplitSheet.jsx`, `package.json`, `vite.config.js`, `rooms.rules.test.js`, `ui.jsx`, `App.jsx`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._