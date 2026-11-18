// ==========================================================================
// MAIN ENTRY POINT - Singacala Hub Application
// ==========================================================================

import { state } from './modules/state.js';
import { formatTimestamp, buildFormMap } from './modules/utils.js';
import { applyI18n, setupLanguageSwitcher, t } from './modules/i18n.js';
import { renderStandingsTable, setupTableSorting, initProgressionTabs, renderProgressionChart } from './modules/standings.js';
import {
  renderFixturesStream,
  populateMatchweeksFilterMenu,
  syncMatchweekDropdownText,
  populateClubsFilterMenu,
} from './modules/fixtures.js';
import { renderStatsOverview } from './modules/stats.js';
import {
  setupNavigation,
  setupSearch,
  setupDrawer,
  setupModals,
  setupDisclaimerModal,
  checkAndInitAdmin,
  syncDummyUI,
} from './modules/ui.js';
import { initRouter, handleRoute } from './modules/router.js';
import { initSimulationState } from './modules/simulation.js';

// ==========================================================================
// DATA LOADING (Supports Express API + Static Hosting Fallback)
// ==========================================================================

async function fetchJsonSafe(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchStandingsWithFallback() {
  try {
    const apiData = await fetchJsonSafe('/api/standings');
    if (apiData && apiData.success) return apiData;
  } catch (_) {}

  // Static hosting fallback (Cloudflare Workers / Pages / CDN)
  try {
    const [groups, meta] = await Promise.all([
      fetchJsonSafe('./data/klasemen.json'),
      fetchJsonSafe('./data/meta.json').catch(() => null),
    ]);
    if (Array.isArray(groups) && groups.length > 0) {
      return {
        success: true,
        data: groups[0],
        groups,
        lastModified: meta?.lastModified || null,
      };
    }
  } catch (_) {}

  return { success: false };
}

async function fetchFixturesWithFallback() {
  try {
    const apiData = await fetchJsonSafe('/api/fixtures');
    if (apiData && apiData.success) return apiData;
  } catch (_) {}

  try {
    const data = await fetchJsonSafe('./data/jadwal_dan_hasil.json');
    if (Array.isArray(data) && data.length > 0) {
      return { success: true, data };
    }
  } catch (_) {}

  return { success: false };
}

export async function loadInitialData() {
  try {
    const [standingsRes, fixturesRes] = await Promise.all([
      fetchStandingsWithFallback(),
      fetchFixturesWithFallback(),
    ]);

    if (standingsRes.success) {
      if (standingsRes.groups && standingsRes.groups.length > 0) {
        state.standingsGroups = standingsRes.groups;
      } else {
        // Fallback: fetch /klasemen.json directly to get both Grup A & B
        try {
          const raw = await fetch('/klasemen.json').then((r) => r.json());
          if (Array.isArray(raw) && raw.length > 0) {
            state.standingsGroups = raw;
          }
        } catch (_) { }
      }

      if (!state.standingsGroups || state.standingsGroups.length === 0) {
        if (standingsRes.data) state.standingsGroups = [standingsRes.data];
      }

      const target =
        state.standingsGroups.find((g) => g.grup === 'Grup A') ||
        state.standingsGroups[0];
      state.standingsData = target;
      state.selectedGroup = 'Grup A';

      const updatedStr = formatTimestamp(standingsRes.lastModified);
      const updateLabel = document.getElementById('standings-updated-label');
      if (updateLabel) updateLabel.textContent = `${t('standings_updated_prefix')} ${updatedStr}`;
      const drawerLabel = document.getElementById('drawer-sync-timestamp');
      if (drawerLabel) drawerLabel.textContent = `${t('drawer_sync_prefix')} ${updatedStr}`;
    }

    if (fixturesRes.success && fixturesRes.data && fixturesRes.data.length > 0) {
      state.fixturesData = fixturesRes.data;
      const grupAWeeks = fixturesRes.data.filter((w) =>
        w.pertandingan && w.pertandingan.some((m) => m.grup === 'Grup A')
      );
      state.totalWeeks = grupAWeeks.length > 0 ? grupAWeeks.length : 18;

      // Determine active matchweek:
      // If a week has not finished all its matches (status !== 'FT' or missing score), stay on that week.
      // If all matches in that week are finished, advance to the next week.
      const sortedWeeks = [...fixturesRes.data].sort((a, b) => a.pekan - b.pekan);
      let detectedWeek = null;
      for (const w of sortedWeeks) {
        const grupAMatches = (w.pertandingan || []).filter(
          (m) => m.grup === 'Grup A' || m.grup === 'A'
        );
        const matchesToCheck = grupAMatches.length > 0 ? grupAMatches : (w.pertandingan || []);
        if (matchesToCheck.length > 0) {
          const allCompleted = matchesToCheck.every(
            (m) => m.status === 'FT' && m.skorHome !== null && m.skorAway !== null
          );
          if (!allCompleted) {
            detectedWeek = w.pekan;
            break;
          }
        }
      }
      state.currentWeek = detectedWeek !== null ? detectedWeek : (state.totalWeeks || 18);
    }

    if (state.standingsData && state.standingsData.klasemen) {
      state.teamsFormMap = buildFormMap(state.standingsData.klasemen, state.fixturesData);
      renderStandingsTable();
      renderProgressionChart();
      renderStatsOverview();
      populateClubsFilterMenu();
    }

    if (state.fixturesData.length > 0) {
      populateMatchweeksFilterMenu();
      syncMatchweekDropdownText();
      renderFixturesStream();
    }

    initSimulationState();
    syncDummyUI();

    // Re-apply route with fully loaded data
    handleRoute(true);
  } catch (err) {
    console.error('Gagal memuat data:', err);
  }
}

// ==========================================================================
// BOOTSTRAP
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  applyI18n();
  setupLanguageSwitcher();
  setupNavigation();
  initProgressionTabs();
  setupTableSorting();
  setupSearch();
  setupDrawer();
  setupModals();
  setupDisclaimerModal();
  checkAndInitAdmin();
  initRouter();
  loadInitialData();
});

