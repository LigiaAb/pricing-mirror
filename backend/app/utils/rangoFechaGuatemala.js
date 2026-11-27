const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const ZONA_HORARIA = "America/Guatemala";

// * funcion para obtener el rango de fecha en UTC -0600
// * para valores guardados en bdd en formato UTC
// * para usar en filtro de busquedas
// ? ingresa -> rangoDiaGuatemala("14/10/2026")
// ? retorna -> { inicio: 2026-10-14T06:00:00.000Z, fin: 2026-10-15T06:00:00.000Z }
const rangoDiaGuatemala = (valor) => {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  const latino = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor);

  const anio = iso ? iso[1] : latino ? latino[3] : null;
  const mes = iso ? iso[2] : latino ? latino[2] : null;
  const dia = iso ? iso[3] : latino ? latino[1] : null;

  if (anio === null) return null;

  const inicio = dayjs.tz(`${anio}-${mes}-${dia}T00:00:00`, ZONA_HORARIA);

  if (
    !inicio.isValid() ||
    inicio.format("YYYY-MM-DD") !== `${anio}-${mes}-${dia}`
  ) {
    return null;
  }

  return { inicio: inicio.toDate(), fin: inicio.add(1, "day").toDate() };
};

// * funcion para obtener el rango en UTC de varios dias para valores
// * guardados en bdd en formato UTC, para usar en filtros de busqueda
// * por rango de fechas, los extremos son opcionales de forma independiente
// ? ingresa -> rangoFechasGuatemala("14/10/2026", "20/10/2026")
// ? retorna -> { inicio: 2026-10-14T06:00:00.000Z, fin: 2026-10-21T06:00:00.000Z }
// ? solo inicio -> rangoFechasGuatemala("14/10/2026", undefined)
// ?             -> { inicio: 2026-10-14T06:00:00.000Z, fin: undefined }
// ? solo fin    -> rangoFechasGuatemala(undefined, "20/10/2026")
// ?             -> { inicio: undefined, fin: 2026-10-21T06:00:00.000Z }
// ? si no se envia ningun extremo, alguna fecha es invalida,
// ? o inicio es mayor que fin, retorna null
const rangoFechasGuatemala = (fechaInicio, fechaFin) => {
  if (fechaInicio === undefined && fechaFin === undefined) return null;

  const rangoInicio =
    fechaInicio === undefined
      ? null
      : rangoDiaGuatemala(String(fechaInicio).trim());
  const rangoFin =
    fechaFin === undefined ? null : rangoDiaGuatemala(String(fechaFin).trim());

  if (rangoInicio === null && fechaInicio !== undefined) return null;
  if (rangoFin === null && fechaFin !== undefined) return null;

  if (rangoInicio && rangoFin && rangoInicio.inicio > rangoFin.inicio) {
    return null;
  }

  return {
    inicio: rangoInicio ? rangoInicio.inicio : undefined,
    fin: rangoFin ? rangoFin.fin : undefined,
  };
};

module.exports.rangoDiaGuatemala = rangoDiaGuatemala;
module.exports.rangoFechasGuatemala = rangoFechasGuatemala;
// * fecha/hora actual en Guatemala, sin depender de la zona del servidor (UTC)
// * para comparar contra columnas datetime guardadas en hora de Guatemala
// ? ahoraGuatemala().subtract(1, "day").format(FORMATO_SQL) -> "2026-11-26T11:33:25"
const FORMATO_SQL = "YYYY-MM-DDTHH:mm:ss"; // ISO sin zona: SQL Server lo lee igual con cualquier idioma
const ahoraGuatemala = () => dayjs().tz(ZONA_HORARIA);

const FECHA_HORA =
  /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2})(?::(\d{2}))?(?:\.\d{1,7})?)?(?:Z|[+-]\d{2}:?\d{2})?$/i;

// * valida una fecha recibida para una columna datetime en hora de Guatemala
// * texto -> "YYYY-MM-DDTHH:mm:ss" con la misma hora escrita (la zona se descarta, como SQL Server;
// * no se convierte porque la API devuelve las fechas con "Z" y el front las reenvia tal cual)
// * Date valido -> el mismo Date (lo convierte el driver, como hasta ahora)
// ? ingresa -> "2026-11-27T10:00" | "2026-11-27 10:00:00" | "2026-11-27T10:00:00.000Z"
// ? retorna -> "2026-11-27T10:00:00"
// ? texto que no es fecha o fecha imposible (31/02) -> null
const fechaHoraValida = (valor) => {
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor;
  if (typeof valor !== "string") return null;
  const partes = FECHA_HORA.exec(valor.trim());
  if (!partes) return null;
  const texto = `${partes[1]}T${partes[2] || "00:00"}:${partes[3] || "00"}`;
  const fecha = dayjs(texto);
  return fecha.isValid() && fecha.format(FORMATO_SQL) === texto ? texto : null;
};

module.exports.FORMATO_SQL = FORMATO_SQL;
module.exports.ahoraGuatemala = ahoraGuatemala;
module.exports.fechaHoraValida = fechaHoraValida;
