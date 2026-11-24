import PropTypes from "prop-types";
import { Box, Typography, Paper, Chip, CircularProgress, Dialog, DialogTitle, DialogContent, IconButton, Icon } from "@mui/material";
import EditableDataGridComponent from "../../../components/Tabla/EditableDataGridComponent";
import { useFetchDetalleCorrelativoGuias } from "../../../hooks/Bpm";

const columnas = [
    { field: "correlativoGuia", headerName: "Número de Guía", width: 180 },
    {
        field: "estadoDescripcion",
        headerName: "Estado",
        width: 150,
        renderCell: ({ value }) => {
            const estado = String(value || "").toUpperCase();
            let color = "default";
            if (estado.includes("ACTIVO") || estado.includes("DISPONIBLE")) color = "success";
            else if (estado.includes("USADO") || estado.includes("ASIGNADO")) color = "info";
            else if (estado.includes("ANULADO") || estado.includes("INACTIVO")) color = "error";
            return <Chip label={value || "—"} color={color} size="small" variant="outlined" />;
        },
    },
    { field: "fechaRegistro", headerName: "Fecha Registro", width: 160 },
];

const DetallesCorrelativos = ({ correlativoId, titulo = "Detalle de Correlativos", onClose, open = false }) => {
    const { data: detalles = [], isLoading, isError } = useFetchDetalleCorrelativoGuias(
        { correlativo_id: correlativoId },
        { enabled: !!correlativoId }
    );

    const datos = detalles.map((item, idx) => ({
        ...item,
        id: item.detCorrelativoGuiaId ?? idx,
    }));

    if (!correlativoId) {
        return (
            <Box sx={{ p: 2, textAlign: "center" }}>
                <Typography color="text.secondary">Seleccione un correlativo para ver sus detalles</Typography>
            </Box>
        );
    }

    const renderContent = () => {
        if (isLoading) {
            return (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 150 }}>
                    <CircularProgress size={40} />
                </Box>
            );
        }

        if (isError) {
            return (
                <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography color="error">Error al cargar los detalles</Typography>
                </Box>
            );
        }

        if (datos.length === 0) {
            return (
                <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography color="text.secondary">No hay números de guía registrados para este correlativo</Typography>
                </Box>
            );
        }

        return (
            <EditableDataGridComponent
                idKey="id"
                encabezados={columnas}
                datos={datos}
                acciones={{ ver: false, editar: false, eliminar: false, copiar: false, pegar: false, guardar: false, agregar: false }}
                botones={{}}
            />
        );
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {titulo}
                <IconButton onClick={onClose} size="small">
                    <Icon className="c-x1"> </Icon>
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Box sx={{ p: 2 }}>
                    <Paper variant="outlined" sx={{ p: 2, position: "relative", minHeight: 200 }}>
                        {renderContent()}
                    </Paper>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

DetallesCorrelativos.propTypes = {
    correlativoId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    titulo: PropTypes.string,
    onClose: PropTypes.func,
    open: PropTypes.bool,
};

export default DetallesCorrelativos;
