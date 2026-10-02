/* ============================================================================
   violencia-peru · datos
   Regla dura: TODA cifra proviene de fuente oficial citada. Nada se inventa.
   Escalera de evidencia:  A = encuesta oficial representativa (ENDES/ENARES)
                           B = registro administrativo (CEM/Aurora, PNP)
                           C = dato de prensa que cita fuente oficial
                           D = estimación / referencia conceptual
   ============================================================================ */
window.DATA = {

  actualizado: "Octubre 2026",

  /* --- Titulares nacionales ------------------------------------------------ */
  nacional: {
    // ENDES — mujeres 15-49 alguna vez unidas, violencia por esposo/compañero
    total_2023: 53.8,   // Nota de prensa INEI N°078-2024 (ENDES 2023)
    psico_2023: 49.3,
    fisica_2023: 27.2,
    sexual_2023: 6.5,
    total_2024: 52.5,   // ENDES 2024 (I semestre) — difusión INEI/MINSA 2024
    psico_2024: 48.9,
    fisica_2024: 26.7,
    sexual_2024: 5.2,
    dep_economica_2024: 28.6, // ENARES 2024: mujeres 18+ que dependen económicamente de su pareja/expareja
    feminicidios_2024: "≈ 3 por semana" // INEI, feminicidios 2024 (difusión 2025)
  },

  /* --- La brecha: ¿solo mujeres? ------------------------------------------- */
  // Registro de atenciones de los Centros Emergencia Mujer (CEM) - Programa Aurora, MIMP.
  // OJO: es REGISTRO de atención, no prevalencia poblacional. Evidencia B.
  cem_2024: {
    periodo: "ene–may 2024",
    mujeres: 57550,
    hombres: 10053,
    total_anual_texto: "+154 000 víctimas atendidas (ene–nov 2024)",
    cai_varones: 2316 // Centros de Atención Institucional para varones (ene–sep 2024)
  },

  /* --- Tendencia nacional 2009–2024 (ENDES, mujeres 15-49) ----------------- */
  // Serie 2009–2020: Cap. "Violencia contra las mujeres, niñas y niños", ENDES.
  // Anclas recientes: 2023 (Nota 078-2024) y 2024 I sem.
  tendencia: {
    anios:   [2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2023, 2024],
    total:   [76.9, 75.8, 74.2, 74.1, 71.5, 72.4, 70.8, 68.2, 65.4, 63.2, 57.7, 54.8, 53.8, 52.5],
    psico:   [73.0, 72.1, 70.0, 70.6, 67.5, 69.4, 67.4, 64.2, 61.5, 58.9, 52.8, 50.1, 49.3, 48.9],
    fisica:  [38.2, 37.7, 38.0, 36.4, 35.7, 32.3, 32.0, 31.7, 30.6, 30.7, 29.5, 27.1, 27.2, 26.7],
    sexual:  [ 8.8,  8.6,  9.3,  8.7,  8.4,  7.9,  7.9,  6.6,  6.5,  6.8,  7.1,  6.0,  6.5,  5.2],
    nota: "Serie 2009–2020 del informe ENDES; 2021–2022 no mostrados. 2023 y 2024 (I sem) son anclas de difusión INEI."
  },

  /* --- Mapa por departamento (ENDES 2024) ---------------------------------- */
  // % de mujeres alguna vez unidas víctimas de violencia familiar ALGUNA VEZ
  // por el esposo o compañero. Extraído del texto de cada informe departamental
  // ENDES 2024 (proyectos.inei.gob.pe/endes/2024/departamentales/).
  // 4 departamentos (Callao, Tacna, Tumbes, Ucayali) tienen informe escaneado
  // en imagen → sin dato cargado (null), no se inventa.
  departamentos: {
    "AMAZONAS": 49.5, "ANCASH": 53.1, "APURIMAC": 66.4, "AREQUIPA": 53.2,
    "AYACUCHO": 49.0, "CAJAMARCA": 35.9, "CALLAO": null, "CUSCO": 59.3,
    "HUANCAVELICA": 56.5, "HUANUCO": 48.5, "ICA": 50.9, "JUNIN": 59.2,
    "LA LIBERTAD": 51.6, "LAMBAYEQUE": 49.6, "LIMA": 56.1, "LORETO": 47.8,
    "MADRE DE DIOS": 57.5, "MOQUEGUA": 54.0, "PASCO": 50.6, "PIURA": 48.6,
    "PUNO": 59.9, "SAN MARTIN": 53.5, "TACNA": null, "TUMBES": null, "UCAYALI": null
  },

  /* --- Búsqueda de ayuda (ENDES) ------------------------------------------- */
  ayuda: {
    personas_cercanas: 42.9,
    institucion: 26.2,
    instituciones: [
      { k: "Comisaría", v: 83.9 },
      { k: "Fiscalía", v: 7.8 },
      { k: "DEMUNA", v: 6.7 },
      { k: "MIMP", v: 6.0 },
      { k: "Juzgado", v: 5.6 },
      { k: "Estab. de salud", v: 4.9 },
      { k: "Defensoría del Pueblo", v: 1.1 }
    ],
    razones_no_ayuda: [
      { k: "No era necesario", v: 46.4 },
      { k: "Tuvo miedo (algún tipo)", v: 17.7 },
      { k: "Vergüenza", v: 16.0 },
      { k: "No sabe dónde ir / no conoce servicios", v: 11.7 },
      { k: "De nada sirve", v: 2.3 },
      { k: "Ella tenía la culpa", v: 1.8 }
    ]
  },

  /* --- Niñez: cómo corrigen en el hogar (ENDES, niñas/os 1-5) -------------- */
  ninez: {
    labels: ["Reprimenda verbal", "Habla y explica", "Prohíbe algo que le gusta", "Palmadas", "Golpes / castigo físico"],
    madre: [64.0, 38.4, 36.9, 23.0, 9.0],
    padre: [63.5, 39.0, 33.0, 13.5, 8.2]
  },

  /* --- Tipos de violencia (Ley 30364) -------------------------------------- */
  tipos: [
    { t: "Psicológica", d: "Actos para controlar, aislar, humillar o avergonzar: insultos, amenazas, celos extremos, prohibir ver a la familia o amistades.", icon: "mente" },
    { t: "Física", d: "Daño a la integridad corporal: golpes, empujones, cachetadas, uso de objetos o armas.", icon: "fisica" },
    { t: "Sexual", d: "Actos de naturaleza sexual sin consentimiento, incluida la coacción a tener relaciones dentro de la pareja.", icon: "sexual" },
    { t: "Económica / patrimonial", d: "Controlar o quitar ingresos, impedir trabajar, destruir bienes o negar lo necesario para vivir.", icon: "dinero" },
    { t: "Digital / en redes", d: "Grabar y difundir videos para humillar, burlarse en TikTok o grupos de WhatsApp, acosar en línea, difundir imágenes íntimas sin permiso o suplantar a alguien. Es una forma de violencia psicológica reconocida y afecta cada vez más a adolescentes y hombres.", icon: "digital" }
  ],

  /* --- Canales de ayuda (servicios públicos MIMP / PNP) -------------------- */
  canales: [
    { n: "Línea 100", d: "Orientación gratuita 24 h, todo el país. Para mujeres y cualquier integrante del grupo familiar.", c: "100" },
    { n: "Chat 100", d: "Orientación en línea del MIMP.", c: "chat100.aurora.gob.pe" },
    { n: "Centros Emergencia Mujer (CEM)", d: "Atención legal, psicológica y social presencial. +400 en el país. Atienden a mujeres y hombres.", c: "aurora.gob.pe" },
    { n: "Comisarías / PNP", d: "Denuncia directa. La denuncia no tiene costo y puede hacerla la víctima o un tercero.", c: "105" }
  ]
};
