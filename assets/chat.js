/* ============================================================================
   chat.js — Asistente del observatorio "¿Quién sufre violencia en el Perú?"
   Responde con los datos reales de la página (motor local) y, para preguntas
   libres, usa el gateway ai.tunky.net (POST /v1/chat) con fallback local.
   ============================================================================ */
(function () {
  "use strict";
  var D = window.DATA || {};

  // ---- CONFIG del gateway -------------------------------------------------
  // El gateway valida el Origin (unimauro.github.io ya permitido) y el header
  // X-Client-Token. Pega aquí un token DEDICADO del proyecto (ej. "viol_...")
  // para activar la IA en preguntas libres. Mientras esté vacío, el asistente
  // responde con el motor local (datos oficiales de la propia página).
  var GW = {
    url: "https://ai.tunky.net/v1/chat",
    token: "",   // ← pega aquí el token dedicado de ai.tunky.net para este observatorio
    system: "Eres el asistente del observatorio ciudadano '¿Quién sufre violencia en el Perú?'. " +
      "Respondes en español, breve, claro y con empatía, SOLO sobre violencia de género y familiar en el Perú " +
      "usando datos oficiales del INEI (ENDES, ENARES) y del MIMP (Programa Warmi Ñan/Aurora, CEM, feminicidios, Línea 100). " +
      "Mensajes clave: las mujeres son la mayoría de las víctimas pero no las únicas (también hombres, niñez, adolescencia); " +
      "la violencia incluye la psicológica, física, sexual, económica y digital; negarse a la intimidad o al afecto NO es violencia. " +
      "Si alguien está en peligro, indícale la Línea 100 (gratis, 24h) y la PNP 105. No inventes cifras; si no sabes, dilo."
  };
  // ------------------------------------------------------------------------

  var $ = function (id) { return document.getElementById(id); };
  var hist = [];
  var open = false, busy = false, greeted = false;
  var esc = function (s) { return String(s).replace(/[<>&]/g, function (c) { return { "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]; }); };
  var norm = function (s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  var fmt = function (n) { return String(n).replace(".", ","); };
  var mkEl = function (cls, html) { var d = document.createElement("div"); d.className = cls; if (html != null) d.innerHTML = html; return d; };

  function add(role, html, raw) {
    var log = $("chatLog");
    log.appendChild(mkEl("msg " + role, raw ? html : esc(html)));
    log.scrollTop = log.scrollHeight;
  }
  function typing() {
    var log = $("chatLog");
    var m = mkEl("msg bot", '<span class="typing"><i></i><i></i><i></i></span>');
    log.appendChild(m); log.scrollTop = log.scrollHeight; return m;
  }
  function suggest(items) {
    var wrap = mkEl("chat-suggest");
    items.forEach(function (q) {
      var b = document.createElement("button");
      b.textContent = q;
      b.onclick = function () { wrap.remove(); handle(q); };
      wrap.appendChild(b);
    });
    $("chatLog").appendChild(wrap);
    $("chatLog").scrollTop = $("chatLog").scrollHeight;
  }
  function greet() {
    if (greeted) return; greeted = true;
    add("bot", "¡Hola! 👋 Soy el asistente de datos de este observatorio. Pregúntame por cifras de violencia en el Perú, un departamento, dónde pedir ayuda o qué es (y qué no es) violencia.");
    suggest(["¿Cuántos feminicidios hubo?", "¿Solo las mujeres sufren violencia?", "Datos de mi departamento", "¿Dónde pido ayuda?", "¿Qué es el violentómetro?"]);
  }

  // ------- utilidades de datos -------
  function depFind(t) {
    var keys = Object.keys(D.departamentos || {});
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i]; var nk = norm(k);
      if (t.indexOf(nk) >= 0) return k;
    }
    if (/\blima\b/.test(t)) return "LIMA";
    return null;
  }
  function nombre(k) { return k.charAt(0) + k.slice(1).toLowerCase(); }

  // ------- motor local -------
  function localAnswer(q) {
    var t = norm(q);
    var n = D.nacional || {}, reg = D.registro || {};

    // emergencia
    if (/(me pega|me golpea|peligro|auxilio|ayuda urgente|me quiere matar|amenaza de muerte|estoy en riesgo)/.test(t)) {
      return ["<b>Si estás en peligro ahora, pide ayuda ya:</b>",
        "• <b>Línea 100</b> — gratuita, 24 h, en todo el país.",
        "• <b>PNP 105</b> — emergencia policial.",
        "• Acude al <b>Centro Emergencia Mujer (CEM)</b> más cercano (atienden a mujeres y hombres).",
        "No estás solo/a. La denuncia no tiene costo y puede hacerla la víctima o un tercero."].join("\n");
    }

    // feminicidios
    if (/(feminicid|asesin|matan|mataron|cuantas mujeres mueren)/.test(t) && reg.feminicidios) {
      var i24 = reg.anios.indexOf(2024);
      var f = reg.feminicidios[i24], te = reg.tentativas[i24];
      var cada = Math.round(365 / f * 10) / 10;
      var acum = reg.feminicidios.reduce(function (a, b) { return a + b; }, 0);
      return "En <b>2024</b> se registraron <b>" + f + " feminicidios</b> (en promedio, uno cada " + fmt(cada) +
        " días) y <b>" + te + " tentativas</b>. Entre 2018 y 2025 suman <b>" + acum.toLocaleString("es-PE") +
        "</b>. Fuente: Programa Warmi Ñan / MIMP (registro administrativo).";
    }

    // la brecha / solo mujeres / hombres
    if (/(solo (las )?mujeres|los hombres|varones|hombre.*victim|tambien.*hombre|brecha)/.test(t)) {
      var c = D.cem_2024 || {};
      var tot = c.mujeres + c.hombres, ph = Math.round(c.hombres / tot * 1000) / 10, pm = Math.round(c.mujeres / tot * 1000) / 10;
      return "No. La violencia la sufren mujeres, hombres, niñez y personas adultas mayores. Pero la asimetría es enorme: en los Centros Emergencia Mujer (" +
        c.periodo + ") se atendió a <b>" + c.mujeres.toLocaleString("es-PE") + " mujeres (" + fmt(pm) + "%)</b> y <b>" +
        c.hombres.toLocaleString("es-PE") + " hombres (" + fmt(ph) + "%)</b>. Un hombre también puede denunciar (Ley 30364 protege a todo el grupo familiar).";
    }

    // afecto / intimidad
    if (/(afecto|intimidad|no quiere tener|no me da carino|no quiere dormir|me rechaza)/.test(t)) {
      return "Que tu pareja no quiera tener intimidad o no te dé afecto <b>no es violencia</b>: el afecto y la intimidad requieren consentimiento y nadie está obligado a darlos. El derecho a decir “no” es lo que protege de la violencia sexual. En cambio, humillar, controlar, insultar o amenazar <b>sí</b> es violencia y se puede denunciar.";
    }

    // digital / tiktok
    if (/(tiktok|redes|digital|graba|viral|internet|whatsapp|difund|imagenes intimas)/.test(t)) {
      return "Sí: grabar a alguien para humillarlo y difundirlo en TikTok, WhatsApp u otras redes <b>es violencia</b> (psicológica y digital), reconocida por la ley. Afecta cada vez más a adolescentes y también a hombres.";
    }

    // violentómetro
    if (/(violentometro|senal|senales|como saber|como se|escala|niveles)/.test(t)) {
      return "El <b>Violentómetro</b> (MIMP) ordena las señales de menor a mayor gravedad:\n• <b>Amarillo (ten cuidado):</b> bromas hirientes, celos, control, humillar, burlarse en redes.\n• <b>Naranja (reacciona):</b> empujar, cachetear, patear, encerrar, amenazar.\n• <b>Rojo (busca ayuda ya):</b> violar, mutilar, asesinar.\nSi te reconoces en naranja o rojo, llama a la <b>Línea 100</b>.";
    }

    // ayuda / denuncia
    if (/(ayuda|denunci|donde (voy|acudo|puedo)|linea 100|cem|comisaria|a quien recurr)/.test(t)) {
      return ["<b>Dónde pedir ayuda</b> (gratis, para mujeres y hombres):",
        "• <b>Línea 100</b> — orientación 24 h en todo el país.",
        "• <b>Chat 100</b> — chat100.aurora.gob.pe",
        "• <b>Centros Emergencia Mujer (CEM)</b> — atención legal, psicológica y social.",
        "• <b>Comisaría / PNP 105</b> — denuncia directa, sin costo."].join("\n");
    }

    // niñez
    if (/(ninez|ninos|ninas|infant|hijos|castigo)/.test(t) && D.ninez) {
      return "La violencia empieza temprano: según la ENDES, en la corrección de niñas y niños de 1 a 5 años, la madre usa palmadas en " +
        fmt(D.ninez.madre[3]) + "% de los casos y golpes/castigo físico en " + fmt(D.ninez.madre[4]) + "%; el padre, " +
        fmt(D.ninez.padre[3]) + "% y " + fmt(D.ninez.padre[4]) + "%.";
    }

    // encuesta vs registro
    if (/(endes|encuesta|registro|enares|diferencia|prevalencia|como se mide)/.test(t)) {
      return "Hay dos formas de medir: la <b>ENDES</b> (INEI) es una <b>encuesta</b> que estima la prevalencia (qué % de mujeres ha vivido violencia; incluye lo no denunciado) — por eso llega a 53,8%. El <b>registro Warmi Ñan/MIMP</b> cuenta los <b>casos reales atendidos</b> cada año (unos 169 mil en CEM). No son comparables, pero se complementan.";
    }

    // departamento
    var dep = depFind(t);
    if (dep) {
      var parts = [];
      var ev = D.departamentos[dep];
      if (ev != null) parts.push("prevalencia ENDES 2024: <b>" + fmt(ev) + "%</b> de mujeres víctimas de violencia de pareja alguna vez");
      var dr = (D.dep_registro || {})[dep];
      if (dr) parts.push("casos atendidos en CEM (2025): <b>" + dr.cem.toLocaleString("es-PE") + "</b>; feminicidios 2025: <b>" + dr.fem + "</b>");
      if (!parts.length) return "No tengo el dato cargado para " + nombre(dep) + ".";
      return "<b>" + nombre(dep) + "</b> — " + parts.join(". ") + ".";
    }

    // cifras generales / prevalencia
    if (/(cuant|porcentaje|cifra|prevalencia|violencia de pareja|victimas|psicolog|fisica|sexual|economica)/.test(t)) {
      return "Según la ENDES (INEI), <b>" + fmt(n.total_2023) + "%</b> de las mujeres de 15 a 49 años fueron víctimas de violencia de su pareja alguna vez: psicológica <b>" +
        fmt(n.psico_2023) + "%</b>, física <b>" + fmt(n.fisica_2023) + "%</b> y sexual <b>" + fmt(n.sexual_2023) + "%</b>. Además, " +
        fmt(n.dep_economica_2024) + "% de las mujeres de 18+ depende económicamente de su pareja (ENARES 2024).";
    }

    // fuentes
    if (/(fuente|dato real|de donde|confiable|inventa)/.test(t)) {
      return "Todas las cifras vienen de fuentes oficiales: <b>INEI</b> (ENDES, ENARES) y <b>MIMP</b> (Programa Warmi Ñan: CEM, feminicidios, Línea 100). Regla dura: no se inventan cifras. Revisa la sección “Fuentes” del sitio.";
    }

    // saludo
    if (/^(hola|buenas|hey|que tal|buenos dias|buenas tardes)/.test(t)) {
      return "¡Hola! Pregúntame por feminicidios, cifras de violencia, un departamento, el violentómetro o dónde pedir ayuda.";
    }

    return null; // sin coincidencia → intentar gateway
  }

  function pick(data) {
    if (!data) return "";
    if (typeof data === "string") return data;
    return data.reply || data.message || data.content || data.answer ||
      (data.choices && data.choices[0] && (data.choices[0].message ? data.choices[0].message.content : data.choices[0].text)) || "";
  }

  function gateway(text) {
    return fetch(GW.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Client-Token": GW.token },
      body: JSON.stringify({ messages: [{ role: "system", content: GW.system }].concat(hist.slice(-10)) })
    }).then(function (res) {
      return res.text().then(function (raw) {
        var data; try { data = JSON.parse(raw); } catch (e) { data = raw; }
        if (!res.ok) throw new Error("HTTP " + res.status);
        return pick(data);
      });
    });
  }

  function fallback() {
    return "No tengo ese dato con certeza, así que prefiero no inventarlo. Puedo ayudarte con: feminicidios, cifras de violencia de pareja, datos por departamento, el violentómetro o dónde pedir ayuda. ¿Estás en peligro? <b>Línea 100</b> o <b>PNP 105</b>.";
  }

  function handle(text) {
    text = (text || "").trim(); if (!text || busy) return;
    add("me", text);
    hist.push({ role: "user", content: text });
    busy = true; $("chatSend").disabled = true;
    var tp = typing();

    var local = localAnswer(text);
    var done = function (html) {
      tp.remove(); add("bot", html, true);
      hist.push({ role: "assistant", content: html.replace(/<[^>]+>/g, "") });
      busy = false; $("chatSend").disabled = false; $("chatInput").focus();
    };

    if (local) { setTimeout(function () { done(local); }, 220); return; }

    if (!GW.token) { setTimeout(function () { done(fallback()); }, 220); return; }

    gateway(text).then(function (reply) {
      done(reply && reply.trim() ? esc(reply) : fallback());
    }).catch(function () { done(fallback()); });
  }

  // ------- UI wiring -------
  function toggle(v) {
    open = (v == null) ? !open : v;
    var panel = $("chatPanel");
    panel.classList.toggle("open", open);
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    $("chatbtn").style.display = open ? "none" : "";
    if (open) { greet(); setTimeout(function () { $("chatInput").focus(); }, 180); }
  }

  function boot() {
    $("chatbtn").addEventListener("click", function () { toggle(true); });
    $("chatClose").addEventListener("click", function () { toggle(false); });
    $("chatForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var v = $("chatInput").value; $("chatInput").value = "";
      handle(v);
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && open) toggle(false); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
