// ==========================================================================
// STATS MODULE - 11 J-League Style Metrics, Rankings & Detail View
// ==========================================================================

import { state } from './state.js';
import { matchClubs } from './utils.js';
import { navigateTo } from './router.js';
import { getLanguage, t } from './i18n.js';

// Calculate Clean Sheets for a given list of clubs from match fixtures
export function calculateCleanSheetsMap(clubs, fixtures) {
  const csMap = {};
  if (!clubs) return csMap;
  clubs.forEach((c) => (csMap[c.klub] = 0));

  if (!fixtures) return csMap;
  fixtures.forEach((w) => {
    if (!w.pertandingan) return;
    w.pertandingan.forEach((m) => {
      if (m.status === 'FT') {
        const homeScore = parseInt(m.skorHome, 10);
        const awayScore = parseInt(m.skorAway, 10);
        clubs.forEach((c) => {
          if (matchClubs(c.klub, m.timHome) && awayScore === 0) {
            csMap[c.klub]++;
          } else if (matchClubs(c.klub, m.timAway) && homeScore === 0) {
            csMap[c.klub]++;
          }
        });
      }
    });
  });
  return csMap;
}

// Calculate home and away performance records for clubs
export function calculateHomeAwayMap(clubs, fixtures) {
  const homeMap = {};
  const awayMap = {};
  clubs.forEach((c) => {
    homeMap[c.klub] = { p: 0, w: 0, d: 0, l: 0, pts: 0, gf: 0, ga: 0 };
    awayMap[c.klub] = { p: 0, w: 0, d: 0, l: 0, pts: 0, gf: 0, ga: 0 };
  });

  const allFT = fixtures
    .flatMap((w) => w.pertandingan || [])
    .filter((m) => m.grup === 'Grup A' && m.status === 'FT');

  allFT.forEach((m) => {
    const hTeam = clubs.find((c) => matchClubs(c.klub, m.timHome));
    const aTeam = clubs.find((c) => matchClubs(c.klub, m.timAway));
    if (hTeam && aTeam) {
      const h = parseInt(m.skorHome, 10);
      const a = parseInt(m.skorAway, 10);
      if (isNaN(h) || isNaN(a)) return;

      homeMap[hTeam.klub].p++;
      awayMap[aTeam.klub].p++;

      homeMap[hTeam.klub].gf += h;
      homeMap[hTeam.klub].ga += a;
      awayMap[aTeam.klub].gf += a;
      awayMap[aTeam.klub].ga += h;

      if (h > a) {
        homeMap[hTeam.klub].w++;
        homeMap[hTeam.klub].pts += 3;
        awayMap[aTeam.klub].l++;
      } else if (h === a) {
        homeMap[hTeam.klub].d++;
        homeMap[hTeam.klub].pts += 1;
        awayMap[aTeam.klub].d++;
        awayMap[aTeam.klub].pts += 1;
      } else {
        homeMap[hTeam.klub].l++;
        awayMap[aTeam.klub].w++;
        awayMap[aTeam.klub].pts += 3;
      }
    }
  });

  return { homeMap, awayMap };
}

// Compute all statistical rankings for the active group
export function getLeagueStatistics() {
  if (!state.standingsData || !state.standingsData.klasemen) return {};
  const clubs = state.standingsData.klasemen;
  const csMap = calculateCleanSheetsMap(clubs, state.fixturesData);
  const { homeMap, awayMap } = calculateHomeAwayMap(clubs, state.fixturesData);
  const lang = getLanguage();
  const getTitle = (key) => t('stat_' + key.replace(/-/g, '_'), {}, lang);

  const stats = {
    'points-per-game': {
      key: 'points-per-game',
      title: getTitle('points-per-game'),
      theme: 'yellow',
      category: 'performance',
      items: clubs
        .map((t) => ({
          klub: t.klub,
          logo: t.logo,
          value: t.main > 0 ? (t.poin / t.main).toFixed(2) : '0.00',
          numeric: t.main > 0 ? t.poin / t.main : 0,
        }))
        .sort((a, b) => b.numeric - a.numeric),
    },
    'win-rate': {
      key: 'win-rate',
      title: getTitle('win-rate'),
      theme: 'purple',
      category: 'performance',
      items: clubs
        .map((t) => ({
          klub: t.klub,
          logo: t.logo,
          value: t.main > 0 ? `${((t.menang / t.main) * 100).toFixed(1)}%` : '0.0%',
          numeric: t.main > 0 ? (t.menang / t.main) * 100 : 0,
        }))
        .sort((a, b) => b.numeric - a.numeric),
    },
    'unbeaten-rate': {
      key: 'unbeaten-rate',
      title: getTitle('unbeaten-rate'),
      theme: 'emerald',
      category: 'performance',
      items: clubs
        .map((t) => ({
          klub: t.klub,
          logo: t.logo,
          value: t.main > 0 ? `${(((t.menang + t.seri) / t.main) * 100).toFixed(1)}%` : '0.0%',
          numeric: t.main > 0 ? (t.menang + t.seri) / t.main : 0,
        }))
        .sort((a, b) => b.numeric - a.numeric),
    },
    'goal-diff': {
      key: 'goal-diff',
      title: getTitle('goal-diff'),
      theme: 'amber',
      category: 'attack',
      items: clubs
        .map((t) => ({
          klub: t.klub,
          logo: t.logo,
          value: t.gd > 0 ? `+${t.gd}` : `${t.gd}`,
          numeric: t.gd,
        }))
        .sort((a, b) => b.numeric - a.numeric),
    },
    'goals-per-game': {
      key: 'goals-per-game',
      title: getTitle('goals-per-game'),
      theme: 'blue',
      category: 'attack',
      items: clubs
        .map((t) => ({
          klub: t.klub,
          logo: t.logo,
          value: t.main > 0 ? (t.gf / t.main).toFixed(1) : '0.0',
          numeric: t.main > 0 ? t.gf / t.main : 0,
        }))
        .sort((a, b) => b.numeric - a.numeric),
    },
    'total-goals': {
      key: 'total-goals',
      title: getTitle('total-goals'),
      theme: 'coral',
      category: 'attack',
      items: clubs
        .map((t) => ({
          klub: t.klub,
          logo: t.logo,
          value: t.gf,
          numeric: t.gf,
        }))
        .sort((a, b) => b.numeric - a.numeric),
    },
    'clean-sheets': {
      key: 'clean-sheets',
      title: getTitle('clean-sheets'),
      theme: 'navy',
      category: 'defense',
      items: clubs
        .map((t) => ({
          klub: t.klub,
          logo: t.logo,
          value: csMap[t.klub] || 0,
          numeric: csMap[t.klub] || 0,
        }))
        .sort((a, b) => b.numeric - a.numeric),
    },
    'fewest-conceded': {
      key: 'fewest-conceded',
      title: getTitle('fewest-conceded'),
      theme: 'indigo',
      category: 'defense',
      items: clubs
        .map((t) => ({
          klub: t.klub,
          logo: t.logo,
          value: t.ga,
          numeric: t.ga,
        }))
        .sort((a, b) => a.numeric - b.numeric),
    },
    'goals-conceded-per-game': {
      key: 'goals-conceded-per-game',
      title: getTitle('goals-conceded-per-game'),
      theme: 'teal',
      category: 'defense',
      items: clubs
        .map((t) => ({
          klub: t.klub,
          logo: t.logo,
          value: t.main > 0 ? (t.ga / t.main).toFixed(2) : '0.00',
          numeric: t.main > 0 ? t.ga / t.main : 0,
        }))
        .sort((a, b) => a.numeric - b.numeric),
    },
    'home-record': {
      key: 'home-record',
      title: getTitle('home-record'),
      theme: 'blue',
      category: 'home-away',
      items: clubs
        .map((t) => {
          const rec = homeMap[t.klub] || { pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };
          return {
            klub: t.klub,
            logo: t.logo,
            heroValue: `${rec.pts} pts`,
            value: `${rec.pts} pts`,
            detailValue: `<span>${rec.pts} pts</span><span class="stat-rec-sub">(${rec.w}W-${rec.d}D-${rec.l}L)</span>`,
            numeric: rec.pts * 10000 + (rec.gf - rec.ga) * 100 + rec.gf,
          };
        })
        .sort((a, b) => b.numeric - a.numeric),
    },
    'away-record': {
      key: 'away-record',
      title: getTitle('away-record'),
      theme: 'purple',
      category: 'home-away',
      items: clubs
        .map((t) => {
          const rec = awayMap[t.klub] || { pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };
          return {
            klub: t.klub,
            logo: t.logo,
            heroValue: `${rec.pts} pts`,
            value: `${rec.pts} pts`,
            detailValue: `<span>${rec.pts} pts</span><span class="stat-rec-sub">(${rec.w}W-${rec.d}D-${rec.l}L)</span>`,
            numeric: rec.pts * 10000 + (rec.gf - rec.ga) * 100 + rec.gf,
          };
        })
        .sort((a, b) => b.numeric - a.numeric),
    },
  };

  // Assign ranks with ties handling
  Object.keys(stats).forEach((k) => {
    stats[k].items.forEach((item, idx) => {
      if (idx > 0 && item.numeric === stats[k].items[idx - 1].numeric) {
        item.rank = stats[k].items[idx - 1].rank;
      } else {
        item.rank = idx + 1;
      }
    });
  });

  return stats;
}

// SUB-VIEW 1: RENDER CARDS GRID
export function renderStatsOverview() {
  if (!state.standingsData || !state.standingsData.klasemen) return;

  const lang = getLanguage();
  const isEn = lang === 'en';

  const subtitle = document.getElementById('stats-subtitle');
  if (subtitle) {
    subtitle.textContent = t('stats_subtitle', {}, lang);
  }

  // Update Category pills text
  const catPills = document.querySelectorAll('#stats-category-pills .stats-cat-pill');
  if (catPills.length >= 5) {
    catPills[0].textContent = t('cat_all', {}, lang);
    catPills[1].textContent = t('cat_performance', {}, lang);
    catPills[2].textContent = t('cat_attack', {}, lang);
    catPills[3].textContent = t('cat_defense', {}, lang);
    catPills[4].textContent = t('cat_home_away', {}, lang);
  }

  // Update Stats group toggle buttons in header
  document.querySelectorAll('.stats-group-toggle-btn').forEach((btn) => {
    if (btn.getAttribute('data-stat-group') === state.selectedGroup) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  if (state.statsViewMode === 'detail') {
    renderStatsDetailView();
    return;
  }

  // Show Cards View, Hide Detail View
  const cardsView = document.getElementById('stats-cards-view');
  const detailView = document.getElementById('stats-detail-view');
  if (cardsView) cardsView.style.display = 'block';
  if (detailView) detailView.style.display = 'none';

  // Sync Category Pill buttons active state
  document.querySelectorAll('.stats-cat-pill').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-category') === (state.statsOverviewCategory || 'all'));
  });

  const allStats = getLeagueStatistics();
  const grid = document.getElementById('jleague-stats-grid');
  if (!grid) return;

  // Complete list of all 11 statistical cards
  const allCardList = [
    allStats['points-per-game'],
    allStats['win-rate'],
    allStats['unbeaten-rate'],
    allStats['goal-diff'],
    allStats['goals-per-game'],
    allStats['total-goals'],
    allStats['clean-sheets'],
    allStats['fewest-conceded'],
    allStats['home-record'],
    allStats['away-record'],
    allStats['goals-conceded-per-game'],
  ].filter(Boolean);

  let cardsToRender = allCardList;
  if (state.statsOverviewCategory && state.statsOverviewCategory !== 'all') {
    cardsToRender = allCardList.filter((card) => card.category === state.statsOverviewCategory);
  }

  grid.innerHTML = cardsToRender
    .map((card) => {
      if (!card || !card.items || card.items.length === 0) return '';
      const topTeam = card.items[0];
      const runnersUp = card.items.slice(1, 5); // Ranks 2 to 5
      const isYellow = card.theme === 'yellow';

      const runnersUpHtml = runnersUp
        .map(
          (tItem) => {
            const isPsgc = tItem.klub && tItem.klub.toLowerCase().includes('psgc');
            return `
          <tr class="${isPsgc ? 'psgc-row' : ''}">
            <td class="col-pos">${tItem.rank}</td>
            <td class="col-club">
              <div class="club-cell-mini">
                <img src="${tItem.logo}" alt="${tItem.klub}" class="club-emblem-sm" onerror="this.style.opacity='0.2'">
                <span class="club-name-text">${tItem.klub}</span>
              </div>
            </td>
            <td class="col-val">${tItem.value}</td>
          </tr>
        `;
          }
        )
        .join('');

      const isTopPsgc = topTeam.klub && topTeam.klub.toLowerCase().includes('psgc');

      return `
        <div class="stat-card-widget">
          <!-- Card Header (Title + View more button) -->
          <div class="stat-card-header">
            <h3 class="stat-card-title">${card.title}</h3>
            <button class="stat-view-more-btn" data-stat-key="${card.key}">View more &gt;&gt;</button>
          </div>

          <!-- Card Body -->
          <div class="stat-card-box">
            <!-- Hero Banner -->
            <div class="stat-hero-banner theme-${card.theme} ${isTopPsgc ? 'psgc-hero-banner' : ''}">
              <!-- Wave graphic overlay -->
              <svg class="banner-wave-svg" viewBox="0 0 400 180" preserveAspectRatio="none" aria-hidden="true">
                <path d="M 100 0 C 180 35, 260 90, 400 180 L 400 0 Z" fill="#ffffff" opacity="${isYellow ? '0.2' : '0.1'}"/>
                <path d="M 200 0 C 270 40, 330 90, 400 140 L 400 0 Z" fill="#ffffff" opacity="${isYellow ? '0.15' : '0.08'}"/>
              </svg>

              <!-- Top Row: Laurel Rank Badge & Metric Display -->
              <div class="banner-top-row">
                <div class="hero-rank-laurel-badge ${isYellow ? 'dark' : 'light'}">
                  <svg viewBox="0 0 32 32" class="laurel-wreath-svg">
                    <path d="M6 18 C5 14, 7 9, 11 6 C10 8, 9 12, 11 15 C8 15, 6 17, 6 18 Z" fill="currentColor"/>
                    <path d="M7 23 C6 20, 8 16, 12 14 C10 16, 10 19, 13 21 C10 22, 8 23, 7 23 Z" fill="currentColor"/>
                    <path d="M11 27 C9 25, 11 21, 15 20 C13 22, 14 25, 17 26 C14 27, 12 28, 11 27 Z" fill="currentColor"/>
                    <path d="M26 18 C27 14, 25 9, 21 6 C22 8, 23 12, 21 15 C24 15, 26 17, 26 18 Z" fill="currentColor"/>
                    <path d="M25 23 C26 20, 24 16, 20 14 C22 16, 22 19, 19 21 C22 22, 24 23, 25 23 Z" fill="currentColor"/>
                    <path d="M21 27 C23 25, 21 21, 17 20 C19 22, 18 25, 15 26 C18 27, 20 28, 21 27 Z" fill="currentColor"/>
                    <text x="16" y="21" font-size="13" font-weight="900" text-anchor="middle" fill="currentColor" font-family="'Plus Jakarta Sans', sans-serif">1</text>
                  </svg>
                </div>

                <div class="hero-metric-display">
                  <span class="hero-metric-label">${card.title}</span>
                  <span class="hero-metric-val">${topTeam.heroValue || topTeam.value}</span>
                </div>
              </div>

              <!-- Floating Team Emblem -->
              <img src="${topTeam.logo}" alt="${topTeam.klub}" class="hero-floating-emblem" onerror="this.style.opacity='0.2'">

              <!-- Bottom Row: Club Name -->
              <div class="banner-bottom-row">
                <h4 class="hero-club-name" title="${topTeam.klub}">${topTeam.klub}</h4>
              </div>
            </div>

            <!-- Mini Ranking Table -->
            <div class="stat-card-table-wrap">
              <table class="stat-card-mini-table">
                <thead>
                  <tr>
                    <th class="col-pos">${t('th_pos', {}, lang)}</th>
                    <th class="col-club">${isEn ? 'Clubs' : 'Klub'}</th>
                    <th class="col-val">${isEn ? 'Stats' : 'Statistik'}</th>
                  </tr>
                </thead>
                <tbody>
                  ${runnersUpHtml}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  // Wire View More buttons to switch to Detail View with URL hash
  grid.querySelectorAll('.stat-view-more-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const statKey = btn.getAttribute('data-stat-key');
      navigateTo(`stats/${statKey}`);
    });
  });
}

// Open Detail View for a stat
export function openStatDetail(statKey, shouldScroll = true) {
  state.statsViewMode = 'detail';
  if (statKey) state.activeStatDetailKey = statKey;

  const cardsView = document.getElementById('stats-cards-view');
  const detailView = document.getElementById('stats-detail-view');
  if (cardsView) cardsView.style.display = 'none';
  if (detailView) detailView.style.display = 'block';

  renderStatsDetailView();
  if (shouldScroll) {
    const statsSec = document.getElementById('view-stats');
    if (statsSec) {
      window.scrollTo({ top: statsSec.offsetTop - 30, behavior: 'smooth' });
    }
  }
}

// Close Detail View and return to Cards Overview
export function closeStatDetail() {
  state.statsViewMode = 'overview';
  state.statDetailClubFilter = 'all';

  const cardsView = document.getElementById('stats-cards-view');
  const detailView = document.getElementById('stats-detail-view');
  if (cardsView) cardsView.style.display = 'block';
  if (detailView) detailView.style.display = 'none';

  renderStatsOverview();
}

// SUB-VIEW 2: RENDER DETAILED STAT VIEW
export function renderStatsDetailView() {
  const lang = getLanguage();
  const isEn = lang === 'en';
  const allStats = getLeagueStatistics();
  const currentStat = allStats[state.activeStatDetailKey] || allStats['clean-sheets'];

  // Update Detail Heading
  const heading = document.getElementById('stat-detail-heading');
  if (heading) heading.textContent = currentStat.title;

  // Update Filter button texts
  const catText = document.getElementById('stat-detail-cat-text');
  if (catText) catText.textContent = state.selectedGroup;

  const typeText = document.getElementById('stat-detail-type-text');
  if (typeText) typeText.textContent = currentStat.title;

  const clubText = document.getElementById('stat-detail-club-text');
  if (clubText) {
    clubText.textContent = state.statDetailClubFilter === 'all'
      ? (isEn ? 'All Clubs' : 'Semua Klub')
      : state.statDetailClubFilter;
  }

  // Update type menu labels
  const typeMenu = document.getElementById('stat-detail-type-menu');
  if (typeMenu) {
    typeMenu.querySelectorAll('.dropdown-opt').forEach((opt) => {
      const sKey = opt.getAttribute('data-stat');
      if (allStats[sKey]) {
        opt.textContent = allStats[sKey].title;
      }
      opt.classList.toggle('active', sKey === state.activeStatDetailKey);
    });
  }

  // Sync active states in category dropdowns
  const catMenu = document.getElementById('stat-detail-cat-menu');
  if (catMenu) {
    catMenu.querySelectorAll('.dropdown-opt').forEach((opt) => {
      opt.classList.toggle('active', opt.getAttribute('data-val') === state.selectedGroup);
    });
  }

  // Populate Clubs dropdown menu in Detail View
  const clubMenu = document.getElementById('stat-detail-club-menu');
  if (clubMenu && state.standingsData && state.standingsData.klasemen) {
    const clubs = state.standingsData.klasemen.map((t) => t.klub);
    clubMenu.innerHTML = `
      <button class="dropdown-opt ${state.statDetailClubFilter === 'all' ? 'active' : ''}" data-club="all">${isEn ? 'All Clubs' : 'Semua Klub'}</button>
      ${clubs
        .map(
          (c) => `
          <button class="dropdown-opt ${state.statDetailClubFilter === c ? 'active' : ''}" data-club="${c}">${c}</button>
        `
        )
        .join('')}
    `;

    clubMenu.querySelectorAll('.dropdown-opt').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.statDetailClubFilter = btn.getAttribute('data-club');
        clubMenu.classList.remove('show');
        renderStatsDetailView();
      });
    });
  }

  // Filter items if a specific club is selected
  let items = [...currentStat.items];
  if (state.statDetailClubFilter !== 'all') {
    items = items.filter((it) => matchClubs(it.klub, state.statDetailClubFilter));
  }

  // Render Table Body
  const tbody = document.getElementById('stat-detail-table-body');
  if (!tbody) return;

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="loading-cell">${isEn ? 'No data for this club.' : 'Tidak ada data untuk klub ini.'}</td></tr>`;
    return;
  }

  tbody.innerHTML = items
    .map((team) => {
      let badgeHtml = '';
      if (team.rank === 1) {
        badgeHtml = `
          <div class="stat-medal medal-gold" title="Peringkat 1">
            <svg viewBox="0 0 24 24" style="width: 20px; height: 20px;" fill="currentColor">
              <path d="M6 18 C5 14, 7 9, 11 6 C10 8, 9 12, 11 15 C8 15, 6 17, 6 18 Z"/>
              <path d="M18 18 C19 14, 17 9, 13 6 C14 8, 15 12, 13 15 C16 15, 18 17, 18 18 Z"/>
              <text x="12" y="17" font-size="12" font-weight="900" text-anchor="middle" fill="currentColor">1</text>
            </svg>
          </div>
        `;
      } else if (team.rank === 2) {
        badgeHtml = `<div class="stat-medal medal-silver" title="Peringkat 2">2</div>`;
      } else if (team.rank === 3) {
        badgeHtml = `<div class="stat-medal medal-bronze" title="Peringkat 3">3</div>`;
      } else {
        badgeHtml = `<span class="stat-normal-rank">${team.rank}</span>`;
      }

      const isPsgc = team.klub && team.klub.toLowerCase().includes('psgc');

      return `
        <tr class="${isPsgc ? 'psgc-row' : ''}">
          <td class="col-pos-detail">
            ${badgeHtml}
          </td>
          <td class="col-club-detail">
            <div class="club-cell-detail">
              <img src="${team.logo}" alt="${team.klub}" class="club-emblem-detail" onerror="this.style.opacity='0.2'">
              <span class="club-name-detail">${team.klub}</span>
            </div>
          </td>
          <td class="col-stat-detail">
            <span class="stat-val-detail">${team.detailValue || team.value}</span>
          </td>
        </tr>
      `;
    })
    .join('');
}

