import { useState, useEffect, useCallback, useImperativeHandle, forwardRef, useMemo, useRef } from "react";
import { Grid } from "@mui/material";
import PropTypes from "prop-types";
import { api } from "../../../../../api";
import FormularioComponent from "../../../../../components/Formulario/FormularioComponent";
import DialogComponent from "../../../../../components/Dialog/DialogComponent";
import { FiltroEntidad } from "../../../../../views/Entidad/FiltroEntidad";
import TablaEntidadActividad from "../../../../../views/Actividades/TablaEntidadActividad";
import FormularioCompletoEntidad from "../../../../../views/Entidad/FormularioCompletoEntidad";
import useObtenerOpcionesAcciones from "../../../../../hooks/useObtenerOpcionesAcciones";
import useInputsTarifa from "./hooks/useInputsTarifa";
import useCatalogosTarifas from "../../../../../hooks/Tarifas/useCatalogosTarifas";
import { encenderCarga, apagarCarga } from "../../../../../store/slices/status/statusSlice";
import { useDispatch, useSelector } from "react-redux";
import { CODS_ESTADOS } from "../../../../../constants/estados";
import { REL_TIPOS_CLASIFICACION_TARIFAS } from "../../../../../constants/clasifacionesTarifas";

const CODS_TIPOS_ENTIDAD = {
  PRE_PROVEEDOR: 15,
};

const selectsConValoresLimpios = {
  empresa: null,
  centroCosto: null,
  rubro: null,
  tipoServicio: null,
  tipoTransporte: null,
  tipoAplicacion: null,
  tipoCalculo: null,
  tipoClasificacion: null,
  tipoCarga: null,
  clasificacionCarga: null,
  incoterm: null,
  tipoPago: null,
};

const formatTarifaToApiSubmissionFormat = (tarifa) => {
  const tarifaConFormato = {
    ...tarifa,
  };

  delete tarifaConFormato.empresa;
  delete tarifaConFormato.centroCosto;
  delete tarifaConFormato.rubro;
  delete tarifaConFormato.tipoServicio;
  delete tarifaConFormato.tipoTransporte;
  delete tarifaConFormato.proveedor;
  delete tarifaConFormato.tipoAplicacion;
  delete tarifaConFormato.tipoCalculo;
  delete tarifaConFormato.tipoCarga;
  delete tarifaConFormato.clasificacionCarga;
  delete tarifaConFormato.incoterm;
  delete tarifaConFormato.tipoPago;
  return tarifaConFormato;
};

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

const FormularioTarifa = (
  {
    hideLabels = false,
    usarAccionesPrestablecidas = true,
    defaultValues,
    isItCreating = true,
    readonly = false,
    submitButtonLabel = "Enviar",
    onSubmit = () => { },
    onTarifaCreada = () => { },
    onTarifaEditada = () => { },
    inputsToHide = [],
    inputsNoObligatorios = [],
    catalogos = {},
  },
  ref,
) => {
  const dispatch = useDispatch();
  const { permisosArray } = useObtenerOpcionesAcciones();
  const { currentEmpresa, currentCentroCosto } = useSelector((state) => state.menu);
  const {
    isLoading: isLoadingCatalogosTarifas,
    empresas = [],
    centrosCostos = [],
    rubros = [],
    tiposServicio = [],
    tiposTransporte = [],
    proveedores = [],
    tiposAplicacion = [],
    tiposCalculo = [],
    estados = [],
    tiposCarga = [],
    clasificacionesCarga = [],
    tiposPago = [],
    categoriasTransporte = [],
    incoterms = [],
  } = useCatalogosTarifas(catalogos);

  const formularioRef = useRef(null);
  const [isOpenDialogBusquedaProveedor, setIsOpenDialogBusquedaProveedor] = useState(false);
  const [isOponDialogCrearProveedor, setIsOpenDialogCrearProveedor] = useState(false);

  const [isLoadingFormSubmission, setIsLoadingFormSubmission] = useState(false);
  const [isLoadingInputProveedor, setIsLoadingInputProveedor] = useState(false);
  const isLoadingForm = isLoadingFormSubmission || isLoadingInputProveedor;

  const [opcionesProveedores, setOpcionesProveedores] = useState([]);
  const [catalogosProveedor, setCatalogosProveedor] = useState({
    estados: [],
    tipos: [],
    paises: [],
    ciudades: [],
    industrias: [],
    monedas: [],
  });

  const obtenerEstados = useCallback(async () => await api.get("api/appweb/listaestados").then(({ data }) => setCatalogosProveedor((v) => ({ ...v, estados: data.data }))), []);
  const obtenerTipos = useCallback(async () => await api.get("api/appweb/lista-tipo").then(({ data }) => setCatalogosProveedor((v) => ({ ...v, tipos: data.data }))), []);
  const obtenerPaises = useCallback(async () => await api.get("api/appweb/listapaises").then(({ data }) => setCatalogosProveedor((v) => ({ ...v, paises: data.data }))), []);
  const obtenerCiudades = useCallback(async () => await api.get("api/appweb/lista-ciudad").then(({ data }) => setCatalogosProveedor((v) => ({ ...v, ciudades: data.data }))), []);
  const obtenerIndustrias = useCallback(async () => await api.get("api/appweb/lista-industria").then(({ data }) => setCatalogosProveedor((v) => ({ ...v, industrias: data.data }))), []);
  const obtenerMonedas = useCallback(async () => await api.get("api/appweb/lista-moneda").then(({ data }) => setCatalogosProveedor((v) => ({ ...v, monedas: data.data }))), []);
  const obtenerEmpresas = useCallback(async () => await api.get("api/appweb/listaempresas").then(({ data }) => setCatalogosProveedor((v) => ({ ...v, empresas: data.data }))), []);

  useEffect(() => {
    const fetchData = async () => {
      dispatch(encenderCarga());
      try {
        await Promise.all([obtenerEstados(), obtenerTipos(), obtenerPaises(), obtenerCiudades(), obtenerIndustrias(), obtenerMonedas(), obtenerEmpresas()]);
      } catch (error) {
        console.error("Error al obtener datos:", error);
      } finally {
        dispatch(apagarCarga());
      }
    };

    fetchData();
  }, [dispatch, obtenerEstados, obtenerTipos, obtenerPaises, obtenerCiudades, obtenerIndustrias, obtenerMonedas, obtenerEmpresas]);

  const opcion = permisosArray.find(
    (o) =>
      (o.nom_opcion === "Servicios" && o.nivel_opcion === "E") ||
      (o.nom_opcion === "Tarifas" && o.nivel_opcion === "I") ||
      (o.nom_opcion === "Calcular" && o.nivel_opcion === "E") ||
      (o.nom_opcion === "Información" && o.nivel_opcion === "E") ||
      (o.nom_opcion === "Información" && o.nivel_opcion === "I"),
  );
  const puedeEditar = opcion?.acciones?.some((a) => a.nom_accion === "Editar") && (isItCreating || !readonly);

  const valoresIniciales = useMemo(() => {
    const empresa = { ...currentEmpresa };
    delete empresa.centrosCosto;
    const centroCosto = { ...currentCentroCosto };
    delete centroCosto.modulos;
    return {
      nombre: "",
      siglas: "",
      servicio_interno: false,
      ...selectsConValoresLimpios,
      cod_empresa: currentEmpresa?.cod_empresa || null,
      empresa,
      cod_cc: currentCentroCosto?.cod_cc || null,
      centroCosto,
    };
  }, [currentEmpresa, currentCentroCosto]);

  const [valores, setValores] = useState(valoresIniciales);

  useEffect(() => {
    if (defaultValues) {
      setValores((prev) => ({
        nombre: "",
        siglas: "",
        ...defaultValues,
        ...selectsConValoresLimpios,
        proveedor: defaultValues.entidad_id === prev.entidad_id ? prev.proveedor : null,
      }));
    } else {
      setValores(valoresIniciales);
    }
  }, [defaultValues, currentEmpresa, valoresIniciales]);

  const valoresConFormatoDeFormulario = {
    ...valores,
    empresa: empresas.find((e) => e.cod_empresa === valores.cod_empresa),
    centroCosto: centrosCostos.find((c) => c.cod_cc === valores.cod_cc),
    rubro: rubros.find((r) => r.cod_rubro === valores.cod_rubro),
    tipoServicio: valores.tipoServicio?.value === 0 || !valores.cod_tipo_servicio ? { label: "TODOS", value: 0 } : tiposServicio.find((t) => t.cod_tipo === valores.cod_tipo_servicio),
    tipoTransporte: tiposTransporte.find((t) => t.cod_tipo === valores.cod_tipo_transporte),
    tipoAplicacion: valores.tipoAplicacion?.value === 0 || !valores.cod_tipo_aplicacion ? { label: "TODOS", value: 0 } : tiposAplicacion.find((t) => t.cod_tipo === valores.cod_tipo_aplicacion),
    tipoCalculo: tiposCalculo.find((t) => t.cod_tipo === valores.cod_tipo_calculo),
    tipoClasificacion: REL_TIPOS_CLASIFICACION_TARIFAS.find((t) => t.value === valores.clasificacion),
    tipoCarga: valores.tipoCarga?.value === 0 || !valores.cod_tipo_carga ? { label: "TODOS", value: 0 } : tiposCarga.find((t) => t.cod_tipo === valores.cod_tipo_carga),
    clasificacionCarga:
      valores.clasificacionCarga?.value === 0 || !valores.cod_clasificacion_carga ? { label: "TODOS", value: 0 } : clasificacionesCarga.find((t) => t.cod_tipo === valores.cod_clasificacion_carga),
    incoterm: incoterms.find((i) => i.incoterm_id === valores.incoterm_id),
    tipoPago: !valores.cod_tipo_pago ? tiposPago.find((t) => t.label === "PREPAID / COLLECT") : tiposPago.find((t) => t.cod_tipo === valores.cod_tipo_pago),
    proveedor: valores.proveedor || defaultValues?.proveedor,
    categoriaTransporte: categoriasTransporte.find((c) => c.value === valores.categoria_transporte),
  };

  useEffect(() => {
    if (!valores.entidad_id) return setValores((prev) => ({ ...prev, proveedor: null }));
    const obtenerProveedor = async () => {
      setIsLoadingInputProveedor(true);
      const baseApiURL = "/api/appweb/lista-entidad-simplificada";
      const [respProveedores, respPreProveedores] = await Promise.all([
        api.get(baseApiURL, { params: { entidad_id: valores.entidad_id, tipo_entidad: "PROVEEDOR" } }),
        api.get(baseApiURL, { params: { entidad_id: valores.entidad_id, tipo_entidad: "PRE-PROVEEDOR" } }),
      ]);
      let proveedor = respProveedores.data.data.data.find((i) => i.ENTIDAD_ID === valores.entidad_id);
      if (!proveedor) proveedor = respProveedores.data.data.data.find((i) => i.ENTIDAD_ID === valores.entidad_id);

      proveedor.label = `${proveedor.CODIGO_ENTIDAD} - ${proveedor.ENTIDAD_NOMBRE}`;
      proveedor.value = +proveedor.ENTIDAD_ID;

      setValores((prev) => ({
        ...prev,
        proveedor,
      }));
      setIsLoadingInputProveedor(false);
    };
    obtenerProveedor();
  }, [valores.entidad_id]);

  const obtenerPorveedorSeleccionado = (proveedor) => {
    setIsOpenDialogBusquedaProveedor(false);
    setOpcionesProveedores([]);
    const data_lc = keysToLowerCase(proveedor);
    setValores((prev) => ({
      ...prev,
      entidad_id: +data_lc.entidad_id,
      proveedor: {
        ...data_lc,
        value: +data_lc.entidad_id,
        label: `${data_lc.codigo_entidad} - ${data_lc.entidad_nombre}`,
      },
    }));
  };

  const handleProveedorCreado = async (optionProveedor) => {
    const baseApiURL = "api/appweb/recuperar-datos-entidad";
    const response = await api.post(baseApiURL, { cod_tipo: optionProveedor.cod_tipo, entidad_id: optionProveedor.entidad_id });
    let [proveedor] = response.data.data.data_entidad;
    proveedor = keysToLowerCase(proveedor);
    setIsOpenDialogCrearProveedor(false);
    setValores((prev) => ({
      ...prev,
      proveedor: {
        ...proveedor,
        value: +proveedor.entidad_id,
        label: `${proveedor.codigo_entidad} - ${proveedor.entidad_nombre}`,
      },
    }));
  };

  const handleOpenCreacionProveedor = () => {
    setIsOpenDialogCrearProveedor(true);
    setIsOpenDialogBusquedaProveedor(false);
  };

  const handleInputChange = ({ id, val }) => {
    setValores((prev) => {
      const nuevoValor = { ...prev, [id]: val };

      switch (id) {
        case "rubro":
          nuevoValor.cod_rubro = val?.value;
          if (!val) nuevoValor.rubro = nuevoValor.cod_rubro = null;
          break;
        case "proveedor":
          nuevoValor.entidad_id = val?.value;
          if (!val) nuevoValor.proveedor = nuevoValor.entidad_id = null;
          break;
        case "empresa":
          nuevoValor.cod_empresa = val?.value;
          if (!val) nuevoValor.empresa = nuevoValor.cod_empresa = null;
          nuevoValor.centroCosto = nuevoValor.cod_cc = null;
          break;
        case "centroCosto":
          nuevoValor.cod_cc = val?.value;
          if (!val) nuevoValor.centroCosto = nuevoValor.cod_cc = null;
          break;
        case "tipoTransporte":
          nuevoValor.cod_tipo_transporte = val?.value;
          if (!val) nuevoValor.tipoTransporte = nuevoValor.cod_tipo_transporte = null;
          nuevoValor.tipoServicio = nuevoValor.cod_tipo_servicio = null;
          nuevoValor.tipoCalculo = nuevoValor.cod_tipo_calculo = null;
          nuevoValor.tipoClasificacion = nuevoValor.clasificacion = null;
          break;
        case "tipoServicio":
          nuevoValor.cod_tipo_servicio = val?.value;
          if (!val) nuevoValor.tipoServicio = nuevoValor.cod_tipo_servicio = null;
          nuevoValor.tipoAplicacion = nuevoValor.cod_tipo_aplicacion = null;
          break;
        case "tipoAplicacion":
          nuevoValor.cod_tipo_aplicacion = val?.value;
          if (!val) nuevoValor.tipoAplicacion = nuevoValor.cod_tipo_aplicacion = null;
          break;
        case "tipoCalculo":
          nuevoValor.cod_tipo_calculo = val?.value;
          if (!val) nuevoValor.tipoCalculo = nuevoValor.cod_tipo_calculo = null;
          break;
        case "tipoClasificacion":
          nuevoValor.clasificacion = val?.value;
          if (!val) nuevoValor.tipoClasificacion = nuevoValor.clasificacion = null;
          break;
        case "tipoCarga":
          nuevoValor.cod_tipo_carga = val?.value;
          if (!val) nuevoValor.tipoCarga = nuevoValor.cod_tipo_carga = null;
          break;
        case "clasificacionCarga":
          nuevoValor.cod_clasificacion_carga = val?.value;
          if (!val) nuevoValor.clasificacionCarga = nuevoValor.cod_clasificacion_carga = null;
          break;
        case "incoterm":
          nuevoValor.incoterm_id = val?.value;
          if (!val) nuevoValor.incoterm = nuevoValor.incoterm_id = null;
          break;
        case "tipoPago":
          nuevoValor.cod_tipo_pago = val?.value;
          if (!val) nuevoValor.tipoPago = nuevoValor.cod_tipo_pago = null;
          break;
        case "categoriaTransporte":
          nuevoValor.categoria_transporte = val?.value;
          if (!val) nuevoValor.categoriaTransporte = nuevoValor.cod_tipo_pago = null;
          break;
      }

      return nuevoValor;
    });
  };

  const handleSubmit = async () => {
    const valoresToSubmit = { ...valores };
    if (valoresToSubmit.tipoServicio?.value === 0) {
      valoresToSubmit.cod_tipo_servicio = null;
    }

    if (valoresToSubmit.tipoAplicacion?.value === 0) {
      valoresToSubmit.cod_tipo_aplicacion = null;
    }

    if (valoresToSubmit.tipoCarga?.value === 0) {
      valoresToSubmit.cod_tipo_carga = null;
    }

    if (valoresToSubmit.clasificacionCarga?.value === 0) {
      valoresToSubmit.cod_clasificacion_carga = null;
    }

    if (!usarAccionesPrestablecidas) return onSubmit(valoresToSubmit);

    try {
      setIsLoadingFormSubmission(true);
      let baseApiURL = isItCreating ? "/api/appweb/insertar-servicio" : "/api/appweb/actualizar-servicio";
      const reqBody = formatTarifaToApiSubmissionFormat(valoresToSubmit);
      reqBody.cod_estado = CODS_ESTADOS.ACTIVO;
      let response = await api.post(baseApiURL, reqBody);
      if (!response.data.data.success) return;
      const cod_servicio = +response.data.data.cod_servicio;

      baseApiURL = "/api/appweb/lista-servicios";
      response = await api.get(baseApiURL);
      const servicioCreado = response.data.data.find((s) => s.cod_servicio === cod_servicio);
      if (isItCreating) {
        onTarifaCreada(servicioCreado);
      } else {
        onTarifaEditada(servicioCreado);
      }
    } catch (error) {
      console.error("Error al manejar envio de formulario:", error);
    } finally {
      setIsLoadingFormSubmission(false);
    }
  };

  useImperativeHandle(ref, () => ({
    validar: formularioRef.current?.validar,
    submit: handleSubmit,
  }));

  const opcionesInputs = useMemo(() => {
    return {
      empresas,
      centrosCostos,
      rubros,
      tiposServicio,
      tiposTransporte,
      proveedores,
      incoterms,
      tiposAplicacion,
      tiposCalculo,
      tiposCarga,
      clasificacionesCarga,
      tiposPago,
      estados,
      categoriasTransporte,
    };
  }, [
    centrosCostos,
    clasificacionesCarga,
    empresas,
    estados,
    incoterms,
    proveedores,
    rubros,
    tiposAplicacion,
    tiposCalculo,
    tiposCarga,
    tiposPago,
    tiposServicio,
    tiposTransporte,
    categoriasTransporte,
  ]);

  const inputsTarifa = useInputsTarifa({
    valores: valoresConFormatoDeFormulario,
    isLoadingInputProveedor,
    isItCreating,
    opciones: opcionesInputs,
    defaultValues,
    readonly: !puedeEditar,
    setIsOpenDialogBusquedaProveedor,
    setIsOpenDialogCrearProveedor,
    hideLabels,
    inputsToHide,
    inputsNoObligatorios,
  });

  return (
    <>
      <FormularioComponent
        ref={formularioRef}
        titulo="Tarifa"
        inputs={inputsTarifa}
        onInput={handleInputChange}
        botones={
          usarAccionesPrestablecidas
            ? {
              agregar: { visible: isItCreating, readonly: isLoadingForm, onClick: handleSubmit },
              editar: { visible: !isItCreating && !readonly, readonly: isLoadingForm, onClick: handleSubmit },
            }
            : {
              agregar: { visible: false },
              editar: { visible: false },
            }
        }
        isLoading={isLoadingCatalogosTarifas}
      />

      <Grid sx={{ width: "100%", height: "100%" }}>
        <DialogComponent
          titlo="Buscar Proveedor"
          openDialog={isOpenDialogBusquedaProveedor}
          handleClose={() => {
            setIsOpenDialogBusquedaProveedor(false);
            setOpcionesProveedores([]);
          }}
          width="80vw"
          height="85vh"
        >
          <FiltroEntidad
            tiposEntidad={["PRE-PROVEEDOR", "PROVEEDOR"]}
            tiposBusqueda={[
              { label: "CODIGO", value: 1 },
              { label: "NIT", value: 2 },
              { label: "NOMBRE", value: 3 },
            ]}
            setResults={setOpcionesProveedores}
            useCache={false}
            listaTipos={catalogosProveedor.tipos}
            tipoDefaultIndex={3}
          />

          <TablaEntidadActividad lista={opcionesProveedores} reConsultar={null} obtenerFilaSeleccionada={obtenerPorveedorSeleccionado} handleNuevo={handleOpenCreacionProveedor} />
        </DialogComponent>

        <DialogComponent titulo="Crear Proveedor" openDialog={isOponDialogCrearProveedor} handleClose={() => setIsOpenDialogCrearProveedor(false)} width="80vw" height="85vh">
          <FormularioCompletoEntidad id="new" tipo={CODS_TIPOS_ENTIDAD.PRE_PROVEEDOR} cliente={{}} catalogos={catalogosProveedor} onCreate={handleProveedorCreado} />
        </DialogComponent>
      </Grid>
    </>
  );
};

const ForwardedFormularioTarifa = forwardRef(FormularioTarifa);

FormularioTarifa.propTypes = {
  hideLabels: PropTypes.bool,
  usarAccionesPrestablecidas: PropTypes.bool,
  tieneRangosPrestablecidos: PropTypes.bool,
  catalogos: PropTypes.object,
  defaultValues: PropTypes.object,
  isItCreating: PropTypes.bool,
  submitButtonLabel: PropTypes.string,
  onSubmit: PropTypes.func,
  onTarifaCreada: PropTypes.func,
  onTarifaEditada: PropTypes.func,
  readonly: PropTypes.bool,
  inputsToHide: PropTypes.arrayOf(PropTypes.string),
  inputsNoObligatorios: PropTypes.arrayOf(PropTypes.string),
};

export default ForwardedFormularioTarifa;
