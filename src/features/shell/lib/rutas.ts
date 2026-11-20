/**
 * Normaliza segmentos de ruta provenientes del backend (algunos usan snake_case
 * legacy, ej. "catalogo_errores") al kebab-case que usan las páginas reales.
 * Las páginas legacy con guion bajo solo redirigen (ver app/.../catalogo_errores)
 * al equivalente con guion, por lo que comparar/navegar debe usar siempre esta forma.
 */
function normalizarSegmento(segmento: string): string {
  return segmento.replace(/_/g, "-");
}

/**
 * El backend no garantiza el "/" inicial en MODULO_RUTA (p.ej. Tracking
 * guarda "tracking" en vez de "/tracking"). Sin normalizar, la ruta
 * resultante queda relativa y `router.push` la resuelve contra el pathname
 * actual en vez de la raíz, acumulando segmentos en cada navegación.
 */
export function normalizarRutaModulo(moduloRuta: string): string {
  const sinBarraFinal = moduloRuta.endsWith("/") ? moduloRuta.slice(0, -1) : moduloRuta;
  const conBarraInicial = sinBarraFinal.startsWith("/") ? sinBarraFinal : `/${sinBarraFinal}`;
  return normalizarSegmento(conBarraInicial);
}

export function construirRutaCategoria(
  moduloRuta: string,
  menuRuta: string,
  categoriaRuta: string,
): string {
  const modulo = normalizarRutaModulo(moduloRuta);
  const menu = normalizarSegmento(menuRuta.startsWith("/") ? menuRuta : `/${menuRuta}`);
  const categoria = normalizarSegmento(
    categoriaRuta.startsWith("/") ? categoriaRuta : `/${categoriaRuta}`,
  );
  return `${modulo}${menu}${categoria}`;
}

export function construirRutaMenu(moduloRuta: string, menuRuta: string): string {
  const modulo = normalizarRutaModulo(moduloRuta);
  const menu = normalizarSegmento(menuRuta.startsWith("/") ? menuRuta : `/${menuRuta}`);
  return `${modulo}${menu}`;
}

/**
 * `true` si `pathname` está dentro de `ruta`. Compara por segmento completo para
 * que `/tarifas` no capture `/tarifas-especiales`, y acepta rutas más profundas
 * (`/modulo/menu/categoria/<id>` sigue perteneciendo a la categoría).
 */
export function rutaContienePathname(ruta: string, pathname: string): boolean {
  return pathname === ruta || pathname.startsWith(`${ruta}/`);
}
