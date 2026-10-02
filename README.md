# ¿Quién sufre violencia en el Perú?

Observatorio de datos estático sobre la violencia en el Perú. Parte de una pregunta
sencilla —**¿solo las mujeres sufren violencia?**— y la responde con cifras oficiales:
las mujeres son la **mayoría** de las víctimas, pero **no las únicas**.

🔗 **En vivo:** https://unimauro.github.io/violencia-peru

## Qué muestra

- **La brecha** mujeres / hombres en las atenciones de los Centros Emergencia Mujer (CEM).
- **Cifras nacionales** de violencia de pareja (ENDES): psicológica, física, sexual.
- **Tendencia 2009–2024**: la caída sostenida (de 76,9% a ~53%).
- **Mapa por departamento** (ENDES 2024), 21 de 25 regiones con dato primario.
- **Qué es y qué no es violencia**: los tipos que reconoce la Ley 30364, la violencia
  digital (humillar/grabar y difundir en redes) y la distinción con la falta de afecto.
- **Buscar ayuda**: a dónde acuden las víctimas, por qué muchas callan y los canales
  públicos (Línea 100, CEM, PNP 105).
- **La niñez**: castigo físico a niñas y niños de 1 a 5 años.

## Regla dura

**No se inventan cifras.** Cada número proviene de una fuente oficial citada y se etiqueta
según su calidad de evidencia (A: encuesta oficial · B: registro administrativo ·
C: prensa que cita fuente oficial · D: estimación). Los 4 departamentos cuyo informe
ENDES 2024 está en imagen escaneada quedan **sin dato** en vez de rellenarse con supuestos.

## Fuentes

- INEI — ENDES (Encuesta Demográfica y de Salud Familiar), informes nacionales y departamentales 2024.
- INEI — ENARES 2024 (incluye la publicación "Violencia psicológica en mujeres de 18 y más años").
- INEI — Nota de prensa N.°078-2024.
- MIMP / Programa Aurora — atenciones en CEM y CAI.
- Ley N.° 30364.

## Stack

HTML + CSS + JS estático. [ECharts](https://echarts.apache.org/) para gráficos y mapa
coroplético (GeoJSON departamental del Perú). Sin build, sin dependencias de servidor.
Se despliega directamente en GitHub Pages.

## Desarrollo local

```bash
python3 -m http.server 8099
# abrir http://localhost:8099
```

## Estructura

```
index.html              # página
assets/styles.css       # estilos
assets/app.js           # lógica + gráficos
data/data.js            # TODAS las cifras, con su fuente
data/peru-geojson.js    # geometría departamental
```
