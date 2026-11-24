import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import { cloneRows, normalizeDecimalInput, PAYMENT_OPTIONS, toNumberOrNull } from "./utils";
import { DialogTitleWithClose } from "./shared";

const GastosCorrectionDialog = ({ open, title, rows, onClose, onAccept }) => {
    const [localRows, setLocalRows] = useState([]);
    const hasRows = localRows.length > 0;

    useEffect(() => {
        if (open) {
            setLocalRows(cloneRows(rows));
        }
    }, [open, rows]);

    const handleFieldChange = (rowKey, field, rawValue) => {
        setLocalRows((currentRows) => currentRows.map((row) => {
            if (row.key !== rowKey) return row;

            if (field === "codTipoPago") {
                return {
                    ...row,
                    codTipoPago: toNumberOrNull(rawValue) ?? "",
                };
            }

            return {
                ...row,
                [field]: normalizeDecimalInput(rawValue),
            };
        }));
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
            <DialogTitleWithClose
                title={title}
                subtitle="Cambios temporales sobre coordinación gastos."
                onClose={onClose}
            />
            <DialogContent dividers>
                {hasRows ? (
                    <Paper variant="outlined">
                        <TableContainer sx={{ maxHeight: 520 }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ minWidth: 240 }}>Rubro / Servicio</TableCell>
                                        <TableCell sx={{ minWidth: 150 }}>Tipo</TableCell>
                                        <TableCell sx={{ minWidth: 140 }}>Rate costo</TableCell>
                                        <TableCell sx={{ minWidth: 140 }}>Costo</TableCell>
                                        <TableCell sx={{ minWidth: 140 }}>Rate venta</TableCell>
                                        <TableCell sx={{ minWidth: 140 }}>Venta</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {localRows.map((row) => (
                                        <TableRow key={row.key} hover>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {row.gruporubroNombre || "Sin rubro"}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {row.servicioSiglas || "Sin siglas"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    select
                                                    size="small"
                                                    value={row.codTipoPago ?? ""}
                                                    onChange={(event) => handleFieldChange(row.key, "codTipoPago", event.target.value)}
                                                    fullWidth
                                                >
                                                    {PAYMENT_OPTIONS.map((option) => (
                                                        <MenuItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    value={row.rateCosto}
                                                    onChange={(event) => handleFieldChange(row.key, "rateCosto", event.target.value)}
                                                    slotProps={{ htmlInput: { min: 0, step: "0.001" } }}
                                                    fullWidth
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    value={row.costoRubro}
                                                    onChange={(event) => handleFieldChange(row.key, "costoRubro", event.target.value)}
                                                    slotProps={{ htmlInput: { min: 0, step: "0.001" } }}
                                                    fullWidth
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    value={row.rateVenta}
                                                    onChange={(event) => handleFieldChange(row.key, "rateVenta", event.target.value)}
                                                    slotProps={{ htmlInput: { min: 0, step: "0.001" } }}
                                                    fullWidth
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    value={row.ventaRubro}
                                                    onChange={(event) => handleFieldChange(row.key, "ventaRubro", event.target.value)}
                                                    slotProps={{ htmlInput: { min: 0, step: "0.001" } }}
                                                    fullWidth
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                ) : (
                    <Typography>No hay gastos para editar.</Typography>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose}>Cancelar</Button>
                <Button variant="contained" onClick={() => onAccept(localRows)} disabled={!hasRows}>
                    Aceptar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

GastosCorrectionDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    title: PropTypes.string.isRequired,
    rows: PropTypes.arrayOf(PropTypes.object).isRequired,
    onClose: PropTypes.func.isRequired,
    onAccept: PropTypes.func.isRequired,
};

export default GastosCorrectionDialog;