// ==========================================================================
// ROUTER MODULE - Hash-based Client-Side Routing & Deep Linking
// ==========================================================================

import { state } from './state.js';
import { switchView } from './ui.js';
import { openStatDetail, closeStatDetail } from './stats.js';
import { renderFixturesStream } from './fixtures.js';
import { simState, renderSimulationView } from './simulation.js';

/**
 * Parse current window.location.hash into:
 * { view, subRoute, params }
 *
 * Supported patterns:
 *   "" or "#" or "#standings"   => view: 'standings', subRoute: '', params: {}
 *   "#fixtures"                 => view: 'fixtures', subRoute: '', params: {}
 *   "#fixtures?week=8"          => view: 'fixtures', subRoute: '', params: { week: '8' }
 *   "#stats"                    => view: 'stats', subRoute: '', params: {}
 *   "#stats/clean-sheets"       => view: 'stats', subRoute: 'clean-sheets', params: {}
 *   "#simulation/week/8"        => view: 'simulation', subRoute: 'week/8', params: {} (Future-ready)
 */
export function parseRoute() {
  const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
  if (!rawHash) {
    return { view: 'standings', subRoute: '', params: {} };
  }

  const [pathPart, queryPart] = rawHash.split('?');
  const segments = pathPart.split('/').filter(Boolean);

  const view = (segments[0] || 'standings').toLowerCase();
  const subRoute = segments.slice(1).join('/');

  const params = {};
  if (queryPart) {
    const searchParams = new URLSearchParams(queryPart);
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
  }

  return { view, subRoute, params };
}

/**
 * Programmatically navigate to a route
 * @param {string} targetPath - e.g. 'stats', 'stats/clean-sheets', 'fixtures?week=8'
 */
export function navigateTo(targetPath) {
  const cleanPath = targetPath.replace(/^#\/?/, '');
  const currentClean = window.location.hash.replace(/^#\/?/, '');

  if (currentClean !== cleanPath) {
    window.location.hash = `#${cleanPath}`;
  } else {
    // If the hash didn't change (e.g. user clicked current active tab), re-run route handler
    handleRoute(false);
  }
}

/**
 * Handle route changes and activate the corresponding view & subviews
 * @param {boolean} isInitial - True during initial page load to prevent unnecessary smooth scroll
 */
export function handleRoute(isInitial = false) {
  const { view, subRoute, params } = parseRoute();
  const validViews = ['standings', 'fixtures', 'stats', 'simulation'];

  const targetView = validViews.includes(view) ? view : 'standings';

  // 1. Switch the primary view section
  switchView(targetView, !isInitial);

  // 2. Handle view-specific subroutes & parameters
  if (targetView === 'stats') {
    if (subRoute) {
      // Subroute is stat key, e.g. 'clean-sheets', 'home-record'
      openStatDetail(subRoute, !isInitial);
    } else {
      closeStatDetail();
    }
  } else if (targetView === 'fixtures') {
    if (params.week) {
      const wk = parseInt(params.week, 10);
      if (!isNaN(wk) && wk >= 1) {
        state.currentWeek = wk;
        state.selectedPeriod = 'single';
      }
    }
    if (params.club) {
      state.selectedClubFilter = params.club;
      const clubLabel = document.getElementById('selected-club-text');
      if (clubLabel) clubLabel.textContent = params.club;
    }
    if (state.fixturesData && state.fixturesData.length > 0) {
      renderFixturesStream();
    }
  } else if (targetView === 'simulation') {
    if (params.group) {
      simState.activeGroup = params.group;
    }
    if (params.week) {
      const wk = parseInt(params.week, 10);
      if (!isNaN(wk) && wk >= 1 && wk <= 27) {
        simState.selectedWeek = wk;
      }
    }
    renderSimulationView();
  }
}

/**
 * Initialize hashchange listener and handle current route
 */
export function initRouter() {
  window.addEventListener('hashchange', () => {
    handleRoute(false);
  });

  // Handle route immediately on initialization
  handleRoute(true);
}

