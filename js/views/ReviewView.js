import { BaseView }     from './BaseView.js';
import { ThemeManager } from '../modules/ThemeManager.js';
import { getState }     from '../state.js';

export class ReviewView extends BaseView {
  constructor(container, router, params) {
    super(container, router, params);
    this._filter = params?.filter ?? 'all';
  }

  render() {
    const state = getState();
    if (!state.session || !state.results) { this.navigate('results'); return; }

    this.setHTML(`
      <div class="review-view view">
        <nav class="topnav scrolled">
          <a href="#">
          <div class="topnav-inner">
            <div class="nav-brand">QUAN<span>T</span>A</div>
            <div class="nav-spacer"></div>
            <button class="theme-toggle" id="theme-toggle">${ThemeManager.icon()}</button>
          </div>
          </a>
        </nav>

        <div class="container-md review-wrap">
          <div class="review-header">
            <h1 class="review-title">Answer Review</h1>
            <button class="btn btn-secondary btn-sm" id="back-btn">← Results</button>
          </div>

          <div class="filter-row" id="filter-row">
            <button class="filter-btn ${this._filter === 'all'       ? 'active' : ''}" data-filter="all">All</button>
            <button class="filter-btn ${this._filter === 'correct'   ? 'active' : ''}" data-filter="correct">✓ Correct</button>
            <button class="filter-btn ${this._filter === 'incorrect' ? 'active' : ''}" data-filter="incorrect">✗ Incorrect</button>
            <button class="filter-btn ${this._filter === 'skipped'   ? 'active' : ''}" data-filter="skipped">— Skipped</button>
            <button class="filter-btn ${this._filter === 'flagged'   ? 'active' : ''}" data-filter="flagged">⚑ Flagged</button>
          </div>

          <div class="review-list" id="review-list">
            <!-- Rendered by _renderList() -->
          </div>
        </div>
      </div>
    `);

    this._renderList();
    this._bindAll(state);
  }

  _renderList() {
    const { session } = getState();
    const list = this.$('#review-list');
    if (!list) return;

    const items = session.questions
      .map(q => {
        const userKey  = session.getAnswer(q.id);
        const correct  = q.isCorrect(userKey);
        const skipped  = !userKey;
        const flagged  = session.isFlagged(q.id);

        const status = skipped ? 'skipped' : correct ? 'correct' : 'incorrect';

        // Apply filter
        if (this._filter === 'correct'   && status !== 'correct')   return '';
        if (this._filter === 'incorrect' && status !== 'incorrect') return '';
        if (this._filter === 'skipped'   && status !== 'skipped')   return '';
        if (this._filter === 'flagged'   && !flagged)               return '';

        return this._itemHTML(q, userKey, status);
      })
      .join('');

    list.innerHTML = items || `
      <div class="empty-state">
        <div class="empty-state-icon">🎯</div>
        <div class="empty-state-title">No questions match this filter</div>
        <div class="empty-state-desc">Try selecting a different filter above.</div>
      </div>`;
  }

  _itemHTML(q, userKey, status) {
    const badge = {
      correct:   '<span class="badge badge-ok">✓ Correct</span>',
      incorrect: '<span class="badge badge-err">✗ Incorrect</span>',
      skipped:   '<span class="badge badge-outline">— Skipped</span>',
    }[status];

    const optionsHTML = Object.entries(q.options).map(([key, text]) => {
      const isCorrect  = key === q.correct;
      const isSelected = key === userKey && !isCorrect;
      let cls = 'review-opt';
      if (isCorrect)  cls += ' was-correct';
      if (isSelected) cls += ' was-selected';

      const mark = isCorrect ? ' ✓' : isSelected ? ' ✗' : '';
      return `
        <div class="${cls}">
          <span class="review-opt-key">${key}.</span>
          <span>${text}${mark}</span>
        </div>`;
    }).join('');

    return `
      <div class="review-item ${status}">
        <div class="review-item-top">
          ${badge}
          <span class="review-qnum">Q${q.id}</span>
          <span class="review-question-text">${q.text}</span>
        </div>
        <div class="review-options">${optionsHTML}</div>
        <div class="review-explanation">
          <strong>Explanation:</strong> ${q.explanation}
        </div>
      </div>`;
  }

  _bindAll(state) {
    this.on(this.$('#theme-toggle'), 'click', () => {
      ThemeManager.toggle();
      this.$('#theme-toggle').textContent = ThemeManager.icon();
    });

    this.on(this.$('.nav-brand'), 'click', () => this.navigate('selector'));
    this.on(this.$('#back-btn'),  'click', () => this.navigate('results'));

    this.$$('.filter-btn').forEach(btn => {
      this.on(btn, 'click', () => {
        this._filter = btn.dataset.filter;
        this.$$('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));
        this._renderList();
        this.scrollTop();
      });
    });
  }
}
