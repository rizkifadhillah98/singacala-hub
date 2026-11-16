// ==========================================================================
// I18N MODULE - Multi-Language (ID / EN) Translations & Formatting
// ==========================================================================

export function getLanguage() {
  try {
    const saved = localStorage.getItem('pc_lang');
    if (saved === 'id' || saved === 'en') {
      return saved;
    }
  } catch (_) {
    // defensive fallback if localStorage is disabled or throws SecurityError
  }
  return (navigator.language && navigator.language.toLowerCase().startsWith('id')) ? 'id' : 'en';
}

export function setLanguage(lang) {
  if (lang !== 'id' && lang !== 'en') return;
  try {
    localStorage.setItem('pc_lang', lang);
  } catch (_) {
    // defensive fallback if localStorage is disabled or throws SecurityError
  }
  window.location.reload();
}

export const translations = {
  id: {
    // Header Navigation
    nav_standings: 'Klasemen',
    nav_fixtures: 'Jadwal & Hasil',
    nav_stats: 'Statistik Tim',
    nav_simulation: 'Simulator Liga',
    nav_home_aria: 'Beranda Singacala Hub',
    nav_menu_aria: 'Menu Opsi & Pembaruan',
    nav_search_aria: 'Pencarian Klub & Laga',

    // Mobile Bottom Navigation
    mob_standings: 'Klasemen',
    mob_fixtures: 'Jadwal',
    mob_stats: 'Statistik',
    mob_simulation: 'Simulator',

    // Standings View
    standings_title: 'Singacala Hub — Klasemen',
    standings_updated_prefix: 'Diperbarui:',
    subnav_table: 'Tabel',
    subnav_progression: 'Grafik Posisi',
    subnav_psgc: 'Peluang PSGC',
    th_pos: 'Pos',
    th_club: 'Klub',
    th_pts: 'Poin',
    th_p: 'Main',
    th_w: 'M',
    th_d: 'S',
    th_l: 'K',
    th_gf: 'GM',
    th_ga: 'GK',
    th_gd: 'SG',
    th_form: '5 Laga Terakhir',
    standings_loading: 'Memuat data klasemen...',

    // Tournament Status / Legend
    status_grandfinal: 'Grand Final & Promosi Otomatis (P1)',
    status_grandfinal_full: 'Grand Final & Promosi Otomatis (Peringkat 1)',
    status_grandfinal_desc: 'Peringkat 1: Babak Grand Final & Promosi Otomatis ke BRI Super League',

    status_playoff_promo: 'Play-off Promosi (P2)',
    status_playoff_promo_full: 'Play-off Promosi (Peringkat 2)',
    status_playoff_promo_desc: 'Peringkat 2: Babak Play-off Promosi ke BRI Super League',

    status_playoff_releg: 'Play-off Degradasi (P9)',
    status_playoff_releg_full: 'Play-off Degradasi (Peringkat 9)',
    status_playoff_releg_desc: 'Peringkat 9: Babak Play-off Degradasi ke Liga Nusantara',

    status_relegation: 'Degradasi Langsung (P10)',
    status_relegation_full: 'Degradasi Langsung (Peringkat 10)',
    status_relegation_desc: 'Peringkat 10: Degradasi Langsung ke Liga Nusantara',

    status_safe_desc: 'Peringkat {pos}: Bertahan di Liga 2',

    // Progression Chart
    progression_title: 'Riwayat Posisi Klasemen Pekan ke Pekan',
    progression_subtitle: 'Grafik dinamika peringkat tim dari Pekan 1 hingga sekarang. Peringkat 1 berada di posisi puncak.',
    range_select_label: 'Rentang Pekan:',
    range_current: 'Pekan Berjalan (P1 - P{latest})',
    range_all: 'Semua Pekan (P1 - P27)',
    range_r1: 'Putaran 1 (P1 - P9)',
    range_r2: 'Putaran 2 (P10 - P18)',
    range_r3: 'Putaran 3 (P19 - P27)',
    all_clubs: 'Semua Klub',
    chart_pekan: 'Pekan {week}',

    // Fixtures View
    fixtures_title: 'Jadwal & Hasil',
    filter_matchweek: 'Pekan',
    filter_club: 'Klub',
    all_matchweeks: 'Semua Pekan',
    all_matchweeks_range: 'Semua Pekan (1–{total})',
    matchweek_num: 'Pekan {week}',
    all_clubs_filter: 'Semua Klub (Grup A)',
    prev_week_aria: 'Pekan Sebelumnya',
    next_week_aria: 'Pekan Berikutnya',
    no_matches_title: 'Tidak Ada Pertandingan Ditemukan',
    no_matches_desc: 'Tidak ada laga untuk filter pekan dan klub yang dipilih.',
    status_ft: 'SELESAI',
    status_vs: 'VS',
    schedule_tbd: 'Jadwal Menyusul',

    // Stats View
    stats_title: 'Statistik Tim',
    stats_subtitle: 'Statistik performa klub Grup A Musim 2026/27',
    cat_all: 'Semua Metrik (11)',
    cat_performance: 'Performa & Poin (3)',
    cat_attack: 'Serangan & Gol (3)',
    cat_defense: 'Pertahanan & Kiper (3)',
    cat_home_away: 'Kandang / Tandang (2)',
    stat_points_per_game: 'Poin per Pertandingan',
    stat_win_rate: 'Persentase Kemenangan',
    stat_unbeaten_rate: 'Persentase Tak Terkalahkan',
    stat_goal_diff: 'Selisih Gol (SG)',
    stat_goals_per_game: 'Gol per Pertandingan',
    stat_total_goals: 'Total Gol (GM)',
    stat_clean_sheets: 'Nirbobol',
    stat_fewest_conceded: 'Kebobolan Paling Sedikit (GK)',
    stat_goals_conceded_per_game: 'Gol Kebobolan per Pertandingan',
    stat_home_record: 'Rekor Kandang',
    stat_away_record: 'Rekor Tandang',
    stat_back_btn: 'Kembali ke Overview',
    stat_label: 'Statistik',
    stat_clubs: 'Klub',
    stat_all_clubs: 'Semua Klub',

    // Simulation View
    sim_title: 'Simulator Liga & Proyeksi Musim',
    sim_subtitle: 'Simulasi interaktif 27 Pekan. Prediksi klasemen akhir, perebutan tiket Grand Final, Play-off Promosi, dan zona degradasi secara real-time.',
    sim_tab_standings: '🏆 Tabel Klasemen',
    sim_tab_fixtures: '📅 Jadwal & Input Skor',
    sim_table_title: 'Klasemen Simulasi Live',
    sim_table_subtitle: 'Perhitungan otomatis poin, SG (Selisih Gol), dan Head-to-Head resmi PSSI.',
    sim_clear_filter: '✕ Hapus Filter ({club})',
    sim_progress_done: '{ftCount} / {total} Pertandingan Selesai',
    sim_status_complete: '• Musim 2026/27 Selesai Penuh (27 Pekan)',
    sim_status_active: '• Mode Simulasi Aktif',
    sim_r1_chip: 'Putaran 1: Pekan 1-9 (Selesai)',
    sim_r2_chip_done: 'Putaran 2: Pekan 10-18 (Selesai)',
    sim_r2_chip_active: 'Putaran 2: Pekan 10-18 (Sedang Berjalan)',
    sim_r3_chip_done: 'Putaran 3: Pekan 19-27 (Selesai)',
    sim_r3_chip_active: 'Putaran 3: Pekan 19-27 (Tersedia)',
    sim_r3_chip_locked: 'Putaran 3: Pekan 19-27 (Terkunci)',
    sim_btn_week: 'Simulasikan Pekan {week}',
    sim_btn_r2: 'Simulasikan s/d Pekan 18',
    sim_btn_all: 'Simulasikan Semua (s/d Pekan 27)',
    sim_btn_reset: 'Reset Simulasi',
    sim_btn_reset_title: 'Kembalikan semua skor ke kondisi awal',
    sim_round_tab1: 'Putaran 1 (1–9)',
    sim_round_tab2: 'Putaran 2 (10–18)',
    sim_round_tab3: 'Putaran 3 (19–27)',
    sim_week_badge: 'PEKAN {week}',
    sim_week_tag_r1: 'Putaran 1 (Data Resmi)',
    sim_week_tag_r2: 'Putaran 2 (Jadwal Resmi)',
    sim_week_tag_r3: 'Putaran 3 (Regulasi PSSI)',
    sim_badge_ft: 'SELESAI',
    sim_badge_upcoming: 'TERJADWAL',
    sim_payoff_title: 'Hasil Akhir Musim (Proyeksi 27 Pekan)',
    sim_payoff_tag: 'Proyeksi Berdasarkan Regulasi PSSI 2026/27',
    sim_payoff_p1: 'Tiket Grand Final & Promosi Otomatis (P1)',
    sim_payoff_p2: 'Tiket Play-off Promosi (P2)',
    sim_payoff_p9: 'Tiket Play-off Degradasi (P9)',
    sim_payoff_p10: 'Degradasi Langsung ke Liga Nusantara (P10)',

    // Round 3 Notice Banner
    r3_notice_locked_title: 'Putaran 3 Terkunci • Selesaikan Putaran 2',
    r3_notice_locked_desc: 'Simulasi Putaran 3 membutuhkan klasemen akhir Putaran 2 (Pekan 18) guna menentukan alokasi 5 kandang / 4 tandang dan skenario regulasi PSSI.',
    r3_notice_locked_btn: 'Simulasikan Dulu s/d Pekan 18',
    r3_notice_ready_title: 'Putaran 2 Selesai • Putaran 3 Siap Dibuat',
    r3_notice_ready_desc: 'Klasemen akhir Putaran 2 telah terbentuk. Klik tombol di bawah untuk mengundi jadwal Putaran 3 berdasarkan Regulasi PSSI Pasal 7.',
    r3_notice_ready_btn: 'Buat Jadwal Putaran 3 Otomatis',
    r3_notice_active_title: 'Putaran 3 Terbuka • Regulasi PSSI Diaktifkan',
    r3_notice_active_btn: 'Lihat Regulasi & Alasan Jadwal',

    // Round 3 Regulatory Modal
    r3_modal_tag: 'PUTARAN 3 • {group}',
    r3_modal_subtag: 'Regulasi PSSI Pasal 7 Ayat 3 & 4',
    r3_modal_title: 'Jadwal & Alasan Regulasi Putaran 3',
    r3_modal_title_scenario: 'Hasil Jadwal Putaran 3: {scenarioTitle}',
    r3_modal_subtitle: 'Hasil undian otomatis Pekan 19–27 berdasarkan posisi akhir Putaran 2.',
    r3_modal_subtitle_default: 'Penetapan jadwal pertandingan dan alokasi kandang/tandang berdasarkan Regulasi PSSI Pasal 7 Ayat 3 & 4.',
    r3_summary_top5: '<strong>Top 5:</strong> 5 Kandang / 4 Tandang',
    r3_summary_bottom5: '<strong>Pos 6–10:</strong> 4 Kandang / 5 Tandang',
    r3_summary_ramadhan: '<strong>Klausul Ramadhan (Pasal 7 Ayat 4):</strong> PERSIRAJA (Peringkat #{rank}) tandang di Pekan 19, 20, 21 • Skenario ({letter})',
    r3_summary_standard: '<strong>Matriks Standar:</strong> Babak Pendahuluan Putaran 3 (Pasal 7 Ayat 3 Bagian III)',
    r3_week_tab: 'Pekan {week}',
    r3_modal_footer_matches: 'Total 45 Pertandingan',
    r3_modal_footer_quota: 'Top 5: 5 Kandang / 4 Tandang • Posisi 6–10: 4 Kandang / 5 Tandang',
    r3_modal_btn_close: 'Tutup',
    r3_modal_btn_proceed: 'Lanjutkan ke Simulasi',

    // Drawer & Modals
    drawer_nav_title: 'NAVIGASI MENU',
    drawer_standings: '🏆 Tabel Klasemen Lengkap',
    drawer_fixtures: '📅 Jadwal & Hasil',
    drawer_stats: '📈 Analisis & Statistik Tim',
    drawer_simulation: '🎮 Simulator Liga 2026/27',
    drawer_info_title: 'INFORMASI SUMBER DATA',
    drawer_sync_prefix: 'Terakhir diperbarui:',
    drawer_admin_title: 'ADMIN: SINKRONISASI DATA',
    drawer_admin_btn_standings: 'Update Klasemen Terbaru',
    drawer_admin_btn_standings_sub: 'Sinkronisasi instan dari ileague.id (~1 detik)',
    drawer_admin_btn_fixtures: 'Update Seluruh Jadwal & Hasil',
    drawer_admin_btn_fixtures_sub: 'Pindai pekan 1 hingga pekan 27',
    drawer_admin_logout: '🔒 Keluar dari Mode Admin',
    search_placeholder: 'Cari klub, stadion, atau jadwal laga...',
    search_prompt: 'Ketik nama klub seperti "PSPS", "PERSIKAD", "SEMEN PADANG"...',
    search_empty: 'Tidak ada klub yang cocok dengan "{q}".',
    search_view_fixtures: 'Lihat Jadwal ➔',
    toast_reset_title: 'Reset Berhasil',
    toast_reset_msg: 'Data simulasi telah dikembalikan ke kondisi awal.',

    // PSGC Ciamis Odds & Analysis
    psgc_hero_title: 'Analisis Peluang & Peta Posisi PSGC Ciamis',
    psgc_hero_subtitle: 'Pembaruan otomatis dari data resmi klasemen & jadwal. Tidak dipengaruhi oleh sesi simulasi.',
    psgc_stat_current_rank: 'Peringkat Saat Ini',
    psgc_stat_current_pts: 'Poin Saat Ini',
    psgc_stat_gd: 'Selisih Gol (SG)',
    psgc_stat_matches_left: 'Sisa Pertandingan',
    psgc_stat_max_pts: 'Maksimal Poin',
    psgc_stat_gap_safe: 'Jarak ke Zona Aman (P8)',
    psgc_stat_gap_releg: 'Jarak ke Degradasi Langsung (P10)',
    psgc_record: 'Rekor: {w}M {d}S {l}K',
    psgc_matches_breakdown: 'Putaran 2: {r2} laga • Putaran 3: {r3} laga',
    psgc_gap_behind: '{pts} Poin di belakang Adhyaksa FC',
    psgc_gap_behind_club: '{pts} Poin di belakang {club}',
    psgc_gap_ahead: '+{pts} Poin di atas Persiku',
    psgc_gap_ahead_club: '+{pts} Poin di atas {club}',

    // Section 2: Probability Matrix Cards
    psgc_matrix_title: 'Matriks Probabilitas Akhir Musim',
    psgc_matrix_subtitle: 'Dihitung dari 1.000 simulasi Monte Carlo model Poisson berbasis performa resmi musim berjalan.',
    psgc_prob_promotion: 'Peluang Promosi (P1 / P2)',
    psgc_prob_promotion_desc: 'Tiket Grand Final atau Play-off Promosi ke BRI Super League',
    psgc_prob_survival: 'Peluang Bertahan Aman (P3 - P8)',
    psgc_prob_survival_desc: 'Bertahan di Liga 2 tanpa babak play-off',
    psgc_prob_playoff: 'Play-off Degradasi (P9)',
    psgc_prob_playoff_desc: 'Peringkat 9: Babak Play-off Degradasi melawan runner-up grup lain',
    psgc_prob_relegation: 'Degradasi Langsung (P10)',
    psgc_prob_relegation_desc: 'Peringkat 10: Turun kasta otomatis ke Liga Nusantara',

    // Section 3: Win Requirements Roadmap
    psgc_roadmap_title: 'Peta Syarat Kemenangan & Poin Kritis (Magic Numbers)',
    psgc_roadmap_subtitle: 'Target matematis pasti untuk mengunci keselamatan dan menghindari degradasi.',
    psgc_target_direct_safety: 'Kunci Aman dari Degradasi Langsung (P10)',
    psgc_target_full_safety: 'Kunci Zona Bertahan Penuh (P8 ke atas)',
    psgc_target_promotion: 'Target Menembus Play-off Promosi (P2)',
    psgc_pts_needed: 'Butuh {pts} Poin ({wins} Kemenangan)',
    psgc_status_active_chase: 'Dalam Jangkauan Realistis',
    psgc_status_critical: 'Prioritas Utama',
    psgc_status_longshot: 'Tantangan Matematis Berat',

    // Section 4: Remaining Fixtures Putaran 2
    psgc_fixtures_title: 'Jadwal Sisa Putaran 2 & Analisis Target Poin',
    psgc_fixtures_subtitle: 'Klasifikasi pertandingan Pekan 10–18: Target Menang Realistis, Laga Ketat, dan Laga Berat.',
    psgc_fixtures_completed: 'Seluruh Laga Putaran 2 Telah Selesai',
    psgc_fixtures_completed_desc: 'Semua pertandingan Pekan 10–18 telah berstatus selesai (FT). Metrik posisi, H2H, dan probabilitas di atas sudah diperbarui berdasarkan hasil terkini.',
    psgc_th_matchweek: 'Pekan',
    psgc_th_date: 'Tanggal',
    psgc_th_opponent: 'Lawan',
    psgc_th_venue: 'Kandang / Tandang',
    psgc_th_class: 'Klasifikasi Laga',
    psgc_th_h2h: 'Head-to-Head',
    psgc_th_notes: 'Catatan Strategis',
    psgc_home: 'Kandang',
    psgc_away: 'Tandang',
    psgc_class_calculated_win: 'Target Menang',
    psgc_class_tight: 'Laga Ketat (50-50)',
    psgc_class_tough: 'Tantangan Berat',
    psgc_badge_six_pointer: 'Laga 6 Poin (Rival Langsung)',
    psgc_h2h_record: '{w}M - {d}S - {l}K',
    psgc_h2h_none: 'Belum Ada Pertemuan',
    psgc_h2h_home_short: 'Kandang',
    psgc_h2h_away_short: 'Tandang',
    psgc_h2h_mw: 'Pekan {pekan}',
    psgc_h2h_gd: 'SG {gd}',
    psgc_notes_persiku: 'Kandang vs Juru Kunci (Persiku) - Wajib 3 Poin',
    psgc_notes_adhyaksa: 'Duel Langsung Perebutan Posisi 8 - Peluang Menyalip',
    psgc_notes_persiraja: 'Duel Rival Papan Bawah di Ciamis',
    psgc_notes_psps: 'Menjamu Pemuncak Klasemen di Stadion Galuh',
    psgc_notes_psis: 'Laga Tandang di Stadion Jatidiri',
    psgc_notes_semen_padang: 'Laga Tandang di Patriot Chandra Bhaga',
    psgc_notes_sumsel: 'Laga Tandang di Gelora Sriwijaya Jakabaring',
    psgc_notes_persikad: 'Menjamu Tim Peringkat 3 di Ciamis',
    psgc_notes_psms: 'Laga Pamungkas Putaran 2 di Markas PSMS',

    // Opening Disclaimer Modal & Footer Trigger
    disclaimer_badge_unofficial: 'UNOFFICIAL FAN-MADE',
    disclaimer_badge_notice: 'PEMBERITAHUAN PENTING',
    disclaimer_title: 'Selamat Datang di Singacala Hub',
    disclaimer_subtitle: 'Terima kasih telah berkunjung! Mohon baca informasi singkat berikut sebelum melanjutkan.',
    disclaimer_summary_text: 'Singacala Hub adalah proyek hobi dan edukasi independen buatan penggemar untuk visualisasi data sepak bola, sehingga bersifat tidak resmi, non-komersial, serta tidak berafiliasi dengan federasi (PSSI), operator liga (I.League), sponsor resmi, maupun klub terkait—dengan seluruh nama klub, logo, dan merek dagang tetap menjadi milik pemegang hak cipta masing-masing. Data klasemen, jadwal, dan statistik dirujuk dari portal publik <a href="https://www.ileague.id" target="_blank" rel="noopener">ileague.id</a> dan dapat mengalami jeda pembaruan atau perbedaan dibanding rilis resmi, sementara fitur Simulator Liga dan Peluang PSGC hanya menyajikan proyeksi matematis (termasuk simulasi Monte Carlo) serta skenario pengguna untuk hiburan dan analisis semata, bukan hasil atau keputusan resmi liga.',
    disclaimer_footer_note: 'Dengan melanjutkan, Anda memahami bahwa situs ini bersifat tidak resmi.',
    disclaimer_footer_note_review: 'Anda dapat membuka pemberitahuan ini kapan saja melalui bagian bawah halaman.',
    disclaimer_btn_accept: 'Mengerti & Lanjutkan',
    disclaimer_btn_close: 'Tutup',
    disclaimer_close_aria: 'Tutup Disclaimer',
    footer_disclaimer_btn: 'Disclaimer'
  },
  en: {
    // Header Navigation
    nav_standings: 'Standings',
    nav_fixtures: 'Fixtures & Results',
    nav_stats: 'Team Statistics',
    nav_simulation: 'League Simulator',
    nav_home_aria: 'Singacala Hub Home',
    nav_menu_aria: 'Options & Sync Menu',
    nav_search_aria: 'Search Clubs & Matches',

    // Mobile Bottom Navigation
    mob_standings: 'Standings',
    mob_fixtures: 'Fixtures',
    mob_stats: 'Stats',
    mob_simulation: 'Simulator',

    // Standings View
    standings_title: 'Singacala Hub — Standings',
    standings_updated_prefix: 'Updated:',
    subnav_table: 'Table',
    subnav_progression: 'Progression',
    subnav_psgc: 'PSGC Odds',
    th_pos: 'Pos',
    th_club: 'Club',
    th_pts: 'Pts',
    th_p: 'P',
    th_w: 'W',
    th_d: 'D',
    th_l: 'L',
    th_gf: 'GF',
    th_ga: 'GA',
    th_gd: 'GD',
    th_form: 'Last 5',
    standings_loading: 'Loading standings data...',

    // Tournament Status / Legend
    status_grandfinal: 'Grand Final & Automatic Promotion (P1)',
    status_grandfinal_full: 'Grand Final & Automatic Promotion (Rank 1)',
    status_grandfinal_desc: 'Rank 1: Grand Final & Automatic Promotion to BRI Super League',

    status_playoff_promo: 'Promotion Play-off (P2)',
    status_playoff_promo_full: 'Promotion Play-off (Rank 2)',
    status_playoff_promo_desc: 'Rank 2: Promotion Play-off to BRI Super League',

    status_playoff_releg: 'Relegation Play-off (P9)',
    status_playoff_releg_full: 'Relegation Play-off (Rank 9)',
    status_playoff_releg_desc: 'Rank 9: Relegation Play-off to Liga Nusantara',

    status_relegation: 'Direct Relegation (P10)',
    status_relegation_full: 'Direct Relegation (Rank 10)',
    status_relegation_desc: 'Rank 10: Direct Relegation to Liga Nusantara',

    status_safe_desc: 'Rank {pos}: Remains in Liga 2',

    // Progression Chart
    progression_title: 'Week-by-Week Standings Progression',
    progression_subtitle: 'Dynamic chart of team rankings from Matchweek 1 to present. Rank 1 at the top.',
    range_select_label: 'Week Range:',
    range_current: 'Current Matchweeks (MW 1 - MW {latest})',
    range_all: 'All Matchweeks (MW 1 - MW 27)',
    range_r1: 'Round 1 (MW 1 - MW 9)',
    range_r2: 'Round 2 (MW 10 - MW 18)',
    range_r3: 'Round 3 (MW 19 - MW 27)',
    all_clubs: 'All Clubs',
    chart_pekan: 'Matchweek {week}',

    // Fixtures View
    fixtures_title: 'Fixtures & Results',
    filter_matchweek: 'Matchweek',
    filter_club: 'Club',
    all_matchweeks: 'All Matchweeks',
    all_matchweeks_range: 'All Matchweeks (1–{total})',
    matchweek_num: 'Matchweek {week}',
    all_clubs_filter: 'All Clubs (Group A)',
    prev_week_aria: 'Previous Week',
    next_week_aria: 'Next Week',
    no_matches_title: 'No Matches Found',
    no_matches_desc: 'No matches found for the selected matchweek and club filter.',
    status_ft: 'Full Time',
    status_vs: 'VS',
    schedule_tbd: 'TBD',

    // Stats View
    stats_title: 'Team Statistics',
    stats_subtitle: 'Club performance statistics for Group A 2026/27 Season',
    cat_all: 'All Metrics (11)',
    cat_performance: 'Performance & Points (3)',
    cat_attack: 'Attack & Goals (3)',
    cat_defense: 'Defense & Goalkeeping (3)',
    cat_home_away: 'Home / Away (2)',
    stat_points_per_game: 'Points per game',
    stat_win_rate: 'Win rate',
    stat_unbeaten_rate: 'Unbeaten rate',
    stat_goal_diff: 'Goal difference (GD)',
    stat_goals_per_game: 'Goals per game',
    stat_total_goals: 'Total goals scored (GF)',
    stat_clean_sheets: 'Clean sheets',
    stat_fewest_conceded: 'Fewest goals conceded (GA)',
    stat_goals_conceded_per_game: 'Goals conceded per game',
    stat_home_record: 'Home record',
    stat_away_record: 'Away record',
    stat_back_btn: 'Back to Overview',
    stat_label: 'Stats',
    stat_clubs: 'Clubs',
    stat_all_clubs: 'All Clubs',

    // Simulation View
    sim_title: 'League Simulator & Season Projection',
    sim_subtitle: 'Interactive 27-matchweek simulation. Real-time predictions for the final standings, Grand Final spots, Promotion Play-offs, and relegation zone.',
    sim_tab_standings: '🏆 Standings Table',
    sim_tab_fixtures: '📅 Fixtures & Score Input',
    sim_table_title: 'Live Simulated Standings',
    sim_table_subtitle: 'Automatic calculation of points, GD, and official PSSI Head-to-Head rules.',
    sim_clear_filter: '✕ Clear Filter ({club})',
    sim_progress_done: '{ftCount} / {total} Matches Completed',
    sim_status_complete: '• 2026/27 Season Fully Completed (27 MWs)',
    sim_status_active: '• Active Simulation Mode',
    sim_r1_chip: 'Round 1: Matchweeks 1-9 (Finished)',
    sim_r2_chip_done: 'Round 2: Matchweeks 10-18 (Finished)',
    sim_r2_chip_active: 'Round 2: Matchweeks 10-18 (In Progress)',
    sim_r3_chip_done: 'Round 3: Matchweeks 19-27 (Finished)',
    sim_r3_chip_active: 'Round 3: Matchweeks 19-27 (Available)',
    sim_r3_chip_locked: 'Round 3: Matchweeks 19-27 (Locked)',
    sim_btn_week: 'Simulate Matchweek {week}',
    sim_btn_r2: 'Simulate through Matchweek 18',
    sim_btn_all: 'Simulate Entire Season (thru MW 27)',
    sim_btn_reset: 'Reset Simulation',
    sim_btn_reset_title: 'Reset all scores to initial state',
    sim_round_tab1: 'Round 1 (1–9)',
    sim_round_tab2: 'Round 2 (10–18)',
    sim_round_tab3: 'Round 3 (19–27)',
    sim_week_badge: 'MATCHWEEK {week}',
    sim_week_tag_r1: 'Round 1 (Official Data)',
    sim_week_tag_r2: 'Round 2 (Official Schedule)',
    sim_week_tag_r3: 'Round 3 (PSSI Regulations)',
    sim_badge_ft: 'FT',
    sim_badge_upcoming: 'UPCOMING',
    sim_payoff_title: 'Season Final Outcome (27-Matchweek Projection)',
    sim_payoff_tag: 'Projection Based on Official PSSI 2026/27 Regulations',
    sim_payoff_p1: 'Grand Final & Automatic Promotion Spot (P1)',
    sim_payoff_p2: 'Promotion Play-off Spot (P2)',
    sim_payoff_p9: 'Relegation Play-off Spot (P9)',
    sim_payoff_p10: 'Direct Relegation to Liga Nusantara (P10)',

    // Round 3 Notice Banner
    r3_notice_locked_title: 'Round 3 Locked • Complete Round 2',
    r3_notice_locked_desc: 'Round 3 simulation requires final Round 2 (Matchweek 18) standings to determine 5 home / 4 away allocations and PSSI regulatory scenarios.',
    r3_notice_locked_btn: 'Simulate through Matchweek 18 First',
    r3_notice_ready_title: 'Round 2 Complete • Round 3 Ready to Generate',
    r3_notice_ready_desc: 'Final Round 2 standings are set. Click below to generate Round 3 fixtures based on PSSI Regulations Article 7.',
    r3_notice_ready_btn: 'Generate Round 3 Fixtures Automatically',
    r3_notice_active_title: 'Round 3 Unlocked • PSSI Regulations Activated',
    r3_notice_active_btn: 'View Regulations & Schedule Reasoning',

    // Round 3 Regulatory Modal
    r3_modal_tag: 'ROUND 3 • {group}',
    r3_modal_subtag: 'PSSI Regulations Article 7 Paragraphs 3 & 4',
    r3_modal_title: 'Round 3 Regulatory Fixtures & Reasoning',
    r3_modal_title_scenario: 'Round 3 Fixture Results: {scenarioTitle}',
    r3_modal_subtitle: 'Automated draw for Matchweeks 19–27 based on final Round 2 standings.',
    r3_modal_subtitle_default: 'Fixture schedule and home/away allocation based on PSSI Regulations Article 7 Paragraphs 3 & 4.',
    r3_summary_top5: '<strong>Top 5:</strong> 5 Home / 4 Away',
    r3_summary_bottom5: '<strong>Positions 6–10:</strong> 4 Home / 5 Away',
    r3_summary_ramadhan: '<strong>Ramadhan Clause (Article 7 Paragraph 4):</strong> PERSIRAJA (Rank #{rank}) away in Matchweeks 19, 20, 21 • Scenario ({letter})',
    r3_summary_standard: '<strong>Standard Matrix:</strong> Preliminary Round 3 (Article 7 Paragraph 3 Section III)',
    r3_week_tab: 'Matchweek {week}',
    r3_modal_footer_matches: 'Total 45 Matches',
    r3_modal_footer_quota: 'Top 5: 5 Home / 4 Away • Positions 6–10: 4 Home / 5 Away',
    r3_modal_btn_close: 'Close',
    r3_modal_btn_proceed: 'Proceed to Simulation',

    // Drawer & Modals
    drawer_nav_title: 'MENU NAVIGATION',
    drawer_standings: '🏆 Full Standings Table',
    drawer_fixtures: '📅 Fixtures & Results',
    drawer_stats: '📈 Team Analysis & Stats',
    drawer_simulation: '🎮 League Simulator 2026/27',
    drawer_info_title: 'DATA SOURCE INFO',
    drawer_sync_prefix: 'Last updated:',
    drawer_admin_title: 'ADMIN: DATA SYNC',
    drawer_admin_btn_standings: 'Update Latest Standings',
    drawer_admin_btn_standings_sub: 'Instant sync from ileague.id (~1 sec)',
    drawer_admin_btn_fixtures: 'Update All Fixtures & Results',
    drawer_admin_btn_fixtures_sub: 'Scan matchweek 1 through matchweek 27',
    drawer_admin_logout: '🔒 Exit Admin Mode',
    search_placeholder: 'Search clubs, stadiums, or fixtures...',
    search_prompt: 'Type club name like "PSPS", "PERSIKAD", "SEMEN PADANG"...',
    search_empty: 'No clubs found matching "{q}".',
    search_view_fixtures: 'View Fixtures ➔',
    toast_reset_title: 'Reset Successful',
    toast_reset_msg: 'Simulation data has been reverted to initial state.',

    // PSGC Ciamis Odds & Analysis
    psgc_hero_title: 'PSGC Ciamis Odds & Position Map',
    psgc_hero_subtitle: 'Automatically updated from official standings & fixtures. Not affected by simulation trials.',
    psgc_stat_current_rank: 'Current Rank',
    psgc_stat_current_pts: 'Current Points',
    psgc_stat_gd: 'Goal Difference (GD)',
    psgc_stat_matches_left: 'Matches Remaining',
    psgc_stat_max_pts: 'Max Possible Points',
    psgc_stat_gap_safe: 'Gap to Safe Zone (P8)',
    psgc_stat_gap_releg: 'Gap to Direct Relegation (P10)',
    psgc_record: 'Record: {w}W {d}D {l}L',
    psgc_matches_breakdown: 'Round 2: {r2} matches • Round 3: {r3} matches',
    psgc_gap_behind: '{pts} Points behind Adhyaksa FC',
    psgc_gap_behind_club: '{pts} Points behind {club}',
    psgc_gap_ahead: '+{pts} Points ahead of Persiku',
    psgc_gap_ahead_club: '+{pts} Points ahead of {club}',

    // Section 2: Probability Matrix Cards
    psgc_matrix_title: 'Season Outcome Probability Matrix',
    psgc_matrix_subtitle: 'Calculated from 1,000 Poisson Monte Carlo runs based on real current-season performance.',
    psgc_prob_promotion: 'Promotion Chance (P1 / P2)',
    psgc_prob_promotion_desc: 'Grand Final or Promotion Play-off to BRI Super League',
    psgc_prob_survival: 'Safe Zone Survival (P3 - P8)',
    psgc_prob_survival_desc: 'Remain in Liga 2 without play-offs',
    psgc_prob_playoff: 'Relegation Play-off (P9)',
    psgc_prob_playoff_desc: 'Rank 9: Relegation play-off against other group\'s runner-up',
    psgc_prob_relegation: 'Direct Relegation (P10)',
    psgc_prob_relegation_desc: 'Rank 10: Direct relegation to Liga Nusantara',

    // Section 3: Win Requirements Roadmap
    psgc_roadmap_title: 'Win Requirements & Magic Numbers Roadmap',
    psgc_roadmap_subtitle: 'Definite mathematical thresholds to secure survival and avoid relegation.',
    psgc_target_direct_safety: 'Eliminate Direct Relegation (P10)',
    psgc_target_full_safety: 'Lock Safe Zone (P8 or higher)',
    psgc_target_promotion: 'Promotion Play-off Contention (P2)',
    psgc_pts_needed: 'Requires {pts} Points ({wins} Wins)',
    psgc_status_active_chase: 'Within Realistic Reach',
    psgc_status_critical: 'Top Priority',
    psgc_status_longshot: 'High Mathematical Challenge',

    // Section 4: Remaining Fixtures Putaran 2
    psgc_fixtures_title: 'Round 2 Remaining Fixtures & Target Points Analysis',
    psgc_fixtures_subtitle: 'Match classification for Matchweeks 10–18: Calculated Wins, Tight Matches, and Tough Fixtures.',
    psgc_fixtures_completed: 'All Round 2 Fixtures Completed',
    psgc_fixtures_completed_desc: 'All Matchweeks 10–18 matches are Full Time (FT). Standings metrics, Head-to-Head records, and probabilities above reflect the latest results.',
    psgc_th_matchweek: 'MW',
    psgc_th_date: 'Date',
    psgc_th_opponent: 'Opponent',
    psgc_th_venue: 'Home / Away',
    psgc_th_class: 'Fixture Difficulty',
    psgc_th_h2h: 'Head-to-Head',
    psgc_th_notes: 'Strategic Notes',
    psgc_home: 'Home',
    psgc_away: 'Away',
    psgc_class_calculated_win: 'Calculated Win Target',
    psgc_class_tight: 'Tight Match (50-50)',
    psgc_class_tough: 'Tough Fixture',
    psgc_badge_six_pointer: '6-Pointer Relegation Duel',
    psgc_h2h_record: '{w}W - {d}D - {l}L',
    psgc_h2h_none: 'No Prior Meetings',
    psgc_h2h_home_short: 'Home',
    psgc_h2h_away_short: 'Away',
    psgc_h2h_mw: 'MW {pekan}',
    psgc_h2h_gd: 'GD {gd}',
    psgc_notes_persiku: 'Home vs Bottom-placed Persiku - Must-win 3 Pts',
    psgc_notes_adhyaksa: 'Direct Clash for 8th Place - Overtake Opportunity',
    psgc_notes_persiraja: 'Bottom-table Rival Clash at Home',
    psgc_notes_psps: 'Hosting Table Leaders at Galuh Stadium',
    psgc_notes_psis: 'Away Fixture at Jatidiri Stadium',
    psgc_notes_semen_padang: 'Away Fixture at Patriot Chandra Bhaga',
    psgc_notes_sumsel: 'Away Fixture at Gelora Sriwijaya Jakabaring',
    psgc_notes_persikad: 'Hosting 3rd-placed Team at Ciamis',
    psgc_notes_psms: 'Final Round 2 Fixture at PSMS Home Ground',

    // Opening Disclaimer Modal & Footer Trigger
    disclaimer_badge_unofficial: 'UNOFFICIAL FAN-MADE',
    disclaimer_badge_notice: 'IMPORTANT NOTICE',
    disclaimer_title: 'Welcome to Singacala Hub',
    disclaimer_subtitle: 'Thanks for visiting! Please read the brief notice below before continuing.',
    disclaimer_summary_text: 'Singacala Hub is an independent, fan-made hobby and educational project for football data visualization; it is strictly unofficial, non-commercial, and not affiliated with the federation (PSSI), league operator (I.League), official sponsors, or any clubs, with all club names, logos, and trademarks remaining the property of their respective copyright holders. Standings, fixtures, and statistics are referenced from the public portal <a href="https://www.ileague.id" target="_blank" rel="noopener">ileague.id</a> and may experience sync delays or discrepancies compared to official releases, while the League Simulator and PSGC Odds features provide mathematical projections (including Monte Carlo simulations) and user-defined scenarios for entertainment and analysis only—not official match results or league rulings.',
    disclaimer_footer_note: 'By continuing, you acknowledge that this site is unofficial and fan-made.',
    disclaimer_footer_note_review: 'You can reopen this notice anytime from the page footer.',
    disclaimer_btn_accept: 'Understand & Continue',
    disclaimer_btn_close: 'Close',
    disclaimer_close_aria: 'Close Disclaimer',
    footer_disclaimer_btn: 'Disclaimer'
  }
};

export function t(key, params = {}, lang = getLanguage()) {
  const dict = translations[lang] || translations.id;
  let text = dict[key] || translations.id[key] || key;
  if (params && typeof params === 'object') {
    Object.keys(params).forEach((p) => {
      text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
    });
  }
  return text;
}

export function formatMatchDate(dateStr, lang = getLanguage()) {
  if (!dateStr) return dateStr;

  const idDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const enDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const idMonths = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const enMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  let result = dateStr;
  if (lang === 'en') {
    idDays.forEach((d, i) => {
      result = result.replace(new RegExp(`\\b${d}\\b`, 'g'), enDays[i]);
    });
    idMonths.forEach((m, i) => {
      result = result.replace(new RegExp(`\\b${m}\\b`, 'g'), enMonths[i]);
    });
    result = result.replace('Jadwal Menyusul', 'TBD');
  } else {
    enDays.forEach((d, i) => {
      result = result.replace(new RegExp(`\\b${d}\\b`, 'g'), idDays[i]);
    });
    enMonths.forEach((m, i) => {
      result = result.replace(new RegExp(`\\b${m}\\b`, 'g'), idMonths[i]);
    });
    result = result.replace('TBD', 'Jadwal Menyusul');
  }

  return result;
}

export function translateReason(reason, lang = getLanguage()) {
  if (!reason) return reason;
  if (lang !== 'en') return reason;

  let tag = reason.tag;
  if (tag === 'Klausul Ramadhan') tag = 'Ramadhan Clause';
  else if (tag === 'Kompensasi Ramadhan') tag = 'Ramadhan Compensation';
  else if (tag === 'Kuota Home Top 5') tag = 'Top 5 Home Quota';
  else if (tag === 'Distribusi Matriks PSSI') tag = 'PSSI Matrix Allocation';
  else if (tag === 'Duel Pot Unggulan') tag = 'Top Pot Clash';
  else if (tag === 'Duel Pot Bawah' || tag === 'Rotasi Pot Bawah') tag = 'Bottom Pot Rotation';
  else if (tag === 'Regulasi PSSI' || tag === 'Regulasi Putaran 3') tag = 'Round 3 Regulations';

  let rule = reason.rule || '';
  rule = rule
    .replace(/Pasal 7 Ayat 4/g, 'Article 7 Paragraph 4')
    .replace(/Pasal 7 Ayat 3/g, 'Article 7 Paragraph 3')
    .replace(/Skenario/g, 'Scenario')
    .replace(/Bagian III/g, 'Section III')
    .replace(/Matriks Standar/g, 'Standard Matrix');

  let text = reason.text || '';
  if (reason.isRamadhan) {
    if (text.includes('wajib bertanding tandang')) {
      text = text
        .replace('Klausul Khusus Ramadhan (Pasal 7 Ayat 4):', 'Ramadhan Special Clause (Article 7 Paragraph 4):')
        .replace('wajib bertanding tandang pada 3 pekan awal (Pekan 19–21).', 'must play away in the first 3 matchweeks (MW 19–21).')
        .replace('Berdasarkan Skenario', 'Under Scenario')
        .replace('bertindak sebagai tuan rumah.', 'hosts the match.');
    } else if (text.includes('Setelah menyelesaikan kewajiban')) {
      text = text
        .replace('Skenario', 'Scenario')
        .replace('Pasal 7 Ayat 4:', 'Article 7 Paragraph 4:')
        .replace('Setelah menyelesaikan kewajiban 3 laga tandang pembuka Ramadhan,', 'After completing the 3 opening away matches during Ramadhan,')
        .replace('memperoleh alokasi kandang di Pekan', 'receives a home allocation in MW')
        .replace('guna menggenapi kuota', 'to fulfill the quota of')
        .replace('laga home Putaran 3 melawan', 'home matches in Round 3 against');
    }
  } else if (text.includes('berhak atas alokasi 5 laga kandang')) {
    text = text
      .replace('Pasal 7 Ayat 3:', 'Article 7 Paragraph 3:')
      .replace('Top 5 Putaran 2) berhak atas alokasi 5 laga kandang.', 'Round 2 Top 5) is entitled to 5 home matches.')
      .replace('Status tuan rumah diberikan pada pertemuan ke-3 melawan tim peringkat bawah', 'Hosting rights awarded for the 3rd encounter against lower-ranked')
      .replace('setelah berbagi 1H & 1A di Putaran 1 & 2.', 'after sharing 1H & 1A in Rounds 1 & 2.');
  } else if (text.includes('Matriks Regulasi Babak Pendahuluan:')) {
    text = text
      .replace('Matriks Regulasi Babak Pendahuluan:', 'Preliminary Round Regulation Matrix:')
      .replace('dialokasikan sebagai tuan rumah atas tim unggulan', 'is allocated as host against seeded')
      .replace('guna menggenapi kuota 4 laga kandang klub peringkat 6–10 sesuai jadwal baku PSSI.', 'to fulfill the 4-home-match quota for clubs ranked 6–10 per official PSSI schedule.');
  } else if (text.includes('Duel Pot Unggulan:')) {
    text = text
      .replace('Duel Pot Unggulan: Pertemuan sesama Top 5 antara', 'Top Pot Clash: Top 5 matchup between')
      .replace('Hak tuan rumah ditentukan oleh matriks regulasi Babak Pendahuluan untuk menjaga keseimbangan 5 laga kandang kedua tim.', 'Hosting rights determined by Preliminary Round regulation matrix to maintain 5 home matches balance for both teams.');
  } else if (text.includes('Rotasi Pot Bawah:') || text.includes('Duel Pot Bawah:')) {
    text = text
      .replace('Rotasi Pot Bawah: Pertemuan peringkat 6–10 antara', 'Bottom Pot Rotation: Matchup between clubs ranked 6–10 between')
      .replace('Duel Pot Bawah: Pertemuan sesama tim peringkat 6–10 antara', 'Bottom Pot Clash: Encounter between clubs ranked 6–10 between')
      .replace('Status kandang ditentukan matriks regulasi guna menjamin kuota 4 laga kandang kedua tim.', 'Hosting status determined by regulatory matrix to guarantee 4 home matches quota for both teams.')
      .replace('Hak tuan rumah ditentukan oleh matriks Babak Pendahuluan Putaran 3 PSSI.', 'Hosting rights determined by PSSI Round 3 preliminary matrix.');
  } else if (text.includes('Penetapan tuan rumah')) {
    text = text
      .replace('Penetapan tuan rumah', 'Hosting designation for')
      .replace('berdasarkan Matriks Regulasi Babak Pendahuluan Putaran 3.', 'based on Preliminary Round 3 Regulation Matrix.');
  }

  return {
    ...reason,
    tag,
    rule,
    text
  };
}

export function translateScenarioTitle(title, lang = getLanguage()) {
  if (!title || lang !== 'en') return title;
  return title
    .replace(/^Skenario/, 'Scenario')
    .replace(/Peringkat/, 'Rank')
    .replace(/Matriks Standar Babak Pendahuluan/i, 'Preliminary Round Standard Matrix')
    .replace(/standar/i, 'Standard Matrix');
}

export function applyI18n(lang = getLanguage()) {
  document.documentElement.lang = lang;

  // Language switcher active state (header & disclaimer modal)
  ['lang-switcher', 'disclaimer-lang-switcher'].forEach((id) => {
    const switcher = document.getElementById(id);
    if (!switcher) return;
    switcher.querySelectorAll('.lang-segment').forEach((btn) => {
      const active = btn.dataset.lang === lang;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  });

  // Brand link
  const brand = document.getElementById('brand-home-link');
  if (brand) brand.setAttribute('aria-label', t('nav_home_aria', {}, lang));

  // Top nav pills
  const navMap = {
    'nav-btn-standings': 'nav_standings',
    'nav-btn-fixtures': 'nav_fixtures',
    'nav-btn-stats': 'nav_stats',
    'nav-btn-simulation': 'nav_simulation',
  };
  Object.entries(navMap).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key, {}, lang);
  });

  // Action buttons
  const menuBtn = document.getElementById('btn-open-menu');
  if (menuBtn) menuBtn.setAttribute('aria-label', t('nav_menu_aria', {}, lang));
  const searchBtn = document.getElementById('btn-open-search');
  if (searchBtn) searchBtn.setAttribute('aria-label', t('nav_search_aria', {}, lang));

  // Mobile Bottom Nav
  const mobMap = {
    'mobile-nav-standings': 'mob_standings',
    'mobile-nav-fixtures': 'mob_fixtures',
    'mobile-nav-stats': 'mob_stats',
    'mobile-nav-simulation': 'mob_simulation',
  };
  Object.entries(mobMap).forEach(([id, key]) => {
    const el = document.querySelector(`#${id} .mobile-nav-label`);
    if (el) el.textContent = t(key, {}, lang);
  });

  // Standings Subview Bar
  const standingsTitle = document.querySelector('#view-standings .page-title');
  if (standingsTitle) standingsTitle.textContent = t('standings_title', {}, lang);

  const subviewTable = document.querySelector('#btn-subview-table span');
  if (subviewTable) subviewTable.textContent = t('subnav_table', {}, lang);
  const subviewProg = document.querySelector('#btn-subview-progression span');
  if (subviewProg) subviewProg.textContent = t('subnav_progression', {}, lang);
  const subviewPsgc = document.querySelector('#btn-subview-psgc span');
  if (subviewPsgc) subviewPsgc.textContent = t('subnav_psgc', {}, lang);

  // If PSGC panel is visible, re-render it in new language
  if (typeof window.renderPsgcOddsPanel === 'function') {
    const psgcPanel = document.getElementById('standings-panel-psgc');
    if (psgcPanel && psgcPanel.style.display !== 'none') {
      window.renderPsgcOddsPanel();
    }
  }

  // Standings Table Headers
  const table = document.getElementById('standings-table');
  if (table) {
    const isEn = lang === 'en';
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

  // Standings Legends
  const legends = document.querySelectorAll('.standings-legend-footer');
  legends.forEach((legend) => {
    const items = legend.querySelectorAll('.legend-item span:not(.legend-color-indicator)');
    if (items.length >= 4) {
      if (legend.classList.contains('sim-legend')) {
        items[0].textContent = t('status_grandfinal', {}, lang);
        items[1].textContent = t('status_playoff_promo', {}, lang);
        items[2].textContent = t('status_playoff_releg', {}, lang);
        items[3].textContent = t('status_relegation', {}, lang);
      } else {
        items[0].textContent = t('status_grandfinal_full', {}, lang);
        items[1].textContent = t('status_playoff_promo_full', {}, lang);
        items[2].textContent = t('status_playoff_releg_full', {}, lang);
        items[3].textContent = t('status_relegation_full', {}, lang);
      }
    }
  });

  // Progression Chart Controls
  const progTitle = document.querySelector('.progression-title');
  if (progTitle) progTitle.textContent = t('progression_title', {}, lang);
  const progSub = document.querySelector('.progression-subtitle');
  if (progSub) progSub.textContent = t('progression_subtitle', {}, lang);
  const progLabel = document.querySelector('.range-select-label');
  if (progLabel) progLabel.textContent = t('range_select_label', {}, lang);

  const rangeSelect = document.getElementById('progression-range-select');
  if (rangeSelect) {
    const isEn = lang === 'en';
    const allOpt = rangeSelect.querySelector('option[value="ALL"]');
    if (allOpt) allOpt.textContent = isEn ? 'All Matchweeks (MW 1 - MW 27)' : 'Semua Pekan (P1 - P27)';
    const r1Opt = rangeSelect.querySelector('option[value="R1"]');
    if (r1Opt) r1Opt.textContent = isEn ? 'Round 1 (MW 1 - MW 9)' : 'Putaran 1 (P1 - P9)';
    const r2Opt = rangeSelect.querySelector('option[value="R2"]');
    if (r2Opt) r2Opt.textContent = isEn ? 'Round 2 (MW 10 - MW 18)' : 'Putaran 2 (P10 - P18)';
    const r3Opt = rangeSelect.querySelector('option[value="R3"]');
    if (r3Opt) r3Opt.textContent = isEn ? 'Round 3 (MW 19 - MW 27)' : 'Putaran 3 (P19 - P27)';
  }

  // Fixtures filter labels & ARIA
  const fixturesTitle = document.querySelector('#view-fixtures .page-title');
  if (fixturesTitle) fixturesTitle.textContent = t('fixtures_title', {}, lang);

  const filterLabels = document.querySelectorAll('.fixtures-filter-bar .filter-mini-label');
  if (filterLabels.length >= 2) {
    filterLabels[0].textContent = t('filter_matchweek', {}, lang);
    filterLabels[1].textContent = t('filter_club', {}, lang);
  }
  const selectedClubText = document.getElementById('selected-club-text');
  if (selectedClubText && (!selectedClubText.dataset.club || selectedClubText.dataset.club === 'all' || selectedClubText.textContent.includes('Klub') || selectedClubText.textContent.includes('Clubs'))) {
    selectedClubText.textContent = t('all_clubs', {}, lang);
  }
  const prevWeekBtn = document.getElementById('btn-prev-week');
  if (prevWeekBtn) prevWeekBtn.setAttribute('aria-label', t('prev_week_aria', {}, lang));
  const nextWeekBtn = document.getElementById('btn-next-week');
  if (nextWeekBtn) nextWeekBtn.setAttribute('aria-label', t('next_week_aria', {}, lang));

  // Stats
  const statsSub = document.getElementById('stats-subtitle');
  if (statsSub) statsSub.textContent = t('stats_subtitle', {}, lang);

  const statsPills = {
    'all': 'cat_all',
    'performance': 'cat_performance',
    'attack': 'cat_attack',
    'defense': 'cat_defense',
    'home-away': 'cat_home_away',
  };
  Object.entries(statsPills).forEach(([cat, key]) => {
    const pill = document.querySelector(`.stats-cat-pill[data-category="${cat}"]`);
    if (pill) pill.textContent = t(key, {}, lang);
  });

  const statBackBtn = document.querySelector('#btn-stat-back-overview span');
  if (statBackBtn) statBackBtn.textContent = t('stat_back_btn', {}, lang);

  const statDetailFilterLabels = document.querySelectorAll('.stats-detail-filter-bar .filter-mini-title');
  if (statDetailFilterLabels.length >= 2) {
    statDetailFilterLabels[0].textContent = t('stat_label', {}, lang);
    statDetailFilterLabels[1].textContent = t('stat_clubs', {}, lang);
  }

  const statTableHeadPos = document.querySelector('.stat-detail-table .col-pos-detail');
  if (statTableHeadPos) statTableHeadPos.textContent = t('th_pos', {}, lang);
  const statTableHeadClub = document.querySelector('.stat-detail-table .col-club-detail');
  if (statTableHeadClub) statTableHeadClub.textContent = t('stat_clubs', {}, lang);
  const statTableHeadStat = document.querySelector('.stat-detail-table .col-stat-detail');
  if (statTableHeadStat) statTableHeadStat.textContent = t('stat_label', {}, lang);

  // Drawer
  const drawerLinks = {
    'standings': 'drawer_standings',
    'fixtures': 'drawer_fixtures',
    'stats': 'drawer_stats',
    'simulation': 'drawer_simulation',
  };
  Object.entries(drawerLinks).forEach(([view, key]) => {
    const btn = document.querySelector(`.drawer-link-btn[data-view="${view}"]`);
    if (btn) btn.textContent = t(key, {}, lang);
  });

  document.querySelectorAll('.drawer-section-title').forEach((titleEl) => {
    const txt = titleEl.textContent.trim();
    if (txt.includes('NAVIGASI') || txt.includes('MENU')) titleEl.textContent = t('drawer_nav_title', {}, lang);
    else if (txt.includes('SUMBER DATA') || txt.includes('DATA SOURCE')) titleEl.textContent = t('drawer_info_title', {}, lang);
    else if (txt.includes('ADMIN:')) titleEl.textContent = t('drawer_admin_title', {}, lang);
  });

  const adminSyncStandingsStrong = document.querySelector('#btn-sync-standings .btn-action-meta strong');
  if (adminSyncStandingsStrong) adminSyncStandingsStrong.textContent = t('drawer_admin_btn_standings', {}, lang);
  const adminSyncStandingsSmall = document.querySelector('#btn-sync-standings .btn-action-meta small');
  if (adminSyncStandingsSmall) adminSyncStandingsSmall.textContent = t('drawer_admin_btn_standings_sub', {}, lang);

  const adminSyncFixturesStrong = document.querySelector('#btn-sync-fixtures .btn-action-meta strong');
  if (adminSyncFixturesStrong) adminSyncFixturesStrong.textContent = t('drawer_admin_btn_fixtures', {}, lang);
  const adminSyncFixturesSmall = document.querySelector('#btn-sync-fixtures .btn-action-meta small');
  if (adminSyncFixturesSmall) adminSyncFixturesSmall.textContent = t('drawer_admin_btn_fixtures_sub', {}, lang);

  const adminLogoutBtn = document.getElementById('btn-admin-logout');
  if (adminLogoutBtn) adminLogoutBtn.textContent = t('drawer_admin_logout', {}, lang);

  // Quick Search
  const searchInput = document.getElementById('quick-search-input');
  if (searchInput) searchInput.placeholder = t('search_placeholder', {}, lang);
  const searchPrompt = document.querySelector('#search-results-list .search-empty-prompt');
  if (searchPrompt) searchPrompt.textContent = t('search_prompt', {}, lang);

  // Round 3 Modal Skeleton
  const r3Title = document.getElementById('r3-modal-title');
  if (r3Title) r3Title.textContent = t('r3_modal_title', {}, lang);
  const r3Sub = document.getElementById('r3-modal-subtitle');
  if (r3Sub) r3Sub.textContent = t('r3_modal_subtitle', {}, lang);
  const r3Close = document.querySelector('#btn-r3-modal-dismiss span');
  if (r3Close) r3Close.textContent = t('r3_modal_btn_close', {}, lang);
  const r3Proceed = document.querySelector('#btn-r3-modal-proceed span');
  if (r3Proceed) r3Proceed.textContent = t('r3_modal_btn_proceed', {}, lang);

  // Opening Disclaimer Modal & Footer Trigger
  const discTextMap = {
    'disclaimer-badge-unofficial': 'disclaimer_badge_unofficial',
    'disclaimer-badge-notice': 'disclaimer_badge_notice',
    'disclaimer-modal-title': 'disclaimer_title',
    'disclaimer-modal-subtitle': 'disclaimer_subtitle',
    'btn-open-disclaimer': 'footer_disclaimer_btn',
  };
  Object.entries(discTextMap).forEach(([elId, key]) => {
    const el = document.getElementById(elId);
    if (el) el.textContent = t(key, {}, lang);
  });

  const discSummaryText = document.getElementById('disclaimer-summary-text');
  if (discSummaryText) discSummaryText.innerHTML = t('disclaimer_summary_text', {}, lang);

  const discCloseBtn = document.getElementById('btn-close-disclaimer');
  if (discCloseBtn) discCloseBtn.setAttribute('aria-label', t('disclaimer_close_aria', {}, lang));

  const discBackdrop = document.getElementById('disclaimer-modal-backdrop');
  const isLocked = !discBackdrop || discBackdrop.dataset.locked !== 'false';
  const discFooterNote = document.getElementById('disclaimer-footer-note');
  if (discFooterNote) {
    discFooterNote.textContent = t(isLocked ? 'disclaimer_footer_note' : 'disclaimer_footer_note_review', {}, lang);
  }
  const discAcceptBtn = document.getElementById('btn-accept-disclaimer');
  if (discAcceptBtn) {
    discAcceptBtn.textContent = t(isLocked ? 'disclaimer_btn_accept' : 'disclaimer_btn_close', {}, lang);
  }
}

export function setupLanguageSwitcher() {
  const switcher = document.getElementById('lang-switcher');
  if (!switcher) return;
  const currentLang = getLanguage();
  const buttons = switcher.querySelectorAll('.lang-segment');
  buttons.forEach((btn) => {
    const lang = btn.dataset.lang;
    const isActive = lang === currentLang;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetLang = btn.dataset.lang;
      if (targetLang && targetLang !== getLanguage()) {
        setLanguage(targetLang);
      }
    });
  });
}
