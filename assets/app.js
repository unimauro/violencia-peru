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
    setTimeout(renderAll, 40);
  });

  function css(v) { return getComputedStyle(root).getPropertyValue(v).trim(); }
  function pal() {
    return {
      ink: css("--ink"), muted: css("--muted"), line: css("--line"),
      rose: css("--rose"), teal: css("--teal"), amber: css("--amber"),
      card: css("--card"), paper: css("--paper")
    };
  }
  function fmt(n) { return String(n).replace(".", ","); }
  function nombre(k) { return k.charAt(0) + k.slice(1).toLowerCase(); }
  function hex2rgba(h, a) {
    h = h.replace("#", "");
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var r = parseInt(h.substr(0,2),16), g = parseInt(h.substr(2,2),16), b = parseInt(h.substr(4,2),16);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }

  /* ---------- rellenar textos ---------- */
  document.getElementById("asof").textContent = D.actualizado;
  var cem = D.cem_2024;
  var tot = cem.mujeres + cem.hombres;
  var pm = Math.round(cem.mujeres / tot * 1000) / 10;
  var ph = Math.round(cem.hombres / tot * 1000) / 10;

  document.getElementById("cemper").textContent = cem.periodo;
  document.getElementById("gapbar").innerHTML =
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

  document.getElementById("tipos").innerHTML = D.tipos.map(function (t) {
    return '<div class="tipo"><h4>' + t.t + '</h4><p>' + t.d + '</p></div>';
  }).join("");

  document.getElementById("canales").innerHTML = D.canales.map(function (c) {
    return '<div class="canal"><div class="n">' + c.n + '</div><div class="c">' + c.c +
      '</div><div class="d">' + c.d + '</div></div>';
  }).join("");

  /* ranking departamental */
  var rows = Object.keys(D.departamentos).map(function (k) { return { k: k, v: D.departamentos[k] }; });
  var withData = rows.filter(function (r) { return r.v != null; }).sort(function (a, b) { return b.v - a.v; });
  var noData = rows.filter(function (r) { return r.v == null; });
  var maxV = withData[0].v;
  var tbl = withData.map(function (r, i) {
    var w = Math.round(r.v / maxV * 66);
    return '<tr><td>' + (i + 1) + '. ' + nombre(r.k) +
      '</td><td><span class="bar" style="width:' + w + 'px"></span>' + fmt(r.v) + '%</td></tr>';
  }).join("");
  tbl += noData.map(function (r) {
    return '<tr><td class="nd">' + nombre(r.k) + '</td><td class="nd">sin dato</td></tr>';
  }).join("");
  document.getElementById("rankTbl").innerHTML = tbl;

  /* ---------- guardia: si ECharts no cargó ---------- */
  if (typeof echarts === "undefined") {
    Array.prototype.forEach.call(document.querySelectorAll(".chart"), function (el) {
      el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;' +
        'color:var(--muted);font-size:13.5px;text-align:center;padding:20px">No se pudieron cargar los ' +
        'gráficos (sin conexión al CDN). Los datos siguen disponibles en la sección “Fuentes”.</div>';
    });
    return;
  }

  /* ---------- ECharts ---------- */
  var charts = [];
  function mk(id) {
    var el = document.getElementById(id);
    var c = echarts.getInstanceByDom(el) || echarts.init(el, null, { renderer: "canvas" });
    charts.push(c);
    return c;
  }
  if (window.PERU_GEOJSON) echarts.registerMap("peru", window.PERU_GEOJSON);

  function renderAll() {
    var p = pal();
    var FONT = "Inter, sans-serif";
    var base = { color: p.ink, fontFamily: FONT };
    var anim = { animationDuration: 900, animationEasing: "cubicOut" };

    function tooltip(extra) {
      return Object.assign({
        backgroundColor: p.card,
        borderColor: p.line,
        borderWidth: 1,
        padding: [9, 12],
        textStyle: { color: p.ink, fontFamily: FONT, fontSize: 12.5 },
        extraCssText: "border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12)",
        valueFormatter: function (v) { return v == null ? "s/d" : fmt(v) + "%"; }
      }, extra || {});
    }
    function axX(o) {
      return Object.assign({
        type: "value",
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: p.muted, fontFamily: FONT },
        splitLine: { lineStyle: { color: p.line, type: "dashed" } }
      }, o || {});
    }
    function axYcat(data, o) {
      return Object.assign({
        type: "category", data: data,
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: p.ink, fontFamily: FONT, fontSize: 12.5 },
        splitLine: { show: false }
      }, o || {});
    }
    function hbar(data, color, max, cat) {
      return {
        grid: { left: 6, right: 44, top: 10, bottom: 6, containLabel: true },
        tooltip: tooltip({ trigger: "axis", axisPointer: { type: "shadow" } }),
        xAxis: axX({ max: max }),
        yAxis: axYcat(cat, { inverse: true }),
        series: [{
          type: "bar", barWidth: "56%",
          data: data.map(function (v, i) {
            // degradado según valor
            return {
              value: v,
              itemStyle: {
                borderRadius: [0, 7, 7, 0],
                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                  { offset: 0, color: hex2rgba(color, .55) },
                  { offset: 1, color: color }
                ])
              }
            };
          }),
          label: { show: true, position: "right", color: p.ink, fontFamily: FONT, fontWeight: 600,
                   formatter: function (o) { return fmt(o.value) + "%"; } }
        }]
      };
    }

    /* ---- tipos (barras horizontales) ---- */
    mk("chTipos").setOption(Object.assign({ textStyle: base },
      hbar([n.sexual_2023, n.fisica_2023, n.psico_2023], p.rose, 55, ["Sexual", "Física", "Psicológica"]),
      anim), true);

    /* ---- tendencia (líneas con área) ---- */
    var t = D.tendencia;
    function line(name, data, color, w, area) {
      var s = {
        name: name, type: "line", data: data, smooth: true,
        symbol: "circle", symbolSize: 7, showSymbol: false,
        emphasis: { focus: "series", scale: 1.2 },
        lineStyle: { width: w, color: color, shadowBlur: area ? 8 : 0, shadowColor: hex2rgba(color, .35), shadowOffsetY: 3 },
        itemStyle: { color: color, borderColor: p.card, borderWidth: 1.5 }
      };
      if (area) {
        s.areaStyle = {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: hex2rgba(color, .28) },
            { offset: 1, color: hex2rgba(color, 0) }
          ])
        };
        s.showSymbol = true;
      }
      return s;
    }
    mk("chTrend").setOption(Object.assign({
      textStyle: base,
      color: [p.rose, p.teal, p.amber, p.muted],
      grid: { left: 6, right: 22, top: 40, bottom: 6, containLabel: true },
      legend: { top: 2, icon: "roundRect", itemWidth: 16, itemHeight: 8,
                textStyle: { color: p.ink, fontFamily: FONT },
                data: ["Total", "Psicológica", "Física", "Sexual"] },
      tooltip: tooltip({ trigger: "axis", axisPointer: { type: "line", lineStyle: { color: p.line } } }),
      xAxis: Object.assign(axX({ type: "category", boundaryGap: false, data: t.anios }),
        { axisLine: { lineStyle: { color: p.line } }, splitLine: { show: false },
          axisLabel: { color: p.muted, fontFamily: FONT } }),
      yAxis: axX({ max: 80, axisLabel: { color: p.muted, fontFamily: FONT, formatter: "{value}%" } }),
      series: [
        line("Total", t.total, p.rose, 3.4, true),
        line("Psicológica", t.psico, p.teal, 2.4, false),
        line("Física", t.fisica, p.amber, 2.4, false),
        line("Sexual", t.sexual, p.muted, 2, false)
      ]
    }, anim), true);

    /* ---- mapa ---- */
    var mapData = Object.keys(D.departamentos).map(function (k) {
      return { name: k, value: D.departamentos[k] };
    });
    mk("chMapa").setOption(Object.assign({
      textStyle: base,
      tooltip: tooltip({
        trigger: "item",
        formatter: function (o) {
          var v = (o.value == null || isNaN(o.value)) ? "sin dato cargado" : "<b style='color:" + p.rose + "'>" + fmt(o.value) + "%</b>";
          return "<b>" + nombre(o.name) + "</b><br>mujeres víctimas: " + v;
        }
      }),
      visualMap: {
        min: 35, max: 67, left: 8, bottom: 10, itemWidth: 12, itemHeight: 110,
        calculable: true, text: ["67%", "36%"],
        inRange: { color: ["#fbe6ee", "#eaa3c0", "#d35b8c", "#c8306c", "#7e1340"] },
        textStyle: { color: p.muted, fontFamily: FONT, fontSize: 11 }
      },
      series: [{
        type: "map", map: "peru", roam: false, nameProperty: "NOMBDEP",
        aspectScale: 0.9, zoom: 1.15,
        data: mapData,
        label: { show: false },
        itemStyle: {
          borderColor: p.card, borderWidth: 0.8, areaColor: p.line,
          shadowBlur: 10, shadowColor: hex2rgba("#1b1a22", .14), shadowOffsetY: 3
        },
        emphasis: {
          label: { show: true, color: p.ink, fontFamily: FONT, fontWeight: 600, fontSize: 11,
                   formatter: function (o) { return nombre(o.name); } },
          itemStyle: { areaColor: p.amber, borderColor: p.card, borderWidth: 1.4 }
        },
        select: { disabled: true }
      }]
    }, anim), true);

    /* ---- instituciones ---- */
    var inst = D.ayuda.instituciones;
    mk("chInst").setOption(Object.assign({ textStyle: base },
      hbar(inst.map(function (x) { return x.v; }), p.teal, 92, inst.map(function (x) { return x.k; })),
      anim), true);

    /* ---- razones ---- */
    var raz = D.ayuda.razones_no_ayuda;
    mk("chRaz").setOption(Object.assign({ textStyle: base },
      hbar(raz.map(function (x) { return x.v; }), p.amber, 52, raz.map(function (x) { return x.k; })),
      anim), true);

    /* ---- niñez (barras agrupadas) ---- */
    var nz = D.ninez;
    function vbar(color) {
      return function (v) {
        return { value: v, itemStyle: { borderRadius: [6, 6, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: color }, { offset: 1, color: hex2rgba(color, .55) }
          ]) } };
      };
    }
    mk("chNinez").setOption(Object.assign({
      textStyle: base,
      grid: { left: 6, right: 16, top: 42, bottom: 6, containLabel: true },
      legend: { top: 2, icon: "roundRect", itemWidth: 16, itemHeight: 8, textStyle: { color: p.ink, fontFamily: FONT } },
      tooltip: tooltip({ trigger: "axis", axisPointer: { type: "shadow" } }),
      xAxis: Object.assign(axX({ type: "category", data: nz.labels }),
        { axisLabel: { color: p.muted, fontFamily: FONT, interval: 0, width: 92, overflow: "break", lineHeight: 14 },
          splitLine: { show: false } }),
      yAxis: axX({ max: 70, axisLabel: { color: p.muted, fontFamily: FONT, formatter: "{value}%" } }),
      series: [
        { name: "Madre", type: "bar", data: nz.madre.map(vbar(p.rose)), barGap: "18%", barWidth: "30%" },
        { name: "Padre", type: "bar", data: nz.padre.map(vbar(p.teal)), barWidth: "30%" }
      ]
    }, anim), true);
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
