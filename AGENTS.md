# Agent Notes for XFCE GitHub Pages Desktop

A single-page GitHub Pages site that renders a user's GitHub profile as an XFCE-style desktop. No build step, no framework, no package manager.

> **Note for agents:** Any AGENTS.md changes that are relevant to end users (e.g. setup steps, customization instructions, feature changes, or deployment notes) should also be reflected in `README.md` so users see them.

## What it is

- Static HTML/CSS/JS site intended for GitHub Pages.
- Uses the GitHub REST API (unauthenticated) to fetch profile, repositories, and public events.
- Renders a fake desktop: wallpaper, desktop icons, bottom panel with menu/clock/taskbar, and draggable/resizable windows for four "apps".

## File structure

```
├── index.html           # Single entry point; loads css/ + js/ in a fixed order
├── _config.yml          # Jekyll config for GitHub Pages; only excludes README.md
├── css/
│   ├── xfce.css         # Desktop, panel, menu, desktop icons, app menu styles
│   └── windows.css      # Window chrome, window content, terminal, profile, repos, activity
└── js/
    ├── github.js        # GitHub API client with localStorage cache
    ├── windowmanager.js # Window creation, drag, resize, focus, minimize/restore/maximize/close
    ├── desktop.js       # Desktop icons, app menu, taskbar, clock
    ├── apps.js          # App definitions and content loaders (Profile, Repos, Activity, Terminal)
    └── main.js          # DOMContentLoaded -> Desktop.init()
```

## Essential commands

There is no build, test, or lint tooling. Local development is just a static HTTP server:

```bash
# Python 3
python3 -m http.server 8000

# Node
npx http-server -p 8000
```

Then open http://localhost:8000.

Deploy: push to the GitHub Pages branch/folder configured in the repo settings. No CI is configured.

## Architecture and data flow

### Global modules

All scripts are loaded in `index.html` in this order and attach global singletons:

1. `github.js` → `GitHubAPI`
2. `windowmanager.js` → `WindowManager`
3. `desktop.js` → `Desktop`
4. `apps.js` → `Apps`
5. `main.js` → calls `Desktop.init()`

Everything is in the global namespace. There are no imports/exports. Modules are IIFEs that return public methods.

### Boot sequence

`main.js` waits for `DOMContentLoaded` and calls `Desktop.init()`, which:
- Renders desktop icons from `Desktop.desktopIcons`.
- Renders the applications menu (with an async GitHub avatar fetch).
- Wires up the menu button, global click-to-close, and clock.
- Adds a global click handler to deselect desktop icons.

### Desktop (`Desktop`)

Responsibilities:
- Keep `Desktop.Icons` — SVG icons as data URIs used by apps and the desktop.
- Render `#desktop-icons`, `#menu-dropdown`, and `#panel-taskbar`.
- Start and update the clock in `#panel-clock`.
- Provide `updateTaskbar()` used by `WindowManager` whenever windows change.

Key arrays (if you add/change apps, update both):
- `desktopIcons` — icons on the desktop.
- `menuItems` — items in the Applications menu.

Each icon/menu item references an `app` string passed to `Apps.launch(app)`.

### Window manager (`WindowManager`)

- Creates windows inside `#windows-container`.
- Tracks `windows[]` and a `zIndexCounter` for focus stacking.
- Each window object has: `id`, `title`, `icon`, `width`, `height`, `x`, `y`, `minimized`, `maximized`, `prevRect`, `el`.
- Public API used by `Apps` and `Desktop`:
  - `createWindow(options)` — required: `title`, `icon`, `width`, `height`, `content`, `onMount`, `onClose`.
  - `focusWindow(win)`, `minimizeWindow(win)`, `restoreWindow(win)`, `toggleMaximize(win)`, `closeWindow(win)`
  - `getWindows()`

Window options:
- `content` is the initial HTML; apps usually render a spinner and then replace content in `onMount`.
- `onMount(contentEl, win)` is called after the DOM element is built; this is where apps fetch data and inject content.
- `onClose()` is for cleanup (e.g. `Apps` deletes from `openApps`).

Dragging and resizing work via `document` mousemove/mouseup listeners. Windows are constrained to the viewport above the panel.

### Apps (`Apps`)

`Apps.launch(appId)` opens or re-focuses one of four apps:
- `profile`
- `repos`
- `activity`
- `terminal`

Only one window per app type is allowed at a time; this is tracked in `openApps`. Closing an app removes it from `openApps`.

Each app config specifies `title`, `icon` (from `Desktop.Icons`), dimensions, and a `loader(contentEl, win)` function.

App content is rendered by replacing `contentEl.innerHTML` after async GitHub API calls.

### GitHub API (`GitHubAPI`)

- Username is set by `const GITHUB_USERNAME = window.GH_USERNAME || 'pshickeydev';` in `js/github.js`.
- To customize the site for another user, change that default or set `window.GH_USERNAME` before the script loads.
- Endpoints used:
  - `GET /users/{username}`
  - `GET /users/{username}/repos?per_page=100&sort=updated&direction=desc`
  - `GET /users/{username}/events/public?per_page=30`
  - `GET /rate_limit`
- Caching:
  - Cache key prefix: `gh_cache_`
  - TTL: 10 minutes (`CACHE_TTL = 10 * 60 * 1000`)
  - Stored in `localStorage`
- Rate-limit behavior: 403 errors throw a user-facing "rate limit exceeded" message.

## Styling conventions

- Two stylesheets are loaded; split by concern:
  - `xfce.css` — shell/chrome (desktop, panel, menu, icons).
  - `windows.css` — windows and app-specific content.
- Theme is XFCE Greybird: greys with blue active accents.
- Key colors:
  - Active titlebar: `#4a7ab5`/`#6a9fd4`
  - Inactive titlebar: greys
  - Window chrome: `#ececec` background, `#888` border
- Global `user-select: none` is reset to `text` inside `.window-content` so window content can be selected.
- Focus-visible outlines are defined in `xfce.css` for keyboard navigation.

## Icon system

`Desktop.Icons` are SVG strings converted to data URIs via `svgIcon()` in `desktop.js`. Apps refer to these by name, e.g. `Desktop.Icons.profile`. If you add a new app, add its icon there or inline a new SVG.

## JavaScript patterns

- IIFE modules, no transpilation, ES6 template literals and arrow functions used throughout.
- Escape user-controlled strings with `escapeHtml()` in `apps.js`.
- Event handlers for dynamically created elements are attached after the DOM is injected (usually inside `onMount` or after `innerHTML` assignment).
- Async commands in the Terminal set `isAsync = true` so the prompt is added only in the command's `finally()` block.

## Important gotchas

- **No module bundler**: everything is global. Do not add `import`/`export` without also adding a bundler or changing the page to `type="module"`.
- **Script load order matters** (`index.html`): `github.js` → `windowmanager.js` → `desktop.js` → `apps.js` → `main.js`.
- **Global dependency**: `Desktop` uses `WindowManager`; `Apps` uses `Desktop`, `WindowManager`, and `GitHubAPI`; `main.js` uses `Desktop`.
- **Single-instance apps**: `Apps.openApps` prevents duplicate windows. If you close an app, `onClose` deletes it from `openApps` so it can be reopened.
- **Window content is replaced, not patched**: apps use `contentEl.innerHTML = ...`. Re-rendering wipes previous event listeners; any state must live in closure variables or be reattached.
- **Repo detail back-navigation**: `showRepoDetail` mutates `win.title` and the titlebar text, then restores them when going back. It re-renders the repo grid by calling `renderRepoGrid(contentEl, allRepos, win)`.
- **Terminal `processCommand` signature**: `processCommand(cmd, addLine, addPrompt, state)`. `addLine` appends a line; `addPrompt` creates a new editable input. Sync commands must call `addPrompt()`; async commands must set `isAsync = true` and call `addPrompt()` themselves in `finally()`.
- **localStorage cache**: If the site ever shows stale data, clear `localStorage` items with the prefix `gh_cache_`.
- **Rate limits**: Unauthenticated GitHub API is 60 requests/hour/IP. Cache keeps this within bounds under normal use.
- **CORS**: Fetching `repo.languages_url` in `showRepoDetail` relies on GitHub's CORS headers; if those ever change, the language bar will silently fail (the `.catch` is empty).
- **Hardcoded username**: If you fork this, the only required change is `GITHUB_USERNAME` in `js/github.js`. The README also documents setting `window.GH_USERNAME` before the script tag.

## Adding a new app

1. Add an SVG icon to `Desktop.Icons` in `js/desktop.js`.
2. Add entries to `desktopIcons` and `menuItems` in `js/desktop.js`.
3. Add a case in `Apps.getAppConfig()` in `js/apps.js` with a loader function.
4. Add styles for the app content in `css/windows.css` if needed.

## Testing

There are no tests. Manual testing checklist for changes:
- Open each of the four apps from the desktop and the menu.
- Minimize, restore, maximize, drag, and resize windows.
- Verify keyboard navigation on desktop icons, menu items, repo grid, and taskbar items.
- Verify terminal commands: `help`, `whoami`, `ls`, `cat <repo>`, `stats`, `activity`, `clear`.
