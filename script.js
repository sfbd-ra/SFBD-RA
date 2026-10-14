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
