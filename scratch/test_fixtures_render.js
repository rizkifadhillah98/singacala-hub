const fs = require('fs');

const fixturesData = JSON.parse(fs.readFileSync('data/jadwal_dan_hasil.json'));

const state = {
  fixturesData,
  selectedPeriod: 'single',
  currentWeek: 10,
  totalWeeks: 27,
  selectedClubFilter: 'all',
  sortFixturesNewestFirst: true,
};

function matchClubs(a, b) { return a === b; }

// Test running the code from fixtures.js
const fileContent = fs.readFileSync('public/js/modules/fixtures.js', 'utf8');
const cjsCode = fileContent
  .replace(/import\s+\{[^}]+\}\s+from\s+'[^']+';/g, '')
  .replace(/export\s+function/g, 'function')
  .replace(/export\s+let/g, 'let')
  .replace(/export\s+const/g, 'const');

let containerHTML = '';
const mockContainer = {
  set innerHTML(val) { containerHTML = val; },
  get innerHTML() { return containerHTML; }
};
const mockDateRange = { textContent: '' };

const globalScope = {
  state,
  matchClubs,
  mockContainer,
  document: {
    getElementById: (id) => {
      if (id === 'fixtures-matches-stream') return mockContainer;
      if (id === 'date-range-label') return mockDateRange;
      return null;
    }
  },
  console
};

const fn = new Function('globalScope', `
  with (globalScope) {
    ${cjsCode}
    renderFixturesStream();
    return mockContainer.innerHTML;
  }
`);

const output = fn(globalScope);
console.log('--- Rendered HTML sample (first 1000 chars) ---');
console.log(output.slice(0, 1000));

// Check match-ko-time texts
const koTimes = [...output.matchAll(/class="match-ko-time">([^<]+)<\/div>/g)].map(m => m[1]);
console.log('\n--- Rendered KO Time labels in Week 9 ---');
koTimes.forEach(t => console.log('•', t));
