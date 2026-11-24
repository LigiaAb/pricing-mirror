const normalizeTipo = (tipo) => {
  if (tipo == null || tipo === "") return null;

  let raw = tipo;
  if (typeof tipo === "object") {
    raw =
      tipo.value ??
      tipo.cod_tipo ??
      tipo.codTipo ??
      tipo.nom_tipo ??
      tipo.label ??
      tipo.nombre ??
      tipo;
  }
  if (typeof raw === "number") raw = String(raw);
  if (!raw) return null;

  return String(raw)
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
};

const matchesAny = (normalized, tokens) =>
  tokens.some((token) => normalized.includes(token));

export function getRefTipoSecuenciaMaster(tipo) {
  const normalized = normalizeTipo(tipo);
  if (!normalized) return null;

  if (matchesAny(normalized, ["TERRESTRE", "MCP"])) return "MCP";
  if (matchesAny(normalized, ["AEREO", "MAWB"])) return "MAWB";
  if (matchesAny(normalized, ["MARITIMO", "MBL"])) return "MBL";
  return null;
}

export function getRefTipoSecuenciaHouse(tipo) {
  const normalized = normalizeTipo(tipo);
  if (!normalized) return null;

  if (matchesAny(normalized, ["TERRESTRE", "HCP"])) return "HCP";
  if (matchesAny(normalized, ["AEREO", "HAWB"])) return "HAWB";
  if (matchesAny(normalized, ["MARITIMO", "HBL"])) return "HBL";
  return null;
}

export default getRefTipoSecuenciaHouse;
