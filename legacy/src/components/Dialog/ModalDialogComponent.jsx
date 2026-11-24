import React from "react";
import PropTypes from "prop-types";
import { Grid, AppBar, Box, Dialog, DialogContent, DialogTitle, Icon, IconButton } from "@mui/material";

const ModalDialogComponent = (props) => {
  const { openDialog, handleClose, titulo, tabla, formulario, width = "fit-content", height = "fit-content" } = props;
  return (
    <Dialog fullScreen open={openDialog} onClose={handleClose} PaperProps={{ sx: { width, height, maxWidth: "80vw", borderRadius: 1 } }}>
      <DialogTitle>
        <AppBar position="sticky" sx={{ p: 0.5, boxShadow: "none", bgcolor: "transparent" }}>
          <Grid container sx={{ m: 0, p: 0 }}>
            <Grid size="grow" sx={{ m: 0, p: 0 }}></Grid>
            <Grid sx={{ m: 0, p: 0 }}>
              <IconButton sx={{ m: 0, p: 0, color: "primary.main" }} onClick={handleClose}>
                <Icon sx={{ m: 0, p: 0, color: "primary.main" }} className="c-x1" size="small" />
              </IconButton>
            </Grid>
          </Grid>
        </AppBar>
      </DialogTitle>
      <DialogContent sx={{ p: 0, m: 0 }}>
        <Grid container>
          <Grid size={{ md: formulario ? 6 : 12, xs: 12 }}>{tabla}</Grid>
          <Grid size={{ md: tabla ? 6 : 12, xs: 12 }}>{formulario}</Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

ModalDialogComponent.propTypes = {
  openDialog: PropTypes.bool,
  handleClose: PropTypes.func,
  titulo: PropTypes.string,
  tabla: PropTypes.node,
  formulario: PropTypes.node,
  width: PropTypes.string,
  height: PropTypes.string,
};

export default ModalDialogComponent;
