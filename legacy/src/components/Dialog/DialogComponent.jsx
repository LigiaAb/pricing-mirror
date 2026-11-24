import React, { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { AppBar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Icon, IconButton, Typography } from "@mui/material";

const DialogComponent = (props) => {
  const { openDialog, open, handleClose, setOpen, titulo, content, children, width = "fit-content", height = "fit-content", sx ={dialog: {}, container: {}} } = props;
  const isOpen = useMemo(() => open || openDialog, [open, openDialog]);
  const hadleSetClose = useCallback(() => {
    if (handleClose) {
      handleClose(false);
    } else if (setOpen) {
      setOpen(false);
    }
  }, [handleClose, setOpen]);

  const botones = useMemo(
    () => [
      {
        color: "red",
        onclick: (ev) => {
          ev.preventDefault();
          hadleSetClose();
        },
      },
    ],
    [hadleSetClose]
  );

  return (
    <Dialog
      fullScreen
      open={isOpen || false}
      onClose={hadleSetClose}
      PaperProps={{
        sx: { width, height, borderRadius: "8px" },
        ...(sx.dialog || {})
      }}
    >
      {/* Aplica un margen alrededor de todo el contenido */}
      <DialogTitle>
        <Grid container columnSpacing={1} sx={{ m: 0, p: "10px", width: "100%", }}>
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
                onClick={i.onclick}
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
            {titulo}
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
      </DialogTitle>
      <DialogContent sx={{ p: 0, m: 0 }}>
        <Box sx={{ p: 2, maxHeight: "90vh", ...(sx.container || {}) }}>{content || children}</Box>
      </DialogContent>
    </Dialog>
  );
};

DialogComponent.propTypes = {
  openDialog: PropTypes.bool,
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  setOpen: PropTypes.func,
  titulo: PropTypes.string,
  content: PropTypes.any,
  children: PropTypes.node,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  sx: PropTypes.object,
};

export default DialogComponent;
