# Graph Report - bad-matchup  (2026-10-18)

## Corpus Check
- 32 files · ~35,598 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .css 1)

## Summary
- 264 nodes · 752 edges · 11 communities (10 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ae2d81fa`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- matchmaker.js
- App.jsx
- package.json
- SettingsTab.jsx
- exportImage.js
- 🏸 Bad Matchup · จับคู่ตีแบด
- HelpSheet.jsx
- matchmaker.rules.test.js
- share.js
- cx
- CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `cx()` - 57 edges
2. `App()` - 27 edges
3. `PlayTab()` - 20 edges
4. `Button()` - 20 edges
5. `Card()` - 18 edges
6. `Sheet()` - 18 edges
7. `PlayersTab()` - 16 edges
8. `react` - 14 edges
9. `SettingsTab()` - 14 edges
10. `StatsTab()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Icon()` --calls--> `cx()`  [EXTRACTED]
  src/App.jsx → src/components/ui.jsx
- `App()` --indirect_call--> `loadState()`  [INFERRED]
  src/App.jsx → src/lib/storage.js
- `CourtsTab()` --indirect_call--> `isAvailable()`  [INFERRED]
  src/components/CourtsTab.jsx → src/lib/matchmaker.js
- `PlayTab()` --indirect_call--> `isAvailable()`  [INFERRED]
  src/components/PlayTab.jsx → src/lib/matchmaker.js
- `App()` --calls--> `CourtsTab()`  [EXTRACTED]
  src/App.jsx → src/components/CourtsTab.jsx

## Import Cycles
- None detected.

## Communities (11 total, 1 thin omitted)

### Community 0 - "matchmaker.js"
Cohesion: 0.12
Nodes (39): attempts(), buildOnce(), buildOnceAsync(), compareKeys(), cost(), courtSize(), createEmptyRound(), createRefiner() (+31 more)

### Community 1 - "App.jsx"
Cohesion: 0.12
Nodes (26): react-dom, App(), Header(), Icon(), ICONS, TABS, analyse(), Chevron() (+18 more)

### Community 2 - "package.json"
Cohesion: 0.09
Nodes (23): dependencies, react, react-dom, description, devDependencies, tailwindcss, @tailwindcss/vite, vite (+15 more)

### Community 3 - "SettingsTab.jsx"
Cohesion: 0.26
Nodes (13): pickTuning(), SettingsTab(), Slider(), Toggle(), DEFAULT_OPTIONS, DEFAULT_WEIGHTS, clearState(), defaultState() (+5 more)

### Community 4 - "exportImage.js"
Cohesion: 0.19
Nodes (17): ImageSheet(), ScheduleTable(), asFile(), canSharePng(), downloadPng(), drawSchedule(), ellipsize(), F (+9 more)

### Community 5 - "🏸 Bad Matchup · จับคู่ตีแบด"
Cohesion: 0.14
Nodes (13): 🏸 Bad Matchup · จับคู่ตีแบด, Deploy, Export รูป / Image export, GitHub Pages, การจับคู่ทำงานยังไง / How the matching works, ข้อมูล / Data, ทดสอบ / Tests, ธีม / Theme (+5 more)

### Community 6 - "HelpSheet.jsx"
Cohesion: 0.11
Nodes (32): PAIRINGS, REST, Heatmap(), HelpInsight(), LEVEL, OPTIONS, PairArt(), PolishArt() (+24 more)

### Community 7 - "matchmaker.rules.test.js"
Cohesion: 0.30
Nodes (12): vitest, QUICK, analyse(), build(), courts(), expectValidRound(), FAST, key() (+4 more)

### Community 8 - "share.js"
Cohesion: 0.29
Nodes (11): buildShareUrl(), canCompress(), decodeShare(), deflate(), encodeShare(), fromB64Url(), inflate(), packSession() (+3 more)

### Community 9 - "cx"
Cohesion: 0.13
Nodes (44): react, CourtIcon(), CourtsTab(), FairnessReport(), MeetGrid(), MatchCard(), SCORE_TONE, ScoreBox() (+36 more)

## Knowledge Gaps
- **1 isolated node(s):** `tailwindcss`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 56 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cx()` connect `cx` to `App.jsx`, `SettingsTab.jsx`, `exportImage.js`, `HelpSheet.jsx`?**
  _High betweenness centrality (0.159) - this node is a cross-community bridge._
- **What connects `tailwindcss` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `matchmaker.js` be split into smaller, more focused modules?**
  _Cohesion score 0.12051282051282051 - nodes in this community are weakly interconnected._
- **Why does `react` connect `cx` to `App.jsx`, `package.json`, `SettingsTab.jsx`, `exportImage.js`, `HelpSheet.jsx`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11612903225806452 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.08666666666666667 - nodes in this community are weakly interconnected._
- **Should `🏸 Bad Matchup · จับคู่ตีแบด` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._