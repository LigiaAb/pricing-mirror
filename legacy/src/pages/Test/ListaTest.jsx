import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Button, Grid } from "@mui/material";
import { useFetchCentrosCosto, useFetchEmpresas, useFetchPaises, useFetchUsuarios, useFetchEstados, useFetchTipos, useFetchMonedas } from "../../hooks/Fetch/useFetchCatalog";
import { useFetchAllEntidadesSimple } from "../../hooks/Fetch/useFetchEntidades";
import TablaEditableComponent from "../../components/Tabla/TablaEditableComponent";
import moment from "moment";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useActionState } from "react";
import EditableDataGridComponent from "../../components/Tabla/EditableDataGridComponent";
import { useFetchEmpUsuPuesto } from "../../hooks/Fetch/useFetchConfiguracion";
import CreateTicket from "../../components/Tickets/CreateTicket";
import TablaUsuario from "../../views/Usuario/TablaUsuario";
import SelectFiltro from "../../components/FiltroBi/select.jsx";
import RangeSelect from "../../components/FiltroBi/rangeSelect.jsx";
import DateRangeSelect from "../../components/FiltroBi/dateRangeSelect.jsx";
import TablaDouble from "../../components/FiltroBi/tabledouble.jsx";
import ColumnSelect from "../../components/FiltroBi/ColumnSelect.jsx";
import { TablaEmpresa } from "../../views/Empresa/TablaEmpresa";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import DialogComponent from "../../components/Dialog/DialogComponent";
import generatePlaceholderFromRegex from "../../utils/generateBaseFromRegex";

let accionesBase = {
  ver: true,
  go: true,
  editar: true,
  eliminar: true,
  copiar: true,
  pegar: true,
  guardar: true,
  agregar: false,
  autorizar: true,
};

const ListaTest = (props) => {
  const [data, setData] = useState({
    cliente: null,
    size_variable: 3,
    resaltado: true,
    color: "secondary",
    select_default: null,
    select_multiple: [],
    select_query: null,
    select_distinto_label_value: null,
    formato: "",
    mask: "",
    prefijo: "",
    textarea:
      "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Culpa dicta enim voluptate praesentium veritatis hic laborum labore ex, sequi debitis et laudantium aliquid odit nam consequuntur soluta blanditiis mollitia impedit! lorem ipsum dolor sit, amet consectetur adipisicing elit. Culpa dicta enim voluptate praesentium veritatis hic laborum labore ex, sequi debitis et laudantium ali lorem ipsum dolor sit, amet consectetur adipisicing elit. Culpa dicta enim voluptate praesentium veritatis hic laborum labore ex, sequi debitis et laudantium aliquid lorem ipsum dolor sit, amet consectetur adipisicing elit. Culpa dicta enim voluptate praesentium veritatis hic laborum labore ex, sequi debitis et laudantium ali",
    texteditor:
      "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Culpa dicta enim voluptate praesentium veritatis hic laborum labore ex, sequi debitis et laudantium aliquid odit nam consequuntur soluta blanditiis mollitia impedit! lorem ipsum dolor sit, amet consectetur adipisicing elit. Culpa dicta enim voluptate praesentium veritatis hic laborum labore ex, sequi debitis et laudantium ali lorem ipsum dolor sit, amet consectetur adipisicing elit. Culpa dicta enim voluptate praesentium veritatis hic laborum labore ex, sequi debitis et laudantium aliquid lorem ipsum dolor sit, amet consectetur adipisicing elit. Culpa dicta enim voluptate praesentium veritatis hic laborum labore ex, sequi debitis et laudantium ali Lorem ipsum dolor sit, amet consectetur adipisicing elit. Culpa dicta enim voluptate praesentium veritatis hic laborum labore ex, sequi debitis et laudantium aliquid odit nam consequuntur soluta blanditiis mollitia impedit! lorem ipsum dolor sit, amet consectetur adipisicing elit. Culpa dicta enim voluptate praesentium veritatis hic laborum labore ex, sequi debitis et laudantium ali lorem ipsum dolor sit, amet consectetur adipisicing elit. Culpa dicta enim voluptate praesentium veritatis hic laborum labore ex, sequi debitis et laudantium aliquid lorem ipsum dolor sit, amet consectetur adipisicing elit. Culpa dicta enim voluptate praesentium veritatis hic laborum labore ex, sequi debitis et laudantium ali",
  });

  const [contenido, setContenido] = useState(``);
  const [mostrar, setMostrar] = useState(false);

  const [opciones, setOpciones] = useState([
    { label: "primera opcion", nombre: "1° nombre", codigo_nombre: 1, value: 1 },
    { label: "segunda opcion", nombre: "2° nombre", codigo_nombre: 2, value: 2 },
    { label: "tercera opcion", nombre: "3° nombre", codigo_nombre: 3, value: 3 },
  ]);

  const [documentos, setDocumentos] = useState([]);

  const [tipoFile, setTipoFile] = useState([])
  const [clienteFile, setClienteFile] = useState([])
  const [rubrosFile, setRubrosFile] = useState([])
  const [tiposDocumetosFile, setTiposDocumentosFile] = useState([])

  const estadosFetch = useFetchEstados({ cod_tipo: 328 }, {});
  const proveedoresFetch = useFetchAllEntidadesSimple(["clientes"], { cod_tipo: 1, tipo_entidad: "proveedor" });
  const entidadesFetch = useFetchAllEntidadesSimple(["clientes"], { cod_estado: 1, tipo_entidad: "CLIENTE" }, {});
  const tipoDocumentoFetch = useFetchTipos({ tipo_tabla: "TIPO_DOCUMENTO" });
  const tipoPagoFetch = useFetchTipos({ tipo_tabla: "PAGO" });
  const monedasFetch = useFetchMonedas();
  const cencos = useFetchCentrosCosto();

  // console.log("cencos", cencos.data);

  const [rubroSeleccionado, setRubroSeleccionado] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState([])
  const [estadoSeleccionado, setEstadoSeleccionado] = useState([]);
  const [tipoDocumentoSeleccionado, setTipoDocumentoSeleccionado] = useState([]);
  const [tipoFileSeleccionado, setTipoFileSeleccionado] = useState([]);
  const [valorTotalRangeSeleccionado, setValorTotalRangeSeleccionado] = useState([0, 0]);
  const [columnasVisibles, setColumnasVisibles] = useState(new Set());

  const handleSelectChange = (vals) => {
    setData((d) => ({ ...d, select_multiple: vals }));
  };

  const minValorTotal = useMemo(() => {
    if (!documentos.length) return 0;
    return Math.floor(
      Math.min(
        ...documentos.map((doc) => Number(doc.DOC_VALORDOLAR) || 0),
        0
      )
    );
  }, [documentos]);

  const maxValorTotal = useMemo(() => {
    if (!documentos.length) return 10000;
    return Math.ceil(
      Math.max(
        ...documentos.map((doc) => Number(doc.DOC_VALORDOLAR) || 0),
        0
      )
    );
  }, [documentos]);

  useEffect(() => {
    setValorTotalRangeSeleccionado((current) => {
      const [currentMin, currentMax] = current;
      if (currentMin === 0 && currentMax === 0) {
        return [minValorTotal, maxValorTotal];
      }
      const nextMin = clamp(currentMin, minValorTotal, maxValorTotal);
      const nextMax = clamp(currentMax, minValorTotal, maxValorTotal);
      return [nextMin, Math.max(nextMin, nextMax)];
    });
  }, [minValorTotal, maxValorTotal]);

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const fechaRangeDisponible = useMemo(() => {
    if (!documentos.length) return [null, null];

    const timestamps = documentos
      .map((doc) => {
        const m = moment(doc.FILE_FECHA);
        return m.isValid() ? m.valueOf() : null;
      })
      .filter((ts) => ts !== null);

    if (!timestamps.length) return [null, null];

    return [Math.min(...timestamps), Math.max(...timestamps)];
  }, [documentos]);

  const [fechaRangeSeleccionado, setFechaRangeSeleccionado] = useState([null, null]);

  useEffect(() => {
    const [minFecha, maxFecha] = fechaRangeDisponible;
    if (minFecha === null || maxFecha === null) return;

    setFechaRangeSeleccionado((current) => {
      const [currentStart, currentEnd] = current;
      if (currentStart === null && currentEnd === null) {
        return [minFecha, maxFecha];
      }
      return current;
    });
  }, [fechaRangeDisponible]);

  const fetchOptions = async (searchTerm) => {
    return await api
      .get("api/appweb/busqueda-entidad-x-criterio", {
        params: {
          ref_busqueda: searchTerm,
          list_descripcion_tipo: ["CLIENTE"],
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
  };

  const grupos = useMemo(() => {
    const borderWidth = 1,
      borderColor = "primary",
      borderStyle = "doted";
    return [
      { id: "ayudas", label: "Ayudas", icono: "c-ayuda", borderColor: "accent", color: "accent", dividerColor: "accent", borderWidth, borderStyle, bgcolor: "accent", p: 1, direction: "row" },
      { id: "propiedades", label: "Propiedades", borderWidth, borderStyle, borderColor: "success", bgcolor: "success" },
      { id: "selects", label: "Selects", borderWidth, borderStyle, borderColor: "orange", bgcolor: "orange", direction: "row" },
      { id: "texto", label: "Texto", borderColor, borderWidth, borderStyle, bgcolor: "primary", tipo: "separador", direction: "row" },
      { id: "opciones", label: "Opciones", borderColor, borderWidth, borderStyle, direction: "row" },
      { id: "otros", label: "Otros", borderColor, borderWidth, borderStyle, direction: "row" },
    ];
  }, []);

  const mostrarContenido = (contenido) => {
    setContenido(contenido);
    setMostrar(true);
  };

  const libreriaInputs = useMemo(() => {
    const options = opciones;
    return {
      //ayudas
      titulo: { grupoId: "ayudas", id: "titulo", tipo: "titulo", val: "TITULO", color: "success.main" },
      subtitulo: { grupoId: "ayudas", id: "subtitulo", tipo: "subtitulo", val: "SUB TITULO", color: "orange.900" },
      comentario: { grupoId: "ayudas", id: "comentario", tipo: "comentario", val: "COMENTARIO" },
      logo: { grupoId: "ayudas", id: "logo", tipo: "logo", label: "logo" },
      separador: { grupoId: "ayudas", id: "separador", tipo: "separador", color: "error.main", width: 2 },
      separador_texto: { grupoId: "ayudas", id: "separador_texto", tipo: "separador", val: "SEPARADOR CON TEXTO", color: "accent.main" },

      //propiedades
      requerido: { grupoId: "propiedades", id: "requerido", tipo: "text", label: "Input requerido", val: null, requerido: true },
      readonly: { grupoId: "propiedades", id: "readonly", tipo: "text", label: "Input Readonly", val: "TEXTO NO EDITABLE", readonly: true },
      size_default: { grupoId: "propiedades", id: "size_default", tipo: "text", label: "Input Size Default", val: "TAMAÑO POR DEFECTO", size: undefined },
      size_auto: { grupoId: "propiedades", id: "size_auto", tipo: "text", label: "Input Size Auto", val: "TAMAÑO AUTOMATICO", size: "auto" },
      size_variable: { grupoId: "propiedades", id: "size_variable", tipo: "number", label: "Input Size Variable", val: data.size_variable, size: data.size_variable, min: 1, max: 12 },
      resaltado: { grupoId: "propiedades", id: "resaltado", tipo: "checkbox", label: "Input Resaltado", options: true, val: data.resaltado, resaltar: data.resaltado },
      color: { grupoId: "propiedades", id: "color", tipo: "text", label: "Input Color", val: data.color, color: data.color },
      acciones: {
        grupoId: "propiedades",
        id: "acciones",
        tipo: "text",
        label: "ACCIONES PERSONALIZADAS",
        val: "acciones personalizadas",
        actions: [
          { nombre: "boton de accion", onClick: () => { }, icono: "c-informacion" },
          { nombre: "accion 1", onClick: () => { }, icono: "c-1" },
          { nombre: "accion 2", onClick: () => { }, icono: "c-2" },
        ],
      },
      acciones_select: {
        grupoId: "propiedades",
        id: "acciones_select",
        tipo: "select",
        options: [],
        label: "ACCIONES PERSONALIZADAS EN SELECT",
        val: null,
        actions: [
          { nombre: "boton de accion", onClick: () => { }, icono: "c-informacion" },
          { nombre: "accion 1", onClick: () => { }, icono: "c-1" },
          { nombre: "accion 2", onClick: () => { }, icono: "c-2" },
        ],
      },

      // selects
      select_default: { grupoId: "selects", id: "select_default", tipo: "select", label: "Select Default", options, val: data.select_default },
      select_distinto_label_value: {
        grupoId: "selects",
        id: "select_distinto_label_value",
        tipo: "select",
        label: "select con valor/label diferentes",
        options,
        val: data.select_default,
        valueOption: "codigo_nombre",
        labelOption: "nombre",
      },
      select_multiple: { grupoId: "selects", id: "select_multiple", tipo: "select", label: "Select Multiple", options, val: data.select_multiple, multiple: true },
      select_query: {
        grupoId: "selects",
        id: "select_query",
        tipo: "select",
        label: "Select Query",
        options: [],
        val: data.select_query,
        fetchOptions,
        valueOption: "entidad_id",
        labelOption: "entidad_nombre",
      },

      // texto
      texto_default: { grupoId: "texto", id: "texto_default", tipo: "text", label: "Texto Default", val: "" },
      numero: { grupoId: "texto", id: "numero", tipo: "number", label: "Numero", val: 0 },
      quetzales: { grupoId: "texto", id: "quetzales", tipo: "quetzales", label: "Quetzales", val: null },
      dolares: { grupoId: "texto", id: "dolares", tipo: "dolares", label: "Dolares", val: null },
      icono: { grupoId: "texto", id: "icono", tipo: "icono", label: "Icono", val: "c-informacion" },
      password: { grupoId: "texto", id: "password", tipo: "password", label: "Password", val: "password" },
      email: { grupoId: "texto", id: "email", tipo: "email", label: "Email", val: "email@example.com" },
      formato: { grupoId: "texto", id: "formato", tipo: "text", label: "Con Formato", val: data.formato, formato: /^\w{5}$/, mask: false },
      mask: { grupoId: "texto", id: "mask", tipo: "text", label: "Mask", val: data.mask, mask: true, formato: new RegExp(`17E${moment().format("YY")}\\d{6}`, "i"), placeholderChar: "#" },
      prefijo: { grupoId: "texto", id: "prefijo", tipo: "text", label: "Prefijo", val: data.prefijo, prefijo: `17E${moment().format("YY")}` },
      sufijo: { grupoId: "texto", id: "sufijo", tipo: "text", label: "Sufijo", val: data.sufijo, sufijo: "SUFIJO" },
      textarea: {
        grupoId: "texto",
        id: "textarea",
        tipo: "textarea",
        label: "Textarea",
        val: data.textarea,
      },
      texteditor: {
        grupoId: "texto",
        id: "texteditor",
        tipo: "texteditor",
        label: "Texteditor",
        maxHeight: 100,
        val: data.texteditor,
        useFonts: true,
        useTipo: true,
        useFontSize: true,
        useTextEdition: true,
        useColor: true,
        useLinks: true,
        useAlign: true,
        useLists: true,
        useMension: true,
        useCodigo: true,
        useDivisores: true,
      },
    };
  }, [data, opciones]);

  const inputs = useMemo(() => {
    return [
      { ...libreriaInputs.logo },
      { ...libreriaInputs.separador_texto },
      { ...libreriaInputs.separador },
      { ...libreriaInputs.titulo },
      { ...libreriaInputs.subtitulo },
      { ...libreriaInputs.comentario },

      { ...libreriaInputs.requerido, size: 3 },
      { ...libreriaInputs.readonly, size: 3 },
      { ...libreriaInputs.size_default },
      { ...libreriaInputs.size_auto },
      { ...libreriaInputs.size_variable },
      { ...libreriaInputs.resaltado, size: 3 },
      { ...libreriaInputs.color },
      { ...libreriaInputs.acciones },
      { ...libreriaInputs.acciones_select },

      { ...libreriaInputs.select_default },
      { ...libreriaInputs.select_distinto_label_value },
      { ...libreriaInputs.select_multiple },
      { ...libreriaInputs.select_query },

      { ...libreriaInputs.texto_default },
      { ...libreriaInputs.numero },
      { ...libreriaInputs.quetzales },
      { ...libreriaInputs.dolares },
      { ...libreriaInputs.icono },
      { ...libreriaInputs.password },
      { ...libreriaInputs.email },
      { ...libreriaInputs.formato },
      { ...libreriaInputs.mask },
      { ...libreriaInputs.prefijo },
      { ...libreriaInputs.sufijo },
      { ...libreriaInputs.textarea },
      { ...libreriaInputs.texteditor },
    ];
  }, [libreriaInputs]);

  const encabezadosDocumentos = useMemo(
    () => [
      { field: "FILE_NUMERO", label: "# Documento" },
      { field: "FILE_FECHA", label: "Fecha File", formato: (val) => (moment(val).isValid() ? moment(val).format("DD-MM-YYYY HH:mm") : "") },
      { field: "FILE_CLINOMBRE", label: "CLiente" },
      { field: "DOC_RUBNOMBRE", label: "Rubro" },
      { field: "DOC_MONEDA", label: "Moneda" },
      { field: "DOC_TIPO_NOMBRE", label: "Tipo Documento" },
      { field: "DOC_NUMERO", label: "# Documento" },
      { field: "DOC_VALORDOLAR", label: "Valor" },
      //otros
      // { field: "FILE_GUIABLCP", label: "BLCP"},
      // { field: "FILE_ESTADOCODIGO", label:"estado cod"},
      // { field: "FILE_TIPO", label: "Tipo"},
      // { field: "FILE_TRANSPORTE", label:"transporte"},
      // { field: "FILE_ANIO", label:"Año"},
      // { field: "FILE_MES", label: " MES"},
      // { field: "FILE_MESNOMBRE", label:"nombre mes"},
      // { field: "FILE_DEPTO", label:"departamento"},
      // { field: "FILE_TIPOCAMBIO", label:" tipo cambio"},
      // { field: "DOC_TIPO_COD", label:"tipo cod"},
      // { field: "DOC_TIPO_NOMBRE", label:"Tipo nombre"},
      // { field: "DOC_APLICACION", label: "Aplicacion"},
      // { field: "DOC_TIPODOCUMENTO", label: "Tipo DOC"},
      // { field: "DOC_SERIE", label: "Serie"},
      // { field: "DOC_NUMERO", label: "DOC_NUMERO"},
      // { field: "DOC_REFDOCSERIE", label: "DOC_REFDOCSERIE"},
      // { field: "DOC_REFDOCNUMERO", label: "DOC_REFDOCNUMERO"},
      // { field: "DOC_REFTIPO", label: "DOC_REFTIPO"},
      // { field: "DOC_PROVCODIGO", label: "DOC_PROVCODIGO"},
      // { field: "DOC_PROVNOMBRE", label: "DOC_PROVNOMBRE"},
      // { field: "DOC_REFACTURACION", label: "DOC_REFACTURACION"},
      // { field: "DOC_VALORDOLARSINIVA", label: "DOC_VALORDOLARSINIVA"},


    ], []
  );

  const obtenerDocumentos = useCallback(async () => {
    try {
      const response = await api.get("/api/appweb/lista-bi-aduanas");
      console.log("Respuesta completa de la API:", response);
      console.log("response.data:", response.data.data.data_cli_bi_aduanas);

      let datos = [];
      datos = response.data.data.data_cli_bi_aduanas;

      console.log("Datos extraídos:", datos);
      setDocumentos(datos || []);
    } catch (error) {
      console.error("Error al obtener documentos:", error);
      setDocumentos([]);
    }
  }, []);

  const obtenerTipos = useCallback(async () => {
    try {
      const response = await api.get("/api/appweb/lista-bi-aduanas-tipos-file")
      const tipos = response.data?.data?.data || [];
      setTipoFile(Array.isArray(tipos) ? tipos : []);
    } catch (error) {
      console.error("Error al obtener tipos de file:", error);
      setTipoFile([]);
    }
  }, [])

  const obtenerCliente = useCallback(async () => {
    try {
      const response = await api.get("/api/appweb/lista-bi-aduanas-clientes")
      const clientes = response.data?.data?.data || [];
      setClienteFile(clientes)
    } catch (error) {
      console.error("Error al obtener clinetes de file: ", error)
      setClienteFile([])
    }
  }, [])

  const obtenerRubros = useCallback(async () => {
    try {
      const response = await api.get("/api/appweb/lista-bi-aduanas-rubros")
      const rubros = response.data?.data?.data || [];
      setRubrosFile(rubros)

    } catch (error) {
      console.log("Error al obtener rubro de file: ", error)
      setRubrosFile([]);
    }
  }, [])

  const obtenerTiposDocumentos = useCallback(async () => {
    try {
      const response = await api.get("/api/appweb/lista-bi-aduanas-documentos")
      const documentos = response?.data?.data?.data || [];
      setTiposDocumentosFile(documentos)
    } catch (error) {
      console.log("Error al obtener tipos de documentos file: ", error)
      setTiposDocumentosFile([])
    }
  }, [])

  useEffect(() => {
    obtenerDocumentos();
    obtenerTipos();
    obtenerCliente();
    obtenerRubros();
    obtenerTiposDocumentos()
  }, [obtenerDocumentos, obtenerTipos, obtenerCliente, obtenerRubros, obtenerTiposDocumentos]);

  // Filtrar documentos según los filtros seleccionados
  const documentosFiltrados = useMemo(() => {
    if (!documentos.length) return [];

    return documentos.filter((doc) => {
      // Excluir: Solicitud Orden de Compra (354) + Facturado (76)
      // if (doc.tipo_documento_id === 354 && doc.estado_id === 80) {
      //   return false;
      // }

      // Filtrar por tipos documentos file si hay seleccionados
      if (tipoDocumentoSeleccionado.length > 0) {
        const tiposdocuValues = tipoDocumentoSeleccionado.map((e) => e.value);
        if (!tiposdocuValues.includes(doc.DOC_TIPO_NOMBRE)) return false;
      }

      // Filtrar por proveedores si hay seleccionados
      if (rubroSeleccionado.length > 0) {
        const rubrosValues = rubroSeleccionado.map((p) => p.value);
        if (!rubrosValues.includes(doc.DOC_RUBNOMBRE)) return false;
      }

      if (clienteSeleccionado.length > 0) {
        const clientesValues = clienteSeleccionado.map((c) => c.value);
        if (!clientesValues.includes(doc.FILE_CLINOMBRE)) return false;
      }

      if (tipoFileSeleccionado.length > 0) {
        const fileSeleccionados = tipoFileSeleccionado.map((d) => d.value);
        if (!fileSeleccionados.includes(doc.FILE_TIPO)) return false;
      }

      //range select
      if (Array.isArray(valorTotalRangeSeleccionado) && valorTotalRangeSeleccionado.length === 2) {
        const [minTotal, maxTotal] = valorTotalRangeSeleccionado;
        const valor = Number(doc.DOC_VALORDOLAR) || 0;
        if (valor < minTotal || valor > maxTotal) return false;
      }

      // ← ESTE BLOQUE ES EL QUE FALTABA
      if (
        Array.isArray(fechaRangeSeleccionado) &&
        fechaRangeSeleccionado[0] !== null &&
        fechaRangeSeleccionado[1] !== null
      ) {
        const [fechaInicio, fechaFin] = fechaRangeSeleccionado;
        const fechaDoc = moment(doc.FILE_FECHA);
        if (!fechaDoc.isValid()) return false;
        const tsDoc = fechaDoc.valueOf();
        if (tsDoc < fechaInicio || tsDoc > fechaFin) return false;
      }

      return true;
    });
  }, [documentos, estadoSeleccionado, rubroSeleccionado, tipoDocumentoSeleccionado, valorTotalRangeSeleccionado, clienteSeleccionado, tipoFileSeleccionado, fechaRangeSeleccionado]);

  // Todas las columnas numéricas disponibles para TablaDouble sin vendedor
//   const todasLasColumnas = useMemo(() => {
//     if (!documentos || !documentos.length) return [];

//     const tiposUnicos = {};
//     documentos.forEach((doc) => {
//       const tipo = doc.DOC_TIPO_NOMBRE;
//       if (tipo && !tiposUnicos[tipo]) {
//         tiposUnicos[tipo] = true;
//       }
//     });

//     return Object.keys(tiposUnicos)
//       .sort()
//       .map((tipo) => ({ key: tipo, label: tipo }));
//   }, [documentos]);

//   // Inicializar todas las columnas como visibles cuando carguen
//   useEffect(() => {
//     if (todasLasColumnas.length > 0 && columnasVisibles.size === 0) {
//       setColumnasVisibles(new Set(todasLasColumnas.map((c) => c.key)));
//     }
//   }, [todasLasColumnas]);

//   // Solo las columnas que el usuario eligió mostrar
//   const columnsFromApi = useMemo(
//     () => todasLasColumnas.filter((c) => columnasVisibles.has(c.key)),
//     [todasLasColumnas, columnasVisibles]
//   );

//   const safeNum = (value) => Number(value) || 0;

//   const getClienteId = (doc) =>
//     doc.FILE_CLICODIGO

//   const getClienteNombre = (doc, clientId) =>
//     doc.FILE_CLINOMBRE

//   const getCentroCostoNombre = (doc) =>
//     doc.FILE_DEPTO;

//   const getTipoDocumentoNombre = (doc) =>
//     doc.DOC_TIPO_NOMBRE;

//   const getTipoRubroNombre = (doc) =>
//     doc.DOC_RUBNOMBRE

//   //   const groupedData = useMemo(() => {
//   //   if (!documentosFiltrados.length) return [];

//   //   const columnasNumericas = columnsFromApi.map((column) => column.key);

//   //   const departamentos = {};

//   //   documentosFiltrados.forEach((doc) => {
//   //     const valoresDocumento = {};

//   //     // columnasNumericas.forEach((key) => {
//   //     //   valoresDocumento[key] = safeNum(doc[key]);
//   //     // });
      
//   //   columnasNumericas.forEach((key) => {
//   //     valoresDocumento[key] = key === doc.DOC_TIPO_NOMBRE ? safeNum(doc.DOC_VALORDOLAR) : 0;
//   //   });

//   //     // =========================
//   //     // CENTRO DE COSTO (FILE_DEPTO)
//   //     // =========================

//   //     const deptoId = doc.FILE_DEPTO ?? "SIN_DEPTO";
//   //     const deptoKey = `depto_${deptoId}`;

//   //     if (!departamentos[deptoKey]) {
//   //       departamentos[deptoKey] = {
//   //         id: deptoKey,
//   //         label: deptoId,
//   //         values: {},
//   //         childrenMap: {},
//   //       };

//   //       columnasNumericas.forEach((key) => {
//   //         departamentos[deptoKey].values[key] = 0;
//   //       });
//   //     }


//   //     const depto = departamentos[deptoKey];

//   //     // =========================
//   //     // FILE (FILE_NUMERO) + fecha
//   //     // =========================

//   //     const fileId = doc.FILE_NUMERO ?? "SIN_FILE";
//   //     const fileKey = `file_${fileId}`;

//   //     if (!depto.childrenMap[fileKey]) {
//   //       const fechaFile = moment(doc.FILE_FECHA);
//   //       depto.childrenMap[fileKey] = {
//   //         id: fileKey,
//   //         label: fileId,
//   //         fecha: fechaFile.isValid() ? fechaFile.format("DD-MM-YYYY HH:mm") : "",
//   //         values: {},
//   //         childrenMap: {},
//   //       };

//   //       columnasNumericas.forEach((key) => {
//   //         depto.childrenMap[fileKey].values[key] = 0;
//   //       });
//   //     }

//   //     const file = depto.childrenMap[fileKey];

//   //     // =========================
//   //     // CLIENTE (FILE_CLINOMBRE)
//   //     // =========================

//   //     const clienteId = doc.FILE_CLINOMBRE ?? "SIN_CLIENTE";
//   //     const clienteKey = `cliente_${clienteId}`;

//   //     if (!file.childrenMap[clienteKey]) {
//   //       file.childrenMap[clienteKey] = {
//   //         id: clienteKey,
//   //         label: clienteId,
//   //         values: {},
//   //         childrenMap: {},
//   //       };

//   //       columnasNumericas.forEach((key) => {
//   //         file.childrenMap[clienteKey].values[key] = 0;
//   //       });
//   //     }

//   //     const cliente = file.childrenMap[clienteKey];

//   //     // =========================
//   //     // MONEDA (DOC_MONEDA)
//   //     // =========================

//   //     const monedaId = doc.DOC_MONEDA ?? "SIN_MONEDA";
//   //     const monedaKey = `moneda_${monedaId}`;

//   //     if (!cliente.childrenMap[monedaKey]) {
//   //       cliente.childrenMap[monedaKey] = {
//   //         id: monedaKey,
//   //         label: monedaId,
//   //         values: {},
//   //         childrenMap: {},
//   //       };

//   //       columnasNumericas.forEach((key) => {
//   //         cliente.childrenMap[monedaKey].values[key] = 0;
//   //       });
//   //     }

//   //     const moneda = cliente.childrenMap[monedaKey];

//   //     // =========================
//   //     // RUBRO (DOC_RUBNOMBRE)
//   //     // =========================

//   //     const rubroId = doc.DOC_RUBNOMBRE ?? "SIN_RUBRO";
//   //     const rubroKey = `rubro_${rubroId}`;

//   //     if (!moneda.childrenMap[rubroKey]) {
//   //       moneda.childrenMap[rubroKey] = {
//   //         id: rubroKey,
//   //         label: rubroId,
//   //         values: {},
//   //         childrenMap: {},
//   //       };

//   //       columnasNumericas.forEach((key) => {
//   //         moneda.childrenMap[rubroKey].values[key] = 0;
//   //       });
//   //     }

//   //     const rubro = moneda.childrenMap[rubroKey];

//   //     // =========================
//   //     // TIPO DOCUMENTO (DOC_TIPO_NOMBRE)
//   //     // =========================

//   //     const tipoId = doc.DOC_TIPO_NOMBRE ?? "SIN_TIPO";
//   //     const tipoKey = `tipo_${tipoId}`;

//   //     if (!rubro.childrenMap[tipoKey]) {
//   //       rubro.childrenMap[tipoKey] = {
//   //         id: tipoKey,
//   //         label: tipoId,
//   //         values: {},
//   //         children: [],
//   //       };

//   //       columnasNumericas.forEach((key) => {
//   //         rubro.childrenMap[tipoKey].values[key] = 0;
//   //       });
//   //     }

//   //     const tipoDocumento = rubro.childrenMap[tipoKey];

//   //     // =========================
//   //     // DOCUMENTO (DOC_NUMERO) — hoja final
//   //     // =========================

//   //     const documento = {
//   //       id: `doc_${tipoDocumento.children.length}_${(doc.DOC_NUMERO ?? "").trim()}`,
//   //       label: String(doc.DOC_NUMERO ?? "").trim(),
//   //       values: valoresDocumento,
//   //     };

//   //     tipoDocumento.children.push(documento);

//   //     // =========================
//   //     // ACUMULAR TOTALES EN TODOS LOS NIVELES
//   //     // =========================

//   //     columnasNumericas.forEach((key) => {
//   //       depto.values[key] += valoresDocumento[key];
//   //       file.values[key] += valoresDocumento[key];
//   //       cliente.values[key] += valoresDocumento[key];
//   //       moneda.values[key] += valoresDocumento[key];
//   //       rubro.values[key] += valoresDocumento[key];
//   //       tipoDocumento.values[key] += valoresDocumento[key];
//   //     });
//   //   });

//   //   // =========================
//   //   // CONVERTIR MAPS A ARRAYS (recursivo por nivel)
//   //   // =========================

//   //   return Object.values(departamentos).map((depto) => ({
//   //     id: depto.id,
//   //     label: depto.label,
//   //     values: depto.values,
//   //     children: Object.values(depto.childrenMap).map((file) => ({
//   //       id: file.id,
//   //       label: file.label,
//   //       fecha: file.fecha,
//   //       values: file.values,
//   //       children: Object.values(file.childrenMap).map((cliente) => ({
//   //         id: cliente.id,
//   //         label: cliente.label,
//   //         values: cliente.values,
//   //         children: Object.values(cliente.childrenMap).map((moneda) => ({
//   //           id: moneda.id,
//   //           label: moneda.label,
//   //           values: moneda.values,
//   //           children: Object.values(moneda.childrenMap).map((rubro) => ({
//   //             id: rubro.id,
//   //             label: rubro.label,
//   //             values: rubro.values,
//   //             children: Object.values(rubro.childrenMap),
//   //           })),
//   //         })),
//   //       })),
//   //     })),
//   //   }));
//   // }, [documentosFiltrados, columnsFromApi]);

//   const groupedData = useMemo(() => {
//   if (!documentosFiltrados.length) return [];

//   const columnasNumericas = columnsFromApi.map((column) => column.key);

//   const departamentos = {};

//   documentosFiltrados.forEach((doc) => {
//     const valoresDocumento = {};

//     // Solo la columna que coincide con el tipo de documento de ESTE doc recibe el valor
//     columnasNumericas.forEach((key) => {
//       valoresDocumento[key] = key === doc.DOC_TIPO_NOMBRE ? safeNum(doc.DOC_VALORDOLAR) : 0;
//     });

//     // =========================
//     // CENTRO DE COSTO (FILE_DEPTO)
//     // =========================

//     const deptoId = doc.FILE_DEPTO ?? "SIN_DEPTO";
//     const deptoKey = `depto_${deptoId}`;

//     if (!departamentos[deptoKey]) {
//       departamentos[deptoKey] = {
//         id: deptoKey,
//         label: deptoId,
//         values: {},
//         childrenMap: {},
//       };

//       columnasNumericas.forEach((key) => {
//         departamentos[deptoKey].values[key] = 0;
//       });
//     }

//     const depto = departamentos[deptoKey];

//     // =========================
//     // CLIENTE (FILE_CLINOMBRE)
//     // =========================

//     const clienteId = doc.FILE_CLINOMBRE ?? "SIN_CLIENTE";
//     const clienteKey = `cliente_${clienteId}`;

//     if (!depto.childrenMap[clienteKey]) {
//       depto.childrenMap[clienteKey] = {
//         id: clienteKey,
//         label: clienteId,
//         values: {},
//         childrenMap: {},
//       };

//       columnasNumericas.forEach((key) => {
//         depto.childrenMap[clienteKey].values[key] = 0;
//       });
//     }

//     const cliente = depto.childrenMap[clienteKey];

//     // =========================
//     // FILE (FILE_NUMERO) + mes/año
//     // =========================

//     const fileId = doc.FILE_NUMERO ?? "SIN_FILE";
//     const fileKey = `file_${fileId}`;

//     if (!cliente.childrenMap[fileKey]) {
//       const mes = doc.FILE_MES ?? "";
//       const anio = doc.FILE_ANIO ?? "";
//       const periodo = mes && anio ? `${mes}/${anio}` : (mes || anio || "");

//       cliente.childrenMap[fileKey] = {
//         id: fileKey,
//         label: periodo ? `${fileId} - ${periodo}` : fileId,
//         values: {},
//         childrenMap: {},
//       };

//       columnasNumericas.forEach((key) => {
//         cliente.childrenMap[fileKey].values[key] = 0;
//       });
//     }

//     const file = cliente.childrenMap[fileKey];

//     // =========================
//     // MONEDA (DOC_MONEDA)
//     // =========================

//     const monedaId = doc.DOC_MONEDA ?? "SIN_MONEDA";
//     const monedaKey = `moneda_${monedaId}`;

//     if (!file.childrenMap[monedaKey]) {
//       file.childrenMap[monedaKey] = {
//         id: monedaKey,
//         label: monedaId,
//         values: {},
//         childrenMap: {},
//       };

//       columnasNumericas.forEach((key) => {
//         file.childrenMap[monedaKey].values[key] = 0;
//       });
//     }

//     const moneda = file.childrenMap[monedaKey];


//     // =========================
//     // RUBRO (DOC_RUBNOMBRE)
//     // =========================

//     const rubroId = doc.DOC_RUBNOMBRE ?? "SIN_RUBRO";
//     const rubroKey = `rubro_${rubroId}`;

//     if (!moneda.childrenMap[rubroKey]) {
//       moneda.childrenMap[rubroKey] = {
//         id: rubroKey,
//         label: rubroId,
//         values: {},
//         childrenMap: {},
//       };

//       columnasNumericas.forEach((key) => {
//         moneda.childrenMap[rubroKey].values[key] = 0;
//       });
//     }

//     const rubro = moneda.childrenMap[rubroKey];

//           // =========================
//       // TIPO DOCUMENTO (DOC_TIPO_NOMBRE)
//       // =========================

//       const tipoId = doc.DOC_TIPO_NOMBRE ?? "SIN_TIPO";
//       const tipoKey = `tipo_${tipoId}`;

//       if (!rubro.childrenMap[tipoKey]) {
//         rubro.childrenMap[tipoKey] = {
//           id: tipoKey,
//           label: tipoId,
//           values: {},
//           children: [],
//         };

//         columnasNumericas.forEach((key) => {
//           rubro.childrenMap[tipoKey].values[key] = 0;
//         });
//       }

//       const tipoDocumento = rubro.childrenMap[tipoKey];

//     // =========================
//     // DOCUMENTO (DOC_NUMERO) — hoja final
//     // =========================

//     const documento = {
//       id: `doc_${tipoDocumento.children.length}_${(doc.DOC_NUMERO ?? "").trim()}`,
//       label: String(doc.DOC_NUMERO ?? "").trim(),
//       values: valoresDocumento,
//     };

//     tipoDocumento.children.push(documento);

//     // =========================
//     // ACUMULAR TOTALES EN TODOS LOS NIVELES
//     // =========================

//     columnasNumericas.forEach((key) => {
//       depto.values[key] += valoresDocumento[key];
//       cliente.values[key] += valoresDocumento[key];
//       file.values[key] += valoresDocumento[key];
//       moneda.values[key] += valoresDocumento[key];
//       rubro.values[key] += valoresDocumento[key];
//       tipoDocumento.values[key] += valoresDocumento[key]
//     });
//   });

//   // =========================
//   // CONVERTIR MAPS A ARRAYS (recursivo por nivel)
//   // =========================

//   return Object.values(departamentos).map((depto) => ({
//     id: depto.id,
//     label: depto.label,
//     values: depto.values,
//     children: Object.values(depto.childrenMap).map((cliente) => ({
//       id: cliente.id,
//       label: cliente.label,
//       values: cliente.values,
//       children: Object.values(cliente.childrenMap).map((file) => ({
//         id: file.id,
//         label: file.label,
//         values: file.values,
//         children: Object.values(file.childrenMap).map((moneda) => ({
//           id: moneda.id,
//           label: moneda.label,
//           values: moneda.values,
//           children: Object.values(moneda.childrenMap).map((rubro) => ({
//             id: rubro.id,
//             label: rubro.label,
//             values: rubro.values,
//             children: rubro.children,
//             children: Object.values(rubro.childrenMap).map((tipdoc) => ({
//               id:tipdoc.id,
//               label: tipdoc.label,
//               values: tipdoc.values,
//               children:tipdoc.children
//             }))
//           })),
//         })),
//       })),
//     })),
//   }));
// }, [documentosFiltrados, columnsFromApi]);
 

// Columnas = años únicos encontrados en los documentos, ordenados
  const todasLasColumnas = useMemo(() => {
    if (!documentos?.length) return [];

    const aniosUnicos = {};
    documentos.forEach((doc) => {
      const anio = doc.FILE_ANIO;
      if (anio != null && anio !== "") {
        aniosUnicos[anio] = true;
      }
    });

    return Object.keys(aniosUnicos)
      .sort()
      .map((anio) => ({ key: String(anio), label: String(anio) }));
  }, [documentos]);

  // Inicializar todas las columnas como visibles cuando carguen
  useEffect(() => {
    if (todasLasColumnas.length > 0 && columnasVisibles.size === 0) {
      setColumnasVisibles(new Set(todasLasColumnas.map((c) => c.key)));
    }
  }, [todasLasColumnas]);

  // Solo las columnas que el usuario eligió mostrar
  const columnsFromApi = useMemo(
    () => todasLasColumnas.filter((c) => columnasVisibles.has(c.key)),
    [todasLasColumnas, columnasVisibles]
  );

  const safeNum = (value) => Number(value) || 0;

  const groupedData = useMemo(() => {
    if (!documentosFiltrados.length) return [];

    const columnasNumericas = columnsFromApi.map((column) => column.key);

    const departamentos = {};

    documentosFiltrados.forEach((doc) => {
      const valoresDocumento = {};

      // La columna que recibe el valor es el AÑO del documento
      const anioDoc = String(doc.FILE_ANIO ?? "");
      columnasNumericas.forEach((key) => {
        valoresDocumento[key] = key === anioDoc ? safeNum(doc.DOC_VALORDOLAR) : 0;
      });

      // =========================
      // DEPARTAMENTO (FILE_DEPTO)
      // =========================

      const deptoId = doc.FILE_DEPTO ?? "SIN_DEPTO";
      const deptoKey = `depto_${deptoId}`;

      if (!departamentos[deptoKey]) {
        departamentos[deptoKey] = {
          id: deptoKey,
          label: deptoId,
          values: {},
          childrenMap: {},
        };
        columnasNumericas.forEach((key) => {
          departamentos[deptoKey].values[key] = 0;
        });
      }

      const depto = departamentos[deptoKey];

      // =========================
      // VENDEDOR (FILE_CUSTOMER)
      // =========================

      const vendedorId = doc.FILE_VENDEDOR ?? "SIN_VENDEDOR";
      const vendedorKey = `vendedor_${vendedorId}`;

      if (!depto.childrenMap[vendedorKey]) {
        depto.childrenMap[vendedorKey] = {
          id: vendedorKey,
          label: vendedorId,
          values: {},
          childrenMap: {},
        };
        columnasNumericas.forEach((key) => {
          depto.childrenMap[vendedorKey].values[key] = 0;
        });
      }

      const vendedor = depto.childrenMap[vendedorKey];

      // =========================
      // CLIENTE (FILE_CLINOMBRE)
      // =========================

      const clienteId = doc.FILE_CLINOMBRE ?? "SIN_CLIENTE";
      const clienteKey = `cliente_${clienteId}`;

      if (!vendedor.childrenMap[clienteKey]) {
        vendedor.childrenMap[clienteKey] = {
          id: clienteKey,
          label: clienteId,
          values: {},
          childrenMap: {},
        };
        columnasNumericas.forEach((key) => {
          vendedor.childrenMap[clienteKey].values[key] = 0;
        });
      }

      const cliente = vendedor.childrenMap[clienteKey];

      // =========================
      // FILE (FILE_NUMERO)
      // =========================

      const fileId = doc.FILE_NUMERO ?? "SIN_FILE";
      const fileKey = `file_${fileId}`;

      if (!cliente.childrenMap[fileKey]) {
        const mes = doc.FILE_MES ?? "";
        const anio = doc.FILE_ANIO ?? "";
        const periodo = mes && anio ? `${mes}/${anio}` : mes || anio || "";

        cliente.childrenMap[fileKey] = {
          id: fileKey,
          label: periodo ? `${fileId} - ${periodo}` : String(fileId),
          values: {},
          childrenMap: {},
        };
        columnasNumericas.forEach((key) => {
          cliente.childrenMap[fileKey].values[key] = 0;
        });
      }

      const file = cliente.childrenMap[fileKey];

      // =========================
      // TIPO DOCUMENTO (DOC_TIPO_NOMBRE)
      // =========================

      const tipoDocId = doc.DOC_TIPO_NOMBRE ?? "SIN_TIPO_DOCUMENTO";
      const tipoDocKey = `tipo_documento_${tipoDocId}`;

      if (!file.childrenMap[tipoDocKey]) {
        file.childrenMap[tipoDocKey] = {
          id: tipoDocKey,
          label: tipoDocId,   // <-- era tipoDocKey, debe ser tipoDocId
          values: {},
          children: [],
        };
        columnasNumericas.forEach((key) => {
          file.childrenMap[tipoDocKey].values[key] = 0;
        });
      }

      const tipoDocumento = file.childrenMap[tipoDocKey];

      // =========================
      // DOCUMENTO (DOC_NUMERO) — hoja final
      // =========================

      const documento = {
        id: `doc_${tipoDocumento.children.length}_${String(doc.DOC_NUMERO ?? "").trim()}`,
        label: String(doc.DOC_NUMERO ?? "").trim(),   // <-- era .trim sin ()
        values: valoresDocumento,
      };

      tipoDocumento.children.push(documento);

      // =========================
      // ACUMULAR TOTALES EN TODOS LOS NIVELES
      // =========================

      columnasNumericas.forEach((key) => {
        depto.values[key]        += valoresDocumento[key];
        vendedor.values[key]     += valoresDocumento[key];
        cliente.values[key]      += valoresDocumento[key];
        file.values[key]         += valoresDocumento[key];
        tipoDocumento.values[key]+= valoresDocumento[key];
      });
    });

    // =========================
    // CONVERTIR MAPS A ARRAYS
    // =========================

    return Object.values(departamentos).map((depto) => ({
      id: depto.id,
      label: depto.label,
      values: depto.values,
      children: Object.values(depto.childrenMap).map((vendedor) => ({
        id: vendedor.id,
        label: vendedor.label,
        values: vendedor.values,
        children: Object.values(vendedor.childrenMap).map((cliente) => ({
          id: cliente.id,
          label: cliente.label,
          values: cliente.values,
          children: Object.values(cliente.childrenMap).map((file) => ({
            id: file.id,
            label: file.label,
            values: file.values,
            children: Object.values(file.childrenMap).map((tipoDoc) => ({
              id: tipoDoc.id,
              label: tipoDoc.label,
              values: tipoDoc.values,
              children: tipoDoc.children,
            })),
          })),
        })),
      })),
    }));
  }, [documentosFiltrados, columnsFromApi]);

  return (
    <Box width="100%" maxHeight="85vh" overflow="auto">
      <Grid container mb={2} sx={{ mt: 4, ml: 2 }}>
        <Grid size={{ xs: 2, md: 3 }}>
          <div style={{ marginBottom: 8 }}>Tipos Documentos:</div>
          <SelectFiltro
            options={tiposDocumetosFile}
            value={tipoDocumentoSeleccionado}
            onChange={setTipoDocumentoSeleccionado}
            searchable
            multi
            emitObjects
            placeholder="Selecciona estado"
          />
        </Grid>
        <Grid size={{ xs: 2, md: 3 }}>
          <div style={{ marginBottom: 8 }}>Rubros:</div>
          <SelectFiltro
            options={rubrosFile}
            value={rubroSeleccionado}
            onChange={setRubroSeleccionado}
            searchable
            multi
            emitObjects
            placeholder="Selecciona Rubro"
          />
        </Grid>

        <Grid size={{ xs: 2, md: 3 }}>
          <div style={{ marginBottom: 8 }}>Clientes:</div>
          <SelectFiltro
            options={clienteFile}
            value={clienteSeleccionado}
            onChange={setClienteSeleccionado}
            searchable
            multi
            emitObjects
            placeholder="Selecciona Cliente"
          />
        </Grid>

        <Grid size={{ xs: 2, md: 3 }}>
          <div style={{ marginBottom: 8 }}>Tipo Documento:</div>
          <SelectFiltro
            options={tipoFile}
            value={tipoFileSeleccionado}
            onChange={setTipoFileSeleccionado}
            searchable
            multi
            emitObjects
            placeholder="Selecciona Tipo File"
          />
        </Grid>
      </Grid>

      <Grid container sx={{ ml: 2, mt: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <div style={{ marginBottom: 8 }}>Filtro de rango para Valor Total:</div>
          <RangeSelect
            label="Valor Total"
            min={minValorTotal}
            max={maxValorTotal}
            step={1}
            value={valorTotalRangeSeleccionado}
            onChange={setValorTotalRangeSeleccionado}
            formatValue={(val) => val.toFixed(2)}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <div style={{ marginBottom: 8 }}>Filtro de rango para Fecha File:</div>
          <DateRangeSelect
            label="Fecha File"
            tipo="date"
            min={fechaRangeDisponible[0]}
            max={fechaRangeDisponible[1]}
            value={fechaRangeSeleccionado}
            onChange={setFechaRangeSeleccionado}
          />
        </Grid>
      </Grid>

      <Box mb={2} sx={{ ml: 2, mt: 2, mr: 2 }}>
        <div style={{ marginBottom: 16, padding: 10, background: '#f5f5f5', borderRadius: 4 }}>
          <strong>Documentos totales cargados:</strong> {documentos.length} | <strong>Filtrados:</strong> {documentosFiltrados.length}
        </div>
        <TablaEditableComponent
          titulo="Documentos Filtrados"
          data={documentosFiltrados /* documentos */}
          encabezados={encabezadosDocumentos}
          rowKey="documentoencabezado_id"
        />
      </Box>

      <Box mb={2} sx={{ ml: 2, mt: 2, mr: 2 }}>
        <div style={{ marginBottom: 16, padding: 10, background: '#eef6ff', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong>Resumen agrupado por Empresa / Embarque</strong>
          <ColumnSelect
            columns={todasLasColumnas}
            visibleKeys={columnasVisibles}
            onChange={setColumnasVisibles}
          />
        </div>
        <TablaDouble data={groupedData} columns={columnsFromApi} rowKey="id" showTotals={true} firstColumnWidth={250} />
      </Box>

    </Box>
  );
};

ListaTest.propTypes = {};

export default ListaTest;