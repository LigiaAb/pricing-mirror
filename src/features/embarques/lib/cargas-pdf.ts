/**
 * Resolución de cargas para el PDF y normalización para guardado (paridad
 * legacy `public/page.jsx:841-912,1056-1064` y `CTS/[id]/page.jsx:507-549`).
 * El wizard guarda las cargas con IDs crudos de catálogo (régimen aduanal,
 * tipo de embalaje, país de origen, unidad de medida) y a veces con claves
 * PascalCase (Descripcion, Valor, PesoTotal, ...); el generador de PDF sólo
 * lee camelCase con nombre legible. Sin esta resolución el PDF muestra el
 * código crudo ("345") o "No especificado" apenas se edita una carga.
 */

type AnyRecord = Record<string, unknown>;

/** Item de catálogo genérico ({cod_tipo}/{value}/{label} en cualquier grafía). */
interface CatalogoResoluble {
  value?: string | number | undefined;
  codTipo?: string | number | undefined;
  cod_tipo?: string | number | undefined;
  label?: string | undefined;
  nomTipo?: string | undefined;
  nom_tipo?: string | undefined;
  tipo_desc?: string | undefined;
}

interface PaisCatalogoItem {
  cod_pais?: string | number | undefined;
  value?: string | number | undefined;
  nombre_pais?: string | undefined;
  label?: string | undefined;
}

export interface CargasPdfCatalogos {
  regimenAduanal?: CatalogoResoluble[];
  tipoEmbalaje?: CatalogoResoluble[];
  paises?: PaisCatalogoItem[];
  unidadMedida?: CatalogoResoluble[];
}

/** Primer valor no vacío entre las variantes de clave dadas (fallback si ninguna aplica). */
function primerValor(carga: AnyRecord, keys: string[], fallback: unknown = ""): unknown {
  for (const key of keys) {
    const v = carga[key];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return fallback;
}

function resolverPorCatalogo(
  value: unknown,
  catalogo: CatalogoResoluble[],
  { fallbackToValue }: { fallbackToValue: boolean },
): string {
  if (value === undefined || value === null || value === "") return "";
  const found = catalogo.find((t) => String(t.value ?? t.codTipo ?? t.cod_tipo) === String(value));
  const label = found?.label || found?.nomTipo || found?.nom_tipo || found?.tipo_desc;
  if (label) return label;
  return fallbackToValue ? String(value) : "";
}

function resolverPaisOrigen(value: unknown, paises: PaisCatalogoItem[]): string {
  if (value === undefined || value === null || value === "") return "";
  const found = paises.find((p) => String(p.cod_pais ?? p.value) === String(value));
  return found?.nombre_pais || found?.label || String(value);
}

/**
 * Resuelve régimen aduanal, tipo de embalaje, país de origen y unidad de
 * medida a etiqueta legible, y normaliza las claves PascalCase que deja el
 * wizard a las camelCase que lee el generador de PDF. Corre SIEMPRE (sin
 * atajo para "cargas sin editar" — ese atajo fue el bug original).
 */
export function resolverCargasParaPdf(
  cargas: AnyRecord[],
  catalogos: CargasPdfCatalogos,
): AnyRecord[] {
  const regimenAduanalCatalog = catalogos.regimenAduanal ?? [];
  const tipoEmbalajeCatalog = catalogos.tipoEmbalaje ?? [];
  const paisesCatalog = catalogos.paises ?? [];
  const unidadMedidaCatalog = catalogos.unidadMedida ?? [];

  return (cargas ?? []).map((f) => {
    const paisOrigenId = primerValor(f, ["paisOrigenId", "PaisOrigen", "paisOrigen"]);
    const paisOrigenNombre = resolverPaisOrigen(paisOrigenId, paisesCatalog);

    const tipoEmbalajeValor = primerValor(f, [
      "tipoEmbalaje",
      "TipoEmbalaje",
      "tipo_embalaje",
      "codTipoEmbalaje",
      "cod_tipo_embalaje",
    ]);
    const tipoEmbalajeLabel = resolverPorCatalogo(tipoEmbalajeValor, tipoEmbalajeCatalog, {
      fallbackToValue: true,
    });

    const regimenAduanalValor = primerValor(f, [
      "regimenAduanal",
      "RegimenAduanal",
      "regimen_aduanal",
    ]);
    const regimenAduanalLabel = resolverPorCatalogo(regimenAduanalValor, regimenAduanalCatalog, {
      fallbackToValue: true,
    });

    const unidadMedidaValor = primerValor(f, ["unidadMedida", "UnidadMedida", "unidadMedidaId"]);
    const unidadMedidaLabel = resolverPorCatalogo(unidadMedidaValor, unidadMedidaCatalog, {
      fallbackToValue: false,
    });

    return {
      // conservar el resto de campos originales (codFile, etc.) que el
      // generador del PDF sigue leyendo de la fila cruda.
      ...f,
      descripcionCarga: primerValor(f, ["descripcionCarga", "Descripcion", "descripcion"]),
      valor: primerValor(f, ["valor", "Valor"]),
      bultos: primerValor(f, ["cantidad", "Cantidad", "Bultos", "bultos"], 0),
      cantidad: primerValor(f, ["cantidad", "Cantidad"], 0),
      peso: primerValor(f, ["pesoTotal", "PesoTotal", "peso"], 0),
      volumen: primerValor(f, ["volumenTotal", "VolumenTotal", "volumen"], 0),
      partidaArancelaria: primerValor(f, ["partidaArancelaria", "PartidaArancelaria"]),
      regimenAduanal: regimenAduanalLabel,
      // se escriben las dos variantes de nombre de clave que lee el
      // generador de PDF (y la que tiene prioridad ahí), para que el label ya
      // resuelto gane siempre sobre el ID crudo que pueda venir en la fila.
      tipoEmbalaje: tipoEmbalajeLabel,
      tipo_embalaje: tipoEmbalajeLabel,
      definitivoGeneral: primerValor(f, ["definitivoGeneral", "DefinitivoGeneral"], "N"),
      paisOrigen: paisOrigenNombre,
      nombre_pais_origen: paisOrigenNombre,
      tarimas: primerValor(f, ["tarimas", "Tarimas"], 0),
      cajas: primerValor(f, ["cajas", "Cajas"], 0),
      largo: primerValor(f, ["largo", "Largo"], 0),
      alto: primerValor(f, ["alto", "Alto"], 0),
      ancho: primerValor(f, ["ancho", "Ancho"], 0),
      unidadMedidaLabel,
      cw: primerValor(f, ["cw", "CW"]),
    };
  });
}

const DIMENSION_KEYS: Record<"largo" | "ancho" | "alto", string[]> = {
  largo: ["largo", "Largo", "LARGO", "largo_cm", "LARGO_CM", "largoCm", "LargoCm"],
  ancho: ["ancho", "Ancho", "ANCHO", "ancho_cm", "ANCHO_CM", "anchoCm", "AnchoCm"],
  alto: ["alto", "Alto", "ALTO", "alto_cm", "ALTO_CM", "altoCm", "AltoCm"],
};

/**
 * Resuelve largo/ancho/alto sobre las 7 variantes de clave que puede traer
 * una fila (BD, carta guardada, edición en pantalla) y escribe AMBAS grafías
 * (lower y UPPER) antes de mandar la fila a guardar — algunos lectores de la
 * carta (PDF, tabla editable) sólo miran una de las dos.
 */
export function normalizarCargaParaGuardado(carga: AnyRecord): AnyRecord {
  const largo = primerValor(carga, DIMENSION_KEYS.largo);
  const ancho = primerValor(carga, DIMENSION_KEYS.ancho);
  const alto = primerValor(carga, DIMENSION_KEYS.alto);
  return { ...carga, largo, ancho, alto, LARGO: largo, ANCHO: ancho, ALTO: alto };
}

export function normalizarCargasParaGuardado(cargas: AnyRecord[]): AnyRecord[] {
  return (cargas ?? []).map(normalizarCargaParaGuardado);
}
