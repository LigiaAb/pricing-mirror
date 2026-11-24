import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Divider,
  Icon,
  Chip,
} from "@mui/material";
import PropTypes from "prop-types";
import { useTheme } from "@mui/material/styles";
import TooltipComponent from "../../../../../components/TooltipComponent/TooltipComponent";
import SubirArchivoComponent from "../../../../../components/Formulario/SubirArchivoComponent";
import TextComponent from "../../../../../components/Formulario/TextComponent";

const DocumentoCard = ({
  tipo,
  tipoConfig,
  documento,
  archivoSeleccionado,
  estaCargando,
  onFileSelect,
  onSubir,
  onVer,
  onEliminar,
  onCancel,
  descripcion,
  onDescripcionChange,
}) => {
  const theme = useTheme();

  const getTooltipTitle = () => {
    if (documento) return "Documento subido correctamente";
    if (tipoConfig?.requerido) return "Este documento es obligatorio para la coordinación";
    return "Este documento es opcional";
  };

  const renderStatusChip = () => {
    if (documento) {
      return (
        <Chip
          variant="outlined"
          icon={<Icon className="c-circulo-cheque" sx={{ fontSize: 16, color: theme.palette.success.main }} htmlColor={theme.palette.success.main} style={{ color: theme.palette.success.main }} />}
          label="Hecho"
          size="small"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            borderWidth: 1.5,
          }}
        />
      );
    }
    if (tipoConfig?.requerido) {
      return (
        <Chip
          variant="outlined"
          icon={<Icon className="c-alerta" sx={{ fontSize: 16, color: theme.palette.warning.main }} htmlColor={theme.palette.warning.main} style={{ color: theme.palette.warning.main }} />}
          label="Requerido"
          size="small"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            borderWidth: 1.5,
          }}
        />
      );
    }
    return (
      <Chip
        variant="outlined"
        icon={<Icon className="c-ayuda" sx={{ fontSize: 16, color: theme.palette.text.secondary }} htmlColor={theme.palette.text.secondary} style={{ color: theme.palette.text.secondary }} />}
        label="Opcional"
        size="small"
        sx={{
          fontWeight: 600,
          color: 'text.primary',
          borderWidth: 1,
        }}
      />
    );
  };

  const computeBackgroundColor = () => {
    if (documento) return 'background.paper';
    if (archivoSeleccionado) return 'action.hover';
    return 'background.default';
  };

  const renderUploadArea = () => {
    if (archivoSeleccionado) {
      return (
        <Box>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Archivo seleccionado:
          </Typography>
          <Typography variant="body2" fontWeight="bold" noWrap mb={2}>
            {archivoSeleccionado.name}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            mb={2}
          >
            {(archivoSeleccionado.size / 1024 / 1024).toFixed(2)} MB
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'center' }}>
            <TooltipComponent titulo="Subir documento al servidor" placement="top">
              <Button
                variant="contained"
                color="primary"
                startIcon={
                  estaCargando ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Icon className="c-cargar" sx={{ fontSize: 18 }} />
                  )
                }
                onClick={() => onSubir(tipo, tipoConfig)}
                disabled={estaCargando}
                size="small"
                sx={{
                  fontWeight: "bold",
                  boxShadow: 3,
                  "&:hover": {
                    boxShadow: 6,
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                {estaCargando ? "Subiendo..." : "Subir"}
              </Button>
            </TooltipComponent>
            <TooltipComponent titulo="Cancelar y quitar archivo seleccionado" placement="top">
              <Button
                variant="outlined"
                size="small"
                startIcon={<Icon className="c-cancelar" sx={{ fontSize: 18 }} />}
                onClick={() => onCancel(tipo)}
                disabled={estaCargando}
                sx={{ fontWeight: "bold" }}
              >
                Cancelar
              </Button>
            </TooltipComponent>
          </Box>
        </Box>
      );
    }
    return (
      <Box sx={{ textAlign: "center" }}>
        <SubirArchivoComponent
          id={`subir-${tipo}`}
          input={{
            id: `subir-${tipo}`,
            multiple: false,
            useB64: false,
            acceptedFiles: "application/pdf",
            pegar: false,
          }}
          onInput={(val) => {
            let file = val;
            if (!file) return;
            if (Object.prototype.toString.call(file) === "[object FileList]") {
              file = file[0];
            }
            onFileSelect(tipo, { target: { files: [file] } });
          }}
        />
      </Box>
    );
  };
  return (
    <Card
      elevation={3}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border: `2px solid`,
        borderColor: documento ? `primary.main` : "divider",
        transition: "all 0.3s ease",
        "&:hover": { boxShadow: 6, transform: "translateY(-2px)" },
      }}
    >
      <CardContent
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 1,
            mb: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mr: 1,
            }}
          >
            <Icon
              className="c-documento"
              sx={{
                fontSize: 28,
                color: (theme) =>
                  theme.palette.mode === "dark"
                    ? theme.palette.common.white
                    : undefined,
              }}
            />
          </Box>
          <Box flexGrow={1}>
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{
                color: (theme) =>
                  theme.palette.mode === "dark"
                    ? theme.palette.primary.light
                    : theme.palette.primary.main,
              }}
            >
              {tipoConfig.nombre}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {tipoConfig.descripcion}
            </Typography>
          </Box>

          <TooltipComponent titulo={getTooltipTitle()} placement="left">
            {renderStatusChip()}
          </TooltipComponent>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Sección de carga */}
        <Box
          flexGrow={1}
          display="flex"
          flexDirection="column"
          justifyContent="flex-end"
        >
          <Box
            sx={{
              p: 2,
              textAlign: "center",
              backgroundColor: computeBackgroundColor(),
            }}
          >
            {documento ? (
              <Box>
                <Typography variant="body2" fontWeight="bold" mb={1}>
                  Información del Documento
                </Typography>
                {documento.descripcion && (
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    {documento.descripcion}
                  </Typography>
                )}
                {documento.fechaCarga && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.75,
                      mb: 2,
                    }}
                  >
                    <Icon
                      className="c-calendario1"
                      sx={{ fontSize: 16, color: "text.secondary" }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(documento.fechaCarga).toLocaleDateString(
                        "es-ES",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </Typography>
                  </Box>
                )}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    gap: 1,
                    justifyContent: "center",
                  }}
                >
                  <TooltipComponent titulo="Abrir PDF en nueva ventana" placement="top">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => onVer(documento)}
                      sx={{
                        bgcolor: "action.hover",
                        "&:hover": { bgcolor: "primary.light" },
                      }}
                    >
                      <Icon
                        className="c-pdf"
                        sx={{
                          fontSize: 18,
                          color: (theme) =>
                            theme.palette.mode === "dark"
                              ? theme.palette.common.white
                              : undefined,
                        }}
                      />
                    </IconButton>
                  </TooltipComponent>
                  <TooltipComponent titulo="Eliminar documento" placement="top">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onEliminar(documento)}
                      sx={{
                        bgcolor: "action.hover",
                        "&:hover": { bgcolor: "error.light" },
                      }}
                    >
                      <Icon className="c-eliminar" sx={{ fontSize: 18 }} />
                    </IconButton>
                  </TooltipComponent>
                </Box>
              </Box>
            ) : (
              <>
                <Box sx={{ mb: 1 }}>
                  <TextComponent
                    id={`desc-${tipo}`}
                    input={{
                      id: `desc-${tipo}`,
                      label: "Descripción (opcional)",
                      val: descripcion || "",
                      tipo: "text",
                      requerido: false,
                    }}
                    onInput={(val) => onDescripcionChange?.(tipo, val)}
                  />
                </Box>
                {renderUploadArea()}
              </>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

DocumentoCard.propTypes = {
  tipo: PropTypes.string.isRequired,
  tipoConfig: PropTypes.object.isRequired,
  documento: PropTypes.object,
  archivoSeleccionado: PropTypes.object,
  estaCargando: PropTypes.bool,
  onFileSelect: PropTypes.func.isRequired,
  onSubir: PropTypes.func.isRequired,
  onDescargar: PropTypes.func.isRequired,
  onVer: PropTypes.func.isRequired,
  onEliminar: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  descripcion: PropTypes.string,
  onDescripcionChange: PropTypes.func,
};

export default DocumentoCard;
