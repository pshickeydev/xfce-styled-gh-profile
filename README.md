# XFCE GitHub Pages Desktop

A GitHub Pages site that displays your GitHub profile styled as an XFCE desktop environment.

## Quick Start

1. **Create a repository named `pshickeydev.github.io`** (or any name, and enable GitHub Pages in Settings → Pages).

2. **Copy all files** to the root of that repository.

3. **Set your GitHub username** in `js/github.js` (line 12):
   ```js
   const GITHUB_USERNAME = window.GH_USERNAME || 'pshickeydev';
   ```
   Change `'pshickeydev'` to your GitHub username, or set `window.GH_USERNAME` before the script loads.

4. **Push to GitHub** and enable Pages (Settings → Pages → Source: `main` branch, `/` (root) folder).

5. **Wait a minute** for Pages to build, then visit your URL.

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
