import { useQuery } from "@tanstack/react-query";
import api_no_auth_v2 from "../utils/apiPublic";
import { CACHE_DYNAMIC } from "../utils";

const ENDPOINT = "/clientes/api/v2/resumen-coordinacion";

function parsearJson(valor) {
  if (!valor || typeof valor !== "string") return valor ?? null;
  try {
    return JSON.parse(valor);
  } catch {
    return null;
  }
}

function mapearCoordinacion(raw = {}) {
  return {
    codFile: raw.COD_FILE ?? null,
    tipoIdEmbarque: raw.TIPO_ID_EMBARQUE ?? null,
    entidadIdCli: raw.ENTIDAD_ID_CLI ?? null,
    paisIdOrigen: raw.PAIS_ID_ORIGEN ?? null,
    paisIdDestino: raw.PAIS_ID_DESTINO ?? null,
    puntoenlaceIdOrigen: raw.PUNTOENLACE_ID_ORIGEN ?? null,
    puntoenlaceIdDestino: raw.PUNTOENLACE_ID_DESTINO ?? null,
    idServicio: raw.ID_SERVICIO ?? null,
    tipoIdCarga: raw.TIPO_ID_CARGA ?? null,
    incotermId: raw.INCOTERM_ID ?? null,
    tipoIdPago: raw.TIPO_ID_PAGO ?? null,
    clasificacionCargaId: raw.CLASIFICACION_CARGA_ID ?? null,
    estadoId: raw.ESTADO_ID ?? null,
    observaciones: raw.OBSERVACIONES ?? null,
    entidadIdShipper: raw.ENTIDAD_ID_SHIPPER ?? null,
    entidadIdConsignatario: raw.ENTIDAD_ID_CONSIGNATARIO ?? null,
    entidadIdEstacion: raw.ENTIDAD_ID_ESTACION ?? null,
    jsonAtributosOpcionales: parsearJson(raw.JSON_ATRIBUTOS_OPCIONALES),
    peligrosidad: raw.PELIGROSIDAD ?? null,
    nitExp: raw.NIT_EXP ?? null,
    nombreExp: raw.NOMBRE_EXP ?? null,
    direccionExp: raw.DIRECCION_EXP ?? null,
    contactoIdShipper: raw.CONTACTO_ID_SHIPPER ?? null,
    contactoIdConsignatario: raw.CONTACTO_ID_CONSIGNATARIO ?? null,
    contactoIdCliente: raw.CONTACTO_ID_CLIENTE ?? null,
    jsonDocumentos: parsearJson(raw.JSON_DOCUMENTOS),
  };
}

function mapearCarga(raw = {}) {
  return {
    embCargaId: raw.EMB_CARGA_ID ?? null,
    bultos: raw.BULTOS ?? null,
    tipoIdUnidadMedida: raw.TIPO_ID_UNIDAD_MEDIDA ?? null,
    peso: raw.PESO ?? null,
    volumen: raw.VOLUMEN ?? null,
    alto: raw.ALTO ?? null,
    ancho: raw.ANCHO ?? null,
    largo: raw.LARGO ?? null,
    metrosCubicos: raw.METROS_CUBICOS ?? null,
    cw: raw.CW ?? null,
    valor: raw.VALOR ?? null,
    estadoId: raw.ESTADO_ID ?? null,
    descripcionCarga: raw.DESCRIPCION_CARGA ?? null,
    paisIdOrigen: raw.PAIS_ID_ORIGEN ?? null,
    partidaArancelaria: raw.PARTIDA_ARANCELARIA ?? null,
    regimenAduanal: raw.REGIMEN_ADUANAL ?? null,
    definitivoGeneral: raw.DEFINITIVO_GENERAL ?? null,
    zonaFranca: raw.ZONA_FRANCA ?? null,
    valorDeclaradoAduana: raw.VALOR_DECLARADO_ADUANA ?? null,
    repeso: raw.REPESO ?? null,
    pesoNeto: raw.PESO_NETO ?? null,
    codTipoEmbalaje: raw.COD_TIPO_EMBALAJE ?? null,
  };
}

function mapearFechaMov(raw = {}) {
  return {
    idFechaRegEmbarque: raw.ID_FECHA_REG_EMBARQUE ?? null,
    embLegsId: raw.EMB_LEGS_ID ?? null,
    idFechaTipo: raw.ID_FECHA_TIPO ?? null,
    nomenclatura: raw.NOMENCLATURA ?? null,
    fecha: raw.FECHA ?? null,
    observacion: raw.OBSERVACION ?? null,
    estadoId: raw.ESTADO_ID ?? null,
  };
}

function mapearGasto(raw = {}) {
  return {
    embGastoId: raw.EMB_GASTO_ID ?? null,
    codRubro: raw.COD_RUBRO ?? null,
    gruporubroNombre: raw.GRUPORUBRO_NOMBRE ?? null,
    codServicio: raw.COD_SERVICIO ?? null,
    entidadId: raw.ENTIDAD_ID ?? null,
    ventaRubro: raw.VENTA_RUBRO ?? null,
    ventaGrupo: raw.VENTA_GRUPO ?? null,
    codMonedaVenta: raw.COD_MONEDA_VENTA ?? null,
    clasificacion: raw.CLASIFICACION ?? null,
    codTipoPago: raw.COD_TIPO_PAGO ?? null,
    rateVenta: raw.RATE_VENTA ?? null,
    servicioSiglas: raw.SERVICIO_SIGLAS ?? null,
  };
}

function mapearResumen(data = {}) {
  return {
    coordinacion: data.coordinacion ? mapearCoordinacion(data.coordinacion) : null,
    cargas: Array.isArray(data["lista-coordinacion-carga"])
      ? data["lista-coordinacion-carga"].map(mapearCarga)
      : [],
    fechasMov: Array.isArray(data["listar-coordinacion-fecha-mov"])
      ? data["listar-coordinacion-fecha-mov"].map(mapearFechaMov)
      : [],
    gastos: Array.isArray(data["listar-coordinacion-gastos"])
      ? data["listar-coordinacion-gastos"].map(mapearGasto)
      : [],
  };
}

export function useResumenCoordinacionPublico(params = {}, options = {}) {
  return useQuery({
    queryKey: ["resumen-coordinacion-publico", params],
    queryFn: async () => {
      const response = await api_no_auth_v2.get(ENDPOINT, { params });
      const data = response?.data?.data ?? response?.data;
      return mapearResumen(data);
    },
    ...CACHE_DYNAMIC,
    ...options,
  });
}
