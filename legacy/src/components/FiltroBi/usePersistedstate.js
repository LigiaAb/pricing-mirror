import { useEffect, useState } from 'react';

/**
 * Persiste un valor (la configuración de niveles del usuario) en localStorage,
 * recuperándolo automáticamente al montar el componente.
 *
 * @param {string} key - clave única en localStorage (ej: 'clienteBi.niveles')
 * @param {*} valorPorDefecto - valor inicial si no hay nada guardado todavía
 * @returns {[valor, setValor]} - igual que useState, pero persistido
 */
export function usePersistedState(key, valorPorDefecto) {
  const [valor, setValor] = useState(() => {
    try {
      const guardado = window.localStorage.getItem(key);
      return guardado ? JSON.parse(guardado) : valorPorDefecto;
    } catch (error) {
      console.warn(`No se pudo leer "${key}" de localStorage:`, error);
      return valorPorDefecto;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(valor));
    } catch (error) {
      console.warn(`No se pudo guardar "${key}" en localStorage:`, error);
    }
  }, [key, valor]);

  return [valor, setValor];
}