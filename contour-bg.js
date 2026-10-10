// Site background for every sub-page: the same blue ground and gold dot wave as the homepage.
(function () {
  if (window.__contourBg) return;
  window.__contourBg = true;
  var AMP = 1.6, GOLD = '#b68235', GROUND = '#e6ebf2';
  function start() {
    var c = document.createElement('canvas');
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;display:block';
    document.body.insertBefore(c, document.body.firstChild);
    // the canvas carries the site ground itself, so no host/default colour can show through
    document.documentElement.style.background = GROUND;
    document.body.style.background = 'transparent';
    var ctx = c.getContext('2d');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function size() {
      var d = Math.min(2, window.devicePixelRatio || 1);
      c.width = window.innerWidth * d; c.height = window.innerHeight * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    function draw(t) {
      var w = window.innerWidth, h = window.innerHeight;
      var sy = window.scrollY * 0.12, GAP = 26;
      ctx.globalAlpha = 1; ctx.fillStyle = GROUND; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = GOLD;
      for (var y = 0; y < h + GAP; y += GAP) for (var x = 0; x < w + GAP; x += GAP) {
        var yy = y + sy;
        var wv = Math.sin(x * 0.0065 + yy * 0.0035 - t * 0.55) + 0.6 * Math.sin(x * 0.0028 - yy * 0.006 + t * 0.35);
        var k = Math.max(0, Math.min(1, (wv + 1.6) / 3.2));
        ctx.globalAlpha = (0.05 + k * 0.26) * AMP;
        ctx.beginPath(); ctx.arc(x, y + Math.sin(x * 0.009 - t * 0.7) * 3 * k, 0.55 + k * 1.15, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    size();
    window.addEventListener('resize', function () { size(); if (reduce) draw(0); });
    if (reduce) { draw(0); return; }
    var t0 = performance.now();
    (function loop() {
      if (!document.hidden) draw((performance.now() - t0) / 1000);
      setTimeout(loop, 40);
    })();
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
