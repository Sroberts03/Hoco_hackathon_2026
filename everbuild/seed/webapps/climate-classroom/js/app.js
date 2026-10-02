(function () {
  var canvas = document.getElementById("chart"), ctx = canvas.getContext("2d");
  var from = document.getElementById("from"), smooth = document.getElementById("smooth");
  function averaged(data) {
    return data.map(function (d, i) {
      var s = data.slice(Math.max(0, i - 9), i + 1);
      return { year: d.year, value: s.reduce(function (a, b) { return a + b.value; }, 0) / s.length };
    });
  }
  function draw() {
    var start = Number(from.value);
    var data = window.ANOMALY.filter(function (d) { return d.year >= start; });
    if (smooth.checked) data = averaged(data);
    var w = canvas.width, h = canvas.height, pad = 36, min = -0.6, max = 1.4;
    var x = function (i) { return pad + (i / (data.length - 1)) * (w - pad * 2); };
    var y = function (v) { return h - pad - ((v - min) / (max - min)) * (h - pad * 2); };
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "#d9d6cf"; ctx.beginPath(); ctx.moveTo(pad, y(0)); ctx.lineTo(w - pad, y(0)); ctx.stroke();
    ctx.fillStyle = "#7b8794"; ctx.font = "12px system-ui";
    ctx.fillText("0 °C", 4, y(0) + 4); ctx.fillText(String(data[0].year), pad, h - 12);
    ctx.fillText(String(data[data.length - 1].year), w - pad - 28, h - 12);
    data.forEach(function (d, i) {
      ctx.fillStyle = d.value > 0 ? "#c0504d" : "#4f81bd"; ctx.globalAlpha = 0.35;
      ctx.fillRect(x(i) - 1, Math.min(y(d.value), y(0)), 2, Math.abs(y(d.value) - y(0)));
    });
    ctx.globalAlpha = 1; ctx.strokeStyle = "#2f6f4f"; ctx.lineWidth = 2; ctx.beginPath();
    data.forEach(function (d, i) { i ? ctx.lineTo(x(i), y(d.value)) : ctx.moveTo(x(i), y(d.value)); });
    ctx.stroke(); ctx.lineWidth = 1;
    document.getElementById("range-label").textContent = start + "–2023";
    document.getElementById("prompt").textContent = "Since " + start + ", the anomaly changed by " +
      (data[data.length - 1].value - data[0].value).toFixed(2) + " °C. Which decades show the steepest increase, and why?";
  }
  from.addEventListener("input", draw); smooth.addEventListener("change", draw); draw();
})();
