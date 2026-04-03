import { BaseView }     from './BaseView.js';
import { ThemeManager } from '../modules/ThemeManager.js';
import { getState }     from '../state.js';
import { Timer }        from '../modules/Timer.js';

const SEC_COLORS = ['var(--c1)','var(--c2)','var(--c3)','var(--c4)','var(--c5)','var(--c6)'];

const PASS_LINES = [
  'Excellent work. Keep the momentum going.',
  'Outstanding performance — well earned.',
  'You passed. Solid understanding throughout.',
];
const FAIL_LINES = [
  'Review the explanations and try again — you\'ll get there.',
  'Study the weak sections, then come back stronger.',
  'Progress is progress. Review and retry.',
];

export class ResultsView extends BaseView {
  render() {
    const state = getState();
    const results = state.results;
    if (!results) { this.navigate('selector'); return; }

    const { total, correct, incorrect, skipped, percentage, elapsed, sections } = results;
    const passThreshold = 60;
    const passed        = percentage >= passThreshold;
    const ringColor     = passed ? 'var(--ok)' : percentage >= 40 ? 'var(--warn)' : 'var(--err)';
    const tagline       = passed
      ? PASS_LINES[Math.floor(Math.random() * PASS_LINES.length)]
      : FAIL_LINES[Math.floor(Math.random() * FAIL_LINES.length)];

    const modeLabel = state.mode?.label ?? 'Exam';

    this.setHTML(`
      <div class="results-view view">
        <nav class="topnav scrolled">
          <a href="#">
          <div class="topnav-inner">
            <div class="nav-brand">QUAN<span>T</span>A</div>
            <div class="nav-spacer"></div>
            <button class="theme-toggle" id="theme-toggle">${ThemeManager.icon()}</button>
          </div>
          </a>
        </nav>

        <div class="container-md results-wrap stagger">

          <!-- Score hero -->
          <div class="results-hero">
            <div class="score-ring-wrap">
              <svg class="score-ring" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
                <circle class="score-ring-track" cx="80" cy="80" r="68"/>
                <circle class="score-ring-fill" id="ring-fill"
                  cx="80" cy="80" r="68"
                  stroke="${ringColor}"
                  stroke-dasharray="427.26"
                  stroke-dashoffset="427.26"/>
              </svg>
              <div class="score-ring-text">
                <div class="score-ring-pct" id="score-pct">${percentage}%</div>
                <div class="score-ring-label">score</div>
              </div>
            </div>

            <div class="verdict-badge ${passed ? 'pass' : 'fail'}">
              ${passed ? '✓ PASSED' : '✗ NEEDS REVIEW'}
            </div>

            <p class="results-tagline">${tagline}</p>
            <p style="font-size:var(--text-xs);color:var(--text-3);margin-top:var(--sp-2)">
              Mode: ${modeLabel} · ${state.examMeta?.title ?? 'Exam'}
            </p>
          </div>

          <!-- Quick stats -->
          <div class="results-stats">
            <div class="stat-card">
              <span class="stat-val" style="color:var(--ok)">${correct}</span>
              <span class="stat-label">Correct</span>
            </div>
            <div class="stat-card">
              <span class="stat-val" style="color:var(--err)">${incorrect}</span>
              <span class="stat-label">Incorrect</span>
            </div>
            <div class="stat-card">
              <span class="stat-val" style="color:var(--text-3)">${skipped}</span>
              <span class="stat-label">Skipped</span>
            </div>
            <div class="stat-card">
              <span class="stat-val">${total}</span>
              <span class="stat-label">Total</span>
            </div>
            <div class="stat-card">
              <span class="stat-val" style="font-size:var(--text-xl)">${Timer.format(elapsed)}</span>
              <span class="stat-label">Time Taken</span>
            </div>
            <div class="stat-card">
              <span class="stat-val">${passThreshold}%</span>
              <span class="stat-label">Pass Mark</span>
            </div>
          </div>

          <!-- Section breakdown -->
          <div class="breakdown-card">
            <div class="breakdown-title">§ Section Breakdown</div>
            ${sections.map((s, i) => {
              const spct  = s.total ? Math.round((s.correct / s.total) * 100) : 0;
              const color = SEC_COLORS[i % 6];
              return `
                <div class="breakdown-row">
                  <div class="sec-dot" style="background:${color}"></div>
                  <div class="breakdown-name" title="${s.name}">${s.name}</div>
                  <div class="breakdown-score">${s.correct}/${s.total}</div>
                  <div class="breakdown-track">
                    <div class="breakdown-fill" style="width:${spct}%;background:${color}"></div>
                  </div>
                </div>`;
            }).join('')}
          </div>

          <!-- Actions -->
          <div class="results-actions">
            <button class="btn btn-secondary" id="btn-review-all">Review All Answers</button>
            <button class="btn btn-secondary" id="btn-review-wrong">Review Wrong Only</button>
            <button class="btn btn-secondary" id="btn-export">Export JSON ↓</button>
            <button class="btn btn-primary"   id="btn-restart">Retake Exam →</button>
          </div>
        </div>
      </div>
    `);

    this._animateRing(percentage, 427.26);
    this._bindAll(results, state);
  }

  _animateRing(pct, circumference) {
    requestAnimationFrame(() => {
      setTimeout(() => {
        const ring = this.$('#ring-fill');
        if (ring) {
          ring.style.strokeDashoffset = circumference * (1 - pct / 100);
          ring.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)';
        }
      }, 150);
    });
  }

  _bindAll(results, state) {
    this.on(this.$('#theme-toggle'), 'click', () => {
      ThemeManager.toggle();
      this.$('#theme-toggle').textContent = ThemeManager.icon();
    });
    this.on(this.$('.nav-brand'), 'click', () => this.navigate('selector'));

    this.on(this.$('#btn-review-all'),   'click', () => this.navigate('review', { filter: 'all' }));
    this.on(this.$('#btn-review-wrong'), 'click', () => this.navigate('review', { filter: 'incorrect' }));
    this.on(this.$('#btn-restart'),      'click', () => this.navigate('lobby'));
    this.on(this.$('#btn-export'),       'click', () => this._export(results, state));
  }

  _export(results, state) {
    const data = {
      exam:      state.examMeta?.title ?? 'QUANTA Exam',
      mode:      state.mode?.label ?? 'Assessment',
      date:      new Date().toISOString(),
      score:     results.percentage + '%',
      passed:    results.percentage >= 60,
      correct:   results.correct,
      incorrect: results.incorrect,
      skipped:   results.skipped,
      total:     results.total,
      timeTaken: Timer.format(results.elapsed),
      sections:  results.sections.map(s => ({
        section:  s.name,
        correct:  s.correct,
        total:    s.total,
        score:    Math.round((s.correct / s.total) * 100) + '%',
      })),
      answers: state.session.questions.map(q => ({
        id:         q.id,
        section:    q.sectionName,
        question:   q.text,
        selected:   state.session.getAnswer(q.id) ?? null,
        correct:    q.correct,
        result:     !state.session.getAnswer(q.id) ? 'skipped'
                    : q.isCorrect(state.session.getAnswer(q.id)) ? 'correct' : 'incorrect',
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `quanta-results-${Date.now()}.json`;
    a.click();
    this.toast('Results exported as JSON');
  }
}
