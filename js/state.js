/**
 * AppState — Single source of truth for cross-view state.
 * Exported as a singleton via getState().
 *
 * Intentionally kept minimal: only data that must survive
 * view transitions lives here. View-local UI state stays
 * inside each view class.
 */
class AppState {
  constructor() {
    /* Selected exam from exams.json */
    this.examMeta = null;

    /* Parsed Question[] array for the current exam */
    this.questions = [];

    /* Active Session instance */
    this.session = null;

    /* Active ExamMode instance */
    this.mode = null;

    /* User config set on the lobby screen */
    this.config = {
      timerMinutes:    60,
      shuffle:         false,
      showDifficulty:  true,
    };

    /* Computed results object — set after session.finish() */
    this.results = null;
  }

  reset() {
    this.session  = null;
    this.results  = null;
  }
}

let _instance = null;

/**
 * Returns the singleton AppState.
 * @returns {AppState}
 */
export function getState() {
  if (!_instance) _instance = new AppState();
  return _instance;
}
