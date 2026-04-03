# QUANTA ⚡

> *An open-source, distraction-free exam engine for students.*
> *No login. No tracking. No ads. Just questions.*

**QUANTA** is a fully static, client-side exam engine that runs on GitHub Pages with zero build steps.
Drop a CSV into `data/`, register it in `exams.json`, and it appears in the exam selector — instantly available to anyone with the link.

---

## Screenshot & Demo

> `[Placeholder: Add a GIF or screenshot of the Selector view here]`
> `[Placeholder: Add a GIF of the Exam view in action here]`
> `[Placeholder: Add a screenshot of the Results + Section Breakdown here]`

**Live Demo:** `[Placeholder: Add your GitHub Pages URL here]`

---

## Features

| Feature | Details |
|---|---|
| **Exam Selector** | Browse and select from multiple exam CSVs via a card catalog |
| **Exam Mode** | Traditional timed assessment — score + explanations revealed at the end |
| **Practice Mode** | Instant per-question feedback with full explanation after each answer |
| **Flexible Timer** | Countdown (15–120 min) or unlimited elapsed mode |
| **Question Map** | Visual grid showing answered / flagged / current question status |
| **Flag System** | Mark questions for review before submitting |
| **Keyboard Shortcuts** | `A`–`D` select · `→`/`←` navigate · `F` flag |
| **Score Ring** | Animated circular score gauge with section breakdown bars |
| **Review Mode** | Filter by All / Correct / Incorrect / Skipped / Flagged with explanations |
| **Export JSON** | Download a full structured result report |
| **Light + Dark Mode** | System preference detection + manual toggle with smooth transitions |
| **Responsive** | Works well on mobile, tablet, and desktop |
| **Zero Dependencies** | Vanilla HTML + CSS + ES Modules. No npm, no bundler, no framework |

---

## Project Structure

```
quanta/
│
├── index.html                  ← App shell (single HTML file)
│
├── css/
│   ├── tokens.css              ← Design tokens: colors, fonts, spacing, shadows
│   ├── base.css                ← Reset, typography, layout primitives, animations
│   ├── components.css          ← Reusable UI: buttons, cards, badges, modals, toasts
│   └── views.css               ← View-specific styles (selector, lobby, exam, results, review)
│
├── js/
│   ├── app.js                  ← Entry point: registers routes and bootstraps the app
│   ├── router.js               ← Hash-based view router
│   ├── state.js                ← Singleton app state (cross-view data)
│   │
│   ├── models/
│   │   ├── Question.js         ← Immutable value object, validates CSV row data
│   │   └── Session.js          ← Mutable exam session: answers, flags, timing, results
│   │
│   ├── modules/
│   │   ├── CSVParser.js        ← RFC-4180 compliant CSV parser (handles quoted fields)
│   │   ├── Timer.js            ← Countdown + count-up timer, decoupled from DOM
│   │   ├── ThemeManager.js     ← Light/dark theme with localStorage persistence
│   │   └── ExamModes.js        ← OCP-compliant mode registry (Assessment, Practice)
│   │
│   └── views/
│       ├── BaseView.js         ← Abstract base: lifecycle, event registry, helpers
│       ├── SelectorView.js     ← Exam catalog / landing page
│       ├── LobbyView.js        ← Pre-exam configuration (mode, timer, options)
│       ├── ExamView.js         ← Main question interface (exam + practice)
│       ├── ResultsView.js      ← Score ring, stats, section breakdown, export
│       └── ReviewView.js       ← Filterable answer review with explanations
│
└── data/
    ├── exams.json              ← ★ Exam registry — register new exams here
    ├── xai-ml.csv              ← XAI & Responsible ML (100 questions)
    └── your-new-exam.csv       ← ← Add your CSV here
```

---

## Quick Start

QUANTA requires HTTP to fetch CSV files. The easiest local options:

```bash
# Python (built-in, no install)
python3 -m http.server 8000
# → open http://localhost:8000

# Node.js (no install)
npx serve .
# → open http://localhost:3000

# VS Code
# Install "Live Server" extension → right-click index.html → Open with Live Server
```

### GitHub Pages (recommended for sharing)

1. Push this repository to GitHub
2. Go to **Settings → Pages → Source → `main` branch → `/` (root)**
3. Your live URL will be `https://yourusername.github.io/quanta/`

All CSV fetching is relative — it just works.

---

## Adding a New Exam

### Step 1 — Prepare your CSV

Create a spreadsheet with these **exact column headers** and export as UTF-8 CSV:

| Column | Type | Description | Example |
|---|---|---|---|
| `id` | integer | Unique question number (1, 2, 3…) | `1` |
| `section_id` | integer | Section group number (1–N) | `2` |
| `section_name` | string | Human-readable section label | `"EDA and Graphical Methods"` |
| `question` | string | Full question text | `"Which measure of central tendency…"` |
| `option_a` | string | Option A text (no letter prefix) | `"Mean"` |
| `option_b` | string | Option B text | `"Median"` |
| `option_c` | string | Option C text | `"Mode"` |
| `option_d` | string | Option D text | `"Standard Deviation"` |
| `correct_answer` | string | Correct letter: `A`, `B`, `C`, or `D` | `"C"` |
| `explanation` | string | Why the answer is correct | `"The Mode is the most common value…"` |
| `difficulty` | string | `easy`, `medium`, or `hard` | `"medium"` |

**CSV formatting rules:**
- Wrap any field containing a comma in double-quotes: `"This is, a field"`
- Escape a literal double-quote by doubling it: `"She said ""hello"""`
- First row must be the exact header row shown above
- File must be UTF-8 encoded (default for most export tools)

**Minimal example:**
```csv
id,section_id,section_name,question,option_a,option_b,option_c,option_d,correct_answer,explanation,difficulty
1,1,"Biology Basics","What is the powerhouse of the cell?","Nucleus","Ribosome","Mitochondria","Golgi body","C","Mitochondria produce ATP through cellular respiration.","easy"
2,1,"Biology Basics","DNA stands for:","Dioxyribose Nucleic Acid","Deoxyribonucleic Acid","Dinitrogen Acetate","Deoxyribose Nitrogen Acid","B","DNA = Deoxyribonucleic Acid, the carrier of genetic information.","easy"
```

### Step 2 — Add the CSV to `/data`

```
data/
├── exams.json
├── xai-ml.csv
└── biology-101.csv      ← your new file
```

### Step 3 — Register it in `data/exams.json`

```json
[
  {
    "id": "biology-101",
    "title": "Biology 101",
    "description": "Covers cell biology, genetics, and evolution.",
    "file": "data/biology-101.csv",
    "tags": ["Biology", "Cell Biology", "Genetics"],
    "difficulty": "beginner",
    "sections": 3,
    "questionCount": 40,
    "estimatedMinutes": 30,
    "author": "Your Name"
  }
]
```

### Step 4 — Done

Refresh the page. Your exam appears in the selector.

---

## Architecture Notes

### Open/Closed Principle (OCP)

The codebase is designed to be **open for extension, closed for modification**.

**Adding a new Exam Mode** (e.g. "Timed Practice"):
1. Create `/js/modules/TimedPracticeMode.js` extending `ExamMode`
2. Add one line to the `MODES` registry in `ExamModes.js`
3. No other files change

**Adding a new View**:
1. Create `/js/views/MyView.js` extending `BaseView`
2. Add one line to `app.js`: `router.register('myview', MyView)`
3. No other files change

### View Lifecycle

Every view follows the same contract via `BaseView`:
- `render()` — builds DOM, binds events
- `destroy()` — automatically cleans up all registered event listeners

The router calls `destroy()` on the departing view before mounting the next one — no memory leaks.

---

## Customisation

### Design Tokens

All colors, fonts, spacing, and shadows live in `css/tokens.css`.
The light and dark themes are both defined there as CSS custom properties.

To change the primary accent color:
```css
:root        { --accent: #4F67FF; }
[data-theme="dark"] { --accent: #6878FF; }
```

### Pass Threshold

Currently hardcoded at 60% in `ResultsView.js`. To make it per-exam,
add a `passThreshold` field to `exams.json` and read it from `state.examMeta`.

---

## Contributing

Contributions are welcome! The most valuable contributions are:

- **New question banks** — CSV files for any university-level subject
- **Bug fixes** — especially edge cases in the CSV parser
- **New exam modes** — extend `ExamMode` and open a PR

### Contribution checklist for new CSVs

- [ ] All 11 required columns present
- [ ] `correct_answer` values are strictly `A`, `B`, `C`, or `D`
- [ ] `difficulty` values are strictly `easy`, `medium`, or `hard`
- [ ] `id` values are unique integers starting from 1
- [ ] No personally identifiable information
- [ ] Registered in `data/exams.json`

---

## Roadmap

- [ ] Support for 2–5 answer options (not just A–D)
- [ ] LaTeX/MathJax rendering for mathematical questions
- [ ] Per-attempt history stored in `localStorage`
- [ ] "Weak Areas" smart review (retry only questions answered incorrectly)
- [ ] Offline PWA support

---

## License

MIT — free to use, fork, and share.
If QUANTA helps your students, a ⭐ on GitHub is appreciated.

---

*Built for students who believe their study tools should feel as polished as the ideas they're learning.*
