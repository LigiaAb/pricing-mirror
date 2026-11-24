// Utilidades para formateo de fechas
// Formato: DD-MM-YYYY
/**
 * Formatea una fecha al formato DD-MM-YYYY
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada en DD-MM-YYYY o cadena vacía si no hay fecha
 */
export const formatearFecha = (fecha) => {
  if (!fecha) return "";
  
  try {
    const fechaObj = new Date(fecha);
    
    // Verificar si la fecha es válida
    if (isNaN(fechaObj.getTime())) {
      return "";
    }
    
    // Obtener día, mes y año
    const dia = fechaObj.getDate().toString().padStart(2, '0');
    const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
    const año = fechaObj.getFullYear();
    
    // Retornar en formato DD-MM-YYYY
    return `${dia}-${mes}-${año}`;
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return "";
  }
};

/**
 * Formatea una fecha al formato DD-MM-YYYY HH:mm:ss
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha y hora formateada
 */
export const formatearFechaHora = (fecha) => {
  if (!fecha) return "";
  
  try {
    const fechaObj = new Date(fecha);
    
    if (isNaN(fechaObj.getTime())) {
      return "";
    }
    
    const dia = fechaObj.getDate().toString().padStart(2, '0');
    const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
    const año = fechaObj.getFullYear();
    const hora = fechaObj.getHours().toString().padStart(2, '0');
    const minutos = fechaObj.getMinutes().toString().padStart(2, '0');
    const segundos = fechaObj.getSeconds().toString().padStart(2, '0');
    
    return `${dia}-${mes}-${año} ${hora}:${minutos}:${segundos}`;
  } catch (error) {
    console.error('Error al formatear fecha y hora:', error);
    return "";
  }
};

/**
 * Formatea una fecha al formato DD/MM/YYYY (con barras)
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada en DD/MM/YYYY
 */
export const formatearFechaBarras = (fecha) => {
  if (!fecha) return "";
  
  try {
    const fechaObj = new Date(fecha);
    
    if (isNaN(fechaObj.getTime())) {
      return "";
    }
    
    const dia = fechaObj.getDate().toString().padStart(2, '0');
    const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
    const año = fechaObj.getFullYear();
    
    return `${dia}/${mes}/${año}`;
  } catch (error) {
    console.error('Error al formatear fecha con barras:', error);
    return "";
  }
};

/**
 * Valida si una fecha es válida
 * @param {string|Date} fecha - Fecha a validar
 * @returns {boolean} true si la fecha es válida
 */
export const esFechaValida = (fecha) => {
  if (!fecha) return false;
  
  try {
    const fechaObj = new Date(fecha);
    return !isNaN(fechaObj.getTime());
  } catch (error) {
    return false;
  }
};

/**
 * Formatea una fecha al formato DD-MM-YYYY (función de utilidad para tablas)
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada en DD-MM-YYYY o cadena vacía si no hay fecha
 */
export const formatearFechaTabla = (fecha) => {
  if (!fecha) return "";
  
  try {
    const fechaObj = new Date(fecha);
    
    // Verificar si la fecha es válida
    if (isNaN(fechaObj.getTime())) {
      return "";
    }
    
    // Obtener día, mes y año
    const dia = fechaObj.getDate().toString().padStart(2, '0');
    const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
    const año = fechaObj.getFullYear();
    
    // Retornar en formato DD-MM-YYYY
    return `${dia}-${mes}-${año}`;
  } catch (error) {
    console.error('Error al formatear fecha para tabla:', error);
    return "";
  }
};

/**
 * Formatea una fecha al formato DD-MM-YYYY HH:mm:ss (función de utilidad para bitácoras)
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada en DD-MM-YYYY HH:mm:ss o cadena vacía si no hay fecha
 */
export const formatearFechaHoraBarras = (fecha) => {
  if (!fecha) return "";

  try {
    const fechaObj = new Date(fecha);

    if (isNaN(fechaObj.getTime())) {
      return "";
    }

    const dia = fechaObj.getDate().toString().padStart(2, '0');
    const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
    const año = fechaObj.getFullYear();
    const hora = fechaObj.getHours().toString().padStart(2, '0');
    const minutos = fechaObj.getMinutes().toString().padStart(2, '0');

    return `${dia}/${mes}/${año} ${hora}:${minutos}`;
  } catch (error) {
    console.error('Error al formatear fecha y hora con barras:', error);
    return "";
  }
};

export const formatearFechaBitacora = (fecha) => {
  if (!fecha) return "";
  
  try {
    const fechaObj = new Date(fecha);
    
    // Verificar si la fecha es válida
    if (isNaN(fechaObj.getTime())) {
      return "";
    }
    
    // Obtener día, mes, año, hora, minutos y segundos
    const dia = fechaObj.getDate().toString().padStart(2, '0');
    const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
    const año = fechaObj.getFullYear();
    const hora = fechaObj.getHours().toString().padStart(2, '0');
    const minutos = fechaObj.getMinutes().toString().padStart(2, '0');
    const segundos = fechaObj.getSeconds().toString().padStart(2, '0');
    
    // Retornar en formato DD-MM-YYYY HH:mm:ss
    return `${dia}-${mes}-${año} ${hora}:${minutos}:${segundos}`;
  } catch (error) {
    console.error('Error al formatear fecha para bitácora:', error);
    return "";
  }
}; 