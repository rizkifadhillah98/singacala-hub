// ==========================================================================
// UI MODULE - Search Modal, Drawer, Navigation, View Switching, Modals
// ==========================================================================

import { state } from './state.js';
import { navigateTo } from './router.js';
import { formatTimestamp, showToast, buildFormMap, matchClubs } from './utils.js';
import { t } from './i18n.js';
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
} from './fixtures.js';
import {
  renderStatsOverview,
  closeStatDetail,
  renderStatsDetailView,
} from './stats.js';

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
    results.innerHTML = `<div class="search-empty-prompt">Ketik nama klub atau stadion...</div>`;
  };

  const closeSearch = () => {
    modal.classList.remove('show');
  };

  openBtn.addEventListener('click', openSearch);
  if (closeBtn) closeBtn.addEventListener('click', closeSearch);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeSearch();
  });

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
      results.innerHTML = `<div class="search-empty-prompt">Ketik nama klub atau stadion...</div>`;
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
  }
}

export function setupNavigation() {
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

// Close Broadcast Modal
export function setupModals() {
  const broadcastBackdrop = document.getElementById('broadcast-modal-backdrop');
  const closeBroadcastBtn = document.getElementById('btn-close-broadcast');

  if (closeBroadcastBtn && broadcastBackdrop) {
    closeBroadcastBtn.addEventListener('click', () => {
      broadcastBackdrop.classList.remove('show');
    });

    broadcastBackdrop.addEventListener('click', (e) => {
      if (e.target === broadcastBackdrop) {
        broadcastBackdrop.classList.remove('show');
      }
    });
  }
}

