# ProjectHub — Todellinen Visio

> Päivitetty: 14.5.2026
> Tämä dokumentti on kattava arkkitehtuuri-, ominaisuus- ja roadmap-analyysi perustuen nykyiseen koodikantaan ja `idea.md`-spesifikaatioon.

---

## 1. Nykytila — Mitä on rakennettu

### ✅ Toimii tällä hetkellä
| Osa-alue | Status | Huomio |
|---|---|---|
| Electron + Vite + React | ✅ | ESM-arkkitehtuurilla, Rollup inlinoi |
| SQLite (better-sqlite3) | ✅ | WAL-moodi, foreign keys ON |
| Projektien CRUD | ✅ | Luonti, muokkaus, arkistointi |
| Kanban-taulu | ✅ | Todo → In Progress → Done |
| Tehtävien CRUD | ✅ | Prioriteetit, deadlinet, tagit |
| Ctrl+K globaalihaku | ✅ | Debounced 200ms |
| IPC-arkkitehtuuri | ✅ | contextIsolation, sandbox, 14 kanavaa |
| App-logo | ✅ | projecthub.png BrowserWindow icon |

### ❌ Kriittiset puutteet Phase 1:ssä
| Osa-alue | Puuttuu | Vaikutus |
|---|---|---|
| **Single-instance lock** | `app.requestSingleInstanceLock()` puuttuu | Useita instansseja avautuu |
| **Window state -tallennus** | Koko/sijainti ei pysy päivitysten yli | UX-ongelma |
| **Tray-integraatio** | Idea.md mainitsee "aina taskbarissa" | Sovellus katoaa suljettaessa |
| **Deadline-ilmoitukset** | Electron Notification API | Deadlinet menevät ohi huomaamatta |
| **Drag & drop Kanban** | Hiirellä raahaus puuttuu | Kilpailijoiden perustoiminto |
| **Migraatiostrategia** | Ei versioitua skeemamuutosta | DB vioittuu päivityksissä |
| **Error boundaries** | React-kaatuminen kaataa koko UI:n | Huono käyttäjäkokemus |
| **Electron-builder** | Ei testattua installer-buildia | Ei voida jakaa |
| **Auto-updater** | Konfiguroitu muttei testattu | OTA-päivitykset eivät toimi |

---

## 2. Tietokanta — Laajennukset ja migraatio

### Nykyinen skeema (toimii)
```
projects → tasks → task_tags ← tags
```

### Tarvittavat laajennukset

```sql
-- Skeeman versiointi (lisätään heti)
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER NOT NULL,
  applied_at INTEGER NOT NULL
);

-- Muistiinpanot per projekti/tehtävä (Phase 1+)
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,  -- 'project' | 'task'
  entity_id TEXT NOT NULL,
  content TEXT,               -- Markdown-teksti
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  synced_at INTEGER
);

-- Ajanseuranta (Phase 3)
CREATE TABLE IF NOT EXISTS time_entries (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,           -- NULL = kello käy
  duration_seconds INTEGER,   -- Laskettu lopetettaessa
  note TEXT,
  synced_at INTEGER
);

-- Toistuvat tehtävät (Phase 2)
CREATE TABLE IF NOT EXISTS recurring_rules (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  recurrence TEXT NOT NULL,   -- 'daily' | 'weekly' | 'monthly' | cron-string
  next_due INTEGER,
  tag_ids TEXT,               -- JSON-array IDeistä
  created_at INTEGER NOT NULL
);

-- Tiedostoliitteet (Phase 3)
CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  local_path TEXT,            -- Absoluuttinen polku userData/attachments/
  size_bytes INTEGER,
  mime_type TEXT,
  created_at INTEGER NOT NULL,
  synced_at INTEGER
);

-- Projektin milestoonet (Phase 2)
CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date INTEGER,
  completed_at INTEGER,
  created_at INTEGER NOT NULL
);
```

### Migraatiostrategia

```javascript
// src/main/migrations.js
const MIGRATIONS = [
  { version: 1, sql: '-- alkuperäinen skeema' },
  { version: 2, sql: 'ALTER TABLE tasks ADD COLUMN estimated_minutes INTEGER;' },
  { version: 3, sql: 'CREATE TABLE notes (...)' },
  // ...
]

export function runMigrations(db) {
  const currentVersion = db.prepare(
    'SELECT MAX(version) as v FROM schema_version'
  ).get()?.v ?? 0

  for (const m of MIGRATIONS.filter(m => m.version > currentVersion)) {
    db.transaction(() => {
      db.exec(m.sql)
      db.prepare('INSERT INTO schema_version VALUES (?, ?)')
        .run(m.version, Date.now())
    })()
  }
}
```

---

## 3. Phase 1 — Parannukset (ei vaadi pilvitukea)

### 3.1 Single-instance lock + Tray

```javascript
// src/main/index.js
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) { app.quit(); process.exit(0) }

app.on('second-instance', () => {
  if (win) { win.show(); win.focus() }
})

// Tray-ikoni
import { Tray, Menu } from 'electron'
let tray
function createTray() {
  tray = new Tray(join(app.getAppPath(), 'projecthub.png'))
  tray.setToolTip('ProjectHub')
  tray.on('click', () => win.isVisible() ? win.hide() : win.show())
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Avaa', click: () => win.show() },
    { label: 'Sulje', click: () => app.quit() }
  ]))
}

// Sulje minimoi trayhin eikä oikeasti sulje
win.on('close', (e) => {
  if (!app.isQuitting) { e.preventDefault(); win.hide() }
})
app.on('before-quit', () => { app.isQuitting = true })
```

### 3.2 Window state -tallennus

```javascript
// Käytä electron-store tallentamaan ikkuna-asetukset
import Store from 'electron-store'
const store = new Store()

function saveWindowState(win) {
  const bounds = win.getBounds()
  store.set('windowBounds', bounds)
  store.set('windowMaximized', win.isMaximized())
}

function restoreWindowState() {
  const bounds = store.get('windowBounds', { width: 1280, height: 820 })
  const maximized = store.get('windowMaximized', false)
  return { bounds, maximized }
}
```

Tarvitaan: `npm install electron-store`

### 3.3 Deadline-ilmoitukset

```javascript
// src/main/notifications.js
import { Notification } from 'electron'

export function startDeadlineChecker(db) {
  setInterval(() => {
    const tomorrow = Date.now() + 86400000
    const tasks = db.prepare(`
      SELECT t.*, p.name as project_name
      FROM tasks t JOIN projects p ON t.project_id = p.id
      WHERE t.due_date BETWEEN ? AND ? AND t.status != 'done'
    `).all(Date.now(), tomorrow)

    tasks.forEach(task => {
      new Notification({
        title: `Deadline huomenna: ${task.title}`,
        body: `Projekti: ${task.project_name}`
      }).show()
    })
  }, 3_600_000) // Tarkista kerran tunnissa
}
```

### 3.4 Drag & Drop Kanban

Kirjasto: **`@hello-pangea/dnd`** (React 18 -yhteensopiva DnD-library)

```bash
npm install @hello-pangea/dnd
```

```jsx
// KanbanBoard.jsx — DragDropContext + Droppable + Draggable
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

const onDragEnd = async (result) => {
  if (!result.destination) return
  const newStatus = result.destination.droppableId  // 'todo' | 'in_progress' | 'done'
  await window.api.updateTaskStatus(result.draggableId, newStatus)
  // Päivitä local state optimistisesti
}
```

### 3.5 React Error Boundaries

```jsx
// src/renderer/src/components/ErrorBoundary.jsx
class ErrorBoundary extends React.Component {
  state = { error: null }

  static getDerivedStateFromError(error) { return { error } }

  componentDidCatch(error, info) {
    window.api.logError?.({ error: error.message, stack: info.componentStack })
  }

  render() {
    if (this.state.error) return (
      <div className="p-8 text-red-400">
        <h2>Jotain meni pieleen</h2>
        <button onClick={() => this.setState({ error: null })}>Yritä uudelleen</button>
      </div>
    )
    return this.props.children
  }
}
```

### 3.6 Lisää IPC-kanavat

Nykyiset 14 kanavaa vaativat laajennukset:

```javascript
// shared/ipcChannels.js — lisättävät
NOTES_GET: 'notes:get',
NOTES_UPSERT: 'notes:upsert',
TIME_ENTRY_START: 'time:start',
TIME_ENTRY_STOP: 'time:stop',
TIME_ENTRY_GET_BY_TASK: 'time:getByTask',
MILESTONE_GET_BY_PROJECT: 'milestone:getByProject',
MILESTONE_CREATE: 'milestone:create',
SETTINGS_GET: 'settings:get',
SETTINGS_SET: 'settings:set',
LOG_ERROR: 'log:error',
EXPORT_JSON: 'export:json',
EXPORT_CSV: 'export:csv',
WINDOW_MINIMIZE: 'window:minimize',
WINDOW_MAXIMIZE: 'window:maximize',
WINDOW_CLOSE: 'window:close',
```

---

## 4. Phase 2 — Pilvituki (Supabase)

### 4.1 Arkkitehtuuri

```
[Electron App]
    │
    ├─ SQLite (offline-first, source of truth)
    │
    ├─ SyncEngine (src/main/sync.js)
    │   ├─ Upload queue (muutokset joita ei ole synkattu)
    │   ├─ Download poller (muutokset pilvestä)
    │   └─ Conflict resolver (last-write-wins timestamp)
    │
    └─ Supabase Client (vain main-prosessissa, ei rendererissä)
        ├─ Auth (JWT token → tallennus electron-storeen)
        └─ REST API / Realtime WS
```

### 4.2 Electron OAuth — Kriittinen haaste

Electron ei voi käyttää tavallista selain-OAuth:ia suoraan. Ratkaisu:

```javascript
// src/main/auth.js
import { shell } from 'electron'

export async function startOAuthFlow() {
  // 1. Rekisteröi custom protocol
  app.setAsDefaultProtocolClient('projecthub')

  // 2. Avaa Supabase Auth URL selaimessa
  const authUrl = `https://[project].supabase.co/auth/v1/authorize?
    provider=google&
    redirect_to=projecthub://auth/callback`

  await shell.openExternal(authUrl)
}

// 3. Käsittele callback kun käyttäjä kirjautuu
app.on('open-url', (event, url) => {
  // url = 'projecthub://auth/callback#access_token=xxx'
  const token = parseTokenFromUrl(url)
  store.set('auth.token', token)
  // Notify renderer via IPC
})
```

Windowsissa `open-url` vaatii rekisteröinnin protokollahandleriksi (electron-builder hoitaa tämän `protocols`-konfiguraatiolla).

### 4.3 Supabase-taulut

Peili SQLite-skeemasta, lisättynä `user_id`:llä:

```sql
-- Supabase (PostgreSQL)
CREATE TABLE public.projects (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ  -- Soft delete synkkaa poistojakin
);

-- Row Level Security — KRIITTINEN
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their projects" ON public.projects
  FOR ALL USING (auth.uid() = user_id);
```

Sama RLS-politiikka tasks, tags, task_tags, notes, time_entries -tauluihin.

### 4.4 Sync-logiikka

```javascript
// src/main/sync.js
export async function syncToCloud(supabase, db) {
  const lastSync = store.get('lastSyncAt', 0)

  // 1. Lähetä paikalliset muutokset pilveen
  const dirtyProjects = db.prepare(
    'SELECT * FROM projects WHERE synced_at IS NULL OR synced_at < updated_at'
  ).all()

  for (const project of dirtyProjects) {
    const { error } = await supabase.from('projects').upsert({
      ...project,
      user_id: store.get('auth.userId'),
      updated_at: new Date(project.updated_at).toISOString()
    })
    if (!error) {
      db.prepare('UPDATE projects SET synced_at = ? WHERE id = ?')
        .run(Date.now(), project.id)
    }
  }

  // 2. Hae pilvestä uudemmat muutokset
  const { data: remoteProjects } = await supabase
    .from('projects')
    .select('*')
    .gt('updated_at', new Date(lastSync).toISOString())

  for (const remote of remoteProjects ?? []) {
    const local = db.prepare('SELECT * FROM projects WHERE id = ?').get(remote.id)
    const remoteTs = new Date(remote.updated_at).getTime()

    // Konflikti: suurempi updated_at voittaa (last-write-wins)
    if (!local || local.updated_at < remoteTs) {
      db.prepare(`INSERT OR REPLACE INTO projects VALUES (...)`)
        .run(/* remote values */)
    }
  }

  store.set('lastSyncAt', Date.now())
}
```

### 4.5 Offline-first puskuri

```javascript
// Offline-queue: operaatiot jotka epäonnistuivat nettiyhteyskatkon takia
const queue = []

app.on('online', () => {
  // Tyhjennetään jono kun netti palaa
  while (queue.length) {
    const op = queue.shift()
    op().catch(() => queue.unshift(op)) // Palauta jonoon jos epäonnistuu
  }
})
```

---

## 5. Phase 3 — Lisäominaisuudet

### 5.1 Ajanseuranta

**UI**: Tehtäväkortissa "▶ Käynnistä ajastin" -nappi. Aktiivinen ajastin näkyy Sidebar:ssa.

**Tietokanta**: `time_entries`-taulu (ks. luku 2).

**IPC**: `TIME_ENTRY_START/STOP/GET_BY_TASK` → main-prosessi laskee keston.

**Raportointi**: `SELECT SUM(duration_seconds) FROM time_entries WHERE task_id = ?`

### 5.2 Tilastot & Raportit

Kirjasto: **Recharts** (React-natiivi, ei canvas-ongelmia Electronissa)

```bash
npm install recharts
```

Näkymät:
- **Viikkosummary**: tehtävien valmistuminen per päivä (BarChart)
- **Burndown**: avoinna olevat tehtävät ajan yli (LineChart)
- **Ajankäyttö**: pie chart per projekti (PieChart)
- **Prioriteettijakauma**: tasks per prioriteetti

### 5.3 Export

```javascript
// src/main/export.js
import { writeFileSync } from 'fs'
import { dialog } from 'electron'

export async function exportToJson(db, projectId) {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId)
  const tasks = db.prepare('SELECT * FROM tasks WHERE project_id = ?').all(projectId)

  const payload = JSON.stringify({ project, tasks }, null, 2)

  const { filePath } = await dialog.showSaveDialog({
    defaultPath: `${project.name}-export.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })

  if (filePath) writeFileSync(filePath, payload, 'utf-8')
}
```

CSV-export samalla logiikalla, käyttäen `fast-csv`-kirjastoa.

### 5.4 Tiedostoliitteet

```javascript
// Polku: userData/attachments/<task_id>/<filename>
import { copyFileSync, mkdirSync } from 'fs'

export function attachFile(taskId, sourcePath, filename) {
  const dir = join(app.getPath('userData'), 'attachments', taskId)
  mkdirSync(dir, { recursive: true })
  const dest = join(dir, filename)
  copyFileSync(sourcePath, dest)
  // Tallenna DB:hen
  return dest
}
```

### 5.5 Tiiminäkymä (vaatii Phase 2)

- **Projektin jakaminen**: `project_members`-taulu Supabasessa (`project_id`, `user_id`, `role: owner|editor|viewer`)
- **Kutsu-linkki**: Supabase magic link tai sähköpostikutsu
- **RLS-päivitys**: `auth.uid() IN (SELECT user_id FROM project_members WHERE project_id = id)`
- **Realtime**: Supabase Realtime Channels — muutokset näkyvät kaikille tiimin jäsenille reaaliajassa

---

## 6. Tietoturva

| Uhka | Torjunta | Status |
|---|---|---|
| Remote code execution | `contextIsolation: true`, `nodeIntegration: false` | ✅ |
| XSS rendereroinnissa | React escapaa automaattisesti | ✅ |
| Content Security Policy | CSP-meta index.html:ssä | ✅ osittain |
| SQLite injection | Parametrisoitu SQL (prepared statements) | ✅ |
| API-avaimet | Vain main-prosessissa, ei rendererissä | ✅ |
| Supabase token | electron-store + salattu (encryptionKey) | ⚠️ lisättävä |
| Tiedostopolku traversal | Validointi ennen tiedosto-operaatioita | ⚠️ lisättävä |
| Protocol handler hijacking | Varmista app.isPackaged ennen token-parsintaa | ⚠️ lisättävä |

### CSP-parannus (index.html)
```html
<!-- Nykyinen on liian löysä — tiukennetaan -->
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self';
           script-src 'self';
           style-src 'self' 'unsafe-inline';
           img-src 'self' data: blob:;
           connect-src 'self' https://*.supabase.co wss://*.supabase.co;
           font-src 'self'">
```

---

## 7. Suorituskyky

| Tilanne | Nykyinen | Tavoite |
|---|---|---|
| Käynnistysaika | ~2s (dev) | < 1s (prod) |
| Kanban 100 taskia | OK | OK |
| Kanban 10 000 taskia | Ei testattu | Virtualisointi (react-window) |
| SQLite 1M riviä | Ei testattu | Indeksit + LIMIT/OFFSET |
| Haku 10 000 taskia | Ei testattu | FTS5 (Full-Text Search) |

### SQLite FTS5 hakuun

```sql
-- Korvaa nykyinen LIKE-haku FTS5:llä
CREATE VIRTUAL TABLE tasks_fts USING fts5(
  title, description,
  content=tasks, content_rowid=rowid,
  tokenize='unicode61'
);

-- Trigger pitää FTS-indeksin ajan tasalla
CREATE TRIGGER tasks_ai AFTER INSERT ON tasks BEGIN
  INSERT INTO tasks_fts(rowid, title, description)
  VALUES (new.rowid, new.title, new.description);
END;

-- Haku
SELECT t.* FROM tasks t
JOIN tasks_fts ON t.rowid = tasks_fts.rowid
WHERE tasks_fts MATCH ?
ORDER BY rank;
```

---

## 8. UX — Puuttuvat kosketukset

| Komponentti | Puuttuu |
|---|---|
| Kanban | Drag & drop, tehtävien lukumäärä per sarake, sarakkeen lajittelu |
| Sidebar | Projektin edistymispalkki täsmällisemmin, favoriiit/pin |
| TaskCard | Arvioitu aika vs käytetty aika, kommentin laskuri |
| Navigointi | Breadcrumb-historia, back-button tila |
| Tyhjätilat | Paremmat empty states animaatioilla (esim. Framer Motion) |
| Keyboard shortcuts | Täysi map: N=uusi tehtävä, E=muokkaa, Del=poista, ←→=navigoi |
| Tumma/vaalea teema | Nykyinen on dark-only; OS-teeman seuraaminen |
| Latausanimaatiot | Skeleton loaders placeholderien sijaan |

---

## 9. Electron-builder — Tuotantopakkaus

### Tarvittavat muutokset `package.json`:iin

```json
{
  "build": {
    "appId": "fi.it-veljekset.projecthub",
    "productName": "ProjectHub",
    "icon": "projecthub.png",
    "protocols": [
      { "name": "ProjectHub", "schemes": ["projecthub"] }
    ],
    "win": {
      "target": "nsis",
      "icon": "projecthub.png",
      "publisherName": "IT-Veljekset"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "installerIcon": "projecthub.png",
      "installerHeaderIcon": "projecthub.png"
    },
    "mac": {
      "target": "dmg",
      "icon": "projecthub.icns",
      "category": "public.app-category.productivity"
    },
    "linux": {
      "target": "AppImage",
      "icon": "projecthub.png",
      "category": "Office"
    },
    "publish": {
      "provider": "github",
      "owner": "Pastorilaine",
      "repo": "ProjectHub"
    }
  }
}
```

### Auto-updater flow

```javascript
// src/main/updater.js
import { autoUpdater } from 'electron-updater'

autoUpdater.autoDownload = false

autoUpdater.on('update-available', (info) => {
  // Kerro käyttäjälle via IPC → näytä dialog rendererissä
  win.webContents.send('update:available', info)
})

autoUpdater.on('update-downloaded', () => {
  win.webContents.send('update:ready')
  // Käyttäjä päättää milloin asentaa
})

export function checkForUpdates() {
  if (app.isPackaged) autoUpdater.checkForUpdates()
}
```

---

## 10. Priorisoitu Roadmap

### Sprint 1 (1–2 viikkoa) — Stabiilius
1. ✅ Migraatiostrategia (schema_version-taulu)
2. ✅ Single-instance lock
3. ✅ Window state -tallennus (electron-store)
4. ✅ Tray-ikoni + minimointi trayhin
5. ✅ React Error Boundaries
6. ✅ Deadline-ilmoitukset (tunneittain tarkistus)
7. ✅ Drag & drop Kanban (@hello-pangea/dnd)
8. ✅ Electron-builder Windows NSIS installer (testipakkaus)

### Sprint 2 (2–3 viikkoa) — UX-parannus
1. Muistiinpanot per projekti/tehtävä
2. Paremmat keyboard shortcuts
3. Skeleton loaders
4. FTS5 haku (LIKE → Full-Text Search)
5. Export JSON/CSV
6. Milestoonet projektiin
7. Framer Motion animaatiot

### Sprint 3 (3–4 viikkoa) — Pilvituki
1. Supabase-projekti + taulut + RLS-politiikat
2. Electron OAuth deep link -flow
3. Auth UI (kirjautuminen/rekisteröityminen)
4. Sync-engine (upload + download + conflict)
5. Sync-status UI (Sidebar-indikaattori)
6. Offline-jono

### Sprint 4 (2–3 viikkoa) — Phase 3
1. Ajanseuranta (ajastin + raportit)
2. Recharts-tilastonäkymä
3. Tiedostoliitteet
4. Toistuvat tehtävät
5. Tiiminäkymä (projektin jako)

---

## 11. Arkkitehtuurikaavio (lopullinen)

```
┌─────────────────────────────────────────────────────────┐
│                    ELECTRON APP                          │
│                                                          │
│  ┌──────────────┐    IPC     ┌─────────────────────┐    │
│  │   RENDERER   │◄──────────►│     MAIN PROCESS    │    │
│  │  (React UI)  │            │                     │    │
│  │              │            │  ┌───────────────┐  │    │
│  │  window.api  │            │  │  database.js  │  │    │
│  │  (14+ ch.)   │            │  │  (SQLite)     │  │    │
│  │              │            │  └───────────────┘  │    │
│  │  Components: │            │  ┌───────────────┐  │    │
│  │  - Sidebar   │            │  │   sync.js     │  │    │
│  │  - Kanban    │            │  │  (Supabase)   │  │    │
│  │  - Search    │            │  └───────────────┘  │    │
│  │  - Modals    │            │  ┌───────────────┐  │    │
│  │  - Charts    │            │  │ migrations.js │  │    │
│  └──────────────┘            │  └───────────────┘  │    │
│         ▲                    │  ┌───────────────┐  │    │
│         │ contextBridge      │  │   export.js   │  │    │
│  ┌──────┴───────┐            │  └───────────────┘  │    │
│  │  PRELOAD     │            │  ┌───────────────┐  │    │
│  │  (sandbox)   │            │  │  updater.js   │  │    │
│  └──────────────┘            │  └───────────────┘  │    │
│                              └─────────────────────┘    │
│                                         │                │
│                              ┌──────────▼──────────┐    │
│                              │   SYSTEM SERVICES   │    │
│                              │  - Tray             │    │
│                              │  - Notifications    │    │
│                              │  - Protocol Handler │    │
│                              │  - Auto-updater     │    │
│                              └─────────────────────┘    │
└─────────────────────────────────┬───────────────────────┘
                                  │ HTTPS
                        ┌─────────▼──────────┐
                        │     SUPABASE       │
                        │  - Auth (JWT)      │
                        │  - PostgreSQL      │
                        │  - Realtime WS     │
                        │  - Storage         │
                        └────────────────────┘
```

---

## 12. Seuraava konkreettinen askel

Kaikkein tärkein tehtävä ennen Phase 2:ta on **stabiilius**:

```bash
# 1. Asenna puuttuvat riippuvuudet
npm install electron-store @hello-pangea/dnd

# 2. Toteuta Sprint 1 -tehtävät yllä olevassa järjestyksessä
# 3. Testaa Windows-installer:
npm run build:win
```

Supabase-projekti kannattaa luoda ja RLS-politiikat konfiguroida ennen kuin sync-koodi kirjoitetaan — se säästää paljon refaktorointia.
