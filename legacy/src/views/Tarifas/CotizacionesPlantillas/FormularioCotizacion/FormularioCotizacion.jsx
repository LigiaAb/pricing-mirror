import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import FormularioComponent from "@/components/Formulario/FormularioComponent";
import { useSelector } from "react-redux";
import { Checkbox, Grid } from "@mui/material";
import useCatalogosCotizacion from "../../CotizacionesPlantillas/hooks/useCatalogosCotizacion";
import { CODS_ESTADOS } from "@/constants/estados";
import { GenerarCeldaNombre } from "@/pages/Tarifas/Calculo/RenderizadosDePartes";
import DialogComponent from "@/components/Dialog/DialogComponent";
import FormularioCompletoEntidadContactos from "@/views/Entidad/EntidadContactos/FormularioCompletoEntidadContactos";

const CAMPOS_VISUALES = [
  "empresa",
  "centroCosto",
  "tipoTransporte",
  "tipoServicio",
  "tipoCarga",
  "clasificacionCarga",
  "incoterm",
  "tipoPago",
  "descripcion",
  "estado",
  "cliente",
  "carrier",
  "paisOrigen",
  "tipoPuntoEnlaceOrigen",
  "puntoEnlaceOrigen",
  "paisDestino",
  "tipoPuntoEnlaceDestino",
  "puntoEnlaceDestino",
];

const CAMPOS_REQUERIDOS = ["tipoServicio", "tipoTransporte", "empresa", "centroCosto", "descripcion", "contacto", "estado", "carrier", "cliente"];

const selectsConValoresLimpios = Object.fromEntries(CAMPOS_VISUALES.map((k) => [k, null]));

const findBy = (arr, key, value) => arr?.find((e) => e[key] === value) ?? null;

const tipoOrigenVsTipoTransporte = {
  AEREO: "AEROPUERTO",
  MARITIMO: "PUERTO",
  TERRESTRE: "ADUANA",
};

const FormularioPlantillaTarifa = (props) => {
  const {
    tipoFormulario = "lectura",
    defaultValues,
    catalogos,
    handleInsertar = () => {},
    handleActualizar = () => {},
    handleFiltrar = () => {},
    clearForm,
    setClearForm,
    inputsToHide = [],
    groupsToHide = [],
    inputsReadOnly = [],
    isLoading: isLoadingFormulario,
    reconsultar = false,
    setReconsultar = () => {},
    setValoresSoloCodigos = () => {},
  } = props;

  const { currentPais, currentEmpresa, currentCentroCosto } = useSelector((state) => state.menu);
  const { themeMode } = useSelector((state) => state.theme);

  const {
    isLoading: isLoadingCatalogos,
    isLoadingContactos,
    fetchOptionsClientes,
    fetchOptionsEstaciones,
    obtenerContactosDeEntidad,
    contactos,
    catalogos: catalogosProcesados,
  } = useCatalogosCotizacion(catalogos);
  const isLoading = useMemo(() => isLoadingCatalogos || isLoadingFormulario, [isLoadingCatalogos, isLoadingFormulario]);

  const [inicializado, setInicializado] = useState(false);
  const [valores, setValores] = useState({});

  const [dueAgentSelect, setDueAgentSelect] = useState({});

  const [openCrearContacto, setOpenCrearContacto] = useState(false);

  const reglasCampos = useMemo(
    () => ({
      cod_tarifaplantilla: {
        cod: "cod_tarifaplantilla",
      },
      empresa: {
        cod: "cod_empresa",
        reset: ["centroCosto", "cod_cc"],
        default: catalogosProcesados.empresas?.find((e) => e.cod_empresa === currentEmpresa?.cod_empresa),
        catalogo: "empresas",
        readonly: true,
        visible: false,
      },
      centroCosto: {
        cod: "cod_cc",
        require: "empresa",
        default: catalogosProcesados.centrosCosto?.find((cc) => cc.cod_empresa_cc === currentEmpresa?.cod_empresa && cc.cod_cc === currentCentroCosto?.cod_cc),
        catalogo: "centrosCosto",
        visible: false,
      },
      tipoTransporte: {
        cod: "cod_tipo_transporte",
        reset: ["tipoServicio", "cod_tipo_servicio"],
        catalogo: "tiposTransporte",
      },
      tipoServicio: {
        cod: "cod_tipo_servicio",
        catalogo: "tiposServicio",
      },
      tipoCarga: {
        cod: "cod_tipo_carga",
        catalogo: "tiposCarga",
      },
      clasificacionCarga: {
        cod: "cod_clasificacion_carga",
        catalogo: "clasificacionesCarga",
      },
      incoterm: {
        cod: "incoterm_id",
        catalogo: "incoterms",
      },
      tipoPago: {
        cod: "cod_tipo_pago",
        catalogo: "tiposPago",
        default: catalogosProcesados.tiposPago?.find((tp) => tp.value === 131),
        reset: ["estacion", "entidad_id_estacion"],
      },
      estacion: { cod: "entidad_id_estacion", catalogo: "estaciones" },
      paisOrigen: {
        cod: "cod_pais_origen",
        default: catalogosProcesados.paises?.find((p) => p.cod_pais === currentPais?.cod_pais),
        reset: ["puntoEnlaceOrigen", "cod_puntoenlace_origen"],
        catalogo: "paises",
      },
      tipoPuntoEnlaceOrigen: {
        cod: "cod_tipo_puntoenlace_origen",
        reset: ["puntoEnlaceOrigen", "cod_puntoenlace_origen"],
        catalogo: "tiposPuntoEnlace",
      },
      puntoEnlaceOrigen: {
        cod: "cod_puntoenlace_origen",
        catalogo: "puntosEnlace",
      },
      paisDestino: {
        cod: "cod_pais_destino",
        reset: ["puntoEnlaceDestino", "cod_puntoenlace_destino"],
        catalogo: "paises",
      },
      tipoPuntoEnlaceDestino: {
        cod: "cod_tipo_puntoenlace_destino",
        reset: ["puntoEnlaceDestino", "cod_puntoenlace_destino"],
        catalogo: "tiposPuntoEnlace",
      },
      puntoEnlaceDestino: {
        cod: "cod_puntoenlace_destino",
        catalogo: "puntosEnlace",
      },
      estado: {
        cod: "cod_estado",
        default: { value: CODS_ESTADOS.ACTIVO },
      },
      cliente: {
        cod: "entidad_id",
        reset: ["contacto", "entidadcontacto_id"],
        catalogo: "clientes",
      },
      contacto: {
        cod: "entidadcontacto_id",
        require: "cliente",
        catalogo: "contactos",
        acciones: [{ id: "agregar", icon: "c-mas" }],
      },
      carrier: {
        cod: "carrier_id",
        catalogo: "proveedores",
      },
    }),
    [catalogosProcesados, currentEmpresa?.cod_empresa, currentCentroCosto?.cod_cc, currentPais?.cod_pais],
  );

  const valoresIniciales = useMemo(() => Object.fromEntries(Object.entries(reglasCampos).map(([key, regla]) => [key, regla.default ?? null])), [reglasCampos]);

  const tiposServicioSeleccionables = useMemo(
    () => [...(catalogosProcesados.tiposServicio || []).filter((ts) => ts.cod_tipo_padre === valores.tipoTransporte?.cod_tipo && ts.cod_estado === CODS_ESTADOS.ACTIVO)],
    [catalogosProcesados.tiposServicio, valores.tipoTransporte],
  );
  const puntosEnlaceOrigen = useMemo(
    () => (catalogosProcesados.puntosEnlace || []).filter((pe) => pe.cod_pais === valores.paisOrigen?.value && pe.cod_tipo === valores.tipoPuntoEnlaceOrigen?.value),
    [catalogosProcesados.puntosEnlace, valores.paisOrigen, valores.tipoPuntoEnlaceOrigen],
  );
  const puntosEnlaceDestino = useMemo(
    () => (catalogosProcesados.puntosEnlace || []).filter((pe) => pe.cod_pais === valores.paisDestino?.value && pe.cod_tipo === valores.tipoPuntoEnlaceDestino?.value),
    [catalogosProcesados.puntosEnlace, valores.paisDestino, valores.tipoPuntoEnlaceDestino],
  );
  const valoresSoloCodigos = useMemo(() => {
    const resultado = {};

    Object.entries(valores).forEach(([key, value]) => {
      if (reglasCampos[key]) {
        resultado[reglasCampos[key].cod] = value ? (typeof value === "object" ? value.value : value) : null;
      }
    });
    resultado["cod_estado"] = valores?.cod_estado ?? 1;
    resultado["cod_tarifaplantilla"] = valores?.cod_tarifaplantilla;
    resultado["cod_continente_origen"] = valores?.puntoEnlaceOrigen?.cod_continent;
    resultado["cod_continente_destino"] = valores?.puntoEnlaceDestino?.cod_continente;
    resultado["descripcion"] = valores?.descripcion;
    resultado["cod_usuario"] = valores?.cod_usuario;

    return resultado;
  }, [valores, reglasCampos]);

  const verificarSiEsLectura = useCallback(
    (id) => {
      if (tipoFormulario === "lectura") return true;

      if (id === "cliente") {
        if (!defaultValues?.entidad_id) return false;
        else return true;
      }
      if (id === "contacto") {
        if (tipoFormulario === "ingreso" && !valores.cliente) return true;
        if (!defaultValues?.entidadcontacto_id) return false;
        if (tipoFormulario === "edicion") {
          if (!valores.cliente) return true;
          if (valores.cliente && !valores.contacto) return false;
          else return true;
        }
      }

      if (inputsReadOnly.some((i) => i === id)) return true;

      const requireOtroCampo = reglasCampos[id]?.require;
      if (!requireOtroCampo) return false;
      if (!valores[requireOtroCampo]) return true;

      return false;
    },
    [tipoFormulario, inputsReadOnly, reglasCampos, valores, defaultValues?.entidad_id, defaultValues?.entidadcontacto_id],
  );

  const verificarSiEsRequerido = useCallback(
    (id) => {
      if (tipoFormulario === "lectura") return false;
      return CAMPOS_REQUERIDOS.includes(id);
    },
    [tipoFormulario],
  );

  const verificarSiGrupoEsVisible = useCallback((id) => !groupsToHide.includes(id), [groupsToHide]);

  const verificarSiEsVisible = useCallback(
    (id) => {
      if (inputsToHide.includes(id)) return false;

      if (id === "estacion") {
        if (!valores["cod_tipo_pago"]) return false;
        if (![127, 131].includes(valores["cod_tipo_pago"])) return false;
        return true;
      }

      return true;
    },
    [inputsToHide, valores],
  );

  const defaultValuesProcesados = useMemo(() => {
    if (!defaultValues) return {};

    const resultado = { ...defaultValues };

    Object.entries(reglasCampos).forEach(([campo, regla]) => {
      const codigo = defaultValues[regla.cod];

      if (!codigo) return;

      const catalogo = catalogosProcesados[regla.catalogo];

      if (campo === "carrier") console.log("Catalogo carriers", catalogo, "Codigo a buscar", codigo);
      if (catalogo) {
        resultado[campo] = catalogo.find((e) => e.value === codigo) ?? null;
      }
    });

    return resultado;
  }, [defaultValues, reglasCampos, catalogosProcesados]);

  useEffect(() => {
    if (!isLoading) {
      setValores((prev) => ({
        ...prev,
        ...valoresIniciales,
        ...defaultValuesProcesados,
      }));

      setInicializado(true);

      if (reconsultar && setReconsultar) {
        setReconsultar(true);
      }
    }
  }, [isLoading, defaultValuesProcesados, inicializado]);

  useEffect(() => {
    if (defaultValues) setValores((prev) => ({ ...prev, ...defaultValuesProcesados }));
  }, [defaultValues]);

  const catalogoGrupos = useMemo(() => {
    const mostrarTitulo = true,
      tipo = "",
      size_6 = 6,
      variant = "span",
      filterShados = themeMode === "dark" ? "2.5px 10px 10px rgba(190, 190, 190, 0.05)" : "2.5px 10px 10px rgba(0, 2, 48, 0.05)",
      normalShadow = themeMode === "dark" ? "2.5px 10px 10px rgba(190, 190, 190, 0.3)" : "2.5px 10px 10px rgba(0, 2, 48, 0.2)",
      shadow = tipoFormulario !== "filtro" ? normalShadow : filterShados,
      p = tipoFormulario !== "filtro" ? 0.5 : 0;

    return {
      datos: { id: "datos", label: "Datos", mostrarTitulo, tipo, size: size_6, variant, p, shadow, visible: verificarSiGrupoEsVisible("datos") },
      transporte: { id: "transporte", label: "Transporte", mostrarTitulo, tipo, size: size_6, variant, p, shadow, visible: verificarSiGrupoEsVisible("transporte") },
      carga: { id: "carga", label: "Carga", mostrarTitulo, tipo, size: size_6, variant, p, shadow, visible: verificarSiGrupoEsVisible("carga") },
      terminosComercio: { id: "terminosComercio", label: "Términos de comercio", mostrarTitulo, tipo, size: size_6, variant, p, shadow, visible: verificarSiGrupoEsVisible("terminosComercio") },
      origen: { id: "origen", label: "Origen", mostrarTitulo, tipo, size: size_6, variant, p, shadow, visible: verificarSiGrupoEsVisible("origen") },
      destino: { id: "destino", label: "Destino", mostrarTitulo, tipo, size: size_6, variant, p, shadow, visible: verificarSiGrupoEsVisible("destino") },
    };
  }, [themeMode, tipoFormulario, verificarSiGrupoEsVisible]);

  const catalogoInputs = useMemo(() => {
    const size_12 = tipoFormulario !== "filtro" ? 12 : 6;
    const size_6 = 6;
    const size_4 = 4;

    const select_12 = { tipo: "select", size: size_12 };
    const select_6 = { tipo: "select", size: size_6 };
    const select_4 = { tipo: "select", size: size_4 };

    return {
      empresa: {
        id: "empresa",
        label: "Empresa",
        options: catalogosProcesados.empresas,
        readonly: verificarSiEsLectura("empresa"),
        requerido: verificarSiEsRequerido("empresa"),
        visible: verificarSiEsVisible("empresa"),
        ...select_6,
      },
      centroCosto: {
        id: "centroCosto",
        label: "Centro de costo",
        options: catalogosProcesados.centrosCosto || [],
        readonly: verificarSiEsLectura("centroCosto"),
        requerido: verificarSiEsRequerido("centroCosto"),
        visible: verificarSiEsVisible("centroCosto"),
        ...select_6,
      },
      tipoTransporte: {
        id: "tipoTransporte",
        label: "Tipo de transporte",
        options: catalogosProcesados.tiposTransporte,
        readonly: verificarSiEsLectura("tipoTransporte"),
        requerido: verificarSiEsRequerido("tipoTransporte"),
        visible: verificarSiEsVisible("tipoTransporte"),
        ...select_6,
      },
      tipoServicio: {
        id: "tipoServicio",
        label: "Tipo de servicio",
        options: tiposServicioSeleccionables,
        readonly: verificarSiEsLectura("tipoServicio"),
        requerido: verificarSiEsRequerido("tipoServicio"),
        visible: verificarSiEsVisible("tipoServicio"),
        ...select_6,
      },
      tipoCarga: {
        id: "tipoCarga",
        label: "Tipo de carga",
        options: catalogosProcesados.tiposCarga,
        readonly: verificarSiEsLectura("tipoCarga"),
        requerido: verificarSiEsRequerido("tipoCarga"),
        visible: verificarSiEsVisible("tipoCarga"),
        ...select_6,
      },
      clasificacionCarga: {
        id: "clasificacionCarga",
        label: "Clasificación de carga",
        options: catalogosProcesados.clasificacionesCarga,
        readonly: verificarSiEsLectura("clasificacionCarga"),
        requerido: verificarSiEsRequerido("clasificacionCarga"),
        visible: verificarSiEsVisible("clasificacionCarga"),
        ...select_6,
      },
      incoterm: {
        id: "incoterm",
        label: "Incoterm",
        options: catalogosProcesados.incoterms,
        readonly: verificarSiEsLectura("incoterm"),
        requerido: verificarSiEsRequerido("incoterm"),
        visible: verificarSiEsVisible("incoterm"),
        ...select_6,
      },
      tipoPago: {
        id: "tipoPago",
        label: "Tipo de pago",
        options: catalogosProcesados.tiposPago,
        readonly: verificarSiEsLectura("tipoPago"),
        requerido: verificarSiEsRequerido("tipoPago"),
        visible: verificarSiEsVisible("tipoPago"),
        ...select_6,
      },
      estacion: {
        id: "estacion",
        label: "Estacion DSV",
        options: catalogosProcesados.estaciones,
        fetchOptions: fetchOptionsEstaciones,
        readonly: verificarSiEsLectura("estacion"),
        requerido: verificarSiEsRequerido("estacion"),
        visible: verificarSiEsVisible("estacion"),
        ...select_6,
      },
      paisOrigen: {
        id: "paisOrigen",
        label: "País de origen",
        options: catalogosProcesados.paises,
        readonly: verificarSiEsLectura("paisOrigen"),
        requerido: verificarSiEsRequerido("paisOrigen"),
        visible: verificarSiEsVisible("paisOrigen"),
        ...select_6,
      },
      tipoPuntoEnlaceOrigen: {
        id: "tipoPuntoEnlaceOrigen",
        label: "Tipo de origen",
        options: catalogosProcesados.tiposPuntoEnlace,
        readonly: verificarSiEsLectura("tipoPuntoEnlaceOrigen"),
        requerido: verificarSiEsRequerido("tipoPuntoEnlaceOrigen"),
        visible: verificarSiEsVisible("tipoPuntoEnlaceOrigen"),
        ...select_6,
      },
      puntoEnlaceOrigen: {
        id: "puntoEnlaceOrigen",
        label: "Origen",
        options: puntosEnlaceOrigen,
        readonly: verificarSiEsLectura("puntoEnlaceOrigen"),
        requerido: verificarSiEsRequerido("puntoEnlaceOrigen"),
        visible: verificarSiEsVisible("puntoEnlaceOrigen"),
        ...select_12,
      },
      paisDestino: {
        id: "paisDestino",
        label: "País de destino ",
        tipo: "select",
        options: catalogosProcesados.paises,
        readonly: verificarSiEsLectura("paisDestino"),
        requerido: verificarSiEsRequerido("paisDestino"),
        visible: verificarSiEsVisible("paisDestino"),
        size: size_6,
      },
      tipoPuntoEnlaceDestino: {
        id: "tipoPuntoEnlaceDestino",
        label: "Tipo de destino",
        options: catalogosProcesados.tiposPuntoEnlace,
        readonly: verificarSiEsLectura("tipoPuntoEnlaceDestino"),
        requerido: verificarSiEsRequerido("tipoPuntoEnlaceDestino"),
        visible: verificarSiEsVisible("tipoPuntoEnlaceDestino"),
        ...select_6,
      },
      puntoEnlaceDestino: {
        id: "puntoEnlaceDestino",
        label: "Destino",
        options: puntosEnlaceDestino,
        readonly: verificarSiEsLectura("puntoEnlaceDestino"),
        requerido: verificarSiEsRequerido("puntoEnlaceDestino"),
        visible: verificarSiEsVisible("puntoEnlaceDestino"),
        ...select_12,
      },
      estado: { id: "estado", label: "Estado", tipo: "select", options: [], visible: false, size: size_4 },

      descripcion: {
        id: "descripcion",
        label: "Descripción",
        tipo: "text",
        readonly: verificarSiEsLectura("descripcion"),
        requerido: verificarSiEsRequerido("descripcion"),
        visible: verificarSiEsVisible("descripcion"),
        size: 12,
      },
      cliente: {
        id: "cliente",
        label: "Cliente",
        options: catalogosProcesados.clientes,
        fetchOptions: fetchOptionsClientes,
        readonly: verificarSiEsLectura("cliente"),
        requerido: verificarSiEsRequerido("cliente"),
        visible: verificarSiEsVisible("cliente"),
        ...select_6,
      },
      contacto: {
        id: "contacto",
        label: "Contacto",
        options: contactos,
        readonly: verificarSiEsLectura("contacto"),
        requerido: verificarSiEsRequerido("contacto"),
        visible: verificarSiEsVisible("contacto"),
        actions: [
          {
            id: "contactos",
            icono: "c-suma",
            enabled: !verificarSiEsLectura("contacto"),
            label: "Ver contactos",
            onClick: () => setOpenCrearContacto(true),
          },
        ],
        ...select_6,
      },
      carrier: {
        id: "carrier",
        label: "Carrier",
        options: catalogosProcesados.proveedores,
        readonly: verificarSiEsLectura("carrier"),
        requerido: verificarSiEsRequerido("carrier"),
        visible: verificarSiEsVisible("carrier"),
        ...select_6,
      },
    };
  }, [
    tipoFormulario,
    catalogosProcesados,
    verificarSiEsLectura,
    verificarSiEsRequerido,
    verificarSiEsVisible,
    tiposServicioSeleccionables,
    puntosEnlaceOrigen,
    puntosEnlaceDestino,
    fetchOptionsClientes,
    contactos,
  ]);

  const data = useMemo(() => {
    const grupos = Object.values(catalogoGrupos);

    const inputs = [
      { grupoId: "datos", ...catalogoInputs?.empresa, val: valores?.empresa },
      { grupoId: "datos", ...catalogoInputs?.centroCosto, val: valores?.centroCosto },
      { grupoId: "datos", ...catalogoInputs?.descripcion, val: valores?.descripcion },
      { grupoId: "datos", ...catalogoInputs?.cliente, val: valores?.cliente },
      { grupoId: "datos", ...catalogoInputs?.contacto, val: valores?.contacto, isLoading: isLoadingContactos },
      { grupoId: "datos", ...catalogoInputs?.carrier, val: valores?.carrier },
      { grupoId: "datos", ...catalogoInputs?.estado, val: valores?.estado },

      { grupoId: "transporte", ...catalogoInputs?.tipoTransporte, val: valores?.tipoTransporte },
      { grupoId: "transporte", ...catalogoInputs?.tipoServicio, val: valores?.tipoServicio },

      { grupoId: "carga", ...catalogoInputs?.tipoCarga, val: valores?.tipoCarga },
      { grupoId: "carga", ...catalogoInputs?.clasificacionCarga, val: valores?.clasificacionCarga },

      { grupoId: "terminosComercio", ...catalogoInputs?.incoterm, val: valores?.incoterm },
      { grupoId: "terminosComercio", ...catalogoInputs?.tipoPago, val: valores?.tipoPago },
      { grupoId: "terminosComercio", ...catalogoInputs?.estacion, val: valores?.estacion },

      { grupoId: "origen", ...catalogoInputs?.paisOrigen, val: valores?.paisOrigen },
      { grupoId: "origen", ...catalogoInputs?.tipoPuntoEnlaceOrigen, val: valores?.tipoPuntoEnlaceOrigen },
      { grupoId: "origen", ...catalogoInputs?.puntoEnlaceOrigen, val: valores?.puntoEnlaceOrigen },

      { grupoId: "destino", ...catalogoInputs?.paisDestino, val: valores?.paisDestino },
      { grupoId: "destino", ...catalogoInputs?.tipoPuntoEnlaceDestino, val: valores?.tipoPuntoEnlaceDestino },
      { grupoId: "destino", ...catalogoInputs?.puntoEnlaceDestino, val: valores?.puntoEnlaceDestino },
    ].filter(Boolean);

    return { grupos, inputs };
  }, [catalogoGrupos, catalogoInputs, valores, isLoadingContactos]);

  const onInput = useCallback(
    ({ id, val }) => {
      setValores((prev) => {
        if (Object.is(prev[id], val)) return prev;
        const next = { ...prev };

        if (id === "tipoTransporte") {
          const tipoTransporteSeleccionado = val;
          const tipoPuntoEnlace = tipoOrigenVsTipoTransporte[tipoTransporteSeleccionado?.label];
          const tipoPuntoEnlaceEncontrado = findBy(catalogosProcesados.tiposPuntoEnlace, "label", tipoPuntoEnlace);

          next["tipoPuntoEnlaceOrigen"] = tipoPuntoEnlaceEncontrado;
          next["tipoPuntoEnlaceDestino"] = tipoPuntoEnlaceEncontrado;

          if (tipoPuntoEnlace === "AEROPUERTO" && currentPais?.cod_pais === 1001) {
            next["puntoEnlaceOrigen"] = findBy(catalogosProcesados.puntosEnlace, "cod_puntoenlace", 2227);
          }
        }

        const regla = reglasCampos[id];
        if (!regla) return { ...prev, [id]: val };

        next[id] = val ?? null;
        next[regla.cod] = val?.value ?? regla.default ?? null;

        regla.reset?.forEach((k) => {
          next[k] = null;
        });

        return next;
      });
    },
    [catalogosProcesados.tiposPuntoEnlace, catalogosProcesados.puntosEnlace, currentPais?.cod_pais, reglasCampos],
  );

  const onSubmitFormulario = useCallback(() => {
    tipoFormulario === "filtro" ? handleFiltrar(valoresSoloCodigos) : tipoFormulario === "ingreso" ? handleInsertar(valoresSoloCodigos) : handleActualizar(valoresSoloCodigos);
    setReconsultar(true);
  }, [handleActualizar, handleFiltrar, handleInsertar, tipoFormulario, valoresSoloCodigos, setReconsultar]);

  useEffect(() => {
    if (clearForm) {
      setValores((prev) => ({ ...prev, ...valoresIniciales }));
      setClearForm(false);
    }
  }, [clearForm, valoresIniciales, setClearForm]);
  useEffect(() => {
    if (setValoresSoloCodigos) {
      setValoresSoloCodigos(valoresSoloCodigos);
    }
  }, [valoresSoloCodigos, setValoresSoloCodigos]);

  useEffect(() => {
    if (!valores?.cliente) return;
    if (!valores?.empresa) return;
    if (!valores?.centroCosto) return;
    obtenerContactosDeEntidad({
      ...valores?.cliente,
      cod_cc: valores?.cod_cc,
      cod_emp: valores?.cod_empresa,
    });
  }, [valores?.cliente?.value, valores?.centroCosto?.value, valores?.empresa?.value]);

  useEffect(() => {
    if (!valores?.cliente) return;
    if (!defaultValues?.entidadcontacto_id) return;
    if (!contactos?.length) return;

    const contactoEncontrado = contactos.find((c) => c.value === defaultValues?.entidadcontacto_id);

    if (!contactoEncontrado) return;

    setValores((prev) => ({ ...prev, contacto: contactoEncontrado }));
  }, [valores?.cliente?.value, defaultValues?.entidadcontacto_id, contactos]);

  return (
    <Grid sx={{}}>
      <FormularioComponent
        data={data}
        onInput={onInput}
        botones={
          tipoFormulario !== "lectura"
            ? {
                agregar: {
                  variant: "contained",
                  visible: tipoFormulario === "ingreso",
                  onClick: onSubmitFormulario,
                },
                guardar: {
                  variant: "contained",
                  color: "accent",
                  textColor: "white",
                  visible: tipoFormulario === "edicion",
                  onClick: onSubmitFormulario,
                },
                filtrar: {
                  variant: "contained",
                  visible: tipoFormulario === "filtro",
                  icono: "c-lupa",
                  onClick: onSubmitFormulario,
                },
              }
            : { agregar: { visible: false } }
        }
        isLoading={isLoading}
      />
      <DialogComponent
        openDialog={openCrearContacto}
        handleClose={() => setOpenCrearContacto(false)}
        titulo="Crear Contacto"
        width="80vw"
        content={
          <Grid sx={{ display: "flex", flexDirection: "column", px: 3 }}>
            <FormularioCompletoEntidadContactos
              id="new"
              tipo={5}
              cliente={valores?.cliente}
              onCreate={() => {
                obtenerContactosDeEntidad({
                  ...valores?.cliente,
                  cod_cc: valores?.cod_cc,
                  cod_emp: valores?.cod_empresa,
                });
                setOpenCrearContacto(false);
              }}
              onActividad
            />
          </Grid>
        }
      />
    </Grid>
  );
};

FormularioPlantillaTarifa.propTypes = {
  tipoFormulario: PropTypes.string.isRequired,
  defaultValues: PropTypes.object,
  catalogos: PropTypes.object,
  handleFiltrar: PropTypes.func,
  handleInsertar: PropTypes.func,
  handleActualizar: PropTypes.func,
  inputsToHide: PropTypes.array,
  groupsToHide: PropTypes.array,
  inputsReadOnly: PropTypes.array,
  isLoading: PropTypes.bool,
  clearForm: PropTypes.bool,
  setClearForm: PropTypes.func,
  reconsultar: PropTypes.bool,
  setReconsultar: PropTypes.func,
  setValoresSoloCodigos: PropTypes.func,
};

export default FormularioPlantillaTarifa;
