import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Grid,
  Icon,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import styleTablePagination from "./styles";
import { useForm } from "../../hooks/useForm";
import { scrollType } from "../../style/scrollStyle";
import { useSelector } from "react-redux";
import colors from "../../theme/colors";
import FormularioComponent from "../Formulario/FormularioComponent";
import LoaderComponent from "../Loader/LoaderComponent";
import { useLocation } from "react-router-dom";
import { encryptId } from "../../api/encryptDecrypt";

const maincolor = (number = "200") => `background.${number}`;

const allPM0 = { pt: 0, mt: 0, pb: 0, mb: 0, pl: 0, ml: 0, pr: 0, mr: 0 };

const backgroundStyle = { bgcolor: maincolor(50) };

const TablaComponent = (props) => {
  const { fontSize, themeMode, opositeMode } = useSelector((state) => state.theme);
  const { currentPais, currentEmpresa, currentCentroCosto, currentModulo, currentMenu, currentCategoria } = useSelector((state) => state.menu);
  const screenInfo = useSelector((state) => state.screen);
  const screenSize = screenInfo.name;
  const location = useLocation();
  const { pathname } = location;
  const {
    titulo = "",
    botones = {},
    encabezado,
    datos = [],
    id,
    select = false,
    isLoading = false,
    multipleSelect,
    onFilaSeleccionada,
    mostrarTotales,
    camposTotales,
    rowsPerPage = 10,
    expandible,
    eventosDeTabla = {},
    onClearSelection,
    filaSeleccionada,
    background,
    onClickFila = () => {},
    usarFiltro = false,
    useSeach = true,
    usePagination = true,
  } = props;
  const { buscar, onInputChange } = useForm({
    buscar: "",
  });
  // const [datosProcesada, setDatosProcesada] = useState(datos?.map((i) => ({ id: i[id], content: i })));
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState({});
  const [dataSelected, setDataSelected] = useState(null);
  const [filasExpandibles, setFilasExpandibles] = useState([]);

  const labelRowsPerPage = useMemo(() => (["xs"].includes(screenSize) ? "" : "Filas por página"), [screenSize]);

  const bgcolor = useMemo(() => background || maincolor(themeMode === "dark" ? 50 : 900), [background, themeMode]);

  let datosProcesada = useMemo(() => {
    let uniqueData = new Map();
    let d = datos
      ?.map((i, ind) => {
        return {
          id: i[id],
          content: { ...i, propiedadesDeTabla: undefined, accionesDeTabla: undefined, datosDetalle: undefined, encabezadoDetalle: undefined, idDetalle: undefined, propiedadesDetalle: undefined },
          no: ind + 1,
          expandido: false,
          selected: false,
          propiedadesDeTabla: i.propiedadesDeTabla || {},
          canAdd: i.accionesDeTabla?.add,
          canView: i.accionesDeTabla?.view,
          canGo: i.accionesDeTabla?.go,
          canCopy: i.accionesDeTabla?.copy,
          canPaste: i.accionesDeTabla?.paste,
          canAuth: i.accionesDeTabla?.auth,
          canEdit: i.accionesDeTabla?.edit,
          canExcel: i.accionesDeTabla?.excel,
          canPdf: i.accionesDeTabla?.pdf,
          canDownload: i.accionesDeTabla?.download,
          canDelete: i.accionesDeTabla?.delete,
          datosDetalle: i.datosDetalle,
          encabezadoDetalle: i.encabezadoDetalle,
          idDetalle: i.idDetalle,
          propiedadesDetalle: i.propiedadesDetalle,
        };
      })
      .sort((a, b) => {
        for (let key of Object.keys(orderBy).filter((i) => orderBy[i])) {
          let field = key;
          let order = orderBy[key];
          if (order === null) return 0;

          const sortFunction = encabezado.find((encabezado) => encabezado.field === field)?.sort;

          if (sortFunction) {
            return order === "asc" ? sortFunction(a.content[field], b.content[field], a.content, b.content) : sortFunction(b.content[field], a.content[field], a.content, b.content);
          } else {
            const aValue = typeof a.content[field] === "number" ? a.content[field] : String(a.content[field]);
            const bValue = typeof b.content[field] === "number" ? b.content[field] : String(b.content[field]);
            if (aValue < bValue) return order === "asc" ? -1 : 1;
            if (aValue > bValue) return order === "asc" ? 1 : -1;
          }
        }
        return 0;
      })
      .filter((i) => {
        if (buscar === "") return true; // Si no hay búsqueda, devolver todos los elementos
        let existe = []; // Almacena los campos donde se encuentra la coincidencia
        encabezado.forEach(({ campo: key }) => {
          // Buscar el formato correspondiente al campo actual
          let formato = encabezado.find((enc) => enc.campo === key)?.formato;

          // Escapar caracteres especiales en la búsqueda para usar en una expresión regular
          const escapedBuscar = buscar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regex = new RegExp(`(${escapedBuscar})`, "gi");

          let texto = `${i.content?.[key] || ""}`.toUpperCase();

          // Si existe un formato, aplicar el formato al valor y hacer la búsqueda
          if (formato) texto = String(formato(`${i.content?.[key] || ""}`, i)).toUpperCase();

          if (texto.includes(buscar.toUpperCase())) existe.push(key);
        });
        // Devolver el ítem si al menos un campo coincide
        return existe.length > 0;
      })
      .forEach((i, ind) => {
        const uniqueId = i.content[id];
        if (!uniqueData.has(uniqueId)) {
          uniqueData.set(uniqueId, { ...i, id: uniqueId });
        }
      });
    return Array.from(uniqueData.values());
  }, [datos, id, orderBy, encabezado, buscar]);

  useEffect(() => {
    onFilaSeleccionada ? onFilaSeleccionada(dataSelected) : null;
  }, [dataSelected]);

  useEffect(() => {
    if (multipleSelect === true) {
      if (!Array.isArray(dataSelected) && dataSelected) {
        setSelected([]);
        setDataSelected([]);
      }
    } else {
      if (Array.isArray(dataSelected) && dataSelected) {
        setSelected([]);
        setDataSelected(null);
      }
    }
  }, [dataSelected, id, multipleSelect]);

  const handleSelectRow = (ev, data) => {
    ev.preventDefault();

    if (!data) return setDataSelected(null);

    let delete_from_group = selected.includes(data.id);

    if (multipleSelect)
      if (delete_from_group) setSelected((d) => [...(d.filter((i) => i !== data.id) || [])]);
      else setSelected((d) => [...d, data.id]);
    else if (delete_from_group) setSelected([]);
    else setSelected([data.id]);

    if (multipleSelect) {
      if (!dataSelected) setDataSelected([data.content]);
      else if (dataSelected.some((i) => i[id] === data.id)) setDataSelected((d) => d.filter((i) => i[id] !== data.id));
      else setDataSelected((d) => [...d, data.content]);
    } else {
      if (!dataSelected) setDataSelected(data.content);
      else if (data.id === dataSelected[id]) setDataSelected(null);
      else setDataSelected(data.content);
    }
  };

  const manejarExpandible = (id) => {
    setFilasExpandibles((prev) => (prev.includes(id) ? prev.filter((filaId) => filaId !== id) : [...prev, id]));
  };

  const handleClearSelection = () => {
    setSelected([]); // Limpia la selección
    setDataSelected(null); // Limpia los datos seleccionados
  };

  // Efecto para limpiar la selección cuando el padre llama a onClearSelection

  useEffect(() => {
    if (filaSeleccionada)
      handleSelectRow(
        { preventDefault: () => {} },
        datosProcesada?.find((dp) => dp.id === filaSeleccionada[id])
      );
    else if (filaSeleccionada === null) handleSelectRow({ preventDefault: () => {} }, null);
  }, [filaSeleccionada, id, datosProcesada]);

  useEffect(() => {
    handleClearSelection();
  }, [onClearSelection]);

  const handleSelectAll = (ev) => {
    ev.preventDefault();

    if (multipleSelect) {
      if (selected?.length > 0)
        if (selected?.length === datosProcesada?.length) {
          setSelected([]);
          setDataSelected([]);
        } else {
          setSelected(datosProcesada?.map((i) => i.id));
          setDataSelected(datosProcesada?.map((i) => i.content));
        }
      else {
        setSelected(datosProcesada?.map((i) => i.id));
        setDataSelected(datosProcesada?.map((i) => i.content));
      }
    }
  };

  const handleOrderBy = (key) =>
    setOrderBy((obj) => {
      let obj1 = obj,
        obj2 = {};

      // Verifica nuevo orden de llave
      if (!obj[key.name]) obj2[key.name] = "asc";
      else if (obj[key.name] === "asc") obj2[key.name] = "desc";
      else if (obj[key.name] === "desc") obj2[key.name] = null;

      const temp = { ...obj1, ...obj2 }; // Combina los objetos en un nuevo objeto
      const result = {}; // Objeto resultante

      // Añadir las propiedades del primer objeto
      Object.keys(obj1).forEach((key) => {
        if (key in temp) {
          result[key] = temp[key];
          delete temp[key]; // Elimina la propiedad para evitar duplicados
        }
      });

      // Añadir las propiedades restantes (del segundo objeto)
      Object.keys(temp).forEach((key) => (result[key] = temp[key]));

      // Limpiar los orders vacios
      Object.keys(result).forEach((key) => (!result[key] ? delete result[key] : null));

      return result;
    });

  const [page, setPage] = useState(0);

  const [internalRowsPerPage, setInternalRowsPerPage] = useState(rowsPerPage);

  useEffect(() => {
    setInternalRowsPerPage(rowsPerPage);
  }, [rowsPerPage]);

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * internalRowsPerPage - datosProcesada?.length) : 0;

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setInternalRowsPerPage(event.target.value, parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    setPage(0); // Reinicia al cambiar filas por página
  }, [internalRowsPerPage]);

  const datosPaginados = useMemo(() => {
    const startIndex = page * internalRowsPerPage;
    const endIndex = startIndex + internalRowsPerPage;
    return datosProcesada.slice(startIndex, endIndex);
  }, [page, internalRowsPerPage, datosProcesada]);

  useEffect(() => {
    datosPaginados.length == 0 && page !== 0 ? setPage(Math.floor(datosProcesada.length / internalRowsPerPage)) : undefined;
  }, [datosPaginados, datosProcesada, internalRowsPerPage, page]);

  const sumProperties = useMemo(() => {
    return datosProcesada?.reduce((acc, obj) => {
      for (const [key, value] of Object.entries(obj.content)) {
        if (camposTotales)
          if (typeof value === "number" && camposTotales?.includes(key)) {
            acc[key] = (acc[key] || 0) + value;
          } else acc[key] = "";
      }
      return acc;
    }, {});
  }, [datosProcesada, camposTotales]);

  const getContenido = (texto) => {
    if (buscar === "") return [texto];

    const escapedBuscar = buscar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const regex = new RegExp(`(${escapedBuscar})`, "gi");

    return `${texto || ""}`.split(regex).filter(Boolean);
  };

  const textoCoincide = (t1, t2) => String(t1).toUpperCase() === String(t2).toUpperCase();

  const datosBotonesIcono = {
    add: { icono: "c-suma", tooltip: "Agregar", color: "primary" },
    view: { icono: "c-ver", tooltip: "Ver", color: "secondary" },
    go: { icono: "c-link", tooltip: "Ir a URL", color: "primary" },
    copy: { icono: "c-copiar", tooltip: "Copiar", color: "blueGrey" },
    paste: { icono: "c-pegar", tooltip: "Pegar", color: "black" },
    auth: { icono: "c-cheque", tooltip: "Autorizar", color: "primary" },
    edit: { icono: "c-lapiz", tooltip: "Editar", color: "secondary" },
    excel: { icono: "c-excel", tooltip: "Descargar Excel", color: "excel" },
    pdf: { icono: "c-pdf", tooltip: "Descargar PDF", color: "pdf" },
    download: { icono: "c-descargar", tooltip: "Descargar", color: "primary" },
    delete: { icono: "c-eliminar", tooltip: "Eliminar", color: "error" },
  };

  const botonIcono = (data, tipo, url, click) => {
    let upper = `can${tipo
      .split("")
      .map((i, ind) => (ind === 0 ? i.toUpperCase() : i))
      .join("")}`;
    let disable = !data[upper] || (tipo == "go" ? !url : !eventosDeTabla[tipo]);
    let modificador = 3;
    let fontSizeInner = fontSize - modificador;
    const pressButton = click
      ? (ev) => {
          // console.log("click", ev);
          if (tipo === "go" && url) {
            const link = `${window.location.origin}${url || pathname}`;
            /**
             ?meta=${encryptId(
              JSON.stringify({
                pais: currentPais?.cod_pais || null,
                empresa: currentEmpresa?.cod_empresa || null,
                centroCosto: currentCentroCosto?.cod_cc || null,
                modulo: currentModulo?.cod_modulo || null,
                menu: currentMenu?.cod_menu || null,
                categoria: currentCategoria?.cod_categoria || null,
              })
            )}
             */
            window.open(link, "_blank");
          } else if (eventosDeTabla[tipo]) {
            ev?.preventDefault();
            tipo === "go" ? undefined : eventosDeTabla[tipo](data, ev);
          }
        }
      : undefined;
    return data[upper] ? (
      <Grid size="auto">
        <Tooltip title={datosBotonesIcono[tipo]["tooltip"]} slotProps={{ popper: { modifiers: [{ name: "offset", options: { offset: [0, 25] } }] } }}>
          <IconButton
            disabled={disable}
            sx={{
              mx: 0,
              my: 0.3,
              p: 0,
              width: fontSize + 5,
              height: fontSize + 5,
              minWidth: fontSize,
              borderRadius: 100,
              borderColor: datosBotonesIcono[tipo]["color"],
              borderWidth: 0.1,
              // borderStyle: "solid",
              // colors
              // boxShadow: `1px 1px 1px ${disable ? colors["grey"]["400"] : colors[datosBotonesIcono[tipo]["color"]]["400"]}, -1px -1px 1px ${
              //   disable ? colors["grey"]["100"] : colors[datosBotonesIcono[tipo]["color"]]["100"]
              // }`,
              // bgcolor: "white.main",
              // "&:hover": { bgcolor: "white.main_60" },
            }}
            size="small"
            color={datosBotonesIcono[tipo]["color"]}
            component={tipo === "go" ? "a" : undefined}
            href={tipo === "go" ? url : undefined}
            onClick={pressButton}
            onAuxClick={pressButton}
          >
            <Typography
              component="span"
              sx={{
                m: 0,
                p: 0,
                width: fontSize + modificador - 1,
                height: fontSize + modificador - 1,
                minWidth: fontSizeInner,
                borderRadius: 100,
                "&::before": { m: "auto", lineHeight: 1 },
              }}
              fontSize={fontSizeInner}
              className={datosBotonesIcono[tipo]["icono"]}
            />
          </IconButton>
        </Tooltip>
      </Grid>
    ) : (
      <></>
    );
  };

  const renderSelectRow = (data) => (
    <Grid sx={{ ...allPM0, width: "1%" }}>
      <Checkbox
        m={0}
        p={0}
        sx={{ m: 0, p: 0, width: fontSize + 5, height: fontSize + 5, minWidth: fontSize, borderRadius: 100 }}
        size="small"
        checked={selected.filter((i) => i === data.id)?.length > 0}
        readOnly={data.canSelect}
      />
    </Grid>
  );

  const renderBotonExpandir = (data) => (
    <TableCell sx={{ ...allPM0 }}>
      <IconButton
        onClick={(ev) => {
          ev.preventDefault();
          manejarExpandible(data.content[id]);
        }}
        sx={{ m: 0, p: 0, width: fontSize + 5, height: fontSize + 5, minWidth: fontSize, borderRadius: 100 }}
        size="small"
      >
        <Typography
          component="span"
          sx={{ m: 0, p: 0, width: fontSize + 5, height: fontSize + 5, minWidth: fontSize, borderRadius: 100 }}
          className={filasExpandibles.includes(data.content[id]) ? "c-abajo-simple" : "c-derecha-simple"}
        />
      </IconButton>
    </TableCell>
  );

  const renderizarBotones = (i) => (
    <Button
      onClick={(ev) => {
        ev?.preventDefault();
        botones[i].onClick(ev);
      }}
      disabled={botones[i].disabled || botones[i].readonly}
      variant="outlined"
      sx={{ m: 0, p: 0, px: 1, borderColor: `${botones[i].color}.${opositeMode}`, color: `${botones[i].color}.${opositeMode}` }}
    >
      {botones[i].label}
    </Button>
  );

  const renderizarEncabezado = (key) => (
    <TableCell sx={{ my: 0, py: 0, cursor: "pointer", userSelect: "none" }} onClick={() => handleOrderBy(key)}>
      <Typography sx={{ whiteSpace: "nowrap" }} textAlign="center" m={0} p={0} color={`primary.${opositeMode}`} fontWeight="bolder" px={1}>
        {key["label"]}
        <Icon
          sx={{
            m: 0,
            p: 0,
            color: orderBy[key.name] ? undefined : bgcolor,
            "& ::before": { fontSize: "12px !important" },
            transform: `${orderBy[key.name] === "desc" ? "rotate(180deg)" : "rotate(0deg)"}`,
            transition: "transform 0.3s ease",
            fontSize: "10px !important",
          }}
          variant="span"
          className="c-arriba"
        />
      </Typography>
    </TableCell>
  );

  const renderizarFooter = (key) => (
    <TableCell sx={{ my: 0, py: 0.01, userSelect: "none", m: 0, p: 0 }}>
      <Typography m={0} p={0} color={"primary.dark"} textAlign="right" /* fontWeight="bolder" */ fontSize={fontSize}>
        {sumProperties[key["campo"]] || "-"}
      </Typography>
    </TableCell>
  );

  const renderizarCelda = (data, key) => {
    const contenido = key["formato"]
      ? typeof key["formato"](data["content"][key["campo"]], data) !== "string"
        ? key["formato"](data["content"][key["campo"]], data)
        : getContenido(key["formato"](data["content"][key["campo"]], data))?.map((i, ind) => (
            <Typography
              sx={{ bgcolor: textoCoincide(i, buscar) ? (themeMode === "dark" ? "deepOrange.main" : "yellow.main") : undefined }}
              key={`filtro_${ind}_${data["content"][key["campo"]]}_${i}_${key["name"]}_${data.content[id]}`}
              variant="span"
            >
              {i}
            </Typography>
          ))
      : getContenido(data["content"][key["campo"]], key["formato"])?.map((i, ind) => (
          <Typography
            sx={{ bgcolor: textoCoincide(i, buscar) ? (themeMode === "dark" ? "deepOrange.main" : "yellow.main") : undefined }}
            key={`filtro_${ind}_${data["content"][key["campo"]]}_${i}_${key["name"]}_${data.content[id]}`}
            variant="span"
          >
            {i}
          </Typography>
        ));

    const whiteSpace = key["multilinea"] === true ? "" : "nowrap";
    const maxWidth = key["multilinea"] === true ? 150 : undefined;
    const color = data["propiedadesDeTabla"]
      ? data["propiedadesDeTabla"][key["campo"]]
        ? data["propiedadesDeTabla"][key["campo"]]["color"]
          ? data["propiedadesDeTabla"][key["campo"]]["color"]
          : key["color"]
            ? key["color"]
            : "text.400"
        : "text.400"
      : "text.400";
    const fontWeight = data["propiedadesDeTabla"] ? (data["propiedadesDeTabla"][key["campo"]] ? (data["propiedadesDeTabla"][key["campo"]]["bold"] ? "bolder" : "") : undefined) : undefined;
    const bgcolor = data["propiedadesDeTabla"]
      ? data["propiedadesDeTabla"][key["campo"]]
        ? data["propiedadesDeTabla"][key["campo"]]["bgcolor"]
        : key["bgcolor"]
          ? key["bgcolor"]
          : undefined
      : undefined;
    const cellProperties = data["propiedadesDeTabla"] ? data["propiedadesDeTabla"][key["campo"]] : {};

    const textAlign = key["align"] || key["textAlign"];

    return (
      <TableCell sx={{ ...allPM0, bgcolor, width: maxWidth }}>
        <Typography m={0} p={0} px={1.1} sx={{ ...cellProperties, textAlign, whiteSpace, color, fontWeight }}>
          {contenido}
        </Typography>
      </TableCell>
    );
  };

  const generarIcono = React.forwardRef((props, ref) => {
    const { color, ...data } = props;
    return (
      <IconButton
        {...data}
        ref={ref}
        sx={{ fill: data["aria-disabled"] ? undefined : color ? color : themeMode === "dark" ? "white" : "black" }}
        color={data["aria-disabled"] ? undefined : color ? `${color}.main` : themeMode === "dark" ? "white.main" : "black.main"}
      />
    );
  });

  generarIcono.displayName = "GenerarIcono";

  return (
    <Box
      sx={{
        maxWidth: "100%",
        bgcolor: bgcolor,
        p: 1,
        borderRadius: 2,
        borderColor: background || maincolor(themeMode === "dark" ? 100 : 700),
        border: "solid rgba(224, 224, 224, 1)",
        borderWidth: 1,
        boxShadow: "2px 2px 5px 2px rgba(0,0,0,0.1)",
        "& .MuiTableCell-body": { m: 0, p: 0, py: 0, px: 0.5 },
      }}
    >
      <Grid container sx={{}}>
        {titulo && (
          <Grid size="auto" sx={{ py: 1 }}>
            <Typography variant="h6" mx={1} sx={{ whiteSpace: "wrap" }}>
              {titulo}
            </Typography>
          </Grid>
        )}
        <Grid size="grow"></Grid>
        {botones && (
          <Grid container size="auto" sx={{ mx: 1, py: 1 }} spacing={0.5}>
            {Object.keys(botones)
              .filter((i) => botones[i])
              .map((i) => (
                <React.Fragment key={`boton_${i}`}>{renderizarBotones(i)}</React.Fragment>
              ))}
          </Grid>
        )}
        {useSeach && (
          <Grid size="auto" sx={{ py: 1 }}>
            <TextField autoComplete="off" label="" variant="standard" size="small" type="text" placeholder="Buscar..." fullWidth name="buscar" value={buscar} onChange={onInputChange} />
          </Grid>
        )}
      </Grid>
      <Grid container sx={{ p: usarFiltro ? 1 : 0 }}>
        <Grid size="auto"> </Grid>
        <Grid size="grow"></Grid>
        <Grid size="auto"> </Grid>
      </Grid>
      <TableContainer sx={{ ...scrollType("overflowX"), overflowX: "auto" }}>
        <Table size="small" sx={{ maxWidth: "100%", overflowY: "clip", "*": { ...allPM0 } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={[{ color: "grey.600", m: 0, p: 0, maxWidth: "20px", fontSize: fontSize - 5, textAlign: "center", ...allPM0, width: "1%" }]} className="row"></TableCell>
              {/* Espacio para checkbox de seleccion */}
              {select && !multipleSelect ? <TableCell key="select-single" width="1%"></TableCell> : null}
              {select && multipleSelect ? (
                <TableCell key="select-multiple" sx={[{ color: "grey.600", m: 0, p: 0, maxWidth: "20px", fontSize: fontSize - 5, textAlign: "center", ...allPM0, width: "1%" }]} className="row">
                  <Tooltip title={selected?.length === datosProcesada?.length ? "Limpiar selección" : "Seleccionar todos"}>
                    <Checkbox
                      m={0}
                      p={0}
                      sx={{ m: 0, p: 0 }}
                      size="small"
                      checked={selected?.length === datosProcesada?.length}
                      indeterminate={selected?.length > 0 && selected?.length < datosProcesada?.length}
                      onChange={handleSelectAll}
                    />
                  </Tooltip>
                </TableCell>
              ) : null}
              {/* Espacio para botones de iconos */}
              <TableCell sx={{ ...allPM0 }}></TableCell>
              {/* Espacio para boton de expancion */}
              {expandible && <TableCell sx={{ ...allPM0 }}></TableCell>}
              {/* Encabezados de items */}
              {encabezado?.map((key) => (
                <React.Fragment key={`header_${key["name"]}`}>{renderizarEncabezado(key)}</React.Fragment>
              ))}
              {/* Espacio para botones de iconos */}
              <TableCell sx={{ ...allPM0, position: "sticky", right: 0, zIndex: 100, bgcolor: bgcolor }}></TableCell>
            </TableRow>
          </TableHead>
          {isLoading ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={encabezado?.length + 3} sx={{ ...allPM0, py: 1, textAlign: "center" }}>
                  <LoaderComponent open={true} texto="." sx={{ position: "relative" }} />
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {datosProcesada.length > 0 ? (
                datosPaginados?.map((data, ind) => (
                  <React.Fragment key={`row_${data.content[id]}_${ind}`}>
                    <TableRow
                      sx={{
                        "&.row:hover .row": { bgcolor: maincolor(themeMode === "dark" ? 100 : 700) },
                        "&:hover": { bgcolor: maincolor(themeMode === "dark" ? 100 : 700) },
                        ...allPM0,
                      }}
                      onClick={(ev) => {
                        ev.preventDefault();
                        select ? handleSelectRow(ev, data) : null;
                        onClickFila(data.content, data);
                      }}
                    >
                      <TableCell sx={[{ color: "grey.600", m: 0, p: 0, maxWidth: "20px", fontSize: fontSize - 5, textAlign: "center", ...allPM0, width: "1%" }]} className="row">
                        {data.no}
                      </TableCell>
                      {select && renderSelectRow(data)}
                      <TableCell sx={{ ...allPM0 }}>
                        <Grid container direction="row" sx={{ width: "100%", ...allPM0 }} textAlign="center" justifyContent="space-around" columnSpacing={1} wrap="nowrap">
                          {botonIcono(data, "add", null, true)}
                          {botonIcono(data, "view", data.content.url, true)}
                          {botonIcono(data, "go", data.content.url, true)}
                        </Grid>
                      </TableCell>
                      {expandible && data.datosDetalle?.length > 0 && renderBotonExpandir(data)}
                      {encabezado?.map((key) => (
                        <React.Fragment key={`cell_${key["name"]}_${data.content[id]}`}>{renderizarCelda(data, key)}</React.Fragment>
                      ))}
                      <TableCell sx={{ ...allPM0 }}>
                        <Grid container direction="row" sx={{ width: "100%", ...allPM0 }} textAlign="center" justifyContent="space-around" columnSpacing={1} wrap="nowrap">
                          {botonIcono(data, "copy", null, true)}
                          {botonIcono(data, "paste", null, true)}
                          {botonIcono(data, "auth", null, true)}
                          {botonIcono(data, "edit", null, true)}
                          {botonIcono(data, "excel", null, true)}
                          {botonIcono(data, "pdf", null, true)}
                          {botonIcono(data, "download", null, true)}
                          {botonIcono(data, "delete", null, true)}
                        </Grid>
                      </TableCell>
                    </TableRow>
                    {expandible && filasExpandibles.includes(data.content[id]) ? (
                      <TableRow sx={{ ...allPM0 }}>
                        <TableCell colSpan={"100%"}>
                          <TablaComponent
                            background={themeMode === "dark" ? "background.200" : "background.main"}
                            datos={data.datosDetalle}
                            encabezado={data.encabezadoDetalle}
                            id={data.idDetalle}
                            {...data.propiedadesDetalle}
                          />
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </React.Fragment>
                ))
              ) : (
                <TableRow
                  sx={{
                    "&.row:hover .row": { bgcolor: maincolor(themeMode === "dark" ? 100 : 700) },
                    "&:hover": { bgcolor: maincolor(themeMode === "dark" ? 100 : 700) },
                    ...allPM0,
                  }}
                >
                  <TableCell colSpan={"100%"} sx={{ textAlign: "center" }}>
                    No se encontraron registros
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          )}
          {mostrarTotales ? (
            <TableFooter>
              <TableRow>
                <TableCell>Totales</TableCell>
                {encabezado?.map((key) => (
                  <React.Fragment key={`footer_${key["name"]}`}>{renderizarFooter(key)}</React.Fragment>
                ))}
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          ) : (
            ""
          )}
        </Table>
      </TableContainer>
      {usePagination && (
        <Grid container direction="row" sx={{ overflowX: "auto" }}>
          {select && (
            <Grid size="auto" sx={{ pr: 5 }}>
              {`Filas seleccionadas: ${selected ? (Array.isArray(selected) ? selected?.length : 1) : 0}`}
            </Grid>
          )}
          <Grid size="auto" sx={{ pr: 5 }}>
            Página actual: {page + 1}
          </Grid>
          <Grid size="grow"></Grid>
          <Grid size="auto">
            <TablePagination
              component="div"
              rowsPerPageOptions={[5, 10, 15, 25, { label: "All", value: datosProcesada?.length }]}
              colSpan={encabezado?.length}
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
                  firstButton: { component: generarIcono },
                  previousButton: { component: generarIcono },
                  nextButton: { component: generarIcono },
                  lastButton: { component: generarIcono },
                },
              }}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={styleTablePagination}
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

TablaComponent.propTypes = {
  encabezado: PropTypes.arrayOf(PropTypes.object).isRequired,
  datos: PropTypes.arrayOf(PropTypes.object).isRequired,
  id: PropTypes.string.isRequired,
  titulo: PropTypes.string,
  onFilaSeleccionada: PropTypes.func,
  onClearSelection: PropTypes.bool,
  filaSeleccionada: PropTypes.object,
  rowsPerPage: PropTypes.number,
  isLoading: PropTypes.bool,

  useSeach: PropTypes.bool,
  usePagination: PropTypes.bool,

  onClickFila: PropTypes.func,

  multipleSelect: PropTypes.bool,
  select: PropTypes.bool,

  expandible: PropTypes.bool,

  eventosDeTabla: PropTypes.shape({
    add: PropTypes.func,
    view: PropTypes.func,
    go: PropTypes.func,
    copy: PropTypes.func,
    paste: PropTypes.func,
    auth: PropTypes.func,
    edit: PropTypes.func,
    excel: PropTypes.func,
    pdf: PropTypes.func,
    download: PropTypes.func,
    delete: PropTypes.func,
  }),

  mostrarTotales: PropTypes.bool,
  camposTotales: PropTypes.array,

  background: PropTypes.string,

  botones: PropTypes.object,

  usarFiltro: PropTypes.bool,
};

export default TablaComponent;
