const fs = require('fs');

const newCode = `// ==========================================================================
// PROGRESSION CHART MODULE - Standings History Line Chart (Matchweek by Matchweek)
// ==========================================================================

import { state } from './state.js';
import { matchClubs } from './utils.js';

// Specific brand colors for clubs for high-contrast aesthetic dark theme
const CLUB_BRAND_COLORS = {
  // Grup A
  'PSPS PEKANBARU': '#00d2ff',
  'PSMS MEDAN': '#00e676',
  'SEMEN PADANG FC': '#ef4444',
  'PSIS SEMARANG': '#3b82f6',
  'FC BEKASI CITY': '#f59e0b',
  'ADHYAKSA FC BEKASI': '#f59e0b',
  'PERSIKAD': '#a855f7',
  'PERSIKU KUDUS': '#14b8a6',
  'PERSIKU': '#14b8a6',
  'PERSIRAJA BANDA ACEH': '#f97316',
  'PSGC Ciamis': '#ec4899',
  'PSGC CIAMIS': '#ec4899',
  'SUMSEL UNITED': '#eab308',

  // Grup B
  'PERSELA LAMONGAN': '#38bdf8',
  'DELTRAS FC': '#e11d48',
  'PERSIS SOLO': '#f43f5e',
  'PERSIPURA JAYAPURA': '#84cc16',
  'PS BARITO PUTERA': '#facc15',
  'PS. BARITO PUTERA': '#facc15',
  'PERSIBA BALIKPAPAN': '#10b981',
  'PERSIBA': '#10b981',
  'PSBS BIAK': '#6366f1',
  'RANS NUSANTARA': '#d946ef',
  'RANS NUSANTARA FC': '#d946ef',
  'KENDAL TORNADO FC': '#2dd4bf',
  'DEJAN FC': '#fb7185',
  'DE RED FC': '#fb7185',
};

const DYNAMIC_PALETTE = [
  '#00e676', '#00d2ff', '#f59e0b', '#ec4899', '#a855f7',
  '#3b82f6', '#f97316', '#6366f1', '#e11d48', '#14b8a6',
  '#84cc16', '#d946ef', '#facc15', '#fb7185', '#06b6d4'
];

const CLUB_NAME_CANONICAL = {
  'PERSIKU KUDUS': 'PERSIKU',
  'PERSIBA BALIKPAPAN': 'PERSIBA',
};

function resolveClubName(rawName, clubList = []) {
  if (!rawName) return '';
  if (clubList.includes(rawName)) return rawName;
  if (CLUB_NAME_CANONICAL[rawName]) return CLUB_NAME_CANONICAL[rawName];
  const matched = clubList.find((c) => matchClubs(c, rawName));
  return matched || rawName;
}

let selectedClubHighlight = null; // null = all shown equally, or club name string
let progressionDataCache = null; // cached calculated trajectory
let selectedWeekRange = 'CURRENT'; // 'CURRENT', 'ALL', 'R1', 'R2', 'R3'

/**
 * Returns color for a club
 */
export function getClubColor(clubName, fallbackIndex = 0) {
  if (CLUB_BRAND_COLORS[clubName]) {
    return CLUB_BRAND_COLORS[clubName];
  }
  return DYNAMIC_PALETTE[fallbackIndex % DYNAMIC_PALETTE.length];
}

/**
 * Calculates matchweek-by-matchweek cumulative standings for the selected group
 */
export function computeGroupProgression(groupName) {
  if (!state.fixturesData || state.fixturesData.length === 0) return null;
  if (!state.standingsData || !state.standingsData.klasemen) return null;

  const currentGroupStandings = state.standingsData.klasemen;
  const clubList = currentGroupStandings.map((t) => t.klub);
  const logoMap = {};
  const penaltyMap = {};
  const officialPosMap = {};

  currentGroupStandings.forEach((t) => {
    logoMap[t.klub] = t.logo;
    penaltyMap[t.klub] = Number(t.catatanPenalti) || 0;
    officialPosMap[t.klub] = Number(t.posisi) || 99;
  });

  const allWeeks = state.fixturesData.map((w) => w.pekan).sort((a, b) => a - b);

  // Identify weeks that have at least 1 FT match for this group
  const activeWeeks = state.fixturesData
    .filter((w) =>
      w.pertandingan &&
      w.pertandingan.some(
        (m) =>
          m.status === 'FT' &&
          m.grup &&
          m.grup.toLowerCase() === groupName.toLowerCase()
      )
    )
    .sort((a, b) => a.pekan - b.pekan);

  const playedWeekNumbers = activeWeeks.map((w) => w.pekan);
  const latestPlayedWeek = playedWeekNumbers.length > 0 ? playedWeekNumbers[playedWeekNumbers.length - 1] : 0;

  // Determine target weeks based on selectedWeekRange
  let targetWeeks = [];
  if (selectedWeekRange === 'ALL') {
    targetWeeks = allWeeks.length > 0 ? allWeeks : Array.from({ length: 27 }, (_, i) => i + 1);
  } else if (selectedWeekRange === 'R1') {
    targetWeeks = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  } else if (selectedWeekRange === 'R2') {
    targetWeeks = [10, 11, 12, 13, 14, 15, 16, 17, 18];
  } else if (selectedWeekRange === 'R3') {
    targetWeeks = [19, 20, 21, 22, 23, 24, 25, 26, 27];
  } else {
    // Default 'CURRENT': only played weeks
    targetWeeks = [...playedWeekNumbers];
  }

  // Check if target range has any played matches
  const playedInRange = playedWeekNumbers.filter((p) => targetWeeks.includes(p));
  if (playedInRange.length === 0) {
    return {
      groupName,
      clubs: clubList,
      logoMap,
      emptyRange: true,
      rangeMode: selectedWeekRange,
      weeks: targetWeeks,
      playedWeekNumbers,
      latestPlayedWeek,
      trajectory: {},
    };
  }

  // Track cumulative stats with official penalty point deductions
  const stats = {};
  const trajectory = {}; // { clubName: [ { pekan, rank, pts, gd, gf, ga, matchResult } ] }
  clubList.forEach((c) => {
    stats[c] = {
      klub: c,
      pts: penaltyMap[c] || 0,
      p: 0,
      w: 0,
      d: 0,
      l: 0,
      gf: 0,
      ga: 0,
      gd: 0,
    };
    trajectory[c] = [];
  });

  activeWeeks.forEach((w, wIdx) => {
    const weeklyMatches = {}; // club -> match details
    const isLastWeek = wIdx === activeWeeks.length - 1;

    // Process all FT matches in this week for this group
    w.pertandingan.forEach((m) => {
      if (m.status !== 'FT') return;
      if (!m.grup || m.grup.toLowerCase() !== groupName.toLowerCase()) return;

      const homeClub = resolveClubName(m.timHome, clubList);
      const awayClub = resolveClubName(m.timAway, clubList);
      const home = stats[homeClub];
      const away = stats[awayClub];

      if (home && away) {
        home.p++;
        away.p++;
        home.gf += Number(m.skorHome) || 0;
        home.ga += Number(m.skorAway) || 0;
        home.gd = home.gf - home.ga;

        away.gf += Number(m.skorAway) || 0;
        away.ga += Number(m.skorHome) || 0;
        away.gd = away.gf - away.ga;

        let homeRes = 'D';
        let awayRes = 'D';

        if (m.skorHome > m.skorAway) {
          home.w++;
          home.pts += 3;
          away.l++;
          homeRes = 'W';
          awayRes = 'L';
        } else if (m.skorHome < m.skorAway) {
          away.w++;
          away.pts += 3;
          home.l++;
          homeRes = 'L';
          awayRes = 'W';
        } else {
          home.d++;
          home.pts += 1;
          away.d++;
          away.pts += 1;
          homeRes = 'D';
          awayRes = 'D';
        }

        weeklyMatches[homeClub] = {
          opponent: awayClub,
          logoOpponent: logoMap[awayClub] || m.logoAway,
          isHome: true,
          score: \`\${m.skorHome} - \${m.skorAway}\`,
          result: homeRes,
          stadion: m.stadion,
        };

        weeklyMatches[awayClub] = {
          opponent: homeClub,
          logoOpponent: logoMap[homeClub] || m.logoHome,
          isHome: false,
          score: \`\${m.skorAway} - \${m.skorHome}\`,
          result: awayRes,
          stadion: m.stadion,
        };
      }
    });

    // Rank clubs after this week (using Pts -> GD -> GF, and on the final week aligning 100% with the official table)
    const sorted = Object.values(stats).sort((a, b) => {
      if (isLastWeek && officialPosMap[a.klub] && officialPosMap[b.klub]) {
        return officialPosMap[a.klub] - officialPosMap[b.klub];
      }
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return (officialPosMap[a.klub] || 0) - (officialPosMap[b.klub] || 0);
    });

    sorted.forEach((team, index) => {
      const match = weeklyMatches[team.klub] || null;
      trajectory[team.klub].push({
        pekan: w.pekan,
        rank: index + 1,
        pts: team.pts,
        gd: team.gd,
        gf: team.gf,
        ga: team.ga,
        p: team.p,
        match,
      });
    });
  });

  return {
    groupName,
    clubs: clubList,
    logoMap,
    weeks: targetWeeks,
    playedWeekNumbers,
    latestPlayedWeek,
    trajectory,
    rangeMode: selectedWeekRange,
    emptyRange: false,
  };
}

/**
 * Renders the Progression Chart and its interactive club chips
 */
export function renderProgressionChart() {
  const viewport = document.getElementById('progression-chart-viewport');
  const chipsContainer = document.getElementById('progression-club-chips');
  const rangeSelect = document.getElementById('progression-range-select');
  if (!viewport) return;

  // Bind range selector event listener
  if (rangeSelect) {
    rangeSelect.value = selectedWeekRange;
    if (!rangeSelect.dataset.listenerBound) {
      rangeSelect.dataset.listenerBound = 'true';
      rangeSelect.addEventListener('change', (e) => {
        selectedWeekRange = e.target.value;
        renderProgressionChart();
      });
    }
  }

  const groupName = state.selectedGroup || 'Grup A';
  const data = computeGroupProgression(groupName);
  progressionDataCache = data;

  // Dynamically sync option labels if data is available
  if (data && rangeSelect && data.latestPlayedWeek) {
    const curOpt = rangeSelect.querySelector('option[value="CURRENT"]');
    if (curOpt) {
      curOpt.textContent = \`Pekan Berjalan (P1 - P\${data.latestPlayedWeek})\`;
    }
  }

  if (!data || !data.weeks || data.weeks.length === 0) {
    viewport.innerHTML = \`
      <div class="chart-empty-state">
        <p>Data perjalanan pekan untuk \${groupName} belum cukup tersedia.</p>
      </div>
    \`;
    return;
  }

  // Handle empty state when selected round has no played matches yet
  if (data.emptyRange) {
    const roundTitle = selectedWeekRange === 'R2'
      ? 'Putaran 2 (Pekan 10 - 18)'
      : selectedWeekRange === 'R3'
      ? 'Putaran 3 (Pekan 19 - 27)'
      : 'Rentang Pekan Terpilih';

    viewport.innerHTML = \`
      <div class="chart-empty-state" style="padding: 55px 20px; text-align: center;">
        <div style="font-size: 34px; margin-bottom: 12px; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.4));">📅</div>
        <h4 style="font-size: 16px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">\${roundTitle} Belum Dimulai</h4>
        <p style="color: var(--text-muted); font-size: 13.5px; max-width: 460px; margin: 0 auto 16px; line-height: 1.55;">
          Pertandingan untuk putaran ini belum bergulir atau belum ada data pertandingan yang berstatus selesai (FT). Silakan pilih rentang pekan yang sudah berlangsung.
        </p>
        <button class="btn-subnav-reset" id="btn-reset-progression-range">
          Lihat Pekan Berjalan (P1 - P\${data.latestPlayedWeek || 9})
        </button>
      </div>
    \`;

    const resetBtn = viewport.querySelector('#btn-reset-progression-range');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        selectedWeekRange = 'CURRENT';
        if (rangeSelect) rangeSelect.value = 'CURRENT';
        renderProgressionChart();
      });
    }
    return;
  }

  // 1. Render Club Filter Chips
  if (chipsContainer) {
    let chipsHtml = \`
      <button class="chart-club-chip \${selectedClubHighlight === null ? 'active' : ''}" data-club="__ALL__">
        <span class="chip-dot all"></span>
        <span class="chip-name">Semua Klub</span>
      </button>
    \`;

    data.clubs.forEach((clubName, idx) => {
      const color = getClubColor(clubName, idx);
      const isSelected = selectedClubHighlight === clubName;
      const logo = data.logoMap[clubName] || '';

      chipsHtml += \`
        <button class="chart-club-chip \${isSelected ? 'active' : ''}" data-club="\${clubName}">
          <span class="chip-dot" style="background-color: \${color};"></span>
          \${logo ? \`<img src="\${logo}" class="chip-emblem" alt="" onerror="this.style.display='none'">\` : ''}
          <span class="chip-name">\${clubName}</span>
        </button>
      \`;
    });

    chipsContainer.innerHTML = chipsHtml;

    // Attach chip click handlers
    chipsContainer.querySelectorAll('.chart-club-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const club = btn.getAttribute('data-club');
        if (club === '__ALL__') {
          selectedClubHighlight = null;
        } else {
          selectedClubHighlight = selectedClubHighlight === club ? null : club;
        }
        renderProgressionChart();
      });
    });
  }

  // 2. Compute Layout & SVG Dimensions
  const weeksCount = data.weeks.length;
  const marginLeft = 44; // Compact margin for rank cell with indicator bar
  const marginRight = 36; // Margin for final week logos (half-width 13px + 23px breathing room)
  const marginTop = 38;
  const marginBottom = 45;
  const rowHeight = 36; // Height per rank
  const chartHeight = marginTop + 9 * rowHeight + marginBottom; // 10 ranks total (0..9 spaces)
  
  // Dynamic column width: wider for single round (~93px), compact for all weeks (~60px)
  const colWidth = weeksCount > 15 ? 60 : Math.max(85, Math.min(125, Math.floor(750 / Math.max(1, weeksCount - 1))));
  const chartWidth = marginLeft + Math.max(1, weeksCount - 1) * colWidth + marginRight;

  function getX(weekIndex) {
    if (weeksCount <= 1) return marginLeft + 200;
    return marginLeft + weekIndex * colWidth;
  }

  function getY(rank) {
    // Inverted Y: rank 1 is highest (smallest Y), rank 10 is lowest (largest Y)
    return marginTop + (rank - 1) * rowHeight;
  }

  const plotXStart = marginLeft;
  const plotXEnd = marginLeft + (weeksCount - 1) * colWidth;
  const gridXEnd = plotXEnd + 16;
  const zoneHalf = rowHeight / 2;

  // 3. Construct SVG Grid
  let svg = \`
    <svg class="progression-svg" viewBox="0 0 \${chartWidth} \${chartHeight}" preserveAspectRatio="xMinYMin meet">
      <defs>
        <!-- Drop Shadow Filters -->
        <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Horizontal Grid Lines & Left Rank Position Indicator Bars (Matching Standings Table) -->
      <g class="grid-horizontal">
        <!-- Vertical separator between rank column and chart grid -->
        <line x1="\${plotXStart}" y1="\${getY(1) - zoneHalf}" x2="\${plotXStart}" y2="\${getY(10) + zoneHalf}" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1"/>
  \`;

  const barX = 3.5;
  const numX = 23;

  for (let r = 1; r <= 10; r++) {
    const y = getY(r);
    const yTop = y - zoneHalf;
    const yBottom = y + zoneHalf;

    let indicatorHtml = '';
    let rankTitle = \`Peringkat \${r}\`;

    if (r === 1) {
      indicatorHtml = \`<line x1="\${barX}" y1="\${yTop}" x2="\${barX}" y2="\${yBottom}" stroke="#00e676" stroke-width="4" stroke-linecap="round"/>\`;
      rankTitle = 'Peringkat 1: Grand Final & Promosi Otomatis';
    } else if (r === 2) {
      indicatorHtml = \`<line x1="\${barX}" y1="\${yTop}" x2="\${barX}" y2="\${yBottom}" stroke="#00b0ff" stroke-width="3.2" stroke-dasharray="4,3"/>\`;
      rankTitle = 'Peringkat 2: Play-off Promosi';
    } else if (r === 9) {
      indicatorHtml = \`<line x1="\${barX}" y1="\${yTop}" x2="\${barX}" y2="\${yBottom}" stroke="#ef4444" stroke-width="3.2" stroke-dasharray="4,3"/>\`;
      rankTitle = 'Peringkat 9: Play-off Degradasi';
    } else if (r === 10) {
      indicatorHtml = \`<line x1="\${barX}" y1="\${yTop}" x2="\${barX}" y2="\${yBottom}" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>\`;
      rankTitle = 'Peringkat 10: Degradasi Langsung';
    }

    svg += \`
      <g class="rank-row-guide">
        <title>\${rankTitle}</title>
        <!-- Horizontal grid line inside chart -->
        <line x1="\${plotXStart}" y1="\${y}" x2="\${gridXEnd}" y2="\${y}" stroke="rgba(255, 255, 255, 0.05)" stroke-width="1"/>
        <!-- Horizontal cell divider in rank column -->
        <line x1="0" y1="\${yBottom}" x2="\${plotXStart}" y2="\${yBottom}" stroke="rgba(255, 255, 255, 0.05)" stroke-width="1"/>
        <!-- Regulatory zone indicator bar on the left edge (Same as standings table) -->
        \${indicatorHtml}
        <!-- Crisp bold rank number -->
        <text x="\${numX}" y="\${y + 4.5}" text-anchor="middle" fill="#ffffff" font-size="12.5" font-weight="700">\${r}</text>
      </g>
    \`;
  }

  svg += \`</g>\`;

  // 4. Vertical Grid Lines (Matchweeks)
  svg += \`<g class="grid-vertical">\`;
  data.weeks.forEach((pekan, wIdx) => {
    const x = getX(wIdx);
    const isPlayed = data.playedWeekNumbers.includes(pekan);
    const strokeOpacity = isPlayed ? '0.05' : '0.025';
    const textOpacity = isPlayed ? '1' : '0.45';

    svg += \`
      <g class="pekan-col-guide" style="opacity: \${textOpacity};">
        <line x1="\${x}" y1="\${marginTop - 15}" x2="\${x}" y2="\${getY(10) + zoneHalf}" stroke="rgba(255, 255, 255, \${strokeOpacity})" stroke-dasharray="3,3"/>
        <text x="\${x}" y="\${marginTop - 22}" text-anchor="middle" fill="var(--text-dim)" font-size="11" font-weight="\${isPlayed ? '700' : '500'}">P\${pekan}</text>
        <text x="\${x}" y="\${getY(10) + zoneHalf + 18}" text-anchor="middle" fill="var(--text-dim)" font-size="11" font-weight="\${isPlayed ? '600' : '400'}">Pekan \${pekan}</text>
      </g>
    \`;
  });
  svg += \`</g>\`;

  // 5. Draw Club Lines and Nodes
  svg += \`<g class="club-trajectories">\`;

  // Sort rendering order: if a club is highlighted, draw it last (on top)
  const clubsToRender = [...data.clubs].sort((a, b) => {
    if (a === selectedClubHighlight) return 1;
    if (b === selectedClubHighlight) return -1;
    return 0;
  });

  clubsToRender.forEach((clubName, cIdx) => {
    const traj = data.trajectory[clubName] || [];
    if (traj.length === 0) return;

    // Filter points that fall within current target weeks
    const points = traj
      .filter((item) => data.weeks.includes(item.pekan))
      .map((item) => {
        const wIdx = data.weeks.indexOf(item.pekan);
        return {
          x: getX(wIdx),
          y: getY(item.rank),
          data: item,
        };
      });

    if (points.length === 0) return;

    const color = getClubColor(clubName, cIdx);
    const isHighlighted = selectedClubHighlight === clubName;
    const isDimmed = selectedClubHighlight !== null && !isHighlighted;

    const strokeOpacity = isHighlighted ? 1 : isDimmed ? 0.12 : 0.88;
    const strokeWidth = isHighlighted ? 4 : isDimmed ? 1.5 : 2.8;
    const filterGlow = isHighlighted ? 'url(#glowEffect)' : 'none';

    // Build straight line path (tegas lurus antar pekan)
    const pathD = points.map((pt, i) => \`\${i === 0 ? 'M' : 'L'} \${pt.x} \${pt.y}\`).join(' ');

    // Render path
    svg += \`
      <path class="club-line \${isHighlighted ? 'highlighted' : ''} \${isDimmed ? 'dimmed' : ''}" 
            d="\${pathD}" 
            fill="none" 
            stroke="\${color}" 
            stroke-width="\${strokeWidth}" 
            stroke-opacity="\${strokeOpacity}" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            filter="\${filterGlow}"
            data-club="\${clubName}"/>
    \`;

    // Invisible Hit Targets for Hover Tooltips (No visible dots or circles on the line)
    points.forEach((pt, idx) => {
      const isLast = idx === points.length - 1;
      if (isLast) return; // Skip final week; club logo is placed here

      svg += \`
        <circle class="club-node-hit"
                cx="\${pt.x}" 
                cy="\${pt.y}" 
                r="13" 
                fill="transparent" 
                stroke="transparent"
                data-club="\${clubName}"
                data-pekan="\${pt.data.pekan}"
                data-rank="\${pt.data.rank}"
                data-pts="\${pt.data.pts}"
                data-gd="\${pt.data.gd}"
                data-match="\${pt.data.match ? encodeURIComponent(JSON.stringify(pt.data.match)) : ''}"
                style="cursor: pointer;"
        />
      \`;
    });

    // Render Club Logo at the final played week (Pekan Terakhir - Hanya Logo Saja)
    const lastPt = points[points.length - 1];
    const lastY = lastPt.y;
    const lastRank = lastPt.data.rank;
    const logo = data.logoMap[clubName] || '';

    if (logo) {
      svg += \`
        <image class="club-end-logo \${isHighlighted ? 'highlighted' : ''} \${isDimmed ? 'dimmed' : ''}" 
               href="\${logo}" xlink:href="\${logo}" 
               x="\${lastPt.x - 13}" y="\${lastY - 13}" 
               width="26" height="26" 
               preserveAspectRatio="xMidYMid meet" 
               data-club="\${clubName}" 
               data-pekan="\${lastPt.data.pekan}" 
               data-rank="\${lastRank}" 
               data-pts="\${lastPt.data.pts}" 
               data-gd="\${lastPt.data.gd}" 
               data-match="\${lastPt.data.match ? encodeURIComponent(JSON.stringify(lastPt.data.match)) : ''}" 
               style="cursor: pointer;">
          <title>\${clubName} (Peringkat \${lastRank})</title>
        </image>
      \`;
    }
  });

  svg += \`
      <!-- Dynamic single hover dot (only visible when hovering a matchweek) -->
      <circle id="chart-hover-indicator" cx="0" cy="0" r="5" fill="#ffffff" stroke="#00e676" stroke-width="2.5" style="display: none; pointer-events: none;" />
    </g></svg>\`;

  // 6. Tooltip Container
  const tooltipHtml = \`
    <div class="progression-tooltip" id="progression-chart-tooltip" style="display: none;">
      <!-- Populated dynamically via JS -->
    </div>
  \`;

  const minWrapWidth = Math.max(720, chartWidth);
  viewport.innerHTML = \`<div class="chart-scroll-wrap" style="min-width: \${minWrapWidth}px; width: 100%;">\${svg}</div>\${tooltipHtml}\`;

  // 7. Interactive Hover Events for Nodes & Lines
  setupChartInteractivity(viewport, data);
}

/**
 * Handles Hover/Tooltip and Highlighting on SVG nodes & lines
 */
function setupChartInteractivity(viewport, data) {
  const tooltip = document.getElementById('progression-chart-tooltip');
  if (!tooltip) return;

  const nodes = viewport.querySelectorAll('.club-node-hit');
  const hoverDot = viewport.querySelector('#chart-hover-indicator');
  const lines = viewport.querySelectorAll('.club-line');
  const endLogos = viewport.querySelectorAll('.club-end-logo');

  function showTooltip(e, node) {
    const clubName = node.getAttribute('data-club');
    const pekan = node.getAttribute('data-pekan');
    const rank = node.getAttribute('data-rank');
    const pts = node.getAttribute('data-pts');
    const gd = node.getAttribute('data-gd');
    const matchRaw = node.getAttribute('data-match');
    const color = getClubColor(clubName);
    const logo = data.logoMap[clubName] || '';

    // Position dynamic hover dot at the inspected week node
    if (hoverDot && node.classList.contains('club-node-hit')) {
      hoverDot.setAttribute('cx', node.getAttribute('cx'));
      hoverDot.setAttribute('cy', node.getAttribute('cy'));
      hoverDot.setAttribute('stroke', color);
      hoverDot.style.display = 'block';
    } else if (hoverDot) {
      hoverDot.style.display = 'none';
    }

    let matchHtml = '';
    if (matchRaw) {
      try {
        const m = JSON.parse(decodeURIComponent(matchRaw));
        const resClass = m.result.toLowerCase();
        const venueLabel = m.isHome ? 'Kandang' : 'Tandang';
        matchHtml = \`
          <div class="tooltip-match-row">
            <span class="tooltip-res-badge \${resClass}">\${m.result}</span>
            <span class="tooltip-match-text">\${m.score} vs \${m.opponent} (\${venueLabel})</span>
          </div>
        \`;
      } catch (_) {}
    }

    let statusText = \`Peringkat \${rank}\`;
    if (rank === '1') statusText = 'Peringkat 1 • Grand Final';
    else if (rank === '2') statusText = 'Peringkat 2 • Play-off Promosi';
    else if (rank === '9') statusText = 'Peringkat 9 • Play-off Degradasi';
    else if (rank === '10') statusText = 'Peringkat 10 • Degradasi';

    tooltip.innerHTML = \`
      <div class="tooltip-header">
        \${logo ? \`<img src="\${logo}" class="tooltip-emblem" alt="">\` : ''}
        <strong style="color: \${color};">\${clubName}</strong>
      </div>
      <div class="tooltip-meta">
        <span class="tooltip-pill">Pekan \${pekan}</span>
        <span class="tooltip-rank">\${statusText}</span>
      </div>
      <div class="tooltip-stats">
        <span><strong>\${pts}</strong> Pts</span>
        <span>GD: <strong>\${Number(gd) > 0 ? '+' + gd : gd}</strong></span>
      </div>
      \${matchHtml}
    \`;

    tooltip.style.display = 'block';

    // Position tooltip relative to viewport with scroll offsets
    const vpRect = viewport.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    const screenLeft = nodeRect.left - vpRect.left;

    let left = screenLeft + viewport.scrollLeft + 15;
    let top = (nodeRect.top - vpRect.top) + viewport.scrollTop - 70;

    // Boundary protection
    if (screenLeft + 230 > vpRect.width) {
      left = screenLeft + viewport.scrollLeft - 235;
    }
    if (screenLeft < 20) {
      left = viewport.scrollLeft + 10;
    }
    if (nodeRect.top - vpRect.top < 10) {
      top = (nodeRect.top - vpRect.top) + viewport.scrollTop + 20;
    }

    tooltip.style.left = \`\${Math.max(viewport.scrollLeft + 10, left)}px\`;
    tooltip.style.top = \`\${Math.max(10, top)}px\`;
  }

  function hideTooltip() {
    tooltip.style.display = 'none';
    if (hoverDot) hoverDot.style.display = 'none';
  }

  nodes.forEach((node) => {
    node.addEventListener('mouseenter', (e) => showTooltip(e, node));
    node.addEventListener('mouseleave', hideTooltip);
    node.addEventListener('click', () => {
      const club = node.getAttribute('data-club');
      selectedClubHighlight = selectedClubHighlight === club ? null : club;
      renderProgressionChart();
    });
  });

  lines.forEach((line) => {
    line.addEventListener('click', () => {
      const club = line.getAttribute('data-club');
      selectedClubHighlight = selectedClubHighlight === club ? null : club;
      renderProgressionChart();
    });
  });

  endLogos.forEach((el) => {
    el.addEventListener('mouseenter', (e) => showTooltip(e, el));
    el.addEventListener('mouseleave', hideTooltip);
    el.addEventListener('click', () => {
      const club = el.getAttribute('data-club');
      selectedClubHighlight = selectedClubHighlight === club ? null : club;
      renderProgressionChart();
    });
  });
}

/**
 * Initializes the Subview Tabs (Table vs Progression) in Standings view
 */
export function initProgressionTabs() {
  const btnTable = document.getElementById('btn-subview-table');
  const btnProgression = document.getElementById('btn-subview-progression');
  const panelTable = document.getElementById('standings-panel-table');
  const panelProgression = document.getElementById('standings-panel-progression');

  if (!btnTable || !btnProgression || !panelTable || !panelProgression) return;

  function setSubview(mode) {
    if (mode === 'progression') {
      btnTable.classList.remove('active');
      btnTable.setAttribute('aria-selected', 'false');
      btnProgression.classList.add('active');
      btnProgression.setAttribute('aria-selected', 'true');

      panelTable.style.display = 'none';
      panelTable.classList.remove('active');
      panelProgression.style.display = 'block';
      panelProgression.classList.add('active');

      renderProgressionChart();
    } else {
      btnProgression.classList.remove('active');
      btnProgression.setAttribute('aria-selected', 'false');
      btnTable.classList.add('active');
      btnTable.setAttribute('aria-selected', 'true');

      panelProgression.style.display = 'none';
      panelProgression.classList.remove('active');
      panelTable.style.display = 'block';
      panelTable.classList.add('active');
    }
  }

  btnTable.addEventListener('click', () => setSubview('table'));
  btnProgression.addEventListener('click', () => setSubview('progression'));
}
`;

fs.writeFileSync('public/js/modules/progression-chart.js', newCode);
console.log('Successfully updated public/js/modules/progression-chart.js');

