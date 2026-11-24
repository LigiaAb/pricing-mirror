// Utils
export {
  extractResponseData,
  extractFromData,
  CACHE_STATIC,
  CACHE_SEMI_STATIC,
  CACHE_DYNAMIC,
  invalidateCoordinaciones,
  invalidateCoordinacionCargas,
  invalidateCoordinacionContactos,
  invalidateCoordinacionDocumentos,
  invalidateCoordinacionFechasMov,
  invalidateCorrelativoGuias,
  getCodUsuarioFromLocalStorage,
} from "./utils";
export { toIsoDate } from "./utils/date";

// Catálogos
export {
  useFetchEmpresas,
  useFetchEstados,
  useFetchPaises,
  useFetchPaisesPublico,
  useFetchCiudadesPublico,
  useFetchDepartamentosPublico,
  useFetchMunicipiosPublico,
  useFetchIndustriasPublico,
  useFetchMonedas,
  useFetchTipos,
  useFetchTiposPublico,
  useFetchRelacionTipo,
  useFetchRubros,
  useFetchCentrosCosto,
  useCentrosCostoPorEmpresa,
  useFetchTipoDocumentoCentroCosto,
  useFetchSerieTipoDocumentoCentroCosto,
  useFetchDocumentosReasonCode,
  useFetchServicios,
  useFetchPuntoEnlace,
  useFetchUsuarios,
  fetchUsuarios,
  useFetchEmpleadoUsuarioPuesto,
  fetchEmpleadoUsuarioPuesto,
  useFetchDepartamentos,
  useFetchMunicipios,
  useFetchCiudades,
  useFetchIndustrias,
  useInsertarMunicipio,
  useActualizarMunicipio,
  useEliminarMunicipio,
  // incoterms catalog
  useFetchIncoterms,
  useInsertarIncoterm,
  useActualizarIncoterm,
  useEliminarIncoterm,
  useFetchTiposV2,
  useFetchRelacionTipoPublicV2,
} from "./catalogos";

// Entidades
export {
  useFetchEntidades,
  useFetchEntidadesDireccion,
  useFetchEntidadConfiguracion,
  useBusquedaEntidadCriterio,
  useFetchEntidadContacto,
  useFetchEntidadIdentificacion,
  useFetchEntidadRelaciones,
  useFetchDatosEntidad,
  useFetchDatosEntidadPublico,
  useFetchDatosEntidadRelacionada,
  useFetchDatosEntidadRelacionadaPublico,
  useFetchDatosEntidadRelacionadaV1,
  useFetchDatosEntidadRelacionadaAppweb,
  useInsertarEntidadRelacion,
  useActualizarEntidadRelacion,
  useEliminarEntidadRelacion,
  useInsertarEntidadIdentificacion,
  useActualizarEntidadIdentificacion,
  useEliminarEntidadIdentificacion,
  // direcciones de entidad
  useInsertarEntidadDireccion,
  useActualizarEntidadDireccion,
  useEliminarEntidadDireccion,
  // contactos de entidad
  useInsertarEntidadContacto,
  useActualizarEntidadContacto,
  useEliminarEntidadContacto,
} from "./entidades";

// Coordinaciones
export {
  useCoordinaciones,
  useCoordinacionData,
  useCoordinacionCargas,
  fetchCoordinacionCargas,
  useCoordinacionLegs,
  useCoordinacionLegsCRUD,
  useInsertarCoordinacionLegs,
  useActualizarCoordinacionLegs,
  useFetchCoordinacionContacto,
  useCoordinacionContactos,
  useCoordinacionDocumentos,
  useFetchCoordinacionFechaMov,
  useCoordinacionFechasMov,
  useCreateCoordinacion,
  useUpdateCoordinacion,
  useCreateRepesoCarga,
  useInsertarCoordinacionCarga,
  useActualizarCoordinacionCarga,
  useEliminarCoordinacionCarga,
  useCreateCoordinacionFechaMov,
  useUpdateCoordinacionFechaMov,
  useDeleteCoordinacionFechaMov,
  useCreateCoordinacionDocumento,
  useUpdateCoordinacionDocumento,
  useDeleteCoordinacionDocumento,
  useUpdateAtdCoordinacionAsignada,
  useUpdateCoordinacionEstado,
  useCopiarCotizacionAEmbarque,
  useGenerarDocumentosSolicitudFacturacion,
  // acceso al listado de masters disponibles para una coordinación
  useListarMasterDisponiblesCoordinacion,
  fetchMasterDisponiblesCoordinacion,
  useResumenCoordinacionPublico,
  useCoordinacionDocumentosPublico,
  useCreateCoordinacionDocumentoPublico,
  useUpdateCoordinacionDocumentoPublico,
  useDeleteCoordinacionDocumentoPublico,
} from "./coordinaciones";
export { validateUpdateAtdCoordinacionAsignada, default as validators } from "./coordinaciones/validators";

// Gastos
export { default as useRecalcularEmbarque } from "./Gastos/useRecalcularEmbarque";
export { useListarCoordinacionGastosCriterio, fetchCoordinacionGastosCriterio } from "./Gastos/useListarCoordinacionGastosCriterio";
export { useListarCoordinacionGastos, fetchCoordinacionGastos } from "./Gastos/useListarCoordinacionGastos";
export { useObtenerUltimaVersionCoordinacionGastos, fetchUltimaVersionCoordinacionGastos } from "./Gastos/useObtenerUltimaVersionCoordinacionGastos";
export {
  default as useObtenerCriteriosConValor,
  mapCriteriosConValor,
} from "./Gastos/useObtenerCriteriosConValor";
export { useInsertarCoordinacionGasto, useActualizarCoordinacionGasto, useEliminarCoordinacionGasto } from "./Gastos/useCoordinacionGastosMutations";
export { useCalcularTarifa, fetchCalcularTarifa } from "./Gastos/useCalcularTarifa";
export { useRecalcularEmbarqueConRepeso, useRecalcularEmbarqueConCargas } from "./services/recalcularEmbarque";

// Correlativos
export {
  useFetchCorrelativoGuias,
  useFetchGuiasCoordinacion,
  useFetchDetalleCorrelativoGuias,
  useCreateCorrelativoGuiasXCriterio,
  useAssignCorrelativoGuiaXCriterio,
  useAsignarMasterCoordinacion,
  validateCommonFields,
  parseNumberOrThrow,
  validateCorrelativeFields,
  buildBasePayload,
  processListaGuias,
  processHawbPayload,
  processMawbPayload,
  findIsoDateInObject,
  normalizeFechaVence,
  mergeNumericCorrelativeFields,
  preparePayloadForCreate,
} from "./correlativos";

// Archivos
export { useRecuperarArchivo, useGuardarArchivo, useGuardarArchivoPublico, useRecuperarArchivoPublico } from "./archivos";

// Cotizaciones
export { useFetchCotizaciones } from "./cotizaciones/useFetchCotizaciones";
export { useFetchCotizacionDetalles } from "./cotizaciones/useFetchCotizacionDetalles";
export { useFetchCotizacionDetalleCriterios } from "./cotizaciones/useFetchCotizacionDetalleCriterios";
export { useFetchCotizacionDetalleRubros } from "./cotizaciones/useFetchCotizacionDetalleRubros";
export { useCreateCotizacionDocumento, useUpdateCotizacionDocumento, useRegistrarSeguimientoCTS } from "./cotizaciones/useCotizacionMutations";
export { useCotizacionDocumentos } from "./cotizaciones/useCotizacionDocumentos";

// Documentos externos
export { useFetchDocumentoCobroExterno } from "./documentos/useFetchDocumentoCobroExterno";

// Actividades
export {
  useInsertarActividad,
  useActualizarActividad,
  useEliminarActividad,
} from "./actividades/useActividades";
export { useFetchActividades } from "./actividades/useFetchActividades";

// Carta de instrucciones
export {
  CARTA_INSTRUCCIONES_ESTADOS,
  esEstadoCartaInstruccionesValido,
  extraerFilaCartaInstrucciones,
  extraerJsonCartaInstrucciones,
  validarPayloadCambioEstadoCartaInstrucciones,
  validarPayloadFilaCartaInstrucciones,
  validarPayloadActualizarJsonCartaInstrucciones,
  validarPayloadGenerarLinkCartaInstrucciones,
  cambiarEstadoCartaInstruccionesPrivado,
  cambiarEstadoCartaInstruccionesPublico,
  recuperarFilaCartaInstruccionesPrivado,
  recuperarFilaCartaInstruccionesPublico,
  actualizarJsonCartaInstruccionesPrivado,
  actualizarJsonCartaInstruccionesPublico,
  generarLinkCartaInstruccionesPrivado,
  useDetalleEstadosCartaInstrucciones,
  useCambioEstadoCartaInstruccionesPrivado,
  useCambioEstadoCartaInstruccionesPublico,
  useFilaCartaInstruccionesPrivado,
  useFilaCartaInstruccionesPublico,
  useActualizarJsonCartaInstruccionesPrivado,
  useActualizarJsonCartaInstruccionesPublico,
  useGenerarLinkCartaInstruccionesPrivado,
  useCartaInstruccionesData,
} from "./cartaInstrucciones";
