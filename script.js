/* =====================================================================
   script.js: how the page behaves.
   index.html loads this file at the end of <body> with:
     <script src="script.js"></script>
   Loading it last means all the HTML elements already exist when it runs.
   Part 1: swaps missing figures and video for an "Add Assets/..." box.
   Part 2: the denoising illustration (draws SVG paths, slider, replay).
   ===================================================================== */

// ---- Part 1 -----------------------------------------------------------
// Replace missing figures with a clear note naming the file to add.
document.querySelectorAll('img[data-placeholder]').forEach(function (img) {
  function swap() {
    var box = document.createElement('div');
    box.className = 'missing';
    box.innerHTML = '<span>Add <code>' + img.getAttribute('src') + '</code></span>';
    img.replaceWith(box);
  }
  if (img.complete && img.naturalWidth === 0) swap();
  else img.addEventListener('error', swap);
});
document.querySelectorAll('video[data-placeholder-video]').forEach(function (v) {
  var src = v.querySelector('source');
  function swap() {
    if (!v.isConnected) return;
    var box = document.createElement('div');
    box.className = 'missing';
    box.innerHTML = '<span>Add <code>' + src.getAttribute('src') + '</code></span>';
    v.replaceWith(box);
  }
  if (v.networkState === 3) swap();
  else src.addEventListener('error', swap);
});

// ---- Part 2 -----------------------------------------------------------
// Schematic: noisy trajectories converging over iterations.
// Settings to play with:
//   K   number of iterations shown on the slider
//   N   number of trajectories
//   amp (inside draw) how noisy the trajectories start
(function () {
  var svg = document.getElementById('denoise-svg');
  var slider = document.getElementById('iter');
  var out = document.getElementById('iter-out');
  var replay = document.getElementById('replay');
  var NS = 'http://www.w3.org/2000/svg';
  var K = 4, W = 900, H = 340, PTS = 90, N = 16;

  var seed = 7;
  function rand() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  function gauss() { return Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand()); }

  // Two pushing strategies, as in the aligning task: inside and outside.
  var trajs = [];
  for (var i = 0; i < N; i++) {
    var strategy = i % 2 === 0 ? 1 : -1;
    var lane = (rand() - 0.5) * 18;
    var noise = [], smooth = 0;
    for (var j = 0; j < PTS; j++) {
      smooth = 0.55 * smooth + 0.45 * gauss();
      noise.push(gauss() * 0.7 + smooth * 1.1);
    }
    trajs.push({ strategy: strategy, lane: lane, noise: noise });
  }

  function basePoint(t, tr) {
    var x = 60 + t * (W - 120);
    var bend = Math.sin(Math.PI * t) * 70 * tr.strategy;
    var y = H / 2 + bend + tr.lane * Math.sin(Math.PI * t);
    return [x, y];
  }

  var paths = trajs.map(function () {
    var p = document.createElementNS(NS, 'path');
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke-width', '1.6');
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-opacity', '0.75');
    svg.appendChild(p);
    return p;
  });
  [[60, H / 2], [W - 60, H / 2]].forEach(function (c, idx) {
    var dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('cx', c[0]); dot.setAttribute('cy', c[1]);
    dot.setAttribute('r', idx ? 9 : 6);
    dot.setAttribute('fill', idx ? 'none' : 'currentColor');
    dot.setAttribute('stroke', 'currentColor');
    dot.setAttribute('stroke-width', '2');
    svg.appendChild(dot);
  });
  svg.style.color = 'var(--ink)';

  function mix(a, b, t) { return a + (b - a) * t; }
  function hexToRgb(h) { h = h.trim().replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }

  function draw(k) {
    var cs = getComputedStyle(document.documentElement);
    var a = hexToRgb(cs.getPropertyValue('--noisy')), b = hexToRgb(cs.getPropertyValue('--ours'));
    var f = k / K;
    var amp = 18 * Math.pow(1 - f, 1.6);
    var col = 'rgb(' + a.map(function (v, i) { return Math.round(mix(v, b[i], f)); }).join(',') + ')';
    trajs.forEach(function (tr, i) {
      var d = '';
      for (var j = 0; j < PTS; j++) {
        var t = j / (PTS - 1);
        var p = basePoint(t, tr);
        var env = Math.sin(Math.PI * t);
        var y = p[1] + tr.noise[j] * amp * env;
        d += (j ? 'L' : 'M') + p[0].toFixed(1) + ' ' + y.toFixed(1);
      }
      paths[i].setAttribute('d', d);
      paths[i].setAttribute('stroke', col);
    });
    var step = Math.round(k);
    out.textContent = step === 0 ? 'k = 0, noisy data' : (step === K ? 'k = ' + K + ', denoised' : 'k = ' + step);
  }

  var anim = null;
  function play() {
    cancelAnimationFrame(anim);
    var start = null, dur = 3600;
    function frame(ts) {
      if (!start) start = ts;
      var t = Math.min(1, (ts - start) / dur);
      var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      slider.value = e * K;
      draw(e * K);
      if (t < 1) anim = requestAnimationFrame(frame);
    }
    anim = requestAnimationFrame(frame);
  }

  slider.addEventListener('input', function () { cancelAnimationFrame(anim); draw(+slider.value); });
  replay.addEventListener('click', play);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { draw(+slider.value); });

  draw(0);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    slider.value = K; draw(K);
  } else {
    setTimeout(play, 700);
  }
})();
