import { useEffect, useState, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Icon,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useDropzone } from "react-dropzone";
import {
  useGuardarArchivoPublico,
  useCreateCoordinacionDocumentoPublico,
  useCoordinacionDocumentosPublico,
} from "../../../hooks/Bpm";

const DropzoneArea = styled("div")(({ theme }) => ({
  border: `2px dashed ${theme.palette.mode === "dark" ? "#fff" : theme.palette.primary.main}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(4),
  textAlign: "center",
  cursor: "pointer",
  transition: "background-color 0.2s ease",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

const MAX_FILE_SIZE = 10 * 1024 * 1024;

// cod_tipo_documento del "Formulario Instructivo Firmado por el cliente"
// (mismo valor que usa DocumentosSection en src/pages/Embarques/components/secciones/documentos.jsx).
const COD_TIPO_DOCUMENTO_INSTRUCTIVO_FIRMADO = 256;

/**
 * Modal que solicita al cliente subir el PDF del Instructivo Embarque firmado
 * antes de ejecutar las acciones de "Completar". Replica el flujo privado de
 * DocumentosSection (handleSaveSingle):
 *   1) guardar-archivo (FormData) -> devuelve ruta_archivo
 *   2) insertar-coordinacion-documento (JSON) con cod_tipo_documento=256
 *
 * Permite arrastrar el archivo o dar click para seleccionarlo. Un único botón
 * "Completar Operación" sube el PDF al backend y, tras éxito, dispara en cadena
 * el cambio de cod_estado a 83 (gestión culminada) — ya no hay un segundo botón
 * "Completar": si el instructivo ya estaba subido (sesión previa), el mismo
 * botón sólo ejecuta el cambio de estado.
 */
const SubirInstructivoFirmadoModal = ({
  open,
  onClose,
  onCompletar,
  embarqueId,
  codFile,
  isCompleting = false,
  onDownloadPdf,
  isGeneratingPdf = false,
  isRefreshingForPdf = false,
  allStepsValid = false,
}) => {
  const [archivo, setArchivo] = useState(null);
  const [subido, setSubido] = useState(false);
  const [errorSubida, setErrorSubida] = useState("");

  const { mutateAsync: subirArchivo, isPending: isUploading } = useGuardarArchivoPublico();
  const { mutateAsync: crearDocumento, isPending: isCreatingDoc } = useCreateCoordinacionDocumentoPublico();

  // Antes de pedir un nuevo archivo, revisamos si el Instructivo Firmado (256)
  // ya fue subido en una sesión previa (p.ej. el cliente cerró el modal después
  // de "Subir PDF" pero antes de "Completar"). Sin esto, el modal siempre
  // arrancaba pidiendo subir el archivo de nuevo aunque ya existiera.
  const { data: documentosCoordinacion } = useCoordinacionDocumentosPublico(
    { embarque_id: embarqueId },
    { enabled: open && Boolean(embarqueId) },
  );
  const instructivoExistente = (documentosCoordinacion || []).find(
    (doc) => Number(doc.tipoIdDocumento) === COD_TIPO_DOCUMENTO_INSTRUCTIVO_FIRMADO,
  );

  useEffect(() => {
    if (open) {
      setArchivo(null);
      setSubido(Boolean(instructivoExistente));
      setErrorSubida("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, instructivoExistente]);

  const onDrop = useCallback((acceptedFiles) => {
    setErrorSubida("");
    const file = acceptedFiles?.[0];
    if (!file) return;
    setSubido(false);
    setArchivo(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    maxSize: MAX_FILE_SIZE,
    onDropRejected: (rejections) => {
      const reason = rejections?.[0]?.errors?.[0];
      if (reason?.code === "file-too-large") {
        setErrorSubida("El archivo supera el tamaño máximo permitido (10 MB).");
      } else {
        setErrorSubida("Archivo no válido. Seleccione un PDF.");
      }
    },
  });

  const handleQuitarArchivo = (e) => {
    e.stopPropagation();
    setArchivo(null);
    setSubido(false);
    setErrorSubida("");
  };

  // Ref (no state) para bloquear doble-click: `isUploading`/`isCreatingDoc` del
  // hook de mutación solo se actualizan tras un re-render, así que un doble
  // click rápido puede disparar `handleCompletarOperacion` dos veces antes de
  // que el botón se deshabilite, creando dos documentos duplicados en el servidor.
  const isSubmittingRef = useRef(false);

  // Flujo unificado "Completar Operación": sube el PDF pendiente (si todavía
  // no está subido) y, en cadena, dispara `onCompletar` del padre que ejecuta
  // el cambio de cod_estado a 83 (gestión culminada). Así se elimina el paso
  // intermedio de tener que pulsar "Subir PDF" y luego "Completar" por separado:
  // un solo botón hace las operaciones con éxito y cambia el estado.
  const handleCompletarOperacion = async () => {
    if (isSubmittingRef.current) return;
    // Si hay archivo seleccionado y todavía no se ha subido en esta sesión,
    // subirlo primero (Paso 1: guardar-archivo, Paso 2: insertar-coordinacion-documento).
    if (archivo && !subido) {
      if (!archivo) return;
      isSubmittingRef.current = true;
      setErrorSubida("");
      try {
        // Paso 1: guardar-archivo (FormData) -> ruta_archivo
        const rutaArchivo = await subirArchivo({
          archivo,
          tipo_documento: "coordinaciones",
          embarque_id: embarqueId,
          cod_file: codFile || "",
        });

        // Paso 2: insertar-coordinacion-documento con cod_tipo_documento=256
        // (mismo payload que handleSaveSingle en documentos.jsx privado).
        await crearDocumento({
          embarque_id: embarqueId,
          cod_tipo_documento: COD_TIPO_DOCUMENTO_INSTRUCTIVO_FIRMADO,
          ubicacion: "coordinaciones",
          tipo_documento: "coordinaciones",
          url_archivo: rutaArchivo,
          descripcion: "",
          estado_cod: 1,
        });

        setSubido(true);
      } catch (err) {
        console.error("Error al subir el instructivo firmado:", err);
        setErrorSubida("Error al subir el archivo. Intente nuevamente.");
        return;
      } finally {
        isSubmittingRef.current = false;
      }
    }
    // Operaciones exitosas: ahora sí ejecutar el cambio de estado del backend.
    await onCompletar();
  };

  const handleCerrar = () => {
    if (isUploading || isCreatingDoc || isCompleting) return;
    onClose();
  };

  const isWorking = isUploading || isCreatingDoc || isGeneratingPdf || isRefreshingForPdf;
  // Habilitado cuando haya subido (sesión previa o actual) o haya un archivo
  // pendiente de subir, y no haya ninguna operación en curso.
  const puedeOperar = (subido || Boolean(archivo)) && !isWorking && !isCompleting;

  return (
    <Dialog
      open={open}
      onClose={handleCerrar}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={isWorking || isCompleting}
    >
      <DialogTitle sx={{ fontWeight: "bold", pb: 1 }}>
        Subir Instructivo Embarque Firmado
      </DialogTitle>
      <DialogContent dividers>
        <Typography sx={{ fontWeight: 500, mb: 0.5, color: (theme) => (theme.palette.mode === "dark" ? "#fff" : "primary.main") }}>Instrucciones</Typography>
        <Typography variant="body2" sx={{ mb: 2, color: "text.primary" }}>
          1. Descarga el Formulario, 2. verifica los datos, 3. fírmalo y súbelo aqui.
        </Typography>

        <Box sx={{ mb: 2, display: "flex" }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => onDownloadPdf({ forceDownload: true })}
            disabled={isGeneratingPdf || isRefreshingForPdf}
            title="Guarda el PDF directamente con el nombre correcto (recomendado en Edge)"
            sx={{
              color: (theme) => (theme.palette.mode === "dark" ? "#fff" : "primary.main"),
              borderColor: (theme) => (theme.palette.mode === "dark" ? "#fff" : "primary.main"),
            }}
            startIcon={
              isGeneratingPdf || isRefreshingForPdf ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Icon className="c-descargar" />
              )
            }
            fullWidth
          >
            {(() => {
              if (isRefreshingForPdf) return "Actualizando datos...";
              if (isGeneratingPdf) return "Generando PDF...";
              return `Descargar Formulario${allStepsValid ? "" : " (borrador)"}`;
            })()}
          </Button>
        </Box>

        {!archivo && instructivoExistente ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              p: 1.5,
              border: "1px solid",
              borderColor: "success.main",
              borderRadius: 1,
              bgcolor: "success.lighter",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
              <Icon className="c-pdf" sx={{ color: "success.main" }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {instructivoExistente.tipoDescripcion || instructivoExistente.descripcion || "Documento"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Ya subido anteriormente
                </Typography>
              </Box>
            </Box>
            <Icon className="c-cuadrado-cheque" sx={{ color: "success.main" }} />
          </Box>
        ) : !archivo ? (
          <DropzoneArea {...getRootProps()}>
            <input {...getInputProps()} />
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <Icon className="c-pdf" sx={{ fontSize: 36, color: (theme) => (theme.palette.mode === "dark" ? "#fff" : "primary.main") }} />
              <Typography variant="body2">
                {isDragActive
                  ? "Suelte el archivo aquí..."
                  : "Arrastre y suelte el archivo PDF firmado aquí, o de click para seleccionar uno"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tamaño máximo: 10 MB
              </Typography>
            </Box>
          </DropzoneArea>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              p: 1.5,
              border: "1px solid",
              borderColor: subido ? "success.main" : "divider",
              borderRadius: 1,
              bgcolor: subido ? "success.lighter" : "background.paper",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
              {isWorking ? (
                <CircularProgress size={20} color="primary" />
              ) : (
                <Icon className="c-pdf" sx={{ color: subido ? "success.main" : (theme) => (theme.palette.mode === "dark" ? "#fff" : "primary.main") }} />
              )}
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {archivo.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {subido
                    ? "Subido correctamente"
                    : isWorking
                      ? "Subiendo..."
                      : "Listo para subir"}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {subido ? (
                <Icon className="c-cuadrado-cheque" sx={{ color: "success.main" }} />
              ) : (
                <IconButton size="small" onClick={handleQuitarArchivo} disabled={isWorking}>
                  <Icon className="c-eliminar" sx={{ fontSize: 18 }} />
                </IconButton>
              )}
            </Box>
          </Box>
        )}

        {errorSubida && (
          <Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>
            {errorSubida}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={handleCerrar}
          disabled={isWorking || isCompleting}
          sx={{
            color: (theme) => (theme.palette.mode === "dark" ? "#fff" : "primary.main"),
            borderColor: (theme) => (theme.palette.mode === "dark" ? "#fff" : "primary.main"),
          }}
        >
          Cancelar
        </Button>

        <Button
          variant="contained"
          size="small"
          color={subido ? "success" : "primary"}
          onClick={handleCompletarOperacion}
          disabled={!puedeOperar}
          startIcon={
            isWorking || isCompleting ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <Icon className="c-cuadrado-cheque" />
            )
          }
        >
          {isUploading
            ? "Subiendo PDF..."
            : isCreatingDoc
              ? "Registrando documento..."
              : isCompleting
                ? "Completando..."
                : "Completar Operación"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

SubirInstructivoFirmadoModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCompletar: PropTypes.func.isRequired,
  embarqueId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  codFile: PropTypes.string,
  isCompleting: PropTypes.bool,
  onDownloadPdf: PropTypes.func,
  isGeneratingPdf: PropTypes.bool,
  isRefreshingForPdf: PropTypes.bool,
  allStepsValid: PropTypes.bool,
};

export default SubirInstructivoFirmadoModal;