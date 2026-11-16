import { CODS_ESTADOS } from "../../../../../../constants/estados";
import { REL_TIPOS_CLASIFICACION_TARIFAS } from "../../../../../../constants/clasifacionesTarifas";
import { useCallback } from "react";
import { api } from "../../../../../../api";
import CODS_TIPOS_ENTIDAD, { NOMBRES_TIPOS_ENTIDAD } from "../../../../../../constants/tiposEntidades";


const keysToLowerCase = (obj) => {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => keysToLowerCase(item));
  }
  return Object.keys(obj).reduce((acc, key) => {
    const lowerCaseKey = key.toLowerCase();
    acc[lowerCaseKey] = keysToLowerCase(obj[key]);
    return acc;
  }, {});
};

const useInputsTarifa = ({
  valores,
  isLoadingInputProveedor,
  isItCreating,
  opciones,
  defaultValues,
  readonly,
  setIsOpenDialogBusquedaProveedor,
  setIsOpenDialogCrearProveedor,
  hideLabels = false,
  inputsToHide,
  inputsNoObligatorios = [],
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


  const fetchOptionsClientes = useCallback(async (searchTerm = "") => {
    return await api
      .get("api/appweb/busqueda-entidad-x-criterio", {
        params: {
          ref_busqueda: searchTerm,
          list_descripcion_tipo: [NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.PRE_PROVEEDOR], NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.PROVEEDOR]],
          tipo_busqueda: "NOMBRE",
        },
      })
      .then(({ data }) => {
        const eliminarDuplicadosById = (arr, id) => {
          return arr.filter((item, index) => arr.findIndex((i) => i[id] === item[id]) === index);
        };

        return eliminarDuplicadosById(keysToLowerCase(data.data.data), "entidad_id").map((i) => ({ ...i, label: `${i.entidad_nombre}`, value: i.entidad_id }));
      })
      .catch((e) => {
        console.error(e);
        return [];
      });
  }, []);

  const inputs = [
    {
      tipo: "titulo",
      val: "Rubro",
      variant: "h6",
      id: '1',
      visible: !hideLabels && !inputsToHide?.includes("rubro"),
    },
    {
      tipo: "select",
      label: "Rubro",
      id: "rubro",
      options: opciones.rubros.filter((r) => r.cod_estado === CODS_ESTADOS.ACTIVO),
      val: valores.rubro,
      requerido: !(inputsNoObligatorios?.includes("rubro") || inputsToHide?.includes("rubro")),
      readonly: readonly || (isItCreating && defaultValues?.cod_rubro),
      visible: !inputsToHide?.includes("rubro"),
    },
    {
      tipo: "titulo",
      val: "Servicio",
      id: '2',
      variant: "h6",
      visible: !hideLabels,
    },
    {
      tipo: "text",
      label: "Nombre de Servicio",
      id: "nombre",
      val: valores.nombre,
      requerido: !inputsToHide?.includes("nombre"),
      visible: !inputsToHide?.includes("nombre"),
      readonly,
    },
    {
      tipo: "text",
      label: "Siglas de Servicio",
      id: "siglas",
      val: valores.siglas,
      requerido: !inputsToHide?.includes("siglas"),
      visible: !inputsToHide?.includes("siglas"),
      readonly,
    },
    {

      label: "Proveedor",
      id: "proveedor",
      tipo: "select",
      options: [],
      fetchOptions: fetchOptionsClientes,
      readonly: !(inputsNoObligatorios?.includes("proveedor") || inputsToHide?.includes("proveedor")),
      requerido: !(inputsNoObligatorios?.includes("proveedor") || inputsToHide?.includes("proveedor")),
      visible: !inputsToHide?.includes("proveedor"),
      val: valores.proveedor,

      // tipo: "modalselect",
      // label: "Proveedor",
      // id: "proveedor",
      // val: isLoadingInputProveedor ? { label: "CARGANDO...", value: null } : valores.proveedor,
      // requerido: !(inputsNoObligatorios?.includes("proveedor") || inputsToHide?.includes("proveedor")),
      // readonly: readonly || isLoadingInputProveedor || (isItCreating && defaultValues?.entidad_id),
      // onBuscar: () => setIsOpenDialogBusquedaProveedor(true),
      // onCrear: () => setIsOpenDialogCrearProveedor(true),
      // visible: !inputsToHide?.includes("proveedor"),
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
    },
    // {
    //     tipo: 'toggle',
    //     label: 'Es Interno',
    //     id: 'servicio_interno',
    //     val: valores.servicio_interno,
    //     readonly: readonly || (isItCreating && defaultValues?.servicio_interno),
    //     visible: !inputsToHide?.includes('servicio_interno')
    // },
    {
      tipo: "titulo",
      id: '3',
      val: "Transporte",
      variant: "h6",
      visible: !hideLabels,
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
    },
    {
      tipo: "select",
      label: "Tipo de Aplicación",
      id: "tipoAplicacion",
      options: tiposAplicacionSeleccionables,
      val: valores.tipoAplicacion,
      requerido: !(inputsNoObligatorios?.includes("tipoAplicacion") || inputsToHide?.includes("tipoAplicacion")),
      readonly: readonly || !valores.tipoServicio,
      visible: !inputsToHide?.includes("tipoAplicacion"),
    },
    {
      tipo: "select",
      label: "Tipo de Calculo",
      id: "tipoCalculo",
      options: tiposCalculoSeleccionables,
      val: valores.tipoCalculo,
      requerido: !(inputsNoObligatorios?.includes("tipoCalculo") || inputsToHide?.includes("tipoCalculo")),
      readonly: readonly || !valores.tipoTransporte,
      visible: !inputsToHide?.includes("tipoCalculo"),
    },
    {
      tipo: "select",
      label: "Clasificación",
      id: "tipoClasificacion",
      options: tiposClasificacionSeleccionables,
      val: valores.tipoClasificacion,
      requerido: !inputsToHide?.includes("tipoClasificacion"),
      readonly: readonly || !valores.tipoTransporte || (isItCreating && defaultValues?.tipoClasificacion),
      visible: !inputsToHide?.includes("tipoClasificacion"),
    },
    {
      tipo: "select",
      label: "Categoria de Transporte",
      id: "categoriaTransporte",
      options: opciones.categoriasTransporte,
      val: valores.categoriaTransporte,
      requerido: false, // !inputsToHide?.includes("categoriaTransporte"),
      readonly: readonly || (!isItCreating && defaultValues?.categoriaTransporte),
      visible: !inputsToHide?.includes("categoriaTransporte"),
    },
    {
      tipo: "titulo",
      id: '4',
      val: "Carga",
      variant: "h6",
      visible: !hideLabels,
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
    },
    {
      tipo: "select",
      label: "Clasificación de Carga",
      id: "clasificacionCarga",
      options: clasificacionesCarga,
      val: valores.clasificacionCarga,
      requerido: false,
      readonly: readonly || (isItCreating && defaultValues?.cod_clasificacion_carga),
      visible: !inputsToHide?.includes("clasificacionCarga"),
    },
    {
      tipo: "titulo",
      id: '5',
      val: "Terminos de Comercio",
      variant: "h6",
      visible: !hideLabels,
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
    },
  ];

  return inputs;
};

export default useInputsTarifa;
