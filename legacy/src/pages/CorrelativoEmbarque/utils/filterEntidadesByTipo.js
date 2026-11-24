export const TIPO_OPTIONS = [
  { value: "TERRESTRE", label: "Terrestre" },
  { value: "AEREO", label: "Aéreo" },
  { value: "MARITIMO", label: "Marítimo" },
];

const extractTipoValue = (tipo) => {
  if (tipo == null) return "";
  if (typeof tipo === "object") {
    return (
      tipo.value ??
      tipo.cod_tipo ??
      tipo.codTipo ??
      tipo.nom_tipo ??
      tipo.label ??
      tipo.nombre ??
      ""
    );
  }
  return tipo;
};

export function getEntidadMatchers(tipo) {
  const tipoUpper = String(extractTipoValue(tipo) ?? "")
    .toUpperCase()
    .trim();
  if (["AEREO", "MARITIMO", "TERRESTRE"].includes(tipoUpper))
    return [tipoUpper];
  return [];
}

export function filterEntidadesByTipo(entidadesConfiguracion, tipo) {
  const list = entidadesConfiguracion ?? [];
  const matchers = getEntidadMatchers(tipo);
  const seen = new Set();

  const filtered =
    matchers.length > 0
      ? list.filter((cfg) => {
          const desc = (cfg.configuracionDescripcion || "").toUpperCase();
          return matchers.some((m) => desc.includes(m));
        })
      : [];

  return filtered
    .map((cfg) => ({ value: cfg.entidadId, label: cfg.entidadNombre }))
    .filter((opt) => {
      if (seen.has(opt.value)) return false;
      seen.add(opt.value);
      return true;
    });
}
