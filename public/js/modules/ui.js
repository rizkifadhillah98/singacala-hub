// ==========================================================================
// UI MODULE - Search Modal, Drawer, Navigation, View Switching, Modals
// ==========================================================================

import { state } from './state.js';
import { navigateTo } from './router.js';
import { formatTimestamp, showToast, buildFormMap, matchClubs } from './utils.js';
import { t, getLanguage, setLanguage } from './i18n.js';
import {
  switchGroup,
  renderStandingsTable,
  renderProgressionChart,
  renderPsgcOddsPanel,
} from './standings.js';
import { clearPsgcOddsCache } from './psgc-odds.js';
import {
  generateRealisticScore,
  resolveOfficialStandingsTies,
} from './simulation.js';
import { generateRound3Fixtures } from './round3-regulasi.js';
import {
  renderFixturesStream,
  syncMatchweekDropdownText,
  populateMatchweeksFilterMenu,
  populateClubsFilterMenu,
  renderMatchweekCarousel,
  setupMatchDetailEvents,
  closeMatchDetail,
} from './fixtures.js';
import {
  renderStatsOverview,
  closeStatDetail,
  renderStatsDetailView,
} from './stats.js';
import {
  renderSimFloatingSummaryBar,
} from './simulation.js';

// ==========================================================================
// DUMMY WEEKLY UPDATE TESTING (IN-MEMORY ONLY, NEVER WRITES TO SERVER FILES)
// ==========================================================================

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function isMatchDone(m) {
  return m && m.status === 'FT' && m.skorHome !== null && m.skorHome !== undefined && m.skorAway !== null && m.skorAway !== undefined;
}

function getNextDummyWeekNumber() {
  if (!Array.isArray(state.fixturesData) || state.fixturesData.length === 0) return null;
  for (let w = 1; w <= 27; w++) {
    const weekObj = state.fixturesData.find((item) => item.pekan === w);
    if (!weekObj) continue;
    const grupAMatches = (weekObj.pertandingan || []).filter((m) => m.grup === 'Grup A' || m.grup === 'A');
    if (w <= 18) {
      if (grupAMatches.length > 0 && grupAMatches.some((m) => !isMatchDone(m))) return w;
    } else if (grupAMatches.length === 0 || grupAMatches.some((m) => !isMatchDone(m))) {
      return w;
    }
  }
  return null;
}

export function syncDummyUI() {
  const statusEl = document.getElementById('dummy-status-label');
  const nextBtn = document.getElementById('btn-dummy-next-week');
  const nextSub = document.getElementById('dummy-next-week-sub');
  const resetBtn = document.getElementById('btn-dummy-reset');
  const nextWeek = getNextDummyWeekNumber();

  if (statusEl) {
    if (state.dummyTesting.active) {
      statusEl.textContent = `Mode Dummy: s/d Pekan ${state.dummyTesting.simulatedThroughWeek}`;
      statusEl.classList.add('is-dummy');
    } else {
      statusEl.textContent = `Data Resmi (Pekan ${state.currentWeek || 9})`;
      statusEl.classList.remove('is-dummy');
    }
  }
  if (nextBtn) {
    nextBtn.disabled = nextWeek === null;
  }
  if (nextSub) {
    nextSub.textContent = nextWeek !== null
      ? `Terapkan hasil dummy Pekan ${nextWeek} (tanpa ubah file server)`
      : 'Semua 27 pekan sudah selesai disimulasikan';
  }
  if (resetBtn) {
    resetBtn.disabled = !state.dummyTesting.active;
  }
}

function refreshAllDataViews() {
  clearPsgcOddsCache();
  if (state.standingsData && state.standingsData.klasemen) {
    state.teamsFormMap = buildFormMap(state.standingsData.klasemen, state.fixturesData);
    renderStandingsTable();
    renderProgressionChart();
    renderPsgcOddsPanel();
    renderStatsOverview();
  }
  populateMatchweeksFilterMenu();
  syncMatchweekDropdownText();
  populateClubsFilterMenu();
  renderFixturesStream();
  syncDummyUI();
}

function generatePsgcOutcomeScore(isPsgcHome, outcomeMode) {
  if (outcomeMode === 'win') {
    const winScores = [[2, 0], [2, 1], [3, 1], [1, 0]];
    const [w, l] = winScores[Math.floor(Math.random() * winScores.length)];
    return isPsgcHome ? { home: w, away: l } : { home: l, away: w };
  }
  if (outcomeMode === 'draw') {
    const d = Math.random() < 0.65 ? 1 : 0;
    return { home: d, away: d };
  }
  if (outcomeMode === 'loss') {
    const lossScores = [[0, 1], [1, 2], [0, 2], [1, 3]];
    const [l, w] = lossScores[Math.floor(Math.random() * lossScores.length)];
    return isPsgcHome ? { home: l, away: w } : { home: w, away: l };
  }
  return null;
}

function buildGroupClubMetaMap(groupName) {
  const meta = {};
  const groupObj = state.standingsGroups.find((g) => g.grup === groupName);
  if (groupObj && Array.isArray(groupObj.klasemen)) {
    groupObj.klasemen.forEach((t) => {
      meta[t.klub] = { logo: t.logo || '', stadion: 'Stadion Utama' };
    });
  }
  (state.fixturesData || []).forEach((w) => {
    (w.pertandingan || []).forEach((m) => {
      if (m.grup !== groupName) return;
      if (m.timHome) {
        const key = Object.keys(meta).find((c) => matchClubs(c, m.timHome)) || m.timHome;
        meta[key] = {
          logo: (meta[key] && meta[key].logo) || m.logoHome || '',
          stadion: (meta[key] && meta[key].stadion !== 'Stadion Utama') ? meta[key].stadion : (m.stadion || 'Stadion Utama'),
        };
      }
      if (m.timAway) {
        const key = Object.keys(meta).find((c) => matchClubs(c, m.timAway)) || m.timAway;
        meta[key] = {
          logo: (meta[key] && meta[key].logo) || m.logoAway || '',
          stadion: (meta[key] && meta[key].stadion) || 'Stadion Utama',
        };
      }
    });
  });
  return meta;
}

function ensureRound3FixturesForDummy() {
  const week19 = state.fixturesData.find((w) => w.pekan === 19);
  if (week19 && Array.isArray(week19.pertandingan) && week19.pertandingan.length > 0) return;

  state.standingsGroups.forEach((groupObj) => {
    const gName = groupObj.grup;
    const meta = buildGroupClubMetaMap(gName);
    const { weeks } = generateRound3Fixtures(groupObj.klasemen || [], gName, meta);
    weeks.forEach((genWeek) => {
      let targetWeek = state.fixturesData.find((w) => w.pekan === genWeek.pekan);
      if (!targetWeek) {
        targetWeek = { pekan: genWeek.pekan, tanggal: genWeek.tanggal, pertandingan: [] };
        state.fixturesData.push(targetWeek);
      }
      if (!Array.isArray(targetWeek.pertandingan)) targetWeek.pertandingan = [];
      targetWeek.pertandingan.push(...genWeek.pertandingan);
    });
  });

  state.totalWeeks = state.fixturesData.filter((w) => w.pertandingan && w.pertandingan.length > 0).length;
}

export function simulateNextDummyWeek(outcomeMode = 'random') {
  const nextWeek = getNextDummyWeekNumber();
  if (nextWeek === null) {
    showToast('Simulasi Selesai', 'Seluruh 27 pekan sudah berstatus FT.', '🏆', 3000);
    return;
  }

  // Capture official snapshot before first dummy mutation
  if (!state.dummyTesting.active) {
    const updatedLabel = document.getElementById('standings-updated-label');
    state.dummyTesting.officialSnapshot = {
      standingsGroups: deepClone(state.standingsGroups),
      fixturesData: deepClone(state.fixturesData),
      currentWeek: state.currentWeek,
      totalWeeks: state.totalWeeks,
      updatedLabelText: updatedLabel ? updatedLabel.textContent : '',
    };
  }

  if (nextWeek >= 19) {
    ensureRound3FixturesForDummy();
  }

  const weekObj = state.fixturesData.find((w) => w.pekan === nextWeek);
  if (!weekObj || !Array.isArray(weekObj.pertandingan)) return;

  // Apply dummy scores to unplayed matches in nextWeek and update standings incrementally
  state.standingsGroups.forEach((groupObj) => {
    const gName = groupObj.grup;
    const teams = (groupObj.klasemen || []).map((t) => ({ ...t }));
    const rankLookup = (clubName) => {
      const found = teams.find((t) => matchClubs(t.klub, clubName));
      return found ? found.posisi : 5;
    };

    const newlyPlayed = [];
    weekObj.pertandingan.forEach((m) => {
      if (m.grup !== gName || isMatchDone(m)) return;

      const isPsgcHome = /psgc/i.test(m.timHome || '');
      const isPsgcAway = /psgc/i.test(m.timAway || '');
      const forced = (isPsgcHome || isPsgcAway) ? generatePsgcOutcomeScore(isPsgcHome, outcomeMode) : null;
      const score = forced || generateRealisticScore(rankLookup(m.timHome), rankLookup(m.timAway));

      m.status = 'FT';
      m.skorHome = score.home;
      m.skorAway = score.away;
      newlyPlayed.push(m);
    });

    newlyPlayed.forEach((m) => {
      const h = teams.find((t) => matchClubs(t.klub, m.timHome));
      const a = teams.find((t) => matchClubs(t.klub, m.timAway));
      if (h) {
        h.main += 1;
        h.gf += m.skorHome;
        h.ga += m.skorAway;
        h.gd = h.gf - h.ga;
        if (m.skorHome > m.skorAway) { h.menang += 1; h.poin += 3; }
        else if (m.skorHome < m.skorAway) { h.kalah += 1; }
        else { h.seri += 1; h.poin += 1; }
      }
      if (a) {
        a.main += 1;
        a.gf += m.skorAway;
        a.ga += m.skorHome;
        a.gd = a.gf - a.ga;
        if (m.skorAway > m.skorHome) { a.menang += 1; a.poin += 3; }
        else if (m.skorAway < m.skorHome) { a.kalah += 1; }
        else { a.seri += 1; a.poin += 1; }
      }
    });

    // Collect all completed matches in this group for H2H tie-breaking
    const allPlayedMatches = [];
    state.fixturesData.forEach((w) => {
      (w.pertandingan || []).forEach((m) => {
        if (m.grup === gName && isMatchDone(m)) {
          const homeClub = teams.find((t) => matchClubs(t.klub, m.timHome));
          const awayClub = teams.find((t) => matchClubs(t.klub, m.timAway));
          if (homeClub && awayClub) {
            allPlayedMatches.push({
              timHome: homeClub.klub,
              timAway: awayClub.klub,
              skorHome: m.skorHome,
              skorAway: m.skorAway,
            });
          }
        }
      });
    });

    const baselineTeams = teams.map((t) => ({ ...t, baselinePos: t.posisi }));
    const sorted = resolveOfficialStandingsTies(baselineTeams, allPlayedMatches);
    sorted.forEach((t, idx) => {
      t.posisi = idx + 1;
      delete t.baselinePos;
    });
    groupObj.klasemen = sorted;
  });

  state.standingsData =
    state.standingsGroups.find((g) => g.grup === state.selectedGroup) || state.standingsGroups[0];
  state.currentWeek = nextWeek;
  state.dummyTesting.active = true;
  state.dummyTesting.simulatedThroughWeek = nextWeek;

  const updateLabel = document.getElementById('standings-updated-label');
  if (updateLabel) {
    updateLabel.textContent = `${t('standings_updated_prefix')} Mode Dummy (Pekan ${nextWeek})`;
  }

  refreshAllDataViews();
  showToast(`Dummy Pekan ${nextWeek}`, `Hasil Pekan ${nextWeek} diterapkan di memori. Klasemen & Peluang PSGC diperbarui.`, '🔄', 3200);
}

export function resetDummyData() {
  const snap = state.dummyTesting.officialSnapshot;
  if (!snap) return;

  state.standingsGroups = deepClone(snap.standingsGroups);
  state.fixturesData = deepClone(snap.fixturesData);
  state.standingsData =
    state.standingsGroups.find((g) => g.grup === state.selectedGroup) || state.standingsGroups[0];
  state.currentWeek = snap.currentWeek;
  state.totalWeeks = snap.totalWeeks;
  state.dummyTesting.active = false;
  state.dummyTesting.simulatedThroughWeek = null;
  state.dummyTesting.officialSnapshot = null;

  const updateLabel = document.getElementById('standings-updated-label');
  if (updateLabel && snap.updatedLabelText) {
    updateLabel.textContent = snap.updatedLabelText;
  }

  refreshAllDataViews();
  showToast('Data Resmi Dipulihkan', 'Simulasi dummy di-reset ke data resmi server.', '✅', 3000);
}

// ==========================================================================
// ADMIN MODE & TOKEN MANAGEMENT
// ==========================================================================

export function getAdminToken() {
  return sessionStorage.getItem('pc_admin_token') || '';
}

export function syncAdminUI() {
  const adminSection = document.getElementById('drawer-admin-section');
  const token = getAdminToken();
  if (adminSection) {
    adminSection.style.display = token ? 'block' : 'none';
  }
  syncDummyUI();
}

export async function checkAndInitAdmin() {
  // Check URL params for ?admin=... or ?token=...
  const urlParams = new URLSearchParams(window.location.search);
  const queryToken = urlParams.get('admin') || urlParams.get('token');

  if (queryToken) {
    try {
      const res = await fetch('/api/verify-admin', {
        headers: { 'x-admin-token': queryToken },
      }).then((r) => r.json());

      if (res.success) {
        sessionStorage.setItem('pc_admin_token', queryToken);
        showToast('Admin Mode Aktif', 'Otentikasi berhasil. Menu pembaruan data telah dibuka.', '🔑', 3500);
      } else {
        showToast('Otentikasi Gagal', 'Token admin tidak valid atau salah.', '❌', 3500);
      }
    } catch (_) { }

    // Clean URL so the token is never exposed in browser address bar or history
    urlParams.delete('admin');
    urlParams.delete('token');
    const cleanSearch = urlParams.toString() ? `?${urlParams.toString()}` : '';
    const newUrl = `${window.location.pathname}${cleanSearch}${window.location.hash}`;
    window.history.replaceState({}, document.title, newUrl);
  }

  syncAdminUI();
}

// ==========================================================================
// QUICK SEARCH MODAL
// ==========================================================================

export function setupSearch() {
  const openBtn = document.getElementById('btn-open-search');
  const modal = document.getElementById('search-modal-backdrop');
  const input = document.getElementById('quick-search-input');
  const closeBtn = document.getElementById('btn-search-close');
  const results = document.getElementById('search-results-list');

  if (!openBtn || !modal || !input) return;

  const openSearch = () => {
    modal.classList.add('show');
    input.value = '';
    input.focus();
    results.innerHTML = `<div class="search-empty-prompt">${t('search_prompt')}</div>`;
  };

  const closeSearch = () => {
    modal.classList.remove('show');
  };

  openBtn.addEventListener('click', openSearch);
  if (closeBtn) closeBtn.addEventListener('click', closeSearch);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeSearch();
  });

  const searchBox = modal.querySelector('.search-modal-box');
  if (searchBox) {
    setupBottomSheetGestures(searchBox, modal, closeSearch);
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      closeSearch();
    }
    // Ctrl+K or Cmd+K to open search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
  });

  input.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      results.innerHTML = `<div class="search-empty-prompt">${t('search_prompt')}</div>`;
      return;
    }

    const clubs =
      state.standingsData && state.standingsData.klasemen
        ? state.standingsData.klasemen.map((c) => ({ ...c, grup: 'Grup A' }))
        : [];

    const matchedClubs = clubs.filter((c) => c.klub.toLowerCase().includes(q));

    let html = '';
    if (matchedClubs.length > 0) {
      html += matchedClubs
        .map(
          (c) => `
          <div class="search-result-item" data-club="${c.klub}" data-group="${c.grup}">
            <div style="display: flex; align-items: center; gap: 12px;">
              <img src="${c.logo}" style="width: 28px; height: 28px; object-fit: contain;" onerror="this.style.opacity='0.2'">
              <div>
                <strong style="color: #fff; font-size: 14.5px; display: block;">${c.klub}</strong>
                <small style="color: #94a3b8; font-size: 12px;">${c.grup} • Peringkat #${c.posisi} • ${c.poin} Poin (${c.main} Laga)</small>
              </div>
            </div>
            <span style="font-size: 12px; color: var(--color-green); font-weight: 700;">Lihat Jadwal ➔</span>
          </div>
        `
        )
        .join('');
    } else {
      html = `<div class="search-empty-prompt">Tidak ada klub yang cocok dengan "${q}".</div>`;
    }

    results.innerHTML = html;

    results.querySelectorAll('.search-result-item').forEach((item) => {
      item.addEventListener('click', () => {
        const clubName = item.getAttribute('data-club');
        closeSearch();
        state.selectedClubFilter = clubName;
        state.selectedCompFilter = 'Grup A';
        const clubLabel = document.getElementById('selected-club-text');
        if (clubLabel) clubLabel.textContent = clubName;
        navigateTo(`fixtures?club=${encodeURIComponent(clubName)}`);
      });
    });
  });
}

// ==========================================================================
// NAVIGATION & VIEW SWITCHING
// ==========================================================================

export function switchView(viewName, shouldScroll = true) {
  state.currentView = viewName;

  // Update Main Navbar Pills
  document.querySelectorAll('.nav-item-pill').forEach((btn) => {
    const v = btn.getAttribute('data-view');
    if (v === viewName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update Mobile Bottom Nav Items
  document.querySelectorAll('.mobile-nav-item').forEach((btn) => {
    const v = btn.getAttribute('data-view');
    if (v === viewName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Hide all view sections
  document.querySelectorAll('.view-section').forEach((sec) => {
    sec.classList.remove('active');
  });

  // Show target section
  const targetSec = document.getElementById(`view-${viewName}`);
  if (targetSec) {
    targetSec.classList.add('active');
    if (shouldScroll) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Refresh view-specific renders if needed
  if (viewName === 'stats' && state.statsViewMode === 'overview') {
    renderStatsOverview();
  } else if (viewName === 'fixtures') {
    renderMatchweekCarousel();
  } else if (viewName === 'simulation') {
    renderSimFloatingSummaryBar();
  }

  // Show / hide simulator floating summary bar (mobile <= 768px only)
  const simFloatBar = document.getElementById('sim-floating-summary');
  if (simFloatBar) {
    const isMobile = window.innerWidth <= 768;
    simFloatBar.style.display = (isMobile && viewName === 'simulation') ? 'flex' : 'none';
  }
}

export function setupNavigation() {
  // Handle viewport resize for mobile-only floating bars
  window.addEventListener('resize', () => {
    const simFloatBar = document.getElementById('sim-floating-summary');
    if (simFloatBar) {
      const isMobile = window.innerWidth <= 768;
      simFloatBar.style.display = (isMobile && state.currentView === 'simulation') ? 'flex' : 'none';
    }
  });

  // Brand Logo to Home/Standings
  const brandHomeLink = document.getElementById('brand-home-link');
  if (brandHomeLink) {
    brandHomeLink.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('standings');
    });
  }

  // Main navigation pills (Standings, Fixtures, Stats, Simulation)
  document.querySelectorAll('.nav-item-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      if (['standings', 'fixtures', 'stats', 'simulation'].includes(view)) {
        navigateTo(view);
      }
    });
  });

  // Mobile bottom navigation items
  document.querySelectorAll('.mobile-nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      if (['standings', 'fixtures', 'stats', 'simulation'].includes(view)) {
        navigateTo(view);
      }
    });
  });

  // Mini category pills (Grup A, Grup B)
  document.querySelectorAll('.mini-pill[data-category]').forEach((pill) => {
    pill.addEventListener('click', () => {
      const cat = pill.getAttribute('data-category');
      switchGroup(cat);
    });
  });

  // Standings Group Select dropdown
  const groupSelect = document.getElementById('filter-group-select');
  if (groupSelect) {
    groupSelect.addEventListener('change', (e) => {
      switchGroup(e.target.value);
    });
  }

  // Stepper arrows for matchweeks
  const prevWeekBtn = document.getElementById('btn-prev-week');
  if (prevWeekBtn) {
    prevWeekBtn.addEventListener('click', () => {
      if (state.currentWeek > 1) {
        state.currentWeek--;
        state.selectedPeriod = 'single';
        syncMatchweekDropdownText();
        renderFixturesStream();
      }
    });
  }

  const nextWeekBtn = document.getElementById('btn-next-week');
  if (nextWeekBtn) {
    nextWeekBtn.addEventListener('click', () => {
      if (state.currentWeek < state.totalWeeks) {
        state.currentWeek++;
        state.selectedPeriod = 'single';
        syncMatchweekDropdownText();
        renderFixturesStream();
      }
    });
  }

  // Dropdown menus
  const periodBtn = document.getElementById('btn-period-dropdown');
  const periodMenu = document.getElementById('period-menu');
  const compBtn = document.getElementById('btn-competition-dropdown');
  const compMenu = document.getElementById('competition-menu');
  const clubsFilterBtn = document.getElementById('btn-clubs-filter');
  const clubsFilterMenu = document.getElementById('clubs-filter-menu');

  // Matchweek (Period) dropdown toggle
  if (periodBtn && periodMenu) {
    periodBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      periodMenu.classList.toggle('show');
      if (clubsFilterMenu) clubsFilterMenu.classList.remove('show');
    });
  }

  // Competition dropdown (Semua Grup, Grup A, Grup B)
  if (compBtn && compMenu) {
    compBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      compMenu.classList.toggle('show');
      if (periodMenu) periodMenu.classList.remove('show');
      if (clubsFilterMenu) clubsFilterMenu.classList.remove('show');
    });

    compMenu.querySelectorAll('.dropdown-opt').forEach((opt) => {
      opt.addEventListener('click', () => {
        const val = opt.getAttribute('data-comp');
        state.selectedCompFilter = val;
        document.getElementById('selected-competition-text').textContent = opt.textContent;
        compMenu.querySelectorAll('.dropdown-opt').forEach((o) => o.classList.remove('active'));
        opt.classList.add('active');
        compMenu.classList.remove('show');
        renderFixturesStream();
      });
    });
  }

  // Clubs filter dropdown toggle
  if (clubsFilterBtn && clubsFilterMenu) {
    clubsFilterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clubsFilterMenu.classList.toggle('show');
      if (periodMenu) periodMenu.classList.remove('show');
      if (compMenu) compMenu.classList.remove('show');
    });
  }

  // Drawer group buttons
  document.querySelectorAll('.drawer-group-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const grp = btn.getAttribute('data-group');
      switchGroup(grp);
    });
  });

  // Stats cards view: Header group toggle buttons (Grup A / Grup B)
  document.querySelectorAll('.stats-group-toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const grp = btn.getAttribute('data-stat-group');
      switchGroup(grp);
    });
  });

  // Stats cards view: Category filter pills
  document.querySelectorAll('.stats-cat-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      state.statsOverviewCategory = pill.getAttribute('data-category') || 'all';
      renderStatsOverview();
    });
  });

  // Stats detail view: Back to overview button
  const backToOverviewBtn = document.getElementById('btn-stat-back-overview');
  if (backToOverviewBtn) {
    backToOverviewBtn.addEventListener('click', () => {
      navigateTo('stats');
    });
  }

  // Stats detail view: Category dropdown
  const statCatBtn = document.getElementById('btn-stat-detail-cat');
  const statCatMenu = document.getElementById('stat-detail-cat-menu');
  const statTypeBtn = document.getElementById('btn-stat-detail-type');
  const statTypeMenu = document.getElementById('stat-detail-type-menu');
  const statClubBtn = document.getElementById('btn-stat-detail-club');
  const statClubMenu = document.getElementById('stat-detail-club-menu');

  if (statCatBtn && statCatMenu) {
    statCatBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      statCatMenu.classList.toggle('show');
      if (statTypeMenu) statTypeMenu.classList.remove('show');
      if (statClubMenu) statClubMenu.classList.remove('show');
    });

    statCatMenu.querySelectorAll('.dropdown-opt').forEach((opt) => {
      opt.addEventListener('click', () => {
        const val = opt.getAttribute('data-val');
        switchGroup(val);
        statCatMenu.querySelectorAll('.dropdown-opt').forEach((o) => o.classList.remove('active'));
        opt.classList.add('active');
        statCatMenu.classList.remove('show');
        renderStatsDetailView();
      });
    });
  }

  // Stats detail view: Stat type dropdown
  if (statTypeBtn && statTypeMenu) {
    statTypeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      statTypeMenu.classList.toggle('show');
      if (statCatMenu) statCatMenu.classList.remove('show');
      if (statClubMenu) statClubMenu.classList.remove('show');
    });

    statTypeMenu.querySelectorAll('.dropdown-opt').forEach((opt) => {
      opt.addEventListener('click', () => {
        const nextStat = opt.getAttribute('data-stat');
        statTypeMenu.querySelectorAll('.dropdown-opt').forEach((o) => o.classList.remove('active'));
        opt.classList.add('active');
        statTypeMenu.classList.remove('show');
        navigateTo(`stats/${nextStat}`);
      });
    });
  }

  // Stats detail view: Clubs dropdown toggle
  if (statClubBtn && statClubMenu) {
    statClubBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      statClubMenu.classList.toggle('show');
      if (statCatMenu) statCatMenu.classList.remove('show');
      if (statTypeMenu) statTypeMenu.classList.remove('show');
    });
  }

  // Close dropdowns when clicking outside
  document.addEventListener('click', () => {
    if (periodMenu) periodMenu.classList.remove('show');
    if (compMenu) compMenu.classList.remove('show');
    if (clubsFilterMenu) clubsFilterMenu.classList.remove('show');
    if (statCatMenu) statCatMenu.classList.remove('show');
    if (statTypeMenu) statTypeMenu.classList.remove('show');
    if (statClubMenu) statClubMenu.classList.remove('show');
  });

  // Click toast notification to dismiss immediately
  const toastEl = document.getElementById('toast');
  if (toastEl) {
    toastEl.addEventListener('click', () => {
      toastEl.classList.remove('show');
    });
  }

  // Mobile Gesture Navigation
  setupSmartEdgeSwipeNavigation();
  setupStandingsSubnavSwipe();
}

// ==========================================================================
// MOBILE INTERACTIVE GESTURES (BOTTOM SHEET & EDGE-SWIPE NAVIGATION)
// ==========================================================================

export function setupBottomSheetGestures(sheetBoxEl, backdropEl, onClose) {
  if (!sheetBoxEl || !backdropEl) return;

  let startY = 0;
  let currentY = 0;
  let isDragging = false;
  let startTimestamp = 0;

  const onTouchStart = (e) => {
    if (window.innerWidth > 768) return;
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    const target = touch.target;
    const scrollContainer = sheetBoxEl.querySelector('.match-detail-body, .disclaimer-modal-body, .r3-modal-body, .search-results-list, .info-modal-body');

    // Only allow swipe down if content is scrolled near top or touching header/handle
    const isAtTop = !scrollContainer || scrollContainer.scrollTop <= 2;
    const isHeaderOrHandle = !!target.closest('.bottom-sheet-drag-handle, .match-detail-header, .disclaimer-modal-header, .r3-modal-header, .info-modal-header');

    if (!isAtTop && !isHeaderOrHandle) return;

    startY = touch.clientY;
    currentY = startY;
    startTimestamp = Date.now();
    isDragging = true;
    sheetBoxEl.style.transition = 'none';
  };

  const onTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const deltaY = touch.clientY - startY;

    if (deltaY > 0) {
      currentY = touch.clientY;
      sheetBoxEl.style.transform = `translateY(${deltaY}px)`;
      const progress = Math.min(deltaY / 280, 0.75);
      backdropEl.style.opacity = `${1 - progress}`;
      if (e.cancelable) e.preventDefault();
    }
  };

  const onTouchEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    const deltaY = currentY - startY;
    const duration = Date.now() - startTimestamp;
    const velocity = deltaY / (duration || 1);

    sheetBoxEl.style.transition = 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)';
    backdropEl.style.transition = 'opacity 0.22s ease';

    if (deltaY > 75 || velocity > 0.45) {
      sheetBoxEl.style.transform = 'translateY(100%)';
      backdropEl.style.opacity = '0';
      setTimeout(() => {
        sheetBoxEl.style.transform = '';
        sheetBoxEl.style.transition = '';
        backdropEl.style.opacity = '';
        backdropEl.style.transition = '';
        if (typeof onClose === 'function') {
          onClose();
        }
      }, 200);
    } else {
      sheetBoxEl.style.transform = 'translateY(0)';
      backdropEl.style.opacity = '1';
      setTimeout(() => {
        sheetBoxEl.style.transform = '';
        sheetBoxEl.style.transition = '';
        backdropEl.style.opacity = '';
        backdropEl.style.transition = '';
      }, 220);
    }
  };

  sheetBoxEl.addEventListener('touchstart', onTouchStart, { passive: true });
  sheetBoxEl.addEventListener('touchmove', onTouchMove, { passive: false });
  sheetBoxEl.addEventListener('touchend', onTouchEnd, { passive: true });
  sheetBoxEl.addEventListener('touchcancel', onTouchEnd, { passive: true });
}

export function setupSmartEdgeSwipeNavigation() {
  const views = ['standings', 'fixtures', 'stats', 'simulation'];
  let touchStartX = 0;
  let touchStartY = 0;
  let isEdgeSwipe = false;

  window.addEventListener('touchstart', (e) => {
    if (window.innerWidth > 768) return;
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;

    const isLeftEdge = touchStartX <= 35;
    const isRightEdge = touchStartX >= (window.innerWidth - 35);

    // Prevent edge-swipe when touching inside horizontal scroll tables or charts or open modals
    const target = touch.target;
    const isInsideScrollable = target.closest('.standings-table-wrapper, .fixtures-matches-stream, .chart-canvas-wrap, .matchweek-carousel-container, .modal-backdrop, .r3-modal-backdrop, .disclaimer-modal-backdrop, .match-detail-backdrop');

    if ((isLeftEdge || isRightEdge) && !isInsideScrollable) {
      isEdgeSwipe = true;
    } else {
      isEdgeSwipe = false;
    }
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (!isEdgeSwipe) return;
    isEdgeSwipe = false;

    if (e.changedTouches.length !== 1) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 45) {
      const currentIdx = views.indexOf(state.currentView || 'standings');
      if (currentIdx !== -1) {
        if (deltaX < 0 && currentIdx < views.length - 1) {
          // Swipe Left -> Next view
          navigateTo(views[currentIdx + 1]);
        } else if (deltaX > 0 && currentIdx > 0) {
          // Swipe Right -> Prev view
          navigateTo(views[currentIdx - 1]);
        }
      }
    }
  }, { passive: true });
}

export function setupStandingsSubnavSwipe() {
  const subnavBar = document.querySelector('.standings-subnav-bar');
  const subviews = ['table', 'progression', 'psgc'];
  if (!subnavBar) return;

  let startX = 0;
  let startY = 0;

  subnavBar.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  subnavBar.addEventListener('touchend', (e) => {
    if (e.changedTouches.length !== 1) return;
    const deltaX = e.changedTouches[0].clientX - startX;
    const deltaY = e.changedTouches[0].clientY - startY;

    if (Math.abs(deltaX) > 40 && Math.abs(deltaY) < 30) {
      const activeBtn = subnavBar.querySelector('.subnav-pill-btn.active');
      const currentSub = activeBtn ? activeBtn.getAttribute('data-subview') : 'table';
      const curIdx = subviews.indexOf(currentSub);
      if (curIdx !== -1) {
        if (deltaX < 0 && curIdx < subviews.length - 1) {
          const nextBtn = subnavBar.querySelector(`[data-subview="${subviews[curIdx + 1]}"]`);
          if (nextBtn) nextBtn.click();
        } else if (deltaX > 0 && curIdx > 0) {
          const prevBtn = subnavBar.querySelector(`[data-subview="${subviews[curIdx - 1]}"]`);
          if (prevBtn) prevBtn.click();
        }
      }
    }
  }, { passive: true });
}

// ==========================================================================
// HAMBURGER SIDE DRAWER & REFRESH ACTIONS
// ==========================================================================

export function setupDrawer() {
  const openBtn = document.getElementById('btn-open-menu');
  const closeBtn = document.getElementById('btn-close-drawer');
  const drawer = document.getElementById('side-drawer');
  const backdrop = document.getElementById('drawer-backdrop');

  if (!openBtn || !drawer || !backdrop) return;

  const openDrawer = () => {
    syncDummyUI();
    drawer.classList.add('show');
    backdrop.classList.add('show');
  };

  const closeDrawer = () => {
    drawer.classList.remove('show');
    backdrop.classList.remove('show');
  };

  openBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);

  // Drawer quick links
  document.querySelectorAll('.drawer-link-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      navigateTo(view);
      closeDrawer();
    });
  });

  // Admin Logout Button
  const logoutBtn = document.getElementById('btn-admin-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('pc_admin_token');
      syncAdminUI();
      showToast('Admin Logout', 'Anda telah keluar dari mode admin.', '🔒', 2500);
    });
  }

  // Admin Prompt Button (Access via prompt dialog)
  const openPromptBtn = document.getElementById('btn-open-admin-prompt');
  if (openPromptBtn) {
    openPromptBtn.addEventListener('click', async () => {
      const token = prompt('Masukkan Secret Token Admin:');
      if (!token) return;
      try {
        const res = await fetch('/api/verify-admin', {
          headers: { 'x-admin-token': token.trim() },
        }).then((r) => r.json());

        if (res.success) {
          sessionStorage.setItem('pc_admin_token', token.trim());
          syncAdminUI();
          showToast('Admin Mode Aktif', 'Otentikasi berhasil. Menu pembaruan data telah dibuka.', '🔑', 3500);
        } else {
          showToast('Gagal', 'Token admin tidak valid.', '❌', 3500);
        }
      } catch (err) {
        showToast('Error', 'Gagal memverifikasi token: ' + err.message, '❌', 3500);
      }
    });
  }

  // Action: Sync Standings
  const syncStandingsBtn = document.getElementById('btn-sync-standings');
  if (syncStandingsBtn) {
    syncStandingsBtn.addEventListener('click', async () => {
      const token = getAdminToken();
      if (!token) {
        showToast('Akses Ditolak', 'Token otentikasi admin diperlukan.', '🔒', 3500);
        syncAdminUI();
        return;
      }

      closeDrawer();
      showToast('Sedang Memperbarui...', 'Mengunduh klasemen terbaru (Grup A & B) dari ileague.id...', '🔄', 0);

      try {
        const res = await fetch('/api/refresh-standings', {
          method: 'POST',
          headers: { 'x-admin-token': token },
        }).then((r) => r.json());

        if (res.success) {
          if (res.groups && res.groups.length > 0) {
            state.standingsGroups = res.groups;
          } else {
            try {
              const raw = await fetch('/klasemen.json?t=' + Date.now()).then((r) => r.json());
              if (Array.isArray(raw) && raw.length > 0) state.standingsGroups = raw;
            } catch (_) { }
          }
          if (!state.standingsGroups || state.standingsGroups.length === 0) {
            if (res.data) state.standingsGroups = [res.data];
          }
          state.standingsData =
            state.standingsGroups.find((g) => g.grup === state.selectedGroup) ||
            state.standingsGroups[0];
          state.dummyTesting.active = false;
          state.dummyTesting.simulatedThroughWeek = null;
          state.dummyTesting.officialSnapshot = null;
          refreshAllDataViews();
          const updatedStr = formatTimestamp(res.updatedAt);
          const updateLabel = document.getElementById('standings-updated-label');
          if (updateLabel) updateLabel.textContent = `${t('standings_updated_prefix')} ${updatedStr}`;
          const drawerLabel = document.getElementById('drawer-sync-timestamp');
          if (drawerLabel) drawerLabel.textContent = `${t('drawer_sync_prefix')} ${updatedStr}`;
          showToast('Sukses!', 'Data klasemen telah diperbarui.', '✅', 3500);
        } else {
          if (res.message && res.message.includes('Akses ditolak')) {
            sessionStorage.removeItem('pc_admin_token');
            syncAdminUI();
          }
          showToast('Gagal', res.message, '❌', 4000);
        }
      } catch (err) {
        showToast('Gagal', 'Terjadi kesalahan: ' + err.message, '❌', 4000);
      }
    });
  }

  // Action: Sync Fixtures
  const syncFixturesBtn = document.getElementById('btn-sync-fixtures');
  if (syncFixturesBtn) {
    syncFixturesBtn.addEventListener('click', async () => {
      const token = getAdminToken();
      if (!token) {
        showToast('Akses Ditolak', 'Token otentikasi admin diperlukan.', '🔒', 3500);
        syncAdminUI();
        return;
      }

      closeDrawer();
      showToast('Sedang Memindai Jadwal...', 'Proses ini memakan waktu ~10-15 detik...', '⏳', 0);

      try {
        const res = await fetch('/api/refresh-fixtures', {
          method: 'POST',
          headers: { 'x-admin-token': token },
        }).then((r) => r.json());

        if (res.success) {
          state.fixturesData = res.data;
          const nonEmpty = res.data.filter((w) => w.pertandingan && w.pertandingan.length > 0);
          state.totalWeeks = nonEmpty.length > 0 ? nonEmpty.length : res.data.length;
          state.dummyTesting.active = false;
          state.dummyTesting.simulatedThroughWeek = null;
          state.dummyTesting.officialSnapshot = null;
          refreshAllDataViews();
          const updatedStr = formatTimestamp(res.updatedAt);
          const drawerLabel = document.getElementById('drawer-sync-timestamp');
          if (drawerLabel) drawerLabel.textContent = `${t('drawer_sync_prefix')} ${updatedStr}`;
          showToast('Sukses!', 'Jadwal & hasil seluruh pekan berhasil diperbarui.', '✅', 4000);
        } else {
          if (res.message && res.message.includes('Akses ditolak')) {
            sessionStorage.removeItem('pc_admin_token');
            syncAdminUI();
          }
          showToast('Gagal', res.message, '❌', 4000);
        }
      } catch (err) {
        showToast('Gagal', 'Terjadi kesalahan: ' + err.message, '❌', 4000);
      }
    });
  }

  // Action: Dummy Weekly Update (+1 Week In-Memory)
  const dummyNextBtn = document.getElementById('btn-dummy-next-week');
  if (dummyNextBtn) {
    dummyNextBtn.addEventListener('click', () => {
      const token = getAdminToken();
      if (!token) {
        showToast('Akses Ditolak', 'Token otentikasi admin diperlukan.', '🔒', 3500);
        syncAdminUI();
        return;
      }
      const outcomeSelect = document.getElementById('dummy-psgc-outcome');
      const outcomeMode = outcomeSelect ? outcomeSelect.value : 'random';
      simulateNextDummyWeek(outcomeMode);
    });
  }

  // Action: Reset Dummy Data to Official Snapshot
  const dummyResetBtn = document.getElementById('btn-dummy-reset');
  if (dummyResetBtn) {
    dummyResetBtn.addEventListener('click', () => {
      resetDummyData();
    });
  }

  syncDummyUI();
}

// Close Broadcast Modal & Match Detail Modal
export function setupModals() {
  const broadcastBackdrop = document.getElementById('broadcast-modal-backdrop');
  const closeBroadcastBtn = document.getElementById('btn-close-broadcast');

  if (closeBroadcastBtn && broadcastBackdrop) {
    const closeBroadcast = () => broadcastBackdrop.classList.remove('show');
    closeBroadcastBtn.addEventListener('click', closeBroadcast);

    broadcastBackdrop.addEventListener('click', (e) => {
      if (e.target === broadcastBackdrop) closeBroadcast();
    });

    const broadcastBox = broadcastBackdrop.querySelector('.info-modal-box');
    if (broadcastBox) {
      setupBottomSheetGestures(broadcastBox, broadcastBackdrop, closeBroadcast);
    }
  }

  // Match Detail Modal / Bottom Sheet
  setupMatchDetailEvents();
  const matchDetailBox = document.getElementById('match-detail-box');
  const matchDetailBackdrop = document.getElementById('match-detail-backdrop');
  if (matchDetailBox && matchDetailBackdrop) {
    setupBottomSheetGestures(matchDetailBox, matchDetailBackdrop, closeMatchDetail);
  }

  // Putaran 3 Regulatory Modal / Bottom Sheet
  const r3ModalBox = document.querySelector('.r3-modal-box');
  const r3Backdrop = document.getElementById('r3-regulatory-modal-backdrop');
  if (r3ModalBox && r3Backdrop) {
    setupBottomSheetGestures(r3ModalBox, r3Backdrop, () => {
      r3Backdrop.classList.remove('show');
      r3Backdrop.style.display = 'none';
      document.body.style.overflow = '';
    });
  }
}

// ==========================================================================
// OPENING DISCLAIMER MODAL
// ==========================================================================

const DISCLAIMER_STORAGE_KEY = 'pc_disclaimer_accepted';
const DISCLAIMER_REOPEN_KEY = 'pc_reopen_disclaimer';

function isDisclaimerAccepted() {
  try {
    return localStorage.getItem(DISCLAIMER_STORAGE_KEY) === 'true';
  } catch (_) {
    return false;
  }
}

function markDisclaimerAccepted() {
  try {
    localStorage.setItem(DISCLAIMER_STORAGE_KEY, 'true');
  } catch (_) {
    // defensive fallback if localStorage is disabled
  }
}

export function setupDisclaimerModal() {
  const backdrop = document.getElementById('disclaimer-modal-backdrop');
  const acceptBtn = document.getElementById('btn-accept-disclaimer');
  const closeBtn = document.getElementById('btn-close-disclaimer');
  const footerNote = document.getElementById('disclaimer-footer-note');
  const openFooterBtn = document.getElementById('btn-open-disclaimer');
  const langSwitcher = document.getElementById('disclaimer-lang-switcher');

  if (!backdrop || !acceptBtn) return;

  const isLocked = () => backdrop.dataset.locked !== 'false';

  const openModal = ({ requireAcknowledge }) => {
    backdrop.dataset.locked = requireAcknowledge ? 'true' : 'false';
    if (closeBtn) closeBtn.hidden = requireAcknowledge;
    if (footerNote) {
      footerNote.textContent = t(requireAcknowledge ? 'disclaimer_footer_note' : 'disclaimer_footer_note_review');
    }
    acceptBtn.textContent = t(requireAcknowledge ? 'disclaimer_btn_accept' : 'disclaimer_btn_close');

    backdrop.classList.add('show');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => acceptBtn.focus());
  };

  const closeModal = (force = false) => {
    if (!force && isLocked()) return;
    backdrop.classList.remove('show');
    document.body.style.overflow = '';
  };

  acceptBtn.addEventListener('click', () => {
    if (isLocked()) markDisclaimerAccepted();
    closeModal(true);
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeModal(false));
  }

  const disclaimerBox = backdrop.querySelector('.disclaimer-modal-box');
  if (disclaimerBox) {
    setupBottomSheetGestures(disclaimerBox, backdrop, () => closeModal(false));
  }

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop.classList.contains('show')) {
      closeModal(false);
    }
  });

  if (openFooterBtn) {
    openFooterBtn.addEventListener('click', () => {
      openModal({ requireAcknowledge: false });
    });
  }

  if (langSwitcher) {
    langSwitcher.querySelectorAll('.lang-segment').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetLang = btn.dataset.lang;
        if (!targetLang || targetLang === getLanguage()) return;
        if (!isLocked()) {
          try {
            sessionStorage.setItem(DISCLAIMER_REOPEN_KEY, '1');
          } catch (_) {}
        }
        setLanguage(targetLang);
      });
    });
  }

  let shouldReopenReview = false;
  try {
    shouldReopenReview = sessionStorage.getItem(DISCLAIMER_REOPEN_KEY) === '1';
    if (shouldReopenReview) sessionStorage.removeItem(DISCLAIMER_REOPEN_KEY);
  } catch (_) {}

  if (shouldReopenReview) {
    openModal({ requireAcknowledge: false });
  } else if (!isDisclaimerAccepted()) {
    openModal({ requireAcknowledge: true });
  }
}

