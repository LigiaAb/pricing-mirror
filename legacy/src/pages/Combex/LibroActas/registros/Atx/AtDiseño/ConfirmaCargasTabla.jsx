import { useMemo, useCallback } from "react";
import { Box, Typography, CircularProgress, Alert } from "@mui/material";
import PropTypes from "prop-types";
import EditableDataGridComponent from "../../../../../../components/Tabla/EditableDataGridComponent";
import { useCoordinacionCargas } from "../../../../../../hooks/Bpm";

const ConfirmaCargasTabla = ({ embarque_id, prototipo = true }) => {
    const { data = [], isLoading, error } = useCoordinacionCargas(embarque_id);

    const datos = useMemo(() => {
        if (!Array.isArray(data)) return [];
        return data.map((d) => ({
            ...d,
            confirmado: Boolean(d.confirmado || d.CONFIRMADO),
        }));
    }, [data]);

    const encabezados = useMemo(
        () => [
            { field: "descripcionCarga", headerName: "Descripción", width: 250 },
            { field: "confirmado", headerName: "Confirmar", width: 100, type: "checkbox", editable: true },
        ],
        []
    );

    const handleRowSave = useCallback(async ({ id, row }) => {
        try {
            const payload = {
                emb_carga_id: (row.embCargaId || row.EMB_CARGA_ID || id).toString(),
                embarque_id: (row.embarqueId || row.EMBARQUE_ID).toString(),
                confirmado: Boolean(row.confirmado),
            };

            const original = datos.find((d) => String(d.embCargaId || d.EMB_CARGA_ID || d.id) === String(id));
            const originalConfirmado = original ? Boolean(original.confirmado) : undefined;

            if (prototipo && original && originalConfirmado !== Boolean(row.confirmado)) {
                console.warn("Prototipo: intento de cambio en 'confirmado' (no persistido)", { id, row, payload });
                return;
            }

            // TODO: implementar la llamada real al hook/servicio para persistir el cambio.
            console.log("Actualizar carga (pendiente):", payload);
        } catch (err) {
            console.error("Error actualizando carga:", err);
        }
    }, [prototipo, datos]);

    if (isLoading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                <CircularProgress size={24} />
                <Typography sx={{ ml: 2 }}>Cargando cargas...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ m: 2 }}>
                Error al cargar las cargas: {error.message || "Error desconocido"}
            </Alert>
        );
    }

    return (
        <Box sx={{ width: "100%" }}>
            <Typography variant="h6" gutterBottom>
                Confirmar Cargas
            </Typography>
            {datos.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                    No hay cargas para confirmar
                </Alert>
            ) : (
                <EditableDataGridComponent
                    encabezados={encabezados}
                    datos={datos}
                    idKey="embCargaId"
                    acciones={{ editar: true, guardar: true, eliminar: false }}
                    pageSize={10}
                    onRowSave={handleRowSave}
                />
            )}
        </Box>
    );
};

ConfirmaCargasTabla.propTypes = {
    embarque_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
    prototipo: PropTypes.bool,
};

export default ConfirmaCargasTabla;
