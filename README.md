# XFCE GitHub Pages Desktop

A GitHub Pages site that displays your GitHub profile styled as an XFCE desktop environment.

## Quick Start

1. **Create a repository** — either `<username>.github.io` (for a user Pages site) or any other name (for a project Pages site). GitHub Pages must be enabled in Settings → Pages.

2. **Copy all files** to the root of that repository.

3. **Handle the CNAME file** — this repo includes a `CNAME` file pointing to `pshickey.dev`. If you're using a custom domain, edit `CNAME` with your domain. If you're not using a custom domain, **delete the `CNAME` file** — otherwise Pages will reject the build or try to serve from the wrong domain.

4. **Set your GitHub username** in `js/github.js` (line 12):
   ```js
   const GITHUB_USERNAME = window.GH_USERNAME || 'pshickeydev';
   ```
   Change `'pshickeydev'` to your GitHub username, or set `window.GH_USERNAME` before the script loads.

5. **Push to GitHub** and enable Pages (Settings → Pages → Source: `main` branch, `/` (root) folder).

6. **Wait a minute** for Pages to build, then visit your URL.

## Gotchas

- **CNAME file is included** — this repo ships with a `CNAME` file for `pshickey.dev`. If you fork or copy the repo, you must either update `CNAME` to your own custom domain, or delete it entirely. Leaving the wrong `CNAME` in place will cause Pages to fail or serve the wrong site.
- **`_config.yml` excludes `README.md`** — this prevents Jekyll from processing the README as a Pages page. If you delete `_config.yml`, Jekyll will serve `README.md` as a page instead of showing the desktop.
- **Repo name matters** — for user Pages (`<username>.github.io`), the repo must be named exactly `<username>.github.io`. For project Pages, the site lives at `<username>.github.io/<repo-name>/`.
- **`window.GH_USERNAME` override** — if you set `window.GH_USERNAME` in a `<script>` tag *before* `js/github.js` loads, you can avoid editing the `js/github.js` file (useful for forks).
- **localStorage caching** — the GitHub API uses `localStorage` with a 10-minute cache. If you see stale profile data, open DevTools → Application → Local Storage and delete keys starting with `gh_cache_`.
- **No build step** — this is pure HTML/CSS/JS. No bundler, no framework, no npm install. Just push the files and Pages serves them directly.
- **Rate limits** — unauthenticated GitHub API calls are limited to 60/hour per IP. The 10-minute cache should keep things reasonable for personal use.
- **Iframe apps point to pshickeydev's sites** — the Terminal Scroller and D3 Graph Viz windows load from `pshickeydev.github.io`. If you fork this repo, you'll need to update those URLs in `js/apps.js` (`getAppConfig()` → `scroller` and `graphviz` entries) or remove those app entries from `js/desktop.js` if you don't have equivalents.
- **Page title is hardcoded** — `index.html` has `<title>pshickeydev - XFCE Desktop</title>`. Change this to your own name.
- **`.gitignore` ignores `.playwright-mcp/`** — this is a debug artifact directory from the Playwright MCP tool used during development. It's not needed for the site to work.

## Features

- **XFCE Greybird theme** — authentic XFCE look with grey panels, blue active windows, and desktop icons
- **Bottom panel** — Applications menu, taskbar, and clock
- **Desktop icons** — double-click to launch apps
- **Applications menu** — Whisker-style dropdown with avatar
- **Window manager** — drag to move, resize, minimize, maximize, close, focus stacking
- **Profile window** — avatar, bio, stats (repos, followers, following, gists)
- **Repositories window** — Thunar-style file manager grid with repo details
- **Activity window** — recent GitHub events with icons
- **Terminal window** — interactive terminal with commands: `help`, `whoami`, `ls`, `cat <repo>`, `stats`, `activity`, `clear`
- **Terminal Scroller window** — loads pshickeydev.github.io/terminal-scroller in an iframe
- **D3 Graph Viz window** — loads pshickeydev.github.io/d3-graph-viz in an iframe

## API Rate Limiting

The site uses unauthenticated GitHub API calls (60 requests/hour per IP). Data is cached in `localStorage` for 10 minutes to minimize API usage. For high traffic, consider setting up a GitHub OAuth app for a client ID (5000 requests/hour).

## Customization

- **Username**: Edit `js/github.js` → `GITHUB_USERNAME`
- **Theme colors**: Edit `css/xfce.css` and `css/windows.css`
- **Desktop icons**: Edit `js/desktop.js` → `desktopIcons` array
- **Menu items**: Edit `js/desktop.js` → `menuItems` array
- **Wallpaper**: Edit `#desktop` background in `css/xfce.css`
- **Terminal commands**: Edit `js/apps.js` → `processCommand()`

## File Structure

```
├── index.html           # Entry point
├── _config.yml          # GitHub Pages / Jekyll config
├── css/
│   ├── xfce.css         # Desktop, panel, menu, icons
│   └── windows.css      # Window manager and app content styles
└── js/
    ├── github.js        # GitHub API module with caching
    ├── windowmanager.js # Window manager (drag, resize, focus)
    ├── desktop.js       # Desktop environment (icons, panel, menu, clock)
    ├── apps.js          # App definitions (Profile, Repos, Activity, Terminal, Terminal Scroller, D3 Graph Viz)
    └── main.js          # Entry point
```
