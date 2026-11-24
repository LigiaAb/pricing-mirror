import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { Badge, Box, Button, Checkbox, Chip, ClickAwayListener, Divider, Grid, Paper, Popper, styled, TextField, Typography } from "@mui/material";
import { Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TablePagination, TableRow, TableSortLabel } from "@mui/material";
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { Icon, IconButton } from "@mui/material";
import { useSelector } from "react-redux";
import styleTablePagination from "./styles";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import SelectComponent from "./TablaEditable/SelectComponent";
import ToggleComponent from "../Formulario/ToggleComponent";
import DatePickerComponent from "./TablaEditable/DatePickerComponent";
import TextComponent from "./TablaEditable/TextEditorComponent";
import { accionesBase, accionesDeTablaBase, datosBotonesIcono } from ".";
import TooltipComponent from "../TooltipComponent/TooltipComponent";
import ActionAlertComponent from "../Dialog/ActionAlertComponent";
import MenuComponent from "../MenuComponent/MenuComponent";
import { useForm } from "../../hooks/useForm";
import SubirArchivoComponent from "./TablaEditable/SubirArchivoComponent";
import SelectQueryComponent from "./TablaEditable/SelectQueryComponent";

const maincolor = (number = "200") => `background.${number}`;

const nopadding = { pl: 0, pr: 0, pt: 0, pb: 0, px: 0, py: 0, p: 0 };
const nomargin = { ml: 0, mr: 0, mt: 0, mb: 0, mx: 0, my: 0, m: 0 };
const allPM0 = { ...nopadding, ...nomargin };
const hoverStyle = {
  cursor: "pointer",
  transition: "background-color 0.2s ease-in-out",
};
const cellNoMarginNoPadding = (props) => ({ "& td": { ...nopadding, ...nomargin, ...props }, "& th": { ...nopadding, ...nomargin, ...props } });
const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    right: 0,
    top: 0,
    border: `2px solid ${theme.palette.background.paper}`,
    padding: "0 4px",
  },
}));

const tooltipsAcciones = Object.keys(datosBotonesIcono).reduce((acc, key) => {
  acc = { ...acc, [key]: datosBotonesIcono[key]?.tooltip || key };
}, {});

const TablaEditableComponent = (props) => {
  const { titulo, title, tituloTotales = "Total" } = props;
  const { fontSize, themeMode, opositeMode } = useSelector((state) => state.theme);
  const {
    encabezados = [],
    grupos = [],
    data = [],
    background,
    rowsPerPage = 10,
    rowKey,
    idKey,
    objetoBase = {},
    eventosDeTabla = {},
    acciones = {},
    accionesTooltip = tooltipsAcciones,
    camposRequeridos,
    camposRequeridosParaGuardar,
    botones = [],
    useSeach = true,
    filtrarPorColunmas = true,
    editarEnTabla = true,
    totales = false,
    textoAlertaEliminacion,
    onSelection = () => {},
  } = props;
  const { select = false, keepLastInput = false, multipleSelect = false } = props;
  const {
    onVerifyRow,
    onRowAdded = () => {},
    onRowUpdated = () => {},
    onRowEdit = () => {},
    onRowDeleted = () => {},
    onRowClick = () => {},
    onRowCopy = () => {},
    onRowGo = () => {},
    onRowAuth = () => {},
    onRowMail = () => {},
    onRowView = () => {},
    onRowPrint = () => {},
    onRowPdf = () => {},
    onRowPdf1 = () => {},
    onRowKanban = () => {},
    onInput = () => {},
    onRowDownload = () => {},
    onRowSelected = () => {},
    onRowDeselected = () => {},
  } = props;

  const screenInfo = useSelector((state) => state.screen);
  const screenSize = screenInfo.name;
  const accionesBack = true;

  const rowIdentifier = useMemo(() => rowKey || idKey || "id", [rowKey, idKey]);
  const camposRequeridosProcesados = useMemo(() => {
    return camposRequeridos || camposRequeridosParaGuardar || {};
  }, [camposRequeridos, camposRequeridosParaGuardar]);

  const obtenerCamposRequeridos = useCallback(
    (row, mode = "general") => {
      const base = mode === "guardar" ? camposRequeridosParaGuardar : camposRequeridos;

      if (typeof base === "function") {
        return base(row); // función que devuelve un objeto con los campos requeridos
      }

      return base || {};
    },
    [camposRequeridos, camposRequeridosParaGuardar],
  );
  const borderColor = themeMode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";

  const { buscar, onInputChange } = useForm({ buscar: "" });

  const [deleteClick, setDeleteClick] = useState(false);
  const [mostrarError, setMostrarError] = useState(false);
  const [mensajeError, setMensajeError] = useState("");
  const [tipomsgError, setTipomsgError] = useState("error");

  const [resizingColumn, setResizingColumn] = useState(null);
  const [columnWidths, setColumnWidths] = useState({});
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const [agregarFila, setAgregarFila] = useState(true);
  const [isMobile, setisMobile] = useState(false);
  const [currentRow, setCurrentRow] = useState(null);
  const [originalRow, setOriginalRow] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [lineaAEliminar, setLineaAEliminar] = useState(null);
  const [sortOrder, setSortOrder] = useState("none");
  const labelRowsPerPage = useMemo(() => (["xs"].includes(screenSize) ? "" : "Filas por página"), [screenSize]);
  const [page, setPage] = useState(0);
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(rowsPerPage);
  const [nuevaFila, setNuevaFila] = useState({ ...objetoBase });
  const [rows, setRows] = useState(data);
  const [columnasVisibles, setColumnasVisibles] = useState([]);
  const [columnasFiltradas, setColumnasFiltradas] = useState(null);
  const [anchorElFiltroColumnas, setAnchorElFiltroColumnas] = useState(null);
  const [filasFiltradasActivas, setFilasFiltradasActivas] = useState({});

  const [filasSeleccionadas, setFilasSeleccionadas] = useState({});
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);

  const bgcolor = useMemo(() => background || maincolor(themeMode === "dark" ? 50 : 900) + (themeMode === "dark" ? "_40" : "_50"), [background, themeMode]);
  const columnas = useMemo(() => {
    return encabezados
      .map((encabezado) => {
        const id = encabezado.id || encabezado.key || encabezado.name || encabezado.field;
        const label = encabezado.label || encabezado.name || encabezado.columnName || encabezado.headerName;
        let tipo = encabezado.type || encabezado.tipo;
        const multiline = encabezado.multilinea ?? encabezado.multiline ?? true;
        if (tipo === "singleSelect") tipo = "select";

        return {
          ...encabezado,
          valueOptions: undefined,
          id,
          label,
          tipo,
          options: encabezado.options || encabezado.valueOptions,
          valueOption: encabezado.valueOption || encabezado.value_option || "value",
          labelOption: encabezado.labelOption || encabezado.label_option || "label",
          editable: encabezado.editable === undefined ? true : encabezado.editable,
          format: encabezado.format || encabezado.formato,
          filtrar: encabezado.filtrar,
          requerido: encabezado.requerido === undefined ? (camposRequeridosProcesados[id] ? true : encabezado.requerido) : encabezado.requerido,
          multiline: multiline,
          showTooltip: encabezado.showTooltip !== undefined ? encabezado.showTooltip : multiline,
          visible: encabezado.visible !== undefined ? encabezado.visible : true,
        };
      })
      .filter((i) => i.visible);
  }, [encabezados, camposRequeridosProcesados]); // Simplificar dependencias
  const gruposColumnas = useMemo(() => {
    return grupos;
  }, [grupos]); // Simplificar dependencias

  const obtenerValorCampo = useCallback((item, campo) => {
    const campoABuscar = `${campo}`;
    return item[campoABuscar] !== null && item[campoABuscar] !== undefined && item[campoABuscar] !== "" ? item[campoABuscar] : null;
  }, []);

  const aplicarFiltros = useCallback(
    (datos, filtros) => {
      if (!filtros || Object.keys(filtros).length === 0) {
        return datos;
      }

      return datos.filter((item) => {
        return Object.keys(filtros).every((campo) => {
          const valoresFiltro = filtros[campo];
          if (!valoresFiltro || valoresFiltro.length === 0) return true;

          let valorItem = obtenerValorCampo(item, campo);
          if (valorItem === null) return true;

          if (typeof valorItem === "object") {
            return valoresFiltro.some((v) => v.value === valorItem.value);
          }

          const columna = columnas.find((col) => col.id === campo); // Cambiar de 'campo' a 'id'
          if (columna && columna.format && typeof columna.format === "function") {
            valorItem = columna.format(valorItem, item, columna);
          }

          const valorString = String(valorItem);
          return valoresFiltro.includes(valorString);
        });
      });
    },
    [columnas, obtenerValorCampo],
  );

  useEffect(() => {
    setColumnasVisibles(encabezados.map((columna) => ({ id: columna.id, visible: columna.visible === undefined ? true : columna.visible })));
  }, [encabezados]);

  const accionesProcesadas = useMemo(() => ({ ...accionesBase, ...acciones }), [acciones]);

  const verificarAccion = useCallback(
    (tipo, accionFila) => {
      if (accionFila !== undefined) {
        if (accionFila[tipo] === undefined) return accionesProcesadas[tipo];
        if (accionFila[tipo] === true) return true;
        return accionFila[tipo];
      }
      return accionesProcesadas[tipo];
    },
    [accionesProcesadas],
  );
  const accionesFront = useMemo(() => verificarAccion("view") || verificarAccion("go"), [verificarAccion]);

  // Efecto para cambiar el cursor durante el redimensionamiento
  useEffect(() => {
    if (resizingColumn) {
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [resizingColumn]);

  // Event listeners para redimensionamiento
  const handleResize = useCallback(
    (event) => {
      if (!resizingColumn) return;

      const newWidth = startWidth + (event.clientX - startX);
      setColumnWidths((prev) => ({
        ...prev,
        [resizingColumn]: Math.max(newWidth, 50), // Mínimo 50px
      }));
    },
    [resizingColumn, startWidth, startX],
  );

  const stopResize = useCallback(() => {
    setResizingColumn(null);
  }, []);

  useEffect(() => {
    if (resizingColumn) {
      window.addEventListener("mousemove", handleResize);
      window.addEventListener("mouseup", stopResize);
    }

    return () => {
      window.removeEventListener("mousemove", handleResize);
      window.removeEventListener("mouseup", stopResize);
    };
  }, [resizingColumn, handleResize, stopResize]);

  const startResize = useCallback(
    (columnId, event) => {
      setResizingColumn(columnId);
      setStartX(event.clientX);
      setStartWidth(columnWidths[columnId] || 100);
      event.preventDefault();
    },
    [columnWidths],
  );

  const getNewKey = useCallback(
    () =>
      rows.reduce(
        function (prev, current) {
          return prev[rowIdentifier] > current[rowIdentifier] ? prev : current;
        },
        { [rowIdentifier]: 1 },
      )[rowIdentifier] + 1,
    [rows, rowIdentifier],
  );
  // 1. FORMATO - Aplicar formato a los datos originales
  const datosFormateados = useMemo(() => {
    return rows.map((item, index) => {
      const itemFormateado = { ...item };
      columnas.forEach((columna) => {
        // if (columna.format && typeof columna.format === "function") {
        //   itemFormateado[columna.id] = columna.format(item[columna.id], item, columna);
        // }
      });
      return { ...itemFormateado, no: index + 1 };
    });
  }, [rows, columnas]);

  // 2. ORDEN - Aplicar ordenamiento
  const datosOrdenados = useMemo(() => {
    if (!sortField || sortOrder === "none") return datosFormateados;

    return [...datosFormateados].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue < bValue) {
        return sortOrder === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortOrder === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [datosFormateados, sortField, sortOrder]);

  // 3. FILTRO - Aplicar filtros
  const datosFiltrados = useMemo(() => {
    let datosFiltradosTemp = datosOrdenados;

    // Filtro de búsqueda general
    if (buscar && buscar !== "") {
      datosFiltradosTemp = datosFiltradosTemp.filter((item) =>
        Object.values(item).some((valor) => valor !== null && valor !== undefined && valor.toString().toLowerCase().includes(buscar.toLowerCase())),
      );
    }

    // Filtros por columna
    if (Object.keys(filasFiltradasActivas).length > 0) {
      datosFiltradosTemp = aplicarFiltros(datosFiltradosTemp, filasFiltradasActivas);
    }

    return datosFiltradosTemp;
  }, [datosOrdenados, buscar, filasFiltradasActivas, aplicarFiltros]);

  // 4. DATOS PROCESADOS FINALES - Agregar metadata
  const datosProcesada = useMemo(() => {
    return datosFiltrados.map((item, index) => ({
      ...item,
      id: item[rowIdentifier] || index,
    }));
  }, [datosFiltrados, rowIdentifier]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setInternalRowsPerPage(event.target.value, parseInt(event.target.value, 10));
    setPage(0);
  };

  const GenerarIcono = (data, ...etc) => {
    return (
      <IconButton
        {...data}
        sx={
          {
            /* fill: data["aria-disabled"] ? undefined : color ? color : themeMode === "dark" ? "white" : "black" */
          }
        }
        // color={data["aria-disabled"] ? undefined : color ? `${color}.main` : themeMode === "dark" ? "white.main" : "black.main"}
      />
    );
  };

  const datosPaginados = useMemo(() => {
    const startIndex = page * internalRowsPerPage;
    const endIndex = startIndex + internalRowsPerPage;
    return datosProcesada.slice(startIndex, endIndex);
  }, [page, internalRowsPerPage, datosProcesada]);

  useEffect(() => {
    const totalPages = Math.ceil(datosProcesada.length / internalRowsPerPage);
    if (page >= totalPages && totalPages > 0) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [datosProcesada.length, internalRowsPerPage, page]);

  // Funciones CRUD
  const handleEdit = (id, row) => {
    if (editarEnTabla) {
      setEditingId(id);
      setOriginalRow(row);
      if (eventosDeTabla["edit"]) eventosDeTabla["edit"](id, row);
      else onRowEdit(id, row);
    } else {
      if (eventosDeTabla["edit"]) eventosDeTabla["edit"](id, row);
      else onRowEdit(id, row);
    }
  };

  const handleCancel = useCallback(
    (id) => {
      setRows(data.map((row) => (row[rowIdentifier] === id ? { ...originalRow } : row)));
      // onRowUpdated(id, originalRow);
      setOriginalRow(null);
      setEditingId(null);
    },
    [data, rowIdentifier, originalRow],
  );

  const handleView = useCallback(
    (id, row) => {
      if (eventosDeTabla["view"]) eventosDeTabla["view"](id, row);
      else onRowView(id, row);
    },
    [eventosDeTabla, onRowView],
  );

  const handleGo = useCallback(
    (id, row) => {
      if (eventosDeTabla["go"]) eventosDeTabla["go"](id, row);
      else onRowGo(id, row);
    },
    [eventosDeTabla, onRowGo],
  );

  const handleVerifyFields = (row) => {
    const validFields = columnas.filter((enc) => enc.requerido && !row[enc.id]);
    return validFields.map((enc) => ({ label: enc.label, value: row[enc.id] }));
  };

  const handleSave = (id, row) => {
    const filaValida = onVerifyRow ? onVerifyRow(row) : handleVerifyFields(row);
    if (filaValida.length === 0) {
      if (eventosDeTabla["save"]) eventosDeTabla["save"](id, row);
      else onRowUpdated(id, row);
      setEditingId(null);
    } else {
      setMostrarError(true);

      setMensajeError(
        filaValida.map((field) => (
          <ListItem key={field} sx={{ py: 0, my: 0 }}>
            <ListItemText primary={<Typography>{field.label}</Typography>} sx={{ py: 0, my: 0 }} />
          </ListItem>
        )),
      );
    }
  };

  const setNuevaFilaSegura = (nuevoValor) => {
    if (nuevoValor && typeof nuevoValor === "object" && !Array.isArray(nuevoValor)) {
      setNuevaFila(nuevoValor);
    } else {
      console.warn("Intento de asignar valor inválido a nuevaFila:", nuevoValor);
      setNuevaFila({ ...objetoBase });
    }
  };

  const handleCreate = (id) => {
    setEditingId(null);
    const filaGenerada = { ...objetoBase, [rowIdentifier]: getNewKey(), ...nuevaFila };
    const filaValida = onVerifyRow ? onVerifyRow(filaGenerada) : handleVerifyFields(filaGenerada);
    if (filaValida.length === 0) {
      onRowAdded(id, filaGenerada);
      if (!keepLastInput) setNuevaFilaSegura(objetoBase);
    } else {
      setMostrarError(true);

      setMensajeError(
        filaValida.map((field) => (
          <ListItem key={field} sx={{ py: 0, my: 0 }}>
            <ListItemText primary={<Typography>{field.label}</Typography>} sx={{ py: 0, my: 0 }} />
          </ListItem>
        )),
      );
    }
  };

  const handleSeleccionarFila = (id, row) => {
    if (multipleSelect) {
      !filasSeleccionadas?.[id] ? onRowSelected(id, row) : onRowDeselected(id, row);

      if (id in filasSeleccionadas) {
        setFilasSeleccionadas((prev) => ({ ...prev, [id]: !prev[id] || false }));
      } else {
        setFilasSeleccionadas((prev) => ({ ...prev, [id]: true }));
      }
    } else {
      if (filaSeleccionada) {
        if (filaSeleccionada[rowIdentifier] === id) {
          setFilaSeleccionada(null);
          onSelection(null);
        } else {
          setFilaSeleccionada(row);
          onSelection(row);
        }
      } else {
        setFilaSeleccionada(row);
        onSelection(row);
      }
    }
  };

  useEffect(() => {
    onSelection
      ? onSelection(
          Object.keys(filasSeleccionadas)
            .map((k) => (filasSeleccionadas[k] ? datosProcesada.find((i) => `${i.id}` === `${k}`) : null))
            .filter((i) => i),
        )
      : undefined;
  }, [datosProcesada, rowIdentifier, filasSeleccionadas, onSelection]);

  const handleRowClick = (event, row) => {
    if (event.detail === 2 && acciones.edit && editarEnTabla) {
      setEditingId(row[rowIdentifier || "id"]);
      setOriginalRow(row);
    } else {
      setSelectedRow((r) => (r === row[rowIdentifier || "id"] ? null : row[rowIdentifier || "id"]));
      onRowClick(row[rowIdentifier || "id"], row);
      select ? handleSeleccionarFila(row[rowIdentifier || "id"], row) : undefined;
    }
  };

  // Función para manejar el ordenamiento
  const handleSort = useCallback(
    (field) => {
      // alert("Ordenamiento por: " + field);
      if (field === sortField) {
        const isAsc = sortField === field && sortOrder === "asc";
        const isDesc = sortField === field && sortOrder === "desc";
        const isNone = sortOrder === "none";

        if (isDesc) {
          setSortOrder("none");
          setSortField(null);
        } else if (isNone) {
          setSortOrder("asc");
          setSortField(field);
        } else if (isAsc) {
          setSortOrder("desc");
          setSortField(field);
        }
      } else {
        setSortOrder("asc");
        setSortField(field);
      }
    },
    [sortField, sortOrder],
  );

  const handleDelete = (id, row) => {
    if (eventosDeTabla["delete"]) eventosDeTabla["delete"](id, row);
    else onRowDeleted(id, row);
    setLineaAEliminar(null);
  };

  const formmatoDeContenidoDeCelda = (d, c) => {
    const color = d.propiedadesDeTabla ? d.propiedadesDeTabla[c.id]?.color : undefined;
    let valor = d[c.id] || "";
    if (c.format) return c.format(d[c.id], d, c);
    if (c.value && typeof c.value === "function") valor = c.value(d[c.id], d, c);

    // Si el valor es un elemento React válido (componente React), renderizarlo directamente
    if (valor && typeof valor === "object" && valor.$$typeof) {
      return valor;
    }

    if (!c.tipo) {
      if (typeof d[c.id] === "object" && !!c.options) return valor?.[c.valueOption];
      if (typeof d[c.id] === "string")
        return (
          <Typography component="span" color={color}>
            {valor}
          </Typography>
        );
    }
    if (c.tipo === "string" || c.tipo === "email" || c.tipo === "mail" || c.tipo === "number" || c.tipo === "text")
      return (
        <Typography component="span" color={color}>
          {valor}
        </Typography>
      );
    if (c.tipo === "boolean" || c.tipo === "checkbox") return <Typography className={valor ? "c-cheque" : "c-x1"} color={valor ? "success.main" : "error.main"} />;
    if (c.tipo === "date") return valor ? new Date(valor).toLocaleDateString() : "";
    if (c.tipo === "select" || c.tipo === "selectQuery") return valor?.[c.labelOption];
    if (c.tipo === "file" || c.tipo === "archivo") {
      if (!valor) return "";
      else if (typeof valor === "string") return valor.substring(valor.lastIndexOf("/") + 1);
      else if (typeof valor === "object" && !!c.options) return valor?.name;
    }

    return valor.toString(); //JSON.stringify({ d, c: { ...c, options: undefined } }, null, 2);
  };

  const verificarSiEsEditable = (c, d) => {
    if (!c.editable) return false;
    if (typeof c.editable === "function") return c.editable(d, d[rowIdentifier], c);
    return c.editable;
  };

  const renderGrupos = useCallback(
    (c, ind) => {
      const colSpan = c.columns.length;

      return (
        <TableCell align="center" colSpan={colSpan} key={`${c.id}_${ind}_h`} sx={{}}>
          <Typography fontWeight="bolder" width="100%" sx={{ color: `${c.color || "primary"}.${opositeMode}` }}>
            {c.label}
          </Typography>
        </TableCell>
      );
    },
    [opositeMode],
  );

  const renderEncabezados = useCallback(
    (c, ind) => {
      const currentWidth = columnWidths[c.id] || "auto";

      return (
        <TableCell
          key={`${c.id}_${ind}_h`}
          sx={{
            position: "relative",
            width: currentWidth,
            minWidth: 50,
            cursor: resizingColumn === c.id ? "col-resize" : "default",
            userSelect: "none",
          }}
        >
          <Grid width="100%" direction="row" container alignItems="center" wrap="nowrap" textOverflow="ellipsis" color="primary.main">
            {filtrarPorColunmas && c.filtrar && (
              <TooltipComponent titulo={`Filtro por ${c.label}`} fontSize={14} borderWidth={1}>
                <Grid minWidth={40} sx={{ zIndex: 5000 }}>
                  {/* <Typography className="c-lupa" onClick={() => alert(c.label)} /> */}
                  <StyledBadge
                    badgeContent={filasFiltradasActivas[c.field]?.length}
                    color="primary"
                    anchorOrigin={{
                      vertical: "bottom",
                      horizontal: "right",
                    }}
                    overlap="circular"
                  >
                    <IconButton
                      sx={{ width: "100%", justifyContent: "center", lineHeight: 0.5, my: 0 }}
                      onClick={(e) => {
                        setColumnasFiltradas(c);
                        setAnchorElFiltroColumnas(e.currentTarget);
                      }}
                    >
                      <Icon
                        sx={{
                          fontSize: 14,
                          color: `primary.${opositeMode}`,
                          height: "auto !important",
                          width: "auto !important",
                          lineHeight: "normal",
                        }}
                        className="c-lupa"
                      />
                    </IconButton>
                  </StyledBadge>
                </Grid>
              </TooltipComponent>
            )}
            <Grid size="grow">
              <TableSortLabel
                direction={sortField === c.id ? sortOrder : "asc"}
                onClick={() => handleSort(c.id)}
                active={sortField === c.id}
                sx={{
                  width: "calc(100%)",
                  "&*": { width: "calc(100% - 10px)" },
                  "&:hover": { borderRightColor: "grey.main", borderRighStyle: "solid", borderRighWidth: 1 },
                }}
              >
                <Typography fontWeight="bold" width="100%" sx={{ color: `primary.${opositeMode}` }}>
                  {c.label}
                </Typography>
              </TableSortLabel>
            </Grid>
          </Grid>

          {/* Handle de redimensionamiento */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              right: 2,
              width: "1px",
              height: "100%",
              cursor: "e-resize",
              bgcolor: resizingColumn === c.id ? "grey.200" : "transparent",
              zIndex: 200,
              caretColor: "text.main",
            }}
          />
          <Box
            style={{
              position: "absolute",
              top: 0,
              right: 5,
              width: "10px",
              height: "100%",
              cursor: "e-resize",
              bgcolor: resizingColumn === c.id ? "transparent" : "transparent",
              zIndex: 200,
              caretColor: "text.main",
            }}
            onMouseDown={(e) => startResize(c.id, e)}
          />
        </TableCell>
      );
    },
    [columnWidths, resizingColumn, sortField, sortOrder, handleSort, startResize, opositeMode, filasFiltradasActivas],
  );

  const renderEditableCell = (row, column, id, isNew = false) => {
    const value = row[column.id];
    let rowProcesada = row;

    const id_field = `${row[rowIdentifier]}_${column.tipo}_${column.id}`;
    if (!verificarSiEsEditable(column, row)) return isNew ? "" : formmatoDeContenidoDeCelda(row, column);

    let item;

    // En TablaEditableComponent - modifica handleCellChange:
    const handleChange = (newValue, _rowProcesada = rowProcesada) => {
      if (isNew) {
        let updatedRow = { ...nuevaFila, [column.id]: newValue };

        // Llama a onInput y recibe posible modificación
        const result = onInput({
          field: column.id,
          value: newValue,
          row: _rowProcesada,
          id: undefined,
          isNew: true,
        });

        // Si onInput devuelve una fila, úsala
        if (result && typeof result === "object" && !Array.isArray(result)) {
          _rowProcesada = result?.row || result;
          setNuevaFila(result?.row || result);
        } else {
          setNuevaFila(updatedRow);
        }
      } else {
        let updatedRow = { ...rows.find((r) => r[rowIdentifier] === row[rowIdentifier]), [column.id]: newValue };

        // Llama a onInput y recibe posible modificación
        const result = onInput({
          field: column.id,
          value: newValue,
          row: updatedRow,
          id: row[rowIdentifier],
          isNew: false,
        });
        // Si onInput devuelve una fila, úsala
        if (result && result.row) {
          setRows(rows.map((r) => (r[rowIdentifier] === row[rowIdentifier] ? result.row : r)));
          _rowProcesada = result.row;
        } else {
          setRows(rows.map((r) => (r[rowIdentifier] === row[rowIdentifier] ? updatedRow : r)));
        }
      }
    };

    let opcionesProcesadas = [];
    if (column) {
      try {
        if (typeof column.options === "function") {
          // Pasar parámetros solo si row existe
          const optionsResult = rowProcesada ? column.options(rowProcesada, column.id) : column.options();
          opcionesProcesadas = Array.isArray(optionsResult) ? optionsResult : [];
        } else {
          opcionesProcesadas = Array.isArray(column.options) ? column.options : [];
        }
      } catch (error) {
        console.warn(`Error en options de columna ${column?.id}:`, error);
        opcionesProcesadas = [];
      }
    }

    column.id === "aduana_puerto_aereopuerto" && console.log(opcionesProcesadas);

    switch (column.tipo) {
      case "archivo":
      case "file":
        item = (
          <SubirArchivoComponent
            input={{
              id: id_field,
              val: row[column.id],
              options: opcionesProcesadas, // typeof column.options === "function" ? column.options(row) : column.options,

              valueOption: column.valueOption,
              labelOption: column.labelOption,
              readonly: column.readonly,
              ...column,
            }}
            id={id_field}
            onInput={handleChange}
          />
        );
        break;

      case "select":
        item = (
          <SelectComponent
            input={{
              ...column,
              id: column.id,
              val: row[column.id],
              options: opcionesProcesadas, // typeof column.options === "function" ? column.options(row) : column.options,
              fetchOptions: column.fetchOptions,
              valueOption: column.valueOption,
              labelOption: column.labelOption,
              actions: column.actions,
              readonly: column.readonly,
            }}
            id={id_field}
            onInput={handleChange}
          />
        );
        break;

      case "selectQuery":
        item = (
          <SelectQueryComponent
            onInput={handleChange}
            input={{
              ...column,
              id: column.id,
              tipo: "select",
              options: opcionesProcesadas, // typeof column.options === "function" ? column.options(row) : column.options,
              labelOption: column.labelOption,
              valueOption: column.valueOption,
              multiple: column.multiple,
              val: row[column.id],
              label: " ",
              readonly: column.readonly,
              onCrear: column.onCrear,
              url: column.url,
              queryField: column.queryField,
              params: column.params,
              method: column.method || "POST",
            }}
            id={id_field}
          />
        );
        break;

      case "boolean":
        item = <ToggleComponent input={{ id: column.id, val: row[column.id], readonly: column.readonly }} id={id_field} onInput={handleChange} />;
        break;

      case "checkbox":
        item = <Checkbox checked={row[column.id]} id={id_field} sx={{ p: 0, m: 0 }} onChange={handleChange} />;
        break;

      case "date":
        item = <DatePickerComponent input={{ id: column.id, val: row[column.id], readonly: column.readonly }} id={id_field} onInput={handleChange} />;
        break;

      default:
        item = <TextComponent input={{ id: column.id, val: row[column.id], readonly: column.readonly, ...column }} id={id_field} onInput={handleChange} />;
    }
    return <Grid bgcolor="background.main_10">{item}</Grid>;
  };

  const botonDeAcccion = (data, tipo, url, click, disabled = false) => {
    return (
      <TooltipComponent
        titulo={accionesTooltip ? (accionesTooltip[tipo] ? accionesTooltip[tipo] : datosBotonesIcono[tipo]?.tooltip) : datosBotonesIcono[tipo]?.tooltip}
        borderColor={`${datosBotonesIcono[tipo]?.color}.${"main"}`}
        bgcolor={"background.main_60"}
        color={"text.main"}
      >
        <Grid sx={{ ...hoverStyle, borderRadius: 50 }}>
          <IconButton onClick={click} color="background" size="small" sx={{ fontSize: 14 }} disabled={disabled}>
            <Typography variant="span" className={`${datosBotonesIcono[tipo]?.icono}`} color={datosBotonesIcono[tipo]?.color + `.${"main"}`} />
          </IconButton>
        </Grid>
      </TooltipComponent>
    );
  };

  const renderCeldaTotal = (data, column) => {
    if (column.total)
      return (
        <Typography key={`${column.id}_totales`} sx={{ width: columnWidths[column.id] || "auto", minWidth: 50 }}>
          {typeof column.total === "function" ? formmatoDeContenidoDeCelda({ [column.id]: column.total(data) }, column) : ""}
        </Typography>
      );
    else return <Typography key={`${column.id}_totales`} sx={{ width: columnWidths[column.id] || "auto", minWidth: 50 }}></Typography>;
  };

  const renderizarBotones = (i) => (
    <Button
      onClick={(ev) => {
        ev?.preventDefault();
        i.onClick(ev);
      }}
      disabled={i.disabled || i.readonly}
      variant="outlined"
      sx={{ m: 0, p: 0, px: 1, borderColor: `${i.color}.${opositeMode}`, color: `${i.color}.${opositeMode}` }}
    >
      {i.label}
    </Button>
  );

  const RenderFiltroDeColumna = ({ open, anchorEl, columna, datos, filtrosActivos, onFiltrosChange, onClose }) => {
    const opciones = useMemo(() => {
      const valoresUnicos = new Set();
      datos.forEach((item) => {
        let valor = obtenerValorCampo(item, columna.field);

        // Aplicar formato si existe
        if (columna.format && typeof columna.format === "function") {
          valor = columna.format(valor, item);
        }

        if (valor !== null && valor !== undefined && valor !== "") {
          // const valorString = String(valor);
          valoresUnicos.add(valor);
        }
      });

      return Array.from(valoresUnicos).sort();
    }, [datos, columna]);

    const valoresSeleccionados = filtrosActivos[columna.field] || [];

    const handleCheckboxChange = (valor) => {
      const nuevosValores = valoresSeleccionados.includes(valor) ? valoresSeleccionados.filter((v) => v !== valor) : [...valoresSeleccionados, valor];

      const nuevosFiltros = { ...filtrosActivos };

      if (nuevosValores.length > 0) {
        nuevosFiltros[columna.field] = nuevosValores;
      } else {
        delete nuevosFiltros[columna.field];
      }

      onFiltrosChange(nuevosFiltros);
      // onClose();
    };

    const handleLimpiar = () => {
      const nuevosFiltros = { ...filtrosActivos };
      delete nuevosFiltros[columna.field];
      onFiltrosChange(nuevosFiltros);
      onClose();
    };

    return (
      <Popper open={open} anchorEl={anchorEl} placement="bottom-start" sx={{ zIndex: 1300 }}>
        <ClickAwayListener onClickAway={onClose}>
          <Paper elevation={3} sx={{ p: 1, pr: 2, minWidth: 200, maxHeight: "50vh", overflow: "auto" }}>
            <Grid container direction="column">
              <Grid size="100%" container columnGap={0.5}>
                <Grid sx={{ ...hoverStyle, borderRadius: 50 }}>
                  <TooltipComponent titulo="Cerrar" borderColor={`error.main`} bgcolor={"background.main"} color={"text.main"}>
                    <IconButton onClick={onClose} color="background" size="small" sx={{ fontSize: 10, p: "0px !important" }}>
                      <Typography variant="span" className={`c-x1`} color={`error.main`} />
                    </IconButton>
                  </TooltipComponent>
                </Grid>
                <Grid size="auto">
                  <Typography variant="span" color={`primary.${opositeMode}`}>
                    Filtrar por
                  </Typography>
                </Grid>
                <Grid size="grow">
                  <Divider>
                    <Typography variant="span" color={`primary.${opositeMode}`}>
                      <b>{columna.label}</b>
                    </Typography>
                  </Divider>
                </Grid>
              </Grid>
              <Grid size="100%" container mt={1}>
                <Grid size="grow">
                  <Typography variant="caption" color="text.main">
                    Filtros activos:
                  </Typography>
                </Grid>
                <Grid size="auto">
                  <TooltipComponent
                    titulo="Limpiar"
                    borderColor={valoresSeleccionados.length === 0 ? `grey.main` : `error.main`}
                    bgcolor={"background.main"}
                    color={valoresSeleccionados.length === 0 ? `grey.main` : "text.main"}
                  >
                    <Grid sx={{ ...hoverStyle, borderRadius: 50 }}>
                      <IconButton onClick={handleLimpiar} color="background" size="small" sx={{ fontSize: 10 }} disabled={valoresSeleccionados.length === 0}>
                        <Typography variant="span" className={`c-x1`} color={valoresSeleccionados.length === 0 ? `grey.main` : `error.main`} />
                      </IconButton>
                    </Grid>
                  </TooltipComponent>
                </Grid>
              </Grid>
              <Grid size="100%">
                {valoresSeleccionados.length > 0 && (
                  <Grid sx={{ mb: 1, maxHeight: "100px", overflowY: "auto" }} container>
                    {valoresSeleccionados.map((valor, index) => (
                      <Grid key={JSON.stringify(index)} sx={{ mt: 0.5 }}>
                        <TooltipComponent titulo="Quitar esta seleccion">
                          <Chip label={typeof valor === "object" ? valor.label : valor} size="small" sx={{ m: 0 }} onClick={() => handleCheckboxChange(valor)} />
                        </TooltipComponent>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Grid>
              <Grid size="100%" sx={{ maxHeight: "150px", overflowY: "auto" }}>
                <List disablePadding>
                  {opciones.map((opcion) => (
                    <ListItem key={JSON.stringify(opcion)} dense sx={{ p: 0 }}>
                      <ListItemButton onClick={() => handleCheckboxChange(opcion)}>
                        <ListItemIcon>
                          <Checkbox checked={valoresSeleccionados.includes(opcion)} size="small" sx={{ p: 0, pr: 1 }} />
                        </ListItemIcon>
                        <ListItemText id={JSON.stringify(opcion)} primary={typeof opcion === "object" ? opcion.label : opcion} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </Paper>
        </ClickAwayListener>
      </Popper>
    );
  };

  const handleCloseFiltro = () => {
    setAnchorElFiltroColumnas(null);
    setColumnasFiltradas(null);
  };

  const handleFiltrosChange = (nuevosFiltros) => {
    setFilasFiltradasActivas(nuevosFiltros);
  };

  useEffect(() => {
    setRows(data);
  }, [data]);

  // Agrega este useEffect cerca de los otros useEffect existentes
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && editingId !== null) {
        handleCancel(editingId);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [editingId, handleCancel]); // Dependencias del efecto

  RenderFiltroDeColumna.propTypes = {
    open: PropTypes.bool,
    anchorEl: PropTypes.any,
    columna: PropTypes.object,
    datos: PropTypes.array,
    filtrosActivos: PropTypes.obj,
    onFiltrosChange: PropTypes.func,
    onClose: PropTypes.func,
  };

  const renderizarAccion = (tipo, d, funcion) => {
    return (
      verificarAccion(["cancel", "save"].includes(tipo, d?.accionesDeTabla) ? "edit" : tipo, d?.accionesDeTabla) &&
      botonDeAcccion(nuevaFila, tipo, undefined, () => {
        typeof funcion === "function" && funcion(d[rowIdentifier], d);
      })
    );
  };

  return (
    <Box
      sx={{
        zIndex: 10,
        maxWidth: "100%",
        width: "100%",
        overflow: "hidden",
        p: 1,
        bgcolor: bgcolor,
        borderColor: themeMode === "dark" ? "rgba(40, 40, 40, 1)" : "rgba(224, 224, 224, 1)",
        borderStyle: "solid",
        borderWidth: 0.5,
        borderRadius: 2,
        backdropFilter: "blur(3px)",
        // boxShadow: "2px 2px 5px 2px rgba(0,0,0,0.1)",
        WebkitBoxShadow: themeMode === "dark" ? "0px 0px 5px 1px rgba(180,180,180,0.58)" : "2.5px 10px 10px rgba(0,0,0,0.2)",
        boxShadow: themeMode === "dark" ? "0px 0px 5px 1px rgba(180,180,180,0.58)" : "2.5px 10px 10px rgba(0,0,0,0.2)",
        "& .MuiTableCell-body": { m: 0, p: 0, py: 0, px: 0.5 },
      }}
    >
      {/* <pre>{JSON.stringify(filasFiltradasActivas, null, 2)}</pre> */}
      <Grid container>
        <Grid size={{ md: "grow", sm: 12, xs: 12 }}>
          <Typography variant="h5" color={`primary.${opositeMode}`} gutterBottom sx={{ fontWeight: "bold", mb: 3 }}>
            {titulo || title}
          </Typography>
        </Grid>
        <Grid size="auto">
          {botones && (
            <Grid container size="auto" sx={{ mx: 1, py: 1 }} spacing={0.5}>
              {Array.isArray(botones)
                ? botones.map((i) => <React.Fragment key={`boton_${i.name || i.label}`}>{renderizarBotones(i)}</React.Fragment>)
                : Object.keys(botones)
                    .filter((i) => botones[i])
                    .map((i) => <React.Fragment key={`boton_${i}`}>{renderizarBotones(botones[i])}</React.Fragment>)}
            </Grid>
          )}
        </Grid>
        <Grid size="auto">
          {useSeach && (
            <Grid size="auto" sx={{ py: 1 }}>
              <TextField autoComplete="off" label="" variant="standard" size="small" type="text" placeholder="Buscar..." fullWidth name="buscar" value={buscar} onChange={onInputChange} />
            </Grid>
          )}
        </Grid>
      </Grid>
      <TableContainer component={Grid}>
        <Table
          aria-label="a dense table"
          sx={{
            width: "100%",
            "& .MuiTableCell-root": {
              borderRight: `0.5px solid ${borderColor}`,
              "&:last-child": {
                borderRight: "none",
              },
            },
          }}
          size="small"
          // {...props}
        >
          <TableHead>
            {/* FILA 1: GRUPOS DE COLUMNAS */}
            {gruposColumnas?.length > 0 && (
              <TableRow>
                <TableCell /> {/* número de fila */}
                {select && <TableCell />}
                {accionesFront && <TableCell />}
                {gruposColumnas.map(renderGrupos)}
                {accionesBack && <TableCell />}
              </TableRow>
            )}

            {/* FILA 2: ENCABEZADOS NORMALES */}
            <TableRow hover>
              <TableCell></TableCell>
              {select && <TableCell></TableCell>}
              {accionesFront && <TableCell sx={{ width: "1%" }}></TableCell>}
              {columnas.map(renderEncabezados)}
              {accionesBack && <TableCell sx={{ width: "1%" }}></TableCell>}
            </TableRow>
          </TableHead>
          <TableBody sx={{ ...cellNoMarginNoPadding() }}>
            {acciones.add && (
              <TableRow hover sx={{ bgcolor }}>
                <TableCell></TableCell>
                {select && <TableCell></TableCell>}
                {accionesFront && <TableCell sx={{}}></TableCell>}
                {columnas.map((c, ind) => (
                  <TableCell key={`${c.id}_${ind}_b`} sx={{ width: columnWidths[c.id] || "auto", minWidth: 50 }}>
                    <Grid sx={{ bgcolor, p: 0.1, width: "100%", height: "100%" }} width="100%">
                      {renderEditableCell(nuevaFila, c, undefined, true)}
                    </Grid>
                  </TableCell>
                ))}
                {accionesBack && (
                  <TableCell sx={{ width: "1%" }}>
                    <Grid container direction="row" justifyContent="space-around" flexWrap="nowrap">
                      {botonDeAcccion(nuevaFila, "add", undefined, () => handleCreate(getNewKey()))}
                      {botonDeAcccion(nuevaFila, "limpiar", undefined, () => setNuevaFila(objetoBase), JSON.stringify(nuevaFila) === JSON.stringify(objetoBase))}
                    </Grid>
                  </TableCell>
                )}
              </TableRow>
            )}
            {datosPaginados.map((d, ind) => (
              <TableRow
                hover
                sx={{ bgcolor: d[rowIdentifier || "id"] === editingId ? bgcolor : d[rowIdentifier || "id"] === selectedRow ? "primary.main_10" : undefined }}
                key={d[rowIdentifier || "id"]}
                onDoubleClick={(ev) => handleRowClick(ev, d)}
                onClick={(ev) => handleRowClick(ev, d)}
              >
                <TableCell sx={[{ color: "grey.200", m: 0, p: 0, maxWidth: "20px", fontSize: fontSize - 5, textAlign: "center", ...allPM0, width: "1%" }]} className="row">
                  {d.no}
                </TableCell>
                {select && (
                  <TableCell sx={{ width: "1%" }}>
                    {
                      <Checkbox
                        checked={
                          multipleSelect
                            ? d[rowIdentifier] in filasSeleccionadas
                              ? !!filasSeleccionadas[d[rowIdentifier]]
                              : false
                            : filaSeleccionada
                              ? filaSeleccionada[rowIdentifier] === d[rowIdentifier]
                              : false
                        }
                        onChange={() => handleSeleccionarFila(d[rowIdentifier || "id"], d)}
                        id={`checkbox_checked_${d[rowIdentifier || "id"]}`}
                        sx={{ p: 0, m: 0 }}
                      />
                    }
                  </TableCell>
                )}
                {accionesFront && (
                  <TableCell sx={{ width: "1%" }}>
                    <Grid container direction="row" justifyContent="space-around" flexWrap="nowrap">
                      {renderizarAccion("view", d, handleView)}
                      {renderizarAccion("go", d, handleGo)}
                    </Grid>
                  </TableCell>
                )}
                {columnas.map((c, ind) => (
                  <TableCell
                    key={`${c.id}_${ind}_b`}
                    align={c.align || "left"}
                    sx={{
                      width: columnWidths[c.id] || "auto",
                      minWidth: 50,
                      whiteSpace: c.multiline ? "" : "nowrap",
                      textAlign: c.textAlign || c.align || "left",
                    }}
                  >
                    {(typeof c.tooltip === "function" ? c.tooltip(c.id, d, c) : c.tooltip) ? (
                      <TooltipComponent {...(c.tooltip_properties || {})} titulo={typeof c.tooltip === "function" ? c.tooltip(d, c) : c.tooltip}>
                        <Grid sx={{ p: 0, m: 0 }}>{editingId === d[rowIdentifier] && verificarSiEsEditable(c, d) ? renderEditableCell(d, c, d[c.id], false) : formmatoDeContenidoDeCelda(d, c)}</Grid>
                      </TooltipComponent>
                    ) : (
                      <>{editingId === d[rowIdentifier] && verificarSiEsEditable(c, d) ? renderEditableCell(d, c, d[c.id], false) : formmatoDeContenidoDeCelda(d, c)}</>
                    )}
                  </TableCell>
                ))}
                {accionesBack && (
                  <TableCell sx={{ width: "1%" }}>
                    {editingId === d[rowIdentifier] ? (
                      <Grid container direction="row" justifyContent="end" flexWrap="nowrap">
                        {verificarAccion("edit", d?.accionesDeTabla) && renderizarAccion("cancel", d, handleCancel)}
                        {verificarAccion("edit", d?.accionesDeTabla) && renderizarAccion("save", d, handleSave)}
                      </Grid>
                    ) : (
                      <Grid container direction="row" justifyContent="end" flexWrap="nowrap">
                        {renderizarAccion("kanban", d, eventosDeTabla["kanban"] || onRowKanban)}
                        {renderizarAccion("pdf", d, eventosDeTabla["pdf"] || onRowPdf)}
                        {renderizarAccion("pdf1", d, eventosDeTabla["pdf1"] || onRowPdf1)}
                        {renderizarAccion("print", d, eventosDeTabla["print"] || onRowPrint)}
                        {renderizarAccion("download", d, eventosDeTabla["download"] || onRowDownload)}
                        {renderizarAccion("mail", d, eventosDeTabla["mail"] || onRowMail)}
                        {renderizarAccion("auth", d, eventosDeTabla["auth"] || onRowAuth)}
                        {renderizarAccion("edit", d, handleEdit)}
                        {renderizarAccion("copy", d, eventosDeTabla["copy"] || onRowCopy)}
                        {renderizarAccion("delete", d, (id, d) => {
                          setLineaAEliminar(d);
                          setDeleteClick(true);
                        })}
                      </Grid>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
          {totales && (
            <TableFooter sx={{ ...cellNoMarginNoPadding() }}>
              <TableRow hover sx={{ borderTopWidth: 20, bgcolor: maincolor("700") }}>
                <TableCell sx={{ width: "1%", textAlign: "center" }} colSpan={select && !accionesFront ? 2 : !select && accionesFront ? 2 : select && accionesFront ? 3 : 0}>
                  {tituloTotales}
                </TableCell>
                {columnas.map((c, ind) => (
                  <TableCell key={`${c.id}_${ind}_t`} sx={{ width: columnWidths[c.id] || "auto", minWidth: 50, px: 1 }}>
                    {renderCeldaTotal(datosProcesada, c)}
                  </TableCell>
                ))}
                {accionesBack && <TableCell></TableCell>}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </TableContainer>
      <Grid container fontWeight={100} fontSize="inherit">
        {select && (
          <Grid size="auto" sx={{ pr: 5 }}>
            {/* {`Filas seleccionadas: ${selected ? (Array.isArray(selected) ? selected?.length : 1) : 0}`} */}
          </Grid>
        )}
        <Grid size="auto" sx={{ pr: 5 }}>
          Página actual: {page + 1}
        </Grid>
        <Grid size="grow"></Grid>
        <Grid size="grow"></Grid>
        <Grid>
          <TablePagination
            component="div"
            rowsPerPageOptions={[5, 10, 15, 25, { label: "All", value: datosProcesada?.length }]}
            colSpan={columnas?.length}
            count={datosProcesada?.length}
            rowsPerPage={internalRowsPerPage}
            page={page}
            showFirstButton
            showLastButton
            labelRowsPerPage={labelRowsPerPage}
            slotProps={{
              select: {
                label: labelRowsPerPage,
                "aria-label": labelRowsPerPage,
                MenuProps: {
                  sx: {
                    "& .MuiMenu-paper": { elevation: 0, m: 0, p: 0, mt: 0 },
                    "& .MuiList-root": { my: 0, py: 0, "& .MuiTablePagination-menuItem": { my: 0.1, py: 0 } },
                  },
                },
              },
              actions: {
                firstButton: { component: GenerarIcono },
                previousButton: { component: GenerarIcono },
                nextButton: { component: GenerarIcono },
                lastButton: { component: GenerarIcono },
              },
            }}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={styleTablePagination}
          />
        </Grid>
      </Grid>
      <Grid container>
        {/* <pre>{JSON.stringify(filasSeleccionadas, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(columnas, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(nuevaFila, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(objetoBase, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(acciones, null, 2)}</pre> */}
      </Grid>

      {lineaAEliminar && (
        <ActionAlertComponent
          onConfirm={() => {
            handleDelete(lineaAEliminar[rowIdentifier], lineaAEliminar);
            setDeleteClick(false);
          }}
          onCancel={() => {
            setDeleteClick(false);
            setLineaAEliminar(null);
          }}
          activarCanecelar
          handleClose={() => {
            setDeleteClick(false);
            setLineaAEliminar(null);
          }}
          openDialog={deleteClick}
          tipo="error"
          content={
            textoAlertaEliminacion
              ? typeof textoAlertaEliminacion === "string"
                ? textoAlertaEliminacion
                : textoAlertaEliminacion(lineaAEliminar[rowIdentifier], lineaAEliminar)
              : "¿Esta seguro que desea eliminar el registro?"
          }
        />
      )}

      <ActionAlertComponent
        activarAceptar={false}
        activarCanecelar={false}
        handleClose={() => setMostrarError(false)}
        openDialog={mostrarError}
        content={
          <Grid container wdith="100%" direction="column">
            <Grid size={12}>
              <Typography>{`Por favor complete los siguientes campos:`}</Typography>
            </Grid>
            <List dense sx={{ my: 0, p: 0 }}>
              {mensajeError}
            </List>
            <Grid size={12}>
              <Typography>{`Para realizar la acción.`}</Typography>
            </Grid>
          </Grid>
        }
        tipo={tipomsgError}
      />

      {columnasFiltradas && anchorElFiltroColumnas && (
        <RenderFiltroDeColumna
          open={true}
          anchorEl={anchorElFiltroColumnas}
          columna={columnasFiltradas}
          datos={datosOrdenados}
          filtrosActivos={filasFiltradasActivas}
          onFiltrosChange={handleFiltrosChange}
          onClose={handleCloseFiltro}
        />
      )}
    </Box>
  );
};

const posiblesEventos = {
  // add: PropTypes.func,
  view: PropTypes.func,
  go: PropTypes.func,
  // copy: PropTypes.func,
  // paste: PropTypes.func,
  auth: PropTypes.func,
  // edit: PropTypes.func,
  excel: PropTypes.func,
  pdf: PropTypes.func,
  download: PropTypes.func,
  kanban: PropTypes.func,
  // delete: PropTypes.func,
};
const posiblesAcciones = {
  ver: PropTypes.bool,
  go: PropTypes.bool,
  editar: PropTypes.bool,
  eliminar: PropTypes.bool,
  copiar: PropTypes.bool,
  pegar: PropTypes.bool,
  guardar: PropTypes.bool,
  agregar: PropTypes.bool,
  autorizar: PropTypes.bool,
};
const posiblesTooltips = {
  ver: PropTypes.string,
  go: PropTypes.string,
  editar: PropTypes.string,
  eliminar: PropTypes.string,
  copiar: PropTypes.string,
  pegar: PropTypes.string,
  guardar: PropTypes.string,
  agregar: PropTypes.string,
  autorizar: PropTypes.string,
};

TablaEditableComponent.propTypes = {
  titulo: PropTypes.string,
  title: PropTypes.string,
  tituloTotales: PropTypes.string,

  useSeach: PropTypes.bool,
  select: PropTypes.bool,
  multipleSelect: PropTypes.bool,
  eventosDeTabla: PropTypes.shape(posiblesEventos),
  acciones: PropTypes.shape(posiblesAcciones),
  accionesTooltip: PropTypes.shape(posiblesTooltips),
  keepLastInput: PropTypes.bool,
  filtrarPorColunmas: PropTypes.bool,
  editarEnTabla: PropTypes.bool,
  totales: PropTypes.bool,

  objetoBase: PropTypes.object,

  camposRequeridos: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  camposRequeridosParaGuardar: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),

  textoAlertaEliminacion: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),

  idKey: PropTypes.string,
  rowKey: PropTypes.string,
  encabezados: PropTypes.arrayOf(PropTypes.object).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  grupos: PropTypes.arrayOf(PropTypes.object),
  rowsPerPage: PropTypes.number,

  botones: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),

  background: PropTypes.string,

  onSelection: PropTypes.func,

  onRowAdded: PropTypes.func,
  onRowEdit: PropTypes.func,
  onRowUpdated: PropTypes.func,
  onRowDeleted: PropTypes.func,
  onRowAuth: PropTypes.func,
  onRowMail: PropTypes.func,
  onRowClick: PropTypes.func,
  onRowGo: PropTypes.func,
  onRowView: PropTypes.func,
  onRowPrint: PropTypes.func,
  onRowPdf: PropTypes.func,
  onRowPdf1: PropTypes.func,
  onRowCopy: PropTypes.func,
  onRowSelected: PropTypes.func,
  onRowDeselected: PropTypes.func,
  onVerifyRow: PropTypes.func,
  onRowKanban: PropTypes.func,
  onRowDownload: PropTypes.func,

  onInput: PropTypes.func,
};

export default TablaEditableComponent;
