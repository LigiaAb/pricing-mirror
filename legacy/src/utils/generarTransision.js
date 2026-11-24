export const generarTrasision = (lista) => {
  const transisiones = [];

  lista.forEach((item) => {
    const { propiedad, tipo, tiempo } = item;
    transisiones.push(`${propiedad} ${tiempo}s ${tipo}`);
  });
  return transisiones.join(", ");
};

export default generarTrasision;
