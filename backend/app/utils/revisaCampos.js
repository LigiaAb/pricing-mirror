// * obtenerCamposFaltantes(campos, ['tipo_combustible', 'cliente_id'])
const tieneCamposRequeridos = (campos, requeridos = []) => {
  if (!campos || typeof campos !== "object" || !Array.isArray(requeridos)) {
    return false;
  }

  return requeridos.every((campo) =>
    Object.prototype.hasOwnProperty.call(campos, campo),
  );
};

// * obtenerCamposFaltantes(campos, ['tipo_combustible', 'cliente_id'])
const obtenerCamposFaltantes = (campos, requeridos = []) => {
  if (!Array.isArray(requeridos)) {
    return [];
  }

  const valores =
    campos && typeof campos === "object" && !Array.isArray(campos)
      ? campos
      : {};

  return requeridos.filter(
    (campo) => !Object.prototype.hasOwnProperty.call(valores, campo),
  );
};

module.exports.tieneCamposRequeridos = tieneCamposRequeridos;
module.exports.obtenerCamposFaltantes = obtenerCamposFaltantes;
