// Shared page metadata + accessibility scaffolding for every page of the site.
(function () {
  if (window.__siteMeta) return;
  window.__siteMeta = true;
  var PAGES = {
    'Portfolio v3': ['Itai Steinberg — UX Research & Design', 'UX designer and user experience researcher. Selected work with a focus on research and psychology.'],
    'Portfolio Redesign': ['Itai Steinberg — UX Research & Design', 'UX designer and user experience researcher. Selected work with a focus on research and psychology.'],
    'Minute Media': ['Minute Media — Itai Steinberg', 'Redefining Voltax, Minute Media\u2019s internal communication and collaboration system.'],
    'Healthsme': ['Health\u2019sme — Itai Steinberg', 'An mHealth system connecting patients with doctors, appointments and follow-ups.'],
    'Wolt Case Study': ['Wolt Case Study — Itai Steinberg', 'Improving the payment and substitution experience in the Wolt app.'],
    'Bankme': ['Bankme — Itai Steinberg', 'A minimalist digital banking case study that reduces cognitive load.'],
    'The Art Of Motorcycle And UX': ['The Art Of Motorcycle And UX — Itai Steinberg', 'A post on motorcycles and user experience.'],
    'Six Thinking Hats': ['Applying the Six Thinking Hats Method to UX Design — Itai Steinberg', 'Applying the Six Thinking Hats method within a UX design process.']
  };
  var key = decodeURIComponent(location.pathname.split('/').pop() || '').replace(/\.dc\.html$/, '');
  var meta = PAGES[key] || PAGES['Portfolio v3'];
  var head = document.head;
  function tag(name, attrs) { var e = document.createElement(name); for (var k in attrs) e.setAttribute(k, attrs[k]); head.appendChild(e); return e; }
  document.documentElement.setAttribute('lang', 'en');
  document.title = meta[0];
  tag('meta', { name: 'description', content: meta[1] });
  tag('meta', { property: 'og:title', content: meta[0] });
  tag('meta', { property: 'og:description', content: meta[1] });
  tag('meta', { property: 'og:type', content: 'website' });
  tag('meta', { name: 'theme-color', content: '#e6ebf2' });
  tag('link', { rel: 'icon', href: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="10" fill="#201f1d"/><text x="32" y="43" font-family="Georgia,serif" font-size="30" fill="#b68235" text-anchor="middle">IS</text></svg>') });

  function a11y() {
    var main = document.querySelector('main');
    if (main && !main.id) main.id = 'content';
    if (main && !document.getElementById('skip-link')) {
      var s = document.createElement('a');
      s.id = 'skip-link'; s.href = '#' + main.id; s.textContent = 'Skip to content';
      s.style.cssText = 'position:fixed;left:16px;top:-48px;z-index:100;padding:10px 16px;background:#fbfaf9;border:1px solid #b68235;border-radius:4px;font-size:14px;color:#5a3b0a;transition:top .2s ease';
      s.addEventListener('focus', function () { s.style.top = '12px'; });
      s.addEventListener('blur', function () { s.style.top = '-48px'; });
      document.body.insertBefore(s, document.body.firstChild);
    }
    // every inline svg on the site is decorative: icon-only controls carry aria-labels
    document.querySelectorAll('svg:not([aria-hidden])').forEach(function (v) { v.setAttribute('aria-hidden', 'true'); v.setAttribute('focusable', 'false'); });
  }
  function start() { a11y(); new MutationObserver(a11y).observe(document.body, { childList: true, subtree: true }); }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
