function obtenerStringFecha(fecha = new Date(), formato = 'DD/MM/YYYY HH:mm:ss') {
    if (typeof fecha === 'string' || typeof fecha === 'number') {
      fecha = new Date(fecha);
  }

  if (!(fecha instanceof Date) || isNaN(fecha.getTime())) {
      throw new Error('El primer parámetro debe ser una fecha válida (Date, string convertible a fecha o timestamp).');
  }

  const valores = {
      DD: fecha.getDate().toString().padStart(2, '0'),
      MM: (fecha.getMonth() + 1).toString().padStart(2, '0'),
      YYYY: fecha.getFullYear(),
      HH: fecha.getHours().toString().padStart(2, '0'),
      mm: fecha.getMinutes().toString().padStart(2, '0'),
      ss: fecha.getSeconds().toString().padStart(2, '0')
  };

  return formato.replace(/DD|MM|YYYY|HH|mm|ss/g, match => valores[match]);
};


export default obtenerStringFecha;