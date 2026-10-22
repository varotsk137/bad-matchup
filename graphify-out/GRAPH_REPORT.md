# Graph Report - pwa-offline-315cea  (2026-10-23)

## Corpus Check
- 61 files · ~58,839 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .example 1, .rules 1)

## Summary
- 454 nodes · 1228 edges · 17 communities (16 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c168effe`
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
- matchmaker.rules.test.js
- share.js
- package.json
- dependencies
- devDependencies
- CLAUDE.md
- scripts
- vite.config.js
- roomRemote.js
- App.jsx

## God Nodes (most connected - your core abstractions)
1. `cx()` - 64 edges
2. `App()` - 45 edges
3. `Button()` - 28 edges
4. `PlayTab()` - 22 edges
5. `Card()` - 22 edges
6. `Sheet()` - 22 edges
7. `SettingsTab()` - 18 edges
8. `react` - 17 edges
9. `PlayersTab()` - 16 edges
10. `vitest` - 14 edges

## Surprising Connections (you probably didn't know these)
- `CourtsTab()` --indirect_call--> `isAvailable()`  [INFERRED]
  src/components/CourtsTab.jsx → src/lib/matchmaker.js
- `Icon()` --calls--> `cx()`  [EXTRACTED]
  src/App.jsx → src/components/ui.jsx
- `App()` --calls--> `CourtsTab()`  [EXTRACTED]
  src/App.jsx → src/components/CourtsTab.jsx
- `App()` --calls--> `PlayersTab()`  [EXTRACTED]
  src/App.jsx → src/components/PlayersTab.jsx
- `App()` --calls--> `PlayTab()`  [EXTRACTED]
  src/App.jsx → src/components/PlayTab.jsx

## Import Cycles
- None detected.

## Communities (17 total, 1 thin omitted)

### Community 0 - "matchmaker.js"
Cohesion: 0.07
Nodes (62): analyse(), Chevron(), DEFAULT_COUNTS, isArchived(), MODES, PlayTab(), Stepper(), HOURS (+54 more)

### Community 1 - "App.jsx"
Cohesion: 0.13
Nodes (19): player(), sample(), DEFAULT_SKIN, isSkin(), loaded, SKINS, defaultState(), DEVICE_KEYS (+11 more)

### Community 2 - "rooms.rules.test.js"
Cohesion: 0.09
Nodes (19): players(), PREVIEW_URL, savedState(), seed(), shareHash(), STORAGE_KEY, EIGHT, EIGHT (+11 more)

### Community 3 - "ui.jsx"
Cohesion: 0.10
Nodes (59): react, Icon(), CourtIcon(), CourtsTab(), FairnessReport(), MeetGrid(), MatchCard(), SCORE_TONE (+51 more)

### Community 4 - "exportImage.js"
Cohesion: 0.20
Nodes (15): ImageSheet(), asFile(), canSharePng(), downloadPng(), drawSchedule(), ellipsize(), F, filename() (+7 more)

### Community 5 - "🏸 Bad Matchup"
Cohesion: 0.09
Nodes (22): 🏸 Bad Matchup, Data and privacy, Deployment, During the session, Everything else, Features, Getting started, Highlights (+14 more)

### Community 6 - "HelpSheet.jsx"
Cohesion: 0.11
Nodes (31): PAIRINGS, REST, Heatmap(), HelpInsight(), LEVEL, OPTIONS, PairArt(), PolishArt() (+23 more)

### Community 7 - "matchmaker.rules.test.js"
Cohesion: 0.31
Nodes (15): vitest, generateRounds(), QUICK, situation(), session(), analyse(), build(), courts() (+7 more)

### Community 8 - "share.js"
Cohesion: 0.33
Nodes (10): buildShareUrl(), canCompress(), decodeShare(), deflate(), encodeShare(), fromB64Url(), inflate(), packSession() (+2 more)

### Community 9 - "package.json"
Cohesion: 0.13
Nodes (14): description, name, private, type, version, firebase-tools, @fontsource/inter, @fontsource/kanit (+6 more)

### Community 10 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, firebase, @fontsource/inter, @fontsource/kanit, @fontsource/mali, @fontsource/mitr, @fontsource/noto-sans-thai, @fontsource/noto-serif-thai (+2 more)

### Community 11 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, @firebase/rules-unit-testing, firebase-tools, @playwright/test, tailwindcss, @tailwindcss/vite, vite, vite-plugin-pwa (+2 more)

### Community 13 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, dev:emulator, e2e, emulators, preview, test (+1 more)

### Community 14 - "vite.config.js"
Cohesion: 0.29
Nodes (5): @tailwindcss/vite, vite, vite-plugin-pwa, @vitejs/plugin-react, FONTS

### Community 38 - "roomRemote.js"
Cohesion: 0.17
Nodes (19): firebase, app, auth, config, db, packRoom(), unpackRoom(), closeRoom() (+11 more)

### Community 51 - "App.jsx"
Cohesion: 0.07
Nodes (56): App(), Header(), ICONS, loadRemote(), TABS, LinkCard(), LiveRoomSheet(), Note() (+48 more)

## Knowledge Gaps
- **6 isolated node(s):** `@fontsource/kanit`, `@fontsource/mali`, `@fontsource/mitr`, `@fontsource/noto-serif-thai`, `firebase-tools` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 119 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cx()` connect `ui.jsx` to `matchmaker.js`, `App.jsx`, `HelpSheet.jsx`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **What connects `@fontsource/kanit`, `@fontsource/mali`, `@fontsource/mitr` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `matchmaker.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07033248081841433 - nodes in this community are weakly interconnected._
- **Why does `react` connect `ui.jsx` to `matchmaker.js`, `exportImage.js`, `HelpSheet.jsx`, `package.json`, `App.jsx`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12643678160919541 - nodes in this community are weakly interconnected._
- **Why does `@playwright/test` connect `rooms.rules.test.js` to `package.json`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Should `rooms.rules.test.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08817204301075268 - nodes in this community are weakly interconnected._