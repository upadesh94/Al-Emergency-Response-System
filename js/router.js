/**
 * router.js — Hash-based SPA tab router
 */

const Router = (() => {
  const routes = {};
  let currentRoute = null;

  function register(name, onEnter) {
    routes[name] = onEnter;
  }

  function navigate(name) {
    // Hide all section pages
    document.querySelectorAll('.section-page').forEach(el => {
      el.classList.remove('active');
    });
    // Deactivate all nav items
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.remove('active');
    });

    const page = document.getElementById(`page-${name}`);
    if (page) page.classList.add('active');

    const navEl = document.querySelector(`[data-route="${name}"]`);
    if (navEl) navEl.classList.add('active');

    const titleEl = document.getElementById('topbar-page-title');
    if (titleEl && navEl) {
      titleEl.textContent = navEl.querySelector('.nav-label')?.textContent || '';
    }

    window.location.hash = name;
    currentRoute = name;

    if (routes[name]) routes[name]();
  }

  function init(defaultRoute) {
    const hash = window.location.hash.replace('#', '');
    navigate(hash && routes[hash] ? hash : defaultRoute);
    window.addEventListener('hashchange', () => {
      const h = window.location.hash.replace('#', '');
      if (h && routes[h] && h !== currentRoute) navigate(h);
    });
  }

  return { register, navigate, init, current: () => currentRoute };
})();

window.Router = Router;
