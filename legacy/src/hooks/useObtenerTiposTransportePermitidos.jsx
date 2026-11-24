import { CODS_TIPOS_TRANSPORTE } from "../constants/transportes";

/**
 * Hook para obtener los tipos de transporte permitidos para el usuario actual
 * basado en los permisos asignados en el JSON del rol/usuario.
 *
 * La estructura del JSON de permisos para embarques incluye:
 * permisos.paises[cod_pais].empresas[cod_empresa].centrosCosto[cod_cc].tiposTransporte[cod_tipo]
 *
 * @returns {Object} Objeto con información de tipos de transporte permitidos
 */
export const useObtenerTiposTransportePermitidos = () => {
  // Permitir todos los tipos de transporte sin restricción
  const todosLosTipos = [
    { cod_tipo_transporte: CODS_TIPOS_TRANSPORTE.AEREO, nom_tipo_transporte: "AEREO" },
    { cod_tipo_transporte: CODS_TIPOS_TRANSPORTE.MARITIMO, nom_tipo_transporte: "MARITIMO" },
    { cod_tipo_transporte: CODS_TIPOS_TRANSPORTE.TERRESTRE, nom_tipo_transporte: "TERRESTRE" },
  ];

  return {
    tiposTransportePermitidos: todosLosTipos,
    tiposTransportePermitidosCods: [
      CODS_TIPOS_TRANSPORTE.AEREO,
      CODS_TIPOS_TRANSPORTE.MARITIMO,
      CODS_TIPOS_TRANSPORTE.TERRESTRE,
    ],
    tieneRestriccion: false,
    puedeVerAereo: true,
    puedeVerMaritimo: true,
    puedeVerTerrestre: true,
  };
};

/**
 * Hook para verificar si un tipo de transporte específico está permitido
 * @param {number} codTipoTransporte - Código del tipo de transporte a verificar
 * @returns {boolean} true si está permitido, false si no
 */
export const useTipoTransportePermitido = (codTipoTransporte) => {
  const { tiposTransportePermitidosCods } = useObtenerTiposTransportePermitidos();

  return useMemo(() => {
    return tiposTransportePermitidosCods.includes(Number(codTipoTransporte));
  }, [tiposTransportePermitidosCods, codTipoTransporte]);
};

/**
 * Función helper para filtrar una lista de tipos de transporte según permisos
 * @param {Array} tiposTransporte - Lista completa de tipos de transporte
 * @param {Array} tiposPermitidosCods - Códigos de tipos permitidos
 * @returns {Array} Lista filtrada de tipos de transporte
 */
export const filtrarTiposTransportePorPermisos = (tiposTransporte, tiposPermitidosCods) => {
  if (!tiposPermitidosCods || tiposPermitidosCods.length === 0) {
    return tiposTransporte;
  }

  return tiposTransporte.filter(tipo => {
    const codTipo = tipo.value || tipo.cod_tipo_transporte || tipo.COD_TIPO;
    return tiposPermitidosCods.includes(Number(codTipo));
  });
};

/**
 * Función helper para filtrar embarques/cotizaciones según tipos de transporte permitidos
 * @param {Array} items - Lista de embarques o cotizaciones
 * @param {Array} tiposPermitidosCods - Códigos de tipos permitidos
 * @param {string} campoTipo - Nombre del campo que contiene el tipo de transporte
 * @returns {Array} Lista filtrada
 */
export const filtrarItemsPorTipoTransporte = (items, tiposPermitidosCods, campoTipo = 'cod_tipo_transporte') => {
  if (!tiposPermitidosCods || tiposPermitidosCods.length === 0) {
    return items;
  }

  return items.filter(item => {
    // Buscar el código de tipo en múltiples campos posibles
    const codTipo = item[campoTipo] || item.TIPO_ID_EMBARQUE || item.tipo_id_embarque || item.tipo_id_transporte || item.TIPO_ID_TRANSPORTE;
    return tiposPermitidosCods.includes(Number(codTipo));
  });
};

export default useObtenerTiposTransportePermitidos;
