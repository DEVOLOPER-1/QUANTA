/**
 * Timer — Encapsulates both countdown and count-up behaviour.
 * Decoupled from the DOM; consumers register callbacks.
 */
export class Timer {
  /**
   * @param {{ totalSeconds: number, onTick: function, onExpire?: function }}
   *   totalSeconds=0 → count-up mode (elapsed)
   *   totalSeconds>0 → countdown mode
   */
  constructor({ totalSeconds = 0, onTick, onExpire }) {
    this._total     = totalSeconds;
    this._elapsed   = 0;
    this._onTick    = onTick;
    this._onExpire  = onExpire;
    this._handle    = null;
    this._running   = false;
    this.mode       = totalSeconds > 0 ? 'countdown' : 'countup';
  }

  /** Returns current display value in seconds. */
  get displaySeconds() {
    return this.mode === 'countdown'
      ? Math.max(0, this._total - this._elapsed)
      : this._elapsed;
  }

  get isWarning() {
    return this.mode === 'countdown' && this.displaySeconds <= 300;
  }

  get isRunning() { return this._running; }

  start() {
    if (this._running) return;
    this._running = true;
    this._handle  = setInterval(() => this._tick(), 1000);
  }

  stop() {
    if (this._handle) clearInterval(this._handle);
    this._handle  = null;
    this._running = false;
  }

  _tick() {
    this._elapsed++;
    this._onTick?.(this.displaySeconds);

    if (this.mode === 'countdown' && this.displaySeconds === 0) {
      this.stop();
      this._onExpire?.();
    }
  }

  /** Formats a seconds value as MM:SS. */
  static format(seconds) {
    if (seconds < 0) seconds = 0;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
}
