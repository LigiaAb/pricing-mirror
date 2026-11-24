import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Divider,
  Stack,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  alpha,
} from "@mui/material";
import {
  FileText,
  FileWarning,
  File,
  CheckCircle2,
  Save,
  Upload,
  Eye,
  Pencil,
  RefreshCw,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import {
  useCoordinacionDocumentos,
  useCreateCoordinacionDocumento,
  useUpdateCoordinacionDocumento,
} from "@/hooks/Bpm/coordinaciones";
import {
  useRecuperarArchivo,
  useGuardarArchivo,
} from "@/hooks/Bpm/archivos";
import {
  invalidateCoordinacionDocumentos,
} from "@/hooks/Bpm/utils/cacheConfig";
import { useCoordinacionData } from "@/hooks/Bpm";
import BannerInformativo from "../banner";
import FileDropzone from "@/components/bpm/common/FileDropzone";
import { CROPA_DOCS } from "./detalles";

const MAX_FILE_SIZE_MB = 10;

const DOCUMENT_COLORS = {
  subido: { main: "success", light: "#2e7d32", lighter: "#e8f5e9", icon: "c-documentos" },
  obligatorio: { main: "error", light: "#c62828", lighter: "#ffebee", icon: "c-documento-obligatorio" },
  pendiente: { main: "warning", light: "#e65100", lighter: "#fff3e0", icon: "c-documento" },
};

const ICON_MAP = {
  "c-documentos": FileText,
  "c-documento-obligatorio": FileWarning,
  "c-documento": File,
  "c-pdf": FileText,
  "c-check": CheckCircle2,
  "c-archivo": File,
  "c-guardar": Save,
  "c-ver": Eye,
  "c-lapiz": Pencil,
  "c-cargar": Upload,
  "c-actualizar": RefreshCw,
};

const getDocumentCardBorderColor = (isSubido, isPendienteCarga, colorConfig) =>
  isSubido ? "success.main" : isPendienteCarga ? "warning.main" : colorConfig.light;

const getDocumentCardHeaderColor = (isSubido, isPendienteCarga) =>
  isSubido ? "success.main" : isPendienteCarga ? "error.main" : "text.secondary";

const renderDocumentCardStatusChip = (doc) => {
  if (doc.urlServidor) {
    return (
      <Chip
        label="En Servidor"
        color="success"
        size="small"
        icon={<CheckCircle2 size={16} />}
        variant="outlined"
        sx={{ fontWeight: 600, borderWidth: 1.5 }}
      />
    );
  }

  if (doc.pendingFile) {
    return (
      <Chip
        label="Listo para guardar"
        color="warning"
        size="small"
        icon={<File size={16} />}
        variant="outlined"
        sx={{ fontWeight: 600, borderWidth: 1.5 }}
      />
    );
  }

  return (
    <Chip
      label="Pendiente"
      color={doc.obligatorio ? "error" : "default"}
      variant="outlined"
      size="small"
      sx={{ fontWeight: 600, borderWidth: 1.5 }}
    />
  );
};

const documentShape = PropTypes.shape({
  nombre: PropTypes.string,
  tipoDescripcion: PropTypes.string,
  descripcion: PropTypes.string,
  pendingFile: PropTypes.object,
  urlServidor: PropTypes.string,
  obligatorio: PropTypes.bool,
});

const DocumentCard = React.memo(
  function DocumentCard({ rowKey, doc, colorConfig, onDescripcionChange, onFileUpload, onSavePendingFile, onRemoveFile, recuperarArchivo, onEditDocument }) {
    const [localDesc, setLocalDesc] = useState(doc.descripcion || "");
    const [uploadError, setUploadError] = useState("");

    const handleLocalDescChange = (e) => {
      setLocalDesc(e.target.value);
    };

    const handleDescripcionBlur = () => {
      onDescripcionChange(rowKey, localDesc);
    };

    const handleViewFile = async () => {
      if (doc.urlServidor) {
        try {
          const blob = await recuperarArchivo({
            ruta_archivo: doc.urlServidor,
          });
          const url = URL.createObjectURL(blob);
          window.open(url, "_blank");
        } catch (error) {
          console.error("Error al recuperar archivo:", error);
        }
      } else if (doc.pendingFile) {
        window.open(URL.createObjectURL(doc.pendingFile), "_blank");
      }
    };

    const handleRemoveClick = () => {
      setUploadError("");
      onRemoveFile(rowKey);
    };

    const handleFileAccepted = (file) => {
      setUploadError("");
      onFileUpload(rowKey, { target: { files: [file], value: null } });
    };

    const handleSavePendingClick = () => {
      onSavePendingFile(rowKey);
    };

    const handleEditClick = () => {
      if (typeof onEditDocument === "function") {
        onEditDocument(rowKey, doc);
      }
    };

    useEffect(() => {
      setLocalDesc(doc.descripcion || "");
    }, [doc.descripcion]);

    const isSubido = !!doc.urlServidor;
    const isPendienteCarga = !!doc.pendingFile;
    const borderLeftColor = getDocumentCardBorderColor(isSubido, isPendienteCarga, colorConfig);
    const headerColor = getDocumentCardHeaderColor(isSubido, isPendienteCarga);
    const HeaderIcon = isPendienteCarga ? FileText : File;
    const statusChip = renderDocumentCardStatusChip(doc);

    return (
      <Paper
        variant="outlined"
        sx={{
          borderLeft: "3px solid",
          borderLeftColor,
          borderColor: "divider",
          borderRadius: 2,
          transition: "box-shadow 0.15s ease, border-color 0.15s ease",
          "&:hover": {
            boxShadow: 2,
            borderColor: alpha(colorConfig.main === "warning" ? "#ed6c02" : "#1976d2", 0.3),
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Stack spacing={1.25}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                <Box component="span" sx={{ color: headerColor, display: "inline-flex" }}>
                  <HeaderIcon size={20} />
                </Box>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {doc.nombre || doc.tipoDescripcion || "Documento"}
                </Typography>
              </Stack>
              <Box sx={{ flexShrink: 0 }}>{statusChip}</Box>
            </Stack>

            <TextField
              placeholder="Descripción (opcional)"
              size="small"
              variant={doc.urlServidor ? "standard" : "outlined"}
              fullWidth
              value={localDesc}
              onChange={handleLocalDescChange}
              onBlur={handleDescripcionBlur}
              slotProps={{
                input: {
                  maxLength: 250,
                  readOnly: !!doc.urlServidor,
                  sx: {
                    fontSize: "0.8rem",
                    ...(doc.urlServidor && { cursor: "default", "&::before, &::after": { borderBottom: "none !important" } }),
                  },
                },
              }}
            />

            {isSubido && (
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Tooltip title="Ver PDF">
                  <IconButton size="small" onClick={handleViewFile} sx={{ "&:hover": { bgcolor: "transparent" } }}>
                    <Eye size={18} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Editar">
                  <IconButton size="small" color="primary" onClick={handleEditClick}>
                    <Pencil size={18} />
                  </IconButton>
                </Tooltip>
              </Stack>
            )}

            {!isSubido && !isPendienteCarga && (
              <FileDropzone
                onFileAccepted={handleFileAccepted}
                onRejected={setUploadError}
                maxSizeMB={MAX_FILE_SIZE_MB}
                compact
              />
            )}

            {!isSubido && isPendienteCarga && (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, px: 1.5, py: 1 }}
              >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                  <Box component="span" sx={{ color: "warning.main", display: "inline-flex" }}>
                    <FileText size={18} />
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ wordBreak: "break-all", lineHeight: 1.2 }}
                  >
                    {doc.pendingFile.name}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<Save size={16} />}
                    onClick={handleSavePendingClick}
                    sx={{ textTransform: "none", fontSize: "0.75rem", py: 0.5, px: 1.5, borderRadius: 2 }}
                  >
                    Guardar
                  </Button>
                  <Tooltip title="Quitar archivo">
                    <IconButton size="small" onClick={handleRemoveClick}>
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
      </Paper>
    );
  },
  (prev, next) =>
    prev.doc.descripcion === next.doc.descripcion &&
    prev.doc.pendingFile === next.doc.pendingFile &&
    prev.doc.urlServidor === next.doc.urlServidor,
);

DocumentCard.propTypes = {
  rowKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  doc: documentShape.isRequired,
  colorConfig: PropTypes.shape({
    main: PropTypes.string,
    light: PropTypes.string,
    lighter: PropTypes.string,
    icon: PropTypes.string,
  }).isRequired,
  onDescripcionChange: PropTypes.func.isRequired,
  onFileUpload: PropTypes.func.isRequired,
  onSavePendingFile: PropTypes.func.isRequired,
  onRemoveFile: PropTypes.func.isRequired,
  recuperarArchivo: PropTypes.func.isRequired,
  onEditDocument: PropTypes.func.isRequired,
};

const EmptyState = ({ colorConfig }) => {
  const IconCmp = ICON_MAP[colorConfig.icon] || File;
  return (
    <Box
      sx={{
        py: 4,
        px: 2,
        textAlign: "center",
        bgcolor: colorConfig.lighter,
        borderRadius: 2,
        border: "1px dashed",
        borderColor: alpha(colorConfig.light, 0.4),
      }}
    >
      <Box sx={{ display: "inline-flex", color: alpha(colorConfig.light, 0.4), mb: 1 }}>
        <IconCmp size={36} />
      </Box>
      <Typography variant="body2" color="text.secondary">
        Sin documentos en esta sección
      </Typography>
    </Box>
  );
};

EmptyState.propTypes = {
  colorConfig: PropTypes.shape({
    lighter: PropTypes.string,
    light: PropTypes.string,
    icon: PropTypes.string,
  }).isRequired,
};

const DocumentSection = ({
  tipo,
  title,
  count,
  countLabel,
  documentos: docs,
  colorConfig,
  handleDescripcionChange,
  handleFileUpload,
  handleSavePendingFile,
  handleRemoveFile,
  recuperarArchivo,
  handleEditDocument,
  onRefresh,
  isLoading,
}) => {
  const color = colorConfig.main === "success" ? "success" : colorConfig.main === "error" ? "error" : "warning";
  const IconHeader = ICON_MAP[colorConfig.icon] || File;

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        overflow: "hidden",
        height: "100%",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: (theme) => theme.palette.mode === 'dark' ? 'transparent' : `linear-gradient(135deg, ${colorConfig.lighter} 0%, ${alpha(colorConfig.light, 0.08)} 100%)`,
          px: 2.5,
          py: 1.75,
          borderBottom: "1px solid",
          borderBottomColor: alpha(colorConfig.light, 0.15),
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha(colorConfig.light, 0.12),
              }}
            >
              <Box component="span" sx={{ color: colorConfig.light, display: "inline-flex" }}>
                <IconHeader size={18} />
              </Box>
            </Box>
            <Typography variant="subtitle2" fontWeight={700}>
              {title}
            </Typography>
            <Chip
              label={countLabel !== undefined ? countLabel : count}
              size="small"
              color={color}
              variant="filled"
              sx={{ fontWeight: 700, fontSize: "0.7rem", height: 20, borderRadius: 1 }}
            />
          </Stack>
          <Tooltip title="Refrescar documentos">
            <span>
              <IconButton size="small" onClick={onRefresh} disabled={isLoading} sx={{ borderRadius: 1.5 }}>
                <RefreshCw size={16} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      {/* Body */}
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        {docs.length > 0 ? (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "flex-start" }}>
            {docs.map(([key, doc]) => (
              <Box key={key} sx={{ flex: "1 1 260px", minWidth: 240, maxWidth: { xs: "100%", sm: 320 } }}>
                <DocumentCard
                  rowKey={key}
                  doc={doc}
                  colorConfig={colorConfig}
                  onDescripcionChange={handleDescripcionChange}
                  onFileUpload={handleFileUpload}
                  onSavePendingFile={handleSavePendingFile}
                  onRemoveFile={handleRemoveFile}
                  recuperarArchivo={recuperarArchivo}
                  onEditDocument={handleEditDocument}
                />
              </Box>
            ))}
          </Box>
        ) : (
          <EmptyState colorConfig={colorConfig} />
        )}
      </CardContent>
    </Card>
  );
};

DocumentSection.propTypes = {
  tipo: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  count: PropTypes.number,
  countLabel: PropTypes.string,
  documentos: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.any)).isRequired,
  colorConfig: PropTypes.shape({
    main: PropTypes.string,
    light: PropTypes.string,
    lighter: PropTypes.string,
    icon: PropTypes.string,
  }).isRequired,
  handleDescripcionChange: PropTypes.func.isRequired,
  handleFileUpload: PropTypes.func.isRequired,
  handleSavePendingFile: PropTypes.func.isRequired,
  handleRemoveFile: PropTypes.func.isRequired,
  recuperarArchivo: PropTypes.func.isRequired,
  handleEditDocument: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

const DocumentosSection = ({ embarque_id, cod_file: codFileProp, onValidityChange, onLoadingChange }) => {
  const { data: embarqueData = null } = useCoordinacionData(embarque_id);
  const {
    data: serverDocsRaw = [],
    isLoading: isLoadingDocs,
    refetch: refetchDocs,
  } = useCoordinacionDocumentos({ embarque_id: embarque_id });

  const serverDocs = useMemo(() => {
    return serverDocsRaw.map((doc) => ({
      tipoDocumentoId: doc.tipoIdDocumento,
      tipoDescripcion: doc.tipoDescripcion,
      urlDocumento: doc.urlArchivo,
      documentoIdCoord: doc.documentoIdCoord,
      descripcion: doc.descripcion,
      codFile: doc.codFile,
    }));
  }, [serverDocsRaw]);
  const { mutateAsync: guardarArchivo } = useGuardarArchivo();
  const { mutateAsync: crearDocumento } = useCreateCoordinacionDocumento();
  const { mutateAsync: actualizarDocumento } = useUpdateCoordinacionDocumento();
  const { mutateAsync: recuperarArchivo } = useRecuperarArchivo();
  const queryClient = useQueryClient();

  const handleRefreshDocuments = async () => {
    try {
      await invalidateCoordinacionDocumentos(queryClient, String(embarque_id));
      await refetchDocs();
    } catch (error) {
      console.error("Error refrescando documentos de coordinación:", error);
    }
  };

  const codFile =
    codFileProp ||
    embarqueData?.cod_file ||
    embarqueData?.COD_FILE ||
    embarqueData?.codFile ||
    serverDocs.find((doc) => doc.codFile)?.codFile ||
    "";

  const codFileRef = useRef("");
  if (codFile) codFileRef.current = codFile;

  const [documentos, setDocumentos] = useState({
    documento_peligrosidad: {
      nombre: "Hoja de Seguridad",
      pendingFile: null,
      obligatorio: false,
      visible: false,
      tipoDocumentoId: 343,
      urlServidor: null,
      descripcion: "",
    },
    factura_electronica: {
      nombre: "Factura Electrónica",
      pendingFile: true,
      obligatorio: false,
      visible: false,
      tipoDocumentoId: 254,
      urlServidor: null,
      descripcion: "",
    },
    lista_empaque: {
      nombre: "Copia Lista de Empaque",
      pendingFile: null,
      obligatorio: false,
      tipoDocumentoId: 217,
      urlServidor: null,
      descripcion: "",
    },
    eur1: {
      nombre: "EUR1",
      pendingFile: null,
      obligatorio: false,
      tipoDocumentoId: 257,
      urlServidor: null,
      descripcion: "",
    },
    otros: {
      nombre: "Otros",
      pendingFile: null,
      obligatorio: false,
      tipoDocumentoId: 157,
      urlServidor: null,
      descripcion: "",
    },
    deprex: {
      nombre: "DEPREX",
      pendingFile: null,
      obligatorio: false,
      tipoDocumentoId: 219,
      urlServidor: null,
      descripcion: "",
    },
    formulario_instructivo: {
      nombre: "Formulario Instructivo Firmado por el cliente",
      pendingFile: null,
      obligatorio: true,
      tipoDocumentoId: 256,
      urlServidor: null,
      descripcion: "",
    },
    duca_complementaria: {
      nombre: "DUCA Complementaria",
      pendingFile: null,
      obligatorio: false,
      tipoDocumentoId: 263,
      urlServidor: null,
      descripcion: "",
    },
    duca_simplificada: {
      nombre: "DUCA Simplificada",
      pendingFile: null,
      obligatorio: false,
      tipoDocumentoId: 264,
      urlServidor: null,
      descripcion: "",
    },
    duca_definitiva: {
      nombre: "DUCA Definitiva",
      pendingFile: null,
      obligatorio: false,
      tipoDocumentoId: 265,
      urlServidor: null,
      descripcion: "",
    },
    factura_cobertura_seguro: {
      nombre: "Factura Cobertura Seguro",
      pendingFile: null,
      obligatorio: false,
      tipoDocumentoId: 315,
      urlServidor: null,
      descripcion: "",
    },
  });

  // Clasificación de carga que exige documentación de peligrosidad (MSDS).
  // Mismo criterio que public/page.jsx (CLASIFICACION_CARGA_PELIGROSA).
  const CLASIFICACION_CARGA_PELIGROSA = 122;

  const setPeligrosidadDocumento = (isPeligroso) => {
    setDocumentos((prev) => ({
      ...prev,
      documento_peligrosidad: {
        ...prev.documento_peligrosidad,
        obligatorio: isPeligroso,
        visible: isPeligroso,
      },
    }));
  };

  const setCoberturaSeguroDocumento = (tieneCoberturaSeguro) => {
    setDocumentos((prev) => ({
      ...prev,
      factura_cobertura_seguro: {
        ...prev.factura_cobertura_seguro,
        obligatorio: tieneCoberturaSeguro,
        visible: tieneCoberturaSeguro,
      },
    }));
  };

  useEffect(() => {
    const clasificacionCargaId =
      embarqueData?.clasificacionCargaId ?? embarqueData?.clasificacion_carga_id ?? null;

    const isPeligroso = Number(clasificacionCargaId) === CLASIFICACION_CARGA_PELIGROSA;
    setPeligrosidadDocumento(isPeligroso);

    const tieneCoberturaSeguro =
      embarqueData?.coberturaSeguro === true ||
      embarqueData?.cobertura_seguro === true;
    setCoberturaSeguroDocumento(tieneCoberturaSeguro);
  }, [embarqueData]);

  const handleFileUpload = (key, event) => {
    const file = event.target.files[0];

    if (!file) {
      console.warn("No se seleccionó ningún archivo");
      return;
    }

    const isPdf = file.type.toLowerCase().includes("pdf") || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      console.warn("Por favor selecciona un archivo PDF válido");
      return;
    }

    setDocumentos((prev) => {
      const existing = prev[key] || {};
      return {
        ...prev,
        [key]: { ...existing, pendingFile: file },
      };
    });

    try {
      event.target.value = null;
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateFileUpload = async (key, event, doc) => {
    const file = event.target.files[0];

    if (!file) {
      console.warn("No se seleccionó ningún archivo");
      return;
    }

    const isPdf = file.type.toLowerCase().includes("pdf") || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      console.warn("Por favor selecciona un archivo PDF válido");
      return;
    }

    setDocumentos((prev) => {
      const existing = prev[key] || {};
      return {
        ...prev,
        [key]: { ...existing, ...doc, archivo: file },
      };
    });
    try {
      event.target.value = null;
    } catch (error) {
      console.error("No se pudo limpiar el input de archivo:", error);
    }

    try {
      const rutaArchivo = await guardarArchivo({
        archivo: file,
        tipo_documento: "coordinaciones",
        embarque_id,
        cod_file: codFileRef.current || codFile || "",
        descripcion: doc.descripcion || undefined,
      });

      const serverDoc = doc.documentoIdCoord
        ? serverDocs.find((sd) => String(sd.documentoIdCoord) === String(doc.documentoIdCoord))
        : serverDocs.find((sd) => String(sd.tipoDocumentoId) === String(doc.tipoDocumentoId));

      if (serverDoc) {
        await actualizarDocumento({
          documento_id_coord: serverDoc.documentoIdCoord,
          embarque_id,
          cod_tipo_documento: doc.tipoDocumentoId,
          ubicacion: "coordinaciones",
          tipo_documento: "coordinaciones",
          url_archivo: rutaArchivo,
          descripcion: doc.descripcion || null,
          estado_cod: 1,
        });
        await refetchDocs();
      } else {
        await crearDocumento({
          embarque_id,
          cod_tipo_documento: doc.tipoDocumentoId,
          ubicacion: "coordinaciones",
          tipo_documento: "coordinaciones",
          url_archivo: rutaArchivo,
          descripcion: doc.descripcion || null,
          estado_cod: 1,
        });
        await refetchDocs();
      }
    } catch (e) {
      console.error("Error al actualizar el documento", e);
    }
  };

  const handleRemoveFile = (key) => {
    setDocumentos((prev) => {
      if (!prev[key]) return prev;
      return {
        ...prev,
        [key]: { ...prev[key], pendingFile: null },
      };
    });
  };

  const handleSavePendingFile = async (key) => {
    await handleSaveSingle(key);
  };

  const [editDialog, setEditDialog] = useState({ open: false, key: null, doc: null });
  const [editFile, setEditFile] = useState(null);
  const [editComment, setEditComment] = useState("");
  const [editUploadError, setEditUploadError] = useState("");

  const handleOpenEditDialog = useCallback((key, doc) => {
    setEditDialog({ open: true, key, doc });
    setEditFile(null);
    setEditComment(doc.descripcion || "");
    setEditUploadError("");
  }, []);

  const handleCloseEditDialog = useCallback(() => {
    setEditDialog({ open: false, key: null, doc: null });
    setEditFile(null);
    setEditComment("");
    setEditUploadError("");
  }, []);

  const handleEditFileAccepted = (file) => {
    setEditUploadError("");
    setEditFile(file);
  };

  const handleEditSave = async () => {
    const { key, doc } = editDialog;
    if (!editFile || !key || !doc) return;

    try {
      const rutaArchivo = await guardarArchivo({
        archivo: editFile,
        tipo_documento: "coordinaciones",
        embarque_id,
        cod_file: codFileRef.current || codFile || "",
        descripcion: editComment || undefined,
      });

      const serverDoc = doc.documentoIdCoord
        ? serverDocs.find((sd) => String(sd.documentoIdCoord) === String(doc.documentoIdCoord))
        : serverDocs.find((sd) => String(sd.tipoDocumentoId) === String(doc.tipoDocumentoId));

      if (serverDoc) {
        await actualizarDocumento({
          documento_id_coord: serverDoc.documentoIdCoord,
          embarque_id,
          cod_tipo_documento: doc.tipoDocumentoId,
          ubicacion: "coordinaciones",
          tipo_documento: "coordinaciones",
          url_archivo: rutaArchivo,
          descripcion: editComment || null,
          estado_cod: 1,
        });
      } else {
        await crearDocumento({
          embarque_id,
          cod_tipo_documento: doc.tipoDocumentoId,
          ubicacion: "coordinaciones",
          tipo_documento: "coordinaciones",
          url_archivo: rutaArchivo,
          descripcion: editComment || null,
          estado_cod: 1,
        });
      }

      await refetchDocs();
      handleCloseEditDialog();
    } catch (error) {
      console.error("Error al actualizar documento:", error);
    }
  };

  const handleDescripcionChange = (key, value) => {
    setDocumentos((prev) => {
      const existing = prev[key] || {};
      return {
        ...prev,
        [key]: { ...existing, descripcion: value },
      };
    });
  };

  const documentosConServidor = useMemo(() => {
    const baseEntries = Object.entries(documentos);
    // Documentos de servidor ya "consumidos" por un slot conocido (por
    // documentoIdCoord, no por tipo): cuando hay varios documentos con el
    // mismo tipoDocumentoId (p.ej. varios "Otros"), solo el primero encontrado
    // por el efecto de sincronización ocupa el slot conocido; el resto debe
    // seguir apareciendo como entradas extra en vez de perderse.
    const usedDocumentoIds = new Set(
      baseEntries
        .map(([_, doc]) => doc.documentoIdCoord)
        .filter((id) => id != null)
        .map(String),
    );

    // Tipos de documento que sí admiten varias instancias (el usuario puede
    // subir más de un archivo del mismo tipo). Todos los demás son slots de
    // documento único: aunque el backend tenga dos filas con el mismo
    // tipoDocumentoId (p.ej. por un doble clic al subir), solo debe mostrarse
    // una tarjeta.
    const MULTI_INSTANCE_TIPO_IDS = new Set([documentos.otros?.tipoDocumentoId]);

    // Tipos de documento que ya tienen un slot conocido con archivo subido.
    // Evita duplicar el mismo documento (p.ej. FITO con tipoDocumentoId 258)
    // cuando el servidor devuelve más de una fila para ese mismo tipo — el
    // slot ya muestra el archivo subido con el nombre correcto del servidor,
    // y la entrada extra volvería a listarlo de nuevo (p.ej. "FITO" repetido).
    const usedTypeIdsByUploadedSlot = new Set(
      baseEntries
        .filter(([_, doc]) => !!doc.urlServidor)
        .map(([_, doc]) => String(doc.tipoDocumentoId))
        .filter((id) => id !== "" && id !== "undefined"),
    );

    const extraServerEntries = serverDocs
      .filter((sd) => {
        if (usedDocumentoIds.has(String(sd.documentoIdCoord))) return false;
        if (
          sd.tipoDocumentoId != null &&
          !MULTI_INSTANCE_TIPO_IDS.has(sd.tipoDocumentoId) &&
          usedTypeIdsByUploadedSlot.has(String(sd.tipoDocumentoId))
        ) {
          return false;
        }
        return true;
      })
      .map((sd, index) => [
        `servidor_${sd.documentoIdCoord || sd.tipoDocumentoId || index}`,
        {
          nombre: sd.tipoDescripcion || `Documento ${sd.tipoDocumentoId || index}`,
          pendingFile: null,
          obligatorio: false,
          tipoDocumentoId: sd.tipoDocumentoId,
          urlServidor: sd.urlDocumento,
          descripcion: sd.descripcion || "",
          documentoIdCoord: sd.documentoIdCoord,
          codFile: sd.codFile,
        },
      ]);

    return [...baseEntries, ...extraServerEntries];
  }, [documentos, serverDocs]);

  // Un documento ya cargado en servidor debe seguir apareciendo en "Documentos
  // Subidos" aunque `visible` sea false (p. ej. MSDS cuando la clasificación de
  // carga ya no es peligrosa) — `visible` solo debe ocultar el placeholder de
  // carga pendiente, no un documento que el usuario ya subió.
  const documentosSubidos = documentosConServidor.filter(
    ([_, doc]) => !!doc.urlServidor,
  );

  const documentosObligatorios = Object.entries(documentos).filter(
    ([_, doc]) => doc.visible !== false && doc.obligatorio,
  );

  const documentosObligatoriosPendientes = documentosObligatorios.filter(
    ([_, doc]) => !doc.urlServidor,
  );

  const documentosCropaSeleccionados = useMemo(() => {
    const existingRaw = embarqueData?.json_documentos ?? null;

    if (!existingRaw) return new Set();

    try {
      const parsed = typeof existingRaw === "string" ? JSON.parse(existingRaw) : existingRaw;
      const documentosCropa = parsed ?? {};

      if (Array.isArray(documentosCropa)) {
        return new Set(documentosCropa.map(String));
      }

      return new Set(
        Object.entries(documentosCropa)
          .filter(([, checked]) => checked === true || checked === 1 || checked === "1" || checked === "true")
          .map(([key]) => String(key)),
      );
    } catch (error) {
      console.warn("No se pudo parsear json_documentos para documentos CROPA", error);
      return new Set();
    }
  }, [embarqueData]);

  const documentosCropaPendientes = useMemo(() => {
    const pendientes = CROPA_DOCS
      .filter(({ key }) => documentosCropaSeleccionados.has(String(key)) && !documentos[key]?.urlServidor)
      .map(({ key }) => [key, documentos[key]]);

    if (documentos.documento_peligrosidad?.visible && !documentos.documento_peligrosidad?.urlServidor) {
      pendientes.push(['documento_peligrosidad', documentos.documento_peligrosidad]);
    }

    return pendientes;
  }, [documentosCropaSeleccionados, documentos]);

  const totalObligatorios = documentosObligatorios.length;
  const subidosObligatorios = documentosObligatorios.filter(
    ([_, doc]) => doc.urlServidor,
  ).length;

  const isValid = subidosObligatorios === totalObligatorios;

  const handleSaveSingle = async (key, fileOverride = null) => {
    const doc = documentos[key] || documentosConServidor.find(([entryKey]) => entryKey === key)?.[1];
    const archivo = fileOverride || doc?.pendingFile;
    if (!archivo || !doc) return;

    try {
      const rutaArchivo = await guardarArchivo({
        archivo: archivo,
        tipo_documento: "coordinaciones",
        embarque_id,
        cod_file: codFileRef.current || codFile || "",
        descripcion: doc?.descripcion || undefined,
      });

      const serverDoc = doc.documentoIdCoord
        ? serverDocs.find((sd) => String(sd.documentoIdCoord) === String(doc.documentoIdCoord))
        : serverDocs.find((sd) => String(sd.tipoDocumentoId) === String(doc.tipoDocumentoId));

      if (serverDoc) {
        await actualizarDocumento({
          documento_id_coord: serverDoc.documentoIdCoord,
          embarque_id,
          cod_tipo_documento: doc.tipoDocumentoId,
          ubicacion: "coordinaciones",
          tipo_documento: "coordinaciones",
          url_archivo: rutaArchivo,
          descripcion: doc.descripcion || null,
          estado_cod: 1,
        });
      } else {
        await crearDocumento({
          embarque_id,
          cod_tipo_documento: doc.tipoDocumentoId,
          ubicacion: "coordinaciones",
          tipo_documento: "coordinaciones",
          url_archivo: rutaArchivo,
          descripcion: doc.descripcion || null,
          estado_cod: 1,
        });
      }

      await refetchDocs();

      setDocumentos((prev) => {
        const next = { ...prev };
        if (next[key]) next[key] = { ...next[key], pendingFile: null };
        return next;
      });
    } catch (error) {
      console.error("Error al guardar documento:", error);
    }
  };

  useEffect(() => {
    setDocumentos((prev) => {
      const next = { ...prev };

      if (serverDocs.length > 0) {
        for (const key of Object.keys(next)) {
          const typeId = next[key].tipoDocumentoId;
          const found = serverDocs.find(
            (sd) => String(sd.tipoDocumentoId) === String(typeId),
          );

          if (found) {
            next[key] = {
              ...next[key],
              nombre: found.tipoDescripcion || next[key].nombre,
              urlServidor: found.urlDocumento,
              descripcion: found.descripcion || next[key].descripcion,
              documentoIdCoord: found.documentoIdCoord,
            };
          } else {
            next[key] = { ...next[key], urlServidor: null, descripcion: "", documentoIdCoord: null };
          }
        }
      } else {
        for (const key of Object.keys(next)) {
          next[key] = { ...next[key], urlServidor: null, documentoIdCoord: null };
        }
      }

      return next;
    });
  }, [serverDocs]);

  const onValidityChangeRef = useRef(onValidityChange);
  onValidityChangeRef.current = onValidityChange;

  useEffect(() => {
    if (onValidityChangeRef.current) {
      onValidityChangeRef.current(isValid);
    }
  }, [isValid]);

  useEffect(() => {
    onLoadingChange?.(!embarque_id || isLoadingDocs);
  }, [embarque_id, isLoadingDocs, onLoadingChange]);

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

      <BannerInformativo
        ocultar={isLoadingDocs || isValid}
        severidad="warning"
        titulo="Documentos obligatorios pendientes"
        mensaje={`Faltan ${totalObligatorios - subidosObligatorios} documento(s) obligatorio(s) por cargar.`}
      />

      <Grid container spacing={2.5}>
        {/* Documentos Subidos */}
        {documentosSubidos.length > 0 && (
          <Grid size={12}>
            <DocumentSection
              tipo="subido"
              title="Documentos Subidos"
              count={documentosSubidos.length}
              documentos={documentosSubidos}
              colorConfig={DOCUMENT_COLORS.subido}
              handleDescripcionChange={handleDescripcionChange}
              handleFileUpload={handleFileUpload}
              handleSavePendingFile={handleSavePendingFile}
              handleRemoveFile={handleRemoveFile}
              recuperarArchivo={recuperarArchivo}
              handleEditDocument={handleOpenEditDialog}
              onRefresh={handleRefreshDocuments}
              isLoading={isLoadingDocs}
            />
          </Grid>
        )}

        {/* Documentos Obligatorios (solo si hay pendientes por subir) */}
        {documentosObligatoriosPendientes.length > 0 && (
          <Grid size={12}>
            <DocumentSection
              tipo="obligatorio"
              title="Documentos Obligatorios"
              count={documentosObligatoriosPendientes.length}
              countLabel={`${subidosObligatorios}/${totalObligatorios}`}
              documentos={documentosObligatoriosPendientes}
              colorConfig={DOCUMENT_COLORS.obligatorio}
              handleDescripcionChange={handleDescripcionChange}
              handleFileUpload={handleFileUpload}
              handleSavePendingFile={handleSavePendingFile}
              handleRemoveFile={handleRemoveFile}
              recuperarArchivo={recuperarArchivo}
              handleEditDocument={handleOpenEditDialog}
              onRefresh={handleRefreshDocuments}
              isLoading={isLoadingDocs}
            />
          </Grid>
        )}

        {/* Documentos Pendientes (CROPA) */}
        {documentosCropaPendientes.length > 0 && (
          <Grid size={12}>
            <DocumentSection
              tipo="pendiente"
              title="Documentos Pendientes"
              count={documentosCropaPendientes.length}
              documentos={documentosCropaPendientes}
              colorConfig={DOCUMENT_COLORS.pendiente}
              handleDescripcionChange={handleDescripcionChange}
              handleFileUpload={handleFileUpload}
              handleSavePendingFile={handleSavePendingFile}
              handleRemoveFile={handleRemoveFile}
              recuperarArchivo={recuperarArchivo}
              handleEditDocument={handleOpenEditDialog}
              onRefresh={handleRefreshDocuments}
              isLoading={isLoadingDocs}
            />
          </Grid>
        )} {/* documentosCropaPendientes */}
      </Grid>

      {/* Diálogo de edición */}
      <Dialog
        open={editDialog.open}
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
          {editDialog.doc && (
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
                    bgcolor: alpha(DOCUMENT_COLORS.subido.light, 0.1),
                  }}
                >
                  <Box component="span" sx={{ color: DOCUMENT_COLORS.subido.light, display: "inline-flex" }}>
                    <File size={20} />
                  </Box>
                </Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {editDialog.doc.nombre || editDialog.doc.tipoDescripcion || "Documento"}
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
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={handleCloseEditDialog} sx={{ textTransform: "none" }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleEditSave}
            disabled={!editFile}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Guardar cambios
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

DocumentosSection.propTypes = {
  embarque_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  cod_file: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onValidityChange: PropTypes.func,
  onLoadingChange: PropTypes.func,
};

export default DocumentosSection;
