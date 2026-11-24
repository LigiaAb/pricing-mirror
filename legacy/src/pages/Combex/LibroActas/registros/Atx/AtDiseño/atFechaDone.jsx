import { Box, Typography, Icon, Divider, Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useMemo } from "react";
import PropTypes from "prop-types";

const getProperty = (obj, prop) => {
    if (!obj) return null;
    return obj[prop] || obj[prop.toUpperCase()] || obj[prop.toLowerCase()] || null;
};

const formatFecha = (fechaRaw) => {
    if (!fechaRaw) return "Fecha no disponible";

    const fechaValue = new Date(fechaRaw);
    if (Number.isNaN(fechaValue.getTime())) return "Fecha no disponible";

    return fechaValue.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const AtFechaDone = ({
    fechaRegistrada,
    titulo,
    nomenclatura,
    headerHint,
    onEdit,
    onDelete,
    showActions,
    showEdit,
    showDelete,
}) => {
    const theme = useTheme();

    // Permitir control individual de botones pero mantener compatibilidad con showActions
    const finalShowEdit = typeof showEdit === 'boolean' ? showEdit : showActions;
    const finalShowDelete = typeof showDelete === 'boolean' ? showDelete : showActions;

    const fechaFormateada = useMemo(
        () => formatFecha(getProperty(fechaRegistrada, "fecha")),
        [fechaRegistrada]
    );

    const observaciones = useMemo(
        () => getProperty(fechaRegistrada, "observacion") || "Sin observaciones",
        [fechaRegistrada]
    );

    const label = useMemo(() => {
        const parts = [nomenclatura || titulo];
        if (headerHint) parts.push(headerHint);
        return parts.join(" - ") + " Registrado";
    }, [nomenclatura, titulo, headerHint]);

    const tieneObservacion = useMemo(
        () => !!getProperty(fechaRegistrada, "observacion"),
        [fechaRegistrada]
    );

    const titleColor = theme.palette.mode === "dark"
        ? theme.palette.text.primary
        : theme.palette.primary.main;

    if (!fechaRegistrada) return null;

    return (
        <Box mb={2}>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                }}
            >
                <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{
                        color: titleColor,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                    }}
                >
                    <Icon
                        className="c-circulo-cheque"
                        sx={{ fontSize: 24, color: "success.main" }}
                    />
                    {label}
                </Typography>
            </Box>

            <Divider sx={{ mb: 2.5 }} />

            <Box
                sx={{
                    bgcolor: "background.default",
                    borderRadius: 2,
                    p: 2.5,
                    mb: 2.5,
                }}
            >
                <Box sx={{ mb: 2 }}>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 0.75,
                        }}
                    >
                        <Icon
                            className="c-calendario1"
                            sx={{ fontSize: 18, color: "info.main" }}
                        />
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                            sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
                        >
                            Fecha Registrada
                        </Typography>
                    </Box>
                    <Typography
                        variant="body1"
                        color="text.primary"
                        sx={{ pl: 3.5 }}
                    >
                        {fechaFormateada}
                    </Typography>
                </Box>

                {observaciones && (
                    <Box>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 0.75,
                            }}
                        >
                            <Icon className="c-documento" sx={{ fontSize: 18, color: "info.main" }} />
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={600}
                                sx={{
                                    textTransform: "uppercase",
                                    letterSpacing: 0.5,
                                }}
                            >
                                Observaciones
                            </Typography>
                        </Box>
                        <Typography
                            variant="body2"
                            color="text.primary"
                            sx={{
                                pl: 3.5,
                                fontStyle: tieneObservacion ? "normal" : "italic",
                            }}
                        >
                            {observaciones}
                        </Typography>
                    </Box>
                )}
            </Box>

            {(finalShowEdit || finalShowDelete) && (
                <Box
                    sx={{
                        display: "flex",
                        gap: 1,
                        justifyContent: "flex-end",
                    }}
                >
                    {finalShowEdit && (
                        <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<Icon className="c-lapiz" sx={{ fontSize: 16 }} />}
                            onClick={onEdit}
                            sx={{
                                textTransform: "none",
                                fontWeight: 600,
                                px: 2,
                                py: 0.6,
                                boxShadow: 1,
                                "&:hover": {
                                    boxShadow: 2,
                                    transform: "translateY(-1px)",
                                },
                                transition: "all 0.15s ease",
                            }}
                        >
                            Editar
                        </Button>
                    )}
                    {finalShowDelete && (
                        <Button
                            size="small"
                            variant="contained"
                            color="error"
                            startIcon={<Icon className="c-eliminar" sx={{ fontSize: 16 }} />}
                            onClick={onDelete}
                            sx={{
                                textTransform: "none",
                                fontWeight: 600,
                                px: 2,
                                py: 0.6,
                                borderWidth: 2,
                                "&:hover": {
                                    boxShadow: 2,
                                    transform: "translateY(-1px)",
                                },
                                transition: "all 0.15s ease",
                            }}
                        >
                            Eliminar
                        </Button>
                    )}
                </Box>
            )}
        </Box>
    );
};

AtFechaDone.propTypes = {
    fechaRegistrada: PropTypes.object,
    titulo: PropTypes.string,
    nomenclatura: PropTypes.string,
    headerHint: PropTypes.string,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    showActions: PropTypes.bool,
    showEdit: PropTypes.bool,
    showDelete: PropTypes.bool,
};

AtFechaDone.defaultProps = {
    fechaRegistrada: null,
    titulo: "",
    nomenclatura: "",
    headerHint: "",
    showActions: true,
    showEdit: undefined,
    showDelete: undefined,
};

export default AtFechaDone;
