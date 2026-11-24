import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Autocomplete, Box, Button, Grid, Skeleton, TextField, Typography } from "@mui/material";
import { useSelector } from "react-redux";

/**
 * FormularioCategorias — formulario reutilizable con diseño idéntico al de FormularioCotizacion.
 *
 * @param {Object}   props
 * @param {"view"|"create"|"edit"|"filter"} props.mode       - Modo del formulario.
 * @param {Array}    props.fields         - Definición de los campos.
 * @param {Array}    props.groups         - Definición de los grupos visuales.
 * @param {Object}   props.defaultValues  - Valores iniciales del formulario.
 * @param {Function} props.onSubmit       - Callback al enviar. Recibe el objeto de valores.
 * @param {Object}   props.buttons        - Sobreescritura de botones: { submit, cancel, filter }
 * @param {boolean}  props.isLoading      - Muestra skeletons en lugar de inputs.
 *
 * Estructura de un field:
 * {
 *   id: string,           — identificador único
 *   label: string,        — texto visible
 *   type: "text"|"number"|"select"|"textarea"|"datetime",
 *   groupId: string,      — id del grupo al que pertenece
 *   size: number,         — columnas MUI (1-12), default 6
 *   required: boolean,
 *   readOnly: boolean,
 *   options: Array,       — [{ value, label }] para type "select"
 *   visible: boolean,
 * }
 *
 * Estructura de un group:
 * {
 *   id: string,
 *   label: string,
 *   size: number,         — columnas MUI (1-12) que ocupa el grupo, default 12
 *   icon: string,         — clase CSS del icono (ej. "c-info")
 *   visible: boolean,
 * }
 */

const BOTONES_BASE = {
    submit: { visible: true, texto: "Agregar", color: "primary", icono: "c-suma", variant: "outlined" },
    cancel: { visible: false, texto: "Cancelar", color: "error", icono: "c-anular", variant: "outlined" },
    filter: { visible: false, texto: "Filtrar", color: "info", icono: "c-lupa", variant: "outlined" },
};

const FormularioCategorias = ({
    mode = "view",
    fields = [],
    groups = [],
    defaultValues = {},
    onSubmit,
    onCancel,
    buttons = {},
    isLoading = false,
    fieldSpacing = 1.5,
}) => {
    const { themeMode } = useSelector((state) => state.theme);

    const [values, setValues] = useState(defaultValues);
    const [attempted, setAttempted] = useState(false);

    // Sincronizar valores cuando los defaultValues cambien desde afuera
    useEffect(() => {
        setValues(defaultValues ?? {});
    }, [defaultValues]);

    const isReadOnly = mode === "view";

    const shadow = useMemo(() => {
        const isFilter = mode === "filter";
        if (themeMode === "dark") {
            return isFilter
                ? "2.5px 10px 10px rgba(190, 190, 190, 0.05)"
                : "2.5px 10px 10px rgba(190, 190, 190, 0.3)";
        }
        return isFilter
            ? "2.5px 10px 10px rgba(0, 2, 48, 0.05)"
            : "2.5px 10px 10px rgba(0, 2, 48, 0.2)";
    }, [themeMode, mode]);

    const readonlyBg = useMemo(
        () => (themeMode === "dark" ? "background.100" : "background.800"),
        [themeMode],
    );

    // ── Cambio de valor de un campo ──────────────────────────────────────────────
    const handleChange = useCallback((fieldId, value) => {
        setValues((prev) => ({ ...prev, [fieldId]: value }));
    }, []);

    // ── Campos requeridos vacíos ─────────────────────────────────────────────────
    const emptyRequired = useMemo(() => {
        if (isReadOnly) return [];
        return fields.filter((f) => {
            if (!f.required || f.visible === false) return false;
            const v = values[f.id];
            return v === null || v === undefined || v === "";
        });
    }, [fields, values, isReadOnly]);

    // ── Submit ───────────────────────────────────────────────────────────────────
    const handleSubmit = useCallback(() => {
        setAttempted(true);
        if (emptyRequired.length > 0) return;
        if (typeof onSubmit === "function") onSubmit(values);
    }, [emptyRequired, onSubmit, values]);

    // ── Botones resueltos según modo ─────────────────────────────────────────────
    const submitTexto = mode === "filter" ? "Filtrar" : mode === "edit" ? "Guardar" : "Agregar";
    const submitIcono = mode === "filter" ? "c-lupa" : mode === "edit" ? "c-guardar" : "c-suma";

    const botonesResueltos = useMemo(() => {
        const base = {
            submit: {
                ...BOTONES_BASE.submit,
                visible: mode !== "view",
                texto: submitTexto,
                icono: submitIcono,
                onClick: handleSubmit,
                ...buttons?.submit,
            },
            cancel: {
                ...BOTONES_BASE.cancel,
                onClick: onCancel,
                ...buttons?.cancel,
            },
            filter: {
                ...BOTONES_BASE.filter,
                onClick: handleSubmit,
                ...buttons?.filter,
            },
        };
        return base;
    }, [mode, handleSubmit, onCancel, buttons]);

    // ── Agrupar fields por groupId ───────────────────────────────────────────────
    const fieldsByGroup = useMemo(() => {
        const map = {};
        fields.forEach((f) => {
            const key = f.groupId ?? "_sin_grupo";
            if (!map[key]) map[key] = [];
            map[key].push(f);
        });
        return map;
    }, [fields]);

    // ── Grupos visibles en orden ─────────────────────────────────────────────────
    const groupsToRender = useMemo(() => {
        return Object.keys(fieldsByGroup)
            .map((id) => groups.find((g) => g.id === id) ?? { id, label: "" })
            .filter((g) => g.visible !== false);
    }, [fieldsByGroup, groups]);

    // ── Renderizar un campo individual ──────────────────────────────────────────
    const renderField = useCallback(
        (field) => {
            const value = values[field.id] ?? null;
            const ro = isReadOnly || field.readOnly === true;
            const hasError = attempted && field.required && (value === null || value === undefined || value === "");
            const labelConAsteriscos = `${field.label}${field.required && !isReadOnly ? " *" : ""}`;

            if (field.type === "select") {
                return (
                    <Autocomplete
                        options={field.options ?? []}
                        value={value}
                        onChange={(_, v) => handleChange(field.id, v)}
                        getOptionLabel={(opt) => opt?.label ?? ""}
                        isOptionEqualToValue={(opt, val) => opt?.value === val?.value}
                        disabled={ro}
                        size="small"
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={labelConAsteriscos}
                                size="small"
                                error={hasError}
                                helperText={hasError ? "Campo requerido" : ""}
                                disabled={ro}
                            />
                        )}
                    />
                );
            }

            return (
                <TextField
                    label={labelConAsteriscos}
                    value={value ?? ""}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    type={field.type === "number" ? "number" : "text"}
                    multiline={field.type === "textarea"}
                    rows={field.type === "textarea" ? 3 : undefined}
                    size="small"
                    fullWidth
                    disabled={ro}
                    error={hasError}
                    helperText={hasError ? "Campo requerido" : ""}
                    sx={{ bgcolor: ro ? readonlyBg : "transparent" }}
                />
            );
        },
        [values, isReadOnly, attempted, handleChange, readonlyBg],
    );

    const hayRequeridos = fields.some((f) => f.required && !isReadOnly);

    return (
        <Box sx={{ m: 0, p: 0.5 }} borderRadius={2}>
            <form
                noValidate
                autoComplete="off"
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
            >
                <Grid container padding={0} rowSpacing={0}>
                    {/* Nota de campos requeridos */}
                    {hayRequeridos && (
                        <Grid item xs={12}>
                            <Grid container justifyContent="flex-end">
                                <Typography variant="caption">
                                    Los campos con <b>*</b> son <b>requeridos</b>.
                                </Typography>
                            </Grid>
                        </Grid>
                    )}

                    {/* Grupos */}
                    <Grid item xs={12} container columnSpacing={0} justifyContent="flex-start">
                        {groupsToRender.map((group) => {
                            const groupFields = fieldsByGroup[group.id] ?? [];

                            return (
                                <Grid
                                    key={group.id}
                                    item
                                    xs={12}
                                    md={group.size ?? 12}
                                    container
                                    justifyContent="flex-start"
                                    borderRadius={1}
                                    my={0.5}
                                    px={0.5}
                                    pt={0.5}
                                    pb={1}
                                    sx={{ boxShadow: shadow }}
                                >
                                    {/* Título del grupo */}
                                    {group.label && (
                                        <Grid
                                            item
                                            xs={12}
                                            container
                                            justifyContent="center"
                                            alignItems="center"
                                            direction="column"
                                            overflow="hidden"
                                            py={mode === "filter" ? 0 : 0.5}
                                        >
                                            {group.icon && (
                                                <Typography
                                                    variant="h4"
                                                    sx={{ color: "primary.main", pb: 0.5 }}
                                                    className={group.icon}
                                                />
                                            )}
                                            <Typography component="span" variant="h4" align="center">
                                                {group.label}
                                            </Typography>
                                        </Grid>
                                    )}

                                    {/* Campos del grupo */}
                                    <Grid
                                        item
                                        xs={12}
                                        container
                                        columnSpacing={0}
                                        rowSpacing={isLoading ? 0.5 : fieldSpacing}
                                        justifyContent="flex-start"
                                        alignItems="stretch"
                                        px={0}
                                        mt={group.label ? 0.5 : 0}
                                    >
                                        {groupFields.map((field) => (
                                            <Grid
                                                item
                                                key={field.id}
                                                xs={12}
                                                md={field.size ?? 6}
                                                sx={{
                                                    m: 0,
                                                    px: 0,
                                                    ...(field.visible === false ? { display: "none" } : {}),
                                                }}
                                            >
                                                <Box>
                                                    {isLoading ? (
                                                        <Skeleton variant="rectangular" width="100%" height={38} />
                                                    ) : (
                                                        renderField(field)
                                                    )}
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Grid>
                            );
                        })}
                    </Grid>

                    {/* Botones */}
                    {fields.length > 0 && (
                        <Grid item xs={12} mt={0.5} zIndex={0}>
                            <Grid container direction="row" columnSpacing={0.5}>
                                <Grid item xs />
                                {Object.entries(botonesResueltos)
                                    .filter(([, btn]) => btn.visible)
                                    .map(([key, btn]) => (
                                        <Grid key={key} item xs="auto">
                                            <Button
                                                size="small"
                                                type={key === "submit" ? "submit" : "button"}
                                                variant={btn.variant ?? "outlined"}
                                                color={btn.color ?? "primary"}
                                                disabled={btn.disabled}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    btn.onClick?.();
                                                }}
                                                sx={{
                                                    "&.MuiButton-root":
                                                        !btn.variant || btn.variant === "outlined"
                                                            ? { backgroundColor: "#FFF !important" }
                                                            : {},
                                                }}
                                            >
                                                {btn.icono && (
                                                    <Typography
                                                        component="span"
                                                        className={btn.icono}
                                                        sx={{ mr: btn.texto ? 0.5 : 0 }}
                                                    />
                                                )}
                                                <Typography component="span">{btn.texto}</Typography>
                                            </Button>
                                        </Grid>
                                    ))}
                            </Grid>
                        </Grid>
                    )}
                </Grid>
            </form>
        </Box>
    );
};

FormularioCategorias.propTypes = {
    mode: PropTypes.oneOf(["view", "create", "edit", "filter"]),
    fields: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            type: PropTypes.oneOf(["text", "number", "select", "textarea", "datetime"]),
            groupId: PropTypes.string,
            size: PropTypes.number,
            required: PropTypes.bool,
            readOnly: PropTypes.bool,
            options: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.any, label: PropTypes.string })),
            visible: PropTypes.bool,
        }),
    ),
    groups: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            label: PropTypes.string,
            size: PropTypes.number,
            icon: PropTypes.string,
            visible: PropTypes.bool,
        }),
    ),
    defaultValues: PropTypes.object,
    onSubmit: PropTypes.func,
    onCancel: PropTypes.func,
    buttons: PropTypes.shape({
        submit: PropTypes.object,
        cancel: PropTypes.object,
        filter: PropTypes.object,
    }),
    isLoading: PropTypes.bool,
    fieldSpacing: PropTypes.number,
};

export default FormularioCategorias;
