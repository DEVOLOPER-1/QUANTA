import { BaseView } from './BaseView.js';
import { getState } from '../state.js';
import { Timer    } from '../modules/Timer.js';

const SEC_COLORS = ['var(--c1)','var(--c2)','var(--c3)','var(--c4)','var(--c5)','var(--c6)'];

export class ExamView extends BaseView {
  constructor(container, router, params) {
    super(container, router, params);
    this._state   = getState();
    this._timer   = null;
    this._revealed = new Set(); // question IDs that have shown practice feedback
    this._mapOpen  = false;
  }

  render() {
    const { session, mode, config } = this._state;
    if (!session || !mode) { this.navigate('lobby'); return; }

    const isPractice = mode.showImmediateFeedback();

    this.setHTML(`
      <div class="exam-view view">
        <!-- Thin progress strip at very top -->
        <div class="exam-progress-strip">
          <div class="progress-fill" id="progress-fill" style="width:0%"></div>
        </div>

        <!-- Topbar -->
        <header class="exam-topbar">
          <a href="#">
          <div class="exam-topbar-brand">QUAN<span>T</span>A</div>
          </a>

          <div class="topbar-section-wrap">
            <div class="exam-topbar-section" id="topbar-section">—</div>
          </div>
          <div class="exam-topbar-spacer"></div>
          <div class="exam-timer ${isPractice ? 'hidden' : ''}" id="exam-timer">00:00</div>
          <button class="exam-map-btn" id="map-btn">Map ☰</button>
          <button class="btn btn-ghost btn-sm" id="exit-btn" title="Exit exam">✕ Exit</button>
        </header>

        <!-- Question area -->
        <main class="question-area" id="question-area">
          <!-- Rendered by _renderQuestion() -->
        </main>

        <!-- Footer navigation -->
        <div class="exam-footer-outer">
          <div class="exam-footer-inner" id="exam-footer">
            <button class="btn btn-secondary btn-sm" id="btn-prev">← Prev</button>
            <div class="exam-footer-spacer"></div>
            <button class="flag-btn" id="flag-btn">⚑ Flag</button>
            <div class="exam-footer-spacer"></div>
            <button class="btn btn-primary btn-sm" id="btn-next">Next →</button>
          </div>
        </div>

        <!-- Question Map Overlay -->
        <div class="qmap-overlay is-hidden" id="qmap-overlay">
          <div class="qmap-panel">
            <div class="qmap-header">
              <div class="qmap-title">Question Map</div>
              <button class="btn-icon" id="qmap-close">✕</button>
            </div>
            <div class="qmap-legend">
              <div class="qmap-legend-item">
                <div class="qmap-dot" style="background:var(--surface-3);border:1px solid var(--border)"></div> Unanswered
              </div>
              <div class="qmap-legend-item">
                <div class="qmap-dot" style="background:var(--accent-dim);border:1px solid var(--accent)"></div> Answered
              </div>
              <div class="qmap-legend-item">
                <div class="qmap-dot" style="background:var(--warn-dim);border:1px solid rgba(217,119,6,.3)"></div> Flagged
              </div>
            </div>
            <div class="qmap-grid" id="qmap-grid"></div>
            ${!isPractice ? `
            <button class="btn btn-primary btn-full" id="submit-btn">Submit Exam →</button>` : ''}
          </div>
        </div>

        <!-- Submit confirmation modal -->
        <div class="overlay is-hidden" id="submit-overlay">
          <div class="modal" id="submit-modal">
            <div class="modal-title">Submit Exam?</div>
            <div class="modal-body" id="modal-body">Check your progress before submitting.</div>
            <div class="modal-stats" id="modal-stats"></div>
            <div class="modal-actions">
              <button class="btn btn-secondary" id="modal-cancel">Keep going</button>
              <button class="btn btn-primary"   id="modal-confirm">Submit →</button>
            </div>
          </div>
        </div>
      </div>
    `);

    this._startTimer(config, mode);
    this._renderQuestion();
    this._bindNav();
    this._bindKeyboard();
    this.scrollTop();
  }

  /* ── Timer ── */

  _startTimer(config, mode) {
    if (!mode.useTimer()) return;

    this._timer = new Timer({
      totalSeconds: config.timerMinutes > 0 ? config.timerMinutes * 60 : 0,
      onTick:    (secs) => this._onTimerTick(secs),
      onExpire:  ()     => this._finishExam(),
    });
    this._timer.start();
    this._onTimerTick(this._timer.displaySeconds);
  }

  _onTimerTick(secs) {
    const el = this.$('#exam-timer');
    if (!el) return;
    el.textContent = Timer.format(secs);
    el.classList.toggle('warning', this._timer?.isWarning ?? false);
  }

  /* ── Question Rendering ── */

  _renderQuestion() {
    const { session, config, mode } = this._state;
    const q       = session.currentQuestion;
    const answer  = session.getAnswer(q.id);
    const flagged = session.isFlagged(q.id);
    const secIdx  = (q.sectionId - 1) % 6;
    const secColor = SEC_COLORS[secIdx];
    const isPractice = mode.showImmediateFeedback();
    const revealed   = this._revealed.has(q.id);

    // Topbar section badge
    const sectionBadge = this.$('#topbar-section');
    if (sectionBadge) {
      sectionBadge.innerHTML =
        `<span style="color:${secColor}">§${q.sectionId}</span>&nbsp;${q.sectionName}`;
    }

    // Flag button state
    const flagBtn = this.$('#flag-btn');
    if (flagBtn) flagBtn.classList.toggle('flagged', flagged);

    // Progress
    const pct = Math.round(session.progress * 100);
    const pf = this.$('#progress-fill');
    if (pf) pf.style.width = pct + '%';

    // Prev/Next buttons
    const prevBtn = this.$('#btn-prev');
    const nextBtn = this.$('#btn-next');
    if (prevBtn) prevBtn.disabled = session.isFirst;
    if (nextBtn) nextBtn.textContent = session.isLast ? 'Finish ✓' : 'Next →';

    // Difficulty badge
    const diffBadge = config.showDifficulty
      ? `<span class="badge badge-${q.difficulty}">${q.difficulty}</span>`
      : '';

    // Build options HTML
    const optionsHTML = Object.entries(q.options).map(([key, text]) => {
      let classes = 'option-btn';
      if (isPractice && revealed) {
        if (key === q.correct)               classes += ' is-correct';
        else if (key === answer && !q.isCorrect(answer)) classes += ' is-wrong';
        else                                 classes += ' is-neutral';
      } else {
        if (key === answer) classes += ' is-selected';
      }
      return `
        <button class="${classes}" data-key="${key}"
                ${isPractice && revealed ? 'disabled' : ''}>
          <div class="option-key">${key}</div>
          <div class="option-text">${text}</div>
        </button>`;
    }).join('');

    // Practice feedback panel
    const feedbackHTML = isPractice && revealed ? `
      <div class="feedback-panel visible ${answer && q.isCorrect(answer) ? 'correct-panel' : 'incorrect-panel'}">
        <div class="feedback-verdict ${answer && q.isCorrect(answer) ? 'correct' : 'incorrect'}">
          ${answer && q.isCorrect(answer) ? '✓ Correct!' : '✗ Incorrect'}
        </div>
        <div class="feedback-explanation">${q.explanation}</div>
      </div>` : '';

    // Practice "continue" button replaces "next" when feedback shown
    const practiceNextHTML = isPractice && revealed && !session.isLast ? `
      <div style="text-align:right;margin-top:var(--sp-2)">
        <button class="btn btn-primary" id="practice-continue">Continue →</button>
      </div>` : '';

    this.$('#question-area').innerHTML = `
      <div class="question-meta">
        <span class="question-num">Q${session.currentIndex + 1} / ${session.totalQuestions}</span>
        ${diffBadge}
      </div>
      <p class="question-text">${q.text}</p>
      <div class="options-list" id="options-list">
        ${optionsHTML}
      </div>
      ${feedbackHTML}
      ${practiceNextHTML}
      <div class="kbd-row" style="margin-top:var(--sp-6)">
        <div class="kbd-item"><kbd class="kbd">A</kbd>–<kbd class="kbd">D</kbd> select</div>
        <div class="kbd-item"><kbd class="kbd">→</kbd><kbd class="kbd">←</kbd> navigate</div>
        <div class="kbd-item"><kbd class="kbd">F</kbd> flag</div>
      </div>
    `;

    // Bind option clicks
    this.$$('.option-btn:not([disabled])').forEach(btn => {
      this.on(btn, 'click', () => this._selectAnswer(btn.dataset.key));
    });

    // Bind practice continue
    const contBtn = this.$('#practice-continue');
    if (contBtn) this.on(contBtn, 'click', () => this._navigate(1));

    // Update question map grid
    this._renderQMapGrid();
  }

  /* ── Answer Selection ── */

  _selectAnswer(key) {
    const { session, mode } = this._state;
    const q = session.currentQuestion;

    // In exam mode, allow changing answer
    // In practice mode, lock after first selection
    if (!mode.allowAnswerChange() && session.getAnswer(q.id)) return;

    session.answer(q.id, key);

    if (mode.showImmediateFeedback()) {
      this._revealed.add(q.id);
    }

    this._renderQuestion();
  }

  /* ── Navigation ── */

  _navigate(direction) {
    this._state.session.navigate(direction);
    this._renderQuestion();
    window.scrollTo(0, 0);
  }

  _bindNav() {
    this.on(this.$('#btn-prev'), 'click', () => this._navigate(-1));
    this.on(this.$('#btn-next'), 'click', () => {
      if (this._state.session.isLast) {
        this._state.mode.showImmediateFeedback()
          ? this._finishExam()
          : this._openSubmitModal();
      } else {
        this._navigate(1);
      }
    });

    this.on(this.$('#flag-btn'), 'click', () => {
      this._state.session.toggleFlag(this._state.session.currentQuestion.id);
      this._renderQuestion();
    });

    // Map
    this.on(this.$('#map-btn'),    'click', () => this._openMap());
    this.on(this.$('#qmap-close'), 'click', () => this._closeMap());
    this.on(this.$('#qmap-overlay'), 'click', (e) => {
      if (e.target === this.$('#qmap-overlay')) this._closeMap();
    });

    // Submit (in map panel)
    const submitBtn = this.$('#submit-btn');
    if (submitBtn) this.on(submitBtn, 'click', () => { this._closeMap(); this._openSubmitModal(); });

    // Modal
    this.on(this.$('#modal-cancel'),   'click', () => this._closeSubmitModal());
    this.on(this.$('#modal-confirm'),  'click', () => this._finishExam());
    this.on(this.$('#submit-overlay'), 'click', (e) => {
      if (e.target === this.$('#submit-overlay')) this._closeSubmitModal();
    });

    // Exit
    this.on(this.$('#exit-btn'), 'click', () => {
      if (confirm('Exit this exam? Your progress will be lost.')) {
        this._timer?.stop();
        this.navigate('selector');
      }
    });
  }

  /* ── Question Map ── */

  _renderQMapGrid() {
    const grid = this.$('#qmap-grid');
    if (!grid) return;
    const { session } = this._state;

    grid.innerHTML = session.questions.map((q, i) => {
      const answered = !!session.getAnswer(q.id);
      const flagged  = session.isFlagged(q.id);
      const current  = i === session.currentIndex;
      let cls = 'qmap-btn';
      if (current)       cls += ' current';
      else if (flagged)  cls += ' flagged';
      else if (answered) cls += ' answered';

      return `<button class="${cls}" data-idx="${i}" title="Q${q.id}">${q.id}</button>`;
    }).join('');

    grid.querySelectorAll('.qmap-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._state.session.goTo(parseInt(btn.dataset.idx));
        this._renderQuestion();
        this._closeMap();
        window.scrollTo(0, 0);
      });
    });
  }

  _openMap() {
    const overlay = this.$('#qmap-overlay');
    if (overlay) { overlay.classList.remove('is-hidden'); this._renderQMapGrid(); }
  }

  _closeMap() {
    const overlay = this.$('#qmap-overlay');
    if (overlay) overlay.classList.add('is-hidden');
  }

  /* ── Submit Modal ── */

  _openSubmitModal() {
    const { session } = this._state;
    const total    = session.totalQuestions;
    const answered = session.answeredCount;
    const skipped  = total - answered;
    const flagged  = session.flagged.size;

    this.$('#modal-body').textContent = skipped > 0
      ? `You have ${skipped} unanswered question${skipped !== 1 ? 's' : ''}. They will be marked incorrect.`
      : 'All questions answered — ready to see your results?';

    this.$('#modal-stats').innerHTML = `
      <div class="modal-stat">
        <span class="modal-stat-val" style="color:var(--ok)">${answered}</span>
        <span class="modal-stat-label">Answered</span>
      </div>
      <div class="modal-stat">
        <span class="modal-stat-val" style="color:var(--text-3)">${skipped}</span>
        <span class="modal-stat-label">Skipped</span>
      </div>
      <div class="modal-stat">
        <span class="modal-stat-val" style="color:var(--warn)">${flagged}</span>
        <span class="modal-stat-label">Flagged</span>
      </div>
      <div class="modal-stat">
        <span class="modal-stat-val">${total}</span>
        <span class="modal-stat-label">Total</span>
      </div>`;

    this.$('#submit-overlay').classList.remove('is-hidden');
  }

  _closeSubmitModal() {
    this.$('#submit-overlay').classList.add('is-hidden');
  }

  /* ── Finish ── */

  _finishExam() {
    this._timer?.stop();
    const { session } = this._state;
    session.finish();
    this._state.results = session.computeResults();
    this.navigate('results');
  }

  /* ── Keyboard ── */

  _bindKeyboard() {
    const handler = (e) => {
      // Don't capture if a modal is open
      if (!this.$('#submit-overlay')?.classList.contains('is-hidden')) return;
      if (!this.$('#qmap-overlay')?.classList.contains('is-hidden'))   return;

      const { session, mode } = this._state;
      const q = session.currentQuestion;
      const revealed = this._revealed.has(q.id);

      switch (e.key.toUpperCase()) {
        case 'A': case 'B': case 'C': case 'D':
          if (!revealed || mode.allowAnswerChange()) {
            e.preventDefault();
            this._selectAnswer(e.key.toUpperCase());
          }
          break;
        case 'ARROWRIGHT':
          e.preventDefault();
          if (session.isLast) {
            mode.showImmediateFeedback() ? this._finishExam() : this._openSubmitModal();
          } else {
            this._navigate(1);
          }
          break;
        case 'ARROWLEFT':
          e.preventDefault();
          this._navigate(-1);
          break;
        case 'F':
          e.preventDefault();
          session.toggleFlag(q.id);
          this._renderQuestion();
          break;
      }
    };
    this.on(window, 'keydown', handler);
  }

  destroy() {
    this._timer?.stop();
    super.destroy();
  }
}