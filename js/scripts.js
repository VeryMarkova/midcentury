
/* ===== Very Markova: tiny JS that does its job and goes home ===== */
(() => {
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => c.querySelectorAll(s);

    /* ---- 1) Year stamp (won’t throw if #year is missing) ---- */
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* ---- 2) Sidebar drawer toggle (buttons are OUTSIDE <aside>) ---- */
    const bodyEl = document.body;
    const navBtn = $('#toggle-nav');
    const sidebar = $('#sidebar');

    function setNav(open) {
        bodyEl.dataset.nav = open ? 'open' : '';
        if (navBtn) navBtn.setAttribute('aria-expanded', String(open));
        if (sidebar) sidebar.setAttribute('aria-hidden', String(!open));
    }

    navBtn?.addEventListener('click', () => setNav(!(bodyEl.dataset.nav === 'open')));

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && bodyEl.dataset.nav === 'open') setNav(false);
    });

    // Close when clicking outside the drawer on mobile
    document.addEventListener('click', (e) => {
        if (bodyEl.dataset.nav !== 'open') return;
        const clickInsideDrawer = sidebar?.contains(e.target) || navBtn?.contains(e.target);
        if (!clickInsideDrawer) setNav(false);
    });

    /* ---- 3) Palette cycler (cream = base tokens, so remove attribute) ---- */
    const palettes = ['cream', 'ink', 'sage', 'noir'];
    const root = document.documentElement;
    const saved = localStorage.getItem('palette');

    if (saved && palettes.includes(saved) && saved !== 'cream') {
        root.dataset.theme = saved;
    } else {
        root.removeAttribute('data-theme');
    }

    $('#theme-toggle')?.addEventListener('click', () => {
        const current = root.dataset.theme || 'cream';
        const i = palettes.indexOf(current);
        const next = palettes[(i + 1) % palettes.length];

        if (next === 'cream') {
            root.removeAttribute('data-theme');
            localStorage.removeItem('palette');
        } else {
            root.dataset.theme = next;
            localStorage.setItem('palette', next);
        }
    });

    /* ---- 4) Mark current nav link (tolerates trailing slashes) ---- */
    const here = location.pathname.replace(/\/+$/, '') || '/';
    $$('#primary-nav a[href]').forEach((a) => {
        let href = a.getAttribute('href') || '';
        href = href.replace(/\/+$/, '') || '/';
        if (here === href || (href !== '/' && here.startsWith(href))) {
            a.setAttribute('data-current', 'true');
        }
    });
})();
