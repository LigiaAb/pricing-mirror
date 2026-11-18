import * as React from "react";

/**
 * Devuelve `valor` retrasado `demora` ms desde el último cambio. Se usa para no
 * consultar al backend en cada tecla, sino cuando el usuario deja de escribir.
 *
 * @example
 * const busquedaDiferida = useDebouncedValue(texto, 300);
 */
export function useDebouncedValue<T>(valor: T, demora: number): T {
  const [diferido, setDiferido] = React.useState(valor);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => setDiferido(valor), demora);
    return () => window.clearTimeout(timeout);
  }, [valor, demora]);

  return diferido;
}
