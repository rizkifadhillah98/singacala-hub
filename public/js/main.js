// ==========================================================================
// MAIN ENTRY POINT - Pegadaian Championship Application
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
  checkAndInitAdmin,
  syncDummyUI,
} from './modules/ui.js';
import { initRouter, handleRoute } from './modules/router.js';
import { initSimulationState } from './modules/simulation.js';

// ==========================================================================
// DATA LOADING
// ==========================================================================

export async function loadInitialData() {
  try {
    const [standingsRes, fixturesRes] = await Promise.all([
      fetch('/api/standings').then((r) => r.json()).catch(() => ({ success: false })),
      fetch('/api/fixtures').then((r) => r.json()).catch(() => ({ success: false })),
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

      // Find highest week that has FT matches in Grup A
      const activeWeeks = fixturesRes.data.filter(
        (w) => w.pertandingan && w.pertandingan.some((m) => m.grup === 'Grup A' && m.status === 'FT')
      );
      if (activeWeeks.length > 0) {
        state.currentWeek = activeWeeks[activeWeeks.length - 1].pekan;
      } else {
        state.currentWeek = 1;
      }
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
  checkAndInitAdmin();
  initRouter();
  loadInitialData();
});

