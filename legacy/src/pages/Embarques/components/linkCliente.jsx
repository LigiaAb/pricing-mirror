import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  TextField,
  IconButton,
  InputAdornment,
  CircularProgress,
  Box,
  Typography,
  Button,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ActionAlertComponent from "../../../components/Dialog/ActionAlertComponent";

const CopyableLink = ({ label, value }) => {
  const handleCopy = () => {
    if (navigator.clipboard && value) {
      const sanitized = value.replaceAll('"', "");
      navigator.clipboard.writeText(sanitized);
    }
  };

  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <TextField
        fullWidth
        size="small"
        variant="outlined"
        multiline
        minRows={2}
        value={value || ""}
        slotProps={{
          htmlInput: { readOnly: true, style: { overflowY: "auto" } },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleCopy} disabled={!value}>
                  <ContentCopyIcon />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
    </Box>
  );
};

CopyableLink.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
};

const LinkClienteDialog = ({
  open,
  onClose,
  existingLink = "",
  generatedLink = "",
  isLoading = false,
  onGenerateNew,
}) => {
  const displayLink = generatedLink || existingLink;
  const justGenerated = Boolean(generatedLink) && !isLoading;
  const [enviarNotificacion, setEnviarNotificacion] = useState(true);

  return (
    <ActionAlertComponent
      openDialog={open}
      handleClose={onClose}
      tipo="success"
      titulo="Enlace para el cliente"
      activarCanecelar={false}
      onConfirm={onClose}
      textoConfirmar="Cerrar"
    >
      <Box sx={{ minWidth: 320 }}>
        {/* Link actual: si se acaba de generar uno nuevo, mostrarlo en su lugar */}
        {displayLink ? (
          <Box>
            {justGenerated && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                <CheckCircleOutlineIcon fontSize="small" color="success" />
                <Typography variant="caption" color="success.main">
                  Nuevo link generado y guardado
                </Typography>
              </Box>
            )}
            <CopyableLink label="Link actual" value={displayLink} />
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            No existe un link guardado.
          </Typography>
        )}

        {/* Generar nuevo link */}
        <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={isLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={() => onGenerateNew?.(enviarNotificacion)}
            disabled={isLoading}
          >
            {isLoading ? "Generando..." : "Generar nuevo Link"}
          </Button>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={enviarNotificacion}
                onChange={(e) => setEnviarNotificacion(e.target.checked)}
                disabled={isLoading}
              />
            }
            label="Enviar correo al cliente"
          />
        </Box>
      </Box>
    </ActionAlertComponent>
  );
};

LinkClienteDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  existingLink: PropTypes.string,
  generatedLink: PropTypes.string,
  isLoading: PropTypes.bool,
  onGenerateNew: PropTypes.func,
};

export default LinkClienteDialog;
