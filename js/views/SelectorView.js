import { BaseView }     from './BaseView.js';
import { ThemeManager } from '../modules/ThemeManager.js';
import { getState }     from '../state.js';
import { CSVParser }    from '../modules/CSVParser.js';
import { Question }     from '../models/Question.js';

/* Maps exam type → display label */
const TYPE_LABELS = {
  midterm:  'Midterm',
  final:    'Final',
  quiz:     'Quiz',
  practice: 'Practice',
};

/* Maps subject key → display name */
const SUBJECT_LABELS = {
  xai:              'XAI & Responsible ML',
  nlp:              'Natural Language Processing',
  cv:               'Computer Vision',
  secure_computing: 'Secure Computing',
};

export class SelectorView extends BaseView {
  render() {
    this.setHTML(`
      <div class="selector-view view">
        <nav class="topnav" id="topnav">
          <div class="topnav-inner">
          <a href="#">
            <div class="nav-brand">QUAN<span>T</span>A</div>
          </a>
            <div class="nav-spacer"></div>
            <div class="nav-actions">
              <button class="theme-toggle" id="theme-toggle" title="Toggle theme">
                ${ThemeManager.icon()}
              </button>
            </div>
          </div>
        </nav>

        <main class="container">
          <header class="selector-hero stagger">
            <div class="selector-eyebrow">Open-Source Question Bank</div>
            <h1 class="selector-hero-title">Choose an exam<br>to begin.</h1>
            <p class="selector-hero-sub">
              Select a subject below. No sign-up, no tracking — just questions.
            </p>
          </header>

          <div id="exam-catalog">
            ${this._skeletonCards(4)}
          </div>
        </main>
      </div>
    `);

    this._bindNav();
    this._loadExams();
  }

  _bindNav() {
    this.on(this.$('#theme-toggle'), 'click', () => {
      ThemeManager.toggle();
      this.$('#theme-toggle').textContent = ThemeManager.icon();
    });

    this.on(this.$('.nav-brand'), 'click', () => this.navigate('selector'));

    this.on(window, 'scroll', () => {
      this.$('#topnav')?.classList.toggle('scrolled', window.scrollY > 10);
    });
  }

  async _loadExams() {
    let exams = [];

    try {
      // Cache-bust with timestamp so GitHub Pages doesn't serve stale JSON
      const res = await fetch(`data/exams.json?v=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status} — could not fetch data/exams.json`);
      exams = await res.json();
    } catch (err) {
      console.error('[QUANTA] exams.json load failed:', err);
      this.$('#exam-catalog').innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">📂</div>
          <div class="empty-state-title">Could not load exams</div>
          <div class="empty-state-desc">
            ${err.message}<br>
            Make sure <code>data/exams.json</code> is committed and the app is served via HTTP.
          </div>
        </div>`;
      return;
    }

    if (!exams.length) {
      this.$('#exam-catalog').innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🗂️</div>
          <div class="empty-state-title">No exams yet</div>
          <div class="empty-state-desc">Add CSV files and register them in data/exams.json.</div>
        </div>`;
      return;
    }

    // Group by subject for a cleaner layout when multiple exams exist
    const groups = this._groupBySubject(exams);
    const catalog = this.$('#exam-catalog');
    catalog.innerHTML = '';

    groups.forEach(({ subject, label, items }) => {
      // Section heading (only shown when multiple subjects)
      if (groups.length > 1) {
        const heading = document.createElement('div');
        heading.style.cssText = `
          font-family: var(--ff-mono);
          font-size: var(--text-xs);
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: var(--text-3);
          padding: var(--sp-8) 0 var(--sp-4);
          border-top: 1px solid var(--border);
          margin-top: var(--sp-4);
        `;
        heading.textContent = label;
        catalog.appendChild(heading);
      }

      const grid = document.createElement('div');
      grid.className = 'selector-grid stagger';
      grid.innerHTML = items.map(exam => this._cardHTML(exam)).join('');
      catalog.appendChild(grid);

      // Bind click only on active (non-coming-soon) cards
      items.forEach(exam => {
        if (exam.comingSoon || exam.questionCount === 0) return;
        const card = catalog.querySelector(`[data-exam-id="${CSS.escape(exam.id)}"]`);
        if (card) this.on(card, 'click', () => this._selectExam(exam));
      });
    });

    // Add bottom padding
    catalog.style.paddingBottom = 'var(--sp-16)';
  }

  async _selectExam(exam) {
    const state = getState();
    state.examMeta  = exam;
    state.questions = [];

    // Show loading state on the clicked card
    const card = this.$(`[data-exam-id="${CSS.escape(exam.id)}"]`);
    if (card) {
      card.style.opacity = '0.6';
      card.style.pointerEvents = 'none';
      card.querySelector('.exam-card-arrow').textContent = '…';
    }

    try {
      // Cache-bust here too so updated CSVs appear immediately
      const rows = await CSVParser.fetchAndParse(`${exam.file}?v=${Date.now()}`);
      if (!rows.length) throw new Error('CSV is empty or could not be parsed.');
      state.questions = rows.map(Question.fromCSVRow);
    } catch (err) {
      console.error('[QUANTA] CSV load failed:', err);
      this.toast(`⚠ Could not load "${exam.title}" — ${err.message}`);
      // Restore card
      if (card) {
        card.style.opacity = '';
        card.style.pointerEvents = '';
        card.querySelector('.exam-card-arrow').textContent = '→';
      }
      return;
    }

    this.navigate('lobby');
  }

  /* ── Grouping ── */

  _groupBySubject(exams) {
    const map = new Map();
    exams.forEach(exam => {
      const key   = exam.subject ?? 'other';
      const label = SUBJECT_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      if (!map.has(key)) map.set(key, { subject: key, label, items: [] });
      map.get(key).items.push(exam);
    });
    return Array.from(map.values());
  }

  /* ── Templates ── */

  _cardHTML(exam) {
    const diffColor  = { beginner: 'ok', intermediate: 'medium', advanced: 'hard' }[exam.difficulty] ?? 'outline';
    const typeLabel  = TYPE_LABELS[exam.type] ?? (exam.type ?? '');
    const isReady    = !exam.comingSoon && (exam.questionCount ?? 0) > 0;
    const tags       = (exam.tags ?? []).slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('');

    // Semester + year badge, e.g. "Spring 2026"
    const semBadge = (exam.semester && exam.year)
      ? `<span class="badge badge-outline" style="text-transform:capitalize">${exam.semester} ${exam.year}</span>`
      : '';

    // Type badge (Midterm / Final / etc.)
    const typeBadge = typeLabel
      ? `<span class="badge badge-accent">${typeLabel}</span>`
      : '';

    return `
      <div class="exam-card ${isReady ? '' : 'exam-card-disabled'}"
           data-exam-id="${exam.id}"
           style="${isReady ? '' : 'opacity:0.5;cursor:not-allowed;'}">

        <div class="exam-card-top">
          <div style="display:flex;gap:var(--sp-2);flex-wrap:wrap">
            ${typeBadge}
            ${semBadge}
          </div>
          <span class="badge badge-${diffColor}">${exam.difficulty ?? 'intermediate'}</span>
        </div>

        <h2 class="exam-card-title">${exam.title}</h2>
        <p class="exam-card-desc">${exam.description}</p>
        <div class="exam-card-tags">${tags}</div>

        <div class="exam-card-footer">
          ${isReady
            ? `<span class="exam-card-stat">◈ ${exam.questionCount} questions</span>
               <span class="exam-card-stat">§ ${exam.sections ?? '?'} sections</span>
               <span class="exam-card-stat">◷ ~${exam.estimatedMinutes ?? 60}m</span>
               <span class="exam-card-arrow">→</span>`
            : `<span style="font-size:var(--text-xs);color:var(--text-3);font-family:var(--ff-mono)">
                 Coming soon
               </span>`
          }
        </div>
      </div>`;
  }

  _skeletonCards(n) {
    return `<div class="selector-grid">${
      Array.from({ length: n }, () => `
        <div class="exam-card" style="pointer-events:none;gap:12px">
          <div class="skeleton" style="height:20px;width:120px;border-radius:99px"></div>
          <div class="skeleton" style="height:22px;width:80%"></div>
          <div class="skeleton" style="height:14px;width:100%"></div>
          <div class="skeleton" style="height:14px;width:70%"></div>
          <div class="skeleton" style="height:28px;border-radius:99px;margin-top:8px"></div>
        </div>`).join('')
    }</div>`;
  }
}