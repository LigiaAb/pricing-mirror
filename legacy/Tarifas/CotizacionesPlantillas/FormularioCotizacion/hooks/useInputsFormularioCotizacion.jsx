import { useMemo } from "react";
import { api } from "../../../../../api";
import { REL_TIPOS_CLASIFICACION_TARIFAS } from "../../../../../constants/clasifacionesTarifas";
import { CODS_ESTADOS } from "../../../../../constants/estados";
import CODS_TIPOS_ENTIDAD, { NOMBRES_TIPOS_ENTIDAD } from "../../../../../constants/tiposEntidades";

const useInputsFormularioCotizacion = ({
  valores,
  isLoadingInputProveedor,
  isLoadingInputCliente,
  isItCreating,
  opciones,
  defaultValues,
  readonly,
  setIsOpenDialogBusquedaProveedor,
  setIsOpenDialogCrearProveedor,
  setIsOpenDialogBusquedaCliente,
  setIsOpenDialogCrearCliente,
  hideLabels = false,
  inputsToHide,
  inputsNoObligatorios = [],
  setIsOpenDialogCrearContacto,
  allowInputAddAction,
}) => {
  const centrosCostosSeleccionables = opciones.centrosCostos?.filter((cc) => cc.cod_empresa_cc === valores.empresa?.cod_empresa);

  const tiposServicioSeleccionables = [
    ...opciones.tiposServicio.filter((ts) => ts.cod_tipo_padre === valores.tipoTransporte?.cod_tipo && ts.cod_estado === CODS_ESTADOS.ACTIVO),
    { label: "TODOS", value: 0 },
  ];

  const tiposAplicacionSeleccionables = [...opciones.tiposAplicacion.filter((ta) => ta.cod_estado === CODS_ESTADOS.ACTIVO), { label: "TODOS", value: 0 }];

  const tiposCalculoSeleccionables = opciones.tiposCalculo?.filter((tc) => tc.cod_tipo_padre === valores.tipoTransporte?.cod_tipo && tc.cod_estado === CODS_ESTADOS.ACTIVO);

  const tiposCargaSelecionables = [...opciones.tiposCarga.filter((tc) => tc.cod_estado === CODS_ESTADOS.ACTIVO), { label: "TODOS", value: 0 }];

  const clasificacionesCarga = [...opciones.clasificacionesCarga.filter((cc) => cc.cod_estado === CODS_ESTADOS.ACTIVO), { label: "TODOS", value: 0 }];

  const tiposClasificacionSeleccionables = REL_TIPOS_CLASIFICACION_TARIFAS.filter((td) => td.cod_tipo_padre === valores.tipoTransporte?.cod_tipo);

  const puntosEnlaceOrigenSeleccionables = opciones.puntosEnlace.filter((pe) => pe.cod_pais === valores.paisOrigen?.cod_pais && pe.cod_tipo === valores.tipoPuntoEnlaceOrigen?.cod_tipo);

  const puntosEnlaceDestinoSeleccionables = opciones.puntosEnlace.filter((pe) => pe.cod_pais === valores.paisDestino?.cod_pais && pe.cod_tipo === valores.tipoPuntoEnlaceDestino?.cod_tipo);

  const tiposSeguimientoSeleccionables = opciones.tiposSeguimiento.filter((ts) => ts.cod_estado === CODS_ESTADOS.ACTIVO);

  const defaultFechaCotizacion = useMemo(() => new Date(), []);

  const inputs = [
    {
      tipo: "datetime",
      label: "Fecha",
      id: "cabezera_cotizacion_fecha",
      val: valores.cabezera_cotizacion_fecha ? new Date(valores.cabezera_cotizacion_fecha) : defaultFechaCotizacion,
      requerido: !inputsToHide?.includes("cabezera_cotizacion_fecha"),
      readonly: false,
      size: 4,
      grupoId: "datos",
    },
    {
      tipo: "select",
      label: "Empresa",
      id: "empresa",
      options: opciones.empresas,
      val: valores.empresa,
      requerido: !inputsToHide?.includes("empresa"),
      readonly: readonly || (isItCreating && defaultValues?.cod_empresa),
      visible: !inputsToHide?.includes("empresa"),
      size: 4,
      grupoId: "datos",
    },
    {
      tipo: "select",
      label: "Centro de Costo",
      id: "centroCosto",
      options: centrosCostosSeleccionables,
      val: valores.centroCosto,
      requerido: !inputsToHide?.includes("centroCosto"),
      readonly: readonly || !valores.empresa || (isItCreating && defaultValues?.cod_cc),
      visible: !inputsToHide?.includes("centroCosto"),
      size: 4,
      grupoId: "datos",
    },
    {
      tipo: "selectQuery",
      label: "Cliente",
      id: "cliente",
      options: [], // opciones.clientes,
      valueOption: "entidad_id",
      labelOption: "entidad_nombre",
      fetchOptions: async (searchTerm) => {
        return await api
          .get("api/appweb/busqueda-entidad-x-criterio", {
            params: {
              ref_busqueda: searchTerm,
              list_descripcion_tipo: [NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.PRE_CLIENTE], NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.CLIENTE]],
              tipo_busqueda: "NOMBRE",
            },
          })
          .then(({ data }) => {
            const convertKeysToLowerCase = (obj) => {
              if (Array.isArray(obj)) {
                return obj.map((v) => convertKeysToLowerCase(v));
              } else if (obj !== null && obj.constructor === Object) {
                return Object.keys(obj).reduce((acc, key) => {
                  acc[key.toLowerCase()] = convertKeysToLowerCase(obj[key]);
                  return acc;
                }, {});
              }
              return obj;
            };

            const eliminarDuplicadosById = (arr, id) => {
              return arr.filter((item, index) => arr.findIndex((i) => i[id] === item[id]) === index);
            };

            return eliminarDuplicadosById(convertKeysToLowerCase(data.data.data), "entidad_id");
          })
          .catch((e) => {
            console.error(e);
            return [];
          });
      },
      val: isLoadingInputCliente ? { label: "CARGANDO...", value: null } : valores.cliente,
      requerido: !(inputsNoObligatorios?.includes("cliente") || inputsToHide?.includes("cliente")),
      readonly: readonly || isLoadingInputCliente || (isItCreating && defaultValues?.entidad_id),
      visible: !inputsToHide?.includes("cliente"),
      actions: [
        {
          nombre: "Agregar",
          icono: "c-suma",
          onClick: () => setIsOpenDialogCrearCliente(true),
          visible: allowInputAddAction && !readonly,
        },
      ],
      grupoId: "datos",
    },
    {
      tipo: "select",
      label: "Contacto",
      id: "contacto",
      options: opciones.contactos,
      val: valores.contacto,
      requerido: !(inputsNoObligatorios?.includes("contacto") || inputsToHide?.includes("contacto")),
      readonly: readonly || !valores.cliente || (isItCreating && defaultValues?.entidadcontacto_id),
      visible: !inputsToHide?.includes("contacto"),
      actions: [
        {
          nombre: "Agregar",
          icono: "c-suma",
          onClick: () => setIsOpenDialogCrearContacto(true),
          visible: allowInputAddAction && !readonly,
        },
      ],
      grupoId: "datos",
    },
    {
      tipo: "select",
      label: "Tipo de Transporte",
      id: "tipoTransporte",
      options: opciones.tiposTransporte.filter((tt) => tt.cod_estado === CODS_ESTADOS.ACTIVO),
      val: valores.tipoTransporte,
      requerido: !(inputsNoObligatorios?.includes("tipoTransporte") || inputsToHide?.includes("tipoTransporte")),
      readonly: readonly || (isItCreating && defaultValues?.cod_tipo_transporte),
      visible: !inputsToHide?.includes("tipoTransporte"),
      size: 6,
      grupoId: "transporte",
    },
    {
      tipo: "select",
      label: "Tipo de Servicio",
      id: "tipoServicio",
      options: tiposServicioSeleccionables,
      val: valores.tipoServicio,
      requerido: !(inputsNoObligatorios?.includes("tipoServicio") || inputsToHide?.includes("tipoServicio")),
      readonly: readonly || !valores.tipoTransporte || (isItCreating && defaultValues?.cod_tipo_servicio),
      visible: !inputsToHide?.includes("tipoServicio"),
      size: 6,
      grupoId: "transporte",
    },
    {
      tipo: "select",
      label: "Tipo de Carga",
      id: "tipoCarga",
      options: tiposCargaSelecionables,
      val: valores.tipoCarga,
      requerido: false,
      readonly: readonly || (isItCreating && defaultValues?.cod_tipo_carga),
      visible: !inputsToHide?.includes("tipoCarga"),
      size: 6,
      grupoId: "carga",
    },
    {
      tipo: "select",
      label: "Clasificación de Carga",
      id: "clasificacionCarga",
      options: clasificacionesCarga,
      val: valores.clasificacionCarga,
      requerido: true,
      readonly: readonly || (isItCreating && defaultValues?.cod_clasificacion_carga),
      visible: !inputsToHide?.includes("clasificacionCarga"),
      size: 6,
      grupoId: "carga",
    },
    {
      tipo: "select",
      label: "Incoterm",
      id: "incoterm",
      options: opciones.incoterms,
      val: valores.incoterm,
      requerido: false,
      readonly: readonly || (isItCreating && defaultValues?.incoterm_id),
      visible: !inputsToHide?.includes("incoterm"),
      size: 6,
      grupoId: "terminos_comercio",
    },
    {
      tipo: "select",
      label: "Tipo de Pago",
      id: "tipoPago",
      options: opciones.tiposPago.filter((tp) => tp.cod_estado === CODS_ESTADOS.ACTIVO),
      val: valores.tipoPago,
      requerido: false,
      readonly: readonly || (isItCreating && defaultValues?.cod_tipo_pago) || valores.estado === CODS_ESTADOS.INACTIVO,
      visible: !inputsToHide?.includes("tipoPago"),
      size: 6,
      grupoId: "terminos_comercio",
    },
    {
      tipo: "select",
      label: "Pais de Origen",
      id: "paisOrigen",
      options: opciones.paises,
      val: valores.paisOrigen,
      requerido: true,
      readonly: false,
      visible: true,
      size: 6,
      grupoId: "origen",
    },
    {
      tipo: "select",
      label: "Tipo de Origen",
      id: "tipoPuntoEnlaceOrigen",
      options: opciones.tiposPuntoEnlace,
      val: valores.tipoPuntoEnlaceOrigen,
      requerido: false,
      readonly: !valores.paisOrigen,
      visible: true,
      size: 6,
      grupoId: "origen",
    },
    {
      tipo: "select",
      label: "Pais de Destino",
      id: "paisDestino",
      options: opciones.paises,
      val: valores.paisDestino,
      requerido: true,
      readonly: false,
      visible: true,
      size: 6,
      grupoId: "destino",
    },
    {
      tipo: "select",
      label: "Tipo de Destino",
      id: "tipoPuntoEnlaceDestino",
      options: opciones.tiposPuntoEnlace,
      val: valores.tipoPuntoEnlaceDestino,
      requerido: false,
      readonly: !valores.paisDestino,
      visible: true,
      size: 6,
      grupoId: "destino",
    },
    {
      tipo: "select",
      label: "Aduana/Puerto/Aeropuerto de Origen",
      id: "puntoEnlaceOrigen",
      options: puntosEnlaceOrigenSeleccionables,
      val: valores.puntoEnlaceOrigen,
      requerido: !!valores.tipoPuntoEnlaceOrigen,
      readonly: !valores.tipoPuntoEnlaceOrigen,
      visible: true,
      size: 12,
      grupoId: "origen",
    },
    {
      tipo: "select",
      label: "Aduana/Puerto/Aeropuerto de Destino",
      id: "puntoEnlaceDestino",
      options: puntosEnlaceDestinoSeleccionables,
      val: valores.puntoEnlaceDestino,
      requerido: !!valores.tipoPuntoEnlaceDestino,
      readonly: !valores.tipoPuntoEnlaceDestino,
      visible: true,
      size: 12,
      grupoId: "destino",
    },
  ];

  const grupos = [
    {
      id: "datos",
      size: 12,
      // direction: "row",
      label: "Datos",
      // dividerColor: "green.main_20",
      // color: "green.main",
      // bgcolor: "secondary.200_20",
      // bgcolor: "background.main_20",
      titleSize: "auto",
      // icono: "c-usuario",
      border: 0,
      // error: true,
      errorMessage: "test",
      mostrarTitulo: !hideLabels,
      tipo: "separador",
      variant: "h6",
      // width: 10,
    },
    {
      id: "transporte",
      size: 12,
      // direction: "row",
      label: "Transporte",
      // bgcolor: "pink.200_20",
      bgcolor: "background.main_20",
      titleSize: "auto",
      border: 0,
      // error: true,
      tipo: "separador",
      mostrarTitulo: !hideLabels,
      errorMessage: "test",
    },
    {
      id: "carga",
      size: 6,
      // direction: "row",
      bgcolor: "background.main_20",
      label: "Carga",
      // bgcolor: "purple.200_20",
      titleSize: "auto",
      border: 0,
      mostrarTitulo: !hideLabels,
      tipo: "separador",
    },
    {
      id: "terminos_comercio",
      size: 6,
      // direction: "row",
      bgcolor: "background.main_20",
      label: "Terminos de Comercio",
      titleSize: "auto",
      border: 0,
      mostrarTitulo: !hideLabels,
      tipo: "separador",
    },
    {
      id: "origen",
      size: 6,
      // direction: "row",
      bgcolor: "background.main_20",
      label: "Origen",
      titleSize: "auto",
      border: 0,
      mostrarTitulo: !hideLabels,
      tipo: "separador",
    },
    {
      id: "destino",
      size: 6,
      // direction: "row",
      bgcolor: "background.main_20",
      label: "Destino",
      titleSize: "auto",
      border: 0,
      mostrarTitulo: !hideLabels,
      tipo: "separador",
    },
  ];
  return { inputs, grupos };
};

export default useInputsFormularioCotizacion;
