import { useState, useEffect } from 'react';

/**
 * FUNCION ANTIRREBOTE
 * Evita enviar una solicitud a la base de datos por cada pulsación de tecla en una barra de busqueda, 
 * garantiza que la consulta de búsqueda solo se active después de que el usuario deje de escribir 
 * durante un período específico.
 * 
 * value: valor a ser buscado
 * delay: tiempo a esperar antes de realizar la actualización
*/

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
        console.log("debounce")
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}