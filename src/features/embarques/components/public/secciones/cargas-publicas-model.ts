import {
  computeCW,
  computeVolumenFallbackSinEditar,
  getFactorCmPorUnidadMedida,
  toNumber,
  type UnidadMedidaCatalogo,
} from "@/features/embarques/lib/cargas-calculos";
import { asNumber, asText } from "@/shared/lib/text";

/** Fila normalizada de carga que edita la tabla pública/privada. */
export interface CargaRow {
  embCargaId: number | null;
  rubroId: number | null;
  paisOrigenId: string;
  descripcion: string;
  valor: string;
  tipoEmbalaje: string;
  partidaArancelaria: string;
  regimenAduanal: string;
  definitivoGeneral: string;
  cantidad: string;
  volumenTotal: string | number;
  pesoTotal: string;
  largo: string;
  alto: string;
  ancho: string;
  unidadMedida: string;
  unidadPeso: string;
  cw: string | number;
  _gridId?: string | number;
  [key: string]: unknown;
}

/**
 * Carga entrante desde el servidor o la carta. Admite las tres convenciones de
 * nombres con las que llega (camelCase de la carta, PascalCase del resumen y
 * snake_case/UPPER del backend crudo); `normalizeCargaRows` las unifica.
 */
export interface CargaData {
  embCargaId?: number | null;
  EMB_CARGA_ID?: number | null;
  id?: number | null;
  ID?: number | null;
  rubroId?: number | null;
  RUBRO_ID?: number | null;
  paisOrigenId?: string;
  PaisOrigen?: string;
  PAIS_ID_ORIGEN?: string;
  COD_PAIS_ORIGEN_CARGA?: string;
  PAIS_ID_ORIGEN_CARGA?: string;
  descripcion?: string;
  Descripcion?: string;
  descripcionCarga?: string;
  DESCRIPCION_CARGA?: string;
  valor?: string;
  Valor?: string;
  VALOR?: string;
  tipoEmbalaje?: string;
  TipoEmbalaje?: string;
  codTipoEmbalaje?: string;
  TIPO_EMBALAJE?: string;
  partidaArancelaria?: string;
  PartidaArancelaria?: string;
  PARTIDA_ARANCELARIA?: string;
  regimenAduanal?: string;
  RegimenAduanal?: string;
  REGIMEN_ADUANAL?: string;
  definitivoGeneral?: string;
  DefinitivoGeneral?: string;
  DEFINITIVO_GENERAL?: string;
  cantidad?: string;
  Cantidad?: string;
  bultos?: string;
  BULTOS?: string;
  largo?: string;
  Largo?: string;
  LARGO?: string;
  largo_cm?: string;
  alto?: string;
  Alto?: string;
  ALTO?: string;
  alto_cm?: string;
  ancho?: string;
  Ancho?: string;
  ANCHO?: string;
  ancho_cm?: string;
  volumenTotal?: string | number;
  VolumenTotal?: string | number;
  volumen?: string | number;
  metrosCubicos?: string | number;
  pesoTotal?: string;
  PesoTotal?: string;
  peso?: string;
  PESO?: string;
  cw?: string | number;
  CW?: string | number;
  unidadMedida?: string;
  tipoUnidadMedidaId?: string;
  TIPO_ID_UNIDAD_MEDIDA?: string;
  unidadPeso?: string;
}

export interface Option {
  value: string;
  label: string;
}

export const EMPTY_ROW: CargaRow = {
  embCargaId: null,
  rubroId: null,
  paisOrigenId: "",
  descripcion: "",
  valor: "",
  tipoEmbalaje: "",
  partidaArancelaria: "",
  regimenAduanal: "",
  definitivoGeneral: "N",
  cantidad: "",
  volumenTotal: "",
  pesoTotal: "",
  largo: "",
  alto: "",
  ancho: "",
  unidadMedida: "",
  unidadPeso: "",
  cw: "",
};

/**
 * Normaliza las cargas entrantes a `CargaRow[]`. El peso volumétrico y el CW
 * se derivan con los helpers IATA compartidos (`cargas-calculos`) — misma
 * fórmula y redondeo que el formulario de alta/edición, para que el valor no
 * dependa de la ruta por la que entró la carga.
 */
export function normalizeCargaRows(
  data: CargaData[],
  unidadesMedida: UnidadMedidaCatalogo[],
): CargaRow[] {
  return data.map((c, idx) => {
    // Las cargas llegan con distinta convención según la ruta: camelCase desde
    // la carta privada y el resumen, y TODO en minúsculas cuando pasan por el
    // núcleo HTTP público (normalizeKeys aplana `pesoTotal` → `pesototal`). Se
    // leen por clave insensible a mayúsculas para que la tabla no dependa de
    // por dónde entró la carga.
    const porClave: Record<string, unknown> = {};
    for (const k of Object.keys(c)) porClave[k.toLowerCase()] = (c as Record<string, unknown>)[k];
    const leer = (...claves: string[]): unknown => {
      for (const clave of claves) {
        const v = porClave[clave];
        if (v !== undefined && v !== null && v !== "") return v;
      }
      return undefined;
    };

    const unidadMedida = leer(
      "unidadmedida",
      "tipounidadmedidaid",
      "tipo_id_unidad_medida",
      "tipoidunidadmedida",
    );
    const factorCm = getFactorCmPorUnidadMedida(unidadMedida, unidadesMedida);
    const cantidad = leer("cantidad", "bultos");
    const largo = leer("largo", "largo_cm");
    const alto = leer("alto", "alto_cm");
    const ancho = leer("ancho", "ancho_cm");
    const pesoTotal = asText(leer("pesototal", "peso", "peso_total"));

    const existingVol = asNumber(
      leer("volumentotal", "volumen", "metroscubicos", "metros_cubicos"),
    );
    const pesoVolumetrico =
      existingVol > 0
        ? existingVol
        : computeVolumenFallbackSinEditar({
            cantidad: toNumber(cantidad),
            alto: toNumber(alto),
            ancho: toNumber(ancho),
            largo: toNumber(largo),
            factorCm,
          });

    const cwEntrante = asNumber(leer("cw", "char_w"));
    const cw =
      cwEntrante > 0 ? cwEntrante : computeCW({ pesoTotal: toNumber(pesoTotal), pesoVolumetrico });

    const embCargaId = (leer("embcargaid", "emb_carga_id", "id") ?? null) as number | null;
    return {
      embCargaId,
      rubroId: (leer("rubroid", "rubro_id") ?? null) as number | null,
      paisOrigenId: asText(
        leer("paisorigenid", "paisidorigen", "pais_id_origen", "cod_pais_origen_carga"),
      ),
      descripcion: asText(leer("descripcion", "descripcioncarga", "descripcion_carga")),
      valor: asText(leer("valor")),
      tipoEmbalaje: asText(leer("tipoembalaje", "codtipoembalaje", "cod_tipo_embalaje")),
      partidaArancelaria: asText(leer("partidaarancelaria", "partida_arancelaria")),
      regimenAduanal: asText(leer("regimenaduanal", "regimen_aduanal")),
      definitivoGeneral:
        asText(leer("definitivogeneral", "definitivo_general") ?? "N").toUpperCase() === "S"
          ? "S"
          : "N",
      cantidad: asText(cantidad),
      largo: asText(largo),
      alto: asText(alto),
      ancho: asText(ancho),
      volumenTotal: pesoVolumetrico,
      pesoTotal,
      cw,
      unidadMedida: asText(unidadMedida),
      unidadPeso: asText(leer("unidadpeso") ?? unidadMedida),
      _gridId: embCargaId ?? `temp_id_${idx}`,
    };
  });
}
