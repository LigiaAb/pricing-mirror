import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Checkbox,
    FormControlLabel,
    FormGroup,
    Typography,
    Divider,
    Box,
    Icon,
    CircularProgress,
} from '@mui/material';

const ORIGINALES = [
    'ORIGINAL 1 (FOR ISSUING CARRIER)',
    'ORIGINAL 2 (FOR CONSIGNEE)',
    'ORIGINAL 3 (FOR SHIPPER)',
];

const COPIAS = [
    'COPY 4 (DELIVERY RECEIPT)',
    'COPY 5 (FOR AIRPORT OF DESTINATION)',
    'COPY 6 (FOR FIRST CARRIER)',
    'COPY 7 (FOR SECOND CARRIER)',
    'COPY 8 (FOR THIRD CARRIER)',
    'COPY 9 (FOR AGENT)',
    'COPY 10',
];

export default function SeleccionarCopiasModal({ open, onClose, onGenerate, isGenerating = false }) {
    const [selected, setSelected] = useState(new Set(ORIGINALES));

    useEffect(() => {
        if (open) {
            setSelected(new Set(ORIGINALES));
        }
    }, [open]);

    const toggle = (label) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(label)) {
                next.delete(label);
            } else {
                next.add(label);
            }
            return next;
        });
    };

    const handleGenerate = () => {
        const ordered = [...ORIGINALES, ...COPIAS].filter((l) => selected.has(l));
        onGenerate(ordered);
    };

    const handleClose = () => {
        if (!isGenerating) onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>
                Descargar PDF
            </DialogTitle>
            <DialogContent dividers>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                    Seleccione las copias a generar.
                </Typography>

                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    Originales
                </Typography>
                <FormGroup sx={{ mb: 2 }}>
                    {ORIGINALES.map((label) => (
                        <FormControlLabel
                            key={label}
                            control={
                                <Checkbox
                                    size="small"
                                    checked={selected.has(label)}
                                    onChange={() => toggle(label)}
                                    disabled={isGenerating}
                                />
                            }
                            label={<Typography variant="body2">{label}</Typography>}
                        />
                    ))}
                </FormGroup>

                <Divider sx={{ mb: 2 }} />

                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    Copias
                </Typography>
                <FormGroup>
                    {COPIAS.map((label) => (
                        <FormControlLabel
                            key={label}
                            control={
                                <Checkbox
                                    size="small"
                                    checked={selected.has(label)}
                                    onChange={() => toggle(label)}
                                    disabled={isGenerating}
                                />
                            }
                            label={<Typography variant="body2">{label}</Typography>}
                        />
                    ))}
                </FormGroup>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button variant="outlined" size="small" onClick={handleClose} disabled={isGenerating}>
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    size="small"
                    onClick={handleGenerate}
                    disabled={selected.size === 0 || isGenerating}
                    startIcon={
                        isGenerating
                            ? <CircularProgress size={16} color="inherit" />
                            : <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                                <Icon className="c-pdf" sx={{ fontSize: '1.1rem' }} />
                            </Box>
                    }
                >
                    {isGenerating ? 'Generando PDF...' : 'Generar PDF'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

SeleccionarCopiasModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onGenerate: PropTypes.func.isRequired,
    isGenerating: PropTypes.bool,
};


