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

// ---- Part 3 -----------------------------------------------------------
// Top bar: "Menu" button on small screens, highlight the section in view,
// and the thin reading-progress line under the bar.
var nav = document.querySelector('.site-nav');
var toggle = document.querySelector('.nav-toggle');
toggle.addEventListener('click', function () {
  var open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});
nav.querySelectorAll('a').forEach(function (a) {
  a.addEventListener('click', function () {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', false);
  });
});

var navLinks = Array.prototype.slice.call(nav.querySelectorAll('a'));
var progress = document.querySelector('.read-progress span');
function onScroll() {
  var doc = document.documentElement;
  var max = doc.scrollHeight - doc.clientHeight;
  progress.style.width = (max > 0 ? (doc.scrollTop / max) * 100 : 0) + '%';
  var current = null;
  navLinks.forEach(function (a) {
    var sec = document.querySelector(a.getAttribute('href'));
    if (sec && sec.getBoundingClientRect().top <= 100) current = a;
  });
  navLinks.forEach(function (a) { a.classList.toggle('active', a === current); });
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();
