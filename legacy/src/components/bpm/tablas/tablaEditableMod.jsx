import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useQueryClient } from "@tanstack/react-query";
import {
    Autocomplete,
    Box,
    Checkbox,
    Grid,
    Icon,
    IconButton,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TableSortLabel,
    TextField,
    Typography,
} from "@mui/material";

import { useSelector } from "react-redux";
import ActionAlertComponent from "../../Dialog/ActionAlertComponent";
import TooltipComponent from "../../TooltipComponent/TooltipComponent";
import styleTablePagination from "../../Tabla/styles";
import { datosBotonesIcono } from "../../Tabla";
import DatePickerComponent from "../../Tabla/TablaEditable/DatePickerComponent";
import { style as selectStyle } from "../../Tabla/TablaEditable/selectComponentStyles";
import { styleFilled } from "../../Tabla/TablaEditable/textComponentStyles";

const maincolor = (number = "200") => `background.${number}`;

const nopadding = { pl: 0, pr: 0, pt: 0, pb: 0, px: 0, py: 0, p: 0 };
const nomargin = { ml: 0, mr: 0, mt: 0, mb: 0, mx: 0, my: 0, m: 0 };
const allPM0 = { ...nopadding, ...nomargin };

const SelectCellEditor = ({ options, currentValue, column, onChange }) => {
    const resolvedValue = useMemo(() => {
        if (currentValue && typeof currentValue === "object" && !Array.isArray(currentValue)) {
            return currentValue;
        }

        const foundOption = options.find((option) => String(option[column.valueOption]) === String(currentValue));
        if (foundOption) return foundOption;

        if (currentValue !== null && currentValue !== undefined && currentValue !== "") {
            return {
                [column.valueOption]: currentValue,
                [column.labelOption]: String(currentValue),
            };
        }

        return null;
    }, [currentValue, options, column.valueOption, column.labelOption]);

    const [inputValue, setInputValue] = useState(resolvedValue?.[column.labelOption] ?? "");

    useEffect(() => {
        setInputValue(resolvedValue?.[column.labelOption] ?? "");
    }, [resolvedValue, column.labelOption]);

    return (
        <Autocomplete
            disableClearable
            fullWidth
            options={options}
            size="small"
            value={resolvedValue}
            inputValue={inputValue}
            onInputChange={(_, newInputValue, reason) => {
                if (reason !== "reset") {
                    setInputValue(newInputValue);
                }
            }}
            onChange={(_, value) => {
                setInputValue(value?.[column.labelOption] ?? "");
                onChange(value);
            }}
            isOptionEqualToValue={(option, value) => String(option[column.valueOption]) === String(value?.[column.valueOption])}
            getOptionLabel={(option) => option?.[column.labelOption] || ""}
            popupIcon={<Typography component="span" sx={{ fontSize: 15, m: 0, p: 0 }} className="c-abajo-simple" />}
            sx={{ ...selectStyle(column), "& .MuiFormControl-root": { mt: "0px", width: "100%" }, "& .MuiInputBase-root": { pr: 0 } }}
            renderInput={(params) => <TextField {...params} variant="filled" label={column.label} sx={styleFilled(column)} autoComplete="off" />}
        />
    );
};

SelectCellEditor.propTypes = {
    options: PropTypes.arrayOf(PropTypes.object).isRequired,
    currentValue: PropTypes.any,
    column: PropTypes.shape({
        valueOption: PropTypes.string.isRequired,
        labelOption: PropTypes.string.isRequired,
        label: PropTypes.string,
    }).isRequired,
    onChange: PropTypes.func.isRequired,
};

const TablaEditableMod = ({
    titulo,
    title,
    encabezados = [],
    data = [],
    background,
    rowsPerPage = 10,
    rowKey,
    idKey,
    objetoBase = {},
    eventosDeTabla = {},
    acciones = {},
    editarEnTabla = true,
    useSeach = true,
    showRequiredFieldsInfo = true,
    textoAlertaEliminacion,
    onRowAdded = () => { },
    onRowDeleted = () => { },
    onRowEdit = () => { },
    onRowUpdated = () => { },
    onRowView = () => { },
    onInput = () => { },
    onRowClick = () => { },
    onRefresh = () => { },
    invalidateQueryKeys = null,
}) => {
    const { fontSize, themeMode, opositeMode } = useSelector((state) => state.theme);
    const screenSize = useSelector((state) => state.screen?.name);

    const rowIdentifier = useMemo(() => rowKey || idKey || "id", [rowKey, idKey]);
    const [rows, setRows] = useState(data);
    const [search, setSearch] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [originalRow, setOriginalRow] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [page, setPage] = useState(0);
    const [internalRowsPerPage, setInternalRowsPerPage] = useState(rowsPerPage);
    const [sortField, setSortField] = useState(null);
    const [sortOrder, setSortOrder] = useState("none");
    const [columnWidths, setColumnWidths] = useState({});
    const [resizingColumn, setResizingColumn] = useState(null);
    const [startX, setStartX] = useState(0);
    const [startWidth, setStartWidth] = useState(0);
    const [deleteClick, setDeleteClick] = useState(false);
    const [lineaAEliminar, setLineaAEliminar] = useState(null);

    const columnas = useMemo(() => {
        return encabezados
            .map((encabezado) => {
                const id = encabezado.id || encabezado.key || encabezado.name || encabezado.field;
                const label = encabezado.label || encabezado.name || encabezado.columnName || encabezado.headerName;
                let tipo = encabezado.type || encabezado.tipo;

                if (tipo === "singleSelect") tipo = "select";

                return {
                    ...encabezado,
                    id,
                    field: encabezado.field || id,
                    label,
                    tipo,
                    options: encabezado.options || encabezado.valueOptions || [],
                    valueOption: encabezado.valueOption || encabezado.value_option || "value",
                    labelOption: encabezado.labelOption || encabezado.label_option || "label",
                    editable: encabezado.editable === undefined ? true : encabezado.editable,
                    visible: encabezado.visible === undefined ? true : encabezado.visible,
                    multiline: encabezado.multilinea ?? encabezado.multiline ?? true,
                };
            })
            .filter((columna) => columna.visible);
    }, [encabezados]);

    const generatedBaseRow = useMemo(() => {
        return columnas.reduce((acc, columna) => {
            if (Object.hasOwn(objetoBase, columna.id)) {
                acc[columna.id] = objetoBase[columna.id];
                return acc;
            }

            if (columna.tipo === "boolean" || columna.tipo === "checkbox") {
                acc[columna.id] = false;
            } else {
                acc[columna.id] = "";
            }

            return acc;
        }, { ...objetoBase });
    }, [columnas, objetoBase]);

    const [nuevaFila, setNuevaFila] = useState(generatedBaseRow);

    const bgcolor = useMemo(
        () => background || maincolor(themeMode === "dark" ? 50 : 900) + (themeMode === "dark" ? "_40" : "_50"),
        [background, themeMode],
    );
    const borderColor = themeMode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";
    const labelRowsPerPage = useMemo(() => (["xs"].includes(screenSize) ? "" : "Filas por página"), [screenSize]);

    const deleteAlertContent = useMemo(() => {
        if (!textoAlertaEliminacion) {
            return "¿Esta seguro que desea eliminar el registro?";
        }

        if (typeof textoAlertaEliminacion === "string") {
            return textoAlertaEliminacion;
        }

        if (!lineaAEliminar) {
            return "¿Esta seguro que desea eliminar el registro?";
        }

        return textoAlertaEliminacion(lineaAEliminar[rowIdentifier], lineaAEliminar);
    }, [lineaAEliminar, rowIdentifier, textoAlertaEliminacion]);

    useEffect(() => {
        if (!Array.isArray(data)) {
            setRows(data || []);
            return;
        }

        setRows((prev) => {
            if (editingId === null) {
                const prevJson = JSON.stringify(prev);
                const nextJson = JSON.stringify(data);
                if (prevJson === nextJson) {
                    return prev;
                }
                return data;
            }

            const prevEdit = prev.find((r) => r[rowIdentifier] === editingId);
            if (!prevEdit) {
                return data;
            }

            const incomingEdit = data.find((r) => r[rowIdentifier] === editingId);
            if (!incomingEdit) {
                return data;
            }

            return data.map((r) =>
                r[rowIdentifier] === editingId ? prevEdit : r,
            );
        });
    }, [data, editingId, rowIdentifier]);

    const prevBaseRowRef = React.useRef(generatedBaseRow);

    useEffect(() => {
        const prevBase = prevBaseRowRef.current;
        const prevBaseStr = JSON.stringify(prevBase);
        const newBaseStr = JSON.stringify(generatedBaseRow);

        if (prevBaseStr !== newBaseStr) {
            if (JSON.stringify(nuevaFila) === prevBaseStr) {
                setNuevaFila(generatedBaseRow);
            }
            prevBaseRowRef.current = generatedBaseRow;
        }
    }, [generatedBaseRow, nuevaFila]);

    useEffect(() => {
        if (!resizingColumn) {
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            return undefined;
        }

        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";

        return () => {
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };
    }, [resizingColumn]);

    const handleResize = useCallback(
        (event) => {
            if (!resizingColumn) return;

            const newWidth = startWidth + (event.clientX - startX);
            setColumnWidths((prev) => ({ ...prev, [resizingColumn]: Math.max(newWidth, 50) }));
        },
        [resizingColumn, startWidth, startX],
    );

    const stopResize = useCallback(() => {
        setResizingColumn(null);
    }, []);

    useEffect(() => {
        if (!resizingColumn) return undefined;

        globalThis.addEventListener("mousemove", handleResize);
        globalThis.addEventListener("mouseup", stopResize);

        return () => {
            globalThis.removeEventListener("mousemove", handleResize);
            globalThis.removeEventListener("mouseup", stopResize);
        };
    }, [handleResize, resizingColumn, stopResize]);

    const startResize = useCallback(
        (columnId, event) => {
            setResizingColumn(columnId);
            setStartX(event.clientX);
            setStartWidth(columnWidths[columnId] || 100);
            event.preventDefault();
        },
        [columnWidths],
    );

    const getNewKey = useCallback(() => {
        const existingKeys = rows
            .map((row) => row[rowIdentifier])
            .filter((value) => value !== null && value !== undefined);

        const numericKeys = existingKeys
            .map(Number)
            .filter((value) => !Number.isNaN(value));

        if (numericKeys.length > 0) {
            return String(Math.max(...numericKeys, 0) + 1);
        }

        return `temp_id_${Date.now()}`;
    }, [rowIdentifier, rows]);

    const rowsWithMeta = useMemo(() => {
        return rows.map((item, index) => ({
            ...item,
            no: index + 1,
        }));
    }, [rows]);

    const sortedRows = useMemo(() => {
        if (!sortField || sortOrder === "none") return rowsWithMeta;

        return [...rowsWithMeta].sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];

            if (aValue === bValue) return 0;
            if (aValue === undefined || aValue === null) return sortOrder === "asc" ? -1 : 1;
            if (bValue === undefined || bValue === null) return sortOrder === "asc" ? 1 : -1;
            if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
            return sortOrder === "asc" ? 1 : -1;
        });
    }, [rowsWithMeta, sortField, sortOrder]);

    const doesValueIncludeTerm = useCallback((value, term) => {
        if (value === null || value === undefined) return false;
        if (typeof value === "object") return JSON.stringify(value).toLowerCase().includes(term);
        return String(value).toLowerCase().includes(term);
    }, []);

    const rowMatchesSearch = useCallback(
        (row, term) => columnas.some((columna) => doesValueIncludeTerm(row[columna.id], term)),
        [columnas, doesValueIncludeTerm],
    );

    const filteredRows = useMemo(() => {
        if (!search) return sortedRows;

        const term = search.toLowerCase();
        return sortedRows.filter((row) => rowMatchesSearch(row, term));
    }, [rowMatchesSearch, search, sortedRows]);

    const rowsPerPageOptions = useMemo(() => {
        const base = [5, 10, 15, 25];
        if (!base.includes(internalRowsPerPage)) {
            return [...base, internalRowsPerPage, { label: "All", value: filteredRows.length || 1 }];
        }
        return [...base, { label: "All", value: filteredRows.length || 1 }];
    }, [internalRowsPerPage, filteredRows.length]);

    const pagedRows = useMemo(() => {
        const startIndex = page * internalRowsPerPage;
        return filteredRows.slice(startIndex, startIndex + internalRowsPerPage);
    }, [filteredRows, internalRowsPerPage, page]);

    useEffect(() => {
        const totalPages = Math.ceil(filteredRows.length / internalRowsPerPage);
        if (page >= totalPages && totalPages > 0) {
            setPage(Math.max(0, totalPages - 1));
        }
    }, [filteredRows.length, internalRowsPerPage, page]);

    const restoreRowById = useCallback(
        (prevRows, id) =>
            prevRows.map((row) => {
                if (row[rowIdentifier] !== id) return row;
                return originalRow ? { ...originalRow } : row;
            }),
        [originalRow, rowIdentifier],
    );

    const updateRowById = useCallback(
        (prevRows, id, nextRow) => prevRows.map((row) => (row[rowIdentifier] === id ? nextRow : row)),
        [rowIdentifier],
    );

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape" && editingId !== null) {
                setRows((prev) => restoreRowById(prev, editingId));
                setOriginalRow(null);
                setEditingId(null);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [editingId, originalRow, restoreRowById]);

    const resolveActionEnabled = useCallback((actionName, row) => {
        if (!acciones[actionName]) return false;
        if (row?.accionesDeTabla?.[actionName] === undefined) return Boolean(acciones[actionName]);
        return Boolean(row.accionesDeTabla[actionName]);
    }, [acciones]);

    const normalizeValue = useCallback((value) => value, []);

    const getSelectOptions = useCallback((column, row) => {
        if (typeof column.options === "function") {
            const result = column.options(row, column.id);
            return Array.isArray(result) ? result : [];
        }

        return Array.isArray(column.options) ? column.options : [];
    }, []);

    const getSelectValue = useCallback((column, row) => {
        const currentValue = row?.[column.id];
        if (currentValue && typeof currentValue === "object") return currentValue;

        const options = getSelectOptions(column, row);
        const found = options.find((option) => String(option[column.valueOption]) === String(currentValue));
        if (found) return found;

        if (currentValue !== null && currentValue !== undefined && currentValue !== "") {
            const valueKey = column.valueOption || "value";
            const labelKey = column.labelOption || "label";
            return { [valueKey]: currentValue, [labelKey]: currentValue };
        }

        return null;
    }, [getSelectOptions]);

    const applyOnInputResult = useCallback((result, fallbackRow, setter) => {
        if (result && typeof result === "object" && !Array.isArray(result)) {
            setter(result.row || result);
            return result.row || result;
        }

        setter(fallbackRow);
        return fallbackRow;
    }, []);

    const handleCellChange = useCallback(
        ({ row, column, value, isNew = false }) => {
            let normalized = normalizeValue(value);

            if (column?.tipo === "select" && normalized && typeof normalized === "object" && !Array.isArray(normalized)) {
                const valueKey = column.valueOption || "value";
                if (Object.hasOwn(normalized, valueKey)) {
                    normalized = normalized[valueKey];
                }
            }

            if (column?.tipo === "date" && normalized instanceof Date) {
                normalized = normalized.toISOString();
            }

            if (column?.tipo === "number") {
                if (normalized === "" || normalized === null || normalized === undefined) {
                    // keep empty values as-is so user can clear the field
                } else if (typeof normalized === "string") {
                    const parsed = Number(normalized);
                    if (!Number.isNaN(parsed)) {
                        normalized = parsed;
                    }
                }
            }

            if (isNew) {
                const updatedRow = { ...nuevaFila, [column.id]: normalized };
                const result = onInput({
                    field: column.id,
                    value: normalized,
                    row: updatedRow,
                    id: undefined,
                    isNew: true,
                });

                applyOnInputResult(result, updatedRow, setNuevaFila);
                return;
            }

            const updatedRow = { ...row, [column.id]: normalized };
            const result = onInput({
                field: column.id,
                value: normalized,
                row: updatedRow,
                id: row[rowIdentifier],
                isNew: false,
            });

            const nextRow = result?.row || result || updatedRow;
            setRows((prev) => updateRowById(prev, row[rowIdentifier], nextRow));
        },
        [nuevaFila, onInput, normalizeValue, rowIdentifier, applyOnInputResult, updateRowById],
    );

    const handleSort = useCallback(
        (field) => {
            if (field !== sortField) {
                setSortField(field);
                setSortOrder("asc");
                return;
            }

            if (sortOrder === "asc") {
                setSortOrder("desc");
                return;
            }

            if (sortOrder === "desc") {
                setSortField(null);
                setSortOrder("none");
                return;
            }

            setSortOrder("asc");
        },
        [sortField, sortOrder],
    );

    const handleEdit = useCallback(
        (id, row) => {
            if (!editarEnTabla) {
                if (eventosDeTabla.edit) eventosDeTabla.edit(id, row);
                else onRowEdit(id, row);
                return;
            }

            setEditingId(id);
            setOriginalRow({ ...row });

            if (eventosDeTabla.edit) eventosDeTabla.edit(id, row);
            else onRowEdit(id, row);
        },
        [editarEnTabla, eventosDeTabla, onRowEdit],
    );

    const handleCancel = useCallback(
        (id) => {
            setRows((prev) => prev.map((row) => (row[rowIdentifier] === id ? { ...originalRow } : row)));
            setOriginalRow(null);
            setEditingId(null);
        },
        [originalRow, rowIdentifier],
    );

    const handleSave = useCallback(
        async (id, row) => {
            try {
                if (eventosDeTabla.save) {
                    await eventosDeTabla.save(id, row);
                } else {
                    await Promise.resolve(onRowUpdated(id, row));
                }

                setEditingId(null);
                setOriginalRow(null);
            } catch (error) {
                console.error("Error al guardar la fila:", error);
                // Si se desea, aquí podría agregarse notificación al usuario.
            }
        },
        [eventosDeTabla, onRowUpdated],
    );

    const handleDelete = useCallback(
        (id, row) => {
            if (eventosDeTabla.delete) eventosDeTabla.delete(id, row);
            else onRowDeleted(id, row);
            setDeleteClick(false);
            setLineaAEliminar(null);
        },
        [eventosDeTabla, onRowDeleted],
    );

    const queryClient = useQueryClient();

    const handleRefresh = useCallback(async () => {
        try {
            if (Array.isArray(invalidateQueryKeys) && invalidateQueryKeys.length > 0) {
                await Promise.all(
                    invalidateQueryKeys.map((key) =>
                        queryClient.invalidateQueries({ queryKey: key })
                    )
                );
            } else if (invalidateQueryKeys) {
                await queryClient.invalidateQueries({ queryKey: invalidateQueryKeys });
            }
        } catch (err) {
            console.error("Error invalidando cache en TablaEditableMod:", err);
        }

        const refreshAction = eventosDeTabla.refresh ?? onRefresh;
        await Promise.resolve(refreshAction());
    }, [eventosDeTabla, onRefresh, invalidateQueryKeys, queryClient]);

    const validateRow = useCallback(
        (row) => {
            const requiredColumns = columnas.filter((col) => col.required || col.label?.includes("*"));
            if (requiredColumns.length === 0) return true;

            return requiredColumns.every((col) => {
                const value = row?.[col.id];
                if (value === "" || value === null || value === undefined) return false;

                if (typeof value === "object" && !Array.isArray(value)) return true;

                if (col.tipo === "number") {
                    const num = Number(value);
                    if (!Number.isFinite(num)) return false;
                    if (col.min !== undefined && num < col.min) return false;
                    if (col.max !== undefined && num > col.max) return false;
                }

                return true;
            });
        },
        [columnas],
    );

    const isNewRowValid = validateRow(nuevaFila);

    const handleCreate = useCallback(() => {
        if (!isNewRowValid) return;

        const id = getNewKey();
        const filaGenerada = { ...generatedBaseRow, ...nuevaFila, [rowIdentifier]: id };
        onRowAdded(id, filaGenerada);
        setNuevaFila(generatedBaseRow);
    }, [generatedBaseRow, getNewKey, isNewRowValid, nuevaFila, onRowAdded, rowIdentifier]);

    const formatBooleanValue = (rawValue) => (
        <Typography className={rawValue ? "c-cheque" : "c-x1"} color={rawValue ? "success.main" : "error.main"} />
    );

    const formatSelectValue = (rawValue, column, row) => {
        if (rawValue && typeof rawValue === "object") {
            return rawValue[column.labelOption] || rawValue.label || rawValue[column.valueOption] || String(rawValue);
        }

        const option = getSelectOptions(column, row).find((item) => String(item[column.valueOption]) === String(rawValue));
        if (option) {
            return option[column.labelOption] || option.label || option[column.valueOption] || String(rawValue);
        }

        return rawValue !== null && rawValue !== undefined ? String(rawValue) : "";
    };

    const formatDateValue = (rawValue) => {
        if (!rawValue) return "";

        const date = rawValue instanceof Date ? rawValue : new Date(rawValue);
        return Number.isNaN(date.getTime())
            ? String(rawValue)
            : date.toLocaleDateString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric" });
    };

    const formatNumberValue = (rawValue, column) => {
        if (rawValue === null || rawValue === undefined || rawValue === "") return undefined;

        const num = Number(rawValue);
        if (!Number.isFinite(num)) return undefined;

        const decimals = Number.isFinite(Number(column.decimals)) ? Number(column.decimals) : 2;
        return num.toFixed(decimals);
    };

    const formatDefaultValue = (rawValue) => {
        if (rawValue && typeof rawValue === "object" && rawValue.$$typeof) return rawValue;
        if (rawValue instanceof Date) {
            return rawValue.toLocaleDateString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric" });
        }
        return rawValue ?? "";
    };

    const formatearContenido = useCallback(
        (row, column) => {
            const rawValue = row[column.id];

            if (typeof column.format === "function") {
                const valueForFormat = rawValue === undefined && !Object.hasOwn(row, column.id) ? row : rawValue;
                return column.format(valueForFormat, row, column);
            }

            if (column.tipo === "boolean" || column.tipo === "checkbox") {
                return formatBooleanValue(rawValue);
            }

            if (column.tipo === "select") {
                return formatSelectValue(rawValue, column, row);
            }

            if (column.tipo === "date") {
                return formatDateValue(rawValue);
            }

            if (column.tipo === "number") {
                const formattedValue = formatNumberValue(rawValue, column);
                if (formattedValue !== undefined) return formattedValue;
            }

            return formatDefaultValue(rawValue);
        },
        [getSelectOptions],
    );

    const renderTextEditor = (row, column, isNew) => {
        const value = row?.[column.id] ?? "";

        const handleKeyDown = (event) => {
            if (column.tipo !== "number") return;

            const allowedKeys = [
                "Backspace",
                "Delete",
                "ArrowLeft",
                "ArrowRight",
                "ArrowUp",
                "ArrowDown",
                "Tab",
                "Home",
                "End",
                "Enter",
            ];

            const char = event.key;
            const isNumber = /^\d$/.test(char);
            const isDecimal = char === ".";
            const isControl = allowedKeys.includes(char);

            // prevent typing any non-numeric (except dot) in number fields
            if (isNumber || isDecimal || isControl) {
                return;
            }

            event.preventDefault();

            if (isDecimal && String(value).includes(".")) {
                event.preventDefault();
            }
        };

        if (column.tipo === "date") {
            return (
                <Box sx={{ px: 0.5, width: "100%" }} onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
                    <DatePickerComponent
                        input={{
                            id: column.id,
                            val: value,
                            label: column.label,
                            readonly: column.readonly,
                        }}
                        id={`${row?.[rowIdentifier] || "new"}_${column.id}`}
                        onInput={(selectedValue) => handleCellChange({ row, column, value: selectedValue, isNew })}
                    />
                </Box>
            );
        }

        let inputStep;
        if (column.step === undefined) {
            inputStep = column.tipo === "number" ? "0.01" : undefined;
        } else {
            inputStep = column.step;
        }

        return (
            <Box sx={{ px: 0.5, width: "100%" }}>
                <TextField
                    variant="filled"
                    fullWidth
                    size="small"
                    type={column.tipo === "number" ? "number" : "text"}
                    value={value}
                    onChange={(event) => handleCellChange({ row, column, value: event.target.value, isNew })}
                    onKeyDown={handleKeyDown}
                    label={column.label}
                    autoComplete="off"
                    multiline={column.tipo === "textarea" || column.tipo === "texteditor" || column.multiline}
                    slotProps={{
                        input: {
                            min: column.min,
                            max: column.max,
                            step: inputStep,
                            inputMode: column.tipo === "number" ? "decimal" : undefined,
                            pattern: column.tipo === "number" ? String.raw`[0-9]*\.?[0-9]*` : undefined,
                        },
                    }}
                    sx={{
                        ...styleFilled(column),
                        "& .MuiFormControl-root": { mt: "0px", width: "100%" },
                        "& .MuiFilledInput-root": { minHeight: "24px", py: "0px !important", fontSize: "12px" },
                    }}
                />
            </Box>
        );
    };

    const renderSelectEditor = (row, column, isNew) => {
        const options = getSelectOptions(column, row);
        const currentValue = getSelectValue(column, row);

        return (
            <SelectCellEditor
                options={options}
                currentValue={currentValue}
                column={column}
                onChange={(value) => handleCellChange({ row, column, value, isNew })}
            />
        );
    };

    const renderBooleanEditor = (row, column, isNew) => {
        if (column.tipo === "checkbox") {
            return (
                <Checkbox
                    checked={Boolean(row?.[column.id])}
                    onChange={(event) => handleCellChange({ row, column, value: event.target.checked, isNew })}
                    sx={{ p: 0.5 }}
                />
            );
        }

        return (
            <Switch
                checked={Boolean(row?.[column.id])}
                onChange={(event) => handleCellChange({ row, column, value: event.target.checked, isNew })}
                sx={{ px: 1 }}
            />
        );
    };

    const renderEditableCell = (row, column, isNew = false) => {
        if (!column.editable) {
            if (isNew && column.showOnNew) {
                return formatearContenido(
                    {
                        ...row,
                        __isNewRow: true,
                        __setNewRow: setNuevaFila,
                    },
                    column,
                );
            }
            return isNew ? "" : formatearContenido(row, column);
        }

        if (column.tipo === "select") return renderSelectEditor(row, column, isNew);
        if (column.tipo === "boolean" || column.tipo === "checkbox") return renderBooleanEditor(row, column, isNew);
        return renderTextEditor(row, column, isNew);
    };

    const renderActionButton = (tipo, row, onClick, disabled = false, tooltip = undefined) => {
        const iconData = datosBotonesIcono[tipo];
        if (!iconData) return null;

        const tooltipTitle = tooltip || iconData.tooltip;

        return (
            <TooltipComponent
                titulo={tooltipTitle}
                borderColor={`${iconData.color}.main`}
                bgcolor="background.main_60"
                color="text.main"
            >
                <Grid sx={{ borderRadius: 50 }}>
                    <IconButton onClick={onClick} color="background" size="small" sx={{ fontSize: 14 }} disabled={disabled}>
                        <Typography component="span" className={iconData.icono} color={`${iconData.color}.main`} />
                    </IconButton>
                </Grid>
            </TooltipComponent>
        );
    };

    const handleView = useCallback(
        (id, row) => {
            if (eventosDeTabla.view) eventosDeTabla.view(id, row);
            else onRowView(id, row);
        },
        [eventosDeTabla, onRowView],
    );

    const handleRowClick = useCallback(
        (event, row) => {
            if (event.detail === 2 && resolveActionEnabled("edit", row) && editarEnTabla) {
                handleEdit(row[rowIdentifier], row);
                return;
            }

            setSelectedId((prev) => (prev === row[rowIdentifier] ? null : row[rowIdentifier]));
            onRowClick(row[rowIdentifier], row);
        },
        [editarEnTabla, handleEdit, onRowClick, resolveActionEnabled, rowIdentifier],
    );

    const accionesFront = Boolean(acciones.view);
    const accionesBack = Boolean(acciones.add || acciones.edit || acciones.delete || acciones.save);

    return (
        <Box
            sx={{
                zIndex: 10,
                maxWidth: "100%",
                width: "100%",
                overflowX: "auto",
                p: 1,
                bgcolor,
                borderColor: themeMode === "dark" ? "rgba(40, 40, 40, 1)" : "rgba(224, 224, 224, 1)",
                borderStyle: "solid",
                borderWidth: 0.5,
                borderRadius: 2,
                backdropFilter: "blur(3px)",
                WebkitBoxShadow: themeMode === "dark" ? "0px 0px 5px 1px rgba(180,180,180,0.58)" : "2.5px 10px 10px rgba(0,0,0,0.2)",
                boxShadow: themeMode === "dark" ? "0px 0px 5px 1px rgba(180,180,180,0.58)" : "2.5px 10px 10px rgba(0,0,0,0.2)",
                "& .MuiTableCell-body": { m: 0, p: 0, py: 0, px: 0.5 },
            }}
        >
            <Grid container>
                <Grid size={{ md: "grow", sm: 12, xs: 12 }}>
                    <Typography variant="h5" color={`primary.${opositeMode}`} gutterBottom sx={{ fontWeight: "bold", mb: 1 }}>
                        {titulo || title}
                    </Typography>
                    {showRequiredFieldsInfo && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Campos obligatorios <Typography component="span" color="error.main" sx={{ fontWeight: "bold" }}>*</Typography>
                        </Typography>
                    )}
                </Grid>
                <Grid size="auto">
                    {useSeach && (
                        <Grid size="auto" sx={{ py: 1 }}>
                            <Grid container alignItems="center" spacing={1}>
                                <Grid size="auto">
                                    <TooltipComponent title="Recargar datos">
                                        <IconButton size="small" aria-label="Recargar datos" onClick={handleRefresh}>
                                            <Icon className="c-actualizar" />
                                        </IconButton>
                                    </TooltipComponent>
                                </Grid>
                                <Grid size="grow">
                                    <TextField
                                        autoComplete="off"
                                        label=""
                                        variant="standard"
                                        size="small"
                                        type="text"
                                        placeholder="Buscar..."
                                        fullWidth
                                        name="buscar"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>
                    )}
                </Grid>
            </Grid>

            <TableContainer component={Grid}>
                <Table
                    size="small"
                    sx={{
                        width: "100%",
                        "& .MuiTableCell-root": {
                            borderRight: `0.5px solid ${borderColor}`,
                            "&:last-child": { borderRight: "none" },
                        },
                    }}
                >
                    <TableHead>
                        <TableRow hover>
                            <TableCell></TableCell>
                            {accionesFront && <TableCell sx={{ width: "1%" }}></TableCell>}
                            {columnas.map((columna) => (
                                <TableCell
                                    key={`${columna.id}_header`}
                                    sx={{
                                        position: "relative",
                                        width: columnWidths[columna.id] || "auto",
                                        minWidth: columna.minWidth || 50,
                                        maxWidth: columna.maxWidth || "auto",
                                        cursor: resizingColumn === columna.id ? "col-resize" : "default",
                                        userSelect: "none",
                                    }}
                                >
                                    <Grid width="100%" container alignItems="center" wrap="nowrap" color="primary.main">
                                        <Grid size="grow">
                                            <TableSortLabel
                                                direction={sortField === columna.id ? sortOrder : "asc"}
                                                onClick={() => handleSort(columna.id)}
                                                active={sortField === columna.id}
                                                sx={{ width: "100%" }}
                                            >
                                                <Typography fontWeight="bold" width="100%" sx={{ color: `primary.${opositeMode}` }}>
                                                    {columna.label}
                                                    {columna.required && (
                                                        <Typography component="span" color="error.main" sx={{ ml: 0.5 }}>
                                                            *
                                                        </Typography>
                                                    )}
                                                </Typography>
                                            </TableSortLabel>
                                        </Grid>
                                    </Grid>
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            top: 0,
                                            right: 2,
                                            width: "1px",
                                            height: "100%",
                                            cursor: "e-resize",
                                            bgcolor: resizingColumn === columna.id ? "grey.200" : "transparent",
                                            zIndex: 200,
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            top: 0,
                                            right: 5,
                                            width: "10px",
                                            height: "100%",
                                            cursor: "e-resize",
                                            zIndex: 200,
                                        }}
                                        onMouseDown={(event) => startResize(columna.id, event)}
                                    />
                                </TableCell>
                            ))}
                            {accionesBack && <TableCell sx={{ width: "1%" }}></TableCell>}
                        </TableRow>
                    </TableHead>

                    <TableBody sx={{ "& td": { ...nopadding, ...nomargin }, "& th": { ...nopadding, ...nomargin } }}>
                        {acciones.add && (
                            <TableRow hover sx={{ bgcolor }}>
                                <TableCell></TableCell>
                                {accionesFront && <TableCell></TableCell>}
                                {columnas.map((columna) => (
                                    <TableCell
                                        key={`${columna.id}_new`}
                                        sx={{
                                            width: columnWidths[columna.id] || "auto",
                                            minWidth: columna.minWidth || 50,
                                            maxWidth: columna.maxWidth || "auto",
                                        }}
                                    >
                                        <Grid sx={{ bgcolor, p: 0.1, width: "100%", height: "100%" }}>
                                            {renderEditableCell(nuevaFila, columna, true)}
                                        </Grid>
                                    </TableCell>
                                ))}
                                {accionesBack && (
                                    <TableCell sx={{ width: "1%" }}>
                                        <Grid container direction="row" justifyContent="space-around" flexWrap="nowrap">
                                            {renderActionButton(
                                                "add",
                                                nuevaFila,
                                                handleCreate,
                                                !isNewRowValid,
                                                isNewRowValid ? undefined : "Complete los campos obligatorios",
                                            )}
                                            {renderActionButton(
                                                "limpiar",
                                                nuevaFila,
                                                () => setNuevaFila(generatedBaseRow),
                                                JSON.stringify(nuevaFila) === JSON.stringify(generatedBaseRow),
                                            )}
                                        </Grid>
                                    </TableCell>
                                )}
                            </TableRow>
                        )}

                        {pagedRows.map((row) => {
                            let rowBgColor;
                            if (row[rowIdentifier] === editingId) {
                                rowBgColor = bgcolor;
                            } else if (row[rowIdentifier] === selectedId) {
                                rowBgColor = "primary.main_10";
                            } else {
                                rowBgColor = undefined;
                            }
                            return (
                                <TableRow
                                    hover
                                    key={row[rowIdentifier]}
                                    sx={{ bgcolor: rowBgColor }}
                                    onClick={(event) => handleRowClick(event, row)}
                                    onDoubleClick={(event) => handleRowClick(event, row)}
                                >
                                    <TableCell sx={{ color: "grey.200", maxWidth: "20px", fontSize: fontSize - 5, textAlign: "center", ...allPM0, width: "1%" }}>
                                        {row.no}
                                    </TableCell>
                                    {accionesFront && (
                                        <TableCell sx={{ width: "1%" }}>
                                            <Grid container direction="row" justifyContent="space-around" flexWrap="nowrap">
                                                {resolveActionEnabled("view", row) && renderActionButton("view", row, () => handleView(row[rowIdentifier], row))}
                                            </Grid>
                                        </TableCell>
                                    )}

                                    {columnas.map((columna) => (
                                        <TableCell
                                            key={`${row[rowIdentifier]}_${columna.id}`}
                                            sx={{
                                                width: columnWidths[columna.id] || "auto",
                                                minWidth: columna.minWidth || 50,
                                                maxWidth: columna.maxWidth || "auto",
                                                whiteSpace: columna.multiline ? undefined : "nowrap",
                                            }}
                                        >
                                            {editingId === row[rowIdentifier] && columna.editable ? renderEditableCell(row, columna) : formatearContenido(row, columna)}
                                        </TableCell>
                                    ))}

                                    {accionesBack && (
                                        <TableCell sx={{ width: "1%" }}>
                                            {editingId === row[rowIdentifier] ? (
                                                <Grid container direction="row" justifyContent="end" flexWrap="nowrap">
                                                    {resolveActionEnabled("edit", row) && renderActionButton("cancel", row, () => handleCancel(row[rowIdentifier]))}
                                                    {resolveActionEnabled("save", row) && renderActionButton("save", row, () => handleSave(row[rowIdentifier], row))}
                                                </Grid>
                                            ) : (
                                                <Grid container direction="row" justifyContent="end" flexWrap="nowrap">
                                                    {resolveActionEnabled("edit", row) && renderActionButton("edit", row, () => handleEdit(row[rowIdentifier], row))}
                                                    {resolveActionEnabled("delete", row) &&
                                                        renderActionButton("delete", row, () => {
                                                            setLineaAEliminar(row);
                                                            setDeleteClick(true);
                                                        })}
                                                </Grid>
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <Grid container fontWeight={100} fontSize="inherit">
                <Grid size="auto" sx={{ pr: 5 }}>
                    Página actual: {page + 1}
                </Grid>
                <Grid size="grow"></Grid>
                <Grid size="grow"></Grid>
                <Grid>
                    <TablePagination
                        component="div"
                        rowsPerPageOptions={rowsPerPageOptions}
                        colSpan={columnas.length}
                        count={filteredRows.length}
                        rowsPerPage={internalRowsPerPage}
                        page={page}
                        showFirstButton
                        showLastButton
                        labelRowsPerPage={labelRowsPerPage}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(event) => {
                            setInternalRowsPerPage(Number.parseInt(event.target.value, 10));
                            setPage(0);
                        }}
                        sx={styleTablePagination}
                    />
                </Grid>
            </Grid>

            {lineaAEliminar && (
                <ActionAlertComponent
                    onConfirm={() => handleDelete(lineaAEliminar[rowIdentifier], lineaAEliminar)}
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
                    content={deleteAlertContent}
                />
            )}
        </Box>
    );
};

TablaEditableMod.propTypes = {
    titulo: PropTypes.string,
    title: PropTypes.string,
    encabezados: PropTypes.arrayOf(PropTypes.object),
    data: PropTypes.arrayOf(PropTypes.object),
    background: PropTypes.string,
    rowsPerPage: PropTypes.number,
    rowKey: PropTypes.string,
    idKey: PropTypes.string,
    objetoBase: PropTypes.object,
    eventosDeTabla: PropTypes.object,
    acciones: PropTypes.object,
    editarEnTabla: PropTypes.bool,
    useSeach: PropTypes.bool,
    showRequiredFieldsInfo: PropTypes.bool,
    textoAlertaEliminacion: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    onRowAdded: PropTypes.func,
    onRowDeleted: PropTypes.func,
    onRowEdit: PropTypes.func,
    onRowUpdated: PropTypes.func,
    onRowView: PropTypes.func,
    onInput: PropTypes.func,
    onRowClick: PropTypes.func,
    onRefresh: PropTypes.func,
    invalidateQueryKeys: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.array,
        PropTypes.object,
    ]),
};

export default TablaEditableMod;