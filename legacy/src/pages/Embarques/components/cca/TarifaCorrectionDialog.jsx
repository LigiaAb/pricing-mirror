import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { cloneRows, getPaymentLabel, normalizeDecimalInput, PAYMENT_OPTIONS, toNumberOrNull } from "./utils";
import { DialogTitleWithClose } from "./shared";

const TarifaCorrectionDialog = ({ open, rows, onClose, onAccept }) => {
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
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitleWithClose
                title="Tarifa"
                subtitle="Cambios temporales sobre coordinación gastos."
                onClose={onClose}
            />
            <DialogContent dividers>
                {hasRows ? (
                    <Stack spacing={2}>
                        {localRows.map((row) => (
                            <Paper key={row.key} variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="subtitle1" fontWeight={600}>
                                    {row.gruporubroNombre || "Tarifa"}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {[row.servicioSiglas || "Sin siglas", getPaymentLabel(row.codTipoPago)].join(" - ")}
                                </Typography>
                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 2 }}>
                                    <TextField
                                        select
                                        label="Tipo de pago"
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
                                    <TextField
                                        label="Rate costo"
                                        size="small"
                                        type="number"
                                        value={row.rateCosto}
                                        onChange={(event) => handleFieldChange(row.key, "rateCosto", event.target.value)}
                                        slotProps={{ htmlInput: { min: 0, step: "0.001" } }}
                                        fullWidth
                                    />
                                    <TextField
                                        label="Rate venta"
                                        size="small"
                                        type="number"
                                        value={row.rateVenta}
                                        onChange={(event) => handleFieldChange(row.key, "rateVenta", event.target.value)}
                                        slotProps={{ htmlInput: { min: 0, step: "0.001" } }}
                                        fullWidth
                                    />
                                </Box>
                            </Paper>
                        ))}
                    </Stack>
                ) : (
                    <Typography>No hay tarifas para editar.</Typography>
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

TarifaCorrectionDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    rows: PropTypes.arrayOf(PropTypes.object).isRequired,
    onClose: PropTypes.func.isRequired,
    onAccept: PropTypes.func.isRequired,
};

export default TarifaCorrectionDialog;