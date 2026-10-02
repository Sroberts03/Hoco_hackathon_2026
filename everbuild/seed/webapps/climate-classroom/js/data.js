// Synthetic, smoothed approximation of the global temperature anomaly curve (°C).
window.ANOMALY = (function () {
  var out = [];
  for (var y = 1880; y <= 2023; y++) {
    var t = (y - 1880) / 143;
    var base = -0.25 + 0.15 * Math.sin(t * 6) * (1 - t) + Math.pow(Math.max(0, t - 0.55), 1.6) * 2.4;
    out.push({ year: y, value: Math.round((base + Math.sin(y * 12.9898) * 0.08) * 100) / 100 });
  }
  return out;
})();
