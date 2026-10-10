// Shared image treatment for every page.
// 1. Sizes each image-slot to its image's real proportions, so nothing is cropped.
// 2. Landscape images on a flat ground (diagrams, charts, documents) get that ground removed and
//    trimmed, then sit on a solid backing in the page colour, so they read as part of the page.
//    Portrait UI screens are never altered; they show as rounded screens with a soft shadow.
// Stable by design: every decision is taken from the ORIGINAL image (never the processed one),
// scans are debounced, and images are processed one at a time off the critical path.
(function () {
  if (window.__fitImages) return;
  window.__fitImages = true;
  var CACHE = {};   // src -> { url, ratio } once done; 'pending' while queued
  var QUEUE = [];
  var BUSY = false;
  var MAX = 1600;
  var SHADOW = 'drop-shadow(0 1px 1.5px rgba(32,31,29,0.14)) drop-shadow(0 10px 22px rgba(32,31,29,0.08))';

  function enqueue(src) {
    if (CACHE[src]) return;
    CACHE[src] = 'pending';
    QUEUE.push(src);
    pump();
  }
  function pump() {
    if (BUSY || !QUEUE.length) return;
    BUSY = true;
    var src = QUEUE.shift();
    analyze(src, function (res) {
      CACHE[src] = res;
      BUSY = false;
      schedule();
      setTimeout(pump, 30);
    });
  }

  function analyze(src, done) {
    var im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = function () {
      var res = { url: null, ratio: im.naturalWidth / im.naturalHeight, nw: im.naturalWidth };
      // portrait UI screens are never altered
      if (res.ratio < 0.95) return done(res);
      try {
        var s = Math.min(1, MAX / Math.max(im.naturalWidth, im.naturalHeight));
        var w = Math.max(1, Math.round(im.naturalWidth * s)), h = Math.max(1, Math.round(im.naturalHeight * s));
        var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        var cx = cv.getContext('2d'); cx.drawImage(im, 0, 0, w, h);
        var id = cx.getImageData(0, 0, w, h), d = id.data;
        var B = {}, best = null, ring = 0, x, y;
        var vote = function (x, y) {
          var i = (y * w + x) * 4; if (d[i + 3] < 200) return; ring++;
          var k = (d[i] >> 3) + ',' + (d[i + 1] >> 3) + ',' + (d[i + 2] >> 3);
          var e = B[k] || (B[k] = { n: 0, r: 0, g: 0, b: 0 });
          e.n++; e.r += d[i]; e.g += d[i + 1]; e.b += d[i + 2];
          if (!best || e.n > best.n) best = e;
        };
        for (x = 0; x < w; x++) { vote(x, 0); vote(x, h - 1); }
        for (y = 1; y < h - 1; y++) { vote(0, y); vote(w - 1, y); }
        if (best && best.n / ring >= 0.55) {
          var R = best.r / best.n, G = best.g / best.n, Bc = best.b / best.n;
          // dark grounds belong to the artwork: only light paper-like grounds are removed
          if (0.299 * R + 0.587 * G + 0.114 * Bc < 200) { done(res); return; }
          var T1 = 24, T2 = 44, seen = new Uint8Array(w * h), q = new Int32Array(w * h), qh = 0, qt = 0;
          var push = function (p) {
            if (seen[p]) return; seen[p] = 1;
            var i = p * 4, dd = Math.max(Math.abs(d[i] - R), Math.abs(d[i + 1] - G), Math.abs(d[i + 2] - Bc));
            if (dd <= T1) { d[i + 3] = 0; q[qt++] = p; }
            else if (dd <= T2) d[i + 3] = Math.round(255 * (dd - T1) / (T2 - T1));
          };
          for (x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
          for (y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
          while (qh < qt) {
            var p = q[qh++], px = p % w;
            if (px > 0) push(p - 1); if (px < w - 1) push(p + 1);
            if (p >= w) push(p - w); if (p < w * (h - 1)) push(p + w);
          }
          if (qt / (w * h) > 0.06) {
            cx.putImageData(id, 0, 0);
            var x0 = w, y0 = h, x1 = -1, y1 = -1;
            for (y = 0; y < h; y++) { var row = y * w * 4; for (x = 0; x < w; x++) if (d[row + x * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; y1 = y; } }
            var out = cv;
            if (x1 >= x0 && y1 >= y0) {
              var m = Math.max(10, Math.round(0.025 * Math.max(x1 - x0, y1 - y0)));
              x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(w - 1, x1 + m); y1 = Math.min(h - 1, y1 + m);
              out = document.createElement('canvas'); out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
              out.getContext('2d').drawImage(cv, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
            }
            // only a real outer margin qualifies: the trim must shrink the image noticeably
            if (out === cv || (out.width * out.height) / (w * h) > 0.9) { done(res); return; }
            var fr = out.width / out.height;
            out.toBlob(function (blob) {
              if (blob) { res.url = URL.createObjectURL(blob); res.ratio = fr; }
              done(res);
            }, 'image/png');
            return;
          }
        }
      } catch (e) { /* tainted canvas: leave the image as it is */ }
      done(res);
    };
    im.onerror = function () { done({ url: null, ratio: 0 }); };
    im.src = src;
  }

  function set(st, k, v) { if (st[k] !== v) st[k] = v; }
  function bare(plate) {
    if (!plate) return;
    var st = plate.style;
    set(st, 'padding', '0px'); set(st, 'background', 'transparent'); set(st, 'borderColor', 'transparent');
    set(st, 'borderWidth', '0px'); set(st, 'boxShadow', 'none'); set(st, 'outline', 'none');
  }

  function check(slot) {
    var orig = slot.getAttribute('src');
    var root = slot.shadowRoot, img = root && root.querySelector('img');
    if (!orig || !img) return;
    if (!img.__fitBound) { img.__fitBound = true; img.addEventListener('load', schedule); }
    var c = CACHE[orig];
    if (!c) { enqueue(orig); return; }
    if (c === 'pending' || !c.ratio) return;

    var screen = c.ratio < 0.95;        // decided from the original, never flips
    var knocked = !!c.url;
    var shape = knocked ? 'rect' : 'rounded', rad = screen ? '12' : '6';
    if (slot.getAttribute('fit') !== 'contain') slot.setAttribute('fit', 'contain');
    if (slot.getAttribute('shape') !== shape) slot.setAttribute('shape', shape);
    if (slot.getAttribute('radius') !== rad) slot.setAttribute('radius', rad);
    set(slot.style, 'filter', knocked ? 'none' : SHADOW);
    bare(slot.closest('.plate') || slot.parentElement);

    if (!slot.__back) slot.__back = getComputedStyle(document.body).backgroundColor || '#e6ebf2';
    var back = knocked ? slot.__back : 'transparent';
    set(slot.style, 'background', back);
    var frame = slot.shadowRoot.querySelector('div');
    if (frame) set(frame.style, 'background', back);

    if (knocked) {
      var cur = slot.shadowRoot.querySelector('img');
      if (cur && cur.src !== c.url) cur.src = c.url;
    }

    if (slot.hasAttribute('data-fill')) return;
    // never upscale small sources past 1.25x: cap the figure that holds a ratio-driven plate
    var fig = slot.closest('figure');
    if (fig && !slot.closest('[data-track]') && c.nw && c.nw < 600) {
      var cap = Math.round(c.nw * 1.25) + 'px';
      if (fig.style.maxWidth !== cap) fig.style.maxWidth = cap;
    }
    if (slot.style.height && slot.style.height !== 'auto') return;   // fixed carousel plates
    var want = c.ratio.toFixed(4);
    if (slot.style.aspectRatio.replace(/\s/g, '') !== want && slot.style.aspectRatio !== want) slot.style.aspectRatio = want;
  }

  var timer = 0;
  function schedule() { if (!timer) timer = setTimeout(function () { timer = 0; document.querySelectorAll('image-slot').forEach(check); }, 120); }
  function start() {
    schedule();
    new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        var m = list[i];
        if (m.type === 'childList' || m.attributeName === 'src') { schedule(); return; }
      }
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
    setInterval(schedule, 1500);
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
