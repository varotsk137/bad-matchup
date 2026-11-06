# Graph Report - reload-skills-f78f93  (2026-11-07)

## Corpus Check
- 79 files · ~75,804 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .example 1, .rules 1)

## Summary
- 595 nodes · 1696 edges · 20 communities (18 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0a2835dd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- matchmaker.js
- App.jsx
- rooms.rules.test.js
- exportImage.js
- 🏸 Bad Matchup
- HelpSheet.jsx
- CostSplitSheet.jsx
- App.jsx
- package.json
- dependencies
- devDependencies
- CLAUDE.md
- scripts
- vite.config.js
- rooms.rules.test.js
- cx
- share.js
- make-icons.mjs
- fonts.js
- App.jsx

## God Nodes (most connected - your core abstractions)
1. `cx()` - 72 edges
2. `App()` - 49 edges
3. `PlayTab()` - 35 edges
4. `Button()` - 35 edges
5. `Sheet()` - 29 edges
6. `CostSplitSheet()` - 27 edges
7. `Icon()` - 26 edges
8. `PlayersTab()` - 26 edges
9. `SettingsTab()` - 26 edges
10. `Card()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `newPlayer()` --calls--> `uid()`  [EXTRACTED]
  src/lib/ops.js → src/lib/matchmaker.js
- `Icon()` --calls--> `cx()`  [EXTRACTED]
  src/App.jsx → src/components/ui.jsx
- `Header()` --calls--> `RoomStatus()`  [EXTRACTED]
  src/App.jsx → src/components/LiveRoomSheet.jsx
- `Header()` --calls--> `cx()`  [EXTRACTED]
  src/App.jsx → src/components/ui.jsx
- `App()` --calls--> `CourtsTab()`  [EXTRACTED]
  src/App.jsx → src/components/CourtsTab.jsx

## Import Cycles
- None detected.

## Communities (20 total, 2 thin omitted)

### Community 0 - "matchmaker.js"
Cohesion: 0.08
Nodes (56): vitest, HOURS, MINUTES, Pick(), RoundAdvisor(), Row(), attempts(), buildOnce() (+48 more)

### Community 1 - "App.jsx"
Cohesion: 0.06
Nodes (37): Chevron(), Field(), Group(), pickTuning(), SettingsTab(), SkinSwatch(), SkinTile(), Slider() (+29 more)

### Community 2 - "rooms.rules.test.js"
Cohesion: 0.19
Nodes (10): players(), PREVIEW_URL, savedState(), seed(), shareHash(), STORAGE_KEY, EIGHT, EIGHT (+2 more)

### Community 4 - "exportImage.js"
Cohesion: 0.10
Nodes (36): uqr, ImageSheet(), QrCode(), asFile(), canSharePng(), downloadPng(), drawSchedule(), ellipsize() (+28 more)

### Community 5 - "🏸 Bad Matchup"
Cohesion: 0.09
Nodes (22): 🏸 Bad Matchup, Data and privacy, Deployment, During the session, Everything else, Features, Getting started, Highlights (+14 more)

### Community 6 - "HelpSheet.jsx"
Cohesion: 0.11
Nodes (30): PAIRINGS, REST, Heatmap(), HelpInsight(), LEVEL, OPTIONS, PairArt(), PolishArt() (+22 more)

### Community 7 - "CostSplitSheet.jsx"
Cohesion: 0.16
Nodes (28): CostSplitSheet(), MoneyInput(), ROUNDINGS, sessionPlayers(), Working(), PaymentCard(), loadPaid(), loadPayment() (+20 more)

### Community 8 - "App.jsx"
Cohesion: 0.08
Nodes (45): App(), Header(), ICONS, loadRemote(), TABS, InstallInvite(), InstallRow(), InstallSheet() (+37 more)

### Community 9 - "package.json"
Cohesion: 0.10
Nodes (20): description, name, private, type, version, firebase-tools, @fontsource/bai-jamjuree, @fontsource/chakra-petch (+12 more)

### Community 10 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, firebase, @fontsource/bai-jamjuree, @fontsource/chakra-petch, @fontsource/inter, @fontsource/itim, @fontsource/kanit, @fontsource/kodchasan (+11 more)

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

### Community 17 - "cx"
Cohesion: 0.07
Nodes (100): react, Icon(), CourtDrawing(), CourtsTab(), reduceMotion(), SIDE, analyse(), FairnessReport() (+92 more)

### Community 18 - "share.js"
Cohesion: 0.33
Nodes (10): buildShareUrl(), canCompress(), decodeShare(), deflate(), encodeShare(), fromB64Url(), inflate(), packSession() (+2 more)

### Community 19 - "make-icons.mjs"
Cohesion: 0.40
Nodes (3): icons, square, svg

### Community 51 - "App.jsx"
Cohesion: 0.09
Nodes (43): firebase, Chip(), HistoryList(), RoomHistorySheet(), app, auth, config, db (+35 more)

## Knowledge Gaps
- **14 isolated node(s):** `@fontsource/bai-jamjuree`, `@fontsource/chakra-petch`, `@fontsource/itim`, `@fontsource/kanit`, `@fontsource/kodchasan` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 151 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `cx` to `App.jsx`, `exportImage.js`, `HelpSheet.jsx`, `CostSplitSheet.jsx`, `App.jsx`, `package.json`, `App.jsx`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **What connects `@fontsource/bai-jamjuree`, `@fontsource/chakra-petch`, `@fontsource/itim` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `matchmaker.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0764423076923077 - nodes in this community are weakly interconnected._
- **Why does `cx()` connect `cx` to `App.jsx`, `exportImage.js`, `HelpSheet.jsx`, `CostSplitSheet.jsx`, `App.jsx`, `App.jsx`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06428988895382817 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `matchmaker.js` to `App.jsx`, `CostSplitSheet.jsx`, `App.jsx`, `package.json`, `vite.config.js`, `rooms.rules.test.js`, `cx`, `App.jsx`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Should `exportImage.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._