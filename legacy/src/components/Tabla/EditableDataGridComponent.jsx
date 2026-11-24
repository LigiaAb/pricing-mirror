import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
// import { DataGrid, GridRowEditStopReasons, GridRowModes } from "@mui/x-data-grid";
import { DataGrid, GridActionsCellItem, GridRowEditStopReasons, GridRowModes } from "@mui/x-data-grid";
import { useGridApiContext, useGridApiRef, GridToolbarQuickFilter } from "@mui/x-data-grid";
import { Button, Box, Typography, Grid, Checkbox, IconButton, Tooltip, List, ListItem, ListItemText, unstable_useEnhancedEffect as useEnhancedEffect } from "@mui/material";
import DatePickerComponent from "./TablaEditable/DatePickerComponent";
import { esES } from "@mui/x-data-grid/locales";
import TextEditorComponent from "./TablaEditable/TextEditorComponent";
// import useEnhancedEffect from "@mui/materialutils/useEnhancedEffect";
import SelectComponent from "./TablaEditable/SelectComponent";
import ActionAlertComponent from "../Dialog/ActionAlertComponent";
import SubirArchivoComponent from "./TablaEditable/SubirArchivoComponent";
import ModalSelectComponent from "./TablaEditable/ModalSelectComponent";
import { format } from "date-fns";
import { useSelector } from "react-redux";
import styleTablePagination from "./styles";
import SelectQueryComponent from "./TablaEditable/SelectQueryComponent";

let accionesBase = { ver: false, editar: false, eliminar: false, copiar: false, pegar: false, guardar: false, agregar: false };

export const EditableDataGridComponent = (props) => {
  const {
    onEdditRow = () => {},
    onEstadisticasClick = () => {},
    onInput = () => {},
    processInput = () => {},
    onAddRow = () => {},
    onDeleteRow = () => {},
    onRowSave = () => {},
    alwaysSave = false,
    botones = {},
  } = props;
  const { encabezados = [], datos = [], idKey = "id", objetoBase = {}, groupModel = undefined, columnasAExtender = ["ultima"], camposRequeridosParaGuardar = [] } = props;
  const { textoAlertaEliminacion = "", filaSeleccionada = () => null, acciones = {}, totales, totalesPorPagina = true, alertaEliminar = true } = props;
  const { fontSize, themeMode, opositeMode } = useSelector((state) => state.theme);
  const screenInfo = useSelector((state) => state.screen);
  const screenSize = screenInfo.name;

  const labelRowsPerPage = useMemo(() => (["xs"].includes(screenSize) ? "" : "Filas por página"), [screenSize]);

  const [rows, setRows] = useState([]);
  const [nextId, setNextId] = useState(0);
  const [rowModesModel, setRowModesModel] = useState({});
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [lineaAEliminar, setLineaAEliminar] = useState(null);
  const [dataCopiada, setDataCopiada] = useState(null);
  const [autosizeOptions, setAutosizeOptions] = useState({ includeHeaders: true, includeOutliers: true, outliersFactor: 1, expand: true });
  const [mensajeCamposFaltantes, setMensajeCamposFaltantes] = useState("Los campos requeridos para registrar una fila no se han llenado");
  const [mostrarFaltantes, setMostrarFaltantes] = useState(false);
  const tableApiRef = useGridApiRef();
  const [editingRow, setEditingRow] = useState(null);

  const accionesProcesadas = useMemo(() => ({ ...accionesBase, ...acciones }), [acciones, accionesBase]);

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  const renderizarBotones = (i) => (
    <Button
      key={i}
      onClick={(ev) => {
        ev?.preventDefault();
        botones[i].onClick(ev);
      }}
      variant="outlined"
      sx={{ m: 0, p: 0, px: 1, borderColor: `${botones[i].color}.${opositeMode}`, color: `${botones[i].color}.${opositeMode}` }}
    >
      {botones[i].label}
    </Button>
  );

  const DateTypeComp = (params) => {
    const { id, value, field, hasFocus, onInput, colDef, row } = params;
    const { varificarSiEsEditable, setMin, setMax } = colDef;
    const apiRef = useGridApiContext();
    const ref = useRef(null);

    useEnhancedEffect(() => {
      if (hasFocus && ref.current) {
        const input = ref.current.querySelector(`input[value="${value}"]`);
        input?.focus();
      }
    }, [hasFocus, value]);
    return (
      <DatePickerComponent
        onInput={(newValue) => {
          apiRef.current.setEditCellValue({ id, field, value: newValue });
          onInput({ id, field, value: newValue });
        }}
        input={{
          id: `${params.id}`,
          tipo: "date",
          val: params.value || null,
          min: setMin ? setMin({ id, field, row }) : undefined,
          max: setMax ? setMax({ id, field, row }) : undefined,
          label: "",
          readonly: varificarSiEsEditable ? !varificarSiEsEditable({ id, field, row }) : undefined,
        }}
        id={`${params.colDef.type}_${params.id}_c`}
      />
    );
  };

  const TextTypeComp = (params) => {
    const { id, value, field, hasFocus, onInput, row, colDef } = params;
    const { varificarSiEsEditable } = colDef;
    const apiRef = useGridApiContext();
    const ref = useRef(null);

    useEnhancedEffect(() => {
      if (hasFocus && ref.current) {
        const input = ref.current.querySelector(`input[value="${value}"]`);
        input?.focus();
      }
    }, [hasFocus, value]);

    return (
      <TextEditorComponent
        onInput={(newValue) => {
          apiRef.current.setEditCellValue({ id, field, value: newValue });
          onInput({ id, field, value: newValue });
        }}
        input={{
          ...params.colDef,
          id: `${params.id}`,
          tipo: params.colDef.type,
          val: (params.colDef.type === "archivo" ? null : params.value) || null,
          label: "",
          max: params.colDef.max,
          readonly: varificarSiEsEditable ? !varificarSiEsEditable({ id, field, row }) : undefined,
        }}
        id={`${params.colDef.type}_${params.id}_c`}
      />
    );
  };

  const FileTypeComp = (params) => {
    const { id, value, field, hasFocus, onInput, row, colDef } = params;
    const { varificarSiEsEditable } = colDef;
    const apiRef = useGridApiContext();
    const ref = useRef(null);

    useEnhancedEffect(() => {
      if (hasFocus && ref.current) {
        const input = ref.current.querySelector(`input[value="${value}"]`);
        input?.focus();
      }
    }, [hasFocus, value]);

    return (
      <SubirArchivoComponent
        onInput={(newValue) => {
          apiRef.current.setEditCellValue({ id, field, value: newValue });
          onInput({ id, field, value: newValue });
        }}
        input={{
          id: `${params.id}`,
          multiple: params.colDef.multiple,
          tipo: params.colDef.type,
          val: params.value,
          label: "",
          readonly: varificarSiEsEditable ? !varificarSiEsEditable({ id, field, row }) : undefined,
        }}
        id={`${params.colDef.type}_${params.id}_c`}
      />
    );
  };

  const SelectTypeComp = (params) => {
    const { id, value, field, hasFocus, onInput, row, colDef } = params;
    const { varificarSiEsEditable, getValueOptions } = colDef;
    const apiRef = useGridApiContext();
    const ref = useRef(null);

    useEnhancedEffect(() => {
      if (hasFocus && ref.current) {
        const input = ref.current.querySelector(`input[value="${value}"]`);
        input?.focus();
      }
    }, [hasFocus, value]);

    return (
      <SelectComponent
        key={JSON.stringify(value)}
        onInput={(newValue) => {
          apiRef.current.setEditCellValue({ id, field, value: newValue });
          onInput({ id, field, value: newValue });
        }}
        input={{
          id: `${params.id}`,
          tipo: "select",
          options: getValueOptions ? getValueOptions({ id, field, row }) : params.colDef.valueOptions,
          labelOption: params.colDef.labelOption,
          valueOption: params.colDef.valueOption,
          multiple: params.colDef.multiple,
          val: params.value || null,
          label: " ",
          readonly: varificarSiEsEditable ? !varificarSiEsEditable({ id, field, row }) : undefined,
        }}
        id={`select_${params.id}_c`}
      />
    );
  };

  const ModalSelectTypeComp = (params) => {
    const { id, value, field, hasFocus, onInput, row, colDef } = params;
    const { varificarSiEsEditable, valorExterno } = colDef;
    const apiRef = useGridApiContext();
    const ref = useRef(null);
    // console.log(field, value)
    useEnhancedEffect(() => {
      if (hasFocus && ref.current) {
        const input = ref.current.querySelector(`input[value="${value}"]`);
        input?.focus();
      }
    }, [hasFocus, value]);

    useEnhancedEffect(() => {
      if (valorExterno) {
        apiRef.current.setEditCellValue({ id, field, value: valorExterno });
        onInput({ id, field, value: valorExterno });
      }
    }, [valorExterno]);

    return (
      <ModalSelectComponent
        key={JSON.stringify(value)}
        onInput={(newValue) => {
          apiRef.current.setEditCellValue({ id, field, value: newValue });
          onInput({ id, field, value: newValue });
        }}
        input={{
          id: `${params.id}`,
          tipo: "select",
          options: params.colDef.valueOptions,
          labelOption: params.colDef.labelOption,
          valueOption: params.colDef.valueOption,
          multiple: params.colDef.multiple,
          val: valorExterno ? valorExterno : params.value || null,
          label: " ",
          readonly: varificarSiEsEditable ? !varificarSiEsEditable({ id, field, row }) : undefined,
          onBuscar: params.colDef.onBuscar,
          onCrear: params.colDef.onCrear,
        }}
        id={`select_${params.id}_c`}
      />
    );
  };

  const SelectQueryTypeComp = (params) => {
    const { id, value, field, hasFocus, onInput, row, colDef } = params;
    const { varificarSiEsEditable, valorExterno } = colDef;
    const apiRef = useGridApiContext();
    const ref = useRef(null);

    useEnhancedEffect(() => {
      if (hasFocus && ref.current) {
        const input = ref.current.querySelector(`input[value="${value}"]`);
        input?.focus();
      }
    }, [hasFocus, value]);

    useEnhancedEffect(() => {
      if (valorExterno) {
        apiRef.current.setEditCellValue({ id, field, value: valorExterno });
        onInput({ id, field, value: valorExterno });
      }
    }, [valorExterno]);

    return (
      <SelectQueryComponent
        key={JSON.stringify(value)}
        onInput={(newValue) => {
          apiRef.current.setEditCellValue({ id, field, value: newValue });
          onInput({ id, field, value: newValue });
        }}
        input={{
          id: `${params.id}`,
          tipo: "select",
          options: params.colDef.valueOptions,
          labelOption: params.colDef.labelOption,
          valueOption: params.colDef.valueOption,
          multiple: params.colDef.multiple,
          val: params.value || null,
          label: " ",
          readonly: varificarSiEsEditable ? !varificarSiEsEditable({ id, field, row }) : undefined,
          onCrear: params.colDef.onCrear,
          url: params.colDef.url,
          queryField: params.colDef.queryField,
          params: params.colDef.params,
          method: params.colDef.method || "POST",
        }}
        id={`select_${params.id}_c`}
      />
    );
  };

  const CheckboxTypeComp = (params) => {
    const { id, value, field, hasFocus, onInput, row, colDef } = params;
    const { varificarSiEsEditable } = colDef;
    const apiRef = useGridApiContext();
    const ref = useRef(null);
    const [val, setVal] = useState(value);

    useEnhancedEffect(() => {
      if (hasFocus && ref.current) {
        const input = ref.current.querySelector(`input[value="${value}"]`);
        input?.focus();
      }
    }, [hasFocus, value]);

    return (
      <Box sx={{ m: 0, p: 0, width: "100%", textAlign: "center" }}>
        <Checkbox
          sx={{ m: 0, p: 0 }}
          onChange={(ev, newValue) => {
            setVal(newValue);
            apiRef.current.setEditCellValue({ id, field, value: newValue });
            onInput({
              id,
              field,
              value: newValue,
              readonly: varificarSiEsEditable ? !varificarSiEsEditable({ id, field, row }) : undefined,
            });
          }}
          disabled={varificarSiEsEditable ? !varificarSiEsEditable({ id, field, row }) : undefined}
          checked={val}
          id={`check_${params.id}_c`}
        />
      </Box>
    );
  };

  const renderTypeComp = (params, onInput, varificarSiEsEditable, valorExterno) => {
    let tipo = params.colDef.type;

    return tipo === "date" || ["date-time", "dateTime"].includes(tipo) ? (
      <DateTypeComp {...params} onInput={onInput} varificarSiEsEditable={varificarSiEsEditable} />
    ) : tipo === "singleSelect" || tipo === "select" ? (
      <SelectTypeComp {...params} onInput={onInput} varificarSiEsEditable={varificarSiEsEditable} />
    ) : tipo === "modalSelect" ? (
      <ModalSelectTypeComp {...params} onInput={onInput} varificarSiEsEditable={varificarSiEsEditable} valorExterno={valorExterno} />
    ) : tipo === "selectQuery" ? (
      <SelectQueryTypeComp {...params} onInput={onInput} varificarSiEsEditable={varificarSiEsEditable} />
    ) : tipo === "checkbox" ? (
      <CheckboxTypeComp {...params} onInput={onInput} varificarSiEsEditable={varificarSiEsEditable} />
    ) : tipo === "archivo" ? (
      <FileTypeComp {...params} onInput={onInput} varificarSiEsEditable={varificarSiEsEditable} />
    ) : (
      <TextTypeComp {...params} onInput={onInput} varificarSiEsEditable={varificarSiEsEditable} />
    );
  };

  const CustomDataGridToolbar = (value) => {
    return (
      <Grid container sx={{ p: 0.5, pb: 0 }}>
        <Grid size="grow"></Grid>
        {botones && (
          <Grid size="auto" sx={{ mx: 1, py: 1 }}>
            {Object.keys(botones).map((i) => renderizarBotones(i))}
          </Grid>
        )}
        <Grid size="auto" sx={{ py: 1 }}>
          <GridToolbarQuickFilter />
        </Grid>
      </Grid>
    );
  };

  const handleRowModesModelChange = (newRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  const handleRowEditStop = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
    if (params.reason === GridRowEditStopReasons.enterKeyDown) {
      event.defaultMuiPrevented = true;
    }
    if (params.reason === GridRowEditStopReasons.escapeKeyDown) {
      setEditingRow(null);
    }
  };

  const processRowUpdate = (newRow) => {
    if (camposRequeridosParaGuardar && (typeof camposRequeridosParaGuardar === "function" || Object.keys(camposRequeridosParaGuardar).length > 0)) {
      // Validar campos requeridos

      let missingFields = [];

      if (typeof camposRequeridosParaGuardar === "function") {
        missingFields = camposRequeridosParaGuardar(newRow);
      } else {
        missingFields = Object.keys(camposRequeridosParaGuardar).filter((field) => {
          const value = newRow[field];

          // Verificar si el valor es nulo, indefinido o vacío según su tipo
          if (typeof value === "number" && value === 0) return true;
          else if (value === null || value === undefined) return true;
          else if (typeof value === "string" && value.trim() === "") return true;
          else if (value instanceof File && value.size === 0) return true;
          else if (value instanceof File && value.size > 0) return false;
          else if (value instanceof FileList && value.length > 0) return false;
          else if (value instanceof FileList && value.length === 0) return true;
          else if (value instanceof Date && !isNaN(value.getTime())) return false;
          else if (typeof value === "object" && Object.keys(value).length === 0) return true;

          return false;
        });
      }
      if (missingFields.length > 0) {
        // const missingFieldNames = missingFields.map((field) => camposRequeridosParaGuardar[field]).join(", ");
        setMensajeCamposFaltantes(
          missingFields.map((field) => (
            <ListItem key={field} sx={{ py: 0, my: 0 }}>
              <ListItemText primary={<Typography>{"- " + (typeof camposRequeridosParaGuardar === "function" ? field : camposRequeridosParaGuardar[field])}</Typography>} sx={{ py: 0, my: 0 }} />
            </ListItem>
          ))
        );
        setMostrarFaltantes(true);
        return;
        // alert(`Por favor complete los siguientes campos: ${missingFieldNames}`);
        // console.error("No se puede guardar: campos requeridos incompletos");
        // throw new Error("No se puede guardar: campos requeridos incompletos");
      }
    }

    const existingRow = rows.find((row) => row?.id === newRow?.id);
    const hasChanges = Object.keys(newRow).some((key) => newRow[key] !== existingRow[key]);

    if (hasChanges || alwaysSave) {
      const updatedRow = { ...newRow, isNew: false };
      setRows(rows.map((row) => (row?.id === newRow?.id ? updatedRow : row)));
      onRowSave({ id: newRow?.id, row: { ...newRow, isNew: false } });
      return updatedRow;
    }

    return existingRow; // Devuelve la fila sin cambios
  };

  const handleAddRow = () => {
    let base = {};
    if (objetoBase) base = { ...objetoBase };
    else Object.keys(datos[0]).map((k) => (base[k] = typeof datos[0][k] === "string" ? "" : typeof datos[0][k] === "number" ? 0 : null));
    let d = dataCopiada ? { ...base, ...dataCopiada, isNew: true, id: nextId, [idKey]: nextId } : { ...base, isNew: true, id: nextId, [idKey]: nextId };
    setRows((prevRows) => [d, ...prevRows]);
    setPaginationModel((prev) => ({
      ...prev,
      page: 0, // Siempre mostrar la primera página
    }));
    onAddRow(d);
    // Actualizar el estado `rowModesModel` para poner la nueva fila en modo edición

    setRowModesModel((prevRowModes) => ({
      ...prevRowModes,
      [nextId]: { mode: GridRowModes.Edit },
    }));
    setDataCopiada(null, nextId);
    setNextId((prevId) => prevId + 1);
    setEditingRow({});
    setTimeout(() => {
      const gridContainer = document.querySelector(".MuiDataGrid-virtualScroller");
      if (gridContainer) {
        gridContainer.scrollTop = 0; // Scroll a la parte superior
      }
    }, 100);
  };

  const handleEditClick = (id) => () => {
    const newRowModes = Object.keys(rowModesModel).reduce((acc, rowId) => {
      acc[rowId] = { mode: GridRowModes.View };
      return acc;
    }, {});

    // Activa el modo de edición solo para la fila seleccionada
    setRowModesModel({ ...newRowModes, [id]: { mode: GridRowModes.Edit } });
    onEdditRow({ id, row: rows.find((i) => i.id === id) });
    setEditingRow({ id, row: rows.find((i) => i.id === id) });
  };

  const handleEditDoubleClick = (params) => {
    // console.log(params)
    const { id } = params;
    const accionesDeFila = params.row.accionesDeFila;

    if ((accionesDeFila?.editar !== undefined ? accionesDeFila?.editar : accionesProcesadas.editar) && (accionesDeFila?.guardar !== undefined ? accionesDeFila?.guardar : accionesProcesadas.guardar)) {
      const newRowModes = Object.keys(rowModesModel).reduce((acc, rowId) => {
        acc[rowId] = { mode: GridRowModes.View };
        return acc;
      }, {});

      // Activa el modo de edición solo para la fila seleccionada
      setRowModesModel({ ...newRowModes, [id]: { mode: GridRowModes.Edit } });
      onEdditRow({ id, row: rows.find((i) => i.id === id) });
      setEditingRow({ id, row: rows.find((i) => i.id === id) });
    }
  };

  const handleEditCellChange = (params) => {
    const { id, field, value } = params;
    setRows((prevRows) => prevRows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const handleSaveClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
    setEditingRow(null);
  };

  const handleDeleteClick = (id) => () => {
    onDeleteRow({ id, row: rows.find((i) => i.id === id) });
    setRows(rows.filter((row) => row.id !== id));
    setEditingRow(null);
  };

  const handleCancelClick = (id) => () => {
    const editedRow = rows.find((row) => row.id === id);
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });
    if (editedRow.isNew) {
      setRows(rows.filter((row) => row.id !== id));
      onDeleteRow({ id, row: rows.find((i) => i.id === id) });
    }
    setNextId(datos.length > 0 ? Math.max(...datos.map((i) => Number(i[idKey]))) + 1 : 1);
    onEdditRow(null);
    setEditingRow(null);
  };

  const limpiarNombreArchivo = useCallback((archivo) => {
    const partes = archivo.split(".");
    return `${partes[0]}${partes[0] ? "." : ""}${partes[partes.length - 1]}`;
  }, []);

  const columns = [
    {
      field: "actions_front",
      type: "actions",
      headerName: "",
      maxWidth: 50,
      sortable: false,
      flex: 1,
      cellClassName: "actions",
      renderHeader: (params) => {
        return [
          ...(accionesProcesadas.agregar && !editingRow
            ? [
                <>
                  <IconButton sx={{ m: 0, p: 0, mx: 1, color: `primary.${opositeMode}` }} label="Save" onClick={handleAddRow} key="guardar">
                    <Typography className="c-suma" />
                  </IconButton>
                  <Tooltip title="El ID / Código mostrado en las nuevas filas es solo demostrarivo y no definitivo">
                    <Typography className="c-ayuda" color="grey" fontSize={9} sx={{ position: "absolute", top: 0, right: 0 }} />
                  </Tooltip>
                </>,
              ]
            : []),
          ...(dataCopiada && accionesProcesadas.pegar
            ? [
                <IconButton sx={{ m: 0, p: 0, mx: 1 }} label="Save" color="primary" onClick={handleAddRow} key="pegar">
                  <Typography className="c-pegar" />
                </IconButton>,
              ]
            : []),
        ];
      },

      getActions: (params) => {
        const accionesDeFila = params.row.accionesDeFila;
        const footer = params.row.footer;
        if (footer) {
          return [
            <Typography key="numero" sx={{ userSelect: "none" }} color="text.200" fontSize={12}>
              Total
            </Typography>,
          ];
        }

        return [
          <Typography key="numero" sx={{ userSelect: "none" }} color="background.300" fontSize={10}>
            {params.row.index_para_tabla}
          </Typography>,
          ...((accionesDeFila?.ver !== undefined ? accionesDeFila?.ver : accionesProcesadas.ver)
            ? [<GridActionsCellItem key="ver" icon={<Typography className="c-ver" />} label="Ver" className="textPrimary" onClick={() => filaSeleccionada(params.row)} color="secondary" />]
            : []),
        ];
      },
    },
    ...[...encabezados].map((i, ind) => {
      return {
        ...i,
        renderEditCell: i.type !== "boolean" ? (params) => renderTypeComp(params, onInput, i.varificarSiEsEditable, i.valorExterno) : undefined,
        getOptionLabel: (params) => (params ? params[i.labelOption] : ""),
        getOptionValue: (params) => (params ? params[i.valueOption] : ""),
        valueFormatter: (params) => (params ? params[i.labelOption] : ""),
        editable: i.varificarSiEsEditable ? true : i.editable,
        width: i.width,
        flex: (columnasAExtender || []).includes(ind) || ((columnasAExtender || []).includes("primera") && ind === 0) ? 1 : undefined,
        minWidth: i.minWidth || undefined,
        filterOperators:
          i.type === "boolean"
            ? [
                {
                  label: "=",
                  value: "equal",
                  getApplyFilterFn: (filterItem) => {
                    return (value) => {
                      if (!filterItem.field || !filterItem.operator) return true;
                      if (filterItem.value === null) return true;
                      return value === filterItem.value;
                    };
                  },
                  InputComponent: (params) => {
                    const { item, applyValue } = params;
                    const [value, setValue] = useState(null);
                    const ratingRef = useRef(null);
                    const handleFilterChange = () => {
                      let v = item.value === false ? true : item.value === true ? null : false;
                      applyValue({ ...item, value: v });
                      setValue(v);
                    };
                    return (
                      <Box sx={{ display: "inline-flex", flexDirection: "row", alignItems: "center", height: 48, pl: "20px" }}>
                        <Checkbox indeterminate={value === null} ref={ratingRef} name="custom-checkbox-filter-operator" checked={value} onChange={handleFilterChange} {...params} />
                      </Box>
                    );
                  },
                  InputComponentProps: { type: "checkbox" },
                  getValueAsString: (value) => `${value}`,
                },
              ]
            : undefined,

        renderCell: (params) => {
          const footer = params.row.footer;
          if (footer) {
            if (i.total) return i.total(totalesPorPagina ? paginatedRows : rows);
            return <></>; // Fallback for columns without a total function
          }
          if (i.type === "singleSelect")
            return params.value ? (Array.isArray(params.value) ? params.value.map((i) => i[params.colDef.labelOption]).join(", \n") : params.value[params.colDef.labelOption]) : "";
          if (i.type === "boolean")
            return <Typography sx={{ color: params.value ? `primary.${opositeMode}` : `error.${opositeMode}` }} className={params.value == null ? "" : params.value ? "c-cheque" : "c-x1"} />;
          if (i.type === "checkbox")
            return (
              <Typography
                textAlign="center"
                sx={{ color: params.value ? `primary.${opositeMode}` : `error.${opositeMode}` }}
                className={params.value == null ? "" : params.value ? "c-cheque" : "c-x1"}
              />
            );
          if (i.type === "date") return <Typography>{params.value ? format(params.value, "dd-MM-yyyy") : ""}</Typography>;
          if (i.type === "date-time") return <Typography>{params.value ? format(params.value, "dd-MM-yyyy HH:mm:ss") : ""}</Typography>;
          if (i.type === "archivo")
            return (
              <Typography>
                {limpiarNombreArchivo(
                  typeof params.value === "string" ? params.value.split("/").pop() : Array.isArray(params.value) ? params.value.map((i) => i.name).join(", ") : params.value ? params.value.name : ""
                )}
              </Typography>
            );
          return undefined;
        },
      };
    }),
    ...((accionesProcesadas.editar && accionesProcesadas.guardar) || accionesProcesadas.eliminar || accionesProcesadas.copiar || accionesProcesadas.dsv
      ? [
          {
            field: "actions_back",
            type: "actions",
            headerName: "",
            sortable: false,
            resizable: false,
            maxWidth: columnasAExtender.includes("ultima") ? undefined : 100,
            flex: columnasAExtender.includes("ultima") ? 1 : undefined,
            cellClassName: "actions",
            getActions: (params) => {
              const { id } = params;
              const accionesDeFila = params.row.accionesDeFila;
              const isFooter = params.row.footer;
              const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;
              if (isFooter) {
                return [];
              }
              if (isInEditMode) {
                return [
                  <GridActionsCellItem icon={<Typography className="c-guardar" />} label="Save" onClick={handleSaveClick(id)} key="guardar" sx={{ color: `primary.${opositeMode}` }} />,
                  <GridActionsCellItem key="cancelar" icon={<Typography className="c-x1" />} label="Cancel" className="textPrimary" onClick={handleCancelClick(id)} color="error" />,
                ];
              }
              return [
                ...((accionesDeFila?.editar !== undefined ? accionesDeFila?.editar : accionesProcesadas.editar) &&
                (accionesDeFila?.guardar !== undefined ? accionesDeFila?.guardar : accionesProcesadas.guardar) &&
                !editingRow
                  ? [<GridActionsCellItem key="editar" icon={<Typography className="c-lapiz" />} label="Edit" className="textPrimary" onClick={handleEditClick(id)} color="secondary" />]
                  : []),
                ...((accionesDeFila?.eliminar !== undefined ? accionesDeFila?.eliminar : accionesProcesadas.eliminar)
                  ? [
                      <GridActionsCellItem
                        key="eliminar"
                        icon={<Typography className="c-eliminar" />}
                        label="Delete"
                        onClick={() => {
                          setLineaAEliminar(id);
                          alertaEliminar ? setMostrarAlerta(true) : handleDeleteClick(id)();
                        }}
                        color="error"
                      />,
                    ]
                  : []),
                ...(!dataCopiada && (accionesDeFila?.copiar !== undefined ? accionesDeFila?.copiar : accionesProcesadas.copiar)
                  ? [<GridActionsCellItem icon={<Typography className="c-copiar" />} label="Delete" onClick={() => setDataCopiada(params.row)} color="blue-grey" key="copiar" />]
                  : []),
                ...((accionesDeFila?.estadistica !== undefined ? accionesDeFila?.estadistica : accionesProcesadas.estadistica)
                  ? [
                      <GridActionsCellItem
                        icon={<Typography className="c-estadisticas" sx={{ fontSize: "1.1rem !important" }} />}
                        label="estadistica"
                        onClick={() => onEstadisticasClick(params.row)}
                        color="primary"
                        key="estadisticas"
                      />,
                    ]
                  : []),
              ];
            },
          },
        ]
      : []),
  ];

  useEffect(() => {
    tableApiRef.current.autosizeColumns(autosizeOptions);
  }, [autosizeOptions, tableApiRef]);

  useEffect(() => {
    setRows(datos.map((i, ind) => ({ ...i, id: i[idKey], index_para_tabla: ind + 1 })));

    setNextId(datos.length > 0 ? Math.max(...datos.map((i) => Number(i[idKey]))) + 1 : 1);
  }, [datos, idKey]);

  const handlePaginationChange = (model) => setPaginationModel(model);

  const paginatedRows = useMemo(() => rows.slice(paginationModel.page * paginationModel.pageSize, (paginationModel.page + 1) * paginationModel.pageSize), [paginationModel, rows]);

  const allRowsToRender = useMemo(() => {
    if (!totales) return [...paginatedRows];
    return [
      ...paginatedRows,
      {
        footer: true,
        id: Number.MAX_SAFE_INTEGER,
        index_para_tabla: Number.MAX_SAFE_INTEGER,
      },
    ];
  }, [paginatedRows]);

  useEffect(() => {
    setRows(datos.map((i, ind) => ({ ...i, id: i[idKey], index_para_tabla: ind + 1 })));

    // Manejar caso cuando no hay datos
    const maxId = datos.length > 0 ? Math.max(...datos.map((i) => Number(i[idKey]))) : 0;

    setNextId(maxId + 1);
  }, [datos, idKey]);

  return (
    <Box sx={{ width: "100%", mb: 1 }}>
      <DataGrid
        apiRef={tableApiRef}
        localeText={esES.components.MuiDataGrid.defaultProps.localeText}
        rowHeight={25}
        autosizeOptions={autosizeOptions}
        getRowHeight={() => "auto"}
        columnHeaderHeight={25}
        rowModesModel={rowModesModel}
        slotProps={{
          toolbar: { showQuickFilter: true, printOptions: { disableToolbarButton: true } },
          pagination: {
            showFirstButton: true,
            showLastButton: true,
            component: "div",
            lang: "es",
            sx: styleTablePagination,
            slotProps: {
              select: {
                label: labelRowsPerPage,
                "aria-label": labelRowsPerPage,
                MenuProps: { sx: { "& .MuiMenu-paper": { elevation: 0, m: 0, p: 0, mt: 0 }, "& .MuiList-root": { my: 0, py: 0, "& .MuiTablePagination-menuItem": { my: 0.1, py: 0 } } } },
              },
            },
          },
        }}
        sx={{
          "&.MuiDataGrid-root--densityCompact .MuiDataGrid-cell": { pt: "5px", height: "calc(var(--height) - 50px)", minHeight: 25 },
          "&.MuiDataGrid-root--densityStandard .MuiDataGrid-cell": { pt: "5px", height: "calc(var(--height) - 50px)", minHeight: 25 },
          "&.MuiDataGrid-root--densityComfortable .MuiDataGrid-cell": { pt: "5px", height: "calc(var(--height) - 50px)", minHeight: 25 },
          "& .MuiDataGrid-footerContainer": { minHeight: "25px", maxHeight: "25px" },
          "& .MuiTablePagination-root": {
            minHeight: "25px",
            maxHeight: "25px",
            p: 0,
            m: 0,
            overflow: "none",
            "& .MuiInputBase-root": { minHeight: "25px", maxHeight: "25px", "& button": { p: 0 }, "& .MuiSelect-select": { m: 0, py: 0 } },
            "& .MuiTablePagination-actions": { minHeight: "25px", maxHeight: "25px", "& button": { p: 0 } },
            "& .MuiToolbar-root": { minHeight: "25px", maxHeight: "25px", "& .MuiTablePagination-selectLabel": { my: 0 }, "& .MuiTablePagination-displayedRows": { my: 0 } },
          },
          bgcolor: `background.${themeMode === "dark" ? 50 : 900}`,
          "& .MuiDataGrid-columnHeaders div": { bgcolor: `background.${themeMode === "dark" ? 50 : 900}`, color: `primary.${opositeMode}`, fontWeight: "bold" },
          "& .MuiDataGrid-cell": { borderColor: "background.200" },
          "& .MuiDataGrid-columnSeparator": { borderColor: "background.200" },
          ".footer-row": {
            borderTop: "1px solid",
            borderColor: "background.100",
          },
        }}
        rows={allRowsToRender}
        columns={columns}
        editMode="row"
        onRowDoubleClick={handleEditDoubleClick}
        onRowModesModelChange={handleRowModesModelChange}
        onRowEditStop={handleRowEditStop}
        processRowUpdate={processRowUpdate}
        onProcessRowUpdateError={(error) => console.error(error)}
        showCellVerticalBorder
        showColumnVerticalBorder
        onCellDoubleClick={(params, event) => (event.defaultMuiPrevented = true)}
        disableSelectionOnClick
        disableAutosize
        autosizeOnMount
        disableDensitySelector
        ignoreDiacritics
        onCellKeyDown={(params, event) => {
          if (event.key === "Enter") {
            event.defaultMuiPrevented = true; // Detiene la acción por defecto
            event.stopPropagation(); // Evita la propagación
          }
        }}
        slots={{ toolbar: CustomDataGridToolbar }}
        columnGroupingModel={groupModel}
        getRowClassName={(params) => {
          return params.row.footer ? "footer-row" : "";
        }}
        {...(totales
          ? {
              getRowClassName: (params) => {
                return params.row.footer ? "footer-row" : "";
              },
              pagination: true,
              paginationMode: "server",
              pageSizeOptions: [5, 10, 15, 25, { value: rows.length, label: "Todos" }],
              paginationModel: paginationModel,
              onPaginationModelChange: handlePaginationChange,
              rowCount: rows.length,
              rows: allRowsToRender,
            }
          : {
              initialState: { pagination: { paginationModel: { pageSize: 10 } }, filter: { filterModel: { items: [], quickFilterValues: [] } } },
              rows: rows,
              pageSizeOptions: [5, 10, 15, 25, { value: -1, label: "Todos" }],
            })}
      />
      <ActionAlertComponent
        aceptar={() => {
          handleDeleteClick(lineaAEliminar)();
          setMostrarAlerta(false);
        }}
        cancelar={() => {
          setMostrarAlerta(false);
        }}
        openDialog={mostrarAlerta}
        tipo="error"
        handleClose={() => {}}
        content={
          textoAlertaEliminacion ? (typeof textoAlertaEliminacion === "string" ? textoAlertaEliminacion : textoAlertaEliminacion(lineaAEliminar)) : "¿Esta seguro que desea eliminar el registro?"
        }
      />
      <ActionAlertComponent
        aceptar={() => {
          setMostrarFaltantes(false);
        }}
        cancelar={() => {
          setMostrarFaltantes(false);
        }}
        openDialog={mostrarFaltantes}
        tipo="warning"
        activarCanecelar={false}
        handleClose={() => {
          setMostrarFaltantes(false);
        }}
        content={
          <Grid container wdith="100%" direction="column">
            <Grid size={12}>
              <Typography>{`Por favor complete los siguientes campos:`}</Typography>
            </Grid>
            <List dense sx={{ my: 0, p: 0 }}>
              {mensajeCamposFaltantes}
            </List>
            <Grid size={12}>
              <Typography>{`Para realizar la acción.`}</Typography>
            </Grid>
          </Grid>
        }
      />
      <Grid container></Grid>
    </Box>
  );
};

EditableDataGridComponent.propTypes = {
  encabezados: PropTypes.array,
  datos: PropTypes.array,
  idKey: PropTypes.string,
  textoAlertaEliminacion: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  onInput: PropTypes.func,
  processInput: PropTypes.func,
  onRowSave: PropTypes.func,
  onAddRow: PropTypes.func,
  onDeleteRow: PropTypes.func,
  onEdditRow: PropTypes.func,
  filaSeleccionada: PropTypes.func,
  varificarSiEsEditable: PropTypes.func,
  onEstadisticasClick: PropTypes.func,
  columnasAExtender: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf(["primera", "ultima"])])),
  objetoBase: PropTypes.object,
  acciones: PropTypes.shape({
    ver: PropTypes.bool,
    editar: PropTypes.bool,
    eliminar: PropTypes.bool,
    copiar: PropTypes.bool,
    pegar: PropTypes.bool,
    guardar: PropTypes.bool,
    agregar: PropTypes.bool,
  }),
  camposRequeridosParaGuardar: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  groupModel: PropTypes.object,
  totales: PropTypes.bool,
  totalesPorPagina: PropTypes.bool,
  alwaysSave: PropTypes.bool,
  botones: PropTypes.object,
  alertaEliminar: PropTypes.bool,
};

export default EditableDataGridComponent;
