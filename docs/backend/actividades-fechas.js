/**
 * BACKEND (no es código del espejo; no sale en los diff/). Issue #307.
 *
 * Fechas de ACTIVIDAD en hora de Guatemala.
 *
 * ACTIVIDAD_FECHA y ACTIVIDAD_FECHA_PROGRAMACION son `datetime` (sin zona) y se guardan en hora de
 * Guatemala (#297). Problemas encontrados en `app/controllers/actividades/actividades.js`:
 *
 *  1. `insertar_actividad` / `actualizar_actividad` guardan `campos.fecha_programada` tal cual llega,
 *     sin validarlo. Si llega un ISO con zona (ej. "2026-11-27T16:00:00.000Z", lo que mandaba el
 *     front al agregar un resultado), SQL Server ignora la "Z" y guarda 16:00 en lugar de 10:00.
 *     Si llega texto que no es fecha, el error sale del SQL ("Conversion failed...").
 *     → El front ya manda siempre "YYYY-MM-DDTHH:mm:ss" sin zona (diff del #307). Aquí se valida el
 *       formato y se rechaza lo que no sea fecha (`fechaProgramadaValida`). La zona, si viene, se
 *       descarta igual que ya lo hace SQL Server: NO se convierte, porque la API devuelve las fechas
 *       con "Z" (driver mssql) y el detalle las reenvía tal cual al finalizar la actividad
 *       (`actualizar-actividad`); convertirlas restaría 6 h en cada guardado.
 *
 *  2. "Hoy" se calcula con `new Date()` del servidor (UTC) y se compara contra fechas guardadas en
 *     hora de Guatemala. Entre las 18:00 y las 24:00 de Guatemala el servidor ya va en el día
 *     siguiente, así que:
 *       - `cerrar_actividades_vencidas` cierra también las actividades programadas para mañana;
 *       - `getdatos_actividades_vencidas` / `getdatos_actividades_en_curso` corren el corte 6 h.
 *     → Se toma "ahora" en hora de Guatemala (`ahoraGuatemala`) y se pasa como texto ISO sin zona,
 *       para que el driver no lo convierta. Se conserva la regla de cada función (mismo corte).
 *
 *  `generar_seguimientos` (`new Date(cotizacion.CABCOT_FECHA)`) no cambia: lee y escribe un
 *  `datetime` con el mismo driver, así que la hora queda igual que en la cotización.
 *
 * Cómo instalarlo (todo en `app/controllers/actividades/actividades.js`):
 *  1. Copiar el bloque "INICIO HELPERS" … "FIN HELPERS" debajo de los `require` del inicio.
 *  2. En `insertar_actividad` y en `actualizar_actividad`, como primera línea dentro del `if` de
 *     parámetros requeridos, agregar:
 *
 *        const fechaProgramada = fechaProgramadaValida(campos.fecha_programada);
 *        if (!fechaProgramada) {
 *            return {'success' : false, "cod_mensaje" : 1043, 'mensaje' : 'La fecha programada no es válida, verifique'};
 *        }
 *
 *     y en el `.insert({...})` / `.update({...})` cambiar
 *        "ACTIVIDAD_FECHA_PROGRAMACION"  : campos.fecha_programada,
 *     por
 *        "ACTIVIDAD_FECHA_PROGRAMACION"  : fechaProgramada,
 *
 *     (`insertar_resultado` llama a `insertar_actividad`, así que queda cubierto.)
 *     `generar_seguimientos` manda un `Date`: `fechaProgramadaValida` lo acepta y lo devuelve igual.
 *
 *  3. En `getdatos_actividades_vencidas` y en `getdatos_actividades_en_curso`, cambiar
 *        const endOfDay = new Date();
 *        endOfDay.setDate(endOfDay.getDate() - 1);
 *     por
 *        const endOfDay = ahoraGuatemala().subtract(1, "day").format(FORMATO_SQL);
 *
 *  4. En `cerrar_actividades_vencidas`, cambiar
 *        const endOfDay = new Date();
 *        endOfDay.setHours(23, 59, 59, 999);
 *     por
 *        const endOfDay = ahoraGuatemala().endOf("day").format(FORMATO_SQL);
 *
 *     Ojo (regla actual, no se cambió): el corte es el FIN de hoy, así que también cierra las
 *     actividades de hoy que aún no pasan. Si debe cerrar solo las de días anteriores, usar
 *     `ahoraGuatemala().startOf("day").format(FORMATO_SQL)`.
 *
 *  5. Datos ya guardados: los resultados creados desde el detalle quedaron con 6 h de más. Si se
 *     quieren corregir, hay que identificarlos en la base (no se puede distinguir solo por la hora).
 */

// ─── INICIO HELPERS ──────────────────────────────────────────────────────────────────────────
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const ZONA_GUATEMALA = "America/Guatemala";
// ISO sin zona: SQL Server lo lee igual con cualquier idioma/DATEFORMAT.
const FORMATO_SQL = "YYYY-MM-DDTHH:mm:ss";
const FECHA_HORA = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2})(?::(\d{2}))?(?:\.\d{1,7})?)?(?:Z|[+-]\d{2}:?\d{2})?$/i;

/** "Ahora" en hora de Guatemala, sin depender de la zona del servidor. */
const ahoraGuatemala = () => dayjs().tz(ZONA_GUATEMALA);

/**
 * Valida `fecha_programada` y la devuelve lista para ACTIVIDAD_FECHA_PROGRAMACION.
 *  - Texto "YYYY-MM-DD", "YYYY-MM-DDTHH:mm" o "YYYY-MM-DDTHH:mm:ss" (con o sin milisegundos y
 *    zona) → "YYYY-MM-DDTHH:mm:ss" con la misma hora escrita (la zona se descarta, como SQL Server).
 *  - `Date` válido → el mismo `Date` (lo convierte el driver, como hasta ahora).
 *  - Cualquier otra cosa, o una fecha imposible (31/02) → null.
 */
const fechaProgramadaValida = (valor) => {
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor;
  if (typeof valor !== "string") return null;
  const partes = FECHA_HORA.exec(valor.trim());
  if (!partes) return null;
  const texto = `${partes[1]}T${partes[2] || "00:00"}:${partes[3] || "00"}`;
  const fecha = dayjs(texto);
  return fecha.isValid() && fecha.format(FORMATO_SQL) === texto ? texto : null;
};
// ─── FIN HELPERS ─────────────────────────────────────────────────────────────────────────────

module.exports = { ahoraGuatemala, fechaProgramadaValida, FORMATO_SQL };
