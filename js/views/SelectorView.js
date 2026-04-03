import { BaseView }     from './BaseView.js';
import { ThemeManager } from '../modules/ThemeManager.js';
import { getState }     from '../state.js';
import { CSVParser }    from '../modules/CSVParser.js';
import { Question }     from '../models/Question.js';

const SECTION_COLORS = ['var(--c1)','var(--c2)','var(--c3)','var(--c4)','var(--c5)','var(--c6)'];

export class SelectorView extends BaseView {
  render() {
    this.setHTML(`
      <div class="selector-view view">
        <nav class="topnav" id="topnav">
        <a href="#">
          <div class="topnav-inner">
            <div class="nav-brand">QUAN<span>T</span>A</div>
            <div class="nav-spacer"></div>
            <div class="nav-actions">
              <button class="theme-toggle" id="theme-toggle" title="Toggle theme">
                ${ThemeManager.icon()}
              </button>
            </div>
          </div>
          </a>
        </nav>

        <main class="container">
          <header class="selector-hero stagger">
            <div class="selector-eyebrow">Open-Source Question Bank</div>
            <h1 class="selector-hero-title">Choose an exam<br>to begin.</h1>
            <p class="selector-hero-sub">
              Select a subject below. No sign-up, no tracking — just questions.
            </p>
          </header>

          <div class="selector-grid stagger" id="exam-grid">
            ${this._skeletonCards(3)}
          </div>
        </main>
      </div>
    `);

    this._bindNav();
    this._loadExams();
  }

  _bindNav() {
    // Theme toggle
    this.on(this.$('#theme-toggle'), 'click', () => {
      ThemeManager.toggle();
      this.$('#theme-toggle').textContent = ThemeManager.icon();
    });

    // Brand → stays on selector
    this.on(this.$('.nav-brand'), 'click', () => this.navigate('selector'));

    // Sticky nav shadow
    this.on(window, 'scroll', () => {
      this.$('#topnav')?.classList.toggle('scrolled', window.scrollY > 10);
    });
  }

  async _loadExams() {
    let exams = [];
    try {
      const res = await fetch('data/exams.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      exams = await res.json();
    } catch (err) {
      console.error('Could not load data/exams.json:', err);
      this.$('#exam-grid').innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">📂</div>
          <div class="empty-state-title">No exams found</div>
          <div class="empty-state-desc">
            Make sure <code>data/exams.json</code> exists and the app is served via HTTP.
          </div>
        </div>`;
      return;
    }

    if (!exams.length) {
      this.$('#exam-grid').innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">🗂️</div>
          <div class="empty-state-title">No exams available</div>
          <div class="empty-state-desc">Add CSV files and register them in data/exams.json to get started.</div>
        </div>`;
      return;
    }

    this.$('#exam-grid').innerHTML = exams.map(exam => this._cardHTML(exam)).join('');

    exams.forEach(exam => {
      const card = this.$(`[data-exam-id="${exam.id}"]`);
      if (card) this.on(card, 'click', () => this._selectExam(exam));
    });
  }

  async _selectExam(exam) {
    const state = getState();
    state.examMeta  = exam;
    state.questions = [];

    // Pre-fetch the CSV so the lobby feels instant
    try {
      const rows     = await CSVParser.fetchAndParse(exam.file);
      state.questions = rows.map(Question.fromCSVRow);
    } catch (err) {
      this.toast('⚠ Could not load questions — check the CSV path.');
      console.error(err);
      return;
    }

    this.navigate('lobby');
  }

  /* ── Templates ── */

  _cardHTML(exam) {
    const diffColor = { beginner: 'ok', intermediate: 'medium', advanced: 'hard' }[exam.difficulty] ?? 'outline';
    const tags = (exam.tags ?? []).slice(0, 4).map(t => `<span class="tag">${t}</span>`).join('');

    return `
      <div class="exam-card" data-exam-id="${exam.id}">
        <div class="exam-card-top">
          <span class="exam-card-id">${exam.id}</span>
          <span class="badge badge-${diffColor}">${exam.difficulty ?? 'intermediate'}</span>
        </div>
        <h2 class="exam-card-title">${exam.title}</h2>
        <p class="exam-card-desc">${exam.description}</p>
        <div class="exam-card-tags">${tags}</div>
        <div class="exam-card-footer">
          <span class="exam-card-stat">◈ ${exam.questionCount ?? '?'} questions</span>
          <span class="exam-card-stat">§ ${exam.sections ?? '?'} sections</span>
          <span class="exam-card-stat">◷ ~${exam.estimatedMinutes ?? 60}m</span>
          <span class="exam-card-arrow">→</span>
        </div>
      </div>`;
  }

  _skeletonCards(n) {
    return Array.from({ length: n }, () => `
      <div class="exam-card" style="pointer-events:none;gap:12px">
        <div class="skeleton" style="height:14px;width:60px"></div>
        <div class="skeleton" style="height:22px;width:80%"></div>
        <div class="skeleton" style="height:14px;width:100%"></div>
        <div class="skeleton" style="height:14px;width:75%"></div>
        <div class="skeleton" style="height:14px;width:55%"></div>
        <div class="skeleton" style="height:28px;border-radius:99px;margin-top:8px"></div>
      </div>`).join('');
  }
}
