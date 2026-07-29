/**
 * Window Manager
 * Handles window creation, dragging, resizing, focus, minimize, maximize.
 * Mimics XFce's Xfwm4 behavior.
 */

const WindowManager = (function () {
  let windows = [];
  let zIndexCounter = 100;
  let nextId = 1;

  const container = () => document.getElementById('windows-container');

  function isMobile() {
    return window.matchMedia('(max-width: 640px), (max-height: 480px)').matches;
  }

  function getPanelHeight() {
    return isMobile() ? 36 : 30;
  }

  function createWindow(options) {
    const id = nextId++;
    const defaultWidth = options.width || 500;
    const defaultHeight = options.height || 400;
    const panelHeight = getPanelHeight();
    const maxWidth = window.innerWidth - 4;
    const maxHeight = window.innerHeight - panelHeight - 4;
    const width = Math.min(defaultWidth, maxWidth);
    const height = Math.min(defaultHeight, maxHeight);
    const win = {
      id: id,
      title: options.title || 'Window',
      icon: options.icon || '',
      width: width,
      height: height,
      x: options.x !== undefined ? options.x : Math.max(20, (window.innerWidth - width) / 2 + (id * 30) % 100),
      y: options.y !== undefined ? options.y : Math.max(20, (window.innerHeight - panelHeight - height) / 2 + (id * 20) % 60),
      content: options.content || '',
      onMount: options.onMount || null,
      onClose: options.onClose || null,
      resizable: options.resizable !== false,
      maximizable: options.maximizable !== false,
      minimized: false,
      maximized: false,
      prevRect: null,
      el: null
    };

    // Keep within viewport
    win.x = Math.min(win.x, window.innerWidth - win.width - 4);
    win.y = Math.min(win.y, window.innerHeight - win.height - panelHeight - 2);
    win.x = Math.max(0, win.x);
    win.y = Math.max(0, win.y);

    windows.push(win);
    renderWindow(win);
    focusWindow(win);
    Desktop.updateTaskbar();
    return win;
  }

  function renderWindow(win) {
    const el = document.createElement('div');
    el.className = 'window';
    el.dataset.id = win.id;
    el.style.width = win.width + 'px';
    el.style.height = win.height + 'px';
    el.style.left = win.x + 'px';
    el.style.top = win.y + 'px';
    el.style.zIndex = ++zIndexCounter;

    el.innerHTML = `
      <div class="window-titlebar">
        ${win.icon ? `<img class="window-title-icon" src="${win.icon}" alt="" aria-hidden="true">` : ''}
        <span class="window-title-text">${win.title}</span>
        <div class="window-buttons">
          <button class="window-btn minimize" title="Minimize" aria-label="Minimize window">
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <line x1="2" y1="9" x2="10" y2="9"/>
            </svg>
          </button>
          <button class="window-btn maximize" title="Maximize" aria-label="Maximize window">
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <rect x="2" y="2" width="8" height="8" rx="1"/>
            </svg>
          </button>
          <button class="window-btn close" title="Close" aria-label="Close window">
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <line x1="3" y1="3" x2="9" y2="9"/>
              <line x1="9" y1="3" x2="3" y2="9"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="window-content">
        ${win.content}
      </div>
      ${win.resizable ? '<div class="window-resize-handle" aria-hidden="true"></div>' : ''}
    `;

    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', win.title);
    el.setAttribute('aria-modal', 'true');
    el.tabIndex = 0;

    container().appendChild(el);
    win.el = el;

    // Focus on click
    el.addEventListener('mousedown', () => focusWindow(win));
    el.addEventListener('touchstart', (e) => {
      focusWindow(win);
      // Allow default scrolling inside content
      if (e.target.closest('.window-content')) return;
      // Allow taps on window control buttons to reach click handlers
      if (e.target.closest('.window-buttons')) return;
      // Prevent drag-start / scroll interference when touching chrome
      e.preventDefault();
    }, { passive: false });

    // Title bar: drag to move
    const titlebar = el.querySelector('.window-titlebar');
    titlebar.addEventListener('mousedown', (e) => {
      if (e.target.closest('.window-buttons')) return;
      if (win.maximized) return;
      startDrag(win, e);
    });
    titlebar.addEventListener('touchstart', (e) => {
      if (e.target.closest('.window-buttons')) return;
      if (win.maximized) return;
      startDrag(win, e);
    }, { passive: false });

    // Double-click title bar to maximize/restore
    titlebar.addEventListener('dblclick', (e) => {
      if (e.target.closest('.window-buttons')) return;
      if (win.maximizable) toggleMaximize(win);
    });

    // Window buttons
    el.querySelector('.window-btn.minimize').addEventListener('click', (e) => {
      e.stopPropagation();
      minimizeWindow(win);
    });
    el.querySelector('.window-btn.maximize').addEventListener('click', (e) => {
      e.stopPropagation();
      if (win.maximizable) toggleMaximize(win);
    });
    el.querySelector('.window-btn.close').addEventListener('click', (e) => {
      e.stopPropagation();
      closeWindow(win);
    });

    // Resize handle
    if (win.resizable) {
      const handle = el.querySelector('.window-resize-handle');
      handle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        startResize(win, e);
      });
      handle.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        startResize(win, e);
      }, { passive: false });
    }

    // Call onMount callback
    if (win.onMount) {
      win.onMount(el.querySelector('.window-content'), win);
    }
  }

  // --- Global keyboard navigation ---
  // Use a single document-level listener for all windows
  document.addEventListener('keydown', (e) => {
    // Escape: close active window
    if (e.key === 'Escape') {
      const activeWin = windows.find(w => !w.minimized && !w.el.classList.contains('inactive'));
      if (activeWin) {
        e.preventDefault();
        closeWindow(activeWin);
      }
      return;
    }

    // Ctrl+` or Alt+Tab: cycle windows
    if ((e.ctrlKey && e.key === '`') || (e.altKey && e.key === 'Tab')) {
      e.preventDefault();
      cycleWindows();
      return;
    }

    // Tab: trap focus within active window (only if focus is inside a window)
    if (e.key === 'Tab') {
      const activeWin = windows.find(w => !w.minimized && !w.el.classList.contains('inactive'));
      if (activeWin && activeWin.el.contains(document.activeElement)) {
        trapFocus(activeWin, e);
      }
    }
  });

  function trapFocus(win, e) {
    const focusable = win.el.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first || document.activeElement === win.el) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last || document.activeElement === win.el) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function cycleWindows() {
    const visible = windows.filter(w => !w.minimized);
    if (visible.length <= 1) return;

    const currentIdx = visible.findIndex(w => !w.el.classList.contains('inactive'));
    const nextIdx = (currentIdx + 1) % visible.length;
    focusWindow(visible[nextIdx]);
    visible[nextIdx].el.focus();
  }

  function focusWindow(win) {
    if (win.minimized) return;
    win.el.style.zIndex = ++zIndexCounter;
    windows.forEach(w => {
      if (w !== win && !w.minimized) {
        w.el.classList.add('inactive');
      }
    });
    win.el.classList.remove('inactive');
    Desktop.updateTaskbar();
    // Move focus to the window for keyboard navigation
    win.el.focus();
  }

  function minimizeWindow(win) {
    win.minimized = true;
    win.el.classList.add('minimized');
    Desktop.updateTaskbar();
  }

  function restoreWindow(win) {
    win.minimized = false;
    win.el.classList.remove('minimized');
    focusWindow(win);
    win.el.focus();
    Desktop.updateTaskbar();
  }

  function toggleMaximize(win) {
    if (win.maximized) {
      // Restore
      win.maximized = false;
      win.el.classList.remove('maximized');
      if (win.prevRect) {
        win.el.style.width = win.prevRect.width + 'px';
        win.el.style.height = win.prevRect.height + 'px';
        win.el.style.left = win.prevRect.x + 'px';
        win.el.style.top = win.prevRect.y + 'px';
        win.prevRect = null;
      }
    } else {
      // Maximize
      win.prevRect = {
        width: win.width,
        height: win.height,
        x: win.x,
        y: win.y
      };
      win.maximized = true;
      win.el.classList.add('maximized');
    }
    focusWindow(win);
  }

  function closeWindow(win) {
    if (win.onClose) win.onClose(win);
    win.el.remove();
    windows = windows.filter(w => w !== win);
    Desktop.updateTaskbar();
    // Focus next available window or return focus to desktop
    const nextWin = windows.find(w => !w.minimized);
    if (nextWin) {
      focusWindow(nextWin);
      nextWin.el.focus();
    } else {
      document.getElementById('desktop').focus();
    }
  }

  function getWindows() {
    return windows;
  }

  function getPointer(e) {
    if (e.touches && e.touches.length > 0) {
      return e.touches[0];
    }
    if (e.changedTouches && e.changedTouches.length > 0) {
      return e.changedTouches[0];
    }
    return e;
  }

  // --- Dragging ---
  function startDrag(win, e) {
    const pointer = getPointer(e);
    const startX = pointer.clientX;
    const startY = pointer.clientY;
    const startLeft = win.el.offsetLeft;
    const startTop = win.el.offsetTop;

    // Bring to front
    focusWindow(win);

    function onMove(e) {
      const p = getPointer(e);
      let newLeft = startLeft + (p.clientX - startX);
      let newTop = startTop + (p.clientY - startY);
      // Constrain to viewport (above panel)
      const panelHeight = getPanelHeight();
      newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - 40));
      newTop = Math.max(0, Math.min(newTop, window.innerHeight - panelHeight - 2));
      win.el.style.left = newLeft + 'px';
      win.el.style.top = newTop + 'px';
      win.x = newLeft;
      win.y = newTop;
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
      document.removeEventListener('touchcancel', onUp);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
    document.addEventListener('touchcancel', onUp);
    if (e.cancelable) e.preventDefault();
  }

  // --- Resizing ---
  function startResize(win, e) {
    const pointer = getPointer(e);
    const startX = pointer.clientX;
    const startY = pointer.clientY;
    const startWidth = win.el.offsetWidth;
    const startHeight = win.el.offsetHeight;

    function onMove(e) {
      const p = getPointer(e);
      const panelHeight = getPanelHeight();
      let newWidth = Math.max(200, startWidth + (p.clientX - startX));
      let newHeight = Math.max(100, startHeight + (p.clientY - startY));
      // Constrain to viewport
      newWidth = Math.min(newWidth, window.innerWidth - win.el.offsetLeft - 2);
      newHeight = Math.min(newHeight, window.innerHeight - win.el.offsetTop - panelHeight - 2);
      win.el.style.width = newWidth + 'px';
      win.el.style.height = newHeight + 'px';
      win.width = newWidth;
      win.height = newHeight;
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
      document.removeEventListener('touchcancel', onUp);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
    document.addEventListener('touchcancel', onUp);
    if (e.cancelable) e.preventDefault();
  }

  function refitWindows() {
    const panelHeight = getPanelHeight();
    windows.forEach(win => {
      if (win.minimized) return;
      const maxWidth = window.innerWidth - 4;
      const maxHeight = window.innerHeight - panelHeight - 4;
      let newWidth = Math.min(win.width, maxWidth);
      let newHeight = Math.min(win.height, maxHeight);
      let newLeft = Math.min(win.x, window.innerWidth - newWidth - 4);
      let newTop = Math.min(win.y, window.innerHeight - newHeight - panelHeight - 2);
      newLeft = Math.max(0, newLeft);
      newTop = Math.max(0, newTop);

      win.el.style.width = newWidth + 'px';
      win.el.style.height = newHeight + 'px';
      win.el.style.left = newLeft + 'px';
      win.el.style.top = newTop + 'px';
      win.width = newWidth;
      win.height = newHeight;
      win.x = newLeft;
      win.y = newTop;
    });
  }

  window.addEventListener('resize', refitWindows);
  window.addEventListener('orientationchange', refitWindows);

  return {
    createWindow: createWindow,
    focusWindow: focusWindow,
    minimizeWindow: minimizeWindow,
    restoreWindow: restoreWindow,
    toggleMaximize: toggleMaximize,
    closeWindow: closeWindow,
    getWindows: getWindows,
    refitWindows: refitWindows
  };
})();
