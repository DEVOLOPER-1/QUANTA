/**
 * QUANTA — Application Entry Point
 *
 * This file is the only place that knows about:
 *   - Which views exist
 *   - Which routes map to which views
 *   - Bootstrap order
 *
 * To register a new view:  router.register('routeId', MyNewView)
 * Nothing else needs to change.
 */

import { Router }        from './router.js';
import { ThemeManager }  from './modules/ThemeManager.js';
import { SelectorView }  from './views/SelectorView.js';
import { LobbyView }     from './views/LobbyView.js';
import { ExamView }      from './views/ExamView.js';
import { ResultsView }   from './views/ResultsView.js';
import { ReviewView }    from './views/ReviewView.js';

/* ── 1. Theme (before any paint to avoid flash) ── */
ThemeManager.init();

/* ── 2. Router ── */
const router = new Router('#app');

router
  .register('selector', SelectorView)
  .register('lobby',    LobbyView)
  .register('exam',     ExamView)
  .register('results',  ResultsView)
  .register('review',   ReviewView);

/* ── 3. Initial route ── */
const initialRoute = window.location.hash.slice(1) || 'selector';

// Small delay to let fonts/CSS settle, then remove splash and navigate
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    router.navigate(initialRoute === 'selector' ? 'selector' : initialRoute);
  }, 480);
});
