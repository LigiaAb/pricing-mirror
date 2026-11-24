import React from "react";
import PropTypes from "prop-types";
import { Drawer, Grid, Icon, IconButton, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export const SideBarPublico = ({ open = false, onClose }) => {
  const navigate = useNavigate();

  const handleClose = (ev) => {
    ev.preventDefault ? ev.preventDefault() : null;
    onClose(false);
  };

  return (
    <Drawer anchor="left" open={open} onClose={handleClose}>
      <Grid width="100%" container direction="column">
        <Grid sx={{ p: 1, bgcolor: "primary.main" }} width="100%" container direction="row">
          <Grid size="auto">
            <Typography
              sx={{ cursor: "pointer" }}
              onClick={() => {
                navigate("/public");
                onClose(false);
              }}
              lineHeight={1}
              className="c-cropa-dsv"
              fontSize={50}
              color="white.main"
              m={0}
              px={2}
            />
          </Grid>
          <Grid size="grow"></Grid>
          <Grid>
            <IconButton onClick={handleClose} size="small" color="white">
              <Icon className="c-x1" size="xs" />
            </IconButton>
          </Grid>
        </Grid>
        {/* Contenido vacío para rutas públicas */}
        <Grid sx={{ p: 2 }} size="auto">
          <Typography variant="body2" color="text.secondary">
            Formularios Públicos
          </Typography>
        </Grid>
      </Grid>
    </Drawer>
  );
};

SideBarPublico.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};

export default SideBarPublico;

