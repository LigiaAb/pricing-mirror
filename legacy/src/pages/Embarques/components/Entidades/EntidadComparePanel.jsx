import React, { useState } from "react";
import PropTypes from "prop-types";
import { Box, Typography, Button, Stack, Collapse, Paper } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import UndoIcon from "@mui/icons-material/Undo";
import HistoryIcon from "@mui/icons-material/History";
import ApartmentIcon from "@mui/icons-material/Apartment";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

/**
 * Panel de comparación entre lo que el cliente envió en la carta pública
 * y los datos actuales del formulario (DB).
 *
 * Soporta dos escenarios:
 *  - El cliente eligió una entidad distinta: botón "Aceptar entidad".
 *  - El cliente modificó campos de la entidad actual: "Aceptar" por campo.
 *
 * Cuando las filas traen `section` (p.ej. "Información", "Dirección",
 * "Contacto", "Identificación") los campos modificados se agrupan bajo esa
 * sección, igual que las secciones del formulario. Si no traen `section` se
 * listan sin agrupar (compatibilidad con Facturación/Notificaciones).
 */
const renderValor = (valor) => (valor === undefined || valor === null || valor === ""
    ? "—"
    : Array.isArray(valor) ? (valor.length > 0 ? valor.join(", ") : "—") : String(valor));

const SIN_SECCION = "__sin_seccion__";

const groupRowsBySection = (rows) => {
    const groups = new Map();
    rows.forEach((row) => {
        const key = row.section || SIN_SECCION;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(row);
    });
    return Array.from(groups.entries()).map(([section, sectionRows]) => ({ section, sectionRows }));
};

const ValueChip = ({ children, tone = "old", strike = false }) => (
    <Box
        component="span"
        sx={{
            display: "inline-block",
            maxWidth: "100%",
            px: 1,
            py: 0.25,
            borderRadius: 1.5,
            fontSize: "0.75rem",
            lineHeight: 1.6,
            wordBreak: "break-word",
            fontWeight: tone === "new" ? 600 : 500,
            color: tone === "new" ? "info.main" : "text.secondary",
            bgcolor: tone === "new" ? "info.main_10" : "action.hover",
            border: "1px solid",
            borderColor: tone === "new" ? "info.main_20" : "divider",
            textDecoration: strike ? "line-through" : "none",
        }}
    >
        {children}
    </Box>
);

ValueChip.propTypes = {
    children: PropTypes.node,
    tone: PropTypes.oneOf(["old", "new"]),
    strike: PropTypes.bool,
};

const CampoModificado = ({ row, readOnly, onAcceptField, onUndoField }) => {
    const aplicado = row.iguales && !row.puedeDeshacer;

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, py: 1 }}>
            <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.4 }}
            >
                {row.label}
            </Typography>

            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                <ValueChip tone="old" strike={row.iguales}>{renderValor(row.currentLabel ?? row.currentValue)}</ValueChip>
                <ArrowRightAltIcon fontSize="small" sx={{ color: "text.disabled", flexShrink: 0 }} />
                <ValueChip tone="new">{renderValor(row.clienteLabel ?? row.clienteValue)}</ValueChip>
            </Stack>

            {!readOnly && !aplicado && (
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                        <Button
                            size="small"
                            variant="outlined"
                            color="inherit"
                            disabled={!row.puedeDeshacer}
                            startIcon={<UndoIcon fontSize="small" />}
                            onClick={() => onUndoField(row.configKey)}
                            sx={{ borderRadius: 999, textTransform: "none" }}
                        >
                            Deshacer
                        </Button>
                        <Button
                            size="small"
                            variant="contained"
                            disableElevation
                            startIcon={<CheckIcon fontSize="small" />}
                            onClick={() => onAcceptField(row.configKey, row.clienteValue)}
                            sx={{ borderRadius: 999, textTransform: "none" }}
                        >
                            Aceptar
                        </Button>
                    </Stack>
                </Box>
            )}
        </Box>
    );
};

CampoModificado.propTypes = {
    row: PropTypes.shape({
        label: PropTypes.string,
        configKey: PropTypes.string,
        clienteValue: PropTypes.any,
        clienteLabel: PropTypes.any,
        currentValue: PropTypes.any,
        currentLabel: PropTypes.any,
        iguales: PropTypes.bool,
        puedeDeshacer: PropTypes.bool,
    }).isRequired,
    readOnly: PropTypes.bool,
    onAcceptField: PropTypes.func,
    onUndoField: PropTypes.func,
};

const EntidadComparePanel = ({
    titulo = "",
    showEntity = true,
    clienteEntityNombre = "",
    differsEntity = false,
    isRelated = false,
    relating = false,
    readOnly = false,
    onAcceptEntity = null,
    rows = [],
    onAcceptField = null,
    onAcceptAllFields = null,
    onUndoField = null,
    onUndoAllFields = null,
}) => {
    const [collapsedSections, setCollapsedSections] = useState(() => new Set());

    const toggleSection = (key) => setCollapsedSections((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
    });

    const isDifferent = (row) => String(row.currentValue ?? "") !== String(row.clienteValue ?? "");
    const camposModificados = rows.filter(
        (row) => readOnly
            ? (row.modificado || isDifferent(row))
            : (row.modificado || isDifferent(row)) && (!row.iguales || row.puedeDeshacer),
    );
    const hayCamposPorAceptar = camposModificados.some((row) => !row.iguales && !row.puedeDeshacer);
    const hayCamposPorDeshacer = camposModificados.some((row) => row.puedeDeshacer);
    const countPendientes = camposModificados.filter((row) => !row.iguales).length;
    const grupos = groupRowsBySection(camposModificados);

    const tieneContenido = (showEntity && clienteEntityNombre) || camposModificados.length > 0;

    if (!tieneContenido) return null;

    return (
        <Paper
            variant="outlined"
            sx={{
                mb: 0,
                borderRadius: 3,
                overflow: "hidden",
                borderColor: "divider",
            }}
        >
            <Box
                sx={(theme) => ({
                    height: 3,
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                })}
            />

            <Box sx={{ p: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1.25 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                        <Box
                            sx={{
                                width: 30,
                                height: 30,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: "primary.main_10",
                                color: "primary.main",
                                flexShrink: 0,
                            }}
                        >
                            <HistoryIcon fontSize="small" />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                Historial de cambios
                            </Typography>
                            {titulo && (
                                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                                    {titulo}
                                </Typography>
                            )}
                        </Box>
                    </Box>

                </Box>

                {showEntity && clienteEntityNombre && (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1,
                            flexWrap: "wrap",
                            p: 1,
                            mb: camposModificados.length > 0 ? 1.5 : 0,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: differsEntity ? (isRelated ? "info.main_20" : "warning.main_20") : "divider",
                            bgcolor: differsEntity ? (isRelated ? "info.main_10" : "warning.main_10") : "action.hover",
                        }}
                    >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", minWidth: 0 }}>
                            <ApartmentIcon fontSize="small" sx={{ color: "text.secondary", flexShrink: 0 }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {renderValor(clienteEntityNombre)}
                            </Typography>
                        </Box>
                        {differsEntity && (
                            <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                disabled={relating}
                                startIcon={<CheckIcon fontSize="small" />}
                                onClick={onAcceptEntity}
                                sx={{ borderRadius: 999, textTransform: "none" }}
                            >
                                {relating ? "Aplicando..." : "Aceptar entidad"}
                            </Button>
                        )}
                    </Box>
                )}

                {camposModificados.length > 0 && (
                    <>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                Cambios propuestos por el cliente
                            </Typography>
                            {!readOnly && (
                                <Stack direction="row" spacing={0.75}>
                                    <Button
                                        size="small"
                                        variant="text"
                                        color="inherit"
                                        disabled={!hayCamposPorDeshacer}
                                        onClick={onUndoAllFields}
                                        sx={{ borderRadius: 999, textTransform: "none" }}
                                    >
                                        Deshacer todo
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        disabled={!hayCamposPorAceptar}
                                        onClick={onAcceptAllFields}
                                        sx={{ borderRadius: 999, textTransform: "none" }}
                                    >
                                        Aceptar todo
                                    </Button>
                                </Stack>
                            )}
                        </Box>

                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            {grupos.map(({ section, sectionRows }) => {
                                const isCollapsed = collapsedSections.has(section);
                                return (
                                    <Box
                                        key={section}
                                        sx={{
                                            border: "1px solid",
                                            borderColor: "divider",
                                            borderRadius: 2,
                                            overflow: "hidden",
                                            bgcolor: "background.paper",
                                        }}
                                    >
                                        {section !== SIN_SECCION && (
                                            <Box
                                                onClick={() => toggleSection(section)}
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    px: 1.25,
                                                    py: 0.75,
                                                    cursor: "pointer",
                                                    bgcolor: "action.hover",
                                                    userSelect: "none",
                                                    "&:hover": { bgcolor: "action.selected" },
                                                }}
                                            >
                                                <Typography
                                                    variant="caption"
                                                    sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.4 }}
                                                >
                                                    {section}
                                                </Typography>
                                                <ExpandMoreIcon
                                                    fontSize="small"
                                                    sx={{
                                                        color: "text.secondary",
                                                        transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                                                        transition: "transform 0.15s ease",
                                                    }}
                                                />
                                            </Box>
                                        )}
                                        <Collapse in={!isCollapsed}>
                                            <Box sx={{ px: 1.25 }}>
                                                {sectionRows.map((row, idx) => (
                                                    <Box
                                                        key={row.configKey}
                                                        sx={{
                                                            borderBottom: idx < sectionRows.length - 1 ? "1px solid" : "none",
                                                            borderColor: "divider",
                                                        }}
                                                    >
                                                        <CampoModificado
                                                            row={row}
                                                            readOnly={readOnly}
                                                            onAcceptField={onAcceptField}
                                                            onUndoField={onUndoField}
                                                        />
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Collapse>
                                    </Box>
                                );
                            })}
                        </Box>
                    </>
                )}
            </Box>
        </Paper>
    );
};

EntidadComparePanel.propTypes = {
    titulo: PropTypes.string,
    showEntity: PropTypes.bool,
    clienteEntityNombre: PropTypes.string,
    differsEntity: PropTypes.bool,
    isRelated: PropTypes.bool,
    relating: PropTypes.bool,
    readOnly: PropTypes.bool,
    onAcceptEntity: PropTypes.func,
    rows: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string,
            configKey: PropTypes.string,
            section: PropTypes.string,
            clienteValue: PropTypes.any,
            currentValue: PropTypes.any,
            modificado: PropTypes.bool,
            iguales: PropTypes.bool,
            puedeDeshacer: PropTypes.bool,
        }),
    ),
    onAcceptField: PropTypes.func,
    onAcceptAllFields: PropTypes.func,
    onUndoField: PropTypes.func,
    onUndoAllFields: PropTypes.func,
};

export default EntidadComparePanel;
