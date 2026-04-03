/**
 * BaseView — Abstract base for all QUANTA views.
 *
 * Provides:
 *   - Managed event listener registry (auto-removed on destroy)
 *   - Helpers: setHTML, on, navigate, toast
 *   - Lifecycle hooks: render() and destroy()
 *
 * To add a new view:
 *   1. Create /js/views/MyView.js  →  extend BaseView
 *   2. Implement render()
 *   3. Register in app.js: router.register('myview', MyView)
 */
export class BaseView {
  /**
   * @param {HTMLElement} container — #app mount element
   * @param {Router}      router
   * @param {Object}      params    — optional route params
   */
  constructor(container, router, params = {}) {
    this._container = container;
    this._router    = router;
    this._params    = params;
    this._listeners = []; // { el, event, handler }
  }

  /* ── Lifecycle ── */

  /** Subclasses must override this method. */
  render() {
    throw new Error(`${this.constructor.name} must implement render().`);
  }

  /** Removes all registered listeners and clears the container. */
  destroy() {
    this._listeners.forEach(({ el, event, handler }) =>
      el.removeEventListener(event, handler)
    );
    this._listeners = [];
  }

  /* ── Helpers ── */

  /** Replace the container's inner HTML. */
  setHTML(html) {
    this._container.innerHTML = html;
  }

  /**
   * Register an event listener that will be automatically removed on destroy.
   * @param {EventTarget} el
   * @param {string}      event
   * @param {Function}    handler
   */
  on(el, event, handler) {
    if (!el) return;
    el.addEventListener(event, handler);
    this._listeners.push({ el, event, handler });
  }

  /** Shorthand for scoped querySelector. */
  $(selector) {
    return this._container.querySelector(selector);
  }

  /** Shorthand for scoped querySelectorAll. */
  $$(selector) {
    return this._container.querySelectorAll(selector);
  }

  /** Navigate to another route. */
  navigate(routeId, params) {
    this._router.navigate(routeId, params);
  }

  /** Display a brief toast notification. */
  toast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.className   = 'toast';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }

  /** Scroll the container to the top. */
  scrollTop() {
    this._container.scrollTo?.(0, 0);
    window.scrollTo(0, 0);
  }
}
