/**
 * Desktop Environment
 * Manages desktop icons, panel, taskbar, menu, and clock.
 */

const Desktop = (function () {
  let selectedIcon = null;
  let menuOpen = false;

  // SVG icon generator - returns data URI
  function svgIcon(svg, size) {
    size = size || 32;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  const Icons = {
    // Profile - person icon (greybird style)
    profile: svgIcon(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
        <circle cx="16" cy="12" r="6" fill="#7a9ec2" stroke="#4a6a8c" stroke-width="1.5"/>
        <path d="M6 28 Q6 20 16 20 Q26 20 26 28 Z" fill="#7a9ec2" stroke="#4a6a8c" stroke-width="1.5"/>
      </svg>`
    ),

    // Repos - folder icon
    repos: svgIcon(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
        <path d="M4 8 L12 8 L14 10 L28 10 L28 26 L4 26 Z" fill="#e8c878" stroke="#b89838" stroke-width="1.5"/>
        <path d="M4 8 L12 8 L14 10 L28 10" fill="none" stroke="#b89838" stroke-width="1.5"/>
      </svg>`
    ),

    // Activity - graph icon
    activity: svgIcon(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
        <rect x="3" y="3" width="26" height="26" rx="3" fill="#c8e0f0" stroke="#6a9ec8" stroke-width="1.5"/>
        <polyline points="6,20 11,16 16,18 21,10 26,12" fill="none" stroke="#2a6a9c" stroke-width="2"/>
        <circle cx="11" cy="16" r="1.5" fill="#2a6a9c"/>
        <circle cx="21" cy="10" r="1.5" fill="#2a6a9c"/>
      </svg>`
    ),

    // Terminal - terminal icon
    terminal: svgIcon(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
        <rect x="3" y="5" width="26" height="22" rx="3" fill="#1e1e2e" stroke="#888" stroke-width="1.5"/>
        <text x="6" y="16" fill="#a6e3a1" font-family="monospace" font-size="6">&gt;_</text>
        <line x1="6" y1="20" x2="14" y2="20" stroke="#cdd6f4" stroke-width="1"/>
      </svg>`
    ),

    // Terminal Scroller - terminal with scroll arrows
    scroller: svgIcon(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
        <rect x="3" y="4" width="26" height="24" rx="3" fill="#1a1a2e" stroke="#888" stroke-width="1.5"/>
        <text x="6" y="12" fill="#a6e3a1" font-family="monospace" font-size="5">&gt;_</text>
        <line x1="6" y1="14" x2="20" y2="14" stroke="#cdd6f4" stroke-width="0.8"/>
        <line x1="6" y1="17" x2="16" y2="17" stroke="#cdd6f4" stroke-width="0.8"/>
        <line x1="6" y1="20" x2="18" y2="20" stroke="#cdd6f4" stroke-width="0.8"/>
        <polygon points="24,16 20,12 20,20" fill="#6a9fd4"/>
      </svg>`
    ),

    // D3 Graph Viz - network graph icon
    graphviz: svgIcon(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
        <rect x="3" y="3" width="26" height="26" rx="3" fill="#e8e8e8" stroke="#6a9fd4" stroke-width="1.5"/>
        <line x1="9" y1="10" x2="16" y2="8" stroke="#4a7ab5" stroke-width="1.5"/>
        <line x1="9" y1="10" x2="22" y2="20" stroke="#4a7ab5" stroke-width="1.5"/>
        <line x1="16" y1="8" x2="22" y2="20" stroke="#4a7ab5" stroke-width="1.5"/>
        <circle cx="9" cy="10" r="3" fill="#6a9fd4" stroke="#4a6a8c" stroke-width="1"/>
        <circle cx="16" cy="8" r="2.5" fill="#7ab5e8" stroke="#4a6a8c" stroke-width="1"/>
        <circle cx="22" cy="20" r="3" fill="#6a9fd4" stroke="#4a6a8c" stroke-width="1"/>
        <circle cx="12" cy="22" r="2.5" fill="#7ab5e8" stroke="#4a6a8c" stroke-width="1"/>
        <line x1="22" y1="20" x2="12" y2="22" stroke="#4a7ab5" stroke-width="1.5"/>
      </svg>`
    ),

    // Menu (mouse logo - XFCE's whisker menu icon)
    menu: svgIcon(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
        <ellipse cx="8" cy="9" rx="5" ry="6" fill="#d4d4d4" stroke="#666" stroke-width="1"/>
        <line x1="8" y1="3" x2="8" y2="7" stroke="#888" stroke-width="1.5"/>
        <circle cx="8" cy="6" r="1" fill="#888"/>
      </svg>`
    ),

    // Close button
    close: svgIcon(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="3" x2="9" y2="9"/>
        <line x1="9" y1="3" x2="3" y2="9"/>
      </svg>`
    ),

    // Back arrow
    back: svgIcon(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="10,3 4,8 10,13"/>
      </svg>`
    )
  };

  const desktopIcons = [
    { id: 'profile', label: 'Profile', icon: Icons.profile, app: 'profile' },
    { id: 'repos', label: 'Repositories', icon: Icons.repos, app: 'repos' },
    { id: 'activity', label: 'Activity', icon: Icons.activity, app: 'activity' },
    { id: 'terminal', label: 'Terminal', icon: Icons.terminal, app: 'terminal' },
    { id: 'scroller', label: 'Terminal Scroller', icon: Icons.scroller, app: 'scroller' },
    { id: 'graphviz', label: 'D3 Graph Viz', icon: Icons.graphviz, app: 'graphviz' }
  ];

  const menuItems = [
    { id: 'profile', label: 'Profile', icon: Icons.profile, app: 'profile' },
    { id: 'repos', label: 'Repositories', icon: Icons.repos, app: 'repos' },
    { id: 'activity', label: 'Activity', icon: Icons.activity, app: 'activity' },
    { id: 'terminal', label: 'Terminal', icon: Icons.terminal, app: 'terminal' },
    { id: 'scroller', label: 'Terminal Scroller', icon: Icons.scroller, app: 'scroller' },
    { id: 'graphviz', label: 'D3 Graph Viz', icon: Icons.graphviz, app: 'graphviz' }
  ];

  function init() {
    renderDesktopIcons();
    renderMenu();
    initMenuButton();
    startClock();
    initDesktopClick();
  }

  function renderDesktopIcons() {
    const container = document.getElementById('desktop-icons');
    container.innerHTML = '';
    desktopIcons.forEach((item) => {
      const el = document.createElement('div');
      el.className = 'desktop-icon';
      el.dataset.app = item.app;
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', item.label + ' - double click to open');
      el.innerHTML = `
        <img class="icon-img" src="${item.icon}" alt="${item.label} icon">
        <span class="icon-label">${item.label}</span>
      `;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (selectedIcon) selectedIcon.classList.remove('selected');
        selectedIcon = el;
        el.classList.add('selected');
      });
      el.addEventListener('dblclick', () => {
        Apps.launch(item.app);
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          Apps.launch(item.app);
        }
        // Arrow navigation between icons
        const icons = Array.from(container.querySelectorAll('.desktop-icon'));
        const currentIdx = icons.indexOf(el);
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          const next = icons[(currentIdx + 1) % icons.length];
          if (next) next.focus();
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const prev = icons[(currentIdx - 1 + icons.length) % icons.length];
          if (prev) prev.focus();
        }
      });
      container.appendChild(el);
    });
  }

  function renderMenu() {
    const menu = document.getElementById('menu-dropdown');
    renderMenuWithAvatar('');

    // Fetch avatar lazily only when menu is first opened
    let avatarFetched = false;
    function fetchAvatarOnce() {
      if (avatarFetched) return;
      avatarFetched = true;
      GitHubAPI.getUser().then(user => {
        const avatarUrl = user.avatar_url || '';
        if (avatarUrl) {
          const header = menu.querySelector('.menu-header');
          if (header) {
            const placeholder = header.querySelector('.menu-avatar');
            const img = document.createElement('img');
            img.className = 'menu-avatar';
            img.src = avatarUrl;
            img.alt = GitHubAPI.username + ' avatar';
            header.replaceChild(img, placeholder);
          }
        }
      }).catch(() => {});
    }

    function renderMenuWithAvatar(avatarUrl) {
      menu.innerHTML = `
        <div class="menu-header">
          ${avatarUrl ? `<img class="menu-avatar" src="${avatarUrl}" alt="${GitHubAPI.username} avatar">` : `<div class="menu-avatar" style="background:#ccc;width:32px;height:32px;border-radius:3px;" role="img" aria-label="No avatar"></div>`}
          <span>Applications</span>
        </div>
        <div class="menu-section" role="none">
          ${menuItems.map((item) => `
            <div class="menu-item" data-app="${item.app}" role="menuitem" tabindex="-1" aria-label="${item.label}">
              <img class="menu-item-icon" src="${item.icon}" alt="" aria-hidden="true">
              <span>${item.label}</span>
            </div>
          `).join('')}
        </div>
      `;

      const items = menu.querySelectorAll('.menu-item');
      items.forEach((el, idx) => {
        el.addEventListener('click', () => {
          Apps.launch(el.dataset.app);
          closeMenu();
        });
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            Apps.launch(el.dataset.app);
            closeMenu();
            document.getElementById('menu-button').focus();
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = items[(idx + 1) % items.length];
            if (next) next.focus();
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = items[(idx - 1 + items.length) % items.length];
            if (prev) prev.focus();
          }
          if (e.key === 'Escape') {
            closeMenu();
            document.getElementById('menu-button').focus();
          }
        });
      });
    }

    // Expose fetchAvatarOnce for the menu button to trigger
    menu._fetchAvatarOnce = fetchAvatarOnce;
  }

  function initMenuButton() {
    const btn = document.getElementById('menu-button');
    const menu = document.getElementById('menu-dropdown');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (menuOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    document.addEventListener('click', (e) => {
      if (menuOpen && !menu.contains(e.target) && !btn.contains(e.target)) {
        closeMenu();
      }
    });
  }

  function openMenu() {
    const menu = document.getElementById('menu-dropdown');
    menu.classList.remove('hidden');
    menu.setAttribute('aria-hidden', 'false');
    const btn = document.getElementById('menu-button');
    btn.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    menuOpen = true;
    // Lazily fetch avatar on first open
    if (menu._fetchAvatarOnce) {
      menu._fetchAvatarOnce();
    }
    // Focus first menu item
    const firstItem = menu.querySelector('.menu-item');
    if (firstItem) {
      setTimeout(() => firstItem.focus(), 0);
    }
  }

  function closeMenu() {
    const menu = document.getElementById('menu-dropdown');
    menu.classList.add('hidden');
    menu.setAttribute('aria-hidden', 'true');
    const btn = document.getElementById('menu-button');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    menuOpen = false;
  }

  function initDesktopClick() {
    document.getElementById('desktop').addEventListener('mousedown', (e) => {
      if (e.target.id === 'desktop' || e.target.id === 'desktop-icons') {
        if (selectedIcon) {
          selectedIcon.classList.remove('selected');
          selectedIcon = null;
        }
      }
    });
  }

  function startClock() {
    const el = document.getElementById('panel-clock');
    function update() {
      const now = new Date();
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = days[now.getDay()];
      const month = months[now.getMonth()];
      const date = now.getDate();
      let hours = now.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const minutes = String(now.getMinutes()).padStart(2, '0');
      el.textContent = `${day} ${month} ${date} ${hours}:${minutes} ${ampm}`;
    }
    update();
    setInterval(update, 1000);
  }

  function updateTaskbar() {
    const taskbar = document.getElementById('panel-taskbar');
    taskbar.innerHTML = '';
    const windows = WindowManager.getWindows();
    windows.forEach(win => {
      const el = document.createElement('div');
      el.className = 'taskbar-item';
      el.setAttribute('role', 'tab');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-selected', !win.minimized && win.el && !win.el.classList.contains('inactive') ? 'true' : 'false');
      el.setAttribute('aria-label', win.title + (win.minimized ? ' (minimized)' : ''));
      if (!win.minimized && win.el && !win.el.classList.contains('inactive')) {
        el.classList.add('active');
      }
      el.innerHTML = `
        ${win.icon ? `<img class="taskbar-icon" src="${win.icon}" alt="" aria-hidden="true">` : ''}
        <span class="taskbar-label">${win.title}</span>
      `;
      el.addEventListener('click', () => {
        if (win.minimized) {
          WindowManager.restoreWindow(win);
        } else if (win.el && win.el.classList.contains('inactive')) {
          WindowManager.focusWindow(win);
        } else {
          WindowManager.minimizeWindow(win);
        }
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          el.click();
        }
      });
      taskbar.appendChild(el);
    });
  }

  return {
    init: init,
    updateTaskbar: updateTaskbar,
    Icons: Icons
  };
})();
