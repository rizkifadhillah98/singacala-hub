// ==========================================================================
// FIXTURES MODULE - Matchweeks, Fixtures Stream, Filter Dropdowns
// ==========================================================================

import { state } from './state.js';
import { matchClubs } from './utils.js';
import { getLanguage, t, formatMatchDate } from './i18n.js';

export function renderFixturesStream() {
  const container = document.getElementById('fixtures-matches-stream');
  const dateRangeLabel = document.getElementById('date-range-label');
  const lang = getLanguage();
  const isEn = lang === 'en';

  if (!container) return;

  if (!state.fixturesData || state.fixturesData.length === 0) {
    container.innerHTML = `<div class="search-empty-prompt">${isEn ? 'Fixtures schedule not available yet.' : 'Jadwal pertandingan belum tersedia.'}</div>`;
    return;
  }

  // Determine which weeks to show based on Matchweek filter
  let weeksToShow = [];
  if (state.selectedPeriod === 'all') {
    weeksToShow = [...state.fixturesData];
  } else {
    const singleWeek = state.fixturesData.find((w) => w.pekan === state.currentWeek);
    if (singleWeek) weeksToShow.push(singleWeek);
  }

  // Extract all matches and apply club filter
  let allMatches = [];
  weeksToShow.forEach((w) => {
    if (w.pertandingan) {
      w.pertandingan.forEach((m) => {
        allMatches.push({ ...m, weekNum: w.pekan });
      });
    }
  });

  // Filter solely to Grup A matches
  allMatches = allMatches.filter((m) => m.grup === 'Grup A');

  if (state.selectedClubFilter !== 'all') {
    allMatches = allMatches.filter(
      (m) =>
        matchClubs(m.timHome, state.selectedClubFilter) ||
        matchClubs(m.timAway, state.selectedClubFilter)
    );
  }

  // Compute Matchweek label for dateRangeLabel
  if (dateRangeLabel) {
    if (state.selectedPeriod === 'all') {
      dateRangeLabel.textContent = isEn
        ? `All Matchweeks (1–${state.totalWeeks})`
        : `Semua Pekan (1–${state.totalWeeks})`;
    } else {
      dateRangeLabel.textContent = isEn
        ? `Matchweek ${state.currentWeek}`
        : `Pekan ${state.currentWeek}`;
    }
  }

  if (allMatches.length === 0) {
    container.innerHTML = `
      <div class="search-empty-prompt">
        <p style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 6px;">${isEn ? 'No Matches Found' : 'Tidak Ada Pertandingan Ditemukan'}</p>
        <p>${isEn ? 'No matches found for the selected matchweek and club filter.' : 'Tidak ada laga untuk filter pekan dan klub yang dipilih.'}</p>
      </div>
    `;
    return;
  }

  // Render matches list
  const html = `
    <div class="match-cards-list">
      ${allMatches
      .map((m) => {
        const isFinished = m.status === 'FT';
        const tbdLabel = isEn ? 'TBD' : 'Jadwal Menyusul';
        const timeStr = m.waktu
          ? `${m.waktu} WIB KO`
          : (isFinished ? '15:30 WIB KO' : tbdLabel);

        const formattedDate = formatMatchDate(m.tanggal, lang);
        const scheduleLabel = formattedDate
          ? (timeStr === tbdLabel ? `${formattedDate} - ${tbdLabel}` : `${formattedDate} - ${timeStr}`)
          : timeStr;

        const scoreCenterHtml = isFinished
          ? `
              <div class="match-score-center">
                <span class="score-digit">${m.skorHome}</span>
                <span class="match-status-label">${isEn ? 'FT' : 'SELESAI'}</span>
                <span class="score-digit">${m.skorAway}</span>
              </div>
            `
          : `
              <div class="match-score-center">
                <span class="match-vs-label">VS</span>
              </div>
            `;

        const stadiumName = m.stadion ? m.stadion.toUpperCase() : 'STADION UTAMA';
        const isPsgcMatch =
          (m.timHome && m.timHome.toLowerCase().includes('psgc')) ||
          (m.timAway && m.timAway.toLowerCase().includes('psgc'));

        return `
            <div class="match-card-row ${isPsgcMatch ? 'psgc-match match-psgc' : ''}" data-home="${m.timHome}" data-away="${m.timAway}">
              <div class="match-ko-time">${scheduleLabel}</div>
              <div class="match-teams-score-line">
                <!-- Home Team -->
                <div class="team-side home">
                  <span class="match-team-name">${m.timHome}</span>
                  <img src="${m.logoHome}" alt="${m.timHome}" class="match-team-logo" loading="lazy" onerror="this.style.opacity='0.2'">
                </div>

                <!-- Score Center -->
                ${scoreCenterHtml}

                <!-- Away Team -->
                <div class="team-side away">
                  <img src="${m.logoAway}" alt="${m.timAway}" class="match-team-logo" loading="lazy" onerror="this.style.opacity='0.2'">
                  <span class="match-team-name">${m.timAway}</span>
                </div>
              </div>
              <div class="match-stadium-name">${stadiumName}</div>
            </div>
          `;
      })
      .join('')}
    </div>
  `;

  container.innerHTML = html;
}

// Populate Matchweeks Filter Dropdown
export function populateMatchweeksFilterMenu() {
  const menu = document.getElementById('period-menu');
  if (!menu) return;

  const isEn = getLanguage() === 'en';
  const total = state.totalWeeks || 18;
  let html = `
    <button class="dropdown-opt ${state.selectedPeriod === 'all' ? 'active' : ''}" data-week="all">${isEn ? 'All Matchweeks' : 'Semua Pekan'}</button>
  `;
  for (let w = 1; w <= total; w++) {
    html += `
      <button class="dropdown-opt ${state.selectedPeriod !== 'all' && state.currentWeek === w ? 'active' : ''}" data-week="${w}">${isEn ? `Matchweek ${w}` : `Pekan ${w}`}</button>
    `;
  }
  menu.innerHTML = html;

  menu.querySelectorAll('.dropdown-opt').forEach((opt) => {
    opt.addEventListener('click', () => {
      const val = opt.getAttribute('data-week');
      if (val === 'all') {
        state.selectedPeriod = 'all';
      } else {
        state.selectedPeriod = 'single';
        state.currentWeek = parseInt(val, 10);
      }
      syncMatchweekDropdownText();
      menu.classList.remove('show');
      renderFixturesStream();
    });
  });
}

export function syncMatchweekDropdownText() {
  const isEn = getLanguage() === 'en';
  const label = document.getElementById('selected-period-text');
  if (label) {
    label.textContent = state.selectedPeriod === 'all'
      ? (isEn ? 'All Matchweeks' : 'Semua Pekan')
      : (isEn ? `Matchweek ${state.currentWeek}` : `Pekan ${state.currentWeek}`);
  }
  const menu = document.getElementById('period-menu');
  if (menu) {
    menu.querySelectorAll('.dropdown-opt').forEach((opt) => {
      const val = opt.getAttribute('data-week');
      if (state.selectedPeriod === 'all') {
        opt.classList.toggle('active', val === 'all');
      } else {
        opt.classList.toggle('active', parseInt(val, 10) === state.currentWeek);
      }
    });
  }
}

// Populate Clubs Filter Dropdown
export function populateClubsFilterMenu() {
  const menu = document.getElementById('clubs-filter-menu');
  if (!menu || !state.standingsData || !state.standingsData.klasemen) return;

  const isEn = getLanguage() === 'en';
  const clubs = state.standingsData.klasemen.map((t) => t.klub).sort();

  const selectedClubText = document.getElementById('selected-club-text');
  if (selectedClubText && state.selectedClubFilter === 'all') {
    selectedClubText.textContent = isEn ? 'All Clubs' : 'Semua Klub';
  }

  menu.innerHTML = `
    <button class="dropdown-opt ${state.selectedClubFilter === 'all' ? 'active' : ''}" data-club="all">${isEn ? 'All Clubs (Group A)' : 'Semua Klub (Grup A)'}</button>
    ${clubs
      .map(
        (c) => `
        <button class="dropdown-opt ${state.selectedClubFilter === c ? 'active' : ''}" data-club="${c}">${c}</button>
      `
      )
      .join('')}
  `;

  menu.querySelectorAll('.dropdown-opt').forEach((btn) => {
    btn.addEventListener('click', () => {
      const club = btn.getAttribute('data-club');
      state.selectedClubFilter = club;
      document.getElementById('selected-club-text').textContent =
        club === 'all' ? (isEn ? 'All Clubs' : 'Semua Klub') : club;
      menu.querySelectorAll('.dropdown-opt').forEach((o) => o.classList.remove('active'));
      btn.classList.add('active');
      menu.classList.remove('show');
      renderFixturesStream();
    });
  });
}

