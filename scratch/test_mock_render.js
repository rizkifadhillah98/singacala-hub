const fs = require('fs');

const fixturesData = JSON.parse(fs.readFileSync('data/jadwal_dan_hasil.json'));
const standingsAll = JSON.parse(fs.readFileSync('data/klasemen.json'));

const state = {
  fixturesData,
  standingsData: standingsAll[0],
  selectedGroup: 'Grup A',
};

// Test running the code from progression-chart.js in node
const fileContent = fs.readFileSync('public/js/modules/progression-chart.js', 'utf8');

// Replace ES module imports/exports with local vars
const cjsCode = fileContent
  .replace(/import\s+\{[^}]+\}\s+from\s+'[^']+';/g, '')
  .replace(/export\s+function/g, 'function')
  .replace(/export\s+let/g, 'let')
  .replace(/export\s+const/g, 'const');

function runTestWithRange(range) {
  let innerHTMLOutput = '';
  const mockViewport = {
    id: 'progression-chart-viewport',
    dataset: {},
    style: {},
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    setAttribute: () => {},
    getAttribute: () => '',
    addEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    set innerHTML(val) { innerHTMLOutput = val; },
    get innerHTML() { return innerHTMLOutput; }
  };

  const mockSelect = {
    id: 'progression-range-select',
    dataset: {},
    value: range,
    querySelector: () => ({ textContent: '' }),
    addEventListener: () => {},
  };

  const mockChips = {
    id: 'progression-club-chips',
    innerHTML: '',
    querySelectorAll: () => [],
  };

  const globalScope = {
    state,
    matchClubs: (a, b) => a === b,
    document: {
      getElementById: (id) => {
        if (id === 'progression-range-select') return mockSelect;
        if (id === 'progression-chart-viewport') return mockViewport;
        if (id === 'progression-club-chips') return mockChips;
        return null;
      }
    },
    mockViewport,
    console,
  };

  const fn = new Function('globalScope', `
    with (globalScope) {
      ${cjsCode}
      selectedWeekRange = '${range}';
      renderProgressionChart();
      return { output: mockViewport.innerHTML, empty: mockViewport.innerHTML.includes('Belum Dimulai') };
    }
  `);

  return fn(globalScope);
}

['CURRENT', 'ALL', 'R1', 'R2', 'R3'].forEach(r => {
  const result = runTestWithRange(r);
  console.log(`Range [${r}]: emptyState=${result.empty}, outputLength=${result.output.length}`);
});
