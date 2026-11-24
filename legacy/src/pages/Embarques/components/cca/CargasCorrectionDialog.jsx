import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
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
import { cloneRows, deriveCargaDraft, normalizeDecimalInput, normalizeIntegerInput } from "./utils";
import { DialogTitleWithClose, DisplayValue } from "./shared";

const CargasCorrectionDialog = ({ open, rows, onClose, onAccept }) => {
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

            const nextValue = field === "bultos"
                ? normalizeIntegerInput(rawValue)
                : normalizeDecimalInput(rawValue);

            return deriveCargaDraft({
                ...row,
                [field]: nextValue,
            });
        }));
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitleWithClose
                title="Corrección de cargas"
                subtitle="Edite bultos, dimensiones y peso. Peso volumétrico y CW se recalculan automáticamente."
                onClose={onClose}
            />
            <DialogContent dividers>
                {hasRows ? (
                    <Paper variant="outlined">
                        <TableContainer sx={{ maxHeight: 520 }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ minWidth: 220 }}>Descripción</TableCell>
                                        <TableCell sx={{ minWidth: 110 }}>Bultos</TableCell>
                                        <TableCell sx={{ minWidth: 110 }}>Alto</TableCell>
                                        <TableCell sx={{ minWidth: 110 }}>Ancho</TableCell>
                                        <TableCell sx={{ minWidth: 110 }}>Largo</TableCell>
                                        <TableCell sx={{ minWidth: 120 }}>Peso</TableCell>
                                        <TableCell sx={{ minWidth: 160 }}>Peso volumétrico</TableCell>
                                        <TableCell sx={{ minWidth: 120 }}>CW</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {localRows.map((row) => (
                                        <TableRow key={row.key} hover>
                                            <TableCell>
                                                <Typography variant="body2">{row.descripcion || "-"}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    value={row.bultos}
                                                    onChange={(event) => handleFieldChange(row.key, "bultos", event.target.value)}
                                                    slotProps={{ htmlInput: { min: 0, step: 1 } }}
                                                    fullWidth
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    value={row.alto}
                                                    onChange={(event) => handleFieldChange(row.key, "alto", event.target.value)}
                                                    slotProps={{ htmlInput: { min: 0, step: "0.001" } }}
                                                    fullWidth
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    value={row.ancho}
                                                    onChange={(event) => handleFieldChange(row.key, "ancho", event.target.value)}
                                                    slotProps={{ htmlInput: { min: 0, step: "0.001" } }}
                                                    fullWidth
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    value={row.largo}
                                                    onChange={(event) => handleFieldChange(row.key, "largo", event.target.value)}
                                                    slotProps={{ htmlInput: { min: 0, step: "0.001" } }}
                                                    fullWidth
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    value={row.peso}
                                                    onChange={(event) => handleFieldChange(row.key, "peso", event.target.value)}
                                                    slotProps={{ htmlInput: { min: 0, step: "0.001" } }}
                                                    fullWidth
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <DisplayValue value={row.pesoVolumetrico} />
                                            </TableCell>
                                            <TableCell>
                                                <DisplayValue value={row.cw} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                ) : (
                    <Typography>No hay cargas para editar.</Typography>
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

CargasCorrectionDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    rows: PropTypes.arrayOf(PropTypes.object).isRequired,
    onClose: PropTypes.func.isRequired,
    onAccept: PropTypes.func.isRequired,
};

export default CargasCorrectionDialog;