/* ============================================================================
   violencia-peru · app
   ============================================================================ */
(function () {
  "use strict";
  var D = window.DATA;

  /* ---------- tema ---------- */
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem("vp-theme"); } catch (e) {}
  if (saved) root.setAttribute("data-theme", saved);
  document.getElementById("themeBtn").addEventListener("click", function () {
    var cur = root.getAttribute("data-theme");
    var dark = cur ? cur === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    var next = dark ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("vp-theme", next); } catch (e) {}
    setTimeout(renderAll, 30);
  });

  function css(v) { return getComputedStyle(root).getPropertyValue(v).trim(); }
  function pal() {
    return {
      ink: css("--ink"), muted: css("--muted"), line: css("--line"),
      rose: css("--rose"), teal: css("--teal"), amber: css("--amber"),
      card: css("--card")
    };
  }
  function fmt(n) { return String(n).replace(".", ","); }

  /* ---------- rellenar textos ---------- */
  document.getElementById("asof").textContent = D.actualizado;
  var cem = D.cem_2024;
  var tot = cem.mujeres + cem.hombres;
  var pm = Math.round(cem.mujeres / tot * 1000) / 10;
  var ph = Math.round(cem.hombres / tot * 1000) / 10;

  document.getElementById("cemper").textContent = cem.periodo;
  var gb = document.getElementById("gapbar");
  gb.innerHTML =
    '<span class="m" style="width:' + pm + '%">Mujeres ' + fmt(pm) + '%</span>' +
    '<span class="h" style="width:' + ph + '%">Hombres ' + fmt(ph) + '%</span>';
  document.getElementById("gaplblm").textContent = cem.mujeres.toLocaleString("es-PE") + " mujeres";
  document.getElementById("gaplblh").textContent = cem.hombres.toLocaleString("es-PE") + " hombres";

  document.getElementById("st-muj").textContent = cem.mujeres.toLocaleString("es-PE");
  document.getElementById("st-per").textContent = "(" + cem.periodo + ")";
  document.getElementById("st-hom").textContent = cem.hombres.toLocaleString("es-PE");
  document.getElementById("st-cai").textContent = cem.cai_varones.toLocaleString("es-PE");

  var n = D.nacional;
  document.getElementById("c-total").textContent = fmt(n.total_2023) + "%";
  document.getElementById("c-psico").textContent = fmt(n.psico_2023) + "%";
  document.getElementById("c-fisica").textContent = fmt(n.fisica_2023) + "%";
  document.getElementById("c-sexual").textContent = fmt(n.sexual_2023) + "%";
  document.getElementById("c-dep").textContent = fmt(n.dep_economica_2024) + "%";

  /* tipos */
  var tipHTML = D.tipos.map(function (t) {
    return '<div class="tipo"><h4>' + t.t + '</h4><p>' + t.d + '</p></div>';
  }).join("");
  document.getElementById("tipos").innerHTML = tipHTML;

  /* canales */
  document.getElementById("canales").innerHTML = D.canales.map(function (c) {
    return '<div class="canal"><div class="n">' + c.n + '</div><div class="c">' + c.c +
      '</div><div class="d">' + c.d + '</div></div>';
  }).join("");

  /* ranking departamental */
  var rows = Object.keys(D.departamentos).map(function (k) {
    return { k: k, v: D.departamentos[k] };
  });
  var withData = rows.filter(function (r) { return r.v != null; }).sort(function (a, b) { return b.v - a.v; });
  var noData = rows.filter(function (r) { return r.v == null; });
  var maxV = withData[0].v;
  function nombre(k){ return k.charAt(0) + k.slice(1).toLowerCase(); }
  var tbl = withData.map(function (r, i) {
    var w = Math.round(r.v / maxV * 70);
    return '<tr><td>' + (i + 1) + '. ' + nombre(r.k) +
      '</td><td><span class="bar" style="width:' + w + 'px"></span>' + fmt(r.v) + '%</td></tr>';
  }).join("");
  tbl += noData.map(function (r) {
    return '<tr><td class="nd">' + nombre(r.k) + '</td><td class="nd">sin dato</td></tr>';
  }).join("");
  document.getElementById("rankTbl").innerHTML = tbl;

  /* ---------- ECharts ---------- */
  var charts = [];
  function mk(id) {
    var el = document.getElementById(id);
    var c = echarts.getInstanceByDom(el) || echarts.init(el, null, { renderer: "canvas" });
    charts.push(c);
    return c;
  }
  var baseText = function (p) { return { color: p.ink, fontFamily: "Inter, sans-serif" }; };

  if (window.PERU_GEOJSON) {
    echarts.registerMap("peru", window.PERU_GEOJSON);
  }

  function renderAll() {
    var p = pal();
    var axisCommon = {
      axisLine: { lineStyle: { color: p.line } },
      axisTick: { show: false },
      axisLabel: { color: p.muted },
      splitLine: { lineStyle: { color: p.line, type: "dashed" } }
    };

    /* tipos (barras) */
    mk("chTipos").setOption({
      textStyle: baseText(p),
      grid: { left: 8, right: 24, top: 10, bottom: 6, containLabel: true },
      tooltip: { trigger: "axis", valueFormatter: function (v) { return fmt(v) + "%"; } },
      xAxis: Object.assign({ type: "value", max: 55 }, axisCommon),
      yAxis: Object.assign({ type: "category", data: ["Sexual", "Física", "Psicológica"], inverse: false }, axisCommon),
      series: [{
        type: "bar", barWidth: "52%",
        data: [n.sexual_2023, n.fisica_2023, n.psico_2023],
        itemStyle: { color: p.rose, borderRadius: [0, 6, 6, 0] },
        label: { show: true, position: "right", color: p.ink, formatter: function (o) { return fmt(o.value) + "%"; } }
      }]
    }, true);

    /* tendencia (líneas) */
    var t = D.tendencia;
    mk("chTrend").setOption({
      textStyle: baseText(p),
      grid: { left: 8, right: 20, top: 36, bottom: 8, containLabel: true },
      legend: { top: 0, textStyle: { color: p.ink }, data: ["Total", "Psicológica", "Física", "Sexual"] },
      tooltip: { trigger: "axis", valueFormatter: function (v) { return v == null ? "s/d" : fmt(v) + "%"; } },
      xAxis: Object.assign({ type: "category", boundaryGap: false, data: t.anios }, axisCommon),
      yAxis: Object.assign({ type: "value", max: 80, axisLabel: { color: p.muted, formatter: "{value}%" } }, axisCommon),
      series: [
        line("Total", t.total, p.rose, 3),
        line("Psicológica", t.psico, p.teal, 2),
        line("Física", t.fisica, p.amber, 2),
        line("Sexual", t.sexual, p.muted, 2)
      ]
    }, true);
    function line(name, data, color, w) {
      return {
        name: name, type: "line", data: data, smooth: true, symbol: "circle", symbolSize: 6,
        lineStyle: { width: w, color: color }, itemStyle: { color: color },
        emphasis: { focus: "series" }
      };
    }

    /* mapa */
    var mapData = Object.keys(D.departamentos).map(function (k) {
      return { name: k, value: D.departamentos[k] };
    });
    mk("chMapa").setOption({
      textStyle: baseText(p),
      tooltip: {
        trigger: "item",
        formatter: function (o) {
          var v = (o.value == null || isNaN(o.value)) ? "sin dato" : fmt(o.value) + "%";
          return "<b>" + nombre(o.name) + "</b><br>" + v;
        }
      },
      visualMap: {
        min: 35, max: 67, left: 6, bottom: 6, calculable: true,
        text: ["67%", "36%"],
        inRange: { color: ["#f6dfe8", "#e18fb2", "#c8306c", "#7e1340"] },
        textStyle: { color: p.muted }
      },
      series: [{
        type: "map", map: "peru", roam: false, nameProperty: "NOMBDEP",
        data: mapData,
        label: { show: false },
        itemStyle: { borderColor: p.card, borderWidth: .6, areaColor: p.line },
        emphasis: { label: { show: false }, itemStyle: { areaColor: p.amber } }
      }]
    }, true);

    /* instituciones */
    var inst = D.ayuda.instituciones;
    mk("chInst").setOption({
      textStyle: baseText(p),
      grid: { left: 8, right: 28, top: 8, bottom: 6, containLabel: true },
      tooltip: { trigger: "axis", valueFormatter: function (v) { return fmt(v) + "%"; } },
      xAxis: Object.assign({ type: "value", max: 90 }, axisCommon),
      yAxis: Object.assign({ type: "category", inverse: true, data: inst.map(function (x) { return x.k; }) }, axisCommon),
      series: [{
        type: "bar", barWidth: "58%",
        data: inst.map(function (x) { return x.v; }),
        itemStyle: { color: p.teal, borderRadius: [0, 6, 6, 0] },
        label: { show: true, position: "right", color: p.ink, formatter: function (o) { return fmt(o.value) + "%"; } }
      }]
    }, true);

    /* razones */
    var raz = D.ayuda.razones_no_ayuda;
    mk("chRaz").setOption({
      textStyle: baseText(p),
      grid: { left: 8, right: 28, top: 8, bottom: 6, containLabel: true },
      tooltip: { trigger: "axis", valueFormatter: function (v) { return fmt(v) + "%"; } },
      xAxis: Object.assign({ type: "value", max: 50 }, axisCommon),
      yAxis: Object.assign({ type: "category", inverse: true, data: raz.map(function (x) { return x.k; }) }, axisCommon),
      series: [{
        type: "bar", barWidth: "58%",
        data: raz.map(function (x) { return x.v; }),
        itemStyle: { color: p.amber, borderRadius: [0, 6, 6, 0] },
        label: { show: true, position: "right", color: p.ink, formatter: function (o) { return fmt(o.value) + "%"; } }
      }]
    }, true);

    /* niñez */
    var nz = D.ninez;
    mk("chNinez").setOption({
      textStyle: baseText(p),
      grid: { left: 8, right: 20, top: 36, bottom: 6, containLabel: true },
      legend: { top: 0, textStyle: { color: p.ink } },
      tooltip: { trigger: "axis", valueFormatter: function (v) { return fmt(v) + "%"; } },
      xAxis: Object.assign({ type: "category", data: nz.labels, axisLabel: { color: p.muted, interval: 0, width: 90, overflow: "break" } }, axisCommon),
      yAxis: Object.assign({ type: "value", max: 70, axisLabel: { color: p.muted, formatter: "{value}%" } }, axisCommon),
      series: [
        { name: "Madre", type: "bar", data: nz.madre, itemStyle: { color: p.rose, borderRadius: [5, 5, 0, 0] } },
        { name: "Padre", type: "bar", data: nz.padre, itemStyle: { color: p.teal, borderRadius: [5, 5, 0, 0] } }
      ]
    }, true);
  }

  renderAll();
  window.addEventListener("resize", function () {
    charts.forEach(function (c) { try { c.resize(); } catch (e) {} });
  });

  /* ---------- chatbot (placeholder — gateway ai.tunky.net, token pendiente) ---------- */
  document.getElementById("chatbtn").addEventListener("click", function () {
    alert("El asistente de datos estará disponible pronto.\n\nMientras tanto:\n• ¿Estás en peligro? Línea 100 (gratis, 24h) o PNP 105.\n• Todas las cifras y sus fuentes están en la sección “Fuentes”.");
  });
})();
