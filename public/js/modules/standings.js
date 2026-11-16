// ==========================================================================
// STANDINGS MODULE - Table, Ranks, Sorting, Form Indicators
// ==========================================================================

import { state } from './state.js';
import { buildFormMap, showToast } from './utils.js';
import { renderStatsOverview } from './stats.js';
import { populateClubsFilterMenu } from './fixtures.js';
import { renderProgressionChart, initProgressionTabs } from './progression-chart.js';
import { renderPsgcOddsPanel, calculatePsgcOdds } from './psgc-odds.js';
import { getLanguage, t } from './i18n.js';

export { initProgressionTabs, renderProgressionChart, renderPsgcOddsPanel, calculatePsgcOdds };

// Predefined rank trends to match screenshot realism (▲ up, ▼ down, neutral)
const rankTrends = {
  1: 'neutral',
  2: 'up',
  3: 'down',
  4: 'down',
  5: 'neutral',
  6: 'up',
  7: 'down',
  8: 'up',
  9: 'down',
  10: 'neutral',
};

export function updateStandingsHeaders() {
  const isEn = getLanguage() === 'en';
  const table = document.getElementById('standings-table');
  if (!table) return;

  const thClub = table.querySelector('.col-club');
  const thPts = table.querySelector('[data-sort="poin"]');
  const thMain = table.querySelector('[data-sort="main"]');
  const thMenang = table.querySelector('[data-sort="menang"]');
  const thSeri = table.querySelector('[data-sort="seri"]');
  const thKalah = table.querySelector('[data-sort="kalah"]');
  const thGf = table.querySelector('[data-sort="gf"]');
  const thGa = table.querySelector('[data-sort="ga"]');
  const thGd = table.querySelector('[data-sort="gd"]');
  const thForm = table.querySelector('.col-form');

  if (thClub) thClub.innerHTML = `${isEn ? 'Club' : 'Klub'} <span class="sort-arrows">⇅</span>`;
  if (thPts) thPts.innerHTML = `${isEn ? 'Pts' : 'Poin'} <span class="sort-arrows">⇅</span>`;
  if (thMain) thMain.innerHTML = `${isEn ? 'P' : 'Main'} <span class="sort-arrows">⇅</span>`;
  if (thMenang) thMenang.innerHTML = `${isEn ? 'W' : 'M'} <span class="sort-arrows">⇅</span>`;
  if (thSeri) thSeri.innerHTML = `${isEn ? 'D' : 'S'} <span class="sort-arrows">⇅</span>`;
  if (thKalah) thKalah.innerHTML = `${isEn ? 'L' : 'K'} <span class="sort-arrows">⇅</span>`;
  if (thGf) thGf.innerHTML = `${isEn ? 'GF' : 'GM'} <span class="sort-arrows">⇅</span>`;
  if (thGa) thGa.innerHTML = `${isEn ? 'GA' : 'GK'} <span class="sort-arrows">⇅</span>`;
  if (thGd) thGd.innerHTML = `${isEn ? 'GD' : 'SG'} <span class="sort-arrows">⇅</span>`;
  if (thForm) thForm.textContent = isEn ? 'Last 5' : '5 Laga Terakhir';
}

export function updateStandingsLegends() {
  const isEn = getLanguage() === 'en';
  const legends = document.querySelectorAll('.standings-legend-footer');
  legends.forEach((legend) => {
    const items = legend.querySelectorAll('.legend-item span:not(.legend-color-indicator)');
    if (items.length >= 4) {
      if (legend.classList.contains('sim-legend')) {
        items[0].textContent = isEn ? 'Grand Final & Automatic Promotion (P1)' : 'Grand Final & Promosi Otomatis (P1)';
        items[1].textContent = isEn ? 'Promotion Play-off (P2)' : 'Play-off Promosi (P2)';
        items[2].textContent = isEn ? 'Relegation Play-off (P9)' : 'Play-off Degradasi (P9)';
        items[3].textContent = isEn ? 'Direct Relegation (P10)' : 'Degradasi Langsung (P10)';
      } else {
        items[0].textContent = isEn ? 'Grand Final & Automatic Promotion (Rank 1)' : 'Grand Final & Promosi Otomatis (Peringkat 1)';
        items[1].textContent = isEn ? 'Promotion Play-off (Rank 2)' : 'Play-off Promosi (Peringkat 2)';
        items[2].textContent = isEn ? 'Relegation Play-off (Rank 9)' : 'Play-off Degradasi (Peringkat 9)';
        items[3].textContent = isEn ? 'Direct Relegation (Rank 10)' : 'Degradasi Langsung (Peringkat 10)';
      }
    }
  });
}

export function renderStandingsTable() {
  const tbody = document.getElementById('standings-table-body');
  if (!tbody) return;

  const isEn = getLanguage() === 'en';
  updateStandingsHeaders();
  updateStandingsLegends();

  if (!state.standingsData || !state.standingsData.klasemen) {
    tbody.innerHTML = `<tr><td colspan="11" class="loading-cell">${isEn ? 'Standings data unavailable.' : 'Data klasemen tidak tersedia.'}</td></tr>`;
    return;
  }

  let list = [...state.standingsData.klasemen];

  // Sorting
  const key = state.sortStandingsCol;
  const asc = state.sortStandingsAsc;
  list.sort((a, b) => {
    let valA = a[key];
    let valB = b[key];
    if (typeof valA === 'string') {
      return asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return asc ? valA - valB : valB - valA;
  });

  tbody.innerHTML = list
    .map((team, index) => {
      const pos = team.posisi || index + 1;

      // Indicator bar on left edge & status tooltip sesuai Regulasi Liga 2 2026/27
      let rowClass = '';
      let rankTitle = '';
      if (pos === 1) {
        rowClass = 'rank-grandfinal'; // Solid green: Grand Final & Promosi Otomatis
        rankTitle = isEn
          ? 'Rank 1: Grand Final & Automatic Promotion to BRI Super League'
          : 'Peringkat 1: Babak Grand Final & Promosi Otomatis ke BRI Super League';
      } else if (pos === 2) {
        rowClass = 'rank-playoff-promosi'; // Dashed blue: Play-off Promosi
        rankTitle = isEn
          ? 'Rank 2: Promotion Play-off to BRI Super League'
          : 'Peringkat 2: Babak Play-off Promosi ke BRI Super League';
      } else if (pos === 9) {
        rowClass = 'rank-playoff-degradasi'; // Dashed red: Play-off Degradasi
        rankTitle = isEn
          ? 'Rank 9: Relegation Play-off to Liga Nusantara'
          : 'Peringkat 9: Babak Play-off Degradasi ke Liga Nusantara';
      } else if (pos === 10) {
        rowClass = 'rank-relegation'; // Solid red: Degradasi Langsung
        rankTitle = isEn
          ? 'Rank 10: Direct Relegation to Liga Nusantara'
          : 'Peringkat 10: Degradasi Langsung ke Liga Nusantara';
      } else {
        rankTitle = isEn
          ? `Rank ${pos}: Remains in Liga 2`
          : `Peringkat ${pos}: Bertahan di Liga 2`;
      }

      // Rank trend icon
      const trend = rankTrends[pos] || 'neutral';
      let trendIcon = '';
      if (trend === 'up') {
        trendIcon = `<span class="rank-trend-icon up" title="${isEn ? 'Rank up' : 'Naik peringkat'}">▲</span>`;
      } else if (trend === 'down') {
        trendIcon = `<span class="rank-trend-icon down" title="${isEn ? 'Rank down' : 'Turun peringkat'}">▼</span>`;
      } else {
        trendIcon = `<span class="rank-trend-icon neutral"></span>`;
      }

      // Penalty badge
      const penaltyBadge =
        team.catatanPenalti < 0
          ? `<span class="penalty-tag" title="${isEn ? `Penalty deduction of ${Math.abs(team.catatanPenalti)} points` : `Sanksi pengurangan ${Math.abs(team.catatanPenalti)} poin`}">${team.catatanPenalti}</span>`
          : '';

      // Last 5 matches Form
      const history = state.teamsFormMap[team.klub] || [];
      const last5 = history.slice(-5);

      let formBadgesHtml = '';
      if (last5.length > 0) {
        formBadgesHtml = last5
          .map((m, mIdx) => {
            const isLatest = mIdx === last5.length - 1;
            const resClass = m.result.toLowerCase();
            return `
              <span class="form-circle ${resClass} ${isLatest ? 'latest' : ''}" 
                    title="${isEn ? `Matchweek ${m.pekan}: vs ${m.opponent} (${m.score})` : `Pekan ${m.pekan}: vs ${m.opponent} (${m.score})`}">
                ${m.result}
              </span>
            `;
          })
          .join('');
      } else {
        formBadgesHtml = `<span style="color: var(--text-dim); font-size: 12px;">-</span>`;
      }

      const gdSign = team.gd > 0 ? `+${team.gd}` : team.gd;
      const isPsgc = team.klub && team.klub.toLowerCase().includes('psgc');

      return `
        <tr class="${rowClass} ${isPsgc ? 'psgc-row' : ''}" title="${rankTitle}" data-club="${team.klub}">
          <td class="col-pos">
            <div class="pos-cell-wrap" title="${rankTitle}">
              <span class="rank-number">${pos}</span>
              ${trendIcon}
            </div>
          </td>
          <td class="col-club">
            <div class="club-cell-wrap">
              <img src="${team.logo}" alt="${team.klub}" class="club-emblem" loading="lazy" onerror="this.style.opacity='0.2'">
              <span class="club-title">${team.klub}</span>
              ${penaltyBadge}
            </div>
          </td>
          <td class="col-stat pts-highlight">${team.poin}</td>
          <td class="col-stat">${team.main}</td>
          <td class="col-stat">${team.menang}</td>
          <td class="col-stat">${team.seri}</td>
          <td class="col-stat">${team.kalah}</td>
          <td class="col-stat">${team.gf}</td>
          <td class="col-stat">${team.ga}</td>
          <td class="col-stat">${gdSign}</td>
          <td class="col-form">
            <div class="form-badges-wrap">
              ${formBadgesHtml}
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

// Standings Table Sorting Handler
export function setupTableSorting() {
  document.querySelectorAll('.standings-table th.sortable').forEach((th) => {
    th.addEventListener('click', () => {
      const col = th.getAttribute('data-sort');
      if (state.sortStandingsCol === col) {
        state.sortStandingsAsc = !state.sortStandingsAsc;
      } else {
        state.sortStandingsCol = col;
        state.sortStandingsAsc = col === 'klub' ? true : false; // Default desc for stats
      }
      renderStandingsTable();
    });
  });
}

// Switch between Grup A and Grup B
export function switchGroup(groupName) {
  if (!state.standingsGroups || state.standingsGroups.length === 0) return;
  const target =
    state.standingsGroups.find((g) => g.grup.toLowerCase() === groupName.toLowerCase()) ||
    state.standingsGroups[0];
  if (!target) return;

  state.selectedGroup = target.grup;
  state.standingsData = target;

  // Sync Mini category pills
  document.querySelectorAll('.mini-pill[data-category]').forEach((pill) => {
    if (pill.getAttribute('data-category').toLowerCase() === target.grup.toLowerCase()) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  // Sync Standings Group Select dropdown
  const groupSelect = document.getElementById('filter-group-select');
  if (groupSelect && groupSelect.value !== target.grup) {
    groupSelect.value = target.grup;
  }

  // Sync Drawer group buttons
  document.querySelectorAll('.drawer-group-btn').forEach((btn) => {
    if (btn.getAttribute('data-group').toLowerCase() === target.grup.toLowerCase()) {
      btn.classList.add('active');
      btn.style.background = '#e11d48';
      btn.style.color = '#ffffff';
    } else {
      btn.classList.remove('active');
      btn.style.background = 'transparent';
      btn.style.color = 'var(--text-white)';
    }
  });

  // Re-build form map and update views
  state.teamsFormMap = buildFormMap(state.standingsData.klasemen, state.fixturesData);
  renderStandingsTable();
  renderProgressionChart();
  renderPsgcOddsPanel();
  renderStatsOverview();
  populateClubsFilterMenu();

  showToast('Kategori Grup', `Menampilkan ${target.grup} (${target.totalTim} Klub)`, '🏆', 2500);
}

