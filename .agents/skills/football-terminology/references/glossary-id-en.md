# Bilingual Football Terminology Glossary (Indonesian & English)

Standard reference for Pegadaian Championship Hub (`public/js/modules/i18n.js` and UI components).

## 1. Standings & Table (Klasemen & Poin)

| Concept | Indonesian (`id`) | English (`en`) | Notes |
| :--- | :--- | :--- | :--- |
| Rank / Position | `Pos` / `Peringkat` | `Pos` / `Rank` | Use `P1`..`P10` as compact rank tags |
| Matches Played | `Main` (`Mn`) | `Played` (`P` / `MP`) | Avoid `Game` for football matches |
| Won / Drawn / Lost | `M` / `S` / `K` (`Menang` / `Seri` / `Kalah`) | `W` / `D` / `L` (`Won` / `Drawn` / `Lost`) | Use `M-S-K` (ID) and `W-D-L` (EN) in records |
| Goals For / Scored | `Gol Memasukkan (GM)` | `Goals For (GF)` / `Goals Scored` | — |
| Goals Against / Conceded | `Gol Kemasukan (GK)` | `Goals Against (GA)` / `Goals Conceded` | — |
| Goal Difference | `Selisih Gol (SG)` | `Goal Difference (GD)` | Never write `GD` inside Indonesian prose |
| Recent Form | `5 Laga Terakhir` / `Performa (5 Laga)` | `Form` / `Last 5` | Keep consistent across Standings & Simulator |
| Table Leaders | `Pemuncak Klasemen` | `Table Leaders` / `Top of the Table` | — |
| Bottom-Placed Team | `Juru Kunci` / `Dasar Klasemen` | `Bottom-Placed` / `Foot of the Table` | — |
| Safe Zone | `Zona Aman` | `Safe Zone` | — |
| Point Deduction | `Pengurangan Poin` / `Sanksi Poin` | `Point Deduction` | — |

## 2. Fixtures, Schedule & Match Status (Jadwal & Status Laga)

| Concept | Indonesian (`id`) | English (`en`) | Notes |
| :--- | :--- | :--- | :--- |
| Matchweek | `Pekan` | `Matchweek` (`MW`) | Prefer `Matchweek` over `Week` in league football |
| Multi-Round Stage | `Putaran 1 / 2 / 3` | `Round 1 / 2 / 3` | Use `Leg` only for two-legged knockout ties |
| Home / Away | `Kandang` / `Tandang` | `Home` / `Away` | Never mix `Kandang (Home)` in ID labels |
| Neutral Ground | `Tempat Netral` | `Neutral Venue` | — |
| Kick-off | `Sepak Mula` / `Kick-off` | `Kick-off` (`KO`) | — |
| Full Time | `Selesai` (`FT`) | `Full Time` (`FT`) | — |
| Half Time | `Babak Pertama` (`HT`) | `Half Time` (`HT`) | — |
| Scheduled / Upcoming | `Terjadwal` / `Akan Datang` | `Upcoming` / `Scheduled` | Prefer `Terjadwal` over casual `BELUM MAIN` |
| Postponed / Cancelled | `Ditunda` / `Dibatalkan` | `Postponed` (`PPD`) / `Cancelled` | — |
| Final Round Fixture | `Laga Pamungkas` | `Final Matchday Fixture` | — |

## 3. Head-to-Head & Results (Rekor Pertemuan & Hasil)

| Concept | Indonesian (`id`) | English (`en`) | Notes |
| :--- | :--- | :--- | :--- |
| Head-to-Head | `Head-to-Head` / `Rekor Pertemuan` | `Head-to-Head` (`H2H`) | Always hyphenate `Head-to-Head` |
| Aggregate Score | `Agregat` | `Aggregate` (`Agg`) | — |
| Away Goals | `Gol Tandang` | `Away Goals` | — |
| Goalless Draw | `Imbang Tanpa Gol` | `Goalless Draw` | — |
| Unbeaten Run | `Rekor Tak Terkalahkan` | `Unbeaten Run` / `Unbeaten Streak` | — |
| Winning Streak | `Tren Kemenangan` / `Kemenangan Beruntun` | `Winning Streak` | — |

## 4. Team Statistics (Statistik Tim)

| Concept | Indonesian (`id`) | English (`en`) | Notes |
| :--- | :--- | :--- | :--- |
| Page & Nav Title | `Statistik Tim` | `Team Statistics` | Match `nav_stats` and `stats_title` |
| Points per Game | `Poin per Pertandingan` | `Points per Game` (`PPG`) | — |
| Win Rate | `Persentase Kemenangan` | `Win Rate` | — |
| Clean Sheets | `Nirbobol` | `Clean Sheets` | Avoid leaving `(Clean Sheets)` untranslated if avoidable |
| Conceded per Game | `Kebobolan per Pertandingan` | `Goals Conceded per Game` | — |

## 5. Tactical Analysis & Season Scenarios (Analitik & Skenario)

| Concept | Indonesian (`id`) | English (`en`) | Notes |
| :--- | :--- | :--- | :--- |
| Fixture Difficulty | `Kategori Laga` / `Klasifikasi Laga` | `Fixture Difficulty` / `Match Classification` | Avoid `Match Class` where `Fixture Difficulty` fits |
| Must-Win / Realistic Win | `Target Menang` | `Calculated Win Target` / `Must-Win Target` | Never mix `(Calculated Win)` in ID |
| Evenly Matched | `Laga Ketat (50-50)` | `Tight Match (50-50)` | — |
| Difficult Fixture | `Laga Berat` / `Tantangan Berat` | `Tough Fixture` | Never append `(Away)` to a shared tier label |
| Six-Pointer | `Laga 6 Poin (Rival Langsung)` | `Six-Pointer` / `6-Pointer Duel` | Applies to any direct zone rival (promotion or relegation) |
| Points Cushion | `Bantalan Poin` / `Keunggulan Poin` | `Points Cushion` | — |
| Safety Threshold | `Ambang Batas Aman` | `Safety Threshold` / `Magic Number` | — |
| Long Shot | `Peluang Tipis` | `Long Shot` | — |

## 6. PSSI / Pegadaian Championship Regulations (Regulasi)

| Concept | Indonesian (`id`) | English (`en`) | Notes |
| :--- | :--- | :--- | :--- |
| Automatic Promotion | `Promosi Otomatis` | `Automatic Promotion` | — |
| Promotion Play-off | `Babak Play-off Promosi` | `Promotion Play-off` | Never translate `play-off` as `uji coba` |
| Relegation Play-off | `Babak Play-off Degradasi` | `Relegation Play-off` | Never translate `play-off` as `uji coba` |
| Direct Relegation | `Degradasi Langsung` | `Direct Relegation` | — |
| H2H Mini-Table | `Klasemen Mini` | `Mini-Table` | Used in PSSI Pasal 7 tie-breakers |
| Disciplinary Sanction | `Sanksi Disiplin` / `Komdis` | `Disciplinary Sanction` | — |
