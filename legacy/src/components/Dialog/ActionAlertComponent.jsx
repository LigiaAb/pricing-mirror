import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { AppBar, Button, Dialog, DialogContent, DialogTitle, Grid, Icon, IconButton, Toolbar } from "@mui/material";
import { useSelector } from "react-redux";

const ActionAlertComponent = (props) => {
  const {
    openDialog,
    handleClose,
    titulo,
    content,
    tipo,
    children,
    width = "fit-content",
    height = "fit-content",
    aceptar,
    cancelar,
    activarAceptar = true,
    activarCanecelar = true,
    onConfirm,
    onCancel,
    textoConfirmar = "Sí, Eliminar",
  } = props;

  const [botones, setBotones] = useState([{ color: "red", onclick: (ev) => handleClose(ev) }]);
  const { themeMode } = useSelector((state) => state.theme);

  // Auto-close for success messages when onConfirm is not provided
  useEffect(() => {
    if (openDialog && tipo === "success" && !onConfirm && typeof handleClose === "function") {
      const timer = setTimeout(() => {
        handleClose();
      }, 3000); // Auto-close after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [openDialog, tipo, onConfirm, handleClose]);

  // Determine if we should show both buttons or just one
  const shouldShowBothButtons = onConfirm || onCancel;
  const shouldShowOnlyAccept = !onConfirm || tipo === "success";

  return (
    <Dialog
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (onConfirm) onConfirm();
          else if (aceptar) aceptar();
        } else if (e.key === "Escape") {
          e.preventDefault();
          if (onCancel) onCancel();
          else if (cancelar) cancelar();
          else if (typeof handleClose === "function") handleClose();
        } else return;
      }}
      fullScreen
      open={openDialog}
      onClose={typeof handleClose === "function" ? handleClose : undefined}
      PaperProps={{ sx: { width, height, minWidth: "250px", maxWidth: "80vw", borderRadius: 2 } }}
    >
      <Grid container columnSpacing={1} sx={{ m: 0, p: "10px", width: "100%" }}>
        {botones.map((i) => (
          <Grid key={i.color} sx={{ m: "4px", py: 0.2, pt: 0 }} size={"auto"}>
            <Grid
              sx={{
                bgcolor: `${i.color}.500`,
                alignItems: "center",
                width: "10px",
                height: "10px",
                p: 0.9,
                borderRadius: "50%",
                cursor: "pointer",
                "&:hover": {
                  boxShadow: `inset 1px 1px 1px 0px rgba(255, 255, 255, 0.1), inset -1px -1px 1px 0px rgba(255, 255, 255, 0.3),
                             0px 0px 2px 0.3px rgba(0, 0, 0, 0.3)`,
                  width: "10px",
                  height: "10px",
                  p: 0.9,
                },
              }}
              onClick={(ev) => {
                if (typeof handleClose === "function") handleClose(ev);
              }}
            ></Grid>
          </Grid>
        ))}
        <Grid
          size={"grow"}
          sx={{
            py: 0.2,
            textAlign: "center",
            borderBottomColor: `rgba(0, 0, 0, 0.1)`,
            borderBottomStyle: "solid",
            borderBottomWidth: 2,
          }}
        >
          {titulo || (tipo === "success" ? "Éxito" : tipo === "warning" ? "Atención" : tipo === "error" ? "Error" : tipo === "info" ? "Información" : tipo === "help" ? "Ayuda" : "Error")}
        </Grid>
        <Grid size={{ m: "4px", p: "0 4px" }}>
          <Grid
            sx={{
              bgcolor: `transparent`,
              alignItems: "center",
              width: 10,
              height: 10,
              padding: 0.9,
              borderRadius: "50%",
            }}
          ></Grid>
        </Grid>
      </Grid>
      <DialogContent sx={{ p: 0.5, m: 0, mt: 0 }}>
        <Grid container direction="row">
          <Grid
            size={2}
            sx={{
              color: tipo === "success" ? "success.dark" : tipo === "warning" ? "orange.main" : tipo === "error" ? `error.${themeMode}` : `primary.${themeMode}`,
              textAlign: "center",
              width: 60,
              height: 60,
              borderRadius: "50%",
              p: 1,
              position: "relative",
            }}
            alignContent="center"
          >
            <Icon
              sx={{ m: 0, p: 0, fontSize: 45, top: 8, left: 7, position: "absolute" }}
              className={
                tipo === "warning" ? "c-alerta" : tipo === "error" ? "c-error" : tipo === "success" ? "c-cuadrado-cheque" : tipo === "info" ? "c-informacion" : tipo === "help" ? "c-ayuda" : "c-error"
              }
              size="small"
            />
          </Grid>
          <Grid container size="grow" sx={{ pb: 1, px: 1 }}>
            <Grid size={12} sx={{ minHeight: "1em" }}>
              {children || content}
            </Grid>
            <Grid container size={12} columnSpacing={1} sx={{ pt: 0.5 }}>
              <Grid size="grow"></Grid>
              {activarAceptar && (
                <Grid size="auto" sx={{ display: !activarAceptar ? "none" : undefined }}>
                  <Button variant="contained" size="small" color="primary" onClick={onConfirm || aceptar || (typeof handleClose === "function" ? handleClose : undefined)}>
                    {onConfirm ? textoConfirmar : "Aceptar"}
                  </Button>
                </Grid>
              )}
              {activarCanecelar && shouldShowBothButtons && !shouldShowOnlyAccept && (
                <Grid size="auto">
                  <Button variant="contained" size="small" color="error" onClick={onCancel || cancelar}>
                    Cancelar
                  </Button>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

ActionAlertComponent.propTypes = {
  openDialog: PropTypes.bool,

  textoConfirmar: PropTypes.string,

  handleClose: PropTypes.func,
  aceptar: PropTypes.func,
  cancelar: PropTypes.func,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,

  titulo: PropTypes.string,
  content: PropTypes.any,
  children: PropTypes.node,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  height: PropTypes.string,

  tipo: PropTypes.oneOf(["success", "warning", "error", "alert", "info", "help"]),

  activarAceptar: PropTypes.bool,
  activarCanecelar: PropTypes.bool,
};

export default ActionAlertComponent;
