# QUANTA — Adaptive Exam Engine ⚡

> *Every question. Every concept. Crystallized.*

A self-contained, beautiful, and fully interactive exam engine built from a single HTML file and a CSV of questions. Drop in any exam CSV and go — no frameworks, no build step, no server required (with one small caveat).

---

## ✨ Features

| Feature | Details |
|---|---|
| **Flexible Timer** | Choose 15 / 30 / 45 / 60 / 90 / 120 min, or run free (elapsed) |
| **Question Shuffle** | Randomize order for new every attempt |
| **Live Question Map** | Color-coded palette: answered / flagged / current |
| **Flag System** | Mark questions to revisit |
| **Keyboard Shortcuts** | `A–D` select · `→ ←` navigate · `F` flag |
| **Score Ring** | Animated circular score gauge |
| **Section Breakdown** | Per-section accuracy bars |
| **Review Mode** | Filter by correct / wrong / skipped, see explanations |
| **Export JSON** | Download full result report |
| **Difficulty Tags** | Easy / Medium / Hard labels per question |
| **Fully Generalizable** | Swap the CSV → swap the entire exam |

---

## 🚀 Quick Start

### Option A — Local Server (Recommended)

```bash
# Python 3 (built-in)
cd quanta/
python3 -m http.server 8000
# Open: http://localhost:8000
```

```bash
# Node.js (npx, no install needed)
cd quanta/
npx serve .
```

```bash
# VS Code
# Install "Live Server" extension → right-click index.html → Open with Live Server
```

### Option B — Self-Contained (Embed CSV)

If you want a **truly offline single-file** version, open `index.html`, find the `init()` function, and replace the `fetch` block with an embedded CSV string:

```js
async function init() {
  // Replace fetch with embedded string:
  const csvText = `id,section_id,...
1,1,...`; // paste your CSV here

  const rows = parseCSV(csvText);
  processQuestions(rows);
  buildWelcome();
  showScreen('s-welcome');
}
```

---

## 📁 Project Structure

```
quanta/
├── index.html        ← The entire exam engine (HTML + CSS + JS, ~600 lines)
├── questions.csv     ← Your exam questions (swap this for any exam!)
└── README.md         ← This file
```

---

## 📋 CSV Schema

The questions file follows a strict generalizable schema. Any exam can be loaded by replacing `questions.csv` with a new file matching this schema:

| Column | Type | Description | Example |
|---|---|---|---|
| `id` | integer | Unique question number | `1` |
| `section_id` | integer | Section group number (1–N) | `2` |
| `section_name` | string | Human-readable section label | `"EDA and Graphical Methods"` |
| `question` | string | Full question text | `"Which measure of central tendency..."` |
| `option_a` | string | Option A text (no prefix) | `"Mean"` |
| `option_b` | string | Option B text | `"Median"` |
| `option_c` | string | Option C text | `"Mode"` |
| `option_d` | string | Option D text | `"Standard Deviation"` |
| `correct_answer` | string | Correct letter: `A`, `B`, `C`, or `D` | `"C"` |
| `explanation` | string | Why the answer is correct | `"The Mode is used for categorical..."` |
| `difficulty` | string | `easy`, `medium`, or `hard` | `"medium"` |

### CSV Rules
- Wrap any field containing a comma in double quotes: `"This is, a field"`
- To include a literal double-quote inside a quoted field, double it: `"She said ""hello"""`
- UTF-8 encoding
- First row must be the exact header row (column names as shown above)

### Minimal Example

```csv
id,section_id,section_name,question,option_a,option_b,option_c,option_d,correct_answer,explanation,difficulty
1,1,"Biology Basics","What is the powerhouse of the cell?","Nucleus","Ribosome","Mitochondria","Golgi body","C","The mitochondria produces ATP through cellular respiration.","easy"
2,1,"Biology Basics","DNA stands for:","Dioxyribose Nucleic Acid","Deoxyribonucleic Acid","Dinitrogen Acetate","Deoxyribose Nitrogen Acid","B","DNA = Deoxyribonucleic Acid, the molecule carrying genetic information.","easy"
```

---

## ⚙️ Configuration

At the top of `index.html`, edit the `CONFIG` object to customize for your exam:

```js
const CONFIG = {
  examTitle:       "XAI & Responsible ML",          // Shown on welcome screen
  examSubtitle:    "Explainable AI, EDA, ...",       // Subtitle (currently unused, extend as needed)
  passThreshold:   0.60,                             // 0.60 = 60% needed to pass
  csvFile:         "questions.csv",                  // Filename of your CSV
  sectionColors:   ["#A78BFA","#34D399","#60A5FA",   // Colors per section (cycles if more sections)
                    "#FB923C","#F472B6","#FBBF24"],
  difficultyColors:{ easy:"#34D399", medium:"#60A5FA", hard:"#F87171" },
};
```

---

## 🎨 Design System

QUANTA uses a **Dark Academic + Terminal** aesthetic:

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#070B12` | Page background |
| `--card` | `#111827` | Card surfaces |
| `--accent` | `#F5C842` | Gold — primary accent, CTAs |
| `--ok` | `#34D399` | Correct / pass states |
| `--err` | `#F87171` | Wrong / fail states |
| Font Display | Fraunces | Headings, branding |
| Font Body | Outfit | Questions, UI text |
| Font Mono | JetBrains Mono | Timer, codes, question numbers |

To retheme, change the CSS variables in `:root {}` at the top of `<style>`.

---

## ♻️ Creating a New Exam (Step-by-Step)

1. **Prepare your questions** in a spreadsheet (Excel, Google Sheets)
2. **Use the column headers** exactly as shown in the schema table above
3. **Export as CSV** (UTF-8 encoding)
4. **Name it** `questions.csv` (or update `CONFIG.csvFile`)
5. **Place it** in the same folder as `index.html`
6. **Update** `CONFIG.examTitle` and `CONFIG.passThreshold`
7. **Run** via a local server and enjoy

---

## 🧪 Included Exam

The bundled `questions.csv` covers a **100-question XAI & Machine Learning** exam:

| Section | Questions |
|---|---|
| § 1 Responsible AI and XAI Taxonomy | 17 |
| § 2 EDA and Graphical Methods | 17 |
| § 3 Multivariate Correlation | 16 |
| § 4 Hypothesis Testing and Feature Selection | 17 |
| § 5 Interpretable Models (Linear & Logistic Regression) | 16 |
| § 6 Tree-based Models and RuleFit | 17 |
| **Total** | **100** |

Difficulty distribution: ~30 Easy · ~50 Medium · ~20 Hard

---

## 🙌 Contributing

Pull requests welcome! Ideas for future enhancements:

- [ ] Support for 2–5 answer options (not just A–D)
- [ ] Image/LaTeX support in questions
- [ ] Multi-exam mode (select from a list of CSVs)
- [ ] Per-attempt history (localStorage)
- [ ] Dark/Light theme toggle

---

## 📄 License

MIT — free to use, fork, and share. Attribution appreciated.

---

*Built with ♥ for students who want their study sessions to feel a little more like a product.*
