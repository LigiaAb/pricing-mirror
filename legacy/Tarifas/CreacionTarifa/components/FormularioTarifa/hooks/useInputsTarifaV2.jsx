import React from "react";
import { useSelector } from "react-redux";
import { CODS_ESTADOS } from "@/constants/estados";
import { convertClasificacionServicio, REL_TIPOS_CLASIFICACION_TARIFAS } from "@/constants/clasifacionesTarifas";
import moment from "moment";

export const DEFATULT_TODOS_VALUE = null;

const COD_RUBRO_SCALE = 134;

const DEFAULTS_SCALE = {
  tipoClasificacion: { catalogo: "tiposClasificacionServicio", value: 274 },
  tipoServicio: { catalogo: "tiposServicio", value: null },
  categoriaTransporte: { catalogo: "categoriasTransporte", value: null },
  tipoCarga: { catalogo: "tiposCarga", value: null },
  clasificacionCarga: { catalogo: "clasificacionesCarga", value: null },
  tipoPago: { catalogo: "tiposPago", value: 131 },
  tipoAplicacion: { catalogo: "tiposAplicacion", value: null },
  tipoCalculo: { catalogo: "tiposCalculo", value: 91 },
  metodoCalculo: { catalogo: "metodosCalculo", value: 342 },
  tipoTarifa: { catalogo: "tiposTarifa", value: 97 },
};

export const CATALOGOS_AGREGAR_TODOS = {
  tiposServicio: true,
  tiposAplicacion: true,
  clasificacionesCarga: true,
  tiposCarga: true,
  categoriasTransporte: true,
};

export const CAMPOS_REQUERIDOS = [
  "fecha",
  "empresa",
  "centroCosto",
  "cliente",
  "contacto",
  "tipoTransporte",
  "tipoServicio",
  "tipoCarga",
  "clasificacionCarga",
  "tipoPago",
  "paisOrigen",
  "tipoPuntoEnlaceOrigen",
  "puntoEnlaceOrigen",
  "paisDestino",
  "tipoPuntoEnlaceDestino",
  "puntoEnlaceDestino",
  "proveedor",
];

const tipoOrigenVsTipoTransporte = {
  AEREO: "AEROPUERTO",
  MARITIMO: "PUERTO",
  TERRESTRE: "ADUANA",
};

const findBy = (arr, key, value) => arr?.find((e) => e?.[key] === value) ?? null;

export const getPlainValue = (value) => {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value; // ← antes de checar typeof object
  if (typeof value === "object") return value?.value ?? null;
  return value;
};

export const getTodosValueById = (id, defaultTodosValue = DEFATULT_TODOS_VALUE) => {
  if (typeof defaultTodosValue === "object" && defaultTodosValue !== null) {
    return defaultTodosValue?.[id];
  }

  return defaultTodosValue;
};

export const buildTarifaFieldRules = ({ catalogosProcesados, currentEmpresa, currentCentroCosto }) => ({
  empresa: {
    cod: "cod_empresa",
    reset: ["centroCosto", "cod_cc"],
    default: catalogosProcesados?.empresas?.find((e) => e.cod_empresa === currentEmpresa?.cod_empresa) ?? null,
    catalogo: "empresas",
    payload: ["servicio"],
    readonly: true,
  },
  centroCosto: {
    cod: "cod_cc",
    require: ["empresa"],
    default: catalogosProcesados?.centrosCosto?.find((cc) => cc.cod_empresa_cc === currentEmpresa?.cod_empresa && cc.cod_cc === currentCentroCosto?.cod_cc) ?? null,
    catalogo: "centrosCosto",
    payload: ["servicio"],
  },
  estado: { cod: "cod_estado", payload: ["servicio", "metodo"] },
  servicio: { cod: "cod_servicio", payload: ["servicio", "metodo"] },
  rubro: { cod: "cod_rubro", catalogo: "rubros", payload: ["servicio"] },
  proveedor: { cod: "entidad_id", catalogo: "proveedoresNombre", payload: ["servicio"] },

  nombre: { cod: "nombre", payload: ["servicio"] },
  siglas: { cod: "siglas", payload: ["servicio"] },

  tipoTransporte: {
    cod: "cod_tipo_transporte",
    reset: ["tipoServicio", "cod_tipo_servicio", "tipoCalculo", "cod_tipo_calculo", "tipoClasificacion", "clasificacion", "categoriaTransporte", "categoria"],
    catalogo: "tiposTransporte",
    payload: ["servicio"],
  },
  tipoServicio: {
    cod: "cod_tipo_servicio",
    reset: ["tipoAplicacion", "cod_tipo_aplicacion"],
    require: ["tipoTransporte"],
    catalogo: "tiposServicio",
    payload: ["servicio"],
  },
  tipoClasificacion: {
    cod: "clasificacion",
    require: ["tipoTransporte"],
    catalogo: "tiposClasificacionServicio",
    payload: ["servicio"],
  },
  categoriaTransporte: {
    cod: "categoria_transporte",
    require: ["tipoTransporte"],
    catalogo: "categoriasTransporte",
    payload: ["servicio"],
  },
  obligatorio: {
    cod: "obligatorio",
    require: ["tipoClasificacion"],
    visibleWhen: { field: "tipoClasificacion", key: "label", value: "DUE AGENT" },
    payload: ["servicio"],
  },
  clasificacionCarga: {
    cod: "cod_clasificacion_carga",
    catalogo: "clasificacionesCarga",
    payload: ["servicio"],
  },
  tipoCarga: {
    cod: "cod_tipo_carga",
    catalogo: "tiposCarga",
    payload: ["servicio"],
  },
  incoterm: {
    cod: "incoterm_id",
    catalogo: "incoterms",
    payload: ["servicio"],
  },
  tipoPago: {
    cod: "cod_tipo_pago",
    default: catalogosProcesados?.tiposPago?.find((tp) => tp.value === 131) ?? null,
    catalogo: "tiposPago",
    payload: ["servicio"],
  },
  tipoAplicacion: {
    cod: "cod_tipo_aplicacion",
    catalogo: "tiposAplicacion",
    payload: ["servicio"],
  },
  tipoCalculo: {
    cod: "cod_tipo_calculo",
    catalogo: "tiposCalculo",
    payload: ["servicio"],
  },
  servicioInterno: {
    cod: "servicio_interno",
    payload: ["servicio"],
    default: null,
  },

  metodoCalculo: {
    cod: "cod_tipo",
    catalogo: "metodosCalculo",
    payload: ["metodo"],
  },
  aplicaOrigenesDestinos: {
    cod: "todos_los_paises",
    payload: ["metodo"],
    default: true,
  },
  aplicaCommodities: {
    cod: "todos_los_commodities",
    payload: ["metodo"],
    default: true,
  },
  aplicaTodosCientes: { cod: "todos_los_clientes", payload: ["metodo"], default: undefined },
  tipoTarifa: {
    cod: "cod_tipo_tarifa",
    catalogo: "tiposTarifa",
    payload: ["metodo"],
    default: catalogosProcesados?.tiposTarifa?.find((i) => i.value === 97) ?? null,
  },

  metodo: { cod: "cod_metodo", payload: ["metodo"] },

  fechaInicio: { cod: "fecha_inicial", tipo: "datetime", payload: ["metodo"], default: new Date() },
  fechaFin: { cod: "fecha_final", tipo: "datetime", payload: ["metodo"] },
  fechaCreacion: { cod: "fecha_creacion", tipo: "datetime", payload: ["metodo"], default: new Date() },
  fechaModificacion: { cod: "ultima_fecha_modificacion", tipo: "datetime", payload: ["metodo"], default: new Date() },
  usuario: { cod: "ultimo_usuario", payload: ["metodo"] },
  minimo: { cod: "minimo", visibleWhen: { field: "rubro", key: "value", value: COD_RUBRO_SCALE }, payload: ["metodo"] },
});

export const buildReadonlyFieldsFromPayload = ({ filtros = {}, reglasCampos = {}, exceptions = {} }) => {
  const readonly = [];

  Object.entries(reglasCampos).forEach(([fieldId, regla]) => {
    const cod = regla?.cod;
    if (!cod) return;

    const valor = filtros?.[cod];

    if (valor === undefined || valor === null) return;

    if (cod === "cod_tipo_pago" && valor === 131) return;

    readonly.push(fieldId);
  });

  Object.entries(exceptions).forEach(([fieldId, validator]) => {
    if (typeof validator !== "function") return;
    if (validator(filtros)) readonly.push(fieldId);
  });

  return [...new Set(readonly)];
};

export const mapServicioConCatalogos = ({ item, catalogos }) => {
  const proveedorId = item?.entidad_id ?? item?.cod_proveedor ?? null;
  const categoriaId = item?.categoria ?? item?.categoria_transporte ?? null;

  const rubro = catalogos?.rubros?.find((r) => r.value === item?.cod_rubro) ?? null;
  const tipoServicio = catalogos?.tiposServicio?.find((t) => t.value === item?.cod_tipo_servicio) ?? null;
  const tipoAplicacion = catalogos?.tiposAplicacion?.find((t) => t.value === item?.cod_tipo_aplicacion) ?? null;
  const estado = catalogos?.estados?.find((e) => e.value === item?.cod_estado) ?? null;

  const empresa = catalogos?.empresas?.find((e) => e.value === item?.cod_empresa) ?? null;
  const centroCosto = catalogos?.centrosCosto?.find((c) => c.value === item?.cod_cc) ?? null;
  const proveedor = catalogos?.proveedoresNombre?.find((p) => p.value === proveedorId) ?? null;
  const tipoTransporte = catalogos?.tiposTransporte?.find((t) => t.value === item?.cod_tipo_transporte) ?? null;
  const tipoClasificacion = catalogos?.tiposClasificacionServicio?.find((c) => c.value === item?.clasificacion) ?? null;
  const categoriaTransporte = catalogos?.categoriasTransporte?.find((t) => t.value === categoriaId) ?? null;
  const clasificacionCarga = catalogos?.clasificacionesCarga?.find((c) => c.value === item?.cod_clasificacion_carga) ?? null;
  const tipoCarga = catalogos?.tiposCarga?.find((t) => t.value === item?.cod_tipo_carga) ?? null;
  const tipoPago = catalogos?.tiposPago?.find((t) => (item?.cod_tipo_pago ? t.value === item?.cod_tipo_pago : t.value === 131)) ?? null;
  const incoterm = catalogos?.incoterms?.find((t) => t.value === item?.incoterm_id) ?? null;
  const tipoCalculo = catalogos?.tiposCalculo?.find((t) => t.value === item?.cod_tipo_calculo) ?? null;
  const metodoCalculo = catalogos?.metodosCalculo?.find((t) => t.value === item?.cod_tipo) ?? null;
  const tipoTarifa = catalogos?.tiposTarifa?.find((t) => t.value === item?.cod_tipo_tarifa) ?? null;
  const metodo = catalogos?.metodos?.find((t) => t.cod_servicio === item?.cod_servicio) ?? null;

  const minimo = item?.minimo ?? 0;

  const fechaInicio = item?.fecha_inicial ? new Date(item.fecha_inicial) : null;
  const fechaFin = item?.fecha_final ? new Date(item.fecha_final) : null;

  const obj = {
    ...item,
    ...metodo,
    id: `${item?.cod_servicio ?? ""} - ${item?.descripcion ?? item?.nombre ?? ""}`,
    rubro,
    rubro_nombre: rubro?.label ?? "",
    tipoServicio,
    tipoServicio_nombre: tipoServicio?.label ?? "",
    tipoAplicacion,
    tipoAplicacion_nombre: tipoAplicacion?.label ?? "",
    estado,
    estado_nombre: estado?.label ?? "",
    empresa,
    empresa_nombre: empresa?.label ?? "",
    centroCosto,
    centroCosto_nombre: centroCosto?.label ?? "",
    proveedor,
    proveedor_nombre: proveedor?.label ?? "",
    entidad_nombre: proveedor?.label ?? item?.entidad_nombre ?? "",
    tipoTransporte,
    tipoTransporte_nombre: tipoTransporte?.label ?? "",
    tipoClasificacion,
    tipoClasificacion_nombre: tipoClasificacion?.label ?? "",
    categoriaTransporte,
    categoriaTransporte_nombre: categoriaTransporte?.label ?? "",
    clasificacionCarga,
    clasificacionCarga_nombre: clasificacionCarga?.label ?? "",
    tipoCarga,
    tipoCarga_nombre: tipoCarga?.label ?? "",
    tipoPago,
    tipoPago_nombre: tipoPago?.label ?? "",
    incoterm,
    incoterm_nombre: incoterm?.label ?? "",
    tipoCalculo,
    tipoCalculo_nombre: tipoCalculo?.label ?? "",
    metodoCalculo,
    metodoCalculo_nombre: metodoCalculo?.label ?? "",
    tipoTarifa,
    tipoTarifa_nombre: tipoTarifa?.label ?? "",
    aplicaOrigenesDestinos: item?.todos_los_paises,
    aplicaCommodities: item?.todos_los_commodities,
    fechaInicio,
    fechaFin,
    metodo,
    minimo,
  };

  return obj;
};

export default function useTarifaFormulario({
  tipoFormulario,
  defaultValues,
  catalogosProcesados,
  fetchOptionsProveedores,
  isLoading = false,
  inputsReadOnly = [],
  inputsReadOnlyScale = [],
  inputsToHide = [],
  groupsToHide = [],
  defaultTodosValue = DEFATULT_TODOS_VALUE,
  obtenerProveedorById = () => {},
  validarSiTieneMetodoDeCalculo = false,
}) {
  const { themeMode } = useSelector((state) => state.theme);
  const { currentEmpresa, currentCentroCosto } = useSelector((state) => state.menu);
  const { cod_usuario: defaultCodUsuario } = useSelector((state) => state.auth);

  const [valores, setValores] = React.useState(defaultValues ?? {});

  const esScale = React.useMemo(() => valores?.cod_rubro === COD_RUBRO_SCALE, [valores?.cod_rubro]);

  const tipoForm = validarSiTieneMetodoDeCalculo ? "lectura" : tipoFormulario;

  const reglasCampos = React.useMemo(
    () =>
      buildTarifaFieldRules({
        catalogosProcesados,
        currentEmpresa,
        currentCentroCosto,
      }),
    [catalogosProcesados, currentEmpresa, currentCentroCosto],
  );

  const aplicarDefaultsScale = React.useCallback(
    (valoresActuales) => {
      const siguiente = { ...valoresActuales };

      Object.entries(DEFAULTS_SCALE).forEach(([campo, { catalogo, value }]) => {
        console.log(catalogo, catalogosProcesados?.[catalogo]);
        const opcion = catalogosProcesados?.[catalogo]?.find((item) => String(item.value) === String(value)) ?? null;

        siguiente[campo] = opcion;

        const codCampo = reglasCampos?.[campo]?.cod;

        if (codCampo) {
          siguiente[codCampo] = getPlainValue(opcion);
        }
      });

      return siguiente;
    },
    [catalogosProcesados, reglasCampos],
  );

  const obtenerCatalogoById = React.useCallback(
    (id) => {
      const catalogoId = reglasCampos?.[id]?.catalogo;
      if (!catalogoId) return [];
      return catalogosProcesados?.[catalogoId] ?? [];
    },
    [catalogosProcesados, reglasCampos],
  );

  const obtenerDefaultTodos = React.useCallback(
    (id, catalogo) => {
      const valueTodos = getTodosValueById(id, defaultTodosValue);
      if (!Array.isArray(catalogo)) return null;
      return catalogo.find((c) => c.value === valueTodos) ?? null;
    },
    [defaultTodosValue],
  );

  const tiposServicioSeleccionables = React.useMemo(() => {
    const valueTodos = getTodosValueById("tipoServicio", defaultTodosValue);

    return (catalogosProcesados?.tiposServicio || []).filter((ts) => (ts.cod_tipo_padre === valores?.tipoTransporte?.cod_tipo && ts.cod_estado === CODS_ESTADOS.ACTIVO) || ts.value === valueTodos);
  }, [catalogosProcesados?.tiposServicio, valores?.tipoTransporte, defaultTodosValue]);

  const tiposClasificacionSeleccionables = React.useMemo(() => {
    const normalizarTexto = (texto) =>
      String(texto ?? "")
        .trim()
        .toLowerCase();

    const rubroLabel = normalizarTexto(valores?.rubro?.label);

    const rubroEsFlete = rubroLabel.includes("flete");
    const rubroEsExpress = rubroLabel.includes("express");

    return (catalogosProcesados?.tiposClasificacionServicio || []).filter((td) => {
      const esDelTipoTransporte = td.cod_tipo_padre === valores?.tipoTransporte?.cod_tipo;
      if (!esDelTipoTransporte) return false;

      const clasificacionLabel = normalizarTexto(td.label);

      const clasificacionEsFlete = clasificacionLabel === "flete";
      const clasificacionEsFleteExpress = clasificacionLabel === "flete express";

      // NUEVO: si el rubro es flete express, solo permitir "FLETE EXPRESS"
      if (rubroEsFlete && rubroEsExpress) {
        return clasificacionEsFleteExpress;
      }

      // NUEVO: si el rubro es flete normal, solo permitir "FLETE"
      if (rubroEsFlete) {
        return clasificacionEsFlete;
      }

      // NUEVO: si el rubro no es flete, quitar "FLETE" y "FLETE EXPRESS"
      return !clasificacionEsFlete && !clasificacionEsFleteExpress;
    });
  }, [catalogosProcesados?.tiposClasificacionServicio, valores?.tipoTransporte, valores?.rubro]);

  const metodosCalculoSeleccionables = React.useMemo(() => {
    return esScale ? (catalogosProcesados?.metodosCalculo || []).filter((td) => td.value === 342) : (catalogosProcesados?.metodosCalculo || []).filter((td) => td.value !== 342);
  }, [catalogosProcesados?.metodosCalculo, esScale]);

  const valoresIniciales = React.useMemo(
    () => ({
      ...Object.fromEntries(Object.entries(reglasCampos).map(([key, regla]) => [key, regla?.default ?? null])),
      tipoServicio: obtenerDefaultTodos("tipoServicio", obtenerCatalogoById("tipoServicio")),
      clasificacionCarga: obtenerDefaultTodos("clasificacionCarga", obtenerCatalogoById("clasificacionCarga")),
      tipoCarga: obtenerDefaultTodos("tipoCarga", obtenerCatalogoById("tipoCarga")),
      tipoAplicacion: obtenerDefaultTodos("tipoAplicacion", obtenerCatalogoById("tipoAplicacion")),
      categoriaTransporte: obtenerDefaultTodos("categoriaTransporte", obtenerCatalogoById("categoriaTransporte")),
    }),
    [reglasCampos, obtenerCatalogoById, obtenerDefaultTodos],
  );

  const defaultValuesProcesados = React.useMemo(() => {
    if (!defaultValues) return {};

    const resultado = { ...defaultValues };

    Object.entries(reglasCampos).forEach(([campo, regla]) => {
      const codigo = defaultValues?.[regla.cod];

      if (codigo === undefined || codigo === null) return;

      // ── Fechas ─────────────────────────────────────────────────────────────
      if (regla.tipo === "datetime") {
        resultado[campo] = moment(codigo).isValid() ? moment(codigo).toDate() : null;
        return;
      }

      let catalogo = catalogosProcesados?.[regla.catalogo];

      if (campo === "usuario") {
        const usuarioBase = catalogosProcesados.empleados?.find((i) => i.cod_usuario === resultado?.ultimo_usuario);

        resultado[campo] = usuarioBase?.nombre_completo ?? "";
        return resultado;
      }

      if (campo === "centroCosto") {
        const empresaBase = resultado?.empresa ?? reglasCampos?.empresa?.default ?? null;

        catalogo = (catalogosProcesados?.centrosCosto || []).filter((cc) => cc.cod_empresa_cc === empresaBase?.cod_empresa);
      }

      if (campo === "tipoServicio") {
        const tipoTransporteBase = resultado?.tipoTransporte ?? reglasCampos?.tipoTransporte?.default ?? null;
        const valueTodos = getTodosValueById("tipoServicio", defaultTodosValue);

        catalogo = (catalogosProcesados?.tiposServicio || []).filter((ts) => (ts.cod_tipo_padre === tipoTransporteBase?.cod_tipo && ts.cod_estado === CODS_ESTADOS.ACTIVO) || ts.value === valueTodos);
      }

      if (campo === "tipoClasificacion") {
        const tipoTransporteBase = resultado?.tipoTransporte ?? reglasCampos?.tipoTransporte?.default ?? null;

        catalogo = (catalogosProcesados?.tiposClasificacionServicio || []).filter((td) => td.cod_tipo_padre === tipoTransporteBase?.cod_tipo);
        const codigo_ = convertClasificacionServicio(codigo);
        resultado[campo] = catalogo.find((i) => i.value === codigo_);
        return;
      }

      if (Array.isArray(catalogo)) {
        resultado[campo] = catalogo.find((e) => e.value === codigo) ?? null;
      } else {
        resultado[campo] = codigo;
      }
    });

    if (!resultado?.cod_usuario) {
      resultado.cod_usuario = defaultValues?.cod_usuario || defaultCodUsuario;
    }

    return resultado;
  }, [defaultValues, reglasCampos, catalogosProcesados, defaultCodUsuario]);

  const yaInicializoRef = React.useRef(false);

  React.useEffect(() => {
    if (isLoading) return;
    if (yaInicializoRef.current) return;

    // Si hay defaultValues pero defaultValuesProcesados aún está vacío, esperar
    if (defaultValues && Object.keys(defaultValuesProcesados).length === 0) return;

    setValores(() => ({
      ...valoresIniciales,
      ...defaultValuesProcesados,
    }));

    yaInicializoRef.current = true;
  }, [isLoading, valoresIniciales, defaultValuesProcesados]);
  // ↑ sin defaultValues en dependencias, la condición dentro lo maneja

  React.useEffect(() => {
    if (!defaultValues) return;
    if (!yaInicializoRef.current) return;

    setValores((prev) => {
      const siguiente = { ...prev };

      Object.keys(defaultValuesProcesados).forEach((key) => {
        if (prev?.[key] === undefined || prev?.[key] === null) {
          siguiente[key] = defaultValuesProcesados[key];
        }
      });

      return siguiente;
    });
  }, []);

  const verificarSiEsLectura = React.useCallback(
    (id) => {
      if (tipoForm === "lectura") {
        // habilitar solo si moment() es < a fechaFin
        if (id === "fechaFin") {
          if (!valores?.fechaFin) return false;
          if (validarSiTieneMetodoDeCalculo) {
            if (moment().isSameOrBefore(moment(defaultValues?.fechaFin))) return false;
            else return true;
          }
        }

        return true;
      }
      if (id === "fechaInicio") if (defaultValues[id]) return true;

      if (esScale && inputsReadOnlyScale.includes(id)) return true;

      if (inputsReadOnly.includes(id)) return true;

      const requireOtroCampo = reglasCampos?.[id]?.require;
      if (!requireOtroCampo) return false;

      if (typeof requireOtroCampo === "string") {
        return !valores?.[requireOtroCampo];
      }

      if (Array.isArray(requireOtroCampo)) {
        return requireOtroCampo.some((c) => !valores?.[c]);
      }

      return false;
    },
    [esScale, inputsReadOnlyScale, tipoForm, inputsReadOnly, reglasCampos, defaultValues, valores],
  );

  const verificarSiEsRequerido = React.useCallback(
    (id) => {
      if (tipoForm === "lectura") return false;
      return CAMPOS_REQUERIDOS.includes(id);
    },
    [tipoForm],
  );

  const verificarSiGrupoEsVisible = React.useCallback(
    (id) => {
      return !groupsToHide.includes(id);
    },
    [groupsToHide],
  );

  const verificarSiEsVisible = React.useCallback(
    (id) => {
      if (inputsToHide.includes(id)) return false;

      if (id === "fechaCreacion") return false;
      // if (id === "fechaModificacion") return false;

      const rule = reglasCampos?.[id];
      if (!rule) return true;

      const visibleWhen = rule.visibleWhen;
      if (!visibleWhen) return true;

      const { field, key, value } = visibleWhen;
      const valorCampo = valores?.[field];

      if (valorCampo === null || valorCampo === undefined) return false;
      if (key) return valorCampo?.[key] === value;

      return valorCampo === value;
    },
    [inputsToHide, reglasCampos, defaultValues, valores],
  );

  const construirPayload = React.useCallback(
    (payloadActual) =>
      Object.entries(reglasCampos).reduce((acc, [id, regla]) => {
        if (!regla?.payload?.includes(payloadActual)) return acc;
        if (!regla?.cod) return acc;

        acc[regla.cod] = getPlainValue(valores?.[id]);

        return acc;
      }, {}),
    [reglasCampos, valores],
  );

  const valoresSoloCodigos = React.useCallback(
    (payload) => {
      const resultado = {};

      Object.entries(reglasCampos).forEach(([key, regla]) => {
        if (!regla?.cod) return;

        if (payload) {
          const reglaPayload = regla?.payload ?? [];
          if (!reglaPayload.includes(payload)) return;
        }

        resultado[regla.cod] = getPlainValue(valores?.[key]);
      });

      if (valores?.cod_estado !== undefined) {
        resultado.cod_estado = valores.cod_estado ?? 1; // Si el estado no está definido, lo seteamos como "Activo" (1)
      }

      if (resultado.cod_usuario === undefined) {
        resultado.cod_usuario = valores?.cod_usuario ?? defaultCodUsuario ?? null;
      }

      if (resultado.todos_los_clientes === undefined) {
        resultado.todos_los_clientes = valores?.cod_tipo_tarifa === 97;
      }

      return resultado;
    },
    [reglasCampos, valores, defaultCodUsuario],
  );

  const filtrarValoresPorPayload = React.useCallback(
    (sourceValues, payload) => {
      const resultado = {};
      if (!sourceValues) return resultado;

      Object.entries(reglasCampos ?? {}).forEach(([key, regla]) => {
        if (!regla?.cod) return;

        if (payload) {
          const reglaPayload = regla?.payload ?? [];
          if (!reglaPayload.includes(payload)) return;
        }

        resultado[regla.cod] = sourceValues[regla?.cod];
      });

      return resultado;
    },
    [reglasCampos],
  );

  const catalogoGrupos = React.useMemo(() => {
    const mostrarTitulo = true;
    const tipo = "";
    const size_6 = 6;
    const variant = "span";

    const filterShados = themeMode === "dark" ? "2.5px 10px 10px rgba(190, 190, 190, 0.05)" : "2.5px 10px 10px rgba(0, 2, 48, 0.05)";

    const normalShadow = themeMode === "dark" ? "2.5px 10px 10px rgba(190, 190, 190, 0.3)" : "2.5px 10px 10px rgba(0, 2, 48, 0.2)";

    const shadow = tipoForm !== "filtro" ? normalShadow : filterShados;
    const p = tipoForm !== "filtro" ? 0.5 : 0;

    return {
      organizacion: { id: "organizacion", label: "Organizacion", mostrarTitulo, tipo, size: size_6, variant, p, visible: verificarSiGrupoEsVisible("organizacion") },
      servicio: { id: "servicio", label: "Servicio", mostrarTitulo, tipo, size: size_6, variant, p, shadow, visible: verificarSiGrupoEsVisible("servicio") },
      transporte: { id: "transporte", label: "Transporte", mostrarTitulo, tipo, size: size_6, variant, p, shadow, visible: verificarSiGrupoEsVisible("transporte") },
      carga: { id: "carga", label: "Carga", mostrarTitulo, tipo, size: size_6, variant, p, shadow, visible: verificarSiGrupoEsVisible("carga") },
      calculo: { id: "calculo", label: "Calculo", mostrarTitulo, tipo, size: size_6, variant, p, shadow, visible: verificarSiGrupoEsVisible("calculo") },
      alcance: { id: "alcance", label: "Alcance", mostrarTitulo, tipo, size: size_6, variant, p, shadow, visible: verificarSiGrupoEsVisible("alcance") },
      vigencia: { id: "vigencia", label: "Vigencia", mostrarTitulo, tipo, size: size_6, variant, p, shadow, visible: verificarSiGrupoEsVisible("vigencia") },
      auditoria: { id: "auditoria", label: "Auditoria", mostrarTitulo, tipo, size: size_6, variant, p, visible: verificarSiGrupoEsVisible("auditoria") },
    };
  }, [themeMode, tipoForm, verificarSiGrupoEsVisible]);

  const catalogoInputs = React.useMemo(() => {
    const size_12 = 12;
    const size_6 = 6;

    const select_12 = { tipo: "select", size: size_12 };
    const select_6 = { tipo: "select", size: size_6 };
    const text_12 = { tipo: "text", size: size_12 };
    const text_6 = { tipo: "text", size: size_6 };
    const number_12 = { tipo: "number", size: size_12 };
    const number_6 = { tipo: "number", size: size_6 };
    const toggle_12 = { tipo: "toggle", size: size_12 };
    const toggle_6 = { tipo: "toggle", size: size_6 };

    const optionsEmpresa = obtenerCatalogoById("empresa");
    const optionsCentroCosto = obtenerCatalogoById("centroCosto").filter((cc) => cc.cod_empresa_cc === valores?.empresa?.cod_empresa);
    const optionsRubro = obtenerCatalogoById("rubro");
    const optionsTipoTransporte = obtenerCatalogoById("tipoTransporte");
    const optionsTipoServicio = tiposServicioSeleccionables;
    const optionsTipoClasificacion = tiposClasificacionSeleccionables;
    const optionsCategoriaTransporte = obtenerCatalogoById("categoriaTransporte");
    const optionsTipoCarga = obtenerCatalogoById("tipoCarga");
    const optionsClasificacionCarga = obtenerCatalogoById("clasificacionCarga");
    const optionsIncoterm = obtenerCatalogoById("incoterm");
    const optionsTipoPago = obtenerCatalogoById("tipoPago");
    const optionsTipoAplicacion = obtenerCatalogoById("tipoAplicacion");
    const optionsTipoCalculo = obtenerCatalogoById("tipoCalculo");
    const optionsMetodoCalculo = metodosCalculoSeleccionables;
    const optionsTipoTarifa = obtenerCatalogoById("tipoTarifa");

    return {
      empresa: {
        id: "empresa",
        label: "Empresa",
        options: optionsEmpresa,
        readonly: verificarSiEsLectura("empresa"),
        requerido: verificarSiEsRequerido("empresa"),
        visible: verificarSiEsVisible("empresa"),
        ...select_6,
      },
      centroCosto: {
        id: "centroCosto",
        label: "Centro de costo",
        options: optionsCentroCosto,
        readonly: verificarSiEsLectura("centroCosto"),
        requerido: verificarSiEsRequerido("centroCosto"),
        visible: verificarSiEsVisible("centroCosto"),
        ...select_6,
      },
      rubro: {
        id: "rubro",
        label: "Rubro",
        options: optionsRubro,
        readonly: verificarSiEsLectura("rubro"),
        requerido: verificarSiEsRequerido("rubro"),
        visible: verificarSiEsVisible("rubro"),
        ...select_6,
      },
      proveedor: {
        id: "proveedor",
        label: "Proveedor",
        options: catalogosProcesados?.proveedoresNombre || [],
        fetchOptions: fetchOptionsProveedores,
        readonly: verificarSiEsLectura("proveedor"),
        requerido: verificarSiEsRequerido("proveedor"),
        visible: verificarSiEsVisible("proveedor"),
        ...select_6,
      },
      nombre: {
        id: "nombre",
        label: "Servicio",
        readonly: verificarSiEsLectura("nombre"),
        requerido: verificarSiEsRequerido("nombre"),
        visible: verificarSiEsVisible("nombre"),
        ...text_6,
      },
      siglas: {
        id: "siglas",
        label: "Siglas",
        readonly: verificarSiEsLectura("siglas"),
        requerido: verificarSiEsRequerido("siglas"),
        visible: verificarSiEsVisible("siglas"),
        ...text_6,
      },
      tipoTransporte: {
        id: "tipoTransporte",
        label: "Tipo de transporte",
        options: optionsTipoTransporte,
        readonly: verificarSiEsLectura("tipoTransporte"),
        requerido: verificarSiEsRequerido("tipoTransporte"),
        visible: verificarSiEsVisible("tipoTransporte"),
        ...select_6,
      },
      tipoServicio: {
        id: "tipoServicio",
        label: "Tipo de servicio",
        options: optionsTipoServicio,
        default: obtenerDefaultTodos("tipoServicio", optionsTipoServicio),
        readonly: verificarSiEsLectura("tipoServicio"),
        requerido: verificarSiEsRequerido("tipoServicio"),
        visible: verificarSiEsVisible("tipoServicio"),
        ...select_6,
      },
      tipoClasificacion: {
        id: "tipoClasificacion",
        label: "Clasificación",
        options: optionsTipoClasificacion,
        readonly: verificarSiEsLectura("tipoClasificacion"),
        requerido: verificarSiEsRequerido("tipoClasificacion"),
        visible: verificarSiEsVisible("tipoClasificacion"),
        ...select_6,
      },
      categoriaTransporte: {
        id: "categoriaTransporte",
        label: "Categoría de transporte",
        options: optionsCategoriaTransporte,
        default: obtenerDefaultTodos("categoriaTransporte", optionsCategoriaTransporte),
        readonly: verificarSiEsLectura("categoriaTransporte"),
        requerido: verificarSiEsRequerido("categoriaTransporte"),
        visible: verificarSiEsVisible("categoriaTransporte"),
        ...select_6,
      },
      obligatorio: {
        id: "obligatorio",
        label: "Seleccion automatica en cotizacion",
        readonly: verificarSiEsLectura("obligatorio"),
        requerido: verificarSiEsRequerido("obligatorio"),
        visible: verificarSiEsVisible("obligatorio"),
        ...toggle_12,
      },
      tipoCarga: {
        id: "tipoCarga",
        label: "Tipo de carga",
        options: optionsTipoCarga,
        default: obtenerDefaultTodos("tipoCarga", optionsTipoCarga),
        readonly: verificarSiEsLectura("tipoCarga"),
        requerido: verificarSiEsRequerido("tipoCarga"),
        visible: verificarSiEsVisible("tipoCarga"),
        ...select_6,
      },
      clasificacionCarga: {
        id: "clasificacionCarga",
        label: "Clasificación de carga",
        options: optionsClasificacionCarga,
        default: obtenerDefaultTodos("clasificacionCarga", optionsClasificacionCarga),
        readonly: verificarSiEsLectura("clasificacionCarga"),
        requerido: verificarSiEsRequerido("clasificacionCarga"),
        visible: verificarSiEsVisible("clasificacionCarga"),
        ...select_6,
      },
      incoterm: {
        id: "incoterm",
        label: "Incoterm",
        options: optionsIncoterm,
        readonly: verificarSiEsLectura("incoterm"),
        requerido: verificarSiEsRequerido("incoterm"),
        visible: verificarSiEsVisible("incoterm"),
        ...select_6,
      },
      tipoPago: {
        id: "tipoPago",
        label: "Tipo de pago",
        options: optionsTipoPago,
        readonly: verificarSiEsLectura("tipoPago"),
        requerido: verificarSiEsRequerido("tipoPago"),
        visible: verificarSiEsVisible("tipoPago"),
        ...select_6,
      },
      tipoAplicacion: {
        id: "tipoAplicacion",
        label: "Tipo de aplicación",
        options: optionsTipoAplicacion,
        default: obtenerDefaultTodos("tipoAplicacion", optionsTipoAplicacion),
        readonly: verificarSiEsLectura("tipoAplicacion"),
        requerido: verificarSiEsRequerido("tipoAplicacion"),
        visible: verificarSiEsVisible("tipoAplicacion"),
        ...select_6,
      },
      tipoCalculo: {
        id: "tipoCalculo",
        label: "Tipo de calculo",
        options: optionsTipoCalculo,
        readonly: verificarSiEsLectura("tipoCalculo"),
        requerido: verificarSiEsRequerido("tipoCalculo"),
        visible: verificarSiEsVisible("tipoCalculo"),
        ...select_6,
      },
      metodoCalculo: {
        id: "metodoCalculo",
        label: "Método de cálculo",
        options: optionsMetodoCalculo,
        readonly: verificarSiEsLectura("metodoCalculo"),
        requerido: verificarSiEsRequerido("metodoCalculo"),
        visible: verificarSiEsVisible("metodoCalculo"),
        ...select_6,
      },
      aplicaOrigenesDestinos: {
        id: "aplicaOrigenesDestinos",
        label: "Aplica a todos los orígenes y destinos",
        readonly: verificarSiEsLectura("aplicaOrigenesDestinos"),
        requerido: verificarSiEsRequerido("aplicaOrigenesDestinos"),
        visible: verificarSiEsVisible("aplicaOrigenesDestinos"),
        ...toggle_6,
      },
      aplicaCommodities: {
        id: "aplicaCommodities",
        label: "Aplica a todos los commodities",
        readonly: verificarSiEsLectura("aplicaCommodities"),
        requerido: verificarSiEsRequerido("aplicaCommodities"),
        visible: verificarSiEsVisible("aplicaCommodities"),
        ...toggle_6,
      },
      tipoTarifa: {
        id: "tipoTarifa",
        label: "Tipo de tarifa",
        options: optionsTipoTarifa,
        readonly: verificarSiEsLectura("tipoTarifa"),
        requerido: verificarSiEsRequerido("tipoTarifa"),
        visible: verificarSiEsVisible("tipoTarifa"),
        ...select_12,
      },
      fechaInicio: {
        id: "fechaInicio",
        label: "Fecha de inicio",
        tipo: "datetime",
        readonly: verificarSiEsLectura("fechaInicio"),
        requerido: verificarSiEsRequerido("fechaInicio"),
        visible: verificarSiEsVisible("fechaInicio"),
        size: size_6,
      },
      fechaFin: {
        id: "fechaFin",
        label: "Fecha de vencimiento",
        tipo: "datetime",
        readonly: verificarSiEsLectura("fechaFin"),
        requerido: verificarSiEsRequerido("fechaFin"),
        visible: verificarSiEsVisible("fechaFin"),
        size: size_6,
      },
      fechaCreacion: {
        id: "fechaCreacion",
        label: "Fecha de creación",
        tipo: "datetime",
        readonly: true,
        requerido: verificarSiEsRequerido("fechaCreacion"),
        visible: verificarSiEsVisible("fechaCreacion"),
        size: size_6,
      },
      fechaModificacion: {
        id: "fechaModificacion",
        label: "Fecha de modificación",
        tipo: "datetime",
        readonly: true,
        requerido: verificarSiEsRequerido("fechaModificacion"),
        visible: verificarSiEsVisible("fechaModificacion"),
        size: size_6,
      },
      usuario: {
        // ULTIMO_USUARIO
        id: "usuario",
        label: "Ultima modificacion por",
        readonly: true,
        requerido: verificarSiEsRequerido("usuario"),
        visible: verificarSiEsVisible("usuario"),
        ...text_6,
      },
      minimo: {
        // ULTIMO_USUARIO
        id: "minimo",
        label: "Minimo",
        readonly: verificarSiEsLectura("minimo"),
        requerido: verificarSiEsRequerido("minimo"),
        visible: verificarSiEsVisible("minimo"),
        ...number_6,
      },
    };
  }, [
    catalogosProcesados,
    obtenerCatalogoById,
    obtenerDefaultTodos,
    tiposServicioSeleccionables,
    tiposClasificacionSeleccionables,
    metodosCalculoSeleccionables,
    valores?.empresa,
    verificarSiEsLectura,
    verificarSiEsRequerido,
    verificarSiEsVisible,
  ]);

  const data = React.useMemo(() => {
    const grupos = Object.values(catalogoGrupos);

    const inputs = [
      { grupoId: "auditoria", ...catalogoInputs?.empresa, val: valores?.empresa },
      { grupoId: "auditoria", ...catalogoInputs?.centroCosto, val: valores?.centroCosto },
      { grupoId: "auditoria", ...catalogoInputs?.fechaCreacion, val: valores?.fechaCreacion },
      { grupoId: "auditoria", ...catalogoInputs?.fechaModificacion, val: valores?.fechaModificacion },
      { grupoId: "auditoria", ...catalogoInputs?.usuario, val: valores?.usuario },

      { grupoId: "servicio", ...catalogoInputs?.rubro, val: valores?.rubro },
      { grupoId: "servicio", ...catalogoInputs?.proveedor, val: valores?.proveedor },
      { grupoId: "servicio", ...catalogoInputs?.nombre, val: valores?.nombre },
      { grupoId: "servicio", ...catalogoInputs?.siglas, val: valores?.siglas },

      { grupoId: "transporte", ...catalogoInputs?.tipoTransporte, val: valores?.tipoTransporte },
      { grupoId: "transporte", ...catalogoInputs?.tipoServicio, val: valores?.tipoServicio },
      { grupoId: "transporte", ...catalogoInputs?.tipoClasificacion, val: valores?.tipoClasificacion },
      { grupoId: "transporte", ...catalogoInputs?.categoriaTransporte, val: valores?.categoriaTransporte },
      { grupoId: "transporte", ...catalogoInputs?.obligatorio, val: valores?.obligatorio },

      { grupoId: "carga", ...catalogoInputs?.tipoCarga, val: valores?.tipoCarga },
      { grupoId: "carga", ...catalogoInputs?.clasificacionCarga, val: valores?.clasificacionCarga },
      { grupoId: "carga", ...catalogoInputs?.incoterm, val: valores?.incoterm },
      { grupoId: "carga", ...catalogoInputs?.tipoPago, val: valores?.tipoPago },

      { grupoId: "calculo", ...catalogoInputs?.tipoAplicacion, val: valores?.tipoAplicacion },
      { grupoId: "calculo", ...catalogoInputs?.tipoCalculo, val: valores?.tipoCalculo },
      { grupoId: "calculo", ...catalogoInputs?.metodoCalculo, val: valores?.metodoCalculo },
      { grupoId: "calculo", ...catalogoInputs?.minimo, val: valores?.minimo },

      { grupoId: "alcance", ...catalogoInputs?.aplicaOrigenesDestinos, val: valores?.aplicaOrigenesDestinos },
      { grupoId: "alcance", ...catalogoInputs?.aplicaCommodities, val: valores?.aplicaCommodities },
      { grupoId: "alcance", ...catalogoInputs?.tipoTarifa, val: valores?.tipoTarifa },

      { grupoId: "vigencia", ...catalogoInputs?.fechaInicio, val: valores?.fechaInicio },
      { grupoId: "vigencia", ...catalogoInputs?.fechaFin, val: valores?.fechaFin },
    ];

    return { grupos, inputs };
  }, [valores, catalogoInputs, catalogoGrupos]);

  const onInput = React.useCallback(
    ({ id, val }) => {
      setValores((prev) => {
        if (Object.is(prev?.[id], val)) return prev;

        const next = { ...prev };
        const regla = reglasCampos?.[id];

        if (id === "tipoTransporte") {
          const tipoPuntoEnlace = tipoOrigenVsTipoTransporte?.[val?.label];
          const tipoPuntoEnlaceEncontrado = findBy(catalogosProcesados?.tiposPuntoEnlace, "label", tipoPuntoEnlace);

          next.tipoPuntoEnlaceOrigen = tipoPuntoEnlaceEncontrado;
          next.tipoPuntoEnlaceDestino = tipoPuntoEnlaceEncontrado;
        }

        if (id === "rubro") {
          const normalizarTexto = (texto) =>
            String(texto ?? "")
              .trim()
              .toLowerCase();

          const rubroLabel = normalizarTexto(val?.label);

          const rubroEsFlete = rubroLabel.includes("flete");
          const rubroEsExpress = rubroLabel.includes("express");

          const clasificacionesDisponibles = (catalogosProcesados?.tiposClasificacionServicio || []).filter((td) => {
            const esDelTipoTransporte = td.cod_tipo_padre === prev?.tipoTransporte?.cod_tipo;
            if (!esDelTipoTransporte) return false;

            const clasificacionLabel = normalizarTexto(td.label);

            const clasificacionEsFlete = clasificacionLabel === "flete";
            const clasificacionEsFleteExpress = clasificacionLabel === "flete express";

            if (rubroEsFlete && rubroEsExpress) return clasificacionEsFleteExpress;
            if (rubroEsFlete) return clasificacionEsFlete;

            return !clasificacionEsFlete && !clasificacionEsFleteExpress;
          });

          const tipoClasificacionActualSigueDisponible = clasificacionesDisponibles.some((td) => td.value === prev?.tipoClasificacion?.value);

          if (!tipoClasificacionActualSigueDisponible) {
            next.tipoClasificacion = null;
            next.clasificacion = null;
          }
        }

        if (!regla) {
          next[id] = val;
          return next;
        }

        next[id] = val ?? null;

        regla?.reset?.forEach((keyToReset) => {
          const reglaReset = reglasCampos?.[keyToReset];

          next[keyToReset] = catalogoInputs?.[keyToReset]?.default ?? null;

          if (reglaReset?.cod) {
            next[reglaReset.cod] = getPlainValue(next[keyToReset]);
          }
        });

        if (val === null) {
          const defaultVal = regla?.default ?? catalogoInputs?.[id]?.default ?? null;
          next[id] = defaultVal;
          next[regla.cod] = getPlainValue(defaultVal);
          return next;
        }

        next[regla.cod] = getPlainValue(val);

        if (id === "rubro" && String(val?.value) === String(COD_RUBRO_SCALE)) {
          next.aplicaOrigenesDestinos = true;
          next.aplicaCommodities = true;
          return aplicarDefaultsScale(next);
        }

        return next;
      });
    },
    [catalogosProcesados?.tiposPuntoEnlace, catalogosProcesados?.tiposClasificacionServicio, reglasCampos, catalogoInputs, aplicarDefaultsScale],
  );

  const payloadServicio = React.useMemo(() => construirPayload("servicio"), [construirPayload]);

  const payloadMetodo = React.useMemo(() => construirPayload("metodo"), [construirPayload]);

  const proveedorConsultado = React.useCallback(async () => {
    // console.log("Consultando proveedor por ID:", defaultValues?.entidad_id);
    if (!defaultValues?.entidad_id) return null;
    const a = await obtenerProveedorById({ entidad_id: defaultValues.entidad_id });
    // console.log("Proveedor obtenido por ID:", a);
    return a;
  }, [defaultValues?.entidad_id, obtenerProveedorById]);

  React.useEffect(() => {
    if (!defaultValues?.entidad_id) return;
    const a = catalogosProcesados.proveedoresNombre?.find((c) => c.value === defaultValues.entidad_id);
    if (a) {
      setValores((v) => ({ ...v, proveedor: a }));
      return;
    }
    proveedorConsultado().then((b) => {
      // console.log("Proveedor consultado por ID:", b);
      if (b) {
        setValores((v) => ({ ...v, proveedor: b }));

        catalogosProcesados.proveedores?.push(b);
      }
    });
  }, [catalogosProcesados.proveedores, catalogosProcesados.proveedoresNombre, defaultValues.entidad_id, proveedorConsultado]);

  return {
    valores,
    setValores,
    reglasCampos,
    catalogoInputs,
    catalogoGrupos,
    data,
    onInput,
    payloadServicio,
    payloadMetodo,
    valoresSoloCodigos,
    construirPayload,
    obtenerCatalogoById,
    obtenerDefaultTodos,
    filtrarValoresPorPayload,
  };
}
