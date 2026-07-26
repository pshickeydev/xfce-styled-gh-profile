/**
 * App Definitions
 * Each app creates a window with specific content.
 * Apps: Profile, Repos, Activity, Terminal
 */

const Apps = (function () {
  // Track open windows by app type to prevent duplicates
  const openApps = {};

  function launch(appId) {
    // If already open, focus or restore it
    if (openApps[appId]) {
      const win = openApps[appId];
      if (win.minimized) {
        WindowManager.restoreWindow(win);
      } else {
        WindowManager.focusWindow(win);
      }
      return;
    }

    const config = getAppConfig(appId);
    if (!config) return;

    const win = WindowManager.createWindow({
      title: config.title,
      icon: config.icon,
      width: config.width,
      height: config.height,
      content: '<div class="window-loading"><div class="spinner"></div><span>Loading...</span></div>',
      onMount: (contentEl, winRef) => {
        config.loader(contentEl, winRef);
      },
      onClose: () => {
        delete openApps[appId];
      }
    });

    openApps[appId] = win;
  }

  function getAppConfig(appId) {
    const icons = Desktop.Icons;

    const configs = {
      profile: {
        title: 'Profile - About Me',
        icon: icons.profile,
        width: 480,
        height: 500,
        loader: loadProfile
      },
      repos: {
        title: 'Repositories - File Manager',
        icon: icons.repos,
        width: 560,
        height: 420,
        loader: loadRepos
      },
      activity: {
        title: 'Activity - Recent Events',
        icon: icons.activity,
        width: 500,
        height: 400,
        loader: loadActivity
      },
      terminal: {
        title: 'Terminal',
        icon: icons.terminal,
        width: 600,
        height: 360,
        loader: loadTerminal
      },
      scroller: {
        title: 'Terminal Scroller',
        icon: icons.scroller,
        width: 800,
        height: 500,
        loader: loadIframeApp('https://pshickeydev.github.io/terminal-scroller/')
      },
      graphviz: {
        title: 'D3 Graph Viz',
        icon: icons.graphviz,
        width: 800,
        height: 500,
        loader: loadIframeApp('https://pshickeydev.github.io/d3-graph-viz/')
      }
    };

    return configs[appId];
  }

  // ========================================
  // Iframe App (external GitHub Pages sites)
  // ========================================
  function loadIframeApp(url) {
    return function (contentEl, win) {
      contentEl.innerHTML = `
        <div class="iframe-app">
          <div class="iframe-loading"><div class="spinner"></div><span>Loading...</span></div>
          <iframe class="app-iframe" src="${url}" title="${win.title}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
        </div>
      `;
      const iframe = contentEl.querySelector('.app-iframe');
      const loading = contentEl.querySelector('.iframe-loading');
      iframe.addEventListener('load', () => {
        if (loading) loading.remove();
      });
    };
  }

  // ========================================
  // Profile App
  // ========================================
  function loadProfile(contentEl, win) {
    GitHubAPI.getUser().then(user => {
      const created = new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });

      contentEl.innerHTML = `
        <div class="profile-content">
          <div class="profile-header">
            <img class="profile-avatar" src="${user.avatar_url}" alt="${escapeHtml(user.name || user.login)} avatar">
            <div class="profile-info">
              <div class="profile-name">${user.name || user.login}</div>
              <div class="profile-login">@${user.login}</div>
              ${user.bio ? `<div class="profile-bio">${escapeHtml(user.bio)}</div>` : ''}
            </div>
          </div>
          <div class="profile-stats">
            <div class="profile-stat">
              <div class="stat-value">${user.public_repos}</div>
              <div class="stat-label">Repos</div>
            </div>
            <div class="profile-stat">
              <div class="stat-value">${user.followers}</div>
              <div class="stat-label">Followers</div>
            </div>
            <div class="profile-stat">
              <div class="stat-value">${user.following}</div>
              <div class="stat-label">Following</div>
            </div>
            <div class="profile-stat">
              <div class="stat-value">${formatNumber(user.public_gists || 0)}</div>
              <div class="stat-label">Gists</div>
            </div>
          </div>
          ${user.company ? `<div class="profile-meta"><strong>Company:</strong> ${escapeHtml(user.company)}</div>` : ''}
          ${user.location ? `<div class="profile-meta"><strong>Location:</strong> ${escapeHtml(user.location)}</div>` : ''}
          ${user.blog ? `<div class="profile-meta"><strong>Blog:</strong> <a class="profile-link" href="${ensureProtocol(user.blog)}" target="_blank">${escapeHtml(user.blog)}</a></div>` : ''}
          <div class="profile-meta"><strong>Member since:</strong> ${created}</div>
          <a class="profile-link" href="${user.html_url}" target="_blank">View on GitHub →</a>
        </div>
      `;
    }).catch(err => {
      contentEl.innerHTML = `<div class="window-loading"><span style="color:#c00;">Error: ${escapeHtml(err.message)}</span></div>`;
    });
  }

  // ========================================
  // Repos App (Thunar-style file manager)
  // ========================================
  function loadRepos(contentEl, win) {
    GitHubAPI.getRepos().then(repos => {
      renderRepoGrid(contentEl, repos, win);
    }).catch(err => {
      contentEl.innerHTML = `<div class="window-loading"><span style="color:#c00;">Error: ${escapeHtml(err.message)}</span></div>`;
    });
  }

  function renderRepoGrid(contentEl, repos, win) {
    const sortedRepos = repos.slice().sort((a, b) => {
      // Pinned first, then by updated date
      if (a.fork && !b.fork) return 1;
      if (!a.fork && b.fork) return -1;
      return new Date(b.updated_at) - new Date(a.updated_at);
    });

    contentEl.innerHTML = `
      <div class="repos-content">
        <div class="repos-toolbar">
          <span class="toolbar-path">/home/${GitHubAPI.username}/repositories</span>
          <span style="color:#888;">${sortedRepos.length} items</span>
        </div>
        <div class="repos-grid">
          ${sortedRepos.map(repo => `
            <div class="repo-item" data-repo="${repo.name}" tabindex="0" role="button" aria-label="${escapeHtml(repo.name)} repository">
              <img class="repo-icon" src="${Desktop.Icons.repos}" alt="" aria-hidden="true">
              <span class="repo-name">${escapeHtml(repo.name)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    contentEl.querySelectorAll('.repo-item').forEach(el => {
      let clickTimer = null;
      function openItem() {
        if (clickTimer) {
          clearTimeout(clickTimer);
          clickTimer = null;
          const repo = repos.find(r => r.name === el.dataset.repo);
          if (repo) showRepoDetail(contentEl, repo, repos, win);
        } else {
          contentEl.querySelectorAll('.repo-item.selected').forEach(s => s.classList.remove('selected'));
          el.classList.add('selected');
          clickTimer = setTimeout(() => { clickTimer = null; }, 300);
        }
      }
      el.addEventListener('click', openItem);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const repo = repos.find(r => r.name === el.dataset.repo);
          if (repo) showRepoDetail(contentEl, repo, repos, win);
        }
        // Arrow navigation
        const items = Array.from(contentEl.querySelectorAll('.repo-item'));
        const currentIdx = items.indexOf(el);
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          const next = items[(currentIdx + 1) % items.length];
          if (next) next.focus();
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = items[(currentIdx - 1 + items.length) % items.length];
          if (prev) prev.focus();
        }
      });
    });
  }

  function showRepoDetail(contentEl, repo, allRepos, win) {
    // Update window title
    win.title = repo.name + ' - File Manager';
    win.el.querySelector('.window-title-text').textContent = win.title;

    const updated = new Date(repo.updated_at).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
    const pushed = new Date(repo.pushed_at).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });

    contentEl.innerHTML = `
      <div class="repo-detail">
        <div class="repo-back-btn" id="repo-back" role="button" tabindex="0" aria-label="Back to repositories">
          <svg class="icon-svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polyline points="10,3 4,8 10,13"/>
          </svg>
          Back
        </div>
        <div class="repo-detail-header">
          <img class="repo-detail-icon" src="${Desktop.Icons.repos}" alt="" aria-hidden="true">
          <div>
            <div class="repo-detail-name">${escapeHtml(repo.name)}</div>
            ${repo.fork ? '<div class="repo-detail-desc" style="color:#888;font-size:11px;">Forked</div>' : ''}
          </div>
        </div>
        ${repo.description ? `<div class="repo-detail-desc">${escapeHtml(repo.description)}</div>` : '<div class="repo-detail-desc" style="color:#999;font-style:italic;">No description</div>'}
        <div class="repo-detail-meta">
          <span>★ ${repo.stargazers_count}</span>
          <span>⑂ ${repo.forks_count}</span>
          <span>Watch: ${repo.watchers_count}</span>
          <span>Lang: ${repo.language || 'N/A'}</span>
        </div>
        <div class="repo-detail-meta">
          <span>Updated: ${updated}</span>
          <span>Last push: ${pushed}</span>
          <span>Open issues: ${repo.open_issues_count}</span>
        </div>
        <div class="repo-detail-meta">
          <span>License: ${repo.license ? escapeHtml(repo.license.name) : 'None'}</span>
        </div>
        <a class="profile-link" href="${repo.html_url}" target="_blank">View on GitHub →</a>
        ${repo.homepage ? `<a class="profile-link" href="${ensureProtocol(repo.homepage)}" target="_blank">View Homepage →</a>` : ''}
      </div>
    `;

    document.getElementById('repo-back').addEventListener('click', () => {
      win.title = 'Repositories - File Manager';
      win.el.querySelector('.window-title-text').textContent = win.title;
      renderRepoGrid(contentEl, allRepos, win);
    });
    document.getElementById('repo-back').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.currentTarget.click();
      }
    });

    // Fetch languages
    fetch(repo.languages_url, { headers: { 'Accept': 'application/vnd.github.v3+json' } })
      .then(r => r.json())
      .then(langs => {
        const total = Object.values(langs).reduce((a, b) => a + b, 0);
        if (total === 0) return;

        const detailEl = contentEl.querySelector('.repo-detail');
        const langBarHtml = `
          <div>
            <div class="repo-lang-bar">
              ${Object.entries(langs).map(([name, bytes]) => {
                const pct = (bytes / total * 100).toFixed(1);
                const color = getLanguageColor(name);
                return `<div class="repo-lang-segment" style="width:${pct}%;background:${color};"></div>`;
              }).join('')}
            </div>
            <div class="repo-lang-legend">
              ${Object.entries(langs).sort((a, b) => b[1] - a[1]).map(([name, bytes]) => {
                const pct = (bytes / total * 100).toFixed(1);
                const color = getLanguageColor(name);
                return `<span><span class="lang-dot" style="background:${color};"></span>${escapeHtml(name)} ${pct}%</span>`;
              }).join('')}
            </div>
          </div>
        `;
        detailEl.insertAdjacentHTML('beforeend', langBarHtml);
      })
      .catch(() => {});
  }

  // ========================================
  // Activity App
  // ========================================
  function loadActivity(contentEl, win) {
    GitHubAPI.getEvents().then(events => {
      if (events.length === 0) {
        contentEl.innerHTML = '<div class="window-loading"><span>No recent activity</span></div>';
        return;
      }

      contentEl.innerHTML = `
        <div class="activity-content">
          <div class="activity-list">
            ${events.slice(0, 25).map(event => `
              <div class="activity-item">
                <img class="activity-icon" src="${getActivityIcon(event.type)}" alt="" aria-hidden="true">
                <div class="activity-text">
                  <span class="activity-type">${formatEventType(event.type)}</span>
                  <span class="activity-repo">${escapeHtml(event.repo.name)}</span>
                  <br>
                  <span class="activity-time">${timeAgo(new Date(event.created_at))}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).catch(err => {
      contentEl.innerHTML = `<div class="window-loading"><span style="color:#c00;">Error: ${escapeHtml(err.message)}</span></div>`;
    });
  }

  // ========================================
  // Terminal App
  // ========================================
  function loadTerminal(contentEl, win) {
    contentEl.innerHTML = `
      <div class="terminal-content" id="terminal-output">
      </div>
    `;

    const output = contentEl.querySelector('#terminal-output');
    const state = { user: GitHubAPI.username, cwd: '~' };

    function addLine(html) {
      const line = document.createElement('div');
      line.className = 'terminal-line';
      line.innerHTML = html;
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    }

    function addPrompt(input) {
      const wrap = document.createElement('div');
      wrap.className = 'terminal-input-line';
      wrap.innerHTML = `<span class="terminal-prompt">${state.user}@github</span>:<span class="terminal-accent">${state.cwd}</span>$`;
      const inputEl = document.createElement('input');
      inputEl.className = 'terminal-input';
      inputEl.type = 'text';
      inputEl.autocomplete = 'off';
      inputEl.spellcheck = false;
      wrap.appendChild(inputEl);
      output.appendChild(wrap);
      inputEl.focus();
      output.scrollTop = output.scrollHeight;

      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const cmd = inputEl.value.trim();
          inputEl.disabled = true;
          inputEl.parentElement.style.opacity = '0.7';
          processCommand(cmd, addLine, addPrompt, state);
        }
      });
    }

    // Boot message
    addLine(`<span class="terminal-green">GitHub Terminal v1.0</span> <span class="terminal-dim">- Connected to ${GitHubAPI.username}</span>`);
    addLine(`<span class="terminal-dim">Type 'help' for available commands.</span>`);
    addLine('');
    addPrompt();

    // Click anywhere focuses the input
    output.addEventListener('click', () => {
      const lastInput = output.querySelector('.terminal-input:not([disabled])');
      if (lastInput) lastInput.focus();
    });
  }

  function processCommand(cmd, addLine, addPrompt, state) {
    const parts = cmd.split(/\s+/);
    const command = parts[0].toLowerCase();
    let isAsync = false;

    switch (command) {
      case '':
        break;
      case 'help':
        addLine('<span class="terminal-dim">Available commands:</span>');
        addLine('  <span class="terminal-accent">whoami</span>     - Show profile info');
        addLine('  <span class="terminal-accent">ls</span>         - List repositories');
        addLine('  <span class="terminal-accent">cat</span> &lt;repo&gt; - Show repo details');
        addLine('  <span class="terminal-accent">stats</span>      - Show GitHub stats');
        addLine('  <span class="terminal-accent">activity</span>   - Show recent activity');
        addLine('  <span class="terminal-accent">clear</span>      - Clear terminal');
        addLine('  <span class="terminal-accent">help</span>       - Show this help');
        break;

      case 'whoami': {
        isAsync = true;
        addLine('<span class="terminal-dim">Fetching profile...</span>');
        GitHubAPI.getUser().then(user => {
          addLine(`<span class="terminal-accent">${escapeHtml(user.name || user.login)}</span> (@${user.login})`);
          if (user.bio) addLine(`  ${escapeHtml(user.bio)}`);
          if (user.company) addLine(`  Company: ${escapeHtml(user.company)}`);
          if (user.location) addLine(`  Location: ${escapeHtml(user.location)}`);
          addLine(`  Followers: ${user.followers} | Following: ${user.following}`);
          addLine(`  Public repos: ${user.public_repos}`);
        }).catch(err => {
          addLine(`<span style="color:#f38ba8;">Error: ${escapeHtml(err.message)}</span>`);
        }).finally(() => {
          addPrompt();
        });
        break;
      }

      case 'ls':
      case 'dir': {
        isAsync = true;
        addLine('<span class="terminal-dim">Fetching repositories...</span>');
        GitHubAPI.getRepos().then(repos => {
          if (repos.length === 0) {
            addLine('<span class="terminal-dim">No repositories found.</span>');
          } else {
            repos.slice(0, 20).forEach(repo => {
              const fork = repo.fork ? '<span class="terminal-dim">[fork]</span>' : '';
              const lang = repo.language ? `<span class="terminal-dim">(${escapeHtml(repo.language)})</span>` : '';
              addLine(`  <span class="terminal-accent">${escapeHtml(repo.name)}</span> ${fork} ${lang} ★${repo.stargazers_count}`);
            });
            if (repos.length > 20) {
              addLine(`  <span class="terminal-dim">... and ${repos.length - 20} more</span>`);
            }
          }
        }).catch(err => {
          addLine(`<span style="color:#f38ba8;">Error: ${escapeHtml(err.message)}</span>`);
        }).finally(() => {
          addPrompt();
        });
        break;
      }

      case 'cat': {
        const repoName = parts[1];
        if (!repoName) {
          addLine('<span style="color:#f38ba8;">Usage: cat &lt;repo-name&gt;</span>');
          break;
        }
        isAsync = true;
        addLine(`<span class="terminal-dim">Fetching ${escapeHtml(repoName)}...</span>`);
        GitHubAPI.getRepos().then(repos => {
          const repo = repos.find(r => r.name === repoName);
          if (!repo) {
            addLine(`<span style="color:#f38ba8;">Repository not found: ${escapeHtml(repoName)}</span>`);
            return;
          }
          addLine(`<span class="terminal-accent">${escapeHtml(repo.name)}</span> ${repo.fork ? '[fork]' : ''}`);
          if (repo.description) addLine(`  ${escapeHtml(repo.description)}`);
          addLine(`  Language: ${repo.language || 'N/A'}`);
          addLine(`  Stars: ${repo.stargazers_count} | Forks: ${repo.forks_count}`);
          addLine(`  Open issues: ${repo.open_issues_count}`);
          addLine(`  Updated: ${new Date(repo.updated_at).toLocaleDateString()}`);
          addLine(`  URL: <span class="terminal-dim">${repo.html_url}</span>`);
        }).catch(err => {
          addLine(`<span style="color:#f38ba8;">Error: ${escapeHtml(err.message)}</span>`);
        }).finally(() => {
          addPrompt();
        });
        break;
      }

      case 'stats': {
        isAsync = true;
        addLine('<span class="terminal-dim">Fetching stats...</span>');
        GitHubAPI.getUser().then(user => {
          addLine(`  Repositories: ${user.public_repos}`);
          addLine(`  Followers: ${user.followers}`);
          addLine(`  Following: ${user.following}`);
          addLine(`  Gists: ${user.public_gists || 0}`);
          addLine(`  Created: ${new Date(user.created_at).toLocaleDateString()}`);
        }).catch(err => {
          addLine(`<span style="color:#f38ba8;">Error: ${escapeHtml(err.message)}</span>`);
        }).finally(() => {
          addPrompt();
        });
        break;
      }

      case 'activity': {
        isAsync = true;
        addLine('<span class="terminal-dim">Fetching activity...</span>');
        GitHubAPI.getEvents().then(events => {
          if (events.length === 0) {
            addLine('<span class="terminal-dim">No recent activity.</span>');
          } else {
            events.slice(0, 10).forEach(event => {
              addLine(`  <span class="terminal-accent">${escapeHtml(event.repo.name)}</span> <span class="terminal-dim">${formatEventType(event.type)} - ${timeAgo(new Date(event.created_at))}</span>`);
            });
          }
        }).catch(err => {
          addLine(`<span style="color:#f38ba8;">Error: ${escapeHtml(err.message)}</span>`);
        }).finally(() => {
          addPrompt();
        });
        break;
      }

      case 'clear': {
        const output = document.getElementById('terminal-output');
        output.innerHTML = '';
        break;
      }

      case 'exit':
        addLine('<span class="terminal-dim">Use the close button to exit.</span>');
        break;

      default:
        addLine(`<span style="color:#f38ba8;">Unknown command: ${escapeHtml(command)}</span>`);
        addLine('<span class="terminal-dim">Type "help" for available commands.</span>');
        break;
    }

    if (!isAsync) {
      addPrompt();
    }
  }

  // ========================================
  // Helpers
  // ========================================
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function ensureProtocol(url) {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return 'https://' + url;
  }

  function formatNumber(n) {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  }

  function timeAgo(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + ' minute' + (minutes !== 1 ? 's' : '') + ' ago';
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + ' hour' + (hours !== 1 ? 's' : '') + ' ago';
    const days = Math.floor(hours / 24);
    if (days < 30) return days + ' day' + (days !== 1 ? 's' : '') + ' ago';
    const months = Math.floor(days / 30);
    if (months < 12) return months + ' month' + (months !== 1 ? 's' : '') + ' ago';
    const years = Math.floor(months / 12);
    return years + ' year' + (years !== 1 ? 's' : '') + ' ago';
  }

  function formatEventType(type) {
    const map = {
      'PushEvent': 'pushed to',
      'CreateEvent': 'created',
      'DeleteEvent': 'deleted',
      'ForkEvent': 'forked',
      'IssueCommentEvent': 'commented on',
      'IssuesEvent': 'interacted with issue in',
      'PullRequestEvent': 'opened pull request in',
      'WatchEvent': 'starred',
      'ReleaseEvent': 'released',
      'CommitCommentEvent': 'commented on commit in',
      'MemberEvent': 'added member to',
      'PublicEvent': 'made public'
    };
    return map[type] || type.replace('Event', '').toLowerCase();
  }

  function getActivityIcon(type) {
    const base = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">`;
    let icon;
    switch (type) {
      case 'PushEvent':
        icon = `${base}<path d="M3 8h8M7 4l4 4-4 4" stroke="#4a7ab5" stroke-width="2" fill="none"/></svg>`;
        break;
      case 'CreateEvent':
        icon = `${base}<path d="M8 3v10M3 8h10" stroke="#5a9a3a" stroke-width="2" fill="none"/></svg>`;
        break;
      case 'ForkEvent':
        icon = `${base}<circle cx="5" cy="4" r="1.5" fill="#b89838"/><circle cx="11" cy="4" r="1.5" fill="#b89838"/><circle cx="8" cy="12" r="1.5" fill="#b89838"/><path d="M5 6v2h6V6M8 8v2" stroke="#b89838" stroke-width="1.5" fill="none"/></svg>`;
        break;
      case 'WatchEvent':
        icon = `${base}<path d="M8 3l2 4 4 .5-3 3 1 4-4-2-4 2 1-4-3-3 4-.5z" fill="#e8c878" stroke="#b89838" stroke-width="1"/></svg>`;
        break;
      default:
        icon = `${base}<circle cx="8" cy="8" r="5" fill="#d4d4d4" stroke="#888" stroke-width="1.5"/></svg>`;
    }
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(icon);
  }

  function getLanguageColor(lang) {
    const colors = {
      'JavaScript': '#f1e05a',
      'TypeScript': '#3178c6',
      'Python': '#3572A5',
      'Java': '#b07219',
      'C': '#555555',
      'C++': '#f34b7d',
      'C#': '#178600',
      'PHP': '#4F5D95',
      'Ruby': '#701516',
      'Go': '#00ADD8',
      'Rust': '#dea584',
      'Swift': '#F05138',
      'Kotlin': '#A97BFF',
      'Dart': '#00B4AB',
      'Scala': '#c22d40',
      'Shell': '#89e051',
      'HTML': '#e34c26',
      'CSS': '#563d7c',
      'Vue': '#41b883',
      'Svelte': '#ff3e00',
      'Lua': '#000080',
      'Perl': '#0298c3',
      'R': '#198CE7',
      'Haskell': '#5e5086',
      'Elixir': '#6e4a7e',
      'Clojure': '#db5855',
      'Zig': '#ec915c',
      'Nix': '#7e7eff',
      'Vue': '#41b883',
      'Dockerfile': '#384d54',
      'Makefile': '#427819',
      'Vim Script': '#199f4b',
      'Assembly': '#6E4C13',
      'Crystal': '#000100',
      'OCaml': '#3be133',
      'F#': '#b845fc',
      'Nim': '#37775b',
      'Objective-C': '#438eff',
      'PowerShell': '#012456',
      'Tcl': '#e4cc98'
    };
    return colors[lang] || '#888888';
  }

  return {
    launch: launch
  };
})();
