# Graph Report - bad-matchup  (2026-10-18)

## Corpus Check
- 32 files · ~34,677 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .css 1)

## Summary
- 261 nodes · 740 edges · 10 communities (9 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1205722d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- matchmaker.js
- App.jsx
- package.json
- PlayTab.jsx
- exportImage.js
- 🏸 Bad Matchup · จับคู่ตีแบด
- HelpSheet.jsx
- matchmaker.rules.test.js
- cx
- CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `cx()` - 57 edges
2. `App()` - 26 edges
3. `Button()` - 20 edges
4. `PlayTab()` - 18 edges
5. `Card()` - 18 edges
6. `PlayersTab()` - 16 edges
7. `Sheet()` - 16 edges
8. `react` - 14 edges
9. `SettingsTab()` - 14 edges
10. `StatsTab()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Icon()` --calls--> `cx()`  [EXTRACTED]
  src/App.jsx → src/components/ui.jsx
- `CourtsTab()` --indirect_call--> `isAvailable()`  [INFERRED]
  src/components/CourtsTab.jsx → src/lib/matchmaker.js
- `App()` --calls--> `CourtsTab()`  [EXTRACTED]
  src/App.jsx → src/components/CourtsTab.jsx
- `App()` --calls--> `PlayersTab()`  [EXTRACTED]
  src/App.jsx → src/components/PlayersTab.jsx
- `App()` --calls--> `PlayTab()`  [EXTRACTED]
  src/App.jsx → src/components/PlayTab.jsx

## Import Cycles
- None detected.

## Communities (10 total, 1 thin omitted)

### Community 0 - "matchmaker.js"
Cohesion: 0.12
Nodes (37): attempts(), buildOnce(), buildOnceAsync(), compareKeys(), cost(), courtSize(), createRefiner(), DEFAULT_LEVEL (+29 more)

### Community 1 - "App.jsx"
Cohesion: 0.09
Nodes (38): react-dom, App(), Header(), Icon(), ICONS, TABS, DEFAULT_COUNTS, pickTuning() (+30 more)

### Community 2 - "package.json"
Cohesion: 0.09
Nodes (23): dependencies, react, react-dom, description, devDependencies, tailwindcss, @tailwindcss/vite, vite (+15 more)

### Community 3 - "PlayTab.jsx"
Cohesion: 0.23
Nodes (17): analyse(), FairnessReport(), MeetGrid(), Chevron(), isArchived(), MODES, PlayTab(), RoundCard() (+9 more)

### Community 4 - "exportImage.js"
Cohesion: 0.18
Nodes (17): ImageSheet(), asFile(), canSharePng(), downloadPng(), drawSchedule(), ellipsize(), F, filename() (+9 more)

### Community 5 - "🏸 Bad Matchup · จับคู่ตีแบด"
Cohesion: 0.15
Nodes (12): 🏸 Bad Matchup · จับคู่ตีแบด, Deploy, Export รูป / Image export, GitHub Pages, การจับคู่ทำงานยังไง / How the matching works, ข้อมูล / Data, ธีม / Theme, ผลที่วัดได้ (จำลอง 8 ครั้งต่อสถานการณ์) (+4 more)

### Community 6 - "HelpSheet.jsx"
Cohesion: 0.11
Nodes (32): PAIRINGS, REST, Heatmap(), HelpInsight(), LEVEL, OPTIONS, PairArt(), PolishArt() (+24 more)

### Community 7 - "matchmaker.rules.test.js"
Cohesion: 0.30
Nodes (12): vitest, QUICK, analyse(), build(), courts(), expectValidRound(), FAST, key() (+4 more)

### Community 9 - "cx"
Cohesion: 0.14
Nodes (39): react, CourtIcon(), CourtsTab(), MatchCard(), SCORE_TONE, ScoreBox(), SIDE, Slot() (+31 more)

## Knowledge Gaps
- **1 isolated node(s):** `tailwindcss`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 55 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cx()` connect `cx` to `App.jsx`, `PlayTab.jsx`, `HelpSheet.jsx`?**
  _High betweenness centrality (0.162) - this node is a cross-community bridge._
- **What connects `tailwindcss` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `matchmaker.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1166429587482219 - nodes in this community are weakly interconnected._
- **Why does `react` connect `cx` to `App.jsx`, `package.json`, `PlayTab.jsx`, `exportImage.js`, `HelpSheet.jsx`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09494949494949495 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.08666666666666667 - nodes in this community are weakly interconnected._
- **Should `HelpSheet.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11428571428571428 - nodes in this community are weakly interconnected._