import { useState, useEffect, useCallback, useImperativeHandle, forwardRef, useMemo, useRef } from "react";
import { Box, Grid } from "@mui/material";
import PropTypes from "prop-types";
import { api } from "../../../../api";
import FormularioComponent from "../../../../components/Formulario/FormularioComponent";
import DialogComponent from "../../../../components/Dialog/DialogComponent";
import { FiltroEntidad } from "../../../Entidad/FiltroEntidad";
import TablaEntidadActividad from "../../../Actividades/TablaEntidadActividad";
import FormularioCompletoEntidad from "../../../Entidad/FormularioCompletoEntidad";
import CrearEntidadContactoDialog from "./components/CrearEntidadContactoDialog";
import useObtenerOpcionesAcciones from "../../../../hooks/useObtenerOpcionesAcciones";
import useCatalogosCotizacion from "./hooks/useCatalogosCotizacion";
import useInputsFormularioCotizacion from "./hooks/useInputsFormularioCotizacion";
import { useFetchAllEntidades } from "../../../../hooks/Fetch/useFetchEntidades";
import { useDispatch, useSelector } from "react-redux";
import { encenderCarga, apagarCarga } from "../../../../store/slices/status/statusSlice";
import { CODS_ESTADOS } from "../../../../constants/estados";
import { REL_TIPOS_CLASIFICACION_TARIFAS } from "../../../../constants/clasifacionesTarifas";
import { NOMBRES_TIPOS_ENTIDAD, CODS_TIPOS_ENTIDAD } from "../../../../constants/tiposEntidades";

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
  paisOrigen: null,
  tipoPuntoEnlaceOrigen: null,
  puntoEnlaceOrigen: null,
  paisDestino: null,
  tipoPuntoEnlaceDestino: null,
  puntoEnlaceDestino: null,
};

const formatCotizacionToApiSubmissionFormat = (cotizacion) => {
  const cotizacionConFormato = {
    ...cotizacion,
  };

  delete cotizacionConFormato.empresa;
  delete cotizacionConFormato.centroCosto;
  delete cotizacionConFormato.rubro;
  delete cotizacionConFormato.tipoServicio;
  delete cotizacionConFormato.tipoTransporte;
  delete cotizacionConFormato.tipoAplicacion;
  delete cotizacionConFormato.tipoCalculo;
  delete cotizacionConFormato.tipoCarga;
  delete cotizacionConFormato.clasificacionCarga;
  delete cotizacionConFormato.incoterm;
  delete cotizacionConFormato.tipoPago;
  delete cotizacionConFormato.paisOrigen;
  delete cotizacionConFormato.tipoPuntoEnlaceOrigen;
  delete cotizacionConFormato.puntoEnlaceOrigen;
  delete cotizacionConFormato.paisDestino;
  delete cotizacionConFormato.tipoPuntoEnlaceDestino;
  delete cotizacionConFormato.puntoEnlaceDestino;
  return cotizacionConFormato;
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

const FormularioCotizacion = (
  {
    hideLabels = false,
    usarAccionesPrestablecidas = true,
    defaultValues,
    isItCreating = true,
    readonly = false,
    submitButtonLabel = "Enviar",
    onSubmit = () => {},
    onCotizacionCreada = () => {},
    onCotizacionEditada = () => {},
    inputsToHide = [],
    inputsNoObligatorios = [],
    catalogos = {},
  },
  ref
) => {
  const dispatch = useDispatch();
  const { permisosArray } = useObtenerOpcionesAcciones();
  const { currentEmpresa, currentCentroCosto } = useSelector((state) => state.menu);
  const {
    isLoading: isLoadingCatalogosCotizacions,
    empresas = [],
    centrosCostos = [],
    rubros = [],
    proveedores = [],
    clientes = [],
    tiposServicio = [],
    tiposTransporte = [],
    tiposAplicacion = [],
    tiposCalculo = [],
    estados = [],
    tiposCarga = [],
    clasificacionesCarga = [],
    tiposPago = [],
    incoterms = [],
    paises = [],
    tiposPuntoEnlace = [],
    puntosEnlace = [],
    monedas = [],
    carriers = [],
    tiposSeguimiento = [],
    setCatalogos,
  } = useCatalogosCotizacion(catalogos);

  const [contactos, setContactos] = useState([]);

  const formularioRef = useRef(null);
  const [isOpenDialogBusquedaCliente, setIsOpenDialogBusquedaCliente] = useState(false);
  const [isOpenDialogCrearCliente, setIsOpenDialogCrearCliente] = useState(false);
  const [isOpenDialogCrearContacto, setIsOpenDialogCrearContacto] = useState(false);

  const [isLoadingFormSubmission, setIsLoadingFormSubmission] = useState(false);
  const [isLoadingInputCliente, setIsLoadingInputCliente] = useState(false);
  const isLoadingForm = isLoadingFormSubmission || isLoadingInputCliente;

  const [opcionesClientes, setOpcionesClientes] = useState([]);
  const [catalogosEntidad, setcatalogosEntidad] = useState({
    estados: [],
    tipos: [],
    paises: [],
    ciudades: [],
    industrias: [],
    monedas: [],
  });

  const obtenerEstados = useCallback(async () => await api.get("api/appweb/listaestados").then(({ data }) => setcatalogosEntidad((v) => ({ ...v, estados: data.data }))), []);
  const obtenerTipos = useCallback(async () => await api.get("api/appweb/lista-tipo").then(({ data }) => setcatalogosEntidad((v) => ({ ...v, tipos: data.data }))), []);
  const obtenerPaises = useCallback(async () => await api.get("api/appweb/listapaises").then(({ data }) => setcatalogosEntidad((v) => ({ ...v, paises: data.data }))), []);
  const obtenerCiudades = useCallback(async () => await api.get("api/appweb/lista-ciudad").then(({ data }) => setcatalogosEntidad((v) => ({ ...v, ciudades: data.data }))), []);
  const obtenerIndustrias = useCallback(async () => await api.get("api/appweb/lista-industria").then(({ data }) => setcatalogosEntidad((v) => ({ ...v, industrias: data.data }))), []);
  const obtenerMonedas = useCallback(async () => await api.get("api/appweb/lista-moneda").then(({ data }) => setcatalogosEntidad((v) => ({ ...v, monedas: data.data }))), []);
  const obtenerEmpresas = useCallback(async () => await api.get("api/appweb/listaempresas").then(({ data }) => setcatalogosEntidad((v) => ({ ...v, empresas: data.data }))), []);

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

  const opcion = permisosArray.find((o) => o.nom_opcion === "Información" && o.nivel_opcion === "I");
  const puedeEditar = opcion?.acciones?.some((a) => a.nom_accion === "Editar") && (isItCreating || !readonly);

  const valoresIniciales = useMemo(() => {
    const empresa = { ...currentEmpresa };
    delete empresa.centrosCosto;
    const centroCosto = { ...currentCentroCosto };
    delete centroCosto.modulos;
    return {
      nombre: "",
      siglas: "",
      numeroCotizacion: null,
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
        cliente: defaultValues.entidad_id === prev.entidad_id ? prev.cliente : null,
      }));
    } else {
      setValores(valoresIniciales);
    }
  }, [defaultValues, currentEmpresa, valoresIniciales]);

  const valoresConFormatoDeFormulario = {
    ...valores,
    empresa: empresas.find((e) => e.cod_empresa === valores.cod_empresa),
    centroCosto: centrosCostos.find((c) => c.cod_cc === valores.cod_cc),
    carrier: carriers.find((c) => c.cod_carrier === valores.cod_carrier),
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
    tipoPago: tiposPago.find((t) => t.cod_tipo === valores.cod_tipo_pago),
    paisOrigen: paises.find((p) => p.cod_pais === valores.cod_pais_origen),
    tipoPuntoEnlaceOrigen: tiposPuntoEnlace.find((t) => t.cod_tipo === valores.cod_tipo_puntoenlace_origen),
    puntoEnlaceOrigen: puntosEnlace.find((p) => p.cod_puntoenlace === valores.cod_puntoenlace_origen),
    paisDestino: paises.find((p) => p.cod_pais === valores.cod_pais_destino),
    tipoPuntoEnlaceDestino: tiposPuntoEnlace.find((t) => t.cod_tipo === valores.cod_tipo_puntoenlace_destino),
    puntoEnlaceDestino: puntosEnlace.find((p) => p.cod_puntoenlace === valores.cod_puntoenlace_destino),
  };

  useEffect(() => {
    if (!valores.entidad_id) return setValores((prev) => ({ ...prev, cliente: null }));
    const obtenerCliente = async () => {
      setIsLoadingInputCliente(true);
      const baseApiURL = "/api/appweb/lista-entidad";
      const [respClientes, respPreClientes] = await Promise.all([
        api.get(baseApiURL, { params: { entidad_id: valores.entidad_id, tipo_entidad: "CLIENTE" } }),
        api.get(baseApiURL, { params: { entidad_id: valores.entidad_id, tipo_entidad: "PRE-CLIENTE" } }),
      ]);
      let [cliente] = respClientes.data.data.data;
      if (!cliente) [cliente] = respPreClientes.data.data.data;

      cliente.label = `${cliente.codigo_entidad} - ${cliente.entidad_nombre}`;
      cliente.value = +cliente.entidad_id;

      setValores((prev) => ({
        ...prev,
        cliente,
      }));
      setIsLoadingInputCliente(false);
    };
    obtenerCliente();
  }, [valores.entidad_id]);

  // Obtener los contcatos del cliente seleccionado
  useEffect(() => {
    if (!valores.cliente?.entidad_id) {
      setValores((prev) => ({ ...prev, contactos: [] }));
      setContactos([]);
      return;
    }
    const obtenerContactos = async () => {
      const baseApiURL = "/api/appweb/lista-entidad-contacto";
      const contactosMetadataResponse = await api.get(baseApiURL, { params: { cod_tipo: valores.cliente.cod_tipo, entidad_id: valores.cliente.entidad_id } });
      const totalPaginas = contactosMetadataResponse.data.data.total_paginas;

      // hacer peticiones en paralelo para obtener todos los contactos de todas las páginas
      const promesas = [];
      let paginaActual = 1;
      while (paginaActual <= totalPaginas) {
        promesas.push(
          api.get(baseApiURL, {
            params: {
              cod_tipo: valores.cliente.cod_tipo,
              entidad_id: valores.cliente.entidad_id,
              pagina: paginaActual,
            },
          })
        );
        paginaActual++;
      }

      // esperar a que todas las promesas se resuelvan
      const metadaDataConctactosResponses = await Promise.all(promesas);
      let contactos = metadaDataConctactosResponses.reduce((acc, response) => {
        const contactosPagina = response.data.data.data || [];
        const contactosActivos = contactosPagina.filter((c) => c.cod_estado === CODS_ESTADOS.ACTIVO);
        return [...acc, ...contactosActivos];
      }, []);

      contactos = contactos.map((c) => ({ ...c, label: `${c.entidadcontacto_nombre} - ${c.entidadcontacto_email}`, value: c.entidadcontacto_id }));
      setContactos(contactos);
    };
    obtenerContactos();
  }, [valores.cliente]);

  const obtenerClienteSeleccionado = (cliente) => {
    setIsOpenDialogBusquedaCliente(false);
    setOpcionesClientes([]);
    const data_lc = keysToLowerCase(cliente);
    setValores((prev) => ({
      ...prev,
      entidad_id: +data_lc.entidad_id,
      cliente: {
        ...data_lc,
        value: +data_lc.entidad_id,
        label: `${data_lc.codigo_entidad} - ${data_lc.entidad_nombre}`,
      },
    }));
  };

  const handleClienteCreado = async (optionCliente) => {
    const baseApiURL = "api/appweb/recuperar-datos-entidad";
    const response = await api.post(baseApiURL, { cod_tipo: optionCliente.cod_tipo, entidad_id: optionCliente.entidad_id });
    let [cliente] = response.data.data.data_entidad;
    cliente = keysToLowerCase(cliente);
    setIsOpenDialogCrearCliente(false);

    const clienteConFormato = {
      ...cliente,
      value: +cliente.entidad_id,
      label: `${cliente.codigo_entidad} - ${cliente.entidad_nombre}`,
    };

    setValores((prev) => ({
      ...prev,
      cliente: clienteConFormato,
    }));

    setCatalogos((prev) => ({
      ...prev,
      clientes: [...prev.clientes, clienteConFormato],
    }));
  };

  const handleOpenCreacionCliente = () => {
    setIsOpenDialogCrearCliente(true);
    setIsOpenDialogBusquedaCliente(false);
  };

  const handleContactoEntidadCreado = (contacto) => {
    setValores((prev) => ({
      ...prev,
      contacto,
    }));

    setContactos((prev) => [...prev, contacto]);
  };

  const handleInputChange = ({ id, val }) => {
    setValores((prev) => {
      const nuevoValor = { ...prev, [id]: val };

      switch (id) {
        case "rubro":
          nuevoValor.cod_rubro = val?.value;
          if (!val) nuevoValor.rubro = nuevoValor.cod_rubro = null;
          break;
        case "carrier":
          nuevoValor.cod_carrier = val?.value;
          if (!val) nuevoValor.carrier = nuevoValor.cod_carrier = null;
          break;
        case "cliente":
          nuevoValor.entidad_id = val?.value;
          if (!val) nuevoValor.cliente = nuevoValor.entidad_id = null;
          break;
        case "contacto":
          nuevoValor.entidadcontacto_id = val?.value;
          if (!val) nuevoValor.contacto = nuevoValor.entidadcontacto_id = null;
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
        case "paisOrigen":
          nuevoValor.cod_pais_origen = val?.value;
          nuevoValor.tipoPuntoEnlaceOrigen = nuevoValor.cod_tipo_puntoenlace_origen = null;
          nuevoValor.puntoEnlaceOrigen = nuevoValor.cod_puntoenlace_origen = null;
          break;
        case "tipoPuntoEnlaceOrigen":
          nuevoValor.cod_tipo_puntoenlace_origen = val?.value;
          nuevoValor.puntoEnlaceOrigen = nuevoValor.cod_puntoenlace_origen = null;
          break;
        case "puntoEnlaceOrigen":
          nuevoValor.cod_puntoenlace_origen = val?.value;
          break;
        case "paisDestino":
          nuevoValor.cod_pais_destino = val?.value;
          nuevoValor.tipoPuntoEnlaceDestino = nuevoValor.cod_tipo_puntoenlace_destino = null;
          nuevoValor.puntoEnlaceDestino = nuevoValor.cod_puntoenlace_destino = null;
          break;
        case "tipoPuntoEnlaceDestino":
          nuevoValor.cod_tipo_puntoenlace_destino = val?.value;
          nuevoValor.puntoEnlaceDestino = nuevoValor.cod_puntoenlace_destino = null;
          break;
        case "puntoEnlaceDestino":
          nuevoValor.cod_puntoenlace_destino = val?.value;
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
      const reqBody = formatCotizacionToApiSubmissionFormat(valoresToSubmit);
      reqBody.cod_estado = CODS_ESTADOS.ACTIVO;
      let response = await api.post(baseApiURL, reqBody);
      if (!response.data.data.success) return;
      const cod_servicio = +response.data.data.cod_servicio;

      baseApiURL = "/api/appweb/lista-servicios";
      response = await api.get(baseApiURL);
      const servicioCreado = response.data.data.find((s) => s.cod_servicio === cod_servicio);
      if (isItCreating) {
        onCotizacionCreada(servicioCreado);
      } else {
        onCotizacionCreada(servicioCreado);
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

  const inputsCotizacion = useInputsFormularioCotizacion({
    valores: valoresConFormatoDeFormulario,
    isLoadingInputCliente,
    isItCreating,
    opciones: {
      empresas,
      centrosCostos,
      rubros,
      tiposServicio,
      tiposTransporte,
      clientes,
      incoterms,
      tiposAplicacion,
      tiposCalculo,
      tiposCarga,
      clasificacionesCarga,
      tiposPago,
      estados,
      paises,
      tiposPuntoEnlace,
      puntosEnlace,
      contactos,
      monedas,
      carriers,
      tiposSeguimiento,
    },
    defaultValues,
    readonly: !puedeEditar,
    setIsOpenDialogBusquedaCliente,
    setIsOpenDialogCrearCliente,
    hideLabels,
    inputsToHide,
    inputsNoObligatorios,
    setIsOpenDialogCrearContacto,
  });

  return (
    <>
      <FormularioComponent
        ref={formularioRef}
        titulo="Cotización"
        inputs={inputsCotizacion}
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
        isLoading={isLoadingCatalogosCotizacions}
      />

      <Grid sx={{ width: "100%", height: "100%" }}>
        <DialogComponent
          titulo="Buscar Cliente"
          openDialog={isOpenDialogBusquedaCliente}
          handleClose={() => {
            setIsOpenDialogBusquedaCliente(false);
            setOpcionesClientes([]);
          }}
          width="80vw"
          height="85vh"
        >
          <FiltroEntidad
            tiposEntidad={["PRE-CLIENTE", "CLIENTE"]}
            tiposBusqueda={[
              { label: "CODIGO", value: 1 },
              { label: "NIT", value: 2 },
              { label: "NOMBRE", value: 3 },
            ]}
            tipoDefaultIndex={3}
            setResults={setOpcionesClientes}
            listaTipos={catalogosEntidad.tipos}
          />

          <TablaEntidadActividad lista={opcionesClientes} obtenerFilaSeleccionada={obtenerClienteSeleccionado} handleNuevo={handleOpenCreacionCliente} />
        </DialogComponent>

        <DialogComponent titulo="Crear Cliente" openDialog={isOpenDialogCrearCliente} handleClose={() => setIsOpenDialogCrearCliente(false)} width="80vw" height="85vh">
          <FormularioCompletoEntidad id="new" tipo={CODS_TIPOS_ENTIDAD.PRE_CLIENTE} cliente={{}} catalogos={catalogosEntidad} onCreate={handleClienteCreado} />
        </DialogComponent>

        <CrearEntidadContactoDialog
          isOpen={isOpenDialogCrearContacto}
          setIsOpen={setIsOpenDialogCrearContacto}
          entidad_id={valores.cliente?.entidad_id}
          onContactoEntidadCreado={handleContactoEntidadCreado}
        />
      </Grid>
    </>
  );
};

const ForwardedFormularioCotizacion = forwardRef(FormularioCotizacion);

FormularioCotizacion.propTypes = {
  hideLabels: PropTypes.bool,
  usarAccionesPrestablecidas: PropTypes.bool,
  tieneRangosPrestablecidos: PropTypes.bool,
  catalogos: PropTypes.object,
  defaultValues: PropTypes.object,
  isItCreating: PropTypes.bool,
  submitButtonLabel: PropTypes.string,
  onSubmit: PropTypes.func,
  onCotizacionCreada: PropTypes.func,
  onCotizacionEditada: PropTypes.func,
  readonly: PropTypes.bool,
  inputsToHide: PropTypes.arrayOf(PropTypes.string),
  inputsNoObligatorios: PropTypes.arrayOf(PropTypes.string),
};

export default ForwardedFormularioCotizacion;
