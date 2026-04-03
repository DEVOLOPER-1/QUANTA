/**
 * Router — Maps URL hashes to view classes and manages the view lifecycle.
 *
 * Open/Closed: registering a new view requires only one new line in app.js.
 * The router itself never changes.
 */
export class Router {
  /**
   * @param {string} containerSelector — CSS selector for the #app mount point
   */
  constructor(containerSelector) {
    this._container  = document.querySelector(containerSelector);
    this._routes     = new Map();   // routeId → ViewClass
    this._current    = null;        // current view instance

    window.addEventListener('hashchange', () => this._onHashChange());
  }

  /**
   * Register a view class for a route string.
   * @param {string}   routeId
   * @param {Function} ViewClass — must extend BaseView
   * @returns {Router} — fluent
   */
  register(routeId, ViewClass) {
    this._routes.set(routeId, ViewClass);
    return this;
  }

  /**
   * Programmatically navigate to a route.
   * @param {string} routeId
   * @param {Object} [params] — optional data passed to the view constructor
   */
  navigate(routeId, params = {}) {
    // Store params so the hashchange handler can retrieve them
    this._pendingParams = params;
    window.location.hash = routeId;

    // hashchange fires async; call _render directly for same-tick navigation
    this._render(routeId, params);
  }

  /** @private */
  _onHashChange() {
    const routeId = window.location.hash.slice(1) || 'selector';
    // Use pending params if this was a programmatic navigate, else empty
    const params  = this._pendingParams ?? {};
    this._pendingParams = null;
    this._render(routeId, params);
  }

  /** @private */
  _render(routeId, params) {
    const ViewClass = this._routes.get(routeId);

    if (!ViewClass) {
      console.warn(`Router: no view registered for route "${routeId}", falling back to selector.`);
      this.navigate('selector');
      return;
    }

    // Tear down previous view
    if (this._current) {
      this._current.destroy();
      this._current = null;
    }

    // Mount new view
    this._current = new ViewClass(this._container, this, params);
    this._current.render();
  }
}
