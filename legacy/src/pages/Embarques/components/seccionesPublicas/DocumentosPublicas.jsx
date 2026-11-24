import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Card,
  Stack,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  alpha,
} from "@mui/material";
import { FileWarning, FileText, Upload, Eye, Pencil, CheckCircle2, X } from "lucide-react";
import {
  useCoordinacionDocumentosPublico,
  useCreateCoordinacionDocumentoPublico,
  useUpdateCoordinacionDocumentoPublico,
} from "@/hooks/Bpm/coordinaciones";
import { useGuardarArchivoPublico, useRecuperarArchivoPublico } from "@/hooks/Bpm/archivos";
import BannerInformativo from "../banner";
import FileDropzone from "@/components/bpm/common/FileDropzone";

const MAX_FILE_SIZE_MB = 10;

// Mismos cod_tipo_documento que en el flujo privado
// (src/pages/Embarques/components/secciones/documentos.jsx).
const TIPO_DOCUMENTO_PELIGROSIDAD = 343;
const NOMBRE_DOCUMENTO_PELIGROSIDAD = "Hoja de Seguridad";
const MENSAJE_DOCUMENTO_PELIGROSIDAD = "Al tratarse de una carga peligrosa, debe cargar la Hoja de Seguridad (MSDS).";

const TIPO_DOCUMENTO_COBERTURA_SEGURO = 315;
const NOMBRE_DOCUMENTO_COBERTURA_SEGURO = "Factura Cobertura Seguro";
const MENSAJE_DOCUMENTO_COBERTURA_SEGURO = "Al tener cobertura de seguro, debe cargar la Factura de Cobertura de Seguro.";

const DocumentoRequeridoCard = ({
  tipoDocumentoId,
  nombre,
  serverDocs,
  embarqueId,
  codFile,
  guardarArchivo,
  recuperarArchivo,
  crearDocumento,
  actualizarDocumento,
  refetchDocs,
  onValidityChange,
}) => {
  const serverDoc = serverDocs.find(
    (doc) => String(doc.tipoIdDocumento) === String(tipoDocumentoId),
  );

  const [pendingFile, setPendingFile] = useState(null);
  const [descripcion, setDescripcion] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    setDescripcion(serverDoc?.descripcion || "");
  }, [serverDoc?.descripcion]);

  const isValid = Boolean(serverDoc?.urlArchivo);

  const onValidityChangeRef = useRef(onValidityChange);
  onValidityChangeRef.current = onValidityChange;
  useEffect(() => {
    onValidityChangeRef.current?.(isValid);
  }, [isValid]);

  const handleFileAccepted = (file) => {
    setUploadError("");
    setPendingFile(file);
  };

  const handleRemovePendingFile = () => {
    setPendingFile(null);
    setUploadError("");
  };

  const handleSave = async () => {
    if (!pendingFile) return;
    setIsSaving(true);
    try {
      const rutaArchivo = await guardarArchivo({
        archivo: pendingFile,
        tipo_documento: "coordinaciones",
        embarque_id: embarqueId,
        cod_file: codFile || "",
        descripcion: descripcion || undefined,
      });

      if (serverDoc) {
        await actualizarDocumento({
          documento_id_coord: serverDoc.documentoIdCoord,
          embarque_id: embarqueId,
          cod_tipo_documento: tipoDocumentoId,
          ubicacion: "coordinaciones",
          tipo_documento: "coordinaciones",
          url_archivo: rutaArchivo,
          descripcion: descripcion || null,
          estado_cod: 1,
        });
      } else {
        await crearDocumento({
          embarque_id: embarqueId,
          cod_tipo_documento: tipoDocumentoId,
          ubicacion: "coordinaciones",
          tipo_documento: "coordinaciones",
          url_archivo: rutaArchivo,
          descripcion: descripcion || null,
          estado_cod: 1,
        });
      }

      await refetchDocs();
      setPendingFile(null);
    } catch (error) {
      console.error(`Error al guardar documento (${nombre}):`, error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewFile = async () => {
    if (!serverDoc?.urlArchivo) return;
    try {
      const blob = await recuperarArchivo({ ruta_archivo: serverDoc.urlArchivo });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error) {
      console.error(`Error al recuperar documento (${nombre}):`, error);
    }
  };

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFile, setEditFile] = useState(null);
  const [editComment, setEditComment] = useState("");
  const [isEditSaving, setIsEditSaving] = useState(false);
  const [editUploadError, setEditUploadError] = useState("");

  const handleOpenEditDialog = useCallback(() => {
    setEditDialogOpen(true);
    setEditFile(null);
    setEditComment(serverDoc?.descripcion || "");
    setEditUploadError("");
  }, [serverDoc]);

  const handleCloseEditDialog = useCallback(() => {
    setEditDialogOpen(false);
    setEditFile(null);
    setEditComment("");
    setEditUploadError("");
  }, []);

  const handleEditFileAccepted = (file) => {
    setEditUploadError("");
    setEditFile(file);
  };

  const handleEditSave = async () => {
    if (!editFile || !serverDoc) return;
    setIsEditSaving(true);
    try {
      const rutaArchivo = await guardarArchivo({
        archivo: editFile,
        tipo_documento: "coordinaciones",
        embarque_id: embarqueId,
        cod_file: codFile || "",
        descripcion: editComment || undefined,
      });

      await actualizarDocumento({
        documento_id_coord: serverDoc.documentoIdCoord,
        embarque_id: embarqueId,
        cod_tipo_documento: tipoDocumentoId,
        ubicacion: "coordinaciones",
        tipo_documento: "coordinaciones",
        url_archivo: rutaArchivo,
        descripcion: editComment || null,
        estado_cod: 1,
      });

      await refetchDocs();
      handleCloseEditDialog();
    } catch (error) {
      console.error(`Error al actualizar documento (${nombre}):`, error);
    } finally {
      setIsEditSaving(false);
    }
  };

  const isSubido = Boolean(serverDoc?.urlArchivo);
  const accentColor = isSubido ? "success.main" : "error.main";

  return (
    <>
      <Card
        elevation={0}
        sx={{
          flex: "1 1 280px",
          minWidth: 260,
          maxWidth: { xs: "100%", sm: 340 },
          border: "1px solid",
          borderColor: isSubido ? alpha("#2e7d32", 0.3) : "divider",
          borderLeft: "3px solid",
          borderLeftColor: accentColor,
          borderRadius: 3,
          overflow: "hidden",
          bgcolor: isSubido ? alpha("#2e7d32", 0.04) : "background.paper",
          transition: "box-shadow 0.2s ease",
          "&:hover": isSubido ? { boxShadow: 1 } : undefined,
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                <Box
                  component="span"
                  sx={{
                    color: isSubido ? "success.main" : accentColor,
                    display: "inline-flex",
                    flexShrink: 0,
                  }}
                >
                  {isSubido ? <CheckCircle2 size={20} /> : <FileWarning size={20} />}
                </Box>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {nombre}
                </Typography>
              </Stack>

              {!isSubido && (
                <Chip
                  label="Pendiente"
                  color="error"
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 600, borderWidth: 1.5, flexShrink: 0 }}
                />
              )}
            </Stack>

            {isSubido ? (
              descripcion && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ wordBreak: "break-word" }}
                >
                  {descripcion}
                </Typography>
              )
            ) : (
              <TextField
                placeholder="Descripción (opcional)"
                size="small"
                variant="outlined"
                fullWidth
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                slotProps={{
                  input: {
                    maxLength: 250,
                    sx: { fontSize: "0.8rem" },
                  },
                }}
              />
            )}

            {isSubido && (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
                sx={{ pt: 0.5 }}
              >
                <Chip
                  label="En Servidor"
                  color="success"
                  size="small"
                  icon={<CheckCircle2 size={14} />}
                  variant="outlined"
                  sx={{ fontWeight: 600, borderWidth: 1.5 }}
                />
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="Ver PDF">
                    <IconButton size="small" onClick={handleViewFile}>
                      <Eye size={18} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Editar">
                    <IconButton size="small" color="primary" onClick={handleOpenEditDialog}>
                      <Pencil size={18} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            )}

            {!isSubido && !pendingFile && (
              <FileDropzone
                onFileAccepted={handleFileAccepted}
                onRejected={setUploadError}
                maxSizeMB={MAX_FILE_SIZE_MB}
                compact
              />
            )}

            {!isSubido && pendingFile && (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  px: 1.5,
                  py: 1,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                  <Box component="span" sx={{ color: "error.main", display: "inline-flex" }}>
                    <FileText size={18} />
                  </Box>
                  <Typography variant="caption" sx={{ wordBreak: "break-all", lineHeight: 1.2 }}>
                    {pendingFile.name}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={isSaving ? <CircularProgress size={14} color="inherit" /> : <Upload size={16} />}
                    onClick={handleSave}
                    disabled={isSaving}
                    sx={{ textTransform: "none", fontSize: "0.75rem", py: 0.5, px: 1.5, borderRadius: 2 }}
                  >
                    {isSaving ? "Guardando..." : "Guardar"}
                  </Button>
                  <Tooltip title="Quitar archivo">
                    <IconButton size="small" onClick={handleRemovePendingFile} disabled={isSaving}>
                      <X size={16} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            )}

            {uploadError && (
              <Typography variant="caption" color="error">
                {uploadError}
              </Typography>
            )}
          </Stack>
        </Box>
      </Card>

      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 3 },
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>
          Actualizar Documento
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          <Stack spacing={2.5}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha("#2e7d32", 0.1),
                }}
              >
                <Box component="span" sx={{ color: "#2e7d32", display: "inline-flex" }}>
                  <FileWarning size={20} />
                </Box>
              </Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {nombre}
              </Typography>
            </Stack>

            {editFile ? (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, px: 1.5, py: 1 }}
              >
                <Chip
                  icon={<FileText size={16} />}
                  label={editFile.name}
                  size="small"
                  color="error"
                  variant="outlined"
                  onDelete={() => setEditFile(null)}
                  sx={{ maxWidth: "100%" }}
                />
              </Stack>
            ) : (
              <FileDropzone
                onFileAccepted={handleEditFileAccepted}
                onRejected={setEditUploadError}
                maxSizeMB={MAX_FILE_SIZE_MB}
                label="Arrastra el nuevo PDF aquí o haz clic para seleccionar"
              />
            )}

            {editUploadError && (
              <Typography variant="caption" color="error">
                {editUploadError}
              </Typography>
            )}

            <TextField
              label="Comentario (opcional)"
              value={editComment}
              onChange={(e) => setEditComment(e.target.value)}
              multiline
              rows={3}
              fullWidth
              size="small"
              slotProps={{ input: { maxLength: 250 } }}
            />
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={handleCloseEditDialog} sx={{ textTransform: "none" }} disabled={isEditSaving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleEditSave}
            disabled={!editFile || isEditSaving}
            startIcon={isEditSaving ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            {isEditSaving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

DocumentoRequeridoCard.propTypes = {
  tipoDocumentoId: PropTypes.number.isRequired,
  nombre: PropTypes.string.isRequired,
  serverDocs: PropTypes.array.isRequired,
  embarqueId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  codFile: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  guardarArchivo: PropTypes.func.isRequired,
  recuperarArchivo: PropTypes.func.isRequired,
  crearDocumento: PropTypes.func.isRequired,
  actualizarDocumento: PropTypes.func.isRequired,
  refetchDocs: PropTypes.func.isRequired,
  onValidityChange: PropTypes.func.isRequired,
};

const DocumentosPublicas = ({
  embarqueId,
  codFile,
  onValidityChange,
  onLoadingChange,
  showPeligrosidad = true,
  showCoberturaSeguro = false,
}) => {
  const {
    data: serverDocs = [],
    isLoading: isLoadingDocs,
    refetch: refetchDocs,
  } = useCoordinacionDocumentosPublico({ embarque_id: embarqueId });

  const { mutateAsync: guardarArchivo } = useGuardarArchivoPublico();
  const { mutateAsync: recuperarArchivo } = useRecuperarArchivoPublico();
  const { mutateAsync: crearDocumento } = useCreateCoordinacionDocumentoPublico();
  const { mutateAsync: actualizarDocumento } = useUpdateCoordinacionDocumentoPublico();

  useEffect(() => {
    onLoadingChange?.(!embarqueId || isLoadingDocs);
  }, [embarqueId, isLoadingDocs, onLoadingChange]);

  const [validityByDoc, setValidityByDoc] = useState({});
  const onValidityChangeRef = useRef(onValidityChange);
  onValidityChangeRef.current = onValidityChange;

  const handleDocValidityChange = useCallback((key, valid) => {
    setValidityByDoc((prev) => {
      if (prev[key] === valid) return prev;
      return { ...prev, [key]: valid };
    });
  }, []);

  useEffect(() => {
    const keys = [
      ...(showPeligrosidad ? ["peligrosidad"] : []),
      ...(showCoberturaSeguro ? ["coberturaSeguro"] : []),
    ];
    const isValid = keys.every((key) => validityByDoc[key]);
    onValidityChangeRef.current?.(isValid);
  }, [validityByDoc, showPeligrosidad, showCoberturaSeguro]);

  return (
    <Box sx={{ position: "relative" }}>
      {isLoadingDocs && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "rgba(255,255,255,0.7)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 2,
          }}
        >
          <CircularProgress size={36} />
        </Box>
      )}

      <Stack spacing={1.5} sx={{ mb: 2 }}>
        {showPeligrosidad && (
          <BannerInformativo
            ocultar={Boolean(validityByDoc.peligrosidad)}
            severidad="warning"
            titulo="Documento obligatorio pendiente"
            mensaje={MENSAJE_DOCUMENTO_PELIGROSIDAD}
          />
        )}
        {showCoberturaSeguro && (
          <BannerInformativo
            ocultar={Boolean(validityByDoc.coberturaSeguro)}
            severidad="warning"
            titulo="Documento obligatorio pendiente"
            mensaje={MENSAJE_DOCUMENTO_COBERTURA_SEGURO}
          />
        )}
      </Stack>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "flex-start",
        }}
      >
        {showPeligrosidad && (
          <DocumentoRequeridoCard
            tipoDocumentoId={TIPO_DOCUMENTO_PELIGROSIDAD}
            nombre={NOMBRE_DOCUMENTO_PELIGROSIDAD}
            serverDocs={serverDocs}
            embarqueId={embarqueId}
            codFile={codFile}
            guardarArchivo={guardarArchivo}
            recuperarArchivo={recuperarArchivo}
            crearDocumento={crearDocumento}
            actualizarDocumento={actualizarDocumento}
            refetchDocs={refetchDocs}
            onValidityChange={(valid) => handleDocValidityChange("peligrosidad", valid)}
          />
        )}

        {showCoberturaSeguro && (
          <DocumentoRequeridoCard
            tipoDocumentoId={TIPO_DOCUMENTO_COBERTURA_SEGURO}
            nombre={NOMBRE_DOCUMENTO_COBERTURA_SEGURO}
            serverDocs={serverDocs}
            embarqueId={embarqueId}
            codFile={codFile}
            guardarArchivo={guardarArchivo}
            recuperarArchivo={recuperarArchivo}
            crearDocumento={crearDocumento}
            actualizarDocumento={actualizarDocumento}
            refetchDocs={refetchDocs}
            onValidityChange={(valid) => handleDocValidityChange("coberturaSeguro", valid)}
          />
        )}
      </Box>
    </Box>
  );
};

DocumentosPublicas.propTypes = {
  embarqueId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  codFile: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onValidityChange: PropTypes.func,
  onLoadingChange: PropTypes.func,
  showPeligrosidad: PropTypes.bool,
  showCoberturaSeguro: PropTypes.bool,
};

export default DocumentosPublicas;
