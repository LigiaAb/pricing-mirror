import PropTypes from "prop-types";
import { Box, Typography, alpha } from "@mui/material";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";

const DEFAULT_ACCEPT = { "application/pdf": [".pdf"] };

/**
 * Zona de carga de archivos con arrastrar-y-soltar o click, con validación de
 * tipo (PDF por defecto) y tamaño máximo vía react-dropzone.
 */
const FileDropzone = ({
  onFileAccepted,
  onRejected,
  disabled = false,
  maxSizeMB = 10,
  accept = DEFAULT_ACCEPT,
  label = "Arrastra el PDF aquí o haz clic para seleccionar",
  compact = false,
}) => {
  const maxSize = maxSizeMB * 1024 * 1024;

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles?.[0];
      if (file) onFileAccepted(file);
    },
    onDropRejected: (rejections) => {
      const reason = rejections?.[0]?.errors?.[0];
      const message =
        reason?.code === "file-too-large"
          ? `El archivo supera el tamaño máximo permitido (${maxSizeMB} MB).`
          : "Archivo no válido. Seleccione un PDF.";
      onRejected?.(message);
    },
    accept,
    maxSize,
    multiple: false,
    disabled,
  });

  return (
    <Box
      {...getRootProps()}
      sx={{
        border: "2px dashed",
        borderColor: isDragReject ? "error.main" : isDragActive ? "primary.main" : "divider",
        borderRadius: 2,
        bgcolor: (theme) =>
          isDragActive
            ? alpha(theme.palette.primary.main, 0.06)
            : alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.04 : 0.025),
        px: 2,
        py: compact ? 1.25 : 3,
        textAlign: "center",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: "border-color 0.15s ease, background-color 0.15s ease",
        "&:hover": disabled
          ? undefined
          : {
              borderColor: "primary.main",
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
            },
      }}
    >
      <input {...getInputProps()} />
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
        <Box component="span" sx={{ color: "text.secondary", display: "inline-flex", opacity: 0.8 }}>
          <UploadCloud size={compact ? 20 : 28} />
        </Box>
        <Typography variant={compact ? "caption" : "body2"} fontWeight={500}>
          {isDragActive ? "Suelta el archivo aquí..." : label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Solo PDF · Máximo {maxSizeMB} MB
        </Typography>
      </Box>
    </Box>
  );
};

FileDropzone.propTypes = {
  onFileAccepted: PropTypes.func.isRequired,
  onRejected: PropTypes.func,
  disabled: PropTypes.bool,
  maxSizeMB: PropTypes.number,
  accept: PropTypes.object,
  label: PropTypes.string,
  compact: PropTypes.bool,
};

export default FileDropzone;
