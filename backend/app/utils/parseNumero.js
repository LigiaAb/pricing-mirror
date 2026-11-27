// ? UTIL para parsear valores numericos en query params / body

// * parsePositiveInteger(campos.limite, 10)
module.exports.parsePositiveInteger = (value, fallback) => {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
};

// * esCatidadPositiva(campos.cantidad)
module.exports.esCantidadPositiva = (cantidad) =>
  typeof cantidad === "number" && Number.isFinite(cantidad) && cantidad > 0;
