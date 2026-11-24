import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { Typography, IconButton, Box } from "@mui/material";
import { Loader2 } from "lucide-react";
import { useDispatch, useStore } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useAssignCorrelativoGuiaXCriterio, useUpdateCoordinacionEstado } from "../../../hooks/Bpm";
import ActionAlertComponent from "../../../components/Dialog/ActionAlertComponent";
import { useCommitPendingChanges } from "./useCommitPendingChanges";
import { quitarAnuncios } from "../../../store/slices/anuncios/anunciosSlice";

const getFirst = (source, keys, fallback = "") => {
    for (const key of keys) {
        const value = source?.[key];
        if (value !== undefined && value !== null && value !== "") {
            return value;
        }
    }
    return fallback;
};

// id_servicio = 10 es "Consolidado": solo para ese servicio se asigna guía
// (asignar-correlativo-guia-x-criterio) al crear la coordinación; ese
// endpoint además avanza el estado de la coordinación como efecto en
// backend. Para el resto de servicios se aplican igual todos los cambios
// pendientes, pero sin guía, así que el avance de estado (a "creada" = 40) se
// hace explícito acá vía actualizar-coordinacion-estado.
const ID_SERVICIO_CONSOLIDADO = 10;
const ESTADO_COORDINACION_CREADA = 40;

const CrearCoordinacionModal = ({ open, onClose, onSuccess, embarqueData, embarqueId, idServicio, commitContext }) => {
    const [successData, setSuccessData] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const codFile = getFirst(embarqueData, ["cod_file", "COD_FILE", "codFile"], "");
    const esConsolidado = Number(idServicio) === ID_SERVICIO_CONSOLIDADO;
    const { mutateAsync: assignCorrelativo } = useAssignCorrelativoGuiaXCriterio();
    const { mutateAsync: updateCoordinacionEstado } = useUpdateCoordinacionEstado();
    const { commitPendingChanges } = useCommitPendingChanges(commitContext);
    const dispatch = useDispatch();
    const store = useStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (open) {
            setSuccessData(null);
            setErrorMsg("");
            setIsSubmitting(false);
        }
    }, [open]);

    // "Crear Coordinación" dispara varios POST seguidos (commitPendingChanges
    // aplica cambios por sección y luego assignCorrelativo asigna la guía). Cada
    // respuesta exitosa encola un anuncio en el slice `anuncios` y
    // `AnuncioComponent` lo renderiza como modal global
    // "Se ha realizado correctamente la accion", apilándose uno por cada POST.
    // Para que sólo se vea el modal propio de este componente (con la guía
    // asignada), mientras se está creando la coordinación se suscribe al store
    // y se retira (quitarAnuncios) cualquier anuncio de éxito/info que entre
    // durante ese lapso, antes de que alcance a renderizarse. Los errores
    // (`type === "error"` o `errorToken`) no se ven afectados.
    const suprimirAnunciosExito = useCallback(() => {
        const { anuncios } = store.getState().anuncios;
        anuncios
            .filter((a) => a.open && a.type !== "error" && !a.errorToken)
            .forEach((a) => dispatch(quitarAnuncios({ key: a.key })));
    }, [store, dispatch]);

    const handleCrear = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setErrorMsg("");
        const unsubscribe = store.subscribe(suprimirAnunciosExito);
        try {
            await commitPendingChanges();

            let guiaAsignada;
            if (esConsolidado) {
                if (!codFile) {
                    throw new Error("No se encontró el código de file (cod_file) en el embarque.");
                }

                const payload = {
                    embarque_id: Number(embarqueId),
                    cod_file: codFile,
                };

                const response = await assignCorrelativo(payload);

                guiaAsignada = {
                    guia: response?.data?.guia_asignada || response?.guia_coordinacion || response?.guia_asignada || "Asignada",
                    file: response?.data?.cod_file || response?.cod_file || codFile,
                };
            } else {
                const estadoActual = getFirst(embarqueData, ["estadoId", "estado_id", "ESTADO_ID"], null);
                await updateCoordinacionEstado({
                    embarque_id: Number(embarqueId),
                    cod_file: codFile,
                    cod_estado_actual: estadoActual,
                    cod_estado_siguiente: ESTADO_COORDINACION_CREADA,
                });
                guiaAsignada = { guia: null, file: codFile };
            }

            setSuccessData(guiaAsignada);
            onSuccess?.();
            navigate("/embarques/embarques/cts", { state: { guiaAsignada } });
        } catch (error) {
            const message = error?.message || "Ocurrió un error al aplicar los cambios pendientes o al asignar el correlativo.";
            if (String(message).toLowerCase().includes("sin seguimiento")) {
                console.warn("Ignorando validación de seguimiento para crear coordinación CTS:", message);
                const guiaAsignada = {
                    guia: "No aplica (sin seguimiento)",
                    file: codFile,
                };
                setSuccessData(guiaAsignada);
                onSuccess?.();
                navigate("/embarques/embarques/cts", { state: { guiaAsignada } });
                return;
            }
            setErrorMsg(message);
        } finally {
            unsubscribe();
            setIsSubmitting(false);
        }
    };

    let alertTipo = "info";
    if (successData) {
        alertTipo = "success";
    } else if (errorMsg) {
        alertTipo = "error";
    }

    let alertContent;
    if (isSubmitting) {
        alertContent = (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, py: 2 }}>
                <Box
                    sx={{
                        display: "inline-flex",
                        color: "primary.main",
                        animation: "cts-spin 0.9s linear infinite",
                        "@keyframes cts-spin": {
                            "0%": { transform: "rotate(0deg)" },
                            "100%": { transform: "rotate(360deg)" },
                        },
                    }}
                >
                    <Loader2 size={48} strokeWidth={2} />
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Creando coordinación...
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
                    {esConsolidado
                        ? "Aplicando cambios pendientes y asignando la guía. Esto puede tardar unos segundos."
                        : "Aplicando cambios pendientes. Esto puede tardar unos segundos."}
                </Typography>
            </Box>
        );
    } else if (alertTipo === "info") {
        alertContent = esConsolidado
            ? "Se aplicarán los cambios pendientes de cada sección y se asignará la guía House para crear el embarque."
            : "Se aplicarán los cambios pendientes de cada sección para crear la coordinación.";
    } else if (alertTipo === "success" && successData) {
        alertContent = successData.guia ? (
            <>
                {/* success message should match the guía size */}
                <Typography variant="h6" sx={{ fontWeight: "bold", mt: 1, fontSize: "1.875rem" }}>
                    Guia asignada con exito.
                </Typography>
                <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", mt: 1, fontSize: "1.875rem", display: 'flex', alignItems: 'center' }}
                >
                    Guía: {successData.guia}
                    <IconButton
                        size="medium"
                        sx={{ ml: 1 }}
                        onClick={() => navigator.clipboard.writeText(successData.guia)}
                        title="Copiar"
                    >
                        <Typography className="c-copiar" sx={{ fontSize: '1.875rem' }} />
                    </IconButton>
                </Typography>
            </>
        ) : (
            <Typography variant="h6" sx={{ fontWeight: "bold", mt: 1, fontSize: "1.875rem" }}>
                Coordinación creada con éxito.
            </Typography>
        );
    } else {
        alertContent = errorMsg || "Ocurrió un error al asignar el correlativo.";
    }

    const onConfirm = () => {
        if (isSubmitting) return;
        if (alertTipo === "info") {
            handleCrear();
        } else {
            onClose();
        }
    };

    const onCancel = alertTipo === "info" && !isSubmitting ? onClose : undefined;

    const confirmText = alertTipo === "info" ? (isSubmitting ? "Creando..." : "Crear Coordinación") : "Cerrar";

    return (
        <ActionAlertComponent
            openDialog={open}
            tipo={alertTipo}
            content={alertContent}
            onConfirm={onConfirm}
            onCancel={onCancel}
            activarCanecelar={alertTipo === "info" && !isSubmitting}
            textoConfirmar={confirmText}
            width="400px"
        />
    );
};

CrearCoordinacionModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func,
    embarqueData: PropTypes.object,
    embarqueId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    idServicio: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    commitContext: PropTypes.object,
};

export default CrearCoordinacionModal;
