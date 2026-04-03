/**
 * ExamModes — Open/Closed Principle implementation.
 *
 * ExamMode is the stable abstraction (closed for modification).
 * Add new behaviour by extending ExamMode and registering it in MODES
 * — no changes to core engine files required.
 */

/* ── Base class ─────────────────────────────────────────────── */
export class ExamMode {
  /**
   * @param {string} id
   * @param {string} label        — Human-readable name
   * @param {string} description  — One-line description
   * @param {string} icon         — Emoji or symbol
   */
  constructor(id, label, description, icon) {
    if (new.target === ExamMode) {
      throw new TypeError('ExamMode is abstract and cannot be instantiated directly.');
    }
    this.id          = id;
    this.label       = label;
    this.description = description;
    this.icon        = icon;
  }

  /** Whether to reveal correct/wrong feedback immediately after answering. */
  showImmediateFeedback() { return false; }

  /** Whether the exam should have a countdown timer. */
  useTimer() { return false; }

  /** Whether the user can freely change a selected answer. */
  allowAnswerChange() { return true; }
}

/* ── Concrete mode: Assessment ──────────────────────────────── */
export class AssessmentMode extends ExamMode {
  constructor() {
    super(
      'assessment',
      'Exam Mode',
      'Traditional exam: submit when done, results and explanations revealed at the end.',
      '📋'
    );
  }
  showImmediateFeedback() { return false; }
  useTimer()              { return true; }
  allowAnswerChange()     { return true; }
}

/* ── Concrete mode: Practice ─────────────────────────────────── */
export class PracticeMode extends ExamMode {
  constructor() {
    super(
      'practice',
      'Practice Mode',
      'Get instant feedback and a full explanation after each answer.',
      '🧠'
    );
  }
  showImmediateFeedback() { return true; }
  useTimer()              { return false; }
  allowAnswerChange()     { return false; } // lock after first selection
}

/* ── Registry ────────────────────────────────────────────────── */
/**
 * To add a new exam mode:
 *   1. Create a class that extends ExamMode (new file recommended).
 *   2. Add an instance to this map with a unique key.
 *   Done. No other files need editing.
 */
export const MODES = Object.freeze({
  assessment: new AssessmentMode(),
  practice:   new PracticeMode(),
});

export const DEFAULT_MODE_ID = 'assessment';
