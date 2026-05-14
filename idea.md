***

## Projektin yleiskuva

**Nimi:**ProjektHub
**Stack:** Electron + React + SQLite (lokaali) + optionaalinen pilvituki

***

## Arkkitehtuuri

```
electron-app/
├── main/                  ← Node.js / Electron main process
│   ├── main.js            ← Ikkuna, IPC-kanavat, autoUpdater
│   ├── database.js        ← SQLite-yhteys ja kyselyt
│   └── sync.js            ← Pilvitallennuksen logiikka
├── renderer/              ← React-frontend (UI)
│   ├── components/
│   ├── pages/
│   └── App.jsx
├── shared/
│   └── ipcChannels.js     ← IPC-kanavien nimet molemmille puolille
└── package.json
```

Kommunikointi main ↔ renderer tapahtuu **IPC-viesteillä** (Electron's `ipcMain` / `ipcRenderer`), ei suorilla Node.js-kutsuilla rendereroinnissa. [blog.logrocket](https://blog.logrocket.com/advanced-electron-js-architecture/)

***

## Tech Stack

| Kerros | Teknologia | Miksi |
|---|---|---|
| Framework | Electron + Vite | Nopea HMR kehityksessä |
| UI | React + Tailwind | Tuttu, nopea kehittää |
| Paikallinen DB | **better-sqlite3** | Synkroninen, nopein SQLite Node.js:lle  [rxdb](https://rxdb.info/electron-database.html) |
| Pilvituki | **Supabase** tai Firebase | Ilmainen tier, reaaliaika-sync, helppo autentikaatio |
| Paketoi | electron-builder | Windows/macOS/Linux-asennustiedostot |
| Päivitykset | electron-updater | Automaattiset OTA-päivitykset |

***

## Tietokantarakenne (SQLite)

```sql
-- Projektit
CREATE TABLE projects (
  id TEXT PRIMARY KEY,       -- UUID
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',  -- active | archived | completed
  color TEXT,                -- UI-väri
  created_at INTEGER,
  updated_at INTEGER,
  synced_at INTEGER          -- NULL = ei synkattu pilveen
);

-- Tehtävät
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo', -- todo | in_progress | done
  priority TEXT DEFAULT 'medium',
  due_date INTEGER,
  created_at INTEGER,
  updated_at INTEGER,
  synced_at INTEGER
);

-- Tagit
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT
);

-- Tehtävä-tagi -liitos
CREATE TABLE task_tags (
  task_id TEXT REFERENCES tasks(id),
  tag_id  TEXT REFERENCES tags(id)
);
```

***

## Ominaisuuslista (MVP → Full)

### ✅ MVP (Phase 1) — täysin offline
- Projektien luonti, muokkaus, arkistointi
- Tehtävät per projekti (Kanban-näkymä: Todo → In Progress → Done)
- Prioriteetit ja deadlinet
- Tagit / kategoriat
- Haku tehtävistä ja projekteista
- Tiedot SQLite:ssä `userData`-kansiossa (ei häviä päivityksissä) [github](https://github.com/sindresorhus/electron-store)

### ☁️ Phase 2 — pilvituki
- Käyttäjätilin luonti (Supabase Auth)
- Manuaalinen "Synkronoi pilveen" -nappi
- Automaattinen taustasynkronointi kun netti käytössä
- Konfliktinratkaisu: `updated_at`-kenttä määrittää voittajan
- Usean laitteen tuki (sama tili eri koneella)

### 🚀 Phase 3 — lisäominaisuudet
- Tiiminäkymä (jaa projekti muille Supabase-käyttäjille)
- Ajanseuranta per tehtävä
- Statistiikat (viikkosummary, burndown-chart)
- CSV/JSON-export
- Tiedostoliitteet tehtäviin (tallennus paikallisesti tai Supabase Storage)

***

## Synkronoinnin logiikka

Yksinkertaisin toimiva malli on **timestamp-pohjainen sync**: [dev](https://dev.to/quinncuatro/how-would-you-handle-cloud-syncing-data-for-an-electron-app-4354)

```
1. Paikallisesti: kaikki muutokset päivittävät updated_at
2. Synkatessa: lähetä kaikki rivit joissa synced_at < updated_at
3. Pilvestä: hae kaikki rivit joissa server_updated_at > viime sync
4. Konflikti: suurempi updated_at voittaa (last-write-wins)
```

Monimutkaisempaan synkkaan (offline-ensin, reaaliaika) voi myöhemmin käyttää **PowerSync**-kirjastoa joka on tehty juuri Electron + SQLite -yhdistelmälle. [powersync](https://powersync.com/blog/speeding-up-electron-apps-with-powersync)

***

## Kehitysjärjestys

1. **Viikko 1** — Electron + Vite + React boilerplate, SQLite-yhteys, IPC-rakenne
2. **Viikko 2** — CRUD projektit ja tehtävät, Kanban UI
3. **Viikko 3** — Haku, tagit, prioriteetit, Tray-integraatio (aina taskbarissa)
4. **Viikko 4** — Electron-builder, asennuspaketit, autoUpdater
5. **Myöhemmin** — Supabase-autentikaatio ja sync-logiikka päälle

***

## Käynnistys käytännössä

```bash
npm create electron-vite@latest projekti-app -- --template react
cd projekti-app
npm install better-sqlite3 electron-store uuid
npm run dev
```

`better-sqlite3` on tällä hetkellä suosituin valinta Electron-sovelluksiin sen synkronisen API:n ja nopeuden takia. Se toimii suoraan main-prosessissa ilman asynkronisia callback-helvettejä. [linkedin](https://www.linkedin.com/posts/mohib-ali-khan-64518a260_electronjs-sqlite-desktopappdevelopment-activity-7394379050284199937--MuZ)

Haluatko että aloitan rakentamaan tämän boilerplaten tai jonkin tietyn osan suoraan?
