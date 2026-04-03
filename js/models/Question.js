/**
 * Question — Immutable value object representing a single MCQ.
 * Validates and normalises CSV row data on construction.
 */
export class Question {
  constructor({ id, sectionId, sectionName, text, options, correct, explanation, difficulty }) {
    this.id          = Number(id);
    this.sectionId   = Number(sectionId);
    this.sectionName = String(sectionName);
    this.text        = String(text);
    this.options     = options; // { A, B, C, D }
    this.correct     = String(correct).toUpperCase();
    this.explanation = String(explanation);
    this.difficulty  = ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium';
  }

  /** Returns true if the provided answer key is correct. */
  isCorrect(answerKey) {
    return String(answerKey).toUpperCase() === this.correct;
  }

  /** Factory method — constructs a Question from a raw CSV row object. */
  static fromCSVRow(row) {
    return new Question({
      id:          row.id,
      sectionId:   row.section_id,
      sectionName: row.section_name,
      text:        row.question,
      options: {
        A: row.option_a,
        B: row.option_b,
        C: row.option_c,
        D: row.option_d,
      },
      correct:     row.correct_answer,
      explanation: row.explanation,
      difficulty:  row.difficulty,
    });
  }
}
