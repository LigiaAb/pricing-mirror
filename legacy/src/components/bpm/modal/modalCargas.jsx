import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
    Autocomplete,
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    Switch,
    TextField,
    Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import StraightenRoundedIcon from "@mui/icons-material/StraightenRounded";
import CalculateRoundedIcon from "@mui/icons-material/CalculateRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";

export const normalize = (val) => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
        if ("value" in val) return val.value;
    }
    return val;
};

export const formatPartidaArancelaria = (val) => {
    const digits = String(val ?? "").replace(/\D/g, "").slice(0, 20);
    const pairs = [];
    for (let i = 0; i < digits.length; i += 2) pairs.push(digits.slice(i, i + 2));
    return pairs.join(".");
};

export const normalizeCantidad = (valor) => {
    if (valor === "" || valor === null || valor === undefined) return 0;
    const num = Number(valor);
    if (!Number.isFinite(num)) return 0;
    return Math.trunc(num);
};

const iataRoundKg = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.ceil(n);
};

// Factor de conversión a cm para las unidades de medida soportadas en
// `lista-relacion-tipo?tipo_tabla=coordinacion_carga&cod_tipo_padre=296`
// (METROS, PIES, PULGADAS, CENTIMETROS). Se usa para convertir las
// dimensiones ingresadas por el usuario a cm antes de aplicar la fórmula
// volumétrica IATA (L × A × H en cm) / 6000.
const FACTORES_CM_POR_UNIDAD = {
    METROS: 100,
    METRO: 100,
    MTS: 100,
    PIES: 30.48,
    PIE: 30.48,
    FEET: 30.48,
    FT: 30.48,
    PULGADAS: 2.54,
    PULGADA: 2.54,
    INCH: 2.54,
    INCHES: 2.54,
    "IN": 2.54,
    CENTIMETROS: 1,
    CENTIMETRO: 1,
    CM: 1,
};

// Resuelve el factor de conversión a cm a partir del valor de
// `unidadMedida` almacenado en la carga (que suele ser el `cod_tipo` del
// registro de lista-relacion-tipo) y la lista de unidades disponible.
// Si el caller ya conoce el factor, puede pasarlo vía `factorCm` y se
// ignora la lista. Default: 1 (centímetros) para mantener compatibilidad
// con cargas que no traen unidad.
export const getFactorCmPorUnidadMedida = (unidadMedida, unidadesMedida = [], factorCm = null) => {
    if (factorCm != null && factorCm !== "" && Number.isFinite(Number(factorCm)) && Number(factorCm) > 0) {
        return Number(factorCm);
    }
    if (unidadMedida == null || unidadMedida === "") return 1;

    if (typeof unidadMedida === "object") {
        const label = String(unidadMedida.label || "").toUpperCase().trim();
        if (FACTORES_CM_POR_UNIDAD[label] !== undefined) return FACTORES_CM_POR_UNIDAD[label];
        return 1;
    }

    // El valor almacenado en la carga es siempre el `cod_tipo` (COD_TIPO),
    // no el `cod_relacion_tipo`. Los hooks de catálogo exponen `value` como
    // cod_relacion_tipo (para el Autocomplete de otras pantallas), así que
    // acá se debe priorizar codTipo/cod_tipo para el match.
    const found = (unidadesMedida || []).find(
        (u) => String(u?.codTipo ?? u?.cod_tipo ?? u?.value) === String(unidadMedida),
    );
    if (found) {
        const label = String(found.label || "").toUpperCase().trim();
        if (FACTORES_CM_POR_UNIDAD[label] !== undefined) return FACTORES_CM_POR_UNIDAD[label];
    }

    const labelDirecto = String(unidadMedida).toUpperCase().trim();
    if (FACTORES_CM_POR_UNIDAD[labelDirecto] !== undefined) return FACTORES_CM_POR_UNIDAD[labelDirecto];

    return 1;
};

export const computeCW = ({ pesoTotal, volumenTotal }) => {
    const peso = Number(pesoTotal);
    const vol = Number(volumenTotal);
    if (!Number.isFinite(peso) || !Number.isFinite(vol) || (peso <= 0 && vol <= 0)) return 0;
    const pesoIATA = iataRoundKg(peso);
    const volumenIATA = iataRoundKg(vol);
    return Number(Math.max(pesoIATA, volumenIATA).toFixed(3));
};

export const computeVolumenTotal = ({ cantidad, largo, ancho, alto, factorCm = 1 }) => {
    const toNum = (v) => {
        const n = Number.parseFloat(v);
        return Number.isFinite(n) ? n : Number.NaN;
    };

    const c = toNum(cantidad);
    const l = toNum(largo);
    const a = toNum(ancho);
    const h = toNum(alto);
    const f = toNum(factorCm);
    const factor = Number.isFinite(f) && f > 0 ? f : 1;

    if ([c, l, a, h].some((x) => Number.isNaN(x) || x <= 0)) {
        return 0;
    }

    // IATA requiere las dimensiones en cm. Si la carga trae otra unidad
    // (pies, pulgadas, metros), multiplicamos por el factor de conversión
    // antes de aplicar (L × A × H) / 6000.
    const lCm = l * factor;
    const aCm = a * factor;
    const hCm = h * factor;
    const volumetricoPorUnidad = (lCm * aCm * hCm) / 6000;
    const volumenTotal = volumetricoPorUnidad * c;
    return iataRoundKg(volumenTotal);
};

export const aplicarCamposDerivados = (fila, field, value, options = {}) => {
    if (!fila) return fila;

    let valorNormalizado;
    if (field === "cantidad") {
        valorNormalizado = normalizeCantidad(value);
    } else if (field === "partidaArancelaria") {
        valorNormalizado = formatPartidaArancelaria(value);
    } else {
        valorNormalizado = normalize(value);
    }
    const siguienteFila = {
        ...fila,
        [field]: valorNormalizado,
    };

    if (field === "definitivoGeneralBool") {
        siguienteFila.definitivoGeneral = value ? "S" : "N";
    }

    if (["cantidad", "largo", "ancho", "alto", "unidadMedida"].includes(field)) {
        const factorCm = getFactorCmPorUnidadMedida(
            siguienteFila.unidadMedida,
            options.unidadesMedida,
            options.factorCm,
        );
        const nuevoVolumen = computeVolumenTotal({ ...siguienteFila, factorCm });
        siguienteFila.volumenTotal = nuevoVolumen > 0 ? nuevoVolumen : "";
        siguienteFila.cw = computeCW({
            pesoTotal: siguienteFila.pesoTotal,
            volumenTotal: siguienteFila.volumenTotal,
        });
    } else if (field === "pesoTotal") {
        siguienteFila.cw = computeCW({
            pesoTotal: valorNormalizado,
            volumenTotal: siguienteFila.volumenTotal,
        });
    }

    return siguienteFila;
};

const getOptionValue = (column, option) => {
    if (!option || typeof option !== "object") return option;
    return option[column.valueOption || "value"] ?? option.value ?? "";
};

const getOptionLabel = (column, option) => {
    if (!option || typeof option !== "object") return option ?? "";
    return option[column.labelOption || "label"] ?? option.label ?? getOptionValue(column, option) ?? "";
};

const resolveSelectValue = (column, value) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value;
    }

    const options = Array.isArray(column.options) ? column.options : [];
    const found = options.find((option) => String(getOptionValue(column, option)) === String(value));
    if (found) return found;

    if (value === "" || value === null || value === undefined) {
        return null;
    }

    return {
        [column.valueOption || "value"]: value,
        [column.labelOption || "label"]: String(value),
    };
};

const formatModalValue = (column, value) => {
    if (column.type === "select") {
        const option = resolveSelectValue(column, value);
        return option ? getOptionLabel(column, option) : "";
    }

    if (value === null || value === undefined) return "";
    if (typeof value === "boolean") return value ? "Sí" : "No";
    return String(value);
};

const getLabelWithoutAsterisk = (label) => {
    if (typeof label !== "string") return label;

    let end = label.length;
    while (end > 0 && label[end - 1] === "*") {
        end -= 1;
    }

    if (end === label.length) return label;
    return label.slice(0, end).trimEnd();
};

const validarFilaEditable = (fila, columnas = []) => {
    if (!fila) return false;

    const columnasRequeridas = columnas.filter(
        (columna) => columna.editable !== false && (columna.required || columna.label?.includes("*")),
    );

    if (columnasRequeridas.length === 0) return true;

    return columnasRequeridas.every((columna) => {
        const value = fila[columna.id];

        if (value === "" || value === null || value === undefined) return false;

        if (typeof value === "object" && !Array.isArray(value)) {
            const resolvedValue = getOptionValue(columna, value);
            return !(resolvedValue === "" || resolvedValue === null || resolvedValue === undefined);
        }

        if (columna.type === "number") {
            const numberValue = Number(value);
            if (!Number.isFinite(numberValue)) return false;
            if (columna.min !== undefined && numberValue < columna.min) return false;
            if (columna.max !== undefined && numberValue > columna.max) return false;
        }

        return true;
    });
};

const fieldSizeSx = {
    width: "100%",
    minWidth: 0,
    "& .MuiInputBase-root": {
        minHeight: 32,
        display: "flex",
        alignItems: "center",
    },
    "& .MuiInputBase-input": {
        py: 0.3,
    },
    "& .MuiAutocomplete-inputRoot": {
        minHeight: 32,
        alignItems: "center",
    },
    "& .MuiInputLabel-outlined:not(.MuiInputLabel-shrink)": {
        top: "50%",
        transform: "translate(14px, -50%) scale(1)",
    },
};

// Estilo para campos de solo lectura: quita el resaltado de hover pero sin
// pointerEvents: "none", para que el texto se pueda seleccionar y copiar.
const readOnlyTextFieldSx = {
    "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgba(0, 0, 0, 0.23)",
    },
    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgba(0, 0, 0, 0.23)",
        borderWidth: 1,
    },
    "& .MuiInputBase-input.Mui-disabled, & .MuiInputBase-input": {
        cursor: "text",
        WebkitTextFillColor: "unset",
    },
};

const renderCampoDialogo = (column, draft, actualizarCampoDialogo, guardando) => {
    const value = draft?.[column.id];
    const isNumber = column.type === "number";
    const isBoolean = column.type === "boolean" || column.type === "checkbox";
    const isSelect = column.type === "select";
    const isReadOnly = column.editable === false;
    const disabled = guardando;
    const isLocked = isReadOnly || disabled;
    const isRequiredField = column.required || column.label?.includes("*");
    const isValueEmpty = value === "" || value === null || value === undefined
        || (typeof value === "object" && !Array.isArray(value) && (getOptionValue(column, value) === "" || getOptionValue(column, value) === null || getOptionValue(column, value) === undefined));
    const missingRequired = isRequiredField && !isReadOnly && isValueEmpty;

    if (isSelect) {
        const options = Array.isArray(column.options) ? column.options : [];
        const isLoadingOptions = Boolean(column.loading);

        return (
            <Autocomplete
                fullWidth
                options={options}
                loading={isLoadingOptions}
                loadingText="Cargando..."
                noOptionsText={isLoadingOptions ? "Cargando..." : "Sin opciones"}
                value={resolveSelectValue(column, value)}
                onChange={(_, selectedOption) => actualizarCampoDialogo(column.id, selectedOption)}
                isOptionEqualToValue={(option, selectedOption) => String(getOptionValue(column, option)) === String(getOptionValue(column, selectedOption))}
                getOptionLabel={(option) => String(getOptionLabel(column, option) || "")}
                disabled={disabled}
                readOnly={isReadOnly}
                sx={{
                    width: "100%",
                    "& .MuiFormControl-root": {
                        minHeight: 32,
                    },
                    "& .MuiInputBase-root": {
                        minHeight: 32,
                    },
                    "& .MuiAutocomplete-inputRoot": {
                        minHeight: 32,
                        alignItems: "center",
                    },
                    "& .MuiOutlinedInput-root": {
                        minHeight: 32,
                    },
                    ...(isReadOnly && readOnlyTextFieldSx),
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={getLabelWithoutAsterisk(column.label)}
                        fullWidth
                        required={isRequiredField}
                        error={missingRequired}
                        helperText={missingRequired ? "Campo obligatorio" : undefined}
                        size="small"
                        sx={fieldSizeSx}
                        slotProps={{
                            input: {
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {isLoadingOptions && <CircularProgress size={16} />}
                                        {params.InputProps?.endAdornment}
                                    </>
                                ),
                            },
                        }}
                    />
                )}
            />
        );
    }

    if (isBoolean) {
        return (
            <Box
                sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    width: "100%",
                    minHeight: 44,
                    px: 2,
                    py: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                }}
            >
                <Typography variant="body2">{column.label}</Typography>
                {column.type === "checkbox" ? (
                    <Checkbox
                        checked={Boolean(value)}
                        onChange={(event) => actualizarCampoDialogo(column.id, event.target.checked)}
                        disabled={isLocked}
                    />
                ) : (
                    <Switch
                        checked={Boolean(value)}
                        onChange={(event) => actualizarCampoDialogo(column.id, event.target.checked)}
                        disabled={isLocked}
                    />
                )}
            </Box>
        );
    }

    return (
        <TextField
            label={getLabelWithoutAsterisk(column.label)}
            type={isNumber ? "number" : "text"}
            fullWidth
            value={isLocked ? formatModalValue(column, value) : value ?? ""}
            onChange={(event) => actualizarCampoDialogo(column.id, event.target.value)}
            disabled={disabled}
            required={column.editable !== false && isRequiredField}
            error={missingRequired}
            helperText={missingRequired ? "Campo obligatorio" : undefined}
            multiline={column.multiline === true}
            minRows={column.multiline === true ? (column.id === "descripcion" ? 1 : 2) : undefined}
            maxRows={column.multiline === true && column.id === "descripcion" ? 2 : undefined}
            sx={{
                ...fieldSizeSx,
                ...(isReadOnly && readOnlyTextFieldSx),
            }}
            slotProps={{
                input: {
                    readOnly: isReadOnly,
                    min: column.min,
                    max: column.max,
                    step: isNumber ? (column.inputProps?.step ?? column.step ?? "0.01") : undefined,
                    inputMode: isNumber ? "decimal" : undefined,
                },
            }}
        />
    );
};

const dimensionFieldIds = new Set(["largo", "ancho", "alto"]);
const DIMENSION_ORDER = ["largo", "ancho", "alto"];

// Agrupa los campos del modal en secciones temáticas para una lectura más
// clara; el orden de `camposModal` intercala "valor" entre los campos de
// origen/clasificación, así que agrupamos por sección (no por posición).
const SECTION_BY_FIELD_ID = {
    paisOrigenId: "origen",
    descripcion: "descripcionValor",
    tipoEmbalaje: "origen",
    partidaArancelaria: "origen",
    regimenAduanal: "origen",
    valor: "descripcionValor",
    cantidad: "cantidad",
    pesoTotal: "cantidad",
    unidadMedida: "cantidad",
    largo: "dimensiones",
    ancho: "dimensiones",
    alto: "dimensiones",
    volumenTotal: "calculos",
    cw: "calculos",
};

const SECTIONS = [
    { key: "origen", title: "Origen y clasificación", Icon: PublicRoundedIcon },
    { key: "descripcionValor", title: "Descripción y valor", Icon: Inventory2RoundedIcon },
    { key: "cantidad", title: "Cantidad y peso", Icon: PaymentsRoundedIcon },
    { key: "dimensiones", title: "Dimensiones", Icon: StraightenRoundedIcon },
    { key: "calculos", title: "Cálculos automáticos", Icon: CalculateRoundedIcon },
    { key: "otros", title: "Otros datos", Icon: MoreHorizRoundedIcon },
];

const getItemSectionKey = (item) => {
    const firstColumn = item.type === "field" ? item.column : item.columns?.[0];
    return SECTION_BY_FIELD_ID[firstColumn?.id] || "otros";
};

const renderCampoContainer = (column, draft, actualizarCampoDialogo, guardando) => (
    <Box
        key={`dialog_${column.id}`}
        sx={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "stretch",
        }}
    >
        {renderCampoDialogo(column, draft, actualizarCampoDialogo, guardando)}
    </Box>
);

const ModalCargas = ({ open, row, camposModal, onClose, onSave, readOnly = false, unidadesMedida = [] }) => {
    const [draft, setDraft] = useState(row ? { ...row } : null);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        if (open) {
            setDraft(row ? { ...row } : {});
        } else {
            setDraft(null);
        }
    }, [open, row]);

    const actualizarCampoDialogo = (field, value) => {
        setDraft((prev) => aplicarCamposDerivados(prev, field, value, { unidadesMedida }));
    };

    const dialogoValido = validarFilaEditable(draft, camposModal);

    const handleClose = () => {
        if (guardando) return;
        onClose?.();
    };

    const handleSave = async () => {
        if (!draft || !dialogoValido) return;
        setGuardando(true);

        try {
            await Promise.resolve(onSave(draft));
            onClose?.();
        } catch (error) {
            console.error("Error al guardar la carga desde modal:", error);
        } finally {
            setGuardando(false);
        }
    };

    const fieldsWithGroupedDimensions = [];
    let pendingDimensionFields = [];
    const groupedFieldIds = new Set();
    const hasCantidadYPeso = camposModal.some((col) => col.id === "cantidad") && camposModal.some((col) => col.id === "pesoTotal");

    const orderedCamposModal = camposModal;

    const isSkippedInBultosYPesoGroup = (column) => {
        if (!hasCantidadYPeso) return false;
        return column?.id === "pesoTotal" || column?.id === "valor";
    };
    const tryGroupClasificacionOrigen = (column) => {
        if (column?.id !== "paisOrigenId") return false;
        const otrosIds = ["tipoEmbalaje", "partidaArancelaria", "regimenAduanal"];
        const otrasColumnas = otrosIds
            .map((id) => camposModal.find((col) => col.id === id))
            .filter(Boolean);
        if (otrasColumnas.length === 0) return false;

        groupedFieldIds.add("paisOrigenId");
        otrasColumnas.forEach((col) => groupedFieldIds.add(col.id));
        fieldsWithGroupedDimensions.push({ type: "fieldGroup", columns: [column, ...otrasColumnas], fullWidth: true });
        return true;
    };

    const tryGroupBultosYPeso = (column) => {
        if (column?.id !== "cantidad" || !hasCantidadYPeso) return false;
        const pesoColumn = camposModal.find((col) => col.id === "pesoTotal");
        if (!pesoColumn) return false;

        const unidadColumn = camposModal.find((col) => col.id === "unidadMedida");
        const columns = [column, pesoColumn];
        if (unidadColumn) columns.push(unidadColumn);

        groupedFieldIds.add("cantidad");
        groupedFieldIds.add("pesoTotal");
        if (unidadColumn) groupedFieldIds.add("unidadMedida");
        fieldsWithGroupedDimensions.push({ type: "fieldGroup", columns, fullWidth: true });
        return true;
    };

    const tryGroupVolumenYCw = (column) => {
        if (column?.id !== "volumenTotal") return false;
        const cwColumn = camposModal.find((col) => col.id === "cw");
        if (!cwColumn) return false;

        groupedFieldIds.add("volumenTotal");
        groupedFieldIds.add("cw");
        fieldsWithGroupedDimensions.push({ type: "fieldGroup", columns: [column, cwColumn], fullWidth: true });
        return true;
    };

    const tryGroupDescripcionYValor = (column) => {
        if (column?.id !== "descripcion") return false;
        const valorColumn = camposModal.find((col) => col.id === "valor");
        if (!valorColumn) return false;

        groupedFieldIds.add("descripcion");
        groupedFieldIds.add("valor");
        fieldsWithGroupedDimensions.push({ type: "fieldGroup", columns: [column, valorColumn], fullWidth: true });
        return true;
    };

    orderedCamposModal.forEach((column) => {
        if (!column || groupedFieldIds.has(column.id) || isSkippedInBultosYPesoGroup(column)) return;

        if (dimensionFieldIds.has(column.id)) {
            pendingDimensionFields.push(column);
            return;
        }

        if (pendingDimensionFields.length > 0) {
            const sorted = [...pendingDimensionFields].sort(
                (a, b) => DIMENSION_ORDER.indexOf(a.id) - DIMENSION_ORDER.indexOf(b.id),
            );
            fieldsWithGroupedDimensions.push({ type: "dimensiones", columns: sorted });
            pendingDimensionFields = [];
        }

        if (tryGroupClasificacionOrigen(column) || tryGroupDescripcionYValor(column) || tryGroupBultosYPeso(column) || tryGroupVolumenYCw(column)) {
            return;
        }

        fieldsWithGroupedDimensions.push({ type: "field", column });
    });

    if (pendingDimensionFields.length > 0) {
        const sorted = [...pendingDimensionFields].sort(
            (a, b) => DIMENSION_ORDER.indexOf(a.id) - DIMENSION_ORDER.indexOf(b.id),
        );
        fieldsWithGroupedDimensions.push({ type: "dimensiones", columns: sorted });
    }

    const esEdicion = Boolean(draft?.embCargaId);
    const dialogTitle = readOnly ? "Detalle de carga" : esEdicion ? "Editar carga" : "Nueva carga";
    const dialogSubtitle = readOnly
        ? "Información de solo lectura."
        : esEdicion
            ? "Actualice los datos de esta carga y guarde los cambios."
            : "Complete los datos para registrar una nueva carga.";

    const seccionesConCampos = SECTIONS
        .map((seccion) => ({
            ...seccion,
            items: fieldsWithGroupedDimensions.filter((item) => getItemSectionKey(item) === seccion.key),
        }))
        .filter((seccion) => seccion.items.length > 0);

    const renderItem = (item) => {
        if (item.type === "field") {
            const fullWidthField = ["volumenTotal", "cw", "descripcion"].includes(item.column.id);
            return (
                <Box
                    key={`dialog_field_${item.column.id}`}
                    sx={{
                        height: "100%",
                        ...(fullWidthField ? { gridColumn: "1 / -1" } : {}),
                    }}
                >
                    {renderCampoDialogo(item.column, draft, actualizarCampoDialogo, guardando)}
                </Box>
            );
        }

        if (item.type === "fieldGroup") {
            return (
                <Box
                    key={`dialog_fieldgroup_${item.columns.map((col) => col.id).join("_")}`}
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: `repeat(${item.columns.length}, minmax(0, 1fr))` },
                        gap: 2,
                        width: "100%",
                        alignItems: "start",
                        ...(item.fullWidth ? { gridColumn: "1 / -1" } : {}),
                    }}
                >
                    {item.columns.map((column) => renderCampoContainer(column, draft, actualizarCampoDialogo, guardando))}
                </Box>
            );
        }

        return (
            <Box
                key={`dialog_dimensiones_${item.columns.map((col) => col.id).join("_")}`}
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        sm: `repeat(${item.columns.length}, minmax(0, 1fr))`,
                    },
                    gap: 2,
                    width: "100%",
                    gridColumn: "1 / -1",
                }}
            >
                {item.columns.map((column) => renderCampoContainer(column, draft, actualizarCampoDialogo, guardando))}
            </Box>
        );
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            sx={{
                "& .MuiDialog-paper": {
                    width: { xs: "(100vh - 24px)", lg: "min(998px, calc(100% - 32px))" },
                    maxHeight: "(100vh - 24px)¿",
                    borderRadius: 3,
                    overflow: "hidden",
                },
            }}
        >
            <DialogTitle
                sx={{
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    py: 2,
                    px: 3,
                }}
            >
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
                    <Stack direction="row" alignItems="center" gap={1.5}>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                bgcolor: "rgba(255, 255, 255, 0.15)",
                                flexShrink: 0,
                            }}
                        >
                            <Inventory2RoundedIcon fontSize="small" />
                        </Box>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                {dialogTitle}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.85 }}>
                                {dialogSubtitle}
                            </Typography>
                        </Box>
                    </Stack>
                    <IconButton
                        onClick={handleClose}
                        disabled={guardando}
                        size="small"
                        sx={{ color: "inherit" }}
                        aria-label="Cerrar"
                    >
                        <CloseRoundedIcon fontSize="small" />
                    </IconButton>
                </Stack>
            </DialogTitle>
            <DialogContent sx={{ overflowX: "hidden", bgcolor: "background.default", px: { xs: 2, sm: 3 }, py: 3 }}>
                <Stack gap={2.5}>
                    {seccionesConCampos.map(({ key, title, Icon, items }) => (
                        <Box
                            key={`seccion_${key}`}
                            sx={{
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 2,
                                bgcolor: "background.paper",
                                px: { xs: 1.5, sm: 2.5 },
                                py: 2,
                            }}
                        >
                            <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
                                <Icon fontSize="small" sx={{ color: "primary.main" }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main" }}>
                                    {title}
                                </Typography>
                            </Stack>
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" },
                                    gap: 2,
                                    alignItems: "start",
                                }}
                            >
                                {items.map((item) => renderItem(item))}
                            </Box>
                        </Box>
                    ))}
                </Stack>
            </DialogContent>
            <DialogActions
                sx={{
                    px: 3,
                    py: 2,
                    borderTop: "1px solid",
                    borderColor: "divider",
                    justifyContent: "space-between",
                }}
            >
                <Typography variant="caption" color="text.secondary">
                    * Campos obligatorios
                </Typography>
                <Stack direction="row" gap={1}>
                    <Button onClick={handleClose} disabled={guardando} color="inherit">
                        {readOnly ? "Cerrar" : "Cancelar"}
                    </Button>
                    {!readOnly && (
                        <Button
                            onClick={handleSave}
                            disabled={!dialogoValido || guardando}
                            variant="contained"
                            startIcon={guardando ? <CircularProgress size={16} color="inherit" /> : null}
                        >
                            {guardando ? "Guardando..." : "Guardar"}
                        </Button>
                    )}
                </Stack>
            </DialogActions>
        </Dialog>
    );
};

ModalCargas.propTypes = {
    open: PropTypes.bool.isRequired,
    row: PropTypes.object,
    camposModal: PropTypes.arrayOf(PropTypes.object).isRequired,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    readOnly: PropTypes.bool,
};

export default ModalCargas;
