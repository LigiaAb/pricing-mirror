import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import FormularioComponent from "@/components/Formulario/FormularioComponent";
import { useSelector } from "react-redux";
import { Button, Card, Grid, Typography } from "@mui/material";
import useCatalogosCotizacion from "../hooks/useCatalogosCotizacion";
import { CODS_ESTADOS } from "@/constants/estados";
import { api } from "@/api";
import DialogComponent from "@/components/Dialog/DialogComponent";
import FormularioCompletoEntidadContactos from "@/views/Entidad/EntidadContactos/FormularioCompletoEntidadContactos";
import { set } from "date-fns";
import LoaderComponent from "@/components/Loader/LoaderComponent";
import FormularioCompletoEntidad from "@/views/Entidad/FormularioCompletoEntidad";

const CAMPOS_VISUALES = [
  "empresa",
  "centroCosto",
  "rubro",
  "tipoServicio",
  "tipoTransporte",
  "tipoAplicacion",
  "tipoCalculo",
  "tipoCarga",
  "clasificacionCarga",
  "incoterm",
  "tipoPago",
  "paisOrigen",
  "tipoPuntoEnlaceOrigen",
  "puntoEnlaceOrigen",
  "paisDestino",
  "tipoPuntoEnlaceDestino",
  "puntoEnlaceDestino",
];

const CAMPOS_REQUERIDOS = [
  "fecha",
  "empresa",
  "centroCosto",
  "cliente",
  "contacto",
  "tipoTransporte",
  "tipoServicio",
  "tipoCarga",
  "clasificacionCarga",
  // "incoterm",
  "tipoPago",
  "paisOrigen",
  "tipoPuntoEnlaceOrigen",
  "puntoEnlaceOrigen",
  "paisDestino",
  "tipoPuntoEnlaceDestino",
  "puntoEnlaceDestino",
];

const selectsConValoresLimpios = Object.fromEntries(CAMPOS_VISUALES.map((k) => [k, null]));
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

const findBy = (arr, key, value) => arr?.find((e) => e[key] === value) ?? null;

const tipoOrigenVsTipoTransporte = {
  AEREO: "AEROPUERTO",
  MARITIMO: "PUERTO",
  TERRESTRE: "CIUDAD",
};

/**
 *
 * @param {Object} props
 * @param {"filtro" | "ingreso" | "lectura" | "edicion"} props.tipoFormulario
 * @param {Object} props.defaultValues
 * @param {Object} props.catalogos
 * @param {Function} props.onSubmit
 * @param {Array} props.inputsToHide
 * @param {Array} props.inputsNoObligatorios
 * @returns {React.ReactNode}
 * @description
 * PROCESO
 * 1. OBTENER CATALOGOS
 * 2. OBTENER DATOS POR DEFECTO DEL FORMULARIO
 * 3. CARGAR LOS DATOS DE CATALOGOS EN LOS INPUTS DEL FORMULARIO
 * 4. LLENAR LOS DATOS QUE NO VIENEN POR DEFECTO, PERO SON NORMAS DE NEGOCIO
 * 5. VALIDAR Y LLENAR DATOS DEL FORMULARIO CON LOS DATOS POR DEFECTO
 * 6. ORDENAR LOS INPUTS DEL FORMULARIO DE ACUERDO CON LA FUNCION DEL FORMULARIO
 * 6.a SI ES UN FORMULARIO DE FILTRO, DEHABILITAR LOS INPUTS QUE NO SE DEBEN MOSTRAR
 * 6.b SI ES UN FORMULARIO DE INGRESO, DEHABILITAR LOS INPUTS QUE NO SE DEBEN MODIFICAR
 * 6.c SI ES UN FORMULARIO DE LECTURA, DEHABILITAR TODOS LOS INPUTS
 * 7. DESHABILITAR LOS INPUTS BASADOS EN LOS PERMISOS DEL USUARIO
 * 8. RENDERIZAR EL FORMULARIO DE COTIZACION EN LA FORMA SELECCIONADA
 * 9. RETORNAR EL FORMULARIO DE COTIZACION
 *
 * LOS GRUPOS DE LOS INPUTS DEL FORMULARIO SON:
 * 1. DATOS
 * 2. TRANSPORTE
 * 3. CARGA
 * 4. TERMINOS DE COMERCIO
 * 5. ORIGEN
 * 6. DESTINO
 *
 * LOS INPUTS DEL FORMULARIO SON:
 * 1. FECHA
 * 2. EMPRESA
 * 3. CENTRO DE COSTO
 * 4. CLIENTE
 * 5. CONTACTO
 * 6. TIPO DE TRANSPORTE
 * 7. TIPO DE SERVICIO
 * 8. TIPO DE CARGA
 * 9. CLASIFICACION DE CARGA
 * 10. INCOTERMS
 * 11. TIPO DE PAGO
 * 12. PAIS DE ORIGEN
 * 13. PAIS DE DESTINO
 * 13. TIPO DE PUNTO DE ENLACE DE ORIGEN
 * 14. TIPO DE PUNTO DE ENLACE DE DESTINO
 * 15. PUNTO DE ENLACE DE ORIGEN
 * 16. PUNTO DE ENLACE DE DESTINO
 *
 * NORMAS DE NEGOCIO
 * 1. EL TIPO DE PUNTO DE ENLACE DE ORIGEN Y DE DESTINO DEPENDEN DE EL TIPO DE TRANSPORTE
 * 2. LA EMPRESA Y CENTRO DE COSTO SE HEREDAN DE LA EMPRESA Y CENTRO DE COSTO SELECCIONADOS EN LA PANTALLA DE INICIO (viene de los permisos)
 * 3. EL CONTACTO SE HEREDA DEL CLIENTE SELECCIONADO
 * 4. EL PAIS DE ORIGEN SE DEBE SELECCIONAR BASADO EN EL PAIS SELECCIONADO EN LA PANTALLA DE INICIO (viene de los permisos)
 *
 * RENDERIZADOS
 * 1. FORMULARIO DE COTIZACION
 * 1.a FORMULARIO DE COTIZACION EN FORMA DE FILTRO
 * 1.b FORMULARIO DE COTIZACION EN FORMA DE INGRESO
 * 1.c FORMULARIO DE COTIZACION EN FORMA DE LECTURA
 *
 * LOS CATALOGOS A OBTENER SON:
 * 1. EMPRESAS (URL: /api/appweb/listaempresas)
 * 2. CENTROS DE COSTO (URL: /api/appweb/listacentrocosto)
 * 3.q CLIENTES (URL SIMPLE: /api/appweb/lista-entidad-simplificada?cod_estado=1&tipo_entidad=CLIENTE&cod_estado=1)
 *   3.a.1. CONTACTOS (URL SIMPLE: /api/appweb/lista-entidad-contacto?cod_tipo=3&entidad_id=CLIENTE)
 * 3.b PRE-CLIENTE (URL SIMPLE: /api/appweb/lista-entidad-simplificada?cod_estado=1&tipo_entidad=PRECLIENTE&cod_estado=1)
 *   3.b.1. CONTACTOS (URL SIMPLE: /api/appweb/lista-entidad-contacto?cod_tipo=3&entidad_id=PRECLIENTE)
 * 3.C PROVEEDORES (URL SIMPLE: /api/appweb/lista-entidad-simplificada?cod_estado=1&tipo_entidad=PROVEEDOR&cod_estado=1)
 * 4. TIPO DE TRANSPORTE (URL: /api/appweb/lista-tipo?tipo_tabla=TRANSPORTE)
 * 5. TIPO DE SERVICIO (URL: /api/appweb/lista-relacion-tipo?tipo_tabla=SERVICIO)
 * 6. TIPO DE CARGA (URL: /api/appweb/lista-relacion-tipo?tipo_tabla=CARGA)
 * 7. CLASIFICACION DE CARGA (URL: /api/appweb/lista-clasificaciones-carga)
 * 8. INCOTERMS (URL: /api/appweb/lista-incoterms)
 * 9. TIPO DE PAGO (URL: /api/appweb/lista-relacion-tipo?tipo_tabla=PAGO)
 * 10. PAISES (URL: /api/appweb/listapaises)
 * 11. TIPO DE PUNTO DE ENLACE (URL: /api/appweb/lista-relacion-tipo?tipo_tabla=PUNTO_ENLACE)
 * 12. PUNTO DE ENLACE (URL: /api/appweb/listapuntoenlace)
 * 13. MONEDAS (URL: /api/appweb/lista-moneda)
 * 14. CARRIERS (URL: /api/appweb/lista-carrier)
 * 15. TIPO DE SEGUIMIENTO (URL: /api/appweb/lista-relacion-tipo?tipo_tabla=SEGUIMIENTO)
 * 16. TIPO DE CALCULO (URL: /api/appweb/lista-relacion-tipo?tipo_tabla=CALCULO)
 * 17. CRITERIOS (URL: /api/appweb/lista-criterios)
 *
 */
const FormularioCotizacion = (props) => {
  const {
    tipoFormulario = "lectura",
    defaultValues,
    catalogos,
    filtrarEntidades,
    handleInsertar = () => {},
    handleActualizar = () => {},
    handleFiltrar = () => {},
    clearForm,
    setClearForm,
    inputsToHide = [],
    groupsToHide = [],
    inputsReadOnly = ["fecha"],
    inputsNoObligatorios,
    isLoading: isLoadingFormulario,
    reconsultar = false,
    setReconsultar = () => {},
    onCotizacionCreada,
    setPlantillaSeleccionada = () => {},
    setEsValido = () => {},
    noPlantilla = false,
  } = props;

  const { currentPais, currentEmpresa, currentCentroCosto } = useSelector((state) => state.menu);
  const { themeMode } = useSelector((state) => state.theme);
  const { cod_usuario: defaultCodUsuario } = useSelector((state) => state.auth);

  const {
    isLoading: isLoadingCatalogos,
    isLoadingContactos,
    fetchOptionsClientes,
    fetchOptionsProveedores,
    fetchOptionsEstaciones,
    obtenerContactosDeEntidad,
    obtenerPlantillaDeCliente,
    clearPlantillasCliente,
    contactos,
    plantillas,
    catalogos: catalogosProcesados,
    obtenerClienteById,
    obtenerProveedorById,
    obtenerEstacionById,
    isLoadingEntidad,
  } = useCatalogosCotizacion(catalogos);

  const isLoading = useMemo(() => isLoadingCatalogos || isLoadingFormulario, [isLoadingCatalogos, isLoadingFormulario]);

  const [inicializado, setInicializado] = useState(false);

  const [valores, setValores] = useState({});

  const [openCrearContacto, setOpenCrearContacto] = useState(false);

  const [openCrearPreCliente, setOpenCrearPreCliente] = useState(false);

  const [openSeleccionarPlantilla, setOpenSeleccionarPlantilla] = useState(false);

  const [plantillasCliente, setPlantillasCliente] = useState(null);

  const [textoCarga, setTextoCarta] = useState("");

  const reglasCampos = useMemo(
    () => ({
      cod_cotizacion_cabecera: { cod: "cod_cotizacion_cabecera" },
      cod_tarifaplantilla: { cod: "cod_tarifaplantilla" },
      fecha: {
        cod: "cabezera_cotizacion_fecha",
        default: tipoFormulario === "filtro" ? undefined : new Date(),
        readonly: true,
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
      tipoTransporte: {
        cod: "cod_tipo_transporte",
        reset: ["tipoServicio", "cod_tipo_servicio", "tipoCalculo", "cod_tipo_calculo", "tipoClasificacion", "clasificacion"],
        catalogo: "tiposTransporte",
      },
      tipoServicio: {
        cod: "cod_tipo_servicio",
        reset: ["tipoAplicacion", "cod_tipo_aplicacion"],
        catalogo: "tiposServicio",
      },
      tipoCarga: { cod: "cod_tipo_carga", catalogo: "tiposCarga" },
      clasificacionCarga: {
        cod: "cod_clasificacion_carga",
        catalogo: "clasificacionesCarga",
      },
      incoterm: { cod: "incoterm_id", catalogo: "incoterms" },
      tipoPago: {
        cod: "cod_tipo_pago",
        reset: ["estacion", "entidad_id_estacion"],
        default: catalogosProcesados.tiposPago?.find((tp) => tp.value === 131),
        catalogo: "tiposPago",
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
      estado: { cod: "cod_estado", default: CODS_ESTADOS.ACTIVO },
      cod_usuario: { cod: "cod_usuario", default: defaultCodUsuario },
      cod_continente_origen: { cod: "cod_continente_origen" },
      cod_continente_destino: { cod: "cod_continente_destino" },
      carrier: {
        cod: "carrier_id",
        catalogo: "proveedores",
      },
    }),
    [
      catalogosProcesados.empresas,
      catalogosProcesados.centrosCosto,
      catalogosProcesados.tiposPago,
      catalogosProcesados.paises,
      currentEmpresa?.cod_empresa,
      currentCentroCosto?.cod_cc,
      currentPais?.cod_pais,
      defaultCodUsuario,
      tipoFormulario,
    ],
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
  const ciudadesOrigen = useMemo(() => (catalogosProcesados.ciudades || []).filter((pe) => pe.cod_pais === valores.paisOrigen?.value), [catalogosProcesados.ciudades, valores.paisOrigen]);
  const puntosEnlaceDestino = useMemo(
    () => (catalogosProcesados.puntosEnlace || []).filter((pe) => pe.cod_pais === valores.paisDestino?.value && pe.cod_tipo === valores.tipoPuntoEnlaceDestino?.value),
    [catalogosProcesados.puntosEnlace, valores.paisDestino, valores.tipoPuntoEnlaceDestino],
  );
  const ciudadesDestino = useMemo(() => (catalogosProcesados.ciudades || []).filter((pe) => pe.cod_pais === valores.paisDestino?.value), [catalogosProcesados.ciudades, valores.paisDestino]);

  const valoresSoloCodigos = useMemo(() => {
    const resultado = {};

    Object.entries(reglasCampos).forEach(([key, regla]) => {
      const value = valores[key];

      // NUEVO: si existe el campo visual, usarlo.
      // Si no existe, usar el código directo guardado en valores.
      resultado[regla.cod] = value ? (typeof value === "object" ? value.value : value) : (valores[regla.cod] ?? null);
    });

    if (typeof valores?.cod_estado === "string") resultado["cod_estado"] = CODS_ESTADOS[valores.cod_estado.toUpperCase() || "ACTIVO"] ?? valores.cod_estado;
    else resultado["cod_estado"] = valores?.cod_estado;

    resultado["cod_continente_origen"] = valores?.puntoEnlaceOrigen?.cod_continent;
    resultado["cod_continente_destino"] = valores?.puntoEnlaceDestino?.cod_continente;
    resultado["cod_usuario"] = valores?.cod_usuario;
    resultado["contacto_estacion"] = valores?.contacto_estacion;
    resultado["cod_cotizacion_cabecera"] = valores?.cod_cotizacion_cabecera;
    resultado["cod_tarifaplantilla"] = valores?.cod_tarifaplantilla;
    resultado["descripcion"] = valores?.descripcion;
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

      if (id === "estacion") {
        if (!valores["cod_tipo_pago"]) return false;
        if (valores["cod_tipo_pago"] === 131 || valores["cod_tipo_pago"] === 127) {
          if (valores["cod_tipo_servicio"] === 81) return true;
          return false;
        }
        return false;
      }

      if (CAMPOS_REQUERIDOS.includes(id)) return true;

      if (valores["cod_tipo_pago"] === 127 && id === "estacion") return true;
    },
    [defaultValues, valores, tipoFormulario],
  );

  const verificarSiGrupoEsVisible = useCallback((id) => !groupsToHide.includes(id), [groupsToHide]);

  const verificarSiEsVisible = useCallback(
    (id) => {
      if (inputsToHide.includes(id)) return false;

      if (id === "estacion") {
        // if (!valores["cod_tipo_pago"]) return false;
        if (
          valores["cod_tipo_pago"] === 131 ||
          valores["cod_tipo_pago"] === 127 ||
          !valores["cod_tipo_pago"] ||
          valores["cod_tipo_pago"]?.cod_tipo_pago === 131 ||
          valores["cod_tipo_pago"]?.cod_tipo_pago === 127
        ) {
          if (valores["cod_tipo_servicio"] === 81) return true;
          return false;
        }
        return false;
      }
      if (id === "contacto_estacion") {
        if (valores["estacion"]) return true;
        return false;
      }

      return true;
    },
    [defaultValues, inputsToHide, valores],
  );

  const defaultValuesProcesados = useMemo(() => {
    if (!defaultValues) return {};

    const resultado = { ...defaultValues };

    Object.entries(reglasCampos).forEach(([campo, regla]) => {
      const codigo = defaultValues[regla.cod];

      if (!codigo) return;

      const catalogo = catalogosProcesados[regla.catalogo];

      if (catalogo) {
        resultado[campo] = catalogo.find((e) => e.value === codigo) ?? null;
      }
    });

    if (!resultado["cod_usuario"]) resultado["cod_usuario"] = defaultValues["cod_usuario"] || defaultCodUsuario;

    return resultado;
  }, [defaultValues, reglasCampos, catalogosProcesados, defaultCodUsuario]);

  useEffect(() => {
    if (!isLoading) {
      setValores((prev) => ({
        ...prev,
        ...valoresIniciales,
        ...defaultValuesProcesados,

        contacto: prev.contacto ?? defaultValuesProcesados.contacto ?? null,
        entidadcontacto_id: prev.entidadcontacto_id ?? defaultValuesProcesados.entidadcontacto_id ?? defaultValues?.entidadcontacto_id ?? null,
      }));

      setInicializado(true);

      if (reconsultar && setReconsultar) {
        setReconsultar(true);
      }
    }
  }, [isLoading, defaultValuesProcesados, inicializado]);

  useEffect(() => {
    if (!defaultValues) return;

    setValores((prev) => ({
      ...prev,
      ...defaultValuesProcesados,

      // NUEVO: no borrar contacto ya cargado
      contacto: defaultValuesProcesados.contacto ?? prev.contacto ?? null,
      entidadcontacto_id: defaultValuesProcesados.entidadcontacto_id ?? prev.entidadcontacto_id ?? defaultValues.entidadcontacto_id ?? null,
    }));
  }, [defaultValues, defaultValuesProcesados]);

  const catalogoGrupos = useMemo(() => {
    const mostrarTitulo = true, // tipoFormulario !== "filtro";
      tipo = "",
      size_12 = 12, // tipoFormulario !== "filtro" ? 12 : undefined,
      size_6 = 6, // tipoFormulario !== "filtro" ? 6 : undefined,
      variant = "span",
      filterShados = themeMode === "dark" ? "2.5px 10px 10px rgba(190, 190, 190, 0.05)" : "2.5px 10px 10px rgba(0, 2, 48, 0.05)",
      normalShadow = themeMode === "dark" ? "2.5px 10px 10px rgba(190, 190, 190, 0.3)" : "2.5px 10px 10px rgba(0, 2, 48, 0.2)",
      shadow = tipoFormulario !== "filtro" ? normalShadow : filterShados,
      p = tipoFormulario !== "filtro" ? 0.5 : 0;
    return {
      datos: { id: "datos", label: "Datos", mostrarTitulo, tipo, size: size_6, variant, p, shadow, visible: verificarSiGrupoEsVisible("datos") },
      transporte: {
        id: "transporte",
        label: "Transporte",
        mostrarTitulo,
        tipo,
        size: tipoFormulario !== "filtro" ? size_6 : size_6,
        variant,
        p,
        shadow,
        visible: verificarSiGrupoEsVisible("transporte"),
      },
      carga: { id: "carga", label: "Carga", mostrarTitulo, tipo, size: size_6, variant, p, shadow, visible: verificarSiGrupoEsVisible("carga") },
      terminosComercio: { id: "terminosComercio", label: "Terminos de comercio", mostrarTitulo, tipo, size: size_6, variant, p, shadow, visible: verificarSiGrupoEsVisible("terminosComercio") },
      origen: { id: "origen", label: "Origen", mostrarTitulo, tipo, size: size_6, variant, p, shadow, visible: verificarSiGrupoEsVisible("origen") },
      destino: { id: "destino", label: "Destino", mostrarTitulo, tipo, size: size_6, variant, p, shadow, visible: verificarSiGrupoEsVisible("destino") },
    };
  }, [themeMode, tipoFormulario, verificarSiGrupoEsVisible]);

  const catalogoInputs = useMemo(() => {
    const size_12 = tipoFormulario !== "filtro" ? 12 : undefined;
    const size_6 = tipoFormulario !== "filtro" ? 6 : undefined;
    const size_4 = 4;

    const select_12 = { tipo: "select", size: size_12 };
    const select_6 = { tipo: "select", size: size_6 };
    const select_4 = { tipo: "select", size: size_4 };

    return {
      fecha: {
        id: "fecha",
        label: "Fecha",
        tipo: "datetime",
        readonly: verificarSiEsLectura("fecha"),
        requerido: verificarSiEsRequerido("fecha"),
        visible: verificarSiEsVisible("fecha"),
        size: size_12,
      },
      empresa: {
        id: "empresa",
        label: "Empresa",
        options: catalogosProcesados.empresas,
        readonly: verificarSiEsLectura("empresa"),
        requerido: verificarSiEsRequerido("empresa"),
        visible: verificarSiEsVisible("centroCosto"),
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
      cliente: {
        id: "cliente",
        label: "Cliente",
        options: catalogosProcesados.clientes,
        fetchOptions: fetchOptionsClientes,
        readonly: verificarSiEsLectura("cliente"),
        requerido: verificarSiEsRequerido("cliente"),
        visible: verificarSiEsVisible("cliente"),
        actions: [
          {
            id: "clientes",
            icono: "c-suma",
            enabled: !verificarSiEsLectura("cliente"),
            label: "Crear Pre Cliente",
            onClick: () => setOpenCrearPreCliente(true),
          },
        ],
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
      contacto_estacion: {
        id: "contacto_estacion",
        label: "Contacto Estacion",
        options: catalogosProcesados.contacto_estacion,
        tipo: "text",
        readonly: verificarSiEsLectura("contacto_estacion"),
        requerido: verificarSiEsRequerido("contacto_estacion"),
        visible: verificarSiEsVisible("contacto_estacion"),
        ...size_6,
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
      ciudadOrigen: {
        id: "ciudadOrigen",
        label: "Origen",
        options: ciudadesOrigen,
        readonly: verificarSiEsLectura("ciudadOrigen"),
        requerido: verificarSiEsRequerido("ciudadOrigen"),
        visible: verificarSiEsVisible("ciudadOrigen"),
        ...select_12,
      },
      paisDestino: {
        id: "paisDestino",
        label: "País de destino",
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
      ciudadDestino: {
        id: "ciudadDestino",
        label: "Destino",
        options: ciudadesDestino,
        readonly: verificarSiEsLectura("ciudadDestino"),
        requerido: verificarSiEsRequerido("ciudadDestino"),
        visible: verificarSiEsVisible("ciudadDestino"),
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

      carrier: {
        id: "carrier",
        label: "Carrier",

        options: catalogosProcesados.proveedores,
        fetchOptions: fetchOptionsProveedores,
        readonly: verificarSiEsLectura("carrier"),
        requerido: verificarSiEsRequerido("carrier"),
        visible: verificarSiEsVisible("carrier"),

        ...select_6,
      },
    };
  }, [
    tipoFormulario,
    verificarSiEsLectura,
    verificarSiEsRequerido,
    verificarSiEsVisible,
    catalogosProcesados.empresas,
    catalogosProcesados.centrosCosto,
    catalogosProcesados.clientes,
    catalogosProcesados.tiposTransporte,
    catalogosProcesados.tiposCarga,
    catalogosProcesados.clasificacionesCarga,
    catalogosProcesados.incoterms,
    catalogosProcesados.tiposPago,
    catalogosProcesados.estaciones,
    catalogosProcesados.contacto_estacion,
    catalogosProcesados.paises,
    catalogosProcesados.tiposPuntoEnlace,
    catalogosProcesados.proveedores,
    fetchOptionsClientes,
    fetchOptionsProveedores,
    contactos,
    tiposServicioSeleccionables,
    fetchOptionsEstaciones,
    puntosEnlaceOrigen,
    puntosEnlaceDestino,
  ]);

  const data = useMemo(() => {
    const grupos = Object.values(catalogoGrupos);
    const inputs = [
      { grupoId: "datos", ...catalogoInputs?.fecha, val: valores?.fecha },
      { grupoId: "datos", ...catalogoInputs?.empresa, val: valores?.empresa },
      {
        grupoId: "datos",
        ...catalogoInputs?.centroCosto,
        val: valores?.centroCosto,
      },
      { grupoId: "datos", ...catalogoInputs?.descripcion, val: valores?.descripcion },
      { grupoId: "datos", ...catalogoInputs?.cliente, val: valores?.cliente },
      {
        grupoId: "datos",
        ...catalogoInputs?.contacto,
        val: valores?.contacto,
        isLoading: isLoadingContactos,
      },

      { grupoId: "datos", ...catalogoInputs?.carrier, val: valores?.carrier },

      { grupoId: "datos", ...catalogoInputs?.estado, val: valores?.estado },
      {
        grupoId: "transporte",
        ...catalogoInputs?.tipoTransporte,
        val: valores?.tipoTransporte,
      },
      {
        grupoId: "transporte",
        ...catalogoInputs?.tipoServicio,
        val: valores?.tipoServicio,
      },
      {
        grupoId: "carga",
        ...catalogoInputs?.tipoCarga,
        val: valores?.tipoCarga,
      },
      {
        grupoId: "carga",
        ...catalogoInputs?.clasificacionCarga,
        val: valores?.clasificacionCarga,
      },
      {
        grupoId: "terminosComercio",
        ...catalogoInputs?.incoterm,
        val: valores?.incoterm,
      },
      {
        grupoId: "terminosComercio",
        ...catalogoInputs?.tipoPago,
        val: valores?.tipoPago,
      },
      {
        grupoId: "terminosComercio",
        ...catalogoInputs?.estacion,
        val: valores?.estacion,
      },
      {
        grupoId: "terminosComercio",
        ...catalogoInputs?.contacto_estacion,
        val: valores?.contacto_estacion,
      },
      {
        grupoId: "origen",
        ...catalogoInputs?.paisOrigen,
        val: valores?.paisOrigen,
      },
      ...[
        tipoOrigenVsTipoTransporte[valores?.tipoTransporte?.label] !== "CIUDAD"
          ? {
              grupoId: "origen",
              ...catalogoInputs?.tipoPuntoEnlaceOrigen,
              val: valores?.tipoPuntoEnlaceOrigen,
            }
          : undefined,
      ].filter(Boolean),
      tipoOrigenVsTipoTransporte[valores?.tipoTransporte?.label] !== "CIUDAD"
        ? {
            grupoId: "origen",
            ...catalogoInputs?.puntoEnlaceOrigen,
            val: valores?.puntoEnlaceOrigen,
          }
        : {
            grupoId: "origen",
            ...catalogoInputs?.ciudadOrigen,
            val: valores?.ciudadOrigen,
          },
      {
        grupoId: "destino",
        ...catalogoInputs?.paisDestino,
        val: valores?.paisDestino,
      },
      ...[
        tipoOrigenVsTipoTransporte[valores?.tipoTransporte?.label] !== "CIUDAD"
          ? {
              grupoId: "destino",
              ...catalogoInputs?.tipoPuntoEnlaceDestino,
              val: valores?.tipoPuntoEnlaceDestino,
            }
          : undefined,
      ].filter(Boolean),
      tipoOrigenVsTipoTransporte[valores?.tipoTransporte?.label] !== "CIUDAD"
        ? {
            grupoId: "destino",
            ...catalogoInputs?.puntoEnlaceDestino,
            val: valores?.puntoEnlaceDestino,
          }
        : {
            grupoId: "destino",
            ...catalogoInputs?.ciudadDestino,
            val: valores?.ciudadDestino,
          },
    ];
    return { grupos, inputs };
  }, [catalogoInputs, catalogoGrupos, valores, isLoadingContactos]);

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
            console.log("Se seleccionó aeropuerto y el país es Guatemala, se asignó el punto de enlace GUA - AEROPUERTO LA AURORA", next["puntoEnlaceOrigen"]);
          }
        }

        if (id === "tipoPago") {
          let tipoPagoDefault = findBy(catalogosProcesados.tiposPago, "cod_tipo", 131);
          if (!val) {
            val = tipoPagoDefault;
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
    [catalogosProcesados.tiposPuntoEnlace, currentCentroCosto?.cod_cc, currentEmpresa?.cod_empresa, reglasCampos],
  );

  const onSubmitFormulario = useCallback(async () => {
    if (onCotizacionCreada) {
      await api.post("api/appweb/insertar-cotizacion-cabecera", valoresSoloCodigos).then(({ data }) => {
        setReconsultar(true);
        onCotizacionCreada({
          ...valoresSoloCodigos,
          cod_cotizacion_cabecera: data.cod_cotizacion_cabecera,
          // cod_tarifaplantilla: data.cod_tarifaplantilla,
        });
      });
    } else {
      tipoFormulario === "filtro" ? handleFiltrar(valoresSoloCodigos) : tipoFormulario === "ingreso" ? handleInsertar(valoresSoloCodigos) : handleActualizar(valoresSoloCodigos);
      setReconsultar(true);
    }
  }, [handleActualizar, handleFiltrar, handleInsertar, tipoFormulario, valoresSoloCodigos, onCotizacionCreada]);

  useEffect(() => {
    if (clearForm) {
      setValores((prev) => ({ ...prev, ...valoresIniciales }));
      setClearForm(false);
    }
  }, [clearForm]);

  useEffect(() => {
    if (!valores?.cliente) {
      clearPlantillasCliente();
      return;
    }
    if (!valores?.empresa) return;
    if (!valores?.centroCosto) return;
    obtenerContactosDeEntidad({
      ...valores?.cliente,
      cod_cc: valores?.cod_cc,
      cod_emp: valores?.cod_empresa,
    });
    obtenerPlantillaDeCliente({
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

  useEffect(() => {
    if (!noPlantilla) return;
    if (tipoFormulario !== "ingreso") return;
    if (plantillas.length) setOpenSeleccionarPlantilla(true);
  }, [plantillas.length]);

  useEffect(() => {
    if (!plantillasCliente) return;
    if (!setPlantillaSeleccionada) return;
    setPlantillaSeleccionada(plantillasCliente);
  }, [plantillasCliente, setPlantillaSeleccionada]);

  const clienteConsultado = useCallback(async () => {
    if (!valores?.entidad_id) return 1;
    setTextoCarta("Cargando Cliente");
    const a = await obtenerClienteById({ entidad_id: valores.entidad_id });
    return a;
  }, [valores?.entidad_id, obtenerClienteById]);

  useEffect(() => {
    if (!valores?.entidad_id) return;
    const a = catalogosProcesados.clientes?.find((c) => c.value === valores.entidad_id);
    if (a) {
      setValores((v) => ({ ...v, cliente: a }));
      return;
    }
    clienteConsultado().then((b) => {
      if (b) {
        setValores((v) => ({ ...v, cliente: b }));

        catalogosProcesados.clientes?.push(b);
      }
    });
  }, [catalogosProcesados.clientes, valores?.entidad_id, clienteConsultado]);

  const carrierPlantillaConsultado = useCallback(
    async (plantilla) => {
      if (!plantilla) return;
      if (!plantilla.carrier_id) return 1;
      setTextoCarta("Cargando Proveedor");
      const a = await obtenerProveedorById({ entidad_id: plantilla.carrier_id });
      return a;
    },
    [obtenerProveedorById],
  );

  useEffect(() => {
    if (!plantillas.length) return;
    plantillas.forEach(async (plantilla, ind) => {
      const a = catalogosProcesados.proveedores?.find((c) => c.value === plantilla.carrier_id);
      if (a) {
        plantillas[ind] = { ...plantillas[ind], carrier: a };
        return;
      }
      carrierPlantillaConsultado(plantilla).then((b) => {
        if (b) {
          plantillas[ind] = { ...plantillas[ind], carrier: b };

          catalogosProcesados.proveedores?.push(b);
        }
      });
    });
  }, [catalogosProcesados.proveedores, plantillas, carrierPlantillaConsultado]);

  const estacionConsultada = useCallback(async () => {
    if (!valores?.entidad_id_estacion) return 1;
    setTextoCarta("Cargando Estacion");
    const a = await obtenerEstacionById({ entidad_id: valores.entidad_id_estacion });
    return a;
  }, [valores?.entidad_id_estacion, obtenerEstacionById]);

  useEffect(() => {
    if (!valores?.entidad_id_estacion) return;
    const a = catalogosProcesados.estaciones?.find((c) => c.value === valores.entidad_id_estacion);
    if (a) {
      setValores((v) => ({ ...v, estacion: a }));
      return;
    }
    estacionConsultada().then((b) => {
      if (b) {
        setValores((v) => ({ ...v, estacion: b }));

        catalogosProcesados.estaciones?.push(b);
      }
    });
  }, [catalogosProcesados.estaciones, valores?.entidad_id_estacion, estacionConsultada]);

  useEffect(() => {
    if (tipoFormulario === "lectura") {
      setEsValido(true);
      return;
    }

    const faltantes = [];

    Object.keys(valores).map((id) => {
      const requerido = verificarSiEsRequerido(id);

      if (requerido && !valores[id]) faltantes.push(id);
    });

    setEsValido(!faltantes.length);
  }, [setEsValido, tipoFormulario, valores, verificarSiEsRequerido]);

  const generarItemCardPlantilla = ({ label, item }) => {
    return (
      <Grid container columnSpacing={1} sx={{ borderBottom: 1, borderColor: "gray.main" }}>
        <Grid size={6}>
          <Typography color="primary" variant="caption">
            {label}:
          </Typography>
        </Grid>
        <Typography variant="body2">{item}</Typography>
      </Grid>
    );
  };

  return (
    <Grid sx={{}}>
      <FormularioComponent
        data={data}
        onInput={onInput}
        botones={
          tipoFormulario !== "lectura"
            ? {
                agregar: { variant: "contained", visible: tipoFormulario === "ingreso", onClick: onSubmitFormulario },
                guardar: { variant: "contained", color: "accent", textColor: "white", visible: tipoFormulario === "edicion", onClick: onSubmitFormulario },
                filtrar: { variant: "contained", visible: tipoFormulario === "filtro", icono: "c-lupa", onClick: onSubmitFormulario },
              }
            : { agregar: { visible: false } }
        }
        isLoading={isLoading}
      />

      <DialogComponent
        openDialog={openCrearPreCliente}
        handleClose={() => setOpenCrearPreCliente(false)}
        titulo="Crear Contacto"
        width="80vw"
        content={
          <Grid sx={{ display: "flex", flexDirection: "column", px: 3 }}>
            <FormularioCompletoEntidad
              id="new"
              tipo={5}
              cliente={valores?.cliente}
              catalogos={catalogosProcesados}
              onCreate={() => {
                obtenerContactosDeEntidad({ ...valores?.cliente, cod_cc: valores?.cod_cc, cod_emp: valores?.cod_empresa });
                setOpenCrearPreCliente(false);
              }}
              onActividad
            />
          </Grid>
        }
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
                obtenerContactosDeEntidad({ ...valores?.cliente, cod_cc: valores?.cod_cc, cod_emp: valores?.cod_empresa });
                setOpenCrearContacto(false);
              }}
              onActividad
            />
          </Grid>
        }
      />

      <DialogComponent
        openDialog={openSeleccionarPlantilla}
        handleClose={() => setOpenSeleccionarPlantilla(false)}
        titulo="Seleccionar"
        width="50vw"
        content={
          <Grid sx={{ display: "flex", flexDirection: "column", px: 3 }}>
            <Typography variant="h6" mb={2}>
              Se han encontrado coincidencias para este cliente, ¿Desea cargar una existente?
            </Typography>
            <Grid container spacing={2}>
              {plantillas.map((plantilla) => (
                <Grid size={{ xs: 12, md: 4 }} key={plantilla?.cod_tarifaplantilla}>
                  <Card
                    sx={{ p: 2, display: "flex", flexDirection: "column", height: "100%", "&:hover": { bgcolor: "primary.main_10", cursor: "pointer" } }}
                    onClick={() => {
                      setValores((prev) => {
                        const valoresPlantilla = Object.fromEntries(
                          Object.entries(reglasCampos).map(([key, regla]) => {
                            const codigo = plantilla[regla.cod];

                            if (!codigo) return [key, null];

                            const catalogo = key === "contacto" ? contactos : catalogosProcesados[regla.catalogo];

                            const itemEncontrado = findBy(catalogo, "value", codigo);

                            return [
                              key,
                              itemEncontrado ?? {
                                value: codigo,
                                label: plantilla?.nombre_contacto ?? plantilla?.contacto ?? String(codigo),
                              },
                            ];
                          }),
                        );

                        return {
                          ...prev,
                          ...valoresPlantilla,
                          fecha: new Date(),
                          cod_estado: CODS_ESTADOS.ACTIVO,
                        };
                      });

                      setPlantillasCliente(plantilla);
                      setOpenSeleccionarPlantilla(false);
                    }}
                  >
                    {generarItemCardPlantilla({ label: "Tarifa de Cliente", item: plantilla?.cod_tarifaplantilla ?? "" })}
                    {generarItemCardPlantilla({ label: "Descripción", item: plantilla?.descripcion ?? "" })}
                    {generarItemCardPlantilla({ label: "Tipo de transporte", item: findBy(catalogosProcesados.tiposTransporte, "value", plantilla.cod_tipo_transporte)?.label ?? "" })}
                    {generarItemCardPlantilla({ label: "Tipo de servicio", item: findBy(catalogosProcesados.tiposServicio, "colad_servicio", plantilla.cod_servicio)?.label ?? "" })}
                    {generarItemCardPlantilla({
                      label: "Ruta",
                      item: `[${findBy(catalogosProcesados.puntosEnlace, "cod_puntoenlace", plantilla.cod_puntoenlace_origen)?.codigo ?? ""}] - [${findBy(catalogosProcesados.puntosEnlace, "cod_puntoenlace", plantilla.cod_puntoenlace_destino)?.codigo ?? ""}]`,
                    })}
                    {plantilla?.carrier ? generarItemCardPlantilla({ label: "Carrier", item: plantilla?.carrier?.label ?? "" }) : null}
                    {/* {generarItemCardPlantilla({
                      label: "pre",
                      item: (
                        <Typography variant="pre">
                          <pre>{JSON.stringify(plantilla, null, 2)}</pre>
                        </Typography>
                      ),
                    })} */}
                  </Card>
                </Grid>
              ))}
              <Grid size="auto" width="100%">
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => {
                    setValores((prev) => ({ ...prev, fecha: new Date() }));
                    setPlantillasCliente(null);
                    setOpenSeleccionarPlantilla(false);
                  }}
                >
                  No seleccionar
                </Button>
              </Grid>
            </Grid>
          </Grid>
        }
      />

      <LoaderComponent open={isLoadingEntidad} texto={textoCarga} />

      <Grid container textAlign="left">
        {/* <pre>{JSON.stringify(catalogosProcesados.clientes.length, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(catalogosProcesados.clientes[catalogosProcesados.clientes.length - 1], null, 2)}</pre> */}

        {/* <pre>{JSON.stringify(Object.keys(catalogosProcesados), null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(plantillas.length, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(plantillas, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(catalogosProcesados.tiposPago, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(valoresSoloCodigos, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(catalogosProcesados.clientes?.length, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(catalogosProcesados.tiposPago, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(catalogosProcesados, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(reglasCampos, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(valores, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(valoresIniciales, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(reglasCampos, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(catalogosProcesados, null, 2)}</pre> */}
        {/* <pre>!isLoading: {!isLoading ? "true" : "false"}</pre> */}
        {/* <pre>{JSON.stringify(contactos, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(defaultValues, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(defaultValuesProcesados, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(catalogosProcesados.centrosCosto, null, 2)}</pre> */}
      </Grid>
    </Grid>
  );
};

FormularioCotizacion.propTypes = {
  tipoFormulario: PropTypes.string.isRequired,
  defaultValues: PropTypes.object,
  catalogos: PropTypes.object,
  filtrarEntidades: PropTypes.func,
  handleFiltrar: PropTypes.func,
  handleInsertar: PropTypes.func,
  handleActualizar: PropTypes.func,
  inputsToHide: PropTypes.array,
  groupsToHide: PropTypes.array,
  inputsReadOnly: PropTypes.array,
  inputsNoObligatorios: PropTypes.array,
  isLoading: PropTypes.bool,
  clearForm: PropTypes.bool,
  setClearForm: PropTypes.func,
  reconsultar: PropTypes.bool,
  setReconsultar: PropTypes.func,
  onCotizacionCreada: PropTypes.func,
  setPlantillaSeleccionada: PropTypes.func,
  setEsValido: PropTypes.func,
  noPlantilla: PropTypes.bool,
};

export default FormularioCotizacion;
