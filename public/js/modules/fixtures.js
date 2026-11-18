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
    renderMatchweekCarousel();
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
    renderMatchweekCarousel();
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
            <div class="match-card-row ${isPsgcMatch ? 'psgc-match match-psgc' : ''}" data-home="${m.timHome}" data-away="${m.timAway}" role="button" tabindex="0" aria-label="${m.timHome} vs ${m.timAway}">
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

  // Attach click listener to each match card to open Match Detail Bottom Sheet
  container.querySelectorAll('.match-card-row').forEach((card, idx) => {
    const matchData = allMatches[idx];
    if (matchData) {
      card.addEventListener('click', () => {
        openMatchDetail(matchData);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openMatchDetail(matchData);
        }
      });
    }
  });

  renderMatchweekCarousel();
}

// Swipeable Matchweek Carousel (Pekan 1–27)
export function renderMatchweekCarousel() {
  const track = document.getElementById('matchweek-carousel-track');
  if (!track) return;

  const total = state.totalWeeks || 18;
  const isAll = state.selectedPeriod === 'all';
  const lang = getLanguage();

  let html = `
    <button type="button" class="matchweek-carousel-chip ${isAll ? 'active' : ''}" data-week="all" role="tab" aria-selected="${isAll}">
      ${t('carousel_all', {}, lang)}
    </button>
  `;

  for (let w = 1; w <= total; w++) {
    const isActive = !isAll && state.currentWeek === w;
    html += `
      <button type="button" class="matchweek-carousel-chip ${isActive ? 'active' : ''}" data-week="${w}" role="tab" aria-selected="${isActive}">
        ${t('carousel_week', { week: w }, lang)}
      </button>
    `;
  }

  track.innerHTML = html;

  track.querySelectorAll('.matchweek-carousel-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const val = chip.getAttribute('data-week');
      if (val === 'all') {
        state.selectedPeriod = 'all';
      } else {
        state.selectedPeriod = 'single';
        state.currentWeek = parseInt(val, 10);
      }
      syncMatchweekDropdownText();
      renderFixturesStream();
    });
  });

  // Smooth auto-centering of active chip
  const activeChip = track.querySelector('.matchweek-carousel-chip.active');
  if (activeChip) {
    try {
      activeChip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    } catch (_) {
      // fallback for older browsers
    }
  }
}

// Match Detail Bottom Sheet / Modal
export function openMatchDetail(match) {
  const backdrop = document.getElementById('match-detail-backdrop');
  const body = document.getElementById('match-detail-body');
  const statusPill = document.getElementById('match-detail-status-pill');
  const weekPill = document.getElementById('match-detail-week-pill');
  if (!backdrop || !body) return;

  const lang = getLanguage();
  const isEn = lang === 'en';
  const isFinished = match.status === 'FT';

  if (statusPill) {
    statusPill.textContent = isFinished ? (isEn ? 'FT' : 'SELESAI') : (isEn ? 'UPCOMING' : 'MENDATANG');
  }
  if (weekPill) {
    weekPill.textContent = match.weekNum ? (isEn ? `MATCHWEEK ${match.weekNum}` : `PEKAN ${match.weekNum}`) : (isEn ? 'MATCH DETAIL' : 'DETAIL LAGA');
  }

  // Standings ranks and stats
  const standings = state.standingsData && state.standingsData.klasemen ? state.standingsData.klasemen : [];
  const homeStanding = standings.find((t) => matchClubs(t.klub, match.timHome));
  const awayStanding = standings.find((t) => matchClubs(t.klub, match.timAway));

  // Find Head-to-Head matches from fixturesData
  const h2hMatches = [];
  if (Array.isArray(state.fixturesData)) {
    state.fixturesData.forEach((w) => {
      if (Array.isArray(w.pertandingan)) {
        w.pertandingan.forEach((m) => {
          if (
            m.status === 'FT' &&
            ((matchClubs(m.timHome, match.timHome) && matchClubs(m.timAway, match.timAway)) ||
              (matchClubs(m.timHome, match.timAway) && matchClubs(m.timAway, match.timHome)))
          ) {
            h2hMatches.push({ ...m, weekNum: w.pekan });
          }
        });
      }
    });
  }

  // Recent Form (Last 5 matches)
  const homeForm = (state.teamsFormMap && state.teamsFormMap[homeStanding ? homeStanding.klub : match.timHome]) || [];
  const awayForm = (state.teamsFormMap && state.teamsFormMap[awayStanding ? awayStanding.klub : match.timAway]) || [];
  const last5Home = homeForm.slice(-5);
  const last5Away = awayForm.slice(-5);

  const formattedDate = formatMatchDate(match.tanggal, lang) || match.tanggal || (isEn ? 'TBD' : 'Menyusul');
  const stadiumName = match.stadion ? match.stadion.toUpperCase() : (isEn ? 'MAIN STADIUM' : 'STADION UTAMA');
  const kickoffTime = match.waktu ? `${match.waktu} WIB` : (isFinished ? '15:30 WIB' : (isEn ? 'TBD' : 'Jadwal Menyusul'));
  const broadcastName = match.siaran && match.siaran.nama ? match.siaran.nama : (isEn ? 'Official Broadcast' : 'Siaran Resmi');
  const broadcastLogo = match.siaran && match.siaran.logo ? `<img src="${match.siaran.logo}" alt="${broadcastName}" style="height: 18px; max-width: 60px; object-fit: contain;">` : '';

  const renderFormPills = (list) => {
    if (!list || list.length === 0) return `<span style="color: var(--text-dim); font-size: 11px;">-</span>`;
    return list.map((item) => {
      const res = item.result || 'D';
      const resClass = res.toLowerCase();
      const oppLabel = item.opponent ? `vs ${item.opponent}` : '';
      const sc = item.score ? `(${item.score})` : '';
      return `<span class="form-pill-mini ${resClass}" title="Pekan ${item.pekan}: ${oppLabel} ${sc}">${res}</span>`;
    }).join('');
  };

  const h2hHtml = h2hMatches.length > 0
    ? h2hMatches.map((h) => {
      const hDate = formatMatchDate(h.tanggal, lang) || `Pekan ${h.weekNum}`;
      return `
          <div class="h2h-item-row">
            <div style="display: flex; flex-direction: column;">
              <span style="font-weight: 700; color: #fff;">${h.timHome} vs ${h.timAway}</span>
              <span class="h2h-date">${hDate}</span>
            </div>
            <span class="h2h-score-badge">${h.skorHome} - ${h.skorAway}</span>
          </div>
        `;
    }).join('')
    : `<div style="color: var(--text-muted); font-size: 12px; padding: 4px 0;">${t('match_detail_no_h2h', {}, lang)}</div>`;

  const scoreDigitsHtml = isFinished
    ? `
      <div class="match-detail-score-digits">
        <span>${match.skorHome}</span>
        <span class="match-detail-score-divider">-</span>
        <span>${match.skorAway}</span>
      </div>
    `
    : `<div class="match-detail-vs-badge">${isEn ? 'VS' : 'VS'}</div>`;

  body.innerHTML = `
    <!-- Scoreboard -->
    <div class="match-detail-scoreboard">
      <!-- Home -->
      <div class="match-detail-team">
        <img src="${match.logoHome}" alt="${match.timHome}" class="match-detail-team-logo" loading="lazy" onerror="this.style.opacity='0.2'">
        <span class="match-detail-team-name">${match.timHome}</span>
      </div>

      <!-- Center Score -->
      <div class="match-detail-score-box">
        ${scoreDigitsHtml}
      </div>

      <!-- Away -->
      <div class="match-detail-team">
        <img src="${match.logoAway}" alt="${match.timAway}" class="match-detail-team-logo" loading="lazy" onerror="this.style.opacity='0.2'">
        <span class="match-detail-team-name">${match.timAway}</span>
      </div>
    </div>

    <!-- Match Information Grid -->
    <div class="match-detail-info-grid">
      <div class="match-detail-info-card">
        <span class="match-detail-info-label">${t('match_detail_kickoff', {}, lang)}</span>
        <span class="match-detail-info-val">${formattedDate} • ${kickoffTime}</span>
      </div>
      <div class="match-detail-info-card">
        <span class="match-detail-info-label">${t('match_detail_stadium', {}, lang)}</span>
        <span class="match-detail-info-val">${stadiumName}</span>
      </div>
      <div class="match-detail-info-card">
        <span class="match-detail-info-label">${t('match_detail_broadcast', {}, lang)}</span>
        <span class="match-detail-info-val">${broadcastLogo} ${broadcastName}</span>
      </div>
      <div class="match-detail-info-card">
        <span class="match-detail-info-label">${t('match_detail_standings_pos', {}, lang)}</span>
        <span class="match-detail-info-val">
          #${homeStanding ? homeStanding.posisi : '-'} (${homeStanding ? homeStanding.poin : 0} pts) vs #${awayStanding ? awayStanding.posisi : '-'} (${awayStanding ? awayStanding.poin : 0} pts)
        </span>
      </div>
    </div>

    <!-- Recent Form (Last 5) -->
    <div class="match-detail-section">
      <div class="match-detail-section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span>${t('match_detail_form', {}, lang)}</span>
      </div>
      <div class="match-detail-card-panel">
        <div class="match-detail-form-grid">
          <div class="match-detail-form-col">
            <span class="match-detail-form-team-label">${match.timHome}</span>
            <div class="match-detail-form-badges">${renderFormPills(last5Home)}</div>
          </div>
          <div class="match-detail-form-col">
            <span class="match-detail-form-team-label">${match.timAway}</span>
            <div class="match-detail-form-badges">${renderFormPills(last5Away)}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Head-to-Head -->
    <div class="match-detail-section">
      <div class="match-detail-section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        <span>${t('match_detail_h2h', {}, lang)}</span>
      </div>
      <div class="match-detail-card-panel">
        ${h2hHtml}
      </div>
    </div>
  `;

  backdrop.classList.add('show');
  document.body.style.overflow = 'hidden';
}

export function closeMatchDetail() {
  const backdrop = document.getElementById('match-detail-backdrop');
  if (backdrop) {
    backdrop.classList.remove('show');
    document.body.style.overflow = '';
  }
}

export function setupMatchDetailEvents() {
  const backdrop = document.getElementById('match-detail-backdrop');
  const closeBtn = document.getElementById('btn-close-match-detail');
  if (!backdrop) return;

  if (closeBtn) {
    closeBtn.addEventListener('click', closeMatchDetail);
  }

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      closeMatchDetail();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop.classList.contains('show')) {
      closeMatchDetail();
    }
  });
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

