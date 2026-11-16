// ==========================================================================
// UTILS MODULE - Formatting, Cross-matching & Toast Notifications
// ==========================================================================

import { getLanguage } from './i18n.js';

export function formatTimestamp(isoString, lang = getLanguage()) {
  const date = isoString ? new Date(isoString) : new Date();
  const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const daysId = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const monthsId = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const days = lang === 'en' ? daysEn : daysId;
  const months = lang === 'en' ? monthsEn : monthsId;

  const dayName = days[date.getDay()];
  const dayNum = date.getDate();
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${dayName}, ${dayNum} ${monthName} ${year}, ${hours}:${minutes} (WIB)`;
}

let toastTimeout = null;

export function showToast(title, message, icon = 'ℹ️', duration = 4000) {
  const toast = document.getElementById('toast');
  const toastTitle = document.getElementById('toast-title');
  const toastMsg = document.getElementById('toast-message');
  const toastIcon = document.getElementById('toast-icon');

  if (!toast) return;

  if (toastTitle) toastTitle.textContent = title;
  if (toastMsg) toastMsg.textContent = message;
  if (toastIcon) toastIcon.textContent = icon;

  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }

  toast.classList.add('show');
  if (duration > 0) {
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  }
}

// Normalize team name for cross-matching between standings and fixtures
export function normalizeClubName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\s*\((-\d+)\)/g, '')
    .replace(/\bfc\b/g, '')
    .replace(/\bpersikad\s*1999\b/g, 'persikad')
    .replace(/\bciamis\b/g, '')
    .replace(/\bkudus\b/g, '')
    .replace(/\bpekanbaru\b/g, '')
    .replace(/\bmedan\b/g, '')
    .replace(/\bsemarang\b/g, '')
    .replace(/\bbekasi\b/g, '')
    .replace(/\bbanda aceh\b/g, '')
    .replace(/\bbarito putera\b/g, 'barito')
    .replace(/\bdeltras\b/g, 'deltras')
    .replace(/\bkendal tornado\b/g, 'kendal')
    .replace(/\brans nusantara\b/g, 'rans')
    .replace(/\bpersela lamongan\b/g, 'persela')
    .replace(/\bpersipura jayapura\b/g, 'persipura')
    .replace(/\bpersis solo\b/g, 'persis')
    .replace(/\bde red\b/g, 'dered')
    .replace(/\bpersiba balikpapan\b/g, 'persiba')
    .replace(/\bpsbs biak\b/g, 'psbs')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export function matchClubs(name1, name2) {
  if (!name1 || !name2) return false;
  if (name1.toLowerCase() === name2.toLowerCase()) return true;
  const n1 = normalizeClubName(name1);
  const n2 = normalizeClubName(name2);
  if (n1 && n2 && (n1.includes(n2) || n2.includes(n1))) return true;
  return false;
}

// Calculate Last 5 Form (W, D, L) for each club from match history
export function buildFormMap(standingsList, fixtures) {
  const formMap = {};
  if (!standingsList) return formMap;

  standingsList.forEach((team) => {
    formMap[team.klub] = [];
  });

  const sortedWeeks = [...fixtures].sort((a, b) => a.pekan - b.pekan);

  sortedWeeks.forEach((week) => {
    if (!week.pertandingan) return;
    week.pertandingan.forEach((match) => {
      if (match.status === 'FT') {
        const homeName = match.timHome;
        const awayName = match.timAway;
        const sh = parseInt(match.skorHome, 10);
        const sa = parseInt(match.skorAway, 10);

        standingsList.forEach((team) => {
          if (matchClubs(team.klub, homeName)) {
            const result = sh > sa ? 'W' : (sh === sa ? 'D' : 'L');
            formMap[team.klub].push({
              pekan: week.pekan,
              result,
              opponent: awayName,
              score: `${sh} - ${sa}`,
              isHome: true,
            });
          } else if (matchClubs(team.klub, awayName)) {
            const result = sa > sh ? 'W' : (sa === sh ? 'D' : 'L');
            formMap[team.klub].push({
              pekan: week.pekan,
              result,
              opponent: homeName,
              score: `${sa} - ${sh}`,
              isHome: false,
            });
          }
        });
      }
    });
  });

  return formMap;
}

