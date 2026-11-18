// ==========================================================================
// STATE MODULE - Central Application State
// ==========================================================================

export const state = {
  standingsGroups: [], // Array of groups: [{ grup: 'Grup A', ... }, { grup: 'Grup B', ... }]
  selectedGroup: 'Grup A', // Default to Grup A
  standingsData: null, // Active group standings object (Grup A)
  fixturesData: [],
  currentWeek: 10,
  totalWeeks: 18,
  selectedPeriod: 'single', // 'single' (per Matchweek) or 'all'
  selectedCompFilter: 'Grup A', // Locked to Grup A matches
  selectedClubFilter: 'all',
  sortStandingsCol: 'posisi',
  sortStandingsAsc: true,
  sortFixturesNewestFirst: true,
  currentView: 'standings', // 'standings', 'fixtures', 'stats'
  teamsFormMap: {}, // clubName -> [{ pekan, result: 'W'|'D'|'L', opp, score }]
  // Statistics view state
  statsViewMode: 'overview', // 'overview' or 'detail'
  statsOverviewCategory: 'all', // 'all', 'performance', 'attack', 'defense', 'home-away'
  activeStatDetailKey: 'clean-sheets',
  statDetailClubFilter: 'all',
  // In-memory dummy weekly update testing state (Admin only, never mutates data/*.json)
  dummyTesting: {
    active: false,
    simulatedThroughWeek: null,
    officialSnapshot: null
  }
};

