import { BaseView }          from './BaseView.js';
import { ThemeManager }      from '../modules/ThemeManager.js';
import { getState }          from '../state.js';
import { MODES, DEFAULT_MODE_ID } from '../modules/ExamModes.js';
import { Session }           from '../models/Session.js';

const TIMER_OPTIONS = [
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '45m', minutes: 45 },
  { label: '60m', minutes: 60 },
  { label: '90m', minutes: 90 },
  { label: '∞',   minutes: 0  },
];

export class LobbyView extends BaseView {
  constructor(container, router, params) {
    super(container, router, params);
    this._state    = getState();
    this._modeId   = DEFAULT_MODE_ID;
    this._timerMin = 60;
    this._shuffle  = false;
    this._showDiff = true;
  }

  render() {
    const exam = this._state.examMeta;
    if (!exam) { this.navigate('selector'); return; }

    const sections = this._buildSections();

    this.setHTML(`
      <div class="lobby-view view">
        <nav class="topnav scrolled">
          <a href="#">
          <div class="topnav-inner">
            <div class="nav-brand">QUAN<span>T</span>A</div>
            <div class="nav-spacer"></div>
            <button class="theme-toggle" id="theme-toggle">${ThemeManager.icon()}</button>
          </div>
          </a>
        </nav>

        <div class="container-md lobby-wrap">
          <button class="lobby-back" id="back-btn">← All Exams</button>

          <header class="lobby-header">
            <h1 class="lobby-title">${exam.title}</h1>
            <div class="lobby-meta">
              <span class="badge badge-outline">◈ ${this._state.questions.length} questions</span>
              <span class="badge badge-outline">§ ${exam.sections ?? sections.length} sections</span>
              ${exam.author ? `<span class="badge badge-outline">✦ ${exam.author}</span>` : ''}
            </div>
          </header>

          <!-- Mode Selection -->
          <div style="margin-bottom:var(--sp-8)">
            <div class="lobby-section-title">Select mode</div>
            <div class="mode-grid">
              ${Object.values(MODES).map(m => this._modeCardHTML(m)).join('')}
            </div>
          </div>

          <!-- Config -->
          <div class="config-section" id="config-section">
            <!-- Timer (shown for assessment mode only) -->
            <div id="timer-block">
              <div class="lobby-section-title">Time limit</div>
              <div class="timer-chips">
                ${TIMER_OPTIONS.map(o => `
                  <button class="timer-chip ${o.minutes === 60 ? 'active' : ''}"
                          data-minutes="${o.minutes}">${o.label}</button>`).join('')}
              </div>
              <div class="divider"></div>
            </div>

            <!-- Shuffle -->
            <div class="toggle-wrap">
              <span class="toggle-label">Shuffle questions</span>
              <button class="toggle" id="toggle-shuffle" aria-label="Toggle shuffle"></button>
            </div>

            <!-- Difficulty tags -->
            <div class="toggle-wrap">
              <span class="toggle-label">Show difficulty tags</span>
              <button class="toggle active" id="toggle-difficulty" aria-label="Toggle difficulty"></button>
            </div>
          </div>

          <!-- Section preview -->
          <div style="margin-top:var(--sp-6);margin-bottom:var(--sp-10)">
            <div class="lobby-section-title" style="margin-bottom:var(--sp-3)">Covered sections</div>
            <div style="display:flex;flex-direction:column;gap:var(--sp-2)">
              ${sections.map((s, i) => `
                <div style="display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-2) var(--sp-3);background:var(--surface);border:1px solid var(--border);border-radius:var(--r-sm)">
                  <div class="sec-dot" style="background:var(--c${(i % 6) + 1})"></div>
                  <span style="flex:1;font-size:var(--text-sm);color:var(--text-1)">${s.name}</span>
                  <span style="font-family:var(--ff-mono);font-size:var(--text-xs);color:var(--text-3)">${s.count}q</span>
                </div>`).join('')}
            </div>
          </div>

          <button class="btn btn-primary btn-xl btn-full" id="start-btn">
            Begin Exam →
          </button>

          <div class="kbd-row" style="justify-content:center;margin-top:var(--sp-5)">
            <div class="kbd-item"><kbd class="kbd">A</kbd>–<kbd class="kbd">D</kbd> select answer</div>
            <div class="kbd-item"><kbd class="kbd">→</kbd><kbd class="kbd">←</kbd> navigate</div>
            <div class="kbd-item"><kbd class="kbd">F</kbd> flag question</div>
          </div>
        </div>
      </div>
    `);

    this._bindAll();
    this._updateTimerVisibility();
  }

  _bindAll() {
    // Theme
    this.on(this.$('#theme-toggle'), 'click', () => {
      ThemeManager.toggle();
      this.$('#theme-toggle').textContent = ThemeManager.icon();
    });

    // Back
    this.on(this.$('#back-btn'), 'click', () => this.navigate('selector'));
    this.on(this.$('.nav-brand'), 'click', () => this.navigate('selector'));

    // Mode cards
    this.$$('.mode-card').forEach(card => {
      this.on(card, 'click', () => {
        this._modeId = card.dataset.modeId;
        this.$$('.mode-card').forEach(c => c.classList.toggle('selected', c === card));
        this._updateTimerVisibility();
      });
    });

    // Timer chips
    this.$$('.timer-chip').forEach(chip => {
      this.on(chip, 'click', () => {
        this.$$('.timer-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this._timerMin = parseInt(chip.dataset.minutes);
      });
    });

    // Toggles
    this._bindToggle('#toggle-shuffle',    v => { this._shuffle  = v; });
    this._bindToggle('#toggle-difficulty', v => { this._showDiff = v; });

    // Start
    this.on(this.$('#start-btn'), 'click', () => this._startExam());
  }

  _bindToggle(selector, onChange) {
    const el = this.$(selector);
    if (!el) return;
    this.on(el, 'click', () => {
      el.classList.toggle('active');
      onChange(el.classList.contains('active'));
    });
  }

  _updateTimerVisibility() {
    const mode      = MODES[this._modeId];
    const timerBlock = this.$('#timer-block');
    if (timerBlock) {
      timerBlock.style.display = mode.useTimer() ? 'block' : 'none';
    }
  }

  _startExam() {
    const state = this._state;
    let questions = [...state.questions];
    if (this._shuffle) questions.sort(() => Math.random() - 0.5);

    // Persist config
    state.config = {
      timerMinutes:   this._timerMin,
      shuffle:        this._shuffle,
      showDifficulty: this._showDiff,
    };
    state.mode    = MODES[this._modeId];
    state.session = new Session(questions);
    state.results = null;

    this.navigate('exam');
  }

  _buildSections() {
    const map = new Map();
    this._state.questions.forEach(q => {
      if (!map.has(q.sectionId)) map.set(q.sectionId, { name: q.sectionName, count: 0 });
      map.get(q.sectionId).count++;
    });
    return Array.from(map.values());
  }

  _modeCardHTML(mode) {
    const isDefault = mode.id === DEFAULT_MODE_ID;
    return `
      <div class="mode-card ${isDefault ? 'selected' : ''}" data-mode-id="${mode.id}">
        <span class="mode-card-icon">${mode.icon}</span>
        <div class="mode-card-name">${mode.label}</div>
        <div class="mode-card-desc">${mode.description}</div>
        <div class="mode-card-check">✓</div>
      </div>`;
  }
}
