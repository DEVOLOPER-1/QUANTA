/**
 * Session — Tracks all mutable state for a single exam attempt.
 * Owns answers, flags, navigation position, and timing.
 */
export class Session {
  /**
   * @param {Question[]} questions — ordered list for this attempt
   */
  constructor(questions) {
    this.questions    = questions;
    this.answers      = new Map();   // questionId (number) → answer key (string)
    this.flagged      = new Set();   // questionId (number)
    this.currentIndex = 0;
    this.startTime    = Date.now();
    this.endTime      = null;
  }

  /* ── Navigation ── */

  get currentQuestion() { return this.questions[this.currentIndex]; }
  get totalQuestions()  { return this.questions.length; }
  get isFirst()         { return this.currentIndex === 0; }
  get isLast()          { return this.currentIndex === this.totalQuestions - 1; }

  navigate(direction) {
    const next = this.currentIndex + direction;
    if (next >= 0 && next < this.totalQuestions) {
      this.currentIndex = next;
      return true;
    }
    return false;
  }

  goTo(index) {
    if (index >= 0 && index < this.totalQuestions) {
      this.currentIndex = index;
    }
  }

  /* ── Answers ── */

  answer(questionId, key) { this.answers.set(questionId, key); }
  getAnswer(questionId)   { return this.answers.get(questionId) ?? null; }

  get answeredCount() { return this.answers.size; }
  get progress()      { return this.answeredCount / this.totalQuestions; }

  /* ── Flags ── */

  toggleFlag(questionId) {
    this.flagged.has(questionId)
      ? this.flagged.delete(questionId)
      : this.flagged.add(questionId);
  }

  isFlagged(questionId) { return this.flagged.has(questionId); }

  /* ── Timing ── */

  finish() { this.endTime = Date.now(); }

  get elapsedSeconds() {
    return Math.floor(((this.endTime ?? Date.now()) - this.startTime) / 1000);
  }

  /* ── Results computation ── */

  /**
   * Computes final results.
   * @returns {{ total, correct, incorrect, skipped, percentage, elapsed, sections }}
   */
  computeResults() {
    const sectionMap = new Map();

    this.questions.forEach(q => {
      // Initialise section bucket
      if (!sectionMap.has(q.sectionId)) {
        sectionMap.set(q.sectionId, {
          id:      q.sectionId,
          name:    q.sectionName,
          total:   0,
          correct: 0,
        });
      }
      const sec = sectionMap.get(q.sectionId);
      sec.total++;

      const userKey = this.getAnswer(q.id);
      if (userKey && q.isCorrect(userKey)) sec.correct++;
    });

    const correct = Array.from(sectionMap.values()).reduce((sum, s) => sum + s.correct, 0);
    const total   = this.totalQuestions;
    const skipped = total - this.answeredCount;

    return {
      total,
      correct,
      incorrect:  this.answeredCount - correct,
      skipped,
      percentage: Math.round((correct / total) * 100),
      elapsed:    this.elapsedSeconds,
      sections:   Array.from(sectionMap.values()),
    };
  }
}
