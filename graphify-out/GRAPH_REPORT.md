# Graph Report - cost-split-28b38c  (2026-10-23)

## Corpus Check
- 66 files · ~59,037 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .example 1, .rules 1)

## Summary
- 450 nodes · 1276 edges · 14 communities (13 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c168effe`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- matchmaker.js
- App
- package.json
- ui.jsx
- exportImage.js
- 🏸 Bad Matchup
- HelpSheet.jsx
- CostSplitSheet.jsx
- share.js
- splitImage.js
- helpers.js
- CLAUDE.md
- roomRemote.js
- matchmaker.rules.test.js

## God Nodes (most connected - your core abstractions)
1. `cx()` - 66 edges
2. `App()` - 37 edges
3. `Button()` - 29 edges
4. `CostSplitSheet()` - 27 edges
5. `PlayTab()` - 23 edges
6. `Card()` - 22 edges
7. `Sheet()` - 22 edges
8. `react` - 19 edges
9. `SettingsTab()` - 18 edges
10. `PlayersTab()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `CourtsTab()` --indirect_call--> `isAvailable()`  [INFERRED]
  src/components/CourtsTab.jsx → src/lib/matchmaker.js
- `PaymentCard()` --indirect_call--> `loadPayment()`  [INFERRED]
  src/components/PaymentCard.jsx → src/lib/payment.js
- `newPlayer()` --calls--> `uid()`  [EXTRACTED]
  src/lib/ops.js → src/lib/matchmaker.js
- `Icon()` --calls--> `cx()`  [EXTRACTED]
  src/App.jsx → src/components/ui.jsx
- `App()` --calls--> `CourtsTab()`  [EXTRACTED]
  src/App.jsx → src/components/CourtsTab.jsx

## Import Cycles
- None detected.

## Communities (14 total, 1 thin omitted)

### Community 0 - "matchmaker.js"
Cohesion: 0.08
Nodes (60): analyse(), FairnessReport(), MeetGrid(), Chevron(), DEFAULT_COUNTS, isArchived(), MODES, PlayTab() (+52 more)

### Community 1 - "App"
Cohesion: 0.07
Nodes (45): App(), dict, LANGS, makeT(), DEFAULT_LEVEL, DEFAULT_OPTIONS, DEFAULT_WEIGHTS, newPlayer() (+37 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (35): dependencies, firebase, react, react-dom, uqr, description, devDependencies, @firebase/rules-unit-testing (+27 more)

### Community 3 - "ui.jsx"
Cohesion: 0.09
Nodes (65): react, Header(), Icon(), ICONS, TABS, CourtIcon(), CourtsTab(), LinkCard() (+57 more)

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
Cohesion: 0.17
Nodes (26): CostSplitSheet(), MoneyInput(), ROUNDINGS, sessionPlayers(), Working(), loadPaid(), loadPayment(), loadSplitView() (+18 more)

### Community 8 - "share.js"
Cohesion: 0.26
Nodes (12): buildShareUrl(), canCompress(), clearShareHash(), decodeShare(), deflate(), encodeShare(), fromB64Url(), inflate() (+4 more)

### Community 9 - "splitImage.js"
Cohesion: 0.24
Nodes (14): QrCode(), drawQr(), qrModules(), qrPath(), QUIET, drawBill(), ellipsize(), font() (+6 more)

### Community 10 - "helpers.js"
Cohesion: 0.29
Nodes (8): players(), savedState(), seed(), shareHash(), STORAGE_KEY, EIGHT, NINE, @playwright/test

### Community 38 - "roomRemote.js"
Cohesion: 0.10
Nodes (24): firebase, @firebase/rules-unit-testing, as(), join(), KEY, room(), seed(), writeResult() (+16 more)

### Community 51 - "matchmaker.rules.test.js"
Cohesion: 0.20
Nodes (20): vitest, generateRounds(), QUICK, swapSlots(), teamKey(), PLAN_MAX, PLAN_MIN, planKey() (+12 more)

## Knowledge Gaps
- **2 isolated node(s):** `firebase-tools`, `tailwindcss`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 93 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cx()` connect `ui.jsx` to `matchmaker.js`, `App`, `HelpSheet.jsx`, `CostSplitSheet.jsx`, `splitImage.js`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `CostSplitSheet()` (e.g. with `loadPayment()` and `loadSplitView()`) actually correct?**
  _`CostSplitSheet()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `firebase-tools`, `tailwindcss` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `matchmaker.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07932692307692307 - nodes in this community are weakly interconnected._
- **Why does `react` connect `ui.jsx` to `matchmaker.js`, `package.json`, `exportImage.js`, `HelpSheet.jsx`, `CostSplitSheet.jsx`, `splitImage.js`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Should `App` be split into smaller, more focused modules?**
  _Cohesion score 0.07320024198427103 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `matchmaker.rules.test.js` to `App`, `package.json`, `roomRemote.js`, `CostSplitSheet.jsx`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._